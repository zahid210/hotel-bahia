import {useState} from 'react'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { formatFecha } from '@/lib/format'
import {Reserva} from '@/services/reservaService'

// ── Helpers de formato ────────────────────────────────────────

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
    `S/ ${Number(n).toLocaleString('es-PE', {minimumFractionDigits: 2})}`

// ── Config de estados ─────────────────────────────────────────
const ESTADO_CFG = {
    PENDIENTE: {label: 'Pendiente', cls: 'bg-purple-50 text-purple-700 border-purple-200'},
    CONFIRMADA: {label: 'Confirmada', cls: 'bg-violet-50 text-violet-700 border-violet-200'},
    CHECKIN: {label: 'En hotel', cls: 'bg-red-50    text-red-700    border-red-200'},
    CHECKOUT: {label: 'Check-out', cls: 'bg-gray-50   text-gray-500   border-gray-200'},
    CANCELADA: {label: 'Cancelada', cls: 'bg-gray-50   text-gray-400   border-gray-200'},
} as const

// ── Subcomponente: fila de datos ──────────────────────────────
const Campo = ({
                   label, valor, mono = false, destacado = false
               }: {
    label: string
    valor: string | number
    mono?: boolean
    destacado?: boolean
}) => (
    <div className="flex justify-between items-baseline py-1.5
                  border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 flex-shrink-0 mr-2">{label}</span>
        <span className={[
            'text-xs text-right',
            mono ? 'font-mono' : 'font-medium',
            destacado ? 'text-gray-900 font-semibold' : 'text-gray-700',
        ].join(' ')}>
      {valor}
    </span>
    </div>
)

// ── Props ─────────────────────────────────────────────────────
interface Props {
    reserva: Reserva
    procesando: string | null
    onClose: () => void
    hoy: string;
    onCheckIn: (id: string) => Promise<Reserva>
    onCheckOut: (id: string) => Promise<Reserva>
    onCancelar: (id: string) => Promise<Reserva>
    onMensaje: (msg: string) => void
}

