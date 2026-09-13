package com.hotel.backoffice.repository;

import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Habitacion.EstadoHabitacion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HabitacionRepository extends JpaRepository<Habitacion, Integer> {
    List<Habitacion> findByEstadoOrderByNumeroAsc(EstadoHabitacion estado);
    List<Habitacion> findAllByOrderByNumeroAsc();

    // Lock pesimista: serializa la creación de reservas sobre la misma
    // habitación para evitar dos reservas solapadas bajo concurrencia.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from Habitacion h where h.id = :id")
    Optional<Habitacion> findWithLockById(@Param("id") Integer id);

    // Total de habitaciones por tipo (para computar ocupación por tipo)
    @Query("select h.tipo, count(h) from Habitacion h group by h.tipo")
    List<Object[]> countPorTipo();
}