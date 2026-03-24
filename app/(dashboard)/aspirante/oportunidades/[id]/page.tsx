import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PostularBtn } from '@/components/aspirante/postular-btn'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Calendar, Briefcase, Building2, Clock, FileText } from 'lucide-react'
import { formatSalarioRange, formatDate, diasRestantes } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function VacanteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [vacanteRes, postulacionRes] = await Promise.all([
    (supabase as any)
      .from('vacantes')
      .select('*, entidades(id, nombre, tipo, validado, nivel_gobierno)')
      .eq('id', id)
      .eq('estado', 'publicada')
      .maybeSingle(),
    (supabase as any)
      .from('postulaciones')
      .select('id, estado, created_at')
      .eq('vacante_id', id)
      .eq('aspirante_id', user!.id)
      .maybeSingle(),
  ])

  const vacante = vacanteRes.data
  if (!vacante) notFound()

  const postulacion = postulacionRes.data
  const dias = vacante.fecha_cierre ? diasRestantes(vacante.fecha_cierre) : null
  const esPublico = vacante.entidades?.tipo === 'publico'
  const cerrada = dias !== null && dias < 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/aspirante/oportunidades">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ChevronLeft className="h-4 w-4" /> Volver a oportunidades
        </Button>
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={esPublico ? 'default' : 'secondary'}>
            {esPublico ? 'Sector Público' : 'Sector Privado'}
          </Badge>
          {vacante.entidades?.validado && (
            <Badge variant="outline">✓ Entidad verificada</Badge>
          )}
          {dias !== null && dias <= 3 && dias >= 0 && (
            <Badge variant="destructive">Cierra en {dias} días</Badge>
          )}
          {cerrada && <Badge variant="secondary">Convocatoria cerrada</Badge>}
        </div>

        <h1 className="text-2xl font-bold">{vacante.titulo}</h1>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{vacante.entidades?.nombre ?? 'Entidad'}</span>
          {vacante.entidades?.nivel_gobierno && (
            <span className="text-sm">· {vacante.entidades.nivel_gobierno}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {(vacante.departamento || vacante.municipio) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[vacante.municipio, vacante.departamento].filter(Boolean).join(', ')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {vacante.tipo_contrato?.replace(/_/g, ' ')}
          </span>
          {vacante.fecha_cierre && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Cierre: {formatDate(vacante.fecha_cierre)}
            </span>
          )}
          {vacante.numero_convocatoria && (
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Conv. {vacante.numero_convocatoria}
            </span>
          )}
        </div>

        {vacante.visible_salario && (
          <p className="text-lg font-semibold text-green-700">
            {formatSalarioRange(vacante.salario_min, vacante.salario_max)}
          </p>
        )}
      </div>

      {/* Postulación status / botón */}
      <PostularBtn
        vacanteId={id}
        postulacion={postulacion}
        cerrada={cerrada}
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-5 space-y-2">
            <h2 className="font-semibold">Descripción del cargo</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vacante.descripcion}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-2">
            <h2 className="font-semibold">Requisitos</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vacante.requisitos}</p>
          </CardContent>
        </Card>

        {vacante.beneficios && (
          <Card>
            <CardContent className="pt-5 space-y-2">
              <h2 className="font-semibold">Beneficios</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vacante.beneficios}</p>
            </CardContent>
          </Card>
        )}

        {esPublico && vacante.presupuesto_programado && (
          <Card>
            <CardContent className="pt-5 space-y-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" /> Información de transparencia
              </h2>
              <p className="text-sm text-muted-foreground">
                Presupuesto programado: ${Number(vacante.presupuesto_programado).toLocaleString('es-CO')} COP
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
