import { createClient } from '@/lib/supabase/server'
import { NuevaVacanteForm } from '@/components/forms/nueva-vacante-form'

export default async function NuevaVacantePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('entidad_id, role, entidades(nombre, tipo)')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nueva vacante</h1>
        <p className="text-sm text-muted-foreground">
          {(profile?.entidades as any)?.nombre}
        </p>
      </div>
      <NuevaVacanteForm
        entidadId={profile!.entidad_id!}
        userId={user!.id}
        esPublico={(profile?.entidades as any)?.tipo === 'publico'}
      />
    </div>
  )
}
