

# WWDC21 10298 - 在 Smart Home App 中添加对 Matter 协议的支持

> 作者：Ronbin，iOS 开发者，就职于 Tuya，多年 IoT 方面工作经验。
>
> 审核：折腾范儿_唯敬，iOS/前端 开发者，就职于阿里巴巴，喜欢研究跨平台动态化混合前端相关的内容，目前从事移动应用客户端/前端相关开发工作。

本文基于 [Session 10298](https://developer.apple.com/videos/play/wwdc2021/10298/) 梳理，HomeKit 在 iOS 15 中增强的新 API 能让智能家居开发人员以最方便的方式来集成新的 Matter 协议。可以通过查看 Matter 协议，了解如何在苹果的平台和开发者自己的智能家居 App 来设置和管理 Matter 配件。

## Matter 协议

### 智能家居行业的困局

智能家居行业现在面临最大的问题，智能设备不能互联互通，各家厂商出于商业利益和技术选型等方面的考量，还没有一个能够兼容并连接所有智能家居产品的标准或协议。

### Matter 协议的由来

![](https://images.xiaozhuanlan.com/photo/2021/abe279862b6b5e3ff2e20e8098b9319f.png)

苹果在 WWDC 2021上正式宣布，为了解决这个问题，苹果携手包括谷歌、亚马逊在内的多家智能家居头部企业，共同成立连接标准联盟，为消费者带来了全新的连接协议“Matter”。

Matter 是一种基于 Project Connected Home over IP （CHIP）项目，是连接标准联盟（原 Zigbee 联盟）开发的免版税连接标准。将用于构建和连接物联网生态系统。它是免费的，可在各种智能设备之间进行通信，此外，它还可以一种规范，以确保基于此标准构建的项目可靠，安全并且能够协同工作。

Matter 协议正在开发中，作为开源项目，它利用了包括 HomeKit 在内的成熟技术，确保它将支持最广泛的智能家居设备，然后使制造商更容易开始将其集成到他们的产品中。

### 带来的好处

接入 Matter 协议后

- Smart Home 配件制造商不再需要去兼容多个协议，从而真正去专注自己产品功能开发并且快速迭代。
-  App 开发人员有机会专注于为客户开发最佳的 App 体验，而无需创建和维护专有通信协议。

- 通过创建这样一个统一的配件协议，客户可以轻松享受智能家居的便利，然后自信地将产品带入家中，因为他们知道他们将一起工作。它将使更多的配件可供人们在商店中选择，然后世界各地的建筑商都可以将它们作为标准安装到家中。

iOS、iPadOS 和 TVOS 15 将作为开发者预览版提供对 Matter 的支持。

## 如何通过HomeKit与Matter配件集成


### HomeKit 框架

在谈谈如何通过 HomeKit 与 Matter 配件集成，我们先来普及下 HomeKit 的概念：

HomeKit 框架是用来沟通和控制家庭自动化配件的，这些家庭自动化配件都支持苹果的 HomeKit Accessory Protocol。HomeKit 应用程序可让用户发现兼容配件并配置它们。用户可以创建一些 action 来控制智能配件（例如恒温或者光线强弱），对其进行分组，并且可以通过Siri触发。

HomeKit 对象被存储在用户 iOS 设备的数据库中，并且通过 iCloud 还可以同步到其他 iOS 设备。HomeKit 支持远程访问智能配件，并支持多个用户设备和多个用户。HomeKit 还对用户的安全和隐私做了处理。

在 HomeKit 的基础上构建了强大的功能，提供了对 HAP 配件的完全控制和管理。苹果通过扩展 HomeKit 框架的责任，以支持 Matter 作为一个并行协议。

![](https://images.xiaozhuanlan.com/photo/2021/889dde1fab6c886b9085527818e9b8cc.png)

在架构上，这意味着 HomeKit 调用开源 Matter 实现，称为 CHIP framework，以便与 Matter 附件通信。HomeKit 提供的封装允许所有现有的 Apple Home 功能立即无缝地开始使用 Matter 附件。

例如，使用与 HAP accessory setup 相同的流程设置 Matter accessory，只需向下轻扫一次即可控制 Control Center 中的 Matter accessories，以及与 Siri 的免提集成，以获得 Matter accessory 状态，然后控制所有苹果设备。

苹果设计 HomeKit 的愿景是，应用程序开发人员应该能够利用 HomeKit 为他们的客户构建富有创意的、令人愉快的智能家居应用程序，而不必使用附件实现通信协议。

下面这边代码展示了如何在今天的 HomeKit 应用程序中调用 addAndSetupAccessories API。

```swift
// Add a Matter accessory to your HomeKit app
home.addAndSetupAccessories() { error in
    if let error = error {
         print("Error occurred in accessory setup \(error)”)
    } else {
         print("Successfully added accessory to HomeKit")
    }
}
```

有了 iOS 15 开发者预览版，这个 API 调用的二维码扫描器不仅可以用于 HAP 二维码，还可以开始识别 Matter 二维码，为您的客户提供熟悉和一致的配件安装体验。

![](https://images.xiaozhuanlan.com/photo/2021/6f95892c5ed53f890066aa94911b3de2.png)

此外，您将自动获得远程访问和及时通知的物质配件，然后能够添加和编辑使用场景和自动化 API 的物质配件，所有这些都是在相同的方式与你做的 HAP 配件。

随着 Matter 项目的不断发展，会有越来越多的配件支持 Matter 协议，同时 HAP 作为一种协议，支持自定义特征。它允许制造商用他们的配件建立创造性的定制功能，并通过 HomeKit 访问它们。

### 添加 HomeKit 设备流程

#### 发现

在开始安装之前，应用程序会创建一个拓扑对象，表示它所管理的家庭。然后它将这个拓扑对象传递给一个新的 setupapi。

Matter 协议新增了 5 个类，API 在概念上非常类似于用于附件设置的现有 Homekit API，主要的区别是添加了 HMCHIPServiceTopology对象，用于通知安装程序应用程序管理的家庭。当用户用扫描器扫描一个二维码时，安装程序将自动进入一个显示检测到的附件类别的检测卡。

![](https://images.xiaozhuanlan.com/photo/2021/878436746e8ae4ad8a5a1123956d383e.png)

此时，安装程序启动并准备扫描二维码。下面是一个调用的代码示例。

```swift
// invocation example
let homes = proprietaryHomeStorage.homes.map { home in
    HMCHIPServiceHome(uuid: home.uuid, name: home.name)
}

let topology = HMCHIPServiceTopology(homes: homes)
let setupManager = HMAccessorySetupManager()

do {
    try await setupManager.addAndSetUpAccessories(for: topology)
    print("Successfully added accessory to my app”)
} catch {
    print("Error occurred in accessory setup \(error)")
}
```

#### 配对

一旦用户选择了一个家，iOS 会向您的分机发送一个请求，要求它与扫描附件的物质负载配对。您的扩展通过它的 HMCHIPServiceRequestHandler 子类响应这个请求。调用时，使用 CHIP 框架 API 在 Matter 附件和家庭集线器之间创建一个安全的配对。

![](https://images.xiaozhuanlan.com/photo/2021/9e96f6334644c397e92f72a0963917cc.png)

```swift
class RequestHandler: HMCHIPServiceRequestHandler, CHIPDevicePairingDelegate {

   // . . .

   override func pairAccessory(in: HMCHIPServiceHome, onboardingPayload: String) async throws -> Void {
        // iOS is instructing the extension to pair the accessory via CHIP.framework
  }   
  // . . .
}
```

#### 房间设置

iOS 将从您的分机请求与所选住宅相对应的房间列表。这些房间显示在用户界面中供用户选择。在扩展中响应此请求的代码非常简单。就像 pair 请求一样，它围绕扩展的原理 HMCHIPServiceRequestHandler 子类展开。只需实现此功能并返回与用户所选住宅匹配的相应房间。

![](https://images.xiaozhuanlan.com/photo/2021/7b5a375a3db46d45a5e628e72395d2cf.png)

```swift
class RequestHandler: HMCHIPServiceRequestHandler, CHIPDevicePairingDelegate {

   // . . .

   override func rooms(in: HMCHIPServiceHome) async throws -> [HMCHIPServiceRoom] {
        // iOS is querying for a room list that corresponds to the given home
    }   
    // . . .
}
```

#### 配置附件信息

一旦用户为他们的附件选择了一个名称和房间，我们会将该信息提供给您的分机，并要求它配置附件。与其他请求类型一样，您的扩展将通过使用 CHIP 框架 API 直接配置附件来响应配置请求。

![](https://images.xiaozhuanlan.com/photo/2021/40b271c7bf6207bee41f6bba5b3f40d9.png)

```swift
class RequestHandler: HMCHIPServiceRequestHandler, CHIPDevicePairingDelegate {

   // . . .

   override func configureAccessory(named accessoryName: String, room accessoryRoom: HMCHIPServiceRoom) async throws -> Void {
        // iOS is instructing the extension to apply configuration via CHIP.framework.
    }
    // . . .
}
```

在为您的应用程序完全配置附件之后，用户还将有机会使用 Apple Home 应用程序、Control Center 和 Siri 来控制此附件。这里再次完整地收集了我们期望您的扩展实现的代码。三个简单的功能：房间请求、配对附件请求和附件配置。

一旦对 HMCHIPServiceRequestHandler 进行了子类化并重写了这些方法，剩下的安装体验就基本上不受开发人员的影响了。诸如 UI 表示、步骤之间的转换、错误处理等都是为您处理的。这大大减少了需要编写的代码量，同时为用户提供了真正一流的体验。

![](https://images.xiaozhuanlan.com/photo/2021/3682720a4a803f9e58ba322885306c9c.png)

```swift
class RequestHandler: HMCHIPServiceRequestHandler, CHIPDevicePairingDelegate {

    override func rooms(in: HMCHIPServiceHome) async throws -> [HMCHIPServiceRoom] {
        // iOS is querying for rooms that match the given home.  These rooms will be shown in system UI and the selection will be vended back to your extension's `configureAccessory` function
   }

    override func pairAccessory(in: HMCHIPServiceHome, onboardingPayload: String) async throws -> Void {
        // iOS is instructing the extension to pair the accessory via CHIP.framework
   }
    
    override func configureAccessory(named accessoryName: String, room accessoryRoom: HMCHIPServiceRoom) async throws -> Void {
       // iOS is instructing the extension to apply configuration via CHIP.framework.
    }
}
```
## Matter 协议的深入研究



### Matter data model

每个 Matter 附件都通过 Matter 数据模型公开其功能。

![](https://images.xiaozhuanlan.com/photo/2021/53fd72f0be153368f654fcbccfbd5de9.png)

端点可以被认为是附件在逻辑上独立的特征。

大多数配件只有两个：一个用于提供信息，如名称、供应商和型号；另一个用于附件的主要功能，例如灯。每个端点可以有多个集群。每个集群表示该端点的特定功能。对于我们的灯光示例，其灯光端点可能具有用于亮度、颜色和功率控制的簇。对于熟悉 HomeKit 的人来说，集群可以被认为等同于 HomeKit 服务。
集群可以有一个或多个属性。每个属性表示附件的某种状态。对于我们的灯光示例，灯光上的亮度簇将具有一个属性，允许我们读取和控制灯光的亮度。同样，物质的属性可以被认为等同于家庭用品的特性。
每个属性可能支持一组从读、写和报告的操作。在我们的灯光示例中，我们可能希望在 on-off 集群上启用报告，以便在每次灯光打开或关闭时接收来自附件的通知。Matter 通常提供多种 API 来根据每个属性的功能进行配置和交互。

我们刚才谈到的这些概念是在 CHIP 框架中实现的，苹果是其中一个关键贡献者。CHIP 框架的完全认证版本将在 iOS 中发布，这使得 HomeKit 能够与 Matter 附件集成，并且如果您需要在应用程序中使用开源 API，还可以访问这些 API。

让我们看一个使用 CHIP 框架与灯光配件交互的示例。这是我们刚才讨论的物质数据模型的核心概念。我们从访问共享 CHIPDeviceController 开始。这个控制器是我们处理问题的主要方法。接下来，我们使用在配对期间分配给灯光的设备 ID 来获得灯光的句柄。然后，我们初始化灯光端点上开-关集群的句柄。现在，通过这个 on-off 集群，我们可以对 on-off 属性执行读写操作。首先，我们请求切换 on-off 属性，它只是切换灯光的状态。然后，我们请求读取 on-off 属性的状态。然后附件向我们发送一个带有属性状态的响应，我们可以使用它来更新应用程序。

```swift
let controller = CHIPDeviceController.shared()
do {
    let device = try controller.getPairedDevice(accessoryDeviceID)
    let onOffCluster = CHIPOnOff(device: device,
                               endpoint: lightEndpoint,
                                  queue: DispatchQueue.main)
    onOffCluster?.toggle({ (error, values) in
        // Error handling code here
    })
    onOffCluster?.readAttributeOnOff(responseHandler: { error, response in
        if let state = response?[VALUE_KEY] as? NSInteger {
           updateLightState(state: state)
        }
    })
} catch {
    print("Error occurred in accessory control \(error)")
}
```



### 多个中枢管理

Matter 协议允许多个管理员同时连接到一个附件。这是一个伟大的功能，为客户提供选择，但它也提出了挑战，我们当谈到配件管理。让我们来看看 Home 应用程序是如何整合这一点的。家庭应用程序现在可以在这个新的连接服务部分下显示附件上所有连接管理员的列表。用户还可以选择管理连接的管理员。最后，用户可以选择再次打开配对模式，以允许新管理员连接附件。

![](https://images.xiaozhuanlan.com/photo/2021/183651ce7a7d727e281cc02ded6a248c.png)

### Matter 接入准备工作

Matter 支持将首先在 iOS、iPadOS 和 TVOS 15 开发人员预览版中提供，并且必须在这些平台上安装开发人员配置文件才能启用它。你还需要一个家庭枢纽控制的物质配件通过家庭工具包。虽然我们希望 Matter 在市场上提供合格的供应商 ID 和认证产品 ID 后，能够发布这些 ID，但我们将提供一份供应商 ID 和产品 ID 示例列表，并提供开发人员预览，以方便您的开发。这些 ID 预先配置为表示开发人员预览中已支持的附件类别。可以在 developer.apple.com 上找到更多关于 API 的信息。

## 总结

有的人可能会问，**Matter **有哪些优势？现在看来，”包容”应该是最好的答案。一款智能家居产品支持 Matter，这意味着它能接入市面上最主流的三家平台，与绝大多数手机、智能音箱进行互联。假设手中的设备都带有 Matter 标识，那么用户就可以通过任意一个智能家居生态配置连接，然后又可以通过其他支持 Matter 的智能家居生态访问调用。以往购买单个设备就必须要搭配相应品牌生态使用，不同品牌设备之间不能跨生态互动的体验，将成为历史。
## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
