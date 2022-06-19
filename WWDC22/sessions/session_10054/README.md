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

最后一部分通过一个完整的例子验证本文中提到的技术。

## 唐诗三百首 App

唐朝是中国诗歌发展的黄金时代，云蒸霞蔚，名家辈出，唐诗数量多达五万余首。其中广为流传的唐诗选集《唐诗三百首》，收录名诗三百一十余首。包含五言古诗、五言乐府、七言古诗、七言乐府、五言律诗、七言律诗、五言绝句和七言绝句共八种体裁，七十余位唐代名家作品。非常适合用来展示导航的使用。

[唐诗三百首 App 设计图][poems-app-design]

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

[唐诗三百首 App 截图][poems-app-screenshot]

## 现有导航方案回顾

从 SwiftUI 诞生起，NavigationView 加 NavigationLink 的组合就是实现导航栏的标配，使用起来也是非常的简单。在你显示内容最外层加上 NavigationView，然后在需要导航的地方加上 NavigationLink 就好。NavigationLink 通过 `destination` 来指定点击后需要导航到的目标视图。在 iPadOS 和 macOS 上，目标视图的内容会出现在下一列。其它平台将目标视图放入堆栈，并使用平台特定的控件，比如后退按钮或者滑动手势，从堆栈中删除目标视图。NavigationLink 可以出现在显示内容的任意层级，或者出现在目标视图的子视图中，而 NavigationView 通常只需要一个。

[NavigiationView][navigation-view]

以下代码创建了一个体裁的列表，点击不同的体裁类型后，导航到诗名列表中。

```swift
NavigationView {
  List(viewModel.types, id: \.self) { type in
    NavigationLink(type, destination: PoemList(poems: viewModel.poemsWith(type: type)))
  }
  .navigationTitle(Text("Type"))
}
```

### 不足

这种导航能满足多数的使用场景，但是存在以下缺点：

- 上述例子中的 `PoemList` 被重复创建多次

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
    .navigationTitle(Text("Type"))
  }
}
```

这种能力提供了极大的便利性，但是存在三个问题：
1. 需要为 List 中的每个 NavigationLink 提供一个 State 变量，比较繁琐。
2. NavigationLink 可以存在于任意层级的子 View 中，当层数变多变深时，即使借助于 EnvironmentObject，这种状态也难以管理。
3. 视图堆栈中的视图可能来自于编程（设置 `isActive = true`），也有可能来自点击或者手势，想要记录完整的导航路径时，就需要给路径上的所有 NavigationLink 加上 `isActive`，如果路径存在循环，那简直是一种灾难。

幸好，新版的 APIs 一举解决了上述所有问题。

## 新导航方案
### NavigationStack
### NavigationSplitView
### 状态持久化和恢复
### 迁移指引

## 新 API 适用的场景
### Deeplink

## 唐诗三百首的详细实现
### 实现
### 技巧 tips


[poems-app-design]: TODO
[iOS-and-iPadOS-16-Beta-Release-Notes]: https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-16-release-notes
[poems-app-screenshot]: TODO
[navigation-view]: ./images/navigation-view.png
