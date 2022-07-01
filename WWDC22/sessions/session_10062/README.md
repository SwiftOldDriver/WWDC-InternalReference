---
session_ids: [10062]
---

# Session 10062 - 初见 Transferable

> 作者：ooatuoo，iOS 开发者。
>
> 审核：

本文基于 Session 10062 [Meet Transferable](https://developer.apple.com/videos/play/wwdc2022/10062) 梳理

## 前言

[`CoreTransferable`](https://developer.apple.com/documentation/coretransferable) 是苹果今年新出的纯 Swift 的框架，提供了一种更 Swift、更声明式的方式来描述数据该如何被传输和共享。本文将介绍其核心的 `Transferable` 协议的实现方式，及其常见的用法。

## 概览

当数据支持与其他应用共享的时候，需要提供：

- 与二进制数据相互转换的方法
- 二进制数据结构相对应的内容类型

这里的内容类型，是通过统一类型标识符（Uniform Type Identifiers, UTI）来表示的，它是 Apple 自己的一套描述不同二进制结构的标识符，并且已经定义了大量常见的文件和数据类型，比如文本、图片、各种不同格式音视频，具体的可以查看这个[文档](https://developer.apple.com/documentation/uniformtypeidentifiers/uttype/system_declared_uniform_type_identifiers)。

`Transferable` 便是通过 UTI 来标识传输数据对应的类型。并已经为`String`, `Data`, `URL`, `AttributedString`, `Image` 这几个系统的类型提供了默认实现，另外 SwiftUI 也新增了几种 View 和 modifier 来更方便实现复制、拖拽、分享等功能，举几个例子：

- [`PasteButton`](https://developer.apple.com/documentation/swiftui/pastebutton)，新增的系统提供的粘贴按钮：

``` swift
var body: some View { 
  // 👇🏻 实现 Transferable 的类型
  PasteButton(payloadType: String.self) { pastedString in 
    // ... 
  } 
}
```

![](images/pastebutton.png)

- [`draggable(_:)`](https://developer.apple.com/documentation/swiftui/view/draggable(_:)) 和 [`dropDestination(payloadType:action:isTargeted:)`](https://developer.apple.com/documentation/swiftui/view/dropdestination(payloadtype:action:istargeted:))，支持拖拽的 modifier：

``` swift
struct PortraitView: View {
  @State var portrait: Image // 👈🏻 Transferable type

  var body: some View {
    portrait
      .cornerRadius(8)
      .draggable(portrait) // 👈🏻 支持 drag
      .dropDestination(payloadType: Image.self) { (images: [Image], _) in // 👈🏻 支持 drop
        if let image = images.first {
          portrait = image
          return true
        }
        return false
      }
  }
}
```

- [`ShareLink`](https://developer.apple.com/documentation/swiftui/sharelink)，新增的系统提供分享按钮：

``` swift
@State private var portrait: Image

var body: some View {
  Profile()
    .toolbar {
      ShareLink(item: portrait)
    }
}
```

watchOS 9 上也可以分享了：
![](images/sharelink.png)

## 自定义 Transferable

上面都是框架已经支持的数据类型，那么该如何让自己的数据类型支持 `Transferable` 呢？

我们先来看看 `Transferable` 的定义：

``` swift
public protocol Transferable {
  associatedtype Representation: TransferRepresentation

  @TransferRepresentationBuilder<Self> static var transferRepresentation: Self.Representation { get }
}

public protocol TransferRepresentation: Sendable {
  associatedtype Item: Transferable
  associatedtype Body: TransferRepresentation

  @TransferRepresentationBuilder<Self.Item> var body: Self.Body { get }
}
```

从定义来看，我们自定义的数据类型只需要实现 `transferRepresentation` 就可以了，框架也已经提供几种默认的`TransferRepresentation`，依次来介绍下：

### `CodableRepresentation`

如果我们的数据类型已经支持了 `Codable`，可以直接使用：

``` swift
struct Profile: Codable {
    var id: UUID
    var name: String
    var bio: String
    var funFacts: [String]
    var video: URL?
    var portrait: URL?
}

extension Profile: Transferable {
    static var transferRepresentation: some TransferRepresentation {
        CodableRepresentation(contentType: .data)
    }
}
```

我们也可以定义自己的标识符，首先，在 Info.plist 创建自定义标识符的声明：

![](images/uttype-in-plist.png)

如果需要数据保存在磁盘上，可以添加下文件的扩展名，系统就会知道你的应用可以打开该文件。

然后在代码中创建自定义的 UTType：

``` swift
import UniformTypeIdentifiers

extension UTType {
    static var profile: UTType = UTType(exportedAs: "com.example.profile")
}
```

最后，`Profile` 就可以表示成自定义的数据类型了：

``` swift
extension Profile: Transferable {
    static var transferRepresentation: some TransferRepresentation {
        CodableRepresentation(contentType: .profile)
    }
}
```

## `DataRepresentation`

如果我们有一堆 Profile 需要归档成 CSV，那么我们可以用 `DataRepresentation`，只需要提供从 data 解析和生成 data 的方法：

``` swift
struct ProfilesArchive {
    init(csvData: Data) throws { }
    func convertToCSV() throws -> Data { Data() }
}

extension ProfilesArchive: Transferable {
    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(contentType: .commaSeparatedText) { archive in
            try archive.convertToCSV()
        } importing: { data in
            try ProfilesArchive(csvData: data)
        }
    }
}
```

## `FileRepresentation`

对于内存占用较大的数据，我们可以通过文件来共享，只需要给定文件内容的标识符，以及文件的路径：

``` swift
struct Video: Transferable {
    let file: URL
    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .mpeg4Movie) { 
            SentTransferredFile($0.file)
        } importing: { received in
            let destination = try Self.copyVideoFile(source: received.file)
            return Self.init(file: destination)
        }
    }
}
```

## `ProxyRepresentation`

`ProxyRepresentation` 可以使用其他类型的 `transferRepresentation` 作为其自己的，比如上面的 `Profile`，有些复制粘贴的地方不支持这个 UTType，我们可以加一个表示文本类型的 `ProxyRepresentation`：

``` swift
extension Profile: Transferable {
    static var transferRepresentation: some TransferRepresentation {
        CodableRepresentation(contentType: .profile)
        ProxyRepresentation(exporting: \.name)
    }
}
```

这样不支持的地方就可以直接当作文本来处理。
注意，这里声明的顺序很重要，接收方会按这个顺序寻找其支持的内容类型。

另外，我们可能还会遇到某些条件下不支持共享的情况，可以通过 `exportingCondition` 来声明：

``` swift
extension ProfilesArchive: Transferable {
    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(contentType: .commaSeparatedText) { archive in
            try archive.convertToCSV()
        } importing: { data in
            try Self(csvData: data)
        }
        .exportingCondition { $0.supportsCSV }
    }
}
```

## 总结

通过上面的例子，想必你能感受到这种声明式写法的便利，得益于 Swift 的 @resultBuilder，我们可以更方便的组合和复用  `TransferRepresentation`，也可以利用 Opaque Types 的特性，满足我们某些情况下需要隐藏内部实现的需求。
