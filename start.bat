@echo off
REM Universal Downloader Start
setlocal
title Universal Downloader - http://localhost:3000
where node >nul 2>nul || (echo Node.js required. & exit /b 1)
if not exist node_modules (npm install)
echo.
echo Abre en tu navegador: http://localhost:3000
echo.
npm start
