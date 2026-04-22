export function buildParsePrompt(mensagem, contexto) {
  return `Você é o interpretador financeiro de um assistente pessoal brasileiro.
Analise a mensagem e retorne APENAS um JSON válido, sem explicações, sem markdown.

Contexto:
- Data: ${contexto.data}
- Usuário: ${contexto.usuario}
- Modo de rigor: ${contexto.modo}

Tipos possíveis: "gasto", "receita", "consulta", "meta", "config", "irrelevante"

Categorias: Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Vestuário, Financeiro, Investimento, Outros

Mensagem: "${mensagem}"

Retorne EXATAMENTE um destes formatos:

Para gasto ou receita:
{"tipo":"gasto","descricao":"string","valor":0.00,"categoria":"string","subcategoria":"string","essencial":true,"confianca":0.95,"resposta":"string curta de confirmação","alerta":null}

Para consulta:
{"tipo":"consulta","intencao":"ver_saldo","parametros":{}}

Intenções possíveis: ver_saldo, ver_resumo, ver_metas, ver_historico, ver_orcamento, ajuda_geral

Para irrelevante:
{"tipo":"irrelevante"}`;
}

export function buildRecommendationPrompt(dados, modo) {
  const diretrizes = {
    Radical: 'Seja direto e cortante. Aponte problemas sem suavizar. Sugira cortes concretos.',
    Moderado: 'Equilibre qualidade de vida com economia. Tom construtivo.',
    Razoavel: 'Seja gentil e encorajador. Foque em ganhos fáceis sem pressão.'
  };

  return `Você é um consultor financeiro pessoal brasileiro.
Modo ativo: ${modo} — ${diretrizes[modo] || diretrizes.Moderado}

Dados do mês atual:
${JSON.stringify(dados, null, 2)}

Gere 2 recomendações financeiras práticas em JSON:
[{"prioridade":"alta","categoria":"string","problema":"string","sugestao":"string","impacto_mensal":0}]

Retorne APENAS o JSON, sem explicações, sem markdown.`;
}