package com.sahabatquran.app.web.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity @Data
public class Peserta {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull @NotEmpty
    @Size(min = 3, max = 255)
    private String nama;

    @NotNull @NotEmpty @Email
    @Size(min = 3, max = 50)
    private String email;

    @NotNull @NotEmpty
    @Size(min = 3, max = 50)
    private String nomorHandphone;

}
