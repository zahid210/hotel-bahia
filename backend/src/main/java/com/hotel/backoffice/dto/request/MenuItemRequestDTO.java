package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record MenuItemRequestDTO(

        @NotBlank(message = "El nombre del plato es obligatorio")
        String nombre,

        String descripcion,

        @NotBlank(message = "La categoría es obligatoria")
        String categoria,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor que cero")
        BigDecimal precio,

        Boolean disponible
) {}