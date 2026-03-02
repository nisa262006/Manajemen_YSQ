
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
  unique_rapor_tahsin_sesi
UNIQUE (id_santri, id_jadwal, periode),
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
  unique_rapor_tahfidz_sesi
  UNIQUE (id_santri, id_jadwal, periode),
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



-- insert
INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin1@ysq.com', '$2a$12$a8YvFLJ3dhQJaPCdHgeY7Og62137S9KOqbImtWBMipqCzaIf3VRM.', 'admin', 'aktif', 'admin1');

INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin2@ysq.com', '$2a$12$cNMExvVowAI/Xbg5OkPyoO.9wrsDV0.MrsJxPbN2WJP0k0JuMD6/q', 'admin', 'aktif', 'admin2');

INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin3@ysq.com', '$2a$12$Q0x7lTH1.uaK77mKvKZnp.53xyggUf8woBy2RVaVdb8Qt1fe9OLTS', 'admin', 'aktif', 'admin3');

INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin4@ysq.com', '$2a$12$F1ZwSY3l0AP2LCAuQEhIu.TzwGgYqhxgC49YmPPG19.qpUbC4zA.e', 'admin', 'aktif', 'admin4');

INSERT INTO users (email, password_hash, role, status_user, username)
VALUES ('admin5@ysq.com', '$2a$12$LlQBotZXQWe0ND5snff30eIrxjo4Q51j3lxX4S86h8m3GiIlv3L0C', 'admin', 'aktif', 'admin5');

--- admin
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

INSERT INTO users (email, password_hash, role, username) VALUES
('anitalestariatimukti@ysq.com', '$2b$10$vGE6/AI.Uy52Xw6ZlcaxoOYZb5xNF5i4vdjcmDNkDwP8qbcqSFHN6', 'pengajar', 'anitalestariatimukti'),
('desylinakoyansow@ysq.com', '$2b$10$CqaUkLRhBGlkxIywASlxruZx79JKnVuRMY//7KVfafmtE6i8/1iRe', 'pengajar', 'desylinakoyansow'),
('dewimulyani@ysq.com', '$2b$10$oFwfOB7zAMU29.Z/mlZ5ounS9miJBfBQq7rhcNzQs4p0z5hzfTSXa', 'pengajar', 'dewimulyani'),
('dewimuviani@ysq.com', '$2b$10$vZbzb97rDEaMyzwqi/yxIOTE8EzD6SxwaSlG/u0zuFCZ/d8j212YO', 'pengajar', 'dewimuviani'),
('ekapurwanti@ysq.com', '$2b$10$.OczH5ZEEPrwnvCM3cseS..fp8wzquYoTaDCUoN9P8ZRIGHIw/K6q', 'pengajar', 'ekapurwanti'),
('endahoktaviani@ysq.com', '$2b$10$BCNrWO0tApa0.gsehi3qMOJK/J.LpyQG1xwysVNgFZ8wcGUdLwfSq', 'pengajar', 'endahoktaviani'),
('firyalfaizzatusysyauqi@ysq.com', '$2b$10$hLaqQEnmUXA9YcuPrQU8IOiUncCrC1yS.aMvwEFBw/LmfbXeTcggy', 'pengajar', 'firyalfaizzatusysyauqi'),
('fatmawati@ysq.com', '$2b$10$SnHfjqU/S9e466BZJF.5KehScEVqy3TbIA2SbvsMQEcMLQz4syZMe', 'pengajar', 'fatmawati'),
('feraayudianita@ysq.com', '$2b$10$4OGbtmGbYGgnPpd4McI1Y.xDalcGPVvWcUFdJFUYhBWpc5t24BH9W', 'pengajar', 'feraayudianita'),
('khusnulkhotimah@ysq.com', '$2b$10$1rXceTrQ25Kazky99P3yluzjYVAMsrb3BstlYptI0ofR0R5gIpGjC', 'pengajar', 'khusnulkhotimah'),
('junaidahhasan@ysq.com', '$2b$10$oft6wws0tBmwlU18CIVyAuOiR8O.lTHjswUTQSEN3ai4thlemBeLK', 'pengajar', 'junaidahhasan'),
('nurfadhlinafaisya@ysq.com', '$2b$10$NSiVhHVBAjYVMs5k6OhBiOJYX7CdimFA.1U.Kd9mofFzUuabKaiIW', 'pengajar', 'nurfadhlinafaisya'),
('linawati@ysq.com', '$2b$10$pbzGc9fYwU9GYSbcOcfEGeVPQtmaySSohufIvpP1g/iGLfcAjy1ee', 'pengajar', 'linawati'),
('mayamujawati@ysq.com', '$2b$10$POYAcSrgnVX3YRBS9ldtHOplIStjsRqEX4zvG2zgXFVOA781OyjVO', 'pengajar', 'mayamujawati'),
('mujiati@ysq.com', '$2b$10$nmnCDrF/HkoG.pDKcXAG3ei5SkAUy5OeLlU/cUuOGVKThebS5nYye', 'pengajar', 'mujiati'),
('nadyatulkhaira@ysq.com', '$2b$10$Qnl2PnKCLeOh2K2GlP4hO.qySuLUCITQFOqog2FQh9C2gN9KXIk8.', 'pengajar', 'nadyatulkhaira'),
('nurhamimah@ysq.com', '$2b$10$bqP.D.YrWg78MO.QUitIt.9B3psjeQjyVLJYauKD5hdUfvw8AeVzq', 'pengajar', 'nurhamimah'),
('nurhayati@ysq.com', '$2b$10$XdvxQJ2mOOBmFwoW0zmr4.JZonYAapP2vWGFgzTfaxuyAsQ/gPrHy', 'pengajar', 'nurhayati'),
('pariani@ysq.com', '$2b$10$k.OekZWBir/dBixNeuMNLeeEXOVJEGKVw7mSaF6nL55yBuwFLNkc.', 'pengajar', 'pariani'),
('patmawati@ysq.com', '$2b$10$Gv.e8sXmZxay2ohif3iwNuji4NF3o1hJXI.irK2Sxz5hcidGPap6W', 'pengajar', 'patmawati'),
('sitimarini@ysq.com', '$2b$10$Cr3CVXLZHLo30M6vsTgzuex7lnWyO6avxQh4QS/Q4EtyFxgY9zUfm', 'pengajar', 'sitimarini'),
('tantilestari@ysq.com', '$2b$10$/3ykT0Z3lMo0rqqjBiktdebt3QW5iwOH7DPtLjT/rNHWoYW4YdOcO', 'pengajar', 'tantilestari'),
('yolawibawati@ysq.com', '$2b$10$t/Vl98PmnShtqpwU6.uuoO5.01yUKBouYH.EFUj2x8zAhg7VanUwS', 'pengajar', 'yolawibawati');

INSERT INTO pengajar 
(id_users, nama, no_kontak, alamat, mapel, nip, tanggal_terdaftar)
VALUES
(6,'Anita Lestariati Mukti','81383554551','Cibinong','TQ2,Tahsin','YSQ26PGJ001',CURRENT_DATE::text),
(7,'Desylina Koyansow','87874374488','Cibinong','TQ2,TQ3,Tahsin','YSQ26PGJ002',CURRENT_DATE::text),
(8,'Dewi Mulyani','85716307590','Cibinong','PTL','YSQ26PGJ003',CURRENT_DATE::text),
(9,'Dewi Muviani','81283747646','Cibinong','Tahsin Anak','YSQ26PGJ004',CURRENT_DATE::text),
(10,'Eka Purwanti','8984646599','Cibinong','PTL,Tahsin Anak','YSQ26PGJ005',CURRENT_DATE::text),
(11,'Endah Oktaviani','81398069875','Cibinong','Tahfidz,Tahsin 1,PTL,Tahsin Anak','YSQ26PGJ006',CURRENT_DATE::text),
(12,'Firyal Faizzatusysyauqi','85888515861','Cibinong','Tahsin Anak','YSQ26PGJ007',CURRENT_DATE::text),
(13,'Fatmawati','81196508464','Cibinong','Tahsin','YSQ26PGJ008',CURRENT_DATE::text),
(14,'Fera Ayudianita','85280837234','Cibinong','Tilawah,Tahsin Anak','YSQ26PGJ009',CURRENT_DATE::text),
(15,'Khusnul Khotimah','8158753324','Cibinong','TQ1,TQ2','YSQ26PGJ010',CURRENT_DATE::text),
(16,'Junaidah Hasan','85272575299','Pekan Baru','TQ3','YSQ26PGJ011',CURRENT_DATE::text),
(17,'Nurfadhlina Faisya','87887354605','Cibinong','Tahsin,Tilawah','YSQ26PGJ012',CURRENT_DATE::text),
(18,'Linawati','81294803048','Cibinong','Tahfidz,TQ2,Tahsin Anak','YSQ26PGJ013',CURRENT_DATE::text),
(19,'Maya Mujawati','8158911826','Cibinong','Tahfidz,TQ1','YSQ26PGJ014',CURRENT_DATE::text),
(20,'Mujiati','82141850608','Cibinong','TQ2,Tahsin Anak','YSQ26PGJ015',CURRENT_DATE::text),
(21,'Nadyatul Khaira','81285512718','Depok','Tahfidz','YSQ26PGJ016',CURRENT_DATE::text),
(22,'Nurhamimah','85893783185','Cibinong','Tilawah','YSQ26PGJ017',CURRENT_DATE::text),
(23,'Nurhayati','89635485996','Cibinong','Tahfidz,TQ2,TQ3','YSQ26PGJ018',CURRENT_DATE::text),
(24,'Pariani','8170973940','Cibinong','TQ1,PTL,Tahsin Anak','YSQ26PGJ019',CURRENT_DATE::text),
(25,'Patmawati','81381807523','Cibinong','Tahsin,TQ1','YSQ26PGJ020',CURRENT_DATE::text),
(26,'Siti Marini','81808102468','Cibinong','Tahfidz,TQ2,TQ3','YSQ26PGJ021',CURRENT_DATE::text),
(27,'Tanti Lestari','89634735469','Cibinong','PTL,Tahsin Anak','YSQ26PGJ022',CURRENT_DATE::text),
(28,'Yola Wibawati','89634283687','Cibinong','Tilawah','YSQ26PGJ023',CURRENT_DATE::text);

