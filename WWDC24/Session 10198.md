# Session 10198 运行、暂停、检查：探索如何使用LLDB进行有效调试
![](images/截屏2024-07-07%2017.36.06.png)

## 概述
本文以 WWDC24-10198 为主线，综合了 WWDC19-24 期间多个和调试主题相关的 Session，向大家介绍如何使用 Xcode IDE
和 LLDB 的最新能力，进行有效和高效的调试。同时还介绍了如何处理使用相关工具碰到的常见问题和一些高级技巧。

整个文章分为三个部分。第一部分是定义调试的一般模型；第二部分重点介绍 LLDB 调试的多个不同能力，包含代码回溯、断点和变量表达式
值打印( p 命令)等能力，这里我们除了讨论在不同调试场景，结合断点设置和表达式评估的常见手段，如何实现不编译打印程序状态的能力外，
还会探讨变量表达式评估背后的运作机制和不同打印命令的异同；第三部分我们将讨论调试中碰到的恼人问题的处理方法和
综合运用之前提到的各种调试方法的高级技巧。

## 调试的模型
调试时，我们通常会在程序出现错误的时间点得到信息。这可能是崩溃，显示不正确的值，甚至是程序挂起。从程序执行开始到问题发生之间，执行了错误的代码。我们的目标是要找到这段错误的代码。常见的方法是，通过在不同的时间点检查程序的状态来找到错误，每次检查都会使我们更接近问题代码。我们有两种方法来解决这个问题。第一种是使用代码打印的日志，定位错误发生的时间节点和对应的代码行。这依赖开发人员的预见性来决定要记录哪些有用的信息。如果日志记录偏少，或者关键节点缺乏日志，或者因为性能原因关闭了高频的调试日志，就可能导致搜索范围过大，无法高效的定位问题。 
我们要讨论的是第二种方法，就是打印调试技术，这可能是我们所有人学习的第一个调试方法。 通过打印调试，我们在程序中插入打印语句，重新编译代码，运行程序，并重现错误。最后，我们检查打印的消息。如果我们想打印新的内容，我们需要重复整个过程。 最终，我们将检查足够的程序状态以修复错误。
![](images/截屏2024-07-07%2020.01.55.png)
但是这种方式效率低下，因为需要不断的重新编译和运行程序。奥对了，我们还不能忘记在最后的 Release 版本，移除那些打印语句。而 LLDB 调试器可以帮助优化这个流程，在程序运行时检查程序状态，不需要重新编译和运行程序。当使用 LLDB 调试器时，调试模型看起来像是如下的样子的，它将使用接下来要介绍的 LLDB 两个关键的调试能力：断点和变量表达式评估。
![](images/截屏2024-07-07%2020.06.57.png)

## LLDB 调试能力
### 示例工程
为了能够介绍如何在实际应用中使用LLDB的调试能力，我们创建了一个示例工程Destination video, 从服务器下载的JSON文件加载远程视频，现在看起来工作的不太正常，有时候启动就崩溃了。

### 代码回溯
当我们在处理崩溃问题时，通常从解析一个崩溃日志开始。LLDB 的*代码回溯*能力，可以读取并解析崩溃日志，根据符号信息，直接定位到方法调用链和发生崩溃的代码行。为了让 LLDB 调试器定位到正确的代码行，要满足以下两个条件：一、本地包含崩溃版本的dSYM符号文件；二、本地包含崩溃版本的源代码。
Xcode打开Destination video的崩溃日志，通过代码回溯的能力，我们获得了一些崩溃相关的初始信息：崩溃发生在加载JSON文件的代码位置，调用堆栈显示APP当时正在加载视频的元信息
![](images/截屏2024-07-07%2021.50.01.png)
我们先看看是否可以复现这个线上崩溃。

### 断点
为了理解加载视频的过程，我们基于SwiftUI创建一个新功能，用户可以点击按钮，将视频添加到“稍后观看”列表中。这可以帮助我们理解视频的元信息是如何被加载的。
我们可以在相关代码行设置断点，来分析用户点击按钮后的程序运行状态。在创建按钮的代码行设置一个行断点。lldb会将行断点解析为三个不同的位置，这表明三个不同的代码路径会在该断点停止。
![](images/截屏2024-07-07%2022.22.54.png)
它们分别是
- 按钮构造函数执行时
- 按钮事件响应函数执行时
- 按钮构造函数的尾随闭包被执行时
为了进一步理解创建按钮时的程序状态，我们禁用#2，#4两个断点，通过 p 命令检查“Watch Later”列表大小（之后我们会详细介绍这个命令）。顺便说一句，如果我们想在尾随闭包执行时中断，Xcode13开始提供了一个更简便的方式，就是直接在对应闭包代码前设置列断点，调试器可以精确的在执行到列对应的那个尾随闭包时停下来。

