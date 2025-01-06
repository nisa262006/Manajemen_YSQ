package com.sahabatquran.app.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/pengajar")
public class PengajarController {

    @GetMapping("/dashboard")
    public String pengajarDashboard() {
        return "pengajar/dashboard";
    }

    @GetMapping("/daftar-kelas")
    public String pengajarDaftarKelas() {
        return "pengajar/daftar-kelas";
    }

    @GetMapping("/slip-gaji")
    public String slipGaji(){
        return "pengajar/slip-gaji";
    }

    // Not in use -> included in sesi-belajar
    // @GetMapping("/nilai-ujian")
    // public String nilaiUjian() {
    //     return "pengajar/nilai-ujian";
    // }

    @GetMapping("/jadwal")
    public String jadwalBelajar() {
        return "pengajar/jadwal";
    }

    @GetMapping("/sesi-belajar")
    public String sesiBelajar() {
        return "pengajar/sesi-belajar";
    }

    @GetMapping("/ujian-praktik")
    public String ujianPraktik() {
        return "pengajar/ujian-praktik";
    }   

    @GetMapping("/rekap-pengajaran")
    public String rekapPengajaran() {
        return "pengajar/rekap-pengajaran";
    }   

    @GetMapping("/rekap-ujian")
    public String rekapUjian() {
        return "pengajar/rekap-ujian";
    }   

    // Not used -> included in sesi-belajar
    @GetMapping("/mutabaah")
    public String mutabaah() {
        return "pengajar/mutabaah";
    }   

    @GetMapping("/berita-acara")
    public String beritaAcara() {
        return "pengajar/berita-acara";
    }   
}
