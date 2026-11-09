# CX3, frente Aptidões e Treinos (Claude), entrega de 07/11

Escopo recebido: Absorção Elemental de Aura, alcance das passivas em Expandir Aura e pendências de Treinos
(parte verificável), depois o diagnóstico por cláusula de Punho Divergente, Anular Técnica, Revestimento de
Domínio e Emoção da Pétala Decadente. Este arquivo é novo e só desta frente. Não toca em `CX3.md`, `a-fazer.md`,
`afty-status.md`, no Livro nem em `src/components/`.

Fonte: Livro de Regras 2.5.2, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`
(conferido). Páginas citadas são as impressas, pelo último marcador `<!-- página N -->` acima do trecho.
Nenhum commit, push, pull, merge, reset ou stash.

## 1. O que entrou no workspace (arquivos novos, nenhum compartilhado editado)

| Arquivo | Papel |
| --- | --- |
| `src/systems/afty/afty-conteudo-auras.js` | FOLHA, zero imports. Números de Absorção Elemental (p.175) e a tabela de alcance de Expandir Aura (p.174, 177, 179) |
| `src/systems/afty/afty-conteudo-antidominio.js` | FOLHA, zero imports. Números puros de Punho (p.181), Pétala (p.181), Revestimento e Anular (p.182) e Anti-Domínios (p.246) |
| `src/systems/afty/ficha/ficha-conteudo-absorcao-elemental.js` | Cliente da Reação: lê o recibo real, gasta a Reação e arma a carga no CL1 |
| `src/systems/afty/ficha/ficha-conteudo-expandir-aura.js` | Cliente de Expandir Aura (Livre, 2 PE, manutenção de 1 PE) e leitura do alcance efetivo |
| `src/systems/afty/ficha/ficha-conteudo-treino-resistencia.js` | Cliente do Completo do Treino de Resistência (ignora a primeira falha de morte) |
| `asserts/t-cx3-absorcao-elemental.mjs` | 95 verificações (67 sem o patch da seção 3, que já está aplicado no workspace) |
| `asserts/t-cx3-expandir-aura.mjs` | 54 verificações |
| `asserts/t-cx3-treino-resistencia.mjs` | 57 verificações |
| `asserts/t-cx3-antidominio-numeros.mjs` | 24 verificações |
| `CX3-aptidoes-treinos/patch-absorcao-elemental.diff` | Patch de `afty-combate-aptidoes.js`, validado em cópia fora do repositório |

Todos os asserts rodam em Player e Afty (`creature.rulesVersion`), importam `afty-derive.js` primeiro e não escrevem
no repositório. `eslint` limpo nos cinco módulos. `t-ordem-modulos.mjs` aprovado. Fora a integração da Absorção feita pelo chat de integração (`afty-combate-aptidoes.js` importa a FOLHA
`afty-conteudo-auras.js`), nenhum módulo existente importa os novos, então o resto só muda quando a tela chamar os clientes.

`t-revisao-g00.mjs` listou os cinco módulos como "sem proprietário" até o `escopo.json` entrar (seção 8.6, já aplicado). Esse
assert continua falhando por módulos de outros lotes.

## 2. Separação pedida: numérico e validável contra janela e posição

| Parcela | Classe | Estado |
| --- | --- | --- |
| Absorção Elemental (armar a carga, tipo, dados, consumo) | independente | entregue, falta só o patch do seção 3 |
| Expandir Aura (uso, custo, manutenção, alcance efetivo) | independente | entregue, falta só ligar a exibição (seção 4) |
| Treino de Resistência Completo | independente | entregue, falta só o botão (seção 5) |
| Números de Punho, Pétala, Revestimento, Anular | independente | entregues em módulo puro |
| Punho: dano guardado, TR, vulnerabilidade | contrato de janela (turno seguinte) | só diagnóstico (seção 6) |
| Anular Técnica | recibo de Feitiço e janela anterior ao efeito | só diagnóstico |
| Revestimento | janela anterior ao dano, redução não ignorável, manutenção escalonada | só diagnóstico, com os dois patches de núcleo descritos |
| Pétala | recibo de Expansão, Concentração, relógio do turno | só diagnóstico |

Nenhuma dessas quatro foi marcada como implementada. O catálogo tem o texto, o Motor ainda não tem consumidor.

## 3. Absorção Elemental (p.175)

Texto: reação ao receber dano elemental, sem reduzir o dano, e no próximo ataque `Xd6` do mesmo tipo, `X` = Nível de
Aptidão em Aura, d8 no nível 3 e d10 no nível 5, não cumulativa. Pré-requisito: Aura Elemental.

| Cláusula | Comportamento reproduzido | Núcleo reutilizado | Prova |
| --- | --- | --- | --- |
| "Sempre que você receber dano elemental" | O recibo vem do registro `Ataque Confirmado` do CL1 na sessão de QUEM RECEBEU (`calculos[].tipoDano`, `final > 0`), filtrado por `meuId`, porque o registro existe também na sessão do atacante | `confirmaAtaqueConteudo`, `registraRolagem`, `tiposDeDanoDaCategoria("elemental")` | `recibosElementais`: físico e dano zerado por RD não são recibo, atacante e terceiro não reconhecem |
| "usar sua reação" | `usa` com `acao: "reacao"` e `registraAcao`, sem PE | `usa`, `gastaAcao`, `usarEfeitoEspecializacao` | Reação gasta, recusa sem Reação ou com Atordoado não arma nada e devolve a mesma sessão |
| "Isso não reduz o dano" | O cliente não toca em PV, casca nem Alma | `aplicaDanoRecebido` já aplicou antes | PV, Alma e casca idênticos antes e depois |
| "Xd6 ... d8 ... d10" | `facesAbsorcaoElemental`: 1 e 2 em d6, 3 e 4 em d8, 5 ou mais em d10. Não é a escada 4/6/8/10 da Aura Elemental | `grupoDanoAbsorcaoElemental` no formato dos grupos de `aplicarAptidoesNoDano` | Escada, nível 0 sem dado, nível 5 em `5d10` |
| "na próxima vez em que você realizar um ataque" | Pendência `absorcao_elemental` com `consome: "declaracao"`: qualquer ataque de arma ou desarmado a gasta, errando ou acertando, e o estado volta a desligado. A p.175 não abre a exceção da p.178. Feitiço fica de fora até D3 | `armaProximoAtaque`, `registraAtaqueRealizado` | Erro e acerto desarmado gastam, Feitiço não. Depois de gasta o mesmo recibo não absorve de novo |
| "não é cumulativa" | Com carga guardada a segunda absorção é recusada ANTES de gastar a Reação | id fixo da pendência | Recusa com `Já Existe uma Carga Guardada` e Reação intacta |
| Aptidão de Maldição homônima | `mal_absorcao_elemental` não habilita a de Aura | `disponiveisConteudo` do derive | Contraprova |
| Salvar e recarregar | A carga e o tipo sobrevivem | `normalizaSessao` | `recarregar conserva a carga` |
| Fim do combate e descanso | CL1 limpa a pendência, o uso ativo e o estado. O prazo entre combates é a pergunta já enviada | `fechaCombateNoUso`, `zeraUsoNoDescanso`, `encerraAtivoNaSessao` | Pendência, uso ativo e estado zerados, e combate novo sem herdar a carga |

Achado de revisão corrigido: com o patch, o estado `absorcaoElemental` sobrevivia ao fim do combate e ao descanso, porque o
CL1 limpa a PENDÊNCIA mas só desfaz o ESTADO por um uso ativo. O uso agora tem `duracao: { ate: "descanso" }` e `emCombate`, e a
pendência leva `usoId`, igual ao `armaCanalizacao`. Consumo, fim do combate e descanso desligam o estado pelo mesmo
`encerraAtivoNaSessao`. Há asserts para os três, sem e com o patch. Também: o recibo só vale na rodada em que o dano foi recebido
(Reação é resposta ao gatilho), e a pendência exclui Feitiço (ver D3).

Achado de contrato: `normalizaPendencia` (`ficha-uso-estado.js`) descarta qualquer campo fora de
`id, usoId, nome, elegivel, consome, expira, estado, desde`. Uma pendência NÃO consegue carregar o tipo nem os dados.
Por isso o tipo mora num estado de combate de `tipo: "opcao"` (`absorcaoElemental`, mesmo formato do Golpe com Aura), que
a pendência desliga com `estado`. O dado extra entra no golpe lendo esse estado.

**Patch de integração** (arquivo compartilhado `afty-combate-aptidoes.js`). ESTADO: já aplicado no workspace pelo chat de integração durante esta sessão, em forma equivalente à do diff (conferido no arquivo). O assert detecta o estado sozinho e o trecho de ponta a ponta passou a rodar no repositório, 95 verificações. Referência original e validada em cópia: `CX3-aptidoes-treinos/patch-absorcao-elemental.diff`. Faz três coisas: registra o estado `absorcaoElemental` em
`estadosCombateAptidoes`, e em `aplicarAptidoesNoDano` acrescenta o grupo `Absorção Elemental` (critável, `durante`) quando
o estado traz um tipo elemental. A prova de ponta a ponta cobre: grupo no golpe, d8 no nível 3, 5d10 no nível 5, dado some depois de gasto, tipo não
elemental ignorado, sem a Aptidão nada acontece, e o fim do combate e o descanso NÃO deixam o dado para o combate
seguinte. Nota: o arquivo do repositório está em CRLF e o diff foi gerado com LF.

Ponto de entrada de tela (também Codex): na linha do dano recebido do Encontro, listar `recibosElementais(sessao, meuId)` e
chamar `absorveElemental(sessao, derived, { ataqueId, tipoDano, meuId, descontarPE? }, { opId })`. Contrato: `meuId` é o id
do combatente que reage, o mesmo que o confirmador gravou como `ataque.alvo.id`. Dano elemental que não passa por
`Ataque Confirmado` (Feitiço, queda, ambiente) ainda não tem recibo: fica sem botão.

## 4. Expandir Aura (p.179)

Texto: no seu turno, Livre, 2 PE, dobra o alcance de TODAS as aptidões de aura PASSIVAS por uma rodada, +1 PE por rodada
seguinte. Aura Movediça (p.177) proíbe: "A área afetada por esta aptidão não pode ser aumentada por Expandir Aura".

| Cláusula | Comportamento | Núcleo | Prova |
| --- | --- | --- | --- |
| "No seu turno, como uma ação livre" | Exige `emSeuTurno` e turno não encerrado (mesmo guarda de Concentrar Aura), identidade de Livre própria | `usa`, `gastaAcao` | Fora do turno, turno encerrado, fora de combate e incapacitado recusam |
| "2 pontos de energia" | Custo 2 PE, cobrança manual avisa e a confirmada debita, PE insuficiente recusa | `usa` | `Faltam 1 PE` |
| "por uma rodada. Para cada rodada após a primeira ... 1 ponto" | `duracao.manutencao: { pe: 1 }`, mesmo molde da Aura Embaçada | `avancaUsoNaRodada`, `pagaManutencao` | A virada marca 1 PE devido, pagar zera a devida |
| "dobrando o alcance" | `alcancesDasAurasPassivas` devolve base e atual de Chamativa e Bastião (4,5 m, p.174) e Macabra (1,5 m, p.177) | tabela em `afty-conteudo-auras.js` | 4,5 para 9 e 1,5 para 3 |
| Aura Movediça | Aparece com o alcance do Livro por nível (1,5, 3, 4,5 e 6 m) e nunca dobra, com o motivo do Livro | idem | Linha com `motivo` |
| Passiva suspensa por Concentrar Aura | Não expande (a passiva está desligada por uma rodada) | `derived.combate.concentrarAura` | `suspensa: true`, sem dobrar |
| Manutenção não paga | Alcance volta à base. Ajuste feito por outro editor nesta sessão (15:02), conferido e mantido. `auraExpandida` continua lendo só o uso ativo | `manutencao.devidas` | `sem manutenção paga os alcances retornam à base` |

Auras PASSIVAS com alcance numerado no texto: só Chamativa, Bastião e Macabra. Lacerante (3 m) e Comandante (4,5 m) são
ativadas e ficam de fora. As demais passivas de `AURAS_PASSIVAS` (Controlada, Contenção, Drenadora, Elemental,
Inofensiva, Maciça, Reforçada) não trazem alcance.

**Patch de integração** (Codex): `ficha/pacotes-familias.js`, `fontesDeAura(c)`. O texto `Dentro de 4,5 m do Emissor` do
Bastião e do Comandante é literal. O contrato esperado é `c.alcancesAura`, um mapa `id -> metros` montado por quem tem a
sessão: `Object.fromEntries(alcancesDasAurasPassivas(sessao, derived).map((a) => [a.id, a.atual]))`. O Bastião passa a
escrever `Dentro de ${metros(c.alcancesAura?.aura_do_bastiao ?? 4.5)} m do Emissor` (vírgula decimal). O Comandante é
ativa e fica em 4,5. A sessão não existe no resolvedor de Pacotes hoje, então esse mapa precisa ser passado de fora.

## 5. Pendências de Treinos

Auditoria mecânica das 12 linhas do catálogo (`AFTY_TREINAMENTOS`) contra as tabelas do Livro p.339 a 346: foco,
requisito e benefício de cada etapa conferem (Agilidade, Barreiras, Compreensão, Controle de Energia, Domínios, Energia
Reversa, Luta, Potencial Físico, Resistência). Etapas sem `efeitos` numéricos e quem as consome:

| Etapa sem efeito numérico | Página | Consumidor existente |
| --- | --- | --- |
| Energia Reversa 3 e 4, Completo | 342 | `ficha-conteudo-uso.js` (desconto de 2 PER, Fluxo regenera, exaustão após Domínio) |
| Luta Completo (crítico de pugilato, vantagem) | 343 | `criticoConcedido`, `usaTesteConteudo` (`case "luta"`) |
| Manejo 3 (crítico da arma), Completo | 344 | `criticoConcedido`, `vagaEncantamento` |
| Perícia 2, 4 e Completo | 345 | `usaTesteConteudo` (`treino`, `treino-sucesso`), `rerrolaTreinoPericia` |
| Potencial Físico 2 | 346 | escolhas restritas (CX3) |
| Resistência 2 (dados de vida) | 346 | `dadosExtrasDeTreinamento`, pilha de CL2 |
| Domínios Completo | 341 | texto-prêmio, decisão do autor de 26/08 (sem catálogo) |
| **Resistência Completo: "Uma vez por cena, você ignora a primeira falha em testes de morte"** | **346** | **nenhum** |

Única pendência real encontrada: Resistência Completo. Os números do mesmo Completo (+10 PV, margem do TR de Fortitude
em 2) já estão no catálogo. A cláusula de morte não tinha consumidor: `rolaTesteDeMorte` resolve o d20 e as
consequências na mesma chamada e o CX3 decidiu não desfazer morte por um segundo cálculo.

Solução entregue, `ficha-conteudo-treino-resistencia.js`: `rolaTesteDeMorteComTreino` decide ANTES de resolver. Olha o
natural, e só quando ele causaria falha e o Treino está completo e a cena tem o uso livre, resolve sem a primeira falha.
Em qualquer outro caso delega ao núcleo, com o mesmo d20, e o resultado é idêntico (provado para 1, 5, 9, 10, 15 e 20).
O uso é `limite: { por: "cena" }` do CL1. O d20 1 (duas falhas) perde uma e fica com uma. Com duas falhas acumuladas um 1
ainda mata, e um 5 salva. Recusas do núcleo (fora das Portas, sem teste pendente, d20 inválido) continuam as dele.

Ponto de entrada: `rolaTesteDeMorte` não tem chamador de tela hoje (a tela das Portas da Morte é de CX6). Quando
existir, o botão deve chamar `rolaTesteDeMorteComTreino`, mesma assinatura e mesmo retorno mais `falhaIgnorada`.

Fora desta lista, por decisão aberta já registrada: Registro de tentativas das Linhas e prazo da carga de Absorção
Elemental. Não repetidas.

## 6. Diagnóstico por cláusula das quatro Aptidões de janela

Nenhuma está implementada. `grep` por id em `src/` encontra o catálogo, a exclusão das duas de Controle e Leitura na
Invocação por Controle Aprimorado, e o modificador de Estilo das Sombras do Punho. Todas passam por
`aptidao.disponiveisConteudo` do derive (conferido: as seis entram quando o requisito vale).

### 6.1 Punho Divergente (p.181)

**O que a ficha faz hoje com Punho Divergente:** disponível em `aptidao.disponiveisConteudo` quando o requisito vale, sem estado de combate, sem efeito no Motor e sem cliente de uso. O texto aparece no catálogo e a mesa aplica à mão.

Exceção: o modificador `Punho Divergente no Domínio` do Estilo das Sombras (CD + CL, TR na mesma rodada) existe e vale só dentro da Técnica.

| Cláusula | Comportamento a reproduzir | Núcleo reutilizável | Teste | Depende de |
| --- | --- | --- | --- | --- |
| "Ao acertar um ataque desarmado, você pode escolher causar apenas metade do dano, e guardar a outra metade" | Escolha no ato da confirmação. Aplicar `floor(total / 2)` e guardar o resto | `confirmaAtaqueConteudo` aplica por tipo e já guarda `categorias` (`desarmado` só para o Ataque Básico) | `metadesDoPunhoDivergente` (entregue): o total nunca se perde | Parâmetro de opção na confirmação (Codex) |
| "Esta aptidão não pode ser utilizada em um ataque que seja um raio negro" | Recusa | A confirmação já recusa Raio Negro com `Raio Negro Requer Resolução de Dano na Mesa`, então já é impossível usar. Recusa específica precisa de mensagem própria | assert futuro `punho-raio-negro`: a opção de Punho com `dano.raioNegro` devolve a recusa própria e não grava metade | Contrato do Raio Negro misto em CL1 |
| "no turno seguinte ... deve realizar um teste de resistência de Fortitude" | Guardar a metade com dono, alvo, tipos e CD, e abrir o TR no turno certo | `normalizaPendencia` descarta carga, então não serve. Precisa de um registro novo na sessão do alvo (ou do atacante), no molde do dano secundário do Dragão | assert futuro `punho-turno-seguinte`: a metade guardada só aparece no turno decidido (P2), o TR usa `cdPunhoDivergente` e a falha aplica o tipo com vulnerabilidade | Relógio do turno e dono do registro (decisão P2) |
| "(maior atributo físico)" | CD = CD de Aptidão com o atributo da Técnica trocado pelo maior de FOR, DES e CON | `derived.cd`, `derived.modTecnica`, `derived.mods` | `cdPunhoDivergente` (entregue), contra Player e Afty | Nenhuma |
| "para cada 5 pontos ... a CD aumenta em 1" | `+floor(imediato / 5)` | idem | `bonusCdPunhoDivergente` (entregue) | Nenhuma |
| "como se o inimigo tivesse vulnerabilidade" | Segunda metade com estado `vulneravel` forçado no tipo, só quando o TR falha | `calculaDanoRecebido` aceita `estados` e `desempate`. A confirmação já monta `defesa` ajustada por tipo (`removeResistencia`) | `segundaMetadeComVulnerabilidade` (entregue). Assert futuro `punho-vulnerabilidade`: falha do TR soma `floor(guardado / 2)` ao guardado, sucesso não, alvo resistente pede desempate | Conflito se o alvo já é resistente (P4) |
| Estilo das Sombras | O modificador `Punho Divergente no Domínio` (CD + CL, TR na mesma rodada) já existe e NÃO muda a Aptidão global | `afty-estilo-sombras-catalogo.js`, `t-estilo-sombras-aptidoes.mjs` | existente | Nenhuma |

### 6.2 Anular Técnica (p.182)

**O que a ficha faz hoje com Anular Técnica:** disponível em `aptidao.disponiveisConteudo` quando o requisito vale, sem estado de combate, sem efeito no Motor e sem cliente de uso. O texto aparece no catálogo e a mesa aplica à mão.

| Cláusula | Comportamento | Núcleo | Teste | Depende de |
| --- | --- | --- | --- | --- |
| "quando você for alvo ou submetido a um Feitiço ... reação" | Janela ANTERIOR ao efeito do Feitiço | `usa` com `acao: "reacao"` | assert futuro `anular-reacao`: com recibo de Feitiço, a Reação é gasta antes do efeito, recusa sem Reação ou sem usos devolve a mesma sessão | Janela prospectiva em `EVENTOS_DE_COMBATE` (só registra ataque resolvido e turnos) e recibo do Feitiço (Codex) |
| "de um nível que você tem ou teria acesso" | Recusar nível acima do máximo da ficha | `derived.feiticos.nivelMax` | `podeAnularNivel` (entregue) | Nível no recibo |
| "energia igual à que foi usada para conjurar" | Custo = energia gasta na conjuração | `usa` com `custo.pe` calculado | `custoAnularTecnica` (entregue) | Custo real no recibo (A3) |
| "teste Feitiçaria contra a Feitiçaria de quem usou" | Disputa entre dois totais, empate à mesa | `usaTesteConteudo` e o teste de Feitiçaria da ficha | `disputaAnularTecnica` (entregue) | Total do conjurador no recibo (A1) |
| "em área, nenhuma das criaturas submetidas sofrem o efeito" | O recibo da área anula para todos os alvos | recibo de Feitiço | assert futuro `anular-area`: o Feitiço de área anulado não aplica efeito a nenhum alvo do recibo | Alvos no recibo (A5) |
| "vezes igual ao Nível de Aptidão em Domínio, por descanso longo" | `usos: { chave, max }` zerado no descanso | `usa`, `zeraUsoNoDescanso` (como `treino:pericia`) | `usosAnularTecnica` (entregue) | Nenhuma |
| Pré-requisito Domínio Simples | O remendo do Domínio Simples por Addon não foi reaberto | `a-fazer.md`, entrada de 22/08 | `Anular Técnica pede Domínio Simples...` (entregue) | Nenhuma |

### 6.3 Revestimento de Domínio (p.182, regras de aplicação na p.246)

**O que a ficha faz hoje com Revestimento de Domínio:** disponível em `aptidao.disponiveisConteudo` quando o requisito vale, sem estado de combate, sem efeito no Motor e sem cliente de uso. O texto aparece no catálogo e a mesa aplica à mão.

O catálogo da Maldição tem um `Revestimento` homônimo (`mal_revestimento`, RD física) sem relação com este.

| Cláusula | Comportamento | Núcleo | Teste | Depende de |
| --- | --- | --- | --- | --- |
| "5 PE e uma Ação Bônus, ou reação ao ser alvo dos efeitos de um Feitiço" | Ativar em Bônus ou Reação, 5 PE | `usa` com `acao`, `duracao.manutencao` | `ATIVAR_REVESTIMENTO` (entregue) | Janela da reação (Codex) |
| "5 PE para sustentar no início dos seus turnos" e p.246 "para cada rodada depois da primeira, aumente o custo em 2" | Manutenção escalonada, normalizando quando a expansão acaba | `pagaManutencao` usa `manutencao.pe` constante. Precisa de `manutencao.passo` e custo `pe + passo * rodadas` | `custoSustentarRevestimento` (entregue, leitura literal 5, 7, 9) | Patch de núcleo (seção 8.3) e decisão R1 |
| "reduz o dano de efeitos de técnicas ofensivas em ... nível de personagem. Essa redução não pode ser ignorada" | Redução fixa DEPOIS da RD e fora de `rdIgnorada` | `calculaDanoRecebido` só tem `rdIgnorada`, que desliga a RD | `danoAposRevestimento` (entregue) | Patch de núcleo (seção 8.2) e marca de "técnica ofensiva" no recibo |
| "nível menor ou igual a metade do Nível de DOM, arredondado para cima, é completamente anulada" | Arredonda PARA CIMA por texto expresso | nível do Feitiço no recibo | `nivelMaximoAnuladoPeloRevestimento` (entregue) | Nível no recibo |
| "apenas para Feitiços que não afetem diretamente a sua energia amaldiçoada" | Exceção por Feitiço (Boogie Woogie, Nulificação) | autoria do Feitiço | assert futuro `revestimento-excecao`: Feitiço marcado como afetando a energia do alvo passa direto | Marca no Feitiço (decisão R5) |
| "seus golpes também anulam ... efeito passivo, ativo, sustentado ou duradouro" | Remover efeitos de Feitiço no alvo até o nível anulável. Funcionamento Básico vale como nível 1 | `NIVEL_DO_FUNCIONAMENTO_BASICO` (entregue) | assert futuro `revestimento-golpe`: golpe do usuário remove efeitos de nível até a metade (para cima) do Nível de DOM e preserva os maiores | Registro de efeitos de Feitiço por origem e nível NO ALVO, que não existe |
| "você não pode utilizar ou estar sob o efeito de qualquer Feitiço" | Bloqueio de uso de Feitiço enquanto o uso estiver ativo | `acesso` do `usa` e `ficha-conteudo-acesso.js` | assert futuro `revestimento-bloqueio`: com o uso ativo, `usa` de Feitiço recusa com motivo próprio (decisão R6) | Decisão R6 |
| p.246 "não pode usar mais de dois anti-domínios ... Revestimento e Pétala ao mesmo tempo, por exemplo" | Texto contraditório | nenhum | nenhum | Pergunta ao autor (R7) |

### 6.4 Emoção da Pétala Decadente (p.181)

**O que a ficha faz hoje com a Pétala:** disponível em `aptidao.disponiveisConteudo` quando o requisito vale, sem estado de combate, sem efeito no Motor e sem cliente de uso. O texto aparece no catálogo e a mesa aplica à mão.

A Invocação por Controle Aprimorado exclui expressamente Punho Divergente e Pétala (`afty-derive.js`, `aptidoesPelaInvocacao`).

| Cláusula | Comportamento | Núcleo | Teste | Depende de |
| --- | --- | --- | --- | --- |
| "reação a uma expansão ser ativada ou ação bônus" | Ativar como Reação ou Bônus, efeito de Concentração | `usa` com `concentracao: true`, `abreConcentracaoNaSessao` | assert futuro `petala-ativacao`: Reação ou Bônus abre o uso de Concentração, perder a Concentração o encerra | Evento de ativação da Expansão do outro participante |
| "acerto garantido físico ... gastar energia igual ao nível de DOM da criatura que expandiu" | Anular o acerto garantido pagando o DOM do expansor, só se físico | `expansaoNaSessao`, `acertoGarantidoSuprimidoPor`, `ficha-dominio-confronto.js` | `custoDeAnularAcertoGarantido` (entregue) | Recibo da Expansão com DOM e marca de contato físico (decisão L1) |
| p.246 "efeitos de Expansão, desde que capazes de contato físico" | Inútil contra intangível | AftyDominioEditor não marca físico hoje | assert futuro `petala-fisico`: acerto garantido sem a marca de contato físico não é anulável (decisão L1) | Campo no Domínio (L1) |
| "entre no alcance ou comece o turno ... ação livre, 5PE, ataque corpo a corpo com sucesso garantido" | Gatilho de posição e ataque sem teste | `PETALA_CONTRA_ATAQUE` (entregue), ataque confirmado do CL1 | assert futuro `petala-contra-ataque`: Livre e 5 PE geram ataque confirmado sem teste, posição declarada pela mesa | Posição, que a ficha não tem (declarada pela mesa) |
| "Se utilizar de forma ofensiva você não pode se proteger até o começo do seu próximo turno" | Bloqueio com relógio do próprio turno | `inicioDoProximoTurno` do CL1 | assert futuro `petala-ofensiva`: depois do ataque a defesa contra acerto garantido recusa até `inicioDoProximoTurno` | Nenhuma |
| Pré-requisito do Clã | Mapeado em Herdado por decisão de 16/07, preservado | catálogo | `Pétala exige ...` (entregue) | Nenhuma |

## 7. Dúvidas (registradas, nenhuma presumida além do que consta como "adotado")

Já enviadas ao autor e NÃO repetidas: prazo da carga de Absorção Elemental, Ação de Atacar e Recuar, faixas -3 e -2 de
Pular, registro de tentativas das Linhas.

| Id | Dúvida | Adotado enquanto isso |
| --- | --- | --- |
| D2 | Absorção Elemental "não é cumulativa": com carga guardada, a segunda absorção é recusada, substitui a carga ou vale a maior | Recusa, sem gastar a Reação |
| D3 | O "ataque" que gasta a carga inclui Feitiço? Canalizar exclui expressamente, Absorção não. O dado extra só entra no golpe de arma e desarmado | Feitiço não gasta nem recebe a carga, até o autor responder |
| D4 | "Receber dano elemental" vale se a RD ou a imunidade zerou o dano? | Exige dano final maior que zero |
| D5 | Um golpe com dois tipos elementais permite absorver os dois? | Cada tipo é um recibo, mas a carga é única |
| D6 | O dado da carga dobra no crítico? | Sim, como Aura Elemental |
| D7 | Nível de Aptidão em Aura 0 com a Aptidão: sem dado | Recusa |
| E1 | Aura Macabra já ampliada por 1 PE (4,5 m) dobra para 9 m com Expandir Aura? | Dobra a base de 1,5 m, resultando 3 m |
| E2 | "Passivas" são só as de alcance numerado ou também Lacerante e Comandante | Só as passivas com alcance escrito |
| E3 | Sem manutenção paga na rodada seguinte o alcance volta à base | Sim (ajuste de outro editor, mantido) |
| E4 | Expandir Aura sem nenhuma aura com alcance é permitido | Permitido |
| T1 | Resistência Completo: o d20 1 causa duas falhas, ignora uma ou as duas | Ignora uma |
| T2 | "Primeira falha em testes de morte" vale mesmo depois de um sucesso na cena | Sim |
| T3 | Falha causada por DANO nas Portas (p.313) também conta | Não, só falha de teste de morte |
| T4 | O que fecha a "cena" fora de combate | Nova cena é a de CL1 (`iniciaCombate`) ou descanso |
| P1 | Total ímpar do Punho: quem leva o ponto sobrando | Imediato = floor, o resto fica guardado |
| P2 | "Turno seguinte" é o do atacante ou o do alvo, e quando abre o TR | Sem adoção |
| P3 | "Ataque desarmado" inclui arma de pugilato e Armas Naturais | Só o Ataque Básico desarmado |
| P4 | A segunda metade em alvo já resistente (conflito de estados) | Desempate da mesa |
| P5 | A CD usa o maior físico no lugar do atributo da Técnica | Sim |
| A1 | Empate na disputa de Feitiçaria de Anular Técnica | Devolvido à mesa |
| A2 | "Nível que você tem ou teria acesso" é o máximo da ficha ou o da tabela | Máximo da ficha |
| A3 | "Energia usada para conjurar" é o custo base ou o final com reduções | Sem adoção |
| A5 | Feitiço em área anulado atinge também os aliados do conjurador | Sem adoção |
| R1 | Sustentação do Revestimento na 2ª rodada: 7 PE (5 + 2) ou 5 PE com +2 a partir da 3ª | 7 PE, leitura literal |
| R2 | "Reduz o dano de efeitos de técnicas ofensivas": uma vez por Feitiço, por efeito ou por tipo de dano | Sem adoção |
| R3 | O dano que a redução fixa abate: é depois da RD | Depois da RD |
| R5 | Como marcar o Feitiço "que afeta diretamente a sua energia amaldiçoada" | Sem adoção |
| R6 | "Não pode utilizar ou estar sob efeito de qualquer Feitiço" inclui Feitiços Passivos e Auxiliares de aliados | Sem adoção |
| R7 | p.246 "não mais de dois anti-domínios" contradiz o exemplo Revestimento e Pétala | Sem limite aplicado |
| L1 | Quem define que um acerto garantido é "físico" (p.181 e 246) | Sem adoção |
| L2 | O Nível de DOM do expansor inclui o +2 da Expansão (a Expansão exclui Domínio desse bônus) | Sem adoção |

## 8. Patches em texto (não aplicados)

Na continuação de 07/11, a janela de dano passou a aceitar o recibo
secundário do Dragão e o adicional tipado de Raio Negro. Isso amplia o
consumidor de dano de CL1. O vínculo prospectivo de Absorção Elemental
aguarda prazo e tratamento de segunda carga. Expandir Aura segue com
alcance de sessão nas fichas e no Encontro, e o alcance do pacote
continua estático até existir vínculo com o emissor. O Teste de Morte
em tela, os efeitos de Feitiço por alvo e os Acertos Garantidos
continuam nas dependências desta entrega.

### 8.1 `afty-combate-aptidoes.js` (Absorção Elemental)

JÁ APLICADO pelo chat de integração (ver seção 3). Fica o diff como referência validada. Contrato: o estado
`absorcaoElemental` guarda o id do tipo elemental e é desligado pelo uso ativo. Importa só a FOLHA nova.

### 8.2 `ficha-dano-recebido.js` (redução não ignorável do Revestimento)

Em `calculaDanoRecebido`, aceitar `reducaoFixa` (inteiro, padrão 0) e aplicar DEPOIS do passo `reducao`, fora de
`rdIgnorada`:

```js
const fixa = naoNegativo(reducaoFixa);
if (fixa > 0) valor = passo(passos, "reducaoFixa", "Redução Fixa", valor, Math.max(0, valor - fixa));
```

Repassar `entrada.reducaoFixa` em `aplicaDanoRecebido` e em `confirmaAtaqueConteudo` (hoje só repassa `rdIgnorada`).
Contrato: quem chama informa a redução já filtrada (só técnica ofensiva, só se o Revestimento está ativo).

### 8.3 `ficha-uso.js` (manutenção escalonada)

Em `pagaManutencao`, o custo hoje é `ativo.manutencao.pe`. Aceitar `ativo.manutencao.passo` (padrão 0) e cobrar
`pe + passo * mantidas`. `duracaoDoDescritor` precisa copiar `passo` de `d.duracao.manutencao`. Observação: com
`mantidas = 0` no primeiro pagamento, esse desenho dá 5 PE na 2ª rodada. A leitura literal da p.246 (7 PE) exige
`pe + passo * (mantidas + 1)`. A escolha depende da dúvida R1.

### 8.4 `pacotes-familias.js` (Expandir Aura)

Seção 4. Contrato `c.alcancesAura`.

### 8.5 Botões

`PainelConteudo.jsx`: chamar `absorveElemental` (seção 3) e `usaExpandirAura` com `{ emSeuTurno }`. Quando a tela das
Portas da Morte existir, usar `rolaTesteDeMorteComTreino`.

### 8.6 `docs/revisao-automacao/escopo.json`

JÁ APLICADO pelo chat de integração (conferido: as duas entradas da raiz e as três de `modulosAdicionais`, e
`t-revisao-g00.mjs` deixou de listar os cinco módulos). Conteúdo proposto, mantido por registro:

No mapa de módulos da raiz:

```json
"afty-conteudo-auras.js": "AD-24",
"afty-conteudo-antidominio.js": "AD-24",
```

Em `modulosAdicionais`:

```json
"ficha/ficha-conteudo-absorcao-elemental.js": { "modo": "INTERFACE", "justificativa": "CX3 (2026-11-07): Reação de Absorção Elemental sobre recibo de Ataque Confirmado e pendência de CL1. Livro p.175." },
"ficha/ficha-conteudo-expandir-aura.js": { "modo": "INTERFACE", "justificativa": "CX3 (2026-11-07): Expandir Aura sobre uso, manutenção e alcance das passivas de Aura. Livro p.174, 177 e 179." },
"ficha/ficha-conteudo-treino-resistencia.js": { "modo": "INTERFACE", "justificativa": "CX3 (2026-11-07): Completo do Treino de Resistência sobre o teste de morte de CL2 e o limite por cena de CL1. Livro p.313 e 346." }
```

(`AD-24` é o dono atual de `afty-combate-aptidoes.js`. Ajuste se o Codex preferir outro.)

### 8.7 `asserts/LEIA.md`

Acrescentar à tabela do contrato, depois da linha de `t-cx3-voto.mjs`:

- `t-cx3-absorcao-elemental.mjs`: 95 verificações em Player/Afty da Reação de Absorção Elemental sobre recibo real de `Ataque Confirmado`, janela da rodada, carga única, consumo por declaração (erro gasta, Feitiço não), fim do combate e descanso, e ponta a ponta no derive.
- `t-cx3-expandir-aura.mjs`: 54 verificações do uso Livre de 2 PE, manutenção de 1 PE, alcance dobrado de Chamativa, Bastião e Macabra, Movediça de fora e passiva suspensa por Concentrar Aura.
- `t-cx3-treino-resistencia.mjs`: 57 verificações do Completo do Treino de Resistência: ignora a primeira falha de morte uma vez por cena, delega ao núcleo nos demais casos.
- `t-cx3-antidominio-numeros.mjs`: 24 verificações dos números puros de Punho, Anular, Revestimento e Pétala.

O arquivo é reservado. Os números acima são os desta entrega e devem ser reconferidos na integração.

## 9. Verificação

- `npm run asserts -- cx3`: linha de base de saída 33 arquivos e 3.751 verificações. Agora **38 arquivos e 4.031 verificações, todos aprovados**
  (quatro arquivos desta frente mais um do chat de integração).
- Suíte completa (`npm run asserts`), executada nesta sessão: **305 de 307 arquivos aprovados**. Falham somente `t-reconciliacao-g00.mjs`
  e `t-revisao-g00.mjs`, as duas falhas conhecidas do repasse. Antes do `escopo.json` entrar, `t-revisao-g00` listava os cinco módulos novos;
  depois, não lista mais.
- `node asserts/t-ordem-modulos.mjs`: aprovado. `npx eslint` nos cinco módulos: limpo.
- Prova de ponta a ponta da Absorção, com o patch em cópia fora do repositório e depois no repositório integrado: 95 de 95.
- Zero U+2014 nos arquivos novos desta entrega, por varredura com `node` e controle positivo contra o Livro.
- Navegador: não executado. Nenhuma tela foi alterada, então não há o que conferir lá.

## 10. Continuação da frente em 07/11

Livro 2.5.2 reconferido pelo hash da abertura. Os módulos exclusivos
`ficha-cx3-*.js` chamam CL1 e CL2 e recebem recibos que o Encontro
deve construir a partir das duas sessões atuais. A etapa `pendente`,
o id, o tipo, o emissor, a lista de afetados e o turno são conferidos
antes da aplicação. A escolha da interface carrega a resposta, e o
provedor monta novamente o recibo. Posição e natureza do efeito vêm do
provedor ou de declaração registrada da mesa.

### Matriz da continuação

Na coluna de prova, **isolado** significa que o assert exercitou a
operação com `deriveAfty` e sessão real de Player e Afty, mas com
o recibo de integração construído pelo teste.

| Cláusula | Página | Consumidor, prova e ligação |
| --- | --- | --- |
| Absorção Elemental de Aura | 175 | `ficha-cx3-absorcao-prospectiva`. Reação antes do dano, carga persistente por uso ativo e pendência de CL1, mesmo dano com ou sem reação, um consumo por ataque, inclusive no erro. Isolado e janela testada em cópia com patch. Decisões D1 a D6 antes de expor |
| Expandir e Concentrar | 176, 179 | `auraParaDestinatario` lê o alcance da sessão emissora e a passiva suspensa, sem gravar alcance de combate no pacote. Isolado com duas manutenções devidas. Ativação, suspensão, manutenção e recarga em navegador já constam de `browser-expandir-aura.txt` e `browser-concentrar-aura.txt`. Aplicação posicional ainda depende do vínculo |
| Anuladora | 174 | `anulaCondicaoComAura` recebe a condição antes de `defineCondicoes`, custa 2/4/6/10 PE pela gravidade e usa quota de BT. Recusa manobra e efeito físico. Isolado. Falta o recibo do aplicador |
| Chamativa | 174, 299 | `preparaTrDaAura` e `aplicaTrDaAura`. Em início do turno de não aliado, Vontade, Enfeitiçado identificado pelo emissor, +2 por falha até a cena e remoção da instância no sucesso. Isolado, inclusive repetição fora da área. Falta consumidor da penalidade de Enfeitiçado contra aquele emissor |
| Macabra | 177 | Livre e 1 PE para a ampliação própria por uma rodada. Área para agressivos, Vontade, Abalado ou Amedrontado a partir de Aura 3, repetição no próximo turno. Isolado para alcance e ativação. Composição com Expandir depende de E1 |
| Lacerante | 177 | Livre por uma rodada, 3 m, Fortitude, dano Energético tipado na falha. Isolado com CL1 e prova da escada d10 no nível 5. Falta provedor de início de turno e escolha antes da aplicação |
| Movediça | 177 | Consulta da área no nível do emissor, suspensa por Concentrar e fora de Expandir. Isolado nos limites de 6 e 7 m. O percurso precisa da travessia ou célula adjacente, e o motor nativo trata terreno difícil e suas imunidades |
| Bastião | 174 | Defesa por Aura para aliado no alcance atual. Isolado em 4,5/9 m e com suspensão. Exportação estática fica com a base. O pacote vinculado precisa recalcular posição, origem e alcance em jogo |
| Comandante | 174, 175 | Ação Bônus, alcance de 4,5 m, bônus nos canais do Pacote. Manutenção por turno de 2 ou 4 PE, com suspensão enquanto devida. Isolado na Evoluída. Cadência da primeira cobrança e escopo do +2 continuam para a mesa |
| Casulo | 176 | Comum, 6 PE, uma rodada. A defesa de CL1 recebe imunidade a Cortante/Perfurante/Impacto mundanos ou RD de 2 × Aura no físico de técnica. Isolado. Falta natureza de cada parcela no provedor |
| Golpe com Aura | 176, 177 | `armaGolpeComAura` e `trDoGolpeComAura`. 1 PE, armamento de CL1 e CD + Aura no acerto armado/desarmado. Lacerante propõe dano Energético Após Ataque condicionado ao TR. Isolado. A bancada atual exibe a CD e inclui Lacerante na rolagem sem TR |
| Aura Elemental, Reforçada e Elemental Reforçada | 175, 177 | `aplicarAptidoesNoDano` e `efeitosDeAptidoesConfiguradas` calculam os grupos e RD tipados. `t-cx3-operacoes` e `t-cx3-concentrar-aura` cobrem a base. Falta a Livre de desabilitar Aura Elemental na mesa e a autoria fora das linhas de arma |
| Aura Controlada, Contenção, Inofensiva e Afinidade | 174 a 175 | Furtividade, Atletismo e bônus tipado passam pelo motor. A cobrança de Controlada exige o teste concreto. Contenção depende do vínculo Agarrar/Fuga. Inofensiva precisa relacionar o teste a cada inimigo detectando energia. Afinidade fora de ataque precisa do provedor de efeito tipado |
| Drenadora e Redirecionadora | 175, 177 | `t-cx3-aura-drenadora`, `t-cx3-redirecionadora` e respectivos percursos em `.audit/cx3-20261102`. Drenadora espera autoria de outras mortes. Redirecionadora espera identidade de outros projéteis, inclusive de invocação, conforme o gatilho |
| Canalizações e Estímulo | 178, 179, 191 | `armaCanalizacao`, `registraAtaqueRealizado`, `ficha-conteudo-salto` e `usaAptidaoPessoal`. Provas de acerto, erro, exclusão de Feitiço, reação e salto nos asserts existentes. `estimulaAcaoConfirmada` vincula gasto de movimento, Pular, teste físico ou manobra a um recibo e reutiliza a quota, com prova isolada do movimento e duplicidade. O consumo do bônus em Empurrar/Desarmar depende do provedor de deslocamento. A manutenção de Aura Embaçada usa CL1, mas seu consumidor de camuflagem deve respeitar a dívida de manutenção |
| Punho Divergente | 181 | `ficha-cx3-punho-divergente` separa metades de tipo único, exclui Raio Negro, guarda a parcela no destinatário, abre Fortitude no relógio recebido e aplica Vulnerabilidade na falha. Isolado. Relógio e divisão mista aguardam P1 a P5. Estilo das Sombras continua no consumidor próprio |
| Anular Técnica | 182 | `tentaAnularTecnica` usa acesso de Feitiço, quota de DOM, Reação e disputa de Feitiçaria. Vitória devolve o id da conjuração e todos os afetados verificados. Isolado. O cancelamento global é responsabilidade do provedor de Feitiço |
| Revestimento | 182, 246 | `ativaRevestimento`, `sustentaRevestimento`, `efeitoContraRevestimento`, `bloqueioDeFeiticoPorRevestimento`, `efeitosSuprimidosPorGolpeRevestido`. Isolado para ativação, nível, exceção, manutenção e proposta de supressão. Redução fixa testada em CL1 com patch em cópia. Falta identidade dos efeitos ativos e unidade da redução |
| Pétala Decadente | 181, 246 | `ativaPetala`, `protegeComPetala`, `contraAtacaComPetala`. Reação ou Bônus abre Concentração. Proteção paga DOM da instância física. Livre de 5 PE produz proposta de acerto garantido e trava a proteção até o início do próprio turno. Isolado. Falta ligar CL3, distância e aplicação do ataque |
| Resistência Completo | 313, 346 | `ficha-cx3-morte-em-etapas` grava o d20 antes da consequência e chama o cliente existente ou CL2 após a escolha. Isolado, inclusive recarga, duplicidade e d20 1 sob regra explícita. Resistência 2 continua na pilha de CL2 e em `t-cl2-alma-dados-vida` |

### Patches em texto para o integrador

**Absorção.** [Patch da janela](CX3-aptidoes-treinos/patch-janela-absorcao.diff)
recebe `contexto.absorcao` opcional. Ao construir a chamada a
`preparaReacaoAoDano` no ataque, o adaptador deve preencher a estrutura
abaixo somente após validar o turno e habilitar as decisões D1 a D6. Para
Dragão, trocar o id composto por `["dragao", ctx.ataqueId, teste.id]` e
ler a origem, turno e alvo de `ctx`. Identidade e tipos entram na mesma
chave da janela. O resultado tem `carga`, sem valor de redução.

```js
const absorcao = {
  recibo: {
    tipo: "dano", estado: "pendente", id: JSON.stringify(["ataque", r.id, dano.id]),
    origemId: mesa.origemId, afetados: [entrada.alvoId], turno: turnoDoAtaque, danos,
  },
  mesa: { origemId: mesa.origemId, alvoId: entrada.alvoId, turno: turnoAtual },
};
// Acrescentar absorcao ao contexto de preparaReacaoAoDano.
```

Na integração, compartilhar a função que arma CL1 entre o cliente
prospectivo e o cliente retrospectivo. O caminho de Encontro fica com
um único escritor por instância. O retrospectivo ainda serve aos testes
do percurso antigo. Se o provedor incluir a parcela em um Acerto
Garantido ou Feitiço futuro, só publicar a nova sessão quando a
aplicação do dano tiver sucesso.

**Auras.** No encontro, consultar `auraParaDestinatario(sessaoEmissor,
derivedEmissor, { id, distancia, aliado, agressivo, regraMacabra })`
depois de resolver o vínculo atual. Para Bastião/Comandante, reaproveitar
os descritores de `fontesDeAura` e os efeitos recebidos. Guardar apenas
o vínculo em sessão. Exportar a regra base com 4,5 m, sem alcance
expandido. Ao começar o turno do alvo, construir `inicioTurnoAura` e
chamar `preparaTrDaAura`. A rolagem do alvo usa `cd`, `resistencia`
e `bonus`. Guardar o TR identificado, permitir escolhas de d20 e
passar a rolagem final a `aplicaTrDaAura`. O teste é de quem recebe a
aura. Aplicar a condição com id da origem, nunca remover todas as
condições homônimas. Para Lacerante, passar o resultado de dano pela
janela prospectiva quando houver outro defensor elegível e publicar
somente no final. Em Movediça, comparar a área com cada trecho da
trajetória para aplicar o terreno difícil existente.

**Golpe e Estímulo.** No acerto, antes de consumir as pendências de
`registraAtaqueRealizado`, capturar `trDoGolpeComAura` e anexar o
gatilho ao acerto confirmado. A Lacerante só acrescenta a parcela Após
Ataque em falha do TR. O integrador deve separar o grupo de simulação
em `aplicarAptidoesNoDano` da opção prospectiva paga. Em Estímulo,
usar o adaptador somente na ação original, antes de publicá-la. Pular
já chama o uso e deve trocar a chamada existente se migrar. Em
movimento e manobras, consumir `resultado.valor` no deslocamento
resolvido, com o gasto de ação feito pela operação que o iniciou.
Para Aura Embaçada, acrescentar a verificação de dívida de manutenção
à condição de camuflagem em `confirmaAtaqueConteudo`, usando
`usoDe(sessaoAlvo).ativos.auraEmbacada?.manutencao?.devidas`. A
recusa de pagar deve chamar `encerraUso`. Para Aura Elemental,
o comando Livre deve passar por `usa` e escrever `auraElemental:
false` pelo descritor nativo de estado. A restauração da conversão
deve seguir o prazo que a mesa confirmar para essa desativação.
As provas já existentes de Canalização e Estímulo estão em
`t-cx3-excedentes-combate.mjs` e `t-cx3-pular.mjs`.

**Punho.** Na confirmação de ataque, montar o recibo de acerto com
`raioNegro`, categoria, `desarmado` e tipos do dano. A parcela
`imediato` entra no dano do ataque original. Registrar `guardado` na
mesma sessão de destino e publicar em conjunto. O Encontro informa
`{ donoId, turno }` com a política de P2. O teste e a consequência
consomem esse relógio. O log tem o limite geral de sessão, então o
integrador deve reter o recibo até o turno devido se houver risco de
ele sair do histórico. Proteger o caminho de Estilo das Sombras com
sua identidade própria.

**Anular, Revestimento e Pétala.** Feitiço precisa de id da conjuração,
nível, custo base e efetivo, afetados, ofensivo e marca de afetação de
energia. Vincular o teste de cada participante à conjuração e permitir
rerrolagens antes de passar os totais finais. A decisão de Anular vale
uma vez para a área. O [patch de redução fixa](CX3-aptidoes-treinos/patch-revestimento-reducao.diff)
estende a conta de CL1 após a RD. O provedor passa `reducaoFixa` apenas
à unidade de dano aprovada e interrompe a aplicação inteira quando
`anula` for verdadeiro. O mesmo provedor consulta o bloqueio antes da
cobrança e usa as identidades de efeito para suprimir. Revestimento
sustentado usa o próprio início do turno via CL1 e a idade da Expansão
via CL3. Pétala exige eventos de abertura, de instância física e de
posição. A saída ofensiva é um pedido de ataque garantido, que o
Encontro deve aplicar por CL1 junto com a cobrança. A perda de
Concentração usa o encerramento de CL1.

**Morte em duas etapas.** CX6 chama `preparaMorteEmEtapas` na entrada
de Teste de Morte e oferece as escolhas permitidas no registro
`testeMortePendente`. Depois chama `concluiMorteEmEtapas` com o id
do registro, que relê o d20 escolhido e o estado vital atual. A tela
deve tratar o teste pendente como seu tipo real para aplicar os
limites de Sorte e de outras rerrolagens, sem usar o rótulo como
permissão. Em `normalizaVital`, preservar opcionalmente
`ultimoTeste.ignoradas` se a interface for ler ali. O log já mantém
`falhaIgnorada` após recarga. Dados de Vida continuam em CL2.

**Escopo G00.** [Patch de escopo e asserts](CX3-aptidoes-treinos/patch-escopo-e-asserts.diff)
classifica os sete módulos em `modulosAdicionais` e acrescenta a
entrada do assert ao guia compartilhado. O validador continua
exigindo a classificação na integração.

### Linhas de Treinamento

| Etapas auditadas | Páginas | Consumidor e lacuna |
| --- | --- | --- |
| Agilidade, Barreiras, Compreensão, Controle de Energia e Domínios | 339 a 341 | Quatro etapas com custos e requisitos no catálogo, canais de movimento, paredes, energia e Domínio. Domínios Completo continua como concessão textual conforme decisão anterior |
| Energia Reversa | 342 | `ficha-conteudo-uso` aplica desconto específico, regeneração, Fluxo e exaustão. O vínculo externo de cura e o gatilho de perda de vida seguem na integração geral |
| Luta e Manejo de Arma | 343 a 344 | Crítico e vantagem de Luta, crítico e vaga de Manejo por alvo no consumidor atual. Os testes concedidos pelo Completo são benefícios de jogo |
| Perícia | 345 | Vantagem da etapa 2, sucesso da 4 e rerrolagem do Completo atuam no teste da perícia durante o jogo. A aquisição da etapa usa Focos e pré-requisitos |
| Potencial Físico e Resistência | 346 | Duas escolhas direcionadas na etapa 2 de Potencial, pilha de Dados de Vida na etapa 2 de Resistência, teste de morte em duas etapas preparado nesta entrega |
| Treino de Atributo | Catálogo local | Linha por atributo com teto e liberação no Player por Addon. Preservar sua política de acesso e origem separada |

A p.338 dispensa rolagens para aquisição do treinamento nativo. A
pendência da fila do Player cobre etapas com teste exigido pela mesa ou
por conteúdo específico. Os testes de Perícia e Luta que são benefícios
posteriores ficam em seus consumidores. Se o autor habilitar registro
de tentativas, propor por ficha a chave composta `[linhaId, instanciaId,
etapa]` com entradas `[interludioId, tentativaId, resultadoId,
sucesso]`. O botão confere requisitos, orçamento, etapa anterior e
idempotência. O resultado aprovado habilita a operação de marcar
etapa existente, que continua sendo a única a conceder benefícios.
Política de consumo de Foco em falha, CD, sucessos exigidos, acumulação,
retentativa e migração precisam de declaração da regra autorizada.
Fichas antigas preservam a etapa comprada. Não usar a CD do Treino
Especial como regra geral.

### Decisões do repasse

| Id | Comprovado no contrato | Aguardando autor ou provedor |
| --- | --- | --- |
| D1 | O CL1 atual expira uso e pendência no fim do combate e descanso | Prazo da carga entre cenas, já perguntado |
| D2 | Carga existente recusa sem gastar reação | Substituição, maior carga ou recusa definitiva |
| D3 | Declaração de arma/desarmado consome, Feitiço fica fora do grupo | Elegibilidade de Feitiço e de outros tipos de ataque |
| D4 | Consulta exige dano elemental líquido positivo antes da absorção | Dano zerado e interação com a casca de PV |
| D5 | Seleção de um tipo e uma carga por instância | Regra de recepção multielemental |
| D6 | O grupo atual deriva como critável | Dobrar ou manter uma vez no crítico |
| D7 | Aura 0 recusa sem criar grupo vazio | Confirmar comportamento em caso de ficha legada sem nível |
| E1 | Macabra chega a 4,5 m com sua Livre. Em conjunto, o cliente exige política | Prioridade da própria ampliação ou composição para 9 m |
| E2 | As passivas com alcance numerado usam o dobro. Comandante e Lacerante mantêm os seus alcances | Classificação de exceções, incluindo Macabra em seu uso ativo |
| E3 | Dívida de manutenção suspende a ampliação | Sem alteração adicional |
| E4 | A ativação atual permite nenhuma passiva de alcance | Confirmar se o uso deve exigir alguma passiva elegível |
| E5 | Com duas rodadas devidas, CL1 paga a atual e informa uma atrasada | Se Expandir deve encerrar, cobrar atrasos ou permitir retomar |
| T1 | Cliente preserva uma falha no d20 1 quando a política `ignoraUma` é fornecida | Se a regra deve ignorar toda a rolagem |
| T2 | CL2 não trata sucesso como falha. O cliente separado pode proteger uma falha depois de sucesso | Aprovar uso depois do sucesso |
| T3 | Proteção só é oferecida no teste, sem interceptar falhas por dano | Sem alteração adicional |
| T4 | Limite por cena usa a abertura ou o descanso de CL1 | Limite fora de combate, inclusive cenas consecutivas |
| P1 | Total ímpar de um tipo exige indicar qual metade recebe a unidade | Distribuição do resto |
| P2 | A etapa aceita apenas o relógio do atacante ou do alvo indicado pelo provedor | Qual turno e qual momento abrem o teste |
| P3 | O cliente cobre Ataque Básico corpo a corpo confirmado como desarmado | Pugilato, Armas Naturais e variantes |
| P4 | Conflito Resistência/Vulnerabilidade passa pelo desempate de CL1. Imunidade é preservada | Política final do conflito |
| P5 | CD reaproveita a troca pelo maior físico e o bônus da primeira metade | Confirmar a base da primeira metade quando o dano passar por defesas |
| A1 | Empate é um estado pendente, sem escolher vencedor | Decisão de empate |
| A2 | Teto usa `derived.feiticos.nivelMax` e o helper existente | Acesso hipotético e Feitiço de nível 0 |
| A3 | Custo igual entre as duas bases pode ser pago diretamente. Divergência exige política | Custo base ou efetivo |
| A5 | Cancelamento preserva todos os afetados verificados do recibo | Quem compõe o conjunto de afetados em área |
| R1 | Sustentação tem relógio do usuário e políticas explícitas de escalada | Primeiro aumento na segunda ou terceira rodada |
| R2 | Patch mantém redução fixa fora da RD ignorada | Unidade de aplicação, efeito ou tipo |
| R3 | Patch testado aplica a redução depois da RD | Confirmar ordem final |
| R5 | Recibo exige a marca explícita de afetação de energia | Classificação dos Feitiços e extensão da exceção |
| R6 | Bloqueio de conjuração e lista de supressões têm consumidores separados | Efeitos passivos e auxiliares de aliados |
| R7 | Os contratos aguardam a matriz de exclusão | Convivência de anti-domínios na p.246 |
| L1 | Só instância identificada, marcada como física, recebe defesa | Origem da classificação de contato e efeitos de Expansão além do Acerto Garantido |
| L2 | Defesa paga o DOM do recibo | Definição de DOM efetivo do expansor |
| L3 | Contra-ataque distingue entrar no alcance e começar o turno do usuário | Posição, alcance da linha e confirmação de entrada |

Outras lacunas para o integrador registrar na fila. Comandante precisa
da primeira cobrança e do escopo do +2 confirmado. Golpe com Aura
precisa da regra de consumo em erro e do momento de Enganação
Projetada quando já houve acerto. A aplicação de Casulo a tipos não
físicos de técnica fica para decisão. Confirmar se o segundo impacto
de Punho conta como outro dano para as Portas da Morte e quais efeitos
de Auras permanecem quando o emissor suspende a passiva ou sai da cena.

### Verificação da continuação

- `node asserts/t-cx3-aptidoes-prospectivas.mjs` passa 132 verificações
  em Player e Afty. Cobre preservação do dano, consumo da carga, área
  ligada à sessão, alteração de turno, condições, custos, recarga e a
  escolha de Sorte antes de concluir o Teste de Morte.
- Em cópia isolada com os patches de janela e redução fixa aplicados,
  `t-cx3-aptidoes-prospectivas.mjs --patches` passa 138 verificações.
  Passam também `t-cl1-combate` (328), `t-cx3-reacao-ataque` (82)
  e `t-ordem-modulos` (54). O patch de escopo passa `git apply --check`
  e o inventário em cópia reconhece os sete módulos.
- Regressões específicas passam em Absorção (95), Expandir Aura (54),
  Resistência (57) e números de Anti-Domínios (24). Lint Afty, ordem
  de módulos e build local aprovados.
- A suíte do workspace aprova 306 de 308 arquivos. Permanecem as duas
  falhas de entrada, `t-reconciliacao-g00` e `t-revisao-g00`. Elas
  também listam os sete módulos desta frente até aplicar a classificação
  no arquivo compartilhado.
- A prova de interface reaproveitada é a dos percursos anteriores em
  `.audit/cx3-20261102`. As ligações novas em tela dependem dos patches
  compartilhados e dos provedores discriminados acima.
