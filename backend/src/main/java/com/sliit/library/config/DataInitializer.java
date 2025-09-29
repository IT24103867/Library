package com.sliit.library.config;

import com.sliit.library.model.*;
import com.sliit.library.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LanguageRepository languageRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting data initialization...");

        initializeUsers();
        initializeLanguages();
        initializeCategories();
        initializeAuthors();
        initializePublishers();

        log.info("Data initialization completed!");
    }

    private void initializeUsers() {
        if (userRepository.count() == 0) {
            log.info("Creating sample users...");

            // Create admin user
            User admin = User.builder()
                    .username("admin")
                    .email("admin@library.com")
                    .name("Library Administrator")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);

            // Create librarian user
            User librarian = User.builder()
                    .username("librarian")
                    .email("librarian@library.com")
                    .name("Library Staff")
                    .passwordHash(passwordEncoder.encode("lib123"))
                    .role(UserRole.LIBRARIAN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(librarian);

            // Create sample members
            List<User> members = Arrays.asList(
                User.builder()
                    .username("john_doe")
                    .email("john.doe@email.com")
                    .name("John Doe")
                    .passwordHash(passwordEncoder.encode("pass123"))
                    .role(UserRole.MEMBER)
                    .status(UserStatus.ACTIVE)
                    .build(),
                User.builder()
                    .username("jane_smith")
                    .email("jane.smith@email.com")
                    .name("Jane Smith")
                    .passwordHash(passwordEncoder.encode("pass123"))
                    .role(UserRole.MEMBER)
                    .status(UserStatus.ACTIVE)
                    .build()
            );
            userRepository.saveAll(members);

            log.info("Created {} users", userRepository.count());
        } else {
            log.info("Users already exist, skipping user initialization");
        }
    }

    private void initializeLanguages() {
        if (languageRepository.count() == 0) {
            log.info("Creating sample languages...");

            List<Language> languages = Arrays.asList(
                createLanguage("English", "EN"),
                createLanguage("Sinhala", "SI"),
                createLanguage("Tamil", "TA"),
                createLanguage("Other", "OT")
            );
            languageRepository.saveAll(languages);

            log.info("Created {} languages", languageRepository.count());
        } else {
            log.info("Languages already exist, skipping language initialization");
        }
    }

    private Language createLanguage(String name, String code) {
        Language language = new Language();
        language.setName(name);
        language.setCode(code);
        return language;
    }

    private void initializeCategories() {
        if (categoryRepository.count() == 0) {
            log.info("Creating sample categories...");

            List<Category> categories = Arrays.asList(
                Category.builder()
                    .name("Fiction")
                    .description("Fiction books and novels")
                    .build(),
                Category.builder()
                    .name("Non-Fiction")
                    .description("Non-fiction books")
                    .build(),
                Category.builder()
                    .name("Science")
                    .description("Science and technology books")
                    .build(),
                Category.builder()
                    .name("History")
                    .description("Historical books")
                    .build(),
                Category.builder()
                    .name("Biography")
                    .description("Biographies and memoirs")
                    .build(),
                Category.builder()
                    .name("Children")
                    .description("Books for children")
                    .build()
            );
            categoryRepository.saveAll(categories);

            log.info("Created {} categories", categoryRepository.count());
        } else {
            log.info("Categories already exist, skipping category initialization");
        }
    }

    private void initializeAuthors() {
        if (authorRepository.count() == 0) {
            log.info("Creating sample authors...");

            List<Author> authors = Arrays.asList(
                Author.builder()
                    .name("J.K. Rowling")
                    .biography("British author, philanthropist, and screenwriter")
                    .build(),
                Author.builder()
                    .name("George Orwell")
                    .biography("English novelist, essayist, journalist and critic")
                    .build(),
                Author.builder()
                    .name("Agatha Christie")
                    .biography("English writer known for detective novels")
                    .build(),
                Author.builder()
                    .name("Martin Wickramasinghe")
                    .biography("Sri Lankan novelist and poet")
                    .build(),
                Author.builder()
                    .name("Kumaratunga Munidasa")
                    .biography("Sri Lankan scholar and writer")
                    .build()
            );
            authorRepository.saveAll(authors);

            log.info("Created {} authors", authorRepository.count());
        } else {
            log.info("Authors already exist, skipping author initialization");
        }
    }

    private void initializePublishers() {
        if (publisherRepository.count() == 0) {
            log.info("Creating sample publishers...");

            List<Publisher> publishers = Arrays.asList(
                Publisher.builder()
                    .name("Penguin Books")
                    .address("London, UK")
                    .email("info@penguin.co.uk")
                    .contactNumber("+44 20 7139 3000")
                    .website("https://www.penguin.co.uk")
                    .build(),
                Publisher.builder()
                    .name("HarperCollins")
                    .address("New York, USA")
                    .email("info@harpercollins.com")
                    .contactNumber("+1 212 207 7000")
                    .website("https://www.harpercollins.com")
                    .build(),
                Publisher.builder()
                    .name("S. Godage & Brothers")
                    .address("Colombo, Sri Lanka")
                    .email("info@godage.com")
                    .contactNumber("+94 11 238 8888")
                    .website("https://www.godage.com")
                    .build(),
                Publisher.builder()
                    .name("Lake House Publishers")
                    .address("Colombo, Sri Lanka")
                    .email("info@lakehouse.lk")
                    .contactNumber("+94 11 238 0000")
                    .website("https://www.lakehouse.lk")
                    .build()
            );
            publisherRepository.saveAll(publishers);

            log.info("Created {} publishers", publisherRepository.count());
        } else {
            log.info("Publishers already exist, skipping publisher initialization");
        }
    }
}