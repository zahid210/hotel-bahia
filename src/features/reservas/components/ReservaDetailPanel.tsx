import { useState } from 'react'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { Reserva } from '@/services/reservaService'

// ── Helpers ──────────────────────────────────────────────────
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
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
}

const formatLocalTime = (t: string | null | undefined): string => {
    if (!t) return '—'
    const partes = t.split(':')
    return partes.length < 2 ? '—' : `${partes[0]}:${partes[1]}`
}

const formatSoles = (n: number | string) =>
    `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

const Campo = ({ label, valor, mono = false }: { label: string; valor: string | number; mono?: boolean }) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs ${mono ? 'font-mono' : 'font-medium'} text-gray-700`}>{valor}</span>
    </div>
)

const ESTADO_CFG = {
    PENDIENTE: { label: 'Pendiente', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    CONFIRMADA: { label: 'Confirmada', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    CHECKIN: { label: 'En hotel', cls: 'bg-red-50    text-red-700    border-red-200' },
    CHECKOUT: { label: 'Check-out', cls: 'bg-gray-50   text-gray-500   border-gray-200' },
    CANCELADA: { label: 'Cancelada', cls: 'bg-gray-50   text-gray-400   border-gray-200' },
} as const

interface Props {
    reserva: Reserva; procesando: string | null; onClose: () => void; hoy: string;
    onCheckIn: (id: string) => Promise<Reserva>; onCheckOut: (id: string) => Promise<Reserva>;
    onCancelar: (id: string) => Promise<Reserva>; onMensaje: (msg: string) => void
}

export function ReservaDetailPanel({
                                       reserva, procesando, hoy, onCheckIn, onCheckOut, onCancelar, onMensaje
                                   }: Props) {
    const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false)
    const [errorAccion, setErrorAccion] = useState<string | null>(null)

    const excedida = reserva.estado === 'CHECKIN' && !!reserva.fechaSalida && reserva.fechaSalida < hoy
    const cfg = ESTADO_CFG[reserva.estado] ?? ESTADO_CFG.CONFIRMADA
    const isBusy = procesando === reserva.id

    const cargoExtra = Number(reserva.cargoHorasExtra ?? 0)
    const totalBase = Number(reserva.noches ?? 1) * Number(reserva.precioNoche ?? 0)
    const totalFinal = Number(reserva.totalEstancia ?? totalBase)

    const handleAction = async (fn: () => Promise<any>, successMsg: string) => {
        setErrorAccion(null)
        try {
            await fn()
            onMensaje(successMsg)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setErrorAccion(e instanceof Error ? e.message : 'Error')
        }
    }

    const spinnerCls = "w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"

    return (
        /* IGUAL QUE EL FORM: Sin div envolvente con fondos o anchos fijos.
           Solo el contenido con espacio entre elementos. */
        <div className="space-y-4">

            {/* Cabecera rápida del estado */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Habitación {reserva.habitacionNumero}</h3>
                    <p className="text-xs text-gray-400 capitalize">{reserva.tipoHabitacion.toLowerCase()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${cfg.cls}`}>
                    {cfg.label}
                </span>
            </div>

            {/* Datos del Huésped */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Huésped</p>
                <p className="text-sm font-semibold text-gray-800">{reserva.nombreHuesped} {reserva.apellidoHuesped}</p>
                <p className="text-xs font-mono text-gray-500">{reserva.nroDocumento} • {reserva.numHuespedes} pers.</p>
            </div>

            {/* Detalles de Estancia */}
            <div className="space-y-1">
                <Campo label="Entrada" valor={`${formatFecha(reserva.fechaEntrada)} - ${formatLocalTime(reserva.horaEntradaAcordada)}`} />
                <Campo label="Salida" valor={`${formatFecha(reserva.fechaSalida)} - ${formatLocalTime(reserva.horaSalidaAcordada)}`} />
                <Campo label="Noches" valor={reserva.noches ?? 1} mono />
                {reserva.checkinReal && <Campo label="Check-in Real" valor={formatHora(reserva.checkinReal)} mono />}
            </div>

            {/* Resumen Económico */}
            <div className="p-3 border border-gray-100 rounded-md">
                <div className="flex justify-between text-xs mb-1 text-gray-500">
                    <span>Estancia base</span>
                    <span className="font-mono">{formatSoles(totalBase)}</span>
                </div>
                {cargoExtra > 0 && (
                    <div className="flex justify-between text-xs mb-1 text-amber-600">
                        <span>Cargos extra</span>
                        <span className="font-mono">+{formatSoles(cargoExtra)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-1">
                    <span className="text-xs font-bold text-gray-900">Total a pagar</span>
                    <span className="text-base font-bold text-gray-900 font-mono">{formatSoles(totalFinal)}</span>
                </div>
            </div>

            {reserva.notas && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 italic">
                    "{reserva.notas}"
                </div>
            )}

            {errorAccion && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">⚠ {errorAccion}</p>
            )}

            {/* Acciones - Igual que los botones de tu Form */}
            <div className="pt-2 space-y-2">
                {reserva.estado === 'CONFIRMADA' && (
                    <>
                        <button
                            onClick={() => handleAction(() => onCheckIn(reserva.id), 'Check-in exitoso')}
                            disabled={isBusy}
                            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {isBusy ? <span className={spinnerCls} /> : 'Realizar Check-in'}
                        </button>

                        {confirmandoCancelacion ? (
                            <div className="flex gap-2">
                                <button onClick={() => handleAction(() => onCancelar(reserva.id), 'Reserva cancelada')} className="flex-1 py-2 bg-red-600 text-white text-xs rounded-md">Confirmar</button>
                                <button onClick={() => setConfirmandoCancelacion(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs rounded-md">No</button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmandoCancelacion(true)} className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors">Cancelar reserva</button>
                        )}
                    </>
                )}

                {reserva.estado === 'CHECKIN' && (
                    <button
                        onClick={() => handleAction(() => onCheckOut(reserva.id), 'Check-out exitoso')}
                        disabled={isBusy}
                        className={`w-full py-2.5 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${excedida ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-gray-800'}`}
                    >
                        {isBusy ? <span className={spinnerCls} /> : excedida ? 'Check-out + Cargo Extra' : 'Realizar Check-out'}
                    </button>
                )}
            </div>
        </div>
    )
}