--tahsin TQ3
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$GoJ1QIq10IJTPa4r6BXlR.LFaPYQxL9gKnF5uL9iylFUCvtJTtEY.', 'santri', 'masnona'),
(NULL, '$2b$10$B/2isCU.jXclOnyDepuv6OGgwe6qHEJiaaRskHpYbYxdABDxBpKcC', 'santri', 'dewisulistiyani'),
(NULL, '$2b$10$nImOF2qDET2abo89dijV9.9UZCQC4jbzK788Q7Qva0oeFGt4z.6MO', 'santri', 'srisuprapti'),
(NULL, '$2b$10$71lJmp2bcr00W1cNvZxbhOEgsSvFinbKMMa5MPpWTDYM0lU.e9IzK', 'santri', 'nuraini'),
(NULL, '$2b$10$C60n8/XWpvohe54iN7nC7u2PTjiIXYw1IP46D6CuCGCqW2ZGko2wO', 'santri', 'hanisitiwasilah'),
(NULL, '$2b$10$bpUj29Z12/BvKOQ4eqtsqeeyQIU2facpETOPWQg9Ktsmgav7GM0XG', 'santri', 'enisundawati'),
(NULL, '$2b$10$zTDm/ktfO/Aywl6qcu1uJuecDwBt/TZm7ConCRUCctY8OXML5cNOy', 'santri', 'henisumarni'),
(NULL, '$2b$10$gPxWG/LH3E2/ZjqTsN1GPO3Wi7OGZ4i.UPHL3EwkhpNLN5bdF/KOy', 'santri', 'lidiyanti'),
(NULL, '$2b$10$BffyEl..3ATsxG0ZaPjmH.W9WhKSiEvMTYayNUcx/ifc0FpT0ax26', 'santri', 'nazzariazka'),
(NULL, '$2b$10$7eaJcbaQheFota3vB5IyCussLneT8qO/gEuxfSEBJJoVq.sefR6UK', 'santri', 'sitirohanah'),
(NULL, '$2b$10$.VN2/FDhh6VUhc5WuT/dee.8b65uArjL/xAwZY04uzdbnOyAj.ETu', 'santri', 'rianyunitasari'),
(NULL, '$2b$10$29U2divyA4h2hqci5dhMFuEv7UDEdUNgyMel9L22JjHff0RrXuQ3G', 'santri', 'mellyhayati'),
(NULL, '$2b$10$/357JjKk2KWq9Tjl5XBo7OT3WZ3FrEuqToy0PkXXiSdRpNW9hUkn2', 'santri', 'mafruchah'),
(NULL, '$2b$10$yOSBptSmnx/V/UaUvlDgO.B/dc6G7SoN4L7F7ldvs2ZGUKH8zTcb.', 'santri', 'patmawati'),
(NULL, '$2b$10$kYBQjJDXyYEfzzQ8faOX3OsxcyLqaubVk27F5xeALlZ3mL2yUlApK', 'santri', 'fitribudiarti'),
(NULL, '$2b$10$DvShNZ7uIjHHlkI95ZOhxuIaz9rfMca3LPOuvKgZohAa.57G5h7E.', 'santri', 'neldawati'),
(NULL, '$2b$10$v91LkaCaA6WSIwRr2PfbuuuGb9XT129sC0zPoJBRlYUEDJw5c/3KO', 'santri', 'estinurasih'),
(NULL, '$2b$10$hcLWa0Ceh1Yc/jnyJpuAsuE2DfllOWvA1h7aSo02nxWQNq9Ta.VMm', 'santri', 'diahiswandari'),
(NULL, '$2b$10$zlt4Ppx4S5sjIeoOXGC6k.B8/aXHSOkp0JrtMWuTIZxrFGo2aexCq', 'santri', 'upikherawati'),
(NULL, '$2b$10$YNJLRtnSKr4YPDrKePfLkexNibKO4RxnR/jxqTp.PLOl0MLRcLBzK', 'santri', 'darmasusilowati'),
(NULL, '$2b$10$jab4CyiHiLYBA2WXp6Ui3ONzGu5xOK4dhaKYG2K7T77zSYfuXOpYq', 'santri', 'dewiastutik'),
(NULL, '$2b$10$P6IyERNzq5yE6PDyj72TNex83SfhMOh3.hAOmbX1DS7TO9bLT9R6C', 'santri', 'ekowati'),
(NULL, '$2b$10$EGSUd6kQMTS94lklcL.8iucWKEAFJ.0GjTM/3U5BNH6F3byyDaN3O', 'santri', 'eliswina'),
(NULL, '$2b$10$wAH1sueWCKpN5dekI4u4Y.LI448stUTWXwWY19ZgykC346VtuM/uO', 'santri', 'fitrihandayani'),
(NULL, '$2b$10$FjA.fnCORtXLOsd7gAHBFuZoGn/zqObqHjNtcp8o94JGYlKVYnMPm', 'santri', 'bestiairfanaputri'),
(NULL, '$2b$10$O3.M3VeayJ2477zhFo930OJiMf3CWC0tAG6ktP0UQ158n8NJMbGTW', 'santri', 'niwayanidapurniati'),
(NULL, '$2b$10$39/zvBwUDL7cMRwvSvDxEeUBAfI6082tTnn2TF0prQCTsiNjijpAC', 'santri', 'nuningaisah'),
(NULL, '$2b$10$EjZJf8kW3kXigFkHVYVHJ.G9M29WfeQZhhn3BcVv1YJJ0Q61xGlwi', 'santri', 'sariyah'),
(NULL, '$2b$10$oQF40KAmeEQNVFHRw7fZvOKWg3ASBIdZeyEKgKgB2tuO5YciUlyNK', 'santri', 'shantiandriyanti'),
(NULL, '$2b$10$4K.y4rSN.TwpC8zWJAf/iOOdroa2KZ4rzI.3ex2DqiHesV6lQP7.C', 'santri', 'waisillindasaputri'),
(NULL, '$2b$10$atZDkUIJr365vlYgiEFNv.IsyYx.EKXbWaH2Gf/gN9WutSVtopS/2', 'santri', 'kusemah'),
(NULL, '$2b$10$SiPFNKM1OLbSSWlRI3DjzOfIjE8Sj7dzdLbiljDB1M7GjTtc0NchK', 'santri', 'umimarkamah'),
(NULL, '$2b$10$ysvCCUtOxxEztqoykmth0.Zqtwd9MiBCOwap7MCVcalv9p6RQgthq', 'santri', 'hartutik'),
(NULL, '$2b$10$ZcB4g5W9rTuiUHjw8G1cBujxPAP0AVQ4Jcw9XYxlk6mDxntwAWduq', 'santri', 'yozayulia'),
(NULL, '$2b$10$xatY7bkVNOJdH1HPM5.7pusFQuLf0gVJ9gML7LaG4/poGTFZBOAz6', 'santri', 'rosidawardani'),
(NULL, '$2b$10$yxAtGjuRaWN.yT5TyFtX2OPuT2PWYq.Ua7dnN.rDln.QncI1jlm36', 'santri', 'erniutami'),
(NULL, '$2b$10$0lfmiLYkHlS1fmOcJlNHoO6CQjumdkdj7Rw25bvu0TJ1WtvDRVjb6', 'santri', 'atikwahyuni'),
(NULL, '$2b$10$rFVv0u8Ksivj9BLCi2blPO7INaHZeSo9UkP3iNDY8haWIL./P72tO', 'santri', 'sritatys'),
(NULL, '$2b$10$oco7416Sx.M7QDbZFUBWtucI7DCQc6dxcZn70KrcQWancPfchzh/i', 'santri', 'nurasiah'),
(NULL, '$2b$10$p9fOY/WoSu425xiYkxw9uuPDOCRICayEiDHrhGLVpa3JrzmWa.EZS', 'santri', 'sitifikakomariah'),
(NULL, '$2b$10$RwqX5LciNLBCzgguMNyOveIw08.0OZvX9.vko4Sktug5U6YB.4bS.', 'santri', 'rantirefnoliza'),
(NULL, '$2b$10$JOAG7A6RE9nMznycnIyEr.2I1j9M7Ssj4Tu9cxr.4pUvF6pCuKC76', 'santri', 'sumarni'),
(NULL, '$2b$10$70Ql4g0aa7xuqWvthzkfb.Ic5rkjaLbAuZ/wGBbcCiujPYL07rzIG', 'santri', 'atikrachmawati'),
(NULL, '$2b$10$vM4PT/BBXqx3avnCSZ.M1eUQp5At45eKzSLfPRGqJWIifEfpwyaV.', 'santri', 'rahayutrihardina'),
(NULL, '$2b$10$4RQb/ioXrSrqrxwcalbg5OmcFL4BlHZETs0rlxsokCIjE1HSZD6b.', 'santri', 'masniatimalau'),
(NULL, '$2b$10$9ROW8UbzQ/mlcisgDPQxluft2GCsxhPNgI9B/4NPZPq2f4pjjOslG', 'santri', 'nunungnurhasanah'),
(NULL, '$2b$10$5cnmZw0epA0x23heFj8Ye.kEs62oiFQ6pomgSL/ALnjV1hWklsv5a', 'santri', 'episopiah'),
(NULL, '$2b$10$Pn92LqO7MKW2eHK4YJ.00.R545RlYjqIj21YtRQxLjX55hXyNlM/G', 'santri', 'linaherlina'),
(NULL, '$2b$10$WQA322mN4P.oLO2ZYsS9jOrQaPXtMUwB5U80B4XFPb38CgokIjTC.', 'santri', 'astrykartikasari');

