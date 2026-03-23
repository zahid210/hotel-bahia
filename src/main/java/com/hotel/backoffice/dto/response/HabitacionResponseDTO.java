package com.hotel.backoffice.dto.response;

import com.hotel.backoffice.entity.Habitacion;
import java.math.BigDecimal;

public record HabitacionResponseDTO(
        Integer id,
        String numero,
        Integer piso,
        String tipo,
        Integer capacidad,
        BigDecimal precioNoche,
        String estado,
        String descripcion
) {
    public static HabitacionResponseDTO from(Habitacion h) {
        return new HabitacionResponseDTO(
                h.getId(), h.getNumero(), h.getPiso(),
                h.getTipo().name(), h.getCapacidad(),
                h.getPrecioNoche(), h.getEstado().name(),
                h.getDescripcion()
        );
    }
}