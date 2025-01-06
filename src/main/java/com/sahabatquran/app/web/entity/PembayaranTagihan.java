package com.sahabatquran.app.web.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data
public class PembayaranTagihan {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_tagihan")
    private Tagihan tagihan;

    @NotNull
    private BigDecimal nilaiPembayaran;

    @NotNull
    private LocalDateTime waktuPembayaran = LocalDateTime.now();

    @NotNull
    @Enumerated(EnumType.STRING)
    private KanalPembayaran kanalPembayaran;

    @NotNull @NotEmpty
    private String referensi;
}
