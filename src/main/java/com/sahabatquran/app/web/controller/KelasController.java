package com.sahabatquran.app.web.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.sahabatquran.app.web.entity.Hari;
import com.sahabatquran.app.web.entity.Kelas;
import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.repository.MataPelajaranRepository;
import com.sahabatquran.app.web.repository.PengajarRepository;
import com.sahabatquran.app.web.service.KelasService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/kelas")
public class KelasController {

    @Autowired
    private KelasService kelasService;

    @Autowired
    private PengajarRepository pengajarRepository;

    @Autowired
    private MataPelajaranRepository mataPelajaranRepository;

    @GetMapping
    public String listKelas(@RequestParam(required = false) String search, 
                           @RequestParam(required = false) String _successMessage,
                           Model model, HttpServletRequest request) {
        
        // Handle backup success message for test environments
        if (_successMessage != null && !_successMessage.trim().isEmpty()) {
            model.addAttribute("successMessage", _successMessage);
        }
        
        List<Kelas> kelasList;
        
        if (search != null && !search.trim().isEmpty()) {
            kelasList = kelasService.findByNamaContaining(search.trim());
            model.addAttribute("search", search);
        } else {
            kelasList = kelasService.findAll();
        }
        
        model.addAttribute("kelasList", kelasList);
        return "kelas/list";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("kelas", new Kelas());
        model.addAttribute("isEdit", false);
        addFormAttributes(model);
        return "kelas/form";
    }

    @PostMapping
    public String createKelas(@Valid @ModelAttribute Kelas kelas, 
                              BindingResult result, 
                              RedirectAttributes redirectAttributes,
                              Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("isEdit", false);
            addFormAttributes(model);
            return "kelas/form";
        }

        try {
            kelasService.save(kelas);
            redirectAttributes.addFlashAttribute("successMessage", "Kelas berhasil ditambahkan");
            // Also add as URL parameter as backup for test environments
            redirectAttributes.addAttribute("_successMessage", "Kelas berhasil ditambahkan");
            return "redirect:/kelas";
        } catch (KelasService.KelasValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("isEdit", false);
            addFormAttributes(model);
            return "kelas/form";
        }
    }

    @GetMapping("/{id}")
    public String showKelas(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Kelas> kelas = kelasService.findById(id);
        
        if (kelas.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Kelas tidak ditemukan");
            return "redirect:/kelas";
        }
        
        model.addAttribute("kelas", kelas.get());
        return "kelas/detail";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Kelas> kelas = kelasService.findById(id);
        
        if (kelas.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Kelas tidak ditemukan");
            return "redirect:/kelas";
        }
        
        model.addAttribute("kelas", kelas.get());
        model.addAttribute("isEdit", true);
        addFormAttributes(model);
        return "kelas/form";
    }

    @PostMapping("/{id}")
    public String updateKelas(@PathVariable String id,
                              @Valid @ModelAttribute Kelas kelas,
                              BindingResult result,
                              RedirectAttributes redirectAttributes,
                              Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("isEdit", true);
            addFormAttributes(model);
            return "kelas/form";
        }

        try {
            kelasService.update(id, kelas);
            redirectAttributes.addFlashAttribute("successMessage", "Kelas berhasil diperbarui");
            return "redirect:/kelas";
        } catch (KelasService.KelasNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/kelas";
        } catch (KelasService.KelasValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("isEdit", true);
            addFormAttributes(model);
            return "kelas/form";
        }
    }

    @PostMapping("/{id}/delete")
    public String deleteKelas(@PathVariable String id, RedirectAttributes redirectAttributes) {
        try {
            kelasService.deleteById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Kelas berhasil dihapus");
        } catch (KelasService.KelasNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        
        return "redirect:/kelas";
    }

    private void addFormAttributes(Model model) {
        List<Pengajar> pengajars = pengajarRepository.findAll();
        List<MataPelajaran> mataPelajarans = mataPelajaranRepository.findAll();
        
        model.addAttribute("pengajars", pengajars);
        model.addAttribute("mataPelajarans", mataPelajarans);
        model.addAttribute("hariList", Hari.values());
    }
}