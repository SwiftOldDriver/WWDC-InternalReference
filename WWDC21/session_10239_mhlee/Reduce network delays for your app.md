# WWDC21 10239 - Reduce network delays for your app


>内容基于 [Session 10239](https://developer.apple.com/videos/play/wwdc2021/10239) 完成。
>网络延迟是影响 App 用户体验的一个重要因素。如果用户使用一个 App 的网络请求经常延迟比较高，对用户来说意味着糟糕的使用体验；对开发者来说，则可能意味着负反馈，甚至是用户流失。
>本文主要介绍了影响网络延迟的原因及如何降低网络延迟。文中涉及了很多传输层协议相关的知识，也会对相关概念进行解释。


## 影响网络延迟的原因

我们测试网络环境最常见的手段是 `ping`。但是 `ping` 只是测试的不在使用网络时的网络环境，然而真正影响 app 的是我们正在使用 app 时的网络环境。

iOS15 系统在 Settings->Developer->NETWORKING 下新增了 `Responsiveness` 功能，此功能用于测试当前的网络环境。如下：

![WX20210620-140344@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593209998-8a99bfc2-52db-4d6f-bf7d-784d2cbd69aa.png#clientId=uaf4b4a10-7211-4&from=drop&id=u987bb79f&margin=%5Bobject%20Object%5D&name=WX20210620-140344%402x.png&originHeight=1890&originWidth=3360&originalType=binary&ratio=2&size=1300691&status=done&style=none&taskId=u61be8c5e-f485-4571-ae7c-1f071b1b3e4)

macOS 系统也提供了网络环境测试的命令行工具，目录在 `/usr/bin/networkQuality` ，但是只在新的 macOS Monterey 及以上系统才支持。

### RPM

上面的图可以看到最终的测试结果显示 Low (28 RPM)。 `RPM` 是指 `Round Trip per minute` 。这个度量单位是苹果在 WWDC21 中首次提出来的。 提出这个度量单位，是因为我们平时所说的以 ms 为单位的网络延迟，是个相对抽象的概念。与 `ping` 得到的网络延迟不同，`RPM`越高则表示网络延迟越小。

我们在用 `ping` 测试自己的网络延迟时，可能会得到一个非常低的延迟，但是当 iPhone 或 mac 在工作环境测试`RPM`时，结果可能会相当糟糕。用`ping`测试网络环境，可能`RTT(round trip time)`只有 20ms，但是当在使用环境下测试时，`RTT` 甚至能达到 600ms， 实际使用时的情况差了 30 倍。
所以 `RPM` 是一个可以反映用户使用体验的度量单位。

### 什么是 Round Trip Time

`Round Trip Time(RTT)` 或 `Round Trip Delay(RTD)` 是指来回通信延迟，即在通信、电脑网络领域中，意指：在双方通信中，发讯方的信号传播到收讯方的时间，加上收讯方回传消息到发讯方的时间。我们使用 `ping` 命令获取网络延迟得到的 ms 为单位的值，就是 `RTT`。

### Bufferbloat

Session 里以视频会议为例，我们在使用在线视频或音频时，其实 Mb/s 的速度已经足够满足我们的实时通话需求，尽管近年来我们的网络带宽从 Mb/s 提高到了 Gb/s 级别，但是我们仍然会遇到视频音频卡顿、延迟情况。这是因为高吞吐量并不代表低延迟，现在我们通常说的网速其实是指「容量」而非「速度」。那为什么仍然会有这种问题？我们先来了解一个概念：`Bufferbloat`。

表面上客户端和服务端收发数据包时是这样的：

![transports1@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593290923-2c701538-f699-4159-9ea0-d99ff10a75fc.png#clientId=uaf4b4a10-7211-4&from=drop&id=ud76d50a4&margin=%5Bobject%20Object%5D&name=transports1%402x.png&originHeight=552&originWidth=2138&originalType=binary&ratio=2&size=105060&status=done&style=none&taskId=u8b440196-a733-49ec-9df8-8634823032d)

但是实际情况可能是下图这样：

![transport2@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593301501-ddedaa70-30e3-477d-8d00-83acbe46038f.png#clientId=uaf4b4a10-7211-4&from=drop&id=u222c0a00&margin=%5Bobject%20Object%5D&name=transport2%402x.png&originHeight=554&originWidth=2160&originalType=binary&ratio=2&size=127933&status=done&style=none&taskId=u7d38632f-09fb-4737-b4ab-bd88a11e293)

通信设备往往设置了缓冲区，在先进先出队列系统中，过大的缓冲区会导致更长的队列和更高的延迟，并且不会提高网络吞吐量。当网络拥塞时，就会发生缓冲膨胀现象，即 `Bufferbloat`。
`Bufferbloat`是影响网络延迟的一个重要因素，但是并不是唯一因素。影响网络延迟的因素如下：


<div align=center>
<img src="https://cdn.nlark.com/yuque/0/2021/png/21929876/1624607238217-b3e110a3-9ef6-4de5-a2eb-a9bd20ecdfe7.png?x-oss-process=image%2Fresize%2Cw_752"/>
</div>
<br>

1. 软硬件处理时间：随着 CPU 性能的提升，会降低请求处理时间。
2. 数据传输时间：带宽的提升可以降低数据传输时间。
3. 缓冲延迟：如前面提到的 `bufferbloat` ，已经有前人提出了 [CoDel](https://zh.wikipedia.org/wiki/CoDel) 等算法来解决这一问题。
4. 光速限制延迟：这个时间受传播媒介限制，早在20世纪90年代，斯坦福到麻省理工的 ping time 就已经在 100ms 以下了，这个时间和光速在两地传播的时间相比就已经很接近了，所以以后也不会有太多改善空间。

综上，上述因素我们似乎没有什么手段从客户端进行干预。所以接下来我们从降低 `RTT` 次数入手。

`一次网络请求的时间` = `Round trip time` × `Number of round trips`

对于一个 app 开发者来说，我们并没有太多手段来降低 `RTT` 时间，但是我们可以降低请求过程中 `RTT` 的次数。
<br>

## 降低 RTT 次数

采用一些新技术，可以降低 `RTT` 次数。当然，首先要注意的是，要想使用这些技术 ，需要服务器支持这些协议的。

下面介绍下几种新技术是如何降低 `RTT`，并介绍在 iOS 层面如何使用。

### HTTP/3 over QUIC

`QUIC` 是新一代的传输协议，基于 `UDP` 协议，降低 `RTT` 主要是通过减少握手次数。

我们知道 `TCP` 建立连接需要 3 次握手，这需要 `1.5-RTT`，如果再加上 `TLS` 的握手时间，总共需要 `3-RTT` 。`QUIC` 把传输和加密握手合并成一个，以最小化延迟（1-RTT）建立连接。如果复用连接的话，后续可以达到 `0-RTT` 。

下图展示了 `TCP + TLS` 和 `QUIC` 建立连接的区别：


<div align=center>
<img src="https://cdn.nlark.com/yuque/0/2021/gif/21929876/1624593362622-763e6933-b3ad-4748-b9c8-b69cf053dd18.gif#clientId=uaf4b4a10-7211-4&from=drop&id=u69447520&margin=%5Bobject%20Object%5D&name=v2-95f5c7e411d0b7f96d182abe284be551_hd.gif&originHeight=381&originWidth=600&originalType=binary&ratio=2&size=339780&status=done&style=none&taskId=u10b83653-597a-458e-9c30-4e5bcf35b6f"/>
</div>
<br>

`QUIC` 建立连接的过程如下：
1.当客户端首次发起 `QUIC` 连接时，客户端向服务器发送一个 `client hello` 消息，服务器回复一个 `server reject` 消息。该消息中有包括 `server config` ，类似于 `TLS1.3` 中的 `key_share` 交换。这需要产生 `1-RTT`. 事实上，`QUIC` 加密协议的作者也明确指出当前的 `QUIC` 加密协议是「注定要死掉的」(destined to die), 未来将会被 `TLS1.3` 代替。只是在 `QUIC` 提出来的时候，`TLS1.3` 还没出生，这只是一个临时的加密方案。
2.当客户端获取到 `server config` 以后，就可以直接计算出密钥，发送应用数据了，可以认为是 `0-RTT`。

因此，`QUIC` 握手除去首次连接需要产生 `1-RTT`，理论上，后续握手都是 `0-RTT`的。
假设 1-RTT = 100ms, `QUIC` 建立安全连接连接的握手开销为 0ms, 功能上等价于 `TCP+TLS` , 但是握手开销比建立普通的 `TCP` 连接延迟都低。

iOS 15 会默认支持 `QUIC`，如果你的 app 当前网络请求使用的是 `URLSession`，那么不需要做额外处理，只需要确认服务端支持 `QUIC` 即可。如果使用的是 `NerWorking Framework`，则需要使用下面的 API 来创建请求。

```swift
let connection = NWConnection(host: "example.com", port: 443, using: .quic(alpn: ["myproto"]));
```

更多相关使用介绍请参考 [WWDC21-Session--Accelerate networking with HTTP/3 and QUIC](https://developer.apple.com/videos/play/wwdc2021/10094/)。

### TCP fast open

如果想在 `TCP` 场景下下降低 `RTT` 次数，可以使用 `TCP fast open`。

`TCP fast open` 简称 `TFO`，`TFO` 允许在 `TCP` 握手期间发送和接收初始 `SYN` 分组中的数据。如果客户端和服务器都支持 `TFO` 功能，则可以减少建立到同一服务器的多个 `TCP` 连接的延迟。这是通过在初始 `TCP` 握手之后在客户端上存储 `TFO cookie` 来实现的。如果客户端稍后重新连接，则此 `TFO cookie` 将发送到服务器，从而允许连续的 `TCP` 握手跳过一个往返延迟，从而减少延迟。

`TFO` 握手过程和普通 `TCP` 握手过程区别如下：


<div align=center>
<img src="https://cdn.nlark.com/yuque/0/2021/png/21929876/1624782447120-d0c1ee69-830f-4747-ac65-184ba9eb4129.png?x-oss-process=image%2Fresize%2Cw_1496"/>
</div>
<br>


在 iOS12 中，就已经提供了 `TFO` 相关的 `API`，使用方式如下：

```swift
/*allow fast open on the connection parameters*/
parameters.allowFastOpen = true

let connection = NWConnection(to: endpoint, using: parameters)

/*call send with idempotent initial data before starting the connection*/
connection.send(content: initialData, completion: .idempotent)
connection.start(queue: myQueue)
```

如果网络请求使用的是 `TLS over TCP`，那么可以使用下面的方式打开 `TCP fast open`。

```swift
let tcpOptions = NWProtocolTCP.Options()

/* Enable fast open on TCP options*/
tcpOptions.enableFastOpen = true
```

再者，如果你的 app 网络请求是基于 `sockets` 的，可以使用下面的 API 在握手期间发送数据。

```swift
connectx(fd, ..., CONNECT_DATA_IDEMPOTENT | CONNECT_REUSE_ON_READ_WRITE, ...) // delay SYN
write(fd, ...)
```

需要额外注意的是，如果想要使用 `TCP fast open`，那么所发出的请求必须是「幂等」的。 

所谓幂等是指同样的请求被执行一次与连续执行多次的效果是一样的，服务器的状态也是一样的。换句话说就是，幂等方法不应该具有副作用（统计用途除外）。

例如，用 `GET` 方法请求 [https://developer.apple.com/](https://developer.apple.com/) 时，第一次请求时，如果还没有返回数据时，重新发送请求，两次可能会请求到不同的服务器，但是这两次请求的结果不会有任何差异。


![idempotent1.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593422466-edc64665-9ac1-4d39-a6fa-59b2a01acdc7.png#clientId=uaf4b4a10-7211-4&from=drop&id=uc6db5548&margin=%5Bobject%20Object%5D&name=idempotent1.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=610808&status=done&style=none&taskId=u254fd0bb-7271-4a26-b6b3-f0dbfd1d33e)

而在购买 iPhone 时，如果发生的上面相同的情况，不同的是，两次请求产生的结果是不一样的，比如会产生两次不同的交易数据等等。

![idempotent2.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593431214-c634874d-e8a7-4f9e-af47-e017e7fda7d7.png#clientId=uaf4b4a10-7211-4&from=drop&id=ubf764290&margin=%5Bobject%20Object%5D&name=idempotent2.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=543168&status=done&style=none&taskId=uc4dccbc0-2185-48a4-bdad-85be4fe9014)


### TLS1.3

传输层安全性协议（Transport Layer Security）及其前身安全套接层（英语：Secure Sockets Layer，缩写：SSL）是一种安全协议。目的是为互联网通信提供安全及数据完整性保障。
`TLS1.2` 完成 `TLS` 密钥协商需要 2个 `RTT` 时间，`TLS1.3` 只需要1个 `RTT时间`。如果考虑重用的话，`TLS1.2 session` 重用需要1个 `RTT` 时间，`TLS1.3` 则因为在第一个包中携带数据，只需要0个 `RTT`。

`TLS1.2` 的握手过程和 `TLS1.3` 的过程区别如下：

<div align=center>
<img src="https://cdn.nlark.com/yuque/0/2021/png/21929876/1624683937891-8a8c9ca4-d01b-49b9-b355-a55d14326d8f.png?x-oss-process=image%2Fresize%2Cw_748"/>
</div>
<br>


`TLS1.2` 握手流程：

```shell
	Client                                       Server
ClientHello                  -------->
                                              ServerHello
                                             Certificate*
                                       ServerKeyExchange*
                                      CertificateRequest*
                           <--------      ServerHelloDone
Certificate*
ClientKeyExchange
CertificateVerify*
[ChangeCipherSpec]
Finished                     -------->
                                       [ChangeCipherSpec]
                           <--------             Finished
Application Data             <------->     Application Data

```

`TLS 1.3` 握手流程：

```shell
       Client                                               Server
Key  ^ ClientHello
Exch | + key_share*
     | + signature_algorithms*
     | + psk_key_exchange_modes*
     v + pre_shared_key*         -------->
                                                       ServerHello  ^ Key
                                                      + key_share*  | Exch
                                                 + pre_shared_key*  v
                                             {EncryptedExtensions}  ^  Server
                                             {CertificateRequest*}  v  Params
                                                    {Certificate*}  ^
                                              {CertificateVerify*}  | Auth
                                                        {Finished}  v
                                 <--------     [Application Data*]
     ^ {Certificate*}
Auth | {CertificateVerify*}
     v {Finished}                -------->
       [Application Data]        <------->      [Application Data]
              +  Indicates noteworthy extensions sent in the
                 previously noted message.
              *  Indicates optional or situation-dependent
                 messages/extensions that are not always sent.
              {} Indicates messages protected using keys
                 derived from a [sender]_handshake_traffic_secret.
              [] Indicates messages protected using keys
                 derived from [sender]_application_traffic_secret_N
```

可以看到在 `TLS1.2` 中，在第一个 `RTT` 需要协商算法版本等信息， 在第二个 `RTT` 才能完成对称密钥的协商。`TLS 1.3` 的区别在于，它在第一次 `RTT` 就进行了秘钥协商，`TLS1.2` 需要在双方明文交换了 `key exchange` 信息之后才会走加密通道，而 `TLS1.3` 在 `sever` 端发送完 `ServerHello` 信息之后就会走加密通道。基于此，`TLS 1.3 `能比 `TLS 1.2` 节省一个 `RTT` 时间。

综上，使用上述技术，带来的收益如下：

![eliminate round trip times.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593463017-b3c5c231-e219-494a-b03f-89141e499007.png#clientId=uaf4b4a10-7211-4&from=drop&id=u6bf53921&margin=%5Bobject%20Object%5D&name=eliminate%20round%20trip%20times.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=268913&status=done&style=none&taskId=u2587277c-01d8-43cf-a764-ff654fc7467)


其中 `TLS 1.3 over TCP Fast Open` 和 `HTTP3/QUIC` 效果最明显，相比 `TLS 1.2 over TCP` 可以节省一半以上的 `RTT` 次数。
<br>


## 减少单次 Round Trip Time

上面讨论的都是如何降低 `RTT` 次数，Apple 针对单次的 `RTT` 时间也做了优化。

我们知道影响 `RTT` 的一个因素是先进先出的串行队列中等待发送的数据包过多，导致延迟。所以此次 Apple 的优化思路是，对网络请求进行分类，把优先级不高的请求标记位 `background`，并优化算法。

优化前的网络请求可能是这样的：

![downloading resources@2x.png](https://cdn.nlark.com/yuque/0/2021/png/21929876/1624593484664-de7caa2b-a90a-4fd6-a133-385000f9e728.png#clientId=uaf4b4a10-7211-4&from=drop&id=ud47e80e3&margin=%5Bobject%20Object%5D&name=downloading%20resources%402x.png&originHeight=1546&originWidth=2748&originalType=binary&ratio=2&size=335611&status=done&style=none&taskId=ud94f3314-8ef2-4f0e-b697-09374e7c3b7)

Apple 通过优化拥塞控制算法，在 iOS15 上针对上传和下载请求，做了较大的优化。新的算法不仅能降低延迟，还能保证其他被标记为 `background` 请求的发送时效。
优化后的网络请求如下：

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

通过上述方式，即使 app 被挂起，也可以让请求一直在后台运行。如果请求数据时效性不高，可以将 `isDiscretionary` 置为 `true`，这样系统可以等到较理想状态再处理该请求。

## 总结

以上，这篇 Session 带来的新知识并不多，而且从目前 `HTTP3/QUIC` 等技术普及的情况来看，大部分可以实际应用的也不多。网络优化从来都不是客户端自己的事情，如果再涉及到服务端更换协议，可能就会是一个比较漫长的过程。文中介绍的传输层协议，主要是针对降低 `RTT` 次数来介绍，去年的 [WWDC20 10111 - 探索现代的移动网络](https://xiaozhuanlan.com/topic/5437168290#sectiontls13)中已经对这些技术做了详细的介绍，感兴趣可查阅。
