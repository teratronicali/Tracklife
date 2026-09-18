import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabase } from '@/lib/supabase/server'
import { fechaISO } from '@/lib/plan-semana'
import { HERRAMIENTAS_ASISTENTE } from '@/lib/asistente-tools'
import { ejecutarHerramienta } from '@/lib/asistente-ejecutar'

const MODELO = 'claude-opus-5'
const MAX_ITERACIONES = 6

function systemPrompt(): string {
  const hoy = fechaISO(new Date())
  return `Eres el asistente de TrackLife, una app de productividad gamificada (habitos, finanzas, entrenamiento, metas, tareas). La persona te escribe en lenguaje natural describiendo algo que hizo o quiere registrar (ej. "gaste 85 en el restaurante", "hice press banca 80kg x10", "mañana llamar a Carlos para revisar las camaras") y tu usas la herramienta correcta para registrarlo por ella.

Hoy es ${hoy} (formato YYYY-MM-DD) — usalo para resolver fechas relativas como "hoy", "ayer" o "mañana".

Reglas:
- Si el mensaje describe algo que se puede registrar, usa SIEMPRE la herramienta correspondiente — no te limites a responder en texto.
- Si falta un dato obligatorio y no lo puedes inferir razonablemente (ej. el monto de un gasto), pregunta en vez de inventarlo.
- Elige la categoria mas parecida de las que te da cada herramienta; nunca inventes una categoria fuera de la lista permitida.
- Despues de usar una herramienta, confirma en una linea corta lo que quedo registrado, en español, con tono cercano y motivador — sin exagerar ni sonar robotico.
- Si preguntan algo que no tiene que ver con TrackLife, redirige amablemente al tema.
- Respuestas cortas: esto es un chat, no un ensayo.`
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'El asistente de IA aun no esta configurado (falta ANTHROPIC_API_KEY en el servidor)' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const mensaje = typeof body?.mensaje === 'string' ? body.mensaje.trim() : ''
  const historialPrevio: Anthropic.MessageParam[] = Array.isArray(body?.historial) ? body.historial : []
  if (!mensaje) return NextResponse.json({ error: 'Falta el mensaje' }, { status: 400 })

  const client = new Anthropic()
  const messages: Anthropic.MessageParam[] = [...historialPrevio, { role: 'user', content: mensaje }]

  const acciones: string[] = []
  let xpGanado = 0

  try {
    for (let i = 0; i < MAX_ITERACIONES; i++) {
      const response = await client.messages.create({
        model: MODELO,
        max_tokens: 4096,
        output_config: { effort: 'low' },
        system: systemPrompt(),
        tools: HERRAMIENTAS_ASISTENTE,
        messages,
      })

      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason !== 'tool_use') {
        const texto = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
        return NextResponse.json({ respuesta: texto, acciones, xpGanado, historial: messages })
      }

      const llamadas = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      const resultados: Anthropic.ToolResultBlockParam[] = []
      for (const llamada of llamadas) {
        const resultado = await ejecutarHerramienta(supabase, user.id, llamada.name, (llamada.input ?? {}) as Record<string, unknown>)
        if (resultado.accion) acciones.push(resultado.accion)
        if (resultado.xpGanado) xpGanado += resultado.xpGanado
        resultados.push({
          type: 'tool_result',
          tool_use_id: llamada.id,
          content: JSON.stringify(resultado.resultado),
          is_error: !resultado.ok,
        })
      }
      messages.push({ role: 'user', content: resultados })
    }

    return NextResponse.json({
      respuesta: 'Se me complico procesar eso — intenta describirlo de otra forma.',
      acciones,
      xpGanado,
      historial: messages,
    })
  } catch (err) {
    console.error('Error en asistente IA:', err)
    const mensajeError = err instanceof Anthropic.APIError ? err.message : 'Error inesperado del asistente'
    return NextResponse.json({ error: mensajeError }, { status: 500 })
  }
}
