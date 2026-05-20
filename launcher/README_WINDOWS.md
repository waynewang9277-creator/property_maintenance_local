# 物业维保管理系统 - Windows 打包说明

## 打包步骤

在 Windows 上执行以下命令：

```cmd
cd kelong\launcher
build.bat
```

打包完成后：
- exe 文件：`launcher\output\kelong.exe`
- 前端资源：`launcher\output\` 下的 index.html、manifest.json、modules、common、assets

## 部署

将 `launcher\output\` 整个文件夹拷贝到目标电脑，双击 `kelong.exe` 即可运行。

## 文件说明

- `server_launcher.py` - Python 启动器源码
- `build.bat` - 打包脚本（自动安装 PyInstaller 并生成 exe）
- `output/` - 打包输出目录（打包后生成）

## 依赖

- Python 3.8+
- PyInstaller（脚本自动安装）

## 注意事项

- 服务器默认端口：8080
- exe 本身不包含前端资源，需要连同 output 目录下的所有文件一起部署
- 如果 8080 端口被占用，修改 `server_launcher.py` 中的 `PORT` 变量后重新打包
