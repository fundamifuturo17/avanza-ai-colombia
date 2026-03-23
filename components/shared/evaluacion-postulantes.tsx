'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { maskName, maskDocumentId } from '@/lib/utils'
import { POSTULACION_ESTADO_LABELS, POSTULACION_ESTADO_COLORS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, FileText, User, ChevronDown, ChevronUp } from 'lucide-react'
import type { PostulacionEstado } from '@/types/database'

const TRANSICIONES_POSTULACION: Record<string, PostulacionEstado[]> = {
  registrada: ['en_revision', 'rechazada'],
  en_revision: ['preseleccionada', 'rechazada'],
  preseleccionada: ['seleccionada', 'rechazada'],
  seleccionada: [],
  rechazada: [],
}

interface Postulante {
  id: string
  estado: string
  codigo_seguimiento: string
  puntaje_total: number | null
  created_at: string
  documentos: any[]
  profiles: {
    id: string
    full_name: string
    document_id: string
    email: string | null
    phone: string | null
    city: string | null
    department: string | null
  } | null
}

export function EvaluacionPostulantes({
  postulaciones,
  vacanteId,
}: {
  postulaciones: Postulante[]
  vacanteId: string
}) {
  const [lista, setLista] = useState(postulaciones)
  const [seleccionado, setSeleccionado] = useState<Postulante | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const router = useRouter()
  const supabase = createClient()

  function toggleExpand(id: string) {
    setExpandidos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function cambiarEstado() {
    if (!seleccionado || !nuevoEstado || !justificacion.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const { error: upError } = await supabase
        .from('postulaciones')
        .update({ estado: nuevoEstado as PostulacionEstado, justificacion_cambio: justificacion })
        .eq('id', seleccionado.id)

      if (upError) throw upError

      await supabase.from('postulacion_historial').insert({
        postulacion_id: seleccionado.id,
        estado_anterior: seleccionado.estado as PostulacionEstado,
        estado_nuevo: nuevoEstado as PostulacionEstado,
        justificacion,
        cambiado_por: (await supabase.auth.getUser()).data.user!.id,
      })

      setLista((prev) =>
        prev.map((p) => p.id === seleccionado.id ? { ...p, estado: nuevoEstado } : p)
      )
      toast.success('Estado actualizado. El aspirante será notificado.')
      setSeleccionado(null)
      setNuevoEstado('')
      setJustificacion('')
      router.refresh()
    } catch {
      toast.error('Error al cambiar el estado')
    } finally {
      setLoading(false)
    }
  }

  const filtradas = filtroEstado === 'todos'
    ? lista
    : lista.filter((p) => p.estado === filtroEstado)

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {['todos', 'registrada', 'en_revision', 'preseleccionada', 'seleccionada', 'rechazada'].map((e) => (
          <Button
            key={e}
            variant={filtroEstado === e ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFiltroEstado(e)}
          >
            {e === 'todos' ? 'Todos' : POSTULACION_ESTADO_LABELS[e]}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtradas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No hay postulantes en este estado
          </div>
        )}
        {filtradas.map((p) => {
          const expandido = expandidos.has(p.id)
          const transiciones = TRANSICIONES_POSTULACION[p.estado] ?? []
          const colorVariant = POSTULACION_ESTADO_COLORS[p.estado] as any
          const documentos = Array.isArray(p.documentos) ? p.documentos : []

          return (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{maskName(p.profiles?.full_name ?? 'Aspirante')}</p>
                      <p className="text-xs text-muted-foreground">
                        Doc: {maskDocumentId(p.profiles?.document_id ?? '')} ·{' '}
                        {p.profiles?.city}, {p.profiles?.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={colorVariant} className="text-xs">
                      {POSTULACION_ESTADO_LABELS[p.estado]}
                    </Badge>
                    {transiciones.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setSeleccionado(p)}
                      >
                        Cambiar estado
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleExpand(p.id)}
                    >
                      {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {expandido && (
                  <div className="border-t pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{p.profiles?.email ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{p.profiles?.phone ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Código</p>
                        <p className="font-mono font-medium">{p.codigo_seguimiento}</p>
                      </div>
                      {p.puntaje_total && (
                        <div>
                          <p className="text-muted-foreground">Puntaje</p>
                          <p className="font-medium">{p.puntaje_total}</p>
                        </div>
                      )}
                    </div>

                    {documentos.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Documentos ({documentos.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {documentos.map((doc: any, i: number) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-gray-50"
                            >
                              <FileText className="h-3 w-3 text-blue-500" />
                              {doc.nombre}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal cambio de estado */}
      <Dialog open={!!seleccionado} onOpenChange={(o) => !o && setSeleccionado(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
            <DialogDescription>
              {seleccionado && maskName(seleccionado.profiles?.full_name ?? 'Aspirante')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nuevo estado</Label>
              <Select onValueChange={setNuevoEstado} value={nuevoEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {(TRANSICIONES_POSTULACION[seleccionado?.estado ?? ''] ?? []).map((e) => (
                    <SelectItem key={e} value={e}>{POSTULACION_ESTADO_LABELS[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justificación <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Esta justificación se registra en auditoría y es visible para el aspirante..."
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Acción registrada automáticamente en el log de auditoría.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSeleccionado(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={cambiarEstado} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
