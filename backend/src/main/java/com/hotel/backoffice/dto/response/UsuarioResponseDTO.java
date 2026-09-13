package com.hotel.backoffice.dto.response;

import com.hotel.backoffice.entity.Usuario;
import java.time.LocalDateTime;
import java.util.UUID;

public record UsuarioResponseDTO(
        UUID        id,
        String      nombre,
        String      email,
        String      rol,
        Boolean     activo,
        LocalDateTime createdAt
) {
    public static UsuarioResponseDTO from(Usuario u) {
        return new UsuarioResponseDTO(
                u.getId(),
                u.getNombre(),
                u.getEmail(),
                u.getRol().name(),
                Boolean.TRUE.equals(u.getActivo()),
                u.getCreatedAt()
        );
    }
}