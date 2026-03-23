import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Eye, Edit, Users, Copy } from 'lucide-react'
import { formatDate, diasRestantes } from '@/lib/utils'
import { VACANTE_ESTADO_LABELS, VACANTE_ESTADO_COLORS } from '@/lib/constants'
import { CambiarEstadoVacante } from '@/components/shared/cambiar-estado-vacante'

export default async function ProveedorVacantesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('entidad_id').eq('id', user!.id).single()

  const { data: vacantes } = await supabase
    .from('vacantes')
    .select(`
      id, titulo, estado, fecha_cierre, created_at, tipo_contrato,
      numero_convocatoria, departamento,
      postulaciones(id)
    `)
    .eq('entidad_id', profile!.entidad_id!)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mis vacantes</h1>
          <p className="text-sm text-muted-foreground">{vacantes?.length ?? 0} vacantes totales</p>
        </div>
        <Link href="/proveedor/vacantes/nueva">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Nueva vacante
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {!vacantes?.length && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No tienes vacantes. Crea la primera.</p>
          </div>
        )}
        {vacantes?.map((v) => {
          const totalPostulaciones = (v.postulaciones as any[])?.length ?? 0
          const dias = v.fecha_cierre ? diasRestantes(v.fecha_cierre) : null
          const colorVariant = VACANTE_ESTADO_COLORS[v.estado] as any

          return (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={colorVariant} className="text-xs">
                        {VACANTE_ESTADO_LABELS[v.estado]}
                      </Badge>
                      {v.numero_convocatoria && (
                        <span className="text-xs text-muted-foreground">Conv. {v.numero_convocatoria}</span>
                      )}
                      {dias !== null && dias <= 3 && dias >= 0 && (
                        <Badge variant="destructive" className="text-xs">Cierra en {dias}d</Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{v.titulo}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {totalPostulaciones} postulaciones
                      </span>
                      {v.departamento && <span>{v.departamento}</span>}
                      {v.fecha_cierre && <span>Cierra: {formatDate(v.fecha_cierre)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/proveedor/postulaciones/${v.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver postulaciones">
                        <Users className="h-4 w-4" />
                      </Button>
                    </Link>
                    {v.estado === 'borrador' && (
                      <Link href={`/proveedor/vacantes/${v.id}/editar`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <CambiarEstadoVacante
                      vacanteId={v.id}
                      estadoActual={v.estado}
                      titulo={v.titulo}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
