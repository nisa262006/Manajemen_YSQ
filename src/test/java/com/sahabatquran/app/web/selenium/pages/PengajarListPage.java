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

public class PengajarListPage {

    private final WebDriver webDriver;
    private final WebDriverWait wait;

    @FindBy(css = "input[name='search']")
    private WebElement searchInput;

    @FindBy(css = "a[href*='/pengajar/new']")
    private WebElement tambahPengajarButton;

    @FindBy(css = "table tbody tr")
    private List<WebElement> pengajarRows;

    @FindBy(css = "table tbody")
    private WebElement tableBody;

    @FindBy(css = ".bg-green-50")
    private WebElement successAlert;

    @FindBy(css = ".bg-red-50")
    private WebElement errorAlert;

    public PengajarListPage(WebDriver webDriver, String url) {
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

    public void searchPengajar(String searchTerm) {
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

    public void clickTambahPengajar() {
        wait.until(ExpectedConditions.elementToBeClickable(tambahPengajarButton));
        tambahPengajarButton.click();
    }

    public int getPengajarCount() {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        // Check if there's an empty state message
        List<WebElement> emptyStateElements = webDriver.findElements(By.cssSelector("td[colspan='5']"));
        if (!emptyStateElements.isEmpty()) {
            return 0;
        }
        
        return pengajarRows.size();
    }

    public boolean isPengajarVisible(String nama) {
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("table")));
        
        for (WebElement row : pengajarRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String namaInRow = cells.get(1).getText(); // Assuming nama is in second column
                if (namaInRow.contains(nama)) {
                    return true;
                }
            }
        }
        return false;
    }

    public void clickViewPengajar(String nama) {
        WebElement viewButton = findActionButton(nama, "fa-eye");
        if (viewButton != null) {
            viewButton.click();
        }
    }

    public void clickEditPengajar(String nama) {
        WebElement editButton = findActionButton(nama, "fa-edit");
        if (editButton != null) {
            editButton.click();
        }
    }

    public void clickDeletePengajar(String nama) {
        WebElement deleteButton = findActionButton(nama, "fa-trash");
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

    private WebElement findActionButton(String nama, String iconClass) {
        for (WebElement row : pengajarRows) {
            List<WebElement> cells = row.findElements(By.tagName("td"));
            if (cells.size() >= 2) {
                String namaInRow = cells.get(1).getText();
                if (namaInRow.contains(nama)) {
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

    public List<String> getAllPengajarNames() {
        return pengajarRows.stream()
            .map(row -> {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                return cells.size() >= 2 ? cells.get(1).getText() : "";
            })
            .filter(name -> !name.isEmpty())
            .toList();
    }

    public PengajarDetailPage goToPengajarDetail(String nama) {
        clickViewPengajar(nama);
        return new PengajarDetailPage(webDriver, webDriver.getCurrentUrl());
    }

    public PengajarFormPage goToEditPengajar(String nama) {
        clickEditPengajar(nama);
        return new PengajarFormPage(webDriver, webDriver.getCurrentUrl());
    }

    public PengajarFormPage goToAddPengajar() {
        clickTambahPengajar();
        return new PengajarFormPage(webDriver, webDriver.getCurrentUrl());
    }
}