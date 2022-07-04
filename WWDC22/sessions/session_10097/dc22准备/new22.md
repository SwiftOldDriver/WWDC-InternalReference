♪ ♪ Hi. I'm Charles Ying. Welcome to What's new in App Clips. An App Clip is a small part of an app. They're light and fast, and easy to discover, so you can quickly get what you need right when you need it. They can be found in Messages, Maps, Spotlight, and Safari, or out in the world with QR codes and App Clip Codes. One really cool example is Toast. Toast's app clip lets you scan a QR code to pay for your food right at your table! Toast configured their App Clip to open from an existing QR code printed on a receipt. The App Clip has resulted in users checking out faster, and more users choosing to install the full app. Building an App Clip into an existing flow is a great way to streamline your experience.

```
♪ ♪ 你好。我是查尔斯·英。欢迎使用 App Clips 中的新功能。 App Clip 是应用程序的一小部分。它们轻巧快速，易于发现，因此您可以在需要时快速获得所需的东西。它们可以在消息、地图、Spotlight 和 Safari 中找到，也可以通过 QR 码和 App Clip Codes 在世界各地找到。一个非常酷的例子是 Toast。 Toast 的应用程序剪辑可让您在餐桌上扫描 QR 码为您的食物付款！ Toast 将他们的 App Clip 配置为从打印在收据上的现有二维码打开。 App Clip 让用户结账速度更快，更多用户选择安装完整的应用程序。将 App Clip 构建到现有流程中是简化您的体验的好方法。
```



Today you'll learn about new features that let your users do more with your App Clip, and make developing App Clips even easier. Let's start with the App Clip size limit.

App Clips are light and fast, and designed for speed. To make App Clips feel instant, they need to be small. And since wireless networks are faster than they were two years ago, I'm happy to say that new in iOS 16, App Clips can now be up to 15 MB in size. This gives you more room to build your ideal experience. Set your App Clip's minimum version to iOS 16 for the new limit, or stay under 10 MB to be compatible with iOS 15 and earlier. Either way, you can always download additional resources after your App Clip launches. Speed is still key to a great experience. Your users won't always be in locations with a fast network, so optimizing your App Clip is still as critical as ever. To learn more about optimizing your App Clip, please watch, "Build light and fast App Clips”.

```
今天，您将了解新功能，这些新功能可以让您的用户使用您的 App Clip 做更多事情，并使开发 App Clips 变得更加容易。让我们从 App Clip 大小限制开始。

App Clips 轻巧快速，专为速度而设计。为了让 App Clips 感觉即时，它们需要很小。而且由于无线网络比两年前更快，我很高兴地说，iOS 16 中的新功能，App Clips 的大小现在可以达到 15 MB。这为您提供了更多空间来构建您的理想体验。将 App Clip 的最低版本设置为 iOS 16 以获得新限制，或保持在 10 MB 以下以兼容 iOS 15 及更早版本。无论哪种方式，您都可以在 App Clip 启动后下载其他资源。速度仍然是出色体验的关键。您的用户不会总是处于网络快速的位置，因此优化您的 App Clip 仍然与以往一样重要。要了解有关优化 App Clip 的更多信息，请观看“构建轻巧快速的 App Clips”
```





 Next, I'm really excited to show you a simple new tool that makes sure your App Clip experience or universal link is set up correctly. Here's how it works. On your iPhone or iPad, go to Developer Settings and under App Clips Testing, select Diagnostics. Now, enter your URL. You can turn on Developer Settings by connecting your device to Xcode. iOS will check your URL's configuration. If everything is set up right, you'll see these green checkboxes.

But, if there's something wrong, you'll see a screen like this one that tells you exactly what's happening. This will help you fix problems like Safari's banner not showing, or navigating to a web page instead of your App Clip. Each diagnostic has a link to documentation to explain the configuration step further. Now you'll be able to see exactly what's wrong.

App Clip diagnostics checks App Clip experiences that use physical codes, Safari and iMessage, and it will also check your universal link associated domains configuration. This simple new tool makes it so much easier to get your configuration right.

