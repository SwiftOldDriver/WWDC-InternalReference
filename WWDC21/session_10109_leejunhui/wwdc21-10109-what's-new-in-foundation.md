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

而如果想要上面的属性是我们的本地化字符串的一部分的话，只需要再遵循一个 `MarkdownDecodableAttributedStringKey` 协议即可。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624893096157-fde51b1d-6896-4dba-a4e7-70da73088f96.png#clientId=u7f0c6343-d450-4&from=paste&height=263&id=u094ad9ad&margin=%5Bobject%20Object%5D&name=image.png&originHeight=526&originWidth=1592&originalType=binary&ratio=2&size=201963&status=done&style=none&taskId=u2681535b-af51-4eb7-9865-4bbaea4b836&width=796)

通过声明一个属性字符串属性遵循 `MarkdownDecodableAttributedStringKey` 协议，我们就可以直接从 `Markdown` 中解码出该属性，并插入到一个属性字符串中，这一切的前提还需要 `Value` 是 `Codable` 的。
​

### 1.7.3 自定义的 `Markdown` 属性

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624893288547-25edb1c5-4ea6-44fc-a197-0429ee7f5229.png#clientId=u7f0c6343-d450-4&from=paste&height=201&id=u5b017da5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=402&originWidth=1662&originalType=binary&ratio=2&size=222313&status=done&style=none&taskId=u7afc4f6d-c811-4cb4-acf0-f949def17c4&width=831)

上图中前两行代码在 `Markdown` 中十分常见，中括号中表示的是描述文本，括号中表示的是实际的 `URL`。带感叹号前缀的话就是直接渲染图片出来，不带感叹号前缀的话将会渲染一个链接出来。而第三行代码展示了自定义属性的语法。
自定义属性首先会以 `^` 开头，然后是一个中括号来接收文本，最后是一个括号来表示属性。属性以 `JSON5`格式表示。

