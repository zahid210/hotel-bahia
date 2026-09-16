import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
    abierto: boolean
    titulo:  string
    onCerrar: () => void
    children: ReactNode
}

export function Modal({ abierto, titulo, onCerrar, children }: Props) {
    const tituloId = useId()
    const onCerrarRef = useRef(onCerrar)

    // Mantén la referencia más reciente sin re-disparar efectos.
    useEffect(() => {
        onCerrarRef.current = onCerrar
    }, [onCerrar])

    useEffect(() => {
        if (!abierto) return
        const anterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onCerrarRef.current()
            }
        }
        document.addEventListener('keydown', onKey, true)
        return () => {
            document.removeEventListener('keydown', onKey, true)
            document.body.style.overflow = anterior
        }
    }, [abierto])

    if (!abierto) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4
                 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            onClick={e => e.target === e.currentTarget && onCerrarRef.current()}
        >
            {/* Backdrop — blur + tint */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

            <div className="relative glass-strong rounded-lg
                          w-full max-w-md p-6 max-h-[90vh] overflow-y-auto
                          shadow-modal animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h2 id={tituloId} className="text-[15px] font-semibold text-ink">
                        {titulo}
                    </h2>
                    <button
                        onClick={() => onCerrarRef.current()}
                        aria-label="Cerrar"
                        className="w-7 h-7 flex items-center justify-center t-dot
                                   bg-gray-100 text-gray-500 hover:bg-gray-200
                                   hover:text-ink text-xs transition-colors leading-none"
                    >✕</button>
                </div>
                {children}
            </div>
        </div>
    )
}