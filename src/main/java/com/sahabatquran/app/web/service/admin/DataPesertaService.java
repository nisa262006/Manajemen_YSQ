package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.repository.admin.DataPesertaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class DataPesertaService {

    @Autowired
    private DataPesertaRepository dataPesertaRepository;

    public Peserta savePeserta(Peserta peserta) {
        return dataPesertaRepository.save(peserta);
    }

    public Peserta editPeserta(String id, Peserta pesertaDetails) {
        Optional<Peserta> existingPesertaOpt = dataPesertaRepository.findById(id);
        if (existingPesertaOpt.isPresent()) {
            Peserta existingPeserta = existingPesertaOpt.get();
            existingPeserta.setNama(pesertaDetails.getNama());
            existingPeserta.setEmail(pesertaDetails.getEmail());
            existingPeserta.setNomor_handphone(pesertaDetails.getNomor_handphone());
            return dataPesertaRepository.save(existingPeserta); // Save updated data
        } else {
            return null;
        }
    }

    public void deletePeserta(UUID id) {
        if (!dataPesertaRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Data peserta tidak ditemukan: " + id);
        }
        dataPesertaRepository.deleteById(String.valueOf(id));
    }

}
