# Section 10052
# What's New In SwiftUI(WWDC22)

大家好，今天我们来介绍一下今年SwiftUI推出了哪些新的内容。
从近些年苹果的事件来看， SwiftUI即是未来。

### 1. What's New In SwiftUI
### 2. SwiftUI 发展历史对比


#### 1. What's New In SwiftUI

* 1. SwiftChart
* 2. Navigation and windows
* 3. Advanced controls
* 4. Sharing
* 5. Graphics and layout

---

##### 1.1 SwiftChart

[Image](./images/chartall.png)

之前在项目中使用过Charts的小伙伴应该有些基础了解。
不同之处在于Apple推出的Chart库默认支持Accessibility，以及跨平台。
如果有做海外App的小伙伴可能有了解，支持Accessibility是一项美国app即将强制要求的规定。
包括但不限于字体的Dynamic Type，VoiceOver的朗读等。
如果想要了解更多关于Swift Charts内容，
可以查看WWDC以下两个Session

[Hello Swift Charts](https://developer.apple.com/videos/play/wwdc2022/10136/)
[SwiftCharts: Raise the bar](https://developer.apple.com/videos/play/wwdc2022/10137/)

以及持续关注我们，后续我们也会更新Charts相关Session。
  
这里先进行一些简单实用介绍
1.1 柱状图(BarMark)
```
Chart(partyTasksRemaining) { task in
    BarMark(
        x: .value("date", unit: .day),
        y: .value("Task Remaining", task.remainingCount)
    )
}
```
[image]()

1.2 折线图(LineMark)
```
Chart(partyTasksRemaining) { task in
    LineMark(
        x: .value("date", unit: .day),
        y: .value("Task Remaining", task.remainingCount)
    )
    .foregroundStyle(byL .value("Category", task.category))
}
```
[image]()

1.3 基准线(RuleMark)
甚至可以为其添加文字说明(.annotation(...))。
```
Chart(partyTasksRemaining) { task in
    AnyCharts{ ... }
    RuleMark(y: .value("Value", 5))(
        .annotation(position: .top, alignment: .trailing) {
            VStack {
                Text("Today's Goal")
                Text("Status: ✔️")
            }
        }
    )
}
```
[image]()

---


> 2. Navigation and windows


2.1 NavigationStack

具有与过去NavigationView类似的功能，下面简单列举其不同之处。
更多详细内容可以参照WWDC Session: [The SwiftUI cookbook for navigation](https://developer.apple.com/videos/play/wwdc2022/10054/)
我们也会在后续Session推出相关文章。

2.1.1 比以前更简洁的跳转方式

   .navigationDestination可以在点击NavigationLink后接收value而统一处理跳转。
   示例代码中点击后跳转到FoodDetailView中，不需要将Destination写的到处都是了。
```
NavigationStack {
    List(foodItem) { item in
        NavigationLink(value: item) {
            Label(item.title, image: item.icon)
        }
    }
    .navigationDestination(for: FoodItem) { item in
        FoodDetailView(item: item)
    }
}
```

2.1.2 可以使用Stack管理，像管理数组一样管理导航栏堆栈。

如示例中selectedItems便是与NavigationStack相互绑定的数据，通过与下一级View，FoodDetailView进行的Binding，即可操作NavigationStack进行pop/push操作，更自由的实现跳转。
```
@State private var selectedItems: [FoodItem] = []
NavigationStack(path: $selectedItems) {
    List(foodItem) { item in
        NavigationLink(value: item) {
            Label(item.title, image: item.icon)
        }
    }
    .navigationDestination(for: String.self) { item in
        FoodDetailView(text: item, path: $selectedItems)
    }
}

struct FoodDetailView: View {
    
    let item: foodItem
    @Binding var path: [FoodItem]

    var body: some View {
        Text(item.title)
            .font(.largeTitle)
            .onTapGesture {
                path.removeSubrange(1...) // 返回根视图
                // 对 path 数组操作即可改变导航栏堆栈
                // path.append(foodItem) 即可继续跳转
                // 如果使用String作为path即与URLRouter类似效果
            }
    }
}
```

2.2 SplitViews

SwiftUI有了与UIKit中UISplitViewController，AppKit中的HSplitView类似的NavigationSplitView，替换原有的单一的NavigationView，可以为iPad等更好的适配半屏模式等。
```
@State private var selectedTask: PartyTask?
NavigationSplitView {
    List(PartyTask.allCases, selection: $selectedTask) {
        NavigationLink(value: $0) {
            TaskLabel($0)
        }
    } detail: {
        switch selectedTask {
        case .food:
            FoodOverView()
        case .music:
            MusicOverView()
        // ...
    }
}
```

2.3 Scenes
可以为MacOS提供多windows支持。
```
@main
struct PartyPlanner: App {
    var body: some Scene {
        WindowGroup("Party Planner") {
            TaskViewer()
        }
        Window("Party Budget", id: "budget") {
            BudgetView()
        }
        .keyboardShortcut("0") //快捷键支持 Command+0
        .defaultPosition(.topLeading)
        .defaultSize(width: 220, height: 250)
    }
}
```
SwiftUI作为一款跨平台语言，BudgetView也可以重用于iOS，在iOS16中的present/sheet也推出了新的半屏模式，可以自定义高度。
```
NavigationSplitView {
    SiderbarView()
} detail: {
    DetailView()
}
.sheet(isPresented: $showBudget) {
    BudgetView()
        .presentationDetents([.height(200), .medium])
        .presentationIndicator(.visible)
}
```
另外对于Mac右上角的MenuBar也有更好的支持
```
@main
struct PartyPlanner: App {
    // WindowGroup("Party Planner") { ... } 只有MenuBar的app也可以
    MenuBarExtra("Bulletin Board", systemImage: "quote.bubble") {
        BulletinBoardView()
    }
    .menuBarExtraStyle(.window)
}
```
[image]()

在Xcode中对于多平台的支持等更新也有很多。
关于更多Xcode更新内容，可以关注
[What's new in Xcode](https://developer.apple.com/videos/play/wwdc2022/110427/)
[Use Xcode to develop a multiplatform app](https://developer.apple.com/videos/play/wwdc2022/110371/)

> 3. Advanced controls

3.1 Forms
SwiftUI中的form增加了新的style, 当然form会自动适配iOS/iPadOS/MacOS。
```
Form {
    Section { 
        LabeledContent("Location") {
            AddressView(location)
        }
        DatePicker("Date", selection: $date)
    }
    Section { 
        Picker("Accent color", selection: $accent) { ... }
        Picker("Color scheme", selection: $scheme) { ... }
        Toggle(isOn: $extraGuests) {
            Text("Allow extra guests")
            Text("The more the merrier!")
        }
    }
}
.formStyle(.grouped)
```
[image]()

3.2 Controls

3.2.1 .lineLimit
这是一个对于Text/TextField等都有效的modifier。
```
Text(model.description)
    .lineLimt(2...3)
    
TextField("Description", text: $description, axis: .vertical)
    .lineLimit(5...10)
```
这个modifier的存在可以解决过去SwiftUI对于垂直布局页面支持的不足。
比如有一个两列的LazyVGrid, 每一个item由顶部一张图片，中间一段描述语句，底部一个日期组成。
```
LazyVGrid(columns: [GridItem( ... ),
                    GridItem( ... )]) {
    ForEach(sources) { model in
        VStack {
            Image(model.image)
                ...
            Text(model.description)
                .lineLimit(2)
            Text(mode.dateString)
                .lineLimit(1)
        }
    }
}
```
设计图类似于
```
Image               
description info
description info
2022
```
而由于适配Accessibility动态字体，所以不可以给固定高度。
由于model.description的内容不确定性，导致中间text可能为1-2行,最后呈现效果会出现一定不对齐性质，无论使用leading/trailing/center.
```
Image                   Image 
description info        description info
description info        2022
2022
```
在iOS16之后只需要 
```
Text(model.description)
    .lineLimit(2...2)
```
而iOS16之前只能使用一些技巧，并不方便，比如
```
Text("\n\n")
    .frame(maxWidth: .infinity)
    .overlay(
        Text(model.description)
            .lineLimit(2)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    )
```

3.2.2 MultiDatePicker 
日期选择器支持多选了。
```
@State private var activityDates: Set<DateComponents>

var body: some View {
    MultiDatePicker("Dates", selection: $activityDates)
}
```
[image]()

3.2.3 Mixed-state
> DisclosureGroup可以将简单的进行toggle等的全选了。
```
DisclosureGroup {
    Toggle("Balloons", isOn: $includeBalloons)
    Toggle("Confetti", isOn: $includeConfetti)
    Toggle("Inflatables", isOn: $includeInflatables)
    Toggle("Party Horns", isOn: $includePartyHorns)    
} label: {
    Toggle("All Decorations", isOn: [
        $includeBalloons,
        $includeConfetti,
        $includeInflatables,
        $includePartyHorns
    ])
}
```
当然也可以对DisclosureGroup进行一定的自定义
```
struct MyDisclosureStyle: DisclosureGroupStyle {
    func makeBody(configuration: Configuration) -> some View {
        VStack {
            Button {
                withAnimation {
                    configuration.isExpanded.toggle()
                }
            } label: {
                HStack(alignment: .firstTextBaseline) {
                    configuration.label
                    Spacer()
                    Text(configuration.isExpanded ? "hide" : "show")
                        .foregroundColor(.accentColor)
                        .font(.caption.lowercaseSmallCaps())
                        .animation(nil, value: configuration.isExpanded)
                }    
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            if configuration.isExpanded {
                configuration.content
            }
        }
    }
}
```
> Picker也支持与DisclosureGroup类似的组合多选方式。
```
@Binding var selectedDecorations: [Decoration]

var themes: [Binding<Theme>] {
    selectedDecorations.lazy.map(\.theme)
}

var body: some View {
    Picker("Decoration Theme", selection: $themes) {
        Text("Blue").tag(Theme.blue)
        Text("Black").tag(Theme.black)
        Text("Gold").tag(Theme.gold)
        Text("White").tag(Theme.white)
    }
    .pickerStyle(.radioGroup)
}
```
[image]()
除了.radioGroup style以外还有.inline/.wheel/.menu/.segmented/.automatic等风格，大家可以多多尝试。

> .toggleStyle
> 
对于多选Button也提供了一种使用Toggle的新方式。
```
@State var useSwiftHashtag = false
@State var usePartyHashtag = false
@State var useChartsHashtag = false
@State var useOMTHHashtag = false
    
var body: some View {
    VStack(alignment: .leading) {
        HStack {
            Toggle("#Swiftastic", isOn: $useSwiftHashtag)
            Toggle("#WWParty", isOn: $usePartyHashtag)
        }
        HStack {
            Toggle("#OffTheCharts", isOn: $useChartsHashtag)
            Toggle("#OneMoreThing", isOn: $useOMTHHashtag)
        }
    }
    .padding()
    .toggleStyle(.button)
    .buttonStyle(.bordered)
}
```
[image]()
[image]()
除此之外Menu/Picker也有各自的组合style。

> Stepper

Stepper新增format, 支持number/百分比等13种类型。
且自动适配MacOS支持数字填写，iOS为+-按钮，watchOS也有对应适配。
```
Stepper(value: $value,
        step: step,
        format: .number) {
    Text("Current value: \(value), step: \(step)")
}
```
3.3 Table
MacOS之前推出的Table，现在在iPadOS/iOS中也可以使用，方便快捷的创建多列列表。
只是在iOS中会默认只显示首列TableColumn，在iPad和Mac中效果会更好。
也提供了contextMenu的点击事件响应。
```
@State private var attendees: [Attendee]

var body: some View {
    Table(attendees) {
        TableColumn("Name") { attendee in
            AttendeeRow(attendee)
        }
        TableColumn("City", value: \.city)
        TableColumn("Status") { attendee in
            StatusRow(attendee)
        }
    }
}

var body: some View {
    Table(attendees, selection: $selection) {
        ...
    }
    .contextMenu(forSelectionType: Attendee.ID.self){ selection in
        if selection.isEmpty {
            Button("New Invitation") { addInvition() }
        } else if 1 == section.count {
            Button("Mark as VIP") { markVIPs(selection) }
        }
        ...
    }
}



```
[image]()

对于iPadOS的toobar也进行了一些加强。
```
Table(attendees, selection: $selection) {
    ...
}
.toolbar(id: "invitations") {
    ToolbarItem(id: "new", placement: .secondaryAction) {
        Button(action: sendNewInvitation) {
            Label("New Invitation", systemImage: "envelope")
        }
    }
}
```
Table同时也支持iOS15为List推出的.searchable, 甚至可以分scope进行条件搜索。
更多详情可以参考WWDC
[SwiftUI on iPad: Organize your interface](https://developer.apple.com/videos/play/wwdc2022/10058/)
[SwiftUI on iPad: Add toobars, titles, and more](https://developer.apple.com/videos/play/wwdc2022/110343/)
[What's new in iPad app design](https://developer.apple.com/videos/play/wwdc2022/10009/)
[SwiftUI on the Mac: Build the fundamentals](https://developer.apple.com/videos/play/wwdc2021/10062/)

> 4. Sharing
新推出了ShareLink API，方便唤起系统进行数据向外部的分享
```
Gallery( ... )
    .toobar {
        ShareLink(
            item: image,
            preview: SharePreview("Birthday Effects")
        )
    }
```
[image]()

与之对应，也有从外部向App传递数据的API。
```
Gallery( ... )
    .dropDestination(
        payloadType: Image.self
    ) { receivedImage, location in
        image = receivedImage.first
        return !receivedImage.isEmpty
    }
```
数据传递默认可以支持如下类型
String, Data, URL, Attributed String, Image.
如果想要更多数据类型，可以遵守Transferable协议进行自定义。
```
struct BirthdayFilter: Codable {
    ...
}

extension BirthdayFilter: Transferable {
    static var representation: some TransferRepresentation {
        CodableRepresentation(contentType: .birthdayFilter)
    }
}

```
详情参照 [Meet Transferable](https://developer.apple.com/videos/play/wwdc2022/10062/)

##### Graphics and layout

获得更惊艳的UI效果，配合SF Symbol效果更佳。
示例中蓝色的背景使用backgroundStyle带有了渐变效果，而SF Symbol/Text 则带有了阴影效果，这些新的modifier为编程带来了很多便利。
同时也都适配了变化的animation
```
struct CalendarIcon: View {
    var body: some View {
        VStack {
            Image(systemName: "calendar")
            Text("June 6")
        }
        .background(in: Circle().inset(by: -20))
        .backgroundStyle(.blue.gradient)
        .foregroundStyle(
            .white.shadow(.drop(radius:1, y: 1.5))
        )
        .padding(20)
    }
}
```
[image]()


##### Grid
Grid提供了一种新的Layout方式，不再局限于LazyVGrid/LazyHGrid,开放了GridRow与.gridCellColumns(count)。
```
var body: some View {
    Grid {
        GridRow {
            NameHeadline()
                .gridCellColums(2)
        }
        GridRow {
            CalendarIcon()
            SymbolGrid()
        }
    }
}

.gridCellColumns(Int) 可以规定某个item所占用是几倍cell空间。
.gridCellAnchor(UnitPoint) 可以layout所占用空间的位置
除此之外还有
.gridColumnAlignment(HorizontalAlignment)
.gridCellUnsizedAxes(Axis.Set)
让layout更自由。
```
[image]()
其他Layout相关可以参考相关Session，我们之后也会进一步更新。
[Compose custom layouts with SwiftUI](https://developer.apple.com/videos/play/wwdc2022/10056/)