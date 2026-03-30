import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { NuevaVacanteForm } from '@/components/forms/nueva-vacante-form'

export default async function EditarVacantePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vacante } = await (supabase as any)
    .from('vacantes')
    .select(`
      id, titulo, descripcion, requisitos, tipo_contrato, departamento, municipio,
      salario_min, salario_max, beneficios, numero_convocatoria, presupuesto_programado,
      fecha_cierre, visible_salario, visible_proceso, estado,
      entidad_id, created_by,
      entidades(nombre, tipo)
    `)
    .eq('id', id)
    .eq('created_by', user!.id)
    .eq('estado', 'borrador')
    .maybeSingle()

  if (!vacante) notFound()

  const esPublico = vacante.entidades?.tipo === 'publico'

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Editar vacante</h1>
        <p className="text-sm text-muted-foreground">{vacante.entidades?.nombre}</p>
      </div>
      <NuevaVacanteForm
        entidadId={vacante.entidad_id ?? ''}
        userId={user!.id}
        esPublico={esPublico}
        redirectTo="/proveedor/vacantes"
        vacanteId={vacante.id}
        initialData={{
          titulo: vacante.titulo ?? '',
          descripcion: vacante.descripcion ?? '',
          requisitos: vacante.requisitos ?? '',
          tipo_contrato: vacante.tipo_contrato ?? '',
          departamento: vacante.departamento ?? '',
          municipio: vacante.municipio ?? '',
          salario_min: vacante.salario_min ?? '',
          salario_max: vacante.salario_max ?? '',
          beneficios: vacante.beneficios ?? '',
          numero_convocatoria: vacante.numero_convocatoria ?? '',
          presupuesto_programado: vacante.presupuesto_programado ?? '',
          fecha_cierre: vacante.fecha_cierre ?? '',
          visible_salario: vacante.visible_salario ?? true,
          visible_proceso: vacante.visible_proceso ?? esPublico,
        }}
      />
    </div>
  )
}
