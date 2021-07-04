##WWDC21 10027 - 探索 iOS Safari Web Extensions

本文基于 Session [10027](//developer.apple.com/videos/play/wwdc2021/10027/) 梳理

iOS15 苹果在 iOS 上支持了 Safari Web Extensions，在了解了如何在iOS 上使用 Safari Web Extensions，以及如何使用 xcode 编写拓展代码的基础上，本文将就最新的 WebExtension API展开说明。

* 前言
* 基础
* Safari Web Extensions 新增 API
    * 非持久性后台页面支持
    * 阻止 Web 上的内容
    * 自定义选项卡

####前言        
在 WWDC20 上，苹果宣布在 Safari 中支持 Chrome 风格的浏览器扩展, 开发者开发一个 Web 扩展，需要将拓展功能封装在一个 Mac 应用中。用户从应用商店安装应用即可安装网络扩展。我们可以理解为 Safari App Extensions 可在 macOS 应用程序和 Safari 之间共享代码，但拓展程序依然基于 JavaScript、HTML 和 CSS 开发。

那么在今年的 WWDC21 上，苹果将 Mac 中支持 Safari 拓展的支持带到了 iOS 上。换汤不能换药，开发流程和分发方式几乎一致，所以自然实现了开发者们可以轻易的使用一份拓展代码，分别分发到 Mac 或 iOS设备上。

####基础
1. 由于拓展插件主要基于 JavaScript、HTML 和 CSS 开发，需要我们掌握一些 Web 开发知识，可以移步 [w3school](https://www.w3school.com.cn) 学习对应内容。

2. 如何在 Xcode 设置 Web Extensions 的开发配置，在 Session [10104](https://developer.apple.com/videos/play/wwdc2021/10104) 中可看到详细介绍。

3. 后台页是指，在浏览器后台运行的脚本，称为后台页，它没有任何可见的 UI，但它可以对诸如打开选项卡或来自扩展另一部分的消息之类的事件做出反应。

####Safari Web Extensions 新增 API
####非持久性后台页
* 非持久性后台页面支持的必要性
在 Safari 15 之前拥有后台页的拓展应用为持久性后台页。这些后台页会一直运行在浏览器后台，那么当我们打开 N 个拥有后台页的拓展程序，就意味着同时拥有 N 个一直在运行的后台页，就像一个用户永远无法关闭的不可见选项卡，它们会消耗内存并增加 CPU 使用率。尤其在 iOS 设备上，由于资源限制，我们更加需要注意后台页对性能的影响。因此苹果认为 iOS 设备“必须”使用非持久性后台页。

* 非持久性后台页面机制：
非持久性后台页的生存期是围绕事件构建的。后台页注册事件监听器，以便对浏览器中发生的事件做出反应，如关闭选项卡或来自扩展另一部分的消息。这些事件有助于浏览器确定是否应该加载或卸载背景页。

* api应用实践：
 
    1. 在json文件中设置将 persistent 设置为 false

        ```
        "background": {
        "scripts": [ "background.js" ],
        "persistent": false
        }
        ```
        
    2. 添加后台页监听器，注意此处是在脚本顶层注册监听器，才可以生效。

        ```
        browser.runtime.onMessage.addListener((request) => {
        <!--业务代码-->
        });
        ```
        
    3. 程序开发中需要注意以下几点：
        * 因为后台页面可以被卸载，所以需要使用存储API根据需要将信息写入磁盘,在后台页的整个生命周期中维护信息的存储.
        * 不要在另一个事件侦听器的完成处理程序中注册侦听器
        * 使用 Alarms API 代替 Timer，因为如果后台页面已卸载，则不会调用计时器
        * 删除对浏览器的调用
        * webRequest 是一个允许分析 Web 流量的 API，而 webRequest 事件的触发频率使该 API 与非持久性背景页不兼容
        
####阻止 Web 上的内容
* 自2015年以来，Safari 一直支持使用 WebKit 内容规则列表构建的内容阻止程序扩展。今年有一些改进，然而，到目前为止，Web 扩展还没有那种快速、隐私保护、内容阻止的能力。而 Chrome 最近引入的声明性请求已经拥有了以上能力。

* 内容阻止规则是以JSON格式编写的。这些JSON规则在逻辑上被分组到称为规则集的文件中，JavaScript API 允许单独打开或关闭这些规则集。而且因为Chrome 也支持这个 API，所以可以编写一个内容拦截器，它可以在多个平台的多个浏览器中运行。

* 应用
阻止内容的权限
{
 ...
   "permissions": [
    "declarativeNetRequest",
    "activeTab"
  ],
  ...
}
将规则集添加到您的扩展和清单
{
   ...
   "declarative_net_request" : {
    "rule_resources" : [{
      "id": "ruleset_for_images",
      "enabled": true,
      "path": "image_rules.json"
    }, {
      "id": "ruleset_for_scripts",
      "enabled": false,
      "path": "script_rules.json"
    }]
  },
  ...
}

构建描述您希望如何阻止内容的规则，并将它们添加到您的规则集文件中。例如：
{
    "id": 1,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
        "regexFilter": ".*",
        "resourceTypes": [ "script" ]
    }
}

