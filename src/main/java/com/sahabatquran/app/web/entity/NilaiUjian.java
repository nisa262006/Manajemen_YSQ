package com.sahabatquran.app.web.entity;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class NilaiUjian {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_peserta")
    private Peserta peserta;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_sesi_ujian")
    private SesiUjian sesiUjian;

    @NotNull @Min(0)
    private BigDecimal nilai;

    private String keterangan;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotNull Peserta getPeserta() {
        return peserta;
    }

    public void setPeserta(@NotNull Peserta peserta) {
        this.peserta = peserta;
    }

    public @NotNull SesiUjian getSesiUjian() {
        return sesiUjian;
    }

    public void setSesiUjian(@NotNull SesiUjian sesiUjian) {
        this.sesiUjian = sesiUjian;
    }

    public @NotNull @Min(0) BigDecimal getNilai() {
        return nilai;
    }

    public void setNilai(@NotNull @Min(0) BigDecimal nilai) {
        this.nilai = nilai;
    }

    public String getKeterangan() {
        return keterangan;
    }

    public void setKeterangan(String keterangan) {
        this.keterangan = keterangan;
    }
}
