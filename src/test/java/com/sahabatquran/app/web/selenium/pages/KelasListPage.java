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

public class KelasListPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "input[name='search']")
    private WebElement searchInput;

    @FindBy(css = "a[href*='/kelas/new']")
    private WebElement tambahKelasButton;

    @FindBy(css = "table tbody tr")
    private List<WebElement> kelasRows;

    @FindBy(css = "table tbody")
    private WebElement tableBody;

    @FindBy(css = ".bg-green-50")
    private WebElement successAlert;

    @FindBy(css = ".bg-red-50")
    private WebElement errorAlert;

    public KelasListPage(WebDriver webDriver, String url) {
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

    public void searchKelas(String searchTerm) {
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

    public void clickTambahKelas() {
        wait.until(ExpectedConditions.elementToBeClickable(tambahKelasButton));
        tambahKelasButton.click();
    }

    public int getKelasCount() {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        // Check if there's an empty state message
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='7']"));
        if (!emptyStateElements.isEmpty()) {
            return 0;
        }
        
        return kelasRows.size();
    }

    public boolean isKelasVisible(String namaKelas) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : kelasRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String namaInRow = cells.get(1).getText(); // Assuming nama kelas is in second column
                if (namaInRow.contains(namaKelas)) {
                    return true;
                }
            }
        }
        return false;
    }

    public String getKelasInfo(String namaKelas, int columnIndex) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : kelasRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String namaInRow = cells.get(1).getText();
                if (namaInRow.contains(namaKelas) && cells.size() > columnIndex) {
                    return cells.get(columnIndex).getText();
                }
            }
        }
        return null;
    }

    public String getKelasPengajar(String namaKelas) {
        return getKelasInfo(namaKelas, 2); // Pengajar is in 3rd column (index 2)
    }

    public String getKelasMataPelajaran(String namaKelas) {
        return getKelasInfo(namaKelas, 3); // Mata Pelajaran is in 4th column (index 3)
    }

    public String getKelasJadwal(String namaKelas) {
        return getKelasInfo(namaKelas, 4); // Jadwal is in 5th column (index 4)
    }

    public String getKelasJumlahPeserta(String namaKelas) {
        return getKelasInfo(namaKelas, 5); // Jumlah Peserta is in 6th column (index 5)
    }

    public void clickViewKelas(String namaKelas) {
        WebElement viewButton = findActionButton(namaKelas, "fa-eye");
        if (viewButton != null) {
            viewButton.click();
        }
    }

    public void clickEditKelas(String namaKelas) {
        WebElement editButton = findActionButton(namaKelas, "fa-edit");
        if (editButton != null) {
            editButton.click();
        }
    }

    public void clickDeleteKelas(String namaKelas) {
        WebElement deleteButton = findActionButton(namaKelas, "fa-trash");
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

    private WebElement findActionButton(String namaKelas, String iconClass) {
        for (WebElement row : kelasRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String namaInRow = cells.get(1).getText();
                if (namaInRow.contains(namaKelas)) {
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
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='7']"));
        return !emptyStateElements.isEmpty() && emptyStateElements.get(0).isDisplayed();
    }

    public String getEmptyStateMessage() {
        if (isEmptyStateDisplayed()) {
            WebElement emptyState = webDriver.findElement(By.cssSelector("td[colspan='7']"));
            return emptyState.getText();
        }
        return null;
    }

    public List<String> getAllKelasNames() {
        return kelasRows.stream()
            .map(row -> {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                return cells.size() >= 2 ? cells.get(1).getText() : "";
            })
            .filter(name -> !name.isEmpty())
            .toList();
    }

    public KelasDetailPage goToKelasDetail(String namaKelas) {
        clickViewKelas(namaKelas);
        return new KelasDetailPage(webDriver, webDriver.getCurrentUrl());
    }

    public KelasFormPage goToEditKelas(String namaKelas) {
        clickEditKelas(namaKelas);
        return new KelasFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public KelasFormPage goToAddKelas() {
        clickTambahKelas();
        return new KelasFormPage(webDriver, webDriver.getCurrentUrl());
    }
}