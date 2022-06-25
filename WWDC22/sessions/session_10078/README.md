# WWDC22 - 如何降低网络延迟以打造更具响应性的 App
本文基于 [Session 10078](https://developer.apple.com/videos/play/wwdc2022/10078) 梳理，如需了解更多，可以浏览文末的参考来源。

## 前言
如何打造更具响应性的 App ，对于开发者来说是一个永恒的课题；原因无他，因为对于一个以网络交互为核心的现代应用来说，这是用户体验的核心所在：它意味着更流畅的音视频播放、低延迟的网络会议、快速加载的页面和资源、更少的游戏等待时间等等。2021年，苹果通过 [Session 10239: Reduce network delays for your app](https://developer.apple.com/videos/play/wwdc2021/10239) 给大家分享了许多网络延迟优化相关的理论知识，并提出了 RPM (每分钟往返次数) 的概念和基于此概念的测试工具；而今年，苹果在去年的基础上，又为我们带来了这一篇实战性质颇强的分享，从客户端侧、服务端侧、网络协议侧三个方面入手提供一系列行之有效的建议，帮助开发者们更好的分析和改善应用的网络延迟状况，从而打造更具响应性的 App 。

## 论网络延迟的重要性

### 网络延迟的定义
网络延迟指的是数据包从一个端发送到另一端所需要的时间；它决定了网络侧的内容经过多久可以到达你的设备和应用上。如果网络延迟很大，那么设备上的应用程序都会收到影响，从而导致糟糕的应用体验。

### 降低网络延迟 = 升级带宽？
举例而言，在视频会议的场景下，网络延迟可能会带来卡顿或者画面冻结，从而导致会议完全无法进行。为了解决此类问题，人们通常的做法有联系网络服务商来升级网络带宽、更换更好的网络设备、通过 mesh 组网构建更好的  wifi 网络等(如下图所示)。
![](./images/update_network.png)
这些措施从本质上来说都是升级网络带宽和优化网络质量的手段， 但它们仍无法完全避免问题的发生。有研究表明，通过增加带宽的手段一开始可以改善页面加载的时长，但当带宽超过一定的大小后，就收效甚微；对比来看，降低网络延迟则基本上一直可以减少页面加载时间，两者基本呈现线性关系。

![](./images/load_bandwidth.png)

![](./images/load_latency.png)
那么这究竟是为何？想弄清楚这一点，我们需要知道 App 的数据包是如何在网络上被传送的。当 App 从服务器请求数据时，数据包从网络堆栈中被发送出来；你可能以为它们会被无延迟的从网络上直接发送到服务器，但事实上，网络链路中最慢的一个节点通常积压了大量的数据包等待处理，这个数据包的积压队列往往会很大。

![](./images/packet_travel.png)

这样一来，从你的 App 往外发送的数据包不得不等待该积压队列全部处理完毕才能通过。在这个最慢的节点上的等待增大了 App 到服务器之间的往返时间；带宽的增加并不能够改善这种积压的问题，因此我们可以知道，升级带宽并不一定能改善网络延迟。

### 网络延迟 = RTT(Round Trip Time) 次数 * RTT时间
当应用请求需要经过多次往返才能获得响应的时候，因积压导致的网络延迟问题会被放大。举例来说，一个常见的https请求需要经过4次往返才能获得响应（tcp 1次，tls 2次，http 1次，如下图），而且每次往返都会受到积压队列的影响，这个响应的总时间最终变得非常长。

![](./images/httprtts.png)

因此，我们可以看出，决定网络延迟的两个最重要的因素就是单次往返的耗时和往返的次数；降低它们即可显著的降低应用的延迟，从而提升应用的响应性。
![](./images/rtt.png)

## App侧的优化建议
### 使用现代网络协议
我们通过使用现代网络协议即可显著的降低应用的网络延迟，主要包括 IPv6、TLS 1.3 和 HTTP/3等。只要服务端支持这些协议，在App 侧，你只需要使用 URLSession 和 Network.framework 框架的 API即可自动使用以上的协议。目前，通过 Safari 浏览器的流量有 20% 是基于 HTTP/3 来承载的；统计数据显示，HTTP/3 可以显著的提升请求完成的时间，仅约为HTTP/1.1的一半（如下图所示）。
![](./images/safari_http3.png)

### 启用 handover 处理网络切换
就我们以往的经验来看，在网络切换的场景下，我们的连接需要重新建立（主要是基于 TCP 的长连接），这个过程往往会相当耗时，很影响用户体验；但现在我们可以启用 handover 来优化这个过程, 苹果称之为连接迁移。配置连接迁移的核心代码如下：

```swift
// URLSession
let configuration = URLSessionConfiguration.default
configuration.multipathServiceType = .handover

// Network.framework
let parameters = NWParameters.quic(alpn: ["myproto"])
parameters.multipathServiceType = .handover
```
启用 handover 并且确保它正常工作，我们就可以获得无缝切换的效果。
![](./images/http_compare.png)

### 启用 QUIC 数据报
如果你使用基于UDP的自有协议, 在 iOS 16 和 macOS Ventura 下，苹果建议我们启用 QUIC 数据报，在该协议配置下，通过优化的拥塞控制算法可以显著的降低 RTT 时间并减少丢包。具体配置代码如下：

```swift
// Only one datagram flow can be created per connection
let options = NWProtocolQUIC.Options()
options.isDatagram = true
options.maxDatagramFrameSize = 65535
```
## 服务端侧的优化建议
### 网络质量检测工具介绍
尽管我们的服务器很可能采用了很高水准的硬件配置，但它们仍然可能成为网络延迟的罪魁祸首。在 macOS Monterey 我们引入了网络质量检测工具，你可以使用该工具来检测服务提供商的网络和你的服务器上是否存在“缓冲膨胀 （buffer bloat）”。在该工具中需要把你的服务器配置成目标，并和苹果的默认服务器进行对比测试。如果苹果的默认服务器得分情况良好，但你的服务器表现不佳，那么你的服务器在网络层面很可能需要改进。具体的配置和运行参考如下：

```
Configure your server
https://github.com/network-quality/server

// networkQuality tool in macOS
networkQuality -s -C https://myserver.example.com/config
```
### 合理的缓冲配置
在很多情况下，不合理或者说过大的缓冲配置会导致数据包在服务器侧形成巨大的缓冲队列，带来额外的延迟。苹果通过一个视频流媒体拖放的场景来对比了两种截然不同的配置下的表现：一种是相对过大的缓冲配置（TCP 4MB、TLS 256KB、HTTP 4MB），另外一种是苹果推荐的相对合理的经验配置（TCP 128KB、TLS 16KB、HTTP 256KB）。结合 macOS 中的网络质量检测工具的使用，我们可以很方便的定位到了该问题；所有最新发送的数据包都要等待缓冲的数据发送完毕，因此拖放的体验会非常差。相对应的，在 Apache Traffic Server （ATS）上的具体配置如下：

```
% cat /opt/ats/etc/trafficserver/records.config

# Set not-sent low-water mark trigger threshold to 128 kilobytes
# tcp 128KB
CONFIG proxy.config.net.sock_notsent_lowat INT 131072

# Set Socket Options flag to the sum of the options we want
#  TCP_NODELAY +  TCP_FASTOPEN + TCP_NOTSENT_LOWAT 
# TCP_NODELAY(1) + TCP_FASTOPEN(8) + TCP_NOTSENT_LOWAT(64) = 73
CONFIG proxy.config.net.sock_option_flag_in INT 73

...
# Enable Dynamic TLS record sizes
CONFIG proxy.config.ssl.max_record_size INT -1
...

# Reduce low-water mark and buffer block size for HTTP/2
CONFIG proxy.config.http2.default_buffer_water_mark INT  32768
# http 256KB
CONFIG proxy.config.http2.write_buffer_block_size   INT 262144
```
在上面的配置中，我们启用了TCP_NODELAY / TCP_FASTOPEN / TCP_NOTSENT_LOWAT，并将TCP的缓存水位值设置在了128KB； 将动态 TLS 记录大小设置为启用；将HTTP2 的缓存大小设置为 256KB。 在其他的 web 服务器上也需要寻求等价的配置来进行设置即可。
## L4S 最佳实践


## 总结

这篇分享主要介绍了人像分割以及 Vision 框架在人物分析方面的新能力；其简单易用的 API、多框架支持的设计对开发者非常的友好。如果这篇文章给了你一些启发或是你脑子里有了一些新点子，那么还等什么？跟随毛子哥的脚步，赶紧去动手实践吧！


## 参考
- [Apple - Reduce networking delays for a more responsive app](https://developer.apple.com/videos/play/wwdc2022/10078/)
- [Apple - Reduce network delays for your app](https://developer.apple.com/videos/play/wwdc2021/10239/)


