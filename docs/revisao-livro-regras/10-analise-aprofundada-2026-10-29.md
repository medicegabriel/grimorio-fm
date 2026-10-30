# Livro de Regras e site: análise aprofundada de fechamento

Data da conferência: 2026-10-29. Esta análise complementa LR01 a LR27 e não altera os estados históricos da triagem nem aprova lotes da campanha de automação.

## Resultado

O site já tem uma parte grande das contas, tabelas, catálogos e ferramentas de autoria. O que impede considerá-lo completo é a combinação de benefícios ainda só descritivos, ligações incompletas entre cálculo e sessão, procedimentos sem estado próprio e algumas divergências numéricas reproduzíveis. Não é possível expressar isso como um percentual honesto usando as 27 unidades antigas.

As lacunas mais importantes que a resposta anterior não identificou são: a origem Corpo Amaldiçoado Mutante vazia, benefícios de Anatomia sem aplicação ou parcialmente aplicados, talentos sem a operação prometida, itens repetidos acumulando, arredondamento de Passivas, Portas da Morte incompletas e Exaustão sem penalidades. Esses itens estão discriminados abaixo, com fonte, código e resultado esperado para encerrar cada trabalho.

O termo **falta** aqui se refere à aplicação da regra pela ficha. Algumas operações podem continuar pedindo confirmação humana de alvo, posição, sucesso ou evento. Não é necessário criar mapa, inteligência de combate ou backend para resolver essas lacunas. A análise não presume que a ficha deva decidir fatos narrativos pela mesa.

## Fonte, versão e verificação

