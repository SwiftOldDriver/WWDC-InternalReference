---
session_ids: [10119]
---
Session 10119 - Safari Web 插件开发

本文基于[Session 10119](https://developer.apple.com/videos/play/wwdc2023/10119/)梳理。

- [1. 前言](#1-前言)
- [2. 什么是Safari Web Extension](#2-什么是safari-web-extension)
  - [2.1. Safari Web Extention 的组成](#21-safari-web-extention-的组成)
  - [2.2. Safari Web Extention 的内部通信](#22-safari-web-extention-的内部通信)
    - [2.2.1. 宿主App与Extension App](#221-宿主app与extension-app)
    - [2.2.2. Extension App与backgroud、Extension App与popup](#222-extension-app与backgroudextension-app与popup)
    - [2.2.3. content与background、 content与popup](#223-content与background-content与popup)
    - [2.2.4. injected iframe与content](#224-injected-iframe与content)
- [3. Safari 插件发展历程](#3-safari-插件发展历程)
  - [3.1. Safari App 插件](#31-safari-app-插件)
  - [3.2. WWDC 2020 Safari Web 插件](#32-wwdc-2020-safari-web-插件)
  - [3.3. WWDC 2021 Safari Web 插件 on iOS](#33-wwdc-2021-safari-web-插件-on-ios)
  - [3.4. WWDC 2022 Safari Web 插件 Manifest V3 and declarative net request](#34-wwdc-2022-safari-web-插件-manifest-v3-and-declarative-net-request)
  - [3.5. Content Blocker（内容拦截器）](#35-content-blocker内容拦截器)
- [4. What's new in WWDC 2023 Safari 插件](#4-whats-new-in-wwdc-2023-safari-插件)
  - [4.1. 全新的API](#41-全新的api)
  - [4.2. per-site peermissions](#42-per-site-peermissions)
  - [4.3. Profiles and Private Browsing](#43-profiles-and-private-browsing)
- [5. Safari web 插件 \& Chrome web 插件](#5-safari-web-插件--chrome-web-插件)
  - [5.1. 关于Manifest V2 和Manifest V3](#51-关于manifest-v2-和manifest-v3)
  - [5.2. 关于实现AdBlock功能](#52-关于实现adblock功能)
  - [5.3. 关于把Chrome插件带到Safari上来](#53-关于把chrome插件带到safari上来)
- [6. 发布Safari 插件](#6-发布safari-插件)
- [7. 总结](#7-总结)


## 1. 前言

在WWDC 2020和WWDC 2021，苹果宣布了支持Chrome风格的Safari Web插件。开发者现在可以在macOS和iOS的Safari上使用Chrome插件。在WWDC 2022上， Safari Web插件又有了新的变化，引入了Manifest V3，并且支持了declarative net request。这使得Safari Web插件越来越接近Chrome插件。本文将介绍WWDC 2023 Safari Web插件的新特性，以及Safari Web插件的发展历程。最后，我们将介绍Safari Web Extension和Chrome Extension之间的区别。

## 2. 什么是Safari Web Extension
Safari Web Extension使用和Google Chrome、Mozilla Firefox和Microsoft Edge浏览器相同的Javascript API，为Safari添加自定义功能，基于JavaScript、HTML和CSS构建Safari Web Extension，同时还可将其重新打包以在其他浏览器中运行。

要开始创建Safari Web Extension，有以下两种方式：
- 将现有其他平台的插件转换为Safari Web Extension，以便在macOS和iOS的Safari中使用，并在App Store中分发。Xcode包含了一个命令行工具，可简化此过程。
- 在Xcode中使用内置模板构建新的Safari Web Extension。

目前Safari Web Extension可在macOS 11及更高版本、安装了Safari 14的macOS 10.14.6或10.15.6以及iOS 15及更高版本中使用。

在开发Safari Web Extension的过程中， 完全可以参考[Mozilla的文档](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) 或者[Google的文档](https://developer.chrome.com/docs/extensions/)来了解相关API，虽然可能有一些差异（主要是Safari Web Extension支持的API更少）， 但是使用方法基本会保持一致。



### 2.1. Safari Web Extention 的组成
了解一种类型的app， 最快的方式就是打开Xcode， 迅速创建一个新的项目，从自动生成的文件，就可以很清晰地看出整体的结构。
![Safari Web Extension目录结构](./images/xcode_struct.png)

Safari Web Extension的目录结构如上图所示， 从目录结构可以看出， Safari Web Extension主要由以下几部分组成：
- 宿主App
- Extension Native 部分
- Extension 部分

宿主应用（Host App）通常是指常见的应用程序（App），根据苹果公司的要求，每个浏览器插件都必须依附于一个主要的应用程序才能在App Store中发布。这一点与Chrome的插件有所不同。

Extension Native（扩展原生部分）也是一个独立的组件，它具有自己独立的沙盒环境，并能执行macOS和iOS的API。通过Extension Native，扩展能够直接与原生API进行通信，并且还可以通过类似于App Group的机制与宿主应用进行信息交互。Extension Native在这三个组件的通信中充当了一个中介的角色，而SafariWebExtension.swift则是其中最主要的部分之一。

通过实现```SafariWebExtensionHandler```这个类的```beginRequest``` 回调， 实现上述通信。
```swift
func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@", message as! CVarArg)

        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response to": message ] ]

        context.completeRequest(returningItems: [response], completionHandler: nil)
}
```
Extension是整个架构中最重要的部分。它通过JavaScript与网页进行交互，实现了改变网页内容、丰富网页功能、自定义网页UI、修改网页请求内容等功能，这也是用户需要浏览器插件的原因之一。同时，Extension还可以提供一个可交互的弹出式界面（popup），这是一个独立的网页，也是每个Safari Web Extension与用户进行交互的页面。这个弹出式界面通过基础的前端技术（HTML、CSS、JavaScript）来实现。

在上面Xcode生成的项目文件架构中可以看到，为Extension生成的JS文件主要包括三个，```background.js```、```content.js```以及```popup.js```。

其中background.js是指在 Safari运行期间，独立于每一个网页生命周期运行的JS代码，这些代码可以使用所有的Web Extension API，background在extension被Safari加载时便立即加载， 直到extension被卸载或禁用。

但是， background的运行方式可以被指定为non-persistent， 如果这样的话，background就会使用on- demand的形式来加载，在iOS上，由于性能和资源的限制，background只能通过这种方式运行。以non- persistent方式运行的background的生命周期是通过事件来建立和销毁。可以在其中注册各种事件监听器，从而在有需要的时候才会被调用。例如：
```javascript
browser.runtime.onMessage.addListener((request) => {

});
```
这是一个监听消息的事件，可以监听其他模块发送的消息，当接收到消息时，background会被加载， 当其中的逻辑被处理完之后，则会被销毁。
这种模式下，即使时全局变量，也会在页面被销毁时被销毁，所以关键的全局变量，需要及时通过Storage API写入磁盘。

content.js本身使extension的一部分，但可以运行在指定的网页当中，与background不同，可以通过指定URL或者Domain，使不同网页运行完全不同的content。
因为background虽然可以使用全部的WebExtension JavaScript API，但不能直接访问网页的内容。 这时候，就需要通过content来实现这一功能，就像网页中被 ```<script>``` 元素加载的脚本一样，content可以使用DOM API， 并且修改网页的内容。但是相较于background， content可以使用的WebExtension JavaScript API比较少。

popup就是当用户点击浏览器中extension的图标时，会出现的弹窗页面。 popup.js就是在这个页面中加载的脚本， 主要用于处理用户在这个页面上操作逻辑。
### 2.2. Safari Web Extention 的内部通信
因为Safari Web Extension的组件比较多，不同组件的权限和功能各不相同，当这些组件之间需要共享一些内容或者状态的时候，就需要通过各种API实现各个组件之间的通信。
![Safari Web Extension的内部通信](./images/communication.png)

上图是Safari Web Extension各个组件可以实现的通信，其中injected iframe在上面没有提到，这指的是通过插件，插入在各个网页中的```<iframe>```元素，它可以被看成是运行在原始页面中的子页面， 它不是Extension的一部分，却是因为Extension的行为而产生的，所以也被列入其中。

按照上图中的箭头，Safari Web Extention 的内部通信主要有以下几种
#### 2.2.1. 宿主App与Extension App
这两个App完全属于两个进程，所以可以像其他类型的Extension App一样，可以通过App group 或者NSXPCConnection来进行通信。

#### 2.2.2. Extension App与backgroud、Extension App与popup
这种通信方式是一种重要的通信方式，主要作用是把插件内的配置等同步给Extension，进而同步给宿主App，实现在UI上展现等功能，这种通信方式是其他平台的Web Extension所不具备的。

在使用时，popup和background需要使用
```js
browser.runtime.sendNativeMessage("application.id", {
  "messages":"content"
})

```
这里需要提到的一点是，application.id 不是一种id，而是一个default value而且不需要更改。 Extension App则使用上文提到的beginRequest来接受发出的消息，并可以在其中加入response， 因为```sendNativeMessage```是一个Promise， 可以使用Promise.then来接受这个返回值。

#### 2.2.3. content与background、 content与popup
```js
browser.runtime.sendMessage(
  extensionId,             // optional string
  message,                 // any
  options                  // optional object
)
browser.runtime.onMessage.addListener(listener)
```

通过sendMessage和addListener来发送和监听消息

#### 2.2.4. injected iframe与content
content 通过contentWindow.postMessage向iframe发送消息
```js
document.getElementById("frameID").contentWindow.postMessage({
        msg: message,
        ele: ele,
      }, '*')
```

iframe则通过window.parent.postMessage向content发送消息
```js
window.parent.postMessage({
    msg: 'message'
  }, '*')

```
## 3. Safari 插件发展历程
苹果生态的浏览器插件经历了Safari Extension， Safari App Extension到Safari Web Extension的发展， 其中除了Safari Exttension已经废弃了， Safari App Extension和Safari Web Extension仍然都苹果生态中的浏览器插件支持的实现方式。这两者的区别主要在于Safari App Extension使用苹果原生技术在实现插件的主要功能，而不是JavaScript。 但是如果想要支持开发一款支持苹果全家桶（iOS，macOS，iPadOS，xrOS）的浏览器插件，或者把其他平台的浏览器插件带到苹果生态中， Safari Web Extension是唯一的选择。除此之外，Safari还支持Content Blocker（内容拦截器）， 这也是一种浏览器插件， 但是其功能有限， 只能拦截网络请求， 这也是Safari 上绝大多数的广告拦截器的实现方式。

  ### 3.1. Safari App 插件
  ### 3.2. WWDC 2020 Safari Web 插件
  ### 3.3. WWDC 2021 Safari Web 插件 on iOS
  ### 3.4. WWDC 2022 Safari Web 插件 Manifest V3 and declarative net request
  ### 3.5. Content Blocker（内容拦截器）
## 4. What's new in WWDC 2023 Safari 插件

### 4.1. 全新的API
### 4.2. per-site peermissions
### 4.3. Profiles and Private Browsing





## 5. Safari web 插件 & Chrome web 插件
 到这一次的wwdc， Safari平台的浏览器插件已经和Chrome平台的愈加相像了， 开发者可以轻松的把一些Chrome平台的插件带到Safari上来，但是其中自然也有一些区别，这些区别可能也是当下Safari平台生态仍然不够百花齐放的原因。

 ### 5.1. 关于Manifest V2 和Manifest V3
 ### 5.2. 关于实现AdBlock功能
 ### 5.3. 关于把Chrome插件带到Safari上来

## 6. 发布Safari 插件
## 7. 总结
以上就是关于WWDC 2023 Safari Web 插件的介绍， 以及和Safari Web 插件的一些额外知识，可以看到， 苹果在Safari 插件方面正在日趋完善， 虽然仍然达不到 Chrome平台那样的高度定制化，但是这就是苹果的做派，开发者只能带着“镣铐”把舞蹈跳好， 希望Safari上能出现更多更好的插件， 也希望苹果能够在Safari Web 插件上继续努力， 为开发者提供更好的支持。
