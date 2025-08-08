package com.sahabatquran.app.web.selenium;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.jdbc.Sql;

import com.sahabatquran.app.web.repository.PengajarRepository;
import com.sahabatquran.app.web.selenium.pages.PengajarDetailPage;
import com.sahabatquran.app.web.selenium.pages.PengajarFormPage;
import com.sahabatquran.app.web.selenium.pages.PengajarListPage;

@DisplayName("Pengajar CRUD Functional Tests")
@Sql(scripts = {"classpath:/sql/clear-data.sql"})
class PengajarCrudFunctionalTest extends BaseSeleniumTests {

    @Autowired
    private PengajarRepository pengajarRepository;

    @Test
    @DisplayName("Should display empty pengajar list initially")
    void shouldDisplayEmptyPengajarListInitially() {
        // Given - Empty database
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        
        // Then - Should show empty state
        assertTrue(listPage.isPageLoaded());
        assertTrue(listPage.isEmptyStateDisplayed());
        assertEquals(0, listPage.getPengajarCount());
        assertNotNull(listPage.getEmptyStateMessage());
    }

    @Test
    @DisplayName("Should navigate to add pengajar form")
    void shouldNavigateToAddPengajarForm() {
        // Given - User is on pengajar list page
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        
        // When - User clicks tambah pengajar
        PengajarFormPage formPage = listPage.goToAddPengajar();
        
        // Then - Should be on add form page
        assertTrue(formPage.isFormLoaded());
        assertFalse(formPage.isEditMode());
        assertTrue(webDriver.getCurrentUrl().contains("/pengajar/new"));
    }

    @Test
    @DisplayName("Should successfully create new pengajar")
    void shouldSuccessfullyCreateNewPengajar() {
        // Given - User is on add pengajar form
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String nama = "Ahmad Test " + uniqueId;
        String email = "ahmad.test." + uniqueId + "@sahabatquran.com";
        String phone = "081234" + uniqueId.substring(0, 6);
        
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        
        // When - User fills and submits valid form
        formPage.fillForm(nama, email, phone);
        PengajarListPage listPage = formPage.submitAndGoToList();
        
        // Then - Should be redirected to list with success message
        assertNotNull(listPage);
        assertTrue(listPage.isSuccessMessageDisplayed());
        assertTrue(listPage.isPengajarVisible(nama));
        assertEquals(1, listPage.getPengajarCount());
        
        // And - Should be saved in database
        assertTrue(pengajarRepository.existsByEmail(email));
    }

    static Stream<Arguments> provideInvalidPengajarData() {
        return Stream.of(
            Arguments.of("", "valid@email.com", "081234567890", "nama kosong"),
            Arguments.of("Valid Name", "", "081234567890", "email kosong"),
            Arguments.of("Valid Name", "valid@email.com", "", "phone kosong"),
            Arguments.of("Valid Name", "invalid-email", "081234567890", "email tidak valid"),
            Arguments.of("Valid Name", "valid@email.com", "123456789", "phone tidak valid"),
            Arguments.of("Valid Name", "valid@email.com", "0812345", "phone terlalu pendek")
        );
    }

    @ParameterizedTest
    @MethodSource("provideInvalidPengajarData")
    @DisplayName("Should show validation errors for invalid data")
    void shouldShowValidationErrorsForInvalidData(String nama, String email, String phone, String testCase) {
        // Given - User is on add pengajar form
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        
        // When - User fills form with invalid data
        formPage.fillForm(nama, email, phone);
        formPage.submitForm();
        
        // Then - Should stay on form page with validation errors
        assertTrue(webDriver.getCurrentUrl().contains("/pengajar/new"), 
                  "Should stay on form page for case: " + testCase);
        
        // Client-side validation should prevent submission or server should return errors
        boolean hasClientSideValidation = webDriver.getCurrentUrl().contains("/pengajar/new");
        boolean hasServerSideError = formPage.hasValidationError() || formPage.isErrorMessageDisplayed();
        
        assertTrue(hasClientSideValidation || hasServerSideError, 
                  "Should have validation error for case: " + testCase);
    }

    @Test
    @DisplayName("Should view pengajar details")
    void shouldViewPengajarDetails() {
        // Given - A pengajar exists
        String nama = "Test Pengajar Detail";
        String email = "detail.test@sahabatquran.com";
        String phone = "081234567890";
        
        createTestPengajar(nama, email, phone);
        
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        
        // When - User clicks view pengajar
        PengajarDetailPage detailPage = listPage.goToPengajarDetail(nama);
        
        // Then - Should show pengajar details
        assertTrue(detailPage.isPageLoaded());
        assertEquals(nama, detailPage.getPengajarNama());
        assertEquals(email, detailPage.getPengajarEmail());
        assertEquals(phone, detailPage.getPengajarNomorHandphone());
        assertNotNull(detailPage.getPengajarId());
    }

    @Test
    @DisplayName("Should edit existing pengajar")
    void shouldEditExistingPengajar() {
        // Given - A pengajar exists
        String originalNama = "Original Name";
        String originalEmail = "original@sahabatquran.com";
        String originalPhone = "081234567890";
        
        createTestPengajar(originalNama, originalEmail, originalPhone);
        
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        PengajarFormPage formPage = listPage.goToEditPengajar(originalNama);
        
        // When - User edits the pengajar
        String updatedNama = "Updated Name";
        String updatedEmail = "updated@sahabatquran.com";
        String updatedPhone = "081234567891";
        
        assertTrue(formPage.isEditMode());
        formPage.fillForm(updatedNama, updatedEmail, updatedPhone);
        PengajarListPage updatedListPage = formPage.submitAndGoToList();
        
        // Then - Should be updated successfully
        assertNotNull(updatedListPage);
        assertTrue(updatedListPage.isSuccessMessageDisplayed());
        assertTrue(updatedListPage.isPengajarVisible(updatedNama));
        assertFalse(updatedListPage.isPengajarVisible(originalNama));
        
        // And - Should be updated in database
        assertTrue(pengajarRepository.existsByEmail(updatedEmail));
        assertFalse(pengajarRepository.existsByEmail(originalEmail));
    }

