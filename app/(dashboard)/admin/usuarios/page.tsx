import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { User } from 'lucide-react'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()

  const { data: usuarios } = await supabase
    .from('profiles')
    .select(`
      id, role, full_name, email, document_id, city, department,
      created_at, solicitud_supresion,
      entidades (nombre)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const ROLE_COLORS: Record<string, string> = {
    admin: 'destructive', proveedor: 'default',
    empresa_privada: 'secondary', aspirante: 'outline',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground">{usuarios?.length ?? 0} usuarios registrados</p>
      </div>

      <div className="space-y-2">
        {(usuarios as any[])?.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{u.full_name}</span>
                    <Badge variant={ROLE_COLORS[u.role] as any} className="text-xs">
                      {ROLE_LABELS[u.role]}
                    </Badge>
                    {u.solicitud_supresion && (
                      <Badge variant="destructive" className="text-xs">Solicitud supresión</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · Doc: {u.document_id}
                    {(u.entidades as any)?.nombre && ` · ${(u.entidades as any).nombre}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(u.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
