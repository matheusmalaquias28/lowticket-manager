import Anthropic from '@anthropic-ai/sdk'
import { format, subDays } from 'date-fns'

export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MCP_URL = process.env.UTMIFY_MCP_URL!
const DASHBOARD_ID = process.env.UTMIFY_DASHBOARD_ID ?? ''

function systemPrompt() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  return `Você é um analista de métricas especializado em marketing de performance digital.
Você tem acesso direto ao painel Utmify via ferramentas MCP.

CONTEXTO:
- Data de hoje: ${today}
- Ontem: ${yesterday}
- Negócio: operação de info-produtos / low ticket com dois sócios (Matheus e Kauan)
- Dashboard ID padrão: ${DASHBOARD_ID}

IMPORTANTE sobre os dados Utmify:
- Valores monetários retornados pela API estão em centavos — divida por 100 para exibir em reais
- ROAS = receita / investimento (ex: 3.5x)
- ROI = (lucro / investimento) × 100 (ex: 250%)

AO RESPONDER:
- Formate valores monetários como R$ 1.234,56
- Use 📈 para tendências positivas, 📉 para negativas
- Destaque os KPIs principais: receita bruta, lucro, ROAS, pedidos aprovados
- Seja direto e analítico, como um analista de mídia sênior
- Se o usuário pedir "hoje" ou "agora", busque dados de ${today}
- Para comparações, busque também os dados de ${yesterday}
- Ao analisar anúncios, foque em custo, CTR, conversão e ROAS por campanha`
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 })
  }
  if (!MCP_URL) {
    return Response.json({ error: 'UTMIFY_MCP_URL não configurada.' }, { status: 500 })
  }

  try {
    const { messages } = await req.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (anthropic.beta.messages as any).create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: systemPrompt(),
      messages,
      betas: ['mcp-client-2025-04-04'],
      mcp_servers: [
        {
          type: 'url',
          url: MCP_URL,
          name: 'utmify',
        },
      ],
    })

    const text: string = response.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')

    return Response.json({ text })
  } catch (err) {
    console.error('[metrics-agent]', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return Response.json({ error: message }, { status: 500 })
  }
}
