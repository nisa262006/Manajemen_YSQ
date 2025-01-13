package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.SoalUjian;
import com.sahabatquran.app.web.repository.admin.SoalUjianRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class SoalUjianService {

    @Autowired
    private SoalUjianRepository soalUjianRepository;

    public SoalUjian saveSoalUjian(SoalUjian soalUjian) {
        return soalUjianRepository.save(soalUjian);
    }

    public SoalUjian updateSoalUjian(String id, SoalUjian soalUjianDetails) {
        Optional<SoalUjian> existingSoalUjianOpt = soalUjianRepository.findById(id);
        if (existingSoalUjianOpt.isPresent()) {
            SoalUjian existingSoalUjian = existingSoalUjianOpt.get();
            existingSoalUjian.setPertanyaan(soalUjianDetails.getPertanyaan());
            existingSoalUjian.setUrutan(soalUjianDetails.getUrutan());
            existingSoalUjian.setUjian(soalUjianDetails.getUjian());
            return soalUjianRepository.save(existingSoalUjian);
        } else {
            throw new IllegalArgumentException("Soal Ujian tidak ditemukan dengan ID: " + id);
        }
    }

    public void deleteSoalUjian(String id) {
        if (!soalUjianRepository.existsById(id)) {
            throw new IllegalArgumentException("Soal ujian tidak ditemukan: " + id);
        }
        soalUjianRepository.deleteById(id);
    }
}
