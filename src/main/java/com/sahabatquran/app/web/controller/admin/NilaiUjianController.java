package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.NilaiUjian;
import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.entity.Ujian;
import com.sahabatquran.app.web.repository.admin.DataPesertaRepository;
import com.sahabatquran.app.web.repository.admin.NilaiUjianRepository;
import com.sahabatquran.app.web.repository.admin.UjianRepository;
import com.sahabatquran.app.web.service.admin.NilaiUjianService;
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
public class NilaiUjianController {

    @Autowired
    private NilaiUjianRepository nilaiUjianRepository;

    @Autowired
    private DataPesertaRepository pesertaRepository;

    @Autowired
    private UjianRepository ujianRepository;

    @Autowired
    private NilaiUjianService nilaiUjianService;

    @GetMapping("/nilai-ujian")
    public String adminDataNilaiUjian(Model model) {
        List<NilaiUjian> nilaiList = nilaiUjianRepository.findAll();
        model.addAttribute("nilaiList", nilaiList);
        return "admin/nilaiUjian/nilaiUjian";
    }

    @GetMapping("/add-nilai-ujian")
    public String adminAddNilaiUjian(Model model) {
        List<Peserta> namaList = pesertaRepository.findAll(); // Ambil daftar peserta dari database
        List<Ujian> ujianList = ujianRepository.findAll(); // Ambil daftar ujian dari database

        model.addAttribute("namaList", namaList);
        model.addAttribute("ujianList", ujianList);

        return "admin/nilaiUjian/addNilaiUjian";
    }

    @PostMapping("/save-nilai-ujian")
    public String saveNilaiUjian(@Valid NilaiUjian nilaiUjian, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("nilaiUjian", nilaiUjian);
            return "admin/nilaiUjian/addNilaiUjian";
        }

        nilaiUjianService.saveNilaiUjian(nilaiUjian);
        return "redirect:/admin/nilai-ujian";
    }

    @GetMapping("/edit-nilai-ujian/{id}")
    public String adminEditNilaiUjian(@PathVariable("id") UUID id, Model model) {
        NilaiUjian nilaiUjian = nilaiUjianRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid Nilai Ujian Id: " + id));
        model.addAttribute("nilaiUjian", nilaiUjian);
        return "admin/nilaiUjian/editNilaiUjian";
    }

    @PostMapping("/save-edit-nilai-ujian")
    public String saveEditNilaiUjian(@Valid @ModelAttribute NilaiUjian nilaiUjian, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("nilaiUjian", nilaiUjian);
            return "admin/nilaiUjian/editNilaiUjian";
        }

        NilaiUjian updatedNilai = nilaiUjianService.editNilaiUjian(nilaiUjian.getId(), nilaiUjian);
        if (updatedNilai == null) {
            model.addAttribute("error", "Nilai Ujian not found");
            return "admin/nilaiUjian/editNilaiUjian";
        }

        return "redirect:/admin/nilai-ujian";
    }

    @GetMapping("/delete-nilai-ujian/{id}")
    public String adminDeleteNilaiUjian(@PathVariable("id") UUID id) {
        nilaiUjianService.deleteNilaiUjian(id);
        return "redirect:/admin/nilai-ujian";
    }
}