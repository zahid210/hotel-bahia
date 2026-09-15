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
    // Reinicia el temporizador: si llega un 2º mensaje, el toast dura 3s
    // desde el último y el anterior no lo cierra prematuramente.
    if (timerToast.current !== undefined) window.clearTimeout(timerToast.current)
    timerToast.current = window.setTimeout(() => {
      setMensaje(null)
      timerToast.current = undefined
    }, 3000)
  }, [])

  // Limpieza del timer al desmontar
  useEffect(() => () => {
    if (timerToast.current !== undefined) window.clearTimeout(timerToast.current)
  }, [])

  const abrirModal = useCallback(() => setModalAbierto(true), [])

  // ── Navegación según rol ────────────────────────────────────
  // LIMPIEZA solo ve el dashboard (estado de habitaciones y marcar listas).
  // Reportes/Usuarios son exclusivos de ADMIN.
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
    setSidebarAbierto(false)  // cierra el drawer en móvil al navegar
  }

  const esLimpieza = rol === 'LIMPIEZA'

  return (
      <PrivateRoute onLogin={() => mostrarMensaje('Sesión iniciada')}>

        <div className="flex h-screen bg-gray-50 overflow-hidden">

          {/* ── Overlay oscuro del sidebar en móvil ─────────────── */}
          {sidebarAbierto && (
              <div
                  className="lg:hidden fixed inset-0 bg-black/40 z-30"
                  onClick={() => setSidebarAbierto(false)}
              />
          )}

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className={[
            // Base
            'w-48 flex-shrink-0 bg-white border-r border-gray-100',
            'flex flex-col',
            // Móvil: drawer fijo deslizante desde la izquierda
            'fixed inset-y-0 left-0 z-40 transition-transform duration-200',
            // Desktop: relativo, siempre visible
            'lg:relative lg:translate-x-0',
            // Visibilidad en móvil según estado
            sidebarAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}>

            <div className="p-4 border-b border-gray-100">
              <div className="text-sm font-semibold tracking-wide">
                HOTEL BAHÍA
              </div>
              <div className="text-xs text-gray-400 mt-0.5 font-mono">
                Back-office
              </div>
            </div>

            <nav className="p-2 flex-1">
              {navItems
                  .filter(item => item.roles.includes((rol ?? 'ADMIN') as Rol))
                  .map(item => (
                  <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm
                            mb-1 transition-colors flex items-center gap-2
                  ${pagina === item.id
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <span className="text-xs opacity-70">{item.icon}</span>
                    {item.label}
                  </button>
              ))}

              {!esLimpieza && (
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                        onClick={() => { abrirModal(); setSidebarAbierto(false) }}
                        className="w-full text-left px-3 py-2 rounded-md text-sm
                           text-gray-500 hover:bg-gray-50 hover:text-gray-900
                           transition-colors flex items-center gap-2"
                    >
                      <span className="text-xs opacity-70">+</span>
                      Nueva reserva
                    </button>
                  </div>
              )}
            </nav>

            {/* Usuario */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center
                              justify-center text-white text-xs font-medium
                              flex-shrink-0">
                  {nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{nombre}</div>
                  <div className="text-xs text-gray-400 capitalize">
                    {rol?.toLowerCase()}
                  </div>
                </div>
              </div>
              <button
                  onClick={() => logout()}
                  className="w-full text-left text-xs text-gray-400
                         hover:text-red-500 transition-colors py-1"
              >
                Cerrar sesión →
              </button>
            </div>
          </aside>

          {/* ── Main ────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <header className="bg-white border-b border-gray-100 px-4 lg:px-6
                             py-3 flex items-center justify-between
                             flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Botón hamburguesa — solo visible en móvil */}
                <button
                    className="lg:hidden text-gray-500 hover:text-gray-900
                           text-lg leading-none"
                    onClick={() => setSidebarAbierto(!sidebarAbierto)}
                    aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={sidebarAbierto}
                >
                  ☰
                </button>
                <h1 className="text-sm font-medium">
                  {TITULOS[pagina] ?? 'Back-office'}
                </h1>
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

          {/* ── Modal Nueva Reserva ──────────────────────────────── */}
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

          {/* ── Toast ───────────────────────────────────────────── */}
          {mensaje && (
              <div className="fixed left-1/2 -translate-x-1/2 z-50
                  bg-gray-900 text-white text-xs font-medium
                  px-5 py-2.5 rounded-lg shadow-lg
                  bottom-16 lg:bottom-5">
                {mensaje}
              </div>
          )}
        </div>
      </PrivateRoute>
  )
}

function Fallback({ texto }: { texto: string }) {
  return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-500
                         rounded-full animate-spin" />
        {texto}
      </div>
  )
}