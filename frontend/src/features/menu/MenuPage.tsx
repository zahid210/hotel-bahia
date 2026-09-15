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
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
      <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-500
                       rounded-full animate-spin" />
            Cargando tienda...
        </div>
    )

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">

            {/* ── Controles ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {(['TODAS', ...CATEGORIAS] as string[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setFiltroCat(c)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                ${filtroCat === c
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'}`}
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
                    className="flex-1 min-w-40 px-3 py-1.5 border border-gray-200 rounded-lg
                      text-xs bg-gray-50 focus:outline-none focus:border-gray-400
                      focus:bg-white placeholder:text-gray-300 transition-colors"
                />

                <button
                    onClick={() => cargar().then(() => onMensaje('Tienda actualizada'))}
                    aria-label="Actualizar tienda"
                    title="Actualizar tienda"
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
                      text-gray-500 hover:bg-gray-50 transition-colors"
                >↻</button>

                {esAdmin && (
                    <button
                        onClick={abrirCrear}
                        className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium
                          rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        + Producto
                    </button>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg
                        text-red-700 text-sm">⚠ {error}</div>
            )}

            {/* ── Tabla ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto border border-gray-100 rounded-lg">
                {filtradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <div className="text-3xl opacity-20">○</div>
                        <div className="text-sm">No hay productos</div>
                    </div>
                ) : (
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {['Producto', 'Descripción', 'Categoría', 'Precio', 'Estado', '']
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
                        {filtradas.map((item, idx) => (
                            <tr
                                key={item.id}
                                className={`border-b border-gray-50 transition-colors
                      ${idx % 2 === 0
                                        ? 'bg-white hover:bg-gray-50'
                                        : 'bg-gray-50/40 hover:bg-gray-100/60'}`}
                            >
                                <td className="px-3 py-3 text-xs font-medium whitespace-nowrap">
                                    {item.nombre}
                                </td>
                                <td className="px-3 py-3 text-xs text-gray-400 max-w-64 truncate">
                                    {item.descripcion ?? '—'}
                                </td>
                                <td className="px-3 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs
                                        bg-gray-100 text-gray-600 font-medium">
                        {capitalizar(LABEL_CATEGORIA[item.categoria] ?? item.categoria)}
                      </span>
                                </td>
                                <td className="px-3 py-3 text-xs font-mono whitespace-nowrap">
                                    {formatSoles(item.precio)}
                                </td>
                                <td className="px-3 py-3">
                                    {item.disponible ? (
                                        <span className="text-xs text-green-600 font-medium">
                                            Disponible
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Agotado</span>
                                    )}
                                </td>
                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                    {esAdmin && (
                                        <>
                                            <button
                                                onClick={() => abrirEditar(item)}
                                                title="Editar producto"
                                                className="px-2 py-1 text-xs text-gray-400
                                     hover:text-gray-900 transition-colors"
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
                                                className="px-2 py-1 text-xs text-gray-400
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

            <div className="text-xs text-gray-400 text-right flex-shrink-0">
                {filtradas.length} de {items.length} productos
            </div>

            {/* ── Modal crear/editar ────────────────────────────── */}
            <Modal
                abierto={modalAbierto}
                titulo={editando ? 'Editar producto' : 'Nuevo producto'}
                onCerrar={() => setModalAbierto(false)}
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1"
                               htmlFor="mi-nombre">
                            Nombre del producto *
                        </label>
                        <input
                            id="mi-nombre"
                            value={form.nombre}
                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                            autoFocus
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:border-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1"
                               htmlFor="mi-desc">
                            Descripción
                        </label>
                        <textarea
                            id="mi-desc"
                            value={form.descripcion ?? ''}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:border-gray-400 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1"
                                   htmlFor="mi-cat">
                                Categoría *
                            </label>
                            <select
                                id="mi-cat"
                                value={form.categoria}
                                onChange={e => setForm({ ...form, categoria: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                 bg-white focus:outline-none focus:border-gray-400"
                            >
                                {CATEGORIAS.map(c => (
                                    <option key={c} value={c}>
                                        {capitalizar(LABEL_CATEGORIA[c])}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1"
                                   htmlFor="mi-precio">
                                Precio (S/) *
                            </label>
                            <input
                                id="mi-precio"
                                type="number"
                                min="0"
                                step="0.5"
                                value={form.precio || ''}
                                onChange={e => setForm({ ...form, precio: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                 focus:outline-none focus:border-gray-400"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.disponible}
                            onChange={e => setForm({ ...form, disponible: e.target.checked })}
                            className="w-4 h-4 accent-gray-900"
                        />
                        Disponible para pedidos
                    </label>

                    {errorForm && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg
                                text-red-700 text-xs">⚠ {errorForm}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            onClick={() => setModalAbierto(false)}
                            className="px-4 py-2 text-xs text-gray-500 hover:text-gray-900
                             transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={guardar}
                            disabled={guardando}
                            className="px-4 py-2 bg-gray-900 text-white text-xs font-medium
                             rounded-lg hover:bg-gray-800 disabled:opacity-40"
                        >
                            {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}