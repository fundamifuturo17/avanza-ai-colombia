'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificacionesStore } from '@/stores/notificaciones-store'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  tipo: string
  referencia_id: string | null
  created_at: string
}

export function NotificacionesInitializer({
  notificaciones,
  userId,
}: {
  notificaciones: Notificacion[]
  userId: string
}) {
  const { setNotificaciones, agregarNotificacion } = useNotificacionesStore()

  useEffect(() => {
    setNotificaciones(notificaciones)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notificaciones-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          agregarNotificacion(payload.new as Notificacion)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, agregarNotificacion])

  return null
}
