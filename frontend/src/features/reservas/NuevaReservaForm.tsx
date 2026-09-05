import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { esSesionExpirada } from '@/lib/esErrorSesion'
import { reservaService, NuevaReservaForm as FormData } from '@/services/reservaService'
import { habitacionService, Habitacion } from '@/services/habitacionService'

// ── Opciones de horas en formato HH:00 ───────────────────────
// Genera ["00:00", "01:00", ... "23:00"]
const HORAS = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00`
)

interface Props { onSuccess: () => void }

export function NuevaReservaForm({ onSuccess }: Props) {
    const [disponibles, setDisponibles] = useState<Habitacion[]>([])
    const [enviando,    setEnviando]    = useState(false)
    const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

    const {
        register, handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            numHuespedes:        1,
            tipoDocumento:       'DNI',
            // Defaults del hotel — el recepcionista puede cambiarlos
            horaEntradaAcordada: '15:00',
            horaSalidaAcordada:  '12:00',
        },
    })

    // ── Carga habitaciones disponibles ───────────────────────
    useEffect(() => {
        let activo = true
        habitacionService.listarTodas()
            .then(todas => {
                if (!activo) return
                setDisponibles(
                    todas.filter(h => h.estado === 'LIBRE' || h.estado === 'LIMPIEZA')
                )
            })
            .catch(e => {
                if (!activo || esSesionExpirada(e)) return
                setErrorGlobal(e instanceof Error ? e.message : 'Error de conexión')
            })
        return () => { activo = false }
    }, [])

    // ── Submit ────────────────────────────────────────────────
    const onSubmit = async (data: FormData) => {
        setEnviando(true)
        setErrorGlobal(null)
        try {
            await reservaService.crear({
                ...data,
                habitacionId: Number(data.habitacionId),
                numHuespedes: Number(data.numHuespedes),
                // Enviar solo la parte HH:mm — el backend parsea como LocalTime
                horaEntradaAcordada: data.horaEntradaAcordada || '15:00',
                horaSalidaAcordada:  data.horaSalidaAcordada  || '12:00',
            })
            onSuccess()
        } catch (e: unknown) { // <-- CAMBIA 'any' por 'unknown'
            setErrorGlobal(e instanceof Error ? e.message : 'Error desconocido')
        } finally {
            setEnviando(false)
        }
    }

    // ── Estilos reutilizables ─────────────────────────────────
    const campo = `w-full px-3 py-2 border border-gray-200 rounded-md text-sm
    bg-gray-50 focus:outline-none focus:border-gray-900 focus:bg-white
    transition-colors placeholder:text-gray-300`
    const lbl   = `block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1`
    const err   = `text-xs text-red-500 mt-1`

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Error global */}
            {errorGlobal && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md
                        text-red-700 text-sm flex gap-2">
                    <span className="flex-shrink-0">⚠</span>
                    <span>{errorGlobal}</span>
                </div>
            )}

            {/* ── Habitación ─────────────────────────────────────── */}
            <div>
                <label htmlFor="habitacionId" className={lbl}>Habitación *</label>
                <select
                    id="habitacionId"
                    {...register('habitacionId', { required: 'Selecciona una habitación' })}
                    className={campo}
                >
                    <option value="">Seleccionar...</option>

                    {disponibles.filter(h => h.estado === 'LIBRE').length > 0 && (
                        <optgroup label="─ Disponibles">
                            {disponibles.filter(h => h.estado === 'LIBRE').map(h => (
                                <option key={h.id} value={h.id}>
                                    Hab. {h.numero} — {h.tipo} — S/{h.precioNoche}/noche
                                </option>
                            ))}
                        </optgroup>
                    )}

                    {disponibles.filter(h => h.estado === 'LIMPIEZA').length > 0 && (
                        <optgroup label="─ En limpieza (entrada a partir de mañana)">
                            {disponibles.filter(h => h.estado === 'LIMPIEZA').map(h => (
                                <option key={h.id} value={h.id}>
                                    Hab. {h.numero} — {h.tipo} — S/{h.precioNoche}/noche
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>
                {errors.habitacionId && (
                    <p className={err}>{errors.habitacionId.message}</p>
                )}
            </div>

            {/* ── Nombre + Apellido ──────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="nombreHuesped" className={lbl}>Nombre *</label>
                    <input
                        id="nombreHuesped"
                        {...register('nombreHuesped', { required: 'Obligatorio' })}
                        className={campo} placeholder="María"
                    />
                    {errors.nombreHuesped && (
                        <p className={err}>{errors.nombreHuesped.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="apellidoHuesped" className={lbl}>Apellido *</label>
                    <input
                        id="apellidoHuesped"
                        {...register('apellidoHuesped', { required: 'Obligatorio' })}
                        className={campo} placeholder="García"
                    />
                    {errors.apellidoHuesped && (
                        <p className={err}>{errors.apellidoHuesped.message}</p>
                    )}
                </div>
            </div>

            {/* ── Documento ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="tipoDocumento" className={lbl}>Tipo doc.</label>
                    <select id="tipoDocumento" {...register('tipoDocumento')} className={campo}>
                        <option value="DNI">DNI</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="CE">CE</option>
                    </select>
                    {errors.tipoDocumento && (
                        <p className={err}>{errors.tipoDocumento.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="nroDocumento" className={lbl}>N° Documento *</label>
                    <input
                        id="nroDocumento"
                        {...register('nroDocumento', { required: 'Obligatorio' })}
                        className={campo} placeholder="12345678"
                    />
                    {errors.nroDocumento && (
                        <p className={err}>{errors.nroDocumento.message}</p>
                    )}
                </div>
            </div>

            {/* ── Fecha entrada + hora de entrada ────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="fechaEntrada" className={lbl}>Fecha entrada *</label>
                    <input
                        id="fechaEntrada"
                        type="date"
                        {...register('fechaEntrada', { required: 'Obligatorio' })}
                        className={campo}
                    />
                    {errors.fechaEntrada && (
                        <p className={err}>{errors.fechaEntrada.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="horaEntradaAcordada" className={lbl}>
                        Hora entrada
                    </label>
                    <select id="horaEntradaAcordada" {...register('horaEntradaAcordada')} className={campo}>
                        {HORAS.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Fecha salida + hora límite ──────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="fechaSalida" className={lbl}>Fecha salida *</label>
                    <input
                        id="fechaSalida"
                        type="date"
                        {...register('fechaSalida', { required: 'Obligatorio' })}
                        className={campo}
                    />
                    {errors.fechaSalida && (
                        <p className={err}>{errors.fechaSalida.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="horaSalidaAcordada" className={lbl}>
                        Hora salida límite
                    </label>
                    <select id="horaSalidaAcordada" {...register('horaSalidaAcordada')} className={campo}>
                        {HORAS.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Aviso de política de medianoche ────────────────── */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border
                      border-amber-200 rounded-md">
                <span className="text-amber-500 flex-shrink-0 mt-0.5 text-xs">⚠</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Política del hotel:</strong> si el huésped permanece después
                    de las 00:00 de su fecha de salida, se cobra automáticamente
                    1 noche adicional completa.
                </p>
            </div>

            {/* ── N° huéspedes ───────────────────────────────────── */}
            <div className="w-1/2">
                <label htmlFor="numHuespedes" className={lbl}>N° huéspedes</label>
                <select id="numHuespedes" {...register('numHuespedes')} className={campo}>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </div>

            {/* ── Notas ──────────────────────────────────────────── */}
            <div>
                <label htmlFor="notas" className={lbl}>Notas</label>
                <textarea
                    id="notas"
                    {...register('notas')}
                    rows={2}
                    className={campo}
                    placeholder="Peticiones especiales, cama extra, etc."
                />
            </div>

            {/* ── Submit ─────────────────────────────────────────── */}
            <button
                type="submit"
                disabled={enviando}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium
                   rounded-md hover:bg-gray-800 disabled:opacity-50
                   transition-colors"
            >
                {enviando
                    ? <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30
                               border-t-white rounded-full animate-spin" />
              Confirmando...
            </span>
                    : 'Confirmar reserva'}
            </button>
        </form>
    )
}