package com.sahabatquran.app.web.selenium;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.sahabatquran.app.web.repository.PesertaRepository;
import com.sahabatquran.app.web.selenium.pages.HomePage;
import com.sahabatquran.app.web.selenium.pages.PendaftaranPage;

@DisplayName("Student Registration Functional Tests")
class PendaftaranFunctionalTest extends BaseSeleniumTests {

    @Autowired
    private PesertaRepository pesertaRepository;

    @Test
    @DisplayName("Should navigate to registration form from home page")
    void shouldNavigateToRegistrationFromHomePage() {
        // Given - User is on home page
        HomePage homePage = new HomePage(webDriver, getHostUrl() + "/", "Sahabat Quran");
        homePage.checkTitle("Sahabat Quran");
        
        // When - User clicks registration button
        homePage.clickRegistrationButton();
        
        // Then - User should be on registration page
        PendaftaranPage pendaftaranPage = new PendaftaranPage(webDriver, webDriver.getCurrentUrl());
        pendaftaranPage.checkPageTitle();
        assertTrue(webDriver.getCurrentUrl().contains("/pendaftaran"));
    }

    @Test
    @DisplayName("Should successfully register a new student")
    void shouldSuccessfullyRegisterNewStudent() {
        // Given - User is on registration page
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String email = "test" + uniqueId + "@example.com";
        String phone = "08123456" + uniqueId.substring(0, 4);
        
        PendaftaranPage pendaftaranPage = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        
        // When - User fills valid registration form
        pendaftaranPage.fillNama("Ahmad Test " + uniqueId);
        pendaftaranPage.fillEmail(email);
        pendaftaranPage.fillPhone(phone);
        pendaftaranPage.submitForm();
        
        // Then - Registration should be successful
        assertTrue(pendaftaranPage.isSuccessPageDisplayed());
        assertTrue(webDriver.getCurrentUrl().contains("/pendaftaran/sukses"));
        
        // And - Student should be saved in database
        assertTrue(pesertaRepository.existsByEmail(email));
    }

    @Test
    @DisplayName("Should show validation error for empty required fields")
    void shouldShowValidationErrorForEmptyFields() {
        // Given - User is on registration page
        PendaftaranPage pendaftaranPage = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        
        // When - User submits form with empty fields
        pendaftaranPage.submitForm();
        
        // Then - Form should stay on same page (HTML5 validation will prevent submission)
        assertTrue(webDriver.getCurrentUrl().contains("/pendaftaran"));
    }

    @Test
    @DisplayName("Should show validation error for invalid email format")
    void shouldShowValidationErrorForInvalidEmail() {
        // Given - User is on registration page
        PendaftaranPage pendaftaranPage = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        
        // When - User fills form with invalid email
        pendaftaranPage.fillNama("Test User");
        pendaftaranPage.fillEmail("invalid-email");
        pendaftaranPage.fillPhone("081234567890");
        pendaftaranPage.submitForm();
        
        // Then - Form should stay on same page (HTML5 validation will prevent submission)
        assertTrue(webDriver.getCurrentUrl().contains("/pendaftaran"));
    }

    @Test
    @DisplayName("Should show error for duplicate email registration")
    void shouldShowErrorForDuplicateEmail() {
        // Given - A student already exists
        String existingEmail = "existing@example.com";
        String existingPhone = "081234567999";
        
        PendaftaranPage firstRegistration = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        firstRegistration.fillNama("First Student");
        firstRegistration.fillEmail(existingEmail);
        firstRegistration.fillPhone(existingPhone);
        firstRegistration.submitForm();
        
        // Wait for successful registration
        assertTrue(firstRegistration.isSuccessPageDisplayed());
        
        // When - Another user tries to register with same email
        PendaftaranPage secondRegistration = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        secondRegistration.fillNama("Second Student");
        secondRegistration.fillEmail(existingEmail); // Same email
        secondRegistration.fillPhone("081234567888"); // Different phone
        secondRegistration.submitForm();
        
        // Then - Should show error message and stay on registration page
        assertTrue(secondRegistration.isErrorMessageDisplayed("Email sudah terdaftar"));
        assertTrue(webDriver.getCurrentUrl().contains("/pendaftaran"));
    }

    @Test
    @DisplayName("Should show error for duplicate phone number registration")
    void shouldShowErrorForDuplicatePhone() {
        // Given - A student already exists
        String existingEmail = "existing2@example.com";
        String existingPhone = "081234567998";
        
        PendaftaranPage firstRegistration = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        firstRegistration.fillNama("First Student");
        firstRegistration.fillEmail(existingEmail);
        firstRegistration.fillPhone(existingPhone);
        firstRegistration.submitForm();
        
        // Wait for successful registration
        assertTrue(firstRegistration.isSuccessPageDisplayed());
        
        // When - Another user tries to register with same phone
        PendaftaranPage secondRegistration = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        secondRegistration.fillNama("Second Student");
        secondRegistration.fillEmail("different@example.com"); // Different email
        secondRegistration.fillPhone(existingPhone); // Same phone
        secondRegistration.submitForm();
        
        // Then - Should show error message and stay on registration page
        assertTrue(secondRegistration.isErrorMessageDisplayed("Nomor handphone sudah terdaftar"));
        assertTrue(webDriver.getCurrentUrl().contains("/pendaftaran"));
    }

    @Test
    @DisplayName("Should navigate back to home from success page")
    void shouldNavigateBackToHomeFromSuccessPage() {
        // Given - User successfully registered
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        PendaftaranPage pendaftaranPage = new PendaftaranPage(webDriver, getHostUrl() + "/pendaftaran");
        
        pendaftaranPage.fillNama("Test User " + uniqueId);
        pendaftaranPage.fillEmail("test" + uniqueId + "@example.com");
        pendaftaranPage.fillPhone("08123456" + uniqueId.substring(0, 4));
        pendaftaranPage.submitForm();
        
        assertTrue(pendaftaranPage.isSuccessPageDisplayed());
        
        // When - User clicks back to home button
        webDriver.findElement(org.openqa.selenium.By.id("backToHomeBtn")).click();
        
        // Then - User should be back on home page
        HomePage homePage = new HomePage(webDriver, webDriver.getCurrentUrl(), "Sahabat Quran");
        homePage.checkTitle("Sahabat Quran");
        assertTrue(webDriver.getCurrentUrl().endsWith("/"));
    }
}