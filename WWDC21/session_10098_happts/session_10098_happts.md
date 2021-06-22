# 在 Spotlight 中呈现 app 的数据

> 本文基于 [WWDC21 Session 10098 -Showcase app data in Spotlight](https://developer.apple.com/videos/play/wwdc2021/10098/) 梳理

## 目录

* NSCoreDataCoreSpotlightDelegate 介绍
* 一个简单的实现
    * [Sample Code](https://developer.apple.com/documentation/coredata/nspersistentstorecoordinator/showcase_app_data_in_spotlight)
    * 自定义实现
    * 实现全文搜索

## 前言

app 在使用过程中会生成许多的内容. 随着数据规模的增加, 我们希望能够快速找到这些数据, 比如在 app 中进行搜索, 或者在 app 外的 Spotlight 搜索. 而 Core Data 就可以很好地把 app 中的数据显示在 Spotlight 中. 

本文主要介绍如何使用`NSCoreDataCoreSpotlightDelegate`来实现对数据的索引功能.

## NSCoreDataCoreSpotlightDelegate

`NSCoreDataCoreSpotlightDelegate` 提供的能力: 

* 在 app 之外呈现用户数据
* 自动更新 Spotlight 索引
* 强大的索引管理
* 定制索引结果

`NSCoreDataCoreSpotlightDelegate`的优势:

1. 功能与 Core Spotlight 保持一致
2. 更少的代码
3. 额外的 Feature

`NSCoreDataCoreSpotlightDelegate` 完成了所有繁重的工作, 并提供了一套 API , 可以快速有效地对 app 所提供的内容进行索引.

---

下面是 Core Spotlight APIs 与 `NSCoreDataCoreSpotlightDelegate`两种方式的比较:

```swift
// 使用 Core Spotlight 实现索引的例子
func indexItemsInStore(){
  let taskContext = persistentContainer.newBackgroundContext()
  taskContext.perform{
    // 查出数据
    let fetchRequest = NSFetchRequest<Photo>(entityName:"Photo")
    guard let results = try? taskContext.fetch(fetchRequest) else {return}
    // 生成 CSSearchableItems
    let items = results.compactMap{ photo in CSSearchableItem? in
      guard let data = photo.photoData?.data,
            let name = photo.uniqueName else {return nil}
      let attributeSet = CSSearchableItemAttributeSet(contentType: .item)
      attributeSet.displayName = name
      attributeSet.thumbnailData = data
      attributeSet.keywords = [name]
    }
    // 把 items 加入索引
    CSSearchableIndex.default().indexSearchableItems(items){ error in
       ...
    }
  }
}
```

而改用 `NSCoreDataCoreSpotlightDelegate`后

```swift
// 两行代码实现 Spotlight 索引 
let spotlightDelegate = NSCoreDataCoreSpotlightDelegate(forStoreWith: description,
                                                        coordinator: coordinator)
spotlightDelegate.startSpotlightIndexing()

// ps: 除了两行代码, 还需要配置 Core Data Model, 设置 index 和 display name, 否则不能在 Spotlight 搜到结果
```

和 Core Spotlight 提供的 API 相比, 少了非常多的代码, 更易于阅读和维护.



## 一个简单的实现

以 Tags 照片标签应用为例. 这个 app 可以存储照片, 并对照片打上多个不同的标签.

在对 app 添加 Spotlight 之前, 所有的标签和照片都被困在 Tags App 里面, 此时我们去 Spotlight 中搜索, 不会有任何 Tags app 的搜索结果.

让我们来改变这种情况吧! 

![ip12shot](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210620221905568.png)



### 1. 设置索引内容

使用`NSCoreDataCoreSpotlightDelegate`的第一步是决定要在 Spotlight 中索引什么.

事实上, 所有可以持久化存储的内容都可以被索引. 

在 Tags 中, 我们决定对实体 Photo 的 `userSpecifiedName` 属性和实体 Tag 的 `name` 属性进行索引.

在 Xcode 中打开了项目的 Core Data Model, 选择 Photo 实体的`userSpecifiedName` 属性, 在属性检查器中勾选`Index in Spotlight`.

Tag 实体也是类似操作. 这样设置后, Photo 就可以在 Spotlight 中通过 `userSpecifiedName` 索引, Tag 可以通过 `name` 索引.

![indexSpotLight](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210620222234872.png)



### 2. 设置 displayname

在进入 Spotlight 搜索界面时, 搜索结果需要展示出来, 即展示 `display name`. 否则的话, 即使数据可以被索引到, 我们也没有定义如何展示这些数据.

因此, 我们需要在 Core Data 模型编辑器中继续操作, 给每个 Entity 设置 Core Data Spotlight 的 `display name`.

Core Data Spotlight 的`display name`是一个`NSExpression`. 在设置索引的时候, 这个`NSExpression`与每个设有 Spotlight 索引属性的`managed object`一起被评估, 评估的结果被保存下来.

之后, 当进入 Spotlight 搜索界面时, 这些结果被用作搜索结果的 `display name`.

在 Tags app 中, Spotlight `Display Name`在实体 Photo 上被设置为`userSpecifiedName`, 而在实体 Tag 上被设置为`name`.

![editorDisplayname]( https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621161536417.png)

> 什么是 NSExpression?
>
> 可以是一个 keyPath 
>
> ```swift
> let exp = NSExpression(forKeyPath: \Tag.name)
> ```
>
> 可以做一些数学运算
>
> ```swift 
> let exp = NSExpression(format: "4 + 5 - 2 ** 3")
> let val = exp.expressionValueWithObject(nil, context: nil) as? Int
> ```
>
> 可以再复杂一点, 计算一组数的标准差
>
> ```swift
> let vals = [1,2,3,4,4,5,9,11]
> let exp = NSExpression(forFunction: "stddev:",
>                     arguments: [NSExpression(forConstantValue: vals)])
> let stddev = exp.expressionValueWithObject(nil, context: nil) as? Double
> ```
>
> NSExpression 的更多功能可以点击文档查看详情
>
> [NSExpression | Apple Developer Documentation](https://developer.apple.com/documentation/foundation/nsexpression/)



### 3. 创建 `NSCoreDataCoreSpotlightDelegate`

现在, 模型已经为索引做好了准备, 让我们来创建`NSCoreDataCoreSpotlightDelegate`. 
`NSCoreDataCoreSpotlightDelegate`新的初始化方法是使用`forStoreWith: coordinator:`.

![spotDelegateInit]( https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210620225209639.png)

不要忘记调用`startSpotlightIndexing`来使`SpotlightDelegate`开始工作.

---

使用`NSCoreDataCoreSpotlightDelegate`的几个要求:

* 被索引的存储类型必须是 SQLite
* 必须启用 `PersistentHistoryTracking`

![delegateRequire]( https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210620230431238.png)


完成! app 的数据将在 Spotlight 中被索引.

![spotlight_screenshot](https://gitee.com/happts/pics/raw/master/wwdc21_10098/simulator_screenshot_CDC04236-63C0-4248-82B5-D6343771D138.png)

## 增加定制的实现

在上文介绍了`NSCoreDataCoreSpotlightDelegate`的基础知识后, 接下来我们对`SpotlightDelegate`进行一些定制.

### 1. 自定义 domain 和 indexName

首先, 定义一个类`TagsSpotlightDelegate`, 它继承自`NSCoreDataCoreSpotlightDelegate`.
然后重写`domainIdentifier`和`indexName`.

重写这些方法可以告诉 Spotlight 在哪里存储索引数据, 并允许你以后更好地识别它, 特别是当你有多个索引时.

![override_index](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621163226972.png)

如果不重写, `domainIdentifier`默认是`store 的 identifier`. `indexName`默认值是`nil`.

### 2. 定义 attribute set

定制 Spotlight Delegate 的下一步是定义一个属性集.

在前文中,  我们通过为 Entity 的属性勾选`index in Spotlight` , 并且为 Entity 设置了`display name`, `NSCoreDataCoreSpotlightDelegate`为我们定义了返回给 Spotlight 的属性集. 这时只能通过 `display name` 搜得结果.

接下来我们将指定用于索引的属性.  指定哪些属性被索引, 可以更明确地控制被索引的内容和搜索的方式.

要做到这一点, 我们需要用到`CSSearchableItemAttributeSet`: 

![attribute_sets](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621182900194.png)

* 作为`managed object`被搜索出现时要显示的元数据.

* 可以使用`CSSearchableItemAttributeSet`中的预定义属性, 或者定义自己的属性.
* 线程不安全, 对数据集的属性并发访问的行为是未定义的.

在 Tags app 中, 我们对 Photo 使用预定义的属性: `keywords`、`displayName`和`thumbnailData`.

此处通过重写`NSCoreDataCoreSpotlightDelegate`的`attributeSet(for object:)`方法实现.


![photo](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621184247289.png)


1. 首先确定`object`是否为 `Photo`

2. 初始化一个内容类型为 `.image` 的 `attributeSet`

3. 将`Photo`的适当的属性赋值给`attributeSet`的`identifier`, `displayName`, `thumbnailData `

4. 将`Photo`的 `tags`加到`attributeSet`的`keywords`数组中

    > 如果 model 要通过一个关系 (relationship) 进行索引,  attributeSet (for object:)  必须被重写, 这样就定义了该关系的具体内容可以被索引.
    >
    > 此处 Photo 的 tags 属性是 relationship

5. 返回 attributeSet 

     

之后索引 Tag 对象, 如下代码是处理 `object`为`Tag` 时的情况.

![tag](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621195725061.png)



最后, 我们需要删除前一步在 Model Editor 中, 给 Entity 设置的 `Display Name`

### 3. 定义索引事件循环 Define an indexing event Loop

进一步, 定义一个用于开始和停止索引的事件循环.

上文中, 当我们设置`SpotlightDelegate`时, `startSpotlightIndexing`在创建`SpotlightDelegate`后立即被调用.

为了更精准地控制`NSCoreDataCoreSpotlightDelegate` 何时执行索引工作, `stopSpotlightIndexing`方法也被添加到框架中. 协同使用这两个方法, 在必要时开始和停止索引. 比如说, 在你的应用程序正在执行密集的CPU或磁盘活动操作的情况下, 可以先停止索引, 待操作完成后再开启索引.

![indexEventLoop](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621200527672.png)

### 4. 索引更新的通知

当在Spotlight中被索引的一个或多个实体发生变化时,该索引会被异步更新.

在 iOS 15 和 macOS Monterey 中, `Core Data`框架已经添加了索引更新的通知`NSCoreDataCoreSpotlightDelegate.indexDidUpdateNotification`. 

此通知是由 `SpotlightDelegate`发布的.

![notification](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621200942680.png)



通知的发布时机: 

* `NSManagedObjectContext`处理保存后
* 完成批处理操作后

来看一下 Tags 中订阅通知的操作:

![observer](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621201819390.png)

在处理通知的流程中, 通知的 userInfo 中包含两个键值对:

* NSStoreUUID , `Spotlight`为这个`Store`更新索引
* NSPersistentHistoryTokenKey

使用这两个键值来确认特定的`Store`是否被索引到最新的`Token`

### 5. 支持删减

在WWDC 21之前, 删除索引的唯一方法是通过 Core Spotlight APIs 来删除, 或者在 Core Data 删除整个 client graph.

在 iOS 15 和 macOS Monterey 的新版本中, Core Data 为开发者提供了一种新的方式来管理 Spotlight 索引, 而无需删图.

![delete](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621203134121.png)

* 首先,停止索引, `stopSpotlightIndexing`
* 然后调用`deleteSpotlightIndex`
* 处理错误 
    * 这里可能会返回来自底层的错误, 比如 `Core Data` 和`Core Spotlight`

## 实现全文搜索

我们已经了解了如何定制 `SpotlightDelegate`, 接下来让我们使用 Core Spotlight APIs 向 Tags app 配置全文搜索. 搜索结果是之前设置好索引的内容.

首先, 为 PhotosViewController 定义一个扩展, 采用 UISearchResultsUpdating 协议来处理搜索栏中用户的输入.

![search](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621210217721.png)

1. 如果用户输入是空的, 从我们的数据提供者那里获取所有的图片, 然后重新加载集合视图,因为没有搜索查询.

2. 处理有搜索查询的情况.
    1. 首先, 对用户输入的字符串进行转义.
    2. 接下来, 使用转义后的字符串定义一个查询字符串. 
        * 这里是对`CSSearchableItemAttributeSet`的` keywords` 进行查询.
        * 使用了修饰符 c, d, w
            * c 大小写不敏感
            * d 对变音符号不敏感
            * 基于单词的搜索
    3. 通过格式化查询字符串和对应`CSSearchableItemAttributeSet`属性名称的数组创建出一个`CSSearchQuery`对象

> [CSSearchQuery](https://developer.apple.com/documentation/corespotlight/cssearchquery/) 了解更多操作	

![full_text](https://gitee.com/happts/pics/raw/master/wwdc21_10098/image-20210621212101670.png)

* 设置 `foundItemsHandler`
    * 重复调用(0次或多次)
    * 拿到与查询相匹配的 items
* `completionHandler`
    * 只调用一次
    * 用来检查是否出错, 以及错误处理

* 别忘了开始查询
    * `searchQuery?.start()`

## 总结

总结一下, 我们首先了解到`NSCoreDataCoreSpotlightDelegate`. 了解到它如何帮助你的用户在 app 的内外通过 Spotlight 搜索找到 app 的内容; 接着学习如何快速轻松地定制`SpotlightDelegate`,  使用这个版本提供给的一些新的 API 来自定义`SpotlightDelegate`, 使用了更少的代码实现了对数据的索引.

