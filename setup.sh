#!/bin/bash
# ════════════════════════════════════════════════════════════
#  EduBD — Automatic Setup Script (Linux / Mac)
#  Usage: bash setup.sh
# ════════════════════════════════════════════════════════════
#
# This script is safe to re-run if something fails partway through.
#
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

fail() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

ok() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║      EduBD Setup — Starting...        ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# ── Step 1: Check requirements ──────────────────────────────────────────────
echo -e "${YELLOW}[1/7] Checking requirements...${NC}"

command -v php      &> /dev/null || fail "PHP not found. Install PHP 8.2+ first → https://php.net"
command -v composer &> /dev/null || fail "Composer not found → https://getcomposer.org"
command -v node     &> /dev/null || fail "Node.js not found. Install Node.js 18+ → https://nodejs.org"
command -v mysql    &> /dev/null || fail "MySQL client not found. Install MySQL server first."

ok "PHP $(php -r 'echo PHP_VERSION;') found"
ok "Composer found"
ok "Node.js $(node -v) found"
echo ""

# ── Step 2: Create .env ───────────────────────────────────────────────────
echo -e "${YELLOW}[2/7] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    ok ".env file created"
else
    ok ".env already exists, skipping"
fi
echo ""

# ── Step 3: Install PHP packages (needed before we can run `artisan migrate`) ─
echo -e "${YELLOW}[3/7] Installing PHP packages (Composer)...${NC}"
chmod -R 775 bootstrap/cache storage
composer install --no-interaction --prefer-dist --optimize-autoloader \
    || fail "Composer install failed. Check the error above."

# Clear any stale cached config from a previous run BEFORE generating a new
# key (a leftover bootstrap/cache/config.php can make Laravel ignore .env)
php artisan config:clear --no-interaction 2>/dev/null || true
php artisan cache:clear  --no-interaction 2>/dev/null || true
php artisan route:clear  --no-interaction 2>/dev/null || true
php artisan view:clear   --no-interaction 2>/dev/null || true
php artisan storage:link --no-interaction 2>/dev/null || true
ok "PHP packages installed, caches cleared"
echo ""

# ── Step 4: Database setup — auto-detect auth method ────────────────────────
echo -e "${YELLOW}[4/7] Database setup...${NC}"
echo ""

MYSQL_ROOT_CMD=""

# Try 1: sudo mysql (covers Ubuntu/Debian/Zorin default auth_socket for root)
if sudo mysql -e "SELECT 1;" &>/dev/null; then
    MYSQL_ROOT_CMD="sudo mysql"
    echo -e "${BLUE}  Detected: socket authentication (sudo mysql) — common on Ubuntu/Debian${NC}"

# Try 2: root with no password
elif mysql -u root -e "SELECT 1;" &>/dev/null; then
    MYSQL_ROOT_CMD="mysql -u root"
    echo -e "${BLUE}  Detected: root with no password${NC}"

# Try 3: ask for root password
else
    echo "  Could not auto-detect MySQL access."
    read -s -p "  Enter your MySQL root password: " DB_ROOT_PASS || true
    echo ""
    if mysql -u root -p"$DB_ROOT_PASS" -e "SELECT 1;" &>/dev/null; then
        MYSQL_ROOT_CMD="mysql -u root -p$DB_ROOT_PASS"
        echo -e "${BLUE}  Detected: root with password${NC}"
    else
        fail "Could not connect to MySQL with any method. Is MySQL running? Try: sudo systemctl start mysql"
    fi
fi

