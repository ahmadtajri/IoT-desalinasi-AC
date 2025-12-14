# Panduan Setup Database MySQL (XAMPP)

Jika sistem muncul sebagai **"Offline"** atau menggunakan **"Mock Data"** padahal XAMPP sudah jalan, itu karena database `iot_desalinasi` belum dibuat.

Ikuti langkah ini untuk memperbaikinya:

## 1. Buka phpMyAdmin
1. Pastikan **Apache** dan **MySQL** sudah Start di XAMPP Control Panel.
2. Buka browser dan kunjungi: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)

## 2. Buat Database Baru
1. Klik menu **"New"** atau **"Baru"** di sidebar kiri.
2. Nama Database: `iot_desalinasi`
3. Klik tombol **Create** / **Buat**.

## 3. Import Struktur Tabel
1. Klik tab **SQL** di bagian atas.
2. Copy semua isi file `backend/database/database_setup.sql`.
3. Paste ke kolom SQL di phpMyAdmin.
4. Klik **Go** / **Kirim**.

## 4. Import Stored Procedure (PENTING!)
Sistem "Status Database" membutuhkan prosedur ini. Jangan lewatkan!

1. Klik tab **SQL** lagi.
2. Copy semua isi file `backend/database/create_procedure.sql`.
3. Paste ke kolom SQL.
4. Klik **Go** / **Kirim**.

## 5. Restart Backend
1. Kembali ke terminal VS Code.
2. Matikan server (Ctrl+C).
3. Jalankan lagi: `npm start`.

Server sekarang seharusnya mendeteksi database:
> ✅ Database connection established successfully.
> 💾 DATA MODE: MySQL Database (Persistent)
