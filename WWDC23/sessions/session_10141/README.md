---
session_ids: [10141]
---

# WWDC23 - App Store server APIs 新特性

```
摘要：本文对 WWDC23 在 App Store Server API 提供的新特性进行梳理总结，并提供迁移到新的 App Store Server API 的升级指引，无论你是目前在使用 App Store Receipts 的 verifyReceipt 还是已经升级到 App Store Server API，相信本文都能给到你一些帮助。
```
本文基于 [Session 10141](https://developer.apple.com/videos/play/wwdc2023/10141/) 梳理

```
作者：
yt: 就职于荔枝基础研发团队，参与移动端APM、交易、增长等基础组件，内部基础平台、效能工具建设等工作；

审核：
SeaHub：目前任职于腾讯 TEG 计费平台部，负责搭建服务于腾讯系业务的支付系统，主导国内 IAP 前后端相关内容，对 IAP 整体设计有一定的经验；
```
## 前言

苹果在 WWDC21 推出了全新 StoreKit2 以及 App Store Server Notifications V2，而本次 WWDC23 苹果对 App Store Server APIs 补充了一些新特性，简化交易服务端与苹果服务端之间的流程，以及最后提及的开源库 App Store Server Library，让迁移升级工作变得更加简便；如果你还不熟悉这这两部分内容，建议先阅读近两年 WWDC IAP 的相关 Session。

![history session](<./images/2023-07-12 13.05.22-1.png>)

**WWDC21**
* [初见 StoreKit 2](https://xiaozhuanlan.com/topic/6138790425)
* [IAP 后台通信优化与实践](https://xiaozhuanlan.com/topic/3768514920)
* [IAP 用户退款与客诉处理优化](https://xiaozhuanlan.com/topic/8670251439) 

**WWDC22**
* [IAP 新特性](https://xiaozhuanlan.com/topic/3872506491)
* [Xcode StoreKit 测试的新功能](https://xiaozhuanlan.com/topic/5842093617)
* [探索 In-App Purchase 集成和迁移](https://xiaozhuanlan.com/topic/8024563197)

## App Store Server API 新特性
### 回顾 App Store Server API

**App Store Server API**  
与苹果在客户端上提供的 StoreKit 对应，服务端的 App Store Server API 提供各种接口让我们可以主动从苹果获取需要的信息甚至修改 IAP 购买数据；   
`Get Transaction History`、`Get All Subscription Statuses` API 在交易确认、订阅等场景下尤其重要，即使目前使用起来也有一些问题，但苹果在本次 WWDC 也针对性的提供了新特性解决这些问题点，后文会提到。  
而 `Look Up Order ID` API 在推出后对线上补单提供巨大的帮助，特别是处理一些线上旧版本存留用户的问题。
![App Store Server API](<./images/2023-07-08 22.38.19-1.png>)

**App Store Server Notifications V2**  
苹果提供的另一个主要 API 是 `App Store Server Notifications V2`，App Store 服务器会主动向我们后台发送所有在我们 App 中的购买更新，涵盖了一系列事件包括订阅续订、到期、退款等（是的，依然没有消耗型商品的购买通知-.-!），通过这些事件我们可以跟踪应用内购买的整个生命周期，以便更好地了解和响应用户行为。
![App Store Server Notifications V2](<./images/2023-07-08 23.40.32-1.png>)

### 新特性

`App Store Server API` 和 `App Store Server Notifications V2` 共享了许多出色的功能，它们都以熟悉的 JSON 格式提供交易数据，并且数据经过签名，因此我们可以确信这些数据来自苹果，并且这些 API 都支持 StoreKit2 以及 Original StoreKit API。

而本 Session 的核心内容，`App Store Server API` 和 `App Store Server Notifications V2` 均提供了最新的新特性支持。
![What's new in App Store Server API](<./images/2023-07-08 23.47.40-1.png>)

下面将从三个部分分享本 Session 的内容，首先是 App Store Server API 的一些新特性，这些新功能让我们后端处理交易更加简单，接着是 App Store Notifications API V2 的功能增强，这些增强将帮助我们准确可靠的确定用户的订阅状态，最后会介绍从旧 API 迁移的重要更新。

## 灵活处理交易 - Transaction flexibility

交易（Transaction）是代表 IAP 的核心数据结构，其代表用户在设备上的一次购买，其包含了有关购买的重要信息，例如商品ID、类型、购买日期等。Transaction 其实就是通过 JWS 签名的 JSON 数据，作为一种安全的标准化格式在 App Store Server API 和 App Store Server Notifications V2 中使用。
![Transactions](<./images/2023-07-13 21.57.31-1.png>)

在本 WWDC 之前，我们主要通过 App Store Server API 的 `GET Transaction History` 接口获取 Transaction 数据，但这是个获取 originalTransactionId 对应所有的历史交易的接口，通过这个接口我们可以获取该用户的历史购买记录。  

![GET Transactions history](<./images/2023-07-13 22.15.20-1.png>)

但是，在大部分情况下我们其实只需要获取某个 transactionId 对应的 Transaction 信息。在本次更新之前，我们需要先拿到 originalTransactionId，接着调用 `GET Transaction History` 接口后筛选出我们需要的 Transaction 信息，如果在历史订阅记录较多的情况下，我们甚至需要多次调用该接口进行翻页查询、筛选，即使苹果在 WWDC22 推出了 “条件过滤器” 特性，但是用起来依然没有特别顺手。还有重要一点是该接口无法查询已经在客户端上 `finish` 掉的 `消耗型商品` 的交易。  

本次更新提供了一个新的接口用于解决上述问题 
- **[Get Transaction Info](https://developer.apple.com/documentation/appstoreserverapi/get_transaction_info)** 

通过这个接口，我们可以获得任何 transactionId（包括originalTransactionId） 的所有已签名的交易信息，并且支持所有应用内购买类型，包括消耗型、非消耗型、非续订订阅和自动续订订阅，以及在客户端上通过 StoreKit 接口 [finish](https://developer.apple.com/documentation/storekit/transaction/3749694-finish) 和 [finishTransaction(_:)](https://developer.apple.com/documentation/storekit/skpaymentqueue/1506003-finishtransaction) 标记为已完成的交易。

![Get Transaction Info](<./images/2023-07-13 22.24.43-1.png>)

看一下该接口的使用，通过 /inApps/v1/transactions/xxxxxx 发送 GET 请求即可获得已签名的 JWSTranactionInfo 数据
![Get Transaction Info - request](<./images/2023-07-13 22.29.51-1.png>)
经过解密后可以查看该交易的所有信息
![Get Transaction Info - response](<./images/2023-07-13 22.30.00-1.png>)

有了这个接口，我们验证交易的流程变得更加简单，下面我们从交易验证这个场景对比这个不同校验方式的不同

|                    | verifyReceipt API | JWSReceipt 服务端自校验 | GET History Transaction | GET Transaction Info |
| ------------------ | ----------------- | ----------------------- | ----------------------- | -------------------- |
| 元数据          | appReceipt       | jwsRepresentation       | transactionId           | transactionId        |
| 支持消费型商品交易 | 支持            | 支持                  | 客户端 finish 后无法查询 | 支持               |
| 验证耗时             | 较慢            | 快                     | 一般                     | 非常快            |
| 是否弃用       | 弃用            | 否                     | 否                     | 否                  |  

需要注意的是 [verifyReceipt API](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)  已被苹果**弃用**，而新的接口已经基本满足所有业务场景需求，所以建议尽快迁移到 `GET Transaction Info` 校验方式。

除了以上新增的 `Get Transaction Info` 支持 transactionId，本次更新还对其他接口进行灵活性扩展，以下接口均支持了 transactionId 作为查询参数使用，并且原本的 originalTransactionId 同样保留支持。

![transactionId param](<./images/2023-07-13 23.41.10-1.png>)

## 订阅通知更新 - Notification status and results

我们在处理自动续订订阅时，最重要的逻辑是如何跟踪用户订阅的状态以及随着时间的变化状态的变更；目前一共可分为以下几种状态

|               | 订阅状态                                 | 订阅权益是否有效 |
| ------------- | -------------------------------------- | ---------------- |
| Active        | 订阅生效                           | 是              |
| Grace Period  | 宽限期（需要主动开启）      | 是              |
| Billing Retry | 重试扣费                           | 是              |
| Exipred       | 已过期                               | 否              |
| Revoked       | 已撤销 1.退款 2.家庭共享权益失效 | 否              |

![status](<./images/2023-07-15 11.46.05-1.png>)

先看一下在本次 WWDC 之前我们是如何处理用户订阅状态的，借助 Notifications V2 接收到用户订阅状态发生变化的提示通知，我们在适当的时间更新用户在我们平台上的订阅状态，启用或者禁用用户订阅的相关权益，保持流畅的用户体验，我们可以根据通知的 notificationType 和 subType 来确定用户订阅的状态。

对于 notificationType 是 SUBSCRIBED 或者 EXPIRED，我们可以明确知道其对应的订阅状态是 Active 和 Expired。

![active status](<./images/2023-07-15 12.16.30-1.png>)
![expired status](<./images/2023-07-15 12.16.18-1.png>)

但对于某些通知，订阅的状态可能不是那么清晰，以退款通知为例，当我们应用中进行的 IAP 购买发生退款时，我们会收到此类型通知，并且通知中的 signedTransactionInfo 会携带发生退款对应的交易信息。  
假设这个通知是自动续订订阅，我们在处理订阅状态更新时还需要考虑最近是否还有其他相同 originalTransactionId 的订阅购买，如果有我们应该保持用户订阅的 active 状态而不是 revoke 状态，因此，通知中的数据不足以用来确定订阅的状态，这让我们在处理订阅通知时比较繁琐，因此我们通常还需要使用另外一个接口 [GET All Subscribtion statues](https://developer.apple.com/documentation/appstoreserverapi/get_all_subscription_statuses) 来确定该订阅的状态。

![Subscription status](<./images/2023-07-15 12.18.54-1.png>)

* **[Subscription status](https://developer.apple.com/documentation/appstoreservernotifications/status)** 

表示订阅当前自动续订订阅的状态，status 字段作为 int32 类型的数据包含在苹果的发出的每一个 Notifications V2 自动续订订阅通知中，该值的位置是 [responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload) 数据对象中，代表着上面介绍的订阅 5 种核心状态之一，等同于 `GET All Subscribtion statues` 中获取的状态。

| status | 订阅状态         |
| ------ | -------------------- |
| 1      | Active               |
| 2      | Expired              |
| 3      | Billing Retry        |
| 4      | Billing Grace Period |
| 5      | revoked              |

![Notification status field](<./images/2023-07-16 00.15.19-1.png>)

现在我们可以在收到 Notifications V2 通知时就能确定该订阅的状态而不用再调一次 `GET All Subscribtion statues` 接口来确定，按图中例子，我们可以看到 status=1，因此关联的订阅处于 Active 状态。

![Subscription status](<./images/2023-07-16 12.13.00-1.png>)

另外一个更新内容就是 [Get Notification History](https://developer.apple.com/documentation/appstoreserverapi/get_notification_history) 接口，该接口返回最近 6 个月内的后台通知，当我们的交易服务遇到一些问题导致中断时，我们会在服务恢复时通过 `Get Notification History` 接口获取服务中断期间未收到/处理的苹果发送的后台通知，即使苹果会有重试机制（第 1、12、24、48、72 小时重试），但我们肯定是需要尽快响应用户的订阅状态更新，维护用户的订阅权益。

![Get Subscription history](<./images/2023-07-16 13.56.51-1.png>)

该接口的参数是需要指定获取某个时间段内的通知历史，但是我们并不是所有情况下都能明确知道服务中断的时间段，所以可能有大量的筛选工作，过滤掉那些我们已经接收过的通知。针对这个问题，苹果对这个接口引入了一个新的请求字段 "onlyFailures"。

* [Get Notification History - onlyFailures](https://developer.apple.com/documentation/appstoreserverapi/onlyfailures)

可选参数，bool 类型，true 表示只返回未能到达我们服务的通知，注意这里包括正在重试的通知。

![Get Notification History - onlyFailures](<./images/2023-07-16 14.03.24-1.png>)

在 [NotificationHistoryRequest](https://developer.apple.com/documentation/appstoreserverapi/notificationhistoryrequest) 中新增字段 onlyFailures 并设置为 true 即可

![Get Notification History - request](<./images/2023-07-16 14.21.25-1.png>)

设置了 onlyFailures=true 的 Response 结构
* notificationHistory 未到达我们服务的通知列表
* signedPayload 与正常收到通知的数据一样
* sendAttemps 多次尝试发送通知的结果，每个通知最多包含6次重试，其中一个为第一次发送通知，另外五个为重试发送，并且每次发送都包含发送时间以及失败原因，如果这里元素小于 6 个，代表苹果还会重试发送通知，同时如果后续的重试发送成功，那么这个通知将不会在这个请求中返回。

可以说 `onlyFailures` 的支持简化了我们在处理未接收到苹果通知的逻辑。

![Get Notification History - response](<./images/2023-07-16 14.23.34-1.png>)

## API 对比迁移

最后一个就是关于迁移到新 API 的更新，首先我们对新旧 API 进行对比

### 对比 verifyReceipt & App Store Server API

在 WWDC21 之前，我们使用 verifyReceipt 一个 API 走天下的方式，verifyReceipt 用于解析 Orinal StoreKit 购买后获得的票据，而 WWDC21 苹果推出了全新的 App Store Server API 作为从 App Store Server 获取应用内购买数据的新方式，我们从下图对比这两个 API。

![Server API for in-app purchase](<./images/2023-07-16 15.04.32-1.png>)

使用 verifyReceipt 可以验证和解码从运行 Original StoreKit 的客户端收到的收据，客户端需要将笨重的 appstoreReceipt 提交到服务端，在网络不好的情况下极大影响了用户购买的体验。

而 App Store Server API，可以使用 `Get Transaction History`、 `Get All Subscription Statuses`、 `Get Transaction Info` 这三个接口获取在收据等中找到的所有相同数据，只需要一个 transationId 就可以明确，快速的获取需要的信息。

且 App Store Server API 还提供了各种附加接口，这些接口提供了我们在其他地方找不到的有用数据和强大功能。例如补单使用的 `Look Up Order ID` 接口等。

### 对比 App Server Notifications V1 & V2

在 App Server Notifications 方面，App Store Server Notifications V1 和 V2 都提供直接发送到您的服务器的实时应用内购买事件。但 V2 通过使用类型和子类型定义事件，提供了更高的清晰度。而且差异还不止于此。 V2 还提供其他事件的通知、请求测试通知的能力、访问通知历史记录以及用于跟踪用户订阅状态的全新状态字段 "status"。

![App Store Server Notifications APIs](<./images/2023-07-16 15.19.06-1.png>)

通过采用 App Store Server API 和 App Store Notifications V2，我们将解锁这一系列新功能，以便安全、高效地管理服务器上的应用内购买数据。最终为用户提供更好的应用内购买体验。

且苹果正式宣布弃用 verifyReceipt 和 App Store Server Notifications V1，这些接口将不再更新（目前线上有大量应用使用这些接口，苹果不会在短时间内真正关闭这些接口，但是还是建议尽快迁移到新的接口）。

![API deprecation](<./images/2023-07-16 15.42.44-1.png>)

### 迁移

要从 verifyReceipt 迁移到 App Store Server API，可以参考一下步骤：

1. 首先需要签署 JWT 来代表 APP。每当调用 App Store Server API 时，都会提供此 JWT 作为 header。它将证明我们拥有所请求的 APP 数据。
2. 为每个购买保存一个 transactionId
3. 每次调用 App Store Server API （获取历史交易记录、获取所有订阅状态、获取交易信息）时都提供此 transactionId 作为请求参数

![Migration workflow](<./images/2023-07-16 15.43.27-1.png>)

通过这两个步骤我们已经达到 verifyReceipt 接口的迁移升级。  

从 App Store Server Notifications V1 迁移到 V2 更加简单。

1. 准备您的服务器来解析新的 V2 格式，App Store Server Notifications V2 使用与 V1 相同的 JWS 事务格式。
2. 访问 App Store Connect 将设置从 V1 更改为 V2 通知
3. 测试功能我们可以设置先仅在沙箱中接收版本 V2 通知。

![Migration workflow](<./images/2023-07-16 15.44.55-2.png>)

切换设置后，App Store 服务器将开始以 V2 格式发送新通知。如果在重试过程中收到任何 V1 通知，最多可能会在三天内继续收到这些通知。
App Store Server API 和 App Store Server Notifications V2 在沙盒环境中可用，因此我们可以在将其投入生产之前测试功能的实现。

苹果还发布了全新开源库 App Store Server Library，用于调用 App Store Server API 和解析 App Store Server Notifications V2。它可以帮助我们轻松调用苹果的接口，验证收到的签名数据，甚至从票据中提取 transactionId 以使迁移更容易（对于 Original SotreKit 提交的 appReceipt 可以直接获 transactionId）。

App Store Server Library 相关内容可以通过对应 Session 的内参了解，更多迁移的内容可以了解 WWDC22 的迁移相关 Session - [探索 In-App Purchase 集成和迁移](https://xiaozhuanlan.com/topic/8024563197)。

以上所有特性都可以在沙箱和生产中使用，因此我们可以首先在沙箱中进行测试，然后在准备好时将其发布到线上。

## 总结

本次 WWDC23 上 App Store Server API 虽然没有重大的变动更新，但是一些像 Get Transaction Info、Notifications status 接口的更新，开源库 App Store Server Library 的发布，都围绕着在简化我们处理应用内购买的目的进行优化，着力引导开发者迁移到新的API，以下对新特性进行回顾

| 新特性                | 解决痛点                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| GET Transaction Info     | 明确获取指定交易 transactionId 的加密信息，并且支持所有类型交易                        |
| transactionId 支持     | App Store Server API 只支持 originalTransactionId，需要先从 transactionId  获取 originalTransactionId 才可调用 |
| status 字段            | 无法在 Notifications 通知中明确知道订阅状态，需要调用 Get all subscription statues          |
| onlyFailures 参数      | Get notiftication history 有较多的冗余数据，需要自行过滤                                        |
| App Store Server Library | 减少迁移成本，提高接入效率                                                                        |