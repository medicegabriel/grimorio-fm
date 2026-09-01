/**
 * ============================================================
 * MOTOR DE AUTOMAÇÃO — lado da CRIATURA
 * ============================================================
 * Aplica na PRÓPRIA ficha os efeitos que vêm das Habilidades de Especialização,
 * Talentos, Melhorias Superiores, Lendárias, Ápices e Treinamentos.
 *
 * É o irmão do canal Controlador → Invocação (`CONTROLADOR_EFEITOS_INVOCACAO`
 * em afty-habilidades.js + `efeitosHabilidade` em afty-invocacoes.js), com as
 * mesmas três garantias: canal desconhecido é ignorado sem quebrar, erro de
 * expressão cai no fallback, e todo efeito aplicado entra em `detalhes` para a
 * UI mostrar de onde veio o número.
 *
 * DIRETRIZ DO AUTOR (2026-07-27): **usar o Motor SEMPRE**, mesmo quando o efeito
 * não couber ainda. O que não cabe vira EXTENSÃO do motor (canal novo, variável
 * nova, tipo de efeito novo), não um texto solto que a UI só exibe. A ideia é
 * que o motor fique robusto para o autor escrever habilidades próprias depois.
 *
 * ⚠ A TRAVA DO 2.5.2 CAIU EM 2026-08-20. Até aqui o avaliador vinha de
 * `src/components/fm-dsl.js`, que é do grimório 2.5.2 e somente-leitura, então
 * variável nova era livre e tipo de efeito novo era livre, mas FUNÇÃO ou
 * OPERADOR novo exigia parar e perguntar. Perguntei ao desenhar os Addons e o
 * autor liberou a CÓPIA do avaliador: ela é `./afty-dsl.js`, e a linguagem
 * cresce deste lado agora. A 2.5.2 segue intacta com a cópia dela.
 *
 * ------------------------------------------------------------
 * FORMA DE UM EFEITO
 * ------------------------------------------------------------
 *   { canal, expr, quando?, alvo?, duracao? }
 *
 *   • canal   — para onde o número vai (ver EFEITO_CANAIS).
 *   • expr    — expressão DSL, sempre resulta num número.
 *   • quando  — condição opcional em DSL. Sem ela o efeito sempre entra, com
 *               ela só entra se avaliar diferente de zero.
 *   • alvo    — só nos canais que pedem destino (atributo, perícia, TR, ataque,
 *               trilha). ALVO AUSENTE num canal com destino = vale para TODOS
 *               ("+2 em todas as perícias").
 *   • duracao — "permanente" (padrão) ou "temporaria". Só o PERMANENTE conta
 *               para pré-requisito (autor, 2026-07-27): "Se o Modificador de
 *               Força for temporário, não! Se for permanente, sim!". Os dois
 *               contam para os stats, porque a ficha mostra o estado atual.
 *
 * A coleta carimba `origem` (o id da habilidade) e `nome` (para a UI).
 *
 * ------------------------------------------------------------
 * ORDEM DE APLICAÇÃO: TRÊS ESTÁGIOS (autor, 2026-07-27)
 * ------------------------------------------------------------
 * O efeito de ATRIBUTO entra PRIMEIRO, e todo o resto lê o atributo já somado.
 * Palavras do autor:
 *
 *   "Tenho força 14. Recebo +6 de Força fico com Força 20.
 *    Depois eu recebo +5 de Defesa (Mod. Força)"
 *
 * Ou seja, os +5 saem da Força 20, não da 14. E o atributo se divide em dois,
 * porque só o permanente conta para pré-requisito:
 *
 *   "Se o Modificador de Força for temporário, não!
 *    Se for permanente, sim!"
 *
 * Daí os três estágios, com o contexto remontado entre eles:
 *
 *   1a. `atributo` com `duracao: "permanente"` (o padrão), lendo o BASE.
 *       → produz o atributo que os PRÉ-REQUISITOS enxergam.
 *   1b. `atributo` com `duracao: "temporaria"`, lendo o permanente.
 *       → produz o atributo FINAL, o que a ficha mostra.
 *   2.  Todos os outros canais, lendo o atributo final.
 *
 * Os resultados são somados com `mesclarEfeitos`.
 *
 * ⚠ DIVERGE do que `docs/automacao-dsl.md` diz ("as expressões leem os valores
 * base, sem os próprios buffs"). Aquele texto espelha o fm-dsl da 2.5.2 e vale
 * para o motor de invocação; o Afty do lado da criatura funciona assim porque o
 * autor confirmou que é assim que a regra funciona no sistema dele.
 *
 * ⚠ O que ainda lê o BASE: as expressões DENTRO do estágio 1a, então um efeito
 * de atributo permanente não vê o irmão do mesmo estágio (evita o laço A→B→A).
 *
 * ⚠ ASSUMIDO, a confirmar: efeito temporário fica SEMPRE ligado na ficha. Ligar
 * e desligar depende de um estado de combate que ainda não existe.
 * ============================================================
 */

import { evalNumber, CHAVE_MARCAS, normalizarMarca } from "./afty-dsl";
import { combateDslVars, COMBATE_VARS } from "./afty-combate";
// afty-origens.js só importa folhas de propósito, então a seta aponta para cá:
// é este arquivo que junta os efeitos de origem, não aquele. Ver coletarEfeitosOrigem.
import {
  getOrigem, getCla, resolveEscolhasOrigem, ORIGEM_ESCOLHA_EFEITOS, OPCAO_ORIGEM_NOME,
  opcoesEscolhidasDaOrigem,
} from "./afty-origens";
import { getAnatomia } from "./afty-anatomias";
// afty-aptidoes só importa afty-origens, que já é dependência daqui: sem ciclo.
import { getAptidao } from "./afty-aptidoes";
// Módulo folha (não importa nada), então a seta é segura.
import { funcionamentosDaFicha } from "./afty-schema";
import {
  HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS,
  MELHORIA_EFEITOS, MELHORIA_EFEITOS_ALVO, LENDARIA_EFEITOS, LENDARIA_EFEITOS_ALVO,
  APICE_EFEITOS, GERAL_EFEITOS,
  // Os três de origem entram no ESCOPO LOCAL (o `export ... from` mais abaixo
  // só reexporta, não declara), porque o coletarEfeitosOrigem daqui os usa.
  ORIGEM_EFEITOS, CLA_EFEITOS, ANATOMIA_EFEITOS,
  // Aptidão entra no escopo local pelo mesmo motivo: o coletor mora aqui.
  APTIDAO_EFEITOS,
} from "./afty-efeitos-conteudo";

/* ============================================================ */
/* CANAIS                                                        */
/* ============================================================ */
/* `alvo` diz que o canal precisa nomear um destino, e qual é o vocabulário
   dele. `furaTeto` marca o canal de atributo, que tem um teto duro de 30 no
   deriveAfty e algumas Lendárias dizem explicitamente que o passam. */

