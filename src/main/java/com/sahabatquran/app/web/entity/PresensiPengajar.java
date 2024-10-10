package com.sahabatquran.app.web.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class PresensiPengajar {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_pengajar")
    private Pengajar pengajar;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_sesi_belajar")
    private SesiBelajar sesiBelajar;

    @NotNull
    private LocalDateTime waktuDatang;

}
