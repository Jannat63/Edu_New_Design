@echo off
REM ═══════════════════════════════════════════════════════
REM  EduBD — Automatic Setup Script (Windows)
REM  Double-click this file OR run: setup.bat
REM ═══════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════╗
echo ║      EduBD Setup — Starting...        ║
echo ╚═══════════════════════════════════════╝
echo.

REM ── Check requirements ──────────────────────────────────
echo [1/7] Checking requirements...

php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PHP not found. Please install PHP 8.2+ or XAMPP first.
    echo Download: https://www.apachefriends.org
    pause
    exit /b 1
)

composer -V >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Composer not found.
    echo Download: https://getcomposer.org/Composer-Setup.exe
    pause
    exit /b 1
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found.
    echo Download: https://nodejs.org
    pause
    exit /b 1
)

echo  PHP, Composer, Node.js found.
echo.

REM ── Create .env ─────────────────────────────────────────
echo [2/7] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo  .env file created.
) else (
    echo  .env already exists, skipping.
)
echo.

REM ── Get DB credentials ──────────────────────────────────
echo [3/7] Database setup...
echo.
set /p DB_PASS="  Enter your MySQL root password (press Enter if none): "
echo.

REM ── Create the (empty) database. Schema and data come later, once
REM    Composer/artisan are available — see step 4 below. Migrations are
REM    the ONLY source of truth for the schema; edubd_seed_data.sql is
REM    DATA ONLY and will fail to import against a database with no
REM    tables yet, which is why this step no longer imports it directly.
if "%DB_PASS%"=="" (
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS edubd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if %errorlevel% neq 0 (
        echo ERROR: Could not connect to MySQL. Is XAMPP running?
        pause
        exit /b 1
    )
) else (
    mysql -u root -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS edubd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if %errorlevel% neq 0 (
        echo ERROR: Could not connect to MySQL. Check your password.
        pause
        exit /b 1
    )
)

REM Update DB_PASSWORD in .env
if not "%DB_PASS%"=="" (
    powershell -Command "(Get-Content .env) -replace '^DB_PASSWORD=$', 'DB_PASSWORD=%DB_PASS%' | Set-Content .env"
)

echo  Database 'edubd' created.
echo.

REM ── Install PHP packages ────────────────────────────────
echo [4/7] Installing PHP packages ^(Composer^)...
icacls bootstrap\cache /grant Everyone:(OI)(CI)F /T >nul 2>nul
icacls storage /grant Everyone:(OI)(CI)F /T >nul 2>nul
composer install --no-interaction --prefer-dist --optimize-autoloader
if %errorlevel% neq 0 (
    echo ERROR: Composer install failed.
    pause
    exit /b 1
)

REM Clear any stale cached config from a previous attempt before generating a new key
php artisan config:clear --no-interaction >nul 2>nul
php artisan cache:clear  --no-interaction >nul 2>nul
php artisan route:clear  --no-interaction >nul 2>nul
php artisan view:clear   --no-interaction >nul 2>nul

php artisan key:generate --no-interaction
php artisan storage:link --no-interaction 2>nul
echo  PHP packages installed, app key generated, caches cleared.
echo.

REM Create the actual table schema — this was previously missing entirely,
REM so the database had no tables and the seed-data import below would
REM fail on every INSERT.
echo  Running database migrations...
php artisan migrate --force
if %errorlevel% neq 0 (
    echo ERROR: Migrations failed. Check the error above.
    pause
    exit /b 1
)
echo  Migrations complete.
echo.

REM Import demo data (data only, no CREATE TABLE statements — must run
REM after migrations, which is why this moved here from step 3).
echo  Importing demo data...
if "%DB_PASS%"=="" (
    mysql -u root edubd < database\edubd_seed_data.sql
) else (
    mysql -u root -p%DB_PASS% edubd < database\edubd_seed_data.sql
)
if %errorlevel% neq 0 (
    echo ERROR: Could not import demo data.
    pause
    exit /b 1
)
echo  Demo data imported.
echo.