--tahsin TQ2
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$SCqp.uqwDgTQjkvj74GFjON4B/RpTdEylDp01xvLiLvRuxH8xUq2y', 'santri', 'dwiindriyanti'),
(NULL, '$2b$10$FBpb4gOT9jas4iKVtfDXZeByp4LkJhQxpylgoJR4AA9ArDHkTSdx2', 'santri', 'roikhatunudhiyah'),
(NULL, '$2b$10$Vgb7T9sFP9LYEUDyOzY2FO/n1Ayqp70VFAhyuK1deqlm/s.3EBB.q', 'santri', 'farhatilwardah'),
(NULL, '$2b$10$31L4QFWrfPLt8CRWJ3Hf/uWRXv8YzQKRDvTBLEbJ0aOOavwHpcD7C', 'santri', 'ismiyarni'),
(NULL, '$2b$10$tbYcJxcWvursqXXe7cBzEekXUDUTw9bF99M8R.9dDVaehqpvvf7m.', 'santri', 'enibudisetiyawati'),
(NULL, '$2b$10$FdG6WSDFVl.R6Mc7hZZFP.KZM8cKh0InZTniH5q5IlWR2h59d22VS', 'santri', 'srimulyati'),
(NULL, '$2b$10$qDk2LZpofhIMi3trbu1bwOxwIKf9qI3jGiGvf7/VmGAuJp2SjmihG', 'santri', 'okiyana'),
(NULL, '$2b$10$Xy9BfJNC5AaU81qZS5EvrOS.kgHo7Wi5/nZyFfaGWG2uz9ntGpQ.q', 'santri', 'linamulyawati'),
(NULL, '$2b$10$DWkf6t6/cP8Muzmh960.leUMyz2wA7TdOpJrhIeXyRFOTW7wrnwd.', 'santri', 'widyawati'),
(NULL, '$2b$10$nM7STtmHrjef7O45rXEv4uPfDNI0dHWdayPl/Q2OLY7ibtLBf9J/2', 'santri', 'suhaeni'),
(NULL, '$2b$10$BnKWnN3N9srhw6P./vBbXecPMP6EOrO1axyTUwbxd/Z3ptM/Zbf6.', 'santri', 'chintiaparadina'),
(NULL, '$2b$10$wRmjx/bP7bFJ0e6/V/EX3OfG6o3J4GDOPvebrc4IYu99k9S7RDzlO', 'santri', 'endahsusanti'),
(NULL, '$2b$10$7nFajYQsaYcfFQuz1FJhB.SddC0Gp4uNK8uhucuzjXalqaJaMzqF6', 'santri', 'lilis'),
(NULL, '$2b$10$oDlcmSgvhGLcfyxuP3/zvuhabQMGyLafY14zWMnfCvvKFn82POSf.', 'santri', 'komariah'),
(NULL, '$2b$10$VILO8T.LgBqDeTb.avtasu9DkItnlXd0rgBSczTX4ZZ9oCMR0kHFW', 'santri', 'fitriadwiyuliantie'),
(NULL, '$2b$10$fIM0YPwhw809mt2gHY.fKufkD2NhPkiOPQ4UiTb.0ZMgxtxcTUiXW', 'santri', 'andriwati'),
(NULL, '$2b$10$nC36mLQiRUQJ6fYov8o9Ru7VOaTNmtv9vH.OhO3U7kzy9RCzH1Sz2', 'santri', 'sitijulaeha'),
(NULL, '$2b$10$X.OnHLYgMHS.thfbiQFPPuERLuBh1.T9XmNGpziXD1tM.RwD6ljMK', 'santri', 'fridaayu'),
(NULL, '$2b$10$nM7NiSyHJ/ELuQiw3eUCY.fQk7gl/VQzExdFwlrDbXpXj7T9sW7hW', 'santri', 'evalia'),
(NULL, '$2b$10$BP9D5I7WVnRnYMcvwY1sv.aGJH8vV32hfvfNZbhpWTmgyG/1LXH86', 'santri', 'rinihadiani'),
(NULL, '$2b$10$HxqWs5.ePRKOfuak6YWOXOXFuvwcZcLjsUTnBO0jiVCdOCLI.6ixO', 'santri', 'dessyliendasari'),
(NULL, '$2b$10$..pP5sWuUm4pplPmiNmcrOlpX/Y7.oHU8hyvQuMCRwMU8zguobmKq', 'santri', 'evalutfiah'),
(NULL, '$2b$10$wucE/HzNUIlqRRMfjPlClO.T16wt8gf1KUP5w4SuFqLIruCc.jCyO', 'santri', 'liamulyanah'),
(NULL, '$2b$10$3r8ON8QQ2SFdpBDuFBL.be99pvlcyEN9avzjQu/D3Qkz5WGIjz4rC', 'santri', 'mawar'),
(NULL, '$2b$10$E8zRgfTUyIAQlWuNvQfLAekOnZeJwhAhdtMw84zNylQdk3z0VpDxi', 'santri', 'kurnianuztiramantolini'),
(NULL, '$2b$10$CQ76dHSvoLrJgmD5xEGhnOPFP1Ef4JdYJaNy4dSMMeuSGMP1cXdO.', 'santri', 'intyastuti'),
(NULL, '$2b$10$0zzuSkcRlSMeRVb1YAnzw.HBAtd7qsMyXz3oNnv1GGe./MBrtbnv6', 'santri', 'sitiamalchusnah'),
(NULL, '$2b$10$u5hM3fWKsP9QLLjVOU1SBOdBiKXIzcBoCaXZpA6wdxzjCdNNyIAwa', 'santri', 'saniums'),
(NULL, '$2b$10$yAWgEriQVir1YcwQP1jGkugvLku8CHA5RgYGNIMGhjEyHOUGS79dG', 'santri', 'nuraznun'),
(NULL, '$2b$10$cVSm7dDAsf3cF6lFNg8QbuAhNBzzsn.1Kdivv/w7G0T4yYbZeTb1i', 'santri', 'musyarofah'),
(NULL, '$2b$10$bqO4QYIrjVupn9YIgaxZuOjH3drHgd5EC9PErGgJtxyYybG8RZFMe', 'santri', 'evawangi'),
(NULL, '$2b$10$5uS9HZCzBUhQuPIPLYb3ReHSkt4vLuxJ/uUCs6/jvbuPS840TJmay', 'santri', 'syahriza'),
(NULL, '$2b$10$QPEnL16vx.6p6PSZ0KrL6ujO061SwxuHvAs0gIW2lv6QP.cDm954i', 'santri', 'nurdwirohmah'),
(NULL, '$2b$10$4pLtg7hAiFFTvBCaZSrfIe8GyQVlFpkvxheWp739YtOdWMj2JipNG', 'santri', 'rosyadahariffiyah'),
(NULL, '$2b$10$Gt8U/ecYYYy3PKw51x7wseZqqGpSqBbrz/qcbOONs2rfQvhx1sePW', 'santri', 'rianovidyawati'),
(NULL, '$2b$10$S3fz1zXCMuqxgrkQ/Jmq0eVG6goftQ5xErHWH/KjsDs6pbLe6kInS', 'santri', 'sopriatin'),
(NULL, '$2b$10$0avFiOl.ibvyIcpmyk/Wnum3BSqUJURIse8CH1ijza0xViBomPMqa', 'santri', 'nurhikmah'),
(NULL, '$2b$10$Nf36bp6ciCi/4EHxOBtDqePKrgBe03JxeWuEFKnEXzuoR/OOM.nrS', 'santri', 'lizarozazi'),
(NULL, '$2b$10$7awo4paVprFioHD8h8PGcOktz0g6kVbb2fOL8b1ACwRj9hTtuC45G', 'santri', 'meisuryani');

