@echo off
setlocal EnableExtensions
title StorageShed System

cd /d "%~dp0"

echo ==================================================
echo   StorageShed - Starting System
echo ==================================================
echo.

REM ========== Pre-requisite Checks ==========
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found. Please install Node.js first.
    echo Visit: https://nodejs.org/ to download and install it.
    echo.
    pause
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)

REM ========== Auto Install Dependencies ==========
if not exist "%~dp0frontend\node_modules\" (
    echo [INFO] frontend/node_modules not found. Installing frontend dependencies...
    cd /d "%~dp0frontend"
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

if not exist "%~dp0api\node_modules\" (
    echo [INFO] api/node_modules not found. Installing API dependencies...
    cd /d "%~dp0api"
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] API npm install failed.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
)

echo [0/3] Cleaning up ports 8080 and 8000...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o 2^>nul ^| findstr ":8080 "') DO (
    IF NOT "%%T"=="0" IF NOT "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o 2^>nul ^| findstr ":8000 "') DO (
    IF NOT "%%T"=="0" IF NOT "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
echo Done.
echo.

echo [1/3] Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if errorlevel 1 (
    if exist "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe" (
        echo Starting MySQL...
        start "MySQL" cmd /k "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe --console"
        timeout /t 3 >nul
    ) else (
        echo [WARNING] MySQL is not running and Laragon MySQL was not found.
        echo Please make sure your MySQL database server is running on port 3306!
        echo.
    )
) else (
    echo MySQL already running.
)
echo.

echo [2/3] Building Frontend - please wait 1-3 minutes...
echo.
cd /d "%~dp0frontend"
call npm.cmd run build
set BUILD_CODE=%ERRORLEVEL%
cd /d "%~dp0"

if %BUILD_CODE% NEQ 0 (
    echo.
    echo *** BUILD FAILED - see errors above ***
    echo.
    pause
    exit /b 1
)
echo.
echo Build OK! Deploying...

if exist "%~dp0api\public\assets" rmdir /s /q "%~dp0api\public\assets" >nul 2>&1
robocopy "%~dp0frontend\dist" "%~dp0api\public" /E /XD uploads /NP /NFL /NDL /NJH /NJS >nul 2>&1
echo Deploy OK!
echo.

echo [3/3] Starting Backend API...
start "StorageShed API" cmd /k "cd /d "%~dp0api" && node index.js"
timeout /t 2 >nul

echo.
echo ==================================================
echo   RUNNING
echo.
echo   Open browser: http://localhost:8080
echo ==================================================
echo.
pause
