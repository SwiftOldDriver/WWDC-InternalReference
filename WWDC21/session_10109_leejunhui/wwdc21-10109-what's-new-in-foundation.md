
![](banner.png)

> 本文基于 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 进行梳理

> 作者：leejunhui，iOS & RN 开发者。任职于云梯科技，负责跨平台应用开发
>
> 审核：郭鹏，老司机技术周报编辑，就职于丁香园，丁香妈妈 App 开发


> 本文基于 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 进行梳理

## 引言

根据 Apple 开发者官网 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 上的描述，`iOS` 以及 `macOS` 底层的系统核心库 `Foundation` 带来了如下更新:

- ​`Foundation` 的最新特性能够帮助你改进应用的**本地化**和**国际化**支持。
- Apple 专为 `Swift` 打造了一个新的字符串类型 `AttributedString` ，同时你现在可以使用 `Markdown` 来将样式应用于本地化的字符串上。
- 新推出的**语法协议引擎**可以自动修复本地化字符串，从而让本地化字符串实现语法性与复数的匹配。
- 本次更新带来了日期和数字格式化的改进以简化以前复杂的流程，同时也进一步提高了性能。

​

## 一、属性字符串 - AttributedString

`iOS` 中的 `AttributedString` 相信大多数开发者都不会陌生，它由以下三部分组成：
​

- 字符 Characters
- 区间 Ranges
- 字典 Dictionary

`AttributedString` 允许您将属性（键值对）与字符串的特定范围相关联，最常见的字符串属性由 SDK 进行定义，但是你可以创建属于你自己的属性。
​

在 `Foundation` 框架面世之时，`NSAttributedString` 类型便随之一起推出。而今年，Apple 推出了一个基于现代化的 `Swift` 语言特性的全新的结构体 - `AttributedString`。
​

### 1.1 AttributedString 初见

`AttributedString` 有以下特性：
​

- 值类型，从头开始为 `Swift` 构建
- 与 `Swift` 的字符串有相同字符计数行为
- 可本地化
- `AttributedString` 的构建考虑到了安全性与保障性（这包括具有强类型的编译时安全性以及使用 `Codable` 解压缩期间的安全性）

​

### 1.2 AttributedString 基础

