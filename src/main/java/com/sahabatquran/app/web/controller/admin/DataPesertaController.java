package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.repository.admin.DataPesertaRepository;
import com.sahabatquran.app.web.service.admin.DataPesertaService;
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
public class DataPesertaController {

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
