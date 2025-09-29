package com.sliit.library.model;

public enum PaymentType {
    OVERDUE_CHARGE,
    LOST_BOOK_CHARGE,
    DAMAGED_BOOK_CHARGE,
    LATE_RETURN_CHARGE,
    MEMBERSHIP_FEE,
    SECURITY_DEPOSIT,
    FINE_PAYMENT, // Deprecated - kept for backward compatibility during migration
    OTHER
}
