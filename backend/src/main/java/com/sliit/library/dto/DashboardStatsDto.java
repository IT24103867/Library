package com.sliit.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDto {
    private long totalBooks;
    private long availableBooks;
    private long totalMembers;
    private long activeBorrows;
    private long totalAuthors;
    private long totalPublishers;
    private long overdueBooks;
    private double outstandingFines;
}