    @Test
    @DisplayName("Should delete pengajar")
    void shouldDeletePengajar() {
        // Given - A pengajar exists
        String nama = "To Be Deleted";
        String email = "delete@sahabatquran.com";
        String phone = "081234567890";
        
        createTestPengajar(nama, email, phone);
        
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        assertTrue(listPage.isPengajarVisible(nama));
        
        // When - User deletes the pengajar
        listPage.clickDeletePengajar(nama);
        
        // Then - Should be deleted successfully
        assertTrue(listPage.isSuccessMessageDisplayed());
        assertFalse(listPage.isPengajarVisible(nama));
        assertEquals(0, listPage.getPengajarCount());
        
        // And - Should be deleted from database
        assertFalse(pengajarRepository.existsByEmail(email));
    }

    @ParameterizedTest
    @CsvSource({
        "Ahmad, true",
        "Siti, true", 
        "Fulan, true",
        "NonExistent, false"
    })
    @DisplayName("Should search pengajar by name")
    void shouldSearchPengajarByName(String searchTerm, boolean shouldFind) {
        // Given - Multiple pengajar exist
        createTestPengajar("Ahmad Fulan", "ahmad@sahabatquran.com", "081234567890");
        createTestPengajar("Siti Khadijah", "siti@sahabatquran.com", "081234567891");
        createTestPengajar("Muhammad Ali", "muhammad@sahabatquran.com", "081234567892");
        
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        
        // When - User searches for pengajar
        listPage.searchPengajar(searchTerm);
        
        // Then - Should show filtered results
        if (shouldFind) {
            assertTrue(listPage.getPengajarCount() > 0, "Should find pengajar for search: " + searchTerm);
        } else {
            assertEquals(0, listPage.getPengajarCount(), "Should not find pengajar for search: " + searchTerm);
        }
    }

    @Test
    @DisplayName("Should prevent duplicate email registration")
    void shouldPreventDuplicateEmailRegistration() {
        // Given - A pengajar with specific email exists
        String existingEmail = "existing@sahabatquran.com";
        createTestPengajar("Existing User", existingEmail, "081234567890");
        
        // When - User tries to create another pengajar with same email
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        formPage.fillForm("New User", existingEmail, "081234567891");
        formPage.submitFormBypassingClientValidation();
        
        // Then - Should show error message
        assertTrue(formPage.isErrorMessageDisplayed() || formPage.hasValidationError());
        
        // And - Should stay on form page
        assertTrue(webDriver.getCurrentUrl().contains("/pengajar/new"));
    }

    @Test
    @DisplayName("Should prevent duplicate phone registration")
    void shouldPreventDuplicatePhoneRegistration() {
        // Given - A pengajar with specific phone exists
        String existingPhone = "081234567890";
        createTestPengajar("Existing User", "existing@sahabatquran.com", existingPhone);
        
        // When - User tries to create another pengajar with same phone
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        formPage.fillForm("New User", "new@sahabatquran.com", existingPhone);
        formPage.submitFormBypassingClientValidation();
        
        // Then - Should show error message
        assertTrue(formPage.isErrorMessageDisplayed() || formPage.hasValidationError());
        
        // And - Should stay on form page
        assertTrue(webDriver.getCurrentUrl().contains("/pengajar/new"));
    }

    @Test
    @DisplayName("Should reset form when reset button clicked")
    void shouldResetFormWhenResetButtonClicked() {
        // Given - User filled form with data
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        formPage.fillForm("Test Name", "test@email.com", "081234567890");
        
        // When - User clicks reset button
        formPage.resetForm();
        
        // Then - Form should be cleared
        assertEquals("", formPage.getNamaValue());
        assertEquals("", formPage.getEmailValue());
        assertEquals("", formPage.getNomorHandphoneValue());
    }

    @Test
    @DisplayName("Should navigate back from form to list")
    void shouldNavigateBackFromFormToList() {
        // Given - User is on add form
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        
        // When - User clicks back button
        PengajarListPage listPage = formPage.goBackToList();
        
        // Then - Should be on list page
        assertTrue(listPage.isPageLoaded());
        assertTrue(webDriver.getCurrentUrl().contains("/pengajar"));
        assertFalse(webDriver.getCurrentUrl().contains("/new"));
    }

    @Test
    @DisplayName("Should display contact links in detail page")
    void shouldDisplayContactLinksInDetailPage() {
        // Given - A pengajar exists
        createTestPengajar("Contact Test", "contact@sahabatquran.com", "081234567890");
        
        PengajarListPage listPage = new PengajarListPage(webDriver, getHostUrl() + "/pengajar");
        PengajarDetailPage detailPage = listPage.goToPengajarDetail("Contact Test");
        
        // Then - Should show contact links
        assertTrue(detailPage.hasEmailLink());
        assertTrue(detailPage.hasPhoneLink());
        assertTrue(detailPage.hasWhatsAppLink());
    }

    private void createTestPengajar(String nama, String email, String phone) {
        PengajarFormPage formPage = new PengajarFormPage(webDriver, getHostUrl() + "/pengajar/new");
        formPage.fillForm(nama, email, phone);
        formPage.submitAndGoToList();
    }
}