'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Building2, Loader2 } from 'lucide-react'

interface Empresa {
  id: string
  nombre: string
  nit: string
  dv: string | null
  validado: boolean
  sector_economico: string | null
  tamano_empresa: string | null
  created_at: string
  activo: boolean
}

export function ValidacionesClient({ empresas }: { empresas: Empresa[] }) {
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null)
  const [accion, setAccion] = useState<'validar' | 'rechazar' | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const pendientes = empresas.filter((e) => !e.validado && e.activo)
  const validadas = empresas.filter((e) => e.validado)

  async function procesarValidacion() {
    if (!seleccionada || !accion) return
    if (!observaciones.trim()) {
      toast.error('Las observaciones son obligatorias')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('entidades')
        .update({ validado: accion === 'validar', activo: accion === 'validar' })
        .eq('id', seleccionada.id)

      if (error) throw error

      toast.success(accion === 'validar' ? 'Empresa validada correctamente' : 'Empresa rechazada')
      setSeleccionada(null)
      setAccion(null)
      setObservaciones('')
      router.refresh()
    } catch {
      toast.error('Error al procesar la validación')
    } finally {
      setLoading(false)
    }
  }

  function EmpresaCard({ empresa, showActions }: { empresa: Empresa; showActions: boolean }) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{empresa.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  NIT: {empresa.nit}{empresa.dv ? `-${empresa.dv}` : ''} ·{' '}
                  {empresa.sector_economico} · {empresa.tamano_empresa}
                </p>
                <p className="text-xs text-muted-foreground">
                  Registrada: {formatDate(empresa.created_at)}
                </p>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { setSeleccionada(empresa); setAccion('rechazar') }}
                >
                  <XCircle className="h-3.5 w-3.5" /> Rechazar
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => { setSeleccionada(empresa); setAccion('validar') }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Validar
                </Button>
              </div>
            )}

            {!showActions && (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-200 shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Validada
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Tabs defaultValue="pendientes">
        <TabsList className="grid grid-cols-2 w-64">
          <TabsTrigger value="pendientes">
            Pendientes {pendientes.length > 0 && `(${pendientes.length})`}
          </TabsTrigger>
          <TabsTrigger value="validadas">Validadas</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-3 mt-4">
          {pendientes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hay empresas pendientes de validación
            </div>
          )}
          {pendientes.map((e) => <EmpresaCard key={e.id} empresa={e} showActions={true} />)}
        </TabsContent>

        <TabsContent value="validadas" className="space-y-3 mt-4">
          {validadas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No hay empresas validadas</div>
          )}
          {validadas.map((e) => <EmpresaCard key={e.id} empresa={e} showActions={false} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!seleccionada} onOpenChange={(o) => !o && setSeleccionada(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {accion === 'validar' ? 'Validar empresa' : 'Rechazar empresa'}
            </DialogTitle>
            <DialogDescription>{seleccionada?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Observaciones <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder={accion === 'validar'
                  ? 'Documentación verificada, empresa registrada en RUES...'
                  : 'Motivo del rechazo: documentación incompleta...'}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Acción registrada en el log de auditoría.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSeleccionada(null)}>
                Cancelar
              </Button>
              <Button
                className={`flex-1 ${accion === 'rechazar' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={procesarValidacion}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {accion === 'validar' ? 'Confirmar validación' : 'Confirmar rechazo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
