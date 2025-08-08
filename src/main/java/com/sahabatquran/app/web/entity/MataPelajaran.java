package com.sahabatquran.app.web.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Optional;

@Entity @Data
public class MataPelajaran {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @ManyToOne
    @JoinColumn(name = "id_kurikulum")
    private Kurikulum kurikulum;

    @NotNull @NotEmpty
    @Size(min = 3, max = 100)
    private String kode;

    @NotNull @NotEmpty
    @Size(min = 3, max = 200)
    private String nama;

    @NotNull
    private Boolean aktif = Boolean.TRUE;
}
