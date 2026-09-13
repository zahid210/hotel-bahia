import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

// ── Modal accesible ───────────────────────────────────────────
// - Cierra con Escape
// - Mueve el foco al botón "Cerrar" al abrir
// - aria-labelledby / aria-modal / role="dialog"
// - Bloquea el scroll del fondo mientras está abierto
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center
                 justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            onClick={e => e.target === e.currentTarget && onCerrar()}
        >
            <div className="bg-white rounded-xl border border-gray-100 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 id={tituloId} className="text-sm font-semibold">{titulo}</h2>
                    <button
                        ref={cerrarRef}
                        onClick={onCerrar}
                        aria-label="Cerrar"
                        className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                    >✕</button>
                </div>
                {children}
            </div>
        </div>
    )
}