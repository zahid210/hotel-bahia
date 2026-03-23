import { useState } from 'react'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { Reserva } from '@/services/reservaService'

// ── Helpers de formato ────────────────────────────────────────
const formatFecha = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('es-PE', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    })
}

const formatHora = (isoDateTime: string | null | undefined): string => {
    if (!isoDateTime) return '—'
    try {
        const d = new Date(isoDateTime)
        return d.toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit'
        })
    } catch {
        return '—'
    }
}

const formatLocalTime = (t: string | null | undefined): string => {
    if (!t) return '—'
    const partes = t.split(':')
    if (partes.length < 2) return '—'
    return `${partes[0]}:${partes[1]}`
}

const formatSoles = (n: number | string) =>
    `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

// ── Config de estados ─────────────────────────────────────────
const ESTADO_CFG = {
    PENDIENTE: { label: 'Pendiente', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    CONFIRMADA: { label: 'Confirmada', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    CHECKIN: { label: 'En hotel', cls: 'bg-red-50    text-red-700    border-red-200' },
    CHECKOUT: { label: 'Check-out', cls: 'bg-gray-50   text-gray-500   border-gray-200' },
    CANCELADA: { label: 'Cancelada', cls: 'bg-gray-50   text-gray-400   border-gray-200' },
} as const

// ── Subcomponente: fila de datos ──────────────────────────────
const Campo = ({ label, valor, mono = false, destacado = false }: {
    label: string; valor: string | number; mono?: boolean; destacado?: boolean
}) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 mr-2">{label}</span>
        <span className={[
            'text-xs text-right',
            mono ? 'font-mono' : 'font-semibold',
            destacado ? 'text-gray-900' : 'text-gray-700',
        ].join(' ')}>
      {valor}
    </span>
    </div>
)

interface Props {
    reserva: Reserva; procesando: string | null; onClose: () => void; hoy: string;
    onCheckIn: (id: string) => Promise<Reserva>; onCheckOut: (id: string) => Promise<Reserva>;
    onCancelar: (id: string) => Promise<Reserva>; onMensaje: (msg: string) => void
}

export function ReservaDetailPanel({
                                       reserva, procesando, hoy, onClose, onCheckIn, onCheckOut, onCancelar, onMensaje
                                   }: Props) {
    const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false)
    const [errorAccion, setErrorAccion] = useState<string | null>(null)

    const excedida = reserva.estado === 'CHECKIN' && !!reserva.fechaSalida && reserva.fechaSalida < hoy
    const cfg = ESTADO_CFG[reserva.estado] ?? ESTADO_CFG.CONFIRMADA
    const isBusy = procesando === reserva.id

    const cargoExtra = Number(reserva.cargoHorasExtra ?? 0)
    const totalBase = Number(reserva.noches ?? 1) * Number(reserva.precioNoche ?? 0)
    const totalFinal = Number(reserva.totalEstancia ?? totalBase)
    const horasExtra = reserva.horasExtra ?? 0

    const handleCheckIn = async () => {
        setErrorAccion(null)
        try {
            await onCheckIn(reserva.id)
            setConfirmandoCancelacion(false)
            onMensaje(`Check-in realizado en habitación ${reserva.habitacionNumero}`)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setErrorAccion(e instanceof Error ? e.message : 'Error')
        }
    }

    const handleCheckOut = async () => {
        setErrorAccion(null)
        try {
            await onCheckOut(reserva.id)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setErrorAccion(e instanceof Error ? e.message : 'Error')
        }
    }

    const handleCancelar = async () => {
        setErrorAccion(null)
        try {
            await onCancelar(reserva.id)
            setConfirmandoCancelacion(false)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setErrorAccion(e instanceof Error ? e.message : 'Error')
        }
    }

    const spinnerCls = "w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
    const lbl = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5"

    return (
        <div className="w-full lg:w-72 flex-shrink-0 lg:border-l border-gray-100 bg-white flex flex-col h-full max-h-[85vh] lg:max-h-full overflow-hidden">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                    <div className="text-sm font-bold text-gray-900">Hab. {reserva.habitacionNumero}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 capitalize font-medium">
                        {reserva.tipoHabitacion.toLowerCase()}
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 lg:w-7 lg:h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">✕</button>
            </div>

            {/* ── Body scrollable ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">

                {/* Estado badge */}
                <div className="px-5 pt-4 pb-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.cls}`}>
            {cfg.label}
          </span>
                </div>

                {/* ── Huésped ─────────────────────────────────────────── */}
                <div className="px-5 py-3">
                    <label className={lbl}>Huésped</label>
                    <div className="text-sm font-bold text-gray-900">{reserva.nombreHuesped} {reserva.apellidoHuesped}</div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">{reserva.nroDocumento} • {reserva.numHuespedes} pers.</div>
                </div>

                <div className="h-px bg-gray-50 mx-5" />

                {/* ── Estancia ────────────────────────────────────────── */}
                <div className="px-5 py-3">
                    <label className={lbl}>Estancia acordada</label>
                    <Campo label="Entrada" valor={`${formatFecha(reserva.fechaEntrada)} · ${formatLocalTime(reserva.horaEntradaAcordada)}`} />
                    {excedida ? (
                        <div className="flex justify-between items-baseline py-1.5 border-b border-gray-50">
                            <span className="text-[11px] font-bold text-amber-600 uppercase">⚠ Salida límite</span>
                            <span className="text-xs font-bold text-amber-600 font-mono">
                {formatFecha(reserva.fechaSalida)} · {formatLocalTime(reserva.horaSalidaAcordada)}
              </span>
                        </div>
                    ) : (
                        <Campo label="Salida límite" valor={`${formatFecha(reserva.fechaSalida)} · ${formatLocalTime(reserva.horaSalidaAcordada)}`} />
                    )}
                    <Campo label="Noches" valor={Number(reserva.noches ?? 1)} mono />
                </div>

                {/* ── Timestamps Reales ────────────────────────────────── */}
                {(reserva.checkinReal || reserva.checkoutReal) && (
                    <div className="px-5 py-3 border-t border-gray-50">
                        <label className={lbl}>Registro Real</label>
                        {reserva.checkinReal && <Campo label="Check-in" valor={formatHora(reserva.checkinReal)} mono />}
                        {reserva.checkoutReal && <Campo label="Check-out" valor={formatHora(reserva.checkoutReal)} mono />}
                    </div>
                )}

                {/* ── Cargo Late Check-out ─────────────────────────────── */}
                {horasExtra > 0 && (
                    <div className="mx-5 my-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2">
                        <span className="text-orange-500 text-xs mt-0.5">⚠</span>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-tight mb-1">Días extra detectados</p>
                            <Campo label="Cant. noches" valor={`${horasExtra} noche(s)`} />
                            <div className="flex justify-between items-center pt-1 border-t border-orange-200 mt-1">
                                <span className="text-[10px] font-bold text-orange-800">CARGO</span>
                                <span className="text-xs font-bold text-orange-800">{formatSoles(cargoExtra)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Resumen Económico ───────────────────────────────── */}
                <div className="mx-5 my-3 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                    <Campo label="Subtotal Estancia" valor={formatSoles(totalBase)} mono />
                    {cargoExtra > 0 && <Campo label="Cargos Extra" valor={formatSoles(cargoExtra)} mono />}
                    <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-gray-200">
                        <span className="text-xs font-bold text-gray-900">Total</span>
                        <span className="text-base font-bold font-mono text-gray-900">{formatSoles(totalFinal)}</span>
                    </div>
                </div>

                {/* Notas */}
                {reserva.notas && (
                    <div className="px-5 py-3">
                        <label className={lbl}>Notas</label>
                        <div className="text-xs text-gray-600 bg-amber-50/50 border border-amber-100 rounded-md p-2.5 leading-relaxed">
                            {reserva.notas}
                        </div>
                    </div>
                )}

                {/* Error global */}
                {errorAccion && (
                    <div className="mx-5 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex gap-2">
                        <span className="flex-shrink-0">⚠</span>
                        <span>{errorAccion}</span>
                    </div>
                )}

                {/* ── Acciones ───────────────────────────────────────── */}
                <div className="px-5 pb-6 space-y-3">
                    {reserva.estado === 'CONFIRMADA' && (
                        <>
                            <button onClick={handleCheckIn} disabled={isBusy} className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {isBusy ? <div className={spinnerCls} /> : '✓ REALIZAR CHECK-IN'}
                            </button>
                            {confirmandoCancelacion ? (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-[11px] text-red-700 font-bold mb-2.5 text-center uppercase tracking-tight">¿Confirmar cancelación?</p>
                                    <div className="flex gap-2">
                                        <button onClick={handleCancelar} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-md">SÍ</button>
                                        <button onClick={() => setConfirmandoCancelacion(false)} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-md">NO</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmandoCancelacion(true)} className="w-full py-2 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-red-500 transition-colors">
                                    Cancelar Reserva
                                </button>
                            )}
                        </>
                    )}

                    {reserva.estado === 'CHECKIN' && (
                        <>
                            <div className={`p-3 border rounded-lg flex gap-2 ${excedida ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                                <span className={`text-xs ${excedida ? 'text-amber-500' : 'text-gray-400'}`}>i</span>
                                <p className={`text-[11px] leading-snug ${excedida ? 'text-amber-800 font-bold' : 'text-gray-500 font-medium'}`}>
                                    {excedida ? 'FECHA LÍMITE SUPERADA. Se aplicarán cargos adicionales.' : 'Check-out programado para hoy.'}
                                </p>
                            </div>
                            <button onClick={handleCheckOut} disabled={isBusy} className={`w-full py-3 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 ${excedida ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-gray-800'}`}>
                                {isBusy ? <div className={spinnerCls} /> : '→ FINALIZAR ESTANCIA'}
                            </button>
                        </>
                    )}

                    {(reserva.estado === 'CHECKOUT' || reserva.estado === 'CANCELADA') && (
                        <div className="w-full py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Estancia {reserva.estado.toLowerCase()}
                        </div>
                    )}
                </div>

                {/* Footer ID */}
                <div className="px-5 pb-6 text-center">
          <span className="text-[10px] text-gray-300 font-mono">
            ID: {reserva.id.split('-')[0].toUpperCase()}
          </span>
                </div>

            </div>
        </div>
    )
}