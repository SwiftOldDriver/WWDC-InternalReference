---
session_ids: [10073]
---

# WWDC24 10073 - SwiftUI 中的无障碍辅助功能更新

Accessibility (无障碍辅助功能，后续文章中简称为可访问性) 是任何优秀应用程序的基本组成部分，它允许每个人创建、连接和体验你构建的功能。SwiftUI 帮助你在苹果平台上实现这些体验。

今天，我们将深入了解 SwiftUI 如何提供开箱即用的内置可访问性，以及如何使用工具来完善和打造你的应用程序的可访问性。

接下来，我们将讨论你可能需要向 SwiftUI 提供更多信息以提高你视图的可访问性的地方。最后，我们将探索如何构建丰富的交互，其中涉及到点击和拖放。

但在此之前先来了解一下什么是可访问性(无障碍辅助功能) 。

## 什么是可访问性(无障碍辅助功能) 

主要聚焦VoiceOver

## 前言

SwiftUI 从一开始就内置了对视图的可访问性支持，并使提供额外信息给可访问性技术变得容易，以优化你的应用程序的体验。接下来，会基于下面的 Demo 来讲解可访问性。该应用程序可以发布描述了美丽海景的旅行日记，只需点击一下，就可以附加位置、海浪的录音或评价海滩的景色。每个人都可以对旅行日记发表评论，用户也可以收藏和回复他们的评论。

![demo_beach](./images/demo_beach.png)

用户甚至可以为不同朋友的回复创建自定义声音！让我们继续探索 SwiftUI 如何实现这些功能对应的可访问性特性。

SwiftUI 的主要输出之一就是创建可访问性元素（ Accessibility Element ）。可访问性元素是用来呈现和与应用程序内容交互的基本构建单元，它包括 VoiceOver、Voice Control 和 Switch Control 等。一个可访问性元素代表一个或多个视图，并提供属性（ Attributes ）来描述视图的内容，以及从点击到复杂手势的交互方式（ Actions ）。
![accessibility_elements](./images/accessibility_elements.png)

【todo：根据另外一个session补充讲解可访问性元素s以及Accessibility tree】

像 VoiceOver 这样的可访问性技术只能通过可访问性元素才能与应用程序交互，所以视图内容中必须要包含可访问性元素才能被 VoiceOver 访问到。

【todo：补充描述 voice over就是整合信息进行朗读，下面会举例】
  
## 可访问性标签
接下来讲解应用程序中 Toggle 视图，它用来控制用户的朋友们是否可以评论用户发布的旅行日记。

Toggle 视图被声明在 view 的 body 中，SwiftUI 使用它来形成输出，包括屏幕上显示的内容和可访问性元素。
![toggle_view](./images/toggle_view.png)

对于可访问性元素，"Comments" 文本被作为标签（ Label ）。`isToggle` 和 `isSelected` 特性( Traits )被应用于元素。并提供了一个按压操作来切换设置。
![toggle_attributes](./images/toggle_attributes.png)

当 VoiceOver 聚焦于 Toggle 视图时，它的描述信息会被朗读，如果双击屏幕将会执行按压操作。VoiceOver 会将 Toggle 视图朗读为 "Settings, heading, comments, switch button off, on"，SwiftUI 将 "Comments" 文本和 Toggle 视图组合成了一个单一元素。
![toggle_one_element](./images/toggle_one_element.png)

多个视图表示为一个可访问性元素，以简化导航（在 VoiceOver 中，用户通过左滑或者右滑来切换聚焦目标）并将相关信息连接在一起。在改变视图视觉外观的同时，又不会失去系统内置可访问性的支持，SwiftUI 强大的视图样式系统是其中的关键。

即使在改变视图的视觉样式时，可访问性的 Attributes 和 Actions 也会应用于视图，并且不会被改变。换言之，VoiceOver 并会关心 UI 的具体样式，而是关心它的可被理解的信息和交互。
![toggle_view_style](./images/toggle_view_style.png)

View styles 在许多不同类型的控件上得到支持，比如控件类的 Button 和 Toggle ，分组类的 Label 和 LabeledContent ，以及指示器类的如 Progress 和 Gauge 。尽可能去使用 View styles 系统而不是创建自定义视图，否则，你将失去系统默认自动配置的可访问性元素，并不得不重新配置这些可访问性元素到自定义视图上。使用 View styles 和内置视图将在你的应用程序中提供良好的可访问性体验。并且，你向 SwiftUI提 供的可访问性信息越多，体验就会越好。你可以使用可访问性修饰符（Accessibility Modifier）提供这些信息。

