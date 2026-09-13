import { api } from './api'

// ── Tipos espejo de UsuarioResponseDTO ────────────────────────
export interface Usuario {
    id:        string
    nombre:    string
    email:     string
    rol:       'ADMIN' | 'RECEPCIONISTA' | 'LIMPIEZA'
    activo:    boolean
    createdAt: string
}

export interface UsuarioForm {
    nombre:   string
    email:    string
    password: string
    rol:      Usuario['rol']
}

export interface UsuarioUpdate {
    nombre: string
    email:  string
    rol:    Usuario['rol']
    activo: boolean
}

export const LABEL_ROL: Record<Usuario['rol'], string> = {
    ADMIN:         'Administrador',
    RECEPCIONISTA: 'Recepcionista',
    LIMPIEZA:      'Limpieza',
}

// ── Servicio ─────────────────────────────────────────────────
export const usuarioService = {
    listar: () =>
        api.get<Usuario[]>('/usuarios').then(r => r.data),

    crear: (data: UsuarioForm) =>
        api.post<Usuario>('/usuarios', data).then(r => r.data),

    actualizar: (id: string, data: UsuarioUpdate) =>
        api.put<Usuario>(`/usuarios/${id}`, data).then(r => r.data),

    resetPassword: (id: string, password: string) =>
        api.patch<Usuario>(`/usuarios/${id}/password`, { password })
            .then(r => r.data),
}