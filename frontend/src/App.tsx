import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore, aplicarTema } from '@/store/useThemeStore'
import { PrivateRoute } from '@/components/PrivateRoute'
import { Modal } from '@/components/Modal'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ReservasPage } from '@/features/reservas/ReservasPage'
import { NuevaReservaForm } from '@/features/reservas/NuevaReservaForm'

const ReportesPage = lazy(() =>
    import('@/features/reportes/ReportesPage').then(m => ({ default: m.ReportesPage }))
)
const PedidosPage = lazy(() =>
    import('@/features/pedidos/PedidosPage').then(m => ({ default: m.PedidosPage }))
)
const MenuPage = lazy(() =>
    import('@/features/menu/MenuPage').then(m => ({ default: m.MenuPage }))
)
const UsuariosPage = lazy(() =>
    import('@/features/usuarios/UsuariosPage').then(m => ({ default: m.UsuariosPage }))
)

type Pagina = 'dashboard' | 'reservas' | 'pedidos' | 'menu' | 'reportes' | 'usuarios'
type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'LIMPIEZA'

interface NavItem {
    id:    Pagina
    icon:  string
    label: string
    roles: Rol[]
}

const TITULOS: Record<Pagina, string> = {
    dashboard: 'Estado de habitaciones',
    reservas:  'Reservas',
    pedidos:   'Pedidos y consumo',
    menu:      'Tienda del hotel',
    reportes:  'Reportes',
    usuarios:  'Usuarios',
}

