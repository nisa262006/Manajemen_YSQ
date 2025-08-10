-- Cleanup script to remove all entities for comprehensive repository tests
-- This script runs before each test method to ensure clean state

-- Disable foreign key checks temporarily for cleanup
SET session_replication_role = replica;

-- Delete dependent data first (in proper order of dependencies)
DELETE FROM presensi_peserta;
DELETE FROM presensi_pengajar;
DELETE FROM sesi_ujian_peserta;
DELETE FROM sesi_ujian_pengajar;
DELETE FROM nilai_ujian;
DELETE FROM jurnal_mutabaah;
DELETE FROM kegiatan_kehadiran_peserta;
DELETE FROM pembayaran_tagihan;
DELETE FROM tagihan;
DELETE FROM pembayaran_sedekah;
DELETE FROM sesi_belajar;
DELETE FROM peserta_kelas;
DELETE FROM kelas;
DELETE FROM sesi_ujian;
DELETE FROM soal_ujian;
DELETE FROM ujian;
DELETE FROM mata_pelajaran;
DELETE FROM kurikulum;
DELETE FROM pengajar;
DELETE FROM peserta;
DELETE FROM kegiatan;
DELETE FROM program_sedekah;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;