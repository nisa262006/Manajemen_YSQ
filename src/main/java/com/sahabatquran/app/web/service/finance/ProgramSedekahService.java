package com.sahabatquran.app.web.service.finance;

import com.sahabatquran.app.web.entity.ProgramSedekah;
import com.sahabatquran.app.web.repository.finance.ProgramSedekahRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProgramSedekahService {
    @Autowired
    private ProgramSedekahRepository repository;

    public List<ProgramSedekah> getAllPrograms() {
        return repository.findAll();
    }

    public ProgramSedekah getProgramById(String id) {
        return repository.findById(id).orElse(null);
    }

    public ProgramSedekah saveProgram(ProgramSedekah programSedekah) {
        return repository.save(programSedekah);
    }

    public ProgramSedekah updateProgram(String id, ProgramSedekah updatedProgram) {
        Optional<ProgramSedekah> existingProgram = repository.findById(id);
        if (existingProgram.isPresent()) {
            ProgramSedekah program = existingProgram.get();
            program.setNama(updatedProgram.getNama());
            program.setDeskripsi(updatedProgram.getDeskripsi());
            program.setTanggalMulai(updatedProgram.getTanggalMulai());
            program.setTanggalSelesai(updatedProgram.getTanggalSelesai());
            program.setAktif(updatedProgram.getAktif());
            return repository.save(program);
        }
        return null;
    }

    public void deleteProgram(UUID id) {
        if (!repository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Data pengajar tidak ditemukan: " + id);
        }
        repository.deleteById(String.valueOf(id));
    }
}
