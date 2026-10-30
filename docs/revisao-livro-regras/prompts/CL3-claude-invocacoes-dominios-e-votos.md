# CL3: Invocações, Domínios e Votos

Você está num chat novo do Claude. Quero que execute o lote CL3 do fechamento do Livro de Regras no Grimório, começando pela verificação de que o trabalho pedido faz sentido na base atual, antes de programar.

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

Atualize a fila única docs/a-fazer.md e o histórico docs/afty-status.md, retirando apenas parcelas realmente encerradas. Mudanças no Motor, na DSL ou nas fórmulas exigem atualizar seus guias. Registre em docs/revisao-livro-regras/entregas/CL3.md a checagem inicial, achados confirmados/refutados, implementação, contratos, arquivos, testes, dependências e pendências. Se o registro já existir, preserve seu histórico. Esse arquivo é evidência, não outra fila.

Trabalhe até concluir todo o escopo confirmado e independente. Não declare o lote completo com integrações ou dependências necessárias ainda pendentes. Na resposta final, separe o que foi validado, o que foi implementado e o que falta, com os motivos concretos.

## Escopo deste lote

Você ficou com os sistemas complexos de invocações, proteções de domínio e Votos. Faça a verificação prévia por sistema e preserve toda a implementação já válida.

Invocações:
- Vínculo do dono com a invocação e com outros participantes.
- Arma virtual de Forma de Arma com dados/tipo da Ação Complexa correta.
- Auxílio no próximo ataque, redução por repetição, exceções de tipo e estados próprios.
- Contexto de sessão na Característica Livre, sem vazamento entre fichas, e compatibilidade com Hordas/Quimeras/compostos existentes.

Domínios e barreiras:
- Confronto e Contestação entre participantes, domo, vitória/empate, supressão/restauração e efeitos por fase.
- Estado utilizável de paredes/Cortinas, dano/destruição e custo aplicável.
- Cesta Oca de Vime, durabilidade, concentração, ocupação das mãos e gatilhos de Acerto Garantido.

Votos:
- Tipos, pesos, parâmetros, validade, prazo, ruptura e histórico.
- Votos emergenciais, contratuais e restrição congênita com suas validações.
- Migração/leitura dos Votos livres antigos e exceções declaradas por addons.

## Pontos de partida e dependências

Leia afty-invocacoes.js, afty-invocacoes-tipos.js, afty-invocacoes-caracteristicas.js, afty-dominios.js, afty-dominio-simples.js, afty-votos.js, afty-efeitos.js, ficha/ficha-sessao.js e os consumidores do Encontro. Consulte docs/afty-invocacoes.md e docs/afty-tecnica-maxima-dominio.md.

Consuma os contratos reais de CL1 para eventos/duração/uso e CL2 para recursos vitais, quando necessários. Pode adiantar um sistema independente enquanto aguarda o outro. Fontes principais: Livro p.39 a 41 somente para diferenciar do Mutante, 185 a 189, 239 a 246, 256 a 274 e 350 a 358.

## Fronteira e resultado esperado

Poderes específicos de Controlador, Aliados e a maior parte das telas são de CX6. Entregue núcleo e pontos reais de ligação, com contratos que ele consiga consumir. Não transforme este lote em reescrita dos construtores de Máxima, Domínio ou invocação já concluídos.

Preserve remendos de addons e decisões de Domínio Simples/Expansão. Não automatize consequência narrativa de Voto nem invente número para uma regra aberta: a mesa informa o fato e a consequência autorizada.

Comprove duas fichas interagindo sem vazamento de catálogo/estado, Forma de Arma correta, auxílio consumido no ataque elegível, conclusão de confronto e transições de Voto. As partes liberadas de cada sistema devem poder ser usadas pelo Codex antes de todo o lote terminar.

