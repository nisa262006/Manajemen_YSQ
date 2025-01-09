package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.repository.admin.DataKurikulumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class DataKurikulumService {

    @Autowired
    private DataKurikulumRepository dataKurikulumRepository;

    public Kurikulum saveKurikulum(Kurikulum kurikulum) {
        return dataKurikulumRepository.save(kurikulum);
    }

    public Kurikulum editKurikulum(String id, Kurikulum kurikulumDetails) {
        Optional<Kurikulum> existingKurikulumOpt = dataKurikulumRepository.findById(id);
        if (existingKurikulumOpt.isPresent()) {
            Kurikulum existingKurikulum = existingKurikulumOpt.get();
            existingKurikulum.setKode(kurikulumDetails.getKode());
            existingKurikulum.setNama(kurikulumDetails.getNama());
            existingKurikulum.setAktif(kurikulumDetails.getAktif());
            return dataKurikulumRepository.save(existingKurikulum); // Save updated data
        } else {
            return null;
        }
    }

    public void deleteKurikulum(UUID id) {
        if (!dataKurikulumRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Data kurikulum tidak ditemukan: " + id);
        }
        dataKurikulumRepository.deleteById(String.valueOf(id));
    }
}
