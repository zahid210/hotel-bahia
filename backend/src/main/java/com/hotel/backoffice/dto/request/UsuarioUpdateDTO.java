package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.*;

public record UsuarioUpdateDTO(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotBlank @Email(message = "Email inválido")
        String email,

        @Pattern(regexp = "ADMIN|RECEPCIONISTA|LIMPIEZA", flags = Pattern.Flag.CASE_INSENSITIVE,
                 message = "El rol debe ser ADMIN, RECEPCIONISTA o LIMPIEZA")
        String rol,

        Boolean activo
) {}