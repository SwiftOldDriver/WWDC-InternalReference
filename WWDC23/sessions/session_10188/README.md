---
session_ids: [10188]
---

# Session 10000 - 使用 CKSyncEngine 同步到 iCloud

本文基于[Session 10188: Sync to iCloud with CKSyncEngine](https://developer.apple.com/videos/play/wwdc2023/10188/)梳理。

## 简介

本 `Session` 将介绍一个名为 `CKSyncEngine` 的新 `CloudKit API`。 `CKSyncEngine` 旨在帮助设备和云之间同步数据。首先，我将谈论在 `Apple` 平台上与 `CloudKit` 同步的状态。接下来，我将概述 `CKSyncEngine` 是什么以及其工作原理。然后，您将了解如何在自己的项目中开始使用 `CKSyncEngine`。一旦设置完成，您将学习如何使用同步引擎在设备之间同步数据。最后，您将学习有关测试和调试与 `CKSyncEngine` 集成的最佳实践。

通过本文您将了解 `CKSyncEngine` 如何帮助您将人们的 `CloudKit` 数据同步到 `iCloud`。了解当您让系统处理同步操作的调度时，如何减少应用程序中的代码量。本 `Session` 将分享如何自动受益于随着 `CloudKit` 的发展而提高的性能，探索同步实现的测试等内容。为了充分利用本 `Session`，您应熟悉 `CloudKit` 和 `CKRecord` 类型。

## 同步状态

当构建新应用程序时，用户总是期望他们的数据会同步。他们在 iPhone 上创建了一些东西，当他们打开 Mac 时，他们也期望它在那里。从外部看，这似乎是魔法。他们的数据在一个地方，然后就到处都有了。对于我们来说，情况并不那么简单。

`CloudKit` 本身并不复杂，但是同步却是困难的。当涉及多个设备同步的场景时，可能会出现许多问题。因此，我们的同步代码尽可能简单越好。而简化同步代码的最佳方法是尽可能少地编写代码。值得庆幸的是，您可以选择一些很棒的 `API` 来与 `CloudKit` 同步，并且这些 `API` 会为您完成大部分繁重工作。

如果您希望拥有包括本地持久化的全栈解决方案，可以使用 `NSPersistentCloudKitContainer`。如果您想使用自己的本地持久化，则可以使用新的 `CKSyncEngine API`。

如果您仍然认为需要更精细的控制，则可以使用 `CKDatabase` 和 `CKOperations`。

如果您想要与 `CloudKit` 同步，但没有使用 `NSPersistentCloudKitContainer`，您应该使用 `CKSyncEngine`。

同步涉及许多移动部件，使用像 `CKSyncEngine` 这样的更高级 `API` 可以帮助减少复杂性并改善应用程序的同步体验。

同步的核心是将一个设备的更改发送到另一个设备，并在需要时从 `CloudKit` 中转换提取数据。如果仅仅如此就很容易了，但不仅如此。您需要了解所有不同的操作和错误，监视系统条件，监听帐户更改，处理推送通知，管理订阅，跟踪一堆状态等等。

当您使用 `CKSyncEngine` 时，您需要编写的同步代码量变得更小而且更专注于业务逻辑。您只需要处理特定于应用程序的事件，而同步引擎则处理其余部分。为了编写合适的同步引擎，您可能需要编写数千行代码，并在测试中将该数量加倍。据说 `NSPersistentCloudKitContainer` 就有超过 70,000 行测试代码，`CKSyncEngine` 也有很多测试，因为它可以为您处理很多事务。

## 认识 CKSyncEngine

那么，这个新的 CKSyncEngine API 是什么？

CKSyncEngine 封装了与 CloudKit 数据库同步的常见逻辑。它旨在提供方便的 API，同时也在必要时提供灵活性。它旨在满足大多数应用程序的需求，否则开发者将自己编写自定义同步引擎。

通常，如果您想要同步应用程序的私有或共享数据，`CKSyncEngine` 是一个很好的选择。用于同步引擎的数据模型由 `记录` 和 `存储区域` 组成，并与 `CloudKit` 中的使用的数据类型一致。您可以使用任何现有的 CloudKit API 访问其中的任何数据。因此，如果您已经有一个现有的 CloudKit 同步实现，则 CKSyncEngine 也可以与其同步。

同步引擎正在系统中的几个应用程序和服务中使用，包括 Freeform 应用程序。另一个例子是 NSUbiquitousKeyValueStore，在同步引擎的上层进行了重写。这是一个向后兼容的很好的例子。在较新的操作系统中，它使用同步引擎，但也与以前的版本同步。

因此，如果您已经具有自定义 CloudKit 同步实现，则可以选择切换到 CKSyncEngine。如果收益足够，则应考虑切换，但这不是必需的。有时，只需要较少的代码来维护会更好。每当 CKSyncEngine 获得新的增强功能时，您也将从中受益。

随着平台的发展，同步引擎也会优化，使同步变得更加容易和高效。您还可能通过更简介的 CKSyncEngine API 获益。这使您可以专注于应用程序的特定数据模型和用例。如果您正在考虑使用CKSyncEngine，但是有一些特定需求它不支持，那么您始终可以根据需要构建自己的同步引擎。

但是，如果您认为CKSyncEngine中的新功能可以满足您的需求，欢饮提交反馈与建议。毕竟，同步引擎的一些最佳创意来自像您这样优秀的开发人员。

那么，同步引擎实际上如何工作呢？

一般来说，同步引擎充当您的应用程序和 `CloudKit 服务器` 之间数据的传输渠道。您的应用程序以记录和区域的形式与同步引擎通信。当要保存更改时，您的应用程序将它们交给同步引擎。当在另一个设备上提取这些更改时，同步引擎会将它们提供给您的应用程序。即便如此，当同步引擎有任务需要执行时，它并不总是立即执行。如果它需要与服务器通信，它将首先咨询系统任务调度程序。这是操作系统中用于后台任务管理的相同调度程序，它确保设备已准备好进行同步。一旦设备就绪，调度程序运行任务，同步引擎与服务器通信。这是同步引擎的基本操作流程。具体而言，当同步引擎向服务器发送更改时，它是什么样子呢？首先，有人对数据进行修改。也许他们输入了一些内容，或者翻转了开关，或者删除了一个对象。然后，您的应用程序告诉同步引擎有一个待处理的更改需要发送到服务器。这让同步引擎知道它有任务要做。接下来，同步引擎向调度程序提交任务。一旦设备就绪，调度程序运行任务。当任务运行时，同步引擎开始将更改发送到服务器的过程。为了实现这一点，它会要求您的应用程序提供要发送的下一批更改内容。如果有人只做了一个修改，则您可能只有一个待处理的更改。但是，如果有人导入了一个包含大量新数据的数据库，则您可能有数百或数千个更改。由于单个请求可以发送到服务器的数量有限，因此同步引擎会分批请求这些更改。这也有助于减少内存开销，并且在实际需要之前不会将任何记录带入内存中。在您提供下一批之后，同步引擎将其发送到服务器。服务器将回复操作的结果，包括有关这些更改成功或失败的任何信息。一旦请求完成，同步引擎将使用结果回调到您的应用程序中。这是您对操作的成功或失败做出反应的机会。如果您有任何待处理的更改，同步引擎将继续请求批次，直到没有剩余内容需要发送。现在，一个设备已经将一些数据发送到服务器，其他设备将获取该数据。当服务器接收到新更改时，它会向具有访问权限的其他设备发送推送通知。CKSyncEngine会自动在您的应用程序中监听这些推送通知。当它收到通知时，它会向调度程序提交一个任务。当调度程序任务运行时，同步引擎会从服务器获取数据。获取新更改时，它将其提供给您的应用程序。这是您将更改持久保存到本地并在UI中显示它们的机会。这就是使用同步引擎时基本的操作流程。所有这些流程都有一个共同点，即系统调度程序。一般来说，在执行任何操作之前，CKSyncEngine会咨询调度程序。这就是它能够代表您自动进行同步的原因。


The scheduler monitors system conditions like network connectivity, battery level, resource usage, and more.
 It makes sure the device has met any prerequisite conditions before it tries to sync.
 By respecting the scheduler, the sync engine can ensure a proper balance between user experience and device resources.
 In normal conditions, sync will be pretty fast, usually within a few seconds or so.
 However, if there's no network connection, or if the device's battery is low, then sync might be delayed or deferred.
 If the device is under a heavy load, you don't want your sync mechanism to interfere with other more urgent tasks in your app.
 By relying on the sync engine's automatic scheduling, you can be confident that you'll sync when you should, and not when you shouldn't.
 Not only is it more efficient, it's also just easier to use.
 If you don't have to worry about when to sync, you can focus on everything else.
 That said, there are legitimate use cases for manually performing a sync.
 You might have a pull-to-refresh UI that fetches immediately.
 Or you might have a button to back up now that immediately sends any pending changes to the server.
 Manually syncing can also be useful when writing automated tests.
 It can help you simulate specific sync scenarios across multiple devices where you need to control the order of events.
 In general, we recommend that you rely on automatic sync scheduling.
 But, we understand that there are valid use cases for manual syncing, and the sync engine has API to do that when necessary.
 And now, Aamer is going to talk about how to start using CKSyncEngine.

调度程序监视系统条件，例如网络连接性、电池电量、资源使用情况等等。它确保设备在尝试同步之前满足任何先决条件。通过尊重调度程序，同步引擎可以确保用户体验和设备资源之间的适当平衡。在正常情况下，同步将非常快，通常在几秒钟内完成。但是，如果没有网络连接或者设备的电池电量低，同步可能会延迟或推迟。如果设备负载过重，您不希望您的同步机制干扰您的应用程序中其他更紧急的任务。通过依赖同步引擎的自动调度，您可以放心地进行同步，并避免在不必要时进行同步。它不仅更高效，而且更容易使用。如果您不必担心何时进行同步，您可以专注于其他所有事情。即便如此，手动执行同步也存在合法的用例。您可能具有立即获取功能的下拉刷新UI。或者您可能有一个按钮，可以立即备份现有服务器上的任何待处理更改。在编写自动化测试时，手动同步也可能很有用。它可以帮助您模拟跨多个设备的特定同步场景，其中需要控制事件的顺序。总的来说，我们建议您依赖自动同步调度。但是，我们理解手动同步存在有效用例，同步引擎在必要时具有API可供使用。现在，Aamer将讨论如何开始使用CKSyncEngine。

## 9:47 - Getting started

 Aamer: Thanks for that introduction, Tim.
 My name is Aamer.
 I'm an engineer on the CloudKit Client team.
 I'll now cover getting started with CKSyncEngine.
 Before you use CKSyncEngine, there are a few things you need to do to set up your project.
 These requirements are the same whether you're using CKSyncEngine or building your own custom CloudKit implementation.
 First, you'll need a basic knowledge of CloudKit's fundamental data types, CKRecord and CKRecordZone.
 The sync engine API deals heavily in terms of records and zones, so you should understand what they are before diving in.
 Next, you'll need to enable the CloudKit capability for your project in Xcode.
 Finally, since the sync engine relies on push notifications to keep up to date, you'll also need to enable the remote notifications capability.
 Once you have all that, you're ready to initialize your sync engine.
 You should initialize your CKSyncEngine very soon after your app launches.
 When you initialize your sync engine, it will automatically start listening for push notifications and scheduler tasks in the background.
 These notifications and tasks might happen at any time, and the sync engine needs to be initialized in order to handle them.

Aamer: 感谢你的介绍，Tim。我的名字是Aamer。我是CloudKit Client团队的一名工程师。我现在将介绍使用CKSyncEngine的入门事项。在使用CKSyncEngine之前，您需要完成一些设置项目的工作。这些要求与您是使用CKSyncEngine还是构建自己的自定义CloudKit实现无关。首先，您需要基本了解CloudKit的基本数据类型CKRecord和CKRecordZone。同步引擎API大量使用记录和区域，因此您应该在深入研究之前了解它们是什么。接下来，您需要在Xcode中为您的项目启用CloudKit功能。最后，由于同步引擎依赖推送通知来保持最新，因此您还需要启用远程通知功能。一旦做好所有准备，您就可以初始化同步引擎。您应该在应用程序启动后很快初始化您的CKSyncEngine。初始化同步引擎后，它将自动在后台监听推送通知和调度程序任务。这些通知和任务可能随时发生，同步引擎需要初始化才能处理它们。

The main means of communication between your app and CKSyncEngine is through a protocol called CKSyncEngineDelegate.
 When initializing your sync engine, you'll need to provide an object that conforms to this protocol.
 In order to function properly and efficiently, the sync engine tracks some internal state.
 You'll also need to provide the last known version of the sync engine state.

While performing sync operations, it will occasionally give your delegate an updated version of this state in the form of a state update event.
 Whenever the sync engine gives you a new state serialization, you should persist it locally.
 This way, you can provide it the next time your process launches and you initialize your sync engine.
 To help understand this, I'll explain it using a few code examples.

In order to initialize a sync engine, you'll pass in a configuration object.
 In the configuration, you'll need to provide the database you want to sync with, the last known version of the sync engine state, and your delegate.
 One of the functions in the delegate protocol is the handle event function.
 This function is how the sync engine notifies your app about different events that happen during normal sync operation.
 For example, it'll post events when it fetches new data from the server, or when the account changes.
 One of these events is the state update event.
 When the sync engine updates its internal state, or when you update the state yourself, the sync engine will post a state update event.
 In response to this event, you should locally persist this new serialized version of the state.
 In the example, you'll use this state serialization the next time you initialize your sync engine.

您的应用程序与CKSyncEngine之间的主要通信手段是通过名为CKSyncEngineDelegate的协议进行的。在初始化同步引擎时，您需要提供一个符合此协议的对象。为了正常高效地运行，同步引擎会跟踪一些内部状态。您还需要提供同步引擎状态的最后已知版本。

在执行同步操作时，它会定期向您的委托提供此状态的更新版本，形式为状态更新事件。每当同步引擎给您一个新的状态序列化时，您都应将其本地持久化。这样，下次您的进程启动并初始化同步引擎时，就可以提供它。为了帮助理解这一点，我将使用几个代码示例来说明。

为了初始化同步引擎，您将传递一个配置对象。在配置中，您需要提供要与之同步的数据库、同步引擎状态的最后已知版本和您的委托。委托协议中的一个功能是处理事件函数。该函数是同步引擎通知您的应用程序有关正常同步操作期间发生的不同事件的方式。例如，当从服务器获取新数据或帐户更改时，它将发布事件。其中一个事件是状态更新事件。当同步引擎更新其内部状态，或您自己更新状态时，同步引擎将发布状态更新事件。响应此事件时，您应该本地持久化此新的序列化状态。在示例中，您将在下次初始化同步引擎时使用此状态序列化。

## 13:18 - Using CKSyncEngine

Now that the foundation is set up, I'll cover syncing with the sync engine.

现在基础设置已完成，我将介绍如何使用同步引擎进行同步。

There are a few simple steps that allow you to send changes to the server.
 First, add your pending record zone changes and pending database changes to the sync engine state.
 This will alert the sync engine that it should schedule a sync.
 The sync engine will ensure consistency and deduplicate these changes.


Next, implement the delegate method nextRecordZoneChangeBatch.
 The sync engine will call this to get the next batch of record zone changes to send to the server.
 Lastly, handle the events sentDatabaseChanges and sentRecordZoneChanges.
 These events will post once changes are sent up to the server.

有几个简单的步骤可以让您将更改发送到服务器。

首先，将待处理记录区域更改和待处理数据库更改添加到同步引擎状态中。这将提醒同步引擎应该安排一次同步。同步引擎将确保一致性并去重这些更改。

接下来，实现委托方法nextRecordZoneChangeBatch。同步引擎将调用此方法获取要发送到服务器的下一批记录区域更改。

最后，处理事件sentDatabaseChanges和sentRecordZoneChanges。这些事件将在更改已发送到服务器后发布。

Here's an example of sending changes to the server.
 This application edits data and wants to sync new record changes.
 To do this, you'll tell the sync engine that you need to save that record by adding a pending record zone change to the sync engine state.
 When the sync engine is ready to sync the record, it will call the delegate method nextRecordZoneChangeBatch.
 Here you'll return the next batch of changes to send to the server.
 You initialize a RecordZoneChangeBatch by providing the list of pending changes and a record provider.
 The list of pending changes contains the recordIDs to save or delete, and the record provider that will map those IDs to records when the actual sync occurs.
 Here's how your application can fetch changes from the server.
 The sync engine automatically fetches changes for you from the server.
 When it does, it will post the events fetchedDatabaseChanges and fetchedRecordZoneChanges.
 Depending on your use case, you may want to listen for the events willFetchChanges and didFetchChanges.
 For example, handing these events may be useful if you want to perform any setup or cleanup tasks before or after fetching changes.

这是一个发送更改到服务器的示例。该应用程序编辑数据并希望同步新记录更改。为此，您将向同步引擎状态添加待处理记录区域更改，以告诉它您需要保存该记录。当同步引擎准备好同步记录时，它将调用委托方法nextRecordZoneChangeBatch。在此处，您将返回要发送到服务器的下一批更改。通过提供待处理更改列表和记录提供程序来初始化RecordZoneChangeBatch。待处理更改列表包含要保存或删除的记录ID，记录提供程序将在实际同步发生时将这些ID映射到记录上。

以下是您的应用程序如何从服务器获取更改的示例。同步引擎会自动为您从服务器获取更改。当它这样做时，它将发布事件fetchedDatabaseChanges和fetchedRecordZoneChanges。根据您的用例，您可能希望侦听事件willFetchChanges和didFetchChanges。例如，在获取更改之前或之后执行任何设置或清理任务可能很有用。

Here's an example where our app fetches changes from the server.
 When the sync engine fetches changes within a record zone it will post the fetchedRecordZoneChanges event.
 This event contains the modifications and deletions that were performed by another device.
 When listening for this, you should check the fetched modifications and fetched deletions.
 When you receive modifications, you should persist the data locally.
 When you receive deletions, you should delete the data locally.
 Fetching database changes works very similarly and can be handled with the same approach.
 Handling errors can be tricky.
 The sync engine helps with this too.
 The sync engine automatically handles transient errors such as network issues, throttling, and account issues.
 The sync engine will automatically retry work that is affected by these errors.
 For other errors, your app will need to handle them.
 Once you've resolved those errors, you should reschedule the work if necessary.

这是一个示例，其中我们的应用程序从服务器获取更改。当同步引擎在记录区域内获取更改时，它将发布fetchedRecordZoneChanges事件。此事件包含由另一个设备执行的修改和删除。在侦听此事件时，您应该检查获取到的修改和删除。当您接收到修改时，应该将数据本地持久化。当您接收到删除时，应该在本地删除数据。获取数据库更改的过程非常类似，并且可以使用相同的方法处理。

处理错误可能有些棘手。同步引擎也可以帮助解决这个问题。同步引擎自动处理瞬态错误，例如网络问题、限流和帐户问题。同步引擎将自动重试受这些错误影响的工作。对于其他错误，您的应用程序需要处理它们。一旦解决了这些错误，如果必要，您应该重新安排该工作。

This is an example of error handing when sending record zone changes.
 When the sentRecordZoneChanges event is posted, you should check the failedRecordSaves to see if any records failed to save.
serverRecordChanged indicates that the record changed on the server.
 This means that another device saved a new version the application hasn't fetched yet.
 You should resolve the conflict and reschedule the work.
zoneNotFound indicates that the zone does not yet exist on the server.
 To resolve this, you may need to create the zone and then reschedule the work.
 The sync engine will always attempt to save zones first, and then records.
 networkFailure, networkUnavailable, serviceUnavailable, and requestRateLimited are examples of transient errors that the sync engine will handle for you.
 You'll still receive these errors for your awareness but you do not need to take action in response to them.
 The sync engine will automatically retry for these errors when system conditions permit.
Another thing the sync engine helps with are account changes.
 iCloud account changes can happen at any time on a device.
 The sync engine helps you manage and react to these.
The sync engine listens for changes and will notify you using the accountChange event to indicate sign in, sign out, or that the account switched.
 Your application should prepare for the change depending on the type.
The sync engine will not begin syncing with iCloud until there is an account present on the device.
You can initialize the sync engine at any time, and it will automatically update you when there is an account change.
 Sharing data with other users is a key part of CloudKit.
 The sync engine makes life easier here too.
 The sync engine works with the CloudKit shared database.
 You just create a sync engine per database that your application will work with.
 For example, you can create a sync engine for the private database, and another sync engine for the shared database.
 To learn more about sharing with CloudKit, check out the "Get the most out of CloudKit Sharing" Tech Talk.
That covers using CKSyncEngine.

这是一个示例，介绍了发送记录区域更改时的错误处理。当发布sentRecordZoneChanges事件时，您应该检查failedRecordSaves以查看是否有任何记录保存失败。serverRecordChanged表示记录在服务器上已更改。这意味着另一个设备保存了应用程序尚未获取的新版本。您应该解决冲突并重新安排工作。zoneNotFound表示服务器上尚不存在该区域。要解决此问题，您可能需要创建该区域，然后重新安排工作。同步引擎始终首先尝试保存区域，然后再保存记录。networkFailure、networkUnavailable、serviceUnavailable和requestRateLimited等瞬态错误是同步引擎将为您处理的示例。您仍将接收到这些错误以便知晓，但不需要对其采取措施。当系统条件允许时，同步引擎将自动重试这些错误。

同步引擎帮助处理的另一件事是帐户更改。iCloud帐户更改可以随时发生在设备上。同步引擎帮助您管理和响应这些更改。同步引擎会侦听更改，并使用accountChange事件通知您以指示登录、注销或帐户切换。根据类型，您的应用程序应准备好进行更改处理。同步引擎将不会开始与iCloud同步，直到设备上存在帐户。您可以随时初始化同步引擎，并且它将在有帐户更改时自动更新您。

与其他用户共享数据是CloudKit的重要部分。同步引擎在这方面也使生活更轻松。同步引擎与CloudKit共享数据库一起工作。您只需要为应用程序将使用的每个数据库创建一个同步引擎。例如，您可以为私有数据库创建一个同步引擎，为共享数据库创建另一个同步引擎。要了解有关使用CloudKit共享的更多信息，请查看“充分利用CloudKit共享”技术讲座。
这涵盖了使用CKSyncEngine的内容。

## 19:25 - Testing and debugging

 Now I'll cover how to test when using it.
 Automated tests are the best way to ensure stability in your codebase while rapidly developing.
 Using the sync engine, you can simulate device-to-device user flows using multiple CKSyncEngine instances.
You should simulate edge cases that your app may encounter.
 To do this, you can intervene in the sync engine flow by setting automaticallySync to false.
 Here is a test case that simulates a data conflict between two devices and the server.
 The purpose of this test is to simulate the full flow users will take when working with multiple devices.
 It also validates conflict resolution.
 First, simulate two devices using MySyncManager.
 In this example, MySyncManager creates a local database and sync engine.
 Device A sets the value to A and sends its changes to the server.
Before device B fetches the changes from the server we'll ask it to send its changes to the server too.
 Since device A saved to the server first, device B's save is expected to fail.
 This will result in a server record changed error, which will exercise the local conflict resolution code.
 This sample expects the conflict resolution to prefer the data from the server, so the new value on device B will be the value most recently sent to the server from device A.

现在我将介绍在使用它时如何进行测试。自动化测试是确保代码库稳定性并快速开发的最佳方式。使用同步引擎，您可以使用多个CKSyncEngine实例模拟设备之间的用户流程。您应该模拟应用程序可能遇到的极端情况。为此，您可以通过将automaticallySync设置为false来干预同步引擎流程。以下是一个测试用例，模拟两个设备和服务器之间的数据冲突。此测试的目的是模拟用户在使用多个设备时所采取的完整流程。同时也验证冲突解决。首先，使用MySyncManager模拟两个设备。在这个示例中，MySyncManager创建一个本地数据库和同步引擎。设备A将该值设置为A并将其更改发送给服务器。在设备B从服务器获取更改之前，我们要求它也将更改发送到服务器。由于设备A先保存到服务器，因此预计设备B的保存将失败。这将导致服务器记录更改错误，从而启用本地冲突解决代码。此示例期望冲突解决优先考虑来自服务器的数据，因此设备B上的新值将是最近从设备A发送到服务器的值。

Here are a few key points that can help speed up testing and debugging.
 Understanding the sequence of events on each device will help pinpoint where in the flow your application may be having problems.
 Logging as much as possible when developing will help trace these flows, and compare logs across multiple devices.
 CloudKit will log each event that you receive, but you should also log the actions that surround them in your application.
Logging record IDs and zone IDs can help debug what data is flowing between a sync engine, the server, and other devices you may be syncing with.
Writing tests that simulate each of your user flows will help maintain stability as you grow your codebase.
Look at timestamps when piecing the puzzle together.
 You may only have a few sync operations happening, or you may have many in a short time.
 Ensuring you're tracing the right ones is key to debugging amongst multiple devices.
These steps will help create and maintain a reliable, long-lasting application using CKSyncEngine.

以下是一些可以帮助加速测试和调试的关键点。了解每个设备上事件序列可以帮助确定应用程序可能存在问题的流程位置。在开发时尽可能记录日志将有助于跟踪这些流程，并比较多个设备上的日志。CloudKit会记录您收到的每个事件，但您还应该记录其周围的操作。记录记录ID和区域ID可以帮助调试同步引擎、服务器和其他设备之间正在流动的数据。编写模拟每个用户流程的测试将有助于在扩展代码库时保持稳定性。在拼凑拼图时查看时间戳。您可能只有少量的同步操作，或者在短时间内有很多操作。确保您正在追踪正确的操作是在多个设备之间进行调试的关键。

这些步骤将有助于使用CKSyncEngine创建和维护可靠、持久的应用程序。

## 22:27 - Wrap-up

```
That concludes our talk on CKSyncEngine.
 Take a look at the sync engine sample code to see a full working example in an app.
 To dive in deeper, check out our CKSyncEngine documentation.
 If you have any suggestions to improve the sync engine, please submit feedback for the CloudKit team.
 We're excited to see what you create with it.

我们的CKSyncEngine讲座到此结束。请查看同步引擎示例代码，以查看应用程序中的完整工作示例。要更深入地了解，请查看我们的CKSyncEngine文档。如果您有任何改进同步引擎的建议，请向CloudKit团队提交反馈。我们很期待看到您使用它创造出什么。

```


>> 如果要插图片可以这样

![banner](./images/SwiftOldDriver.png)