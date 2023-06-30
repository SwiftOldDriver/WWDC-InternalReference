---
session_ids: [10105]
---

# Session 10105 - 打造响应更快的相机体验

本文基于[Session 10105](https://developer.apple.com/videos/play/wwdc2023/10105/)梳理

## 背景

iOS 13 开始，通过设置 `AVCapturePhotoQualityPrioritization` 来调整获取图片的质量和速度，假如我们希望获取质量最高的图片，可以设置为 `.quality`。

```swift
// Constants indicating how photo quality should be prioritized against speed.
@available(iOS 13.0, *)
public enum QualityPrioritization : Int, @unchecked Sendable {
    
    case speed = 1
    
    case balanced = 2
    
    case quality = 3 
}
```

`.balanced` 和 `.quality` 这两个选项，会对图片进行多帧融合和降噪处理，在 iPhone 11 Pro 及更新的型号上会应用一项最新的技术叫 `Deep Fusion`，这所有的处理都需要耗时，而且必须在下一次拍照之前处理完成，也就是说如果未处理完成，下一次的拍摄将无法真实执行。
   1. 简单解释下 `Deep Fusion`
   2. Deep Fusion 是苹果在 iPhone 11 系列引入的一项图像处理技术。它利用人工智能和机器学习，将多张不同曝光度和焦距的照片融合在一起，产生一张高质量的合成照片

这就导致了想要高质量的图片，必须放弃速度，甚至需要更长时间的等待。
而 iOS 17 新增了 API，让我们能够保证图片质量的同时，也无需长时间等待，加快拍摄响应速度，降低拍摄间隔时间。

## Deferred Photo Processing 延迟图片处理

### 原有的拍摄流程

![image.png](./images/line.png)

首先我们梳理下拍摄的整体流程，点击拍摄后，调用系统的拍摄方法 `open func capturePhoto(with settings: AVCapturePhotoSettings, delegate: AVCapturePhotoCaptureDelegate)`

通过代理我们依次收到  `Monitor Capture Progress` -> `Receiving Capture Results`，直到最后的 `didFinishProcessingPhoto`，这也是整个图片从拍摄到处理的流程，最后才会真正生成可用的图片

这期间，哪怕再次调用了拍摄方法，也不会生效，只有等待上一张图片处理完成，才会进行下一轮的图片拍摄 + 图片处理

### 优化后的流程
iOS 17 之后，我们可以开启延迟图片处理，整体的时间线都会缩短

新增了一个 `Proxy Photo` 临时照片的概念，主要作用是加快相机的拍照速度和延迟真实照片处理。
> 通过生成 Proxy Photo，相机无需等待高质量照片处理完成就可以进行下一张照片的拍摄，大大缩短了拍照间隔，提高了相机捕获速度。同时，真实照片的处理被延迟至相机会话结束后在后台自动完成，避免拍照时的内存峰值过高被系统强杀。
> 除速度外，Proxy Photo 还具有提供预览和暂时占位的辅助作用。它可以让用户提前看到拍摄内容，但由于清晰度较差，最终仍需要被高质量真实照片替换。它也可以临时占位并存储在相册中，等待真实照片到来，让用户在最终结果到达前有所参考。

当我们点击拍摄，调用系统方法后，**条件符合下**我们会提前收到一个新的代理方法 `didFinishCapturingDeferredPhotoProxy`，通过该代理我们可以获取前面提到的 Proxy Photo，这时候就可以开始下一轮的拍摄，无需等待图片处理流程

最后的图片处理流程会在相机会话结束之后由系统来自动处理，一般是在两个时间点：
![image.png](./images/time.png)
  1. 你从相册中请求图片时按需处理，可能会导致请求图片时耗时增加
  2. 系统自己觉得条件符合就在后台进行处理，比如系统空闲时


当然我们也可以像之前一样在 `didFinishProcessingPhoto` 中获取最终的图片
对比看下效果：
    
![](./images/camera.gif)![](./images/camera_new.gif) .
    
### 代码实现：
首先需要启动延迟图片处理，启动后，我们才会收到新的代理方法，通过 Proxy 对象可以拿到延迟处理的图片数据，建议立刻存储到相册中，一方面可以降低数据丢失的风险，另一方面可以降低内存峰值，避免后台被系统强杀。
![image.png](./images/code1.png)
![image.png](./images/code2.png)
我们可以通过现有的方法获取相册中的 Proxy Photo，前提是要设置 option `allowSecondaryDegradedImage` 属性，
![image.png](./images/code3.png)
特别注意：该方法默认是异步的，**resultHandler block more than once**，通过 `PHImageResultsDegradedKey`来判断返回的是临时的模糊图片还是最终的高质量图片，更多详细信息看[这里](https://developer.apple.com/documentation/photokit/phimagemanager/1616964-requestimage)
最终拿到的图片如下：
Initial 是旧版本 `PHImageResultsDegradedKey` 对应的图片，
New Secondary 是新版本下 `PHImageResultsDegradedKey` 对应的图片，
Final 高质量的清晰大图
![image.png](./images/proxyPhoto.gif)

### 小结：
1. 首先不是所有的照片都适合延迟处理，延迟照片处理是系统自动的，如果系统觉得不合适，它并不会生成临时的 Proxy Photo，而是跟旧版本一样，只会生成最终的图片。因此如果我们开启了 `isAutoDeferredPhotoProcessingEnabled`，两个代理方法我们都要做兼容处理
2. 延迟照片处理适合追求高质量连拍和后期处理的场景，但如果立即获取和分享图像更重要，则不太适用
3. 该功能仅支持 iPhone 11 Pro 及以上

## Zero Shutter Lag 快门零延迟

不知道大家是否有过疑问，为啥我拍摄后的照片总比我拍摄的时候要慢很多，尤其是在拍摄跳跃的时候，在跳起来的时候我点了拍摄，最后生成的图片都是落到地上的图片。也就是相机为什么都做不到零延迟？

当我们点击相机的拍摄按钮时，相机需要一定的时间来完成实际的拍摄和处理。具体来说：
1. 相机首先需要从图像传感器读取数据并生成图像帧，这需要一定时间；
2. 相机还需要对获取的图像帧应用各种处理，如滤光、白平衡调整、锐化等，这也需要时间；
3. 如果相机每秒采集30帧，那么每帧图像在屏幕上仅停留33毫秒。尽管看起来时间很短，但考虑到拍照对象的移动速度，这极有可能导致拍照时实物位置与最终照片中的位置有一定偏差，使照片出现模糊。（想起来当年婚纱照的时候，师傅经常说不要动，保持住微笑😊）

所以，当我们迅速点击拍照时，动作很快就结束了，但相机从读取图像到最终生成照片，实际上需要一定时间。这段时间差 frequently 会造成拍摄对象在画面中的位置和状态已经发生变化，导致拍出的照片与我们点击瞬间所见有一定差异，这就是快门延迟导致的问题。

iOS 17 提供了一个 API 可以开启 "零延迟模式" ，当开启时，相机的图像管道会保持之前的帧作为缓冲区。这样在我们点击拍摄时，相机就可以直接从缓冲区中读取最近的一个帧，然后对其进行处理以生成我们想要的照片。效果对比如下：
![lag](./images/lag.gif)![lag](./images/lag_new.gif) 
代码上怎么来实现呢？ So easy! 
![image.png](./images/zero.png)
注意：并不是所有的场景都支持快门零延迟，
![image.png](./images/zero2.png)
1. 闪光灯拍照需要时间充电和同步，难以零延迟。
2. 手动曝光和对焦需要用户手动设置、相机测光和镜头调整，需要一定时间，会有延迟。
3. 连拍和多相机同步拍摄，需要多个图像传感器和处理器协同工作，时间较长，延迟较大。
4. 相机设有图像缓冲区，需要从缓冲区读取最新的图像数据进行处理和存储，如果捕捉手势与真正拍照设置之间的延迟过长，会引入图像模糊等问题。
5. 因此在我们点击相机按钮和调用 capturePhoto API 之间代码越少越好

## New Responsive Capture 新的响应捕获

![](./images/change.gif)

通过设置 `isResponsiveCaptureSupported` 和 `isResponsiveCaptureEnabled` 来启用响应捕获，同时打开上述的`isZeroShutterLagEnabled`，可以获得重叠的响应捕获，这样就可以在同一时间内拍摄更多照片，提高捕捉完美时刻的机会

照片拍摄会从线性的执行调整为并行执行，以提供更快更连贯的连续拍摄。但是这会增加内存峰值，同时代理回调顺序也会紊乱，比如在第一张图片`didFinishProcessingPhoto` 回调之前，可能发生了多次 `willBeginCaptureFor`  因此我们必须要兼容处理照片的回调

之前我们只能通过去设置 -> 相机 -> 优先快速拍摄，iOS 17 之后我们可以通过设置 `isFastCapturePrioritizationSupported` 和 `isFastCapturePrioritizationEnabled` 来控制它的开关。开启之后，如果相机检测到在短时间内连续拍摄了多张照片，会相应地将照片质量从最高质量设置调整为更“平衡”的质量设置，以保持连拍时间间隔

![](./images/capture.gif)

### 拍摄状态

前面我们提到过旧版本图片不处理完成，哪怕重复调用拍摄 API，也不会生效，为了保证更好的用户体验，iOS 17 给我们提供了监听拍摄状态的 API，便于我们管理按钮的状态![image.png](./images/state1.png)

状态分别为：未运行、就绪、未就绪、等待捕获、等待处理，根据前面的描述我们了解到，在后面三种状态下，调用 `capturePhoto`，在拍摄和拿到图片之间会需要等待更长时间，因此在 not ready 下，强烈建议禁用按钮的交互事件，避免用户长时间的等待。

代码实现如下： 
![image.png](./images/state2.png)![image.png](./images/state3.png)

## Video Effects 视频效果
> 注：该小点虽然在 session 内，但和本文主要讲述的对象无关，因此简略带过

以前，macOS 的控制中心提供了人像、工作室灯光等相机功能。在 macOS Sonoma 中，视频效果从控制中心移至单独菜单。我们可以在相机或屏幕共享预览中启用人像、工作室灯光等视频效果，同时支持调整。

iOS 17 新增 `Reactions` 效果类型，在视频通话中表达想法或竖起大拇指，`Reactions` 将视频与气球、彩纸等混合，但不会影响到演讲者。`Reactions` 遵循人像和工作室灯光效果模板，系统级相机功能，无需应用代码更改。
![](./images/video.gif)

总的来说，新视频效果的 `Reactions` 特性为视频通话体验带来更丰富的互动，但也提出更高要求，需要开发者妥善处理，更多细节可以看 session 最后一小节和 2021 session [What's new in camera capture](https://developer.apple.com/videos/play/wwdc2021/10047/)

## 总结

1. 延迟图片处理可以生成 Proxy 临时照片，让下一张照片的拍摄不再需要等待上一张图片的处理完成,从而加快拍摄速度，减少拍摄间隔。
2. 快门零延迟通过维持图像帧缓冲区读取历史帧实现，能在我们点击拍摄瞬间近乎零延迟地捕获照片。
3. 响应捕获通过并行执行拍摄任务，快速连续拍多张照片，以获取更多完美时刻。
4. 可以通过监听拍摄状态来管理拍摄按钮，避免用户长时间等待。
5. 总之，通过延迟图片处理、快门零延迟、响应捕获等新特性，以及状态监听等措施，能大幅提高相机响应速度，创造更流畅的拍摄体验。

## 参考资料

1. [Create a more responsive camera experience](https://developer.apple.com/videos/play/wwdc2023/10105/)
2. [What's new in camera capture](https://developer.apple.com/videos/play/wwdc2021/10047/)
3. [Handle the Limited Photos Library in your app](https://developer.apple.com/videos/play/wwdc2020/10641)
