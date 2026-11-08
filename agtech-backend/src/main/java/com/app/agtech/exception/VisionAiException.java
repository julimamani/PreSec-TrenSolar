package com.app.agtech.exception;

public class VisionAiException extends RuntimeException {

    public VisionAiException(String message) {
        super(message);
    }

    public VisionAiException(String message, Throwable cause) {
        super(message, cause);
    }
}
