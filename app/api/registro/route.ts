import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role, full_name, cargo_entidad, entidad_nombre } = body

    const adminClient = createAdminClient()

    // Crear usuario en auth (el trigger handle_new_user crea un perfil parcial automáticamente)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Si es proveedor, crear la entidad primero
    let entidadId: string | null = null
    if (role === 'proveedor' && entidad_nombre) {
      const { data: entidad, error: entidadError } = await adminClient
        .from('entidades')
        .insert({
          nombre: entidad_nombre,
          tipo: 'publico',
          nit: `PEND-${authData.user.id.slice(0, 8)}`,
          validado: false,
          activo: true,
        })
        .select('id')
        .single()

      if (entidadError) {
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: entidadError.message }, { status: 400 })
      }
      entidadId = entidad.id
    }

    // Upsert perfil: maneja el conflicto con el trigger handle_new_user
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role,
        email,
        full_name,
        document_id: 'PENDIENTE',
        document_type: 'CC',
        cargo_entidad: cargo_entidad || null,
        entidad_id: entidadId,
        consentimiento_datos: true,
        fecha_consentimiento: new Date().toISOString(),
      } as any, { onConflict: 'id' })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ error: null })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
