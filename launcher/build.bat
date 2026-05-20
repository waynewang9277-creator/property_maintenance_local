@echo off
chcp 65001 >nul
echo ================================
echo   物业维保管理系统 - 打包工具
echo ================================
echo.

:: 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 安装PyInstaller
echo [1/4] 安装 PyInstaller...
pip install pyinstaller -q
if errorlevel 1 (
    echo [错误] PyInstaller 安装失败
    pause
    exit /b 1
)

:: 打包（用英文名避免编码问题）
echo [2/4] 正在打包，请稍候...
pyinstaller --onefile --noconsole --name "kelong" server_launcher.py
if errorlevel 1 (
    echo [错误] 打包失败
    pause
    exit /b 1
)

:: 创建输出目录
echo [3/4] 整理输出文件...
if exist "output" rmdir /s /q output 2>nul
mkdir output

:: 复制 exe
copy /Y "dist\kelong.exe" "output\" >nul

:: 复制前端资源
copy /Y "..\index.html" "output\" >nul
copy /Y "..\manifest.json" "output\" >nul
xcopy /Y /E "..\modules" "output\modules\" >nul 2>nul
xcopy /Y /E "..\common" "output\common\" >nul 2>nul
xcopy /Y /E "..\assets" "output\assets\" >nul 2>nul

echo [4/4] 完成！

echo.
echo ================================
echo   打包完成！
echo.
echo   输出目录: launcher\output\
echo   部署方式：
echo   1. 将 output 文件夹整体拷贝到目标电脑
echo   2. 双击 "kelong.exe" 即可运行
echo ================================
pause
