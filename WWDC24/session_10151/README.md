---
session_ids: [10151]
---

# WWDC24 10151 - SwiftUI 过渡效果篇

视觉效果在应用的使用和感知中起着至关重要的作用，优质的应用注重创建丰富的视觉效果，以提升其表达力和用户体验。SwiftUI 近两年在视觉效果上下足了功夫，去年[《SwiftUI 动画篇》][SwiftUI_Animation] 详述了如何利用动画机制创建令人印象深刻的视觉效果。今年，我们重点来详述一下 SwiftUI 提供的另一种创建视觉效果的机制：过渡效果 (SwiftUI Transition)。


## 过渡效果简介

过渡效果，也叫过渡动画，是指在用户界面中视图元素从一种状态转变到另一种状态时所采用的动画效果。它可以在视图被插入（显示）或移除（隐藏）时，为用户提供视觉上的平滑过渡，从而使界面变得更为动态和富有吸引力。过渡效果的主要目的是提升用户体验，通过更自然的视觉变化让用户能够更轻松地理解界面状态的变化。

### 过渡效果的主要特性

- 平滑性：过渡效果可以使视图元素在显示或隐藏时以平滑的方式进行过渡，避免突然出现或消失，减少视觉上的突兀感。
- 视觉反馈：通过动画效果，用户可以获得视觉反馈，对视图状态的变化有更清晰的认知。例如，当一个新视图或一个警告框淡入时，用户能够清晰地注意到它们。
- 增强用户体验：有助于使应用的界面更具互动性和生机，提高整体用户体验。

### 过渡效果的使用场景

过渡效果在应用开发中广泛用于以下场景，以提升用户体验和界面动态感：

- 视图显隐：显示或隐藏模态视图和对话框时使用淡入淡出效果；在导航栈中切换视图时使用滑动效果。
- 内容变化：数据刷新、状态更新时使用动画过渡，例如列表项的插入和删除。
- 控件状态：表单控件状态变化时提供反馈，比如按钮点击、输入框获取焦点等。
- 提示与通知：显示或隐藏通知栏、工具提示时使用滑动或淡入淡出效果。
- 动态界面：切换布局（如列表视图到网格视图）或显示菜单时使用平滑的过渡效果。

### SwiftUI 提供的过渡效果机制

具体到 SwiftUI，过渡效果处理视图在添加到和移除出视图层次结构时所产生的变化。当试图在从无到有，或者从有到无这两种状态之间变化时，SwiftUI 插值中间的状态，这和动画机制一模一样。过渡效果可以看成一种特殊的动画。SwiftUI 提供了以下三种方式来实现过渡效果：

- AnyTransition 结构（A type-erased transition): iOS 13.0+
- Transition 协议：iOS 17.0+
- 含有 `transition` 的修饰符，例如: `.transition`, `.scrollTransition`, `.navigationTransition`, `.contentTransition` 等。

SwiftUI 的过渡效果接口随着动画机制的进化而不断发展，从 iOS 13.0+ 和动画一同引入开始，到 iOS 17.0+ 日益完善。

## AnyTransition 结构

AnyTransition 虽然在早期被引入，但是功能依然强大。

### AnyTransition 基本用法

仅使用 `.transition` 是没有过渡效果的，需要和 `.animation` 配合使用。

![Slide 动画截图]()

要想使过渡生效，需要以下三步：

1. 使用 `.transition` 指定一种过渡效果
2. 保证过渡试图从无到有，或者从有到无变化
3. 关联动画

```swift
#Preview("Basic Usage of AnyTransition") {
    @Previewable @State var toggle: Bool = false
    VStack {
        if toggle { // 2.
            Text("Hello, SwiftUI Transition!")
                .padding()
                .background(.pink)
                .transition(AnyTransition.slide) // 1.
        }
    }
    .animation(.linear, value: toggle) // 3.
    .onAppear {
        toggle = true // 2.
    }
}
```

`AnyTransition` 提供了一些默认的过渡效果，包括：

- .slide：视图从一侧滑动到屏幕内或从屏幕内滑动到屏幕外。
- .opacity：视图通过透明度变化来淡入或淡出。
- .scale：视图通过缩放变化来显现或消失。
- .move(edge:)：视图从指定的边缘移动进出。
- .push(edge:): 试图通过移动淡入或者淡出。
- .offset(x:y:): 视图从指定的偏移位置移动进出。

