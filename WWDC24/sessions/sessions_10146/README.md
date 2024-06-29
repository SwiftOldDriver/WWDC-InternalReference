---
session_ids: [10104]
---

# WWDC24: Session 10146 - Demystify SwiftUI containers

## 前言

Swift UI 在其 API 中提供了许多功能完备的容器。比如List 容器，它可以使用尾视图构建闭包（Trailing View Builder Closure）来构建它们的内容。它允许以静态方式定义内容，就像这个包含硬编码内容的List 容器

```swift
List {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")
}
```



但也可以动态定义内容，例如使用 ForEach 视图根据数据集合生成文本视图，视图构建器支持在同一个容器内组合任何类型的内容。

```swift
List {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")

  ForEach(otherSongs) { song in
    Text(song.title)
  }
}
```



它支持更高级的功能，例如将内容分组到具有可配置 Header 和 Footer 的不同 Section，以及针对容器进行定制的修饰符，就像在这个示例中我使用.listRowSeparator隐藏了 List 视图每行之间的分隔符。

```swift
List {
  Section("Favorite Songs") {
    Text("Scrolling in the Deep")
    Text("Born to Build & Run")
    Text("Some Body Like View")
  }

  Section("Other Songs") {
    ForEach(otherSongs) { song in
      Text(song.title)
        .listRowSeparator(.hidden)
    }
  }
}
```



## 背景

正巧我最近刚接到了一个庆祝 WWDC 成功举行的卡拉OK的邀请，要回复请帖，我必须要提交我计划唱的歌曲名字，而我还没想好唱什么歌。

我打算使用SwiftUI的新API所带来的灵活性来帮助我解决这个问题。首先我会把我的想法都列在展示板(DisplayBoard)上。



![展示板DisplayBoard](images/display_board_UVlPWNFZUn.png "展示板DisplayBoard")



我初始化了一个DisplayBoard来展示我的歌曲选项集合，它会将我数据集合中的歌曲名字映射到Text 视图上，而这些视图被写在卡片上并被钉在展示板（DisplayBoard）上。

```swift
// Data-Driven DispalyBoard

@State private var songs: [Song] = [
  Song("Scrolling in the Deep"),
  Song("Born to Build & Run"),
  Song("Some Body Like View"),
]

var body: some View {
  DisplayBoard(songs) { song in
    Text(song.title)
  }
}
```



而在DisplayBoard的代码实现中，我采用了自定义的样式，让卡片被随机地钉在整个DisplayBoard上。通过一个ForEach视图对数据集合进行遍历，通过每一项数据来初始化CardView。

```swift
// DisplayBoard implementation

var data: Data
@ViewBuilder var content: (Data.Element) -> Content

var body: some View {
  DisplayBoardCardLayout {
    ForEach(data) { item in
      CardView {
        content(item)
      }
    }
  }
  .background { BoardBackgroundView() }
}
```

这是一个好的开始，但是我的DisplayBoard容器限制了我的创造，它只允许通过一个单一的数据集合进行构造。&#x20;

## Composition

我可以通过添加一些对更多种类的Composition的支持来使我的容器更加具有灵活性。但首先，我们得弄明白什么是Composition。

想象一个SwiftUI的List视图，展示一串别人给我推荐的歌曲。这个List视图通过一个数据集合进行初始化，就像我的DisplayBoard。

```swift
List(songsFromSam) { song in
  Text(song.title)
}
```



但是SwiftUI也支持用其他的方法创建List。比如我可以手动编写一连串Text视图。

```swift
List {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")
}
```



SwiftUI通过提供新的API来将这两种方式结合在一起，新的API可以将两种内容进行组合。比如，我可以直接将两种方式结合起来初始化List，这样一个组合的List就是一个Composition的例子。在同一个List中，我可以用硬编码方式静态的定义前三行内容，同时用数据集合动态的生成剩下的内容。

