package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.*;

public record PasswordDTO(
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener mínimo 6 caracteres")
        String password
) {}