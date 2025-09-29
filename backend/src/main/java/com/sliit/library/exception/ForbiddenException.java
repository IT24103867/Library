package com.sliit.library.exception;

/**
 * Exception thrown when an operation is forbidden
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}