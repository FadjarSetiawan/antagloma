#!/bin/bash
set -e

echo "Starting Production Deployment for Antagloma Florist..."

# 1. Update Backend
cd /var/www/antagloma-backend
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link --force

# 2. Update Frontend
cd /var/www/antagloma-frontend
git pull origin main
npm install
npm run build

sudo systemctl restart php8.4-fpm
sudo systemctl reload nginx

echo "Deployment finished successfully!"
