'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { POSTULACION_ESTADO_LABELS } from '@/lib/constants'

interface PostularBtnProps {
  vacanteId: string
  postulacion: { id: string; estado: string; created_at: string } | null
  cerrada: boolean
}

export function PostularBtn({ vacanteId, postulacion, cerrada }: PostularBtnProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  if (postulacion || done) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Ya estás postulado/a</p>
          {postulacion && (
            <p className="text-xs text-green-700">
              Estado:{' '}
              <span className="font-semibold">
                {(POSTULACION_ESTADO_LABELS as any)[postulacion.estado] ?? postulacion.estado}
              </span>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => router.push('/aspirante/mis-postulaciones')}
        >
          Mis postulaciones
        </Button>
      </div>
    )
  }

  if (cerrada) {
    return (
      <div className="p-4 rounded-lg bg-slate-50 border text-sm text-muted-foreground">
        Esta convocatoria ya cerró. Ya no se aceptan postulaciones.
      </div>
    )
  }

  async function postular() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await (supabase as any).from('postulaciones').insert({
        vacante_id: vacanteId,
        aspirante_id: (await supabase.auth.getUser()).data.user!.id,
        codigo_seguimiento: `EP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      })
      if (error) throw error
      toast.success('¡Postulación registrada!')
      setDone(true)
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al postularse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className="w-full sm:w-auto" onClick={postular} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Postularme a esta vacante
    </Button>
  )
}
