---
session_ids: [10122]
---
# Session 10122 - 探索新的媒体格式和工具

本文是根据 [Explore media formats for the web](https://developer.apple.com/videos/play/wwdc2023/10122/) 进行撰写，旨在探索现代的图片和视频格式以及他们在 Web 中的应用。

![文章架构](./images/文章架构.png)本文将介绍 Safari 支持的媒体格式，包括图像和视频，并介绍了 Safari 17 中的新技术。文章还会讨论网站视频演变历程和最新技术 Managed Media Source API，实现自适应流媒体视频，提供更好的控制和更高效的性能。

## 图像格式

多年以来，GIF、JPEG 和 PNG 等图像格式一直是互联网上最常用的图像格式。这些格式被广泛支持，可以在各种设备和浏览器上显示。然而，随着技术的不断进步，出现了新的更出色的图像格式，这些技术能够提供更好的视觉体验。

![](./images/image_summary.png)

接下来让我们简单的了解一下这些图像格式。

### 传统

作为被广泛使用的图像格式，GIF、JPEG 和 PNG 都拥有悠久的历史。

#### GIF

![](./images/gif.png)

GIF 是 36 年前引入的图像格式，最适合在简单动画、模因和社交媒体内容中使用。它一次只支持 8 位颜色，因为它是一种无损格式，文件大小可能会很大，这使它不太适合较大的动画。

#### JPEG

![](./images/jpeg.png)

JPEG 同样也是在 30 多年前引入的图像格式。JPEG 有一种很好的特性是渐进式加载，可以在完全加载之前看到部分图像，在网络速度不是特别快的时候特别方便。它最适合用于照片和其他具有大量颜色和细节的图像。它是一种有损格式，这意味着在压缩过程中会丢失一些图像数据。压缩还允许更小的文件大小和更快的加载时间。

#### PNG

![](./images/png.png)

由于 GIF 存在诸多限制，于是有了 PNG。PNG 支持透明度，这使它们在叠加图像上很有用。PNG 在设计之初其实是为了替代 GIF，并且支持动画，不过我们并没有在实际应用中看到过对应的动画应用。PNG 是一种有损格式，这意味着在压缩过程中会丢失一些图像数据不过这将带来更小的文件大小和更快的加载时间。

### 现代

除了上述三种传统的图像格式，还有另外四种更为现代的图像格式，包括 WebP、JPEG-XL、AVIF 和 HIEC/HEIF，其中一些将在 Safari 17 首次得到支持。

#### WebP

![](./images/webp.png)

WebP 是一种现代图像格式，使用先进的压缩算法实现更小的文件大小，而不会牺牲图像质量。它已被添加到 Safari 14 和 macOS Big Sur 中，有助于改善网站性能和加载时间，并可以用于动画。WebP 旨在替代传统的三种图像格式。WebP 无损图像文件平均比 PNG 小 26%。这些图像文件还支持透明度（也称为 Alpha 通道），只需增加 22%的字节成本。而与 JPEG 相比 WebP 的平均文件大小可减小 25％-34％，提供了显著的压缩改进。这种格式为图像提供了优秀的无损和有损压缩。使用 WebP，开发人员可以创建更小、更丰富的图像。

#### JPEG-XL

![](./images/jpegxl.png)

WebP 确实很好，但是 AVIF 和 [JPEG XL](https://jpeg.org/jpegxl/index.html)皆旨在取代 WebP。Safari 17 中令人兴奋的新功能之一是支持 JPEG-XL，这是一种旨在提供高压缩率和图像质量的新图像格式。JPEG-XL 使用一种称为“模块熵编码”的新压缩算法，允许更大的灵活性来调整压缩比。它非常适合可能通过缓慢的连接提供的图像，例如 JPEG，因此用户可以在完全加载整个图像之前看到一些内容。JPEG-XL 的一个关键特性是，你可以无损转换，也就是说，从现有的 JPEG 文件转换到 JPEG-XL 不会发生任何数据丢失，同时将它们的大小显著减小高达 60％。

> JPEG-XL 是一个相对较新的格式，目前被支持的服务器寥寥无几。基于[Can I Use](https://caniuse.com/?search=image%2Favi%27f) 上的数据，目前看，除了 Safari 17 都不再支持。Chrome 在去年停止了对这种新图像格式的支持。

#### AVIF

![](./images/avif.png)

AVIF 是基于[AV1 视频格式](https://caniuse.com/av1)的一种现代图像格式，使用 AV1 视频编解码器实现高压缩比而不牺牲图像质量。它在所有浏览器上得到广泛支持，非常适合实时照片，并支持高达 12 位的色深。AVIF 支持有损和无损压缩，这种多功能性使得 AVIF 在文件大小方面具有优势。虽然 PNG 仍然是最好的无损压缩格式，但 AVIF 是一种出色的替代品，特别适用于需要采用有损压缩以减小文件大小的情况。AVIF 支持并行处理和动画，但不支持渐进式渲染。相比 JPEG，AVIF 更适合图像压缩，可以比 JPEG 小十倍。

#### HEIC/HEIF

HEIC 是基于[HEVC 视频格式](https://caniuse.com/hevc)的现代图像格式。Safari 17 增加了对 HEIC（也称为 HEIF）的支持，这是一种使用 HEVC 压缩算法实现小文件大小的图像格式，适用于 iPhone 和 iPad。在 WKWebView 中使用 HEIC 可以进行硬件加速和高效渲染，但需要注意 HEIC 现代图像格式不受所有浏览器和操作系统的支持。

> 如果你的应用支持 iOS 11 及以上，你可以尝试使用 HEIC 格式的图片来替代原本的 PNG 和 JEPG 格式的图片。这可能是 iOS 上图片使用的[最佳实践](https://cloudinary.com/blog/the_best_image_format_for_mobile_app)。

### 现代媒体格式和工具的应用

JPEG-XL、AVIF 和 HEIC 都具有一个重要的优势，即它们支持广色域和 HDR。广色域可以在文件中保留更多的颜色，并在屏幕上呈现更多的颜色，而 HDR 可以更好地定义黑暗的深度、亮度的强度以及可接受的光线量。这意味着您可以在户外场景中获得更多的活力，或在具有大量对比度的非常明亮的场景中获得更好的效果，或者在呈现美丽而复杂的肤色时获得更完美的效果。

为了可以在不支持这些格式的浏览器上提供正确格式。你可以使用 HTML 中的 `picture` 元素指定备用源，允许浏览器选择它支持的格式。你可以提供多个备用源，浏览器将按顺序查看可用格式列表，并优先使用最佳性能的格式。这样，你可以为人们提供正确的格式，让浏览器来选择，而不需要代码判断。

```html
<picture>
  <source srcset="images/large/sophie.heic" type="image/heic">
  <source srcset="images/large/sophie.jxl" type="image/jxl">
  <source srcset="images/large/sophie.avif" type="image/avif">
  <img src="images/large/sophie.jpeg">
</picture>
```

## 视频（流媒体）

现在我们已经了解了可以使用的现代图像格式以及何时使用它们，让我们来看看视频，特别是自适应流媒体视频。视频在网站上的呈现方式的演变是一个引人入胜的过程，从网络早期开始，它已经走了很长的路。

### 流媒体技术：HLS vs MSE

随着移动设备的兴起，需要新技术来适应不同的屏幕大小和方向，苹果于 2009 年推出了 [HTTP Live Streaming](https://developer.apple.com/streaming/)，通过将视频内容分成小的块或片段，支持自适应比特率流媒体。HLS 允许根据用户的互联网连接速度和设备功能提供最佳的视频质量。但是到今天只有 Safari 支持它。

![](./images/hls.png)

但是如果想在其他浏览器上支持多端播放，你就只能选择 W3C 发布的[Media Source Extensions（MSE）](https://w3c.github.io/media-source/)。MSE 引入了对[MPEG-DASH](https://www.iso.org/standard/75485.html)媒体流的支持，通过扩展视频和音频元素，无需使用其他插件就可以动态更改媒体流。这提供了自适应媒体流、实时流媒体、视频切割和视频编辑等功能。

虽然 Apple 在 Safari 8 上支持了 MSE，但仅限在 PC 端。这是因为 MSE 存在一些缺点。它在管理缓冲区级别、网络访问的时间和数量以及媒体变体选择方面并不出色。这些缺点在相对强大的设备上，如现代计算机上基本上不会产生问题。但在移动设备上的功耗比 HLS 本地播放器高得多，因此 MSE 并未在 iPhone 上被支持，因为我们无法通过 MSE 实现所需的节电效果。通过对各种网站的所有测试都表明，启用 MSE 将损耗电池寿命。

因为 MSE 需要通过 JavaScript 控制媒体流的加载和播放，所以它会带来更多的资源消耗。具体来说，MSE 需要在客户端使用 JavaScript 解析媒体流，并将其分段缓存，这就需要更多的 CPU 和内存资源。同时，MSE 还需要与浏览器的媒体播放器进行交互，这也会带来额外的开销。

> B 站开源的 [flv.js](https://github.com/bilibili/flv.js) 就是基于 MSE。

### 兼而得之的 Managed Media Source

有没有什么方法能既保留 MSE 的灵活又能兼具 HLS 的效率呢？答案是有的，它就是 Managed Media Source (MMS) API。

MMS 是一个将更多对 MediaSource 及其相关对象的控制权交给浏览器的 MediaSource。它能更容易支持在能力受限制的设备上进行流媒体播放，同时允许`user-agent`对可用内存和网络能力的变化做出反应。相较于旧版 MSE，MMS 有以下几个区别：它可以通过告诉网页何时是缓冲更多媒体数据的好时间来减少功耗，允许蜂窝调制解调器进入低功耗状态更长的时间，从而增加电池寿命，智能清除未使用或被丢弃的缓冲内存，使页面更有效，跟踪缓冲区何时应该开始和停止，使页面检测低缓冲区和完整缓冲区状态的工作变得更加容易。MMS 可以通过 5G 调制解调器发送媒体请求，使得你的网站可以使用快速的 5G 网络快速加载媒体数据，同时对电源使用的影响最小。如果需要播放实时演出，MMS 将自动检测并切换到 LTE 或 4G（如果可用），以延长电池寿命。用户仍然可以控制每个分段的分辨率、下载方式和来源。

通过 MMS，可以节省带宽和电池寿命，让用户在苹果设备上能够更长时间的观看视频。

#### 从 MSE 到 MMS

从 MSE 迁移到 MMS 非常容易，只需要几个步骤。现在我们来简单介绍一下，正如前文所说，MSE 需要在客户端使用 JavaScript 解析媒体流，我们需要创建一个 `js` 文件，并在其中添加一个`runWithMSE` 方法，`runWithMSE`函数等待页面加载，创建视频元素，并将其附加到 MediaSource 对象上，最后将其附加到 HTML 的 `video` 元素上。

```js
function runWithMSE(testFunction, id = 'log') {
    window.onload = function () {
      var ms = new MediaSource();

      var el = document.createElement("video");
      el.src = URL.createObjectURL(ms);
      el.preload = "auto";

      document.body.appendChild(el);

      testFunction(ms, el);
    };
}
```

我们有两种方法来进行处理，一种是：首先需要确保 MMS 可用，然后将任何对 MediaSource 的调用替换为 ManagedMediaSource 本身。

```javascript
// 确保 Managed Media Source 可用
function isMMSAvailable() {
  return !!document.ManagedMediaSource;
}

function runWithMSE(testFunction, id = 'log') {
    window.onload = function () {
      var ms = isMMSAvailable() ? new ManagedMediaSource() : new MediaSource();
      ...
    };
}
```

另一种更容易的方法是将 MediaSource 覆盖为 ManagedMediaSource。定义一个名为`getMediaSource()`的方法，并将其设置为`MediaSource`。

```javascript
function getMediaSource() {
  return self.ManagedMediaSource || self.MediaSource;
}
//
const MediaSource = getMediaSource();

function runWithMSE(testFunction, id = 'log') {
    window.onload = function () {
      var ms = new MediaSource();
      ...
    };
}
```

然后我们在`html`文件中调用这个函数：

```js
runwithMSE(async function (source, video) {
  video.controls = true;
  await once(source, 'sourceopen');
  var videosb = source.addSourceBuffer('video/mp4; codecs="mp4a.40.2,avc1.4d4015"');

  source.onstartstreaming = async () => {
    await loadData(videosb);
    source.end0fStream();
    await once(source, 'sourceended');
    await video.play();
  };
  source.onendstreaming = () => {
    // do what you need to do here:
  };
  videos.onbufferedchange = () => {
    // Here check which data was evicted from the source buffer.
  };
});
```

`startstreaming` 将通知播放器应该开始获取新内容并将其添加到托管 `sourceBuffer` 中。同时，还需要处理`endstreaming`，以告知播放器在何时需要停止获取新数据。现在`user-agent`已确定它具有了足够的数据，且可以进入低功耗模式。在上述代码中，`endstreaming`事件处理程序只是一个占位符。与 MSE 不同，你的`sourceBuffer` 可能随时删除内容，而不仅仅是在附加数据时。对于 MSE 而言，除了在附加新数据时增加缓冲范围，而且需要定期检查缓冲区是否需要增加。否则，这将导致播放停顿，这与 MSE 规范不符。因此，还需要添加一个`bufferedchange`事件处理程序，需要检查哪些数据被删除。因此，你还需要添加一个`bufferedchange`事件来处理这个场景，处理那些已从源缓冲区中删除的数据。遵循 MMS API 的规范，只在需要时附加数据，可提高用户体验和电池寿命。当然，如果你只关心苹果设备上的体验，使用 HLS 是不二选择。

#### 让视频 AirPlay

![](./images/multi-client.png)

使用 HLS 的另一个好处是支持 [AirPlay](https://developer.apple.com/airplay/)。使用支持 AirPlay 的媒体播放器 API，你可以让用户将视频/音频从他们的苹果设备扩展到 Apple TV、HomePod 或支持 AirPlay 的扬声器或智能电视，从而丰富你的应用程序。如果你也有这个需求，想让自己的流媒体能够在 Safari 中使用本机 HLS 支持的 AirPlay，那么我们继续。

需要明确的是，AirPlay 需要一个 URL，而 MSE 只能提供视频片段。那么只要视频资源能提供 AirPlay 所需的 HLS 视频流，那么就可以使用 AirPlay。我们可以像图片资源一样，为 `video` 元素提供一个备用资源，使其支持 AirPlay。

```js
// Supporting AirPlay
const videoSource1 = document.createElement('source');
videoSourcel.type = 'video/mp4';
videoSource1.src = URL.createObjectURL(mediasource);
video.appendChild(videoSource1);

const videoSource2 = document.createElement('source');
videoSource2.type = 'application/x-mpegURL';
videoSource2.sr = "http: //devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8";
video.appendChild(videoSource2);
```

Safari 会自动给这个视频资源添加 AirPlay 图标并允许用户 AirPlay 视频。然而，你需要为每个视频资源都提供一个备用资源，并且在创建 `video` 元素时添加备用资源。这种做法似乎有些繁琐。一个简单的方法是使用[HLS.js](https://github.com/video-dev/hls.js/)进行视频播放。HLS.js 是一个 JavaScript 库，它实现了 HLS 客户端，依赖于 HTML5 视频和 MediaSource 扩展进行播放。它通过将 MPEG-2 传输流和 AAC/MP3 流转换为 ISO BMFF（MP4）片段来工作。当在浏览器中可用时，使用 Web Worker 异步执行转换。此外，HLS.js 还支持 HLS + fmp4。

如何使用 HLS.js 创建播放器完全取决于你的需求。是优先使用本地 HLS 还是优先使用 HLS.js 提供的能力，由你决定！

```js
<video id="video"></video>
<script>
  var video = document.getElementById('video');
  var videoSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  //
  // First check for native browser HLS support
  //
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = videoSrc;
  } else if (Hls.isSupported()) {
    //
    // If no native HLS support, check if HLS.js is supported
    //
    var hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
  }
</script>
```

##### 注意

为了保证用户的体验一致性，当你准备为视频资源支持 MMS 时，必须提供 AirPlay 源替代方案。如果没有提供替代方案，你必须通过 Remote Playback API 在媒体元素上显式禁用 AirPlay，即调用 disableRemotePlayback。

![](./images/airplay.png)

## 总结

确实，当今的互联网已经成为了一个以视觉为主的世界，大量的图片和视频被用于网站、社交媒体、广告等各种应用中。然而，传统的媒体格式，如 JPEG 和 PNG 等，存在着一些问题，例如文件大小过大、加载速度过慢、图片和视频质量不佳等。这些问题会影响用户体验和网站性能，使得网站变得缓慢和不稳定。

为了解决这些问题，开发者应该将目光投入到新的技术上。例如，JPEG-XL、AVIF 和 HEIC 等现代的图片和视频格式可以在保证高质量的同时，显著减少文件大小，从而提高加载速度和网站性能。除此之外，一些新的 Web 技术也可以帮助开发者更好地管理和优化媒体文件的加载和显示，从而提高用户体验和网站性能。
