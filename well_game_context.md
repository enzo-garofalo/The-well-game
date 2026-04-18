# The Well Game — Contexto do Projeto

## Visão Geral

**The Well Game** é um boardgame educacional multiplayer em tempo real, jogado via browser, criado para professores de inglês ensinarem preposições de lugar, tempo e exceções (*in*, *on*, *at*, *from*) de forma dinâmica e competitiva.

Um professor cria uma sala, compartilha o código com até 5 alunos, e conduz partidas sorteando cartas com frases incompletas. Os alunos competem para responder corretamente dentro do tempo limite e avançar no tabuleiro.

---

## Problema que Resolve

Preposições em inglês são um dos pontos de maior dificuldade para falantes de português. O jogo cria repetição contextualizada e pressão de tempo controlada, reforçando o reconhecimento de padrões sem que o estudo pareça uma lista de regras.

---

## Mecânica Central

### O Tabuleiro
- Três trilhas paralelas, percorridas da esquerda para a direita:
  - **Caminho principal** (topo) — 20 casas até a vitória
  - **Trilha** (meio) — caminho de penalidade
  - **Poço** (fundo) — zona de reset

- Cada jogador tem um peão colorido (até 5 cores disponíveis).

### Fluxo de uma Rodada
1. Professor pressiona **"Sortear Carta"**
2. Uma frase aparece no topo da tela de todos, com `**` no lugar da preposição. Ex: `"I live ** Brazil."`
3. Cronômetro de **10 segundos** começa
4. Cada aluno clica em uma das 4 cartas na base da tela: **IN / ON / AT / FROM**
5. Ao fim do tempo, respostas são processadas simultaneamente:

| Situação do peão | Acertou | Errou |
|---|---|---|
| **Caminho principal** | Avança 1 casa | Cai para a Trilha |
| **Trilha** | Sobe para o Caminho principal | Cai para o Poço |
| **Poço** | Sobe para a Trilha | Volta para a casa 1 (Caminho principal) |

### Fim de Partida
- Um jogador chega à **casa 20** → vitória imediata
- Professor pressiona **"Encerrar Partida"** → placar final é exibido

---

## Jornada do Usuário

### Professor
1. Acessa o site → seleciona **"Sou Professor"**
2. Recebe um **código de sala** de 6 caracteres (ex: `WLG-4F2`)
3. Aguarda alunos entrarem no lobby
4. Vê lista de alunos conectados com suas cores
5. Pressiona **"Iniciar Partida"**
6. Durante o jogo: sorteia cartas, acompanha o tabuleiro ao vivo, pode encerrar a qualquer momento

### Aluno
1. Acessa o site → seleciona **"Sou Aluno"**
2. Digita o **código da sala**
3. Escolhe a cor do peão (cores já escolhidas ficam indisponíveis)
4. Aguarda no lobby até o professor iniciar
5. Durante o jogo: vê o tabuleiro, a frase sorteada, o cronômetro, e responde clicando nas cartas

---

## Interface

### Tela do Aluno (durante partida)
```
┌─────────────────────────────────────┐
│  "I live ** Brazil."        [0:07]  │  ← frase + cronômetro
├─────────────────────────────────────┤
│                                     │
│         [TABULEIRO]                 │  ← peões visíveis nas 3 trilhas
│                                     │
├─────────────────────────────────────┤
│   [ IN ]   [ ON ]   [ AT ]  [ FROM ]│  ← cartas de resposta
└─────────────────────────────────────┘
```

### Tela do Professor (durante partida)
```
┌─────────────────────────────────────┐
│  "I live ** Brazil."        [0:07]  │  ← frase + cronômetro
├─────────────────────────────────────┤
│                                     │
│         [TABULEIRO]                 │  ← visão igual à do aluno
│                                     │
├─────────────────────────────────────┤
│  [Sortear Carta]  [Encerrar Partida]│  ← controles
└─────────────────────────────────────┘
```

---

## Banco de Cartas

Arquivo `cards.json` na raiz do backend, editável pelo professor antes da aula.

### Estrutura
```json
[
  {
    "id": 1,
    "sentence": "I live ** Brazil.",
    "answer": "in",
    "category": "place",
    "explanation": "Países usam 'in'."
  },
  {
    "id": 2,
    "sentence": "The meeting is ** Monday.",
    "answer": "on",
    "category": "time",
    "explanation": "Dias da semana usam 'on'."
  }
]
```

### Campos
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | int | Identificador único |
| `sentence` | string | Frase com `**` no lugar da preposição |
| `answer` | string | `"in"`, `"on"`, `"at"` ou `"from"` |
| `category` | string | `"place"`, `"time"` ou `"exception"` |
| `explanation` | string | Exibida após a resposta (feedback) |

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Backend | Django + Django Channels (WebSocket) |
| Frontend | React + TypeScript |
| Comunicação RT | WebSocket via Django Channels |
| Estado do jogo | In-memory dict no servidor Django |
| Containerização | Docker + Docker Compose |
| Banco de dados | ❌ Nenhum |
| Cartas | `cards.json` editável |

### Decisões de Arquitetura
- **Sem banco de dados**: estado de sala e partida vivem em memória. Se o servidor reiniciar, a partida é perdida — aceitável para MVP.
- **WebSocket**: necessário para sincronismo do cronômetro e movimentação de peões em tempo real entre professor e alunos.
- **Código de sala**: gerado no servidor, 6 caracteres alfanuméricos, expirado ao encerrar partida.

---

## Scope do MVP

### ✅ Incluído
- Sala com 1 professor + até 3 alunos (MVP, expansível a 5)
- Geração e validação de código de sala
- Escolha de cor de peão no lobby
- Tabuleiro com 3 trilhas e 20 casas
- Sorteio de carta sem repetição até esgotar o deck
- Cronômetro de 10 segundos sincronizado
- Lógica de movimentação (acerto/erro por trilha)
- Feedback de resposta correta + explicação
- Tela de vitória (primeiro a chegar na casa 20)
- Encerramento manual pelo professor

### ❌ Fora do MVP
- Autenticação / contas de usuário
- Histórico de partidas
- Editor visual de cartas (edição via JSON direto)
- Sons e animações avançadas
- Mobile responsivo completo
- Ranking persistente
