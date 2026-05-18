@echo off
echo ================================
echo   Property Maintenance System
echo ================================
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Installing dependencies (first run)...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo [3/3] Building Windows executable...
call npm run dist
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ================================
echo Build complete! EXE is in dist\
echo ================================
pause
