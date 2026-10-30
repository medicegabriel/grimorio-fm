# Descansos, Interlúdios e Votos

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR22: Descanso e recuperação de recursos

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 335.

> Recupera metade do seu máximo de energia amaldiçoada.

**Evidência de implementação:** [ficha/ficha-sessao.js:2323](../../src/systems/afty/ficha/ficha-sessao.js#L2323), descansar enche PV e PE, limpa usos não manuais e recargas; [ficha/BotaoDeDescanso.jsx:6](../../src/systems/afty/ficha/BotaoDeDescanso.jsx#L6), controle único de descanso.

**Limite da conclusão:** O livro separa descanso curto e longo. A função examinada não recebe tipo de descanso. Botão único foi decisão do autor, conforme afty-player.md/automacao-dsl.md e comentário no próprio percurso. A leitura não aprova dados de vida, recuperação parcial ou procedimentos com kits.

## LR23: Interlúdios e Linhas de Treinamento

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 336 e 338 a 346 (localizadores de expansão).

> Durante uma cena de interlúdio, um personagem pode escolher dois focos para o seu tempo, o que confere resultados diferentes, explorados mais abaixo.

**Evidência de implementação:** [afty-treinamentos.js:1050](../../src/systems/afty/afty-treinamentos.js#L1050), efeitosDeTreino; [afty-treinamentos.js:1361](../../src/systems/afty/afty-treinamentos.js#L1361), focosGastos e avaliador de requisito em 1379.

**Limite da conclusão:** Orçamento e emissão localizados. Não foram cotejadas todas as etapas nem o fluxo de testes do Player. A fila já contém Ficha de Player: as etapas de Linha de Treinamento que pedem teste. Não equiparar marca de etapa a teste executado, nem duplicar essa pergunta.

## LR24: Votos, limite e efeitos escritos

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 350 e 351.

> Um personagem pode ter uma quantidade de votos de restrição igual ao seu bônus de treinamento.

**Evidência de implementação:** [afty-votos.js:176](../../src/systems/afty/afty-votos.js#L176), limiteVotosMecanicos usa BT; [afty-votos.js:216](../../src/systems/afty/afty-votos.js#L216), efeitosDeVotos emite benefício e malefício até o limite; [AftyCreatureBuilder.jsx:1796](../../src/systems/afty/AftyCreatureBuilder.jsx#L1796), aba nativa; [afty-derive.js:921](../../src/systems/afty/afty-derive.js#L921), efeitos no montante.

**Limite da conclusão:** Não é subsistema inexistente: há autoria e Motor. Não foram conferidos todos os pesos, domínios de benefício, rupturas, prazos, votos contratuais e restrições congênitas das páginas 352 a 363. Não afirmar que campos livres validam automaticamente a legalidade narrativa do voto.
