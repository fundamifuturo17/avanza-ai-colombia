import { createClient } from '@/lib/supabase/server'
import { ValidacionesClient } from '@/components/shared/validaciones-client'

export default async function AdminValidacionesPage() {
  const supabase = await createClient()

  const { data: empresas } = await supabase
    .from('entidades')
    .select('id, nombre, nit, dv, validado, sector_economico, tamano_empresa, created_at, activo')
    .eq('tipo', 'privado')
    .order('validado', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Validación de empresas</h1>
        <p className="text-sm text-muted-foreground">
          {empresas?.filter((e) => !e.validado).length ?? 0} pendientes ·{' '}
          {empresas?.filter((e) => e.validado).length ?? 0} validadas
        </p>
      </div>
      <ValidacionesClient empresas={empresas as any ?? []} />
    </div>
  )
}
