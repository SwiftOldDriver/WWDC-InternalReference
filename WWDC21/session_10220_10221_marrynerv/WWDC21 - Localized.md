# WWDC21 - 本地化功能上新
## 引言
本地化，这个在开发中不起眼的**体力活**，在最新的 WWDC 中迎来的它的新特性，这将能帮助我们简化目前的本地化的操作。尽管国内的 app 并不会有很多的本地化需求，但是如果想要希望自己的 app 能够拓宽国际化的市场，或者支持多语言的需求，本地化就是必不可少的第一步。接下来，就让我们来一起看看本地化都有了哪些新变化。
> 本文基于   
> [Localize your SwiftUI app - WWDC21 - Videos - Apple Developer](https://developer.apple.com/videos/play/wwdc2021/10220/)  
> [Streamline your localized strings - WWDC21 - Videos - Apple Developer](https://developer.apple.com/videos/play/wwdc2021/10221/)  
> TIPS: 本文旨在介绍新的本地化 api，不涉及本地化的创建。  
- - - -
## 目录
[TOC]
- - - -
## 本地化的当下
### 目前如何实现
本地化的内容主要来源于三个部分，**工程内的代码文本、 info.plist 中的权限设置、可视化编程 (Storyboard / xib) 内的组件文本**。目前我们使用时一般通过 `NSLocalizedString(key, comment)`、可视化编程系统自动匹配、`R.swift` 等三方库来调用本地化文本。
目前 OC 本地化的四种宏定义均为下方方法的简化使用。
``` objc
// 本地化四种宏定义
NSLocalizedString(<#key#>, <#comment#>)
NSLocalizedStringFromTable(<#key#>, <#tbl#>, <#comment#>)
NSLocalizedStringFromTableInBundle(<#key#>, <#tbl#>, <#bundle#>, <#comment#>)
NSLocalizedStringWithDefaultValue(<#key#>, <#tbl#>, <#bundle#>, <#val#>, <#comment#>)
// NSBundle.h 实际调用
[NSBundle.mainBundle localizedStringForKey:@"key" value:@"val" table:@"tbl"]
```
swift中则已经已经改为了单独的一个函数。
``` swift
// Foundation
public func NSLocalizedString(_ key: String, tableName: String? = nil, bundle: Bundle = Bundle.main, value: String = "", comment: String) -> String
```
- - - -
### 现存缺陷
目前的本地化不够灵活，在一些需要动态处理的文本上使用起来较为麻烦。有做过本地化的同学一定对以下问题并不陌生，这些不是很困难的问题，但是遇到了也着实有些头疼。
* 本地化文本中部分文本需要有动态数值变化
* 本地化文本中的内容需要动态拼接显示
* 本地化文本的符号转换
* 阿拉伯语语言特性 - 阅读顺序从右到左
。。。。。。
- - - -
## 本地化的未来
### 基础使用
这次的更新可以说是充分考虑到了本地化目前的缺陷，官方优化了 api，并且极大的支持了本地化中可能出现的情景。
SwiftUI 中可以直接使用本地化中的 key。系统会根据 key 自动在项目包中执行本地化的字符串查找。
```swift
Button("Key") { ... }
```
Storyboard 可以在控件可视化的属性设置相应的 key。
![](WWDC21%20-%20%E6%9C%AC%E5%9C%B0%E5%8C%96%E5%8A%9F%E8%83%BD%E4%B8%8A%E6%96%B0/D49F2583-2626-4E5C-949B-444D13E8F9CD.png)
其他地方可以使用专用方法。
```swift
// 旧api
button.title = NSLocalizedString("Key" ...)
// 新api
button.title = String(localized: "Key")
```
- - - -
### 本地化带参数的文本
新 api 支持在文本中的添加数量操作，极大的提升了灵活性。
```swift
// localizedString
"Order %ld Tickets" = "xxxx"
// swift
button.title = String(localized: "Order \(count) Tickets")
// swiftUI
Button("Order \(count) Tickets") { ... }
```
- - - -
### 陷阱
新 api调用方式看似和 format 很相似，但却是两个是**完全不同**的文本调用，一定要区分清楚。
```swift
button.title = String(localized: "Order \(count) Tickets")
button.title = String(format: "Order %d Tickets", count)
```
- - - -
### 本地化动态变化的文本
遇到本地化字符串需要动态拼接时，尽量**避免拼接**，最好将需要拼接的内容分成所需的不同情况分别调用。
```swift
// 错
let nowOrLater = isInstant ? String(localized: "Now") : String(localized: "Later")
String(localized: "Order \(nowOrLater)")
// 对
String(localized: "Order Now")
String(localized: "Order Later")
```
- - - -
### 本地化注释
一般来说，大家在写本地化的时候，都不会写 comment，甚至为了省略 comment，会单独封装方法来达到省略 comment 的目的。但是如果团队是离散分布的，团队成员之间的**沟通**是否高效决定了项目是否能高效地推进，此时你需要让翻译人员快速了解某个控件是什么含义，注释就是最好的选择。
```swift
Text("Order", comment: "Button: confirms concert tickets booking")

String(localized: "Order", comment: "Button: confirms concert tickets booking")

Text("\(ticketCount) Ordered", comment: "Order summary: total number of tickets ordered")
```
- - - -
### 其他的本地化函数调用方式
对应 OC 中四个本地化的宏定义，最新的 api 也支持根据文件名或者包名查找对应的本地化文本。
指定文件名获取本地化文本。
```swift
Text("\(ticketCount) Ordered",
talbeName: "UserProfile",
comment: "Profile subtitle: total number of tickets ordered")
```
指定包名获取本地化文本。
```swift
String(localized: "Complete",
bundle: Bundle(for: AnyClassInTicketKit.self),
comment: "Standalone ticket status: ordder finalized")
```
与此同时，新的Xcode也有相应的功能功能更新，在 `Xcode -> Product -> Export / Import Localizations`中可以方便的导出/导入本地化文件，方便管理和使用。
- - - -
### 本地化文本支持复数显示
新的 api 还支持了复数显示，不过该功能更多的适用于英语及专门区分复数单词的语言。虽然功能很细小，但是如果自己实现相应效果，免不了徒增若干的条件运算符或者 if 判断。这个功能属于是一般用不到，用到的时候就会感觉到非常的省事。
```swift
String(localized: "Order \(ticketCount) Ticket(s)")

// Order 0 Tickets
// Order 1 Ticekt
// Order 2 Tickets
```
- - - -
### 本地化单位符号
不同语言里的单位符号也是本地化的一大难题。为了达到理想的效果，总是免不了写很多的匹配处理，使得不用语言下能适配各自的单位符号。不过从今往后这类问题就迎刃而解了，新的 api 支持了不同语言的符号系统，可以非常方便的帮助我们自动转化。
```swift
Text("Total: \(price, format: .currency(code: "USD"))", 
comment: "Order subtitle: total price of all tickets")
// Total: $9.41
```
- - - -
### 属性字符串的本地化
属性字符串同样也支持了新的本地化 api，不仅如此，还支持了 markdown语法，能够更好的实现文本的格式。
```swift
AttributedString(localized: "Your order is **complete**!", comment: "Ticket order confirmation title")

AttributedString(localized: "Order ^[\(ticketsCount) Ticket](inflect: true)")
```
- - - -
## 总结
总的来说，这次本地化的 api 更新照顾到了方方面面，在一些小而细碎的点也进行了考虑和处理，极大的改善了开发人员的体验，非常好评。
本地化一直扮演着体力活的角色，从原来的固定格式调用，进化为现在的多种调用方式，尽可能的减少了机械的体力劳动，切实的解决了一些原本需要额外胶水代码来处理的情景。
接下来就是在实践中检验这些改动到底能带来多少便利，让我们一起拭目以待吧。
- - - -
## 补充阅读
> [What’s new in Foundation - WWDC21 - Videos - Apple Developer](https://developer.apple.com/videos/play/wwdc2021/10109/)  



#study/WWDC21






