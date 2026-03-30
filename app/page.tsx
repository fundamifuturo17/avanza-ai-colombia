import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase, Users, Building2, TrendingUp,
  Bot, Shield, BarChart3, ArrowRight, CheckCircle2,
  Zap, Globe, Lock,
} from 'lucide-react'

async function getStats() {
  try {
    const supabase = await createClient()
    const [vacantes, postulaciones, entidades] = await Promise.all([
      supabase.from('vacantes').select('id', { count: 'exact', head: true }).eq('estado', 'publicada'),
      supabase.from('postulaciones').select('id', { count: 'exact', head: true }),
      supabase.from('entidades').select('id', { count: 'exact', head: true }).eq('validado', true),
    ])
    return {
      vacantes: vacantes.count ?? 0,
      postulaciones: postulaciones.count ?? 0,
      entidades: entidades.count ?? 0,
    }
  } catch {
    return { vacantes: 0, postulaciones: 0, entidades: 0 }
  }
}

async function getVacantesPublicadas() {
  try {
    const supabase = await createClient()
    const { data } = await (supabase as any)
      .from('vacantes')
      .select('id, titulo, tipo_contrato, departamento, municipio, salario_min, salario_max, visible_salario, fecha_cierre, created_at, entidades(nombre, tipo)')
      .eq('estado', 'publicada')
      .order('created_at', { ascending: false })
      .limit(6)
    return (data as any[]) ?? []
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const [stats, vacantesPublicadas] = await Promise.all([getStats(), getVacantesPublicadas()])

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">

      {/* NAV */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight">AVANZA AI</span>
            <Badge variant="secondary" className="text-xs font-medium hidden sm:flex">Colombia</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Ingresar
              </Button>
            </Link>
            <Link href="/registro/aspirante">
              <Button size="sm" className="rounded-full px-5">
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center space-y-8">
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/20 text-xs font-medium px-4 py-1.5">
              🇨🇴 Infraestructura Pública de IA · Colombia · MIT License
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
              Empleo público y privado,{' '}
              <span className="text-blue-400">potenciado con IA</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {APP_DESCRIPTION}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/registro/aspirante">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-medium bg-white text-slate-900 hover:bg-blue-50 shadow-xl shadow-blue-950/30">
                  Soy aspirante <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/registro/empresa">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-medium border border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent backdrop-blur">
                  Soy empresa o entidad
                </Button>
              </Link>
            </div>
          </div>

          {/* STATS FLOTANTES */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: stats.vacantes.toLocaleString('es-CO'), label: 'Vacantes activas', color: 'text-blue-300' },
              { value: stats.postulaciones.toLocaleString('es-CO'), label: 'Postulaciones', color: 'text-emerald-300' },
              { value: stats.entidades.toLocaleString('es-CO'), label: 'Entidades', color: 'text-violet-300' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 text-center backdrop-blur-sm">
                <p className={`text-3xl md:text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs md:text-sm text-slate-400 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-8 flex-wrap text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-emerald-500" /> Ley 1581 · Habeas Data</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-blue-500" /> Ley 909 · Empleo Público</span>
          <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-violet-500" /> Ley 1712 · Transparencia</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Código abierto · MIT</span>
        </div>
      </section>

      {/* VACANTES PUBLICADAS */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge variant="secondary" className="mb-2 text-xs">Oportunidades</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Vacantes disponibles
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {stats.vacantes > 0
                  ? `${stats.vacantes.toLocaleString('es-CO')} oportunidades activas en Colombia`
                  : 'Las primeras convocatorias estarán disponibles pronto'}
              </p>
            </div>
            <Link href="/registro/aspirante">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2 rounded-full">
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {vacantesPublicadas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Próximamente</p>
              <p className="text-slate-400 text-sm mt-1">Las entidades y empresas están cargando sus convocatorias</p>
              <Link href="/registro/aspirante" className="inline-block mt-4">
                <Button size="sm" className="rounded-full">Regístrate para ser el primero</Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vacantesPublicadas.map((v: any) => {
                const esPublico = v.entidades?.tipo === 'publico'
                const dias = v.fecha_cierre
                  ? Math.ceil((new Date(v.fecha_cierre).getTime() - Date.now()) / 86400000)
                  : null
                return (
                  <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${esPublico ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                        {esPublico ? 'Público' : 'Privado'}
                      </span>
                      {dias !== null && dias >= 0 && dias <= 7 && (
                        <span className="text-xs bg-red-100 text-red-700 font-medium px-2.5 py-1 rounded-full">
                          Cierra en {dias}d
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">{v.titulo}</h3>
                      {v.entidades?.nombre && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {v.entidades.nombre}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      {(v.departamento || v.municipio) && (
                        <span>{[v.municipio, v.departamento].filter(Boolean).join(', ')}</span>
                      )}
                      <span className="capitalize">{v.tipo_contrato?.replace('_', ' ')}</span>
                    </div>
                    {v.visible_salario && (v.salario_min || v.salario_max) && (
                      <p className="text-sm font-semibold text-emerald-700">
                        {v.salario_min ? `Desde $${Number(v.salario_min).toLocaleString('es-CO')}` : `Hasta $${Number(v.salario_max).toLocaleString('es-CO')}`}
                      </p>
                    )}
                    <Link href="/registro/aspirante" className="mt-auto">
                      <Button variant="outline" size="sm" className="w-full h-8 text-xs rounded-full">
                        Aplicar <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/registro/aspirante">
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                Ver todas las vacantes <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Plataforma</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Una plataforma para todos los actores
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Diseñada para conectar aspirantes, entidades públicas y empresas privadas en un ecosistema transparente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="h-6 w-6 text-blue-600" />,
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                badge: 'Aspirantes',
                badgeColor: 'bg-blue-100 text-blue-700',
                title: 'Oriéntate y postúlate',
                desc: 'Descubre tu vocación con IA generativa y aplica a oportunidades públicas y privadas con seguimiento en tiempo real.',
                features: ['Chatbot vocacional con Gemini AI', 'Pipeline de postulaciones live', 'Derechos ARCO garantizados'],
              },
              {
                icon: <Building2 className="h-6 w-6 text-emerald-600" />,
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                badge: 'Entidades Públicas',
                badgeColor: 'bg-emerald-100 text-emerald-700',
                title: 'Gestiona con cumplimiento',
                desc: 'Publica convocatorias alineadas con Ley 909 y Ley 1712. Auditoría automática de cada acción.',
                features: ['Formulario conforme Ley 909', 'Cambios de estado justificados', 'Log de auditoría automático'],
              },
              {
                icon: <Briefcase className="h-6 w-6 text-violet-600" />,
                bg: 'bg-violet-50',
                border: 'border-violet-100',
                badge: 'Empresas Privadas',
                badgeColor: 'bg-violet-100 text-violet-700',
                title: 'Atrae talento joven',
                desc: 'Publica vacantes en minutos y accede a talento joven colombiano con métricas de efectividad.',
                features: ['Publicación en minutos', 'Gestión de postulantes privada', 'Métricas de efectividad'],
              },
            ].map((item) => (
              <div key={item.title} className={`bg-white rounded-2xl border ${item.border} p-7 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
                <ul className="space-y-2 mt-auto">
                  {item.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI FEATURE */}
      <section className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-medium">
              ✦ Powered by Gemini AI
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Orientación vocacional con IA generativa
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Nuestro asistente basado en Gemini conversa contigo para entender tus intereses,
              habilidades y metas. Al final te presenta las oportunidades más alineadas con tu perfil.
            </p>
            <p className="text-sm text-slate-400">
              Validado con poblaciones estudiantiles reales en Colombia.
            </p>
            <Link href="/registro/aspirante">
              <Button className="rounded-full px-7 h-11 mt-2">
                Habla con el asistente <Bot className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* CHAT MOCKUP */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Asistente AVANZA AI</p>
                <p className="text-xs text-emerald-500 font-medium">● En línea</p>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 max-w-[85%]">
                ¡Hola! Soy tu orientador vocacional. ¿Cuáles son tus áreas de interés?
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-slate-700 ml-auto max-w-[85%] shadow-sm">
                Me gusta la tecnología y trabajar con datos 📊
              </div>
              <div className="bg-primary/10 border border-primary/15 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 max-w-[90%]">
                Basado en tu perfil, encontré{' '}
                <span className="font-semibold text-primary">3 vacantes en ciencia de datos</span>{' '}
                que se ajustan muy bien a tus habilidades...
              </div>
              <div className="flex gap-1.5 pt-1">
                {['Ciencia de datos', 'Analítica', 'BI'].map((tag) => (
                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Fundamentos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Construido sobre 3 pilares
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-7 w-7 text-blue-600" />,
                bg: 'bg-blue-50',
                title: 'Cumplimiento legal',
                desc: 'Ley 1581 (Habeas Data), Ley 909 (Empleo público), Ley 1712 (Transparencia). Derechos ARCO garantizados en cada interacción.',
              },
              {
                icon: <BarChart3 className="h-7 w-7 text-emerald-600" />,
                bg: 'bg-emerald-50',
                title: 'Transparencia total',
                desc: 'Cada acción queda registrada en el log de auditoría. Métricas públicas del mercado laboral colombiano en tiempo real.',
              },
              {
                icon: <TrendingUp className="h-7 w-7 text-violet-600" />,
                bg: 'bg-violet-50',
                title: 'IA para la movilidad',
                desc: 'Orientación personalizada que conecta el potencial juvenil con oportunidades reales del mercado laboral colombiano.',
              },
            ].map((p) => (
              <div key={p.title} className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className={`h-12 w-12 rounded-xl ${p.bg} flex items-center justify-center`}>
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{p.title}</h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs">
            Sin costo · Código abierto
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">¿Listo para comenzar?</h2>
          <p className="text-slate-400 text-lg">
            Únete a la infraestructura pública de empleo más transparente de Colombia
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/registro/aspirante">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 bg-white text-slate-900 hover:bg-blue-50 font-medium">
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full px-8 h-12 border border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent font-medium">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-8 px-6 text-center">
        <p className="text-sm font-semibold text-slate-300">{APP_NAME}</p>
        <p className="text-xs text-slate-600 mt-1">© 2026 AVANZA AI Colombia · Todos los derechos reservados · MIT License · Ley 1581 · Ley 909 · Ley 1712</p>
      </footer>
    </div>
  )
}
