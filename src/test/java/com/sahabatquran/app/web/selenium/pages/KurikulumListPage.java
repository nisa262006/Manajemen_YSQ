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

public class KurikulumListPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "input[name='search']")
    private WebElement searchInput;

    @FindBy(css = "a[href*='/kurikulum/new']")
    private WebElement tambahKurikulumButton;

    @FindBy(css = "table tbody tr")
    private List<WebElement> kurikulumRows;

    @FindBy(css = "table tbody")
    private WebElement tableBody;

    @FindBy(css = ".bg-green-50")
    private WebElement successAlert;

    @FindBy(css = ".bg-red-50")
    private WebElement errorAlert;

    public KurikulumListPage(WebDriver webDriver, String url) {
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
            wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void searchKurikulum(String searchTerm) {
        wait.until(ExpectedConditions.elementToBeClickable(searchInput));
        searchInput.clear();
        searchInput.sendKeys(searchTerm);
        
        // Wait for auto-submit or manually submit
        try {
            Thread.sleep(600); // Wait for auto-submit timeout
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public void clickTambahKurikulum() {
        wait.until(ExpectedConditions.elementToBeClickable(tambahKurikulumButton));
        tambahKurikulumButton.click();
    }

    public int getKurikulumCount() {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        // Check if there's an empty state message
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='5']"));
        if (!emptyStateElements.isEmpty()) {
            return 0;
        }
        
        return kurikulumRows.size();
    }

    public boolean isKurikulumVisible(String kode) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : kurikulumRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String kodeInRow = cells.get(1).getText(); // Assuming kode is in second column
                if (kodeInRow.contains(kode)) {
                    return true;
                }
            }
        }
        return false;
    }

    public boolean isKurikulumVisibleByNama(String nama) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : kurikulumRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 3) {
                String namaInRow = cells.get(2).getText(); // Assuming nama is in third column
                if (namaInRow.contains(nama)) {
                    return true;
                }
            }
        }
        return false;
    }

    public void clickViewKurikulum(String kode) {
        WebElement viewButton = findActionButtonByKode(kode, "fa-eye");
        if (viewButton != null) {
            viewButton.click();
        }
    }

    public void clickEditKurikulum(String kode) {
        WebElement editButton = findActionButtonByKode(kode, "fa-edit");
        if (editButton != null) {
            editButton.click();
        }
    }

    public void clickDeleteKurikulum(String kode) {
        WebElement deleteButton = findActionButtonByKode(kode, "fa-trash");
        if (deleteButton != null) {
            deleteButton.click();
            
            // Handle confirmation dialog
            try {
                webDriver.switchTo().alert().accept();
            } catch (Exception e) {
                // If no alert, continue
            }
        }
    }

    private WebElement findActionButtonByKode(String kode, String iconClass) {
        for (WebElement row : kurikulumRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String kodeInRow = cells.get(1).getText();
                if (kodeInRow.contains(kode)) {
                    // Find the action button with specific icon
                    List<WebElement> buttons = cells.get(cells.size() - 1)
                        .findElements(By.cssSelector("a i." + iconClass + ", button i." + iconClass));
                    if (!buttons.isEmpty()) {
                        return buttons.get(0).findElement(By.xpath(".."));
                    }
                }
            }
        }
        return null;
    }

    public boolean isSuccessMessageDisplayed() {
        try {
            return successAlert.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isErrorMessageDisplayed() {
        try {
            return errorAlert.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getSuccessMessage() {
        if (isSuccessMessageDisplayed()) {
            return successAlert.getText();
        }
        return null;
    }

    public String getErrorMessage() {
        if (isErrorMessageDisplayed()) {
            return errorAlert.getText();
        }
        return null;
    }

    public boolean isEmptyStateDisplayed() {
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='5']"));
        return !emptyStateElements.isEmpty() && emptyStateElements.get(0).isDisplayed();
    }

    public String getEmptyStateMessage() {
        if (isEmptyStateDisplayed()) {
            WebElement emptyState = webDriver.findElement(By.cssSelector("td[colspan='5']"));
            return emptyState.getText();
        }
        return null;
    }

    public List<String> getAllKurikulumKodes() {
        return kurikulumRows.stream()
            .map(row -> {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                return cells.size() >= 2 ? cells.get(1).getText() : "";
            })
            .filter(kode -> !kode.isEmpty())
            .toList();
    }

    public List<String> getAllKurikulumNames() {
        return kurikulumRows.stream()
            .map(row -> {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                return cells.size() >= 3 ? cells.get(2).getText() : "";
            })
            .filter(nama -> !nama.isEmpty())
            .toList();
    }

    public KurikulumDetailPage goToKurikulumDetail(String kode) {
        clickViewKurikulum(kode);
        return new KurikulumDetailPage(webDriver, webDriver.getCurrentUrl());
    }

    public KurikulumFormPage goToEditKurikulum(String kode) {
        clickEditKurikulum(kode);
        return new KurikulumFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public KurikulumFormPage goToAddKurikulum() {
        clickTambahKurikulum();
        return new KurikulumFormPage(webDriver, webDriver.getCurrentUrl());
    }
}