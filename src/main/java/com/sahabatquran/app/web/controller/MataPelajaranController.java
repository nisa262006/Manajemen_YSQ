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

import com.sahabatquran.app.web.entity.MataPelajaran;
import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.service.MataPelajaranService;
import com.sahabatquran.app.web.service.KurikulumService;

import jakarta.validation.Valid;

@Controller
@RequestMapping("/mata-pelajaran")
public class MataPelajaranController {

    @Autowired
    private MataPelajaranService mataPelajaranService;

    @Autowired
    private KurikulumService kurikulumService;

    @GetMapping
    public String listMataPelajaran(@RequestParam(required = false) String search, 
                                   @RequestParam(required = false) String kurikulumId,
                                   Model model) {
        List<MataPelajaran> mataPelajarans;
        
        if (search != null && !search.trim().isEmpty()) {
            mataPelajarans = mataPelajaranService.findByNamaContaining(search.trim());
            model.addAttribute("search", search);
        } else if (kurikulumId != null && !kurikulumId.trim().isEmpty()) {
            Optional<Kurikulum> kurikulum = kurikulumService.findById(kurikulumId);
            if (kurikulum.isPresent()) {
                mataPelajarans = mataPelajaranService.findByKurikulum(kurikulum.get());
                model.addAttribute("selectedKurikulum", kurikulum.get());
            } else {
                mataPelajarans = mataPelajaranService.findAll();
            }
        } else {
            mataPelajarans = mataPelajaranService.findAll();
        }
        
        model.addAttribute("mataPelajarans", mataPelajarans);
        model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
        return "mata-pelajaran/list";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("mataPelajaran", new MataPelajaran());
        model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
        model.addAttribute("isEdit", false);
        return "mata-pelajaran/form";
    }

    @PostMapping
    public String createMataPelajaran(@Valid @ModelAttribute MataPelajaran mataPelajaran, 
                                    BindingResult result, 
                                    RedirectAttributes redirectAttributes,
                                    Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
            model.addAttribute("isEdit", false);
            return "mata-pelajaran/form";
        }

        try {
            mataPelajaranService.save(mataPelajaran);
            redirectAttributes.addFlashAttribute("successMessage", "Mata Pelajaran berhasil ditambahkan");
            return "redirect:/mata-pelajaran";
        } catch (MataPelajaranService.MataPelajaranValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
            model.addAttribute("isEdit", false);
            return "mata-pelajaran/form";
        }
    }

    @GetMapping("/{id}")
    public String showMataPelajaran(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<MataPelajaran> mataPelajaran = mataPelajaranService.findById(id);
        
        if (mataPelajaran.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Mata Pelajaran tidak ditemukan");
            return "redirect:/mata-pelajaran";
        }
        
        model.addAttribute("mataPelajaran", mataPelajaran.get());
        return "mata-pelajaran/detail";
    }

    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<MataPelajaran> mataPelajaran = mataPelajaranService.findById(id);
        
        if (mataPelajaran.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Mata Pelajaran tidak ditemukan");
            return "redirect:/mata-pelajaran";
        }
        
        model.addAttribute("mataPelajaran", mataPelajaran.get());
        model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
        model.addAttribute("isEdit", true);
        return "mata-pelajaran/form";
    }

    @PostMapping("/{id}")
    public String updateMataPelajaran(@PathVariable String id,
                                    @Valid @ModelAttribute MataPelajaran mataPelajaran,
                                    BindingResult result,
                                    RedirectAttributes redirectAttributes,
                                    Model model) {
        
        if (result.hasErrors()) {
            model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
            model.addAttribute("isEdit", true);
            return "mata-pelajaran/form";
        }

        try {
            mataPelajaranService.update(id, mataPelajaran);
            redirectAttributes.addFlashAttribute("successMessage", "Mata Pelajaran berhasil diperbarui");
            return "redirect:/mata-pelajaran";
        } catch (MataPelajaranService.MataPelajaranNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/mata-pelajaran";
        } catch (MataPelajaranService.MataPelajaranValidationException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("kurikulums", kurikulumService.findByAktifTrue());
            model.addAttribute("isEdit", true);
            return "mata-pelajaran/form";
        }
    }

    @PostMapping("/{id}/delete")
    public String deleteMataPelajaran(@PathVariable String id, RedirectAttributes redirectAttributes) {
        try {
            mataPelajaranService.deleteById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Mata Pelajaran berhasil dihapus");
        } catch (MataPelajaranService.MataPelajaranNotFoundException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        
        return "redirect:/mata-pelajaran";
    }
}