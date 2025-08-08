package com.sahabatquran.app.web.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.repository.PengajarRepository;

@Service
@Transactional
public class PengajarService {

    @Autowired
    private PengajarRepository pengajarRepository;

    public List<Pengajar> findAll() {
        return pengajarRepository.findAll();
    }

    public Page<Pengajar> findAll(Pageable pageable) {
        return pengajarRepository.findAll(pageable);
    }

    public Optional<Pengajar> findById(String id) {
        return pengajarRepository.findById(id);
    }

    public Optional<Pengajar> findByEmail(String email) {
        return pengajarRepository.findByEmail(email);
    }

    public List<Pengajar> findByNamaContaining(String nama) {
        return pengajarRepository.findByNamaContainingIgnoreCase(nama);
    }

    public Optional<Pengajar> findByNomorHandphone(String nomorHandphone) {
        return pengajarRepository.findByNomorHandphone(nomorHandphone);
    }

    public Pengajar save(Pengajar pengajar) {
        validatePengajar(pengajar);
        return pengajarRepository.save(pengajar);
    }

    public Pengajar update(String id, Pengajar pengajar) {
        Optional<Pengajar> existing = pengajarRepository.findById(id);
        if (existing.isEmpty()) {
            throw new PengajarNotFoundException("Pengajar tidak ditemukan dengan ID: " + id);
        }
        
        pengajar.setId(id);
        validatePengajarForUpdate(pengajar, id);
        return pengajarRepository.save(pengajar);
    }

    public void deleteById(String id) {
        if (!pengajarRepository.existsById(id)) {
            throw new PengajarNotFoundException("Pengajar tidak ditemukan dengan ID: " + id);
        }
        pengajarRepository.deleteById(id);
    }

    public boolean existsById(String id) {
        return pengajarRepository.existsById(id);
    }

    public boolean existsByEmail(String email) {
        return pengajarRepository.existsByEmail(email);
    }

    public boolean existsByNomorHandphone(String nomorHandphone) {
        return pengajarRepository.existsByNomorHandphone(nomorHandphone);
    }

    private void validatePengajar(Pengajar pengajar) {
        if (pengajarRepository.existsByEmail(pengajar.getEmail())) {
            throw new PengajarValidationException("Email sudah terdaftar: " + pengajar.getEmail());
        }
        
        if (pengajarRepository.existsByNomorHandphone(pengajar.getNomorHandphone())) {
            throw new PengajarValidationException("Nomor handphone sudah terdaftar: " + pengajar.getNomorHandphone());
        }
    }

    private void validatePengajarForUpdate(Pengajar pengajar, String id) {
        Optional<Pengajar> existingByEmail = pengajarRepository.findByEmail(pengajar.getEmail());
        if (existingByEmail.isPresent() && !existingByEmail.get().getId().equals(id)) {
            throw new PengajarValidationException("Email sudah terdaftar: " + pengajar.getEmail());
        }
        
        Optional<Pengajar> existingByPhone = pengajarRepository.findByNomorHandphone(pengajar.getNomorHandphone());
        if (existingByPhone.isPresent() && !existingByPhone.get().getId().equals(id)) {
            throw new PengajarValidationException("Nomor handphone sudah terdaftar: " + pengajar.getNomorHandphone());
        }
    }

    public static class PengajarNotFoundException extends RuntimeException {
        public PengajarNotFoundException(String message) {
            super(message);
        }
    }

    public static class PengajarValidationException extends RuntimeException {
        public PengajarValidationException(String message) {
            super(message);
        }
    }
}