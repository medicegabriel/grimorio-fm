# Inventário e equipamentos

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR13: Cálculo de carga e penalidades

- Status: **implementado**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 129.

> Você tem um limite de carregamento de 8 espaços + o dobro do seu modificador de força (ou -2 por modificador de Força negativo).

**Evidência de implementação:** [afty-equipamentos.js:207](../../src/systems/afty/afty-equipamentos.js#L207), capacidadeCarga e penalidades -5 e -4.5; [afty-equipamentos.js:3163](../../src/systems/afty/afty-equipamentos.js#L3163), resolveCarga produz limite, dobro e penalidades; [afty-derive.js:2796](../../src/systems/afty/afty-derive.js#L2796), resolveCarga lê Força final, Defesa em 3531.

**Limite da conclusão:** Recorte: conta a partir de espacosUsados já resolvido. Não certifica o espaço de cada item. Acima do dobro vira indicador, não bloqueio rígido, portanto este status não abrange a proibição de carregar excesso.

## LR14: Inventário completo próprio do Player

- Status: **parcial**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 128 a 130.

> Um personagem inicia com: dois equipamentos de custo 1 (arma, escudo ou item especial), um uniforme comum e um kit de ferramentas a sua escolha.

**Evidência de implementação:** [afty-equipamentos.js:2669](../../src/systems/afty/afty-equipamentos.js#L2669), resolveEquipamentos; [afty-equipamentos.js:3182](../../src/systems/afty/afty-equipamentos.js#L3182), orcamentoDoGrau indicativo; [afty-sistema.js:842](../../src/systems/afty/afty-sistema.js#L842), inventarioSimplificado conserva ativa: false.

**Limite da conclusão:** Existem inventário e cálculos, mas o desvio declarado para inventário completo do jogador não está ligado. Isso não significa que todos os itens ou tabelas estejam ausentes. Aquisição inicial e reposição por missão não foram validadas de ponta a ponta.

## LR15: Armas, uniformes, escudos, ferramentas e encantamentos por entrada

- Status: **pendente**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 131 a 161 (localizadores).

Faixa apenas de localização pelo sumário/cabeçalhos. Não atribui prova a cada item dessa faixa.

**Evidência de implementação:** [afty-equipamentos.js:2669](../../src/systems/afty/afty-equipamentos.js#L2669), resolvedor localizado, sem auditoria de todo o catálogo.

**Limite da conclusão:** Pendente de revisão granular. Não foram cotejadas tabelas completas, propriedades especiais, níveis de dano, consumíveis e encantamentos. Localização de módulo não é prova semântica e não rende crédito de implementação.
