-- Insert initial data
INSERT INTO peserta (id, nama, email, nomor_handphone) VALUES
    ('c7a6d34f-31f1-4d5c-8d74-4f80fc1acb13', 'Ali Rahman', 'ali@example.com', '08123456789'),
    ('a239f58b-0acb-4ff2-8b1e-b3326b1fce8b', 'Siti Aisyah', 'aisyah@example.com', '08198765432');

INSERT INTO pengajar (id, nama, email, nomor_handphone) VALUES
    ('e5428c57-fc3b-4f9e-bf0d-1f44b3ff5db7', 'Ustadz Ahmad', 'ustadzahmad@example.com', '08234567890'),
    ('7f62ff5e-506e-4978-b510-4b6b6e543b52', 'Ustadzah Fatimah', 'ustadzahfatimah@example.com', '08298765431');

INSERT INTO kurikulum (id, kode, nama, aktif) VALUES
    ('d1e93862-25f2-4adf-9f71-0e9600cc28db', 'KUR001', 'Kurikulum Tahfidz', TRUE),
    ('4b1b70a1-b5ed-49a2-915e-b8a74891f5b9', 'KUR002', 'Kurikulum Fiqih', TRUE);

INSERT INTO mata_pelajaran (id, id_kurikulum, kode, nama, aktif) VALUES
    ('99e7ab35-0bb7-46ef-98f6-4ea3d9e6b348', 'd1e93862-25f2-4adf-9f71-0e9600cc28db', 'MP001', 'Hafalan Quran', TRUE),
    ('be8a7f82-5160-4967-b274-7be3c72d8987', '4b1b70a1-b5ed-49a2-915e-b8a74891f5b9', 'MP002', 'Fiqih Dasar', TRUE);

INSERT INTO ujian (id, id_mata_pelajaran, nama_ujian) VALUES
    ('a1e2b3c4-d5f6-7890-abcd-ef1234567890', '99e7ab35-0bb7-46ef-98f6-4ea3d9e6b348', 'Ujian Hafalan Quran'),
    ('b2c3d4e5-f678-9012-abcd-ef2345678901', 'be8a7f82-5160-4967-b274-7be3c72d8987', 'Ujian Fiqih Dasar');

INSERT INTO sesi_ujian (id, id_ujian, waktu_mulai, waktu_selesai) VALUES
    ('sesi-01', 'a1e2b3c4-d5f6-7890-abcd-ef1234567890', '2025-03-01 08:00:00', '2025-03-01 10:00:00'),
    ('sesi-02', 'b2c3d4e5-f678-9012-abcd-ef2345678901', '2025-03-02 09:00:00', '2025-03-02 11:00:00');

INSERT INTO kelas (id, id_mata_pelajaran, id_pengajar, nama, hari, waktu_mulai, waktu_selesai) VALUES
    ('8c586ee9-31ac-4f9d-821e-0ad4c21e4381', '99e7ab35-0bb7-46ef-98f6-4ea3d9e6b348', 'e5428c57-fc3b-4f9e-bf0d-1f44b3ff5db7', 'Kelas Tahfidz 1', 'SENIN', '08:00:00', '09:30:00'),
    ('e6cb1d83-6c96-4635-b4f9-5c43b85e6db0', 'be8a7f82-5160-4967-b274-7be3c72d8987', '7f62ff5e-506e-4978-b510-4b6b6e543b52', 'Kelas Fiqih 1', 'RABU', '10:00:00', '11:30:00');

INSERT INTO peserta_kelas (id_peserta, id_kelas) VALUES
    ('c7a6d34f-31f1-4d5c-8d74-4f80fc1acb13', '8c586ee9-31ac-4f9d-821e-0ad4c21e4381'),
    ('a239f58b-0acb-4ff2-8b1e-b3326b1fce8b', 'e6cb1d83-6c96-4635-b4f9-5c43b85e6db0');

INSERT INTO sesi_belajar (id, id_kelas, waktu_mulai, waktu_selesai, isi_pelajaran) VALUES
    ('b0ecb462-d11f-482b-84fa-d436268adfc6', '8c586ee9-31ac-4f9d-821e-0ad4c21e4381', '2025-01-06 08:00:00', '2025-01-06 09:30:00', 'Surah Al-Baqarah Ayat 1-10'),
    ('43db31c5-d72b-4fe6-b5a2-220b3d395a66', 'e6cb1d83-6c96-4635-b4f9-5c43b85e6db0', '2025-01-08 10:00:00', '2025-01-08 11:30:00', 'Pembahasan Wudhu dan Shalat');

INSERT INTO event (id, nama, waktu_kegiatan_rencana, waktu_kegiatan_realisasi, catatan_acara) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'Kajian Tafsir Al-Quran', '2025-03-10 09:00:00', NULL, 'Kajian rutin setiap bulan'),
    ('223e4567-e89b-12d3-a456-426614174001', 'Pelatihan Tajwid', '2025-04-15 14:00:00', '2025-04-15 14:10:00', 'Diikuti oleh santri dan umum'),
    ('323e4567-e89b-12d3-a456-426614174002', 'Muhasabah Akhir Tahun', '2025-12-31 22:00:00', NULL, 'Evaluasi diri sebelum tahun baru');

INSERT INTO nilai_ujian (id, id_sesi_ujian, id_peserta, nilai, keterangan) VALUES
    ('n1a2b3c4-1234-5678-9abc-def012345678', 'sesi-01', 'c7a6d34f-31f1-4d5c-8d74-4f80fc1acb13', 85.50, 'Lulus dengan baik'),
    ('n2b3c4d5-2345-6789-abcd-ef0123456789', 'sesi-01', 'a239f58b-0acb-4ff2-8b1e-b3326b1fce8b', 78.00, 'Perlu perbaikan tajwid'),
    ('n3c4d5e6-3456-789a-bcde-f01234567890', 'sesi-02', 'c7a6d34f-31f1-4d5c-8d74-4f80fc1acb13', 90.75, 'Sangat memuaskan'),
    ('n4d5e6f7-4567-89ab-cdef-123456789012', 'sesi-02', 'a239f58b-0acb-4ff2-8b1e-b3326b1fce8b', 83.25, 'Baik, tetapi perlu latihan lagi');