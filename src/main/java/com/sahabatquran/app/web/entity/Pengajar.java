package com.sahabatquran.app.web.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity @Data 
public class Pengajar {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @NotEmpty
    private String nama;

    @NotNull @NotEmpty @Email
    private String email;

    @NotNull @NotEmpty
    @Column(name = "nomor_handphone")
    private String nomorHandphone;

}
