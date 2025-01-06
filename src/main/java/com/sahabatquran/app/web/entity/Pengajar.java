package com.sahabatquran.app.web.entity;

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
    private String nomor_handphone;

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

    public @NotNull @NotEmpty @Email String getEmail() {
        return email;
    }

    public void setEmail(@NotNull @NotEmpty @Email String email) {
        this.email = email;
    }

    public @NotNull @NotEmpty String getNomor_handphone() {
        return nomor_handphone;
    }

    public void setNomor_handphone(@NotNull @NotEmpty String nomor_handphone) {
        this.nomor_handphone = nomor_handphone;
    }
}
