---
session_ids: [10054]
---

# WWDC22 10054 - SwiftUI 导航

> **注：因为文章撰写时，SwiftUI 导航新 API 还处于 Beta 软件阶段，并且存在一些已知的 bug，我们后面将会根据正式版 API 更新一些内容**

清晰而稳健的导航结构，简单的交互和良好的用户体验是 App 成功的关键。这一切都离不开导航的支持，导航的重要性不言而喻。良好的导航模式可以帮助人们轻松地探索应用程序中的信息，更快的上手。经过四年的迭代，WWDC22 带来了全新的 SwiftUI 导航的设计和实现，并丰富了其能力，让我们先睹为快。

本文将通过一个真实的例子，聚焦 SwiftUI 导航 APIs 的设计和使用。全文分为五个部分：

第一部分描述一个《唐诗三百首》的例子，全文将使用这个例子来展示 SwiftUI 导航的使用。

第二部分简单描述现有方案 NavigationView 的使用和不足。

第三部分介绍新方案 NavigationStack 和 NavigationSplitView 的用法和能力，以及如何迁移到新方案。

第四部分探索新 APIs 一些适用的场景。

最后一部分列举出《唐诗三百首 App》一些重要的实现细节，帮助大家完成其功能。并给出一些 SwiftUI 导航的使用建议。

## 唐诗三百首 App

唐朝是中国诗歌发展的黄金时代，云蒸霞蔚，名家辈出，唐诗数量多达五万余首。其中广为流传的唐诗选集《唐诗三百首》，收录名诗三百一十余首。包含五言古诗、五言乐府、七言古诗、七言乐府、五言律诗、七言律诗、五言绝句和七言绝句共八种体裁，七十余位唐代名家作品。非常适合用来展示导航的使用。

![唐诗三百首 App 设计图][poems-app-design]

该 App 第一级导航按体裁将唐诗分成八个部分，第二级导航罗列某一体裁下的所有诗词列表，点击某诗名后进入诗词详情页。在详情页的最后，会罗列出该作者在相同题材下的其它诗词，供读者扩展阅读。程序所用的原始数据如下：

```json
{
  "id": 234,
  "contents": "美人卷珠帘，深坐蹙蛾眉。\n但见泪痕湿，不知心恨谁？",
  "type": "五言绝句",
  "author": "李白",
  "title": "怨情"
}
```

对应的 struct 结构为：

```swift
struct Poem: Codable, Hashable, Identifiable {
  let id: Int
  let contents: String
  let type: String
  let author: String
  let title: String
}
```

读完这篇文章，你将能轻松地实现一个《唐诗三百首》的应用，如下图所示：

![唐诗三百首 App 截图][poems-app-screenshot]

*注：因为 macOS 13 还没有发布，图中 mac App 暂时使用 iPad App 代替，后期会替换。*

本文所使用的代码已开源，链接在文章结尾。😄

## 现有导航方案回顾

从 SwiftUI 诞生起，NavigationView 加 NavigationLink 的组合就是实现导航栏的标配，使用起来也是非常的简单。在你显示内容最外层加上 NavigationView，然后在需要导航的地方加上 NavigationLink 就好。NavigationLink 通过 `destination` 来指定点击后需要导航到的目标视图。在 iPadOS 和 macOS 上，目标视图的内容会出现在下一列。其它平台将目标视图放入视图栈中，并使用平台特定的控件，比如后退按钮或者滑动手势，从栈中删除目标视图。NavigationLink 可以出现在显示内容的任意层级中，或者出现在目标视图的子视图里，而 NavigationView 通常只需要一个。

以下代码使用 `NavigationView + List + NavigationLink` 组合，创建了一个体裁的列表，点击不同的体裁类型后，导航到诗名列表中。

```swift
NavigationView {
  List(dataModel.types, id: \.self) { type in
    NavigationLink(type, destination: PoemList(poems: dataModel.poemsWith(type: type)))
  }
  .navigationTitle(Text("Types"))
}
```

### 不足

这种导航能满足多数的使用场景，但是存在以下缺点：

- 上述例子中的目标视图 `PoemList` 会被重复创建多次

  以 iPhone 竖屏为例，虽然在显示体裁的时候，目标视图 `PoemList` 并不会呈现在屏幕上。但是 `PoemList` 对象却需要提前被创建，而且会被创建多次，数量和当前体裁个数相同。每个体裁都对应一个潜在的 `PoemList`, 哪怕用户不点击查看。当我们滑动体裁列表时，`PoemList` 对象还是会不断被创建。基于 SwiftUI 的绘制原理，当页面上的 State 变化时，又会引起目标视图的重新创建，这往往导致巨大的浪费。

