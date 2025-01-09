package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.repository.admin.DataMataPelajaranRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class DataMataPelajaranService {

    @Autowired
    private DataMataPelajaranRepository dataMataPelajaranRepository;

    public MataPelajaran saveMataPelajaran(MataPelajaran mataPelajaran) {
        return dataMataPelajaranRepository.save(mataPelajaran);
    }

    public MataPelajaran editMataPelajaran(String id, MataPelajaran mataPelajaranDetails) {
        Optional<MataPelajaran> existingMataPelajaranOpt = dataMataPelajaranRepository.findById(id);
        if (existingMataPelajaranOpt.isPresent()) {
            MataPelajaran existingMataPelajaran = existingMataPelajaranOpt.get();
            existingMataPelajaran.setKurikulum(mataPelajaranDetails.getKurikulum());
            existingMataPelajaran.setKode(mataPelajaranDetails.getKode());
            existingMataPelajaran.setNama(mataPelajaranDetails.getNama());
            existingMataPelajaran.setAktif(mataPelajaranDetails.getAktif());
            return dataMataPelajaranRepository.save(existingMataPelajaran);
        } else {
            return null;
        }
    }

    public void deleteMataPelajaran(UUID id) {
        if (!dataMataPelajaranRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Data MataPelajaran tidak ditemukan: " + id);
        }
        dataMataPelajaranRepository.deleteById(String.valueOf(id));
    }
}
