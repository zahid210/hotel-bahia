import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
    token:   string | null
    email:   string | null
    nombre:  string | null
    rol:     string | null
    isAuth:  boolean

    setAuth:  (token: string, email: string, nombre: string, rol: string) => void
    logout:   () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token:  null,
            email:  null,
            nombre: null,
            rol:    null,
            isAuth: false,

            setAuth: (token, email, nombre, rol) =>
                set({ token, email, nombre, rol, isAuth: true }),

            logout: () =>
                set({ token: null, email: null, nombre: null, rol: null, isAuth: false }),
        }),
        {
            name: 'hotel-auth',   // clave en localStorage
            // Persistir solo datos de sesión (nunca acciones/estado auxiliar)
            partialize: (s) => ({
                token:  s.token,
                email:  s.email,
                nombre: s.nombre,
                rol:    s.rol,
                isAuth: s.isAuth,
            }),
        }
    )
)