> [JSON5](https://json5.org) 与 JSON 兼容，并允许使用不带引号的 `key`、注释和一些其它功能。

> Foundation 中的 JSON 相关的 API 也已经添加了对 JSON5 的支持。

​

因为自定义属性通过 `JSON` 进行表示，所以任何可以被 `JSONDecoder` 解码的内容自动与新的自定义 `Markdown` 语法兼容。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624893806902-f72b7f3a-b173-4ffe-8cd1-2d35d3bb3f36.png#clientId=u7f0c6343-d450-4&from=paste&height=202&id=uc7c9e187&margin=%5Bobject%20Object%5D&name=image.png&originHeight=404&originWidth=1614&originalType=binary&ratio=2&size=188720&status=done&style=none&taskId=u0002e3eb-ecc8-4eac-a92c-8dc276c691b&width=807)

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

`Formatters` 有了全新的 `API`，作为 `Foundation` 框架另一个长期存在的功能，它们负责接收像数字、日期、时间等数据然后转换成本地化的，用户可读性更高的字符串。由于 `Formatters` 底层由相当多的配置数据支撑，所以缓存并重用 `Formatters` 已经成为一种常见的模式。但如果在由许多不同的代码间共享同一个 `Formatter`，并不总是合适的。
今年，`Apple` 重新设计了 `Formatter` 相关 `API`，以提高性能与可用性。简而言之，新的 `Formatters API` 专注于「格式」上。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625326264194-5cb14c2d-2fa2-4e09-8985-fbdfe1c2461d.png#clientId=ud2f66d03-637b-4&from=paste&height=437&id=u783de3e9&margin=%5Bobject%20Object%5D&name=image.png&originHeight=874&originWidth=1400&originalType=binary&ratio=2&size=621289&status=done&style=none&taskId=u3609c213-e60b-4eab-9852-8238a5c24fc&width=700)

通过上面的示例代码，我们可以看到「缓存模式」在格式化器使用时的场景。这通常由两部分组成：

- 创建并配置一个 `Formatter`
- 传给 `Formatter` 一个日期，返回一个字符串

​

## 2.1 新的 `Formatters` 语法

​

那么可以简化上面的步骤吗？答案是可以的，在最新的 `Formatters API` 发布后，我们无需再手动创建并配置 `Formatter`，同时，我们也不需要传给 `Formatter` 一个日期对象了，我么只需要在日期对象身上调用 `formatted` 方法，并指定格式化标准是什么。仅仅一行代码就完成了上面两个步骤的工作。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625326851691-ba62c0bf-e26d-4428-bbe6-b6e0538c8005.png#clientId=ud2f66d03-637b-4&from=paste&height=300&id=u6b18833c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=600&originWidth=1658&originalType=binary&ratio=2&size=441324&status=done&style=none&taskId=udf9a1e25-5d1d-40ab-bd80-3c9f47a5a7b&width=829)

在 `dateLabel` 的内容通过新的 `Formatters API` 转换后，我们不妨关注下面 `magnitudeLabel` 的内容。看起来一行代码就完成了从浮点数到字符串的格式化，但其实这种转换隐藏了一些复杂性，并且存在一些值得注意的陷阱，稍有不慎就会得到完全错误的结果。读者需要在转换浮点数到字符串时特别注意字符串常量的修饰符。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625327342658-56e1a755-1faa-47bf-8ca7-a70ddd5af907.png#clientId=ud2f66d03-637b-4&from=paste&height=313&id=u52919514&margin=%5Bobject%20Object%5D&name=image.png&originHeight=626&originWidth=1694&originalType=binary&ratio=2&size=446598&status=done&style=none&taskId=u3658fcbe-9a55-4125-a31d-0760ebb53fb&width=847)

相反，上面的新 `API` 更容易理解，并且可读性，可维护性也更高。通过使用 `Swift` 中常规的函数来声明
我们希望 `magnitude` 这个浮点数如何被格式为一个字符串。同时新的 `API` 可以实现代码自动补全和类型安全。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625327768837-65011051-9ee3-4b23-a505-5817c87bbe96.png#clientId=ud2f66d03-637b-4&from=paste&height=365&id=u32f0ddb0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=730&originWidth=1572&originalType=binary&ratio=2&size=181485&status=done&style=none&taskId=u25911aff-836c-4394-9178-daa4d9d1ba9&width=786)

`Apple` 将会在 `Foundation` 中所有的十个格式化器中统一应用新的 `Formatters API`，内容包括通过清理和简化接口，并底层代码重构以避免常见的错误，同时添加了一系列的新功能。

接下来，我们将深入两种最常见的格式化场景：日期与数字。
​

## 2.2 日期格式化

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625328219522-4b71f16b-70f7-493d-ab1f-7e2e4dabc41e.png#clientId=ud2f66d03-637b-4&from=paste&height=459&id=u1d2a8965&margin=%5Bobject%20Object%5D&name=image.png&originHeight=918&originWidth=1632&originalType=binary&ratio=2&size=185049&status=done&style=none&taskId=u9a7fa36f-a0a8-4a00-8861-545cd392a2e&width=816)

日期格式化本质上就是将一个绝对的时间点转换为我们人类所理解的日期，这其中又涉及到了**日历**以及**时区**。甚至更重要的是，还需要考虑到不同地区的人们对于日期显示的偏好不同，这种偏好我们一般称之为**语言环境，**即 `locale`。接下来一起来看一下最简单的日期格式化代码是怎样编写的吧。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625328568887-b54bc1b7-aa44-4be5-ba31-524e9b55d0aa.png#clientId=ud2f66d03-637b-4&from=paste&height=182&id=ubefe4c51&margin=%5Bobject%20Object%5D&name=image.png&originHeight=364&originWidth=924&originalType=binary&ratio=2&size=143920&status=done&style=none&taskId=ueb6ce415-2687-4e83-acbc-110a3e1c014&width=462)

- 首先，通过 `Date.now` 获取当前时间点 `date`
- 然后，在 `date` 对象上调用 `formatted` 方法得到格式化后的内容 `formatted`

​

默认的日期格式化就是如此简单，当然，就像上面例子中看得到那样，日期格式化支持多样化的配置。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625330956835-a21ff9e1-cb4d-47f5-8deb-502cf4cf3afd.png#clientId=ud2f66d03-637b-4&from=paste&height=169&id=u78d74948&margin=%5Bobject%20Object%5D&name=image.png&originHeight=338&originWidth=1640&originalType=binary&ratio=2&size=214827&status=done&style=none&taskId=u879660f5-b10d-4e7f-8852-e614085e3e3&width=820)

- 可以通过配置实现只显示日期或只显示时间。

新的 `Formatters API` 的一个重要的目标是在于创建正确的格式化时提供尽可能多的编译时支持。使用魔法字符串进行格式化会造成陷阱，这种陷阱在正常情况下看起来是正确的，但在极端情况下会产生完全错误的值。比方获取一年中的最后一天。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625331782892-65fcb15f-7776-4e28-bbf7-c6595d4df34d.png#clientId=ud2f66d03-637b-4&from=paste&height=167&id=ude7becf4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=334&originWidth=1170&originalType=binary&ratio=2&size=114503&status=done&style=none&taskId=u92ca0f55-3c54-4a19-9efd-7a9aece7664&width=585)

- 通过指定 `formatted` 函数的参数，可以获得不同格式的时间表示方式。上面代码通过链式调用的方式指明需要展示年月日的信息，最终结果将会根据用户的语言环境 `locale` 输出对应的内容。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625331897984-aed951da-f55e-4a0c-83be-54457599c66f.png#clientId=ud2f66d03-637b-4&from=paste&height=81&id=u0b880e52&margin=%5Bobject%20Object%5D&name=image.png&originHeight=162&originWidth=1278&originalType=binary&ratio=2&size=89821&status=done&style=none&taskId=ua55e2794-8311-4c54-9d1d-db30c84abc2&width=639)

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625332007715-d2e32317-af45-4c14-9f4f-c825a87f0870.png#clientId=ud2f66d03-637b-4&from=paste&height=85&id=u92975e0a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=170&originWidth=1130&originalType=binary&ratio=2&size=85449&status=done&style=none&taskId=u2a959466-3198-40fb-9f9f-425db018aa9&width=565)

- 当然，年(`year()`)、月(`month()`)、日(`day()`)以及星期(`weekday()`)函数都是支持配置的，上面代码通过配置月份参数为 `wide`，从而输出了月份以及星期的完整表示内容。

​![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625332028098-f795f037-be03-4736-9141-1fadb2001022.png#clientId=ud2f66d03-637b-4&from=paste&height=150&id=u5db15972&margin=%5Bobject%20Object%5D&name=image.png&originHeight=346&originWidth=1666&originalType=binary&ratio=2&size=188177&status=done&style=none&taskId=u522a6bcd-5ff1-4823-8c9a-5d5166dd016&width=720)

- 除了常规的显示方式之外，新的 `Formatters API` 还支持输出 `ISO 8601` 格式的时间戳，并且在此基础上可以实现只显示年月日，然后在年月日之间指定具体的分隔符。

对于每一种类型来说，可能存在不止一种的样式。比如日期，就有 `dateTime` 和 `ISO 8601` 两种显示样式。样式可用于默认配置或自定义。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625332445514-0f438e55-ec04-43d5-8c29-5dd930345e8a.png#clientId=ud2f66d03-637b-4&from=paste&height=312&id=u6bafced9&margin=%5Bobject%20Object%5D&name=image.png&originHeight=624&originWidth=530&originalType=binary&ratio=2&size=66104&status=done&style=none&taskId=u935ed117-36db-4778-8bc2-0d33b816d5b&width=265)

- 上述的格式化 `API` 需要指定字段(`Fields`)列表，其中一些字段具有附加的选项。
- 开发者所提供的这些字段的顺序并不影响，每个字段都只是告诉格式化器在最终的输出结果中应该包含什么样的值。
- `Apple` 为格式化 `API` 提供了最实用的不带默认参数或仅仅一个样式名称的默认实现。
- 一旦你开始添加一些字段上去，输出的结果就会是自定义并仅反映你选择显示的内容，有点像 `UI` 中的占位文本。

​

本次更新对于格式化相互关联的两个日期也提供了新的 `API`。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625333304742-5b4689fe-511d-4a46-8727-323b33122089.png#clientId=ud2f66d03-637b-4&from=paste&height=441&id=u2b52827e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=882&originWidth=1668&originalType=binary&ratio=2&size=695082&status=done&style=none&taskId=u39af2b8b-4ab8-499a-b7a4-684cb12a244&width=834)

- 首先是在两个日期之间通过范围运算符进行格式化，得到的结果是一个时间区间。
- 时间区间可以只显示时间，不显示日期，就像格式化单个日期那样。
- 你也可以将时间区间格式化成一个持续时间(`timeDuration`)，可以格式化为组件(`components`)，或者是一个相对时间。

### 2.2.1 格式化属性字符串

`Formatters` 另外一个新的特性是针对属性字符串进行格式化。通过全新的结构体 `AttributedString` 以及 `Formatters API`，在任何地方都可以实现格式化属性字符串的输出。在 `watchOS`中，许多 `complications` 都是格式化的字符串，因为 `Apple Watch` 是十分个性化的设备，所以考虑到用户的偏好设置是十分重要的。下面通过 `SwiftUI` 中的 `demo`，我们可以一探究竟。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625335899725-f99b9f54-a883-4e50-bd28-b1d843b88b1c.png#clientId=u5f924393-78f4-4&from=paste&height=464&id=ub1d044bd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=928&originWidth=1738&originalType=binary&ratio=1&size=539454&status=done&style=none&taskId=ub3cba51e-9960-4a06-9bc1-8cd3545e86d&width=869)

上图是 `Caffe Companion` 应用的起始点，它会展示你的下一杯免费咖啡。这里有一个仅用来显示格式化日期字符串 `SwiftUI` 视图。通过设置日期格式化器中的语言环境(`locale`)参数，可以在 `SwiftUI preview` 中调整不同的语言环境以预览不同的效果。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625336032727-50932112-22a7-4ef5-b304-d89b2b1c476d.png#clientId=u5f924393-78f4-4&from=paste&height=348&id=ub7b76cb7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=696&originWidth=1516&originalType=binary&ratio=1&size=345456&status=done&style=none&taskId=u2724be71-1141-49a8-b0af-c6e1584478c&width=758)

- 这里为了实现自定义的时间显示效果，我们增加了一些时间格式化的字段，以达到只显示分钟，小时，星期的效果。然后为了实现让星期部分是橙色的效果，需要将 `str` 转换为 `AttributedString`。
- 然后通过 `AttributeContainer` 指定要替换样式的范围为星期，并指定颜色为橘色，最后调用 `replaceAttributes` 方法实现如右图 `Apple Watch` 中的效果。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625336080307-66a66a33-573c-40e1-9993-13b82d451c66.png#clientId=u5f924393-78f4-4&from=paste&height=438&id=u28292df7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=876&originWidth=1604&originalType=binary&ratio=1&size=523588&status=done&style=none&taskId=u0dd2fecc-eb9e-43dc-8bbf-31d806d9372&width=802)

通过在 `SwiftUI Preview` 中添加不同的语言环境，我们可以测试出在不同语言环境下，虽然星期的显示位置不同，但是最终都正确的加上了橙色。

### 2.2.2 字符串转换为日期

上面的内容都是从日期转换为字符串，接下来我们来讨论从字符串转换为日期的场景。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625336451795-ddf10416-6a76-4c8b-ac32-cabfe1eca882.png#clientId=u5f924393-78f4-4&from=paste&height=244&id=u99d1dbfa&margin=%5Bobject%20Object%5D&name=image.png&originHeight=488&originWidth=1654&originalType=binary&ratio=1&size=316430&status=done&style=none&taskId=u5b5fc6d4-6713-459a-babc-78c87805cbf&width=827)

- 如上图代码所示，`Date` 对象的初始化构造器增加了一个新的参数 `strategy`，即初始化日期对象的策略。这里我们传入的策略是一个 `format` 对象，该对象包含了年月日。同时，`formatted` 字符串是由 `date` 对象格式化得到的。这适用于一个输入框既可以允许用户输入一个新的日期，也可以显示输出结果。
- 上面的转换可能会失败，是因为输入的内容有可能导致 `Date` 对象初始化失败，所以要加上 `try?`。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625336771459-8832829c-ebb6-4dc4-964e-18c4a7b80e66.png#clientId=u5f924393-78f4-4&from=paste&height=316&id=ub69d8365&margin=%5Bobject%20Object%5D&name=image.png&originHeight=632&originWidth=1668&originalType=binary&ratio=1&size=554878&status=done&style=none&taskId=u450d06a6-ac48-4d68-85cf-3d690b341e7&width=834)

- 如上图所示，一些格式化策略有更高级的解析选项。这里我们解析一个固定的格式，这对于格式化从服务端接收到的时间十分有用。
- 初始化一个日期解析策略，传入的格式化字符串通过字符串插值进行拼接，同时还具有代码自动补全功能，这相比于指定诸如 `YYYY-MM-DD` 这类「魔法」字符串会来得更加简单与直观。所以从现在开始，格式化字符串为日期时，不再需要考虑应该用多少个大写的 `Y` 了。

​

## 2.3 数字格式化

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625337161257-266f384f-9779-48f3-a649-81a691bcbca2.png#clientId=u5f924393-78f4-4&from=paste&height=388&id=bMD6x&margin=%5Bobject%20Object%5D&name=image.png&originHeight=776&originWidth=1588&originalType=binary&ratio=1&size=115154&status=done&style=none&taskId=udfbd752d-3b3d-484a-87af-cf9a85b72b2&width=794)

所谓数字格式化就是将一个整数或者浮点数转换为一个人可以阅读的内容。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625337286195-a01bc2cc-e1c3-47ec-9795-bdaa5be4f088.png#clientId=u5f924393-78f4-4&from=paste&height=180&id=u578667c6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=360&originWidth=662&originalType=binary&ratio=1&size=84743&status=done&style=none&taskId=uf2c8e7e0-0794-472b-ad5e-65bdac51451&width=331)

- 与日期格式化相比，获取结果十分简单，不需要传入额外的参数。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625337385460-105e56fb-6e3e-4c3c-baf7-edca8ead257e.png#clientId=u5f924393-78f4-4&from=paste&height=305&id=u4d5d9b4c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=610&originWidth=1398&originalType=binary&ratio=1&size=314786&status=done&style=none&taskId=u6ef12cb4-a848-4c3d-81a4-87484e677f3&width=699)

- 如上图所示，数字格式化支持各种配置，我们可以配置输出百分比的字符串，或者是科学记数法格式的字符串，亦或者是输出货比格式的内容。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625337508852-cf9db010-46aa-44d5-9558-c1ed850ed509.png#clientId=u5f924393-78f4-4&from=paste&height=136&id=u89efef4a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=272&originWidth=1680&originalType=binary&ratio=1&size=118984&status=done&style=none&taskId=u0d6f1c16-bb57-46e7-9f25-9eed01e6a5a&width=840)

- 最后，集合的格式化现在只需要格式化对应的数组即可。如上所示， `memberStyle` 参数声明了数组中每个元素格式化的样式。输出的结果对于不同的用户语言环境来说都是正确的。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625337709793-9dac5c4d-72d0-4e91-bd0c-d9023f7578a1.png#clientId=u5f924393-78f4-4&from=paste&height=487&id=u0a0e2efd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=974&originWidth=1592&originalType=binary&ratio=1&size=500010&status=done&style=none&taskId=ufdc7b955-9165-4ef6-ac54-07921fb42d2&width=796)

`SwiftUI` 支持在输入框上附加化的样式，因为格式化样式有需要被格式化内容的类型信息，我们可以使用一个可读的但是安全的语法实现对 `tip` 的百分比格式化操作。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625338113993-c594474b-f387-4566-9043-810b16a4e615.png#clientId=u5f924393-78f4-4&from=paste&height=474&id=ufb1c004b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=948&originWidth=1100&originalType=binary&ratio=1&size=159539&status=done&style=none&taskId=u0cc662ce-c8d6-49b7-8a06-20f75f05eee&width=550)

- 如上图所示，在原料部分我们用到了集合格式化，在价格部分用到了货比格式化，在数量部分用到了数字格式化，并在下单按钮上对下单数量做了本地化操作。

​

## 2.4 字符串和格式化器的国际化与本地化

​

关于字符串与格式化器的国际化以及本地化的更多内容可以参考本次 `WWDC` 的其他 `Session`：
[Localize your SwiftUI app](https://developer.apple.com/videos/play/wwdc2021/10220/) & [Streamline your localized strings](https://developer.apple.com/videos/play/wwdc2021/10221/)
​

# 三、 语法协议引擎 - Grammar agreement

最后，我们将目光转移到一个全新的功能上 -- 自动修正语法(Automatic grammar agreement)。在之前，西班牙语等语言的本地化表达自然翻译的能力受到限制，有时会导致尴尬的对话出现。这些语言需要进行转换以实现在
不同的对话中达到时态与复数的一致，有时甚至需要了解用户的首选称呼。英语也具有同样的特性，名词具有单数和复数两种形式。
​

## 3.1 Automatic Grammar Agreement 初见

​

我们讨论了语言中的一些术语，接下来让我们以实际的例子进行更深入的讨论吧。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625360433548-03679975-c152-4410-9ea9-1b2fdff9363e.png#clientId=u86432fc4-6b2f-4&from=paste&height=988&id=udf4b7989&margin=%5Bobject%20Object%5D&name=image.png&originHeight=988&originWidth=626&originalType=binary&ratio=1&size=138927&status=done&style=none&taskId=uab4e8f77-0f7b-4a4d-a7c6-518a15f3b80&width=626)

在 `Caffe` App 中，我们可以点餐，然后设置餐食的大小以及数量。我们先点一份沙拉。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625360525642-7ec018a2-6068-433b-aab0-53fe5ab2dfbe.png#clientId=u86432fc4-6b2f-4&from=paste&height=966&id=u05f7c85e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=966&originWidth=532&originalType=binary&ratio=1&size=142290&status=done&style=none&taskId=u1094d3a8-5d3b-480e-b59a-d752f850971&width=532)

接着我们的朋友说她也需要一份，所以我们就增加数量到两份。在英语中，`salad` 这个单词需要改变自己的单复数形式以匹配两份沙拉，这就叫做语法协议。这也就是说这句话中的所有单词必须相互匹配。
在英语中，由于复数的问题而修正单词是一种常见的语法协议。现在切换我们的 `App` 到西班牙语。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625360894017-999db968-32de-4be9-8a24-1a9624fcdba1.png#clientId=u86432fc4-6b2f-4&from=paste&height=962&id=u4bf8bf35&margin=%5Bobject%20Object%5D&name=image.png&originHeight=962&originWidth=550&originalType=binary&ratio=1&size=147225&status=done&style=none&taskId=u5913734b-99e6-4ff4-870d-732779d8d07&width=550)

这里我们点了一份 `ensalada pequeña` ,或者说一小份沙拉。当我们为朋友再点一份的时候，订单确认按钮需要与英语进行同样的复数化，但有一点是不同的。在西班牙语中，像「小的」这样的形容词以及「沙拉」这样的名词都需要和具体的数量达成一致。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625361521292-7a53f687-0eb7-4336-bdb9-569a32f17cee.png#clientId=u86432fc4-6b2f-4&from=paste&height=948&id=u25375edc&margin=%5Bobject%20Object%5D&name=image.png&originHeight=948&originWidth=544&originalType=binary&ratio=1&size=137264&status=done&style=none&taskId=uc69f3ad6-6699-4246-b101-dc8287d0c81&width=544)​

所以，订单确认按钮上显示的是 `ensaladas pequeñas` 而不是 `ensalada pequeña`。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625372012058-0fb980ae-cacd-4863-aa2f-d70636823e9c.png#clientId=u86432fc4-6b2f-4&from=paste&height=964&id=ud829cf32&margin=%5Bobject%20Object%5D&name=image.png&originHeight=964&originWidth=564&originalType=binary&ratio=1&size=120601&status=done&style=none&taskId=u7d383e70-67a2-490e-8d63-eac2a77a5da&width=564)

我们接着讲目光锁定到饮品上，如上图所示，对于订单按钮中的文字来说，不仅需要单复数匹配正确，还需要在这些单词的词法性上达成一致。`Juice` 与 `jugo` 是阳性化的。而形容词 `pequeño` 「小的」也必须匹配。
为了正确对这些文字进行国际化和本地化，我们最终会遇到「组合爆炸」的问题。食物、大小和数量的每个组合都需要不同的本地化字符串。在代码层面，就会出现如下所示的场景。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625372374385-963c2ab4-bccd-419b-a03d-b17c5fc32648.png#clientId=u86432fc4-6b2f-4&from=paste&height=880&id=ua5d2e93e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=880&originWidth=1432&originalType=binary&ratio=1&size=736993&status=done&style=none&taskId=ua02e34ff-2fec-4681-93ca-3775a83ab21&width=1432)

我们需要对每个 `item` 进行 `switch` 操作，同时还需要对选择的大小进行判断，等等。还需要一个字符串文件来正确地对每个字符串中的计数进行复数化。而现在，通过利用在系统键盘上提示用户输入这一功能的相同技术，`Apple` 创建了一个新的 `API`，就可以轻松处理上面我们所遇到的问题了。此功能被命名为自动语法协议，因为系统会自动修复本地化字符串以使它们有正确的语法。
​

## 3.2 Automatic Grammar Agreement 解析

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625372989380-761c19ed-71e2-42bb-8422-e85ceae7d23d.png#clientId=u86432fc4-6b2f-4&from=paste&height=334&id=ua445a7b9&margin=%5Bobject%20Object%5D&name=image.png&originHeight=334&originWidth=1364&originalType=binary&ratio=1&size=154023&status=done&style=none&taskId=u4867a83e-f475-4e91-ae08-ca809aacc55&width=1364)

有了新的 `Automatic Grammar Agreement` 加持，代码变得更简单了。你可以在一个字符串里直接指定数 量、大小和具体的餐食。自动语法协议会通过「反射」自动修复其中的语法。
让我们逐步分解一下，为了执行「反射」流程，我们需要知道字符串中的哪些部分需要做自动语法修复。幸运的是，在 `Swift` 中有一个全新的类型 `AttributedString` 属性字符串，以及在 `Markdown` 中可以设置自定义属性的功能。
当我们导出 `Caffe` 项目的本地化时，我们会得到一个字符串文件，这个文件中包含我们的提示文本以及代码中的本地化字符串，比如餐食的名称以及大小。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625373489747-f0b6c2ef-34d1-448b-a773-9d22899bce0e.png#clientId=u86432fc4-6b2f-4&from=paste&height=558&id=ua45ed7fd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=558&originWidth=1692&originalType=binary&ratio=1&size=363327&status=done&style=none&taskId=u89df57e9-e93c-48c2-ba9f-ba126fd8c10&width=1692)

在拉丁美洲西班牙环境下，本地化器使用重新排列语法将大小和餐食的顺序进行了调换，这是因为西班牙语中像「小的」或「大的」这样的形容词位于名词的后面。
​

有些语言不仅在本地化文本本身上，还在文本与阅读的人之间具有一致性。自动语法协议也有助于解决这一问题。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625373838652-05e7d192-bda7-4b45-b981-608b8b2d0781.png#clientId=u86432fc4-6b2f-4&from=paste&height=970&id=ub4c11fc1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1050&originalType=binary&ratio=1&size=241915&status=done&style=none&taskId=u5bcaffe4-0d85-4299-b89d-bf8ef894256&width=1050)

举个例子，如上图所示，`iOS` 系统自带的备忘录应用在第一次使用时会弹出一个欢迎菜单。在英语中，欢迎语是 `Welcome to Notes`，即欢迎使用备忘录。而在西班牙语中，则是 `Te damos la bienvenida a Notas`，即我们欢迎您使用备忘录。我们希望有和英语一样的西班牙语体验。然而，在西班牙语中，`bienvenido` 一词必须与用户首选的称号相匹配。称号可能是几个选项之一，而具体的选项就会更改文本的内容。使用正确的称号可以带来更个性化和更具包容性的体验。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625374305338-b54d51c0-3bfb-4165-9df1-713e44ea6690.png#clientId=u86432fc4-6b2f-4&from=paste&height=948&id=NfGkb&margin=%5Bobject%20Object%5D&name=image.png&originHeight=948&originWidth=540&originalType=binary&ratio=1&size=163056&status=done&style=none&taskId=u388122b6-ebb9-4d1c-98cf-938acccb97a&width=540)

在今年的更新当中，`Apple` 为西班牙语用户提供了设置了称号的入口。在语言与地区的设置中，将会有一个新的称号选项。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625374362854-2ac61ceb-1f96-4c3a-82bb-39536a94e306.png#clientId=u86432fc4-6b2f-4&from=paste&height=968&id=ue0cbdf20&margin=%5Bobject%20Object%5D&name=image.png&originHeight=968&originWidth=534&originalType=binary&ratio=1&size=124237&status=done&style=none&taskId=u329d164b-4619-4213-9c64-9522499b088&width=534)

如上图所示，用户可以选择设置不同的称号并选择是否与所有 `App` 共享这一设置。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625374472365-e6809ab1-c3ee-450f-b3af-86f0ccbd7888.png#clientId=u86432fc4-6b2f-4&from=paste&height=976&id=u32913bc1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=976&originWidth=534&originalType=binary&ratio=1&size=125664&status=done&style=none&taskId=u11f81a4d-c0e0-4b72-923c-038fca886d6&width=534)

上图是用户设置了女性称谓后，新的备忘录欢迎界面。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1625374542564-03ce3913-60ac-4bbd-8fc6-56d3d9b78f60.png#clientId=u86432fc4-6b2f-4&from=paste&height=962&id=u20b3375b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=962&originWidth=532&originalType=binary&ratio=1&size=124607&status=done&style=none&taskId=u1349dcfd-1d28-43a6-a895-827689e53a7&width=532)

而上图是设置了男性称谓后的备忘录欢迎界面。
如果我们不知道用户是否有设置过称谓，我们还是会以初始的字符串作为备选。
​

今年，`Apple` 对西班牙语和英语实现了自动语法协议功能。就像系统应用备忘录的欢迎界面一样，你也可以在自己的应用中采用同样的技术。
​

# 四、总结

`Foundation` 今年有许多强大的新功能，你可以从今天开始在你的 `app` 中使用它们。
​

- `AttributedString` 属性字符串提供了一个快速的，易用的并且 `Swift` 优先的接口，进而实现在一个字符串的范围中添加键值对以达到富文本的效果。你可以在 `SwiftUI` 中使用 `Text` 组件，并在本地化字符串中使用 `Markdown` 语法。
- 新的格式器 `API` 将重点放在格式上，简化了代码并提高了性能。
- 最后，自动语法协议将智能地修复本地化字符串，以便匹配语法时态，单复数以及用户自己的称谓设置。

​

_​_
