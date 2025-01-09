package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.repository.admin.DataKurikulumRepository;
import com.sahabatquran.app.web.repository.admin.DataMataPelajaranRepository;
import com.sahabatquran.app.web.service.admin.DataMataPelajaranService;
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
public class DataMataPelajaranController {
    @Autowired
    private DataMataPelajaranRepository dataMataPelajaranRepository;

    @Autowired
    private DataKurikulumRepository dataKurikulumRepository;

    @Autowired
    private DataMataPelajaranService dataMataPelajaranService;

    @GetMapping("/data-mata-pelajaran")
    public String adminDataMataPelajaran(Model model) {
        List<MataPelajaran> mataPelajarans = dataMataPelajaranRepository.findAll();
        model.addAttribute("mataPelajarans", mataPelajarans);
        return "admin/dataMataPelajaran/dataMataPelajaran";
    }

    @GetMapping("/add-data-mata-pelajaran")
    public String adminAddMataPelajaran(Model model) {
        List<Kurikulum> kurikulum = dataKurikulumRepository.findAll();
        model.addAttribute("kurikulums", kurikulum);
        model.addAttribute("mataPelajaran", new MataPelajaran());
        return "admin/dataMataPelajaran/addDataMataPelajaran";
    }

    @PostMapping("/save-data-mata-pelajaran")
    public String saveMataPelajaran(@Valid MataPelajaran mataPelajaran, BindingResult result, Model model) {
        if (result.hasErrors()) {
            result.getAllErrors().forEach(error -> System.out.println(error.getDefaultMessage()));
            model.addAttribute("mataPelajaran", mataPelajaran);
            return "admin/dataMataPelajaran/addDataMataPelajaran";
        }

        dataMataPelajaranService.saveMataPelajaran(mataPelajaran);
        return "redirect:/admin/data-mata-pelajaran";
    }

    @GetMapping("/edit-data-mata-pelajaran/{id}")
    public String adminEditDataMataPelajaran(@PathVariable("id") String id, Model model) {
        MataPelajaran mataPelajaran = dataMataPelajaranRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid MataPelajaran Id: " + id));
        model.addAttribute("mataPelajaran", mataPelajaran);
        List<Kurikulum> kurikulums = dataKurikulumRepository.findAll();
        model.addAttribute("kurikulums", kurikulums);
        return "admin/dataMataPelajaran/editDataMataPelajaran";
    }

    @PostMapping("/save-edit-data-mata-pelajaran")
    public String saveEditDataMataPelajaran(@Valid @ModelAttribute MataPelajaran mataPelajaran, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("mataPelajaran", mataPelajaran);
            return "admin/dataMataPelajaran/editDataMataPelajaran";
        }
        MataPelajaran updatedMataPelajaran = dataMataPelajaranService.editMataPelajaran(mataPelajaran.getId(), mataPelajaran);
        if (updatedMataPelajaran == null) {
            model.addAttribute("error", "MataPelajaran not found");
            return "admin/dataMataPelajaran/editDataMataPelajaran";
        }
        return "redirect:/admin/data-mata-pelajaran";
    }

    @GetMapping("/delete-data-mata-pelajaran/{id}")
    public String adminDeleteDataMataPelajaran(@PathVariable("id") UUID id) {
        dataMataPelajaranService.deleteMataPelajaran(id);
        return "redirect:/admin/data-mata-pelajaran";
    }
}
