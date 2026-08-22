@echo off
title Daftarkan Antagloma Print Bridge
color 0A
echo ========================================================
echo   PENDAFTARAN OTOMATIS PROTOKOL ANTAGLOMA PRINT BRIDGE
echo ========================================================
echo.

:: 1. Cek apakah AntaglomaPrint.exe ada di folder ini
if exist "%~dp0AntaglomaPrint.exe" (
    set "EXE_PATH=%~dp0AntaglomaPrint.exe"
    goto REGISTER
)

:: 2. Cari di lokasi umum jika dijalankan dari tempat lain
if exist "D:\Project EXE\Antagloma Print\publish\win-x64\AntaglomaPrint.exe" (
    set "EXE_PATH=D:\Project EXE\Antagloma Print\publish\win-x64\AntaglomaPrint.exe"
    goto REGISTER
)

if exist "%USERPROFILE%\Downloads\AntaglomaPrint.exe" (
    set "EXE_PATH=%USERPROFILE%\Downloads\AntaglomaPrint.exe"
    goto REGISTER
)

if exist "%USERPROFILE%\Desktop\AntaglomaPrint.exe" (
    set "EXE_PATH=%USERPROFILE%\Desktop\AntaglomaPrint.exe"
    goto REGISTER
)

:: 3. Jika tidak ditemukan otomatis, minta input lokasi
echo File AntaglomaPrint.exe tidak ditemukan di folder yang sama.
echo Silakan drag/tarik file AntaglomaPrint.exe ke jendela ini lalu tekan Enter:
set /p "EXE_PATH=Lokasi file: "
set "EXE_PATH=%EXE_PATH:"=%"

if not exist "%EXE_PATH%" (
    echo [ERROR] File tidak ditemukan di lokasi tersebut!
    pause
    exit /b
)

:REGISTER
echo.
echo Mendaftarkan ke Windows Registry: "%EXE_PATH%" ...
reg add "HKCU\Software\Classes\antaglomaprint" /ve /t REG_SZ /d "URL:Antagloma Print" /f >nul
reg add "HKCU\Software\Classes\antaglomaprint" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCU\Software\Classes\antaglomaprint\shell\open\command" /ve /t REG_SZ /d "\"%EXE_PATH%\" \"%%1\"" /f >nul

echo.
echo ========================================================
echo   BERHASIL! Antagloma Print Bridge telah terdaftar!
echo.
echo   Sekarang setiap kali Anda klik tombol "Cetak" di web,
echo   aplikasi printer akan langsung otomatis terbuka dan
echo   mencetak tanpa perlu copy-paste link lagi.
echo ========================================================
echo.
pause
