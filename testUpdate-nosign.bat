@echo off
echo Building Exiled Exchange 2 (No Code Signing)...
echo.

:: Remove old build folders
if exist ".\renderer\dist" rmdir /s /q ".\renderer\dist"
if exist ".\main\dist" rmdir /s /q ".\main\dist"

:: Build renderer
echo Building renderer...
cd renderer
call npm install
call npm run make-index-files
call npm run build
cd ..\main

:: Build main  
echo Building main...
call npm install
call npm run build

:: Package without signing
echo Packaging without code signing...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run package

echo.
echo ========================================
echo BUILD COMPLETED (unsigned)!
echo ========================================
echo.
echo Executable created in: main\dist\win-unpacked\
echo Look for: Exiled Exchange 2.exe
echo.
pause