```
接下来，我很高兴向您展示一个简单的新工具，可确保您的 App Clip 体验或通用链接设置正确。这是它的工作原理。在您的 iPhone 或 iPad 上，转到开发人员设置，然后在 App Clips 测试下，选择诊断。现在，输入您的网址。您可以通过将设备连接到 Xcode 来打开开发人员设置。 iOS 将检查您的 URL 配置。如果一切设置正确，您将看到这些绿色复选框。

但是，如果有什么问题，你会看到一个像这样的屏幕，告诉你到底发生了什么。这将帮助您解决 Safari 的横幅未显示或导航到网页而不是 App Clip 等问题。每个诊断都有一个文档链接，以进一步解释配置步骤。现在您将能够确切地看到问题所在。

App Clip 诊断检查使用物理代码、Safari 和 iMessage 的 App Clip 体验，它还将检查您的通用链接关联域配置。这个简单的新工具使您的配置变得更加容易。
```



Next, CloudKit.

CloudKit is a framework that lets your app access data stored on iCloud. Up until now, CloudKit has not been available for App Clips. Your App Clip might be using a server to read data or resources.

New in iOS 16, App Clips can also read data and resources stored in a CloudKit public database. You can now share the same code, access the same data in both your app and App Clip with all the power and scale CloudKit provides. An important difference between apps and App Clips is that App Clips can read from a public database but can't write data to CloudKit. App Clips also can't use cloud documents and the key-value store. This keeps the promise to users that when an App Clip isn't used anymore, iOS will delete the App Clip and its data.

To enable CloudKit for your App Clip in Xcode, open your App Clip target's Signing and Capabilities tab, and select the CloudKit container you want your App Clip to use. This CloudKit container can be a new or existing container shared with your full app.

Here's an example of how to read CloudKit public data from your App Clip. Create a CKContainer with the container's identifier and access the publicCloudDatabase property. Then fetch the record you want from the public database.

```
接下来，CloudKit。

CloudKit 是一个框架，可让您的应用访问存储在 iCloud 上的数据。到目前为止，CloudKit 还不能用于 App Clips。您的 App Clip 可能正在使用服务器来读取数据或资源。

iOS 16 中的新增功能，App Clips 还可以读取存储在 CloudKit 公共数据库中的数据和资源。您现在可以使用 CloudKit 提供的所有功能和规模在您的应用程序和 App Clip 中共享相同的代码、访问相同的数据。应用程序和 App Clips 之间的一个重要区别是 App Clips 可以从公共数据库中读取，但不能将数据写入 CloudKit。 App Clips 也不能使用云文档和键值存储。这兑现了对用户的承诺，即当不再使用 App Clip 时，iOS 将删除 App Clip 及其数据。

要在 Xcode 中为您的 App Clip 启用 CloudKit，请打开 App Clip 目标的 Signing and Capabilities 选项卡，然后选择您希望 App Clip 使用的 CloudKit 容器。此 CloudKit 容器可以是与您的完整应用共享的新容器或现有容器。

下面是一个如何从 App Clip 中读取 CloudKit 公共数据的示例。使用容器的标识符创建一个 CKContainer 并访问 publicCloudDatabase 属性。然后从公共数据库中获取您想要的记录。
```



Next, keychain migration.

Today, when you want to transfer sensitive information, like authentication tokens and payment information from your App Clip to your full app, your App Clip would store this data in a shared app group container. iOS saves this data when a user upgrades from your App Clip to your full app.

Your full app reads the app group container and stores that information in the keychain.

However, the keychain is the ideal place to securely store this type of information. New this year, when a user installs your app, items stored in your App Clip's keychain are transferred from your App Clip to your app. Now your App Clip can simply store secure items in the keychain and they will be moved to your app when it's installed.

Shared keychain groups and iCloud Keychain are not supported. This keeps the promise to users that keychain information won't stick around when an App Clip isn't used anymore.

Here's an example of how to store and read login information in the keychain. The code is the same for both app and App Clip. You can add new items to the keychain with SecItemAdd. And fetch these items from the keychain with SecItemCopyMatching. And add a label to your items to help your full app identify that the items were saved by your App Clip.

