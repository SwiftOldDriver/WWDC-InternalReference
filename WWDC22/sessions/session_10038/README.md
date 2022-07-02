---
session_ids: [10038]
---

> 作者：Sinno，iOS开发者，目前就职于字节跳动音乐团队
>
> 审核：士土Edmond木

# 前言
SKAdNetWork 是苹果于 2018 年推出的 App 安装归因框架，主要目标是在保护用户隐私的前提下，帮助广告主衡量广告的投放效果。在发布之初，SKAdNetWork并未引起重视，主要是因为基于 IDFA 的归因方案已经非常成熟，随着 ATT 政策正式实施，IDFA 已经无法轻松获取，基于 SKAdNetWork 的归因方案越来越被人们重视。

在过去几年里，SKAdNetWork 也在不断完善， 在 WWDC 2022 上，苹果介绍了最新版本 4.0 的新特性，本文基于 session 10038 写作，分为以下几个部分：
1. 广告归因介绍
2. IDFA归因
3. SKAdNetWork归因
4. SKAdNetWork 4.0 新特性



# 广告归因介绍
## 广告与生活
说到广告，相信大家并不陌生，但是你有想过你一天会看到多少广告吗？ 50个？ 100个？ 太少了！真实的数字可能有点夸张，据国外统计，2021年，一个普通人一天要看超过 6000 个广告！

想象一下，从早上睁开眼睛，身边就到处都是广告，除了现实生活中地铁、电梯等随处可见的实体广告，你打开 app 会看到开屏广告，刷抖音会刷到视频广告，打开百度搜索前面几条结果可能也是广告。当你在看这篇文章，说不定页面上也有几个广告呢🤣。

可以说广告已经完全融入了我们的生活，成为了生活的一部分。

## 广告的参与者
我们可以把广告生态中的角色简单划分成四种：

* 广告主：为推销商品或提供服务的组织或个人

* 广告平台：提供平台，连接广告主和媒体(流量主）

* 媒体：也叫流量主，其接收广告主物料，并为之投放广告，获得广告收益

* 受众：广告的目标用户

## 广告归因
对于普通用户来说，看到的大部分广告都被习惯性忽视了，只有极少部分广告会真正影响用户的行为和决策---比如下单购买、下载 app 等。对于广告主来说，肯定是希望花最少的钱，做最有营销效果的广告。

百货业之父约翰·沃纳梅克有句话特别出名："我知道有一半广告费浪费了，但我不知道是哪一半"
![](./images/john.jpeg)

如何找到浪费的哪一半广告费？最有效的办法就是对广告效果进行归因，根据归因结果决定投放策略。目前已经有很多专业的归因监测公司，比如 AppsFlyer, Adjust 等。

## iOS App 下载归因
本篇文章要讲的场景是 iOS 上 App 下载安装的归因。

比如你们公司新开发了一款 iOS App， 同时在抖X、快X 上投放了广告，投放一段时间后肯定想要看看两个渠道的效果如何，计算成本和收益，决定后期在两个渠道的广告预算。

iOS App 下载归因的方式有很多，如下图 AppsFlyer 介绍的归因方案，但是确定式匹配的目前只有基于设备 ID 匹配和 SKAdNetwork 的方案（苹果搜索广告只支持 App Store 里的广告，此处暂不涉及）。
![](./images/appsflyer_attr.png)




# IDFA 归因
## 什么是 IDFA
IDFA (Identifier for Advertising), 是 Apple 向用户设备随机分配的设备标识符。其推出的主要目的是保护用户隐私（用户可以主动重置），替换之前用于唯一标识用户的 MAC地址、UUID 等ID。

IDFA 最重要的特点是：每个设备只有一个 IDFA， 同一设备不同 App 获取的 IDFA 是一致的。广告主使用此标识符来跟踪数据，以便提供定制广告。

## IDFA 归因
IDFA匹配的过程如下：

![](./images/idfa_attr.png)

## 越来越严格的 IDFA 政策
从 IDFA 推出以来就可以由用户主动重置，重置后 App 获取的 IDFA 将和之前的不一致，从而避免被持续追踪。

2016 年，苹果更是推出了 LAT（Limit Ad Tracking）限制广告追踪政策，开启 LAT 后， App 获取到的 IDFA 将为全是 0 的字符串。据 Adjust 估算，至少有 12% 的 iOS 用户启用了 LAT, 但仍没有影响 IDFA 成为主流的归因方案。

2021年，苹果正式开始实施 ATT (App Tracking Transparency) 隐私政策，从 iOS 14.5 开始，App 需要用户授权同意才可获取到 IDFA。

据 AppsFlyer 的调查数据表明，只有 40% 左右的用户会同意获取 IDFA 的权限，在这种情况下，单纯通过 IDFA 进行匹配归因将无法覆盖大部分 iOS 用户。

// TODO: 画一个时间轴

# SKAdNetWork 归因
SKAdNetWork 是苹果于 2018 年推出的归因框架，可以在保护用户隐私的同时进行 App 下载归因。随着 ATT 政策的实施，SKAdNetWork 已经成为 iOS 平台上非常重要的精确式归因方案。

SKAdNetwork 涉及的参与者有三个：
* 广告网络(Ad networks): 在广告产生转化后签署广告并接收安装验证回传
* 媒体 App (Source apps): 从广告网络拉取广告并进行展示
* 广告主 App (Advertised apps): 在应用启动后调用相关API进行注册，以及后续转化数据的上报

## 发布历史

## 归因过程
下图描述了 StoreKit 呈现的广告的安装验证路径。应用 A 是显示广告的媒体 App。应用 B 是用户安装的广告主 App

![](./images/SKAdNetwork3.0.png)

1. 应用 A 展示从广告网络加载的带有签名的广告
2. 用户点击广告进入App Store页面下载安装了应用 B
3. 应用 B 启动后调用 registerAppForAdNetworkAttribution 进行广告归因注册，第一次调用此方法时，若设备本地有归因数据，则会生成安装通知，同时启动一个 24h 的定时器。在 24h 内若调用 updateConversionValue 方法，则会重置该定时器(重新生成24h的定时器)
4. 24h 定时器到期，设备将在随机 0~24h 后向广告网络发送验证回传数据
5. 广告网络收到验证回传数据并进行归因

# 未完待续

# 详细介绍
## 历史-时间轴
## 涉及的三方：广告网络、媒体app、广告主app 关系
## 运行原理

# SKAdNetwork 4.0
## 分层 id 和 转化值
## 多个转化值
## Web to SKAdNetwork
## 可测试性


# 参考链接
https://ppcprotect.com/blog/strategy/how-many-ads-do-we-see-a-day/
https://www.ichdata.com/app-traffic-source-tracking-method-for-ios.html
https://www.appsflyer.com/blog/trends-insights/att-opt-in-rates-higher/