![](https://images.xiaozhuanlan.com/photo/2021/52781d1f6d4d20c86256a923b15ed6cc.png)
上面的截图中，有文字被加粗，也有文字是斜体，还有带链接可点击的文字。 那么如何通过全新的 `AttributedString` 来实现呢？

![](https://images.xiaozhuanlan.com/photo/2021/a269192d3946c187396c18436a34e3f7.png)

- 首先通过简单的初始化语法得到一个 `AttributedString` 结构体，传入的初始化内容是 `Thank you`。

同时，我们这里对 `AttributedString` 设置一个的 `SwiftUI` 字体属性 `bold`，设置之后会让字体有加粗的效果。值得注意的是，该属性作用在 `AttributedString` 全局范围内。
![](https://images.xiaozhuanlan.com/photo/2021/d7d320bf7d6186ded0baad1a2c327371.png)

- 同样的，我们再次初始化一个 `AttributedString` 结构体，传入的初始化内容是 `Please visit our website`。这里我们设置字体为斜体 `italic`。同时设置 `AttributedString` 的 `link` 属性为一个 `URL`。

![](https://images.xiaozhuanlan.com/photo/2021/a28d35c5d2a91fdc6b941121a2940439.png)

- `AttributeContainer` 结构体是一个十分有用的工具，它可以不依赖具体的字符串并同时保存字符串的相关属性。这里我们根据文本的重要性不同设置了不同的属性。

![](https://images.xiaozhuanlan.com/photo/2021/329283c0a59bd9267958832e3a8d7c6b.png)

- 最后，通过调用 `mergeAttributes` 方法，将 `container` 对象所携带的属性应用在 `thanks` 和 `website` 上。

我们前面说到过，`AttributedString` 是由字符，区间以及属性字典三大部分组成的。但是如果需要访问一个 `AttributedString` 的这三大部分内容并不是直接通过 `AttributedString` 本身，而是通过 `View`。
​

### 1.3 AttributedString View

`AttributedString` 的 `View` 由下列两部分组成：
​

- Characters 字符，用来访问字符串
- Runs 用来访问属性

`View` 是 `Swift` 的 `Collection` 类型，那么也就是说我们可以像操作 `Array` 类型一样来操作 `View`。
​

#### 1.3.1 Characters View

现在假设设计师要求我们实现标点符号的文字颜色为橘色:
​

![](https://images.xiaozhuanlan.com/photo/2021/dbf290ac1fd6c264c26e5540fd9d6e92.png)
那么我们可以通过以下代码来实现：
​

![](https://images.xiaozhuanlan.com/photo/2021/212b1bc5a920de1bb6ce23ab28d5ae77.png)

- 首先通过 `characters` 取出字符 `View`
- 然后遍历字符 `View`，并通过 `isPunctuation` 筛选出字符 `View` 集合中为标点符号的字符
  - 最后使用区间运算符确定标点符号字符的区间，然后设置其颜色为橘色

​

#### 1.3.2 Runs View

一个 `Run View` 包含了一个特定的属性的起始位置、长度、以及具体的属性值。

![](https://images.xiaozhuanlan.com/photo/2021/09c4ef33fb2e399484402846f2167620.png)

上面的字符串由 4 个 `Run View` 组成。分别是 `Thank you!`、`Please visit our`、`website`、 `.`。

![](https://images.xiaozhuanlan.com/photo/2021/5f01938a470b7599df7f42b00ed9e319.png)

如上代码所示，我们可以通过 `AttributedString` 的 `runs` 属性下面的 `count` 来获取有多少个 `Run View`。
`character` 和 `Run View` 的区间是可以相互转换的，所以你可以通过下标访问到某个区间的字符串内容。

对于 `Run View` 来说，专注于一个特定的属性这种场景可能更加有用。

![](https://images.xiaozhuanlan.com/photo/2021/58ee02beb24ebc4b1dd6b1947a4f7795.png)

上面的代码中，我们使用了 `link` 的 `key path` 来合并链接属性。 如果我们只关注链接属性的话，我们这里有三个 `Run View`。遍历 `Run View` 会得到一个 `(value, range)` 的元组。因为 `value` 是类型安全的，所以我们可以使用存在于 `URL` 上的 `scheme` 这样的 `API`。上面的代码表达意思就是检查开头不为 `https` 的字符串，匹配成功则加入 `insecureLinks` 数组中。
​

### 1.4 AttributedString 使用

另外一个有用的场景是在 `AttributedString` 中查找特定的子串，查找成功后可以编辑对应区间内的字符串内容以及字符串属性。
比如我们想把 `visit` 改成更为复古的 `surf`，如下图所示：
![](https://images.xiaozhuanlan.com/photo/2021/e701f24143c26032c532c71b8cfb2dc2.png)
我们只需要下方代码即可实现：
![](https://images.xiaozhuanlan.com/photo/2021/f4d5eebb54e5437785cf6233e27400d8.png)

### 1.5 AttributedString 本地化

`Swift` 中的 `AttributedString` 以及 `Objective-C` 中的 `NSAttributedString` 现在都已支持本地化。在本地化的场景下，`AttributedString` 就像普通的字符串一样位于你的 App 的字符串文件中。
在 `Swift` 中，现在支持通过字符串插值对 `String` 和 `AttributedString` 进行本地化的格式化工作，就像 `SwiftUI` 中的 `text view` 一样。
![](https://images.xiaozhuanlan.com/photo/2021/7aa15d7a2ea01bbd97c1bd599d5a770b.png)
如上图代码所示：

- `prompt` 方法接收一个字符串参数 `document` 并返回一个本地化之后的字符串。不需要通过字符串格式化函数并使用 `%@` 或 `%d` 等格式化说明符，你只需要直接传入具体的值即可。
- `attributePrompt` 同上。

> ​`Xcode` 可以通过编译器自动生成字符串文件，只需要开启位于 `Build Settings` 下的 `Localization` 设置中的 `Use Compiler to Extract Swift Strings` 选项。

### 1.6 AttributedString & Markdown

`AttributedString` 支持 `Markdown` 语法，下面是一个 `SwiftUI` 中 `Text` 组件使用本地化的 `AttributedString` 的例子：
![](https://images.xiaozhuanlan.com/photo/2021/9ea6dcdf4e28a665eb54b04ef1070788.png)

- 通过在 `Thank you` 两侧插入两个星号，右侧的实时预览区域就直观的显示出了加粗的效果。

![](https://images.xiaozhuanlan.com/photo/2021/38e93ae7ac2aecaabcfe24809eaf932a.png)

- 通过在文本两侧插入下划线，Text 组件接收后会以斜体进行渲染。

![](https://images.xiaozhuanlan.com/photo/2021/7805334ab97aaf26492e31f1ae649120.png)

- 除此之外，还支持 `Markdown` 中链接的语法，也就是说 可以为不同的语言提供不同的 `URL`。

> `Markdown` 中的删除线以及代码块语法也得到了支持。

### 1.7 AttributedString 转换操作

要对 `AttributedString` 进行归档，我们需要能够在 `AttributedString` 与 `NSAttributedString` 这一引用类型之间进行相互转换。
`AttributedString` 有可能是你的数据 `model` 中的一部分，因此，我们需要能够对其进行序列化和反序列化。  
最后，我们希望能够在 `Markdown` 中设置自定义的字符串属性。
​

上述三种场景都涉及到了 `AttributedString` 的转换操作，我们依次进行分析。
​

#### 1.7.1 从结构体类型转换为类类型

![](https://images.xiaozhuanlan.com/photo/2021/ddc41a9bc6944f014eccf54d3f049317.png)

只需要将 `AttribuedString` 传入 `NSAttributedString` 的构造方法中即可，至于属性如何关联则交给 SDK 完成。
​

#### 1.7.2 序列化和反序列化

![](https://images.xiaozhuanlan.com/photo/2021/9b49a0bc37762fa184d099a2d60f55e3.png)

因为 `AttribuedString` 有默认的 `Codable` 实现，这里的 `Receipt` 结构体只需要遵循 `Codable` 协议即可。

![](https://images.xiaozhuanlan.com/photo/2021/2d9e829f43d26371482f30f7a3b2c9fc.png)

那么如何对自定义的字符串属性进行序列化和反序列化呢？我们可以对属性进行更深入的了解。一个属性由两部分组成：一个 `key` 和一个 `value`。`key` 是一个遵循 `AttributedStringKey` 协议的类型，它定义了需要什么类型的值以及用于归档的属性名称。`key` 还可以遵循其他协议以自定义 `value` 的序列化和反序列化方式。

![](https://images.xiaozhuanlan.com/photo/2021/d2a24574bdf0987cf78fa7252e2fc670.png)

如上代码所示：`AttributedStringKey` 协议只需要定义关联类型 `Value` 以及静态的变量 `name` 即可。现在假设我们希望这个 `RainbowAttribute` 属性 `Codable`。
​
​

> `Codable` 其实是 `Swift` 标准库中的一个类型别名，它代表的是 `Decodable` 和 `Encodable` 协议。

![](https://images.xiaozhuanlan.com/photo/2021/9a2f2c6b958976f3947baff07e580463.png)

只需要像上面代码一样，让属性遵循 `CodableAttributedStringKey` 协议，该协议同样的也是 `DecodableAttributedStringKey` 和 `EncodableAttributedStringKey` 的类型别名。同时，让 `Value` 类型遵循 `Codable` 协议即可。
​

而如果想要上面的属性是我们的本地化字符串的一部分的话，只需要再遵循一个 `MarkdownDecodableAttributedStringKey` 协议即可。

![](https://images.xiaozhuanlan.com/photo/2021/c3ebf967321cda85841cadee85f37a08.png)

声明一个遵循 `MarkdownDecodableAttributedStringKey` 协议的 `AttributedString` 属性，然后让属性的 `value` 部分遵循 `Codable` 协议，我们就可以在 `Markdown` 文本中实现富文本字符串的效果，具体使用参考下图。

![](https://images.xiaozhuanlan.com/photo/2021/0b29a33d1f23c81cd1be82075ece97c7.png)

上图中前两行代码在 `Markdown` 中十分常见，中括号中表示的是描述文本，括号中表示的是实际的 `URL`。带感叹号前缀的话就是直接渲染图片出来，不带感叹号前缀的话将会渲染一个链接出来。而第三行代码展示了自定义属性的语法。

自定义属性首先会以 `^` 开头，然后是一个中括号来接收文本，最后是一个括号来表示属性。属性以 `JSON5`格式表示。

> [JSON5](https://json5.org) 与 JSON 兼容，并允许使用不带引号的 `key`、注释和一些其它功能。

> Foundation 中的 JSON 相关的 API 也已经添加了对 JSON5 的支持。

因为自定义属性通过 `JSON` 进行表示，所以任何可以被 `JSONDecoder` 反序列化的内容自动与新的自定义 `Markdown` 语法兼容。

![](https://images.xiaozhuanlan.com/photo/2021/5835fcf2220f640b21e4539fa93bea77.png)

上图代码中，第一行包含了一个自定义属性，第二行包含了两个自定义属性，第三行包含了一个具有多个子属性的属性。
​

### 1.8 AttributedString Scopes

`Scopes` 是属性 `key` 的集合。`Scopes` 在反序列化 `JSON` 或 `Markdown` 时十分有用，因为它告诉了我们想要查找的属性，以及如何反序列化这些属性。

> Apple 分别为 `Foundation`、`UIKit`、`AppKit`、`SwiftUI` 定义了各自的 `Scope`。你可以定义属于你自己应用的 `Scope`。

![](https://images.xiaozhuanlan.com/photo/2021/67f5362a439920650e869548a7d9aacc.png)

- 如上代码所示，我们在 `AttributeScopes` 的 `extension` 中声明了一个结构体 `CaffeAppAtrributes`，这个结构体遵循了 `AttributeScope` 协议。然后声明了一个自定义属性 `RainbowAttribute` ，同时声明了一个 `SwiftUIAttributes`，这可以让我们用到了 `SwiftUI` 内部的所有属性。而由于 `scope` 是支持递归嵌套的，所以也默认包含了 `Foundation` 的自定义属性。
- 在我们新的 `scope` 中定义一个属性是十分有用的，因为可以让我们在接收 `scope` 作为参数的函数中使用 `key path` 语法。

![](https://images.xiaozhuanlan.com/photo/2021/f699dbc5908fe9dbeb7a36704daa07e8.png)

- 最终，我们可以从自定义的 `markdown` 中加载我们的本地化字符串了。

![](https://images.xiaozhuanlan.com/photo/2021/5827fa8c04ba55abc9cf348d2e31037f.png)![](https://images.xiaozhuanlan.com/photo/2021/bfb5ca919b174323c24543e6ec26203e.png)

如上图所示，本地化字体文件中的 `Markdown` 在被转换为 `AttributedString` 后，应用会找到需要设置属性的范围并将属性应用到对应范围的字符串上。而因为属性来自于本地化字体文件，这适用于所有语言。

## 二、 格式化器 - Formatters

`Formatters` 有了全新的 `API`，作为 `Foundation` 框架另一个长期存在的功能，它们负责接收像数字、日期、时间等数据然后转换成本地化的，用户可读性更高的字符串。由于 `Formatters` 底层由相当多的配置数据支撑，所以缓存并重用 `Formatters` 已经成为一种常见的模式。但如果在由许多不同的代码间共享同一个 `Formatter`，并不总是合适的。
今年，`Apple` 重新设计了 `Formatter` 相关 `API`，以提高性能与可用性。简而言之，新的 `Formatters API` 专注于「格式」上。

![](https://images.xiaozhuanlan.com/photo/2021/6b698f30ca89666b7319ef44794126b8.png)

通过上面的示例代码，我们可以看到「缓存模式」在格式化器使用时的场景。这通常由两部分组成：

- 创建并配置一个 `Formatter`
- 传给 `Formatter` 一个日期，返回一个字符串

​

### 2.1 新的 `Formatters` 语法

那么可以简化上面的步骤吗？答案是可以的，在最新的 `Formatters API` 发布后，我们无需再手动创建并配置 `Formatter`，同时，我们也不需要传给 `Formatter` 一个日期对象了，我么只需要在日期对象身上调用 `formatted` 方法，并指定格式化标准是什么。仅仅一行代码就完成了上面两个步骤的工作。

![](https://images.xiaozhuanlan.com/photo/2021/bc030b570e889a5f0f4296ed3091462b.png)

在 `dateLabel` 的内容通过新的 `Formatters API` 转换后，我们不妨关注下面 `magnitudeLabel` 的内容。看起来一行代码就完成了从浮点数到字符串的格式化，但其实这种转换隐藏了一些复杂性，并且存在一些值得注意的陷阱，稍有不慎就会得到完全错误的结果。读者需要在转换浮点数到字符串时特别注意字符串常量的修饰符。

![](https://images.xiaozhuanlan.com/photo/2021/1889f5e319a446e20d35a3cf54c33ddd.png)

相反，上面的新 `API` 更容易理解，并且可读性，可维护性也更高。通过使用 `Swift` 中常规的函数来声明
我们希望 `magnitude` 这个浮点数如何被格式为一个字符串。同时新的 `API` 可以实现代码自动补全和类型安全。

![](https://images.xiaozhuanlan.com/photo/2021/4d1c5c478583564ed8ee794f75ed4883.png)

`Apple` 将会在 `Foundation` 中所有的十个格式化器中统一应用新的 `Formatters API`，内容包括通过清理和简化接口，并底层代码重构以避免常见的错误，同时添加了一系列的新功能。

接下来，我们将深入两种最常见的格式化场景：日期与数字。
​

### 2.2 日期格式化

![](https://images.xiaozhuanlan.com/photo/2021/12ef626d667af18426c3e76c3cc2c2ee.png)

日期格式化本质上就是将一个绝对的时间点转换为我们人类所理解的日期，这其中又涉及到了「日历」以及「时区」。甚至更重要的是，还需要考虑到不同地区的人们对于日期显示的偏好不同，这种偏好我们一般称之为「语言环境」，即 `locale`。接下来一起来看一下最简单的日期格式化代码是怎样编写的吧。

![](https://images.xiaozhuanlan.com/photo/2021/a658464b60a4f3217298ea78a511f682.png)

- 首先，通过 `Date.now` 获取当前时间点 `date`
- 然后，在 `date` 对象上调用 `formatted` 方法得到格式化后的内容 `formatted`

默认的日期格式化就是如此简单，当然，就像上面例子中看得到那样，日期格式化支持多样化的配置。

![](https://images.xiaozhuanlan.com/photo/2021/0bc7fb4ea41e22e077a18b67057a7995.png)

- 可以通过配置实现只显示日期或只显示时间。

新的 `Formatters API` 的一个重要的目标是在于创建正确的格式化时提供尽可能多的编译时支持。使用魔法字符串进行格式化会造成陷阱，这种陷阱在正常情况下看起来是正确的，但在极端情况下会产生完全错误的值。比方获取一年中的最后一天。

![](https://images.xiaozhuanlan.com/photo/2021/d42b3b135ad1447406696de560a29864.png)

- 通过指定 `formatted` 函数的参数，可以获得不同格式的时间表示方式。上面代码通过链式调用的方式指明需要展示年月日的信息，最终结果将会根据用户的语言环境 `locale` 输出对应的内容。

![](https://images.xiaozhuanlan.com/photo/2021/3e023d1427e095769a85854aa745b2bb.png)

![](https://images.xiaozhuanlan.com/photo/2021/634d93430690f993a9d3502d90566522.png)

- 当然，年(`year()`)、月(`month()`)、日(`day()`)以及星期(`weekday()`)函数都是支持配置的，上面代码通过配置月份参数为 `wide`，从而输出了月份以及星期的完整表示内容。

​![](https://images.xiaozhuanlan.com/photo/2021/8e26bff268bb924ad57c51e6cf025350.png)

- 除了常规的显示方式之外，新的 `Formatters API` 还支持输出 `ISO 8601` 格式的时间戳，并且在此基础上可以实现只显示年月日，然后在年月日之间指定具体的分隔符。

对于每一种类型来说，可能存在不止一种的样式。比如日期，就有 `dateTime` 和 `ISO 8601` 两种显示样式。样式可用于默认配置或自定义。

![](https://images.xiaozhuanlan.com/photo/2021/d174522f58c819809bbc045f0b4a5923.png)

- 上述的格式化 `API` 需要指定字段(`Fields`)列表，其中一些字段具有附加的选项。
- 开发者所提供的这些字段的顺序并不影响，每个字段都只是告诉格式化器在最终的输出结果中应该包含什么样的值。
- `Apple` 为格式化 `API` 提供了最实用的不带默认参数或仅仅一个样式名称的默认实现。
- 一旦你开始添加一些字段上去，输出的结果就会是自定义并仅反映你选择显示的内容，有点像 `UI` 中的占位文本。

​
本次更新对于格式化相互关联的两个日期也提供了新的 `API`。

![](https://images.xiaozhuanlan.com/photo/2021/149d2289c6731ce07cfd5581e7c3be99.png)

- 首先是在两个日期之间通过范围运算符进行格式化，得到的结果是一个时间区间。
- 时间区间可以只显示时间，不显示日期，就像格式化单个日期那样。
- 你也可以将时间区间格式化成一个持续时间(`timeDuration`)，可以格式化为组件(`components`)，或者是一个相对时间。

#### 2.2.1 格式化 AttributedString

`Formatters` 另外一个新的特性是针对 `AttributedString` 进行格式化。通过全新的结构体 `AttributedString` 以及 `Formatters API`，在任何地方都可以实现格式化 `AttributedString` 的输出。在 `watchOS`中，许多 `complications` 都是格式化的字符串，因为 `Apple Watch` 是十分个性化的设备，所以考虑到用户的偏好设置是十分重要的。下面通过 `SwiftUI` 中的 `demo`，我们可以一探究竟。

![](https://images.xiaozhuanlan.com/photo/2021/3345e2c55669b3374a947d44e03de976.png)

上图是 `Caffe Companion` 应用的起始点，它会展示你的下一杯免费咖啡。这里有一个仅用来显示格式化日期字符串 `SwiftUI` 视图。通过设置日期格式化器中的语言环境(`locale`)参数，可以在 `SwiftUI preview` 中调整不同的语言环境以预览不同的效果。

![](https://images.xiaozhuanlan.com/photo/2021/8bc44c500ea8ab13c8088ffa20f06405.png)

- 这里为了实现自定义的时间显示效果，我们增加了一些时间格式化的字段，以达到只显示分钟，小时，星期的效果。然后为了实现让星期部分是橙色的效果，需要将 `str` 转换为 `AttributedString`。
- 然后通过 `AttributeContainer` 指定要替换样式的范围为星期，并指定颜色为橘色，最后调用 `replaceAttributes` 方法实现如右图 `Apple Watch` 中的效果。

![](https://images.xiaozhuanlan.com/photo/2021/b1dd6ca128cd1afff3ba9d7bea80ebbd.png)

通过在 `SwiftUI Preview` 中添加不同的语言环境，我们可以测试出在不同语言环境下，虽然星期的显示位置不同，但是最终都正确的加上了橙色。

#### 2.2.2 字符串转换为日期

上面的内容都是从日期转换为字符串，接下来我们来讨论从字符串转换为日期的场景。

![](https://images.xiaozhuanlan.com/photo/2021/c9283bd2fed4260cefb275da2eee7fb8.png)

- 如上图代码所示，`Date` 对象的初始化构造器增加了一个新的参数 `strategy`，即初始化日期对象的策略。这里我们传入的策略是一个 `format` 对象，该对象包含了年月日。同时，`formatted` 字符串是由 `date` 对象格式化得到的。这适用于一个输入框既可以允许用户输入一个新的日期，也可以显示输出结果。
- 上面的转换可能会失败，是因为输入的内容有可能导致 `Date` 对象初始化失败，所以要加上 `try?`。

![](https://images.xiaozhuanlan.com/photo/2021/9a781091ba54c47f0ec578c61ca6bdef.png)

- 如上图所示，一些格式化策略有更高级的解析选项。这里我们解析一个固定的格式，这对于格式化从服务端接收到的时间十分有用。
- 初始化一个日期解析策略，传入的格式化字符串通过字符串插值进行拼接，同时还具有代码自动补全功能，这相比于指定诸如 `YYYY-MM-DD` 这类「魔法」字符串会来得更加简单与直观。所以从现在开始，格式化字符串为日期时，不再需要考虑应该用多少个大写的 `Y` 了。

​

### 2.3 数字格式化

![](https://images.xiaozhuanlan.com/photo/2021/88e4b47c52d618918eaf99f009666f39.png)

所谓数字格式化就是将一个整数或者浮点数转换为一个人可以阅读的内容。

![](https://images.xiaozhuanlan.com/photo/2021/016d25d4ce46ee9fe3d412d60648a538.png)

- 与日期格式化相比，获取结果十分简单，不需要传入额外的参数。

![](https://images.xiaozhuanlan.com/photo/2021/12b67e087aff634b272906821a4c9d6a.png)

- 如上图所示，数字格式化支持各种配置，我们可以配置输出百分比的字符串，或者是科学记数法格式的字符串，亦或者是输出货比格式的内容。

![](https://images.xiaozhuanlan.com/photo/2021/ff3d1c44a157a28f0486967a268ded68.png)

- 最后，集合的格式化现在只需要格式化对应的数组即可。如上所示， `memberStyle` 参数声明了数组中每个元素格式化的样式。输出的结果对于不同的用户语言环境来说都是正确的。

![](https://images.xiaozhuanlan.com/photo/2021/7abe3e1ebaa1cf0ed546fa17d18636be.png)

`SwiftUI` 支持在 `TextFeild` 上设置内容格式的样式，而因为格式的样式有需要被格式化内容的类型，所以我们可以使用一个可读的但是安全的语法实现对 `tip` 的格式化。

![](https://images.xiaozhuanlan.com/photo/2021/472b5085b028945b805691b3e87bb652.png)

- 如上图所示，在原料部分我们用到了集合格式化，在价格部分用到了货币格式化，在数量部分用到了数字格式化，并在下单按钮上对下单数量做了本地化操作。

​

### 2.4 字符串和格式化器的国际化与本地化

​
关于字符串与格式化器的国际化以及本地化的更多内容可以参考本次 `WWDC` 的其他 `Session`：
[Localize your SwiftUI app](https://developer.apple.com/videos/play/wwdc2021/10220/)（[《【WWDC21 10220/10221】本地化功能上新》](https://xiaozhuanlan.com/topic/6278501394)） & [Streamline your localized strings](https://developer.apple.com/videos/play/wwdc2021/10221/)（[《【WWDC21 10220/10221】本地化功能上新》](https://xiaozhuanlan.com/topic/6278501394)）
​

## 三、 语法协议引擎 - Grammar agreement

最后，我们将目光转移到一个全新的功能上 -- 自动修正语法(Automatic grammar agreement)。在之前，西班牙语等语言的本地化表达自然翻译的能力受到限制，有时会导致尴尬的对话出现。这些语言需要进行转换以实现在
不同的对话中达到时态与复数的一致，有时甚至需要了解用户的首选称呼。英语也具有同样的特性，名词具有单数和复数两种形式。
​

### 3.1 Automatic Grammar Agreement 初见

我们讨论了语言中的一些术语，接下来让我们以实际的例子进行更深入的讨论吧。

![](https://images.xiaozhuanlan.com/photo/2021/d30b17324c30807e92f99a0444f95334.png)

在 `Caffe` App 中，我们可以点餐，然后设置餐食的大小以及数量。我们先点一份沙拉。

![](https://images.xiaozhuanlan.com/photo/2021/06c826787f4552235398561ae51d5e0b.png)

接着我们的朋友说她也需要一份，所以我们就增加数量到两份。在英语中，`salad` 这个单词需要改变自己的单复数形式以匹配两份沙拉，这就叫做语法协议。这也就是说这句话中的所有单词必须相互匹配。
在英语中，由于复数的问题而修正单词是一种常见的语法协议。现在切换我们的 `App` 到西班牙语。

![](https://images.xiaozhuanlan.com/photo/2021/c3cbaaeba3e8779a79c9e6fa1443c255.png)

这里我们点了一份 `ensalada pequeña` ,或者说一小份沙拉。当我们为朋友再点一份的时候，订单确认按钮需要与英语进行同样的复数化，但有一点是不同的。在西班牙语中，像「小的」这样的形容词以及「沙拉」这样的名词都需要和具体的数量达成一致。

![](https://images.xiaozhuanlan.com/photo/2021/c8a90013f4b3abb6a4d011033e615e39.png)​

所以，订单确认按钮上显示的是 `ensaladas pequeñas` 而不是 `ensalada pequeña`。

![](https://images.xiaozhuanlan.com/photo/2021/41e8489bd39e40bb78adf016c56ac921.png)

我们接着讲目光锁定到饮品上，如上图所示，对于订单按钮中的文字来说，不仅需要单复数匹配正确，还需要在这些单词的词法性上达成一致。`Juice` 与 `jugo` 是阳性化的。而形容词 `pequeño` 「小的」也必须匹配。
为了正确对这些文字进行国际化和本地化，我们最终会遇到「组合爆炸」的问题。食物、大小和数量的每个组合都需要不同的本地化字符串。在代码层面，就会出现如下所示的场景。

![](https://images.xiaozhuanlan.com/photo/2021/a8712113ca38c5397e6ed13b0009a413.png)

我们需要对每个 `item` 进行 `switch` 操作，同时还需要对选择的大小进行判断，等等。还需要一个字符串文件来正确地对每个字符串中的计数进行复数化。而现在，通过利用在系统键盘上提示用户输入这一功能的相同技术，`Apple` 创建了一个新的 `API`，就可以轻松处理上面我们所遇到的问题了。此功能被命名为自动语法协议，因为系统会自动修复本地化字符串以使它们有正确的语法。
​

### 3.2 Automatic Grammar Agreement 解析

![](https://images.xiaozhuanlan.com/photo/2021/e1fbe85654c5806dea3db2d2535916c0.png)

有了新的 `Automatic Grammar Agreement` 加持，代码变得更简单了。你可以在一个字符串里直接指定数 量、大小和具体的餐食。自动语法协议会通过「反射」自动修复其中的语法。
让我们逐步分解一下，为了执行「反射」流程，我们需要知道字符串中的哪些部分需要做自动语法修复。幸运的是，在 `Swift` 中有一个全新的类型 `AttributedString` AttributedString，以及在 `Markdown` 中可以设置自定义属性的功能。
当我们导出 `Caffe` 项目的本地化时，我们会得到一个字符串文件，这个文件中包含我们的提示文本以及代码中的本地化字符串，比如餐食的名称以及大小。

![](https://images.xiaozhuanlan.com/photo/2021/047f0d2d957c11549f53c3cb4d46046a.png)

在拉丁美洲西班牙环境下，本地化器使用重新排列语法将大小和餐食的顺序进行了调换，这是因为西班牙语中像「小的」或「大的」这样的形容词位于名词的后面。
​
有些语言不仅在本地化文本本身上，还在文本与阅读的人之间具有一致性。自动语法协议也有助于解决这一问题。

![](https://images.xiaozhuanlan.com/photo/2021/ae70803ec7b91fb4d2ef3f6b2c3fe6cf.png)

举个例子，如上图所示，`iOS` 系统自带的备忘录应用在第一次使用时会弹出一个欢迎菜单。在英语中，欢迎语是 `Welcome to Notes`，即欢迎使用备忘录。而在西班牙语中，则是 `Te damos la bienvenida a Notas`，即我们欢迎您使用备忘录。我们希望有和英语一样的西班牙语体验。然而，在西班牙语中，`bienvenido` 一词必须与用户首选的称号相匹配。称号可能是几个选项之一，而具体的选项就会更改文本的内容。使用正确的称号可以带来更个性化和更具包容性的体验。

![](https://images.xiaozhuanlan.com/photo/2021/0b73c039421559fe99038dddff40a3f4.png)

在今年的更新当中，`Apple` 为西班牙语用户提供了设置了称号的入口。在语言与地区的设置中，将会有一个新的称号选项。

![](https://images.xiaozhuanlan.com/photo/2021/633029d0c76253bb7e20debb47be33e9.png)

如上图所示，用户可以选择设置不同的称号并选择是否与所有 `App` 共享这一设置。

![](https://images.xiaozhuanlan.com/photo/2021/5cc7fea4920c46466401179a918ad67b.png)

上图是用户设置了女性称谓后，新的备忘录欢迎界面。

![](https://images.xiaozhuanlan.com/photo/2021/2a9c14f5b04a3705e752544f9d9b0dd4.png)

而上图是设置了男性称谓后的备忘录欢迎界面。
如果我们不知道用户是否有设置过称谓，我们还是会以初始的字符串作为备选。
​
今年，`Apple` 对西班牙语和英语实现了自动语法协议功能。就像系统应用备忘录的欢迎界面一样，你也可以在自己的应用中采用同样的技术。

## 四、总结

`Foundation` 今年有许多强大的新功能，你可以从今天开始在你的 `app` 中使用它们。

- `AttributedString` 提供了一个快速的，易用的并且 `Swift` 优先的接口，进而实现在一个字符串的范围中添加键值对以达到富文本的效果。你可以在 `SwiftUI` 中使用 `Text` 组件，并在本地化字符串中使用 `Markdown` 语法。
- 新的格式器 `API` 将重点放在格式上，简化了代码并提高了性能。
- 最后，自动语法协议将智能地修复本地化字符串，以便匹配语法时态，单复数以及用户自己的称谓设置。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
