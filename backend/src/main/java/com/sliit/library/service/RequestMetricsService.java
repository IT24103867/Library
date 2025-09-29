package com.sliit.library.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class RequestMetricsService {

    // Simple in-memory storage for request metrics (resets daily)
    private final ConcurrentHashMap<LocalDate, AtomicLong> dailyRequests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<LocalDate, AtomicLong> dailyErrors = new ConcurrentHashMap<>();

    public void recordRequest() {
        LocalDate today = LocalDate.now();
        dailyRequests.computeIfAbsent(today, k -> new AtomicLong(0)).incrementAndGet();
    }

    public void recordError() {
        LocalDate today = LocalDate.now();
        dailyErrors.computeIfAbsent(today, k -> new AtomicLong(0)).incrementAndGet();
        // Note: Don't call recordRequest() here as it's already called in preHandle
    }

    public long getRequestsToday() {
        LocalDate today = LocalDate.now();
        return dailyRequests.getOrDefault(today, new AtomicLong(0)).get();
    }

    public long getErrorsToday() {
        LocalDate today = LocalDate.now();
        return dailyErrors.getOrDefault(today, new AtomicLong(0)).get();
    }

    public double getErrorRateToday() {
        long requests = getRequestsToday();
        long errors = getErrorsToday();

        if (requests == 0) {
            return 0.0;
        }

        return (double) errors / requests; // Return as decimal (0.0-1.0)
    }

    // Clean up old data daily at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldData() {
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        dailyRequests.keySet().removeIf(date -> date.isBefore(weekAgo));
        dailyErrors.keySet().removeIf(date -> date.isBefore(weekAgo));
    }
}