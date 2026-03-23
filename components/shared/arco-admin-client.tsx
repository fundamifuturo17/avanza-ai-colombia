'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate, diasRestantes } from '@/lib/utils'
import { ARCO_TIPO_LABELS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, AlertTriangle, CheckCircle2, Loader2, User } from 'lucide-react'
import type { ArcoEstado } from '@/types/database'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'secondary', en_proceso: 'outline',
  resuelta: 'default', escalada: 'outline', rechazada: 'destructive',
}
const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', en_proceso: 'En proceso',
  resuelta: 'Resuelta', escalada: 'Escalada', rechazada: 'Rechazada',
}

interface Solicitud {
  id: string
  tipo: string
  estado: string
  descripcion: string | null
  respuesta: string | null
  fecha_limite: string
  created_at: string
  profiles: { full_name: string; email: string | null; document_id: string } | null
}

export function ArcoAdminClient({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const [respuesta, setRespuesta] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente' || s.estado === 'en_proceso')
  const resueltas = solicitudes.filter((s) => s.estado === 'resuelta' || s.estado === 'rechazada' || s.estado === 'escalada')

  async function procesarSolicitud() {
    if (!seleccionada || !nuevoEstado || !respuesta.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('solicitudes_arco')
        .update({ estado: nuevoEstado as ArcoEstado, respuesta })
        .eq('id', seleccionada.id)

      if (error) throw error

      toast.success('Solicitud actualizada')
      setSeleccionada(null)
      setNuevoEstado('')
      setRespuesta('')
      router.refresh()
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  function SolicitudCard({ s }: { s: Solicitud }) {
    const diasRestantesVal = diasRestantes(s.fecha_limite)
    const urgente = diasRestantesVal <= 2 && s.estado === 'pendiente'

    return (
      <Card className={urgente ? 'border-red-200' : ''}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                    {ARCO_TIPO_LABELS[s.tipo]}
                  </Badge>
                  <Badge variant={ESTADO_COLORS[s.estado] as any} className="text-xs">
                    {ESTADO_LABELS[s.estado]}
                  </Badge>
                  {urgente && <Badge variant="destructive" className="text-xs">Urgente</Badge>}
                </div>
                <p className="text-sm font-medium mt-1">{s.profiles?.full_name}</p>
                <p className="text-xs text-muted-foreground">{s.profiles?.email}</p>
              </div>
            </div>

            {(s.estado === 'pendiente' || s.estado === 'en_proceso') && (
              <Button size="sm" variant="outline" className="h-8 text-xs shrink-0"
                onClick={() => setSeleccionada(s)}>
                Procesar
              </Button>
            )}
          </div>

          {s.descripcion && (
            <p className="text-xs text-muted-foreground bg-gray-50 rounded p-2">{s.descripcion}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(s.created_at)}
            </span>
            <span className={`flex items-center gap-1 ${urgente ? 'text-red-600 font-medium' : ''}`}>
              {urgente && <AlertTriangle className="h-3 w-3" />}
              Plazo: {formatDate(s.fecha_limite)}
              {diasRestantesVal >= 0 && ` (${diasRestantesVal}d)`}
            </span>
          </div>

          {s.respuesta && (
            <div className="bg-green-50 rounded p-2 text-xs">
              <p className="font-medium text-green-800 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Respuesta
              </p>
              <p className="text-green-700 mt-1">{s.respuesta}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Tabs defaultValue="pendientes">
        <TabsList className="grid grid-cols-2 w-64">
          <TabsTrigger value="pendientes">
            Activas {pendientes.length > 0 && `(${pendientes.length})`}
          </TabsTrigger>
          <TabsTrigger value="resueltas">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-3 mt-4">
          {pendientes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Sin solicitudes activas</div>
          )}
          {pendientes.map((s) => <SolicitudCard key={s.id} s={s} />)}
        </TabsContent>

        <TabsContent value="resueltas" className="space-y-3 mt-4">
          {resueltas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Sin historial</div>
          )}
          {resueltas.map((s) => <SolicitudCard key={s.id} s={s} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!seleccionada} onOpenChange={(o) => !o && setSeleccionada(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar solicitud — {seleccionada && ARCO_TIPO_LABELS[seleccionada.tipo]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nuevo estado</Label>
              <Select onValueChange={setNuevoEstado} value={nuevoEstado}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                  <SelectItem value="resuelta">Resuelta</SelectItem>
                  <SelectItem value="escalada">Escalar a legal</SelectItem>
                  <SelectItem value="rechazada">Rechazar (con fundamento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Respuesta al usuario <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Describe las acciones tomadas o el motivo de rechazo..."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSeleccionada(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={procesarSolicitud} disabled={loading}>
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
