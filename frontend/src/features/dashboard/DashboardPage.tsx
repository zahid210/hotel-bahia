import { useState, useMemo, useCallback, memo } from 'react'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { useAuthStore } from '@/store/useAuthStore'
import { useDashboard } from './hooks/useDashboard'
import { RoomCard } from './components/RoomCard'
import { ReservaDetailPanel } from '@/features/reservas/components/ReservaDetailPanel'
import { NuevaReservaForm } from '@/features/reservas/NuevaReservaForm'
import { Modal } from '@/components/Modal'
import { ToolbarActions, ErrorBanner } from '@/components/ui'

type Filtro = 'TODAS' | 'LIBRE' | 'OCUPADA' | 'LIMPIEZA' | 'EXCEDIDAS'

const PISOS = [1, 2, 3, 4, 5]

interface Props {
    onMensaje: (msg: string) => void
    refreshSignal?: number
}

export const DashboardPage = memo(function DashboardPage({ onMensaje, refreshSignal = 0 }: Props) {
    const {
        habitacionesConReserva,
        stats, HOY, cargando, error, procesando,
        cargar, checkIn, checkOut, cancelar,
        marcarLista, onReservaCreada,
    } = useDashboard(refreshSignal)

    const rol       = useAuthStore(s => s.rol)
    const esLimpieza = rol === 'LIMPIEZA'

    const [filtro,         setFiltro]         = useState<Filtro>(
        esLimpieza ? 'LIMPIEZA' : 'TODAS'
    )
    const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
    const [modalAbierto,   setModalAbierto]   = useState(false)

    const seleccionada = useMemo(
        () => habitacionesConReserva.find(h => h.id === seleccionadaId) ?? null,
        [habitacionesConReserva, seleccionadaId]
    )

    const filtradas = useMemo(() => {
        if (filtro === 'TODAS')      return habitacionesConReserva
        if (filtro === 'EXCEDIDAS')  return habitacionesConReserva.filter(h => h.excedida)
        return habitacionesConReserva.filter(h => h.estado === filtro)
    }, [habitacionesConReserva, filtro])

    const pisosConHabitaciones = useMemo(() =>
            PISOS.filter(p => filtradas.some(h => h.piso === p))
        , [filtradas])

    const handleClickCard = useCallback((id: number) => {
        if (esLimpieza) return
        const hab = habitacionesConReserva.find(h => h.id === id)
        if (!hab?.reservaActiva) return
        setSeleccionadaId(prev => prev === id ? null : id)
    }, [habitacionesConReserva, esLimpieza])

    const handleMarcarLista = useCallback(async (habitacionId: number) => {
        try {
            await marcarLista(habitacionId)
            const hab = habitacionesConReserva.find(h => h.id === habitacionId)
            onMensaje(`Hab. ${hab?.numero ?? habitacionId} lista y disponible`)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            onMensaje(e instanceof Error ? e.message : 'Error al liberar la habitación')
        }
    }, [marcarLista, habitacionesConReserva, onMensaje])

    const handleCheckIn = useCallback(async (reservaId: string) => {
        return await checkIn(reservaId)
    }, [checkIn])

    const handleCheckOut = useCallback(async (reservaId: string) => {
        const actualizada = await checkOut(reservaId)
        onMensaje(`Salida · Hab. ${actualizada.habitacionNumero} → Limpieza`)
        setSeleccionadaId(null)
        return actualizada
    }, [checkOut, onMensaje])

    const handleCancelar = useCallback(async (reservaId: string) => {
        const actualizada = await cancelar(reservaId)
        onMensaje(`Reserva cancelada · Hab. ${actualizada.habitacionNumero}`)
        setSeleccionadaId(null)
        return actualizada
    }, [cancelar, onMensaje])

    if (error) return (
        <ErrorBanner onRetry={() => void cargar()}>{error}</ErrorBanner>
    )

    return (
        <div className="flex gap-5 h-full min-h-0">

            {/* ════════════════════════════════════════════════════
          ÁREA PRINCIPAL
      ════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0">

                {/* ── Stats: tarjetas individuales estilo Apple ─────────── */}
                <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 flex-shrink-0">
                    {[
                        { label: 'Libres',       value: stats.libre,          color: 'text-emerald-600', filtro: 'LIBRE'     },
                        { label: 'Ocupadas',     value: stats.ocupada,        color: 'text-rose-600',    filtro: 'OCUPADA'   },
                        { label: 'Limpieza',     value: stats.limpieza,       color: 'text-blue-600',    filtro: 'LIMPIEZA'  },
                        { label: 'Excedidas',    value: stats.excedidas,      color: 'text-amber-600',   filtro: 'EXCEDIDAS' },
                        { label: 'Ocupación',    value: `${stats.ocupacion}%`, color: 'text-ink',        filtro: null        },
                        { label: 'Entradas hoy', value: stats.entradasHoy,    color: 'text-violet-600',  filtro: null        },
                        { label: 'Salidas hoy',  value: stats.salidasHoy,     color: 'text-orange-600',  filtro: null        },
                    ].map((s, i) => {
                        const activo = !!s.filtro && filtro === s.filtro
                        return (
                            <div
                                key={i}
                                role={s.filtro ? 'button' : undefined}
                                aria-pressed={s.filtro ? activo : undefined}
                                tabIndex={s.filtro ? 0 : undefined}
                                onClick={() => s.filtro && setFiltro(
                                    filtro === s.filtro ? 'TODAS' : s.filtro as Filtro
                                )}
                                onKeyDown={s.filtro
                                    ? (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            setFiltro(filtro === s.filtro ? 'TODAS' : s.filtro as Filtro)
                                        }
                                    }
                                    : undefined}
                                className={[
                                    't-card p-3.5 flex flex-col justify-center transition-all duration-150',
                                    s.filtro ? 'cursor-pointer hover:bg-gray-50' : '',
                                    s.filtro ? 'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none' : '',
                                    activo ? 'ring-2 ring-brand' : '',
                                ].join(' ')}
                            >
                                <div className="t-label mb-1">
                                    {s.label}
                                </div>
                                <div className={`text-[20px] font-semibold leading-none font-mono tracking-tight
                  ${activo ? 'text-brand' : s.color}`}>
                                    {s.value}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Controles ─────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                    <div className="t-seg">
                        {(['TODAS', 'LIBRE', 'OCUPADA', 'LIMPIEZA', 'EXCEDIDAS'] as Filtro[])
                            .map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFiltro(f)}
                                    className={`t-seg-btn ${filtro === f ? 't-seg-btn--active' : ''}`}
                                >
                                    {f === 'TODAS'    ? 'Todas'    :
                                        f === 'EXCEDIDAS'? 'Excedidas':
                                            f.charAt(0) + f.slice(1).toLowerCase()}
                                </button>
                            ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-3 text-[11px] text-gray-400 ml-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-400 rounded-full" />
              Sale hoy
            </span>
                        <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-violet-400 rounded-full" />
              Entrada pendiente
            </span>
                        <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-apple rounded-full" />
              Marcar lista
            </span>
                    </div>

                    <div className="ml-auto flex gap-2">
                        <ToolbarActions
                            onRefresh={cargar}
                            cargando={cargando}
                            refreshAriaLabel="Actualizar todo"
                            refreshTitulo="Actualizar todo"
                            crear={!esLimpieza
                                ? { onClick: () => setModalAbierto(true), label: '+ Nueva reserva' }
                                : undefined}
                        />
                    </div>
                </div>

                {/* ── Grid por pisos ────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-6 px-1">
                    {cargando && habitacionesConReserva.length === 0 ? (
                        <div className="flex items-center justify-center h-48
                            text-gray-400 text-[13px] gap-2">
              <span className="w-4 h-4 border-2 border-gray-200
                               border-t-apple t-spin animate-spin" />
                            Cargando habitaciones...
                        </div>
                    ) : pisosConHabitaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48
                            text-gray-400 gap-2">
                            <div className="text-4xl opacity-10">▧</div>
                            <div className="text-[13px]">No hay habitaciones en este estado</div>
                            <button
                                onClick={() => setFiltro('TODAS')}
                                className="text-apple text-[12px] font-medium hover:underline mt-1"
                            >
                                Ver todas
                            </button>
                        </div>
                    ) : (
                        pisosConHabitaciones.map(piso => {
                            const delPiso = filtradas.filter(h => h.piso === piso)
                            return (
                                <div key={piso}>
                                    <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-semibold text-gray-400
                                     uppercase tracking-wider">
                      Piso {piso}
                    </span>
                                        <span className="text-[11px] text-gray-300">
                      ({delPiso.length})
                    </span>
                                        <div className="flex-1 h-px bg-gray-200/60" />
                                    </div>

                                    <div
                                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
                                        className="grid gap-2.5"
                                    >
                                        {delPiso.map(hab => (
                                            <RoomCard
                                                key={hab.id}
                                                habitacion={hab}
                                                seleccionada={seleccionadaId === hab.id}
                                                hoy={HOY}
                                                onClick={handleClickCard}
                                                onMarcarLista={handleMarcarLista}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    )}

                    {!cargando && pisosConHabitaciones.length > 0 && (
                        <p className="text-[11px] text-gray-300 text-center pb-2">
                            {esLimpieza
                                ? 'Botón "✓ Lista" = habitación limpiada y disponible'
                                : 'Clic en habitación con huésped · Botón "✓ Lista" en limpieza para liberar'}
                        </p>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
    PANEL LATERAL
══════════════════════════════════════════════════════ */}
            {seleccionada?.reservaActiva && (
                <>
                    <div className="hidden lg:block flex-shrink-0
                    animate-[slideIn_0.2s_ease]">
                        <ReservaDetailPanel
                            reserva={seleccionada.reservaActiva}
                            procesando={procesando}
                            hoy={HOY}
                            onClose={() => setSeleccionadaId(null)}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onCancelar={handleCancelar}
                            onMensaje={onMensaje}
                        />
                    </div>

                    {/* Móvil: bottom sheet */}
                    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50
                    bg-white border-t border-gray-200/40 glass-strong rounded-t-none
                    shadow-modal max-h-[85vh] overflow-y-auto
                    animate-[slideUp_0.25s_ease]"
                         role="dialog"
                         aria-modal="true"
                         aria-label={`Detalle de la reserva en habitación ${seleccionada.reservaActiva.habitacionNumero}`}>
                        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 bg-gray-300 t-dot" />
                        </div>
                        <ReservaDetailPanel
                            reserva={seleccionada.reservaActiva}
                            procesando={procesando}
                            hoy={HOY}
                            onClose={() => setSeleccionadaId(null)}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onCancelar={handleCancelar}
                            onMensaje={onMensaje}
                        />
                    </div>

                    <div
                        className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={() => setSeleccionadaId(null)}
                    />
                </>
            )}

            {/* ── Modal Nueva Reserva ──────────────────────────────── */}
            <Modal
                abierto={modalAbierto}
                titulo="Nueva reserva"
                onCerrar={() => setModalAbierto(false)}
            >
                <NuevaReservaForm
                    onSuccess={() => {
                        setModalAbierto(false)
                        onMensaje('Reserva confirmada correctamente')
                        void onReservaCreada()
                    }}
                />
            </Modal>
        </div>
    )
})