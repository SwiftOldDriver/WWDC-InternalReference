# WWDC21 10017 - 为 Swift 和 SwiftUI 带来 Core Data 并发

本文基于 [Session 10017](https://developer.apple.com/videos/play/wwdc2021/10017/) 梳理

> 作者：SZ，iOS 开发者，就职于 LinkedIn，喜欢研究编程语言和操作系统相关的内容，目前从事移动应用架构和基础设施的相关工作。
> 
> 审核：Damonwong，iOS 开发，老司机技术周报编辑，就职于淘系技术部

## Core Data回顾

无论在哪一种 Apple 平台上开发，总会需要把用户数据存储在某些地方。Core Data 就是一个非常优秀的选择。它解决了管理用户数据很多复杂问题，把这些数据从内存中的 Object Graph 变成适合在存储设备上读写的模型。除此之外，Core Data 还花了大量精力解决运行时里的问题，比如内存占用量和延迟。同时，Core Data 提供的功能还可以扩展，它可以从一个简单的本地 Persisted Store 开始，扩展到使用多个 Execution Context 来改善程序性能，甚至可以使用 CloudKit 在不同设备上共享数据。值得强调的一点是， Core Data 能在所有 Apple 的平台上使用，一旦开始使用 Core Data，大家所学的技能可以在 Mac, iPhone 和 Apple Watch 上同时使用。

## Core Data 使用 Swift 并发特性

今年 Swift 在语言和运行时中加入了全新的并发特性，Core Data 也用到了这些特性。由于对数据进行持久化需要对外部存储设备进行读写，存在大量 IO 操作，Core Data 在设计之初就非常关注程序的并发性，因此在 Core Data 中采用全新的 Swift 并发模型也就顺利成章。下面结合 Earthquake 这个例子来说明一下 Core Data 和 Swift 并发特性是如何工作的。

Earthquake 这个应用程序从美国地质调查局读取数据，然后使用 Core Data 存储最近发生的地震信息，这些信息包括地震强度、地点和发生日期。Earthquake 使用了 view context 驱动 UI 更新（注：也就是绑定在主线程上的 ManageObjectContext），使用了 background context 来存储从美国地质调查局获得的数据，也包含了一个本地容器（注：应该指的是 NSPersistentContainer 实例，其中包括具体存放数据的 NSPersistentStore 实例）来存储地震信息。它从美国地质调查局提供的 JSON feed 获取信息，然后交给 JSON Parser 进行数据解析，之后交给 Background context 把 JSON 数据转成 NSManagedObject 对象，同时存入本地数据仓库，随后由 View context 合并这些变更，最后更新 UI。

![](https://images.xiaozhuanlan.com/photo/2021/6ffa2b5af337a3f8846866c4feef88ff.png)

### 异步 API

下面让我们来看一下如何使用 Swift 并发特性来组织这些操作。首先看下数据导入的过程，也就是上文描述的从数据获取到存入本地数据仓库的过程。以下是这个过程的代码实现。

> 注：这里强调一下在数据导入过程中对于 batchInsertRequest 的使用，这是2019年引入的对于批量数据更新的优化，包括 Insert, Update, Delete。SQLite 的数据操作接口都是基于数据行 Data Row，没有对批量操作进行优化，因此需要持久化框架提供类似的优化和操作。

![](https://images.xiaozhuanlan.com/photo/2021/edbba8d6384bb81161b8ef49e3e425e9.png)

在代码中，可以很容易发现，数据下载、转化、导入都需要并发。（代码中的下载和转化都只是演示，实际上不可能这么写，一定会通过 Callback Closure 进行异步调用）传统上这些并发需要依赖框架提供的功能和实现，在 Core Data 里，当 `performAndWait` 被调用时， `NSManagedObjectContext` 会在一个它自己单独的运行环境中执行 `performAndWait` 所接收到的闭包（注：也就是自己私有的线程上执行，这里指的是 Background context，View context 会在共享的主线程执行），执行过程中，调用方的线程会被阻塞，等待闭包执行完毕，才继续执行之后的代码。

![](https://images.xiaozhuanlan.com/photo/2021/7ca56555102cefa973ca55c9123d92d0.png)

当然，Core Data 除了 `performAndWait` 之外还提供了 `perform`，无需等待闭包执行完毕，调用方的线程也不会被阻塞。

![](https://images.xiaozhuanlan.com/photo/2021/eb1decc3bfde74ddbc2446238373f5fa.png)

今年 Swift 引入了新的强大的并发模型，并深度集成在 Swift 语言中，这使得 Core Data API 能更准确表达并发语义。只需使用 `await` 关键字，等待 `perform` 函数的返回结果，就可以和 `performAndWait` 达成一样的语义效果。新方法的好处是，并发语义不会被隐藏在实现的细节里，而是体现在 Swift 语言里，这样编译器可以自动防止很多常见的并发问题，比如数据竞争（data races）和死锁，甚至当我们知道一个执行中的任务在等待一个异步执行结果时，程序能更有效率利用资源。

> 注：如果没有 `await/async`，Core Data 就需要在函数名上加入 `AndWait` 来表达该方法会阻塞调用方的线程，编译器无法从函数名字中分语义上的差别，所以无法在编译时进行检查，只能通过运行时检查，一但出现多线程问题，即使是常见问题，调试也不简单，这点是非常重大的进步。至于更有效利用资源，这主要和新的 Swift 并发模型有关，新的模型使用 task 进行任务调度，不用为每一个 task 生成一个新的线程，有效减少了无用的 CPU 上下文切换，细节可以参考 WWDC 2021 Session 10254 Swift concurrency: Behind the scenes （Swift 并发：内幕），吐槽一下 Session 10254 听得真心累，大家还是看内参吧

![](https://images.xiaozhuanlan.com/photo/2021/40e6dba58bf69563c0d78c12df799ba7.png)

下面返回原来的代码，看看怎么通过新的 async 函数来改进。我们可以通过 `await` 挂起（suspend）当前任务，等待异步调用的结果，还可以无缝使用 Swift 结构化的错误处理（error handling）把错误返回给调用方的栈帧。

![](https://images.xiaozhuanlan.com/photo/2021/fa27d1b604f29b3c7769a04e5302547f.png)

我们再来仔细看下 `perform` ，这个 `NSManagedObjectConext` 里 Core Data 全新的异步调用 API。它是个泛型函数，泛型的类型取决于返回值的类型，并且是个 `async` 函数，支持全新的 Swift 并发特性。API 上最重大的变化是 `block` 这个参数，现在 `block` 可以返回一个结果或者抛出一个错误。

> 注：终于可以不用通过callback 或者 closure capture 来返回结果或者错误了🎉

![](https://images.xiaozhuanlan.com/photo/2021/f186ff0f408fcc36b1d3e83528e1b486.png)

### 错误处理

以前，因为并发模型被隐藏在框架实现中，仅有的能在 `performAndWait` 中返回错误的方法之一就是通过闭包中捕获的 Optional 变量来设置返回的错误值，等闭包执行完后再查看。如果使用 `perform`，那会变得更加复杂，因为需要把 completion handler 的到处传，还得记得再所有可能返回的地方调用，稍有不慎就会漏掉。有了新的 API，就可以直接抛出一个错误，这个错误会自然返回给调用方的栈帧。（注：原文使用 unwinding to the calling frame，指处理异常时从当前栈顶弹出栈帧，直到能处理异常的栈帧为止，这种处理过程。详见 https://en.wikipedia.org/wiki/Call_stack#Unwinding）

![](https://images.xiaozhuanlan.com/photo/2021/690e44bafd8b44ad84edc622ff5d4aff.png)

![](https://images.xiaozhuanlan.com/photo/2021/19d16feaa76e9ed03ef5e68722f21d09.png)

![](https://images.xiaozhuanlan.com/photo/2021/055044034a7fab4fd6c7a71ce1ae9d0e.png)

### 返回值处理

看完了新的 API 如何处理错误，接下来我们看一下如何处理返回值。这里我们需要获取最近5小时发生的地震数量。我们可以使用 Calendar API 来精确计算距离现在5小时前是什么时间，然后使用这个时间配置 `NSFetchRequest` 和 `NSPredicate`，最后获取计数结果。以前，和错误处理一样，我们需要再闭包里给捕获的变量 `quakeCount` 赋值，在闭包执行结束后使用 `quakeCount`。

![](https://images.xiaozhuanlan.com/photo/2021/96a858f62a5c4a3a9121fbdbdc3b03bd.png)

现在，我们只需要使用 `await` 等待 `perform` 函数返回执行结果，剩下的部分和以前基本相同。这样我们不必使用手工的方式传递查询结果，代码更简洁，也避免了很多可能的漏洞。

![](https://images.xiaozhuanlan.com/photo/2021/85c7a15da55c52bd2bfc13d0aef7c9b8.png)

使用新的异步 API 也有需要注意的地方。下面这个例子直接返回 `NSManagedObject` 对象，会产生安全隐患。 因为 `NSManagedObject` 会在 `NSManagedObjectContext` 中注册，不能跨 context 使用 `NSManagedObject`。这种情况下，设置 `NSFetchRequest` 返回 `ObjectIDResultType` 或者 `DictionaryResultType` 才是安全的。 

![](https://images.xiaozhuanlan.com/photo/2021/a0d5f09f9f986664a7f0e5afb412627a.png)

![](https://images.xiaozhuanlan.com/photo/2021/e4d46b0050403f8ebb47d16a391e9f94.png)

### 参数 ScheduledTaskType

使用异步 perform API 还要注意第一个参数类型 `ScheduledTaskType`。默认情况下，调用异步 perform API，使用的是默认 `ScheduledTaskType` 值 `.immediate`，这和 `performAndWait` 的语义相同，会等待闭包执行完毕后返回。如果传入 `.enqueued`, 它只会把需要完成的工作放入 `NSManagedObjectContext` 工作队列的队尾，不会等待工作完成，直接返回。

> 注：`await perform(.enqueued)` 这样的设计会产生一些误解，调用 await 只能表示程序可能会在这一点挂起，并不代表一定会挂起，也可能存在执行完同步操作就返回的情况，决定权在被调用方。

![](https://images.xiaozhuanlan.com/photo/2021/627d204c535f722afc2382b708dc15c1.png)

除了 `NSManagedObjectContext` 之外，`NSPersistentContainer` 中的 `performBackgroundTask` 以及 `NSPersistentStoreCoordinator` 中的 `perform` 也采用了新的异步 API 的设计。当然使用新的异步 API，并不能完全保证程序在并发环境下的安全性。我们仍然需要使用 Address Sanitizer、Thread Sanitizer 以及 Core Data 提供的 com.apple.CoreData.ConcurrencyDebug 这个标记来测试应用程序。

> 注：关于这些测试，可以参考 WWDC 2019 Session 230 Making Apps with Core Data

## Core Data Swift API的增强

除了 Core Data 并发 API 的改进，Core Data 与 CloudKit 以及 Spotlight 的集成也加入了很多新的 API。

> 注：可以参考 WWDC 2021 Session 10015 Build apps that share data through CloudKit and Core Data 和 WWDC 2021 Session 10098 Showcase app data in Spotlight

其他的 Core Data Swift API 的改进主要集中在以下的枚举类型。

- `NSPersistentStore` 的类型，可以不用 `NSXMLStoreType` 这类字符串常量，而使用 `NSPersistentStore.StoreType` 中的 `.xml`。
- Core Data 还加入了`NSAttributeDescription.AttributeType`，使数据类型的表带在 Swift 里更加自然。下面这个测试用例，展示了如何用 Attribute Type 测试 Core Data Schema。

![](https://images.xiaozhuanlan.com/photo/2021/5bfe469cfb870a1e36348a7de84d5e06.png)



## Core Data 对 Swift UI 动态能力的支持

除了对 Swift API 的改进，今年 Core Data 也增加了新功能，改进对 Swift UI的支持。

### 惰性实体解析 Lazy entity resolution

在 Swift UI 里使用 Core Data 时，我们通常会写出以下的代码。QuakesProvider.shared.container 没有必要绑定在 container 这个属性上，但我们之所以那么做是为了让 Core Data 在任何 Swift UI view 在使用到 Core Data 之前就完成初始化。今后，这种技巧不再必要，因为 `@FetchRequest` 这个 Property Wrapper 会在真正开始数据查询时再通过 Entity name 去查找 Entity。

![](https://images.xiaozhuanlan.com/photo/2021/93bb50e69319848ef441bd249d33ecde.png)

所以现在可以非常安全的直接在 environment 调用中引用 `QuakesProvider.shared.container` 了。

![](https://images.xiaozhuanlan.com/photo/2021/5cf484754ea9fb8e3de3f234e10f271e.png)

### 动态化配置 Dynamic configuration

`@FetchRequest` 这个 Property Wrapper 包装了 `FetchedResults` 类型的值，现在 `FetchedResults` 加入了两个新的属性，`nsPredicate` 和 `sortDescriptors/nsSortDescriptors`。这两个属性可以动态改变 `FetchRequest` 的排序和过滤条件，实现动态化查询。如果没有这些改进，排序和过滤条件需要通过 View 的初始化函数传入，而且动态改变 `FetchRequest` 的排序和过滤器配置也非常困难。结合这些新属性，我们可以通过以下代码实现动态更新 Earthquake 应用里的牌讯和过滤查询条件。当 toolbar 的选择发生改变时，通过更改 `quakes.sortDescriptors` 配置，触发新的 `FetchRequest`，查询结果的变化又传递到 List 从而引发 UI 更新。过滤器的更新也可以通过类似的方法改变 `quakes.nsPredicate` 来实现。

```swift
private let sorts = [(
  name: "Time",
  descriptors: [SortDescriptor(\Quake.time, order:.reverse)]
), (
  name: "Time",
  descriptors: [SortDescriptor(\Quake.time, order:.forward)]
), (
  name: "Magnitude",
  descriptors: [SortDescriptor(\Quake.magnitude, order:.reverse)]
), (
  name: "Magnitude",
  descriptors: [SortDescriptor(\Quake.magnitude, order:.forward)]
)]

struct ContentView: View {
  @FetchRequest(sortDescriptors: [SortDescriptor(\Quake.time, order: .reverse)])
  private var quakes: FetchedResults<Quake>
  
  @State private var selectedSort = SelectedSort()
  
  @State private var searchText = ""
  var query: Binding<String> {
    Binding {
      searchText
    } set: { newValue in
      searchText = newValue
      quakes.nsPredicate = newValue.isEmpty
            ? nil
            : NSPredicate(format: "place CONTAINS %@", newValue)
    }
  }
  
  var body: some View {
    List(quakes) { quake in
      QuakeRow(quake: quake)
    }
    .searchable(text: query)
    .toolbar {
      ToolbarItem(placement: .primaryAction) {
        SortMenu(selection: $selectedSort)
        .onChange(of: selectedSort) { _ in
          let sortBy = sorts[selectedSort.index]
          quakes.sortDescriptors = sortBy.descriptors
        }
      }
    }
  }
}
```

### Sectioned fetching

还有一个被广泛请求的功能是 Sectioned fetching。今年 SectionedFetchRequest 作为一个新的 Property Wrapper 被引入 Core Data。SectionedFetchRequest 比 FetchRequest 多了一个初始化参数，一个能标识 section 的 key path，这和 NSFetchedResultsController 很像，但不同的是 section 的标识可以是任意 hashable 类型，因此 SectionedFetchRequest 会有一个额外的泛型参数。`SectionedFetchRequest` 所包装的值（SectionedFetchResults） 类似一个二维数组，是一个 sections 的集合，每一个 section 有自己的标识符，还包含一个结果集合。

以下代码演示如何使用 `SectionedFetchRequest`。现在 quakes 的类型变成了 `SectionedFetchResults`，Property Wrapper 也变成了 `@SectionedFetchRequest`， ContentView 的 body 变成了双层循环。要注意的是，对于 FetchRequest 的配置变更会在 getter 被调用时提交给系统，所以为了更新排序和 Section 标识符的配置，需要在一个本地的引用上更新，不能直接更新 quakes。

> 注：吐槽一下，这种实现细节决定应用行为的方法，很容易引发问题，希望下一个版本能有同时更新多个配置信息的 API。从目前 Apple 提供的信息需要注意以下几点
>
> - SectionedFetchRequest 的 getter 所返回的是引用类型而不是值类型、
> - 使用 SectionedFetchRequest 的 setter 会在改变配置后触发 getter 并向数据仓库提交一次查询请求
> - 通过引用更改的配置信息仍然会通过现有的 Swift UI 机制，通知 View 进行更新，View 在通过 SectionedFetchRequest 的 getter 获取最新数据的时候，会把配置信息的更改提交给查询请求

```swift
private let sorts = [(
  name: "Time",
  descriptors: [SortDescriptor(\Quake.time, order:.reverse)],
  section: \Quake.day
), (
  name: "Time",
  descriptors: [SortDescriptor(\Quake.time, order:.forward)],
  section: \Quake.day
), (
  name: "Magnitude",
  descriptors: [SortDescriptor(\Quake.magnitude, order:.reverse)],
  section: \Quake.magnitude_str
), (
  name: "Magnitude",
  descriptors: [SortDescriptor(\Quake.magnitude, order:.forward)],
  section: \Quake.magnitude_str
)]

struct ContentView: View {
  @SectionedFetchRequest(
    sectionIdentifier: \.day,
    sortDescriptors: [SortDescriptor(\Quake.time, order: .reverse)])
  private var quakes: SectionedFetchResults<String, Quake>
  
  @State private var selectedSort = SelectedSort()
  
  var body: some View {
    List {
      ForEach(quakes) { section in
        Section(header: Text(section.id)) {
          ForEach(section) { quake in
            QuakeRow(quake: quake)
          }
        }
      }
    }
    .toolbar {
      ToolbarItem(placement: .primaryAction) {
        SortMenu(selection: $selectedSort)
        .onChange(of: selectedSort) { _ in
          let sortBy = sorts[selectedSort.index]
          let config = quakes
          config.sectionIdentifier = sortBy.section
          config.sortDescriptors = sortBy.descriptors
        }
      }
    }
  }
}
```



## 总结

总而言之，Core Data 是在所有 Apple 平台上管理应用程序数据持久化需求的一站式商店。 它通过新的 `perform` API 利用 Swift 中的新并发特性，并且内置了强大的线程安全调试。

它有新的枚举接口，使数据仓库和属性类型在 Swift 中使用起来更加自然，还有 CloudKit 共享和 Spotlight 集成。 使用带有动态化配置和sectioned fetching 的 SwiftUI 将数据连接到 View 比以往任何时候都更容易。

如果需要学习更多与这些主题相关的新东西，建议查看 “Simplify with SwiftUI“ 和 “Meet Swift Concurrency” 系列。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
