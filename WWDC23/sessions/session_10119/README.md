---
session_ids: [10119]
---
# Session 10119 - Safari Web Extension开发

本文基于[Session 10119](https://developer.apple.com/videos/play/wwdc2023/10119/)梳理。

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Session 10119 - Safari Web Extension开发](#session-10119---safari-web-extension开发)
  - [1. 前言](#1-前言)
  - [2. What's new in WWDC 2023 Safari extensions](#2-whats-new-in-wwdc-2023-safari-extensions)
    - [2.1 全新的API](#21-全新的api)
    - [2.2 per-site peermissions](#22-per-site-peermissions)
    - [2.3 Profiles and Private Browsing](#23-profiles-and-private-browsing)
  - [3. Safari web extension 发展历程](#3-safari-web-extension-发展历程)
    - [3.1 Safari App Extension](#31-safari-app-extension)
    - [3.2 WWDC 2020 Safari Web Extension](#32-wwdc-2020-safari-web-extension)
    - [3.3 WWDC 2021 Safari Web Extension on iOS](#33-wwdc-2021-safari-web-extension-on-ios)
    - [3.4 WWDC 2022 Safari Web Extension Manifest V3 and declarative net request](#34-wwdc-2022-safari-web-extension-manifest-v3-and-declarative-net-request)
  - [4. Safari web extension \& Chrome web extension](#4-safari-web-extension--chrome-web-extension)
    - [4.1 关于Manifest V2 和Manifest V3](#41-关于manifest-v2-和manifest-v3)
    - [4.2 关于实现AdBlock功能](#42-关于实现adblock功能)
    - [4.3 关于把Chrome插件带到Safari上来](#43-关于把chrome插件带到safari上来)
  - [5. 总结](#5-总结)

<!-- /code_chunk_output -->




## 1. 前言

在WWDC 2020和WWDC 2021， 苹果宣布了支持Chrome风格的Safari Web Extension， 开发者可以把Chrome插件带到macOS和iOS的Safari上，在WWDC 2022上， Safari Web Extension又有了新的变化，引入了Manifest V3， 并且支持了 declarative net request， 这使Safari Web Extension越来越接近Chrome Extension。
本文将介绍WWDC 2023 Safari Web Extension的新特性，以及Safari Web Extension的发展历程，最后介绍Safari Web Extension和Chrome Extension的区别。

## 2. What's new in WWDC 2023 Safari extensions
Safari Web Extension 是苹果生态中Safari插件的最好实现方式，可以支持iOS, iPadOS, macOS 以及最新最新的xrOS。 尤其在xrOS上， 可以使用完整的Safari Web Extension API， 支持植入Javascript脚本， 在后台运行， 展示弹窗等功能。

### 2.1 全新的API
### 2.2 per-site peermissions
### 2.3 Profiles and Private Browsing


## 3. Safari web extension 发展历程
苹果生态的浏览器插件经历了Safari Extension， Safari App Extension到Safari Web Extension的发展， 其中Safari Exttension已经废弃了， Safari App Extension和Safari Web Extension仍然都苹果生态中的浏览器插件支持的实现方式， 但是如果想要支持开发一款支持苹果全家桶的浏览器插件，或者把其他平台的浏览器插件带到苹果生态中， Safari Web Extension是唯一的选择。
苹果也希望开发者能够使用Safari Web Extension， 把更多的插件带到Safari上来。

### 3.1 Safari App Extension
### 3.2 WWDC 2020 Safari Web Extension
### 3.3 WWDC 2021 Safari Web Extension on iOS
### 3.4 WWDC 2022 Safari Web Extension Manifest V3 and declarative net request


## 4. Safari web extension & Chrome web extension
 到这一次的wwdc， Safari平台的浏览器插件已经和Chrome平台的愈加相像了， 开发者可以轻松的把一些Chrome平台的插件带到Safari上来，但是其中自然也有一些区别，这些区别可能也是当下Safari平台生态仍然不够百花齐放的原因。

 ### 4.1 关于Manifest V2 和Manifest V3
 ### 4.2 关于实现AdBlock功能
 ### 4.3 关于把Chrome插件带到Safari上来

## 5. 总结
以上就是关于WWDC 2023 Safari Web Extension的介绍， 以及和Safari Web Extension的一些额外知识，可以看到， 苹果在Safari 插件方面正在日趋完善， 虽然仍然达不到 Chrome平台那样的高度定制化，但是这就是苹果的做派，开发者只能带着“镣铐”把舞蹈跳好， 希望Safari上能出现更多更好的插件， 也希望苹果能够在Safari Web Extension上继续努力， 为开发者提供更好的支持。
