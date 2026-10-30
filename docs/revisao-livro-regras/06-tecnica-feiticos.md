# Técnica e Feitiços

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR16: Orçamento padrão de Feitiços do jogador

- Status: **implementado**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 199.

> Conforme seu personagem subir de nível, ele também receberá novos Feitiços: em todo nível par (2, 4, 6, 8, 10, 12, 14, 16, 18 e 20), você recebe um novo Feitiço, além de um Feitiço adicional no nível 10 e outro no nível 20.

**Evidência de implementação:** [afty-feiticos.js:529](../../src/systems/afty/afty-feiticos.js#L529), totalFeiticosJogador soma Inicial, Níveis Pares, Nível 10 e Nível 20; [afty-derive.js:3220](../../src/systems/afty/afty-derive.js#L3220), consumidor da progressão.

**Limite da conclusão:** Recorte: cadência padrão entre níveis 1 e 20. Conjuração Aprimorada e concessões extras são outras parcelas. Na criatura o orçamento compartilhado é diferente. O status não atesta a regra de edição de Feitiços ao subir de nível.

## LR17: Reserva de PE máximo das Passivas

- Status: **implementado**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 235.

> Em suma, a redução é igual ao dobro do nível do Feitiço Passivo.

**Evidência de implementação:** [afty-feiticos.js:429](../../src/systems/afty/afty-feiticos.js#L429), peMaximoDasPassivas filtra passivas e acumula custo, com custoPeMaximoDaPassiva em 401; [afty-derive.js:2971](../../src/systems/afty/afty-derive.js#L2971), passivasNoPeBrutas, isenções e subtração do total em peAntesMultiplicador.

**Limite da conclusão:** Recorte: Passivas comuns de níveis 0 a 5, sem addon de isenção. Afty não cobra todas as Passivas. Não inclui permissão de Técnica Máxima passiva ou revisão de efeitos individuais.

## LR18: Autoria e execução de Técnica e tipos de Feitiço

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 197 a 199 e 201 a 246 (localizadores de expansão).

> O primeiro passo para criar sua Técnica Amaldiçoada é montar o Funcionamento Básico dela.

**Evidência de implementação:** [AftyCreatureBuilder.jsx:4220](../../src/systems/afty/AftyCreatureBuilder.jsx#L4220), TecnicaMotorEditor; [afty-efeitos.js:1242](../../src/systems/afty/afty-efeitos.js#L1242), efeitosDaTecnica coleta linhas; [afty-derive.js:1363](../../src/systems/afty/afty-derive.js#L1363), coleta no pipeline; [afty-feiticos.js:462](../../src/systems/afty/afty-feiticos.js#L462), nivelMaxFeitico.

**Limite da conclusão:** Autoria e percurso de efeitos localizados. Foram lidos Funcionamento Básico, atributo da técnica, orçamento e Passivas, não todas as tabelas de dano, auxiliares, especiais, transformações, rituais ou domínios. Não usar a presença do editor como aprovação de cada tipo. Ambiguidades já têm fila própria em a-fazer.md.
