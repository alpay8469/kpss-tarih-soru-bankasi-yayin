@echo off
setlocal
cd /d "%~dp0"

rem WinRAR launches an archive member from a temporary folder. Require full extraction.
echo(%~dp0| findstr /r /i /c:"Rar\$" >nul
if not errorlevel 1 goto archive
if not exist "scripts\build.mjs" goto archive

if exist "runtime\node.exe" set "NODE_EXE=%~dp0runtime\node.exe"
if defined NODE_EXE goto node_found
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE goto node_missing

:node_found
"%NODE_EXE%" scripts/build.mjs
if errorlevel 1 goto fail

echo Tarih soru bankasi baslatiliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://127.0.0.1:4173/?sayfa=sorular'; try{$r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 2; if($r.StatusCode -eq 200 -and $r.Content.Contains('Soru Bankası')){Start-Process $u; exit 0}}catch{}; exit 2"
if not errorlevel 1 goto already_running
start "" /b "%NODE_EXE%" scripts/dev.mjs
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://127.0.0.1:4173/?sayfa=sorular'; $end=(Get-Date).AddSeconds(20); while((Get-Date)-lt $end){try{$r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 1;if($r.StatusCode -eq 200){Start-Process $u; exit 0}}catch{}; Start-Sleep -Milliseconds 400}; exit 1"
if errorlevel 1 goto server_failed
echo Uygulama tarayicida acildi. Sunucuyu durdurmak icin bu pencerede Ctrl+C basin.
pause
exit /b 0

:already_running
echo Tarih soru bankasi zaten acik; mevcut sunucu kullaniliyor.
echo Sunucu adresi: http://localhost:4173
pause
exit /b 0

:archive
echo ZIP dosyasinin icinden dogrudan baslatilamaz.
echo Once WinRAR'daki "Hedefe Ayikla" dugmesiyle paketin tamamini bir klasore cikarin.
echo Ardindan cikarilan klasorde outputs\tarih-soru-bankasi\BASLAT.cmd dosyasini calistirin.
pause
exit /b 1

:node_missing
echo Node.js 24.15 veya ustu kurulu olmali. Kurulumdan sonra bu dosyayi yeniden calistirin.
echo https://nodejs.org/en/download
pause
exit /b 1

:server_failed
echo Sunucu 20 saniye icinde hazir olmadi. Bu penceredeki hata mesajini kontrol edin.
pause
exit /b 1

:fail
echo Uygulama derlenemedi. Yukaridaki hata mesajini kontrol edin.
pause
exit /b 1

