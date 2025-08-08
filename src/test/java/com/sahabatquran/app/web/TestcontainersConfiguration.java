package com.sahabatquran.app.web;

import java.io.File;

import org.openqa.selenium.firefox.FirefoxOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.BrowserWebDriverContainer;
import org.testcontainers.containers.BrowserWebDriverContainer.VncRecordingMode;
import org.testcontainers.containers.VncRecordingContainer.VncRecordingFormat;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	public static final String TESTCONTAINER_HOST_URL = "http://host.testcontainers.internal";
	private static final File RECORDING_OUTPUT_FOLDER = new File("./target/selenium-recordings/");

	@Value("${selenium.recording.enabled:false}")
	private boolean seleniumRecordingEnabled;

	@Bean
	@ServiceConnection
	PostgreSQLContainer<?> postgresContainer() {
		return new PostgreSQLContainer<>(DockerImageName.parse("postgres:16"));
	}

	@SuppressWarnings("resource")
	@Bean
	BrowserWebDriverContainer<?> browserContainer(){
		BrowserWebDriverContainer<?> container = new BrowserWebDriverContainer<>()
			.withAccessToHost(true)
    		.withCapabilities(new FirefoxOptions());
		
		if (seleniumRecordingEnabled) {
			RECORDING_OUTPUT_FOLDER.mkdirs();
			container.withRecordingMode(
				VncRecordingMode.RECORD_ALL, 
				RECORDING_OUTPUT_FOLDER,
				VncRecordingFormat.MP4);
		}
		
		return container;
	}
}
