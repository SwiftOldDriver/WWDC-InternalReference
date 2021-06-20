WWDC21 10003 - 再谈 Apple Watch 的数据传输
===

# 前言

基于 [Session 10003](https://developer.apple.com/videos/play/wwdc2021/10003/) 梳理。

Apple Watch 自推出以来已经变得越来越独立。Series 3 是第一款具有蜂窝功能的该产品。

watchOS 6 中的独立 Watch Apps 让开发者能够编写不需要 iOS 伙伴的应用程序，并且用户可以通过 Watch 从应用程序商店购买。

watchOS 7 中引入 Family Setup，用户比以往任何时候都更独立，因为用户此时已经可以不需要配套的 iPhone。

随着 Apple Watch 的进一步更新，它又给我们提供了更多与 App 进行交流的方式。此 Session 主要内容有了解哪些策略可用于数据通信、如何为工作选择合适的工具。比较和对比 iCloud、Keychain、Watch Connectivity、Core Data 等技术的好处。

## 传输策略

随着 Apple Watch 不断更新，我们已经有了很多种数据传输的策略。 这些策略方式广泛的可以分为以下几类：

1. Keychain with iCloud Synchronization
2. CoreData with CloudKit
3. Watch Connectivity
4. URL Sessions
5. Sockets

为了能够更好的选择适合我们的业务场景工具，我们还需要知道以下几点信息：

1. Type of Data
2. Data source and destination
3. Reliance on companion iOS app
3. Support Family Setup
4. Timing

## Keychain with iCloud

Keychain 为密码、密钥和其他敏感凭据提供了安全存储。

通过在 watchOS 6.2 中引入的 iCloud Keychain Synchronization ，这些 Keychain items 可以同步到一个人的所有设备上。

在应用程序中，可以从 iCloud Synchronization 中获得：

* 密码自动填充
* 共享 Keychain items

### 密码自动填充

密码自动填充允许开发者通过很少的代码使用 Keychain 同步。使用方法有以下几步：

1、将 Associated Domains 能力添加到 Target。对于 Watch 应用程序，请将该功能添加到 WatchKit Extension Target 中。添加一个带有您的域名的网络凭据条目。

![密码自动填充配置](https://cdn.nlark.com/yuque/0/2021/png/269131/1623722908303-69208559-66a6-4bc0-b59b-8704f145c72a.png)

2、将 `apple-app-site-association` 文件添加到您的web服务器中。这个文件必须可以通过 HTTPS 访问，且无需重定向。该文件为 JSON 格式，没有文件扩展名，应放在服务器上的 `./well-known` 目录中。查看在线文档 "Supporting Associated Domains" 可获得完整细节。

`apple-app-site-association` 文件格式如下：

![密码自动填充配置文件格式](https://cdn.nlark.com/yuque/0/2021/png/269131/1623722890778-cb4395f5-0f0b-41c9-a635-fa2f7dd4f2a0.png)

3、将文本内容类型添加到安全字段和文本字段中。自动填充选项包括用户名、电子邮件地址、密码和新密码。对于新密码，系统将提示用户保存，并将在站点的 Keychain 中添加或更新记录。

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

自 watchOS 6.2 以来已提供自动填充建议，使用 watchOS 8 的新文本编辑体验甚至更好。

![密码自动填充效果](https://cdn.nlark.com/yuque/0/2021/png/269131/1623722865540-6566beea-652a-4ac6-809e-1ba94affb6b3.png)

有关使用密码自动填充的更多信息，请查看 "[Autofill everywhere](https://developer.apple.com/wwdc20/10115)"。

### 共享 Keychain items

![Keychain存储数据的特点](https://cdn.nlark.com/yuque/0/2021/png/269131/1623722847778-9663dc1d-7b96-4ec5-879f-ad040c1dbef5.png)

Keychain 是敏感数据的安全存储器，如密码、密钥和凭据。我们还可以在 Keychain 中存储一小部分其他共享数据，例如：用户对启动屏幕的偏好。我们一般不要将频繁变化的信息存储其中。存储在 Keychain 中的数据将被同步到该账号的所有设备上。

接下来我们以 OAuth2 令牌为例，详细阐述共享 Keychain items 的使用。

首先，我们需要添加 "Keychain Sharing or App Groups" 功能，即我们想要共享这些 Keychain items 的所有应用程序。通过配置这些共享项目防止其他应用程序访问，确保客户信息的安全和隐私。对于 Watch 应用程序，需要将该功能添加到  Watch Extension target。我们所有要共享 Keychain items 的应用程序也需要共享这个组。

![Keychain Sharing or App Groups](https://cdn.nlark.com/yuque/0/2021/png/269131/1623722787512-40c329d8-b6b0-4a1d-9e30-57c9e41c10a3.png)

现在，让我们看看在 Keychain 中存储 OAuth2 令牌的代码。

```
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

想要存储令牌，如果存在，我们则更新项目；如果不更新，则添加。

例如，我们已经创建了一个 OAuth2 令牌结构来包含令牌数据，比如令牌字符串、过期和刷新令牌。我们需要使令牌结构符合可编码的要求，以使其易于存储和检索。为此，我们创建了一个 query 字典。如果我们已为此服务器和帐户保存了一个属性，则这是与现有项匹配的属性集。

>注意：`kSecAttrSynchronizable` 设置为 "true" 则可同步属性。我们必须在查询中包含此属性，以表明我们希望我们的项目同步到所有用户的设备。我们将令牌编码为数据，并将该数据设置为属性字典中的 Keychain 项的值。然后，用查询和属性更新 Keychain 中的项。

现在，让我们来看一下添加方法。

```
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

要将令牌添加到 Keychain 中，我们将设置一个具有所有属性的字典。这包括我们用于查找现有项目的属性，以及令牌数据。然后，我们将用 attributes 调用 Keychain API 的添加方法。并检查返回代码，以确保它成功。

```
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

要从 Keychain 中检索令牌信息，我们需要设置一个 query 字典以查找所需的项。我们将在更新方法中包含的项的键值对。另外，我们还包括一些属性来告诉 Keychain API，我们是否希望返回项目属性。Keychain "copy matching" 方法使用我们的 query 进行搜索，并填充我们作为 "item" 提供的引用。在尝试访问检索的项目之前，将检查返回代码以确保找到。

然后，我们需要检查返回代码是否成功。获取的为 "item" 的副本字典，从字典中获取我们请求的令牌数据，并将数据解码为 OAuth2 令牌类型。现在，我们已经成功地保存、更新和检索了一个指向 Keychain 的 OAuth2 令牌，并与 Keychain Sharing Group 中的所有应用程序共享。

还有一个 Keychain 存储功能。就像你在用户设备上存储一些东西的地方一样，你应该在完成后把它删除。我们将使用我们现在熟悉的属性设置query 以进行搜索。用我们的 query 调用 Keychain API 的删除方法。仍然需要检查是否成功。如果是删除，则未找到它将会成功。现在，我们在完成数据后完成清理。

```
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

使用 iCloud Keychain 同步的 Keychain 服务是您的应用程序共享不频繁变化的小块数据的好方法，并且这些数据将同步到一个账号的所有设备上。使用 Associated Domains 可以轻松地将密码自动填充功能添加到应用程序中。

您还可以直接存储和检索值到 Keychain，并使用 Keychain 共享或应用程序组与其他应用程序共享。iCloud Keychain 同步不依赖于有 iOS 配套应用程序，它支持 Family Setup。这些同步需要根据网络可用性、电池和其他系统条件而定。

>注意：用户可以禁用 iCloud Keychain 同步，而且它并非在所有区域都可用。

## CoreData with CloudKit

使用 CloudKit 的 CoreData 可将本地数据库与用户共享应用程序 CloudKit 容器的所有其他设备同步。CoreData 与 SwiftUI 的集成简化了在Watch 应用程序中从数据库访问和显示数据的操作。

```
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

CloudKit 和 CoreData 是功能强大的工具。CoreData 与 SwiftUI 的集成使您在应用程序中更容易使用 CoreData 功能。可以使用 `@Environment` 向 "View" 提供托管 Context，并从数据库中获取结果。这些结果可以在 SwiftUI 列表和其他视图中使用。使用 CloudKit 的 CoreData 为我们提供了一种共享结构化数据的方法，它可以同步到个人的所有设备并备份到 iCloud 上。它并不依赖于有一个配套的 iPhone 应用程序，而是支持 Family Setup。根据网络可用性和系统条件进行同步。不要期望它是即时的，但 CloudKit 将为您的应用程序处理优化同步性能。

要了解更多关于在应用程序中使用 Core Data with CloudKit，请查看 "[Build apps that share data through CloudKit and Core Data](https://developer.apple.com/wwdc21/10015)" 和 "[Bring Core Data concurrency to Swift and SwiftUI](https://developer.apple.com/wwdc21/10017)"。

## Watch Connectivity

Watch Connectivity 框架对我们来说并不陌生，它具有以下特点：

* 在蓝牙范围内或在同一 WiFi 网络时，在 Watch 应用程序和其配套的 iPhone 应用程序之间发送数据
* 共享只有在一个设备（Watch/iPhone）上可用的数据

实际应用过程中我们知道，Connectivity 的使用，是有一些先决条件。

我们需要在应用生命周期中尽量早的激活 Watch 的 WCSession；还有可达性的问题，在我们发送数据前我们需要判断 WCSession 的 reachability。最后，所有 WCSession delegate 方法都在非主串行队列上调用。

Connectivity 可以支持下列几种数据的传输：

1. Application Context
2. File transfer
3. Transfer user info
4. Send Message

### Application Context

Application Context 是一个单一的属性列表字典，它被发送到后台的对应的应用程序，其目标是在应用程序醒来时可用。如果在发送上一个词典之前更新 Application Context，则它将被新值替换。

当有新数据时，Application Context 对于保持对应 App 上的最新内容以及可能频繁更新的数据非常有用。用户信息传输也会在后台向对应的 App 发送一个属性列表字典，但它与 Application Context 有点不同。每次更新用户信息字典时不是一个被替换的字典，而是按照每个用户信息字典传输的顺序排队和传递。开发者还可以访问该队列以取消传输。

需要注意的是，`updateApplicationContext:` 方法会在数据传输接收方不可达时可以调用。

### File transfer

文件传输类似于用户信息传输，一旦完成了一个，另一个就会走相似的操作。文件将排队发送到对应的应用程序，并在电源和其他条件允许时发送。开发者也可以访问该队列以取消传输。

在进行文件传输时，操作需要在后台进行。因为文件是排队发送的，我们还可以通过 `outstandingFileTransfers` 方法来实现取消未发送的文件。

传输文件时，文件被放在接收应用程序文档的 inbox 目录中。当从 delegate 中收到 `session:didReceiveFile:` 回调返回时，每个文件都将从 inbox 中删除。因此，在此方法返回之前，可以使用移动文件或以其他方式快速处理文件。

>注意：由于这个回调是在非主串行队列上调用的，如果调用异步方法来从 inbox 处理文件，很可能会遇到问题，因为文件将会消失。文件传输的时间基于系统条件，当然，传输较大的文件可能需要更长的时间。

### Transfer user info

`transferCurrentComplicationUserInfo(_:)` 是用户信息传输功能的一个特殊情况，可以发送复杂的数据到 Watch。

当用户从手机更新数据时，此即时传输允许 App 保持用户的活跃并发。而我们可以通过 `remainingComplicationUserInfoTransfers` 检查可用资源，如果在传输当前的复杂信息时没有可用资源，它仍然将被发送。它将只使用正常的用户信息传输队列。

### Send Message

我们可以使用 `sendMessage` 将数据发送到对应的 App，并得到回复。这是用于在可访问对应 App 时的交互式消息传递。无论我们发送字典或数据，都需要保持信息量小。

我们最好在使用消息发送方法时，指定相应的 `replyHandler` 操作。简短回复允许我们验证对应 App 是否收到消息以及数据是否正确。当我们在发送消息中包含 `replyHandler` 时，则要确保在 `replyHandler` 中实现了 delegate 中的 `didReceiveMessage:` 或 `didReceiveData:` 方法。

有关 "Watch Connectivity" 的更多信息，请查看 "[Introducing Watch Connectivity](https://developer.apple.com/wwdc15/713)"。

## URL Sessions

URL Session 是一种与服务器通信的常用的方式。按照使用方式来划分，我们可以将 URL Session 分为以下种类：

* Background URL Sessions
* Foreground URL Sessions

### Background URL Sessions

在多数场景下，我们更应该首选使用 Background URL Sessions。因为如果我们需要在前台进行数据交互，我们很可能遇到时间不够的问题。试想一下，当在前台的数据交互失败后，用户的使用体验如何？

多数情况下，Background URL Sessions 是任何时间通信可能延迟和大数据传输的正确选择。我们可以向应用程序发送推送通知，以指示新数据可用，并启动后台更新。而后台传输的确切时间将取决于系统条件。

具体我们以一个简单的例子来进行说明：

如果我有一些针对我的应用程序的设置，我想通过我的网络服务器存储，当我的用户保存这些设置时，我可以将它们保存在 Watch 上，然后将它们发送到后台的服务器。

```
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

为此，我创建了一个 Background URL Sessions 类来处理服务器通信的工作。

我们的 URL Session 将有一个后台配置和一个唯一的标识符，我们可以使用它在以后找到 Session。将发送启动事件属性设置为 true，以指示当需要处理 Session 上的任务时，Session 应在后台启动应用程序。

>注意：如果要传输大量数据，则应将 URL Session 配置的任意属性设置为 true，以便系统在最佳时间安排传输以获得最佳性能。

在这种情况下，我们还应该让用户知道，在他们连接到 WiFi 和电源之前，他们可能不会进行下载。

```
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

当我们准备好发送数据时，我们需要排队进行传输，以安排后台 Session。我们将创建并配置一个 URL 请求与我们的设置的内容更新到我们的服务器。

然后，我们将为 Session 上的请求创建一个 task。在这个简化的示例中，我们只向 Session 添加一个 task，但其实我们可以向 Session 添加多个请求以提高效率。设置早期的开始日期，以便稍后开始下载。请注意，系统将根据后台资源、网络和系统条件来确定 task 开始的实际时间。如果我们的激活了并发 delegate，我们的应用程序每小时最多可以接收4个后台刷新任务，所以将任务间隔至少 15 分钟，以防止它们被系统延迟。

```
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

最后，我们将状态设置为队列，以防有 Session 的观察者。当我们使用发送给我们的扩展代理的后台任务处理后台请求时，系统将通知我们的应用程序。为了处理该任务，我们需要创建一个符合 WK extension delegate 的类，并实现 `handle(_ backgroundTasks:)` 方法。对于后台 URL Session 刷新任务，我们将尝试在正在进行的请求列表中找到 Session。如果我们有它，我们将调用 Session 上的一个方法，将后台刷新任务添加到 Session 的列表中，这样我们就可以在完成对数据的处理后就让系统知道我们已经完成了它。

如果我们在列表中没有找到 Session，我们需要将任务标记为已完成。一旦完成，就必须立即完成后台刷新任务。

```
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
我们需要将扩展委托连接到我们的应用程序。为此做到这一点，我们将使用 extension delegate 适配器的 WK 扩展代理属性包装，并向我们的应用程序添加属性。

```
class BackgroundURLSession: NSObject, ObservableObject, Identifiable {
    
    // Add the Background Refresh Task to the list so it can be set to completed when the URL task is done.
	func addBackgroundRefreshTask(_ task: WKURLSessionRefreshBackgroundTask) {
    	backgroundTasks.append(task)
	}

}
```
系统将调用我们的 extension delegate 来处理我们的后台任务。在 extension delegate 中，我们调用此方法以将后台任务添加到现有的 Session 中。将此任务添加到后台任务列表中，以便我们可以在处理 URL 数据后立即标记它已完成。

```
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

更多关于 URL SEssions 相关资料，请查看 "[Keep your complications up to date](https://developer.apple.com/wwdc20/10049)" 和 "[Background execution demystified](https://developer.apple.com/wwdc20/10063)"。

## Sockets

Sockets 是直接与服务器通信的另一个选项。在具体实际中主要使用以下两种技术方案：

* HLS
* Web Sockets

有关 Socket 的更多相关资料，请查看 "[Streaming Audio on watchOS 6](https://developer.apple.com/wwdc19/716)"。

## 小结

至此，我们已经将 Watch 中支持的几种数据交互介绍完毕。而各种技术的使用场景、能力也是各不相同。我们总结了以下表格，希望我们能够根据实际场景选择合适的技术方案。

![方案对比](https://cdn.nlark.com/yuque/0/2021/png/269131/1623721446706-e30fc159-dc9c-4a4d-9e12-16f47662937e.png)