### 非对称过渡效果

默认情况下，过渡效果在视图添加到层次结构时以一种方式应用，而在视图移除时则产生相反的效果。例如，.slide 在视图添加时会从一侧滑动到屏幕内，而在视图移除时会从屏幕内滑动到屏幕另一侧，这是一种对称的效果。然而，这种默认行为是可以改变的。

如果想为视图的添加和移除指定不同的过渡效果，可以使用 .asymmetric 修饰符。例如，在试图添加时滑动，移除时淡出，如下所示：

![Slide + Opacity 动画截图]()

```swift
.transition(AnyTransition.asymmetric(insertion: .slide, removal: .opacity))
```

### 组合过渡效果

AnyTransition 允许开发者将多个过渡效果组合在一起，以实现更复杂的动画效果。这可以通过使用 .combined(with:) 方法来实现。例如：

![Combined 动画截图]()

```swift
.transition(AnyTransition.opacity.combined(with: .slide))
```

甚至,

![Combined 动画截图]()

```swift
.transition(AnyTransition.asymmetric(insertion: .slide, removal: .opacity).combined(with: .slide).combined(with: .scale))
```

### 自定义 AnyTransition 过渡效果

AnyTransition 还可以创建自定义的过渡效果。通过实现 `.modifier(active:identity:)` 方法，可以定义自定义的 ViewModifier，并将其封装在 AnyTransition 中。例如，实现一个自定义的 `.customSlide` 效果用法 (`.transition(AnyTransition.customSlide)`) 来复刻默认的 `.slide` 效果。

![customSlide 动画截图]()

```swift
extension AnyTransition {
    static var customSlide: AnyTransition { // 不带参数的 customSlide
        AnyTransition.asymmetric(insertion: AnyTransition.modifier(
            active: CustomSlideModifier(offset: -UIScreen.main.bounds.width),
            identity: CustomSlideModifier(offset: 0)
        ), removal: AnyTransition.modifier(
            active: CustomSlideModifier(offset: UIScreen.main.bounds.width),
            identity: CustomSlideModifier(offset: 0)
        ))
    }
}

struct CustomSlideModifier: ViewModifier {
    var offset: CGFloat
    func body(content: Content) -> some View {
        content.offset(x: offset)
    }
}
```

由于 AnyTransition 是一个结构体，并且 `customSlide` 不需要参数，所以给它扩展了一个计算属性。由于不知道当前视图大小，使用 `UIScreen.main.bounds.width` 来移动，效果和默认的 `slide` 有出入。为了解决这个问题，可以将当前视图大小传递给 `customSlide`，这时候就需要扩展一个函数了，如下所示：

![customSlide(size:) 动画截图]()

```swift
extension AnyTransition {
    static func customSlide(size: CGSize) -> AnyTransition {
        AnyTransition.asymmetric(insertion: AnyTransition.modifier(
            active: CustomSlideModifier(offset: -size.width),
            identity: CustomSlideModifier(offset: 0)
        ), removal: AnyTransition.modifier(
            active: CustomSlideModifier(offset: size.width),
            identity: CustomSlideModifier(offset: 0)
        ))
    }
}
```

`.modifier(active:identity:)` 只要求 active 和 identity 符合 `ViewModifier` 协议，这意味着自定义的过渡效果可以使用 View 上的所有修饰符。可以说，只有想不到，没有做不到。

## Transition 协议

Transition 协议是 iOS 17+ 才开放的新接口，和 AnyTransition 有几乎一样的功能和用法，区别主要有以下三点：
1. Transition 是协议，自定义时需要实现该协议，更符合直觉；而 AnyTransition 是结构体，自定义时需要借助 `.modifier(active:identity:)`。
2. Transition 开放了 `TransitionPhase`，开发者可以以此知道当前过渡效果所处的阶段 (identity, willAppear, didDisappear)。从而代替了 AnyTransition 的 `.asymmetric` 和 `.modifier` 描述符。
3. Transition 新增了 `blurReplace` 和 `symbolEffect` 两个过渡效果。

同样，使用 Transition 复刻一个带参数的 `.customSlide(size:)` 如下所示：

