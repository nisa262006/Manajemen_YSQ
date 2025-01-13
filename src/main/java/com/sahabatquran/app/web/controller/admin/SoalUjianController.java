package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.SoalUjian;
import com.sahabatquran.app.web.repository.admin.SoalUjianRepository;
import com.sahabatquran.app.web.repository.admin.UjianRepository;
import com.sahabatquran.app.web.service.admin.SoalUjianService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class SoalUjianController {

    @Autowired
    private SoalUjianRepository soalUjianRepository;

    @Autowired
    private UjianRepository ujianRepository;

    @Autowired
    private SoalUjianService soalUjianService;

    @GetMapping("/soal-ujian")
    public String getSoalUjian(Model model) {
        List<SoalUjian> soalUjianList = soalUjianRepository.findAll();
        model.addAttribute("soalUjianList", soalUjianList);
        return "admin/soalUjian/soalUjian";
    }

    @GetMapping("/add-soal-ujian")
    public String addSoalUjianForm(Model model) {
        model.addAttribute("soalUjian", new SoalUjian());
        model.addAttribute("ujianList", ujianRepository.findAll());
        return "admin/soalUjian/addSoalUjian";
    }

    @PostMapping("/save-soal-ujian")
    public String saveSoalUjian(@Valid @ModelAttribute SoalUjian soalUjian, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("ujianList", ujianRepository.findAll());
            model.addAttribute("soalUjian", soalUjian);
            return "admin/soalUjian/addSoalUjian";
        }
        soalUjianService.saveSoalUjian(soalUjian);
        return "redirect:/admin/soal-ujian";
    }


    @GetMapping("/edit-soal-ujian/{id}")
    public String editSoalUjianForm(@PathVariable("id") String id, Model model) {
        SoalUjian soalUjian = soalUjianRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid soal ujian Id: " + id));
        model.addAttribute("soalUjian", soalUjian);
        model.addAttribute("ujianList", ujianRepository.findAll());
        return "admin/soalUjian/editSoalUjian";
    }

    @PostMapping("/save-edit-soal-ujian")
    public String saveEditSoalUjian(@Valid @ModelAttribute SoalUjian soalUjian, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("soalUjian", soalUjian);
            model.addAttribute("ujianList", ujianRepository.findAll());
            return "admin/soalUjian/editSoalUjian";
        }

        soalUjianService.updateSoalUjian(soalUjian.getId(), soalUjian);
        return "redirect:/admin/soal-ujian";
    }

    @GetMapping("/delete-soal-ujian/{id}")
    public String deleteSoalUjian(@PathVariable("id") String id) {
        soalUjianService.deleteSoalUjian(id);
        return "redirect:/admin/soal-ujian";
    }
}