## 可访问性修饰符优化
可访问性修饰符能够让你自定义某个视图如何通过可访问性元素进行表示。可以向视图添加 Label 或 Trait 等属性。并且可以暴露用于交互性的 Action，如自定义手势。

可访问性修饰符（Modifier）甚至允许你将视图组合成一个单一元素以改善在 VoiceOver 中的导航体验。

接下来会通过3个例子，通过可访问性修饰符改进应用程序的 VoiceOver 体验。

### 默认没有可访问性元素优化

第一个优化点是未阅读指示器视图（就是在评论文案左边的蓝色小圆点，表示该评论没有被用户阅读过）。默认情况下，未阅读指示器视图没有可访问性元素，因为它被表示为形状视图，所以，让我们首先添加一个标签来描述评论是否没有被阅读过。
![unread_indicator_codes_sample](./images/unread_indicator_codes_sample.png)

当评论是未读时，未阅读指示器视图将始终对可访问性系统可见。SwiftUI 在评论变为已读时也有所帮助。当评论是已读时，未阅读指示器视图的不透明度变为零，视觉上隐藏。SwiftUI 也会自动从可访问性系统中隐藏该元素。

### 多视图组合为单一元素优化
第二个优化点是，为了简化在评论卡片视图之间进行导航，可以使整个评论卡片视图成为一个可访问性元素，并将其中的每个按钮变成这个元素的 Action。通过应用 `.accessibilityElement(children: .combine)` 修饰符，多个元素的 Attributes 和 Actions 可以被组合在一起。
![combine_codes_sample](./images/combine_codes_sample.png)
![combine_merge_into_one](./images/combine_merge_into_one.png)

优化之后，整个评论卡片会被 VoiceOver 朗读为 "Unread, Looks like a wonderful time, Nick, button"。然后向上滑动切换 Action 的时候会依次朗读 "Favorite, reply"。
![comment_card](./images/comment_card.png)

### 条件性可访问性标签优化
第三个优化点，就是当收藏按钮的状态发生变化的时候，可访问性标签也需要跟着一同更新。让我们看看在优化之前有哪些问题点。

当双击收藏评论按钮时，它变成了超级收藏。超级收藏使用一个新 Symbol 来表示它们的重要性。但这个变化引起了一个新问题，现在 VoiceOver 朗读了新 Symbol 的名字 sparkle，而不是它所代表的超级收藏含义。
![super_favorite_ui](./images/super_favorite_ui.png)

当在视图中使用 Symbol 时，默认使用它的名字当做可访问性标签。我们可以使用如下图所以得 Modifier 去覆盖掉默认的标签，以提供更明确定义。
![super_favorite_codes_sample](./images/super_favorite_codes_sample.png)

在 iOS 18 中，你现在可以向可访问性修饰符添加一个 `isEnabled` 参数。该 Modifier 仅在 `isSuperFavorite` 为 `true` 时生效。

## 交互方式增强

### 悬浮弹框交互增强

因为 VoiceOver 不支持悬浮弹框等交互方式，对于需要多次交互的场景，提供更简单的方法来呈现可访问性信息，可以提升使用应用程序的可访问性体验。

可以通过当视图因为悬停(Hover)、按键(Key Press)或手势(Gesture)交互方式出现时，来探索这些增强功能。

下面将在 macOS 系统上展示如何优化悬停交互，当鼠标悬停在旅行日记图像上时，包括其位置、录音和海滩评级的按钮会出现。

像悬停视图这样动态出现的内容，可能需要更长的时间才能通过可访问性技术或触摸以外的替代输入源导航到，如键盘（Keyboard）或开关（Switch）。
![hover_trip_ui](./images/hover_trip_ui.png)

但 VoiceOver 必须执行很多步骤才能导航到这个视图。首先悬停交互必须使用命令被触发，并且悬停视图必须被聚焦。一旦视图出现，子视图必须被导航到。然后交互结束之后，焦点必须返回到原始视图。
![hover_in_voiceover](./images/hover_in_voiceover.png)

这种交互可以通过将悬停视图的可访问性Attributes 和 Actions 作为主视图的一部分来简化。
![hover_into_trip_view](./images/hover_into_trip_view.png)

为了让悬浮控件更容易被访问，可以将它们变成 Trip View 上的自定义 Action 。
![hover_actions_code_sample](./images/hover_actions_code_sample.png)

