import { useState, useEffect, useCallback } from 'react'
import { reservaService, Reserva } from '@/services/reservaService'

export function useReservas() {
    const [reservas,   setReservas]   = useState<Reserva[]>([])
    const [cargando,   setCargando]   = useState(true)
    const [error,      setError]      = useState<string | null>(null)
    const [procesando, setProcesando] = useState<string | null>(null) // id de reserva en acción

    // ── Cargar todas ──────────────────────────────────────────
    const cargar = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)
            const data = await reservaService.listarTodas()
            setReservas(data)
        } catch (e: unknown) {
            const mensaje = e instanceof Error ? e.message : 'Ocurrió un error inesperado';
            setError(mensaje);
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    // ── Ejecutor genérico de acciones ─────────────────────────
    // Marca la reserva como "procesando", ejecuta la acción,
    // actualiza SOLO esa reserva en el array local (sin recargar todoo)
    const ejecutar = async (
        id: string,
        accion: () => Promise<Reserva>
    ): Promise<Reserva> => {
        setProcesando(id)
        try {
            const actualizada = await accion()
            setReservas(prev =>
                prev.map(r => r.id === id ? actualizada : r)
            )
            return actualizada
        } finally {
            setProcesando(null)
        }
    }

    // ── Acciones públicas ─────────────────────────────────────
    const checkIn  = (id: string) => ejecutar(id, () => reservaService.checkIn(id))
    const checkOut = (id: string) => ejecutar(id, () => reservaService.checkOut(id))
    const cancelar = (id: string) => ejecutar(id, () => reservaService.cancelar(id))

    return { reservas, cargando, error, procesando, cargar, checkIn, checkOut, cancelar }
}