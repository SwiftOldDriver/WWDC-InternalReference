> 本文基于 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 进行梳理

​

# 引言

根据 Apple 开发者官网 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 上的描述，`iOS` 以及 `macOS` 底层的系统核心库 `Foundation` 带来了如下更新:

- ​`Foundation` 的最新特性能够帮助你改进应用的**本地化**和**国际化**支持。
- Apple 专为 `Swift` 打造了一个新的字符串类型 `AttributedString` ，同时你现在可以使用 `Markdown` 来将样式应用于本地化的字符串上。
- 新推出的**语法协议引擎**可以自动修复本地化字符串，从而让本地化字符串实现语法性与复数的匹配。
- 本次更新带来了日期和数字格式化的改进以简化以前复杂的流程，同时也进一步提高了性能。

​

# 一、属性字符串 - AttributedString

`iOS` 中的属性字符串相信大多数开发者都不会陌生，它由以下三部分组成：
​

- 字符 Characters
- 区间 Ranges
- 字典 Dictionary

属性字符串允许您将属性（键值对）与字符串的特定范围相关联，最常见的字符串属性由 SDK 进行定义，但是你可以创建属于你自己的属性。
​

在 `Foundation` 框架面世之时，`NSAttributedString` 属性字符串类型便随之一起推出。而今年，Apple 推出了一个基于现代化的 `Swift` 语言特性的全新的属性字符串结构体 - `AttributedString`，
​

## 1.1 AttributedString 初见

`AttributedString` 有以下特性：
​

- 值类型，从头开始为 `Swift` 构建
- 与 `Swift` 的字符串有相同字符计数行为
- 可本地化
- `AttributedString` 的构建考虑到了安全性与保障性（这包括具有强类型的编译时安全性以及使用 `Codable` 解压缩期间的安全性）

​

## 1.2 AttributedString 基础

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624293051504-9d354ef7-2293-4d82-b10f-8a4c2747ef3f.png#clientId=u3c5e323b-02ae-4&from=paste&height=766&id=u4db18b5a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=766&originWidth=1060&originalType=binary&ratio=1&size=104249&status=done&style=none&taskId=u7fd65ff3-03b0-4bee-9bc4-0f2ebd9ac75&width=1060)
上面的截图中，有文字被加粗，也有文字是斜体，还有带链接可点击的文字。 那么如何通过全新的 `AttributedString` 来实现呢？

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624293621307-14f08586-7860-4a8d-ab0c-33d804d436ff.png#clientId=u3c5e323b-02ae-4&from=paste&height=204&id=udd5392ed&margin=%5Bobject%20Object%5D&name=image.png&originHeight=204&originWidth=1692&originalType=binary&ratio=1&size=81882&status=done&style=none&taskId=u6e60f004-2204-48b8-8363-bd520689b68&width=1692)

- 首先通过简单的初始化语法得到一个 `AttributedString` 结构体，传入的初始化内容是 `Thank you`。

同时，我们这里对属性字符串设置一个的 `SwiftUI` 字体属性 `bold`，设置之后会让字体有加粗的效果。值得 注意的是，该属性作用在属性字符串全局范围内。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624362686003-21dcf69d-f066-43c9-b1ca-99aebb389da6.png#clientId=u4301b739-d3c5-4&from=paste&height=117&id=u19bfd993&margin=%5Bobject%20Object%5D&name=image.png&originHeight=234&originWidth=1670&originalType=binary&ratio=2&size=157014&status=done&style=none&taskId=ub6f146d9-a518-40ac-9409-0ea15966beb&width=835)

- 同样的，我们再次初始化一个 `AttributedString` 结构体，传入的初始化内容是 `Please visit our website`。这里我们设置字体为斜体 `italic`。同时设置属性字符串的 `link` 属性为一个 `URL`。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624374831543-d3316e7d-f758-49bc-a5ca-f3d0c51c6ffb.png#clientId=u4301b739-d3c5-4&from=paste&height=193&id=uf44f5aad&margin=%5Bobject%20Object%5D&name=image.png&originHeight=386&originWidth=1652&originalType=binary&ratio=2&size=251777&status=done&style=none&taskId=ue3eecfaa-3a16-4db2-ba30-07ab7d9beb1&width=826)

- `AttributeContainer` 结构体是一个十分有用的工具，它可以不依赖具体的字符串并同时保存字符串的相关属性。这里我们根据文本的重要性不同设置了不同的属性。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624375360118-13eb7a94-d06f-4b44-a09f-47718829dfff.png#clientId=u4301b739-d3c5-4&from=paste&height=92&id=u16f5c27e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=184&originWidth=1674&originalType=binary&ratio=2&size=106082&status=done&style=none&taskId=u719f32bf-a64c-419a-b293-d5e1a2f6856&width=837)

