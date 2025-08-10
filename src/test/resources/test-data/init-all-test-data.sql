-- Initialize both peserta and pengajar test data for comprehensive repository tests
-- Based on peserta-data.csv and pengajar-data.csv

-- Insert peserta test data
INSERT INTO peserta (id, nama, email, nomor_handphone) VALUES
    (gen_random_uuid()::text, 'Ahmad Fauzi', 'ahmad.fauzi@email.com', '081234567890'),
    (gen_random_uuid()::text, 'Siti Nurhaliza', 'siti.nurhaliza@email.com', '082345678901'),
    (gen_random_uuid()::text, 'Muhammad Rizky', 'muhammad.rizky@gmail.com', '083456789012'),
    (gen_random_uuid()::text, 'Fatimah Zahra', 'fatimah.zahra@yahoo.com', '084567890123'),
    (gen_random_uuid()::text, 'Ali Rahman', 'ali.rahman@email.com', '085678901234'),
    (gen_random_uuid()::text, 'Khadijah Aisyah', 'khadijah.aisyah@gmail.com', '086789012345'),
    (gen_random_uuid()::text, 'Umar Bakri', 'umar.bakri@email.com', '087890123456'),
    (gen_random_uuid()::text, 'Zainab Putri', 'zainab.putri@yahoo.com', '088901234567'),
    (gen_random_uuid()::text, 'Yusuf Hakim', 'yusuf.hakim@gmail.com', '089012345678'),
    (gen_random_uuid()::text, 'Maryam Sari', 'maryam.sari@email.com', '080123456789');

-- Insert pengajar test data
INSERT INTO pengajar (id, nama, email, nomor_handphone) VALUES
    (gen_random_uuid()::text, 'Prof. Abdul Rahman', 'abdul.rahman@sahabatquran.com', '081234567000'),
    (gen_random_uuid()::text, 'Dr. Aminah Zahra', 'aminah.zahra@sahabatquran.com', '082234567000'),
    (gen_random_uuid()::text, 'Ustaz Muhammad Iqbal', 'muhammad.iqbal@sahabatquran.com', '083234567000'),
    (gen_random_uuid()::text, 'Ustazah Khadijah Ummi', 'khadijah.ummi@sahabatquran.com', '084234567000'),
    (gen_random_uuid()::text, 'Hafiz Ali Imran', 'ali.imran@sahabatquran.com', '085234567000'),
    (gen_random_uuid()::text, 'Hafidzah Fatimah', 'fatimah@sahabatquran.com', '086234567000'),
    (gen_random_uuid()::text, 'Ustaz Omar Faruq', 'omar.faruq@sahabatquran.com', '087234567000'),
    (gen_random_uuid()::text, 'Ustazah Aisyah Nur', 'aisyah.nur@sahabatquran.com', '088234567000');