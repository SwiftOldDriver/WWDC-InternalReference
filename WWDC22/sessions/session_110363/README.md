---
session_ids: [110363]
---

# WWDC22 110363 - App 包大小优化和 Runtime 性能提升

> 本文基于 [WWDC22 - Improve app size and runtime performance](https://developer.apple.com/videos/play/wwdc2022/110363/) 进行创作

<!--待插入思维导图-->



## 前言

作为 `iOS` 开发者，我们每天都会与 `Swift` 或 `Objective-C` 打交道。在编写完代码之后，我们需要通过 `Xcode` 进行编译，然后运行在真机或者模拟器上面。这一看似习以为常的操作依赖于编译器和运行时。

今年 `Apple` 在 `Swfit` 和 `Objective-C` 的编译器和运行时上面做了许多优化和调整，使得基于 `Xcode 14` 开发或者以 `iOS 16,tvOS 16,watchOS 9` 为最低支持版本的 `App` 可以获得包大小的优化和 `Runtime` 性能的提升。值得一提的是，本文不会有新的 `API`，也不会涉及语法变动和新的 `Xcode Build Setting`。 

> [Objective-C Runtime 官方文档](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html?language=objc#//apple_ref/doc/uid/TP40008048)
> 
> [Swift Runtime 官方文档](https://github.com/apple/swift/blob/main/docs/Runtime.md)

今年在编译器和运行时带来的优化包括以下四个方面

* `Swift` 协议检查
* `Objective-C` 消息发送
* `Retain` 和 `Release` 调用
* `Autorelease` 自动省略

这些优化不需要修改你的代码，因为 `Apple` 做出的改动对于开发者来说是不可见的，你几乎不需要付出任何成本就可以获得这些优化。

## Swift 协议检查

### 什么是协议检查

协议检查的定义其实十分

### Swift 协议检查存在的问题

### Swift 协议检查优化方案

## Objective-C 消息发送

### Objective-C 消息发送的前世今生

### Selector Stub 优化方案

### 选择合适的优化策略

## Retain & Release 调用

### objc_retain 和 objc_release

### 自定义调用约定

## Autorelease 自动省略

### 什么是 Autorelease 自动省略

### Autorelease 自动省略存在的问题

### Autorelease 自动省略优化方案

## 总结

