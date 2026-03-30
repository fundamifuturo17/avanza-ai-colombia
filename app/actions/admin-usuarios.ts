'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { insertarAuditLog } from '@/app/actions/audit'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function crearUsuarioAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const document_id = formData.get('document_id') as string
  const document_type = (formData.get('document_type') as string) || 'CC'
  const role = formData.get('role') as string
  const phone = (formData.get('phone') as string) || null
  const city = (formData.get('city') as string) || null
  const department = (formData.get('department') as string) || null
  const entidad_id = (formData.get('entidad_id') as string) || null
  const cargo_entidad = (formData.get('cargo_entidad') as string) || null

  const adminClient = createAdminClient()

  // Crear auth user con Admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return { error: authError.message }
  }

  const { error: profileError } = await adminClient.from('profiles').upsert({
    id: authData.user.id,
    role: role as any,
    email,
    full_name,
    document_id,
    document_type,
    phone,
    city,
    department,
    entidad_id: entidad_id || null,
    cargo_entidad: cargo_entidad || null,
    consentimiento_datos: true,
    fecha_consentimiento: new Date().toISOString(),
  })

  if (profileError) {
    // Revertir: eliminar el auth user si falla el perfil
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  await insertarAuditLog({
    action: 'INSERT',
    tableName: 'profiles',
    recordId: authData.user.id,
    newData: { email, role, full_name },
  })

  revalidatePath('/admin/usuarios')
  return { error: null }
}

export async function eliminarUsuario(userId: string) {
  const adminClient = createAdminClient()

  // Borrar registros relacionados en orden para evitar FK violations
  await adminClient.from('postulacion_historial' as any).delete().eq('cambiado_por', userId)
  await adminClient.from('postulaciones' as any).delete().eq('aspirante_id', userId)
  await adminClient.from('solicitudes_arco' as any).delete().eq('user_id', userId)
  await adminClient.from('notificaciones' as any).delete().eq('user_id', userId)

  // Vacantes creadas por este usuario (y sus postulaciones/historial en cascada)
  const { data: vacantes } = await adminClient.from('vacantes' as any).select('id').eq('created_by', userId)
  if (vacantes?.length) {
    const vacanteIds = (vacantes as any[]).map((v) => v.id)
    await adminClient.from('postulacion_historial' as any).delete().in('postulacion_id',
      (await adminClient.from('postulaciones' as any).select('id').in('vacante_id', vacanteIds)).data?.map((p: any) => p.id) ?? []
    )
    await adminClient.from('postulaciones' as any).delete().in('vacante_id', vacanteIds)
    await adminClient.from('vacantes' as any).delete().in('id', vacanteIds)
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  await insertarAuditLog({
    action: 'DELETE',
    tableName: 'profiles',
    recordId: userId,
  })

  revalidatePath('/admin/usuarios')
  return { error: null }
}
