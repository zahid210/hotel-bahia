package com.hotel.backoffice.dto.response;

import com.hotel.backoffice.entity.PedidoItem;
import java.math.BigDecimal;

public record PedidoItemResponseDTO(
        Long        id,
        Integer     menuItemId,
        String      nombre,
        Integer     cantidad,
        BigDecimal  precioUnitario,
        BigDecimal  subtotal
) {
    public static PedidoItemResponseDTO from(PedidoItem i) {
        return new PedidoItemResponseDTO(
                i.getId(),
                i.getMenuItem().getId(),
                i.getMenuItem().getNombre(),
                i.getCantidad(),
                i.getPrecioUnitario(),
                i.getSubtotal()
        );
    }
}