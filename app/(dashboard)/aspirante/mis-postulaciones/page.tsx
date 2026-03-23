import { createClient } from '@/lib/supabase/server'
import { PostulacionesPipeline } from '@/components/shared/postulaciones-pipeline'

export default async function MisPostulacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select(`
      id, estado, codigo_seguimiento, created_at, updated_at,
      vacantes (
        id, titulo, fecha_cierre, tipo_contrato, departamento,
        entidades (nombre, tipo)
      ),
      postulacion_historial (
        id, estado_anterior, estado_nuevo, justificacion, created_at,
        profiles (full_name, role)
      )
    `)
    .eq('aspirante_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mis postulaciones</h1>
        <p className="text-sm text-muted-foreground">
          {postulaciones?.length ?? 0} postulaciones · Estado actualizado en tiempo real
        </p>
      </div>
      <PostulacionesPipeline
        postulacionesIniciales={postulaciones as any ?? []}
        userId={user!.id}
      />
    </div>
  )
}
