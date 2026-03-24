'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/constants'
import { getInitials, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
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
    { href: '/proveedor/mis-datos', label: 'Mis datos', icon: <User className="h-4 w-4" /> },
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
    <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:block">AVANZA AI</span>
        </Link>

        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1.5 whitespace-nowrap text-xs rounded-lg h-8 px-3 transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/15'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {link.icon}
                  {link.label}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg">
            <Bell className="h-4 w-4" />
            {noLeidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-lg hover:bg-slate-100 transition-colors outline-none">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] font-bold bg-primary text-white">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-slate-700 hidden sm:block max-w-28 truncate">{profile.full_name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-slate-200">
              <div className="px-2 py-2 space-y-1">
                <p className="text-sm font-semibold truncate text-slate-900">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                <Badge variant="secondary" className="text-xs mt-1 font-medium">{ROLE_LABELS[profile.role]}</Badge>
              </div>
              <DropdownMenuSeparator />
              {profile.role === 'aspirante' && (
                <DropdownMenuItem onClick={() => router.push('/aspirante/mis-datos')} className="cursor-pointer rounded-lg">
                  <User className="mr-2 h-4 w-4" />
                  Mis datos
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer rounded-lg focus:bg-red-50 focus:text-red-700">
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
