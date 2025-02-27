package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Kelas;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class DataBankdanRekeningController {

    @GetMapping("/data-bank-rekening")
    public String adminDataBankdanRekening(Model model) {
        return "admin/dataBankdanRekening/dataBankdanRekening";
    }

    @GetMapping("/add-data-bank-rekening")
    public String adminAddDataBankdanRekening(Model model) {
        return "admin/dataBankdanRekening/addDataBankdanRekening";
    }

    @GetMapping("/edit-data-bank-rekening")
    public String adminEditDataBankdanRekening(Model model) {
        return "admin/dataBankdanRekening/editDataBankdanRekening";
    }
}
