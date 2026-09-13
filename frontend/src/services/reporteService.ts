import { api } from './api'

// ── Tipos espejo de los records Java ─────────────────────────
export interface ResumenPeriodo {
    totalReservas:            number
    reservasActivas:          number
    checkoutsRealizados:      number
    cancelaciones:            number
    ingresoTotal:             number
    ingresoConsumo:           number
    ingresoPromedioPorNoche:  number
    ocupacionPromedio:        number
    nochesVendidas:           number
}

export interface OcupacionDia {
    fecha:                string
    habitacionesOcupadas: number
    totalHabitaciones:    number
    porcentaje:           number
    ingresoDia:           number
}

export interface RendimientoTipo {
    tipo:             string
    reservas:         number
    nochesVendidas:   number
    ingresoTotal:     number
    ocupacionPromedio: number
}

export interface HabitacionTop {
    numero:         string
    tipo:           string
    reservas:       number
    nochesVendidas: number
    ingresoTotal:   number
}

export interface ReporteCompleto {
    periodoInicio:          string
    periodoFin:             string
    resumen:                ResumenPeriodo
    ocupacionPorDia:        OcupacionDia[]
    rendimientoPorTipo:     RendimientoTipo[]
    topHabitaciones:        HabitacionTop[]
    totalHabitacionesHotel: number
}

// ── Servicio ──────────────────────────────────────────────────
export const reporteService = {
    porRango: (inicio: string, fin: string) =>
        api.get<ReporteCompleto>(
            `/reportes?inicio=${inicio}&fin=${fin}`
        ).then(r => r.data),

    hoy:    () => api.get<ReporteCompleto>('/reportes/hoy').then(r => r.data),
    semana: () => api.get<ReporteCompleto>('/reportes/semana').then(r => r.data),
    mes:    () => api.get<ReporteCompleto>('/reportes/mes').then(r => r.data),
}