'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'

const schema = z.object({
  full_name: z.string().min(3, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  consentimiento: z.boolean().refine((v) => v === true, { message: 'Debes aceptar el tratamiento de datos' }),
})

type FormData = z.infer<typeof schema>

export default function RegistroAspirantePage() {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', consentimiento: false },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, role: 'aspirante', full_name: data.full_name }),
      })
      const json = await res.json()
      if (json.error) { toast.error(json.error); return }

      // Iniciar sesión automáticamente
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      if (loginError) { setDone(true); return }

      router.push('/aspirante/oportunidades')
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
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">¡Cuenta creada!</h2>
          <p className="text-muted-foreground text-sm">Tu cuenta está lista.</p>
          <Button className="w-full" onClick={() => router.push('/login')}>Ir a iniciar sesión</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear cuenta — Aspirante</CardTitle>
        <CardDescription>Registro básico. Completa tu perfil después.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl><Input placeholder="María García López" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl><Input type="email" placeholder="tu@correo.com" {...field} /></FormControl>
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
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1">
                  <FormLabel className="cursor-pointer">Autorizo el tratamiento de mis datos personales</FormLabel>
                  <p className="text-xs text-muted-foreground">De acuerdo con la Ley 1581 de 2012.</p>
                  <FormMessage />
                </div>
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cuenta
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