export const EFEITO_CANAIS = [
  // Stats de combate
  { id: "hp",            label: "PV",                    nota: "entra ANTES do multiplicador de Integridade da Alma (autor, 2026-07-27)" },
  { id: "pvTemporario",  label: "PV Temporário",         nota: "não é PV máximo: é a casca que some no fim do efeito. Quase sempre vem da simulação de combate" },
  // ⚠ IRMÃO do de cima, e ele faltava desde julho (o topo de afty-status.md o
  // nomeava como "o PE temporário exclusivo de Aptidão"). O ALVO aqui é o
  // GATILHO, e não um destino: `combate` entrega uma vez quando a cena começa,
  // `rodada` reenche no começo de toda rodada. Sem alvo vale como `combate`.
  //
  // ⚠ A MESMA FONTE NÃO ACUMULA, ela TOPA. Copiado do `applyRoundStartResources`
  // da 2.5.2 (src/components/fm-automation-entities.js), que resolveu isto antes:
  // sem a regra, "no começo de toda rodada você ganha metade do BT" viraria uma
  // pilha infinita na rodada 10. O que a rodada faz é devolver ao teto da fonte
  // o que foi gasto, e não somar de novo.
  { id: "peTemporario",  label: "PE Temporário",         alvo: "gatilho", nota: "casca de PE, gasta ANTES do PE normal. O alvo é o gatilho: combate entrega uma vez na cena, rodada reenche a cada rodada. A mesma fonte topa, não acumula" },
  { id: "pe",            label: "PE",                    nota: "pilha ÚNICA: Ponto de Energia e Ponto de Estamina (o nome do Restringido) são o mesmo recurso" },
  { id: "defesa",        label: "Defesa" },
  { id: "cd",            label: "CD" },
  { id: "rdGeral",       label: "RD Geral" },
  { id: "rdEspecifico",  label: "RD Específica" },
  { id: "rdFisico",      label: "RD Física" },
  { id: "rdAlma",        label: "RD a Alma",             nota: "a RD Geral vale para todo tipo EXCETO alma, então o Dano na Alma tem canal próprio. Entra antes do teste de Integridade (autor, 2026-07-29)" },
  { id: "movimento",     label: "Movimento",             nota: "em metros, aceita 1,5" },
  { id: "movimentoMult", label: "Multiplicador de Movimento", nota: "multiplica o movimento final. A Expansão de Domínio usa 2" },
  { id: "atencao",       label: "Atenção" },
  { id: "iniciativa",    label: "Iniciativa" },
  // ⚠ Conta DEGRAUS de categoria, e não metros: +1 leva Médio a Grande. A
  // criatura parte sempre de Médio, e este canal é o ÚNICO jeito de tirá-la de
  // lá (autor, 2026-08-08): tamanho não é escolha de ficha, é consequência de
  // uma Aptidão ou poder que diga que o corpo mudou. Apara nas pontas da lista.
  { id: "tamanho",       label: "Categoria de Tamanho",  nota: "em DEGRAUS a partir de Médio, e não em metros: +1 = Grande, +2 = Enorme, −1 = Pequeno. Apara em Minúsculo e Colossal. Cada degrau mexe em Atletismo e Furtividade" },
  // ⚠ Os três de Regeneração e os sete de Cura moram no grupo "Cura e
  // Regeneração", e não aqui. Ver GRUPOS_DE_CANAL.
  { id: "resParcial",    label: "Resistência Parcial" },
  { id: "almaMax",       label: "Integridade da Alma" },
  { id: "empolgacaoMaxima",  label: "Empolgação Máxima",  nota: "sinalizador: troca a tabela de dados de Empolgação inteira, não soma" },
  { id: "empolgacaoInicial", label: "Empolgação Inicial", nota: "quantos níveis acima do 1 o combate começa" },

  // Com destino
  { id: "atributo",      label: "Atributo",              alvo: "atributo", aceitaFuraTeto: true, nota: "o valor é aparado no LIMITE do atributo (20 padrão). Quem sobe o limite usa o canal limiteAtributo, e as duas coisas andam juntas nas regras que dizem \"o valor e o limite\"" },
  { id: "limiteAtributo", label: "Limite de Atributo",   alvo: "atributo", aceitaFuraTeto: true, nota: "sobe o teto daquele atributo por cima do 20 padrão, até o máximo de 30 (32 com furaTeto). Não soma valor: quem soma é o canal atributo" },
  // ⚠ SUBSTITUI, não soma. É o único canal com esta semântica, e ele existe
  // porque a alternativa era o truque da DIFERENÇA (`max(0, mod_forca -
  // mod_destreza)`), que chega no mesmo número mas MENTE no detalhamento: o
  // hover mostrava "Destreza +3" e "Músculos Desenvolvidos +2" lado a lado, e o
  // autor leu como soma dos dois (2026-08-08). Aqui a linha da Destreza some e
  // dá lugar à da Força.
  { id: "defesaAtributo", label: "Atributo da Defesa",   alvo: "atributo", nota: "TROCA a Destreza no cálculo da Defesa, e não soma nada. Com mais de um concedido vale o de maior modificador, porque a regra é sempre \"você pode optar\"" },
  // Irmão do de cima, para o PV (Addons fase 0, 8.2 do docs/afty-addons.md). O
  // caso que o pediu: *"uma habilidade que me permitiria mudar o Atributo do
  // Cálculo de vida de uma pessoa para um a minha escolha"*. A regra de
  // desempate é a MESMA da Defesa, e pelo mesmo motivo.
  { id: "hpAtributo",     label: "Atributo do PV",       alvo: "atributo", nota: "TROCA a Constituição no cálculo do PV, e não soma nada. Com mais de um concedido vale o de maior modificador, porque a regra é sempre \"você pode optar\"" },
  { id: "bonusPericia",  label: "Perícia",               alvo: "pericia", nota: "aceita `atr:destreza` para atingir toda perícia daquele atributo (Dádivas do Céu)" },
  /* Irmão do `defesaAtributo` do lado da Perícia: ele SUBSTITUI o bônus inteiro
     da linha por um número, em vez de somar nele. Nasceu com o Treino Cônjuge
     do Flugel, cuja 1ª etapa diz *"pode usar o bônus do seu cônjuge pra fazer um
     teste de perícia"*: o número vem de OUTRA ficha e é digitado, do mesmo jeito
     que a Iniciativa do irmão nos Gêmeos.

     ⚠ SUBSTITUIR NÃO É SOMAR, e por isso ele é canal próprio e não um delta.
     Um delta daria o número certo com o detalhamento errado, e o hover de
     fontes passaria a mentir sobre de onde a perícia veio.

     ⚠ Desempate igual ao do `defesaAtributo`: vale o MAIOR, porque a regra é
     sempre *"você PODE usar"*. Quem oferece uma troca opcional nunca piora. */
  { id: "periciaFixa",   label: "Perícia com Valor Fixo", alvo: "pericia", nota: "TROCA o bônus inteiro da perícia por este número, e não soma nada. Com mais de um vale o maior, porque a regra é sempre \"você pode usar\"" },
  { id: "proficienciaPericia", label: "Treino em Perícia", alvo: "pericia", aceitaSemCredito: true, nota: "1 = Treinado, 2 = Mestre. Concede a faixa, não soma número, e nunca REBAIXA o que a ficha já escolheu. CREDITA no orçamento: subir de uma faixa concedida custa só a diferença. Ver `semCredito`" },
  { id: "bonusTR",       label: "Teste de Resistência",  alvo: "tr", nota: "aceita `atr:constituicao` para atingir todo TR daquele atributo" },
  /* O irmão do `bonusTR` para o que a regra escreve como DADO ("adicionar 2d3 ao
     resultado"). Mesma razão do `dadosNomeados` no dano: a média dá um número
     certo e uma rolagem errada. O alvo é o DADO, então ele vale em todo Teste de
     Resistência — que é o que o único caso de hoje diz, "vale em qualquer TR". */
  { id: "dadosTR",       label: "Dados em Resistência",  alvo: "dadoNomeado", nota: "dado somado ao resultado do TR. O alvo é o dado e o valor é quantos. Vale em todo TR, porque o alvo já é o dado" },
  { id: "margemCriticoTR", label: "Crítico em Resistência", alvo: "tr", nota: "quanto a margem DIMINUI, com piso de 2. Irmão do margemCritico do ataque" },
  { id: "proficienciaTR", label: "Treino em Resistência", alvo: "tr", aceitaSemCredito: true, nota: "irmão de proficienciaPericia, mesmas regras (1 Treinado, 2 Mestre, nunca rebaixa, e credita no orçamento)" },
  { id: "bonusAcerto",   label: "Acerto",                alvo: "ataque" },
  // Irmão do `bonusAcerto` para quando o bônus é de UMA arma, e não da jogada
  // de ataque inteira ("+1 em jogadas de ataque com a arma escolhida", Treino
  // de Manejo de Arma). `bonusAcerto` mira a categoria (Corpo a Corpo, A
  // Distância), e usá-lo faria o bônus vazar para as outras armas da mesma
  // categoria. Este soma na LINHA DE DANO, que é onde cada arma fecha o Acerto
  // dela. Mesmo nome do pseudo-canal dos encantamentos em afty-equipamentos.js,
  // que resolve antes do Motor e chega como `acertoGrau`: a semântica é a
  // mesma, só o caminho é outro.
  { id: "acertoArma",    label: "Acerto (nesta Arma)",   alvo: "fonteDano", nota: "só quando manejando aquela fonte. Alvo `basico` ou o id da arma, e aceita os escopos (`arma`, `grupo:espada`, `prop:pesada`). Sem alvo vale para todas as linhas" },
  { id: "bonusManobra",  label: "Manobra",               alvo: "manobra", nota: "Agarrar, Derrubar, Desarmar e Empurrar. Sem alvo vale para as quatro" },
  { id: "resistirManobra", label: "Resistir a Manobra",  alvo: "manobra" },
  { id: "distanciaEmpurrao", label: "Empurrão",          nota: "em metros, por cima do 1,5 padrão" },
  { id: "danoBonus",     label: "Dano",                  alvo: "fonteDano", nota: "soma no Dano TOTAL da linha, e daí escorre para o dano fixo. Alvo `basico` ou o id da arma, e sem alvo vale para todas" },
  /* ⚠ O MESMO CANAL, DUAS RÉGUAS. Na criatura cada nível soma 1 no ND, e só no
     cálculo de dano (autor, 2026-07-27). Na ficha de jogador ele é um DEGRAU da
     escada de dados, 1d4 > 1d6 > 1d8 > 1d10 > 1d12 > 1d12 + 1d4 (autor,
     2026-08-31). Ver `danoPorArma` em afty-sistema.js e a escada em
     afty-niveis-dano.js. Os 22 emissores são os mesmos nos dois. */
  { id: "nivelDano",     label: "Nível de Dano",         alvo: "fonteDano", nota: "na criatura soma 1 no ND só para dano, e no jogador sobe um degrau da escada de dados" },
  { id: "dadosDano",     label: "Dados de Dano",         alvo: "fonteDano", nota: "dado ADICIONAL, somado depois do dano fixo. Não confundir com nivelDano" },
  /* ⚠ O IRMÃO DO `dadosDano` PARA DADO COM TAMANHO PRÓPRIO (2026-08-31). Autor:
     *"Execução Silenciosa está aparecendo como +6 ao invés de 1d6."*

     Os dois se dividem pelo que o TEXTO da regra diz:
       • "1 dado de dano adicional", "+1d"  → `dadosDano`. É um dado da LINHA, e
         o tamanho acompanha o dado dela.
       • "1d6 de dano", "2d10"              → `dadosNomeados`. O tamanho é do
         texto e não muda nunca, então ele não pode ser dado da linha.

     Até hoje o segundo caso virava a MÉDIA do dado no canal `danoBonus` (1d6 =
     3), o que dava um número certo na conta e uma rolagem errada na tela. O
     `alvo` é o próprio dado (`d4` a `d12`) e o valor é QUANTOS, então duas
     fontes de tamanhos diferentes somam cada uma no seu grupo em vez de
     colidirem.

     ⚠ Ele NÃO aceita escopo de fonte de dano, porque o `alvo` já é o dado. As
     regras que o usam dizem "ao realizar um ataque", sem recorte de arma. */
  { id: "dadosNomeados", label: "Dados de Dano (tamanho próprio)", alvo: "dadoNomeado", nota: "dado ADICIONAL com o tamanho escrito na regra (1d6, 2d10). O alvo é o dado e o valor é quantos. Para dado que acompanha o da linha, use Dados de Dano" },
  { id: "margemCritico", label: "Margem de Crítico",     alvo: "fonteDano", nota: "quanto a margem DIMINUI, com piso de 2" },
  { id: "ignoraRD",      label: "Ignora RD",             alvo: "fonteDano" },
  { id: "removeResistencia", label: "Remove Resistência", alvo: "fonteDano", nota: "sinalizador para golpes ou Feitiços que retiram a resistência do alvo" },
  { id: "propMarcial",   label: "Marcial",               alvo: "fonteDano", nota: "concede a propriedade Marcial à arma, que é o gatilho de vários poderes de Lutador" },
  { id: "finezaAtaque",  label: "Fineza",                alvo: "ataque", nota: "libera o atributo alternativo do ataque (Destreza no Corpo a Corpo). Vale o maior dos dois" },
  { id: "nivelAptidao",  label: "Nível de Aptidão",      alvo: "trilha", nota: "com alvo é concessão direcionada e grátis. Apara no teto da trilha (5 por padrão). Quem sobe o teto é o canal Limite de Aptidão" },
  { id: "limiteAptidao", label: "Limite de Aptidão",     alvo: "trilha", nota: "sobe o teto daquela trilha por cima do 5 padrão. Não concede nível: quem concede é o canal Nível de Aptidão, e as regras que quebram o teto emitem os dois juntos" },
  // ⚠ NÃO É `nivelAptidao`. Este canal dá VAGA DE IMBUIÇÃO no Domínio Simples e
  // mais nada; o Nível de Aptidão em Domínio alimenta uma dúzia de outras
  // fórmulas e subi-lo para ganhar imbuição mexeria em todas elas. A régua base
  // continua sendo o DOM, e o canal é o "esse valor pode ser aumentado por
  // outras fontes" que o texto do Domínio Simples escreve.
  { id: "imbuicoesEstilo", label: "Imbuições de Estilo",  nota: "quantas Técnicas de Estilo cabem no Domínio Simples ALÉM do Nível de Aptidão em Domínio" },

  /* ---------- BARREIRA E EXPANSÃO DE DOMÍNIO ----------
     Os seis nasceram em 2026-08-26, quando o autor mandou a Expansão de Domínio
     LER O MOTOR. Até ali `areaDominio`, `maxEfeitos` e `pvDaParede`
     (afty-dominios.js) eram funções puras de DOM, BAR, ND e BT, e o Treino de
     Domínios inteiro não tinha onde escrever: era a única Linha de Treinamento
     com zero efeitos ligados.

     ⚠ `pvParede` mexe no DOMO junto, e é de propósito: o domo vale
     `PAREDES_NO_DOMO × pvDaParede`, então melhorar a parede melhora o domo. */
  { id: "pvParede",      label: "PV da Parede",          nota: "PV de CADA parede de Técnica de Barreira. O domo da Expansão vale 12 paredes, então ele sobe junto" },
  { id: "rdParede",      label: "RD da Parede",          nota: "RD de cada parede de Técnica de Barreira. Não existia RD de parede antes de 2026-08-26" },
  { id: "maxParedes",    label: "Máximo de Paredes",     nota: "quantas paredes de Técnica de Barreira cabem de uma vez, por cima das 6 da aptidão" },
  { id: "areaDominio",   label: "Área da Expansão",      nota: "em metros, somado ao raio da Expansão de Domínio depois da conta de versão e Bônus de Treinamento" },
  { id: "efeitosDominio", label: "Efeitos da Expansão",  nota: "quantas vagas de efeito a Expansão comporta, por cima do que o Nível de Aptidão em Domínio dá" },
  { id: "conflitoDominio", label: "Conflito de Domínio", nota: "bônus na rolagem de confronto e contestação de expansões, que é 1d10 + Nível de Domínio + metade do ND + este canal" },

  /* ---------- DOMÍNIO SIMPLES ----------
     Os quatro nasceram em 2026-08-28, com as três etapas do Treino de Novo
     Estilo das Sombras que mexiam neles. Até ali o Domínio Simples era uma
     entrada de catálogo com `descricao` e mais nada, e por isso as etapas
     ficaram dois meses valendo só como texto no card.

     ⚠ Nomeados na convenção "Família: Parte", igual aos de Regeneração e Cura:
     o prefixo agrupa e o sufixo diz QUAL pedaço do custo o canal escreve. Sem
     isso, "Erguer" e "Sustentar" soltos não diriam de que coisa são.

     ⚠ Os três de custo REDUZEM: valor positivo abaixa a conta, igual ao
     `custoPE`, e o piso de 1 PE continua valendo. `custoSustentarDominio` nasce
     sem cliente de propósito, pelo mesmo motivo dos dois da Guarda: é a metade
     simétrica do que a 4ª etapa do Treino já reduz, e a falta de destino é
     justamente o que deixa uma regra nova sem onde escrever. */
  { id: "areaDominioSimples", label: "Domínio Simples: Área", nota: "em metros, somado ao raio do Domínio Simples depois do Nível de Aptidão em Domínio" },
  { id: "custoErguerDominio", label: "Domínio Simples: Erguer", nota: "redução do custo em PE para erguer o Domínio Simples, o piso de 1 PE continua valendo" },
  { id: "custoSustentarDominio", label: "Domínio Simples: Sustentar", nota: "redução do custo em PE por rodada do Domínio Simples. Só existe com um Addon que dê sustentação a ele" },
  { id: "custoSustentarEstilo", label: "Estilo das Sombras: Sustentar", nota: "redução do custo em PE por rodada das Técnicas de Estilo imbuídas, que é 1 PE a cada duas" },

  // Orçamentos
  { id: "vagasPericia",   label: "Vagas de Treino" },
  { id: "vagasHabilidade", label: "Vagas de Habilidade" },
  { id: "vagasFeitico",   label: "Vagas de Feitiço",     nota: "vaga EXCLUSIVA de Feitiço (= Habilidade de Técnica, Estilo das Sombras ou Habilidade Marcial). Não serve para Habilidade Geral (autor, 2026-07-28)" },
  { id: "vagasTalento",   label: "Vagas de Talento",     nota: "vaga EXCLUSIVA de Talento. Não serve para Habilidade de Especialização (autor, 2026-08-03)" },
  // ⚠ MAIS ESTREITO que o `vagasFeitico`, e é essa a razão de ele existir. O
  // autor decidiu em 2026-08-22, sobre a 1ª Etapa do Treino de Novo Estilo das
  // Sombras: um Feitiço não pode gastar esta vaga, só Técnica de Estilo pode.
  // Bate com o que ele já dissera em 2026-08-07 ("só aumentam o contador de
  // habilidades para Estilos").
  { id: "vagasEstilo",    label: "Vagas de Estilo",      nota: "vaga EXCLUSIVA de Técnica de Estilo. Não serve para Feitiço nem para Habilidade Geral" },
  // "Vagas de" no rótulo para o canal cair junto dos irmãos numa busca por
  // "vaga". O que ele dá é QUANTAS Aptidões Amaldiçoadas a criatura pode ter.
  { id: "vagasAptidao",   label: "Vagas de Aptidão",     nota: "quantas Aptidões Amaldiçoadas a criatura pode ter. Sem fonte nenhuma o orçamento é ZERO: o ND não concede" },
  // ⚠ O nome "Pontos de Aptidão" foi TROCADO em 2026-07-29: o autor perguntou o
  // que era, e a pergunta em si já era a resposta. "Ponto de Aptidão" não existe
  // no sistema (o que existe é NÍVEL de aptidão), e o rótulo velho parecia um
  // recurso gastável, tipo PE. O que este canal faz é dar ORÇAMENTO de nível,
  // gasto na trilha que o jogador quiser. É o par livre do `nivelAptidao`, que
  // nomeia a trilha e é concessão direta.
  { id: "pontosAptidao",  label: "Nível de Aptidão (à escolha)", nota: "orçamento LIVRE de níveis: cada ponto sobe 1 nível na trilha que o jogador quiser. O irmão direcionado é o canal Nível de Aptidão, que nomeia a trilha" },
  { id: "focos",          label: "Focos de Interlúdio" },
  { id: "pontosPreparo",  label: "Pontos de Preparo",    nota: "recurso do Combatente (Artes do Combate). Zero sem a habilidade, então o Preview só mostra quem tem" },
  { id: "espacosCarga",   label: "Espaços de Item",      nota: "sobe o LIMITE de carga, não o usado. Entra antes da conta de sobrecarga" },

  /* ---------- GUARDA INABALÁVEL (Calamidade e Beyond) ----------
     Os dois lados da mesma característica, e por isso são dois canais e não um:
     o bônus é o que o golpe desgasta (2 por golpe) e a Vida é o que o dano
     consome. Quem não é Calamidade nem Beyond não tem Guarda, e canal nenhum a
     cria: os dois SOMAM sobre uma base que é zero fora dos dois patamares.

     ⚠ Nascem sem cliente, de propósito. Foi a falta de destino que deixou o
     Treino de Domínios sem automação nenhuma até 2026-08-26 (a linha estava
     certa e não havia onde escrever), e a Guarda é exatamente o tipo de número
     que um Addon vai querer mexer. */
  { id: "guardaBonus",    label: "Guarda: Bônus",        nota: "o +5 (Calamidade) ou +10 (Beyond) de CA e TR no início da rodada. Continua caindo 2 por golpe sofrido" },
  { id: "guardaVida",     label: "Guarda: Vida Temporária", nota: "os 5 × ND (Calamidade) ou 10 × ND (Beyond) de PV Temporário que a Guarda entrega no início de cada rodada" },

  // Feitiços
  { id: "custoPE",        label: "Custo em PE",          nota: "redução de custo, o piso de 1 PE continua valendo" },

  /* ---------- REGENERAÇÃO: cura automática no INÍCIO DO TURNO ----------
     Os três escrevem uma parte diferente da MESMA rolagem (`3d8+5`), e é por
     isso que o nome de cada um diz qual parte é. Os rótulos velhos eram
     "Regeneração", "Dados de Regeneração" e "Dado da Regeneração": duas
     variações da mesma palavra e nenhuma dizendo o que escrevia. ⚠ Os IDS
     também mudaram (2026-08-03), e o CANAL_LEGADO abaixo traduz os antigos. */
  { id: "regeneracaoDados", label: "Regeneração: Dados",  nota: "QUANTOS dados de cura por turno. As faces são o canal Regeneração: Faces do Dado, e a parte fixa é Regeneração: Valor Fixo" },
  { id: "regeneracaoFaces", label: "Regeneração: Faces do Dado", nota: "as FACES do dado (6, 8, 10...). Vale o MAIOR entre as fontes, e não a soma: duas regenerações de dados diferentes viram uma só" },
  { id: "regeneracaoFixa",  label: "Regeneração: Valor Fixo", nota: "o que soma no TOTAL da cura por turno, uma vez, por fora dos dados" },

  /* ---------- CURA: a que a criatura realiza, por ação ----------
     Irmãos exatos dos três de Regeneração, com a mesma anatomia de rolagem.
     A diferença é que Regeneração acontece sozinha no início do turno e Cura
     é gasto de ação, então ela tem custo, usos e alvo. TODO efeito de cura
     nomeia a LINHA em que entra (`alvo`), senão o bônus de uma fonte vazaria
     para as outras: ver FONTES_CURA em afty-cura.js. Sem alvo vale para todas,
     que é o que "em toda cura que realizar" pede. */
  { id: "curaDados",       label: "Cura: Dados",          alvo: "fonteCura", nota: "QUANTOS dados naquela linha de cura. Nas fontes por ponto gasto (Energia Reversa, Regeneração Corporal) é o que UM ponto compra" },
  { id: "curaFaces",       label: "Cura: Faces do Dado",  alvo: "fonteCura", nota: "as FACES do dado de cura. Vale o MAIOR entre as fontes daquela linha, e não a soma" },
  { id: "curaFixa",        label: "Cura: Valor Fixo",     alvo: "fonteCura", nota: "soma no TOTAL da cura, uma vez, mesmo quando os dados escalam por ponto gasto. Sem alvo vale para toda cura que a criatura realizar" },
  { id: "curaPorDado",     label: "Cura: Bônus por Dado", alvo: "fonteCura", nota: "soma este valor uma vez POR DADO rolado. O teto do que ele acrescenta é o canal Cura: Teto do Bônus por Dado" },
  { id: "curaPorDadoTeto", label: "Cura: Teto do Bônus por Dado", alvo: "fonteCura", nota: "quanto o Bônus por Dado pode acrescentar no máximo. Sem ele o bônus não tem teto" },
  { id: "curaUsos",        label: "Cura: Usos por Descanso", alvo: "fonteCura", nota: "quantas vezes aquela cura pode ser usada por descanso. A linha sem usos é a que só depende de pagar o custo" },
  { id: "curaPontos",      label: "Cura: Pontos por Uso", alvo: "fonteCura", nota: "o TETO de pontos (PER ou PE) que podem ser gastos de uma vez. Os dados são multiplicados por ele" },
];

