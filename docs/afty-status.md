# Status do Grimório Afty — handoff para chat novo

Estado atual do sistema Afty (atualizado 2026-07-15). Leia junto com:
`docs/roadmap-versionamento-e-fichas.md` (arquitetura) e `docs/afty-formulas-base.md` (fórmulas).

---

## Contexto rápido

- App: SPA Vite + React 18, **sem backend**, estado em `localStorage`. Deploy: push na `main` → Vercel.
- **O usuário faz os commits** — nunca rodar git commit/push.
- **Sempre parar e perguntar quando houver dúvida** (o autor pediu isso explicitamente).
- Rota escondida **`/Afty`** (detectada em `src/App.jsx`, sem link em menu) → abre o
  `AftyCreatureBuilder` em vez do builder da 2.5.2. Storage ISOLADO (`fm_*_afty_v1`),
  tag `rulesVersion: "afty"`. Fichas Afty só aparecem em `/Afty`.
- Verificação: `npx vite build` + `npx eslint src/systems/afty/`. Testes de lógica via
  `node --input-type=module` com um hook de resolução (o import extensionless quebra no node):
  ```
  node --input-type=module -e 'import {register} from "node:module";
  register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
  const {deriveAfty}=await import("./src/systems/afty/afty-derive.js"); ...'
  ```
- ⚠️ Não consigo testar render no navegador aqui — build valida imports/JSX; lógica coberta por asserts.

---

## Arquivos (src/systems/afty/)

- `AftyCreatureBuilder.jsx` — o builder tabulado (abas: Identidade, Informações, Habilidades,
  Especializações, Aptidões, Inventário, Interlúdios, Cálculos). Visual = igual ao builder 2.5.2
  (slate + roxo, dark, reusa `../../components/builder-controls`).
- `afty-derive.js` — motor de cálculo por FÓRMULA (ND 1→∞, sem tabela). Fórmulas reais já
  implementadas (menos Guarda/Perícias — adiados; Treinamento PARCIAL: as trilhas catalogadas
  já alimentam PE/Movimento/Aptidão via `resolveTreinoEfeitos`; ver afty-formulas-base.md).
- `afty-treinamentos.js` — catálogo de Treinamentos (Interlúdios): Linhas de 4 etapas
  sequenciais + Completo, custo em Focos, requisitos, efeitos legíveis pelo motor + resolvers.
- `afty-schema.js` — `createBlankAfty()` + constantes (tipos, patamares, tamanhos, graus de item…).
- `afty-atributos.js` — regras de atributo (métodos, point-buy, valores fixos, rolagem, pool de
  nível, Desenvolvimento, validação `resumoAtributos`).
- `afty-origens.js` — catálogo de origens + resolvers (`resolveOrigemAttrBonus`, `resolveDesenvolvimento`).
- `afty-anatomias.js` — catálogo das 15 Características de Anatomia (Feto).
- `creature-schema.js` — documento-spec anotado (referência).

---

## Sistema de ATRIBUTOS (pronto e polido)

- 6 atributos: Força, Destreza, Constituição, Inteligência, Sabedoria, **Presença** (não Carisma).
  Valores 0–30. **Limite POR ATRIBUTO** (default 20, elevável a 30 por poderes; fixo/leitura no UI).
- **3 métodos** (o GM escolhe): Compra por Pontos (17 pts, tabela de custo, faixa 8–15),
  Valores Fixos (15,14,13,12,10,8 — dropdown com TROCA, sem travar), Rolagem (4d6 dropa menor;
  mostra `(soma NN)` discreto). "Nível" == ND.
- **Pontos de nível**: +2 a cada 4 ND (`floor(ND/4)*2`), pool separado, 1:1, teto = limite base.
- **Atributo efetivo = base + nível + Desenvolvimento + bônus de origem** (teto 30). Exposto em
  `derived.attrEff`, `derived.mods`, `derived.attrLimiteEfetivo`, `derived.attrDesenv`, `derived.attrBonus`.
