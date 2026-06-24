
DROP TABLE IF EXISTS pendaftar, absensi_pengajar, absensi, jadwal, santri_kelas, kelas, password_reset_tokens, admin, pengajar, santri, program, users CASCADE;

-- 1. Users
CREATE TABLE users (
    id_users SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status_user VARCHAR(20) DEFAULT 'aktif',
    username VARCHAR(255) UNIQUE
);

-- 2. Admin
CREATE TABLE admin (
    id_admin SERIAL PRIMARY KEY,
    id_users INT UNIQUE REFERENCES users(id_users) ON DELETE CASCADE,
    nama VARCHAR(255),
    email VARCHAR(255),
    no_wa VARCHAR(20),
    foto VARCHAR(255)
);

-- 3. Pengajar
CREATE TABLE pengajar (
    id_pengajar SERIAL PRIMARY KEY,
    id_users INT UNIQUE REFERENCES users(id_users) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    no_kontak VARCHAR(30),
    alamat TEXT,
    status VARCHAR(20) DEFAULT 'aktif',
    tempat_lahir VARCHAR(150),
    tanggal_lahir DATE,
    mapel VARCHAR(255),
    email VARCHAR(255),
    nip VARCHAR(255),
    tanggal_terdaftar VARCHAR(255)
);

-- 4. Santri
CREATE TABLE santri (
  id_santri SERIAL PRIMARY KEY,
  id_users INT UNIQUE REFERENCES users (id_users) ON DELETE CASCADE,
  nis VARCHAR(50) UNIQUE,
  nama VARCHAR(255) NOT NULL,
  kategori VARCHAR(20) NOT NULL,
  no_wa VARCHAR(20),
  email VARCHAR(255),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  status VARCHAR(20) DEFAULT 'aktif',
  alamat text,
  tanggal_terdaftar VARCHAR(255)
);

--11
CREATE TABLE program (
    id_program SERIAL PRIMARY KEY,
    nama_program VARCHAR(100) NOT NULL,
    deskripsi TEXT
);

-- 5. Kelas
CREATE TABLE kelas (
  id_kelas SERIAL PRIMARY KEY,
  id_program INT REFERENCES program(id_program),
  nama_kelas VARCHAR(100),
  kategori VARCHAR(20),
  status VARCHAR(20) DEFAULT 'aktif'
);

-- 6. Santri Kelas
CREATE TABLE santri_kelas (
    id_santri INT REFERENCES santri(id_santri) ON DELETE CASCADE,
    id_kelas INT REFERENCES kelas(id_kelas) ON DELETE CASCADE,
    tgl_gabung DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (id_santri, id_kelas)
);

-- 7. Jadwal
CREATE TABLE jadwal (
    id_jadwal SERIAL PRIMARY KEY,
    id_kelas INT REFERENCES kelas(id_kelas) ON DELETE CASCADE,
    id_pengajar INT REFERENCES pengajar(id_pengajar) ON DELETE SET NULL,
    hari VARCHAR(20) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    kapasitas INT NOT NULL,
    lokasi VARCHAR(100),
    status VARCHAR(20) DEFAULT 'aktif'
);

CREATE TABLE santri_jadwal (
    id_santri INT REFERENCES santri(id_santri) ON DELETE CASCADE,
    id_jadwal INT REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
    PRIMARY KEY (id_santri, id_jadwal)
);

-- 8. Absensi & Token
CREATE TABLE absensi (
    id_absensi SERIAL PRIMARY KEY,
    id_santri INT REFERENCES santri(id_santri) ON DELETE CASCADE,
    id_jadwal INT REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    status_absensi VARCHAR(10) CHECK (status_absensi IN ('Hadir', 'Izin', 'Sakit', 'Alpha', 'Mustamiah')),
    catatan TEXT
);

--9
CREATE TABLE absensi_pengajar (
    id_absensi_pengajar SERIAL PRIMARY KEY,
    id_pengajar INT REFERENCES pengajar(id_pengajar),
    id_jadwal INT REFERENCES jadwal(id_jadwal),
    tanggal DATE NOT NULL,
    status_absensi VARCHAR(10) CHECK (status_absensi IN ('Hadir', 'Izin', 'tidak hadir')),
    catatan TEXT
);