![customSlide(size:) 动画截图]()

```swift
extension Transition where Self == CustomSlideTransition {
    static func customSlide(size: CGSize) -> CustomSlideTransition {
        CustomSlideTransition(size: size)
    }
}

struct CustomSlideTransition: Transition {
    let size: CGSize
    public func body(content: Content, phase: TransitionPhase) -> some View {
        let offset: CGFloat = switch phase {
            case .willAppear:
                -size.width
            case .identity:
                0
            case .didDisappear:
                size.width
        }
        content.offset(x: offset)
    }
}
```

自定义的 `CustomSlideTransition` 根据当前的过渡阶段来计算偏移的位置，从而产生预期的动画效果。`TransitionPhase` 同时也提供了一个叫 `value` 的计算属性，在 `identity` 阶段为 0，在 willAppear 阶段为 -1.0，在 didDisappear 阶段为 1.0。可以用 `value` 的值来简化 `CustomSlideTransition` 如下：

```swift
struct CustomSlideTransition: Transition {
    let size: CGSize
    public func body(content: Content, phase: TransitionPhase) -> some View {
        content.offset(x: phase.value * size.width)
    }
}
```

由于 Transition 完全替代了 AnyTransition，如果项目上支持 iOS 17.0+ 的话，推荐使用 Transition。

## 过渡效果的好帮手 —— VisualEffect

在上面自定义的 `customSlide` 中，我们需要调用方提供当前视图的大小。需要使用 `GeometryReader` 或者使用 `GeometryReader` 来实现一个 [`saveSize` 的描述符][saveSize]，从而获取当前视图的大小，用法如下：

```swift
@State var size: CGSize = .zero
...
Text("Hello, Transition!")
    .saveSize(in: $size)
    .transition(.customSlide(size: size))
```

这样很不方便，而且在第一帧时，由于 size 为零，视图会静止在屏幕中间不动。
幸运的是，从 iOS 17.0+ 起，SwiftUI 提供了一个叫 `visualEffect(_:)` 的修饰符，将视图的布局信息暴露出来的同时，还能给视图添加视觉效果。

```swift
func visualEffect(_ effect: @escaping (EmptyVisualEffect, GeometryProxy) -> some VisualEffect) -> some View
```

使用 `visualEffect`, 我们就可以去掉 `CustomSlideTransition` 中的参数，代码如下：

```swift
struct MyCustomSlideTransition: Transition {
    public func body(content: Content, phase: TransitionPhase) -> some View {
        content.visualEffect { content, geo in
            content.offset(x: phase.value * geo.size.width)
        }
    }
}

extension Transition where Self == MyCustomSlideTransition {
    static var myCustomSlide: MyCustomSlideTransition {
        get {
            MyCustomSlideTransition()
        }
    }
}

Text("Hello, Transition!")
    .transition(.myCustomSlide)
```

这时，我们自定义的 slide 效果和系统默认效果一模一样了。

![myCustomSlide 动画截图]()

`visualEffect` 中的视图同时拥有当前视图的布局和过渡阶段，方便多了。需要注意的是 `visualEffect` 限制闭包中的返回值是 `some VisualEffect` 而不是 `some View`。也就是说，在 visualEffect 中不能使用所有 View 上的修饰符。那么，有哪些可用呢？

### VisualEffect 视觉效果

SwiftUI 实现了一些视觉效果修饰符，在不改变其父视图或子视图的情况下改变视图的视觉效果。主要分为以下几类：

- 颜色变化：`brightness`, `contrast`, `grayscale`, `hueRotation`, `saturation`，`opacity`
- 仿射变换：`transform`, offset, rotationEffect, scaleEffect
- 高斯模糊：`blur`
- 着色器效果：colorEffect, layerEffect, distortionEffect 

多数视觉效果使用起来简单直观，让我们重点探究一下着色器效果，以及它们如何助力过渡效果。

VisualEffect 提供了三个使用 Metal 着色器的修饰符：

- `func colorEffect(_ shader: Shader, isEnabled: Bool = true) -> some VisualEffect`
- `layerEffectfunc layerEffect(_ shader: Shader, maxSampleOffset: CGSize, isEnabled: Bool = true) -> some VisualEffect`
- `func distortionEffect(_ shader: Shader, maxSampleOffset: CGSize, isEnabled: Bool = true) -> some VisualEffect`

