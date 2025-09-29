package com.sliit.library.config;

import com.sliit.library.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataMigrationRunner implements CommandLineRunner {

    private final PaymentService paymentService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting data migration for payment types...");
        try {
            paymentService.migrateOldPaymentTypes();
            log.info("Payment type migration completed successfully");
        } catch (Exception e) {
            log.error("Error during payment type migration", e);
        }
    }
}