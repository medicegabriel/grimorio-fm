# Referência estrutural do motor Afty (para mudança de código, não de addon)

Documento de handoff para uma sessão que vai mexer no **motor** (arquivos `src/systems/afty/*.js`
e `AftyCreatureBuilder.jsx`), não no conteúdo de um addon. Densidade alta, pouca prosa — é para ser
colado no início de outra conversa.

**Não duplica dois documentos que já existem e são mais completos no assunto deles:**
- `docs/afty-addons.md` — a camada de Addons inteira (famílias, `permite`/`libera`/`substitui`,
  namespace, `estadosCombate`/`funcionamentos`/`feiticos` de addon). Leia aquele para AUTORIA de
  addon; este documento é para mexer no motor que os addons consomem.
- `docs/afty-status.md` — devlog cronológico sessão a sessão. Este documento é o oposto: um corte
  transversal, sem data, do que já é verdade hoje.

---

## 1. Os três sistemas, um código só

Uma SPA Vite+React (`grimorio-fm`). A rota decide o sistema:

| Rota | Sistema | Chave de storage |
|---|---|---|
| `/` | Grimório 2.5.2 (o livro oficial, **somente-leitura** — não é para editar) | `fm_*` |
| `/Afty` (case-insensitive) | Criatura mestre — homebrew "Afty" por cima do 2.5.2 | `fm_*_afty_v1` |
| `/Player` | Ficha de jogador — **mesmo código** do Afty, com `sistema: "player"` | mesma base, chaves isoladas |

`/Afty` e `/Player` rodam o MESMO `deriveAfty`/`AftyCreatureBuilder`, diferenciados por
`sistema` (ver `regraDo()` em `afty-sistema.js`). Uma mudança de motor pega os dois; use
`regraDo(sistema, chave)` quando o comportamento tiver que divergir (ex.: `passivaCustaPeMaximo`:
`"afty"` não cobra PE Máximo da Passiva, `"player"` cobra o dobro do nível).

O 2.5.2 (`/`) é read-only por decisão do projeto: NUNCA editar `src/components/fm-*` ou
`src/data/enciclopedia-digital-*.json` para corrigir uma regra — correções de regra do livro dentro
do Afty são feitas por Addon com `substitui`, nunca no raw.

---

## 2. ⚠ O INVARIANTE MAIS CARO DO REPOSITÓRIO: ordem de módulos

`asserts/t-ordem-modulos.mjs` existe porque em 2026-09-02 o app inteiro caiu em tela branca com
`Cannot access 'ARMA_GRUPOS' before initialization`, e **nenhum dos milhares de asserts pegou**
(eles importam `afty-derive.js` primeiro, que resolve o ciclo na ordem que funciona; o navegador
entra por outra porta).

Existe um ciclo real e antigo no grafo de imports:
```
afty-equipamentos -> afty-efeitos -> afty-combate -> afty-habilidades -> afty-equipamentos
```
Ele só não estoura porque certos módulos são **FOLHA** (zero imports, carregam sozinhos em
qualquer ordem) e por convenção entram primeiro. `t-ordem-modulos.mjs` testa isso de duas formas:
sintaticamente (grep no próprio texto do arquivo por linhas `import`) e comportamentalmente
(cada folha importada sozinha, em processo limpo, tem que carregar sem erro).

**As folhas de hoje (zero imports, NUNCA acrescente um) — lista viva em `t-ordem-modulos.mjs`:**

| Arquivo | Por que é folha |
|---|---|
| `afty-defesas-dano.js` | a aba de Defesas entra cedo no builder |
| `afty-catarse.js` | o painel da Loja de Catarse entra cedo no builder |
| `afty-carteira.js` | a aba entra cedo no builder **e** `afty-addons.js` a importa (um import novo aqui viraria ciclo, não seta de mão única) |
| `afty-niveis-dano.js` | `afty-criacao-armas` depende dela e `afty-equipamentos` depende do `afty-criacao-armas` |
| `afty-pericias-catalogo.js` | os três catálogos de requisito a chamam |
| **`afty-schema.js`** | **"todo mundo cria ficha em branco"** — é a fábrica base, importada de quase todo lugar |
| `afty-dsl.js` | o avaliador não pode depender de conteúdo |
| `afty-sistema.js` | `regraDo()` é lido de dentro dos catálogos |

