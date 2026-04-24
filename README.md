# 🤖 FinBot — Assistente Financeiro Pessoal no WhatsApp

Bot de controle financeiro pessoal para casal, rodando 24/7 no WhatsApp via grupo privado. Interpreta linguagem natural com IA, registra transações no Google Sheets e envia análises automáticas mensais.

---

## 📋 Funcionalidades

### Registro inteligente por linguagem natural
```
"gastei 50 no mercado"        → ✅ R$50,00 registrado em Alimentação
"recebi salário 4125"         → ✅ R$4.125,00 registrado como Receita
"paguei conta de luz 380"     → ✅ R$380,00 registrado em Moradia
"uber 25"                     → ✅ R$25,00 registrado em Transporte
```

### Comandos disponíveis
| Comando | Descrição |
|---------|-----------|
| `/saldo` | Saldo do mês atual |
| `/resumo` | Resumo detalhado por categoria |
| `/score` | Score financeiro de 0 a 100 |
| `/analise` | Análise personalizada com IA |
| `/planejamento` | Planejamento do próximo mês |
| `/meta` | Ver metas financeiras |
| `/modo radical\|moderado\|razoavel` | Altera o modo de rigor |
| `/ajuda` | Lista todos os comandos |

### Alertas automáticos em tempo real
- Aviso quando uma categoria atinge 80% do orçamento
- Alerta quando o limite da categoria é estourado

### Agendamentos automáticos
| Quando | O que faz |
|--------|-----------|
| Toda segunda às 8h | Análise semanal com IA + Score |
| Dia 15 às 9h | Alerta de metade do mês |
| Dia 28 às 20h | Fechamento mensal + Planejamento do próximo mês |

---

## 🛠️ Stack Tecnológico