```swift
// List Composition

List {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")

  ForEach(songsFromSam) { song in
    Text(song.title)
  }
}
```



### 新API —— ForEach(subviewOf:)

我希望我的DisplayBoard容器也能够支持类似的灵活构建，为了达到这个目的，我需要修改我的实现。

第一步就是重构我的容器，使它可以通过一个View Builder来进行初始化。我将单一的数据集合参数替换成一个ViewBuilder视图对象。

通过添加这个ViewBuilder属性，我默认的初始化器可以自动的通过一个尾视图创建闭包来构建内容。

```swift
// DisplayBoard implementation

 @ViewBuilder var content: Content
 
var body: some View {
  DisplayBoardCardLayout {
    ForEach(data) { item in
      CardView {
        content(item)
      }
    }
  }
  .background { BoardBackgroundView() }
}

// Use Trailing View Builder Closure To Init DisplayBoard

DisplayBoard {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")
}

DisplayBoard {
  ForEach(songsFromSam) { song in
    Text(song.title)
  }
}
```



接下来，我需要使用我的新的content视图来更新我的view body，我可以通过使用一个新的API：ForEach(subviewOf:), 这个ForEach视图接受一个单独的view作为输入参数，并返回view中的每一个subview给到trailing closure。通过这样的方式可以将每一个subview转换成其他类型的视图，比如我的CardView。

```swift
// Use New API: ForEach(subviewOf:)

@ViewBuilder var content: Content

var body: some View {
  DisplayBoardCardLayout {
     ForEach(subviewOf: content) { subview in
       CardView {
        subview
      }
    }
  }
  .background { BoardBackgroundView() }
}
```



最后我们更新DisplayBoard 的初始化，传入之前用在List视图中的组合数据，将每一个Text视图转为 展示板上的CardView。

```swift
// Update DisplayBoard Initializer

DisplayBoard {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")

  ForEach(songsFromSam) { song in
    Text(song.title)
  }
}
```



这是一个巨大的进步，但是中间是如何运作的呢？。我们来仔细看看新API ForEach(subviewOf:), 到底什么是subview？&#x20;

一个subview简单的说就是被包含在另外一个view中的view。看看代码，这里面有多少个subview呢？&#x20;

```swift
DisplayBoard {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")

  ForEach(songsFromSam) { song in
    Text(song.title)
  }
}
```



这里面有3个Text视图和1个ForEach视图。但是ForEach视图不仅仅只是一个视图，它是一个包含了9个视图的集合。因此这里一共有12 个视图，也就是有12个卡片展示在展示板上。

![](images/image_Ab8Af5-B3Z.png)



很重要的一点是要明白两种不同的subview的差异性。在DisplayBoard的初始化器中，用橙色方框标记出的是Declared subview。 而用蓝色方框标记出来的，则是最终展现在屏幕上的view，被称为Resolved Subviews，其中包含3个手动声明的Text视图以及9个通过ForEach生成的Text视图。

![](images/image_fSHiwlWWTb.png)

![](images/image_-11K5akQfG.png)



在SwiftUI的声明式系统中，Declared subviews定义了生成Resolved subviews的配置。

![](images/image_Jenof2J38k.png)



举个例，一个ForEach视图是一个并不会在界面上有任何具体展现或动作的Declared subview。 但是，ForEach视图的目的是生成一连串的Resolved subview。

```swift
// 1 declared view
ForEach(songsFromSam) { song in
  Text(song.title)
}

// 9 resolved subviews
Text("I Container Multitudes")
…
Text("Love Stack")
```



Group视图也是另外一个内建容器的例子，它包含了一连串resolved subviews。 比如 一个包含了3个Text视图的Group视图，最终会解析为3个对应的subview。

```swift
// 1 declared view
Group {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")
}

// 3 resolved subviews
Text("Scrolling in the Deep")

Text("Born to Build & Run")

Text("Some Body Like View")
```



