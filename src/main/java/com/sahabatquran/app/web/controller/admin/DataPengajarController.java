package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.repository.admin.DataPengajarRepository;
import com.sahabatquran.app.web.service.admin.DataPengajarService;
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
public class DataPengajarController {

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
}
