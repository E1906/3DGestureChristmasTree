# Gesture Christmas Tree (手势控制圣诞树)

这是一个基于 Three.js 和 MediaPipe 的 Web 互动项目。通过摄像头捕捉手势，你可以与 3D 圣诞树进行神奇的交互！

## ✨ 功能特点
- 🖐️ **张开手掌**: 唤醒圣诞树并使其旋转
- 👆 **竖起食指**: 停止旋转并触发惊喜特效
- 🎵 **背景音乐**: 点击按钮播放节日氛围音乐

## 🛠️ 环境配置

由于项目使用了 **ES Modules** (`<script type="module">`)，直接双击打开 `index.html` 会导致跨域（CORS）错误。**必须**使用本地服务器来运行项目。

### 前置要求
- **现代浏览器**: 推荐使用 Google Chrome (支持 WebGL 和摄像头权限)。
- **Node.js** (可选): 如果你想使用 `http-server` 等工具。

## 🚀 如何启动

请选择以下任意一种方式启动项目：

### 方法 1: 使用 VS Code Live Server (最简单)
如果你使用的是 VS Code 编辑器：
1. 安装 **Live Server** 插件。
2. 在文件列表中右键点击 `index.html`。
3. 选择 **Open with Live Server**。
4. 浏览器将自动打开项目页面。

### 方法 2: 使用 npx http-server
如果你安装了 Node.js，无需额外安装任何包，直接在终端（项目根目录下）运行：
```bash
npx http-server .
```
运行后，按住 `Ctrl` 点击终端中显示的连结（例如 `http://127.0.0.1:8080`）即可访问。

### 方法 3: 使用 Python
如果你电脑上有 Python 环境：
```bash
# Python 3
python -m http.server 8000
```
然后在浏览器访问 `http://localhost:8000`。

## ⚠️ 注意事项
1. **摄像头权限**: 首次运行时，浏览器会弹窗询问是否允许使用摄像头，请务必点击 **"允许"**，否则手势识别无法工作。
2. **网络连接**: 项目依赖 CDN 加载 Three.js 和 MediaPipe 模型，请确保电脑已连接互联网。

## 🖼️ 图片管理

项目现在支持**自动读取** `assets` 文件夹下的图片！

**如何添加图片**:
1. 直接将 `.png` 或 `.jpg` 图片放入 `assets` 文件夹。
2. 刷新网页即可。

**⚠️ 重要前提**:
此功能依赖于 Web 服务器开启 **目录浏览 (Directory Listing)** 功能。
- 如果使用 **Live Server** (VS Code): 默认支持，直接使用即可。
- 如果使用 **http-server**: 默认支持。
- 如果使用 **Python http.server**: 默认支持。
- *如果部署到某些静态托管服务（如 Vercel/Netlify），可能需要额外配置或回退到手动列表模式。*

## 📂 项目结构
```
├── index.html        # 网页入口
├── main.js           # 核心逻辑
├── style.css         # 样式文件
├── visuals/          # 视觉效果组件
│   ├── tree.js       # 圣诞树生成逻辑
│   └── scene.js      # 场景设置
├── assets/           # 静态资源 (音乐, JSON数据等)
└── tracking/         # (如有) 追踪相关代码
```

## 🚀 部署到 GitHub Pages

1.  **提交代码**: 确保所有更改都已提交到 Git。
    ```bash
    git add .
    git commit -m "准备部署"
    ```
2.  **推送到 GitHub**:
    ```bash
    # 如果还没有远程仓库，请先在 GitHub 上创建
    git remote add origin https://github.com/E1906/3DGestureChristmasTree.git
    git branch -M main
    git push -u origin main
    ```
3.  **开启 Pages**:
    *   打开 GitHub 仓库页面 -> **Settings** (设置)
    *   在左侧菜单点击 **Pages**
    *   在 **Build and deployment** 下:
        *   Source: 选择 **Deploy from a branch**
        *   Branch: 选择 **main** / **root**
    *   点击 **Save**
4.  **访问**: 等待几分钟后，刷新页面即可看到部署链接（通常是 `https://e1906.github.io/3DGestureChristmasTree/`）。

