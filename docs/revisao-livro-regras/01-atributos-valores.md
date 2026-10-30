# Atributos e valores adicionais

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR01: Métodos de montagem

- Status: **implementado**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 18.

> você recebe seis números fixos para distribuir entre os atributos: 15,14,13,12,10 e 8.

**Evidência de implementação:** [afty-atributos.js:62](../../src/systems/afty/afty-atributos.js#L62), POINT_BUY_COST, POINT_BUY_TOTAL, VALORES_FIXOS e roll4d6DropLowest; [AftyCreatureBuilder.jsx:9364](../../src/systems/afty/AftyCreatureBuilder.jsx#L9364), leitura de attrMethod, resumoAtributos e botão de rolagem em 9453.

**Limite da conclusão:** Recorte: três métodos, custos base e geração de seis valores. Não certifica salvamento, acessibilidade ou todas as combinações de origem.

## LR02: Limites e exceções dos atributos

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 17.

> Por padrão, o limite dos atributos é 20, mas certas habilidades, talentos e características possibilitam que você ultrapasse o desenvolvimento comum e chegue até os 30.

**Evidência de implementação:** [afty-atributos.js:49](../../src/systems/afty/afty-atributos.js#L49), ATTR_LIMITE_PADRAO, ATTR_LIMITE_MAX e ATTR_LIMITE_ABSOLUTO; [afty-derive.js:2176](../../src/systems/afty/afty-derive.js#L2176), passe de atributo permanente, seguido do temporário em 2204.

**Limite da conclusão:** Limites existem. O teto 32 tem origem em conteúdo de alto nível do projeto, não foi demonstrado por esta página. Não foram percorridas todas as fontes que alteram valor e teto.

## LR03: Modificador, Defesa e Iniciativa básicas

- Status: **implementado**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 19, 20 e 282.

> Defesa = 10 + Modificador de Destreza + Metade do seu Nível + Outros Bônus

**Evidência de implementação:** [afty-derive.js:197](../../src/systems/afty/afty-derive.js#L197), mod com Math.floor; [afty-derive.js:3522](../../src/systems/afty/afty-derive.js#L3522), defEscala e defBt separados por sistema, soma em 3531; [afty-derive.js:4085](../../src/systems/afty/afty-derive.js#L4085), Iniciativa sem metade do BT no Player.

**Limite da conclusão:** Recorte: fórmulas base sem poderes. Afty mantém escala por Tipo e BT, conforme decisão própria, não como transcrição do livro. Atenção localizada em 4015, mas seus modificadores não estão cobertos por esta unidade.
