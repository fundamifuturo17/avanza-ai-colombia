'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Settings2, Loader2 } from 'lucide-react'
import type { VacanteEstado } from '@/types/database'

const TRANSICIONES: Record<string, VacanteEstado[]> = {
  borrador: ['publicada', 'cancelada'],
  publicada: ['evaluacion', 'cerrada', 'cancelada'],
  evaluacion: ['cerrada', 'cancelada'],
  cerrada: [],
  cancelada: [],
}

const ESTADO_LABELS: Record<string, string> = {
  publicada: 'Publicar',
  evaluacion: 'Pasar a evaluación',
  cerrada: 'Cerrar convocatoria',
  cancelada: 'Cancelar',
}

export function CambiarEstadoVacante({
  vacanteId,
  estadoActual,
  titulo,
}: {
  vacanteId: string
  estadoActual: string
  titulo: string
}) {
  const [open, setOpen] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const [justificacion, setJustificacion] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const transicionesDisponibles = TRANSICIONES[estadoActual] ?? []

  if (transicionesDisponibles.length === 0) return null

  async function handleCambio() {
    if (!nuevoEstado) {
      toast.error('Selecciona el nuevo estado')
      return
    }
    if (!justificacion.trim()) {
      toast.error('La justificación es obligatoria')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('vacantes')
        .update({ estado: nuevoEstado as VacanteEstado })
        .eq('id', vacanteId)

      if (error) throw error

      toast.success(`Vacante actualizada a: ${ESTADO_LABELS[nuevoEstado] ?? nuevoEstado}`)
      setOpen(false)
      setJustificacion('')
      setNuevoEstado('')
      router.refresh()
    } catch {
      toast.error('Error al cambiar el estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Cambiar estado">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar estado de vacante</DialogTitle>
          <DialogDescription className="truncate">{titulo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nuevo estado</Label>
            <Select onValueChange={setNuevoEstado} value={nuevoEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {transicionesDisponibles.map((e) => (
                  <SelectItem key={e} value={e}>{ESTADO_LABELS[e] ?? e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Justificación <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Esta acción quedará registrada en el log de auditoría..."
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Esta acción se registra automáticamente en auditoría.</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCambio} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
