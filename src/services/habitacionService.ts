import { api } from './api'

export interface Habitacion {
    id: number
    numero: string
    piso: number
    tipo: 'SIMPLE' | 'DOBLE' | 'SUITE' | 'FAMILIAR'
    capacidad: number
    precioNoche: number
    estado: 'LIBRE' | 'OCUPADA' | 'MANTENIMIENTO' | 'LIMPIEZA'
    descripcion: string | null
}

export const habitacionService = {
    listarTodas: () => api.get<Habitacion[]>('/habitaciones').then(r => r.data),
    listarLibres: () => api.get<Habitacion[]>('/habitaciones/libres').then(r => r.data),
    cambiarEstado: (id: number, estado: string) =>
        api.patch<Habitacion>(`/habitaciones/${id}/estado?estado=${estado}`).then(r => r.data),
}