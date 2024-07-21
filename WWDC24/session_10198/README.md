---
session_ids: [10198]
---

# Session 10198 运行、暂停、检查：探索如何使用 LLDB 进行有效调试

![](images/截屏2024-07-07%2017.36.06.png)

## 概述

本文基于[Session 10198](https://developer.apple.com/videos/play/wwdc2024/10198/) 为主线，综合了 WWDC19-24 期间多个和调试主题相关的 Session，其中包含

- [WWDC23 10226](https://developer.apple.com/videos/play/wwdc2023/10226/)
- [WWDC22 110370](https://developer.apple.com/videos/play/wwdc2022/110370/)
- [WWDC21 10209](https://developer.apple.com/videos/play/wwdc2021/10209)
- [WWDC21 10211](https://developer.apple.com/videos/play/wwdc2021/10211)
- [WWDC19 429](https://developer.apple.com/videos/play/wwdc2019/429/)

向大家介绍如何使用 Xcode IDE 和 LLDB 的最新能力，进行有效和高效的调试。同时还介绍了如何处理使用相关工具碰到的常见问题和一些高级技巧。

整个文章分为三个部分。第一部分是定义调试的一般模型；第二部分重点介绍 LLDB 多个不同的调试能力，包含代码回溯、断点和变量表达式值打印( p 命令)等能力，我们会深入讨论如调试中常见的技巧，例如打印程序状态和处理高频埋点等，然后还会深入探讨变量表达式评估背后的运作机制以及不同打印命令的异同；
第三部分我们将讨论一些很有用的高级技巧和调试中碰到的恼人问题的处理方法。

## 调试的模型

调试代码可以看作是一个搜索问题。我们需要从程序执行开始到问题发生的时间点之间，不断检查程序的状态来找到错误的代码位置和时间点。解决这个问题有两种方法：

1. **使用代码打印的日志**：通过日志定位错误发生的时间节点和对应的代码行。这依赖开发人员的预见性来决定要记录哪些有用的信息。如果日志记录偏少，或者关键节点缺乏日志，或者因为性能原因关闭了高频的调试日志，就可能导致搜索范围过大，无法高效地定位问题。
2. **打印调试**：在代码中插入打印语句，重新编译代码，运行程序，通过打印信息检查程序的状态是否符合预期。这种方法效率较低，因为需要不断地重新编译和运行程序，并且在 Release 版本中还需要移除打印语句。
![](images/截屏2024-07-21%2020.33.59.png)

好在 LLDB 调试器可以优化这个流程，不需要重新编译程序，就可以在程序运行中断时检查上下文的状态。调试模型将使用接下来要介绍的 LLDB 的两个关键调试能力：断点和变量表达式评估。
![](images/截屏2024-07-07%2020.06.57.png)

## LLDB 调试能力

### 示例工程

为了能够介绍如何在实际应用中使用 LLDB 的调试能力，我们创建了一个示例工程 Destination video, 它从服务器下载的 JSON 文件加载远程视频。现在看起来工作的不太正常，有时候启动就崩溃了。我们需要使用 LLDB 的调试能力定位崩溃的原因。

### 代码回溯

处理崩溃问题时，通常从解析崩溃日志开始。LLDB 的代码回溯能力可以读取并解析崩溃日志，根据符号信息直接定位方法调用链和发生崩溃的代码行。为了让 LLDB 调试器定位到正确的代码行，需要满足以下两个条件：

1. 本地包含崩溃版本的 dSYM 符号文件
2. 本地包含崩溃版本的源代码

在 Xcode 中打开 Destination video 的崩溃日志，通过代码回溯能力，我们获得了一些崩溃相关的初始信息：崩溃发生在加载 JSON 文件的代码位置，调用堆栈显示 APP 当时正在加载视频的元信息。
![](images/截屏2024-07-07%2021.50.01.png)

### 断点

为了理解加载视频的过程，我们基于 SwiftUI 创建了一个新功能，用户可以点击按钮将视频添加到“稍后观看”列表中。这可以帮助我们理解视频的元信息是如何被加载的。我们可以在相关代码行设置断点，来分析用户点击按钮后的程序运行状态。

![](images/截屏2024-07-07%2022.22.54.png)
在创建按钮的代码行设置一个行断点。LLDB 会将行断点解析为三个不同的位置，表明三个不同的代码路径会在该断点停止：

1. 按钮构造函数执行时；
2. 按钮事件响应函数执行时；
3. 按钮构造函数的尾随闭包被执行时。

为了进一步理解创建按钮时的程序状态，我们禁用#2，#3 两个断点，通过 p 命令检查“Watch Later”列表最新加入的视频的名字（之后我们会详细介绍这个命令）。顺便说一句，如果我们想在尾随闭包执行时中断，Xcode13 开始提供了一个更简便的方式，直接在对应闭包代码列位置前设置*列断点*，调试器可以精确的在执行到列对应的那个尾随闭包时停下来。

#### 为断点关联自动触发动作

每次断点触发时，在 LLDB console 通过 p 命令手动查看变量状态较为低效，有没有办法自动化这个流程呢？我们可以通过定义断点的触发 Action，把 `p watchItemList.last!.name` 加入到 Action 中去，自动化这个流程。有两种方法来设置：

![](images/截屏2024-07-21%2020.41.12.png)

1. 在断点的面板的动作 Action 栏，设置打印命令，注意要同时勾选 Continue After Action，这样执行完动作后就会继续执行代码；
2. 在 LLDB console 通过命令行来设置，代码如下：

```
(lldb) break command add
(lldb) Enter your debugger command(s). Type 'DONE' to end.
> p "current watch item list count is \(watchItemList.last!.name)"
> continue
> DONE
```

重新运行 APP 后，Console 会自动打印当前视频数组大小的信息了。这样的能力就类似在相关的代码加入了打印语句去探测程序的状态，但好处是不用每次重新编译了！同时我们注意到这些 LLDB 的调试手段都可以通过命令行来完成，我们将在第三部分详细介绍常用的 LLDB 调试命令和高级技巧。


#### 处理高频断点

我们要调查视频加载的逻辑是否存在问题，因此在以下的循环体内增加了一个断点

```swift
1 for video in Videos {
2    if (video.hasRemoteMedia) {
3        video.loadRemoteMedia()
4    }
5    processVideo(video)
6 }
```

仔细分析上面的代码片段，它遍历处理列表中的视频，若视频位于远程位置，则先加载再处理。如果我们想检查那些远程的长视频（例如大于 60s 长度的）的处理是否存在问题，直接在第五行设置行断点看起来不是个好主意，这样中断的次数太多了。针对这样的高频断点，我们可以为断点触发设置条件，来限制中断的时机。这个例子中，可以这样设置断点：对第三行设置断点，增加断点条件 `video.length > 60`，然后使用 `tbreak` 命令在 `processVideo` 方法执行的第五行建立新的行断点，并设置第三行的断点为自动执行。这一系列动作可以通过下面的代码来处理。（这里假设第三行断点的 ID 是 1）

```
(lldb) break modify 1 --condition "video.length > 60"
(lldb) break command add 1
(lldb) Enter your debugger command(s). Type 'DONE' to end.
> tbreak sample.swift:5 // tbreak是建立一次性生效断点的命令
> continue
> DONE
```

如果视频很多，想跳过前 10 个视频，可以在断点处设置`--ignore-count 10`来进一步限制。

```
break modify 1 --ignore-count 10
```

#### 避免高频断点条件判断影响 APP 性能

以上几个方法都是处理高频中断的常用技术。虽然减少了断点中断的时机，但由于每次 LLDB 还是需要判断断点条件，因此会显著影响 APP 性能。如果想要解决这个问题，需要修改代码，在满足中断条件下，手动触发 SIGSTOP 信号，触发中断。

```swift
1  for video in Videos {
2     if (/*这里写入中断条件*/) {
3         raise(SIGSTOP)
4     }
5   
6     if (video.hasRemoteMedia) {
7         video.loadRemoteMedia()
8     }
9     processVideo(video)
10  }
```

#### Swift Error 断点

![](images/截屏2024-07-08%2014.40.15.png)
回到我们开始的崩溃问题，在 JSON 解码器的 Video 构造函数，我们怀疑执行其中一个 try 语句会有问题。但如果我们在每次调用 Video 构造函数时都中断，我们将会遇到问题：应用程序中有太多的视频。我们已经知道可以使用断点条件来跳过前面的视频。 不过这次，我们来尝试一些新的东西：Swift Error 断点。 这种类型的断点指示 LLDB 在抛出 Swift 错误时立即停止应用程序。让我们点击继续！程序在我们尝试解码 imageName JSON 键的 Error 断点处停止，那里存在问题。让我们使用回溯返回到较早的帧，我们可以使用 p 命令做一些编程来弄清楚这个 data 数组中存在多少个 `imageName`，通过检查 count 属性发现只有 12 个名为 imageName 的键，但是我们预期应该有 13 个 image。 通过查看 JSON 文件，我们发现在拼写其中一个 imageName 时打错了字。这个崩溃的代码位置和堆栈调用与之前线上崩溃完全一致，我们终于定位到了问题的真正原因！


#### 其它断点

需要指出的是，除了之前介绍的行、列断点以及 Swift 错误断点之外，还包含以下几种类型的断点

##### 符号断点

有时候，我们没有问题发生模块的源代码；或者怀疑访问某个变量或调用方法时会出问题，这时可以使用符号断点来帮助检查程序状态。为了确认相关符号是否存在，可以使用以下 LLDB 代码来确认

```
image lookup -n symbol
```

然后在命令行添加符号断点

```
break set -n symbol
```

##### 异常埋点

在 LLDB 中，我们还可以设置异常断点来捕捉 Objective-C 异常。这在调试涉及异常处理的代码时非常有用。你可以使用 `breakpoint set -E` 命令来设置异常断点。例如，有如下代码例子：

``` ObjectiveC
#import <Foundation/Foundation.h>

@interface MyClass : NSObject
- (void)foo;
@end

@implementation MyClass
- (void)foo {
    @throw [NSException exceptionWithName:@"TestException" reason:@"Just testing" userInfo:nil];
}
@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        MyClass *myObject = [[MyClass alloc] init];
        @try {
            [myObject foo];
        } @catch (NSException *exception) {
            NSLog(@"Caught exception: %@", exception);
        }
    }
    return 0;
}
```

我们可以这样捕捉 TestException 异常

```
(lldb) breakpoint set -E objc
(lldb) breakpoint command add 1
(lldb) Enter your debugger command(s). Type 'DONE' to end.
> expr (void)[exception.name isEqualToString:@"TestException"] ? (void)0 : (void)continue
> DONE
```

注意，这里我们用到`expr`命令，用于对表达式进行编译评估，在下一章我们会详细介绍它。

### 变量和表达式评估

之前介绍断点设置时，我们已经使用 `p` 命令打印了当前 Video 数组的大小。`p` 命令可以跟随和代码一样的表达式。为什么 LLDB 可以做到这一点呢？因为 LLDB 不仅是个调试器，同时也是一个编译器。它包含一个全功能版本的 Clang 和 Swift 编译模块。为了能够正确打印表达式的值，需要让 LLDB 正确推导其中变量的类型。

首先我们看看最常见的 `p` 命令是怎么做的，它分析打印表达式值的流程如下：
![](images/截屏2024-07-08%2015.04.52.png)

1. 创建一个临时方法，用于包含并计算表达式的值；
2. 编译并执行这个方法，返回表达式的计算结果；
3. 使用动态类型推导计算结果的实际类型（而不是静态类型）；
4. 将带类型的结果输出到格式化模块；
5. 得到格式化后的字符串打印结果。

在分析 OC 代码时，我们会使用 po 命令，它的流程如下
![](images/截屏2024-07-08%2015.03.28.png)

1. 创建第一个临时方法，用于包含并计算表达式的值
2. 编译并执行这个方法，返回表达式的计算结果
3. 创建第二个临时方法，方法内调用之前返回的结果对象的 `description` 方法，如果是 Objective-C 或者 Swift 对象，这个调用就能够成功
4. 编译并执行第二个方法，返回 `description` 方法的字符串，并打印结果

其实 `po` 和 `p` 两个命令都是 `expr` 命令的别名，如下所示：

```lldb
expr // p
expr -O -- // po
```

`p` 和 `po` 的关键性区别是，`p` 使用运行时的动态类型推导来判断计算表达式结果的类型，因此如果结果的动态类型和静态类型是不同的，那么 `p` 可以正确推导出类型，打印正确的字段属性。下面的代码显示一个例子，`trip` 对象声明为 `Activity` 协议类型，静态类型是 `Activity`，而实际上它指向 `Trip` 构造的实例，动态类型是 `Trip`。

```swift
protocol Activity {}
struct Trip: Activity {
    var name: String
    var destinations: [String]
}

let cruise: Activity = Trip(..)
```

通过 `p` 命令，可以打印 `name` 和 `destinations` 字段，而 `po` 却不行。为了让 `po` 正确打印，你必须要显式地向下转型成 `Trip` 类型，如下代码所示：

```
(lldb) po (cruise as! Trip)cruise
(Travel.Trip) $RO = {
    name = "Some Cruise"
    destinations = 3 values {
        [0] = "Sorrento"
        [1] = "Capri"
        [2] = "Taormina"
    }
}
```

如果要访问动态类型的字段 `name` 或者 `destinations`，也需要先类型转换再访问。需要指出的是，使用 `p` 命令，直接写 `p trip.name` 的方式也会报错，这是因为 `p` 的动态命令推导只作用于表达式的最终结果，而不是中间值。

我们再来看看和它们完全不同的命令 `v`，它的流程如下：
![](images/截屏2024-07-08%2015.15.59.png)

1. 检查程序状态；
2. 从内存读取变量的值；
3. 使用动态类型推导获取变量的类型；
4. 如果变量有多级字段，那么会循环遍历字段，并对每个字段进行动态类型推导；
5. 将返回的结果输出到格式化模块；
6. 得到格式化后的字符串后打印结果。
  
为了得到最终的结果，`v` 对变量的多级字段都会进行动态类型推导。因此当变量的动态类型和静态类型不同时，`v` 不需要进行向下类型转换就可以访问动态类型的字段。上面那个例子用 `v` 可以简便地写成：

```
(lldb)  v cruise.name
(String) cruise.name = "Some Cruise" 
```

现在我们用下表总结下 p po 和 v 的区别和联系
![](images/截屏2024-07-08%2015.17.44.png)

记住这些不同命令的应用场景，正确使用看起来有点费劲。好在，从 Xcode15 开始，我们只要记住 `p` 和 `po` 两个命令就可以。`p` 整合了 `v` 和 `expr` 命令。如果不想使用 LLDB 的 formatter，而想使用 `description` 方法，那么就使用 `po`，它整合了 `vo` 和 `expr -O` 命令。这样是不是简单多了。

说起自定义 `description`，对于 Swift 来说，需要实现 `CustomDebugStringConvertible` 协议。Swift6 简化了这个流程，可以使用 `@DebugDescription` 来自定义输出。记得还需要创建一个总结类型的 `DebugDescription` 字符串属性，返回自定义输出的字符串。


## LLDB 调试技巧和常见的问题

### 技巧 1 - 更便捷的打印 Log 信息

之前我们提到可以使用断点 Action 的 Debugger Command，使用 `p` 命令，不用编译就可以实现打印变量和程序状态信息。如果我们想像打印日志一样，可能需要加一些描述信息，如下面代码所示：

```
p [NSString stringWithFormat:@"The count of array is %ld", array.count]
```

这看起来有一点繁琐，我们可以利用 Xcode 断点 Action 另外一个功能 Log Message 功能，简化这个流程.
![](images/截屏2024-07-09%2020.55.36.png)
可以使用的宏参数，包括:

- @exp@: 表达式
- %B： 断点名
- %H 断点命中次数

### 技巧 2 - 利用断点插入代码，实时改变代码的行为

我们之前提到 LLDB 还是一个编译器，利用 `expr` 命令，可以在断点 Action 插入多段可编译的代码。因此我们除了打印程序状态外，甚至可以改变程序的行为。假设有如下代码：

```
#include <stdio.h>

int main() {
    int myVar = 0;
    printf("myVar before: %d\n", myVar);
    // Breakpoint will be set here
    printf("myVar after: %d\n", myVar);
    return 0;
}
```

当 `myVar=0` 时，我们想要改为 100，并打印处理，可以这么做：

```
(lldb) b main
Breakpoint 1: where = a.out`main + 18 at main.c:6, address = 0x0000000100000f42
(lldb) breakpoint command add 1
Enter your debugger command(s). Type 'DONE' to end.
> expr if (myVar == 0) myVar = 100
> expr printf("Log: myVar is changed to %d\n", myVar)
> continue
> DONE
```

### 技巧 3 - 利用别名和脚本添加自定义 LLDB 命令

当你对 LLDB 命令越来越了解，操作越来越熟练时，你会发现小小的控制台会限制你的发挥，这个时候你需要一个更大的舞台。现在我要展示如何使用 Python 脚本执行命令。Apple 开发工程师编写了一个 Python 脚本（nudge.py），可以帮助我们简单、快速地移动 UI 控件。如果我们要在 LLDB 中使用，需要将 nudge.py 文件放入你的用户根目录 `~/nudge.py`。

然后在用户根目录下新建一个 `~/.lldbinit` 文件，并加入下方命令和别名：

```
command script import ~/nudge.py
command alias poc expression -l objc -O --
command alias 🚽 expression -l objc -- (void)[CATransaction flush]
```

做完这些，我们就可以来使用我们的自定义命令 nudge x-offset y-offset [view] 了，具体用法如下：

```
// 引用 nudge
(lldb) command script import ~/nudge.py
The "nudge" command has been installed, type "help nudge" for detailed help.
// 拿到对象指针
(lldb) po myLabel
▿ Optional<UILabel>
  - some : <UILabel: 0x7fc04a60fff0; frame = (57 141; 42 21); text = 'Label'; opaque = NO; autoresize = RM+BM; userInteractionEnabled = NO; layer = <_UILabelLayer: 0x600001d36c10>>
  
// Y轴向上偏移5
(lldb) nudge 0 -5 0x7fc04a60fff0
```

这样我们就可以在运行时，实时调整元素位置了！

[ Facebook Chisel 库](https://github.com/facebook/chisel/)包含了很多方便页面及其他调试的自定义命令，例如可以通过 caflush 命令强制刷新当前的页面，这样通过 expr 设置的视图的位置或者其他属性改动就可以立即生效。这样可以一定程度达到不重新编译代码，即时查看布局调整后的效果。其他细节，大家可以按照官方的指引，安装以后体验下。

### 技巧 4 - 如何编写 Python 脚本增强 LLDB 调试能力

刚才提到了可以使用脚本来增强 LLDB 调试能力，我们用一个例子来简单说一下如何编写一个 Python 脚本。

假设我们想要遍历打印某个 ViewController 下的子视图的信息，可以编写如下的 Python 脚本

``` Python

import lldb
def print_view_hierarchy(debugger, command, result, internal_dict):
    # 获取当前调试目标、进程、线程和帧
    target = debugger.GetSelectedTarget()
    process = target.GetProcess()
    thread = process.GetSelectedThread()
    frame = thread.GetSelectedFrame()
    
    # 查找变量
    value = frame.FindVariable(command.strip())
    if not value.IsValid():
        result.PutCString("Invalid variable")
        return
    
    # 打印视图层次结构
    print_views_recursive(value, result, 0)

def print_views_recursive(view, result, level):
    indent = '  ' * level
    view_class = view.GetObjectDescription()
    
    result.PutCString(f"{indent}{view_class}")
    
    subviews = view.GetChildMemberWithName("subviews")
    subviews_count = subviews.GetNumChildren()
    
    for i in range(subviews_count):
        subview = subviews.GetChildAtIndex(i)
        print_views_recursive(subview, result, level + 1)

def __lldb_init_module(debugger, internal_dict):
    debugger.HandleCommand('command script add -f view_hierarchy_printer.print_view_hierarchy print_view_hierarchy')
    print("The 'print_view_hierarchy' command has been installed. Usage: print_view_hierarchy <view_variable>")
```

解释下以上的代码

1. 通过 `import lldb`来引入 LLDB 库
2. 在`__lldb_init_module`方法注册自定义命令，命令的名字是`print_view_hierarchy`
3. 在`print_view_hierarchy`方法中执行逻辑流程，注意到它通过 LLDB debugger 的能力先找到当前栈帧的变量信息，然后调用`print_views_recursive`执行具体遍历打印子视图的逻辑。在这个方法里，注意到调用一个对象实例的方法是通过`GetChildMemberWithName`，获取数组元素数和访问数组元素分别是通过`GetNumChildren`和`GetChildAtIndex`来做

这样就可以在 LLDB 调试器加载使用了，如下所示

``` LLDB
(lldb) command script import /path/to/view_hierarchy_printer.py
(lldb) break set -n viewDidLoad
Breakpoint 1: where = MyApp`-[ViewController viewDidLoad] at ViewController.m:6, address = 0x0000000100000f4a
(lldb) run
(lldb) print_view_hierarchy self.view
<UIView: 0x7fa1d070b610; frame = (0 0; 375 667); layer = <CALayer: 0x60000022e160>>
  <UIView: 0x7fa1d070c290; frame = (50 50; 200 200); layer = <CALayer: 0x60000022e960>>
    <UIView: 0x7fa1d070c7b0; frame = (10 10; 50 50); layer = <CALayer: 0x60000022ec60>>
    <UIView: 0x7fa1d070ca90; frame = (70 70; 50 50); layer = <CALayer: 0x60000022f0a0>>
```

如果想要了解更多 Python LLDB API 的信息，可以查看[LLDB Python API References](https://lldb.llvm.org/python_api.html)

### 技巧 5 -  在汇编调用栈中打印方法实参

在第二章，我们提到了符号断点（Symbolic Breakpoint），当我们不知道具体代码位置，只知道和某个方法调用或者某个变量的访问有关，就会用到它。例如，我们设置了符号断点 `[UILabel setText:]`，当所有页面下的 UILabel 类型对象在设置 `text` 属性的时候都会执行该断点。如果我们想知道哪个 Label 设置了什么 Text，该怎么做呢？

注意到，断点触发会停在以汇编码显示的方法调用的入口位置。在方法调用时，LLDB 提供了预定义的变量，可以访问用作方法参数传递的寄存器的值。在 Objective-C 里，`$arg1` 存储调用方法的对象本身，`$arg2` 是方法 SEL 的地址，`$arg3` 是第一个参数的对象地址，这个例子也就是设置的 `text` 的 NSString 对象地址，直接 `po` 就可以显示 `text` 的内容。

### 技巧 6 - Swift 调用栈中在 LLDB 调试器使用 Obj-C 代码命令

在日常调试中，使用 LLDB 命令 `po [self.view recursiveDescription]` 命令来输出页面视图结构是非常方便的，然而我们在 Swift 调用栈中使用这个命令的时候将打印以下错误：

```
po self.view.recursiveDescription()
error: <EXPR>:3:6: error: value of type 'UIView?' has no member 'recursiveDescription'
self.view.recursiveDescription()
~~~~~^~~~ ~~~~~~~~~~~~~~~~~~~~
```

其实我们可以通过 `expression -l objc -O --` 命令来使用 Objective-C 代码来输出我们想要的视图结构，记得 `self.view` 两边一定要加上 ` 符号。

```
expression -l objc -O -- [`self.view` recursiveDescription]
```

这个命令有点冗长，我们可使用`command alias poc expression -l objc -O —-` 来创造别名，这样就可以使用``poc [`self` label]``来查看当前 ViewController 下 Label 的视图结构

### 问题 1 加载了 dSYM，只显示汇编码，不显示源代码，没法进行行断点设置？

当发生这个问题，可以通过`image lookup -va $pc`来检查汇编 PC 地址的相关符号信息。如果发现代码行 (LineEntry) 指向了远程服务器上的路径位置，很可能是因为加载的 dSYM 符号文件是从公司内部的 CI 系统生成的。为了解决这个问题，我们可以使用`setting set target.source-map prefix new`重定向源码位置，就可以解决问题。如果觉得每次启动 Xcode，在 LLDB console 执行这个设置比较繁琐，可以在.lldbinit 启动配置文件，写入这个设置命令，就可以自动加载了。

### 问题 2 可以在源代码进行断点设置，但是 p 和 po 不工作？

有时候，即使正确加载了符号信息，使用 po 命令打印 Swift 变量名，仍然会出现如下错误

 ```
 error: expression failed to parse:
 error: Couldn't realize type of self
 ```

这常常出现在调试第三方提供二进制的静态库中，大部分问题是因为 Swift 相关符号的类型信息没有被成功链接到 dSYM 文件中去，而 `p` 和 `po` 能否如期工作，需要 LLDB 能够正确加载类型信息。我们可以使用 Xcode14 开始提供的诊断命令 `swift-healthcheck` 来查看相关符号的加载情况。如果在 LOG 文件，有如下的问题提示，那就表明缺少类型信息：

```
Missing Swift module or Clang module found for Some3rdParty.swifitmodule...
Hint: Register Swift modules with the linker using -add_ast_path
```

这时候，可以让第三方使用如下命令，重新打包 `swiftmodule`，就可以正确加载 Swift 类型信息了：

```
ld … -add_ast_path /path/to/Some3rdParty.swiftmodule
```

当获取了新的 `swiftmodule` 时，重新编译链接后，我们可以使用下面的命令来验证 dSYM 是否包含了相关的类型信息：


```lldb
dsymutils -s MyApp | grep Some3rdParty.swiftmodule
```

---
希望这篇文章能帮助你更好地理解和使用 LLDB 进行调试。Happy Debugging!
