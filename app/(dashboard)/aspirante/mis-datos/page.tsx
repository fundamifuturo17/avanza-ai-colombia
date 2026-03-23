import { createClient } from '@/lib/supabase/server'
import { MisDatosClient } from '@/components/shared/mis-datos-client'

export default async function MisDatosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, arcoRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('solicitudes_arco').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
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
        profile={profileRes.data as any}
        solicitudesArco={arcoRes.data as any ?? []}
      />
    </div>
  )
}