**Regra prática:** antes de adicionar `import` no topo de qualquer um destes arquivos, rode
`node asserts/t-ordem-modulos.mjs`. Se precisar mesmo de um dado externo dentro de uma dessas
folhas, o padrão certo é o INVERSO: criar a função nova NUM MÓDULO QUE JÁ IMPORTA A FOLHA (ou um
módulo novo que importa a folha) e trocar os call-sites para chamar o wrapper, nunca fazer a folha
importar algo. Foi assim que `afty-extras-nativos.js` resolveu precisar de `funcionamentosDaFicha`
(de `afty-schema.js`) sem tocar no arquivo folha: `funcionamentosComNativos()` mora no módulo novo,
e os 4 consumidores reais (`afty-efeitos.js:efeitosDaTecnica`, `AftyCreatureBuilder.jsx`,
`AftyFicha.jsx`, `PainelDeCombatente.jsx`) chamam o wrapper no lugar da função crua.

**Verificação obrigatória em qualquer mudança de import**: `node asserts/t-ordem-modulos.mjs`
sozinho já pega 90% dos problemas — é rápido e não precisa de browser.

---

## 3. O pipeline: `deriveAfty(creature, opcoes)`

Função pura e síncrona em `afty-derive.js` (3000+ linhas). Recebe a ficha crua e devolve TODOS os
números derivados (`hp`, `pe`, `defesa`, `testes.{pericias,resistencias,ataques}`, `dano.entradas`,
`combate`, etc.). Chamada em 8 pontos (builder, Ficha Final, Encontro, ...). `opcoes` carrega o que
só existe em JOGO e não na criação: `opcoes.almaAtual` (Integridade da Alma corrente, vira a
variável DSL `alma_atual`), `opcoes.concedido` (concessão de sessão do Mestre).

Estágios (ordem importa, cada canal só existe a partir do estágio dele):
1. **Pré-contexto** — atributos base, ND, patamar, `nivelAptidao` direcionado.
2. **MONTANTE** — Treinamentos (`afty-treinamentos.js`). SEM contexto de combate: `quando` é
   descartado pela "passagem direta" de `paraCanal` (só `gatilhoSessao`/`quandoProf` funcionam
   aqui). Habilidades/Talentos/Aptidões AINDA NÃO existem neste estágio (`contar()` e `tem_*`
   devolvem 0).
3. Resolução de Habilidades/Talentos/Aptidões/Especializações.
4. **Motor de Automação** — `efeitosDaTecnica(creature)` (afty-efeitos.js) coleta
   `funcionamentosComNativos(creature)` (principal + adicionais do jogador + addon + **os 3
   nativos**: Aliados/Alma/Comidas), monta `{canal, expr, origem, nome, exclusivo:
   "funcionamentoBasico", alvo, quando, duracao}` por linha, DESCARTA em silêncio entrada inválida
   (validação é da UI, não do motor).
5. Aplicação de efeitos por canal (`aplicarEfeitos`/`valorCanal`), com `resolverExclusivos` para
   canais que competem em pool (seção 5).
6. Cálculos finais: PV, PE, Defesa, CD, RD, Testes, Dano (`resolveDano`), Cura, etc.

**`combate`** é a "bancada de balanceamento" (não um rastreador de combate de verdade): um objeto
`{ ativo, ...estados }` só lido se `combate.ativo` for truthy — `resolveCombate` (afty-combate.js)
devolve **tudo zerado** (`zerado`) se `!ativo`, então NENHUM estado de bancada (nem addon nem
nativo) conta fora de "Em Combate". Exceção: efeitos que leem variáveis que NÃO são estado de
bancada (ex.: `alma_atual`, que vem de `opcoes.almaAtual` e não de `combate`) continuam valendo
sempre, dentro ou fora de combate — é assim que a penalidade automática de Alma funciona sem
precisar ligar nada.

---

## 4. O catálogo `COMBATE_ESTADOS` × `estadosExtras`: a distinção que mais confunde

