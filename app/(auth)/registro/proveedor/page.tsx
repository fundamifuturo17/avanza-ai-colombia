'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Clock } from 'lucide-react'
import { crearPerfilProveedor } from '@/app/actions/registro'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'

const schema = z.object({
  full_name: z.string().min(3, 'Nombre requerido'),
  entidad_nombre: z.string().min(3, 'Nombre de entidad requerido'),
  cargo_entidad: z.string().min(2, 'Cargo requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  consentimiento: z.boolean().refine((v) => v === true, { message: 'Debes aceptar el tratamiento de datos' }),
})

type FormData = z.infer<typeof schema>

export default function RegistroProveedorPage() {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', entidad_nombre: '', cargo_entidad: '', email: '', password: '', consentimiento: false },
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    setLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (error) { toast.error(error.message); return }
      if (!authData.user) { toast.error('Error al crear la cuenta'); return }

      let perfilError: string | null = null
      try {
        const res = await crearPerfilProveedor({
          userId: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          document_id: 'PENDIENTE',
          document_type: 'CC',
          cargo_entidad: data.cargo_entidad,
        })
        perfilError = res?.error ?? null
      } catch (e) {
        perfilError = e instanceof Error ? e.message : 'Error desconocido'
      }

      if (perfilError) { toast.error(`Error: ${perfilError}`); return }

      setDone(true)
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <Clock className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Solicitud enviada</h2>
          <p className="text-muted-foreground text-sm">
            Tu cuenta está pendiente de aprobación. El administrador la revisará en máx. 2 días hábiles.
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
        <CardTitle>Registro — Servicios Públicos</CardTitle>
        <CardDescription>Registro básico para funcionarios de entidades públicas.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl><Input placeholder="Carlos Rodríguez Pérez" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="entidad_nombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la entidad</FormLabel>
                <FormControl><Input placeholder="Ministerio de Salud" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="cargo_entidad" render={({ field }) => (
              <FormItem>
                <FormLabel>Tu cargo</FormLabel>
                <FormControl><Input placeholder="Jefe de Recursos Humanos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Correo institucional</FormLabel>
                <FormControl><Input type="email" placeholder="cargo@entidad.gov.co" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="consentimiento" render={({ field }) => (
              <FormItem className="flex gap-3 items-start space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="cursor-pointer">Autorizo el tratamiento de mis datos personales</FormLabel>
                  <p className="text-xs text-muted-foreground">De acuerdo con la Ley 1581 de 2012.</p>
                  <FormMessage />
                </div>
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar solicitud
            </Button>
          </form>
        </Form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
        </p>
      </CardContent>
    </Card>
  )
}
