package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class PengajarDetailPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "a[href*='/pengajar']:not([href*='/edit']):not([href*='/delete'])")
    private WebElement kembaliButton;

    @FindBy(css = "a[href*='/edit']")
    private WebElement editButton;

    @FindBy(css = "form[method='post'] button[type='submit']")
    private WebElement deleteButton;

    @FindBy(css = "[data-nama]")
    private WebElement namaData;

    @FindBy(css = "[data-email]")  
    private WebElement emailData;

    public PengajarDetailPage(WebDriver webDriver, String url) {
        this.webDriver = webDriver;
        this.wait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
        webDriver.get(url);
        
        // Wait for page to load
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("h1")));
        PageFactory.initElements(webDriver, this);
    }

    public String getPageTitle() {
        return webDriver.getTitle();
    }

    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("h2")));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getPengajarNama() {
        WebElement namaElement = webDriver.findElement(By.tagName("h2"));
        return namaElement.getText();
    }

    public String getPengajarId() {
        WebElement idElement = webDriver.findElement(By.cssSelector(".font-mono"));
        return idElement.getText();
    }

    public String getPengajarEmail() {
        // Look for email in the details grid
        return getFieldValue("Email");
    }

    public String getPengajarNomorHandphone() {
        // Look for phone in the details grid  
        return getFieldValue("Nomor Handphone");
    }

    private String getFieldValue(String fieldLabel) {
        try {
            // Find the label element containing the field name
            WebElement labelElement = webDriver.findElement(
                By.xpath("//label[contains(text(), '" + fieldLabel + "')]/following-sibling::*[1]")
            );
            return labelElement.getText().split(" ")[0]; // Get first part (before any icons)
        } catch (Exception e) {
            return null;
        }
    }

    public void clickKembali() {
        wait.until(ExpectedConditions.elementToBeClickable(kembaliButton));
        kembaliButton.click();
    }

    public void clickEdit() {
        wait.until(ExpectedConditions.elementToBeClickable(editButton));
        editButton.click();
    }

    public void clickDelete() {
        wait.until(ExpectedConditions.elementToBeClickable(deleteButton));
        deleteButton.click();
        
        // Handle confirmation dialog
        try {
            webDriver.switchTo().alert().accept();
        } catch (Exception e) {
            // If no alert, continue
        }
    }

    public boolean isEditButtonVisible() {
        try {
            return editButton.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isDeleteButtonVisible() {
        try {
            return deleteButton.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasEmailLink() {
        try {
            WebElement emailLink = webDriver.findElement(By.cssSelector("a[href^='mailto:']"));
            return emailLink.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasPhoneLink() {
        try {
            WebElement phoneLink = webDriver.findElement(By.cssSelector("a[href^='tel:']"));
            return phoneLink.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasWhatsAppLink() {
        try {
            WebElement whatsAppLink = webDriver.findElement(By.cssSelector("a[href*='wa.me']"));
            return whatsAppLink.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickEmailLink() {
        WebElement emailLink = webDriver.findElement(By.cssSelector("a[href^='mailto:']"));
        emailLink.click();
    }

    public void clickPhoneLink() {
        WebElement phoneLink = webDriver.findElement(By.cssSelector("a[href^='tel:']"));
        phoneLink.click();
    }

    public void clickWhatsAppLink() {
        WebElement whatsAppLink = webDriver.findElement(By.cssSelector("a[href*='wa.me']"));
        whatsAppLink.click();
    }

    public void clickIdToCopy() {
        WebElement idElement = webDriver.findElement(By.cssSelector(".font-mono"));
        idElement.click();
        
        // Wait a moment for copy feedback
        try {
            Thread.sleep(1100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public PengajarListPage goBackToList() {
        clickKembali();
        return new PengajarListPage(webDriver, webDriver.getCurrentUrl());
    }

    public PengajarFormPage goToEdit() {
        clickEdit();
        return new PengajarFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public PengajarListPage deleteAndGoToList() {
        clickDelete();
        return new PengajarListPage(webDriver, webDriver.getCurrentUrl());
    }
}