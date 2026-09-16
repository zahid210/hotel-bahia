import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { authService, LoginForm } from '@/services/authService'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'

interface Props {
    onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
    const [error,    setError]    = useState<string | null>(null)
    const [cargando, setCargando] = useState(false)
    const setAuth = useAuthStore(s => s.setAuth)
    const { tema, toggle } = useThemeStore()

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

    const lbl = 't-label'
    const campo = 't-input'

    return (
        <div className="min-h-screen flex items-center justify-center p-5 antialiased relative">

            {/* Toggle de tema */}
            <button
                onClick={toggle}
                aria-label="Cambiar tema"
                title="Cambiar tema"
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center
                           rounded-md text-[15px] text-gray-500 hover:text-ink
                           hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors z-10"
            >
                {tema === 'dark' ? '☀' : '☾'}
            </button>

            <div className="w-full max-w-sm relative z-10">
                {/* Logo y título */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-11 h-11
                          rounded-xl bg-brand mb-5 text-white text-[15px] font-bold">
                        HB
                    </div>
                    <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                        Hotel Bahía
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Panel de recepción
                    </p>
                </div>

                {/* Card de login */}
                <div className="t-card p-8">
                    <h2 className="text-[15px] font-semibold text-ink mb-6">
                        Iniciar sesión
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-md
                              bg-red-50 border border-red-200 text-red-700 text-[12px]">
                                <span>⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className={lbl}>
                                Correo electrónico
                            </label>
                            <input
                                id="email"
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
                                <p className="text-[11px] text-red-500 mt-1.5">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className={lbl}>
                                Contraseña
                            </label>
                            <input
                                id="password"
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
                                <p className="text-[11px] text-red-500 mt-1.5">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="t-btn-primary w-full py-2.5 mt-1"
                        >
                            {cargando ? (
                                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30
                                   border-t-white t-spin animate-spin" />
                  Verificando...
                </span>
                            ) : 'Entrar'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[11px] text-gray-400 mt-6">
                    © {new Date().getFullYear()} Hotel Bahía
                </p>
            </div>
        </div>
    )
}