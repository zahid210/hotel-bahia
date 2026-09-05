package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequestDTO(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotBlank @Email
        String email,

        @NotBlank
        @Size(min = 6, message = "Mínimo 6 caracteres")
        String password,

        @Pattern(regexp = "ADMIN|RECEPCIONISTA", flags = Pattern.Flag.CASE_INSENSITIVE,
                 message = "El rol debe ser ADMIN o RECEPCIONISTA")
        String rol   // ADMIN o RECEPCIONISTA (opcional, default RECEPCIONISTA)
) {}