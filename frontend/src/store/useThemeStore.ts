import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tema = 'light' | 'dark' | 'system'

interface ThemeState {
    tema:    Tema
    setTema: (t: Tema) => void
    toggle:  () => void
}

/** Resuelve si el tema efectivo es oscuro según la preferencia. */
function esOscuro(tema: Tema): boolean {
    if (tema === 'dark')  return true
    if (tema === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Aplica el tema al <html> (clase .dark + color-scheme). */
export function aplicarTema(tema: Tema) {
    const dark = esOscuro(tema)
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            tema: 'system',

            setTema: (tema) => {
                aplicarTema(tema)
                set({ tema })
            },

            toggle: () => {
                // Alterna entre claro y oscuro según el estado visible actual.
                const actual = get().tema
                const siguiente: Tema = esOscuro(actual) ? 'light' : 'dark'
                aplicarTema(siguiente)
                set({ tema: siguiente })
            },
        }),
        {
            name: 'hotel-theme',
            partialize: (s) => ({ tema: s.tema }),
            onRehydrateStorage: () => (state) => {
                if (state) aplicarTema(state.tema)
            },
        }
    )
)
