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

    @FindBy(id = "searchInput")
    private WebElement searchInput;

    @FindBy(id = "tambah-kelas-btn")
    private WebElement tambahKelasButton;

    @FindBy(css = "#kelas-table tbody tr:not(#empty-state)")
    private List<WebElement> kelasRows;

    @FindBy(css = "#kelas-table tbody")
    private WebElement tableBody;

    @FindBy(id = "success-alert")
    private WebElement successAlert;

    @FindBy(id = "error-alert")
    private WebElement errorAlert;

    public KelasListPage(WebDriver webDriver, String url) {
        this.webDriver = webDriver;
        this.wait = new WebDriverWait(webDriver, Duration.ofSeconds(10));
        
        // Only navigate if we're not already on the correct page
        // This prevents consuming flash attributes with unnecessary additional requests
        if (!webDriver.getCurrentUrl().contains("/kelas") || 
            webDriver.getCurrentUrl().contains("/new") || 
            webDriver.getCurrentUrl().contains("/edit")) {
            webDriver.get(url);
        }
        
        // Wait for page to load
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("h1")));
        PageFactory.initElements(webDriver, this);
    }

    public String getPageTitle() {
        return webDriver.getTitle();
    }

    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")));
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
            wait.until(ExpectedConditions.or(
                ExpectedConditions.urlContains("search=" + searchTerm),
                ExpectedConditions.refreshed(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")))
            ));
        } catch (Exception e) {
            // Continue if wait fails
        }
    }

    public void clickTambahKelas() {
        wait.until(ExpectedConditions.elementToBeClickable(tambahKelasButton));
        tambahKelasButton.click();
    }

    public int getKelasCount() {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")));
        
        // Check if there's an empty state message
        List<WebElement> emptyStateElements = webDriver.findElements(By.id("empty-state"));
        if (!emptyStateElements.isEmpty() && emptyStateElements.get(0).isDisplayed()) {
            return 0;
        }
        
        return kelasRows.size();
    }

    public boolean isKelasVisible(String namaKelas) {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")));
        } catch (Exception e) {
            return false; // Table not found
        }
        
        // Check if empty state is displayed
        if (isEmptyStateDisplayed()) {
            return false;
        }
        
        // Try to find kelas by name using ID selector first for better performance
        try {
            List<WebElement> kelasElements = webDriver.findElements(By.cssSelector("div[id^='kelas-nama-']"));
            for (WebElement element : kelasElements) {
                if (element.getText().contains(namaKelas)) {
                    return element.isDisplayed();
                }
            }
        } catch (Exception e) {
            // Fallback to old method if new method fails
        }
        
        // Fallback to row-by-row search
        try {
            for (WebElement row : kelasRows) {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                if (cells.size() >= 2) {
                    String namaInRow = cells.get(1).getText();
                    if (namaInRow.contains(namaKelas)) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            // If we can't search rows, assume not visible
        }
        
        return false;
    }

    public String getKelasInfo(String namaKelas, int columnIndex) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table")));
        
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
            // Store reference to current row for staleness check
            WebElement kelasRow = findKelasRow(namaKelas);
            
            deleteButton.click();
            
            // Handle confirmation dialog
            try {
                wait.until(ExpectedConditions.alertIsPresent());
                webDriver.switchTo().alert().accept();
            } catch (Exception e) {
                // If no alert, continue
            }
            
            // Wait for page to refresh after deletion
            try {
                if (kelasRow != null) {
                    // Wait for the specific row to become stale (removed from DOM)
                    wait.until(ExpectedConditions.stalenessOf(kelasRow));
                } else {
                    // Fallback to waiting for page elements to update
                    wait.until(ExpectedConditions.or(
                        ExpectedConditions.refreshed(ExpectedConditions.presenceOfElementLocated(By.id("kelas-table"))),
                        ExpectedConditions.presenceOfElementLocated(By.id("empty-state"))
                    ));
                }
            } catch (Exception e) {
                // Continue if wait fails
            }
        }
    }
    
    private WebElement findKelasRow(String namaKelas) {
        try {
            for (WebElement row : kelasRows) {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                if (cells.size() >= 2) {
                    String namaInRow = cells.get(1).getText();
                    if (namaInRow.contains(namaKelas)) {
                        return row;
                    }
                }
            }
        } catch (Exception e) {
            // Continue if search fails
        }
        return null;
    }

    private WebElement findActionButton(String namaKelas, String iconClass) {
        for (WebElement row : kelasRows) {
            // Try to find by ID first
            List<WebElement> namaElements = row.findElements(By.cssSelector("div[id^='kelas-nama-']"));
            for (WebElement namaElement : namaElements) {
                if (namaElement.getText().contains(namaKelas)) {
                    // Extract kelas ID from the nama element's ID
                    String kelasId = namaElement.getAttribute("id").replace("kelas-nama-", "");
                    
                    // Find the specific action button by ID
                    String buttonId = null;
                    if (iconClass.equals("fa-eye")) {
                        buttonId = "view-btn-" + kelasId;
                    } else if (iconClass.equals("fa-edit")) {
                        buttonId = "edit-btn-" + kelasId;
                    } else if (iconClass.equals("fa-trash")) {
                        buttonId = "delete-btn-" + kelasId;
                    }
                    
                    if (buttonId != null) {
                        List<WebElement> buttons = webDriver.findElements(By.id(buttonId));
                        if (!buttons.isEmpty()) {
                            return buttons.get(0);
                        }
                    }
                }
            }
        }
        return null;
    }

    public boolean isSuccessMessageDisplayed() {
        try {
            // Wait for the success message to appear after redirect
            WebDriverWait shortWait = new WebDriverWait(webDriver, Duration.ofSeconds(5));
            shortWait.until(ExpectedConditions.presenceOfElementLocated(By.id("success-alert")));
            return successAlert.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isErrorMessageDisplayed() {
        try {
            // Wait a bit for the error message to appear
            WebDriverWait shortWait = new WebDriverWait(webDriver, Duration.ofSeconds(3));
            shortWait.until(ExpectedConditions.presenceOfElementLocated(By.id("error-alert")));
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
        List<WebElement> emptyStateElements = webDriver.findElements(By.id("empty-state"));
        return !emptyStateElements.isEmpty() && emptyStateElements.get(0).isDisplayed();
    }

    public String getEmptyStateMessage() {
        if (isEmptyStateDisplayed()) {
            WebElement emptyState = webDriver.findElement(By.id("empty-state"));
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