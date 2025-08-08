package com.sahabatquran.app.web.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.repository.MataPelajaranRepository;

@Service
@Transactional
public class MataPelajaranService {

    @Autowired
    private MataPelajaranRepository mataPelajaranRepository;

    public List<MataPelajaran> findAll() {
        return mataPelajaranRepository.findAll();
    }

    public Page<MataPelajaran> findAll(Pageable pageable) {
        return mataPelajaranRepository.findAll(pageable);
    }

    public Optional<MataPelajaran> findById(String id) {
        return mataPelajaranRepository.findById(id);
    }

    public Optional<MataPelajaran> findByKode(String kode) {
        return mataPelajaranRepository.findByKode(kode);
    }

    public List<MataPelajaran> findByNamaContaining(String nama) {
        return mataPelajaranRepository.findByNamaContainingIgnoreCase(nama);
    }

    public List<MataPelajaran> findByKurikulum(Kurikulum kurikulum) {
        return mataPelajaranRepository.findByKurikulum(kurikulum);
    }

    public List<MataPelajaran> findByKurikulumKode(String kurikulumKode) {
        return mataPelajaranRepository.findByKurikulumKode(kurikulumKode);
    }

    public List<MataPelajaran> findByAktifTrue() {
        return mataPelajaranRepository.findByAktifTrue();
    }

    public MataPelajaran save(MataPelajaran mataPelajaran) {
        validateMataPelajaran(mataPelajaran);
        return mataPelajaranRepository.save(mataPelajaran);
    }

    public MataPelajaran update(String id, MataPelajaran mataPelajaran) {
        Optional<MataPelajaran> existing = mataPelajaranRepository.findById(id);
        if (existing.isEmpty()) {
            throw new MataPelajaranNotFoundException("Mata Pelajaran tidak ditemukan dengan ID: " + id);
        }
        
        mataPelajaran.setId(id);
        validateMataPelajaranForUpdate(mataPelajaran, id);
        return mataPelajaranRepository.save(mataPelajaran);
    }

    public void deleteById(String id) {
        if (!mataPelajaranRepository.existsById(id)) {
            throw new MataPelajaranNotFoundException("Mata Pelajaran tidak ditemukan dengan ID: " + id);
        }
        mataPelajaranRepository.deleteById(id);
    }

    public boolean existsById(String id) {
        return mataPelajaranRepository.existsById(id);
    }

    public boolean existsByKode(String kode) {
        return mataPelajaranRepository.existsByKode(kode);
    }

    public boolean existsByKodeAndKurikulum(String kode, Kurikulum kurikulum) {
        return mataPelajaranRepository.existsByKodeAndKurikulum(kode, kurikulum);
    }

    private void validateMataPelajaran(MataPelajaran mataPelajaran) {
        if (mataPelajaranRepository.existsByKodeAndKurikulum(mataPelajaran.getKode(), mataPelajaran.getKurikulum())) {
            throw new MataPelajaranValidationException("Kode mata pelajaran sudah terdaftar dalam kurikulum ini: " + mataPelajaran.getKode());
        }
    }

    private void validateMataPelajaranForUpdate(MataPelajaran mataPelajaran, String id) {
        List<MataPelajaran> existingByKode = mataPelajaranRepository.findByKurikulum(mataPelajaran.getKurikulum());
        for (MataPelajaran existing : existingByKode) {
            if (existing.getKode().equals(mataPelajaran.getKode()) && !existing.getId().equals(id)) {
                throw new MataPelajaranValidationException("Kode mata pelajaran sudah terdaftar dalam kurikulum ini: " + mataPelajaran.getKode());
            }
        }
    }

    public static class MataPelajaranNotFoundException extends RuntimeException {
        public MataPelajaranNotFoundException(String message) {
            super(message);
        }
    }

    public static class MataPelajaranValidationException extends RuntimeException {
        public MataPelajaranValidationException(String message) {
            super(message);
        }
    }
}