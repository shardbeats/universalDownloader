@echo off
REM Universal Downloader - Instalacion y arranque con doble clic
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Universal Downloader

echo ============================================
echo  Universal Downloader - Inicio automatico
echo ============================================
echo.

REM [1/3] Verificar Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No tienes Node.js instalado.
  echo.
  echo  1. Descargalo gratis aqui: https://nodejs.org/
  echo  2. Instala la version LTS ^(22 o superior^).
  echo  3. Vuelve a hacer doble clic en start.bat
  echo.
  pause
  exit /b 1
)

for /f %%i in ('node -v') do set NODE_VER=%%i
set NODE_NUM=!NODE_VER:v=!
for /f "delims=. tokens=1" %%a in ("!NODE_NUM!") do set NODE_MAJOR=%%a
if !NODE_MAJOR! LSS 22 (
  echo [ERROR] Tienes Node.js !NODE_VER! pero se necesita la version 22 o superior.
  echo  El historial local usa sqlite, que solo funciona en Node 22+.
  echo.
  echo  Actualizalo aqui: https://nodejs.org/ y vuelve a intentarlo.
  echo.
  pause
  exit /b 1
)
echo [1/3] Node.js !NODE_VER! OK.

REM [2/3] Instalar dependencias solo la primera vez
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js esta instalado pero no se encontro npm.
  echo  Reinstala Node.js desde https://nodejs.org/ ^(incluye npm^).
  echo.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo [2/3] Instalando dependencias por primera vez...
  echo       Esto tarda 1-2 minutos, no cierres esta ventana.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] Fallo la instalacion. Revisa tu conexion a internet
    echo  y vuelve a hacer doble clic en start.bat
    echo.
    pause
    exit /b 1
  )
  echo.
  echo [2/3] Dependencias instaladas OK.
) else (
  echo [2/3] Dependencias ya instaladas OK.
)

REM [3/3] Arrancar servidor y abrir navegador
echo [3/3] Arrancando servidor en http://localhost:3000 ...
echo       No cierres esta ventana mientras lo uses.
echo       Para detenerlo presiona Ctrl+C.
echo.
start "" /min cmd /c "timeout /t 4 /nobreak >nul & start "" http://localhost:3000"
call npm start

echo.
echo El servidor se detuvo. Puedes cerrar esta ventana.
pause
