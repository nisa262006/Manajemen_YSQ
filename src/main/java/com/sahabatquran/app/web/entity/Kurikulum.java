package com.sahabatquran.app.web.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity @Data
public class Kurikulum {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @NotEmpty
    @Size(min = 3, max = 100)
    private String kode;

    @NotNull @NotEmpty
    @Size(min = 3, max = 200)
    private String nama;

    @NotNull
    private Boolean aktif = Boolean.TRUE;

}
