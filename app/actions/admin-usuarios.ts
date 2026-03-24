'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

  const { error: profileError } = await adminClient.from('profiles').insert({
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

  revalidatePath('/admin/usuarios')
  return { error: null }
}

export async function eliminarUsuario(userId: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { error: null }
}
