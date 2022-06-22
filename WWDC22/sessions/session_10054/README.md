---
session_ids: [10054]
---

# WWDC22 10054 - SwiftUI 导航栏

> **注：因为文章撰写时，SwiftUI 导航新 API 还处于 Beta 软件阶段，并且存在一些已知的 bug，我们后面将会根据正式版 API 更新一些内容**

清晰而稳健的导航结构，简单的交互和良好的用户体验是 App 成功的关键。这一切都离不开导航的支持，导航的重要性不言而喻。良好的导航模式可以帮助人们轻松的探索应用程序中的信息，更快的上手。经过四年的迭代，WWDC22 带来了全新的 SwiftUI 导航的设计和实现，并丰富了其能力，让我们先睹为快。

本文将通过一个真实的例子，聚焦 SwiftUI 导航栏 APIs 的设计和使用。全文分为五个部分：

第一部分描述一个《唐诗三百首》的例子，全文将使用这个例子来展示 SwiftUI 导航的使用。

第二部分简单描述现有方案 NavigationView 的使用和不足。

第三部分介绍 NavigationStack 和 NavigationSplitView 新 APIs 的用法和能力，以及如何迁移到新 APIs。

第四部分探索新 API 一些适用的场景。

最后一部分列举出《唐诗三百首 App》一些重要的实现细节，帮助完成其功能。并给出一些 SwiftUI 导航的使用建议。

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

读完这篇文章，你将能轻松地实现一个应用如下图所示：

![唐诗三百首 App 截图][poems-app-screenshot]

本文所使用的代码开源在[Github][poems-source-code]上.

## 现有导航方案回顾

从 SwiftUI 诞生起，NavigationView 加 NavigationLink 的组合就是实现导航栏的标配，使用起来也是非常的简单。在你显示内容最外层加上 NavigationView，然后在需要导航的地方加上 NavigationLink 就好。NavigationLink 通过 `destination` 来指定点击后需要导航到的目标视图。在 iPadOS 和 macOS 上，目标视图的内容会出现在下一列。其它平台将目标视图放入堆栈，并使用平台特定的控件，比如后退按钮或者滑动手势，从堆栈中删除目标视图。NavigationLink 可以出现在显示内容的任意层级，或者出现在目标视图的子视图中，而 NavigationView 通常只需要一个。

![NavigiationView][navigation-view]

以下代码创建了一个体裁的列表，点击不同的体裁类型后，导航到诗名列表中。

```swift
NavigationView {
  List(viewModel.types, id: \.self) { type in
    NavigationLink(type, destination: PoemList(poems: viewModel.poemsWith(type: type)))
  }
  .navigationTitle(Text("Types"))
}
```

### 不足

这种导航能满足多数的使用场景，但是存在以下缺点：

- 上述例子中的目标视图 `PoemList` 被重复创建多次

以 iPhone 竖屏为例，虽然在显示体裁的时候，目标视图 `PoemList` 并不会被显示。但是 `PoemList` 需要提前被创建，数量和一页能显示的 List 数量相同。滑动体裁列表时，会有更多的 `PoemList` 被创建，即使用户不点击查看 `PoemList`。而且，基于 SwiftUI 的绘制原理，当页面上的 State 变化时，会引起目标视图的重新创建。这是一种巨大的浪费。

- 状态难以管理

NavigationLink 支持通过设置 `isActive` 的值来动态的激活导航栏而显示目标视图。这意味着我们可以通过编程的方式来打开或者关闭目标视图。如下面代码所示，通过设置 `isFiveWordsActive = true` 来打开五言乐府诗集列表。

```swift
@State private var isSevenWordsActive = false
@State private var isFiveWordsActive = true

var body: some View {
  NavigationView {
    List {
      NavigationLink("七言乐府", destination: PoemList(poems: viewModel.poemsWith(type: type)), isActive: $isSevenWordsActive)
      NavigationLink("五言乐府", destination: PoemList(poems: viewModel.poemsWith(type: type)), isActive: $isFiveWordsActive)
    }
    .navigationTitle(Text("Types"))
  }
}
```

这种能力提供了极大的便利性，但是存在三个问题：

1. 需要为 List 中的每个 NavigationLink 提供一个 State 变量，比较繁琐。
2. NavigationLink 可以存在于任意层级的子 View 中，当层数变多变深时，即使借助于 EnvironmentObject，这种状态也难以管理。
3. 视图堆栈中的视图可能来自于编程（设置 `isActive = true`），也有可能来自点击或者手势，想要记录完整的导航路径时，就需要给路径上的所有 NavigationLink 加上 `isActive`，如果路径存在循环，那简直是一种灾难。

幸好，新版的 APIs 一举解决了上述所有问题。

## 新导航方案

新方案废弃了 NavigationView, 引入了 NavigationStack 和 NavigationSplitView 来实现导航功能。

### NavigationStack

使用 NavigationStack 包裹根视图后，SwiftUI 自动在根视图上加一个视图栈。用户通过点击 (click 或者 tap) NavigationLink，向视图栈顶添加新视图，通过返回键或者滑动手势从栈顶删除视图。SwiftUI 总是向用户显示栈顶视图，当栈被清空后显示根视图，根视图不可被删除。当栈中视图大于 1 时，显示返回键和导航栏。