- 状态难以管理

  NavigationLink 支持通过设置 `isActive` 的值来动态的激活导航而显示目标视图。这意味着我们可以通过编程的方式来打开或者关闭目标视图。如下面代码所示，通过设置 `isFiveWordsActive = true` 来打开五言乐府诗集列表。

  ```swift
  @State private var isSevenWordsActive = false
  @State private var isFiveWordsActive = true

  var body: some View {
    NavigationView {
      List {
        NavigationLink(
          "七言乐府",
          destination: PoemList(poems: dataModel.poemsWith(type: type)),
          isActive: $isSevenWordsActive
        )
        NavigationLink(
          "五言乐府",
          destination: PoemList(poems: dataModel.poemsWith(type: type)),
          isActive: $isFiveWordsActive
        )
      }
      .navigationTitle(Text("Types"))
    }
  }
  ```

  这种能力提供了极大的便利性，但是存在三个问题：

  1. 需要为 List 中的每个 NavigationLink 提供一个 State 变量，比较繁琐。
  2. NavigationLink 可以存在于任意层级的子 View 中，当层数变多变深时，即使借助于 EnvironmentObject，这种状态也难以管理。
  3. 视图栈中的视图可能来自于编程（设置 `isActive = true`），也有可能来自点击或者手势。想要记录完整的导航路径时，就需要给路径上的所有 NavigationLink 加上 `isActive`，如果路径存在循环，那简直就是一种灾难。

  幸好，新版的 APIs 一举解决了上述所有问题。

## 新导航方案

新方案废弃了 NavigationView, 引入了 NavigationStack 和 NavigationSplitView 来实现导航功能。

### NavigationStack

使用 NavigationStack 包裹根视图后，SwiftUI 自动在根视图上加一个视图栈。用户通过点击 (click 或者 tap) NavigationLink，向视图栈顶添加新视图，通过返回键或者滑动手势从栈顶删除视图。SwiftUI 总是向用户显示栈顶视图，当栈被清空后显示根视图，根视图不可被删除。当栈中视图大于 1 时，显示返回键和导航栏。

```swift
NavigationStack {
  List(dataModel.poems, id: \.self) { poem in
    NavigationLink(poem.title, value: poem)
  }
  .navigationDestination(for: Poem.self) { poem in
    PoemDetail(poem: poem)
  }
  .navigationTitle(Text("Titles"))
}
```

以上代码使用 `NavigationStack + List + NavigationLink + navigationDestination` 组合，创建了一个诗词列表，点击后进入诗词详情页。为了链接和目标视图解藕，新版的 NavigationLink 增加了一批构造函数：

- `init<P>(LocalizedStringKey, value: P?)`
- `init<S, P>(S, value: P?)`
- `init<P>(value: P?, label: () -> Label)`

除了显示链接的文本信息外，最重要的参数是 `value`。当用户点击该 NavigationLink 时，SwiftUI 会存储这个值的一个备份，然后通过 `value` 的类型，匹配最近的目标视图, 并将目标视图推入视图栈顶，来显示目标视图。目标视图通过 View 上的修饰符 `navigationDestination(for:destination:)` 来定义。上述代码中，传给 `value` 的值是 Poem 类型的，所以找到最近为 `Poem.self` 定义的目标视图 `PoemDetail`。SwiftUI 确保将 `value` 的备份传递给目标视图，用于绘制。

SwiftUI 在通过 `value` 来匹配目标视图时，会经历以下几步：

1. 如果匹配类型的修饰符在 NavigationStack 内定义，那么将对应的目标视图送入栈顶，并显示。
2. 如果 SwiftUI 在 NavigationSplitView 的后一列的栈的视图层次结构中找到了一个匹配的修饰符，它会把修饰符的目标视图作为栈上的第一项和唯一项，同时保留根视图。
3. 如果没有匹配的修饰符，但是 NavigationLink 出现在 NavigationSplitView 的前导列内的 List 中，那么 NavigationLink 会更新 selection，这可能会影响尾随视图的外观。
4. 在其他情况下，NavigationLink 没有任何作用。

利用类型匹配的方式，新 APIs 将目标视图的创建从 NavigationLink 中分离出来，放在了修饰符中。而修饰符中的 `PoemDetail`，只有在用户点击后才创建，解决了目标视图被重复创建的问题，节省了空间，提高了性能。

