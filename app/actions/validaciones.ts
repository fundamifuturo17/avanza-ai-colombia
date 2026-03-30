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
  accion: 'validar' | 'rechazar' | 'revocar'
  observaciones: string
}) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const validado = accion === 'validar'
  const activo = accion !== 'rechazar'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('entidades')
    .update({ validado, activo })
    .eq('id', empresaId)

  if (error) return { error: (error as any).message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: perfiles } = await (serviceClient as any)
    .from('profiles')
    .select('id')
    .eq('entidad_id', empresaId)
    .limit(1)

  if (perfiles && (perfiles as any[]).length > 0) {
    const titulos = {
      validar: 'Empresa verificada',
      rechazar: 'Verificación no aprobada',
      revocar: 'Validación revocada',
    }
    const mensajes = {
      validar: `Tu empresa "${empresaNombre}" fue verificada. Ya puedes publicar vacantes.`,
      rechazar: `La verificación de "${empresaNombre}" no fue aprobada. ${observaciones}`,
      revocar: `La validación de "${empresaNombre}" fue revocada. ${observaciones}`,
    }
    await insertarNotificacion({
      userId: (perfiles as any[])[0].id,
      titulo: titulos[accion],
      mensaje: mensajes[accion],
      tipo: 'sistema',
      referenciaId: empresaId,
    })
  }

  await insertarAuditLog({
    action: 'UPDATE',
    tableName: 'entidades',
    recordId: empresaId,
    oldData: { validado: accion !== 'validar' },
    newData: { validado, activo, observaciones },
  })

  revalidatePath('/admin/validaciones')
  return { error: null }
}
