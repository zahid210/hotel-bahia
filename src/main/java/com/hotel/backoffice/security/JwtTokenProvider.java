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

    // ── Extraer email del token ──────────────────────────────
    public String getEmail(String token) {
        return parsearClaims(token).getSubject();
    }

    // ── Extraer rol del token ────────────────────────────────
    public String getRol(String token) {
        return parsearClaims(token).get("rol", String.class);
    }

    // ── Validar token ────────────────────────────────────────
    public boolean esValido(String token) {
        try {
            parsearClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token expirado");
        } catch (MalformedJwtException e) {
            log.warn("Token mal formado");
        } catch (JwtException e) {
            log.warn("Token inválido: {}", e.getMessage());
        }
        return false;
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