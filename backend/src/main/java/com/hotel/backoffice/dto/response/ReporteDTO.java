package com.hotel.backoffice.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class ReporteDTO {

    // ── Resumen general del período ───────────────────────────
    public record ResumenPeriodo(
            int        totalReservas,
            int        reservasActivas,    // CHECKIN + CONFIRMADA
            int        checkoutsRealizados,
            int        cancelaciones,
            BigDecimal ingresoTotal,       // suma de totalEstancia de CHECKOUT
                                           // (incluye consumo de habitación)
            BigDecimal ingresoConsumo,     // parte del ingreso por servicio de habitación
            BigDecimal ingresoPromedioPorNoche,
            double     ocupacionPromedio,  // % promedio del período
            long       nochesVendidas      // suma de noches facturables
    ) {}

    // ── Ocupación por día (para la gráfica de barras) ─────────
    public record OcupacionDia(
            String fecha,           // "2026-03-16"
            int    habitacionesOcupadas,
            int    totalHabitaciones,
            double porcentaje,      // 0-100
            BigDecimal ingresoDia
    ) {}

    // ── Rendimiento por tipo de habitación ────────────────────
    public record RendimientoTipo(
            String     tipo,           // SIMPLE, DOBLE, SUITE, FAMILIAR
            int        reservas,
            long       nochesVendidas,
            BigDecimal ingresoTotal,
            double     ocupacionPromedio
    ) {}

    // ── Habitación más rentable ───────────────────────────────
    public record HabitacionTop(
            String     numero,
            String     tipo,
            int        reservas,
            long       nochesVendidas,
            BigDecimal ingresoTotal
    ) {}

    // ── Respuesta completa del reporte ────────────────────────
    public record ReporteCompleto(
            String                 periodoInicio,
            String                 periodoFin,
            ResumenPeriodo         resumen,
            List<OcupacionDia>     ocupacionPorDia,
            List<RendimientoTipo>  rendimientoPorTipo,
            List<HabitacionTop>    topHabitaciones,
            int                    totalHabitacionesHotel
    ) {}
}