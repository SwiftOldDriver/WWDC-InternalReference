# 认识 Swift 的 Async/Await

> 作者：VincentMing，目前在字节跳动剪映担任客户端开发。
> 
> 审核：四娘，iOS 开发，老司机技术周报成员。目前就职于格隆汇，对 Swift 和编译器相关领域感兴趣
>
> 本文基于 session 10132 - [Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132/) 整理

作为 iOS 程序员，相信大家都用过很多使用完成回调的代码，比如 UIKit 中的 `dismiss(animated:completion:)` 方法，在关闭视图控制器后执行回调，或者 AVPlayer 的 `func seek(to:completionHandler:)` 方法，在播放器跳转完成后执行回调。

无论是网络请求、磁盘 IO、视图刷新等，都消耗一定的时间才能完成相关操作。在这段时间内，程序通常有两种选择，要么停在原地并等待操作结果的返回，再执行后续逻辑，即同步调用；要么在这段时间执行其他任务，在耗时操作完成时执行先前注册的回调逻辑，即异步调用。同步调用会让代码写起来更简单，但可能浪费性能、甚至造成界面卡死等不好的用户体验。异步调用则可以更充分地利用系统资源，在相同时间内响应更多的任务，缺点则是当多个异步调用衔接或嵌套时，尤其涉及到错误处理时，往往会让代码变得复杂而难以驾驭。

## 举个栗子🌰

