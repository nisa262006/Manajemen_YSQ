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
    private String nomor_handphone;

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

    public @NotNull @NotEmpty @Email @Size(min = 3, max = 50) String getEmail() {
        return email;
    }

    public void setEmail(@NotNull @NotEmpty @Email @Size(min = 3, max = 50) String email) {
        this.email = email;
    }

    public @NotNull @NotEmpty @Size(min = 3, max = 50) String getNomor_handphone() {
        return nomor_handphone;
    }

    public void setNomor_handphone(@NotNull @NotEmpty @Size(min = 3, max = 50) String nomor_handphone) {
        this.nomor_handphone = nomor_handphone;
    }
}
