import { memo } from 'react'
import { capitalizar } from '@/lib/format'
import { HabitacionConReserva } from '../hooks/useDashboard'

const ESTADO_CFG = {
    LIBRE: {
        label: 'Libre',
        bg: 'bg-green-50', border: 'border-green-200',
        dot: 'bg-green-500', text: 'text-green-700',
    },
    OCUPADA: {
        label: 'Ocupada',
        bg: 'bg-red-50', border: 'border-red-200',
        dot: 'bg-red-500', text: 'text-red-700',
    },
    MANTENIMIENTO: {
        label: 'Mantenimiento',
        bg: 'bg-amber-50', border: 'border-amber-200',
        dot: 'bg-amber-500', text: 'text-amber-700',
    },
    LIMPIEZA: {
        label: 'Limpieza',
        bg: 'bg-blue-50', border: 'border-blue-200',
        dot: 'bg-blue-500', text: 'text-blue-700',
    },
} as const

interface Props {
    habitacion:     HabitacionConReserva
    seleccionada:   boolean
    hoy:            string
    onClick:        () => void
    onMarcarLista?: (id: number) => void
}

export const RoomCard = memo(function RoomCard({
                                                     habitacion, seleccionada, hoy, onClick, onMarcarLista
                                                 }: Props) {
    const cfg = ESTADO_CFG[habitacion.estado] ?? ESTADO_CFG.LIBRE
    const res = habitacion.reservaActiva

    const pendienteCheckIn =
        habitacion.estado === 'LIBRE' &&
        res?.estado === 'CONFIRMADA' &&
        res.fechaEntrada === hoy

    const saleHoy =
        habitacion.estado === 'OCUPADA' &&
        res?.fechaSalida === hoy &&
        !habitacion.excedida    // ← "sale hoy" solo si no está ya excedida

    const esClickable = !!res
    const esAccionLista =
        habitacion.estado === 'LIMPIEZA' && !res && !!onMarcarLista

    // ── Config visual según si está excedida ─────────────────
    // Excedida usa ámbar para diferenciarse del rojo de "ocupada normal"
    const bgFinal     = habitacion.excedida ? 'bg-amber-50'     : cfg.bg
    const dotFinal    = habitacion.excedida ? 'bg-amber-500'    : cfg.dot
    const textFinal   = habitacion.excedida ? 'text-amber-700'  : cfg.text
    const labelFinal  = habitacion.excedida ? 'Excedida'        : cfg.label

    const estilos = [
        'relative rounded-lg border p-3 transition-all duration-150 select-none text-left',
        bgFinal,
        // Borde por prioridad: seleccionada > excedida > urgente > normal
        seleccionada
            ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1 shadow-sm'
            : habitacion.excedida
                ? 'border-amber-400 ring-1 ring-amber-300'
                : saleHoy
                    ? 'border-orange-400 ring-1 ring-orange-300'
                    : pendienteCheckIn
                        ? 'border-violet-400 ring-1 ring-violet-300'
                        : cfg.border,
        esClickable
            ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm'
            : 'cursor-default',
    ].join(' ')

    const contenido = (
        <>
        {/* ── Franja superior según estado ─────────────────────── */}
            {habitacion.excedida && (
                <div className="absolute top-0 inset-x-0 h-1
                        bg-amber-400 rounded-t-lg" />
            )}
            {!habitacion.excedida && saleHoy && (
                <div className="absolute top-0 inset-x-0 h-1
                        bg-orange-400 rounded-t-lg" />
            )}
            {!habitacion.excedida && pendienteCheckIn && (
                <div className="absolute top-0 inset-x-0 h-1
                        bg-violet-400 rounded-t-lg" />
            )}

            {/* Punto de selección */}
            {seleccionada && (
                <span className="absolute top-2 right-2 w-2 h-2
                         rounded-full bg-gray-900" />
            )}

            {/* ── Número ───────────────────────────────────────────── */}
            <div className="font-mono font-bold text-base leading-none text-gray-900">
                {habitacion.numero}
            </div>

            {/* ── Tipo + precio ─────────────────────────────────────── */}
            <div className="text-xs text-gray-400 mt-0.5 leading-none truncate">
                {capitalizar(habitacion.tipo)}
                {' · '}S/{habitacion.precioNoche}
            </div>

            {/* ── Badge de estado ───────────────────────────────────── */}
            <div className={`inline-flex items-start gap-1.5 mt-2
                        text-xs font-medium leading-tight ${textFinal}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                          mt-0.5 ${dotFinal}`} />
                <span className="break-words">
          {pendienteCheckIn && !habitacion.excedida
              ? 'Check-in hoy'
              : labelFinal}
        </span>
            </div>

            {/* ── Huésped ───────────────────────────────────────────── */}
            {res && (
                <div className="mt-1 text-xs text-gray-500 truncate leading-tight">
                    {res.nombreHuesped} {res.apellidoHuesped}
                </div>
            )}

            {/* ── Indicadores de urgencia ───────────────────────────── */}
            {habitacion.excedida && (
                <div className="mt-1 text-xs font-semibold text-amber-600">
                    ⚠ Superó fecha de salida
                </div>
            )}
            {!habitacion.excedida && saleHoy && (
                <div className="mt-1 text-xs font-semibold text-orange-500">
                    Sale hoy ↗
                </div>
            )}

            {/* ── Botón lista en limpieza ───────────────────────────── */}
            {esAccionLista && (
                <button
                    onClick={() => onMarcarLista(habitacion.id)}
                    className="mt-2.5 w-full py-1.5 text-xs font-medium text-blue-600
                     border border-blue-200 rounded-md bg-white
                     hover:bg-blue-50 active:scale-95 transition-all"
                >
                    ✓ Lista
                </button>
            )}
        </>
    )

    if (esAccionLista) {
        return <div className={estilos}>{contenido}</div>
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!esClickable}
            aria-label={`Habitación ${habitacion.numero} ${labelFinal}`}
            className={estilos}
        >
            {contenido}
        </button>
    )
})