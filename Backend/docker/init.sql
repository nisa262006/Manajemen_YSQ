
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

-- 5. Kelas
CREATE TABLE kelas (
  id_kelas SERIAL PRIMARY KEY,
  id_pengajar INT REFERENCES pengajar(id_pengajar),
  id_program INT REFERENCES program(id_program),
  nama_kelas VARCHAR(100),
  kategori VARCHAR(20) NOT NULL,
  kapasitas INT,
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
    lokasi VARCHAR(100)
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

--19
CREATE TABLE absensi_pengajar (
    id_absensi_pengajar SERIAL PRIMARY KEY,
    id_pengajar INT REFERENCES pengajar(id_pengajar),
    id_jadwal INT REFERENCES jadwal(id_jadwal),
    tanggal DATE NOT NULL,
    status_absensi VARCHAR(10) CHECK (status_absensi IN ('Hadir', 'Izin', 'tidak hadir')),
    catatan TEXT
);

--10
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  id_users INT REFERENCES users(id_users) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE,
  expired_at TIMESTAMP
);

--11
CREATE TABLE program (
    id_program SERIAL PRIMARY KEY,
    nama_program VARCHAR(100) NOT NULL,
    deskripsi TEXT
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

-- insert
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin1@ysq.com', '$2a$12$a8YvFLJ3dhQJaPCdHgeY7Og62137S9KOqbImtWBMipqCzaIf3VRM.', 'admin', 'aktif', 'admin1');

INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin2@ysq.com', '$2a$12$cNMExvVowAI/Xbg5OkPyoO.9wrsDV0.MrsJxPbN2WJP0k0JuMD6/q', 'admin', 'aktif', 'admin2');

INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin3@ysq.com', '$2a$12$Q0x7lTH1.uaK77mKvKZnp.53xyggUf8woBy2RVaVdb8Qt1fe9OLTS', 'admin', 'aktif', 'admin3');

--- admin
INSERT INTO admin (id_users, nama, email)
VALUES (1, 'Admin1', 'admin1@ysq.com');

INSERT INTO admin (id_users, nama, email)
VALUES (2, 'Admin2', 'admin2@ysq.com');

INSERT INTO admin (id_users, nama, email)
VALUES (3, 'Admin3', 'admin3@ysq.com');