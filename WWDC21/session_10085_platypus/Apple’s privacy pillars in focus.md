# [session-10085]Apple’s privacy pillars in focus

## 前言
在 Apple，隐私被认为是一项基本人权。什么时候共享数据，共享哪些数据，这些都应该由用户来掌控。从近几年的 WWDC 来看，Apple 一直在加强隐私保护方面的工作。从用户的角度来说，这无疑是利好，毕竟谁都不希望自己的隐私数据被到处利用，尤其是有时候这种利用是影响体验的甚至是造成损失的。从开发者的角度来说，既要保证自己 App 功能的完整性，又要适应隐私政策的变化，无疑需要做更多的工作。但我认为，这样做是值得的，因为构建一个互相信任的生态对整个行业意义重大，因为只有当人们知道自己的数据是怎样被使用并且的确被有效保护时，才会愿意参与到生态中来。而且，Apple 也提供了很多指导准则以及实用工具来帮助开发者兼顾使用体验和隐私政策。谁说鱼和熊掌不能兼得呢？

为了让开发者更清楚的掌握隐私保护方面需要做的事情，Apple 将隐私分成了四个方面的主要工作。开发者也可以将其视为隐私保护四项基本原则。这四项分别是：

* Data Minimization：App 只应向用户请求完成产品功能所必需的数据。
* On-device processing：App 可以把一些数据处理工作放在本地，而非发送到服务器。
* Transparency and control：隐私数据应当是透明的，且受用户控制的，以便用户清楚的理解其数据是如何被使用的。
* Security：隐私数据应当被安全的保护。

实际上，近几年隐私方面的更新一直围绕着这四个方面进行，感兴趣的同学可以查看一下过往几年 WWDC Privacy 相关的 session。在 WWDC21，Apple 延续了这四方面的工作，在下面的章节里我们会分别进行介绍。除此之外，Apple 还介绍了把几种隐私策略结合起来工作的一个范例 -- Private Relay，我们会在最后一部分进行介绍。

## Data Minimization
Data Minimization 首先体现在定位（location）上。iOS 13 增加了用户对使用定位数据时机的控制，包括只使用一次（Allow Once）、App 使用期间（Allow While Using App）、一直使用（Always）和不允许使用（Don't Allow）。iOS 14 增加了用户对使用定位数据精度的控制，即允许 App 使用精准位置还是大概位置。毫无疑问，这些措施加强了用户对定位数据的控制力，但有时会影响用户体验。

我们知道，App 要想访问用户的定位数据，必须经过用户授权。而如果用户选择了 Allow Once 授权，则 App 只会在当次生命周期内有访问定位数据的权限，但是后面的每次生命周期都要再次请求定位权限。这样会导致重复弹出授权弹窗，体验不太友好。iOS 15 优化了这个体验 -- 通过提供新的 Location Button。开发者在实际需要使用定位数据的地方增加 Location Button。当用户第一次点击该按钮时，会弹出授权弹窗，用户点击 OK 后 App 就获得了定位权限。而当 App 再次启动并进入同样的场景时，用户再次点击该按钮就不会弹出提示了，而是直接获得授权。优化的过程可以参考下图。

![location button](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624530008949-0f01679c-2732-4c52-9e57-8743598c4ba2.png)

Location Button 的作用类似于 Allow Once，即点击后 App 可以在此次 App 生命周期内获得定位权限。但 Location Button 的体验更好，因为除了第一次授权外，后续都不需要重复提示了。

有的同学会说，那为什么不用 while-in-use（这里指代 App 使用期间享有定位权限）呢？while-in-use 确实不存在重复提示的问题，但这种方式的问题在于，它不符合数据最小化的原则。Location Button 只是在需要定位数据的场景下显示和触发，并只作用于当次的 App 生命周期。但是 while-in-use 会作用于所有 App 生命周期，而实际上 App 可能并非每次都需要使用定位数据。显然，while-in-use 可能会造成定位数据使用时间范围的扩大化。

CoreLocationUI framework 提供了 Location Button 相关的 API。其实主要是 `CLLocationButton`。`CLLocationButton` 继承自 `UIControl`，所以 `UIControl` 里所有公开的属性我们都可以使用。除此之外，`CLLocationButton` 额外提供了 4 个用于配置的属性：

