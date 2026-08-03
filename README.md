# 📘 Aplikasi Manajemen Yayasan Sahabat Qur'an (YSQ)

[![codecov](https://codecov.io/gh/nisa262006/Manajemen_YSQ/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/nisa262006/Manajemen_YSQ)

Sistem manajemen berbasis web yang dirancang untuk meningkatkan efisiensi operasional Yayasan Sahabat Qur'an (YSQ). Proyek ini dibangun sebagai implementasi dari dokumen Proposal Manajemen Proyek – Perancangan dan Implementasi Aplikasi Manajemen Berbasis Web.

## Tujuan 
1. Mengotomatisasi proses pendaftaran, penjadwalan, dan absensi.
2. Meningkatkan efisiensi pengelolaan data santri, pengajar, dan kelas.
3. Menyediakan platform yang mudah digunakan bagi semua pihak terkait.

## ✨ Fitur Utama yang Diimplementasikan (Semester 3)

### Implementasi saat ini mencakup modul inti sesuai ruang lingkup Semester 3 (FR.001–FR.005):

- FR.001 – Manajemen Pengguna & Login
- FR.002 – Registrasi Peserta (Santri Baru)
- FR.003 – Manajemen Kelas & Penempatan Santri
- FR.004 – Manajemen Jadwal Pelajaran
- FR.005 – Manajemen Kehadiran (Absensi)

## 🏗 Teknologi yang Digunakan

### Frontend:
- Html
- CSS
- JavaScript

### Backend:
- Node.js / Express 
- PostgreSQL 15
- Docker Compose 

### Tools:
- Figma (UI/UX)
- GitHub & Git
- VSCode

## 🚀 Cara Menjalankan Proyek (Local Development)
```
1️⃣ Clone Repository
git clone https://github.com/username/Manajemen-ysq.git
cd Manajemen-ysq
```
```
2️⃣ Setup Environment & Dependencies
- Masuk ke folder Backend/
- Buat file .env secara manual (Isi DB_USER, DB_PASSWORD, dll)
- Jalankan perintah: npm install
```
```
3️⃣ Menjalankan Database (Docker)
- Pastikan aplikasi Docker Desktop sudah aktif
- Jalankan perintah: docker-compose up db -d
```
```
4️⃣ Menjalankan Aplikasi
   - Jalankan server: npm start (atau node src/app.js)
   - Akses API di: http://localhost:8000
```

## Struktur Folder
```
SAHABAT-QURAN-WEB/
├── Backend/                           
│   ├── docker/                        
│   │   ├── init.sql                   
│   │   └── schema.sql                  
│   ├── node_modules/                 
│   ├── public/
│   │   ├── uploads/                    
│   │   ├── css/                        
│   │   │   ├── admin.css
│   │   │   ├── pengajar.css
│   │   │   ├── santri.css
│   │   │   └── style.css
│   │   ├── images/                     
│   │   │   ├── img.jpg
│   │   │   ├── kelas.jpg
│   │   │   └── LogoYSQ.png
│   │   ├── js/                        
│   │   │   ├── absensisantri.js           
│   │   │   ├── admin_data.js
│   │   │   ├── admin_jadwal.js
│   │   │   ├── admin_laporan.js
│   │   │   ├── admin.js
│   │   │   ├── apiService.js
│   │   │   ├── login.js
│   │   │   ├── pengajar.js
│   │   │   ├── profileSetting.js
│   │   │   ├── register.js
│   │   │   ├── santri.js
│   │   │   └── script.js
│   │   └── views/                     
│   │       ├── absensisiswa.html
│   │       ├── Admin.html
│   │       ├── berhasil.html
│   │       ├── daftar_jadwal.html
│   │       ├── daftar_kelas.html
│   │       ├── daftar_pengajar.html
│   │       ├── daftar_registrasi.html
│   │       ├── daftar_santri.html
│   │       ├── daftar.html
│   │       ├── dashboardpengajar.html
│   │       ├── dashboardsantri.html
│   │       ├── detail_pengajar.html
│   │       ├── detail_santri.html
│   │       ├── index.html           
│   │       ├── login.html
│   │       ├── reset_password.html
│   │       ├── riwayat_absensi_santri.html
│   │       ├── riwayat_absensi.html
│   │       ├── riwayat_absensi_santri.html
│   │       ├── tambah_kelas.html
│   │       ├── tambah_pengajar.html
│   │       └── tambah_siswa.html
│   ├── src/                          
│   │   ├── config/                     
│   │   │   ├── db.js                   
│   │   │   ├── hash.js                 
│   │   │   └── testconnection.js       
│   │   ├── controllers/                
│   │   │   ├── absensicontrollers.js
│   │   │   ├── admincontrollers.js
│   │   │   ├── authcontrollers.js
│   │   │   ├── jadwalcontrollers.js
│   │   │   ├── kelascontrollers.js
│   │   │   ├── mecontrollers.js
│   │   │   ├── pengajarcontrollers.js
│   │   │   ├── registercontrollers.js
│   │   │   ├── santricontrollers.js
│   │   │   └── santridashboardcontrollers.js
│   │   ├── middleware/                 
│   │   │   ├── auth.js
│   │   │   ├── upload.js                
│   │   │   └── role.js                 
│   │   ├── routes/                     
│   │   │   ├── absensiroutes.js
│   │   │   ├── adminroutes.js
│   │   │   ├── authroutes.js
│   │   │   ├── jadwalroutes.js
│   │   │   ├── kelasroutes.js
│   │   │   ├── meroutes.js
│   │   │   ├── pengajarroutes.js
│   │   │   ├── registerroutes.js
│   │   │   ├── santridashboardroutes.js
│   │   │   └── santriroutes.js
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   └── app.js                      
│   ├── .env                           
│   ├── docker-compose.yml             
│   ├── dockerfile              
│   ├── package-lock.json      
│   ├── package.json      
│   ├── test_api.http      
│   └── test-nodemailer.js              
├── tests/                            
├── .gitignore                          # Pengabaian node_modules & .env
├── package-lock.json
└── README.md           
```

### Struktur Tim
- Project Manager & Qualiity Assurance (Rizka)
- Back-end (Fikri)
- Back-end & Database Developer (Nisa)
- Front-end & UI/UX Developer (Jingga

## 🙏 Penutup
Repository ini dikelola sebagai bagian dari implementasi sistem manajemen modern untuk Yayasan Sahabat Qur’an Bogor. Proyek ini dibangun dengan tujuan meningkatkan efisiensi, akurasi, dan profesionalitas dalam pengelolaan operasional yayasan.
