package com.sahabatquran.app.web.repository;

import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sahabatquran.app.web.entity.Hari;
import com.sahabatquran.app.web.entity.Kelas;
import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.entity.Peserta;

@Repository
public interface KelasRepository extends JpaRepository<Kelas, String> {
    
    List<Kelas> findByPengajar(Pengajar pengajar);
    
    List<Kelas> findByHari(Hari hari);
    
    List<Kelas> findByNamaContainingIgnoreCase(String nama);
    
    @Query("SELECT k FROM Kelas k WHERE :peserta MEMBER OF k.daftarPeserta")
    List<Kelas> findByPeserta(@Param("peserta") Peserta peserta);
    
    @Query("SELECT k FROM Kelas k WHERE k.hari = :hari AND k.waktuMulai >= :waktuMulai AND k.waktuSelesai <= :waktuSelesai")
    List<Kelas> findByHariAndWaktu(@Param("hari") Hari hari, 
                                   @Param("waktuMulai") LocalTime waktuMulai, 
                                   @Param("waktuSelesai") LocalTime waktuSelesai);
    
    @Query("SELECT k FROM Kelas k WHERE SIZE(k.daftarPeserta) >= :minPeserta")
    List<Kelas> findWithMinimumPeserta(@Param("minPeserta") int minPeserta);
}