`afty-combate.js` exporta `COMBATE_ESTADOS`, o catálogo NATIVO de controles da bancada (Empolgação,
Posturas, Brutalidade, ...). **Toda linha do catálogo PRECISA de um "dono"**:
`requerHabilidade` / `requerTalento` / `requerAptidao` / `requerEscolha` — a linha só aparece se a
CRIATURA tiver aquela habilidade/talento/aptidão/escolha. O filtro em
`AftyCreatureBuilder.jsx` (`SimulacaoCombateCard`) é:
```js
const temDono = e.requerEscolha ? ... : e.requerTalento ? ... : e.requerAptidao ? ... : temHabilidade(e.requerHabilidade);
```
— **sem dono, a linha do catálogo NUNCA aparece.**

Para estados que não representam algo que a criatura TEM (um companheiro, uma refeição, o estado da
própria alma, ou qualquer coisa de addon), existe `combate.estadosExtras`: uma lista à parte,
alimentada em `afty-derive.js` (`estadosExtras: [...equip.estadosUnica, ...estilo.estados,
...estadosConjurador, ...estadosAptidoes, ...estadosAddon, ...estadosVislumbre,
...ESTADOS_NATIVOS_EXTRAS]`), com filtro **INVERSO**: quem não declara dono APARECE (comentário no
código, 2026-09-07): *"no catálogo, quem não declara dono não aparece; no extra, quem não declara
dono aparece."*

**Regra de decisão ao adicionar um controle de bancada novo:**
- Representa uma habilidade/talento/aptidão que a ficha compra? → `COMBATE_ESTADOS`, com `requer*`.
- Representa algo externo (aliado, comida, clima, o que for) sem pré-requisito de ficha, e deve
  estar disponível pra TODA criatura sem precisar instalar nada? → nova entrada em
  `ESTADOS_NATIVOS_EXTRAS` (`afty-extras-nativos.js`), concatenada em `estadosExtras`.
- Representa a mesma coisa mas só para quem instalou um addon específico? → `estadosCombate` dentro
  do JSON do addon (ver `docs/afty-addons.md`), que vira `estadosCombateDeAddon(creature, nivel)` e
  entra em `estadosExtras` do mesmo jeito, com namespace do pacote.

`afty-extras-nativos.js` é o precedente do terceiro caso virando o segundo: Aliados/Alma/Comidas
nasceram como addon (2026-09-12) e foram promovidos a nativo porque o pedido era "todo mundo tem,
sem instalar nada" — a estrutura interna (`estadosCombate`-shape, `funcionamentos`-shape, nomes de
variável) foi preservada 1:1, só a fonte mudou de `creature.addons` para uma constante no código.

---

## 5. Pools exclusivos (`FAMILIAS_EXCLUSIVAS`, afty-efeitos.js)

Algumas famílias de efeito NÃO SOMAM entre si — só o "vencedor" conta. `chaveExclusiva(canal, alvo,
sinal)` agrupa por canal+alvo+sinal (positivo e negativo do MESMO canal/alvo NÃO competem entre si:
dois grupos separados). Dentro do grupo, `resolverExclusivos` escolhe o maior valor absoluto (o
"melhor bônus" ou a "pior penalidade") e marca os demais como `suplantado` (não descartados — o
painel de fontes mostra que perderam).

Famílias de hoje: `habilidadeUnica`, `feiticoAuxiliarPassivo`, `feiticoAuxiliarAtivo`,
`shikigamiCaracteristica`, `shikigamiAcao`, `funcionamentoBasico`, `segundaHabilidadeUnica` (a mais
nova, 2026-09-11, do addon de Forja).

**`funcionamentoBasico`** é a mais relevante para addons/nativos: TODA linha de
`efeitosDaTecnica` (o principal, os adicionais do jogador, os de addon, **e os 3 nativos**) carrega
`exclusivo: "funcionamentoBasico"` sem exceção — "dois Funcionamentos Básicos não somam entre si, e
nenhum deles soma com Feitiço, Shikigami, Técnica Marcial ou Estilo da Sombra." Isso significa: se a
Técnica principal da criatura também escrever um efeito no MESMO canal+alvo+sinal que Aliados/Alma/
Comidas, só um dos dois conta — não é bug, é a regra do pool.

---

## 6. DSL (`afty-dsl.js`, cópia própria do `fm-dsl.js` do 2.5.2 — nunca editar o 2.5.2)

- Aritmética, comparações (`==`, `>=`, ... devolvem 1/0), `&&`/`||`, `metade()`, `dobro()`, `max()`,
  `min()`, `piso()`, `arredonda()`, literal de texto (só como argumento de função).
