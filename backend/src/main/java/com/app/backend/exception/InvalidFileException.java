package com.app.backend.exception;

public class InvalidFileException extends FileStorageException {

    public InvalidFileException(String message) {
        super(message);
    }
}
