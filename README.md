# Sales Order Management System — Antagloma Florist
**Developer:** Kaizora Tech  
**Package:** Web Starter Standard  
**Tech Stack:** Laravel 12 (PHP 8.4) + React.js (Vite, TypeScript, TailwindCSS)

---

## Overview
A web-based order management system tailored for Antagloma Florist to streamline the workflow from order entry, verification, packing proof, to real-time owner monitoring.

## System Workflow & Roles
1. **Sales**: Entry new orders and track personal sales status.
2. **Admin**: Verify incoming orders, manage all orders, and generate packing slips.
3. **Packing**: Access packing queue, upload packing photo evidence, and complete orders.
4. **Owner**: Real-time operational monitoring dashboard, sales reports, and complete order history.

## Getting Started

### Backend Setup (Laravel 12)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Default Credentials (Seeded)
- **Owner**: `owner@antagloma.com` / `password123`
- **Sales**: `sales@antagloma.com` / `password123`
- **Admin**: `admin@antagloma.com` / `password123`
- **Packing**: `packing@antagloma.com` / `password123`