- `contar("tag")` conta entradas marcadas com aquela tag (escrita no addon, ou automática por
  família/especialização). Devolve 0 no estágio MONTANTE (Habilidades ainda não existem).
- Toda variável do vocabulário é `snake_case`; um id de estado de bancada vira variável via
  `varDoEstado = normalizarVariavel` (`afty-dsl.js`): separa camelCase, lowercase, não-alfanumérico
  vira `_`. Um estado `tipo: "opcao"` com id `X` e opções `a`/`b` gera `X` (booleano: alguma opção
  selecionada) + `X_a` + `X_b` (uma booleana por opção). `tipo: "multi"` gera `X` (contagem de
  selecionados) + uma booleana por opção. Isso é o que faz addon virar nativo (ou vice-versa) sem
  reescrever fórmula: o nome final da variável só depende do `id` final, não da origem.
- O `alvo` de um canal de fonte de dano aceita escopos da linha (`arma`, `basico`, `cat:`, `grupo:`,
  `prop:`, `tipo:`, `atq:`, `empunho:duas_maos`, `treinada`), e um alvo com `|` vale para a linha que
  responde a qualquer uma das partes, uma vez só (`valorCanalEscopos`). Detalhes em
  `docs/automacao-dsl.md`.
- Efeito = `{ canal, expr, alvo?, quando?, duracao? }`. `quando` é a condição (0/1) que liga/desliga
  o efeito; sem `quando` conta como sempre ligado. Existem as constantes de vocabulário `sempre: 1`
  e `nunca: 0` para quem quer escrever isso explicitamente na UI (histórico: `""` no campo Quando
  virava 0 = desligado, contra-intuitivo, por isso as duas palavras existem).
- `dadosDano` (dado que acompanha o tamanho da LINHA de ataque) vs. `dadosNomeados` (dado de
  TAMANHO PRÓPRIO, não muda nunca — "1d6 de dano", "+2d10"): usar `dadosNomeados` sempre que a regra
  cita um dado com tamanho fixo no texto, com `alvo: "d4".."d12"` e `expr` = quantos. Histórico: até
  2026-08-31 esse segundo caso virava a MÉDIA do dado dentro de `danoBonus` (1d6 = 3), o que dava
  conta certa e ROLAGEM ERRADA na tela — bug repetido em 2026-09-12 nos golpes de Aliados
  (Combatente/Disparador/Elementalista/Assassino) e corrigido do mesmo jeito.

---

## 7. Verificação — o que rodar antes de dar qualquer trabalho por pronto

1. **`node asserts/t-ordem-modulos.mjs`** — pega quebra de ciclo de import em segundos.
2. **Suíte inteira**: `for f in asserts/t-*.mjs; do node "$f" || echo "FALHOU: $f"; done` (78
   arquivos hoje, cada um com dezenas de asserts próprios, sem framework — só `t(nome, real,
   esperado)` e `JSON.stringify` comparando). Não existe `npm test`; é isso mesmo, arquivo por
   arquivo.
3. **Syntax check rápido de um arquivo**: `npx esbuild <arquivo> --bundle=false --outfile=/tmp/x.js`
   (sem `--loader`, o esbuild infere pela extensão; com `--loader=jsx` sem mapa de extensão só
   funciona lendo de stdin).
4. **Browser real**: `npm run dev` (porta 5173), abrir `http://localhost:5173/afty` (não a raiz —
   a raiz é o 2.5.2 read-only). Depois de editar um arquivo pesado (`AftyCreatureBuilder.jsx`,
   `afty-schema.js`), se o console mostrar `Cannot access 'X' before initialization`, MATE o
   processo do Vite e suba de novo antes de confiar no erro — HMR acumula estado quebrado depois de
   várias edições e o erro pode ser fantasma; só um processo limpo prova se é de verdade (ver seção
   2 — foi assim que se confirmou que importar `afty-extras-nativos.js` dentro de `afty-schema.js`
   quebrava de verdade, e não era só ruído de HMR).
5. Escrever um teste novo em `asserts/t-<nome>.mjs` seguindo o padrão dos existentes (import via
   `register()` com o shim de extensão, ver qualquer arquivo da pasta) é mais barato e mais
   confiável que só testar no browser — o teste fica de regressão depois.

