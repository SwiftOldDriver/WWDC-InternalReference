> 本篇主要基于以下Session梳理
>
> - [Session 10294 Meet MusicKit For Swift](https://developer.apple.com/videos/play/wwdc2021/10294/)
> - [Session 10291 Explore the catalog with the Apple Music API](https://developer.apple.com/videos/play/wwdc2021/10291/)
> - [Session 10293 Cross reference content with the Apple Music API](https://developer.apple.com/videos/play/wwdc2021/10293/)

[TOC]

# 背景

MusicKit 是一个 Apple 在 2017 年推出的框架，它可以让我们更方便地访问 Apple Music 中音乐相关的信息，也可以让我们在 App 中轻松调用音乐播放等音乐相关能力。

MusicKit 主要有两部分组成

1. iOS 内集成的 API
2. 一套服务端的 API 接口，可以通过发送请求来访问

关于 MusicKit 基本的介绍，可以参考 2017 年 WWDC 的 Session: [Introducing MusicKit](https://developer.apple.com/videos/play/wwdc2017/502/)

本文主要描述了新版的 MusicKit For Swift 增强了哪些能力。全文主要分为三大章节，第一章节主要介绍了新版 iOS 内 MusicKit 的构成，并配有一个 Demo 可以用来参考如何使用 MusicKit 的基础能力。第二章节主要介绍了新版的服务端 API 主要做了哪些调整。第三章节则更细致列举了一些音乐资源交叉访问时所需要用到的 API。其中第三章节内容可能仅有重度 MusicKit 使用者需要用到，初次接触的开发者可以选择跳过。

# MusicKit For Swift

今年推出的 MusicKit for Swift 相比 2017 年的版本在原生 API 层主要有以下一些调整：

1. 实现了原生的数据结构来对服务端返回的数据做映射
2. 为 API 实现了全新的 Swift 并行语法
3. 与 SwiftUI 无缝融合
4. 提供了更简单的接入方式

本章节会对新版的 MusicKit 原生 API 做一些介绍，并通过一个 SwiftUI Demo 来展示如何接入/使用 MusicKit 的能力。

## 基本数据结构

MusicKit 提供了一些新的数据结构来表达音乐内容。通过访问对应的 MusicKit API，我们可以拿到表达这些音乐内容的对象。

拿 Album（专辑）来举一个例子

![](https://images.xiaozhuanlan.com/photo/2021/a4ce458d3ac30b5f80b65143f3f48617.png)

Album 是一个由三部分组成的数据结构：

第一个部分为 Attributes （基本属性），其中包含了 title （名称）、isCompilation（是否是精选），以及一些其他的数据结构比如 Artwork（专辑图片），Artwork 中包含了可以访问的图片 URLs 以及尺寸、颜色等信息。

第二个部分为 Relationships（关系），Relationships 是一些与 Album 本身强相关的属性，比如 atists（艺人）、genres（曲风）以及 tracks（专辑中所有的歌）。Track 是一种表示音乐的数据结构，而 tracks 则是一个 Track 的集合。

第三个部分为 Associations（关联），Associations 是一些与 Album 联系较弱的属性，Associations 与 Relationships 十分相似，但是他们更像是人为主观划分的一些属性，而不是 Album 的固有属性。比如 appearsOn 字段会返回一个 Playlist（歌单）集合，relatedAlbums 则返回与此专辑相关的其他专辑。

拿到一个 Album 对象以后，你可以通过 with() 方法访问到比如 artists、tracks 之类的 Relationships 字段，也可以访问到 relatedAlbums 之类的 Associations 字段，具体可以参考下面的实现。

```swift
// Loading and accessing relationships

let detailedAlbum = try await album.with([.artists, .tracks, .relatedAlbums])
print("\(detailedAlbum)")

if let tracks = detailedAlbum.tracks {
    print("  Tracks:")
    tracks.prefix(2).forEach { track in
        print("    \(track)")
    }
}

if let relatedAlbums = detailedAlbum.relatedAlbums {
    print("  \(relatedAlbums.title ?? ""):")
    relatedAlbums.prefix(2).forEach { relatedAlbum in
        print("    \(relatedAlbum)")
    }
}
```

注：因为with操作是异步方法，所以需要await标识

## 如何获取并播放音乐内容

在 Meet MusicKit For Swift 的 Session 中有一个 [Demo](https://developer.apple.com/documentation/musickit/using_musickit_to_integrate_with_apple_music) 工程。

这个 Demo 中主要包含了如下几个功能：

1. 搜索专辑功能
2. 记录并展示最近访问过的专辑
3. 点击首页中专辑列表中的专辑来访问专辑详情页
4. 专辑详情页中有歌曲列表，点击歌曲可以起播

Session 中通过 Demo 为我们演示了

Demo 中的几块核心代码如下所示：

> 通过 MusicCatalogSearchRequest API 进行专辑搜索的过程。

```swift
/// Makes a new search request to MusicKit when the current search term changes.
    private func requestUpdatedSearchResults(for searchTerm: String) {
        detach {
            if searchTerm.isEmpty {
                await self.reset()
            } else {
                do {
                    // Issue a catalog search request for albums matching search term.
                    var searchRequest = MusicCatalogSearchRequest(term: searchTerm, types: [Album.self])
                    searchRequest.limit = 5
                    let searchResponse = try await searchRequest.response()
                    
                    // Update the user interface with search response.
                    await self.apply(searchResponse, for: searchTerm)
                } catch {
                    print("Search request failed with error: \(error).")
                    await self.reset()
                }
            }
        }
    }
```

> 利用摄像头读取一个实物专辑的 upc 条码后，使用 MusicCatalogResourceRequest 请求拿到对应的 Album 对象的过程。

```swift
/// Searches for an album matching a scanned barcode.
    private func handleDetectedBarcode(_ detectedBarcode: String) {
        if detectedBarcode.isEmpty {
            self.detectedAlbum = nil
        } else {
            detach {
                do {
                    // DEMO: Request albums matching detectedBarcode.
                    
                    let albumsRequest = MusicCatalogResourceRequest<Album>(matching: \.upc, equalTo: detectedBarcode)
                    let albumsResponse = try await albumsRequest.response()
                    if let firstAlbum = albumsResponse.items.first {
                        await self.handleDetectedAlbum(firstAlbum)
                    }
                } catch {
                    print("Encountered error while trying to find albums with upc = \"\(detectedBarcode)\".")
                }
            }
        }
    }
```

> 通过 ApplicationMusicPlayer 单例来启播一个 Album 对象的过程。

```swift
/// The MusicKit player used for Apple Music playback.
    private let player = ApplicationMusicPlayer.shared
/// The action to perform when the Play/Pause button is tapped.
    private func handlePlayButtonSelected() {
        if !isPlaying {
            if !isPlaybackQueueSet {
                player.setQueue(with: album)
                isPlaybackQueueSet = true
            }
            player.play()
        } else {
            player.pause()
        }
    }
```

通过 Demo 我们可以发现，使用 MusicKit 中的 MusicCatalogResourceRequest、MusicCatalogSearchRequest 等 API 就可以轻松访问到 Apple Music 中的音乐信息。

另外通过 ApplicationMusicPlayer，我们可以直接起播一个 Album 对象。锁屏时的媒体控制功能（Remote Control）MusicKit 也已经帮我们全部处理好了。

## 服务端接口

文章开头也提到过，MusicKit 除了提供 iOS 内 API 的同时也提供了通过服务端接口请求的方式来访问数据。

通过请求拿到的数据是 Data 类型的 JSON 数据，需要通过 JSONDecoder 进行解码才可以使用。但我们可以直接反序列化到对应的MusicItem 类型上，因为这些 MusicItem 类型都默认支持了 Codable 协议。

在下面的例子中，我们通过接口拿到了对应的 Data 数据。之后我们将 Data 数据使用对应的 Genre 类型进行解析，而不需要写额外的Decode 代码。

```swift
// Loading top level genres
// https://api.music.apple.com/v1/catalog/us/genres
//
//	{
//		"data": [
//			... 
//    	{
//    		"attributes": {
//       	"name": "Music"
//     	},
//     	"href": "/v1/catalog/us/genres/34",
//     	"id": "34",
//     	"type": "genres"
//    	},
//			...
//		]
//	}
//
//

struct MyGenresResponse: Decodable {
    let data: [Genre]
}

let countryCode = try await MusicDataRequest.currentCountryCode
let url = URL(string: "https://api.music.apple.com/v1/catalog/\(countryCode)/genres")!

let dataRequest = MusicDataRequest(urlRequest: URLRequest(url: url))
let dataResponse = try await dataRequest.response()

let decoder = JSONDecoder()
let genresResponse = try decoder.decode(MyGenresResponse.self, from: dataResponse.data)
print("\(genresResponse.data[9])")
```

其他的音乐内容也可以通过类似的方式使用 Apple Music API 来获取，具体可以使用的服务端 API 接口可以在 https://developer.apple.com/documentation/applemusicapi 上查询到。

## 安全与隐私

因为要对于用户隐私进行保护，所以当我们需要访问任何与用户的收听历史、音乐库有关的 API 时，都需要额外获得用户的授权才可以使用。这个授权只针对一个 APP 和一台设备，不同的 App 和设备都需要单独请求授权。下面是授权弹窗的样式，我们可以在弹窗的副标题中向用户表达为什么要访问用户的 Apple Music 内容。

![](https://images.xiaozhuanlan.com/photo/2021/7524670ca52fe7516be23bff354ee103.png)

只有当用户未授权过时，才会有弹窗提示。下面是如何获取用户授权的代码：

```swift
// Requesting user consent for MusicKit

@State var isAuthorizedForMusicKit = false

func requestMusicAuthorization() {
    detach {
        let authorizationStatus = await MusicAuthorization.request()
        if authorizationStatus == .authorized {
            isAuthorizedForMusicKit = true
        } else {
            // User denied permission.
        }
    }
}
```

使用 Apple Music API 还需要一个 Developer Token 来进行校验。以前获取这个 token 需要一个很复杂的流程，现在 token 已经自动集成在了你的 App 中。你只需要在注册 AppID 的地方，选择 App Services 页面，然后勾选 MusicKit 就大功告成了。

![](https://images.xiaozhuanlan.com/photo/2021/df196f5f24b5cb4d3b618620a2bbd6c1.png)

任何 Apple Music API 中个性化的请求还需要一个 User Token，像 Developer Token 一样，User Token 现在也已经默认集成了。

想了解 token 的另一种获取方式，可以参考 https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens。

## 功能可用性

即使我们一切就绪了，用户也有可能无法使用我们的 App 来播放音乐。因为用户可能没有启用 Apple Music 的订阅服务（众所周知 Apple Music 是需要付费使用的）。我们需要知道用户是否已经激活了 Apple Music 的订阅服务。MusicKit 中的订阅信息会通过三个独立的接口暴露出来，分别告诉我们用户是否能播放音乐内容，用户是否开启了 iCloud 音乐库，以及用户是否可以订阅 Apple Music。

所以对于一部分 Apple Music 相关的功能，我们应该确认功能可用性。比如我们有一个按钮是用来播放音乐的，如果用户无法播放对应的 Apple Music 内容，那这个按钮就应该置为 disable 状态。

下方是示例代码：

```swift
// Using music subscription to drive state of a play button

@State var musicSubscription: MusicSubscription?

var body: some View {
    Button(action: handlePlayButtonSelected) {
        Image(systemName: "play.fill")
    }
    .disabled(!(musicSubscription?.canPlayCatalogContent ?? false))
    .task {
        for await subscription in MusicSubscription.subscriptionUpdates {
            musicSubscription = subscription
        }
    }
}
```

## 播放器的选择

在前面的 Demo 中，我们使用了 ApplicationMusicPlayer 作为播放器。实际上 MusicKit 提供了两种不同的播放器，分别是 SystemMusicPlayer 和 ApplicationMusicPlayer。当使用 SystemMusicPlayer 时，实际上是在对 Music App 进行控制，我们通过 Music App 来播放音乐。如果选择 ApplicationMusicPlayer 的话则是我们的 App 自身在对播放做出控制。

下图更具体展现了 SystemMusicPlayer 和 ApplicationMusicPlayer 的区别：

![](https://images.xiaozhuanlan.com/photo/2021/c3bf2c8278ae9f915cd4e8c476c932a5.png)

可以看到在一些轻量的场景我们完全可以使用 SystemMusicPlayer 来进行播放，唯一的代价可能是用户在锁屏界面点击播放器时唤起的不是我们的 App 而是 Music App😂。如果需要对播放的队列做较重的控制的话，那还是建议使用 ApplicationMusicPlayer。

## Apple Music 订阅

如果我们的用户还没有成为 Apple Music 的订阅用户的话，我们也可以在 App 中直接唤起弹窗让他们开始免费试用。这样用户就可以在我们的 App 中体验完整的功能了。 

通过引导用户去订阅 Apple Music，我们甚至还能通过苹果获得的佣金（毕竟给Apple Music引流了）。关于佣金更详细的信息可以参考 https://affiliate.itunes.apple.com/resources

实际的操作上如下面的代码所示，我们可以用一个 state 变量来绑定是否需要展示订阅的服务。

```swift
// Showing contextual music subscription offer

@State var musicSubscription: MusicSubscription?
@State var isShowingOffer = false

var offerOptions: MusicSubscriptionOffer.Options {
    var offerOptions = MusicSubscriptionOffer.Options()
    offerOptions.itemID = album.id
    return offerOptions
}

var body: some View {
    Button("Show Subscription Offers", action: showSubscriptionOffer)
        .disabled(!(musicSubscription?.canBecomeSubscriber ?? false))
        .musicSubscriptionOffer(isPresented: $isShowingOffer, options: offerOptions)
}

func showSubscriptionOffer() {
    isShowingOffer = true
}
```

在调试过程中，如果想要模拟未订阅的用户（可能你的 AppleID 已经订阅了 Apple Music）的话，可以通过退出 AppleID 的方式来测试。

点击对应的订阅按钮就会唤起如下的弹窗：

![](https://images.xiaozhuanlan.com/photo/2021/123dc44658b52addf9599fd8217fae2c.png)

# 新增/加强的服务端 API

MusicKit 中的服务端 API 是可以脱离 iOS 去独立访问的，它不光可以在 iOS App 中使用，也可以网页上去调用。它可以帮助开发者非常轻松地访问到 Apple Music 中的海量内容。

再次补充下现有的API的查询地址 https://developer.apple.com/documentation/applemusicapi

下面主要介绍了这次新增/加强了的服务端 API。

## 搜索接口

下面是一个原有的搜索API：

```json
/v1/catalog/us/search/hints?term=taylor

{
  "results": {
    "terms": [
      "taylor swift",
      "taylor swift essentials",
      ...
    ]
  }
}
```

现在提供了一个全新的搜索API，它可以完全替代原有的 API，同时可以看到它提供了比原来更丰富的信息。

```json
/v1/catalog/us/search/suggestions?term=taylor&kinds=terms

{
  "results": {
    "suggestions": [{
    	"kind": "terms",
    	"searchTerms": "taylor swift",
    	"displayTerms": "taylor swift"
    }, {
    	"kind": "terms",
    	"searchTerms": "taylor swift essentials",
    	"displayTerms": "taylor swift essentials"
    },
    ...
    ]
  }
}
```

使用新版的搜索 API 我们还可以请求到搜索的 topResults，并且可以指定我们需要的类型作为参数，比如艺人、专辑等

通过这个接口返回的特定类型的数据都是一种资源，下图是资源的数据结构。资源有两种数据结构，其中 Resource identifier 是我们去定位一个资源所需要的最小信息，而完整的 Resource 结构还会包含 attributes 和 relationships。

![](https://images.xiaozhuanlan.com/photo/2021/d86bab3815d9ac2df7a548e1671ac148.png)

可以看到当我们添加 type 参数请求艺人、专辑类型后，接口返回了对应类型的 Resource 结构。

```json
/v1/catalog/us/search/suggestions?term=taylor&kinds=topResults&types=artists,songs

{
  "results": {
    "suggestions": [{
    	"kind": "topResults",
    	"content": {
    		"id": "159260351",
    		"type": "artists",
    		"href": "/v1/catalog/us/artists/159260351",
    		"attributes": {...}
    	}
    }, {
    	"kind": "topResults",
    	"content": {
    		"id": "1552791228",
    		"type": "songs",
    		"href": "/v1/catalog/us/songs/1552791228",
    		"attributes": {...}
    	}
    },
    ...
    ]
  }
}
```

通过 relate 参数可以指定返回的资源所需要的关联资源，比如下面的代码就指定 songs 类型资源在返回时额外带上所属的 albums 信息。relate 参数和 include 参数很类似，但是 relate 参数仅会返回资源的 Resource Identifiers 而不是完整的 Resource，所以它的响应会更快。

```json
/v1/catalog/us/search/suggestions?term=taylor&kinds=topResults&types=artists,albums,songs&relate[songs]=albums

{
  "kind": "topResults",
  "content": {
    "id": "1552791228",
    "type": "songs",
    "href": "/v1/catalog/us/songs/1552791228",
    "attributes": {...},
    "relationships": {
      "albums": {
        "href": "/v1/catalog/us/songs/1552791228/albums",
        "data": [{
          "id": "1552791073",
          "type": "albums",
          "href": "/v1/catalog/us/albums/1552791073"
        ]}
      }
    }
  }
}
```

Resource 结构中的 attributes 是一个默认的字段集合，但通过 extend 参数可以让我们在返回的 Resource 中拿到额外的 attributes 信息。但需要注意的是 extend 参数会带来更大的开销，所以仅在需要的时候使用吧。下方是在 songs 类型的 Resource 结构中额外获取 artistUrl 字段的示例：

```json
/v1/catalog/us/search/suggestions?term=taylor&kinds=topResults&types=artists,albums,songs&relate[songs]=albums&extend[songs]=artistUrl

{
  "kind": "topResults",
  "content": {
    "id": "1552791228",
    "type": "songs",
    "href": "/v1/catalog/us/songs/1552791228",
    "attributes": {
    	"artistName": "Taylor Swift",
    	"name": "Fearless (Taylor's Version)",
    	"artistUrl": "https://music.apple.com/us/artist/taylor-swift/159260351",
    	"albumName": "Fearless (Taylor's Version)",
    	"playParams": {...},
    	...
    },
    "relationships": {...}
  }
}
```

## views 参数

对于直接获取资源的 API 接口，这次新加入了 views 参数。views 表达了一种更松散的资源关系，比如如下的代码可以拿到艺人的热歌数据。具体 views 支持的类型可以在前文中附带的 Apple Music API 文档中找到。

```json
/v1/catalog/us/artists/159260351?views=top-songs
/v1/catalog/us/artists/159260351/views/top-songs
// 以上两种方式都可以
{
	"data": [{
		"id": "159260351",
		"type": "artists",
		"href": "/v1/catalog/us/artists/159260351",
		"attributes": {...},
		"views": {
			"top-songs": {
				"href": "/v1/catalog/us/artists/159260351/view/top-songs",
				"attributes": {...},
				"data": [{
					"id": "1552792305",
					"type": "songs",
					"href": "/v1/catalog/us/songs/1552792305",
					...
				}, ...]
			}
		}
	}]

```

## Charts API 增强

这次还对 charts API 做了增强，通过 types 参数和 with 参数的组合，可以拿到特定榜单中的特定类型的资源。具体例子如下所示：

```json
/v1/catalog/us/charts?types=playlists&with=dailyGlobalTopCharts,cityCharts

{
	"results": {
		"cityCharts": [{
			"name": "City Charts",
			"data": [...],
			...
		}],
		"dailyGlobalTopCharts": [{
			"name": "Daily Top 100",
			"data": [...],
			...
		}],
		"playlists": [{
			"name": "Top Playlists",
			"data": [...],
			...
		}]
	}
}
```

# 内容资源的交叉访问

本章节内容仅对重度使用 MusicKit 开发者有用，初识 MusicKit 的同学可以跳过，主要列举了详细的资源交叉访问相关的 API。

## 跨店面资源转换

由于 Apple Music 在不同地区所提供的内容源是不同的，所以我们的服务端 API 中都带有店面信息，例如 us / jp 等。而对于同样一个资源，通过不同的店面去请求得到的 ID 可能是不同的。如下面所示，同一个专辑在 us 和 jp 的 ID 并不一样。

![](https://images.xiaozhuanlan.com/photo/2021/1fea453c8dd4c2fffba60adff0aa9ad8.png)

所以 MusicKit 提供了在不同店面的资源 id 之间互相转换的能力，equivalents处是具体的店面名。

```json
GET /v1/catalog/jp/albums?filter[equivalents]=1500951604

{
  "data": [
    {
      "id": "1500954334",
      "type": "albums",
      "href": "/v1/catalog/jp/albums/1500954334",
      "attributes": {
        "artistName": "レディー・ガガ",
        "name": "Chromatica",
        "playParams": { ... },
        ...
      },
      "relationships": { ... }
    }
  ]
}
```

## 脏版、非脏版资源转换

另外一些专辑、音乐通常有 explicit、clean 之分（脏版、非脏版，脏版会有些脏话，而非脏版则做了和谐）。我们可以通过 restrict=explicit 来限制只返回 clean 版的专辑（当然前提是存在 clean 版本）。

```json
GET /v1/catalog/us/albums?filter[equivalents]=1540031620&restrict=explicit
{
  "data": [
    {
      "id": "1541243687",
      "type": "albums",
      "href": "/v1/catalog/us/albums/1541243687",
      "attributes": {
        "artistName": "Megan Thee Stallion",
        "name": "Good News",
        "playParams": { ... },
        "contentRating": "clean",
        ...
      },
      "relationships": { ... }
    }
  ]
}
```

如果不加限制的话，可能就会返回脏版的专辑了。

```json
GET /v1/catalog/us/albums?filter[equivalents]=1540031620

{
  "data": [
    {
      "id": "1540031620",
      "type": "albums",
      "href": "/v1/catalog/us/albums/1540031620",
      "attributes": {
        "artistName": "Megan Thee Stallion",
        "name": "Good News",
        "playParams": { ... },
        "contentRating": "explicit",
        ...
      },
      "relationships": { ... }
    }
  ]
}
```

## Catalog 与 Library 资源转换

由于 Apple Music 中 catalog 和 libraray 下对于同样的资源也存在 ID 不同的情况，所以现在也同样提供了可以用于互相转换的 API。

先是 library 转 catalog 的API：

```json
GET /v1/me/library/songs/{libraryID}?relate=catalog

{
  "data": [
    {
      "id": "i.eoD88xWsk6X5Rl3",
      "type": "library-songs",
      "href": "/v1/me/library/songs/i.eoD88xWsk6X5Rl3",
      "attributes": { ... },
      "relationships": {
        "catalog": {
          "href": "/v1/me/library/songs/i.eoD88xWsk6X5Rl3/catalog",
          "data": [
            {
              "id": "1552791228",
              "type": "songs",
              "href": "/v1/catalog/us/songs/1552791228" } ] } } } ] }
```

再是 catalog 转 library 的 API，由于 library 涉及到用户的个人隐私，所以这个 API 是需要 User Token 的。

```json
GET /v1/catalog/us/songs/{catalogID}?relate=library

{
  "data": [{
      "id": "1552791228",
      "type": "songs",
      "href": "/v1/catalog/us/songs/1552791228",
      "attributes": { ... },
      "relationships": {
        "library": {
          "href": "/v1/catalog/us/songs/1552791228/library",
          "data": [
            {
              "id": "i.eoD88xWsk6X5Rl3",
              "type": "library-songs",
              "href": "/v1/me/library/songs/i.eoD88xWsk6X5Rl3" } ] } } } ] }
```

## UPC 查询

UPC 是实物专辑上会携带的一种条码，MusicKit 则提供了通过 UPC 码来获取对应专辑信息的 API。

```json
GET /v1/catalog/us/albums?filter[upc]=00602435945422

{
  "data": [
    {
      "id": "1556669854",
      "type": "albums",
      "href": "/v1/catalog/us/albums/1556669854",
      "attributes": {
        "artistName": "Drake",
        "name": "Scary Hours 2",
        "upc": "00602435945422",
        "playParams": { ... },
        "contentRating": "explicit",
        ...
      },
      "relationships": { ... }
    }
  ]
}
```

# 总结

MusicKit 的这次更新使得 iOS 内的 API 以及服务端接口 API 都更强大了。如果我们在开发 App 的时候有需要用到音乐类资源的查询、音乐播放等音乐相关的功能，那可以考虑下是否可以利用 MusicKit 的能力。