```swift
NavigationStack {
  List(viewModel.poems, id: \.self) { poem in
    NavigationLink(poem.title, value: poem)
  }
  .navigationDestination(for: Poem.self) { poem in
    PoemDetail(poem: poem)
  }
  .navigationTitle(Text("Titles"))
}
```

与 NavigationStack 对应，新版的 NavigationLink 增加了一批构造函数：

- `init<P>(LocalizedStringKey, value: P?)`
- `init<S, P>(S, value: P?)`
- `init<P>(value: P?, label: () -> Label)`

除了显示 Link 的文本信息外，最重要的参数是 `value`。当用户点击该 NavigationLink 时，SwiftUI 会存储这个值的一个备份，然后通过 `value` 的类型，匹配最近的目标视图, 并将目标视图推入栈顶，来显示目标视图。目标视图通过 View 上的修饰符 `navigationDestination(for:destination:)` 来定义。上述代码中，传给 `value` 的值是 Poem 类型的，所以找到最近为 `Poem.self` 定义的目标视图 `PoemDetail`。SwiftUI 也能保证将 value 的备份传递给目标视图，用于绘制。

```swift
.navigationDestination(for: Poem.self) { poem in
  PoemDetail(poem: poem)
}
```

SwiftUI 在通过 `value` 来匹配目标视图时，会经历以下几步：

1. 如果匹配的修饰符在 NavigationStack 内定义，那么将对应的目标视图送入栈顶，并显示。
2. 如果 SwiftUI 在 NavigationSplitView 的后一列的栈的视图层次结构中找到了一个匹配的修饰符，它会把修饰符的目标视图作为堆栈上的第一项和唯一项，同时保留堆栈的根视图。
3. 如果没有匹配的修饰符，但是 NavigationLink 出现在 NavigationSplitView 的前导列内的 List 中，那么 NavigationLink 会更新 selection，这可能会影响尾随视图的外观。
4. 在其他情况下，NavigationLink 没有任何作用。

利用类型匹配的方式，新 APIs 将目标视图的创建从 NavigationLink 中分离出来，放在了修饰符中。而修饰符中的 `PoemDetail`，只有在用户点击后才创建，解决了目标视图被重复创建的问题，节省了空间，提高了性能。

接下来再看看新 APIs 如何解决状态管理的问题。因为每个被激活的目标视图都会被压入栈中，栈的状态即为导航的状态，新 APIs 通过传递一个绑定的 path 变量来管理导航的状态。

```swift
@State private var path: [Poem] = []

var body: some View {
  NavigationStack(path: $path) {
    List(viewModel.poems, id: \.id) { poem in
      NavigationLink(poem.title, value: poem)
    }
    .navigationDestination(for: Poem.self) { poem in
      PoemDetail(poem: poem)
    }
  }
}
```

![NavigationStack 说明][navigation-stack-diagram]

上述例子中，path 的值为 Poem 数组。根据链接传递的值的类型不同，`navigationDestination` 可设置多个，此时，path 需要使用 NavigationPath 来替代，以管理不同类型的数据，在文章后面的例子中，有详细的示例。

和 NavigationView 不同，即使在大屏设备上，NavigationStack 也不会分列显示，用户只能看到顶视图的内容。而自动分屏的操作，使用 NavigationSplitView 来实现。

### NavigationSplitView

SwiftUI 为了方便在大屏上做分屏显示，提供了一个非常便利的分屏视图 NavigationSplitView, 它提供把视图显示成两列或者三列。不同于 NavigationStack，其中前一列的选择控制着后一列的显示。在小屏幕上显示时，自动折叠成单列。

#### 两列视图

创建两列视图时使用构造函数 `init(sidebar:detail:)`，其中第一列叫做侧边栏，第二列叫做详情页。

```swift
@State private var poem: Poem?

var body: some View {
  NavigationSplitView {
    List(viewModel.poems, id: \.self, selection: $poem) { poem in
      Text(poem.title) // 使用 NavigationLink 也可以
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

当用户选择第一列的 List 时，会更新传给 selection 的 poem 状态，详情页拿到 poem 后通过 PoemDetail 显示详细信息。注意 List 的 id 参数很重要，此处传递的值为 `\.self`。所以 selection 接收的类型为 Poem。如果更换为 `\.id`，那么只能使用 `@State private var poemId: Int?` 类型来接收了, 使用时需要特别注意。另外，用来选择的 poem 是可选的，空表示没有选择。

> 注：目前 NavigationSplitView 存在一个已知的 issue (91311311)，条件选择不生效，需要暂时加上 ZStack 解决，期待在正式版本予以解决。
> Conditional views in columns of NavigationSplitView fail to update on some state changes. (91311311)
> Workaround: Wrap the contents of the column in a ZStack.

#### 三列视图

创建三列视图时使用构造函数 `init(sidebar:content:detail:)`，其中第一列叫做侧边栏，第二列为内容页，第三列叫做详情页。

```swift
@State private var type: String?
@State private var poem: Poem?
@State private var path: [Poem] = []

