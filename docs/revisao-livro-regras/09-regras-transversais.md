# Cálculos, acúmulo e recursos temporários

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR25: Arredondamento das fórmulas básicas examinadas

- Status: **implementado**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 365.

> A menos que indicado o contrário, o resultado de toda divisão terá o seu arredondamento feito para baixo.

**Evidência de implementação:** [afty-derive.js:197](../../src/systems/afty/afty-derive.js#L197), mod usa Math.floor; [afty-derive.js:2813](../../src/systems/afty/afty-derive.js#L2813), metadeDoNivel usa Math.floor; [afty-pericias.js:1460](../../src/systems/afty/afty-pericias.js#L1460), meioNivel usa Math.floor.

**Limite da conclusão:** Recorte fechado: somente modificador e metade de nível usados nas unidades LR03 e LR10. Não certifica toda divisão da DSL, todas as regras de cura, dano ou arredondamentos de suplementos. Não há crédito duplicado: LR03/LR10 cobrem composição, LR25 cobre política de arredondamento.

## LR26: Disputa de fontes e rastreio do Motor

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 365.

> Caso haja dois efeitos iguais vindo da mesma fonte, considere apenas o maior entre eles: no exemplo da Presença Inspiradora, se um dos Suportes possuir um bônus maior que o outro, você receberia apenas o bônus dele.

**Evidência de implementação:** [afty-efeitos.js:1722](../../src/systems/afty/afty-efeitos.js#L1722), aplicarEfeitos; [afty-efeitos.js:1829](../../src/systems/afty/afty-efeitos.js#L1829), resolverExclusivos agrupa canal, alvo, sinal e família; [afty-derive.js:928](../../src/systems/afty/afty-derive.js#L928), consumidor no montante.

**Limite da conclusão:** Disputa existe, com diferenças intencionais por sistema e blocos de Estilo. Não foi conferida cada família, integração de pacotes ou interação de alvo global com específico. Ver pergunta existente BLOCO-2026-10-07-perguntas, item 4. Não equivale a auditoria do Motor.

## LR27: PV e PE temporários

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 366.

> Caso já possua pontos de vida ou energia temporários e receba outros, você deve manter apenas o maior valor, substituindo ao invés de acumular.

**Evidência de implementação:** [ficha/ficha-sessao.js:1486](../../src/systems/afty/ficha/ficha-sessao.js#L1486), drenaPvTemp, drenaPeTemp em 1538 e aplicaPeTemporario em 1583 localizados; [ficha/ficha-sessao.js:2323](../../src/systems/afty/ficha/ficha-sessao.js#L2323), descanso remove as fontes temporárias.

**Limite da conclusão:** Armazenamento e operações existem, mas não foi percorrido o teto de metade do máximo, substituição de toda fonte, exceções de acúmulo nem interação com Guarda. Localização destas funções sustenta presença de infraestrutura, não correção completa da página 366.
