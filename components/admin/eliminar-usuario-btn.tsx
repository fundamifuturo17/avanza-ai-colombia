'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { eliminarUsuario } from '@/app/actions/admin-usuarios'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function EliminarUsuarioBtn({ userId, nombre }: { userId: string; nombre: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const router = useRouter()

  async function handleEliminar() {
    setLoading(true)
    const { error } = await eliminarUsuario(userId)
    setLoading(false)
    if (error) {
      toast.error(`Error al eliminar: ${error}`)
    } else {
      toast.success(`Usuario ${nombre} eliminado`)
      router.refresh()
    }
    setConfirmar(false)
  }

  if (confirmar) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
        <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={handleEliminar} disabled={loading}>
          {loading ? '...' : 'Sí'}
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setConfirmar(false)}>
          No
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
      onClick={() => setConfirmar(true)}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
