# WWDC21 - 10254  Swift 并发编程：原理探究

> 作者：jojotov, iOS 开发，SwiftGG 翻译组成员，目前任职字节跳动，负责抖音直播客户端相关工作。
>
> 审核：四娘，iOS 开发，老司机技术周报成员。目前就职于格隆汇，对 Swift 和编译器相关领域感兴趣

> 本文基于 [Session 10254 - Swift concurrency: Behind the scenes](https://developer.apple.com/videos/play/wwdc2021/10254/) 整理

## 概览

在 WWDC 2021 中，Swift 迎来了一次重要的版本更新 —— Swift 5.5。Swift 的此次更新为 Swift 并发编程带来了非常大的改变，通过 `async/await`（[SE-0296](https://github.com/apple/swift-evolution/blob/main/proposals/0296-async-await.md)）、Structured concurrency（[SE-0304](https://github.com/apple/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)）以及 Actors （[SE-0306](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md)），Swift 让开发者可以在更抽象的层面上思考并发场景的解决方式，同时保障了并发场景下的性能和安全性，避免了使用 GCD 等传统并发模型时可能出现的多线程问题。

为了更好地理解 Swift 并发模型所解决的问题以及其背后的原理，本 Session 将通过一个开发新闻浏览 App 的例子，探究 Swift 并发模型的实现原理，以及使用 Swift 并发模型编码过程中，如何获得更好的性能和效率。

> 如果你对 Swift 并发编程模型还不够了解，可以先查阅相关 Session：
>
> - [Session 10132 - Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132)
> - [Session 10133 - Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133)
> - [Session 10134 - Explore structured concurrency in Swift](https://developer.apple.com/videos/play/wwdc2021/10134)



## 一个实际例子 —— 新闻信息流 App

在正式进入 Swift 并发编程的世界之前，首先假设一个可能的业务场景 —— 新闻信息流 App，包含拉取最新新闻并缓存本地、展示新闻标题和内容等功能。在这样一个场景中，我们尝试简单地构造一下整体架构，可以梳理出大概三个模块：UI 模块、数据库模块（用于缓存已拉取到的新闻）、网络模块（用于拉取最新的新闻）

其中，我们会给 Database 模块分配一个 GCD 串行队列（Serial queue），以保证数据库在子线程准确更新，同时给 Networking 模块分配一个并行队列（Concurrent queue），用于同时发起多个新闻类别的请求：

![](https://images.xiaozhuanlan.com/photo/2021/e9335b89033e1888ecb7ebb89d155b08.png)

接下来，我们会尝试编写一个简单的功能：用户在手机屏幕上触发刷新，请求最新的新闻后缓存到本地，然后刷新 UI 展示给用户：

![](https://images.xiaozhuanlan.com/photo/2021/c4236a9ce7289d2a2b38b91d7417ebd0.png)

1. 根据需要拉取的新闻类别（`feedsToUpdate`），通过 `URLSession` 发起等同数量的网络请求
2. 在网络请求成功后，通过 `databaseQueue.sync { ... }` 往数据库串行队列加入一个同步任务，来保障数据库可以立即更新
3. 数据库更新完后通知主线程刷新 UI

至此，我们已经初步编写完相关的代码，实现了一个新闻拉取、缓存并展示的功能，但上面简单的代码中，可能隐藏着一些难以察觉的性能问题，

## 使用 GCD 可能出现的问题

根据 GCD 队列的原理，当我们向一个异步队列加入任务时（调用 `DispatchQueue.sync()` 或者 `DispatchQueue.asnyc()`），CPU 会创建若干个线程来执行这些任务，直到所有的 CPU 核心都被占用。假设我们目前有两个 CPU 核心，如果其中一个 CPU 核心的线程被阻塞，这个 CPU 核心会创建一个新线程来尝试继续执行其他任务。这里的原因有二：

- 每个 CPU 核心都需要当前有一条活跃线程，以保证能够在任意时间执行任意任务，以此来保障系统的性能。
- 当一条线程被阻塞时，它可能正在等待一些共享资源释放，而新创建的线程可以继续执行当前队列中的任务，从而帮助释放这些共享资源。

![线程阻塞（2 个 CPU 核心）](https://images.xiaozhuanlan.com/photo/2021/b927d6cd628e46aebdc7eeb28debded8.png)

结合我们的新闻 App，我们可以设想一下执行上文中的代码时 CPU 的情况（以 2 个 CPU 核心为例）：

1. CPU 创建两条线程来执行新闻信息流拉取
2. 当其中一个拉取任务完成时，触发数据库存储的同步任务（`queue.sync()`），此时当前线程被阻塞
3. 由于还有其他未完成的新闻拉取任务，CPU 会创建更多新的线程来执行这些任务
4. 新闻拉取任务执行完成，重复步骤 2；

由此可见，如果需要拉取的数据类别很多，且数据库存储的任务耗时较久，我们可能会面临多个线程同时被阻塞的情况，因此 CPU 会不断创建新的线程来执行剩余未完成的新闻拉取任务，最终导致了**线程爆炸**。

![线程爆炸（2 个 CPU 核心）](https://images.xiaozhuanlan.com/photo/2021/4d4f7488792345b528ca5fc0b0610a21.png)

虽然线程爆炸并不会直接影响应用的可用性，但当线程的数量非常多，远远超过了 CPU 核心数量的时候，我们可能会面临一些性能问题：

- 内存占用升高
- 线程调度损耗
- 线程上下文切换损耗

> 关于如何在使用 GCD 时尽量避免类似的问题，可以参考过往的一些 Session：
>
> - [WWDC17 - Modernizing Grand Central Dispatch Usage](https://developer.apple.com/videos/play/wwdc2017/706/) 
> - [WWDC15 - Building Responsive and Efficient Apps with GCD](https://developer.apple.com/videos/play/wwdc2015/718/)

## 使用 Swift 并发模型

在上述的例子中，我们了解到使用 GCD 可能带来的线程爆炸问题，那么如果使用 Swift 并发模型，我们可以把线程问题优化到什么程度呢？答案是通过 Swift 的并发模型，我们可以完全避免线程数量过多的问题，理论上使得线程数保持与 CPU 核心数量相同。

![](https://images.xiaozhuanlan.com/photo/2021/1e0e15d7c1bd608a0f21b32f655d4a69.png)

我们可以看到，优化之后的线程数量降低为 2 个，取而代之的是 Continuation 的概念，这是 Swift 在线程之上抽象出的更高级的并发概念，与线程相比它具有显著的性能优势：没有上下文切换损耗，Continuation 之间的切换仅需一次函数调用的成本。

> 合理使用 Swift 并发模型，可以把线程控制在与 CPU 核心数相等的数量，同时极大程度地降低了在多个任务切换时的损耗。

Swift 并发模型的设计理念，是为了保证在运行时控制线程的数量，在理想状态下使线程数量不超过 CPU 核心数量，而 Swift 引入的结构化并发模型，例如`async/await`、Task Group、Actors 等特性，都可以帮助我们完成此目标。

### `async/await`

基于我们的新闻 App，我们尝试使用 Swift 并发模型来改写新闻刷新的逻辑。首先，标记 `updateDatabase()` 函数为 `async` ，并在调用处增加 `await` 标识：

![](https://images.xiaozhuanlan.com/photo/2021/0fa76e549eb1a398de9ae815db1d15c9.png)


如此以来，我们使用 `async/await` 代替了原本的 `DispatchQueue.sync`，达到了不阻塞线程的目的，而这部分工作，完全是由 Swift 运行时来完成，对于开发者来说，我们需要做的仅仅是调用方式的改变。

> 更多关于 `async/await` 的使用，请参考 [Session 10132 - Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132)

为了了解 `async/await` 是如何工作的，首先我们先回顾一下同步函数的调用方式：

- 每个线程中都有其各自的函数栈
- 当在某个线程调用一个函数时，会将此函数帧压入栈中，函数帧保存着函数的必要信息和局部变量等
- 当函数调用完成并返回时，此函数帧会从栈中弹出

那么，`async` 标记的异步函数是如何调用的呢？这里我们会通过一个用于更新数据库的 `updateDatabase()` 函数来详细探究一下异步函数在堆栈中的情况：

> 异步函数在调用时，会同时在栈和堆中各增加一个函数帧，栈中保存只在函数内部使用的局部变量等内容，而一些异步相关的内容，例如`await` 标记的地方（称为**挂起点 *suspension point***），则保存在堆中。

1. 调用 `updateDatabase()` 函数时，其内部调用了 `add()` 函数，此时函数栈中会压入 `add()` 函数帧（这里只考虑从 `updateDatabase()` 开始的函数栈，忽略之前的调用），而 `add()` 函数中一些局部变量，例如 `(id, article)` 都会一并保存在栈帧中

	![](https://images.xiaozhuanlan.com/photo/2021/4c5ac0d120837013569e385430d7f9b1.png)

2. `add()` 函数内部调用了另一个异步函数 `database.save()`，并使用 `await` 标记，因此这里会形成一个**挂起点（suspension point）**，这部分相关的信息不会保存到栈帧中，而是保存在堆中（例如 `newArticles` 变量，在挂起点之前定义，且在挂起点之后也需要使用）

    ![](https://images.xiaozhuanlan.com/photo/2021/e054f2c36e756b4cf9b8f29d3f1bea56.png)

3. 在 `database.save()` 调用时，线程当前函数栈中的 `add()` 会被直接替换为 `save()`。由于异步函数所需要的相关信息，已经在堆中保存，因此我们不需要像平时调用一个同步函数时一样直接压入栈，而是可以直接替换当前栈顶的栈帧

   ![](https://images.xiaozhuanlan.com/photo/2021/cc97eae63d84352123c0b478f211fc49.png)

4. 假设 `save()` 函数中由于数据库资源未释放，需要暂时挂起等待，此时会形成一个**延续点（Continuation）**，这部分信息同样会保存在堆上，因此当前线程可以继续执行其他任务，保证线程不会阻塞

   ![](https://images.xiaozhuanlan.com/photo/2021/9be9e0aca6a10dbfc3ba22290d72d2fe.png)

5. 假设在一段时间后，数据库资源可用，此时 `save()` 可以继续执行，此时 `save()` 会被替换到某个线程的函数栈栈顶（不一定是原本的线程，可能是任意可用的线程）

   ![](https://images.xiaozhuanlan.com/photo/2021/faf3d160166ab146f44e9f86d49d47f8.png)

6. 最后，`save()` 执行完成，此时栈顶会被替换为之前的 `add()` 函数，并继续执行后续的同步函数

   ![](https://images.xiaozhuanlan.com/photo/2021/7f4887f595b0a136f5462947fd06e63f.png)



至此，一个 `async/await` 的调用过程结束，我们可以从其调用过程中的堆栈情况看到，Swift 引入了延续点（Continuation）的概念，来保证线程的可持续使用，避免了由于线程阻塞导致的线程数量膨胀和线程上下文切换带来的额外开销，从而达到 Swift 并发模型的极致目标：**线程数量等同于 CPU 核心数量。**

### Task group

Task 和 Task group 是 Swift 并发模型中引入的另一个抽象概念，Task 可以包含一系列的异步操作，例如一段包含 `async/await` 的代码，Task group 可以包含一系列的 Task。

在一个 Task 中，我们会包含两个部分：**挂起点（Suspension point）**和**延续点（Continuation）**，这两部分的标识是 `await` 关键字，`await` 所标记的位置，会被 Swift 编译器判定为一个潜在的挂起点，而 `await` 后面的部分，必定会在挂起点执行完毕后才行（由运行时决定），因此这部分会被称为延续点。

![](https://images.xiaozhuanlan.com/photo/2021/5baa7fc600d4612fc1f1c1864e43500b.png)

同样，在一个 Task group 中，可能会包含多个子 Task，而每个 Task 必定会在上一个 Task 执行完成后才会执行。

![](https://images.xiaozhuanlan.com/photo/2021/b65f7ddcb1e016ee252525587e4f18e0.png)

> Task 中的依赖关系和 Task 之间的依赖关系，都是由代码显式定义的，因此 Swift 可以在编译期判断出这些依赖关系并严格执行。
>
> 更多关于 Task 以及 Task group 的内容，请参阅：
> - [Session 10134 - Explore structured concurrency in Swift](https://developer.apple.com/videos/play/wwdc2021/10134)
> - [The Swift Programming Language: Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html#ID642)
> - [Task Group | Apple Developer Document](https://developer.apple.com/documentation/swift/taskgroup)

## 运行时约定

Swift 并发模型的最终目标是为了保证线程数量不超过 CPU 核心数量，为了达成此目标，苹果的工程师和其他开发者都需要遵循一定的原则：保证线程可持续执行，不被阻塞。这个原则被称为**运行时约定（Runtime Contract）**。

在 Swift 和操作系统的更新中，苹果提供了一个新的线程池：协作式线程池（Cooperative thread pool），并作为 Swift 并发模型的默认线程调度器。通过协作式线程池，Swift 在运行时就可以保障线程不会被阻塞，且避免了线程爆炸时出现的性能问题，从而达到线程数里不超过 CPU 核心数量的目标。

![](https://images.xiaozhuanlan.com/photo/2021/67b431eff76f3578d93e7a6932c19895.png)

之前的 WWDC 中，[WWDC17 - Modernizing Grand Central Dispatch Usage](https://developer.apple.com/videos/play/wwdc2017/706/) 和 [WWDC16 - Concurrent Programming With GCD in Swift 3](https://developer.apple.com/videos/play/wwdc2016/720) 都曾讨论过如何改善 GCD 的使用，从而尽量避免多线程性能问题，这些讨论都建议开发者需要遵守一定的规则来使用 GCD，例如在系统的每个子模块中最多使用一个 GCD 串行队列。

在 Swift 并发模型中，这些约定和规范都下沉到了 Runtime 层面（Swift 运行时默认保证了线程数量的限制），**也就是说，当我们使用 Swift 结构化并发模型中的语言特性进行开发时，我们无需在代码层面上过多地关注多线程性能问题。**


## 如何使用 Swift 并发模型

与使用 GCD 进行并发编程相比，Swift 提供的并发模型在性能、开发效率和代码可维护性都有非常大的提升，但这并不代表我们在开发过程中可以完全不加思索地去使用并发模型进行编程。

接下来我们会围绕几个部分，讨论开发过程中，如何更好地使用 Swift 并发模型：

- 并发编程中的性能问题
- `await` 导致原子性被破坏
- 遵循运行时约定

### 性能

前面我们提到了并发编程相关的损耗，例如额外的内存占用和运行时逻辑，虽然 Swift 并发模型在性能上有较大优化，但仍然会存在内存损耗和运行时效率损耗，因此我们在考虑是否需要引入并发编程时，必须优先考量**性能上的收益是否远大于损耗**。

![](https://images.xiaozhuanlan.com/photo/2021/7eec45afaaac10bc6673cc79f6f73649.png)

举一个简单的例子，上述代码完成了一次 UserDefault 的存储，对于一个如此简单的行为，如果我们加上 `async/await` 使其变为一次并发操作，其带来的收益可能并不会大于引入的并发损耗，因为 UserDefault 的存储损耗非常小，引入并发编程所带来的额外损耗会完全抵消，甚至超过原本同步操作的性能损耗。因此，*Profile your code* 十分重要！

### `await` 导致原子性被破坏

使用 `await` 特性会破坏代码的原子性，是另外一个需要我们额外注意的问题。在之前对 `async/await` 的原理讨论中我们了解到，加入了 `await` 的异步函数，并不能保证与调用它的函数在同一线程执行，同样，在 `await` 返回后的代码也无法保证在同一线程执行，因此我们需要在任何加入了 `await` 的地方避免以下行为：

- 在 `await` 前加锁
- 在 `await` 前后访问线程私有数据

> 注：上述提到的行为都是基于 `await` 前后的代码不保证在同一线程执行，同时需要遵循线程可持续执行的原则，因此可以理解为我们必须避免在使用 `await` 时增加任何可能阻塞线程的行为。



### 遵循运行时约定

在使用 Swift 并发模型进行编码时，我们需要时刻保证我们的代码不会破坏 Swift 并发模型的运行时约定，即保证线程的可持续执行。

- **绝对安全类型：**`await`、Actors 和 Task group 等 Swift 结构化并发模型特性。由于使用这些类型时，我们的代码直接显式定义了其依赖关系，所以在 Swift 可以在编译期得到这些依赖关系，并在运行时能给合理地调度线程，因此我们可以放心使用这些类型。

- **需要小心使用的安全类型：** `os_unfair_lock`、`NSLock`。在 Swift 并发模型中使用锁也是安全的，但由于编译器并不支持对使用锁的代码做特殊处理，因此我们在使用时需要进行充分的考量。这里我们区分同步和异步两种场景：同步场景下，使用锁是绝对安全的，因为在同步场景下，持有锁的线程，必定会继续执行任务并释放锁，因此并不违法 Swift 并发模型的运行时约定；异步场景下，如果持有锁的线程只会阻塞比较短的时间，那这种场景下也可以认为此线程是可继续执行任务的。

- **不安全类型：**`DispatchSemaphore`、`pthread_cond`、`NSCondition` 以及 `pthread_rw_lock` 等。使用这些并发类型时，其依赖关系并不会在代码中显式声明，而是在代码执行时才可以确定，因此 Swift 运行时无法判断在这些场景中，应该如何调度线程，因此使用这些不安全类型，并不能保证线程可持续执行任务。
	
	
	
  ![](https://images.xiaozhuanlan.com/photo/2021/e4f7a844e8e4855841cbf496824e02a0.png)
	
	例如，在上图的代码中，我们无法确定信号量会在哪个线程被释放，因此这种类型的代码违背了 Swift 并发模型的运行时约定，无法保证线程可以持续执行任务不被阻塞。

> 在 debug 模式下时增加环境变量 `LIBDISPATCH_COOPERATIVE_POOL_STRICT=1` 可以开启强制使用协作式线程池，如果代码运行中出现不完全类型和 Swift 并发模型同时使用的情况，会立即触发 `semaphore_waite_trap`。



## 使用 Actors 进行同步操作

[Actors](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html#ID645) 是 Swift 并发模型中新增的语言特性，与 Class 一样，Actor 也是基本类型，并且为引用类型。Actors 最重要的一个特性是，任何 Actors 类型中的可变状态，在同一时间只运行一个任务（Swift 结构化并发模型中的 Task 概念）访问，也就是说 Actors 本身不允许并发访问，避免了资源竞争（Data Races）的多线程问题。

> 在访问 Actors 的可变状态时，我们需要增加 `await` 关键字，因为任何访问 Actors 中可变状态的操作，都有可能形成一个挂起点（suspension point）。

### Actors 中的互斥

由于访问 Actors 中可变状态的操作本身是互斥的，因此我们可以理解 Actors 是一个自带互斥锁的基本类型。

为了更好地了解 Actors 的优势及原理，我们首先对比 GCD 串行队列、锁和 Actors 在存在竞争（Under contention）和非竞争（No Contention）场景下的优劣：

![](https://images.xiaozhuanlan.com/photo/2021/194a69866fab18135319a1a02561027b.png)

- 使用锁或者 GCD 串行队列的同步操作时，在存在竞争的场景下（调用 `queue.sync` 的线程有正在执行的任务）会阻塞当前线程。
- 使用 GCD 串行队列的异步操作时，虽然在存在竞争的场景下不会阻塞当前线程，但在非竞争的场景下（调用 `queue.async` 的线程有没有任务需要执行），也会创建新的线程来进行异步操作，以此保证当前线程可以继续执行其他任务。
- 在协作式线程池的帮助下，使用 Actors 可以保证既不会创建多余的线程，也不会在阻塞当前线程。

### Actor hopping

接下来，我们还是回到新闻信息流 App 的场景下，深入了解 Actors 是如何运作的。在这个场景中，我们先聚焦于数据库模块和网络模块，之前的例子中，它们内部都有一个串行或并行的 GCD 队列，现在我们需要把网络模块的异步队列替换为一系列 Actor（以新闻类别为维度区分，例如 Sports feed actor 和 Weather feed actor），并把数据库模块的同步队列替换为 Database Actor：

![](https://images.xiaozhuanlan.com/photo/2021/903186e14b964c4940131694792bc970.png)


当我们需要请求最新的新闻信息流，并保存到数据库时，各类别的 feed actor 会首先开始工作，并在完成后直接与数据库 actor 进行交互，把信息流保存在数据库中。这种 actor 之间的交互发生在协作式线程池中，称之为 **Actor hopping。**

> 注：Actor hopping 可以理解为线程在不同 actor 之间跳跃地执行任务，并由协作式线程池来完成调度。理解这个行为，可以帮助我们更好地理解 Swift 并发模型中的协作式线程池（Cooperative thread pool）是如何让不同线程进行 “协作” 的。

那么，Actor hopping 背后究竟是如何工作的呢？我们假设第一个完成的任务是 Sports feed actor（S1），此时 S1 会调用 `database.save` 来进行数据存储，假设此时数据库处于空闲状态（非竞争状态的场景），那么当前线程会直接跳到 Database actor 去执行任务（D1）。

![](https://images.xiaozhuanlan.com/photo/2021/3cc833d0d7bec00eba1705e74411feba.png)

> 这里我们需要注意两点：
>
> 1. 线程并没有因为调用 `database.save` 这个同步任务而被阻塞
> 2. 调用另一个 actor 并不会创建新的线程，而是将当前正在执行的 sports feed actor 任务暂时挂起，创建一个新的任务来执行 database actor

接下来，假设 Database actor 运行了一段时间，但还未完成当前的存储任务，此时 Weather feed actor 的任务（W1）刚好执行完毕，并同样调用了 `database.sync` 来进行本地存储，那么运行时会创建一个新的 Database actor 任务 D2，但由于同一个 actor 在同一时间最多只能执行一个任务，D2 并不会立即执行，而是处于等待的状态。

![](https://images.xiaozhuanlan.com/photo/2021/76f430285029e2d12106a933dbe53f48.png)

同样，由于 Weather feed 需要等待 `database.sync` 操作完成，因此 W1 也会和 S1 一样暂时挂起，而当前执行 W1 任务的线程会跳到 Health feed actor 执行任务 H1。

![](https://images.xiaozhuanlan.com/photo/2021/ff94f152962f09f7b8b08133cc32498c.png)



### Actor 的可重入性和优先级关系

假设在上面的例子中，我们的程序继续运行了一段时间，这时数据库存储任务 D1 执行完毕，这条线程此时会有三种选择：

- 执行数据库任务 D2
- 执行 Sports feed actor 任务 S1
- 执行 Weather feed actor 任务 W1

![](https://images.xiaozhuanlan.com/photo/2021/23dde0c60df1ddf93295e3500b75f68a.png)

这引入了另一个问题——线程需要以某种规则来决策此时应选择跳到哪一个任务去执行。理论上，我们必须要做一定的取舍，优先执行更为重要的任务，例如涉及 UI 刷新的任务，而一些后台任务则不需要立即执行。

在探究 Swift 并发模型如何解决优先级问题之前，我们先回顾一下 GCD 在类似的场景下是如何运作的。假设我们有一个串行队列 databaseQueue ，并加入两种的任务——涉及 UI 的高优先级任务 `fetchLatestForDisplay()` 以及低优先级的后台备份任务 `backUpToiCloud()`。

![](https://images.xiaozhuanlan.com/photo/2021/6e663aa5c8903d59187c52ebbb954486.png)

在我们加入一定数量的任务后，可以看到队列中的现在有两个 UI 相关的高优先级任务 A 和 B，同时还有 7 个低优先级的后台备份任务 1-7。

当 A 任务执行完成后，由于 GCD 串行队列严格遵循 FIFO，因此下一个执行的任务是后台任务 1，再下一个是后台任务 2……此时，下一个高优先级任务 B 只能等待后台任务 1 到后台任务 5 全部执行完成后才可以开始——我们通常称这种情况为 [优先级反转（Priority Inversion）](https://zh.wikipedia.org/wiki/%E4%BC%98%E5%85%88%E8%BD%AC%E7%BD%AE)。

回到 Swift 并发模型中，Actor 是如何解决优先级的问题呢？我们继续回顾新闻信息流获取的例子，假设某个线程当前正在执行  Database actor 的一个 `database.save` 任务 D1，在执行到某个节点时，Database actor 需要等待某些资源释放，因此被暂时挂起，而当前线程则跳到 Sports feed actor 执行任务 S1。

![](https://images.xiaozhuanlan.com/photo/2021/508738c209cee648bb8d339e8eec14b2.png)

线程继续运行了一段时间后，S1 任务执行完成，此时 S1 同样也调用了 `database.save` 进行本地存储，从而触发了 Database actor 的一个新任务 D2，虽然 Database actor 当前还有一个暂时挂起的任务 D1（假设 D1 所需的资源还未释放），但它仍然可以创建新的任务 D2 并在当前线程立即执行。

![](https://images.xiaozhuanlan.com/photo/2021/7b8de652eea5bdca4a78fc0036ebd0b9.png)

这里便涉及到了 Actors 的一个重要特性——**可重入性（Reentrancy）**，一个可重入的 Actor 即使有暂时挂起的旧的任务，它仍然可以创建并执行其他新任务，而不会一直等待挂起的任务完成。

> 注：这里的关键点是*有暂时挂起的旧的任务*，并不代表同一个 Actor 可以同时并行地执行多个任务。Actors 的可重入性意味着 Actors 不会像 GCD 串行队列一样严格遵循 FIFO，而是可以先完成一个较晚加入的任务（例如上文的 D2），并无需等待较早加入的任务完成（例如上文的 D1）。

在了解了 Actors 的可重入性之后，我们结合刚刚 GCD 队列优先级反转的问题，如果使用 Actors 代替 GCD 串行队列，那么在高优先级任务 A 执行完毕之后，Database actor 可以直接选择当前任务队列中的下一个高优先级任务 B，而不是按照 FIFO 执行任务 1-5。

![](https://images.xiaozhuanlan.com/photo/2021/5d59696c602f6dafae0039654dca5c46.png)

> 注：关于 Actors 的可重入性和优先级问题，[SE-0306](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md#actor-reentrancy) 和 [SE-0304](https://github.com/apple/swift-evolution/blob/main/proposals/0304-structured-concurrency.md#priority-escalation) 中有详细的讨论。
>
> Actors 的可重入性，更多地是出于对性能和安全性的考虑，以及提高线程利用率，在使用 Actors 时，我们必须要考虑到可重入性带来的不确定因素，具体的例子可以参考 [SE-0306](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md#actor-reentrancy)，其中提到了可重入性可以减小死锁发生的可能性，并对非可重入的 Actor 可能发生死锁的场景作了详细的阐述。





### Main actor

最后，我们还需要了解一个特殊的 Actor——Main Actor（可以理解为 GCD 中的主队列）。当我们执行完一个异步操作并需要刷新 UI 时，我们便涉及到与 Main actor 相关的 Actor hopping 操作，在这种情况下，我们需要额外留意其带来的上下文切换损耗，因为 Main actor 的任务必定会由主线程来执行，因此在发生 Actor hopping 时，极大可能会有线程上下文切换所带来的损耗。

![](https://images.xiaozhuanlan.com/photo/2021/5d59696c602f6dafae0039654dca5c46.png)

在一些 `for` 循环语句中，如果涉及类似的 Actor hopping，我们需要注意循环次数带来的性能损害

![](https://images.xiaozhuanlan.com/photo/2021/a3697da73d1780b812ef365aa8780452.png)

在这种情况下，我们需要对代码做一定的重构，来避免频繁切换上下文带来的性能损害。

![](https://images.xiaozhuanlan.com/photo/2021/3de9f1b6a573e62d7227c41c18385814.png)

> 注：上面的代码中，虽然 `updateUI()` 操作需要等待 `database.loadArticle()` 完成后才触发，但我们需要理解这并不会阻塞主线程或者其他任何线程。

## 结语

在了解了背后的原理之后，我们会发现 Swift 提供的并发模型，不仅仅是表面上更抽象的一个结构化并发编程模型，Swift 在编译层面和运行时层面，都对并发编程的性能、效率和开发体验做了很大程度的优化，例如协作式线程池的引入，以及新增的语言特性等。

不得不承认，社区为 Swift 带来了强大的活力，同时相对于 Objective-C，苹果的重心基本上已完全偏向了 Swift。吸收了多种现代语言特性和优势的 Swift，野心注定不仅在于端应用开发领域。

本 Session 仅仅探索了 Swift 结构化并发模型的一部分背后原理，如果想要更全面地了解 Swift 的结构化并发模型，请参考相关的 Session 和 Proposal：

- [SE-0304: Structured concurrency](https://github.com/apple/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)
- [SE-0306: Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md)
- [SE-0296: Async/await](https://github.com/apple/swift-evolution/blob/main/proposals/0296-async-await.md)
- [Session 10132 - Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132)
- [Session 10133 - Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133)
- [Session 10134 - Explore structured concurrency in Swift](https://developer.apple.com/videos/play/wwdc2021/10134)

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
