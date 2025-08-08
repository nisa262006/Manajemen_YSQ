package com.sahabatquran.app.web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sahabatquran.app.web.entity.Pengajar;

@Repository
public interface PengajarRepository extends JpaRepository<Pengajar, String> {
    
    Optional<Pengajar> findByEmail(String email);
    
    List<Pengajar> findByNamaContainingIgnoreCase(String nama);
    
    @Query("SELECT p FROM Pengajar p WHERE p.nomorHandphone = :nomorHandphone")
    Optional<Pengajar> findByNomorHandphone(@Param("nomorHandphone") String nomorHandphone);
    
    @Query("SELECT p FROM Pengajar p WHERE p.email LIKE %:domain%")
    List<Pengajar> findByEmailDomain(@Param("domain") String domain);
    
    boolean existsByEmail(String email);
    
    boolean existsByNomorHandphone(String nomorHandphone);
}