它们的第一个参数要求 SwiftUI 创建一个着色器，在 SwiftUI中 创建一个着色器是通过 ShaderLibrary 调用着色器函数名来实现的，SwiftUI会为视图的每一个像素调用你的着色器函数。着色器函数是一些小程序，它们直接在设备的 GPU 上计算各种渲染效果。GPU 针对这种高并发任务进行了优化。然而，由于GPU编程的特殊性质，着色器不能用 Swift 编写。相反，它们用 Metal Shading Language或者简称 Metal 编写。在每个着色器修饰符的文档上都能找见着色器函数的签名，例如 colorEffect 要求函数的签名如下：

```metal
[[ stitchable ]] half4 name(float2 position, half4 color, args...)
```

SwiftUI 在调用着色器函数时，会传递当前像素的坐标 (float2 position) 和颜色值 (half4 color)，返回经过计算后新的颜色值。后面是一个可变长的参数列表，可以使用 SwiftUI 传递参数给着色器。写一个简单的灰度着色器如下：

```
// .metal file
#include <metal_stdlib>
using namespace metal;

[[ stitchable ]] half4 grayColor(float2 position, half4 color) {
    float gray = (color.r + color.g + color.b) / 3;
    return half4(gray, gray, gray, color.a);
}
```

学过 C 语言的话，写这种函数没有任何难度，当然也可以阅读 [Metal Shading Language Specification][Metal-Shading-Language-Specification]。接着在 SwiftUI 里调用它, 你就能得到一张灰度图：

```
Image(.pixelsMeasure)
    .resizable()
    .frame(width: 256, height: 256)
    .padding()
    .colorEffect(
        ShaderLibrary.grayColor() // New
    )
```

![灰度图片]()

API 聊完了，接下来我们使用着色器实现过渡效果。

### 使用着色器实现过渡效果

学习 API 最简单的方式就是复刻系统的 API，如果我们能做一个一模一样的，说明理解的差不多了。当然，如果做完之后能对比一下系统 API 是如何实现的会更有益，但是闭源的 SwiftUI 还做不到这点。

#### 使用 colorEffect 实现透明过渡效果

好了，接下来，我们选择一个最简单的 opacity 来复刻，SwiftUI 端非常直接：

```swift
Image(.pixelsMeasure)
    .resizable()
    .frame(width: 256, height: 256)
    .padding()
    .transition(.myOpacity)

extension Transition where Self == MyOpacityTransition {
    static var myOpacity: MyOpacityTransition {
        MyOpacityTransition()
    }
}

struct MyOpacityTransition: Transition {
    func body(content: Content, phase: TransitionPhase) -> some View {
        content.visualEffect { content, proxy in
            return content
                .colorEffect(
                    ShaderLibrary.myOpacity(
                        .float(phase.value) // Pass phase value to shader
                    )
                )
        }
    }
}
```

唯一不同的是多传递了一个过渡阶段的参数给着色器函数，透明过渡函数的着色器如下：

```metal
[[ stitchable ]] half4 myOpacity(float2 position, half4 color, float value) {
    float progress = value > 0 ? 1 - value : 1 + value;
    return half4(color.r * progress, color.g * progress, color.b * progress, color.a * progress);
}
```

这时候就得到了一个和系统透明过渡一模一样的效果。

![自定义和透明过渡器对比]()

值得一提的是，虽然从 Transition 里拿到的 `phase.value` 是 -1， 0， 1 三个值，但实际上，SwiftUI 会对 value 插值，所以对同一个像素点，着色器函数将被调用多次，范围从 [-1, 1] 区间连续变化。value 从 -1 到 0 透明度逐渐降低，从 0 到 1 之间透明度逐渐升高。而透明度的变化在 [0, 1] 区间，这就需要一个转化函数将其映射到这个区间。比如线性函数，`cos` 函数，或者之前学过的动画过渡函数等等（查看 UnitCurve 用法），上例中使用线性转化方法。写代码时，转化后的值可以理解它是当然动画的进度，在 [0, 1] 之间。

![线性过渡函数 VS cos 函数]()。

#### 使用 layerEffect 实现马赛克过渡效果