---

## 8. Fidelidade ao livro (Feiticeiros & Maldições v2.5.2)

Fonte: `C:\Users\arthu\Downloads\F&M 2.5.2 - Livro de Regras.md` (Markdown, ~13940 linhas, cabeçalhos
preservados — preferir a esta fonte; ela substitui a extração antiga via `pdftotext`).

Convenção do projeto ao ADICIONAR valor onde o livro não define métrica: reaproveitar a tabela mais
próxima já existente (nunca inventar número solto) e MARCAR a extrapolação com aviso visível na UI
E no nome (ex.: `"Aumento de Iniciativa (sem tabela no livro)"`). Ver `PASSIVO_EFEITOS` em
`afty-feiticos.js`: as categorias sem tabela de Passivo usam a régua da Defesa por analogia de
porte, com aviso a cada uso — nunca silenciosamente.

---

## 9. Arquivos-chave, por responsabilidade

| Arquivo | Responsabilidade |
|---|---|
| `afty-derive.js` | pipeline inteiro, `deriveAfty` |
| `afty-schema.js` | fábrica de ficha em branco, `funcionamentosDaFicha` cru — **FOLHA, zero imports** |
| `afty-efeitos.js` | canais (`EFEITO_CANAIS`), `efeitosDaTecnica`, pools exclusivos |
| `afty-efeitos-conteudo.js` | efeitos de cada Habilidade/Talento/Aptidão do catálogo raw |
| `afty-combate.js` | `COMBATE_ESTADOS` (catálogo nativo com dono), `resolveCombate`, `combateDslVars` |
| `afty-extras-nativos.js` | estados/funcionamentos SEM dono, embutidos (Aliados/Alma/Comidas) |
| `afty-addons.js` | registro de famílias, namespace, `estadosCombateDeAddon`, `permite`/`libera` |
| `afty-dsl.js` | avaliador de expressão, `normalizarVariavel` |
| `afty-feiticos.js` | calculadoras de Feitiço (Dano/Auxiliar/Curativo/Especial/Passivo), `AUX_TABELAS` |
| `afty-sistema.js` | `regraDo()`/`REGRAS`, divergência Afty×Player |
| `afty-golpe-especial.js` | as onze propriedades do Golpe Especial e a conta do custo. **FOLHA, zero imports** |
| `AftyCreatureBuilder.jsx` | UI do criador, 13k+ linhas, `SimulacaoCombateCard`, editores de Feitiço |
| `ficha/AftyFicha.jsx` | Ficha Final (uso em jogo) |
| `encontros/PainelDeCombatente.jsx` | painel de combatente no Encontro |

---

## 10. Gotchas já pagos nesta sessão (não repetir)

- `ctxTalento` em `AftyCreatureBuilder.jsx` precisa de `claId: draft.core?.origem?.cla ?? null` —
  sem isso, requisito `tipo: "cla"` bloqueia seleção de talento mesmo com o clã certo escolhido (o
  ctx de derive, em `afty-derive.js`, já tinha o campo; só o ctx da UI estava sem).
- Toda linha de `estadosCombate` (addon ou nativa) que outra linha referencia via `requerEstado`
  precisa citar o id JÁ NORMALIZADO pelo prefixo (addon: `pacote:id`; nativo: o id literal já com
  prefixo embutido, ex. `aliados_protetor`).
- Treinamento (estágio MONTANTE) não tem `quando` de verdade — só `gatilhoSessao`/`quandoProf`.
- O id de estado de bancada é global dentro de `sessao.combate`: procure o id antes de criar um.
  `golpeImpactante` é do Golpe Impactante do Restringido, e por isso as marcas sem número do Golpe
  Especial do Combatente moram em `sessao.golpeEspecial` (2026-09-24).
- Uso por descanso de Habilidade é o campo `usos: { expr, recarga }` do catálogo, e não estado de
  bancada: o derive monta o máximo (`usosHabilidades`) e a sessão guarda os gastos em
  `usos["hab:<id>"]`, que o Descansar zera (2026-09-24).
- Uma "categoria (sem tabela no livro)" precisa aparecer com esse texto na label E gerar aviso
  toda vez que for usada — nunca silenciosa.
