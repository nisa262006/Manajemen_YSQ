package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class KelasDetailPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "h2.text-2xl")
    private WebElement kelasNameHeader;

    @FindBy(css = "a[href*='/edit']")
    private WebElement editButton;

    @FindBy(css = "button[type='submit']")
    private WebElement deleteButton;

    @FindBy(css = "a[href*='/kelas']:not([href*='/edit'])")
    private WebElement kembaliButton;

    @FindBy(css = ".space-y-4 dd")
    private List<WebElement> detailValues;

    @FindBy(css = ".space-y-3 .p-4")
    private List<WebElement> pesertaItems;

    @FindBy(css = ".text-center .text-gray-500")
    private WebElement emptyPesertaMessage;

    public KelasDetailPage(WebDriver webDriver, String url) {
        this.webDriver = webDriver;
        this.wait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
        webDriver.get(url);
        
        // Wait for page to load
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("h2.text-2xl")));
        PageFactory.initElements(webDriver, this);
    }

    public String getPageTitle() {
        return webDriver.getTitle();
    }

    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("h2.text-2xl")));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getKelasName() {
        wait.until(ExpectedConditions.visibilityOf(kelasNameHeader));
        return kelasNameHeader.getText();
    }

    public String getPengajar() {
        return getDetailValue(0); // Assuming Pengajar is the first detail
    }

    public String getMataPelajaran() {
        return getDetailValue(1); // Assuming Mata Pelajaran is the second detail
    }

    public String getHari() {
        return getDetailValue(2); // Assuming Hari is the third detail
    }

    public String getWaktuMulai() {
        return getDetailValue(3); // Assuming Waktu Mulai is the fourth detail
    }

    public String getWaktuSelesai() {
        return getDetailValue(4); // Assuming Waktu Selesai is the fifth detail
    }

    public String getDurasi() {
        return getDetailValue(5); // Assuming Durasi is the sixth detail
    }

    private String getDetailValue(int index) {
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector(".space-y-4 dd")));
        if (index < detailValues.size()) {
            return detailValues.get(index).getText();
        }
        return null;
    }

    public int getPesertaCount() {
        if (isEmptyPesertaStateDisplayed()) {
            return 0;
        }
        
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector(".space-y-3 .p-4")));
        return pesertaItems.size();
    }

    public List<String> getPesertaNames() {
        if (isEmptyPesertaStateDisplayed()) {
            return List.of();
        }
        
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector(".space-y-3 .p-4")));
        return pesertaItems.stream()
            .map(item -> {
                List<WebElement> paragraphs = item.findElements(By.tagName("p"));
                return paragraphs.size() > 0 ? paragraphs.get(0).getText() : "";
            })
            .filter(name -> !name.isEmpty())
            .collect(Collectors.toList());
    }

    public List<String> getPesertaEmails() {
        if (isEmptyPesertaStateDisplayed()) {
            return List.of();
        }
        
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector(".space-y-3 .p-4")));
        return pesertaItems.stream()
            .map(item -> {
                List<WebElement> paragraphs = item.findElements(By.tagName("p"));
                return paragraphs.size() > 1 ? paragraphs.get(1).getText() : "";
            })
            .filter(email -> !email.isEmpty())
            .collect(Collectors.toList());
    }

    public boolean isEmptyPesertaStateDisplayed() {
        try {
            return emptyPesertaMessage != null && emptyPesertaMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmptyPesertaMessage() {
        if (isEmptyPesertaStateDisplayed()) {
            return emptyPesertaMessage.getText();
        }
        return null;
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

    public void clickKembali() {
        wait.until(ExpectedConditions.elementToBeClickable(kembaliButton));
        kembaliButton.click();
    }

    public KelasFormPage goToEdit() {
        clickEdit();
        return new KelasFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public KelasListPage goBackToList() {
        clickKembali();
        return new KelasListPage(webDriver, webDriver.getCurrentUrl());
    }

    public KelasListPage deleteAndGoToList() {
        clickDelete();
        
        // Wait for potential redirect to list page
        wait.until(ExpectedConditions.urlContains("/kelas"));
        
        return new KelasListPage(webDriver, webDriver.getCurrentUrl());
    }

    public boolean isPesertaListed(String pesertaName) {
        List<String> pesertaNames = getPesertaNames();
        return pesertaNames.stream().anyMatch(name -> name.contains(pesertaName));
    }

    public boolean hasEditButton() {
        try {
            return editButton.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasDeleteButton() {
        try {
            return deleteButton.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}