package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PedidoEstadoDTO(
        @NotBlank(message = "El estado es obligatorio")
        String estado
) {}