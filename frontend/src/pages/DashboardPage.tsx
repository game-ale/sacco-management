import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import ThemeToggle from '../components/ThemeToggle'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, getProfile, logout } = useAuthStore()

  useEffect(() => {
    if (!user) {
      getProfile()
        .then(() => {
          const currentUser = useAuthStore.getState().user
          if (currentUser?.role === 'superadmin') {
            navigate('/super-admin', { replace: true })
          } else if (currentUser?.role === 'admin') {
            navigate('/admin', { replace: true })
          } else if (currentUser?.role === 'member') {
            navigate('/member', { replace: true })
          }
        })
        .catch(() => {
          navigate('/login')
        })
    } else if (user.role === 'superadmin') {
      navigate('/super-admin', { replace: true })
    } else if (user.role === 'admin') {
      navigate('/admin', { replace: true })
    } else if (user.role === 'member') {
      navigate('/member', { replace: true })
    }
  }, [user, getProfile, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">{t('common.appName')}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
              <LanguageSwitcher />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.welcome', { name: user?.name || 'User' })}</CardTitle>
              <CardDescription>{t('dashboard.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