对于某些declared subview，甚至可能产生0个resolved subview，比如 EmptyView。或者在某些条件下会转换成不同数量的subview，比如在不同的条件判断下。

```swift
// 1 declared view
EmptyView()  

// Zero resolved subviews
```



而新的ForEach(subviewOf:)接口，会遍历其中所有的Resolved subview。这使得我的容器可以支持任意的视图内容，不管subview是如何声明的，SwiftUI都会将其转为Resovled subview进行处理。



### 新API —— Group(subviewsOf:)

支持灵活的视图构成，使得添加新的歌曲到面板上非常容易。除了Sam的歌曲外，Sommer也慷慨地推荐了一些她喜欢的歌。我可以用另外一个ForEach来添加她推荐的歌曲。

```swift
DisplayBoard {
  Text("Scrolling in the Deep")
  Text("Born to Build & Run")
  Text("Some Body Like View")

  ForEach(songsFromSam) { song in
    Text(song.title)
  }

  ForEach(songsFromSommer) { song in
    Text(song.title)
  }
}
```



现在我们发现，这个展示板已经有点拥挤了。

![](images/image_V-zVm30z4w.png)



我想在卡片数量超过15个的时候，缩小卡片的大小。为了计算卡片数量，我们可以使用另外一个新API：Group(subviewsOf:),  我们可以在代码中用它包裹住ForEach。就像ForEach(subviewOf:)一样, 它也会通过传入一个view来解析出他的所有subviews。 Group(subviewsOf:) 会返回一个包含了所有Resolved subview的集合，而不是进行遍历。

```swift
// Use New API: Group(subviewsOf:)

@ViewBuilder var content: Content

var body: some View {
  DisplayBoardCardLayout {
     Group(subviewsOf: content) { subviews in
       ForEach(subviews) { subview in
        CardView {
          subview
        }
      }
    }
  }
  .background { BoardBackgroundView() }
}
```



接下来我就可以使用集合的count属性来检查subview视图的总数，以在其数量超过15个的时候，缩小卡片视图的大小。

```swift
@ViewBuilder var content: Content

var body: some View {
  DisplayBoardCardLayout {
    Group(subviewsOf: content) { subviews in
       ForEach(subviews) { subview in
         CardView(
           scale: subviews.count > 15 ? .small : .normal
         ) {
          subview
        }
      }
    }
  }
  .background { BoardBackgroundView() }
}
```



完成代码后当我再次运行app，卡片缩小了也更加易读了。但还是感觉有点凌乱，所以下一步我们会添加对Section的支持。

![](images/image_jf3fBVKidz.png)

****

## Sections

List是一个支持Setion，使用SwiftUI的Section视图的典型容器。一个Section视图很像一个Group视图，但有着更多的section特定的数据，比如可选的header和footer。

```swift
List {
  Section("Favorite Songs") {
    Text("Scrolling in the Deep")
    Text("Born to Build & Run")
    Text("Some Body Like View")
  }

  Section("Other Songs") {
    ForEach(otherSongs) { song in
      Text(song.title)
    }
  }
}
```

对于我的DisplayBoard，我的目标是为每一个人推荐的歌曲创建一个单独的section。 但是自定义的容器默认并不支持section，因此我需要做一些多余的工作。

```swift
// Custom Container do not support Section for now
DisplayBoard {
  Section("Matt's Favorites") {
    Text("Scrolling in the Deep")
    Text("Born to Build & Run")
    Text("Some Body Like View")
  }
  Section("Sam's Favorites") {
    ForEach(songsFromSam) { song in
      Text(song.title)
    }
  }
  Section("Sommer's Favorites") {
    ForEach(songsFromSommer) { song in
      Text(song.title)
    }
  }
}
```



这是我预想的设计简图，将界面分割成3个垂直的Section，而Header展示在每个Section最上面。

![](images/image_Dd7MRPbU9z.png)



在我的实现中，首先我会将现有的卡片视图的样式逻辑抽离出去。

