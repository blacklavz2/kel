@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js kurulu degil. https://nodejs.org adresinden indirip kur, sonra bu dosyayi tekrar calistir. & pause & exit /b)
echo Paketler indiriliyor, bu birkac dakika surebilir...
call npm install || (echo npm install basarisiz oldu. & pause & exit /b)
call npm run build || (echo exe olusturma basarisiz oldu. & pause & exit /b)
echo.
echo Bitti: dist klasorunde keltostv.exe olustu.
start "" dist
pause
