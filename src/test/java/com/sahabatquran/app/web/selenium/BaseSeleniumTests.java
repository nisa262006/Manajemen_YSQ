package com.sahabatquran.app.web.selenium;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.WebDriver;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.UseMainMethod;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.testcontainers.Testcontainers;
import org.testcontainers.lifecycle.TestDescription;

import com.sahabatquran.app.web.TestcontainersConfiguration;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Import(TestcontainersConfiguration.class)
@SpringBootTest(
    useMainMethod = UseMainMethod.WHEN_AVAILABLE, 
    webEnvironment = WebEnvironment.RANDOM_PORT,
    properties = {
        "server.servlet.session.tracking-modes=cookie",
        "server.servlet.session.cookie.http-only=false",
        "server.servlet.session.cookie.secure=false",
        "server.servlet.session.cookie.same-site=none"
    }
)
public abstract class BaseSeleniumTests {

    WebDriver webDriver;

    @LocalServerPort Integer webappPort;

    @BeforeEach
	void setupWebDriver() throws Exception {
        Testcontainers.exposeHostPorts(webappPort); 
		webDriver = SeleniumTestContainerSingleton.DRIVER;
		log.info("Using singleton WebDriver");
		log.info("VNC URL : {}", SeleniumTestContainerSingleton.getContainer().getVncAddress());
	}

    @AfterEach
	void stopWebDriver(){
		SeleniumTestContainerSingleton.getContainer().afterTest(
                new TestDescription() {
                    @Override
                    public String getTestId() {
                        return getFilesystemFriendlyName();
                    }

                    @Override
                    public String getFilesystemFriendlyName() {
                        return getTestName();
                    }
                },
                Optional.empty()
            );
	}

    String getHostUrl(){
        return SeleniumTestContainerSingleton.TESTCONTAINER_HOST_URL + ":" + webappPort;
    }

    String getTestName(){
        return this.getClass().getSimpleName();
    }
}
