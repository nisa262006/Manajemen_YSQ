package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;

import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PendaftaranPage {

    private WebDriver webDriver;
    private WebDriverWait wait;

    @FindBy(id = "nama")
    private WebElement namaField;

    @FindBy(id = "email")
    private WebElement emailField;

    @FindBy(id = "nomorHandphone")
    private WebElement phoneField;

    @FindBy(xpath = "//button[@type='submit']")
    private WebElement submitButton;

    @FindBy(id = "registrationTitle")
    private WebElement pageTitle;

    public PendaftaranPage(WebDriver webDriver, String url) {
        this.webDriver = webDriver;
        this.wait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
        webDriver.get(url);
        
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("nama")));
        PageFactory.initElements(webDriver, this);
    }

    public void fillNama(String nama) {
        wait.until(ExpectedConditions.elementToBeClickable(namaField));
        namaField.clear();
        namaField.sendKeys(nama);
    }

    public void fillEmail(String email) {
        wait.until(ExpectedConditions.elementToBeClickable(emailField));
        emailField.clear();
        emailField.sendKeys(email);
    }

    public void fillPhone(String phone) {
        wait.until(ExpectedConditions.elementToBeClickable(phoneField));
        phoneField.clear();
        phoneField.sendKeys(phone);
    }

    public void submitForm() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton));
        submitButton.click();
    }

    public void checkPageTitle() {
        wait.until(ExpectedConditions.visibilityOf(pageTitle));
        Assertions.assertTrue(pageTitle.getText().contains("Pendaftaran Peserta Baru"));
    }

    public boolean isErrorMessageDisplayed(String expectedError) {
        try {
            // Check for validation error messages
            WebElement errorElement = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.xpath("//div[contains(@class, 'invalid-feedback') and contains(text(), '" + expectedError + "')]")));
            return errorElement.isDisplayed();
        } catch (Exception e) {
            try {
                // Also check for general alert messages
                WebElement alertElement = wait.until(ExpectedConditions.presenceOfElementLocated(
                    By.xpath("//div[contains(@class, 'alert') and contains(text(), '" + expectedError + "')]")));
                return alertElement.isDisplayed();
            } catch (Exception ex) {
                return false;
            }
        }
    }

    public boolean isSuccessPageDisplayed() {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.id("successTitle")));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getCurrentUrl() {
        return webDriver.getCurrentUrl();
    }

    public WebElement getFieldErrorMessage(String fieldId) {
        return wait.until(ExpectedConditions.presenceOfElementLocated(
            By.xpath("//input[@id='" + fieldId + "']/following-sibling::div[@class='invalid-feedback']")));
    }
}