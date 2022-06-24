//
//  ContentView.swift
//  ResponsiveMediaApp
//
//  Created by Vito on 2022/6/19.
//

import SwiftUI
import AVFoundation

struct VideoURL: Identifiable {
    public let id = UUID()
    public var index: Int
    public var url: String
    init(index: Int, url: String) {
        self.url = url
        self.index = index
    }
}

struct ImageView: View {
    var image: CGImage? = nil
    
    var body: some View {
        if let image = image {
            Image(image, scale: 1.0, label: Text("Image"))
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 300.0, height: 400.0)
                .clipped()
        } else {
            Image("placeholder")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 300.0, height: 400.0)
                .clipped()
        }
    }
    
}

let wwdcURLString = "https://devstreaming-cdn.apple.com/videos/wwdc/2018/236mwbxbxjfsvns4jan/236/236_hd_avspeechsynthesizer_making_ios_talk.mp4?dl=1"

let videoURLs: [VideoURL] = [VideoURL(index: 0, url: wwdcURLString),
                             VideoURL(index: 1, url: wwdcURLString),
                             VideoURL(index: 2, url: wwdcURLString),
                             VideoURL(index: 3, url: wwdcURLString),
                             VideoURL(index: 4, url: wwdcURLString),
                             VideoURL(index: 5, url: wwdcURLString)]

// MARK: - 同步加载
// 使用这种方式，加载过程是无法响应 UI 的，list 无法滚动
func syncLoadImageWithURL(url: VideoURL) -> CGImage? {
    guard let urlString = URL(string: url.url) else {
        return nil
    }
    let asset = AVAsset(url: urlString)
    let generator = AVAssetImageGenerator(asset: asset)
    let time = CMTime(seconds: 60, preferredTimescale: 600)
    let image = try? generator.copyCGImage(at: time, actualTime: nil)
    return image
}

struct ContentView: View {
    @State var images: [Int: CGImage] = [:]

    var body: some View {
        List(videoURLs) { url in
            let cgimage = images[url.index]
            let view = ImageView(image: cgimage)
            view.task {
                if images[url.index] == nil {
                    images[url.index] = syncLoadImageWithURL(url: url)
                }
            }
        }
    }
}

// MARK: - 异步加载
// 这种方式 UI 可以流畅响应
func asyncLoadImageWithURL(url: VideoURL) async -> CGImage? {
    guard let urlString = URL(string: url.url) else {
        return nil
    }
    let asset = AVAsset(url: urlString)
    let generator = AVAssetImageGenerator(asset: asset)
    let time = CMTime(seconds: 60, preferredTimescale: 600)
    let image = try? await generator.image(at: time).image
    return image
}

struct ContentView: View {
    @State var images: [Int: CGImage] = [:]

    var body: some View {
        List(videoURLs) { url in
            let cgimage = images[url.index]
            let view = ImageView(image: cgimage)
            view.task {
                if images[url.index] == nil {
                    images[url.index] = await asyncLoadImageWithURL(url: url)
                }
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
