import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Briefcase, Users, Building2, TrendingUp,
  AlertTriangle, ChevronRight, Clock,
} from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { POSTULACION_ESTADO_LABELS, VACANTE_ESTADO_LABELS } from '@/lib/constants'

export default async function AdminTransparenciaPage() {
  const supabase = await createClient()

  const [
    vacantesPublicasRes, vacantesPrivadasRes,
    postulacionesRes, entidadesPublicasRes,
    empresasPendientesRes, arcosPendientesRes,
    auditRecienteRes,
  ] = await Promise.all([
    supabase.from('vacantes').select('id', { count: 'exact', head: true }).eq('estado', 'publicada').eq('entidades.tipo', 'publico'),
    supabase.from('vacantes').select('id', { count: 'exact', head: true }).eq('estado', 'publicada'),
    supabase.from('postulaciones').select('id, estado, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
    supabase.from('entidades').select('id', { count: 'exact', head: true }).eq('tipo', 'publico').eq('activo', true),
    supabase.from('entidades').select('id, nombre, created_at').eq('tipo', 'privado').eq('validado', false).limit(5),
    supabase.from('solicitudes_arco').select('id, tipo, created_at').eq('estado', 'pendiente').limit(5),
    supabase.from('audit_log').select('id, action, table_name, created_at, profiles(full_name, role)').order('created_at', { ascending: false }).limit(8),
  ])

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const postulacionesHoy = ((postulacionesRes.data ?? []) as any[]).filter(
    (p) => new Date(p.created_at) >= hoy
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard de transparencia</h1>
        <p className="text-sm text-muted-foreground">Vista nacional · Colombia</p>
      </div>

      {/* Alertas */}
      {((empresasPendientesRes.data?.length ?? 0) > 0 || (arcosPendientesRes.data?.length ?? 0) > 0) && (
        <div className="space-y-2">
          {(empresasPendientesRes.data?.length ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-amber-800">
                <strong>{empresasPendientesRes.data?.length}</strong> empresa(s) pendientes de validación
              </span>
              <Link href="/admin/validaciones" className="ml-auto">
                <Button variant="ghost" size="sm" className="h-6 text-xs">Revisar</Button>
              </Link>
            </div>
          )}
          {(arcosPendientesRes.data?.length ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-blue-800">
                <strong>{arcosPendientesRes.data?.length}</strong> solicitud(es) ARCO pendientes
              </span>
              <Link href="/admin/solicitudes-arco" className="ml-auto">
                <Button variant="ghost" size="sm" className="h-6 text-xs">Atender</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Vacantes publicadas', value: vacantesPrivadasRes.count ?? 0, icon: <Briefcase className="h-4 w-4 text-blue-600" />, color: 'text-blue-700' },
          { label: 'Postulaciones hoy', value: postulacionesHoy, icon: <TrendingUp className="h-4 w-4 text-green-600" />, color: 'text-green-700' },
          { label: 'Entidades públicas', value: entidadesPublicasRes.count ?? 0, icon: <Building2 className="h-4 w-4 text-purple-600" />, color: 'text-purple-700' },
          { label: 'Total postulaciones', value: postulacionesRes.count ?? 0, icon: <Users className="h-4 w-4 text-gray-600" />, color: 'text-gray-700' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-4">
              {kpi.icon}
              <p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value.toLocaleString('es-CO')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Empresas pendientes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Empresas por validar</CardTitle>
              <Link href="/admin/validaciones">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!empresasPendientesRes.data?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin pendientes</p>
            ) : (
              <div className="space-y-2">
                {(empresasPendientesRes.data as any[]).map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-xs font-medium">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(e.created_at)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auditoría reciente */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Actividad reciente</CardTitle>
              <Link href="/admin/auditoria">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Ver log <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!auditRecienteRes.data?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin actividad</p>
            ) : (
              <div className="space-y-2">
                {(auditRecienteRes.data as any[]).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 py-1 border-b last:border-0 text-xs">
                    <Badge variant="outline" className="text-xs shrink-0">{log.action}</Badge>
                    <span className="text-muted-foreground truncate">{log.table_name}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{formatRelativeDate(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
