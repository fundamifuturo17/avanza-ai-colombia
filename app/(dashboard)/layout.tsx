import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/layout/dashboard-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, entidad_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/api/signout')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardNav profile={profile} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
