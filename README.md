# 🎓 EduBD — Single Laravel App

Everything is in **one folder**. One setup. One command to run.

---

## 📋 Requirements (install these once)

| Tool | Download | Check |
|------|----------|-------|
| PHP 8.2+ | https://php.net or **XAMPP** (Windows) | `php -v` |
| Composer | https://getcomposer.org | `composer -V` |
| Node.js 20+ | https://nodejs.org | `node -v` |
| MySQL | Included with XAMPP | `mysql --version` |

> **Windows users:** Install [XAMPP](https://apachefriends.org) → gives PHP + MySQL in one click. Then install Node.js separately.

---

## 🚀 Setup (do this ONCE)

### Windows — double-click `setup.bat`

or run in Command Prompt:
```
setup.bat
```

### Linux / Mac — run in Terminal:
```bash
bash setup.sh
```

That's it. The script will:
1. ✅ Check PHP, Composer, Node.js are installed
2. ✅ Create your `.env` file
3. ✅ Auto-detect how to access MySQL (works on Ubuntu/Debian/Zorin's socket-based root login, password-based root login, or asks if neither is found) and creates a dedicated database user just for this app
4. ✅ Import all tables + sample data, then re-hash demo passwords using your own PHP build (guarantees they'll actually log in)
5. ✅ Install all packages and auto-fix any known npm vulnerabilities
6. ✅ Build the frontend
7. ✅ Verify the database connection, admin login, and build output all actually work — and tells you exactly what's wrong if something didn't

---

## ▶️ Run the app

```bash
php artisan serve
```

Open your browser: **http://localhost:8000**

---

## 🔑 Login credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@edubd.com | password |
| Instructor | tanvir@edubd.com | password |
| Student | rafiq@gmail.com | password |

---

## 📁 Project structure (simplified)

```
edubd/
│
├── app/
│   ├── Http/Controllers/Api/   ← All API controllers (Auth, Course, Admin…)
│   ├── Models/                 ← Database models
│   └── Services/               ← Payment gateway service
│
├── database/
│   ├── migrations/             ← Table definitions (the schema source of truth)
│   └── edubd_seed_data.sql     ← Ready-to-import demo DATA (run after migrating)
│
├── resources/
│   └── js/
│       ├── app.jsx             ← React app entry point
│       ├── lib/                ← API client + Auth context
│       └── pages/              ← All 14 frontend pages
│
├── routes/
│   ├── api.php                 ← All API endpoints (/api/v1/...)
│   └── web.php                 ← Serves the React app
│
├── setup.sh    ← Run once on Linux/Mac
├── setup.bat   ← Run once on Windows
└── .env.example
```

---

## ⚙️ Manual setup (if scripts don't work)

```bash
# 1. Copy env file
cp .env.example .env

# 2. Create the database
#    On Ubuntu/Debian/Zorin, MySQL's root user often uses socket auth
#    (no password works), so you may need sudo for this one command:
sudo mysql -e "CREATE DATABASE edubd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'edubd_user'@'localhost' IDENTIFIED BY 'choose-a-password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON edubd.* TO 'edubd_user'@'localhost';"

#    Then put those same credentials in .env:
#    DB_USERNAME=edubd_user
#    DB_PASSWORD=choose-a-password
#    (Don't use 'root' as DB_USERNAME on Linux — PHP runs as a different
#    OS user than your terminal, so root's socket auth won't work for it.)

# 3. Install packages (needed before `artisan migrate` will work)
composer install
php artisan config:clear
php artisan key:generate

# 4. Create the schema — migrations are the ONLY source of truth for table
#    structure. Don't skip this: payment_methods, notifications, wishlists,
#    bundles, and several other tables only exist here, not in any SQL file.
php artisan migrate --force

# 5. Import DATA only (users, courses, etc.) — the schema already exists
#    from step 4, this just fills it with demo content
mysql -u edubd_user -p edubd < database/edubd_seed_data.sql

# 5b. Re-hash demo passwords with YOUR PHP build (guarantees they verify —
#     a hash baked into the SQL file can fail to match on a different
#     PHP/OpenSSL build than the one that generated it)
HASH=$(php -r "echo password_hash('password', PASSWORD_BCRYPT);")
mysql -u edubd_user -p edubd -e "UPDATE users SET password = '$HASH' WHERE password IS NOT NULL;"

# 6. Install & build frontend
npm install
npm run build

# 7. Run!
php artisan serve
```

---

## 🔧 Making changes to the frontend

If you edit files in `resources/js/pages/`, run this to rebuild:

```bash
npm run build
```

Or, while actively developing, use live reload:
```bash
# Terminal 1:
php artisan serve

# Terminal 2:
npm run dev
```

---

## 💡 Pages

| Page | URL |
|------|-----|
| Home | http://localhost:8000/ |
| Courses | http://localhost:8000/courses |
| Course Detail | http://localhost:8000/course/any-slug |
| Course Player | http://localhost:8000/learn/any-slug |
| Login / Register | http://localhost:8000/login |
| Student Dashboard | http://localhost:8000/dashboard |
| Admin Panel | http://localhost:8000/admin |
| Instructor Profile | http://localhost:8000/instructors/1 |
| Blog Article | http://localhost:8000/blog/any-slug |
| Forgot Password | http://localhost:8000/forgot-password |
| Reset Password | http://localhost:8000/reset-password |
| Certificate Verify | http://localhost:8000/verify/any-code |

---

## 🆘 Common problems

**"composer: command not found"** → Install Composer from getcomposer.org

**"npm: command not found"** → Install Node.js from nodejs.org

**MySQL connection refused** → Start MySQL:
- Linux: `sudo systemctl start mysql`
- XAMPP: open the XAMPP Control Panel → Start MySQL

**On Ubuntu/Debian/Zorin, `mysql -u root -p` fails even with no password set** → This is normal. These distros configure MySQL's root user for OS-level socket authentication, not password authentication. `setup.sh` detects this automatically and creates a separate `edubd_user` database account for the app to use instead — you never need to fight with root's password.

**Port 8000 already in use** → `php artisan serve --port=8001`

**Page shows blank / white screen** → Run `npm run build` again, then refresh

**Login fails / "These credentials do not match"** → Re-run `bash setup.sh` — step 7 will tell you exactly whether the database, the admin user, or the password hash is the problem.

---

## 📌 About `composer.lock`

This project intentionally does **not** ship a `composer.lock` file — it's generated automatically the first time you run `composer install`, based on the version ranges in `composer.json`. After your first successful setup, **commit the generated `composer.lock` to your own repository**. That locks every teammate (and your production server) to the exact same package versions you tested with, instead of each install potentially resolving slightly different versions over time.

---

## 🚀 Going to production

This project ships configured for **local development** (`APP_ENV=local`, `APP_DEBUG=true`, emails logged instead of sent). Before deploying somewhere real, work through this checklist:

- [ ] Set `APP_ENV=production` and `APP_DEBUG=false` in `.env` — debug mode leaks stack traces and file paths to visitors
- [ ] Set a real `APP_URL` (your actual domain, with `https://`)
- [ ] Set `MAIL_MAILER=smtp` and fill in real SMTP credentials — without this, password-reset and registration verification emails won't be delivered (they currently just write to `storage/logs/laravel.log`)
- [ ] Fill in real payment gateway credentials (`BKASH_*`, `NAGAD_*`, `SSLCZ_*`) and set `SSLCZ_IS_SANDBOXED=false` once you're ready for live transactions
- [ ] Set `SANCTUM_TOKEN_EXPIRATION` in `.env` (e.g. `10080` for 7 days) so login tokens expire instead of lasting forever
- [ ] Run `composer install --no-dev --optimize-autoloader` (skips testing tools, optimizes class loading)
- [ ] Run `php artisan config:cache route:cache view:cache` for a meaningful performance boost
- [ ] Use a real queue worker (`QUEUE_CONNECTION=database` + `php artisan queue:work`) if you later add background jobs (emails, notifications) — currently everything runs synchronously, which is fine at small scale but won't be once traffic grows
- [ ] Add a system cron entry for the Laravel scheduler: `* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1` — without this, scheduled commands (e.g. the hourly abandoned-checkout reminder emails) are correctly coded but will simply never run
- [ ] Put the app behind HTTPS — required for secure cookies and for payment gateway callbacks to be trusted
- [ ] Set up real backups for the MySQL database — `database/edubd_seed_data.sql` is sample/seed data only, not a backup strategy

---

Designed & Developed by [Ahsan Jannat](https://ahsan-jannat.netlify.app/)