// ── Componente ────────────────────────────────────────────────
export function ReservaDetailPanel({
                                       reserva, procesando, hoy, onClose, onCheckIn, onCheckOut, onCancelar, onMensaje
                                   }: Props) {
    const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false)
    const [errorAccion, setErrorAccion] = useState<string | null>(null)

    const excedida =
        reserva.estado === 'CHECKIN' &&
        !!reserva.fechaSalida &&
        reserva.fechaSalida < hoy

    const cfg = ESTADO_CFG[reserva.estado] ?? ESTADO_CFG.CONFIRMADA
    const isBusy = procesando === reserva.id

    // Blindaje en los cálculos económicos — reemplaza las líneas de totales:
    const cargoExtra = Number(reserva.cargoHorasExtra ?? 0)
    const totalBase = Number(reserva.noches ?? 1) * Number(reserva.precioNoche ?? 0)
    const totalFinal = Number(reserva.totalEstancia ?? totalBase)
    const horasExtra = reserva.horasExtra ?? 0

    // ── Handlers ──────────────────────────────────────────────
    const handleCheckIn = async () => {
        setErrorAccion(null)
        try {
            await onCheckIn(reserva.id)
            setConfirmandoCancelacion(false)
            onMensaje(`Check-in realizado en habitación ${reserva.habitacionNumero}`)
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return   // PrivateRoute toma el control
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

    return (
        <div className="w-full lg:w-72 flex-shrink-0 lg:border-l border-gray-100 bg-white flex flex-col h-full max-h-[85vh] lg:max-h-full overflow-hidden">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="px-5 py-4 border-b border-gray-100
                  flex items-center justify-between flex-shrink-0">
                <div>
                    <div className="text-sm font-semibold">
                        Hab. {reserva.habitacionNumero}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 capitalize">
                        {reserva.tipoHabitacion.charAt(0) +
                            reserva.tipoHabitacion.slice(1).toLowerCase()}
                    </div>
                </div>
                {/* Botón cerrar — más grande en móvil para facilitar el toque */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar panel"
                    className="w-8 h-8 lg:w-7 lg:h-7 flex items-center justify-center
               rounded-md border border-gray-200 text-gray-400
               hover:text-gray-700 hover:bg-gray-50 text-sm
               transition-colors"
                >✕</button>
            </div>

            {/* ── Body scrollable ──────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">

                {/* Estado badge */}
                <div className="px-5 pt-4 pb-2">
                    <span className={`inline-flex items-center px-2.5 py-1
                            rounded-full text-xs font-medium border ${cfg.cls}`}>
                    {cfg.label}
                    </span>
                </div>

                {/* ── Huésped ─────────────────────────────────────────── */}
                <div className="px-5 py-3">
                    <div className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-2">Huésped
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                        {reserva.nombreHuesped} {reserva.apellidoHuesped}
                    </div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">
                        {reserva.nroDocumento}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {reserva.numHuespedes} huésped(es)
                    </div>
                </div>

                <div className="h-px bg-gray-100 mx-5"/>

                {/* ── Fechas acordadas ─────────────────────────────────── */}
                <div className="px-5 py-3">
                    <div className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-2">Estancia acordada
                    </div>
                    <Campo label="Entrada"
                           valor={`${formatFecha(reserva.fechaEntrada)} · ${formatLocalTime(reserva.horaEntradaAcordada)}`}/>
                    {/* DESPUÉS — resaltado en ámbar si está excedida: */}
                    {excedida ? (
                        <div className="flex justify-between items-baseline py-1.5
                  border-b border-gray-50">
                <span className="text-xs font-medium text-amber-600">
                    ⚠ Salida límite
                </span>
                            <span className="text-xs font-semibold text-amber-600 font-mono">
      {formatFecha(reserva.fechaSalida)} · {formatLocalTime(reserva.horaSalidaAcordada)}
    </span>
                        </div>
                    ) : (
                        <Campo
                            label="Salida límite"
                            valor={`${formatFecha(reserva.fechaSalida)} · ${formatLocalTime(reserva.horaSalidaAcordada)}`}
                        />
                    )}
                    <Campo label="Noches" valor={Number(reserva.noches ?? 1)} mono />
                </div>

                <div className="h-px bg-gray-100 mx-5"/>

                {/* ── Timestamps reales (Nivel 1) ───────────────────────
            Solo se muestran si ya ocurrieron                    */}
                {(reserva.checkinReal || reserva.checkoutReal) && (
                    <>
                        <div className="px-5 py-3">
                            <div className="text-xs font-medium text-gray-400 uppercase
                              tracking-wide mb-2">Registro real
                            </div>
                            {reserva.checkinReal && (
                                <Campo
                                    label="Check-in efectivo"
                                    valor={formatHora(reserva.checkinReal)}
                                    mono
                                />
                            )}
                            {reserva.checkoutReal && (
                                <Campo
                                    label="Check-out efectivo"
                                    valor={formatHora(reserva.checkoutReal)}
                                    mono
                                />
                            )}
                        </div>
                        <div className="h-px bg-gray-100 mx-5"/>
                    </>
                )}

                {/* ── Cargo late check-out (Nivel 2 modificado) ─────────────
                    Aparece solo si hubo días extra (pasó la medianoche)        */}
                {horasExtra > 0 && (
                    <>
                        <div className="mx-5 my-3 p-3 bg-orange-50 border
                    border-orange-200 rounded-lg">
                            <div className="text-xs font-semibold text-orange-700 mb-2">
                                ⚠ Día(s) adicional(es) — superó medianoche
                            </div>
                            <Campo
                                label="Fecha salida acordada"
                                valor={formatFecha(reserva.fechaSalida)}
                            />
                            <Campo
                                label="Checkout real"
                                valor={`${formatHora(reserva.checkoutReal)}`}
                                mono
                            />
                            <Campo
                                label={`Día(s) extra`}
                                valor={`${horasExtra} noche${horasExtra > 1 ? 's' : ''}`}
                                mono
                            />
                            <div className="flex justify-between items-baseline pt-1.5
                                mt-1.5 border-t border-orange-200">
                                <span className="text-xs font-medium text-orange-700">
                                    Cargo adicional
                                </span>
                                <span className="text-sm font-bold text-orange-700 font-mono">
                                    {formatSoles(cargoExtra)}
                                </span>
                            </div>
                        </div>
                        <div className="h-px bg-gray-100 mx-5"/>
                    </>
                )}

                {/* ── Resumen económico ────────────────────────────────────── */}
                <div className="mx-5 my-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="space-y-1">
                        <Campo
                            label={`${reserva.noches ?? 1} noche${Number(reserva.noches) > 1 ? 's' : ''} × ${formatSoles(Number(reserva.precioNoche))}`}
                            valor={formatSoles(Number(reserva.noches ?? 1) * Number(reserva.precioNoche ?? 0))}
                            mono
                        />
                        {cargoExtra > 0 && (
                            <Campo
                                label={`Días extra post-medianoche (${horasExtra})`}
                                valor={formatSoles(cargoExtra)}
                                mono
                            />
                        )}
                    </div>
                    <div className="flex justify-between items-baseline pt-2 mt-1.5
                  border-t border-gray-200">
                        <span className="text-xs font-semibold text-gray-700">Total</span>
                        <span className="text-base font-bold font-mono text-gray-900">
      {formatSoles(totalFinal)}
    </span>
                    </div>
                </div>

                {/* Notas */}
                {reserva.notas && (
                    <div className="px-5 pb-3">
                        <div className="text-xs font-medium text-gray-400 uppercase
                            tracking-wide mb-1">Notas
                        </div>
                        <div className="text-xs text-gray-600 bg-amber-50 border
                            border-amber-100 rounded-md p-2.5 leading-relaxed">
                            {reserva.notas}
                        </div>
                    </div>
                )}

                {/* Error de acción */}
                {errorAccion && (
                    <div className="mx-5 mb-3 p-2.5 bg-red-50 border border-red-200
                          rounded-md text-xs text-red-700">
                        ⚠ {errorAccion}
                    </div>
                )}

                {/* ── Acciones por estado ──────────────────────────────── */}
                <div className="px-5 pb-6 space-y-2">

                    {/* CONFIRMADA → Check-in */}
                    {reserva.estado === 'CONFIRMADA' && (
                        <>
                            <button
                                onClick={handleCheckIn}
                                disabled={isBusy}
                                className="w-full py-2.5 bg-gray-900 text-white text-sm
                           font-medium rounded-lg hover:bg-gray-800
                           disabled:opacity-50 transition-colors
                           flex items-center justify-center gap-2"
                            >
                                {isBusy
                                    ? <><span className={spinnerCls}/> Procesando...</>
                                    : '✓ Realizar Check-in'}
                            </button>

                            {confirmandoCancelacion ? (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs text-red-700 mb-2.5 leading-relaxed">
                                        ¿Confirmar cancelación? No se puede deshacer.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancelar}
                                            disabled={isBusy}
                                            className="flex-1 py-1.5 bg-red-600 text-white text-xs
                                 font-medium rounded-md hover:bg-red-700
                                 disabled:opacity-50"
                                        >
                                            Sí, cancelar
                                        </button>
                                        <button
                                            onClick={() => setConfirmandoCancelacion(false)}
                                            className="flex-1 py-1.5 border border-gray-200
                                 text-gray-600 text-xs font-medium
                                 rounded-md hover:bg-gray-50"
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setErrorAccion(null)
                                        setConfirmandoCancelacion(true)
                                    }}
                                    className="w-full py-2 border border-gray-200 text-gray-500
                             text-xs font-medium rounded-lg hover:bg-gray-50
                             hover:text-red-500 hover:border-red-200
                             transition-colors"
                                >
                                    Cancelar reserva
                                </button>
                            )}
                        </>
                    )}

                    {/* CHECKIN → Check-out */}
                    {reserva.estado === 'CHECKIN' && (
                        <>
                            {excedida ? (
                                // ── Aviso urgente cuando ya superó la fecha ──────────
                                <div className="p-3 bg-amber-50 border border-amber-300
                      rounded-lg text-xs text-amber-800 leading-relaxed">
                                    <div className="font-semibold mb-1">⚠ Fecha de salida superada</div>
                                    La fecha de salida era el{' '}
                                    <strong>{formatFecha(reserva.fechaSalida)}</strong>.
                                    Al hacer check-out se calculará automáticamente el cargo
                                    por noche(s) adicional(es).
                                </div>
                            ) : (
                                // ── Aviso preventivo normal ───────────────────────────
                                <div className="text-xs text-amber-600 text-center bg-amber-50
                      rounded-md py-1.5 px-2 border border-amber-100
                      leading-relaxed">
                                    Si permanece después de la medianoche del{' '}
                                    <strong>{formatFecha(reserva.fechaSalida)}</strong>
                                    {' '}(madrugada del día siguiente) se cobrará 1 noche adicional
                                </div>
                            )}

                            <button
                                onClick={handleCheckOut}
                                disabled={isBusy}
                                className={[
                                    'w-full py-2.5 text-sm font-medium rounded-lg',
                                    'disabled:opacity-50 transition-colors',
                                    'flex items-center justify-center gap-2',
                                    // Botón ámbar si está excedida para reforzar urgencia
                                    excedida
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-gray-900 text-white hover:bg-gray-800',
                                ].join(' ')}
                            >
                                {isBusy
                                    ? <><span className={spinnerCls} /> Procesando...</>
                                    : excedida
                                        ? '→ Checkout + aplicar cargo extra'
                                        : '→ Realizar Check-out'}
                            </button>
                        </>
                    )}

                    {/* CHECKOUT → Solo lectura con resumen */}
                    {reserva.estado === 'CHECKOUT' && (
                        <div className="w-full py-2.5 text-center text-xs text-gray-400
                            bg-gray-50 rounded-lg border border-gray-100">
                            Estancia completada ✓
                        </div>
                    )}

                    {/* CANCELADA */}
                    {reserva.estado === 'CANCELADA' && (
                        <div className="w-full py-2.5 text-center text-xs text-gray-400
                            bg-gray-50 rounded-lg border border-gray-100">
                            Reserva cancelada
                        </div>
                    )}
                </div>

                {/* ID de referencia */}
                <div className="px-5 pb-5">
                    <div className="text-xs text-gray-300 font-mono">
                        #{reserva.id.split('-')[0].toUpperCase()}
                    </div>
                </div>

            </div>
        </div>
    )
}