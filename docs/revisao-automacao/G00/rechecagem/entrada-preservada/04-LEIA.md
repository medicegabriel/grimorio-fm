# Revisão de automação: controle da campanha

O manifesto recebido é o ponto de partida. Todos os 258 lotes começaram em NÃO REVISADO. G00 entrega o inventário e o protocolo; nenhum catálogo fica aprovado por ter sido localizado ou por passar na suíte.

## Arquivos do controle

- `manifesto-inicial.json`, `mapa-opcoes-inicial.json` e `inventario-inicial.json`: cópias preservadas do pacote de 2026-10-05.
- `schema-registro.json`: schema vigente, compatível com o recebido e acrescido dos campos de versão e citação da fonte em 2026-10-05. Os campos e enums comuns não devem ser renomeados.
- `campanha.json`: estado de implementação e estado de auditoria separados para cada lote.
- `inventario.json`: proprietário único, referência canônica, hash do dado e estado por chave.
- `inventario-vivo.json`: coleta materializada na entrega do G00, sem implicar revisão de regra.
- `reconciliacao.json`: comparação com o pacote, componentes explicitados, remoções e renomeações.
- `escopo.json`: donos dos componentes que o mapa inicial não cobria e domínios contextuais.
- `fontes.json`: fontes por família/lote, versões internas e rótulos dos arquivos separados.
- `dominios-dinamicos.json`: universos de opções, consumidores e casos a verificar.
- `G00/revisao.md` e `G00/registro.json`: entrega do executor, ainda aguardando auditoria.
- `G00/entrega-sha256.json`: hashes da entrega, inclusive os arquivos que não podem guardar seu próprio hash.

## Inventário e revisão são verificações diferentes

A partir da raiz do repositório:

```text
npm run revisao:inventario
npm run revisao:cobertura
npm run revisao:revisoes
npm run revisao:inventario -- --json
npm run revisao:cobertura -- --json
```

O inventário e a cobertura são somente leitura. Cada execução do comando usa um processo isolado, entra pelo derive e aplica cada addon separadamente, sem armazenamento pessoal. O comando não escreve registros, instala biblioteca, altera fichas ou aprova regras.

`revisao:cobertura` sai com 0 quando identidades, proprietários, referências, hashes e estruturas estão coerentes. Ainda imprime revisão ausente. Sai com 1 ao detectar item novo sem registro, órfão, duplicação, conteúdo alterado, domínio sem protocolo ou inconsistência nos registros. `revisao:revisoes` também sai com 2 enquanto houver conteúdo sem aprovação ou lote sem registro. Essa saída 2 é esperada na abertura da campanha.

A coleta descobre dados exportados dos módulos `afty-*.js` na raiz do sistema, inclusive tabelas, Sets, aliases e arrays vazios. Expande recursivamente escolhas, efeitos, requisitos, etapas e pools dentro das entradas. Inspeciona todas as chaves dos 51 JSONs de addons e materializa as habilidades herdadas por instalação isolada. Os seletores que dependem da ficha têm domínios contextuais explícitos, com arquivos e funções; não se afirma que todos os valores de um domínio aberto foram testados.

Funções encontradas como dado são identificadas e recebem hash de seu texto, sem executá-las. Uma função nova ou um seletor interno novo precisa ser incorporado ao protocolo pelo lote do mecanismo. A coleta não é prova de que um consumidor executa corretamente uma regra.

`HABILIDADES_ROUBAVEIS` é subconjunto de referências. Reexports e opções compartilhadas apontam para uma identidade canônica. Cada clone herdado tem um proprietário de integração e conserva o proprietário da regra original. Referência exige prova de integração, mas não duplica aprovação da regra original.

Valores sem id usam value/key ou posição. Valores primitivos repetidos carregam posição na chave. Reordenação exige comparação de hashes e rastreabilidade, sem descartar o registro anterior.

## Registro por parcela

Antes de editar, liste todos os itens e parcelas do lote. Use `schema-registro.json` e o inventário, sem renomear campos ou estados. Grave `[LOTE]/registro.json` e `[LOTE]/revisao.md` somente quando o executor iniciar a revisão real. A ausência dos demais registros é uma pendência de revisão que o verificador deve continuar mostrando.

Em cada parcela, preencha:

1. Identificação: chave, id, nome, sistemas por rulesVersion, aquisição e opções internas.
2. Fontes: caminho, versão por SHA-256, página impressa pelo marcador do Markdown e decisão vigente. Página PDF só cabe em desempate documentado ou no Grimório das Maldições. Catálogo e addon não bastam como prova independente.
3. Regra: efeito, alvo, condição, fórmula, dado, arredondamento, escalonamento, limite, acúmulo, ação, custo, usos e duração. N/A leva justificativa específica.
4. Percurso: configuração, catálogo, coletor/contexto, primitiva/canal, consumidor, resultado/fontes, acionamento/sessão e telas, com arquivos e funções atuais.
5. Estados separados: regra, execução, motor, autoria e evidência, usando os enums recebidos.
6. Provas: cenários pertinentes, resultados e passos reais. A prova do contrato de dados fica separada da prova de interface ou addon acessível ao jogador.
7. Manutenção: dependências de canais, variáveis, aquisição, sessão, editor, persistência e integrações. Informe quais mudanças invalidam a prova.
8. Base: commit, alterações preexistentes, SHA-256 inicial/final, comandos e intervalo de validação.

