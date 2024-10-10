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
}
