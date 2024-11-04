package com.sahabatquran.app.web.controller;

import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.entity.Peserta;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    // Dashboard
    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }

    // Data Pengajar
    @GetMapping("/data-pengajar")
    public String adminDataPengajar(Model model) {
        List<Pengajar> pengajars = new ArrayList<>();
        pengajars.add(new Pengajar("Ahmad", "ahmad@example.com", "08123456789"));
        pengajars.add(new Pengajar("Siti", "siti@example.com", "08234567890"));
        pengajars.add(new Pengajar("Budi", "budi@example.com", "08345678901"));
        pengajars.add(new Pengajar("Joni", "joni@example.com", "08456789012"));
        pengajars.add(new Pengajar("Rina", "rina@example.com", "08567890123"));

        model.addAttribute("pengajars", pengajars);

        return "admin/dataPengajar/dataPengajar";
    }
    @GetMapping("/add-data-pengajar")
    public String adminAddDataPengajar() {
        return "admin/dataPengajar/addDataPengajar";
    }
    @GetMapping("/edit-data-pengajar")
    public String adminEditDataPengajar(Model model) {
        return "admin/dataPengajar/editDataPengajar";
    }

    // Data Peserta
    @GetMapping("/data-peserta")
    public String adminDataPeserta(Model model) {
        List<Peserta> pesertas = new ArrayList<>();
        pesertas.add(new Peserta("Andi", "andi@example.com", "08712345678"));
        pesertas.add(new Peserta("Dewi", "dewi@example.com", "08823456789"));
        pesertas.add(new Peserta("Sari", "sari@example.com", "08934567890"));
        pesertas.add(new Peserta("Rudi", "rudi@example.com", "09045678901"));
        pesertas.add(new Peserta("Nina", "nina@example.com", "09156789012"));

        model.addAttribute("pesertas", pesertas);

        return "admin/dataPeserta/dataPeserta";
    }

    @GetMapping("/add-data-peserta")
    public String adminAddDataPeserta() {
        return "admin/dataPeserta/addDataPeserta";
    }

    @GetMapping("/edit-data-peserta")
    public String adminEditDataPeserta(Model model) {
        return "admin/dataPeserta/editDataPeserta"; // Ganti dengan path yang sesuai
    }


    // Data Bank dan Rekening
    @GetMapping("/data-bank-rekening")
    public String adminDataBankdanRekening() {
        return "admin/dataBankdanRekening/dataBankdanRekening";
    }
    @GetMapping("/add-data-bank-rekening")
    public String adminAddDataBankdanRekening() {
        return "admin/dataBankdanRekening/addDataBankdanRekening";
    }
    @GetMapping("/edit-data-bank-rekening")
    public String adminEditDataBankdanRekening() {
        return "admin/dataBankdanRekening/editDataBankdanRekening";
    }

    // Data Kurikulum
    @GetMapping("/data-kurikulum")
    public String adminDataKurikulum() {
        return "admin/dataKurikulum/dataKurikulum";
    }
    @GetMapping("/add-data-kurikulum")
    public String adminAddDataKurikulum() {
        return "admin/dataKurikulum/addDataKurikulum";
    }
    @GetMapping("/edit-data-kurikulum")
    public String adminEditDataKurikulum() {
        return "admin/dataKurikulum/editDataKurikulum";
    }

    // Data Kelas
    @GetMapping("/data-kelas")
    public String adminDataKelas() {
        return "admin/dataKelas/dataKelas";
    }
    @GetMapping("/add-data-kelas")
    public String adminAddDataKelas() {
        return "admin/dataKelas/addDataKelas";
    }
    @GetMapping("/edit-data-kelas")
    public String adminEditDataKelas() {
        return "admin/dataKelas/editDataKelas";
    }

    // Data Ruangan
    @GetMapping("/data-ruangan")
    public String adminDataRuangan() {
        return "admin/dataRuangan/dataRuangan";
    }
    @GetMapping("/add-data-ruangan")
    public String adminAddDataRuangan() {
        return "admin/dataRuangan/addDataRuangan";
    }
    @GetMapping("/edit-data-ruangan")
    public String adminEditDataRuangan() {
        return "admin/dataRuangan/editDataRuangan";
    }

    // Plotting Kelas ke Pengajar
    @GetMapping("/plotting-kelas-pengajar")
    public String adminPlottingKelaskePengajar() {
        return "admin/plottingKelasPengajar/plottingKelasPengajar";
    }
    @GetMapping("/add-plotting-kelas-pengajar")
    public String adminAddPlottingKelaskePengajar() {
        return "admin/plottingKelasPengajar/addPlottingKelasPengajar";
    }
    @GetMapping("/edit-plotting-kelas-pengajar")
    public String adminEditPlottingKelaskePengajar() {
        return "admin/plottingKelasPengajar/editPlottingKelasPengajar";
    }

    // Plotting Kurikulum ke Kelas
    @GetMapping("/plotting-kurikulum-kelas")
    public String adminPlottingKurikulumkeKelas() {
        return "admin/plottingKurikulumKelas/plottingKurikulumKelas";
    }
    @GetMapping("/add-plotting-kurikulum-kelas")
    public String adminAddPlottingKurikulumkeKelas() {
        return "admin/plottingKurikulumKelas/addPlottingKurikulumKelas";
    }
    @GetMapping("/edit-plotting-kurikulum-kelas")
    public String adminEditPlottingKurikulumkeKelas() {
        return "admin/plottingKurikulumKelas/editPlottingKurikulumKelas";
    }

    // Plotting Kelas ke Ruangan
    @GetMapping("/plotting-kelas-ruangan")
    public String adminPlottingKelaskeRuangan() {
        return "admin/plottingKelasRuangan/plottingKelasRuangan";
    }
    @GetMapping("/add-plotting-kelas-ruangan")
    public String adminAddPlottingKelaskeRuangan() {
        return "admin/plottingKelasRuangan/addPlottingKelasRuangan";
    }
    @GetMapping("/edit-plotting-kelas-ruangan")
    public String adminEditPlottingKelaskeRuangan() {
        return "admin/plottingKelasRuangan/editPlottingKelasRuangan";
    }

    // Jadwal Belajar
    @GetMapping("/jadwal-belajar")
    public String adminJadwalBelajar() {
        return "admin/jadwalBelajar/jadwalBelajar";
    }
    @GetMapping("/add-jadwal-belajar")
    public String adminAddJadwalBelajar() {
        return "admin/jadwalBelajar/addJadwalBelajar";
    }
    @GetMapping("/edit-jadwal-belajar")
    public String adminEditJadwalBelajar() {
        return "admin/jadwalBelajar/editJadwalBelajar";
    }

    // Parameter Penilaian
    @GetMapping("/parameter-penilaian")
    public String adminParameterPenilaian() {
        return "admin/parameterPenilaianUjian/parameterPenilaianUjian";
    }
    @GetMapping("/add-parameter-penilaian")
    public String adminAddParameterPenilaian() {
        return "admin/parameterPenilaianUjian/addParameterPenilaianUjian";
    }
    @GetMapping("/edit-parameter-penilaian")
    public String adminEditParameterPenilaian() {
        return "admin/parameterPenilaianUjian/editParameterPenilaianUjian";
    }

    // Jadwal Ujian
    @GetMapping("/jadwal-ujian")
    public String adminJadwalUjian() {
        return "admin/jadwalUjian/jadwalUjian";
    }
    @GetMapping("/add-jadwal-ujian")
    public String adminAddJadwalUjian() {
        return "admin/jadwalUjian/addJadwalUjian";
    }
    @GetMapping("/edit-jadwal-ujian")
    public String adminEditJadwalUjian() {
        return "admin/jadwalUjian/editJadwalUjian";
    }

    // Soal Ujian
    @GetMapping("/soal-ujian")
    public String adminSoalUjian() {
        return "admin/soalUjian/soalUjian";
    }
    @GetMapping("/add-soal-ujian")
    public String adminAddSoalUjian() {
        return "admin/soalUjian/addSoalUjian";
    }
    @GetMapping("/edit-soal-ujian")
    public String adminEditSoalUjian() {
        return "admin/soalUjian/editSoalUjian";
    }

    // Event
    @GetMapping("/event")
    public String adminEvent() {
        return "admin/event/event";
    }
    @GetMapping("/add-event")
    public String adminAddEvent() {
        return "admin/event/addEvent";
    }
    @GetMapping("/edit-event")
    public String adminEditEvent() {
        return "admin/event/editEvent";
    }

    // Event Kehadiran
    @GetMapping("/event-kehadiran")
    public String adminEventKehadiran() {
        return "admin/eventKehadiran/eventKehadiran";
    }
    @GetMapping("/add-event-kehadiran")
    public String adminAddEventKehdiran() {
        return "admin/eventKehadiran/addEventKehadiran";
    }
    @GetMapping("/edit-event-kehadiran")
    public String adminEditEventKehadiran() {
        return "admin/eventKehadiran/editEventKehadiran";
    }
}
