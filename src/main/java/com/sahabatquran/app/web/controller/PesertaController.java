package com.sahabatquran.app.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/peserta")
public class PesertaController {

    @GetMapping("/dashboard")
    public String pesertaDashboard() {
        return "peserta/dashboard";
    }

    @GetMapping("/lihat-tagihan")
    public String pesertaLihatTagihan() {
        return "peserta/lihatTagihan";
    }

    @GetMapping("/pembayaran")
    public String pesertaPembayaran() {
        return "peserta/pembayaran";
    }

    @GetMapping("/jadwal")
    public String pesertaJadwal() {
        return "peserta/jadwalBelajar";
    }

    @GetMapping("/mutabaah")
    public String pesertaInputMutabaah() {
        return "peserta/inputMutabaah";
    }

    @GetMapping("/event")
    public String pesertaJadwalEvent() {
        return "peserta/jadwalEvent";
    }

    @GetMapping("/laporan")
    public String pesertaLaporanBelajar() {
        return "peserta/laporanBelajar";
    }
}
