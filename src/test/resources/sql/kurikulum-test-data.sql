-- Test data specific for Kurikulum CRUD tests
-- Builds upon base-test-data.sql

-- Additional kurikulum for comprehensive testing
INSERT INTO kurikulum (id, kode, nama, aktif) VALUES 
('k004', 'K004', 'Kurikulum Tahfizh Al-Quran', true),
('k005', 'K005', 'Kurikulum Tajwid Dasar', true),
('k006', 'K006', 'Kurikulum Tafsir Jalalain', true);