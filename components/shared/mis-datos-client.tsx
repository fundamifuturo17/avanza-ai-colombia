'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { ARCO_TIPO_LABELS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Download, Edit3, Trash2, RefreshCw, FileText, Clock, CheckCircle2 } from 'lucide-react'

const arcoSchema = z.object({
  tipo: z.enum(['acceso', 'rectificacion', 'supresion', 'revocacion']),
  descripcion: z.string().min(10, 'Describe tu solicitud (mín. 10 caracteres)'),
})

type ArcoFormData = z.infer<typeof arcoSchema>

const ARCO_ESTADO_COLORS: Record<string, string> = {
  pendiente: 'secondary',
  en_proceso: 'outline',
  resuelta: 'default',
  escalada: 'outline',
  rechazada: 'destructive',
}

const ARCO_ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
  escalada: 'Escalada',
  rechazada: 'Rechazada',
}

export function MisDatosClient({ profile, solicitudesArco }: { profile: any; solicitudesArco: any[] }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<ArcoFormData>({
    resolver: zodResolver(arcoSchema),
    defaultValues: { tipo: 'acceso', descripcion: '' },
  })

  async function exportarDatos() {
    const datos = {
      perfil: profile,
      fecha_exportacion: new Date().toISOString(),
      nota: 'Exportación de datos personales — Ley 1581 de 2012',
    }
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mis-datos-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Datos exportados correctamente')
  }

  async function onSubmitArco(data: ArcoFormData) {
    setLoading(true)
    try {
      const fechaLimite = new Date()
      fechaLimite.setDate(fechaLimite.getDate() + 14) // ~10 días hábiles

      const { error } = await supabase.from('solicitudes_arco').insert({
        user_id: profile.id,
        tipo: data.tipo,
        descripcion: data.descripcion,
        estado: 'pendiente',
        fecha_limite: fechaLimite.toISOString().split('T')[0],
      })

      if (error) throw error

      toast.success('Solicitud enviada. El administrador responderá en máx. 10 días hábiles.')
      form.reset()
    } catch {
      toast.error('Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="datos">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="datos">Mis datos</TabsTrigger>
        <TabsTrigger value="arco">Solicitudes ARCO</TabsTrigger>
        <TabsTrigger value="nueva">Nueva solicitud</TabsTrigger>
      </TabsList>

      {/* DATOS */}
      <TabsContent value="datos">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Datos personales almacenados</CardTitle>
              <Button variant="outline" size="sm" onClick={exportarDatos} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>
            </div>
            <CardDescription>
              Consentimiento otorgado el {profile.fecha_consentimiento ? formatDate(profile.fecha_consentimiento) : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Nombre completo', value: profile.full_name },
                { label: 'Tipo documento', value: profile.document_type },
                { label: 'Número documento', value: profile.document_id },
                { label: 'Correo electrónico', value: profile.email },
                { label: 'Teléfono', value: profile.phone ?? 'No registrado' },
                { label: 'Ciudad', value: profile.city ?? 'No registrada' },
                { label: 'Departamento', value: profile.department ?? 'No registrado' },
                { label: 'Rol', value: profile.role },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Tus datos son tratados conforme a la <strong>Ley 1581 de 2012</strong></p>
              <p>• Tienes derecho a conocer, actualizar, rectificar y suprimir tu información</p>
              <p>• Para ejercer tus derechos, crea una solicitud ARCO en la pestaña correspondiente</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SOLICITUDES ARCO */}
      <TabsContent value="arco">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de solicitudes</CardTitle>
            <CardDescription>Tus solicitudes de derechos ARCO</CardDescription>
          </CardHeader>
          <CardContent>
            {solicitudesArco.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tienes solicitudes previas
              </div>
            ) : (
              <div className="space-y-3">
                {solicitudesArco.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{ARCO_TIPO_LABELS[s.tipo]}</span>
                      </div>
                      <Badge variant={ARCO_ESTADO_COLORS[s.estado] as any} className="text-xs">
                        {ARCO_ESTADO_LABELS[s.estado]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.descripcion}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(s.created_at)}
                      </span>
                      <span>Plazo: {formatDate(s.fecha_limite)}</span>
                    </div>
                    {s.respuesta && (
                      <div className="bg-green-50 rounded p-2 text-xs">
                        <p className="font-medium text-green-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Respuesta
                        </p>
                        <p className="text-green-700 mt-1">{s.respuesta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* NUEVA SOLICITUD */}
      <TabsContent value="nueva">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva solicitud ARCO</CardTitle>
            <CardDescription>
              El administrador responderá en máximo 10 días hábiles según la Ley 1581
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitArco)} className="space-y-4">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de solicitud</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ARCO_TIPO_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
                  <div><strong>Acceso:</strong> Ver todos tus datos</div>
                  <div><strong>Rectificación:</strong> Corregir datos inexactos</div>
                  <div><strong>Supresión:</strong> Eliminar tu información</div>
                  <div><strong>Revocación:</strong> Retirar consentimiento</div>
                </div>

                <FormField control={form.control} name="descripcion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la solicitud</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe qué información deseas acceder, corregir o eliminar..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar solicitud
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
