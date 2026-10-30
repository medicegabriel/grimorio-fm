# Testes, perícias e níveis de aptidão

Primeiro recorte de 2026-10-29. Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Critérios e limites no [README](README.md).

Os títulos abaixo nomeiam unidades de análise, não substituem o texto das regras. Status obtido por leitura estática, sem teste ou auditoria independente.

## LR10: Escala básica dos testes

- Status: **implementado**.
- Sistema e recorte: Player, comparação Afty.
- Fonte: páginas impressas 278 a 280.

> Bônus de Perícia = Modificador do Atributo Chave da Perícia + Metade do Nível do Personagem + Bônus de Treinamento (se treinado) + Outros Bônus

**Evidência de implementação:** [afty-pericias.js:1456](../../src/systems/afty/afty-pericias.js#L1456), resolveTestes, bonusDe, meioNivel e escalaDosTestes; [afty-pericias.js:1923](../../src/systems/afty/afty-pericias.js#L1923), linha de ataque usa escalaFixa e BT condicionado a treinado.

**Limite da conclusão:** Recorte: composição da parcela fixa dos testes. Não inclui todos os modificadores de arma, maestria especial, d20 natural nem resolução de sucesso contra CD. Afty mantém outras escalas por decisão própria.

## LR11: CD e separação entre classe e técnica

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 44, 172 e 280.

> Para aptidões amaldiçoadas e Feitiços, usa-se o seu atributo principal para uso do jujutsu (veja Criação de Personagem na página 24).

**Evidência de implementação:** [afty-derive.js:3086](../../src/systems/afty/afty-derive.js#L3086), cdEscala e cd usam modTecnica, com cdFeitico adicional em 3091.

**Limite da conclusão:** A CD da técnica está presente. O percurso usa cd compartilhada para classe e aptidão, exceto canal adicional de Feitiço. Separação de CD de Especialização está adiada pelo autor, conforme entrada existente em a-fazer.md. Esta decomposição não reabre a decisão.

## LR12: Níveis de aptidão e concessões excedentes

- Status: **parcial**.
- Sistema e recorte: Player e Afty.
- Fonte: páginas impressas 173 e 366.

> Todas as aptidões variam do nível 0 até nível 5.

**Evidência de implementação:** [afty-aptidoes.js:1689](../../src/systems/afty/afty-aptidoes.js#L1689), resolveNiveisAptidao separa alocado, concedido, efetivo, gastos e limite; [afty-derive.js:4105](../../src/systems/afty/afty-derive.js#L4105), ramo aptidaoAlem20.

**Limite da conclusão:** Há resolvedor de níveis com teto e concessão prioritária. Esta leitura não certifica conversão de excedentes da página 366 nem todas as aquisições. A progressão além de 20 do Afty não deve ser imputada ao Player padrão. Também não cobre cada Aptidão Amaldiçoada das páginas 174 a 194.
