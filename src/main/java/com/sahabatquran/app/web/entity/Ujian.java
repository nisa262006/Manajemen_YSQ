package com.sahabatquran.app.web.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class Ujian {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_mata_pelajaran")
    private MataPelajaran mataPelajaran;

    @NotNull @NotEmpty
    private String namaUjian;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotNull MataPelajaran getMataPelajaran() {
        return mataPelajaran;
    }

    public void setMataPelajaran(@NotNull MataPelajaran mataPelajaran) {
        this.mataPelajaran = mataPelajaran;
    }

    public @NotNull @NotEmpty String getNamaUjian() {
        return namaUjian;
    }

    public void setNamaUjian(@NotNull @NotEmpty String namaUjian) {
        this.namaUjian = namaUjian;
    }
}
