# 圣诞 · 粒子空间 / Christmas Particle Space

用双手探索一棵粒子圣诞树，打开挂在树上的礼盒，进入五个微缩粒子世界。

Explore a particle Christmas tree with your hands. Open its hanging gifts to enter five miniature particle worlds.

## 在线体验 / Live Demo

**[点击体验圣诞树 / Open the Christmas Tree](https://billlongfl168.github.io/christmas-particle-space/)**

直接用现代浏览器打开即可，无需安装 Python、下载代码或注册 GitHub。使用手势时，点击开启摄像头并允许访问。

Open the link in a modern browser. No Python installation, source download or GitHub account is required. To use gestures, enable the camera and grant permission.

## 项目介绍 / Overview

这是一个基于浏览器的交互式 3D 圣诞艺术项目。松针、树干、灯光、礼盒和场景物体通过粒子呈现，结合摄像头手部识别，支持旋转、缩放、开启礼盒和场景切换。

A browser-based interactive 3D Christmas artwork. Particles form the tree, lights, gifts and scene objects. Camera-based hand tracking supports rotation, zoom, gift opening and transitions between worlds.

项目采用静态 HTML 与原生 JavaScript 模块，无需 npm 安装或构建。  
Built with static HTML and native JavaScript modules; no npm installation or build step is required.

## 五个礼盒世界 / Five Gift Worlds

| 世界 / World | 内容 / Contents |
| --- | --- |
| 星光 / Starlight | 立体星形粒子与环绕光流 / A dimensional particle star with orbiting streams |
| 雪村 / Snow Village | 木屋、铁轨、行驶的小火车和摇摇木马 / Cabins, railway tracks, a moving train and a rocking horse |
| 雪林 / Snow Forest | 雪树、球形粒子罩、冰枝和飘雪 / A snowy tree, spherical particle shell, icy branches and drifting snow |
| 钟楼 / Bell Tower | 双钟、钟锤摆动及冲击光环 / Twin bells, swinging clappers and expanding impact rings |
| 极光山谷 / Aurora Valley | 波动的极光帘、山脊和森林 / Flowing aurora curtains, mountain ridges and trees |

## 本地运行 / Run Locally

仅在需要下载代码并在自己的电脑上运行或修改时，使用以下步骤。在线体验无需这些准备。项目本身不依赖 Python；下面仅用 Python 3 启动本地 HTTP 服务器，也可使用其他静态文件服务器。浏览器需支持 WebGL；手势操作需要摄像头权限。  
Follow these steps only to run or modify the downloaded source on your own computer. They are not needed for the live demo. The project itself does not depend on Python; Python 3 is used below only to start a local HTTP server and can be replaced with another static file server. Use a WebGL-capable browser and grant camera permission for gestures.

```bash
git clone https://github.com/billlongfl168/christmas-particle-space.git
cd christmas-particle-space
python3 -m http.server 8000
```

打开 / Open: **http://localhost:8000/**

请通过 HTTP 服务器打开，不要直接双击 HTML：页面需要加载 JavaScript 模块、WASM 和手部识别模型。  
Use the HTTP server rather than opening the HTML file directly: the app loads JavaScript modules, WASM and a hand-tracking model.

本地摄像头使用 localhost；远程托管时请使用 HTTPS 并允许摄像头权限。  
Use localhost for local camera access. Remote hosting requires HTTPS and camera permission.

## 操作说明 / Controls

先点击 **开启摄像头**，允许访问摄像头，让整只手进入画面，并先张开拇指和食指，再进行捏合。手势效果可能受光照、遮挡、设备和浏览器影响。

Click **开启摄像头 (Enable camera)** and grant camera access. Keep your whole hand in view, separating your thumb and index finger before pinching. Tracking quality depends on lighting, occlusion, device and browser.

| 操作 / Action | 方法 / Gesture |
| --- | --- |
| 旋转 / Rotate | 对准主体，拇指与食指捏合后拖动；张开手掌左右移动也可带动水平旋转。/ Aim at the subject, pinch and drag. Moving an open palm sideways can also rotate it horizontally. |
| 缩放 / Zoom | 未抓取物体时，逐渐张开或收拢手掌。/ Gradually open or close your hand while not grabbing an object. |
| 锁定缩放 / Lock zoom | 点击右下方锁形按钮，或用手指对准后捏合。/ Click the lock button near the bottom right, or aim at it and pinch. |
| 打开礼盒 / Open a gift | 对准礼盒，快速完成两次捏合并松开，礼盒会打开并进入对应世界。/ Aim at a gift and pinch-release twice in quick succession to open it and enter its world. |
| 返回圣诞树 / Return to the tree | 在礼盒世界中，对准左下方返回礼盒，再快速捏合并松开两次。/ In a gift world, aim at the return gift near the bottom left and pinch-release twice. |

当前主场景交互以摄像头手势为主；尚未提供完整的鼠标或键盘替代操作。不开摄像头时仍可观看默认圣诞树画面。  
The main scene currently relies on camera gestures; complete mouse and keyboard alternatives are not implemented. The default tree can still be viewed without enabling the camera.

## 技术实现 / Technical Design

- **Three.js + GLSL**：粒子几何、着色、深度遮挡和场景渲染。  
  Particle geometry, shading, depth occlusion and scene rendering.
- **MediaPipe Hand Landmarker**：加载仓库内模型和运行时，在浏览器中识别手部关键点。  
  Uses the bundled model and runtime to detect hand landmarks in the browser.
- **礼盒预览 / Gift previews**：将内部世界渲染到纹理，显示在打开的礼盒内。  
  Internal worlds are rendered to textures displayed inside opened gifts.
- **场景过渡 / Scene transitions**：从礼盒预览逐渐扩展到完整世界，并支持返回。  
  Gift previews expand into full scenes, with a return transition.
- **性能控制 / Performance controls**：根据屏幕宽度调整部分粒子密度，限制像素比，并依据帧耗时降低渲染分辨率。  
  Adjusts some particle densities by viewport width, caps pixel ratio and reduces rendering resolution when frame times are high.

## 文件结构 / Project Structure

```text
index.html             主入口 / Main entry
immersive.html         备用入口 / Alternate entry
immersive.js           场景、摄像头与手势 / Scenes, camera and gestures
christmas-worlds.js     五个礼盒世界 / Five gift worlds
particle-art.js        粒子材质与造型 / Particle materials and geometry
model/                 第三方运行时、模型和 WASM / Third-party runtime, model and WASM
.nojekyll              静态托管辅助文件 / Static hosting support
README.md              中英双语说明 / Bilingual documentation
LICENSE                原创项目代码许可证 / Original project code license
```

## 摄像头与隐私 / Camera and Privacy

摄像头仅在点击启用按钮后申请。当前应用源码使用本地模型推理，没有实现录像上传；离开页面时会停止摄像头轨道。这些描述基于应用源码，不代表完整第三方依赖审计。

Camera access is requested only after clicking the enable button. The application source performs local inference and does not implement video uploads. Camera tracks are stopped when leaving the page. This describes the application code, not a full audit of third-party dependencies.

## 常见问题 / Troubleshooting

- **摄像头无法启动 / Camera will not start**：检查权限、HTTPS 或 localhost，以及摄像头是否被其他应用占用。  
  Check permissions, HTTPS or localhost access, and whether another app is using the camera.
- **手势模型无法加载 / Model fails to load**：确保完整保留 `model/`，并通过本地服务器运行。  
  Keep the complete `model/` directory and run through a local server.
- **没有识别到手 / Hand not detected**：增加均匀光照，让整只手入镜，先分开拇指与食指。  
  Use even lighting, keep the whole hand visible and separate thumb and index finger first.
- **画面卡顿 / Low frame rate**：关闭其他占用 GPU 的页面，缩小窗口，并确认浏览器硬件加速已开启。  
  Close other GPU-heavy tabs, reduce window size and check browser hardware acceleration.

## 开发状态 / Development Status

这是持续迭代的交互艺术原型。上面的功能说明依据当前仓库源码整理；本次文档更新没有重新执行完整浏览器、移动端或真人手势测试。减少动态效果偏好已用于部分动画，完整的暂停控制和可访问性仍可继续完善。

This is an evolving interactive art prototype. The descriptions above reflect the current repository source. This documentation update did not rerun complete browser, mobile or live hand-tracking tests. Reduced-motion preferences affect some animations; comprehensive pause controls and accessibility remain areas for improvement.

欢迎提交问题或改进建议，并提供浏览器、设备、复现步骤及预期结果。  
Issues and improvements are welcome. Please include your browser, device, reproduction steps and expected behavior.

## 许可证 / License

本项目原创代码采用 [MIT License](LICENSE)。`model/` 下的第三方库、模型、WASM 及其他上游资源不因本许可证而被重新许可，仍适用各自上游条款；再分发时请保留并核对相关许可声明。

Original project code is licensed under the [MIT License](LICENSE). Third-party libraries, models, WASM and other upstream assets under `model/` are not relicensed by this license and remain subject to their respective upstream terms. Preserve and verify their license notices when redistributing.
