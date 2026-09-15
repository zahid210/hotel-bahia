import { esSesionExpirada } from '@/lib/esErrorSesion'
import { formatSoles } from '@/lib/format'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Modal } from '@/components/Modal'
import { pedidoService, Pedido, LABEL_ESTADO, ItemPedido } from '@/services/pedidoService'
import { menuService, MenuItem, LABEL_CATEGORIA, CATEGORIAS } from '@/services/menuService'
import { reservaService, Reserva } from '@/services/reservaService'
import { capitalizar } from '@/lib/format'

type Filtro = 'TODOS' | 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO'

const CONST_ESTADO = {
    PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    ENTREGADO: { label: 'Entregado', cls: 'bg-green-50 text-green-700 border-green-200' },
    CANCELADO: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
} as const

const horaCorta = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props {
    onMensaje: (texto: string) => void
}

export function PedidosPage({ onMensaje }: Props) {
    const [pedidos,   setPedidos]   = useState<Pedido[]>([])
    const [cargando,  setCargando]  = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [filtro,    setFiltro]    = useState<Filtro>('TODOS')
    const [busqueda,  setBusqueda]  = useState('')
    const [accionId,  setAccionId]  = useState<string | null>(null)

    const [modalAbierto, setModalAbierto] = useState(false)
    const [reservas,     setReservas]     = useState<Reserva[]>([])
    const [menu,         setMenu]         = useState<MenuItem[]>([])
    const [reservaSel,   setReservaSel]   = useState<string>('')
    const [cantidades,   setCantidades]   = useState<Record<number, number>>({})
    const [notas,        setNotas]        = useState('')
    const [guardando,    setGuardando]    = useState(false)
    const [errorForm,    setErrorForm]    = useState<string | null>(null)
    const [catSel,       setCatSel]       = useState<string>('TODAS')

    const cargar = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)
            setPedidos(await pedidoService.listar())
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { void cargar() }, [cargar])

    const stats = useMemo(() => ({
        todos:     pedidos.length,
        pendiente: pedidos.filter(p => p.estado === 'PENDIENTE').length,
        entregado: pedidos.filter(p => p.estado === 'ENTREGADO').length,
        cancelado: pedidos.filter(p => p.estado === 'CANCELADO').length,
    }), [pedidos])

    const filtrados = useMemo(() => {
        let lista = [...pedidos]
        if (filtro !== 'TODOS') lista = lista.filter(p => p.estado === filtro)
        const q = busqueda.toLowerCase().trim()
        if (q) lista = lista.filter(p =>
            p.habitacionNumero.includes(q) ||
            p.nombreHuesped.toLowerCase().includes(q)
        )
        return lista
    }, [pedidos, filtro, busqueda])

    const abrirNuevo = async () => {
        setModalAbierto(true)
        setReservaSel('')
        setCantidades({})
        setNotas('')
        setErrorForm(null)
        setCatSel('TODAS')
        try {
            const [todas, productos] = await Promise.all([
                reservaService.listarTodas(),
                menuService.listar(true),
            ])
            setReservas(todas.filter(r => r.estado === 'CHECKIN'))
            setMenu(productos)
        } catch (e: unknown) {
            if (!esSesionExpirada(e)) {
                setErrorForm(e instanceof Error ? e.message : 'Error al cargar datos')
            }
        }
    }

    const agregar = (menuItemId: number, delta: number) => {
        setCantidades(prev => {
            const actual = prev[menuItemId] ?? 0
            const nuevo = actual + delta
            if (nuevo <= 0) {
                const copia = { ...prev }
                delete copia[menuItemId]
                return copia
            }
            return { ...prev, [menuItemId]: nuevo }
        })
    }

    const totalEstimado = useMemo(() => {
        return menu.reduce((acc, m) => acc + (cantidades[m.id] ?? 0) * m.precio, 0)
    }, [menu, cantidades])

    const crear = async () => {
        if (!reservaSel) return setErrorForm('Selecciona la reserva del huésped')
        const items: ItemPedido[] = Object.entries(cantidades)
            .map(([id, cantidad]) => ({ menuItemId: Number(id), cantidad }))
        if (items.length === 0) return setErrorForm('Agrega al menos un producto')

        setGuardando(true)
        setErrorForm(null)
        try {
            await pedidoService.crear({
                reservaId: reservaSel,
                items,
                notas: notas.trim() || '',
            })
            setModalAbierto(false)
            onMensaje('Pedido registrado — pendiente de entrega')
            await cargar()
        } catch (e: unknown) {
            setErrorForm(e instanceof Error ? e.message : 'Error al registrar pedido')
        } finally {
            setGuardando(false)
        }
    }

    const cambiarEstado = async (pedido: Pedido, nuevo: Pedido['estado']) => {
        setAccionId(pedido.id)
        try {
            await pedidoService.cambiarEstado(pedido.id, nuevo)
            onMensaje(
                nuevo === 'ENTREGADO'
                    ? 'Pedido entregado — se sumó al consumo de la reserva'
                    : 'Pedido cancelado' + (pedido.estado === 'ENTREGADO'
                        ? ' — se quitó del consumo'
                        : '')
            )
            await cargar()
        } catch (e: unknown) {
            if (!esSesionExpirada(e)) {
                onMensaje(e instanceof Error ? e.message : 'Error al cambiar estado')
            }
        } finally {
            setAccionId(null)
        }
    }

    const menuFiltrado = useMemo(() => {
        if (catSel === 'TODAS') return menu
        return menu.filter(m => m.categoria === catSel)
    }, [menu, catSel])

    if (cargando && pedidos.length === 0) return (
        <div className="flex items-center justify-center h-64 text-gray-400 text-[13px] gap-2">
      <span className="w-4 h-4 border-2 border-gray-200 border-t-apple
                       rounded-full animate-spin" />
            Cargando pedidos...
        </div>
    )

    return (
        <div className="flex flex-col h-full min-h-0 gap-4">

            {/* ── Stats ─────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-3 flex-shrink-0">
                {[
                    { label: 'Total',      value: stats.todos,     color: 'text-ink'   },
                    { label: 'Pendiente',  value: stats.pendiente, color: 'text-amber-600'  },
                    { label: 'Entregados', value: stats.entregado, color: 'text-green-600'  },
                    { label: 'Cancelados', value: stats.cancelado, color: 'text-gray-400'   },
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
                        { id: 'TODOS',    label: 'Todos' },
                        { id: 'PENDIENTE', label: `Pendientes (${stats.pendiente})` },
                        { id: 'ENTREGADO', label: 'Entregados' },
                        { id: 'CANCELADO', label: 'Cancelados' },
                    ] as { id: Filtro; label: string }[]).map(t => (
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
                    placeholder="Buscar por habitación o huésped..."
                    aria-label="Buscar pedidos"
                    className="t-input flex-1 min-w-40"
                />

                <button
                    onClick={() => cargar().then(() => onMensaje('Pedidos actualizados'))}
                    aria-label="Actualizar pedidos"
                    title="Actualizar pedidos"
                    className="t-btn-ghost min-w-[32px]"
                >↻</button>

                <button
                    onClick={abrirNuevo}
                    className="t-btn-primary"
                >
                    + Pedido
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl
                        text-red-700 text-[13px]">⚠ {error}</div>
            )}

            {/* ── Tabla ─────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto t-card">
                {filtrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <div className="text-3xl opacity-10">○</div>
                        <div className="text-[13px]">No hay pedidos</div>
                    </div>
                ) : (
                    <table className="w-full border-collapse text-[13px]">
                        <thead className="sticky top-0 z-10">
                        <tr className="bg-fog/80 backdrop-blur-sm border-b border-gray-200/60">
                            {['Hora', 'Hab.', 'Huésped', 'Detalle', 'Total', 'Registró', 'Estado', '']
                                .map((col, i) => (
                                    <th key={i} className="t-th">{col}</th>
                                ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/80">
                        {filtrados.map(p => (
                            <tr key={p.id}
                                className="bg-white hover:bg-gray-50/80 transition-colors">
                                <td className="t-td font-mono text-gray-400">
                                    {horaCorta(p.createdAt)}
                                </td>
                                <td className="t-td font-mono font-semibold text-ink">
                                    {p.habitacionNumero}
                                </td>
                                <td className="t-td font-medium whitespace-nowrap text-ink">
                                    {p.nombreHuesped}
                                </td>
                                <td className="t-td text-gray-500 max-w-56">
                                    {p.items.map(i =>
                                        `${i.cantidad}× ${i.nombre}`
                                    ).join(' · ')}
                                    {p.notas && (
                                        <span className="text-gray-300"> — “{p.notas}”</span>
                                    )}
                                </td>
                                <td className="t-td font-mono font-medium whitespace-nowrap">
                                    {formatSoles(p.total)}
                                </td>
                                <td className="t-td text-gray-400">
                                    {p.creadoPor}
                                </td>
                                <td className="t-td">
                    <span className={`t-badge ${CONST_ESTADO[p.estado].cls}`}>
                        {LABEL_ESTADO[p.estado]}
                    </span>
                                </td>
                                <td className="t-td text-right">
                                    {p.estado === 'PENDIENTE' && (
                                        <>
                                            <button
                                                onClick={() => void cambiarEstado(p, 'ENTREGADO')}
                                                disabled={accionId === p.id}
                                                className="px-2 py-1 text-[12px] text-green-600
                                     hover:underline transition-colors disabled:opacity-40"
                                            >
                                                Entregar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Cancelar este pedido?')) {
                                                        void cambiarEstado(p, 'CANCELADO')
                                                    }
                                                }}
                                                disabled={accionId === p.id}
                                                className="px-2 py-1 text-[12px] text-gray-400
                                     hover:text-red-500 transition-colors disabled:opacity-40"
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    )}
                                    {p.estado === 'ENTREGADO' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm(
                                                    '¿Cancelar entregado? Se quitará del consumo de la reserva.'
                                                )) void cambiarEstado(p, 'CANCELADO')
                                            }}
                                            disabled={accionId === p.id}
                                            className="px-2 py-1 text-[12px] text-gray-400
                                     hover:text-red-500 transition-colors disabled:opacity-40"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="text-[11px] text-gray-400 text-right flex-shrink-0">
                {filtrados.length} de {pedidos.length} pedidos
            </div>

            {/* ── Modal nuevo pedido ────────────────────────────── */}
            <Modal
                abierto={modalAbierto}
                titulo="Nuevo pedido"
                onCerrar={() => setModalAbierto(false)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="t-label" htmlFor="ped-reserva">
                            Huésped (reserva con check-in) *
                        </label>
                        <select
                            id="ped-reserva"
                            value={reservaSel}
                            onChange={e => setReservaSel(e.target.value)}
                            className="t-input"
                        >
                            <option value="">Selecciona...</option>
                            {reservas.map(r => (
                                <option key={r.id} value={r.id}>
                                    Hab. {r.habitacionNumero} — {r.nombreHuesped} {r.apellidoHuesped}
                                </option>
                            ))}
                        </select>
                        {reservas.length === 0 && (
                            <div className="text-[12px] text-amber-600 mt-1.5">
                                No hay reservas con check-in activo para registrar consumo.
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="t-label mb-1">Productos *</div>
                        <div className="t-seg flex-wrap mb-3">
                            {(['TODAS', ...CATEGORIAS] as string[]).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCatSel(c)}
                                    className={`t-seg-btn ${catSel === c ? 't-seg-btn--active' : ''}`}
                                >
                                    {c === 'TODAS' ? 'Todo' : capitalizar(LABEL_CATEGORIA[c] ?? c)}
                                </button>
                            ))}
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-2xl border border-gray-200/60 divide-y divide-gray-100/80">
                            {menuFiltrado.length === 0 ? (
                                <div className="p-4 text-[12px] text-gray-400 text-center">
                                    Sin productos disponibles
                                </div>
                            ) : menuFiltrado.map(m => {
                                const cant = cantidades[m.id] ?? 0
                                return (
                                    <div key={m.id}
                                         className="flex items-center justify-between px-3.5 py-2.5 bg-white">
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-medium truncate text-ink">
                                                {m.nombre}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono">
                                                {formatSoles(m.precio)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => agregar(m.id, -1)}
                                                disabled={cant === 0}
                                                aria-label={`Quitar ${m.nombre}`}
                                                className="w-7 h-7 rounded-full border border-gray-200
                                     text-gray-500 hover:bg-gray-50 disabled:opacity-30
                                     text-[14px] leading-none transition-colors"
                                            >−</button>
                                            <span className="w-5 text-center text-[12px] font-mono">
                                                {cant || ''}
                                            </span>
                                            <button
                                                onClick={() => agregar(m.id, 1)}
                                                aria-label={`Agregar ${m.nombre}`}
                                                className="w-7 h-7 rounded-full border border-gray-200
                                     text-gray-500 hover:bg-gray-50 text-[14px] leading-none
                                     transition-colors"
                                            >+</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-2.5 text-[12px]">
                            <span className="text-gray-400">Total estimado</span>
                            <span className="font-mono font-semibold text-ink">
                                {formatSoles(totalEstimado)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="t-label" htmlFor="ped-notas">
                            Notas
                        </label>
                        <input
                            id="ped-notas"
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            placeholder="Ej. sin sal, habitación 203..."
                            className="t-input"
                        />
                    </div>

                    {errorForm && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl
                                text-red-700 text-[12px]">⚠ {errorForm}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            onClick={() => setModalAbierto(false)}
                            className="t-btn-ghost"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={crear}
                            disabled={guardando}
                            className="t-btn-primary"
                        >
                            {guardando ? 'Registrando...' : 'Registrar pedido'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}