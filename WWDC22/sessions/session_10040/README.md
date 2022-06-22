---
session_ids: [10040]
---

# WWDC22 10040 - 探索 In-App Purchase 集成和迁移

> 作者：iHTCboy，目前就职于三七互娱37手游，从事游戏 SDK 开发多年，对 IAP 和 SDK 架构设计有丰富的实践经验。
>
> 审核：黄骋志，目前就职于字节跳动西瓜视频，负责基础技术相关工作，协助复杂业务进行重构。曾参与长视频支付相关工作。

基于 [Session 10114](https://developer.apple.com/videos/play/wwdc2022/10040/) 梳理

## 前言

![WWDC22_session_10040_0](images/WWDC22_session_10040_0.png)

去年 WWDC21 苹果推出了 StoreKit v2、App Store Server API v1 和 App Store Server Notifications v2，今年 WWDC22 基于这些功能的基础上，增加了一些新的 API 和一些服务的优化。另外，针对大家对这些新特性有一些疑虑，如 JWT/JWS、兼容性、安全性、订阅通知、集成和迁移等等，苹果进行了详细解答和提供了最佳实践的建议。

![WWDC22_session_10040_1](images/WWDC22_session_10040_1.png)

**App Store Server API** 是苹果 WWDC21 推出的 API，它是一种强大、安全和高效的 Server to Server API，提供获取数据和执行操作的服务。

**App Store Server Notifications** 今年将提供更加实时的通知，开发者可以掌握更多生命周期里的通知状态。

所以，本文分成2个部分，分别是 App Store Server API 和 App Store Server Notifications，并结合去年和今年推出的新特性，进行深入浅出的探索。如果大家对于去年 WWDC21 相关的主题内容不太熟悉的话，可以先阅读我们去年的文章：

- [初见 StoreKit 2](https://mp.weixin.qq.com/s/arA0_uyc4CWMQ7WJ2RanJA)
- [IAP 后台通信优化与实践](https://mp.weixin.qq.com/s/dWsRKRJsYMRl0GX_36T-kg)
- [IAP 用户退款与客诉处理优化](https://mp.weixin.qq.com/s/MtytymgkcP3_oAH7JyI1og)


## App Store Server API

首先，我们先来看看 App Store Server API 的变化，接下来会从以下四个方面展开：

![WWDC22_session_10040_2](images/WWDC22_session_10040_2.png)

- App Store Server API 的使用
- 探讨 JWT(JSON Web Tokens) 签名细节
- 校验签名的 transactions（交易）
- 从 StoreKit 的 verifyReceipt 迁移到 App Store Server API

### App Store Server API 的使用
 
苹果去年 WWDC21 推出了 App Store Server API，其中有 5 个 API 是通过 `originalTransactionId` 作为查询的参数，这个参数可以通过 receipts（票据）、signed transactions（签名的交易）、signed renewals（签名的续订信息）和 notifications（通知）等获取。

![WWDC22_session_10040_3](images/WWDC22_session_10040_3.png)

> 关于接口的用法，可以参考我们之前的文章：[IAP 用户退款与客诉处理优化](https://mp.weixin.qq.com/s/MtytymgkcP3_oAH7JyI1og)。


去年还有一个 `lookup` API，这个接口根据用户提供的 `orderId` 来查询用户的每笔支付的交易订单信息，从而让开发者更好地帮助用户解决问题，比如用户反馈充值成功但没有收到金币，这时候让用户提供苹果收据订单 `orderId`，开发者就能查到用户订单对应的 `originalTransactionId` 交易标识，这样就能解决以前无法根据用户订单号的找到开发者订单号的问题。

另外，今天新增了三个关于服务端通知的 API，这部分内容在本文的后面会介绍，这里先略过。

![WWDC22_session_10040_4](images/WWDC22_session_10040_4.png)

接下来讲解 App Store Server API 如何与开发者的服务器交互，正好前面说的，API 需要 `originalTransactionId` 作为查询的参数，那么这个参数具体可以怎么样，我们先来看 Original StoreKit 从哪里获取。（注：Original StoreKit 是苹果用于区分 StoreKit 2，下文我们统一用 StoreKit v1 来表示）

调用苹果的 `verifyReceipt` API 验证 receipt data 时，苹果服务端返回的数据中的 in_app 、latest_receipt_info 和 pending_renewal_info 字段都包含 `originalTransactionId` 参数。
![WWDC22_session_10040_5](images/WWDC22_session_10040_5.png)

那么 StoreKit v1 怎么使用 App Store Server API，流程还是一样，app 里根据用户充值的 receipt 发给开发者服务器后，通过 `verifyReceipt` API 获取解码后的数据，然后通过 `originalTransactionId` 参数就可以调用 App Store Server API。对于原来的流程并没有影响，开发者可以通过 API 获取这个用户的交易或订阅信息，包括订阅续订信息等。
![WWDC22_session_10040_6](images/WWDC22_session_10040_6.png)

StoreKit v2 获取 `originalTransactionId` 通过新 API `transaction.originalID` 获取，但只支持 iOS 15 或更高的系统版本。
![WWDC22_session_10040_7](images/WWDC22_session_10040_7.png)

也可能通过服务端获取，例如签名的 JWS transaction、App Store Server API 和 App Store Server Notifications 等获取。
![WWDC22_session_10040_8](images/WWDC22_session_10040_8.png)

StoreKit v2 使用 App Store Server API 也很简单，直接调用接口就可以，与 StoreKit v1 一样不影响原有的票据验证流程。
![WWDC22_session_10040_9](images/WWDC22_session_10040_9.png)


最后，我们总结一下，如何在 StoreKit v1 和 StoreKit v2 中使用 App Store Server API。首先 App Store Server API 支持 StoreKit v1 和 v2 版本，并且不依赖其它的接口，只需要 `originalTransactionId` 参数，这个参数在 StoreKit v1 的 receipts 中获取，在 StoreKit v2 中的 transactions 中获取，就是这么简单。
![WWDC22_session_10040_10](images/WWDC22_session_10040_10.png)

以上就是将 App Store Server API 与 Original StoreKit 和 StoreKit 2 一起结合使用的案例。这里还是重点提示一下，StoreKit v1 的开发者服务器，以前从票据（receipt）中解析到 `latest_receipt`，现在可以通过 `originalTransactionId` 请求 `Get All Subscription Statuses` API 获取相应订阅的最新状态，这样的方法相比以前通过客户端刷新或者苹果服务器推送通知的方式，更加灵活和高效。
![WWDC22_session_10040_11](images/WWDC22_session_10040_11.png)

### 探讨 JWT(JSON Web Tokens) 签名细节

接下来我们讲解 JWT(JSON Web Tokens) 的一些细节，JWT 是调用 App Store Server API 必须生成的签名参数。

![WWDC22_session_10040_12](images/WWDC22_session_10040_12.png)

- 调用 App Store Server API 时必须验证你的合法身份，通过 JWT 来验证
- 每次请求 API 需要包含这个 JWT 的请求头信息
- JWT 由 header（签名头）、payload（有效负载）和 signature（签名）组成

![WWDC22_session_10040_13](images/WWDC22_session_10040_13.png)
具体来说，JWT 签名分为三个部分，用句点分隔，Base64 编码的 header（签名头）、 Base64 编码的 payload（有效负载）和 signature（签名）组成，最后的签名部分，根据 header 定义的签名算法和类型进行签名。

具体 JWT 字段的含义：

| 字段 | 含义 | 字段值说明 |
|---|:--|---|
| alg | Encryption Algorithm，加密算法 | 默认值：ES256。App Store Server API 的所有 JWT 都必须使用 ES256 加密进行签名。 |
| kid | Key ID，密钥ID | 您的私钥ID，值来自 App Store Connect 的内购密钥页面。 |
| type | Token Type，令牌类型 | 默认值：JWT |
| iss | Issuer，发行人 | 您的发卡机构ID，值来自 App Store Connect 的 API 密钥页面。 |
| iat | Issued At，发布时间 | 秒，以 UNIX 时间（例如：1623085200）发布令牌的时间 |
| exp | Expiration Time，到期时间 | 秒，令牌的到期时间，以 UNIX 时间为单位。在iat中超过 60 分钟过期的令牌无效（例如：1623086400） |
| aud | Audience，受众 | 固定值：appstoreconnect-v1 |
| bid | Bundle ID，套装ID | 您的 app 的套装ID，即 app 包名 |

![WWDC22_session_10040_14](images/WWDC22_session_10040_14.png)

生成 JWT 还需要一个密钥文件，可以参考苹果文档 [Creating API Keys to Use With the App Store Server API](https://developer.apple.com/documentation/appstoreserverapi/creating_api_keys_to_use_with_the_app_store_server_api)。一般生成 JWT token 我们会通过第三方库来生成，可以参考 [JSON Web Token Libraries](https://jwt.io/libraries)。具体请求可参考上图的 `curl` 命令示例，替换 `${token}` 和 `${originalTransactionId}` 就可以。

关于 API 请求的细节，可以参考苹果文档 [Generating Tokens for API Requests](https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests)，或这篇实践教程 [App Store Server API 实践总结](https://juejin.cn/post/7056976669139009573)。


### 校验签名的 transactions（交易票据）

去年推出的 StoreKit v2 交易的票据（receipt）使用 JWS(JSON Web Signature) 格式签名。
JWS 与前面的 JWT 有什么不同？JWT 是一个开放式标准（规范文件 [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)），用于网络主机之间以 JSON 对象安全传输信息。而 JWS 是其中的一种实现规范（规范文件 [RFC 7515](https://datatracker.ietf.org/doc/html/rfc7515)），表示签名过的 JWT。也就是说，可以通过 JWS 验证信息是否被篡改，用于验证内容的真实性。

![WWDC22_session_10040_15](images/WWDC22_session_10040_15.png)

接下来讲解，如何验证 StoreKit v2 已签名的交易票据（transactions），验证步骤分为以下三步：

![WWDC22_session_10040_16](images/WWDC22_session_10040_16.png)

- 具体 JWT 的格式，先用 Base64 解码 header 获取签名信息
- 使用 header 解码中的 `alg` 字段确定使用的签名算法 
- 验证 header 解码中的 `x5c` 确认签名的证书链

![WWDC22_session_10040_18](images/WWDC22_session_10040_18.png)

`x5c`表示 X509 证书链，X.509 是一种证书标准，主要定义了证书中应该包含哪些内容。其详情可以参考 [RFC5280](https://datatracker.ietf.org/doc/html/rfc5280)，SSL 使用的就是这种证书标准。同样的 X.509 证书，可能有不同的编码格式，目前有以下两种编码格式：

* DER：Distinguished Encoding Rules，打开看是二进制格式，不可读.
* PEM：Privacy Enhanced Mail，打开看文本格式，以”—–BEGIN…”开头，”—–END…”结尾,内容是BASE64编码。

那么 x5c 证书链成功验证，就表示这个签名的 JWS 是可信的，所以，x5c 证书链的规范如下：

![WWDC22_session_10040_17](images/WWDC22_session_10040_17.png)

- 每个证书都由前一个证书签名
- 最开头的证书是根证书，是苹果的证书 [Apple Root CA - G3 Root](https://www.apple.com/certificateauthority/AppleRootCA-G3.cer)
- 最后一个证书叫叶证书，用于签名 JWS 


所以，x5c 证书链的生成，简单来说，苹果的根证书（只能从苹果下载，相当于信任）签名包含了中间的证书，中间的证书签名包含了叶证书，而叶证书就是签名 JWS 内容的证书。证书链签名规则如下：
![WWDC22_session_10040_19](images/WWDC22_session_10040_19.png)

所以验证 x5c 证书链，就是反过来，我们验证叶证书是由中间签名证书签名的，然后确保中间签名证书是由根证书签名的，最后，根证书与 Apple 证书颁发机构提供的证书相匹配。如果这些步骤都验证成功，则整个 x5c 链验证就可以认为是合法的证书链。如果有证书不匹配，则不应该信任该链。
![WWDC22_session_10040_20](images/WWDC22_session_10040_20.png)

原理讲清楚后，那么我们应该怎么验证证书链呢？最简单的方法是使用 OpenSSL 命令验证 x5c 证书链。具体命令的参数 `-trusted` 带上信任的根证书，这里是苹果的 [Apple Root CA - G3 Root](https://www.apple.com/certificateauthority/AppleRootCA-G3.cer)，可以在苹果网站下载 [Apple PKI](https://www.apple.com/certificateauthority/) 证书。参数 `-untrusted` 就是中间证书和叶证书。

执行这个 `openssl verify -trusted xxx.pem -untrusted xxx.pem leaf.pem` 后，根据返回的结果码判断，如果表示验证不成功，则此 JWS 数据可能被篡改且不应使用。

![WWDC22_session_10040_21](images/WWDC22_session_10040_21.png)

> 注：苹果网站下载的 AppleRootCA-G3 是 `.cer` 格式，需要把 .cer 转换成 .pem 格式，转换命令： `openssl x509 -inform der -in AppleRootCA-G3.cer -out AppleRootCA-G3.pem`


验证了 x5c 证书链，还要用叶证书，验证一下 JWS 签名内容是否正确，到此签名成功后，就表示 JWS 内容可信。示例代码如下：
![WWDC22_session_10040_22](images/WWDC22_session_10040_22.png)

> 关于验证 JWS 的第三方库，可以参考 jwt.io [JSON Web Token Libraries](https://jwt.io/libraries)。


### 从 StoreKit 的 verifyReceipt 迁移到 App Store Server API

接下来，我们回顾一下，从 StoreKit v1 的 verifyReceipt 接口迁移到 App Store Server API 的使用案例。

![WWDC22_session_10040_23](images/WWDC22_session_10040_23.png)
- 检查订阅状态的变化
- StoreKit v1：调用 verifyReceipt 接口，根据 latest_receipt 字段判断状态
- StoreKit v2：调用 Get Subscription Status 接口查询

所以，获取订阅品项的最新状态的交互流程如图：
![WWDC22_session_10040_24](images/WWDC22_session_10040_24.png)

通过 App Store Server API 的`/inApps/v1/subscriptions/{originalTransactionId}` 接口获取订阅品项的最新状态，包含最新的签名交易票据和续订更新信息等。

接下来，我们来看获取最新交易状态的案例。获取最新交易票据，可以知道用户购买了什么品项、订阅了什么品项，或者续订了什么品项等。
![WWDC22_session_10040_25](images/WWDC22_session_10040_25.png)

对于用户来说，交易票据的状态获取有二种情况：

- StoreKit v1：通过 verifyReceipt 接口返回的 `in_app` 和 `latest_receipt_info` 获取
- StoreKit v2：通过 App Store Server API 的 `Get transaction History` 接口条件过滤获取


所以，获取最新交易票据状态的交互流程如图：
![WWDC22_session_10040_26](images/WWDC22_session_10040_26.png)

最后，我们来说一下 `appAccountToken` 的使用示例。`appAccountToken` 字段是 StoreKit v2 交易票据提供的开发者 app 与用户绑定关联的 UUID。在已签名的交易票据、已签名的续订和该交易的苹果服务器通知中都会包含。

以前的 StoreKit v1 是不支持 appAccountToken 字段，因为它是 StoreKit2 的新功能。而现在，苹果增加了对 StoreKit v1 中的 `applicationUsername` 字段中提供 UUID 支持，从而让服务端不需要区分 StoreKit v1 还是 v2，都可以支持 appAccountToken 所做的逻辑功能。

![WWDC22_session_10040_27](images/WWDC22_session_10040_27.png)

以上就是本次 session 关于 App Store Server API 部分的更新。

接下来，我们讲解 App Store Server Notifications 内容的更新。

## App Store Server Notifications

关于 App Store Server Notifications 的内容，将从以下四方面进行讲解：

- 配置 Server Notifications
- 迁移到 Server Notifications v2
- 恢复 Server Notifications
- 通过 Server Notifications 获得洞察力

![WWDC22_session_10040_28](images/WWDC22_session_10040_28.png)

首先，App Store Server Notifications 兼容 StoreKit v1，并且全面支持应用内购买数据。详细的更新内容，可以参考我们之前的文章：[IAP 后台通信优化与实践](https://mp.weixin.qq.com/s/dWsRKRJsYMRl0GX_36T-kg)。

![WWDC22_session_10040_29](images/WWDC22_session_10040_29.png)

### 配置 Server Notifications

如何配置 App Store Server Notifications 来接收通知，可以在 App Store Connect 中的应用页面，看到配置的部分：
![WWDC22_session_10040_30](images/WWDC22_session_10040_30.png)

可以分别配置生产和沙盒环境的回调通知链接，然后每个链接的配置，可以设置 v1 或 v2 版本的通知。
![WWDC22_session_10040_31](images/WWDC22_session_10040_31.png)
> 这里建议如果开发者现在使用的是 v1 版本的通知，迁移到 v2 版本前，先配置一个沙盒环境的 v2 链接进行测试，测试通过后，再切换到生产环境的 v2 版本。


接口通知的链接，需要注意服务器配置：
![WWDC22_session_10040_32](images/WWDC22_session_10040_32.png)

- 有效的 HTTPS 证书
- 允许 Apple 的公共 IP 段（17.0.0.0/8）访问您的服务器
- 使用 Test Notification API 来测试通知接口（测试接口，下文会讲到）


App Store Server Notifications v2 版本通知的内容是 JWS 格式，所以需要验证签名：
![WWDC22_session_10040_33](images/WWDC22_session_10040_33.png)

签名证书验证通过后，可以读取 payload 的内容：
![WWDC22_session_10040_34](images/WWDC22_session_10040_34.png)

这个内容字段，需要开发者注意一下，`notificationUUID` 字段是每个通知的唯一标识符，如果服务器重试通知，则重试通知包含相同的 notificationUUID，有助于开发者服务器处理了通知但没有及时响应时接到到重复通知内容的情况。`signedDate` 字段是每个通知的创建时间，这对于检测重试通知也特别有用，具体作用下文会讲解。`appAppleId` 和 `bundleId` 可以用于验证 app 是否为开发者的。

### 迁移到 Server Notifications v2

Server Notifications v1 版本虽然现在还可以使用，但是苹果强烈建议开发者升级迁移到 Server Notifications v2，因为 v2 版本增加了更多的状态通过，并且是支持 StoreKit v1 版本，完成是兼容性迁移，不会很麻烦，收益也更好。

![WWDC22_session_10040_35](images/WWDC22_session_10040_35.png)

Server Notifications v2 增加了新的类型和添加新的子类型字段，从而提高所提供的通知场景更加详细并扩展更多的情景，以下这个示例就订阅品项的生命周期的每一步提供通知：

![WWDC22_session_10040_36](images/WWDC22_session_10040_36.png)


### 恢复 Server Notifications

![WWDC22_session_10040_37](images/WWDC22_session_10040_37.png)


![WWDC22_session_10040_38](images/WWDC22_session_10040_38.png)


![WWDC22_session_10040_39](images/WWDC22_session_10040_39.png)

![WWDC22_session_10040_40](images/WWDC22_session_10040_40.png)

![WWDC22_session_10040_41](images/WWDC22_session_10040_41.png)

![WWDC22_session_10040_42](images/WWDC22_session_10040_42.png)


![WWDC22_session_10040_43](images/WWDC22_session_10040_43.png)

![WWDC22_session_10040_44](images/WWDC22_session_10040_44.png)


![WWDC22_session_10040_45](images/WWDC22_session_10040_45.png)


### 通过 Server Notifications 获得洞察力

![WWDC22_session_10040_46](images/WWDC22_session_10040_46.png)

### Wrap-up（小结）

![WWDC22_session_10040_47](images/WWDC22_session_10040_47.png)


## 总结


## 参考链接

- [初见 StoreKit 2](https://mp.weixin.qq.com/s/arA0_uyc4CWMQ7WJ2RanJA)
- [IAP 后台通信优化与实践](https://mp.weixin.qq.com/s/dWsRKRJsYMRl0GX_36T-kg)
- [IAP 用户退款与客诉处理优化](https://mp.weixin.qq.com/s/MtytymgkcP3_oAH7JyI1og)
- [Creating API Keys to Use With the App Store Server API | Apple Developer Documentation](https://developer.apple.com/documentation/appstoreserverapi/creating_api_keys_to_use_with_the_app_store_server_api)
- [Generating Tokens for API Requests | Apple Developer Documentation](https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests)
- [JSON Web Token Libraries - jwt.io](https://jwt.io/libraries)
- [WWDC21 - App Store Server API 实践总结](https://juejin.cn/post/7056976669139009573)
- [Apple Root CA - G3 Root](https://www.apple.com/certificateauthority/AppleRootCA-G3.cer)
- [Apple PKI - Apple](https://www.apple.com/certificateauthority/)