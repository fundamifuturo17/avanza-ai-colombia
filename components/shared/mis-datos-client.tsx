'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { ARCO_TIPO_LABELS, DEPARTAMENTOS_CO } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Download, RefreshCw, FileText, Clock, CheckCircle2, Save } from 'lucide-react'

const arcoSchema = z.object({
  tipo: z.enum(['acceso', 'rectificacion', 'supresion', 'revocacion']),
  descripcion: z.string().min(10, 'Describe tu solicitud (mín. 10 caracteres)'),
})

const perfilSchema = z.object({
  full_name: z.string().min(3, 'Nombre requerido'),
  document_type: z.string(),
  document_id: z.string().min(4, 'Documento requerido'),
  phone: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  cargo_entidad: z.string().optional(),
})

type ArcoFormData = z.infer<typeof arcoSchema>
type PerfilFormData = z.infer<typeof perfilSchema>

const ARCO_ESTADO_COLORS: Record<string, string> = {
  pendiente: 'secondary', en_proceso: 'outline',
  resuelta: 'default', escalada: 'outline', rechazada: 'destructive',
}
const ARCO_ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', en_proceso: 'En proceso',
  resuelta: 'Resuelta', escalada: 'Escalada', rechazada: 'Rechazada',
}

export function MisDatosClient({ profile, solicitudesArco }: { profile: any; solicitudesArco: any[] }) {
  const [loadingArco, setLoadingArco] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const supabase = createClient()

  const arcoForm = useForm<ArcoFormData>({
    resolver: zodResolver(arcoSchema),
    defaultValues: { tipo: 'acceso', descripcion: '' },
  })

  const perfilForm = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      document_type: profile?.document_type ?? 'CC',
      document_id: profile?.document_id === 'PENDIENTE' ? '' : (profile?.document_id ?? ''),
      phone: profile?.phone ?? '',
      city: profile?.city ?? '',
      department: profile?.department ?? '',
      cargo_entidad: profile?.cargo_entidad ?? '',
    },
  })

  async function exportarDatos() {
    const blob = new Blob([JSON.stringify({ perfil: profile, fecha_exportacion: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mis-datos-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Datos exportados correctamente')
  }

  async function onSubmitPerfil(data: PerfilFormData) {
    setLoadingPerfil(true)
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({
          full_name: data.full_name,
          document_type: data.document_type,
          document_id: data.document_id,
          phone: data.phone || null,
          city: data.city || null,
          department: data.department || null,
          cargo_entidad: data.cargo_entidad || null,
        })
        .eq('id', profile.id)
      if (error) throw error
      toast.success('Datos actualizados correctamente')
    } catch {
      toast.error('Error al actualizar los datos')
    } finally {
      setLoadingPerfil(false)
    }
  }

  async function onSubmitArco(data: ArcoFormData) {
    setLoadingArco(true)
    try {
      const fechaLimite = new Date()
      fechaLimite.setDate(fechaLimite.getDate() + 14)
      const { error } = await (supabase.from('solicitudes_arco') as any).insert({
        user_id: profile.id,
        tipo: data.tipo,
        descripcion: data.descripcion,
        estado: 'pendiente',
        fecha_limite: fechaLimite.toISOString().split('T')[0],
      })
      if (error) throw error
      toast.success('Solicitud enviada. El administrador responderá en máx. 10 días hábiles.')
      arcoForm.reset()
    } catch {
      toast.error('Error al enviar la solicitud')
    } finally {
      setLoadingArco(false)
    }
  }

  return (
    <Tabs defaultValue="datos">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="datos">Mis datos</TabsTrigger>
        <TabsTrigger value="editar">Editar</TabsTrigger>
        <TabsTrigger value="arco">ARCO</TabsTrigger>
        <TabsTrigger value="nueva">Nueva solicitud</TabsTrigger>
      </TabsList>

      {/* VER DATOS */}
      <TabsContent value="datos">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Datos almacenados</CardTitle>
              <Button variant="outline" size="sm" onClick={exportarDatos} className="gap-2">
                <Download className="h-4 w-4" /> Exportar JSON
              </Button>
            </div>
            <CardDescription>
              Consentimiento: {profile.fecha_consentimiento ? formatDate(profile.fecha_consentimiento) : 'N/A'}
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
                ...(profile.cargo_entidad ? [{ label: 'Cargo', value: profile.cargo_entidad }] : []),
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
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* EDITAR DATOS */}
      <TabsContent value="editar">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actualizar datos</CardTitle>
            <CardDescription>Modifica tu información personal</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...perfilForm}>
              <form onSubmit={perfilForm.handleSubmit(onSubmitPerfil)} className="space-y-4">
                <FormField control={perfilForm.control} name="full_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-3 gap-2">
                  <FormField control={perfilForm.control} name="document_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo doc.</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['CC','CE','TI','PA','PEP'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={perfilForm.control} name="document_id" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Número de documento</FormLabel>
                      <FormControl><Input placeholder="1012345678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={perfilForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input placeholder="3001234567" {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-2">
                  <FormField control={perfilForm.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                        <SelectContent className="max-h-48">
                          {DEPARTAMENTOS_CO.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={perfilForm.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl><Input placeholder="Bogotá" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                {(profile.role === 'proveedor' || profile.role === 'empresa_privada') && (
                  <FormField control={perfilForm.control} name="cargo_entidad" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo en la entidad</FormLabel>
                      <FormControl><Input placeholder="Jefe de RRHH" {...field} /></FormControl>
                    </FormItem>
                  )} />
                )}

                <Button type="submit" className="w-full gap-2" disabled={loadingPerfil}>
                  {loadingPerfil ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar cambios
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SOLICITUDES ARCO */}
      <TabsContent value="arco">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de solicitudes ARCO</CardTitle>
          </CardHeader>
          <CardContent>
            {solicitudesArco.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No tienes solicitudes previas</div>
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
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(s.created_at)}</span>
                      <span>Plazo: {formatDate(s.fecha_limite)}</span>
                    </div>
                    {s.respuesta && (
                      <div className="bg-green-50 rounded p-2 text-xs">
                        <p className="font-medium text-green-800 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Respuesta</p>
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
            <CardDescription>El administrador responderá en máximo 10 días hábiles según la Ley 1581</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...arcoForm}>
              <form onSubmit={arcoForm.handleSubmit(onSubmitArco)} className="space-y-4">
                <FormField control={arcoForm.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de solicitud</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                <FormField control={arcoForm.control} name="descripcion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea placeholder="Describe tu solicitud..." rows={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loadingArco}>
                  {loadingArco && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
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
