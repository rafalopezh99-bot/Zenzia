@echo off
chcp 65001 >nul
title Oficina RL Digital Studios
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Falta Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo.
  echo  Primera vez: necesito tu clave de la API de Claude.
  echo  La consigues en https://platform.claude.com/settings/keys
  echo.
  set /p CLAVE= Pega aqui la clave y pulsa Enter:
  call echo ANTHROPIC_API_KEY=%%CLAVE%%> .env.local
  echo  Clave guardada en .env.local
)

if not exist "node_modules" (
  echo.
  echo  Instalando la oficina ^(solo la primera vez, tarda un par de minutos^)...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)

rem Se prepara en cada arranque para recoger cualquier cambio traido con git pull.
echo.
echo  Preparando la oficina...
call npm install --no-audit --no-fund >nul
call npm run build
if errorlevel 1 ( pause & exit /b 1 )

echo.
echo  Abriendo la oficina en http://localhost:3333
echo  ^(deja esta ventana abierta mientras la uses; cierrala para apagar la oficina^)
start "" http://localhost:3333
call npm run start
