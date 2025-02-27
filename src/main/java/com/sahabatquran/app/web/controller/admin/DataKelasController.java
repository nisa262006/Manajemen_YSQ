package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Hari;
import com.sahabatquran.app.web.entity.Kelas;
import com.sahabatquran.app.web.repository.admin.DataKelasRepository;
import com.sahabatquran.app.web.repository.admin.DataMataPelajaranRepository;
import com.sahabatquran.app.web.repository.admin.DataPengajarRepository;
import com.sahabatquran.app.web.service.admin.DataKelasService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class DataKelasController {

    @Autowired
    private DataKelasRepository dataKelasRepository;

    @Autowired
    private DataPengajarRepository dataPengajarRepository;

    @Autowired
    private DataMataPelajaranRepository dataMataPelajaranRepository;

    @Autowired
    private DataKelasService dataKelasService;

    @GetMapping("/data-kelas")
    public String adminDataKelas(Model model) {
        List<Kelas> kelasList = dataKelasRepository.findAll();
        model.addAttribute("kelasList", kelasList);
        return "admin/dataKelas/dataKelas";
    }

    @GetMapping("/add-data-kelas")
    public String getFormDataKelas(Model model) {
        model.addAttribute("mataPelajaranList", dataMataPelajaranRepository.findAll());
        model.addAttribute("pengajarList", dataPengajarRepository.findAll());
        model.addAttribute("hariList", Hari.values());
        return "admin/dataKelas/addDataKelas";
    }


    @PostMapping("/save-data-kelas")
    public String saveDataKelas(@Valid Kelas kelas, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("kelas", kelas);
            return "admin/dataKelas/addDataKelas";
        }

        dataKelasService.saveKelas(kelas);
        return "redirect:/admin/data-kelas";
    }

    @GetMapping("/edit-data-kelas/{id}")
    public String adminEditDataKelas(@PathVariable("id") String id, Model model) {
        Kelas kelas = dataKelasRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid kelas Id: " + id));
        model.addAttribute("kelas", kelas);
        model.addAttribute("mataPelajaranList", dataMataPelajaranRepository.findAll());
        model.addAttribute("pengajarList", dataPengajarRepository.findAll());
        model.addAttribute("hariList", Hari.values());

        return "admin/dataKelas/editDataKelas";
    }

    @PostMapping("/save-edit-data-kelas")
    public String saveEditDataKelas(@Valid @ModelAttribute Kelas kelas, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("kelas", kelas);
            return "admin/dataKelas/editDataKelas";
        }

        try {
            dataKelasService.editKelas(kelas.getId(), kelas);
        } catch (IllegalArgumentException e) {
            model.addAttribute("error", e.getMessage());
            return "admin/dataKelas/editDataKelas";
        }

        return "redirect:/admin/data-kelas";
    }

    @GetMapping("/delete-data-kelas/{id}")
    public String adminDeleteDataKelas(@PathVariable("id") String id) {
        dataKelasService.deleteKelas(id);
        return "redirect:/admin/data-kelas";
    }
}
