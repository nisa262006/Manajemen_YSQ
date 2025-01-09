package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Kurikulum;
import com.sahabatquran.app.web.repository.admin.DataKurikulumRepository;
import com.sahabatquran.app.web.service.admin.DataKurikulumService;
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
public class DataKurikulumController {

    @Autowired
    private DataKurikulumRepository dataKurikulumRepository;

    @Autowired
    private DataKurikulumService dataKurikulumService;

    @GetMapping("/data-kurikulum")
    public String adminDataKurikulum(Model model) {
        List<Kurikulum> kurikulums = dataKurikulumRepository.findAll();
        model.addAttribute("kurikulums", kurikulums);
        return "admin/dataKurikulum/dataKurikulum";
    }

    @GetMapping("/add-data-kurikulum")
    public String adminAddDataKurikulum(Model model) {
        model.addAttribute("kurikulum", new Kurikulum());
        return "admin/dataKurikulum/addDataKurikulum";
    }

    @PostMapping("/save-data-kurikulum")
    public String saveDataKurikulum(@Valid Kurikulum kurikulum, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("kurikulum", kurikulum);
            return "admin/dataKurikulum/addDataKurikulum";
        }

        dataKurikulumService.saveKurikulum(kurikulum);
        return "redirect:/admin/data-kurikulum";
    }

    @GetMapping("/edit-data-kurikulum/{id}")
    public String adminEditDataKurikulum(@PathVariable("id") UUID id, Model model) {
        Kurikulum kurikulum = dataKurikulumRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid Kurikulum ID: " + id));
        model.addAttribute("kurikulum", kurikulum);
        return "admin/dataKurikulum/editDataKurikulum";
    }

    @PostMapping("/save-edit-data-kurikulum")
    public String saveEditDataKurikulum(@Valid @ModelAttribute Kurikulum kurikulum, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("kurikulum", kurikulum);
            return "admin/dataKurikulum/editDataKurikulum";
        }

        Kurikulum updatedKurikulum = dataKurikulumService.editKurikulum(kurikulum.getId(), kurikulum);
        if (updatedKurikulum == null) {
            model.addAttribute("error", "Kurikulum not found");
            return "admin/dataKurikulum/editDataKurikulum";
        }

        return "redirect:/admin/data-kurikulum";
    }

    @GetMapping("/delete-data-kurikulum/{id}")
    public String adminDeleteDataKurikulum(@PathVariable("id") UUID id) {
        dataKurikulumService.deleteKurikulum(id);
        return "redirect:/admin/data-kurikulum";
    }
}
