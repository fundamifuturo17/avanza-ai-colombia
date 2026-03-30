'use client'

import { createClient } from '@/lib/supabase/client'
import { useNotificacionesStore } from '@/stores/notificaciones-store'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'  // usado en "Marcar todas"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeDate } from '@/lib/utils'

export function NotificacionesBell() {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificacionesStore()
  const supabase = createClient()

  async function handleMarcarLeida(id: string) {
    marcarLeida(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('notificaciones').update({ leida: true }).eq('id', id)
  }

  async function handleMarcarTodas() {
    marcarTodasLeidas()
    const ids = notificaciones.filter((n) => !n.leida).map((n) => n.id)
    if (ids.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('notificaciones').update({ leida: true }).in('id', ids)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors outline-none">
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-lg border-slate-200">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-slate-500"
              onClick={handleMarcarTodas}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notificaciones.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Sin notificaciones
          </div>
        )}

        <div className="max-h-80 overflow-y-auto">
          {notificaciones.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer rounded-none focus:bg-slate-50 ${!n.leida ? 'bg-blue-50/60' : ''}`}
              onClick={() => !n.leida && handleMarcarLeida(n.id)}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.leida && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
                <p className={`text-xs flex-1 ${!n.leida ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                  {n.titulo}
                </p>
              </div>
              <p className="text-xs text-muted-foreground pl-3.5 leading-relaxed">{n.mensaje}</p>
              <p className="text-[10px] text-muted-foreground pl-3.5 mt-0.5">
                {formatRelativeDate(n.created_at)}
              </p>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