`colorEffect` 是最简单的一种使用着色器函数，它接收当前像素的位置和颜色，返回处理后的颜色值。而 layerEffect，接收的函数是 `SwiftUI::Layer layer`，能通过 layer.sample(position) 获取视图中任意像素点的颜色值，返回处理后的颜色值。可以说 `colorEffect` 是 `layerEffect` 的一个特例。 如果在一个矩形区域内，采样第一个点的值，然后复制给这个矩形区域内的所有其它像素，重复这种步骤，就等得到一个马赛克的效果。

```swift
struct MosaicTransition: Transition {
    func body(content: Content, phase: TransitionPhase) -> some View {
        content.visualEffect { content, proxy in
            return content
                .layerEffect(
                    ShaderLibrary.mosaic(
                        .float(phase.value),
                        .float(32) // 色块大小
                    ),
                    maxSampleOffset: .zero
                )
        }
    }
}
```

```metal
#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

[[ stitchable ]] half4 mosaic(float2 position, SwiftUI::Layer layer, float value, float tileSize) {
    float progress = 1 - cos(value * 3.1415926 / 2);
    float tile = max(progress * tileSize, 0.000001);
    if (progress * tileSize < 0.00000001) {
        return layer.sample(position);
    }
    return layer.sample(round(position / tile) * tile);
}
```

随着动画进行，tile 越来越大，马赛克效果也越明显。而矩形的大小（tileSize），则采取实验的方法获取，来获得最满意的过渡。

![马赛克过渡效果]()

#### 使用 distortionEffect 实现马赛克过渡效果

distortionEffect 也是一个很简单的着色器函数，它接收一个位置信息，要求通过转换后返回新的地址坐标，而 SwiftUi 会获取这个位置的颜色值。对于上例中的马赛克效果，使用 distortionEffect 实现如下所示：

```metal
[[ stitchable ]] float2 mosaic2(float2 position, float value, float tileSize) {
    float progress = 1 - cos(value * 3.1415926 / 2);
    float tile = max(progress * tileSize, 0.000001);
    if (progress * tileSize < 0.00000001) {
        return position; // Different with layerEffect
    }
    return round(position / tile) * tile; // Different with layerEffects
}
```

和 layerEffect 的区别是，原先需要采样的地方，现在直接返回了位置坐标。效果也是一模一样。

![马赛克过渡效果]()

着色器函数简单直接高效，用好着色器，你将能够解锁 GPU 性能，并编写自己的令人印象深刻的过渡效果。


## 颜色的过渡效果

合理的利用颜色，能实现基于颜色 API 的过渡效果。仔细想想，opacity 就是颜色的一种，利用了透明度。iOS 18.0 新引入了一种网格渐变的工具，可以通过设置网格关键点和对应的颜色，来实现丰富的渐变效果。接下来看看如果将其用在过渡效果中：

### MeshGradient API

```swift
MeshGradient(width: 3, height: 3, points: [
    .init(0, 0), .init(0.5, 0), .init(1, 0),
    .init(0, 0.5), .init(0.5, 0.5), .init(1, 0.5),
    .init(0, 1), .init(0.5, 1), .init(1, 1)
], colors: [
    .red, .purple, .indigo,
    .orange, .white, .blue,
    .yellow, .green, .mint
])
```

### Example:

通过 value 算出当前过渡的进度，再通过进度控制 MeshGradient 的关键点，来实现过渡效果

```swift
struct MeshColorTransition: Transition {
    func body(content: Content, phase: TransitionPhase) -> some View {
        let progress: Float = Float(abs(phase.value) / 2.0)

        return content
            .foregroundStyle(
                MeshGradient(
                    width: 4,
                    height: 3,
                    points: [
                        [0.0, 0.0], [0.5 - progress, 0.0], [0.5 + progress, 0.0], [1.0, 0.0],
                        [0.0, 0.5], [0.5 - progress, 0.5], [0.5 + progress, 0.5], [1.0, 0.5],
                        [0.0, 1.0], [0.5 - progress, 1.0], [0.5 + progress, 1.0], [1.0, 1.0]
                    ],
                    colors: [
                        .red, .white, .white, .blue,
                        .red, .white, .white, .blue,
                        .red, .white, .white, .blue
                    ]
                )
            )
    }
}
```

