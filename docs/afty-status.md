# Status do Grimório Afty (handoff para chat novo)

Estado atual do sistema Afty (atualizado 2026-07-17). Leia junto com:
`docs/roadmap-versionamento-e-fichas.md` (arquitetura) e `docs/afty-formulas-base.md` (fórmulas).

> ⚠ **Este doc parou em 2026-07-17 e o trabalho seguiu.** O que veio depois está nas seções
> LUTADOR (2026-07-22) e no restante do sistema de INVOCAÇÕES, que foi construído inteiro
> (engine, editor, Hordas, efeitos de Controlador) e ainda não foi documentado aqui.
>
> **AS 6 ESPECIALIZAÇÕES ESTÃO FECHADAS** (2026-07-22): Combatente 71, Lutador 70, Conjurador 66,
> Suporte 58, Restringido 54, Controlador 48 = **367 habilidades**. Mais **Talentos** (51), em
> sistema próprio (`afty-talentos.js`).
>
> **NÍVEIS LENDÁRIOS FECHADOS** (2026-07-22): **11 Melhorias Superiores**, **16 Habilidades Lendárias**
> e **6 Habilidades Ápice**, em sistema próprio (`afty-alto-nivel.js`), com card próprio no fim
> da aba Especializações. Ver [NÍVEIS LENDÁRIOS](#-níveis-lendários-21-catálogo-completo).
>
> **Falta transcrever:** Arsenal Amaldiçoado e Estilo Marcial (citados pelo Restringido).
>
> 👉 **Começando um chat novo? Vá direto para
> [PENDÊNCIAS DE ESPECIALIZAÇÕES](#-pendências-de-especializações-lista-de-retomada).**

---

## 🎯 PENDÊNCIAS DE ESPECIALIZAÇÕES (lista de retomada)

Fechada em 2026-07-22, quando as 6 especializações e os Talentos foram transcritos. **Tudo aqui
está anotado mas NÃO feito.** Cada seção por especialização, mais abaixo no doc, tem o detalhe.

### A. Conteúdo que o autor ainda não mandou
| O quê | Onde é citado | Por que trava |
|---|---|---|
| **Arsenal Amaldiçoado** | *Restrito pelos Céus* (Restringido base 1) | Equipamento do Restringido a partir do 2° nível |
| **Estilo Marcial** + técnicas marciais | *Restrito pelos Céus* e *Desenvolver Ideias* (Restringido 4°) | *Desenvolver Ideias* concede "duas técnicas marciais" que não existem |
| **Combatente · 20° por nível** | — | A Base *Autossuficiente* é 20°, mas não se sabe se há por-nível de 20° |
| **Descrições das Perícias** | `afty-pericias.js` | Só a tabela veio (nome, atributo). Os TRs já têm descrição |

### B. Perguntas de ERRATA (o autor decide, é rápido)
1. **`lut_poder_corporal`** (Lutador 6°) teve o **cabeçalho comido pelo PDF**. Nome deduzido do
   pré-requisito de *Punhos Letais*. Confirmar.
2. **`tal_tecnicas_ofensivas_de_escudo`** (Talento): mesmo caso, nome deduzido do irmão
   *Técnicas Defensivas de Escudo*. Confirmar.
3. **"Técnica Precisa" não existe** (*Mira Aperfeiçoada*, Conjurador 8°). A do pool é
   **Feitiço Preciso**. Mesma coisa?
4. **"Técnica Rápida" não existe** (*Adepto de Feitiçaria*, Talento). A do pool é
   **Feitiço Rápido**. Mesma coisa? (3 e 4 parecem o mesmo deslize Técnica/Feitiço.)
5. **"Dominância em Habilidade" não existe** (pré-req de *Manipulação Perfeita*, Conjurador 16°).
   A de 6° é **Dominância em Feitiço**. Já apontei para ela.
6. ***Dominância em Feitiço*** arredonda para **CIMA**. Exceção à regra geral (floor). Confirmar.
7. **Suporte níveis 6 e 8**: as duas Bases que são **concessão pura** (Energia Reversa e Liberação
   de Energia Reversa) **custam vaga de orçamento ou vêm de graça?** As duas regras do projeto se
   chocam: alvo NOMEADO = grátis, mas toda Base no Afty gasta vaga.
8. **"Lacaio" não existe no Afty** (*Motivação pelo Triunfo*, Suporte 8°). Patamares são
   Comum/Desafio/Calamidade/Beyond. O que vale no lugar?
9. **"2 PE" e "1 PE" num Restringido sem PE** (*Ação Ágil* 4° e *Adrenalina Absoluta* 12°). O
   recurso da classe é Estamina. Trocar?
10. ***Teste de Resistência Mestre* do Restringido difere das outras 5** ("mestre nos DOIS TRs").
    Intencional?
11. ***Valorizar Invocação*** (Restringido 2°) depende de **domar maldições**, declarado FORA DE
    ESCOPO em 2026-07-17. Manter como texto morto?

### C. Decisões de MODELO (mudam código, precisam de definição antes)
| # | Assunto | Onde aparece |
|---|---|---|
| C1 | **Roubo de Habilidade: filtro de energia.** As 127 opções são as estruturalmente elegíveis. O "não dependa de energia amaldiçoada" não está aplicado. Caminho: marcar `usaEnergia: true` nas ~141 de Combatente e Lutador que gastam PE. | Restringido 2° |
| C2 | **`nivelMin` de escolha aninhada NÃO bloqueia.** Hoje um Restringido 2 rouba habilidade de 16°. Vale também para as 3 últimas Posturas de Combate. | Roubo, Posturas |
| C3 | **"Modificador de Int OU Sab" (e Presença ou Sabedoria).** O jogador escolhe qual usar. NÃO é o `atributoOr` existente (aquele é requisito). Vira estado na ficha ou convenção "usa o maior"? | ~10 no Conjurador, vários no Suporte e Lutador |
| C4 | **Repetível que concede NÍVEL DE TRILHA à escolha (6 casos).** *Aptidões de Combate*, *Aptidões de Luta*, *Aptidões de Suporte*, *Elevar Aptidão*, *Aptidão Desenvolvida*, *Estudo Amaldiçoado*. Todas orçamento, não concessão direcionada. **Resolver os 6 de uma vez.** | 4 especializações + 2 talentos |
| C5 | **Repetível que o shape de ids únicos não suporta.** *Nova Habilidade* (ilimitado), *Respeito Celeste* (2x), *Incremento de Atributo*, *Crescimento Corporal* (aptidão). O padrão `escolha.repetivel` já resolve quando há pool, mas estes não têm. | Conjurador, Restringido, Talentos |
| C6 | **Escolha aninhada de ATRIBUTO** (eleva valor, às vezes o limite): *Incremento de Atributo*, *Quebra de Limites*, *Pináculo Físico*. Mesmo padrão do Desenvolvimento Inesperado (Derivado). | Talentos, Restringido |
| C7 | **Escolha aninhada que ATRAVESSA arquivos**: *Adepto de Combate* → `ESTILOS_DE_COMBATE`, *Adepto de Feitiçaria* → `MUDANCAS_DE_FUNDAMENTO`, os dois pools em `afty-habilidades.js`. | Talentos |

### D. O bloqueio raiz: NÃO EXISTE canal de efeito do lado da CRIATURA
Nenhum efeito de habilidade ou talento está ligado, e **não é por escolha**: o único canal de
efeitos que existe (`CONTROLADOR_EFEITOS_INVOCACAO`) aplica sobre **invocações**. Tudo que as 6
especializações fazem é sobre a própria ficha. Essa é a "passada de efeitos" pendente desde as
Aptidões, e é o **pré-requisito de tudo em D**.

Quando ela existir, saem quase de graça (já estão escritos como fórmula nas seções de cada
especialização): 11 do Lutador, 10 do Conjurador, 4 do Suporte, além das do Combatente.

**Canais que ainda NÃO existem e vão precisar de desenho:**
- **CURA** — o Suporte gira em torno disso (8 habilidades). É o maior sistema novo.
- **TROCA de atributo na fórmula** (substituição, não soma), 3 consumidores:
  *Músculos Desenvolvidos* (Defesa usa Força), *Físico Controlado* (HP usa Presença/Sabedoria,
  teto +4), *Restrito pelos Céus* (Defesa usa Força ou Constituição).
- **ALMA / Integridade** — *Purificação da Alma* (Suporte 16°) restaura 50%. É a primeira do
  sistema que mexe na Alma, que multiplica todo o HP.
- **Vantagem por CONDIÇÃO nomeada** — *Alma Quieta*, *Corpo Sincronizado*, *Mente em Paz*
  (Lutador 10°), *Bastião Interior* (Conjurador 6°), *Mente Limpa* (Restringido 10°).
- **Dado de dano por FAIXA de nível** (não é soma): *Corpo Treinado* (Lutador base 1). Reusar
  `subirNiveisDano` das Invocações.
- **4 RECURSOS próprios**, um por especialização, nenhum modelado:
  Pontos de Preparo (Combatente) · Nível de Empolgação 1 a 5 (Lutador) · Pontos de Estamina
  (Restringido) · PE temporário exclusivo de Aptidão (Conjurador 12°).

**Nunca automatizável (não tentar):** estados ligáveis em combate (Brutalidade, Surto de
Adrenalina, Ataque Inconsequente...), reações e usos por PE/Estamina, e tudo que depende de
sistema inexistente (**Armas**, **Inventário**, **Feitiços**, **Perícias/TR do personagem**).

### E. Sistemas inexistentes que as 6 especializações já cobram
**Feitiços** (trava a maior parte do Conjurador) · ~~**Armas**~~ e ~~**Inventário**~~ (feitos em
2026-07-22: o catálogo existe, mas NENHUMA habilidade foi ligada a ele ainda, porque continua
valendo o bloqueio raiz D. Candidatas diretas: *Otimização de Espaço*, *Ajustes em Equipamento*,
*Dedicação em Arma*, *Técnicas de Combate*, *Corpo Arsenal*, *Manejo Superior*, e o grupo
**Pugilato** citado por um Talento) · **Arsenal Amaldiçoado** (texto nunca enviado) ·
**Perícias e TRs do personagem** (dezenas de `nota` viram
requisito real no dia que existir) · **Talentos concedidos por origem/treinamento** (o catálogo
existe, as fontes de concessão não).

---

## Contexto rápido

- App: SPA Vite + React 18, **sem backend**, estado em `localStorage`. Deploy: push na `main` → Vercel.
- **O usuário faz os commits.** Nunca rodar git commit/push.
- **Sempre parar e perguntar quando houver dúvida** (o autor pediu isso explicitamente).
- **NUNCA alterar o grimório normal (2.5.2).** Tudo do Afty vive em `src/systems/afty/`. Os arquivos
  de `src/components/` (incluindo `builder-controls.jsx`) são somente-leitura: usar sim, editar não.
- **Regra de estilo do autor: nunca usar em-dash (`—`) nem ponto-e-vírgula (`;`)** em texto visível
  ao usuário (labels, descrições, tooltips, placeholders). Vírgula, dois-pontos e parênteses são OK.
- **Texto de regra vem VERBATIM.** Quando o autor manda tabela ou texto do livro, copiar palavra por
  palavra, sem parafrasear nem resumir. Ele corrige quando eu invento.
- Rota escondida **`/Afty`** (detectada em `src/App.jsx`, sem link em menu) abre o
  `AftyCreatureBuilder` em vez do builder da 2.5.2. Storage ISOLADO (`fm_*_afty_v1`),
  tag `rulesVersion: "afty"`. Fichas Afty só aparecem em `/Afty`.
- **Não há ficha Afty salva ainda** (confirmado pelo autor em 2026-07-16), então renomear chaves de
  dado é seguro, sem migração.
- Verificação: `npx vite build` + `npx eslint src/systems/afty/`. Testes de lógica via
  `node --input-type=module` com um hook de resolução (o import extensionless quebra no node):
  ```
  node --input-type=module -e 'import {register} from "node:module";
  register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
  const {deriveAfty}=await import("./src/systems/afty/afty-derive.js"); ...'
  ```
- ⚠️ Não dá para testar render no navegador aqui. O build valida imports/JSX e a lógica é coberta por
  asserts. O teste visual real é no deploy, então o autor revisa a aparência por screenshot.

---

## Arquivos (src/systems/afty/)

- `AftyCreatureBuilder.jsx` o builder tabulado. Abas: Identidade, Informações, Habilidades,
  **Especializações**, **Aptidões**, Inventário, **Interlúdios**,
  Cálculos. Visual igual ao builder 2.5.2 (slate + roxo, dark, reusa
  `../../components/builder-controls`). Ainda em `STUBS`: Habilidades, Inventário.
- `afty-habilidades.js` catálogo das Habilidades de Especialização (só Combatente por ora: 7 Base
  + 8 de 2° nível) + `ESTILOS_DE_COMBATE` + resolvers (`totalHabilidades`, `avaliarAcessoHabilidade`,
  `escolhasConcedidas`, `resolveHabilidades`, `validarCatalogoHabilidades`).
- `afty-especializacoes.js` catálogo das 6 Especializações + resolvers (`especializacoesDisponiveis`,
  `maxEspecializacoes`, `especializacaoObrigatoria`, `tipoObrigatorio`, `normalizeEspecializacoes`,
  `resolveEspecializacoes`, `validarCatalogoEspecializacoes`). **Texto do livro pendente.**
- `afty-derive.js` motor de cálculo por FÓRMULA (ND 1→∞, sem tabela). Adiados: Guarda e Perícias.
- `afty-treinamentos.js` catálogo dos 12 Treinamentos (Interlúdios) + resolvers.
- `afty-aptidoes.js` (~1600 linhas) catálogo COMPLETO das 85 Aptidões Amaldiçoadas + trilhas,
  categorias, sub-grupos, `avaliarRequisitoAptidao`, `resolveNiveisAptidao`,
  `validarCatalogoAptidoes`. **É o arquivo mais maduro do sistema: use de modelo.**
- `afty-alto-nivel.js` catálogo de **nível 21+**: 11 Melhorias Superiores, 16 Habilidades Lendárias
  e 6 Habilidades Ápice + resolvers (`totalMelhoriasSuperiores`, `totalHabilidadesLendarias`,
  `altoNivelAtivo`, `avaliarRequisitoAltoNivel`, `avaliarAcessoAltoNivel`, `resolveAltoNivel`,
  `validarCatalogoAltoNivel`). Validador zerado.
- `afty-equipamentos.js` catálogo do capítulo de Equipamentos (armas, propriedades, traços
  especiais, uniformes, escudos, itens especiais) + resolvers (`grauFeiticeiro`,
  `resolveEquipamentos`, `resolveCarga`, `orcamentoDoGrau`, `validarCatalogoEquipamentos`).
  Regras de sistema em `docs/afty-equipamentos.md`.
- `afty-schema.js` `createBlankAfty()` + constantes (tipos, patamares, tamanhos).
- `afty-atributos.js` regras de atributo (métodos, point-buy, valores fixos, rolagem, pool de nível,
  Desenvolvimento, validação `resumoAtributos`).
- `afty-origens.js` catálogo de origens + resolvers (`resolveOrigemAttrBonus`, `resolveDesenvolvimento`).
- `afty-anatomias.js` catálogo das 15 Características de Anatomia (Feto).
- `creature-schema.js` documento-spec anotado (referência).

---

## Cálculo: decisões recentes (IMPORTANTE, mudaram em 2026-07-16)

### Patamar renomeado
O patamar mais alto era "Maldição" e agora é **Beyond**, no rótulo E na chave interna
(`value: "beyond"`). Não sobrou nenhum `maldicao` no código. As fórmulas transcritas em
`afty-formulas-base.md` ainda dizem "Maldição" porque são cópia literal da planilha do autor.

Patamares: **Comum, Desafio, Calamidade, Beyond** (não existe Lacaio no Afty).

### HP: o `×2` da planilha foi absorvido
A planilha fazia `(base) × 2 × patamarMult{comum 1, desafio 1, calamidade 1,5, beyond 2}`, ou seja,
um efetivo de **2/2/3/4** sobre a base, com o Comum empatado com o Desafio. O `×2` era, na prática,
o multiplicador do Desafio. Foi absorvido no multiplicador:

```
HP = round( almaMult × (hpBase + ND·modCon + treino.hp) × HP_PATAMAR_MULT[patamar] )
HP_PATAMAR_MULT = { comum: 1, desafio: 2, calamidade: 3, beyond: 4 }
```

Só o **Comum** mudou de valor (caiu pela metade). Desafio, Calamidade e Beyond seguem idênticos ao
que sempre foram. Como `treino.hp` está dentro do parêntese, ele escala junto: Resistência 1ª
(+4 na base) dá +4 no Comum, +8 no Desafio, +12 na Calamidade, +16 no Beyond.

### Resistência Parcial (regra nova, substituiu a "gambiarra")
| Patamar | Ganha +1 em | Faixa |
|---|---|---|
| Comum | (nada) | 0 |
| Desafio | (nada) | 0 |
| Calamidade | ND 10, 20, 30 | 0 a 3 |
| Beyond | ND 1, 10, 20, 30 | 1 a 4 |

Como `nd` tem piso 1, o limiar de ND 1 do Beyond é constante no código.

### Maestria continua "Maestria"
No livro, Maestria == Treinamento (mesmo valor). O autor cogitou renomear para "Treinamento" e
**decidiu manter Maestria** (2026-07-16), porque Interlúdios já usa `treinamentos` (estado da ficha),
`treino` (efeitos agregados) e "Treino de X" (as 12 trilhas). Um quarto "Treinamento" colidiria.

---

## Sistema de ATRIBUTOS (pronto e polido)

- 6 atributos: Força, Destreza, Constituição, Inteligência, Sabedoria, **Presença** (não Carisma).
  Valores 0 a 30. **Limite POR ATRIBUTO** (default 20, elevável a 30 por poderes).
- **3 métodos** (o GM escolhe): Compra por Pontos (17 pts, faixa 8 a 15), Valores Fixos
  (15,14,13,12,10,8, dropdown com TROCA, sem travar), Rolagem (4d6 dropa menor). "Nível" == ND.
- **Pontos de nível**: a cada 4 ND, pool separado, 1:1, teto = limite base. A quantidade por ciclo
  depende do **Patamar**: Comum/Desafio = 2, Calamidade/Beyond = 3
  (`floor(ND/4) * ATTR_POR_CICLO`, em `afty-atributos.js`). Bate com a planilha (Total.Atributos).
- **Atributo efetivo = base + nível + Desenvolvimento + bônus de origem** (teto 30). Exposto em
  `derived.attrEff`, `derived.mods`, `derived.attrLimiteEfetivo`, `derived.attrDesenv`, `derived.attrBonus`.
- Aba de Atributos = tabela compacta (Atributo, Base, Nível, Efetivo, Limite).

### Regras de bônus de atributo (IMPORTANTES)
- Bônus de origem é **efetivo e grátis** (soma no valor, não gasta orçamento).
- Bônus de origem **NÃO passa o limite**, salvo os que disserem explicitamente (TODO no motor).
- Se o bônus de origem passaria do limite, os **pontos de Nível são DEVOLVIDOS ao pool** (a origem
  tem prioridade). Ver `setOrigemBonus` no builder + `nivMax` que reserva espaço pro bônus.
- **Desenvolvimento Inesperado** (Derivado): pool `floor(ND/4)`, cada ponto dá **+1 no valor E +1 no
  limite** do atributo escolhido. É a exceção que passa de 20.

---

## ORIGENS

Conteúdo em `afty-origens.js`. Bônus de Atributo tem 2 formatos, ambos em `core.origem.bonusAtributos`:
- **escolhaDoJogador** `{pontos:[2,1]}` → seletores "+2 em / +1 em" (Inato, Derivado, Feto).
- **distribuir** `{distribuir:N, maxPorAtributo:M}` → alocador (Sem Técnica: 4, máx 3).

Grants que ligam quando os catálogos existirem: `talento`, `feitico`, `aptidao_amaldicoada`,
`pericia_treinada` (selos âmbar via `grantLabel`).

| Origem | Status | Notas |
|---|---|---|
| **Inato** | ✅ feito | +2/+1, Talento Natural (grants), Marca Registrada (Feitiço −1 PE) |
| **Derivado** | ✅ feito | +2/+1, Energia Antinatural, **Desenvolvimento Inesperado** (mecânica fiada) |
| **Sem Técnica** | ✅ feito | Bônus = distribuir 4 (máx 3), restrições, Estudos Dedicados, **Empenho Implacável tem CONTINUAÇÃO** (lembrete roxo, completar na aba Habilidades, progressão dos 9 níveis em `niveis:[]`) |
| **Feto Amaldiçoado Híbrido** | ✅ feito | +2/+1, **Físico Amaldiçoado = seletor de anatomia** (pool 1 + 1/5 níveis, 15 anatomias) |
| **Herdado** | ⬜ pendente | catálogo vazio |
| **Corpo Amaldiçoado Mutante** | ⬜ pendente | catálogo vazio |
| **Restringido** | 🟨 parcial | texto vazio, mas o **vínculo com a Especialização já está ligado**: `especializacaoExclusivaId: "restringido"`, força o Tipo e proíbe multiclasse (ver Especializações) |
| **Maldição** | ⬜ pendente | catálogo vazio. Destrava a categoria **Aptidões de Maldição** (`origemId: "maldicao"` em `afty-aptidoes.js`) |

⚠️ O autor sinalizou que essas 3 origens que faltam são **mais complexas e dependem de outras partes**
do sistema, por isso pulou para Interlúdios.

---

## INTERLÚDIOS (aba pronta, catálogo COMPLETO)

`TabInterludios` é um container. Seções:
1. **Treinamento** (funcional): as 12 trilhas do catálogo.
2. **Estudos** e **Treinamento para Habilidade**: cards informativos recolhíveis, dependem de
   Perícias/Especializações. Regra do autor: para criaturas, qualquer interlúdio que peça teste é
   **sucesso automático**.

### Modelo
- Cada linha tem **4 etapas sequenciais** + **Completo** automático ao concluir a 4ª.
- Etapa custa **Foco(s)**: 1/1/1/2, então linha inteira = 5 Focos.
- **Focos Totais = ND + Outros**, onde "Outros" = bônus de poderes que darão treinos (sistema
  futuro), lido de `creature.focosBonus` (0 por ora). Derivado em `derived.focosTotais`.
  A aba mostra Gastos / Totais no cabeçalho do card (vermelho se estourar).
- Estado na ficha (`creature.treinamentos`), shape MISTO:
  - linha normal: `{ [linhaId]: progresso 0..4 }`
  - linha repetível: `{ [linhaId]: [{ alvo, progresso 1..4 }] }`
  - `normalizeTreinamentos`, `resolveTreinoEfeitos` e `focosGastos` tratam os dois e somam por instância.

### As 12 trilhas (ordem fixa, Perícia sempre por último)
Agilidade, Barreiras, Compreensão, Controle de Energia, Domínios, Energia Reversa, Luta,
Potencial Físico, Resistência, **Manejo de Arma, Atributo, Perícia** (as 3 repetíveis no fim).

### Repetíveis
**Manejo de Arma, Atributo e Perícia** podem ser pegas várias vezes, **uma por alvo distinto**
(não repete o mesmo alvo). Escolha do alvo:
- `alvoTipo: "atributo"` → dropdown dos 6 atributos (Treino de Atributo).
- `alvoTipo: "texto"` → campo livre (Perícia e Arma, porque esses catálogos não existem).

Com 0 instâncias a linha mostra um chip "Repetível" e uma **prévia consultável** das etapas +
Completo em modo `readOnly` (sem botões), para ler a regra sem ativar.

### Efeitos que o motor consome
`resolveTreinoEfeitos` agrega `{ hp, pe, movimento, aptidao, atributo, defesa, aptidaoTrilha }` e
`deriveAfty` soma em HP, PE, Movimento, Defesa e no orçamento de Aptidão. O canal **`atributo`
agrega mas NÃO é consumido** (o motor de atributos usa point-buy + pool de nível).
**`aptidaoTrilha`** são as concessões direcionadas de nível de aptidão (ver seção APTIDÕES).

### Requisitos
- `atributo` (ex. Destreza 14), `atributoOr` (Força ou Destreza 14), `nd` (Nível de Personagem 4):
  **validados, bloqueiam** a etapa.
- `nota` (aptidão/técnica de sistema futuro): só exibe como lembrete roxo, não bloqueia.
- Chip roxo com ✓ quando atendido, cadeado quando falta ou não é validável. Sem contagem de "falta N".

### Pendências dos Treinamentos
- **Aplicação direcionada** do Treino de Atributo (+1 no atributo escolhido, +2 no limite dele no
  Completo) espera o sistema de atributos. Hoje a escolha funciona, o efeito não é aplicado.
- Bônus de **perícia/arma específica** são texto, esperam esses sistemas.

---

## APTIDÕES (aba funcional, catálogo COMPLETO: 85 aptidões)

`TabAptidoes` tem 2 cards: **Níveis de Aptidão** e **Aptidões Amaldiçoadas**, ambos funcionais.
**As 7 categorias foram transcritas** (2026-07-16), validador zerado:

| Categoria | Qtd |
|---|---|
| Aura | 27 |
| Controle e Leitura | 17 |
| Barreira | 5 |
| Domínio | 6 |
| Energia Reversa | 7 |
| Especiais | 5 |
| Maldição | 18 (em 3 sub-grupos) |

**Falta ligar os EFEITOS** (ver seção própria abaixo). Hoje o catálogo só trava requisito.

### Sub-grupos (só Maldição usa)
O livro divide as exclusivas de maldição em **Anatomia (9)**, **Controle e Leitura (4)** e
**Especiais (5)**, com resumo próprio. Modelado com o campo `subcategoria` na aptidão +
`APTIDAO_SUBCATEGORIAS` + `subgruposDaCategoria(catId)`, que devolve `null` para categoria plana
(a UI então lista direto, sem cabeçalho).

⚠ **Ids de Maldição levam prefixo `mal_`**. Os nomes repetem os da lista padrão DE PROPÓSITO
("Absorção Elemental" existe em Aura e em Maldição, com textos diferentes), e os sub-grupos
repetem nomes de categorias de topo. O prefixo mantém id único sem mexer no nome do livro.
O validador aceita nome repetido ENTRE categorias e acusa nome repetido DENTRO de uma.

### ✅ O livro confirmou a troca de aba de Maldição
"Uma maldição também pode escolher aptidões amaldiçoadas da lista padrão, **exceto pelas
aptidões de energia reversa**." É exatamente o que `abasAptidao` faz.

### ✅ Texto do livro CONFIRMOU o motor (2026-07-16)
O autor enviou a seção "NÍVEIS DE APTIDÃO", que bate com o que já estava implementado:
- "Em todo nível par (2,4,...,20)... Nos níveis 10 e 20... um nível adicional" == o
  `aptidaoThresholds` do motor, exatamente. O texto **para no 20**, então ND 30 dá os mesmos 12.
- "Todas as aptidões variam do nível 0 até nível 5" == `APTIDAO_NIVEL_MAX`.
- "aumentado através de treinamentos, habilidades, **talentos** ou outras formas" → **Talentos
  são uma 4ª fonte de concessão** (além de Treinamento, Habilidades e Origens).
- As siglas do livro (AU, CL, BAR, DOM, ER) são as chaves usadas no schema. "com BAR 3" no texto
  de uma aptidão == requisito `{tipo:"trilha", trilha:"bar", valor:3}`.

### ⚠️ DOIS orçamentos separados (não confundir)
| | Fórmula | Teto | Onde |
|---|---|---|---|
| **Níveis de Aptidão** (sobe trilha) | limiares de ND pares + Raio Negro + treino livre | **para no ND 20** | `derived.totalAptidao` |
| **Aptidões Amaldiçoadas** (quantas pode ter) | `1 + floor(ND/3)` | **sem teto** | `derived.totalAptidoesAmaldicoadas` |

A regra da quantidade (autor, 2026-07-16): **1 no ND 1, mais 1 a cada 3 ND** (3, 6, 9, 12, 15,
18, 21, 24, 27, 30 "e por aí vai"). ND 30 → 11 aptidões, ND 60 → 21. Isso **corrigiu** o que
estava aqui antes: eu tinha registrado que aptidão não tinha orçamento e era limitada só pelo
requisito. Tem orçamento sim, é só um orçamento **diferente** do de níveis.

⚠ **Em aberto**: a origem Derivado concede "uma Aptidão Amaldiçoada de Aura"
(`grants` em `afty-origens.js`). Essa concessão **gasta** o orçamento de aptidões ou é grátis,
como as concessões de nível direcionadas? Não implementado (o seletor de grants de origem não
existe). Confirmar quando for ligar.

### ⚠️ PASSADA DE EFEITOS (adiada de propósito, decisão do autor 2026-07-16)
Hoje o catálogo de aptidões só é lido para **travar requisito**. Nenhuma aptidão escolhida
alimenta `deriveAfty`. O autor decidiu ligar os efeitos **numa passada só, depois que o
catálogo fechar** (faltam Domínio e Maldição), em vez de caso a caso.

O modelo `efeitos` dos Treinamentos (`{tipo, valor}` fixo) **não basta**: várias aptidões
escalam com ND ou com o nível da trilha. Vai precisar de valor computado, não constante.

Efeitos calculáveis já identificados (a lista cresce conforme transcreve):

| Aptidão | Efeito | Canal |
|---|---|---|
| **Raio Negro** | +ND de PE **e** +1 na trilha `au` (direcionado) | pe + aptidaoTrilha |
| **Aura Reforçada** | RD físico = 2 × AU (base numérica de outras 2) | rd |
| **Aura Maciça** | Defesa += AU | defesa |
| **Estoque Ampliado** (mal) | PE += maestria | pe |
| **Revestimento** (mal) | RD físico = maestria | rd |
| **Revestimento Evoluído** (mal) | RD físico = mod Constituição (substitui o de cima) | rd |
| **Crescimento Corporal** (mal) | +1 categoria de tamanho, +1 HP por nível | tamanho + hp |
| **Olhos Adicionais** (mal) | Atenção usa base **12** no lugar de 10 | atencao |

⚠ **Olhos Adicionais quebra uma constante do motor**: `atencao = 10 + Percepção` em
`afty-derive.js` tem o 10 hardcoded. Vai virar variável.

**Raio Negro × Qnt.PE (RESOLVIDO):** a planilha rotulava a célula do `Qnt.PE = Muito Grande`
de "Raio Negro", o que sugeria proxy. O autor confirmou que são **efeitos separados que
somam**: Qnt.PE Muito Grande dá +1 no ORÇAMENTO e **não** dá nível de Aura, e Raio Negro dá
+ND de PE e +1 direcionado em Aura. O `+1` do Qnt.PE em `afty-derive.js` **fica como está**
(só o comentário enganoso foi corrigido).

### Modelo (confirmado pelo autor em 2026-07-16)
- **5 trilhas** de Nível de Aptidão: Aura (`au`), Controle e Leitura (`cl`), Barreiras (`bar`),
  Domínio (`dom`), **Energia Reversa (`er`)**. A `er` foi ADICIONADA ao schema neste passo (o
  Treino de Energia Reversa já citava "Nível de Aptidão em Energia Reversa" e a trilha não existia).
- **Teto de 5 por trilha** (`APTIDAO_NIVEL_MAX`).
- **Orçamento de níveis**: `derived.totalAptidao` = limiares de ND + Raio Negro (PE Muito Grande)
  + concessões de treino **"à sua escolha"**. **Cada ponto sobe 1 nível numa trilha, 1:1.**
  As Aptidões Amaldiçoadas **não gastam este orçamento** (têm o seu próprio, ver acima): o nível
  da trilha é o que as DESBLOQUEIA. Card mostra Gastos / Totais (vermelho se estourar).

### Nível efetivo = alocado + concedido (decisão do autor, 2026-07-16)
O autor sinalizou que **Treinamento, Habilidades de Especialização e Origens também dão Nível
de Aptidão**. Isso expôs um bug: as 4 concessões de treino iam todas para o ORÇAMENTO, então
dava para pegar Treino de Barreiras e gastar o ponto em Domínio. O texto de 3 delas nomeia a
trilha. Agora há **dois canais** de efeito de aptidão (em `resolveTreinoEfeitos`):

| Efeito | Significado | Vai para |
|---|---|---|
| `{tipo:"aptidao", trilha:"bar", valor:1}` | regra NOMEIA a trilha | `treino.aptidaoTrilha.bar`, grátis, fora do orçamento |
| `{tipo:"aptidao", valor:1}` (sem trilha) | "à sua escolha" | `treino.aptidao` → orçamento |

Direcionadas hoje: Barreiras 2ª (`bar`), Controle de Energia 4ª (`cl`), Energia Reversa 2ª (`er`).
Livre: Compreensão Completo. Mesmo padrão do bônus de atributo de origem (efetivo e grátis).

- `resolveNiveisAptidao(aptidoes, concedido)` (em `afty-aptidoes.js`) devolve
  `{ alocado, concedido, efetivo, gastos }`. Exposto em **`derived.aptidao`**, e a aba só exibe.
- **Teto de 5 vale para o TOTAL.** Se alocado 5 + concedido 1, o alocado é aparado para 4 e o
  ponto **volta ao orçamento** (a concessão tem prioridade, igual aos atributos).
- O aparo é **na leitura, não gravado**: se o treino for desfeito, o nível comprado reaparece.
- ⚠ **TODO no motor**: quando Habilidades de Especialização, Origens e **Talentos** existirem,
  somar as concessões deles em `resolveNiveisAptidao` (hoje só `treino.aptidaoTrilha` entra).
  Marcado em `afty-derive.js`.

### UI da aba
- As 5 trilhas num grid **horizontal** (`xl:grid-cols-5` numa fileira, 3 no `lg`, 2 no celular).
  O seletor é segmentado 0..5 com botões `flex-1` (fluido, sem largura fixa) em vez de
  `NumberInput` (que é 36px de altura e some 200px de vertical com 5 trilhas empilhadas).
- Botões = nível **EFETIVO**, preenchendo 1..N como medidor (nível é magnitude, não categoria).
  Roxo = alocado, **verde = concedido** (travado, é piso), apagado = vazio ou sem orçamento.
- **Aptidões recolhidas por padrão** (só nome + chips de requisito, ~36px por linha). São 20 em
  Aura e cada descrição é um parágrafo do livro: abertas de uma vez davam ~2200px de paredão.
  Abre sob demanda e **sem clamp** (quem abriu quer ler a regra inteira).
- Os 3 badges de cabeçalho (Focos, Níveis, Aptidões) usam o MESMO chrome. As abas de categoria
  copiam o estilo da barra de abas do topo da ficha (pílula roxa, `text-sm`, scroll horizontal).
- Estourar o orçamento **não bloqueia** a escolha, só fica vermelho (padrão dos Interlúdios).
  O alocador de níveis, esse sim, desabilita o que não cabe.
- **7 categorias**: as 5 trilhas + **Aptidões Especiais** (não seguem trilha: Raio Negro, Domínio
  Simples, Técnica Máxima) + **Aptidões de Maldição** (exclusivas da origem Maldição).
  ⚠ "Especiais" era "Gerais" até 2026-07-16 (renomeado no rótulo E no id, `especiais`).
  Especiais não TÊM trilha, mas PEDEM trilha como requisito (Raio Negro pede CL 3, Domínio
  Simples pede BAR 1, Abençoado pelas Faíscas Negras pede CL 4 **e** AU 3).
- `APTIDAO_TRILHAS` é DERIVADO de `APTIDAO_CATEGORIAS` (fonte única, sem lista duplicada).

### Abas de categoria (decisão do autor, 2026-07-16)
O card de Aptidões Amaldiçoadas é **tabulado por categoria**. `abasAptidao(creature)` resolve
a ordem, e **Maldição OCUPA O LUGAR de Energia Reversa** (não se soma a ela):

| Origem | Abas |
|---|---|
| qualquer outra | Aura · Controle e Leitura · Barreira · Domínio · **Energia Reversa** · Gerais |
| **Maldição** | Aura · Controle e Leitura · Barreira · Domínio · **Maldição** · Gerais |

As duas nunca coexistem, e Gerais fica sempre no fim. Faz sentido de lore: energia reversa é
o que destrói maldições. `categoriaDisponivel` foi REMOVIDA (as abas já resolvem o acesso, a
categoria travada com cadeado virou código morto).

### ⚠️ Origem MALDIÇÃO não existe ainda
O autor confirmou que **Maldição é uma 8ª origem que falta catalogar** em `afty-origens.js`
(não é o patamar Beyond, que era o nome antigo). Enquanto ela não existir, a aba Maldição é
inalcançável (nenhuma ficha pode ter `core.origem.id === "maldicao"`) e Energia Reversa aparece
sempre. As origens pendentes agora são **4**: Herdado, Corpo Amaldiçoado Mutante, Restringido
e **Maldição**.

⚠️ **Em aberto**: a trilha **ER continua nos Níveis de Aptidão** mesmo na origem Maldição. Se
uma maldição não usa energia reversa, talvez a trilha devesse sumir junto com a aba. O autor
só pediu a troca da aba, então não mexi no card de níveis. Confirmar.

### Catálogo: 27 de Aura transcritas, faltam 6 categorias
O autor mandou **Aptidões de Aura** (27, verbatim, 2026-07-16, em 2 levas). **NÃO usar as
aptidões da 2.5.2** (`src/components/fm-aptidoes.js`) como base: ele confirmou que são outras, e
de fato "Aura de Restrição"/"Aura do General"/"Aura de Rompimento"/"Aura Nefasta" viraram "Aura
de Contenção"/"Aura do Comandante"/"Aura Lacerante"/"Aura Macabra", todas com números diferentes.

**Ordem do catálogo = ordem que o autor mandou, NÃO alfabética.** É proposital: o livro agrupa
cadeias (Aura Elemental → Aura Elemental Reforçada → Absorção Elemental). A UI renderiza na
ordem do array, então ordenar alfabeticamente quebraria esse agrupamento.

O texto pode conter em-dash e ponto-e-vírgula (ex. Aura Reforçada: "danos físicos — cortes,
perfurações e impactos —"). É VERBATIM do livro: a regra de estilo do autor vale para texto que
EU escrevo (labels, avisos), não para a transcrição dele.

Faltam: **Controle e Leitura, Barreira, Domínio, Energia Reversa, Gerais e Maldição.**

Os `[Pré-Requisito: ...]` foram extraídos da descrição para `requisitos` estruturado (padrão dos
Treinamentos). Tipos de requisito em `avaliarRequisitoAptidao`:

| Tipo | Exemplo no livro | Bloqueia? |
|---|---|---|
| `atributo` | "Presença 18" | ✅ |
| `atributoOr` | "Força ou Constituição 16" | ✅ |
| `nd` | "Nível 6" (Nível == ND) | ✅ |
| `trilha` | "Nível de Aptidão em Aura 2" | ✅ |
| `aptidao` | "Aura do Comandante" | ✅ se transcrita, senão exibe e não bloqueia |
| `nota` | "Treinado em Furtividade" (perícias não existem) | ❌ só exibe |

### ✅ Validador ZERADO (2026-07-16)
`validarCatalogoAptidoes()` (validador de conteúdo do roadmap: ids únicos + pré-requisitos
apontando para coisas existentes) acusou 3 referências quebradas na 1ª rodada. O autor mandou as
2 aptidões que faltavam (**Aura Reforçada** e **Aura Impenetrável**) e o validador **zerou**.
Rodar sempre que transcrever conteúdo novo.

**Aura Reforçada** é a base numérica de outras duas: "RD igual a redução de Aura Reforçada" em
*Aura Elemental Reforçada* e *Aura Excessiva* = **2 × Nível de Aptidão em Aura**.

Cadeia de Aura mais longa: Aura Reforçada → Aura Impenetrável (AU 3, ND 10) → Casulo de
Energia (AU 5, ND 16).

⚠ **Referência solta ainda em aberto**: *Aura Movediça* cita **"Expandir Aura"** no texto ("não
pode ser aumentada por Expandir Aura"), que não existe em nenhuma categoria transcrita. Como é
prosa e não pré-requisito, o validador NÃO pega. Provavelmente é Aptidão Geral ou ação. Conferir
quando as Gerais chegarem.

### Oportunidade destravada
`avaliarRequisitoAptidao` tem o tipo `trilha`, que é **verificável**. Vários requisitos dos
Treinamentos hoje são `{tipo:"nota"}` só porque as trilhas não existiam (ex. "Nível de Aptidão
em Barreiras 2" em `afty-treinamentos.js`). Agora dá para promovê-los a requisito real que
bloqueia. Não foi feito neste passo (mudaria o comportamento dos Interlúdios), mas é barato.

---

## ⚠️ DIVERGÊNCIAS planilha × tabelas (aguardando confirmação do autor)

O autor mandou as tabelas dos treinos, que em 3 pontos contradizem a planilha transcrita em
`afty-formulas-base.md`. **Segui as TABELAS nos três** (fonte mais recente e explícita):

| Treino | Planilha dizia | Tabela diz | Código faz |
|---|---|---|---|
| Compreensão 1ª | +1 PE | **+2 PE** | tabela |
| Compreensão 3ª | +2 PE | **+3 PE** | tabela |
| Compreensão 2ª | +1 Aptidão | **bônus de perícia** (sem Aptidão) | tabela |
| Luta 2ª | +3 Defesa | **+2 Defesa** | tabela |
| Resistência 2ª | +5 HP | **dados de vida por descanso** (sem HP máx) | tabela |

A planilha pode estar desatualizada. Confirmar quando der.

---

## SISTEMAS AINDA NÃO CONSTRUÍDOS

- **Talentos** (poderes gerais, base de Habilidades/Especializações).
- **Feitiços** (Técnica Inata = Ações/Características, aba Habilidades, "por último").
- **Perícias** (destrava Atenção, que hoje usa Percepção = 0).
- **Habilidades de Especialização** (a Especialização em si está pronta, faltando só o texto).
- ~~**Armas / Inventário**~~ **FEITO em 2026-07-22**, ver `docs/afty-equipamentos.md`. A aba
  Inventário virou **Equipamentos** e é real: 52 armas, 48 itens especiais, 4 modificações de
  uniforme, 4 escudos, carga e sobrecarga. O campo manual "Grau de Item Equipado" foi REMOVIDO
  junto com `GRAU_DEFESA`/`GRAU_RD` e o "Grau Zero". Falta o capítulo de **Ferramentas
  Amaldiçoadas** (encantar arma, subir de grau), que traz o Grau de Equipamento.
- **Efeitos das 15 anatomias** (RD, ataques, tamanho, movimento, condições).
- Motor: **Guarda** (CU9 = contador de ataques consecutivos), `derived.guarda = null` por ora.
- **Tela de jogo/combate** (rastrear HP/PE/Alma + Resistência Parcial/Guarda).

---

## 🎯 TRABALHO ATUAL: aba de ESPECIALIZAÇÕES (estrutura pronta, falta o TEXTO)

A aba é **funcional** desde 2026-07-17: escolhe, multiclassa, divide níveis e trava por origem.
O que falta é **conteúdo**: `resumo` e `descricao` das 6 estão `""` esperando o texto do livro.
O autor manda VERBATIM. Não inventar, não usar a 2.5.2 como base.

### As 6 Especializações (autor, 2026-07-17)
**Lutador · Combatente · Conjurador · Suporte · Controlador · Restringido**
(ordem do array = ordem que ele mandou, NÃO alfabética, mesma convenção das Aptidões)

**Quando o texto chegar** (decisão do autor, 2026-07-17): descrição **recolhida, abre sob
demanda** — o padrão das Aptidões (linha de ~36px, clica e abre o texto inteiro sem clamp).
Motivo: deixa comparar as 6 antes de escolher. Vai como uma lista abaixo dos chips, do mesmo
jeito que a aba de Aptidões tem o alocador de trilhas EM CIMA e a lista de leitura EMBAIXO.
Não foi feito agora porque seriam 6 linhas vazias.

### ⚠️ COLISÃO DE NOMES com os Tipos — PROPOSITAL
`AFTY_TIPOS` (Combatente/Misto/Conjurador/Restringido) e as Especializações **compartilham 3
nomes** e querem dizer coisas diferentes. O autor confirmou que é de propósito e que os eixos são
**INDEPENDENTES**: Tipo Conjurador + Especialização Combatente é ficha legal. Os catálogos vivem em
arquivos separados, então os ids não colidem de verdade. **Não assuma** que `core.tipo` diz nada
sobre a Especialização (nem o contrário).

### Regras confirmadas (autor, 2026-07-17)
| Pergunta | Resposta |
|---|---|
| Tipo × Especialização | **Independentes.** O Tipo segue escolha manual e dirige fórmula, a Espec só destrava Habilidade |
| Nível da Especialização | **== ND.** `soma(niveis) === ND`, a multiclasse divide o próprio ND |
| Multiclasse | **Até 2, firme** |
| Origem Restringido | força o **TIPO** Restringido **E** a Especialização Restringido, e **proíbe multiclasse** |
| Espec Restringido | **exclusiva** da Origem Restringido (trava nos DOIS sentidos) |

A trava da Origem Restringido é o **ÚNICO** ponto onde os eixos Tipo e Especialização se tocam.
É uma trava de ORIGEM, não uma relação Tipo × Especialização. Não generalize.

### 💡 A ficha guarda o PONTO DE DIVISÃO, não os níveis
Decisão de desenho (2026-07-17). Como `soma(niveis) === ND` é regra dura, uma ficha com 2
especializações tem **um grau de liberdade só**: escolhido o nível da 1ª, o da 2ª é o resto. Com 1
especialização não há escolha nenhuma (o nível é o ND inteiro).

Então `resolveEspecializacoes` **ignora o nível gravado da 2ª** e o deriva. É por isso que os dois
`±` da UI editam o mesmo valor por lados opostos: subir uma classe baixa a outra. Consequências:
- **O estado ilegal deixa de existir.** Não há "soma não bate" para validar: mexer no ND depois
  reflui sozinho na 2ª. Por isso `resolveEspecializacoes` não tem `alocado`/`restante`, e o único
  `erro` possível é `"nenhuma"` (nenhuma escolhida).
- O aparo é **de leitura, não gravado** (mesma convenção de `resolveNiveisAptidao`): baixar o ND
  para 1 e voltar para 20 traz a divisão original de volta.
- Nível mínimo 1 por especialização, então **só cabe multiclasse a partir do ND 2**.
- Shape final: **`[{ id, nivel }]`**. O `nome` do placeholder antigo foi DESCARTADO de propósito
  (o catálogo é a fonte da verdade, gravar o rótulo faria errata de nome deixar ficha mentindo).

### Onde está
- `afty-especializacoes.js` catálogo + resolvers + validador (zerado).
- `derived.especializacoes` = `{ escolhidas, total, max, obrigatoria, completa, erro }`.
  **Não alimenta stat nenhum** (coberto por assert: derivar com e sem espec dá stats idênticos).
- `TabEspecializacoes` no builder. **Desenho APROVADO na 4ª rodada (2026-07-17)**, depois de um
  checkup de UX pedido pelo autor. Ver a seção 🎨 abaixo antes de mexer.
- `setOrigemId` (novo handler): trocar a origem força o Tipo e passa as Especializações pelo
  filtro da origem nova. **O `<Select>` de Origem agora chama `setOrigemId`, não `patchCore`.**
- O `<Select>` de Tipo em `TabInformacoes` fica `disabled` na Origem Restringido.

### 🎨 CHECKUP DE UX (2026-07-17) — a linguagem visual do builder Afty

Levou **3 rodadas** de crítica ("feia e enorme" → "ocupando muito espaço" → "ainda estranho") até
o autor pedir um checkup. As abas que ele aprova são **Aptidões, Interlúdios e Atributos**, e elas
compartilham um vocabulário. Isto vale para QUALQUER aba nova, não só esta:

1. **As opções ficam todas à mostra.** Nenhuma aba aprovada usa dropdown para a escolha
   principal: Aptidões mostra as 5 trilhas, Atributos os 6 atributos, Interlúdios as 12.
   Conjunto pequeno e enumerável = tudo na tela.
2. **Magnitude é MEDIDOR, não campo numérico.** `NivelPicker` preenche 1..N como gauge,
   `ProgressoSegmentos` são pílulas preenchidas. Nada de `NumberInput` para grandeza.
3. **Cresce na HORIZONTAL.** `grow`/`flex-1` numa fileira, reempilhando sozinho no celular.
4. **Nada de widget estrangeiro.** Se o controle não existe em outra aba, ele vai parecer
   estranho mesmo estando compacto. Foi exatamente o que aconteceu com o `<input type="range">`:
   resolveu o espaço e continuou errado.

**Desenho atual (APROVADO, "ficou EXCELENTE"): chips com ± inline.** A aba inteira é UMA fileira.
As 6 são chips (a mesma pílula roxa das abas de categoria de Aptidões, com `aria-pressed`), e na
multiclasse o nível vive DENTRO do chip com `−` e `+` colados. É o formato que o próprio autor já
tinha decidido no roadmap (2026-07-14) para a banda de níveis: *"Punho 12 / Véu 8 com ± inline"*.

- Com **uma** classe: chip mostra o nome + o ND, sem `±` (não há o que dividir).
- Com **duas**: os dois `±` editam o MESMO ponto de divisão por lados opostos (subir uma baixa a
  outra), daí o `slot === 0 ? +delta : -delta` em `ajustar`.
- O chip ativo em multiclasse é uma **`<div>`, não um `<button>`**: o nome e os `±` são alvos
  separados, e `<button>` dentro de `<button>` é HTML inválido. `chipBase` mantém a silhueta
  idêntica à do chip-botão para os dois conviverem na fileira.
- **Sem rodapé explicativo.** As linhas "O nível é o próprio ND (N)..." foram removidas a pedido
  do autor. Só sobra o aviso da Origem Restringido.

⚠️ **Já tentados e REJEITADOS aqui** (não reintroduzir achando que melhora):
`<Select>` para escolher a classe (esconde as 6) · `NumberInput` (36px + rótulo, toma a linha) ·
dois campos de nível independentes · stepper compacto em linha própria · cartão separado só para a
divisão · `<input type="range">` (widget que não existe em nenhum outro lugar do app) ·
**barra proporcional arrastável** (`DivisaoBar`, chegou a ser implementada e aprovada de relance,
mas o autor mandou remover na rodada seguinte) · badge "1 / 2" no `headerRight` (ruído: não há
orçamento a estourar aqui) · `FieldLabel` por campo · card com borda por slot · 2º slot vazio à
mostra (fazia a multiclasse **parecer obrigatória**, e ela é opcional) · rodapé explicando a regra
do ND.

### Perguntas ainda em aberto
- **Banda de níveis no cabeçalho**: o autor decidiu (roadmap, 2026-07-14) que a distribuição fica
  **sempre visível no cabeçalho, ajustável de qualquer aba** ("Punho 12 / Véu 8" com ± inline).
  **NÃO implementado**: hoje a divisão só se ajusta dentro da aba. O motivo da decisão era o
  atrito de escolher uma Habilidade e descobrir que o nível não bate, e **as Habilidades ainda não
  existem**, então o atrito ainda não existe. Fazer junto com a aba de Habilidades.
- ~~**Nível 21+** (Melhorias Superiores, Habilidades Lendárias) segue para o fim.~~ **FEITO em
  2026-07-22**, ver a seção abaixo.

---

## ⭐ NÍVEIS LENDÁRIOS (21+): catálogo COMPLETO

`afty-alto-nivel.js` + o card **Níveis Lendários**, terceiro e último da aba Especializações. Some
inteiro abaixo do ND 21 (decisão do autor: "só aparecerem em Níveis 21+"), em vez de aparecer
zerado.

### Regras confirmadas (autor, 2026-07-22)
| Pergunta | Resposta |
|---|---|
| De onde vem | **Do ND**, não de classe nenhuma. As Especializações não entram (só nos pré-requisitos das Ápices) |
| Melhoria Superior | 1 em todo nível **ÍMPAR** a partir do 21 (21, 23, 25...) |
| Habilidade Lendária | 1 em todo nível **PAR** a partir do 22 (22, 24, 26...) |
| Orçamentos | **Dois, próprios e separados.** Não tocam o orçamento de Habilidades/Talentos |
| Melhoria repete? | Só as que o texto diz: **Alma 2x, CA 2x, CD 2x, Energia 2x, Vida 3x**. As outras 6, uma vez |
| Lendária repete? | **Não, nenhuma** |
| Habilidade Ápice | Escolha ANINHADA de *Atingir Ápice* (ND 26). Vem de graça, **uma por ficha** |
| "20 Níveis de X" | Nível **REAL** da especialização, não o de escalonamento (mesma convenção das Habilidades) |

### Shape na ficha
- `melhoriasSuperiores: []` lista de ids **COM repetição** (cada entrada é uma escolha), então
  `gastos === length` e `vezes(id) === quantas vezes o id aparece`. Foi o shape mais simples que
  casa com "cada repetição custa uma vaga", sem contador paralelo.
- `habilidadesLendarias: []` lista de ids **sem** repetição.
- `escolhasAltoNivel: {}` **campo NOVO**, `{ [id]: [opcaoId] }`, espelhando `escolhasHabilidade`.
  Cobre as 6 escolhas aninhadas: Perícia (Melhoria de Perícia), Teste de Resistência (Melhoria de
  Resistência), Atributo (Aperfeiçoamento de Atributo), 3 Perícias (Conhecimento Iluminado),
  energia ou vigor (Inesgotável) e a Ápice (Atingir Ápice).
- O aparo do `maxVezes` é de **leitura, não gravado** (mesma convenção de `resolveEspecializacoes`
  e `resolveNiveisAptidao`): coberto por assert.

### Requisitos: um tipo NOVO
`avaliarRequisitoAltoNivel` aceita `nd`, `habilidade`, `nota` (os três já existiam noutros
arquivos) mais **`nivelEspec`** `{ espId, valor }`, que é o "20 Níveis de Restringido" das Ápices.
É o primeiro requisito do projeto que lê nível de UMA especialização nomeada.

### ⚠ Pré-requisitos das Ápices que o livro cita e o Afty não tem
O autor decidiu (2026-07-22) que ficam como **`nota`**: aparecem na linha com cadeado roxo e
**não bloqueiam**, para a Ápice não ficar inalcançável. São 3:

| Onde | Citado | Situação |
|---|---|---|
| Fluxo Invencível | **Ápice Corporal Humano** | não existe no Restringido |
| Rei do Tabuleiro | **Flanco** | citado no texto de outras habilidades, mas não é habilidade |
| Rei do Tabuleiro | **Agilidade no Campo de Batalha** | extinta (o autor confirmou) |

Renomes JÁ RESOLVIDOS, apontando para a habilidade real:
- "Dominância em Habilidade" → `cnj_dominancia_em_feitico` (é o mesmo item 5 da errata acima)
- "Especialista em Técnicas" → Especialização **Conjurador**
- "Especialista em Combate" → Especialização **Combatente**

Os dois últimos saem dos próprios pré-requisitos: as habilidades citadas ao lado são `cnj_` e `cmb_`.

### ⚠ EFEITOS: nenhum ligado (mesmo bloqueio de sempre)
O card conta orçamento e trava pré-requisito, e só. Ligar Melhoria de Vida no HP, Melhoria de Alma
na Integridade, Intocável na Defesa etc. depende do **canal de efeito do lado da criatura**, que
não existe (seção D). Coberto por assert: derivar com as 11 Melhorias e as 16 Lendárias dá stats
idênticos a derivar sem nenhuma.

⚠ Quando esse canal existir, **Aperfeiçoamento de Atributo** ("podendo superar o máximo de 30")
quebra o teto duro de 30 do `eff()` em `afty-derive.js`. É a segunda exceção ao teto, depois do
Desenvolvimento Inesperado (que eleva valor E limite juntos, e por isso cabe no modelo atual).

### UI
Um card, **duas abas** (Melhorias Superiores | Habilidades Lendárias), os dois contadores no
`headerRight` com o mesmo chrome dos badges de Aptidões. As linhas são o cartão de 32px que abre
sob demanda, igual a `HabilidadeCard`. Duas coisas novas no vocabulário:
- **`VezesGauge`**: medidor de 2 ou 3 segmentos nas melhorias repetíveis, à direita da linha.
  Segue a regra "magnitude é MEDIDOR, não campo numérico". Clicar no segmento que já é o último
  desce um, então dá para voltar de 3 para 2 sem passar pelo zero.
- **Pool sem descrição vira fileira de pílulas** (Perícias, Atributos, TRs), em vez do cartão com
  checkbox usado nas opções com texto (as 6 Ápices).

### Padrões DESTE projeto que valem reusar (o de Aptidões é o mais recente e maduro)
- **Conteúdo é dado**: catálogo em `afty-<sistema>.js`, ids estáveis, texto verbatim, resolvers
  puros exportados. O builder só exibe.
- **Requisitos estruturados**: extraia `[Pré-Requisito: ...]` da descrição para
  `requisitos: [{tipo, ...}]` e avalie com uma função pura que devolve
  `{ ok, verificavel, label, titulo? }`. Tipos existentes em `afty-aptidoes.js`:
  `atributo`, `atributoOr`, `nd`, `trilha`, `aptidao`, `origem`, `nota` (não bloqueia).
  **Habilidade de Especialização vai precisar de um tipo novo** (ex. `especializacao`).
- **Validador de conteúdo**: copie `validarCatalogoAptidoes()`. Ele pegou 3 referências
  quebradas na 1ª execução. Rode a cada leva nova.
- **Concessão direcionada x orçamento**: se a regra NOMEIA o alvo, é grátis e direcionada; se
  diz "à sua escolha", é ponto de orçamento. Ver `resolveTreinoEfeitos`. Esse erro já foi
  cometido duas vezes neste projeto, não repita.
- **UI**: `Card` + badge de orçamento no `headerRight` (mesmo chrome de Focos/Níveis/Aptidões),
  linhas **recolhidas por padrão** (~32px, altura fixa), requisito como texto puro
  (roxo+cadeado = falta, cinza = atendido), abas no estilo da barra do topo.

---

## HABILIDADES DE ESPECIALIZAÇÃO (aba FUNCIONAL, catálogo só do Combatente)

`afty-habilidades.js` + `TabHabilidades` (2026-07-17). Motor ligado (`derived.habilidades`),
catálogo do Combatente transcrito (38 habilidades), aba construída e navegável.

### 🔴 DIVERGÊNCIA DELIBERADA DO LIVRO (a mais importante desta seção)
| | Regra |
|---|---|
| **Livro** | "No 2° nível e a cada nível seguinte, você recebe uma habilidade" (= **ND − 1**, ou 19 no ND 20) |
| **Afty (VALE ESTA)** | **`1 + floor(ND/3)`**, a MESMA fórmula das Aptidões Amaldiçoadas (7 no ND 20) |

O autor confirmou a regra do Afty em 2026-07-17, ciente do conflito. **Não "corrigir" para o
livro.** O texto verbatim da seção "HABILIDADES DO ESPECIALISTA EM COMBATE" continua dizendo a
regra do livro porque é transcrição, igual ao caso planilha × tabelas.

### Regras (autor, 2026-07-17)
- **Base e por Nível gastam o MESMO orçamento.** No livro as Bases são de graça, no Afty são
  escolhidas igual às por Nível.
- **Orçamento ÚNICO**, vindo do **ND total**, gasto onde o jogador quiser. Numa multiclasse
  Combatente 12 / Suporte 8 o orçamento é o do ND 20 (7), não 5+3.
- **O ACESSO é que muda por especialização**: cada habilidade exige nível **naquela**
  especialização (o lado da multiclasse). O livro sempre conta assim ("seu nível de Especialista
  em Combate", "nos níveis 8° e 16° de Especialista em Combate"), nunca o ND.
- ⚠ **"Base" NÃO quer dizer "inicial"**, quer dizer fixa da especialização. As 7 do Combatente
  são de nível **1, 1, 4, 4, 6, 9 e 20**.

### Nomes: Combatente × "Especialista em Combate"
O livro chama de **Especialista em Combate**. O autor escreve **Combatente** e decidiu que é esse
o nome na tela ("é muito longo e chato de escrever"). O nome do livro sobrevive só dentro do texto
verbatim das habilidades. As outras 5 devem seguir o mesmo padrão (Especialista em X → nome curto).

⚠ **Ids levam prefixo da especialização (`cmb_`)**, mesmo motivo do `mal_` das Aptidões: os nomes
REPETEM entre especializações de propósito. *Teste de Resistência Mestre* vai existir nas 6 ("mestre
no concedido pela **sua** especialização"), com texto próprio. O validador aceita nome repetido
entre especializações e acusa dentro de uma.

### Catálogo: só o Combatente (71), e parcial
| Grupo | Qtd | Notas |
|---|---|---|
| Base | 7 | níveis 1, 1, 4, 4, 6, 9, 20 |
| Por Nível · 2° | 17 | Arremessos Potentes … Zona de Risco |
| Por Nível · 4° | 14 | Aprender Postura … Uso Rápido |
| Por Nível · 6° | 12 | Acervo Amplo … Preparação Rápida |
| Por Nível · 8° | 8 | Aptidões de Combate … Surto de Ação |
| Por Nível · 10° | 6 | Análise Acelerada … Potência Antes de Cair |
| Por Nível · 12° | 5 | Técnicas de Saque … Sincronia Perfeita |
| Por Nível · 16° | 2 | Crítico Aperfeiçoado, Mestre da Postura |

Faltam o **20°** (se houver por-nível; a Base *Autossuficiente* é 20°) e **as 5 outras
especializações** inteiras. Requisitos de habilidade agora formam cadeias longas (10°/12°/16°
apontam para 2°/4°/6°/8°): *Chuva de Arremessos* é a primeira com **dois** pré-requisitos.

⚠ A lista do 4° nível veio **quase** alfabética, mas *Técnicas de Avanço* aparece entre *Arremesso
Rápido* e *Buscar Oportunidade* (provável artefato das 2 colunas do PDF). **Mantida na ordem que o
autor mandou**, que é a regra do projeto. Não alfabetizar "consertando".

### ⚠️ ONDE FICA: dentro da aba ESPECIALIZAÇÕES, não numa aba própria
As Habilidades de Especialização são o **2º card da aba Especializações**, embaixo dos chips
(autor, 2026-07-17). A aba **"Habilidades"** do topo é de **Ações & Características** (segue em
`STUBS`) — os nomes se parecem, as abas não. Componente: `HabilidadesEspecializacao`, renderizado
por `TabEspecializacoes` num fragmento depois do card de chips. Mesmo arranjo da aba de Aptidões
(alocador em cima, lista de leitura embaixo). Não há mais `TabHabilidades` nem entrada no `TABS`.

### UI do card
- **Tabulado pelas especializações ESCOLHIDAS** (1 ou 2), não pelas 6: habilidade de
  especialização que a criatura não tem é ruído. Com uma só, a barra de abas nem aparece.
- Abre na primeira especialização que **tem catálogo** (só Combatente por ora), senão uma ficha
  Lutador/Combatente abria no Lutador e mostrava vazio, escondendo as 38 do Combatente.
- Especialização sem catálogo **diz isso** ("As Habilidades de X ainda não foram transcritas").
- Sem especialização escolhida, o card **não aparece** (os chips logo acima já pedem uma).
- **Cartão recolhido** idêntico ao das Aptidões (32px de altura fixa, abre sob demanda, sem clamp).
- **Grupos de nível em ABAS** (autor, 2026-07-17), não empilhados: com 71 habilidades no
  Combatente a lista vertical virou paredão. Rótulo curto ("Base", "2°", "4°"...), segundo nível de
  abas abaixo das abas de especialização. `grupoTab` guarda a escolha, cai no 1º grupo se ela não
  existe na especialização ativa. Ordem do livro: Base → 2° → 4° → ... (`gruposDeHabilidade`).
- **Contador de escolhidas por aba de nível**: com as habilidades separadas em abas, o que foi pego
  nas outras some da vista, então o badge devolve essa visibilidade (só aparece quando > 0).
- **Sem rodapé.** A nota "no livro as Bases são de graça..." foi removida a pedido do autor.
- **Travada DIZ O QUE FALTA**: "Combatente 6 · faltam 4" (decisão do autor, roadmap 2026-07-14).
  O chip de nível **some quando atendido** (o nível já está na aba), diferente das Aptidões, que
  mostram o requisito atendido em cinza.
- **Já escolhida nunca trava.** Senão redividir a multiclasse prenderia a habilidade na ficha sem
  como remover (mesma regra do `AptidaoCard`).
- Estourar o orçamento fica **vermelho e não bloqueia** (padrão do projeto).

### Escolha ANINHADA (padrão novo do projeto): 2 pools reais
Uma habilidade pode **conter uma escolha** de um pool. Modelado com o campo `escolha`
(`{ id, label, niveis:[...], opcoes:[...] }`) + `escolhasConcedidas(hab, nivelEspec)`, que conta
quantas o nível já liberou. O validador confere que a 1ª concessão não vem antes do nível da
habilidade e que os ids das opções são únicos.

Os dois pools transcritos:
| Pool | Const | Dono | Concede |
|---|---|---|---|
| **Estilos de Combate** (8) | `ESTILOS_DE_COMBATE` | Repertório do Especialista | 1 no nível 1, +1 no 6 e no 12 |
| **Posturas de Combate** (8) | `POSTURAS_DE_COMBATE` | Assumir Postura | 1 no nível 2, +1 no 8 e no 16 |

Concessões EXTRAS do mesmo pool, de outras habilidades (a somar quando o estado existir):
- *Acervo Amplo* (6°) → +1 Estilo.
- *Aprender Postura* (4°) → +1 Postura no nível 4 e outra no 10.
- *Mestre da Postura* (16°) → não concede, deixa usar 2 ao mesmo tempo.

⚠ As 3 últimas Posturas têm pré-req de nível (`nivelMin`): Devastação 6, Tempestade 10, Céu 12.
Ambíguo no livro se é nível de Especialista ou de personagem (aqui tudo mais é de Especialista).
A UI mostra "(Nível N)" ao lado do nome. Resolver a interpretação quando a escolha virar estado.

⚠ **O estado da escolha aninhada ainda NÃO existe na ficha.** `creature.habilidades` é só uma
lista de ids. Vai precisar de algo como `creature.habilidadeEscolhas = { [habId]: [opcaoId] }`,
somando as concessões extras da tabela acima. Na aba, os pools hoje são **só leitura** dentro do
texto aberto da habilidade dona (com contador "N de M liberados"). Não há ficha Afty salva, então
ainda é de graça mudar o shape.

As **artes de combate** (avanço/força/saque) NÃO são escolha aninhada: você aprende AS DUAS, então
são texto verbatim dentro da descrição da habilidade dona (igual às 5 artes da base Artes do
Combate). Todas já transcritas.

### Requisitos
Além do nível (implícito, vem do próprio catálogo), há `requisitos: []` para os extras.
`avaliarRequisitoHabilidade` conhece:
- `habilidade` — "[Pré-Requisito: Assumir Postura]" em *Aprender Postura* e *Preparação Rápida*.
  **Bloqueia.** Referência a habilidade ainda não transcrita exibe o id cru e NÃO bloqueia.
- `nota` — perícia/sistema não construído, só exibe ("Treinado em Feitiçaria" em *Feitiçaria
  Implementada*, "Treinado em Percepção" em *Mira Destrutiva*). Promover a requisito real quando
  Perícias existirem.

⚠ *Acervo Amplo* (6°) **concede +1 Estilo de Combate** — mais um consumidor da escolha aninhada do
Repertório, a somar quando o estado de escolha existir.

### Pendências de conteúdo
- ✅ Posturas (8) e as 6 artes de combate (avanço/força/saque) foram transcritas em 2026-07-17.
- *Armas Escolhidas* e *Grupo Favorito* pedem "escolha um grupo de armas": esperam o catálogo de
  **Armas**, que não existe. Hoje é só texto.
- ⚠ *Aptidões de Combate* (8°) é **REPETÍVEL** ("pode pegar duas vezes, uma para cada aptidão") e
  **concede nível de trilha** (Aura OU Controle e Leitura, +1). Dois problemas de modelo juntos: o
  shape `creature.habilidades` é lista de ids ÚNICOS (não suporta 2x, mesmo caso de *Crescimento
  Corporal* nas Aptidões), e a concessão de trilha entra na passada de efeitos + em
  `resolveNiveisAptidao` (o TODO que já existe em `afty-derive.js` de somar concessões de
  Habilidades). Resolver junto com a passada de efeitos.
- **Artes do Combate** (5 artes) e **Golpe Especial** (11 propriedades) são listas dentro da
  descrição, **não** escolhas de ficha: as artes você sabe todas, e as propriedades do golpe são
  escolhidas na hora de atacar, na mesa. Ficaram como texto verbatim de propósito.

### Efeitos: NADA ligado (mesma postura das Aptidões)
`derived.habilidades` só conta orçamento e acesso. Nenhuma habilidade mexe em stat (coberto por
assert). Vários efeitos são calculáveis e entram na MESMA passada de efeitos das Aptidões:

| Habilidade | Efeito | Canal |
|---|---|---|
| **Implemento Marcial** | +2 CD, +1 nos níveis 8 e 16 de Combatente | cd |
| **Estilo Defensivo** | +2 Defesa, +1 nos níveis 4, 8, 12 e 16 | defesa |
| **Artes do Combate** | Pontos de Preparo = nível de Combatente + mod Sabedoria | recurso novo |
| **Autossuficiente** | 3 PE temporários por Golpe Especial | pe temporário |

⚠ **Artes do Combate abre um recurso NOVO** (Pontos de Preparo), que não é HP/PE/Alma. Vai
precisar de canal próprio no motor e provavelmente de lugar na tela de combate.

---

## LUTADOR (catálogo COMPLETO, 2026-07-22)

70 habilidades transcritas verbatim em `afty-habilidades.js`, prefixo `lut_`:
Base 8 (níveis 1, 1, 2, 4, 5, 9, 11, 20) · 2° 15 · 4° 14 · 6° 13 · 8° 8 · 10° 6 · 12° 4 · 16° 2.
O autor declarou a especialização FECHADA ("finalizamos Lutador com os poderes acima").

- **Pool novo `MANOBRAS_DE_EMPOLGACAO`** (5): escolha aninhada de Empolgação, com
  `niveis: [1, 1, 6, 12, 18]` (o `1` repetido é como `escolhasConcedidas` conta as DUAS do
  nível 1). No nível 18 o Lutador conhece as 5.
- **Manobras Finalizadoras** (6°) NÃO é escolha aninhada: "você recebe acesso as seguintes",
  então as 3 (Ataque Circular, Golpe Certeiro, Quebra Crânio) são texto verbatim dentro da
  habilidade dona, igual às Artes do Combate do Combatente.
- **Requisito `atributo` é novo** em `avaliarRequisitoHabilidade` (Sobrevivente pede
  Constituição 16). Espelha o das Aptidões, usa `ctx.attrEff`, que o builder agora passa.
- ⚠ **`lut_poder_corporal` teve o CABEÇALHO comido pelo PDF** (as duas colunas engoliram o
  título entre *Manobras Finalizadoras* e *Potência Superior*). O nome foi deduzido do
  pré-requisito de *Punhos Letais* (8°), que diz "Poder Corporal", e a posição bate com a ordem
  quase alfabética. **CONFIRMAR com o autor.**
- **Recurso próprio: Nível de Empolgação** (1 a 5, sobe acertando ataque, desce passando uma
  rodada sem acertar). É estado de COMBATE, não de ficha, como os Pontos de Preparo do Combatente.

### Automação: NADA ligado ainda, e o motivo

O autor pediu que tudo que der seja automatizado pelo Motor. **Não deu nenhum**, por um motivo
estrutural: `CONTROLADOR_EFEITOS_INVOCACAO` aplica efeitos DSL sobre **invocações**, e todo efeito
de Lutador é sobre a **própria ficha**. O canal de efeitos do lado da criatura NÃO EXISTE (é a
"passada de efeitos" pendente desde as Aptidões). Assim que ele existir, estes saem de graça,
porque já são fórmulas numéricas incondicionais:

| Habilidade | Fórmula | Canal |
|---|---|---|
| Reflexo Evasivo (base 2) | `piso(nivel_lutador/2)`, todo tipo exceto alma | rd |
| Implemento Marcial (base 4) | `2 + (n>=8) + (n>=16)` | cd |
| Gosto pela Luta (base 5) | `2 + degraus 8/12/16/20` acerto, `1 + degraus 9/13/17` dano e Fortitude | acerto, dano, tr |
| Caminho da Mão Vazia (2°) | dano desarmado `+bt`, acerto desarmado `+piso(bt/2)` | dano, acerto |
| Defesa Marcial (4°) | `1 + piso(bt/2)` | defesa |
| Aprimoramento Marcial (6°) | `piso(bt/2)` | cd |
| Corpo Calejado (6°) | Defesa `+piso(modCon/2)`, PV `+nivel_lutador` | defesa, pv |
| Poder Corporal (6°) | dano desarmado `+2 níveis` | danoNivel |
| Punhos Letais (8°) | ignora RD `= bt`, margem de crítico `-1` | ignorarRd, critico |
| Seja Água (12°) | `+3 m` | deslocamento |
| Corpo Supremo (16°) | `+3 m`, `+4` Defesa, RD `piso(nd/2)` em 3 tipos + 1 à escolha, `piso(nd/4)` no resto | deslocamento, defesa, rd |

Precisam de **canal novo** no motor, além do que já existe:
- **Corpo Treinado** (base 1): o dado de dano desarmado é uma FAIXA (1d8/1d10/1d12/2d8/2d12 nos
  níveis 1/5/9/13/17), não uma soma. Vale reusar `subirNiveisDano` das Invocações.
- **Músculos Desenvolvidos** (4°): TROCA o atributo da Defesa (Força no lugar de Destreza). Não é
  soma, é substituição na fórmula.
- **Alma Quieta / Corpo Sincronizado / Mente em Paz** (10°): vantagem para resistir a condições
  NOMEADAS. Pede canal de vantagem por condição.

**NÃO automatizável (anotado, não tentar):**
- Tudo que lê o **Nível de Empolgação**: Empolgação, Empolgação Máxima, Fluxo, Ignorar Dor,
  Empolgar-se, Insistência, Manobras Finalizadoras, parte de Lutador Superior.
- **Estados ligáveis em combate**: Brutalidade (+ Sanguinária, + Aprimorada), Ataque Inconsequente
  (+ Sequência), Armas Absolutas, Tempestade Sufocante, Fúria da Vingança, Imprudência Motivadora.
- **Reações e usos por PE**: Aparar Ataque, Aparar Projéteis, Devolver Projéteis, Redirecionar
  Força, Segura pra Mim, Golpear Brecha, Resistir, Ação Ágil, Ataque Extra, Voadora, Foguete Sem
  Ré, Golpe da Mão Aberta, Impacto Demolidor, Feitiço e Punho, Oportunista, Atacar e Recuar.
  São os MESMOS gaps já listados em `docs/afty-invocacoes.md` (por rodada, reação, economia de ação).
- **Dependem de sistema inexistente**: Armas (Dedicação em Arma, Um com a Arma, Armas Absolutas,
  Quebrando Tudo, Corpo Arsenal) · Perícias e TR treinado do personagem (Deboche Desconcertante,
  Alma Quieta, Corpo Sincronizado, Mente em Paz, Duro na Queda), hoje como `nota`.
- ⚠ **Aptidões de Luta** (8°) é REPETÍVEL e CONCEDE nível de trilha (Aura ou Controle e Leitura),
  o par de problemas idêntico ao de *Aptidões de Combate*. Resolver os dois na mesma passada.

---

## CONJURADOR (catálogo COMPLETO, 2026-07-22)

66 habilidades verbatim, prefixo `cnj_`: Base 6 (níveis 1, 1, 4, 9, 10, 20) · 2° 14 · 4° 15 ·
6° 12 · 8° 8 · 10° 4 · 12° 5 · 16° 2. No livro é **Especialista em Técnicas**, o autor escreve
**Conjurador** (mesmo caso de Combatente × Especialista em Combate).

**Dois pools novos**, os dois em `afty-habilidades.js`:
- **`MUDANCAS_DE_FUNDAMENTO`** (7), de *Domínio dos Fundamentos* (base 1), `niveis: [1, 1, 12]`.
  *Feitiço Rápido* tem `nivelMin: 6` (o "Pré-Requisito: Nível 6" do livro), mesma convenção das
  últimas Posturas de Combate. *Expansão dos Fundamentos* (8°) concede +1 no 8 e outra no 12, do
  MESMO pool, e *Versatilidade em Fundamentos* (4°) troca as escolhidas num descanso (decisão de
  mesa, a ficha já troca livremente).
- **`FOCOS_AMALDICOADOS`** (3: Destruição, Economia, Refino), de *Foco Amaldiçoado* (base 10),
  `niveis: [10]`. É a escolha de maior impacto mecânico da especialização (dano, custo de PE, CD).

**Requisito `aptidao` é novo** em `avaliarRequisitoHabilidade`, e ao contrário do `nota` ele
**bloqueia de verdade**, porque o catálogo das 85 Aptidões existe. Usa `ctx.aptidoes`, que o
builder agora passa de `draft.aptidoesAmaldicoadas`. Consumidores: *Explosão Defensiva*,
*Físico Amaldiçoado Defensivo* e *Revestimento Constante* (Cobrir-se) e *Expansão Maestral*
(Expansão de Domínio Completa).

### ⚠ Três coisas a confirmar com o autor
1. **"Técnica Precisa" não existe.** *Mira Aperfeiçoada* (8°) diz conceder "a Mudança de
   Fundamento Técnica Precisa", mas a do pool se chama **Feitiço Preciso**. Transcrito verbatim.
2. **"Dominância em Habilidade" não existe.** O pré-requisito de *Manipulação Perfeita* (16°) usa
   esse nome, mas a habilidade de 6° é **Dominância em Feitiço**. O requisito foi apontado para ela.
3. **Dominância em Feitiço arredonda para CIMA** ("metade do nível dele, arredondado para cima"),
   exceção explícita à regra geral do Afty, que é floor.

### Automação: mesmo bloqueio do Lutador
Nada ligado, pelo mesmo motivo: não existe canal de efeito do lado da criatura. E aqui há um
segundo bloqueio, mais duro: **a maioria dos efeitos do Conjurador opera sobre FEITIÇOS**, que
são um sistema inteiro ainda não construído (nível de feitiço, custo em PE, alcance, área,
conjuração, sustentação, rituais, liberações e Técnica Máxima). Enquanto Feitiços não existirem,
nem os números que dependem deles existem.

Prontos para plugar assim que houver canal de criatura (não dependem de Feitiços):
| Habilidade | Fórmula | Canal |
|---|---|---|
| Reforço Amaldiçoado (2°) | `2 + (n>=10) + (n>=20)` na CD de Especialização e Amaldiçoada | cd |
| Reação Rápida (2°) | `+mod(int ou sab)` | iniciativa |
| Energia Inacabável (4°) | `piso(nivel_conjurador/2)` | pe |
| Feitiços Refinados (4°) | `piso(bt/2)` | cd |
| Movimentos Imprevisíveis (4°) | `+mod(int ou sab)`, teto = nível | defesa |
| Olhar Preciso (4°) | `2 + piso(nivel/4)` | acertoAmaldicoado |
| Revestimento Constante (8°) | `bt`, todo tipo exceto alma | rd |
| Sentidos Aguçados (10°) | `+piso(mod/2)` | atencao, pericia |
| O Honrado (base 20) | `+5` CD e `+5` ataque de Feitiço/Aptidão | cd, acertoAmaldicoado |
| Foco · Destruição / Economia / Refino (base 10) | dano, custo e PE máx, ou CD e acerto | vários |

⚠ **Escolha "Int OU Sab" é um padrão NOVO** e aparece em ~10 habilidades do Conjurador. Não é
`atributoOr` (que é requisito, não efeito): é o jogador escolhendo qual mod usar. Vai precisar de
estado na ficha ou de convenção (ex.: usar sempre o maior). **Decidir antes de automatizar.**

**Concessões a somar na passada de efeitos:** *Epifania Amaldiçoada* (4°) dá 1 Aptidão no nível 4
e outra no 12 (direcionada? não, "uma Aptidão Amaldiçoada" à escolha = ORÇAMENTO) · *Elevar
Aptidão* (6°) é REPETÍVEL até BT vezes e dá nível de trilha à escolha (orçamento) · *Foco ·
Refino* dá 1 Aptidão ou Feitiço · *Nova Habilidade* (2°) é repetível SEM limite e cria Feitiços.
Os repetíveis esbarram no mesmo shape de lista de ids únicos de *Aptidões de Combate* e
*Aptidões de Luta*. **Resolver os quatro casos de uma vez.**

---

## SUPORTE (catálogo COMPLETO, 2026-07-22)

58 habilidades verbatim, prefixo `sup_`: Base 8 (níveis 1, 3, 5, 6, 8, 9, 10, 20) · 2° 13 ·
4° 9 · 6° 7 · 8° 9 · 10° 4 · 12° 5 · **14° 1** · 16° 2.

**Pool novo `APOIOS_AVANCADOS`** (5), de *Apoio Avançado* (2°), `niveis: [2, 6, 12]`.
*Apoio Estratégico* tem `nivelMin: 6`. *Apoios Versáteis* (4°) concede +1 no 4 e outro no 10, do
MESMO pool, e *Apoio Abrangente* (14°) deixa aplicar DOIS efeitos por apoio em vez de um.

- **Único grupo de 14° nível do sistema.** `gruposDeHabilidade` ordena por nível sozinho, então
  ele entrou entre o 12° e o 16° sem ajuste nenhum no código.
- **Único caso de Base que é CONCESSÃO PURA**: nos níveis 6 e 8 o livro só diz "você recebe a
  aptidão amaldiçoada X", sem nomear uma habilidade. Viraram `sup_energia_reversa` e
  `sup_liberacao_de_energia_reversa`, batizadas com o nome do que concedem.
  ⚠ **PERGUNTA ABERTA:** pela regra do projeto, alvo NOMEADO = concessão direcionada e GRÁTIS,
  mas pela regra do Afty toda Base gasta vaga de orçamento. As duas regras se chocam aqui.
  **Decidir com o autor** se estas duas custam vaga ou vêm de graça.

### Coisas que este catálogo trouxe de novo
- **Cura é um eixo inteiro** (Suporte em Combate, Medicina Infalível, Cura Avançada em Grupo,
  Sintonização Vital, Cura Aperfeiçoada, Sobrecura, Descarga Reanimadora, Purificação da Alma).
  O motor não tem canal de cura nenhum. É o maior sistema novo que o Suporte pede.
- ⚠ **Purificação da Alma** (16°) restaura **Integridade/Alma em 50%**. É a PRIMEIRA habilidade
  do sistema que mexe na Alma, e a Alma escala TODO o HP (`× Alma.Atual/100`). Efeito de peso.
- ⚠ **Físico Controlado** (8°) TROCA o atributo do HP (Presença ou Sabedoria no lugar de
  Constituição, teto +4). É substituição de fórmula, igual ao que *Músculos Desenvolvidos*
  (Lutador) pede para a Defesa. Já são **dois** consumidores do mesmo canal de troca.
- ⚠ **Motivação pelo Triunfo** (8°) cita **"Lacaio"**, que é patamar da 2.5.2 e NÃO EXISTE no
  Afty (Comum/Desafio/Calamidade/Beyond). Transcrito verbatim. **Confirmar com o autor.**
- **Aptidões de Suporte** (8°) é o TERCEIRO repetível que concede nível de trilha (com Aptidões
  de Combate e Aptidões de Luta). Os três caem no mesmo par de problemas de modelo.
- Dependem de sistemas inexistentes: **Inventário** (Otimização de Espaço, Ajustes em
  Equipamento) e **Ferramentas** como perícia (Médico, Ferreiro), hoje `nota`.

Prontos para plugar assim que houver canal de criatura:
| Habilidade | Fórmula | Canal |
|---|---|---|
| Mobilidade Avançada (2°) | `+3 m` | deslocamento |
| Pronto para Agir (2°) | `+mod(presenca)` | iniciativa |
| Pré-Análise (4°) | `+5` | atencao |
| Físico Controlado (8°) | troca CON por `min(mod(pre ou sab), 4)` no HP | hp (substituição) |

---

## RESTRINGIDO (catálogo COMPLETO, 2026-07-22) — fecha as 6

54 habilidades verbatim, prefixo `res_`: Base 8 (níveis 1, 2, 2, 3, 4, 9, 10, 20) · 2° 11 ·
4° 8 · 6° 8 · 8° 8 · 10° 5 · 12° 3 · 16° 3. **Com ela o catálogo fecha em 367 habilidades.**

É a especialização SEM energia amaldiçoada: o recurso é **Ponto de Estamina** (4 no ND 1, +4 por
nível). Como é exclusiva da Origem Restringido, que proíbe multiclasse, **nível de Restringido ==
ND sempre**, o que simplifica todo requisito daqui.

**Pool novo `DADIVAS_DO_CEU`** (9), de *Restrito pelos Céus* (base 1), `niveis: [4, 8, 12, 16,
20]` — a primeira só no 4°, daí o `escolha.niveis` começar acima do `nivel` da habilidade dona
(o validador aceita, ele só proíbe conceder ANTES). *Respeito Celeste* (8°) concede mais uma e é
REPETÍVEL (a 2ª vez a partir do 12), o que o shape de ids únicos ainda não suporta.

### 🔴 ROUBO DE HABILIDADE: o primeiro pool COMPUTADO do sistema

*"você pode aprender uma habilidade de Especialista em Combate ou Lutador... Você não pode roubar
habilidades base das outras especializações, exceto Golpe Especial."*

Todo outro pool do projeto é uma lista literal. Este é uma **consulta ao próprio catálogo**:
`HABILIDADES_ROUBAVEIS` = todas as por-nível de Combatente e Lutador + `cmb_golpe_especial`.

✅ **CONFIRMADO (autor, 2026-07-22): são SÓ Combatente e Lutador.** Conjurador, Suporte e
Controlador **não** entram, e Restringido também não. **Versões antigas do sistema deixavam roubar
das outras classes** e é fácil se confundir com isso. Se a dúvida voltar, a resposta já é esta:
não expandir o pool.
**127 opções.** Como não dá para referenciar `AFTY_HABILIDADES` de dentro dele mesmo, as `opcoes`
são atribuídas logo APÓS a construção do array. Verificado por assert: Golpe Especial está no
pool e nenhuma outra Base entrou.

Também trouxe **`escolha.limite: "bt"`**, porque a quantidade é o Bônus de Treinamento e não o
tamanho do pool (o padrão dos repetíveis, que serve para Melhoria de Controlador). `bt` agora
desce de `deriveAfty` → `resolveHabilidades` → `resolveEscolhasHabilidade` → `escolhasMaximas`,
o mesmo caminho que as Invocações já usam.

Verificado num Restringido ND 13 (BT 5): Dádivas 3 de 3, Roubo 3 de 5, `vagasExtras` 2, gastos
4 de 5. Cada roubo consome uma vaga, que é o que o texto pede.

### 📑 O pool do Roubo é TABULADO (2026-07-22)

127 opções numa lista corrida eram um paredão dentro de um cartão que já está aberto sob demanda.
A escolha agora traz **`abas: ["especializacao", "nivel"]`**, e o novo componente
**`OpcoesDeEscolha`** monta uma barra por eixo, encadeadas: escolhida a especialização, a barra de
baixo só oferece os níveis daquela. Resultado:

| Aba | 2° | 4° | 6° | 8° | 10° | 12° | 16° | total |
|---|---|---|---|---|---|---|---|---|
| **Lutador** | 15 | 14 | 13 | 8 | 6 | 4 | 2 | 62 |
| **Combatente** | 17 | 15 | 12 | 8 | 6 | 5 | 2 | 65 |

Maior folha: 17. Decisões que valem lembrar:
- **São os MESMOS dois eixos do card de Habilidades** (especialização e depois nível), de
  propósito: escolher uma habilidade e roubar uma passam a ter a mesma linguagem. As abas só são
  menores (`text-[11px]`), por estarem um nível mais fundo.
- **`abasDeOpcoes(opcoes, eixo)`** (em `afty-habilidades.js`) é genérico e puro. Quem decide se
  tabula é o DADO (`escolha.abas`), não o componente: nenhum outro pool ganhou abas, e um pool
  novo grande só precisa declarar os eixos. Coberto por assert.
- Para o eixo funcionar, `HABILIDADES_ROUBAVEIS` passou a carregar **`especializacaoId`**.
- Cada aba conta quantas opções daquele galho já foram escolhidas, senão o que foi pego nas outras
  sumiria da vista (mesma lição da barra de grupos do card de Habilidades).
- Com o pool tabulado por nível, o **`(Nível N)` sai da linha da opção**: vira ruído, já que o
  nível é a própria aba. Pool sem abas continua mostrando.
- Item sem o campo do eixo cai num balde **"Outros"** em vez de sumir da tela.

**⚠ DUAS DECISÕES PENDENTES DO AUTOR:**
1. **O filtro "desde que tal não dependa do uso de energia amaldiçoada" NÃO está aplicado.** Não
   existe marca de custo em PE no catálogo, e deduzir pelo texto erraria nos dois sentidos. As
   opções são as 127 estruturalmente elegíveis. Caminho sugerido: marcar `usaEnergia: true` nas
   habilidades de Combatente e Lutador que gastam PE, e filtrar. São ~141 para revisar.
2. **O nível da habilidade roubada não BLOQUEIA.** O pool carrega `nivelMin` (o nível da
   habilidade original) e a UI já mostra "(Nível N)", mas não impede escolher. O livro diz "Você
   usa seus níveis de Restringido para os requisitos", ou seja, deveria travar. Hoje um
   Restringido 2 consegue roubar uma habilidade de 16°. Mesma pendência que já existia nas
   Posturas de Combate, mas aqui ela pesa muito mais.

### ⚠ Incoerências do livro (transcritas verbatim)
- **"2 PE" e "1 PE" num personagem sem PE.** *Ação Ágil* (4°) e *Adrenalina Absoluta* (12°) citam
  PE, mas Restringido usa Estamina. *Ação Ágil* parece copiar-colar da homônima do Lutador.
- ***Teste de Resistência Mestre* DIFERE das outras 5**: aqui é "mestre nos DOIS TRs conferidos
  pela sua Especialização", não "treinado num segundo e mestre no concedido".
- ***Valorizar Invocação*** (2°) depende de **domar maldições**, que o autor declarou FORA DE
  ESCOPO para criação de ficha (2026-07-17).
- ***Corpo de Aço*** (6°) soma o **VALOR** de Constituição no PV, não o modificador.

### Pendências de CONTEÚDO (citadas mas não enviadas)
- **ARSENAL AMALDIÇOADO** ("detalhado no final da especialização"), citado em *Restrito pelos Céus*.
- **ESTILO MARCIAL** e as **técnicas marciais** ("explicado após as habilidades da
  especialização"), citados em *Restrito pelos Céus* e em *Desenvolver Ideias* (4°).

---

## TALENTOS (sistema NOVO, completo, 2026-07-22)

51 talentos em `src/systems/afty/afty-talentos.js`, prefixo `tal_`:
**Gerais 43** (20 sem pré-requisito + 23 com) e **de Origem 8**.

### Regras (autor, 2026-07-22)
| Pergunta | Resposta |
|---|---|
| Orçamento | **O MESMO das Habilidades de Especialização** ("pegos no lugar de") |
| Quem pode pegar | **Qualquer especialização.** Não existe `especializacaoId` no catálogo |
| "Nível N" nos pré-requisitos | **É o ND**, nunca o nível de classe |
| Onde fica na UI | **Aba ao lado das especializações.** Numa ficha Restringido: "Restringido \| Talentos" |

### Arquitetura
- Arquivo próprio (`afty-talentos.js`), porque o agrupamento (Gerais/Origem), a semântica de
  nível (ND) e os tipos de requisito diferem das Habilidades. Catálogo + resolvers puros, padrão
  do projeto.
- `resolveTalentos(creature, ctx)` → `{ escolhidas, gastos, inacessiveis }`. **O orçamento NÃO
  vive nele**: `deriveAfty` resolve Talentos ANTES e passa `talentos.gastos` como 3º argumento de
  `resolveHabilidades`, que soma tudo. `derived.talentos` existe só para a UI.
- **Não alimenta stat nenhum** (coberto por assert: derivar com e sem talento dá stats idênticos).
- UI: a barra de abas de `HabilidadesEspecializacao` agora sempre mostra Talentos, e os dois
  catálogos são normalizados para a mesma forma (`{id, titulo, habilidades}`) para reusar a barra
  de grupos e o `HabilidadeCard` sem ramificar a árvore. Talento passa
  `acesso = { ...avaliarAcessoTalento(), nivelOk: true, faltam: 0 }`, então o chip de nível some.

### Tipos de requisito de `avaliarRequisitoTalento`
`nd` · `atributo` · `atributoOr` · `origem` (verificável, as 8 origens existem) · `talento`
(Mestre do Arremesso pede Técnicas de Arremesso) · **`maxComNome`** (novo: "não possuir mais que
dois talentos com o nome Adepto" — conta os escolhidos com o prefixo e bloqueia o 3º) · `nota`.

### ⚠ A confirmar com o autor
1. **Um talento veio SEM cabeçalho**, o mesmo artefato de PDF de *Poder Corporal*: o que começa
   com "Você aperfeiçoa o uso do seu escudo para colocá-lo no seu ataque". Batizado
   **Técnicas Ofensivas de Escudo**, pelo irmão *Técnicas Defensivas de Escudo*, que abre com a
   mesma frase trocando "no seu ataque" por "por completo na sua defesa".
2. **"Técnica Rápida" não existe.** *Adepto de Feitiçaria* exclui "Técnica Rápida" do pool de
   Mudanças de Fundamento, mas a opção se chama **Feitiço Rápido**. Mesma troca Técnica/Feitiço
   de *Mira Aperfeiçoada*. São a mesma?
3. *Determinado a Viver* escreve **"Pré-Requisito: Pré-Requisito:"** duas vezes. Erro de digitação.

### Escolhas aninhadas que os Talentos pedem (nenhuma ligada ainda)
- **Incremento de Atributo** e **Quebra de Limites**: repetíveis, elevam VALOR e LIMITE de
  atributo, exatamente como o Desenvolvimento Inesperado (Derivado). Pedem pool dos 6 atributos.
- **Adepto de Combate** concede uma escolha de `ESTILOS_DE_COMBATE` e **Adepto de Feitiçaria** uma
  de `MUDANCAS_DE_FUNDAMENTO`, os dois pools morando em `afty-habilidades.js`. Primeira escolha
  aninhada que **atravessa arquivos**.
- **Físico Aperfeiçoado**: 1 de 4 efeitos, e os 4 são canais distintos (deslocamento, perícia,
  manobra, pulo). Ficou como texto.
- **Aptidão Desenvolvida** e **Estudo Amaldiçoado** concedem nível de trilha à escolha
  (ORÇAMENTO). Com *Aptidões de Combate/Luta/Suporte*, já são **cinco** consumidores do mesmo
  modelo repetível-que-concede-trilha. Resolver os cinco de uma vez.

---

## PRÓXIMOS PASSOS (depois de Especializações)

1. **Passada de efeitos** das Aptidões (ver seção APTIDÕES). O catálogo FECHOU (85), então o
   pré-requisito que o autor pôs já está satisfeito. Precisa de um modelo de `efeitos` com
   valor COMPUTADO (ND, nível de trilha, maestria), não constante como o dos Treinamentos.
2. Pendências de conteúdo das aptidões:
   - **Modificação Completa** (aptidão de Domínio concedida pelo Treino de Domínios Completo).
     O texto já existe em `MODIFICACAO_COMPLETA` (`afty-treinamentos.js`), mas ela NÃO está no
     catálogo, porque é concedida e não escolhida. Precisa decidir a marca (ex. `apenasConcedida`).
   - **Crescimento Corporal** é REPETÍVEL ("a partir do 10° nível você pode obter esta aptidão
     outra vez"). `aptidoesAmaldicoadas` é uma lista de ids únicos e não suporta 2x.
   - **Revestimento Evoluído** não lista Revestimento como pré-requisito, embora o texto dependa
     dele. Transcrito verbatim. Confirmar se é typo.
   - **Aptidões de Anatomia (Maldição)** × as 15 Características de Anatomia do Feto
     (`afty-anatomias.js`): conceitos parecidos, conferir se conversam ou colidem.
3. **Promover as `nota` dos Treinamentos**: várias etapas em `afty-treinamentos.js` referenciam
   aptidões/trilhas que hoje EXISTEM ("Técnicas de Barreira", "Expansão de Domínio Incompleta",
   "Energia Reversa", "Nível de Aptidão em Barreiras 2"). Continuam como `nota` (não bloqueiam)
   só porque o `avaliarRequisito` dos Treinamentos não conhece aptidões. É barato de ligar.
4. Terminar origens: **Herdado**, **Corpo Amaldiçoado Mutante**, **Restringido**, **Maldição**.
   As 4 travam coisas: Herdado é requisito de *Emoção da Pétala Decadente*, e Maldição destrava
   a aba inteira de Aptidões de Maldição (18 aptidões hoje inalcançáveis).
5. **Talentos** (destrava Inato/Derivado/Sem Técnica, é base de Habilidades, e o livro diz que
   talentos também concedem Nível de Aptidão).
