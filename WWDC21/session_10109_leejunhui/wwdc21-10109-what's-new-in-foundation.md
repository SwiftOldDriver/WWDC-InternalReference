# WWDC21 - What's new in Foundation

> 本文基于 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 进行梳理

# 引言

根据 Apple 开发者官网 [WWDC21 - What's new in Foundation](https://developer.apple.com/videos/play/wwdc2021/10109/) 上的描述，`iOS` 以及 `macOS` 底层的系统核心库 `Foundation` 带来了如下更新:

- ​`Foundation` 的最新特性能够帮助你改进应用的**本地化**和**国际化**支持。
- Apple 专为 `Swift` 打造了一个新的字符串类型 `AttributedString` ，同时你现在可以使用 `Markdown` 来将样式应用于本地化的字符串上。
- 新推出的**语法协议引擎**可以自动修复本地化字符串，从而让本地化字符串实现语法性与复数的匹配。
- 本次更新带来了日期和数字格式化的改进以简化以前复杂的流程，同时也进一步提高了性能。

# 一、属性字符串 - AttributedString

`iOS` 中的属性字符串相信大多数开发者都不会陌生，它由以下三部分组成：​

- 字符 Characters
- 区间 Ranges
- 字典 Dictionary

属性字符串允许您将属性（键值对）与字符串的特定范围相关联，最常见的字符串属性由 SDK 进行定义，但是你可以创建属于你自己的属性。​

在 `Foundation` 框架面世之时，`NSAttributedString` 属性字符串类型便随之一起推出。而今年，Apple 推出了一个基于现代化的 `Swift` 语言特性的全新的属性字符串结构体 - `AttributedString`，​
<a name="JAyg8"></a>

## 1.1 AttributedString 初见

`AttributedString` 有以下特性：​

- 值类型，从头开始为 `Swift` 构建
- 与 `Swift` 的字符串有相同字符计数行为
- 可本地化
- `AttributedString` 的构建考虑到了安全性与保障性（这包括具有强类型的编译时安全性以及使用 `Codable` 解压缩期间的安全性）

​
<a name="ZTrx9"></a>

## 1.2 AttributedString 基础

![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624293051504-9d354ef7-2293-4d82-b10f-8a4c2747ef3f.png#clientId=u3c5e323b-02ae-4&from=paste&height=766&id=u4db18b5a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=766&originWidth=1060&originalType=binary&ratio=1&size=104249&status=done&style=none&taskId=u7fd65ff3-03b0-4bee-9bc4-0f2ebd9ac75&width=1060)上面的截图中，有文字被加粗，也有文字是斜体，还有带链接可点击的文字。 那么如何通过全新的 `AttributedString` 来实现呢？
![image.png](https://cdn.nlark.com/yuque/0/2021/png/225346/1624293621307-14f08586-7860-4a8d-ab0c-33d804d436ff.png#clientId=u3c5e323b-02ae-4&from=paste&height=204&id=udd5392ed&margin=%5Bobject%20Object%5D&name=image.png&originHeight=204&originWidth=1692&originalType=binary&ratio=1&size=81882&status=done&style=none&taskId=u6e60f004-2204-48b8-8363-bd520689b68&width=1692)

- 首先通过简单的初始化语法得到一个 `AttributedString` 结构体，传入的初始化内容是 `Thank you`。

同时，我们这里对属性字符串设置一个全局的字体属性，

<a name="zvATD"></a>

# 二、 格式化器 - Formatters

<a name="dUPZQ"></a>

# 三、 语法协议引擎 - Grammar agreement

_​_
