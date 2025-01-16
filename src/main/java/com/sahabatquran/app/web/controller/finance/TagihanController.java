package com.sahabatquran.app.web.controller.finance;

import com.sahabatquran.app.web.entity.Peserta;
import com.sahabatquran.app.web.entity.ProgramSedekah;
import com.sahabatquran.app.web.entity.Tagihan;
import com.sahabatquran.app.web.repository.finance.ProgramSedekahRepository;
import com.sahabatquran.app.web.repository.finance.TagihanRepository;
import com.sahabatquran.app.web.service.admin.DataPesertaService;
import com.sahabatquran.app.web.service.finance.ProgramSedekahService;
import com.sahabatquran.app.web.service.finance.TagihanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/finance")
public class TagihanController {
    @Autowired
    private TagihanRepository tagihanRepository;

    @Autowired
    private TagihanService tagihanService;

    @Autowired
    private DataPesertaService dataPesertaService;

    @GetMapping("/daftar-pembayaran")
    public String financeProgramSedekah(Model model) {
        List<Tagihan> tagihans = tagihanRepository.findAll();
        model.addAttribute("tagihans", tagihans);
        return "finance/pembayaran/daftar_pembayaran";
    }

    @GetMapping("/add-tagihan-pembayaran")
    public String showAddTagihanForm(Model model) {
        List<Peserta> pesertaList = dataPesertaService.findAll();
        model.addAttribute("daftarPeserta", pesertaList);

        model.addAttribute("tagihan", new Tagihan());
        return "finance/pembayaran/add_tagihan";
    }

    @PostMapping("/save-add-tagihan")
    public String saveTagihan(@ModelAttribute("tagihan") Tagihan tagihan, RedirectAttributes redirectAttributes) {
        try {
            tagihanService.save(tagihan); // Simpan data tagihan ke database
            redirectAttributes.addFlashAttribute("successMessage", "Tagihan berhasil disimpan!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Gagal menyimpan tagihan. Silakan coba lagi.");
        }
        return "redirect:/finance/daftar-pembayaran"; // Redirect ke halaman daftar tagihan
    }

    @GetMapping("/edit-tagihan/{id}")
    public String financeEditTagihan(@PathVariable("id") UUID id, Model model) {
        List<Peserta> pesertaList = dataPesertaService.findAll();
        model.addAttribute("daftarPeserta", pesertaList);

        Tagihan tagihan = tagihanRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid Tagihan Id: " + id));
        model.addAttribute("tagihans", tagihan);
        return "finance/pembayaran/edit_tagihan";
    }

    @PostMapping("/save-edit-tagihan")
    public String saveEditTagihan(@Valid @ModelAttribute Tagihan tagihan, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("tagihans", tagihan);
            return "finance/pembayaran/edit_tagihan";
        }

        try {
            tagihanService.updateTagihan(tagihan.getId(), tagihan);
        } catch (IllegalArgumentException e) {
            model.addAttribute("error", e.getMessage());
            return "finance/pembayaran/edit_tagihan";
        }

        return "redirect:/finance/daftar-pembayaran";
    }

    @GetMapping("/delete-tagihan/{id}")
    public String financeDeleteTagihan(@PathVariable("id") UUID  id) {
        tagihanService.deleteTagihan(id);
        return "redirect:/finance/daftar-pembayaran";
    }
}
