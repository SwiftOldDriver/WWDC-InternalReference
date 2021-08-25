# WWDC21 10121 - 为内容丰富的应用量身打造高效 VoiceOver 体验

> 作者：Ckitakishi，目前在日本从事 iOS 开发，对动画和图像感兴趣，也关注 Accessibility，正在为写出优美的代码而修炼。
>
> 审核：红纸，iOS 开发，周报编辑，就职于淘系技术部


> 本文基于 WWDC21 Session 10121 - [Tailor the VoiceOver experience in your data-rich apps](https://developer.apple.com/videos/play/wwdc2021/10121/) 创作

## 前言

Accessibility（无障碍辅助功能）从来都不是一个受关注的话题，而 Apple 对 Accessibility 的支持，一定算得上其最杰出也最令人敬佩的成果之一。

Accessibility 提供了非常多类型的辅助，包括视觉，听觉和其他动作交互。由于篇幅有限，本文将聚焦于视觉辅助，自然，不得不提非常优秀的内置屏幕朗读工具 VoiceOver（旁白）。作为本文作者，虽然近年才开始关注 Accessibility，但我私心希望你可以用一首歌的时间来读一读拙作，更期望越来越多开发者愿意投入精力为自己的 App 提供更好的无障碍支持。

这篇文章的着眼点非常细微，我们将会一同探索如何为一款拥有丰富内容，甚至内容过载的 App 提供更人性化的无障碍支持。

## 如何界定内容过载

不得不说，这是一个多少有些主观的问题，但也正因为这样，讨论才有意义。

从我个人的角度来看，关键信息淹没在冗杂内容中的场景就非常能代表信息过载。但判定标准总是因人而异的，为了顾及更多用户，我们需要追求尽可能在内容展示的量上达到平衡，亦或是提供多种可选方案来满足各式各样的需求。很容易联想到这样的设计，例如，截断长文，并在最后加上“显示更多”的按钮；另一个案例是小组件，一般我们都会提供多种尺寸，用户可以根据自己关注的重点来做出合适的选择。

通常，相同时间内听觉接收信息的效率是显著低于视觉的，所以在视觉上被认为并不多的内容量，转化为听觉之后完全可能发展为过载。对于如何解决这个问题，你一定想说，那我们按照以往的经验，添加“显示更多”按钮来减少内容的复杂度如何？思路完全正确，这正是我们奋斗的目标，只不过，这次并不是在 UI 上做出相应的改变，因为我们也不想牺牲视觉正常的用户的便利性。请允许我先保留一点神秘感，在之后的部分再来揭晓这个问题的答案。

到底如何界定听觉上的内容过载呢？我的建议是，闭上双眼，假设自己身处一些可能的场景，反复听一听，确认内容是否过于冗长或繁杂以至让你感到焦躁或疲倦。要注意，并不是只需要处理内容过载的情况，当内容足够多时，我们就最好警惕起来并开始着手解决这个问题。

## VoiceOver 转子

还记得刚才留下的悬念吗？是时候揭开谜底了，实现听觉上“显示更多”的方法，正是使用转子。

### 转子是什么

转子可以理解为一种 VoiceOver 的增强导航系统，可以通过调节转子来更有效率地阅读页面上的内容。你可以通过阅读帮助文档来了解更多关于转子的事情：[关于 iPhone、iPad 和 iPod touch 上的旁白转子](https://support.apple.com/zh-cn/HT204783)。

尽管我们今天并不会定义一个全新的转子，但我还是想稍微提及一点有关自定义转子的事情。在 iOS 10 之前，用户只能够使用内置的转子，而现在，我们可以为 App 打造更贴合功能的转子。在去年的 WWDC 中，[VoiceOver efficiency with custom rotors](https://developer.apple.com/videos/play/wwdc2020/10116/)（[《WWDC 10116 - VoiceOver efficiency with custom rotors》](https://xiaozhuanlan.com/topic/9781042635)） 为我们阐述了如何实现自定义转子。

### “更多内容”转子

在类型丰富的内置转子中，有一种叫做“更多内容”的转子，它能够为不同用户和场景提供不同复杂度的内容，以满足更多人在各种场景下的需求。

Accessibility 团队在 Session 中举了一个宠物犬列表的例子，每只宠物犬都拥有名字，类型，年龄，简介等字段，如下图所示。如果将这些字段都作为内容展示给听众，对于大部分用户而言，一段尚且还好，要听完十段这样的描述，真的需要极大的耐心和热情。

![01-full](https://images.xiaozhuanlan.com/photo/2021/9e544c8633b8483aa7a5975c437e1fa0.png)

太多的内容会让人无所适从，而且从繁多的内容中提取少量自己关注的信息并不是一件轻松的事情。有一个概念叫做 DRIP (Data rich information poor) ，意思是数据丰富但信息匮乏，为了不让用户陷入这种困境，Accessibility 团队将名字和种类视为一只宠物犬最重要的特征，除此以外的内容都被放到了“更多内容”中。经过这次修改，用户再一次尝试 VoiceOver，就只会听到名字，种类和“更多内容可用”。就像下图显示的这样：

![02-more-content](https://images.xiaozhuanlan.com/photo/2021/a46fe6ce6d7294429fc3676ea0f1b85b.png)

此时只需调节转子，用户便可以按需访问“更多内容”。

![03-rotor](https://images.xiaozhuanlan.com/photo/2021/6680d6092193ecd955db12313309a4ed.png)

## Accessibility Custom Content API

摩拳擦掌，终于要开始写代码了！帮助我们实现“更多内容”的是 Accessibility Custom Content API。其实它并不是 iOS 15 新增的 API，而是从 iOS 14 开始，但 WWDC20 中完全没有提及它（或许是为了等待 SwiftUI 的支持？），不过现在也为时不晚。另外，无论是 iOS， iPadOS 还是 macOS，所有平台都支持 Accessibility Custom Content API。

Accessibility Custom Content API 主要包括一个协议 [AXCustomContentProvider](https://developer.apple.com/documentation/accessibility/axcustomcontentprovider) 和一个类 [AXCustomContent](https://developer.apple.com/documentation/accessibility/axcustomcontent)，前者提供了一个允许设置自定义内容的接口 `accessibilityCustomContent`，后者则是自定义内容本身，它包含一组标签和值。

那就开始吧。首先需要为 `DogTableViewCell` 设置无障碍标签，宠物犬的名字和种类可以被视为默认显示的内容，所以只需为 `accessibilityLabel` 赋予一个由名字与种类组合而成的值即可：

```swift
import UIKit
import Accessibility

class DogTableViewCell: UITableViewCell {
    override var accessibilityLabel: String? {
        get {
            guard let nameLabel = name.text else { return nil }
            guard let typeLabel = type.text else { return nil }
            // Tip：要记得加上逗号，否则 VoiceOver 语音的节奏和音调都会偏离你的预期
            return nameLabel + ", " + typeLabel
        }
        set { }
    }
}
```

之后则是要让 `DogTableViewCell` 遵循 `AXCustomContentProvider` 协议，并实现该协议唯一的属性 `accessibilityCustomContent`。要注意的是，`label` 和 `value` 的值都会被 VoiceOver 读出来，所以务必将它们设置为经过本地化的字符串：


```swift
class DogTableViewCell: UITableViewCell, AXCustomContentProvider {
    override var accessibilityLabel: String? { ... }
    var accessibilityCustomContent: [AXCustomContent]! {
        get {
            let notes = AXCustomContent(label: "Description", value: desc.text!)
            let popularity = AXCustomContent(label: "Popularity", value: popularity.text!)
            let age = AXCustomContent(label: "Age", value: age.text!)
            let weight = AXCustomContent(label: "Weight", value: weight.text!)
            let height = AXCustomContent(label: "Height" , value: height.text!)
            return [age, popularity, weight, height, notes]
        }
        set { }
    }
}
```

此外，`AXCustomContent` 对象中还有一个名为 `importance` 的属性，它的类型是一个可以用来控制内容输出时机的枚举：

```swift
enum Importance: UInt {
    case `default` // 需要的时候（切换到“更多内容”转子时）
    case high      // 立刻
}
```

正如 Session 中提到的，如果用户的目的是寻找一只想要领养的宠物犬，那年龄就会成为另一个关键因素，此时，我们可以通过将 `importance` 设为 `high` 来将年龄作为优先输出项目：

```swift
let age = AXCustomContent(label: "Age", value: age.text!)
age.importance = .high

```

到这里就大功告成了，我们做到了一件非常了不起的事情。从今年开始，我们甚至可以在 SwiftUI 中使用自定义内容，如果你依然兴致勃勃，那就一起来看看如何在 SwiftUI 中使用自定义内容吧。

### SwiftUI 中的 `AXCustomContent`

如果你正在用 SwiftUI，那一定不能错过今年的 Session：[SwiftUI Accessibility: Beyond the basics](https://developer.apple.com/videos/play/wwdc2021/10119)，其中介绍了一些全新的 API，更重要的是探讨了如何为用户提供最佳实践。

事不宜迟， 让我们趁热打铁来看一看之前的例子如何用 SwiftUI 实现。首先，我们需要隐藏姓名与种类之外的所有元素，这样，VoiceOver 就只会读出关键字段的内容。

```swift
import SwiftUI
import Accessibility

struct DogCell: View {
    var body: some View {
        VStack {
            HStack {
                VStack(alignment: .leading) {
                    Text(dog.name)
                        .font(.title)
                    ...
                    Text(dog.description)
                        .fixedSize(horizontal: false, vertical: true)
                        .font(.subheadline)
                        .foregroundColor(Color(uiColor: UIColor.brown))
                        // 隐藏简介
                        .accessibilityHidden(true)
                }
            }
            ...
        }
    }
}
```

为了让 VoiceOver 读出“更多内容”，下一步就是为 UI 元素添加自定义内容了。值得一提的是，下面代码中的 `.combine` 是 `AccessibilityChildBehavior` 的其中一种，它会将所有子视图的属性都合并到当前视图上。关于元素的亲子关系，你可以在上述提到的 Session SwiftUI Accessibility 中找到更详细的答案。同样地，千万不要忘记，`label` 不是 id，你需要为它设置本地化字符串。

```swift
struct DogCell: View {
    var body: some View {
        VStack {
            //...
        }
        .accessibilityElement(children: .combine)
        .accessibilityCustomContent("Age", dog.age)
        .accessibilityCustomContent("Popularity", dog.popularity)
        // ...
    }
}
```

和在 Swift 中一样，依然可以通过设置 `importance` 的值来改变内容的输出时机：

```swift
.accessibilityCustomContent("Age", dog.age, importance: .high)
```

最后，让我们来看看 Session 中提到的小 Tip，如果需要在多个地方使用自定义内容的值，不妨创建一个 `AccessibilityCustomContentKey` 扩展来避免重复定义同一个值。例如，年龄可以被定义为下述这样：

```swift
extension AccessibilityCustomContentKey {
    static var age: AccessibilityCustomContentKey {
        AccessibilityCustomContentKey("Age")
    }
}

.accessibilityCustomContent(.age, dog.age, importance: .high)
```

## 尾声

至此，我们学会了如何为一款内容丰富甚至过载的 App 提供更友好且高效的无障碍体验。自始至终，要做的事情其实只有四件：

1. 定位内容丰富的模块。
2. 如果你使用 UIKit 而非 SwiftUI，实现 `AXCustomContentProvider`。
3. 非必要的内容应当被放到 `accessibilityCustomContent` 中。
4. 如果想要立刻展示内容，将其 `importance` 属性设为 `.high`。

为了提供更酷的 Accessibility 体验，难免需要多投入一些精力来完善产品，但我相信此刻的你也会觉得这是值得的。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