/**
 * Canais que mudaram de ID e ainda podem estar gravados numa ficha, no
 * Funcionamento Básico da técnica (`core.tecnicaEfeitos`), que é o único lugar
 * onde o JOGADOR escreve o canal à mão. A troca é na LEITURA, sem reescrever a
 * ficha: quem abrir e salvar de novo já grava o id novo. Mesmo desenho do
 * `CANAL_UNICA_LEGADO` da Habilidade Única, em afty-equipamentos.js.
 */
export const CANAL_LEGADO = {
  regeneracao: "regeneracaoFixa",
  dadosRegeneracao: "regeneracaoDados",
  regeneracaoDado: "regeneracaoFaces",
};

const CANAL_BY_ID = Object.fromEntries(EFEITO_CANAIS.map((c) => [c.id, c]));
export const getCanal = (id) => CANAL_BY_ID[id] ?? null;

/**
 * Alvo vazio é o valor canônico de "todos" no Motor.
 *
 * Fichas que passaram por versões anteriores do editor podem carregar a
 * palavra literal `todos`. Ela nunca foi id de atributo, ataque, perícia,
 * fonte de dano ou fonte de cura, mas sem esta compatibilidade era tratada
 * como um alvo real. O efeito então entrava em `porAlvo[canal].todos` e nenhum
 * consumidor o encontrava. Normalizar na fronteira do Motor recupera tanto o
 * Funcionamento Básico quanto a Habilidade Única e qualquer outra fonte livre.
 */
export function normalizarAlvoEfeito(alvo) {
  const valor = String(alvo ?? "").trim();
  return !valor || valor.toLowerCase() === "todos" ? null : valor;
}

/* ============================================================ */
/* GRUPO EXCLUSIVO — as fontes que NÃO acumulam entre si         */
/* ============================================================ */
/**
 * Cinco fontes de bônus numérico que o autor fechou num POOL ÚNICO
 * (2026-07-30), por balanceamento. Palavras dele:
 *
 *   "Essas 5 fontes de bônus numéricos e etc, não acumulam entre si, sempre
 *    ficando com o maior valor. Por exemplo, se o Efeito Único da minha arma me
 *    fornece +8 de Acerto, meu Feitiço Passivo me fornece +4 e um Shikigami está
 *    me fornecendo +5, eu só fico com o +8 de Acerto da arma. Caso eu perca a
 *    arma ou ela seja desativada de alguma forma, eu fico somente com o +5 do
 *    Shikigami."
 *
 * As três decisões que fecham o modelo (autor, 2026-07-30):
 *
 *  1. A disputa é POR STAT, não por fonte. Arma com +8 Acerto e +2 Defesa contra
 *     Shikigami com +5 Acerto e +6 Defesa rende +8 de Acerto E +6 de Defesa: as
 *     fontes se misturam, cada canal decide o seu vencedor sozinho.
 *  2. Vale DENTRO da família também. Dois Shikigami, ou dois Feitiços Auxiliares
 *     ativos, não somam entre si. Por isso o pool é PLANO: a família serve para a
 *     UI dizer de onde veio o número, e não para agrupar a disputa.
 *  3. Pega TODO bônus numérico que essas fontes produzem (Acerto, Defesa, CD, RD,
 *     Dano, Movimento, Atributo, PV e PE máximos), canal por canal.
 *
 * Tudo que NÃO é uma destas cinco (habilidade, talento, origem, treino,
 * encantamento, grau de item) segue somando normal, e soma POR CIMA do vencedor.
 *
 * ⚠ A disputa é por `(canal, alvo)`, e um efeito SEM alvo não briga com um
 * direcionado do mesmo canal. Hoje isso não vaza, porque as cinco fontes só
 * direcionam no canal `atributo` (onde todas nomeiam o atributo) e são globais em
 * todo o resto. Se um dia uma delas der "+N de Acerto só com espadas", esta conta
 * precisa passar a comparar o global contra cada alvo.
 *
 * `modo` diz onde a fonte fica ligada (autor, 2026-07-30): passiva entra na ficha
 * em repouso, ativa só na bancada de Simulação de Combate. A Habilidade Única é
 * "ambos" porque depende do item, então quem decide é o efeito, não a família.
 */
export const FAMILIAS_EXCLUSIVAS = [
  { id: "habilidadeUnica",         label: "Habilidade Única",            modo: "ambos" },
  { id: "feiticoAuxiliarPassivo",  label: "Feitiço Auxiliar Passivo",    modo: "passiva" },
  { id: "shikigamiCaracteristica", label: "Característica de Shikigami", modo: "passiva" },
  { id: "feiticoAuxiliarAtivo",    label: "Feitiço Auxiliar Ativo",      modo: "ativa" },
  { id: "shikigamiAcao",           label: "Ação Ativa de Shikigami",     modo: "ativa" },
  // ⚠ A SEXTA (autor, 2026-08-07). O Novo Estilo da Sombra é o Feitiço Auxiliar
  // do Sem Técnica: sem entrar no pool, ele seria a única origem cujo bônus
  // escrito à mão soma por cima de tudo. "ambos" porque o modo é declarado por
  // linha, como na Habilidade Única, e a Modificação de Domínio Simples é
  // sempre ativa (só vale com o Domínio no ar).
  { id: "estiloSombra",            label: "Estilo da Sombra",            modo: "ambos" },
  // ⚠ A SÉTIMA (autor, 2026-08-12): *"Funcionamento Básico não acumula com
  // Feitiços Ativos, Feitiços Passivos, Ações Shikigamis, Caracteristica
  // Shikigamis, Técnicas Marciais, Novo Estilo das Sombras e etc"*. Ela cobre o
  // Funcionamento Básico da técnica E os adicionais, e como o pool é PLANO isso
  // já resolve a outra metade da regra do mesmo dia, *"Efeitos de dois
  // funcionamentos básicos não funcionam"*: dois deles com o mesmo canal
  // disputam entre si e vale o maior.
  //
  // "ambos" porque a linha decide: o Funcionamento Básico é passivo por
  // natureza, mas o Motor dele aceita `duracao` e `quando`.
  //
  // ⚠ Técnica Marcial ainda NÃO é uma família: o subsistema nunca foi enviado.
  // Quando ele nascer, entra aqui, e o Funcionamento Básico já para de acumular
  // com ele sem precisar de mais nada.
  { id: "funcionamentoBasico",     label: "Funcionamento Básico",        modo: "ambos" },
];

const FAMILIA_EXCLUSIVA_BY_ID = Object.fromEntries(FAMILIAS_EXCLUSIVAS.map((f) => [f.id, f]));
export const getFamiliaExclusiva = (id) => FAMILIA_EXCLUSIVA_BY_ID[id] ?? null;

/**
 * A chave da disputa. Um canal sem alvo usa `*`, e não briga com os alvos dele.
 *
 * O SINAL entra na chave porque bônus e penalidade disputam separado (autor,
 * 2026-07-30): "Penalidade você pode sempre deixar a PIOR. Como por exemplo
 * entre -14 e -8. Ficaria o -14." Então o positivo fica com o MAIOR, o negativo
 * fica com o MENOR, e os dois vencedores somam. Um canal com +8 e -14 resulta
 * em -6: o melhor bônus e a pior penalidade valem ao mesmo tempo, e é só entre
 * iguais que a disputa acontece.
 */
export const chaveExclusiva = (canal, alvo, valor = 1) =>
  `${canal}|${alvo ?? "*"}|${valor < 0 ? "-" : "+"}`;

/**
 * Os canais agrupados por assunto, para o `<optgroup>` do editor de efeitos.
 * Espelha o `MODIFIER_TARGET_GROUPS` da 2.5.2, que resolve o mesmo problema:
 * uma lista chapada de 56 itens é impossível de varrer com o olho.
 *
 * ⚠ DERIVADO da lista, não uma segunda cópia dela. Aqui embaixo ficam só os
 * IDS por grupo, e o `EFEITO_CANAL_GRUPOS` resolve os objetos. Canal que não
 * apareça em grupo nenhum cai automaticamente em "Outros", então adicionar canal
 * novo nunca o faz desaparecer do editor por esquecimento (o teste de catálogo
 * confere que "Outros" está vazio).
 */