# Generate a random password for a DEDICATED app database user.
# We do NOT use root for the running application — root often uses
# auth_socket (OS-user-based auth) which only works for the CLI user,
# not for PHP itself (PHP runs as a different OS user). A dedicated
# user with a real password works regardless of how PHP is invoked.
#
# MySQL's validate_password component (on by default on most fresh Ubuntu
# MySQL installs) typically requires upper + lower + digit + a special
# character. A pure bin2hex() string is only ever [0-9a-f], so it can
# NEVER satisfy that policy — this isn't a rare edge case, it fails
# every time validate_password is enabled. The generator below
# deterministically includes one of each required class, drawn from a
# character set that's also safe everywhere this value gets used: inside
# a single-quoted SQL string below (so no '), inside this script's sed
# substitution a few lines down whose delimiter is | (so no |), and as
# an unquoted .env value (so no #, space, =, or quotes).
DB_APP_USER="edubd_user"
DB_APP_PASS=$(php -r '
    $lower = "abcdefghijklmnopqrstuvwxyz";
    $upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $digit = "0123456789";
    $special = "!@%^*_-+";
    $all = $lower.$upper.$digit.$special;
    $pw = [
        $lower[random_int(0, strlen($lower) - 1)],
        $upper[random_int(0, strlen($upper) - 1)],
        $digit[random_int(0, strlen($digit) - 1)],
        $special[random_int(0, strlen($special) - 1)],
    ];
    for ($i = count($pw); $i < 24; $i++) {
        $pw[] = $all[random_int(0, strlen($all) - 1)];
    }
    shuffle($pw);
    echo implode("", $pw);
')

echo "  Creating database and dedicated application user..."
$MYSQL_ROOT_CMD <<SQL || fail "Could not create database/user. Check the MySQL error above."
CREATE DATABASE IF NOT EXISTS edubd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'localhost' IDENTIFIED BY '${DB_APP_PASS}';
ALTER USER '${DB_APP_USER}'@'localhost' IDENTIFIED BY '${DB_APP_PASS}';
GRANT ALL PRIVILEGES ON edubd.* TO '${DB_APP_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

ok "Database 'edubd' and user '${DB_APP_USER}' ready"

# Write the dedicated user's credentials into .env BEFORE running artisan
# commands against the database (cross-platform sed)
update_env() {
    local key="$1" val="$2"
    if sed --version 2>&1 | grep -q "GNU"; then
        sed -i "s|^${key}=.*|${key}=${val}|" .env
    else
        sed -i "" "s|^${key}=.*|${key}=${val}|" .env
    fi
}
update_env "DB_USERNAME" "$DB_APP_USER"
update_env "DB_PASSWORD" "$DB_APP_PASS"
ok ".env updated with dedicated database credentials"

php artisan config:clear --no-interaction 2>/dev/null || true
php artisan key:generate --no-interaction || fail "Could not generate app key."

# Migrations are the ONLY schema source of truth — every table this app
# needs is defined there, and that stays true automatically as new
# migrations get added later. (An earlier version of this script imported a
# hand-written edubd_complete.sql for schema too, which drifted out of sync
# with the real migrations over time — several tables added since then,
# like payment_methods, notifications, wishlists, bundles, and coupons'
# per-user scoping, only existed in migrations and never in that file, so
# they silently never got created. That file is now DATA only.)
echo "  Creating database schema from migrations..."
php artisan migrate --force || fail "Migration failed. Check the error above."
ok "Database schema created (all tables, including ones added after initial release)"

echo "  Importing sample data (users, courses, etc.)..."
# edubd_seed_data.sql uses INSERT IGNORE throughout specifically so this is
# safe to run every time: rows that already exist (matching primary/unique
# key) are silently skipped, and any *new* rows added to this file since
# your last run (e.g. a new demo category, or new gamification badges) get
# inserted normally. An earlier version of this script used plain INSERT,
# which meant re-running against an already-seeded database failed outright
# on the very first row instead of leaving existing data alone.
mysql -u "$DB_APP_USER" -p"$DB_APP_PASS" edubd < database/edubd_seed_data.sql \
    || fail "SQL import failed. Check database/edubd_seed_data.sql exists and is valid."
ok "Sample data imported (existing rows preserved, any new ones added)"

# Re-hash every demo account's password using THIS machine's own PHP build.
# A bcrypt hash baked into a static SQL file is a single point of failure —
# different PHP/OpenSSL builds can disagree on it. Generating it fresh here
# guarantees it will verify correctly, because it's hashed by the exact
# same PHP that will later check it.
echo "  Setting demo account passwords..."
FRESH_HASH=$(php -r "echo password_hash('password', PASSWORD_BCRYPT);" 2>/dev/null) || true
if [ -z "$FRESH_HASH" ]; then
    fail "Could not generate a password hash. Is the PHP 'hash' extension enabled?"
fi
mysql -u "$DB_APP_USER" -p"$DB_APP_PASS" edubd -e \
    "UPDATE users SET password = '${FRESH_HASH}' WHERE password IS NOT NULL;" \
    || fail "Could not update demo account passwords."
ok "Demo account passwords set (all use: password)"
echo ""

# ── Step 5: Install JS packages ─────────────────────────────────────────────
echo -e "${YELLOW}[5/7] Installing JavaScript packages (npm)...${NC}"
npm install || fail "npm install failed. Check the error above."
ok "JS packages installed"

# Auto-fix any known vulnerabilities using npm's live advisory database —
# this is more authoritative than any version we could hard-code here,
# since it checks against current data at the moment you run setup.
echo "  Checking for known vulnerabilities..."
npm audit fix 2>&1 | tail -5 || true
echo ""

# ── Step 6: Build frontend assets ───────────────────────────────────────────
echo -e "${YELLOW}[6/7] Building frontend (React)...${NC}"
npm run build || fail "Frontend build failed. Check the error above."
ok "Frontend built"
echo ""

# ── Step 7: Verify everything actually works ────────────────────────────────
echo -e "${YELLOW}[7/7] Verifying installation...${NC}"

VERIFY_FAILED=0

if [ -d "vendor" ]; then ok "Composer dependencies present"
else echo -e "${RED}✗ vendor/ missing${NC}"; VERIFY_FAILED=1; fi

if [ -d "node_modules" ]; then ok "npm dependencies present"
else echo -e "${RED}✗ node_modules/ missing${NC}"; VERIFY_FAILED=1; fi

if [ -d "public/build" ]; then ok "Frontend build output present"
else echo -e "${RED}✗ public/build/ missing — frontend did not build${NC}"; VERIFY_FAILED=1; fi

if grep -q "^APP_KEY=base64:" .env; then ok "APP_KEY is set"
else echo -e "${RED}✗ APP_KEY missing in .env${NC}"; VERIFY_FAILED=1; fi

# Check DB connection + admin user + password hash via artisan tinker
# (tinker boots the app the normal, supported way — no manual bootstrapping)
php artisan tinker --execute="
try {
    \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo 'DB_OK' . PHP_EOL;
} catch (\Exception \$e) {
    echo 'DB_FAIL: ' . \$e->getMessage() . PHP_EOL;
}
\$u = \Illuminate\Support\Facades\DB::table('users')->where('email','admin@edubd.com')->first();
echo \$u ? 'USER_OK' . PHP_EOL : 'USER_MISSING' . PHP_EOL;
if (\$u) {
    echo \Illuminate\Support\Facades\Hash::check('password', \$u->password) ? 'HASH_OK' : 'HASH_FAIL';
}
" > /tmp/edubd_verify.txt 2>&1 || true

if grep -q "DB_OK" /tmp/edubd_verify.txt; then ok "Database connection works"
else echo -e "${RED}✗ Database connection failed${NC}"; cat /tmp/edubd_verify.txt; VERIFY_FAILED=1; fi

if grep -q "USER_OK" /tmp/edubd_verify.txt; then ok "Admin user (admin@edubd.com) exists"
else echo -e "${RED}✗ Admin user not found in database${NC}"; VERIFY_FAILED=1; fi

if grep -q "HASH_OK" /tmp/edubd_verify.txt; then ok "Admin password hash is valid — login will work"
else echo -e "${RED}✗ Admin password hash is invalid${NC}"; VERIFY_FAILED=1; fi

rm -f /tmp/edubd_verify.txt
echo ""

if [ "$VERIFY_FAILED" -eq 1 ]; then
    echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠ Setup finished with errors above   ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
    echo "  Please review the ✗ items above before continuing."
    exit 1
fi

# ── Done! ────────────────────────────────────────────────────────────────
echo "╔═══════════════════════════════════════╗"
echo "║         ✅ Setup Complete!            ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "  Run the app:"
echo ""
echo -e "    ${GREEN}php artisan serve${NC}"
echo ""
echo "  Then open: http://localhost:8000"
echo ""
echo "  Login credentials:"
echo "    Admin:      admin@edubd.com     / password"
echo "    Instructor: tanvir@edubd.com    / password"
echo "    Student:    rafiq@gmail.com     / password"
echo ""