--tahsin TQ1
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$40PHYaxOT2tDv6ru9yCpru5v89b8UURTtz7DtQ9xqEnnk29Yn6/ea', 'santri', 'dayuhima'),
(NULL, '$2b$10$rpf0blbdTQNGsH.CVcYvne61.zY.WT6RPeNUFCBxLRjxlciyDhldK', 'santri', 'dinihendrawati'),
(NULL, '$2b$10$LfZefnR21JGkGnxyPN.1Se6Tsn2DdHElyHRTRWxigjIvspzlAEhKq', 'santri', 'euisnuraini'),
(NULL, '$2b$10$OqZEAFR7vnTP0NFxIrmkSuRP4uzuk3TVQDIG8z4Ve2rQoRSTcRK16', 'santri', 'fercyjaqueline'),
(NULL, '$2b$10$5rZMgQluxKgFFgiZPSmHRe.O7t5/1nizOvpQyxmDJauMYN0yqIpSy', 'santri', 'larasdamayanti'),
(NULL, '$2b$10$SQDRUOxkGECfeDfhBFOpzenT6RTRova56XL2kIjuJwovyv3VrsNP.', 'santri', 'yesimeiditamahardianti'),
(NULL, '$2b$10$gTXZbL3gtdwPHWwtdRxA6O3nku46OxVaOLD7N5VPs/1SEbJih5Ssa', 'santri', 'kusmiatich'),
(NULL, '$2b$10$3EIrv8pN0.ApE5vQxCrjIuAJeGJB/qwptQK32BHWexlUTz9lmTEL2', 'santri', 'noviantari'),
(NULL, '$2b$10$oJaS.shNMoaXOa1OfMuhmO91MhWaaXY7iBCetrRm7FoEYlqRjei7u', 'santri', 'efifitrihastuti'),
(NULL, '$2b$10$9m8o7n/rpjMQ.tpte/c8CON9C3qWkS3DokhvAug.BsOZFpvDtnwXu', 'santri', 'irnawati'),
(NULL, '$2b$10$aMhnqiFtyIMJt/YVh85nd.utCAVQXJnNIzXCo0srlxOIlO6ugg.C6', 'santri', 'bebykurniadewi'),
(NULL, '$2b$10$jaZ86wb5MzBp2ZdjRjkV0.QKJwDqZ53RsEXk.C6Q9PxpUhxBRtouS', 'santri', 'endahyati'),
(NULL, '$2b$10$k5/v4P3ZcMEwntIs.9UVeuIoyPUkYVzb3dboEHBahWk4Aedsbw5na', 'santri', 'evafitria'),
(NULL, '$2b$10$i94ODzGGrg45fUqZsYS5leD63xuz1alr.O5wx.2wfsaxTb6g8hDZ2', 'santri', 'jumariah'),
(NULL, '$2b$10$Vjc8sCtNiuNhwwINWmykr.zZB2WfM2zU8lqNlydfd8Kt7yWjyDrG.', 'santri', 'lilikulinnuha'),
(NULL, '$2b$10$j1/G79eiEhka78SdjY/sO.N3M8BgnpdWhUsTc416quJAFaI5hT5yC', 'santri', 'trihandayaniwulandari'),
(NULL, '$2b$10$UBWzKMZIvUVz3FIm5dvej.JHFz6n98w9mTejq91IWd7UrD.rh5Lnu', 'santri', 'endangsusyanti'),
(NULL, '$2b$10$m64WA9abqzlDxyHWgBpfHe1djWcsFGLk1fXQVu3ZPdMTZSTywUfwS', 'santri', 'titinsupartini'),
(NULL, '$2b$10$33.oGW8mPzBBchgmLa/FPOO2frOgRftFy1qqgcS7SF3MQTDHZSLze', 'santri', 'yaniheryani'),
(NULL, '$2b$10$5iNCo0WWT6sOCRKtJnRP0.etVVbKgIL2zYj/UrUsgehNJ8QB6WlSG', 'santri', 'sitihasanah'),
(NULL, '$2b$10$x.90iCSRwd2U8bNsZl59AOhrXKMP2L8chCv/W6nII0PNaUuV5jWDK', 'santri', 'annadakamil'),
(NULL, '$2b$10$4VH7NSy7TPp.QuPaKvjhUu3HvAmRm73J.MZt47NAf1aUu5CPX8/B.', 'santri', 'fadilahamaliah'),
(NULL, '$2b$10$DPq8DLdHnXviKGqFdOb/kew.DD7KmWbWj9EZ64tkE.X.QEao.89oO', 'santri', 'heidypurnamasari'),
(NULL, '$2b$10$hgSjRZKu01C7ZzSo4iTcre0AMR00XlLHk0BE1TcBG6ujf61bqVLU2', 'santri', 'rinaratnawati'),
(NULL, '$2b$10$ZZLS1.wzCj/tn5WvdzNj4e1iSjcYtDsejbY/flAvBhEaGbo2/oska', 'santri', 'shintamaulana');

--tahsin online
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$.OT.MTWMJgEGLoB8wi4N5.euPGGwd7AN4Iar4xR0GYGSsi5.W7DVm', 'santri', 'apriana'),
(NULL, '$2b$10$VI0QpxUpnuWbmk.vs97z0u/ojcKUxPcr9dNM6yamJqLOMom73td2W', 'santri', 'nila'),
(NULL, '$2b$10$WzYp4nMW8o7MxZeaE6kl6.P5R9Om2Vz9PzJ99DPbgFDPMwvwQlI8i', 'santri', 'nia'),
(NULL, '$2b$10$tya0RCkGoHvvXhiqFC5mte5YdkLMiFkVA5nANLuRnhwaxtWkLRg96', 'santri', 'heni'),
(NULL, '$2b$10$eGiY2W0bYUHVgq0GUl/wv.BmcUEhoUPOisB1VMtnx4KEL7uehSZZe', 'santri', 'sitinuraeni'),
(NULL, '$2b$10$icF0UIG3J2TBv2dRGAVQdu5CV1/2Rkad2O6OfsDc9LZj288pM69xC', 'santri', 'sugih'),
(NULL, '$2b$10$3B6K7WtJy2R1QWxUuSHZyuApcj0crWco2Xps8pks/iNjia0I9eBN6', 'santri', 'indri'),
(NULL, '$2b$10$uY9cff0jE5He07Wu0jYFdOZtAmOAyZ8mnMW4l/9g5WVulx2Ep6wMu', 'santri', 'wardah'),
(NULL, '$2b$10$AHKftizxZcRKxVWfWmfLzeFEBqZEpYdgZ03cMfixrVJc.ZbR7kS76', 'santri', 'suhayati'),
(NULL, '$2b$10$e6pkHz4LNONS8vRL4ZRqP.4aDaBXpmreuzZoxSpOntPax3qsSBTBG', 'santri', 'tikasari'),
(NULL, '$2b$10$wn1xMAXKxfJJsX2c5umUi.kDeL4Zwb300tl8Rl8HZpkSRlU5XKU/u', 'santri', 'ikaagustina'),
(NULL, '$2b$10$ut538Ko42jjfn0P4VpZ1eeKvR0Bp8VOV.M7Q/ls6ITUQZFUipCD66', 'santri', 'atirohayati'),
(NULL, '$2b$10$R0y1qoioba5dKc0hJSdJV.QOtpUFSeAy1baR0Zfnyxkz.QLWzePeW', 'santri', 'novita'),
(NULL, '$2b$10$OO1S20mj0KdHmFOJuKJhPu//9UBb9KSJwoXohkarE/b61GimMfUHK', 'santri', 'afnah'),
(NULL, '$2b$10$5cel717KyXhm/OxDNFnVCexpBo8.oWDfAxmgi9rvkly3h6cylkX.i', 'santri', 'pupufauziyah'),
(NULL, '$2b$10$Wh3wmsr3QyBcVPecBz8Fveh8dOnK1GQwZLpq0V2Xr4u2Qr2Z0GuJa', 'santri', 'yusniah'),
(NULL, '$2b$10$3gOoEEvvCwyCq6tBrW2CLO25AVxZ7Rr2AmjnDglJgDMVvRgFEK53K', 'santri', 'maemunah'),
(NULL, '$2b$10$IkdR93eCIkokEl4ZiizMQObN2ERHknRRb8IsczLPmiY86t1HbxcSa', 'santri', 'mikecestisia'),
(NULL, '$2b$10$pnUnSOPYAUh23VFAtDEPrev8/5MxQNI6ct9qPY1ntmNnrshiC/O3.', 'santri', 'yusnita'),
(NULL, '$2b$10$52V1uAoEsv6yYi36/ejFj.ye.zsRMSAFaP5g9KXIyqZU0IbPfsMIu', 'santri', 'mardiah'),
(NULL, '$2b$10$bF3NevtaDcFrCw6xwRmfPubo0QQiDFrS3iiOPvw.RDPDQ9sVsSYei', 'santri', 'lilissopandi'),
(NULL, '$2b$10$EicBGYzioiG5H8luFwP3UOMOkazgRNWO0QFQY7vO2vnYQTiKIVUuS', 'santri', 'rinrinherlambang'),
(NULL, '$2b$10$./PpQaa8rFNH2vyASt1I/uMiBpTT9AxxS.3Nop5xJoGrZElHwx98K', 'santri', 'yuniarti'),
(NULL, '$2b$10$YgKoJQ85W9df8tIu7RlIteThsugMvEtR89E0uuy3uph4VWTL.WOuy', 'santri', 'adheulfa'),
(NULL, '$2b$10$O1gaHZ9Q1KSix2wZmIQwce8Srb68UEhBnz2ZJiW/N6S2T9HO6c6f.', 'santri', 'indrawati'),
(NULL, '$2b$10$ytwik4gj.ufB6B0Kph0ZZOhuGXeK9nrbH.49h1SbfHfuc4tcQt4Ie', 'santri', 'sricasrini'),
(NULL, '$2b$10$YBP.8YYmV3rsiZb.waAykOQ6spMQ5ogzMjYpZgQwZoxjdyOVYKI/W', 'santri', 'evihermawaningsih'),
(NULL, '$2b$10$JIko8qWXTviswvHd7R5QAeYB8q83563UMWJRk5F7f08E0XNXjoKeq', 'santri', 'ivashobihatulizzah'),
(NULL, '$2b$10$EmV.gogrfV9WksH8mr.VsuwTVRfoaPe1xx1VuxfTXras.HwPyLoEy', 'santri', 'nadashaffitri'),
(NULL, '$2b$10$tWZjNVrzWZ0SC/SzPIFAOulvqwqEobBwrixxQOA9hw/Iw/fvuqv4G', 'santri', 'wagirah'),
(NULL, '$2b$10$ncnrvtH.q9gdl4tJKQuBP.Ar.3.IftIhnZpHg/13M6vypMURDL1aq', 'santri', 'anggorobudiarysanti'),
(NULL, '$2b$10$6ehlXE.sr7tjGdtxrLf8IuvTgj1JQzOkSY/j9IWVCS1KHFZwahX5m', 'santri', 'andisukma'),
(NULL, '$2b$10$M0sxrP7ebuZcdCOYINvcwehP4SdcuPiCAarfDgNAuLbAcjUdXk5w.', 'santri', 'dewielfiani'),
(NULL, '$2b$10$YnB1fDLxJ1wB608gFwqKrOZTKf/7OXuy1u/157/QwANB6vzZAoL2a', 'santri', 'nurhayatinuri'),
(NULL, '$2b$10$5yp9bl8a6s11cNLADWng4.IIUUp4nKOYeS.IJVeKIk5ALLczfKLga', 'santri', 'titin'),
(NULL, '$2b$10$ZXSBmTI0MAIsPvyzGg9Su.Btr8zdC7mDX32ckIfajs9OQPlqvwtwK', 'santri', 'sutini'),
(NULL, '$2b$10$O5Pn2ZrKRCRSoB9NGWTfB.1szhnthSBnoAun9M.3mx5zzBLkNA5ra', 'santri', 'sridatun'),
(NULL, '$2b$10$RVt3aKw7tquqfCwVJnHTj.ZyoNEWUN1TiIDu7S7ho0eE8Pzhm4Hhe', 'santri', 'lukiandriana'),
(NULL, '$2b$10$yZibv9vwaHjQ0nsHlfpzl.j.fEduE4uRQU6DaQkF.1EPQHFXvmoFi', 'santri', 'desimiliarti'),
(NULL, '$2b$10$lSsXdfY.LaDsC.w5gmZW.OakPKpQpH/DvDVHc/V1/yvom6ag.QTzS', 'santri', 'shantymilani'),
(NULL, '$2b$10$nCX6YmiGiDZDZjHTnrCYa.IlwOUPaCyE5HV74qNIk92W.TZkf286.', 'santri', 'asriayulestari'),
(NULL, '$2b$10$XsE/XnS4KN2/dyaIljKgyOgbk4hhR3RaGt8rck4bWxBNEq4mO1xj2', 'santri', 'sekardwianti'),
(NULL, '$2b$10$gKLnDVp3YDC2pmkBVEY4fOO7Y9tewDVI9iE3m6sTUL1cNoD1aRRz2', 'santri', 'dinakhoirunisa'),
(NULL, '$2b$10$9zcMNo7AeqlXo.BBrtlr4uHMPT6p9pPBscSXCxQf.1VNbr2OZNJX2', 'santri', 'ilahnursilah'),
(NULL, '$2b$10$nUzrncxG2qVTzU/Yvqafx.NXE4PTjT9DSe25o/irTlEyb9bcUmSaG', 'santri', 'sitifatimah'),
(NULL, '$2b$10$plsCNSMUJ8KNp3b2Pa8NhO2dcbenznVv2OQs3wed6NfF/9eGvzg8e', 'santri', 'risdarasyida'),
(NULL, '$2b$10$XaIvEZvCwOn2nB64ZR2nPOsYMDXHkfKFTxTUw0/pimPvRa14grHXu', 'santri', 'rikaantika'),
(NULL, '$2b$10$CiwBUw2x0VZirJzZioehMeRRstAn2WEUxuxERKfPkeNyozEvd6o3C', 'santri', 'faizah'),
(NULL, '$2b$10$CjM//HBuC6jk3z7mCH1OI.4P87LRFKnRV0CsV2omIRKKTSiWQz50C', 'santri', 'rafitaramadhani');

