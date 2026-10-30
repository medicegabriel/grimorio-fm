# Origens e talentos

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR07: Inato como conjunto de benefícios

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 27.

> Um inato aumenta o valor de um atributo em 2 pontos e o de outro em 1 ponto.

**Evidência de implementação:** [afty-origens.js:306](../../src/systems/afty/afty-origens.js#L306), alocador distribuir: 3, maxPorAtributo: 2, e Marca Registrada em 319; [afty-derive.js:798](../../src/systems/afty/afty-derive.js#L798), resolveEscolhasOrigem.

**Limite da conclusão:** A configuração permite +1/+1/+1, decisão do autor registrada na sessão obrigatória de 2026-07-29. Não tratar isso como bug nem como literalidade da página 27. Talento Natural, seleção do Feitiço registrado e custo individual ainda não foram percorridos integralmente nesta leitura.

## LR08: Desenvolvimento Inesperado, distribuição

- Status: **implementado**.
- Sistema e recorte: Player e Afty, decisão própria.
- Fonte: páginas impressas 32.

> A cada quatro níveis, você recebe um ponto de atributo adicional e aumenta seu limite de atributo para o atributo escolhido em 1.

**Evidência de implementação:** [afty-atributos.js:108](../../src/systems/afty/afty-atributos.js#L108), desenvolvimentoTotal; [afty-derive.js:637](../../src/systems/afty/afty-derive.js#L637), desenvSoLimite, desenvValor e nivelExtraDesenv; [afty-atributos.js:150](../../src/systems/afty/afty-atributos.js#L150), pontos extras entram no resumo de nível.

**Limite da conclusão:** Recorte: segregação dos pontos de valor e limite. Player recebe ponto livre, conforme decisão de 2026-10-01 em afty-player.md, não interpretação nova do revisor. Não inclui Energia Antinatural ou validação de todas as alocações importadas.

## LR09: Cobertura completa dos catálogos de origens e talentos

- Status: **pendente**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 26 a 41 e 163 a 170 (localizadores).

Faixa apenas de localização pelo sumário/cabeçalhos. Não atribui prova a cada item dessa faixa.

**Evidência de implementação:** [afty-origens.js:306](../../src/systems/afty/afty-origens.js#L306), entrada localizada; [afty-talentos.js:1334](../../src/systems/afty/afty-talentos.js#L1334), resolveTalentos localizado; [afty-efeitos-conteudo.js:2077](../../src/systems/afty/afty-efeitos-conteudo.js#L2077), Afinidade com Técnica tem vagasFeitico, e Atenção Infalível em 2090 tem atencao.

**Limite da conclusão:** Pendente de leitura e conferência por entrada, não declaração de recurso inexistente. Foram lidos somente Inato, Derivado e começo dos talentos gerais. Um canal numérico não prova a cláusula narrativa inteira, por exemplo imunidade a surpresa de Atenção Infalível.
