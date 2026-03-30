import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { NotificacionesInitializer } from '@/components/layout/notificaciones-initializer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, notificacionesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, full_name, email, entidad_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('notificaciones')
      .select('id, titulo, mensaje, leida, tipo, referencia_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  if (!profileRes.data) redirect('/api/signout')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NotificacionesInitializer
        notificaciones={notificacionesRes.data ?? []}
        userId={user.id}
      />
      <DashboardNav profile={profileRes.data} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
