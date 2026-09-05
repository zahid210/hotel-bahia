package com.hotel.backoffice.exception;

public class ThrottledException extends RuntimeException {

    public ThrottledException(String mensaje) {
        super(mensaje);
    }
}