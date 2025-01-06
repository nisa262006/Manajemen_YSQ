package com.sahabatquran.app.web.service;

import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.repository.DataPengajarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Service
public class DataPengajarService {

    @Autowired
    private DataPengajarRepository dataPengajarRepository;

    public Pengajar savePengajar(Pengajar pengajar) {
        return dataPengajarRepository.save(pengajar);
    }

    public Pengajar editPengajar(String id, Pengajar pengajarDetails) {
        Optional<Pengajar> existingPengajarOpt = dataPengajarRepository.findById(id);
        if (existingPengajarOpt.isPresent()) {
            Pengajar existingPengajar = existingPengajarOpt.get();
            existingPengajar.setNama(pengajarDetails.getNama());
            existingPengajar.setEmail(pengajarDetails.getEmail());
            existingPengajar.setNomor_handphone(pengajarDetails.getNomor_handphone());
            return dataPengajarRepository.save(existingPengajar); // Save updated data
        } else {
            return null;
        }
    }

    public void deletePengajar(UUID id) {
        if (!dataPengajarRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Data pengajar tidak ditemukan: " + id);
        }
        dataPengajarRepository.deleteById(String.valueOf(id));
    }
}