接下来再看看新 APIs 如何解决状态管理的问题。因为每个被激活的目标视图都会被压入栈中，栈的状态即为导航的状态，新 APIs 通过传递一个绑定栈状态的 path 变量来管理导航的状态。

```swift
@State private var path: [Poem] = []

var body: some View {
  NavigationStack(path: $path) {
    List(dataModel.poems, id: \.id) { poem in
      NavigationLink(poem.title, value: poem)
    }
    .navigationDestination(for: Poem.self) { poem in
      PoemDetail(poem: poem)
    }
  }
}
```

![NavigationStack 说明][navigation-stack-diagram]

上述例子中，当点击某一个诗名后，SwiftUI 会通过当前值 `value: poem` 的类型，根据 `.navigationDestination(for: Poem.self)` 找到目标视图 PoemDetail, 将 PoemDetail 压入视图栈栈顶，显示诗词详情页。于此同时，将值`poem` 放入导航路径中，通过 path 绑定传回，此时 path 定义为 Poem 数组。Poem 数据的个数反映出视图栈的个数，Poem 的内容决定了 `PoemDetail` 显示的内容。

同样的，可以通过设置 path 的值来影响视图栈的内容，比如以下代码，将某一作者的所有诗词全都放入视图栈中。

```swift
func showPoems(author: String) {
  path = dataModel.poems.filter { $0.author == author }
}
```

根据链接传递的值的类型不同，可以同时配置多个不同的 navigationDestination 来导航到相应的视图中去。此时，path 需要使用 NavigationPath 来替代，来管理不同类型的数据，在文章后面的例子中，有详细的示例。

和 NavigationView 不同，即使在大屏设备上，NavigationStack 也不会分列显示，用户只能看到栈顶视图的内容。而自动分屏的操作，则通过 NavigationSplitView 来实现。

### NavigationSplitView

SwiftUI 为了方便在大屏上做分屏显示，提供了一个非常便利的分屏视图 NavigationSplitView, 它能根据不同平台屏幕的尺寸把视图分两列或者三列显示。不同于 NavigationStack，其中前一列的选择控制着后一列的显示。在小屏幕上显示时，自动折叠成单列。

#### 两列视图

创建两列视图时使用构造函数 `init(sidebar:detail:)`，其中第一列叫做侧边栏，第二列叫做详情页。

![Two-column View][two-column-view]

以下代码使用 `NavigationSplitView + List + NavigationLink` 组合，创建了一个诗词列表的导航。当用户选择第一列的 List 时，会更新传给 selection 的 poem 状态，详情页拿到 poem 后通过 PoemDetail 显示详细信息。注意 List 的 id 参数很重要，此处传递的值为 `\.self`。所以 selection 接收的类型为 Poem。如果更换为 `\.id`，那么只能使用 `@State private var poemId: Int?` 类型来接收了, 使用时需要特别注意。另外，用来选择的 poem 是可选的，空表示没有选择任何 poem。

```swift
@State private var poem: Poem?

var body: some View {
  NavigationSplitView {
    List(dataModel.poems, id: \.self, selection: $poem) { poem in
      // 这里使用 Text 也可以，value 其实没有人收，detail 由 selection 控制
      // 使用 Text 时，List item 没有 >
      NavigationLink(poem.title, value: poem)
    }
  } detail: {
    ZStack { // Workaround: 91311311
      if let poem {
        PoemDetail(poem: poem)
      } else {
        EmptyView()
      }
    }
  }
}
```

> 注：目前 NavigationSplitView 存在一个已知的 issue (91311311)，条件选择不生效，需要暂时加上 ZStack 解决，期待在正式版本予以解决。
> Conditional views in columns of NavigationSplitView fail to update on some state changes. (91311311)
> Workaround: Wrap the contents of the column in a ZStack.

#### 三列视图

创建三列视图时使用构造函数 `init(sidebar:content:detail:)`，其中第一列叫做侧边栏，第二列为内容页，第三列叫做详情页。

![Three-column View][three-column-view]

以下代码是一个稍微复杂的例子，使用 `NavigationSplitView + List + NavigationLink + NavigationStack + navigationDestination` 的组合，来创建一个三列的分屏视图。

