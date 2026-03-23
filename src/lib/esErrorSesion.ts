import { SesionExpiradaError } from '@/services/api'

// Devuelve true si el error es de sesión expirada.
// Úsalo en los catch de cualquier componente para
// ignorar el error y dejar que PrivateRoute tome el control.
export const esSesionExpirada = (error: unknown): boolean =>
    error instanceof SesionExpiradaError