package com.sahabatquran.app.web.selenium.pages;

import java.time.Duration;

import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class HomePage {

    @FindBy(xpath = "//*[@id='appTitle']")
    private String appTitle;

    private WebDriver webDriver;

    public HomePage(WebDriver wd, String url, String title){
        this.webDriver = wd;
        webDriver.get(url);
        new WebDriverWait(webDriver, Duration.ofSeconds(10))
            .until(ExpectedConditions.titleIs(title));
        PageFactory.initElements(webDriver, this);
    }

    public void checkTitle(String title){
        Assertions.assertEquals(title, new WebDriverWait(webDriver, Duration.ofSeconds(5))
        .until(ExpectedConditions.presenceOfElementLocated(By.xpath("//*[@id='appTitle']")))
        .getText());
    }

    public void clickRegistrationButton() {
        new WebDriverWait(webDriver, Duration.ofSeconds(5))
            .until(ExpectedConditions.elementToBeClickable(By.id("registerBtn")))
            .click();
    }
}
