import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function AdminAuditoriaPage() {
  const supabase = await createClient()

  const { data: logsRaw } = await supabase
    .from('audit_log')
    .select(`
      id, action, table_name, tipo_acceso, ip_address, path, created_at,
      profiles!user_id (full_name, role, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const logs = logsRaw as any[]

  const ACTION_COLORS: Record<string, string> = {
    INSERT: 'default', UPDATE: 'outline', DELETE: 'destructive',
    READ_SENSITIVE: 'secondary', LOGIN: 'secondary', LOGOUT: 'secondary', EXPORT: 'outline',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Log de auditoría</h1>
        <p className="text-sm text-muted-foreground">
          {logs?.length ?? 0} registros · Trazabilidad 100% conforme Ley 1712
        </p>
      </div>

      <div className="space-y-2">
        {!logs?.length && (
          <div className="text-center py-16 text-muted-foreground text-sm">Sin registros aún</div>
        )}
        {logs?.map((log) => {
          const profile = log.profiles as any
          return (
            <Card key={log.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={ACTION_COLORS[log.action] as any} className="text-xs shrink-0">
                    {log.action}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {log.table_name ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {profile?.full_name ?? 'Sistema'} · {profile?.role ?? ''}
                  </span>
                  {log.ip_address && (
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {log.ip_address}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                {log.path && (
                  <p className="text-xs text-muted-foreground mt-1 pl-1 font-mono">{log.path}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
