# 【WWDC21 10253】使用 Swift 特性 Result Builder 定制 DSL

[TOC]

> 作者：冬瓜, iOS 开发，SwiftGG 翻译组成员。公众号[「一瓜技术」](https://www.desgard.com/qrcode)作者。
>
> 审核：lordlp，iOS 开发者
> 
> 审核：方秋枋（mango）, 微信高级工程师，微信支付跨平台负责人，喜欢 Simple And Stupid 的代码。

## 何为 DSL

### 如何定义 DSL

DSL 全称是 **Domain-Specific Language**，中文翻译为**领域特定语言**（下文称 DSL）。与 DSL 相对的就是 GPL，即 **General Purpose Language** 通用编程语言。GPL 就是我们很熟悉的 C、C++、Objective-C、Java 等等。

DSL 用来解决一些固定场景的问题，是建立在问题空间基础上的语言。在 DSL 中的代码，只需要描述一些业务需求，解释器会在简单的语法描述背后，执行许多**隐式行为**（Implicit Behavior）从而帮助开发者解决问题。

DSL 语言通常是**声明式**（Declarative）的，在完成问题的准确描述后，即可解决问题，无需使用编程语言编写详尽准确的指令逻辑。

### 嵌入式 DSL （Embedded DSLs）

目前我们可以使用 Swift 语言作为宿主语言的语法特性来编写 DSL 的语法规则，然后在 Swift 的代码中来引入 DSL，这种方式我们称之为**嵌入式 DSL**（Embedded DSLs）。

实现嵌入式 DSL 显然要比设计一个完整独立的 DSL 并为之编写编译器要容易的多，因为这是站在巨人的肩膀上，我们的基础是一个已经确定了语法并自带编译器的高级语言，此时将 DSL 的代码与非 DSL 的代码混合使用也更为容易。

使用嵌入式 DSL 也是目前项目中更合理的方式，因为往往我们仅用 DSL 语法来实现项目中的部分需求问题，而这个问题仅是 App 中的一个特定领域的问题。

Swift 旨在支持嵌入式 DSL，如果你使用过 SwiftUI，那其实你已经接触了嵌入式 DSL。SwiftUI 的视图描述语法，是和我们设备屏幕上的布局视图相对应的。所以当你使用 SwiftUI DSL 进行代码编写时，我们实现的仅仅是对于视图的描述，而底层的构建，全部交予 SwiftUI 进行处理。

使用嵌入式 DSL 的场景我们可以看看下面这个例子：

![](https://images.xiaozhuanlan.com/photo/2021/92a17be666f8c33a186d6b67862fa7b7.png)

使用 SwiftUI 可以很好的描述布局，有着更高的可读性。与此相比，我们可以来看一下不使用 SwiftUI 的 DSL，我们的代码是什么样子：

![](https://images.xiaozhuanlan.com/photo/2021/a693e3a52644bbdfe423e780fda0fc7b.png)

比较之下，使用 Swift 的原生语法需要创建大量的临时变量来实现，而且其代码无法展示出视图布局的层级关系。SwiftUI 则更加接近视图的描述，可读性更强。

### SwiftUI 中的 DSL 包括什么

我们用下面代码为例：

![](https://images.xiaozhuanlan.com/photo/2021/98b3fed4d183c37ef8e1b94300fddc24.png)

- ① 这个是 Swift 中的 _Property Wrapper_ 特性，通过这种标记方式，可以对 `struct` 或 `class` 中的成员添加某些操作行为。

- ② 这种 `func` 后直接跟随一个闭包的语法是 Swift 中的 _Trailing Closure Arguments_，这种闭包的语法更加简洁。另外，这里还妙用了 Swift Class 中的初始化构造器（Initializers）从而简化了写法。

- ③ 这是 Swift 中的 _Result Builders_ 特性，能够将局部作用域内一个或多个值聚合为单个的返回值进行处理。

- ④ 这是 SwiftUI 中的 _Modifier-style Method_，通过这种方式可以构造出一种链式调用的形式，提高代码可读性。

这些语法和特性都在[「WWDC19 Modern Swift API design」](https://developer.apple.com/videos/play/wwdc2019/415/)的 Session 中有详细的介绍，今天我们就不讨论它们的书写方法。在 SwiftUI 中，我们主要通过 _Result Builder_ 对视图做了很多隐式处理，所以我们下面来聊一聊这个语法特性。

## Result Builder 的运作方式

### Result Builder 特性的目的

在 Swift Forums 中的 [_SE-0289 Result Builders_ 提案](https://forums.swift.org/t/se-0289-review-2-result-builders/40585)中有讲述 _Result Builders_ 这个特性的目的：

1. 实现 DSL 中的特定表达；
2. 简化常规方法、计算属性的 getter 方法或闭包的语法；
3. 封装方法调用，语义上是使用返回值；
4. 接管方法的返回值；
5. 是一个编译时的特性，可无视系统版本差异；

### 如何运作？

我们用一个 SwiftUI 的例子来举例说明 SwiftUI 中 DSL 的运作原理，其中包括了 _Result Builder_ 和其他的几个特性。

首先我们来看这个代码：

```swift
VStack {
    Text("Title").font(.title)
    Text("Contents")
}
```

在 `VStack` 中，竖直排列两个 `Text` 控件。这里的 `VStack` 之所以可以这样表达，是因为这是一个 _Trailing Closure Argument_，在后面的花括号中就是闭包具体内容。

我们可以看一下 `VStack` 的实现代码：

```swift
struct VStack<Content: View>: View {
    ...
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
}
```

所以在 SwiftUI 项目中，我们可以将其构造方法补充完整，就变成了下面这样：

```swift
VStack.init(content: {
    Text("Title").font(.title)
    Text("Contents")
    return // TODO: build results using `ViewBuilder`
})
```

可以看到，其中花括号包裹着的部分，其实是构造方法的闭包参数。

在这段代码中，我们还需要注意有这么一个关键字 - `@ViewBuilder`。我们在源码中找到它的实现：

```swift
@resultBuilder enum ViewBuilder {
    static func buildBlock(_: View...) -> some View { ... }
}
```

这些语句的内容又是如何被 Result Builder 捕获处理的呢？

我们发现 `@ViewBuilder` 是一个 _Result Builder_，它通过标记的 `@resultBuilder` 属性告知编译器它描述的是一个结果值，且该结果是一个 `View` 类型（`View` 类型严格说来应该是 `some View` 类型）。所以在花括号中的所有内容，将会被 Result Builder 捕获，合成一个值进行返回。

我们将 `@ViewBuilder` 的行为进行展开，所以可以得到以下展开功能后的代码：

```swift
VStack.init(content: {
    let v0 = Text("Title").font(.title)
    let v1 = Text("Contents")
    return ViewBuilder.buildBlock(v0, v1)
})
```

在上述代码中，我们还需要解释一个关键字 - `.font(.title)` ，这其实是 Swift 当中的另一个新特性 - _Modifier-style Method_ ，它会修改 `Text("Title")` 返回值的一些属性，再次返回相同的类型结果。

这里可以看到，Result Builder 首先会为能够返回结果的语句创建临时变量，然后将所有的这些临时变量作为参数去调用一个名为 `buildBlock` 的 `static` 方法，并将其返回值作为整体的返回结果。

这种做法在 SwiftUI 中十分常见，例如我们可以继续增加一个修改字体颜色的方法：

```swift
let v0 = Text("Title").font(.title).foregroundColor(.green)
```

于是我们可以发现，在 SwiftUI 中，_Modifier-style Method_ 特性和*Result Builder* 特性很好的协同工作，共同构成了一个 DSL 描述性语言。从这点出发，以下两点也是我们开发者在创建 DSL 的一个原则：**语法特性和用户预期表现保持平衡**。

### Result Builder 的限制

虽然我们可以使用 Swift 的 Result Builder 进行一些 DSL 的设计，但是其并不是完全开放的。因为我们需要受到以下限制：

1. Result Builder 方法中，**仍需遵守 Swift 的语法规则**：例如花括号匹配规则等；
2. 当使用 Result Builder 时，**某些功能将无法使用**：例如一些条件控制语句，异常捕获语句等。除非你的 DSL 也去兼容它们；
3. **部分 Swift 关键字会被限制使用**，因为这可能会造成编译器无法正常编译；

## 设计一个 DSL

### 一些设计 DSL 的思考

我们体验了 SwiftUI 中的 DSL 语法和开发体验，接下来我们聊聊如何设计一个 DSL。

其实设计一个 DSL ，和设计 API 十分类似。首先，我们需要考虑如何使用 Swift 来表达对应的想法和行为，**设计 DSL 仅仅是使用了设计 API 时通常不会用到的一些额外的语法特性**。

另外设计 DSL 更多的是为了提升自己的开发体验，所以设计 DSL 是一个主观性较强的操作，相比之下 API 的设计更多地需要考虑他人的需求。由于 DSL 是我们开发者角度的主观表达，所以目标相对来说更加清晰。

### 例：Fruita App 中关于 DSL 的设计

为了更好的展示如何设计一个 DSL，下面我们使用 Fruita App 的例子来讲述。可以在 Apple 的 SwiftUI 官方文档[「Fruta: Building a Feature-Rich App with SwiftUI」](https://developer.apple.com/documentation/swiftui/fruta_building_a_feature-rich_app_with_swiftui)来下载这个示例。

#### 繁琐代码痛点分析

我们来看下面这个代码：

```swift
extension Smoothie {
    static let berryBlue = Smoothie(
        id: "berry-blue",
        title: "Berry Blue",
        description: "Filling and refreshing*, this smoothie will fill you with joy!",
        measuredIngredients: [
            MeasuredIngredient(.orange, measurement: Measurement(value: 1.5, unit: .cups)),
            MeasuredIngredient(.blueberry, measurement: Measurement(value: 1, unit: .cups)),
            MeasuredIngredient(.avocado, measurement: Measurement(value: 0.2, unit: .cups)),
        ],
        hasFreeRecipe: true
    )

    static let carrotChops = Smoothie(...)
    static let crazyColadaChops = Smoothie(...)
    ...
}

extension Smoothie {
    private static let allSmoothies: [Smoothie] = [
        .berryBlue,
        .carrotChops,
        .crazyColada,
    ]

    static func all(includingPaid: Bool = true) -> [Smoothie] {
        if includingPaid {
            return allSmoothies
        }
        logger.log("Free smoothies only")
        return allSmoothies.filter { $0.hasFreeRecipe }
    }
}
```

解释一下上面的代码，首先我们需要定义很多 `static` 的变量来代表各种口味的冰沙（Smoothie），然后我们定义一个 `allSmoothies` 数组，其中包括所有种类的冰沙，并且定义一个 `all(includingPaid:)` 方法，来过滤得到免费或非免费的冰沙集合。

现在我们的写法十分繁琐，因为如果我们增加一种新的种类，就要修改 `static` 变量部分以及 `allSmoothies` 数组部分。并且 `measuredIngredients` 的这个象征着冰沙成分的数组实在是太冗长了，每声明一个都会头痛好久。

另外我们单独拿一个成分的描述来分析：

```swift
MeasuredIngredient(.orange, measurement: Measurement(value: 1.5, unit: .cups))
```

这样一个成分的对象，我们仅仅需要关注 `.orange`、 `1.5` 和 `.cups` 这三个信息即可，剩下的都是无用信息。

综上，关于冰沙这个对象的设计十分冗长，所以我们需要一个 DSL 来精简其写法。在这个 DSL 中需要修改以下这些痛点：

1. 干掉 `hasFreeRecipe` 属性；
2. 将冰沙的定义合并到 `list` 中；
3. 让成分属性 `measuredIngredients` 的描述更加精简；
4. 分离 `description` 和 `measuredIngredients` 的声明，并置之于数组之外；

在这个例子中，我将主要讲述我是如何做前三点的，第四点作为扩展，可以继续讨论。

#### 逐一确定目标

首先，针对于第 1 点和第 2 点，我会将沙冰（Smoothie）的定义直接放到 `all(includingPaid:)` 方法中，这样就避免了二次声明的繁琐。另外，使用 Result Builder，我们可以直接将结果写在闭包中，并且直接使用 `if...else` 条件语句来分离 `includingPaid` 满足条件的结果。

```swift
@SmoothieArrayBuilder
static func all(includingPaid: Bool = true) -> [Smoothie] {
    Smoothie(...)
    Smoothie(...)
    if includingPaid {
        Smoothie(...)
        Smoothie(...)
    } else {
        logger.log("Free smoothies only")
    }
}
```

然后针对于第 3 点，我们打算使用 _Modifier-style Method_ 这种链式表达的方式，来描述每个沙冰的成分，它看起来像下面这样：

```swift
@SmoothieArrayBuilder
static func all(includingPaid: Bool = true) -> [Smoothie] {
    Smoothie(
        id: "berry-blue",
        title: "Berry Blue",
        description: "Filling and refreshing*, this smoothie will fill you with joy!",
        measuredIngredients: [
            Ingredient.orange.measured(with: .cups).scaled(by: 1.5),
            Ingredient.blueberry.measured(with: .cups),
            Ingredient.avocado.measured(with: .cups).scaled(by: 0.2)
        ]
    )
    Smoothie(...)
    if includingPaid {
        Smoothie(...)
        Smoothie(...)
    } else {
        logger.log("Free smoothies only")
    }
}
```

现在让我们来关注一下最后一点，精简 `id`、`title` 和 `description` 这几个属性的声明。在这里，我们可以参考 App 的 UI 设计方案，从而得到了以下的 DSL 方式：

```swift
Smoothie(id: "berry-blue", title: "Berry Blue") {
    "Filling and refreshing*, this smoothie will fill you with joy!"
    Ingredient.orange.measured(with: .cups).scaled(by: 1.5)
    Ingredient.blueberry.measured(with: .cups)
    Ingredient.avocado.measured(with: .cups).scaled(by: 0.2)
)
```

![](https://images.xiaozhuanlan.com/photo/2021/cbf35ba3e66f534d2f0171e890b3be68.png)

我们可以看到 `title` 正好在 `navigationBar` 上，处于 UI 的最上方， `description` 紧凑地布局在 `title` 之下，所以我们用一个 `String` 紧跟在闭包的第一个位置。再往下，就是各个成分列表，使用我们上面精简后的语法就得到了如图样式。

#### 一些小建议

当我们要去设计 DSL 的时候，我希望下面的方法论可以给你一些启发：

1. 首先要建立一个明确的目标；
2. 查阅并阅读别人的 DSL 描述方法；
3. 统筹兼顾，适合需求；
4. 尽可能通过设计规避错误，让错误在编译阶段可发现或者根本无法写出错误逻辑的代码；
5. 不断修正问题，并找到最佳的方案。

好的，有了上面的设计经验，下面让我们来实现这个 DSL 吧。

## 使用 Result Builder 实现 DSL

### `buildBlock` 方法

仿照之前使用 SwiftUI 的方式，我们对于 `all(includingPaid:)` 方法也应该像 SwiftUI 那样，通过一个 `builder` 进行多个对象的依次构造。就像以下代码：

```swift
@SmoothieArrayBuilder
static func all(includingPaid: Bool = true) -> [Smoothie] {
    let v0 = Smoothie(id: "berry-blue", title: "Berry Blue") { ... }
    let v1 = Smoothie(id: "carrot-chops", title: "Carrot Chops") { ... }
       // ... more smoothies
    return SmoothieArrayBuilder.buildBlock(v0, v1, ...)
}
```

为了使用 Result Builder，我们先来介绍一下其 API 以及每个方法的作用。具体介绍可以查看 [「The Swift Programming Laungage - Advanced Operators」中的 Result Builder 章节](https://docs.swift.org/swift-book/LanguageGuide/AdvancedOperators.html#ID630) 以及 [「The Swift Programming Lauguage - Attributes」中的 Result Builder API 介绍](https://docs.swift.org/swift-book/ReferenceManual/Attributes.html#ID633)。

首先我们先来声明这么一个 Result Builder：

```swift
@resultBuilder
enum SmoothieArrayBuilder {}
```

我们发现编译器需要我们至少定义 `buildBlock(_ components:)` 这个方法，它是用来将部分结果的数组合并成一个结果返回值，所以是一个必须实现的方法。

```swift
@resultBuilder
enum SmoothieArrayBuilder {
    static func buildBlock(_ components: Smoothie...) -> [Smoothie] {
        return components
    }
}
```

### `buildOptional` 条件处理

如此，我们实现了部分 `Smoothie` 构造时的报错。为什么是部分呢？因为我们发现在 `if...` 条件语句的位置，仍旧有报错信息：

![](https://images.xiaozhuanlan.com/photo/2021/efa0a69f77f00ef4d3c9a791fe2d6a73.png)

这个报错是因为我们仅仅实现了 Result Builder 的 `buildBlock(_ components:)` 方法，还不能兼容 `if...else` 这种条件语句。此时我们点击 Xcode 的自动修复按钮，Xcode 提示我们需要增加一个 `buildOptional(_ component: [Smoothie]?)` 方法。

首先我们从方法签名上来看，这个 `buildOptional` 方法需要我们传入一个 `Optional<[Smoothie]>` 类型，其实就是因为 `if...` 由于具有条件不确定性，所以进行构造的对象可能并不存在，即值为 `nil` 。

也许你会问，**为什么会通过 `nil` 处理未命中 `if` 条件下对象不存在的情形，而不是采用直接跳过这个逻辑，不往最后的 `buildBlock` 传递参数这种直截了当的方式呢？** 我们继续像一开始那样，拆解一下具有 `if...` 条件语句的情况：

```swift
@SmoothieArrayBuilder
static func all(includingPaid: Bool = true) -> [Smoothie] {
    let v0 = Smoothie(id: "berry-blue", ...) { ... }
    let v1 = Smoothie(id: "carrot-chops", ...) { ... }

    // Notice - if ... else case
    let v2: [Smoothie] // ①
    if includingPaid {
        let v2_0 = Smoothie(id: "crazy-blue", ...) { ... }
        let v2_1 = Smoothie(id: "hulking-lemonade", ...) { ... }
        let v2_block = SmoothieArrayBuilder.buildBlock(v2_0, v2_1) // ②
        v2 = SmoothieArrayBuilder.buildOptional(v2_block) // ③
    } else {
        v2 = SmoothieArrayBuilder.buildOptional(nil)
    }
    // 但是如果当 includingPaid 是 false 的时候，v2 则为 uninitialized 对象
    return SmoothieArrayBuilder.buildBlock(v0, v1, v2)
}
```

首先在位置 ① ，Result Builder 由于发现了是条件判断，就会增加一个临时变量 `v2` ，并且只是做了声明，未对其进行初始化。

在位置 ② 和 ③，仅局限于条件内部，对 `v2_0` 和 `v2_1` 进行构造，并调用 `buildBlock` 进行组合，最终 `v2` 通过 `buildOptional` 构造出来。相反，如果进入了 `else` 则传入 `nil` 进行构造。

如果直接跳过 `nil` 的处理，`v2` 的初始化由于未覆盖完全所有可能执行的路径，并不完备，从而违反前文中提到 DSL 中必须遵循 Swift 语法规则的限制。

```swift
@resultBuilder
enum SmoothieArrayBuilderN {
    static func buildOptional(_ component: [Smoothie]?) -> [Smoothie] {
        return component ?? []
    }

    static func buildBlock(_ components: Smoothie...) -> [Smoothie] {
        return components
    }
}
```

所以总结一下，当我们需要在 DSL 中进行 `if...` 条件判断，此时可以使用 `buildOptional` 进行构造。`buildOptional` 支持部分结果是 `nil` 的情况。但是这里一定要注意，以上讨论的，都是 `if...` 条件，不包括 `else if` 这种子句的情况。

### `buildExpression` 预处理

虽然我们上面已经完成了 `if..else` 条件语句的兼容，但是回头来看代码，其实还存在一个返回值类型不匹配的问题。因为在 `if...else` 语句中声明的的 `v2_0` 和 `v2_1` 共同构造了 `v2` 这个 Smoothie 类型数组 - `[Smoothie]` ，而 `v0` 和 `v1` 只是一个实例。

![](https://images.xiaozhuanlan.com/photo/2021/6577f8c9ae086d74bca2bd7f14cdb045.png)

所以接下来我们需要对类型进行一个变换，从而达到统一的效果。

第一步，我们将 `buildBlock` 的入参调整为一个数组，并且使用 `flatMap` 进行展开（详见以下代码 L7-L9）：

```swift
@resultBuilder
enum SmoothieArrayBuilder {
    static func buildOptional(_ component: [Smoothie]?) -> [Smoothie] {
        return component ?? []
    }

    static func buildBlock(_ components: [Smoothie]...) -> [Smoothie] {
        return components.flatMap { $0 }
    }
}
```

此时，我们兼容了 `if..else` 中的 `v2` 数组类型，但是上面的 `v0` 和 `v1` 不再兼容。针对于此，我们增加一个 `buildExpression` 方法，来对传入对象进行一个预处理，将其转换成 `[Smoothie]` 即可完成需求（详见代码 L11-L13）。

```swift
@resultBuilder
enum SmoothieArrayBuilder {
    static func buildOptional(_ component: [Smoothie]?) -> [Smoothie] {
        return component ?? []
    }

    static func buildBlock(_ components: [Smoothie]...) -> [Smoothie] {
        return components.flatMap { $0 }
    }

    static func buildExpression(_ expression: Smoothie) -> [Smoothie] {
        return [expression]
    }
}
```

完成之后，仍旧拆解转换一下我们的 DSL 代码，此时会变成以下这样：

```swift
@SmoothieArrayBuilder
static func all(includingPaid: Bool = true) -> [Smoothie] {
    let v0 = SmoothieArrayBuilder.buildExpression(Smoothie(id: "berry-blue", ...) { ... })
    let v1 = SmoothieArrayBuilder.buildExpression(Smoothie(id: "carrot-chops", ...) { ... })

    // Notice - if ... else case
    let v2: [Smoothie] // ①
    if includingPaid {
        let v2_0 = SmoothieArrayBuilder.buildExpression(Smoothie(id: "crazy-blue", ...) { ... })
        let v2_1 = SmoothieArrayBuilder.buildExpression(Smoothie(id: "hulking-lemonade", ...) { ... })
        let v2_block = SmoothieArrayBuilder.buildBlock(v2_0, v2_1)
        v2 = SmoothieArrayBuilder.buildOptional(v2_block)
    } else {
        v2 = SmoothieArrayBuilder.buildOptional(nil)
    }
    return SmoothieArrayBuilder.buildBlock(v0, v1, v2)
}
```

我们看到，L3-L4 以及 L9-L10 对于单个 `Smoothie` 类型的对象，已经增加了 `buildExpression` 预处理，从而完成了对类型的统一。

### `buildEither` 多条件子句处理

前面我们完成了大多数情况的 DSL 语句处理，但是当我们再次编译时，可以发现虽然我们使用 `buildOptional` 处理了单 `if...` 形式的条件语句，但是目前无法处理具有 `else` 或者 `else if` 这种子句的情况。

![](https://images.xiaozhuanlan.com/photo/2021/ef58a6a4d3fa6c1501d75ae86aad19a7.png)

根据 Xcode 的提示，对于这类多条件子句，在 Result Builder 中需要使用 `buildEither` 进行处理。实现代码如下（详见下面代码 L3-L9）：

```swift
@resultBuilder
enum SmoothieArrayBuilder {
    static func buildEither(first component: [Smoothie]) -> [Smoothie] {
        return component
    }

    static func buildEither(second component: [Smoothie]) -> [Smoothie] {
        return component
    }

    static func buildOptional(_ component: [Smoothie]?) -> [Smoothie] {
        return component ?? []
    }

    static func buildBlock(_ components: [Smoothie]...) -> [Smoothie] {
        return components.flatMap { $0 }
    }

    static func buildExpression(_ expression: Smoothie) -> [Smoothie] {
        return [expression]
    }
}
```

为什么我们要在这里补充两个 `buildEither` 方法呢？因为我们的条件选择子句是多个的，需要处理多种情况下的场景。同样的，展开 DSL 的代码，其背后的原理如以下代码描述：

```swift
@SmoothieArrayBuilder
static func all(includingPaid: Bool = true) -> [Smoothie] {
    let v0: [Smoothie]
    if includingPaid {
        let v0_0 = SmoothieArrayBuilder.buildExpression(Smoothie(...) { ... })
        let v0_block = SmoothieArrayBuilder.buildBlock(v0_0)
        v0 = SmoothieArrayBuilder.buildEither(first: v0_block)
    }
    else {
        let v0_0 = SmoothieArrayBuilder.buildExpression(logger.log("Only got free smoothies!"))
        let v0_block = SmoothieArrayBuilder.buildBlock(v0_0)
        v0 = SmoothieArrayBuilder.buildEither(second: v0_block)
    }
    return SmoothieArrayBuilder.buildBlock(v0)
}
```

可以看出，`if` 和 `else` 两个判断分支分别对应了 `buildEither(first:)` 和 `buildEither(second:)` 这两个方法。

那如果是多条件的语句呢，需要写一个 `third` 吗？其实目前是不提供这种超出 3 个条件的方法的，_Result Builder_ 在多条件的场景下，会逐一拆解成双条件语句进行解释。下面这个图展示了多条件语句时的原理：

![](https://images.xiaozhuanlan.com/photo/2021/f68312b1b4faf2c9cf0e7d02b01a6101.png)

对于 3 个及以上的条件分支，可以采用递归的方式处理：每次处理都把当前所有的条件分支拆分为 1 个条件分支和剩余的其他条件分支，这时按照 2 个条件分支的处理可以满足需要；接下来对于剩余的条件分支按照递归展开的方式继续处理即可，直到最后展开到仅剩余 2 个条件分支处理完毕。

### `buildExpression` 空处理

至此，我们离大功告成越来越接近了，Xcode 报错只剩下一个问题：

![](https://images.xiaozhuanlan.com/photo/2021/f3073df13adf6f5444748e3e6ea42afc.png)

提示我们说，这个语句是一个 `Void` 返回值，而不是一个 `Smoothie` 类型。同样的，我们为 `buildExpression` 方法增加一种参数类型即可。这里继续使用 `buildExpression` 对 `Void` 进行处理（详见代码 L22-L24）：

```swift
@resultBuilder
enum SmoothieArrayBuilder {
    static func buildEither(first component: [Smoothie]) -> [Smoothie] {
        return component
    }

    static func buildEither(second component: [Smoothie]) -> [Smoothie] {
        return component
    }
    static func buildOptional(_ component: [Smoothie]?) -> [Smoothie] {
        return component ?? []
    }

    static func buildBlock(_ components: [Smoothie]...) -> [Smoothie] {
        return components.flatMap { $0 }
    }

    static func buildExpression(_ expression: Smoothie) -> [Smoothie] {
        return [expression]
    }

    static func buildExpression(_ expression: Void) -> [Smoothie] {
        return []
    }
}
```

至此，我们对于 `Smoothie` 设计的 DSL 全部完成。

### 解决内层 DSL 问题

我们之前在设计 DSL 的时候，除了对于 `Smoothie` 的设计之外，构造每一款沙冰的成分列表 - `makeIngredients` 方法 ，也希望能够遵循 DSL 的规则。虽然他们不必像 `Smoothie` 的 DSL 那么复杂，但是我们仍旧需要支持一下。

由于 `makeIngredients` 是 `Smoothie` 的成员变量，且在构造时就会传入相应的 DSL，所以我们需要修改一下 `Smoothie` 的 `init` 方法，在 `makeIngredients` 参数前，增加一个自定义 Result Builder 关键字，这里我们命名为 `IngredientsBuilder` （详见 L5）：

```swift
extension Smoothie {
    init(
        id: Smoothie.ID,
        title: String,
        @IngredientsBuilder _ makeIngredients: () -> (AttributedString, [MeasuredIngredient])
    ) {
        let (description, ingredients) = makeIngredients()
        self.init(id: id, title: title, description: description, measuredIngredients: ingredients)
    }
}
```

同样的我们也为其增加 `buildBlock` 方法：

```swift
@resultBuilder
enum IngredientsBuilder {
    static func buildBlock(
        _ description: AttributedString,
        _ ingredients: MeasuredIngredient...
    ) -> (AttributedString, [MeasuredIngredient]) {
        return (description, ingredients)
    }
}
```

注意这里 `buildBlock` 方法的参数声明，`buildBlock` 方法并不限制参数的个数和类型，只要能够匹配到可以调用的 `buildBlock` 方法即可

至此，我们大功告成，完成了整个 DSL 的设计！

### 定制编译器诊断说明

由于 DSL 是我们自己定义的语法，所以在与他人协作开发的时候，由于配合者并不一定参与 DSL 的全部设计，所以他们对 DSL 会有一些错误使用。DSL 是我们自己设计的，所以 Xcode 并不能给出有效的诊断提示。而 Result Builder 中，我们可以使用相关 `Attribute` 来增加编译器诊断说明。

例如在上面的例子中，构造 `makeIngredients` 极有可能出现不传 `description` 字符串的情况，这时候我们可以增加以下方法来提示使用者（详见 L11-L20）：

```swift
@resultBuilder
enum IngredientsBuilder {
    static func buildBlock(
        _ description: AttributedString,
        _ ingredients: MeasuredIngredient...
    ) -> (AttributedString, [MeasuredIngredient]) {
        return (description, ingredients)
    }


    @available(
        *, unavailable,
        message: "first statement of SmoothieBuilder must be its description String"
    )
    static func buildBlock(
        _ ingredients: MeasuredIngredient...
    ) -> (String, [MeasuredIngredient]) {
        fatalError()
    }
}
```

![](https://images.xiaozhuanlan.com/photo/2021/2aeafb2b7e15e0309bbeb187fb4a3262.png)

如此，我们增加了诊断提示，提升了开发体验。

## 总结

本文通过总结 [「WWDC21 - Write a DSL in Swift using result builders」](https://developer.apple.com/videos/play/wwdc2021/10253/)，学习了如何使用 Swift 5.5 的特性来设计并实现一个定制化 DSL。并且通过 Fruita App 的例子，直接上手设计完成 DSL 的代码实现。

通过编写 DSL，我们有以下具体收获：

1. 使用 DSL 可以化繁为简，将复杂的 Swift 语法更加清晰；
2. Result Builder 特性可以在 DSL 中充分利用，让语义描述更加清晰；
3. Modifier-style Method 与 Result Builder 两个特性结合使用，可以大量的简化代码，并增强可读性和可拓展性；
4. Swift 也提供了 DSL 在协助开发时的诊断定制化提示，让他人更加容易上手。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