```
接下来，钥匙串迁移。

今天，当您想要将敏感信息（例如身份验证令牌和支付信息）从 App Clip 传输到完整应用时，您的 App Clip 会将这些数据存储在共享的应用组容器中。当用户从您的 App Clip 升级到您的完整应用时，iOS 会保存这些数据。

您的完整应用程序读取应用程序组容器并将该信息存储在钥匙串中。

但是，钥匙串是安全存储此类信息的理想场所。今年的新功能是，当用户安装您的应用程序时，存储在您的应用程序剪辑钥匙串中的项目会从您的应用程序剪辑传输到您的应用程序。现在，您的 App Clip 可以简单地将安全项目存储在钥匙串中，并且在安装后它们将被移动到您的应用程序中。

不支持共享钥匙串组和 iCloud 钥匙串。这向用户承诺，当 App Clip 不再使用时，钥匙串信息不会留下来。

这是一个如何在钥匙串中存储和读取登录信息的示例。应用程序和 App Clip 的代码相同。您可以使用 SecItemAdd 将新项目添加到钥匙串。并使用 SecItemCopyMatching 从钥匙串中获取这些项目。并为您的项目添加标签，以帮助您的整个应用程序识别这些项目是由您的 App Clip 保存的。
```



Finally, the App Clip experiences API. As your app clip grows, you'll have more and more advanced App Clip experiences, each with their own information or location. You need an easy way to add and update all of these experiences. App Store Connect has an App Clip experiences web API that's designed to automate this workflow. Let's look at an example that uses this API to add an advanced App Clip experience.

First, get the App Clip resource ID. Next, upload your header image. Last, create the advanced App Clip experience. First, let's find the resource ID for the app clip. Call the web API with your app's item ID and App Clip bundle ID. And from the response, save the App Clip resource ID for later. Next, upload a header image for the advanced App Clip experience. Save the header image's resource ID for the next step. Last, with your App Clip resource ID and your header image ID, we can now create your advanced App Clip experience.

There are three dictionaries to fill in: attributes, relationships, and included.

In the attributes dictionary, add information like the action name, which category and language, and the link for the advanced App Clip experience. If your advanced experience is tied to a Maps location, add a place dictionary. In the place dictionary, add the matching Maps business place name, a map action, and the map coordinates. In the relationships dictionary, add the App Clip resource ID and the header image ID. And in the included dictionary, add a localized title and subtitle for the advanced App Clip experience. And that's it! With this App Store Connect API, you can fully automate creating advanced App Clip experiences. To learn more about App Store Connect, check out “Automating App Store Connect” and “What's new in App Store Connect” from WWDC 2020.

```
接下来，钥匙串迁移。

今天，当您想要将敏感信息（例如身份验证令牌和支付信息）从 App Clip 传输到完整应用时，您的 App Clip 会将这些数据存储在共享的应用组容器中。当用户从您的 App Clip 升级到您的完整应用时，iOS 会保存这些数据。

您的完整应用程序读取应用程序组容器并将该信息存储在钥匙串中。

但是，钥匙串是安全存储此类信息的理想场所。今年的新功能是，当用户安装您的应用程序时，存储在您的应用程序剪辑钥匙串中的项目会从您的应用程序剪辑传输到您的应用程序。现在，您的 App Clip 可以简单地将安全项目存储在钥匙串中，并且在安装后它们将被移动到您的应用程序中。

不支持共享钥匙串组和 iCloud 钥匙串。这向用户承诺，当 App Clip 不再使用时，钥匙串信息不会留下来。

这是一个如何在钥匙串中存储和读取登录信息的示例。应用程序和 App Clip 的代码相同。您可以使用 SecItemAdd 将新项目添加到钥匙串。并使用 SecItemCopyMatching 从钥匙串中获取这些项目。并为您的项目添加标签，以帮助您的整个应用程序识别这些项目是由您的 App Clip 保存的。
```



Finally, the App Clip experiences API. As your app clip grows, you'll have more and more advanced App Clip experiences, each with their own information or location. You need an easy way to add and update all of these experiences. App Store Connect has an App Clip experiences web API that's designed to automate this workflow. Let's look at an example that uses this API to add an advanced App Clip experience.

