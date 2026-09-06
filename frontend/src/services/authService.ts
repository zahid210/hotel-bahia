import { api } from './api'

export interface LoginForm {
    email:    string
    password: string
}

export interface AuthResponse {
    token:  string
    email:  string
    nombre: string
    rol:    string
}

export const authService = {
    login: (data: LoginForm) =>
        api.post<AuthResponse>('/auth/login', data).then(r => r.data),
}