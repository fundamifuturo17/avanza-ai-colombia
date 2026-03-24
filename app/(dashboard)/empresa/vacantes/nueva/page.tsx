import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NuevaVacanteForm } from '@/components/forms/nueva-vacante-form'

export default async function EmpresaNuevaVacantePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('entidad_id, entidades(nombre, validado, tipo)')
    .eq('id', user!.id)
    .maybeSingle()

  const entidad = profile?.entidades
  if (!entidad?.validado) redirect('/empresa')

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nueva vacante</h1>
        <p className="text-sm text-muted-foreground">{entidad?.nombre}</p>
      </div>
      <NuevaVacanteForm
        entidadId={profile?.entidad_id ?? ''}
        userId={user!.id}
        esPublico={false}
      />
    </div>
  )
}
