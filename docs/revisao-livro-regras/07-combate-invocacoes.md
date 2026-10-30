# Combate e invocações

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR19: Dano normal, crítico e consequências em alvo

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 306 a 309.

> Dano Após Ataque, o qual vem como uma instância separada de dano, somada ao total após a rolagem de dano. O dano após ataque nunca pode ser multiplicado por um crítico.

**Evidência de implementação:** [afty-dano.js:53](../../src/systems/afty/afty-dano.js#L53), formulaModoDano separa modos e grupos; [afty-pericias.js:771](../../src/systems/afty/afty-pericias.js#L771), resolveDano; [ficha/ficha-sessao.js:1808](../../src/systems/afty/ficha/ficha-sessao.js#L1808), aplicaDano localizado.

**Limite da conclusão:** Existe cálculo de fórmulas, mas a aplicação de condições, reação por desastre, resultado de TR e efeitos de grupo de arma no alvo não foi demonstrada nesta leitura. Não confundir expressão de crítico com resolução completa de um ataque. Ver fila CMB02-consequencias e CMB01-reacoes.

## LR20: Invocações, ficha e entrada em campo

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 256 e 257.

> Por padrão, ela permite trazer duas Invocações ao combate.

**Evidência de implementação:** [afty-invocacoes.js:3240](../../src/systems/afty/afty-invocacoes.js#L3240), resolveInvocacao; [ficha/ficha-sessao.js:780](../../src/systems/afty/ficha/ficha-sessao.js#L780), invocaNaMesa e entradaDaInvocacao em 635 localizadas; [ficha/abas/AbaInvocacoes.jsx:1585](../../src/systems/afty/ficha/abas/AbaInvocacoes.jsx#L1585), mostra limite de campo e quantidade por Invocar.

**Limite da conclusão:** Há cálculo e interface, mas só foram lidas as regras introdutórias de obtenção e controle. Não foram auditados integralmente custos, reações, reinvocação, destruição, Hordas, Ações e Características. Um limite mostrado na tela não prova impedimento de excesso.

## LR21: Cobertura integral do capítulo Combate

- Status: **pendente**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 290 a 326 (localizadores).

Faixa apenas de localização pelo sumário/cabeçalhos. Não atribui prova a cada item dessa faixa.

**Evidência de implementação:** [ficha/ficha-sessao.js:2124](../../src/systems/afty/ficha/ficha-sessao.js#L2124), proximaRodada localizada; [afty-derive.js:3531](../../src/systems/afty/afty-derive.js#L3531), Defesa possui consumidor.

**Limite da conclusão:** Pendente de revisão sistemática. Leitura inicial concentrou iniciativa básica e dano/crítico/resistências. Posicionamento, movimento especial, hierarquia de ações, concentração, portas da morte, ferimentos, condições, exaustão e fontes externas não receberam conferência integral. Não afirma que estão ausentes.
