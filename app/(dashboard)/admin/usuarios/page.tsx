import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { User } from 'lucide-react'
import { CrearUsuarioForm } from '@/components/admin/crear-usuario-form'
import { EliminarUsuarioBtn } from '@/components/admin/eliminar-usuario-btn'

export default async function AdminUsuariosPage() {
  const supabase = createAdminClient()

  const [usuariosRes, entidadesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(`id, role, full_name, email, document_id, city, department, created_at, entidades (nombre)`)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('entidades')
      .select('id, nombre, tipo')
      .eq('activo', true)
      .order('nombre'),
  ])

  const usuarios = usuariosRes.data ?? []
  const entidades = (entidadesRes.data ?? []) as { id: string; nombre: string; tipo: string }[]

  const ROLE_COLORS: Record<string, string> = {
    admin: 'destructive', proveedor: 'default',
    empresa_privada: 'secondary', aspirante: 'outline',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gestión de usuarios</h1>
          <p className="text-sm text-muted-foreground">{usuarios.length} usuarios registrados</p>
        </div>
        <CrearUsuarioForm entidades={entidades} />
      </div>

      <div className="space-y-2">
        {(usuarios as any[]).map((u) => (
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
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · Doc: {u.document_id}
                    {u.entidades?.nombre && ` · ${u.entidades.nombre}`}
                    {u.city && ` · ${u.city}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
                  <EliminarUsuarioBtn userId={u.id} nombre={u.full_name} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {usuarios.length === 0 && (
          <p className="text-center py-12 text-muted-foreground text-sm">No hay usuarios registrados</p>
        )}
      </div>
    </div>
  )
}