* `CLLocationButtonIcon` 用于设置按钮左侧的箭头
* `CLLocationButtonLabel` 用于设置按钮的文本部分
* `cornerRadius` 用于设置圆角
* `fontSize` 用于设置文本的字号

通过设置这些属性，我们可以对 Location Button 的样式进行配置。

![custom location button](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624264532868-32c10ad3-128c-4fcc-a6a6-9fcc2e1ed342.png)

更多关于 Location Button 的内容，大家可以参考 [Meet the Location Button](https://developer.apple.com/videos/play/wwdc2021/10102)。

除了定位，iOS 15 也优化了剪贴板的使用体验。iOS 14 增加了粘贴提示：当用户在 App 里粘贴数据时，系统会有类似“Notes pasted from Maps”这样的提示，并且每次粘贴时都会提示。这样虽然可以让开发者发现不符合预期的访问剪贴板的逻辑（比如一些第三方 SDK 会偷偷访问剪贴板数据），但还是会增加对用户的打扰。iOS 15 对此做了优化：系统会区分哪些粘贴是用户触发的，哪些是程序触发的。对于用户通过 edit Menu 或 keyboard 里的 paste 选项触发的粘贴动作，系统不会再提示 -- 因为这意味着用户很清楚这个动作是自己想要的。只有通过程序访问剪贴板的时候才会弹出提示。所以，开发者应当确认只有剪贴板的内容确实与 App 功能相关时，才可以访问剪贴板数据。

![paste](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624266152601-3bc5c75e-fa28-4131-9cb8-a02f1ea8b462.png)

## On-device processing
On-device processing 的好处显而易见：我们不需要把敏感数据发送到服务端，而只需在设备上处理，这从根源上避免了数据传输过程中被窃取或篡改。iOS 15 上 On-device processing 最大的应用是 Siri。

Siri 从推出时就是保护隐私的典范。Siri 不会存储音频数据；Siri 请求不会与你的 AppleID 关联，而是与一个随机的 id 关联；Siri 会尽可能把工作放在设备上处理，比如 iOS 13 把语音生成放在设备上，iOS 14 引入了键盘听写功能，这也是设备上运行的第一个高质量的语音转文本模型。而在 iOS 15，更进一步的，Siri 把语音识别模型也放到了设备上，这意味着默认情况下，我们的音频数据不再需要离开我们的 iPhone 或 iPad，在本地就可以被处理。由于不再需要向服务器发送请求，Siri 的处理速度自然更快了。

![siri](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624268966025-a6f5250a-2db4-44c8-9d68-6c68ff7fd20a.png)

Siri 之所以能做到这一点，得益于神经网络引擎的优化。实际上，不仅限于 Siri，开发者也可以利用 CreateML framework 在 iPhone 或 iPad 上针对不同用户训练个性化的模型，以将敏感数据（比如照片）全部留在设备上。更多关于这部分的信息，可以参考 [Build dynamic iOS apps with the Create ML framework](https://developer.apple.com/videos/play/wwdc2021/10037/)。

## Transparency and control
如果 App 对隐私数据的使用是透明和可控的，那么用户就会清楚 App 打算如何使用他们的 Email、照片、健康数据等，或者 App 打算跟谁共享这些数据，这更容易建立起用户的信任，用户也就更愿意使用我们的 App 了。这里将介绍一些 Transparency and control 方面的例子，包括 Email、Indicators、App transparency 和一些体验优化。

![Transparency and control](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624269930062-3d652318-ec22-450b-8b85-1559b2cd417a.png)

### Email
Email 方面的更新包含两方面：Hide My Email 和 Mail Privacy Protection。

不管是填写在线表单还是注册 App 账号，都有可能需要我们填写自己的 Email 地址。人们不免会担心自己的 Email 会被其他 App 或网站共享，这样会收到很多垃圾邮件。为此，Apple 推出了 Hide My Email：当用户注册账号或者在在线表单上填写 Email 地址时，Hide My Email 允许用户创建一个随机的 Email 地址来取代真实地址。这样，用户的真实地址就被隐藏起来了。比如，用户的 Email 是 j.appleseed@icloud.com，如果使用了 Hide My Email，那一个类似 dpdcnf87nu@privaterelay.appleid.com 这样的随机 Email 地址会被生成。这个随机地址只会在我们注册账号的特定 App 或网站上使用，并且该 App 或网站向用户发送的邮件也会通过一个中转邮件服务转发到我们的真实邮箱。Apple 的中转服务不会存储也不会读取邮件内容，所以可以放心使用。

![Hide My Email](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624272483235-2de431e2-5632-4a0f-93ac-12fc00d7774c.png)

Hide My Email 跟 Sign in with Apple 很相似，有相关经验的同学可能会比较熟悉。需要说明的是，Hide My Email 是 iCloud+ 服务的一部分，需要订阅才能使用。

除了 Hide My Email 外，Apple 还推出了 Mail Privacy Protection。这个特性主要是为了反跟踪。我们知道，有些发件人（比如广告商）会在邮件里嵌入图片，而在图片里可能会隐藏针对用户的链接。这样，当用户打开邮件并渲染图片时，发件人就能知道用户何时打开了邮件、用户的 IP 地址、用户的位置信息等等。Apple 认为这损害了用户的隐私权益，而 Mail Privacy Protection 就是为此而生。用户在 Mail App 开启 Mail Privacy Protection 后，加载邮件内容、IP 地址等信息就会被隐藏起来，这简直是太酷了！当然了，对于那些依赖邮件活动来做数据分析的人来说，这个功能会迫使他们做出改变。因为用户查看邮件的时间将不再准确（对于广告商来说），IP 地址和位置信息也无法获取了。

### Indicators
App 在使用用户隐私数据时，最好有明确的活动指示器。iOS 14 以后在使用麦克风、相机时，状态栏上就会有圆点的指示器，提示用户 App 正在使用他们的麦克风或相机。WWDC21 在这块也有两方面的更新。

第一部分是 Focus Mode 相关的。在 iOS 15 上，如果我们的 App 里包含了 IM 的功能，那么可以在 App 的 UI 上显示 Focus 状态，比如可以显示当前用户正处于勿扰模式。做法也很简单，在 App 的 info.plist 文件里增加 NSFocusStatusUsageDescription key，并且在 Xcode 里打开 User Notifications Communication capability 就可以了。更多信息可以参考 [Send communication and Time Sensitive notifications](https://developer.apple.com/videos/play/wwdc2021/10091/)。

另一部分更新是在 macOS Monterey 上也支持了在使用摄像头时在状态栏上显示橙色圆点的指示器。

### App transparency
关于 App 透明度的一项重大更新是：App 隐私报告。用户可以在“设置 - 隐私”里查看。人们将会在这里面看到 Apps 每天对自己敏感数据（如定位、照片、联系人）的使用情况，以及 App 是如何与其他 App 或网站共享数据的，在报告里你可以查看 App 访问的域名（包括 App 内置的 web 页所访问的域名）。需要说明的是，该报告不会记录浏览器里的临时 WebKit 会话，比如 Safari 的 Private Browsing Mode。

iOS 15 还提供了“记录 App 活动（Record App Activity）”功能，这可以帮助开发者更好的理解自己 App 的行为。你可以在“设置 - 隐私”里面打开。

![app transparency](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624531142928-ba827423-ab67-44c9-a432-96af6bba6bab.png)

开发者如何使用 Record App Activity 呢？我们点击 “Save App Activity” 按钮时，iOS 会生成一个 JSON 文件。通过查看该 JSON 文件，我们可以预览用户在 App 隐私报告里看到的内容，并确认 App 的行为是否符合预期。我们不妨看一下 JSON 文件里有哪些内容。整个 JSON 文件包含两部分。上面的部分是一份字典组成的列表，每个字典代表一次进程访问用户数据和传感器所产生的信息。官方给出的示例如下：

![activity json](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624334591731-b8a10754-9238-44fa-80e9-aa0ff978c4bb.png)

官方并没有对每个字段进行说明，但我们也能看出来有哪些字段值得关注：

* stream：推测表示的是哪种隐私数据。官方示例里给的是 com.apple.privacy.accounting.stream.tcc，结合后面的 kTCCServiceAddressBook 可以知道这里访问的是通讯录。我自己写了个 demo 获取定位数据，stream 的值就变成了 com.apple.privacy.accounting.stream.location，很明显是访问定位了。
* identifier 和 identifierType：通过这两个字段就可以确定是哪个 App/进程访问的隐私数据。
* timestamp：访问的时间戳。

显然，通过上面这部分内容我们就能搞清楚 App 在何时访问了何种隐私数据。

JSON 文件的第二部分是关于 App 访问的域名的。这部分内容揭示了 App 在何时访问的什么域名，以便开发者确认是否有不符合预期的访问，比如一些第三方 SDK 是否发出了不合预期的请求等。官方给的示例如下图所示：

![domain](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624335159310-b355643d-a65e-44e8-9b3c-f1b9b0d57415.png)

### App privacy improvements
在去年的 WWDC 上，关于隐私透明度有两项重要更新，第一项是在 App Store 的产品页增加了隐私标签。这样用户可以在下载 App 之前就很清楚的了解 App 收集了自己的哪些隐私数据，有哪些数据被用于追踪用户。

![privacy label](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624323171333-ef89ae08-0daa-4efd-914e-1cfb9a3dd47d.png)

另一项是关于 App 追踪用户的，即 App Tracking Transparency，并带来了新的 AppTrackingTransparency framework。Apple 要求 App 必须对如何使用数据追踪用户做出说明，并且必须取得用户授权后才能访问追踪所用的数据如 IDFA。请求授权的弹窗如下图所示。

![request transparency](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624323723838-f3036422-5d8b-40b0-bda6-57e4208eefe1.png)

在授权弹窗上，开发者必须对为什么要求跟踪用户给出清晰的描述。描述信息可以通过在 info.plist 里填写 NSUserTrackingUsageDescriptiaon 来设置。如果用户选择了不允许 App 跟踪，那么开发者将无法获取跟踪数据了。以 IDFA 为例，在不被允许的情况下，我们只能得到一串 0，像这样“00000000-0000-0000-0000-000000000000”。开发者可以调用 AppTrackingTransparency 的 API 来获取授权，下面是以获取 IDFA 为例的代码示例。由于获取 IDFA 之前必须要先获取权限，因此这里把获取 IDFA 的逻辑与请求权限的逻辑放到一起演示了，实际上你也可以先单独请求权限再通过 `ASIdentifierManager` 拿到 IDFA。

```
var idfa: String? {
    var result: String? = nil
    if #available(iOS 14.0, *) {
        ATTrackingManager.requestTrackingAuthorization { status in
            if status == .authorized {
                result = ASIdentifierManager.shared().advertisingIdentifier.uuidString
            }
        }
    } else {
        result = ASIdentifierManager.shared().advertisingIdentifier.uuidString
    }
    return result
}
```
WWDC21 并没有扩展很多内容，一方面对去年的内容做了回顾，另一方面着重强调了几点需要开发者注意的事项：

1. 跟踪是指为了广告运营等目的，使数据跨 App 或网站被共享。
2. 跟踪绝不限于 IDFA，如果你收集了用户姓名、Email 或其他标识符并通过链接等方式共享给其他 App，那么这些数据也都要被视为跟踪数据。
3. 指纹或任何能生成设备唯一标识的位信息都不被允许收集，即便用户允许了跟踪授权。
4. 开发者应该确保在没有跟踪授权的情况下，App 功能依然是可用的。
5. 开发者应当注意自己 App 里集成的第三方 SDK 有没有使用跟踪数据的情况。

对很多公司来说，跟踪策略的变化影响的主要还是广告归因。Apple 希望开发者或广告商能够在确保隐私的情况下做广告运营，因此推出了 SKAdNetwork framework。下面这张图显示了自 iOS 14 起 SKAdNetwork 的一些更新。在 iOS 15，开发者可以设置 pingback，以更好的衡量广告活动的效果。更多内容可以参考 [Meet privacy-preserving ad attribution](https://developer.apple.com/videos/play/wwdc2021/10033)。

## Security
在去年的 WWDC 上，安全保护工作主要是网络传输，包括 DNS 解析和 TLS 协议。今年，则主要是 CloudKit 数据加密方面的更新。在 iOS 15 之前，CloudKit 已经提供了对 CKAssets 的自动加密。而在 iOS 15，则增加了对字符串、数字、日期、CLLocation 和数组的自动加密。这意味着，开发者不必再自己对这些数据类型做加密处理了。要实现这一点也很简单。加密时，只需要调用 `encryptedValued` 设置好键值对，并通过 `CKModifyRecordsOperation` 保存即可。解密时，只需使用 `CKFetchRecordsOperation` 获取到 `record` 并使用相同的 `encryptedValued` 键值对解密即可。代码如下所示：

```
// Device 1: Encrypt data before calling CKModifyRecordsOperation.
myRecord.encryptedValued["encryptedStringField"] = "Sensitive value"

// Device 2: Decrypt data after calling CKFetchRecordsOperation.
let decrypedString = myRecord.encryptedValued["encryptedStringField"] as? String
```

## Private Relay
在介绍完有关隐私保护的四个基本方面后，Apple 又介绍了一个将多种隐私策略组合在一起使用的新特性 - Private Relay。

我们的日常生活现在已经很难脱离互联网了，不管是订外卖、购物抑或是旅行，我们生活的方方面面都在使用互联网。这也使得互联网隐私愈发重要。当我们在网站上浏览信息时，网站会获取我们的 IP 地址，通过 IP 地址又可以计算得到我们所在的城市甚至是小区。而通过 IP 地址，不同网站的浏览信息就可以组合起来，生成用户画像。通过画像，网站就可以知道我是谁，我住在哪里，我喜欢什么，我最近在干什么。想一想，这是不是很可怕！而这些信息都是我无意泄露的，也是我不想泄露的。大家可以回忆一下，是不是遇到过在某个 App 或网站浏览了商品信息之后，在另一个 App 或网站会收到了这条商品的广告推送？这种行为就是典型的跟踪用户了。现在，人们的信息很容易被网站、App、网络运营商、设备制造商等等进行收集，人们会因此收到各种广告推送。这种打扰倒还罢了，就怕有想法的人会通过用户画像分析出人们的行为模式进而做出不法的事情。

![profile](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624343179719-466afc75-0f14-44e4-a432-c811d29f636c.png)

WWDC20 介绍了 TLS 和 DNS 加密技术，这有助于保护我们的数据不被网络运营商劫持。关于这些大家可以参考 [Enable encrypted DNS](https://developer.apple.com/videos/play/wwdc2020/10047/) 和 [Boost performance and security with modern networking](https://developer.apple.com/videos/play/wwdc2020/10111/) 这两个 session。

在 iOS 15 和 macOS Monterey 上，Apple 推出了新的隐私服务 -- iCloud Private Relay。Private Relay 会对每个互联网连接进行加密，这样可以防止 IP 地址以及位置信息等暴露出去。这样一来，没有人（包括 Apple）可以知道我是谁以及我访问了哪些站点。需要说明的是，Private Relay 是 iCloud+ 里的一项服务，且只作用于 Safari。

![Private Relay](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624347633026-455b50b6-73d8-469b-b650-6d4dffa59f59.png)

下面我们用一个例子来看一下 Private Relay 是如何工作的。当我访问 Furniture Site 来购买家具的时候，Private Relay 会随机选择两个代理服务器 -- 一个 Ingress Proxy（入口代理），一个 Engress Proxy（出口代理）。也就是说，我的网络请求需要经过代理服务器转发到 Furniture Site 站点。那为什么要有两个代理呢？这样设计是为了防止每个代理看到请求的全貌。

* Ingress Proxy：防止其他服务器看到我的 IP 地址，并对我的网络流量进行加密以防止网络运营商来了解我要干什么
* Engress Proxy：用于处理我所访问的网站的请求响应，同时这也防止了 Ingress Proxy 看到我要访问的是什么站点

![proxy](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624350259362-8941bc36-62e4-4ae9-80e2-8a6b020a03be.png)

要让我们的设备访问 Private Relay 的代理服务器，自然需要有一个 token 验证的过程。下面这张图描述了 token 验证流程：

1. Private Relay Access Token Server 向设备提供一组 access tokens
2. 设备通过 RSA 私钥（由 Access Token Server 提供）对 access token 进行加密
3. 代理服务器通过公钥对 access token 进行解密，并验证 token
4. 验证通过后，设备跟代理服务器之间就可以建立连接了

![](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624355878463-5592be88-f4d8-4538-9fe4-caea49a95b4b.png)

这样，设备访问 Furniture Site 的整个过程就是“多层加密 - 逐层解密与验证”的过程。只有我的设备可以解密每一层，这样一来每层之间的信息是分离的，也就是说每一层都无法获取请求的全貌。下图是整个过程的示意图：

![encrypt and decrypt](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624356395338-8a819f5b-8e34-4baa-a5c1-73f19183a0d0.png)

我们来解释一下这个过程：

1. 设备使用黄色私钥对实际访问的站点 furnituresite.example.com 做第一层加密生成 data1；
2. 设备使用绿色私钥对（第一层的数据 + Egpress Proxy 地址 egressprovider.example.com）做第二层加密，得到第二层数据 data2
3. 设备使用蓝色私钥对（第二层数据 + Ingress Proxy 地址 ingressprovider.example.com）做第三层加密，得到第三层数据 data3
4. 当请求到达 Ingress Proxy 时，Ingress Proxy 会使用蓝色公钥对 data3 解密，从而得到第二层数据 data2，当然也就得到了 Egpress Proxy 的地址。Ingress Proxy 接着向 Egpress Proxy 转发请求，请求的数据自然是 data2
5. 当请求到达 Egpress Proxy，它会使用绿色公钥对 data2 解密，从而得到最终我们要访问的站点和请求信息，从而向 Furniture site 发送请求

需要说明一下，上述过程并没有此次 session 里做过多说明，这个也只是笔者的理解，不一定准确。更多关于 iCloud Private Relay 的说明，可以参考 [Get ready for iCloud Private Relay](https://developer.apple.com/videos/play/wwdc2021/10096) 这个 session。同时，WWDC21 内参也会有专门的文章做更详细的解读。

我们继续对 Private Relay 的工作机制进行说明。在上面最后一步 Egpress Proxy 与 Furniture site 建立连接时，Egpress Proxy 会随机选择一个 IP 地址，以防止在各个网站之间通过 IP 进行跟踪。

由于有多级的建立连接和加解密，有同学可能会担心性能问题。Apple 的解释是 Private Relay 会自动创建并重用连接，所以大家可以不用担心性能问题。

接下来我们来解释一下 Private Relay 是如何隐藏我的 IP 地址的。整个 IP 保护的过程如下图所示。当请求到达 Ingress Proxy 时，它会根据我的 IP 地址计算出我所在的区域，并返回该区域内的一个随机地址。这样在 Egpress Proxy 看来，发送请求的就不是 Cupertino 而更像是 Bay Area，CA（加利福尼亚湾区）。接着，Egpress Proxy 会从该区域的一组 IP 地址中随机选择一个，作为与 Furniture site 通信的地址。这样，就只有 Ingress Proxy 才能看到我们的真实地址了。对于我们要访问的站点来说，用户的真实 IP 地址被隐藏了。

![ip protect](https://cdn.nlark.com/yuque/0/2021/png/21893124/1624357829525-ecebc8f2-7e51-4598-8ed9-33b881845c11.png)

最后，我们总结一下 Private Relay 里是如何运用上面提到的四项隐私基本原则的：

1. unlinkable tokens 体现了 Data minimization（数据最小化）原则，因为在创建 token 的过程中会剥离账号等能表征用户身份的信息
2. 在设备上处理所有加密工作，则体现了 On-device processing 原则
3. IP 地址保护体现了 Transparency and control 原则
4. 分层加密自然体现了 Security 原则

可以看到，四项原则在整个 Private Relay 实现过程中都提供了指导和帮助。

## 总结
以上就是 iOS 15 及 macOS Monterey 提供的隐私方面的主要更新了。从大的趋势来说，Apple 一直在收紧隐私方面的政策，这一点必须引起开发者的关注，不能想当然的认为有些数据就是 App 该去使用的。在实际开发时，我们不妨换位思考一下，自己作为用户是否愿意让 App 访问隐私数据。在更严格的隐私权限要求下，可能有些开发者会觉得自己产品功能会受到限制，那么不妨 review 一下自己的产品逻辑是否合理，是否真的需要完整权限。如果确实需要，那么友好的提示用户并请求权限就可以了；如果不需要，那么可以使用 Apple 提供的这些新的隐私开发 API，可能是更好的选择。实际上，在符合 Apple 隐私政策的前提下，充分利用这些工具，合理设计产品逻辑，是完全可以做到产品体验与隐私保护兼得的。

作为开发者，我们都应该为构建一个相互信任的生态而努力，也愿我们能早日生活在这样的生态下。