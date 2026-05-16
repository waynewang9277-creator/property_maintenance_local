# 应急装置电池放电测试 - 本地 APK 版本

## 项目说明

纯前端本地化方案，不依赖任何后端服务器，可在手机端独立运行。

## 文件结构

```
frontend/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
└── js/
    ├── jspdf.min.js    # jsPDF 库（用于生成 PDF）
    ├── pdf-generator.js # PDF 生成逻辑
    ├── data-manager.js  # 本地数据存储
    └── app.js          # 应用主逻辑
```

## 功能特点

- ✅ 完全离线运行，不需要服务器
- ✅ 数据存储在手机本地（localStorage）
- ✅ 拍照功能（支持相机直接拍照）
- ✅ 实时生成 PDF 报告
- ✅ 支持下载和分享

## 当前状态

**代码已完成，正在准备 jsPDF 中文字体支持**

jsPDF 默认不支持中文字符，需要额外处理。有以下方案：

1. **方案 A**：使用 jsPDF 的 `addFont` 添加中文字体（推荐）
2. **方案 B**：使用 `jspdf-autotable` 插件 + 嵌入字体
3. **方案 C**：改用 `pdfmake` 库（更好的中文支持）

## 安装 APK 打包工具

推荐使用 HBuilderX：
1. 下载：https://www.dcloud.io/hbuilderx.html
2. 安装后打开，将 `frontend` 文件夹拖入
3. 右键 → 发行 → 原生APP-云打包
4. 选择 Android，完成

## 下一步

1. 安装 Android Studio 和 HBuilderX
2. 解决 jsPDF 中文字体问题
3. 打包测试 APK

---

## 技术栈

- **前端框架**: 原生 HTML/CSS/JavaScript
- **PDF 生成**: jsPDF
- **数据存储**: localStorage
- **打包工具**: HBuilderX（或其他）