每次断点触发时，在LLDB console通过p命令，手动查看变量状态较为低效，有没有办法自动化这个流程呢。我们可以通过定义断点的触发Action，把 `p watchItemList.count`加入到Action中去,自动化这个流程。有两种方法来设置: 一种是通过在断点的面板，设置动作栏，注意要全选Continue After Action，这样执行完动作后就会继续执行代码；第二种就是在LLDB console通过命令行来设置，代码如下
```shell
break command add
Enter your debugger command(s). Tpe 'DONE' to end.
> p "current watc item list count is \(watchItemList.count)"
> continue
> DONE
```
重新运行APP后，Console会自动打印当前视频数组大小的信息了。这样的能力就类似在相关的代码加入了打印语句去探测程序的状态，但是好处是不用每次重新编译了！
同时我们注意到这些LLDB的调试手段，都可以通过命令行来完成，我们将在第三部分详细介绍常用的LLDB调试命令和高级技巧。

我们要调查视频加载的逻辑是否存在问题，因此在以下的循环体内增加了一个断点
```swift
for video in Videos {
    if (video.hasRemoteMedia) {
        video.loadRemoteMedia()
    }
    processVideo(video)
}
```

因为在循环体内，因此这个断点会被反复触发。对这种高频触发断点，很多时候我们会希望在满足某些条件下才触发。这里，有三种技术来做到这一点。
- 仅当某个表达式条件满足时触发，我们可以在断点设置中增加条件表达式
- 仅当之前某个方法（假设为A）也被调用时触发（假设为B），women可以在A的断点动作中追加临时断点和自动执行，临时断点设置为在B中断
- 循环中，忽略前N次遍历，在N+1次触发

仔细分析上面的代码片段，它遍历集合中的视频，若视频位于远程位置，则加载视频并处理它们。如果想调查从远程加载较长的视频媒体是否存在问题，可以使用#1和#2两个方法来进行设置。我们可以修改断点，当当前视频超过60秒时中断程序。 在Xcode中，右键点击断点，导航到编辑断点，并填充条件字段。 为了保证只对调用了loadRemoteMedia函数的执行，中断在之后的processVideo，可以使用tbreak命令，在loadRemoteMedia上设置自动继续断点，并在processVideo上创建临时断点的动作。 
img: high-firing-#1-#2.png
需要指出的是，以上的处理技术，虽然减少了断点触发的时机，但是由于每次都会判断断点条件，因此会显著影响APP运行速度。如果想要解决这个问题，需要修改代码，在满足中断条件下，手动触发SIGSTOP信号，触发中断。
代码示意如下。
code: raise_sigstop.code
让我们看看我们程序的另一个部分：接受JSON解码器的Video构造函数，怀疑其中一个try语句有问题，但如果我们在每次调用Video构造函数时都中断，我们将会遇到问题：应用程序中有太多的视频！幸运的是，我们涵盖了可以处理这种高触发断点的技术。我知道我的新视频是应用程序中的第12个视频，所以我可以给这个断点应用一个忽略计数。 但是这次，让我们尝试一些新的东西：Swift Error断点。 这种类型的断点指示lldb在抛出Swift错误时立即停止应用程序。让我们点击继续！程序在我们尝试解码imageName JSON键的Error断点处停止。 那里存在问题。 让我们使用回溯返回到较早的帧，我们可以使用p command做一些编程来弄清楚这个data数组中存在多少个imageName，通过检查count属性发现只有12个名为imageName的键，但是我们预期应该有13个image。 通过查看JSON文件，我们发现在拼写其中一个imageName时打错了字。这就是问题的真正原因！


需要指出的是，除了之前介绍的行、列断点以及Swift错误断点之外，还包含以下几种类型的断点
- 符号断点
- 异常断点

有时候，你并没有问题发生模块的源代码；或者问题并不发生在确定的代码行，而是在访问某个变量时才出问题，这时候可以使用符号断点来定位相关的疑似问题代码。为了确认相关符号是否存在，可以使用以下LLDB代码来确认
code: image_lookup.code
虽然使用IDE添加符号断点很方便，我更喜欢使用LLDB console添加，方法如下
code: lldb_console_add_symbolic_bp.code

TODO：异常埋点


