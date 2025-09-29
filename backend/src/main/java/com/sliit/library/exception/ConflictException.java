package com.sliit.library.exception;

/**
 * Exception thrown when there's a conflict with the current state
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}