## WWDC21 - ProRAW 的拍摄与处理

> 作者：Nemo，目前在字节跳动剪映担任客户端开发。
>
> 审核：折腾范儿_唯敬，iOS/前端 开发者，就职于阿里巴巴，喜欢研究跨平台动态化混合前端相关的内容，目前从事移动应用客户端/前端相关开发工作。

[TOC]

> WWDC21 Session 10160 - [Capture and process ProRAW images](https://developer.apple.com/videos/play/wwdc2021/10160/)

Apple 设备在图片拍摄和处理上已经有了一段不短的发展历程了。从早期支持处理 JPEG 和 HEIC，到 iOS 10 开始支持拍摄和编辑 Bayer Raw（但是 iOS 系统相机并没有支持 Raw 拍摄，而是第三方相机 App 支持）。而去年的 iPhone12 Pro 系列在 iOS 14.3 起支持了 [Apple ProRAW](https://support.apple.com/zh-cn/HT211965)。这篇文章将会介绍开发者应该如何适配 ProRaw 的拍摄、保存、处理、显示等一系列流程。

## Apple ProRaw 简介

JPEG 和 HEIC，都属于有损压缩过的图片，而 Raw 相当于照片的原始数据。

压缩格式（JPEG、HEIC）：

* 被处理过
* 显示更快
* 可以使用各种摄像头特性（多摄像、夜景、景深等）合成
* 文件较小

RAW：

* 可以更灵活地被处理
* 未经过压缩
* 更多的色彩信息

而 Apple 的 ProRaw，结合了两者的优点

* 表现和 HEIC 类似
* 无损压缩
* 可以使用各种摄像头特性合成
* 显示速度较快


### 兼容性

ProRaw 采用标准的 [Adobe DNG](https://helpx.adobe.com/cn/photoshop/digital-negative.html) 文件格式进行存储。DNG 是一种兼容多家相机厂商 Raw 格式转换的公开通用标准格式，兼容性很好：

1. 软件支持：大部分修图软件，例如 Adobe Lightroom 等都支持
2. 开发支持：Apple 的 ImageIO 和 Core Image 框架都支持处理
3. 系统支持：旧版本的 iOS 和 macOS 都支持
4. 包含了全像素的 JPEG 预览图

### 图像质量

1. 包含线性的 [Scene referred](https://mymusing.co/display-referred-vs-scene-referred-color/) 图
2. 包含多重曝光和图像融合信息
3. 低压缩的 12-bit RGB
4. 14 档的动态范围
5. 文件大小在 10-40 mb 之间

> 关于 ProRaw 背后一些技术细节，可以参考 [Understanding ProRAW](https://lux.camera/understanding-proraw/)

### 观感

1. ProRAW 图像的观感 HEIC 差不多
2. 通过在 DNG 中嵌入一些特殊标签来保存这些信息

> 详情可以参考 [Adobe DNG 1.4.0 白皮书](https://www.adobe.com/content/dam/acom/en/products/photoshop/pdfs/dng_spec_1.4.0.0.pdf) 
>
> 其中 ProRaw 还用到 2021.4 才发布的 [DNG 1.6.0](https://helpx.adobe.com/photoshop/kb/dng-specification-tags.html) 的一部分新标签


## AVCapture 拍摄

在 AVFoundation 的拍摄 API 中，新增了拍摄 ProRaw 图像的支持。

> 可以在 Apple 官方的 [相机 Demo](https://developer.apple.com/documentation/avfoundation/cameras_and_media_capture/avcam_building_a_camera_app) 的基础上尝试新的 API。

整体上，ProRaw 比普通的 Raw 在拍摄的支持上会完善不少，包括支持更多的镜头，还能带上场景信息等。

![截屏2021-06-26 下午5.39.16](https://images.xiaozhuanlan.com/photo/2021/9ddc564cef2282506d22260bdd1ce86d.png)

### 1. 设置 AVCaptureSesion 和 AVCaptureDevice

```swift
let session = AVCaptureSession()
session.beginConfiguration()
// 1. 设置为 Photo
session.sessionPreset = .photo 

let device: AVCaptureDevice = ... // 根据设备找到对应可用的镜头
// 2. 找到格式是否支持
guard let format = device.formats.first(where: { $0.isHighestPhotoQualitySupported }) else {
	//...
}

do {
	try device.lockForConfiguration()
  // 3. 设置格式
	device.activeFormat = format
	device.unlockForConfiguration()
} catch {   
  //...
}
```

### 2. 设置 AVCaptureOutput

```swift
/// AVCapturePhotoOutput
let photoOutput = AVCapturePhotoOutput()
// 如果支持 RroRaw 输出，则打开
photoOutput.isAppleProRAWEnabled = photoOutput.isAppleProRAWSupported
```

> AVCapturePhotoOutput 的 maxPhotoQualityPrioritization 质量等级，可在速度和质量之间取舍，详情见 WWDC2021 - [Capture high-quality photos using video formats](https://developer.apple.com/videos/play/wwdc2021/10247/)。

### 3. ProRaw 拍摄的特殊配置

```swift
// 1. 找到支持的像素格式
guard let pixelFormat = photoOutput.availablePhotoPixelFormatTypes.first(where: { AVCapturePhotoOutput.isAppleProRAWPixelFormat($0) }) 
else { 
  //... 
}

// 2. （可选）找到支持的压缩类型
guard let processedPhotoCodecType = photoOutput.availablePhotoCodecTypes.first 
else {
  //...
}

// 3. 创建拍摄设置，如果需要压缩类型就传入
let photoSettings = AVCapturePhotoSettings(rawPixelFormatType: proRawPixelFormat,	processedFormat: [AVVideoCodecKey: processedPhotoCodecType])

// 4. 设置缩略图的编解码参数，大部分情况下建议使用如下配置
guard let thumbnailPhotoCodecType = photoSettings.availableRawEmbeddedThumbnailPhotoCodecTypes.first 
else {
	//...
}
            
let dimensions = device.activeFormat.highResolutionStillImageDimensions
photoSettings.rawEmbeddedThumbnailPhotoFormat = [
  AVVideoCodecKey: thumbnailPhotoCodecType,
  AVVideoWidthKey: dimensions.width,
  AVVideoHeightKey: dimensions.height,
]

// 5. 设置 photoQualityPrioritization，但这里不能大于 AVCapturePhotoOutput 的 maxPhotoQualityPrioritization（比如 output 设置了 .balanced，这里就只能设置 .balanced 或 .speed）

photoSettings.photoQualityPrioritization = .quality

// 6. （可选）设置用于预览的像素格式
if let previewPhotoPixelFormatType = photoSettings.availablePreviewPhotoPixelFormatTypes.first {
	photoSettings.previewPhotoFormat = [kCVPixelBufferPixelFormatTypeKey as String: previewPhotoPixelFormatType]
}
```

在这三步后，就可以和普通照片一样调用 `AVCapturePhotoOutput` 的方法进行拍摄了。

```swift
photoOutput.capturePhoto(with: photoSettings, delegate: delegate)
```

### 4. 接受拍摄的 ProRaw

遵循 `AVCapturePhotoCaptureDelegate`，可以在拍摄后收到对应的回调。

```swift
func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
	guard error == nil else { return }
  if let preview = photo.previewPixelBuffer {
    // 比如用 photo.previewCGImageRepresentation() 进行预览
	}
  
  // 如果设置了压缩格式，这个方法会调用两次，通过 isRawPhoto 来区分是压缩格式还是 Raw 格式
	if photo.isRawPhoto {
		if let data = photo.fileDataRepresentation() {
			// 处理 DNG 数据，比如保存到相册
		}
            
		if let pixelBuffer = photo.pixelBuffer {
			// 处理 pixel 数据
		}
	}
}
```

ProRaw 上还带有基于场景信息的语义分割蒙版(Semantic Segmentation Mattes)，但是需要通过 Core Image/Image IO 进行处理。

> 语义分割蒙版的介绍可参考 WWDC2019 - [Introducing Photo Segmentation Mattes](https://developer.apple.com/videos/play/wwdc2019/260/)

如果需要对 DNG 文件做一些自定义，可以自定义处理器并遵循 `AVCapturePhotoFileDataRepresentationCustomizer`，再调用 `fileDataRepresentation(with:)` 使用自定义的处理器。

比如下面这个处理器就将压缩设置改为 8bit，90% 质量。

```swift
class AppleProRawCustomizer: NSObject, AVCapturePhotoFileDataRepresentationCustomizer {
    func replacementAppleProRAWCompressionSettings(for photo: AVCapturePhoto,
                                                   defaultSettings: [String : Any],
                                                   maximumBitDepth: Int
    ) -> [String : Any] {
        [
            AVVideoAppleProRAWBitDepthKey: min(8, maximumBitDepth),
            AVVideoQualityKey: 0.9,
        ]
    }
}

// 将回调方法中获取 DNG 数据的方法改写
let data = photo.fileDataRepresentation(with: AppleProRawCustomizer()) 
```

## Photokit 保存和获取

保存 ProRaw 到相册和普通的照片没有任何区别，都是使用 PhotoKit 的 `PHAssetCreationRequest`。

iOS 15 的 `PHAssetCollectionSubtype` 新增了枚举类型 `smartAlbumRAW`，以便开发者 `fetchAssetCollections` 时可以指定直接查询 RAW 的 `PHAssetCollection`。

### 处理 Raw 格式的 PHAssetResource

Raw 的 `PHAsset` 可能有 `alternatePhoto` 类型的 `PHAssetResource`。

这是由于某些资源可能是从单反相机拷贝来的，有些单反相机拍摄的 Raw 资源包含了 JPEG 和加上 Raw。

![截屏2021-06-27 下午9.37.17](https://images.xiaozhuanlan.com/photo/2021/1e6df574596c41b486780634c64d04a7.png)

这会导致文件占用空间增加，可移植性降低，并且可能会导致用户体验混乱。

ProRaw 不建议以这种方式存储，而是建议通过上文拍摄时设置，将全尺寸的 JPEG 预览图嵌入进 DNG 文件中。

因此完整的 `PHAssetResource` 处理如下：

```swift
let resources = PHAssetResource.assetResources(for: asset)
for resource in resources {
  	// 过滤类型
    if resource.type == .photo || resource.type == .alternatePhoto {
      	// 过滤通用类型标识符
        if let resourceUTType = UTType(resource.uniformTypeIdentifier),
           resourceUTType.conforms(to: .rawImage) {
            let resourceManager = PHAssetResourceManager.default().requestData(for: resource, options: nil) { data in
                    
            } completionHandler: { error in
                    
            }
        }
    }
}
```

## CoreImage 处理和展示

### 生成 CIImage

```swift
// iOS 15 以前
// 获取预览图片
let isrc = CGImageSourceCreateWithURL(url as CFURL, nil)!
let cgImage = CGImageSourceCreateThumbnailAtIndex(isrc, 0, nil)!
return CIImage(cgImage: cgImage)

// 获取某个语义分割蒙板图片
return CIImage(contentsOf: url, options: [.auxiliarySemanticSegmentationSkinMatte : true])

// 如果只需要用来展示，不修改
return CIImage(contentsOf: url, options: nil)

// 需要编辑
let rawFilter = CIFilter(imageURL: url, options: nil)
return rawFilter?.outputImage

// iOS 15 新增
// 获取预览图片
let filter = CIRAWFilter(imageURL: url)
return filter?.previewImage

// 获取某个予以分割蒙版图片
return filter?.semanticSegmentationSkinMatte
```

### 应用常用调整

```swift
// iOS 15 以前
func getAdjustedRawImage(url: URL) -> CIImage? {
    let rawFilter = CIFilter(imageURL: url, options: nil)
    
  	// 设置对应的 key/value 值
    rawFilter?.setValue(value, forKey: CIRAWFilterOption.key.rawValue)
    
    return rawFilter?.outputImage
}

// iOS 15 新增
func getAdjustedRawImage(url: URL) -> CIImage? {
    let rawFilter = CIRAWFilter(imageURL: url)
    
 		// 设置对应 key 名字的属性为 value 值，强类型，更 Swift
    rawFilter?.key = value
    
    return rawFilter?.outputImage
}
```

比如设置不同的 `localToneMapAmount`。

<img src="qvf5ynk5g.bkt.clouddn.com/mweb/03.png" alt="截屏2021-06-27 下午10.56.02" style="zoom:50%;" />

<img src="qvf5ynk5g.bkt.clouddn.com/mweb/04.png" alt="截屏2021-06-27 下午10.56.50" style="zoom:50%;" />

<img src="qvf5ynk5g.bkt.clouddn.com/mweb/05.png" alt="截屏2021-06-27 下午10.57.00" style="zoom:50%;" />

### 获得线性 Scene-Referred 图

```swift
// 将调整全部设置为默认值
rawFilter.baselineExposure = 0
rawFilter.shadowBias = 0
rawFilter.boostAmount = 0
rawFilter.localToneMapAmount = 0
rawFilter.isGamutMappingEnabled = false
// 此时获取的 outputImage 就是未经处理的线性图
let linearRawImage = rawFilter.outputImage
```

这个线性图可以设置为其他 `CIFilter` 上的输入，来对 Scene-Referred 图进行计算，也可以使用它进行渲染。

![截屏2021-06-27 下午11.22.23](https://images.xiaozhuanlan.com/photo/2021/fbb1de375ff0064eed0d86ae2c825a28.png)

可以看到，左边是默认输出，左边太阳部分和右边天空亮度差异比较小，而线性图的差异就大了不少，更符合真实的明暗关系（真实的差异还要比记录的信息大得多），而这也给后期调整保留了更多的信息，有更大的调整空间。

### 保存成其他文件格式

```swift
// iOS 15 以前
try ciContext.writeHEIFRepresentation(of: rawFilter.outputImage!,
                                      to: url,
                                      format: .RGBA8,
                                      colorSpace: .init(name: CGColorSpace.displayP3)!,
                                      options: [:])

// iOS 15 新增，可以支持保存成 10bit 的 HEIC
try ciContext.writeHEIF10Representation(of: rawFilter.outputImage!,
                                        to: url,
                                        colorSpace: .init(name: CGColorSpace.displayP3)!,
                                        options: [:])
```

### 以 [EDR](https://developer.apple.com/videos/play/wwdc2021/10161/) 显示在 Mac 上

默认情况下 `CIRawFilter` 的输出是 SDR 的，需要通过一些选项设置，就能以 EDR 的方式输出。

推荐使用 MetalKit 的 `MTKView` 来显示 ProRaw 的 `CIImage`。

> 使用 CoreImage 渲染最佳实践可以参考 WWDC2020 - [Optimize the Core Image pipeline for your video app](https://developer.apple.com/videos/play/wwdc2020/10008/)

```swift
// 在 MTKView 初始化的时候设置以下参数
colorPixelFormat = MTLPixelFormat.rgba16Float
if let caml = layer as? CAMetalLayer {
	caml.wantsExtendedDynamicRangeContent = true
}

// 在 CIRawFilter 渲染的时候设置以下参数
rawFilter?.extendedDynamicRangeAmount = 1.0
```
![](https://images.xiaozhuanlan.com/photo/2021/6df545e08fe9ea36a20f640e1ee6a2f9.png)

![](qvf5ynk5g.bkt.clouddn.com/mweb/08.png)

## 总结

ProRAW 从实现上看，走得并不是完全类似专业单反的原始信息 Raw 的道路，而是通过 Apple 非常擅长的计算摄影流程，给用户带来媲美 Raw 的高动态范围和丰富的原始色彩信息，同时又能配合软硬件的 Apple 生态产物。iOS 15 上 ProRaw 的全流程开发支持，也意味着对于音视频/图像编辑领域等 SDK 开发者，需要提前对行业头部推出的标准进行熟悉和适配，才能带给用户完整的用户体验。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