- Aba de Atributos = **tabela compacta** (Atributo · Base · Nível · Efetivo · Limite), colunas centralizadas.

### Regras de bônus de atributo (IMPORTANTES)
- Bônus de origem é **efetivo e grátis** (soma no valor, não gasta orçamento).
- Bônus de origem **NÃO passa o limite** do atributo — salvo os que disserem explicitamente (TODO no motor).
- Se o bônus de origem passaria do limite, os **pontos de Nível são DEVOLVIDOS ao pool** (a origem
  tem prioridade). Ver `setOrigemBonus` no builder + `nivMax` que reserva espaço pro bônus.
- **Desenvolvimento Inesperado** (Derivado): pool `floor(ND/4)`, cada ponto dá **+1 no valor E +1 no
  limite** do atributo escolhido (concentra ou espalha). É a exceção que passa de 20 (eleva o limite junto).

---

## ORIGENS (o que está feito)

Padrão: origem = conteúdo em `afty-origens.js`. Cada uma tem resumo, raridade, características.
Bônus em Atributo tem 2 formatos, ambos gravados em `core.origem.bonusAtributos`:
- **escolhaDoJogador** `{pontos:[2,1]}` → seletores "+2 em / +1 em" (Inato, Derivado, Feto).
- **distribuir** `{distribuir:N, maxPorAtributo:M}` → alocador de N pontos (Sem Técnica: 4, máx 3).

Concessões (grants) que ligam quando os catálogos existirem: `talento`, `feitico`,
`aptidao_amaldicoada`, `pericia_treinada` (renderizadas como selos âmbar via `grantLabel`).

| Origem | Status | Notas |
|---|---|---|
| **Inato** | ✅ feito | +2/+1; Talento Natural (grants), Marca Registrada (Feitiço −1 PE) |
| **Derivado** | ✅ feito | +2/+1; Energia Antinatural (Aptidão de Aura + recuperação PE); **Desenvolvimento Inesperado** (mecânica fiada) |
| **Sem Técnica** | ✅ feito | Bônus = distribuir 4 (máx 3); restrições; Estudos Dedicados; **Empenho Implacável tem CONTINUAÇÃO** (lembrete roxo — completar na aba Habilidades; progressão dos 9 níveis preservada em `niveis:[]`) |
| **Feto Amaldiçoado Híbrido** | ✅ feito | +2/+1; Herança Maldita, Vigor Maldito (descritivos); **Físico Amaldiçoado = seletor de anatomia** (pool 1 + 1/5 níveis, 15 anatomias em `afty-anatomias.js`) |
| **Herdado** | ⬜ pendente | catálogo vazio |
| **Corpo Amaldiçoado Mutante** | ⬜ pendente | catálogo vazio |
| **Restringido** | ⬜ pendente | vazio; é a origem que **destrava uma Especialização exclusiva** (`especializacaoExclusivaId`) |

---

## SISTEMAS AINDA NÃO CONSTRUÍDOS (referenciados pelas origens)

Muita coisa das origens é "grants" ou texto esperando o sistema existir:
- **Talentos** (= poderes gerais; mesma natureza de Habilidade de Especialização, mas sem trava de classe).
- **Feitiços** (= a Técnica Inata = Ações/Características — aba Habilidades, "por último").
- **Aptidões / Aptidões Amaldiçoadas** (aba Aptidões).
- **Perícias** (destrava Atenção, que hoje usa Percepção=0).
- **Especializações** + multiclasse + Habilidades de Especialização.
- **Efeitos das 15 anatomias** (RD, ataques, tamanho, movimento, condições…).
- **Novo Estilo da Sombra / Domínio Simples** (Sem Técnica nv4).
- Motor: **Guarda** (CU9 = contador de ataques consecutivos).
- **Tela de jogo/combate** (rastrear HP/PE/Alma + Resistência Parcial/Guarda; Alma multiplica HP ao vivo).

