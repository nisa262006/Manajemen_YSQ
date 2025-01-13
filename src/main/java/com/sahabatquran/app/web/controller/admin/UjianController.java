package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.entity.Ujian;
import com.sahabatquran.app.web.repository.admin.DataMataPelajaranRepository;
import com.sahabatquran.app.web.repository.admin.UjianRepository;
import com.sahabatquran.app.web.service.admin.UjianService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/admin")
public class UjianController {

    @Autowired
    private UjianRepository ujianRepository;

    @Autowired
    private DataMataPelajaranRepository dataMataPelajaranRepository;

    @Autowired
    private UjianService ujianService;

    @GetMapping("/ujian")
    public String adminUjian(Model model) {
        List<Ujian> ujians = ujianRepository.findAll();
        model.addAttribute("ujians", ujians);
        return "admin/ujian/ujian";
    }

    @GetMapping("/add-ujian")
    public String addUjian(Model model) {
        List<MataPelajaran> mataPelajarans = dataMataPelajaranRepository.findAll();
        model.addAttribute("mataPelajarans", mataPelajarans);
        return "admin/ujian/addUjian";
    }

    @PostMapping("/save-ujian")
    public String saveUjian(@RequestParam("mata_pelajaran_id") String mataPelajaranId,
                            @RequestParam("nama_ujian") String namaUjian,
                            Model model) {
        MataPelajaran mataPelajaran = dataMataPelajaranRepository.findById(mataPelajaranId)
                .orElseThrow(() -> new IllegalArgumentException("Mata pelajaran tidak ditemukan: " + mataPelajaranId));

        Ujian ujian = new Ujian();
        ujian.setMataPelajaran(mataPelajaran);
        ujian.setNamaUjian(namaUjian);

        ujianService.saveUjian(ujian);
        return "redirect:/admin/ujian";
    }

    @GetMapping("/edit-ujian/{id}")
    public String editUjian(@PathVariable("id") String id, Model model) {
        Ujian ujian = ujianRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ujian tidak ditemukan: " + id));
        List<MataPelajaran> mataPelajarans = dataMataPelajaranRepository.findAll();

        model.addAttribute("ujian", ujian);
        model.addAttribute("mataPelajarans", mataPelajarans);

        return "admin/ujian/editUjian"; // Adjust path to your template
    }

    @PostMapping("/update-ujian")
    public String updateUjian(@RequestParam("id") String id,
                              @RequestParam("mata_pelajaran_id") String mataPelajaranId,
                              @RequestParam("nama_ujian") String namaUjian,
                              Model model) {
        Ujian ujian = ujianRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ujian tidak ditemukan: " + id));
        MataPelajaran mataPelajaran = dataMataPelajaranRepository.findById(mataPelajaranId)
                .orElseThrow(() -> new IllegalArgumentException("Mata pelajaran tidak ditemukan: " + mataPelajaranId));

        ujian.setMataPelajaran(mataPelajaran);
        ujian.setNamaUjian(namaUjian);

        ujianService.saveUjian(ujian);
        return "redirect:/admin/ujian";
    }

    @GetMapping("/delete-ujian/{id}")
    public String adminDeleteUjian(@PathVariable("id") UUID id) {
        ujianService.deleteUjian(String.valueOf(id));
        return "redirect:/admin/ujian";
    }
}
