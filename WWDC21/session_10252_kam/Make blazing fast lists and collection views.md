> 作者：[Kam](https://kam-to.github.io)， iOS 软件开发者、资深摸鱼工程师，喜欢收集小比例汽车模型、打羽球，现供职于网易。
>
> 审核：
>
> 极速，现就职于回响科技。现在是半个flutter工程师
>
> Damonwong，iOS 开发，老司机技术周报编辑，就职于淘系技术部

> 本文基于 [Session 10252](https://developer.apple.com/videos/play/wwdc2021/10252/) 梳理

继 iOS 13、14 为 List 及 Collection View 带来更现代化的 API 后，iOS 15 为它们带来了更流畅的滚动体验。不仅在 cell prefetching 、cell reloading 机制上做了底层优化工作，还充分吸取了优秀开源项目的优化经验，提供 `UIImage` 生成缩略图、解码为位图等功能 API，避免直接设置大尺寸的未解码 `UIImage` 对象给 cell 上的 `UIImageView` 而导致卡顿。下面我们聊一聊这些改进。

## Diffable Data Source

早在 WWDC 2019，Apple 在发布 iOS 13 之际便推出 Diffable Data Source 作为可靠的 UI 与数据同步技术，旨在解决使用 `insertItems(at:)` 等 API 更新视图时会碰到的 `NSInternalInconsistencyException` 问题。如果对 Diffable Data Source 还不了解，可以补番 [WWDC 2019 Session 220: Advances in UI Data Sources](https://developer.apple.com/videos/play/wwdc2019/220/) 或[《Data Source 新特性：基于 Diffable 实现局部刷新》]( https://xiaozhuanlan.com/topic/9158203647)。

为了能让读者能在查看该 session 对应的演示程序 [Building High-Performance Lists and Collection Views](https://developer.apple.com/documentation/uikit/uiimage/building_high-performance_lists_and_collection_views) 并理解本次的改进点，下面简单重温一下 Diffable Data Source。		

### Recap

在过去，上古时期的 iOS 开发者，需要手动计算变动数据的 `NSIndexPath` 集合，然后调用 Collection View 的批量刷新接口更新 UI，而 buggy 的计算逻辑很容易抛出 UI 更新结果与数据不一致的 `NSInternalInconsistencyException` 异常。当然，粗暴地调用 `reloadData` 全量刷新可以解决这个问题，但这会丢失 cell 动画以致用户体验下降，并且这种冗余的刷新工作还有会带来性能下降的表现。很长一段时间开发者们会使用 [IGListKit ](https://github.com/Instagram/IGListKit) 这样的 data-driven 框架，用 diff 算法察觉数据变动刷新 UI，来应付这样的异常。直到 Apple 在 iOS 13 上推出 Diffable Data Source，开发者才能使用原生的技术品尝到 diff 刷新带来的好处。

![Diffable Data Source](qvf5ynk5g.bkt.clouddn.com/mweb/ Diffable_Data_Source.png)

Diffable Data Source 采用了闭包来配置 cell 和 supplementary view，使用 snapshot 的概念描述 Data Source 的状态，而数据的变动只需对其 snapshot 进行操作，然后 Data Source 就能计算出前后两个 snapshot 的 diff，从而执行 UI 的插入、移除等相关更新。其用法比较简单：

首先是摒弃传统的 UICollectionViewDataSource 的代理方法：

```swift
// 不再需要实现 UICollectionViewDataSource 协议
func numberOfSecions
func collectionView(_:numberOfItemsInSection:)
func collectionView(_:cellForItemAt:)
```

改用 `UICollectionViewDiffableDataSource` 泛型结构体持有数据，需要指定 seciton 和 item 的类型，两者必须为 hashable 对象。初始化只需绑定 collectionView 并提供一个名为 cellProvider 的闭包用来配置 cell 即可：

```swift
let collectionView = // 创建 UICollectionView
let dataSource = UICollectionViewDiffableDataSource<SectionType>, ItemType>(collectionView: collectionView) {
    (collectionView: UICollectionView, indexPath: IndexPath, item: ItemType) -> UICollectionViewCell? in
    let cell = collectionView.dequeueReusableCell(withReuseIdentifier:CellID, for: indexPath)
    // 一般业务场景中，这里需要 cell 类型转换，然后配置 cell
    return cell
}
```

然后用 `NSDiffableDataSourceSnapshot` 生成当前数据的状态，让 Data Source 对象调用 `apply(:animatingDifferences)` 函数即可。

```swift
var snapshot = NSDiffableDataSourceSnapshot<SectionType, ItemType>()
let firstSectionObject: SecionType = ...
snapshot.appendSections(firstSecionObject)
let firstSetionItems: [ItemType] = ...
snapshot.appendItems(firstSetionItems)
dataSource.apply(snapshot, animatingDifferences: false)
```

看，这就能实现一个列表的初始化，是不是非常简单？

数据状态的变动，通过改动 snapshot 后再让 datasource 使用，UIKit 就能自动计算 diff，不再需要调用 `perfrombatchUpate`，`insertItems` 更新 UI，不用再担心操作数据后和 UI 更新不一致的异常出现。 简单回顾了下 Diffable Data Source 后，下面介绍两个~~偷懒两年才改进的~~ Diffable Data Source API。

![new_two_api.png](https://images.xiaozhuanlan.com/photo/2021/7bc307f2af942dd141c6b6eb628c1700.png)

### API - apply(_:animatingDifferences:)

在 iOS 15 之前，调用 `apply(_:animatingDifferences:completion:)` 刷新时，如果传递的动画参数为 `false`，那么 UIKit 内部将会转为 `reloadData` 调用，这导致 Collection View 全量刷新屏幕上所有的 cell。由于官方提供的 demo 有比较多 iOS 15 的 API 逻辑耦合，为了能跟 iOS 14 作对比，笔者自己整了个 demo 测试，在从 snapshot 中移除一个 item 之后，调用 `dataSource.apply(snapshot, animatingDifferences: false)`， 在控制台中的输出如下：

![](https://images.xiaozhuanlan.com/photo/2021/8b14e98019a074b14e40188251576487.png)

留意 cell 对象和 index path 之间的对应关系：

1. 在移除并刷新后，iOS 14 中屏幕上的所有 cell 都走完整 enqueue、dequeue、configure 流程，所以 cell 与原先的 index path 对应关系在刷新前后有了较大的变化；
2. iOS 15 在同样的调用下，会计算 diff 实现数据刷新，移除最后一个 cell（0x15bd115f0），而不再做额外的工作。先前笔者在测试时，发现 cell 的配置存在冗余调用，相关[问题](https://developer.apple.com/forums/thread/683775)已 post 在开发者论坛 ，Apple 工程师已确认上述的优化不存在 iOS 15 beta 1 上，需要 beta 2 来验证。

### API - reconfigureItems(_:)

过去在操作 Diffable Data Source 的 snapshot 更新特定 items 时，只能使用 `reloadItems(_:)` 函数，这同样导致对应 item 的 cell 被 enqueue，然后从重用池 dequeue 来配置。iOS 15 推出 `reconfigureItems(_:)` API 实现局部更新。测试更新 cell（0，3）后，查看控制台的输出：

![](https://images.xiaozhuanlan.com/photo/2021/9c594ad299fe7889fd302c23707d75b9.png)

可以看到，在 iOS 15 之前，reload 后 cell（0，3）由原来的 0x13101bb40 变成了 0x13101dbb0；而在 iOS 15 之后，cell（0，3）在 reconfigure 前后都是 0x133a17cd0 对象。**总之，除非需要显式替换 cell 对象，否则你应该使用 iOS 15 推出的  `reconfigureItems(_:)` 实现 cell 的内容更新。**

### 重申 CellRegistration 的用法

Cell Registration 是在 [WWDC 2020](https://developer.apple.com/videos/play/wwdc2020/10097/)（[《WWDC20 10097 - UICollectionView 的进阶》](https://xiaozhuanlan.com/topic/7685190234)） 上推出的 cell 注册及配置 API，通过声明一个泛型结构体就能包揽 register cell，configure cell 等工作。不同类型 cell 的注册配置能分割开，不会在 cellProvider 闭包中糅合成一团，让 `UICollectionView` 的 API 更加现代化。

```swift
let cellRegistration = UICollectionView.CellRegistration<CellClass, Item> { cell, indexPath, item in
	// 配置 cell
}
        
dataSource = UICollectionViewDiffableDataSource<SectionID, Item>(collectionView: collectionView) {
	(collectionView, indexPath, item) in
	// 直接传递 registration，无需手动注册 cell、无需添加 cell identifier 
	return collectionView.dequeueConfiguredReusableCell(using: cellRegistration, for: indexPath, item: item)
}
```

本 session 没有提及针对该 API 的改进，只是提出**不要在 cellProvider 中不断创建 cell registeration，否者不能实现 cell 复用机制**。这确实也是一个值得注意的点，否则也不会**在 iOS 15 中增加这么一个 Assertion**，详情参考社区讨论的帖 [UICollectionView raises an exception when dequeuing a cell using a registration on iOS 15](https://developer.apple.com/forums/thread/681739)。可能在 Apple 的眼里，还是有比较多的开发者误用这个 API。

## Cell Prefetching

iOS 10 开始便引入了 cell prefetching 机制，UIKit 会就根据用户的手势预先判断哪些 index path 的 cell 可能要显示，对比 iOS 9 会更早地，在 cell 还未抵达屏幕边缘前就调用 cell 的配置方法。如果提供了 `prefetchDataSource` 实例，那么还会调用相关回调，通知开发者提前开始加载所需资源。iOS 15 在此基础上，充分利用 commit 的空隙去获取 cell，避免 hitchs。

等等，什么 commit？什么 hitchs？

### Recap Hitchs

Hitchs 就是我们通常说的卡顿，这个词从上次 Apple 发布 tech talk [Explore UI animation hitches and the render loop](https://developer.apple.com/videos/play/tech-talks/10855/) 之后流行开来。Hitchs 是怎么出现的，需要回顾这个 tech talk 了解 iOS Render Loop 的基本原理。

![](https://images.xiaozhuanlan.com/photo/2021/23fdf263de49520be8c582a79d137c76.png)

单取一个渲染流程，从时序上看，系统按照 1 / 60 或 1 / 120 秒的周期不断触发 VSYNC 信号（下图白色竖线），App、Render server、On the Display 这三个阶段都必须在周期内完成自己的任务，否则就会出现 hitchs。

![](https://images.xiaozhuanlan.com/photo/2021/a5e0a14ecaca45a6cb6caf9d4d898a47.png)

这三个阶段在渲染流水线中具体要完成什么任务呢？

1. App 阶段接收 **Event**（比如触摸），在下一个 commit deadline，也就是下一个 VSYNC 信号来临之前，向 render server **Commit** 需要 UI 改动。如果无法及时完成提交，那么就会延迟到下一个 deadline；
2. Render Sever 阶段接收到来自 App 阶段的提交后 ，进入 **Render prepare** 阶段为 GPU 准备绘制的内容，然后进入 **Render execute** 阶段把 UI 渲染成位图。如果无法及时完成渲染，那么一会顺延到下一个 deadline；
3. On the dispaly 接收来自 Render server 的位图，**Display** 到屏幕上。

所以我们可以看到，**要保证不出现 hitchs，需要在 App 和 Render sever 两个阶段都保证任务不能在当前 VSYNC 周期 deadline 之后完成**。

### Back to prefetching

现在回到 iOS 15 的 cell prefetching，看它是怎么提高 cell 的获取效率的：

![](https://images.xiaozhuanlan.com/photo/2021/16f512cbc58cc4744de79d0617762783.png)

**Without prefetching**

UIKit 会在需要 cell 的 VSYNC 抵达后才获取 cell，对于开销较大的 cell（上图 Expensive cell 方块），就有可能无法及时在 deadline 之前提交任务给 Render server，导致掉帧。

**With prefetching**

在 iOS 15 的 prefetching 机制下，UIKit 会检测 App 阶段的 commit 耗时，如果是耗时较短的 short commit，那么就可以在这个 commit 发生之后，进行 cell 的 prefetching（上图蓝色方块）。即便这会导致下一个 short commit（上图蓝色方块右侧的绿色方块）延迟提交，但依然在当前周期的 commit deadline 之前，所以依然能及时完成该周期任务，而不出现 hitchs。

### Cell Lifecycle

新的 cell pretching 机制会让 cell 的生命周期增加多一个 prepared 阶段（如下图右边红色块所示），等待展示。

![](https://images.xiaozhuanlan.com/photo/2021/251dde3a785c65a05cad1a89d259b451.png)

处于 prepared 阶段的 cell，是有可能因为用户滑动屏幕的方向改变，而不被展示的，所以**如果业务逻辑中存在「configure cell」与「cell willDisplay」相关联的业务，需要重新考虑这样的变化会对业务有什么影响；基于同样的理由，我们还必须意识到，cell 有可能被重复展示，所以在划出屏幕外时，不会马上被放入重用池。**

不过 cell prefeching 只是给我们更多的时间去完成任务，而当设备的屏幕刷新率变得更高的情况下，依然可能出现 hitchs，所以接下来看看关于 cell 的内容配置，还有什么可以优化的好点子。

## API for UIImage 

在 UI 线程上，设置未解码的 `UIImage` 对象给 `UIImageView` 会触发解码行为。如果这个过程非常耗时，那么就会导致无法及时渲染当前帧。开源社区的许多异步图片加载库，都会提供类似的优化选项，允许程序在子线程中解码并缓存位图，然后再回到主线程设置给 `UIImageView`。而 iOS 15 则新增了相关 API 帮助我们完成这件事。

### API -  Decode

`UIImage` 新增的 `preparingForDisplay()` 函数，提供了以下多种形式：

![](https://images.xiaozhuanlan.com/photo/2021/4977930e34cd1d19f2264150b6e9dda1.png)

除了基础的同步版本的函数之外，还有支持 Swift async/await 特性及使用闭包的异步版本。**值得注意的是，异步版本解码图片发生在 UIKit 内部的串行队列中，所以有并发解码需求的就需要开发者管理并发任务了。**简单与 `draw(in:)` 绘制对比，循环只运行一次，就能说明问题了：

```swift
for _ in 0..<1 {
	UIGraphicsBeginImageContextWithOptions(tragetSize, false, 1.0)
	image.draw(in: CGRect(origin: .zero, size: image.size))
	let _ = UIGraphicsGetImageFromCurrentImageContext()!
	UIGraphicsEndImageContext()
}

for _ in 0..<1 {
	let _ = image.preparingForDisplay()
}

// 测试结果
drawInCtx cost:           	0.042748093605041504 seconds
preparingForDisplay cost: 	0.0029109716415405273 seconds
```

相比 `draw(in:)` 需在 CPU 绘制再上传位图给 GPU 渲染，笔者有理由相信新 API 在时间消耗上和内存用量上拥有更好的效率，毕竟掌握渲染实现的 Apple 能更好地利用 GPU。**值得注意的是，`preparingForDisplay` 返回的是 `UIImage?` 类型**，如果我们仔细看看注释，就会发现它也有无能为力的时候：

>  If the system can’t decode the image, such as an image created from a [CIImage](doc://com.apple.documentation/documentation/coreimage/ciimage), the method returns `nil`.

出于节省计算资源的考虑，解码后的图片应该缓存在内存中，避免在滚动列表的时候不断得消耗 CPU 资源。对于整个列表都是大尺寸图片的情况，缓存所有图片位图对内存会造成很大的压力，导致 App 响应变慢。有什么办法能够缓存足够多的图片，又能控制内存用量呢？根据「总内存消耗 = 位图内存消耗 * 位图数目」，我们可以知道，单个位图的消耗足够小，就能够实现我们的目的。

### API - Thumbnail

App 通常不需要在列表上的 cell 显示太大的图片，只需和 `UIImageView` 的尺寸相近即可，所以在解码之前，可以使用下面的 API 生成缩略图，之后再解码、缓存。

![](https://images.xiaozhuanlan.com/photo/2021/a6fdab1d6e0ff753293a88af123bcb65.png)

与准备位图的 API 一样，生成缩略图的 API 也有多个版本。我们再简单对比一下绘制原图 1/4 尺寸的缩略图：

```swift
let imageSize = image.size
let tragetSize = CGSize.init(width: imageSize.width / 2.0, height: imageSize.height / 2.0);
        
for _ in 0..<1 {
	let _ = image.preparingThumbnail(of: tragetSize)!
}

for _ in 0..<1 {
	UIGraphicsBeginImageContextWithOptions(tragetSize, false, 1.0)
	image.draw(in: CGRect(origin: .zero, size: tragetSize))
	let _ = UIGraphicsGetImageFromCurrentImageContext()!
	UIGraphicsEndImageContext()
}

// 测试结果
drawInCtx cost:          	 0.04196906089782715 seconds
preparingThumbnail cost:	 0.005650997161865234 seconds
```

可以看到，如果没有特殊格式需要支持，这样的基础功能交给 UIKit 来做真是再好不过了。同样地，留意 `preparingThumbnail(of:)` 的注释：

>Returns `nil` if the original image isn’t backed by a [CGImage](doc://com.apple.documentation/documentation/coregraphics/cgimage) or if the image data is corrupt or malformed

看来这两个 API 对由 `CIImage` 创建出来的 `UIImage` 都不大友好呀。

### API - 对比

上文的 API 性能定性分析比较简陋，笔者在[这里](https://github.com/Kam-To/Benchmark)放了一份稍微丰富些的测试代码，以及在模拟器、设备上的测试结果，结果上看依然是新 API 占优的：

**Display**

|                     | **cat.jpg** | underpass.jpg | wave.jpg |
| ------------------- | ----------- | ------------- | -------- |
| preparingForDisplay | **0.40**    | **0.39**      | **0.50** |
| DrawInRect          | 0.96        | 0.92          | 1.30     |

**Thumbnail**

|                                              | **cat.jpg** | underpass.jpg | wave.jpg |
| -------------------------------------------- | ----------- | ------------- | -------- |
| preparingThumbnail                           | **0.33**    | **0.32**      | **0.59** |
| DrawInRect(CoreGraphics)                     | 1.00        | 1.00          | 1.41     |
| CGImageSourceCreateThumbnailAtIndex(ImageIO) | **0.32**    | **0.32**      | **0.57** |
| UIGraphicsImageRenderer(UIKit)               | 1.27        | 1.29          | 1.72     |



## 总结

本文我们回顾了往年的 Diffable Data Source 基础和关于 hitchs 的 tech talk 等内容，了解 iOS 15 在 Diffable Data Source 和 cell prefetching 上的改进，也试用了 `UIImage` 两个甜品 API，希望这些知识都能被大家实践到产品上，构建性能更优的 List 和 Collection View。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
