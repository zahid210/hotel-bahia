package com.hotel.backoffice.service;

import com.hotel.backoffice.dto.response.HabitacionResponseDTO;
import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.EstadoHabitacion;
import com.hotel.backoffice.exception.ResourceNotFoundException;
import com.hotel.backoffice.repository.HabitacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

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
        h.setEstado(EstadoHabitacion.valueOf(nuevoEstado.toUpperCase()));
        return HabitacionResponseDTO.from(repo.save(h));
    }
}