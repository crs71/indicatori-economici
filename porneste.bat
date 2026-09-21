@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo  Traducator Indicatori Economici
echo ========================================
echo.
if not exist node_modules (
  echo Instalare dependente...
  call npm install
  if errorlevel 1 (
    echo Eroare la npm install. Verifica daca Node.js este instalat.
    pause
    exit /b 1
  )
)
echo.
echo Pornire server pe http://localhost:3000
echo Inchide fereastra pentru a opri serverul.
echo.
call npm run dev
pause
