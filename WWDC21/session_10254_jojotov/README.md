
## 标题

WWDC21 - 10254  Swift 并发编程：原理探究


## 文章简介

在 WWDC 2021 中，Swift 迎来了一次重要的版本更新 —— Swift 5.5。Swift 的此次更新为 Swift 并发编程带来了非常大的改变，通过 `async/await`（ [SE-0296](https://github.com/apple/swift-evolution/blob/main/proposals/0296-async-await.md)）、Actors （[SE-0306](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md)）以及 Task Group，Swift 在语言层面上增加了更为抽象的结构化并发模型（Structured concurrency），同时保障了并发场景下的性能和安全性，使开发者可以在更抽象的层面上思考并发场景的解决方式，而无需面对使用 GCD 等传统并发模型时可能出现的多线程问题。

为了更好地理解 Swift 并发模型所解决的问题以及其背后的原理，本 Session 将通过一个开发新闻浏览 App 的例子，探究 Swift 并发模型的实现原理，以及使用 Swift 并发模型编码过程中，如何获得更好的性能和效率。


## About Me

iOS 开发，SwiftGG 翻译组成员，目前任职字节跳动，负责抖音直播客户端相关工作。
