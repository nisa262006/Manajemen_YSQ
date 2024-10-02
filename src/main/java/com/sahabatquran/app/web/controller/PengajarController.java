package com.sahabatquran.app.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping("/nilai-ujian")
    public String nilaiUjian() {
        return "pengajar/nilai-ujian";
    }

    @GetMapping("/jadwal")
    public String jadwalBelajar() {
        return "pengajar/jadwal";
    }
}
