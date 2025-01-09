package com.sahabatquran.app.web.service.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sahabatquran.app.web.entity.Ujian;
import com.sahabatquran.app.web.repository.admin.UjianRepository;

import java.util.Optional;

@Service
public class UjianService {

    @Autowired
    private UjianRepository ujianRepository;

    public Ujian saveUjian(Ujian ujian) {
        return ujianRepository.save(ujian);
    }

    public Ujian editUjian(String id, Ujian ujianDetails) {
        Optional<Ujian> existingUjianOpt = ujianRepository.findById(id);
        if (existingUjianOpt.isPresent()) {
            Ujian existingUjian = existingUjianOpt.get();
            existingUjian.setMataPelajaran(ujianDetails.getMataPelajaran());
            existingUjian.setNamaUjian(ujianDetails.getNamaUjian());
            return ujianRepository.save(existingUjian);
        } else {
            throw new IllegalArgumentException("Data ujian tidak ditemukan: " + id);
        }
    }

    public void deleteUjian(String id) {
        if (!ujianRepository.existsById(id)) {
            throw new IllegalArgumentException("Data ujian tidak ditemukan: " + id);
        }
        ujianRepository.deleteById(id);
    }
}

