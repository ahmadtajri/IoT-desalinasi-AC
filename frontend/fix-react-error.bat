@echo off
echo ========================================
echo Fixing React useState Error
echo ========================================
echo.

echo [1/4] Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/4] Removing node_modules and cache...
if exist node_modules rmdir /s /q node_modules
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist

echo [3/4] Reinstalling dependencies...
call npm install

echo [4/4] Starting dev server...
echo.
echo ========================================
echo Run 'npm run dev' to start the server
echo ========================================
