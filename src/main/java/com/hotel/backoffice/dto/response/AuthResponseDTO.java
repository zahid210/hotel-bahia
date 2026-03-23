package com.hotel.backoffice.dto.response;

public record AuthResponseDTO(
        String token,
        String email,
        String nombre,
        String rol
) {}