---
session_ids: [10035]
---

# WWDC22 10035 - 探索 MapKit 新功能

>作者：钟山，iOS 开发
>
>审核：XXX
>
>本文基于 [Session 10035](https://developer.apple.com/videos/play/wwdc2022/10035/) 和 [Session 10006](https://developer.apple.com/videos/play/wwdc2022/10006/) 梳理。

![Swift 发展时序图](./images/apple_map.png)

自2012年6月11日 Apple 在 WWDC 上向外宣布在自家 iOS 中将不会再默认搭载 ‘Google 地图’，‘苹果地图’将取代而之默认在 iOS 的系统中向用户提供地图服务，不知不觉已经过去了整整十个年头。在 2012年9月正式开放使用之后，因取代‘Google 地图’所推出的自家地图服务内容不完整、功能欠佳等问题广受用户诟病。因为漏洞百出甚至引发过苹果的公关危机，CEO库克还因此公开向用户道歉。库克当时表示：“会不断改进‘苹果地图’给予用户的体验”以及“如果消费者不满意该地图所提供的服务，可以使用Google或是Nokia地图”。

在这十年里，‘苹果地图’持续修补漏洞、改进功能，从一开始依赖第三方数据到自己收集数据，一直在努力将其打造为世界上最好的地图应用。同时为开发者提供了两种将地图 app 整合到其产品中的方式，其中之一是 MapKit，可以让你将地图 app 整合到 iOS、iPadOS 或 macOS 的 app 中，这样你就能在 app 中显示地图或卫星图像、添加注释和悬浮窗、标注兴趣点、确定地图坐标信息等等。另外一个是MapKit JS，可为网站带来交互式地图，不只是添加注释、悬浮窗，还有搜索和导航等地图服务的界面。

在今年的 WWDC 中，苹果不仅带来了 MapKit 的新功能，还首次开放 Apple Maps Server API 来帮助开发者构建性能更好的地图服务。本文将对这部分内容进行详细介绍，主要分为两大块：

1. 探索 MapKit 新功能
2. Apple Maps Server API

## 探索 MapKit 新功能

### Map Configuration 地图配置

在 iOS 15 中，配置地图的方式是通过 MKMapView 上的各种属性。苹果在 iOS 16 中，将弃用这些属性，并引入了新的 Map Configuration API 作为替代。

即将废弃的API:

```Swift
class MKMapView {
   var mapType: MKMapType API_TO_BE_DEPRECATED
   var pointOfInterestFilter: MKPointOfInterestFilter? API_TO_BE_DEPRECATED
   var showsBuildings: Bool API_TO_BE_DEPRECATED
   var showsTraffic: Bool API_TO_BE_DEPRECATED
   ....
}

enum MKMapType  {
    case standard = 0
    case satellite = 1
    case hybrid = 2
    case satelliteFlyover = 3
    case hybridFlyover = 4
    case mutedStandard = 5
}
```

新 API 使用 MKMapConfiguration 作为新地图配置 API 的抽象基类，有三个具体子类，分别为MKImageryMapConfiguration、MKHybridMapConfiguration、MKStandardMapConfiguration。

如下面代码所示：

```Swift
class MKMapView {
    @available(iOS 16.0, *)
    var preferredConfiguration: MKMapConfiguration
   
    @available(iOS 16.0, *)
    var selectableMapFeatures: MKMapFeatureOptions
}

enum ElevationStyle {        
        case flat = 0 // 平面样式：意味着地面看起来是平坦的，道路，包括桥梁和立交桥，也显得平坦。
        case realistic = 1 // 逼真样式：意味着地面地形再现了真实世界的高程，例如丘陵和山脉。
}

class MKMapConfiguration {
     /// 基类支持 elevationStyle 属性，该属性可以是平面的，也可以是真实的。
	var elevationStyle: ElevationStyle
}

class MKImageryMapConfiguration: MKMapConfiguration { 
/// 影像地图配置：仅显示卫星影像，没有其它地图元素，因此它没有任何其他属性。
}

class MKHybridMapConfiguration : MKMapConfiguration { 
/// 混合地图配置
	var pointOfInterestFilter: MKPointOfInterestFilter? // 过滤器
	var showsTraffic: Bool // 是否展示交通流量状况
}

/// 强调样式
enum EmphasisStyle {
	case default // 
	case muted // 静音：隐藏你不关心的细节
}

class MKStandardMapConfiguration : MKMapConfiguration { 
/// 标准地图配置
	var emphasisStyle: EmphasisStyle
	var pointOfInterestFilter: MKPointOfInterestFilter?
	var showsTraffic: Bool
}

```

#### 配置类用途
以上配置使用效果如下图所示，从左到右依次为影像地图、混合地图、标准地图效果：

![影像地图](./images/map_configuration.png)

对比上面实现效果很容易看出来：

* 影像地图配置用于呈现卫星风格的影像
* 混合地图配置用于呈现基于图像的地图，其中添加了地图特征，例如道路标签和兴趣点
* 标准地图配置用于呈现完全基于图形的地图

#### ElevationStyle 角度样式

这是一个地图配置基类属性，所有的地图配置都可以设置，下图展示了标准地图配置分别设置 flat 和 realistic 的呈现效果：

![影像地图](./images/realistic.png)

这个属性可以理解为摄像机在不同高度摄像带来的不同视觉效果：

* flat为默认属性，这个属性下意味着地面看起来是平坦的，包括道路、桥梁和立交桥也显得平坦。
*  realistic意味着地面地形再现了真实世界的高度，例如丘陵和山脉，道路以逼真的高程细节描绘。

#### EmphasisStyle 强调样式

这个属性为标准地图配置独有，该属性可以是 default 或 muted。

![标准地图强调样式静音](./images/EmphasisStyle_muted.png)

可以看到：

* default为默认，呈现细节更丰富。
*  muted 对细节进行了弱化处理，隐去了部分细节，可以让用户关注你想让用户关注的信息。

#### 地图配置类和地图类型间的对应关系

针对新提供配置 API，不同的组合对应不同的 MKMapType，以下表格显示了新地图配置类和 MKMapType 属性之间的对应关系：

![属性之间的对应关系](./images/map_type_mapping.png)


### Overlay improvements

简单回顾叠加层

![属性之间的对应关系](./images/aboveLabels.png)
![属性之间的对应关系](./images/aboveRoads.png)


iOS 16 中引入的一个新功能，称为透明建筑。无论您的叠加层是在道路之上还是在标签之上，当从上到下无倾斜地查看时，您的叠加层将始终呈现在建筑物的顶部。

```Swift
class MKMapView {
	func addOverlays(_ overlays: [MKOverlay], level: MKOverlayLevel)
}

enum MKOverlayLevel {   
    case aboveRoads = 0 //
    case aboveLabels = 1
}

```




### Blend modes

这个新的 API 让您可以更好地控制叠加层的外观和感觉，并解锁一系列新的创意可能性。

主要用来突出地理区域、淡化地图，使得内容突出。

![属性之间的对应关系](./images/blend_modes.png)


### Selectable Map Features
用户点击地图可以在上面定义位置标签。

创建步骤

### Look Around 逛一逛

Look Around 是苹果地图在 iOS 13 中引入的，可以环顾四周来真正了解一个地方。 Look Around 图像提供了令人难以置信的细节水平，利用 3D 模型提供了与其他地图不同的真实感。在 iOS 16 中，苹果将 Look Around 引入到MapKit。

创建步骤


## Apple Maps Server API


苹果提供四个服务 API：地理编码、反向地理编码、搜索、估计到达时间 供开发者调用，
使用这些API可以减少网络调用，但是有调用上限。






## 总结

从安全角度考虑，外国公司在中国是没有测绘资格的，所以苹果地图一直使用的是高德提供的数据。同时高德也有自己的移动地图应用，使用体验来看苹果地图的更新远慢于高德地图，高德地图的数据可以天级别甚至分钟级别在线更新，服务迭代也很快，苹果地图服务几乎是月或季度级别。所以在国内的应用，基本不太会使用MapKit。

但是如果你负责开发的应用要出海，可以考虑使用苹果全新地图 API，支持可选地图功能和环顾四周等全新功能。

带有 3D 城市体验的全新地图需要兼容的硬件。在 iOS 上，新地图支持需要基于 A12 的 iPhone 和 iPad 或更高版本。在 macOS 上，新的地图支持需要任何基于 M1 的计算机或更高版本。

在 3D 城市体验不可用的区域，地图将自动退回以呈现具有平坦海拔的全新地图。在所有其他设备上，全新地图将以平面高度呈现。

在 M1 Mac 上，Xcode 允许您通过更改操作系统版本来模拟这两种体验。我们鼓励您尝试两者，以确保您的应用在所有设备上看起来都很棒！ 3D 城市体验可在世界各地的许多大都市地区使用。我们不断在此列表中添加新城市，因此我鼓励您查看会话说明中链接的功能可用性网站上的 3D 城市体验部分。我们关于采用全新地图和使用地图配置 API 的部分到此结束。