---
session_ids: [10125]
---

# 自动化创建 Passkey 和全新密码 App 帮助简化登录流程，并提升安全性

本文基于 WWDC24 Streamline sign-in with passkey upgrades and credential managers 进行创作，阅读本文需要对 Passkey 有所了解
作者：Mig, iOS 开发，喜欢摄影、旅行、折腾群晖，就职于新加坡金融类公司
审核：

## Passkey 简介

PassKey 是 Web 行业通用无密码登录标准 WebAuthn 的 iOS 和 Android 系统内的实现，通过创建公私钥对和生物识别技术结合，来替换现有的互联网行业通行的「用户名 + 密码」登录逻辑。创建 Passkey 时，App 和网站传入域名和用户名，设备创建公私钥对，公钥回传给 App 并保存于服务器上，私钥保存在操作系统内；之后每次登陆时，App 或网站传入一个 challenge 随机字符串以供私钥签名，操作系统回传签名结果，服务端使用先前保存的公钥进行验证，验证通过，即视为正确的用户登录。由于没有密码，也不暴露私钥，安全性更高，每次登陆流程都是基于公私钥验签，因此完全没有钓鱼攻击风险。

## 本文主题简介

- 在 iOS18 中从网站和 App 为用户自动化的创建 Passkey
- 三方密码管理器的一些新 API 和新功能
- 如何在 iOS18 中的「密码」App 中，清晰明了的展示网站名称、网站图标等信息

## 新的自动化的 Passkey 创建流程

在现有常见登录流程中，需要用户依次输入用户名、密码、短信验证码/两步验证，然后才能登录成功。
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197345928356.jpg)
这个过程包含了多因素验证，用户需要多次输入和交互，为了安全，整个流程会有点不够简单直接。
有些开发者会在用户登录后，弹出页面提示用户可以创建 Passkey，并告知用户 Passkey 在登陆中更为安全和便捷。此时在现有的 API 下，如果用户想要创建 Passkey，就会出现创建 Passkey 的步骤，如下图所示
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197359892264.jpg)
在 iOS18 中，Apple 新提供了自动化创建 Passkey 的 API，App 和网站用户无需任何额外操作，就会生成 Passkey，并给到通知提醒。这种设计是为了让用户能更多的简洁快速的迁移到安全性更高的登录方式 - Passkey
用户只需点击一次，就可以完成高度安全的 Passkey 登陆；作为比较，传统的登录方式会有步骤 2 或者步骤 3，但在 Passkey 中只需要一个步骤。即使只需要一个步骤， Passkey 在预防攻击和安全性方面比传统多步骤验证表现更好。
当今互联网环境中，钓鱼攻击和其他形式的机密信息被盗是目前最普遍的账户丢失原因。要想预防钓鱼攻击，根本性的方法是移除所有潜在能被钓鱼的登录因素，本着这种思路，最佳的账户安全模式是，在用户创建账户时，就给用户设置好 Passkey 登录。
Passkey 既不能被忘记，也一般无需重置，假设一个账户创建时原生就没有密码，只有 Passkey，那么这种账户可以有效防范钓鱼攻击。
但现今的大部分已存在账户往往基于可被钓鱼攻击的秘钥因子，例如密码、短信验证码、邮箱验证码、App 推送验证码、2FA 验证码，讲这些因子组合起来，使用多因子验证，可以提高账户的防钓鱼安全性，但仍然无法根本性解决面对钓鱼攻击的脆弱性根本，因为账户的整体安全性取决于账户最脆弱的因子。
目前整个互联网行业正处在以往就得账户安全因子往新的 Passkey 上迁移的过程中，从所有秘钥因子都有被钓鱼风险，逐步转换为部分秘钥因子有钓鱼风险（Passkey 混合现有登陆方式），最终移除所有有风险秘钥因子后，只保留诸如 Passkey 之类的无风险秘钥因子，此时的账户登录更安全，且完全没有钓鱼风险。
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197382889619.jpg)
为了帮助开发者加速让用户更快的迁移至更安全的 Passkey，iOS18 中提供了全新的静默自动化创建 Passkey 的 API，该 API 包括 iOS18 原生 API 和浏览器 API

### 在 App 内静默创建 Passkey

