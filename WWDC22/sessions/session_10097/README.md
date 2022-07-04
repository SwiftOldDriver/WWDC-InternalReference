

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

#### TODO: 各种包体积优化方案。

![new_size_limit](/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/new_size_limit.png)



<div align=center><img src="/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/new_size_limit.png" width="70%"></div>



## App Clip 诊断工具

相信各位开发者在开发 App Clip 的过程中，会碰见 App Clip 的配置链接失效的情况。体现为 Safari 顶部的 Clip Card 没有展示，或是扫描 App Clip 二维码直接跳转到官网而不是展示 App Clip Card等等。出现这种情况的原因有可能是源数据填写问题或是前端 meta tag 配置问题等。排查这些问题是需要各个方位全面进行检查。如果能有个工具来检验配置的链接是否正确，并能标明出现错误的地方那就太好了。现在，它来了！接下来像各位介绍 App Clip 诊断工具的使用方式。

在 iPhone 或 iPad 的设置中，进入 Developer 设置页，在 APP CLIP TESTING 下方选中 Diagnostics，并输入要诊断的 App Clip 配置链接。

![nav_to_diagnostics](/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/nav_to_diagnostics.png)

> 1.如设备设置中找不到 Developer 的入口，需手动开启开发者调试模式。使用数据线将设备连接到 Mac 上，并打开 Xcode，点击菜单栏 Window -> Devices and Simulators，在弹出的页面中选中设备。此时设备的设置页面就会出现 Developer 入口。
>
> 2.实测 iOS 15.4.1，已包含 App Clip 诊断工具。

iOS 会检测输入的配置链接，如果配置正确将会看见绿色的复选框。但是，如果配置出错，则会展示黄色的警告符号并表明出错的原因。同时每一个诊断结果都包含对应的文档链接来进一步解释配置步骤。所以现在开发者能确切地看到问题所在。

![two_type_of_diagnostics](/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/two_type_of_diagnostics.png)

App Clip 诊断工具使用 App Clip Code、Safari、iMessage 来检查，它也会检查开发者的通用链接关联域配置。这个简单的新工具，让 App Clip 的链接配置正确变的更简单。

> App Clip Code 是专属于 App Clip 的二维码。想了解更多关于 App Clip Code 的介绍和配置使用，请参阅 WWDC21 相关的内参。[【WWDC21 10012】App Clip 新特性](https://xiaozhuanlan.com/topic/2048796351)



## CloudKit

CloudKit 是一个框架，可以让您的应用访问存储在 iCloud 上的数据。到目前为止，CloudKit 还不能用于 App Clip。现有的 App Clip 可能会使用服务器来读取数据和资源。

在 iOS 16，App Clip 也可以访问存储在 CloudKit 公共数据库中的数据和资源。现在开发者可以在 App Clip中 和 App Clip 复用相同的代码，访问相同的云端数据。

![cloud_kit_relation](/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/cloud_kit_relation.png)

但是在 CloudKit 的使用上，App Clip 同 App 也是有如下几点的区别

- App Clip 只有读取 CloudKit 公共数据库的权限，并没有写入数据的权限。
- App Clip 无法使用 Cloud 文档服务。
- App Clip 无法使用键值对的存储服务。

![cloud_kit_difference](/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/cloud_kit_difference.png)

这也兑现了 Apple 当初对用户的承诺，当用户不再使用 App Clip 的时候，iOS将会删除 App Clip 及其数据。

### 如何在 App Clip 开启 CloudKit

在 Xcode 选中要开启 CloudKit 的 Target，并选中 Signing & Capabilities，并在下方选中你想在 App Clip 中使用的 CloudKit 容器。这个 CloudKit 容器可以是一个全新的，也可以是与完整 App 共享的容器。

![open_cloud_kit](/Users/zhongyiwang/Desktop/WWDC22/sessions/session_10097/images/open_cloud_kit.png)



### 使用 CloudKit 访问数据的示例

使用容器的标识符创建一个 `CKContainer`，并获取 `publicCloudDatabase` 属性值。这样就可以从公共数据库中获取你想要的数据了。

```swift
// Read your CloudKit public database from your App Clip

let container = CKContainer.default()
let publicDatabase = container.publicCloudDatabase
let record = try await publicDatabase.record(for:
    CKRecord.ID(recordName: "A928D582-9BB6-E9C5-7881-E4EAF615E0CD"))

if let title = record["Title"] as? String,
    let description = record["Description"] as? String {
        print(“Fetched a food item from CloudKit: \(title) \(description)")
}
```



## 钥匙串迁移

