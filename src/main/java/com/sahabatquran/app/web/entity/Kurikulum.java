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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotNull @NotEmpty @Size(min = 3, max = 100) String getKode() {
        return kode;
    }

    public void setKode(@NotNull @NotEmpty @Size(min = 3, max = 100) String kode) {
        this.kode = kode;
    }

    public @NotNull @NotEmpty @Size(min = 3, max = 200) String getNama() {
        return nama;
    }

    public void setNama(@NotNull @NotEmpty @Size(min = 3, max = 200) String nama) {
        this.nama = nama;
    }

    public @NotNull Boolean getAktif() {
        return aktif;
    }

    public void setAktif(@NotNull Boolean aktif) {
        this.aktif = aktif;
    }
}
