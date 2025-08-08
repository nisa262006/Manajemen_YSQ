package com.sahabatquran.app.web.entity;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class ProgramSedekah {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @NotEmpty
    private String nama;

    private String deskripsi;

    @NotNull
    private LocalDate tanggalMulai;
    private LocalDate tanggalSelesai;
    
    private Boolean aktif = Boolean.TRUE;
}
