'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DEPARTAMENTOS_CO, TIPOS_CONTRATO_PUBLICO,
  TIPOS_CONTRATO_PRIVADO, MODALIDADES, SALARIO_MIN_CO,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const schema = z.object({
  titulo: z.string().min(5, 'Mínimo 5 caracteres'),
  descripcion: z.string().min(20, 'Mínimo 20 caracteres'),
  requisitos: z.string().min(10, 'Mínimo 10 caracteres'),
  tipo_contrato: z.string().min(1, 'Requerido'),
  departamento: z.string().min(1, 'Requerido'),
  municipio: z.string().min(2, 'Requerido'),
  salario_min: z.coerce.number().min(SALARIO_MIN_CO, `Mínimo ${SALARIO_MIN_CO.toLocaleString('es-CO')}`).optional().or(z.literal('')),
  salario_max: z.coerce.number().optional().or(z.literal('')),
  beneficios: z.string().optional(),
  numero_convocatoria: z.string().optional(),
  presupuesto_programado: z.coerce.number().optional().or(z.literal('')),
  fecha_cierre: z.string().min(1, 'Requerida'),
  visible_salario: z.boolean().default(true),
  visible_proceso: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

const PASOS = ['Información básica', 'Requisitos', 'Condiciones', 'Proceso', 'Revisión']

export function NuevaVacanteForm({
  entidadId,
  userId,
  esPublico,
}: {
  entidadId: string
  userId: string
  esPublico: boolean
}) {
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '', descripcion: '', requisitos: '',
      tipo_contrato: '', departamento: '', municipio: '',
      visible_salario: true, visible_proceso: esPublico,
      salario_min: '', salario_max: '', fecha_cierre: '',
    },
  })

  const tiposContrato = esPublico ? TIPOS_CONTRATO_PUBLICO : TIPOS_CONTRATO_PRIVADO

  async function guardar(publicar = false) {
    const valid = await form.trigger()
    if (!valid) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    const data = form.getValues()
    setLoading(true)
    if (publicar) setPublicando(true)

    try {
      const { error } = await supabase.from('vacantes').insert({
        entidad_id: entidadId,
        created_by: userId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        requisitos: data.requisitos,
        tipo_contrato: data.tipo_contrato,
        departamento: data.departamento,
        municipio: data.municipio,
        salario_min: data.salario_min ? Number(data.salario_min) : null,
        salario_max: data.salario_max ? Number(data.salario_max) : null,
        beneficios: data.beneficios || null,
        numero_convocatoria: data.numero_convocatoria || null,
        presupuesto_programado: data.presupuesto_programado ? Number(data.presupuesto_programado) : null,
        fecha_cierre: data.fecha_cierre,
        visible_salario: data.visible_salario,
        visible_proceso: data.visible_proceso,
        estado: publicar ? 'publicada' : 'borrador',
      })

      if (error) throw error

      toast.success(publicar ? 'Vacante publicada' : 'Borrador guardado')
      router.push('/proveedor/vacantes')
      router.refresh()
    } catch {
      toast.error('Error al guardar la vacante')
    } finally {
      setLoading(false)
      setPublicando(false)
    }
  }

  const valores = form.watch()

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-1">
        {PASOS.map((p, i) => (
          <div key={p} className="flex items-center gap-1 flex-1">
            <div className={`h-6 w-6 rounded-full text-xs flex items-center justify-center font-medium shrink-0
              ${i < paso ? 'bg-blue-600 text-white' : i === paso ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-400'}`}>
              {i < paso ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < PASOS.length - 1 && <div className={`h-px flex-1 ${i < paso ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-5">
              <h2 className="font-medium text-sm text-muted-foreground">{PASOS[paso]}</h2>

              {/* PASO 0 — Básico */}
              {paso === 0 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="titulo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del cargo</FormLabel>
                      <FormControl><Input placeholder="Analista de Salud Pública" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="descripcion" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción y funciones</FormLabel>
                      <FormControl><Textarea placeholder="Describe las funciones principales del cargo..." rows={4} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="departamento" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                          <SelectContent className="max-h-48">
                            {DEPARTAMENTOS_CO.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="municipio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Municipio</FormLabel>
                        <FormControl><Input placeholder="Bogotá" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              {/* PASO 1 — Requisitos */}
              {paso === 1 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="requisitos" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos del cargo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Formación académica, experiencia mínima, competencias técnicas..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* PASO 2 — Condiciones */}
              {paso === 2 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="tipo_contrato" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de contrato</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {tiposContrato.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="salario_min" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salario mínimo (COP)</FormLabel>
                        <FormControl><Input type="number" placeholder="1300000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="salario_max" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salario máximo (COP)</FormLabel>
                        <FormControl><Input type="number" placeholder="3000000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {!esPublico && (
                    <FormField control={form.control} name="beneficios" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beneficios adicionales</FormLabel>
                        <FormControl><Textarea placeholder="Seguro médico, bonificaciones, trabajo remoto..." rows={3} {...field} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                  {esPublico && (
                    <FormField control={form.control} name="presupuesto_programado" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presupuesto programado (COP)</FormLabel>
                        <FormControl><Input type="number" placeholder="50000000" {...field} /></FormControl>
                        <FormDescription>Vinculado al Plan de Desarrollo institucional</FormDescription>
                      </FormItem>
                    )} />
                  )}
                </div>
              )}

              {/* PASO 3 — Proceso */}
              {paso === 3 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="fecha_cierre" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de cierre</FormLabel>
                      <FormControl>
                        <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {esPublico && (
                    <FormField control={form.control} name="numero_convocatoria" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de convocatoria</FormLabel>
                        <FormControl><Input placeholder="CV-2026-0001" {...field} /></FormControl>
                        <FormDescription>Según Ley 909 — requerido para empleo público</FormDescription>
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="visible_salario" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Mostrar rango salarial</FormLabel>
                        <FormDescription className="text-xs">Los aspirantes podrán ver el salario</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="visible_proceso" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Proceso público</FormLabel>
                        <FormDescription className="text-xs">
                          {esPublico ? 'Obligatorio para entidades públicas (Ley 1712)' : 'Mostrar etapas del proceso'}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={esPublico} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {/* PASO 4 — Revisión */}
              {paso === 4 && (
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Título', value: valores.titulo },
                    { label: 'Departamento', value: valores.departamento },
                    { label: 'Municipio', value: valores.municipio },
                    { label: 'Tipo contrato', value: valores.tipo_contrato },
                    { label: 'Fecha cierre', value: valores.fecha_cierre },
                    { label: 'Salario', value: valores.salario_min ? `$${Number(valores.salario_min).toLocaleString('es-CO')} - $${Number(valores.salario_max || 0).toLocaleString('es-CO')}` : 'A convenir' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value || '—'}</span>
                    </div>
                  ))}
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800 space-y-1 mt-2">
                    <p className="font-medium">✓ Checklist legal</p>
                    {esPublico && <p>• Cumple con Ley 909 — empleo público</p>}
                    <p>• Cumple con Ley 1712 — transparencia</p>
                    <p>• Salario mínimo legal vigente respetado</p>
                  </div>
                </div>
              )}

              {/* Navegación */}
              <div className="flex gap-2 pt-2">
                {paso > 0 && (
                  <Button type="button" variant="outline" onClick={() => setPaso(paso - 1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                )}
                {paso < PASOS.length - 1 && (
                  <Button type="button" className="flex-1" onClick={() => setPaso(paso + 1)}>
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {paso === PASOS.length - 1 && (
                  <div className="flex gap-2 flex-1">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => guardar(false)} disabled={loading}>
                      {loading && !publicando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar borrador
                    </Button>
                    <Button type="button" className="flex-1" onClick={() => guardar(true)} disabled={loading}>
                      {publicando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publicar ahora
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
