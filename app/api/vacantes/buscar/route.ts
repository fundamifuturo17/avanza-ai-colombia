import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const limit = parseInt(searchParams.get('limit') ?? '10')

  const supabase = await createClient()

  let query = supabase
    .from('vacantes')
    .select(`
      id, titulo, departamento, salario_min, salario_max, visible_salario,
      entidades (nombre)
    `)
    .eq('estado', 'publicada')
    .limit(limit)

  if (q) {
    query = query.ilike('titulo', `%${q}%`)
  }

  const { data: vacantes, error } = await query

  if (error) {
    return Response.json({ error: 'Error al buscar vacantes' }, { status: 500 })
  }

  return Response.json({ vacantes })
}
