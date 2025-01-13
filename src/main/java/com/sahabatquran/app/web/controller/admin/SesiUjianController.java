package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.SesiUjian;
import com.sahabatquran.app.web.repository.admin.SesiUjianRepository;
import com.sahabatquran.app.web.repository.admin.UjianRepository;
import com.sahabatquran.app.web.service.admin.SesiUjianService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin")
public class SesiUjianController {

    @Autowired
    private SesiUjianRepository sesiUjianRepository;

    @Autowired
    private UjianRepository ujianRepository;

    @Autowired
    private SesiUjianService sesiUjianService;

    @GetMapping("/sesi-ujian")
    public String getSesiUjian(Model model) {
        List<SesiUjian> sesiUjianList = sesiUjianRepository.findAll();
        model.addAttribute("sesiUjianList", sesiUjianList);
        return "admin/sesiUjian/sesiUjian";
    }

    @GetMapping("/add-sesi-ujian")
    public String addSesiUjianForm(Model model) {
        model.addAttribute("sesiUjian", new SesiUjian());
        model.addAttribute("ujianList", ujianRepository.findAll());
        return "admin/sesiUjian/addSesiUjian";
    }

    @PostMapping("/save-sesi-ujian")
    public String saveSesiUjian(@Valid @ModelAttribute SesiUjian sesiUjian, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("ujianList", ujianRepository.findAll());
            model.addAttribute("sesiUjian", sesiUjian);
            return "admin/sesiUjian/addSesiUjian";
        }
        sesiUjianService.saveSesiUjian(sesiUjian);
        return "redirect:/admin/sesi-ujian";
    }

    @GetMapping("/edit-sesi-ujian/{id}")
    public String editSesiUjianForm(@PathVariable("id") String id, Model model) {
        SesiUjian sesiUjian = sesiUjianRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid sesi ujian Id: " + id));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
        model.addAttribute("formattedWaktuMulai", sesiUjian.getWaktuMulai().format(formatter));
        model.addAttribute("formattedWaktuSelesai", sesiUjian.getWaktuSelesai().format(formatter));

        model.addAttribute("sesiUjian", sesiUjian);
        model.addAttribute("ujianList", ujianRepository.findAll());
        return "admin/sesiUjian/editSesiUjian";
    }

    @PostMapping("/save-edit-sesi-ujian")
    public String saveEditSesiUjian(@Valid @ModelAttribute SesiUjian sesiUjian, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("sesiUjian", sesiUjian);
            model.addAttribute("ujianList", ujianRepository.findAll());
            return "admin/sesiUjian/editSesiUjian";
        }

        sesiUjianService.updateSesiUjian(sesiUjian.getId(), sesiUjian);
        return "redirect:/admin/sesi-ujian";
    }

    @GetMapping("/delete-sesi-ujian/{id}")
    public String deleteSesiUjian(@PathVariable("id") String id) {
        sesiUjianService.deleteSesiUjian(id);
        return "redirect:/admin/sesi-ujian";
    }
}