```swift
@State private var type: String?
@State private var poem: Poem?
@State private var path: [Poem] = []

var body: some View {
  NavigationSplitView {
    List(dataModel.types, id: \.self, selection: $type) { type in
      NavigationLink(value: type) {
        Text(type)
      }
    }
  } content: {
    ZStack { // Workaround: 91311311
      if let type {
        List(dataModel.poemsWith(type: type), id: \.self, selection: $poem) { poem in
          NavigationLink(value: poem) {
            Text(poem.title)
          }
        }
      }
    }
  } detail: {
    NavigationStack(path: $path) {
      ZStack { // Workaround: 91311311
        if let poem {
          PoemDetail(poem: poem)
        } else {
          EmptyView()
        }
      }
      .navigationDestination(for: Poem.self) { poem in
        PoemDetail(poem: poem)
      }
    }
  }
}
```

从代码中也可以发现，NavigationSplitView 内也可以嵌入 NavigationStack，来实现更复杂的导航操作。

> 注：目前 NavigationSplitView 三列视图存在一个已知的 issue (93673059)，在小屏幕上显示时，点击最外层点击事件不生效，期待正式版能予以解决。
> Selection-driven, three-column NavigationSplitView sometimes fails to push when collapsed to a single column. (93673059)

#### NavigationSplitViewVisibility

NavigationSplitView 在构造函数中提供了 NavigationSplitViewVisibility 参数来设置需要显示的列，可用的值有：

- `detailOnly`: 只显示详情页
- `doubleColumn`: 三列视图只显示内容页和详情页，两列视图等价于 `all`
- `all`: 显示所有列
- `automatic`: 根据当前设备自动选择默认的显示模式

值得注意的是，在 macOS 上 NavigationSplitViewVisibility 设置可能不生效。

### 状态持久化和恢复

可以通过与 NavigationStack 绑定的状态 path 来获取当前视图栈的信息。同样地，可以通过设置 path 的值来控制视图栈的状态。这种实现方式，使得导航路径的持久化和恢复变得便利。以三列视图为例，我们来看一看如何做状态的持久化和恢复。一般分三步来实现：

1. 定义一个 ObservableObject 子类，来托管所有的导航路径相关的状态。此时将原本的 @State 修饰符改成 @Published。

    ```swift
    class PoemBookSplitNavigationModel: ObservableObject {
      @Published var type: String?
      @Published var poem: Poem?
      @Published var path: [Poem] = []
    }
    ```

    在 View 中创建一个 @StateObject 的模型 navigationModel 来使用它。

    ```swift
    @StateObject private var navigationModel = PoemBookSplitNavigationModel()

    List(dataModel.types, id: \.self, selection: $navigationModel.type)

    if let type = navigationModel.type {
      ...
    }
    ```

2. 实现 Codable 接口

    在编码时，我们可以将整个 Poem 编码。但是通常是不必要的，因为 `PoemsDataModel.shared` 里已经包含了所有诗词的信息，只需要存储 id 就足够了。另外，所有的诗词信息可能从服务器获得，完全有可能被删除。不应该展示已经被删除了的内容，所以这里使用了 `pathIds.compactMap` 来处理这种情况。

    ```swift
    class PoemBookSplitNavigationModel: ObservableObject, Codable {
      @Published var type: String?
      @Published var poem: Poem?
      @Published var path: [Poem] = []

      enum CodingKeys: String, CodingKey {
        case type
        case poemId
        case pathIds
      }

      func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(type, forKey: .type)
        try container.encodeIfPresent(poem?.id, forKey: .poemId)
        try container.encode(path.map(\.id), forKey: .pathIds)
      }

      required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.type = try container.decodeIfPresent(String.self, forKey: .type)

        let poemId = try container.decodeIfPresent(Int.self, forKey: .poemId)
        self.poem = PoemsDataModel.shared[poemId]

        let pathIds = try container.decode([Poem.ID].self, forKey: .pathIds)
        self.path = pathIds.compactMap({ PoemsDataModel.shared[$0] })
      }

      required init() {} // 让无参数构造函数可用
    }
    ```

