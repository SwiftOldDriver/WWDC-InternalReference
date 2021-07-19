> 作者：刘杰，目前就职于人民日报媒体技术股份有限公司，负责融媒云项目开发。
>
> 审核：方秋枋（mango）, 微信高级工程师，微信支付跨平台负责人，喜欢 Simple And Stupid 的代码。

![](https://images.xiaozhuanlan.com/photo/2021/6e6c410812208cf3d5f3dc22ea2061e0.png)

基于 [Session 10123](https://developer.apple.com/videos/play/wwdc2021/10123/) 梳理。

## 导读

距离苹果第一次向大家介绍 iOS Screen Time 已经过去三年了，`Screen Time` 对用苹果用户来说是一个很“透明的”功能，它可以为用户提供清晰透明的应用使用时间、访问网页时间记录，用户以及其家庭成员能够直观的了解到过去一段时间设备的使用情况。在了解到相关信息之后，可以针对性地管理使用设备的习惯，从而让用户能够合理、健康地使用手机。不仅如此，家长还可以通过 `Screen Time` 增加限制条件来管理孩子们的设备。

 ![](https://images.xiaozhuanlan.com/photo/2021/31e4913f6557eb78cb7c89198fdc3f7a.png)

既然苹果有这样出色屏幕监控与限制使用的管理功能，那其他应用是否也可以拥有呢？当然可以！基于 `Screen Time API` 就可以在自己的**家长控制应用**中使用它们。


## Screen Time API 构造
`Screen Time API` 提供了核心的 `Screen Time` 功能，在iOS 和 iPadOS 15 之后的系统版本就可以使用 `Screen Time API`。`Screen Time API` 是100% Swift 和 SwiftUI 代码，它的设计和构建遵守了3个指导原则：

	1.  提供一个现代的、设备级的框架来直接使用 `Screen Time`  现有的限制能力
	2. 严格保障用户隐私
	3. 确保开发者能够创造出优秀的动态家长控制体验

基于这3个指导原则，苹果设计了与之对应的3个新的框架 — `Managed Setting` 、`Family Controls` 、`Device Activity` — 共同组成了 `Screen Time API`

![](https://images.xiaozhuanlan.com/photo/2021/488bdf16ba66c691d705f2563e1e9940.png)


### 1. Managed Setting Framework

基于**“提供一个现代的、设备级的框架来直接使用 `Screen Time`  现有的限制能力”**的指导思想，`Managed Setting` 框架为用户提供了一种保护隐私的方式来对设备中的某些设置和功能进行限制设置，这些限制会持续生效直到家长或者监护人解除。开发者可以根据应用自身的品牌调性以及功能需求，相应地进行定制化开发，设置多种类型的限制。

![](https://images.xiaozhuanlan.com/photo/2021/c3abc14f66c6345248ba8e72278a0356.png)

这其中针对媒体内容，Managed Setting 提供了相关 API 且无需 Family Controls 授权。对于媒体类型的应用，这些方法会帮助它们针对不同用户做内容分级限制。

![](https://images.xiaozhuanlan.com/photo/2021/dd0b6702f5f9db97ab3e8f0213015657.png)

### 2. Family Controls Framework

`Screen Time` 会处理一些很敏感的用户信息（例如：用户使用应用时长或者访问网页时长），`Screen Time` 中除了家庭成员，其他任何人（甚至苹果）都不能够获取用户敏感信息。正是基于**严格保障用户隐私**指导思想，`Family Controls` 提供了在儿童的设备中校验家长控制的使用授权的能力，防止 `Screen Time API` 被移除或规避。与此同时，`Family Controls` 为家庭成员正在使用的应用或访问的网站提供**隐私不透明令牌**，在使用 `Screen Time API` 来进行监控或者限制功能使用的整个过程中，这个令牌都会用到。通过它还可以确保只有 `Family Share` 团体中的成员可以知道什么应用或网站正在被使用，任何其他人都无法得知。

![](https://images.xiaozhuanlan.com/photo/2021/d4934be90e98d09208f48dea6681a3dd.png)

### 3. Device Activity Framework
基于**确保开发者能够创造出优秀的动态家长控制体验**的指导思想，`Device Activity` 框架提供了监控网站和应用的使用状况的能力，开发者可以在适当的地方执行代码来实现监控。

考虑一种情况，小时候偷偷看电视，“聪明”的孩子就会用湿毛巾来给电视降温，这样在家长回到家摸电视机时就不会发现孩子偷看电视的行为。同样的，作为一个**家长控制应用**，孩子会想尽办法不让它“存活”在自己的手机中。那么如何才能运行代码在孩子的设备中设置限制呢？答案便是`Device Activity` 框架中的 `schedules` 和 `events`。

`Device Activity Schedule` 会在时窗的开始和结束时，在程序中运行一个拓展。当使用设备的用户达到 `Device Activity Schedule` 设置的使用阈值时，`Device Activity Events`  会调用拓展中的相应方法。**家长控制应用**只需要简单声明它所关心的**使用类型**和**使用时间**。

![](https://images.xiaozhuanlan.com/photo/2021/0dbbd856cb872917afa28137332b16ee.png)

以上三个框架就构成了整个 Screen Time API，接下来我们来了解一下简单的家长控制应用使用流程以及如何使用 Screen Time API 来构建实现自己的家长控制应用。

## 家长控制应用工作流程

基于 `Screen Time API` 提供的能力，在家长控制应用中可以按照下述流程来对儿童的设备进行管理。需要明确在整个流程中存在两个端，家长或监护人使用的 **家长端**和儿童使用的**儿童端**，家长设备和儿童设备需要包含在同一 Family Share 团体中。

<center>![](https://images.xiaozhuanlan.com/photo/2021/f793663ae5d6f324b1129aa67b935cfc.gif)</center>

1. 首先，在家长和儿童的设备中安装家长控制应用，监护人打开儿童端，儿童端会请求获取授权并登录家长或监护人的 Apple ID。
2. 之后，在家长端设置限制和规则，应用会发送这些信息到孩子的设备。
3. 然后，在儿童端，应用会根据家长端的设置来对儿童的行为进行监控和限制操作。

以上就是一个简单的“获取控制权限-设置限制-监控操作”家长控制应用工作流程，在 Screen Time API 中，这三步分别对应 `Family Controls` 、`Managed Setting`、`Device Activity`，接下来我们看一下具体的实现过程。

## Screen Time API 实践

### 1. 初始化并获取 Family Controls 权限

在 Xcode Project editor 中，选择应用 target ，在 Signing and Capabilities 栏目下点击添加按钮添加 Family Controls。
![](https://images.xiaozhuanlan.com/photo/2021/8ba37caa892248fd9879df6f7d819c7f.png)

添加成功后，使用 ` AuthorizationCenter` 在应用启动时获取 Family Controls 权限，页面会弹出一个提示框，这时需要家庭成员中的监护人来同意授权并输入 Apple
 ID 和 密码。这里有几点需要注意：
 
 - 提示框仅在第一次获取授权会弹出展示，已经授权完成后，当再次请求 Family Controls 授权时，会默认执行成功回调。
 - 为了避免误用，当登录的用户没有使用 Family Sharing，请求授权方法会返回失败。
 - 一旦设备请求授权成功，用户不能退出 iCloud，使用 `Network Extensions framework` 构建的网页内容过滤也能够在家长控制应用中使用并将自动安装且不能被移除。
 
![](https://images.xiaozhuanlan.com/photo/2021/c9d2f3cb6cb06ce3df11fcba38161bd8.png)

### 2. 设置限制

#### 2.1 设置限制内容

在家长端，需要监护人来选择哪些应用、网站、分类是需要被禁止的。在 `Family Controls` 框架中提供了 `The family activity picker` 的 SwiftUI 组件来实现应用选择交互。当监护人做出选择后，通过返回的不透明的 token 指代的应用、网站或分类做出限制。当获取到监护人选择的限制之后，在 Device Activity 监听拓展中，进行下一步操作。

![](https://images.xiaozhuanlan.com/photo/2021/fc80cb8a8625a6d44ca9f84d17dd9470.png)

即使家长控制应用没有开启，也可以使用 Device Activity Schedule 来设置应用屏蔽限制。当 Device Activity Schedule 开启，`Device Activity` 将会调用一个新的拓展点，项目中会有针对拓展点的拓展。为了实现拓展，需要定义 `DeviceActivityMonitor` 的子类作为原理类。子类中需要重写两个方法 `intervalDidStart` 和 `intervalDidEnd` ，在自己的 schedule 开始和结束之后，当设备被使用时这两个方法将首次分别被调用。

引入 `ManagedSettings` 模块来配置应用屏蔽限制内容，在代码中，`intervalDidstart`方法内获取 `MyModel` 模型内家长端设置的限制内容，将限制内容配置到 `ManagedSettingsStore`。相应的，`intervalDidEnd ` 方法内清空限制配置，在时间范围外移除限制。

![](https://images.xiaozhuanlan.com/photo/2021/64d0d9763329a4cc61497d027f372f86.png)

#### 2.2 设置限制监听
在家长控制应用的家长端，创建 Device Activity 监听拓展，设置名称，创建 schedule。在拓展中可以通过 `DeviceActivityName `来引用活动， `DeviceActivitySchedule` 描述了拓展监听活动的时间范围，`repeats` 参数表明是否重复运行。通过创建 `DeviceActivityCenter` 对象，调用 `startMonitoring` 方法来开启监听。

![](https://images.xiaozhuanlan.com/photo/2021/cc92e43818a9cf00fa6f8c0d3b41f13a.png)


### 3. 完成任务后移除限制

#### 3.1 设置推荐使用内容和完成目标
在 Device Activity 监听拓展中， 设置 `DeviceActivityEvent` , 根据设置的名称可以引用这个事件。

![](https://images.xiaozhuanlan.com/photo/2021/7da7ff0003dd4a9a43428656b455be31.png)

将用户选择的推荐使用的内容和期望完成目标配置到事件当中，然后将这个事件也配置到 `startMonitoring` 方法中。

![](https://images.xiaozhuanlan.com/photo/2021/6200de7c842dd2adeb214160e25dcbc6.png)

#### 3.2 监听鼓励事件完成情况

在家长控制应用家长端，当鼓励事件达标时，`eventDidReachTHreshold` 方法将被调用，方法中有两个参数：`Device Activity Event Name` 和 `Device Activity Name`。 这两个参数表明了是哪个事件完成了哪个活动计划。


### 4.定制操作

#### 4.1 定制屏蔽界面

基于 `ShieldConfigurationProvider` 创建子类， `coinfiguration` 是唯一需要重写的方法，方法中的参数是当前被屏蔽的 application 的引用，方法将返回一个 `ShieldConfiguration` 结构体。方法中可以设置背景、标题、副标题、图标、按钮样式。
 
![](https://images.xiaozhuanlan.com/photo/2021/6579673056e549557e20624aad9b089c.png)

#### 4.1 定制按钮处理

基于 `ShieldActionHandler` 创建子类重写 `handle` 来实现自定义按钮事件。方法种的参数 `action` 表示是哪个按钮被点击， `application` 表示当前被屏蔽的 application。该方法需要实现 completionHandler 回调，有两种响应：关闭和延迟。其中延迟是一个很强大的操作，它能够在等待信号的过程中重绘页面展示加载状态。例如，当孩子向家长请求访问权限等待时，可以展示加载状态。

![](https://images.xiaozhuanlan.com/photo/2021/76f1cb89eac3c23f16587f2ed53d2afa.png)

## 后记

Screen Time API 让我想到了目前国内 APP 中的青少年模式，两者都是对于儿童使用应用过程中的限制。不同的是，应用中的青少年模式只能从应用层级来做限制，例如抖音的青少年模式会限制展示内容分类、使用时间限制，应用内操作限制。而 Screen Time API 是从系统层面对应用使用做出限制，其隐私性更加有保障，可以通过配置来设置激励措施。两者可以相互结合，在系统层面和应用层级全面的设置限制来引导用户使用手机的习惯。

Screen Time API 的设计中存在家长端和儿童端两个身份，这就需要两个设备。然而现实中还存在另外一种需求：个人在自己的设备上做出限制来管理自己使用设备的习惯，但是基于 Screen Time API 的设计是无法实现在一台设备中管理使用权限的，很多人针对这个问题向苹果提出疑问。

总而言之，Screen Time API 为开发者带来了 Screen Time 核心的应用管理功能，这些 API 的开放将会激发更多有意思 的需求，相信未来在很多教育类型的 APP 中都会看到他的身影。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
