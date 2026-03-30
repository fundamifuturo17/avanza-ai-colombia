'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import type { AuditAction } from '@/types/database'

export async function insertarAuditLog({
  action,
  tableName,
  recordId,
  oldData,
  newData,
  tipoAcceso = 'escritura',
}: {
  action: AuditAction
  tableName?: string
  recordId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  tipoAcceso?: 'lectura' | 'escritura'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = headersList.get('user-agent') ?? null
  const path = headersList.get('referer') ?? null

  const serviceClient = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any).from('audit_log').insert({
    user_id: user.id,
    action,
    table_name: tableName ?? null,
    record_id: recordId ?? null,
    old_data: oldData ?? null,
    new_data: newData ?? null,
    ip_address: ip,
    user_agent: userAgent,
    path,
    tipo_acceso: tipoAcceso,
  })
  if (error) console.error('[audit] insert error:', error.message)
}
