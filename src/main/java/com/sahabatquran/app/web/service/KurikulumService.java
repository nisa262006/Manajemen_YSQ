package com.sahabatquran.app.web.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.repository.KurikulumRepository;

@Service
@Transactional
public class KurikulumService {

    @Autowired
    private KurikulumRepository kurikulumRepository;

    public List<Kurikulum> findAll() {
        return kurikulumRepository.findAll();
    }

    public Page<Kurikulum> findAll(Pageable pageable) {
        return kurikulumRepository.findAll(pageable);
    }

    public Optional<Kurikulum> findById(String id) {
        return kurikulumRepository.findById(id);
    }

    public Optional<Kurikulum> findByKode(String kode) {
        return kurikulumRepository.findByKode(kode);
    }

    public List<Kurikulum> findByNamaContaining(String nama) {
        return kurikulumRepository.findByNamaContainingIgnoreCase(nama);
    }

    public List<Kurikulum> findByAktifTrue() {
        return kurikulumRepository.findByAktifTrue();
    }

    public Kurikulum save(Kurikulum kurikulum) {
        validateKurikulum(kurikulum);
        return kurikulumRepository.save(kurikulum);
    }

    public Kurikulum update(String id, Kurikulum kurikulum) {
        Optional<Kurikulum> existing = kurikulumRepository.findById(id);
        if (existing.isEmpty()) {
            throw new KurikulumNotFoundException("Kurikulum tidak ditemukan dengan ID: " + id);
        }
        
        kurikulum.setId(id);
        validateKurikulumForUpdate(kurikulum, id);
        return kurikulumRepository.save(kurikulum);
    }

    public void deleteById(String id) {
        if (!kurikulumRepository.existsById(id)) {
            throw new KurikulumNotFoundException("Kurikulum tidak ditemukan dengan ID: " + id);
        }
        kurikulumRepository.deleteById(id);
    }

    public boolean existsById(String id) {
        return kurikulumRepository.existsById(id);
    }

    public boolean existsByKode(String kode) {
        return kurikulumRepository.existsByKode(kode);
    }

    private void validateKurikulum(Kurikulum kurikulum) {
        if (kurikulumRepository.existsByKode(kurikulum.getKode())) {
            throw new KurikulumValidationException("Kode kurikulum sudah terdaftar: " + kurikulum.getKode());
        }
    }

    private void validateKurikulumForUpdate(Kurikulum kurikulum, String id) {
        Optional<Kurikulum> existingByKode = kurikulumRepository.findByKode(kurikulum.getKode());
        if (existingByKode.isPresent() && !existingByKode.get().getId().equals(id)) {
            throw new KurikulumValidationException("Kode kurikulum sudah terdaftar: " + kurikulum.getKode());
        }
    }

    public static class KurikulumNotFoundException extends RuntimeException {
        public KurikulumNotFoundException(String message) {
            super(message);
        }
    }

    public static class KurikulumValidationException extends RuntimeException {
        public KurikulumValidationException(String message) {
            super(message);
        }
    }
}