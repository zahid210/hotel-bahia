package com.hotel.backoffice.repository;

import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.EstadoHabitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HabitacionRepository extends JpaRepository<Habitacion, Integer> {
    List<Habitacion> findByEstadoOrderByNumeroAsc(EstadoHabitacion estado);
    List<Habitacion> findAllByOrderByNumeroAsc();
}