Para G00, motor e autoria de habilidade não se aplicam às sete parcelas administrativas. O registro conserva os enums recebidos, usa PARCIAL e INACESSÍVEL de forma conservadora e justifica N/A em campos adicionais. Isso não representa lacuna nem aprovação de um recurso do aplicativo.

PASSOU em uma prova é resultado de execução. Evidência continua NÃO VERIFICADA até a revisão pertinente. O estado da entrega é IMPLEMENTADO, AGUARDA AUDITORIA. APROVADO exige auditoria independente, hashes examinados da mesma entrega, cobertura de cada item/parcela aplicável e critérios semânticos satisfeitos. O verificador não substitui o julgamento do auditor.

## Mudanças de inventário e pendências

Não regenere `inventario.json` ou `campanha.json` para zerar estados. Capture o vivo, compare chaves e hashes, registre os novos itens e seu proprietário, explique remoções, conserve aliases e invalide a aprovação das parcelas atingidas. Atualize manualmente a reconciliação e os registros em escopo. Não mova silenciosamente a propriedade de uma regra.

Toda pendência ativa e pergunta de regra fica exclusivamente em `docs/a-fazer.md`. O registro guarda link/chave, não uma fila paralela. Não reescreva entrada de outra pessoa. Acrescente nota quando precisar registrar informação nova. Ao resolver, retire a entrada e registre a implementação no guia ou histórico.

O autor adiou em 2026-10-05 as fontes externas não localizadas, incluindo F&M 2.0, Livro do Narrador e homebrews. Preserve a marcação de fonte adiada. Não volte a pedir essas fontes neste G00, não invente regra e não aprove a parcela por falta de erro.

## Passagem para o auditor

Uma pessoa ou chat edita por vez nesta árvore. Não há serviço, trava automática ou coordenação externa.

O executor encerra as edições, confere status/diff contra a entrada, executa validações, registra arquivos examinados e seus hashes finais e produz `entrega-sha256.json`. Arquivo de registro não inclui seu próprio hash; o manifesto de entrega guarda esse hash. O manifesto também não tenta guardar seu próprio hash.

O auditor recebe a mensagem de entrega e trabalha por leitura e resultados em chat. Primeiro verifica os hashes, depois os comandos e cada parcela. Não edita código ou docs durante a auditoria. Se algum hash mudar, registra a versão divergente e pede uma entrega estável. Não considera a aprovação antiga prova da versão nova.

O executor retoma as edições após receber os achados, aplica apenas correções confirmadas no escopo, atualiza a fila única e revalida parcelas e consumidores atingidos. Entrega novos hashes para rechecagem. Auditoria independente não foi executada pelo próprio executor.

Mensagem de passagem:

> O executor entregou G00 em IMPLEMENTADO, AGUARDA AUDITORIA. Leia G00/revisao.md e registro.json, confira entrega-sha256.json e a linha de entrada preservada, execute a cobertura, o assert G00 e os comandos de validação. Verifique inventário, fontes, estados e integridade das alterações alheias. Entregue achados em chat, sem editar esta árvore.

## Decisões vigentes que o histórico não pode reabrir

- Sistema vem de creature.rulesVersion; a rota só define a ficha nova.
- Divisão arredonda para baixo salvo exceção expressa.
- A separação de CD de Especialização foi adiada pelo autor.
- Texto da Fonte Entrópica e decisões por fase têm precedência dentro daquele addon; fases 2b a 5 não são liberadas por uma dependência no manifesto.
- Lapidação Prateada, ritual de Estilo e outros procedimentos adiados conservam a decisão registrada. Uma marca antiga de mesa não prova que as consequências objetivas estão integradas.
- O vermelho de invocações mencionado no CLAUDE antigo é histórico. A linha de entrada do G00 passou integralmente.
- Mudanças em src/components e dados oficiais continuam restritas por AGENTS.md. G00 não cria exceção.



## Fonte de regras vigente a partir de 2026-10-05

Leia o Livro de Regras 2.5.2 em `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, fora do repositório. Confirme a leitura desse caminho e o SHA-256 antes de revisar. A versão válida é `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`; registre-a em `fonteLivroRegras.sha256` e nos hashes inicial/final do lote, com o caminho absoluto. Nas parcelas que usam o livro, registre esse hash em `fontes[].versao` ou `fontes[].sha256`.

Busque o texto no Markdown e cite a página impressa pelo último `<!-- página N -->` acima do trecho, inclusive para tabelas e continuações. O número da linha do Markdown não é página. Use `paginaImpressa` e `marcadorPagina` no registro da fonte. O PDF `public/docs/F&M 2.5.2 - Livro de Regras.pdf` serve somente para desempate: registre a dúvida concreta e o trecho comparado, mantendo o Markdown como fonte principal. O Grimório das Maldições continua em `public/docs/F&M 2.5.2 - Grimório das Maldições.pdf`.

A proveniência e as correções estão em `C:/Projetos/Grimorio/_backup-livro/correcoes.md`. Cópias antigas do Markdown não servem como prova, pois continham paráfrases e números incorretos, inclusive na página 270. Preserve os erros do próprio livro; divergência real segue a fila e as decisões do autor. Não copie U+2014 para arquivos do repositório, nem altere ou copie a fonte externa.

O protocolo legível por máquina é `docs/revisao-automacao/fonte-livro-regras.json`. Mudança, ausência ou hash divergente da fonte exige revalidação dos lotes e dependentes. Registros de consultas anteriores ao PDF são históricos: esta atualização não transforma essas consultas em leitura do Markdown e não aprova regras.
