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
    from:  string
    to:    string
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
    { id: 'dashboard', icon: '▦', label: 'Dashboard', roles: ['ADMIN', 'RECEPCIONISTA', 'LIMPIEZA'], from: '#06b6d4', to: '#3b82f6' },
    { id: 'reservas',  icon: '☰', label: 'Reservas',  roles: ['ADMIN', 'RECEPCIONISTA'],            from: '#7c3aed', to: '#d946ef' },
    { id: 'pedidos',   icon: '≡', label: 'Pedidos',   roles: ['ADMIN', 'RECEPCIONISTA'],            from: '#f59e0b', to: '#f97316' },
    { id: 'menu',      icon: '✦', label: 'Tienda',    roles: ['ADMIN', 'RECEPCIONISTA'],            from: '#10b981', to: '#14b8a6' },
    { id: 'reportes',  icon: '◎', label: 'Reportes',  roles: ['ADMIN'],                             from: '#6366f1', to: '#ec4899' },
    { id: 'usuarios',  icon: '▼', label: 'Usuarios',  roles: ['ADMIN'],                             from: '#f43f5e', to: '#fb923c' },
  ]

  const handleNavClick = (id: Pagina) => {
    setPagina(id)
    setSidebarAbierto(false)
  }

  const esLimpieza = rol === 'LIMPIEZA'
  const activo = navItems.find(n => n.id === pagina)

  return (
      <PrivateRoute onLogin={() => mostrarMensaje('Sesión iniciada')}>

        {/* Fondo aurora */}
        <div className="app-bg" />
        <div className="app-bg-grain" />

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
            'w-60 flex-shrink-0 glass border-r',
            'flex flex-col',
            'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out',
            'lg:relative lg:translate-x-0',
            sidebarAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}>

            {/* Logo */}
            <div className="px-5 pt-5 pb-5 flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-brand-gradient
                              text-white text-[14px] font-bold flex-shrink-0 shadow-glow">
                HB
              </div>
              <div>
                <div className="text-[13px] font-semibold tracking-[0.02em] text-ink leading-tight">
                  Hotel Bahía
                </div>
                <div className="text-[11px] text-gray-400 font-medium">
                  Back-office
                </div>
              </div>
            </div>

            {/* Navegación */}
            <nav className="px-3 flex-1 overflow-y-auto">
              {navItems
                  .filter(item => item.roles.includes((rol ?? 'ADMIN') as Rol))
                  .map(item => {
                    const on = pagina === item.id
                    return (
                      <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`group w-full text-left px-3 py-2.5 text-[13px] mb-1
                               flex items-center gap-3 transition-all duration-150 relative
                               ${on ? 'text-ink font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
                          style={on
                            ? {
                                background: `linear-gradient(135deg, ${item.from}26, ${item.to}1f)`,
                                boxShadow: `inset 0 0 0 1px ${item.from}59`,
                              }
                            : undefined}
                      >
                        <span
                            className="w-6 h-6 flex items-center justify-center text-[10px] flex-shrink-0
                                       transition-all duration-150"
                            style={on
                              ? { background: `linear-gradient(135deg, ${item.from}, ${item.to})`, color: '#fff' }
                              : { background: 'rgba(127,127,127,0.12)', color: 'inherit' }}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                        {on && (
                          <span
                              className="absolute right-3 w-1.5 h-1.5 t-dot"
                              style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
                          />
                        )}
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
            <div className="p-4 border-t border-gray-200/60">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 t-dot bg-brand-gradient flex items-center
                              justify-center text-white text-[12px] font-semibold
                              flex-shrink-0 shadow-glow">
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
                  className="text-[12px] text-gray-400 hover:text-brand transition-colors py-1"
              >
                Cerrar sesión →
              </button>
            </div>
          </aside>

          {/* ── Main ──────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <header className="glass border-b border-gray-200/40 px-5 lg:px-7
                             py-3.5 flex items-center justify-between flex-shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                    className="lg:hidden text-gray-500 hover:text-ink text-lg leading-none"
                    onClick={() => setSidebarAbierto(!sidebarAbierto)}
                    aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={sidebarAbierto}
                >
                  ☰
                </button>
                <div className="flex items-center gap-2.5 min-w-0">
                  {activo && (
                    <span
                        className="hidden sm:block w-2.5 h-2.5 t-dot flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${activo.from}, ${activo.to})`,
                                 boxShadow: `0 0 12px ${activo.from}99` }}
                    />
                  )}
                  <h1 className="text-[17px] font-semibold tracking-tight text-ink truncate">
                    {TITULOS[pagina] ?? 'Back-office'}
                  </h1>
                </div>
              </div>

              <button
                  onClick={toggle}
                  aria-label="Cambiar tema"
                  title="Cambiar tema (claro / oscuro)"
                  className="glass w-9 h-9 flex items-center justify-center
                             text-[15px] text-gray-600 hover:text-ink
                             transition-all hover:shadow-glow flex-shrink-0"
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
                  bg-brand-gradient text-white text-[12px] font-semibold
                  px-5 py-2.5 shadow-glow
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
