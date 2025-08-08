package com.sahabatquran.app.web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sahabatquran.app.web.entity.Peserta;

@Repository
public interface PesertaRepository extends JpaRepository<Peserta, String> {
    
    Optional<Peserta> findByEmail(String email);
    
    List<Peserta> findByNamaContainingIgnoreCase(String nama);
    
    @Query("SELECT p FROM Peserta p WHERE p.nomorHandphone = :nomorHandphone")
    Optional<Peserta> findByNomorHandphone(@Param("nomorHandphone") String nomorHandphone);
    
    @Query("SELECT p FROM Peserta p WHERE p.email LIKE %:domain%")
    List<Peserta> findByEmailDomain(@Param("domain") String domain);
    
    boolean existsByEmail(String email);
    
    boolean existsByNomorHandphone(String nomorHandphone);
}