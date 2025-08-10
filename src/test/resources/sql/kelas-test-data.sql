-- Test data specific for Kelas CRUD tests
-- Builds upon base-test-data.sql

-- Additional test kelas data
INSERT INTO kelas (id, nama, id_pengajar, id_mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES 
('kelas001', 'Tahfidz Pagi A', 'p001', 'mp001', 'SENIN', '08:00:00', '10:00:00'),
('kelas002', 'Tahfidz Sore B', 'p002', 'mp001', 'SELASA', '15:00:00', '17:00:00'),
('kelas003', 'Tajwid Pagi', 'p001', 'mp002', 'RABU', '09:00:00', '11:00:00');