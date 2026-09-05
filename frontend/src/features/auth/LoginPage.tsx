import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { authService, LoginForm } from '@/services/authService'
import { useAuthStore } from '@/store/useAuthStore'

interface Props {
    onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
    const [error,    setError]    = useState<string | null>(null)
    const [cargando, setCargando] = useState(false)
    const setAuth = useAuthStore(s => s.setAuth)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

    const onSubmit = async (data: LoginForm) => {
        setCargando(true)
        setError(null)
        try {
            const res = await authService.login(data)
            setAuth(res.token, res.email, res.nombre, res.rol)
            onLogin()
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message)
            } else {
                setError('Ocurrió un error inesperado')
            }
        } finally {
            setCargando(false)
        }
    }

    const campo = `
    w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
    bg-gray-50 focus:outline-none focus:border-gray-900 focus:bg-white
    transition-colors placeholder:text-gray-300
  `

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

            <div className="w-full max-w-sm relative z-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12
                          bg-gray-900 rounded-xl mb-4">
                        <span className="text-white text-lg font-bold font-mono">H</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Hotel Bahia</h1>
                    <p className="text-sm text-gray-400 mt-1">Panel de recepción</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h2 className="text-sm font-medium text-gray-700 mb-6">
                        Iniciar sesión
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Error global */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200
                              rounded-lg text-red-700 text-xs">
                                <span>⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                {...register('email', {
                                    required: 'El email es obligatorio',
                                    pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' }
                                })}
                                type="email"
                                placeholder="zahidmatos@hotel.com"
                                className={campo}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Contraseña
                            </label>
                            <input
                                {...register('password', {
                                    required: 'La contraseña es obligatoria',
                                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                                })}
                                type="password"
                                placeholder="••••••••"
                                className={campo}
                                autoComplete="current-password"
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full py-3 bg-gray-900 text-white text-sm font-medium
                         rounded-lg hover:bg-gray-800 disabled:opacity-50
                         transition-colors mt-2"
                        >
                            {cargando ? (
                                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30
                                   border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
                            ) : 'Entrar'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    )
}