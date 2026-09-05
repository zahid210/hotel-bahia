package com.hotel.backoffice.service;

import com.hotel.backoffice.dto.request.ReservaRequestDTO;
import com.hotel.backoffice.dto.response.ReservaResponseDTO;
import com.hotel.backoffice.entity.*;
import com.hotel.backoffice.entity.Habitacion.EstadoHabitacion;
import com.hotel.backoffice.entity.Huesped.TipoDocumento;
import com.hotel.backoffice.entity.Reserva.EstadoReserva;
import com.hotel.backoffice.exception.*;
import com.hotel.backoffice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservaService {

    private final ReservaRepository    reservaRepo;
    private final HabitacionRepository habitacionRepo;
    private final HuespedRepository    huespedRepo;
    private final UsuarioRepository    usuarioRepo;

    public List<ReservaResponseDTO> listarTodas() {
        return reservaRepo.findAllByOrderByFechaEntradaDesc()
                .stream().map(ReservaResponseDTO::from).toList();
    }

    // Filtrar por estado desde el controller
    public List<ReservaResponseDTO> listarPorEstado(String estado) {
        try {
            EstadoReserva estadoEnum = EstadoReserva.valueOf(estado.toUpperCase());
            return reservaRepo.findByEstadoOrderByFechaEntradaDesc(estadoEnum)
                    .stream()
                    .map(ReservaResponseDTO::from)
                    .toList();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Estado inválido: '" + estado + "'. Valores permitidos: "
                            + java.util.Arrays.toString(EstadoReserva.values())
            );
        }
    }

    public ReservaResponseDTO obtenerPorId(UUID id) {
        return reservaRepo.findById(id)
                .map(ReservaResponseDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + id));
    }

    public ReservaResponseDTO crearReserva(ReservaRequestDTO dto) {

        // 1. Validar fechas
        if (!dto.fechaSalida().isAfter(dto.fechaEntrada())) {
            throw new IllegalArgumentException(
                    "La fecha de salida debe ser posterior a la entrada."
            );
        }

        // 2. Obtener habitación
        Habitacion hab = habitacionRepo.findById(dto.habitacionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Habitación no encontrada")
                );

        // 3. Validar estado de habitación
        if (hab.getEstado() == EstadoHabitacion.MANTENIMIENTO) {
            throw new HabitacionNoDisponibleException(
                    "La habitación está en mantenimiento y no puede reservarse."
            );
        }
        if (hab.getEstado() == EstadoHabitacion.OCUPADA) {
            throw new HabitacionNoDisponibleException(
                    "La habitación está ocupada actualmente."
            );
        }
        if (hab.getEstado() == EstadoHabitacion.LIMPIEZA
                && !dto.fechaEntrada().isAfter(LocalDate.now())) {
            throw new HabitacionNoDisponibleException(
                    "La habitación está en limpieza. " +
                            "La fecha de entrada debe ser a partir de mañana."
            );
        }

        // 4. Verificar conflictos de fechas
        List<Reserva> conflictos = reservaRepo.findConflictos(
                dto.habitacionId(), dto.fechaEntrada(), dto.fechaSalida()
        );
        if (!conflictos.isEmpty()) {
            throw new HabitacionNoDisponibleException(
                    "La habitación ya tiene una reserva en esas fechas."
            );
        }

        // 5. Obtener o crear huésped
        Huesped huesped = huespedRepo.findByNroDocumento(dto.nroDocumento())
                .orElseGet(() -> huespedRepo.save(
                        Huesped.builder()
                                .nombre(dto.nombreHuesped())
                                .apellido(dto.apellidoHuesped())
                                .tipoDocumento(TipoDocumento.valueOf(dto.tipoDocumento()))
                                .nroDocumento(dto.nroDocumento())
                                .build()
                ));

        // 6. Usuario activo
        Usuario usuario = usuarioRepo.findAll().stream().findFirst()
                .orElseThrow(() ->
                        new ResourceNotFoundException("No hay usuarios en el sistema.")
                );

        // 7. Resolver horas acordadas
        // Si el recepcionista las especifica → se usan las del formulario
        // Si no las especifica (null)        → defaults del hotel
        LocalTime horaEntrada = (dto.horaEntradaAcordada() != null)
                ? dto.horaEntradaAcordada()
                : LocalTime.of(15, 0);          // default: 15:00

        LocalTime horaSalida = (dto.horaSalidaAcordada() != null)
                ? dto.horaSalidaAcordada()
                : LocalTime.of(12, 0);          // default: 12:00

        // 8. Crear y persistir reserva
        Reserva reserva = Reserva.builder()
                .habitacion(hab)
                .huesped(huesped)
                .usuario(usuario)
                .fechaEntrada(dto.fechaEntrada())
                .fechaSalida(dto.fechaSalida())
                .horaEntradaAcordada(horaEntrada)
                .horaSalidaAcordada(horaSalida)
                .numHuespedes(dto.numHuespedes())
                .estado(EstadoReserva.CONFIRMADA)
                .notas(dto.notas())
                .build();

        return ReservaResponseDTO.from(reservaRepo.save(reserva));
    }

    // ── CHECK-IN: registra el timestamp real ─────────────────────
    public ReservaResponseDTO realizarCheckIn(UUID id) {
        Reserva reserva = reservaRepo.findByIdAndEstado(id, EstadoReserva.CONFIRMADA)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reserva no encontrada o no está CONFIRMADA"
                ));

        // NIVEL 1: timestamp exacto del check-in
        reserva.setCheckinReal(LocalDateTime.now());

        // Transición de estados
        reserva.setEstado(EstadoReserva.CHECKIN);
        reserva.getHabitacion().setEstado(EstadoHabitacion.OCUPADA);

        return ReservaResponseDTO.from(reservaRepo.save(reserva));
    }

    // ── CHECK-OUT: registra timestamp + calcula late checkout ─────
    public ReservaResponseDTO realizarCheckOut(UUID id) {
        Reserva reserva = reservaRepo.findByIdAndEstado(id, EstadoReserva.CHECKIN)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reserva no encontrada o no está en CHECKIN"
                ));

        LocalDateTime ahora = LocalDateTime.now();

        // NIVEL 1 + NIVEL 2: timestamp real + cálculo de horas extra
        // El método interno compara ahora vs horaSalidaAcordada
        reserva.calcularCargoLateCheckout(ahora);

        // Transición de estados
        reserva.setEstado(EstadoReserva.CHECKOUT);
        reserva.getHabitacion().setEstado(EstadoHabitacion.LIMPIEZA);

        return ReservaResponseDTO.from(reservaRepo.save(reserva));
    }

    public ReservaResponseDTO cancelarReserva(UUID id) {
        Reserva reserva = reservaRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));
        if (reserva.getEstado() == EstadoReserva.CHECKIN) {
            reserva.getHabitacion().setEstado(EstadoHabitacion.LIMPIEZA);
        }
        reserva.setEstado(EstadoReserva.CANCELADA);
        return ReservaResponseDTO.from(reservaRepo.save(reserva));
    }
}