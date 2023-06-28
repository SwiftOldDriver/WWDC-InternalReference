---
session_ids: [10121]
---

# WWDC23 - What's new in CSS

本文基于 [Session 10121](https://developer.apple.com/videos/play/wwdc2023/10121/) 梳理。

![banner](./images/00-1.png)

自 WWDC22 以来至今，Safari 已经从 16.x 跨越到了 17.x，在迭代过程中支持了 140 多个 WEB 上的新特性。而今年秋季即将发布的 Safari 17 正式版也不例外。

由于新特性太多，限于篇幅，本 Session 聚焦于 CSS 相关的新特性，Session 大纲参见下图：

![大纲](./images/00-2.png)

## Layout

### Masonry Layout

![Masonry](./images/MasonryLayout.png)

> Masonry Layout 目前仅在 [Safari Technology Preview 163 版本](https://developer.apple.com/documentation/safari-technology-preview-release-notes/stp-release-163)及以上可用，Chrome 和 Edge 不可用，而 FireFox 中则需要开启 `layout.css.grid-template-masonry-value.enabled` 的 Flag。

#### 什么是 Masonry Layout?

砖石布局（Masonry Layout）是一种在网页设计中常用的布局方式，也称为瀑布流布局（Waterfall Flow Layout）或砌砖式布局。它的特点是以不规则的方式将内容块排列在页面上，就像是用砖块砌墙一样。这种布局可以使得网页呈现出自适应和动态的外观。

在砖石布局中，每个内容块（如图像、文字、视频等）都被视为一个砖块，它们的高度可以不同。这些砖块会依次排列在网页上，每一列的宽度是相等的。当一列的空间被填满后，下一个砖块会自动放置在空闲的最短列上，以保持整体布局的平衡。

由于砖石布局可以自动调整和适应不同尺寸的屏幕，因此在响应式网页设计中被广泛应用。它在展示图片库、社交媒体流、新闻网站等需要展示大量内容的页面上效果良好，能够提供更好的用户体验。此外，砖石布局还可以通过动画效果来优化内容的加载和展示过程。

总之，砖石布局是一种流行的网页设计布局方式，通过不规则排列的砖块形式展示内容，具有适应性强、动态美观等特点。

#### 如何实现 Mansonry Layout?

##### 自顶向下、自左往右

![CSS_Multi_Column](./images/TopToBottomAndLeftToRight.png)

图中的内容顺序从第一列开始往下排列，一直延伸到 `viewport` 之外，第二列又从顶部开始，接着往下延伸，第三列之后以此类推。

> 视口代表当前可见的计算机图形区域。在 Web 浏览器术语中，通常与浏览器窗口相同，但不包括浏览器的 UI，菜单栏等——即指你正在浏览的文档的那一部分。
>
> 视口又分为两种，一种是布局视口（Layout Viewport），一种是视觉视口（Viusal Viewport）。
>
> * 布局视口：指网页的实际布局大小，即网页在屏幕上占据的空间。它通常是由网页的内容决定的，可以**超过设备的可见区域**。在桌面浏览器上，布局视口通常比屏幕宽度更宽，使得用户可以水平滚动查看整个网页内容。在移动设备上，布局视口的宽度可能与设备屏幕的宽度相同或稍微大一些。
>
> * 视觉视口：是用户当前可见的网页区域，即**用户实际能看到的部分**。它是通过**屏幕的大小和缩放级别**来确定的，用户可以通过滚动来改变视觉视口。在桌面浏览器上，视觉视口通常与布局视口的大小相同，因为网页通常可以完全显示在屏幕上。在移动设备上，由于屏幕尺寸较小，视觉视口可能只显示布局视口的一部分，用户需要通过滚动来查看整个网页。
>
> * 理想视口：是为了在移动设备上优化网页显示而提出的概念。它指的是设置网页的布局和渲染参数，使得网页在移动设备上以最佳方式呈现，无需用户缩放或水平滚动。理想视口的宽度通常与设备屏幕的宽度相同，并且通过使用meta标签在网页头部进行设置。通过设置理想视口，网页可以根据设备的屏幕尺寸自动适应布局和字体大小，提供更好的用户体验。
>
>   ```html
>   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
>   ```
>
>   这个 meta 标签告诉浏览器如何设置视口
>
>   * `width=device-width` ：将视口的宽度设置为设备的宽度。这样可以确保网页的布局与设备屏幕的宽度相匹配，避免缩放或者水平滚动。
>   * `initial-scale=1.0`：将初始缩放级别设置为1.0。这个属性确保网页以原始大小显示，不会被自动缩放。
>   * `maximum-scale=1.0`：限制用户对网页进行缩放的最大比例为 1.0
>   * `minimum-scale=1.0`：限制用户对网页进行缩放的最小比例为 1.0
>   * `user-scalable=no`：禁用用户对网页的缩放操作
>
>   当将`user-scalable`属性设置为`no`时，表示禁止用户对网页进行缩放操作。在这种情况下，如果不设置`maximum-scale`和`minimum-scale`属性，浏览器会默认将其设置为1.0，即不允许进行缩放。
>
>   尽管`maximum-scale`和`minimum-scale`属性在禁用用户缩放时可能看起来多余，但为了保持一致性和清晰度，建议仍然设置这些属性。
>
> 更多视口相关内容请参考 [Viewport - MDN]https://developer.mozilla.org/zh-CN/docs/Web/CSS/Viewport_concepts)

对于这种内容从上往下，从左至右排列的场景可以通过 `CSS MultiColumn` 实现。

> [CSS MultiColumn - MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_multicol_layout)
>
> [CSS MultiColumn 在线 Demo](https://stackblitz.com/edit/js-cpwkm3?file=index.js)

##### 自左往右、自顶向下

![LeftToRight](./images/LeftToRightAndTopToBottom.png)

如图所示，数据从左往右，从上往下排列，这也是我们日常生活中最常见的「瀑布流」布局，比如用户手指滚动页面到底部之后加载更多数据。要实现这个效果之前只能通过 `JavaScript` 来实现，如著名的 [Masonry](https://github.com/desandro/masonry) 库。虽然 `JavaScript` 可以实现瀑布流的布局效果，但是性能肯定是比不上原生的 `CSS` 支持。

#### 基于 CSS 实现自左往右、自定向下的 masonry 效果

在七年前，基于 CSS Grid 的 Mansonry [提案](https://drafts.csswg.org/css-grid-3/)就已启动，详细的使用方式可以参考 [Masonry Layout - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Masonry_layout)。

![01-1](./images/01-1.png)

* 首先设置 `display` 属性为 `grid`，开启 [Grid 布局 - MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout)
* 然后设置 `grid-template-columns` 属性为 `repeat(auto-fill), minmax(14rem, 1fr)`，这个时候我们可以看到图片都按列展示了，不过有一些图片底部的间距过大，下面的图片并没有顶上来

> [grid-template-columns - MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/grid-template-columns) 是 CSS Grid 布局中定义行列结构的属性。
>
> * repeat(auto-fill, ...) 表示自动填充,将自动创建尽可能多的列,以填充容器。
> * minmax(14rem, 1fr) 表示每列的宽度为 14rem 到 1fr 之间。也就是说:
>   * 如果容器的宽度可以放得下很多 14rem 列,就会创建很多列,每个列 14rem 宽。
>   * 如果容器的宽度放不下很多 14rem 列,那么就创建少一些列,每个列会大于 14rem,但总宽仍然填充满容器(因为最后一列是 1fr,所以会拉伸)。
>   * 所以这个值会创建一个响应式的栅格系统,当视口宽度增加时,会自动创建更多的列,但每列的最小宽度是 14rem。
>
> [fr](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout#fr_%E5%8D%95%E4%BD%8D) 是 CSS Grid 布局中的一个特殊的长度单位。它代表容器中可用空间的一等份。
>
> 例如,如果你的容器有 3 列,宽度为:
>
> ````css
> grid-template-columns: 1fr 2fr 1fr;
> ````
>
> 这表示:
>
> - 第一列占容器宽度的 1 份
>
> - 第二列占容器宽度的 2 份,即第二列是第一列的两倍宽
>
> - 第三列也占 1 份
>
>   所以如果容器是 600px,每份就是 200px,三列的实际宽度为:
>
>   * 第一列:200px
>   * 第二列:400px
>   * 第三列:200px
>   * 总宽度 600px

![01-2](./images/01-2.png)

重点来了，通过设置 `grid-template-rows` 属性值为 `masonry` 之后，可以实现

1. 根据容器宽度和每列元素的高度,自动计算出行数和每行的高度

2. 使得每列的高度尽量相近,同时填充容器空间

3. 当窗口大小改变时,自动重新计算行数和每行高度,以保持瀑布流效果

   > [在线 Demo](https://stackblitz.com/edit/web-platform-gxeyfm?file=styles.css)，请使用 Safari Technology Preview 163 及以上或使用 FireFox 并开启 `layout.css.grid-template-masonry-value.enabled` 体验。

水平方向排列方式设置为 `masonry` 之后，垂直方向我们利用强大的 CSS Grid 布局系统在垂直方向上自定义各种效果。

![01-3](./images/01-3.png)

如上图，垂直方向上设置为 `1fr 2fr 3fr` 来实现三列，每列宽度 1:2:3 的效果。

![01-4](./images/01-4.png)

如上图，垂直方向上设置为 `10rem 1fr minmax(100px, 300px)` 来实现第一列宽度固定，第三列宽度在 100 - 300px 之间，第二列撑满剩余空间的效果。

结合 Grid 布局使用 Masonry 属性相比较于使用 JavaScript 来实现瀑布流的各种自定义效果更加灵活和简单，不过 Masonry 提案尚未定稿，当 Masonry 真正可用的时候，Safari 将会在第一时间支持。

### Margin trim

![MarginTrim](./images/MarginTrim.png)

> `Margin trim` 特性在 Safari 16.4 及以上版本可用，Chrome、Edge、FireFox 目前均不可用。

`margin-trim` 属性可以帮助我们消除一个容器元素中子元素多余的外边距，我们来看下面这个场景。

![02-1](./images/02-1.png)

如上图所示，我们需要展示一个主标题和三段正文。它们各自都有顶部和底部的外边距（通过 margin-block: 1rlh 实现）。

> margin-block: 定义了元素的逻辑块首和块末外边距，并根据元素的书写模式、行内方向和文本朝向对应至实体外边距。 [margin-block - MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/margin-block) [margin-inline 和 margin-block 的区别 - 张鑫旭](https://www.zhangxinxu.com/wordpress/2018/10/diff-css-margin-inline-margin-block/)
>
> rlh: root element line height, 表示根元素的行高，同样的还有 lh，即当前元素的行高。[rlh - MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/length#%E5%8D%95%E4%BD%8D)

![02-2](./images/02-2.png)

在标题和正文的外层，我们定义了 2rlh 单位长度的内边距。

但是烦人的问题出现了，主标题顶部和最后一段正文底部的外边距其实并不是我们所期望的。

![02-3](./images/02-3.png)

一般来说，我们可以通过 CSS 选择器选中标题和最后一段正文，分别将顶部外边距和底部外边距设置为 0 来达到期望的效果。但是这样的解决方案存在潜在的扩展性问题，比如这部分内容开头不再是 h2 标签，而是 h3 标签，那么 CSS 也需要同步做出改动，又比如说 h2 被放到了中间位置，这样 h2 顶部的外边距就不存在了从而导致样式错乱。

![02-4](./images/02-4.png)

margin-trim 属性提供给了我们一个更好的解决方案，如上图所示，我们在容器元素上设置 margin-trim: block 来裁剪掉容器元素内顶部和底部额外的边距。

[在线 Demo - 请使用 Safari 16.4 及以上版本访问](https://stackblitz.com/edit/web-platform-kczpxp?file=index.html)

## Color

自从 2017 年 CSS Grid 布局面世之后，过去六年里 CSS 布局系统的发展十分迅速，和十年前的布局方案相比，今天的布局系统更加现代和易用，是一个巨大的进步。在同样的时间维度里，其实还有一块内容也发生了巨大的改变但却并不为大部分 Web 开发者和设计师所察觉 - Color 色彩。

### P3 色域

![03-0](./images/03-0.png)

假设上面的色彩图谱是人类肉眼可以观察到的所有的颜色，sRGB 作为当前 WEB 上默认的色域包含了比较多的色彩，相比于 90 年代的显示效果肯定是要丰富多彩的。但是 P3 色域更胜一筹，Apple 七年前就在软硬件层面支持了 P3 广色域。P3 广色域具有以下特点：

* 可以比 sRGB 多显示 50% 的颜色
* 更亮的显示效果
* 更深的饱和度

CSS 中可以通过媒体查询测试当前设备是否支持 P3 光色域：

![03-01](./images/03-01.png)

通过 `@media (color-gamut: p3) {}` 语句来包含想要在支持 P3 色域的设备上执行的样式。Apple 从 Safari 10.0 就支持了这个特性。

>  [色域 - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut)

### 定义颜色

![03-1](./images/03-1.png)

WEB 中常见定义颜色的方式有如上图所示的五种：

* 预设的颜色值，比如 white、green、black [named-color - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color)
* 十六进制值 [hex-colors - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color)
* rgb 函数，接收三个参数，分别对应红色值，绿色值，蓝色值，每个值范围都是 0 - 255。[rgb - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb)
* [hsl 函数](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl)，接收三个参数，分别对应[色相](https://developer.mozilla.org/en-US/docs/Web/CSS/hue)、饱和度(范围 0% - 100%)、亮度(范围 0% - 100%)
* [hwb函数](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hwb)，接受三个参数，分别对应色相、白度，黑度。

上面这五种方式可以定义出相同的色值，但是都局限于 sRGB 色域中，如果想要定义仅存在于 P3 色域的颜色，需要用到新的色值定义方式。

它们分别是

* [lch](https://developer.mozilla.org/zh-CN/docs/Web/CSS/color_value/lch)
* [oklch](https://developer.mozilla.org/zh-CN/docs/Web/CSS/color_value/oklch)
* [lab](https://developer.mozilla.org/zh-CN/docs/Web/CSS/color_value/lab)
* [oklab](https://developer.mozilla.org/zh-CN/docs/Web/CSS/color_value/oklab)

这四种色值定义方法可以呈现包含 P3 色域在内的任何色域中的颜色。

![03-02](./images/03-2.png)

* 所有方法中的 L 代表了色彩的亮度（Lightness）
* lch 和 oklch 中的 c 衡量了色度（Chroma）
* lch 和 oklch 中的 h 代表了色相

![03-3](./images/03-3.png)

* lab 和 oklab 中的 a 为介于 -125 和 125 之间的数值或者是介于 -100% 和 100% 之间的百分比，指定了在 Lab 色彩空间中沿 a 轴的距离，即颜色绿或红的程度。
* lab 和 oklab 中的 b 为介于 -125 和 125 之间的数值或者是介于 -100% 和 100% 之间的百分比，指定了在 Lab 色彩空间中沿 b 轴的距离，即颜色蓝或黄的程度。

![03-4](./images/03-4.png)

Safari 15.4 开始支持这四种颜色定义函数，可以用来定义任何色域中的颜色。Chrome、Edge 和 Firefox 在今年也支持了上述四种色彩定义函数。

初次之外，还可以使用 color() 函数来定义颜色。

![03-5](./images/03-5.png)

[color()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color) 接收以下参数：

* 色域：包括 `srgb`、`display-p3`、`srgb-linear` 等
* p1, p2, p3：指定色域所接收的值
* alpha: 透明度，取值范围 (0-1/0%-100%)

Safari 从 10.1 开始就已经支持了 color() 函数来指定在某个色域下的颜色值了。

关于 CSS 工作组对于色彩更多的定义请参考 [CSS Color Module Level 5](https://drafts.csswg.org/css-color-5/)。

### 引用颜色

在以前，如果想要在 CSS 中引用之前已经定义过的颜色一般来说是通过 CSS 预处理器来实现的，而 [Relative Color syntax](https://www.w3.org/TR/css-color-5/#relative-colors) 也可以达到同样的效果了。

![04-1](./images/04-1.png)

> Safari 从 16.4 开始支持 Relative color syntax，其它浏览器暂不支持该特性

下面我们来看下实际的用法。

1.定义一个颜色 color original

```CSS
background: #87cefa;
```

2.引用 original 作为 from 的值

```css
background: rgb(from #87cefa);
```

3.根据新定义颜色的函数的值进行插值操作

```css
background: rgb(from #87cefa r g b / 0.7);
```

这里的效果就是基于 `#87cefa` 这个颜色值作为基底颜色，然后在 rgb 函数中保留原本基底颜色的 red、green、blue 值，但是修改其透明度为 70%。

![04-2](./images/04-2.png)

更多用法请参考 [在线 Demo - 请使用 Safari 16.4 及以上版本打开](https://stackblitz.com/edit/web-platform-dmcebx?file=index.html)

Relative color syntax 还可以很便捷的用来定义设计系统中的色盘。

![04-3](./images/04-3.png)

如上图所示，定义一个基准颜色之后，通过 Relative color syntax 修改 lightness 就可以实现一个色盘的搭建。
