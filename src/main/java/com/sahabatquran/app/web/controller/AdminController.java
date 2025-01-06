package com.sahabatquran.app.web.controller;

import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.repository.DataPengajarRepository;
import com.sahabatquran.app.web.repository.DataPesertaRepository;
import com.sahabatquran.app.web.service.DataPengajarService;
import com.sahabatquran.app.web.service.DataPesertaService;
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
public class AdminController {

    // Dashboard
    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }

    // Data Pengajar
    @Autowired
    private DataPengajarRepository dataPengajarRepository;
    @Autowired
    private DataPengajarService dataPengajarService;
    @GetMapping("/data-pengajar")
    public String adminDataPengajar(Model model) {
        List<Pengajar> pengajars = dataPengajarRepository.findAll();
        model.addAttribute("pengajars", pengajars);
        return "admin/dataPengajar/dataPengajar";
    }
    @GetMapping("/add-data-pengajar")
    public String adminAddDataPengajar(Model model) {
        model.addAttribute("pengajar", new Pengajar());
        return "admin/dataPengajar/addDataPengajar";
    }
    @PostMapping("/save-data-pengajar")
    public String saveDataPengajar(@Valid Pengajar pengajar, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("pengajar", pengajar);
            return "admin/dataPengajar/addDataPengajar";
        }

        dataPengajarService.savePengajar(pengajar);
        return "redirect:/admin/data-pengajar";
    }
    @GetMapping("/edit-data-pengajar/{id}")
    public String adminEditDataPengajar(@PathVariable("id") UUID id, Model model) {
        Pengajar pengajar = dataPengajarRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid pengajar Id: " + id));
        model.addAttribute("pengajar", pengajar);
        return "admin/dataPengajar/editDataPengajar";
    }
    @PostMapping("/save-edit-data-pengajar")
    public String saveEditDataPengajar(@Valid @ModelAttribute Pengajar pengajar, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("pengajar", pengajar);
            return "admin/dataPengajar/editDataPengajar";
        }

        Pengajar updatedPengajar = dataPengajarService.editPengajar(pengajar.getId(), pengajar);
        if (updatedPengajar == null) {
            model.addAttribute("error", "Pengajar not found");
            return "admin/dataPengajar/editDataPengajar";
        }

        return "redirect:/admin/data-pengajar";
    }
    @GetMapping("/delete-data-pengajar/{id}")
    public String adminDeleteDataPengajar(@PathVariable("id") UUID id) {
        dataPengajarService.deletePengajar(id);
        return "redirect:/admin/data-pengajar";
    }

    // Data Peserta
    @Autowired
    private DataPesertaRepository dataPesertaRepository;
    @Autowired
    private DataPesertaService dataPesertaService;

    @GetMapping("/data-peserta")
    public String adminDataPeserta(Model model) {
        List<Peserta> pesertas = dataPesertaRepository.findAll();
        model.addAttribute("pesertas", pesertas);
        return "admin/dataPeserta/dataPeserta";
    }

    @GetMapping("/add-data-peserta")
    public String adminAddDataPeserta(Model model) {
        model.addAttribute("peserta", new Peserta());
        return "admin/dataPeserta/addDataPeserta";
    }

    @PostMapping("/save-data-peserta")
    public String saveDataPeserta(@Valid Peserta peserta, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("peserta", peserta);
            return "admin/dataPeserta/addDataPeserta";
        }

        dataPesertaService.savePeserta(peserta);
        return "redirect:/admin/data-peserta";
    }

    @GetMapping("/edit-data-peserta/{id}")
    public String adminEditDataPeserta(@PathVariable("id") UUID id, Model model) {
        Peserta peserta = dataPesertaRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid peserta Id: " + id));
        model.addAttribute("peserta", peserta);
        return "admin/dataPeserta/editDataPeserta";
    }

    @PostMapping("/save-edit-data-peserta")
    public String saveEditDataPeserta(@Valid @ModelAttribute Peserta peserta, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("peserta", peserta);
            return "admin/dataPeserta/editDataPeserta";
        }

        Peserta updatedPeserta = dataPesertaService.editPeserta(peserta.getId(), peserta);
        if (updatedPeserta == null) {
            model.addAttribute("error", "Peserta not found");
            return "admin/dataPeserta/editDataPeserta";
        }

        return "redirect:/admin/data-peserta";
    }

    @GetMapping("/delete-data-peserta/{id}")
    public String adminDeleteDataPeserta(@PathVariable("id") UUID id) {
        dataPesertaService.deletePeserta(id);
        return "redirect:/admin/data-peserta";
    }
}
