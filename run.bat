@echo off
REM Universal Downloader - Arranque rapido de uso diario
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Universal Downloader - http://localhost:3000

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Node.js. Ejecuta start.bat para instalar todo.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Te falta la instalacion inicial.
  echo Haz doble clic en start.bat primero ^(solo se hace una vez^).
  echo.
  pause
  exit /b 1
)

echo Abriendo http://localhost:3000 en tu navegador...
start "" /min cmd /c "timeout /t 4 /nobreak >nul & start "" http://localhost:3000"
echo.
echo Servidor corriendo. No cierres esta ventana. Ctrl+C para detener.
echo.
call npm start

echo.
pause
