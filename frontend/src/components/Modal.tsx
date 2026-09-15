import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

// ── Modal accesible ───────────────────────────────────────────
// - Cierra con Escape
// - Mueve el foco al botón "Cerrar" al abrir
// - aria-labelledby / aria-modal / role="dialog"
// - Bloquea el scroll del fondo mientras está abierto
// - Estilo Apple: blur backdrop, rounded-2xl, sombra modal suave
interface Props {
    abierto: boolean
    titulo:  string
    onCerrar: () => void
    children: ReactNode
}

export function Modal({ abierto, titulo, onCerrar, children }: Props) {
    const tituloId = useId()
    const cerrarRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!abierto) return
        cerrarRef.current?.focus()
        const anterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onCerrar()
            }
        }
        document.addEventListener('keydown', onKey, true)
        return () => {
            document.removeEventListener('keydown', onKey, true)
            document.body.style.overflow = anterior
        }
    }, [abierto, onCerrar])

    if (!abierto) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4
                 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            onClick={e => e.target === e.currentTarget && onCerrar()}
        >
            {/* Backdrop Apple — blur + tint */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            <div className="relative bg-white rounded-2xl border border-gray-200/60
                          w-full max-w-md p-6 max-h-[90vh] overflow-y-auto
                          shadow-modal animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h2 id={tituloId} className="text-[15px] font-semibold text-ink">
                        {titulo}
                    </h2>
                    <button
                        ref={cerrarRef}
                        onClick={onCerrar}
                        aria-label="Cerrar"
                        className="w-7 h-7 flex items-center justify-center rounded-full
                                   bg-gray-100 text-gray-500 hover:bg-gray-200
                                   hover:text-ink text-xs transition-colors leading-none"
                    >✕</button>
                </div>
                {children}
            </div>
        </div>
    )
}