package com.sahabatquran.app.web.exception;

public class PesertaAlreadyExistsException extends RuntimeException {
    
    public PesertaAlreadyExistsException(String message) {
        super(message);
    }
    
    public PesertaAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}