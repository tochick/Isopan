@echo off
setlocal
cd /d "%~dp0"
set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_EXE%" if "%NODE_EXE%"=="node" goto run
if not exist "%NODE_EXE%" goto missing
:run
"%NODE_EXE%" "iniciar-local.cjs"
if errorlevel 1 goto failed
start "" "http://127.0.0.1:4173/#/inicio"
exit /b
:failed
pause
exit /b 1
:missing
echo No se encuentra Node.js. Consulta README.md para instalarlo.
pause
