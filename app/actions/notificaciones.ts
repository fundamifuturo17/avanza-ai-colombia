'use server'

import { createServiceClient } from '@/lib/supabase/server'

export async function insertarNotificacion({
  userId,
  titulo,
  mensaje,
  tipo,
  referenciaId,
}: {
  userId: string
  titulo: string
  mensaje: string
  tipo: string
  referenciaId?: string
}) {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notificaciones').insert({
    user_id: userId,
    titulo,
    mensaje,
    tipo,
    referencia_id: referenciaId ?? null,
  })
  if (error) console.error('[notificaciones] insert error:', error.message)
}
