import { createClient } from '@/lib/supabase/server'
import { VacanteCard } from '@/components/cards/vacante-card'
import { FiltrosVacantes } from '@/components/forms/filtros-vacantes'
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SearchParams {
  sector?: string
  departamento?: string
  q?: string
  salario_min?: string
}

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Con filtro sector usamos !inner para poder filtrar por la tabla relacionada
  const joinSector = params.sector
    ? 'entidades!inner(id, nombre, tipo, validado)'
    : 'entidades(id, nombre, tipo, validado)'

  let query = (supabase as any)
    .from('vacantes')
    .select(`
      id, titulo, descripcion, salario_min, salario_max,
      tipo_contrato, departamento, municipio, fecha_cierre,
      visible_salario, visible_proceso, estado, created_at,
      numero_convocatoria,
      ${joinSector}
    `)
    .eq('estado', 'publicada')
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.ilike('titulo', `%${params.q}%`)
  }
  if (params.departamento) {
    query = query.eq('departamento', params.departamento)
  }
  if (params.sector) {
    query = query.eq('entidades.tipo', params.sector)
  }
  if (params.salario_min) {
    query = query.gte('salario_min', parseInt(params.salario_min))
  }

  const { data: vacantes } = await query.limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">
            {vacantes?.length ?? 0} vacantes disponibles
          </p>
        </div>
        <Link href="/aspirante/orientacion">
          <Button variant="outline" size="sm" className="gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            Orientación IA
          </Button>
        </Link>
      </div>

      <FiltrosVacantes />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vacantes?.map((vacante) => (
          <VacanteCard key={vacante.id} vacante={vacante as any} />
        ))}
        {(!vacantes || vacantes.length === 0) && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <p>No hay vacantes disponibles con estos filtros.</p>
          </div>
        )}
      </div>
    </div>
  )
}
