@echo off
setlocal EnableExtensions
title WebAi Full Production Build

set "ROOT_DIR=%~dp0"
set "ZIP_FILE=%ROOT_DIR%deploy_api.zip"

echo ==============================================
echo        WebAi Full Production Build
echo ==============================================
echo.

cd /d "%ROOT_DIR%"

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

if exist "%ZIP_FILE%" (
    echo Removing old deploy_api.zip...
    del /f /q "%ZIP_FILE%"
)

echo Running full deployment builder...
echo This creates deploy_api.zip for a fresh cPanel Node.js app deploy.
echo.

call npm.cmd run deploy
if errorlevel 1 (
    echo.
    echo [ERROR] Deployment build failed. Please check the messages above.
    echo.
    pause
    exit /b 1
)

if not exist "%ZIP_FILE%" (
    echo.
    echo [ERROR] deploy_api.zip was not created.
    echo.
    pause
    exit /b 1
)

echo.
echo ==============================================
echo   DONE
echo   File: deploy_api.zip
for %%A in ("%ZIP_FILE%") do echo   Size: %%~zA bytes
echo.
echo   Upload deploy_api.zip to the application root
echo   and extract it there.
echo.
echo   cPanel settings:
echo   - Application Root: your domain folder
echo   - Document Root:    your domain folder/public
echo   - Startup File:     index.js
echo.
echo   Keep the existing .env and public/uploads on live hosting.
echo ==============================================
echo.
pause
