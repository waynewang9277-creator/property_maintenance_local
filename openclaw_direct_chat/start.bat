@echo off
chcp 65001 >nul
echo ================================
echo   OpenClaw 直接对话窗口
echo ================================
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查 Flask
pip show flask >nul 2>&1
if errorlevel 1 (
    echo [1/2] 安装 Flask...
    pip install flask -q
    if errorlevel 1 (
        echo [错误] Flask 安装失败
        pause
        exit /b 1
    )
)

echo [2/2] 启动服务器...
echo.
echo 访问地址: http://localhost:5002
echo 按 Ctrl+C 停止服务器
echo.

:: 启动服务器
python app.py

pause
