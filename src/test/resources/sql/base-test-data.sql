-- Base test data for Selenium tests
-- This script provides consistent foundational data for all tests

-- Insert test kurikulum
INSERT INTO kurikulum (id, kode, nama, aktif) VALUES 
('k001', 'K001', 'Kurikulum Dasar Tahfidz', true),
('k002', 'K002', 'Kurikulum Tajwid Lanjutan', true),
('k003', 'K003', 'Kurikulum Tafsir Dasar', false);

-- Insert test pengajar
INSERT INTO pengajar (id, nama, email, nomor_handphone) VALUES 
('p001', 'Ahmad Pengajar Test', 'ahmad.pengajar@test.com', '081234567890'),
('p002', 'Siti Pengajar Test', 'siti.pengajar@test.com', '081234567891'),
('p003', 'Muhammad Pengajar Test', 'muhammad.pengajar@test.com', '081234567892');

-- Insert test mata pelajaran
INSERT INTO mata_pelajaran (id, kode, nama, id_kurikulum, aktif) VALUES 
('mp001', 'MP001', 'Tahfidz Al-Quran', 'k001', true),
('mp002', 'MP002', 'Tajwid Dasar', 'k001', true),
('mp003', 'MP003', 'Tajwid Lanjutan', 'k002', true),
('mp004', 'MP004', 'Tafsir Al-Baqarah', 'k003', true);

-- Insert test peserta (for registration duplicate tests)
INSERT INTO peserta (id, nama, email, nomor_handphone) VALUES 
('peserta001', 'Existing Test Student', 'existing@example.com', '081234567999'),
('peserta002', 'Another Test Student', 'existing2@example.com', '081234567998');