@echo off
echo ================================
echo   物业维保管理系统 - 构建工具
echo ================================
echo.

echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未安装 Node.js
    echo 请先安装 https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] 安装依赖（首次运行）...
call npm install

echo [3/3] 构建 Windows 可执行文件...
call npm run dist

echo.
echo ================================
echo 构建完成！exe 文件在 dist\ 目录
echo ================================
pause
