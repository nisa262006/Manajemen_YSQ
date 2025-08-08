package com.sahabatquran.app.web.entity;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity @Data
public class Kelas {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_pengajar")
    private Pengajar pengajar;

    @NotNull @ManyToOne
    @JoinColumn(name = "id_mata_pelajaran")
    private MataPelajaran mataPelajaran;

    @NotNull @NotEmpty
    @Size(min = 3, max = 100)
    private String nama;

    @Enumerated(EnumType.STRING)
    private Hari hari;

    @NotNull
    private LocalTime waktuMulai;

    @NotNull
    private LocalTime waktuSelesai;

    @ManyToMany
    @JoinTable(
        name = "peserta_kelas",
        joinColumns = @JoinColumn(name = "id_kelas"),
        inverseJoinColumns = @JoinColumn(name = "id_peserta")
    )
    private List<Peserta> daftarPeserta = new ArrayList<>();
}
