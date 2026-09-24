@echo off
title Finance Dashboard
cd /d "%~dp0"

echo ========================================================
echo               FINANCE DASHBOARD - LOCAL DEV
echo ========================================================
echo.

:: 1. Verifikasi instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak terdeteksi di sistem ini!
    echo Silakan install Node.js terlebih dahulu melalui https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verifikasi folder node_modules
if not exist "node_modules\" (
    echo [INFO] Dependensi belum terpasang. Menjalankan npm install...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Gagal menginstall dependensi via npm install.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependensi berhasil diinstall.
    echo.
)

:: 3. Jalankan server Vite dan buka peramban secara otomatis
echo [INFO] Menyalakan server pengembangan Vite...
echo [INFO] Browser akan terbuka otomatis di http://localhost:5173
echo.
echo Tekan tombol Ctrl + C di jendela ini untuk mematikan server.
echo.

call npm run dev -- --open

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Server dihentikan.
)

pause
