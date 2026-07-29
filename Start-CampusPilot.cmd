@echo off
setlocal

REM Starts the local API and React app in separate terminals, then opens CampusPilot.
set "PROJECT_ROOT=%~dp0"

start "CampusPilot API" cmd /k "cd /d ""%PROJECT_ROOT%server"" && npm.cmd run dev"
start "CampusPilot Frontend" cmd /k "cd /d ""%PROJECT_ROOT%"" && npm.cmd run dev"

REM Give Vite a few seconds to start before opening the app.
timeout /t 4 /nobreak >nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173"

endlocal