3. 使用 SceneStorage 持久化和恢复

    SwiftUI 推荐使用 SceneStorage 来持久化导航路径。SceneStorage 是一种轻量级的持久化方案，SceneStorage 的工作原理与 State 非常相似，不同之处在于，如果它之前保存过，它的初始值会被系统恢复，并且这个值会被同一个场景中的其他 SceneStorage 变量共享。

    ```swift
    @StateObject private var dataModel = PoemsDataModel.shared
    @StateObject private var navigationModel = PoemBookSplitNavigationModel()
    @SceneStorage("navigation") private var data: Data?

    var body: some View {
      NavigationSplitView {...}
      .task {
        dataModel.load()

        if let data {
          navigationModel.jsonData = data
        }

        for await _ in navigationModel.objectWillChangeSequence { // objectWillChangeSequence 在 beta 版本中不可用
          data = navigationModel.jsonData
        }
      }
    ```

    *注：目前版本的 API 缺少 `objectWillChangeSequence`, 暂时不可用。*

### 迁移指引

由于 NavigationView 在 iOS 16, iPadOS 16, macOS 13, tvOS 16, 或者 watchOS 9 及以上版本中被废弃，将代码迁移到最新版本是被提倡的，也是必需的，总体来说，有三种需要迁移的情况：

- 将 `NavigationView {...}.navigationViewStyle(.stack)` 替换成 `NavigationStack`
- 将 `NavigationView {...}` 替换成 `NavigationSplitView`
- 将 `NavigationLink(... isActive: ...)` 或者 `NavigationLink(... tag: ... selection:)` 替换成 `NaviationLink(... value: ...)`

具体迁移细节，请查看官方[文档][migrating-to-new-navigation-types]。

## 新 API 适用的场景

新导航解决了现有导航的不足，也提供了更多的可能。这里列举几个新 API 可能适用的场景：

### 配合 Regex 实现 Deeplink

有了新导航, 再配上最新引进的 Regex [WWDC 110358][wwdc-110358]，实现起 Deeplink 简直太便利了。SwiftUI 获取 Deeplink 的方法也特别简单，在 plist 里配置好 URL Types 后，就可以在任意层级的 View 上调用 `onOpenURL`, 来获取 Deeplink：

```swift
  NavigationSplitView { ... }
  .onOpenURL { url in
    navigationModel.redirect(to: url.absoluteString)
  }
```

拿到 URL 后，利用 Regex 切分出不同的状态参数，解析后赋值给 PoemBookSplitNavigationModel 就好，特别简单。同样，在 URL 设计的时候，尽可能用 id 来缩短 URL。

```swift
// PoemBookSplitNavigationModel
func redirect(to: String) {
  // Test deeplink sample:
  //  xcrun simctl openurl booted "zddhub://poems?type=0&poemId=5&pathIds=1,2,3,4"
  let regex = /zddhub:\/\/poems\?type=(\d+)&poemId=(\d+)&pathIds=(.*)/

  guard let match = to.firstMatch(of: regex) else { return }
  let (_, typeMatched, poemIdMatched, pathIdsMatched) = match.output
  guard let type = Int(typeMatched),
        let poemId = Int(poemIdMatched) else { return }

  self.type = PoemsDataModel.shared.types[type]
  self.poem = PoemsDataModel.shared[poemId]
  self.path = pathIdsMatched.split(by: ",").compactMap { PoemsDataModel.shared[Int($0)] }
}
```

### 更容易实现路由

由于新导航 APIs 支持在 View 上按类型不同，调用多次 `navigationDestination`, 这样，可以将目标视图放在根视图上，集中管理。其次将链接和目标视图分开，也达到了解藕的目的。

```swift
NavigationStack {
  List(dataModel.types, id: \.self) { type in
    NavigationLink(type, value: type)
  }
  .navigationDestination(for: String.self, destination: { type in
    PoemList(poems: dataModel.poemsWith(type: type))
  })
  .navigationDestination(for: Poem.self) { poem in
    PoemDetail(poem: poem)
  }
}
```

当然，如果觉得 NavigationLink 散落在根视图的多个子视图中不好管理，也可以用 Router 将其放在集中的地方, 统一管理：

```swift
class Router: ObservableObject {
  @ViewBuilder
  func route(to poem: Poem) -> some View {
    NavigationLink(value: poem) {
      Text(poem.title)
    }
  }

  @ViewBuilder
  func route(to type : String) -> some View {
    NavigationLink(value: type) {
      Text(type)
    }
  }
}
```

在子 View 中使用 `router.route(to:)` 来导航。接着再配合 Regex，很容易实现类似前端路由的效果。

```swift
private var router = Router()

var body: some View {
  NavigationStack {
    List(dataModel.types, id: \.self) { type in
      router.route(to: type)
    }
    ...
  }
  .environmentObject(router)
}
```

## 唐诗三百首的详细实现

