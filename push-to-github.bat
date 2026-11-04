@echo off
echo =======================================================
echo   The Moth in the Machine - Git & GitHub Setup Helper
echo =======================================================
echo.

where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Git is not found in your system PATH.
    echo.
    echo Please install Git by:
    echo 1. Visiting https://git-scm.com/download/win
    echo    OR
    echo 2. Running 'winget install Git.Git' in an Administrator PowerShell.
    echo.
    echo You can also upload this folder directly to GitHub via your web browser:
    echo 1. Go to https://github.com/new and create a new repository.
    echo 2. Click 'uploading an existing file'.
    echo 3. Drag and drop all files from this folder.
    echo.
    pause
    exit /b
)

echo [*] Initializing Git repository...
git init

echo [*] Adding all project files...
git add .

echo [*] Creating initial commit...
git commit -m "feat: The Moth in the Machine - Complete Interactive Educational Game"

echo.
echo =======================================================
echo Git repository initialized successfully!
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/user/moth-game.git): "

if not "%REPO_URL%"=="" (
    git branch -M main
    git remote remove origin 2>nul
    git remote add origin %REPO_URL%
    echo [*] Pushing to GitHub main branch...
    git push -u origin main
    echo.
    echo [✓] Successfully uploaded your project to GitHub!
) else (
    echo No repository URL entered. Your local git commit is ready.
)

pause
