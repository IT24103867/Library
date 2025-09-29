package com.sliit.library.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableScheduling
public class LibraryConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
