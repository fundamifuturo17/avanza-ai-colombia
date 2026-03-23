import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Briefcase, Users, Clock, Plus, ChevronRight, AlertTriangle } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { VACANTE_ESTADO_LABELS, POSTULACION_ESTADO_LABELS } from '@/lib/constants'

export default async function ProveedorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('entidad_id, cargo_entidad, entidades(nombre, tipo, validado)')
    .eq('id', user!.id)
    .single()

  const entidadId = profile?.entidad_id

  const [vacantesRes, postulacionesRes, recientesRes] = await Promise.all([
    supabase.from('vacantes').select('id, titulo, estado, fecha_cierre, created_at').eq('entidad_id', entidadId!),
    supabase.from('postulaciones').select('id, estado, created_at, vacantes!inner(entidad_id)').eq('vacantes.entidad_id', entidadId!),
    supabase.from('postulaciones')
      .select('id, estado, created_at, vacantes!inner(titulo, entidad_id)')
      .eq('vacantes.entidad_id', entidadId!)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const vacantes = vacantesRes.data ?? []
  const postulaciones = postulacionesRes.data ?? []

  const kpis = {
    activas: vacantes.filter((v) => v.estado === 'publicada').length,
    borradores: vacantes.filter((v) => v.estado === 'borrador').length,
    postulacionesMes: postulaciones.filter((p) => {
      const fecha = new Date(p.created_at)
      const hace30 = new Date()
      hace30.setDate(hace30.getDate() - 30)
      return fecha >= hace30
    }).length,
    pendientesRevision: postulaciones.filter((p) => p.estado === 'registrada').length,
  }

  const porCerrar = vacantes.filter((v) => {
    if (v.estado !== 'publicada' || !v.fecha_cierre) return false
    const dias = Math.ceil((new Date(v.fecha_cierre).getTime() - Date.now()) / 86400000)
    return dias <= 5 && dias >= 0
  })

  const entidad = profile?.entidades as any

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{entidad?.nombre ?? 'Dashboard'}</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.cargo_entidad} ·{' '}
            <Badge variant="outline" className="text-xs">{entidad?.tipo === 'publico' ? 'Entidad pública' : 'Privada'}</Badge>
          </p>
        </div>
        <Link href="/proveedor/vacantes/nueva">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Nueva vacante
          </Button>
        </Link>
      </div>

      {/* Alertas */}
      {(porCerrar.length > 0 || kpis.pendientesRevision > 0) && (
        <div className="space-y-2">
          {porCerrar.map((v) => (
            <div key={v.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-amber-800">La vacante <strong>{v.titulo}</strong> cierra pronto</span>
              <Link href={`/proveedor/vacantes`} className="ml-auto">
                <Button variant="ghost" size="sm" className="h-6 text-xs">Ver</Button>
              </Link>
            </div>
          ))}
          {kpis.pendientesRevision > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm">
              <Users className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-blue-800"><strong>{kpis.pendientesRevision}</strong> postulaciones pendientes de revisión</span>
              <Link href="/proveedor/postulaciones" className="ml-auto">
                <Button variant="ghost" size="sm" className="h-6 text-xs">Revisar</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Vacantes activas', value: kpis.activas, icon: <Briefcase className="h-4 w-4 text-blue-600" />, color: 'text-blue-700' },
          { label: 'Borradores', value: kpis.borradores, icon: <Clock className="h-4 w-4 text-gray-500" />, color: 'text-gray-700' },
          { label: 'Postulaciones (30d)', value: kpis.postulacionesMes, icon: <Users className="h-4 w-4 text-green-600" />, color: 'text-green-700' },
          { label: 'Por revisar', value: kpis.pendientesRevision, icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, color: 'text-amber-700' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                {kpi.icon}
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Postulaciones recientes</CardTitle>
            <Link href="/proveedor/postulaciones">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!recientesRes.data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay postulaciones aún</p>
          ) : (
            <div className="space-y-2">
              {recientesRes.data.map((p) => (
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
