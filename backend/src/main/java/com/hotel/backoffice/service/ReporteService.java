package com.hotel.backoffice.service;

import com.hotel.backoffice.dto.response.ReporteDTO.*;
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
        if (inicio.isAfter(fin)) {
            throw new IllegalArgumentException(
                    "La fecha de inicio no puede ser posterior a la de fin."
            );
        }

        List<Reserva> enPeriodo    = reservaRepo.findEnPeriodo(inicio, fin);
        int           totalHabs    = (int) habitacionRepo.count();
        int           diasPeriodo  = (int) ChronoUnit.DAYS.between(inicio, fin) + 1;

        // Solo checkouts para cálculo de ingresos reales (ya cobrados)
        List<Reserva> facturadas = enPeriodo.stream()
                .filter(r -> r.getEstado().equals(EstadoReserva.CHECKOUT))
                .toList();

        // Capacidad por tipo de habitación (para ocupación por tipo)
        Map<String, Long> habsPorTipo = habitacionRepo.countPorTipo().stream()
                .collect(Collectors.toMap(
                        fila -> ((Enum<?>) fila[0]).name(),
                        fila -> (Long) fila[1]
                ));

        return new ReporteCompleto(
                inicio.format(FMT),
                fin.format(FMT),
                calcularResumen(
                        reservaRepo.countActivasEnPeriodo(inicio, fin),
                        reservaRepo.countCanceladasEnPeriodo(inicio, fin),
                        facturadas, enPeriodo, totalHabs, inicio, fin, diasPeriodo),
                calcularOcupacionPorDia(enPeriodo, totalHabs, inicio, fin),
                calcularRendimientoPorTipo(facturadas, enPeriodo, habsPorTipo, diasPeriodo, inicio, fin),
                calcularTopHabitaciones(facturadas),
                totalHabs
        );
    }

    // ── Resumen del período ───────────────────────────────────
    private ResumenPeriodo calcularResumen(
            long reservasActivas,
            long cancelaciones,
            List<Reserva> facturadas,
            List<Reserva> enPeriodo,
            int totalHabs,
            LocalDate inicio,
            LocalDate fin,
            int diasPeriodo) {

        BigDecimal ingresoTotal = facturadas.stream()
                .map(Reserva::calcularTotalEstancia)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Noches facturables + noches extra por late checkout (el cargo
        // de horas extra ya está dentro de ingresoTotal, así el promedio
        // por noche no queda inflado).
        long nochesVendidas = facturadas.stream()
                .mapToLong(r -> r.calcularNochesFacturables() + horasExtraDe(r))
                .sum();

        BigDecimal ingresoPorNoche = nochesVendidas > 0
                ? ingresoTotal.divide(
                        BigDecimal.valueOf(nochesVendidas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // CHECKIN = ocupada ahora / CHECKOUT = estuvo ocupada en el período
        List<Reserva> ocupacionReal = enPeriodo.stream()
                .filter(r -> r.getEstado() == EstadoReserva.CHECKIN
                        || r.getEstado() == EstadoReserva.CHECKOUT)
                .toList();

        long ocupacionesTotales = ocupacionReal.stream()
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
                (int) reservasActivas,
                facturadas.size(),
                (int) cancelaciones,
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

        // CHECKIN = ocupada ahora / CHECKOUT = estuvo ocupada en el período
        List<Reserva> ocupacionReal = enPeriodo.stream()
                .filter(r -> r.getEstado() == EstadoReserva.CHECKIN
                        || r.getEstado() == EstadoReserva.CHECKOUT)
                .toList();

        int       dias          = (int) ChronoUnit.DAYS.between(inicio, fin) + 1;
        LocalDate finExclusivo  = fin.plusDays(1);

        // Arreglo de diferencias: por cada reserva sumamos los días que ocupa
        long[]       ocupadas = new long[dias];
        BigDecimal[] ingreso  = new BigDecimal[dias];
        Arrays.fill(ingreso, BigDecimal.ZERO);

        for (Reserva r : ocupacionReal) {
            LocalDate desde = r.getFechaEntrada().isBefore(inicio)
                    ? inicio : r.getFechaEntrada();
            LocalDate hasta = r.getFechaSalida().isAfter(fin)
                    ? finExclusivo : r.getFechaSalida();

            if (hasta.isBefore(inicio) || desde.isAfter(fin)) continue;

            int desdeIdx = (int) ChronoUnit.DAYS.between(inicio, desde);
            int hastaIdx = (int) ChronoUnit.DAYS.between(inicio, hasta);

            ocupadas[desdeIdx]++;
            if (hastaIdx < dias) {
                ocupadas[hastaIdx]--;
            }

            // Ingreso diario SOLO de estancias ya cobradas (CHECKOUT),
            // para que el total de la gráfica coincida con el resumen.
            if (r.getEstado() == EstadoReserva.CHECKOUT) {
                long noches = r.calcularNochesFacturables() + horasExtraDe(r);
                BigDecimal valorNoche = noches > 0
                        ? r.calcularTotalEstancia()
                        .divide(BigDecimal.valueOf(noches), 4, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                ingreso[desdeIdx] = ingreso[desdeIdx].add(valorNoche);
                if (hastaIdx < dias) {
                    ingreso[hastaIdx] = ingreso[hastaIdx].subtract(valorNoche);
                }
            }
        }

        List<OcupacionDia> resultado = new ArrayList<>(dias);
        long       acumOcupadas = 0;
        BigDecimal acumIngreso  = BigDecimal.ZERO;

        for (int i = 0; i < dias; i++) {
            acumOcupadas += ocupadas[i];
            acumIngreso   = acumIngreso.add(ingreso[i]);

            LocalDate dia = inicio.plusDays(i);
            double    pct = totalHabs > 0
                    ? Math.min((double) acumOcupadas / totalHabs * 100, 100)
                    : 0;

            resultado.add(new OcupacionDia(
                    dia.format(FMT),
                    (int) acumOcupadas,
                    totalHabs,
                    Math.round(pct * 10.0) / 10.0,
                    acumIngreso.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        return resultado;
    }

    // ── Rendimiento por tipo de habitación ────────────────────
    private List<RendimientoTipo> calcularRendimientoPorTipo(
            List<Reserva> facturadas,
            List<Reserva> enPeriodo,
            Map<String, Long> habsPorTipo,
            int diasPeriodo,
            LocalDate inicio,
            LocalDate fin) {

        // Noches de ocupación real por tipo (CHECKIN + CHECKOUT), acotadas al período
        Map<String, Long> nochesOcupPorTipo = new HashMap<>();
        for (Reserva r : enPeriodo) {
            if (r.getEstado() != EstadoReserva.CHECKIN
                    && r.getEstado() != EstadoReserva.CHECKOUT) {
                continue;
            }
            LocalDate desde = r.getFechaEntrada().isBefore(inicio)
                    ? inicio : r.getFechaEntrada();
            LocalDate hasta = r.getFechaSalida().isAfter(fin)
                    ? fin.plusDays(1) : r.getFechaSalida();
            long noches = Math.max(ChronoUnit.DAYS.between(desde, hasta), 0);
            if (noches == 0) continue;

            String tipo = r.getHabitacion().getTipo().name();
            nochesOcupPorTipo.merge(tipo, noches, Long::sum);
        }

        Map<String, List<Reserva>> porTipo = facturadas.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getHabitacion().getTipo().name()
                ));

        return porTipo.entrySet().stream()
                .map(e -> {
                    String tipo = e.getKey();
                    List<Reserva> lista = e.getValue();

                    long noches = lista.stream()
                            .mapToLong(r -> r.calcularNochesFacturables() + horasExtraDe(r))
                            .sum();

                    BigDecimal ingreso = lista.stream()
                            .map(Reserva::calcularTotalEstancia)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    long capacidad      = habsPorTipo.getOrDefault(tipo, 0L);
                    double ocupacionPct = capacidad > 0 && diasPeriodo > 0
                            ? Math.min(100.0,
                            (double) nochesOcupPorTipo.getOrDefault(tipo, 0L)
                                    / (capacidad * diasPeriodo) * 100)
                            : 0;

                    return new RendimientoTipo(
                            tipo,
                            lista.size(),
                            noches,
                            ingreso,
                            Math.round(ocupacionPct * 10.0) / 10.0
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
                            .mapToLong(r -> r.calcularNochesFacturables() + horasExtraDe(r))
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

    // ── Utilidades ────────────────────────────────────────────
    private int horasExtraDe(Reserva r) {
        Integer h = r.getHorasExtra();
        return h == null ? 0 : h;
    }
}