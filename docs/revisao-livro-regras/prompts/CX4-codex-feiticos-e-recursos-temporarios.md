# CX4: Feitiços e recursos temporários

Você está num chat novo do Codex. Quero que execute o lote CX4 do fechamento do Livro de Regras no Grimório, começando pela verificação de que o trabalho pedido faz sentido na base atual, antes de programar.

## Antes de programar: verificar se o pedido faz sentido

Você está num chat novo. Não presuma que a análise anterior continua correta ou que uma pendência significa ausência de código. Primeiro confira o lote no livro, nas decisões e na implementação atual. Não altere código do produto antes de publicar um diagnóstico inicial.

Trabalhe no repositório C:/Projetos/Grimorio/grimorio-tracker. Leia AGENTS.md e CLAUDE.md. Siga a ordem obrigatória de contexto: em docs/afty-status.md, a seção SESSÃO DE 2026-07-29 e Contexto rápido, depois docs/automacao-dsl.md e docs/afty-formulas-base.md. Em seguida consulte as sessões recentes, docs/a-fazer.md, docs/afty-player.md e os guias específicos da área.

Leia também:
- docs/revisao-livro-regras/10-analise-aprofundada-2026-10-29.md.
- docs/revisao-livro-regras/11-matriz-talentos-2026-10-29.md.
- A divisão vigente de nove lotes em docs/a-fazer.md e as entregas anteriores que o seu lote consome.

Use diretamente C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md. Confirme o SHA-256 esperado 1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a. Se divergir, esclareça a versão válida, sem restaurar, editar ou substituir o livro. Cite a página impressa pelo último marcador de página acima da regra. Relatórios, comentários antigos, snapshots e testes não substituem a fonte.

Confira a situação local e remota sem mover a base durante trabalho concorrente. Registre a revisão e as alterações locais relevantes. Não faça pull, merge, reset, stash, commit ou push automaticamente. Os números de testes e a diferença do remoto escritos na análise são históricos: meça a base atual.

Para cada parcela a modificar, verifique:
- O que o livro exige e quais decisões posteriores do autor se aplicam.
- O caminho real: escolha/configuração, requisito, efeito, cálculo, consumidor, sessão, tela e salvamento, conforme pertinente.
- Uma reprodução admissível, com origem, nível, pré-requisitos, escolhas, equipamento e orçamento válidos, usando o percurso real da ficha.
- Se o recurso existe por outro módulo, configuração ou tratamento específico. Uma chave ausente no mapa de efeitos não prova ausência.
- Se a proposta respeita o propósito do site e pode reutilizar o sistema atual, sem mecanismo paralelo ou reescrita desnecessária.

Apresente uma tabela curta de verificação com parcela, página/decisão, evidência atual e veredito: implementar/corrigir, já coberto, falso positivo, divergência intencional, depende de decisão ou depende de entrega. Explique o menor desenho que resolve os casos confirmados. Em lotes extensos, aprofunde por família antes de editar aquela família, mantendo o diagnóstico inicial do conjunto.

Depois dessa verificação, prossiga com as parcelas confirmadas, dentro deste escopo, sem parar apenas para pedir aprovação genérica do plano. Se houver dúvida material de regra ou falta de autorização, pergunte somente sobre ela, registre a pendência específica e avance no trabalho independente. Não invente a resposta e não reabra decisões já respondidas. Corrija a classificação de um achado refutado com evidência.

## Execução e colaboração

- Execute somente este lote. Preserve o que já funciona, os addons e as fichas antigas. A regra vem de creature.rulesVersion, nunca da rota. Confira Player e Afty respeitando as diferenças autorizadas, sem aplicar automaticamente ao Afty toda regra exclusiva do Player.
- O produto deste trabalho fica em src/systems/afty/, com testes e documentação correspondentes. Preserve as áreas somente-leitura definidas em AGENTS.md, incluindo src/components/. Não promova o G2, não altere a abertura diária e não publique nada.
- Construa com categorias, tabelas, escolhas e Motor existentes. Personalizado e Funcionamento Básico não são atalhos para esconder uma implementação que o sistema nativo deve representar.
- Texto de regra segue a fonte. Preserve o estilo da interface. Não acrescente explicações soltas, redesenho visual, caractere U+2014 ou ponto e vírgula em textos de UI. Números derivados precisam de fontes coerentes.
- Antes de editar, reserve na fila os arquivos e o lote em andamento. Um editor por vez em arquivos centrais e documentação, mesmo que as regiões sejam diferentes. Se um arquivo estiver reservado, avance em módulos independentes e aguarde a liberação para integrá-lo.
- Leia a implementação real das dependências. Uma API planejada ou um relatório dizendo concluído não basta. Não crie stubs, contratos incompatíveis ou outro motor para contornar uma dependência ausente.
- Claude entrega os núcleos, com operações, estado persistido, recusas, testes e pontos de integração. Codex assume a maior parte do conteúdo, das telas e da integração. Só altere essa fronteira se a verificação demonstrar necessidade, documentando a mudança.
- Reutilize as operações já entregues e preserve trabalho concorrente ao integrar. Não envie mensagens nem inicie outros chats por conta deste prompt.

