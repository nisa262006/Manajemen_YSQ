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

public class HomePage {

    @FindBy(xpath = "//*[@id='appTitle']")
    private WebElement appTitle;

    private WebDriver webDriver;

    public HomePage(WebDriver wd, String url, String title){
        this.webDriver = wd;
        webDriver.get(url);
        new WebDriverWait(webDriver, Duration.ofSeconds(10))
            .until(ExpectedConditions.titleIs(title));
        PageFactory.initElements(webDriver, this);
    }

    public void checkTitle(String title){
        // Wait for the appTitle element to be present and have text content
        WebDriverWait wait = new WebDriverWait(webDriver, Duration.ofSeconds(15));
        
        // Wait for element to be present
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("appTitle")));
        
        // Wait for element to have the expected text content
        wait.until(ExpectedConditions.textToBe(By.id("appTitle"), title));
        
        // Verify the title
        String actualTitle = appTitle.getText().trim();
        Assertions.assertEquals(title, actualTitle, 
            "Expected title '" + title + "' but found '" + actualTitle + "'");
    }

    public void clickRegistrationButton() {
        new WebDriverWait(webDriver, Duration.ofSeconds(5))
            .until(ExpectedConditions.elementToBeClickable(By.id("registerBtn")))
            .click();
    }
}
