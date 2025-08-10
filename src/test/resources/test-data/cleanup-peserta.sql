-- Cleanup script to remove foreign key dependencies before cleaning peserta table
-- This script runs before each test method to ensure clean state

-- Disable foreign key checks temporarily for cleanup
SET session_replication_role = replica;

-- Delete dependent data first (in order of dependencies)
DELETE FROM presensi_peserta;
DELETE FROM sesi_ujian_peserta;
DELETE FROM nilai_ujian;
DELETE FROM jurnal_mutabaah;
DELETE FROM tagihan;
DELETE FROM pembayaran_sedekah;
DELETE FROM kegiatan_kehadiran_peserta;
DELETE FROM peserta_kelas;
DELETE FROM peserta;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;