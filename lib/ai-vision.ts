/* eslint-disable @typescript-eslint/no-explicit-any */
import { sbFetch } from '@/lib/admin-fetch'

interface AIConfig {
  provider:    string
  model:       string
  apiKey:      string
  baseUrl:     string
  maxTokens:   number
  autoApprove: number  // confianza mínima para auto-aprobar
}

interface AnalysisResult {
  status:     string   // compliant | non_compliant | partial | na
  score:      number
  confidence: number   // 0-100
  reasoning:  string
  raw:        any
}

// Leer config de IA del tenant
export async function getAIConfig(tenantId: string): Promise<AIConfig | null> {
  const res  = await sbFetch(
    `/system_config?tenant_id=eq.${tenantId}&key=in.(ai_provider,ai_vision_model,ai_api_key,ai_base_url,ai_max_tokens,ai_confidence_auto)&select=key,value`
  )
  const rows = await res.json() as { key: string; value: string }[]
  const cfg  = Object.fromEntries(rows.map(r => [r.key, r.value]))

  if (!cfg.ai_api_key || !cfg.ai_vision_model) return null

  return {
    provider:    cfg.ai_provider    ?? 'openai',
    model:       cfg.ai_vision_model,
    apiKey:      cfg.ai_api_key,
    baseUrl:     cfg.ai_base_url    ?? 'https://api.openai.com/v1',
    maxTokens:   parseInt(cfg.ai_max_tokens    ?? '500'),
    autoApprove: parseInt(cfg.ai_confidence_auto ?? '85'),
  }
}

// Construir prompt estructurado para análisis de ítem
function buildPrompt(params: {
  itemTitle:    string
  itemDesc?:    string
  responseType: string
  aiPrompt?:    string
  aiCriteria?:  string
  maxScore:     number
  scaleMin?:    string
  scaleMax?:    string
}): string {
  const { itemTitle, itemDesc, responseType, aiPrompt, aiCriteria, maxScore, scaleMin, scaleMax } = params

  let typeInstructions = ''
  if (responseType === 'binary') {
    typeInstructions = `Determina si el ítem CUMPLE, NO CUMPLE o es PARCIAL. Responde con status: "compliant", "non_compliant" o "partial".`
  } else if (responseType === 'scale_5') {
    typeInstructions = `Evalúa en escala 1-5 donde 1=${scaleMin??'mínimo'} y 5=${scaleMax??'máximo'}. Responde con scale_value: número del 1 al 5.`
  } else if (responseType === 'scale_10') {
    typeInstructions = `Evalúa en escala 1-10 donde 1=${scaleMin??'mínimo'} y 10=${scaleMax??'máximo'}. Responde con scale_value: número del 1 al 10.`
  } else if (responseType === 'numeric') {
    typeInstructions = `Identifica y reporta el valor numérico relevante visible en la imagen. Responde con numeric_value: número.`
  }

  return `Eres un auditor experto analizando una imagen para el ítem de auditoría: "${itemTitle}".
${itemDesc ? `\nDescripción: ${itemDesc}` : ''}
${aiPrompt ? `\nInstrucciones específicas: ${aiPrompt}` : ''}
${aiCriteria ? `\nCriterios de evaluación:\n${aiCriteria}` : ''}

${typeInstructions}

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "status": "compliant" | "non_compliant" | "partial" | "na",
  "score": número entre 0 y ${maxScore},
  "confidence": número entre 0 y 100 (tu nivel de certeza),
  "scale_value": número (solo si aplica escala),
  "numeric_value": número (solo si aplica numérico),
  "reasoning": "explicación breve en español de máximo 2 oraciones"
}

Si la imagen no es clara o no puedes determinar el resultado, usa status "na" con confidence baja.`
}

// Llamar al API de visión (compatible OpenAI)
async function callVisionAPI(config: AIConfig, imageBase64: string, prompt: string): Promise<any> {
  const isAnthropic = config.provider === 'anthropic'

  if (isAnthropic) {
    // Formato Anthropic Messages API
    const res = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      config.model,
        max_tokens: config.maxTokens,
        messages: [{
          role:    'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text',  text: prompt },
          ],
        }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text
  }

  // Formato compatible OpenAI (GPT-4o, vLLM, Ollama)
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model:      config.model,
      max_tokens: config.maxTokens,
      messages: [{
        role:    'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } },
          { type: 'text',      text: prompt },
        ],
      }],
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content
}

// Parsear respuesta de la IA
function parseAIResponse(raw: string, maxScore: number): AnalysisResult {
  try {
    // Extraer JSON de la respuesta (puede venir con texto extra)
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const parsed = JSON.parse(match[0])

    return {
      status:     parsed.status     ?? 'na',
      score:      Math.min(maxScore, Math.max(0, parseInt(parsed.score ?? 0))),
      confidence: Math.min(100, Math.max(0, parseFloat(parsed.confidence ?? 0))),
      reasoning:  parsed.reasoning  ?? '',
      raw:        { ...parsed, scale_value: parsed.scale_value, numeric_value: parsed.numeric_value },
    }
  } catch {
    return { status: 'na', score: 0, confidence: 0, reasoning: 'Error al parsear respuesta de la IA', raw: {} }
  }
}

// Función principal: analizar imagen para un ítem
export async function analyzeImage(params: {
  tenantId:     string
  imageBase64:  string
  itemTitle:    string
  itemDesc?:    string
  responseType: string
  aiPrompt?:    string
  aiCriteria?:  string
  maxScore:     number
  scaleMin?:    string
  scaleMax?:    string
}): Promise<AnalysisResult & { durationMs: number; tokensUsed?: number }> {
  const start = Date.now()

  const config = await getAIConfig(params.tenantId)
  if (!config) {
    return { status: 'na', score: 0, confidence: 0, reasoning: 'IA no configurada', raw: {}, durationMs: 0 }
  }

  const prompt = buildPrompt(params)

  try {
    const rawResponse = await callVisionAPI(config, params.imageBase64, prompt)
    const result      = parseAIResponse(rawResponse ?? '', params.maxScore)
    return { ...result, durationMs: Date.now() - start }
  } catch (error: any) {
    return {
      status: 'na', score: 0, confidence: 0,
      reasoning: `Error: ${error.message}`,
      raw: {}, durationMs: Date.now() - start,
    }
  }
}

// Determinar si auto-aprobar según confianza
export function shouldAutoApprove(confidence: number, threshold: number): boolean {
  return confidence >= threshold
}
