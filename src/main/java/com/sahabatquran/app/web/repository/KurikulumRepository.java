package com.sahabatquran.app.web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sahabatquran.app.web.entity.Kurikulum;

@Repository
public interface KurikulumRepository extends JpaRepository<Kurikulum, String> {
    
    Optional<Kurikulum> findByKode(String kode);
    
    List<Kurikulum> findByNamaContainingIgnoreCase(String nama);
    
    List<Kurikulum> findByAktifTrue();
    
    boolean existsByKode(String kode);
}