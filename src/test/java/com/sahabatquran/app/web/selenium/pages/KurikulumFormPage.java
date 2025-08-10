package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class KurikulumFormPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(id = "kode")
    private WebElement kodeInput;

    @FindBy(id = "nama")
    private WebElement namaInput;

    @FindBy(css = "input[name='aktif'][value='true']")
    private WebElement aktifTrueRadio;

    @FindBy(css = "input[name='aktif'][value='false']")
    private WebElement aktifFalseRadio;

    @FindBy(css = "button[type='submit']")
    private WebElement submitButton;

    @FindBy(css = "button[type='reset']")
    private WebElement resetButton;

    @FindBy(css = "a[href*='/kurikulum']:not([href*='/new']):not([href*='/edit'])")
    private WebElement kembaliButton;

    @FindBy(css = ".text-red-600")
    private WebElement validationError;

    @FindBy(id = "error-alert")
    private WebElement errorAlert;

    public KurikulumFormPage(WebDriver webDriver, String url) {
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

    public void fillKode(String kode) {
        wait.until(ExpectedConditions.elementToBeClickable(kodeInput));
        kodeInput.clear();
        kodeInput.sendKeys(kode);
    }

    public void fillNama(String nama) {
        wait.until(ExpectedConditions.elementToBeClickable(namaInput));
        namaInput.clear();
        namaInput.sendKeys(nama);
    }

    public void selectAktif(boolean aktif) {
        if (aktif) {
            wait.until(ExpectedConditions.elementToBeClickable(aktifTrueRadio));
            aktifTrueRadio.click();
        } else {
            wait.until(ExpectedConditions.elementToBeClickable(aktifFalseRadio));
            aktifFalseRadio.click();
        }
    }

    public void fillForm(String kode, String nama, boolean aktif) {
        fillKode(kode);
        fillNama(nama);
        selectAktif(aktif);
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

    public String getKodeValue() {
        return kodeInput.getAttribute("value");
    }

    public String getNamaValue() {
        return namaInput.getAttribute("value");
    }

    public boolean getAktifValue() {
        return aktifTrueRadio.isSelected();
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
            // Wait for page to be fully loaded first
            WebDriverWait longWait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
            
            // Try to wait for error alert
            try {
                WebElement element = longWait.until(ExpectedConditions.visibilityOfElementLocated(By.id("error-alert")));
                return element.isDisplayed();
            } catch (Exception ex) {
                // Fall back to checking page source and other elements
                String pageSource = webDriver.getPageSource();
                boolean hasErrorInSource = pageSource.contains("errorMessage") || 
                                          pageSource.contains("error-alert") ||
                                          pageSource.contains("sudah terdaftar") ||
                                          pageSource.contains("sudah ada") ||
                                          pageSource.contains("duplicate");
                
                if (hasErrorInSource) {
                    // Look for error elements by different selectors
                    List<WebElement> errorElements = webDriver.findElements(By.cssSelector("[id*='error'], [class*='error'], .bg-red-50, .text-red-600"));
                    for (WebElement errorElement : errorElements) {
                        try {
                            if (errorElement.isDisplayed() && 
                                (errorElement.getText().toLowerCase().contains("error") ||
                                 errorElement.getText().toLowerCase().contains("sudah") ||
                                 errorElement.getText().toLowerCase().contains("duplicate") ||
                                 errorElement.getAttribute("class").contains("error") ||
                                 errorElement.getAttribute("class").contains("red"))) {
                                return true;
                            }
                        } catch (Exception ignored) {}
                    }
                }
                
                return false;
            }
        } catch (Exception e) {
            System.out.println("Debug - Error message detection completely failed for form page");
            System.out.println("Current URL: " + webDriver.getCurrentUrl());
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
            case "kode":
                field = kodeInput;
                break;
            case "nama":
                field = namaInput;
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
            case "kode":
                field = kodeInput;
                break;
            case "nama":
                field = namaInput;
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
                return (currentUrl.contains("/kurikulum") && !currentUrl.contains("/new") && !currentUrl.contains("/edit"))
                    || hasValidationError() 
                    || isErrorMessageDisplayed()
                    || currentUrl.contains("/new")  // Still on form page after validation error
                    || currentUrl.contains("/edit"); // Still on edit page after validation error
            });
        } catch (Exception e) {
            // If wait times out, we're probably still on the form page due to validation errors
        }
    }

    public KurikulumListPage submitAndGoToList() {
        String originalUrl = webDriver.getCurrentUrl();
        submitAndWaitForResponse();
        
        // If we're still on form page, there was an error
        if (webDriver.getCurrentUrl().contains("/new") || webDriver.getCurrentUrl().contains("/edit")) {
            return null;
        }
        
        // Extra wait to ensure we're fully on the list page
        try {
            WebDriverWait listPageWait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
            listPageWait.until(ExpectedConditions.presenceOfElementLocated(By.id("kurikulum-table")));
        } catch (Exception e) {
            // If table is not found, we might not be on the list page
            System.out.println("Warning: Could not confirm we're on list page after form submission");
        }
        
        // Create new instance to re-initialize elements for the list page
        return new KurikulumListPage(webDriver, webDriver.getCurrentUrl());
    }

    public KurikulumListPage goBackToList() {
        clickKembali();
        return new KurikulumListPage(webDriver, webDriver.getCurrentUrl());
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
        
        // Wait for either redirect or error message to appear
        try {
            wait.until(driver -> {
                String currentUrl = driver.getCurrentUrl();
                return (currentUrl.contains("/kurikulum") && !currentUrl.contains("/new") && !currentUrl.contains("/edit"))
                    || hasValidationError() 
                    || isErrorMessageDisplayed()
                    || currentUrl.contains("/new")  // Still on form page after validation error
                    || currentUrl.contains("/edit"); // Still on edit page after validation error
            });
        } catch (Exception e) {
            // If wait times out, we're probably still on the form page due to validation errors
        }
    }
}