- 最后，通过调用 `mergeAttributes` 方法，将 `container` 对象所携带的属性应用在 `thanks` 和 `website` 属性字符串上。

我们前面说到过，属性字符串是由字符，区间以及属性字典三大部分组成的。但是如果需要访问一个属性字符串的这三大部分内容并不是直接通过属性字符串本身，而是通过属性字符串的「视图」特性。
​

## 1.3 AttributedString 视图

属性字符串的「视图」由下列两部分组成：
​

- Characters 字符，用来访问字符串
- Runs 用来访问属性

​

「视图」是 `Swift` 的 `Collection` 类型，那么也就是说我们可以像操作 `Array` 类型一样来操作「视图」。
​

### 1.3.1 Characters 视图

​

现在假设设计师要求我们实现标点符号的文字颜色为橘色:
​

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624885320740-0334556c-f871-42a8-9c97-cb9a6b3606f7.png#clientId=uca4b5ec3-d888-4&from=paste&height=111&id=u01cd3f5d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=222&originWidth=1384&originalType=binary&ratio=2&size=127018&status=done&style=none&taskId=u360080d3-bb3b-4da0-b836-c351296d08f&width=692)
那么我们可以通过以下代码来实现：
​

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624885278849-1a545e8c-f874-43a1-be86-19e5ead1702d.png#clientId=uca4b5ec3-d888-4&from=paste&height=229&id=rHkyn&margin=%5Bobject%20Object%5D&name=image.png&originHeight=458&originWidth=1798&originalType=binary&ratio=2&size=315510&status=done&style=none&taskId=ufa79532d-e252-43f5-baf6-2ae395f9b26&width=899)

- 首先通过 `characters` 取出字符「视图」
- 然后遍历字符「视图」，并通过 `isPunctuation` 筛选出字符「视图」集合中为标点符号的字符
  - 最后使用区间运算符确定标点符号字符的区间，然后设置其颜色为橘色

​

### 1.3.2 Runs 视图

一个 `run` 视图包含了一个特定的属性的起始位置、长度、以及具体的属性值。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624887361848-563b03be-3a85-4e49-87d2-967638289bfe.png#clientId=uca4b5ec3-d888-4&from=paste&height=180&id=uc785cc4a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=360&originWidth=1360&originalType=binary&ratio=2&size=137410&status=done&style=none&taskId=u412316a9-b0a6-4dfd-8b8c-de75566753b&width=680)
上面的字符串由 4 个 `run` 视图组成。分别是 `Thank you!`、`Please visit our`、`website`、 `.`。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624887312397-26f07239-c578-438a-a49e-75ecfb4bbfd6.png#clientId=uca4b5ec3-d888-4&from=paste&height=260&id=u325f2278&margin=%5Bobject%20Object%5D&name=image.png&originHeight=520&originWidth=2270&originalType=binary&ratio=2&size=315109&status=done&style=none&taskId=u224eedf2-28e1-4a25-874b-600f33a557c&width=1135)
如上代码所示，我们可以通过属性字符串的 `runs` 属性下面的 `count` 来获取有多少个 `run` 视图。
`character` 和 `run` 视图的区间是可以相互转换的，所以你可以通过下标访问到某个区间的字符串内容。

