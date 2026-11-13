# G00: correções para rechecagem independente

O lote permanece AUDITADO COM PENDÊNCIAS. O parecer externo foi REPROVADO; as correções desta versão foram verificadas pelo executor e ainda precisam de rechecagem independente. O achado 6 foi decidido pelo autor: exigir motor e autoria em toda parcela. O achado 9 continua aguardando decisão sobre a regra geral de sincronização no CLAUDE.md, na entrada única G00-auditoria-independente de docs/a-fazer.md.

## Diferenças da entrada para esta versão

| Medida | Entrada da correção | Versão corrigida |
| --- | --- | --- |
| Chaves inventariadas | 11.598 | 11.900 |
| Catálogos e tabelas | 400 | 418 |
| Addons | 51 | 51 |
| Integrações herdadas | 118 | 118 |
| Referências de Roubo | 127 | 127 |
| Remendos ligados à regra original | 0 de 32 | 32 de 32 |
| Módulos de dados importados | 76 na raiz | 83, incluindo 7 de subpastas |
| Suíte | 155 arquivos, 9.097 asserts | 156 arquivos, 9.144 asserts |

As 302 adições explicitam constantes e dados de módulos já existentes. Não foram acrescentadas habilidades ao aplicativo. Nenhum arquivo de src/, addon, dado oficial, prévia, ficha ou armazenamento pessoal foi alterado nesta correção. Donos e estados anteriores foram preservados; as sete entradas administrativas G00 passaram a AUDITADO COM PENDÊNCIAS. As demais 11.893 chaves continuam NÃO REVISADO.

## Tratamento dos achados

