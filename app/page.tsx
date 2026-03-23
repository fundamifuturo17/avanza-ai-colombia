import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Briefcase, Users, Building2, TrendingUp,
  Bot, Shield, BarChart3, ArrowRight, CheckCircle2
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

export default async function LandingPage() {
  const stats = await getStats()

  return (
    <div className="flex flex-col min-h-screen">
      {/* NAV */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <span className="font-bold text-blue-700 text-lg">AVANZA AI</span>
            <Badge variant="secondary" className="ml-2 text-xs">Colombia</Badge>
          </div>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Ingresar</Button>
            </Link>
            <Link href="/registro/aspirante">
              <Button size="sm">Comenzar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
            🇨🇴 Infraestructura Pública de IA · Colombia
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">{APP_NAME}</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">{APP_DESCRIPTION}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/registro/aspirante">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Soy aspirante <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/registro/empresa">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Soy empresa o entidad
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-b py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-700">{stats.vacantes.toLocaleString('es-CO')}</p>
            <p className="text-sm text-muted-foreground mt-1">Vacantes activas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-700">{stats.postulaciones.toLocaleString('es-CO')}</p>
            <p className="text-sm text-muted-foreground mt-1">Postulaciones realizadas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-700">{stats.entidades.toLocaleString('es-CO')}</p>
            <p className="text-sm text-muted-foreground mt-1">Entidades participando</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Una plataforma para todos los actores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="h-5 w-5 text-blue-600" />,
                bg: 'bg-blue-100',
                title: 'Para aspirantes',
                desc: 'Orientación vocacional con IA, búsqueda de oportunidades públicas y privadas, seguimiento de postulaciones en tiempo real.',
                features: ['Chatbot de orientación con Gemini AI', 'Pipeline de postulaciones con estado live', 'Derechos ARCO garantizados'],
              },
              {
                icon: <Building2 className="h-5 w-5 text-green-600" />,
                bg: 'bg-green-100',
                title: 'Para entidades públicas',
                desc: 'Gestión de convocatorias con cumplimiento de Ley 909 y Ley 1712. Trazabilidad total del proceso.',
                features: ['Formulario alineado con Ley 909', 'Cambios de estado con justificación obligatoria', 'Auditoría automática de cada acción'],
              },
              {
                icon: <Briefcase className="h-5 w-5 text-purple-600" />,
                bg: 'bg-purple-100',
                title: 'Para empresas privadas',
                desc: 'Publicación ágil de vacantes, gestión de postulantes y visibilidad hacia talento joven colombiano.',
                features: ['Publicación en minutos tras validación', 'Gestión de postulantes con privacidad', 'Métricas de efectividad'],
              },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-sm">
                <CardContent className="pt-6 space-y-3">
                  <div className={`h-10 w-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {item.features.map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI FEATURE */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">Powered by Gemini AI</Badge>
            <h2 className="text-2xl font-bold">Orientación vocacional con IA generativa</h2>
            <p className="text-muted-foreground">
              Nuestro asistente basado en Gemini conversa contigo para entender tus intereses,
              habilidades y metas. Al final te presenta las oportunidades más alineadas con tu perfil.
            </p>
            <p className="text-sm text-muted-foreground">
              Validado con poblaciones estudiantiles reales en Colombia.
            </p>
            <Link href="/registro/aspirante">
              <Button>
                Habla con el asistente <Bot className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>Asistente AVANZA AI</span>
              <Badge variant="secondary" className="ml-auto text-xs">En línea</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900 max-w-[85%]">
                ¡Hola! Soy tu orientador vocacional. ¿Cuáles son tus áreas de interés?
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm ml-auto max-w-[85%]">
                Me gusta la tecnología y trabajar con datos 📊
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900 max-w-[85%]">
                Basado en tu perfil, encontré 3 vacantes en ciencia de datos que se ajustan muy bien...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-2xl font-bold">Construido sobre 3 pilares</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="h-8 w-8 text-blue-600 mx-auto" />, title: 'Cumplimiento legal', desc: 'Ley 1581 (Habeas Data), Ley 909 (Empleo público), Ley 1712 (Transparencia). Derechos ARCO garantizados.' },
              { icon: <BarChart3 className="h-8 w-8 text-green-600 mx-auto" />, title: 'Transparencia total', desc: 'Cada acción queda registrada en el log de auditoría. Métricas públicas del mercado laboral en tiempo real.' },
              { icon: <TrendingUp className="h-8 w-8 text-purple-600 mx-auto" />, title: 'IA para la movilidad', desc: 'Orientación personalizada que conecta el potencial juvenil con oportunidades reales del mercado laboral colombiano.' },
            ].map((p) => (
              <div key={p.title} className="space-y-3">
                {p.icon}
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-4 bg-blue-700 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold">¿Listo para comenzar?</h2>
          <p className="text-blue-100">Únete a la infraestructura pública de empleo más transparente de Colombia</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/registro/aspirante">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">Crear cuenta gratis</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Ya tengo cuenta</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-6 px-4 text-center text-xs text-muted-foreground">
        <p>{APP_NAME} · Colombia 2024 · MIT License</p>
        <p className="mt-1">Ley 1581 · Ley 909 · Ley 1712 · Basado en EPPD</p>
      </footer>
    </div>
  )
}
