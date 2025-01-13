package com.sahabatquran.app.web.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class SoalUjian {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_ujian")
    private Ujian ujian;

    @NotNull @Min(1)
    private Integer urutan;

    @NotNull @NotEmpty
    private String pertanyaan;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotNull Ujian getUjian() {
        return ujian;
    }

    public void setUjian(@NotNull Ujian ujian) {
        this.ujian = ujian;
    }

    public @NotNull @Min(1) Integer getUrutan() {
        return urutan;
    }

    public void setUrutan(@NotNull @Min(1) Integer urutan) {
        this.urutan = urutan;
    }

    public @NotNull @NotEmpty String getPertanyaan() {
        return pertanyaan;
    }

    public void setPertanyaan(@NotNull @NotEmpty String pertanyaan) {
        this.pertanyaan = pertanyaan;
    }
}
