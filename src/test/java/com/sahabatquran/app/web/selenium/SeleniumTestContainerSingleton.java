package com.sahabatquran.app.web.selenium;

import java.io.File;
import java.time.Duration;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testcontainers.containers.BrowserWebDriverContainer;
import org.testcontainers.containers.BrowserWebDriverContainer.VncRecordingMode;
import org.testcontainers.containers.VncRecordingContainer.VncRecordingFormat;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class SeleniumTestContainerSingleton {

    public static final String TESTCONTAINER_HOST_URL = "http://host.testcontainers.internal";
    private static final File RECORDING_OUTPUT_FOLDER = new File("./target/selenium-recordings/");
    
    private static BrowserWebDriverContainer<?> container;
    public static WebDriver DRIVER;
    
    static {
        initialize();
        Runtime.getRuntime().addShutdownHook(new Thread(SeleniumTestContainerSingleton::cleanup));
    }
    
    private static void initialize() {
        String browser = System.getProperty("selenium.browser", "firefox").toLowerCase();
        boolean recordingEnabled = Boolean.parseBoolean(System.getProperty("selenium.recording.enabled", "false"));
        
        log.info("Initializing Selenium TestContainer with browser: {} and recording: {}", browser, recordingEnabled);
        
        container = new BrowserWebDriverContainer<>()
            .withAccessToHost(true);
            
        // Set browser capabilities
        switch (browser) {
            case "chrome":
                container.withCapabilities(new ChromeOptions());
                break;
            case "firefox":
            default:
                container.withCapabilities(new FirefoxOptions());
                break;
        }
        
        // Configure recording if enabled
        if (recordingEnabled) {
            RECORDING_OUTPUT_FOLDER.mkdirs();
            container.withRecordingMode(
                VncRecordingMode.RECORD_ALL, 
                RECORDING_OUTPUT_FOLDER,
                VncRecordingFormat.MP4);
        }
        
        container.start();
        
        // Initialize WebDriver
        switch (browser) {
            case "chrome":
                DRIVER = new RemoteWebDriver(container.getSeleniumAddress(), new ChromeOptions());
                break;
            case "firefox":
            default:
                DRIVER = new RemoteWebDriver(container.getSeleniumAddress(), new FirefoxOptions());
                break;
        }
        
        DRIVER.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
        
        log.info("Selenium TestContainer initialized successfully");
        log.info("VNC URL: {}", container.getVncAddress());
    }
    
    public static BrowserWebDriverContainer<?> getContainer() {
        return container;
    }
    
    private static void cleanup() {
        if (DRIVER != null) {
            try {
                DRIVER.quit();
                log.info("WebDriver closed successfully");
            } catch (Exception e) {
                log.warn("Error closing WebDriver: {}", e.getMessage());
            }
        }
        
        if (container != null) {
            try {
                container.stop();
                log.info("Selenium container stopped successfully");
            } catch (Exception e) {
                log.warn("Error stopping container: {}", e.getMessage());
            }
        }
    }
}