const GRUPOS_DE_CANAL = [
  ["Vitalidade e Recursos", [
    "hp", "pvTemporario", "pe", "peTemporario", "almaMax", "pontosPreparo", "custoPE",
  ]],
  // ⚠ Grupo PRÓPRIO desde 2026-08-03. Os três de Regeneração viviam soltos em
  // "Vitalidade e Recursos", entre PV e Pontos de Preparo, e lá o leitor não
  // tinha como perceber que os três são partes da MESMA rolagem. Juntos, e ao
  // lado dos sete irmãos de Cura, a anatomia (dados, faces, fixo) se lê sozinha.
  ["Cura e Regeneração", [
    "regeneracaoDados", "regeneracaoFaces", "regeneracaoFixa",
    "curaDados", "curaFaces", "curaFixa",
    "curaPorDado", "curaPorDadoTeto", "curaUsos", "curaPontos",
  ]],
  ["Defesa", [
    "defesa", "rdGeral", "rdEspecifico", "rdFisico", "rdAlma", "resParcial",
    "guardaBonus", "guardaVida",
  ]],
  ["Ataque e Dano", [
    "cd", "bonusAcerto", "acertoArma", "danoBonus", "nivelDano", "dadosDano", "dadosNomeados",
    "margemCritico", "ignoraRD", "removeResistencia", "propMarcial", "finezaAtaque",
  ]],
  // Atributo, limite e nível de trilha: o que a criatura É, em número próprio.
  // `nivelAptidao` entra aqui, e não num grupo de Aptidões, porque ele é
  // concessão DIRETA de nível (a regra nomeia a trilha). O orçamento livre é
  // outro canal e está em Orçamentos.
  ["Atributos e Aptidões", ["atributo", "limiteAtributo", "defesaAtributo", "hpAtributo", "nivelAptidao", "limiteAptidao", "imbuicoesEstilo"]],
  ["Perícias e Resistências", [
    "bonusPericia", "periciaFixa", "proficienciaPericia", "bonusTR", "dadosTR", "proficienciaTR", "margemCriticoTR",
  ]],
  ["Manobras", ["bonusManobra", "resistirManobra", "distanciaEmpurrao"]],
  ["Movimento e Percepção", ["movimento", "movimentoMult", "iniciativa", "atencao", "tamanho"]],
  // Tudo que é "quantos X você pode ter". ⚠ `espacosCarga` estava em Movimento
  // (2026-07-29) porque sobrecarga derruba o deslocamento. Era consequência, não
  // categoria, e o autor pegou: o canal sobe o LIMITE de espaços de item, então
  // ele é orçamento, irmão das vagas. `pontosAptidao` veio junto pelo mesmo
  // motivo, ele é orçamento de nível de aptidão.
  ["Orçamentos", [
    "vagasPericia", "vagasHabilidade", "vagasFeitico", "vagasEstilo", "vagasTalento", "vagasAptidao",
    "pontosAptidao", "focos", "espacosCarga",
  ]],
  ["Empolgação", ["empolgacaoMaxima", "empolgacaoInicial"]],
  // ⚠ Grupo próprio desde 2026-08-26. Os seis mexem em coisas que só existem
  // com uma Expansão ou uma Técnica de Barreira no ar, e espalhá-los por
  // Defesa e Orçamentos esconderia que eles são um assunto só.
  ["Barreira e Domínio", [
    "pvParede", "rdParede", "maxParedes", "areaDominio", "efeitosDominio", "conflitoDominio",
    "areaDominioSimples", "custoErguerDominio", "custoSustentarDominio", "custoSustentarEstilo",
  ]],
];

export const EFEITO_CANAL_GRUPOS = (() => {
  const usados = new Set();
  const grupos = GRUPOS_DE_CANAL.map(([label, ids]) => {
    const itens = [];
    for (const id of ids) {
      const c = CANAL_BY_ID[id];
      if (!c || usados.has(id)) continue;   // id inexistente ou repetido: ignora
      usados.add(id);
      itens.push(c);
    }
    return { label, itens };
  }).filter((g) => g.itens.length);
  const sobrando = EFEITO_CANAIS.filter((c) => !usados.has(c.id));
  if (sobrando.length) grupos.push({ label: "Outros", itens: sobrando });
  return grupos;
})();

/** Canais que ficaram fora dos grupos nomeados. Vazio = catálogo em ordem. */
export const canaisSemGrupo = () =>
  (EFEITO_CANAL_GRUPOS.find((g) => g.label === "Outros")?.itens ?? []).map((c) => c.id);

/* ============================================================ */
/* CONTEXTO DE VARIÁVEIS                                         */
/* ============================================================ */

/**
 * Namespace da criatura para o DSL. Recebe os valores BASE já calculados pelo
 * deriveAfty e devolve o objeto plano que `evalNumber` consome.
 *
 * ⚠ Além das variáveis de `docs/automacao-dsl.md` (que espelha só o fm-dsl da
 * 2.5.2), o Afty adiciona aqui: `patamar_*`, `tipo_*`, `grau`, `maestria`,
 * `mod_int_ou_sab` e o nível por especialização (real e de escalonamento). Toda
 * variável nova do sistema entra NESTE arquivo, nunca na 2.5.2.
 *
 * ⚠ O QUE NÃO ESTÁ AQUI: os stats derivados (`hp_max`, `defesa`, `cd`,
 * `atencao`, `rd_geral`, `deslocamento`) e os recursos de combate. Motivo: os
 * efeitos são aplicados ANTES de os stats serem calculados, senão um efeito de
 * atributo não conseguiria propagar para HP e Defesa. Ler stat aqui exigiria
 * uma SEGUNDA passada (calcular tudo, montar contexto, aplicar, recalcular), e
 * nenhuma habilidade do catálogo precisou disso ainda. Quando precisar, é essa
 * a extensão a fazer, e `VARS_ADIADAS` + `validarMapaEfeitos` avisam antes de
 * a expressão virar zero calado.
 */

/** Variáveis que o contexto da criatura ainda NÃO expõe (ver acima). */
export const VARS_ADIADAS = [
  "hp_max", "pe_max", "defesa", "cd", "atencao", "rd_geral", "rd_irredutivel",
  "deslocamento", "iniciativa", "acerto", "guarda_max", "guarda_atual",
  "hp_atual", "pe_atual", "hp_temp", "hp_pct", "pe_pct",
];

/** Variáveis de LINHA, disponíveis somente depois que o Feitiço fecha. */
export const VAR_DADOS_DANO_FINAL = "dados_dano_final";
export const VAR_NIVEL_FEITICO = "nivel_feitico";
const RE_VARIAVEL_LINHA_DANO = /\b(?:dados_dano_final|nivel_feitico)\b/i;

// O nome histórico permanece porque o editor dos Passivos já o importa. Hoje
// ele identifica qualquer variável tardia da linha de dano, não só os dados.
export const efeitoUsaDadosDanoFinal = (efeito) =>
  RE_VARIAVEL_LINHA_DANO.test(String(efeito?.expr ?? ""))
  || RE_VARIAVEL_LINHA_DANO.test(String(efeito?.quando ?? ""));

/**
 * MARCAS da ficha: quantas entradas a criatura tem de cada marca. É o que
 * `contar("adaptacao")` lê (ver `afty-dsl.js`).
 *
 * Nasceu em 2026-08-20, na fase 0 dos Addons (`docs/afty-addons.md`, 8.1). O
 * caso que a pediu: *"uma delas fornece 2 de RD Geral, e +1 de RD Geral a cada
 * outro poder do mesmo arquétipo que eu possuir na ficha"*. O DSL já tinha a
 * booleana `tem_*` por habilidade, e faltava a irmã dela, que CONTA em vez de
 * perguntar.
 *
 * Cada entrada rende:
 *   • as marcas ESCRITAS nela (`tags`), que é por onde o Addon marca as dele.
 *   • as marcas AUTOMÁTICAS, que hoje são a família (`habilidade`, `talento`,
 *     `aptidao`) e a especialização dona.
 *
 * ⚠ AS AUTOMÁTICAS SÃO DECISÃO MINHA, não do autor (2026-08-20). Sem elas a
 * função nasceria morta, porque nenhuma entrada do catálogo raw tem `tags` e só
 * o Addon (fase 1) traria a primeira. Com elas, `contar("lutador")` já responde
 * hoje. Marca escrita com o mesmo nome de uma automática apenas SOMA, e é
 * inofensivo, porque as duas querem dizer "conte estas coisas". Se o autor não
 * quiser, apagar o bloco das automáticas é uma linha.
 */
export function marcasDeEntradas(entradas = []) {
  const out = {};
  const add = (m) => {
    const k = normalizarMarca(m);
    if (k) out[k] = (out[k] ?? 0) + 1;
  };
  for (const e of entradas) {
    if (!e) continue;
    for (const t of Array.isArray(e.tags) ? e.tags : []) add(t);
    if (e.familia) add(e.familia);
    if (e.especializacaoId) add(e.especializacaoId);
  }
  return out;
}

export function buildCriaturaDslContext(base = {}) {
  const at = base.attrEff || {};
  const md = base.mods || {};
  const apt = base.aptidao || {};
  const nivelEspec = base.nivelEspec || {};          // { [espId]: { real, escalonamento } }

  const ctx = {
    /* As duas CONSTANTES da linguagem, e elas existem por um engano real do
       autor (2026-08-31): *"O Motor de Automação enquanto: 'sempre' não funciona,
       só funciona se estiver vazio."* Ele escreveu a palavra que a própria UI usa
       para descrever a condição vazia, e a expressão caiu no fallback 0, que é
       exatamente o valor que DESLIGA o efeito. Escrever a condição óbvia era a
       única forma de apagá-la.

       Elas não são valor de ficha nenhum, são vocabulário: `sempre` liga e
       `nunca` desliga, e as duas aparecem no seletor { } como qualquer variável,
       porque o vocabulário classifica o contexto real. */
    sempre: 1,
    nunca: 0,
    // Núcleo
    nd: base.nd ?? 1,
    bt: base.bt ?? 0,
    maestria: base.bt ?? 0,                          // alias, o texto do livro usa os dois nomes
    // Qual repetição está sendo avaliada, para as entradas repetíveis cujo
    // valor muda por pega ("aumenta em 20. Você pode pegar mais duas vezes,
    // aumentando em 15 ao invés de 20"). O `aplicarEfeitos` sobrescreve com o
    // `vez` do efeito; 1 é o default de quem não repete.
    vez: 1,
    grau: base.grauRank ?? 1,                        // Quarto 1 ... Semi-Grau Especial 5, e para aí
    alma_atual: base.almaAtual ?? 100,
    // RD base do escudo equipado, SEM a parcela da Ferramenta Amaldiçoada. É o
    // "aumento base em RD do seu escudo" do Especialista em Escudo. Único valor
    // de equipamento no contexto, e entra porque o equipamento é resolvido antes
    // dos efeitos (ao contrário dos stats, que vêm depois: ver VARS_ADIADAS).
    rd_escudo: base.rdEscudoBase ?? 0,
    // Uma fonte vem de qualquer Especialização treinada em escudo, e cada
    // Talento de escudo escolhido soma outra. O Mestre Defensivo lê a segunda.
    fontes_treino_escudo: base.fontesTreinoEscudo ?? 0,
    /* ⚠ Só os GÊMEOS. A morte do irmão é o segundo estágio da Restrição
       Celestial e inverte quase tudo dela, então ela precisa ser LEGÍVEL numa
       expressão: quase todo efeito da origem é escrito como
       `pre_morte * (1 - irmao_morto) + pos_morte * irmao_morto`. Vale 0 para
       todo mundo que não é Gêmeo. */
    irmao_morto: base.irmaoMorto ? 1 : 0,
    /* Só os Gêmeos. O bônus de Iniciativa do OUTRO gêmeo, digitado pelo jogador:
       a Dupla Empenhada soma os dois e o irmão é outra ficha. */
    iniciativa_irmao: Math.trunc(Number(base.iniciativaIrmao) || 0),

    /* Qual dos seis atributos é o da TÉCNICA desta criatura, como seis bandeiras
       0/1. `mod_tecnica` já entrega o modificador, mas ele não serve para uma
       regra que precisa MEXER no atributo escolhido: um canal `atributo` tem de
       nomear um `alvo` fixo, então a única forma de escrever "o atributo da
       Técnica" é emitir os seis efeitos e deixar cinco valerem zero.
       Ver a Restrição Celestial dos Gêmeos Feiticeiros. */
    ...Object.fromEntries(
      ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"]
        .map((k) => [`tecnica_${k}`, base.tecnicaAttr === k ? 1 : 0]),
    ),

    // Atributos (valor e modificador)
    forca: at.forca ?? 10, destreza: at.destreza ?? 10, constituicao: at.constituicao ?? 10,
    inteligencia: at.inteligencia ?? 10, sabedoria: at.sabedoria ?? 10, presenca: at.presenca ?? 10,
    mod_forca: md.forca ?? 0, mod_destreza: md.destreza ?? 0, mod_constituicao: md.constituicao ?? 0,
    mod_inteligencia: md.inteligencia ?? 0, mod_sabedoria: md.sabedoria ?? 0, mod_presenca: md.presenca ?? 0,
    mod_tecnica: base.modTecnica ?? 0,

    // "Modificador de Int OU Sab": o autor decidiu (2026-07-27) que é sempre o
    // MAIOR dos dois, não uma escolha gravada na ficha. Fecha o item C3.
    mod_int_ou_sab: Math.max(md.inteligencia ?? 0, md.sabedoria ?? 0),
    mod_pre_ou_sab: Math.max(md.presenca ?? 0, md.sabedoria ?? 0),

    // Níveis de aptidão por trilha (efetivo = alocado + concedido)
    dom: apt.dom ?? 0, au: apt.au ?? 0, cl: apt.cl ?? 0, bar: apt.bar ?? 0, er: apt.er ?? 0,

    // Simulação de combate: `em_combate`, `empolgacao`, `brutalidade`... É o que
    // as habilidades com `quando` leem para ligar e desligar. Ver afty-combate.js.
    ...combateDslVars(base.combate),

    /* Mapa de marcas, para o `contar()`. A chave começa com `#`, que o
       tokenizer nunca aceita num identificador, então nenhuma expressão
       consegue lê-la como variável e o `vocabularioDsl` a descarta pelo mesmo
       sinal. Ver `marcasDeEntradas` logo acima. */
    [CHAVE_MARCAS]: base.marcas || {},
  };

  /* ⚠ TODA variável de família tem de estar SEMPRE declarada, mesmo que zero.
     O `evalNumber` da 2.5.2 não trata identificador desconhecido: a expressão
     INTEIRA cai no fallback, calada. Então `2 + (esc_combatente >= 8)` numa
     criatura sem Combatente não daria 2, daria 0. `base.vocabulario` traz as
     listas completas dos catálogos (o deriveAfty é quem as tem) e elas entram
     antes dos valores de verdade, que sobrescrevem por cima. */
  const voc = base.vocabulario || {};
  for (const id of voc.pericias || []) ctx[`prof_${id}`] = 0;
  for (const id of voc.resistencias || []) ctx[`prof_tr_${id}`] = 0;
  for (const id of voc.habilidades || []) ctx[`tem_${id}`] = 0;
  for (const id of voc.especializacoes || []) {
    ctx[`nivel_${id}`] = 0;
    ctx[`esc_${id}`] = 0;
  }

  // Proficiência ESCOLHIDA NA FICHA por perícia: `prof_furtividade` = 0, 1
  // (Treinado) ou 2 (Mestre). Existe para o "Caso já seja" do Treino de
  // Perícia ("você se torna treinado nela. Caso já seja, adicione +1"). É a
  // escolha do jogador, e NÃO inclui o que o próprio efeito concede, senão a
  // condição enxergaria a si mesma e sempre daria o bônus.
  const profFicha = base.periciasProf || {};
  for (const [id, p] of Object.entries(profFicha)) {
    ctx[`prof_${id}`] = p === "mestre" ? 2 : p === "treinado" ? 1 : 0;
  }
  // O mesmo para Teste de Resistência, com prefixo próprio para não colidir com
  // uma perícia homônima. Existe para a Força Imparável (Restringido 8°), que
  // concede "treinado em um TR e mestre em outro NO QUAL JÁ SEJA TREINADO": a
  // opção olha o que a ficha marcou e decide entre conceder 1 ou 2.
  for (const [id, p] of Object.entries(base.resistenciasProf || {})) {
    ctx[`prof_tr_${id}`] = p === "mestre" ? 2 : p === "treinado" ? 1 : 0;
  }

  // Escolha de uma APTIDÃO, como booleana: `opt_<aptidao>_<valor>`. Hoje só a
  // Superioridade Física tem ("atletismo OU acrobacia"), e a alternativa seria
  // uma escolha aninhada inteira só para ela. Declarados a zero pelo
  // vocabulário, pelo mesmo motivo dos `tem_*`: expressão que cita variável
  // inexistente cai no fallback calada.
  for (const nome of voc.opcoesAptidao || []) ctx[nome] = 0;
  for (const [aptId, valor] of Object.entries(base.aptidaoOpcoes || {})) {
    if (valor) ctx[`opt_${aptId}_${valor}`] = 1;
  }

  // "Esta habilidade está escolhida?", como booleana: `tem_cmb_armas_perfeitas`.
  // Existe para o caso de DUAS habilidades dividirem a mesma escolha aninhada:
  // Armas Escolhidas (4°) e Armas Perfeitas (10°) miram o mesmo grupo de arma,
  // então os dois efeitos moram na opção e o da segunda se protege com isto.
  // ⚠ É a habilidade ESCOLHIDA, não a acessível: quem não pegou não recebe.
  for (const id of base.habilidadesEscolhidas || []) ctx[`tem_${id}`] = 1;

  // Patamar e Tipo como booleanos nomeados: `patamar_calamidade`, `tipo_conjurador`.
  for (const p of ["comum", "desafio", "calamidade", "beyond"]) ctx[`patamar_${p}`] = base.patamar === p ? 1 : 0;
  for (const t of ["combatente", "misto", "conjurador", "restringido"]) ctx[`tipo_${t}`] = base.tipo === t ? 1 : 0;

  // Nível por especialização. `nivel_lutador` é o REAL (o que trava
  // pré-requisito) e `esc_lutador` é o de ESCALONAMENTO (real + metade da
  // outra classe), que é o que os efeitos que escalam devem usar.
  for (const [espId, n] of Object.entries(nivelEspec)) {
    ctx[`nivel_${espId}`] = n?.real ?? 0;
    ctx[`esc_${espId}`] = n?.escalonamento ?? n?.real ?? 0;
  }

  return ctx;
}

