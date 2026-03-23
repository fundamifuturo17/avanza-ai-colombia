import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { EvaluacionPostulantes } from '@/components/shared/evaluacion-postulantes'
import { POSTULACION_ESTADO_LABELS } from '@/lib/constants'

export default async function EmpresaPostulacionesVacantePage({
  params,
}: {
  params: Promise<{ vacanteId: string }>
}) {
  const { vacanteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('entidad_id').eq('id', user!.id).single()

  const { data: vacante } = await supabase
    .from('vacantes')
    .select('id, titulo, estado, entidad_id')
    .eq('id', vacanteId)
    .eq('entidad_id', profile!.entidad_id!)
    .single()

  if (!vacante) notFound()

  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select(`
      id, estado, codigo_seguimiento, puntaje_total, created_at, documentos,
      profiles!aspirante_id (id, full_name, document_id, email, phone, city, department)
    `)
    .eq('vacante_id', vacanteId)
    .order('created_at', { ascending: false })

  const conteoEstados = (postulaciones ?? []).reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{vacante.titulo}</h1>
        <p className="text-sm text-muted-foreground">{postulaciones?.length ?? 0} postulaciones</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(conteoEstados).map(([estado, count]) => (
          <Badge key={estado} variant="outline" className="text-xs gap-1">
            {POSTULACION_ESTADO_LABELS[estado]}: <strong>{count}</strong>
          </Badge>
        ))}
      </div>
      <EvaluacionPostulantes postulaciones={postulaciones as any ?? []} vacanteId={vacanteId} />
    </div>
  )
}
