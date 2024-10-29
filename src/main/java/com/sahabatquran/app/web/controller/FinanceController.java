package com.sahabatquran.app.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/finance")
public class FinanceController {

    @GetMapping("/dashboard")
    public String financeDashboard(){
        return "finance/dashboard";
    }

    @GetMapping("/daftar-pembayaran")
    public String daftarProgram(){
        return "finance/daftar_pembayaran";
    }

    @GetMapping("/program-sedekah")
    public String programSedekah(){
        return "finance/program_sedekah";
    }

    @GetMapping("/addProgramSedekah")
    public String addProgramSedekah(){return "finance/addProgramSedekah";}

    @GetMapping("/daftar-sedekah")
    public String daftarProgramSedekah(){
        return "finance/daftar_sedekah";
    }
}