```swift
// DisplayBoard Implemention

@ViewBuilder var content: Content

var body: some View {
   DisplayBoardSectionContent {
    content
  } 
  .background { BoardBackgroundView() }
}

 struct DisplayBoardSectionContent<Content: View>: View {
  @ViewBuilder var content: Content
  ...
}
```



### 新API —— ForEach(sectionOf:)

下一步，为了将展示板分成多列，我会用HStack包裹Section的内容。为了构建这些列，我需要访问每个Section的内容。为了达到这个目的，我们可以使用ForEach的新API：ForEach(sectionOf:). 它和ForEach(subviewOf:)类似，接受一个view作为传入参数。

而在这个API中，它会遍历所有传入的view中的Section视图，传递Section配置给他的view builder闭包。每一个Section都有一个它的content 视图的属性，我可以将它传给之前抽离出的工具方法。

```swift
// Use New API: ForEach(sectionOf:)
@ViewBuilder var content: Content

var body: some View {
   HStack(spacing: 80) {
     ForEach(sectionOf: content) { section in
      DisplayBoardSectionContent {
        section.content
      }
    }
  }
  .background { BoardBackgroundView() }
}
```



最后再进行一些润色，给每一个Section添加一个背景，使他们能够视觉上区分开来。

```swift
@ViewBuilder var content: Content

var body: some View {
  HStack(spacing: 80) {
    ForEach(sectionOf: content) { section in
      DisplayBoardSectionContent {
        section.content
      }
       .background { BoardSectionBackgroundView() }
     }
  }
  .background { BoardBackgroundView() }
}
```

再次运行app，通过section现在我可以更好的辨识出各种卡片了。接下来我要添加对section header的支持。



![](images/image_XE73GpoALK.png)



我会首先把每一个Section用VStack包裹，并添加Header和内容样式。接下来，通过isEmpty属性，我可以判断这个Section是否需要展示Header。如果需要展示Header，那么他会展示一个我之前写的自定义Header视图。

```swift
@ViewBuilder var content: Content

var body: some View {
  HStack(spacing: 80) {
    ForEach(sectionOf: content) { section in
      VStack(spacing: 20) {
         if !section.header.isEmpty {  // 检查是否要展示Header
          DisplayBoardSectionHeaderCard { section.header }  // 展示自定义的Header视图
        } 
         DisplayBoardSectionContent { 
          section.content
        }
        .background { BoardSectionBackgroundView() }
      }
    }
  }
  .background { BoardBackgroundView() }
}
```

再重新跑App，现在每一个Section上方都有一个Header视图了。

![](images/image_UcD4NoF5Bs.png)



## Customization

为了开始选一首歌，我需要能够划掉我舍弃的选项。我可以通过修改我的容器来支持这样的能力。在前言里，我展示了一个使用.listRowSparator() modifier的例子。即使这个modifier是应用于这个List中的一个视图，这个List容器自身也有义务实现在每行之间添加分割线的样式。

```swift
List {
  Section("Favorite Songs") {
    Text("Scrolling in the Deep")
    Text("Born to Build & Run")
    Text("Some Body Like View")
  }

  Section("Other Songs") {
    ForEach(otherSongs) { song in
      Text(song.title)
        .listRowSeparator(.hidden)
    }
  }
}
```

在DisplayBoard中，我想添加能够把我不想要的歌曲划掉的功能。有一个新的API专门用于建设这类容器专有能力的modifier，被称为Container Values.



### New API —— Container Values

Container Values是一种新的Key-Value存储，在概念上和Environment和Preferences很类似。

但是和Environment Values不同在于，Environment Values会通过整个视图树向下传递。

![](images/image_H-0asBv3UO.png)



而Preference Values，则会通过整个视图树向上传递。

![](images/image_w4lh2c2NWF.png)



一个Resolved Subview的Container Values只能被它的直接容器所访问，这使得Container Values成为理想的工具来实现容器特定的自定义能力。

