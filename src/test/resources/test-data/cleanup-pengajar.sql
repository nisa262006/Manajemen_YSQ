-- Cleanup script to remove foreign key dependencies before cleaning pengajar table
-- This script runs before each test method to ensure clean state

-- Disable foreign key checks temporarily for cleanup
SET session_replication_role = replica;

-- Delete dependent data first (in order of dependencies)
DELETE FROM presensi_pengajar;
DELETE FROM sesi_ujian_pengajar;
DELETE FROM peserta_kelas;
DELETE FROM sesi_belajar;
DELETE FROM kelas;
DELETE FROM pengajar;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;