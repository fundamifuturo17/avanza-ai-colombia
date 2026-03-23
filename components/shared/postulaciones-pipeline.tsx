'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatRelativeDate, diasRestantes } from '@/lib/utils'
import {
  POSTULACION_ESTADO_LABELS,
  POSTULACION_ESTADO_COLORS,
} from '@/lib/constants'
import {
  CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Calendar, Building2,
} from 'lucide-react'
import { toast } from 'sonner'

const ESTADO_ICONS: Record<string, React.ReactNode> = {
  registrada: <Clock className="h-4 w-4 text-gray-500" />,
  en_revision: <AlertCircle className="h-4 w-4 text-blue-500" />,
  preseleccionada: <CheckCircle2 className="h-4 w-4 text-yellow-500" />,
  seleccionada: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rechazada: <XCircle className="h-4 w-4 text-red-500" />,
}

interface Postulacion {
  id: string
  estado: string
  codigo_seguimiento: string
  created_at: string
  updated_at: string
  vacantes: {
    id: string
    titulo: string
    fecha_cierre: string | null
    tipo_contrato: string
    departamento: string | null
    entidades: { nombre: string; tipo: string } | null
  } | null
  postulacion_historial: {
    id: string
    estado_anterior: string | null
    estado_nuevo: string
    justificacion: string
    created_at: string
    profiles: { full_name: string; role: string } | null
  }[]
}

export function PostulacionesPipeline({
  postulacionesIniciales,
  userId,
}: {
  postulacionesIniciales: Postulacion[]
  userId: string
}) {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>(postulacionesIniciales)
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('postulaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'postulaciones',
          filter: `aspirante_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as { id: string; estado: string; updated_at: string }

          setPostulaciones((prev) =>
            prev.map((p) =>
              p.id === updated.id ? { ...p, estado: updated.estado, updated_at: updated.updated_at } : p
            )
          )

          const estadoLabel = POSTULACION_ESTADO_LABELS[updated.estado] ?? updated.estado
          toast.info(`Tu postulación fue actualizada: ${estadoLabel}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  function toggleExpand(id: string) {
    setExpandidas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (postulaciones.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Aún no tienes postulaciones.</p>
        <p className="text-sm mt-1">Explora las oportunidades disponibles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {postulaciones.map((p) => {
        const dias = p.vacantes?.fecha_cierre ? diasRestantes(p.vacantes.fecha_cierre) : null
        const expandida = expandidas.has(p.id)
        const colorVariant = POSTULACION_ESTADO_COLORS[p.estado] as 'default' | 'secondary' | 'destructive' | 'outline'

        return (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ESTADO_ICONS[p.estado]}
                    <Badge variant={colorVariant} className="text-xs">
                      {POSTULACION_ESTADO_LABELS[p.estado]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Código: <span className="font-mono font-medium">{p.codigo_seguimiento}</span>
                    </span>
                  </div>
                  <h3 className="font-medium text-sm mt-1.5 truncate">
                    {p.vacantes?.titulo ?? 'Vacante'}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {p.vacantes?.entidades?.nombre}
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  {dias !== null && dias >= 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <Calendar className="h-3 w-3" />
                      {dias === 0 ? 'Cierra hoy' : `${dias}d restantes`}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(p.updated_at)}
                  </p>
                </div>
              </div>

              {/* Timeline visual */}
              <div className="flex items-center gap-1">
                {['registrada', 'en_revision', 'preseleccionada', 'seleccionada'].map((estado, i) => {
                  const estados = ['registrada', 'en_revision', 'preseleccionada', 'seleccionada', 'rechazada']
                  const currentIdx = estados.indexOf(p.estado)
                  const stepIdx = estados.indexOf(estado)
                  const activo = stepIdx <= currentIdx && p.estado !== 'rechazada'

                  return (
                    <div key={estado} className="flex items-center gap-1 flex-1">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${activo ? 'bg-blue-600' : 'bg-gray-200'}`} />
                      {i < 3 && <div className={`h-0.5 flex-1 ${activo && stepIdx < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                  )
                })}
                {p.estado === 'rechazada' && (
                  <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                )}
              </div>

              {/* Historial expandible */}
              {p.postulacion_historial && p.postulacion_historial.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full justify-between"
                    onClick={() => toggleExpand(p.id)}
                  >
                    Ver historial ({p.postulacion_historial.length} cambios)
                    {expandida ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>

                  {expandida && (
                    <div className="space-y-2 pt-1">
                      <Separator />
                      {p.postulacion_historial
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((h) => (
                          <div key={h.id} className="text-xs space-y-0.5 pl-2 border-l-2 border-gray-100">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs h-4">
                                {POSTULACION_ESTADO_LABELS[h.estado_nuevo]}
                              </Badge>
                              <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                            </div>
                            <p className="text-muted-foreground">{h.justificacion}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