![颜色过渡效果]()

## 文字的过渡效果

iOS 18.0 引入了新的 API —— TextRenderer。TextRenderer 是一个强大的新协议，允许你替换默认的文本绘制方式。这启用了全新的文本自定义绘制的可能性，但我最感兴趣的是如何使用它来实现过渡效果。

### TextRenderer 协议简介

TextRenderer 协议的核心是 draw(layout:in:) 方法。它的参数是一个 Text.Layout 和一个 GraphicsContext。

Text.Layout 允许我们访问文本的各个组成部分，包括行 (Line)、连续单元（Run）和最小单元 (RunSlice)。最小单元通常指字、字符和图片等。相同类型、相同属性的最小单元连在一起构成一个连续单元。例如：

![两行的文字]()

```
第一行："Build Text Transition "
三个 Run: "Build ", "Text Transition", " "

第二行："with SwiftUI 🧑‍💻🧑‍💻!"
三个 Run: "with SwiftUI ", "🧑‍💻🧑‍💻", "!"
```

可以使用以下帮助函数获取文本中的 Run 和 RunSlices。

```swift
extension Text.Layout {
    /// A helper function for easier access to all runs in a layout.
    var flattenedRuns: some RandomAccessCollection<Text.Layout.Run> {
        self.flatMap { line in
            line
        }
    }

    /// A helper function for easier access to all run slices in a layout.
    var flattenedRunSlices: some RandomAccessCollection<Text.Layout.RunSlice> {
        flattenedRuns.flatMap(\.self)
    }
}
```

通过 layout 拿到最小的绘制内容，在使用第二个参数 GraphicsContext 来绘制它。GraphicsContext 与 Canvas 视图使用的类型相同。完成了自定义的 TextRenderer 后，调用 `.textRenderer` 方法来使用它。

接下来，我们实现一个打字过渡效果。

### Example：打字效果

首先自定义一个带打字效果的过渡

```swift
struct TextKeyboardTransition: Transition {
    func body(content: Content, phase: TransitionPhase) -> some View {
        content.textRenderer(KeyboardEffectRenderer(value: phase.value))
    }
}
```

并将其应用到文本上：

```swift
VStack {
    if toggle {
        let visualEffects = Text("Text Transition")
            .foregroundStyle(.pink)

        Text("Build \(visualEffects) with SwiftUI 🧑‍💻🧑‍💻!")
            .font(.system(.title, design: .rounded, weight: .regular))
            .frame(width: 250)
            .transition(TextKeyboardTransition())
    }
}
.animation(.linear(duration: 1.0), value: toggle)
```

接着，我们来实现 `KeyboardEffectRenderer`, 这里，我们同样使用过渡值来计算当前过渡的进度 `progress`(在 [0, 1]之间), 再通过比例计算当前光标的位置 `currentIndex`，仅绘制光标左侧的字符。由于打字效果每次出现一个字，所以使用 `flattenedRunSlices` 获取最小单元，最后将光标绘制出来。如下所示：

```swift
struct KeyboardEffectRenderer: TextRenderer {
    var value: Double

    init(value: Double) {
        self.value = value
    }

    func draw(layout: Text.Layout, in context: inout GraphicsContext) {
        let progress: Double = value > 0 ? 1 - value : 1 + value
        let count = layout.flattenedRunSlices.count
        let currentIndex: Int = Int(round(progress * Double(count)))

        let cursor = Text("|")
            .foregroundStyle(.green)
            .font(.system(.title, design: .rounded, weight: .semibold))

        for (index, slice) in layout.flattenedRunSlices.enumerated() {
            // Make a copy of the context so that individual slices
            // don't affect each other.
            var copy = context
            if index < currentIndex {
                copy.draw(slice)
            } else {
                // Draw cursor
                copy.draw(cursor, in: slice.typographicBounds.rect)
                break;
            }
        }
    }
}
```

开关 toggle，你会发现过渡效果并没有如期而至。这是因为 `KeyboardEffectRenderer` 不是可动画属性，它不知道要随着 SwiftUI 插值而重绘，给它实现 `Animatable` 协议，就解决问题了：

```swift
extension KeyboardEffectRenderer: Animatable {
    var animatableData: Double {
        get { value }
        set { value = newValue }
    }
}
```

