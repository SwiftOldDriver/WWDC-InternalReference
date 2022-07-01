---
session_ids: [10048]
---

# Session 10048 - Safari 和 WebKit 新特性介绍

本文是根据 [What's new in Safari and WebKit](https://developer.apple.com/videos/play/wwdc2022/10048/) 进行撰写，其主要介绍过去一年苹果在 Webkit 上的努力。

过去一年，对 Safari 开发团队来说是极为忙碌的一年 —— 完成了 5 个 `Release` 版本的迭代以及包括 16.0 `Beta` 版本在内的两个 `Beta` 版本，而往年的  `Release`  版本均不超过 2 个。

![session_10048_01](./images/session_10048_01.png)

## 引言

为了更好的理解为什么 Wbkit，我们需要一些基础知识，认识一下 Webkit 是做什么的，以及解决我一直以来听到的某个论点—— `iOS` 和 `Androi`  的浏览器内核都是 `WebKit`。

我们可以从狭义上和广义上来理解 `Webkit`

* 狭义上，[WebKit](https://zh.wikipedia.org/zh-sg/WebKit) 是一种用来让[网页浏览器](https://zh.wikipedia.org/wiki/网页浏览器)[绘制](https://zh.wikipedia.org/wiki/渲染)[网页](https://zh.wikipedia.org/wiki/網頁)的[排版引擎](https://zh.wikipedia.org/wiki/排版引擎)。

* 广义上，[WebKit](https://en.wikipedia.org/wiki/WebKit) 是 Apple 开发的浏览器引擎，主要用于其 Safari 网络浏览器以及所有 iOS 网络浏览器。

> 我这里对狭义上和广义上定义分别来源于维基百科中英文版本的两种对 Webkit 的定义。

今天我们介绍的 `Webkit` 其应该被认为是浏览器引擎。一个完整的浏览器引擎，其基本架构如下图所示。

> 图片来源 [WebKit 渲染引擎特性，以 Chrome V8 为例](https://blog.csdn.net/abraham76/article/details/124632284)

![session_10048_02](./images/session_10048_02.png)

浏览器引擎工作的原理就是将输入的 `HTML`、`CSS` 和 `JavaScript` 进行处理，并最终输出我们看到的完整的、可以进行交互的并且可以在多平台展示的具体网页。

### 历史故事

浏览器最核心的部分是浏览器内核，内核主要组成部分有两个：

* 排版引擎，用于解析 HTML，CSS 并做页面渲染
* JS 引擎，用于解释执行 JavaScript 代码

基于这个视角我们再看下浏览器和浏览器内核的一些历史故事。

初代图形浏览器可以追溯到 Mosaic，它诞生于 1993 年，由 NCSA 开发。Mosaic 的主要开发者嗅到商机建立 Netscape 公司，并发布了 Netscape Navigator（网景浏览器）。微软获取了 Mosaic 的授权开发了 IE 浏览器，并以此为基础推出了 Trident 内核。网景浏览器被 IE 彻底打败，后来建立了Mozilla 组织，开发维护另一个浏览器内核 Gecko，基于此内核推出了 Firefox 浏览器。

除了Gecko 还有一个优秀的浏览器框架是 KHTML。macOS 早期需要一个浏览器，Apple 就将目光锁定在了[KDE](https://zh.wikipedia.org/wiki/KDE) 的 [KHTML](https://zh.wikipedia.org/wiki/KHTML)和 [KJS](https://zh.wikipedia.org/zh-sg/KJS) ，并以此为基础开发了 WebKit。WebKit 的排版引擎是 WebCore，JS引擎是 JavaScriptCore，其最早用于 Safari 浏览器。

Google 的 Chrome 早期使用了 WebKit 的 WebCore 作为排版引擎，JS 引擎为其自研的 V8。之后 Google 不再满足于 WebCore 的能力，在其之上开发了 [Blink](https://zh.m.wikipedia.org/zh-sg/Blink)渲染引擎，[Blink](https://zh.m.wikipedia.org/zh-sg/Blink)和 V8 一起构成了 Chromium 内核。
历史轮转，微软这边，IE 一度落后于其他主流浏览器。于是推出了 Edge 浏览器，Edge 内核早期采用 EdgeHTML 和 Chakra 进行排版引擎和 JS 引擎，但仍然没有太多起色。之后微软宣布将 Chakra 开源，新的 Edge 转为 Chromium 内核。

## 功能与改进

仅仅在过去的一年中，有 7 个版本 Safari 版本并共有 162 项新的 Web 平台功能和改进。

![session_10048_03](./images/session_10048_03.png)

我将参照 [What's new in Safari and WebKit](https://developer.apple.com/videos/play/wwdc2022/10048/) 中的分类，对更新内容一一说明。

* HTML
* CSS
* Web Inspector
* Web API
* JavaScript 和 WebAssembly
* Security 和 Privacy

### 前端基础知识

在详细介绍相关内容之前，需要你有一定的基础知识：

元素：用标签 `<>` 创建的，常见的元素有 `<div>`、`<h1>` 到 `<h6>` 等，元素可以理解整个 `DOM` 树中的一个节点

属性：创建元素时，其支持一些基本的配置项，这些配置项称之为属性

选择器：通过 `id`，元素类型等途径，匹配到对应的元素，这里对应的可以是一个，也可以是一类

伪类：主要是为了已有元素添加样式，其本身是符合某条件的元素`已存在`

* 状态伪类：在某种状态下的元素，如 `:hover`、`:active`、`:focus`
* 结构性伪类： 符合某种查找条件下的元素，如在 `DOM` 树查看 `:first-child`、`:nth-child(n)`、`:checked` 之类的

伪元素：不是通过标签 `<>` 创建的，但是可以在 `DOM` 树中找到这个节点，伪元素就是伪类对应的`状态`

### HTML

下图列举了过去一年，在 `HTML` 上，Safari 有了那些更新

![HTML](./images/HTML.png)

#### `<dialog>`

新增 `<dialog>` 元素标签，这是可以在覆盖于所以展示元素最顶端的对话框。新的 `<dialog>`  元素提供了一种非常简单的方法来以一种健壮且可访问的方式来创建覆盖整个页面元素的对话框，在这个对话框中，我们可以进行部分操作。

测试时你可以通过设置 `open` 属性来显示对话框。

示例代码如下：

```html
<!-- 指示这个对话框是激活的和能互动的。当这个 open 属性没有被设置，对话框不应该显示给用户。推荐使用 .show() 或 .showModal() 方法来渲染 对话框，而不是使用 open 属性。 -->
<dialog method="dialog" open> 
  <form id="dialogForm">
    <label for="givenName">Given name:</label>
    <input class="focus" type="text" name="givenName">
    <label for="familyName">Family name:</label>
    <input class="focus" type="text" name="familyName">
    <label>
      <input type="checkbox"> Can trade in person
   </label>
   <button>Send</button>
  </form>
</dialog>

```

你可以通过查看 [`<dialog>`](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/dialog) 来获取更多用法。

#### `<img>`

另一个值得关注的更新是在`<img>` 元素上添加了对具有加载属性的图像的延迟加载支持。

将 `<img>` 元素的 `loading` 属性设置成 `lazy`，对于第一次加载时不在屏幕上的图片，仅当图片被滚到屏幕的可视区域时，浏览器才会加载它们，这使得页面感觉更快，响应更快。

示例代码如下：

```html
<img src="images/shirt.jpg" loading="lazy"
     alt="a brown polo shirt"
     width="500" height="600">
```

通过利用浏览器的原生支持而不是通过监听屏幕的滚动的偏移量来计算，能够真正释放生产力。

### CSS

同样，我们通过一张图来看一下过去一年有哪些 CSS 上新增的特性

![CSS](./images/CSS.png)

#### `::backdrop`

新增了 `::backdrop` 的伪元素支持，可以将大多数浏览器默认的黑色背景色进行修改，下面的示例代码修改了上述示例  `dialog` 对话框的背景色。

```css
/* ::backdrop pseudo-element */

dialog::backdrop {
  background: linear-gradient(rgba(233, 182, 76, 0.7), rgba(103, 12, 0, 0.6));
  animation: fade-in 0.5s;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

#### Container Queries

另外一个值得注意的点是，在 Safari 16.0 Beta 版本中提供容器查询的技术—— [Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)，容器查询技术致力于解决当容器大小不同时，其内在的布局情况随之改变

```css
/* Container queries */

.container {
  container-type: inline-size;
  container-name: clothing-card;
}
.content {
  display: grid;
  /* 示例代码提供的 grid-template-rows：1fr 修饰的是行高，请参照下面代码修改列*/
  grid-template-columns: 1fr;
  gap: 1rem;
}
@container clothing-card (width > 250px) {
  .content {
    grid-template-columns: 1fr 1fr;
  }
  /* additional layout code */
}
```

当页面宽度超过 `250px` 时，列表每行的元素将从 1 行变成 2 行。

#### CSS Cascade

我们知道 CSS 就是一系列规则组装而成的样式描述语言，当我们在多个层级中对用一个属性设置不同值得时候就会产生冲突，浏览器用来解决这种冲突的机制我们称之为**级联**或者**层叠**。

在 Safari 16.0 Beta 这种机制进行了更迭，文章称之为 `powerful change`。

现有的浏览器机制会根据复杂的计算来确定具体元素的样式，而在新的 Safari 中，你可以通过在 CSS 中定义图层的顺序来确定哪个图层对其他图层具有权力。此时， 无论使用的选择器的特殊性如何，一整层都胜过另一整层。

也许你可以使用它们让设计系统与覆盖或用于项目自定义样式的框架分开。

```css
/* Author Styles - Layer A */
@layer utilities {
  div {
    background-color: red;
  }
}

/* Author Styles - Layer B */
@layer customizations {
  div {
    background-color: teal;
  }
}

/* Author Styles - Layer C */
@layer userDefaults {
  div {
    background-color: yellow;
  }
}
```

你可以查看 [CSS Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) 来加深你对样式层叠机制的理解。

#### :has()

另一个令人惊叹的新增功能是 `:has()`，这是一个伪类，可以充当父选择器。你可以结合 CSS 中的任何其他选择器，并通过 `:has()` 来查找同级元素、属性、表单字段的状态等等。

```css
<!-- :has() pseudo-class -->

<style>
  form:has(input[type="checkbox"]:checked) {
    background: #ff927a;
  }
</style>

<form class="message">
  <textarea rows="5" cols="60" name="text" 
    placeholder="Enter text"></textarea>
  <div class="checkbox">
    <input type="checkbox" value="urgent"> 
    <label>Urgent?</label>
  </div>
  <button>Send Message</button>
</form>
```

无需额外的方法，通过 `:has()`我们可以完成对表单内某个元素的查找，并判断当状态为选中时当前表单的样式。

#### viewport units（视口单位）

![session_10048_08](./images/session_10048_08.png)

在  Safari 15.4 中，添加了包括小型，大型，动态和逻辑四大类共计 20 种视口单位的支持。

这对移动开发者来说是一个值得注意的点，当浏览器的视口因滚动而改变时，开发者可以根据根据最小、最大和动态的视口大小来修改 Web 布局。

请按照如下方式来记忆这些

> `s for small`、 `l for large` 、`d for dynamic`、 `v for viewport`、 `h for height`、 `w for width`、 `i for inline`、 `b for block`

对于移动端开发者来说 [inline](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Inline_formatting_context) 内联样式和 [block](https://developer.mozilla.org/zh-CN/docs/Glossary/Block/CSS) 块样式可能需要着重理解一下。

我们在[【WWDC22 10049】探索 iOS 16 中 WKWebView 的新功能](https://xiaozhuanlan.com/topic/7295803164) 中更加详细的介绍了关于视口单元的信息，你可以阅读获取更多。

#### 偏移路径

当我们需要创建一个绕圆旋转的动画是，在早期通过 CSS 动画，其代码如下

```css
@keyframes circle{
    from{
        transform: translate(50%, 150px)
        rotate(0turn)
        translate(-50%, -150px)
        translate(50%,50%)
        rotate(1turn)
        translate(-50%,-50%)
    }
    to{
        transform: translate(50%, 150px)
        rotate(1turn)
        translate(-50%, -150px)
        translate(50%,50%)
        rotate(0turn)
        translate(-50%,-50%)
    }
}
.ball{
    animation:  circle 3s infinite linear;
}
```

在 Safari 16.0 之后，你可以利用新增的偏移路径的特性，大大简化了路径动画实现的复杂度

```css
/* offset-path */

:is(.blue, .teal, .yellow, .red)  {
  offset-path: circle(9vw at 5vw 50%);
}

@keyframes move {
  100% { 
    offset-distance: 100%;
  }
}

/* Animation */
.clothing-header.clicked :is(.blue, .teal, .red, .yellow) {
  animation: move 1100ms ease-in-out;
}
```

#### scroll behavior

 在 Safari 15.4 之后，新增了滚动行为——[scroll behavior](https://developer.mozilla.org/zh-CN/docs/Web/CSS/scroll-behavior)，你可以通过下面的 GIF 对比效果

![session_10048_09](./images/session_10048_09.gif)

通过定义滚动行为，让同页面的分段跳转更为平滑，大致理解为`UIScrollView` 跳转到某个 `Point` 时是否开启动画。

#### :focus-visible 和 accent-color

当我们需要让用户关注于页面是上的某些点时，我们可以通过定义用户鼠标点击或者键入内容时，比较一下，当你用鼠标*点击控件*和用键盘 *tab 切换控件*有何不同。

参照 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:focus-visible) 的示例代码，代码如下，可能比示例的更有助于你的理解

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"> 
<style type="text/css">
input, button {
  margin: 10px;
}

.focus-only:focus {
  outline: 2px solid black;
}

.focus-visible-only:focus-visible {
  outline: 4px dashed darkorange;
}
.focus-visible-only:root {
  accent-color: var(--green);
}

</style>
</head>

<body>
<input value="Default styles"><br>
<button>Default styles</button><br>
<input class="focus-only" value=":focus only"><br>
<button class="focus-only">:focus only</button><br>
<input class="focus-visible-only" value=":focus-visible only"><br>
<button class="focus-visible-only">:focus-visible only</button>
</body>

</html>
```

你可以保存为本地的 HTML 文件，使用最新的 [Safari Technology Preview](https://developer.apple.com/safari/resources/) 来查看一下效果。

#### 停用部分 WebKit prefixes

在过去的一年，越来越多原本用于实验性的 `webKit前缀`，我们都将其转变为标准的属性，以使 CSS 更易于编写和更具互操作性。当然，带前缀的版本此时仍然有效。

> 在 CSS 属性的头部添加`-webkit-`，这是一种非标准的前缀

![session_10048_10](./images/session_10048_10.png)

#### 排版

Safari 15.4 中新增了部分功能丰富了 Web 排版的可操作性。

WebKit 添加了 CSS 属性 font-palette 和`@font-palette-values` 规则的支持。

`font-palette` 属性为 Web 开发人员提供了一种方法，可以选择包含在彩色字体中的几个不同的预定义调色板中的一个。

![session_10048_11](./images/session_10048_11.png)

WebKit 添加了对 `text-decoration-skip-ink` 的支持，以控制下划线和上划线在通过字形上升和下降时呈现的形式。

此外，WebKit 添加了对 ic 单元的支持，这在排版 CJK 脚本时很有用。

#### 网格容器

对 CSS 的叙述，还没有结束。

多年以来，CSS 网格布局都是前端工程师的一种`心病`。就像这个问题[CSS Grid 布局那么好，为什么至今没有人开发出基于 Grid 布局的前端框架呢？](https://www.zhihu.com/question/397861009)所说，网格布局并不是一个面向新手的布局方式，你需要了解更多的信息才能得心应手。

现在我们可以通过更简单的方式来实现网格布局

![session_10048_12](./images/session_10048_12.png)

CSS Grid 是革命性的，但它只影响网格容器的直接子级。通过设置 `grid-template-rows: subgrid` 属性，网格中的内容就像也被网格布局一样，井然有序。

![session_10048_13](./images/session_10048_13.png)

### Web Inspector

![Web Inspector](./images/Web Inspector.png)

更为丰富的调试手段，能够帮助你更好的进行 Web 开发。接下来我简单介绍几个。

#### Flexbox  检查器

通过使用新的 Flexbox 检查器，你可以可视化元素之间的间距。当我们切换到 `Layout` 选项时，我们找到新的 Flexbox 检查器，并选中它。你可以选择点开全部选项也不用担心浏览器的性能问题。

![session_10048_14](./images/session_10048_14.png)

当我们修改属性 `justify-content` 时，我们可以清晰的选择合适的值。

#### 模糊补全

新的 CSS 模糊补全功能能够帮助你的选择合适的变量值而不用担心忘记它们。与以往不同的是，你输入的值即便名称的末尾，同样可以匹配出来，而不是从头开始。

#### 创建开发工具的拓展

今年最值得瞩目的是支持开发人员对 Safari Web 检查器的拓展。

### Web API

接下来让我们看看最近一年，在 Web API 方面有哪些可喜的新特性呢。

![Web API](./images/Web API.png)

#### Web Push

最令人瞩目好就是 Web Push 的支持，不过 iOS 和 iPadOS 得在下一个版本才能体验。

...

#### Web Manifest File

在 Safari 15.4 之后，我们将可以定义用户将 Web 应用程序保存到主屏幕的时展示的图标。

![session_10048_15](./images/session_10048_15.png)

需要注意的是，如果要让设定的图标得以展示，你需要确保 HTML 头部中没有定义 `apple-touch-icon`

如果你需要保存在不同平台主屏幕上的图标展示不同的话，你可以通过定义 `apple-touch-icon` 来实现这一点。如果你并没有做个任何处理，你将在主屏上看到一个网页缩略图的图标。

#### Broadcast channels

当我们多窗口打开多个同站点页面时，允许你在这些窗口之间进行上下文交互。不过它并不是在后台更新当前的页面，而是更新为当前站点所保存的文件。

```js
// State change
broadcastChannel.postMessage("Item is unavailable");
```

#### 文件系统访问 API

在 Safari 15.2 开始允许开发者从特定的源站点中更改存储的文件

```js
// Accessing the origin private file system
const root = await navigator.storage.getDirectory();

// Create a file named Draft.txt under root directory
const draftHandle = await root.getFileHandle("Draft.txt", { "create": true });

// Access and read an existing file
const existingHandle = await root.getFileHandle("Draft.txt");
const existingFile = await existingHandle.getFile();
```

#### P3 色域的支持

Safari 开始支持更为丰富的色彩，全年，我们成为了首个在 CSS 颜色级别中定义新颜色语言的浏览器引擎。今年，我们为 canvas 元素内的内容添加了对 P3 颜色的支持。

![session_10048_16](./images/session_10048_16.png)

从现在开始，进入全新的色彩时代，更好的满足用户的视觉需求。

#### 小结

你可以查看我根据[Safari Release Notes](https://developer.apple.com/documentation/safari-release-notes)整理的相关信息，查看更多在 Web API 上的修改。

### JavaScript 和 WebAssembly

 下图为过去一年在 JavaScript 和 WebAssembly 的新特性简介

![JavaScript and WebAssembly](./images/JavaScript and WebAssembly.png)

#### SharedWorker

在理解`SharedWorker` 之前，你需要知道`Web Worker` 的概念。

我们知道 JavaScript 语言采用的是单线程模型，也就是说，所有任务只能在一个线程上完成，一次只能做一件事。前面的任务没做完，后面的任务只能等着。

为了充分发挥计算机的计算能力，提出了`Web Worker` 的概念。

`Web Worker`的作用，就是为 JavaScript 创造多线程环境，允许主线程创建 `Worker` 线程，将一些任务分配给后者运行。

`SharedWorker` 接口代表一种特定类型的 `Worker` ，可以从几个浏览上下文中*访问*，例如几个窗口、iframe 或其他 `Worker` 。它们实现一个不同于普通 `Worker` 的接口，具有不同的全局作用域。

> `SharedWorker`  的实质在于 share，不同的线程可以共享一个线程，他们的数据也是**共享的**。 数据的共享能够帮助我们减少计算和网络请求。

不过使用 `Web Worker` 时需要注意以下几点：

* **同源限制**
* **DOM 限制**
* **通信联系** 无法与主线程直接通信，只能通过消息来实现
* **脚本限制**
* **文件限制*

代码如下：

```js
// Create Shared Worker
let worker = new SharedWorker("SharedWorker.js");

// Listen for messages from Shared Worker
worker.port.addEventListener("message", function(event) {
  console.log("Message received from worker: " + event);
});

// Send messages to Shared Worker
worker.port.postMessage("Send message to worker");
```

#### 在数组中搜索

今年，新增了一些新的 JavaScript 方法能够帮我们更好的在数组中进行搜索

```js
const list = ["shirt","pants","shoes","hat","shoestring","dress"];
const hasShoeString = (string) => string.includes("shoe");

console.log(list.findLast(hasAppString));
// shoestring

console.log(list.findLastIndex(hasAppString));
// 4
```

你可以通过 `findLast` 和 `findLastIndex` 在数组中从后往前搜索，而不需要先将数组 `reserve`。

 当我们需要搜索特定下标的对象时，有一个简单的方法是使用 `at(index)` 方法：

```js
const list = ["shirt","pants","shoes","hat","shoestring","dress"];

// Instead of this:
console.log(list[list.length - 2]);

// It's as easy as:
console.log(list.at(-2));
```

#### 更好的国际化支持

新的 Safari 将提供更好的国际化支持，`Intl` 对象的设计目的是使特定位置的数据更容易国际化。

具体的细节你可以查看我提供的图片。

#### WebAssembly

对于网络平台而言，WebAssembly 具有巨大的意义——它提供了一条途径，使得以各种语言编写的代码都可以以接近原生的速度在 Web 中运行。这种情况下，以前无法以此方式运行的客户端软件都将可以运行在 Web 中。

随着今年的改进，使用 WebAssembly 的 Web 应用程序只会变得更加强大，可寻址内存扩展到 4GB，并且新的`zero-cost` 异常处理更是带来了性能提升。

### Security and privacy

![](./images/Security and privacy.png)

#### COOP  和 COEP HTTP 标头

为了解决跨域问题，我们新增了 `COOP`  和 `COEP` HTTP 标头，使用新的跨域打开器策略和跨域嵌入器策略 HTTP 响应标头，网页可以选择进程隔离，这也意味着网页将在其自己的专用 `webContent` 进程中运行。

#### 内容安全策略 3（CSPL3）

[内容安全策略(Content Security Policy)](https://www.w3.org/TR/CSP2/)简称`CSP`是由[W3C](https://www.w3.org)小组定义的一项规范,其主要做用是提供一个额外的安全层,用于检测并削弱某些特定类型的攻击,包括跨站脚本 (XSS) 和数据注入攻击等。

在新版本的 Safari 中增加了对内容安全策略的更新，特别是新的严格动态源表达式。

```js
// strict-dynamic source expression

// Without strict-dynamic
Content-Security-Policy: script-src desired-script.com dependent-script-1.com
  dependent-script-2.com dependent-script-3.com; default-src "self";

// With strict-dynamic
Content-Security-Policy: default-src "self"; script-src "nonce-desired" "strict-dynamic";
```

你可以使用 nonce 来允许某些脚本，然后将这种信任扩展到已经受信任的脚本加载的脚本。而不需要明确的`白名单`。

## 总结

过去一年在 Safari 和 WebKit 中开发了差不多完成 162 项功能和改进。

![session_10048_17](./images/session_10048_17.png)

请原谅我并不能针对每个点一一展开论述。

你可以通过[Safari Technology Preview Release Notes 132- 147](https://developer.apple.com/safari/technology-preview/release-notes/) 来查看过去一年苹果在 HTML、CSS 增强、Web Inspector 工具、Web API 等各个方面的详细更新情况。

当你准备使用某些新特性时，使用 [Can I use](https://caniuse.com/) 来了解某些新特性的兼容性和支持的版本是非常重要的。

如果你想尝试新的功能，你可以通过下载 [Safari Technology Preview](https://developer.apple.com/safari/resources/) ，在其中试用 Safari 和 WebKit 的最新和最强大的功能。 [Safari Technology Preview](https://developer.apple.com/safari/resources/) 支持不需要更新 beta 系统来体验新版功能的版本。

你可以参照[时间线](https://trac.webkit.org/timeline)获取了解更多的细节，如果在 WebKit 中遇到错误——有关 HTML、CSS、JavaScript、DOM API 或 Web Inspector 的问题——请确保通过 [WebKit 的错误跟踪系统](https://trac.webkit.org)发送反馈。

### 致歉

由于笔者对前端内容并不是非常擅长，所总结的内容和理解难免存在疏漏和错误，如有问题，请与我联系。

### 参考文章

[开发者注意了，WebKit 迎来新升级！](https://xw.qq.com/cmsid/20220319A01GC700)
