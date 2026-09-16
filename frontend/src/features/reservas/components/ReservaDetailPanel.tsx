import {useState} from 'react'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { formatFecha, formatSoles, capitalizar } from '@/lib/format'
import { ESTADO_CFG } from '@/lib/estadoReserva'
import {Reserva} from '@/services/reservaService'
import { ErrorBanner } from '@/components/ui'

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
                  border-b border-gray-100 last:border-0">
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
            onMensaje(`Entrada registrada en habitación ${reserva.habitacionNumero}`)
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

    const spinnerCls = "w-3.5 h-3.5 border-2 border-white/30 border-t-white t-spin animate-spin"

    return (
        <div className="w-full lg:w-72 flex-shrink-0 lg:border-l border-gray-100 glass-strong flex flex-col h-full max-h-[85vh] lg:max-h-full overflow-hidden">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="px-5 py-4 border-b border-gray-100
                  flex items-center justify-between flex-shrink-0">
                <div>
                    <div className="text-sm font-semibold">
                        Hab. {reserva.habitacionNumero}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 capitalize">
                        {capitalizar(reserva.tipoHabitacion)}
                    </div>
                </div>
                {/* Botón cerrar — más grande en móvil para facilitar el toque */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar panel"
                    className="w-8 h-8 lg:w-7 lg:h-7 flex items-center justify-center
               t-dot border border-gray-200 text-gray-400 hover:text-gray-700
               hover:bg-gray-50 text-[12px] transition-colors"
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

                <div className="h-px bg-gray-200/50 mx-5"/>

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

                <div className="h-px bg-gray-200/50 mx-5"/>

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
                                    label="Entrada efectiva"
                                    valor={formatHora(reserva.checkinReal)}
                                    mono
                                />
                            )}
                            {reserva.checkoutReal && (
                                <Campo
                                    label="Salida efectiva"
                                    valor={formatHora(reserva.checkoutReal)}
                                    mono
                                />
                            )}
                        </div>
                        <div className="h-px bg-gray-200/50 mx-5"/>
                    </>
                )}

                {/* ── Cargo late check-out (Nivel 2 modificado) ─────────────
                    Aparece solo si hubo días extra (pasó la medianoche)        */}
                {horasExtra > 0 && (
                    <>
                        <div className="mx-5 my-3 p-3.5 bg-orange-50/70 border
                    border-orange-200/70 rounded-2xl">
                            <div className="text-xs font-semibold text-orange-700 mb-2">
                                ⚠ Día(s) adicional(es) — superó medianoche
                            </div>
                            <Campo
                                label="Fecha salida acordada"
                                valor={formatFecha(reserva.fechaSalida)}
                            />
                            <Campo
                                label="Salida real"
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
                        <div className="h-px bg-gray-200/50 mx-5"/>
                    </>
                )}

                {/* ── Resumen económico ────────────────────────────────────── */}
                <div className="mx-5 my-3 p-3.5 bg-fog/70 rounded-2xl border border-gray-200/60">
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
                        {Number(reserva.totalConsumo ?? 0) > 0 && (
                            <Campo
                                label="Consumo (habitación)"
                                valor={formatSoles(Number(reserva.totalConsumo))}
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
                    <ErrorBanner variante="sm" className="mx-5 mb-3">
                        {errorAccion}
                    </ErrorBanner>
                )}

                {/* ── Acciones por estado ──────────────────────────────── */}
                <div className="px-5 pb-6 space-y-2">

                    {/* CONFIRMADA → Check-in */}
                    {reserva.estado === 'CONFIRMADA' && (
                        <>
                            <button
                                onClick={handleCheckIn}
                                disabled={isBusy}
                                className="t-btn-primary w-full py-2.5"
                            >
                                {isBusy
                                    ? <><span className={spinnerCls}/> Procesando...</>
                                    : '✓ Realizar Entrada'}
                            </button>

                            {confirmandoCancelacion ? (
                                <div className="p-3 bg-red-50/70 border border-red-200/70 rounded-2xl">
                                    <p className="text-xs text-red-700 mb-2.5 leading-relaxed">
                                        ¿Confirmar cancelación? No se puede deshacer.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancelar}
                                            disabled={isBusy}
                                            className="flex-1 py-1.5 bg-red-500 text-white text-xs
                                 font-medium rounded-full hover:bg-red-600
                                 disabled:opacity-50 transition-colors"
                                        >
                                            Sí, cancelar
                                        </button>
                                        <button
                                            onClick={() => setConfirmandoCancelacion(false)}
                                            className="flex-1 py-1.5 border border-gray-200
                                 text-gray-600 text-xs font-medium
                                 rounded-full hover:bg-gray-50"
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
                             text-xs font-medium rounded-full hover:bg-gray-50
                             hover:text-red-500 hover:border-red-200 transition-colors"
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
                                    Al registrar la salida se calculará automáticamente el cargo
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
                                    'w-full py-2.5 text-sm font-medium rounded-full',
                                    'disabled:opacity-50 transition-all duration-150',
                                    'flex items-center justify-center gap-2',
                                    'active:scale-[0.98]',
                                    excedida
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 't-btn-primary py-2.5',
                                ].join(' ')}
                            >
                                {isBusy
                                    ? <><span className={spinnerCls} /> Procesando...</>
                                    : excedida
                                        ? '→ Salida + aplicar cargo extra'
                                        : '→ Realizar Salida'}
                            </button>
                        </>
                    )}

                    {/* CHECKOUT → Solo lectura con resumen */}
                    {reserva.estado === 'CHECKOUT' && (
                        <div className="w-full py-2.5 text-center text-[11px] text-gray-400
                            bg-fog/60 rounded-full border border-gray-200/60">
                            Estancia completada ✓
                        </div>
                    )}

                    {/* CANCELADA */}
                    {reserva.estado === 'CANCELADA' && (
                        <div className="w-full py-2.5 text-center text-[11px] text-gray-400
                            bg-fog/60 rounded-full border border-gray-200/60">
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