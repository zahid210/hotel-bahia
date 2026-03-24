package com.hotel.backoffice.service;

import com.hotel.backoffice.dto.response.ReporteDTO.*;
import com.hotel.backoffice.entity.Habitacion;
import com.hotel.backoffice.entity.Reserva;
import com.hotel.backoffice.entity.Reserva.EstadoReserva;
import com.hotel.backoffice.repository.HabitacionRepository;
import com.hotel.backoffice.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReporteService {

    private final ReservaRepository    reservaRepo;
    private final HabitacionRepository habitacionRepo;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── Reporte completo por rango de fechas ──────────────────
    public ReporteCompleto generarReporte(LocalDate inicio, LocalDate fin) {
        List<Reserva>    todasReservas = reservaRepo.findAllByOrderByFechaEntradaDesc();
        List<Habitacion> habitaciones  = habitacionRepo.findAllByOrderByNumeroAsc();
        int              totalHabs     = habitaciones.size();

        // Filtra reservas que se solapan con el período solicitado
        List<Reserva> enPeriodo = todasReservas.stream()
                .filter(r -> !r.getEstado().equals(EstadoReserva.CANCELADA))
                .filter(r ->
                        !r.getFechaEntrada().isAfter(fin) &&
                                !r.getFechaSalida().isBefore(inicio)
                )
                .toList();

        // Solo checkouts para cálculo de ingresos reales
        List<Reserva> facturadas = enPeriodo.stream()
                .filter(r -> r.getEstado().equals(EstadoReserva.CHECKOUT))
                .toList();

        return new ReporteCompleto(
                inicio.format(FMT),
                fin.format(FMT),
                calcularResumen(todasReservas, facturadas, enPeriodo,
                        totalHabs, inicio, fin),
                calcularOcupacionPorDia(enPeriodo, totalHabs, inicio, fin),
                calcularRendimientoPorTipo(facturadas),
                calcularTopHabitaciones(facturadas),
                totalHabs
        );
    }

    // ── Resumen del período ───────────────────────────────────
    private ResumenPeriodo calcularResumen(
            List<Reserva> todas,
            List<Reserva> facturadas,
            List<Reserva> enPeriodo,
            int totalHabs,
            LocalDate inicio,
            LocalDate fin) {

        int reservasActivas = (int) todas.stream()
                .filter(r -> r.getEstado() == EstadoReserva.CHECKIN
                        || r.getEstado() == EstadoReserva.CONFIRMADA)
                .count();

        int cancelaciones = (int) todas.stream()
                .filter(r -> r.getEstado() == EstadoReserva.CANCELADA)
                .filter(r -> !r.getFechaEntrada().isAfter(fin)
                        && !r.getFechaEntrada().isBefore(inicio))
                .count();

        BigDecimal ingresoTotal = facturadas.stream()
                .map(Reserva::calcularTotalEstancia)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long nochesVendidas = facturadas.stream()
                .mapToLong(Reserva::calcularNochesFacturables)
                .sum();

        BigDecimal ingresoPorNoche = nochesVendidas > 0
                ? ingresoTotal.divide(
                BigDecimal.valueOf(nochesVendidas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long diasPeriodo = ChronoUnit.DAYS.between(inicio, fin) + 1;

        List<Reserva> soloCheckin = enPeriodo.stream()
                .filter(r -> r.getEstado() == EstadoReserva.CHECKIN)
                .toList();

        long ocupacionesTotales = soloCheckin.stream()
                .mapToLong(r -> {
                    LocalDate desde = r.getFechaEntrada().isBefore(inicio)
                            ? inicio
                            : r.getFechaEntrada();

                    LocalDate hasta = r.getFechaSalida().isAfter(fin)
                            ? fin.plusDays(1)
                            : r.getFechaSalida();

                    return Math.max(ChronoUnit.DAYS.between(desde, hasta), 0);
                })
                .sum();

        double ocupacionPromedio = totalHabs > 0 && diasPeriodo > 0
                ? (double) ocupacionesTotales / (totalHabs * diasPeriodo) * 100
                : 0;

        return new ResumenPeriodo(
                enPeriodo.size(),
                reservasActivas,
                facturadas.size(),
                cancelaciones,
                ingresoTotal,
                ingresoPorNoche,
                Math.min(Math.round(ocupacionPromedio * 10.0) / 10.0, 100),
                nochesVendidas
        );
    }

    // ── Ocupación día por día ─────────────────────────────────
    private List<OcupacionDia> calcularOcupacionPorDia(
            List<Reserva> enPeriodo,
            int totalHabs,
            LocalDate inicio,
            LocalDate fin) {

        // ── Solo CHECKIN para consistencia con el Dashboard ───────
        List<Reserva> soloCheckin = enPeriodo.stream()
                .filter(r -> r.getEstado() == EstadoReserva.CHECKIN)
                .toList();

        List<OcupacionDia> resultado = new ArrayList<>();
        LocalDate cursor = inicio;

        while (!cursor.isAfter(fin)) {
            final LocalDate dia = cursor;

            long ocupadas = soloCheckin.stream()
                    .filter(r ->
                            !r.getFechaEntrada().isAfter(dia) &&
                                    r.getFechaSalida().isAfter(dia)
                    )
                    .count();

            BigDecimal ingresoDia = soloCheckin.stream()
                    .filter(r ->
                            !r.getFechaEntrada().isAfter(dia) &&
                                    r.getFechaSalida().isAfter(dia)
                    )
                    .map(r -> {
                        long noches = r.calcularNochesFacturables();
                        return noches > 0
                                ? r.calcularTotalEstancia()
                                .divide(BigDecimal.valueOf(noches),
                                        4, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            double pct = totalHabs > 0
                    ? Math.min((double) ocupadas / totalHabs * 100, 100)
                    : 0;

            resultado.add(new OcupacionDia(
                    dia.format(FMT),
                    (int) ocupadas,
                    totalHabs,
                    Math.round(pct * 10.0) / 10.0,
                    ingresoDia
            ));

            cursor = cursor.plusDays(1);
        }

        return resultado;
    }

    // ── Rendimiento por tipo de habitación ────────────────────
    private List<RendimientoTipo> calcularRendimientoPorTipo(
            List<Reserva> facturadas) {

        Map<String, List<Reserva>> porTipo = facturadas.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getHabitacion().getTipo().name()
                ));

        return porTipo.entrySet().stream()
                .map(e -> {
                    String tipo = e.getKey();
                    List<Reserva> lista = e.getValue();

                    long noches = lista.stream()
                            .mapToLong(Reserva::calcularNochesFacturables)
                            .sum();

                    BigDecimal ingreso = lista.stream()
                            .map(Reserva::calcularTotalEstancia)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new RendimientoTipo(
                            tipo,
                            lista.size(),
                            noches,
                            ingreso,
                            0 // se puede calcular si se necesita
                    );
                })
                .sorted(Comparator.comparing(RendimientoTipo::ingresoTotal).reversed())
                .toList();
    }

    // ── Top habitaciones más rentables ────────────────────────
    private List<HabitacionTop> calcularTopHabitaciones(
            List<Reserva> facturadas) {

        Map<String, List<Reserva>> porHab = facturadas.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getHabitacion().getNumero()
                ));

        return porHab.values().stream()
                .map(lista -> {
                    Reserva primera = lista.getFirst();

                    long noches = lista.stream()
                            .mapToLong(Reserva::calcularNochesFacturables)
                            .sum();

                    BigDecimal ingreso = lista.stream()
                            .map(Reserva::calcularTotalEstancia)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new HabitacionTop(
                            primera.getHabitacion().getNumero(),
                            primera.getHabitacion().getTipo().name(),
                            lista.size(),
                            noches,
                            ingreso
                    );
                })
                .sorted(Comparator.comparing(HabitacionTop::ingresoTotal).reversed())
                .limit(10)
                .toList();
    }
}