对于 `run` 视图来说，专注于一个特定的属性这种场景可能更加有用。![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624887947108-a4cfa20b-cd7a-4605-83ff-1abc84a678dc.png#clientId=uca4b5ec3-d888-4&from=paste&height=551&id=u6a71499d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1102&originWidth=1772&originalType=binary&ratio=2&size=670453&status=done&style=none&taskId=uef019d59-0915-4a37-beaa-31ed8906d15&width=886)
上面的代码中，我们使用了 `link` 的 `key path` 来合并链接属性。 如果我们只关注链接属性的话，我们这里有三个 `run` 视图。遍历 `run` 视图会得到一个 `(value, range)` 的元组。因为 `value` 是类型安全的，所以我们可以使用存在于 `URL` 上的 `scheme` 这样的 `API`。上面的代码表达意思就是检查开头不为 `https` 的字符串，匹配成功则加入 `insecureLinks` 数组中。
​

## 1.4 AttributedString 使用

另外一个有用的场景是在属性字符串中查找特定的子串，查找成功后可以编辑对应区间内的字符串内容以及字符串属性。
比如我们想把 `visit` 改成更为复古的 `surf`，如下图所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624888672843-d1a6b37d-6cda-48af-8f2e-1a06076eaad3.png#clientId=uca4b5ec3-d888-4&from=paste&height=97&id=ub187ec9b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=194&originWidth=1316&originalType=binary&ratio=2&size=113848&status=done&style=none&taskId=ud6f032b9-7cf6-4f3b-b07a-32bdef43e0c&width=658)
我们只需要下方代码即可实现：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624888738092-c4bc8b55-bcda-4193-9657-7291e6057acd.png#clientId=uca4b5ec3-d888-4&from=paste&height=153&id=ue91c6fdb&margin=%5Bobject%20Object%5D&name=image.png&originHeight=306&originWidth=2262&originalType=binary&ratio=2&size=241421&status=done&style=none&taskId=uc93fd77c-81b0-4f09-9944-7b661423b8e&width=1131)

## 1.5 AttributedString 本地化

`Swift` 中的 `AttributedString` 以及 `Objective-C` 中的 `NSAttributedString` 现在都已支持本地化。在本地化的场景下，`AttributedString` 就像普通的字符串一样位于你的 App 的字符串文件中。
在 `Swift` 中，现在支持通过字符串插值对 `String` 和 `AttributedString` 进行本地化的格式化工作，就像 `SwiftUI` 中的 `text view` 一样。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624889940848-7bc45467-806f-4e45-892f-a384d5105b1f.png#clientId=u7f0c6343-d450-4&from=paste&height=324&id=u777b2f33&margin=%5Bobject%20Object%5D&name=image.png&originHeight=648&originWidth=2100&originalType=binary&ratio=2&size=640437&status=done&style=none&taskId=u2d1047a5-9ad6-4ce1-8ee1-333a934bb17&width=1050)
如上图代码所示：

- `prompt` 方法接收一个字符串参数 `document` 并返回一个本地化之后的字符串。不需要通过字符串格式化函数并使用 `%@` 或 `%d` 等格式化说明符，你只需要直接传入具体的值即可。
- `attributePrompt` 同上。

​

> ​`Xcode` 可以通过编译器自动生成字符串文件，只需要开启位于 `Build Settings` 下的 `Localization` 设置中的 `Use Compiler to Extract Swift Strings` 选项。

## 1.6 AttributedString & Markdown

`AttributedString` 支持 `Markdown` 语法，下面是一个 `SwiftUI` 中 `Text` 组件使用本地化的属性字符串的例子：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624890483866-7f054866-be90-483c-8ef2-3a4f2d35f3cd.png#clientId=u7f0c6343-d450-4&from=paste&height=323&id=ud290c319&margin=%5Bobject%20Object%5D&name=image.png&originHeight=646&originWidth=1436&originalType=binary&ratio=2&size=267935&status=done&style=none&taskId=udeea7580-56c1-4e5a-bc18-45faf40b225&width=718)

- 通过在 `Thank you` 两侧插入两个星号，右侧的实时预览区域就直观的显示出了加粗的效果。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624890604903-8b91a71b-87a5-42c7-9a60-40c1fb86892b.png#clientId=u7f0c6343-d450-4&from=paste&height=307&id=u8648e15b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=614&originWidth=1412&originalType=binary&ratio=2&size=262446&status=done&style=none&taskId=u7d252a2f-1d50-453a-96eb-6d5b58b707a&width=706)

- 通过在文本两侧插入下划线，Text 组件接收后会以斜体进行渲染。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624890706370-252f0387-0355-4435-a443-542cda7b6ccb.png#clientId=u7f0c6343-d450-4&from=paste&height=320&id=ud63e4218&margin=%5Bobject%20Object%5D&name=image.png&originHeight=640&originWidth=1430&originalType=binary&ratio=2&size=261458&status=done&style=none&taskId=u032e4fc0-f2ab-4f85-b8b2-116500849b3&width=715)

- 除此之外，还支持 `Markdown` 中链接的语法，也就是说 可以为不同的语言提供不同的 `URL`。
  > `Markdown` 中的删除线以及代码块语法也得到了支持。

## 1.7 AttributedString 转换操作

要对 `AttributedString` 进行归档，我们需要能够在 `AttributedString` 与 `NSAttributedString` 这一引用类型之间进行相互转换。
`AttributedString` 有可能是你的数据 `model` 中的一部分，因此，我们需要能够对其进行编码与解码。  
最后，我们希望能够在 `Markdown` 中设置自定义的字符串属性。
​

上述三种场景都涉及到了属性字符串的转换操作，我们依次进行分析。
​

### 1.7.1 从结构体类型转换为类类型

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624891336971-29dca061-5bab-496b-a1be-96c61cd61c90.png#clientId=u7f0c6343-d450-4&from=paste&height=215&id=u0ded317a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=430&originWidth=1652&originalType=binary&ratio=2&size=152758&status=done&style=none&taskId=u4759d623-84b4-424a-8204-1cb9479cb28&width=826)
只需要将属性字符串 `AttribuedString` 传入 `NSAttributedString` 的构造方法中即可，至于属性如何关联则交给 SDK 完成。
​

### 1.7.2 编码与解码

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624891510892-6003e477-aae4-4f38-a3d4-118f4f273fd9.png#clientId=u7f0c6343-d450-4&from=paste&height=192&id=u0dee2085&margin=%5Bobject%20Object%5D&name=image.png&originHeight=384&originWidth=852&originalType=binary&ratio=2&size=112848&status=done&style=none&taskId=u432df0c1-9cea-4002-8b14-4ffed5b309a&width=426)
因为 `AttribuedString` 有默认的 `Codable` 实现，这里的 `Receipt` 结构体只需要遵循 `Codable` 协议即可。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624891634212-6f4b093a-3ddf-44c8-9731-637aca72a48c.png#clientId=u7f0c6343-d450-4&from=paste&height=177&id=uce5a9900&margin=%5Bobject%20Object%5D&name=image.png&originHeight=354&originWidth=878&originalType=binary&ratio=2&size=151057&status=done&style=none&taskId=u4c76c56d-afb4-4c2b-be8b-045655461ac&width=439)
那么如何对自定义的字符串属性进行编解码呢？我们可以对属性进行更深入的了解。一个属性由两部分组成：一个 `key` 和一个 `value`。`key` 是一个遵循 `AttributedStringKey` 协议的类型，它定义了需要什么类型的值以及用于归档的属性名称。`key` 还可以遵循其他协议以自定义 `value` 的编解码方式。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624892057686-729b5864-7792-423c-a9b0-52eeea7e0af6.png#clientId=u7f0c6343-d450-4&from=paste&height=270&id=uea224c9c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=540&originWidth=950&originalType=binary&ratio=2&size=169569&status=done&style=none&taskId=ua3ac2b26-c518-41be-8881-3c98d14f1ac&width=475)
如上代码所示：`AttributedStringKey` 协议只需要定义关联类型 `Value` 以及静态的变量 `name` 即可。现在假设我们希望这个 `RainbowAttribute` 属性 `Codable`。
​

> `Codable` 其实是 `Swift` 标准库中的一个类型别名，它代表的是 `Decodable` 和 `Encodable` 协议。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624892784883-a5b189ac-ee8e-4728-acea-187d9b00af63.png#clientId=u7f0c6343-d450-4&from=paste&height=267&id=uc6334397&margin=%5Bobject%20Object%5D&name=image.png&originHeight=534&originWidth=996&originalType=binary&ratio=2&size=161380&status=done&style=none&taskId=uf5d844e9-2ea4-4d44-9b4c-68bdabfae5d&width=498)
只需要像上面代码一样，让属性遵循 `CodableAttributedStringKey` 协议，该协议同样的也是 `DecodableAttributedStringKey` 和 `EncodableAttributedStringKey` 的类型别名。同时，让 `Value` 类型遵循 `Codable` 协议即可。
​

而如果想要上面的属性是我们的本地化字符串的一部分的话，只需要再遵循一个 `MarkdownDecodableAttributedStringKey` 协议即可。![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624893096157-fde51b1d-6896-4dba-a4e7-70da73088f96.png#clientId=u7f0c6343-d450-4&from=paste&height=263&id=u094ad9ad&margin=%5Bobject%20Object%5D&name=image.png&originHeight=526&originWidth=1592&originalType=binary&ratio=2&size=201963&status=done&style=none&taskId=u2681535b-af51-4eb7-9865-4bbaea4b836&width=796)
通过声明一个属性字符串属性遵循 `MarkdownDecodableAttributedStringKey` 协议，我们就可以直接从 `Markdown` 中解码出该属性，并插入到一个属性字符串中，这一切的前提还需要 `Value` 是 `Codable` 的。
​

### 1.7.3 自定义的 `Markdown` 属性![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624893288547-25edb1c5-4ea6-44fc-a197-0429ee7f5229.png#clientId=u7f0c6343-d450-4&from=paste&height=201&id=u5b017da5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=402&originWidth=1662&originalType=binary&ratio=2&size=222313&status=done&style=none&taskId=u7afc4f6d-c811-4cb4-acf0-f949def17c4&width=831)

上图中前两行代码在 `Markdown` 中十分常见，中括号中表示的是描述文本，括号中表示的是实际的 `URL`。带感叹号前缀的话就是直接渲染图片出来，不带感叹号前缀的话将会渲染一个链接出来。而第三行代码展示了自定义属性的语法。
自定义属性首先会以 `^` 开头，然后是一个中括号来接收文本，最后是一个括号来表示属性。属性以 `JSON5`格式表示。

> [JSON5](https://json5.org) 与 JSON 兼容，并允许使用不带引号的 `key`、注释和一些其它功能。

> Foundation 中的 JSON 相关的 API 也已经添加了对 JSON5 的支持。

​

因为自定义属性通过 `JSON` 进行表示，所以任何可以被 `JSONDecoder` 解码的内容自动与新的自定义 `Markdown` 语法兼容。![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624893806902-f72b7f3a-b173-4ffe-8cd1-2d35d3bb3f36.png#clientId=u7f0c6343-d450-4&from=paste&height=202&id=uc7c9e187&margin=%5Bobject%20Object%5D&name=image.png&originHeight=404&originWidth=1614&originalType=binary&ratio=2&size=188720&status=done&style=none&taskId=u0002e3eb-ecc8-4eac-a92c-8dc276c691b&width=807)
上图代码中，第一行包含了一个自定义属性，第二行包含了两个自定义属性，第三行包含了一个具有多个子属性的属性。
​

## 1.8 AttributedString Scopes

`Scopes` 是属性 `key` 的集合。`Scopes` 在解码 `JSON` 或 `Markdown` 时十分有用，因为它告诉了我们想要查找的属性，以及如何解码这些属性。

> Apple 分别为 `Foundation`、`UIKit`、`AppKit`、`SwiftUI` 定义了各自的 `Scope`。你可以定义属于你自己应用的 `Scope`。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624979342918-d399eae6-0723-4956-96e4-68c40c55e87a.png#clientId=ue872796c-1b67-4&from=paste&height=366&id=uc3e110d1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=732&originWidth=2250&originalType=binary&ratio=2&size=593234&status=done&style=none&taskId=u9e44a978-c1ad-48a7-b17b-3dd02588717&width=1125)

- 如上代码所示，我们在 `AttributeScopes` 的 `extension` 中声明了一个结构体 `CaffeAppAtrributes`，这个结构体遵循了 `AttributeScope` 协议。然后声明了一个自定义属性 `RainbowAttribute` ，同时声明了一个 `SwiftUIAttributes`，这可以让我们用到了 `SwiftUI` 内部的所有属性。而由于 `scope` 是支持递归嵌套的，所以也默认包含了 `Foundation` 的自定义属性。
- 在我们新的 `scope` 中定义一个属性是十分有用的，因为可以让我们在接收 `scope` 作为参数的函数中使用 `key path` 语法。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624980203668-9d98501d-2993-4514-b62a-4d4d23c4eaa9.png#clientId=ue872796c-1b67-4&from=paste&height=156&id=ud1cd0ad8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=312&originWidth=2314&originalType=binary&ratio=2&size=273538&status=done&style=none&taskId=uce269bcb-62a2-4201-ac6d-c74a8773a55&width=1157)

- 最终，我们可以从自定义的 `markdown` 中加载我们的本地化字符串了。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624980963280-dfc07e6e-bb67-44f0-bf7a-d748d1161d9e.png#clientId=ue872796c-1b67-4&from=paste&height=480&id=u3fec9461&margin=%5Bobject%20Object%5D&name=image.png&originHeight=960&originWidth=536&originalType=binary&ratio=2&size=177528&status=done&style=none&taskId=ua8a995d3-55f2-45b4-b501-9a14f1ab2c0&width=268)![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624981018504-566c599b-472f-4cea-bad2-39b172af8cec.png#clientId=ue872796c-1b67-4&from=paste&height=480&id=u2d3b35c1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=960&originWidth=530&originalType=binary&ratio=2&size=185549&status=done&style=none&taskId=u7e901ddc-3228-471d-8f42-42e70ea7a9a&width=265)
如上图所示，本地化字体文件中的 `Markdown` 在被转换为属性字符串后，应用会找到需要设置属性的范围并将属性应用到对应范围的字符串上。而因为属性来自于本地化字体文件，这适用于所有语言。

# 二、 格式化器 - Formatters

# 三、 语法协议引擎 - Grammar agreement

_​_
