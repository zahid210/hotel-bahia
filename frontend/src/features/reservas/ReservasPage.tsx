import { esSesionExpirada } from '@/lib/esErrorSesion'
import { formatFecha, formatSoles, capitalizar } from '@/lib/format'
import { ESTADO_CFG } from '@/lib/estadoReserva'
import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { reservaService, Reserva } from '@/services/reservaService'

type FiltroTab = 'TODAS' | 'ACTIVAS' | 'HISTORIAL'

interface Props {
    onNuevaReserva: () => void
    onMensaje: (texto: string) => void
    refreshSignal?: number
}

export const ReservasPage = memo(function ReservasPage({
                                                           onNuevaReserva,
                                                           onMensaje,
                                                           refreshSignal = 0,
                                                       }: Props) {
    const [reservas,  setReservas]  = useState<Reserva[]>([])
    const [cargando,  setCargando]  = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [filtro,    setFiltro]    = useState<FiltroTab>('TODAS')
    const [busqueda,  setBusqueda]  = useState('')

    const cargar = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)
            setReservas(await reservaService.listarTodas())
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar, refreshSignal])

    const stats = useMemo(() => ({
        total:      reservas.length,
        activas:    reservas.filter(r => r.estado === 'CONFIRMADA' || r.estado === 'CHECKIN').length,
        checkin:    reservas.filter(r => r.estado === 'CHECKIN').length,
        canceladas: reservas.filter(r => r.estado === 'CANCELADA').length,
    }), [reservas])

    const filtradas = useMemo(() => {
        let lista = [...reservas]
        if (filtro === 'ACTIVAS')   lista = lista.filter(r =>
            r.estado === 'CONFIRMADA' || r.estado === 'CHECKIN'
        )
        if (filtro === 'HISTORIAL') lista = lista.filter(r =>
            r.estado === 'CHECKOUT' || r.estado === 'CANCELADA'
        )
        const q = busqueda.toLowerCase().trim()
        if (q) lista = lista.filter(r =>
            r.nombreHuesped.toLowerCase().includes(q)    ||
            r.apellidoHuesped.toLowerCase().includes(q)  ||
            r.habitacionNumero.includes(q)               ||
            r.nroDocumento.toLowerCase().includes(q)
        )
        return lista
    }, [reservas, filtro, busqueda])

    if (cargando) return (
        <div className="flex items-center justify-center h-64 text-gray-400 text-[13px] gap-2">
      <span className="w-4 h-4 border-2 border-gray-200 border-t-apple
                       rounded-full animate-spin" />
            Cargando historial...
        </div>
    )

    if (error) return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-[13px]">
            ⚠ {error}
        </div>
    )

    return (
        <div className="flex flex-col h-full min-h-0 gap-4">
            {/* ── Stats ─────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-3 flex-shrink-0">
                {[
                    { label: 'Total',       value: stats.total,      color: 'text-ink'   },
                    { label: 'Activas',     value: stats.activas,    color: 'text-violet-600' },
                    { label: 'En hotel',    value: stats.checkin,    color: 'text-red-600'    },
                    { label: 'Canceladas',  value: stats.canceladas, color: 'text-gray-400'   },
                ].map((s, i) => (
                    <div key={i} className="t-card p-3.5">
                        <div className="t-label mb-1">
                            {s.label}
                        </div>
                        <div className={`text-[20px] font-semibold font-mono tracking-tight ${s.color}`}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Controles ─────────────────────────────────── */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                <div className="t-seg">
                    {([
                        { id: 'TODAS',     label: 'Todas'     },
                        { id: 'ACTIVAS',   label: `Activas (${stats.activas})` },
                        { id: 'HISTORIAL', label: 'Historial' },
                    ] as { id: FiltroTab; label: string }[]).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFiltro(t.id)}
                            className={`t-seg-btn ${filtro === t.id ? 't-seg-btn--active' : ''}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por huésped, habitación..."
                    aria-label="Buscar reservas"
                    className="t-input flex-1 min-w-40"
                />

                <button
                    onClick={() => cargar().then(() => onMensaje('Listado de reservas actualizado'))}
                    aria-label="Actualizar listado"
                    title="Actualizar listado"
                    className="t-btn-ghost min-w-[32px]"
                >↻</button>

                <button
                    onClick={onNuevaReserva}
                    className="t-btn-primary"
                >
                    + Reserva
                </button>
            </div>

            {/* ── Tabla ─────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto t-card">
                {filtradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <div className="text-3xl opacity-10">○</div>
                        <div className="text-[13px]">No hay registros</div>
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda('')}
                                className="text-apple text-[12px] font-medium hover:underline"
                            >
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full border-collapse text-[13px]">
                        <thead className="sticky top-0 z-10">
                        <tr className="bg-fog/80 backdrop-blur-sm border-b border-gray-200/60">
                            {['Hab.', 'Tipo', 'Huésped', 'Documento',
                                'Entrada', 'Salida', 'Noches', 'Total', 'Estado']
                                .map((col, i) => (
                                    <th key={i} className="t-th">{col}</th>
                                ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/80">
                        {filtradas.map((r) => {
                            const cfg = ESTADO_CFG[r.estado] ?? ESTADO_CFG.CONFIRMADA

                            return (
                                <tr
                                    key={r.id}
                                    className="bg-white hover:bg-gray-50/80 transition-colors"
                                >
                                    <td className="t-td font-mono font-semibold text-ink">
                                        {r.habitacionNumero}
                                    </td>
                                    <td className="t-td text-gray-400 capitalize">
                                        {capitalizar(r.tipoHabitacion)}
                                    </td>
                                    <td className="t-td font-medium whitespace-nowrap text-ink">
                                        {r.nombreHuesped} {r.apellidoHuesped}
                                    </td>
                                    <td className="t-td font-mono text-gray-400">
                                        {r.nroDocumento}
                                    </td>
                                    <td className="t-td whitespace-nowrap text-gray-600">
                                        {formatFecha(r.fechaEntrada)}
                                    </td>
                                    <td className="t-td whitespace-nowrap text-gray-600">
                                        {formatFecha(r.fechaSalida)}
                                    </td>
                                    <td className="t-td font-mono text-center text-gray-600">
                                        {r.noches}
                                    </td>
                                    <td className="t-td font-mono whitespace-nowrap text-ink font-medium">
                                        {formatSoles(r.totalEstancia)}
                                    </td>
                                    <td className="t-td">
                      <span className={`t-badge ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="text-[11px] text-gray-400 text-right flex-shrink-0">
                {filtradas.length} de {reservas.length} registros
            </div>
        </div>
    )
})