到目前为止，你应该对新导航的 APIs 了然于胸了，为了更好的实现真实的《唐诗三百首》应用。这里列出重要的两点，帮助大家实现。全部的代码开源在 [Github][poems-source-code] 上。

### NavigationPath 的使用

操作导航路径很便利，你一定会发现，存入视图栈中的视图对应的数据类型有可能完全不一样，这样使用数组来存储导航路径信息就不适用了，如以下代码所示, 存入 path 中的值类型有可能是 `String.self` 或者 `Poem.self`，那么 path 的类型既不能是 String，又不能是 Poem，SwiftUI 为我们提供了一种方案 —— NavigationPath。

```swift
@State private var path: NavigationPath = NavigationPath()

NavigationStack(path: $path) {
  List(dataModel.types, id: \.self) { type in
    NavigationLink(type, value: type)
  }
  .navigationDestination(for: String.self, destination: { type in
    PoemList(poems: dataModel.poemsWith(type: type))
  })
  .navigationDestination(for: Poem.self) { poem in
    PoemDetail(poem: poem)
  }
}
```

同样的，我们可以对 NavigationPath 进行存储和恢复。它提供了 `CodableRepresentation` 类，方便更快的序列化、反序列化。

```swift
class PoemBookStackNavigationModel: ObservableObject {
  @Published var path: NavigationPath
  @AppStorage("StackView.navigation") static private var data: Data? // @SceneStorage doesn't work here, will review it in official release

  static func readSerializedData() -> Data? {
    Self.data
  }

  static func writeSerializedData(_ data: Data) {
    Self.data = data
  }

  init() {
    if let data = Self.readSerializedData(),
       let representation = try? JSONDecoder().decode(
        NavigationPath.CodableRepresentation.self,
        from: data) {
      self.path = NavigationPath(representation)
    } else {
      self.path = NavigationPath()
    }
  }

  func save() {
    guard let representation = path.codable else { return }
    do {
      let encoder = JSONEncoder()
      let data = try encoder.encode(representation)
      Self.writeSerializedData(data)
    } catch {
        print("========Save error =====")
    }
  }
}
```

### PoemsDataModel 的实现

应用程序的数据来源于 `PoemsDataModel` 类，诗文存储在本地文件 `poems-300` 中。文本中使用的 dataModel 创建如下所示：

```swift
class PoemsDataModel: ObservableObject {
  @Published var poems: [Poem] = []
  @Published var types: [String] = []
  private var cancellable = Set<AnyCancellable>()

  public static let shared = PoemsDataModel()

  private init() {}

  subscript(id: Int?) -> Poem? {
    guard let id, id > 0 && id < poems.count else {
      return nil
    }
    return poems[id-1]
  }

  func load() {
    guard let url = Bundle.main.url(forResource: "poems-300", withExtension: "json") else {
      return
    }

    URLSession.shared
      .dataTaskPublisher(for: url)
      .tryMap { $0.data }
      .decode(type: [Poem].self, decoder: JSONDecoder())
      .replaceError(with: [])
      .receive(on: DispatchQueue.main)
      .sink { poems in
        self.poems = poems
        self.types = Array(Set(poems.map(\.type))).sorted()
      }
      .store(in: &cancellable)
  }

  func poemsWith(type: String) -> [Poem] {
    poems.filter { $0.type == type }
  }

  func relatedPoems(poem: Poem?) -> [Poem] {
    guard let poem else { return [] }

    return poems.filter {
      $0.author == poem.author && $0.type == poem.type && $0.title != poem.title
    }
  }
}
```

### SwiftUI 导航使用建议

1. 优先考虑视图路径和 Deeplink 是否需要存储、恢复。
2. 在能使用 NavigationSplitView 的场景尽量使用 NavigationSplitView。
3. 组合使用 NavigationSplitView、NagivationStack 和 List 实现复杂的导航效果。
4. 将 navigationDestination 放在主视图上，方便组织。

[poems-app-design]: ./images/poems-app-design.png
[iOS-and-iPadOS-16-Beta-Release-Notes]: https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-16-release-notes
[poems-app-screenshot]: ./images/poems-app-screenshot.png
[poems-source-code]: https://github.com/zddhub/poems
[navigation-stack-diagram]: ./images/navigation-stack-diagram.gif
[two-column-view]: ./images/two-column-view.png
[three-column-view]: ./images/three-column-view.png
[migrating-to-new-navigation-types]: https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types
[wwdc-110358]: https://developer.apple.com/videos/play/wwdc2022/110358/