--tahfidzh 
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$mOo51QlwcHWquIsxNGyzpe4OQntHnafiVOxFioCZJ0gFkDY3QSHSu', 'santri', 'ifat'),
(NULL, '$2b$10$szKneO1zJZ1i7WE8KNB4IOozL7XIn.qOiy4gWA/G0iILAj9A7HOFu', 'santri', 'fera'),
(NULL, '$2b$10$IHBy8e0F//3OfcWA.Dm8ueHm1Bysc3N50OM2wUy09mYOBB0YmORWa', 'santri', 'eka'),
(NULL, '$2b$10$ENS8st5RduzEqrQi4t/TFOjpQoLfaN1kKEil79qc7QZ.XzJ0Ff94q', 'santri', 'dewimulyani'),
(NULL, '$2b$10$tKwpArl6sIIOhea51UUYfer8rJlBy87rhQs6wMcf55MmEPNu.wVuG', 'santri', 'dewikartika'),
(NULL, '$2b$10$xad4Di/9hYAgd9jQNI0b1ulTu5lBsbd2UB45o8Txh8sorSo6.sSHS', 'santri', 'netty'),
(NULL, '$2b$10$Ufkyq2VtY/mvCjIk5K55Buw2XQaDvZVgryeQ2wQBuUdFMMti9n7Jy', 'santri', 'atikwahyuni'),
(NULL, '$2b$10$Wv2USkBsk2OYg9CyJar1be5dt0bSoM2x6ACQTHkeOQHxjwJirh.le', 'santri', 'kusemah'),
(NULL, '$2b$10$yVuTsaR/vI0Fw0nkUgx40Oo.03mJ1BqEmcNPfrJygUjzmXgcoNEuu', 'santri', 'nurhilah'),
(NULL, '$2b$10$9Mi0zF1ZlVTLvcAEXTRJJelKYX3d8atQc2l.goiNAOecpNfigaKFq', 'santri', 'romana'),
(NULL, '$2b$10$9cT769/4GUHEoWVnmjUnZ.aR69CL7TZZwAl1sbaaTSNzvgmpoZyIi', 'santri', 'rubedodirahayu'),
(NULL, '$2b$10$aHF7DmeaeUDnbEEx6dAkr.4Sb1bpHw18C59YPzKQkoMUs5992AWlq', 'santri', 'savitriambarukmi'),
(NULL, '$2b$10$Bq/kKr2RtuKs1nYwzt5kV.a1bfrkLVkJakhJV/C4NeDcxn8sYQhVu', 'santri', 'anisairawati'),
(NULL, '$2b$10$rQu6vyWkKaZtUPJ2kVo4tuvA2ykLkH.5Ltp8eSgJICQ1/J04cIJq.', 'santri', 'liarosa'),
(NULL, '$2b$10$mPaxfb.07K2fXDQj/D3uxuNfC/RJg.x.XUgGiyWJpmlJYFWEhAwpq', 'santri', 'dewisetyarini'),
(NULL, '$2b$10$pOdhlCADgXBvnn5i84weuutmNGbWvkWpQQ79Q85aCS2TmF805YKn2', 'santri', 'mafruhah'),
(NULL, '$2b$10$8RmNZfrPEcQ3RoWKdspfr.i624opqI5TgtV6Eu05S8oqHYvuJCMly', 'santri', 'yenimulyanidewi'),
(NULL, '$2b$10$Qe.pKU5f2Gfd0AwrUdtJeundU45oKrZEkbnCYoVM6yMMuOAJ9ois2', 'santri', 'dewiwahyunimarlinadia'),
(NULL, '$2b$10$xrJJudxR3RAcZrrpP7SPU.DvVCn.rSGwQpSRdfJpiuZ6gIGDSQIXu', 'santri', 'tutianissa'),
(NULL, '$2b$10$Usqp6wE/FLA/KGABHkIcr.vijP1vID3B8bHbL0O72ATwqpMix7VEW', 'santri', 'rosidawardani'),
(NULL, '$2b$10$DxKMefrTS45hwhEV3Aate.NVsV3YfUD.D/CiCEQgEfw8LO29GO1i.', 'santri', 'enisundawati'),
(NULL, '$2b$10$wo8WyZI8bOKjB.AcSYGtt.YTIel5O6KJ8QySMrkKStOhJ4dQnZBp.', 'santri', 'suciati'),
(NULL, '$2b$10$4rziJhASxEbi0ZZl948AFOKZABB8MqOQG7RdLHQhRgGksnncEjDrK', 'santri', 'diahiswandari'),
(NULL, '$2b$10$pL82zCP6C7VOUiztjtkrm.LwKfFXKErsw72hldlYreG1OiIaBPoru', 'santri', 'henisumarni'),
(NULL, '$2b$10$xuE2XHRHcYXqBubiumVsXeVs6UribU0M1DPfpCdVba2BIsz0DNenS', 'santri', 'martini'),
(NULL, '$2b$10$6PtMfF..77k6qpocfaS0ee494vSTyjhucXWjFC7MFF/rR.h952bSe', 'santri', 'yani'),
(NULL, '$2b$10$NUz5Ij2pHjWIK1msQL9vtuaWKA4uBlNGZt4sWiseaKA/YE3WFpM7e', 'santri', 'fitrihandayani'),
(NULL, '$2b$10$nfVpz627TDiWIWfOVZdEP.cwGAow4mf9.Py661zusvkJbimQembHG', 'santri', 'estinurasih'),
(NULL, '$2b$10$zeYj6r7h8vpMpfYPpLOM2O.JDh92y5yhX0JLn0RjznqzFW6okuJba', 'santri', 'fidamuyassaroh'),
(NULL, '$2b$10$Tn0RyasHlbOtY1wEmw8A4.Xa7maghzE7bFifBOq7zJG2LqZfAX.jS', 'santri', 'lismaryatun'),
(NULL, '$2b$10$KPHnnUetPXufYPqUU5G0iOoSteQjOtgiyXRZ011InRMZEovekB6uK', 'santri', 'indahnisafauziah'),
(NULL, '$2b$10$PeERWSJA8Rj2HwSkDd50I.IVPOGQ2xKtwYQV.7US20ZN0dwckbf.2', 'santri', 'nurulhairulnisa'),
(NULL, '$2b$10$u8SUwTxDqnFFQbGc9Y.kRugroHIoj1ca0lYXVoYcUQG0s71JAcsI2', 'santri', 'alma'),
(NULL, '$2b$10$6Zgci0ar6c8xcC1ByP/MJO/cULIZUC3uzEJWc6F5dvGBk2akMSvIq', 'santri', 'nura'),
(NULL, '$2b$10$ycFEkiG8FEqiVJRAQI1Vo.Bb/0rwJmBavuTW0At93eLnLTLEvgSam', 'santri', 'rosyadah'),
(NULL, '$2b$10$9u7pAxREsLEA641Nnl3WY.FIp1WcV..PnNpHMbLT4F895aeGjm9EG', 'santri', 'rita'),
(NULL, '$2b$10$Db9YAXe9sNi93G8YzfIRBOVL/LiRAo29VBHM9B/tAsQOvxN.DJFRS', 'santri', 'neldawati'),
(NULL, '$2b$10$8FKG.yiykbpSP75PUZlp8.OlxaDOc4n28AcZ2GErGSwKsx9eVbshe', 'santri', 'nurhikmah'),
(NULL, '$2b$10$ykr6qCwXjkzYxIZ48jMkMO5oBA0qrqJEImi9ACWxibX7VlSV7Qkhq', 'santri', 'wahyuningsih'),
(NULL, '$2b$10$2ahEhDOFMw/PnkRksAdvze0Ew8KLWJR5ortP/Qrgj3/jsL6RyhAJS', 'santri', 'yatisuryati'),
(NULL, '$2b$10$d3p.Mt/7x63OlnwC6aHENuzHBqQEeRWceu85V2HO9nqTCpEdHIyvK', 'santri', 'astrykartikasari'),
(NULL, '$2b$10$NxU6ayf/6nmjz5iM0IfYLOh24VLwMCIp2KsQ8m1l1Chdq3FdajxAe', 'santri', 'ziyadatulrofita'),
(NULL, '$2b$10$WVwPWwPKfq2K3i87DDYrUuMZDvFnnj1HaqDRvq/RrwSpVWiTWSWMG', 'santri', 'tutia'),
(NULL, '$2b$10$zkDnQk2ql33.5w9U29dUUuGcLoBW8cKT0rWeY1xaEoO4r5pDlMoZW', 'santri', 'nunung'),
(NULL, '$2b$10$Ys.hO1hkwnIZcG1vh8maKOqxiQAJz232hxX/hrb0hhIsqSExChKJS', 'santri', 'nazzariazkailyas');

