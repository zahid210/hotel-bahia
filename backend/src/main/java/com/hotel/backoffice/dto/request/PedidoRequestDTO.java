package com.hotel.backoffice.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public record PedidoRequestDTO(

        @NotNull(message = "La reserva es obligatoria")
        UUID reservaId,

        @NotEmpty(message = "Selecciona al menos un plato")
        List<ItemPedido> items,

        String notas
) {
    public record ItemPedido(
            @NotNull(message = "El plato es obligatorio")
            Integer menuItemId,

            @NotNull @Min(value = 1, message = "La cantidad debe ser al menos 1")
            Integer cantidad
    ) {}
}