package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

public class KelasFormPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(id = "nama")
    private WebElement namaInput;

    @FindBy(id = "pengajar")
    private WebElement pengajarSelect;

    @FindBy(id = "mataPelajaran")
    private WebElement mataPelajaranSelect;

    @FindBy(id = "hari")
    private WebElement hariSelect;

    @FindBy(id = "waktuMulai")
    private WebElement waktuMulaiInput;

    @FindBy(id = "waktuSelesai")
    private WebElement waktuSelesaiInput;

    @FindBy(id = "submit-btn")
    private WebElement submitButton;

    @FindBy(id = "reset-btn")
    private WebElement resetButton;

    @FindBy(id = "kembali-btn")
    private WebElement kembaliButton;

    @FindBy(css = ".text-red-600")
    private List<WebElement> validationErrors;

    @FindBy(id = "error-alert")
    private WebElement errorAlert;

    public KelasFormPage(WebDriver webDriver, String url) {
        this.webDriver = webDriver;
        this.wait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
        webDriver.get(url);
        
        // Wait for form to load
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("form")));
        PageFactory.initElements(webDriver, this);
    }

    public String getPageTitle() {
        return webDriver.getTitle();
    }

    public boolean isFormLoaded() {
        try {
            wait.until(ExpectedConditions.elementToBeClickable(submitButton));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isEditMode() {
        return webDriver.getCurrentUrl().contains("/edit");
    }

    public void fillNama(String nama) {
        wait.until(ExpectedConditions.elementToBeClickable(namaInput));
        namaInput.clear();
        namaInput.sendKeys(nama);
    }

    public void selectPengajar(String pengajarNama) {
        wait.until(ExpectedConditions.elementToBeClickable(pengajarSelect));
        Select select = new Select(pengajarSelect);
        
        // Try to find option by visible text containing the pengajar name
        List<WebElement> options = select.getOptions();
        for (WebElement option : options) {
            if (option.getText().contains(pengajarNama)) {
                select.selectByVisibleText(option.getText());
                return;
            }
        }
        
        // If not found, select by visible text directly
        try {
            select.selectByVisibleText(pengajarNama);
        } catch (Exception e) {
            // If still not found, select first non-empty option
            if (options.size() > 1) {
                select.selectByIndex(1); // Skip the first "Pilih Pengajar" option
            }
        }
    }

    public void selectMataPelajaran(String mataPelajaranNama) {
        wait.until(ExpectedConditions.elementToBeClickable(mataPelajaranSelect));
        Select select = new Select(mataPelajaranSelect);
        
        // Try to find option by visible text containing the mata pelajaran name
        List<WebElement> options = select.getOptions();
        for (WebElement option : options) {
            if (option.getText().contains(mataPelajaranNama)) {
                select.selectByVisibleText(option.getText());
                return;
            }
        }
        
        // If not found, select by visible text directly
        try {
            select.selectByVisibleText(mataPelajaranNama);
        } catch (Exception e) {
            // If still not found, select first non-empty option
            if (options.size() > 1) {
                select.selectByIndex(1); // Skip the first "Pilih Mata Pelajaran" option
            }
        }
    }

    public void selectHari(String hari) {
        wait.until(ExpectedConditions.elementToBeClickable(hariSelect));
        Select select = new Select(hariSelect);
        select.selectByVisibleText(hari);
    }

    public void fillWaktuMulai(String waktuMulai) {
        wait.until(ExpectedConditions.elementToBeClickable(waktuMulaiInput));
        waktuMulaiInput.clear();
        waktuMulaiInput.sendKeys(waktuMulai);
    }

    public void fillWaktuSelesai(String waktuSelesai) {
        wait.until(ExpectedConditions.elementToBeClickable(waktuSelesaiInput));
        waktuSelesaiInput.clear();
        waktuSelesaiInput.sendKeys(waktuSelesai);
    }

    public void fillForm(String nama, String pengajarNama, String mataPelajaranNama, 
                        String hari, String waktuMulai, String waktuSelesai) {
        fillNama(nama);
        selectPengajar(pengajarNama);
        selectMataPelajaran(mataPelajaranNama);
        selectHari(hari);
        fillWaktuMulai(waktuMulai);
        fillWaktuSelesai(waktuSelesai);
    }

    public void submitForm() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton));
        submitButton.click();
        
        // Handle potential JavaScript alerts with proper timeout
        try {
            WebDriverWait alertWait = new WebDriverWait(webDriver, Duration.ofSeconds(3));
            alertWait.until(ExpectedConditions.alertIsPresent());
            webDriver.switchTo().alert().accept();
        } catch (Exception e) {
            // No alert present, continue
        }
    }

    public void resetForm() {
        wait.until(ExpectedConditions.elementToBeClickable(resetButton));
        resetButton.click();
    }

    public void clickKembali() {
        wait.until(ExpectedConditions.elementToBeClickable(kembaliButton));
        kembaliButton.click();
    }

    public String getNama() {
        return namaInput.getAttribute("value");
    }

    public String getSelectedPengajar() {
        Select select = new Select(pengajarSelect);
        return select.getFirstSelectedOption().getText();
    }

    public String getSelectedMataPelajaran() {
        Select select = new Select(mataPelajaranSelect);
        return select.getFirstSelectedOption().getText();
    }

    public String getSelectedHari() {
        Select select = new Select(hariSelect);
        return select.getFirstSelectedOption().getText();
    }

    public String getWaktuMulai() {
        return waktuMulaiInput.getAttribute("value");
    }

    public String getWaktuSelesai() {
        return waktuSelesaiInput.getAttribute("value");
    }

    public boolean hasValidationErrors() {
        return !validationErrors.isEmpty() && validationErrors.stream().anyMatch(WebElement::isDisplayed);
    }

    public List<String> getValidationErrors() {
        return validationErrors.stream()
            .filter(WebElement::isDisplayed)
            .map(WebElement::getText)
            .toList();
    }

    public boolean isErrorAlertDisplayed() {
        try {
            return errorAlert.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getErrorMessage() {
        if (isErrorAlertDisplayed()) {
            return errorAlert.getText();
        }
        return null;
    }

    public List<String> getAvailablePengajars() {
        Select select = new Select(pengajarSelect);
        return select.getOptions().stream()
            .map(WebElement::getText)
            .filter(text -> !text.equals("Pilih Pengajar"))
            .toList();
    }

    public List<String> getAvailableMataPelajarans() {
        Select select = new Select(mataPelajaranSelect);
        return select.getOptions().stream()
            .map(WebElement::getText)
            .filter(text -> !text.equals("Pilih Mata Pelajaran"))
            .toList();
    }

    public List<String> getAvailableHaris() {
        Select select = new Select(hariSelect);
        return select.getOptions().stream()
            .map(WebElement::getText)
            .filter(text -> !text.equals("Pilih Hari"))
            .toList();
    }

    public KelasListPage submitAndGoToList() {
        // First wait for page to be ready
        wait.until(ExpectedConditions.elementToBeClickable(submitButton));
        
        submitForm();
        
        // Wait for the redirect with more specific conditions
        try {
            // Wait for URL to change to indicate redirect happened - be more flexible
            WebDriverWait redirectWait = new WebDriverWait(webDriver, Duration.ofSeconds(15));
            redirectWait.until(ExpectedConditions.or(
                ExpectedConditions.and(
                    ExpectedConditions.urlContains("/kelas"),
                    ExpectedConditions.not(ExpectedConditions.urlContains("/new")),
                    ExpectedConditions.not(ExpectedConditions.urlContains("/edit"))
                ),
                // Or if we're still on form page due to validation errors
                ExpectedConditions.urlContains("/kelas")
            ));
            
            // Only wait for table if we're on the list page
            if (!webDriver.getCurrentUrl().contains("/new") && !webDriver.getCurrentUrl().contains("/edit")) {
                // Wait for the kelas table to be present indicating page loaded
                redirectWait.until(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")));
                
                // Give extra time for flash messages to be processed
                // This is important because flash attributes need time to be rendered
                redirectWait.until(ExpectedConditions.or(
                    ExpectedConditions.presenceOfElementLocated(By.id("success-alert")),
                    ExpectedConditions.presenceOfElementLocated(By.id("error-alert")),
                    // Or wait for the page to be stable (DOM to be fully loaded)
                    ExpectedConditions.and(
                        ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")),
                        ExpectedConditions.not(ExpectedConditions.stalenessOf(
                            webDriver.findElement(By.id("kelas-table"))
                        ))
                    )
                ));
            }
            
        } catch (Exception e) {
            System.out.println("Error during redirect wait: " + e.getMessage());
            System.out.println("Current URL after submit: " + webDriver.getCurrentUrl());
        }
        
        return new KelasListPage(webDriver, webDriver.getCurrentUrl());
    }

    public KelasListPage goBackToList() {
        clickKembali();
        return new KelasListPage(webDriver, webDriver.getCurrentUrl());
    }
}