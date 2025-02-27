package com.sahabatquran.app.web.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Entity @Data
public class Event {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @NotEmpty
    @Size(min = 3, max = 255)
    private String nama;

    @NotNull
    private LocalDateTime waktu_kegiatan_rencana;

    private LocalDateTime waktu_kegiatan_realisasi;

    @Column(columnDefinition = "TEXT")
    private String catatan_acara;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotNull @NotEmpty @Size(min = 3, max = 255) String getNama() {
        return nama;
    }

    public void setNama(@NotNull @NotEmpty @Size(min = 3, max = 255) String nama) {
        this.nama = nama;
    }

    public @NotNull LocalDateTime getWaktu_kegiatan_rencana() {
        return waktu_kegiatan_rencana;
    }

    public void setWaktu_kegiatan_rencana(@NotNull LocalDateTime waktu_kegiatan_rencana) {
        this.waktu_kegiatan_rencana = waktu_kegiatan_rencana;
    }

    public LocalDateTime getWaktu_kegiatan_realisasi() {
        return waktu_kegiatan_realisasi;
    }

    public void setWaktu_kegiatan_realisasi(LocalDateTime waktu_kegiatan_realisasi) {
        this.waktu_kegiatan_realisasi = waktu_kegiatan_realisasi;
    }

    public String getCatatan_acara() {
        return catatan_acara;
    }

    public void setCatatan_acara(String catatan_acara) {
        this.catatan_acara = catatan_acara;
    }
}