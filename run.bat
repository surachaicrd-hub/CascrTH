@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CR Distribution System Launcher

cd /d "%~dp0"

echo ==================================================
echo       CR Distribution System Launcher
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
    pushd "%~dp0frontend"
    call npm.cmd install
    popd
    if errorlevel 1 (
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
)

if not exist "%~dp0api\node_modules\" (
    echo [INFO] api/node_modules not found. Installing API dependencies...
    pushd "%~dp0api"
    call npm.cmd install
    popd
    if errorlevel 1 (
        echo [ERROR] API npm install failed.
        pause
        exit /b 1
    )
)

REM ========== Select Mode ==========
echo Please select run mode:
echo   [1] Development Mode (Fast / Hot-Reloading) - Recommended
echo   [2] Production Mode  (Build Frontend + Run API)
echo   [3] Quick Start      (Skip Build, Run API only)
echo.
choice /C 123 /N /T 10 /D 1 /M "Select option [1-3] (Default = 1 in 10s): "
set RUN_MODE=%ERRORLEVEL%
echo.

REM ========== Clean Ports 8200 & 8201 ==========
echo [1/3] Cleaning up ports 8200 and 8201...
for /f "tokens=5" %%T in ('netstat -a -n -o 2^>nul ^| findstr /C:":8200 " /C:":8201 "') do (
    if not "%%T"=="0" if not "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
echo Done.
echo.

REM ========== Database Check ==========
echo [2/3] Checking MySQL Database...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if errorlevel 1 (
    net start MySQL >nul 2>&1
    net start MySQL80 >nul 2>&1
    net start LaragonMySQL >nul 2>&1
    tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
    if errorlevel 1 (
        set "MYSQL_EXE="
        if exist "C:\laragon\bin\mysql\" (
            for /d %%D in ("C:\laragon\bin\mysql\*") do (
                if exist "%%D\bin\mysqld.exe" set "MYSQL_EXE=%%D\bin\mysqld.exe"
            )
        )
        if not defined MYSQL_EXE if exist "C:\xampp\mysql\bin\mysqld.exe" set "MYSQL_EXE=C:\xampp\mysql\bin\mysqld.exe"
        
        if defined MYSQL_EXE (
            echo Starting MySQL console from: !MYSQL_EXE!
            start "StorageShed MySQL Server" cmd /k ""!MYSQL_EXE!" --console"
            timeout /t 3 >nul
        ) else (
            echo [WARNING] MySQL is not running and MySQL path was not auto-detected.
            echo Please make sure your MySQL database server is running on port 3306.
            echo.
        )
    ) else (
        echo MySQL service started successfully.
    )
) else (
    echo MySQL is already running.
)
echo.

REM ========== Execute Selected Mode ==========
if "%RUN_MODE%"=="1" (
    echo [3/3] Starting System in Development Mode...
    echo - Backend API:  http://localhost:8201
    echo - Frontend Dev: http://localhost:8200
    echo.
    pushd "%~dp0api"
    start "CR Distribution Backend API (Port 8201)" cmd /k "node index.js"
    popd
    timeout /t 2 >nul

    pushd "%~dp0frontend"
    start "CR Distribution Frontend Dev (Port 8200)" cmd /k "npm.cmd run dev"
    popd
    timeout /t 2 >nul

    start http://localhost:8200
    goto RUNNING_COMPLETE
)

if "%RUN_MODE%"=="2" (
    echo [3/3] Building Frontend for Production...
    pushd "%~dp0frontend"
    call npm.cmd run build
    set BUILD_CODE=!ERRORLEVEL!
    popd

    if !BUILD_CODE! NEQ 0 (
        echo.
        echo [ERROR] Frontend build failed. See error messages above.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo Syncing build to API public directory...
    if not exist "%~dp0api\public\" mkdir "%~dp0api\public\"
    robocopy "%~dp0frontend\dist" "%~dp0api\public" /MIR /XD uploads /NP /NFL /NDL /NJH /NJS >nul 2>&1

    echo Starting Backend API...
    pushd "%~dp0api"
    start "CR Distribution Backend API (Port 8201)" cmd /k "node index.js"
    popd
    timeout /t 2 >nul

    start http://localhost:8201
    goto RUNNING_COMPLETE
)

if "%RUN_MODE%"=="3" (
    echo [3/3] Quick Starting System (Using Existing Build)...
    pushd "%~dp0api"
    start "CR Distribution Backend API (Port 8201)" cmd /k "node index.js"
    popd
    timeout /t 2 >nul

    start http://localhost:8201
    goto RUNNING_COMPLETE
)

:RUNNING_COMPLETE
echo.
echo ==================================================
echo   System launched successfully!
echo ==================================================
echo.
pause
