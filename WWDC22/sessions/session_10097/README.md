

# 【WWDC22 10097】What's new in App Clips?

![title](images/title.png)

本文基于  [Session - 10097 What's new in App Clips](https://developer.apple.com/videos/play/wwdc2022/10097/) 梳理



## 引子

###### TODO: 补一个App Clip发展的时序图 or 文章脑图

距离 WWDC20 发布 App Clip，已经过了三年的时间。App Clip 发展的越来越完善。在今年的 session，**TODO：完善引子，引出全文的概括。**。让我们开始探索吧。



## App Clip 全新的包体积限制

App Clip 诞生以来，就以轻而快著称，它为速度而生。App Clip 为了让用户无感知下载的过程，包体积需要做的很小。随着网络基础设施的进步，在 iOS 16 版本，App Clip 的大小限制扩大为 15 MB。给了工程师更多的空间来开发更多有创意的功能。

| 版本      | App Clip 包体积最大显示 |
| --------- | ----------------------- |
| < iOS 16  | 10 MB                   |
| >= iOS 16 | 15 MB                   |

将 App Clip 的最低支持版本设置为 iOS 16 来获得最新的包体积限制。需要注意的是，为了兼容 iOS 15 及以下版本，App Clip 仍然需要保持 10 MB 以下。速度，是用户获得出色体验的关键。用户不会永远都处于网络良好的环境，因此优化 App Clip 包体积大小是十分重要的。接下来，介绍下优化 App Clip 包体积的一些方式。

#### TODO: 包体积大小获取



## App Clip 诊断工具
