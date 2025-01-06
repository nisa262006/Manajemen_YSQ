package com.sahabatquran.app.web.repository;

import com.sahabatquran.app.web.entity.Peserta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataPesertaRepository extends JpaRepository<Peserta, String> {
}
