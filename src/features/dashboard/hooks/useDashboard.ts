import { esSesionExpirada } from '@/lib/esErrorSesion'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { habitacionService, Habitacion } from '@/services/habitacionService'
import { reservaService, Reserva } from '@/services/reservaService'
import { getServerTime } from '@/services/api'

export interface HabitacionConReserva extends Habitacion {
    reservaActiva: Reserva | null
    excedida:      boolean   // true si fechaSalida < HOY y estado CHECKIN
}

export function useDashboard() {
    const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
    const [reservas,     setReservas]     = useState<Reserva[]>([])
    const [cargando,     setCargando]     = useState(true)
    const [error,        setError]        = useState<string | null>(null)
    const [procesando,   setProcesando]   = useState<string | null>(null)

    // ── Fecha del servidor — fuente de verdad para "hoy" ─────
    // Inicializa con la fecha local como fallback mientras carga
    const [HOY, setHOY] = useState<string>(
        () => new Date().toISOString().split('T')[0]
    )
    const [horaServidor, setHoraServidor] = useState<number>(
        () => new Date().getHours()
    )

    // ── Carga paralela: habitaciones + reservas + tiempo ─────
    const cargar = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)
            const [habs, revs, tiempo] = await Promise.all([
                habitacionService.listarTodas(),
                reservaService.listarTodas(),
                getServerTime(),
            ])
            setHabitaciones(habs)
            setReservas(revs)
            setHOY(tiempo.fecha)
            setHoraServidor(tiempo.hora)
        } catch (e: unknown) {
            // Si es sesión expirada, no mostrar error:
            // PrivateRoute ya reacciona al logout() del interceptor
            if (esSesionExpirada(e)) return
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    // ── Cruce habitación ↔ reserva activa ─────────────────────
    const habitacionesConReserva = useMemo<HabitacionConReserva[]>(() =>
            habitaciones.map(hab => {
                const reservaActiva = reservas.find(r =>
                    r.habitacionId === hab.id &&
                    (r.estado === 'CHECKIN' || r.estado === 'CONFIRMADA')
                ) ?? null

                // Excedida = en hotel + fecha de salida ya pasó (comparación de strings ISO)
                // Usa HOY del servidor para evitar errores si la PC tiene hora incorrecta
                const excedida =
                    reservaActiva?.estado === 'CHECKIN' &&
                    !!reservaActiva.fechaSalida &&
                    reservaActiva.fechaSalida < HOY   // "2026-03-15" < "2026-03-16" → true

                return { ...hab, reservaActiva, excedida }
            })
        , [habitaciones, reservas, HOY]) // ← HOY como dependencia

    // ── Stats — todos usan HOY del servidor ───────────────────
    const stats = useMemo(() => ({
        libre:          habitaciones.filter(h => h.estado === 'LIBRE').length,
        ocupada:        habitaciones.filter(h => h.estado === 'OCUPADA').length,
        limpieza:       habitaciones.filter(h => h.estado === 'LIMPIEZA').length,
        mantenimiento:  habitaciones.filter(h => h.estado === 'MANTENIMIENTO').length,
        entradasHoy:    reservas.filter(r =>
            r.estado === 'CONFIRMADA' && r.fechaEntrada === HOY   // ← HOY del server
        ).length,
        salidasHoy:     reservas.filter(r =>
            r.estado === 'CHECKIN' && r.fechaSalida === HOY       // ← HOY del server
        ).length,
        ocupacion: habitaciones.length
            ? Math.round(
                habitaciones.filter(h => h.estado === 'OCUPADA').length
                / habitaciones.length * 100
            )
            : 0,
        excedidas: habitacionesConReserva.filter(h => h.excedida).length,
    }), [habitaciones, reservas, HOY, habitacionesConReserva])

    // ── Mapa de transiciones reserva → habitación ────────────
    const RESERVA_A_HAB: Partial<Record<string, Habitacion['estado']>> = {
        CHECKIN:   'OCUPADA',
        CHECKOUT:  'LIMPIEZA',
        CANCELADA: 'LIBRE',
    }

    // ── Ejecutor genérico ─────────────────────────────────────
    const ejecutar = async (
        reservaId: string,
        accion: () => Promise<Reserva>
    ): Promise<Reserva> => {
        setProcesando(reservaId)
        try {
            const actualizada = await accion()
            setReservas(prev =>
                prev.map(r => r.id === reservaId ? actualizada : r)
            )
            const nuevoEstado = RESERVA_A_HAB[actualizada.estado]
            if (nuevoEstado) {
                setHabitaciones(prev =>
                    prev.map(h =>
                        h.id === actualizada.habitacionId
                            ? { ...h, estado: nuevoEstado }
                            : h
                    )
                )
            }
            return actualizada
        } catch (e: unknown) {
            if (esSesionExpirada(e)) throw e  // re-lanza para que el panel no muestre acción
            throw e
        } finally {
            setProcesando(null)
        }
    }

    // ── Acciones de reserva ───────────────────────────────────
    const checkIn  = (id: string) => ejecutar(id, () => reservaService.checkIn(id))
    const checkOut = (id: string) => ejecutar(id, () => reservaService.checkOut(id))
    const cancelar = (id: string) => ejecutar(id, () => reservaService.cancelar(id))

    // ── Marcar habitación en limpieza como libre ──────────────
    const marcarLista = async (habitacionId: number): Promise<void> => {
        setProcesando(String(habitacionId))
        try {
            const actualizada = await habitacionService.cambiarEstado(habitacionId, 'LIBRE')
            setHabitaciones(prev =>
                prev.map(h => h.id === habitacionId ? actualizada : h)
            )
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            throw e
        } finally {
            setProcesando(null)
        }
    }

    const onReservaCreada = useCallback(async () => {
        const revs = await reservaService.listarTodas()
        setReservas(revs)
    }, [])

    return {
        habitacionesConReserva,
        stats,
        HOY,                   // ← expuesto para que RoomCard lo use
        horaServidor,          // ← expuesto para el panel de detalle
        cargando, error, procesando,
        cargar,
        checkIn, checkOut, cancelar,
        marcarLista,
        onReservaCreada,
    }
}