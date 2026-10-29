@echo off
chcp 65001 > nul
title RemindFlow - 忘却曲線暗記アプリ
echo ========================================================
echo   RemindFlow - 忘却曲線暗記アプリを起動しています...
echo ========================================================
echo.
cd /d "%~dp0"
start "" "http://localhost:5173"
call npm run dev
pause