- Livro lido diretamente em `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. As páginas são as impressas, pelos marcadores do Markdown.
- Base examinada: HEAD local `68888733deffa9700aa69761fd965a504b9152db` **mais as alterações locais preexistentes**, incluindo arquivos ainda não rastreados. O HEAD sozinho não identifica o código examinado.
- Remoto consultado: `origin/main` em `2308bc193e9d5e806630d00745e3cc654042d9f7`. Há sete commits no remoto além do HEAD local e numerosas alterações locais. Nenhuma integração foi feita. Esta análise não certifica o site publicado.
- `npm run asserts`: **234 de 236 arquivos aprovados**. `t-reconciliacao-g00` falha numa expectativa fixa de 32 remendos. `t-prodigio` tem 33 verificações sem falha e sai com código zero quando executado sozinho, mas a frase final não atende ao padrão exigido pelo lançador. Não confundir essas duas falhas com duas regras de jogo quebradas.
- `npm run build`: aprovado. `npx eslint src/systems/afty/`: aprovado. Build avisa sobre arquivos grandes, sem impedir a compilação.
- Diagnósticos adicionais: [script](../../.audit/livro-20261029/diagnostico.mjs), [resultados](../../.audit/livro-20261029/diagnostico.json).
- Conferência independente dos valores das tabelas: **27 comparações, 412 células, nenhuma divergência**. Inclui os 17 efeitos auxiliares, dano único por ataque e TR, dano em área, alcance, área, duas tabelas de cura, custos de PE, reserva das Passivas e níveis de dano passivos. [Método](../../.audit/livro-20261029/tabelas.mjs), [resultados com páginas e linhas](../../.audit/livro-20261029/tabelas.json). Isto verifica os valores armazenados, não todas as condições de aplicação nem os caminhos oficiais/legados da Técnica Máxima.
- Não houve execução no navegador nem alteração do código do produto. Os cenários adicionais usam funções reais do motor e da sessão com dados sintéticos.

## Onde estão as partes anteriores

Os 12 arquivos anteriores são nove partes temáticas e três arquivos de organização:

| Parte | Arquivo | O que esta análise acrescenta |
|---|---|---|
| Atributos | [01](01-atributos-valores.md) | Arredondamento de Passivas e ligação do orçamento de Potencial Físico |
| Progressão | [02](02-progressao-especializacoes.md) | Distinção entre PV rolado, Dados de Vida e histórico de mudanças |
| Origens e talentos | [03](03-origens-talentos.md) | Mutante, quatro clãs, Feto, Anatomias e matriz dos 52 Talentos |
| Testes e Aptidões | [04](04-testes-pericias-aptidoes.md) | Resultado natural do d20, operações ativas, barreiras e reações |
| Equipamentos | [05](05-equipamentos.md) | Acúmulo indevido, itens ativos, pulseiras e 16 encantamentos |
| Técnica e Feitiços | [06](06-tecnica-feiticos.md) | Tabelas conferidas, Passivas, Transformação, criações e condições |
| Combate e invocações | [07](07-combate-invocacoes.md) | Portas da Morte, concentração, reações, Exaustão e ligações do Controlador |
| Interlúdios e Votos | [08](08-interludios-votos.md) | Focos além do Treinamento, procedimentos e validação dos tipos de Voto |
| Transversais | [09](09-regras-transversais.md) | Temporários, fontes repetidas e decisões de acúmulo |
| Organização | [README](README.md), [progresso](progresso.md), [rastreabilidade](rastreabilidade.md) | Preservados como registro do primeiro recorte |

## 1. Correções demonstradas por execução

Estes casos não são inferidos da ausência de uma chave num mapa de efeitos. Foram executadas as funções reais. Todos os exemplos usam Player sem addons.

| ID | Problema | Resultado observado | Fonte e ponto de correção |
|---|---|---|---|
| N01 | Corpo Amaldiçoado Mutante não concede características | Origem com zero características e bônus de atributo vazio | Livro p.39 a 41. [Catálogo](../../src/systems/afty/afty-origens.js#L658). Implementar a origem e os três núcleos do personagem |
| N02 | Arma Natural não melhora o desarmado superior | Lutador 10: `1d12 + 2` antes e depois da Anatomia. Fineza e Enérgica aparecem, mas o nível de dano adicional não | Livro p.35. [Ligação atual](../../src/systems/afty/afty-derive.js#L1294). Resolver também o dado mínimo e a escolha do tipo físico |
| N03 | Articulações Extensas não aumenta o alcance | Ataque Básico permanece em 1,5 m | Livro p.35. [Anatomia](../../src/systems/afty/afty-anatomias.js#L38) e [mapa de efeitos](../../src/systems/afty/afty-efeitos-conteudo.js#L2689). O canal `alcanceArma` já existe |
| N04 | Corpo Especializado não entrega a escolha e o dado | Escolher a Anatomia não altera a perícia nem acrescenta `1d4` | Livro p.35. [Catálogo](../../src/systems/afty/afty-anatomias.js#L58). Criar a escolha de perícia e encaminhar o dado adicional |
| N05 | Braços Extras dá Atletismo sem verificar mãos livres | Atletismo passa de +5 para +7 sem estado de mãos livres | Livro p.35. [Efeito incondicional](../../src/systems/afty/afty-efeitos-conteudo.js#L2732). Preservar Prestidigitação e condicionar Atletismo |
| N06 | Duas cópias do mesmo acessório somam benefícios | PV base 66, um Bracelete do Vigor 76, dois Braceletes 86 | Livro p.365. [Soma direta dos itens](../../src/systems/afty/afty-equipamentos.js#L2969). Uma segunda cópia pode permanecer no inventário, mas não deve repetir o benefício |
| N07 | Metade de Sustentada arredonda para cima em Passiva | Defesa Passiva 5: Sustentada 7, metade com piso 3, calculadora retorna 4 | Livro p.235 e 365. [Math.round](../../src/systems/afty/afty-feiticos.js#L4201). Corrigir o arredondamento e conferir as demais categorias que usam essa função |
| N08 | Resultado do teste pode contradizer o 20 ou 1 natural do ataque | `20 + 0` contra CD 100 retorna `critico: true` e `sucesso: false`. `1 + 100` contra CD 10 retorna `pifia: true` e `sucesso: true` | Livro p.307. [Rolagem](../../src/systems/afty/ficha/ficha-rolagem.js#L39). O resolvedor precisa distinguir ataque dos demais testes. Margem reduzida não torna todo crítico acerto automático |
| N09 | Dano comum perde o saldo negativo de personagem sem poderes especiais de queda | Com 10 PV, receber 25 deixa 0 e não registra os 15 negativos | Livro p.313. [aplicaDano](../../src/systems/afty/ficha/ficha-sessao.js#L1808) e [ramo especial de queda](../../src/systems/afty/ficha/ficha-especializacoes.js#L31). Generalizar o estado de morte, sem depender de possuir poderes do Restringido |
| N10 | Cura comum apaga a dívida negativa integralmente | Com 15 PV negativos registrados, curar 1 resulta em 1 PV e zera a dívida | Livro p.313. [aplicaCura](../../src/systems/afty/ficha/ficha-sessao.js#L1838). Abater primeiro o saldo negativo e só então resolver estabilização |
| N11 | Exaustão comum não altera os números nem diminui no descanso | Usando o adaptador real da sessão, Exaustão 3 mantém PV 66, Defesa 15, CD 22 e movimento 9. Descansar conserva o contador em 3 | Livro p.324. [Adaptador](../../src/systems/afty/ficha/ficha-opcoes-derive.js#L24), [descanso](../../src/systems/afty/ficha/ficha-sessao.js#L2338). O texto da regra já está disponível |
| N12 | PE temporário genérico soma fontes e não impõe metade do máximo | Com PE máximo 40, duas fontes genéricas de 60 e 40 resultam em 100 PE temporários | Livro p.366. [Aplicação](../../src/systems/afty/ficha/ficha-sessao.js#L1583). Separar substituição padrão de exceções explicitamente cumulativas |
| N13 | Regeneração Passiva é calculada sem efeito executável | Passiva 3 informa `2d8`, valor 9, reserva 6 PE e retorna `efeitosGerados: []` | Livro p.237. [Calculadora](../../src/systems/afty/afty-feiticos.js#L4361). Ligar ao início do turno e ao regime de cura/PV temporário |
| N14 | Adepto de Medicina não abre a cura prometida | Ficha sem a classe Suporte fica com a mesma lista vazia de curas antes e depois do Talento | Livro p.166. [Talento](../../src/systems/afty/afty-talentos.js#L447). Criar a linha e os usos pela metade, escalando pelo nível de personagem |
| N15 | Retorno após dissipação por dano de invocação comum é aceito antes do próximo turno | Invocar e levar a zero na rodada 2 permite reinvocação imediata na mesma rodada | Livro p.257. [Entrada](../../src/systems/afty/ficha/ficha-sessao.js#L635), [dano](../../src/systems/afty/ficha/ficha-sessao.js#L1205). Registrar o turno da queda e diferenciar as exceções e o retorno voluntário |

N08 é uma inconsistência da função de teste e do resultado que ela publica. Não foi simulada uma transferência automática de ataque entre duas fichas, pois esse fluxo geral ainda não existe. N12 prova o comportamento da operação genérica, sem atribuir indevidamente a regra padrão a fontes que têm exceção expressa.

## 2. Origens e Anatomias

| Origem ou conjunto | O que falta para concluir | Evidência e dependência |
|---|---|---|
| Corpo Amaldiçoado Mutante | Bônus de atributos, forma sintética, imunidades, três núcleos, primário, redistribuição de atributos, recursos e Feitiços por núcleo, limites pelo primário, troca por diferença, estados de dano/destruição, escolhas fixas/versáteis e veto à multiclasse | Livro p.39 a 41. N01. O sistema de dois núcleos de **invocação** em `afty-invocacoes.js` não implementa essa origem |
| Inato | Selecionar a Marca Registrada, aplicar desconto individual e propagá-lo às variações | Livro p.27 e 200. Vaga adicional já existe. [Característica](../../src/systems/afty/afty-origens.js#L319) |
| Familiaridade com Técnica | Melhorar o desconto da primeira Marca, escolher a redução de sustentação e novas Marcas pelo BT | Livro p.169. [Talento](../../src/systems/afty/afty-talentos.js#L795). Depende da identidade da Marca |
| Clã Zenin | Transformar o contador de Feitiços Focados numa escolha real por Feitiço, com a modalidade do benefício e os cinco marcos | Livro p.31. [Foco no Poder](../../src/systems/afty/afty-origens.js#L249). O contador não aumenta dano/cura, alcance ou CD |
| Clã Inumaki | Operação de Olhos de Cobra e Presas, contador de BT usos e recarga | Livro p.30. [Característica marcada como mesa](../../src/systems/afty/afty-origens.js#L183). O comando/reação do aliado pode ser confirmado manualmente |
| Clã Kamo | Rerrolagem do ganho de PV abaixo da média, se PV rolado for adotado | Livro p.31. Bônus de PV e Constituição já existem. Não bloquear o restante pela decisão sobre rolagem |
| Derivado | Vaga inicial vinculada a Aura, com requisitos, em vez de vaga irrestrita | Livro p.32. [Concessão genérica assumida](../../src/systems/afty/afty-origens.js#L348). O mesmo mecanismo de vaga por categoria pode atender excedentes de Aptidão |
| Derivado e Expansão de Reserva | Recuperação `2 x BT` em combate, uso diário, melhoria de ação, PE temporário e recarga alterada pelo Talento | Livro p.32 e 169. Atualmente descritos, sem uma transação de recuperação específica |
| Restringido | Resiliência Imediata com redução/evitar desmembramento, usos e recarga. Complementos de cura por Dados de Vida e imunidade/vantagem situacional de Físico Abençoado | Livro p.33. [Resiliência](../../src/systems/afty/afty-origens.js#L458). Atributos, tetos e movimento não precisam ser refeitos |
| Feto | Vigor Maldito com número de usos por nível, gasto de vários usos e Reposição Sanguínea | Livro p.34 e 170. [Vigor](../../src/systems/afty/afty-origens.js#L511). A linha do Talento não cria a cura |
| Feto | Herança Maldita com distinção entre cura reversa recebida e autocura, custo em PE e modificadores situacionais contra veneno | Livro p.34 e 145. [Herança](../../src/systems/afty/afty-origens.js#L490). O caminho comum de cura não recebe a origem ou o tipo da energia |

Nas 15 Anatomias, a matriz atual é:

| Anatomia | Estado que falta fechar |
|---|---|
| Alma Maldita | Redução fracionária/anulação do dano na alma e usos diários por nível |
| Anatomia Incompreensível | Chance de ignorar o adicional do crítico/furtivo, com aumento no nível 15 |
| Arma Natural | N02, sem descrever como ausentes Fineza e Enérgica, que já chegam à linha |
| Articulações Extensas | N03 |
| Braços Extras | N05 e ocupação adicional de mãos/equipamentos |
| Capacidade de Voo | Ativação por 1 PE, conversão do movimento e expiração. O canal de voo já existe, não é preciso inventá-lo novamente |
| Carapaça Mutante | RD física está ligada. Falta escolher e aplicar a resistência física permanente do nível 10 |
| Corpo Especializado | N04 |
| Desenvolvimento Exagerado | Tamanho e PV por nível têm efeitos. Sem lacuna adicional demonstrada nesta passagem |
| Devorador de Energia | Gatilho de sucesso em TR contra Feitiço e concessão de PE temporário com a exceção de acúmulo |
| Instinto Sanguinário | Iniciativa e Atenção em combate têm efeitos. Sem lacuna adicional demonstrada nesta passagem |
| Olhos Sombrios | Treino e +2 de Percepção existem. Visão e imunidade às faixas de escuridão não têm resolução situacional completa |
| Pernas Extras | Movimento existe. Ignorar terreno difícil não participa de um consumo de movimento |
| Presença Nefasta | Registrar primeiro avistamento por inimigo, TR e condição correspondente |
| Sangue Tóxico | Reação ao dano corpo a corpo com perda de vida no atacante |

Fontes: Livro p.35 e 36, [catálogo das Anatomias](../../src/systems/afty/afty-anatomias.js), [efeitos](../../src/systems/afty/afty-efeitos-conteudo.js#L2689). Esta matriz não mistura as Anatomias nativas com as características de addons de Maldição.

## 3. Talentos e Especializações

Os 52 Talentos do catálogo não são 52 Talentos sem programação. Há alocadores, escolhas, concessões, proficiências, efeitos e tratamentos específicos fora do mapa principal. A [matriz individual dos 52](11-matriz-talentos-2026-10-29.md) separa a parcela existente da operação que falta. Destaques além da resposta anterior:

- **Recursos e uso:** Favorecido pela Sorte sem reserva operacional de sorte, Ataque Infalível sem a rerrolagem por rodada, Determinado a Viver sem o gatilho de queda, Técnicas de Reação Rápida sem a segunda iniciativa e Técnicas Defensivas de Escudo sem o uso da reação que reduz a margem de crítico.
- **Concessões:** Adepto de Medicina sem cura (N14), Mestre da Criação sem as duas escolhas de Ofício e sem o procedimento de produção adicional, Pulseiras de treino e dedicações de inventário sem concessão operacional.
- **Benefícios por ataque:** empurrar, reduzir movimento, rerrolar perfuração, mobilidade, sentinela, Wrestling e interrupção por Apaziguador de Técnica dependem do evento de ataque e do alvo.
- **Origem:** Familiaridade, Expansão de Reserva e Reposição Sanguínea dependem de operações da origem ainda não ligadas. Manual de Técnica reduz a recarga da Máxima, mas não implementa todo o ciclo do Feitiço acima do acesso, custo aumentado e aprendizado obrigatório.

Nas seis Especializações, os catálogos e grande parte das contas já existem. O fechamento por classe precisa resolver:

| Classe | Pendências concretas de operação |
|---|---|
| Lutador | Reações e efeitos no adversário de Aparar/Devolver Projéteis, Redirecionar Força, Deboche, golpes/manobras condicionais e demais poderes que dependem de acerto, falha ou posição. Integrar os custos e manutenções dos estados que hoje só exibem PE, incluindo Armas Absolutas |
| Combatente | Estilos de Interceptador e Protetor, os quatro efeitos de alvo/economia de ação do Golpe Especial já citados, seleção de alvo e gatilhos das posturas, e efeitos críticos liberados por grupo de arma. Os contadores de vários poderes de Combatente já existem |
| Conjurador | Resolução no alvo de efeitos como anular, interromper ou condicionar uma conjuração. Feitiço de Criação de Itens não materializa o inventário. Completar a ligação das mudanças de fundamento/efeitos situacionais ao uso, sem reintroduzir Liberações Expandidas, removida por decisão do autor |
| Controlador | Os seis poderes de posição, proteção reativa, Frenesi da Invocação, Companheiro Avançado e os vínculos detalhados na seção de Invocações |
| Suporte | Efeitos que alteram o teste ou a ação do aliado, rerrolagem, reação, remoção de falhas de morte e benefícios instantâneos ainda apresentados só como consulta. A transferência por Pacotes para Aliados existe parcialmente no G2 |
| Restringido | Acionamentos opcionais já existentes no motor e ainda sem integração completa à interação cotidiana: reações, Força Imparável/Barreira, alternativa letal de Ainda de Pé e Rejeitar a Morte. Não recriar o painel que o autor recusou. Técnicas Marciais já foram implementadas |

Fontes: Livro p.49 a 126, [Habilidades](../../src/systems/afty/afty-habilidades.js), [efeitos](../../src/systems/afty/afty-efeitos-conteudo.js), [sessão de Especializações](../../src/systems/afty/ficha/ficha-especializacoes.js), fila `FANG-2026-10-12-especializacoes` e `CMB01-reacoes`. Esta tabela delimita famílias de procedimento, não declara ausente cada habilidade que não tem entrada em `HABILIDADE_EFEITOS`.

## 4. Testes, Aptidões e proteções

| Item | O que falta | Fonte e código |
|---|---|---|
| Resultado do ataque | N08 e representação de quem recebe o ataque, Defesa usada e acerto/erro confirmado | Livro p.306 e 307. `ficha-rolagem.js` |
| Concessão de Aptidão por categoria | Resolver a escolha de Aura do Derivado e o excedente que deve virar Aptidão da categoria correspondente | Livro p.32 e 366. [resolveNiveisAptidao](../../src/systems/afty/afty-aptidoes.js#L1689) |
| Aura e resistências ativas | Aura Elemental Reforçada, Absorção Elemental, Aura Impenetrável e Casulo de Energia precisam ligar suas resistências, conversões de dano/energia e usos ao evento adequado | Livro p.175 a 177. Catálogo existe. Não estão demonstradas como operações completas na sessão nativa |
| Auras no adversário | Aura Anuladora, Chamativa, Drenadora, Lacerante, Macabra, Movediça e Redirecionadora precisam de alvo/área, início de turno, TR ou segunda tentativa, conforme cada texto | Livro p.174 a 177. [Tratamento parcial de auras](../../src/systems/afty/afty-combate-aptidoes.js). Aura Lacerante em Golpe com Aura já acrescenta dano, mas isso não resolve sua área passiva |
| Canalização e estímulos | Valores já chegam ao dano e aos testes. Falta fechar pagamento, quantidade escolhida, manutenção/consumo após **acerto**, e limites separados dos estímulos por rodada | Livro p.178 e 179. A exclusão entre Canalizar em Golpe e Canalizar ER já existe |
| Anular Técnica, Revestimento, Pétala e Punho Divergente | Procedimento de reação, confronto ou dano adiado, com vínculo ao Feitiço/alvo e às janelas de uso | Livro p.181 e 182. Não substituir por um bônus permanente genérico |
| Barreiras e Cortinas | PV, RD e quantidade máxima são calculados. Falta estado utilizável por parede/Cortina, dano e destruição, custo por área e duração/condições de uso | Livro p.188 e 189. [Cálculos](../../src/systems/afty/afty-dominios.js#L345) e [apresentação](../../src/systems/afty/ficha/abas/AbaAcoes.jsx#L1017) |
| Cesta Oca de Vime | Ativação, durabilidade, mãos ocupadas, teste de concentração e perda por Acerto Garantido | Livro p.188. Não confundir com a implementação separada de Domínio Simples |
| Confronto e Contestação de Domínios | Bônus, fases, domo e dano de contestação existem. Falta um procedimento vinculado aos dois participantes que aplique a vitória, empate estendido, supressão e restauração dos efeitos | Livro p.185 a 187. [Confronto](../../src/systems/afty/afty-dominios.js#L426), [contestação calculada com aplicação manual](../../src/systems/afty/afty-dominios.js#L304) |
| Energia Reversa | Cura e limites principais têm operação. Falta integrar teto de pontos e redução de custo de treino às demais aplicações nomeadas, como Regeneração Aprimorada/Reversão, e os procedimentos de regenerar membros | Livro p.190 a 194 e 342. Não confundir pontos de ER ainda manuais com ausência da cura já implementada |

A presença de 85 Aptidões no catálogo inclui conteúdo além das Aptidões desse capítulo do Livro de Regras. Não se deve usar 85 como denominador de regras oficiais desta revisão.

## 5. Inventário, itens, armas e encantamentos

| Item | Pendência de implementação |
|---|---|
| Inventário próprio do Player | Conjunto inicial, escolhas iniciais e concessão/reposição por missão/grau. `inventarioSimplificado` continua inativa. Preservar armas e itens já salvos |
| Fontes repetidas | Corrigir N06. Conferir depois os demais canais de itens e versões evoluídas. Não aplicar cegamente uma regra de exclusão a equipamentos cujo texto exige uso conjunto |
| Pulseira Magistral e Pulseira Primacial | Escolha de perícia e treino correspondente. Ambas ainda têm `aplicado: false`, embora o texto apareça |
| Consumíveis | Operação que use uma unidade, aplique a recuperação/buff/condição e registre duração e recarga. Pérolas e mixes, injeções, óleos, antídotos, venenos e parte dos talismãs continuam sem essa operação |
| Itens de cura | As linhas de Símbolos e Laço já calculam cura. Falta garantir consumo do item e cláusulas adicionais: Símbolo de Vida Absoluta não se encerra na cura total, também concede PV temporário, e Laço da Vida depende do gatilho de morte, Exaustão e inutilização |
| Chaveiro Absorsor | Recuperação de PE por eliminação de inimigo elegível |
| Venenos | Aplicação por contato/ferimento/inalação/ingestão, CD por custo, resultado de TR, efeito parcial, duração e tratamento. As descrições não resolvem o procedimento |
| Cargas de Encantamento | Reserva e recarga operacional, gasto atômico com a reação/ação e vínculo ao equipamento usado |
| Encantamentos ativos de Uniforme | Aeronauta, Distorcivo, Escaldante, Estimulante, Impulso, Repulsor, Revestido com Espinhos e Ricochete |
| Encantamentos ativos de Escudo | Avassalador, Bloqueador, Destruidor, Disco, Espinhoso, Esponja, Expansão de Escudo e Intangível |
| Crítico de arma | Aplicar no alvo os efeitos dos 12 grupos, com os testes, sangramento e movimentos correspondentes. Treino ou Talento que libera o efeito não basta para executá-lo |
| Carga | Incluir os meios espaços dos Intermediários, se adotada a regra do livro, e fechar o tratamento do excesso do dobro. A penalidade de sobrecarga básica já existe |

Fontes: Livro p.129 a 161, 308 e 365. [Itens](../../src/systems/afty/afty-equipamentos.js#L1903), [pulseiras](../../src/systems/afty/afty-equipamentos.js#L1969), [encantamentos](../../src/systems/afty/afty-equipamentos.js#L1610), [fila dos 16 encantamentos](../a-fazer.md#automatizar-os-16-encantamentos-de-uniforme-e-escudo-que-dependem-de-combate).

O inventário extraído tem 49 Itens Especiais, dos quais 30 não têm os campos diretos `efeito` ou `cura`. **Isso não equivale a 30 itens ausentes:** Talismã do Ápice, por exemplo, tem módulo próprio, e Brinco da Comunicação é majoritariamente narrativo. A contagem é uma lista de inspeção. As lacunas acima foram delimitadas pela leitura dos consumidores, não por essa contagem isolada.

Os subsistemas de Criação de Armas/Equipamentos próprios e certas receitas de itens vêm de regras adicionais do projeto. Modular com várias opções, texto Especial fora da bancada e efeitos marcados `implementado: false` continuam relevantes para o produto, mas não devem ser somados como omissões do Livro de Regras sem identificar a fonte adicional.

## 6. Técnica e Feitiços

| Item | O que falta ou precisa ser corrigido |
|---|---|
| Alteração ao subir de nível | Registrar quais Feitiços foram alterados em cada subida e aplicar o limite de BT, caso o site deva controlar a legalidade da progressão. Hoje o editor permite editar o repertório diretamente |
| Identidade do Feitiço | Marca Registrada, Foco Zenin e Manual de Técnica precisam de metadados próprios, propagados corretamente às variações |
| Transformação | Escolha de atributo e TR por efeito. O tradutor exclui deliberadamente esses dois efeitos em `TRANSF_SEM_ALVO`, pois o editor não informa o alvo |
| Regeneração Passiva | N13, incluindo conversão em PV temporário quando não houver condição de cura real |
| Arredondamento de Passiva | N07. As tabelas auxiliares conferidas podem estar certas e a conta derivada da Passiva continuar errada |
| Dano Passivo | A calculadora traduz Durante/Após em média no mesmo canal de dano fixo. Exemplo: nível 2 gera `danoBonus: 4.5` ou `6.5`, sem os dados nem o momento do ataque. Falta preservar a estrutura da rolagem e o tratamento de crítico, ou registrar explicitamente a manutenção dessa simplificação como decisão |
| Condições por Feitiço | O custo em dados, a duração e a CD são calculados. Falta a operação geral que receba alvo e resultado do TR e aplique/remova a condição correta. Isto vale também para cura de condições e Ferimentos Complexos |
| Criação de Itens por Feitiço | O cálculo da quantidade/custo existe. Falta materializar os itens, limitar consumíveis por descanso e controlar quantos não consumíveis permanecem criados ao mesmo tempo |
| Criação de Shikigami | Desconto do PE máximo enquanto existir, mantido fora por decisão anterior. O custo de invocação e os vínculos da criatura já têm implementação |
| Linha de área | Largura não é representada. O comprimento calculado não implementa a dobra da largura nas regras adicionais que a exigem |
| Efeitos de terceiros | No G2, Pacotes para Aliados já transferem vários bônus numéricos. Dados de dano auxiliar, alguns efeitos de teste/reação e PV temporário ainda não têm o mesmo alcance de aplicação |

Fontes: Livro p.199, 200, 208 a 211, 228 a 237. [Passivas](../../src/systems/afty/afty-feiticos.js#L4201), [Transformação](../../src/systems/afty/afty-combate-conjurador.js#L185), [itens criados](../../src/systems/afty/afty-feiticos.js#L2479), [Pacotes](../../src/systems/afty/ficha/pacotes-familias.js#L207).

Técnica Máxima e Expansão de Domínio têm construção, custos, recarga, duração, efeitos e supressão por Exaustão de Técnica. Não devem voltar à lista de sistemas inexistentes. Restam as decisões já registradas sobre Sem Barreiras, múltiplos golpes, condições garantidas e outras interações, além dos procedimentos com alvo desta análise.

## 7. Combate e recursos de sessão

| Sistema | O que falta para encerrar |
|---|---|
| Portas da Morte | N09/N10, estado geral de sucessos/falhas, 1 e 20 naturais, dano enquanto morrendo, estabilização por Medicina/cura, persistência de falhas e morte por dano massivo |
| Ferimentos Complexos | Gatilho por dano, escolha/rolagem, efeitos persistentes, tratamento, prazo até se tornar permanente e recuperação. A lista de nomes que aparece no editor curativo não implementa esse ciclo |
| Exaustão comum | N11 e efeitos cumulativos dos seis níveis, inclusive morte no sexto e recuperação de um nível no descanso longo. Exaustão de Técnica já existe e é outro recurso |
| Concentração | A linha de teste existe, inclusive o bônus da Faixa de Foco. Faltam vínculos aos efeitos mantidos, limite de concentração, CD pelo evento e encerramento por falha/condição |
| Sequência de Ataques | Contar ataques recebidos pelo mesmo alvo entre turnos, reduzir a Defesa por pares com teto e restaurar no turno do alvo |
| Economia de ações e reações | Aplicar as exceções que prometem ação adicional, troca de ação, repetição de reação ou perda da ação seguinte. Há recursos especiais do Restringido, sem orçamento universal de ações |
| Estado espacial confirmado | Representar, quando relevante, adjacência, distância, cobertura, camuflagem, flanco, visibilidade e tipo de movimento. Pode ser declaração manual, sem mapa automático |
| Dano recebido | O campo comum recebe o valor líquido informado pelo usuário. RD/resistência/vulnerabilidade não são descontadas automaticamente ali. Para automatizar a aplicação, informar tipo, origem e resultado do TR, respeitando a ordem do livro |
| Alma | Redução de Alma e PV do Player já funciona. Falta o procedimento de TR de Integridade antes da aplicação, cura elegível e recuperação parcial de dano na alma por descanso, se o descanso passar a seguir o livro |
| Ataques improvisados e fontes externas | Não há um procedimento completo de arma improvisada com Força, dano, dano ao objeto e quebra, nem aplicação das fontes externas. A decisão de excluir improvisadas do seletor marcial deve ser preservada |

Fontes: Livro p.290 a 326. [Dano e cura](../../src/systems/afty/ficha/ficha-sessao.js#L1808), [Alma](../../src/systems/afty/ficha/ficha-sessao.js#L1885), [turnos especiais](../../src/systems/afty/ficha/ficha-especializacoes.js), [rolagens](../../src/systems/afty/ficha/ficha-rolagem.js).

As condições já alteram Defesa, testes, movimento e RD. Sangramento possui rolagem e perda de vida acionável. Não listar o sistema inteiro de condições como ausente. O que falta é completar gatilhos, resultados de TR, imunidades situacionais e aplicação no alvo.

## 8. Invocações e Controlador

| Item | Pendência real |
|---|---|
| Limite em campo | A interface mostra o limite e avisa o excesso. A entrada individual não recebe o contexto necessário para impedir o excesso nem controla genericamente a quantidade trazida por uma ação Invocar |
| Retorno após dissipação por dano | N15. Guardar o turno da queda e fazer valer o prazo correto das invocações comuns. O retorno voluntário tem regra própria de custo e PV |
| Forma de Arma | Forma, arma escolhida e custo existem. Falta a linha de ataque virtual no dono usando dano/tipo da Ação Complexa da invocação e as consequências reativas da forma |
| Auxílio de Dano Adicional | O dado é calculado e mostrado, mas o caminho dos auxílios ligados ao dono não o transforma na rolagem do próximo ataque |
| Auxílios repetidos | Prejuízo é apresentado em texto. Falta contar repetições por rodada e reduzir o benefício, preservando a imunidade da Invocação de Técnica |
| Guarda Viva, Rede de Detecção, Camuflagem Aprimorada, Combate em Alcateia, Táticas de Alcateia e Flanco Avançado | Entradas existem, sem o estado de posição/contagem que permita calcular os benefícios e as penalidades no dono ou no inimigo |
| Proteger Invocação e Proteção Avançada | Rolagem de redução, uso de reação, redirecionamento e aplicação no recurso correto |
| Frenesi da Invocação | Estado temporário da invocação, penalidades próprias e ataque adicional |
| Companheiro Avançado | Vínculo do companheiro a um tipo de Aliado e sua graduação. O catálogo de Aliados já existe, portanto não é mais caso de criar esse catálogo do zero |
| Característica com bônus de ataque | A ligação do bônus de Característica às Ações de ataque continua questão aberta. O canal geral de acerto e a Característica de bônus não percorrem exatamente o mesmo caminho |
| Contexto da Característica Livre | Expor PV, estado em campo, forma e demais variáveis da própria sessão quando necessárias ao `quando` do Motor |
| Intermediários | Meio espaço por invocação é calculado no resumo, mas não somado à carga do dono |

Fontes: Livro p.90 a 101 e 256 a 274, [Invocações](../../src/systems/afty/afty-invocacoes.js), [entrada](../../src/systems/afty/ficha/ficha-sessao.js#L635), [interface do limite](../../src/systems/afty/ficha/abas/AbaInvocacoes.jsx#L1585), [fila do Controlador](../a-fazer.md#controlador-seis-poderes-dão-bônus-que-dependem-de-posicionamento).

Hordas, Quimeras, tipos especiais, múltiplos núcleos de invocação, manutenção de Corpos e vários estados de destruição já foram implementados. Esses itens têm asserts próprios aprovados nesta execução. Ainda é necessário cotejo semântico dos textos e parâmetros particulares de cada tipo antes de certificar integralmente o capítulo, mas sua falta de auditoria não deve ser registrada como ausência de código.

## 9. Descansos, Interlúdios, ferramentas e Aliados

| Item | O que falta |
|---|---|
| Dados de Vida | Pilha por classe, gasto, rolagem, Constituição, recuperação e efeitos que aumentam dados curados. É outro trabalho além de registrar PV rolado ao subir de nível |
| Descanso fiel ao livro | Tipos curto/longo, recuperação parcial, Alma, Exaustão, kits e produção em troca de recuperação. **O botão único foi decidido pelo autor**, portanto não alterar esse comportamento silenciosamente |
| Adaptação de Interlúdio | Processo de troca com limite e mesma Especialização, registro do Foco e alterações. O módulo `afty-adaptacao.js` é o ciclo do Mahoraga, não este procedimento |
| Produção por Interlúdio | Testes de Ofício, CDs por custo, número de tentativas, troca de tentativa por vantagem, teto de acessórios/uniformes e entrega no inventário. O Caderno de Forja e as receitas de itens não cobrem sozinhos esse processo |
| Criação de Invocações no Interlúdio | Tentativas, CD por grau, acesso, vestígios guardados e seu gasto, produto entregue |
| Linhas de Treinamento | Registro de tentativa/sucesso nas etapas que pedem teste, se adotado. Não reabrir o Treino Especial, que já registra essas etapas |
| Potencial Físico, segunda etapa | Conceder e alocar dois pontos em atributos físicos. O canal livre `pontosAtributo` já existe, mas a etapa continua só com texto e ainda exige a restrição ao conjunto físico |
| Energia Reversa no treino | Ligação da redução de custo à Aptidão escolhida e dos tetos às aplicações além da cura. A primeira etapa já aumenta o teto da cura |
| Críticos e Dados de Vida nos treinos | A etapa que concede o benefício precisa se ligar aos procedimentos gerais de crítico de arma e Dados de Vida |
| Ferreiro | Controlar quantidade de equipamentos melhorados por descanso. Arma/escudo já aplicam os benefícios nos canais corretos |
| Aliados | Fechar o tratamento do seletor cheio, grau do Player e companheiros de Controlador. Elementalista foi corrigido em 27/10 para o primeiro ataque da Técnica/Feitiço, sem pressupor cobertura de todos os tipos especiais |

Fontes: Livro p.142 a 145 e 335 a 348. [Treinos](../../src/systems/afty/afty-treinamentos.js#L362), [Forja](../../src/systems/afty/afty-forja.js), [extras nativos](../../src/systems/afty/afty-extras-nativos.js), [decisões das Técnicas Marciais](../afty-tecnicas-marciais.md).

## 10. Votos e regras transversais

| Item | O que falta |
|---|---|
| Tipos de Voto | Representar diferenças entre próprio temporário, próprio permanente, emergencial, contratual e Restrição Congênita. Hoje Contratual é texto e Mecânico é benefício/malefício livre |
| Peso e legalidade | Seletores e validação para os domínios e limites de cada peso, equivalência da troca e regras do emergencial. O Motor executa o que foi escrito, não valida o Voto do livro |
| Prazo e ruptura | Estado de vigência, término, quebra, perda do benefício e consequência definida pela mesa. Um `quando` genérico não representa o histórico de ruptura |
| Restrição Congênita | Limites próprios de criação, opções permitidas/proibidas e obrigação de Valores Fixos quando altera atributos. A autoria livre não impõe essas regras |
| Temporários | N12, mais identidade, substituição, exceções de acúmulo, duração e teto de PV temporário nos caminhos de concessão. Preservar exceções de Cobrir-se, Guarda e outras fontes |
| Fontes de efeitos | N06 e decisão já pendente sobre efeito global versus direcionado. Auditar também a preservação do grupo/origem ao transferir benefícios entre fichas |
| Compra permanente versus efeito temporário | Conservar a separação para pré-requisitos e tetos. Na Expansão, a possibilidade de alocar níveis que só existem com o efeito ativo permanece uma questão de implementação registrada na fila |

Fontes: Livro p.350 a 358 e 365 a 366. [Modelo e normalização de Votos](../../src/systems/afty/afty-votos.js#L20), [emissão de efeitos](../../src/systems/afty/afty-votos.js#L216), [temporários](../../src/systems/afty/ficha/ficha-sessao.js#L1583).

## 11. O que depende de decisão, e o que já tem fonte suficiente

Não é necessário pedir que o autor envie novamente:

- Corpo Amaldiçoado Mutante: p.39 a 41.
- Efeitos de crítico de todos os grupos de arma: p.308.
- Exaustão comum e seus seis níveis: p.324.
- Prosa de Feitiços Auxiliares: p.215 a 227.
- Criação de Itens e Invocações em Interlúdios: p.336 e 337.

As entradas antigas que dizem que esses textos não chegaram precisam ser atualizadas quando o trabalho correspondente for assumido. A existência da fonte não aprova automaticamente divergências específicas do Afty ou decisões da mesa.

Continuam decisões reais, já registradas na [fila única](../a-fazer.md):

1. PV fixo ou oferecer rolagem por nível.
2. CD de Especialização separada, expressamente adiada.
3. Descanso único versus retomar os dois tipos do livro, mantendo a decisão atual até nova instrução.
4. Cobrança automática de estados e manutenção, incluindo Armas Absolutas. Não transformar custo exibido em débito silencioso.
5. Acúmulo global versus direcionado e grupos de benefícios das invocações.
6. Alcance do Golpe Especial em Feitiços e equivalência de Sangramento Leve/Fraco.
7. Escala de Grau do Player e escopos de Aliados com Ataque Amaldiçoado.
8. Perguntas já abertas de Técnica Máxima/Domínios e os 16 pontos provisórios de Técnicas Marciais.
9. Leituras dos Pacotes para Aliados e aceite das telas G2.
10. Integração dos sete commits remotos com o trabalho local, antes de afirmar que esta base é a publicada.

Também devem ser confirmadas as simplificações que afetam a fidelidade, como a tradução do dano Passivo em média fixa. Não encontrei nesta passagem uma decisão específica que transforme essa representação em cobertura integral da rolagem prevista no livro.

## 12. Ordem para terminar

O melhor fechamento reduz dependências repetidas. Esta é uma ordem de implementação, não uma estimativa de prazo:

| Etapa | Entrega concreta | Como saber que terminou |
|---|---|---|
| 1 | Corrigir os números demonstrados | Contraprovas dos cenários N02 a N08 e N12, mantendo ambos os sistemas e as decisões de casa. Dar identidade correta às fontes de item |
| 2 | Operação geral de uso | Validar acesso, escolher alvo/parâmetros, conferir recurso, registrar uma vez, cobrar conforme a política autorizada, aplicar e registrar duração/recarga. Aproveitar as rotinas de custo e uso já existentes |
| 3 | Ataque e reação com alvo declarado | Receber resultado confirmado, tipo de dano e TR. Resolver crítico de grupo, efeitos do Golpe, posturas, talentos e retornos de dano sem pedir ao sistema que conheça o mapa |
| 4 | Recursos vitais e concentração | Portas da Morte, negativos, cura, ferimentos, Exaustão comum, Dados de Vida e concentração com vínculo ao efeito |
| 5 | Completar as origens e seus Talentos | Mutante com seus núcleos, Marcas/Focos, recursos de origem e as 15 Anatomias da matriz |
| 6 | Feitiços, inventário e invocações | Passivas, Transformação, condições, produção, consumo, encantamentos ativos, limite/retorno de invocação, Forma de Arma e auxílios |
| 7 | Interlúdios e Votos | Focos de produção/adaptação, ligação das etapas restantes, tipos/pesos/prazos/ruptura de Votos |
| 8 | Fechar a verificação do produto | Integração do remoto, correção dos dois problemas do lançador/reconciliação, regressão de Player e Afty, importação antiga e teste de sessão nas telas clássica, G2 autorizado e Encontro |

Para cada conteúdo, o critério de fechamento deve percorrer: fonte, escolha, requisito, conta, consumidor, operação de sessão, persistência, interface e origem do número. Tabela certa, botão visível ou assert de cadastro não bastam isoladamente.

## Limites explícitos desta análise

Foi feita leitura ampliada das fontes e dos caminhos de código citados, reprodução dos cenários N01 a N15, inventário dos catálogos, confronto literal de nomes e conferência numérica das 412 células. Os relatórios extraídos estão em `.audit/livro-20261029/`. O snapshot `catalogos.json` normaliza a pontuação proibida no repositório e serve somente como inventário, não como fonte de texto verbatim. Os catálogos originais não foram modificados.

Não foi concluída uma auditoria semântica de **cada cláusula de cada uma das 361 entradas de Habilidades**, de todo suplemento, addon ou parâmetro de tipo especial de invocação. O confronto de nomes e os testes existentes não substituem isso. As famílias cujo comportamento integral ainda precisa desse cotejo estão identificadas acima como trabalho de verificação, sem ser rotuladas como recurso ausente. Não há certificação de 100% nem percentual de conclusão do site.

O escopo é o Livro de Regras e os percursos locais relacionados. Grimório das Maldições, Livro do Narrador, textos externos de homebrew, hospedagem, autenticação e backend não foram adicionados artificialmente à conta de regras que faltam.
