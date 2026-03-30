'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificacionesStore } from '@/stores/notificaciones-store'

const POLL_INTERVAL = 30_000 // 30 segundos

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
  const lastCreatedAt = useRef<string | null>(
    notificaciones.length > 0 ? notificaciones[0].created_at : null
  )

  useEffect(() => {
    setNotificaciones(notificaciones)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const supabase = createClient()

    async function poll() {
      const query = (supabase as any)
        .from('notificaciones')
        .select('id, titulo, mensaje, leida, tipo, referencia_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (lastCreatedAt.current) {
        query.gt('created_at', lastCreatedAt.current)
      }

      const { data } = await query

      if (data && data.length > 0) {
        data.forEach((n: Notificacion) => agregarNotificacion(n))
        lastCreatedAt.current = data[0].created_at
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [userId, agregarNotificacion])

  return null
}
