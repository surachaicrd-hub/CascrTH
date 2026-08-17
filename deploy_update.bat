@echo off
setlocal EnableExtensions
title WebAi Update Package Builder

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "DIST_DIR=%FRONTEND_DIR%\dist"
set "API_DIR=%ROOT_DIR%api"
set "API_PUBLIC_DIR=%API_DIR%\public"
set "ZIP_FILE=%ROOT_DIR%deploy_api_update.zip"

echo ============================================
echo   WebAi Update Package Builder
echo ============================================
echo.

cd /d "%ROOT_DIR%"

echo Cleaning up ports 8201, 8200, 8080, 8000 to unlock files...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o 2^>nul ^| findstr ":8201 "') DO (
    IF NOT "%%T"=="0" IF NOT "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o 2^>nul ^| findstr ":8200 "') DO (
    IF NOT "%%T"=="0" IF NOT "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o 2^>nul ^| findstr ":8080 "') DO (
    IF NOT "%%T"=="0" IF NOT "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o 2^>nul ^| findstr ":8000 "') DO (
    IF NOT "%%T"=="0" IF NOT "%%T"=="" taskkill /PID %%T /F >nul 2>&1
)
echo Done.
echo.
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found. Please install Node.js first.
    echo.
    pause
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm.cmd was not found. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)

where tar >nul 2>nul
if errorlevel 1 (
    echo [ERROR] tar was not found on this Windows installation.
    echo.
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] frontend\package.json was not found.
    echo.
    pause
    exit /b 1
)

if not exist "%API_DIR%\index.js" (
    echo [ERROR] api\index.js was not found.
    echo.
    pause
    exit /b 1
)

if exist "%ZIP_FILE%" (
    echo [1/5] Removing old deploy_api_update.zip...
    del /f /q "%ZIP_FILE%"
)

echo [2/5] Installing frontend dependencies...
call npm.cmd --prefix "%FRONTEND_DIR%" install
if errorlevel 1 (
    echo.
    echo [ERROR] Frontend npm install failed.
    echo.
    pause
    exit /b 1
)

echo.
echo [3/5] Building frontend...
call npm.cmd --prefix "%FRONTEND_DIR%" run build
if errorlevel 1 (
    echo.
    echo [ERROR] Frontend build failed.
    echo.
    pause
    exit /b 1
)

if not exist "%DIST_DIR%\index.html" (
    echo.
    echo [ERROR] frontend\dist\index.html was not created.
    echo.
    pause
    exit /b 1
)

echo.
echo [4/5] Syncing frontend build into api\public...
if not exist "%API_PUBLIC_DIR%" mkdir "%API_PUBLIC_DIR%"

robocopy "%DIST_DIR%" "%API_PUBLIC_DIR%" /MIR /XD uploads /NFL /NDL /NJH /NJS /NP
set "ROBOCOPY_CODE=%ERRORLEVEL%"
if %ROBOCOPY_CODE% GEQ 8 (
    echo.
    echo [ERROR] Failed to copy frontend build into api\public.
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Creating deploy_api_update.zip...
echo The ZIP is structured for your cPanel Application Root.
echo It will extract index.js, public, routes, services, etc. at the root.
echo.

pushd "%API_DIR%"
tar -a -c -f "%ZIP_FILE%" ^
    --exclude=node_modules ^
    --exclude=node_modules_linux.tar.gz ^
    --exclude=coverage ^
    --exclude=tests ^
    --exclude=test-gemini.js ^
    --exclude=jest.config.js ^
    --exclude=logs ^
    --exclude=.env ^
    --exclude=public/uploads ^
    config ^
    fonts ^
    public ^
    routes ^
    services ^
    index.js ^
    package.json ^
    package-lock.json ^
    .npmrc ^
    ecosystem.config.js
set "TAR_CODE=%ERRORLEVEL%"
popd

if not "%TAR_CODE%"=="0" (
    echo.
    echo [ERROR] Failed to create deploy_api_update.zip.
    echo.
    pause
    exit /b 1
)

if not exist "%ZIP_FILE%" (
    echo.
    echo [ERROR] deploy_api_update.zip was not created.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   DONE
echo   File: deploy_api_update.zip
for %%A in ("%ZIP_FILE%") do echo   Size: %%~zA bytes
echo.
echo   How to update on cPanel:
echo   1. Upload deploy_api_update.zip to the Application Root.
echo   2. Extract and overwrite existing files.
echo   3. Do NOT delete .env.
echo   4. Do NOT delete public/uploads.
echo   5. Click Restart App in Node.js App.
echo.
echo   Expected cPanel settings:
echo   - Application Root: your domain folder
echo   - Document Root:    your domain folder/public
echo   - Startup File:     index.js
echo ============================================
echo.
pause