![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197424728461.jpg)
有了这个新 API， 你讲无需引导用户或弹出任何界面或验证用户生物识别，来创建 Passkey
但这个 API 的成功调用，并生成和保存 Passkey 有一些限制：
1.用户必须为设备设置锁屏密码
2.登录 Apple ID ，并开启 iCloud KeyChain
3.使用 iCloud KeyChain 作为唯一的密码填充来源（例如不能使用 1Password）
4.用户必需在 iCloud KeyChain 中已经保存了其对应域名的账户名和密码信息
5.该 API 必须在用户调用 iCloud KeyChain 生物识别并填充密码之后方可被调用
截止本文发稿时，1Password 尚未适配，Demo 代码均基于 iCloud KeyChain 进行测试，请注意，如果 1Password 适配了 iOS18，配置了其项目中 Info.plist 的 `SupportsConditionalPasskeyRegistration` 为 `true`，那么理论上 1Password 也可以支持该静默创建，上述的限制逻辑就可以放宽至用户使用第三方密码管理器。
如果这些条件都得到满足那么你就可以获得成功创建的 Passkey 的公钥，这种静默创建的执行方式与之前生成 Passkey 的调用没有不同，只是新增了 requestStyle 作为选填参数，默认值为 `.standard` 。该 API 执行成功时，iOS 会发出一条通知，告知用户成功创建 Passkey，如果创建失败，iOS 系统不会有任何 UI 提醒，只会在 API 层面抛出异常。因此如果自动化静默创建失败，你可以降级回现有的 Passkey 创建逻辑，弹出提示并引导用户完成创建；当然你也可以在下次用户登陆时，重新调用此 API 进行重试。
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197440260050.jpg)

### 在浏览器内静默为用户创建 Passkey

浏览器内创建也只需新增一个参数 mediation 为 conditional ，在执行新的创建逻辑之前，检查浏览器环境是否支持（最低 iOS18）
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197437450302.jpg)
有了这些静默创建 API 可以加速 Passkey 的普及并升级用户账户的安全性，与此同时在用户体验层面 Passkey 所提供的单次点击单步骤登录，也会提高用户的满意度。
上文提到过，要想最终消除账户登录被钓鱼和泄露攻击的不安全性，需要完全移除不安全的登录因子，如静态密码。因此当用户升级至 Passkey 之后，开发者可以考虑关闭单纯静态的密码登录，只保留多因子验证登录，甚至完全移除静态密码因子，如静态密码。当所有不安全因子都被移除，账户安全就会被实质性的提高，从根本上抵御钓鱼和泄露的攻击。但这个过程需要开发者进行深思熟虑，结合自身的账户登录环境，建议是如果所有渠道的登录都可以基于 Passkey 进行，那么就可以考虑采取激进的升级策略。

## 三方密码管理器的新能力

针对第三方的密码管理器（如 1Password），iOS18 提供了新的能力，具体而言有三个：

- 支持静默创建 Passkey 功能 `SupportConditionalPasskeyRegistration`
- 支持自动填充 2FA 验证码 `ProvidesOneTimeCodes`
- 支持自动插入填充其他文本字段（如用户名，用户在文本框长按后点击插入按钮，可以唤起密码填充器） `ProvidesTextToInsert`

## 全新的密码 App

![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197457556311.jpg)
全新设计的「密码」App，界面上分为全部、Passkey、2FA 验证码、WiFi、安全提示、已删除。
密码 App 会将同个域名且同个用户名的所有信息都整理展示在单个项内，包括用户名、密码、域名信息、网站名称、网站 Icon、2FA 验证码、Passkey、备忘、分享情况等。
针对弱密码和有风险的密码项，会在安全提示内进行提示，并引导用户修改密码，修改密码按钮的默认网址为 <https://example.com/.well-known/change-password> ，网站开发者需要适配该链接才能正确修改密码。
为了能在密码 App 中展示的更加精美，网站开发者需要适配 OpenGraph 标签，OpenGraph 中的网站名称和高分辨率图表是密码 App 中单个项的标题和图标；如果网站没有适配 OpenGraph，那密码 App 会基于 App 内提供的名称或网站域名进行展示。
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197492340456.jpg)
在 Mac OS 中，用户可以从通知栏快速访问密码，该特性类似于现行流行的三方 1Password 密码管理器
![](http://wwdc24.oss-cn-hangzhou.aliyuncs.com/2024-06-30-17197475467585.jpg)
在 iOS18 中，App 和网站可以一键创建 2FA 验证码，直接打开一个 `optauth:` 的 URL 就可以实现，后续行为会被密码管理器托管。此外苹果建议 App 开发者在 iOS18 之后，向用户建议，将 2FA 验证码配置在 iOS18 自带的密码 App 中，相较于谷歌验证器，多了一个选择。

## 总结

- 即刻起开始部署更加简单易用，更加安全的 Passkey
- 基于自动静默创建 Passkey API，加速用户迁移至 Passkey 登录
- 更新网站的 OpenGraph 元数据，以确保网站密码信息在 iOS18 密码 App 内精美展示
- 使用新的一键 2FA 验证码配置流程，确保更多用户使用 2FA
**有关 Passkey 的其他实践，您可以参考**
WWDC23
[Deploy passkeys at work](https://developer.apple.com/videos/play/wwdc2023/10263)
WWDC22
[Meet passkeys](https://developer.apple.com/videos/play/wwdc2022/10092)
WWDC21
[Secure login with iCloud Keychain verification codes](https://developer.apple.com/videos/play/wwdc2021/10105)
