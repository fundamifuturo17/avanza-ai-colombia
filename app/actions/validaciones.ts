'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { insertarAuditLog } from '@/app/actions/audit'
import { insertarNotificacion } from '@/app/actions/notificaciones'

export async function procesarValidacion({
  empresaId,
  empresaNombre,
  accion,
  observaciones,
}: {
  empresaId: string
  empresaNombre: string
  accion: 'validar' | 'rechazar'
  observaciones: string
}) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('entidades')
    .update({ validado: accion === 'validar', activo: accion === 'validar' })
    .eq('id', empresaId)

  if (error) return { error: (error as any).message }

  // Notificar al usuario de la empresa (si tiene perfil vinculado)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: perfiles } = await (serviceClient as any)
    .from('profiles')
    .select('id')
    .eq('entidad_id', empresaId)
    .limit(1)

  if (perfiles && (perfiles as any[]).length > 0) {
    await insertarNotificacion({
      userId: (perfiles as any[])[0].id,
      titulo: accion === 'validar' ? 'Empresa verificada' : 'Verificación no aprobada',
      mensaje: accion === 'validar'
        ? `Tu empresa "${empresaNombre}" fue verificada. Ya puedes publicar vacantes.`
        : `La verificación de "${empresaNombre}" no fue aprobada. ${observaciones}`,
      tipo: 'sistema',
      referenciaId: empresaId,
    })
  }

  await insertarAuditLog({
    action: 'UPDATE',
    tableName: 'entidades',
    recordId: empresaId,
    oldData: { validado: false },
    newData: { validado: accion === 'validar', observaciones },
  })

  revalidatePath('/admin/validaciones')
  return { error: null }
}
