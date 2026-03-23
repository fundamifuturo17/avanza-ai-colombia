'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, ROLE_LABELS } from '@/lib/constants'
import { getInitials, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Briefcase, LayoutDashboard, FileText, User, Shield,
  LogOut, Bell, Bot, Building2, ClipboardList,
  BarChart3, Users, CheckSquare, MessageSquare,
} from 'lucide-react'
import { useNotificacionesStore } from '@/stores/notificaciones-store'
import type { UserRole } from '@/types/database'

interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string | null
  entidad_id: string | null
}

const NAV_LINKS: Record<UserRole, { href: string; label: string; icon: React.ReactNode }[]> = {
  aspirante: [
    { href: '/aspirante/oportunidades', label: 'Oportunidades', icon: <Briefcase className="h-4 w-4" /> },
    { href: '/aspirante/orientacion', label: 'Orientación IA', icon: <Bot className="h-4 w-4" /> },
    { href: '/aspirante/mis-postulaciones', label: 'Mis postulaciones', icon: <FileText className="h-4 w-4" /> },
    { href: '/aspirante/mis-datos', label: 'Mis datos', icon: <User className="h-4 w-4" /> },
  ],
  proveedor: [
    { href: '/proveedor', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/proveedor/vacantes', label: 'Vacantes', icon: <Briefcase className="h-4 w-4" /> },
    { href: '/proveedor/postulaciones', label: 'Postulaciones', icon: <ClipboardList className="h-4 w-4" /> },
  ],
  empresa_privada: [
    { href: '/empresa', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/empresa/vacantes', label: 'Vacantes', icon: <Briefcase className="h-4 w-4" /> },
    { href: '/empresa/postulaciones', label: 'Postulaciones', icon: <ClipboardList className="h-4 w-4" /> },
  ],
  admin: [
    { href: '/admin/transparencia', label: 'Transparencia', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/admin/validaciones', label: 'Validaciones', icon: <CheckSquare className="h-4 w-4" /> },
    { href: '/admin/solicitudes-arco', label: 'ARCO', icon: <MessageSquare className="h-4 w-4" /> },
    { href: '/admin/auditoria', label: 'Auditoría', icon: <Shield className="h-4 w-4" /> },
    { href: '/admin/usuarios', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
  ],
}

export function DashboardNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const noLeidas = useNotificacionesStore((s) => s.noLeidas)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = NAV_LINKS[profile.role] ?? []

  return (
    <nav className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold text-blue-700 shrink-0 text-sm">
          AVANZA AI
        </Link>

        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href || pathname.startsWith(link.href + '/') ? 'secondary' : 'ghost'}
                size="sm"
                className={cn('gap-1.5 whitespace-nowrap text-xs', pathname.startsWith(link.href) && 'font-medium')}
              >
                {link.icon}
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs hidden sm:block max-w-24 truncate">{profile.full_name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="text-xs font-medium truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="text-xs mt-1">{ROLE_LABELS[profile.role]}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
