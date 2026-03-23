'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { DEPARTAMENTOS_CO } from '@/lib/constants'

export function FiltrosVacantes() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'todos') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  function limpiarFiltros() {
    router.push('?')
  }

  const tieneFiltros = searchParams.toString().length > 0

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar vacante..."
          className="pl-9 h-9"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={(e) => updateParam('q', e.target.value)}
        />
      </div>

      <Select
        key={`sector-${searchParams.get('sector') ?? 'todos'}`}
        value={searchParams.get('sector') ?? 'todos'}
        onValueChange={(v) => updateParam('sector', v ?? '')}
      >
        <SelectTrigger className="w-36 h-9">
          <SelectValue placeholder="Sector" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="publico">Público</SelectItem>
          <SelectItem value="privado">Privado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        key={`dep-${searchParams.get('departamento') ?? 'todos'}`}
        value={searchParams.get('departamento') ?? 'todos'}
        onValueChange={(v) => updateParam('departamento', v ?? '')}
      >
        <SelectTrigger className="w-44 h-9">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          <SelectItem value="todos">Todos</SelectItem>
          {DEPARTAMENTOS_CO.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {tieneFiltros && (
        <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="h-9 gap-1 text-muted-foreground">
          <X className="h-3 w-3" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
