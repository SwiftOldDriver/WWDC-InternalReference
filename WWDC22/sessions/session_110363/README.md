---
session_ids: [110363]
---

# WWDC22 110363 - App 包大小优化和 Runtime 上的性能提升

> 本文基于 [WWDC22 - Improve app size and runtime performance](https://developer.apple.com/videos/play/wwdc2022/110363/) 进行创作

<!--待插入思维导图-->

## 前言

作为 `iOS` 开发者，我们每天都会与 `Swift` 或 `Objective-C` 打交道。在编写完代码之后，我们需要通过 `Xcode` 进行编译，然后运行在真机或者模拟器上面。这一看似习以为常的操作依赖于编译器和 `Swift` 或 `Objective-C` 的运行时。

今年 `Apple` 在 `Swfit` 和 `Objective-C` 的编译器和运行时上面做了许多优化和调整，使得基于 `Xcode 14` 开发或者以 `iOS 16,tvOS 16,watchOS 9` 为最低支持版本的 `App` 可以获得包大小的优化和 `Runtime` 性能的提升。值得一提的是，本文不会有新的 `API`，也不会涉及语法变动和新的 `Xcode Build Setting`。

> 对于 Runtime 感兴趣的读者可以查阅下方的文档。
>
> [Objective-C Runtime 官方文档](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html?language=objc#//apple_ref/doc/uid/TP40008048)
>
> [Swift Runtime 官方文档](https://github.com/apple/swift/blob/main/docs/Runtime.md)

今年在编译器和运行时带来的优化包括以下四个方面

- `Swift` 协议检查
- `Objective-C` 消息发送
- `Retain` 和 `Release` 调用
- `Autorelease` 自动省略

这些优化不需要修改你的代码，因为 `Apple` 做出的改动对于开发者来说是不可见的，你几乎不需要付出任何成本就可以获得这些优化。

## Swift 协议检查

### 什么是协议检查

`Protocol` 概念不论是在 `Objective-C` 中还是 `Swift` 中都是十分基础却又不可忽视的一大特性。自 `Swift` 诞生以来，`iOS` 生态圈内对于面向协议编程（POP）的追捧和热度持续攀升。因为随着软件复杂度的提高，如何保持各个模块之间高内聚、低耦合就成为了每个软件工程师值得思考的问题。在 `Swift` 的世界里面，`Protocol` 可以说是无处不在，整个 `Swfit` 最核心的编程理念中就包括了面向协议编程。

`Swift` 中关于 `Protocol` 的语法想必读者应该都已经熟练掌握了，下面我们从实际的代码中来理解什么是「协议检查」。

```swift
protocol CustomLoggable {
    var customLogString: String { get }
}
```

上面的代码定义了一个叫做 `CustomLoggable` 的协议，见名知意，这个协议的目的是实现自定义的输出，遵循该协议的类型具有 `customLogString` 这个只读计算属性。

```swift
func log(value: Any) {
    if let value = value as? CustomLoggable {
        ...
    } else {
        ...
    }
}
```

我们定义了一个 `log` 方法，这个方法中针对遵循 `CustomLoggable` 协议的对象进行了经典的 `if let` 操作。

```swift
struct Event: CustomLoggable {
    var name: String
    var date: Date

    var customLogString: String {
        return "\(self.name), on \(self.date)"
    }
}
```

接着我们定义了一个遵循 `CustomLoggable` 的 `Event` 结构体，这个结构体有 `name` 和 `date` 两个属性，同时为了遵循 `CustomLoggable` 协议，定义了 `customLogString` 属性的 `getter` 方法。

```swift
let event = ...
log(value: event)
```

然后我们将 `Event` 结构体的实例传给 `log` 方法，当我们执行这段代码的时候，`log` 方法通过使用 `as` 运算符来检查我们传入的 `value` 是否遵循了 `CustomLoggable` 方法。

> 关于 `is`、`as` 的区别，感兴趣的读者可以参考 [Type casting in swift : difference between is, as, as?, as!](https://abhimuralidharan.medium.com/typecastinginswift-1bafacd39c99)

上面代码中对于 `CustomLoggable` 协议的检查，编译器会尽可能在编译时优化掉。但编译器并不总是有足够的上下文信息来完成这项优化。因此，借助于在编译时计算出的协议检查「元数据」，协议的遵循性检查常常发生在运行时。有了「元数据」之后，运行时就知道特定对象是否真正遵循了 `CustomLoggable` 协议。

![MetaData in Runtime](./images/pic1.png)

协议检查的「元数据」一部分是在编译时产生的，但是相当大的一部分只能在 `App` 启动时得到，特别是使用**泛型**的时候。

### Swift 协议检查存在的问题

由于需要在 `App` 启动时去产出协议检查所需的 「元数据」，当代码中大量使用了协议之后，对启动时间的影响将不再是微乎其微，而是客观的数百毫秒。在真实世界的 `App` 中，产出「元数据」的耗时甚至会占到启动时间的一半。

### Swift 协议检查优化方案

那么问题来了，我们能不能提前计算好这些「元数据」呢？

答案是可以的，基于 `Swift` 新的运行时，协议检查所需的「元数据」会在启动时用到的所有动态库加载之前，作为 `dyld` 启动闭包的一部分去提前计算出来。

> 关于 `dyld` 和启动闭包，感兴趣的读者可以参考 [Staic linking vs dyld3](https://blog.allegro.tech/2018/05/Static-linking-vs-dyld3.html)
>
> 同时，`Apple` 也有关于启动优化的专题 `Session` - [WWDC17 - App Startup Time: Past, Present and Future](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwj3ro6fgsn4AhWESGwGHfQEBMEQtwJ6BAgGEAI&url=https%3A%2F%2Fdeveloper.apple.com%2Fvideos%2Fplay%2Fwwdc2017%2F413&usg=AOvVaw0Kw9oW-BQQbgrxhPswQhrJ) (如果链接失效，可以下载 [WWDC App for macOS](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwiw-NmHg8n4AhWrS2wGHXS2DCsQFnoECAcQAQ&url=https%3A%2F%2Fgithub.com%2Finsidegui%2FWWDC&usg=AOvVaw0BMsc4CmRW7ZlIdreuaFRA) 后搜索关键字观看)

最重要的是，这项优化不需要升级工程的最低部署版本，只需要 `App` 运行在 `iOS 16`、`tvOS 16` 或者是 `watchOS 9` 上就可以享受到 `Swift` 协议检查的优化，进而提升你的 `App` 启动速度。

> 相比于类型更加安全、语法更加现代的 `Swift` ，`Objective-C` 近些年来基本上是处于停滞的发展状态。但是今年 `Apple` 带来了 `Objective-C` 生态中可以说是近些年来最为令人振奋的改进和提升。包括消息发送的优化、`Retain & Release` 调用优化和 `AutoRelease` 自动省略优化。

## Objective-C 消息发送

对于 `iOS` 老司机来说，`Objective-C` 的消息发送是一个老生常谈的话题。对于初学者来说，要理解一个简单的方法调用背后的底层实现细节，就必须对整个消息发送流程有着足够清晰和深入的认知。推荐感兴趣的读者阅读 [Objective-C 消息发送与转发机制原理](http://yulingtianxia.com/blog/2016/06/15/Objective-C-Message-Sending-and-Forwarding/) 一文。

### objc_msgSend

> `Objective-C` 的消息发送和转发流程可以概括为：消息发送（Messaging）是 Runtime 通过 selector 快速查找 IMP 的过程，有了函数指针就可以执行对应的方法实现；消息转发（Message Forwarding）是在查找 IMP 失败后执行一系列转发流程的慢速通道，如果不作转发处理，则会打日志和抛出异常。

提到消息发送，就不得不提 `objc_msgSend` 函数。在 `Objective-C` 的世界里面，基本上所有的方法调用都会转化为消息发送，而消息发送的必经之路就是 `objc_msgSend` 。 相信有经验的开发者都知道 `objc_msgSend` 是基于汇编实现的，在 `M1/M2` 系列芯片统治 `ARM` 架构的当下，作为 `iOS` 开发者应该重点关注 `objc_msgSend` 在 `arm64` 上的底层实现即可。

```assembly
/********************************************************************
 *
 * id objc_msgSend(id self, SEL _cmd, ...);
 * IMP objc_msgLookup(id self, SEL _cmd, ...);
 * 
 * objc_msgLookup ABI:
 * IMP returned in x17
 * x16 reserved for our use but not used
 *
 ********************************************************************/

#if SUPPORT_TAGGED_POINTERS
	.data
	.align 3
	.globl _objc_debug_taggedpointer_ext_classes
_objc_debug_taggedpointer_ext_classes:
	.fill 256, 8, 0

// Dispatch for split tagged pointers take advantage of the fact that
// the extended tag classes array immediately precedes the standard
// tag array. The .alt_entry directive ensures that the two stay
// together. This is harmless when using non-split tagged pointers.
	.globl _objc_debug_taggedpointer_classes
	.alt_entry _objc_debug_taggedpointer_classes
_objc_debug_taggedpointer_classes:
	.fill 16, 8, 0

// Look up the class for a tagged pointer in x0, placing it in x16.
.macro GetTaggedClass

	and	x10, x0, #0x7		// x10 = small tag
	asr	x11, x0, #55		// x11 = large tag with 1s filling the top (because bit 63 is 1 on a tagged pointer)
	cmp	x10, #7		// tag == 7?
	csel	x12, x11, x10, eq	// x12 = index in tagged pointer classes array, negative for extended tags.
					// The extended tag array is placed immediately before the basic tag array
					// so this looks into the right place either way. The sign extension done
					// by the asr instruction produces the value extended_tag - 256, which produces
					// the correct index in the extended tagged pointer classes array.

	// x16 = _objc_debug_taggedpointer_classes[x12]
	adrp	x10, _objc_debug_taggedpointer_classes@PAGE
	add	x10, x10, _objc_debug_taggedpointer_classes@PAGEOFF
	ldr	x16, [x10, x12, LSL #3]

.endmacro
#endif

	ENTRY _objc_msgSend
	UNWIND _objc_msgSend, NoFrame

	cmp	p0, #0			// nil check and tagged pointer check
#if SUPPORT_TAGGED_POINTERS
	b.le	LNilOrTagged		//  (MSB tagged pointer looks negative)
#else
	b.eq	LReturnZero
#endif
	ldr	p13, [x0]		// p13 = isa
	GetClassFromIsa_p16 p13, 1, x0	// p16 = class
LGetIsaDone:
	// calls imp or objc_msgSend_uncached
	CacheLookup NORMAL, _objc_msgSend, __objc_msgSend_uncached

#if SUPPORT_TAGGED_POINTERS
LNilOrTagged:
	b.eq	LReturnZero		// nil check
	GetTaggedClass
	b	LGetIsaDone
// SUPPORT_TAGGED_POINTERS
#endif

LReturnZero:
	// x0 is already zero
	mov	x1, #0
	movi	d0, #0
	movi	d1, #0
	movi	d2, #0
	movi	d3, #0
	ret

	END_ENTRY _objc_msgSend


	ENTRY _objc_msgLookup
	UNWIND _objc_msgLookup, NoFrame
	cmp	p0, #0			// nil check and tagged pointer check
#if SUPPORT_TAGGED_POINTERS
	b.le	LLookup_NilOrTagged	//  (MSB tagged pointer looks negative)
#else
	b.eq	LLookup_Nil
#endif
	ldr	p13, [x0]		// p13 = isa
	GetClassFromIsa_p16 p13, 1, x0	// p16 = class
LLookup_GetIsaDone:
	// returns imp
	CacheLookup LOOKUP, _objc_msgLookup, __objc_msgLookup_uncached

#if SUPPORT_TAGGED_POINTERS
LLookup_NilOrTagged:
	b.eq	LLookup_Nil	// nil check
	GetTaggedClass
	b	LLookup_GetIsaDone
// SUPPORT_TAGGED_POINTERS
#endif

LLookup_Nil:
	adr	x17, __objc_msgNil
	SignAsImp x17
	ret

	END_ENTRY _objc_msgLookup

	
	STATIC_ENTRY __objc_msgNil

	// x0 is already zero
	mov	x1, #0
	movi	d0, #0
	movi	d1, #0
	movi	d2, #0
	movi	d3, #0
	ret
	
	END_ENTRY __objc_msgNil


	ENTRY _objc_msgSendSuper
	UNWIND _objc_msgSendSuper, NoFrame

	ldp	p0, p16, [x0]		// p0 = real receiver, p16 = class
	b L_objc_msgSendSuper2_body

	END_ENTRY _objc_msgSendSuper

	// no _objc_msgLookupSuper

	ENTRY _objc_msgSendSuper2
	UNWIND _objc_msgSendSuper2, NoFrame

#if __has_feature(ptrauth_calls)
	ldp	x0, x17, [x0]		// x0 = real receiver, x17 = class
	add	x17, x17, #SUPERCLASS	// x17 = &class->superclass
	ldr	x16, [x17]		// x16 = class->superclass
	AuthISASuper x16, x17, ISA_SIGNING_DISCRIMINATOR_CLASS_SUPERCLASS
LMsgSendSuperResume:
#else
	ldp	p0, p16, [x0]		// p0 = real receiver, p16 = class
	ldr	p16, [x16, #SUPERCLASS]	// p16 = class->superclass
#endif
L_objc_msgSendSuper2_body:
	CacheLookup NORMAL, _objc_msgSendSuper2, __objc_msgSend_uncached

	END_ENTRY _objc_msgSendSuper2

	
	ENTRY _objc_msgLookupSuper2
	UNWIND _objc_msgLookupSuper2, NoFrame

#if __has_feature(ptrauth_calls)
	ldp	x0, x17, [x0]		// x0 = real receiver, x17 = class
	add	x17, x17, #SUPERCLASS	// x17 = &class->superclass
	ldr	x16, [x17]		// x16 = class->superclass
	AuthISASuper x16, x17, ISA_SIGNING_DISCRIMINATOR_CLASS_SUPERCLASS
LMsgLookupSuperResume:
#else
	ldp	p0, p16, [x0]		// p0 = real receiver, p16 = class
	ldr	p16, [x16, #SUPERCLASS]	// p16 = class->superclass
#endif
	CacheLookup LOOKUP, _objc_msgLookupSuper2, __objc_msgLookup_uncached

	END_ENTRY _objc_msgLookupSuper2


.macro MethodTableLookup
	
	SAVE_REGS MSGSEND

	// lookUpImpOrForward(obj, sel, cls, LOOKUP_INITIALIZE | LOOKUP_RESOLVER)
	// receiver and selector already in x0 and x1
	mov	x2, x16
	mov	x3, #3
	bl	_lookUpImpOrForward

	// IMP in x0
	mov	x17, x0

	RESTORE_REGS MSGSEND

.endmacro

	STATIC_ENTRY __objc_msgSend_uncached
	UNWIND __objc_msgSend_uncached, FrameWithNoSaves

	// THIS IS NOT A CALLABLE C FUNCTION
	// Out-of-band p15 is the class to search
	
	MethodTableLookup
	TailCallFunctionPointer x17

	END_ENTRY __objc_msgSend_uncached


	STATIC_ENTRY __objc_msgLookup_uncached
	UNWIND __objc_msgLookup_uncached, FrameWithNoSaves

	// THIS IS NOT A CALLABLE C FUNCTION
	// Out-of-band p15 is the class to search
	
	MethodTableLookup
	ret

	END_ENTRY __objc_msgLookup_uncached


	STATIC_ENTRY _cache_getImp

	GetClassFromIsa_p16 p0, 0
	CacheLookup GETIMP, _cache_getImp, LGetImpMissDynamic, LGetImpMissConstant

LGetImpMissDynamic:
	mov	p0, #0
	ret

LGetImpMissConstant:
	mov	p0, p2
	ret

	END_ENTRY _cache_getImp

```

上面的代码是最新的 [objc4-818.2](https://opensource.apple.com/tarballs/objc4/objc4-818.2.tar.gz) 中的 `objc-msg-arm64.s` 汇编源文件中关于 `objc_msgSend` 的部分。

### Selector Stub 优化方案

### 选择合适的优化策略

## Retain & Release 调用

### objc_retain 和 objc_release

### 自定义调用约定

## Autorelease 自动省略

### 什么是 Autorelease 自动省略

### Autorelease 自动省略存在的问题

### Autorelease 自动省略优化方案

## 总结
