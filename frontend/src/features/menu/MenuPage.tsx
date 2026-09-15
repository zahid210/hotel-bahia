import { esSesionExpirada } from '@/lib/esErrorSesion'
import { formatSoles, capitalizar } from '@/lib/format'
import { useAuthStore } from '@/store/useAuthStore'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Modal } from '@/components/Modal'
import {
    menuService,
    MenuItem,
    MenuItemForm,
    CATEGORIAS,
    LABEL_CATEGORIA,
} from '@/services/menuService'

interface Props {
    onMensaje: (texto: string) => void
}

const FORM_VACIO: MenuItemForm = {
    nombre: '', descripcion: null,
    categoria: 'SNACKS', precio: 0, disponible: true,
}

export function MenuPage({ onMensaje }: Props) {
    const rol = useAuthStore(s => s.rol)
    const esAdmin = rol === 'ADMIN'

    const [items,     setItems]     = useState<MenuItem[]>([])
    const [cargando,  setCargando]  = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [filtroCat, setFiltroCat] = useState<string>('TODAS')
    const [busqueda,  setBusqueda]  = useState('')

    const [modalAbierto, setModalAbierto] = useState(false)
    const [editando,     setEditando]     = useState<MenuItem | null>(null)
    const [form,         setForm]         = useState<MenuItemForm>(FORM_VACIO)
    const [guardando,    setGuardando]    = useState(false)
    const [errorForm,    setErrorForm]    = useState<string | null>(null)
    const [eliminandoId, setEliminandoId] = useState<number | null>(null)

    const cargar = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)
            setItems(await menuService.listar())
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { void cargar() }, [cargar])

    const filtradas = useMemo(() => {
        let lista = [...items]
        if (filtroCat !== 'TODAS') lista = lista.filter(i => i.categoria === filtroCat)
        const q = busqueda.toLowerCase().trim()
        if (q) lista = lista.filter(i =>
            i.nombre.toLowerCase().includes(q) ||
            (i.descripcion ?? '').toLowerCase().includes(q)
        )
        return lista
    }, [items, filtroCat, busqueda])

    const abrirCrear = () => {
        setEditando(null)
        setForm(FORM_VACIO)
        setErrorForm(null)
        setModalAbierto(true)
    }

    const abrirEditar = (item: MenuItem) => {
        setEditando(item)
        setForm({
            nombre: item.nombre,
            descripcion: item.descripcion ?? '',
            categoria: item.categoria,
            precio: item.precio,
            disponible: item.disponible,
        })
        setErrorForm(null)
        setModalAbierto(true)
    }

    const guardar = async () => {
        const nombre = form.nombre.trim()
        if (!nombre) return setErrorForm('El nombre del producto es obligatorio')
        if (!form.categoria) return setErrorForm('Selecciona una categoría')
        if (form.precio <= 0) return setErrorForm('El precio debe ser mayor a 0')

        setGuardando(true)
        setErrorForm(null)
        try {
            if (editando) {
                await menuService.actualizar(editando.id, {
                    ...form, nombre,
                    descripcion: (form.descripcion ?? '').trim() || null,
                })
                onMensaje('Producto actualizado')
            } else {
                await menuService.crear({
                    ...form, nombre,
                    descripcion: (form.descripcion ?? '').trim() || null,
                })
                onMensaje('Producto agregado a la tienda')
            }
            setModalAbierto(false)
            await cargar()
        } catch (e: unknown) {
            setErrorForm(e instanceof Error ? e.message : 'Error al guardar')
        } finally {
            setGuardando(false)
        }
    }

    const eliminar = async (item: MenuItem) => {
        setEliminandoId(item.id)
        try {
            await menuService.eliminar(item.id)
            onMensaje('Producto retirado de la tienda')
            await cargar()
        } catch (e: unknown) {
            if (!esSesionExpirada(e)) {
                onMensaje(e instanceof Error ? e.message : 'Error al eliminar')
            }
        } finally {
            setEliminandoId(null)
        }
    }

    if (cargando && items.length === 0) return (
        <div className="flex items-center justify-center h-64 text-gray-400 text-[13px] gap-2">
      <span className="w-4 h-4 border-2 border-gray-200 border-t-apple
                       t-spin animate-spin" />
            Cargando tienda...
        </div>
    )

    return (
        <div className="flex flex-col h-full min-h-0 gap-4">

            {/* ── Controles ─────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                <div className="t-seg flex-wrap">
                    {(['TODAS', ...CATEGORIAS] as string[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setFiltroCat(c)}
                            className={`t-seg-btn ${filtroCat === c ? 't-seg-btn--active' : ''}`}
                        >
                            {c === 'TODAS' ? 'Todo' : capitalizar(LABEL_CATEGORIA[c] ?? c)}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar producto..."
                    aria-label="Buscar en la tienda"
                    className="t-input flex-1 min-w-40"
                />

                <button
                    onClick={() => cargar().then(() => onMensaje('Tienda actualizada'))}
                    aria-label="Actualizar tienda"
                    title="Actualizar tienda"
                    className="t-btn-ghost min-w-[32px]"
                >↻</button>

                {esAdmin && (
                    <button
                        onClick={abrirCrear}
                        className="t-btn-primary"
                    >
                        + Producto
                    </button>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl
                        text-red-700 text-[13px]">⚠ {error}</div>
            )}

            {/* ── Tabla ─────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto t-card">
                {filtradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <div className="text-3xl opacity-10">○</div>
                        <div className="text-[13px]">No hay productos</div>
                    </div>
                ) : (
                    <table className="w-full border-collapse text-[13px]">
                        <thead className="sticky top-0 z-10">
                        <tr className="bg-fog/80 backdrop-blur-sm border-b border-gray-200/60">
                            {['Producto', 'Descripción', 'Categoría', 'Precio', 'Estado', '']
                                .map((col, i) => (
                                    <th key={i} className="t-th">{col}</th>
                                ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/80">
                        {filtradas.map(item => (
                            <tr
                                key={item.id}
                                className="bg-white hover:bg-gray-50/80 transition-colors"
                            >
                                <td className="t-td font-medium whitespace-nowrap text-ink">
                                    {item.nombre}
                                </td>
                                <td className="t-td text-gray-400 max-w-64 truncate">
                                    {item.descripcion ?? '—'}
                                </td>
                                <td className="t-td">
                    <span className="t-badge bg-gray-100 text-gray-600 border-transparent">
                        {capitalizar(LABEL_CATEGORIA[item.categoria] ?? item.categoria)}
                    </span>
                                </td>
                                <td className="t-td font-mono whitespace-nowrap">
                                    {formatSoles(item.precio)}
                                </td>
                                <td className="t-td">
                                    {item.disponible ? (
                                        <span className="text-[11px] text-green-600 font-medium flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 t-dot bg-green-500" />
                                            Disponible
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-gray-400">Agotado</span>
                                    )}
                                </td>
                                <td className="t-td text-right">
                                    {esAdmin && (
                                        <>
                                            <button
                                                onClick={() => abrirEditar(item)}
                                                title="Editar producto"
                                                className="px-2 py-1 text-[12px] text-apple
                                     hover:underline transition-colors"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(
                                                        `¿Retirar "${item.nombre}" de la tienda?`
                                                    )) void eliminar(item)
                                                }}
                                                disabled={eliminandoId === item.id}
                                                title="Retirar de la tienda"
                                                className="px-2 py-1 text-[12px] text-gray-400
                                     hover:text-red-500 transition-colors disabled:opacity-40"
                                            >
                                                {eliminandoId === item.id ? '...' : 'Quitar'}
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="text-[11px] text-gray-400 text-right flex-shrink-0">
                {filtradas.length} de {items.length} productos
            </div>

            {/* ── Modal crear/editar ────────────────────────────── */}
            <Modal
                abierto={modalAbierto}
                titulo={editando ? 'Editar producto' : 'Nuevo producto'}
                onCerrar={() => setModalAbierto(false)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="t-label" htmlFor="mi-nombre">
                            Nombre del producto *
                        </label>
                        <input
                            id="mi-nombre"
                            value={form.nombre}
                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                            autoFocus
                            className="t-input"
                        />
                    </div>

                    <div>
                        <label className="t-label" htmlFor="mi-desc">
                            Descripción
                        </label>
                        <textarea
                            id="mi-desc"
                            value={form.descripcion ?? ''}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            rows={2}
                            className="t-input resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="t-label" htmlFor="mi-cat">
                                Categoría *
                            </label>
                            <select
                                id="mi-cat"
                                value={form.categoria}
                                onChange={e => setForm({ ...form, categoria: e.target.value })}
                                className="t-input"
                            >
                                {CATEGORIAS.map(c => (
                                    <option key={c} value={c}>
                                        {capitalizar(LABEL_CATEGORIA[c])}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="t-label" htmlFor="mi-precio">
                                Precio (S/) *
                            </label>
                            <input
                                id="mi-precio"
                                type="number"
                                min="0"
                                step="0.5"
                                value={form.precio || ''}
                                onChange={e => setForm({ ...form, precio: Number(e.target.value) })}
                                className="t-input"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.disponible}
                            onChange={e => setForm({ ...form, disponible: e.target.checked })}
                            className="w-4 h-4 accent-apple"
                        />
                        Disponible para pedidos
                    </label>

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
                            onClick={guardar}
                            disabled={guardando}
                            className="t-btn-primary min-w-[92px]"
                        >
                            {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}