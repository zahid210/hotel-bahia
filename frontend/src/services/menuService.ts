import { api } from './api'

// ── Tipos espejo de MenuItemResponseDTO ──────────────────────
export interface MenuItem {
    id:          number
    nombre:      string
    descripcion: string | null
    categoria:   string
    precio:      number
    disponible:  boolean
}

export interface MenuItemForm {
    nombre:      string
    descripcion: string | null
    categoria:   string
    precio:      number
    disponible: boolean
}

export const CATEGORIAS = [
    'SNACKS', 'GALLETAS', 'DULCES', 'GASEOSAS', 'BEBIDAS',
] as const

export const LABEL_CATEGORIA: Record<string, string> = {
    SNACKS:   'Bocaditos',
    GALLETAS: 'Galletas',
    DULCES:   'Dulces',
    GASEOSAS: 'Gaseosas',
    BEBIDAS:  'Bebidas',
}

// ── Servicio ─────────────────────────────────────────────────
export const menuService = {
    listar: (soloDisponibles = false) =>
        api.get<MenuItem[]>('/menu', { params: { soloDisponibles } })
            .then(r => r.data),

    crear: (data: MenuItemForm) =>
        api.post<MenuItem>('/menu', data).then(r => r.data),

    actualizar: (id: number, data: MenuItemForm) =>
        api.put<MenuItem>(`/menu/${id}`, data).then(r => r.data),

    eliminar: (id: number) =>
        api.delete(`/menu/${id}`),
}