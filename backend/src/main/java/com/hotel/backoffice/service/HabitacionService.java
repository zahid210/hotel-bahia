package com.hotel.backoffice.service;

import com.hotel.backoffice.dto.response.HabitacionResponseDTO;
import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.EstadoHabitacion;
import com.hotel.backoffice.exception.ResourceNotFoundException;
import com.hotel.backoffice.repository.HabitacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class HabitacionService {

    private final HabitacionRepository repo;

    public List<HabitacionResponseDTO> listarTodas() {
        return repo.findAllByOrderByNumeroAsc()
                .stream().map(HabitacionResponseDTO::from).toList();
    }

    public List<HabitacionResponseDTO> listarLibres() {
        return repo.findByEstadoOrderByNumeroAsc(EstadoHabitacion.LIBRE)
                .stream().map(HabitacionResponseDTO::from).toList();
    }

    @Transactional
    public HabitacionResponseDTO cambiarEstado(Integer id, String nuevoEstado) {
        Habitacion h = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada: " + id));

        EstadoHabitacion estado;
        try {
            estado = EstadoHabitacion.valueOf(nuevoEstado.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Estado inválido: '" + nuevoEstado + "'. Valores permitidos: "
                            + java.util.Arrays.toString(EstadoHabitacion.values())
            );
        }

        // LIMPIEZA solo puede dejar la habitación lista para la venta.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean esLimpieza = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LIMPIEZA"));
        if (esLimpieza && estado != EstadoHabitacion.LIBRE) {
            throw new IllegalArgumentException(
                    "El personal de limpieza solo puede marcar la habitación como lista."
            );
        }

        h.setEstado(estado);
        // Entidad gestionada: el dirty checking persiste el cambio al commit
        return HabitacionResponseDTO.from(h);
    }
}