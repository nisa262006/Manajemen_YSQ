-- Test data specific for MataPelajaran CRUD tests
-- Builds upon base-test-data.sql

-- Additional mata pelajaran for comprehensive testing
INSERT INTO mata_pelajaran (id, kode, nama, id_kurikulum, aktif) VALUES 
('mp005', 'MP005', 'Fiqh Dasar', 'k001', true),
('mp006', 'MP006', 'Hadits Pilihan', 'k001', true),
('mp007', 'MP007', 'Akhlaq dan Adab', 'k002', true);