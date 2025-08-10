-- Initialize pengajar test data based on pengajar-data.csv
INSERT INTO pengajar (id, nama, email, nomor_handphone) VALUES
    (gen_random_uuid()::text, 'Prof. Abdul Rahman', 'abdul.rahman@sahabatquran.com', '081234567000'),
    (gen_random_uuid()::text, 'Dr. Aminah Zahra', 'aminah.zahra@sahabatquran.com', '082234567000'),
    (gen_random_uuid()::text, 'Ustaz Muhammad Iqbal', 'muhammad.iqbal@sahabatquran.com', '083234567000'),
    (gen_random_uuid()::text, 'Ustazah Khadijah Ummi', 'khadijah.ummi@sahabatquran.com', '084234567000'),
    (gen_random_uuid()::text, 'Hafiz Ali Imran', 'ali.imran@sahabatquran.com', '085234567000'),
    (gen_random_uuid()::text, 'Hafidzah Fatimah', 'fatimah@sahabatquran.com', '086234567000'),
    (gen_random_uuid()::text, 'Ustaz Omar Faruq', 'omar.faruq@sahabatquran.com', '087234567000'),
    (gen_random_uuid()::text, 'Ustazah Aisyah Nur', 'aisyah.nur@sahabatquran.com', '088234567000');