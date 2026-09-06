import { useState, useMemo, useCallback, memo } from 'react'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { useDashboard } from './hooks/useDashboard'
import { RoomCard } from './components/RoomCard'
import { ReservaDetailPanel } from '@/features/reservas/components/ReservaDetailPanel'
import { NuevaReservaForm } from '@/features/reservas/NuevaReservaForm'

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

    const [filtro,         setFiltro]         = useState<Filtro>('TODAS')
    const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
    const [modalAbierto,   setModalAbierto]   = useState(false)

    // ── Habitación seleccionada — siempre del estado más fresco ──
    const seleccionada = useMemo(
        () => habitacionesConReserva.find(h => h.id === seleccionadaId) ?? null,
        [habitacionesConReserva, seleccionadaId]
    )

    // ── Lista filtrada por piso ───────────────────────────────
    const filtradas = useMemo(() => {
        if (filtro === 'TODAS')      return habitacionesConReserva
        if (filtro === 'EXCEDIDAS')  return habitacionesConReserva.filter(h => h.excedida)
        return habitacionesConReserva.filter(h => h.estado === filtro)
    }, [habitacionesConReserva, filtro])
    // ── Pisos presentes en el resultado filtrado ──────────────
    const pisosConHabitaciones = useMemo(() =>
            PISOS.filter(p => filtradas.some(h => h.piso === p))
        , [filtradas])

    // ── Click en card ─────────────────────────────────────────
    const handleClickCard = useCallback((id: number) => {
        const hab = habitacionesConReserva.find(h => h.id === id)
        if (!hab?.reservaActiva) return
        setSeleccionadaId(prev => prev === id ? null : id)
    }, [habitacionesConReserva])

    // ── Marcar lista con feedback ─────────────────────────────
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

    // ── Acciones de reserva con feedback ─────────────────────
    // El panel lateral muestra el toast de éxito de cada acción
    const handleCheckIn = useCallback(async (reservaId: string) => {
        return await checkIn(reservaId)
    }, [checkIn])

    const handleCheckOut = useCallback(async (reservaId: string) => {
        const actualizada = await checkOut(reservaId)
        onMensaje(`Check-out · Hab. ${actualizada.habitacionNumero} → Limpieza`)
        setSeleccionadaId(null)
        return actualizada
    }, [checkOut, onMensaje])

    const handleCancelar = useCallback(async (reservaId: string) => {
        const actualizada = await cancelar(reservaId)
        onMensaje(`Reserva cancelada · Hab. ${actualizada.habitacionNumero}`)
        setSeleccionadaId(null)
        return actualizada
    }, [cancelar, onMensaje])

    // ── Render ────────────────────────────────────────────────
    if (error) return (
        <div className="flex items-center gap-3 p-4 bg-red-50 border
                    border-red-200 rounded-lg text-red-700 text-sm">
            <span>⚠</span>
            <span>{error}</span>
            <button onClick={cargar} className="ml-auto underline text-xs">
                Reintentar
            </button>
        </div>
    )

    return (
        <div className="flex gap-4 h-full min-h-0">

            {/* ════════════════════════════════════════════════════
          ÁREA PRINCIPAL
      ════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">

                {/* ── Stats bar ─────────────────────────────────────── */}
                <div className="grid grid-cols-4 lg:grid-cols-7 border border-gray-100
                        rounded-lg overflow-hidden flex-shrink-0">
                    {[
                        { label: 'Libres',        value: stats.libre,          color: 'text-green-600',  filtro: 'LIBRE'          },
                        { label: 'Ocupadas',      value: stats.ocupada,        color: 'text-red-600',    filtro: 'OCUPADA'        },
                        { label: 'Limpieza',      value: stats.limpieza,       color: 'text-blue-600',   filtro: 'LIMPIEZA'       },
                        { label: 'Excedidas',    value: stats.excedidas, color: 'text-amber-600',  filtro: 'EXCEDIDAS'},
                        { label: 'Ocupación',     value: `${stats.ocupacion}%`,color: 'text-gray-800',   filtro: null             },
                        { label: 'Entradas hoy',  value: stats.entradasHoy,    color: 'text-violet-600', filtro: null             },
                        { label: 'Salidas hoy',   value: stats.salidasHoy,     color: 'text-orange-600', filtro: null             },
                    ].map((s, i, arr) => {
                        const activo = s.filtro && filtro === s.filtro
                        return (
                            <div
                                key={i}
                                role={s.filtro ? 'button' : undefined}
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
                                    'p-3 transition-colors',
                                    i < arr.length - 1 ? 'border-r border-gray-100' : '',
                                    s.filtro ? 'cursor-pointer' : '',
                                    s.filtro ? 'focus-visible:outline-2 focus-visible:outline-gray-900' : '',
                                    activo ? 'bg-gray-900' : s.filtro ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50',
                                ].join(' ')}
                            >
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                    {s.label}
                                </div>
                                <div className={`text-xl font-mono font-medium
                  ${activo ? 'text-white' : s.color}`}>
                                    {s.value}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Controles ─────────────────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    {/* Filtros */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {(['TODAS', 'LIBRE', 'OCUPADA', 'LIMPIEZA', 'EXCEDIDAS'] as Filtro[])
                            .map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFiltro(f)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                                        ${filtro === f
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {f === 'TODAS'    ? 'Todas'    :
                                        f === 'EXCEDIDAS'? 'Excedidas':
                                            f.charAt(0) + f.slice(1).toLowerCase()}
                                </button>
                            ))}
                    </div>

                    {/* Leyenda */}
                    <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-400 rounded" />
              Sale hoy
            </span>
                        <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-violet-400 rounded" />
              Check-in pendiente
            </span>
                        <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 rounded" />
              "✓ Lista" = marcar disponible
            </span>
                    </div>

                    {/* Acciones */}
                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={cargar}
                            disabled={cargando}
                            title="Actualizar todo"
                            aria-label="Actualizar todo"
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
                         text-gray-500 hover:bg-gray-50 disabled:opacity-40
                         transition-colors flex items-center justify-center min-w-[32px]"
                        >
                            {cargando
                                ? <span className="w-3 h-3 border-2 border-gray-300
                                   border-t-gray-600 rounded-full animate-spin" />
                                : '↻'}
                        </button>
                        <button
                            onClick={() => setModalAbierto(true)}
                            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium
                         rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            + Nueva reserva
                        </button>
                    </div>
                </div>

                {/* ── Grid por pisos ────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1">
                    {cargando && habitacionesConReserva.length === 0 ? (
                        <div className="flex items-center justify-center h-48
                            text-gray-400 text-sm gap-2">
              <span className="w-4 h-4 border-2 border-gray-200
                               border-t-gray-500 rounded-full animate-spin" />
                            Cargando habitaciones...
                        </div>
                    ) : pisosConHabitaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48
                            text-gray-400 gap-2">
                            <div className="text-4xl opacity-20">▧</div>
                            <div className="text-sm">No hay habitaciones en este estado</div>
                            <button
                                onClick={() => setFiltro('TODAS')}
                                className="text-xs text-gray-500 underline mt-1"
                            >
                                Ver todas
                            </button>
                        </div>
                    ) : (
                        pisosConHabitaciones.map(piso => {
                            const delPiso = filtradas.filter(h => h.piso === piso)
                            return (
                                <div key={piso}>
                                    {/* Cabecera de piso */}
                                    <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400
                                     uppercase tracking-wider">
                      Piso {piso}
                    </span>
                                        <span className="text-xs text-gray-300">
                      ({delPiso.length})
                    </span>
                                        <div className="flex-1 h-px bg-gray-100" />
                                    </div>

                                    {/* ── Grid escalable: minmax(90px, 1fr) ─────────
                      Con 20 hab. en 1200px → ~12 por fila × 2 filas
                      Con 25 hab. en 912px  → ~10 por fila × 3 filas
                      Nunca se rompe independientemente del volumen  */}
                                    <div
                                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
                                        className="grid gap-2"
                                    >
                                        {delPiso.map(hab => (
                                            <RoomCard
                                                key={hab.id}
                                                habitacion={hab}
                                                seleccionada={seleccionadaId === hab.id}
                                                hoy={HOY}
                                                onClick={() => handleClickCard(hab.id)}
                                                onMarcarLista={handleMarcarLista}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    )}

                    {!cargando && pisosConHabitaciones.length > 0 && (
                        <p className="text-xs text-gray-300 text-center pb-2">
                            Clic en habitación con huésped · Botón azul en Limpieza para liberar
                        </p>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
    PANEL LATERAL — Desktop: columna derecha
    Móvil: bottom sheet deslizante desde abajo
════════════════════════════════════════════════════ */}
            {seleccionada?.reservaActiva && (
                <>
                    {/* ── Desktop: panel fijo a la derecha ─────────────── */}
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

                    {/* ── Móvil: bottom sheet ───────────────────────────── */}
                    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50
                    bg-white rounded-t-2xl border-t border-gray-200
                    shadow-2xl max-h-[85vh] overflow-y-auto
                    animate-[slideUp_0.25s_ease]">
                        {/* Handle visual — indica que se puede arrastrar */}
                        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
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

                    {/* ── Overlay oscuro en móvil ───────────────────────── */}
                    <div
                        className="lg:hidden fixed inset-0 bg-black/40 z-40"
                        onClick={() => setSeleccionadaId(null)}
                    />
                </>
            )}

            {/* ════════════════════════════════════════════════════
          MODAL NUEVA RESERVA
      ════════════════════════════════════════════════════ */}
            {modalAbierto && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex items-center
                     justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Nueva reserva"
                    onClick={e => e.target === e.currentTarget && setModalAbierto(false)}
                >
                    <div className="bg-white rounded-xl border border-gray-100 w-full
                          max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-semibold">Nueva reserva</h2>
                            <button
                                onClick={() => setModalAbierto(false)}
                                aria-label="Cerrar"
                                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                            >✕</button>
                        </div>
                        <NuevaReservaForm
                            onSuccess={() => {
                                setModalAbierto(false)
                                onMensaje('Reserva confirmada correctamente')
                                void onReservaCreada()
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
})