# WWDC21 10032 - Explore WKWebView additions 探索 WKWebView 新增功能

本文目录

[TOC]

本文主要是根据 WWDC21 中的 [Explore WKWebView additions - session 10032](https://developer.Apple.com/videos/play/wwdc2021/10032/) 撰写，主要讲解 WKWebView 在 iOS 15 中新增的功能。

## 引言

在讲解 WKWebView 在 iOS 15 中新增功能之前，首先需要来捋捋 `UIWebView` 与 `WKWebView` 。

在实现原生 App 开发时，有时总是无法避免的需要浏览 H5 界面，可能还需要与 Web 内容进行交互。所以对于采用何种交互的方式，使用哪种内核，一直是我们所关注的点。

目前在原生 App 中显示 Web 内容，苹果提供了以下三种方式，分别是：

- `UIWebView`（适用于 iOS 2 - iOS 12 ）

- `WKWebView`（适用于 iOS 8 及以上）
- `SFSafariViewController`（适用于 iOS 9 及以上）

## UIWebView & WKWebView & SFSafariViewController

`UIWebView` 是苹果在 iOS 2 中推出用来展示网页的UI控件，同时也是最占内存的控件。 UIWebView 有以下特点：
- 1、加载速度慢；
- 2、内存占用多，内存优化困难。如果占用的内存超过系统的最大阈值，还会被系统 kill 掉；
- 3、需要自定义添加网页加载进度条。

在iOS 8以后苹果推出了 `WebKit` 框架，其中的 `WKWebView` 是现在官方推荐用于替代 UIWebView 的 UI 控件。 WKWebView 相比 UIWebView 有以下优势：
- 1、在性能、稳定性、占用内存方面有很大提升；
- 2、允许 JavaScript 的 Nitro 库并使用，这点在 UIWebView 中是限制的；
- 3、增加了加载进度属性`estimatedProgress`；
- 4、支持更多的 HTML5 特性；
- 5、与 Safari 具有相同的 JavaScript 引擎；
- 6、将`UIWebViewDelegate`与`UIWebView`拆分成了 14 类与 3 个协议，具体的详情可以[参考官方文档](https://developer.Apple.com/documentation/Webkit)。

在 iOS 12 中，苹果全面`弃用 UIWebView` 后的替代方案可以参考 [Replacing UIWebView in Your App](https://developer.Apple.com/documentation/Webkit/replacing_uiWebView_in_your_App) 。这里需要注意以下几点：
- 1、如果只需要在App内浏览Web内容，且不要进行深度定制，即不需要与Web内容进行深度交互，此时 [SFSafariViewController](https://developer.Apple.com/documentation/Safariservices/sfSafariviewcontroller) 是一个很好的选择，因为它包含了Safari浏览器中的所有功能；
- 2、如果需要对用户进行验证，那么请使用  [ASWebAuthenticationSession](https://developer.Apple.com/documentation/authenticationservices/asWebauthenticationsession) ；
- 3、如果需要显示地图或者地图图块，请考虑使用 [MKMapView](https://developer.Apple.com/documentation/mapkit/mkmapview) ；
- 4、如果需要进行高度定制化，或需要与Web内容进行深度交互，此时推荐使用 [WKWebView](https://developer.Apple.com/documentation/Webkit/wkWebView) 。

下面分别来讲解下 `UIWebView & WKWebView` 、 `SFSafariViewController` 的使用。

### UIWebView & WKWebView的使用

主要介绍 UIWebView & WKWebView 的`使用步骤`以及`实用方法`、`代理方法`以及`与 JS 的交互`。

#### 简单使用

两种控件的简单使用主要分为 4 步：
- 1、创建 WebView，并设置大小
- 2、创建请求
- 3、加载网页
- 4、将 WebView 添加到界面中

下面以 `WKWebView` 为例，除了使用的控制不一样，其他都是一致的。

```Swift 
func createWKWebView(){
    //1、创建WebView，并设置大小
    let wkWebView = WKWebView(frame: self.view.bounds)
    //2、创建请求
    let request = URLRequest(url: URL(string: "https://www.baidu.com")!)
    //3、加载网页
    wkWebView.load(request)
    //4、添加到界面
    self.view.addSubview(wkWebView)
}
```


#### 实用函数

实用函数主要包括`加载网页`、`网页导航刷新`等函数。

##### 加载函数

- `UIWebView`不仅可以加载 HTML 页面，还支持 pdf、word、txt 以及各种图片的显示；

- 相比 UIWebView 而言，`WKWebView` 也支持各种文件格式，并新增了`加载本地文件`，即新增了 `LoadFileURL` 函数。

如下表所示

| UIWebView 加载函数 | WKWebView 加载函数 | 说明 |
|---------------|---------------|----|
|     loadRequest(_:) | load(_:)              |  加载网页请求  |
|loadHTMLString(_:baseURL:)|loadHTMLString(_:baseURL:)|加载本地 HTML 文件|
|load(_:mimeType:textEncodingName:baseURL:)|load(_:mimeType:characterEncodingName:baseURL:)|加载文件，并指定 MIME 类型和编码类型|
| -|loadFileURL(_:allowingReadAccessTo:)|加载本地文件(适用于 iOS 9 及以上)|

##### 网页导航刷新相关函数

- UIWebView 和 WKWebView 都有 3 个属性（ `canGoBack` 、`canGoForward` 、`isLoading` ）

| UIWebView 网页导航相关 | WKWebView 网页导航相关 | 说明 |
|-----------------|-----------------|----|
|canGoBack|canGoBack|是否可以后退|
|canGoForward|canGoForward|是否可以前进|
|isLoading|isLoading|是否正在加载|

- 除了属性之外，还有4个方法（ `reload` 、 `stopLoading` 、 `goBack` 、 `goForward` ），区别在于 WKWebView 的方法是有返回值的（ stopLoading 除外），返回值类型为 `WKNavigation` ，主要用于`跟踪网页加载进度`。

- 同时 `WKWebView` 还增加了两个函数 `reloadFromOrigin` 和 `go(to item:)` 。

| UIWebView 网页导航相关 | WKWebView 网页导航相关 | 说明 |
|-----------------|-----------------|----|
|reload|reload|刷新|
|stopLoading|stopLoading|停止加载|
|goBack|goBack|后退|
|-|reloadFromOrigin|会比较网络数据变化，如果没有变化，则使用缓存，否则重新请求|
|-|go(to item:)|跳转到某个指定的历史界面|

#### 代理协议

- UIWebView 的代理协议主要是`UIWebViewDelegate`；
- WKWebView 的代理协议主要有 3 个，分别是 `WKNavigationDelegate、WKUIDelegate` 和 `WKScriptMessageHandler` 。

##### UIWebViewDelegate & WKNavigationDelegate

其中 `UIWebViewDelegate` 和 `WKNavigationDelegate` 的等效项如下所示

| **UIWebViewDelegate** | **WKNavigationDelegate** | **说明** |
| --- | --- | --- |
| WebViewDidStartLoad(_:) | WebView(_:didStartProvisionalNavigation:) | 开始加载网页 |
| WebViewDidFinishLoad(_:) | WebView(_:didFinish:) | 网页加载完成 |
| WebView(_:didFailLoadWithError:) | WebView(_:didFailProvisionalNavigation:withError:) | 网页加载错误 |
||**或** WebView(_:didFail:withError:)||
| WebView(_:shouldStartLoadWith:navigationType:) | WebView(_:decidePolicyFor:decisionHandler:) | 是否允许加载网页，或者获取JS即将打开的URL，通过截取此URL可与JS交互 |
||**或** WebView(_:decidePolicyFor:decisionHandler:)||

> 注意：
> - 1、`WebView(_:decidePolicyFor:decisionHandler:)` 并不像 `UIWebViewDelegate`中等效的函数返回 BOOL，而是通过 `decisionHandler` 决定是否可以跳转，返回 allow 或者 cancel 。
>    - `WKNavigationActionPolicy.cancel` ：取消跳转
>    - `WKNavigationActionPolicy.allow` ：允许跳转

> - 2、两个 `WebView(_:decidePolicyFor:decisionHandler:)` 外表看着差不多，其实质的区别在于第一个参数
>    - `WKNavigationAction`：网页信息
>    - `WKNavigationResponse`：网页响应

除此之外，`WKNavigationDelegate` 还有一个代理函数。

```Swift
//开始获取到网页内容时返回
func WebView(WKWebView, didCommit: WKNavigation!)
```

**演示**

下面分别以 UIWebView 和 WKWebView 来进行网页拦截的演示
- UIWebView 拦截网络请求

```
func WebView(_ WebView: UIWebView, shouldStartLoadWith request: URLRequest, navigationType: UIWebView.NavigationType) -> Bool {
    let url = request.url
    if url?.scheme == "xxx" {
        //拦截相应请求后的操作
        
        return false
    }
    return true
}
```
- WKWebView 拦截网络请求

```
func WebView(_ WebView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    let url = navigationAction.request.url
    if url?.scheme == "xxx" {
        //拦截相应请求后的操作
        
        decisionHandler(.cancel)
    }
    decisionHandler(.allow)
}
```

##### WKNavigationDelegate & WKScriptMessageHandler

- `WKScriptMessageHandler` 是必须实现的函数，是用于`App 与 JS 的交互`，提供从网页中收消息的回调方法，如下所示；

| WKScriptMessageHandler 代理方法|说明|
|-----------------------------|---|
| userContentController(_:didReceive:) |    响应从网页的 JavaScript 代码发送的消息。使用 message 参数获取消息内容并确定原始 Web 视图。|

- `WKUIDelegate` 是 UI 界面相关的代理协议，主要用于处理三种提示框：输入、确认、警告。因为在 UIWebView 中，Alert、Confirm、Prompt 等视图是可以直接执行的，但在 WKWebView 上，需要通过这个协议接收通知，然后通过 iOS 原生执行，即需要将 Web 提示框拦截然后再通过原生做处理。

| WKUIDelegate 代理方法 | 说明 |
|--------------------|----|
|WebView(_:createWebViewWith:for:windowFeatures:)    |  创建一个新的WebView  |
|WebView(_:runJavaScriptAlertPanelWithMessage:initiatedByFrame:completionHandler:)|调用 JS 的 alert 方法|
|WebView(_:runJavaScriptConfirmPanelWithMessage:initiatedByFrame:completionHandler:)|调用JS的confirm方法|
|WebView(_:runJavaScriptTextInputPanelWithPrompt:defaultText:initiatedByFrame:completionHandler:)|调用 JS 的 prompt 方法|
|WebViewDidClose(_:)|通知 App，DOM 窗口已成功关闭 |

其中`WebView(_:createWebViewWith:for:windowFeatures:)`经常用于在项目中处理 H5 界面中含有 `target = __blank` 标签（表示新建一个页面打开网页）或者网页中`点击无响应`的情况，其处理逻辑主要是判断目标主视图是否为空，如果不为空则允许导航。

```Swift
func WebView(_ WebView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    //如果目标主视图不为空，则允许导航
    if navigationAction.targetFrame?.isMainFrame == nil {
        WebView.load(navigationAction.request)
    }
    return nil
}
```

而输入、确认、警告弹框的常规处理如下所示

```Swift
//调用JS的alert方法
func WebView(_ WebView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
    let alertVC = UIAlertController(title: "提示", message: message, preferredStyle: .alert)
    alertVC.addAction(UIAlertAction(title: "确认", style: .default, handler: { action in
        completionHandler()
    }))
    present(alertVC, animated: true)
}

//调用 JS 的 confirm 方法
func WebView(_ WebView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
    let alertVC = UIAlertController(title: "提示", message: message, preferredStyle: .alert)
    alertVC.addAction(UIAlertAction(title: "确认", style: .default, handler: { action in
        completionHandler(true)
    }))
    alertVC.addAction(UIAlertAction(title: "取消", style: .cancel, handler: { action in
        completionHandler(false)
    }))
    present(alertVC, animated: true)
}

//调用 JS 的 prompt 方法
func WebView(_ WebView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
    let alertVC = UIAlertController(title: prompt, message: "", preferredStyle: .alert)
    alertVC.addTextField { textFiled in
        textFiled.text = defaultText
    }
    alertVC.addAction(UIAlertAction(title: "完成", style: .default, handler: { action in
        completionHandler(alertVC.textFields?[0].text ?? "")
    }))
    present(alertVC, animated: true)
}
```

#### 与 JavaScript 的交互

分别讲解 UIWebView 与 WKWebView 是如何与 JS 交互的。

##### UIWebView 与 JS 交互
- iOS 6 之前，`UIWebView` 是不支持共享对象的，Web 端需要通知 Native，需要通过修改 location.url，利用跳转询问协议来间接实现，通过定义 URL 元素组成来规范协议。
- iOS 7 之后，新增了 `JavaScriptCore` 库，内部有一个 `JSContext` 对象，可以用它来实现共享。

综上所述，UIWebView 与 JS 的交互，是通过 JavaScriptCore 库中的 `JSContext` 对象。

**JS 执行原生代码**

JS 是不能执行 OC 代码的，但是可以`间接的执行`，即 JS 将需要执行的操作封装到网络请求中，然后原生代码中拦截这个请求，获取 url 中的字符串解析即可，这里需要用到 `WebView(_:shouldStartLoadWith:navigationType:)` 这个代理方法。

```Swift
//假设需要拦截的请求地址为：ios://sendMessage:message2:?200&300
func WebView(_ WebView: UIWebView, shouldStartLoadWith request: URLRequest, navigationType: UIWebView.NavigationType) -> Bool {
    guard let url = request.url else{
        return false
    }
    //获取请求路径
    let scheme = url.absoluteURL.scheme
    if (scheme == "ios") {
        //获取协议后的路径 path = sendMessage:message2:?200&300
        let path = url.absoluteURL.path
        //方法名 methodName = sendMessage:message2:
        let methodName = path.replacingOccurrences(of: "/", with: "")
        //参数 200&300
        let start = url.absoluteString.range(of: "?")
        let paramsStr = url.absoluteString[start!.upperBound...]
        var params: [String]?
        if paramsStr.count > 0 {
            params = paramsStr.components(separatedBy: "&")
        }
        //调用本地函数
        self.perform(NSSelectorFromString(methodName), with: params)
        return false
    }
    print("加载其他请求")
    return true
}
```

**原生调用 JS 代码**

原生条用 JS 代码需要用到 UIWebView 的一个方法，即 `stringByEvaluatingJavaScript(from:)` 函数。

```Swift
//获取网页 Title，并赋值给原生的导航控制器
func WebViewDidFinishLoad(_ WebView: UIWebView) 
{
	//获取网页 title
    self.navigationItem.title = WebView.stringByEvaluatingJavaScript(from:"document.title")
}
```

##### WKWebView 与 JS 交互
- 在 WKWebView 上，Web 的 window 对象提供 `WebKit` 对象实现共享；
- 而 WKWebView 绑定共享对象，是通过特定的构造方法实现，即通过指定 `WKUserContentController` 对象的 `ScriptMessageHandler` 经过 `Configuration` 参数构造时传入；
- 而 Handler 对象需要实现指定协议，实现指定的协议方法，当 JS 端通过 `window.Webkit.messageHandlers` 发送 Native 消息时，handler 对象的协议方法被调用，然后通过协议方法的相关参数传值。

综上所述，WKWebView 与 JS 的交互，是通过 `WKScriptMessageHandler` 协议的代理方法进行的。

 **JS 执行原生代码**
 
 需要通过 `WKScriptMessageHandler` 代理中的函数实现，即需要使用 `userContentController:didReceiveScriptMessage` 代理方法。

```Swift
<!--1、JS 方法中传递一些参数-->
function btnClick1() {
    window.Webkit.messageHandlers.showMessage1.postMessage(null);
}
function btnClick2() {
    window.Webkit.messageHandlers.showMessage2.postMessage(['两个参数One', '两个参数Two']);
}

<!--2、原生代码中获取 JS 信息-->
// 设置偏好设置
let config = WKWebViewConfiguration()
config.preferences.minimumFontSize = 10
//是否支持 JS
config.preferences.javaScriptEnabled = true
//不通过用户交互，是否可以打开窗口
config.preferences.javaScriptCanOpenWindowsAutomatically = false

let userCC = config.userContentController
//添加消息处理的 handler 的 name
userCC.add(self, name: "showMessage1")
userCC.add(self, name: "showMessage2")

<!--3、JS 方法调用时，原生代码中会执行以下代理方法-->
func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage){
    if (message.name == "showMessage1") {
        //没有参数
    }
    if message.name == "showMessage2" {
        let array: [String] = message.body as! [String]
        let info = String(format: "有两个参数：%@， %@", array.first!, array.last!)
    }
}

deinit 
	//释放
    let controller = self.wkWebView.configuration.userContentController
    controller.removeAllScriptMessageHandlers(from: "showMessage1")
    controller.removeAllScriptMessageHandlers(from: "showMessage2")
}
```

**原生调用 JS 代码**

通过 WKWebView 中的一个方法实现，即 `evaluateJavaScript(_:completionHandler:)` 函数。

```Swift
//原生调用 JS 方法
wkWebView.evaluateJavaScript("showAlert('一个弹框')") { item, error in }

//注入 JS 代码
let jsString = "function getMessage() { alert('abcd'); }"
let noneSelectScript = WKUserScript(source: jsString, injectionTime: .atDocumentStart, forMainFrameOnly: false)
//将自定义 JS 加到配置中
userCC.addUserScript(noneSelectScript)
```

#### UIWebView & WKWebView 的性能分析
分别使用 UIWebView 和 WKWebView 加载网页，查看其内存情况。

- UIWebView 加载网页时的内存情况
![image.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624336319083-a8c1a062-da2a-4fa6-9a7a-b783a2f15047.png#height=439&id=DZNdT&margin=%5Bobject%20Object%5D&name=image.png&originHeight=506&originWidth=750&originalType=binary&ratio=1&size=68389&status=done&style=none&width=650)

- WKWebView 加载网页时的内存情况
![image.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624336327737-baf9be37-f6ce-4f9e-bc79-10dcca56cf1f.png#height=446&id=NRpcP&margin=%5Bobject%20Object%5D&name=image.png&originHeight=515&originWidth=750&originalType=binary&ratio=1&size=63882&status=done&style=none&width=650)

**结论**

从图中可以看出，UIWebView 相比 WKWebView 几乎有 10 倍之差，当涉及的 H5 界面较多时，如果使用 UIWebView，其占用的内存可想而知是很大的，所以这也是为什么苹果弃用 UIWebView，改用 WKWebView 的原因。

#### H5 与 App 的动态交互
目前 App 的多数点击事件都是在代码中写死的。例如点击一个区域需要弹框，或者跳转一个界面等，这些在最初是写死的，如果要更改就需要进行代码修改。为了更加灵活的测试、发版，在项目中引入了 `Command` 方案。

Command 的本质就是一条 `scheme 格式`的字符串指令，主要通过后端下发或者前端通过 JS 交互传递给 App。然后 App 通过解析这条指令，执行相应的行为，从而实现动态的事件处理。

##### 基本格式
command 的基本格式如下所示

```
cjl://CJLXXXXCommand?action=xxxx&params=xxxxx&callback=xxxx
```
- `CJLXXXXCommand`：App 中的执行 Command 的类名
- `action`：command 执行的动作，是 CJLXXXXCommand 类中的一个函数
- `params`：执行 command 所需的参数，简单来说就是函数的形参
- `callback`：command 执行完后的回调，由 H5 任意命令，用于将执行结果告知 H5，

**演示**

例如，想在 App 中打开一个浏览器

- 1、服务器下发的 command 如下所示

```
cjl://CJLUniversalCommand?action=openWebView&params=%7b%22url%22%3a%22https%3a%2f%2fwww.qq.com%22%7d&callback=result
```

- 2、在 `CJLUniversalCommand` 类中的处理如下所示

```
struct OpenCommandModel{
    var url: String
    var scheme: String
    var params: [String: String]
}

protocol OpenCommandDelegate {
    func handleOpenCommand(_ model: OpenCommandModel)
}

class CJLUniversalCommand: NSObject, OpenCommandDelegate{
    var openCommandM: OpenCommandModel!
    
    func handleOpenCommand(_ model: OpenCommandModel){
        self.openCommandM = model
        let sel = NSSelectorFromString(self.openCommandM.params["action"] as! String)
        self.perform(sel, with: self)
    }
    
    private func openWebView(){
        //处理command
    }
}
```

### SFSafariViewController 的使用

- `SFSafariViewController` 是 iOS 9 以后推出的一种视图控制器，继承于 `UIViewController`，主要用于浏览 Web 页面，其浏览 H5 页面的效果与 Safari 浏览器类似。简单来说，就是相当于用 WKWebView 加载 Web 页面且不用跳转到 Safari 就拥有了 Safari 浏览器的所有功能；
- `SFSafariViewController` 视图控制器包括了 Safari 的一些功能，例如阅读器、自动填充、欺诈网站检测和内容拦截等。在 iOS 9 和 iOS 10 中，它与 Safari 共享 cookie 和其他网站数据；
- 用户与 `SFSafariViewController` 的交互对 App 是不可见的，所以 App 无法访问网页中的自动填充数据、浏览历史记录或者网站数据，因此也就不需要保护 SFSafariViewController 中的数据；
- 如果想在 iOS 11 或者更高版本的 App 和 Safari 之间共享数据，那么用于只需要使用 `SFAuthenticationSession` 登录一次即可。

> 注意：根据 App Store Review Guidelines（ App Store 审查指南），这个视图控制器必须用于向用户可见地呈现信息，控制器不得被其他视图或图层隐藏或遮挡。此外，未经用户知情和同意，App 不得使用 `SFSafariViewController` 跟踪用户。


#### 使用

具体的属性及方法请参考[SFSafariViewController](https://developer.Apple.com/documentation/Safariservices/sfSafariviewcontroller)。以下是对其简单的使用

```Swift
//1、通过 SFSafariViewController 打开网页
func openWithSafariVC(){
    let sfsVC = SFSafariViewController(URL: NSURL(string: "https://google.com")!)
    //设置代理
    sfsVC.delegate = self
	presentViewController(sfsVC, animated: true, completion: nil)
}

//2、如果需要关闭 sfsVC，需要遵守SFSafariViewControllerDelegate协议
class ViewController: UIViewController, SFSafariViewControllerDelegate
{
	//当用户点击 sfsVC 的 Done 时，会调用这个代理方法，用来关闭视图控制器，并返回你的 App
    func SafariViewControllerDidFinish(controller: SFSafariViewController)
	{
    	controller.dismissViewControllerAnimated(true, completion: nil)
	}
}

```

#### 优缺点

**优点**
- 不用跳转 Safari 就可以打开网页；
- 可以非常容易的获取 Safari 的所有功能，相当于一个小型的 Safari 浏览器。

**缺点**
- 不能定制化，无法与 Web 内容进行自定义交互；
- 只能通过 present 的方式出现，不能通过 push 的方式；
- 跳转方式导致了适用的场景有限，简单来说就是互动范围有限；
- 只能用于 iOS 9 及以上的版本，且在[ iOS 9, iOS 11 )和[ iOS 11, *)的版本中的操作有所区别。

### 三者之间的关系

下面梳理下 `UIWebView`、`WKWebView`、`SFSafariViewController` 3 者之间的关系：
- iOS 2 - iOS 12： 支持 UIWebView；
- iOS 8 及以上  ： 支持 UIWebView、WKWebView；
- iOS 9 及以上  ： 支持 UIWebView、WKWebView、SFSafariViewController；
- iOS12 及以上  ： 支持 WKWebView、SFSafariViewController。

## WWDC21 中WKWebView 的新增功能

根据[Explore WKWebView additions](https://developer.Apple.com/videos/play/wwdc2021/10032/)中解读可以知道，主要新增了以下两点：

- 1、`SafariServices` 框架中新增了一个自定义Safari扩展按钮的API；

- 2、`WKWebView` 中新增了几种 API：
   - 轻松与 Web 内容进行交互，且无需注入 JS 的 API。主要分为 3 类： `Access theme color` 、 `Manage text interaction` 、 `Control media palyback`；
   
   - Safari 浏览器相关的的 API，分别是：`Disable HTTPS upgrade`、 `Control Media capture`、 `Manage downloads`。

下面针对上述的更新分别进行一一说明。

### SafariServices 中的新增

在 iOS 15 之前，用户始终可以通过 `SFSafariViewController` 上的共享表运行 App 的扩展，但是对于 App 构建的特殊功能，用户很难发现，简单来说就是用户无法知道 Safari 这个功能是由我们的 App 提供的，或误认为是 Safari 自带的。

为了更好的识别，苹果在 iOS 15 的 `SafariServices` 框架中新增了一个 API，用于将 App 的扩展功能关联到 `SFSafariViewController` 的自定义按钮上，为了更好的向用户展示 App 的扩展功能，也可以为这个按钮设置图标。并同时允许用户直接从 Safari 工具栏中运行 App 扩展，包括在页面上运行 JS。虽然这也是非常有限的交互，但相比之前无法自定义的交互而言，也是一种进步。

在 `SFSafariViewController` 界面中自定义扩展按钮的代码，如下所示。
![10032-01-SafariServices.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624376488375-ae51aee0-5a70-465d-b8ba-ae5816b5f091.png#height=381&id=u9f535560&margin=%5Bobject%20Object%5D&name=10032-01-SafariServices.png&originHeight=792&originWidth=1352&originalType=binary&ratio=1&size=309812&status=done&style=none&width=650)
主要是通过获取 `SFSafariViewController` 视图控制器的配置，通过配置中的 `activityButton` 属性来实现 Safari 中扩展按钮的自定义。

**演示**
- 前提：创建一个 Action Extension
- 自定义 extension 按钮


```
//custom App extension button

import UIKit
import SafariServices

class ViewController: UIViewController, WKScriptMessageHandler {
    
    func showSafariViewController(pageURL: URL){
        //创建配置
        let configuration = SFSafariViewController.Configuration()
        //设置扩展功能的按钮图标及唯一标识
        configuration.activityButton = SFSafariViewController.ActivityButton(
            templateImage: UIImage(named: "example_image")!,
            extensionIdentifier: "com.example.extension")
        
        //初始化 Safari 视图控制器
        let SafariViewController = SFSafariViewController(url: pageURL, configuration: configuration)
        //跳转
        present(SafariViewController, animated: true)
    }
}
```
效果如下所示，右下角的❤就是自定义的扩展按钮
![10032-14-customExtension.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624449827394-225e6d0b-5fdb-4ad7-92e7-d1a749bc87f2.png#clientId=ufc08ec57-3c08-4&from=ui&height=599&id=ud104f10e&margin=%5Bobject%20Object%5D&name=10032-14-customExtension.png&originHeight=1010&originWidth=506&originalType=binary&ratio=2&size=461383&status=done&style=none&taskId=u671625ef-0e91-49a9-93fb-4646460bb19&width=300)

### WKWebView 中的新增

如果希望与 Web 内容进行更多的交互，`SFSafariViewController` 就不适用了，因为它自身提供的自定义交互有限，适用于简单的交互场景。

针对复杂的交互场景，这里需要使用 `WKWebView`，因为它允许我们做很多的事情，例如加载 Web 内容，同时支持用户与 Web 内容进行复杂的交互。

为了让开发者更方便快捷的实现与 Web 内容的复杂交互，苹果在 iOS 15 中提供了一些 API，这些 API 可以更好的帮助我们访问和操作 WebView
中的内容。主要分为两类：
- **与 WebView 交互相关的 API**：用于操作和访问 Web 内容，且无需注入 JavaScript
- **Safari 浏览器相关的 API**：用于访问以前只能在 Safari 浏览器中使用的功能，从而可以在App 中获得更深层次的浏览器体验

#### 与 WebView 交互相关的 API

在了解新增的的交互 API 之前，首先需要说明我们为什么需要避免注入 JS，有以下几点：
- 1、JS 的注入很复杂，需要在跨越本机和网络之间的界面中注入，不仅`难且繁琐`。
- 2、当处理多个不同来源的Web内容时，多次注入 JS 很容易产生想不到的副作用，且不同的页面有不同的 JS，非常`难以管理`。如果允许的话，最好不要这么操作。
- 3、Web 视图的一些功能可能与注入的 JS `不兼容`，这也是非常令人头疼的事情。

为了解决 JS 注入带来的诸多问题，苹果在 WWDC20 中推出了一个
 `App-bound domains` （ App 绑定域）的功能，这个功能允许我们在 App 中`指定与那些域进行深度交互`。App 绑定域有助于提高用户在 App 中的安全性和隐私性。使用这个功能的一个前提就是`不能将 JS 注入到我们的 Web 视图`。如果 Web 视图中注入了 JS，那么 App 绑定域就会被禁用，此时我们可以在 Web 视图中访问其他的高级功能，例如 Apple pay。

今年在与 WebView 内容的交互上又更近了一步，苹果在 iOS 15 中新增了几个 API，可以让用户在不用注入 JS 的情况下，更容易与Web内容进行交互，这些 API 主要分为 3 类：
- **Theme Color** ：颜色相关 API，用于获取Web视图页面上的主题颜色
- **Manage text interaction**：禁用文本交互的 API
- **Control media playback**：控制Web视图中媒体播放的 API

##### Theme Color 主题颜色相关 API

在 WWDC20 中，苹果工程师实现了一个内部 App WebKittens，用于浏览 cat 和 dog，今年，工程师希望在 WebKittens App 中做一些改变，即为 App `动态的添加主题颜色`，这个颜色需要随季节为变化，最终的实现效果如下所示  
![10032-gif-01-themeColor.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624379425598-c12932ad-fea0-4ba9-8ca2-2f8fe78fc2aa.gif#clientId=u03326725-b0ec-4&from=ui&id=uc9a5b3fc&margin=%5Bobject%20Object%5D&name=10032-gif-01-themeColor.gif&originHeight=334&originWidth=600&originalType=binary&ratio=2&size=1091744&status=done&style=none&taskId=uf4f57c6d-5cf7-4866-9a30-906c5873a51)

为了更好的实现这个需求，苹果针对主题颜色的更改提供了一个新的 API。可以通过这个 API 将 `headerView` 的颜色设置为 `WebView` 的主题颜色，而无需开发人员做额外的工作，代码如下所示
![10032-02-themeColor.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624377107178-547e8bec-cf38-40fd-98db-4b1ababfc6e4.png#height=381&id=u8cf908f8&margin=%5Bobject%20Object%5D&name=10032-02-themeColor.png&originHeight=788&originWidth=1346&originalType=binary&ratio=1&size=222287&status=done&style=none&width=650)

如果网站未设置主题颜色，会有一个替代 `themeColor` 的页面背景颜色，主要通过 WKWebView 的 `underPageBackgroundColor` 属性获取，如下所示
![10032-03-pageBackgroundColor.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624377170830-345532f0-5578-4730-95f4-8e1a18cc9aae.png#height=385&id=udc54da60&margin=%5Bobject%20Object%5D&name=10032-03-pageBackgroundColor.png&originHeight=798&originWidth=1348&originalType=binary&ratio=1&size=247966&status=done&style=none&width=650)

如果上述代码仍然不满足您的要求，您还可以通过 `underPageBackgroundColor` 属性来自定义用来填充滚动到Web内容末尾时的背景颜色。以上就是通过 WKWebView 新增的颜色相关 API，来创建加载 Web 的 App 的主题颜色。

> Tips：经过实际验证，目前 Xcode 12 Beta 版本中 WKWebView 并没有 `underPageBackgroundColor` 这个属性。猜测在正式版本出来后应该会体现，拭目以待吧。

##### Manage text interaction 文本交互相关 API

苹果工程师闲着没事，在 WebKittens 和 Pups 两个 App 中添加了浏览宠物视频的功能，但是呢，浏览视频的用户反馈在播放视频时，会触发文本交互，严重影响了用户体验。

为了解决这个问题，苹果今年在 `WKWebView` 中新增了一个 API，让开发者可以非常简单的禁用 WebView 上的文本交互，这个功能是通过 `WKPreferences` 类中`textInteractionEnabled` 属性实现的，该属性是 `BOOL` 类型，将其设置为 `false`，然后将 `preferences` 对象赋值给 WebView 的 configuration 对象，用 `configuration` 初始化的 WebView 就已经禁用了 WebView 中的所有文本交互，代码如下所示。
![10032-04-textInteraction.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624377240490-3fa9250c-7da9-4bc4-95f4-e9da17536f4b.png#height=379&id=u3399ce93&margin=%5Bobject%20Object%5D&name=10032-04-textInteraction.png&originHeight=792&originWidth=1358&originalType=binary&ratio=1&size=515861&status=done&style=none&width=650)

> Tips：苹果官方的讲解视频中，这部分代码有问题，以下是纠正后的代码。

```Swift
//Disable text interaction

var WebView: WKWebView!
    
override func loadView() {
    //创建偏好设置
    let preferences = WKPreferences()
    //禁用文本交互
    preferences.textInteractionEnabled = false
	
    //WebView 配置
    let WebConfiguration = WKWebViewConfiguration()
    //配置赋值
    WebConfiguration.preferences = preferences

    //初始化 WebView
    WebView = WKWebView(frame: .zero, configuration: WebConfiguration)
}
```

##### Control media playback 视频操作相关 API

在 iOS 15 以前，如果想在在 Web 视图中暂停或者挂起播放的视频，是需要注入 JavaScript 且还需要从 DOM 中获取控制视频的元素，其操作过程非常繁琐。

为了简化对视频的操作，WKWebView 在 iOS 15 中中推出了一些简单易用的 API。用来帮助开发者更好的操作视频，例如暂停视频、关闭所有视频窗口、获取媒体状态以及设置媒体暂停状态等。其中新增的`视频操作相关API`如下所示。
![10032-05-mediaPlayback.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624377302388-f6b7c63e-35c6-4cf0-a8e3-93a7ced2382f.png#height=381&id=uc04fc856&margin=%5Bobject%20Object%5D&name=10032-05-mediaPlayback.png&originHeight=792&originWidth=1350&originalType=binary&ratio=1&size=198085&status=done&style=none&width=650)

这些 API 的调用都会导致视频暂停，以及禁用文本交互，直到开发人员将 `setAllMediaPlaybackSuspended` 设置为 `false` 后才会恢复。

**演示**

这里还是以 WebKittens 和 Pups 为例，从上面我们知道了苹果工程师在 WebKittens 和 Pups 都增加了发布视频的功能，其效果图示如下
![10032-gif-02-mediaPlay.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624379789948-60c69c91-e287-4363-8ed1-e03e8d6546e6.gif#clientId=u03326725-b0ec-4&from=ui&id=u227a8bcc&margin=%5Bobject%20Object%5D&name=10032-gif-02-mediaPlay.gif&originHeight=336&originWidth=600&originalType=binary&ratio=2&size=962045&status=done&taskId=u35250f99-f6e0-438f-904b-7af5c504953)
从图中可以看出，页面的顶部是 Web 内容，且设置了主题颜色。下面是 3 个按钮，主要用于控制视频。但是用户希望在 App 中浏览视频时，视频是暂停的而非自动播放的，为了实现这个需求，苹果的开发工程师尝试了以下几种方案：
- 1、直接使用 `pause` 按钮，发现只有小猫视频暂停了，而小狗的视频仍处于播放状态，点击 Play 后，什么都没有发生，小猫视频也没有恢复播放。因此这种方式是不可行的，其效果如下所示。
![10032-gif-03-mediaPause-01.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624380404830-22d59436-97d6-4e88-b673-460b696429ce.gif#clientId=u03326725-b0ec-4&from=ui&id=u446a63e3&margin=%5Bobject%20Object%5D&name=10032-gif-03-mediaPause-01.gif&originHeight=334&originWidth=600&originalType=binary&ratio=2&size=5819382&status=done&style=none&taskId=uaf8154bb-fadc-4f67-bcf4-44d652f5780)

- 2、通过 `JavaScript` 来暂停所有视频，但是这样做会有一个问题，工程师需要了解不同网站的页面结构。且这种页面结构是在不断变化的。如果这样做，过程非常繁琐。
- 3、采用 iOS 15 中新推出的 API 对视频进行暂停
   - 首先在 Web 视图上调用 `pauseAllMediaPlayback` 方法，相当于在 WebView 中的每个视频元素上`调用了 JavaScript 函数的 pause`，演示如下，发现效果非常好。
![10032-gif-03-mediaPause-03.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624380888909-79823037-8937-4196-ba23-24d510958260.gif#clientId=u03326725-b0ec-4&from=ui&id=u7be792b4&margin=%5Bobject%20Object%5D&name=10032-gif-03-mediaPause-03.gif&originHeight=333&originWidth=600&originalType=binary&ratio=2&size=2697862&status=done&style=none&taskId=u2a2fe00d-0f37-41d3-abf2-db10dd69808)
但是这种方式会存在一个问题，当刷新页面时，会导致 WebView 的内容重新加载，且视频是重新开始播放。简单来说，就是刷新前的视频暂停操作像从来没有做过一样。

   - 3-2、针对3-1中存在问题情，可以通过调用 `setAllMediaPlaybackSuspended` 方法来解决，采用这种方式实现的暂停，即使页面刷新后，视频也会保持刷新前的暂停状态，因为这种方式是`直接操作 Web 视图本身的属性`。其效果演示如下：
![10032-gif-03-mediaPause-04.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624381334192-eada666b-a79d-4851-885d-43c8b16032db.gif#clientId=u03326725-b0ec-4&from=ui&id=u51e02f87&margin=%5Bobject%20Object%5D&name=10032-gif-03-mediaPause-04.gif&originHeight=333&originWidth=600&originalType=binary&ratio=2&size=2817205&status=done&style=none&taskId=u33500221-418a-4ddd-b7b9-732637f34ac)

#### Safari 浏览器相关的 API

下面主要说说 Safari 浏览器相关的 API，以前我们只能在 Safari 浏览器中使用 Safari 提供的功能。现在为了开发者更好的访问 Safari 浏览器中提供的功能。主要有以下三方面的更新：
- **Disable HTTPS upgrade**： 禁用 HTTPS 升级
- **Control Media capture**： 控制媒体捕获
- **Manage downloads**： 下载管理

##### Disable HTTPS upgrade 禁用 HTTPS 升级

苹果一直致力于在用户的安全和隐私方面下大功夫。目前业界最火的操作是将流量由 HTTP 转到 HTTPS。因为 HTTPS 是一种更为安全的浏览 Web 网页的方式，可以更好的保护用户隐私。

从 iOS 15 和 macOS Monterey 开始，苹果会`将 HTTP 请求发送到已知的 HTTPS 站点`，以此来帮助开发者将 HTTP 请求转为 HTTPS。对于开发者来说不需要做任何事情。

但是如果开发者想在本地做一些调试，您可以 WebView 的配置中禁用 HTTPS 的升级，即设置 `upgradeKnownHostsToHTTPS` 为 `false`，具体的代码如下所示：
![10032-06-disableHTTPSUpgrade.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624377815943-bc67b594-d74c-4234-b843-8ffb32ccdb1a.png#height=383&id=u148cd1a6&margin=%5Bobject%20Object%5D&name=10032-06-disableHTTPSUpgrade.png&originHeight=796&originWidth=1350&originalType=binary&ratio=1&size=165099&status=done&style=none&width=650)

##### Control Media capture 控制媒体捕获

在 iOS 14.3 中，WKWebView 启用了 `getUserMedia`，这个功能允许 `WebRTC` 函数在 App 中工作。今年又做的更好了，当您在 App 中需要自定义处理加载的 Web 内容时，可以将 App 作为用户请求的来源，而不是来源于网站 URL 的请求。这个功能将使用户的体验更好且无缝衔接 App。如果开发者希望用户请求是来自 URL，那么只需加载即可，而不用自定义 `scheme` 处理 Web 内容。以下是拦截 scheme 处理的演示代码。

```
func WebView(_ WebView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void){
    //拦截默认 scheme
    if (navigationAction.request.url?.absoluteString.hasPrefix("xxx") != nil) {
        UIApplication.shared.open(navigationAction.request.url!, options: [:], completionHandler: nil)
    }
    decisionHandler(.allow)
}
```

除此之外，还更新了一个 API，用于处理 Web 内容时，决定何时提示用户获取相机和麦克风权限。一旦通过正常流程获取相机和麦克风权限，开发人员可以决定是否显示权限提示，也可以通过此方法来实现自定义的提示，或者记住用户对 Web 内容的操作和响应。具体的实现步骤主要是通过 WKWebView 中的 `WKUIDelegate` 协议中的代理方法实现，如下所示
![10032-08-promptForMicrophoneAccess.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624377968221-dc73a8e5-15eb-4767-b914-2ebd38ee6161.png#height=384&id=uc31761a5&margin=%5Bobject%20Object%5D&name=10032-08-promptForMicrophoneAccess.png&originHeight=792&originWidth=1340&originalType=binary&ratio=1&size=283846&status=done&style=none&width=650)

**演示**

继续以 WebKittens App 为例，来演示媒体捕获 API 的使用场景。

由于人为无法控制的情况，苹果团队取消了每月的线下的宠物聚会，但是为了满足彼此分享宠物的需求，团队决定在 App 中新增一个线上的宠物狗公园，方便团队成员线上交流宠物狗。为了开发这个需求，就涉及到使用
 `getUserMedia` 设置 `WebRTC` 功能，方便团队成员能够实时查看，并与宠物狗朋友聊天。

当设置 `WKUIDelegate `时，开发人员已经了解这些服务器的请求是用户即将授予权限的请求。正常情况下权限提示如下所示
![10032-gif-04-access.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624382007274-505eff19-500f-4e2c-b28c-58b1f8a49f3c.gif#clientId=u03326725-b0ec-4&from=ui&id=ub58415b6&margin=%5Bobject%20Object%5D&name=10032-gif-04-access.gif&originHeight=335&originWidth=600&originalType=binary&ratio=2&size=471175&status=done&style=none&taskId=u5e02308b-c923-4794-85e9-1f55408b3cf)

如果用户已经授予了相机和麦克风权限，开发人员可以通过在 `WKWebView` 上设置 `WKUIDelegate` 的代理方法来跳过权限的提示，在原生到中开发人员只需要检查提供线上宠物狗媒体资源的 host，并允许媒体捕获和访问即可如下所示
![10032-08-bypassPromptForBrowserPets.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624381441635-24f1e052-7255-49cd-a872-8184f08ba975.png#clientId=u03326725-b0ec-4&from=ui&height=375&id=u4632c18d&margin=%5Bobject%20Object%5D&name=10032-08-bypassPromptForBrowserPets.png&originHeight=782&originWidth=1354&originalType=binary&ratio=2&size=182781&status=done&style=none&taskId=uf0468e4c-46e0-4cc0-921c-03b057dcabb&width=650)
以 WebKittens App 为例所做的演示效果
![10032-gif-04-noAccess.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624382284606-c0f99593-3403-48ef-81b2-7304760335b9.gif#clientId=u03326725-b0ec-4&from=ui&id=u343a8510&margin=%5Bobject%20Object%5D&name=10032-gif-04-noAccess.gif&originHeight=329&originWidth=600&originalType=binary&ratio=2&size=567481&status=done&style=none&taskId=ucef4c5a9-d933-4a2a-a1ba-20b44cbad74)

开发人员也可以在没有 JS 的情况下与媒体进行交互，如下所示，是两个按钮的点击方法，用来`设置相机和麦克风的状态`
![10032-09-setCameraState.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378284726-4e4298f8-045a-4af1-89bb-d5c1a24008ac.png#clientId=u03326725-b0ec-4&from=ui&height=382&id=uf7ec44d4&margin=%5Bobject%20Object%5D&name=10032-09-setCameraState.png&originHeight=794&originWidth=1350&originalType=binary&ratio=2&size=243520&status=done&style=none&taskId=u1cab40fa-f651-48c2-84f8-36f767c2fbe&width=650)

在跳过权限提示的基础上，此时尝试点击静音按钮，从下图中可以看出，相机的摄像功能停止了且静音了。如何恢复视频的录制状态呢？非常简单，只需要使用 JS，将其连接到 `WebView.setCameraCaptureState` 即可。
![10032-gif-04-noAccessVoice.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624382427027-7851b84e-109d-47ef-956f-68972355fad2.gif#clientId=u03326725-b0ec-4&from=ui&id=u32b1e22a&margin=%5Bobject%20Object%5D&name=10032-gif-04-noAccessVoice.gif&originHeight=334&originWidth=600&originalType=binary&ratio=2&size=782410&status=done&style=none&taskId=u2b13c2be-efa7-4387-b282-c7cda16abca)

以上就针对媒体捕获在 WKWebView 中新增的 API

##### Manage downloads 管理下载

新的 API 中主要提供了三种下载文件的方式：
- Web 页面启动下载
- 服务器启动下载
- App 启动下载

###### Web 页面启动下载

Web 内容启动下载，类似于`JS 启动下载`。当执行 JS 代码时，会启动一个下载导航操作，该操作会调用 `navigationDelegate` 的代理方法，在代理方法中将 `shouldPerformDownload` 设置为 `true`，同时需要结合其他逻辑一起来确定是否允许下载文件
- JS 启动下载操作
![10032-10-JSCode.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378574720-833e0cd2-e4af-451b-8cef-ca3489d060ac.png#clientId=u03326725-b0ec-4&from=ui&height=386&id=u86e84f10&margin=%5Bobject%20Object%5D&name=10032-10-JSCode.png&originHeight=804&originWidth=1354&originalType=binary&ratio=2&size=106335&status=done&style=none&taskId=u796284a0-19c0-4b48-abed-ba9a14f67b5&width=650)
- 从 `WKNavigationAction` 中下载文件
![10032-10-downloadCode.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378585025-b99fa3ed-bb7a-47e7-b131-117a1d2a1e19.png#clientId=u03326725-b0ec-4&from=ui&height=382&id=u9de66e7b&margin=%5Bobject%20Object%5D&name=10032-10-downloadCode.png&originHeight=792&originWidth=1348&originalType=binary&ratio=2&size=163996&status=done&style=none&taskId=u4dee0374-7d52-4f71-985d-d8be50123dd&width=650)

以下是对上述代码的一个解析

```swift
<!--1、JS启动下载操作-->
//JavaScript initialed download
//创建一个 a 标签
let a = document.createElement('a');
//创建 Blob 对象（即一个不可变、原始数据的类文件对象）
let b = new Blob([1, 2, 3]);
//获取当前文件的一个内存 URL
a.href = URL.createObjectURL(b);
//指定下载的文件名
a.download = 'filename.dat';
//Web 页面启动下载
a.click();

<!--2、从WKNavigationAction中下载文件-->
//Download from WKNavigationAction
func WebView(_ WebView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy
{
    //判断是否允许下载
    return navigationAction.shouldPerformDownload ? .download : .allow
}
```
> 参考链接
> - [Blob-对象介绍](https://zhuanlan.zhihu.com/p/161000123)

###### 服务器启动下载

服务器在 WebView 上调用 `loadRequest` 后，类似于在`HTTP 中启动下载`。当发生这种情况时， WKNavigationDelegate 的代理方法中的 `WKNavigationAction` 对象会有一个 `Content-Disposition` 头字段，其值包含 ` "attachment"`，当出现这个参数时，就应该在代理方法中返回 `WKNavigationActionPolicyDownload`，表示开始下载文件
- 服务器启动下载
![10032-11-serverCode.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378746428-11edcbf1-2092-4ee9-a77b-37c1950a74e6.png#clientId=u03326725-b0ec-4&from=ui&height=379&id=u1f54373e&margin=%5Bobject%20Object%5D&name=10032-11-serverCode.png&originHeight=792&originWidth=1358&originalType=binary&ratio=2&size=85965&status=done&style=none&taskId=uc13e874b-61ff-4f87-9db4-adad2fc222e&width=650)
- `WKNavigationDelegate` 协议的代理方法中判断 `navigationReposnse` 的头字段是否包含 `attachment`，如果有则开始下载文件
![10032-11-downloadFromResponse.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378755558-d9aae8fa-c4c4-43bf-afbd-04bc7c17ec34.png#clientId=u03326725-b0ec-4&from=ui&height=381&id=uf529d19f&margin=%5Bobject%20Object%5D&name=10032-11-downloadFromResponse.png&originHeight=792&originWidth=1350&originalType=binary&ratio=2&size=304666&status=done&style=none&taskId=u67d2cc2c-d6d1-4dfb-81b5-5f56beb3810&width=650)

> Tips：苹果官方文档中的代码有部分问题，下面是已纠正的代码

```swift
<!--1、服务器启动下载-->
//Server initiated download

HTTP/1.1 200 OK
Content-Disposition: attachment; filename="filename.dat"
content-length: 100

<!--2、navigationDelegate的代理方法中开始下载文件-->
//Download from a WKNavigationResponse

func WebView(_ WebView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse) -> WKNavigationResponsePolicy
{
    //判断头字段中是否包含attachment
    if navigationResponse.canShowMIMEType,
       let response = navigationResponse.response as? HTTPURLResponse,
       let contentType = response.value(forHTTPHeaderField: "Content-Type"),
       contentType.range(of: "attachment", options: .caseInsensitive) != nil{
           return .download
     }
    return .allow
}
```


###### App 启动下载

App 应用程序可以使用 `NSURLRequest` 在当前页面的上下文中下载某些内容
![10032-12-downloadFromApp.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378822437-a166bb15-03e0-4f0d-a18e-1f5331da31fd.png#clientId=u03326725-b0ec-4&from=ui&height=380&id=u4d2192f7&margin=%5Bobject%20Object%5D&name=10032-12-downloadFromApp.png&originHeight=792&originWidth=1354&originalType=binary&ratio=2&size=238098&status=done&style=none&taskId=u40b7353b-1192-4727-b871-2c5c13b04b2&width=650)

**总结**

综上所述，无论选择哪种下载方式，当获取到 `WKDownload` 对象时，开发人员都需要设置该对象的 `delegate` 属性，以便于能够告知 download 对象，下载文件存储的位置。如果未设置 delegate，那么下载将自动取消

```
//获取WKDownload对象后，必须设置其delegate
download.delegate = self
```

- 如果下载失败，开发人员可以在 `WKDownloadDelegate` 协议代理方法中实现以下方法，用于恢复下载的数据，然后可以使用这些数据重新从 WebView 中下载文件
![10032-13-resumeDownload.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624378888602-4f2b3188-3039-43bb-9c58-2ae4e26cf649.png#clientId=u03326725-b0ec-4&from=ui&height=372&id=u8656c8bc&margin=%5Bobject%20Object%5D&name=10032-13-resumeDownload.png&originHeight=774&originWidth=1352&originalType=binary&ratio=2&size=258183&status=done&style=none&taskId=u67295d48-a2eb-4134-a413-c5e8d7d33a8&width=650)

**演示**

这里还是以 WebKittens App 为例。用户一直希望与朋友和家人分享这些动物的图片，但是目前只有苹果内部员工才能使用这个 App。为了解决这个问题，苹果新增了一个 API，允许用户从 WebView 中下载和管理文件，使文件的共享更为便捷。以下是以通过简单的方式将文件下载到文件中的演示
![10032-gif-05-downloadFile.gif](https://cdn.nlark.com/yuque/0/2021/gif/1536000/1624382515686-5b0fc940-0db0-4112-8c91-ce1139f27e32.gif#clientId=u03326725-b0ec-4&from=ui&id=u7420216c&margin=%5Bobject%20Object%5D&name=10032-gif-05-downloadFile.gif&originHeight=333&originWidth=600&originalType=binary&ratio=2&size=741808&status=done&style=none&taskId=u68575e3e-dbc7-4b6a-bf4e-19f647eabc7)

以上就是 Safari 浏览器相关的 API，这些 API为用户提供了更多的选择性，让 App 拥有更好的网络体验。

## 总结

综上所述，在 iOS 15 中新增的 API 主要有以下：
![iOS 15 WKWebView新增功能.png](https://cdn.nlark.com/yuque/0/2021/png/1536000/1624428188156-50e90d56-021f-4c65-ba64-d5a943456ab5.png#clientId=u04b88f42-3b8f-4&from=ui&id=u7a20433b&margin=%5Bobject%20Object%5D&name=iOS%2015%20WKWebView%E6%96%B0%E5%A2%9E%E5%8A%9F%E8%83%BD.png&originHeight=2192&originWidth=3245&originalType=binary&ratio=2&size=694678&status=done&style=none&taskId=u66bff002-1350-49ab-97e5-c68b1ba8695)
