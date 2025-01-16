package com.sahabatquran.app.web.service.finance;

import com.sahabatquran.app.web.entity.ProgramSedekah;
import com.sahabatquran.app.web.entity.Tagihan;
import com.sahabatquran.app.web.repository.finance.TagihanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TagihanService {
    @Autowired
    private TagihanRepository tagihanRepository;

    public List<Tagihan> findAll() {
        return tagihanRepository.findAll();
    }

    public Tagihan getTagihanById(String id) {
        return tagihanRepository.findById(id).orElse(null);
    }

    public Optional<Tagihan> findById(String id) {
        return tagihanRepository.findById(id);
    }

    public Tagihan save(Tagihan tagihan) {
        return tagihanRepository.save(tagihan);
    }

    public Tagihan updateTagihan(String id, Tagihan updateTagihan) {
        Optional<Tagihan> existingTagihan = tagihanRepository.findById(id);
        if (existingTagihan.isPresent()) {
            Tagihan tagihan = existingTagihan.get();
            tagihan.setPeserta(updateTagihan.getPeserta());
            tagihan.setTanggalTerbit(updateTagihan.getTanggalTerbit());
            tagihan.setTanggalJatuhTempo(updateTagihan.getTanggalJatuhTempo());
            tagihan.setNilai(updateTagihan.getNilai());
            tagihan.setLunas(updateTagihan.getLunas());
            return tagihanRepository.save(tagihan);
        }
        return null;
    }

    public void deleteTagihan(UUID id) {
        if (!tagihanRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Data pengajar tidak ditemukan: " + id);
        }
        tagihanRepository.deleteById(String.valueOf(id));
    }
}
