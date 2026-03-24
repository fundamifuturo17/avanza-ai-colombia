'use server'

import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface PerfilAspiranteData {
  userId: string
  email: string
  full_name: string
  document_id: string
  document_type: string
  phone?: string
  city?: string
  department?: string
}

export interface PerfilProveedorData {
  userId: string
  email: string
  full_name: string
  document_id: string
  document_type: string
  phone?: string
  cargo_entidad?: string
  entidad_id?: string
}

export async function crearPerfilAspirante(data: PerfilAspiranteData) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('profiles').insert({
    id: data.userId,
    role: 'aspirante',
    email: data.email,
    full_name: data.full_name,
    document_id: data.document_id,
    document_type: data.document_type,
    phone: data.phone || null,
    city: data.city || null,
    department: data.department || null,
    consentimiento_datos: true,
    fecha_consentimiento: new Date().toISOString(),
  })

  if (error) {
    console.error('Error creando perfil aspirante:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function crearPerfilProveedor(data: PerfilProveedorData) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('profiles').insert({
    id: data.userId,
    role: 'proveedor',
    email: data.email,
    full_name: data.full_name,
    document_id: data.document_id,
    document_type: data.document_type,
    phone: data.phone || null,
    cargo_entidad: data.cargo_entidad || null,
    entidad_id: data.entidad_id || null,
    consentimiento_datos: true,
    fecha_consentimiento: new Date().toISOString(),
  })

  if (error) {
    console.error('Error creando perfil proveedor:', error)
    return { error: error.message }
  }

  return { error: null }
}
