# Android 开发环境搭建指南

## 1. 下载 Android Studio

**下载地址：**
https://developer.android.com/studio

点击 "Download Android Studio" 按钮

## 2. 安装 Android Studio

1. 双击下载的 `.exe` 文件
2. 按提示一路点击 "Next" / "I accept" 
3. **安装位置建议**：D:\Android\Android Studio
4. 安装完成后点击 "Finish"

## 3. 首次启动配置

1. 启动 Android Studio
2. 选择 "Do not import settings" （第一次使用）
3. 等待下载 SDK 组件（可能需要 10-20 分钟）
4. 选择 "Standard" 安装类型
5. 点击 "Next" → "Finish"

## 4. 创建模拟器（AVD）

1. 在 Android Studio 欢迎页点击 "More Actions" → "Virtual Device Manager"
2. 点击 "Create Device"
3. 选择设备类型（如 "Pixel 4" 或 "Pixel 5"）
4. 选择系统镜像（如 "R" API 30）
5. 点击 "Next" → "Finish"
6. 等待下载完成（约 5-10 分钟）

## 5. 下载 Node.js（用于 APK 打包）

如果用 HBuilder 等工具打包，需要 Node.js：
https://nodejs.org/
下载 LTS 版本，安装时一路下一步即可

## 6. APK 打包工具推荐

### 方案 A：HBuilderX（最简单）
1. 下载 HBuilderX：https://www.dcloud.io/hbuilderx.html
2. 将前端代码拖入 HBuilderX
3. 右键 → "发行" → "原生APP-云打包"
4. 选择 Android 平台，完成

### 方案 B：Android Studio WebView（更专业）
需要创建 Android 项目，内嵌 WebView 加载前端

---

## 快速开始（推荐先用 HBuilderX）

1. 下载安装 HBuilderX
2. 把 `E:\openclaw_workspace\property_maintenance_local\frontend` 代码导入
3. 打包成 APK
4. 用 Android Studio 的模拟器安装测试

---

## 项目目录结构

```
E:\openclaw_workspace\property_maintenance_local\
├── frontend\          # 前端代码（改造后）
│   ├── index.html
│   ├── css/
│   └── js/
├── docs/              # 文档
└── apk/              # 打包输出目录
```

---

## 下一步操作

1. 先安装 Android Studio 和 Node.js
2. 安装完成后告诉我，我帮你：
   - 改造前端代码（用 jsPDF 替代 Flask API）
   - 打包成 APK
   - 创建 Android 测试项目

需要我先帮你准备改造后的前端代码吗？