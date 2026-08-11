# Antagloma Florist — Project Handoff

Dokumen handoff ini merangkum update client yang sudah selesai sampai commit `a256bdb` pada branch `main`.

## Status dan struktur

- Branch: `main`
- Commit terakhir: `a256bdb fix: make owner report tables mobile friendly`
- Frontend: `frontend/` (React, TypeScript, Vite)
- Backend: `backend/` (Laravel)
- Build artifact: `frontend/dist/`
- Dashboard role: `frontend/src/pages/dashboard/`
- Reports Owner: `frontend/src/pages/reports/ReportsPage.tsx`

## Lifecycle order/package

```text
WAITING_PROCESS
  → verifikasi Admin
WAITING_PACKING
  → configure package, tetap WAITING_PACKING
  → semua package memiliki foto
PACKING_COMPLETED
  → tracking per package, tetap PACKING_COMPLETED
  → Sales Selesai Diinfokan
sales_informed_at terisi
  → Riwayat Sales
```

`COMPLETED` tetap untuk direct/legacy order tanpa package.

### Foto package

- Endpoint: `POST /api/packing/packages/{package}/upload-proof`
- Foto disimpan ke `packing_images` dan `photo_uploaded_at` diisi.
- Order hanya menjadi `PACKING_COMPLETED` setelah semua package memiliki foto.

### Shipment package

- Endpoint: `POST /api/packing/packages/{package}/shipment`
- Menyimpan `tracking_number`, `shipping_cost`, `completed_at`.
- Tidak mengubah order menjadi `COMPLETED`.
- Generic `PATCH /api/orders/{id}/shipment` tetap untuk legacy tanpa package.
- Generic shipment ditolak HTTP 422 jika order sudah memiliki package.

## Security dan ownership

- `GET /api/sales/packing-progress` hanya mengembalikan order milik Sales login.
- `POST /api/orders/{id}/sales-informed` memvalidasi ownership, package, foto, tracking, lifecycle, dan duplicate informed.
- Ownership gagal: 403. Package/foto/tracking belum lengkap: 422.
- Sales tidak menerima `shipping_cost` internal order/package; `buyer_shipping_cost` tetap tersedia jika diperlukan.
- Configure package, upload photo, package shipment, dan generic shipment dibatasi policy backend.
- Endpoint migration HTTP `/api/run-migrate` tidak terbuka untuk user umum; migration production melalui CLI/deployment.

## Sales workflow selesai

File utama: `frontend/src/pages/dashboard/SalesDashboard.tsx`.

1. **Menunggu Packing** — order, customer, tanaman, dan package type read-only.
2. **Packing Selesai** — package dengan foto dan tombol Lihat Foto Paket.
3. **Resi Terbit** — minimal satu tracking; partial tracking tetap tampil; informed disabled sampai semua foto/tracking lengkap.
4. **Riwayat Pesanan** — filter backend `sales_informed_at`, dibuka melalui `#riwayat-pesanan`.

Confirmation Sales informed memakai modal, loading/error handling, dan refetch setelah sukses.

## Admin workflow selesai

- Payment verification dari card dan detail order memakai confirmation modal yang sama; checkbox wajib sebelum API approve.
- Card Menunggu Foto Paket membuka detail section sebelum daftar package/upload.
- Upload foto memakai `orderService.uploadPackageProof(packageId, file)`.
- Input resi memakai `CompletePackageShipmentModal`; ongkir awal `0` hilang saat field focus.
- Document printing dihitung per package berdasarkan `nota_printed` dan `label_printed`.
- Admin history tidak dirender di dashboard default; dibuka melalui `#riwayat-pesanan`.

## Pricing dan commission

- `item.standard_price`: harga standar satuan.
- `item.quantity`: jumlah tanaman.
- `item.price`: harga jual keseluruhan quantity item.

```text
quantity = 3, price = 120000
Subtotal = 120000
Harga satuan display = 40000
```

Commission memakai `item.price` langsung, bukan `quantity * price`.

## Owner Reports

File utama: `frontend/src/pages/reports/ReportsPage.tsx`.

- Total Omzet Tanaman: jumlah `item.price`, tanpa ongkir pembeli.
- Total Paket Dikirim: package dengan `photo_uploaded === true` pada order periode aktif.
- Ongkir Pembeli: `buyer_shipping_cost` untuk `Kirim Paket` dan `Packing Kayu`.
- Selisih Ongkir: buyer shipping dikurangi `package.shipping_cost` atau legacy `order.shipping_cost`.
- Filter: Semua Waktu, Bulan Ini, Hari Ini.

### Penjualan Per Grade

Card expandable menampilkan Grade, Jumlah Terjual, Harga Jual Satuan, Total Omzet, dan Total.

```text
Harga Jual Satuan = total omzet grade / total quantity grade
Total Omzet Grade = jumlah item.price
```

Judul tabel mengikuti filter aktif: Hari Ini, Bulan Ini, atau Semua Waktu. Tabel menggunakan `table-fixed` agar lebih cocok untuk mobile.

### Performa ID Tanaman

Card expandable memakai master ID dari `masterService.getTrees()` dan penjualan dari `order.items[]` (`tree_code`, `tree_name`, `quantity`, `price`). Menampilkan ranking ID paling laku, jumlah, omzet, dan ID master yang belum terjual.

## Payment bank label

`OrderCreatePage.tsx` menampilkan:

- `Bank BCA a.n. Antagloma Florist`
- `Bank BRI a.n. Antagloma Florist`

Value API tetap `BCA`/`BRI`; nomor rekening hanya dihapus dari label.

## UI dan navigation

- Admin navigation: Riwayat Pesanan → `/dashboard#riwayat-pesanan`.
- Sales summary dan order cards diselaraskan dengan template visual Admin/Owner.
- Reports memiliki section expandable Grade dan Performa ID.
- Sales/Admin tetap memakai shared `DashboardLayout`, `AppHeader`, dan navigation components.

## Checks yang sudah dijalankan

Perubahan frontend telah diverifikasi dengan:

```powershell
cd frontend
npx.cmd tsc --noEmit
npm.cmd run build
```

Dan repository diperiksa dengan `git diff --check`. Build berhasil; warning Vite tentang ukuran JavaScript chunk di atas 500 kB bukan build error.

Runtime browser/live dan automated Laravel runtime test tidak selalu tersedia; jangan menyebut runtime PASS hanya berdasarkan build.

## Remaining risks

1. Response package memiliki `photo_uploaded` boolean, tetapi belum selalu mengirim `photo_uploaded_at`. Total Paket Dikirim saat ini mengelompokkan package melalui order periode, bukan timestamp upload foto aktual.
2. Plant performance memakai `tree_code`, fallback ke `product_name` untuk legacy item tanpa ID. Deduplikasi legacy membutuhkan keputusan bisnis jika diperlukan.
3. Tabel sudah `table-fixed` dan compact, tetapi tetap perlu browser QA pada 375px, 390px, dan 430px.
4. Bila menemukan karakter `Â`, `â`, atau replacement character, audit encoding source dan bundle setelah deployment.

## Aturan agent berikutnya

- Audit source sebelum coding.
- Jangan membuat migration/status baru tanpa kebutuhan yang terbukti.
- Untuk order package, gunakan package-level data sebagai source of truth.
- Jangan melemahkan Sales ownership atau role-aware response.
- Setelah frontend berubah: TypeScript, production build, `git diff --check`.
- Jika backend berubah: PHP syntax dan Laravel route check.
- Jangan commit/push kecuali diminta user.
