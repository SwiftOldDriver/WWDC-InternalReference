> 作者：Edmond, [CocoaPods 历险记](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MTM1NTc2Ng==&action=getalbum&album_id=1477103239887142918) 作者，Swift & 长跑爱好者。
> 
> 审核：MetaSky，全能创作者，bilibili Up 主，频道：[聊有料](https://space.bilibili.com/1076758871)

## 本文知识目录

![Build SwiftUI views for widgets](https://gitee.com/looseyi/blog-image/raw/master/uPic/10019-Discover-concurrency-in-SwiftUI.png)

本文属于 WWDC21 中 SwiftUI 与 Concurrency 结合应用的文章。

关于 SwiftUI 可以查看这篇介绍：[Introduction to SwiftUI](https://wwdc.io/share/wwdc20/10119)，而 Swift Concurrency 算是今年 WWDC 的重头戏，从使用层面来看，就是引入了 [Async / Await](https://developer.apple.com/videos/play/wwdc2021/10132/) 这一语法，但是解决的却是软件工程中最令人头疼的问题之一。
接下来让我们看看 Concurrency 新工具是如何与 SwiftUI 结合的。

> Tips：文末有示例代码地址。

## 引言

![10019-01-table](https://images.xiaozhuanlan.com/photo/2021/75781e66f98d60d5869160b896664c33.png)

随着Swift 5.5 及 SwiftUI 的更新，您将拥有一系列新的并发编程工具。本文将重点介绍在 SwiftUI 中的相关新特性，主要包括三个方面，分别为：`Concurrent Data Models`、`SwiftUI & MainActor`、`New concurrency tools`。我们将通过一个星云图片浏览的 Demo 向您展示在 SwiftUI 中，现有的异步工具存在的问题，并运用新的并发工具来解决这些问题。最后我们会介绍 SwiftUI 中新引入的并发工具。

## Concurrent Data Models

在 Swift 中想要使用并发编程，对数据模型有哪些要求呢 ？让我们从零开始造火箭。

![10019-02-model-spacephoto](https://images.xiaozhuanlan.com/photo/2021/d1615ef496c61cfaa44ef21cdc762805.png)

首先，定义了 `SpacePhoto`，它需要遵循 Codable 和 [Identifiable](https://developer.apple.com/documentation/swift/identifiable) 这两个协议。Codable 自不必多说，用于将原始数据解析成您定义的数据模型。而 Identifiable 协议则最早是在 SwiftUI 中出现的，在 Swift 5.1 被加入到 Swift 标准库中的。

### Identifiable

从字面看应该不难理解，它用来表示所关联的数据结构具有唯一标识。其定义如下：

```swift
public protocol Identifiable {
    associatedtype ID : Hashable
    var id: Self.ID { get }
}
```

在之前版本的 SwiftUI 中，您使用 ForEach 遍历 Array 时需要提供一个 ID 来标识 Element 的唯一性：

```swift
ForEach(photos.items, id: \.id) { item in
  PhotoView(photo: item)
}
```

当你的 Model 遵循了 Identifiable 协议就可以直接使用：

```swift
ForEach(photos.items) { item in
  PhotoView(photo: item)
}
```

下面是苹果给出的定义，Identifiable 的唯一性是**不限定持续时间和使用范围**，可以是下面的任意场景：

- 保证始终唯一（例如：UUID)。
- 每个环境永久唯一（例如：database record keys)。
- 在进程的生命周期内是唯一的（例如：global incrementing integers)。
- 在对象的生命周期内是唯一的（例如：object identifiers)。
- 在当前集合中是唯一的（例如：collection index)。

另外有意思的是，Identifiable 将引用语义扩展到值类型，Swift 为 AnyObject 提供了默认实现：

```swift
extension Identifiable where Self: AnyObject {
    var id: ObjectIdentifier {
        return ObjectIdentifier(self)
    }
}
```

> 关于 Identifiable 更详细的讨论强烈推荐 Mattt 的这篇文章 [Identifiable](https://nshipster.com/identifiable/)。 



### User Interface

展开下一个 Model 前，预览一下您要做出的星云 Demo 的效果：

![10019-02-view-spacephoto](https://images.xiaozhuanlan.com/photo/2021/08361380fc401b892b7cdc5f92a87f39.png)

### ObservableObject

接着使用 `ObservableObject` 来声明 Photos 用于监听数据的变更。

![10019-03-model-photos](https://images.xiaozhuanlan.com/photo/2021/17cf33103d2b5f84b6547161bc459687.png)

当有数据变更时，`ObservableObject` 中声明了 **@Published** 的属性将会收到 publisher 通过 `objectWillChange` 发来的通知。

我们先提供一个简单的 PhotoView 来展示每个星云的 title：

```swift
struct PhotoView: View {
    var photo: SpacePhoto
    var body: some View {
        Text(photo.title)
	  }
}
```

接着我们在 Catalog 列表中来消费 photos。

![10019-04-view-photo](https://images.xiaozhuanlan.com/photo/2021/09ea86ded31c625d5e17464d414b94d0.png)

逻辑也很简单，仅需在对应属性前增加 `@StateObject` 来表明 photos 数据是可变化的。

上面的 Preview 效果就是纯文本版本的 Catalog list。这个最终效果是使用了两个特性：

- **.listStyle(.plain)**
- **.listRowSeparator(.hidden)**

使用前后比对如下：

![10019-04-new-api](https://images.xiaozhuanlan.com/photo/2021/efc6d06cb659daa3d1ac8d9afe70ee4b.png)



## SwiftUI & MainActor

![10019-06-run-loop](https://images.xiaozhuanlan.com/photo/2021/896c42a72217cd868f5966539f8c391d.png)

在 WWDC20 的 “[Data essentials in SwiftUI](https://developer.apple.com/videos/play/wwdc2020/10040/)” 中，Raj 谈到了 SwiftUI 的生命周期，而 run loop 则是驱动该生命周期的工具。在 Swift 5.5 中 run loop 将运行在 **MainActor** 中。



### Actor

> 关于 Actor 详细信息，可查看 “[Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/)”。

这里做简单了解，Actor 是定义成一个遵循 Sendable 的协议：

```swift
public protocol Actor : AnyObject, Sendable { }

public protocol Sendable { }
```

Swift 提供了 `actor` 关键字，同时也是一种新的具体名义类型，同 class、struct、enum 等。

```swift
actor Photos {
	var items: [SpacePhoto]
	...
}
```

Actor 在概念上类似于在并发环境中可以安全使用的类。 因为 Swift 确保在任何给定时间只能由单个线程访问 actor 内的可变状态，这有助于在编译器级别消除各种严重的错误。

而 main actor 是 actor 的一个全局单例，其声明如下：

```swift
@globalActor public actor MainActor {
    public static let shared: MainActor
}
```

我们通过添加 `@MainActor` 修饰后，Swift 会确保所修饰的代码会执行在主线程中。



### SwiftUI run loop

run loop 过程，应用会不断接收用户事件，更新模型，最终将 SwiftUI 视图呈现到屏幕上。这里把每次循环的更新称作 “ticks of the run loop“。让我们展开这个循环，每个刻度表示一个循环，以便您可以连续查看多个刻度。

![10019-06-run-loop-tick](https://images.xiaozhuanlan.com/photo/2021/e1f73d0eda14bda16cfdd015f63a6582.png)

在 SwiftUI 中，ObservableObjects 可以通过一些有趣的方式与 SwiftUI run loop 交互。让我们回到 Photos ObservableObject 并查看 updateItems 方法。

![10019-07-run-loop-code](https://images.xiaozhuanlan.com/photo/2021/be9d43a3d0a5de692a42c177e126be88.png)

在上图表示的是 `updateItems` 方法的执行在 SwiftUI run loop 中的状态变化，具体如下：

- 蓝色矩形框：表示在一个 run loop 周期内执行 `updateItems` 方法的耗时。
- 橙色部分：表示获取到新数据后，会通过 publiser 的 `objectWillChange` 通知观察者有 photos 更新；
- 绿色 Snapshot：SwiftUI 在收到数据更新的通知后会对当前状态进行快照，为后续对比准备；
- 紫色部分：表示 items 数据已更新；
- 绿色 tick：在下一个 run loop tick 节点，SwiftUI 同样进行 items 快照，并与之前快照对比。

从 SwiftUI 视图中调用 updateItems 时，这些逻辑均在 `MainActor` 上被顺序执行。不过上面描述的属于理想状态，很多时候您的数据更新会产生延迟。

![10019-08-run-loop-blocking](https://images.xiaozhuanlan.com/photo/2021/33fffed474bb400c5afc05ac55efd513.png)

上述为发生了主线程 block 的情况，错失一次 tick 的刷新机会，对于用户而言则算是一次障碍。过去解决方式就是使用 dispatch queues

![10019-09-poor-dispatch](https://images.xiaozhuanlan.com/photo/2021/6575c56ff7d0e646d6ecd2fa89354983.png)

将 `updateItems` 的逻辑切换到了异步线程执行，而这将导致 run loop 的快照状态产生了变化。

![10019-09-dispatch](https://images.xiaozhuanlan.com/photo/2021/594509d3bd14626d7ae7226a61d9f4e4.png)

可以看到在下一个 run loop 周期的 tick 节点，由于 `fetchPhotos` 的异步更新，SwfitUI 未能正确捕捉到 `objectWIllChange` 变化，导致快照数据对比结果为未更新。而如果您能保证如下状态的顺序执行，则可以避免上述的情况。

1. `objectWillChange`
2. The state changes
3. The run loop ticks

解决方案就是：

![10019-11-await](https://images.xiaozhuanlan.com/photo/2021/fe96e5d76827a72c339d1d34e035f0e4.png)

### Using await

![10019-12-await-code](https://images.xiaozhuanlan.com/photo/2021/5403b6465466d88e59edc06343fe7855.png)

通过 `async / await` 的使用，使得状态变更能够在主线程被及时感知。上图中跳过的一段 tick 周期就是由于网络延迟等导致的 tick 空转。接下来就是实现 `fetchPhotos` 方法，逻辑很简单就是遍历 photos 然后获取对应 entity 和 image 即可：

```swift
@MainActor
class Photos: ObservableObject {

    @Published private(set) var items: [SpacePhoto] = []

    // Updates `items` to a new, random list of photos.
    func updateItems() async {
        let fetched = await fetchPhotos()
        items = fetched
    }

    // Fetches a new, random list of photos.
    func fetchPhotos() async -> [SpacePhoto] {
        var downloaded: [SpacePhoto] = []
        for query in Photos.keys {
            let url = SpacePhoto.request(key: query)
            if let photo = await fetchPhoto(from: url) {
                downloaded.append(photo)
            }
        }
        return downloaded
    }

    func fetchPhoto(from url: URL) async -> SpacePhoto? {
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoder = JSONDecoder()
            let response = try decoder.decode(NASAResponse.self, from: data)
            return response.collection.items.randomElement()?.data
        } catch {
            print(error)
            return nil
        }
    }
}
```

>  这里提供的代码与官方 Demo 展示的 Photos 数据获取 API 稍有不同，本文采用了 NASA 提供的 [image search API](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf)。

这里您用 `@MainActor` 来修饰了 Photos 类，之后 Swift Complier 会保证所有 Photos 的属性和方法都将通过  main actor 来访问。

```swift
updateItems() async ->
	fetchPhotos() async ->
		fetchPhoto(from:) async ->
```

可以看到三个方法都是使用了 async 关键字来声明其为异步执行。而对于 async 声明的方法，对应的需要配上 **await** 关键字。

最后就差 updateItems 的调用，让我们在 CatalogView 中来完成最后一步。



## New concurrency tools

最后一节，我们来介绍几个支持异步更新的 API，为您的程序添加更友好的用户体验。

### Task & Refreshable

SwiftUI 为 View 提供了新的入口来执行任务。

```swift
struct CatalogView: View {

    @StateObject private var photos = Photos()

    private var photoKey = [String : SpacePhoto]()

    var body: some View {
        NavigationView {
            List {
                ForEach(photos.items) { item in
                    PhotoView(photo: item)
                        .listRowSeparator(.hidden)
                }
            }
            .navigationTitle("Catalog")
            .listStyle(.plain)
            .refreshable {
                await photos.updateItems()
            }
        }
        .task {
            await photos.updateItems()
        }
    }
}
```

当 View 展现屏幕上时候会触发任务的执行，在 View 消失时则会取消对应的任务。其定义如下：

```swift
extension View {
    @inlinable public func task(_ action: @escaping () async -> Void) -> some View
}
```

另外一个 New API 是 `refreshable`，本质上是一个 [ViewModifier](https://developer.apple.com/documentation/swiftui/viewmodifier)，这里我们给 List 添加上 `refreshable` 后，它就能响应用户的下拉刷新动作。

![10019-14-refreshable](https://images.xiaozhuanlan.com/photo/2021/836a15c74bac2f468481b88bb5e601f5.gif)



### AsyncImage

AsyncImage 可以帮助您实现异步下载和展示图片，再结合上 ProgressView 让 Image 在下载过程中作为 placeholder 展示。

![10019-13-fetch-image](https://images.xiaozhuanlan.com/photo/2021/2d203f5116c9b0be79acabc3fc7f32c0.png)

### Custom Button Action

同 AsyncImage 一样的思路，您可以为 SaveButton 添加 ProgressView，当图片正在保存时以展示 ProgeessView 作为中间状态。

```swift
struct SavePhotoButton: View {

    var photo: SpacePhoto
    @State private var isSaving = false

    var body: some View {
        Button {
            async {
                isSaving = true
                await photo.save()
                isSaving = false
            }
        } label: {
            Text("Saved")
                .opacity(isSaving ? 0 : 1)
                .overlay {
                    if isSaving {
                        ProgressView()
                    }
                }
        }
        .disabled(isSaving)
        .buttonStyle(.bordered)
        .controlSize(.small) // .large, .medium or .small
    }
}
```

效果如下：

<img src="https://gitee.com/looseyi/blog-image/raw/master/uPic/10019-15-save.gif" alt="10019-15-save" style="zoom:50%;" />

#### Tips

由于本文脱水过程 Apple 还未提供 Session 中的示例工程，这里作者参照视频中的代码提供了功能完备的 [Demo Project](https://github.com/looseyi/WWDC-SampleCode.git)，有兴趣的小伙伴自取。记得用 Xcode 13 打开 😊。

## 总结

这里您看到了 SwiftUI 与 Swift 的并发特性很好地集成在一起，默认情况下为用户提供了最佳行为。
在许多情况下，您只需要使用 `await` 来使用并发的能力。将 `ObservableObject` 标记为 `@MainActor`，以便更可靠地检查您的对象是否以适合您的视图的方式更新。

- 使用 SwiftUI 的 API 附加功能，以最少的工作量编写安全且高性能的并发应用程序。
- 使用 `AsyncImage` 并发加载图像。
- 使用 `refreshable` 修饰符添加到视图层次结构中，以允许用户手动刷新数据。
- 就像您在 Save 按钮上看到的那样，您可以在自己的自定义视图中使用 Swift 的新并发功能。

众所周知，在计算机领域并发是很棘手的一个难题，现在您拥有了管理应用程序中这种复杂性的工具。我们希望您喜欢并了解 Swift 5.5 和 SwiftUI 中出色的新并发工具，我们期待看到您使用它们解决应用程序中棘手问题。


## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