--tilawah
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$KJug3IcJGRoWsVfCQ/OBleK.z3fE1dLlMsGMRt9Fa4k8x8eXRkzL.', 'santri', 'ifat'),
(NULL, '$2b$10$0KJa28Ofz58Hsxr/n0ij.uTi8OhvEfwHTWgMjEC/aRdPtXxloPOuS', 'santri', 'fera'),
(NULL, '$2b$10$Rzodo02Y1/FGBdB8CGzG6eSt7lnjvBc18tcfsBVtGX09ArDsuQMIu', 'santri', 'eka'),
(NULL, '$2b$10$I41lsGs2TxZ6NOH8Tuj40esW0p603xWIUZ5G89kaKmmtb2CQEtAzS', 'santri', 'dewimulyani'),
(NULL, '$2b$10$9k3ivMrfzgI7yVBdp5aV5OzqZcLZEkuV9PFexC4H9uYVG4tEfPUlm', 'santri', 'dewikartika'),
(NULL, '$2b$10$SU.AYzhLfnEJAAl8xcHvTesg36ZBsf7G4QBD6p11L9HqeWCWJXf8y', 'santri', 'netty'),
(NULL, '$2b$10$SOMTSVRWRakKWZnUelVpfubrUJFrqusdpsImG9Huspe3QWVOnpOvG', 'santri', 'atikwahyuni'),
(NULL, '$2b$10$Fe1p2BCPqAg0t8Ozl1gdreLN.r0z8vcCtJxr1K3rKCjPNceauazGa', 'santri', 'kusemah'),
(NULL, '$2b$10$j4MBidh0O4R9F14gVI1WwuIx9.Hzxz/vCFtdByOGUg2hzzpeZj9Lu', 'santri', 'nurhilah'),
(NULL, '$2b$10$33LguYjlWX5o8GwKuiSyi.ooy1Ti4PnfFxt.YaupUvbNkQ/N74buK', 'santri', 'romana'),
(NULL, '$2b$10$7JBU78SkxT7HnD0lggPipunjbd.VbPesCLwrJIw4rhrekn/53Qki.', 'santri', 'rubedodirahayu'),
(NULL, '$2b$10$0ePqSNEmob6kqGj7eN8PpukM0j89InVcyxnCBUDL2UR4FHTYLFHJK', 'santri', 'savitriambarukmi'),
(NULL, '$2b$10$3vCJRVjNoyvWiJpzC7CNHe0LJIgVAgOrMFWyo4etO7teZRg1ZN16m', 'santri', 'anisairawati'),
(NULL, '$2b$10$/4rI206Iun7.zXZu8dcomOSS0TXJWFUDd8PlZouHQ8S4q.aiR.zZ2', 'santri', 'liarosa'),
(NULL, '$2b$10$X.ZdFqgtgNmhn7pzAik5UuJ4ZrFOtfyEAWKHdK3/hHEKKZcmW96iG', 'santri', 'dewisetyarini'),
(NULL, '$2b$10$pvY0U3iS4eY3Q3QTBwLZk.CYAIkP7MvNRulDlzDgxkX00tS8yA6ti', 'santri', 'mafruhah'),
(NULL, '$2b$10$z9DIzw3Rm0BTvXTMttB4R.QymnNj0yV4N9nfIPgCrfoqv/MFVHOAu', 'santri', 'yenimulyanidewi'),
(NULL, '$2b$10$sPOQRn/I6YbwKKkc.6C4MuLTcoQW/ZBTUID6nhZg24OzjaTcnsrQG', 'santri', 'dewiwahyunimarlinadia'),
(NULL, '$2b$10$Nya13IRF7P0EmW8zbwqwVOwkZTr9iGd5/K.Bh/P91yCs8gvb.g0EO', 'santri', 'tutianissa'),
(NULL, '$2b$10$U8DOblYUo5sM77YavI6Xn.f4i5SU7Xy5T0jvcpmb9dYTGGaN6l..6', 'santri', 'rosidawardani'),
(NULL, '$2b$10$.m8pLg16RfqNfrh.7pkP2u1VndZPPbkrJLmzuzq6O0t.qDTXdodfG', 'santri', 'enisundawati'),
(NULL, '$2b$10$AEkgsiA5/tPaYWZhZZJJFuwC3IMnVurVe/LaEWUaWWUubRGxykR7C', 'santri', 'suciati'),
(NULL, '$2b$10$vjIqPtogaveJfJgXzXbjUeVsXPNSvKTNVFTjMTGGLN9dTGoSRJPuy', 'santri', 'diahiswandari'),
(NULL, '$2b$10$GfRcF6mLRDsASNYI05Uc5.yCtPpe1Lh19wxexQ0qxatRakCUeUqKu', 'santri', 'henisumarni'),
(NULL, '$2b$10$ctoa1ifaevxpa/e3wOAA6eML5qHrNl527j/iwyvqV218K6omrZrmS', 'santri', 'martini'),
(NULL, '$2b$10$I7dTeOrg8oQyKpZUrjZr/OOz/E3CWboQcjiyhewyZRQzUbZE/kfUW', 'santri', 'yani'),
(NULL, '$2b$10$upD1rc3fj/hfB3WD4qtTh.knF09W1xFK/aLER.e/uEIupHyK8bd0q', 'santri', 'fitrihandayani'),
(NULL, '$2b$10$SY4817OYvy7BVCwprKgBku2Cgj/KTw4wdvPz0LgcZqvR1E24YunT6', 'santri', 'oktalusiningsih'),
(NULL, '$2b$10$Lo9E/v0lKcO/2dtXkfygauQn/ynJuYXJD1tv6gHCiWU5VcsdkXztq', 'santri', 'estinurasih'),
(NULL, '$2b$10$6I25/s.zR96Wuethh13EP.FHQKDQGVxPF1tDHLRLaCBrJDnBqB9zC', 'santri', 'fidamuyassaroh'),
(NULL, '$2b$10$yiPruSDFixr6YfEYQR4QmOotM6mA3eoq2bJb3wlf6Ci6vDpks8QsK', 'santri', 'lismaryatun'),
(NULL, '$2b$10$UqShe1figv//jgzLNIKXoObP.KzPlm9ejzLn.aC4AOmZDGfbKnWlW', 'santri', 'indahnisafauziah'),
(NULL, '$2b$10$0EE8XqCHOS06W0.uwl6awevl.Uom0D3YWCPGQjyTWOFXpdKtUG/SC', 'santri', 'nurulhairulnisa'),
(NULL, '$2b$10$qL6Y.v.cRCEKyJWApdIuNuh6qVjOzvHd2jYpr43/BQc/.2QPzL5YC', 'santri', 'alma'),
(NULL, '$2b$10$BBVff9jYN0eDKOTzhZVLZ.X92dnY3l4BOkD0pw7hKwyC3AsvLPU/W', 'santri', 'nura'),
(NULL, '$2b$10$GwrV7jiL73TTyLjp6bInh.B.SeiAfCpKBWuaf64a45MzrT4WZD8Qu', 'santri', 'rosyadah'),
(NULL, '$2b$10$SLAoNtiI2kjLkl8mtDOITeXNLR9xiBMbvsW6JcYQGrZcbPjDJwEfa', 'santri', 'rita'),
(NULL, '$2b$10$rdrnuBhtQAiLCRPIQXPu4.s3xQesp0KzH2xq0fEzQHgl2B5smckEm', 'santri', 'neldawati'),
(NULL, '$2b$10$XccY9jjNtQeXVLMAw1gW4OpCQ8cxeKzo9byyIwMrAHrCCYm9EAXbO', 'santri', 'nurhikmah'),
(NULL, '$2b$10$jUY4AAovnBte4W5IRa1EkOQeJrDxzFX.Zfw6038DBPhk4999YMNtK', 'santri', 'wahyuningsih'),
(NULL, '$2b$10$cswSDvV3CZqH.9t1DsgC3eqmGoR2.YIjaWMj3j0Xi2cnl2f2RhqNe', 'santri', 'yatisuryati'),
(NULL, '$2b$10$zev2JCrYtrJbSGQncat8RuiwFW48f5mHMvYercfPmxWrlYe2Cih0a', 'santri', 'astrykartikasari'),
(NULL, '$2b$10$qiJzzy2yLvAFJiELPI2.HOdMUzOJz7jOAoMVLOJACtGnVgd/cejXq', 'santri', 'ziyadatulrofita'),
(NULL, '$2b$10$WiswKOpoI8iSe1JfO9jv7euNnsgtZLSnGSSNDknqpi.dDmXCo9loa', 'santri', 'tutia'),
(NULL, '$2b$10$Wcre371z70rp8rLB0f6Hb.GcrvpMfKwotMdsVRjIXVHX2m3SRRYuK', 'santri', 'nunung'),
(NULL, '$2b$10$FHgCUcxps0Zg6886PtkDFu4JfptnknodZx0ZL5pGxbxs/si0UdIK2', 'santri', 'nazzariazkailyas');

