package com.hotel.backoffice.dto.response;

import com.hotel.backoffice.entity.Pedido;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PedidoResponseDTO(
        UUID                         id,
        UUID                         reservaId,
        Integer                      habitacionId,
        String                       habitacionNumero,
        String                       nombreHuesped,
        String                       estado,
        BigDecimal                   total,
        String                       notas,
        String                       creadoPor,
        LocalDateTime                createdAt,
        List<PedidoItemResponseDTO>  items
) {
    public static PedidoResponseDTO from(Pedido p) {
        return new PedidoResponseDTO(
                p.getId(),
                p.getReserva().getId(),
                p.getHabitacion().getId(),
                p.getHabitacion().getNumero(),
                p.getReserva().getHuesped().getNombre()
                        + " " + p.getReserva().getHuesped().getApellido(),
                p.getEstado().name(),
                p.getTotal(),
                p.getNotas(),
                p.getUsuario().getNombre(),
                p.getCreatedAt(),
                p.getItems().stream().map(PedidoItemResponseDTO::from).toList()
        );
    }
}