ALTER TABLE absensi_pengajar 
DROP CONSTRAINT absensi_pengajar_id_jadwal_fkey;
ALTER TABLE absensi_pengajar 
ADD CONSTRAINT absensi_pengajar_id_jadwal_fkey 
FOREIGN KEY (id_jadwal) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE;

--10
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  id_users INT REFERENCES users(id_users) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE,
  expired_at TIMESTAMP
);

--12
CREATE TABLE pendaftar (
  id_pendaftar SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  email VARCHAR(255) NOT NULL,
  no_wa VARCHAR(20),
  alamat TEXT,
  status VARCHAR(20) DEFAULT 'menunggu'
);

--13 
CREATE TABLE announcement (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    isi TEXT NOT NULL,
    id_pengajar INT -- Opsional: untuk membedakan catatan tiap guru
);

--14
-- MATERI AJAR
CREATE TABLE IF NOT EXISTS materi_ajar (
    id_materi SERIAL PRIMARY KEY,
    id_kelas INT NOT NULL REFERENCES kelas(id_kelas) ON DELETE CASCADE,
    id_jadwal INT REFERENCES jadwal(id_jadwal),
    id_pengajar INT REFERENCES pengajar(id_pengajar),
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tipe_file VARCHAR(20), -- Menghapus NOT NULL
    file_path TEXT,        -- Menghapus 'DROP NOT NULL', defaultnya adalah NULL
    tipe_konten VARCHAR(20) DEFAULT 'file',
    link_url TEXT,         -- Menghapus 'DROP NOT NULL'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 15 TUGAS
CREATE TABLE IF NOT EXISTS tugas (
    id_tugas SERIAL PRIMARY KEY,
    id_kelas INT NOT NULL REFERENCES kelas(id_kelas) ON DELETE CASCADE,
    id_jadwal INT REFERENCES jadwal(id_jadwal),
    id_materi INT REFERENCES materi_ajar(id_materi) ON DELETE CASCADE,
    id_pengajar INT NOT NULL REFERENCES pengajar(id_pengajar),
    judul VARCHAR(255),
    deskripsi TEXT,
    deadline TIMESTAMP NOT NULL,
    tipe_tugas VARCHAR(20) DEFAULT 'file',
    link_url TEXT,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 16 PENGUMPULAN TUGAS
CREATE TABLE IF NOT EXISTS pengumpulan_tugas (
    id_pengumpulan SERIAL PRIMARY KEY,
    id_tugas INT NOT NULL REFERENCES tugas(id_tugas) ON DELETE CASCADE,
    id_santri INT NOT NULL REFERENCES santri(id_santri) ON DELETE CASCADE,
    file_path TEXT,
    tipe_konten VARCHAR(20) DEFAULT 'file',
    link_url TEXT,
    nilai INTEGER DEFAULT NULL,
    jawaban_teks TEXT, -- Untuk menyimpan catatan/jawaban santri
    catatan_pengajar TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_tugas, id_santri)
);


-- 17. Progres Pembelajaran Santri
CREATE TABLE progres_pembelajaran (
    id_progres SERIAL PRIMARY KEY,
    id_santri INT NOT NULL REFERENCES santri(id_santri) ON DELETE CASCADE,
    id_kelas INT NOT NULL REFERENCES kelas(id_kelas) ON DELETE CASCADE,
    minggu_ke INT NOT NULL,
    catatan TEXT NOT NULL,
    nilai INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_santri, id_kelas, minggu_ke)
);

--18 RAPOR tahsin
CREATE TABLE rapor_tahsin (
  id_rapor SERIAL PRIMARY KEY,
  id_santri INT NOT NULL,
  id_pengajar INT NOT NULL,
  id_jadwal INT REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
  periode VARCHAR(50) NOT NULL,

  nilai_pekanan DECIMAL(5,2),
  ujian_tilawah DECIMAL(5,2),
  nilai_teori DECIMAL(5,2),
  nilai_presensi DECIMAL(5,2),
  nilai_akhir DECIMAL(5,2),

  catatan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  predikat VARCHAR(20),
  keterangan VARCHAR(50),

  UNIQUE (id_santri, periode),
  CONSTRAINT unique_rapor_tahsin_sesi UNIQUE (id_santri, id_jadwal, periode),
  FOREIGN KEY (id_pengajar) REFERENCES pengajar(id_pengajar)
);

