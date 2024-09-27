package com.sahabatquran.app.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }

    @GetMapping("/data-pengajar")
    public String adminDataPengajar() {
        return "admin/dataPengajar";
    }

    @GetMapping("/data-bank-rekening")
    public String adminDataBankdanRekening() {
        return "admin/dataBankdanRekening";
    }

    @GetMapping("/data-kurikulum")
    public String adminDataKurikulum() {
        return "admin/dataKurikulum";
    }

    @GetMapping("/data-kelas")
    public String adminDataKelas() {
        return "admin/dataKelas";
    }

    @GetMapping("/data-ruangan")
    public String adminDataRuangan() {
        return "admin/dataRuangan";
    }

    @GetMapping("/soal-ujian")
    public String adminSoalUjian() {
        return "admin/soalUjian";
    }

    @GetMapping("/plotting-kelas-pengajar")
    public String adminPlottingKelaskePengajar() {
        return "admin/plottingKelasPengajar";
    }

    @GetMapping("/plotting-kurikulum-kelas")
    public String adminPlottingKurikulumkeKelas() {
        return "admin/plottingKurikulumKelas";
    }

    @GetMapping("/plotting-kelas-ruangan")
    public String adminPlottingKelaskeRuangan() {
        return "admin/plottingKelasRuangan";
    }

    @GetMapping("/jadwal-belajar")
    public String adminJadwalBelajar() {
        return "admin/jadwalBelajar";
    }
}
