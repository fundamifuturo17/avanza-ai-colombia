'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEPARTAMENTOS_CO } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const paso1Schema = z.object({
  full_name: z.string().min(3, 'Nombre requerido'),
  document_id: z.string().min(6, 'Documento requerido'),
  document_type: z.string(),
  department: z.string().min(1, 'Departamento requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  phone: z.string().optional(),
})

const paso2Schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  consentimiento: z.boolean().refine((v) => v === true, { message: 'Debes aceptar el tratamiento de datos' }),
})

type Paso1Data = z.infer<typeof paso1Schema>
type Paso2Data = z.infer<typeof paso2Schema>

export default function RegistroAspirantePage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [datosPersonales, setDatosPersonales] = useState<Paso1Data | null>(null)
  const supabase = createClient()

  const form1 = useForm<Paso1Data>({
    resolver: zodResolver(paso1Schema),
    defaultValues: { document_type: 'CC', full_name: '', document_id: '', department: '', city: '', phone: '' },
  })

  const form2 = useForm<Paso2Data>({
    resolver: zodResolver(paso2Schema),
    defaultValues: { email: '', password: '', consentimiento: false },
  })

  function handlePaso1(data: Paso1Data) {
    setDatosPersonales(data)
    setPaso(2)
  }

  async function handlePaso2(data: Paso2Data) {
    if (!datosPersonales) return
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'aspirante',
            full_name: datosPersonales.full_name,
            document_id: datosPersonales.document_id,
            document_type: datosPersonales.document_type,
            phone: datosPersonales.phone,
            city: datosPersonales.city,
            department: datosPersonales.department,
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
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">¡Registro exitoso!</h2>
          <p className="text-muted-foreground text-sm">
            Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
          </p>
          <Button className="w-full" onClick={() => router.push('/auth/login')}>
            Ir a iniciar sesión
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
        <CardTitle>Crear cuenta como aspirante</CardTitle>
        <CardDescription>
          {paso === 1 ? 'Datos personales' : 'Acceso y consentimiento de datos'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paso === 1 && (
          <Form {...form1}>
            <form onSubmit={form1.handleSubmit(handlePaso1)} className="space-y-4">
              <FormField control={form1.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input placeholder="María García López" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-2">
                <FormField control={form1.control} name="document_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CC">CC</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="TI">TI</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form1.control} name="document_id" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Número de documento</FormLabel>
                    <FormControl><Input placeholder="1012345678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form1.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-48">
                      {DEPARTAMENTOS_CO.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form1.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl><Input placeholder="Bogotá" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form1.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl><Input placeholder="3001234567" {...field} /></FormControl>
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
              <FormField control={form2.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl><Input type="email" placeholder="tu@correo.com" {...field} /></FormControl>
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
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="cursor-pointer">
                      Autorizo el tratamiento de mis datos personales
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      De acuerdo con la Ley 1581 de 2012, autorizo la recolección,
                      almacenamiento y uso de mis datos para los fines de la plataforma.
                    </p>
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
                  Crear cuenta
                </Button>
              </div>
            </form>
          </Form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