![打字效果]()

另外，文本还支持添加自定义属性，并在自定义的 TextRenderer 中检查该属性是否存在，来绘制更复杂的效果，比如，想通过阴影来进一步强调 `Text Transition`, 效果如下：

![带阴影的打字效果]()

## 滚动的过渡效果

受限于移动设备的屏幕尺寸，滚动视图被广泛使用，以期显示更多的内容。近两年，SwiftUI 推出了一系列新的滚动相关的 API，极大的扩充了滚动视图的自定义能力。这里主要介绍一种与过渡有关的 API。

### scrollTransition(_:axis:transition:)

scrollTransition 的第二个参数指定滚动轴，第三个参数有着和 Transition 协议一样的签名，通过获取当前的过渡阶段来应用过渡效果。

和之前的例子不一样的是，随着滑动，当前视图会出现，或者消失在滚动视图的可视区域内。所以不需要使用 toggle 和 animation 来启动过渡效果。

### Example: 视差效果

下面是使用 scrollTransition 实现的一个横向滚动的视差效果，当卡片向左划出屏幕时，将内容向右偏移，当卡片向右划出屏幕时，将内容向左偏移。这样就形成一个视差效果，每张卡片看起来像一个窗口，你可以透过窗口看到外面。

```swift
ScrollView(.horizontal) {
    LazyHStack(spacing: 16) {
        ForEach(photos) { photo in
            VStack {
                ZStack {
                    Card(photo)
                        .scrollTransition(axis: .horizontal) { content, phase in
                            content
                                .offset(x: phase.isIdentity ? 0 : phase.value * -200)
                        }
                }
                .containerRelativeFrame(.horizontal)
                .clipShape(RoundedRectangle(cornerRadius: 36))
            }
        }
    }
}
.contentMargins(32)
.scrollTargetBehavior(.paging)
```

![视差效果]()

值得注意的是，`scrollTransition` 仅对正在进入可视区域，或者正从可视区域消失的元素有效。如果可视区域中间有多个元素，它们是不会被调用的。所以 `scrollTransition` 通常用来处理边界的元素。例如，实现一个滚动的小球效果。

![小球的滚动 - 不使用和使用 scrollTransition 的对比]()

## 导航过渡效果

SwiftUI 可以使用 `.transaction` 来修改默认导航的动画效果，参考[SwiftUI 动画篇][SwiftUI_Animation]，配合 `matchedGeometryEffect(id:in：)` 能实现类似 App Store 的缩放过渡效果。而 WWDC24 新提供了 `NavigationTransition` 协议，其中 zoom 方法能很轻易的实现类似的效果。

### .zoom(sourceID:in:)

.zoom 定制源视图的 id 和名字空间，使用 `matchedTransitionSource(id:namespace:)` 定义源视图。

### Example: 缩放的导航过渡

```swift
NavigationLink {
    PhotoCardDetail(photo: photo)
        .navigationBarBackButtonHidden()
        .navigationTransition(
            .zoom(sourceID: photo.id, in: namespace)
        )
} label: {
    PhotoCard(photo: photo)
}
.matchedTransitionSource(id: photo.id, in: namespace)
```

![ZoomNavigationTransition]()


## 总结

创建优质的用户体验需要不断试验和调试。过渡效果作为最常见的视觉效果，结合 SwiftUI 提供的丰富的工具使开发者能够大胆尝试，创造出新颖且富有表现力的界面。

感谢阅读，希望这些工具能够激发你的创造力，探索并发明新的视觉效果，使你的应用脱颖而出。

## 参考资料
- [WWDC24 10151][10151]
- [WWDC24 10145][10145]
- [SwiftUI 动画篇][SwiftUI_Animation]

[10151]: https://developer.apple.com/wwdc24/10151
[10145]: https://developer.apple.com/wwdc24/10145
[SwiftUI_Animation]: https://github.com/SwiftOldDriver/WWDC23/blob/main/sessions/session_10156/README.md
[saveSize]: https://stackoverflow.com/questions/57577462/get-width-of-a-view-using-in-swiftui
[Metal-Shading-Language-Specification]: https://developer.apple.com/metal/Metal-Shading-Language-Specification.pdf
