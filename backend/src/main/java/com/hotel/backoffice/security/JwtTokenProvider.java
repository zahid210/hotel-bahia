package com.hotel.backoffice.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long      expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}")         String secret,
            @Value("${app.jwt.expiration-ms}")  long expirationMs) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "app.jwt.secret no configurado: define la variable JWT_SECRET "
                            + "(resp. en application-local.yml para el perfil local)."
            );
        }
        // Keys.hmacShaKeyFor exige HTTPSecureKey >= 32 bytes; lanza
        // WeakKeyException si el secreto es demasiado corto.
        this.secretKey    = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // ── Generar token ────────────────────────────────────────
    public String generarToken(String email, String rol, String nombre) {
        Date ahora   = new Date();
        Date expira  = new Date(ahora.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("rol",    rol)
                .claim("nombre", nombre)
                .issuedAt(ahora)
                .expiration(expira)
                .signWith(secretKey)
                .compact();
    }

    // ── Validar token y devolver email en una sola pasada ─────
    public String getEmailSiValido(String token) {
        try {
            return parsearClaims(token).getSubject();
        } catch (ExpiredJwtException e) {
            log.warn("Token expirado");
        } catch (MalformedJwtException e) {
            log.warn("Token mal formado");
        } catch (JwtException e) {
            // No se loguea e.getMessage(): puede contener datos del token
            // (claims/header) inyectados por el cliente.
            log.warn("Token inválido: {}", e.getClass().getSimpleName());
        }
        return null;
    }

    // ── Parsear claims (privado) ─────────────────────────────
    private Claims parsearClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}