### 变量和表达式评估
在之前介绍断点设置，我们已经一撇了使用p命令，打印当前中断现场变量值的能力。LLDB具有强大的运行时，表达式评估的能力，现在我们要详细的介绍这个能力。
所谓的表达式评估指的是，可以在程序中断的现场，对上下文中的变量，构造表达式来考察对应的状态。
例如如果我们想知道“Watch Later List”的数组的大小是否符合预期，那么就可以在LLDB console构造如下的表达式
code: p_expr_1.code
只要是能编译的代码都可以这么做。
为什么LLDB可以做到这一点呢？这是因为LLDB不仅是个调试器，同时也是一个编译器。它包含一个全功能版本的Clang和Swift编译模块。
为了能够正确打印表达式的值，需要让LLDB正确推导其中变量的类型。
首先我们看看最常见的p命令是怎么做的
它分析打印表达式值的流程如下
img: img_expr.png
- 创建第一个临时方法，Wrapper表达式
- 编译并执行这个方法，返回表达式的计算结果
- 使用动态类型推导获取计算结果的实际类型（而不是静态类型）
- 将带类型的结果输出到格式化模块
- 得到格式化后的字符串打印结果
在分析OC代码时，我们会使用po命令，它的流程如下
img: img_expr_o.png
- 创建第一个临时方法，Wrapper表达式
- 编译并执行这个方法，返回表达式的计算结果
- 创建第二个临时方法，方法内调用之前计算结果对象的description方法，如果是OC或者Swift对象，这个调用就能够成功
- 编译并执行第二个方法，返回description方法的字符串，并打印结果
其实po和p两个命令都是expr命令的别名，如下所示
code: expr_alias.code
p和po的关键性区别是，p使用运行时的动态类型推导来判断计算表达式结果的类型，因此如果结果的动态类型和静态类型是不同的，那么p可以正确推导出类型，打印正确的字段属性；
下面的代码显示一个例子，trip对象声明为Activity协议类型，静态类型是Activity，而实际上它指向Trip构造的实例，动态类型是Trip。
code: p_po_diff.code
可以看到，通过p命令，可以打印name和destinations字段，而po却不行。为了让po正确打印，你必须要显式的向下转型成Trip类型，如下代码所示
code: po_down_cast.code
如果要访问动态类型的字段name或者destinations，也需要先类型转换，再访问。这里需要指出的是使用p命令，直接写p trip.name的方式也会报错，这是因为p的动态命令推导只作用于表达式的最终结果，而不是中间值。

我们再来看看和他们完全不同的命令v，它的流程如下
img: img_v.png
- 检查程序状态
- 从内存读取变量的值
- 使用动态类型推导获取变量的类型
- 如果打印的是变量的多级字段，那么会对循环遍历字段，并对每个字段进行动态类型推导
- 将返回的结果输出到格式化模块
- 得到格式化后的字符串打印结果
为了得到最终的结果，v对变量的多级字段都会进行动态类型推导。因此当变量的动态类型和静态类型不同时，v不需要进行向下类型转换就可以访问动态类型的字段，上面那个例子用v可以简便的写成
code: v_no_down_cast_need.code

现在我们用下表总结下p po和v的区别和联系
TODO: p_po_v_diff.table

看起来，记住不同命令的应用场景，并且正确使用看起来有点费劲。好在从Xcode15开始，我们只要使用p就可以了，它整合了p、v和expr等命令；如果我们确实不像访问LLDB的formatter，
而是想使用自定义的description方法，那么就使用po，这样是不是简单多了。
说起自定义description，对于Swift来说，需要实现CustomDebugStringConvertible协议。Swift6简化了这个流程，可以把使用@DebugDescription来自定义输出。
记得还需要创建一个总结类型的DebugDescription字符串属性，返回自定义输出的字符串，这样就可以了。


## LLDB调试技巧和常见的问题
### 技巧1 - 更便捷的打印Log信息
之前我们提到可以使用断点Action的Debugger Command，使用 p 命令，不用编译就可以实现打印变量和程序状态信息。如果我们想像打印日志一样，可能需要加一些描述信息，如下面代码所示。
```
p [NSString stringWithFormat:@"The count of array is %ld", array.count]
``` 
这看起来有一点繁琐，我们可以利用Xcode断点Action另外一个功能 Log Message 功能，简化这个流程.
img: img_bp_log_message.img
可以使用的宏参数，包括
- @exp@: 表达式
- %B： 断点名
- %H 断点命中次数

### 技巧2 - 利用断点插入代码，实时改变代码的行为
我们之前提到LLDB还是一个编译器，利用expr命令，可以在断点Action插入多段可编译的代码。因此我们除了打印程序状态外，甚至可以改变程序的行为。
假设有如下代码
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
当myVar=0，我们想要改为100，并打印处理，可以这么做
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

