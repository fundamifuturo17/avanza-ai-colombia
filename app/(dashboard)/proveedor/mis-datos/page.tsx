import { createClient } from '@/lib/supabase/server'
import { MisDatosClient } from '@/components/shared/mis-datos-client'

export default async function MisDatosProveedorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, arcoRes] = await Promise.all([
    (supabase.from('profiles') as any).select('*').eq('id', user!.id).maybeSingle(),
    (supabase.from('solicitudes_arco') as any).select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mis datos</h1>
        <p className="text-sm text-muted-foreground">
          Tus derechos ARCO: Acceso, Rectificación, Cancelación y Oposición · Ley 1581 de 2012
        </p>
      </div>
      <MisDatosClient
        profile={profileRes.data}
        solicitudesArco={arcoRes.data ?? []}
      />
    </div>
  )
}
