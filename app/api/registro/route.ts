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
    const { email, password, role, full_name, cargo_entidad } = body

    const adminClient = createAdminClient()

    // Crear usuario en auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Crear perfil
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: authData.user.id,
      role,
      email,
      full_name,
      document_id: 'PENDIENTE',
      document_type: 'CC',
      cargo_entidad: cargo_entidad || null,
      consentimiento_datos: true,
      fecha_consentimiento: new Date().toISOString(),
    } as any)

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ error: null })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
