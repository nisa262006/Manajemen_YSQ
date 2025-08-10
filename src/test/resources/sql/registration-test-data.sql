-- Test data specific for registration/pendaftaran tests
-- Provides existing students for duplicate validation tests

-- Additional peserta for registration duplicate tests
INSERT INTO peserta (id, nama, email, nomor_handphone) VALUES 
('peserta003', 'Duplicate Email Test', 'duplicate.email@example.com', '081234560001'),
('peserta004', 'Duplicate Phone Test', 'duplicate.phone@example.com', '081234560000');