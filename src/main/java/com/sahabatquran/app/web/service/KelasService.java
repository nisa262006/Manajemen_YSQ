package com.sahabatquran.app.web.service;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sahabatquran.app.web.entity.Hari;
import com.sahabatquran.app.web.entity.Kelas;
import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.repository.KelasRepository;

@Service
@Transactional
public class KelasService {

    @Autowired
    private KelasRepository kelasRepository;

    public List<Kelas> findAll() {
        return kelasRepository.findAll();
    }

    public Page<Kelas> findAll(Pageable pageable) {
        return kelasRepository.findAll(pageable);
    }

    public Optional<Kelas> findById(String id) {
        return kelasRepository.findById(id);
    }

    public List<Kelas> findByNamaContaining(String nama) {
        return kelasRepository.findByNamaContainingIgnoreCase(nama);
    }

    public List<Kelas> findByPengajar(Pengajar pengajar) {
        return kelasRepository.findByPengajar(pengajar);
    }

    public List<Kelas> findByHari(Hari hari) {
        return kelasRepository.findByHari(hari);
    }

    public List<Kelas> findByPeserta(Peserta peserta) {
        return kelasRepository.findByPeserta(peserta);
    }

    public List<Kelas> findByHariAndWaktu(Hari hari, LocalTime waktuMulai, LocalTime waktuSelesai) {
        return kelasRepository.findByHariAndWaktu(hari, waktuMulai, waktuSelesai);
    }

    public Kelas save(Kelas kelas) {
        validateKelas(kelas);
        return kelasRepository.save(kelas);
    }

    public Kelas update(String id, Kelas kelas) {
        Optional<Kelas> existing = kelasRepository.findById(id);
        if (existing.isEmpty()) {
            throw new KelasNotFoundException("Kelas tidak ditemukan dengan ID: " + id);
        }
        
        kelas.setId(id);
        validateKelasForUpdate(kelas, id);
        return kelasRepository.save(kelas);
    }

    public void deleteById(String id) {
        if (!kelasRepository.existsById(id)) {
            throw new KelasNotFoundException("Kelas tidak ditemukan dengan ID: " + id);
        }
        kelasRepository.deleteById(id);
    }

    public boolean existsById(String id) {
        return kelasRepository.existsById(id);
    }

    private void validateKelas(Kelas kelas) {
        if (kelas.getWaktuMulai() != null && kelas.getWaktuSelesai() != null) {
            if (kelas.getWaktuMulai().isAfter(kelas.getWaktuSelesai()) || 
                kelas.getWaktuMulai().equals(kelas.getWaktuSelesai())) {
                throw new KelasValidationException("Waktu mulai harus lebih awal dari waktu selesai");
            }
        }
        
        if (hasScheduleConflict(kelas, null)) {
            throw new KelasValidationException("Jadwal kelas bertabrakan dengan kelas lain pada hari dan waktu yang sama");
        }
    }

    private void validateKelasForUpdate(Kelas kelas, String id) {
        if (kelas.getWaktuMulai() != null && kelas.getWaktuSelesai() != null) {
            if (kelas.getWaktuMulai().isAfter(kelas.getWaktuSelesai()) || 
                kelas.getWaktuMulai().equals(kelas.getWaktuSelesai())) {
                throw new KelasValidationException("Waktu mulai harus lebih awal dari waktu selesai");
            }
        }
        
        if (hasScheduleConflict(kelas, id)) {
            throw new KelasValidationException("Jadwal kelas bertabrakan dengan kelas lain pada hari dan waktu yang sama");
        }
    }

    private boolean hasScheduleConflict(Kelas kelas, String excludeId) {
        if (kelas.getHari() == null || kelas.getWaktuMulai() == null || kelas.getWaktuSelesai() == null) {
            return false;
        }
        
        List<Kelas> existingKelas = kelasRepository.findByHari(kelas.getHari());
        
        for (Kelas existing : existingKelas) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            
            if (existing.getWaktuMulai() != null && existing.getWaktuSelesai() != null) {
                boolean hasTimeOverlap = 
                    (kelas.getWaktuMulai().isBefore(existing.getWaktuSelesai()) && 
                     kelas.getWaktuSelesai().isAfter(existing.getWaktuMulai()));
                
                if (hasTimeOverlap) {
                    return true;
                }
            }
        }
        
        return false;
    }

    public static class KelasNotFoundException extends RuntimeException {
        public KelasNotFoundException(String message) {
            super(message);
        }
    }

    public static class KelasValidationException extends RuntimeException {
        public KelasValidationException(String message) {
            super(message);
        }
    }
}