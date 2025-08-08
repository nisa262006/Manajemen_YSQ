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

import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.service.PengajarService;

import jakarta.validation.Valid;

@Controller
@RequestMapping("/pengajar")
public class PengajarController {

    @Autowired
    private PengajarService pengajarService;

    @GetMapping
    public String listPengajar(@RequestParam(required = false) String search, Model model) {
        List<Pengajar> pengajars;
        
        if (search != null && !search.trim().isEmpty()) {
            pengajars = pengajarService.findByNamaContaining(search.trim());
            model.addAttribute("search", search);
        } else {
            pengajars = pengajarService.findAll();
        }
        
        model.addAttribute("pengajars", pengajars);
        return "pengajar/list";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("pengajar", new Pengajar());
        model.addAttribute("isEdit", false);
        return "pengajar/form";
    }

    @PostMapping
    public String createPengajar(@Valid @ModelAttribute Pengajar pengajar, 
                                BindingResult result, 
                                RedirectAttributes redirectAttributes,
                                Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("isEdit", false);
            return "pengajar/form";
        }

        try {
            pengajarService.save(pengajar);
            redirectAttributes.addFlashAttribute("successMessage", "Pengajar berhasil ditambahkan");
            return "redirect:/pengajar";
        } catch (PengajarService.PengajarValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("isEdit", false);
            return "pengajar/form";
        }
    }

    @GetMapping("/{id}")
    public String showPengajar(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Pengajar> pengajar = pengajarService.findById(id);
        
        if (pengajar.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Pengajar tidak ditemukan");
            return "redirect:/pengajar";
        }
        
        model.addAttribute("pengajar", pengajar.get());
        return "pengajar/detail";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Pengajar> pengajar = pengajarService.findById(id);
        
        if (pengajar.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Pengajar tidak ditemukan");
            return "redirect:/pengajar";
        }
        
        model.addAttribute("pengajar", pengajar.get());
        model.addAttribute("isEdit", true);
        return "pengajar/form";
    }

    @PostMapping("/{id}")
    public String updatePengajar(@PathVariable String id,
                                @Valid @ModelAttribute Pengajar pengajar,
                                BindingResult result,
                                RedirectAttributes redirectAttributes,
                                Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("isEdit", true);
            return "pengajar/form";
        }

        try {
            pengajarService.update(id, pengajar);
            redirectAttributes.addFlashAttribute("successMessage", "Pengajar berhasil diperbarui");
            return "redirect:/pengajar";
        } catch (PengajarService.PengajarNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/pengajar";
        } catch (PengajarService.PengajarValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("isEdit", true);
            return "pengajar/form";
        }
    }

    @PostMapping("/{id}/delete")
    public String deletePengajar(@PathVariable String id, RedirectAttributes redirectAttributes) {
        try {
            pengajarService.deleteById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Pengajar berhasil dihapus");
        } catch (PengajarService.PengajarNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        
        return "redirect:/pengajar";
    }
}