上图中 `accessibilityActions` 修饰符接受在 `overlay` 修饰符同样的 `MessageAttachments`，它提取相同的控件并将它们转换为旅行视图上的自定义 Action。现在，悬停覆盖层和旅行视图的自定义 Action 可以共享相同的逻辑。有了这个改变，VoiceOver 现在可以在不显示悬浮视图的情况，去支持自定义的 Action。
![hover_message_attachments](./images/hover_message_attachments.png)

### 动态更新可访问性标签增强
当重要信息需要多次交互才能获取到时，你可能想考虑将该信息附加到不包括它的元素上，但使其更容易被导航到。
另外，如果你修改了可访问性元素的属性，如组合多个元素，你可能想包括由装饰视图（比如上文提到的未阅读指示器视图）提供的附加内容。

这两种情况都需要修改内容可能不是静态的视图的标签，SwiftUI 提供了处理这两种情况的工具。

比如把评级信息附加到旅行视图元素的标签上，以简化使用 VoiceOver 找到它。

<!-- 并且因为评级有事才会出现，我只想在某些消息上包含它。 -->

在下图中的可访问性标签修饰器中，现在也接受一个视图，并将从视图中提取文本并将其设置在现有元素的标签上。也就是说，它允许根据实际情况去动态地拼接额外的信息到最终的标签上。
![label_optimize_append](./images/label_optimize_append.png)

优化之后，在 VoiceOver 朗读旅行视图的时候，会在有评级信息的情况下，一同朗读评级信息："Half star, Saturday, It was a beautiful weekend! The waves were calm, the sun was shining on the bridge, and there wasn't a cloud in the sky.Image" 
 
### 拖放功能增强

在构建应用程序的交互时，重要的是要记住为触摸或鼠标的替代形式设计出色的体验。其中拖放（ Drag and Drop ）是你构建的许多体验的核心之一。

像 VoiceOver 和 Voice Control 这样的可访问性技术可以与拖放一起工作，SwiftUI 使用 `onDrag` 和 `onDrop` 修饰符支持可访问的体验。

拖放的用户界面是灵活的，因此有几种方法可以增强你的应用程序的体验。
接下来，我们要实现使用拖放为朋友们创建自定义提示音，当他们评论时就会播放对应的自定义提示音。

让我们用 VoiceOver 试试，我可以拖动多达三种声音为联系人创建提示音。
![drag_ui](./images/drag_ui.png)

可访问性拖放点修饰符定义了你视图中可以拖或放的点。在评论提示音视图上，我定义了三个下放点，描述了我可以为提示音设置的三种不同声音。

每个点还提供了一个标签，描述将执行的交互。现在 VoiceOver 可以访问提示音视图上的每个下放点。
![drop_codes_sample](./images/drop_codes_sample.png)

在构建拖放体验时，始终尝试使用可访问性技术进行测试，以确保它们提供的功能是可用的。

### Widget增强

可访问性交互可以扩展到你的应用程序之外，比如交互式 Widget 。在 Widget 视图中不会实时更新，所以 `accessibility action` 修饰符不会起作用。

应用程序意图（Intent）允许 Widget 创建像 Buttons 和 Toggles 这样的交互视图，但可能有一些地方可以通过额外的自定义操作来提升你的 Widget 的体验。下面会在 Widget 中实现一个功能，让用户可以快速评价和发布去过的海滩日记。只需点击一下，用户甚至可以更新我最喜欢的海滩的排名。每个按钮都由 SwiftUI 标记，并且可以由 VoiceOver 激活。
![widget_ui](./images/widget_ui.png)
<!-- 这是我的海滩视图，有三个交互按钮来发布和排名海滩。我想通过自定义操作使我的小部件的使用体验更好。 -->

`accessibility action` 修饰符现在接受一个应用程序意图，当调用时将执行意图并更新你的 Widget。

在这里，添加了一个自定义操作，将海滩设置为我最喜欢的海滩，以及一个 `magicTap` 操作，只需双击就可以拍照。
![widget_intent_codes_sample](./images/widget_intent_codes_sample.png)

有了这些改变，用户现在可以标记我最喜欢的海滩，它将移动到列表的顶部。

## 总结
现在我们已经讲解了如何在 SwiftUI 应用程序中支持可访问性，并建议确保使用 VoiceOver 等可访问性技术测试你的应用程序。也研究了可访问性 API 如何帮助使应用程序的体验更好。并探索可访问性示例项目，以便更好地了解如何使用可访问性 API 来完善 SwiftUI 中的常见模式。

## 参考

1. [Apple - Catch up on可访问性in SwiftUI](https://developer.apple.com/videos/play/wwdc2024/10073/)
2. [Apple -可访问性in SwiftUI](https://developer.apple.com/videos/play/wwdc2019/238/)

