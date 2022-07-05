```
---
session_ids: [110367]

---
```

# Session 110367 - 使用 Concept 简化 C++ 模版

> 本文基于 [Session 110367](https://developer.apple.com/videos/play/wwdc2022/110367) 梳理。

Xcode 作为使用 Clang 的 IDE，除了可以用来编写 Apple 自家的 Objective-C 和 Swift 代码以外，同时也支持 C/C++ 代码的编写。今年 Apple 为 Xcode 14 带来了 C++ 20 的官方支持，开发者无需再自行编译和选择 toolchain。本文主要介绍 C++ 20 中引入的 concept 特性，及其是如何简化 C++ 模版代码并提升 C++ 范型编程的类型安全，最后会介绍如何使用 C++ 编译期计算特性 constexpr 来优化 C++ 代码的运行时性能。

## C++ 范型编程

在了解 concept 之前，先快速科普下 C++ 模版（template）。

C++ 的 template 特性是 C++ 范型编程的基础，让 C++ 支持类和函数定义时使用未明确类型，编写灵活可复用的抽象代码，在现代 C++ 编程和 STL 中大量使用。





