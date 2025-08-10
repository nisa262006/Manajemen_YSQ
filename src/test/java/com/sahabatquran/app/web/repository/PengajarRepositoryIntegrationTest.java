package com.sahabatquran.app.web.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvFileSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import com.sahabatquran.app.web.TestcontainersConfiguration;
import com.sahabatquran.app.web.entity.Pengajar;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Sql(scripts = {"/test-data/cleanup-pengajar.sql", "/test-data/init-pengajar-data.sql"}, executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class PengajarRepositoryIntegrationTest {

    @Autowired
    private PengajarRepository pengajarRepository;

    @BeforeEach
    void setUp() throws Exception {
        // Data initialization handled by @Sql annotation
    }

    @Test
    void testFindAll() {
        List<Pengajar> pengajarList = pengajarRepository.findAll();
        assertThat(pengajarList).hasSize(8);
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/pengajar-data.csv", numLinesToSkip = 1)
    void testFindByEmail(String nama, String email, String nomorHandphone) {
        Optional<Pengajar> found = pengajarRepository.findByEmail(email);
        
        assertThat(found).isPresent();
        assertThat(found.get().getNama()).isEqualTo(nama);
        assertThat(found.get().getEmail()).isEqualTo(email);
        assertThat(found.get().getNomorHandphone()).isEqualTo(nomorHandphone);
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/pengajar-data.csv", numLinesToSkip = 1)
    void testExistsByEmail(String nama, String email, String nomorHandphone) {
        boolean exists = pengajarRepository.existsByEmail(email);
        assertThat(exists).isTrue();
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/pengajar-data.csv", numLinesToSkip = 1)
    void testExistsByNomorHandphone(String nama, String email, String nomorHandphone) {
        boolean exists = pengajarRepository.existsByNomorHandphone(nomorHandphone);
        assertThat(exists).isTrue();
    }

    static Stream<Arguments> provideSearchParameters() {
        return Stream.of(
            Arguments.of("Abdul", 1),
            Arguments.of("Muhammad", 1),
            Arguments.of("Ustaz", 4), // Updated: includes both "Ustaz" and "Ustazah" entries
            Arguments.of("Ustazah", 2),
            Arguments.of("Prof", 1),
            Arguments.of("xyz", 0) // Should not match any name
        );
    }

    @ParameterizedTest
    @MethodSource("provideSearchParameters")
    void testFindByNamaContaining(String searchTerm, int expectedCount) {
        List<Pengajar> results = pengajarRepository.findByNamaContainingIgnoreCase(searchTerm);
        assertThat(results).hasSize(expectedCount);
    }

    static Stream<Arguments> provideEmailDomainParameters() {
        return Stream.of(
            Arguments.of("sahabatquran.com", 8),
            Arguments.of("gmail.com", 0),
            Arguments.of("nonexistent.com", 0)
        );
    }

    @ParameterizedTest
    @MethodSource("provideEmailDomainParameters")
    void testFindByEmailDomain(String domain, int expectedCount) {
        List<Pengajar> results = pengajarRepository.findByEmailDomain(domain);
        assertThat(results).hasSize(expectedCount);
    }

    @Test
    void testFindByNomorHandphone() {
        Optional<Pengajar> found = pengajarRepository.findByNomorHandphone("081234567000");
        
        assertThat(found).isPresent();
        assertThat(found.get().getNama()).isEqualTo("Prof. Abdul Rahman");
        assertThat(found.get().getEmail()).isEqualTo("abdul.rahman@sahabatquran.com");
    }

    @Test
    void testFindByNonExistentEmail() {
        Optional<Pengajar> found = pengajarRepository.findByEmail("nonexistent@sahabatquran.com");
        assertThat(found).isEmpty();
    }

    @Test
    void testExistsByNonExistentEmail() {
        boolean exists = pengajarRepository.existsByEmail("nonexistent@sahabatquran.com");
        assertThat(exists).isFalse();
    }
}