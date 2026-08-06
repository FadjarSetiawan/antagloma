# Panduan Deployment cPanel - Antagloma Florist (`florist.kaizoratech.com`)

Dokumen ini berisi panduan lengkap langkah-demi-langkah untuk melakukan instalasi dan deployment **Antagloma Florist Sales Order Management System** ke hosting cPanel pada domain **`florist.kaizoratech.com`**.

---

## 📋 Prasyarat di cPanel:
- Versi PHP: **PHP 8.2** atau **PHP 8.3** (Aktifkan ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`, `ctype`, `json`, `gd`).
- Fitur cPanel: **Git Version Control**, **MySQL Database Wizard**, **Terminal** (atau SSH), **Domains / Subdomains**.

---

## 🛠️ LANGKAH 1: Buat Subdomain di cPanel
1. Masuk ke **cPanel** Anda.
2. Buka menu **Domains** (atau **Subdomains**).
3. Klik **Create A New Domain**.
4. Masukkan nama domain: **`florist.kaizoratech.com`**.
5. Pastikan **Document Root** diisi ke: `/home/username/florist.kaizoratech.com/public` *(Sesuaikan `username` dengan username cPanel Anda)*.
6. Klik **Submit**.

---

## 🗄️ LANGKAH 2: Buat Database MySQL
1. Buka menu **MySQL® Database Wizard** di cPanel.
2. **Step 1 (Nama Database)**: Masukkan nama DB, contoh: `username_antagloma_db` -> Klik **Next Step**.
3. **Step 2 (Buat User DB)**: Masukkan nama user & password kuat, contoh: `username_antagloma_usr` -> Klik **Create User**.
4. **Step 3 (Hak Akses)**: Centang **ALL PRIVILEGES** -> Klik **Make Changes**.
5. Catat **Nama DB**, **User DB**, dan **Password DB** Anda.

---

## 🐙 LANGKAH 3: Clone Repositori via Git Version Control di cPanel
1. Buka menu **Git® Version Control** di cPanel.
2. Klik tombol **Create**.
3. Isi form berikut:
   - **Clone URL**: `https://github.com/FadjarSetiawan/antagloma.git`
   - **Repository Path**: `repositories/antagloma`
   - **Repository Name**: `antagloma`
4. Klik **Create**.
5. Setelah berhasil di-clone, klik tombol **Manage** di sebelah repositori `antagloma`.
6. Pindah ke tab **Deploy HEAD Commit**, lalu klik **Update from Remote** diikuti tombol **Deploy HEAD Commit**.
   *(File aplikasi otomatis ter-deploy ke folder `/home/username/florist.kaizoratech.com` via `.cpanel.yml`)*.

---

## ⚙️ LANGKAH 4: Konfigurasi File `.env` Live Server
1. Buka **File Manager** di cPanel, masuk ke folder `/home/username/florist.kaizoratech.com/`.
2. Klik tombol **Settings** (kanan atas File Manager) -> Centang **Show Hidden Files (dotfiles)** -> Klik **Save**.
3. Cari file `.env.example`, klik kanan -> **Rename** menjadi `.env` (atau salin isi `.env.example` ke file `.env` baru).
4. Klik kanan file `.env` -> **Edit**, lalu sesuaikan variabel berikut:

```env
APP_NAME="Antagloma Florist"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://florist.kaizoratech.com

LOG_CHANNEL=stack
LOG_LEVEL=error

# Konfigurasi Database MySQL cPanel Anda
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=username_antagloma_db
DB_USERNAME=username_antagloma_usr
DB_PASSWORD=password_database_anda

BROADCAST_DRIVER=log
CACHE_STORE=file
FILESYSTEM_DISK=public
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

5. Klik **Save Changes**.

---

## 💻 LANGKAH 5: Jalankan Perintah Terminal (Composer, Migration & Symlink)
Buka menu **Terminal** di cPanel (atau via SSH client seperti PuTTY/VSCode SSH), lalu jalankan perintah berikut:

```bash
# 1. Pindah ke folder root domain aplikasi
cd /home/username/florist.kaizoratech.com

# 2. Install dependensi backend Composer
composer install --no-dev --optimize-autoloader

# 3. Generate Application Key
php artisan key:generate

# 4. Jalankan Migrasi Database & Seeding Data Master (User, Tree, Grade)
php artisan migrate:fresh --seed --force

# 5. Buat Symlink Storage Foto Bukti Payment & Packing
php artisan storage:link

# 6. Bersihkan & Optimasi Cache Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🔒 LANGKAH 6: Verifikasi `.htaccess` & SSL (HTTPS)
1. Buka File Manager di folder `/home/username/florist.kaizoratech.com/public/`.
2. Pastikan terdapat file `.htaccess` dengan konfigurasi berikut:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Force HTTPS Redirect
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

3. Aktifkan SSL Gratis di menu cPanel **Lets Encrypt SSL** atau **AutoSSL** untuk domain `florist.kaizoratech.com`.

---

## 🔑 Akun Login Default Setelah Database Seed:
- **Owner**: `owner@antagloma.com` | Password: `password123`
- **Sales**: `sales@antagloma.com` | Password: `password123`
- **Packing**: `packing@antagloma.com` | Password: `password123`
- **Admin**: `admin@antagloma.com` | Password: `password123`

---

🎉 **Selamat! Aplikasi Antagloma Florist Sales System kini telah aktif 100% secara live di `https://florist.kaizoratech.com`!**
