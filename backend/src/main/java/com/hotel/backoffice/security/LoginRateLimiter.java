package com.hotel.backoffice.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class LoginRateLimiter {

    private static final int     MAX_INTENTOS = 5;
    private static final Duration VENTANA      = Duration.ofMinutes(15);

    // ConcurrentLinkedDeque: operaciones addLast/pollFirst lineales → thread-safe
    private final Map<String, Deque<Long>> intentos = new ConcurrentHashMap<>();

    public boolean bloqueado(String email) {
        String      key  = normalizar(email);
        Deque<Long> cola = intentos.get(key);
        if (cola == null) {
            return false;
        }

        long ahora = System.currentTimeMillis();
        while (!cola.isEmpty() && ahora - cola.peekFirst() > VENTANA.toMillis()) {
            cola.pollFirst();
        }
        if (cola.isEmpty()) {
            intentos.remove(key);
            return false;
        }
        return cola.size() >= MAX_INTENTOS;
    }

    public void registrarFallo(String email) {
        Deque<Long> cola =
                intentos.computeIfAbsent(normalizar(email), k -> new ConcurrentLinkedDeque<>());
        cola.addLast(System.currentTimeMillis());
        // Cota de memoria: una vez bloqueado ya no interesa acumular más fallos
        while (cola.size() > MAX_INTENTOS) {
            cola.pollFirst();
        }
    }

    public void limpiar(String email) {
        intentos.remove(normalizar(email));
    }

    private String normalizar(String email) {
        return email == null ? "" : email.toLowerCase().trim();
    }
}