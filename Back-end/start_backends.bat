@echo off
REM Backend Services Starter for Windows
REM This batch file starts all backend services in the background

echo ============================================================
echo AWS Asset Library - Backend Services Starter
echo ============================================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python and add it to your PATH
    pause
    exit /b 1
)

REM Run the Python script that manages all backends
echo Starting all backend services...
echo.
python run_all_backends.py

pause

