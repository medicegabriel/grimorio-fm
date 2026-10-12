# G00: entrega corrigida para rechecagem

Estado: AUDITADO COM PENDÊNCIAS. Auditoria anterior: REPROVADO. Correções testadas pelo executor, sem aprovação independente da versão atual.

Leia [o relatório da rechecagem](rechecagem/revisao.md), [o registro](registro.json), [o parecer externo](rechecagem/auditoria-externa.md) e [o manifesto de entrega](entrega-sha256.json).

O inventário agora contém 11.900 chaves e 418 catálogos/tabelas, com 51 addons, 118 integrações herdadas e 127 referências de Roubo. Os 32 remendos apontam a regra nativa. Há fontes individuais e reconciliação em duas etapas, sem mudança no aplicativo ou nos addons.

Validação: 156 arquivos e 9.144 asserts passaram; build, lint Afty e lint das ferramentas passaram. O lint geral conserva 748 problemas da entrada; sem .audit, são 22.

Por decisão do autor, MANUAL INTENCIONAL exige motor e autoria em toda parcela de regra ou procedimento. Achado 9 aguarda decisão sobre a instrução geral de sincronização. A pendência está somente em docs/a-fazer.md, chave G00-auditoria-independente.

As sete parcelas administrativas G00 permanecem com evidência NÃO VERIFICADA nesta versão. Os vereditos históricos estão preservados no registro. Os demais 11.893 itens e 257 lotes continuam NÃO REVISADO. Navegador e reprodução de autoria do jogador não foram executados nesta correção administrativa.

## Entrega do bloco de 2026-10-07

O G00 entrou no bloco de execução G00, M01 a M05, P01, CMB-01 e CMB-02. Estado conservado: AUDITADO COM PENDÊNCIAS, aguardando rechecagem.

- **Reconciliação** pelo mecanismo: `G00/rechecagem/proposta-02.json`, 10 adições com dono confirmado pelo irmão de cada item (canal `vantagemAtaque` e grupo, M01; estado e variável `golpePreciso`, M03; linha do Golpe, CMB-02; divergência `requisitoMulticlasse`, M02; `ALCANCES_DE_CURA`, M05) e 49 atualizações de conteúdo. Nenhum lote aprovado invalidado. Lotes atingidos fora do bloco: TAL-02 (catálogo de Talentos, pelo caminho `efeitos[].alvo`) e TAL-04 (Adepto de Combate, pela marca `naoAcumulaEntreFontes` no pool emprestado).
- **Documentação**: a afirmação "nenhum assert escreve" (achado preservado da auditoria) foi corrigida em `asserts/LEIA.md` e no CLAUDE.md. O achado 9 segue em docs/a-fazer.md.
- **Controle**: `campanha.json` recebeu PARCIAL nos oito lotes executados, cada um com registro e manifesto próprios.
- **Preservação**: registro, manifesto e revisão anteriores copiados para `G00/rechecagem/entrada-preservada-2026-10-07/`.
- **Revalidação**: `hashesConsultados` continua sendo o snapshot das provas antigas do G00. Os avisos de dependência alterada (arquivos do Motor, testes e docs mexidos pelo bloco) são legítimos e pedem rechecagem.
- Evidências do bloco: `docs/revisao-automacao/bloco-2026-10-07/`.