First, get the App Clip resource ID. Next, upload your header image. Last, create the advanced App Clip experience. First, let's find the resource ID for the app clip. Call the web API with your app's item ID and App Clip bundle ID. And from the response, save the App Clip resource ID for later. Next, upload a header image for the advanced App Clip experience. Save the header image's resource ID for the next step. Last, with your App Clip resource ID and your header image ID, we can now create your advanced App Clip experience.

There are three dictionaries to fill in: attributes, relationships, and included.

In the attributes dictionary, add information like the action name, which category and language, and the link for the advanced App Clip experience. If your advanced experience is tied to a Maps location, add a place dictionary. In the place dictionary, add the matching Maps business place name, a map action, and the map coordinates. In the relationships dictionary, add the App Clip resource ID and the header image ID. And in the included dictionary, add a localized title and subtitle for the advanced App Clip experience. And that's it! With this App Store Connect API, you can fully automate creating advanced App Clip experiences. To learn more about App Store Connect, check out “Automating App Store Connect” and “What's new in App Store Connect” from WWDC 2020.



```
最后，应用程序剪辑体验API。随着应用程序剪辑的增长，您将拥有越来越多的高级应用程序剪辑体验，每个应用程序剪辑都有自己的信息或位置。你需要一种简单的方式来添加和更新所有这些体验。App Store Connect有一个App Clip experiences web API，旨在自动化此工作流。让我们来看一个使用此API添加高级应用程序剪辑体验的示例。

首先，获取应用程序剪辑资源ID。接下来，上传标题图像。最后，创建高级应用程序剪辑体验。首先，让我们找到应用程序剪辑的资源ID。使用应用程序的项目ID和应用程序剪辑包ID调用web API。然后从响应中保存应用程序剪辑资源ID，以备将来使用。接下来，上传用于高级应用程序剪辑体验的标题图像。保存标题图像的资源ID以供下一步使用。最后，使用你的应用程序剪辑资源ID和标题图像ID，我们现在可以创建你的高级应用程序剪辑体验。

有三个字典需要填写：属性、关系和包含。

在属性字典中，添加动作名称、类别和语言等信息，以及高级应用程序剪辑体验的链接。如果您的高级体验与地图位置有关，请添加位置词典。在地点词典中，添加匹配的地图业务地点名称、地图动作和地图坐标。在关系字典中，添加应用程序剪辑资源ID和标题图像ID。在包含的字典中，添加高级应用程序剪辑体验的本地化标题和副标题。就这样！有了这个应用商店连接API，你可以完全自动创建高级应用剪辑体验。要了解有关App Store Connect的更多信息，请查看WWDC 2020中的“自动化App Store Connect”和“App Store Connect中的新增功能”。
```



To wrap up, the new App Clip size limit gives you more room to build your ideal experience. App Clip diagnostics tools are a great way to understand your App Clip and universal link configuration end to end. CloudKit and keychain can ease your development by sharing more code with your app. And the App Clip experiences API automates the workflow for managing your advanced App Clip experiences. To learn more about developing App Clips, please watch “What's new in App Clips” from WWDC 2021 and “Design great App Clips” from WWDC 2020.

You developers have made such great App Clips. They're so creative! We hope these new features help you build your next great App Clip. Thanks for watching!  ♪ ♪

```
总而言之，新的 App Clip 大小限制为您提供了更多空间来构建您的理想体验。 App Clip 诊断工具是了解您的 App Clip 和端到端通用链接配置的好方法。 CloudKit 和钥匙串可以通过与您的应用程序共享更多代码来简化您的开发。 App Clip 体验 API 可自动化管理您的高级 App Clip 体验的工作流程。要了解有关开发 App Clips 的更多信息，请观看 WWDC 2021 的“App Clips 中的新功能”和 WWDC 2020 的“设计出色的 App Clips”。

你们开发人员制作了如此出色的 App Clips。他们太有创意了！我们希望这些新功能可以帮助您构建下一个出色的 App Clip。感谢收看！ ♪ ♪
```

