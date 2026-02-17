# Dokumentasi Proyek IoT Desalinasi

## 📋 Daftar Isi
1. [Overview & Arsitektur](#1-overview--arsitektur)
2. [Persiapan Hardware & Software](#2-persiapan-hardware--software)
3. [Panduan Backend & Database](#3-panduan-backend--database)
4. [Panduan Frontend](#4-panduan-frontend)
5. [Integrasi ESP32 & Sensor](#5-integrasi-esp32--sensor)
6. [Sistem Kontrol Valve (Auto/Manual)](#6-sistem-kontrol-valve-automanual)
7. [Sistem Manajemen User (RBAC)](#7-sistem-manajemen-user-rbac)
8. [Panduan Deployment Online](#8-panduan-deployment-online)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. Overview & Arsitektur

**IoT Desalinasi Monitoring System** adalah platform komprehensif untuk memantau dan mengontrol proses desalinasi air secara real-time. Sistem ini dirancang untuk menangani data dari berbagai sensor di 6 kompartemen berbeda dan menyediakan kontrol otomatis maupun manual untuk operasional valve.

### Fitur Utama:
*   **Monitoring Real-time**: Suhu Udara, Kelembapan, Suhu Air, Level Air, dan Berat Air.
*   **Kontrol Valve Cerdas**: Mode Otomatis (berdasarkan level air) dan Manual (via dashboard web).
*   **Manajemen Data**: Data logger terpusat dengan MySQL, mendukung background logging.
*   **Role-Based Access Control (RBAC)**: Sistem login untuk Admin dan User dengan hak akses berbeda.
*   **Visualisasi Data**: Grafik interaktif, gauge meter, dan laporan historis yang dapat di-export.

### Arsitektur Sistem:
1.  **Hardware**: ESP32 sebagai mikrokontroler utama, terhubung dengan sensor (DHT22, DS18B20, Ultrasonic, Load Cell) dan aktuator (Relay/Valve).
2.  **Protokol Komunikasi**: 
    *   **HTTP REST API**: Untuk pengiriman data sensor periodik dan manajemen konfigurasi.
    *   **MQTT**: Untuk kontrol valve real-time dan monitoring status sistem yang responsif.
3.  **Backend**: Node.js + Express.js sebagai server aplikasi.
4.  **Database**: MySQL untuk penyimpanan data jangka panjang.
5.  **Frontend**: React + Vite untuk antarmuka pengguna yang modern dan responsif.

---

## 2. Persiapan Hardware & Software

### Hardware:
*   **ESP32 Development Board** (ESP32-DevKitC atau sejenisnya).
*   **Sensor**:
    *   DHT22 (Suhu & Kelembapan Udara).
    *   DS18B20 (Suhu Air).
    *   HC-SR04 (Ultrasonic - Level Air).
    *   Load Cell + HX711 (Berat Air).
*   **Aktuator**: Relay Module & Solenoid Valve.
*   **Pendukung**: Kabel jumper, Breadboard, Power Supply.

### Software Requirements:
*   **XAMPP**: Untuk server database MySQL dan phpMyAdmin lokal.
*   **Node.js**: Runtime environment untuk Backend (versi LTS disarankan).
*   **Arduino IDE**: Untuk memprogram ESP32.
*   **MQTT Broker**: Mosquitto (atau broker publik untuk testing).
*   **Code Editor**: VS Code (disarankan).

---

## 3. Panduan Backend & Database

### Setup Database MySQL (Localhost/XAMPP):
1.  Jalankan **Apache** dan **MySQL** di XAMPP Control Panel.
2.  Buka `http://localhost/phpmyadmin`.
3.  Buat database baru bernama `iot_desalinasi`.
4.  Import file `backend/database/database_setup.sql` (jika ada) atau jalankan query SQL untuk membuat tabel `sensor_data`, `users`, dll.

### Instalasi & Konfigurasi Backend:
1.  Masuk ke folder backend: `cd backend`.
2.  Install dependencies: `npm install`.
3.  Buat file `.env` dari `.env.example`:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=iot_desalinasi
    PORT=3000
    MQTT_BROKER=mqtt://localhost:1883
    JWT_SECRET=rahasia_anda_disini
    ```
4.  Jalankan server: `npm start` (atau `npm run dev` untuk development).

---

## 4. Panduan Frontend

Frontend dibangun menggunakan React dan Vite untuk performa tinggi.

### Instalasi & Menjalankan:
1.  Masuk ke folder frontend: `cd frontend`.
2.  Install dependencies: `npm install`.
3.  Buat file `.env`:
    ```env
    VITE_API_URL=http://localhost:3000/api
    ```
4.  Jalankan mode development: `npm run dev`.
5.  Akses di browser: `http://localhost:5173`.

### Fitur Halaman:
*   **Dashboard**: Kartu status sensor, kontrol valve, dan grafik real-time.
*   **Report**: Tabel data historis dengan filter tanggal dan fitur export CSV.
*   **Login**: Halaman autentikasi untuk Admin dan User.

---

## 5. Integrasi ESP32 & Sensor

### Wiring Diagram (Ringkasan):
*   **DHT22**: VCC (3.3V), GND, Data (GPIO 4).
*   **DS18B20**: VCC (3.3V), GND, Data (GPIO 5) - *Perlu Resistor 4.7kΩ Pull-up*.
*   **Ultrasonic**: VCC (5V), GND, Trig (GPIO 5), Echo (GPIO 18).
*   **Relay (Valve)**: IN (GPIO 26).
*   **Load Cell**: DT (GPIO 32), SCK (GPIO 33).

### Upload Firmware:
1.  Buka file `.ino` di folder `esp32`.
2.  Install library di Arduino IDE: `WiFi`, `PubSubClient`, `ArduinoJson`, `DHT sensor library`, `DallasTemperature`.
3.  Sesuaikan konfigurasi WiFi, Server IP, dan MQTT Broker di kode.
4.  Upload ke board ESP32.

---

## 6. Sistem Kontrol Valve (Auto/Manual)

Sistem ini mendukung dua mode operasi untuk mengontrol aliran air.

### Mode Operasi:
1.  **AUTO Mode (Default)**:
    *   Valve bekerja otomatis berdasarkan level air dari sensor Ultrasonic.
    *   **Logic**:
        *   Jika Level Air ≤ 5 cm (Penuh) → Valve **OFF** (Tutup).
        *   Jika Level Air ≥ 6 cm (Kurang) → Valve **ON** (Buka).
2.  **MANUAL Mode**:
    *   Kontrol penuh dilakukan oleh user melalui Dashboard web.
    *   User bisa menekan tombol **ON** atau **OFF** sesuka hati.

### Mekanisme Komunikasi (MQTT):
*   **ESP32 Publish**: Topik `esp32/valve` (mengirim status valve, mode, dan level air).
*   **ESP32 Subscribe**: Topik `esp32/valve/control` (menerima perintah dari web).

---

## 7. Sistem Manajemen User (RBAC)

Akses aplikasi dibatasi berdasarkan role user untuk keamanan.

### Role & Hak Akses:
1.  **ADMIN**:
    *   Akses penuh ke semua fitur.
    *   Bisa manajemen user (Create, Update, Delete).
    *   Bisa mengatur interval logging global.
2.  **USER**:
    *   Bisa melihat Dashboard dan Report.
    *   Hanya bisa melihat data, tidak bisa mengubah konfigurasi sistem krusial.

### Default Login:
*   **Username**: `admin`
*   **Password**: `admin123`
*   *(Segera ganti password setelah deploy!)*

---

## 8. Panduan Deployment Online

Untuk membuat aplikasi dapat diakses publik, gunakan strategi **Separated Deployment**.

### Langkah Deployment:
1.  **Database & Backend (Railway/Render)**:
    *   Gunakan Railway atau VPS untuk menghosting Backend Node.js dan Database MySQL.
    *   Layanan ini harus "Always On" agar Background Logger dan MQTT berfungsi.
    *   Set Environment Variables (`DB_HOST`, `DB_USER`, dll) sesuai server cloud.
2.  **Frontend (Vercel/Netlify)**:
    *   Deploy folder `frontend` ke Vercel.
    *   Set Environment Variable `VITE_API_URL` ke URL backend yang sudah dideploy (misal: `https://api-iot.railway.app/api`).
3.  **Update ESP32**:
    *   Ubah konfigurasi IP/Domain server di kode ESP32 ke URL backend cloud.

---

## 9. Troubleshooting & FAQ

### Masalah Umum:
*   **ESP32 tidak connect WiFi**: Cek nama SSID dan Password (case-sensitive). Pastikan menggunakan frekuensi 2.4GHz.
*   **Data tidak muncul di Web**:
    *   Pastikan Backend berjalan.
    *   Cek koneksi Database di log backend.
    *   Pastikan `VITE_API_URL` di frontend benar.
*   **Valve tidak merespon tombol**:
    *   Pastikan sistem dalam mode **MANUAL**.
    *   Cek koneksi MQTT di backend dan ESP32.
*   **Error "Database connection failed"**:
    *   Cek apakah MySQL running.
    *   Verifikasi username/password database di `.env`.

### Tips Perawatan:
*   Bersihkan sensor ultrasonic dari uap air secara berkala.
*   Backup database `iot_desalinasi` secara rutin melalui phpMyAdmin.
*   Periksa kabel-kabel pada breadboard jika pembacaan sensor tidak stabil.

---
*Dokumen ini merupakan gabungan dari berbagai modul dokumentasi proyek untuk memudahkan referensi.*
