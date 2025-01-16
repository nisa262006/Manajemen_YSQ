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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotNull @NotEmpty String getNama() {
        return nama;
    }

    public void setNama(@NotNull @NotEmpty String nama) {
        this.nama = nama;
    }

    public String getDeskripsi() {
        return deskripsi;
    }

    public void setDeskripsi(String deskripsi) {
        this.deskripsi = deskripsi;
    }

    public @NotNull LocalDate getTanggalMulai() {
        return tanggalMulai;
    }

    public void setTanggalMulai(@NotNull LocalDate tanggalMulai) {
        this.tanggalMulai = tanggalMulai;
    }

    public LocalDate getTanggalSelesai() {
        return tanggalSelesai;
    }

    public void setTanggalSelesai(LocalDate tanggalSelesai) {
        this.tanggalSelesai = tanggalSelesai;
    }

    public Boolean getAktif() {
        return aktif;
    }

    public void setAktif(Boolean aktif) {
        this.aktif = aktif;
    }
}