var body: some View {
  NavigationSplitView {
    List(viewModel.types, id: \.self, selection: $type) { type in
      Text(type)
    }
  } content: {
    ZStack { // Workaround: 91311311
      if let type {
        List(viewModel.poemsWith(type: type), id: \.self, selection: $poem) { poem in
          Text(poem.title)
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

从代码中也可以发现，NavigationSplitView 内部也可以嵌入 NavigationStack，来实现更复杂的导航操作。

> 注：目前 NavigationSplitView 三列视图存在一个已知的 issue (93673059)，在小屏幕上显示时，点击最外层点击事件不生效，期待正式版能予以解决。
> Selection-driven, three-column NavigationSplitView sometimes fails to push when collapsed to a single column. (93673059)

#### NavigationSplitViewVisibility

NavigationSplitView 提供了 NavigationSplitViewVisibility 参数来设置需要显示的列，可用的值有：

- `detailOnly`: 只显示详情页
- `doubleColumn`: 三列视图只显示内容页和详情页，两列视图等价于 `all`
- `all`: 显示所有列
- `automatic`: 根据当前设备自动选择默认的显示模式

### 状态持久化和恢复

可以通过与 NavigationStack 绑定的状态 path 来获取当前视图堆栈的信息。同样地，可以通过设置 path 的值来控制视图堆栈的状态。这种实现方式，使得导航路径的持久化和恢复变得可能。以三列视图为例，我们来看一看如何做状态的持久化和恢复。一般分三步来实现：

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

    List(viewModel.types, id: \.self, selection: $navigationModel.type)

    if let type = navigationModel.type {
      ...
    }
    ```

2. 实现 Codable 接口

    在编码时，我们可以将整个 Poem 编码。但是通常是不必要的，因为 `PoemsViewModel.shared` 里已经包含了所有诗词的信息，只需要存储 id 就足够了。另外，所有的诗词信息可能从服务器获得，完全有可能被删除。不应该展示已经被删除了的内容，所以这里使用了 `pathIds.compactMap` 来处理这种情况。

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
        self.poem = PoemsViewModel.shared[poemId]

        let pathIds = try container.decode([Poem.ID].self, forKey: .pathIds)
        self.path = pathIds.compactMap({ PoemsViewModel.shared[$0] })
      }

      required init() {} // 让无参数构造函数可用
    }
    ```

3. 使用 SceneStorage 持久化和恢复

    SwiftUI 推荐使用 SceneStorage 来持久化导航状态。SceneStorage 是一种轻量级的持久化方案，SceneStorage 的工作原理与 State 非常相似，不同之处在于，如果它之前保存过，它的初始值会被系统恢复，并且这个值会被同一个场景中的其他 SceneStorage 变量共享。

    ```swift
    @StateObject private var viewModel = PoemsViewModel.shared
    @StateObject private var navigationModel = PoemBookSplitNavigationModel()
    @SceneStorage("navigation") private var data: Data?

    var body: some View {
      NavigationSplitView {...}
      .task {
        viewModel.load()

        if let data {
          navigationModel.jsonData = data
        }

        for await _ in navigationModel.objectWillChangeSequence { // objectWillChangeSequence 在 beta 版本中不可用
          data = navigationModel.jsonData
        }
      }
    ```

    目前版本的 API 缺少 `objectWillChangeSequence`, 暂时不可用。

### 迁移指引

由于 NavigationView 在 iOS 16, iPadOS 16, macOS 13, tvOS 16, 或者 watchOS 9 及以上版本中被废弃，将代码迁移到最新版本是必要的，总体来说，有三种需要迁移的情况：

- 将 `NavigationView {...}.navigationViewStyle(.stack)` 替换成 `NavigationStack`
- 将 `NavigationView {...}` 替换成 `NavigationSplitView`
- 将 `NavigationLink(... isActive: ...)` 或者 `NavigationLink(... tag: ... selection:)` 替换成 `NaviationLink(... value: ...)`
- 将  替换成 `NaviationLink(... value: ...)`

具体迁移细节，请查看官方[文档][migrating-to-new-navigation-types]。

## 新 API 适用的场景

### 配合 Regex 实现 Deeplink

TBD

## 唐诗三百首的详细实现

### NavigationPath 的使用

### PoemsDataModel 的实现

### SwiftUI 导航使用建议

1. 在能使用 NavigationSplitView 的场景尽量使用 NavigationSplitView。
2. 组合使用 NavigationSplitView、NagivationStack 和 List 实现复杂的导航效果。
3. 将 navigationDestination 放在主视图上，方便组织。

[poems-app-design]: TODO
[iOS-and-iPadOS-16-Beta-Release-Notes]: https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-16-release-notes
[poems-app-screenshot]: ./images/poems-app-screenshot.png
[poems-source-code]: https://github.com/zddhub/poems
[navigation-view]: ./images/navigation-view.png
[navigation-stack-diagram]: TODO
[migrating-to-new-navigation-types]: https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types
