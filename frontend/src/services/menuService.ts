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
    'DESAYUNO', 'ALMUERZO', 'CENA', 'BEBIDAS', 'SNACKS',
] as const

export const LABEL_CATEGORIA: Record<string, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    CENA:     'Cena',
    BEBIDAS:  'Bebidas',
    SNACKS:   'Snacks',
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