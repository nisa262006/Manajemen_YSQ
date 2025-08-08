package com.sahabatquran.app.web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.entity.Kurikulum;

@Repository
public interface MataPelajaranRepository extends JpaRepository<MataPelajaran, String> {
    
    Optional<MataPelajaran> findByKode(String kode);
    
    List<MataPelajaran> findByNamaContainingIgnoreCase(String nama);
    
    List<MataPelajaran> findByKurikulum(Kurikulum kurikulum);
    
    List<MataPelajaran> findByKurikulumAndAktifTrue(Kurikulum kurikulum);
    
    List<MataPelajaran> findByAktifTrue();
    
    @Query("SELECT mp FROM MataPelajaran mp WHERE mp.kurikulum.kode = :kurikulumKode")
    List<MataPelajaran> findByKurikulumKode(@Param("kurikulumKode") String kurikulumKode);
    
    boolean existsByKode(String kode);
    
    boolean existsByKodeAndKurikulum(String kode, Kurikulum kurikulum);
}