# 物业维保管理系统 - Windows 桌面版

## 构建步骤

### 方法一：一键构建（推荐）
1. 确保 Windows 上已安装 **Node.js** (https://nodejs.org/)
2. 将整个 `kelong` 文件夹复制到 Windows
3. 进入 `electron` 子目录
4. 双击运行 `build.bat`
5. 构建完成后，exe 文件在 `dist/` 目录

### 方法二：手动构建
```bash
cd electron
npm install
npm run dist
```

## 输出
- `dist/KelongApp-1.0.0.exe` — 便携版 exe（无需安装，直接运行）
- 构建产物在 `dist/` 目录

## 注意事项
- 构建需要在 **Windows** 环境下进行
- Linux/macOS 无法交叉编译出 Windows exe
- 如果遇到网络问题，可以使用淘宝镜像：
  ```bash
  npm install --registry=https://registry.npmmirror.com
  ```
