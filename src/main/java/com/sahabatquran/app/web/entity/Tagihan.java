package com.sahabatquran.app.web.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

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
public class Tagihan {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_peserta")
    private Peserta peserta;

    @NotNull
    private LocalDate tanggalTerbit = LocalDate.now();

    @NotNull
    private LocalDate tanggalJatuhTempo = LocalDate.now().plusMonths(1);

    @NotNull @Min(0)
    private BigDecimal nilai;

    @NotNull
    private Boolean lunas = Boolean.FALSE;

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

    public @NotNull LocalDate getTanggalTerbit() {
        return tanggalTerbit;
    }

    public void setTanggalTerbit(@NotNull LocalDate tanggalTerbit) {
        this.tanggalTerbit = tanggalTerbit;
    }

    public @NotNull LocalDate getTanggalJatuhTempo() {
        return tanggalJatuhTempo;
    }

    public void setTanggalJatuhTempo(@NotNull LocalDate tanggalJatuhTempo) {
        this.tanggalJatuhTempo = tanggalJatuhTempo;
    }

    public @NotNull @Min(0) BigDecimal getNilai() {
        return nilai;
    }

    public void setNilai(@NotNull @Min(0) BigDecimal nilai) {
        this.nilai = nilai;
    }

    public @NotNull Boolean getLunas() {
        return lunas;
    }

    public void setLunas(@NotNull Boolean lunas) {
        this.lunas = lunas;
    }
}
