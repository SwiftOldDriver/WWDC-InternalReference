---
layout: post
title: "强大的 Network Instruments - 诊断你的 APP 网络请求及流量控管"
date: 2020-06-14T17:08:23+08:00
categories: [ios, wwdc21, instruments]
keywords: "iOS, WWDC21, instruments, network"
author: "Frank"
---


> 作者：Hi 大家好，我是来自台湾的黄韦程，可以叫我 Frank，目前在上海抖音担任 iOS 开发，更多[关于我](https://blog.wchuang.cc/about/zh)可以到我的个人博客看看，欢迎加个好友互相關注 :)
>
> 审核：
> 小T，广深剪映专业版团队技术负责人，iOS老司机，最近也玩Mac开发，对于跨平台开发方案有一些经验
> Damonwong，iOS 开发，老司机技术周报编辑，就职于淘系技术部

> WWDC21 - Session10212 - [Analyze HTTP traffic in Instruments](https://developer.apple.com/videos/play/wwdc2021/10212/)

## Contents

1. 前言
2. Xcode 13 Beta Release Notes
3. Instruments with Network template
	* 新版本视图
	* 新版本特点
4. 做了哪些优化
	* 网络追踪视图层级调整
	* Task 及 Transaction 概念
	* 请求的几种标签
	* 请求的几种状态
5. 如何检测你的网络请求并且解决问题
	* 发现第一个问题
	* 开启 Instruments
	* APP 启动
	* 检测问题并修复
6. 集成共享登录 Pets SDK
	* 验证 Sign In with Pets
	* 发现隐私泄漏
	* 如何导出 Trace 日志
7. 更进一步
8. 笔者心得
9. 总结

## 前言

今年 WWDC 2021 苹果除了推出了期待已久的 async/await, actors 等的 concurrency 相关技术外，也在性能优化上下了许多努力，如：[Reduce network delays for your app](https://developer.apple.com/videos/play/wwdc2021/10239), [Detect and diagnose memory issues](https://developer.apple.com/videos/play/wwdc2021/10180/), [Understand and eliminate hangs from your app](https://developer.apple.com/videos/play/wwdc2021/10258/) 等，有网络，内存或卡顿相关主题。

而苹果内置的性能检测工具 Instruments 也在今年针对网络监控上做了大大的升级，这也是今天要介绍的主题：如何使用 Instruments 检测并且分析你的 app 网络流量及 HTTP 请求行为。

Let's get it started!

## Xcode 13 Beta Release Notes

先来看一下这次的 Release Notes，这边只列出与 Instruments 相关的，感兴趣的同学可以看下 [Xcode 13 Beta Release Notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-beta-release-notes)。

- New features
	- 可以调适进程 CFNetwork 层的 HTTP 流量，包括了进程外后台流量
	- 可以看到基于每个 URLSessionTask 的耗时、HTTP transaction 及 transaction 详细状态
	- 可以看到 URLSessionTask 的 Backtraces 调用栈，也能定位到代码具体位置
	- 完整的 HTTP 请求及响应的 headers 及 bodies
	- 可以获取到经由 VPN、proxies 或者绑定证书发送的流量
	- 支持使用新的 --har 导出标志，经由 xctrace 导出 HTTP 数据

- Known Issues
	- 使用 tvOS 15 系统的 Apple TV，无法停止 Instruments 发起的 HTTP 流量记录
    	- Workaround：不用 Instruments 记录 HTTP 流量

注：想要尝鲜的同学需要先升级到 iOS 15，同时模拟器是不支持的。

## Instruments with Network template

### 新版本视图

![](https://images.xiaozhuanlan.com/photo/2021/4816690d6f50210985bf894c2a15f9c0.png)

### 新版本特点

1. 可适用于所有苹果设备。
2. 支持 HTTP/3 以及 VPN。
3. 进程为单位，集成于底层网络框架：可以让你在使用 high level 的 NSURLSession 及 NSURLSessionTask 时，监控网络请求整个链路情况，包含命中缓存请求或是网络错误。

## 做了哪些优化

### 网络追踪视图层级调整

1. 最上层的 HTTP Tracffic 记录了你的 app 整个生命周期内有几个 URLSession tasks。

	![](https://images.xiaozhuanlan.com/photo/2021/b65c40def05e424d076a22fa7ab0c2f4.png)
 
2. 次层以 Process 进程作为区别，在每个进程底下你可以看到都有几个 URLSession 进行著，你也可以看到 URLSession 做了哪些任务。

	![](https://images.xiaozhuanlan.com/photo/2021/634aeaebef5fb263a91b57a77ab67ddf.png)

	![](https://images.xiaozhuanlan.com/photo/2021/aca24d9015e4c51d63adb1f75bb294d6.png)
	
	另外，你可以对每个 URLSession 命名，如：这边的 Main Session。
	
	```swift
	let session = URLSession(configuration: .default)
	session.sessionDescription = "Main Session"
	```

3. 最下层是以每个请求的 Domain 域名作为区隔，你可以看到每个请求的状态，包含它的请求方法，响应时间，成功或者失败等等。

	![](https://images.xiaozhuanlan.com/photo/2021/85ff73b289a07251cab77f0d93cd9e2e.png)

### Task 及 Transaction 概念

这里引入了 Task 以及 Transaction 的概念，一个 task 可以包括了许多 transactions，你可以想像每个 transaction 就是一个请求，它是由 request + response 组成，也就是请求发起直到收到响应为主。

```swift
let session = URLSession(configuration: .default)
let task = session.dataTask(with: url) { data, response, error in
	// Task end!
}

task.resume() // Task start!
task.taskDescription = "Load Thumbnail"
task.taskIdentifier = 42
```

当我们调用了 resume 方法，表示 task 开始，直到收到 API response 回调后，task 结束。你可以替每个 task 命名以及编号，它方便我们在 instruments 上分辨。

比如：
	![](https://images.xiaozhuanlan.com/photo/2021/6ceaa5cddbcd2b18b722ac673a023525.png)
如果请求失败（自动带入错误信息，方便调适）：
	![](https://images.xiaozhuanlan.com/photo/2021/54182ccdaf2c6f5dec7c91fdeeb474e5.png)

如上述提到的，一个 task 可以包含多个 transactions，假设我们发送一个 GET 请求到 apple.com，但这个网址不是一个标准的 URL 格式，因为实际上 domain 位置是在 www.apple.com。

所以当我们建立了这样的一个任务时，URL loading system 会建立一个发送到 apple.com 的请求，随即收到由服务器返回的转址响应，然后转址至 www.apple.com。

![](https://images.xiaozhuanlan.com/photo/2021/e17033c4e30a4b78fb7af6e9852cbc59.png)

同时，在第一个 transaction 你可以看到后面跟著 301 的 HTTP 状态码，也是意味著收到了一个redirect 转址回应。而第二个 transaction 则是收到了 200 状态码的成功响应。所以，一个 transaction 由一组 HTTP 请求及响应组成，它跟 URLSession 处理任务的方式一致，并且包含了 HTTP 层的所有信息，比如：请求的 URL、传输的数据信息等等。

底下小总结一下，一个请求 (transaction) 都有哪些标签。

### 请求的几种标签

![](https://images.xiaozhuanlan.com/photo/2021/819f528283b0dd16ab3666d80aee4702.jpeg)

### 请求的几种状态

每次请求由 request 发起到接收 response 的耗时
首先我们需要先了解请求的几种状态及其变化。

![](https://images.xiaozhuanlan.com/photo/2021/86afa57071cde3f167893cdbd382a4ab.jpeg)

#### 缓存查找

请求的开始是由 URL Loading System 发出请求的时间，也就是调用了 `resume` 的时候，接著，开始检查是否存在一个有效的缓存响应？如果没有，则开始请求的排程。

#### 阻塞

这个阶段可能处于等待连线的建立或是连线忙碌中，直到可用的连线资源释出。

#### 发出请求

当可用连线资源释出并且完成连线建立，就会发出请求。从第一个字节发出起算，直到最后一个字节发出为止。

#### 等待响应

闲置状态，等待服务端响应。

#### 接收响应

收到服务端响应，由收到第一个字节起算，直到接收最后一个字节为止。一旦 URL Loading System 确定这是一个成功的响应，整个请求在最后一个字节后立即完成。

实务上来说，GET 的缓存查找阶段以及发送请求状态通常要短很多，因此，更可能出现这样的情况，简化为三个阶段：阻塞、等待响应以及接收响应。

![](https://images.xiaozhuanlan.com/photo/2021/d0abfd6d0a645db85ef35d03e71000ad.png)

## 如何检测你的网络请求并且解决问题

接下来我们藉由一个实际的 APP 操作，了解如何利用 HTTP Instrument 检测你的网络请求，并且了解如何修复问题及提升效能。

![](https://images.xiaozhuanlan.com/photo/2021/5d2a5b3486860b44611ec25056bd4e7f.png)

这个 demo APP 是一个给喜爱狗狗的目标族群使用，用户可以分享上传爱狗的照片到平台上，你也可以看到你最近上传的图像。

### 发现第一个问题
所以当你每次打开 APP 的时候，APP 会加载新的几张狗狗图像，但是面临到一个问题：*`这些图像需要一段很长时间才能完成加载`*。

让我们用 HTTP Traffic instrument 来帮助我们优化这个问题吧！

### 开启 Instruments

在 Xcode 上 Product menu 选择 Profile，Profile 会以 release 配置编译我们的 APP，确保我们是在开启全部优化的状态下运行。编译完成后，Instruments 会自动打开，

![](https://images.xiaozhuanlan.com/photo/2021/7ce19d93de2b6289c55f15e2ba22e5ba.png)

我们选择 Network template，它会展示 APP 里所有的网络活动，也包含了这次新增加的 HTTP 追踪功能。

![](https://images.xiaozhuanlan.com/photo/2021/59944494b98dc1af2130e49cc777f0ba.png)

Instrument 打开后，你会看到两个追踪轨，第一个是 HTTP Traffic，也是我们这次推出的新功能，我们关注这个轨道。接著，点击 *record* 开始检测。

在你刚开始使用这个功能的时候，你需要先同意隐私权政策，因为 Instrument 会记录所有的网络行为，里面可能会涉及到个人隐私相关的信息及敏感数据，所以你必须要先同意并且小心的使用这些数据。

### APP 启动

开始录制后，Instrument 会自动启动你的 APP，如我们所预期的，APP 打开后以很缓慢的速度下载这些狗狗图像。我们停止录制，来看看发生了什么问题吧！

### 检测问题并修复

把 HTTP Traffic 展开后，你可以看到我们的 Dogs! APP，以及使用的 Main Session URLSession，以及这次载入图像请求的 dogs.example 域名。我们选择这个域名，可以看到详细的请求信息。

![](https://images.xiaozhuanlan.com/photo/2021/18e8e82279866d595ac60bb97247120f.png)

我们可以看到第一个任务是向服务端 GET 查询所有的图像列表，这些图像会出现在 APP 的 "Latest" Tab。

![](https://images.xiaozhuanlan.com/photo/2021/e875a96b5c2fc2838db87572eb757450.png)

当这个任务完成后，我们会创建新的任务去载入列表上每张图像的缩略图以展示。

![](https://images.xiaozhuanlan.com/photo/2021/2702bbc46f6a4e3c79aa0189f5bfee45.png)

总的来说，我们大概需要超过七秒的时候，才能完成全部图像的加载

![](https://images.xiaozhuanlan.com/photo/2021/68a8d126841cefd645435c86e30f94f8.png)

前面几张图片加载的很快，但当我们往下滑动时，会发现接下来的任务需要更长的时间才能完成。证如我们看到的，紫色区域的阻塞状态不断扩大，因为我们有太多的并行请求导致阻塞的问题。

#### 为何阻塞？

为了帮助我们了解为何发生阻塞，我们需要切换到 *HTTP Transactions by Connection* 展示。

在左侧 track 侧边栏中，域名下方有一个向下的箭头，我们可以点击切换到 *HTTP Transactions by Connection*。

![](https://images.xiaozhuanlan.com/photo/2021/bc2dd82d5b119f0c261f40aee30d39d3.png)

这个模式下只会展示所有的 transactions，而不是对每个任务分组。现在我们就可以知道这些请求被放在哪些连接中。

![](https://images.xiaozhuanlan.com/photo/2021/b4debcfd3e0423c5e177abed73480d01.png)

总的来说，总共有六个连接用来处理这些 transactions。让我们来分析一下，第一个连接发出的请求（transaction）然后进一步看下后续的缩略图加载请求。从上到下，很明显每次请求都需要更长的时间才能完成。每个请求的阻塞区域都在增加，事实上，这里有一个很清晰的 staircase pattern 階梯模式。

每个请求都被阻塞，直到同一个连接的上一个请求完成，然后才能发送下一则请求。这个模式不断的重演，其实这就是 *Head of Line Blocking* 头部阻塞，是一个使用 HTTP/1 版本请求的典型问题之一。

这些请求在大部分的时间下都没有做任何事情，而是一直处在阻塞或是等待响应的状态。我们其实可以在等待同一个连接的上一个请求响应回来之前，发送下一个请求，但是 HTTP/1 不支持这么做。HTTP/2 主要的改进之一，就是把发送到同一服务器的多个请求，在同一个连接的基础上复用，也就是俗称的多路复用，来避免这样的阻塞情况。

#### HTTP/2 多路复用

在 HTTP/2，我们可以在第一个请求等待响应的同时发送第二个请求，你的 APP 完全不用做任何事情来支持，因为所有 Apple 平台都支持 HTTP/2，而且从 iOS 15 和 macOS Monterey 开始，也已经开始支持 HTTP/3。

如果你想更多了解 HTTP/1 以及 HTTP/2 之间的差异，以及 HTTP/3 提供的其他好处，请观看这个议程 [Accelerate networking with HTTP/3 and QUIC](https://developer.apple.com/videos/play/wwdc2021/10094)。

在回到我们的 demo APP，改用了 HTTP/2 图像加载瞬间快了好多，it's amazing！我们来看一下Instrument 上的表现吧！都是绿色了！赞赞！

![](https://images.xiaozhuanlan.com/photo/2021/e823c00f69a123b4c2f0a99e1d6236b5.png)

我们再切换到 *HTTP Transactions by Connection*。我们注意这里只有一个连接，这是因为我们不再需要多个连接来发送多个请求，这也意味著我们只需要负担一次连接创建的成本（三次握手）。关注下每个缩略图的请求，我们发现基本上没有处于阻塞的情况，事实上，由于时间非常的短暂，所以在我们的视图缩放级别是看不出来的。最终所有的请求都发出了请求并且等待响应到来，我们往下滚动，可以看到所有的响应都在同一时间收到。

![](https://images.xiaozhuanlan.com/photo/2021/03d60b6e4baa2d5ac3b970d24dda56ea.png)

总而言之，我们在 3 秒内完成了所有的请求，这比之前快了两倍！

#### 换个场景

当我们点击了某一个狗狗图像，会进入一个狗狗的详细页面，这个页面会展示高分辨率的图片并显示离我有多远，右上角还有一个心型图标，可以让你收藏这只狗狗。我允许用户在没有登入的情况下使用 APP 并浏览这些狗狗图片，但是如果想要保存喜爱的图像、在不同设备间同步以及上传新图片，你需要一个帐号登入才能使用。

|  图1   | 图2  |
|  ----  | ----  |
| ![](https://images.xiaozhuanlan.com/photo/2021/1d1fa5b0e9084be655b9e6099fb12693.png)  | ![](https://images.xiaozhuanlan.com/photo/2021/7da1df61e0240137538c723656747ead.png) |

我刚刚收藏了一个狗狗图像并且登录了，让我们再收藏其他狗狗，什么！怎么还需要我重新登录呢？这里我们遇到了第二个问题：*`APP 没有记录登录信息`*。

来看看 Instrument 发生了什么事吧。

![](https://images.xiaozhuanlan.com/photo/2021/a4ef9b5bcebb2741ece2483b7a68396d.png)

1. 在最左侧的任务是我第一次按下收藏按钮的时候。
2. 在它的右侧是返回到 Latest 页面后发出的任务，并且刷新了图像流。
3. 接著，是我点击另一张狗狗图像并且加载高分辨率图像。
4. 在最右边，是我第二次点击收藏的任务。

第一个任务实际上包含了两个请求，第一个请求收到了 401 HTTP 状态码，这是我们预期的，因为这时候我们还没登录。这个请求被绘制成橘色，表示发生了 HTTP 层级错误。然后任务间有一个很大的空白区域，这时候是我们在输入帐号密码所花费的时间。当我输入完成后，就会重新发起请求，这时候收到了 201 HTTP 状态码并且显示为绿色，表示收藏成功。

这里的身分验证、输入密码以及请求重试是 URL Loading System 替我们处理的，因此这两次请求属于同一个任务对象。

#### 过期的 Cookie

第二次点击收藏的时候，任务对象显示为灰色，这是因为我认为第一次已经登录过了，所以直接关闭登录页面而导致任务被取消，这能在标签中看出来。

![](https://images.xiaozhuanlan.com/photo/2021/a425011d8142d245a9550755162d4a5f.png)

请求的间隔是橘色的，因为我们再次从服务端收到了 401 HTTP 状态码，此任务发生在当我尝试把另一只狗狗添加到收藏并再次提示登录后。我们使用一个非常基本的登入系统，用户第一次发送他们的凭证后，一旦服务端收到了并且验证通过，它就会设置一个 cookie 来识别这个用户，这样就不需要在之后的请求再次验证，所以我希望 cookie 有正确的被设置成功。

如同之前提到过的，如果请求发送了 cookie 标头，那么在 HTTP 方法旁边应该要有一个小 cookie 图标。但这里却没有这样的图标，这意味著没有发送 cookie。那么现在的问题是，服务端没有为我们提供 cookie，或是客户端没有发送 cookie 呢？

为了找出答案，我们需要调查之前的请求并检查我们是否从服务端获得了 cookie。

![](https://images.xiaozhuanlan.com/photo/2021/0bda0c55b47a01e0dbf03d79568925c5.png)

这是第一个登录请求的成功请求，我们可以看到在服务端响应的地方确实有一个 cookie 图标，这表示服务端确实发送了一个 cookie。那为什么我们不在下一次的请求中发送 cookie 呢？要获取有关这个请求的更多信息并详细调查 cookie，我们把底部详细信息切换到 "Transactions" 列表。

![](https://images.xiaozhuanlan.com/photo/2021/fdb158df38a83ca124978bc3fec9f1f0.png)

![](https://images.xiaozhuanlan.com/photo/2021/c5d5f68a15678f49449b5eea2a5c29cc.png)

右边显示了当前选定请求的的所有请求以及响应表头，这是我们期望的 Set-Cookie 表头。但是你有发现一个问题吗？上面的有效期是 2020 年 3 月，那已经过去了！所以服务端确实发送了一个 cookie，但它是一个过期的 cookie。这将导致 URLSession 不发送 cookie，因为 URLSession 只会发送仍然有效的 cookie。

这是服务端的一个 bug，一会儿我把 trace 文件发给我们服务端同学，让他们调查问题并修复。现在我们解决了 cookie 问题，我可以收藏更多图片而不需要一直提示登录了！

#### 没有展示的收藏

除了 Latest Tab 之外，APP 还有一个 Favorite Tab，我们可以在里面显示所有用户已经收藏的
狗狗图片，让我们切换到这个 Tab 吧。

这里有一些我昨天添加过的收藏，但由于某种原因，我*`最近收藏的狗狗没有展示出来`*，让我们用 Instrument 来看看发生什么问题吧！

![](https://images.xiaozhuanlan.com/photo/2021/b7cd30c2a75c637934c98085fe8c0416.png)

底下列表有很多请求，我可以用左下角的过滤器來搜索与 "Favorites" 相关的请求，这样我们就能验证是否发出了请求。

![](https://images.xiaozhuanlan.com/photo/2021/6d4c2fcf159ff8a677361771ac78ebd3.png)

过滤后，结果显示我们发送了多个请求，让我们检查每个请求，并且关注在 track view 上面，假如请求时间很短暂的话，你可以放大检视。

![](https://images.xiaozhuanlan.com/photo/2021/e92567617016ae0d37f43da0648f2ca5.png)

这是我们的第一个请求，它是我们第一次进入我的收藏获取的收藏列表请求，看起来没什么问题。我们接著再看其他请求：第二个请求，我收藏了一个新图片，第三个请求，我们再次加载了收藏列表，但是这个 GET  请求只花了几毫秒，这太快了，以致于无法获得服务端响应。让我们切换到 *HTTP Transactions by Connection* 来看更多信息。

![](https://images.xiaozhuanlan.com/photo/2021/caa3eebb3dd6312f945ec722f1e3d9f9.png)

我们注意到第一件事是这个请求不在连接中执行，而是在 *Local Cache* 执行。这表示这个请求没有在网络上发送，而是在本地缓存中加载。这也解释了为什么没有等待响应的状态，因为请求没有发送到服务端。

所以这就是问题所在：我们的请求被缓存了！所以我们实际上并没有询问服务端，并且总是得到一个缓存的响应。

#### 如何解决 Local-Cache

想要解决这个问题的一种方式是设置 *cache-control* 表头并告诉服务端不要缓存这个响应。我们想要用户每次打开我的收藏 Tab 都能加载到最新收藏的图片。如果没有最新收藏的图片，也就是收藏列表没有变化，我们就不需要重复加载整个列表。所以，如果我们可以询问服务端："Hey，有什么变化吗？" 如果有，让我知道。这实际上是我们可以通过在请求上设置缓存策略来实现的！

#### 利用 Instrument 修改代码

|  图1   | 图2  |
|  ----  | ----  |
| ![](https://images.xiaozhuanlan.com/photo/2021/ea5e102297563abdbb07392f4782903e.png)  | ![](https://images.xiaozhuanlan.com/photo/2021/3e57b14f57c913a6d8669e5b3f9cdf31.png) |

我们可以在右侧看到 URLSession 中每个任务的 backtrace 查看方法调用栈，其中在任务中调用了 `resume`，它在 ImageCollection 类型的方法被同步调用。让我们打开 Xcode 修改它。（笔者：这里如果可以支持直接关连到 Xcode 就更方便了）

#### 增加缓存策略

![](https://images.xiaozhuanlan.com/photo/2021/784ac047dd618a8ec2086ec9eccb6c72.png)

我们在 URLRequest 增加了缓存策略：`.reloadRevalidatingCacheData`，这表示我们每次请求都会忽略本地缓存，每次都像服务端发出请求，并且验证我们的缓存是否仍然有效，如果仍然有效的话，服务端将发送 304 响应，让我们继续使用本地缓存。如果失效，服务端将返回最新数据。我们再试试看这样的修改能成功吗？太好了，当我们每次开启收藏夹都能看到我最新添加的狗狗图片了！

## 集成共享登录 Pets SDK

现在我们已经有 Sign In with Apple 登录选项，但我们公司也有几个宠物主题的 APP，另外一个团队正在开发一个共享登录的 SDK 组件，让用户可以在不同 APP 中重复使用他们的帐号。由于这个 SDK 组件还在开发中，另外一个团队询问我们可否用他们的 Pets 代替，所以我拿到了一个二进制 Pets 的 .xcframework 包，方便跨平台使用。现在我们把 Pets 集成到我们的 APP 中，并在 Sign In with Apple 底下添加一个 Sign In with Pets 登录按钮。

![](https://images.xiaozhuanlan.com/photo/2021/edf8269ddc1c09d2396f5431270d090b.png)

### 验证 Sign In with Pets

现在我想知道这种登录方法有多快。我们一样使用 Instruments 来分析。

现在我的 APP 已经启动，并且切换到登录视图。Instruments 显示了这段期间发生的所有网络流量，让我们关注在我们 APP 的 URLSession，但是等等，我预期这边只有出现我们主程序的 URLSession，但是我们刚刚集成的 Pets framework 也从它自己的 URLSession 发出请求，我甚至都没有点击登录按钮。这不是我们所预期的，让我们停止录制来看看发生了什么事吧！

![](https://images.xiaozhuanlan.com/photo/2021/09bbd17b0043d29f51a47d97557ea08b.png)

### 发现隐私泄漏

我们放大最初的几个请求，发现有很多相关的 endpoints，要获取更详细的信息，我们点击 "Pets Sign On Network" session，并在底下详细视图中列出所有请求。它们都是 POST 请求，当我点击某一个请求时，右侧的 backtrace 可以看出请求源自代码的哪一部分。

因此，如我们所欲其请求经由 Pets 调用的 CFNetwork，但我们更深层的查看后，发现似乎涉及到 CoreLocation，这真的很可疑！尤其是当我没有执行任何的操作的时候触发。

我猜测我的位置被发送到了服务端，这也就是 CoreLocation 以及 CFNetwork 在同一个 backtrace 的原因。

|  图1   | 图2  |
|  ----  | ----  |
| ![](https://images.xiaozhuanlan.com/photo/2021/4c67242b085b4833833dbedb19aea7b2.png)  | ![](https://images.xiaozhuanlan.com/photo/2021/40b91d56c680773b0430acee4006e2a0.png) |

为了验证这个问题，我需要通过检查任务中具体请求的详细信息，所以我把详细信息由任务列表切换到请求列表。在右下角的扩展细节中，你可以看到请求包含一些非常标准的表头，这不用担心，但是等等，看了一下请求的 body，我发现它包含了我的位置座标，这真的很糟糕！发送此信息就侵犯了用户的隐私，我们不想在未经他们同意且没有充分理由的情况下收集他们的位置。

到目前为止，为了让用户体验更加良好，我们的 APP 只允许出于合法的目的请求此权限。所以，我不会进一步讨论这个 SDK 的集成，相反的，我会向其他团队提交错误报告，告知他们我检测到这种不可接受的行为。我可以利用 Instruments trace 产生必要的信息错误报告。

### 如何导出 Trace 日志

1. 可以利用 Instrument 直接储存
2. 利用 xctrace command line 导出

xctrace 是一个内置在 Instruments 的命令行工具，它可以 trace 数据导出为 HTTP 存档格式，这是用于交换有关 HTTP 流量信息的行业标准。

`xctrace export --input YOUR_FILE_NAME.trace --har`

这个命令行可以导出 .har 的错误报告文件，收到的人可以在任一支持 HAR 的工具检视信息，即便他们的机器上没有安装 Instruments。

HAR 本身是一种基于 JSON 的格式，所以它也可以在文本编辑器或是使用脚本打开。虽然它里面不包含 Instruments 相关信息，如：URLSession 或 backtrace 信息，但这仍足以讓其他团队调查此问题。

这就是你可以如何使用 HTTP Traffic Instrument 来诊断来自你的 APP 流量的来源和内容，以确保你可以控管你的 APP 在运行时执行的操作。

## 更进一步

1. 开始使用 Instruments 来检测你的 APP！
2. 建议替你的 URLSession 和 URLSessionTask 命名，方便我们定位并修复问题。
3. 适配最新的网络协议。
4. 如果你的 APP 没有存在性能或者功能异常相关的问题，也请你持续的检测你发送了多少的流量，以消除不必要的流量产生。

## 笔者心得

以往的 Instrument 只能帮你检测某个 process 传送了多少字节，接收到多少字节，以及你的请求位置，走的哪一个网络协议等，并没有办法很有效的看出具体在哪个 URLSession 发起以及定位到代码层面，感觉定位更多的是一种类似于 Charles 或是 Wireshark 类的抓包工具。

底下稍微比较一下几种常见的网络检测/抓包的几种方式：

1. Charles 抓包工具
	* 优点：
		1. 支持断点调适
		2. 支持模拟请求封包
		3. 支持弱网环境调适
		4. 模拟器及实体手机皆适用
	* 缺点：
		1. 需要配置证书及代理环境
		2. 需要付费使用（不付费每使用一段时间会关闭）
2. 基于 URLProtocol / URLSessionDataDelegate 类型的请求拦截
	* 优点：
		1. 自定义程度高，可以添加黑名单，过滤请求
		2. 可以结合视图展示，比如知名的 Flex 开源项目
		3. In-app 检测，不需要额外配置
	* 缺点：
		1. 需要开发相关代码（如果使用开源可以满足需求则不用）
		2. 需要关注苹果 Foundation SDK 迭代更新
3. Apple Instruments 13
	* 优点：
		1. 与 URLSession 紧密结合
		2. 清晰易懂的检测 dashboard
		3. 引入 backtrace 查看具体代码调用
		4. 可导出 HAR 格式的检测报告
		5. 苹果内置工具
	* 缺点：
		1. 不支持模拟器
		2. 强依赖 Xcode

以上三种都是比较常见的网络请求检测方式，大家也能看到具体的优缺点比较，虽然想达成的目的差不多，但因为工具的取向及定位本身就不太一样，而造就了不同的产品出来。

笔者认为还是要根据具体开发团队的使用场景来挑选适合团队的工具使用，比如：Charles 可能更适用于 QA 做测试时使用，它的功能强大方便模拟请求或者弱网环境下 APP 的表现如何来进一步验证，而 URLProtocol 及 URLSessionDataDelegate 方案，可能更适合只是想快速的查出请求列表，请求的相关参数，响应的结果等，方便你去跟后端讨论(~~撕逼~~)，最后一种因为依赖于 Xcode，可能更适合开发人员开发测试时使用。

## 总结

现在我们知道了新版本 Instruments 13 with Network template 的强大功能、新的视图、task 以及 transaction 的概念、新版本请求都有哪些标签及状态组成，并且也经由一个实际的 demo APP 了解如何一步一步的利用 Instruments 检测文中提到的四个问题，并且逐步的修复这些问题，利用 backtrace 查看代码调用栈，修复代码，并验证问题是否被正确的修复，最后，我们也知道如何导出 HAR 格式的错误报告。

总的来说，今年 WWDC21 推出的新版 Instruments 还是非常的令人惊艳，比起以往的版本算是做了很大的升级，十分推荐大家尝试看看！

Happy Coding！


## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
