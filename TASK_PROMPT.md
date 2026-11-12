请在本仓库实现一个可在浏览器打开的 WebGL2 延迟光照实验室（禁止 Docker），并让 `npm test` 全部通过。

硬性需求：
1) 打开 `index.html`（`npm start` 或 `python3 -m http.server 8782 --directory .`）后：左侧 WebGL2 画布、右侧参数面板；成功时 `#status` 为 `ready`。
2) 使用 G-Buffer（至少 albedo + normal）+ 全屏光照 pass。片元/顶点着色器放在 `src/shaders/`；支持至少 3 个点光源（位置/颜色/强度可调）。
3) 实现 `src/math/light.js` 的衰减与 Lambert/Blinn-Phong 组合，使 `npm test` 全绿并与 shader 一致。
4) 实现 `src/renderer.js` 的 `init/render`：创建 FBO/纹理、绘制一个 UV 球体到 G-Buffer，再光照合成到默认帧缓冲；相机自动旋转或轨道拖拽其一即可。
5) 实现 `src/ui/controls.js` 的 `bindControls`：光源强度/曝光即时生效；`Capture PNG` 可下载；`#stats` 显示 lightCount/exposure；错误写 `#status`。
6) 可复用 `src/glutil.js`、`src/mesh.js`。不要 Docker，不要改弱测试，保持原生 ESM。分文件短命令写入，写完立刻 `npm test` 直到通过。