--anak
INSERT INTO users (email, password_hash, role, username) VALUES
(NULL, '$2b$10$J4/ddn.TfBFWKd.rxFT.P.spUAL82At4t/tT.ZqB0VZOtNs085YSu', 'santri', 'aafiyah'),
(NULL, '$2b$10$jHS.CLo2tyUiXla0jE6.buiuSW1E2diFtZPaagc4uDwhIPzikTW4y', 'santri', 'adivaazalea'),
(NULL, '$2b$10$paa66Vm3Ji5lG2ZP5gXYyuCeH3fNiDhV6jnsK3Qpl3BYKGZ3tznMC', 'santri', 'anduizazrahensyah'),
(NULL, '$2b$10$K5.Za10FzvqsuSo2dvKsN.wbE1OGqUEBYCg93QBUvsScRR8/LEeBa', 'santri', 'insyirafauzia'),
(NULL, '$2b$10$dIC/yu7QVVEcfV8pjxmoaegNQWamWPHqgeyROSX9u9bgC8AINVdrO', 'santri', 'mzaidabdurahman'),
(NULL, '$2b$10$nxCFOVNE/MSSNxTYC8p9QOkd6LlvdqEQNEnUM6PBPKgg.8LxiKunO', 'santri', 'nabilaadeliareva'),
(NULL, '$2b$10$/qLwKBXkEgdHpH7Qj4QWwuKV7MzIIQcuJ.bvWMUh4mcH112aW1Qfa', 'santri', 'naylacalystairwanto'),
(NULL, '$2b$10$lTnTP2TUVJ5fPQFjGBwq0.wUnG52Ii1z6vwDV008sSRcqrPKwo.iS', 'santri', 'rainadwimaheswari'),
(NULL, '$2b$10$PLlbP93QwNApCqJjX3ukjOEHJbW8UBzXsRfQTKjXFZsz2OF56rajS', 'santri', 'ammaryazid'),
(NULL, '$2b$10$I5S9dHadzyeJfqRMjdrlc.kHdJU/iw1XG0jjhnaj.Mf7LvXdVVbz6', 'santri', 'arsyadtaqiyaalgham'),
(NULL, '$2b$10$akHjbHlhS5T/y6eiw1/E7.A9RL3V4IcSFPeJZM.tcx5ulOX2yuerq', 'santri', 'daffapratama'),
(NULL, '$2b$10$P3qiJIRWiigL3W58K20pCeSbsjhZP3RXxBbVSRBR36x3ijPLrOnFK', 'santri', 'inarasyulahanunnah'),
(NULL, '$2b$10$kSUWgjRZuvBdSPqH/J5cKuFEUBojPGIyH.zi.3xoPBYag96vAWRUW', 'santri', 'keinandrarafifathariz'),
(NULL, '$2b$10$ggi/dsiOBBtlCSwi1yP8sO/1yi6UkXAz39GPnePHcmcM4a/RBUc0y', 'santri', 'mbilalramadhan'),
(NULL, '$2b$10$9IVFzHdS7.ZNoTr8K7rO9.oWETxCoUuMD0to6Up9IJErKIkb2Bdvm', 'santri', 'shofiyyah'),
(NULL, '$2b$10$o7bdd.ggcvU/3A9R3DYGrOUgftstdlGvErn8snrSkYajeh/K3EV92', 'santri', 'violaviloniazayyan'),
(NULL, '$2b$10$k.HMN62gR3MnL1GlPbJWBODqjswF/YqGiVHn7oOelJQhRO4H4V6ZS', 'santri', 'aahgahaneefalfarizi'),
(NULL, '$2b$10$RTDjBbYEcJOWmon6bRhKauOSjQWDeCc8jRfsVo2Qzrv0/1tihEPU6', 'santri', 'alfarabifarzan'),
(NULL, '$2b$10$1YSz9lo3E4l8jyMkBINIZepsJCy/owSkwc.ve69iaauRX8QzXAlbS', 'santri', 'alesha'),
(NULL, '$2b$10$GC5NHsR7TFnUdLHMVHq0Ye.SA9YM0aFg49kGccp8UyXCo.jaj9/vu', 'santri', 'alviano'),
(NULL, '$2b$10$D7ItT2k6byacL9aGi7HxVuMijz/VBbZqG11TACksy.n6GX1wsWynG', 'santri', 'athallaharshadabhinayya'),
(NULL, '$2b$10$.8A1c3smIBoV31QyLzkqcu4R2RvyDE.WQjc7QpnXPG.xBZauWAiCy', 'santri', 'baruna'),
(NULL, '$2b$10$vn/qHsH3R2EhTNoQ5jRRNu/9njaXi9daxRQiN/fdHsQU6QoqdwtCe', 'santri', 'langitarshakarafif'),
(NULL, '$2b$10$J3AOPgZlJRp44jtOqPyW/uVH7d3ceFiKjK/motBljrRMt6jkfiKwW', 'santri', 'mafdhalsholah'),
(NULL, '$2b$10$nEZuOlub1fSoOa69SYnO/Om1i5hWDU.tFsfHRNg2ui2hsGzslXd3a', 'santri', 'maktarrifki'),
(NULL, '$2b$10$TGB5Q8ySw3qtA86cbGJ6Le0ASNvJCsOlio8VqWHINiZsav28y5BKW', 'santri', 'mfaqihazzami'),
(NULL, '$2b$10$zpR/7h1r1r7L1E1LwrPpp.KhQ6uGUzp5FkptLuy04XcAbl6u1Umye', 'santri', 'muhammadafnannafi'),
(NULL, '$2b$10$horpJDOpnRAiS/r/e4MfFOfCntkt2Fye1vruzitQ3zSnzHPmhooxO', 'santri', 'nizaynadzriel'),
(NULL, '$2b$10$8FVhK80mnp0wlXUkhVZho.lfAf6rkICnYZKRkNBlY0AXFdlqKmYQS', 'santri', 'sitinurafifah'),
(NULL, '$2b$10$6iBX6x/lmSk3U3tGVRROOuVtcRsl01eZQw1ZJOOE8aDpIj/AshmtC', 'santri', 'sulaimanhuseinallatif'),
(NULL, '$2b$10$wyQjhcAzkAipVATYNn1xEe6fnJL7DnFxKWUR0RcnPWzGwL41gJMLq', 'santri', 'utsmani1'),
(NULL, '$2b$10$5/T3DHWIgIKxfyAlV1USh.tIukg7DQMnCD1LlCtE7GJPUZHobntGm', 'santri', 'alyashakilaazzahra'),
(NULL, '$2b$10$RCZ3DAQsI2ZEYklrewGFeuz2Br4XddI09hfL3zvmVDkGQPrKJ3TPC', 'santri', 'ammaralfariq'),
(NULL, '$2b$10$Rcm5FIHJZ4uCQxB0dfUmgesBHjnTFq28Ig26tZicy1xktOxonb/Ne', 'santri', 'aninditafa'),
(NULL, '$2b$10$lRGUhhNMoKxlwulOc4rFyeHGRD.IhtpN581TF1UPwoYvKZcVW4Jf2', 'santri', 'anindya'),
(NULL, '$2b$10$thkPkXYWgyTHOu6J9ymUi.ggli96iAj70jxi6W6mDHTrYQL2bKFuK', 'santri', 'aqil'),
(NULL, '$2b$10$iso2Ta9fBdyxWzHbnFGh4ee6FLmJ1BwV99HRAUUz1vTxDxKdJELcm', 'santri', 'arsyilahumairaqaireen'),
(NULL, '$2b$10$sLzvN.o8dONxLdV/C7Xwk.G2TeUQ4bJso2LkEHdfWUz5SD6btgZTq', 'santri', 'carissazahraputri'),
(NULL, '$2b$10$NOPb6ouoGGGoEXHcxHZEmeS5q.T8sYbdaHbBNwERsNHXNqJ06P8pe', 'santri', 'elfahrezaankarianhalim'),
(NULL, '$2b$10$yEWxAbdeWwRH/i631XNVYug6dQna694I69ytnO57i4I6G26xenEwu', 'santri', 'fildzasafamufidah'),
(NULL, '$2b$10$LOCNl9NIkGY7/EByMKTJd.Y6zMUZkbCqxOjSTiyz2Rwd7Psv8Zaq2', 'santri', 'kimimelaajenginara'),
(NULL, '$2b$10$CzWEyIIbck8J.aGSPqQ2KeoF61u9U8t.zsyrFrAT3HFHvaFb0VnOq', 'santri', 'makhtaralfaith'),
(NULL, '$2b$10$GdQnWukZovgvYDEn6lue0.1DR5ohrGz0LQeqOg5ss7bUpRKIK/cLW', 'santri', 'maltair'),
(NULL, '$2b$10$9TqkiFtaEtW9FvXouUALt.4WXp9ZyNR3O2hfeESbxihmGw8Gl/ZSa', 'santri', 'mahiskenukeanandhita'),
(NULL, '$2b$10$bLKtPhr0mmxfrXrMmeVsU.gZP3D3fWQkrlDKkSNCz0m16RrZ0Ygs.', 'santri', 'muhammadalayyubi'),
(NULL, '$2b$10$Comu8SRbFEKVLwR.EltQjutEyzb8IZOYRWhHIjSgwu7YtxkZDzSjO', 'santri', 'nadineazzahra'),
(NULL, '$2b$10$JdVEHAarJUzGPrVemQs5YeRH9bTXpNAOtstW2MpR3ZdW4KyGc6RPC', 'santri', 'nidaaidazahra'),
(NULL, '$2b$10$AaccL/im8l.WEDuRBlfT7uY5B9yHmW5cV943bPNZF8Dt1DOr0HqYe', 'santri', 'nizammhafiz'),
(NULL, '$2b$10$VEM9tkclga4Ur4jotGdyqOVEvJ8vhD5ks.ZCPdPU1LXFbQ8zOzvni', 'santri', 'onad'),
(NULL, '$2b$10$BdtyQDz1DZ0dnIOiBaJ9wO3keOSk8J3DmebXGka7h3Mu9XY4csxUa', 'santri', 'rafasyahamizanturnadi'),
(NULL, '$2b$10$F9YtyAWs7cPruzny1EQBI.C.0QUXSv4FXJ6kkoEUZC6gEwAWfZeue', 'santri', 'ruqoyasurayya'),
(NULL, '$2b$10$Pxhw5GVGAyHZ1EhrMhCBSOblf9/2nGeGdOv9Oh/mR2be1DGjSqFaG', 'santri', 'teukumuhammadraffi'),
(NULL, '$2b$10$VzsiA35BL2ug2e3iMXRZlO/iwiR/kWL86lREDI75m9R4PZRSG37/y', 'santri', 'uwaisalfajri'),
(NULL, '$2b$10$HZ.IpIZ4T8SIsN7YUWRCdu6Q.ghyhdJAELwtMkLgWTUtnRsoJw16e', 'santri', 'abdielbelvanugraha'),
(NULL, '$2b$10$HZNcA.Jg4J.RYMrAIdow3.zv1RNzkAQyMYTIDgV/aZ/dRs5ATRwem', 'santri', 'dannisnaratungga'),
(NULL, '$2b$10$qdHkYte.z3SKmbmm6lILPOHZXmKTGmjZ2bsGxj1NmdEZCZXPfMqS2', 'santri', 'devitan'),
(NULL, '$2b$10$tm7189UeGWE.aU7aFs45WOdMbUisRmHoRvSBMrPfn9bwromhKIIVy', 'santri', 'faithsujaathallah'),
(NULL, '$2b$10$CoBowG1mrML6Zd1yMl0kx.5cDnZkikGqUN2m4QicL47VaiR1zSa/i', 'santri', 'falihhafuza'),
(NULL, '$2b$10$Cut5N/VK0CwiAFnbKEhVruxuMSMrUysl31VwTXBcU5wvHleIjfysK', 'santri', 'fatiyyahasnaizzati'),
(NULL, '$2b$10$bHHKJSxcOkioT/oRY5VfDObG9QpM73MtW0MMXmqlLNdMM0H4EGx4W', 'santri', 'freyanafiazuhayra'),
(NULL, '$2b$10$sKFUCt9pWLK95yoxwUMuNOhV3MGBjcmLjP5cXKScyrYkjFPhhFFaG', 'santri', 'kenzorasyaaditya'),
(NULL, '$2b$10$Fb4rJ1Yqu308xmQ2dStzbeYtnX9rkTKeKp30heS9QV.5YIyS3WLeO', 'santri', 'lativaadelia'),
(NULL, '$2b$10$YuBduI16Af.X7pKcv2raEO7KpzOngajQoS3K.RR1vJ7XPa2zjWVJu', 'santri', 'maryazuhdi'),
(NULL, '$2b$10$T0l4grPAB9IXfX9mNiGgN.j2U8Yk1Ao7U13JZRnQfMrTslQ7ZJOqW', 'santri', 'mfahrezihasan'),
(NULL, '$2b$10$CEoxaHojPhvQbiRD2rpfZ.yihrN4bfhaIM8AqUX948/WYDlsJA.nS', 'santri', 'mkenzie'),
(NULL, '$2b$10$6RGStH6wKoKI3EgTjrV1/OROkJ4yfEffhvactXncBFuLsitKRnmFy', 'santri', 'mnathanzulfikar'),
(NULL, '$2b$10$z/MVVZ0gW/FthQoY4l90/uE7/vpKgtVuq3v6CwaPoHu6SEbDZNgSi', 'santri', 'mramdhanialrizky'),
(NULL, '$2b$10$JrpTH86nQx1BdRbAmQJ.9ubjr/jWZvvBSNK5hyLkKRp/x.TKwX13a', 'santri', 'mrasydan'),
(NULL, '$2b$10$PUBl2.c8j755WOLwijTZS.L8PoEktadP3Gt1jNXU3KHDhlqdm3XxW', 'santri', 'maysyaputriartanti'),
(NULL, '$2b$10$bYj9eCEQzeZCLaxPMgs99u.mOTV/.SDyJJ9W5ZgghHZawg./RrrL6', 'santri', 'nadiayasminkurniawan'),
(NULL, '$2b$10$VKsFI1T7LSZA/Re89OAVd.fUdagSNuRq9djxE7fHWm/B0kI7SjM.a', 'santri', 'nizamnurfadhiistiyarto'),
(NULL, '$2b$10$kSdFgQ0.oIl8Y5p2OkZGJOHgDw.WRaQ/.GKVcbVwFtdeL5SzMQPZu', 'santri', 'safaraznaufalghani'),
(NULL, '$2b$10$zwhYVfe673i7aG5viF7B3eEL90GiMaG17j0Bb9Cy10R1/z1fpDpDe', 'santri', 'shaquiledavinaharyoko'),
(NULL, '$2b$10$T.g56dO7HUSg0FpV.wpghO0bSOwUZY/HZV9bG9mZGUdzM35WeCRhS', 'santri', 'syafiaadiaa'),
(NULL, '$2b$10$sky3xLcGe9IwSR1roxItn.xU4k3KNQ/BwuQA4jz/LauftpjhUV8lS', 'santri', 'umamahhanunmuthmainnah');

INSERT INTO program (nama_program, deskripsi) VALUES
('TQ1', 'Tahsin Quran Level 1'),
('TQ2', 'Tahsin Quran Level 2'),
('TQ3', 'Tahsin Quran Level 3'),
('Tahsin Umum', 'Tahsin umum reguler dan online'),
('Tahfizh', 'Program hafalan Al-Quran'),
('Tilawah/PTL', 'Progres Tilawah Lanjut');
