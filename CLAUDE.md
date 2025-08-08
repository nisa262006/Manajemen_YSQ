# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sahabat Quran Web Application - A Java Spring Boot management system for Quranic learning center operations including student management, teacher management, classes, payments, and examination systems.

## Tech Stack

- **Java 21** with Spring Boot 3.5.4
- **PostgreSQL 16** database
- **Maven 3** build system
- **Thymeleaf** templating engine for web UI
- **JPA/Hibernate** for data persistence
- **Flyway** for database migrations
- **Lombok** for reducing boilerplate code
- **TestContainers** for integration testing
- **Selenium** for end-to-end testing
- **JaCoCo** for code coverage

## Development Commands

### Database Setup
```bash
# Start PostgreSQL database using Docker Compose
docker compose up -d

# Database runs on localhost:54321
# Database: sahabatqurandb
# Username: sahabatquran
# Password: sahabatquran1234
```

### Build and Run
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Run with coverage report
mvn clean test jacoco:report

# Build package
mvn clean package

# Run application
mvn spring-boot:run
# Or run the JAR
java -jar target/sahabatquran-web-*.jar
```

### Testing
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=PengajarRepositoryIntegrationTest

# Run Selenium tests (requires browser container)
mvn test -Dtest=HomePageTests
```

## Project Structure

### Core Architecture
- **Entity Layer** (`com.sahabatquran.app.web.entity`): JPA entities representing database tables
- **Repository Layer** (`com.sahabatquran.app.web.repository`): Data access layer using Spring Data JPA
- **Web Templates** (`src/main/resources/templates`): Thymeleaf templates organized by functional areas

### Key Domain Entities
- `Peserta` - Students/participants
- `Pengajar` - Teachers/instructors
- `Kelas` - Classes
- `Kurikulum` - Curriculum
- `MataPelajaran` - Subjects
- `SesiBelajar` - Learning sessions
- `SesiUjian` - Examination sessions
- `Tagihan` - Billing/invoices
- `PembayaranTagihan` - Payment transactions

### Database
- Uses Flyway migrations in `src/main/resources/db/migration/`
- Schema defined in `V2024.09.001__Skema_Awal.sql`
- Initial data in `V2024.09.002__Data_Awal.sql`

### Web Interface Structure
Templates organized by functional areas:
- `admin/` - Administrative functions (data management)
- `finance/` - Financial operations (payments, donations)
- `fragments/` - Reusable UI components

### Testing Strategy
- **Unit Tests**: Standard JUnit tests for business logic
- **Integration Tests**: TestContainers-based tests for repository layer
- **Selenium Tests**: End-to-end browser testing with recording capabilities
- Test recordings saved to `./target/selenium-recordings/`

## Configuration

### Application Properties
- Database connection configured for local PostgreSQL (port 54321)
- JPA DDL set to `update` mode
- SQL logging enabled for debugging
- Flyway migrations enabled

### Code Quality
- SonarCloud integration configured
- JaCoCo coverage reporting
- Git commit information embedded in builds