/* ============================================================ */
/* CATÁLOGOS DE EFEITO (conteúdo)                                */
/* ============================================================ */
/* O conteúdo mora em ./afty-efeitos-conteudo.js e é REEXPORTADO daqui: o
   vocabulário de canal e o validador continuam com um dono só, e o arquivo do
   motor continua sendo motor. Quem consome importa daqui, como sempre. */

export {
  HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS,
  MELHORIA_EFEITOS, MELHORIA_EFEITOS_ALVO, LENDARIA_EFEITOS, LENDARIA_EFEITOS_ALVO,
  APICE_EFEITOS, GERAL_EFEITOS, APTIDAO_EFEITOS,
  ORIGEM_EFEITOS, CLA_EFEITOS, ANATOMIA_EFEITOS,
} from "./afty-efeitos-conteudo";

/**
 * Os campos "+ OUTROS" que a ficha tem para o Mestre somar à mão. Entram pelo
 * Motor como qualquer outra fonte, para o detalhamento da UI não ter buraco.
 */
export function efeitosManuaisDaFicha(creature) {
  const campos = [
    ["periciasBonus", "vagasPericia"],
    ["focosBonus", "focos"],
  ];
  const out = [];
  for (const [campo, canal] of campos) {
    const v = Math.trunc(Number(creature?.[campo]) || 0);
    if (v) out.push({ canal, expr: String(v), origem: campo, nome: "Outros" });
  }
  return out;
}

/**
 * Efeitos dos FUNCIONAMENTOS BÁSICOS, escritos pelo jogador na ficha: o da
 * própria técnica (`core.tecnicaEfeitos`) e os adicionais
 * (`core.funcionamentosAdicionais`), que o `funcionamentosDaFicha` entrega numa
 * lista só.
 *
 * É uma das fontes em que o efeito é ESCRITO e não escolhido de um catálogo. A
 * outra é o Passivo / Característica criado pelo jogador. O jogador tem o DSL
 * inteiro à disposição, os canais, alvo, `quando` e `duracao`.
 *
 * Sai daqui como qualquer outra fonte (`{ canal, expr, origem, nome }`), então os
 * filtros de estágio do deriveAfty roteiam pelo canal sozinhos: um efeito de
 * `atributo` cai no estágio 1, um de `nivelAptidao` no pré-contexto, o resto no 2.
 *
 * ⚠ TODA linha leva `exclusivo: "funcionamentoBasico"` desde 2026-08-12, sem
 * exceção e sem interruptor por linha. É a regra do autor, e ela é dupla: dois
 * Funcionamentos Básicos não somam entre si (o pool é plano, então eles disputam
 * dentro da própria família) e nenhum deles soma com Feitiço, Shikigami,
 * Técnica Marcial ou Estilo da Sombra. Habilidade, talento, origem e treino
 * seguem somando por cima do vencedor, como sempre.
 *
 * ⚠ O `origem` do principal continua sendo `"tecnica"`, e não o id novo: ele já
 * aparece assim no hover de fontes das fichas existentes, e renomear trocaria o
 * rótulo de todo mundo para ganhar simetria com uma lista que o jogador nem vê.
 *
 * Entrada inválida é DESCARTADA em silêncio de propósito: a validação e a
 * mensagem de erro são da UI, que mostra a expressão quebrada em vermelho na
 * hora de escrever. O motor não é o lugar de reclamar de digitação.
 */
export function efeitosDaTecnica(creature) {
  const out = [];
  for (const fb of funcionamentosDaFicha(creature)) {
    for (const e of fb.efeitos) {
      // Canal renomeado numa ficha antiga vira o novo aqui, na leitura.
      const canal = CANAL_LEGADO[e?.canal] ?? e?.canal;
      if (!canal || !CANAL_BY_ID[canal]) continue;
      const expr = String(e.expr ?? "").trim();
      if (!expr) continue;
      const ef = {
        canal,
        expr,
        origem: fb.principal ? "tecnica" : `funcionamento:${fb.id}`,
        nome: fb.principal ? "Técnica" : fb.nome,
        exclusivo: "funcionamentoBasico",
      };
      const alvo = normalizarAlvoEfeito(e.alvo);
      if (alvo) ef.alvo = alvo;
      if (e.quando) ef.quando = String(e.quando).trim();
      if (e.duracao === "temporaria") ef.duracao = "temporaria";
      /* ⚠ A marca TEM de atravessar: este objeto é RECONSTRUÍDO campo a campo,
         e o que não for copiado aqui some sem sintoma. Uma concessão de faixa
         que perdesse o `semCredito` no caminho voltaria a creditar, e o único
         sinal seria uma vaga de perícia a mais no contador. */
      if (e.semCredito) ef.semCredito = true;
      out.push(ef);
    }
  }
  return out;
}

/**
 * Efeitos dos Feitiços Passivos / Características escritos pelo jogador.
 *
 * Eles usam o mesmo formato livre do Funcionamento Básico, mas pertencem à
 * família exclusiva dos Feitiços Passivos. Assim, participam do pool que não
 * acumula com Habilidade Única, Shikigami e Feitiço Auxiliar, conforme a regra
 * já modelada pelo Motor.
 */
export function efeitosDosPassivos(creature) {
  const feiticos = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  const out = [];
  for (const feitico of feiticos) {
    if (feitico?.tipo !== "passivo") continue;
    const lista = Array.isArray(feitico.efeitosPassivo) ? feitico.efeitosPassivo : [];
    for (const e of lista) {
      const canal = CANAL_LEGADO[e?.canal] ?? e?.canal;
      if (!canal || !CANAL_BY_ID[canal]) continue;
      const expr = String(e.expr ?? "").trim();
      if (!expr) continue;
      const ef = {
        canal,
        expr,
        origem: `feitico:${feitico.id}`,
        nome: String(feitico.nome ?? "").trim() || "Passivo",
        exclusivo: "feiticoAuxiliarPassivo",
      };
      if (e.alvo) ef.alvo = e.alvo;
      if (e.quando) ef.quando = String(e.quando).trim();
      if (e.duracao === "temporaria") ef.duracao = "temporaria";
      out.push(ef);
    }
  }
  return out;
}

/**
 * Os BUFFS DE MESA, escritos na Ficha Final durante o jogo ("o mestre deu +2 de
 * Defesa por 3 rodadas"). Mesmo shape do Funcionamento Básico, e de propósito:
 * o seletor de canal, o validador de expressão e o painel de fontes já existem,
 * e um formato novo só daria trabalho.
 *
 * ⚠ `duracao: "temporaria"` é FORÇADA aqui, e não é escolha do jogador. Um buff
 * de mesa nunca conta para pré-requisito, que é exatamente a regra do autor
 * (2026-07-28): *"se o aumento de Força for temporário, não! Se for permanente,
 * sim!"*. Sem isso, um +4 de Força emprestado pelo aliado destravaria uma
 * Habilidade que pede Força 18.
 *
 * A lista chega em `creature.buffsSessao`, que a Ficha injeta na hora de
 * derivar. Ela NÃO existe no `createBlankAfty`: buff de mesa é runtime, e a
 * ficha guarda só escolhas.
 */
export function efeitosDaSessao(creature) {
  const lista = creature?.buffsSessao;
  if (!Array.isArray(lista)) return [];
  const out = [];
  for (const e of lista) {
    const canal = CANAL_LEGADO[e?.canal] ?? e?.canal;
    if (!canal || !CANAL_BY_ID[canal]) continue;
    const expr = String(e.expr ?? "").trim();
    if (!expr) continue;
    const ef = {
      canal, expr, duracao: "temporaria",
      origem: "sessao",
      nome: String(e.nome ?? "").trim() || "Buff",
    };
    if (e.alvo) ef.alvo = e.alvo;
    if (e.quando) ef.quando = String(e.quando).trim();
    out.push(ef);
  }
  return out;
}

/* ============================================================ */
/* COLETA                                                        */
/* ============================================================ */

/**
 * Junta os efeitos das entradas escolhidas, carimbando origem e nome.
 * `mapa` = { [id]: [efeito, ...] }. `catalogo` serve só para o NOME que a UI
 * mostra como fonte, e aceita as duas formas: o mapa `{ [id]: { nome } }` ou o
 * getter do catálogo (`getHabilidade`, `getTalento`...), que é o que os
 * catálogos grandes exportam. `vezesPorId` multiplica os repetíveis.
 */
export function coletarEfeitos(ids, mapa, catalogo = {}, vezesPorId = null) {
  const entradaDe = typeof catalogo === "function"
    ? (id) => catalogo(id)
    : (id) => catalogo?.[id];
  const nomeDe = (id) => entradaDe(id)?.nome;
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    /* ⚠ O efeito de uma entrada de ADDON vem DENTRO dela, e não do mapa.
       O raw separa catálogo de efeito (`HABILIDADE_EFEITOS` mora em
       afty-efeitos-conteudo.js) porque o texto do livro e a automação têm donos
       diferentes e mudam em ritmos diferentes. Num addon isso não existe: quem
       escreve a habilidade escreve o efeito dela, no mesmo JSON, e separar os
       dois só criaria uma segunda chave para a pessoa manter em sincronia.
       Por isso o mapa vem primeiro e a entrada é o fallback: nenhuma entrada do
       raw tem `efeitos` inline, então nada muda para elas. */
    const entrada = entradaDe(id);
    /* ⚠ E O REMENDO GANHA DOS DOIS (2026-08-22). Uma entrada REMENDADA por
       Addon que declara `efeitos` manda no mapa do raw, e não o contrário. Sem
       esta linha o remendo trocava o texto da regra e o número continuava o
       antigo, calado, porque a chave do mapa é o id e o id não muda: era
       exatamente o caso do Noção e Preparação, que sobe nos níveis 9, 14 e 19
       pelo Addon e continuaria subindo em 8, 12 e 16 no motor. */
    const efs = (entrada?.remendadoPor && entrada.efeitos)
      ? entrada.efeitos
      : (mapa?.[id] ?? entrada?.efeitos);
    if (!efs) continue;
    const vezes = vezesPorId ? Math.max(1, vezesPorId[id] ?? 1) : 1;
    for (let v = 1; v <= vezes; v++) {
      // ⚠ O `nome` do PRÓPRIO efeito vence o do catálogo. Ele é o rótulo que
      // aparece no hover de fontes, e uma origem com várias características
      // mandava a mesma palavra em todas as linhas: um Gêmeo Restringido via
      // "Gêmeos +1" e "Gêmeos −2" e não tinha como saber qual era qual
      // (autor, 2026-08-07). Quem não declara `nome` continua herdando o do
      // catálogo, que é o caso de quase todo efeito.
      for (const e of efs) out.push({ ...e, origem: id, nome: e.nome ?? (nomeDe(id) || id), vez: v });
    }
  }
  return out;
}

