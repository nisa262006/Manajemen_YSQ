package com.sahabatquran.app.web.entity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class SesiUjian {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_ujian")
    private Ujian ujian;

    @NotNull
    private LocalDateTime waktuMulai;
    private LocalDateTime waktuSelesai;

    public String getSesi() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");
        return (waktuMulai != null && waktuSelesai != null) ?
                waktuMulai.format(formatter) + " - " + waktuSelesai.format(formatter) : "";
    }
}