![](images/image_aZYw6iZLZ-.png)



在我的DisplayBoard中，我会使用Container Values去创建一个自定义的视图modifier来划掉卡片。定义一个新的Container Value只需要几行代码。

第一步，我会创建一个ContainerValues的extension，这是一个SwiftUI的新类型。

```swift
// Declare Container value

extension ContainerValues {
  @Entry var isDisplayBoardCardRejected: Bool = false
}
```

在这个extension中，我会声明一个使用[@Entry 宏](https://developer.apple.com/documentation/swiftui/entry\(\)/ "@Entry 宏")标记的新属性，它存储了一个Bool值来跟踪卡片是否被划掉。

这个[@Entry 宏](https://developer.apple.com/documentation/swiftui/entry\(\)/ "@Entry 宏")是一个新的API，它提供了简便的语法来给SwiftUI的 存储添加新值，包括Environment Values，Focused Values等等。

下一步，我会声明一个自定义的视图modifier以方便设置我声明的container value 值。这个modifier会将传入的值通过key path设置到container value。

```swift
extension View {
  func displayBoardCardRejected(_ isRejected: Bool) -> some View {
    containerValue(\.isDisplayBoardCardRejected, isRejected)
  }
}
```



好了，现在我会给我的容器添加这个能力。在我们Section 的实现中，我需要给我自定义的CardView添加isRejected参数来表明这个内容是否被拒绝。而通过新添加的Container Values属性我可以达到这样的目的，Container Values的属性可以通过Resolved subview或者Sections获取到。

我会将我自定义的值传到CardView的isRejected参数中，当CardView的isRejected是true时，CardView会显示一个自定义的划掉样式。

```swift
struct DisplayBoardSectionContent<Content: View>: View {
  @ViewBuilder var content: Content

  var body: some View {
    DisplayBoardCardLayout {
      Group(subviewsOf: content) { subviews in
        ForEach(subviews) { subview in
           let values = subview.containerValues 
          CardView(
            scale: (subviews.count > 15) ? .small : .normal,
             isRejected: values.isDisplayBoardCardRejected 
          ) {
            subview
          }
        }
      }
    }
  }
}
```

通过这个Modifier，我就可以实现我划掉歌曲的能力。 我虽然喜欢歌曲*Scrolling in the Deep*，但我不确定我能唱得好，因此我划掉它。这个时候在DisplayBoard上就会展示一个大大的红色斜杠。

Sam优先选择了一些歌曲，所以我也会划掉这些Sam已选则的歌曲。

而对于Sommer，我不太确定他打算唱什么，所以为了保险起见，我会划掉所有他的歌曲。通过将modifier应用到整个section，这个section下的所有subview都会被设置这个值。也就是所有Sommer的歌曲都被划掉了。

```swift
DisplayBoard {
  Section("Matt's Favorites") {
    Text("Scrolling in the Deep")
       .displayBoardCardRejected(true)  // 划掉我唱不好的歌曲
     Text("Born to Build & Run")
    Text("Some Body Like View")
  }
  Section("Sam's Favorites") {
    ForEach(songsFromSam) { song in
      Text(song.title)
         .displayBoardCardRejected(song.samHasDibs) // 划掉Sam已决定唱的歌曲
     }
  }
  Section("Sommer's Favorites") {
    ForEach(songsFromSommer) { Text($0.title) }}}
  }
   .displayBoardCardRejected(true) // 对整个Section设置，划掉Sommer所有的推荐歌曲
 }
```

![](images/image_rDr6rzFvVm.png)



好的，我们已经朝着选到一首完美的卡拉OK歌曲迈进了一大步了，不过我还是要做出最终的选择。 在此期间，我们可以总结一下：

- 将ForEach和Group使用在初始化器上，去遍历，或者转换Resolved subview和Section视图
- 如果你的容器设计需要，那么你可以使用Section为其提供更多的能力
- 可以采用Container Values 来自定义每一块单独的内容









