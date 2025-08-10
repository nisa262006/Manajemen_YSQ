-- Initialize peserta test data based on peserta-data.csv
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