REM Re-hash every demo account's password using THIS machine's PHP build.
REM A bcrypt hash baked into a static SQL file can fail to verify on a
REM different PHP/OpenSSL build. Generating it fresh here guarantees it
REM will work, since it's hashed by the exact same PHP that checks it later.
REM (Moved here from before the data import, since the users table didn't
REM have any rows to update until the import above actually ran.)
echo  Setting demo account passwords...
for /f "delims=" %%H in ('php -r "echo password_hash('password', PASSWORD_BCRYPT);"') do set FRESH_HASH=%%H
if "%FRESH_HASH%"=="" (
    echo ERROR: Could not generate a password hash.
    pause
    exit /b 1
)
if "%DB_PASS%"=="" (
    mysql -u root edubd -e "UPDATE users SET password = '%FRESH_HASH%' WHERE password IS NOT NULL;"
) else (
    mysql -u root -p%DB_PASS% edubd -e "UPDATE users SET password = '%FRESH_HASH%' WHERE password IS NOT NULL;"
)
echo  Demo account passwords set (all use: password)
echo.

REM ── Install JS packages ─────────────────────────────────
echo [5/7] Installing JavaScript packages ^(npm^)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)
echo  JS packages installed.
echo.

REM Auto-fix any known vulnerabilities using npm's live advisory database
echo  Checking for known vulnerabilities...
call npm audit fix
echo.

REM ── Build frontend ──────────────────────────────────────
echo [6/7] Building frontend ^(React^)...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed.
    pause
    exit /b 1
)
echo  Frontend built.
echo.

REM ── Verify everything actually works ────────────────────
echo [7/7] Verifying installation...

set VERIFY_FAILED=0

if exist vendor (echo  Composer dependencies present.) else (echo  ERROR: vendor\ missing & set VERIFY_FAILED=1)
if exist node_modules (echo  npm dependencies present.) else (echo  ERROR: node_modules\ missing & set VERIFY_FAILED=1)
if exist public\build (echo  Frontend build output present.) else (echo  ERROR: public\build\ missing & set VERIFY_FAILED=1)

findstr /B "APP_KEY=base64:" .env >nul 2>nul
if %errorlevel% equ 0 (echo  APP_KEY is set.) else (echo  ERROR: APP_KEY missing in .env & set VERIFY_FAILED=1)

php artisan tinker --execute="try { \Illuminate\Support\Facades\DB::connection()->getPdo(); echo 'DB_OK' . PHP_EOL; } catch (\Exception $e) { echo 'DB_FAIL: ' . $e->getMessage() . PHP_EOL; } $u = \Illuminate\Support\Facades\DB::table('users')->where('email','admin@edubd.com')->first(); echo $u ? 'USER_OK' . PHP_EOL : 'USER_MISSING' . PHP_EOL; if ($u) { echo \Illuminate\Support\Facades\Hash::check('password', $u->password) ? 'HASH_OK' : 'HASH_FAIL'; }" > %TEMP%\edubd_verify.txt 2>&1

findstr "DB_OK" %TEMP%\edubd_verify.txt >nul 2>nul
if %errorlevel% equ 0 (echo  Database connection works.) else (echo  ERROR: Database connection failed & type %TEMP%\edubd_verify.txt & set VERIFY_FAILED=1)

findstr "USER_OK" %TEMP%\edubd_verify.txt >nul 2>nul
if %errorlevel% equ 0 (echo  Admin user exists.) else (echo  ERROR: Admin user not found & set VERIFY_FAILED=1)

findstr "HASH_OK" %TEMP%\edubd_verify.txt >nul 2>nul
if %errorlevel% equ 0 (echo  Admin password hash is valid — login will work.) else (echo  ERROR: Password hash invalid & set VERIFY_FAILED=1)

del %TEMP%\edubd_verify.txt >nul 2>nul
echo.

if "%VERIFY_FAILED%"=="1" (
    echo ╔═══════════════════════════════════════╗
    echo ║   Setup finished with errors above    ║
    echo ╚═══════════════════════════════════════╝
    echo  Please review the ERROR items above before continuing.
    pause
    exit /b 1
)

REM ── Done! ───────────────────────────────────────────────
echo ╔═══════════════════════════════════════╗
echo ║         Setup Complete!               ║
echo ╚═══════════════════════════════════════╝
echo.
echo  Now start the app by running:
echo.
echo    php artisan serve
echo.
echo  Then open your browser: http://localhost:8000
echo.
echo  Login credentials:
echo    Admin:      admin@edubd.com     / password
echo    Instructor: tanvir@edubd.com    / password
echo    Student:    rafiq@gmail.com     / password
echo.
pause
