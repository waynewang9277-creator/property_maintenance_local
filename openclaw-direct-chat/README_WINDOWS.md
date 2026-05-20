# OpenClaw 直接对话窗口

绕过 AI 中间层（如 Hermes），直接调用 OpenClaw Agent。

## 目录结构

```
openclaw_direct_chat/
├── app.py           # Flask 服务器（跨平台）
├── start.bat        # Windows 启动脚本
├── static/
│   └── chat.html    # 前端页面
└── README_WINDOWS.md
```

## Windows 部署步骤

### 1. 安装依赖

**Python**：https://www.python.org/downloads/
- 安装时勾选 "Add Python to PATH"

**Node.js**：https://nodejs.org/
- Windows 版 Node.js 会自动添加到 PATH

**OpenClaw Windows 版**：
- 从 https://openclaw.ai 下载 Windows 安装包
- 安装后确认 `%USERPROFILE%\.openclaw-node\bin\openclaw.cmd` 存在

### 2. 安装 Python 依赖

```cmd
pip install flask
```

### 3. 启动

双击 `start.bat` 或手动运行：

```cmd
python app.py
```

### 4. 访问

打开浏览器：http://localhost:5002/

## Windows 路径说明

| 组件 | 默认路径 |
|------|---------|
| OpenClaw | `%USERPROFILE%\.openclaw-node\bin\openclaw.cmd` |
| Node.js | `%USERPROFILE%\node-v*-win-x64\bin\node.exe` |
| OpenClaw 配置 | `%USERPROFILE%\.openclaw\` |

## 故障排除

**OpenClaw not found**
- 确认 OpenClaw 已安装
- 检查 `%USERPROFILE%\.openclaw-node\bin\` 在 PATH 中

**Python not found**
- 重新安装 Python
- 确认安装时勾选了 "Add Python to PATH"

**端口 5002 被占用**
- 修改 `app.py` 中的 `port=5002` 为其他端口
