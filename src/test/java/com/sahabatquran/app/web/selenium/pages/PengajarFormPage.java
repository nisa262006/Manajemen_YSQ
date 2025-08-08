package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class PengajarFormPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(id = "nama")
    private WebElement namaInput;

    @FindBy(id = "email")
    private WebElement emailInput;

    @FindBy(id = "nomorHandphone")
    private WebElement nomorHandphoneInput;

    @FindBy(css = "button[type='submit']")
    private WebElement submitButton;

    @FindBy(css = "button[type='reset']")
    private WebElement resetButton;

    @FindBy(css = "a[href*='/pengajar']:not([href*='/new']):not([href*='/edit'])")
    private WebElement kembaliButton;

    @FindBy(css = ".text-red-600")
    private WebElement validationError;

    @FindBy(css = ".bg-red-50")
    private WebElement errorAlert;

    public PengajarFormPage(WebDriver webDriver, String url) {
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

    public void fillEmail(String email) {
        wait.until(ExpectedConditions.elementToBeClickable(emailInput));
        emailInput.clear();
        emailInput.sendKeys(email);
    }

    public void fillNomorHandphone(String nomorHandphone) {
        wait.until(ExpectedConditions.elementToBeClickable(nomorHandphoneInput));
        nomorHandphoneInput.clear();
        nomorHandphoneInput.sendKeys(nomorHandphone);
    }

    public void fillForm(String nama, String email, String nomorHandphone) {
        fillNama(nama);
        fillEmail(email);
        fillNomorHandphone(nomorHandphone);
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
            // No alert present within timeout, continue normally
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

    public String getNamaValue() {
        return namaInput.getAttribute("value");
    }

    public String getEmailValue() {
        return emailInput.getAttribute("value");
    }

    public String getNomorHandphoneValue() {
        return nomorHandphoneInput.getAttribute("value");
    }

    public boolean hasValidationError() {
        try {
            return !webDriver.findElements(By.cssSelector(".text-red-600")).isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public String getValidationErrorMessage() {
        if (hasValidationError()) {
            return validationError.getText();
        }
        return null;
    }

    public boolean isErrorMessageDisplayed() {
        try {
            return errorAlert.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getErrorMessage() {
        if (isErrorMessageDisplayed()) {
            return errorAlert.getText();
        }
        return null;
    }

    public boolean isFieldHighlightedAsError(String fieldName) {
        WebElement field = null;
        switch (fieldName.toLowerCase()) {
            case "nama":
                field = namaInput;
                break;
            case "email":
                field = emailInput;
                break;
            case "nomorhandphone":
            case "nomor handphone":
                field = nomorHandphoneInput;
                break;
        }
        
        if (field != null) {
            String classes = field.getAttribute("class");
            return classes.contains("border-red-500");
        }
        return false;
    }

    public boolean isRequiredField(String fieldName) {
        WebElement field = null;
        switch (fieldName.toLowerCase()) {
            case "nama":
                field = namaInput;
                break;
            case "email":
                field = emailInput;
                break;
            case "nomorhandphone":
            case "nomor handphone":
                field = nomorHandphoneInput;
                break;
        }
        
        if (field != null) {
            return field.getAttribute("required") != null;
        }
        return false;
    }

    public void submitAndWaitForResponse() {
        submitForm();
        
        // After handling alert, wait for either redirect or staying on form with errors
        try {
            // Wait for either redirect to list page or error message to appear
            wait.until(driver -> {
                String currentUrl = driver.getCurrentUrl();
                return (currentUrl.contains("/pengajar") && !currentUrl.contains("/new") && !currentUrl.contains("/edit"))
                    || hasValidationError() 
                    || isErrorMessageDisplayed()
                    || currentUrl.contains("/new")  // Still on form page after validation error
                    || currentUrl.contains("/edit"); // Still on edit page after validation error
            });
        } catch (Exception e) {
            // If wait times out, we're probably still on the form page due to validation errors
        }
    }

    public PengajarListPage submitAndGoToList() {
        submitAndWaitForResponse();
        
        // If we're still on form page, there was an error
        if (webDriver.getCurrentUrl().contains("/new") || webDriver.getCurrentUrl().contains("/edit")) {
            return null;
        }
        
        return new PengajarListPage(webDriver, webDriver.getCurrentUrl());
    }

    public PengajarListPage goBackToList() {
        clickKembali();
        return new PengajarListPage(webDriver, webDriver.getCurrentUrl());
    }

    public void submitFormBypassingClientValidation() {
        // Bypass client-side validation by directly submitting form via JavaScript
        wait.until(ExpectedConditions.elementToBeClickable(submitButton));
        ((JavascriptExecutor) webDriver).executeScript("document.querySelector('form').submit();");
        
        // Handle potential JavaScript alerts that might still appear
        try {
            Thread.sleep(100); // Brief wait for alert to appear
            if (webDriver.switchTo().alert() != null) {
                webDriver.switchTo().alert().accept();
            }
        } catch (Exception e) {
            // No alert present, continue normally
        }
    }

    public void submitFormBypassingClientValidation() {
        // Use JavaScript to submit the form bypassing client-side validation
        JavascriptExecutor js = (JavascriptExecutor) webDriver;
        js.executeScript("document.querySelector('form').submit();");
        
        // Handle potential server-side validation alerts
        try {
            WebDriverWait alertWait = new WebDriverWait(webDriver, Duration.ofSeconds(3));
            alertWait.until(ExpectedConditions.alertIsPresent());
            webDriver.switchTo().alert().accept();
        } catch (Exception e) {
            // No alert present within timeout, continue normally
        }
    }
}