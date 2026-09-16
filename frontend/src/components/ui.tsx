import type { ReactNode } from 'react'

// ── Botón circular de refrescar ────────────────────────────────
export function RefreshButton({
    onClick,
    cargando = false,
    ariaLabel,
    titulo,
    className = '',
}: {
    onClick: () => void | Promise<void>
    cargando?: boolean
    ariaLabel: string
    titulo?: string
    className?: string
}) {
    return (
        <button
            type="button"
            onClick={() => void onClick()}
            disabled={cargando}
            aria-label={ariaLabel}
            title={titulo ?? ariaLabel}
            className={`t-btn-ghost min-w-[32px] ${className}`}
        >
            {cargando
                ? <span className="w-3 h-3 border-2 border-gray-200
                     border-t-apple t-spin animate-spin" />
                : '↻'}
        </button>
    )
}

// ── Botón de acción en filas de tablas ─────────────────────────
const COLORES_ACCION = {
    apple: 'text-apple hover:underline',
    verde: 'text-green-600 hover:underline',
    gris:  'text-gray-400 hover:text-red-500',
} as const

export function RowAction({
    onClick,
    disabled = false,
    color = 'apple',
    title,
    children,
}: {
    onClick: () => void
    disabled?: boolean
    color?: keyof typeof COLORES_ACCION
    title?: string
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`px-2 py-1 text-[12px] transition-colors
                disabled:opacity-40 ${COLORES_ACCION[color]}`}
        >
            {children}
        </button>
    )
}

// ── Pie de formulario: Cancelar + acción ───────────────────────
export function FormActions({
    onCancelar,
    onGuardar,
    guardando = false,
    texto,
    textoGuardando,
    minAncho = '',
}: {
    onCancelar: () => void
    onGuardar: () => void
    guardando?: boolean
    texto: string
    textoGuardando?: string
    minAncho?: string
}) {
    return (
        <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancelar} className="t-btn-ghost">
                Cancelar
            </button>
            <button
                type="button"
                onClick={onGuardar}
                disabled={guardando}
                className={`t-btn-primary ${minAncho}`}
            >
                {guardando ? (textoGuardando ?? texto) : texto}
            </button>
        </div>
    )
}

// ── Banner de error ────────────────────────────────────────────
export function ErrorBanner({
    children,
    variante = 'lg',
    className = '',
    onRetry,
}: {
    children: ReactNode
    variante?: 'lg' | 'sm'
    className?: string
    onRetry?: () => void
}) {
    const base = variante === 'sm'
        ? 'p-2.5 rounded-xl text-[12px]'
        : 'p-3 rounded-2xl text-[13px]'
    return (
        <div className={`bg-red-50 border border-red-200 text-red-700 ${base}
                ${onRetry ? 'flex items-center gap-3' : ''} ${className}`}>
            <span>⚠ {children}</span>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="ml-auto shrink-0 text-apple hover:underline
                             text-[12px] font-medium"
                >
                    Reintentar
                </button>
            )}
        </div>
    )
}

// ── Acciones de toolbar: refrescar + crear ─────────────────────
export function ToolbarActions({
    onRefresh,
    cargando = false,
    refreshAriaLabel,
    refreshTitulo,
    crear,
}: {
    onRefresh: () => void | Promise<void>
    cargando?: boolean
    refreshAriaLabel: string
    refreshTitulo?: string
    crear?: { onClick: () => void; label: string }
}) {
    return (
        <>
            <RefreshButton
                onClick={onRefresh}
                cargando={cargando}
                ariaLabel={refreshAriaLabel}
                titulo={refreshTitulo}
            />
            {crear && (
                <button type="button" onClick={crear.onClick} className="t-btn-primary">
                    {crear.label}
                </button>
            )}
        </>
    )
}