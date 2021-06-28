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

# 二、 格式化器 - Formatters

# 三、 语法协议引擎 - Grammar agreement

_​_
