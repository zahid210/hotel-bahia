import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
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

        <div className="flex h-screen bg-fog overflow-hidden">

          {/* Overlay oscuro del sidebar en móvil */}
          {sidebarAbierto && (
              <div
                  className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30 animate-fadeIn"
                  onClick={() => setSidebarAbierto(false)}
              />
          )}

          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className={[
            'w-52 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/60',
            'flex flex-col',
            'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out',
            'lg:relative lg:translate-x-0',
            sidebarAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}>

            {/* Logo */}
            <div className="px-5 pt-5 pb-4">
              <div className="text-[13px] font-semibold tracking-[0.06em] text-ink uppercase">
                Hotel Bahía
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 font-medium">
                Back-office
              </div>
            </div>

            {/* Navegación */}
            <nav className="px-3 flex-1">
              {navItems
                  .filter(item => item.roles.includes((rol ?? 'ADMIN') as Rol))
                  .map(item => (
                  <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[13px] mb-0.5
                           flex items-center gap-2.5 transition-all duration-150
                           ${pagina === item.id
                              ? 'bg-black/[0.05] text-ink font-medium'
                              : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900'}`}
                  >
                    <span className="text-[11px] opacity-50 w-4 text-center">{item.icon}</span>
                    {item.label}
                  </button>
              ))}

              {!esLimpieza && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => { abrirModal(); setSidebarAbierto(false) }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[13px]
                           text-gray-400 hover:bg-gray-100/60 hover:text-gray-900
                           transition-colors flex items-center gap-2.5"
                    >
                      <span className="text-[11px] opacity-50 w-4 text-center">+</span>
                      Nueva reserva
                    </button>
                  </div>
              )}
            </nav>

            {/* Usuario */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-ink flex items-center
                              justify-center text-white text-[12px] font-semibold
                              flex-shrink-0">
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
                  className="text-[12px] text-gray-400 hover:text-apple transition-colors py-1"
              >
                Cerrar sesión →
              </button>
            </div>
          </aside>

          {/* ── Main ──────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-5 lg:px-7
                             py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                    className="lg:hidden text-gray-500 hover:text-ink text-lg leading-none"
                    onClick={() => setSidebarAbierto(!sidebarAbierto)}
                    aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={sidebarAbierto}
                >
                  ☰
                </button>
                <div>
                  <h1 className="text-[17px] font-semibold tracking-tight text-ink">
                    {TITULOS[pagina] ?? 'Back-office'}
                  </h1>
                </div>
              </div>
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
                  bg-ink text-white text-[12px] font-medium
                  px-5 py-2.5 rounded-full shadow-modal
                  bottom-16 lg:bottom-5 animate-slideUp">
                {mensaje}
              </div>
          )}
        </div>
      </PrivateRoute>
  )
}

function Fallback({ texto }: { texto: string }) {
  return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-[13px] gap-2">
        <span className="w-4 h-4 border-2 border-gray-200 border-t-apple
                         rounded-full animate-spin" />
        {texto}
      </div>
  )
}