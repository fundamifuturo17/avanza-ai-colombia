'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Bot, Send, User, Briefcase, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface VacanteRecomendada {
  id: string
  titulo: string
  entidades: { nombre: string } | null
  departamento: string | null
  salario_min: number | null
  salario_max: number | null
  visible_salario: boolean
}

const MENSAJE_INICIAL: Message = {
  role: 'assistant',
  content: '¡Hola! Soy tu orientador vocacional de AVANZA AI 👋\n\nEstoy aquí para ayudarte a descubrir las oportunidades laborales que mejor se adaptan a tus intereses y habilidades.\n\n¿Cuáles son las actividades o materias que más disfrutas o en las que te sientes más hábil?',
}

export function OrientacionChat({
  userName,
  userCity,
}: {
  userName: string
  userCity?: string
}) {
  const [messages, setMessages] = useState<Message[]>([MENSAJE_INICIAL])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [vacantes, setVacantes] = useState<VacanteRecomendada[]>([])
  const [cargandoVacantes, setCargandoVacantes] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function buscarVacantesRecomendadas(keywords: string[]) {
    setCargandoVacantes(true)
    try {
      const q = keywords[0] ?? ''
      const res = await fetch(`/api/vacantes/buscar?q=${encodeURIComponent(q)}&limit=3`)
      if (res.ok) {
        const data = await res.json()
        setVacantes(data.vacantes ?? [])
      }
    } catch {
      // silencioso — las vacantes son opcionales
    } finally {
      setCargandoVacantes(false)
    }
  }

  async function enviarMensaje() {
    const texto = input.trim()
    if (!texto || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: texto }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/orientacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) throw new Error('Error')

      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.message }])

      if (data.keywords?.length > 0) {
        await buscarVacantesRecomendadas(data.keywords)
      }
    } catch {
      toast.error('Error al conectar con el asistente')
      setMessages(newMessages.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function reiniciar() {
    setMessages([MENSAJE_INICIAL])
    setVacantes([])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Chat */}
      <div className="border rounded-xl bg-white overflow-hidden flex flex-col h-[520px]">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
          <Bot className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-sm">Asistente AVANZA AI</span>
          <Badge variant="secondary" className="ml-auto text-xs">Gemini 1.5 Flash</Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reiniciar} title="Nueva conversación">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className={`text-xs ${msg.role === 'assistant' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                  {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-blue-50 text-blue-950 rounded-tl-sm'
                  : 'bg-gray-100 text-gray-900 rounded-tr-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-blue-50 rounded-2xl rounded-tl-sm px-4 py-3 space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); enviarMensaje() }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
              className="flex-1 h-9"
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Vacantes recomendadas */}
      {(vacantes.length > 0 || cargandoVacantes) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-sm">Vacantes recomendadas para ti</h3>
          </div>
          {cargandoVacantes ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {vacantes.map((v) => (
                <Card key={v.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-medium text-sm line-clamp-2">{v.titulo}</p>
                    <p className="text-xs text-muted-foreground">{v.entidades?.nombre}</p>
                    {v.departamento && (
                      <p className="text-xs text-muted-foreground">{v.departamento}</p>
                    )}
                    <Link href={`/aspirante/oportunidades/${v.id}`}>
                      <Button size="sm" variant="outline" className="w-full text-xs h-7 mt-1">
                        Ver vacante
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
