> 作者：DXL，iOS 开发者，就职于猿辅导。
>
> 审核：红纸，iOS 开发，老司机技术周报编辑，就职于淘系技术部

# WWDC201 10086 - What's new in CloudKit CloudKit新特性

> 本文基于[WWDC2021 Session 10086](https://developer.apple.com/videos/play/wwdc2021/10086/) 梳理

## 引子

![](https://images.xiaozhuanlan.com/photo/2021/9def37095d23dc9e8643492c406ded07.jpg)


同时作为一名 Apple 生态的消费者，通过 iCloud，我可以在 Mac，iPad，iPhone 上完成无缝的写作，阅读，音乐体验；更新设备后，Photo，Music ，Data，已静静的躺在新手机里等待我的使用。沉浸在 iCloud 带给我们的无限便利。

作为一名 iOS 开发者，使用 iCloud 可以让我们自己的 App 拥有了后台的能力，可以实现多台设备数据同步的功能，也可以让其他用户访问你的 public data。苹果给了一个非常好的解决方案，让你专注于 App 的设计和实现。

今天让我们谈一谈 iCloud 背后的能力 - CloudKit。

## 目录
- Recap
- Swift concurrency
- Encrypted fields
- Zone Sharing


## Recap
我们用 Wechat App 来解释下什么是 CKContainer 中的 Public/Private/Shared Database （假定我们用 CloudKit 实现了微信的后台功能）

1. Public Database

每一个 iCloud Container 容器（一般一个 App 只有一个 Container）都有一个 Public Database 公共数据库，这个数据库允许使用这个 App 的所有用户访问.比如在微信中可根据微信账号搜索到其他人，就是因为，所有人的账号信息都保存在微信 App 中 iCloud 云端的 Public Database 中。

2. Private Database

私有数据库就像是每一个用户在自己的 iCloud 存储中的一个文件（当然， 在 iCloud Drive 中没法看到这个文件，类似一个沙盒文件，只有这个 Private Database的 App 能否访问）

3. Shared Database

CKShare 赋予了用户把自己的私有数据库的数据共享给其他人的能力，比如用户发布了朋友圈，这些数据就存储在 shared Database 中，可以让朋友们随时随地得获取数据，分享快乐。


## Swift concurrency
使用过 CloudKit 构建自己 App 的同学都知道，CloudKit 重度使用 Operation 来进行本地数据和 iCloud 上数据的传输，保证其原子性，安全性，和便利性。 通过使用 Swift 引入的并发相关的 API，让开发者写出质量更好，更易懂的异步操作代码。

### Swift Aysnc/Await
对于掌握 CloudKit 内部的 Operation 操作是有一定门槛的，使用起来不够爽，随着Swift 5.5的 Realese，CloudKit API 也支持了 Swift aysnc、await的能力！ （具体可以参见[Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132/)）
其实这两个 API 就是解決异步带来的代码嵌套以及代码混乱的问题，如果你用基于 CallBack 的 API，代码顺序就会被打乱，窜来窜去，然后异常捕捉也比较麻烦，一个简单的 Try Catch 就能搞定的事，需要写一大堆重复的错误处理代码，而有了 async/await 以后，这事就迎刀而解了，基本上你就可以用你写同步 sync 代码的方式来写  async 代码，在它 suspend需要挂起的地方，你用 await/标记一下就好了。 Talk is cheap，show me the code。

以前，删除某个 CKContainer 中数据的代码如下所示：

![](https://images.xiaozhuanlan.com/photo/2021/b23f5628efe06a2346fb02305113e126.jpg)

上面的代码，充斥大量的 Optional值，解包，其他人想了解上面代码做什么事的时候，不一定能第一时间 Get 到。看一下使用 CloudKit Async Function 之后，代码有什么改善。代码看起来简单多了，不需要再 Callback 闭包中各种判断，就像是同步代码一样简单，线性。

![](https://images.xiaozhuanlan.com/photo/2021/11547f4d424beceeee95e434cf909a59.jpg)

### Per-item callbacks
比如遇到下面这种情况，通过几个 RecordID 获取对应的 Records，但是发现其中有一个获取失败了，捕获到 CKError.unknownItem，整体 Operation 捕获到了 CKError.partialFailure 错误

![](https://images.xiaozhuanlan.com/photo/2021/ead00dc82bf78348f82c960def805e17.jpg)

过去起代码如下所示：

![](https://images.xiaozhuanlan.com/photo/2021/099ad8b152f24d34f99824ded5776545.jpg)

其中，对应某个 recordId 的 perItemCompletionBlock 已经包含了该 item 获取失败的回调，但是底部整个 Operation的 fetchCompletionBlock中捕获到的 CKError.partialFailure 中，通过 recordId 又重复包含了一次某个 Record 获取失败的回调，信息重复是完全没有必要的。使用 Swift.Result 这种类型，完美解决信息重复的问题，上面的代码使用 Swift.Result 类型之后改进为：

![](https://images.xiaozhuanlan.com/photo/2021/178ac66a711978faa9189556ed724741.jpg)

### 更好的Container & database APIs
使用 Swift Aysnc/Await 之后，对单个 Record 或批量操作多个 Record 就会变得如此简单，await 的方法失败就走 catch 中异常逻辑，否则走下面的正常逻辑。

![](https://images.xiaozhuanlan.com/photo/2021/8e44f3c9894123373671f85b5fd41baa.jpg)

![](https://images.xiaozhuanlan.com/photo/2021/2fdc4ff4108ef90ca1c4d341e682dad8.jpg)

上图中，一旦成功，高亮的逻辑则会执行。

可以参考 Apple 提供的在 Github 的代码： [CloudKit Samples: Private Database](https://github.com/apple/cloudkit-sample-privatedb)

但是，但是，Swift aysnc、await在 iOS15 以上才能使用...所以社区里怨声载道😹

## Encrypted fields
这个新 Feature 的提出能让开发者更加简单的保护其用户数据的私密性，提高其安全性。

### 首先，看一下 CloudKit 是怎么保护用户数据隐私的，主要涉及两种方法
- Acount-based protection 基于账号的保护
	所有基于 CloudKit 云存储能力的 App 默认都采用了基于账号的保护措施，只有某个特定的加密 token 能从云端的 Private 和 Shared Databases 获取数据，第三方，甚至 Apple 自己都没法获取。
	
- Cryptographic protection  加密保护
	一些敏感数据，以 **CKAsset** 的形式，在上传到 CloudKit 云服务器之前，首先在本地进行预处理和编码,之后从云服务器获取到之后进行解码。其中加解密的算法由用户的 KeyChain 钥匙串参与保证了其安全性。
	
	今年, CloudKit 更进一步，针对那些 CKAsset 和 non-CKAsset 数据都支持了Cryptographic protection  加密保护。
	
### 	New API
想要完成加解密过程十分简单，用 entryptedValues 包一下就可以了，CloudKit 帮你完成了上传前的加密，获取后的解密过程。需要说明的是，可以对除了 CKReference 以外的一起 CKRecord 数据类型进行加密，因为 CKReference 指向是一种两个实体之前的关系，该关系需要对服务器透明。同时，CKAsset 数据默认已进行了加密。

![](https://images.xiaozhuanlan.com/photo/2021/418e3f087536af78e2f851a4cf7db96e.jpg)


使用 CloudKit Console 可对加密的字段进行可视化的操作，就像是一般没有进行加密的字段一样。具体可参考 [Meet CloudKit Console](https://developer.apple.com/videos/play/wwdc2021/10117)

### 必要条件
对数据进行加密处理的先决条件是，必须是一个登录的 iCloud 账号，开发者可以通过下面这个 API 就能获取到当前 CKContainer 对应的账号登录状态。

![](https://images.xiaozhuanlan.com/photo/2021/e24c57ec7407f89dc09d1d727dcb4fef.jpg)

![](https://images.xiaozhuanlan.com/photo/2021/cc3ad5cc08facd27963f9bb22249e6a6.jpg)

没了，几行简单的代码，就完成了加解密。Apple CloudKit 团队这次提供的方案简直是开发者的福音，简单易用，强大，安全。

## Zone Sharing
分享一个层级结构文件夹和文件夹内是非常方便的，将某个 record 的 parent 设置为为文件夹 record，然后创建一个 CKShare 对象就能分享出去了。 iPhone 内置的 记事本，备忘录，文件应用都使用层级结构的保存方法。

![](https://images.xiaozhuanlan.com/photo/2021/4f8135d66d9167df7a558a2f5cadc278.jpg)

![](https://images.xiaozhuanlan.com/photo/2021/f659d91d51a3cfb0ab6dfd5d398319e2.jpg)

那么，如果这些文件不是在一个层级结构中，分属于不同的文件夹，文件，想一同分享，该怎么做呢？ 这时候就要用到 CKRecordZone这个类了。 HomePod共享音频就应用了这个能力。

![](https://images.xiaozhuanlan.com/photo/2021/f5849cee19b8965058e442dd690c0922.jpg)

其代码如下所示：

![](https://images.xiaozhuanlan.com/photo/2021/6840a0ae910b20e9d7fe76197b7e999d.jpg)

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**

