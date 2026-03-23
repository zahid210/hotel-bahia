package com.hotel.backoffice.repository;

import com.hotel.backoffice.entity.Reserva;
import com.hotel.backoffice.entity.Reserva.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    List<Reserva> findAllByOrderByFechaEntradaDesc();

    Optional<Reserva> findByIdAndEstado(UUID id, EstadoReserva estado);

    // --- QUERY EXISTENTE: Para evitar solapamiento de fechas ---
    @Query("""
        SELECT r FROM Reserva r
        JOIN FETCH r.habitacion
        JOIN FETCH r.huesped
        WHERE r.habitacion.id = :habId
          AND r.estado NOT IN ('CHECKOUT','CANCELADA')
          AND r.fechaEntrada < :salida
          AND r.fechaSalida  > :entrada
    """)
    List<Reserva> findConflictos(
            @Param("habId")    Integer habId,
            @Param("entrada")  LocalDate entrada,
            @Param("salida")   LocalDate salida
    );

    // --- NUEVA QUERY 1: Filtrar por estado (Ej: ver solo las 'CONFIRMADA') ---
    List<Reserva> findByEstadoOrderByFechaEntradaDesc(EstadoReserva estado);

    // --- NUEVA QUERY 2: Reservas activas (Uso de JOIN FETCH para optimizar) ---
    @Query("""
        SELECT r FROM Reserva r
        JOIN FETCH r.habitacion
        JOIN FETCH r.huesped
        WHERE r.estado NOT IN ('CHECKOUT', 'CANCELADA')
        ORDER BY r.fechaEntrada ASC
    """)
    List<Reserva> findReservasActivas();
}