## Verificação e entrega

Estabeleça a linha de base dos testes antes de alterar comportamento. Reproduza defeitos confirmados e faça verificações significativas de regra, operação, falha, duração, salvamento e compatibilidade aplicáveis. Não enfraqueça assert para fazê-lo passar. Execute os testes afetados, npm run asserts, npx eslint src/systems/afty/ e npm run build conforme as instruções do repositório. Mudança de imports exige também node asserts/t-ordem-modulos.mjs.

Confira no navegador os percursos alterados, inclusive Ficha/Encontro e larguras relevantes quando houver interface. Use dados de teste isolados, sem regravar fichas reais. Se uma verificação não puder ser feita, registre exatamente o limite, sem substituí-la por uma declaração de sucesso. Desempenho, se precisar medir, deve ser conferido em um build de produção local.

Atualize a fila única docs/a-fazer.md e o histórico docs/afty-status.md, retirando apenas parcelas realmente encerradas. Mudanças no Motor, na DSL ou nas fórmulas exigem atualizar seus guias. Registre em docs/revisao-livro-regras/entregas/CX4.md a checagem inicial, achados confirmados/refutados, implementação, contratos, arquivos, testes, dependências e pendências. Se o registro já existir, preserve seu histórico. Esse arquivo é evidência, não outra fila.

Trabalhe até concluir todo o escopo confirmado e independente. Não declare o lote completo com integrações ou dependências necessárias ainda pendentes. Na resposta final, separe o que foi validado, o que foi implementado e o que falta, com os motivos concretos.

## Escopo deste lote

Confira e complete:
- Transformações com escolha de atributo e TR por efeito, removendo exclusões silenciosas apenas quando o alvo necessário existir e a regra permitir.
- Regeneração Passiva em combate e sua conversão em PV temporário quando a fonte não permitir cura real.
- Representação de dano Passivo Durante/Após, dados, crítico e valores fixos. Confirme antes se a média fixa atual é decisão da mesa ou limitação.
- Aplicação/cura de condições e Ferimentos Complexos pelo Feitiço, com alvo e resultado de TR quando necessários.
- Registro de alterações de Feitiços ao subir de nível, caso essa política seja confirmada.
- Exaustão comum: efeitos dos seis níveis, fonte dos números, estados e recuperação autorizada. Não confundir com Exaustão de Técnica.
- PV/PE temporários: identidade da fonte, substituição, teto, exceções de acúmulo, duração e consumo.
- Ligação de cura, Dados de Vida e descanso aos percursos autorizados.

## Pontos de partida e dependências

Leia afty-feiticos.js, afty-combate-conjurador.js, afty-efeitos.js, afty-derive.js, afty-condicoes.js, afty-cura.js, ficha/ficha-sessao.js, ficha/ficha-opcoes-derive.js e suas interfaces. Consulte docs/afty-tecnica-maxima-dominio.md e as decisões de Passivas/descanso.

Consuma CL1 para uso/eventos/duração e CL2 para recursos vitais/Dados de Vida. Libere cedo para CX2/CX3 as operações estáveis de temporários, com exceções explícitas. Não construa um segundo armazenamento ou sistema de cobrança.

Fontes principais: Livro p.199, 200, 208 a 211, 228 a 237, 313, 324, 335, 365 e 366. N11 a N13 são hipóteses a revalidar.

## Restrições específicas e resultado esperado

Não transforme o descanso único em dois tipos, não adote PV rolado nem cobre a redução do PE máximo por Shikigami sem a decisão correspondente. Preserve legados, isenções e diferenças autorizadas de Passivas, Máxima e Domínio. Uma tabela auxiliar certa não certifica sua derivação nem seus consumidores.

Entregue os Feitiços e recursos ligados à sessão real, com fontes, expiração, salvamento e testes das exceções. Documente separadamente o que for decisão pendente, sem limitar a entrega a uma calculadora que só mostra números.

