@echo off
title Hercules Gym - Sistema de control de acceso
cd /d "%~dp0"

set ADMIN_USER=admin
set ADMIN_PASSWORD=admin123
set PORT=3000

echo.
echo ================================================
echo  HERCULES GYM - SISTEMA DE CONTROL DE ACCESO
echo ================================================
echo.
echo Login clientes:       http://localhost:%PORT%/login
echo Panel administrativo: http://localhost:%PORT%/admin
echo.
echo Usuario admin: %ADMIN_USER%
echo Clave admin:   %ADMIN_PASSWORD%
echo.
echo Deja esta ventana abierta mientras uses el sistema.
echo Para cerrar el sistema, presiona CTRL+C.
echo.

node server.js

echo.
echo El sistema se detuvo.
pause
