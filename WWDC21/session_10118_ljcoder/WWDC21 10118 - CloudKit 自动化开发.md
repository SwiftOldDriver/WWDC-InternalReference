
本文基于[Session 10118](https://developer.apple.com/videos/play/wwdc2021/10118/)梳理

`CloudKit`是 Apple 的 BaaS 服务，基于 iCloud 提供云端数据存储，结合 Core Data 还能简单的实现多终端本地数据库同步功能。 

在使用 `CloudKit` 进行开发的过程中，我们一般都会先使用 [CloudKit Dashboard](https://icloud.developer.apple.com/dashboard/home/) 创建我们需要的 `Record Type` 数据模型，数据模型的每一个字段都要手动添加它的名称跟类型，操作起来特别麻烦。为了解决这个问题，此次 WWDC 苹果推出了 `cktool` 这个工具。

## 环境配置
`cktool` 的使用需要我们安装 Xcode 13，然后下载[初始项目](https://github.com/ljcoder2015/AutomatingCloudKitDemo/tree/master/starter)，配置好 iCloud。
![-w1597](https://cdn.nlark.com/yuque/0/2021/jpeg/383510/1624325111872-d4441eab-978b-4432-8672-211fdc1a34b0.jpeg)

使用 `cktool` 实现自动化，需要先配置 CloudKit 的身份验证信息。CloudKit 提供两种 token 来管理身份验证：
- **Management token：**这种 token 可以进行 public database 的数据存储和 CloudKit Management APIs 的调用。默认有效期为一年。
- **User token：**这种 token 可以用来查询 public database, private database, shared database 的数据，它的生命周期很短。
![Management token跟User token的对比](https://cdn.nlark.com/yuque/0/2021/jpeg/383510/1624325111178-c32d8abd-5bd6-425a-9770-36611a0099c1.jpeg)

打开 CloudKit Dashboard，选择 Account setting 菜单进行 Management Token 的设置。
![选择Account setting](https://cdn.nlark.com/yuque/0/2021/jpeg/383510/1624325111413-a826c34e-c57e-4fb0-b431-f518fa128321.jpeg)
![添加Management Token](https://cdn.nlark.com/yuque/0/2021/jpeg/383510/1624325111670-2397f9f4-d37f-4f1d-bd8b-9e9072e131c9.jpeg)

`cktool` 通过 `save-token` 命令来配置 Management Token
```
xcrun cktool save-token --type management
```
![save-token命令](https://cdn.nlark.com/yuque/0/2021/jpeg/383510/1624325111297-d556c5d5-917d-4b40-8104-2e51c5816107.jpeg)

同样的，通过 `save-token` 命令来配置 User Token
```
xcrun cktool save-token --type user
```
## cktool命令解析
我们想要 `cktool` 帮我们自动化处理的事有三件：
1. 还原测试环境，保证没有脏数据
2. 添加新增加的数据类型跟字段
3. 添加基本的测试数据

### 还原测试环境
通过 `reset-schema` 命令，我们可以恢复 development database 到跟当前的生产环境一样。
```
xcrun cktool reset-schema	\
	--team-id [TEAM-ID]		\
	--container-id [CONTAINER]
```
- **[TEAM-ID]：** [开发者后台](https://developer.apple.com/account/#/membership/)可以查询到Team ID
- **[CONTAINER]：**填上面配置的 Container ID

**示例：**
```
xcrun cktool reset-schema    \
    --team-id WW6UD727NP        \
    --container-id iCloud.com.ljcoder.AutomatingCloudKitDemo
```

### 添加新的数据类型
通过 `import-schema` 命令可以实现数据模型的添加。
```
xcrun cktool import-schema 		\
	--team-id [TEAM-ID]			\
	--container-id [CONTAINER]	\
	--environment development 	\
	--file schema.ckdb
```
- `--file schema.ckdb`：通过 CloudKit Schema Language 语法创建一个 schema 文件，通过文件我们可以批量增加想要的数据类型。CloudKit Schema Language 语法这里不做详细讨论，具体可以查看 [Integrating a Text-Based Schema into Your Workflow](https://developer.apple.com/documentation/cloudkit/integrating_a_text-based_schema_into_your_workflow)。

**schema文件内容示例：** 
```
DEFINE SCHEMA
    CREATE ROLE ljcoder4;

    RECORD TYPE Department (
        "___createTime" TIMESTAMP QUERYABLE SORTABLE,
        "___recordID" REFERENCE QUERYABLE,
        name STRING,
        address STRING,
        phone LIST<STRING>,
        employees LIST<REFERENCE>,
        GRANT WRITE TO "_creator",
        GRANT CREATE TO "_icloud",
        GRANT READ TO "_world",
        GRANT WRITE, CREATE, READ TO ljcoder4
    );

    RECORD TYPE Employee (
        "___createTime" TIMESTAMP QUERYABLE SORTABLE,
        "___recordID" REFERENCE QUERYABLE,
        name STRING,
        address STRING,
        hiredate TIMESTAMP,
        salary INT64,
        GRANT WRITE TO "_creator",
        GRANT CREATE TO "_icloud",
        GRANT READ TO "_world"
    );
```
通过 schema 文件我们创建了 `Department` 和 `Employee` 两个新的**Record Type**。`ljcoder4` 是我们创建的 Management Token 的名字，必须要保证已在 dashboard 中进行过添加，并且使用 `save-token` 命令进行了保存。
> 注: `reset-schema` 跟 `import-schema` 命令都依赖 **Management token** 进行身份验证。

### 添加测试数据
`create-record` 命令可以很方便的进行测试数据的添加。
```
xcrun cktool create-record		\
	--team-id [TEAM_ID]			\
	--container-id [CONTAINER]	\
	--zone-name [ZONE_NAME] 		\
	--database-type [public | private] 	\
	--environment [development | production]	\
	--record-type [RECORD_TYPE]	\
	[--fields-json [FIELDS_JSON]]
```
`FIELDS_JSON` 是一个 json 字符串，描述要更新的字段信息。
**示例:**
```
xcrun cktool create-record        \
    --team-id WW6UD727NP            \
    --container-id iCloud.com.ljcoder.AutomatingCloudKitDemo   \
    --zone-name _defaultZone         \
    --database-type private     \
    --environment development    \
    --record-type Department    \
    --fields-json '{
        "name": {
        "type": "stringType",
        "value": "IT部门"
        },
        "address": {
        "type": "stringType",
        "value": "广州"
        }
    }'
```
> 注: `create-record` 命令依赖 **User token** 进行身份验证。

## 利用Xcode Pre-actions实现自动化
有这样一个需求， 我们要开发一个部门跟员工列表，为此需要添加两种数据类型 `Department` 和 `Employee`，同时添加一个 `Department` 类型的 `Record`，用于展示默认部门。

使用 `cktool` 我们可以很方便的准备好我们的数据环境，使用 ` import-schema` 命令添加 `Department` 和 `Employee`，`create-record` 命令创建初始数据。

更进一步，我们可以借助 Xcode 的 **Pre-actions** 功能来自动化完成数据环境的准备。为了不重复添加类型，我们需要一开始执行 `reset-schema` 命令重置一下 Development 数据环境。

实现比较简单，点击 Xcode 菜单 **Product>Scheme>Edit Scheme**，打开如下界面，通过以下步骤把前面 `cktool` 的三个命令添加成一个 Action，这样每次执行 Run 之前，都会执行这个 Action。
![添加Action](https://cdn.nlark.com/yuque/0/2021/jpeg/383510/1624325111846-dad1e6be-c729-440f-af0d-cfd547419665.jpeg)
运行后我们就可以看到通过 `cktool` 添加的数据了。
![demo运行截图](https://cdn.nlark.com/yuque/0/2021/png/383510/1624325111183-1328c759-be59-414e-a2fa-e67bcf4b103a.png)

至此，我们就实现了自动化添加数据模型和默认数据，你还可以通过 [DEMO](https://github.com/ljcoder2015/AutomatingCloudKitDemo/tree/master/final) 查看具体细节。

## 总结
本文主要介绍了 `cktool` 以下的三个方面：
- `cktool` 访问权限的验证方式
    - Management toke 用来进行 Management APIs 的调用。
    - User token 用来查询和创建用户存储在 iCloud 的数据。
- `cktool` 常用命令解析
    - `reset-schema` 命令重置 Development 环境。
    - `import-schema` 命令添加数据模型。
    - `create-record` 命令添加数据。
- 借助 Pre-actions 实现 `cktool` 命令自动化执行