import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `Eres un orientador vocacional experto en el mercado laboral colombiano,
especializado en jóvenes entre 16 y 30 años. Tu objetivo es ayudar a los jóvenes a descubrir
sus intereses, habilidades y conectarlos con oportunidades reales del mercado laboral colombiano.

Directrices:
- Sé empático, cercano y usa un lenguaje apropiado para jóvenes colombianos
- Haz preguntas abiertas para entender sus intereses, fortalezas y metas
- Considera el contexto colombiano: sectores en crecimiento (tecnología, salud, logística, agroindustria)
- Después de 3-4 mensajes de conversación, sugiere rutas de carrera específicas
- Cuando tengas suficiente información, indica que puedes mostrar vacantes relevantes
- Menciona recursos como SENA, universidades públicas, programas del gobierno
- No inventes vacantes específicas; di que las buscarás en la plataforma
- Responde siempre en español colombiano

Cuando tengas suficiente información sobre el perfil del usuario, incluye al final de tu mensaje
la etiqueta: [BUSCAR_VACANTES: keyword1, keyword2] con las palabras clave para buscar vacantes.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: 'Mensajes inválidos' }, { status: 400 })
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const text = result.response.text()

    // Extraer keywords si el modelo las sugiere
    const keywordsMatch = text.match(/\[BUSCAR_VACANTES:\s*([^\]]+)\]/)
    const keywords = keywordsMatch
      ? keywordsMatch[1].split(',').map((k: string) => k.trim())
      : null

    // Limpiar etiqueta del texto visible
    const cleanText = text.replace(/\[BUSCAR_VACANTES:[^\]]+\]/, '').trim()

    return Response.json({ message: cleanText, keywords })
  } catch (error) {
    console.error('Gemini error:', error)
    return Response.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }
}
