package com.sahabatquran.app.web.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.annotation.Commit;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import com.sahabatquran.app.web.TestcontainersConfiguration;
import com.sahabatquran.app.web.entity.Peserta;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("Peserta Registration Integration Tests")
@Sql(scripts = "/test-data/cleanup-peserta.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Transactional
@Rollback
class PesertaRegistrationIntegrationTest {

    @Autowired
    private PesertaRepository pesertaRepository;
    
    private final Validator validator;
    
    public PesertaRegistrationIntegrationTest() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            this.validator = factory.getValidator();
        }
    }

    @Test
    @DisplayName("Should successfully register a new student")
    void shouldRegisterNewStudent() {
        // Given
        Peserta peserta = new Peserta();
        peserta.setNama("Ahmad Faiz");
        peserta.setEmail("ahmad.faiz@example.com");
        peserta.setNomorHandphone("081234567890");

        // When
        Peserta savedPeserta = pesertaRepository.save(peserta);

        // Then
        assertThat(savedPeserta.getId()).isNotNull();
        assertThat(savedPeserta.getNama()).isEqualTo("Ahmad Faiz");
        assertThat(savedPeserta.getEmail()).isEqualTo("ahmad.faiz@example.com");
        assertThat(savedPeserta.getNomorHandphone()).isEqualTo("081234567890");
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckEmailExists() {
        // Given
        Peserta peserta = new Peserta();
        peserta.setNama("Siti Khadijah");
        peserta.setEmail("siti.khadijah@example.com");
        peserta.setNomorHandphone("081234567891");
        pesertaRepository.save(peserta);

        // When & Then
        assertThat(pesertaRepository.existsByEmail("siti.khadijah@example.com")).isTrue();
        assertThat(pesertaRepository.existsByEmail("nonexistent@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should check if phone number exists")
    void shouldCheckPhoneExists() {
        // Given
        Peserta peserta = new Peserta();
        peserta.setNama("Muhammad Ali");
        peserta.setEmail("muhammad.ali@example.com");
        peserta.setNomorHandphone("081234567892");
        pesertaRepository.save(peserta);

        // When & Then
        assertThat(pesertaRepository.existsByNomorHandphone("081234567892")).isTrue();
        assertThat(pesertaRepository.existsByNomorHandphone("081999999999")).isFalse();
    }

    @Test
    @DisplayName("Should prevent duplicate email registration")
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void shouldPreventDuplicateEmail() {
        // Given
        Peserta peserta1 = new Peserta();
        peserta1.setNama("Fatimah Test");
        peserta1.setEmail("fatimah.test@example.com");
        peserta1.setNomorHandphone("081234567893");
        pesertaRepository.save(peserta1);

        // When
        Peserta peserta2 = new Peserta();
        peserta2.setNama("Aisyah");
        peserta2.setEmail("fatimah.test@example.com"); // Same email
        peserta2.setNomorHandphone("081234567894");

        // Then
        assertThrows(DataIntegrityViolationException.class, () -> {
            pesertaRepository.save(peserta2);
        });
    }

    @Test
    @DisplayName("Should prevent duplicate phone number registration")
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void shouldPreventDuplicatePhone() {
        // Given
        Peserta peserta1 = new Peserta();
        peserta1.setNama("Umar");
        peserta1.setEmail("umar@example.com");
        peserta1.setNomorHandphone("081234567895");
        pesertaRepository.save(peserta1);

        // When
        Peserta peserta2 = new Peserta();
        peserta2.setNama("Usman");
        peserta2.setEmail("usman@example.com");
        peserta2.setNomorHandphone("081234567895"); // Same phone

        // Then
        assertThrows(DataIntegrityViolationException.class, () -> {
            pesertaRepository.save(peserta2);
        });
    }

    @Test
    @DisplayName("Should validate required fields")
    void shouldValidateRequiredFields() {
        // Given - Peserta with null name
        Peserta pesertaWithoutName = new Peserta();
        pesertaWithoutName.setEmail("valid@example.com");
        pesertaWithoutName.setNomorHandphone("081234567896");

        // When & Then
        var violations = validator.validate(pesertaWithoutName);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("nama"));

        // Given - Peserta with null email
        Peserta pesertaWithoutEmail = new Peserta();
        pesertaWithoutEmail.setNama("Valid Name");
        pesertaWithoutEmail.setNomorHandphone("081234567897");

        // When & Then
        var emailViolations = validator.validate(pesertaWithoutEmail);
        assertThat(emailViolations).isNotEmpty();
        assertThat(emailViolations).anyMatch(v -> v.getPropertyPath().toString().equals("email"));
    }

    @Test
    @DisplayName("Should validate email format")
    void shouldValidateEmailFormat() {
        // Given
        Peserta pesertaWithInvalidEmail = new Peserta();
        pesertaWithInvalidEmail.setNama("Valid Name");
        pesertaWithInvalidEmail.setEmail("invalid-email");
        pesertaWithInvalidEmail.setNomorHandphone("081234567898");

        // When & Then
        var violations = validator.validate(pesertaWithInvalidEmail);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("email"));
    }

    @Test
    @DisplayName("Should validate minimum field lengths")
    void shouldValidateMinimumFieldLengths() {
        // Given - Name too short
        Peserta pesertaWithShortName = new Peserta();
        pesertaWithShortName.setNama("AB"); // Less than 3 characters
        pesertaWithShortName.setEmail("valid@example.com");
        pesertaWithShortName.setNomorHandphone("081234567899");

        // When & Then
        var violations = validator.validate(pesertaWithShortName);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("nama"));
    }

    @Test
    @DisplayName("Should find student by email")
    void shouldFindByEmail() {
        // Given
        Peserta peserta = new Peserta();
        peserta.setNama("Khalid ibn Walid");
        peserta.setEmail("khalid@example.com");
        peserta.setNomorHandphone("081234567800");
        pesertaRepository.save(peserta);

        // When
        var foundPeserta = pesertaRepository.findByEmail("khalid@example.com");

        // Then
        assertThat(foundPeserta).isPresent();
        assertThat(foundPeserta.get().getNama()).isEqualTo("Khalid ibn Walid");
    }

    @Test
    @DisplayName("Should find student by phone number")
    void shouldFindByPhoneNumber() {
        // Given
        Peserta peserta = new Peserta();
        peserta.setNama("Salahuddin Ayyubi");
        peserta.setEmail("salahuddin@example.com");
        peserta.setNomorHandphone("081234567801");
        pesertaRepository.save(peserta);

        // When
        var foundPeserta = pesertaRepository.findByNomorHandphone("081234567801");

        // Then
        assertThat(foundPeserta).isPresent();
        assertThat(foundPeserta.get().getNama()).isEqualTo("Salahuddin Ayyubi");
    }
}