import { esSesionExpirada } from '@/lib/esErrorSesion'
import { useAuthStore } from '@/store/useAuthStore'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Modal } from '@/components/Modal'
import {
    usuarioService,
    Usuario,
    UsuarioUpdate,
    LABEL_ROL,
} from '@/services/usuarioService'
import { capitalizar } from '@/lib/format'

interface Props {
    onMensaje: (texto: string) => void
}

const ROLES = ['ADMIN', 'RECEPCIONISTA', 'LIMPIEZA'] as const
type RolState = typeof ROLES[number]

type ModalTipo = 'crear' | 'editar' | 'password' | null

const CONST_ROL: Record<RolState, string> = {
    ADMIN: 'bg-gray-900 text-white',
    RECEPCIONISTA: 'bg-blue-50 text-blue-700',
    LIMPIEZA: 'bg-teal-50 text-teal-700',
}

export function UsuariosPage({ onMensaje }: Props) {
    const miRol = useAuthStore(s => s.rol)

    const [usuarios,  setUsuarios]  = useState<Usuario[]>([])
    const [cargando,  setCargando]  = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [busqueda,  setBusqueda]  = useState('')

    const [modalTipo, setModalTipo] = useState<ModalTipo>(null)
    const [seleccion, setSeleccion] = useState<Usuario | null>(null)
    const [form,      setForm]      = useState<{ nombre: string; email: string;
                                                 rol: RolState; activo: boolean;
                                                 password: string }>({
        nombre: '', email: '', rol: 'RECEPCIONISTA', activo: true, password: '',
    })
    const [guardando, setGuardando] = useState(false)
    const [errorForm, setErrorForm] = useState<string | null>(null)

    const cargar = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)
            setUsuarios(await usuarioService.listar())
        } catch (e: unknown) {
            if (esSesionExpirada(e)) return
            setError(e instanceof Error ? e.message : 'Error de conexión')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { void cargar() }, [cargar])

    const filtrados = useMemo(() => {
        const q = busqueda.toLowerCase().trim()
        if (!q) return usuarios
        return usuarios.filter(u =>
            u.nombre.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.rol.toLowerCase().includes(q)
        )
    }, [usuarios, busqueda])

    const abrirCrear = () => {
        setSeleccion(null)
        setForm({ nombre: '', email: '', rol: 'RECEPCIONISTA', activo: true, password: '' })
        setErrorForm(null)
        setModalTipo('crear')
    }

    const abrirEditar = (u: Usuario) => {
        setSeleccion(u)
        setForm({ nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo, password: '' })
        setErrorForm(null)
        setModalTipo('editar')
    }

    const abrirPassword = (u: Usuario) => {
        setSeleccion(u)
        setForm({ nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo, password: '' })
        setErrorForm(null)
        setModalTipo('password')
    }

    const validarBase = (): string | null => {
        if (!form.nombre.trim()) return 'El nombre es obligatorio'
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Ingresa un email válido'
        return null
    }

    const crear = async () => {
        const err = validarBase()
        if (err) return setErrorForm(err)
        if (form.password.length < 6) return setErrorForm('La contraseña debe tener mínimo 6 caracteres')

        setGuardando(true)
        setErrorForm(null)
        try {
            await usuarioService.crear({
                nombre: form.nombre.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                rol: form.rol,
            })
            onMensaje('Usuario creado')
            setModalTipo(null)
            await cargar()
        } catch (e: unknown) {
            setErrorForm(e instanceof Error ? e.message : 'Error al crear')
        } finally {
            setGuardando(false)
        }
    }

    const actualizar = async () => {
        if (!seleccion) return
        const err = validarBase()
        if (err) return setErrorForm(err)

        setGuardando(true)
        setErrorForm(null)
        try {
            const dto: UsuarioUpdate = {
                nombre: form.nombre.trim(),
                email: form.email.trim().toLowerCase(),
                rol: form.rol,
                activo: form.activo,
            }
            await usuarioService.actualizar(seleccion.id, dto)
            onMensaje('Usuario actualizado')
            setModalTipo(null)
            await cargar()
        } catch (e: unknown) {
            setErrorForm(e instanceof Error ? e.message : 'Error al actualizar')
        } finally {
            setGuardando(false)
        }
    }

    const resetPassword = async () => {
        if (!seleccion) return
        if (form.password.length < 6) return setErrorForm('La contraseña debe tener mínimo 6 caracteres')

        setGuardando(true)
        setErrorForm(null)
        try {
            await usuarioService.resetPassword(seleccion.id, form.password)
            onMensaje('Contraseña actualizada')
            setModalTipo(null)
        } catch (e: unknown) {
            setErrorForm(e instanceof Error ? e.message : 'Error al actualizar')
        } finally {
            setGuardando(false)
        }
    }

    if (cargando && usuarios.length === 0) return (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
      <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-500
                       rounded-full animate-spin" />
            Cargando usuarios...
        </div>
    )

    return (
        <div className="flex flex-col h-full min-h-0 gap-3">

            {/* ── Controles ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, email o rol..."
                    aria-label="Buscar usuarios"
                    className="flex-1 min-w-40 px-3 py-1.5 border border-gray-200 rounded-lg
                      text-xs bg-gray-50 focus:outline-none focus:border-gray-400
                      focus:bg-white placeholder:text-gray-300 transition-colors"
                />

                <button
                    onClick={() => cargar().then(() => onMensaje('Usuarios actualizados'))}
                    aria-label="Actualizar usuarios"
                    title="Actualizar usuarios"
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
                      text-gray-500 hover:bg-gray-50 transition-colors"
                >↻</button>

                <button
                    onClick={abrirCrear}
                    className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium
                      rounded-lg hover:bg-gray-800 transition-colors"
                >
                    + Usuario
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg
                        text-red-700 text-sm">⚠ {error}</div>
            )}

            {/* ── Tabla ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-auto border border-gray-100 rounded-lg">
                {filtrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <div className="text-3xl opacity-20">○</div>
                        <div className="text-sm">No hay usuarios</div>
                    </div>
                ) : (
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {['Nombre', 'Email', 'Rol', 'Estado', '']
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
                        {filtrados.map((u, idx) => (
                            <tr key={u.id}
                                className={`border-b border-gray-50 transition-colors
                      ${idx % 2 === 0
                                        ? 'bg-white hover:bg-gray-50'
                                        : 'bg-gray-50/40 hover:bg-gray-100/60'}`}>
                                <td className="px-3 py-3 text-xs font-medium whitespace-nowrap">
                                    {u.nombre}
                                </td>
                                <td className="px-3 py-3 text-xs font-mono text-gray-400">
                                    {u.email}
                                </td>
                                <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs
                                        font-medium ${CONST_ROL[u.rol]}`}>
                        {capitalizar(LABEL_ROL[u.rol])}
                      </span>
                                </td>
                                <td className="px-3 py-3">
                                    {u.activo ? (
                                        <span className="text-xs text-green-600 font-medium">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="text-xs text-red-500 font-medium">
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                    <button
                                        onClick={() => abrirEditar(u)}
                                        title="Editar usuario"
                                        className="px-2 py-1 text-xs text-gray-400
                                     hover:text-gray-900 transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => abrirPassword(u)}
                                        title="Cambiar contraseña"
                                        className="px-2 py-1 text-xs text-gray-400
                                     hover:text-gray-900 transition-colors"
                                    >
                                        Contraseña
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="text-xs text-gray-400 text-right flex-shrink-0">
                {filtrados.length} de {usuarios.length} usuarios
            </div>

            {/* ── Modal crear ───────────────────────────────────── */}
            <Modal abierto={modalTipo === 'crear'} titulo="Nuevo usuario"
                   onCerrar={() => setModalTipo(null)}>
                <FormUsuario
                    nombre={form.nombre} email={form.email}
                    password={form.password} rol={form.rol}
                    onChange={setForm}
                    errorForm={errorForm}
                    guardando={guardando}
                    accionTexto="Crear usuario"
                    onGuardar={crear}
                    onCerrar={() => setModalTipo(null)}
                    mostrarPassword
                />
            </Modal>

            {/* ── Modal editar ──────────────────────────────────── */}
            <Modal abierto={modalTipo === 'editar'} titulo="Editar usuario"
                   onCerrar={() => setModalTipo(null)}>
                <FormUsuario
                    nombre={form.nombre} email={form.email}
                    password={form.password} rol={form.rol} activo={form.activo}
                    onChange={setForm}
                    errorForm={errorForm}
                    guardando={guardando}
                    accionTexto="Guardar cambios"
                    onGuardar={actualizar}
                    onCerrar={() => setModalTipo(null)}
                    mostrarActivo
                />
            </Modal>

            {/* ── Modal contraseña ──────────────────────────────── */}
            <Modal abierto={modalTipo === 'password'}
                   titulo={seleccion ? `Contraseña de ${seleccion.nombre}` : 'Cambiar contraseña'}
                   onCerrar={() => setModalTipo(null)}>
                <FormUsuario
                    nombre={seleccion?.nombre ?? ''}
                    email={seleccion?.email ?? ''}
                    password={form.password} rol={seleccion?.rol ?? 'RECEPCIONISTA'}
                    onChange={setForm}
                    errorForm={errorForm}
                    guardando={guardando}
                    soloPassword
                    accionTexto="Guardar contraseña"
                    onGuardar={resetPassword}
                    onCerrar={() => setModalTipo(null)}
                />
            </Modal>

            {/* Nota restrictiva para rol no-ADMIN (nunca debería pasar) */}
            {miRol !== 'ADMIN' && (
                <div className="text-xs text-gray-400 text-right">
                    Solo un administrador puede gestionar usuarios.
                </div>
            )}
        </div>
    )
}

