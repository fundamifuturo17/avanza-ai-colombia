import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { User, MapPin, FileText } from 'lucide-react'

export default async function AdminAspirantesPage() {
  const supabase = await createClient()

  const { data: aspirantes } = await (supabase as any)
    .from('profiles')
    .select(`
      id, full_name, email, document_id, document_type,
      city, department, phone, created_at,
      postulaciones(id, estado)
    `)
    .eq('role', 'aspirante')
    .order('created_at', { ascending: false })
    .limit(200)

  const total = aspirantes?.length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Aspirantes</h1>
        <p className="text-sm text-muted-foreground">{total} registrados</p>
      </div>

      <div className="space-y-2">
        {!aspirantes?.length && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No hay aspirantes registrados
          </div>
        )}
        {(aspirantes ?? []).map((a: any) => {
          const postulaciones = (a.postulaciones as any[]) ?? []
          const activas = postulaciones.filter(
            (p) => !['rechazado', 'retirado'].includes(p.estado)
          ).length

          return (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{a.document_type}: {a.document_id}</span>
                        {(a.city || a.department) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[a.city, a.department].filter(Boolean).join(', ')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {postulaciones.length} postulaciones
                          {activas > 0 && ` · ${activas} activas`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(a.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
