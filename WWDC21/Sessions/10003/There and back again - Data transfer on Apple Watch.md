> 作者：Chars，任职于金山办公，WPS Office for iOS 核心开发之一。
>
> 审核：
>
> 郭鹏，老司机技术周报编辑，就职于丁香园，丁香妈妈 App 开发
>
> Damonwong，iOS 开发，老司机技术周报编辑，就职于淘系技术部

## 前言

基于 [Session 10003](https://developer.apple.com/videos/play/wwdc2021/10003/) 梳理。

Apple Watch 自推出以来，越来越独立。例如，Series 3 是第一款具有蜂窝功能的该产品。

watchOS 6 中 Watch Apps 不再需要 iOS 组件 App，并且可以通过 Watch 从应用商店购买。

watchOS 7 中引入了 Family Setup，用户则不再需要配套的 iPhone。

随着 Apple Watch 的进一步更新，它又给我们提供了更多与 App 进行数据通信的方式。此 Session 主要介绍 iCloud、Keychain、Watch Connectivity、Core Data 等技术，以及它们的优缺点。

## 传输策略

我们大致可以将传输策略可以分为以下几类：

1. Keychain with iCloud Synchronization
2. CoreData with CloudKit
3. Watch Connectivity
4. URL Sessions
5. Sockets

为了能够更好的选择适合我们业务场景的技术方案，我们还需要关注以下几点信息：

1. Type of Data
2. Data source and destination
3. Reliance on companion iOS app
3. Support Family Setup
4. Timing

下面我们就来看看每一种传输策略的具体介绍。

## Keychain with iCloud

Keychain 主要用于密码、密钥和其他敏感数据的存储。

在 watchOS 6.2 中已经引入了 iCloud Keychain Synchronization 传输策略。我们可以通过其将 Keychain items 同步到同一账号的所有设备上。

iCloud Synchronization 提供的能力大致可以分成以下两种：

* 密码自动填充
* 共享 Keychain items

### 密码自动填充

密码自动填充功能源自于文本自动填充功能，只不过，密码属于隐私数据，那么我们就需要考虑数据安全性问题。

下图是使用自动填充文本的界面效果：

![自动填充地址](https://images.xiaozhuanlan.com/photo/2021/bb729e173a960117dc2df8d449f0765d.png)

而需要实现上图文本自动填充，只需要设定 `UITextField.textContentType` 为 `.fullStreetAddress` 即可。

目前已经支持很多数据的自动填充，未来还会继续增加。

![自动填充的元素列表](https://images.xiaozhuanlan.com/photo/2021/71e1a8bcdef63b642f96ecc495dd5a12.png)

以上都是自动填充在 iOS 上的应用。

现在我们可以用很少的代码在 Watch App 上添加密码自动填充功能。具体步骤如下：

1、将 Associated Domains Capability 添加到 Target（Watch App 上则是将该 Capability 添加到 WatchKit Extension Target）中，在其中添加一个带有我们域名的 `webcredentials` entry。

![密码自动填充配置](https://images.xiaozhuanlan.com/photo/2021/d80d164902c872321918b205d37b8021.png)

2、将 `apple-app-site-association` 文件添加到我们的 web 服务器中。这个文件必须可以通过 HTTPS 访问，且无需重定向。该文件为 JSON 格式，没有文件扩展名，需要放在服务器上的 `./well-known` 目录中。

`apple-app-site-association` 文件格式如下：

![密码自动填充配置文件格式](https://images.xiaozhuanlan.com/photo/2021/0b18b04927953eb4687061cf25ec8a95.png)

更多介绍，请查看文档 "[Supporting Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains?preferredLanguage=occ)" 。

3、将文本内容类型添加到安全字段和文本字段中。例如：示例中的自动填充选项包括用户名和密码。

```swift
struct LoginView: View {
   
    @State private var username = ""
    @State private var password = ""
    
    var body: some View {
        Form {
            TextField("User:", text: $username)
                .textContentType(.username)
            
            SecureField("Password", text: $password) 
                .textContentType(.password)
            
            Button {
                processLogin()
            } label: {
                Text("Login")
            }
            
            Button(role: .cancel) {
                cancelLogin()
            } label: {
                Label("Cancel", systemImage: "xmark.circle")
            }
        }
    }
    
    private func cancelLogin() {
        // Implement your cancel logic here
    }
    
    private func processLogin() {
        // Implement your login logic here
    }
}
```

自 watchOS 6.2 以来已提供自动填充建议。目前，watchOS 8 的新文本编辑体验会更好。

![密码自动填充效果](https://images.xiaozhuanlan.com/photo/2021/0bc204298235deaeb5f648fd6ca9c629.png)

有关使用密码自动填充的更多信息，请查看 "[Autofill everywhere](https://developer.apple.com/wwdc20/10115)"。

### 共享 Keychain items

![Keychain存储数据的特点](https://images.xiaozhuanlan.com/photo/2021/d55eda03c2736d04b288ad560430f7f4.png)

我们通常会将敏感数据（如密码、密钥和凭据）存储在 Keychain 中。但我们还可以用 Keychain 存储一些共享数据，例如：用户对启动屏幕的偏好。

不过我们需要注意，不要将频繁变化的信息存储在 Keychain 中。另外，存储在 Keychain 中的数据也会同步到该账号的所有设备上。

接下来我们以 OAuth2 令牌为例，讲述述共享 Keychain items 的使用。

1、添加 "Keychain Sharing or App Groups" Capability（ Watch App 则需要将该 Capability 添加到  Watch Extension target），即我们想要共享这些 Keychain items 的所有 App。

通过配置这些共享项目防止其他 App 访问，来确保用户信息的安全和隐私。而我们所有要共享 Keychain items 的 App 也需要共享这个组。

![Keychain Sharing or App Groups](https://images.xiaozhuanlan.com/photo/2021/be854b29eea133ba1db0877b8fdecacf.png)

2、让我们看看使用 Keychain 存储 OAuth2 令牌的代码。

```swift
func storeToken(_ token: OAuth2Token, for server: String, account: String) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassInternetPassword,
      kSecAttrServer as String: server,
      kSecAttrAccount as String: account,
      kSecAttrSynchronizable as String: true,
    ]
    
    let tokenData = try encodeToken(token)
    let attributes: [String: Any] = [kSecValueData as String: tokenData]
    
    let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    
    guard status != errSecItemNotFound else {
        try addTokenData(tokenData, for: server, account: account)
        return
    }
    
    guard status == errSecSuccess else {
        throw OAuthKeychainError.updateError(status)
    }
}
```

上述代码是通过 `SecItemUpdate` 或 `addTokenData` 的方式，来存储令牌。

例如，我们已经创建了一个 OAuth2 令牌数据模型，内含令牌字符串、过期和刷新令牌等元素。我们需要使令牌结构遵循 NSCoding，以使其易于存储和检索。为此，我们创建了一个 query 字典。

>注意：`kSecAttrSynchronizable` 设置为 "true" 则可同步属性。我们必须在查询中包含此属性，指定项目是否同步到所有用户的设备。

上述提到的 `addTokenData` 方法，代码如下：

```swift
func addTokenData(_ tokenData: Data,
                  for server: String,
                  account: String) throws {
    let attributes: [String: Any] = [
      kSecClass as String: kSecClassInternetPassword,
      kSecAttrServer as String: server,
      kSecAttrAccount as String: account,
      kSecAttrSynchronizable as String: true,
      kSecValueData as String: tokenData,
    ]
    
    let status = SecItemAdd(attributes as CFDictionary, nil)
    
    guard status == errSecSuccess else {
        throw OAuthKeychainError.addError(status)
    }
}
```

要将令牌添加到 Keychain 中，我们需要设置一个具有所有属性的字典。然后，用 attributes 作为参数调用 `SecItemAdd` 方法。

3、存储令牌数据后，我们如何获取呢？下面是检索令牌数据的方法：

```swift
func retrieveToken(for server: String, account: String) throws -> OAuth2Token? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassInternetPassword,
      kSecAttrServer as String: server,
      kSecAttrAccount as String: account,
      kSecAttrSynchronizable as String: true,
      kSecReturnAttributes as String: false,
      kSecReturnData as String: true,
    ]
        
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary,
                                     &item)
        
    guard status != errSecItemNotFound else {
        // No token stored for this server account combination.
        return nil
    }
    
    guard status == errSecSuccess else {
        throw OAuthKeychainError.retrievalError(status)
    }
    
    guard let existingItem = item as? [String : Any] else {
        throw OAuthKeychainError.invalidKeychainItemFormat
    }
    
    guard let tokenData = existingItem[kSecValueData as String] as? Data else {
        throw OAuthKeychainError.missingTokenDataFromKeychainItem
    }
    
    do {
        return try JSONDecoder().decode(OAuth2Token.self, from: tokenData)
    } catch {
        throw OAuthKeychainError.tokenDecodingError(error.localizedDescription)
    }
}
```

首先，我们需要创建一个 query 字典，设置查找所需的项。然后调用 `SecItemCopyMatching` 方法。检索到的结果会填充 "item" 参数。

我们从 item 中获取请求的令牌数据，并将数据解码为 OAuth2 令牌类型。

到此，我们已经完成了使用 Keychain 来存储和检索 OAuth2 令牌数据的示例操作。

需要注意的是，使用 Keychain 存储数据，在不需要存储后一定要把那些数据删除。例如下面的代码：

```swift
func removeToken(for server: String, account: String) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassInternetPassword,
      kSecAttrServer as String: server,
      kSecAttrAccount as String: account,
      kSecAttrSynchronizable as String: true,
    ]
  
    let status = SecItemDelete(query as CFDictionary)
    
    guard status == errSecSuccess || status == errSecItemNotFound else {
        throw OAuthKeychainError.deleteError(status)
    }
}
```

### 小结

通过以上两个功能的介绍，可以确定 iCloud Keychain 同步是共享 App 中不频繁变化的数据的最佳方式。

iCloud Keychain 同步不依赖于有 iOS 配套应用程序，也支持 Family Setup。

>注意：用户可以禁用 iCloud Keychain 同步，且它并非在所有区域都可用。

## CoreData with CloudKit

紧接着，我们来看另一种数据传输策略，CoreData with CloudKit。

使用 CloudKit 的 CoreData 可将本地数据库与用户共享应用程序 CloudKit 容器的所有其他设备同步。不仅如此，CoreData 与 SwiftUI 的集成简化了在 Watch 应用程序中从数据库访问和显示数据的操作。

如果我们需要开发一个多平台的 App，使用这个数据通信方式的话，我们只需要设计好数据模型即可。

我们还可以通过 Core Data 中多种配置，将 Watch App 中适合运行具有更多存储和电池容量的数据当中有意义的部分进行分段。

```swift
import CoreData
import SwiftUI

struct CoreDataView: View {
    
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Setting.itemKey, ascending: true)],
        animation: .easeIn)
    private var settings: FetchedResults<Setting>
    
    var body: some View {
        List {
            ForEach(settings) { setting in
                SettingRow(setting)
            }
        }
    }
}
```

上文提到 CoreData 与 SwiftUI 的集成使我们在应用程序中能很容易的使用 CoreData 功能。

上面的代码中，我们使用 `@Environment` 向 "View" 提供托管 Context，从数据库中获取结果。这些结果可以在 SwiftUI 列表和其他视图中使用。使用 CloudKit 的 CoreData 为我们提供了一种共享结构化数据的方法，它可以同步到个人的所有设备并备份到 iCloud 上。它并不依赖于有一个配套的 iPhone 应用程序，而是支持 Family Setup。同步时机根据网络可用性和系统条件，并不是即时的。

要了解更多关于在应用程序中使用 Core Data with CloudKit，请查看 "[Build apps that share data through CloudKit and Core Data](https://developer.apple.com/wwdc21/10015)" 和 "[Bring Core Data concurrency to Swift and SwiftUI](https://developer.apple.com/wwdc21/10017)（[《【WWDC21 10017】为 Swift 和 SwiftUI 带来 Core Data 并发》](https://xiaozhuanlan.com/topic/4625791038)）"。

## Watch Connectivity

在介绍 Watch Connectivity 是什么之前，我们来看看早起 App 的数据是怎样存储的。

![watchOS 2 存储数据](https://images.xiaozhuanlan.com/photo/2021/814ecd9759d9bcbd093526b99e6ea976.png)

上图不难看出，iPhone 与 Watch 上的 App 内的数据是独立的，彼此无法进行交互。为了解决这个问题，Apple 设计了 Watch Connectivity 框架，下图比较简洁的指出了它们彼此间的关联与作用。

![Watch Connectivity](https://images.xiaozhuanlan.com/photo/2021/c660fb6fbcbc31f9954ed7fb79b23acd.png)

Watch Connectivity 最早是在 watchOS 2、iOS 9 上推出。这里不再做过多的介绍。这里主要总结一下这个框架的几个特点：

* 在蓝牙范围内或在同一 WiFi 网络时，在 Watch 应用程序和其配套的 iPhone 应用程序之间发送数据
* 共享只有在一个设备（Watch/iPhone）上可用的数据

实际应用过程中我们知道，Connectivity 的使用，是有一些注意点：

1、我们需要在应用生命周期中尽量早的 `Activate` Watch 的 WCSession；

2、可达性的问题，在我们发送数据前，需要判断 WCSession 的 `reachability`；

3、所有 WCSession `delegate` 方法都在非主串行队列上调用。因此，如果需要在这些方法中操作界面，需要切换到主线程上。

4、判断 WCSession 是否可用，`WCSession.isSupported()`。

对于传输内容方面的限制，Connectivity 传输内容可以分为以下几种：

1. Application Context
2. File transfer
3. Transfer user info
4. Send Message

下面我们来分别了解一下它们。

### Application Context

Application Context 是一个单一的属性列表字典，它被发送到后台对应的应用程序，在 App 切换到前台时可用。如果在发送上一个词典之前更新 Application Context，则它将被新值替换。

当有新数据时，Application Context 对于保持对应 App 上的最新内容以及可能频繁更新的数据非常有用。虽然 Transfer user info 也会在后台向对应的 App 发送一个属性列表字典，但它与 Application Context 有点不同。每次更新用户信息字典时不是一个被替换的字典，而是按照每个用户信息字典传输的顺序排队和传递。开发者可以访问该队列以取消传输。

需要注意的是，`updateApplicationContext:` 方法会在数据传输接收方不可达时调用。

### File transfer

文件传输类似于 Transfer user info，在电源和其他条件允许时，文件将排队发送到对应的应用程序。开发者可以访问该队列以取消传输。

在进行文件传输时，操作需要在后台进行。因为文件是排队发送的，我们可以通过 `outstandingFileTransfers` 方法来实现取消未发送的文件。

传输文件时，文件被放在接收应用程序文档的 inbox 目录中。当从 delegate 中收到 `session:didReceiveFile:` 回调返回时，每个文件都将从 inbox 中删除。因此，在此方法返回之前，可以使用移动文件或以其他方式快速处理文件。

>注意：由于这个回调是在非主串行队列上调用的，如果调用异步方法来从 inbox 处理文件，很可能会遇到文件消失的问题。另外，文件传输的时间是基于系统条件。文件传输的快慢由文件大小决定。

### Transfer user info

这种数据传输方式是一种即时传输方式，我们可以通过 `remainingComplicationUserInfoTransfers` 检查可用资源。当我们需要传输数据，但是又没有可用资源时，这种传输方式会采用队列的形式，排队等待发送时机。

这种方式的主要 API 是`transferCurrentComplicationUserInfo(_:)`，我们可以理解成它是用户信息传输功能的一个特殊情况，它可以发送复杂的数据到 Watch。

### Send Message

我们使用 `sendMessage` 将数据发送到对应的 App 时，可以得到回复。主要用于与对应 App 进行交互式消息传递。但无论我们发送字典或数据，都需要保持信息量小。

在使用此类消息发送方法时，应指定相应的 `replyHandler` 操作。且需要确保在 `replyHandler` 中实现了 delegate 中的 `didReceiveMessage:` 或 `didReceiveData:` 方法。

有关 "Watch Connectivity" 的更多信息，请查看 "[Introducing Watch Connectivity](https://developer.apple.com/wwdc15/713)"。

## URL Sessions

URL Session 是一种与服务器通信的常用的方式。按照使用方式来划分，我们可以将 URL Session 分为以下种类：

* Background URL Sessions
* Foreground URL Sessions

### Background URL Sessions

在多数场景下，我们更应该首选使用 Background URL Sessions。因为如果我们需要在前台进行数据交互，我们很可能遇到时间不够的问题（例如：数据量大、网络速度慢等情况导致时间不够）。试想一下，当在前台的数据交互失败后，用户的使用体验如何？

具体我们以一个简单的例子来进行说明：

例如，我们有一些 App 的个性化配置数据，需要通过网络服务器存储，当用户更新这些配置时，则我们需要将它们保存在 Watch 上，然后将它们发送到后台的服务器。

```swift
class BackgroundURLSession: NSObject, ObservableObject, Identifiable {
    
    /// The current status of the session
    @Published var status = Status.notStarted
    
    /// The downloaded data (populated when status == .completed)
    @Published var downloadedURL: URL?
    
    private var backgroundTasks = [WKURLSessionRefreshBackgroundTask]()
    
    private lazy var urlSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: sessionID)
            // Set isDiscretionary = true if you are sending or receiving large 
            // amounts of data. Let Watch users know that their transfers might 
            // not start until they are connected to Wi-Fi and power.
            config.isDiscretionary = false
            config.sessionSendsLaunchEvents = true
            return URLSession(configuration: config,
                              delegate: self, delegateQueue: nil)
        }()
}
```

为此，我们需要创建了一个 Background URL Sessions 类来处理服务器通信的工作。

我们为 URL Session 配置的唯一标识符，那么我们就可以使用它找到某一 Session。将 `sessionSendsLaunchEvents` 设置为 true，表示当需要处理 Session 上的任务时，Session 应在后台启动应用程序。

>注意：如果要传输大量数据，则应将 URL Session 配置的 `isDiscretionary` 设置为 true，以便系统选择最佳时间进行数据传输。

在这种情况下，我们还应该让用户知道，在他们的 Watch 连接到 WiFi 和电源之前，它们可能不会进行下载。

```swift
// This is a member of the BackgroundURLSession class in the example. 
// Enqueue the URLRequest to send in the background. 
func enqueueTransfer() {
    var request = URLRequest(url: url)
    request.httpBody = body
    if body != nil {
        request.httpMethod = "POST"
    }
    if let contentType = contentType {
        request.setValue(contentType, forHTTPHeaderField: "Content-type")
    }
    let task = urlSession.downloadTask(with: request)
    task.earliestBeginDate = nextTaskStartDate
  
    BackgroundURLSessions.sharedInstance().sessions[sessionID] = self
  
    task.resume()
    status = .queued
}
```

当我们准备好发送数据时，还需要排队进行传输。

然后，为 Session 上的请求创建一个 task。在这个简化的示例中，我们只向 Session 添加一个 task，但其实我们可以向 Session 添加多个请求以提高效率。设置一个开始日期，以便稍后开始下载。需要注意，系统将根据后台资源、网络和系统条件来确定 task 开始的实际时间。如果我们激活了并发 delegate，那么我们的应用程序每小时最多可以接收4个后台刷新任务，所以最好将任务间隔至少 15 分钟，以防止它们被系统延迟。

```swift
class ExtensionDelegate: NSObject, WKExtensionDelegate {
    
    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        // Sent when the system needs to launch the application in the background to process tasks. Tasks arrive in a set, so loop through and process each one.
        for task in backgroundTasks {
            // Use a switch statement to check the task type
            switch task {
            case let backgroundTask as WKApplicationRefreshBackgroundTask:
                // Be sure to complete the background task once you’re done.
                backgroundTask.setTaskCompletedWithSnapshot(false)
            case let snapshotTask as WKSnapshotRefreshBackgroundTask:
                // Snapshot tasks have a unique completion call, make sure to set your expiration date
                snapshotTask.setTaskCompleted(restoredDefaultState: true, estimatedSnapshotExpiration: Date.distantFuture, userInfo: nil)
            case let connectivityTask as WKWatchConnectivityRefreshBackgroundTask:
                // Be sure to complete the connectivity task once you’re done.
                connectivityTask.setTaskCompletedWithSnapshot(false)
            case let urlSessionTask as WKURLSessionRefreshBackgroundTask:
                if let session = BackgroundURLSessions.sharedInstance()
                        .sessions[urlSessionTask.sessionIdentifier] {
                    session.addBackgroundRefreshTask(urlSessionTask)
                } else {
                    // There is no model for this session, just set it complete
                    urlSessionTask.setTaskCompletedWithSnapshot(false)
                }
            case let relevantShortcutTask as WKRelevantShortcutRefreshBackgroundTask:
                // Be sure to complete the relevant-shortcut task once you're done.
                relevantShortcutTask.setTaskCompletedWithSnapshot(false)
            case let intentDidRunTask as WKIntentDidRunRefreshBackgroundTask:
                // Be sure to complete the intent-did-run task once you're done.
                intentDidRunTask.setTaskCompletedWithSnapshot(false)
            default:
                // make sure to complete unhandled task types
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }
}
```

最后，我们将状态设置为队列，以防有 Session 的观察者。当我们使用后台任务处理发送请求时，系统将通知我们的应用程序。为了处理该任务，我们需要创建一个符合 WK extension delegate 的类，并实现 `handle(_ backgroundTasks:)` 方法。

对于后台 URL Session 刷新任务，我们将尝试在正在进行的请求列表中找到 Session。如果我们有它，我们将调用 Session 上的一个方法，将后台刷新任务添加到 Session 的列表中，这样我们就可以在完成对数据的处理后就让系统知道我们已经完成了它。

如果我们在列表中没有找到 Session，我们需要将任务标记为已完成。一旦完成，就必须立即完成后台刷新任务。

```swift
// Connect the Extension Delegate to the App

@main
struct MyWatchApp: App {
    
    @WKExtensionDelegateAdaptor(ExtensionDelegate.self) var extensionDelegate
    
    @SceneBuilder var body: some Scene {
        WindowGroup {
            NavigationView {
                ContentView()
            }
        }
    }
}
```
使用 extension delegate 适配器的 WK 扩展代理属性 package，并向我们的应用程序添加属性。就可以将扩展委托连接到我们的应用程序。

```swift
class BackgroundURLSession: NSObject, ObservableObject, Identifiable {
    
    // Add the Background Refresh Task to the list so it can be set to completed when the URL task is done.
	func addBackgroundRefreshTask(_ task: WKURLSessionRefreshBackgroundTask) {
    	backgroundTasks.append(task)
	}

}
```
系统将调用我们的 extension delegate 来处理我们的后台任务。在 extension delegate 中，我们调用此方法将后台任务添加到现有的 Session 中。将此任务添加到后台任务列表中，以便我们可以在处理 URL 数据后立即标记它已完成。

```swift
extension BackgroundURLSession : URLSessionDownloadDelegate {
    
    private func saveDownloadedData(_ downloadedURL: URL) {
        // Move or quickly process this file before you return from this function.
        // The file is in a temporary location and will be deleted.
    }
    
    func urlSession(_ session: URLSession,
                    downloadTask: URLSessionDownloadTask,
                    didFinishDownloadingTo location: URL) {
        saveDownloadedData(location)
      
        // We don't need more updates on this session, so let it go.
        BackgroundURLSessions.sharedInstance().sessions[sessionID] = nil
      
        DispatchQueue.main.async {
            self.status = .completed
        }
        
        for task in backgroundTasks {
            task.setTaskCompletedWithSnapshot(false)
        }
    }
}
```

最后，设置我们的后台任务已完成。这可以让系统知道我们已经完成了后台处理。它可以防止系统因超过其后台限制而终止我们的应用程序。


### Foreground URL Sessions

与后台相对应，Foreground URL Sessions 主要是在前台运行，实际开发中我们并不常用。主要还是因为其具体以下限制：

1. 2.5 分钟的超时时间
2. 需要服务端的快速响应
3. 在 App 交互中需要及时的数据交互

想要了解更多 URL Sessions 相关知识，请查看 "[Keep your complications up to date](https://developer.apple.com/wwdc20/10049)（[《保持复杂功能的及时更新》](https://xiaozhuanlan.com/topic/7256810394)）" 和 "[Background execution demystified](https://developer.apple.com/wwdc20/10063)（[《WWDC20 10063 解密后台运行》](https://xiaozhuanlan.com/topic/7639820154)）"。

## Sockets

Sockets 是直接与服务器通信的另一个选项。Socket 并不是一个具体的网络协议，它只是一个网络技术接口的封装规范。

那么在 iOS 上，我们可以通过 NSURLSession 中 API 进行使用。现在，在我们的 Watch 平台上，一样是通过 NSURLSession 进行使用。

在实际应用中，一般使用下面两种技术能力：

* HLS
* Web Sockets

Web Sockets 相信大家都很熟悉，主要是用来建立长链接。iPhone 的 Push 其实就是一个长链接。

但是对于 HLS 可能会比较陌生，其实 HLS 就是 Watch 支持的一种音频流播放格式。

![HLS 音频流格式](https://images.xiaozhuanlan.com/photo/2021/c94d27bd82e15398d39c5ba8c48881a6.png)

主要是为了解决在 Watch 上进行媒体播放的问题。

下图是说明我们使用 HLS 或自定义媒体流格式，在技术上大概是怎样的位置。

![HLS 技术框架位置](https://images.xiaozhuanlan.com/photo/2021/f639fa4dd165e54eb4fbd17d4a2d83a7.png)

![Audio Stream 技术框架位置](https://images.xiaozhuanlan.com/photo/2021/1b3291c20f5bd8fd3b28b0f2c8b82761.png)

HLS 主要是封装在 AVFoundation 中，具体的一些 API，在这里不进行更多的阐述。

Audio Stream 则可以借助 NSURLSession 中的 Stream 类 API 实现数据传输，更多 API 请自行查看 SDK 中相关文档。

有关 Watch 上音频流的更多相关资料，请查看 "[Streaming Audio on watchOS 6](https://developer.apple.com/wwdc19/716)"。

## 小结

至此，我们已经将 Watch 中支持的几种数据交互介绍完毕。而各种技术的使用场景、能力也是各不相同。我们总结了以下表格，希望我们能够根据实际场景选择合适的技术方案。

![方案对比](https://images.xiaozhuanlan.com/photo/2021/14b7068c952fa7bd827ea7527801e1b6.png)


## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**


