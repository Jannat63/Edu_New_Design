#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
#  EduBD — Update Script (run this every time you get a new zip)
#  Usage: bash update.sh
# ════════════════════════════════════════════════════════════════════════════
#
# Unlike setup.sh (which creates the database from scratch and is only for
# first-time install), this script is for APPLYING UPDATES to an EXISTING
# install: new migrations, new PHP/JS dependencies, new frontend code.
#
# It is 100% safe to re-run and NEVER touches or deletes your existing data.
# It does NOT re-import the sample SQL dump, does NOT drop any tables, and
# does NOT reset your .env file.
#
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║      EduBD Update — Starting...       ║"
echo "╚═══════════════════════════════════════╝"
echo ""

[ -f artisan ] || fail "Run this from inside the edubd/ project folder (artisan file not found here)."
[ -f .env ]    || fail ".env not found — run setup.sh first for the initial install, then use this script for future updates."

# ── Step 1: PHP dependencies ─────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Updating PHP packages...${NC}"
composer install --no-interaction 2>&1 | tail -5
ok "Composer dependencies up to date"
echo ""

# ── Step 2: Run any NEW migrations (safe — only applies migrations that ─────
#            haven't run yet; never touches existing tables/data)
echo -e "${YELLOW}[2/4] Applying database migrations...${NC}"
php artisan migrate --force
ok "Database schema up to date"
echo ""

# Re-run the CMS content seeder — it uses updateOrCreate() keyed on 'key',
# so this is safe to re-run forever: it only fills in rows that don't exist
# yet (e.g. new CMS fields added since your last update) and never
# overwrites values you've already customized in the admin panel.
echo -e "${YELLOW}      Ensuring CMS/settings rows exist...${NC}"
php artisan db:seed --class=SiteContentSeeder --force
ok "CMS content rows up to date"
echo ""

# ── Step 3: JS dependencies + rebuild frontend ───────────────────────────────
echo -e "${YELLOW}[3/4] Updating JS packages and rebuilding frontend...${NC}"
npm install --legacy-peer-deps 2>&1 | tail -5
rm -rf public/build node_modules/.vite
npm run build
ok "Frontend rebuilt"
echo ""

# ── Step 4: Clear all caches so new code/config actually takes effect ───────
echo -e "${YELLOW}[4/4] Clearing caches...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
[ -L public/storage ] || php artisan storage:link
ok "Caches cleared"
echo ""

echo "╔═══════════════════════════════════════╗"
echo "║        ✅ Update Complete!            ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "  Restart your server if it's currently running:"
echo "    php artisan serve"
echo ""
echo "  Then hard-refresh your browser (Ctrl+Shift+R) or open a fresh"
echo "  Incognito/Private window — old JS/CSS can be cached by the browser."
echo ""