/**
 * Junta os efeitos de TUDO que a criatura escolheu, na ordem dos catálogos.
 * Recebe os resolves já prontos do deriveAfty (nada de ler a ficha crua aqui).
 *
 * Melhorias Superiores são repetíveis, então entram `vezes` vezes: uma Melhoria
 * de Vida pega duas vezes soma duas vezes.
 */
/**
 * Escolhas aninhadas cujas OPÇÕES são habilidades de verdade, e não opções
 * próprias. Roubo de Habilidade (Restringido 2°) tem por pool as 127 habilidades
 * de nível de Combatente e Lutador: o id da opção É o id da habilidade, então o
 * efeito dela sai do HABILIDADE_EFEITOS e não do ESCOLHA_EFEITOS.
 */
export const ESCOLHAS_DE_HABILIDADE = ["res_roubo_de_habilidade"];

export function coletarEfeitosCriatura({ habilidades, talentos, altoNivel, catalogos } = {}) {
  const vezesMel = Object.fromEntries(
    (altoNivel?.melhorias?.escolhidas || []).map((m) => [m.id, m.vezes]),
  );
  const apiceId = altoNivel?.apiceId ? [altoNivel.apiceId] : [];
  const roubadas = ESCOLHAS_DE_HABILIDADE.flatMap((id) => habilidades?.escolhas?.mapa?.[id] || []);
  return [
    /* `habilidades.vezes` multiplica a Habilidade de Especialização pega mais de
       uma vez (o Elevar Aptidão do Conjurador é a primeira). Sem isso a 2ª pega
       aparecia na conta de vagas e não rendia efeito nenhum, que é o mesmo
       buraco que o Talento repetível teve até agosto. */
    ...coletarEfeitos(habilidades?.escolhidas, HABILIDADE_EFEITOS, catalogos?.habilidades, habilidades?.vezes),
    ...coletarEfeitos(roubadas, HABILIDADE_EFEITOS, catalogos?.habilidades),
    ...coletarEfeitosDeEscolha(habilidades?.escolhas?.mapa, catalogos?.opcoes, catalogos?.habilidades),
    // `talentos.vezes` multiplica o Talento pego mais de uma vez (o Estudo
    // Amaldiçoado remendado por Addon é o primeiro). Sem isso a 2ª pega
    // aparecia na conta de vagas e não rendia efeito nenhum.
    ...coletarEfeitos(talentos?.escolhidas, TALENTO_EFEITOS, catalogos?.talentos, talentos?.vezes),
    // Talento também tem escolha aninhada (o atributo do Incremento, a trilha
    // da Aptidão Desenvolvida), e cai no mesmo ESCOLHA_EFEITOS.
    ...coletarEfeitosDeEscolha(talentos?.escolhas?.mapa, catalogos?.opcoes, catalogos?.talentos),
    ...coletarEfeitos(Object.keys(vezesMel), MELHORIA_EFEITOS, catalogos?.altoNivel, vezesMel),
    ...coletarEfeitosComAlvo(
      Object.keys(vezesMel), altoNivel?.escolhas?.mapa, MELHORIA_EFEITOS_ALVO,
      catalogos?.altoNivel, vezesMel,
    ),
    ...coletarEfeitos(altoNivel?.lendarias?.escolhidas, LENDARIA_EFEITOS, catalogos?.altoNivel),
    ...coletarEfeitosComAlvo(
      altoNivel?.lendarias?.escolhidas, altoNivel?.escolhas?.mapa, LENDARIA_EFEITOS_ALVO,
      catalogos?.altoNivel,
    ),
    ...coletarEfeitos(apiceId, APICE_EFEITOS, catalogos?.altoNivel),
  ];
}

/**
 * Efeitos cujo ALVO vem de uma escolha aninhada, e não do catálogo.
 *
 * É o caso da Melhoria de Perícia ("uma perícia a sua escolha") e da Melhoria
 * de Resistência ("escolha um Teste de Resistência"): o canal e a expressão são
 * fixos, e só o destino é escolhido. Por isso `mapaEfeitos` traz os efeitos SEM
 * alvo, e `mapaAlvos` (`{ [id]: [alvoId] }`) diz para onde cada um vai.
 *
 * Difere do `coletarEfeitosDeEscolha`, onde é a OPÇÃO que carrega o efeito.
 */
export function coletarEfeitosComAlvo(ids, mapaAlvos, mapaEfeitos, catalogo = {}, vezesPorId = null) {
  const nomeDe = typeof catalogo === "function"
    ? (id) => catalogo(id)?.nome
    : (id) => catalogo?.[id]?.nome;
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const efs = mapaEfeitos?.[id];
    if (!efs) continue;
    const vezes = vezesPorId ? Math.max(1, vezesPorId[id] ?? 1) : 1;
    for (const alvo of mapaAlvos?.[id] || []) {
      for (let v = 1; v <= vezes; v++) {
        for (const e of efs) out.push({ ...e, alvo, origem: id, nome: nomeDe(id) || id, vez: v });
      }
    }
  }
  return out;
}

/**
 * Efeitos das OPÇÕES escolhidas dentro de uma habilidade (Estilo de Combate,
 * Manobra de Empolgação, a trilha de Aptidões de Luta).
 *
 * `mapa` é o `habilidades.escolhas.mapa` do resolveHabilidades:
 * `{ [habId]: [opcaoId] }`. A chave do efeito é a OPÇÃO, então quem pegou a
 * habilidade e escolheu outra coisa não recebe nada.
 *
 * O `nome` sai do catálogo de opções, e é o que aparece no hover de fontes.
 */
export function coletarEfeitosDeEscolha(mapa, nomesPorOpcao = {}, catalogoPai = null) {
  const nomeDoPai = typeof catalogoPai === "function"
    ? (id) => catalogoPai(id)?.nome
    : (id) => catalogoPai?.[id]?.nome;
  const out = [];
  for (const [paiId, opcoes] of Object.entries(mapa || {})) {
    // ⚠ O nome da fonte é "Pai (Opção)", e não só a opção (2026-07-29). Uma
    // escolha de atributo se chama "Destreza", então o hover do atributo Destreza
    // mostrava a linha "Destreza +4", que não diz de onde vem nada. Com o pai
    // vira "Pináculo Físico (Destreza)". Sem catálogo de pai, volta ao antigo.
    const pai = catalogoPai ? nomeDoPai(paiId) : null;
    for (const opcaoId of Array.isArray(opcoes) ? opcoes : []) {
      const opcao = nomesPorOpcao[opcaoId] || opcaoId;
      for (const e of ESCOLHA_EFEITOS[opcaoId] || []) {
        out.push({ ...e, origem: opcaoId, nome: pai ? `${pai} (${opcao})` : opcao });
      }
    }
  }
  return out;
}

/**
 * Fontes que ficam A MONTANTE do contexto principal: elas concedem atributo,
 * nível de aptidão e vagas de orçamento, e essas coisas são lidas antes de os
 * stats existirem. Rodam no estágio 0 do deriveAfty.
 *
 * `gerais` é o resolve de Habilidades Gerais, e `catalogoGerais` só serve para
 * o nome que aparece no detalhamento.
 */
export function coletarEfeitosMontante(creature, gerais, catalogoGerais = {}) {
  const vezes = Object.fromEntries((gerais?.escolhidas || []).map((g) => [g.id, g.vezes]));
  return [
    ...coletarEfeitos(Object.keys(vezes), GERAL_EFEITOS, catalogoGerais, vezes),
    ...efeitosManuaisDaFicha(creature),
  ];
}

/**
 * Todos os efeitos que a ORIGEM produz: os dela, os do clã, os das Anatomias
 * escolhidas e os das escolhas aninhadas.
 *
 * ⚠ Mora AQUI, e não em afty-origens.js, por ordem de inicialização: aquele
 * arquivo só pode importar módulos folha (meio mundo lê `getOrigem` dele, e um
 * import pesado lá fecharia ciclo com o motor). A seta aponta para cá.
 *
 * ⚠ Entra no estágio 0 (MONTANTE) do deriveAfty, junto dos Treinamentos e das
 * Habilidades Gerais, porque origem concede VAGA (de habilidade, de perícia, de
 * feitiço, de aptidão) e vaga é lida antes de os stats existirem. O `efMontante`
 * é mesclado inteiro no agregado final, então os canais comuns (`hp`, `pe`,
 * `movimento`) também chegam.
 */
export function coletarEfeitosOrigem(creature, escolhas = null) {
  const origemId = creature?.core?.origem?.id;
  if (!origemId) return [];
  const claId = creature?.core?.origem?.cla;
  const anatomias = getOrigem(origemId)?.caracteristicas?.some((c) => c.poolAnatomia)
    ? (creature?.core?.origem?.anatomias || [])
    : [];
  const mapa = escolhas?.mapa || resolveEscolhasOrigem(creature, creature?.core?.nd ?? 1).mapa;
  const opcoesEscolhidas = Object.values(mapa).flat();
  const opcoesInteiras = opcoesEscolhidasDaOrigem(creature, { mapa });
  /* ⚠ O CATÁLOGO AQUI É A ENTRADA INTEIRA, e não `{ nome }`. Era um objeto
     sintético só com o nome até 2026-08-31, e isso furava o fallback do
     `coletarEfeitos`: uma origem ou um clã vindos de Addon declaram os efeitos
     DENTRO da entrada, e `entrada?.efeitos` era sempre `undefined` porque a
     entrada nunca chegava. O efeito sumia calado, que é o defeito que o
     projeto já nomeou. O `nomeDe` continua funcionando: ele lê `.nome`, e a
     entrada tem. */
  return [
    ...coletarEfeitos([origemId], ORIGEM_EFEITOS, (id) => getOrigem(id)),
    ...coletarEfeitos(claId ? [claId] : [], CLA_EFEITOS, (id) => getCla(id)),
    ...coletarEfeitos(anatomias, ANATOMIA_EFEITOS, (id) => getAnatomia(id)),
    ...coletarEfeitos(opcoesEscolhidas, ORIGEM_ESCOLHA_EFEITOS, (id) => ({ nome: OPCAO_ORIGEM_NOME[id] })),
    ...opcoesInteiras.flatMap((opcao) => (opcao.efeitos || []).map((efeito) => ({
      ...efeito,
      origem: opcao.id,
      nome: opcao.nome ?? opcao.id,
    }))),
  ];
}

/**
 * Os efeitos que uma entrada de catálogo manda para as INVOCAÇÕES do dono.
 *
 * ⚠ CAMPO PRÓPRIO (`efeitosInvocacao`), e não o `efeitos` de sempre, porque os
 * dois espaços de canal têm nomes iguais e sentidos diferentes: `pv` no
 * `efeitos` é o PV do dono, e `pv` aqui é o PV do shikigami. Misturar os dois
 * numa lista só faria uma Origem que quisesse engordar a invocação engordar o
 * personagem, calada.
 *
 * ⚠ NASCEU EM 2026-08-31 para a Estrela dos Zenin. Até então os canais de
 * invocação só aceitavam efeito de HABILIDADE (`efeitosInvocacaoControlador`),
 * e por isso um clã ou um talento não tinham como tocar num shikigami, nem no
 * raw nem por Addon.
 *
 * Recebe as ENTRADAS já resolvidas, e não ids, para não precisar importar mais
 * um catálogo aqui: quem chama (o `deriveAfty`) já tem todos eles à mão.
 */
export function efeitosInvocacaoDeEntradas(entradas) {
  const out = [];
  for (const entrada of Array.isArray(entradas) ? entradas : []) {
    const efs = entrada?.efeitosInvocacao;
    if (!Array.isArray(efs)) continue;
    for (const e of efs) {
      out.push({ ...e, origem: entrada.id, nome: e.nome ?? (entrada.nome || entrada.id) });
    }
  }
  return out;
}

/**
 * Efeitos das Aptidões Amaldiçoadas escolhidas.
 *
 * ⚠ `semEnergia` zera tudo. O Restringido não tem energia amaldiçoada, então
 * não tem Aptidão nenhuma: o orçamento dele já é zero, mas uma ficha que trocou
 * de origem depois de escolher aptidões ainda carrega a lista, e sem esta trava
 * ela continuaria valendo calada.
 */
export function coletarEfeitosAptidao(creature, semEnergia = false) {
  if (semEnergia) return [];
  const ids = Array.isArray(creature?.aptidoesAmaldicoadas) ? creature.aptidoesAmaldicoadas : [];
  // A lista pode repetir uma Aptidão para representar aquisições adicionais.
  // O efeito-base continua entrando uma só vez (Crescimento Corporal não
  // repete os PV); efeitos próprios de cada aquisição são resolvidos no derive.
  return coletarEfeitos([...new Set(ids)], APTIDAO_EFEITOS, (id) => getAptidao(id));
}

/* ============================================================ */
/* APLICAÇÃO                                                     */
/* ============================================================ */

/**
 * Avalia e soma os efeitos, canal a canal.
 *
 * Devolve:
 *   • porCanal — { [canal]: número }, os efeitos SEM alvo (nos canais com
 *     destino, valem para todos os alvos).
 *   • porAlvo  — { [canal]: { [alvo]: número } }, os direcionados.
 *   • detalhes — um item por efeito aplicado, para a UI mostrar a origem.
 *   • avisos   — canal inexistente, alvo em canal que não aceita, etc.
 *   • exclusivos — os do pool que NÃO acumula (ver FAMILIAS_EXCLUSIVAS). Saem
 *     avaliados mas AINDA NÃO somados: quem decide o vencedor de cada canal é o
 *     `resolverExclusivos`, que precisa ver a lista inteira de uma vez.
 */
