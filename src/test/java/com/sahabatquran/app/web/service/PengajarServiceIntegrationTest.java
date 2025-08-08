package com.sahabatquran.app.web.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.sahabatquran.app.web.TestcontainersConfiguration;
import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.repository.PengajarRepository;
import com.sahabatquran.app.web.service.PengajarService.PengajarNotFoundException;
import com.sahabatquran.app.web.service.PengajarService.PengajarValidationException;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class PengajarServiceIntegrationTest {

    @Autowired
    private PengajarService pengajarService;

    @Autowired
    private PengajarRepository pengajarRepository;

    private Pengajar testPengajar1;
    private Pengajar testPengajar2;

    @BeforeEach
    void setUp() {
        pengajarRepository.deleteAll();
        
        testPengajar1 = new Pengajar();
        testPengajar1.setNama("Ahmad Fulan");
        testPengajar1.setEmail("ahmad.fulan@sahabatquran.com");
        testPengajar1.setNomorHandphone("081234567890");
        
        testPengajar2 = new Pengajar();
        testPengajar2.setNama("Siti Khadijah");
        testPengajar2.setEmail("siti.khadijah@sahabatquran.com");
        testPengajar2.setNomorHandphone("081234567891");
    }

    @Test
    void shouldSaveNewPengajar() {
        // When
        Pengajar saved = pengajarService.save(testPengajar1);
        
        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getNama()).isEqualTo("Ahmad Fulan");
        assertThat(saved.getEmail()).isEqualTo("ahmad.fulan@sahabatquran.com");
        assertThat(saved.getNomorHandphone()).isEqualTo("081234567890");
        
        // Verify in database
        Optional<Pengajar> found = pengajarRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getNama()).isEqualTo("Ahmad Fulan");
    }

    @Test
    void shouldThrowExceptionWhenSavingPengajarWithDuplicateEmail() {
        // Given
        pengajarService.save(testPengajar1);
        
        Pengajar duplicateEmail = new Pengajar();
        duplicateEmail.setNama("Different Name");
        duplicateEmail.setEmail("ahmad.fulan@sahabatquran.com"); // Same email
        duplicateEmail.setNomorHandphone("081234567999");
        
        // When & Then
        assertThatThrownBy(() -> pengajarService.save(duplicateEmail))
            .isInstanceOf(PengajarValidationException.class)
            .hasMessageContaining("Email sudah terdaftar");
    }

    @Test
    void shouldThrowExceptionWhenSavingPengajarWithDuplicatePhone() {
        // Given
        pengajarService.save(testPengajar1);
        
        Pengajar duplicatePhone = new Pengajar();
        duplicatePhone.setNama("Different Name");
        duplicatePhone.setEmail("different@sahabatquran.com");
        duplicatePhone.setNomorHandphone("081234567890"); // Same phone
        
        // When & Then
        assertThatThrownBy(() -> pengajarService.save(duplicatePhone))
            .isInstanceOf(PengajarValidationException.class)
            .hasMessageContaining("Nomor handphone sudah terdaftar");
    }

    @Test
    void shouldFindAllPengajar() {
        // Given
        pengajarService.save(testPengajar1);
        pengajarService.save(testPengajar2);
        
        // When
        List<Pengajar> all = pengajarService.findAll();
        
        // Then
        assertThat(all).hasSize(2);
        assertThat(all).extracting("nama")
            .containsExactlyInAnyOrder("Ahmad Fulan", "Siti Khadijah");
    }

    @Test
    void shouldFindPengajarById() {
        // Given
        Pengajar saved = pengajarService.save(testPengajar1);
        
        // When
        Optional<Pengajar> found = pengajarService.findById(saved.getId());
        
        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getNama()).isEqualTo("Ahmad Fulan");
    }

    @Test
    void shouldReturnEmptyWhenFindingNonExistentPengajar() {
        // When
        Optional<Pengajar> found = pengajarService.findById("non-existent-id");
        
        // Then
        assertThat(found).isEmpty();
    }

    @ParameterizedTest
    @CsvSource({
        "ahmad.fulan@sahabatquran.com, true",
        "siti.khadijah@sahabatquran.com, false",
        "nonexistent@sahabatquran.com, false"
    })
    void shouldFindPengajarByEmail(String email, boolean shouldExist) {
        // Given
        pengajarService.save(testPengajar1);
        
        // When
        Optional<Pengajar> found = pengajarService.findByEmail(email);
        
        // Then
        if (shouldExist) {
            assertThat(found).isPresent();
            assertThat(found.get().getEmail()).isEqualTo(email);
        } else {
            assertThat(found).isEmpty();
        }
    }

    static Stream<Arguments> provideSearchTerms() {
        return Stream.of(
            Arguments.of("Ahmad", 1),
            Arguments.of("Siti", 1),
            Arguments.of("Fulan", 1),
            Arguments.of("Khadijah", 1),
            Arguments.of("ahmad", 1), // case insensitive
            Arguments.of("SITI", 1), // case insensitive
            Arguments.of("NonExistent", 0)
        );
    }

    @ParameterizedTest
    @MethodSource("provideSearchTerms")
    void shouldFindPengajarByNamaContaining(String searchTerm, int expectedCount) {
        // Given
        pengajarService.save(testPengajar1);
        pengajarService.save(testPengajar2);
        
        // When
        List<Pengajar> results = pengajarService.findByNamaContaining(searchTerm);
        
        // Then
        assertThat(results).hasSize(expectedCount);
    }

    @Test
    void shouldUpdateExistingPengajar() {
        // Given
        Pengajar saved = pengajarService.save(testPengajar1);
        
        Pengajar updates = new Pengajar();
        updates.setNama("Ahmad Fulan Updated");
        updates.setEmail("ahmad.fulan.updated@sahabatquran.com");
        updates.setNomorHandphone("081234567999");
        
        // When
        Pengajar updated = pengajarService.update(saved.getId(), updates);
        
        // Then
        assertThat(updated.getId()).isEqualTo(saved.getId());
        assertThat(updated.getNama()).isEqualTo("Ahmad Fulan Updated");
        assertThat(updated.getEmail()).isEqualTo("ahmad.fulan.updated@sahabatquran.com");
        assertThat(updated.getNomorHandphone()).isEqualTo("081234567999");
    }

    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentPengajar() {
        // Given
        Pengajar updates = new Pengajar();
        updates.setNama("New Name");
        updates.setEmail("new@sahabatquran.com");
        updates.setNomorHandphone("081234567999");
        
        // When & Then
        assertThatThrownBy(() -> pengajarService.update("non-existent-id", updates))
            .isInstanceOf(PengajarNotFoundException.class)
            .hasMessageContaining("Pengajar tidak ditemukan");
    }

    @Test
    void shouldAllowUpdatingPengajarWithSameEmailAndPhone() {
        // Given
        Pengajar saved = pengajarService.save(testPengajar1);
        
        Pengajar updates = new Pengajar();
        updates.setNama("Ahmad Fulan Updated");
        updates.setEmail(testPengajar1.getEmail()); // Same email
        updates.setNomorHandphone(testPengajar1.getNomorHandphone()); // Same phone
        
        // When
        Pengajar updated = pengajarService.update(saved.getId(), updates);
        
        // Then
        assertThat(updated.getNama()).isEqualTo("Ahmad Fulan Updated");
    }

    @Test
    void shouldThrowExceptionWhenUpdatingWithEmailUsedByAnotherPengajar() {
        // Given
        Pengajar saved1 = pengajarService.save(testPengajar1);
        Pengajar saved2 = pengajarService.save(testPengajar2);
        
        Pengajar updates = new Pengajar();
        updates.setNama("Updated Name");
        updates.setEmail(testPengajar2.getEmail()); // Email used by pengajar2
        updates.setNomorHandphone("081234567999");
        
        // When & Then
        assertThatThrownBy(() -> pengajarService.update(saved1.getId(), updates))
            .isInstanceOf(PengajarValidationException.class)
            .hasMessageContaining("Email sudah terdaftar");
    }

    @Test
    void shouldThrowExceptionWhenUpdatingWithPhoneUsedByAnotherPengajar() {
        // Given
        Pengajar saved1 = pengajarService.save(testPengajar1);
        Pengajar saved2 = pengajarService.save(testPengajar2);
        
        Pengajar updates = new Pengajar();
        updates.setNama("Updated Name");
        updates.setEmail("updated@sahabatquran.com");
        updates.setNomorHandphone(testPengajar2.getNomorHandphone()); // Phone used by pengajar2
        
        // When & Then
        assertThatThrownBy(() -> pengajarService.update(saved1.getId(), updates))
            .isInstanceOf(PengajarValidationException.class)
            .hasMessageContaining("Nomor handphone sudah terdaftar");
    }

    @Test
    void shouldDeleteExistingPengajar() {
        // Given
        Pengajar saved = pengajarService.save(testPengajar1);
        
        // When
        pengajarService.deleteById(saved.getId());
        
        // Then
        Optional<Pengajar> found = pengajarRepository.findById(saved.getId());
        assertThat(found).isEmpty();
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentPengajar() {
        // When & Then
        assertThatThrownBy(() -> pengajarService.deleteById("non-existent-id"))
            .isInstanceOf(PengajarNotFoundException.class)
            .hasMessageContaining("Pengajar tidak ditemukan");
    }

    @ParameterizedTest
    @CsvSource({
        "true, true",
        "false, false"
    })
    void shouldCheckPengajarExistence(boolean shouldExist, boolean expected) {
        // Given
        String id = null;
        if (shouldExist) {
            Pengajar saved = pengajarService.save(testPengajar1);
            id = saved.getId();
        } else {
            id = "non-existent-id";
        }
        
        // When
        boolean exists = pengajarService.existsById(id);
        
        // Then
        assertThat(exists).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "ahmad.fulan@sahabatquran.com, true",
        "nonexistent@sahabatquran.com, false"
    })
    void shouldCheckEmailExistence(String email, boolean expected) {
        // Given
        pengajarService.save(testPengajar1);
        
        // When
        boolean exists = pengajarService.existsByEmail(email);
        
        // Then
        assertThat(exists).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "081234567890, true",
        "081234567999, false"
    })
    void shouldCheckPhoneExistence(String phone, boolean expected) {
        // Given
        pengajarService.save(testPengajar1);
        
        // When
        boolean exists = pengajarService.existsByNomorHandphone(phone);
        
        // Then
        assertThat(exists).isEqualTo(expected);
    }
}