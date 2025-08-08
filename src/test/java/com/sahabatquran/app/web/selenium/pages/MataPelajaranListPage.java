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

public class MataPelajaranListPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "input[name='search']")
    private WebElement searchInput;

    @FindBy(css = "select[name='kurikulumId']")
    private WebElement kurikulumFilter;

    @FindBy(css = "a[href*='/mata-pelajaran/new']")
    private WebElement tambahMataPelajaranButton;

    @FindBy(css = "table tbody tr")
    private List<WebElement> mataPelajaranRows;

    @FindBy(css = "table tbody")
    private WebElement tableBody;

    @FindBy(css = ".bg-green-50")
    private WebElement successAlert;

    @FindBy(css = ".bg-red-50")
    private WebElement errorAlert;

    public MataPelajaranListPage(WebDriver webDriver, String url) {
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

    public void searchMataPelajaran(String searchTerm) {
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

    public void filterByKurikulum(String kurikulumName) {
        wait.until(ExpectedConditions.elementToBeClickable(kurikulumFilter));
        Select select = new Select(kurikulumFilter);
        select.selectByVisibleText(kurikulumName);
        
        // Wait for filter to apply
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public void clearKurikulumFilter() {
        wait.until(ExpectedConditions.elementToBeClickable(kurikulumFilter));
        Select select = new Select(kurikulumFilter);
        select.selectByVisibleText("Semua Kurikulum");
    }

    public void clickTambahMataPelajaran() {
        wait.until(ExpectedConditions.elementToBeClickable(tambahMataPelajaranButton));
        tambahMataPelajaranButton.click();
    }

    public int getMataPelajaranCount() {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        // Check if there's an empty state message
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='6']"));
        if (!emptyStateElements.isEmpty()) {
            return 0;
        }
        
        return mataPelajaranRows.size();
    }

    public boolean isMataPelajaranVisible(String kode) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : mataPelajaranRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 3) {
                String kodeInRow = cells.get(2).getText(); // Assuming kode is in third column
                if (kodeInRow.contains(kode)) {
                    return true;
                }
            }
        }
        return false;
    }

    public boolean isMataPelajaranVisibleByNama(String nama) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : mataPelajaranRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 4) {
                String namaInRow = cells.get(3).getText(); // Assuming nama is in fourth column
                if (namaInRow.contains(nama)) {
                    return true;
                }
            }
        }
        return false;
    }

    public String getKurikulumForMataPelajaran(String kode) {
        for (WebElement row : mataPelajaranRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 3) {
                String kodeInRow = cells.get(2).getText();
                if (kodeInRow.contains(kode)) {
                    return cells.get(1).getText(); // Kurikulum is in second column
                }
            }
        }
        return null;
    }

    public void clickViewMataPelajaran(String kode) {
        WebElement viewButton = findActionButtonByKode(kode, "fa-eye");
        if (viewButton != null) {
            viewButton.click();
        }
    }

    public void clickEditMataPelajaran(String kode) {
        WebElement editButton = findActionButtonByKode(kode, "fa-edit");
        if (editButton != null) {
            editButton.click();
        }
    }

    public void clickDeleteMataPelajaran(String kode) {
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
        for (WebElement row : mataPelajaranRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 3) {
                String kodeInRow = cells.get(2).getText();
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
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='6']"));
        return !emptyStateElements.isEmpty() && emptyStateElements.get(0).isDisplayed();
    }

    public String getEmptyStateMessage() {
        if (isEmptyStateDisplayed()) {
            WebElement emptyState = webDriver.findElement(By.cssSelector("td[colspan='6']"));
            return emptyState.getText();
        }
        return null;
    }

    public List<String> getAllMataPelajaranKodes() {
        return mataPelajaranRows.stream()
            .map(row -> {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                return cells.size() >= 3 ? cells.get(2).getText() : "";
            })
            .filter(kode -> !kode.isEmpty())
            .toList();
    }

    public List<String> getAllMataPelajaranNames() {
        return mataPelajaranRows.stream()
            .map(row -> {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                return cells.size() >= 4 ? cells.get(3).getText() : "";
            })
            .filter(nama -> !nama.isEmpty())
            .toList();
    }

    public MataPelajaranDetailPage goToMataPelajaranDetail(String kode) {
        clickViewMataPelajaran(kode);
        return new MataPelajaranDetailPage(webDriver, webDriver.getCurrentUrl());
    }

    public MataPelajaranFormPage goToEditMataPelajaran(String kode) {
        clickEditMataPelajaran(kode);
        return new MataPelajaranFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public MataPelajaranFormPage goToAddMataPelajaran() {
        clickTambahMataPelajaran();
        return new MataPelajaranFormPage(webDriver, webDriver.getCurrentUrl());
    }
}