--19
CREATE TABLE rapor_tahfidz (
  id_rapor SERIAL PRIMARY KEY,
  id_santri INT NOT NULL,
  id_pengajar INT NOT NULL,
  id_jadwal INT REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
  periode VARCHAR(50) NOT NULL,

  nilai_rata_simakan DECIMAL(5,2),
  nilai_ujian_akhir DECIMAL(5,2),
  nilai_akhir DECIMAL(5,2),

  predikat VARCHAR(20),
  keterangan VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (id_santri, periode),
  CONSTRAINT unique_rapor_tahfidz_sesi UNIQUE (id_santri, id_jadwal, periode),
  FOREIGN KEY (id_pengajar) REFERENCES pengajar(id_pengajar)
);

--20
CREATE TABLE tahfidz_simakan (
  id_simakan SERIAL PRIMARY KEY,
  id_rapor INT NOT NULL,
  juz INT CHECK (juz BETWEEN 1 AND 30),
  nilai DECIMAL(5,2),

  UNIQUE (id_rapor, juz),
  FOREIGN KEY (id_rapor) REFERENCES rapor_tahfidz(id_rapor)
);

--21
CREATE TABLE infaq (
  id_infaq SERIAL PRIMARY KEY,
  nama_pembayaran VARCHAR(100),
  tanggal DATE NOT NULL,
  nominal BIGINT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);


