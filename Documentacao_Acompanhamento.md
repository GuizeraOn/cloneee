# Documentação Completa — Planilha de Acompanhamento de Vendas Hotmart

> Planilha Google Sheets conectada à Hotmart via Webhook (Google Apps Script).  
> Captura vendas em tempo real, converte valores USD → BRL com câmbio do dia e exibe análise completa de funil, geolocalização, meios de pagamento e performance de cartão de crédito.

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)  
2. [Arquitetura e Fluxo de Dados](#2-arquitetura-e-fluxo-de-dados)  
3. [Aba: DB_Vendas — Banco de Dados](#3-aba-db_vendas--banco-de-dados)  
4. [Aba: Aux_Calculos — Motor de Cálculo](#4-aba-aux_calculos--motor-de-cálculo)  
5. [Aba: Dashboard — Painel Visual](#5-aba-dashboard--painel-visual)  
6. [Aba: Integração Webhook — Guia de Instalação](#6-aba-integração-webhook--guia-de-instalação)  
7. [Google Apps Script — Webhook Receptor](#7-google-apps-script--webhook-receptor)  
8. [Fórmulas Detalhadas](#8-fórmulas-detalhadas)  
9. [Sistema de Filtro Global](#9-sistema-de-filtro-global)  
10. [KPIs e Indicadores](#10-kpis-e-indicadores)  
11. [Gráficos](#11-gráficos)  
12. [Mecanismos de Segurança e Integridade](#12-mecanismos-de-segurança-e-integridade)  
13. [Conexões entre Abas](#13-conexões-entre-abas)

---

## 1. Visão Geral do Sistema

A planilha é um **painel de acompanhamento de funil de vendas para produtos da Hotmart**, com integração via Webhook automático. O fluxo completo é:

```
Hotmart (evento de venda)
        │
        ▼ HTTP POST (Webhook)
Google Apps Script (Web App)
        │
        ├── Verifica duplicidade (coluna D de DB_Vendas)
        ├── Busca cotação USD/BRL (Aux_Calculos!D2)
        ├── Converte valores USD → BRL
        └── Grava linha em DB_Vendas (19 colunas A–S)
                │
                ▼
        Aux_Calculos (motor invisível de cálculos)
                │
                ▼
        Dashboard (KPIs + 5 gráficos)
```

**ID da planilha Google Sheets:** `17olHtrstWAN8B5NKMibvWa_uxUDVhexIv81tg_2pVOA`

---

## 2. Arquitetura e Fluxo de Dados

### 2.1 Abas e Responsabilidades

| Aba | Tipo | Função |
|-----|------|--------|
| `Dashboard` | Visual | KPIs, gráficos, filtro global de datas |
| `DB_Vendas` | Dados | Banco de dados bruto — uma linha por evento Hotmart |
| `Integração Webhook` | Documentação | Guia passo a passo para instalar a integração |
| `Aux_Calculos` | Cálculo | Backend invisível — agrega dados para o Dashboard |

### 2.2 Cadeia de dependências

```
DB_Vendas  ◄──── (gravação) ──── Apps Script
    │
    ▼ (COUNTIFS / SUMIFS)
Aux_Calculos
    │
    ▼ (referência direta de célula)
Dashboard
```

O Dashboard **nunca lê DB_Vendas diretamente**; ele apenas espelha células calculadas do `Aux_Calculos`. Isso mantém o painel rápido mesmo com centenas de linhas no banco.

---

## 3. Aba: DB_Vendas — Banco de Dados

### 3.1 Estrutura das 19 Colunas (A até S)

Cada linha representa **um evento enviado pela Hotmart** (aprovação, boleto gerado, cancelamento ou reembolso).

| Col | Nome | Origem | Descrição |
|-----|------|--------|-----------|
| **A** | Data / Hora | Apps Script | Timestamp do momento da gravação no fuso `America/Sao_Paulo` — formato `yyyy-MM-dd HH:mm:ss` |
| **B** | Dia da Semana | Apps Script | Abreviação do dia (`Seg`, `Ter`, `Qua`, `Qui`, `Sex`, `Sab`, `Dom`) |
| **C** | Hora | Apps Script | Hora cheia arredondada (`08:00`, `13:00`, etc.) |
| **D** | Transação | Apps Script | **Índice único** — código de transação da Hotmart (ex.: `HP0762101976`). Usado para anti-duplicidade |
| **E** | Produto | Hotmart payload | Nome exato do produto conforme cadastrado na Hotmart |
| **F** | Etapa do Funil | Apps Script (lógica) | `Front-End`, `Order Bump`, `Upsell 01` ou `Upsell 02` — classificado automaticamente |
| **G** | Order Bump? | Hotmart payload | `Sim` ou `Não` — baseado em `purchase.order_bump.is_order_bump` |
| **H** | Cliente | Hotmart payload | Nome do comprador (`buyer.name`) |
| **I** | E-mail | Hotmart payload | E-mail do comprador (`buyer.email`) — usado para contar compradores únicos |
| **J** | Telefone | Hotmart payload | `buyer.checkout_phone` ou `buyer.phone` |
| **K** | País | Hotmart payload | `purchase.checkout_country.name` — padrão `Brasil` |
| **L** | Meio de Pagamento | Apps Script (tradução) | `Cartão de Crédito`, `PIX`, `Boleto Bancário`, `PayPal`, `Mercado Pago`, etc. |
| **M** | Status | Apps Script (tradução) | `Aprovado`, `Aguardando Pagamento`, `Cancelado`, `Reembolsado` ou `Pendente` |
| **N** | Faturamento Bruto (USD) | Hotmart payload | `purchase.original_offer_price.value` — valor em dólar antes de comissões |
| **O** | Faturamento Líquido (USD) | Hotmart payload | Comissão do produtor (`commissions[source=PRODUCER].value`) |
| **P** | Origem / UTM | Hotmart payload | `purchase.tracking.source` ou `source_sck` — canal de tráfego |
| **Q** | Cotação USD/BRL | Apps Script (leitura de Aux_Calculos) | Câmbio do momento da gravação — lido de `Aux_Calculos!D2` |
| **R** | Faturamento Bruto R$ | **Fórmula planilha** | Conversão automática: `N × Q` |
| **S** | Faturamento Líquido R$ | **Fórmula planilha** | Conversão automática: `O × Q` |

### 3.2 Fórmulas das Colunas R e S

As colunas R e S são as únicas com fórmula no DB_Vendas (todas as demais são gravadas pelo script). A mesma lógica se repete em cada linha:

```
Coluna R (Faturamento Bruto R$):
=IF(OR(ISBLANK(N2), N2=""), "",
   ROUND(N2 * IF(AND(ISNUMBER(Q2), Q2>0), Q2, Aux_Calculos!$H$2), 2))
```

```
Coluna S (Faturamento Líquido R$):
=IF(OR(ISBLANK(O2), O2=""), "",
   ROUND(O2 * IF(AND(ISNUMBER(Q2), Q2>0), Q2, Aux_Calculos!$H$2), 2))
```

**Como funciona:**
1. Se a coluna N (ou O) estiver vazia, retorna vazio (evita erro em linhas em branco).
2. Tenta usar o câmbio da **própria linha** (coluna Q) — que foi o câmbio no momento da compra.
3. Se Q não for número válido ou for zero, usa o **câmbio atual do dia** em `Aux_Calculos!$H$2` como fallback.
4. Arredonda a 2 casas decimais (`ROUND(..., 2)`).

Isso garante que registros antigos mantenham o câmbio histórico, enquanto registros sem cotação gravada usem o câmbio atual.

### 3.3 Classificação da Etapa do Funil

O Apps Script determina a etapa automaticamente pela seguinte lógica de prioridade:

```javascript
// Prioridade 1: Se a flag order_bump estiver ativa → "Order Bump"
if (purchase.order_bump?.is_order_bump) → "Order Bump"

// Prioridade 2: Nome do produto contém "upsell 02", "upsell 2" ou "mentoria" → "Upsell 02"
else if (nome.includes("upsell 02") || nome.includes("upsell 2") || nome.includes("mentoria"))
  → "Upsell 02"

// Prioridade 3: Nome contém "upsell 01", "upsell 1" ou "acelerador" → "Upsell 01"
else if (nome.includes("upsell 01") || nome.includes("upsell 1") || nome.includes("acelerador"))
  → "Upsell 01"

// Padrão: qualquer outro produto → "Front-End"
else → "Front-End"
```

### 3.4 Tradução de Status

| Valor raw da Hotmart | Exibido na planilha |
|---------------------|---------------------|
| `APPROVED`, `COMPLETE`, `PURCHASE_APPROVED` | `Aprovado` |
| `WAITING_PAYMENT`, `BILLET_PRINTED`, `PURCHASE_BILLET_PRINTED` | `Aguardando Pagamento` |
| `CANCELED`, `PURCHASE_CANCELED` | `Cancelado` |
| `REFUNDED`, `PURCHASE_REFUNDED` | `Reembolsado` |
| (qualquer outro) | `Pendente` |

### 3.5 Tradução de Meio de Pagamento

| Valor raw | Exibido na planilha |
|-----------|---------------------|
| `CREDIT_CARD` | `Cartão de Crédito` |
| `PIX` | `PIX` |
| `BILLET` ou `BANK_SLIP` | `Boleto Bancário` |
| (qualquer outro) | Valor original (ex.: `PayPal`, `Mercado Pago`) |

---

## 4. Aba: Aux_Calculos — Motor de Cálculo

Esta aba é o **cérebro oculto** da planilha. O usuário não precisa interagir com ela diretamente. Ela realiza todos os cálculos que o Dashboard consome.

### 4.1 Cotação USD/BRL — célula H2

```
=IFERROR(GOOGLEFINANCE("CURRENCY:USDBRL"), 5.65)
```

- Usa a função `GOOGLEFINANCE` (nativa do Google Sheets) para buscar a cotação dólar → real em tempo real.
- Se a requisição falhar (fora do horário de mercado, por exemplo), usa `5.65` como fallback de contingência.
- **Esta célula é lida pelo Apps Script** antes de gravar cada transação. O câmbio do momento fica registrado na coluna Q de DB_Vendas.
- O script também tem seu próprio fallback interno de `5.65`.

### 4.2 Sistema de Filtro Global (L2, L3, L4, M5, M6)

#### L2 — Dropdown de Período

Célula de entrada do usuário. Aceita os seguintes valores:

| Opção | Período calculado |
|-------|------------------|
| `Hoje` | De hoje 00:00 até amanhã 00:00 |
| `Ontem` | De ontem até hoje |
| `Últimos 7 dias` | TODAY()-6 até TODAY()+1 |
| `Últimos 14 dias` | TODAY()-13 até TODAY()+1 |
| `Últimos 30 dias` | TODAY()-29 até TODAY()+1 |
| `Este mês` | Primeiro dia do mês atual até TODAY()+1 |
| `Mês passado` | Primeiro dia do mês anterior até último dia do mês anterior |
| `Máximo` | DATE(2020,1,1) até TODAY()+1 (todos os registros) |
| `Personalizado` | Lê as datas manuais de L3 e L4 |

#### L3 e L4 — Datas Manuais (modo Personalizado)

Quando L2 = "Personalizado", o sistema usa:
- **L3** como data inicial
- **L4** como data final

#### M5 — Data Início Efetiva

```
=IF(L2="Personalizado",
    IF(ISBLANK(L3), DATE(2020,1,1), L3),
    IFERROR(VLOOKUP(L2, K9:M17, 2, FALSE), DATE(2020,1,1)))
```

- Se o modo for "Personalizado", usa L3 (ou tudo desde 2020 se L3 estiver vazio).
- Para os outros modos, faz `VLOOKUP` na tabela interna `K9:M17` para buscar a data de início correspondente.

#### M6 — Data Fim Efetiva

```
=IF(L2="Personalizado",
    IF(ISBLANK(L4), TODAY()+1, L4),
    IFERROR(VLOOKUP(L2, K9:M17, 3, FALSE), TODAY()+1))
```

- Mesma lógica: "Personalizado" usa L4, outros modos usam o `VLOOKUP`.

#### Tabela Interna de Atalhos (K9:M17)

| Linha | Atalho (K) | Data Início (L) | Data Fim (M) |
|-------|-----------|-----------------|--------------|
| 9 | Hoje | `TODAY()` | `TODAY()+1` |
| 10 | Ontem | `TODAY()-1` | `TODAY()` |
| 11 | Últimos 7 dias | `TODAY()-6` | `TODAY()+1` |
| 12 | Últimos 14 dias | `TODAY()-13` | `TODAY()+1` |
| 13 | Últimos 30 dias | `TODAY()-29` | `TODAY()+1` |
| 14 | Este mês | `EOMONTH(TODAY(),-1)+1` | `TODAY()+1` |
| 15 | Mês passado | `EOMONTH(TODAY(),-2)+1` | `EOMONTH(TODAY(),-1)` |
| 17 | Personalizado | `L3` | `L4` |

### 4.3 Tabela de Funil (linhas 2–7)

Consolida métricas por etapa do funil, sempre filtradas pelo período ativo (M5 a M6).

| Col | A (Etapa) | B (Total pedidos) | C (Aprovados) | D (Bruto R$) | E (Líquido R$) | F (% participação) |
|-----|-----------|-------------------|---------------|--------------|----------------|-------------------|
| 2 | *(cabeçalho)* | — | Vendas Aprovadas | Faturamento Bruto R$ | Faturamento Líquido R$ | — |
| 3 | Front-End | COUNTIFS(F="Front-End") | COUNTIFS(F="Front-End", M="Aprovado") | SUMIFS(R, ...) | SUMIFS(S, ...) | C3/$C$3 |
| 4 | Order Bump | COUNTIFS(F="Order Bump") | COUNTIFS(F="Order Bump", M="Aprovado") | SUMIFS(R, ...) | SUMIFS(S, ...) | — |
| 5 | Upsell 01 | COUNTIFS(F="Upsell 01") | COUNTIFS(F="Upsell 01", M="Aprovado") | SUMIFS(R, ...) | SUMIFS(S, ...) | — |
| 6 | Upsell 02 | COUNTIFS(F="Upsell 02") | COUNTIFS(F="Upsell 02", M="Aprovado") | SUMIFS(R, ...) | SUMIFS(S, ...) | — |
| 7 | **TOTAL** | SUM(B3:B6) | SUM(C3:C6) | SUM(D3:D6) | SUM(E3:E6) | — |

**Exemplo da fórmula para Front-End (C3):**
```
=COUNTIFS(
    DB_Vendas!F:F, "Front-End",
    DB_Vendas!M:M, "Aprovado",
    DB_Vendas!A:A, ">="&$M$5,
    DB_Vendas!A:A, "<"&($M$6+1)
)
```

O padrão `<"&($M$6+1)` garante que o dia final seja **incluído** (já que as datas em A são timestamps com hora).

### 4.4 KPIs Consolidados (B26–B37)

| Célula | Nome | Fórmula | Descrição |
|--------|------|---------|-----------|
| B26 | Faturamento Bruto Total | `=SUM(D3:D6)` | Soma de todos os brutos R$ aprovados no período |
| B27 | Faturamento Líquido Total | `=SUM(E3:E6)` | Soma de todos os líquidos R$ aprovados no período |
| B28 | Líquido Front-End | `=E3` | Receita líquida somente do produto principal |
| B29 | Receita Adicional Funil | `=SUM(E4:E6)` | Soma dos líquidos de OB + Upsell 1 + Upsell 2 |
| B30 | % Receita Adicional | `=IFERROR(B29/B27, 0)` | Quanto % da receita total veio de pós-checkout |
| B31 | Compradores Únicos Front-End | `COUNTUNIQUEIFS(email, funil="Front-End", status="Aprovado", período)` | Conta e-mails distintos — não duplica quem comprou mais de uma vez |
| B32 | AOV (Ticket Médio por Cliente) | `=IFERROR(B27/B31, 0)` | Receita líquida total dividida por compradores únicos |
| B33 | Take Rate Upsell 01 | `=IFERROR(C5/C3, 0)` | % dos compradores Front que também compraram Upsell 01 |
| B34 | Take Rate Upsell 02 | `=IFERROR(C6/C3, 0)` | % dos compradores Front que também compraram Upsell 02 |
| B35 | Avanço Upsell 1 → Upsell 2 | `=IFERROR(C6/C5, 0)` | Dos que compraram Upsell 01, quantos avançaram para Upsell 02 |
| B36 | Take Rate Order Bump | `=IFERROR(C4/C3, 0)` | % dos compradores Front que adicionaram o Order Bump |
| B37 | Taxa de Aprovação Geral | `COUNTIFS(M="Aprovado") / COUNTIFS(todos no período)` | Proporção de todos os eventos que resultaram em "Aprovado" |

### 4.5 Distribuição Geográfica (A11:D22)

Tabela com até 12 países, calculada com:

```
Coluna B (qtd vendas por país):
=COUNTIFS(DB_Vendas!K:K, A11, DB_Vendas!M:M, "Aprovado",
          DB_Vendas!A:A, ">="&$M$5, DB_Vendas!A:A, "<"&($M$6+1))

Coluna C (receita líquida R$ por país):
=SUMIFS(DB_Vendas!S:S, DB_Vendas!K:K, A11, DB_Vendas!M:M, "Aprovado",
        DB_Vendas!A:A, ">="&$M$5, DB_Vendas!A:A, "<"&($M$6+1))

Coluna D (% participação):
=IFERROR(IF($C$23=0, 0, C11/SUM(C11:C22)), 0)
```

**Países presentes nos dados de exemplo:** Brasil, Chile, Argentina, México, Colômbia, Peru, Uruguai, Espanha, República Dominicana, Estados Unidos, Equador, Paraguai, Costa Rica, entre outros.

### 4.6 Distribuição por Meio de Pagamento (F11:I22)

Mesma estrutura da distribuição geográfica, mas filtrando pela coluna L (Meio de Pagamento) de DB_Vendas.

**Meios de pagamento registrados:** Cartão de Crédito, PIX, Boleto Bancário, PayPal, Mercado Pago, Apple Pay, Bancolombia, SPEI, Yape, Nequi, PSE, MB WAY.

### 4.7 Análise de Cartão de Crédito (B41–B47)

| Célula | Nome | Fórmula |
|--------|------|---------|
| B42 | Tentativas Totais Cartão | `COUNTIFS(L="Cartão de Crédito", período)` |
| B43 | Aprovadas Cartão | `COUNTIFS(L="Cartão de Crédito", M="Aprovado", período)` |
| B44 | Recusadas | `=MAX(0, B42-B43)` |
| B45 | Taxa de Aprovação Cartão | `=IFERROR(B43/B42, 0)` |
| B46 | Receita Líquida Cartão (R$) | `SUMIFS(S, L="Cartão de Crédito", M="Aprovado", período)` |
| B47 | Receita Bruta Cartão (R$) | `SUMIFS(R, L="Cartão de Crédito", M="Aprovado", período)` |

---

## 5. Aba: Dashboard — Painel Visual

### 5.1 Cabeçalho Dinâmico (M4)

```
="🗓️ " & TEXT(Aux_Calculos!M5, "dd/mm/yy") & " a " &
           TEXT(Aux_Calculos!M6, "dd/mm/yy") & " • " &
           Aux_Calculos!C7 & " vendas"
```

Exibe automaticamente o período ativo e o total de vendas aprovadas no período.  
**Exemplo:** `🗓️ 05/08/26 a 11/09/26 • 187 vendas`

### 5.2 Cards de KPI (linha 6)

Cada card tem um **valor principal** (linha 6) e um **subtítulo contextual** (linha 7):

| Posição | KPI | Valor (linha 6) | Subtítulo (linha 7) |
|---------|-----|----------------|---------------------|
| B6/B7 | FATURAMENTO LÍQUIDO | `Aux_Calculos!B27` | `"Bruto: " & TEXT(B26, "R$ #,##0.00")` |
| D6/D7 | COMPRADORES FRONT | `Aux_Calculos!B31` | `"Aprovação: " & TEXT(B37, "0.0%")` |
| F6/F7 | TICKET MÉDIO (AOV) | `Aux_Calculos!B32` | Comparativo vs Front (▲ se AOV maior) |
| H6/H7 | RECEITA ADICIONAL FUNIL | `Aux_Calculos!B29` | `TEXT(B30, "0.0%") & " do faturamento"` |
| J6/J7 | TAKE RATE UPSELL 01 | `Aux_Calculos!B33` | `C5 & " de " & C3 & " compradores"` |
| L6/L7 | TAKE RATE UPSELL 02 | `Aux_Calculos!B34` | `C6 & " de " & C3 & " compradores"` |
| N6/N7 | AVANÇO UPSELL 1 → 2 | `Aux_Calculos!B35` | `C6 & " de " & C5 & " do Upsell 1"` |

O subtítulo do AOV (F7) usa lógica condicional:
```
=IF(Aux_Calculos!C3=0, "Aguardando vendas",
   IF(Aux_Calculos!B32 > (Aux_Calculos!E3/Aux_Calculos!C3),
      "▲ +" & TEXT((B32/(E3/C3))-1, "0%") & " vs Front",
      "Baseline Front"))
```

Mostra `▲ +XX%` quando o AOV geral supera o ticket médio somente do Front-End.

### 5.3 Seção de Cartão de Crédito (linhas 50–59)

| Célula | Conteúdo |
|--------|---------|
| B50 | Taxa de Aprovação Cartão (`Aux_Calculos!B45`) |
| D50 | Total de Tentativas (`Aux_Calculos!B42`) |
| F50 | Total de Recusadas (`Aux_Calculos!B44`) |
| B51 | `"Aprovadas: " & B43 & " de " & B42` |
| D51 | `"Aprovadas: " & B43 & " | Recusadas: " & B44` |
| F51 | `"Taxa de Recusa: " & TEXT(IFERROR(B44/B42, 0), "0.0%")` |
| B54 | Receita Líquida Cartão (`Aux_Calculos!B46`) |
| E54 | `IFERROR(B46/B43, 0)` — ticket médio por cartão aprovado |
| B55 | `"Faturamento Bruto: " & TEXT(B47, "R$ #,##0.00")` |
| E55 | `"Participação: " & TEXT(IFERROR(B46/B27, 0), "0.0%") & " da receita total"` |
| B58 | Diagnóstico de aprovação em texto completo |
| B59 | Diagnóstico de volume em texto completo |

---

## 6. Aba: Integração Webhook — Guia de Instalação

Esta aba é **puramente documental** — não contém fórmulas. Serve como manual de integração embutido na planilha.

### Etapa 1 — Publicar o Script no Apps Script

1. No menu da planilha: **Extensões > Apps Script**
2. Apagar o código existente e colar o código da aba
3. Salvar (Ctrl+S)
4. Clicar em **Implantar > Nova Implantação**
5. Selecionar tipo **App da Web (Web App)**
6. Configurar:
   - **Executar como:** Eu (proprietário)
   - **Acesso:** Qualquer pessoa (anyone, even anonymous)
7. Clicar em **Implantar** e autorizar o acesso
8. Copiar a **URL do Web App** gerada

### Etapa 2 — Configurar na Hotmart

1. Hotmart → **Ferramentas > Webhook (Notificações de Vendas)**
2. **Cadastrar Webhook / Nova Configuração**
3. Nome: (ex.: `Planilha de Acompanhamento`)
4. Produtos: selecionar os produtos desejados
5. **URL para envio:** colar a URL do Web App do Apps Script
6. Versão da API: **2.0.0**
7. Eventos: **Compra aprovada, Boleto gerado, Cancelada, Reembolso**
8. Salvar e usar **Enviar teste** para validar

---

## 7. Google Apps Script — Webhook Receptor

### 7.1 Configuração

```javascript
const SPREADSHEET_ID = "17olHtrstWAN8B5NKMibvWa_uxUDVhexIv81tg_2pVOA";
const SHEET_NAME = "DB_Vendas";
```

### 7.2 Função `autorizarPermissoes()`

Executada manualmente uma única vez para conceder permissões de acesso à planilha. Verifica se a aba `DB_Vendas` existe e exibe log de confirmação.

### 7.3 Função `doGet(e)`

Responde a requisições HTTP GET (acesso via navegador). Retorna JSON de status:
```json
{ "status": "ONLINE", "message": "Webhook ativo e conectado à aba DB_Vendas!" }
```

Útil para verificar se o script está publicado e online sem precisar da Hotmart.

### 7.4 Função `doPost(e)` — Receptor Principal

Esta é a função core. Chamada automaticamente toda vez que a Hotmart envia um evento.

#### Fluxo completo passo a passo:

**1. Valida payload**
```javascript
if (!e || !e.postData || !e.postData.contents)
    return HtmlService.createHtmlOutput("EMPTY_PAYLOAD");
```
Rejeita silenciosamente requisições sem corpo.

**2. Extrai campos do JSON Hotmart**
```javascript
const payload = JSON.parse(e.postData.contents);
const event    = payload.event || "";       // tipo do evento
const buyer    = payload.data.buyer || {};  // dados do comprador
const product  = payload.data.product || {}; // dados do produto
const purchase = payload.data.purchase || {}; // dados da compra
const payment  = purchase.payment || {};    // dados do pagamento
const commissions = payload.data.commissions || []; // comissões
```

**3. Formata data/hora no fuso brasileiro**
```javascript
const dateFormatted = Utilities.formatDate(now, "America/Sao_Paulo", "yyyy-MM-dd HH:mm:ss");
const dayOfWeek     = Utilities.formatDate(now, "America/Sao_Paulo", "EEE");
const hourFormatted = Utilities.formatDate(now, "America/Sao_Paulo", "HH:00");
```

**4. Determina código de transação**
```javascript
const transactionCode = purchase.transaction || data.transaction
    || ("HP" + Utilities.getUuid().substring(0, 8).toUpperCase());
```
- Tenta `purchase.transaction`, depois `data.transaction`.
- Se ambos faltarem, gera um UUID parcial com prefixo `HP` como fallback.

**5. Classifica etapa do funil** *(descrito na seção 3.3)*

**6. Busca cotação via LockService (trava de concorrência)**

```javascript
const lock = LockService.getScriptLock();
lock.waitLock(30000); // espera até 30 segundos
```

Serializa requisições simultâneas para evitar condição de corrida — se duas compras chegam ao mesmo tempo, uma espera a outra terminar.

**7. Verifica anti-duplicidade (coluna D)**

```javascript
const codigosColunaD = sheet.getRange(1, 4, lastRow, 1).getValues();
const jaExiste = codigosColunaD.some(linha =>
    String(linha[0]).trim() === String(transactionCode).trim()
);
if (jaExiste)
    return HtmlService.createHtmlOutput("SUCCESS - DUPLICADO IGNORADO: " + transactionCode);
```

- Lê toda a coluna D em memória (operação única, eficiente).
- Se o código já existe, responde **HTTP 200** sem gravar — isso faz a Hotmart parar de reenviar.

**8. Busca cotação USD/BRL**

```javascript
let cotacaoUsd = 5.65; // contingência
if (auxSheet) {
    const valCotacao = auxSheet.getRange("D2").getValue();
    if (valCotacao && !isNaN(valCotacao) && Number(valCotacao) > 0)
        cotacaoUsd = Number(valCotacao);
}
```

Lê `Aux_Calculos!D2` (que contém `GOOGLEFINANCE`). Nota: a célula D2 no script corresponde à `H2` na nomenclatura interna (há possível discrepância de coluna — o script usa `D2`, mas a fórmula `GOOGLEFINANCE` está em `H2`).

**9. Calcula valores em BRL**
```javascript
const grossBrl = Math.round(Number(grossValue) * cotacaoUsd * 100) / 100;
const netBrl   = Math.round(Number(netValue)   * cotacaoUsd * 100) / 100;
```

**10. Grava linha com `appendRow`**

```javascript
sheet.appendRow([
    dateFormatted,   // A
    dayOfWeek,       // B
    hourFormatted,   // C
    transactionCode, // D
    productName,     // E
    funnelStage,     // F
    isOrderBump,     // G
    buyerName,       // H
    buyerEmail,      // I
    buyerPhone,      // J
    country,         // K
    paymentType,     // L
    statusFormatted, // M
    grossValue,      // N (USD)
    netValue,        // O (USD)
    originUtm,       // P
    cotacaoUsd,      // Q
    grossBrl,        // R (calculado pelo script)
    netBrl           // S (calculado pelo script)
]);
SpreadsheetApp.flush(); // força persistência antes de liberar a trava
```

**11. Responde HTTP 200**
```javascript
return HtmlService.createHtmlOutput("SUCCESS");
```

`HtmlService` (não `ContentService`) é usado propositalmente: evita o redirecionamento HTTP 302 que o `ContentService` gera, o qual a Hotmart não segue em POST e interpretava como falha — reenviando o webhook 15 minutos depois e causando duplicatas.

**12. Libera a trava**
```javascript
lock.releaseLock(); // no bloco finally
```

Sempre executado, mesmo em caso de erro, garantindo que a próxima requisição não fique bloqueada indefinidamente.

---

## 8. Fórmulas Detalhadas

### 8.1 Padrão COUNTIFS com filtro de período

Usado em toda a aba `Aux_Calculos` para contar registros dentro do período selecionado:

```
=COUNTIFS(
    DB_Vendas!F:F, "Front-End",        ← filtro por etapa
    DB_Vendas!M:M, "Aprovado",         ← apenas aprovados
    DB_Vendas!A:A, ">="&$M$5,          ← a partir da data início
    DB_Vendas!A:A, "<"&($M$6+1)        ← até o final do dia de fim
)
```

### 8.2 Padrão SUMIFS com filtro de período

Mesma lógica para somar valores monetários:

```
=SUMIFS(
    DB_Vendas!S:S,                     ← soma coluna S (líquido R$)
    DB_Vendas!F:F, "Front-End",
    DB_Vendas!M:M, "Aprovado",
    DB_Vendas!A:A, ">="&$M$5,
    DB_Vendas!A:A, "<"&($M$6+1)
)
```

### 8.3 Conversão de câmbio (DB_Vendas R e S)

```
=IF(OR(ISBLANK(N2), N2=""), "",
    ROUND(N2 * IF(AND(ISNUMBER(Q2), Q2>0), Q2, Aux_Calculos!$H$2), 2))
```

### 8.4 Percentual de participação (distribuição geográfica/pagamento)

```
=IFERROR(IF($C$23=0, 0, C11/SUM(C11:C22)), 0)
```

Calcula quanto % do total de receita cada país (ou meio) representa. Protege contra divisão por zero com `IFERROR` e `IF(=0)`.

### 8.5 Recusadas de cartão (sem negativos)

```
=MAX(0, B42-B43)
```

Garante que não apareça valor negativo caso dados estejam desincronizados.

### 8.6 GOOGLEFINANCE para câmbio em tempo real

```
=IFERROR(GOOGLEFINANCE("CURRENCY:USDBRL"), 5.65)
```

Atualiza automaticamente durante o horário de funcionamento do mercado. Fora do horário (fins de semana e feriados) mantém o último valor disponível ou usa o fallback `5.65`.

---

## 9. Sistema de Filtro Global

O filtro é **centralizado em `Aux_Calculos!L2`** e afeta **todo o Dashboard simultaneamente**. Qualquer mudança no dropdown se propaga imediatamente para todos os COUNTIFS e SUMIFS da planilha, pois todos referenciam `$M$5` e `$M$6`.

### Como alterar o período

1. Vá até a aba `Dashboard`
2. Selecione o período no **dropdown de filtro** (campo rotulado como `📅 FILTRO GLOBAL`)
3. O valor é espelhado de/para `Aux_Calculos!L2`
4. Todos os KPIs e gráficos atualizam automaticamente

### Modo Personalizado

1. Selecione "Personalizado" no dropdown
2. Informe manualmente:
   - **Data Inicial** → célula `Aux_Calculos!L3`
   - **Data Final** → célula `Aux_Calculos!L4`
3. Os campos `DATA INICIAL EFETIVA` (M5) e `DATA FINAL EFETIVA` (M6) exibem as datas resolvidas

---

## 10. KPIs e Indicadores

### Tabela Resumida de todos os KPIs

| KPI | Origem | Significado |
|-----|--------|-------------|
| **Faturamento Bruto Total** | Aux_Calculos!B26 | Soma de todos os valores brutos R$ aprovados no período (inclui comissões da Hotmart) |
| **Faturamento Líquido Total** | Aux_Calculos!B27 | Receita líquida do produtor em R$ |
| **Faturamento Líquido Front-End** | Aux_Calculos!B28 | Receita líquida somente do produto principal |
| **Receita Adicional Funil** | Aux_Calculos!B29 | Order Bump + Upsell 01 + Upsell 02 em líquido R$ |
| **% Receita Adicional** | Aux_Calculos!B30 | Quanto % da receita total veio do pós-checkout |
| **Compradores Únicos Front-End** | Aux_Calculos!B31 | Contagem de e-mails distintos — evita duplicatas de recompras |
| **Ticket Médio / AOV** | Aux_Calculos!B32 | Receita líquida ÷ compradores únicos |
| **Take Rate Upsell 01** | Aux_Calculos!B33 | % dos compradores Front-End que compraram Upsell 01 |
| **Take Rate Upsell 02** | Aux_Calculos!B34 | % dos compradores Front-End que compraram Upsell 02 |
| **Avanço Upsell 1 → 2** | Aux_Calculos!B35 | % dos que compraram Upsell 01 que também compraram Upsell 02 |
| **Take Rate Order Bump** | Aux_Calculos!B36 | % dos compradores Front-End que adicionaram Order Bump |
| **Taxa de Aprovação Geral** | Aux_Calculos!B37 | Aprovados ÷ total de eventos no período |
| **Taxa Aprovação Cartão** | Aux_Calculos!B45 | Aprovados por cartão ÷ total de tentativas por cartão |
| **Tentativas Totais Cartão** | Aux_Calculos!B42 | Total de pedidos com cartão (aprovados + recusados) |
| **Vendas Recusadas Cartão** | Aux_Calculos!B44 | Tentativas de cartão que não foram aprovadas |
| **Receita Líquida Cartão** | Aux_Calculos!B46 | Soma da coluna S filtrada por cartão aprovado |
| **Ticket Médio Cartão (AOV)** | Dashboard!E54 | Receita líquida cartão ÷ vendas aprovadas cartão |

---

## 11. Gráficos

O Dashboard contém **5 gráficos**, todos alimentados por `Aux_Calculos`:

| # | Tipo | Título | Séries (dados de Aux_Calculos) |
|---|------|--------|-------------------------------|
| 1 | **Barras verticais** | Vendas Aprovadas por Etapa do Funil | `C3:C6` (contagem de aprovados por etapa) — rótulos `A3:A6` |
| 2 | **Barras verticais** | Faturamento Líquido por Etapa do Funil | `E3:E6` (receita líquida R$ por etapa) — rótulos `A3:A6` |
| 3 | **Rosca (Doughnut)** | Distribuição Geográfica (País) | `H10:H22` (receita R$ por país) — rótulos `F10:F22` |
| 4 | **Barras horizontais** | Meios de Pagamento | `C11:C22` (qtd. de vendas por meio) — rótulos `A11:A22` |
| 5 | **Rosca (Doughnut)** | Aprovadas vs Recusadas Cartão | `E41:E42` (qtd. aprovadas e recusadas) — rótulos `D41:D42` |

---

## 12. Mecanismos de Segurança e Integridade

### 12.1 Anti-Duplicidade (Apps Script)

A Hotmart reenvia webhooks em caso de timeout ou erro. Para evitar gravar a mesma transação duas vezes:

1. Antes de gravar, o script lê toda a coluna D de `DB_Vendas` em memória.
2. Compara o código de transação recebido com todos os registros existentes.
3. Se já existir → responde `HTTP 200` sem gravar (interrompe o loop de reenvio da Hotmart).

### 12.2 LockService (Concorrência)

Quando duas compras chegam simultaneamente (evento comum em lançamentos):

- `LockService.getScriptLock()` cria uma trava global no script.
- `lock.waitLock(30000)` faz a segunda requisição aguardar até 30 segundos.
- `SpreadsheetApp.flush()` força a gravação na planilha antes de liberar a trava.
- `lock.releaseLock()` no bloco `finally` garante que a trava sempre seja liberada.

### 12.3 HtmlService vs ContentService

O script usa `HtmlService.createHtmlOutput("SUCCESS")` ao invés de `ContentService.createTextOutput(...)` para responder. Motivo: o `ContentService` retorna HTTP 302 (redirect), que a Hotmart não segue em requisições POST — interpretando como falha e reenviando o webhook 15 minutos depois. O `HtmlService` retorna HTTP 200 diretamente.

### 12.4 Proteção contra divisão por zero

Todas as fórmulas de taxa/percentual usam `IFERROR(..., 0)` e/ou `IF(denominador=0, 0, ...)`:

```
=IFERROR(IF(C3=0, 0, C5/C3), 0)  ← dupla proteção
=MAX(0, B42-B43)                  ← evita valores negativos
```

### 12.5 Fallback de câmbio

O câmbio USD/BRL tem **três camadas de fallback**:
1. `GOOGLEFINANCE("CURRENCY:USDBRL")` — tempo real
2. Valor em `Aux_Calculos!D2` se GOOGLEFINANCE estiver indisponível
3. `5.65` hardcoded no script como última contingência

---

## 13. Conexões entre Abas

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  HOTMART  ──HTTP POST──►  APPS SCRIPT                              │
│                                ├── lê cotação de Aux_Calculos!D2  │
│                                └── grava linha em DB_Vendas (A:S) │
│                                                                     │
│  DB_Vendas (A:S)                                                    │
│    └── colunas R, S calculadas por fórmula com ref a Aux_Calculos!H2│
│                                                                     │
│  Aux_Calculos                                                       │
│    ├── H2: GOOGLEFINANCE (câmbio ao vivo)                          │
│    ├── L2: dropdown de período (entrada do usuário)                │
│    ├── M5/M6: datas efetivas calculadas                            │
│    ├── B3:F7: funil com COUNTIFS/SUMIFS em DB_Vendas              │
│    ├── B26:B37: KPIs consolidados                                  │
│    ├── A11:D22: distribuição geográfica                            │
│    ├── F11:I22: distribuição por pagamento                         │
│    └── B41:B47: análise de cartão                                  │
│                                                                     │
│  Dashboard                                                          │
│    ├── KPIs (linha 6): referências diretas a Aux_Calculos!B27 etc │
│    ├── Subtítulos (linha 7): fórmulas TEXT() sobre Aux_Calculos   │
│    ├── Seção Cartão (linhas 50-59): ref a Aux_Calculos!B42-B47    │
│    └── Gráficos 1-5: séries alimentadas por Aux_Calculos          │
│                                                                     │
│  Integração Webhook                                                 │
│    └── (somente texto/documentação — sem fórmulas)                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Resumo de referências cruzadas

| De | Para | O quê |
|----|------|-------|
| Apps Script | `Aux_Calculos!D2` | Leitura do câmbio USD/BRL antes de gravar |
| Apps Script | `DB_Vendas` (append) | Gravação das 19 colunas por evento Hotmart |
| `DB_Vendas!R` e `DB_Vendas!S` | `Aux_Calculos!$H$2` | Fallback de câmbio para conversão R$ |
| `Aux_Calculos` (B3:F7, B11:D22, F11:I22, B26:B47) | `DB_Vendas` (colunas A, F, K, L, M, R, S) | Agregação via COUNTIFS/SUMIFS |
| `Aux_Calculos!M5`, `M6` | `Aux_Calculos!L2`, `L3`, `L4`, `K9:M17` | Resolução das datas efetivas do filtro |
| `Dashboard` (KPIs, subtítulos) | `Aux_Calculos!B26:B37, B42:B47, C3:C7, M5, M6` | Exibição dos valores calculados |
| `Dashboard` (gráficos) | `Aux_Calculos!A3:F6, A11:I22, D41:E42` | Dados e rótulos dos 5 gráficos |