![](https://images.xiaozhuanlan.com/photo/2021/3a4b33a3508e6d15a2aa65c20cea28d8.png)

我们看一个具体的例子。上图是我们想做的一个 demo 程序，这是一个简单的列表，每行会显示一张存储在服务端的 icon 图片。我们来分析下 icon 图片是如何显示出来的。如下图所示，一共可以分为 4 个步骤：

   1. 首先我们根据图片 id 生成网络请求；
   2. 然后把请求发送给服务器，并等待服务器返回结果；
   3. 根据下发的 Data 构建 UIImage；
   4. 最后准备缩略图，并在完成时执行`fetchThumbnail`函数预先注册的`completion: @escaping (UIImage?, Error?) → Void`回调。

![](https://images.xiaozhuanlan.com/photo/2021/fb4d1bcda193cdfb5ccc380d1a008fe1.png)

具体的代码如下所示。首先我们可以注意到，由于多次使用回调处理，显示缩略图这个简单的任务对应的代码，出现了多层缩进，给阅读代码和查找问题带来一定阻碍。其次，这段代码存在严重的 bug，你注意到了么？

```swift
func fetchThumbnail(for id: String, completion: @escaping (UIImage?, Error?) -> Void) {
    let request = thumbnailURLRequest(for: id) 
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completionHandler(nil, error)
        } else if (response as? HTTPURLResponse)?.statusCode != 200 {
            completion(nil, FetchError.badID)
        } else {
            guard let image = UIImage(data: data!) else {
                return
            }
            image.prepareThumbnail(of: CGSize(width: 40, height: 40)) { thumbnail in
                guard let thumbnail = thumbnail else {
                    return
                }
                completion(thumbnail, nil)
            }
        }
    }
    task.resume()
}
```

揭晓答案，如下面代码所示，在两处`guard/return`代码里，没有针对发生错误的场景执行`completion`回调，其结果可能是，图片的 loading 动画一直转，就是不显示图。从业务角度看，`fetchThumbnail`函数的任何一个 return 都应该执行`completion`回调；但从编译层面，Swift 没办法保证return前都执行了回调处理，即我们不能借助Swift的错误处理机制在编译时发现这样的问题。因为对 Swift 来说，`completion`回调只是一个普通的闭包，尽管我们希望它总是执行，但 Swift 没法强制必须如此。所以，当使用完成回调的方式异步处理任务时，需要开发者小心谨慎，确保任何情况下完成回调总是被执行。

两个同步任务（步骤1和3），两个使用完成回调的异步任务（步骤2和4），我们成功完成了相关代码的书写，而这段代码约 20 行、且容易引入隐蔽的 bug。我们只是希望这4个任务按顺序执行，但这段代码容易写错，难以理解，且由于混杂着错误处理和各种回调，没法一眼看清楚其意图。以下是修复 bug 之后的代码。

```swift
func fetchThumbnail(for id: String, completion: @escaping (UIImage?, Error?) -> Void) {
    let request = thumbnailURLRequest(for: id) 
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completionHandler(nil, error)
        } else if (response as? HTTPURLResponse)?.statusCode != 200 {
            completion(nil, FetchError.badID)
        } else {
            guard let image = UIImage(data: data!) else {
                completion(nil, FetchError.badImage)
                return
            }
            image.prepareThumbnail(of: CGSize(width: 40, height: 40)) { thumbnail in
                guard let thumbnail = thumbnail else {
                    completion(nil, FetchError.badImage)
                    return
                }
                completion(thumbnail, nil)
            }
        }
    }
    task.resume()
}
```

如何让我们的代码更安全呢？我们可以使用标准库的`result`类型，不过这也会让代码更丑陋也更长一些。我们也可以使用类似`Futures`和`Promises`的技巧来让异步编程更容易驾驭，也更安全，比如热门的第三方库`PromiseKit`。但其实，我们可以做得更好，这就是 Swift 5.5 全新引入的`async/await`。

## 用`async/await`改造我们的程序🧑🏻‍💻

闲话少说，使用`async/await`的完整版的代码如下所示。上个版本，我们需要约 20 行代码，有 5 层缩进结构；新版本只有 6 行代码，且只有一层代码结构，没有任何额外的缩进。当你忽略两行`guard/return`代码后，会发现新版本的代码，就像一段英文段落一样容易阅读理解：

   1. 创建缩略图URLRequest；
   2. 发送网络请求并接收服务端返回；
   3. 根据返回的 data 创建 UIImage；
   4. 返回获取到的缩略图。

```swift
func fetchThumbnail(for id: String) async throws -> UIImage {
    let request = thumbnailURLRequest(for: id)
    let (data, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw FetchError.badID }
    let maybeImage = UIImage(data: data)
    guard let thumbnail = await maybeImage?.thumbnail else { throw FetchError.badImage }
    return thumbnail
}
```

现在我们来详细分析下这段代码。

支持异步的函数需要标记为`async`，如果该函数可能失败，则 async 写在 throws 前面；否则写在函数返回值前的箭头前面。创建 URLRequest 没太多可说，接着我们使用`data(for: request)`处理从服务端下载图片数据，这里同时使用了`try`和`await`。由于该方法是`awaitable`的，我们可以使用 await，让线程在执行到这里后挂起，并释放出资源去执行其他任务，直到网络请求的结果返回时，再重新拾起并继续执行后续代码。

**await 的神奇之处就是，可以像写同步调用那样去写异步调用。**再和 Swift 特有的 guard 机制结合，可谓如虎添翼。还记得之前的代码里，我们需要检查错误并明确的调用`completion`回调么？现在我们只需要一个try就解决了。就像调用有 throws 标记的函数需要 try 一样，调用 async 标记的函数，需要用await。如果一个表达式内含有多个 async 函数调用，我们只需要一次 await，就像有多个 throws 函数调用的表达式也只需要一个 try 一样。如果同时使用 try 和 await，记得把 try 放在前面。

接着我们再看看图片的缩略图是如何获得的。注意，这里 await 后面跟随的是`UIImage.thumbnail`属性，而不是一个方法。是的，我们还可以把一个属性声明成`async属性`，这样就可以利用 await 来简化异步处理了。

async属性，需要有明确的getter，并且用 get async 修饰，在其内部可以用 await 返回结果。其次，async 属性不能有 setter，即只能是可读属性。具体示例如下面代码段所示：

```swift
extension UIImage {
    var thumbnail: UIImage? {
        get async {
            let size = CGSize(width: 40, height: 40)
            return await self.byPreparingThumbnail(ofSize: size)
        }
    }
}
```

## async函数背后的原理

接下来，我们需要理解 async 函数背后的原理。

先来看看普通函数执行流程。如下图所示，当`fetchThumbnail`调用`thumbnailURLRequest`时，同时也将线程控制权交给了后者。而`thumbnailURLRequest`执行结束后，则会主动交回控制权给调用它的`fetchThumbnail`，从而继续执行前者的逻辑。普通函数交出对线程的控制权的唯一方式，是该函数执行结束。而其调用者，这里的`fetchThumbnail`，则是其唯一可以交回控制权的对象。

![](https://images.xiaozhuanlan.com/photo/2021/969c3ad2f149a411fad557cb22ae3a35.png)

调用 async 函数时，控制权的传递则与之不同。如下图所示，`fetchThumbnail`调用 async 方法`data(for: request)`时，同时也将线程控制权交给了后者。`data(for: request)`在执行过程中，可能会挂起，并把控制权交给操作系统，而不是它的调用者`fetchThumbnail`，当 async 方法挂起时，其调用者同时也被挂起了。

函数通过挂起，告诉操作系统：我知道你有很多事情要做，你来决定做什么吧！多么具有合作精神。当函数挂起时，操作系统可以把释放出来的资源拿去做其他事情，比如响应用户的按钮点击行为、喜欢一个评论等。在未来某个时间点，系统可能会决定当前最重要的工作就是继续执行之前挂起的函数。此时async函数重新获得线程的控制权，并接着执行自己的任务，如果需要，它还可以再次挂起，想多少次都行。不过，标记 async 的函数只是有可能会挂起，不代表一定会。同理如果你在代码里看到`await`，也不代表在此处一定会挂起。当async方法执行完毕后，它会把控制权再交还给它的调用者`fetchThumbnail`，并继续执行直到结束退出，从而完成整个 async 函数的调用过程。

![](https://images.xiaozhuanlan.com/photo/2021/0bc4943879c9aa2ea82e0c1c4a00ea4f.png)

需要注意的是，在 async 函数挂起时，程序的状态可能会发生显著的变化。当然对于完成回调也是如此，但由于它会缩进代码，所以你会更容易注意到这些变化。所以使用`async/await`时，要留意 await 关键词，它表明当前函数可能在这里挂起，而不是畅通无阻的执行下去，甚至从挂起恢复回来时，函数可能跑到另外一个线程上去了。关于需要注意的这些事项，请参考[Session 10133 - 用Swift的actors保护可变状态](https://developer.apple.com/videos/play/wwdc2021/10133/)（[《【WWDC21 10132/10133/10134】认识 Swift 中的异步与并发》](https://xiaozhuanlan.com/topic/8627905413)）。

总结一下，当你标记一个函数为`async`时，同时意味着它可以挂起。在 async 函数中，使用`await`关键词标记在哪里可以一次或多次挂起。当 async 函数挂起时，线程并未阻塞，系统会自由安排其他任务。有时后启动的任务，可能被先执行。即你的程序状态可能在挂起时发生显著变化。当 async 函数恢复执行时，其返回的结果会自然融入到 async 函数的调用者，并在先前挂起的地方接续执行。

## 认识 Async 序列

获取缩略图的例子中，还有以下代码段，把 await 用在了 for 循环中，这种可以在循环中 await 的序列，我们称之为来 async 序列 (async sequence)。我们可以像使用普通序列那样使用 async 序列，唯一区别是它所提供的元素是通过异步的方式交付的。也正因为其是异步交付，所以需要使用 await 关键词来获取下一个元素。

```swift
for await id in staticImageIDsURL.lines {
    let thumbnail = await fetchThumbnail(for: id)
    collage.add(thumbnail)
}
let result = await collage.draw()
```

我们再来看看下面这个有趣的例子。第一行`endpointURL`的内容是最近的地震信息。通常下载数据是个异步任务，消耗一定时间。但这里，我们不想等到全部都下载好，相反我们想边接收信息边展示它们。这就要用到新的`async/await`特性了。我们处理的是 csv 格式的文件，它是由逗号分隔而成的格式化文本，每一行(line)文本是完整的一行(row)数据。因为由很多行文本组成的 async 序列会释放出它收到的每一行文本，所以我们有机会随着收到数据的进度动态把它们呈现出来，让程序用起来响应迅速跟手。

更棒的是，你可以像处理熟悉的普通序列那样处理这个新的异步场景。比如，你可以使用`for-await-in`语法来遍历 async 序列，而像`map`、`filter`、`reduce`以及下面代码中的`dropFirst`等函数，去处理 async 序列。

```swift
@main
struct QuakesTool {
    static func main() async throws {
        let endpointURL = URL(String: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv")!

        // 跳过首行 因为是header描述不是地震数据
        // 接着遍历提取强度、时间、经纬度信息
        for try await event in endpointURL.lines.dropFirst() {
            let values = event.split(separator: ",")
            let time = values[0]
            let latitude = values[1]
            let longtitude = values[2]
            let magnitude = values[4]
            print("Magnitude \(magnitude) on \(time) at \(latitude) \(longtitude)")
        }
    }
}
```

概括的说，异步序列就是对随着时间推移如何产生值或对象的一种描述方式。所以 async 序列可能有零个或多个值。由于产生值的过程是异步的，所以也可能出错。当错误发生时，也是 async 序列也处于终止状态，错误发生后，async 序列会对它的迭代器的后续 next 调用都返回 nil。

我们先来看看普通的 for 循环是如何工作的。下面的代码段前半部分是 for in 循环的代码，后半部分则是编译器在处理for in循环代码时所做的大致转换。首先创建了一个迭代器变量`iterator`，然后使用 while 循环不断的取出迭代器的下一个元素。当获取下个元素失败时，也就会退出 while或for循环了。

```swift
// 遍历序列
for quake in quakes {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}

// 编译器如何处理for循环遍历
var iterator = quakes.makeIterator()
while let quake = iterator.next() {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}
```

我们再来看看 for 循环的 async 版本，编译器做了哪些转换。如下面代码段所示，相比普通的 for 循环的处理转换，变化只有一个，即把`next`方法改成了 async 方法。相应地，我们使用了 await 来承接 async 版本的 next 方法。其他都和普通for循环没有区别。由于变化如此之小，只要你之前可以熟练使用序列，那么你就已经很清楚如何使用 async 序列了。

```swift
// 遍历async序列
for await quake in quakes {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}

// 编译器如何处理for循环async序列
var iterator = quakes.makeAsyncIterator()
while let quake = await iterator.next() {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}
```

你可以使用`for-await-in`来遍历 async 序列，如果 async 序列可能抛出异常，则可以使用`for-try-await-in`来遍历之。循环体内的 break 和 continue 都正常工作。正如下面代码所示。

```swift
for await quake in quakes {
    if quake.location == nil {
        break
    }
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}

for await quake in quakes {
    if quake.depth > 5 {
        continue
    }
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}
```

对于可能抛出错误的 async 序列，编译器会从语言层面确保你要么将该潜在的错误继续抛出，要么使用`do-catch`来处理错误，否则代码就无法通过编译。

```swift
do {
    for try await quake in quakeDownload {
        ...
    }
} catch {
    ...
}
```

有时我们需要并发的运行两个迭代器，只需要如下面代码所示，创建 async 任务，把要执行的迭代包在其中。这对于可能无限运行下去的迭代器也很有用，因为你不仅可以并发执行多个 async 任务，还能稍后在外部使用`cancel`方法提前终结任务。

```swift
// 异步遍历每个元素
let iteration1 = async {
    for await quake in quakes {
        //...
    }
}
//async序列可能抛出错误
let iteration2 = async {
    do {
        for try await quake in quakeDownload {
            //...
        }
    } catch {
        //...
    }
}
//... 一段时间后
iteration1.cancel()
iteration2.cancel()
```

iOS15、macOS Monterey 等提供了很多 async 序列的API，我们来看看其中最精彩的一些。从文件中读取字节是很常见的一个任务。FileHandle 现在有了新的`bytes`属性，能提供字节流的 async 序列。配合 async 序列的扩展能力——把字节流变成`lines`，我们就可以从文件中异步地获得逐行内容并进行处理了。

```swift
// 从FileHandle异步读取bytes
public var bytes: AsyncBytes

for try await line in FileHandle.standardInput.bytes.lines {
    
}
```

处理文件的需求太常见了，我们决定URL需要同时有`bytes`和`lines`两个 async 属性，无论是从本地文件还是从网络请求。我想这些属性会让之前比较繁琐的任务变得简单又安全。

```swift
// 从URL中异步读取bytes或lines
public var resourceBytes: AsyncBytes
public var lines: AsyncLineSequence<AsyncBytes>

let url = URL(fileURLWithPath: "tmp/somefile.txt")
for try await line in lines {
    
}
```

除了文件和 URL，通知也支持 async 序列了。我们在await第一个匹配`storeUUID`的 RemoteChange 通知。配合使用`first-where`和通知的 async 序列，我们可以实现非常干净的设计模式让原本表达起来非常复杂的逻辑变得紧凑而易读。

```swift
// 异步await通知
public func notifications(named: Notification.Name, object: AnyObject) -> notifications

let center = NotificationCenter.default
let notification = await center.notifications(named: .NSPersistentStoreRemoteChange).first {
    $0.userInfo[NSStoreUUIDKey] == storeUUID
}
```

如果上述这些还不够酷，下面还有一系列新的操作 async 序列的 API。我们前面已经提到了一些，如`dropFirst`和`first-where`，但远不止这些。差不多你能想到的每个可用于普通序列的操作接口，都有其 async 的版本。下图只是列出其中一部分。

![](https://images.xiaozhuanlan.com/photo/2021/478f40352eccf2189ba6b5491e5b27f1.png)

## 如何创建自己的 async 序列

前面提到的 API 都很酷，语法也非常简洁，但我如何创建自己的 async 序列呢？有几种方法来实现 async 序列，现在我们只关注怎么去适配已有的代码。有一些设计模式和 async 序列配合使用效果非常好，比如被调用多次的闭包，以及一些代理方法等。

任何不需要回应、只是通知新的值产生了的场景，都可能是实现 async 序列的潜在候选者。这些设计模式很常见，你的应用中可能已经在使用它们了。下面代码中的 monitor 是很常见的Handler模式，它有一个 handler 属性，一个开始和结束方法。可能的使用场景是这的：monitor 创建了，其handler属性被赋值，然后 monitor 启动并把监控到的地震信息发送给handler去处理。而这之后，monitor 可能会停止发送监控事件。

```swift
// Handlers经常是很棒的AsyncSequence候选者
let monitor = QuakeMonitor()
monitor.quakeHandler = { quake in
    ...
}
monitor.startMonitoring()
...
monitor.stopMonitoring()
```

如下面代码所示，我们可以继续使用相同的接口，但稍加改造使其可以使用`AsyncStream`类型。只需要少量代码，就可以创建一个 async 序列。创建 AsyncStream 实例时，需要提供相应的元素类型和构造闭包。闭包中的`continuation`可以多次产生值，直到完成或处理提前终止。这意味着 monitor 可以在构造闭包内创建，handler 可以向`continuation`提供产出的地震，`onTermination`则用来处理取消操作和清理工作。接下来我们启动 monitor 开始监控。上图我们在使用的代码可以很容易的包裹在 AsyncStream 的构造闭包中，这避免了在每个使用场景下都重复相同的代码逻辑。

```swift
// 使用AsyncStream把已有回调改造成AsyncSequence
let quakes = AsyncStream(Quake.self) { continuation in
    let monitor = QuakeMonitor()
    monitor.quakeHandler = { quake in
        continuation.yield(quake)
    }
    continuation.onTermination = { _ in
        monitor.stopMonitoring()
    }

    monitor.startMonitoring()
}
```

以下则是使用刚刚创建的 AsyncStream 实例的具体场景，比如可以用 filter 或 for-await-in 来遍历，这会让你更专注代码的真正意图，而不必担心重复的管理和组织对数据的操作，因为我们把所需要的一切都封装在了 AsyncStream 实例中。

```swift
// 使用AsyncStream
let significantQuakes = quakes.filter { quake in
    quake.magnitude > 3
}

for await quake in significantQuakes {
    ...
}
```

`AsyncStream`非常适合把已有代码转换成 async 序列，它很好的处理了安全性，迭代器，取消，甚至还有 buffer。它不仅适合创建你自己的 async 序列，还适合作为你的 API 的返回值类型，如下面的代码段所示。如果需要处理可能产生错误的 async 序列？只要用`AsyncThrowingStream`类型即可。

```swift
// 你好AsyncStream
public struct AsyncStream<Element>: AsyncSequence {
    public init(
        _ elementType: Element.Type = Element.self,
        maxBufferedElements limit: Int = .max,
        _ build: (Continuation) -> Void
    )
}
```

async 序列是非常强大的工具，它既安全，又容易上手，适合处理产生多个异步值的场景。如果你会用序列，那么你已经会用 async 序列了。非常期待你把 async 序列应用到自己的代码中。

## 在 URLSession 中使用 async/await

Swift并发的优点是可以让你的 代码线性化、简洁，同时支持原生的错误处理。接着我们看看 iOS 15 和 macOS Monterey 给系统网络库 URLSession 带来了哪些 Swift 并发特性，如何在 URLSession 中使用 async/await。下图是我们要做的 demo 程序。它是个共享可爱狗狗图片的应用，用户还可以给图片点赞。

![](https://images.xiaozhuanlan.com/photo/2021/9def3d4f1bcd3e5ad89303dc6c0d151c.png)

下面是使用完成回调的代码，似乎看起来很简单直接，但其中至少有3个错误，你能发现么？

```swift
// 从完成回调获取照片
func fetchPhoto(url: URL, completionHandler: @escaping (UIImage?, Error?) -> Void) {
    let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
        if let error = error {
            completionHandler(nil, error)
        }
        if let data = data, let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
            DispatchQueue.main.async {
                completionHandler(UIImage(data: data), nil)
            }
        } else {
            completionHandler(nil, DogsError.invalidServerResponse)
        }
    }
    task.resume()
}
```

首先分析下控制流的方向，如下图所示，首先创建了 URLSession 的`dataTask`，然后跳到最后一行执行`task.resume()`方法，在 dataTask 方法的完成回调中，首先处理可能存在的错误，再处理获取到的数据，最后从 DispatchQueue 中的完成回调中跳出。可以看到代码的控制流在跳来跳去。这还只是一个最简单的任务，可想而知如果任务复杂时，代码控制流会多么混乱而难以追踪。

再来看看线程，对于这么一小段代码而言，竟然出奇的复杂。总共有 3 个不同的执行上下文。最外层可能执行在任意线程，或者是该方法的调用者所在的队列，而 URLSessionTask 的完成回调则执行在 session 的代理队列上，而最终的完成回调执行在主队列上。而对于线程问题，编译器无能为力，所以作为开发者的我们要格外小心，去避免线程相关的问题，比如数据争用。这段代码还有至少 3 个错误：

   1. 第一个完成回调后缺少return，导致如果发生错误，完成回调被调用了两次；
   2. 第一个和第三个完成回调没有执行在主队列上，这可能引起潜在的bug，比如触发了UI更新；
   3. 第二个完成回调内使用 data 构建 UIImage 的时候，可能失败，那么就执行了`completionHandle(nil, nil)`，这很可能不符合预期。

![](https://images.xiaozhuanlan.com/photo/2021/d8201f8ae95c38a29a6a23bfac4f5d2c.png)

以下这段代码则是使用 async/await 的新版本代码，它不仅明显更简洁，代码控制流是从上到下线性的，而且我们知道该方法中的所有代码处在同一个并发上下文中，所以也无需担心线程问题。这里我们用到了 URLSession 中心的 async 的 data 方法。它会挂起当前执行上下文，但不是阻塞，当收到返回的数据时，则会成功返回图片数据或抛出错误。throw 的使用，让该方法的调用者可以利用 Swift 原生错误处理解决可能出现的问题，在编译层面就保障了代码更安全。最后，由于返回值是非可选类型的 UIImage，当我们尝试返回可选类型时，编译器就会报错，迫使我们正确的解决图片为nil的问题。

```swift
// 使用async/await来获取照片
func fetchPhoto(url: URL) async throws -> UIImage {
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else { 
        throw DogsError.invalidServerResponse
    }

    guard let image = UIImage(data: data) else {
        throw DogsError.unsupportedImage
    }

    return image
}
```

我们再来看看 URLSession 中的方法签名和简单用例。下面是新的`data`方法，它接受`url`或`URLRequest`作为参数，和已有的`dataTask`方法是等价的：

```swift
// URLSession.data

func data(from url: URL) async throws -> (Data, URLResponse)
func data(for request: URLRequest) async throws -> (Data, URLResponse)

let (data, response) = try await URLSession.shared.data(from: url)
guard let httpResponse = response as? HTTPURLResponse, 
    httpResponse.statusCode == 200 /* OK */ else { 
    throw MyNetwordingError.invalidServerResponse
}
```

下面是用于上传数据或文件的`upload`方法的签名和简单用例。它和已有的`uploadTask`方法是等价的。记得在使用时，把`request.httpMethod`设置为`POST`，因为默认的`GET`不支持上传。

```swift
// URLSession.upload

func upload(for request: URLRequest, from data: Data) async throws -> (Data, URLResponse)
func upload(for request: URLRequest, fromFile url: URL) async throws -> (Data, URLResponse)

var request = URLRequest(url: url)
request.httpResponse = "POST"

let (data, response) = try await URLSession.shared.upload(for: request, fromFile: fileURL)
guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 201 /* Created */ else {
    throw MyNetwordingError.invalidServerResponse
}
```

下面是新的`download`方法签名和简单用例。`download`方法把返回的 body 保存成了文件，而不是存储在内存中。和`downloadTask`方法不同，这些新的`download`方法不会自动删除下载的文件，所以别忘了在必要时手动删除。在下面这个例子里，我们把文件移动到了新的位置，以完成后续的处理。

```swift
// URLSession.download

func download(from url: URL) async throws -> (URL, URLResponse)
func download(for request: URLRequest) async throws -> (URL, URLResponse)
func download(resumeFrom resumeData: Data) async throws -> (URL, URLResponse)

let (location, response) = try await URLSession.shared.download(from: url)
guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 /* OK */ else {
    throw MyNetwordingError.invalidServerResponse
}

try FileManager.default.moveItem(at: location, to: newLocation)
```

URLSession 的 async 方法也支持提前中断取消，一种实现方式是使用并发任务句柄(Concurrency Task Handle)。如下面这段代码所示，我们使用`async{...}`来创建并发任务，一个接一个的加载网络资源。在最后一行，我们使用`cancel`方法取消了任务的执行。值得注意的是，并发任务(Concurrency Task)和 URLSessionTask 是不相关的，尽管它们都有"Task"字眼。

```swift
let handle = async {
    let (data1, response1) = try await URLSession.shared.data(from: url)
    ...
    let (data2, response2) = try await URLSession.shared.data(from: url)
    ...
}

handle.cancel()
```

前面提到的方法—— data、upload、download ——都是要获取到整个返回结果才能继续执行的，如果我们希望渐近地处理接收到的返回结果呢？那就要看 URLSession.bytes 方法大显身手了。下面这段代码是新增的 bytes 方法的签名。这些方法在收到网络返回的 headers 时就返回了，并且把返回的 body 接收成字节的异步序列(AsyncSequence)。

```swift
// URLSession.bytes 渐近地交付返回体

func bytes(from url: URL) async throws -> (URLSession.AsyncBytes, URLResponse)
func bytes(for request: URLRequest) async throws -> (URLSession.AsyncBytes, URLResponse)

struct AsyncBytes: AsyncSequence {
    typealias Element = UInt8
}
```

接下来我们一起看看如何在 demo 程序中使用新增的`bytes`方法。该程序可以看到每个狗狗图片有多少用户点赞喜欢，如果能实时更新这些点赞数值，程序就有更好的人机交互性了。为此，后端工程师创建了实时的事件节点，能够为客户端提供动态更新能力。我们先来看看服务端返回的实时事件节点长啥样。如下图所示，返回 body 的每一行是一小段 json 数据，描述针对该图片的更新情况，如点赞数。我们来使用`bytes`方法，动态更新狗狗点赞数据吧！

![](https://images.xiaozhuanlan.com/photo/2021/edc112fa9917838427b9caac509376be.png)

具体实现的代码如下图所示，我们简单分析下。`onAppearHandler`方法会在照片CollectionView出现时被调用。在该方法内，我们调用`URLSession.bytes`方法。注意返回值`let (bytes, response)`中的bytes的类型是`URLSession.AsyncBytes`，它支持渐近地消费网络返回body。第二行代码的guard负责处理网络返回错误。

我们希望一行行的处理收到的数据信息，因为每一行都是一张照片的更新信息。我们可以对类型是`URLSession.AsyncBytes`使用`lines`方法，来获得每一行的内容，注意在 for 循环头里用到了`try await`。在循环体内，我们解析 json 数据，再通过调用`updateFavoriteCount`更新 UI。注意，UI 更新需要在主actor上更新，这也是我在调用 async 方法`updateFavoriteCount`之前使用await的原因。再运行代码，点赞数会动态更新了。

![](https://images.xiaozhuanlan.com/photo/2021/5d852d7159745cecdaa143faa2561dcd.png)

URLSession 围绕代理模型设计的，能够提供对认证、metrics 等事件的回调处理。新的方法不再暴露底层task，那我们如何处理认证事件呢？如下面代码所示，之前提到的这些方法，还有新的版本，能够传入额外参数——基于 task 的特定代理，可以支持我们去处理上述事件的响应回调。

```swift
// URLSessionTask的delegate

func data(from url: URL, delegate: URLSessionTaskDelegate?)
func data(for request: URLRequest, delegate: URLSessionTaskDelegate?)

func upload(for request: URLRequest, fromFile url: URL, delegate: URLSessionTaskDelegate?)
func upload(for request: URLRequest, from data: Data, delegate: URLSessionTaskDelegate?)

func download(from url: URL, delegate: URLSessionTaskDelegate?)
func download(for request: URLRequest, delegate: URLSessionTaskDelegate?)
func download(resumeFrom resumeData: Data, delegate: URLSessionTaskDelegate?)

func bytes(from url: URL, delegate: URLSessionTaskDelegate?)
func bytes(for request: URLRequest, delegate: URLSessionTaskDelegate?)
```

如下面这段代码所示，在 Objective-C 中，我们也提供了 delegate 属性，来实现类似的功能。注意这里的属性是强持有的，直到 task 执行完毕或失败结束。值得注意的是，task 代理不支持 background URLSession。如果一个方法同时在 session 代理和 task 代理都实现了，task 代理的方法才会被调用。

```objective-c
// URLSessionTask的特定delegate

@interface NSURLSessionTask: NSObject

@property (nullable) id <NSURLSessionTaskDelegate> delegate;

@end
```

接下来我们看看如何在程序中使用 task 代理。首先创建`AuthenticationDelegate`类，遵循`URLSessionTaskDelegate`协议。其构造函数接受参数`SignInController`。`SignInController`中已经包含了一些方便完成用户认证的方法。接着，我们实现 URLSession 的 didReceive challenge 代理方法，并在其中回应基本的 HTTP 认证挑战，当然还有错误处理。

![](https://images.xiaozhuanlan.com/photo/2021/45f7f706bdf4f78d4d2691c6744fd3b8.png)

接下来我们实例化`AuthenticationDelegate`，并把该实例作为 data 方法的代理参数传入。具体如下图高亮行的代码所示。注意这里的代理方法只针对具体的 task 实例，当我们需要差别化处理 task 时，这个特性会很方便。

![](https://images.xiaozhuanlan.com/photo/2021/c51283a4d26e8b4a9cfe914b755efe2e.png)

接下来我们再点赞一张图片，会触发登陆界面弹起。当登陆完成后，会看到该图标被成功标记为已点赞。至此，我们成功的完成了狗狗图片 demo 程序的实时点赞能力。

## 如何在你的工程中使用`async/await`

首先看看如何在测试 async 代码。我们希望测试 async 代码就像测试同步代码一样简单，XCTest 让这一切成为可能。

```swift
class MockViewModelSpec: XCTestCase {
    func testFetchThumbnail() throws {
        let expectation = XCTestExpectation(description: "mock thumbnails completion")
        self.mockViewMode.fetchThumbnail(for: mockID) { result, error in
            XCAssertNil(error)
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 5.0)
    }
}
```

如上面代码所示，过去测试异步代码是冗长繁琐的，要经历设置期望、调用需要测试的API接口、完成期望、等待一段任意长的时间。现在只需要把方法标记为 async，用 try await 执行要测试的 API 接口，并用 XCTAssert 将其包起来。

```swift
class MockViewModelSpec: XCTestCase {
    func testFetchThumbnail() async throws {
        XCAssertNoThrow(try await self.mockViewMode.fetchThumbnail(for: mockID))
    }
}
```

接着我们看看如何改造已有代码，把`async/await`使用起来。下面代码是使用完成回调的老版本。

```swift
struct ThumbnailView: View {
    @ObservedObject var viewModel: viewModel
    var post: Post
    @State private var image: UIImage?

    var body: some View {
        Image(uiImage: self.image ?? placeholder)
            .onAppear {
                self.viewModel.fetchThumbnail(for: post.id) { result, _ in
                    self.image = result
                }
            }
    }
}
```

我们把完成回调去掉，使用`try?`和`await`来衔接`fetchThumbnail`的调用。但是编译的时候代码报错了，下图中的报错提示我们"async 方法不能使用在不支持并行的上下文中"。这里，`onAppear`接受的是普通的同步的闭包，并不接受我们的异步代码。

![](https://images.xiaozhuanlan.com/photo/2021/11582c0fd132d216640f3ae8e17400ff.png)

看起来，只接受同步代码的接口，不能接受我们使用了 await 的异步代码，即同步和异步代码之间的鸿沟需要填平，怎么解决这个问题呢？答案是使用aync任务函数。async 任务把要执行的工作包裹在闭包中，并把它发送给系统，等待下一个可执行任务的线程去立即执行。就像全局`DispatchQueue`的 async 方法一样。

我们只需要把异步代码放到`async{...}`闭包内，就可以填平同步、异步代码之间的鸿沟，让只接受同步代码的接口，也能接受异步代码了。async 任务只是众多帮助你写出强大并行 Swift 代码的众多 API 中的一个，想了解更多，请关注[Session 10019 - 了解SwiftUI中的并发](https://developer.apple.com/videos/play/wwdc2021/10019/)（[《【WWDC21 10019】在 SwiftUI 中遇见并发编程》](https://xiaozhuanlan.com/topic/2957164803)）和[Session 10134 - 探索Swift中的结构化并发](https://developer.apple.com/videos/play/wwdc2021/10134/)（[《【WWDC21 10134】 探索 Swift 结构化并发》](https://xiaozhuanlan.com/topic/3625784190)）这两个Session。

```swift
struct ThumbnailView: View {
    @ObservedObject var viewModel: viewModel
    var post: Post
    @State private var image: UIImage?

    var body: some View {
        Image(uiImage: self.image ?? placeholder)
            .onAppear {
                async {
                    self.image = try? await self.viewModel.fetchThumbnail(for: post.id)
                }
            }
    }
}
```

SDK 提供了几百个 API，它们接受完成回调，来实现异步能力。

![](https://images.xiaozhuanlan.com/photo/2021/b5bd37ab6297aca3f3c03679f9d7e425.png)

当如下面这样把这些接口都放到一起观察时，你会发现共同点。你调用它们，然后他们调用你提供的完成回调，并传入了它们执行获得的结果。如果我们能把这些使用完成回调的 API 变成 async 方法，那该多酷。

```swift
URLSession.
dataTask(with: URLRequest, completionHandler: @escaping (Data?, URLResponse?, Error?) -> Void)

MKDirections.
calculateETA(completionHandler: @escaping (ETAResponse?, Error?) -> Void)

HKHealthStore.
save(_: HKObject, withCompletion: @escaping (Bool, Error?) -> Void)

NSDocument.
share(with: NSSharingService, completionHandler: (Bool) -> Void)
```

令人兴奋的是，在 Swift 5.5 中，这已经是现实了。Swift 编译器自动分析使用 completionHandler 的 Objective-C 代码，并提供了该方法的 async 版本。正如下面所示。

```swift
// SDK中的异步API

URLSession.
data(with: URLRequest）async throws -> (Data, URLResponse)

MKDirections.
calculateETA() async throws -> ETAResponse

HKHealthStore.
save(_: HKObject) async throws

NSDocument.
share(with: NSSharingService) async
```

但是我们并没有止步于此。很多代理 API 会把完成回调传给使用者。调用回调方法会通知框架异步任务已经完成。我们需要在所有的返回路径上都明确调用完成回调方法。如下所示：

```swift
import ClockKit

extension ComplicationController: CLKComplicationDataSource {
    func getCurrentTimelineEntry(
        for complication: CLKComplication,
        withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void
    ) {
        let date = Date()
        self.viewModel.fetchThumbnail(for: post.id) { thumbnail, error in
            guard let thumbnail = thumbnail else {
                return handler(nil)
            }

            let entry = self.createTimelineEntry(for: thumbnail, date: date)
            return handler(entry)
        }
    }
}
```

上述代理方法也有 async 版本可供我们使用。首先我们去掉了函数名中的 get，我们推荐所有 async 方法去掉诸如 get 之类的关键词，因为该方法不会直接返回结果。然后我们改变了代理方法的返回值类型，从之前的 Void 改成了时间线 Entry 类型。

```swift
import ClockKit

extension ComplicationController: CLKComplicationDataSource {
    func currentTimelineEntry(
        for complication: CLKComplication
    ) async -> CLKComplicationTimelineEntry? {
        let date = Date()
        let thumbnail = try? await self.viewModel.fetchThumbnail(for: post.id)
        guard let thumbnail = thumbnail else {
            return nil
        }

        let entry = self.createTimelineEntry(for: thumbnail, date: date)
        return entry
    }
}
```

想了解更多，请关注以下列出的几个session。
> [Session 10017 - 在Swift和SwiftUI中使用Core Data并发](https://developer.apple.com/videos/play/wwdc2021/10017/)（[《【WWDC21 10017】为 Swift 和 SwiftUI 带来 Core Data 并发》](https://xiaozhuanlan.com/topic/4625791038)）
> [Session 10146 - AVFoundation的最新更新](https://developer.apple.com/videos/play/wwdc2021/10146/)（[【WWDC21 10146】AVFoundation 的新变化》](https://xiaozhuanlan.com/topic/2879104653)） 
> [Session 10054 - AppKit的最新更新](https://developer.apple.com/videos/play/wwdc2021/10054/)  

## 如何写自己的 async 方法

前面讲到的都是用框架提供的 async 方法，如果想自己实现个 async 方法，要怎么做呢？我们来看下面这个使用完成回调的方法，如何改造成 async 方法。

```swift
func getPersistentPosts(completion: @escaping ([Post], Error?) -> Void) {
    do {
        let req = Post.fetchRequest()
        req.sortDescriptors = [ NSSortDescriptor(key: "date", assending: true) ]
        let asyncRequest = NSAsynchronousFetchRequest<Post>(fetchRequest: req) { result in
            completion(result.finalResult ?? [], nil)
        }
        try self.managedObjectContext.execute(asyncRequest)
    } catch {
        completion([], error)
    }
}
```

`getPersistentPosts`调用时，会调用进 Core Data，一段时间后，Core Data 会调用完成回调把结果传递回`getPersistentPosts`。这个过程和之前从服务端请求 icon 图片的过程非常相似。这里只缺少一个桥梁，衔接下图中的 await 和 resume 箭头所表示的过程。这种模式总是出现，于是他有了个名字，**continuation**。

![](https://images.xiaozhuanlan.com/photo/2021/7f729ab132877839b2c942a24c5d6e39.png)

Swift提供了让开发者能够安全便利的使用 continuation 的能力。我们看看如何使用 continuation 来完成我们的改造。下面代码中的`withCheckedThrowingContinuation`，把原本使用完成回调的方法转换成了async方法，所以我们可以在它之前使用 try await，并将其返回值作为 persistentPosts 这个 async 方法的返回值。这相当于把上图中左侧的 await 断层衔接起来了。`withCheckedContinuation`和`withCheckedThrowingContinuation`类似，但前者用于确定不会抛出错误的场景。

`continuation.resume`方法，则是连接上图右侧的 resume 断层的桥梁，它使得挂起的函数在合适的时候继续执行。注意下面代码中的`throwing`和`returning`两种形态。

```swift
func persistenPosts() async throws -> [Post] {
    typealias PostContinuation = CheckedContinuation<[Post], Error>
    return try await withCheckedThrowingContinuation { posts, error in
        self.getPersistentPosts {
            continuation.resume(throwing: error)
        } else {
            continuation.resume(returning: posts)
        }
    }
}
```

continuation 有个简单但是重要的原则，`resume`方法必须在每个路径上执行，有且只有一次。但是不用担心，如果在有的路径上没有执行`resume`方法，Swift runtime 会发出 warning 警告。

![](https://images.xiaozhuanlan.com/photo/2021/1b73310a2f8e246f3e695aeb74fafd83.png)

但如果在某个路径上，`resume`执行了不止一次，这会是严重得多的问题。Swift runtime 会在第二次 resume 调用处触发 fatal error。

![](https://images.xiaozhuanlan.com/photo/2021/dc54627aabd9d8e0efbc448dfcafc6f5.png)

最后我们再来看一个场景。很多 API 是事件驱动的，它们提供代理回调方法，在特定的时间节点执行相关的操作。这种场景下怎么使用 async 方法呢？如下所示，我们首先使用`withCheckedThrowingContinuation`，然后在其回调中把 continuation 保存到`self.activeConotinuation`成员变量。接着，我们在事件驱动的代理方法中，调用保存的 continuation 的`resume`方法，做相应的处理。执行完方法后，别忘了把该成员变量置为 nil。

由于我们是手动处理 resume 行为，切记在每个路径上都调用 resume 方法。想了解更多包括 continuation 在内的 Swift 并行的底层细节，请关注[Session 10254 - 解密Swift并发的背后原理](https://developer.apple.com/videos/play/wwdc2021/10254/)（[《【WWDC21 10254】Swift 并发编程：原理探究》](https://xiaozhuanlan.com/topic/7604819352)）。

```swift
class ViewController: UIViewController {
    private var activeContinuation: CheckedContinuation<[Post], Error>?
    func sharedPostsFromPeer() async throws -> [Post] {
        try await withCheckedThrowingContinuation { continuation in
            self.activeContinuation = continuation
            self.peerManager.syncSharedPosts()
        }
    }
}

extension ViewController: PeerSyncDelegate {
    func peerManager(_ manager: peerManager, received posts: [Post]) {
        self.activeContinuation?.resume(returning: posts)
        self.activeContinuation = nil // 避免resume被调用多次
    }

    func peerManager(_ manager: peerManager, hadError error: Error) {
        self.activeContinuation?.resume(throwing: error)
        self.activeContinuation = nil // 避免resume被调用多次
    }
}
```

## 总结

以上就是关于 Swift 中的 async/await 介绍的全部了。我们讲了 async/await 在运行时的工作原理，以及如何在你的工程或框架中使用它们。我们展示了 SDK 中已有的 async API，也展示了如何把已有代码和 async 方法衔接起来使用。async/await 是 Swift 并发的基石，我们期待你把它们用起来。感谢你的阅读。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