## INTERLÚDIOS / TREINAMENTOS (parcial — em construção)

Aba **Interlúdios** (`TabInterludios`) = container. Seções:
- **Treinamento** (funcional): Linhas do catálogo `afty-treinamentos.js`. Cada linha = 4 etapas
  sequenciais + Completo automático na 4ª. Etapa custa Foco(s) (1/1/1/2 → linha inteira = 5).
  Estado na ficha: `treinamentos = { [linhaId]: progresso 0..4 }`. Ordem obrigatória; requisitos
  de **atributo** são validados (bloqueiam), os de aptidão/técnica são só lembrete (sistema TBD).
- **Estudos** e **Treinamento para Habilidade** (informativos): dependem de Perícias/Especializações.
- Trilhas catalogadas (12 — CATÁLOGO COMPLETO): **Agilidade, Barreiras, Compreensão, Controle de
  Energia, Domínios, Energia Reversa, Luta, Manejo de Arma, Potencial Físico, Resistência, Atributo,
  Perícia** (Perícia sempre por último).
  `repetivel: true` em **Manejo de Arma, Perícia e Atributo** — cada uma pode ser pega VÁRIAS vezes,
  uma por alvo distinto (não pode repetir o mesmo alvo). IMPLEMENTADO: o estado dessas linhas é um
  array `[{ alvo, progresso 1..4 }]` (não repetíveis continuam número). Cada instância tem sua própria
  trilha de etapas/Completo/focos. Escolha do alvo: `alvoTipo:"atributo"` → dropdown dos 6 atributos;
  `alvoTipo:"texto"` → campo livre (Perícia/Arma, pois esses catálogos não existem). Helpers
  (`normalizeTreinamentos`, `resolveTreinoEfeitos`, `focosGastos`) já somam por instância.
- **Treino de Atributo:** cada etapa dá +1 no atributo ESCOLHIDO e o Completo sobe o LIMITE em 2 (até
  30). A escolha do atributo já funciona (dropdown); a APLICAÇÃO direcionada (somar no atributo/limite
  certo) ainda depende do sistema de atributos — o canal `atributo` agrega o total, motor não consome.
- **Resistência HP — RESOLVIDO (2026-07-15):** as contribuições de HP (1ª +4, 4ª +6, Completo +10)
  entram por DENTRO do ×2 do HP (como a planilha), então dobram no HP final (ex.: 1ª = +8; linha
  completa = +40). Confirmado pelo autor. É o que `deriveAfty` já faz (`treino.hp` dentro do ×2).
- Requisitos suportados: `atributo` (ex. Destreza 14), `atributoOr` (Força ou Destreza 14), `nd`
  (Nível de Personagem 4) — todos validados; `nota` (aptidão/técnica de sistema futuro) só exibe.
  Adicionar trilha = só acrescentar dado no catálogo; a UI e o motor já consomem.

Orçamento de Focos (2026-07-15): **Focos Totais = ND + Outros**, onde "Outros" = bônus de poderes
que concedem treinos (sistema futuro), lido de `creature.focosBonus` (0 por ora). Derivado em
`deriveAfty` → `derived.focosTotais`; a aba mostra Gastos / Totais (vermelho se estourar).

FALTA do autor: resto do catálogo de trilhas. ⚠ Divergência a confirmar: planilha × tabelas para o
Treino de Compreensão (PE das etapas 1ª/3ª) — segui as TABELAS; ver afty-formulas-base.md.

---

## PRÓXIMOS PASSOS sugeridos

1. Terminar origens: **Herdado**, **Corpo Amaldiçoado Mutante**, **Restringido**.
2. **Talentos** (destrava Inato/Derivado/Sem Técnica e é a base de Habilidades/Especializações).
3. Aba **Especializações** (multiclasse — coração do Afty e protótipo da ficha de jogador).