| Tecnologia | Uso |
|-----------|-----|
| Node.js 20 | Runtime |
| [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) | Integração WhatsApp Web |
| [OpenRouter API](https://openrouter.ai) | IA para interpretação de linguagem natural |
| [Google Sheets API v4](https://developers.google.com/sheets) | Banco de dados das transações |
| [node-cron](https://www.npmjs.com/package/node-cron) | Agendamentos automáticos |
| [better-sqlite3](https://www.npmjs.com/package/better-sqlite3) | Cache local de sessão |
| [Fly.io](https://fly.io) | Deploy e hospedagem 24/7 |

---

## 📁 Estrutura do Projeto

```
finbot/
├── src/
│   ├── ai/
│   │   ├── gemini.js          # Cliente OpenRouter API
│   │   ├── parser.js          # Interpretação de mensagens
│   │   └── prompts.js         # Prompts do sistema
│   ├── analysis/
│   │   ├── recommendations.js # Score, análise e planejamento com IA
│   │   ├── balance.js         # Cálculo de saldo
│   │   └── patterns.js        # Análise de padrões
│   ├── bot/
│   │   ├── index.js           # Inicialização do bot Baileys
│   │   ├── messageHandler.js  # Processamento de mensagens
│   │   └── scheduler.js       # Agendamentos automáticos
│   ├── commands/
│   │   ├── index.js           # Roteador de comandos
│   │   ├── saldo.js           # Comando /saldo
│   │   ├── resumo.js          # Comando /resumo
│   │   └── meta.js            # Comando /meta
│   ├── sheets/
│   │   ├── client.js          # Conexão Google Sheets
│   │   ├── transactions.js    # CRUD de transações
│   │   ├── goals.js           # CRUD de metas
│   │   └── config.js          # Leitura de configurações
│   └── utils/
│       ├── formatter.js       # Formatação de datas e valores
│       ├── logger.js          # Sistema de logs
│       └── db.js              # Cache SQLite local
├── credentials/
│   └── google-credentials.json  # ⚠️ NÃO commitar
├── auth/                         # ⚠️ NÃO commitar (sessão WhatsApp)
├── .env                          # ⚠️ NÃO commitar
├── .gitignore
├── .dockerignore
├── Dockerfile
├── fly.toml
├── index.js                   # Entry point
└── package.json
```

---

## ⚙️ Configuração

### Pré-requisitos
- Node.js 20+
- Conta no [OpenRouter](https://openrouter.ai)
- Projeto no [Google Cloud Console](https://console.cloud.google.com) com Sheets API ativada
- Conta no [Fly.io](https://fly.io)

### Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_SPREADSHEET_ID=1xXxXxXxXxXxXxXxXxXxXxXxXxXxXx
GOOGLE_CREDENTIALS_PATH=./credentials/google-credentials.json
GROUP_ID=120363408910058729@g.us
MODO_RIGOR=Moderado
```

### Google Sheets

A planilha precisa ter as seguintes abas:

| Aba | Descrição |
|-----|-----------|
| `Transacoes` | Todas as transações registradas |
| `Resumo_Mensal` | Resumo automático por mês |
| `Metas` | Metas financeiras |
| `Orcamento` | Limites por categoria |
| `Configuracoes` | Configurações do bot |

#### Aba Configuracoes (chave/valor):
| Chave | Exemplo |
|-------|---------|
| `modo_rigor` | `Moderado` |
| `renda_mensal` | `9750` |
| `meta_poupanca` | `800` |
| `nome_usuario_1` | `Wilker` |
| `lid_usuario_1` | `8413958377659` |
| `nome_usuario_2` | `Yanne` |
| `lid_usuario_2` | `129386057596949` |

---

## 🚀 Deploy

### Local (desenvolvimento)
```bash
npm install
node index.js
```

Escaneie o QR Code que aparece no terminal com o WhatsApp do número do bot.

### Produção (Fly.io)

```bash
# Login
flyctl auth login

# Criar app (primeira vez)
flyctl launch

# Configurar secrets
flyctl secrets set OPENROUTER_API_KEY=sk-or-v1-...
flyctl secrets set GOOGLE_SPREADSHEET_ID=1xXx...
flyctl secrets set GROUP_ID=120363...@g.us
flyctl secrets set MODO_RIGOR=Moderado

# Deploy
flyctl deploy
```

### Sessão WhatsApp no servidor

Após o deploy, envie a sessão salva localmente:

```bash
# Compactar sessão local
Compress-Archive -Path auth\* -DestinationPath auth.zip

# Enviar para o servidor
flyctl ssh sftp shell
# >> put auth.zip /app/auth.zip

# Extrair no servidor
flyctl ssh console
# >> python3 -c "import zipfile,os; os.makedirs('auth',exist_ok=True); zipfile.ZipFile('auth.zip').extractall('auth/')"

# Reiniciar
flyctl machine restart <machine-id>
```

---

## 🔧 Comandos úteis

```bash
# Ver logs em tempo real
flyctl logs

# Reiniciar a máquina
flyctl machine restart <machine-id>

# Ver status
flyctl status

# Listar máquinas
flyctl machine list

# Deploy sem cache
flyctl deploy --no-cache
```

---

## 📊 Como usar

### 1. Registrar gastos (linguagem natural)
```
gastei 45 no ifood
paguei conta de luz 380
uber 25
mercado 150
```

### 2. Registrar receitas
```
recebi salário 4125
recebi vale refeição 700
recebi vale alimentação 800
```

### 3. Consultar situação
```
/saldo
/resumo
/score
/analise
```

### 4. Planejar próximo mês
```
/planejamento
```

### 5. Definir metas
```
quero criar reserva de emergência de 20 mil
meta de viagem 5000 para dezembro
```

---

## ⚠️ Avisos importantes

- **Nunca deslogue** o dispositivo "Mac OS Chrome" nos aparelhos conectados do WhatsApp — essa é a sessão do bot
- A pasta `auth/` contém a sessão do WhatsApp e **não deve ser commitada**
- O arquivo `credentials/google-credentials.json` contém chaves privadas e **não deve ser commitado**
- O modelo de IA gratuito tem limite de **50 requisições/dia** — suficiente para uso diário normal

---

## 🔄 Fluxo de uma mensagem

```
Usuário manda mensagem no grupo
         ↓
   messageHandler.js
         ↓
   interpretarMensagem() — IA classifica a mensagem
         ↓
   É gasto/receita?  →  saveTransaction() → Google Sheets
         ↓
   É comando?  →  handleCommand() → resposta formatada
         ↓
   Verificar alertas de orçamento
         ↓
   Responder no grupo
```

---

## 📈 Score Financeiro

| Pontuação | Nível | Significado |
|-----------|-------|-------------|
| 80-100 | 🟢 Saudável | Finanças sob controle |
| 60-79 | 🟡 Atenção | Pontos a melhorar |
| 40-59 | 🔴 Crítico | Ação necessária |
| 0-39 | 🚨 Emergência | Cortes imediatos |

---

## 👥 Usuários

Configurado para o casal **Wilker + Yanne**, identificados por LID do WhatsApp na aba `Configuracoes` da planilha.

---

## 📝 Licença

Projeto privado para uso pessoal.