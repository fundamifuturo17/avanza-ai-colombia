import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignorar errores — siempre redirigir
  }
  const origin = request.nextUrl.origin
  const response = NextResponse.redirect(new URL('/login', origin))
  // Limpiar cookies de sesión manualmente
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  return response
}
