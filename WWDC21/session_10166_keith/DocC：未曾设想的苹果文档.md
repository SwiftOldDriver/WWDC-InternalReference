# WWDC21 10166 - DocC：未曾设想的苹果文档

本文基于 Session [10166](https://developer.apple.com/videos/play/wwdc2021/10166/) [10167](https://developer.apple.com/videos/play/wwdc2021/10167/) [10235](https://developer.apple.com/videos/play/wwdc2021/10235/) [10236](https://developer.apple.com/videos/play/wwdc2021/10236/) 梳理

作者信息：旷明，iOS Dev。GitHub：[KeithBird](https://github.com/KeithBird) Twitter：[@KeithBirdKTH](https://twitter.com/KeithBirdKTH) [个人技术博客](https://www.notion.so/keithbird/Kth-34dc6a2e55fc40c9b22f170fdcc2c5cc)。

作者将本教程和部分 WWDC 中的代码实践，通过 DocC 技术编译成教程放在 [WWDocC](https://github.com/KeithBird/WWDocC) 代码库中

## 前言

苹果在 WWDC 视频上投入的精力有目共睹，但留开发者的官方文档常常惨不忍睹，甚至于有一个[专门的网站](https://nooverviewavailable.com)统计 No Overview Available 的苹果文档。据调查只有 **30%** 左右的 iOS 开发者通过官方文档学习 API，Paul Hudson 也在 WWDC 21 前许愿写下 [Reimagining Apple’s documentation](https://www.hackingwithswift.com/articles/231/reimagining-apples-documentation) 一文。

但 [SwiftUI Tutorials](https://developer.apple.com/tutorials/SwiftUI) 和 [Catalyst Tutorials](https://developer.apple.com/tutorials/mac-catalyst) 依然如同两股清流，是开发者们在文档沙漠中的绿洲。苹果很明显没有时间为每项技术提供如此生动的教程，于是将这个能力通过 DocC 开放给了开发者们（和 iPad 没有计算器有异曲同工之妙）。当然 DocC 也可以用来给自己的**开源项目**编写文档，文档文件会和源代码将一起被 Xcode 编译。

## 文档的编译

Xcode 编译 DocC 的材料分别来自于：源码中的**注释**和 DocC **专属的文件**。这两者将通过我们接下来要编写的**链接**，和源码编译后产生的**接口结构**，组合在一起形成最终的文档。通过点击菜单栏的 Product > Build Documentation 可以完成编译。也可以将此步骤添加到 Build 过程中，只需在 Building Settings 的 Documentation Compiler 中，将 Build Documentation during 'Build' 设为 Yes。

### 编译注释中的文档

![docc-compilation-default@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623487697418-020d4063-89a0-42b5-8fce-1a84f1a22ce9.png)

Xcode 首先会编译代码源文件，并提取**可识别注释**中的公共 API 信息（如概要、参数说明、返回值说明等)，以生成一些文档内容，作为生产 **DocC Archive** 的部分材料。因此，在默认情况下，DocC 仅靠编译源码，就可以生成按**接口类型**和**接口结构**组织的文档。

### 编译 DocC 的文件

![docc-compilation-catalog@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623407888910-0eb1673a-45b3-489e-b19a-a264473b7d83.png)

当你如下需求时，可以考虑使用 documentation catalog 为源码注释进行补充：

- 通过文档**首页**介绍框架和主要接口。
- 需要自定义组织文档的**结构**。
- 通过**文章**详细说明开源框架。
- 通过**教程**逐步指导最佳实践。
- 文档中包含图片视频等内容。

你可以新建一个 **documentation catalog**，将其放到 Swift package 中的，与源码相同的文件夹下。也可以在新建 Swift framework project 时，勾选 Include Documentation。

## 可识别注释

摁住 Command 键点击接口名称并选择 **Add Documentation** 可以自动生成**可识别注释**的模版。你可以在模版中依次填写接口的概要、说明、参数说明、返回值说明、抛出说明等内容。这些内容的编写格式为 **markup**，markup 会在文档的编写中多次使用，可以在 [Formatting Your Documentation Content](https://developer.apple.com/documentation/Xcode/formatting-your-documentation-content) 一文中进行学习。

```swift
/// Eat the provided specialty sloth food.
///
/// Sloths love to eat while they move very slowly through their rainforest 
/// habitats. They're especially happy to consume leaves and twigs, which they 
/// digest over long periods of time, mostly while they sleep.
///
/// When they eat food, a sloth's `energyLevel` increases by the food's `energy`.
///
/// - Parameters:
///   - food: The food for the sloth to eat.
///   - quantity: The quantity of the food for the sloth to eat.
///
/// - Returns: The sloth's energy level after eating.
///
/// - Throws: `SlothError.tooMuchFood` if the quantity is more than 100.
mutating public func eat(_ food: Food, quantity: Int) throws -> Int {...}
```

通过编写上面的注释并进行编译，你可以在对应的**接口文档**中看到以下信息：

![reference-doc.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1624336814666-965ed059-968d-4368-8d8e-17792dc30b43.png)

也可以通过 **Quick Help** (optiong + 点击接口名弹出) 查看：

![quick-help.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1624336853320-b2e57dce-8461-44ae-9608-05ef42eef26b.png)

## 文档的编写

DocC 中的文档一共分为三类：在之前的官方文档中被普遍，用于具体介绍接口的**参考文档**（Reference）。形式更加自由，用于介绍框架背后构造（如不同组件之间的联系）的**文章**（Articles）。通过交互式的逐步指导，帮助用户完成最佳实践的**教程**（Tutorials）。

![map.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623672903501-1ce180b0-2581-47a7-9cd6-1e5f66cc395b.png)

我们首先从参考文档中的**主页**开始：

### 编写内容

默认情况下，DocC 会通过列出公共接口，并按类型进行分组来形成**主页**，作为文档的入口。

![home-page.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1624337102089-2f41cefa-6079-42c2-b650-24fbb739d8d1.png)

但我们也可以通过以下步骤进行**自定义**。首先新建一个 Documentation 中的 **Empty** 文件：

![empty-markdown-file@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623416020798-e85d0ad1-47df-4b15-9822-762df4e2187d.png)

用**项目名**给将这个 .md 文件**重命名**，且**标题**  ` ```` ` 中的内容也要是项目名，这样 Xcode 才能在编译时将它们关联起来。标题下方是一段**概要**，接着你可以用 **markup** 语法为文档的主页添加文字、代码、图片、视频等内容。

```markdown
# ``SlothCreator``

Catalog sloths you find in nature and create new adorable virtual sloths.
```

### 重写结构

在我们刚刚编写的文档内容之后，你会发现共接口默认按类型罗列在 **Topic** 主题中，如果你希望按照自己的想法重新组织，可以在主页文件中追加 Topic 部分：

![topics.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1624337319780-36ae01b0-ff0a-4c03-ba99-f924655f7519.png)

其中 `###` 用于给每个**分组命名**。`- <doc:/tutorials/SlothCreator>` 用于**链接** tutorials 目录下名为 SlothCreator 的**文件**。` ```` ` 用于链接到对应的**接口文档**，其内容必须是接口的**完整路径**，如 ` ``SlothCreator/Sloth/eat(_:quantity:)`` `。

Topics 被重构后，可以发现左侧**导航栏**的结构也随之改变：

![top-level-curation@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623417989298-c03e7623-109a-48b2-9b43-adf6e58270e6.png)

如果自行编写的 Topics 中**遗漏**了部分公共接口或 DocC 的文章和教程目录等，它们依旧会以默认（按类型分组）的方式**追加**到自定义的结构之后，以保证文档的完整性。

除了主页可以自定义，各个接口的**参考文档**同样可以自定义。只需新建一个 Documentation 中的 **Extension File**，将**文件名**改为**接口名**，并在第一行 ` ```` ` 中填写接口的**完整路径**。文档内容和 Topics 的编写方式与主页相同，它们会接在**可识别注释**生成的文档内容之后。

```markdown
# ``SlothCreator/Sloth``

## Topics

### Creating a Sloth

- ``init(name:color:power:)``
- ``SlothGenerator``
...
```

需要注意的是标题 `#` 后面的 ` ```` ` 用于给 Xcode以提示：对应的接口名需要被**链接到本篇文档**。正文中 `-` 后面的 ` ```` ` 用于产生一个链接以**跳转到对应的接口文档**。接口内部的成员如果没有被完整列出，也会像主页一样按默认方式追加到末尾。

### 覆盖注释

Extension File 中的内容默认会**追加**在源码注释编译生成的内容之后，但在某些时候我们希望**完全重写**参考文档，这时我们需要在标题下方注明采用**覆盖**方式：

```markdown
# ``SlothCreator/Sloth``

@Metadata {
    @DocumentationExtension(mergeBehavior: override)
}

此处内容会覆盖源码生成的概要。

## Overview

此处内容会覆盖源码生成的综述。
...
```

注意，这一参数的改变并不会影响 **Topics** 中的内容。

## 补充性文章

文档以**接口**为标题进行编写，结构相对死板。而文章则是一种更加**灵活**的方式，可以对框架的其他方面进行**补充说明**。你可以通过新建一个 Documentation 中的 **Article File** 来创建文章。

文章默认会作为结构中的**最顶层**出现在主页和导航栏中。因此，与我们之前编写的内容不同的是，文章的**标题**是常规内容而不是引用。对应的，其**文件名**也没有特殊要求，只有在该文章被引用时才会用到。文章的正文内容同样使用 markup 进行编写，同样可以在末尾追加 Topics 以组织文档结构。

```markdown
# Getting Started with Sloths

Create a sloth and assign personality traits and abilities.

## Overview

Sloths are complex creatures that require careful creation and a suitable
habitat.

...

## Topics

### Essentials

- <doc:/tutorials/SlothCreator>
- ``Sloth``
```

## 交互式教程

交互式教程的效果难以言传，没有体验过的读者可以参考 [SwiftUI Tutorials](https://developer.apple.com/tutorials/SwiftUI) 和 [Catalyst Tutorials](https://developer.apple.com/tutorials/mac-catalyst)。教程是 DocC 中的一大亮点，它主要由**目录**和**教程页**两部分组成：

![building-tutorial@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623466144476-28e9a7f3-b050-4a23-bea2-62837ac50f7f.png)

### 文件格式

教程需要被建立在 documentation catalog 之中。你可以通过新建 Documentation 中的 **Tutorial Table of Contents** 或 **Tutorial File** 来创建目录和教程页，它们都是 .tutorial 文件。只有教程目录能跳转到教程页，所以即使只有一个教程也**必须**编写教程目录。默认情况下 documentation catalog 会包含一个 **Resources** 文件夹，用于储存 DocC 的文档、文章、教程中所使用到的图片、视频、代码等资源。

![tutorial-structure@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623466691617-3233fbea-2658-44d8-a4ab-499ce7b7aa4e.png)

如图所示，markup 文件中使用的图片有[官方的命名建议](https://developer.apple.com/documentation/xcode/formatting-your-documentation-content)：

![docc-image-filename@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623467242539-a775e141-29cd-4807-ae05-8988c4584a8d.png)

其中只有图片名和拓展名为必选项，`~dark` 表示在**暗黑模式**下会使用该图片，`@` 之后所接的内容用于标明不同**显示比例**的设备所使用的图片。采用上述命名方式，只需在 markup 文件中填写**图片名**，DocC 便会自动在文档中动态采用最佳版本的图片。`[ ]` 中是对图片内容的描述，用于给视障人士提供语音提示。

```markdown
![A sloth hanging off a tree.](sloth)
```

**代码资源**没有官方命名规范，由于其主要用在逐步教程中，建议将其命名为 `教程名-章节名-步骤数.swift`。

### 目录编写

在新建目录后 Xcode 会自动填写模版，以帮助开发者入门。**目录的文件名**和 `@Tutorials(name: )` 中的内容一般为**项目名**。

![Intro.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623671771965-31d3509a-d2d0-4c33-a9c7-ddd66e93af08.png)

`@Intro` 指令后紧接着目录的**标题**，教程的**简介**，和一张**封面**图片。预计用时和 Get Started 按钮是基于之后提供的教程页信息**自动生成**的。

![Chapter.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623671810120-43412206-deb9-406a-a2fe-47e8949e4f8c.png)

`@Chapter` 指令用于分类和组织教程，包括了**篇名**，**篇目图片**，**教程引用**。其中 `@TutorialReference` 可以用**文件名**链接到对应的教程页。

一个**目录**（`@Tutorials`）包含一个介绍（`@Intro`）和多个**篇目**（`@Chapter`），一个篇目又可以包含多个**教程页**的引用（`@TutorialReference`）。

### 教程编写

一个**教程页**（`@Tutorial`）包含一个介绍（`@Intro`）和多个**章节**（`@Section`），一个章节只能包含一个**步骤集**（`@Steps`），步骤集之下的**步骤**（`@Step`）是最小的结构。

![interactive-tutorials@2x.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623489284480-12bde795-cc10-47d7-93e4-d6e4a912f23e.png)

教程页的**文件名**没有特殊要求，仅在链接时使用。`@Tutorial(time: )` 中填写浏览该教程页的**预计使时**。该教程所处的篇目名（SlothCreator Essentials）会自动显示。教程页 `@Intro` 的格式和目录的一样。

![Tutorial.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623671936867-31854d00-d05b-46f2-ae59-9f39a216c77f.png)

教程页下的结构为**章节**（`@Section`）。章节用 `@ContenAndMedia` 来显示简介，并且可以通过填写 `(layout: )` 中的参数，调整图片等媒体与文字内容的**排版方式**。

![Section.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623672069702-0d173390-5cbc-4529-bb41-4558a60054c2.png)

`@Step` 中包含一段在左边逐步展示的**说明**，开发者希望文档中**显示的文件名**，代码段**正真的文件名**，和一张**预览图**：

![explain.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1624337422881-9318c701-654f-4223-a01f-c94551a221b4.png)

![name.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623672267138-8354bece-da68-4cf6-946c-800490c4e2fb.png)

![file.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623672303416-5ab0cac0-e8cb-4059-a779-9adc4c4c4ac1.png)

![preview.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623672343533-0d28e0d1-6109-49b1-80c2-0a880e301966.png)

可以看出预览图并非代码编译生成的，需要开发者**提前截图**保存。建议将源码文件和预览图片**规范命名**，并**分组**放到之前提到的 **Resource** 文件夹中，以免产生混乱。

`@Code` 并不是必须的，`@Step` 也可以写成这样：

```markdown
@Step {
    Create a new project using the iOS App template.

    @Image(source: image-Tutorial1-Section1-Step1.png)
}
```

效果如下：

![image-step.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1624337016253-bcc344c2-3485-43a6-91c0-8d726721c916.png)

## 文档的发布

Xcode 编译完文档之后会产生一个 **documentation archive** 文件，你可以将该文件直接从文档中导出：

![export.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623483556705-71155cac-f0b5-4ac2-b9c5-a11d1f4e0302.png)

也可以使用**命令行工具**编译到指定地址：

```bash
xcodebuild docbuild
    -scheme SlothCreator
    -derivedDataPath ~/Desktop/SlothCreatorBuild
```

在编译过程中，Xcode 会在目标地址生成数量众多的文件，可以使用下面的指令进行**定位**：

```bash
find ~/Desktop/SlothCreatorBuild
    -type d -name '*.doccarchive'
```

只需将 .doccarchive 文件包发给其他开发者，就可以用 **Xcode** 将其打开。文件包中主要含有 css、html、js、文档、图片、视频等内容：

![archive.png](https://cdn.nlark.com/yuque/0/2021/png/1246974/1623487047750-c0080ce3-b4b1-42c8-bbde-4174536144c2.png)

由于文件中包含有用于呈现文档内容的 **HTML**，开发者甚至可以将文档托管到网站上。下面以 **Apache** 为例，讲解将文档托管到网站上所需的步骤：

1. 将 .doccarchive 文件**拷贝**到服务器用于提供文件的目录。
2. 在服务器上添加一条规则将以 `/documentation` 或 `/tutorials` 开头的 URL **路由**到 index.html。
3. 再添加一条规则以**支持**文件中的 CSS 和图片等资源。

为了定位到文档，**参考文档**和**文章**的 URL 需要以 `/documentation` 开头，**教程**的 URL 需要以 `/tutorials` 开头。举例来说，如果需要定位到 SlothCreator 文档中一个名为 `SlothGenerator` 的协议，**URL** 如下：

```http
https://www.example.com/documentation/SlothCreator/SlothGenerator
```

以下是 **.htaccess** 文件中配置的内容：

```bash
# Enable custom routing.
RewriteEngine On

# Route documentation and tutorial pages.
RewriteRule ^(documentation|tutorials)\/.*$ SlothCreator.doccarchive/index.html [L]

# Route files within the documentation archive.
RewriteRule ^(css|js|data|images|downloads|favicon\.ico|favicon\.svg|img|theme-settings\.json|videos)\/.*$ SlothCreator.doccarchive/$0 [L]
```

苹果承诺将在今年内**开源** DocC，同时发布一个可以托管非官方文档的应用程序，届时即使不用 Xcode 也可以享用 DocC 的文档工作流程，以上复杂的配置过程也将得到简化。然而，积极主动的第三方已经开始研究 DocC 的**托管服务**了：[Becquer](https://becquer.cloud) 正在施工中。

## 后记

「Talk is cheap, show me the code」的时代已经过去，一份生动的官方文档不仅能为**开源框架**锦上添花，同样也是**降低沟通成本**和**普及新技术**的利器。随着互联网公司的体量越来越大，技术文档浩如烟海，管理起来如海底捞针，不禁成为团队协作的一大障碍。DocC 是苹果提供的新方案，在可预见的未来，无论是科技公司、开源社区还是 IT 教育机构，都将着手通过这一技术优化自己的**文档管理**方式，为程序员间的**技术交流**搭建更高效的**基础设施**。

### 推荐阅读

[SlothCreator: Building DocC Documentation in Xcode](https://developer.apple.com/documentation/xcode/slothcreator_building_docc_documentation_in_xcode)

[Formatting Your Documentation Content](https://developer.apple.com/documentation/Xcode/formatting-your-documentation-content)

[Reimagining Apple’s documentation](https://www.hackingwithswift.com/articles/231/reimagining-apples-documentation)

[How to document your project with DocC](https://www.hackingwithswift.com/articles/238/how-to-document-your-project-with-docc)

[Documenting a Swift Framework or Package](https://developer.apple.com/documentation/Xcode/documenting-a-swift-framework-or-package)

[Writing Symbol Documentation in Your Source Files](https://developer.apple.com/documentation/Xcode/writing-symbol-documentation-in-your-source-files)

[Adding Structure to Your Documentation Pages](https://developer.apple.com/documentation/Xcode/adding-structure-to-your-documentation-pages)

[Adding Supplemental Content to a Documentation Catalog](https://developer.apple.com/documentation/Xcode/adding-supplemental-content-to-a-documentation-catalog)

[Building an Interactive Tutorial](https://developer.apple.com/documentation/docc/building-an-interactive-tutorial)

[Distributing Documentation to External Developers](https://developer.apple.com/documentation/Xcode/distributing-documentation-to-external-developers)
