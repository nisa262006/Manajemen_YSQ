package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.SesiUjian;
import com.sahabatquran.app.web.repository.admin.SesiUjianRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SesiUjianService {

    @Autowired
    private SesiUjianRepository sesiUjianRepository;

    public SesiUjian saveSesiUjian(SesiUjian sesiUjian) {
        return sesiUjianRepository.save(sesiUjian);
    }

    public SesiUjian updateSesiUjian(String id, SesiUjian sesiUjianDetails) {
        Optional<SesiUjian> existingSesiUjianOpt = sesiUjianRepository.findById(id);
        if (existingSesiUjianOpt.isPresent()) {
            SesiUjian existingSesiUjian = existingSesiUjianOpt.get();
            existingSesiUjian.setUjian(sesiUjianDetails.getUjian());
            existingSesiUjian.setWaktuMulai(sesiUjianDetails.getWaktuMulai());
            existingSesiUjian.setWaktuSelesai(sesiUjianDetails.getWaktuSelesai());
            return sesiUjianRepository.save(existingSesiUjian);
        } else {
            throw new IllegalArgumentException("Data sesi ujian tidak ditemukan: " + id);
        }
    }

    public void deleteSesiUjian(String id) {
        if (!sesiUjianRepository.existsById(id)) {
            throw new IllegalArgumentException("Data sesi ujian tidak ditemukan: " + id);
        }
        sesiUjianRepository.deleteById(id);
    }
}