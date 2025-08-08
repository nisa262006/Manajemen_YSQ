package com.sahabatquran.app.web.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
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
import com.sahabatquran.app.web.entity.Pengajar;
import com.sahabatquran.app.web.entity.Peserta;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RepositoryIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PesertaRepository pesertaRepository;

    @Autowired
    private PengajarRepository pengajarRepository;

    @BeforeEach
    void setUp() throws Exception {
        loadPesertaTestData();
        loadPengajarTestData();
    }

    private void loadPesertaTestData() throws Exception {
        ClassPathResource resource = new ClassPathResource("test-data/peserta-data.csv");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            
            reader.readLine(); // Skip header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    Peserta peserta = new Peserta(parts[0], parts[1], parts[2]);
                    entityManager.persist(peserta);
                }
            }
        }
    }

    private void loadPengajarTestData() throws Exception {
        ClassPathResource resource = new ClassPathResource("test-data/pengajar-data.csv");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            
            reader.readLine(); // Skip header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    Pengajar pengajar = new Pengajar(parts[0], parts[1], parts[2]);
                    entityManager.persist(pengajar);
                }
            }
        }
        entityManager.flush();
    }

    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/repository-test-data.csv", numLinesToSkip = 1)
    void testRepositoryOperations(String testName, String entityType, String searchParam, 
                                 int expectedCount, String description) {
        
        switch (testName) {
            case "searchPesertaByName":
                List<Peserta> pesertaByName = pesertaRepository.findByNamaContainingIgnoreCase(searchParam);
                assertThat(pesertaByName).hasSize(expectedCount);
                break;
                
            case "searchPesertaByEmail":
                Optional<Peserta> pesertaByEmail = pesertaRepository.findByEmail(searchParam);
                assertThat(pesertaByEmail).isPresent();
                assertThat(pesertaByEmail.get().getEmail()).isEqualTo(searchParam);
                break;
                
            case "searchPesertaByEmailDomain":
                List<Peserta> pesertaByDomain = pesertaRepository.findByEmailDomain(searchParam);
                assertThat(pesertaByDomain).hasSize(expectedCount);
                break;
                
            case "searchPengajarByName":
                List<Pengajar> pengajarByName = pengajarRepository.findByNamaContainingIgnoreCase(searchParam);
                assertThat(pengajarByName).hasSize(expectedCount);
                break;
                
            case "searchPengajarByEmail":
                Optional<Pengajar> pengajarByEmail = pengajarRepository.findByEmail(searchParam);
                assertThat(pengajarByEmail).isPresent();
                assertThat(pengajarByEmail.get().getEmail()).isEqualTo(searchParam);
                break;
                
            case "searchPengajarByPhoneNumber":
                Optional<Pengajar> pengajarByPhone = pengajarRepository.findByNomorHandphone(searchParam);
                assertThat(pengajarByPhone).isPresent();
                assertThat(pengajarByPhone.get().getNomorHandphone()).isEqualTo(searchParam);
                break;
                
            case "checkPesertaExists":
                boolean pesertaExists = pesertaRepository.existsByEmail(searchParam);
                assertThat(pesertaExists).isTrue();
                break;
                
            case "checkPengajarExists":
                boolean pengajarExists = pengajarRepository.existsByEmail(searchParam);
                assertThat(pengajarExists).isTrue();
                break;
                
            default:
                throw new IllegalArgumentException("Unknown test case: " + testName);
        }
    }

    static Stream<Arguments> provideBatchTestParameters() {
        return Stream.of(
            Arguments.of("Peserta", "Ahmad", "email.com", 1, 5),
            Arguments.of("Pengajar", "Ustaz", "sahabatquran.com", 2, 8),
            Arguments.of("Peserta", "Muhammad", "gmail.com", 1, 3),
            Arguments.of("Pengajar", "Abdul", "sahabatquran.com", 1, 8)
        );
    }

    @ParameterizedTest
    @MethodSource("provideBatchTestParameters")
    void testBatchRepositoryOperations(String entityType, String nameSearch, String emailDomain, 
                                     int expectedNameMatches, int expectedDomainMatches) {
        
        if ("Peserta".equals(entityType)) {
            List<Peserta> nameResults = pesertaRepository.findByNamaContainingIgnoreCase(nameSearch);
            List<Peserta> domainResults = pesertaRepository.findByEmailDomain(emailDomain);
            
            assertThat(nameResults).hasSize(expectedNameMatches);
            assertThat(domainResults).hasSize(expectedDomainMatches);
            
            // Verify that all found entities have the correct properties
            nameResults.forEach(peserta -> 
                assertThat(peserta.getNama().toLowerCase()).contains(nameSearch.toLowerCase()));
            domainResults.forEach(peserta -> 
                assertThat(peserta.getEmail()).contains(emailDomain));
                
        } else if ("Pengajar".equals(entityType)) {
            List<Pengajar> nameResults = pengajarRepository.findByNamaContainingIgnoreCase(nameSearch);
            List<Pengajar> domainResults = pengajarRepository.findByEmailDomain(emailDomain);
            
            assertThat(nameResults).hasSize(expectedNameMatches);
            assertThat(domainResults).hasSize(expectedDomainMatches);
            
            // Verify that all found entities have the correct properties
            nameResults.forEach(pengajar -> 
                assertThat(pengajar.getNama().toLowerCase()).contains(nameSearch.toLowerCase()));
            domainResults.forEach(pengajar -> 
                assertThat(pengajar.getEmail()).contains(emailDomain));
        }
    }
}