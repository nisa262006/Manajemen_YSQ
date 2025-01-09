package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.Kelas;
import com.sahabatquran.app.web.repository.admin.DataKelasRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DataKelasService {

    @Autowired
    private DataKelasRepository dataKelasRepository;

    public Kelas saveKelas(Kelas kelas) {
        return dataKelasRepository.save(kelas);
    }

    public Kelas editKelas(String id, Kelas kelasDetails) {
        Optional<Kelas> existingKelasOpt = dataKelasRepository.findById(id);
        if (existingKelasOpt.isPresent()) {
            Kelas existingKelas = existingKelasOpt.get();
            existingKelas.setPengajar(kelasDetails.getPengajar());
            existingKelas.setMataPelajaran(kelasDetails.getMataPelajaran());
            existingKelas.setNama(kelasDetails.getNama());
            existingKelas.setHari(kelasDetails.getHari());
            existingKelas.setWaktuMulai(kelasDetails.getWaktuMulai());
            existingKelas.setWaktuSelesai(kelasDetails.getWaktuSelesai());
            existingKelas.setDaftarPeserta(kelasDetails.getDaftarPeserta());
            return dataKelasRepository.save(existingKelas);
        } else {
            throw new IllegalArgumentException("Data kelas tidak ditemukan: " + id);
        }
    }

    public void deleteKelas(String id) {
        if (!dataKelasRepository.existsById(id)) {
            throw new IllegalArgumentException("Data kelas tidak ditemukan: " + id);
        }
        dataKelasRepository.deleteById(id);
    }
}
