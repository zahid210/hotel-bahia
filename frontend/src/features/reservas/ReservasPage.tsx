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
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
      <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-500
                       rounded-full animate-spin" />
            Cargando historial...
        </div>
    )

    if (error) return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ⚠ {error}
        </div>
    )

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">
            {/* ── Stats ─────────────────────────────────────────── */}
            <div className="grid grid-cols-4 border border-gray-100
                      rounded-lg overflow-hidden flex-shrink-0">
                {[
                    { label: 'Total',       value: stats.total,      color: 'text-gray-800'   },
                    { label: 'Activas',     value: stats.activas,    color: 'text-violet-600' },
                    { label: 'En hotel',    value: stats.checkin,    color: 'text-red-600'    },
                    { label: 'Canceladas',  value: stats.canceladas, color: 'text-gray-400'   },
                ].map((s, i) => (
                    <div key={i}
                         className={`p-3 bg-gray-50 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                            {s.label}
                        </div>
                        <div className={`text-xl font-mono font-medium ${s.color}`}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Controles ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {([
                        { id: 'TODAS',     label: 'Todas'     },
                        { id: 'ACTIVAS',   label: `Activas (${stats.activas})` },
                        { id: 'HISTORIAL', label: 'Historial' },
                    ] as { id: FiltroTab; label: string }[]).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFiltro(t.id)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                ${filtro === t.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por huésped, habitación, documento..."
                    aria-label="Buscar reservas"
                    className="flex-1 min-w-40 px-3 py-1.5 border border-gray-200 rounded-lg
                     text-xs bg-gray-50 focus:outline-none focus:border-gray-400
                     focus:bg-white placeholder:text-gray-300 transition-colors"
                />

                <button
                    onClick={() => {
                        cargar().then(() => onMensaje('Listado de reservas actualizado'))
                    }}
                    aria-label="Actualizar listado"
                    title="Actualizar listado"
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
     text-gray-500 hover:bg-gray-50 transition-colors"
                >↻</button>

                <button
                    onClick={onNuevaReserva}
                    className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium
                     rounded-lg hover:bg-gray-800 transition-colors"
                >
                    + Reserva
                </button>
            </div>

            {/* ── Tabla historial ───────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto border border-gray-100 rounded-lg">
                {filtradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <div className="text-3xl opacity-20">○</div>
                        <div className="text-sm">No hay registros</div>
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda('')}
                                className="text-xs underline"
                            >
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {['Hab.', 'Tipo', 'Huésped', 'Documento',
                                'Entrada', 'Salida', 'Noches', 'Total', 'Estado']
                                .map((col, i) => (
                                    <th key={i}
                                        className="px-3 py-2.5 text-left text-xs font-medium
                                 text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtradas.map((r, idx) => {
                            // Noches y total vienen calculados por el backend
                            // (incluyen horas reales y cargo por late checkout)
                            const cfg = ESTADO_CFG[r.estado] ?? ESTADO_CFG.CONFIRMADA

                            return (
                                <tr
                                    key={r.id}
                                    className={`border-b border-gray-50 transition-colors
                      ${idx % 2 === 0
                                        ? 'bg-white hover:bg-gray-50'
                                        : 'bg-gray-50/40 hover:bg-gray-100/60'}`}
                                >
                                    <td className="px-3 py-3">
                      <span className="font-mono font-semibold text-xs">
                        {r.habitacionNumero}
                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-400 capitalize">
                                        {capitalizar(r.tipoHabitacion)}
                                    </td>
                                    <td className="px-3 py-3 text-xs font-medium whitespace-nowrap">
                                        {r.nombreHuesped} {r.apellidoHuesped}
                                    </td>
                                    <td className="px-3 py-3 text-xs font-mono text-gray-400">
                                        {r.nroDocumento}
                                    </td>
                                    <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-600">
                                        {formatFecha(r.fechaEntrada)}
                                    </td>
                                    <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-600">
                                        {formatFecha(r.fechaSalida)}
                                    </td>
                                    <td className="px-3 py-3 text-xs font-mono text-center text-gray-600">
                                        {r.noches}
                                    </td>
                                    <td className="px-3 py-3 text-xs font-mono whitespace-nowrap text-gray-700">
                                        {formatSoles(r.totalEstancia)}
                                    </td>
                                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5
                                        rounded-full text-xs font-medium border ${cfg.cls}`}>
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

            {/* Contador */}
            <div className="text-xs text-gray-400 text-right flex-shrink-0">
                {filtradas.length} de {reservas.length} registros
            </div>
        </div>
    )
})