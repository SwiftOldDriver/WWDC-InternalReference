# 【WWDC21 10210】探索 Xcode 项目中构建配置的高级技巧

> 作者：Edmond, [CocoaPods 历险记](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MTM1NTc2Ng==&action=getalbum&album_id=1477103239887142918) 作者，CS & 长跑爱好者，目前对 Bazel 感兴趣。
> 
> 审核：红纸，iOS 开发，老司机技术周报编辑，就职于淘系技术部

![wwdc21-10210-00-background](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-00-background.png)

> WWDC21 Session 10210 - [Explore advanced project configuration in Xcode](https://developer.apple.com/videos/play/wwdc2021/10210/)。由于官方视频资源有问题，可访问 Youtube [链接](https://www.youtube.com/watch?v=wxISCtR0Po4)。


## 本文知识目录

![Explore advanced project configuration in Xcode](https://gitee.com/looseyi/blog-image/raw/master/uPic/Explore%20advanced%20project%20configuration%20in%20Xcode.png)

## 引言

大多时候我们都关注如何进行高效、高质量的完成任务或技术需求，而对于 Xcode 项目的构成、构建系统和构建配置并不太了解。在今年 WWDC 21 上，苹果将带我们探索 Xcode 项目中构建配置的高级技巧。

本文将重点分三个主题展开：

![wwdc21-10210-01-table](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-01-table.png)

1. 讨论 multiplatform 项目和 Xcode 13 对于 `multiplatform framework` target 的支持。
2. 介绍 target 的 scheme 设置、依赖管理、`Build Phases` 和 `Build Rules`，并提供了最佳实践。
3. 带您深入了解 `Build settings`，包括其结构和行为、UI 编辑器的使用以及 `xcconfig` 的语法等。



## Multiplatform Frameworks

在整个演讲中，我们将使用一个名为 Fruta 的 multiplatform 项目来展示如何将这些技术应用到真实项目中。

![wwdc21-10210-02-xcode](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-02-multi-platform-code.png)

> Tips: 可从官方下载 Fruta 项目的 [SampleCode](https://developer.apple.com/documentation/swiftui/fruta_building_a_feature-rich_app_with_swiftui)，不过与本文中的项目有所出入。

首先讨论的是 `multiplatform frameworks`，它是由 Xcode 13 的带来的一项新功能。

![wwdc21-10210-03-multi-platform-feature](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-03-multi-platform-feature.png)

`multiplatform frameworks` 允许我们将多个框架合并为一个框架，并提供了以下优点：

1. 简化 target 管理；
2. 一组要管理的构建阶段；
3. 一组要管理的 Build Settings。

为了方便理解，这里简单对齐一下 Xcode 的几个概念。

### Xcode Project

正如上图的 Fruta 所示，我们熟悉的 Xcode 项目是由几部分组成的：Project、Target、Build Configuration、Build Settings、Build Phases 等。其概念如下：

- **Project**：为 Target 的管理器，组织源码和资源；
- **Scheme**：指定构建的 target 和 action，action 包括  Build、Run、Test、Profile、Analyze、Archive；
- **Target**：通过定义的 Build Settings、Build Phases、Build Rules 来描述如何构建一个完整产物；
- **Build Settings**：构建设置，提供构建产物的必要信息，如指定使用的编译器、头文件搜索路径、编译参数等；
- **Build Phases**：构建阶段，描述构建 target 产物时候需要执行的各种任务，如编译源码和复制资源等；
- **Build Configuration**：构建配置，描述自定义的构建配置参数，默认有 Debug 和 Release 配置；

> Tips：更多内容推荐阅读 [what is the build system](https://help.apple.com/xcode/mac/current/#/dev5948b27d3)。

<img src="https://gitee.com/looseyi/blog-image/raw/master/uPic/bs_buildsysteminteractions_diagram.png" alt="bs_buildsysteminteractions_diagram" style="zoom: 50%;" />



### Multiplatform Frameworks 配置

Fruta 是一个多平台应用程序，专为 macOS、iOS 和 watchOS 构建。

![wwdc21-10210-04-multi-platform-app](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-04-multi-platform-app.png)

它还具有三个 framework target，每个平台一个，它们之间共享部分代码。另外值得注意的是，还有一份只能在 macOS 上编译的文件。

![wwdc21-10210-05-multi-platform-targets](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-05-multi-platform-targets.png)

维护三个独立的 framework 可能会带来挑战，例如保持 Build Settings 同步，并确保所有源文件都正确添加到编译源的 Build Phases 中。

为了应对这些挑战，先将我们的一个 framework 转换为 `multiplatform framework`。首先让我们导航到 macOS framework target 的 Build Settings 选项卡。 接下来定位到 Build Settings 中的 **Supported Platforms** 设置项，并选择 **Any Platform** 来配置 framework 以针对所有平台构建。

![wwdc21-10210-06-multi-platform-buildSettings-support-platforms](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-06-multi-platform-buildSettings-support-platforms.png)
修改之后，您还可以看到 **Allow Multiplatform Builds** 已自动设置为 "**Yes**”。这会通知构建系统根据需要为其每个受支持的平台构建此 target 一次。既然这是一个 multiplatform framework target，回想一下原始 macOS framework 上有一个额外的文件，它只能为 macOS 构建时构建。为此，我们可以添加一个平台过滤器来指定这个文件应该只为 macOS 构建。

![wwdc21-10210-08-multi-platform-buildPhases-Filters](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-08-multi-platform-buildPhases-Filters.png)

切换到 `Build Phases` 选项卡，展开 Compile Sources 构建阶段，找到 `Ingredient+macOS.swift` 文件并单击“**Filter**” 项，取消选中除 macOS 之外的所有内容，可以快速为 macOS 构建。配置了新的 multiplatform target 之后，我们可以删除其他两个 frameworks。

![wwdc21-10210-09-multi-platform-buildSettings-delete](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-09-multi-platform-buildSettings-delete.png)

此外，由于我们只有一个framework，我们必须配置所有应用程序以链接和嵌入该新目标。而 macOS 应用程序已经配置了 Multiplatform。我们需要转到每个应用程序 Target 的 **General** 选项卡，并将 framework 添加到 `Frameworks and Libraries Build Phases` 中。

![wwdc21-10210-10-multi-platform-buildSettings-frameworks](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-10-multi-platform-buildSettings-frameworks.png)

以上就是 Xcode 13 中的 multiplatform frameworks，小结一下：

![wwdc21-10210-11-multi-platform-summary](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-11-multi-platform-summary.png)

1. 基于 macOS framework target 将其改造为 multiplatform framework；
2. 使用 `platform filter` 来过滤各平台独有的代码和资源文件；
3. 在 Target 的 `Link & Embed ` 的 Buld Phases 中接入新的 multiplatform framework。



## Project model and configuraton

本节我们将讨论建模和配置 Xcode 项目的最佳实践，并展示一些可以提高构建的性能和准确性。



### `Build Options`

首先，让我们看一下该 Scheme 的 `Build Options`，单击 Scheme 选择器进编辑，然后转到 Build 部分配置一些简单的东西。

![wwdc21-10210-12-project-setting-buildOrder](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-12-project-setting-buildOrder.png)

对于 Build Order，我们建议选择 **Dependency Order**，这样项目的 target 将根据依赖关系图并行构建。这可以极大地提高多核构建性能，还可以让您更快地从持续集成中获得结果。

![wwdc21-10210-13-project-setting-buildOrder-manual](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-13-project-setting-buildOrder-manual.png)

相比之下，不推荐使用 **Manual Order**。使用此选项会减慢您的构建速度，并且当 Scheme 中列出的 target 顺序与您的 Build Phases 中定义的 target 依赖不一致时，可能会导致循环依赖错误。亦或者 Scheme 中列出的 target 顺序与 **Find Implicit Dependencies** 生成依赖关系不同时，同样会造成依赖冲突。

说到这里就要提一下在 Xcode 10 中提出的 **Parallelize Build**：

> This option allows Xcode to speed up total build time by building targets that do not depend on each other at the same time. This is a time-saver on projects with many smaller dependencies that can easily be run in parallel.

它的提出时为了加速构建的，不过也引入了一些问题。就像上述 Manual Order 的场景，`Parallelize Build` 会导致依赖错误。为解决这个问题，Xcode 13 提供了 Dependency Order。

为此，我们简单看看 Xcode 中存在哪些targets 的依赖关系 ？



### Dependencies

![wwdc21-10210-13-scheme-build-options-dependency](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-13-scheme-build-options-dependency.gif)

Xcode 是如何判别 task 之间的依赖关系，主要通过下面 5 类方式：

- **Build in**：构建系统的内置信息，即 `Build Rules`，它描述了编译器、链接器、资源目录和 storyboard 处理器等规则，指定了接受什么样的输入和输出文件；
- **Target dependencies**：如 `Build Phases` 中 `Dependencies` 阶段指定的 target 依赖；
- **Implict dependencies**：隐式依赖，它是成功构建 target 的必要条件，但是却未明确指定的依赖，如在 `Build Phases` 的 `Link Binary With Libraries` 阶段指定的二进制文件； 
- **Build Phases dependencies**：构建阶段间的依赖关系，如 headers 拷贝、编译源码、Bundle 拷贝等构建阶段；
- **Scheme order dependencies**：未开启 *隐式依赖查找* 的情况下，以 scheme 列出的 target 顺序依次构建。

> Tips：关于 target dependencies 建议翻看 WWDC 2018 - [Behind the Scenes of the Xcode Build Process](https://developer.apple.com/videos/play/wwdc2018/415/)。



#### Find Implicit Dependencies

Scheme Build Options 中的另一个重要设置是 **Find Implicit Dependencies**（隐式依赖查找）。**开启后，它允许 Xcode 根据项目中的信息自动添加 target 之间的依赖项**，例如 `Build Settings` 中的 `Links Flag` 以及在 `Build Phases` 的 `Link Binary With Libraries` 阶段所指定的二进制文件。

当不同 project 中的 target 存在关联关系时，该特性非常有效。当不同 project 之间无法添加显式目标依赖时，相比于使用 `manual order` 来指定 target 构建顺序的方式，此时启用 `Find Implicit Dependencies` 和 `Dependency Order` 通常是更好的解决方案。

![wwdc21-10210-13-scheme-find-implict-dependencies](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-13-scheme-find-implict-dependencies.png)

### `Build Phases` & `Build Rules`

现在将从项目的 targets 列表中选择 SmoothieKit，然后选择 `Build Phases` 选项卡。这里我们有一个 Process Recipes 的 `Script Phase`，其中包含一些自定义构建逻辑。

![wwdc21-10210-14-buildPhase-recipes](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-14-buildPhase-recipes.png)

这段脚本的职责之一是从多个配置文件中生成代码，每个输入有对应的输出文件，它们将按顺序依次处理。您可能会意识到这些计算是完全相互独立的，而现在 **Build Rules 允许我们通过并行执行来优化任务执行效率**。



#### `Build Rules`

让我们看看如何将这项工作提取到 `Build Rules` 中：

![wwdc21-10210-15-buildRules](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-15-buildRules.png)

切到 framework 项目编辑器的 `Build Rules` 选项卡，然后单击 **+** 以添加新的构建规则。然后输入文件通配符 `*.recipe`，对应我们希望处理的的文件类型的扩展名。接着添加依赖项，**注意：这里不需要向 `Build Rules` 添加任何额外的输入**，因为它会自动获取它处理的每个输入文件作为输入。但是，我们确实需要告诉构建系统所产生的输出文件的路径规则，在 `Output Files` 下新建一个输出路径：

```shell
// Output Files
$(DERIVED_FILE_DIR)/$(INPUT_FILE_BASE).compiledrecipe
```

> Tips：这里将生成文件写入 `DERIVED_FILE_DIR` 交由构建系统来管理适当的存储路径。我们应该避免在源根目录下生成输出文件，因为这会干扰源代码控制并在同时运行多个构建时导致冲突。

接着将 `Build Phase` 的 `Process Recipes` 阶段的脚本复制到 `Build Rules` 中。

![wwdc21-10210-18-buildPhase-recipes](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-18-buildPhase-recipes.png)

```shell
// BuildRules 
"$SRCROOT/Scripts/gen-code.sh" "$SCRIPT_INPUT_FILE" "$SCRIPT_OUTPUT_FILE_0"
```

可以看到这里的 Script 有些不同：

1. 删除了 for 循环，因为 Build Rule 会为它们处理的每个输入运行一次；
2. `$RECIPE` 替换为 `$SCRIPT_INPUT_FILE`;
3. `$RECIPE $DERIVED_FILE_DIR/$RECIPE.compiledrecipe` 替换为 `$SCRIPT_OUTPUT_FILE_0`;

现在还有一件事要在 Build Rule 中配置，由于 `Build Rule` 不仅对它们处理的每个输入运行一次。**默认情况下，它们还会为 target 在每个不同的 CPU 架构下运行一次**。例如，Mac 应用程序 target 中的规则可能会针对 arm64 运行一次，针对 x86_64 的每个输入运行一次。因此，如果有 4 个输入乘以两个架构，则该规则将被调用八次。这对于依赖于 `CPU-架构` 的输入（例如：目标源码）时就很有用。反之，针对不依赖于 `CPU-架构` 的输出，我们可以取消选中 **`Run once per architecture`**。

最后，为了让构建系统将输入文件传播到 `Build Rules` 中，我需要将所有 `.recipe` 文件添加到 framework 的 `Comiple Source Build Phase` 中。

![wwdc21-10210-21-recipes](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-21-recipes.gif)



#### `Shell Script`

现在让我们回到 `Build Phases` 将多个文本文件的内容合并到一个文件中，这样可以在运行时更有效地在应用程序中加载。为了获得更好的代码管理体验，我将脚本保留在项目文件外部，并从此处的内联脚本编辑器中调用它们。![wwdc21-10210-19-package](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-19-package.png)

![wwdc21-10210-20-package-call](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-20-package-call.png)

因为我们需要一次处理所有输入以将它们合并为一个。在这种情况下，不合适使用 `Build Rules`，因为我们无法将其分解为可以并行运行的独立单元，因此将这项工作保留在 `Script Phases` 是有意义的。

但这给我们带来了很重要的隐患：**脚本没有指定输入和输出依赖项。这可能会导致构建任务以错误的顺序运行并减慢构建速度**，Xcode 在并行运行其他任务方面必须更加保守，因为它不知道 `Script Phases` 可能使用哪些文件。因此，需要添加输入和输出依赖项，以确保 `Script Phases` 任务与构建中的其他任务，是按照合理顺序完成的。



#### XCFileList

对于这个需要大量输入的特定脚本，我们可以使用 XCFilelist 通过外部文件管理这个输入列表，而不是一个一个地在项目文件中输入。

![wwdc21-10210-22-fileLists](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-22-fileLists.gif)

完整的操作路径如上图，我们将 xcfilelist 作为指定的 **Input File List**。另外还需要指定 Output File List：

```shell
// Output File list
$(PROJECT_TEMP_DIR)/instructions.mdarchive
```



#### Environment Variables

与 `Build Rules` 类似，`Script Phases` 为您提供了一些关键的环境变量。来看一下 package.sh 的内容：

```shell
# Package up the recipes.

echo "packaging..."

for i in $(seq 0 $(expr ${SCRIPT_INPUT_FILE_LIST_COUNT} - 1)) ; do
    infile_="SCRIPT_INPUT_FILE_LIST_$i"
    eval infile=\$$infile_

    while IFS= read -r file; do
        cat "$file" >> "$SCRIPT_OUTPUT_FILE_0"
    done < "$infile"
done
```

- `SCRIPT_INPUT_FILE_LIST_COUNT`：指传递给我们的 `Script Phases` 的输入文件列表的总数；
- `SCRIPT_INPUT_FILE_LIST_n`：指解析出的输入文件列表在第 n 个索引处的绝对文件路径;
- `SCRIPT_OUTPUT_FILE_0`：指第一个解析的绝对文件路径，在这种情况下只有输出文件；



**0x01**：以下是提供给 `Script Phases` 的一些关键环境变量的概述：

```shell
// These environment variables are available in script phases:

SCRIPT_INPUT_FILE_COUNT // This specifies the number of paths from the Input Files table.
SCRIPT_INPUT_FILE_n // This specifies the absolute path of the nth file from the Input Files table, with build settings expanded.

SCRIPT_INPUT_FILE_LIST_COUNT // This specifies the number of input file lists.
SCRIPT_INPUT_FILE_LIST_n // This specifies the absolute path of the nth "resolved" input file list with contained paths made absolute, build settings expanded, and comments removed.

SCRIPT_OUTPUT_FILE_COUNT // This specifies the number of paths from the Output Files table.
SCRIPT_OUTPUT_FILE_n // This specifies the absolute path of the nth file from the Output Files table, with build settings expanded.

SCRIPT_OUTPUT_FILE_LIST_COUNT // This specifies the number of output file lists.
SCRIPT_OUTPUT_FILE_LIST_n // This specifies the absolute path of the nth "resolved" output file list with contained paths made absolute, build settings expanded, and comments removed.

* n in the above examples refers to a 0-based index.
```

target 的 `Build Settings` 可用于 `Script Phases` 环境。



**0x02**：以下是提供给 `Build Rules` 的一些关键环境变量的概述：

```shell
// These environment variables are available in build rules:

SCRIPT_INPUT_FILE // This specifies the absolute path of the main input file being processed by the rule.

OTHER_INPUT_FILE_FLAGS // This specifies custom command line flags defined for the input file in the Compile Sources build phase.

SCRIPT_INPUT_FILE_COUNT // This specifies the number of paths from the Input Files table.
SCRIPT_INPUT_FILE_n // This specifies the absolute path of the nth file from the Input Files table, with build settings expanded.

SCRIPT_OUTPUT_FILE_COUNT // This specifies the number of paths from the Output Files table.
SCRIPT_OUTPUT_FILE_n // This specifies the absolute path of the nth file from the Output Files table, with build settings expanded.

SCRIPT_HEADER_VISIBILITY // This is set to "public" or "private" if the input file being processed is a header file in a Headers build phase, and its Header Visibility is set to one of those values.

HEADER_OUTPUT_DIR // This specifies the output directory to which the input file should be copied, if the input file being processed is a header file in a Headers build phase.

* n in the above examples refers to a 0-based index.
```


这里概述了一些 Build Rules 特有的及一些不太常见的环境变量。另外 `Build Settings` 设置也可用于 `Build Rules` 环境。



#### Aggregate target

现在，如果尝试构建项目，则会遇到问题。让我们去构建日志仔细看看。

![wwdc21-10210-23-prebuild](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-23-prebuild.png)

因为 SmoothieKit 是一个 multiplatform target，它构建了两次：一次用于 iOS，一次用于 watchOS，这意味着这些构建中的每一个都试图在同一路径上生成脚本阶段的输出。**这是不允许的，因为构建系统要求整个构建中只有一个任务可以在给定路径上产生输出。**

有几种不同的方法可以解决这个问题。一种简单的解决方案是更改 `Script Phases` 的输出路径，以便每次构建目标时它都是唯一的。在这种情况下，可以考虑使用不同的 `Build Settings`，如 `DERIVED_FILE_DIR`，它是特定于平台的，可以使路径足够独特并解决冲突。但是，如果 `Script Phases` 正在执行的实际工作在每个 target 的上下文中是相同的，那只会导致相同的工作被执行两次。在这种情况下，将 `Scirpt Phase` 移动到共享 framework target 所依赖的 Aggregate target 中可能是更好的选择。

![wwdc21-10210-28-Resources](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-28-Resources.gif)

这就是我们要为该项目做的事情：

1. 将 Process Recipes 的内容复制到新建的 aggregate target 中；
2. 将 aggregate target 作为 SmoothieKit 的依赖项引入；
3. 删除原有的 Process Recipes 的 Script Phase；

这样改造后工作只会完成一次，不会有输出文件冲突，并且框架的 iOS 和 watchOS 变体都将按照相对于该脚本阶段的正确顺序构建。



## Build settings deep dive

最后一节，我们深入探讨一下 `Build Settings` 的有关内容。

那什么是 `Build Settings` ？它作为 Xcode target 的属性，用于配置任务构建的方方面面。Xcode 提供了两种配置方式：

1. 通过 `Build Settings` 编辑器;
2. 通过 configuration settings file 即 `.xcconfig` 文件;



### Build Settings 编辑器

让我们看看如何使用 Build Settings 编辑器来管理我们项目中的设置。

![wwdc21-10210-32-buildsetting-level](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-32-buildsetting-level.png)

首先需要在项目导航器中选择对应的 Project 和 Target，并单击选项卡栏上的 `Build Settings` 选项卡。上图我们打开的是 Fruta Project -> Fruta macOS Target 的 Build Settings 编辑器。

从这里，您可以添加新的 Build Settings 或修改现有的设置。您还可以通过打开快速帮助检查器来查找所选 `Build Settings` 的其他信息。

![wwdc21-10210-33-buildsetting-quickhelp](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-33-buildsetting-quickhelp.png)

`Build Settings` 存在在多个 “级别” 的定义，可以通过单击上图中的 `Levels` 过滤器来可视化这些级别。您可以将其视为一个定义栈，settting 值从栈底到栈顶优先级逐级覆盖。

下图中，每列代表了不同级别的 Build Settings 定义，它们从右到左进行 evaluation。

![wwdc21-10210-33-buildsetting-colume](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-33-buildsetting-colume.png)

- 上图中红框的为默认值，由当前选择的 SDK 定义；
- Project 级别的配置，由 configuration settings file 指定；
- Project 级别的配置，由 Xcode 项目文件 (.xcodeproj) 指定；
- Target 级别的配置，由 configuration settings file 指定；
- Target 级别的配置，由 Xcode 项目文件 (.xcodeproj) 指定；
- 最后一个为 Resolved Value，`Build Settings` 的最终解析值；

请注意，如果您看到一个粗体的设置，表示该级别对于 Build Settings 具有明确指定的值。

### Configuration settings file

Xcode 提供的另一种管理 Build Settings 的机制是 `configuration settings file` 或 `.xcconfig` 文件。

它有以下优点：

- 更好的源代码控制管理；
- 跨目标或配置以共享设置；
- Build Settings 的高级组合；
- 基于开发或测试环境来配置不同 xcconfig 文件的能力。

让我们来看看如何在 xcconfig 文件中创作 Build Settings。

#### Build setting definition with conditions

![wwdc21-10210-34-buildsettings-conditions](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-34-buildsettings-conditions.png)

最基本的 `Build Settings` 由名称、赋值运算符和值组成。您可以使用条件语法缩小 `Build Settings` 的值。条件设置使用方括号定义，支持的条件包括 `config`、`arch` 和 `sdk`。如上图中的 `sdk` 条件所示，通配符也可用于匹配目的。另外也可以使用熟悉的双斜线语法来添加注释。

#### Build setting evaluation

![wwdc21-10210-35-buildsettings-evaluation](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-35-buildsettings-evaluation.png)

在此处的示例中，`MY_OTHER_BUILD_SETTING` 已设置为 YES。`MY_BUILD_SETTING_NAME` 的值使用 `$` 括号来引用 `MY_OTHER_BUILD_SETTING` 所生成的值。也可以在这里生成多个值，就像我们在 `MORE_SETTINGS` 中看到的那样。
最后，您可以通过 `$(inherited)` 变量在保留现有值的情况下来添加新的附加值。这是一种方便的形式，因为您还可以使用 `Build Settings` 名称 `APPEND_TO_EXISTING_SETTINGS`。

#### Build setting composition

![wwdc21-10210-36-buildsettings-composition](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-36-buildsettings-composition.png)

`Build Settings` evalution 语法的另一个用途是将 `Build Settings` 从一组其他 `Build Settings` 组合在一起。

1. 我们从一个控制设置开始：`IS_BUILD_SETTING_ENABLED`，将使用此设置的值作为两个附加 `Build Settings` 的后缀，`MY_BUILD_SETTING_NO` 和 `MY_BUILD_SETTING_YES`。
2. 将 `MY_BUILD_SETTING` 定义为一个由 `MY_BUILD_SETTING` 和 `IS_BUILD_SETTING_ENABLED` 组成的值。因为 `Build Settings` 的 evaluation 是由内而外发生的，所以最里面的设置被评估并返回 NO，这是 `IS_BUILD_SETTING_ENABLED` 的值。
3. 最终组合的 `BUILD_SETTING_NO` 被评估为 `-use_this_one` 的值。

#### Build setting evaluation operators

在 Build Settings evaluations 时，您可以使用一组运算符来提供您的值的一些基本转换。
提供的运算符有三类：`字符串运算符`、`路径运算符`和`替换运算符`。

**String operators**

![wwdc21-10210-38-buildsettings-evaluation-operators-string](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-38-buildsettings-evaluation-operators-string.png)

支持的字符串运算符:
- `quote`，它对字符串中的字符进行转义；
- `lower & upper`，转换字符的大小写；
- `identifier`，将字符串转换为各种格式的有效标识符;

**Path operators**

![wwdc21-10210-39-buildsettings-evaluation-operators-path](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-39-buildsettings-evaluation-operators-path.png)

路径运算符可以用来获取目录、文件名、基本名称、后缀和标准化路径。

**Replacement operators**

![wwdc21-10210-40-buildsettings-evaluation-operators-replacement](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-40-buildsettings-evaluation-operators-replacement.png)

对于每个路径运算符，都有一个替换的对应物，允许您替换值的一部分。还有一个默认操作符，如果 `Build Settings` 为空，它会提供替换值，否则它使用现有值。

#### Including other configuration settings files

![wwdc21-10210-41-buildsettings-including](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-41-buildsettings-including.png)

要查看的最后一项是 `xcconfig` 文件的引用能力，它可在其他 `xcconfig` 文件中被引用。我们提供了两种机制：
- 强制引用，它要求引用的 `xcconfig` 文件在于磁盘上一定存在。如果找不到该文件，则会产生编译器错误。  
- 可选引用，它允许包含一个 `xconfig` 文件（如果存在于磁盘上）。如果文件不存在也不会失败。

请注意，该路径与 Xcode 项目文件的位置相关。



### Practial example

让我们来看看如何在真实场景中将所有这些信息放在一起。在这个例子中，我们将看看如何解决以下问题。在我们的开发机器上，编译器应该主动警告那些需要太长时间进行类型检查的表达式。但是，CI 机器速度较慢，因此应该增加表达式检查的时间。对于我们的解决方案，有三个 `configuration setting files`：debug、common 和 ci:

![wwdc21-10210-43-xcconfig](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-43-xcconfig.png)

**debug.xcconfig file**
用于我们的调试构建，并通过 `OTHER_SWIFT_FLAGS` 设置将一些额外的标志传递给 Swift 编译器。

**common.xcconfig file**
以可选地方式引入 `ci.xcconfig` 文件。它还定义了 `OTHER_SWIFT_FLAGS` 来控制类型表达式警告。它使用 `$(inherited)` 来确保包含任何其他标志设置，例如是否来自 `debug.xcconfig` 文件。另外设置了默认值为 200 的 `MAX _EXPRESSION_TIME` 的 evaluation 设置。

**ci.xcconfig file**   
它覆盖了 `MAX_EXPRESSION_TIME` 的值。

最后，需要告诉 Xcode 如何将这些 xcconfig 文件应用到支持的配置级别。这是通过项目编辑器完成的。您可以在 Project 或 Target 级别应用项目中的任何配置文件，用于任何定义的 `Build settings`。

![wwdc21-10210-44-example-configuration](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10210-44-example-configuration.png)

在这里，您可以看到 `debug.xcconfig` 文件正在 Project 级别应用于 Fruta 的调试配置。还有 `common.xcconfig` 文件应用这在多个 target 的配置中。

最后总结一下解决方案：

- 默认运算符用于定义 `MAX_EXPRESSION_TIME` 的默认值。
- `ci.xcconfig` 文件是可选的，因为它只存在于 CI 系统上。
- `ci.xcconfig` 文件中使用了 `MAX_EXPRESSION_TIME` 的默认值。

> 上述 Fruta 项目的 `Build Settings` 截图根据官方 Sessions 内部修改而来，详见 SampleCode 地址



## 总结
本文算是苹果对于 Xcode 工程配置的简单介绍，并通过实际项目的上手来展示一些高级技巧。更多的相关技术建议翻阅文本中提供的相关链接和官方文档。

- 了解 `multiplatform framework` 以及它们如何提供一种更简单的方法来管理 multiplatform 项目中的 `Build Settings` 和 `Build Phases`。
- 了解如何通过根据依赖关系顺序并行构建目标来改进项目配置和构建性能，如何正确使用 `Build Rules` 和 `Build Phases`，以及指定依赖关系的重要性。
- 深入研究了 `Build Settings`、如何使用 build Settings files 以及更轻松地管理它们，并深入研究了它们的语法及其提供的所有构造。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
