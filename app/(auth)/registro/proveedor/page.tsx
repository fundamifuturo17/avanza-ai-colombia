'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'

const paso1Schema = z.object({
  entidad_nombre: z.string().min(3, 'Nombre de entidad requerido'),
  entidad_nit: z.string().min(8, 'NIT requerido'),
  cargo_entidad: z.string().min(2, 'Cargo requerido'),
})

const paso2Schema = z.object({
  full_name: z.string().min(3, 'Nombre requerido'),
  document_id: z.string().min(6, 'Documento requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type Paso1Data = z.infer<typeof paso1Schema>
type Paso2Data = z.infer<typeof paso2Schema>

export default function RegistroProveedorPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [datosEntidad, setDatosEntidad] = useState<Paso1Data | null>(null)

  const form1 = useForm<Paso1Data>({
    resolver: zodResolver(paso1Schema),
    defaultValues: { entidad_nombre: '', entidad_nit: '', cargo_entidad: '' },
  })

  const form2 = useForm<Paso2Data>({
    resolver: zodResolver(paso2Schema),
    defaultValues: { full_name: '', document_id: '', email: '', password: '' },
  })

  function handlePaso1(data: Paso1Data) {
    setDatosEntidad(data)
    setPaso(2)
  }

  async function handlePaso2(data: Paso2Data) {
    if (!datosEntidad) return
    const supabase = createClient()
    setLoading(true)

    try {
      // Buscar entidad por NIT
      const { data: entidad } = await supabase
        .from('entidades')
        .select('id, nombre, tipo')
        .eq('nit', datosEntidad.entidad_nit.replace(/\D/g, ''))
        .eq('tipo', 'publico')
        .single()

      if (!entidad) {
        toast.error('Entidad pública no encontrada. Verifica el NIT.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'proveedor',
            full_name: data.full_name,
            document_id: data.document_id,
            document_type: 'CC',
            entidad_id: (entidad as any).id,
            cargo_entidad: datosEntidad.cargo_entidad,
            consentimiento_datos: true,
            fecha_consentimiento: new Date().toISOString(),
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setPaso(3)
    } catch {
      toast.error('Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (paso === 3) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <Clock className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Solicitud enviada</h2>
          <p className="text-muted-foreground text-sm">
            Tu cuenta está pendiente de aprobación por el administrador.
            Recibirás un correo cuando sea aprobada (máx. 2 días hábiles).
          </p>
          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            Volver al inicio
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
        <CardTitle>Registro — Entidad Pública</CardTitle>
        <CardDescription>
          {paso === 1 ? 'Datos de tu entidad' : 'Datos personales del funcionario'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paso === 1 && (
          <Form {...form1}>
            <form onSubmit={form1.handleSubmit(handlePaso1)} className="space-y-4">
              <FormField control={form1.control} name="entidad_nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la entidad</FormLabel>
                  <FormControl><Input placeholder="Ministerio de Salud..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form1.control} name="entidad_nit" render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT de la entidad</FormLabel>
                  <FormControl><Input placeholder="899999001" {...field} /></FormControl>
                  <FormDescription>Sin dígito de verificación</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form1.control} name="cargo_entidad" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu cargo</FormLabel>
                  <FormControl><Input placeholder="Jefe de Recursos Humanos" {...field} /></FormControl>
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
                  <FormControl><Input placeholder="Carlos Rodríguez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form2.control} name="document_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula de ciudadanía</FormLabel>
                  <FormControl><Input placeholder="1023456789" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form2.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo institucional</FormLabel>
                  <FormControl><Input type="email" placeholder="cargo@entidad.gov.co" {...field} /></FormControl>
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

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPaso(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar solicitud
                </Button>
              </div>
            </form>
          </Form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