export function aplicarEfeitos(efeitos, ctx = {}) {
  const porCanal = {};
  const porAlvo = {};
  const furaTetoPor = {};
  const detalhes = [];
  const avisos = [];
  const exclusivos = [];

  for (const e of Array.isArray(efeitos) ? efeitos : []) {
    const canal = CANAL_BY_ID[e?.canal];
    if (!canal) {
      if (e?.canal) avisos.push(`Canal inexistente "${e.canal}" em ${e.nome || e.origem || "efeito"}.`);
      continue;   // ignora sem quebrar
    }
    if (e.alvo && !canal.alvo) {
      avisos.push(`Canal "${e.canal}" não aceita alvo (veio "${e.alvo}").`);
    }
    // `vez` é do EFEITO, não do contexto: uma entrada repetível é coletada
    // várias vezes, e cada cópia precisa saber qual pega ela é.
    const temContextoExtra = e.contextoDsl && typeof e.contextoDsl === "object";
    const temVezPropria = e.vez != null && e.vez !== ctx.vez;
    const ctxE = temContextoExtra || temVezPropria
      ? { ...ctx, ...(temContextoExtra ? e.contextoDsl : {}), ...(temVezPropria ? { vez: e.vez } : {}) }
      : ctx;
    // Condição: sem `quando`, sempre aplica.
    if (e.quando && evalNumber(e.quando, ctxE, 0) === 0) continue;

    const valor = evalNumber(e.expr, ctxE, 0);
    if (!valor) continue;

    const alvo = canal.alvo ? normalizarAlvoEfeito(e.alvo) : null;

    // Pool exclusivo: sai da soma e vai para a disputa. O `detalhes` também
    // espera, porque só depois de conhecer o vencedor dá para dizer quem entrou
    // e quem foi suplantado.
    if (e.exclusivo) {
      if (!FAMILIA_EXCLUSIVA_BY_ID[e.exclusivo]) {
        avisos.push(`Família exclusiva desconhecida "${e.exclusivo}" em ${e.nome || e.origem || "efeito"}.`);
      }
      exclusivos.push({
        canal: e.canal, alvo, valor, exclusivo: e.exclusivo,
        origem: e.origem || null, nome: e.nome || e.origem || "Efeito",
        duracao: e.duracao || "permanente",
        semCredito: !!e.semCredito && !!canal.aceitaSemCredito,
      });
      continue;
    }

    if (alvo) {
      if (!porAlvo[e.canal]) porAlvo[e.canal] = {};
      porAlvo[e.canal][alvo] = (porAlvo[e.canal][alvo] || 0) + valor;
    } else {
      porCanal[e.canal] = (porCanal[e.canal] || 0) + valor;
    }
    // `furaTeto` é do EFEITO, não do canal: só as poucas que dizem em texto
    // ("podendo superar o máximo de 30", Aperfeiçoamento de Atributo) passam.
    const furaTeto = !!e.furaTeto && !!canal.aceitaFuraTeto;
    if (furaTeto) furaTetoPor[alvo || "todos"] = true;
    /* ⚠ `semCredito` é do EFEITO, e não do canal, exatamente como o `furaTeto`
       logo acima. Ele diz que aquela concessão NÃO abate o custo da faixa no
       orçamento, e só as pouquíssimas entradas de "Caso já seja" a usam: nelas
       a ficha PRECISA pagar a faixa para o benefício existir, então creditar
       tiraria com uma mão o que a regra cobra com a outra. O padrão é creditar.
       Ver `faixaCreditada` em afty-pericias.js. */
    const semCredito = !!e.semCredito && !!canal.aceitaSemCredito;
    detalhes.push({
      canal: e.canal, alvo, valor,
      origem: e.origem || null, nome: e.nome || e.origem || "Efeito",
      furaTeto, semCredito,
      // A duração viaja junto porque a aba Buffs LISTA os temporários: sem ela
      // o efeito com duração some dentro da soma e o jogador não tem como saber
      // que aquele +4 não é dele para sempre.
      duracao: e.duracao || "permanente",
    });
  }

  return { porCanal, porAlvo, furaTeto: furaTetoPor, detalhes, avisos, exclusivos };
}

/**
 * Fecha a disputa do pool exclusivo e devolve o resultado com os vencedores JÁ
 * somados em `porCanal` / `porAlvo`. Depois disto o resto do motor não precisa
 * saber que a regra existe: `valorCanal`, `valorCanalEscopos` e `detalhesDoCanal`
 * seguem funcionando iguais.
 *
 * `jaAplicado` é o mapa `{ [chaveExclusiva]: valor que já entrou }` de uma
 * chamada anterior, e existe por causa do canal `atributo`, que é o único que o
 * deriveAfty resolve em DOIS estágios (permanente e temporário). Sem ele, um
 * Feitiço Auxiliar temporário de +4 de Força somaria por cima de uma Habilidade
 * Única permanente de +6, e o total daria 10 em vez dos 6 que a regra manda. Com
 * ele, o segundo estágio só acrescenta o que passa do que já valia.
 *
 * Todo efeito do pool entra em `detalhes`, inclusive quem perdeu, marcado com
 * `suplantado: true`. É o que deixa o hover de fontes mostrar por que o +5 do
 * Shikigami sumiu da conta, em vez de ele simplesmente não aparecer.
 */
export function resolverExclusivos(res, jaAplicado = {}) {
  const porAlvo = {};
  for (const [c, alvos] of Object.entries(res?.porAlvo || {})) porAlvo[c] = { ...alvos };
  const out = {
    porCanal: { ...(res?.porCanal || {}) },
    porAlvo,
    furaTeto: { ...(res?.furaTeto || {}) },
    detalhes: [...(res?.detalhes || [])],
    avisos: [...(res?.avisos || [])],
    exclusivos: [],
  };
  const aplicado = { ...jaAplicado };
  const lista = res?.exclusivos ?? [];
  if (!lista.length) return { ...out, aplicado };

  // Um grupo por (canal, alvo, sinal): a disputa é por STAT, então cada canal
  // escolhe o seu vencedor sem olhar o que os outros canais fizeram, e o bônus
  // não briga com a penalidade.
  const grupos = new Map();
  for (const e of lista) {
    const k = chaveExclusiva(e.canal, e.alvo, e.valor);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(e);
  }

  for (const [k, itens] of grupos) {
    // Bônus fica com o MAIOR, penalidade fica com a PIOR (a mais negativa).
    const negativo = k.endsWith("|-");
    const melhor = (a, b) => ((negativo ? b.valor < a.valor : b.valor > a.valor) ? b : a);
    const vencedor = itens.reduce(melhor);
    const delta = vencedor.valor - (aplicado[k] || 0);
    // O `delta` também respeita o sinal: numa penalidade só entra o que PIORA o
    // que um estágio anterior já tinha aplicado. Sem isto, um -8 depois de um
    // -14 somaria +6 e apagaria parte da penalidade.
    const entra = negativo ? delta < 0 : delta > 0;
    if (entra) {
      if (vencedor.alvo) {
        if (!out.porAlvo[vencedor.canal]) out.porAlvo[vencedor.canal] = {};
        out.porAlvo[vencedor.canal][vencedor.alvo] = (out.porAlvo[vencedor.canal][vencedor.alvo] || 0) + delta;
      } else {
        out.porCanal[vencedor.canal] = (out.porCanal[vencedor.canal] || 0) + delta;
      }
      aplicado[k] = vencedor.valor;
    }
    for (const e of itens) {
      out.detalhes.push({
        canal: e.canal, alvo: e.alvo, valor: e.valor,
        origem: e.origem, nome: e.nome, furaTeto: false,
        exclusivo: e.exclusivo, duracao: e.duracao || "permanente",
        // ⚠ Terceiro lugar que reconstrói o detalhe campo a campo, e o terceiro
        // que precisaria copiar a marca. Ver a nota no push do `aplicarEfeitos`.
        semCredito: !!e.semCredito,
        // Perdeu para um irmão, ou empatou com o que um estágio anterior já
        // tinha aplicado. Nos dois casos o número não entrou nesta conta.
        suplantado: e !== vencedor || !entra,
      });
    }
  }
  return { ...out, aplicado };
}

/**
 * Resolve a parcela do Motor que depende da quantidade final de dados de UMA
 * linha. Esses efeitos ficam deliberadamente fora do estágio geral, evitando
 * que `dados_dano_final + 2` aplique apenas o 2 antes de a linha existir e volte
 * a aplicar a expressão inteira depois.
 *
 * No canal `dadosDano`, a variável lê o valor fechado ANTES dos efeitos que
 * também dependem dela. A passagem tardia acontece uma vez só: uma linha de 3
 * dados com `dados_dano_final` recebe +3 e termina em 6, sem reavaliar sobre os
 * 6 e criar recursão.
 */
export function resolverEfeitosDanoFinal(
  efeitos, ctx = {}, dados = 0, jaAplicado = {}, { nivelFeitico = 0 } = {},
) {
  const dependentes = (Array.isArray(efeitos) ? efeitos : []).filter(efeitoUsaDadosDanoFinal);
  const canaisSuportados = new Set(["danoBonus", "dadosDano"]);
  const suportados = dependentes.filter((e) => canaisSuportados.has(e?.canal));
  const res = resolverExclusivos(
    aplicarEfeitos(suportados, {
      ...ctx,
      [VAR_DADOS_DANO_FINAL]: Math.max(0, Math.trunc(Number(dados) || 0)),
      [VAR_NIVEL_FEITICO]: Math.max(0, Math.trunc(Number(nivelFeitico) || 0)),
    }),
    jaAplicado,
  );
  const ignorados = dependentes.filter((e) => !canaisSuportados.has(e?.canal));
  if (ignorados.length) {
    res.avisos.push(...ignorados.map((e) =>
      `Variável de linha de dano só pode ser usada nos canais danoBonus e dadosDano em ${e.nome || e.origem || "efeito"}.`));
  }
  return res;
}

/** O alvo recebeu algum efeito autorizado a passar do teto duro de 30? */
export const furaTetoEm = (res, alvo) =>
  !!(res?.furaTeto?.[alvo] || res?.furaTeto?.todos);

/**
 * Canais resolvidos ANTES de todos os outros. Hoje só o de atributo: o autor
 * confirmou (2026-07-27) que um efeito que soma atributo entra antes, e os
 * efeitos seguintes já leem o modificador novo.
 */
export const CANAIS_ESTAGIO_1 = ["atributo"];

/**
 * Canais que ALIMENTAM o contexto principal, e por isso saem antes dele.
 *
 * `nivelAptidao` é variável do DSL (`dom`, `au`, `cl`, `bar`, `er`): se ele
 * fosse resolvido junto do resto, uma habilidade que concede nível de trilha
 * (Aptidões de Luta, Aptidões de Combate) chegaria tarde demais, depois de o
 * contexto já estar montado. Vale aqui a mesma regra do estágio de atributo:
 * DENTRO deste estágio um efeito não enxerga o irmão, o que evita o laço.
 *
 * `empolgacaoMaxima` entrou pelo mesmo motivo: ele troca a TABELA de dados de
 * Empolgação, e a média do dado (`dado_empolgacao`) é o que as Manobras de
 * Empolgação somam. Sem sair antes, a média seria calculada com a tabela velha.
 *
 * `limiteAtributo` entrou em 2026-07-29 pelo motivo mais direto de todos: ele É
 * o teto contra o qual o estágio 1 apara o canal `atributo`. Se ele saísse junto
 * do resto, a aparagem aconteceria contra o limite velho e a regra que diz "o
 * valor E o limite aumentam" (Incremento de Atributo, Quebra de Limites) perderia
 * metade do efeito.
 *
 * `limiteAptidao` entrou junto do `nivelAptidao` e pela mesma razão que o
 * `limiteAtributo`: ele é o teto contra o qual a concessão de trilha apara.
 *
 * ⚠ Rodam com o contexto reduzido (sem os níveis de aptidão), então a
 * expressão de um efeito destes tem de ser constante ou depender só de ND,
 * Maestria e atributo base. Na prática são todas "1".
 */
export const CANAIS_PRE_CONTEXTO = ["nivelAptidao", "limiteAptidao", "empolgacaoMaxima", "limiteAtributo"];

/**
 * O canal das vagas de imbuição do Estilo, que roda num PASSE PRÓPRIO, entre o
 * pré-contexto e o estágio principal.
 *
 * ⚠ ELE NÃO CABE EM NENHUM DOS DOIS, e foi por isso que ganhou um passe. No
 * pré-contexto a variável `dom` ainda não existe, e a fonte mais provável deste
 * canal é justamente uma expressão que a use (o Completo do Treino de Novo
 * Estilo das Sombras é `dom`, para dobrar a régua). No estágio principal o
 * `resolveEstilos` já rodou, e a vaga extra chegaria tarde. Ver `deriveAfty`.
 */
/**
 * ⚠ Os SEIS da Barreira e do Domínio entraram no mesmo passe em 2026-08-26,
 * quando a Expansão passou a ler o Motor. Eles têm exatamente o mesmo encaixe do
 * `imbuicoesEstilo`: precisam das variáveis `dom` e `bar`, que o pré-contexto
 * ainda não tem, e precisam estar prontos antes do `resumoDominios`, que o
 * estágio principal não alcança.
 *
 * A fonte mais provável dos seis é uma Linha de Treinamento, e é por isso que o
 * passe lê AS DUAS LISTAS de efeito: o montante e o `efeitosTodos`. Filtrar só o
 * segundo deixaria o Treino de Barreiras e o de Domínios mudos, calados, que foi
 * o bug que este passe já pegou uma vez com o Estilo das Sombras.
 */
