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

import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.service.KurikulumService;

import jakarta.validation.Valid;

@Controller
@RequestMapping("/kurikulum")
public class KurikulumController {

    @Autowired
    private KurikulumService kurikulumService;

    @GetMapping
    public String listKurikulum(@RequestParam(required = false) String search, Model model) {
        List<Kurikulum> kurikulums;
        
        if (search != null && !search.trim().isEmpty()) {
            kurikulums = kurikulumService.findByNamaContaining(search.trim());
            model.addAttribute("search", search);
        } else {
            kurikulums = kurikulumService.findAll();
        }
        
        model.addAttribute("kurikulums", kurikulums);
        return "kurikulum/list";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("kurikulum", new Kurikulum());
        model.addAttribute("isEdit", false);
        return "kurikulum/form";
    }

    @PostMapping
    public String createKurikulum(@Valid @ModelAttribute Kurikulum kurikulum, 
                                BindingResult result, 
                                RedirectAttributes redirectAttributes,
                                Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("isEdit", false);
            return "kurikulum/form";
        }

        try {
            kurikulumService.save(kurikulum);
            redirectAttributes.addFlashAttribute("successMessage", "Kurikulum berhasil ditambahkan");
            return "redirect:/kurikulum";
        } catch (KurikulumService.KurikulumValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("isEdit", false);
            return "kurikulum/form";
        }
    }

    @GetMapping("/{id}")
    public String showKurikulum(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Kurikulum> kurikulum = kurikulumService.findById(id);
        
        if (kurikulum.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Kurikulum tidak ditemukan");
            return "redirect:/kurikulum";
        }
        
        model.addAttribute("kurikulum", kurikulum.get());
        return "kurikulum/detail";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Kurikulum> kurikulum = kurikulumService.findById(id);
        
        if (kurikulum.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Kurikulum tidak ditemukan");
            return "redirect:/kurikulum";
        }
        
        model.addAttribute("kurikulum", kurikulum.get());
        model.addAttribute("isEdit", true);
        return "kurikulum/form";
    }

    @PostMapping("/{id}")
    public String updateKurikulum(@PathVariable String id,
                                @Valid @ModelAttribute Kurikulum kurikulum,
                                BindingResult result,
                                RedirectAttributes redirectAttributes,
                                Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("isEdit", true);
            return "kurikulum/form";
        }

        try {
            kurikulumService.update(id, kurikulum);
            redirectAttributes.addFlashAttribute("successMessage", "Kurikulum berhasil diperbarui");
            return "redirect:/kurikulum";
        } catch (KurikulumService.KurikulumNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/kurikulum";
        } catch (KurikulumService.KurikulumValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("isEdit", true);
            return "kurikulum/form";
        }
    }

    @PostMapping("/{id}/delete")
    public String deleteKurikulum(@PathVariable String id, RedirectAttributes redirectAttributes) {
        try {
            kurikulumService.deleteById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Kurikulum berhasil dihapus");
        } catch (KurikulumService.KurikulumNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        
        return "redirect:/kurikulum";
    }
}