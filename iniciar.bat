@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Plataforma Web de Adopcion de Mascotas - Estado Zulia (Supabase)

:menu
cls
echo ======================================================================
echo    PLATAFORMA WEB DE ADOPCION DE MASCOTAS - ESTADO ZULIA (SUPABASE)
echo ======================================================================
echo.
echo  [1] Iniciar Plataforma Completa (Backend API :4000 + Web :8081)
echo  [2] Iniciar SOLO Backend API (http://localhost:4000)
echo  [3] Iniciar SOLO Frontend Web (http://localhost:8081)
echo  [4] Salir
echo.
echo ======================================================================
set "opcion="
set /p opcion="Elige una opcion (1-4) y presiona Enter: "

if "%opcion%"=="1" goto start_all
if "%opcion%"=="2" goto start_backend
if "%opcion%"=="3" goto start_web
if "%opcion%"=="4" goto salir
goto menu

:start_all
echo.
echo [1/2] Levantando Backend API conectado a Supabase en puerto 4000...
start "Backend API - Adopcion Mascotas" cmd /k "cd /d \"%~dp0backend\" && npm.cmd start"
echo [2/2] Levantando Aplicacion Web en http://localhost:8081 ...
cd /d "%~dp0frontend"
call npx.cmd expo start --web --port 8081
echo.
pause
goto menu

:start_backend
echo.
cd /d "%~dp0backend"
call npm.cmd start
pause
goto menu

:start_web
echo.
cd /d "%~dp0frontend"
call npx.cmd expo start --web --port 8081
pause
goto menu

:salir
exit
