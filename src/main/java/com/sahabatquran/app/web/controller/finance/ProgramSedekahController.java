package com.sahabatquran.app.web.controller.finance;

import com.sahabatquran.app.web.entity.ProgramSedekah;
import com.sahabatquran.app.web.repository.finance.ProgramSedekahRepository;
import com.sahabatquran.app.web.service.finance.ProgramSedekahService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/finance")
public class ProgramSedekahController {

    @Autowired
    private ProgramSedekahRepository programSedekahRepository;

    @Autowired
    private ProgramSedekahService programSedekahService;

    @GetMapping("/program-sedekah")
    public String financeProgramSedekah(Model model) {
        List<ProgramSedekah> programs = programSedekahRepository.findAll();
        model.addAttribute("programs", programs);
        return "finance/sedekah/program_sedekah";
    }

    @GetMapping("/add-program-sedekah")
    public String financeAddProgramSedekah(Model model) {
        model.addAttribute("programSedekah", new ProgramSedekah());
        return "finance/sedekah/add_program_sedekah";
    }

    @PostMapping("/save-program-sedekah")
    public String saveProgramSedekah(@Valid ProgramSedekah programSedekah, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("programSedekah", programSedekah);
            return "finance/sedekah/add_program_sedekah";
        }

        programSedekahService.saveProgram(programSedekah);
        return "redirect:/finance/program-sedekah";
    }

    @GetMapping("/edit-program-sedekah/{id}")
    public String financeEditProgramSedekah(@PathVariable("id") UUID id, Model model) {
        ProgramSedekah program = programSedekahRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid Program Sedekah Id: " + id));
        model.addAttribute("programSedekah", program);
        return "finance/sedekah/edit_program_sedekah";
    }

    @PostMapping("/save-edit-program-sedekah")
    public String saveEditProgramSedekah(@Valid @ModelAttribute ProgramSedekah programSedekah, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("programSedekah", programSedekah);
            return "finance/sedekah/edit_program_sedekah";
        }

        try {
            programSedekahService.updateProgram(programSedekah.getId(), programSedekah);
        } catch (IllegalArgumentException e) {
            model.addAttribute("error", e.getMessage());
            return "finance/sedekah/edit_program_sedekah";
        }

        return "redirect:/finance/program-sedekah";
    }

    @GetMapping("/delete-program-sedekah/{id}")
    public String financeDeleteProgramSedekah(@PathVariable("id") UUID  id) {
        programSedekahService.deleteProgram(id);
        return "redirect:/finance/program-sedekah";
    }
}
