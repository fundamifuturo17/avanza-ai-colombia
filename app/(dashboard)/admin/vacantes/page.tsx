import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, diasRestantes } from '@/lib/utils'
import { VACANTE_ESTADO_LABELS, VACANTE_ESTADO_COLORS } from '@/lib/constants'
import { MapPin, Users, Building2 } from 'lucide-react'

export default async function AdminVacantesPage() {
  const supabase = await createClient()

  const { data: vacantes } = await (supabase as any)
    .from('vacantes')
    .select(`
      id, titulo, estado, fecha_cierre, created_at,
      tipo_contrato, departamento, numero_convocatoria,
      postulaciones(id),
      entidades(nombre, tipo)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const total = vacantes?.length ?? 0
  const publicadas = vacantes?.filter((v: any) => v.estado === 'publicada').length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Vacantes</h1>
        <p className="text-sm text-muted-foreground">
          {total} totales · {publicadas} publicadas
        </p>
      </div>

      <div className="space-y-2">
        {!vacantes?.length && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No hay vacantes registradas
          </div>
        )}
        {(vacantes ?? []).map((v: any) => {
          const totalPost = (v.postulaciones as any[])?.length ?? 0
          const dias = v.fecha_cierre ? diasRestantes(v.fecha_cierre) : null
          const colorVariant = VACANTE_ESTADO_COLORS[v.estado] as any
          const esPublico = v.entidades?.tipo === 'publico'

          return (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={colorVariant} className="text-xs">
                        {VACANTE_ESTADO_LABELS[v.estado]}
                      </Badge>
                      <Badge variant={esPublico ? 'default' : 'secondary'} className="text-xs">
                        {esPublico ? 'Público' : 'Privado'}
                      </Badge>
                      {v.numero_convocatoria && (
                        <span className="text-xs text-muted-foreground">
                          Conv. {v.numero_convocatoria}
                        </span>
                      )}
                      {dias !== null && dias <= 3 && dias >= 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Cierra en {dias}d
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{v.titulo}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {v.entidades?.nombre && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {v.entidades.nombre}
                        </span>
                      )}
                      {v.departamento && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {v.departamento}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {totalPost} postulaciones
                      </span>
                      {v.fecha_cierre && (
                        <span>Cierre: {formatDate(v.fecha_cierre)}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(v.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