### 技巧3 - 利用别名和脚本添加自定义 LLDB 命令
当你对 LLDB 命令越来越了解，操作越来越骚的时候，你会发现小小的控制台会限制你的发挥，这个时候你需要一个更大的舞台。
现在我要展示如何使用 Python 脚本执行命令。Apple开发工程师编写了一个 Python 脚本（nudge.py），可以帮助我们简单、快速地移动 UI 控件。如果我们要在LLDB中使用，需要将 nudge.py 文件放入你的用户根目录 ~/nudge.py。
然后在用户根目录下新建一个 ~/.lldbinit 文件，并加入下方命令和别名：
```
command script import ~/nudge.py
command alias poc expression -l objc -O --
command alias 🚽 expression -l objc -- (void)[CATransaction flush]
```
做完这些，我们就可以来使用我们的自定义命令nudge x-offset y-offset [view] 了，具体用法如下：
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
这样我们就可以运行时实时调整元素位置了！
关于如何编写Python脚本和LLDB进行互操作，可以查看<https://lldb.llvm.org/use/python.html>

### 技巧4 -  在汇编调用栈中打印方法实参
在第二章，我们提到了符号断点（Symbolic Breakpoint），当我们不知道具体代码位置，只知道和某个方法调用或者某个变量的访问有关，就会用到它。
例如，我们设置了符号断点 [UILabel setText:]，当所有页面下的 UILabel 类型对象在设置text属性的时候都会执行该断点。那如果我们想知道哪个Label设置了什么Text，该怎么做呢？
注意到，断点触发会停在以汇编码显示的方法调用的入口位置。在方法调用时，LLDB提供了预定义的变量，可以访问用作方法参数传递的，寄存器的值。
在OC里，＄arg1存储调用方法的对象本身，$args2是方法SEL的地址，$args3是第一个参数的对象地址，这个例子也就是设置的text的NSString对象地址，直接po就可以显示text的内容。

### 技巧5 - Swift 调用栈中在 LLDB 调试器使用 Obj-C 代码命令
在日常调试中，使用 LLDB 命令 po [self.view recursiveDescription] 命令来输出页面视图结构是非常方便的，然而我们在 Swift 调用栈中使用这个命令的时候将打印以下错误：
```
po self.view.recursiveDescription()
error: <EXPR>:3:6: error: value of type 'UIView?' has no member 'recursiveDescription'
self.view.recursiveDescription()
~~~~~^~~~ ~~~~~~~~~~~~~~~~~~~~
```
其实我们可以通过 “expression -l objc -O -- ” 命令来使用 Obj-C 代码来输出我们想要的视图结构，记得 self.view 两边一定要加上 ` 符号。
```
expression -l objc -O -- [`self.view` recursiveDescription]
```
这个命令有点冗长，我们可使用`command alias poc expression -l objc -O —-` 来创造别名，这样就可以使用``poc [`self` label]``来查看当前ViewController下Label的视图结构

### 问题1- 加载了dSYM，只显示汇编码，不显示源代码，没法进行行断点设置？
当发生这个问题，可以通过`image lookup -va $pc`来检查汇编PC地址的相关符号信息。如果发现代码行(LineEntry)指向了远程服务器上的路径位置，很可能是因为加载的dSYM符号文件是从公司内部的CI系统生成的。为了解决这个问题，我们可以使用`setting set target.source-map prefix new`重定向源码位置，就可以解决问题。如果觉得每次启动Xcode，在LLDB console执行这个设置比较繁琐，可以在.lldbinit启动配置文件，写入这个设置命令，就可以自动加载了。

### 问题2 - 可以在源代码进行断点设置，但是p和po不工作？
有时候，即使正确加载了符号信息，使用命令打印Swift变量名，仍然会出现如下错误
 ```
 error: expression failed to parse:
 error: Couldn't realize type of self
 ```
这常常出现在调试第三方提供二进制的静态库中，大部分问题是因为Swift相关符号的类型信息没有被成功链接到dSYM文件中去，而p和po能否如期工作，需要LLDB能够正确加载类型信息。
我们可以使用Xcode14开始提供的诊断命令`swift-healthcheck`来查看相关符号的加载情况。如果在LOG文件，有如下的问题提示，那就表明缺少类型信息。
```
Missing Swift module or Clang module found for Some3rdParty.swifitmodule...Hint: Register Swift modules with the linker using -add_ast_path
```
这时候，可以让第三方使用如下命令，重新打包swiftmodule，就可以正确加载Swift类型信息了
```
ld … -add_ast_path /path/to/Some3rdParty.swiftmodule
```
当获取了新的swiftmodule时，重新编译链接后，我们可以使用下面的命令来验证dSYM是否包含了相关的类型信息`dsymutils -s MyApp | grep Some3rdParty.swifitmodule`.
