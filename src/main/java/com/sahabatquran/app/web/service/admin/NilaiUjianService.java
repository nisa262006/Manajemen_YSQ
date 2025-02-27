package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.NilaiUjian;
import com.sahabatquran.app.web.repository.admin.NilaiUjianRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NilaiUjianService {

    @Autowired
    private NilaiUjianRepository nilaiUjianRepository;

    public NilaiUjian saveNilaiUjian(NilaiUjian nilaiUjian) {
        return nilaiUjianRepository.save(nilaiUjian);
    }

    public NilaiUjian editNilaiUjian(String id, NilaiUjian nilaiDetails) {
        Optional<NilaiUjian> existingNilaiOpt = nilaiUjianRepository.findById(id);
        if (existingNilaiOpt.isPresent()) {
            NilaiUjian existingNilai = existingNilaiOpt.get();
            existingNilai.setPeserta(nilaiDetails.getPeserta());
            existingNilai.setSesiUjian(nilaiDetails.getSesiUjian());
            existingNilai.setNilai(nilaiDetails.getNilai());
            existingNilai.setKeterangan(nilaiDetails.getKeterangan());
            return nilaiUjianRepository.save(existingNilai); // Save updated data
        } else {
            return null;
        }
    }

    public void deleteNilaiUjian(UUID id) {
        if (!nilaiUjianRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Nilai Ujian tidak ditemukan: " + id);
        }
        nilaiUjianRepository.deleteById(String.valueOf(id));
    }

    public List<NilaiUjian> findAll() {
        return nilaiUjianRepository.findAll();
    }
}