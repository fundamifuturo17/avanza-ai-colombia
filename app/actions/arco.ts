'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { insertarAuditLog } from '@/app/actions/audit'
import { insertarNotificacion } from '@/app/actions/notificaciones'
import type { ArcoEstado } from '@/types/database'
import { ARCO_TIPO_LABELS } from '@/lib/constants'

const ESTADO_LABELS: Record<string, string> = {
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
  escalada: 'Escalada a legal',
  rechazada: 'Rechazada',
}

export async function procesarSolicitudArco({
  solicitudId,
  userId,
  tipo,
  estadoAnterior,
  nuevoEstado,
  respuesta,
}: {
  solicitudId: string
  userId: string
  tipo: string
  estadoAnterior: string
  nuevoEstado: ArcoEstado
  respuesta: string
}) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('solicitudes_arco')
    .update({ estado: nuevoEstado, respuesta })
    .eq('id', solicitudId)

  if (error) return { error: error.message }

  await insertarNotificacion({
    userId,
    titulo: `Solicitud ARCO: ${ARCO_TIPO_LABELS[tipo] ?? tipo}`,
    mensaje: `Tu solicitud fue actualizada a: ${ESTADO_LABELS[nuevoEstado] ?? nuevoEstado}. ${respuesta}`,
    tipo: 'arco',
    referenciaId: solicitudId,
  })

  await insertarAuditLog({
    action: 'UPDATE',
    tableName: 'solicitudes_arco',
    recordId: solicitudId,
    oldData: { estado: estadoAnterior },
    newData: { estado: nuevoEstado, respuesta },
  })

  revalidatePath('/admin/solicitudes-arco')
  return { error: null }
}
