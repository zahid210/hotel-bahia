import { useAuthStore } from '@/store/useAuthStore.ts'
import { LoginPage } from '@/features/auth/LoginPage.tsx'

interface Props {
    children: React.ReactNode
    onLogin: () => void
}

export function PrivateRoute({ children, onLogin }: Props) {
    const isAuth = useAuthStore(s => s.isAuth)

    if (!isAuth) {
        return <LoginPage onLogin={onLogin} />
    }

    return <>{children}</>
}