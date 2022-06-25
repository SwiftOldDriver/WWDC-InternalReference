---
session_ids: [10003]
---

# WWDC22 10003 - 初见 WeatherKit

本文基于 Session [10003](https://developer.apple.com/videos/play/wwdc2022/10003/)、Xcode 14.0 beta (14A5228q) 撰写，介绍 Apple 推出的 `WeatherKit` 天气服务，后续版本可能存在 API 变更，请读者朋友们留意。

## Apple 平台中的天气

天气 app 随着 iPhone OS 1 一同面世，在 iOS 7 及之前使用 Yahoo! 作为数据来源，在 iOS 8 开始使用 The Weather Channel 作为数据来源，在 iOS 15 增加 Dark Sky（已收购）作为数据来源，同时亦使用各国官方气象局和第三方数据服务商（如 BreezoMeter、和风天气）作为数据来源。

在 iOS 15 中，Apple 使用 SwiftUI 重写了天气 app。在 iPadOS 16 和 macOS Ventura 中，Apple 带来了独立的天气 app，而在此之前只能使用小组件来查看天气。在 WWDC22 中，Apple 整合已收购的 Dark Sky，推出了 `WeatherKit` 天气服务，包括 Swift 和 REST API 两个版本，后面我们会介绍如何进行接入。

## WeatherKit 支持的功能

`WeatherKit` 是 Apple 整合 Dark Sky 后推出的一个全球天气服务，它使用了高分辨率的天气模型、机器学习和预测算法，提供了大量的精准的天气（预报）数据，可以归纳为以下七个方面：

1. 当前天气 currentWeather
2. 每分钟预报 minuteForecast
3. 每小时预报 hourlyForecast
4. 每日预报 dailyForecast
5. 极端天气警报 weatherAlerts
6. 可用状态 availability
7. 历史天气

下面我们来逐一介绍这些天气数据集的详细情况。

### 当前天气

当前天气主要包括：

1. 时间 date
2. 过期时间 expirationDate
3. 天气状况 condition
4. 温度 temperature

除此之外还包括风向、风速、能见度、紫外线指数、日出日落、降水强度、湿度、气压等数据。

### 每分钟预报

每分钟预报包括降水类型、降水概率、降水强度等数据。

> 测试了多个地点均无法返回每分钟预报的相关数据，因此无法得知哪些是主要数据。

### 每小时预报

每小时预报主要包括：

1. 预报小时数量 hours count
2. 时间范围 date range
3. 第一个预报小时的天气状况 first condition
4. 第一个预报小时的温度 fist temperature
5. 最后一个预报小时的天气状况 last condition
6. 最后一个预报小时的温度 last temperature

除此之外还包括湿度、气压、紫外线指数、风、降水等数据。

### 每日预报

每日预报主要包括：

1. 预报日数量 days count
2. 时间范围 date range
3. 第一个预报日的天气状况 first condition
4. 第一个预报日的最高温度 first hight
5. 第一个预报日的最低温度 first low
6. 最后一个预报日的天气状况 last condition
7. 最后一个预报日的最高温度 last high
8. 最后一个预报日的最低温度 last low

除此之外还包括降水、日出日落、风、紫外线指数等数据。

### 极端天气警报

极端天气警报包括受影响地区、严重程度、描述等数据。

> 测试了多个地点均无法返回极端天气警报的相关数据，因此无法得知哪些是主要数据。

### 可用状态

可用状态主要包括：

1. 每分钟预报 minute availability
2. 极端天气警报 alert availability
3. 空气质量 air quality availability

> 文档及实际代码并不存在 `airQualityAvailability`，但打印实例可以查看该属性，猜测后续版本提供。

### 历史天气

历史天气包括气温、紫外线指数、风、降水强度、体感温度、湿度、能见度、气压等数据。

> 历史天气在 Swift 中暂不提供，需要使用 REST API 进行查询。

## 如何接入 WeatherKit

`WeatherKit` 分为 Swift 与 REST API 两个版本，Swift 版本可在 Apple 平台直接使用，REST API 版本可在其他平台使用，且数据更为丰富。

下面我们来介绍如何接入 `WeatherKit` 及注意事项。

### Swift 版本

想要使用 `WeatherKit` 的 Swift 版本，我们需要到 [Identifiers - Apple Developer](https://developer.apple.com/account/resources/identifiers/list) 创建一个 App ID 并启用 `WeatherKit` Capabilities 与 `WeatherKit` App Services。

> 创建完毕后，需要等待 30 分钟以便 Apple 更新权限。

让我们来实现一个简单的 SwiftUI app，了解如何使用 `WeatherKit`。

首先我们创建一个用于获取定位的管理器 `LocationManager`。`LocationManager` 提供三个公开的 API，分别是 `init()` 初始化方法、`requestLocation()` 请求定位方法、`location` 可被监听的位置变量，而 `CLLocationManager` 与其代理则作为私有变量。参考 `UIViewRepresentable` 的写法，用 `Coordinator` 实现 `CLLocationManager` 的代理，当获取到位置数据后，代理方法被执行，在主线程中异步对 `location` 进行赋值，从而触发监听。

```swift
import CoreLocation
import Foundation

public class LocationManager: ObservableObject {

    private let locationManager = CLLocationManager()
    private var coordinator: Coordinator!

    @Published
    public var location: CLLocation?

    public init() {
        coordinator = Coordinator(self)
        locationManager.delegate = coordinator
    }

    public func requestLocation() {
        locationManager.requestLocation()
    }
}

extension LocationManager {

    private class Coordinator: NSObject, CLLocationManagerDelegate {

        weak var parent: LocationManager?

        init(_ parent: LocationManager) {
            self.parent = parent
        }

        func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
            guard let location = locations.first else { return }

            DispatchQueue.main.async { [unowned self] in
                self.parent?.location = location
            }
        }

        func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
            print(error)
        }
    }
}
```

> 运行时在非主线程对 `@Published` 包装的属性进行赋值并触发 SwiftUI 更新会收到 Xcode 警告。

然后我们创建一个获取天气的管理类 `WeatherManager`。`WeatherManager` 提供八个公开的 API，分别是 `init()` 初始化方法、`weather(for:)` 请求天气数据方法、`alerts` 等六个具体的可被监听的天气数据变量，而 `WeatherService` 则作为私有变量。`WeatherService` 使用 Concurrency 进行编写，不在需要代理，因此 `WeatherManager` 亦不需要 `Coordinator` 进行协调。同样地，在获取到天气数据后，在主线程中异步赋值，避免触发 SwiftUI 非主线程更新的警告。

```swift
import CoreLocation
import Foundation
import WeatherKit

public class WeatherManager: ObservableObject {

    private let weatherService = WeatherService.shared

    @Published
    public var alerts: [WeatherAlert]?

    @Published
    public var current: CurrentWeather?

    @Published
    public var daily: Forecast<DayWeather>?

    @Published
    public var hourly: Forecast<HourWeather>?

    @Published
    public var minute: Forecast<MinuteWeather>?

    @Published
    public var availability: WeatherAvailability?

    public init() {}

    public func weather(for location: CLLocation) {
        self.alerts = nil
        self.current = nil
        self.daily = nil
        self.hourly = nil
        self.minute = nil
        self.availability = nil

        Task {
            do {
                let weather = try await weatherService.weather(
                    for: location,
                    including: .alerts, .current, .daily, .hourly, .minute, .availability
                )

                DispatchQueue.main.async { [unowned self] in
                    self.alerts = weather.0
                    self.current = weather.1
                    self.daily = weather.2
                    self.hourly = weather.3
                    self.minute = weather.4
                    self.availability = weather.5
                }
            } catch {
                print(error)
            }
        }
    }
}
```

> `WeatherService` 中的 `weather(for:)` 方法一经推出即被抛弃；而 `WeatherQuery` 中的 `weatherAvailability` 常量并不存在，实际为 `availability`；同样地 `Availability` 类型并不存在，实际为 `WeatherAvailability`。多处文档与实际代码不符，难以令人相信 Apple 今时今日的软件质量。
>
> `WeatherService` 的 `weather(for:)` 在 Xcode 14.0 beta 2 (14A5229c) 又回来了，这种反复横跳真是令人疑惑。

最后我们创建一个展示数据的简单列表 `ContentView`。`ContentView` 对 `LocationManager` 和 `WeatherManager` 进行监听，点击 `LocationButton` 后，触发 `LocationManager` 请求定位数据，成功取得定位数据后 `locationManager.location` 发生变更，`ContentView` 展示对应的信息并触发 `WeatherManager` 请求天气数据，成功取得天气数据后进行展示。需要注意的是，`WeatherKit` 中的类型大多为纯 Swift 类型，没有 `NSObject` 桥接版本，直接使用 `Text("Alerts: \(alerts)")` 会触发编译错误，因为 `Text.init` 被推断为 `LocalizedStringKey` 版本，其要求插值为 `NSObject` 子类或实现 `ReferenceConvertible` 协议。

```swift
import CoreLocationUI
import SwiftUI

struct ContentView: View {

    @StateObject
    private var locationManager = LocationManager()

    @StateObject
    private var weatherManager = WeatherManager()

    var body: some View {
        List {
            if let location = locationManager.location {
                let content = "Location: \(location)"
                Text(content)
            }

            if let alerts = weatherManager.alerts {
                let content = "Alerts: \(alerts)"
                Text(content)
            }

            if let current = weatherManager.current {
                let content = "Current: \(current)"
                Text(content)
            }

            if let daily = weatherManager.daily {
                let content = "Daily: \(daily)"
                Text(content)
            }

            if let hourly = weatherManager.hourly {
                let content = "Hourly: \(hourly)"
                Text(content)
            }

            if let minute = weatherManager.minute {
                let content = "Minute: \(minute)"
                Text(content)
            }

            if let availability = weatherManager.availability {
                let content = "Availability: \(availability)"
                Text(content)
            }

            HStack(alignment: .center) {
                Spacer()

                LocationButton(.currentLocation) {
                    locationManager.requestLocation()
                }
                .frame(height: 40)
                .cornerRadius(20)
                .foregroundColor(.white)

                Spacer()
            }
        }
        .onChange(of: locationManager.location) { newValue in
            if let location = newValue {
                weatherManager.weather(for: location)
            }
        }
    }
}
```

总的来说，`WeatherKit` 的 Swift 版本提供了十分的简单的 API 来查询天气数据，只需要传入一个定位即可查询对应的天气，天气数据也非常丰富，不仅提供了当前天气、还提供了每分钟、每小时、每日的预报数据（部分数据将于后续版本提供）。同时 `WeatherQuery` 这一种对类型占位符的使用方法亦值得学习，使用泛型和类型约束就可以达到强类型的使用效果，避免了字符串区分或定义多个方法带来的冗余代码。

### REST API 版本

如果考虑多平台或者低版本 iOS 使用 `WeatherKit` 提供的天气数据，我们可以使用 REST API 版本。

想要使用 `WeatherKit` 的 REST API 版本，我们需要到 [Identifiers - Apple Developer](https://developer.apple.com/account/resources/identifiers/list) 创建一个 Services ID 并启用 `WeatherKit` Services，或者按照 Swift 版本的步骤创建 App ID 并开启对应功能。然后到 [Keys - Apple Developer](https://developer.apple.com/account/resources/authkeys/list) 创建一个 Key 并启用 `WeatherKit` Services，需要注意该私钥只会展示一次，关闭页面后无法再次下载。

> 同样地，需要等待 30 分钟以便 Apple 更新权限。

这次我们使用 Python 3 来请求 `WeatherKit` 的 REST API，读者朋友们亦可使用其他语言。

`WeatherKit` 的 REST API 使用 `JWT` 和 `ES256` 算法作为请求授权认证，因此需要使用 `pip3` 安装 `PyJWT` 和 `cryptography`，或者其他的 `JWT` 实现库。我们把 `CUSTOM_ID` 改为对应的信息后，即可创建 token。

```py
import time
import jwt

def get_token() -> str:
    iss: str = 'CUSTOM_TEAM_ID' # 10 words
    iat: int = int(time.time())
    exp: int = iat + 60 * 60 * 24 * 7
    sub: str = 'CUSTOM_SERVICE_ID|CUSTOM_APP_ID'

    payload: dict = {'iss': iss, 'iat': iat, 'exp': exp, 'sub': sub}

    alg: str = 'ES256'
    kid: str = 'CUSTOM_KEY_ID' # 10 words
    id: str = f'{iss}.{sub}'

    headers: dict = {'alg': alg, 'kid': kid, 'id': id}

    p8: str = open(file='CUSTOM_P8_FILE').read()

    token: str = jwt.encode(payload=payload, key=p8, algorithm=alg, headers=headers)

    return token
```

`WeatherKit` 的 REST API 提供了两个 endpoint，都需要 `JWT` 作为请求授权认证，并且返回 `json`，因此我们先实现通用的网络请求方法。

```py
import json
from http.client import *
from urllib.request import *

def get_json(url: str, token: str) -> dict:
    request: Request = Request(url=url)
    request.add_header(key='Authorization', val=f'Bearer {token}')

    response: HTTPResponse = urlopen(url=request)
    body: bytes = response.read()

    data: dict = json.loads(s=body)

    return data
```

第一个 endpoint 是查询某地的天气数据集的可用状态。极端天气警报和空气质量等数据集并非所有国家可用，因此需要额外提供国家代码进行查询。

```py
def get_availability(token: str, latitude: float, longitude: float, country: str) -> dict:
    base: str = 'https://weatherkit.apple.com'
    path: str = f'/api/v1/availability/{latitude}/{longitude}?country={country}'
    url: str = base + path

    availability: dict = get_json(url=url, token=token)

    return availability
```

> 目前 CN / US / JP / KR 等国家均返回 currentWeather / forecastDaily / forecastHourly 可用，只有 US 返回 weatherAlerts 可用。
>
> 可查询的数据集目前不包含 `airQualityAvailability`，但文档中有提及，猜测后续版本提供。

第二个 endpoint 是查询某地的天气数据，代码中请求了所有的数据集，如果对应数据集不可用，则不返回。提供 `dailyStart` / `dailyEnd` / `timezone` 等参数可以查询该地的历史天气数据。

```py
def get_weather(token: str, language: str, latitude: float, longitude: float) -> dict:
    datasets: list = ['currentWeather', 'forecastDaily', 'forecastHourly', 'forecastNextHour', 'weatherAlerts']
    datasets_para = ','.join(datasets)

    base: str = 'https://weatherkit.apple.com'
    path: str = f'/api/v1/weather/{language}/{latitude}/{longitude}?dataSets={datasets_para}'
    url: str = base + path

    weather: dict = get_json(url=url, token=token)

    return weather
```

> 即使 US 支持查询 weatherAlerts，但测试发现不返回对应数据，不清楚是坐标不对还是数据未开放。

与 `WeatherKit` 的 Swift 版本相比，REST API 版本除了坐标数据外，还需要提供其他的参数才能进行查询，但也因此支持查询历史天气数据。两个版本都存在部分数据未提供的情况，需要等待 Apple 后续提供相关的数据。

> Swift 版本中的 `Weather` 类型支持 `Decodable` 协议，尝试使用 REST API 版本返回的 `json` 进行初始化，最后失败了。把 `Weather` 转成 `json` 后进行对比，发现两个版本的 `json` 并不相同，猜测 Apple 使用了单独的接口来请求数据。Apple 又对接口进行了证书校验，因而无法使用 HTTPS 解密进行验证。

### 接入要求

无论是 iOS app 还是 Android app，亦或者 Web 网站，只要我们用到了 `WeatherKit`，都需要标注数据由 Weather（及其合作方）提供，如果使用了极端天气警报的数据，还需要把从接口获取到的链接展示出来，以便提供该警报的来源与详细信息。

另外，`WeatherKit` 并不是完全免费的，每个 Apple 开发者计划每月有 50 万的免费调用次数，超出免费次数需要付费购买，具体限制如下：

1. 每月 50 万次，在 Apple 开发者计划有效期内
2. 每月 100 万次，49.99 美元
3. 每月 200 万次，99.99 美元
4. 每月 500 万次，249.99 美元
5. 每月 1000 万次，499.99 美元
6. 每月 2000 万次，999.99 美元

> 按照阶梯定价，推测每 100 万次调用约 50 美元，且付费次数单独计算，不包括免费次数。

## 总结

`WeatherKit` 提供了详尽的天气数据，包括当前天气数据、每分钟 / 每小时 / 每日天气预报数据、极端天气警报、历史天气数据，同时提供了 Swift 与 REST API 两种接入方法，接入也非常简单。对于有需求的个人开发者/小型开发团队来说，如果数据请求量在 50 万次每月以内，`WeatherKit` 是一个不错的选择。

再看看 `WeatherKit` 的前世今生，Apple 在 2020 年 4 月宣布收购 Dark Sky，到 2021 年 6 月推出的 iOS 15 开始集成 Dark Sky 的数据，到 2022 年 6 月推出 `WeatherKit`，总共花了两年的时间才把一个收购的公司彻底整合。从 REST API 的角度来看，这是 Apple 进入付费 Web API 的第一步，或许我们可以期待 Apple 在 WWDC23 推出股票相关的 Framework / Web API，逐步向真·全平台转型。
