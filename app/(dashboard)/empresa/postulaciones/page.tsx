import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ChevronRight } from 'lucide-react'
import { VACANTE_ESTADO_LABELS, VACANTE_ESTADO_COLORS } from '@/lib/constants'

export default async function EmpresaPostulacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('entidad_id').eq('id', user!.id).single()

  const { data: vacantes } = await supabase
    .from('vacantes')
    .select('id, titulo, estado, postulaciones(id, estado)')
    .eq('entidad_id', profile!.entidad_id!)
    .in('estado', ['publicada', 'evaluacion', 'cerrada'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Postulaciones por vacante</h1>
        <p className="text-sm text-muted-foreground">{vacantes?.length ?? 0} vacantes con actividad</p>
      </div>

      <div className="space-y-3">
        {!vacantes?.length && (
          <div className="text-center py-16 text-muted-foreground text-sm">No hay vacantes activas</div>
        )}
        {vacantes?.map((v) => {
          const posts = (v.postulaciones as any[]) ?? []
          const pendientes = posts.filter((p: any) => p.estado === 'registrada').length
          const colorVariant = VACANTE_ESTADO_COLORS[v.estado] as any

          return (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={colorVariant} className="text-xs">
                        {VACANTE_ESTADO_LABELS[v.estado]}
                      </Badge>
                      {pendientes > 0 && (
                        <Badge variant="destructive" className="text-xs">{pendientes} por revisar</Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{v.titulo}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {posts.length} postulaciones
                    </div>
                  </div>
                  <Link href={`/empresa/postulaciones/${v.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs shrink-0">
                      Gestionar <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
