'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ChevronRight, ChevronLeft, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const paso1Schema = z.object({
  empresa_nombre: z.string().min(3, 'Razón social requerida'),
  nit: z.string().min(8, 'NIT requerido'),
  sector_economico: z.string().min(1, 'Sector requerido'),
  tamano_empresa: z.string().min(1, 'Tamaño requerido'),
})

const paso2Schema = z.object({
  full_name: z.string().min(3, 'Nombre requerido'),
  document_id: z.string().min(6, 'Documento requerido'),
  cargo_entidad: z.string().min(2, 'Cargo requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  consentimiento: z.boolean().refine((v) => v === true, { message: 'Debes aceptar el tratamiento de datos' }),
})

type Paso1Data = z.infer<typeof paso1Schema>
type Paso2Data = z.infer<typeof paso2Schema>

export default function RegistroEmpresaPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [datosEmpresa, setDatosEmpresa] = useState<Paso1Data | null>(null)

  const form1 = useForm<Paso1Data>({
    resolver: zodResolver(paso1Schema),
    defaultValues: { empresa_nombre: '', nit: '', sector_economico: '', tamano_empresa: '' },
  })

  const form2 = useForm<Paso2Data>({
    resolver: zodResolver(paso2Schema),
    defaultValues: { full_name: '', document_id: '', cargo_entidad: '', email: '', password: '', consentimiento: false },
  })

  function handlePaso1(data: Paso1Data) {
    setDatosEmpresa(data)
    setPaso(2)
  }

  async function handlePaso2(data: Paso2Data) {
    if (!datosEmpresa) return
    setLoading(true)
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: 'empresa_privada',
          full_name: data.full_name,
          document_id: data.document_id,
          cargo_entidad: data.cargo_entidad,
          entidad_nombre: datosEmpresa.empresa_nombre,
          nit: datosEmpresa.nit,
          sector_economico: datosEmpresa.sector_economico,
          tamano_empresa: datosEmpresa.tamano_empresa,
        }),
      })
      const json = await res.json()
      if (json.error) { toast.error(json.error); return }

      // Auto-login
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      setPaso(3)
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  if (paso === 3) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <Clock className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Empresa registrada</h2>
          <p className="text-muted-foreground text-sm">
            Tu empresa está pendiente de validación. El proceso toma máximo 2 días hábiles.
            Una vez aprobada, podrás publicar vacantes.
          </p>
          <Button variant="outline" className="w-full" onClick={() => router.push('/empresa')}>
            Ir a mi tablero
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={paso >= 1 ? 'default' : 'secondary'}>1</Badge>
          <div className="h-px flex-1 bg-border" />
          <Badge variant={paso >= 2 ? 'default' : 'secondary'}>2</Badge>
        </div>
        <CardTitle>Registro — Empresa Privada</CardTitle>
        <CardDescription>
          {paso === 1 ? 'Datos de tu empresa' : 'Datos del representante'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paso === 1 && (
          <Form {...form1}>
            <form onSubmit={form1.handleSubmit(handlePaso1)} className="space-y-4">
              <FormField control={form1.control} name="empresa_nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón social</FormLabel>
                  <FormControl><Input placeholder="TechSalud SAS" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form1.control} name="nit" render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT</FormLabel>
                  <FormControl><Input placeholder="901234567" {...field} /></FormControl>
                  <FormDescription>Sin dígito de verificación</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form1.control} name="sector_economico" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector económico</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Tecnología', 'Salud', 'Educación', 'Logística', 'Manufactura',
                        'Comercio', 'Construcción', 'Financiero', 'Consultoría', 'Otro'].map((s) => (
                        <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form1.control} name="tamano_empresa" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamaño de empresa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="microempresa">Microempresa (1-10)</SelectItem>
                      <SelectItem value="pequena">Pequeña (11-50)</SelectItem>
                      <SelectItem value="mediana">Mediana (51-200)</SelectItem>
                      <SelectItem value="grande">Grande (200+)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full">
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        )}

        {paso === 2 && (
          <Form {...form2}>
            <form onSubmit={form2.handleSubmit(handlePaso2)} className="space-y-4">
              <FormField control={form2.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input placeholder="Ana López" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form2.control} name="document_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula</FormLabel>
                  <FormControl><Input placeholder="1034567890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form2.control} name="cargo_entidad" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl><Input placeholder="Gerente de Talento Humano" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form2.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo empresarial</FormLabel>
                  <FormControl><Input type="email" placeholder="tu@empresa.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form2.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form2.control} name="consentimiento" render={({ field }) => (
                <FormItem className="flex gap-3 items-start space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1">
                    <FormLabel className="cursor-pointer">Autorizo el tratamiento de mis datos personales</FormLabel>
                    <p className="text-xs text-muted-foreground">De acuerdo con la Ley 1581 de 2012.</p>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPaso(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar empresa
                </Button>
              </div>
            </form>
          </Form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
        </p>
      </CardContent>
    </Card>
  )
}
