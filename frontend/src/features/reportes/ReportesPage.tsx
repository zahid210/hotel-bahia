import { esSesionExpirada } from '@/lib/esErrorSesion'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend, TooltipProps
} from 'recharts'
import {
    reporteService,
    ReporteCompleto,
    OcupacionDia,
} from '@/services/reporteService'

// ── Helpers ───────────────────────────────────────────────────
const S = (n: number) =>
    `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

const pct = (n: number) => `${Math.round(n)}%`

const labelDia = (fecha: string) => {
    const [y, m, d] = fecha.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short',
    })
}

// Color de barra según % de ocupación
const colorOcupacion = (pct: number) => {
    if (pct >= 80) return '#10b981'   // esmeralda
    if (pct >= 50) return '#3b82f6'   // azul
    if (pct >= 25) return '#f59e0b'   // ámbar
    return '#94a3b8'                  // gris (vacío)
}

// Colores para el pie chart de tipos
const COLORES_TIPO: Record<string, string> = {
    SUITE:    '#7c3aed',
    FAMILIAR: '#2563eb',
    DOBLE:    '#0891b2',
    SIMPLE:   '#16a34a',
}

type Periodo = 'hoy' | 'semana' | 'mes' | 'custom'

// ── Tarjeta de stat ───────────────────────────────────────────
function StatCard({
                      label, valor, sub, color = 'text-ink',
                  }: {
    label: string
    valor: string | number
    sub?: string
    color?: string
}) {
    return (
        <div className="t-card p-4">
            <div className="t-label mb-1">
                {label}
            </div>
            <div className={`text-[22px] font-semibold font-mono tracking-tight ${color}`}>
                {valor}
            </div>
            {sub && (
                <div className="text-[11px] text-gray-400 mt-1.5">{sub}</div>
            )}
        </div>
    )
}

interface RechartsV3TooltipProps extends TooltipProps<number, string> {
    payload?: Array<{ payload: OcupacionDia; value: number; name: string }>;
    label?: string | number;
}

function TooltipOcupacion(props: RechartsV3TooltipProps) {
    const { active, payload, label } = props;

    // Verificamos existencia sin usar 'any'
    if (!active || !payload || payload.length === 0) return null;

    const d = payload[0].payload;

    return (
        <div className="glass-strong p-3 shadow-modal text-xs">
            <div className="font-medium text-gray-700 mb-1">{label}</div>
            <div className="text-gray-500">
                {d.habitacionesOcupadas} / {d.totalHabitaciones} hab.
            </div>
            <div className="font-mono text-gray-700">{pct(d.porcentaje)} ocupado</div>
            {d.ingresoDia > 0 && (
                <div className="font-mono text-emerald-500 mt-0.5">
                    {S(d.ingresoDia)}
                </div>
            )}
        </div>
    )
}

// ── Componente principal ──────────────────────────────────────
export function ReportesPage() {
    const [reporte,   setReporte]   = useState<ReporteCompleto | null>(null)
    const [cargando,  setCargando]  = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [periodo,   setPeriodo]   = useState<Periodo>('mes')
    const [fechaIni,  setFechaIni]  = useState('')
    const [fechaFin,  setFechaFin]  = useState('')

    // Contador de peticiones: descarta resultados obsoletos si el usuario
    // cambia de período mientras una respuesta sigue en vuelo.
    const secuencia = useRef(0)

    const cargar = useCallback(async (p: Periodo, ini?: string, fin?: string) => {
        const id = ++secuencia.current
        setCargando(true)
        setError(null)
        try {
            let data: ReporteCompleto
            if (p === 'hoy')         data = await reporteService.hoy()
            else if (p === 'semana') data = await reporteService.semana()
            else if (p === 'mes')    data = await reporteService.mes()
            else {
                if (!ini || !fin) return
                data = await reporteService.porRango(ini, fin)
            }
            if (id !== secuencia.current) return
            setReporte(data)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            if (id !== secuencia.current) return
            setError(e instanceof Error ? e.message : 'Error al cargar reporte')
        } finally {
            if (id === secuencia.current) setCargando(false)
        }
    }, [])

    useEffect(() => {
        void cargar(periodo)
    }, [periodo, cargar])

    const handleCustom = () => {
        if (fechaIni && fechaFin) {
            void cargar('custom', fechaIni, fechaFin)
        }
    }

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5 h-full min-h-0 overflow-y-auto pb-6">

            {/* ── Selector de período ─────────────────────────────── */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                <div className="t-seg">
                    {([
                        { id: 'hoy',    label: 'Hoy'        },
                        { id: 'semana', label: 'Esta semana' },
                        { id: 'mes',    label: 'Este mes'    },
                        { id: 'custom', label: 'Personalizado'},
                    ] as { id: Periodo; label: string }[]).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setPeriodo(t.id)}
                            className={`t-seg-btn ${periodo === t.id ? 't-seg-btn--active' : ''}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Rango personalizado */}
                {periodo === 'custom' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="date" value={fechaIni}
                            onChange={e => setFechaIni(e.target.value)}
                            aria-label="Fecha inicio del reporte"
                            className="t-input w-auto py-1"
                        />
                        <span className="text-[12px] text-gray-400">→</span>
                        <input
                            type="date" value={fechaFin}
                            onChange={e => setFechaFin(e.target.value)}
                            aria-label="Fecha fin del reporte"
                            className="t-input w-auto py-1"
                        />
                        <button
                            onClick={handleCustom}
                            disabled={!fechaIni || !fechaFin}
                            className="t-btn-primary"
                        >
                            Aplicar
                        </button>
                    </div>
                )}

                <button
                    onClick={() => cargar(periodo, fechaIni, fechaFin)}
                    disabled={cargando}
                    aria-label="Actualizar reporte"
                    title="Actualizar reporte"
                    className="t-btn-ghost ml-auto min-w-[32px]"
                >
                    {cargando ? (
                        <span className="w-3 h-3 border-2 border-gray-200 border-t-apple
                             t-spin animate-spin inline-block" />
                    ) : '↻'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl
                        text-red-700 text-[13px]">⚠ {error}</div>
            )}

            {/* Skeleton mientras carga */}
            {cargando && !reporte && (
                <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            )}

            {reporte && (
                <>
                    {/* ── KPIs principales ─────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
                        <StatCard
                            label="Ingreso total"
                            valor={S(reporte.resumen.ingresoTotal)}
                            sub={
                                `${reporte.resumen.nochesVendidas} noches vendidas · ` +
                                `${S(reporte.resumen.ingresoConsumo)} en consumo`
                            }
                            color="text-emerald-600"
                        />
                        <StatCard
                            label="Ocupación promedio"
                            valor={pct(reporte.resumen.ocupacionPromedio)}
                            sub={`${reporte.totalHabitacionesHotel} hab. en total`}
                            color={
                                reporte.resumen.ocupacionPromedio >= 70
                                    ? 'text-emerald-600'
                                    : reporte.resumen.ocupacionPromedio >= 40
                                        ? 'text-blue-600'
                                        : 'text-amber-600'
                            }
                        />
                        <StatCard
                            label="Precio promedio/noche"
                            valor={S(reporte.resumen.ingresoPromedioPorNoche)}
                            sub={`${reporte.resumen.checkoutsRealizados} check-outs`}
                        />
                        <StatCard
                            label="Reservas activas"
                            valor={reporte.resumen.reservasActivas}
                            sub={`${reporte.resumen.cancelaciones} cancelaciones`}
                            color="text-violet-600"
                        />
                    </div>

                    {/* ── Gráfica de ocupación diaria ──────────────────── */}
                    {reporte.ocupacionPorDia.length > 0 && (
                        <div className="t-card p-5 flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm font-medium">Ocupación diaria</div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {reporte.periodoInicio} → {reporte.periodoFin}
                                    </div>
                                </div>
                                {/* Leyenda de colores */}
                                <div className="hidden md:flex items-center gap-3 text-xs
                                text-gray-400">
                                    {[
                                        { color: '#10b981', label: '≥80%' },
                                        { color: '#3b82f6', label: '50-79%' },
                                        { color: '#f59e0b', label: '25-49%' },
                                        { color: '#94a3b8', label: '<25%' },
                                    ].map(l => (
                                        <span key={l.label} className="flex items-center gap-1">
                      <span
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ background: l.color }}
                      />
                                            {l.label}
                    </span>
                                    ))}
                                </div>
                            </div>

                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart
                                    data={reporte.ocupacionPorDia}
                                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                                    barCategoryGap="20%"
                                >
                                    <XAxis
                                        dataKey="fecha"
                                        tickFormatter={labelDia}
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={reporte.ocupacionPorDia.length > 14 ? 1 : 0}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={v => `${v}%`}
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<TooltipOcupacion />} />
                                    <Bar dataKey="porcentaje" radius={[3, 3, 0, 0]}>
                                        {reporte.ocupacionPorDia.map((d, i) => (
                                            <Cell
                                                key={i}
                                                fill={colorOcupacion(d.porcentaje)}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ── Fila inferior: Pie chart + Top habitaciones ───── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">

                        {/* Pie chart: ingresos por tipo */}
                        {reporte.rendimientoPorTipo.length > 0 ? (
                            <div className="t-card p-5">
                                <div className="text-sm font-medium mb-4">
                                    Ingresos por tipo de habitación
                                </div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={reporte.rendimientoPorTipo}
                                            dataKey="ingresoTotal"
                                            nameKey="tipo"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={75}
                                            innerRadius={40}
                                            paddingAngle={3}
                                        >
                                            {reporte.rendimientoPorTipo.map((d, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={COLORES_TIPO[d.tipo] ?? '#9ca3af'}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            // Cambiamos 'any' por 'unknown' y validamos el tipo
                                            formatter={(value: unknown) => {
                                                const numValue = typeof value === 'number' ? value : Number(value || 0);
                                                return [S(numValue), 'Ingreso'];
                                            }}
                                        />
                                        <Legend
                                            formatter={(v) =>
                                                v.charAt(0) + v.slice(1).toLowerCase()
                                            }
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: 11 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Tabla debajo del pie */}
                                <div className="mt-3 space-y-1">
                                    {reporte.rendimientoPorTipo.map(t => (
                                        <div key={t.tipo}
                                             className="flex items-center justify-between
                                 text-xs py-1 border-b border-gray-50
                                 last:border-0">
                      <span className="flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 t-dot"
                            style={{
                                background: COLORES_TIPO[t.tipo] ?? '#9ca3af'
                            }}
                        />
                          {t.tipo.charAt(0) + t.tipo.slice(1).toLowerCase()}
                      </span>
                                            <span className="flex gap-4 text-gray-500">
                        <span>{t.reservas} res.</span>
                        <span>{t.nochesVendidas}N</span>
                        <span>{pct(t.ocupacionPromedio)} oc.</span>
                        <span className="font-mono font-medium text-gray-700">
                          {S(t.ingresoTotal)}
                        </span>
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="t-card p-5
                              flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <div className="text-3xl opacity-20 mb-2">○</div>
                                    <div className="text-sm">Sin ingresos en el período</div>
                                    <div className="text-xs mt-1">
                                        Realiza check-outs para ver datos aquí
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top habitaciones */}
                        <div className="t-card p-5">
                            <div className="text-sm font-medium mb-4">
                                Top habitaciones por ingreso
                            </div>

                            {reporte.topHabitaciones.length === 0 ? (
                                <div className="flex items-center justify-center h-48
                                text-gray-400 text-sm flex-col gap-2">
                                    <div className="text-3xl opacity-20">○</div>
                                    Sin datos en el período
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {reporte.topHabitaciones.map((h, idx) => {
                                        // Barra proporcional al máximo
                                        const maxIngreso =
                                            reporte.topHabitaciones[0].ingresoTotal
                                        const anchoPct = maxIngreso > 0
                                            ? (h.ingresoTotal / maxIngreso) * 100
                                            : 0

                                        return (
                                            <div key={h.numero}>
                                                <div className="flex items-center justify-between
                                        text-xs mb-1">
                          <span className="flex items-center gap-2">
                            <span className="text-gray-300 font-mono w-4">
                              {idx + 1}
                            </span>
                            <span className="font-mono font-medium">
                              Hab. {h.numero}
                            </span>
                            <span className="text-gray-400 capitalize">
                              {h.tipo.charAt(0) +
                                  h.tipo.slice(1).toLowerCase()}
                            </span>
                          </span>
                                                    <span className="flex gap-3 text-gray-500">
                            <span>{h.nochesVendidas}N</span>
                            <span className="font-mono font-medium
                                             text-gray-700">
                              {S(h.ingresoTotal)}
                            </span>
                          </span>
                                                </div>
                                                {/* Barra proporcional */}
                                                <div className="h-1 bg-gray-100 rounded-full">
                                                    <div
                                                        className="h-1 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${anchoPct}%`,
                                                            background:
                                                                COLORES_TIPO[h.tipo] ?? '#9ca3af',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Footer con metadatos del reporte ─────────────── */}
                    <div className="text-xs text-gray-300 text-right flex-shrink-0">
                        Período: {reporte.periodoInicio} → {reporte.periodoFin}
                        {' · '}
                        {reporte.resumen.totalReservas} reservas en el rango
                    </div>
                </>
            )}
        </div>
    )
}