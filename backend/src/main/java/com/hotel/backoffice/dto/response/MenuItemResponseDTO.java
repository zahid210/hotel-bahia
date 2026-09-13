package com.hotel.backoffice.dto.response;

import com.hotel.backoffice.entity.MenuItem;
import java.math.BigDecimal;

public record MenuItemResponseDTO(
        Integer     id,
        String      nombre,
        String      descripcion,
        String      categoria,
        BigDecimal  precio,
        Boolean     disponible
) {
    public static MenuItemResponseDTO from(MenuItem m) {
        return new MenuItemResponseDTO(
                m.getId(),
                m.getNombre(),
                m.getDescripcion(),
                m.getCategoria(),
                m.getPrecio(),
                Boolean.TRUE.equals(m.getDisponible())
        );
    }
}