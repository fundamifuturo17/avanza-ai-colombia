'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { crearUsuarioAdmin } from '@/app/actions/admin-usuarios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'

interface Entidad {
  id: string
  nombre: string
  tipo: string
}

export function CrearUsuarioForm({ entidades }: { entidades: Entidad[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<string>('aspirante')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('role', role)

    const { error } = await crearUsuarioAdmin(formData)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Usuario creado correctamente')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const needsEntidad = role === 'proveedor' || role === 'empresa_privada'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Crear usuario
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => { if (v) setRole(v) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aspirante">Aspirante</SelectItem>
                <SelectItem value="proveedor">Proveedor (entidad pública)</SelectItem>
                <SelectItem value="empresa_privada">Empresa privada</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input name="full_name" required placeholder="María García López" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Tipo doc.</Label>
              <Select name="document_type" defaultValue="CC">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">CC</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="NIT">NIT</SelectItem>
                  <SelectItem value="PP">PP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Número documento</Label>
              <Input name="document_id" required placeholder="1234567890" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" required placeholder="usuario@email.com" />
          </div>

          <div className="space-y-1.5">
            <Label>Contraseña temporal</Label>
            <Input name="password" type="password" required placeholder="Mínimo 8 caracteres" minLength={8} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input name="city" placeholder="Bogotá" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input name="phone" placeholder="3001234567" />
            </div>
          </div>

          {needsEntidad && (
            <>
              <div className="space-y-1.5">
                <Label>Entidad</Label>
                <Select name="entidad_id">
                  <SelectTrigger><SelectValue placeholder="Seleccionar entidad" /></SelectTrigger>
                  <SelectContent>
                    {entidades.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cargo en la entidad</Label>
                <Input name="cargo_entidad" placeholder="Coordinador de RRHH" />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