export const CANAIS_POS_APTIDAO = [
  "imbuicoesEstilo",
  "pvParede", "rdParede", "maxParedes", "areaDominio", "efeitosDominio", "conflitoDominio",
  /* Os quatro do Domínio Simples entram aqui pelo MESMO encaixe do
     `imbuicoesEstilo`: a área sai do Nível de Aptidão em Domínio, e o custo sai
     das imbuições, que o `resolveEstilos` só sabe depois do `dom` existir. */
  "areaDominioSimples", "custoErguerDominio", "custoSustentarDominio", "custoSustentarEstilo",
];
export const ehPreContexto = (e) =>
  CANAIS_PRE_CONTEXTO.includes(e?.canal) && !efeitoUsaDadosDanoFinal(e);
export const ehPosAptidao = (e) =>
  CANAIS_POS_APTIDAO.includes(e?.canal) && !efeitoUsaDadosDanoFinal(e);

/**
 * A ÚNICA entrada do sistema autorizada a passar do teto de 30 de atributo
 * (autor, 2026-07-27): "Não é para furar além de 30 de nenhuma forma. Com
 * exceção da Habilidade Lendária que te permite, nada no sistema além dela
 * permite passar." O validador recusa `furaTeto` em qualquer outro id.
 *
 * ⚠ Passar do 30 não é passar do infinito (autor, 2026-07-29): o Aperfeiçoamento
 * leva ao ATRIBUTO 32, e nada leva além. Quem apara é o `ATTR_LIMITE_ABSOLUTO`
 * de afty-atributos.js.
 */
export const FURA_TETO_PERMITIDO = ["len_aperfeicoamento_de_atributo"];

/** Duração de um efeito. Sem `duracao` declarada, é permanente. */
export const ehTemporario = (e) => e?.duracao === "temporaria";
export const ehPermanente = (e) => !ehTemporario(e);

/** Os estágios, na ordem em que o deriveAfty aplica. */
export const ehAtributoPermanente = (e) =>
  CANAIS_ESTAGIO_1.includes(e?.canal) && ehPermanente(e) && !efeitoUsaDadosDanoFinal(e);
export const ehAtributoTemporario = (e) =>
  CANAIS_ESTAGIO_1.includes(e?.canal) && ehTemporario(e) && !efeitoUsaDadosDanoFinal(e);
export const ehEstagio2 = (e) =>
  !CANAIS_ESTAGIO_1.includes(e?.canal)
  && !ehPreContexto(e)
  // Fora do estágio 2 para o canal ter UMA verdade só: quem o lê é o passe
  // próprio, e deixá-lo cair aqui também daria dois números para a mesma coisa.
  && !ehPosAptidao(e)
  && !efeitoUsaDadosDanoFinal(e);

/**
 * Soma resultados de `aplicarEfeitos` (os dois estágios) num só.
 *
 * ⚠ Os `exclusivos` são CONCATENADOS, nunca somados: a disputa do maior valor só
 * pode ser fechada quando a lista inteira estiver junta, e quem fecha é o
 * `resolverExclusivos`. Mesclar um resultado já resolvido é seguro, porque ele
 * volta de lá com a lista vazia e os vencedores já em `porCanal` / `porAlvo`.
 */
export function mesclarEfeitos(...resultados) {
  const out = { porCanal: {}, porAlvo: {}, furaTeto: {}, detalhes: [], avisos: [], exclusivos: [], aplicado: {} };
  for (const r of resultados) {
    out.exclusivos.push(...(r?.exclusivos || []));
    // ⚠ `aplicado` PRECISA sobreviver à mescla (2026-08-09). Ele é o placar do
    // pool exclusivo (quanto de cada canal um estágio anterior já entregou), e
    // quem o produz é o `resolverExclusivos`. O `out` era montado sem o campo,
    // então mesclar um resultado JÁ resolvido com outro apagava o placar.
    //
    // Isso mordia de verdade: `deriveAfty` mescla a régua de TAMANHO depois do
    // `resolverExclusivos`, então toda criatura que saísse de Médio perdia o
    // `aplicado`, e o `resolverEfeitosDanoFinal` dos Feitiços voltava a somar o
    // efeito exclusivo INTEIRO em vez do delta. Dano maior por ser Grande.
    Object.assign(out.aplicado, r?.aplicado || {});
    for (const [c, v] of Object.entries(r?.porCanal || {})) {
      out.porCanal[c] = (out.porCanal[c] || 0) + v;
    }
    for (const [c, alvos] of Object.entries(r?.porAlvo || {})) {
      out.porAlvo[c] = { ...(out.porAlvo[c] || {}) };
      for (const [a, v] of Object.entries(alvos)) out.porAlvo[c][a] = (out.porAlvo[c][a] || 0) + v;
    }
    Object.assign(out.furaTeto, r?.furaTeto || {});
    out.detalhes.push(...(r?.detalhes || []));
    out.avisos.push(...(r?.avisos || []));
  }
  return out;
}

/**
 * Valor de um canal para um alvo: o que vale para TODOS mais o direcionado.
 * Em canal sem destino, `alvo` é ignorado.
 */
export function valorCanal(res, canal, alvo = null) {
  const geral = res?.porCanal?.[canal] || 0;
  if (!alvo) return geral;
  return geral + (res?.porAlvo?.[canal]?.[alvo] || 0);
}

/** Todos os alvos tocados num canal, para a UI iterar sem varrer o catálogo. */
export const alvosDoCanal = (res, canal) => Object.keys(res?.porAlvo?.[canal] || {});

/* ------------------------------------------------------------ */
/* ESCOPO DE ARMA                                                */
/* ------------------------------------------------------------ */
/**
 * Uma linha de dano responde a VÁRIOS alvos ao mesmo tempo, e não a um só. Uma
 * Katana atende pelo próprio id, por ser arma, pela categoria (`cat:corpo`), pelo
 * grupo (`grupo:espada`) e por cada propriedade (`prop:duas_maos`).
 *
 * O Combatente é quem forçou isto: a especialização inteira é escrita em cima de
 * classes de arma ("ataques com armas de arremesso", "armas do grupo escolhido",
 * "arma que possua a propriedade pesada"), e mirar pelo id de cada arma não daria
 * conta. O Lutador não precisou porque fala de desarmado e de armas dedicadas,
 * que já são alvos concretos.
 *
 * Vocabulário dos prefixos, para o conteúdo não inventar:
 *   `arma`         — qualquer linha vinda de arma (exclui o Ataque Básico)
 *   `cat:<id>`     — corpo, distancia, arremesso
 *   `grupo:<id>`   — espada, arco, tiro... (ver ARMA_GRUPOS)
 *   `prop:<id>`    — duas_maos, pesada, estendida... (ver ARMA_PROPRIEDADES)
 *   `tipo:<id>`    — ct, im, pf, queimante (ver TIPOS_DANO). Os Especialistas
 *                    em Cortes, Concussão e Perfuração (Talentos) miram assim
 *
 * O mesmo mecanismo serve PERÍCIA e TR pelo atributo, `atr:<id>`: as Dádivas do
 * Céu do Restringido dizem "bônus em teste de perícia ou resistência usando
 * destreza", e listar as perícias uma a uma no conteúdo seria lista à mão que
 * envelhece. Ver `escoposDe` em resolveTestes.
 */
export const ESCOPO_PREFIXOS = ["cat:", "grupo:", "prop:", "atr:", "tipo:"];

/** Os alvos a que uma linha de dano responde. Sem arma, é só o Ataque Básico. */
export function escoposDaArma(arma) {
  if (!arma) return ["basico"];
  return [
    arma.id, "arma",
    ...(arma.categoria ? [`cat:${arma.categoria}`] : []),
    ...(arma.grupo ? [`grupo:${arma.grupo}`] : []),
    ...(arma.tipoDano ? [`tipo:${arma.tipoDano}`] : []),
    ...(arma.propriedades ?? []).map((p) => `prop:${p.id}`),
  ];
}

/**
 * Como `valorCanal`, mas para uma fonte que responde a vários alvos. O valor
 * SEM alvo (que vale para todos) entra uma vez só, e os direcionados somam.
 */
export function valorCanalEscopos(res, canal, escopos = []) {
  const dir = res?.porAlvo?.[canal] || {};
  return escopos.reduce((s, e) => s + (dir[e] || 0), res?.porCanal?.[canal] || 0);
}

/**
 * O perdedor do pool exclusivo fica em `detalhes` para o hover poder mostrá-lo,
 * mas ele NÃO entrou em `porCanal`. Por isso os dois leitores abaixo o escondem
 * por padrão: quem só quer exibir a fonte pede `incluirSuplantados`, e quem SOMA
 * o que leu (as faces do dado de regeneração, os dados de dano) fica protegido
 * de contar um número que a regra já descartou.
 */
const contaNoTotal = (d, incluirSuplantados) => incluirSuplantados || !d.suplantado;

/** Irmão do `detalhesDoCanal` para vários alvos, sem repetir o mesmo efeito. */
export function detalhesDoCanalEscopos(res, canal, escopos = [], incluirSuplantados = false) {
  const alvo = new Set(escopos);
  return (res?.detalhes || []).filter(
    (d) => d.canal === canal && (d.alvo == null || alvo.has(d.alvo)) && contaNoTotal(d, incluirSuplantados),
  );
}

/**
 * Os efeitos que caíram num canal (e opcionalmente num alvo), um por FONTE.
 * É o que alimenta o hover que mostra de onde vem cada parcela de um valor.
 * Inclui os sem alvo, que valem para todos os alvos daquele canal.
 */
export function detalhesDoCanal(res, canal, alvo = null, incluirSuplantados = false) {
  return (res?.detalhes || []).filter(
    (d) => d.canal === canal && (d.alvo == null || d.alvo === alvo) && contaNoTotal(d, incluirSuplantados),
  );
}

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */

/**
 * Confere um mapa de efeitos contra o catálogo de canais. Rodar a cada leva de
 * conteúdo: erro de canal só apareceria em runtime, e calado.
 */
export function validarMapaEfeitos(mapa, nomeDoMapa = "efeitos") {
  const problemas = [];
  for (const [id, efs] of Object.entries(mapa || {})) {
    if (!Array.isArray(efs) || !efs.length) {
      problemas.push(`${nomeDoMapa}: ${id} sem efeitos`);
      continue;
    }
    for (const e of efs) {
      const canal = CANAL_BY_ID[e?.canal];
      if (!canal) { problemas.push(`${nomeDoMapa}: ${id} usa canal inexistente "${e?.canal}"`); continue; }
      if (!e.expr) problemas.push(`${nomeDoMapa}: ${id} sem expr no canal ${e.canal}`);
      if (e.alvo && !canal.alvo) problemas.push(`${nomeDoMapa}: ${id} passa alvo num canal sem destino (${e.canal})`);
      if (e.furaTeto && !canal.aceitaFuraTeto) {
        problemas.push(`${nomeDoMapa}: ${id} marca furaTeto num canal que não aceita (${e.canal})`);
      }
      if (e.furaTeto && !FURA_TETO_PERMITIDO.includes(id)) {
        problemas.push(`${nomeDoMapa}: ${id} marca furaTeto, e só ${FURA_TETO_PERMITIDO.join(", ")} pode passar de 30`);
      }
      if (e.semCredito && !canal.aceitaSemCredito) {
        problemas.push(`${nomeDoMapa}: ${id} marca semCredito num canal que não aceita (${e.canal})`);
      }
      /* ⚠ O PORTÃO DO UPGRADE GRÁTIS. Uma concessão de faixa cuja expressão lê a
         faixa da PRÓPRIA ficha (`prof_x`, `prof_tr_x`) é a família do "Caso já
         seja": ela só cresce porque o jogador pagou, e creditá-la devolveria a
         vaga que a fez crescer. Quem escreve uma dessas TEM de dizer se credita,
         porque esquecer dá mestre de graça e sem sintoma nenhum na tela. */
      if (canal.aceitaSemCredito && !e.semCredito && /(^|[^a-z_])prof_(tr_)?[a-z]/.test(e.expr || "")) {
        problemas.push(
          `${nomeDoMapa}: ${id} concede faixa lendo a faixa da própria ficha e não diz se credita. `
          + `Ponha semCredito: true (é o caso do "Caso já seja") ou tire o prof_ da expressão`,
        );
      }
      if (e.duracao && e.duracao !== "permanente" && e.duracao !== "temporaria") {
        problemas.push(`${nomeDoMapa}: ${id} tem duracao inválida "${e.duracao}"`);
      }
      // Família errada faria o efeito cair no pool sem disputar com ninguém, o
      // que é pior que não marcar nada: ele sairia da soma e não voltaria.
      if (e.exclusivo && !FAMILIA_EXCLUSIVA_BY_ID[e.exclusivo]) {
        problemas.push(`${nomeDoMapa}: ${id} marca a família exclusiva "${e.exclusivo}", que não existe`);
      }
      // Variável adiada vira ZERO calado dentro da expressão, então é erro de
      // conteúdo, não de runtime. Pegar aqui.
      for (const v of VARS_ADIADAS) {
        const re = new RegExp(`\\b${v}\\b`);
        if (re.test(e.expr || "") || re.test(e.quando || "")) {
          problemas.push(`${nomeDoMapa}: ${id} usa "${v}", que o contexto da criatura ainda não expõe`);
        }
      }
      // Estado de combate escrito errado também vira ZERO calado, e aí a
      // habilidade simplesmente nunca liga. O risco mora nos nomes DERIVADOS
      // das opções (`armas_absolutas_defesa`), que ninguém escreve à mão duas
      // vezes igual: qualquer identificador que comece por um estado conhecido
      // tem de ser um estado conhecido inteiro.
      for (const texto of [e.expr, e.quando]) {
        for (const ident of String(texto || "").match(/\b[a-z][a-z0-9_]*\b/g) || []) {
          if (COMBATE_VARS.includes(ident)) continue;
          if (COMBATE_VARS.some((v) => ident.startsWith(`${v}_`))) {
            problemas.push(`${nomeDoMapa}: ${id} usa "${ident}", que não é um estado de combate`);
          }
        }
      }
    }
  }
  return problemas;
}