// ── App principal ─────────────────────────────────────────────
export default function App() {
  const { nombre, rol, logout } = useAuthStore()
  const { tema, toggle } = useThemeStore()
  const [pagina,          setPagina]          = useState<Pagina>('dashboard')
  const [modalAbierto,    setModalAbierto]    = useState(false)
  const [mensaje,         setMensaje]         = useState<string | null>(null)
  const [sidebarAbierto,  setSidebarAbierto]  = useState(false)
  const [versionReservas, setVersionReservas] = useState(0)

  const timerToast = useRef<number | undefined>(undefined)

  const mostrarMensaje = useCallback((texto: string) => {
    setMensaje(texto)
    if (timerToast.current !== undefined) window.clearTimeout(timerToast.current)
    timerToast.current = window.setTimeout(() => {
      setMensaje(null)
      timerToast.current = undefined
    }, 3000)
  }, [])

  // Re-aplica el tema cuando cambia la preferencia del sistema.
  useEffect(() => {
    aplicarTema(tema)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (useThemeStore.getState().tema === 'system') aplicarTema('system') }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [tema])

  useEffect(() => () => {
    if (timerToast.current !== undefined) window.clearTimeout(timerToast.current)
  }, [])

  const abrirModal = useCallback(() => setModalAbierto(true), [])

  const navItems: NavItem[] = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard', roles: ['ADMIN', 'RECEPCIONISTA', 'LIMPIEZA'] },
    { id: 'reservas',  icon: '☰', label: 'Reservas',  roles: ['ADMIN', 'RECEPCIONISTA'] },
    { id: 'pedidos',   icon: '≡', label: 'Pedidos',   roles: ['ADMIN', 'RECEPCIONISTA'] },
    { id: 'menu',      icon: '✦', label: 'Tienda',    roles: ['ADMIN', 'RECEPCIONISTA'] },
    { id: 'reportes',  icon: '◎', label: 'Reportes',  roles: ['ADMIN'] },
    { id: 'usuarios',  icon: '▼', label: 'Usuarios',  roles: ['ADMIN'] },
  ]

  const handleNavClick = (id: Pagina) => {
    setPagina(id)
    setSidebarAbierto(false)
  }

  const esLimpieza = rol === 'LIMPIEZA'

  return (
      <PrivateRoute onLogin={() => mostrarMensaje('Sesión iniciada')}>

        <div className="flex h-screen overflow-hidden">

          {/* Overlay oscuro del sidebar en móvil */}
          {sidebarAbierto && (
              <div
                  className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-fadeIn"
                  onClick={() => setSidebarAbierto(false)}
              />
          )}

          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className={[
            'w-60 flex-shrink-0 glass border-r shadow-none',
            'flex flex-col',
            'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out',
            'lg:relative lg:translate-x-0',
            'lg:border-r',
            sidebarAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}>

            {/* Logo */}
            <div className="px-5 pt-6 pb-5 flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg
                              bg-brand text-white text-[13px] font-bold flex-shrink-0">
                HB
              </div>
              <div>
                <div className="text-[13px] font-semibold tracking-tight text-ink leading-tight">
                  Hotel Bahía
                </div>
                <div className="text-[11px] text-gray-400 font-medium">
                  Back-office
                </div>
              </div>
            </div>

            {/* Navegación */}
            <nav className="px-3 flex-1 overflow-y-auto">
              <div className="text-[10px] font-semibold uppercase tracking-wider
                              text-gray-400 px-3 pt-2 pb-1">
                Menú
              </div>
              {navItems
                  .filter(item => item.roles.includes((rol ?? 'ADMIN') as Rol))
                  .map(item => {
                    const on = pagina === item.id
                    return (
                      <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`group w-full text-left pl-3 pr-3 py-2 rounded-md text-[13px] mb-0.5
                               flex items-center gap-2.5 transition-colors duration-150 relative
                               ${on
                                  ? 'bg-brand-soft text-brand font-medium'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        {on && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2
                                           w-[3px] h-4 rounded-full bg-brand" />
                        )}
                        <span className={`text-[11px] w-4 text-center flex-shrink-0
                                         ${on ? 'text-brand' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    )
                  })}

              {!esLimpieza && (
                  <button
                      onClick={() => { abrirModal(); setSidebarAbierto(false) }}
                      className="t-btn-primary w-full mt-3"
                  >
                    <span className="text-[13px] leading-none">+</span> Nueva reserva
                  </button>
              )}
            </nav>

            {/* Usuario */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 t-dot bg-brand-soft text-brand flex items-center
                              justify-center text-[12px] font-semibold flex-shrink-0">
                  {nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium truncate text-ink">{nombre}</div>
                  <div className="text-[11px] text-gray-400 capitalize">
                    {rol?.toLowerCase()}
                  </div>
                </div>
              </div>
              <button
                  onClick={() => logout()}
                  className="text-[12px] text-gray-400 hover:text-brand transition-colors"
              >
                Cerrar sesión →
              </button>
            </div>
          </aside>

          {/* ── Main ──────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200
                             px-5 lg:px-7 py-3.5 flex items-center justify-between flex-shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                    className="lg:hidden text-gray-500 hover:text-ink text-lg leading-none"
                    onClick={() => setSidebarAbierto(!sidebarAbierto)}
                    aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={sidebarAbierto}
                >
                  ☰
                </button>
                <h1 className="text-[17px] font-semibold tracking-tight text-ink truncate">
                  {TITULOS[pagina] ?? 'Back-office'}
                </h1>
              </div>

              <button
                  onClick={toggle}
                  aria-label="Cambiar tema"
                  title="Cambiar tema"
                  className="w-8 h-8 flex items-center justify-center rounded-md
                             text-[15px] text-gray-500 hover:text-ink
                             hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                {esOscuro(tema) ? '☀' : '☾'}
              </button>
            </header>

            <div className="flex-1 overflow-hidden p-4 lg:p-6">
              {pagina === 'dashboard' && (
                  <DashboardPage
                      onMensaje={mostrarMensaje}
                      refreshSignal={versionReservas}
                  />
              )}
              {pagina === 'reservas' && !esLimpieza && (
                  <ReservasPage
                      onNuevaReserva={abrirModal}
                      onMensaje={mostrarMensaje}
                      refreshSignal={versionReservas}
                  />
              )}
              {pagina === 'pedidos' && !esLimpieza && (
                  <Suspense fallback={<Fallback texto="Cargando pedidos..." />}>
                    <PedidosPage onMensaje={mostrarMensaje} />
                  </Suspense>
              )}
              {pagina === 'menu' && !esLimpieza && (
                  <Suspense fallback={<Fallback texto="Cargando tienda..." />}>
                    <MenuPage onMensaje={mostrarMensaje} />
                  </Suspense>
              )}
              {pagina === 'reportes' && rol === 'ADMIN' && (
                  <Suspense fallback={<Fallback texto="Cargando reportes..." />}>
                    <ReportesPage />
                  </Suspense>
              )}
              {pagina === 'usuarios' && rol === 'ADMIN' && (
                  <Suspense fallback={<Fallback texto="Cargando usuarios..." />}>
                    <UsuariosPage onMensaje={mostrarMensaje} />
                  </Suspense>
              )}
            </div>
          </main>

          {/* ── Modal Nueva Reserva ───────────────────────────── */}
          <Modal
              abierto={modalAbierto}
              titulo="Nueva reserva"
              onCerrar={() => setModalAbierto(false)}
          >
            <NuevaReservaForm
                onSuccess={() => {
                  setModalAbierto(false)
                  setVersionReservas(v => v + 1)
                  mostrarMensaje('Reserva confirmada correctamente')
                }}
            />
          </Modal>

          {/* ── Toast ─────────────────────────────────────────── */}
          {mensaje && (
              <div className="fixed left-1/2 -translate-x-1/2 z-50
                  bg-slate-900 text-white text-[12px] font-medium
                  px-5 py-2.5 rounded-lg shadow-modal
                  bottom-16 lg:bottom-5 animate-slideUp">
                {mensaje}
              </div>
          )}
        </div>
      </PrivateRoute>
  )
}

function esOscuro(tema: string): boolean {
  if (tema === 'dark')  return true
  if (tema === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function Fallback({ texto }: { texto: string }) {
  return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-[13px] gap-2">
        <span className="w-4 h-4 border-2 border-gray-200 border-t-brand
                         t-spin animate-spin" />
        {texto}
      </div>
  )
}