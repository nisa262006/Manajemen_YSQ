package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class KurikulumDetailPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "a[href*='/kurikulum']:not([href*='/edit']):not([href*='/delete'])")
    private WebElement kembaliButton;

    @FindBy(css = "a[href*='/edit']")
    private WebElement editButton;

    @FindBy(css = "form[method='post'] button[type='submit']")
    private WebElement deleteButton;

    @FindBy(css = "a[href*='/mata-pelajaran']")
    private WebElement mataPelajaranLink;

    @FindBy(css = "[data-kode]")
    private WebElement kodeData;

    @FindBy(css = "[data-nama]")
    private WebElement namaData;

    public KurikulumDetailPage(WebDriver webDriver, String url) {
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

    public String getKurikulumNama() {
        WebElement namaElement = webDriver.findElement(By.tagName("h2"));
        return namaElement.getText();
    }

    public String getKurikulumId() {
        WebElement idElement = webDriver.findElement(By.cssSelector(".font-mono"));
        return idElement.getText();
    }

    public String getKurikulumKode() {
        return getFieldValue("Kode Kurikulum");
    }

    public boolean isKurikulumAktif() {
        try {
            // Look for active status badge
            WebElement statusBadge = webDriver.findElement(By.cssSelector(".bg-green-100"));
            return statusBadge.getText().contains("Aktif");
        } catch (Exception e) {
            return false;
        }
    }

    private String getFieldValue(String fieldLabel) {
        try {
            // Find the label element containing the field name
            WebElement labelElement = webDriver.findElement(
                By.xpath("//label[contains(text(), '" + fieldLabel + "')]/following-sibling::*[1]")
            );
            return labelElement.getText();
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

    public void clickMataPelajaranLink() {
        wait.until(ExpectedConditions.elementToBeClickable(mataPelajaranLink));
        mataPelajaranLink.click();
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

    public boolean isMataPelajaranLinkVisible() {
        try {
            return mataPelajaranLink.isDisplayed();
        } catch (Exception e) {
            return false;
        }
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

    public KurikulumListPage goBackToList() {
        clickKembali();
        return new KurikulumListPage(webDriver, webDriver.getCurrentUrl());
    }

    public KurikulumFormPage goToEdit() {
        clickEdit();
        return new KurikulumFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public KurikulumListPage deleteAndGoToList() {
        clickDelete();
        return new KurikulumListPage(webDriver, webDriver.getCurrentUrl());
    }

    public MataPelajaranListPage goToMataPelajaran() {
        clickMataPelajaranLink();
        return new MataPelajaranListPage(webDriver, webDriver.getCurrentUrl());
    }
}