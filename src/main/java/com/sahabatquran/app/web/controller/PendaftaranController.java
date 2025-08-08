package com.sahabatquran.app.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.repository.PesertaRepository;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequestMapping("/pendaftaran")
public class PendaftaranController {

    @Autowired
    private PesertaRepository pesertaRepository;

    @GetMapping
    public String formPendaftaran(Model model) {
        model.addAttribute("peserta", new Peserta());
        return "pendaftaran/form-pendaftaran";
    }

    @PostMapping
    public String prosessPendaftaran(@Valid Peserta peserta, 
                                   BindingResult bindingResult, 
                                   Model model, 
                                   RedirectAttributes redirectAttributes) {
        
        log.info("Memproses pendaftaran untuk peserta: {}", peserta.getNama());
        
        // Check validation errors
        if (bindingResult.hasErrors()) {
            log.warn("Validasi gagal untuk pendaftaran peserta");
            return "pendaftaran/form-pendaftaran";
        }
        
        // Check email uniqueness
        if (pesertaRepository.existsByEmail(peserta.getEmail())) {
            bindingResult.rejectValue("email", "error.peserta", "Email sudah terdaftar");
            return "pendaftaran/form-pendaftaran";
        }
        
        // Check phone uniqueness
        if (pesertaRepository.existsByNomorHandphone(peserta.getNomorHandphone())) {
            bindingResult.rejectValue("nomorHandphone", "error.peserta", "Nomor handphone sudah terdaftar");
            return "pendaftaran/form-pendaftaran";
        }
        
        try {
            Peserta savedPeserta = pesertaRepository.save(peserta);
            log.info("Peserta berhasil didaftarkan dengan ID: {}", savedPeserta.getId());
            
            redirectAttributes.addFlashAttribute("successMessage", 
                "Pendaftaran berhasil! Selamat datang " + savedPeserta.getNama());
            redirectAttributes.addFlashAttribute("pesertaId", savedPeserta.getId());
            
            return "redirect:/pendaftaran/sukses";
            
        } catch (DataIntegrityViolationException e) {
            log.error("Error saat menyimpan peserta: {}", e.getMessage());
            model.addAttribute("errorMessage", "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
            return "pendaftaran/form-pendaftaran";
        }
    }

    @GetMapping("/sukses")
    public String halamanSukses(Model model) {
        return "pendaftaran/sukses-pendaftaran";
    }
}