import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas protegidas
  const protectedPaths = ['/aspirante', '/proveedor', '/empresa', '/admin']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si ya tiene sesión, no puede ir a login/registro
  if (user && (pathname === '/login' || pathname.startsWith('/registro'))) {
    const url = request.nextUrl.clone()
    // Redirigir según rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const roleMap: Record<string, string> = {
      aspirante: '/aspirante/oportunidades',
      proveedor: '/proveedor',
      empresa_privada: '/empresa',
      admin: '/admin/transparencia',
    }

    url.pathname = roleMap[(profile as any)?.role ?? 'aspirante'] ?? '/aspirante/oportunidades'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
