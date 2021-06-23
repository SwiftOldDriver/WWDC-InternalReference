#  Swift 中的 ARC 机制: 从基础到进阶

 [Session 10216](https://wwdc.io/share/wwdc21/10216) 围绕 Swift 语言中的 **A**utomatic **R**eference **C**ounting （自动引用计数）机制讲述了实践过程中对象生命周期变化可能引发的问题以及如何从语言或代码设计层面去规避这些问题。说到 ARC 可能很多 Objective-C 程序员都非常熟悉（实际上 Objective-C 的 ARC 特性[源自](https://oleb.net/2019/chris-lattner-swift-origins/)早期 Swift 在苹果内部的设计过程），这里所描述的多数问题在 Objective-C 代码中也同样存在，可以借鉴其解决办法。

Swift 提供了 *struct* 和 *enum* 之类的值类型，在实践中我们应该尽可能使用值类型，值类型在传递和赋值时将进行复制，从而避免一些引用类型使用时潜在的危险（比如对象被预期之外的代码持有导致内存问题或线程安全问题）。但 Swift 中也提供了 *class* 这种引用类型，当你使用 *class* 时 Swfit 会通过 ARC 机制来管理对象的内存。因为 *class* 的使用也非常广泛（比如继承来自 Objective-C 的类），所以为了写出有效的 Swift 代码，理解 ARC 的工作原理显得十分重要。

Swift 中一个对象的生命周期开始于 init() 并于对象最后一次被使用后结束， ARC 会在对象生命结束后释放其内存从而实现自动内存管理。ARC 通过引用计数来跟踪一个对象的生命周期，Swift 的编译器会自动插入 retain/release 语句进行引用计数的增减：在运行时执行 retain 会增加引用计数，而执行 release 则会减少引用计数，当引用计数减少到 0 对象就会被释放，下面让我们通过一个例子来看理解：

 ```swift
 class Traveler {
   var name: String
   var destination: String?
 }
 
 func test() {
   let traveler1 = Traveler(name: "Lily")
   let traveler2 = traveler1
   traveler2.destination = "Big Sur"
   print("Done traveling")
 }
 ```

在上述例子中，我们声明了一个名为 `Traveler` 的类，它有 `name` 和 `destination` 两个属性。在 `test()` 函数中：1）首先一个 `Traveler` 对象被创建并赋予 `traveler1`，此时引用行为开始，然后这个引用被拷贝到 `traveler2`，此时对 `traveler1` 的引用结束：

![001](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465341902-e7f31ab7-4635-4c0c-87f5-f9593145c2be.png)

由于对象构造时引用计数为 1，所以根据规则赋值给 `traveler2` 后应该进行 `release` ：

![002](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465341653-631a639f-64e0-4774-bbb4-852c85c300f0.png)

`traveler2` 的引用开始于赋值，在其 `destination` 属性被更新后引用结束：

![003](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465341878-6b222be7-825e-4711-90a6-f1cea419d7cd.png)

于是对于 `traveler2` 也应该在对应位置进行 `retain` 和 `release`：

![004](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465341801-31083390-a103-49ff-8abb-236e07e0f2a7.png)

如此一来初始计数为 1 的 `Traveler ` 对象可以在 `print`语句之前将计数归零从而正确释放：

![005](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465341966-2934e9cc-3841-489c-83ac-57bfff853eb5.png)

从上述例子可以看到 Swift 中对象生命周期是基于使用情况的（use-based），对一个对象能保证一个**最小生命周期**（注意实际上的生命周期可能更长但是不会更短），即从初始化开始到最后一次使用后结束，这和 C++ 栈对象基于 scope 的生命周期（RAII）不同：

![006](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465343436-364147a2-1163-4bd8-907c-d21655211bb5.png)

然而在实际情况中，编译器的会对实际插入 `retain` 和 `release` 指令位置和数量进行调整（取决于优化策略生效情况），导致我们观察到的对象生命周期可能会超过最小生命周期：

![007](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465343495-cf6b97b2-375c-4afd-9141-d163b6e84f73.png)

在多数情况下，对象确切生命周期并不会影响程序的行为，但是对于 `weak` 、 `unowned` 以及 deinitializer 等语言特性，如果你的程序依赖于对象**观察到的确切生命周期**而不是**编译器保证的最小生命周期**，那么你很可能在未来会遇到一系列的问题。这类代码在当下能正常运行只是一个偶然，对象观察到的生命周期会随着未来 Swift 编译器实现细节的改变而变化，这类 bug 可能无法在开发环境中被发现，并可能隐藏相当长一段时间，但是，当编译器升级带来 ARC 优化水平的提升，或者我们自己代码的其它改动导致 ARC 优化策略生效，此类问题就会暴露出来。

不像 Swift 中默认的强引用类型（strong references），`weak` 和 `unowned` 引用类型并不会参与引用计数管理，因此，`weak` 和 `unowned` 引用常常会被用来打破对象间的循环引用。我们看一个循环引用的例子：

![008](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465344933-eb348396-b842-43dc-86bc-f822709f7b04.png)在 `test` 函数中 `traveler` 对象和 `account` 对象互相持有一个强引用，导致函数结束后彼此的引用计数依旧为 1，无法释放。这种情况下你可以通过一个 `weak` 或者 `unowned` 引用来打破循环引用。因为它们不会参与引用计数管理，所以访问被引用的对象时它可能已被释放，当这种情况发生的时候，Swift 运行时会对 `weak` 引用的访问返回 nil，而对 `unowned` 引用的访问产生 [trap](https://en.wikipedia.org/wiki/Trap_(computing))。

![009](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465344950-8e48f64d-ca6d-47cf-9d3a-b5849c97ab98.png)

在这个例子中，我们使用 `weak` 引用来打破循环引用是没问题的。但是，如果仅仅因为你此时观察到对象实际生命周期还没结束，就在编译器保证的**最小生命周期之外**依然使用 `weak` 引用去访问一个对象，那么这块代码在未来就可能会产生 bug，让我们看一个例子：

![010](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465344791-a50da9ef-a611-4c57-83fb-024336e9d194.png)

此处在 `account.printSummary()` 调用时 `traveler` 对象的使用已经结束，根据最小生命周期的保证，此时 `traveler` 对象是可以被合法释放的，导致 `traveler!.name` 引发 crash。虽然这里可以用 optional binding 来防止 crash，一旦后续编译器或者代码的变动导致对象生命周期被优化，这里依旧会留下一个静默的 bug：

![011](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465345834-d2b300a6-bf6a-4c17-85b1-4295420ada9d.png)

那么有没有更好的办法来解决这个问题呢？这里有一些技巧可以用来安全地处理 `weak` 和 `unowned` 引用带来的问题，但是不同的技巧有**前期实现成本**和**后期维护成本**的不同取舍，让我们通过例子逐个来看：

1. 使用 `withExtendedLifetime()`, 在调用 `printSummary()` 时主动保证 `traveler` 的生命周期，防止潜在的 bug:

![012](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465345728-f863df18-86ba-4161-81f2-f3d001891c68.png)

这样也可以达到同样的效果：

![013](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465347109-7f30079e-8a46-4831-ab91-57bc522238c6.png)

但是这种解决方案很脆弱，因为它将保证正确性的责任从编译器转交到程序员的身上，你需要思考每次 `weak` 引用的访问是否有潜在的 bug 然后对应使用 `withExtendedLifetime()` ，如果失去控制，可能导致整个 codebase 中到处是 `withExtendedLifetime()` ，从而带来后期的维护成本。

（注：在 Objective-C ARC 中你可以使用 `__attribute__((objc_precise_lifetime))` 或者 `NS_VALID_UNTIL_END_OF_SCOPE` 来标注变量以达到类似的效果）

2. 通过重新设计类的 API 来规避问题：

![014](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465349893-a8fb7944-a07f-410d-82a1-6e417e8892f9.png)

这种方案将 `printSummary()` 方法从 `Account` 类移动到了 `Traveler` 类中，然后将 `Account` 中的 `traveler` 属性标记为 `private weak`。如此一来再  `traveler.printSummary()` 被执行的时候 `account` 和 `traveler` 的生命周期都能得到保证。

3. `weak` 和 `unowned` 引用不仅会带来性能上的开销，而且在 API 设计不当还会带来潜在的问题。所以在使用前应该停下来思考引入 `weak` 或 `unowned` 引用是否是有必要？它们是否是用来打破引用环的？能否在一开始就避免引用环的存在？这里提供一种避免引用环的方法：通过重新设计你的代码，将环状关系转化成树状关系来解决：

![015](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465348758-2b680c92-1030-44e3-bd49-a3cbec3dc0a1.png)

在之前的设计中，`Account` 需要引用 `Traveler` 仅仅因为需要访问 `Traveler` 的 `name` 属性， 于是我们可以将 `name` 提取到一个新的类 `PersonalInfo` 中，然后让 `Traveler` 和 `Account` 都去引用同个 `PersonalInfo` 对象：

![016](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465350408-cf9016f5-e196-4448-8227-fa2981cea972.png)

这种方式虽然增加了前期的实现成本，但这却是消除所有潜在对象生命周期问题的终极办法。

让我们来看另一个场景：deinitializer 中的副作用 ，它也会让对象的实际生命周期影响程序的行为。Swift 中一个类的 deinitializer 会在对象被释放前被调用，这让它产生的副作用可以被外部的程序所观察到，如果你写的代码依赖 deinitializer 的执行顺序那么就可能埋下隐藏的 bug，并在以后对象的实际生命周期发生变化时爆发。

![017](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465352848-d141ba68-8146-4dac-a082-ff3eadb8c969.png)

在上述代码中，当 `Traveler` 对象释放的时候会触发其持有的 `TravelMetrics` 对象执行 `publish` （上传当前计算出来的热门景点）。

![018](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465351480-558f9113-cddc-49c7-a50e-44bdd2c3af3f.png)

在 `test()` 函数中，`metrics` 对象会在最后调用 `computeTravelInterest` 计算目前最热门的景点，那么问题就来了：如果 `Traveler` 的生命周期被优化缩短了，那么它 `deinit` 方法会在 `computeTravelInterest` 前就执行，而此时热门景点数据还没计算，`publish` 的就是错误的数据。

对于这个场景，前面讲到的三种方法依然适用：

1. 使用 `withExtendedLifeTime()` 保证 `traveler` 的 `deinit` 执行时机：

   ![019](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465354279-29fd1a57-9a5a-43bc-8781-3db4de1bc06a.png)

2. 修改实现，将 `computeTravelInterest` 的调用放到 `Traveler` 的 `deinit` 中，同时将 `travelMetrisc` 标记为 `private`：

   ![020](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465355825-097f8187-26d3-4e61-b0f9-655b10c9622f.png)

3. 重新设计使用 `defer` 避免依赖 deinitializer 中的副作用：

   ![021](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465356253-81ce6a6d-45c6-4c40-8162-b0df9ac1b92d.png)

这次 WWDC 之所以专门有个 session 来讲 ARC 对象生命周期其中一个原因是 Xcode 13 引入了一个新的优化选项： **Optimize Object Lifetimes**：

![022](https://cdn.nlark.com/yuque/0/2021/png/783447/1624465356019-402154b6-16a5-4345-bfdb-63091c4d6edd.png)

它对应的 Swift 编译器参数是： `-Xfrontend -enable-copy-propagation`，开启这项优化后会导致已有代码中一些对象实际生命周期被缩短，从而暴露一些隐藏已久的 bug。注意这还是一个实验性质的选项（所以需要通过 `-Xfrontend` 在编译器 driver 中开启），默认没有开启。