// ── Formulario reutilizable del modal ─────────────────────────
function FormUsuario({
                         nombre, email, password, rol, activo,
                         onChange, errorForm, guardando, accionTexto,
                         onGuardar, onCerrar, mostrarPassword, mostrarActivo, soloPassword,
                     }: {
    nombre: string
    email: string
    password: string
    rol: RolState
    activo?: boolean
    onChange: (f: { nombre: string; email: string; rol: RolState;
                     activo: boolean; password: string }) => void
    errorForm: string | null
    guardando: boolean
    accionTexto: string
    onGuardar: () => void
    onCerrar: () => void
    mostrarPassword?: boolean
    mostrarActivo?: boolean
    soloPassword?: boolean
}) {
    const set = (p: Partial<{ nombre: string; email: string; rol: RolState;
                               activo: boolean; password: string }>) =>
        onChange({ nombre, email, rol, activo: activo ?? true, password, ...p })

    return (
        <div className="space-y-3">
            {!soloPassword && (
                <>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="us-nombre">
                            Nombre completo *
                        </label>
                        <input
                            id="us-nombre"
                            value={nombre}
                            onChange={e => set({ nombre: e.target.value })}
                            autoFocus
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:border-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="us-email">
                            Email *
                        </label>
                        <input
                            id="us-email"
                            type="email"
                            value={email}
                            onChange={e => set({ email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:border-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="us-rol">
                            Rol *
                        </label>
                        <select
                            id="us-rol"
                            value={rol}
                            onChange={e => set({ rol: e.target.value as RolState })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             bg-white focus:outline-none focus:border-gray-400"
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r}>{LABEL_ROL[r]}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {mostrarActivo && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={activo ?? true}
                        onChange={e => set({ activo: e.target.checked })}
                        className="w-4 h-4 accent-gray-900"
                    />
                    Usuario activo (puede iniciar sesión)
                </label>
            )}

            <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="us-pass">
                        {soloPassword ? `Nueva contraseña * (mínimo 6 caracteres)`
                            : mostrarPassword ? 'Contraseña * (mínimo 6 caracteres)'
                                : 'Nueva contraseña' }
                </label>
                <input
                    id="us-pass"
                    type="password"
                    value={password}
                    onChange={e => set({ password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:border-gray-400"
                />
            </div>

            {errorForm && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg
                        text-red-700 text-xs">⚠ {errorForm}</div>
            )}

            <div className="flex justify-end gap-2 pt-1">
                <button
                    onClick={onCerrar}
                    className="px-4 py-2 text-xs text-gray-500 hover:text-gray-900
                             transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={onGuardar}
                    disabled={guardando}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-medium
                             rounded-lg hover:bg-gray-800 disabled:opacity-40"
                >
                    {guardando ? 'Guardando...' : accionTexto}
                </button>
            </div>
        </div>
    )
}