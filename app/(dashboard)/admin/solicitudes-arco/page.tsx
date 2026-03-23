import { createClient } from '@/lib/supabase/server'
import { ArcoAdminClient } from '@/components/shared/arco-admin-client'

export default async function AdminArcoPage() {
  const supabase = await createClient()

  const { data: solicitudes } = await supabase
    .from('solicitudes_arco')
    .select(`
      id, tipo, estado, descripcion, respuesta, fecha_limite, created_at,
      profiles!user_id (full_name, email, document_id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Solicitudes ARCO</h1>
        <p className="text-sm text-muted-foreground">
          Ley 1581 de 2012 · Plazo máximo de respuesta: 10 días hábiles
        </p>
      </div>
      <ArcoAdminClient solicitudes={solicitudes as any ?? []} />
    </div>
  )
}