--21 BILLING
CREATE TABLE billing_santri (
  id_billing SERIAL PRIMARY KEY,
  id_santri INT REFERENCES santri(id_santri),
  id_jadwal INT REFERENCES jadwal(id_jadwal),
  jenis VARCHAR(100),
  tipe VARCHAR(50) NOT NULL,
  periode VARCHAR(50),
  nominal INT NOT NULL,
  sisa INT NOT NULL,
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  keterangan TEXT,
  status VARCHAR(20) DEFAULT 'belum bayar',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE billing_santri
ADD CONSTRAINT unique_spp_periode
UNIQUE (id_santri, jenis, periode);
ALTER TABLE billing_santri 
ADD CONSTRAINT unique_billing 
UNIQUE (id_santri, tipe, tanggal_mulai);


--22 PEMBAYARAN
CREATE TABLE pembayaran (
  id_pembayaran SERIAL PRIMARY KEY,
  id_billing INT REFERENCES billing_santri(id_billing),
  id_santri INT REFERENCES santri(id_santri),
  tanggal_bayar DATE,
  jumlah_bayar INT NOT NULL,
  metode VARCHAR(50),
  kategori VARCHAR(50) NOT NULL,
  jenis_pembayaran VARCHAR(50),
  sumber VARCHAR(20),
  status VARCHAR(20) DEFAULT 'menunggu',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE billing_santri 
ADD CONSTRAINT check_status_lower CHECK (status = LOWER(status));

ALTER TABLE pembayaran 
ADD CONSTRAINT check_pembayaran_status_lower CHECK (status = LOWER(status));

--23
CREATE TABLE pengeluaran (
  id_pengeluaran SERIAL PRIMARY KEY,
  tanggal DATE,
  kategori VARCHAR(50),
  nominal INT,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE SCHEMA IF NOT EXISTS warehouse;

CREATE TABLE IF NOT EXISTS warehouse.rekap_keuangan_bulanan (
    bulan VARCHAR(7),
    total_pemasukan BIGINT,
    total_pengeluaran BIGINT,
    total_infaq BIGINT,
    laba_bersih BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SEED DATA (users yang dibutuhkan oleh tests/helpers/authHelper.js)
-- ============================================================

-- *** ADMIN users (id_users: 1-5) ***
-- admin1 / admin1
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin1@ysq.com', '$2a$12$a8YvFLJ3dhQJaPCdHgeY7Og62137S9KOqbImtWBMipqCzaIf3VRM.', 'admin', 'aktif', 'admin1');

-- admin2 / admin2  <-- dipakai loginAdmin() di authHelper.js
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin2@ysq.com', '$2a$12$cNMExvVowAI/Xbg5OkPyoO.9wrsDV0.MrsJxPbN2WJP0k0JuMD6/q', 'admin', 'aktif', 'admin2');

-- admin3 / admin3
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin3@ysq.com', '$2a$12$Q0x7lTH1.uaK77mKvKZnp.53xyggUf8woBy2RVaVdb8Qt1fe9OLTS', 'admin', 'aktif', 'admin3');

-- admin4 / admin4
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin4@ysq.com', '$2a$12$F1ZwSY3l0AP2LCAuQEhIu.TzwGgYqhxgC49YmPPG19.qpUbC4zA.e', 'admin', 'aktif', 'admin4');

-- admin5 / admin5
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin5@ysq.com', '$2a$12$LlQBotZXQWe0ND5snff30eIrxjo4Q51j3lxX4S86h8m3GiIlv3L0C', 'admin', 'aktif', 'admin5');

-- *** SANTRI users (id_users: 6-7) ***
-- YSQ26DWS011_santri1 / santri1123  <-- dipakai loginSantri() di authHelper.js
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('santri1@ysq.com', '$2b$10$SeBM7khTb/Zm8Mmkb9EoDOFe8bzfCmpAmyiL52ZIk6O0xdQXEkmzq', 'santri', 'aktif', 'YSQ26DWS011_santri1');

-- YSQ26DWS012_santri2 / santri2
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('santri2@ysq.com', '$2b$10$AGP.2LVxx8ykLYjiH0X8U.b6DHQyLv3O519up818wMVBW8w05J99a', 'santri', 'aktif', 'YSQ26DWS012_santri2');

-- *** PENGAJAR users (id_users: 8) ***
-- YSQ25PGJ001_riska / riska  <-- dipakai loginPengajar() di authHelper.js
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('pengajar1@ysq.com', '$2b$10$Dn47wRy1INoGPF1zu1VtmuU0Ic8dBhPRJQ9QSb2k6uGcd14pNxzWe', 'pengajar', 'aktif', 'YSQ25PGJ001_riska');

-- ============================================================
-- ADMIN table entries
-- ============================================================
INSERT INTO admin (id_users, nama, email)
VALUES (1, 'Admin1', 'admin1@ysq.com');

INSERT INTO admin (id_users, nama, email)
VALUES (2, 'Admin2', 'admin2@ysq.com');

INSERT INTO admin (id_users, nama, email)
VALUES (3, 'Admin3', 'admin3@ysq.com');

INSERT INTO admin (id_users, nama, email)
VALUES (4, 'Admin4', 'admin4@ysq.com');

INSERT INTO admin (id_users, nama, email)
VALUES (5, 'Admin5', 'admin5@ysq.com');

-- ============================================================
-- SANTRI table entries
-- ============================================================
-- santri1 (id_users=6) - dipakai oleh loginSantri()
INSERT INTO santri (id_users, nis, nama, kategori, no_wa, email, tempat_lahir, tanggal_lahir, status, alamat)
VALUES (6, 'YSQ26DWS011', 'santri1', 'Dewasa', '0812345679', 'santri1@ysq.com', 'jakarta', '2007-05-10', 'aktif', 'jakarta');

-- santri2 (id_users=7)
INSERT INTO santri (id_users, nis, nama, kategori, no_wa, email, tempat_lahir, tanggal_lahir, status, alamat)
VALUES (7, 'YSQ26DWS012', 'santri2', 'Dewasa', '0812345678', 'santri2@ysq.com', 'bogor', '2008-10-08', 'aktif', 'bogor');

-- ============================================================
-- PENGAJAR table entries
-- ============================================================
-- riska (id_users=8) - dipakai oleh loginPengajar()
INSERT INTO pengajar (id_users, nama, no_kontak, alamat, status, tanggal_lahir, email, nip)
VALUES (8, 'riska1', '089876543210', 'Alamat Pengajar Baru', 'aktif', '2006-10-06', 'pengajar1@ysq.com', 'YSQ25PGJ001');