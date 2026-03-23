import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { PrivateRoute } from '@/components/PrivateRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ReservasPage } from '@/features/reservas/ReservasPage'
import { ReportesPage } from '@/features/reportes/ReportesPage'
import { NuevaReservaForm } from '@/features/reservas/NuevaReservaForm'

type Pagina = 'dashboard' | 'reservas' | 'reportes'

export default function App() {
  const { nombre, rol, logout } = useAuthStore()
  const [pagina,       setPagina]       = useState<Pagina>('dashboard')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensaje,      setMensaje]      = useState<string | null>(null)
  const abrirModal = useCallback(() => setModalAbierto(true), [])

  const mostrarMensaje = useCallback((texto: string) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 3000)
  }, [])

  const navItems: { id: Pagina; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'reservas',  icon: '☰', label: 'Reservas'  },
    { id: 'reportes',  icon: '◎', label: 'Reportes'  },  // ← nuevo
  ]

  return (
      <PrivateRoute onLogin={() => mostrarMensaje('✅ Sesión iniciada')}>
        <div className="flex h-screen bg-gray-50 overflow-hidden">

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="w-48 flex-shrink-0 bg-white border-r border-gray-100
                          flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="text-sm font-semibold tracking-wide">HOTEL BAHIA</div>
              <div className="text-xs text-gray-400 mt-0.5 font-mono">Back-office</div>
            </div>

            <nav className="p-2 flex-1">
              {navItems.map(item => (
                  <button
                      key={item.id}
                      onClick={() => setPagina(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1
                            transition-colors flex items-center gap-2
                  ${pagina === item.id
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <span className="text-xs opacity-70">{item.icon}</span>
                    {item.label}
                  </button>
              ))}

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                    onClick={() => setModalAbierto(true)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm
                           text-gray-500 hover:bg-gray-50 hover:text-gray-900
                           transition-colors flex items-center gap-2"
                >
                  <span className="text-xs opacity-70">+</span>
                  Nueva reserva
                </button>
              </div>
            </nav>

            {/* Usuario */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center
                              justify-center text-white text-xs font-medium flex-shrink-0">
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

          {/* ── Main ────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-gray-100 px-6 py-3
                 flex items-center justify-between flex-shrink-0">
              <h1 className="text-sm font-medium capitalize">
                {/* Ajustamos para que muestre el nombre de la página actual */}
                {pagina === 'dashboard' ? 'Estado de habitaciones' : pagina}
              </h1>
            </header>

            {/* ── Contenido — overflow-hidden para que cada página controle su scroll */}
            <div className="flex-1 overflow-hidden p-6">
              {pagina === 'dashboard' && (
                  <DashboardPage onMensaje={mostrarMensaje} />
              )}
              {pagina === 'reservas' && (
                  <ReservasPage
                      onNuevaReserva={abrirModal}
                      onMensaje={mostrarMensaje}
                  />
              )}
              {/* NUEVO: Bloque de reportes */}
              {pagina === 'reportes' && (
                  <ReportesPage />
              )}
            </div>
          </main>

          {/* ── Modal Nueva Reserva ──────────────────────────── */}
          {modalAbierto && (
              <div
                  className="fixed inset-0 bg-black/40 z-50 flex items-center
                       justify-center p-4"
                  onClick={e => e.target === e.currentTarget && setModalAbierto(false)}
              >
                <div className="bg-white rounded-xl border border-gray-100 w-full
                            max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold">Nueva reserva</h2>
                    <button
                        onClick={() => setModalAbierto(false)}
                        className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                    >✕</button>
                  </div>
                  <NuevaReservaForm onSuccess={() => {
                    setModalAbierto(false)
                    mostrarMensaje('✅ Reserva confirmada correctamente')
                  }} />
                </div>
              </div>
          )}

          {/* ── Toast ───────────────────────────────────────── */}
          {mensaje && (
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50
                          bg-gray-900 text-white text-xs font-medium
                          px-5 py-2.5 rounded-lg shadow-lg
                          animate-[fadeIn_0.2s_ease]">
                {mensaje}
              </div>
          )}

        </div>
      </PrivateRoute>
  )
}