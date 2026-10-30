# Progressão e especializações

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR04: Requisito de multiclasse

- Status: **implementado**.
- Sistema e recorte: Player.
- Fonte: páginas impressas 47.

> Para o fazer, você deve atender os requisitos para Multiclasse especificados nas características da outra especialização que deseja.

**Evidência de implementação:** [afty-especializacoes.js:1031](../../src/systems/afty/afty-especializacoes.js#L1031), faltaRequisitoMulticlasse e multiclassesSemRequisito em 1044; [AftyCreatureBuilder.jsx:11180](../../src/systems/afty/AftyCreatureBuilder.jsx#L11180), seletor usa derived.attrPermanente.

**Limite da conclusão:** Recorte: checagem do requisito para nova escolha e diagnóstico de classe já gravada. Não declara a multiclasse inteira aprovada. A aplicação à criatura continua pergunta existente na fila, BLOCO-2026-10-07-perguntas, item 1.

## LR05: PV por classe e subida de nível

- Status: **parcial**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 20, 46 e 47.

> Seus pontos de vida máximos aumentam, podendo ser tanto através de uma rolagem do dado de vida da especialização ou escolhendo seguir pelo valor fixo.

**Evidência de implementação:** [afty-especializacoes.js:344](../../src/systems/afty/afty-especializacoes.js#L344), pvDaClasse usa pvPrimeiro e pvPorNivel; [afty-derive.js:2817](../../src/systems/afty/afty-derive.js#L2817), soma por classe no Player, base por Tipo na criatura e Constituição em 2864.

**Limite da conclusão:** Valor fixo demonstrado. pvDado existe no catálogo, mas o percurso examinado não lê rolagens por nível. A escolha entre rolar e fixo é pergunta já registrada: BLOCO-2026-10-07-perguntas, item 2. Não presumir ausência de toda a mecânica de dados de vida.

## LR06: PE base por níveis de classe

- Status: **implementado**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 21 e 47.

> Seus pontos de energia amaldiçoada máximos aumentam em uma quantidade igual ao valor da nova especialização.

**Evidência de implementação:** [afty-especializacoes.js:360](../../src/systems/afty/afty-especializacoes.js#L360), peDaClasse multiplica pePorNivel pelos níveis; [afty-derive.js:2937](../../src/systems/afty/afty-derive.js#L2937), soma das classes e modTecnicaNoPE em 2958.

**Limite da conclusão:** Recorte: contribuição base das classes e não repetição do modificador pela quantidade de classes. Não certifica cada atributo-chave, Estamina, Votos ou todas as parcelas finais. Afty usa coeficientes por Tipo.
