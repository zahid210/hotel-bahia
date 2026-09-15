import { memo } from 'react'
import { capitalizar } from '@/lib/format'
import { HabitacionConReserva } from '../hooks/useDashboard'

const ESTADO_CFG = {
    LIBRE: {
        label: 'Libre',
        bg: 'bg-green-50/80', border: 'border-green-200/60',
        dot: 'bg-green-500', text: 'text-green-700',
    },
    OCUPADA: {
        label: 'Ocupada',
        bg: 'bg-red-50/80', border: 'border-red-200/60',
        dot: 'bg-red-500', text: 'text-red-700',
    },
    MANTENIMIENTO: {
        label: 'Mantenimiento',
        bg: 'bg-amber-50/80', border: 'border-amber-200/60',
        dot: 'bg-amber-500', text: 'text-amber-700',
    },
    LIMPIEZA: {
        label: 'Limpieza',
        bg: 'bg-blue-50/80', border: 'border-blue-200/60',
        dot: 'bg-blue-500', text: 'text-blue-700',
    },
} as const

interface Props {
    habitacion:     HabitacionConReserva
    seleccionada:   boolean
    hoy:            string
    onClick:        (id: number) => void
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
        !habitacion.excedida

    const esClickable = !!res
    const esAccionLista =
        habitacion.estado === 'LIMPIEZA' && !res && !!onMarcarLista

    const bgFinal     = habitacion.excedida ? 'bg-amber-50/80'   : cfg.bg
    const dotFinal    = habitacion.excedida ? 'bg-amber-500'      : cfg.dot
    const textFinal   = habitacion.excedida ? 'text-amber-700'    : cfg.text
    const labelFinal  = habitacion.excedida ? 'Excedida'          : cfg.label

    const estilos = [
        'relative border p-3.5 transition-all duration-150 select-none text-left',
        bgFinal,
        seleccionada
            ? 'border-apple ring-2 ring-apple/30 shadow-soft'
            : habitacion.excedida
                ? 'border-amber-300/60'
                : saleHoy
                    ? 'border-orange-300/60'
                    : pendienteCheckIn
                        ? 'border-violet-300/60'
                        : [cfg.border, 'shadow-card'],
        esClickable
            ? 'cursor-pointer hover:shadow-soft hover:-translate-y-0.5'
            : 'cursor-default',
    ].join(' ')

    const contenido = (
        <>
            {/* Franja superior según estado */}
            {habitacion.excedida && (
                <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-400" />
            )}
            {!habitacion.excedida && saleHoy && (
                <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-400" />
            )}
            {!habitacion.excedida && pendienteCheckIn && (
                <div className="absolute top-0 inset-x-0 h-[3px] bg-violet-400" />
            )}

            {seleccionada && (
                <span className="absolute top-2 right-2 w-2 h-2
                         t-dot bg-apple animate-pulse" />
            )}

            <div className="font-semibold text-[15px] leading-none text-ink tracking-tight">
                {habitacion.numero}
            </div>

            <div className="text-[11px] text-gray-400 mt-1 leading-none truncate">
                {capitalizar(habitacion.tipo)}
                {' · '}S/{habitacion.precioNoche}
            </div>

            <div className={`inline-flex items-start gap-1.5 mt-2
                        text-[11px] font-medium leading-tight ${textFinal}`}>
        <span className={`w-1.5 h-1.5 t-dot flex-shrink-0
                          mt-0.5 ${dotFinal}`} />
                <span className="break-words">
          {pendienteCheckIn && !habitacion.excedida
              ? 'Check-in hoy'
              : labelFinal}
        </span>
            </div>

            {res && (
                <div className="mt-1.5 text-[11px] text-gray-500 truncate leading-tight">
                    {res.nombreHuesped} {res.apellidoHuesped}
                </div>
            )}

            {habitacion.excedida && (
                <div className="mt-1 text-[11px] font-semibold text-amber-600">
                    ⚠ Superó fecha de salida
                </div>
            )}
            {!habitacion.excedida && saleHoy && (
                <div className="mt-1 text-[11px] font-semibold text-orange-500">
                    Sale hoy ↗
                </div>
            )}

            {esAccionLista && (
                <button
                    onClick={() => onMarcarLista(habitacion.id)}
                    className="mt-2.5 w-full py-1.5 text-[11px] font-medium text-apple
                     border border-apple/30 rounded-full bg-white
                     hover:bg-apple/5 active:scale-[0.98] transition-all duration-150"
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
            onClick={() => onClick(habitacion.id)}
            disabled={!esClickable}
            aria-label={`Habitación ${habitacion.numero} ${labelFinal}`}
            className={estilos}
        >
            {contenido}
        </button>
    )
})