1. Hashes de artefatos entregues e de arquivos consultados foram separados. Divergência de consulta gera revalidação das parcelas ligadas. Só artefatos da entrega aguardando auditoria bloqueiam a estrutura. O manifesto externo também protege o registro e outros arquivos que não podem guardar o próprio hash.
2. revisao:reconciliar propõe e depois aplica uma alteração. Cada adição exige dono confirmado, cada remoção exige justificativa, renomeações mantêm tombstones. Donos e estados existentes são preservados. Mudança que atinge lote aprovado devolve esse lote e seus itens aprovados para EM REVISÃO e preserva a auditoria anterior. Propostas obsoletas, payload alterado e donos incompatíveis com referência ou pai são recusados antes de gravar.
3. Os 32 remendos apontam regraOriginal e proprietarioOriginal; as regras nativas apontam remendadoPor. Liberações soPorAddon também vinculam a regra nativa e liberadoPor. Aprovar exige provaIntegracao com as chaves e evidências dos vínculos atingidos.
4. A coleta percorre subpastas. escopo.json classifica 7 módulos adicionais como DADOS e 6 como INTERFACE, com justificativas. Módulo novo sem classificação gera erro. FONTE_GUARDA e as oito CONDICOES_QUEBRAM_GUARDA estão no inventário.
5. fontes.itens registra localização por identidade, sem transformar faixa de família em citação individual. Nas 18 mal_* de APT-12, APT-13 e APT-14, somente Regeneração Corporal foi localizada no Grimório, página impressa e PDF 70. Habilidades Gerais não recebem a página 20 de Dotes. Das 45 características de invocação, 4 tabelas foram localizadas no Markdown (272 e 273), 40 declaram Adicionais e ficam ADIADA, e 1 declara casa. Estabilidade fica NÃO LOCALIZADA; Pingente de Amaterasu fica DA CASA; Agilidade [2.0] e Alma Livre ficam ADIADA. As páginas indevidas foram retiradas dessas atribuições. Localização não aprova regra ou comportamento.
6. O autor respondeu: “Não, exigir motor e autoria em toda parcela”. MANUAL INTENCIONAL exige motor INTEGRADO, autoria acessível, provaAutoria e justificativaManual em toda parcela de regra ou procedimento. O N/A administrativo restrito às sete parcelas G00 não cria uma exceção para procedimento de jogo.
7. Fonte externa ausente, hash divergente e marcadores inválidos retornam diagnóstico estruturado. A checagem do inventário continua; a revisão exige revalidar a fonte antes de aprovar regras. A ausência do livro foi reproduzida em cópia descartável, com estrutura PASSOU e diagnóstico FONTE_INDISPONIVEL, sem pilha de erro.
8. Habilidade nova sem propriedade conhecida fica sem sugestão, em vez de receber P01 por padrão do módulo. O fluxo real com uma habilidade descartável de Lutador foi exercitado em cópia isolada.
9. Aguarda resposta do autor. A regra geral de sincronização não foi alterada novamente nesta correção. Não houve fetch, mudança de base, commit ou envio.
10. CLAUDE.md identifica as dependências Vite versionadas em .audit/lote02-vite-*/deps. O lint geral mantém 748 problemas; excluindo .audit/**, são 22 (10 erros e 12 avisos). Nenhuma dependência versionada foi removida e o comando padrão foi preservado.

## Parcelas e estados

| Parcela | Parecer externo sobre a entrega anterior | Evidência desta versão |
| --- | --- | --- |
| inventario | REPROVADO | NÃO VERIFICADA, correções testadas pelo executor |
| fontes | REPROVADO | NÃO VERIFICADA, localizações individuais registradas |
| cobertura | REPROVADO | NÃO VERIFICADA, regressões e fluxo real passaram |
| linha-base | APROVADO | NÃO VERIFICADA nesta versão, nova validação executada |
| registro | APROVADO antes da atualização; depois INCONCLUSIVO | NÃO VERIFICADA, histórico conservado |
| pendencias | APROVADO | NÃO VERIFICADA nesta versão, uma entrada na fila |
| passagem | INCONCLUSIVO | NÃO VERIFICADA, novos hashes emitidos para rechecagem |

As fontes de regra, execução de jogo, motor, autoria e integração de cada habilidade continuam fora da aprovação G00. Não se reproduziu habilidade por interface do jogador. A configuração nova é administrativa: o executor revisa a proposta, confirma donos e motivos e aplica a reconciliação. Navegador, Criador, Ficha Final, Encontros, desktop e móvel não foram executados, pois a correção não altera telas ou lógica de jogo.

## Validação e evidências

A suíte final passou com 156 arquivos e 9.144 asserts. As 47 regressões novas cobrem reconciliação, metadados após JSON, invalidação de aprovação, hashes consultados, manifesto externo, fontes ausentes, manual intencional, integração, subpastas e localização de fontes. Os 35 testes anteriores do G00 e os 24 de fontes também passaram.

Build PASSOU, com o mesmo aviso de chunk acima de 500 kB. Lint Afty e lint das ferramentas PASSOU. Lint geral FALHOU com os mesmos 748 diagnósticos da entrada; a comparação normalizada foi idêntica. Lint sem .audit FALHOU com 22 problemas. Ordem dos módulos e os dois testes fora do lançador passaram.

A reprodução isolada testou fonte ausente, adição de habilidade, proposta, aplicação e renomeação. A cobertura acusou o conteúdo novo antes da reconciliação e passou depois. Os 11.900 donos e estados existentes foram preservados. Evidência: reproducao-isolada.json. As cópias descartáveis foram removidas após preservar os resultados.

A cobertura final passa com saída 0; revisao:revisoes mantém a saída 2 esperada, sem aprovar as 11.900 chaves. revisao:reconciliar informa 0 adições, 0 remoções e 0 atualizações. Os logs e metadados finais estão nesta pasta.

## Preservação e passagem

entrada.json conserva 772 hashes e o estado inicial. O manifesto de entrada tinha 387 hashes correspondentes naquele momento. Logo depois, às 20:19 UTC, AGENTS.md, o registro histórico da atualização da fonte e o manifesto anterior receberam mudanças externas. Esses bytes foram preservados em alteracoes-externas/, com hashes e horários em alteracoes-externas.json. A ocorrência histórica das 17:11 narrada no parecer não foi apresentada como divergência da entrada desta correção.

preservacao.json distingue mudanças desta correção, mudanças externas detectadas e arquivos idênticos. arquivos-alterados.json e arquivos-examinados.json dão o escopo da leitura e da edição. Consumo automático de dados e execução de teste não equivalem a auditoria semântica de cada regra.

O auditor deve começar por entrega-sha256.json, ler o parecer externo e este relatório, conferir os hashes e executar os comandos e contraprovas. Deve conferir os achados corrigidos, a decisão do achado 6 e a pendência do achado 9. Os 18 domínios e os 11.900 donos ainda exigem a revisão pertinente; a coleta não substitui esse julgamento. A fonte canônica externa conserva o SHA-256 autorizado e não foi copiada nem alterada. Fontes externas adiadas pelo autor não devem ser cobradas novamente neste G00.

A partir da emissão do novo manifesto, esta versão aguarda rechecagem por leitura. Qualquer edição posterior exige novo pacote de hashes. O executor não aprovou o próprio trabalho.
