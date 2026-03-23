import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Briefcase, Building2 } from 'lucide-react'
import { formatSalarioRange, formatRelativeDate, diasRestantes } from '@/lib/utils'
import { VACANTE_ESTADO_LABELS } from '@/lib/constants'

interface VacanteCardProps {
  vacante: {
    id: string
    titulo: string
    descripcion: string
    salario_min: number | null
    salario_max: number | null
    tipo_contrato: string
    departamento: string | null
    municipio: string | null
    fecha_cierre: string | null
    visible_salario: boolean
    estado: string
    created_at: string
    numero_convocatoria?: string | null
    entidades: {
      nombre: string
      tipo: string
      validado: boolean
    } | null
  }
  showActions?: boolean
}

export function VacanteCard({ vacante, showActions = true }: VacanteCardProps) {
  const dias = vacante.fecha_cierre ? diasRestantes(vacante.fecha_cierre) : null
  const esPublico = vacante.entidades?.tipo === 'publico'
  const urgente = dias !== null && dias <= 3 && dias >= 0

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="pt-5 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Badge variant={esPublico ? 'default' : 'secondary'} className="text-xs">
                {esPublico ? 'Público' : 'Privado'}
              </Badge>
              {urgente && (
                <Badge variant="destructive" className="text-xs">Cierra pronto</Badge>
              )}
              {vacante.entidades?.validado && (
                <Badge variant="outline" className="text-xs">✓ Verificada</Badge>
              )}
            </div>
            <h3 className="font-medium text-sm leading-tight">{vacante.titulo}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{vacante.entidades?.nombre ?? 'Entidad'}</span>
        </div>

        {(vacante.departamento || vacante.municipio) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{[vacante.municipio, vacante.departamento].filter(Boolean).join(', ')}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Briefcase className="h-3 w-3 shrink-0" />
          <span className="capitalize">{vacante.tipo_contrato.replace('_', ' ')}</span>
        </div>

        {vacante.visible_salario && (
          <p className="text-sm font-medium text-green-700">
            {formatSalarioRange(vacante.salario_min, vacante.salario_max)}
          </p>
        )}

        <p className="text-xs text-muted-foreground line-clamp-2">{vacante.descripcion}</p>

        {vacante.numero_convocatoria && (
          <p className="text-xs text-muted-foreground">
            Conv. {vacante.numero_convocatoria}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between gap-2">
        {vacante.fecha_cierre && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dias !== null && dias >= 0 ? `${dias}d restantes` : 'Cerrada'}
          </div>
        )}
        {!vacante.fecha_cierre && (
          <span className="text-xs text-muted-foreground">{formatRelativeDate(vacante.created_at)}</span>
        )}
        {showActions && (
          <Link href={`/aspirante/oportunidades/${vacante.id}`}>
            <Button size="sm" variant="outline" className="text-xs h-7">
              Ver más
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
