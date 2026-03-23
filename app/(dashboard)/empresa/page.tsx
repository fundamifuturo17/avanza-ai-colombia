import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Briefcase, Users, Plus, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { POSTULACION_ESTADO_LABELS } from '@/lib/constants'

export default async function EmpresaDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('entidad_id, cargo_entidad, entidades(nombre, tipo, validado, sector_economico)')
    .eq('id', user!.id)
    .single()

  const entidad = profile?.entidades as any
  const entidadId = profile?.entidad_id
  const validada = entidad?.validado === true

  const [vacantesRes, postulacionesRes] = await Promise.all([
    supabase.from('vacantes').select('id, titulo, estado').eq('entidad_id', entidadId!),
    supabase.from('postulaciones')
      .select('id, estado, created_at, vacantes!inner(titulo, entidad_id)')
      .eq('vacantes.entidad_id', entidadId!)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const vacantes = vacantesRes.data ?? []
  const kpis = {
    activas: vacantes.filter((v) => v.estado === 'publicada').length,
    total: vacantes.length,
    postulaciones: postulacionesRes.data?.length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{entidad?.nombre}</h1>
            {validada
              ? <Badge className="text-xs bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Verificada</Badge>
              : <Badge variant="secondary" className="text-xs">En validación</Badge>}
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {entidad?.sector_economico} · {profile?.cargo_entidad}
          </p>
        </div>
        {validada && (
          <Link href="/empresa/vacantes/nueva">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nueva vacante
            </Button>
          </Link>
        )}
      </div>

      {!validada && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Empresa pendiente de validación</p>
            <p className="text-xs mt-1">
              El administrador revisará tu empresa en máximo 2 días hábiles.
              Una vez validada, podrás publicar vacantes.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Vacantes activas', value: kpis.activas, icon: <Briefcase className="h-4 w-4 text-blue-600" />, color: 'text-blue-700' },
          { label: 'Total vacantes', value: kpis.total, icon: <Briefcase className="h-4 w-4 text-gray-500" />, color: 'text-gray-700' },
          { label: 'Postulaciones', value: kpis.postulaciones, icon: <Users className="h-4 w-4 text-green-600" />, color: 'text-green-700' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-4">
              {kpi.icon}
              <p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Postulaciones recientes</CardTitle>
            <Link href="/empresa/postulaciones">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!postulacionesRes.data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay postulaciones aún</p>
          ) : (
            <div className="space-y-2">
              {postulacionesRes.data.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-xs font-medium">{(p.vacantes as any)?.titulo}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(p.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {POSTULACION_ESTADO_LABELS[p.estado]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
