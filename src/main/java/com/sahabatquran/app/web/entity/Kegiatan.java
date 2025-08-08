package com.sahabatquran.app.web.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Entity @Data
@Table(name = "kegiatan")
public class Kegiatan {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @NotEmpty
    @Size(min = 3, max = 255)
    private String nama;

    @NotNull
    private LocalDateTime waktuRencana;

    private LocalDateTime waktuRealisasi;

    @Column(columnDefinition = "TEXT")
    private String catatanAcara;

}