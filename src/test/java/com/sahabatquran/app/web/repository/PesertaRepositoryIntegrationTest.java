package com.sahabatquran.app.web.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
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
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.ActiveProfiles;

import com.sahabatquran.app.web.TestcontainersConfiguration;
import com.sahabatquran.app.web.entity.Peserta;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PesertaRepositoryIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PesertaRepository pesertaRepository;

    @BeforeEach
    void setUp() throws Exception {
        loadTestData();
    }

    private void loadTestData() throws Exception {
        ClassPathResource resource = new ClassPathResource("test-data/peserta-data.csv");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            
            reader.readLine(); // Skip header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    Peserta peserta = new Peserta();
                    peserta.setNama(parts[0]);
                    peserta.setEmail(parts[1]);
                    peserta.setNomorHandphone(parts[2]);
                    entityManager.persist(peserta);
                }
            }
            entityManager.flush();
        }
    }

    @Test
    void testFindAll() {
        List<Peserta> pesertaList = pesertaRepository.findAll();
        assertThat(pesertaList).hasSize(10);
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/peserta-data.csv", numLinesToSkip = 1)
    void testFindByEmail(String nama, String email, String nomorHandphone) {
        Optional<Peserta> found = pesertaRepository.findByEmail(email);
        
        assertThat(found).isPresent();
        assertThat(found.get().getNama()).isEqualTo(nama);
        assertThat(found.get().getEmail()).isEqualTo(email);
        assertThat(found.get().getNomorHandphone()).isEqualTo(nomorHandphone);
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/peserta-data.csv", numLinesToSkip = 1)
    void testExistsByEmail(String nama, String email, String nomorHandphone) {
        boolean exists = pesertaRepository.existsByEmail(email);
        assertThat(exists).isTrue();
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/peserta-data.csv", numLinesToSkip = 1)
    void testExistsByNomorHandphone(String nama, String email, String nomorHandphone) {
        boolean exists = pesertaRepository.existsByNomorHandphone(nomorHandphone);
        assertThat(exists).isTrue();
    }

    static Stream<Arguments> provideSearchParameters() {
        return Stream.of(
            Arguments.of("Ahmad", 1),
            Arguments.of("Siti", 1),
            Arguments.of("Muhammad", 1),
            Arguments.of("a", 10), // Updated: All names contain 'a'
            Arguments.of("xyz", 0) // Should not match any name
        );
    }

    @ParameterizedTest
    @MethodSource("provideSearchParameters")
    void testFindByNamaContaining(String searchTerm, int expectedCount) {
        List<Peserta> results = pesertaRepository.findByNamaContainingIgnoreCase(searchTerm);
        assertThat(results).hasSize(expectedCount);
    }

    static Stream<Arguments> provideEmailDomainParameters() {
        return Stream.of(
            Arguments.of("gmail.com", 3),
            Arguments.of("yahoo.com", 2),
            Arguments.of("email.com", 5),
            Arguments.of("nonexistent.com", 0)
        );
    }

    @ParameterizedTest
    @MethodSource("provideEmailDomainParameters")
    void testFindByEmailDomain(String domain, int expectedCount) {
        List<Peserta> results = pesertaRepository.findByEmailDomain(domain);
        assertThat(results).hasSize(expectedCount);
    }

    @Test
    void testFindByNomorHandphone() {
        Optional<Peserta> found = pesertaRepository.findByNomorHandphone("081234567890");
        
        assertThat(found).isPresent();
        assertThat(found.get().getNama()).isEqualTo("Ahmad Fauzi");
        assertThat(found.get().getEmail()).isEqualTo("ahmad.fauzi@email.com");
    }

    @Test
    void testFindByNonExistentEmail() {
        Optional<Peserta> found = pesertaRepository.findByEmail("nonexistent@email.com");
        assertThat(found).isEmpty();
    }

    @Test
    void testExistsByNonExistentEmail() {
        boolean exists = pesertaRepository.existsByEmail("nonexistent@email.com");
        assertThat(exists).isFalse();
    }
}