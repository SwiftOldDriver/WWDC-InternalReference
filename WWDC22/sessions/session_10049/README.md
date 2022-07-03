---
session_ids: [10049]
---

# Session 10049 - 探索 iOS 16 中 WKWebView 的新功能

> 作者：Style 月月， iOS 程序媛，简书/掘金文章贡献者，目前任职于小米，侧重于海外相关业务；
> 审核：JonyFang，方春，老司机技术社区核心成员，现于 BILIBILI 负责直播稳定性及性能优化相关工作；

本文是根据 WWDC22 中的 [What's new in WKWebView](https://developer.apple.com/videos/play/wwdc2022/10049/) 撰写，主要是了解 WKWebView 在 iOS 16 中的新增功能。

## 引言

针对 WKWebView 的介绍，这里就简单说明下，WKWebView 是 iOS 8 中新增的用于展示 H5 的 UI 控件，在 iOS 12 中全面推广用于替代 UIWebView。UIWebView 与 WKWebView 的架构上最大的区别是：UIWebView 的方法是`同步`的，而 WKWebView 的方法是`异步`的，所以相比而言 WKWebView 加载网页的性能是远优于 UIWebView 的。

这里简单说下为什么是「同步」和「异步」的。首先需要了解什么是`跨进程通信`（Inter-Process Communication，IPC）。IPC 是指两个进程的数据之间的交互，一般来说，IPC 至少需要 2 个进程参与，根据信息流动的方向，被称为`发送者`和`接受者`。在实际应用中，IPC 常被用于服务调用，而参与 IPC 的被称为调用者（客户端）和被调用者（服务端），如下所示
![简单的 IPC 图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_25.jpg)

多进程协作主要有以下优点：

- 将功能模块化，避免重复造轮子；
- 增强模块间的间隔，提高更强的安全保证
- 提高应用的容错能力

进程间通信分类主要分为`同步 IPC` 和`异步 IPC`。简单来说，同步 IPC 是指它的 IPC 操作会阻塞进程，知道该操作完成，这种方式典型的问题就是并发的处理。而异步 IPC 是指它的 IPC 操作是非阻塞的，进程只要发起一次操作即可返回，而不需要等待其完成，这种方式解决了同步中的并发问题。通常来说，大部分操作系统都会同时具备这两种 IPC，以满足不同的需求。基于上述理论，下面来分别对 WebView 的同步和异步做简单说明：

- 在使用 UIWebView 时，它和 App 处于同一个进程，加载页面所占的内存被计算为 App 内存的一部分。当 App 超过了系统分配的内存时，由于 UIWebView 的方法是 同步的，且处于同一个进程中，该进程会被阻塞，导致 App 被操作系统 Crash 掉，虽然我们可以监听系统的通知防止 App 被系统杀掉，但也会出现通知不够及时，或者来不及通知的情况，这就是 UIWebView 的弊端。
- 对于 WKWebView，与 UIWebVIew 最大的变化就是多进程模型（即多进程组件）。当 WKWebVIew 在运行时，会从 App 内存中分离内存到单独的进程中，其核心模块运行在独立的进程中，与 App 进程保持独立。当 Web 的内存超过了系统分配给 WKWebView 的内存时，会导致 WKWebView 浏览器崩溃白屏，但 App 不会 Crash，此时 App 会收到系统通知，我们可以尝试去重新加载页面。

对于使用，如果只是想实现内嵌浏览器的体验，且无需深度定制，首选 `SFSafariViewController`。如果想要高度定制，或者与 Web 内容进行交互，就需要使用 `WKWebView`了。这里不建议再使用 UIWebView 了，因为 UIWebView 将会在未来的某个版本中进行删除，所以仍在使用 UIWebView 的项目需要尽早完成替换。

如果对 WKWebView 了解的还不够全面，建议回顾下往期 WWDC 中关于 WKWebView 的解读，分别是：

- [发掘 WKWebView 的神奇妙用](https://xiaozhuanlan.com/topic/2619738450) ，介绍了 iOS 14 中新增的 JS 与 Native 的交互能力。
- [探索 WKWebView 新增功能](https://xiaozhuanlan.com/topic/1352486079)，介绍了 UIWebView、WKWebView、SFSafariViewController 的使用方式，以及 iOS 15 中新增的功能。

综合往期 WKWebView 的更新，绘制了以下更新的图示（包含本文新增的功能）：
![WKWebView发展历程图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.9/img/wwdc_session_10049/session_10049_27.png)

## WKWebView 的新功能

根据 [What's new in WKWebView](https://developer.apple.com/videos/play/wwdc2022/10049/) 解读可知，iOS 16 中新增的功能主要分为 4 种：
![iOS 16 新增功能图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_03.jpg)

- Web content interaction：与 Web 内容交互的新方式
- Content blocking：内容拦截器的新功能
- Encrypted media：加密媒体
- Remote Web Inspector：允许三方浏览器远程调试 Web

下面针对上述的更新，分别进行一一说明。

## 与 Web 内容交互的新方式

首先介绍 iOS 16 用于 Web 交互的 API，为 App 与 Web 的交互提供了更多的可能性。主要有以下 3 种交互的新方式：
![新增 Web Content 交互方式](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_04.jpg)

- Fullscreen support 全屏 API；
- CSS viewport units 新的 CSS 视口单元；
- Find interactions 查找交互。

### 全屏 API（ Fullscreen support  ）

一直以来，在浏览器中展示的视频、游戏等都可以通过 HTML 元素使其实现全屏。现在 App 内嵌的 H5 页面中也可以做到这一点了。苹果官方提供了一个简单的例子，点击 full screen 按钮，就可以将图片全屏展示，效果如下所示：
![官方全屏 API 示例效果](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_05.gif)

其关键代码如下所示，主要分别 3 步：
![全屏 API 关键代码](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_06.jpg)

- 将 `WKPreferences` 的 `isElementFullscreenEnabled` 属性设置为 `true`，表示是否启用元素的全屏展示；
- 加载 Web 内容，并通过 JS 添加按钮事件，即点击按钮使用全屏 API；
- 如果对默认的过渡动画不满意，想要实现自定义过渡动画，可以通过监听 WKWebView 的 **fullscreenState** 来实现，该属性让 App 可以准确的知道网页内容何时全屏或返回。

**演示**

下面通过自定义实现一个 H5 页面，在 H5 页面中有一个按钮和图片，然后点击按钮实现图片全屏展示。其最终效果如下：
![演示案例效果图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_07.gif)

- 简单实现一个 HTML 页面，核心代码如下：

```html
<script>
    function init() {
        //1. 获取canvas元素
        var canvas = document.getElementById("clock");
        //2. 获取2D上下文
        var ctx = canvas.getContext('2d');
        //3. 新建一个Image对象
        var img = new Image();
        //4. 设置Image的src
        img.src = "test.png";
        //5. 确定Image加载完毕后将Image画到canvas上
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 300, 300);
        }
        
        //获取button元素
        var button = document.getElementById('full_screen');
        //button元素添加点击事件
        button.addEventListener('click', function() {
            canvas.webkitRequestFullscreen()
        }, false);
    }
</script>

 <body onload="init()">
    <canvas id="clock" width="300" height="300"></canvas>
    <button id="full_screen">enter fullscreen</button>
</body>
```

- 通过 WKWebView 加载本地 HTML 页面的，关键代码如下：

```swift
self.webView = WKWebView.init(frame: self.view.frame)
self.view.addSubview(self.webView)
//启用元素的全屏展示
self.webView.configuration.preferences.isElementFullscreenEnabled = true
//方式一:通过load加载
if let url = Bundle.main.url(forResource: "01-web交互方式", withExtension: "html") {
    let request = URLRequest(url: url)
    webView.load(request)
}
 
//监听 fullscreen状态
let observation = webView.observe(\.fullscreenState, options: [.new]) { object, change in
    print("fullscreenState: \(object.fullscreenState)")
}
```

除了通过 load 方法加载 HTML 页面，还可以通过 webView.loadHTMLString 加载。

```
//方式二：loadHTMLString
// 将页面内容转成string
let htmlString = try! String(contentsOfFile: Bundle.main.path(forResource: "01-web交互方式", ofType: "html")!, encoding: String.Encoding.utf8)
// 通过webview加载
webView.loadHTMLString(htmlString, baseURL: Bundle.main.resourceURL)
```

> **使用场景**
> 1、应用于 App 中通过 H5 上传图片的功能，便于核对信息的准确性；
> 2、Fullscreen 结合 canvas 应用到 H5 页面游戏中，提升用户游戏体验。

### 新增 CSS 视口单位（CSS viewport units）

在介绍 CSS 新增的视口单位前，我们先来了解下什么是[视口](https://baike.baidu.com/item/%25E8%25A7%2586%25E5%258F%25A3/1626773)，常见的视口单位有哪些。

#### 什么是视口

viewport 就是网页的容器，决定了多大的空间来渲染页面。简单理解就是网页的可视区域，简称为`视口`或`视区`。

- 在 PC 端，视口指的是`浏览器的可视区域`；
- 在移动端，涉及 3 个视口：Layout Viewport（布局视口），Visual Viewport（视觉视口），Ideal Viewport（理想视口）。其中视口单位中的视口指的是 viewport 中的 `Layout Viewport（布局视口）`。

#### 常见视口单位

根据 CSS3 的规范，视口单位主要包含以下 6 种

- `vw（viewport width，视口宽度）`：是相对视口的宽度而定，1vw 等于视口宽度的 1%；
- `vh（viewport height，视口高度）`：是相对视口的高度而定，1vh 等于视口高度的 1%；
- `vmin（viewport minimum，视口最小值）`：是相对于视口的高度和宽度两者之间的最小值，选取 vw 和 vh 中最小的那个；
- `wmax（viewport maximum，视口最大值）`：是相对于视口的高度和宽度两者之间的最大值，选取 vw 和 vh 中最大的那个。
- `vi（viewport inline，视口行内轴宽度）`：是视口内联方向长度的 1%，即初始包含块大小的 1%，在根元素的**行内轴（inline axis，简单理解就是 x 轴）**方向上。
- `vb（viewport block，视口区块轴高度）`：是视口块方向长度的 1%，即初始包含块大小的 1%，在根元素的**区块轴（block axis，简单理解就是 y 轴）**方向上。

#### 新视口单位

除了上述常见的视口单位外，iOS 16 中还新增了 20 种新的视口单位，其中包括 svh、lvh、dvh 等。
![新增 CSS 视口单位](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_08.jpg)

新增的视口单位主要用于`根据视口大小来布局 Web 内容`，它允许 Web 开发人员根据最小、最大和动态的视口大小来修改 Web 布局。下面是对新增视口单位的解释和说明

| viewport units | 全称 | 说明 |
|---|---|---|
| svh | small viewport height | 最小视口高度 |
| lvh | large viewport height | 最大视口高度 |
| dvh | dynamic viewport height | 动态视口高度 |
| svw | small viewport width | 最小视口宽度 |
| lvw | large viewport width | 最大视口宽度 |
| dvw | dynamic viewport width | 动态视口宽度 |
| vi | viewport inline | 视口行内轴（x 轴）宽度 |
| svi | small viewport inline | 最小视口行内轴宽度 |
| lvi | large viewport inline | 最大视口行内轴宽度 |
| dvi | dynamic viewport inline | 动态视口行内轴宽度 |
| vb | viewport block | 视口区块轴（y 轴）高度 |
| svb | small viewport block | 最小视口区块轴高度 |
| lvb | large viewport block | 最大视口区块轴高度 |
| dvb | dynamic viewport block | 动态视口区块轴高度 |
| svmin | small viewport minimum | 最小视口宽或高的最小值 |
| lvmin | large viewport minimum | 最大视口宽或高的最小值 |
| dvmin | dynamic viewport minimum | 动态视口宽或高的最小值 |
| svmax | small viewport maximum | 最小视口宽或高的最大值 |
| lvmax | large viewport maximum | 最大视口宽或高的最大值 |
| dvmax | dynamic viewport maximum | 动态视口宽或高的最大值 |

下面以 svh、lvh 和 dvh 一组为例，通过一张图示来了解其含义。

- 当首次在 Safari 浏览器中打开 H5 页面时（左侧模拟器），能看到 H5 页面和一些 Safari 底部按钮，此时的视口大小就是 `svh`（最小视口高度）；
- 当 H5 页面滚动时（右侧模拟器），即不展示 Safari 按钮时，视口的大小会增加，此时的视口大小就是 `lvh`（最大视口高度）；
- 而图中所示的 `dvh`（动态视口高度）就是介于 svh 和 lvh 中间的值。
![以 svh、lvh 和 dvh 为例](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_10.jpg)

当应用程序需要更改 WKWebView 视口大小，以便在 App 中正确布局 Web 内容时，需要提前通过 `WebKit` 的函数 `setMinimumViewportInset` 方法来告知视口的大小范围，示例如下：
![视口大小范围设置代码](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_11.jpg)

> **Tips**：这个功能的应用场景，尝试了下这么设置，然而并没什么变化，也可能是使用方式不对，个人猜测是用于自定义 Web 视图时，可以这么设置，如果是使用官方提供的，貌似没什么用。
> **使用场景**：可以降低同一个网页在跨端时的适配成本，由研发告知 web 的视口大小范围，在 web 中进行动态适配，而不用再像之前的方案需要在 H5 中根据固定的大小来分别进行适配。

### 查找交互（ Find interactions ）

查找交互，这个 Web 交互动作在 PC 端很常见，但在 iOS 16 以前的 App 中却不支持，之前仅支持 Copy（拷贝）、Look Up（查询，这里指的是网页、词典的查询）、Translate（翻译）、Share（分享）等，如下所示
![常见 Web 文本交互](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_12.jpg)

基于上述背景，同时 AppStore 中存在许多使用了 WKWebView 的 App，其展示的 H5 页面加载了大量的文本内容，因此为了方便用户在 H5 页面中搜索相应文本，在 iOS 16 中引入了对`查找交互`的支持。

如果想在自己 App 的内嵌 H5 内面中支持该功能，只需要将 WKWebView 的 `findInteractionEnabled` 属性设置为 `true`，就可以在 Web 上使用 CMD-F 等快捷键来搜索文本。除此之外，还可以通过 WKWebView 的 `findInteraction` 属性来访问 `UIFindInteraction` 对象，通过这个对象来执行查找和关闭查找等操作，或者通过编码的方式移动到上一个或者下一个查找结果，以下是官方示例
![实现查找交互的核心代码](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_13.jpg)

**演示**

在 Web 中打开百度网站的首页，然后随机选择一条新闻，开启文章内查找关键字，其最终效果如下所示
![演示案例效果](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_14.gif)

实现的关键实现如下

```swift
func setNavigation(){
    //设置 item 按钮
    let item = UIBarButtonItem(barButtonSystemItem: .search, target: self, action: #selector(findButtonTapped(_ :)))
    self.navigationItem.rightBarButtonItems = [item]
}
    
@objc func findButtonTapped(_ sender: UIBarButtonItem) {
    //获取查找交互对象
    if let interaction = self.webView.findInteraction {
        //弹出查找交互面板
        interaction.presentFindNavigator(showingReplace: false)
    }
}
    
func testFindInteraction(){
    
    //开启查找交互
    self.webView.isFindInteractionEnabled = true
    
    let request = URLRequest(url: URL(string: "https://www.baidu.com")!)
    self.webView.load(request)
}
```

## 内容拦截器新功能（ Content blocking ）

除了用户交互方式的增加，iOS 16 中还为 `WKContentRuleList` 添加了新的功能，不过在介绍新功能前，首先需要了解下 WKContentRuleList。

### WKContentRuleList 介绍 & 使用

[WKContentRuleList](https://developer.apple.com/documentation/webkit/wkcontentrulelist?language=objc) 最开始是在 Safari Extension 中被引入（具体可参考 [Creating a Content Blocker](https://developer.apple.com/documentation/safariservices/creating_a_content_blocker?language=objc)），是用于在 Safari 浏览器中实现内容拦截的 API，主要是`对 Web 内容添加一些自定义的过滤规则，用于阻止浏览器窗口中的内容`，阻止行为包括隐藏元素、阻止加载以及从 Safari 请求中剥离 cookie 等，这个功能从 iOS 11 开始同样适用于 WKWebView，其工作流程如下所示
![content blocking 工作流程图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_26.jpg)

**使用方式**

其原理就是提供一个 JSON 给 WebKit，这个 JSON 由多个规则组成一个规则数组，每个规则都是一个 JSON 对象，JSON 对象中包含`内容规则的触发器（trigger）`和`对应的操作（action）`。然后 WebKit 会将拦截规则编译成高效的为`二进制代码`，对展示的 Web 内容进行相应处理，其中 JSON 格式如下所示

```json
[
    {
        "trigger": {
            ...
        },
        "action": {
            ...
        }
    },
    {
        "trigger": {
            ...
        },
        "action": {
            ...
        }
    }
]
```

下面来分别说下 trigger 和 action

**trigger**

trigger（规则触发器）字典必须主要用于定义拦截规则，其中必须包含 `url-filter（匹配 URL 的正则表达式）` 键，可选的键有 `resource-type（资源的类型）` 、`if-domain（规则只在这些域名下起作用）`、 `unless-domain（这些域名除外）`等。其格式如下所示

```
"trigger": {
        "url-filter": ".*",
        "resource-type": ["image", "style-sheet"],
        "unless-domain": ["your-content-server.com", "trusted-content-server.com"]
}
```

下面介绍一些常用的键

- 对于 `url-filter` 键，不仅可以匹配特定的 URL，还可以使用正则表达式，其正则规则如下

| url-filter | 说明 |
|---|---|
| .* | 匹配所有带有点的字符串出现零次或多次，使用此语法匹配每个 URL |
| . | 匹配任何字符 |
| \. | 显式匹配点字符 |
| [a-b] | 匹配一系列字母字符 |
| (abc) | 匹配指定字符的组 |
| + | 与前一项匹配一次或多次 |
| * | 与前面的字符匹配零次或多次 |
| ? | 与前面的字符匹配零次或一次 |

- 对于 `resource-type` 键，表示规则应匹配的资源类型（浏览器打算如何使用资源）的字符串数组。如果未指定，则规则匹配所有资源类型。有效值：document, image, style-sheet, script, font, raw（任何无类型加载）, svg-document, media, popup, ping, fetch, websocket, other（类似 raw，但不包括 fetchor websocket）。

- 对于 `if-domain` 键，是与 URL 的域匹配的字符串数组，表示规则只作用于数组内的域名。其值必须是小写的 ASCII，或非 ASCII 的 Punycode。在前面添加 * 以匹配域和子域。不能与 unless-domain 键一起使用。

- 对于 `unless-domain` 键，表示与 URL 的域匹配的字符串数组，表示作用于除提供列表中的域之外的任何站点。值必须是小写的 ASCII，或非 ASCII 的 Punycode。在前面添加*以匹配域和子域。不能与 if-domain 键一起使用。

- 对于 `load-type` 键，表示资源的归属，是一个字符串数组。如果未指定，默认是全部的资源，有以下两种取值：**first-party** 只有当资源和页面的 scheme、域名、端口一致时才触发。 **third-party** ：只有当资源和页面的域名不一致时才触发。

**action**

action（操作）只有两个有效字段：`type（类型）` 和 `selector（选择器）`，如果 type 是 `css-display-none`，则 selector 也是必需的；否则 selector 是可选的。其格式如下所示

```
"action": {
        "type": "css-display-none",
        "selector": "#newsletter, :matches(.main-page, .article) .news-overlay"
}
```

其中 type 的取值如下所示

| action type | 说明 |
|---|---|
| block | 放弃加载资源，如果该资源已经缓存也忽略缓存 |
| block-cookie | 所有发送的请求的 header 中都会过滤掉 cookie |
| css-display-none | 隐藏使用 CSS selector 的页面元素，同时还有关联的 selector |
| ignore-previous-rules | 前面触发的规则不执行 |
| make-https | 把网页里的 http 请求改为 https 请求 |

结合上述介绍，下面来进行实践，此处的代码是将 Web 的 http 请求改为 https，代码如下：

```swift
let request = URLRequest(url: URL(string: "http://www.baidu.com")!)
self.webView.load(request)

//JSON规则
let jsonString = """
[{
    "action":{"type":"make-https"},
    "trigger":{"url-filter":".*"}
}]
"""
// WebKit 会将拦截规则编译成高效的为二进制代码
WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "ContentBlockingRules", encodedContentRuleList: jsonString) { (contentRuleList, error) in
    if error != nil {
         return
    }
    let configuration = WKWebViewConfiguration()
    //将编译后的规则添加到用户配置中
    configuration.userContentController.add(contentRuleList!)
}
```

### WKContentRuleList 新增功能

在 iOS 16 中，苹果针对 `WKContentRuleList` 又添加了一项新功能，我们可以通过新功能来实现某个规则仅适用于某些 iframe 内的加载。

**官方演示**

将维基百科嵌入 H5 的 iframe 中，并编写一条规则来阻止维基百科中的图像。

1. 首先在 H5 页面中嵌入维基百科页面，在无拦截规则情况时，展示效果如下：
![未添加拦截规则的效果图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_17.jpg)

2. 在 JSON 规则的 trigger 中添加新增的 `if-frame-url` 键，并将其应用于 WKWebViewConfiguration，示例代码如下：
![Web 内容拦截的核心代码](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_18.jpg)

3. `if-frame-url` 键的正则表达式作用于发出请求的 URL 上，其效果如下所示，成功的阻止了维基百科的图像展示。
![添加拦截规则后的效果图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_19.jpg)

> **Tips**: 笔者尝试去实现官方的案例，但是并没有生效，感兴趣的小伙伴可以玩玩，成功了记得留言哈~
> **使用场景**：比如在同一个 App 中，同一个 H5 页面对应有两个不同版本，在不同国家展示不同版本，这里我们是通过一个 cookie 进行区分，但 cookie 的注入是全局的，因此这里可以通过定义过滤规则剥离 cookie，实现不同版本的展示。

## 加密媒体（ Encrypted media ）

> 由于作者对于加密媒体经验尚浅，所以这里仅做介绍，感兴趣的童鞋可以造作起来~

除了交互处理以及内容拦截，iPadOS 16 中的 WKWebView 中还新增了一个功能，即`加密媒体`。如果您有相关使用加密媒体扩展和媒体源扩展 API 的经验，现在可以在 iPadOS 上的 App 中使用。这意味着，如果您拥有 AppleTV+ 等优质内容，它将像 macOS 中一样，在 iPadOS 上工作。如下所示
![加密媒体案例图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_20.jpg)

## 允许三方浏览器远程调试 Web （ Remote Web Inspector ）

在这个功能之前，Apple 只允许在 Safari 中调试 App 中的内嵌 H5 页面。但在 iOS 16 中，您可以使用第三方浏览器在 debug 模式下，无需添加任何代码或更改任何代码就可调试 Web 页面，调试流程与 Safari 一样。相比之前单一的调试 Web 方式，这次增加了开发者更多的选择性，以及为跨端调试提供便利。

> 注：Safari 调试内嵌 H5 必须在 debug 模式下进行，release 环境下无法进行调试

**演示**

> 下面是以 Safari 浏览器调试 Web 页面为例。

如果您的 App 中有内嵌 H5 页面，您可以通过 macOS 中的 Safari 调试 App 中的 Web 页面，其操作步骤如下：

- 首先在 iOS 设备中开启 Web Inspector（Web 检查器），路径为：`设置 - Safari - 高级 - Web Inspector`，如下所示：
![iOS 设备开启 Web 调试](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_21.jpg)

- 在 macOS 上的 Safari 浏览器的高级设置中启用开发菜单，路径为：`偏好设置 - ☑️ 在菜单栏中显示“开发”菜单`，如下所示：
![Safari 启用开发菜单](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_22.jpg)

- 将手机连接到 Mac，并在 macOS 上的 Safari 浏览器的开发菜单中查找您的设备，如果此时 App 打开了内嵌的 Web，那么此时就能找到对应的 H5 页面进行调试了；
![iOS 设备开始调试 Web](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_23.jpg)

- 选择对应的域名后，会打开一个 Safari 调试窗口，其中有许多用于调试 Web 内容的工具，如下所示，您可以探索 DOM，运行和调试 JavaScript 的执行，查看页面加载的时间线、H5 页面内的网络请求等。
![Web 调试窗口图示](https://cdn.jsdelivr.net/gh/chenjialin1016/cdn@v2.3/img/wwdc_session_10049/session_10049_24.jpg)

## 总结

综上所述，WKWebView 新增点汇总如下：

1. Web content interaction：新增了 3 种交互方式，分别是 full screen、20 种新增的 CSS 视口单位以及查找交互功能；
2. Content blocking：新增了特定 URL 特定规则的拦截场景；
3. Encrypted media：可以像在 macOS 中一样在 iPadOS App 中加密媒体资源；
4. Remote Web Inspector：通过开启 Web 检查器，实现在第三方浏览器中调试 App 内嵌的 Web页面。
