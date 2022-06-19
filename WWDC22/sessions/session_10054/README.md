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
### 用法
### 不足

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
