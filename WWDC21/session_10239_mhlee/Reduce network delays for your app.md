# WWDC21 10239 - Reduce network delays for your app


本文基于 [Session 10239](https://developer.apple.com/videos/play/wwdc2021/10239) 修改，主要介绍了影响网络延迟的原因及如何降低网络延迟。


网络延迟是影响 App 用户体验的一个重要因素。如果用户使用一个 App 的网络请求经常延迟比较高，对用户来说意味着糟糕的使用体验；对开发者来说，则可能意味着负反馈，甚至是用户流失。以往我们并没有太多手段在客户端层面来降低网络延迟，这次我们来看下 WWDC 给我们提供了什么样的技术来降低网络延迟。


## 影响网络延迟的原因


我们测试网络环境最常见的手段是`ping`。但是`ping`只是测试的不在使用网络时的网络环境，然而真正影响 app 的是我们正在使用 app 时的网络环境。

iOS15 系统在 Settings->Developer->NETWORKING 下新增了 Responsiveness 功能，此功能用于测试当前的网络环境。如下：
![WX20210620-140344@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593209998-8a99bfc2-52db-4d6f-bf7d-784d2cbd69aa.png#clientId=uaf4b4a10-7211-4&from=drop&id=u987bb79f&margin=%5Bobject%20Object%5D&name=WX20210620-140344%402x.png&originHeight=1890&originWidth=3360&originalType=binary&ratio=2&size=1300691&status=done&style=none&taskId=u61be8c5e-f485-4571-ae7c-1f071b1b3e4)
macOS 系统也提供了网络环境测试的命令行工具，目录在 /usr/bin/networkQuality，但是只在新的 macOS Monterey 及以上系统才支持。


### RPM


上面的图可以看到最终的测试结果显示 Low (28 RPM)。RPM 是指 Round Trip per minute。这个度量单位是苹果在此次 WWDC 中新提出来的。 提出这个度量单位，是因为我们平时所说的以 ms 为单位的网络延迟，对大部分人来说是个抽象的概念。与 ping 得到的网络延迟不同，RPM 越高则表示网络延迟越小。


用 ping 测试自己的网络延迟时，你可能会得到一个非常低的延迟，但是当 iPhone 或 mac 在工作环境测试 RPM 时，结果可能会相当糟糕。用 ping 测试网络环境，可能 RTT(round trip time) 只有 20ms，但是当在使用环境下测试时，RTT 甚至能达到 600ms， 实际使用情况差了30倍。


所以 RPM 是一个可以反映用户使用体验的度量单位。


### 什么是 Round Trip Time


Round Trip Time(RTT) 或 Round Trip Delay(RTD) 是指来回通信延迟，即在通信、电脑网络领域中，意指：在双方通信中，发讯方的信号传播到收讯方的时间，加上收讯方回传消息到发讯方的时间。我们使用 ping 命令获取网络延迟得到的 ms 为单位的值，就是 RTT。


### bufferbloat


Session 里以视频会议为例，我们在使用在线视频或音频时，其实 Mb/s 的速度已经足够满足我们的实时通话需求，尽管近年来我们的网络带宽从 Mb/s 提高到了 Gb/s 级别，但是我们仍然会遇到视频音频延迟情况。这是因为高吞吐量并不代表低延迟，现在通常说的网速其实是指「容量」而非「速度」。那为什么仍会有这种问题？我们先来了解一个概念：bufferbloat。


表面上客户端和服务端收发数据包时是这样的：
​

![transports1@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593290923-2c701538-f699-4159-9ea0-d99ff10a75fc.png#clientId=uaf4b4a10-7211-4&from=drop&id=ud76d50a4&margin=%5Bobject%20Object%5D&name=transports1%402x.png&originHeight=552&originWidth=2138&originalType=binary&ratio=2&size=105060&status=done&style=none&taskId=u8b440196-a733-49ec-9df8-8634823032d)


但是实际情况可能是下图这样：


![transport2@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593301501-ddedaa70-30e3-477d-8d00-83acbe46038f.png#clientId=uaf4b4a10-7211-4&from=drop&id=u222c0a00&margin=%5Bobject%20Object%5D&name=transport2%402x.png&originHeight=554&originWidth=2160&originalType=binary&ratio=2&size=127933&status=done&style=none&taskId=u7d38632f-09fb-4737-b4ab-bd88a11e293)


通信设备往往设置了缓冲区，在先进先出队列系统中，过大的缓冲区会导致更长的队列和更高的延迟，并且不会提高网络吞吐量。当网络拥塞时，就会发生缓冲膨胀现象（bufferbloat）。后来提出了[CoDel](https://zh.wikipedia.org/wiki/CoDel)算法来解决这一问题。


bufferbloat 是影响网络延迟的一个重要因素，但是并不是唯一因素，除此之外还有：


软硬件处理时间， CPU 性能提升，会降低处理时间。


数据传输时间，带宽的提升可以降低数据传输时间。


传播时间，这个时间受传输媒介影响，不能改变。


综上，上述因素，我们似乎没有什么手段从客户端进行干预。所以接下来我们从降低 RTT 次数入手。


一次网络请求的时间 = Round trip time  x Number of round trips


对于一个 app 开发者来说，我们并没有太多手段降低 RTT，但是我们可以降低 RTT 的次数。


### 降低 RTT 次数


采用一些新技术，可以降低 RTT 次数。当然，要想使用这些技术 ，首先是需要服务器支持这些协议的。


下面介绍下几种新技术是如何降低 RTT，并介绍在 iOS 层面如何使用。


#### HTTP/3 over QUIC


`QUIC`是新一代的传输协议，基于`UDP`协议，降低 RTT 主要是通过减少握手次数。


我们知道 TCP 建立连接需要3 次握手，这需要 1.5-RTT，如果再加上 TLS 的握手时间，总共需要 3-RTT。QUIC把传输和加密握手合并成一个，以最小化延迟（1-RTT）建立连接。如果复用连接的话，后续可以达到 0-RTT。

下图展示了 TCP + TLS 和 QUIC 建立连接的区别：


![](https://cdn.nlark.com/yuque/0/2021/gif/21929876/1624593362622-763e6933-b3ad-4748-b9c8-b69cf053dd18.gif#clientId=uaf4b4a10-7211-4&from=drop&id=u69447520&margin=%5Bobject%20Object%5D&name=v2-95f5c7e411d0b7f96d182abe284be551_hd.gif&originHeight=381&originWidth=600&originalType=binary&ratio=2&size=339780&status=done&style=none&taskId=u10b83653-597a-458e-9c30-4e5bcf35b6f)


iOS 15会默认支持 QUIC，如果你的 app 当前网络请求使用的是 URLSession，那么不需要做什么处理，如果是用的 NerWorking Framework，则需要使用下面的 API 来创建请求。


```swift
let connection = NWConnection(host: "example.com", port: 443, using: .quic(alpn: ["myproto"]));
```


更多相关介绍请参考 [Session--Accelerate networking with HTTP/3 and QUIC](https://developer.apple.com/videos/play/wwdc2021/10094/)。


#### TCP fast open


尽管QUIC适用很多场景，但是 TCP 对很多 app 还是有必要的。如果想在 TCP 下降低 RTT 次数，可以使用 TCP fast open。


TCP fast open 简称 TFO，TFO允许在TCP握手期间发送和接收初始SYN分组中的数据。如果客户端和服务器都支持TFO功能，则可以减少建立到同一服务器的多个TCP连接的延迟。这是通过在初始TCP握手之后在客户端上存储 TFO cookie 来实现的。如果客户端稍后重新连接，则此 TFO cookie将发送到服务器，从而允许连续的 TCP 握手跳过一个往返延迟，从而减少延迟。


在 2018 年的 WWDC 中，就用了 TFO 相关的 API，使用方式如下：


```swift
/*allow fast open on the connection parameters*/
parameters.allowFastOpen = true

let connection = NWConnection(to: endpoint, using: parameters)

/*call send with idempotent initial data before starting the connection*/
connection.send(content: initialData, completion: .idempotent)
connection.start(queue: myQueue)
```


如果网络请求使用的是 TLS over TCP，那么可以使用下面的方式打开 TCP fast open。


```swift
let tcpOptions = NWProtocolTCP.Options()

/* Enable fast open on TCP options*/
tcpOptions.enableFastOpen = true
```


再者，如果你的 app 网络请求时基于 sockets，可以使用下面的 API 在握手期间发送数据。


```swift
connectx(fd, ..., CONNECT_DATA_IDEMPOTENT | CONNECT_REUSE_ON_READ_WRITE, ...) // delay SYN
write(fd, ...)
```


需要注意的是，如果想要使用 TCP fast open，那么所发出的请求必须是「幂等」的。 


所谓幂等是指同样的请求被执行一次与连续执行多次的效果是一样的，服务器的状态也是一样的。换句话说就是，幂等方法不应该具有副作用（统计用途除外）。

例如，用 GET 方法请求 [https://developer.apple.com/](https://developer.apple.com/) 时，第一次请求时，如果还没有返回数据时，重新发送请求，两次可能会请求到不同的服务器，但是这两次请求的结果不会有任何差异。




![idempotent1.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593422466-edc64665-9ac1-4d39-a6fa-59b2a01acdc7.png#clientId=uaf4b4a10-7211-4&from=drop&id=uc6db5548&margin=%5Bobject%20Object%5D&name=idempotent1.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=610808&status=done&style=none&taskId=u254fd0bb-7271-4a26-b6b3-f0dbfd1d33e)


而在购买 iPhone 时，如果发生的上面相同的情况，不同的是，两次请求产生的结果是不一样的，比如会产生两次不同的交易数据等等。


![idempotent2.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593431214-c634874d-e8a7-4f9e-af47-e017e7fda7d7.png#clientId=uaf4b4a10-7211-4&from=drop&id=ubf764290&margin=%5Bobject%20Object%5D&name=idempotent2.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=543168&status=done&style=none&taskId=uc4dccbc0-2185-48a4-bdad-85be4fe9014)
#### TLS 1.3


TLS 1.3  相较于  TLS 1.2 能节省一个 RTT 时间。


考虑 TLS 1.2, 在第一个RTT需要协商算法版本等信息， 在第二个RTT才能完成对称密钥的协商。所以 TLS 1.3 的优化点在于正在第一个 RTT 就完成密钥的协商。由于内容较多，本文不再具体阐述，如有兴趣可以查看[这里](https://tools.ietf.org/id/draft-ietf-tls-tls13-23.html#rfc.section.1.3)。


综上，使用上述技术，带来的收益如下图：


![eliminate round trip times.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593463017-b3c5c231-e219-494a-b03f-89141e499007.png#clientId=uaf4b4a10-7211-4&from=drop&id=u6bf53921&margin=%5Bobject%20Object%5D&name=eliminate%20round%20trip%20times.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=268913&status=done&style=none&taskId=u2587277c-01d8-43cf-a764-ff654fc7467)


其中 TLS 1.3 over TCP Fast Open 和 HTTP3/QUIC 效果最明显，相比 TLS 1.2 over TCP 可以节省一半以上的 RTT 次数。


## 减少单次 Round Trip Time


上面讨论的都是如何降低 RTT 次数，Apple 针对 单次的 Round Trip Time 时间也做了优化。


我们知道影响 Round Trip Time 的一个因素是新津县处的串行队列中等待发送的数据包过多，导致延迟。所以此次 Apple 的优化思路是，对网络请求进行分类，把优先级不高的请求标记位 background，并优化算法。


优化前的网络请求可能是这样的


![downloading resources@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593484664-de7caa2b-a90a-4fd6-a133-385000f9e728.png#clientId=uaf4b4a10-7211-4&from=drop&id=ud47e80e3&margin=%5Bobject%20Object%5D&name=downloading%20resources%402x.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=335611&status=done&style=none&taskId=ud94f3314-8ef2-4f0e-b697-09374e7c3b7)


通过优化拥塞控制算法，iOS 15 只针对上传和下载请求，做了较大的优化。新的算法不仅能降低延迟，还能保证其他被标记为 background 请求的发送时效。


![downloadingresources3.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593496932-f5138874-ebe0-4eff-9a50-ba149dd6bb9d.png#clientId=uaf4b4a10-7211-4&from=drop&id=ua5160384&margin=%5Bobject%20Object%5D&name=downloadingresources3.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=483904&status=done&style=none&taskId=uf8d23af5-ee12-4d2d-ad8a-fff6676eaa7)


可以使用下面的 API 来将请求降低优先级：


```swift
/* for URLSession */
var request = URLSession(url: myurl)
request.networkServiceType = .background

/* for network */
let parameters = NWParameters.tls
parameters.serviceClass = .background
```


此外，如果要发出的请求时长时间的或者大数据量的，推荐使用如下方式：


```swift
lazy var urlSession: URLSession = {
    let configuration = URLSessionConfiguration.backgroud(withIdentifier: "MySession")
    configuration.isDiscretionary = true
    return URLSession(configuration: configuration, delegate: self, delegateQuene: nil)
}()
```


通过上述方式，即使 app 被挂起，也可以让请求一直在后台运行。如果请求数据时效性不高，可以将 isDiscretionary 置为 true，这样系统可以等到较理想状态再处理该请求。


## 总结


综上，个人认为，这篇 Session 带来的新知识并不多，而且目前大部分可以应用的也不多。网络适配从来都不是客户端自己的事情，涉及到服务端更换协议，可能就会是一个比较漫长的过程。本篇更像是一个科普 Session，介绍了影响网络延迟的原因，以及如何优化这些问题。虽然在应用上可能带来不了太多实用的东西，希望我们真正在用的时候，可以有一个基本的了解。
