/**
 * ============================================================
 * MOTOR DE CÁLCULO — GRIMÓRIO AFTY (fórmulas reais)
 * ============================================================
 * Fórmulas confirmadas pelo autor (transcrição em
 * docs/afty-formulas-base.md). Cálculo por MATEMÁTICA, ND 1→∞.
 *
 * Eixos da criatura: ND (Nível de Desafio) + Patamar + Tipo.
 *   • Tipo dirige os coeficientes de HP/PE/CD/Defesa/RD.
 *   • Patamar multiplica HP e escala Resistência/Atributos.
 *   • Alma (Integridade da Alma, 0–100+) multiplica o HP.
 *
 * ADIADO (marcado TODO, conforme o autor):
 *   • Perícias → Atenção usa Percepção = 0 por ora.
 *   • Grau de Equipamento (Ferramentas Amaldiçoadas) ainda não existe. O que
 *     entra hoje é o equipamento base: Defesa do uniforme, RD Física do
 *     escudo, penalidade de Destreza, carga e sobrecarga.
 *
 * MOTOR DE AUTOMAÇÃO (afty-efeitos.js): desde 2026-07-27 as Habilidades de
 *   Especialização, Talentos, Alto Nível, TREINAMENTOS e HABILIDADES GERAIS
 *   entram todos pelo mesmo caminho, `{ canal, expr }`, aplicado em estágios:
 *     0.  Fontes a montante do contexto: Treinamentos, Habilidades Gerais e os
 *         campos "+ OUTROS" da ficha. Concedem atributo, nível de aptidão e
 *         vagas de orçamento, tudo lido antes de os stats existirem.
 *     1a. `atributo` permanente  → o que os PRÉ-REQUISITOS enxergam.
 *     1b. `atributo` temporário  → o atributo FINAL da ficha.
 *     2.  Todos os outros canais, já lendo o atributo final.
 *   Por isso os catálogos escolhidos são resolvidos LOGO NO INÍCIO desta
 *   função, e não mais perto do fim.
 * ============================================================
 */

// Avaliador da DSL. Só o editor do Funcionamento Básico o usa aqui, para
// reexibir o valor de cada linha: a aplicação de verdade é do `aplicarEfeitos`.
import { evalNumber as evalNumberDsl } from "./afty-dsl";
import {
  AFTY_RESISTENCIAS, TAMANHO_BASE, tamanhoPorDegraus, funcionamentosDaFicha,
} from "./afty-schema";
import {
  ATTR_KEYS, ATTR_LABEL, ATTR_LIMITE_PADRAO, ATTR_LIMITE_MAX, ATTR_LIMITE_ABSOLUTO,
} from "./afty-atributos";
import {
  resolveOrigemAttrBonus, resolveDesenvolvimento, resolveEscolhasOrigem,
  limiteAtributoDaOrigem, resolveLimitePoolOrigem, origensQualificadas,
  fatorSlotsHabilidade, aptidoesConcedidasPelaOrigem,
} from "./afty-origens";
import { efeitosDeTreino, vagasEncantamentoDeTreino } from "./afty-treinamentos";
import { efeitosDeTreinoEspecial } from "./afty-treinos-especiais";
import { resolveNiveisAptidao, trilhasDaCriatura, getAptidao, AFTY_APTIDOES } from "./afty-aptidoes";
import {
  efeitosDoDominio, efeitosDeAptidaoDoDominio, beneficiosRitualDoDominio,
  dominioEmUso,
  listaDominios, resolveVersao as resolveVersaoDominio,
  duracaoDominio, areaDominio, custoDominio, pvBarreira, maxEfeitos, vagasUsadas,
  textoDoDominio, pvDaParede, pvCortina, rdDaParede, maxParedes, conflitoDeDominio,
  PAREDES_BASE, PAREDES_NA_CORTINA,
} from "./afty-dominios";
import { resolveEspecializacoes, AFTY_ESPECIALIZACOES, treinamentosDasEspecializacoes } from "./afty-especializacoes";
import {
  resolveHabilidades, efeitosInvocacaoControlador, getHabilidade, OPCAO_ESCOLHA_NOME,
  resolveMarcadoresInvocacao, resolveControleInvocacoes,
  AFTY_HABILIDADES,
  resolveArmasDedicadas, efeitosArmasDedicadas, resolveEmpolgacao,
  encantamentosDeManejoEspecial, habilidadesConcedidasPelasEspecializacoes,
  aptidoesConcedidasPelasHabilidades,
} from "./afty-habilidades";
import {
  resolveTalentos, resolveTreinoEscudo, getTalento, OPCAO_TALENTO_NOME, AFTY_TALENTOS,
} from "./afty-talentos";
import {
  resolveAltoNivel, getMelhoriaSuperior, getHabilidadeLendaria, getHabilidadeApice,
} from "./afty-alto-nivel";
import { resolveInvocacoesList, resolveHordasList } from "./afty-invocacoes";
import {
  resolveEquipamentos, resolveCarga, grauFeiticeiro, alcanceDaArma, propriedadesDaArma,
  podeSerArmaDedicada, grauDoRank, efeitosEspeciaisDeArma, catalogoDoTipo,
} from "./afty-equipamentos";
import { nivelMaxFeitico, resumoDeUmFeitico, resumoFeiticos, overridesShikigami } from "./afty-feiticos";
import { resolveEstilos, efeitosDoEstilo } from "./afty-estilo-sombras";
import { resolveDominioSimples, DOMINIO_SIMPLES_APTIDAO } from "./afty-dominio-simples";
import { resolveTestes, resolveDano, catalogoPericiasDaFicha } from "./afty-pericias";
import { resolveCura } from "./afty-cura";
import {
  problemasDeAddon, marcasDeclaradas, primitivasDaCriatura, liberacoesDaCriatura,
} from "./afty-addons";
import { agrupaConcedido, concessoesDaSessao, escolhasDoConcedido } from "./afty-concessao";
import {
  efeitosDasAdaptacoes, origensDiretasDasAdaptacoes, resumoAdaptacoes,
} from "./afty-adaptacao";
import {
  buildCriaturaDslContext, marcasDeEntradas,
  coletarEfeitosCriatura, coletarEfeitosMontante, coletarEfeitosOrigem,
  coletarEfeitosAptidao,
  aplicarEfeitos, resolverExclusivos, valorCanal, furaTetoEm, efeitosDaTecnica, efeitosDosPassivos,
  efeitosDaSessao, EFEITO_CANAIS,
  ehAtributoPermanente, ehAtributoTemporario, ehEstagio2, ehPreContexto, ehPosAptidao, efeitoUsaDadosDanoFinal,
  mesclarEfeitos, detalhesDoCanal, normalizarAlvoEfeito,
} from "./afty-efeitos";
import { resolveGerais, contadorHabilidades, GERAL_BY_ID } from "./afty-gerais";
import { resolveCombate, degrausBrutalidade } from "./afty-combate";
import {
  aplicarAptidoesNoDano, aptidoesAuraDesabilitadas, estadosCombateAptidoes,
} from "./afty-combate-aptidoes";
import {
  resolveTecnicasCombate, estadosCombateConjurador, efeitosCombateAmaldicoado,
  resolveAuxiliaresAtivos, aplicarImbuicaoNoDano, dadosAuxiliaresNaLinha,
} from "./afty-combate-conjurador";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

// Maestria == Treinamento (mesmo valor), por faixa de ND.
// Até o 21 a faixa é de 4 em 4 níveis; do 21 em diante, de 5 em 5
// (21, 26, 31, 36). Os dois últimos degraus vieram do autor em 2026-07-27.
export const maestria = (nd) => {
  if (nd >= 36) return 10;
  if (nd >= 31) return 9;
  if (nd >= 26) return 8;
  if (nd >= 21) return 7;
  if (nd >= 17) return 6;
  if (nd >= 13) return 5;
  if (nd >= 9) return 4;
  if (nd >= 5) return 3;
  return 2;
};

// Multiplicador de HP por Patamar, aplicado direto sobre a base.
// A planilha tinha um `×2` fixo + patamarMult {comum 1, desafio 1, calamidade 1,5, beyond 2},
// o que dava um efetivo de 2/2/3/4 (Comum empatado com Desafio). O `×2` era, na prática,
// o multiplicador do Desafio: foi absorvido aqui, e o Comum virou metade do Desafio.
export const HP_PATAMAR_MULT = { comum: 1, desafio: 2, calamidade: 3, beyond: 4 };

// Stats que a aba Cálculos permite sobrescrever (valor final, padrão StatField).
export const OVERRIDABLE = ["hp", "pe", "defesa", "cd", "rdGeral", "rdEspecifico", "rdAlma", "movimento", "resParcial", "atencao", "iniciativa"];

const INT = (x) => Math.floor(x); // INT() da planilha (ND > 0 → floor)

/**
 * As FAMÍLIAS de variável do DSL, completas.
 *
 * ⚠ Existe porque o `evalNumber` da 2.5.2 não trata identificador desconhecido:
 * a expressão inteira cai no fallback, calada. Sem isto, `2 + (esc_combatente
 * >= 8)` numa criatura sem Combatente daria 0 em vez de 2, e o Roubo de
 * Habilidade (Restringido 2°), que importa habilidade de outra classe, nunca
 * funcionaria. Montado uma vez, dos catálogos, e passado ao contexto.
 */
const VOCABULARIO_DSL = {
  pericias: [],
  resistencias: AFTY_RESISTENCIAS.map((r) => r.value),
  // `tem_*` cobre Habilidade, Talento E Aptidão: os Estilos de Combate leem
  // `tem_tal_adepto_de_combate` para saber se vieram pelo Talento, e o
  // Revestimento Evoluído (Maldição) lê `tem_mal_revestimento` para saber sobre
  // o que ele está melhorando. Os prefixos de id não colidem entre os três.
  habilidades: [
    ...AFTY_HABILIDADES.map((h) => h.id),
    ...AFTY_TALENTOS.map((t) => t.id),
    ...AFTY_APTIDOES.map((a) => a.id),
  ],
  especializacoes: AFTY_ESPECIALIZACOES.map((e) => e.id),
  // Toda booleana de escolha de Aptidão que pode existir, para nenhuma
  // expressão que a cite cair no fallback por ela não estar declarada.
  opcoesAptidao: AFTY_APTIDOES.flatMap((a) =>
    (a.opcoes?.valores ?? []).map((v) => `opt_${a.id}_${v.id}`)),
};

/**
 * @param creature ficha (só escolhas)
 * @param opcoes   ajustes de JOGO, que o CRIADOR nunca passa:
 *   • almaAtual — Integridade da Alma CORRENTE. Ver a nota do `almaMult` abaixo.
 *   • ultimoFeiticoDanoId — última manifestação de dano usada na Ficha Final.
 *   • rituais — melhorias escolhidas para o próximo uso de cada Feitiço.
 *   • usosRitualista — melhorias adicionais gastas desde o último descanso.
 *   • ritualAtual — Ritual aguardando teste, escolha ou conclusão na Ficha Final.
 *   • rituaisSemTeste — mapa de Feitiços cuja fonte dispensa Prestidigitação.
 */
export function deriveAfty(creature, opcoes = {}) {
  const core = creature?.core ?? {};
  /* CONCESSÃO VINDA DA SESSÃO (Addons 8.3). Chega pelo `opcoes`, e não pela
     criatura, porque ela é estado de SESSÃO e nunca ficha: o mestre dá no meio
     do combate, ela vale para tudo, não gasta vaga nenhuma e morre quando a
     sessão acaba (decisões do autor, 2026-08-20). Cada família recebe a parte
     dela pelo CANAL DE CONCESSÃO do resolvedor. Ver `afty-concessao.js`. */
  const concedido = agrupaConcedido(opcoes.concedido);
  const escolhasConcedidas = escolhasDoConcedido(opcoes.concedido);
  const origensDiretasDaAdaptacao = new Set(origensDiretasDasAdaptacoes(creature, opcoes.adaptacoes));
  const aplicarDiretoDaAdaptacao = (efeito) => {
    if (!efeito?.quando || !origensDiretasDaAdaptacao.has(efeito.origem)) return efeito;
    const direto = { ...efeito };
    delete direto.quando;
    return direto;
  };
  /* O que os Addons DESTA criatura destravam. Leitura direta da ficha, sem
     passar pelo Motor: é pergunta estrutural ("esta criatura pode ter Estilo?")
     e precisa estar respondida antes de quase tudo. Ver `LIBERACOES`. */
  const liberacoes = liberacoesDaCriatura(creature);
  const a = creature?.attributes ?? {};
  const ov = creature?.statOverrides ?? {};
  const vocabularioDsl = {
    ...VOCABULARIO_DSL,
    pericias: catalogoPericiasDaFicha(creature).map((p) => p.id),
  };

  const tipo = core.tipo || "combatente";
  // ⚠ O RESTRINGIDO NÃO TEM ENERGIA AMALDIÇOADA (autor, 2026-07-29). É a
  // definição da origem ("nascem com uma quantidade quase nula de energia").
  // Mas o RECURSO É O MESMO (autor, 2026-07-29): Ponto de Estamina e Ponto de
  // Energia são ambos PE, mesma pilha e mesmo valor, só com nome diferente na
  // boca do Restringido. Toda habilidade que diz "gaste PE" ele paga em
  // Estamina. O que a falta de energia amaldiçoada tira é a parte de APTIDÃO:
  // nenhum Nível de Aptidão e nenhuma Aptidão Amaldiçoada.
  // Segue o TIPO, e não a origem, porque o Tipo é quem dirige toda fórmula e a
  // origem Restringido já o força.
  const semEnergia = tipo === "restringido";
  // Nome do recurso na UI. O número é o mesmo dos outros Tipos.
  const recursoLabel = semEnergia ? "Estamina" : "Energia";
  const patamar = core.patamar || "comum";
  const nd = Math.max(1, core.nd ?? 1);
  // Especializações precisam existir antes das Aptidões e dos Feitiços: as
  // Bases automáticas dependem do nível da classe, duas Bases do Suporte
  // concedem Aptidões e Adiantar a Evolução antecipa o acesso de Conjurador.
  const especializacoes = resolveEspecializacoes(creature);
  const nivelConjurador = especializacoes.escolhidas
    .find((e) => e.id === "conjurador")?.nivel ?? 0;
  const habilidadesConcedidas = habilidadesConcedidasPelasEspecializacoes(especializacoes.escolhidas);
  /* ⚠ ORIGEM ESTRUTURAL, e não a gravada. O Gêmeo que copiou da Maldição em
     Verdadeiras Origens perde a trilha de Energia Reversa como uma Maldição de
     verdade (autor, 2026-08-29). Ver `origemEstrutural` em afty-origens.js. */
  const trilhasOrigem = trilhasDaCriatura(creature);
  // ---------- Aptidões Amaldiçoadas EFETIVAS ----------
  // As escolhidas na aba mais as CONCEDIDAS POR NOME pela origem ou pela
  // Especialização. Fecha aqui em cima porque quase tudo lê esta lista: o
  // `coletarEfeitosAptidao`, a Expansão de Domínio, a Cura, a bancada, o
  // `tem_*` do DSL e a UI.
  //
  // ⚠ O Restringido zera as duas metades: sem energia amaldiçoada não há
  // aptidão nenhuma, nem escolhida nem concedida.
  const aptidoesConcedidasOrigem = semEnergia ? [] : aptidoesConcedidasPelaOrigem(creature, nd);
  // A origem Maldição não possui a trilha de Energia Reversa. A concessão do
  // Suporte respeita essa trava já estabelecida e não reabre a categoria.
  const podeReceberEnergiaReversa = trilhasOrigem.some((t) => t.key === "er");
  const aptidoesConcedidasEspecializacao = semEnergia || !podeReceberEnergiaReversa
    ? []
    : aptidoesConcedidasPelasHabilidades(habilidadesConcedidas);
  // ⚠ A CONCESSÃO DA SESSÃO (Addons 8.3) ENTRA AQUI, no mesmo caixa das que a
  // origem e as Habilidades já concediam: as três são "vale para tudo e não
  // gasta vaga". O `semEnergia` continua valendo por cima de todas, porque um
  // Restringido não tem Aptidão nenhuma, nem escolhida nem dada pelo mestre.
  const aptidoesConcedidas = semEnergia ? [] : [...new Set([
    ...aptidoesConcedidasOrigem,
    ...aptidoesConcedidasEspecializacao,
    ...concedido.aptidoes,
  ])];
  const aptidoesEscolhidasFicha = semEnergia || !Array.isArray(creature?.aptidoesAmaldicoadas)
    ? []
    : creature.aptidoesAmaldicoadas;
  // A concedida NÃO duplica quando o jogador também a marcou à mão.
  const aptidoesIds = [...new Set([...aptidoesEscolhidasFicha, ...aptidoesConcedidas])];
  // A ficha que o resto do motor enxerga já vem com a concedida dentro, para
  // nenhum leitor precisar lembrar de somar as duas listas.
  const creatureComAptidoes = aptidoesConcedidas.length
    ? { ...creature, aptidoesAmaldicoadas: aptidoesIds }
    : creature;
  // ⚠ A ficha do criador é sempre montada com a alma ÍNTEGRA (autor,
  // 2026-07-29): o campo "Integridade da Alma" saiu do formulário, porque o
  // Máximo da Alma já diz tudo, e dano na alma é coisa de jogo, não de criação.
  // Consequência: `almaMult` passou a seguir o MÁXIMO, então a Melhoria de Alma
  // e a Consciência Absoluta da Alma agora rendem PV de verdade (o multiplicador
  // era 1 fixo enquanto o campo ficava no 100 padrão).
  // O valor CORRENTE existe só no jogo, em `combatState.almaCurrent`.
  const almaMaxBase = creature?.alma?.max ?? 100;
  // A Alma que o DSL enxerga (`alma_atual`). No criador é o máximo, em jogo é o
  // corrente, e é o que faz um `quando: "alma_atual < 50"` significar algo. Sai
  // aqui em cima porque o contexto do DSL é montado bem antes de `almaMax`
  // existir (ele depende do canal, que depende do contexto).
  const almaAtualDsl = opcoes.almaAtual != null
    ? Math.max(0, Math.trunc(Number(opcoes.almaAtual) || 0))
    : almaMaxBase;
  const qntPE = creature?.qntPE || "normal";

  const attrBonus = resolveOrigemAttrBonus(creature);
  const nivelAlloc = creature?.attrNivel ?? {};
  const desenv = resolveDesenvolvimento(creature);
  // Pool que sobe SÓ o limite (Maldição). Irmão do desenvolvimento, e por isso
  // NÃO entra no `eff` lá embaixo: ele abre espaço, quem preenche é o jogador
  // com os pontos distribuíveis da origem.
  const limPool = resolveLimitePoolOrigem(creature);
  // Equipamento primeiro: os acessórios de atributo entram no cálculo do
  // efetivo. A CARGA não sai daqui, porque depende do mod de Força final.
  // BT antecipado só para as Cargas de Encantamento das Ferramentas (= BT).
  const bt = maestria(nd);                                          // Maestria == Treinamento
  // ⚠ Os dois abaixo leem a ficha CRUA, e não os catálogos já resolvidos, e é
  // por causa desta ordem: o equipamento é o primeiro passo, e Treinamentos e
  // Habilidades só são resolvidos bem mais abaixo. Nenhum dos dois depende de
  // stat, então a leitura crua dá o mesmo resultado.
  //   • Completo do Treino de Manejo de Arma: uma vaga LIVRE de encantamento na
  //     arma treinada (não desce o grau de cálculo).
  //   • Manejo Especial (Combatente 6°): um encantamento CONCEDIDO a toda arma
  //     equipada, também sem custo de grau.
  const equip = resolveEquipamentos(creature, bt, {
    vagasEncantamento: vagasEncantamentoDeTreino(creature),
    encantamentosExtras: encantamentosDeManejoEspecial(creature),
  });

  // Limite EFETIVO por atributo = limite base (20 / poderes) + Desenvolvimento, teto 30.
  // O RESTRINGIDO eleva o limite dos FÍSICOS para 30: "Seu limite de atributo
  // para Força, Destreza e Constituição é 30 ao invés de 20" (Ápice Corporal
  // Humano). Vale o MAIOR entre o da ficha, o da origem e o do Tipo, para um
  // limite subido à mão nunca ser rebaixado.
  //
  // ⚠ Vem dos DOIS lados de propósito. A origem Restringido força o Tipo
  // Restringido, mas o Tipo pode ser escolhido sozinho na aba Informações, e o
  // autor confirmou (2026-07-29) que o limite é do Restringido, não de um
  // caminho específico até ele.
  const limBase = (creature?.attrLimite && typeof creature.attrLimite === "object") ? creature.attrLimite : {};
  const limTipo = tipo === "restringido"
    ? { forca: ATTR_LIMITE_MAX, destreza: ATTR_LIMITE_MAX, constituicao: ATTR_LIMITE_MAX }
    : {};
  // ⚠ Recebe a CRIATURA, e não o id: o limite do Gêmeo depende da morte do
  // irmão. Ele precisa estar aqui, no estágio 0, porque é aqui que o bônus de
  // atributo da própria origem é aparado.
  const limOrigem = { ...limiteAtributoDaOrigem(creature), ...limTipo };
  // Limite de ESTÁGIO 0: o que a ALOCAÇÃO respeita (base, pool de nível e bônus
  // de origem). O limite FINAL sai mais abaixo, somando o canal `limiteAtributo`
  // do Motor, que só existe depois de os catálogos serem resolvidos.
  const limiteBaseOf = (key) =>
    Math.min(
      Math.max(limBase[key] ?? ATTR_LIMITE_PADRAO, limOrigem[key] ?? 0)
        + (desenv[key] || 0) + (limPool[key] || 0),
      ATTR_LIMITE_MAX,
    );

  // Atributo EFETIVO = base + nível + Desenvolvimento + bônus de origem.
  // Atributos de ORIGEM NÃO passam o limite (salvo os que digam explicitamente — TODO).
  // base+nível+Desenvolvimento já cabem no limite por construção (o Desenvolvimento
  // eleva valor E limite juntos); o bônus de origem é limitado ao limite efetivo.
  // Acessório de atributo (Anéis do Conhecimento, Bracelete da Força...) é o
  // único bônus que PASSA o limite: o texto deles diz "podendo superar o seu
  // limite de atributo, até o máximo de 30". Por isso ele entra depois do
  // clamp do limite, contra o teto duro de 30.
  //
  // ⚠ O excedente do acessório é GUARDADO (`folgaEquip`), e não só somado: o
  // clamp do estágio 1 precisa saber quanto daquele valor está legitimamente
  // acima do limite, senão ele apararia o acessório de volta ao aparar o Motor.
  const folgaEquip = {};
  // Ponto de bônus PERDIDO no limite, por atributo. A convenção do projeto é a
  // origem ter prioridade e o ponto de nível voltar ao pool (o `nivMax` do
  // builder reserva o espaço), então a parcela de estágio 0 normalmente é zero.
  // A do estágio 1 (Motor) não é: Pináculo Físico num Restringido de Força 30 não
  // tem para onde ir. O builder avisa em vez de esconder.
  const perdaNoLimite = {};
  const eff = (key) => {
    const somado = (a[key] ?? 10) + (nivelAlloc[key] || 0) + (desenv[key] || 0) + (attrBonus[key] || 0);
    const dentroDoLimite = Math.min(somado, limiteBaseOf(key));
    perdaNoLimite[key] = somado - dentroDoLimite;
    const comEquip = Math.min(dentroDoLimite + (equip.attrBonus[key] || 0), ATTR_LIMITE_MAX);
    folgaEquip[key] = comEquip - dentroDoLimite;
    return comEquip;
  };

  // Atributo e modificador BASE: tudo menos os efeitos de habilidade. É o que
  // os pré-requisitos e as expressões do Motor leem, para uma habilidade que
  // concede atributo não morder a própria conta.
  const attrBase = {
    forca: eff("forca"), destreza: eff("destreza"), constituicao: eff("constituicao"),
    inteligencia: eff("inteligencia"), sabedoria: eff("sabedoria"), presenca: eff("presenca"),
  };
  const modBase = Object.fromEntries(Object.entries(attrBase).map(([k, v]) => [k, mod(v)]));

  // Mod. Técnica = modificador do atributo escolhido para a Técnica/CD
  const tecnicaAttr = core.tecnicaAttr || "inteligencia";

  const grau = grauFeiticeiro(nd);                                 // grau do feiticeiro por faixa de ND

  // ---------- ESTÁGIO 0: fontes A MONTANTE do contexto ----------
  // Treinamentos, Habilidades Gerais e os campos "+ OUTROS" da ficha foram
  // ABSORVIDOS pelo Motor em 2026-07-27 (decisão do autor): emitem
  // `{ canal, expr }` como qualquer outra fonte, em vez dos agregadores
  // paralelos que tinham. Entram ANTES de tudo porque concedem atributo, NÍVEL
  // DE APTIDÃO e VAGAS DE ORÇAMENTO, coisas lidas antes de os stats existirem.
  // Por isso rodam com um contexto reduzido (ND, Maestria, grau, patamar, tipo
  // e os atributos base), que é tudo de que as expressões deles precisam.
  const gerais = resolveGerais(creature, { nd, maestria: bt, concedidos: concedido.gerais });
  const ctxMontante = buildCriaturaDslContext({
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual: almaAtualDsl,
    irmaoMorto: !!creature?.core?.origem?.irmaoMorto,
    iniciativaIrmao: creature?.core?.origem?.iniciativaIrmao,
    attrEff: attrBase, mods: modBase, modTecnica: modBase[tecnicaAttr] ?? 0, tecnicaAttr,
    periciasProf: creature?.pericias,
    // O vocabulário entra AQUI TAMBÉM: o contexto reduzido não tem `esc_*` nem
    // `tem_*`, e sem eles declarados uma expressão que os citasse cairia inteira
    // no fallback, calada. Origem não escala com classe, então zero é a resposta
    // certa — mas ela precisa ser dada, não silenciada.
    vocabulario: vocabularioDsl,
    /* ⚠ SEM `marcas`, e é de propósito: o montante roda ANTES de Habilidades,
       Talentos e Aptidões serem resolvidos, então não há o que contar. O
       `contar()` devolve 0 aqui, do mesmo jeito que `tem_*` vale 0. */
  });
  // ORIGEM entra no montante junto do resto: ela concede vaga de habilidade, de
  // perícia, de feitiço e de aptidão, e vaga é lida antes de os stats existirem.
  // As escolhas aninhadas dela (Treinamentos de Clã, Empenho Implacável) saem
  // primeiro porque carregam efeito próprio.
  const escolhasOrigem = resolveEscolhasOrigem(creature, nd);
  // Nenhuma das cinco fontes do pool exclusivo alimenta o montante (elas dão
  // stat, não orçamento), mas a resolução entra aqui do mesmo jeito: sem ela um
  // exclusivo que aparecesse por engano sairia da soma e nunca voltaria.
  /* A lista do montante fica NOMEADA porque ela é lida duas vezes: aqui, no
     estágio 0, e no estágio 0c lá embaixo, que precisa dos mesmos efeitos com o
     Nível de Aptidão já no contexto. Ver `CANAIS_POS_APTIDAO`. */
  const efeitosMontante = [
      ...efeitosDeTreino(creature),
      // Treino Especial entra ao lado da Linha de Treinamento porque é a mesma
      // família (Interlúdio) e emite a mesma classe de coisa: VAGA de orçamento,
      // lida antes de os stats existirem. Hoje só `vagasFeitico`.
      ...efeitosDeTreinoEspecial(creature, concedido.treinosEspeciais),
      ...coletarEfeitosOrigem(creature, escolhasOrigem),
      ...coletarEfeitosMontante(creature, gerais, GERAL_BY_ID),
  ];
  const efMontante = resolverExclusivos(aplicarEfeitos(efeitosMontante, ctxMontante));
  // Os canais que precisam ser lidos ANTES do contexto principal: dois
  // alimentam resolveNiveisAptidao (nível de aptidão é variável do DSL) e um
  // alimenta o orçamento de Habilidades de Especialização. O resto (hp, pe,
  // movimento, defesa, atributo, focos, vagas de perícia e de aptidão) entra
  // pelo caminho normal do Motor, mais abaixo.
  const treino = {
    aptidao: valorCanal(efMontante, "pontosAptidao"),
    aptidaoTrilha: efMontante.porAlvo.nivelAptidao || {},
  };
  const vagasHabilidade = valorCanal(efMontante, "vagasHabilidade");
  // Vaga EXCLUSIVA de Talento (autor, 2026-08-03): o Talento Natural do Inato
  // dava vaga COMUM, e assim uma característica que o livro escreve como "um
  // Talento à escolha" pagava Habilidade de Especialização qualquer.
  const vagasTalento = valorCanal(efMontante, "vagasTalento");

  // ============================================================
  // CATÁLOGOS ESCOLHIDOS + MOTOR DE AUTOMAÇÃO
  // ============================================================
  // Resolvidos AQUI, antes dos stats, e não mais perto do fim: é o que permite
  // um efeito de habilidade alcançar HP, Defesa, CD e companhia. Nenhum destes
  // precisa de stat, só de ND, Maestria, atributos e origem.
  //
  // ⚠ Os atributos usados no pré-requisito são os BASE (attrEff, sem efeito
  // nenhum de habilidade). Sem essa regra, habilidade que concede atributo
  // morde a própria conta. Ver o topo de afty-efeitos.js.

  // ⚠ Os níveis de aptidão saem MAIS ABAIXO, depois das Habilidades: elas
  // também concedem trilha (Aptidões de Luta, Aptidões de Combate), e a
  // concessão precisa entrar antes de `dom/au/cl/bar/er` virarem variável.

  // Especializações não entram diretamente em nenhum stat (quem dirige
  // fórmula é o Tipo). Foram resolvidas no início porque agora também concedem
  // três Bases do Suporte pelo nível.

  // Talentos dividem o orçamento das Habilidades de Especialização, então saem
  // antes. O acesso deles lê ND, origem e atributos, nunca nível de classe.
  // ⚠ Este é um resolve PRELIMINAR: os ids e o gasto já são definitivos, mas o
  // `inacessiveis` é refeito mais abaixo, com o atributo já somado dos efeitos
  // PERMANENTES. Talento é o único catálogo cujo pré-requisito lê atributo.
  const origemId = creature?.core?.origem?.id ?? null;
  // Mais de uma quando o Gêmeo copia uma origem em Verdadeiras Origens.
  const origensQuali = origensQualificadas(creature);
  const talentosPre = resolveTalentos(creature, {
    nd, maestria: bt, attrEff: attrBase, origemId, origensQualificadas: origensQuali,
    especializacoes: especializacoes.escolhidas, aptidoes: aptidoesIds,
    concedidos: concedido.talentos,
  });
  const treinamentosEquipamento = treinamentosDasEspecializacoes(especializacoes.escolhidas);
  const treinoEscudo = resolveTreinoEscudo(especializacoes.escolhidas, talentosPre.escolhidas);
  // bt entra por causa do Roubo de Habilidade, cujo limite de repetições é o
  // Bônus de Treinamento. O último parâmetro são as vagas extras da Habilidade
  // Geral Especialização.
  const habilidades = resolveHabilidades(
    creature, especializacoes.escolhidas, talentosPre.gastos, bt, vagasHabilidade, vagasTalento,
    {
      nd,
      almaLivreEspecializacao: talentosPre.almaLivreEspecializacao,
      concedidasSessao: concedido.habilidades,
      escolhasConcedidasSessao: escolhasConcedidas,
    },
  );
  // Alto Nível (21+). Além do ND, cada trilha exige a Habilidade Geral
  // correspondente, que só DESTRAVA (não dá vaga).
  const altoNivel = resolveAltoNivel(creature, {
    niveisPorEspec: habilidades.niveisPorEspec,
    habilidades: habilidades.escolhidas,
    destravado: gerais.destravado,
    concedidos: {
      melhoriasSuperiores: concedido.melhoriasSuperiores,
      lendarias: concedido.lendarias,
    },
  });

  // Nível por especialização para o DSL: real (trava pré-requisito) e de
  // escalonamento (real + metade da outra classe, o que os efeitos escalam).
  const nivelEspec = {};
  for (const e of especializacoes.escolhidas) {
    nivelEspec[e.id] = { real: e.nivel ?? 0, escalonamento: e.nivelEscalonamento ?? e.nivel ?? 0 };
  }
  if (habilidades.almaLivre?.habilidadeId) {
    nivelEspec[habilidades.almaLivre.especializacaoId] = {
      real: habilidades.almaLivre.nivel,
      escalonamento: habilidades.almaLivre.nivel,
    };
  }

  // Efeitos de ficha das entradas escolhidas. O catálogo de efeitos ainda está
  // VAZIO (Fase 0 é só a infraestrutura): a passada de conteúdo é a Fase 2/3 de
  // docs/afty-efeitos-criatura.md.
  // ⚠ TRÊS ESTÁGIOS (autor, 2026-07-27). O efeito de ATRIBUTO entra primeiro e
  // todo o resto lê o atributo já somado ("Tenho força 14. Recebo +6 de Força
  // fico com Força 20. Depois eu recebo +5 de Defesa (Mod. Força)"), e o
  // atributo se parte em permanente e temporário porque só o PERMANENTE conta
  // para pré-requisito ("Se o Modificador de Força for temporário, não! Se for
  // permanente, sim!"). Ver o topo de afty-efeitos.js.
  // Armas carregadas e as Dedicadas (Lutador 2°). Sobem para cá porque a
  // dedicação EMITE efeito (nível de dano e a propriedade Marcial), e efeito
  // tem de entrar no mesmo bolo dos outros, antes dos estágios.
  //
  // ⚠ É "arma EQUIPADA" desde 2026-08-01, quando a arma ganhou botão de equipar
  // na aba Equipamentos. Antes era toda arma CARREGADA, porque não havia como
  // equipar uma. Com o Acerto por grau entrando na linha, carregar uma arma na
  // mochila não pode mais render número.
  const armasCarregadas = equip.entradas.filter((e) => e.tipo === "arma" && e.equipado);
  // Grau de CÁLCULO da Ferramenta: cada encantamento desce um degrau, e o rank 0
  // não é grau nenhum (vira "desarmado" na tabela de dano adicional).
  const grauCalcDaArma = (e) => (e.fa ? (grauDoRank(e.fa.rankCalculo)?.value ?? null) : null);
  // Faixas e Manoplas (grupo pugilato) não viram linha: são o Ataque Básico.
  const armasParaDano = armasCarregadas
    .filter((e) => e.def?.grupo !== "pugilato")
    .map((e) => ({
      id: e.def.id,
      nome: e.def.nome,
      grauArma: grauCalcDaArma(e),
      // Acerto DESTA arma: +1 por grau da Ferramenta mais o que o encantamento
      // Precisa somar (autor, 2026-08-01). Fica na linha e não no Ataque da
      // categoria, senão o bônus vazaria para as outras armas.
      acertoGrau: e.fa?.acertoArma ?? 0,
      fontesAcerto: e.fa?.fontesAcerto ?? [],
      ataqueId: e.ataqueId,
      fineza: !!e.def.props?.fineza,
      critico: e.def.critico ?? 20,
      distancia: e.def.categoria === "distancia" || e.def.categoria === "arremesso",
      // Categoria e grupo alimentam os escopos de alvo (`cat:arremesso`,
      // `grupo:espada`), que é como o Combatente mira classes de arma inteiras.
      categoria: e.def.categoria ?? null,
      grupo: e.def.grupo ?? null,
      // Tipo de dano da arma (ct, im, pf), que é como os Especialistas em
      // Cortes, Concussão e Perfuração (Talentos) miram.
      tipoDano: e.def.dano?.tipo ?? null,
      alcance: alcanceDaArma(e.def),
      alcanceBonusCorpo: e.def.props?.estendida ? 1.5 : 0,
      propriedades: propriedadesDaArma(e.def),
      criticoExtraDados: e.fa?.encantamentos?.some((x) => x.id === "enc_arma_destruidora" && x.atende) ? 1 : 0,
      elegivelDedicada: podeSerArmaDedicada(e.def),
    }));
  const tecnicasCombate = resolveTecnicasCombate(
    creature,
    catalogoDoTipo("arma", creature),
    habilidades.escolhidas,
  );
  // O Ataque Básico só sobe de grau com Manoplas ou Faixas (autor, 2026-07-27).
  // Sem elas é Desarmado, que não soma nada. Com as duas vale o grau mais alto,
  // e é o grau de CÁLCULO que compara, porque é ele que vira número.
  //
  // ⚠ UM item define o Ataque Básico, e não a soma deles (2026-08-20). O grau
  // sempre foi o maior, e agora o resto do item (encantamento, Fineza) vem do
  // MESMO item, porque somar dois pares de Manoplas empilharia encantamento de
  // duas armas num golpe só. Item sem Ferramenta entra na disputa com rank 0:
  // ele não muda grau nenhum, mas pode receber encantamento do Manejo Especial,
  // que vale para toda arma manejada.
  const pugilato = armasCarregadas
    .filter((e) => e.def?.grupo === "pugilato")
    .sort((x, y) => ((y.fa?.rankCalculo ?? 0) - (x.fa?.rankCalculo ?? 0))
      || ((y.fa ? 1 : 0) - (x.fa ? 1 : 0)))[0] ?? null;
  const grauBasico = pugilato ? grauCalcDaArma(pugilato) : null;
  const acertoGrauBasico = pugilato?.fa?.acertoArma ?? 0;
  // As fontes do Acerto que NÃO são o grau (o encantamento Precisa). Sem elas o
  // hover jogava o bônus todo dentro de "Grau da Ferramenta".
  const fontesAcertoBasico = pugilato?.fa?.fontesAcerto ?? [];
  // O escopo do item, para o efeito de encantamento com `alvoItem` alcançar a
  // linha do Ataque Básico. Sem isto, Potente e Poderosa numas Faixas eram
  // descartados calados e o encantamento ainda cobrava o degrau de grau.
  // ⚠ Só o id: "arma", a categoria e o grupo ficam de fora de propósito, porque
  // o livro diz que Faixas NÃO são armas.
  const escoposBasicoExtra = pugilato?.def?.id ? [pugilato.def.id] : [];
  // Fineza do item que define o golpe (Soco Inglês). A propriedade estava na
  // tabela e não chegava em lugar nenhum: o básico só olhava o canal.
  const finezaBasico = !!pugilato?.def?.props?.fineza;
  const dedicadas = resolveArmasDedicadas(creature, armasParaDano, habilidades.escolhidas);

  const efeitosTodos = [
    ...coletarEfeitosCriatura({
      habilidades, talentos: talentosPre, altoNivel,
      catalogos: {
        habilidades: getHabilidade, talentos: getTalento,
        // Um mapa só para as opções dos dois catálogos: os ids não colidem
        // (prefixo `lut_`/`cmb_`/`res_` contra `tal_`).
        opcoes: { ...OPCAO_ESCOLHA_NOME, ...OPCAO_TALENTO_NOME },
        altoNivel: (id) => getMelhoriaSuperior(id) || getHabilidadeLendaria(id) || getHabilidadeApice(id),
      },
    }).map(aplicarDiretoDaAdaptacao),
    // Direcionados por uma escolha que mora FORA do card da habilidade (a
    // marcação na linha de dano). Mesmo padrão do efeitosDeTreino.
    ...efeitosArmasDedicadas(dedicadas),
    // Funcionamento Básico da técnica: os únicos efeitos ESCRITOS pelo jogador,
    // porque a técnica é única no mundo e nenhum catálogo a cobre. Entram no
    // mesmo bolo, e os filtros de estágio abaixo roteiam pelo canal.
    ...efeitosDaTecnica(creature),
    // Passivos / Características criados pelo jogador usam o mesmo Motor, mas
    // entram na família exclusiva própria dos Feitiços Passivos.
    ...efeitosDosPassivos(creature),
    // Buffs de MESA, escritos na Ficha Final durante o jogo. Mesmo shape do
    // Funcionamento Básico, e por isso entram na mesma linha. Só existem quando
    // a Ficha injeta `buffsSessao`: o criador nunca os vê.
    ...efeitosDaSessao(creature),
    ...efeitosDasAdaptacoes(creature, opcoes.adaptacoes),
    // Habilidade Única da Ferramenta equipada, a primeira das cinco fontes do
    // pool exclusivo a chegar no Motor. Já vem com o valor resolvido no contexto
    // do item (a expressão dela lê `grau`) e com `exclusivo` carimbado.
    ...equip.efeitosUnica,
    // Encantamentos das Ferramentas equipadas. Passaram a entrar pelo Motor em
    // 2026-08-01, no lugar de somarem em escalar: era o teto de sete canais que
    // mantinha metade deles como texto morto. Sem `exclusivo`, porque
    // encantamento soma normal e não é fonte do pool exclusivo.
    ...equip.efeitosEncantamento,
    // O texto ESPECIAL da arma equipada, quando ele é número. Hoje só as
    // Manoplas ("seu dano desarmado aumenta em 1 nível para cada 2 no seu
    // modificador de força"), que estavam sem efeito nenhum até 2026-08-08.
    ...efeitosEspeciaisDeArma(armasCarregadas),
    // Aptidões Amaldiçoadas (2026-07-30). As de bancada leem `au` e `cl`, que
    // são variáveis do contexto principal, então caem todas no estágio 2.
    ...coletarEfeitosAptidao(creatureComAptidoes, semEnergia),
  ];

  // Estágio 0b: os canais que ALIMENTAM o contexto principal. Só nível de
  // aptidão por ora, porque `dom/au/cl/bar/er` são variáveis do DSL e uma
  // habilidade que concede trilha tem de entrar antes de o contexto existir.
  // Mesma regra do estágio de atributo: dentro dele um efeito não vê o irmão.
  const efPreContextoBase = resolverExclusivos(aplicarEfeitos(
    efeitosTodos.filter(ehPreContexto),
    ctxMontante,
  ));

  // A expansão só pode conceder os +2 depois de sabermos quais trilhas já têm
  // ao menos Nível 1 sem ela. Esta primeira resolução não vai para a saída, ela
  // existe apenas para a expansão não habilitar o próprio bônus numa trilha 0.
  const mapasAptidao = (preContexto) => {
    const concedidas = { ...treino.aptidaoTrilha };
    for (const [k, v] of Object.entries(preContexto?.porAlvo?.nivelAptidao || {})) {
      concedidas[k] = (concedidas[k] || 0) + v;
    }
    const limites = {};
    for (const fonte of [efMontante.porAlvo.limiteAptidao, preContexto?.porAlvo?.limiteAptidao]) {
      for (const [k, v] of Object.entries(fonte || {})) limites[k] = (limites[k] || 0) + v;
    }
    return { concedidas, limites };
  };
  const mapasSemDominio = mapasAptidao(efPreContextoBase);
  const aptidaoSemDominio = semEnergia
    ? resolveNiveisAptidao(null, {}, null)
    : resolveNiveisAptidao(
      creature?.aptidoes,
      mapasSemDominio.concedidas,
      mapasSemDominio.limites,
      trilhasOrigem,
    );
  const efPreContextoDominio = resolverExclusivos(aplicarEfeitos(
    efeitosDeAptidaoDoDominio(creature, {
      aptidoesEscolhidas: aptidoesIds,
      niveisAptidao: aptidaoSemDominio.efetivo,
    }),
    ctxMontante,
  ));
  const efPreContexto = mesclarEfeitos(efPreContextoBase, efPreContextoDominio);

  // ---------- LIMITE EFETIVO DE ATRIBUTO (final) ----------
  // Agora sim: limite de estágio 0 (20 / ficha / Origem / Desenvolvimento) mais o
  // canal `limiteAtributo`, que chega de dois lugares. Do `efMontante` vem o
  // Treino de Atributo Completo, e do `efPreContexto` vêm as fontes que dizem
  // "o valor E o limite" (Incremento de Atributo, Quebra de Limites e o
  // Aperfeiçoamento de Atributo).
  const limiteMotorDe = (key) =>
    (efMontante.porAlvo.limiteAtributo?.[key] || 0) + (efPreContexto.porAlvo.limiteAtributo?.[key] || 0);
  // Teto do sistema por atributo: 30 para todo mundo, 32 onde o Aperfeiçoamento
  // de Atributo bateu. É o ÚNICO `furaTeto` do sistema, e ele vale tanto para o
  // limite quanto para o valor (o autor confirmou em 2026-07-29 que a Lendária
  // sobe as DUAS coisas em 2, então num atributo de limite 30 ela leva a 32).
  const tetoSistemaDe = (key) =>
    furaTetoEm(efPreContexto, key) || furaTetoEm(efMontante, key)
      ? ATTR_LIMITE_ABSOLUTO
      : ATTR_LIMITE_MAX;
  const attrLimiteEfetivo = Object.fromEntries(
    ATTR_KEYS.map((k) => [k, Math.min(limiteBaseOf(k) + limiteMotorDe(k), tetoSistemaDe(k))]),
  );

  // Níveis de aptidão por trilha: alocado (pago) + concedido (grátis,
  // direcionado). A concessão vem de dois lados, Treinamento e Habilidade.
  const mapasComDominio = mapasAptidao(efPreContexto);
  // TETO por trilha: 5 mais o canal `limiteAptidao`. Chega dos mesmos dois
  // lugares do nível, porque as regras que quebram o teto emitem os dois canais
  // juntos (as duas Habilidades que dão "+1 podendo passar de 5", e a Expansão
  // de Domínio, que dá +2 em Aura, Controle e Leitura e Energia Reversa).
  // Restringido não tem Nível de Aptidão nenhum: entra com a alocação vazia e
  // sem concessão, para as variáveis `dom/au/cl/bar/er` do DSL saírem zeradas
  // junto. Uma ficha que trocou de Tipo depois de alocar não fica mentindo.
  // Trilhas que a ORIGEM tem: a Maldição não possui Energia Reversa.
  const aptidao = semEnergia
    ? resolveNiveisAptidao(null, {}, null)
    : resolveNiveisAptidao(
      creature?.aptidoes,
      mapasComDominio.concedidas,
      mapasComDominio.limites,
      trilhasOrigem,
    );

  // ---------- Estágio 0c: os canais que leem o Nível de Aptidão ----------
  // Um passe só, e ele existe por um encaixe: `imbuicoesEstilo` precisa da
  // variável `dom`, que o pré-contexto ainda não tem, e precisa estar pronto
  // antes do `resolveEstilos` logo abaixo, que o estágio 2 não alcança.
  // Ver `CANAIS_POS_APTIDAO` em afty-efeitos.js.
  const ctxComAptidao = { ...ctxMontante, ...(aptidao.efetivo ?? {}) };
  /* ⚠ AS DUAS LISTAS. A fonte mais óbvia deste canal é uma Linha de
     Treinamento, e as Linhas entram pelo MONTANTE, não pelo `efeitosTodos`.
     Filtrar só o segundo deixava o Completo do Treino de Novo Estilo das
     Sombras sem efeito nenhum, calado. */
  const efPosAptidao = resolverExclusivos(aplicarEfeitos(
    [...efeitosMontante, ...efeitosTodos].filter(ehPosAptidao),
    ctxComAptidao,
  ));

  // ---------- SIMULAÇÃO DE COMBATE ----------
  // Bancada de balanceamento (autor, 2026-07-28). Vira variável de DSL, e as
  // habilidades com `quando` ligam e desligam sozinhas. Os tetos dependem da
  // ficha, por isso saem daqui e não do módulo de combate.
  // `empolgacaoMaxima` sai do estágio 0b junto do nível de aptidão, e por isso
  // já está resolvido aqui: ele troca a tabela de dados de Empolgação, e a
  // média do dado é o que as Manobras de Empolgação somam.
  const nivelCmb = habilidades.niveisPorEfeito?.combatente ?? 0;
  const nivelRes = habilidades.niveisPorEfeito?.restringido ?? 0;

  // ---------- Expansão de Domínio ----------
  // ⚠ Os efeitos escolhidos entram numa SEGUNDA lista, e não no `efeitosTodos`
  // lá de cima, por ordem de declaração: seus valores saem das tabelas
  // indexadas pelo DOM, e o `aptidao` só existe aqui. O benefício básico dos
  // níveis de Aptidão já entrou no pré-contexto acima.
  const efeitosDominio = semEnergia ? [] : efeitosDoDominio(creature, {
    dom: aptidao.efetivo?.dom ?? 0,
    aptidoesEscolhidas: aptidoesIds,
  });
  const beneficiosRitualDominio = semEnergia
    ? {}
    : beneficiosRitualDoDominio(creature, aptidoesIds);
  // ---------- Novo Estilo da Sombra (Sem Técnica) ----------
  // Entra na mesma SEGUNDA lista do Domínio, e pelo mesmo motivo: as vagas de
  // imbuição no Domínio Simples são o Nível de Aptidão em Domínio, que só existe
  // a partir daqui.
  //
  // ⚠ Os efeitos saem daqui com a quantidade imbuída como VARIÁVEL do DSL, e por
  // isso não dependem do `resolveCombate` lá embaixo: a linha é estática e o
  // valor só é lido quando as expressões rodam, com o contexto já montado.
  const estiloCtx = {
    origemId: core?.origem?.id ?? null,
    nd,
    dom: aptidao.efetivo?.dom ?? 0,
    // Addon com `libera: ["estiloSombras"]` solta a trava de ORIGEM. O piso de
    // Nível 4 continua valendo (autor, 2026-08-21).
    liberado: liberacoes.includes("estiloSombras"),
    // Vagas de imbuição ALÉM do Nível de Aptidão em Domínio. Sai do
    // pré-contexto porque a régua é lida aqui, antes do contexto principal
    // existir. Ver `CANAIS_PRE_CONTEXTO` em afty-efeitos.js.
    imbuicoesExtras: valorCanal(efPosAptidao, "imbuicoesEstilo"),
  };
  const estilo = resolveEstilos(creature, estiloCtx);
  const efeitosEstilo = efeitosDoEstilo(creature, estiloCtx);

  // ---------- Domínio Simples: área e custo em PE ----------
  // ⚠ DEPOIS do `resolveEstilos`, e não antes, porque o custo cresce com as
  // imbuições: o remendo do Addon cobra 1 PE a mais por Técnica imbuída para
  // erguer, e 1 PE por rodada a cada duas para sustentar. `gastoVagas` é a
  // combinação que está no ar AGORA, lida da bancada ou da sessão.
  //
  // A entrada do catálogo vai inteira, e não só o id: ela pode ter sido
  // remendada por um Addon, e é o remendo que traz o modelo de sustentação.
  const dominioSimples = resolveDominioSimples({
    def: getAptidao(DOMINIO_SIMPLES_APTIDAO),
    tem: aptidoesIds.includes(DOMINIO_SIMPLES_APTIDAO),
    dom: aptidao.efetivo?.dom ?? 0,
    imbuicoes: estilo.gastoVagas,
    // Os dois leitores vêm de fora para o módulo não importar `afty-efeitos.js`
    // e fechar um ciclo com o catálogo de Aptidões. Ver o cabeçalho de lá.
    canal: (id) => valorCanal(efPosAptidao, id),
    fontes: (id) => detalhesDoCanal(efPosAptidao, id).map((x) => ({ label: x.nome, valor: x.valor })),
  });
  const efeitosComDominio = (efeitosDominio.length || efeitosEstilo.length)
    ? [...efeitosTodos, ...efeitosDominio, ...efeitosEstilo]
    : efeitosTodos;

  // Resumo pronto para a aba Habilidades: cada expansão com os números que o
  // card mostra. A UI não recalcula nada, ela só exibe.
  const resumoDominios = (() => {
    const domNivel = aptidao.efetivo?.dom ?? 0;
    const barNivel = aptidao.efetivo?.bar ?? 0;
    const paredesResistentes = aptidoesIds.includes("paredes_resistentes");
    /* ⚠ OS SEIS SAEM DO PASSE PÓS-APTIDÃO, e não do `canal()` do estágio
       principal, que só nasce umas 300 linhas abaixo daqui. É o mesmo passe do
       `imbuicoesEstilo`, e pelo mesmo motivo: eles dependem de `dom` e `bar` e
       precisam estar prontos antes deste resumo. Ver CANAIS_POS_APTIDAO. */
    const canalDominio = (id) => valorCanal(efPosAptidao, id);
    const bonusArea = canalDominio("areaDominio");
    const bonusPvParede = canalDominio("pvParede");
    const bonusEfeitos = canalDominio("efeitosDominio");
    const lista = listaDominios(creature).map((d) => {
      const versao = resolveVersaoDominio(d, aptidoesIds);
      const comAG = !!d.acertoGarantido?.ativo;
      return {
        ...d,
        versao,
        custo: custoDominio(versao, comAG),
        duracao: duracaoDominio(domNivel, versao),
        area: areaDominio(versao, bt, false, bonusArea),
        pvBarreira: pvBarreira(barNivel, nd, paredesResistentes, bonusPvParede),
        vagasUsadas: vagasUsadas(d.efeitos),
        texto: textoDoDominio(d, {
          dom: domNivel, nd, bt, bar: barNivel, versao, paredesResistentes,
          bonusArea, bonusPvParede,
        }),
      };
    });
    /* A BARREIRA da aptidão Técnicas de Barreira, que é irmã do domo e nunca teve
       tela: PV e RD de CADA parede, e quantas cabem. O domo continua valendo
       `PAREDES_NO_DOMO × pvDaParede`, então melhorar a parede melhora os dois. */
    const pvUnidade = pvDaParede(barNivel, nd, paredesResistentes, bonusPvParede);
    const partesPvParede = [
      { label: paredesResistentes ? "Base (Paredes Resistentes)" : "Base", valor: 5 + (paredesResistentes ? 5 : 0) },
      { label: paredesResistentes
        ? "Nível de Aptidão em Barreira × ND"
        : "Nível de Aptidão em Barreira × metade do ND",
        valor: paredesResistentes ? barNivel * nd : barNivel * Math.floor(nd / 2) },
      ...detalhesDoCanal(efPosAptidao, "pvParede").map((x) => ({ label: x.nome, valor: x.valor })),
    ];
    const barreira = {
      pvParede: pvUnidade,
      rdParede: rdDaParede(canalDominio("rdParede")),
      maxParedes: maxParedes(canalDominio("maxParedes")),
      /* ⚠ A CORTINA vale 3 paredes (autor, 2026-08-26). Ela é aptidão própria e
         não tinha número nenhum: o texto dela diz o custo e a área, e nunca a
         vida. Só aparece para quem tem a aptidão. */
      pvCortina: pvCortina(barNivel, nd, paredesResistentes, bonusPvParede),
      temCortina: aptidoesIds.includes("cortina"),
      /* ⚠ A aptidão é o que faz a Barreira EXISTIR. Sem ela os números acima
         valem, mas não há o que erguer, e a tela não mostra o card. */
      tem: aptidoesIds.includes("tecnicas_de_barreira"),
      partesPvParede,
      /* A Cortina é três paredes, então o hover dela é o da parede com a
         multiplicação no fim, e não uma conta paralela. */
      partesPvCortina: [
        ...partesPvParede,
        { label: `× ${PAREDES_NA_CORTINA} paredes`, texto: `× ${PAREDES_NA_CORTINA}` },
      ],
      partesRdParede: detalhesDoCanal(efPosAptidao, "rdParede").map((x) => ({ label: x.nome, valor: x.valor })),
      partesMaxParedes: [
        { label: "Técnicas de Barreira", valor: PAREDES_BASE },
        ...detalhesDoCanal(efPosAptidao, "maxParedes").map((x) => ({ label: x.nome, valor: x.valor })),
      ],
    };
    /* O CONFLITO DE DOMÍNIO (autor, 2026-08-26). Ele é da CRIATURA e não de cada
       expansão, então mora no resumo: quem confronta é o feiticeiro, e o número
       existe desde que ele tenha Nível de Aptidão em Domínio. */
    const conflitoBase = conflitoDeDominio({
      dom: domNivel, nd, bonus: canalDominio("conflitoDominio"),
    });
    const conflito = {
      ...conflitoBase,
      partes: [
        ...conflitoBase.partes,
        ...detalhesDoCanal(efPosAptidao, "conflitoDominio").map((x) => ({ label: x.nome, valor: x.valor })),
      ],
    };
    return {
      domNivel,
      barNivel,
      paredesResistentes,
      temAcertoGarantido: aptidoesIds.includes("acerto_garantido"),
      maxEfeitos: maxEfeitos(domNivel, bonusEfeitos),
      ativoId: dominioEmUso(creature, aptidoesIds)?.id ?? null,
      beneficiosRitualAtivos: beneficiosRitualDominio,
      barreira,
      conflito,
      lista,
    };
  })();

  const estadosConjurador = estadosCombateConjurador({
    habilidades: habilidades.escolhidas,
    tecnicas: tecnicasCombate,
    armas: armasParaDano,
    feiticos: creature?.feiticos,
  });
  const estadosAptidoes = estadosCombateAptidoes({
    aptidoesIds,
    au: aptidao.efetivo?.au ?? 0,
    cl: aptidao.efetivo?.cl ?? 0,
  });
  const combate = resolveCombate(creature, {
    dominios: resumoDominios.lista,
    brutalidadePE: degrausBrutalidade({ habilidades }),
    brutalidadePilha: bt,
    empolgacaoMaxima: valorCanal(efPreContexto, "empolgacaoMaxima") > 0,
    devastacaoPilha: bt,
    precisaoPE: 1 + Math.floor(nivelCmb / 4),
    pistoleiroEmperrar: habilidades.escolhidas.includes("cmb_pistoleiro_avancado") ? 6 : 2,
    adrenalinaAtletismo: habilidades.escolhidas.includes("res_restricao_definitiva") ? 8 : 4,
    cacadorFeiticeiros: 1 + Math.floor(nivelRes / 5),
    corpoDeAco: 1 + (nivelRes >= 10 ? 1 : 0) + (nivelRes >= 15 ? 1 : 0),
    // Tetos das faixas das Aptidões: os dois dependem do Nível de Aptidão em
    // Controle e Leitura, que só existe depois do resolveNiveisAptidao.
    cobrirSePE: 2 + 2 * (aptidao.efetivo?.cl ?? 0),
    estimuloTeste: aptidao.efetivo?.cl ?? 0,
    // A Cura Amplificada troca "1 + metade do nível" por "1 + o nível", e a Cura
    // em Grupo soma +2 no teto ("a quantidade máxima de pontos que podem ser
    // gastos aumenta em 2"). Confirmado pelo AppScript do autor (2026-07-30).
    fluxoPER: (() => {
      const er = aptidao.efetivo?.er ?? 0;
      return 1 + (aptidoesIds.includes("cura_amplificada") ? er : Math.floor(er / 2))
        + (aptidoesIds.includes("cura_em_grupo") ? 2 : 0);
    })(),
    // Regeneração Corporal (Maldição): "a quantidade máxima de pontos que podem
    // ser gastos passa a ser igual ao seu bônus de treinamento por rodada", que
    // a Regeneração Ampliada dobra. Irmão do fluxoPER, com PE no lugar de PER.
    regeneracaoPE: aptidoesIds.includes("mal_regeneracao_ampliada") ? 2 * bt : bt,
    // Interruptores que vêm da FICHA, e não do catálogo de estados, porque são
    // instâncias: uma por Habilidade Única ativa, e uma por Técnica de Estilo
    // que precisa de gatilho (toda Modificação de Domínio Simples, mais a
    // Técnica Especial com linha ativa).
    estadosExtras: [...equip.estadosUnica, ...estilo.estados, ...estadosConjurador, ...estadosAptidoes],
  });
  const auxiliaresAtivos = resolveAuxiliaresAtivos(creature, combate, estadosConjurador, {
    nd,
    habilidades: habilidades.escolhidas,
  });
  const aurasDesabilitadas = new Set(aptidoesAuraDesabilitadas(
    {
      ...creature,
      aptidoes: { ...creature?.aptidoes, au: aptidao.efetivo?.au ?? 0 },
      combate: { ...creature?.combate, concentrarAura: combate.concentrarAura },
    },
    aptidoesIds,
  ));
  const efeitosAtivos = [
    ...efeitosComDominio.filter((e) => !aurasDesabilitadas.has(e.origem)),
    ...efeitosCombateAmaldicoado(tecnicasCombate, combate, habilidades.escolhidas, bt),
    ...auxiliaresAtivos.efeitos,
  ];
  // Expressões que leem `dados_dano_final` só podem ser avaliadas quando cada
  // linha de dano já sabe quantos dados vai rolar. Elas não entram no agregado
  // geral e viajam cruas até o calculador de Feitiços.
  const efeitosLinhaDano = efeitosAtivos.filter(efeitoUsaDadosDanoFinal);

  /* MARCAS da ficha, para o `contar()` do DSL (Addons fase 0, 8.1 do
     docs/afty-addons.md). Sai das MESMAS três listas que alimentam o `tem_*`
     logo abaixo, então o que a criatura "tem" é a mesma coisa nas duas.
     Montado UMA vez: o `montarCtx` roda três vezes (os estágios do motor) e o
     conjunto de entradas não muda entre eles. */
  /* ⚠ As marcas DECLARADAS pelos addons entram todas, mesmo valendo zero, e só
     depois vêm as que a criatura realmente tem. Sem isto, uma marca que o addon
     declara mas a ficha ainda não usa simplesmente NÃO APARECERIA no seletor
     `{ }`, e não haveria como escrever a expressão dela antes de pegar a
     primeira habilidade. É a mesma política já documentada para o `tem_*`: a
     família grande mostra o que não é zero, mas o que é zero continua alcançável.
     A ordem importa, porque o `marcasDeEntradas` abaixo sobrescreve com a
     contagem de verdade. */
  const marcasFicha = Object.assign(
    Object.fromEntries(marcasDeclaradas().map((m) => [m.marca, 0])),
    marcasDeEntradas([
    ...habilidades.escolhidas.map((id) => {
      const h = getHabilidade(id);
      return h && { tags: h.tags, familia: "habilidade", especializacaoId: h.especializacaoId };
    }),
    ...(talentosPre.escolhidas ?? []).map((id) => {
      const t = getTalento(id);
      return t && { tags: t.tags, familia: "talento" };
    }),
    ...aptidoesIds.map((id) => {
      const a = getAptidao(id);
      return a && { tags: a.tags, familia: "aptidao" };
    }),
  ]),
  );

  const montarCtx = (attrs, mods) => buildCriaturaDslContext({
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual: almaAtualDsl,
    irmaoMorto: !!creature?.core?.origem?.irmaoMorto,
    iniciativaIrmao: creature?.core?.origem?.iniciativaIrmao,
    attrEff: attrs, mods, modTecnica: mods[tecnicaAttr] ?? 0, tecnicaAttr,
    aptidao: aptidao.efetivo, nivelEspec, periciasProf: creature?.pericias,
    resistenciasProf: creature?.resistenciasProf, combate,
    aptidaoOpcoes: semEnergia ? {} : creature?.aptidaoOpcoes,
    rdEscudoBase: equip.rdEscudoBase,
    fontesTreinoEscudo: treinoEscudo.fontes,
    // `tem_*` inclui Talentos e Aptidões escolhidos, não só as Habilidades.
    // ⚠ A lista de aptidões respeita o `semEnergia`: um Restringido não tem
    // Aptidões, e `tem_*` não pode dizer que tem.
    habilidadesEscolhidas: [
      ...habilidades.escolhidas,
      ...(talentosPre.escolhidas ?? []),
      ...aptidoesIds,
    ],
    vocabulario: vocabularioDsl,
    marcas: marcasFicha,
  });
  // Soma um canal de atributo sobre uma base, aparando nos TRÊS tetos do sistema
  // (ver o topo de afty-atributos.js).
  //
  // ⚠ ATÉ 2026-07-29 ISTO APARAVA EM 30, e não no limite do atributo. Era o bug
  // que deixava 36 efeitos do Motor mais o Treino de Atributo furarem o 20
  // calados. O limite do atributo é o teto normal, o 30 é o do sistema, e só o
  // Aperfeiçoamento de Atributo (`furaTeto`) chega ao 32.
  //
  // O acessório de atributo entra pela `folgaEquip`: o texto dele diz "podendo
  // superar o seu limite de atributo, até o máximo de 30", então ele levanta o
  // teto DAQUELE atributo pelo tanto que já contribuiu, sem levantar o do Motor.
  //
  // ⚠ O teto NUNCA DERRUBA o que já estava acima dele: como esta função roda
  // duas vezes (permanente e depois temporário), aparar cru no segundo passo
  // desfaria um furaTeto legítimo do primeiro. O que o teto impede é SUBIR além
  // dele, não estar além dele.
  // ⚠ NÃO há caminho separado para o `furaTeto` (revisto em 2026-07-29). Ele
  // deixou de ser "esta parcela fura o teto" e passou a ser "o teto DESTE
  // atributo é 32", porque o Aperfeiçoamento sobe o limite junto do valor. Com o
  // limite subindo, a parcela cabe pelo caminho normal, e a carona que a versão
  // anterior evitava virou o comportamento certo: quem levanta o limite levanta
  // para toda fonte, igual ao Incremento de Atributo e à Quebra de Limites.
  const somarAtributo = (partida, res) => {
    const out = {};
    for (const k of Object.keys(partida)) {
      const total = valorCanal(res, "atributo", k);
      const teto = Math.min(attrLimiteEfetivo[k] + (folgaEquip[k] || 0), tetoSistemaDe(k));
      out[k] = Math.min(partida[k] + total, Math.max(teto, partida[k]));
      perdaNoLimite[k] = (perdaNoLimite[k] || 0) + (partida[k] + total - out[k]);
    }
    return out;
  };

  // Estágio 1a: atributo PERMANENTE, lendo o BASE. Dentro deste estágio um
  // efeito de atributo não vê o irmão, o que evita o laço A→B→A. O Treino de
  // Atributo (estágio 0) entra aqui junto, porque também é permanente.
  const efAttrPerm = resolverExclusivos(mesclarEfeitos(
    { porAlvo: { atributo: efMontante.porAlvo.atributo || {} } },
    aplicarEfeitos(efeitosAtivos.filter(ehAtributoPermanente), montarCtx(attrBase, modBase)),
  ));
  // Este é o atributo que os PRÉ-REQUISITOS enxergam.
  const attrPermanente = somarAtributo(attrBase, efAttrPerm);
  const modPermanente = Object.fromEntries(Object.entries(attrPermanente).map(([k, v]) => [k, mod(v)]));

  // Talentos de novo, agora com o atributo permanente: só o `inacessiveis` muda.
  const talentos = resolveTalentos(creature, {
    nd, maestria: bt, attrEff: attrPermanente, origemId, origensQualificadas: origensQuali,
    especializacoes: especializacoes.escolhidas, aptidoes: aptidoesIds,
    concedidos: concedido.talentos,
  });

  // Estágio 1b: atributo TEMPORÁRIO, por cima do permanente. Resulta no
  // atributo FINAL, que é o que a ficha mostra e o que os stats usam.
  // ⚠ O `efAttrPerm.aplicado` viaja para cá porque `atributo` é o ÚNICO canal que
  // o motor resolve em dois estágios. Sem ele, uma Habilidade Única permanente de
  // +6 de Força e um Feitiço Auxiliar temporário de +4 na mesma Força somariam
  // 10, quando a regra do pool exclusivo manda ficar com 6.
  const efAttrTemp = resolverExclusivos(
    aplicarEfeitos(
      efeitosAtivos.filter(ehAtributoTemporario),
      montarCtx(attrPermanente, modPermanente),
    ),
    efAttrPerm.aplicado,
  );
  const attrEff = somarAtributo(attrPermanente, efAttrTemp);
  const modFor = mod(attrEff.forca);
  const modDes = mod(attrEff.destreza);
  const modCon = mod(attrEff.constituicao);
  const modInt = mod(attrEff.inteligencia);
  const modSab = mod(attrEff.sabedoria);
  const modPre = mod(attrEff.presenca);
  const modByAttr = { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre };
  const modTecnica = modByAttr[tecnicaAttr] ?? 0;
  const maxForDex = Math.max(modFor, modDes);                       // Z8:Z9
  const maxAllMods = Math.max(modFor, modDes, modCon, modInt, modSab, modPre); // Z8:Z13
  // A carga desceu para DEPOIS do agregado de efeitos (`ef`), logo abaixo: o
  // canal `espacosCarga` sobe o limite, e ele só existe com tudo mesclado.

  // Estágio 2: todo o resto, com o contexto REMONTADO nos atributos finais. É
  // aqui que "Defesa igual ao Mod. Força" enxerga a Força 20.
  // `efMontante` entra inteiro no agregado para os `detalhes` da UI mostrarem a
  // linha de treino como origem. O canal de atributo dele já foi consumido no
  // estágio 1a, então sai daqui para não somar duas vezes.
  const efMontanteSemAtributo = { ...efMontante, porAlvo: { ...efMontante.porAlvo } };
  delete efMontanteSemAtributo.porAlvo.atributo;
  // Os quatro primeiros já voltaram do `resolverExclusivos` com a lista vazia e
  // os vencedores somados, então a disputa que sobra aqui é só a do estágio 2. E
  // ela não precisa do `aplicado` dos estágios anteriores: `atributo` é o único
  // canal que roda antes daqui, e o filtro `ehEstagio2` justamente o exclui.
  const efSemCrescimento = resolverExclusivos(mesclarEfeitos(
    efMontanteSemAtributo, efPreContexto, efAttrPerm, efAttrTemp,
    aplicarEfeitos(efeitosAtivos.filter(ehEstagio2), montarCtx(attrEff, modByAttr)),
  ));

  // Crescimento Corporal é a única Aptidão que pode aparecer duas vezes e cada
  // aquisição escolhe o sentido da mudança. O efeito-base dela guarda somente
  // os PV (uma vez); os degraus são produzidos aqui, um por aquisição.
  //
  // O aumento próprio desta Aptidão para em Enorme (+2), conforme o texto. Esse
  // teto é calculado SÓ sobre os passos da Aptidão; outras fontes de tamanho
  // continuam somando depois. Assim uma passiva +1 não é absorvida pelo teto e
  // pode levar uma criatura Enorme por Crescimento Corporal a Colossal.
  const crescimentoId = "mal_crescimento_corporal";
  const crescimentoVezes = semEnergia ? 0 : (creature?.aptidoesAmaldicoadas ?? [])
    .filter((id) => id === crescimentoId).length;
  const crescimentoOpcoes = creature?.aptidaoOpcoesRepetidas?.[crescimentoId] ?? [];
  let passoComCrescimento = 0;
  const efeitosCrescimento = [];
  for (let indice = 0; indice < crescimentoVezes; indice++) {
    const direcao = crescimentoOpcoes[indice] === "diminuir" ? "diminuir" : "aumentar";
    const podeAplicar = direcao === "diminuir" ? passoComCrescimento > -2 : passoComCrescimento < 2;
    if (!podeAplicar) continue;
    const valor = direcao === "diminuir" ? -1 : 1;
    passoComCrescimento += valor;
    efeitosCrescimento.push({
      canal: "tamanho",
      expr: String(valor),
      origem: crescimentoId,
      nome: `Crescimento Corporal (${indice + 1}ª aquisição: ${direcao === "diminuir" ? "Diminuir" : "Aumentar"})`,
    });
  }
  const efSemTamanho = efeitosCrescimento.length
    ? mesclarEfeitos(
      efSemCrescimento,
      aplicarEfeitos(efeitosCrescimento, montarCtx(attrEff, modByAttr)),
    )
    : efSemCrescimento;

  // ---------- Tamanho (autor, 2026-08-08) ----------
  // A criatura parte de Médio e SÓ o Motor a tira de lá: tamanho não é escolha
  // de ficha, é consequência de uma Aptidão ou poder que diga que o corpo mudou.
  //
  // ⚠ TERCEIRA LISTA de efeitos, pelo mesmo motivo do Domínio e do Estilo: a
  // régua de Atletismo e Furtividade DEPENDE do tamanho, e o tamanho depende do
  // canal `tamanho`, que só fecha com o estágio 2 pronto. Resolver o tamanho
  // primeiro e mesclar a régua depois quebra o laço, e é seguro porque a régua
  // escreve num canal (`bonusPericia`) que nada do `tamanho` lê de volta.
  //
  // Entram como EFEITO, e não como número somado à mão, para o hover de fontes
  // mostrar "Colossal −10" na linha da Furtividade em vez de um −10 sem dono.
  const degrausTamanho = Math.trunc(valorCanal(efSemTamanho, "tamanho"));
  const tamanho = tamanhoPorDegraus(degrausTamanho);
  const efeitosTamanho = [];
  for (const pericia of ["atletismo", "furtividade"]) {
    if (!tamanho[pericia]) continue;
    efeitosTamanho.push({
      canal: "bonusPericia", alvo: pericia, expr: String(tamanho[pericia]),
      origem: "tamanho", nome: tamanho.label,
    });
  }
  const efSemGuarda = efeitosTamanho.length
    ? mesclarEfeitos(efSemTamanho, aplicarEfeitos(efeitosTamanho, montarCtx(attrEff, modByAttr)))
    : efSemTamanho;

  /* ---------- GUARDA INABALÁVEL (Calamidade e Beyond) ----------
     ⚠ QUARTA LISTA de efeitos, pelo mesmo motivo das três de cima (Domínio,
     Estilo e Tamanho): o bônus da Guarda SOMA na Defesa e nos cinco TRs, e ele
     mesmo sai de dois canais (`guardaBonus` e `guardaVida`) que só fecham com o
     estágio 2 pronto. Ler os canais e depois mesclar o resultado quebra o laço.

     Entra como EFEITO, e não como número somado à mão na fórmula da Defesa, por
     três motivos que valem os cinco TRs de uma vez:
       • o hover de fontes mostra "Guarda Inabalável +5" com dono, em vez de um
         +5 órfão no meio da conta;
       • o TR ROLADO na aba de Perícias já sai certo, porque `resolveTestes`
         recebe este mesmo `ef`;
       • um `bonusTR` sem `alvo` vale para os cinco (ver `valorCanalEscopos`),
         então "aumento em TRs" não vira lista de cinco escrita à mão.

     ⚠ O CORRENTE vem da SESSÃO, pelo `opcoes.guarda`, e não da ficha: quantos
     golpes já foram desgastados, se um Raio Negro a encerrou e quanta Vida
     Temporária resta são estado de mesa. Sem sessão (o criador, o Preview) a
     Guarda aparece com o TETO e sem bônus aplicado, que é a criatura em
     repouso: fora de combate não há guarda erguida. */
  const guardaBonusBase = patamar === "calamidade" ? 5 : patamar === "beyond" ? 10 : 0;
  const guardaVidaBase = patamar === "calamidade" ? 5 * nd : patamar === "beyond" ? 10 * nd : 0;
  const guardaBonusMax = Math.max(0, guardaBonusBase + valorCanal(efSemGuarda, "guardaBonus"));
  const guardaVidaMax = Math.max(0, guardaVidaBase + valorCanal(efSemGuarda, "guardaVida"));
  const guarda = (() => {
    const ses = opcoes.guarda ?? {};
    const inteiroNaoNeg = (v) => Math.max(0, Math.trunc(Number(v)) || 0);
    const golpes = inteiroNaoNeg(ses.golpes);
    const vida = inteiroNaoNeg(ses.vida);
    const PASSO = 2;   // "reduzido em 2 a cada ataque ou habilidade que ele sofra"
    if (guardaBonusBase <= 0) {
      return {
        ativa: false, noAr: false, bonus: 0, bonusMax: 0,
        vida: 0, vidaMax: 0, golpes: 0, passoPorGolpe: PASSO, motivo: null,
      };
    }
    /* ⚠ O BÔNUS ZERADO PELOS GOLPES TAMBÉM QUEBRA (autor, 2026-08-26, segunda
       passada), e quebrar leva o PV Temporário junto. Antes eu havia tratado o
       desgaste como coisa separada da quebra, e é a mesma: moer o bônus até zero
       é o caminho normal de derrubar a Guarda, e é o que faz a característica
       "exigir trabalho em equipe". Dá 3 golpes no Calamidade e 5 no Beyond.

       A ordem dos motivos é a de quem chegou primeiro no caso comum, e ela põe
       os golpes ANTES da Vida de propósito: quando são eles que quebram, a Vida
       é destruída junto, e nomear "Vida Temporária" ali contaria a consequência
       em vez da causa.

       Sem sessão nenhuma a Vida é zero e a Guarda sai fora do ar, que é o certo:
       ela é erguida no início da rodada, e não na ficha. */
    const moido = PASSO * golpes >= guardaBonusMax;
    const motivo = ses.condicao ? String(ses.condicao)
      : ses.encerrada ? "Raio Negro"
      : moido ? "Bônus Zerado"
      : vida <= 0 ? "Vida Temporária" : null;
    return {
      ativa: true,
      noAr: motivo == null,
      /* A escada da planilha, indexada pelo contador de golpes: 5, 3, 1, 0 no
         Calamidade e 10, 8, 6, 4, 2, 0 no Beyond. ⚠ Os números NÃO mudaram com a
         regra nova: o degrau em que a escada chega a zero é justamente o degrau
         em que a Guarda quebra, então o `max(0, ...)` e a quebra dão o mesmo. */
      bonus: motivo == null ? Math.max(0, guardaBonusMax - PASSO * golpes) : 0,
      bonusMax: guardaBonusMax,
      vida, vidaMax: guardaVidaMax,
      golpes, passoPorGolpe: PASSO, motivo,
    };
  })();
  const efeitosGuarda = guarda.bonus > 0
    ? [
      { canal: "defesa", expr: String(guarda.bonus), origem: "guarda", nome: "Guarda Inabalável" },
      // Sem `alvo`: `valorCanalEscopos` soma o `porCanal` em todo escopo, então
      // um efeito só cobre Reflexos, Fortitude, Vontade, Astúcia e Integridade.
      { canal: "bonusTR", expr: String(guarda.bonus), origem: "guarda", nome: "Guarda Inabalável" },
    ]
    : [];
  const ef = efeitosGuarda.length
    ? mesclarEfeitos(efSemGuarda, aplicarEfeitos(efeitosGuarda, montarCtx(attrEff, modByAttr)))
    : efSemGuarda;
  const canal = (id, alvo = null) => valorCanal(ef, id, alvo);

  // Funcionamento Básico da técnica, RESOLVIDO linha a linha, só para o editor
  // mostrar quanto cada expressão vale enquanto o jogador digita. É reavaliação,
  // não segunda aplicação: quem entra na conta é o `efeitosTodos` acima. Roda com
  // o contexto FINAL, então uma expressão que lê `mod_forca` vê a Força fechada.
  const ctxTecnica = montarCtx(attrEff, modByAttr);
  // A Habilidade Unica da Ferramenta precisa mostrar o mesmo valor que entra no
  // Motor. O equipamento e carregado antes de os atributos fecharem, mas a
  // expressao permanece viva e e reavaliada aqui com o contexto FINAL. As
  // variaveis proprias do item, como `grau`, continuam sobrescrevendo as da
  // criatura somente para aquela expressao.
  const equipFinal = {
    ...equip,
    efeitosUnica: equip.efeitosUnica.map((efeito) => ({
      ...efeito,
      valor: efeitoUsaDadosDanoFinal(efeito)
        ? null
        : evalNumberDsl(
          efeito.expr,
          { ...ctxTecnica, ...(efeito.contextoDsl || {}) },
          0,
        ),
    })),
    entradas: equip.entradas.map((entrada) => {
      if (!entrada.fa) return entrada;
      return {
        ...entrada,
        fa: {
          ...entrada.fa,
          habilidadeEfeitos: entrada.fa.habilidadeEfeitos.map((efeito) => ({
            ...efeito,
            valor: efeitoUsaDadosDanoFinal(efeito)
              ? null
              : evalNumberDsl(
                efeito.expr,
                { ...ctxTecnica, ...(efeito.contextoDsl || {}) },
                0,
              ),
          })),
        },
      };
    }),
  };
  const resolverEfeitosEditaveis = (lista) => (Array.isArray(lista) ? lista : [])
    .map((e) => {
      const def = EFEITO_CANAIS.find((c) => c.id === e?.canal) || null;
      const expr = String(e?.expr ?? "").trim();
      const valorTardio = efeitoUsaDadosDanoFinal(e);
      const condicaoTardia = efeitoUsaDadosDanoFinal({ expr: e?.quando });
      return {
        canal: e?.canal ?? "", alvo: normalizarAlvoEfeito(e?.alvo) ?? "", expr,
        quando: e?.quando ?? "", duracao: e?.duracao ?? "permanente",
        // `modo` só existe nas fontes do pool exclusivo que decidem por LINHA
        // se o efeito é passivo ou de bancada (Habilidade Única, Técnica de
        // Estilo Especial). Quem não usa nunca o grava, e ele fica ausente.
        ...(e?.modo ? { modo: e.modo } : {}),
        // `alvoTipo` diz à UI qual vocabulário oferecer (atributo, perícia, tr...).
        alvoTipo: def?.alvo ?? null,
        nota: def?.nota ?? null,
        valor: expr ? (valorTardio ? null : evalNumberDsl(expr, ctxTecnica, 0)) : 0,
        ativo: !e?.quando || condicaoTardia || evalNumberDsl(String(e.quando), ctxTecnica, 0) !== 0,
      };
    });
  const tecnicaEfeitos = resolverEfeitosEditaveis(creature?.core?.tecnicaEfeitos);
  // Um mapa por Funcionamento Básico ADICIONAL, no mesmo formato do principal:
  // cada editor precisa ver o valor e o estado das linhas dele. O principal fica
  // de fora do mapa porque já tem o `tecnicaEfeitos` acima, que meia dúzia de
  // telas lê pelo nome.
  const funcionamentoEfeitos = Object.fromEntries(
    funcionamentosDaFicha(creature)
      .filter((fb) => !fb.principal)
      .map((fb) => [fb.id, resolverEfeitosEditaveis(fb.efeitos)]),
  );
  const passivosEfeitos = Object.fromEntries(
    (Array.isArray(creature?.feiticos) ? creature.feiticos : [])
      .filter((f) => f?.tipo === "passivo")
      .map((f) => [f.id, resolverEfeitosEditaveis(f.efeitosPassivo)]),
  );
  // Um mapa por Técnica de Estilo ESPECIAL, no mesmo formato: o editor do Motor
  // mostra o valor e o estado de cada linha escrita à mão. As de tabela não
  // entram, porque a expressão delas é do catálogo e não é editável.
  const estiloEfeitos = Object.fromEntries(
    estilo.conhecidas
      .filter((t) => t.tipo === "especial")
      .map((t) => [t.id, resolverEfeitosEditaveis(t.efeitos)]),
  );

  // Alma: o teto (100 + Melhoria de Alma) e o multiplicador de PV. Sai aqui, e
  // não lá em cima, porque o canal `almaMax` só existe com os efeitos mesclados.
  //
  // ⚠ NO CRIADOR os dois são o MESMO número, porque a criatura é montada íntegra
  // (o campo de Integridade saiu do formulário em 2026-07-29). EM JOGO não: a
  // fórmula do autor é `HP × (Alma.Atual / 100)`, então uma criatura com a alma
  // em 60 tem 60% do PV máximo, e o número grande da Ficha tem de cair junto. A
  // Ficha Final passa `opcoes.almaAtual`, e sem ele nada muda para o criador.
  const almaMax = almaMaxBase + canal("almaMax");
  const almaMult = (opcoes.almaAtual != null ? almaAtualDsl : almaMax) / 100;

  // Carga: mod de Força já fechado (acessório + efeitos) e o limite já somado do
  // canal `espacosCarga` (Otimização de Espaço, Suporte 2°).
  const carga = resolveCarga(equip.espacosUsados, modFor, canal("espacosCarga"));

  // ---------- HP (+ Treino de Resistência) ----------
  const hpBase =
    tipo === "combatente" ? 12 + (nd - 1) * 6 :
    tipo === "restringido" ? 12 * nd :
    /* misto | conjurador */ 10 + (nd - 1) * 5;
  const hpPatamarMult = HP_PATAMAR_MULT[patamar] ?? 1;
  /* Qual atributo entra no PV. Constituição por padrão, e o canal `hpAtributo`
     TROCA (Addons fase 0, 8.2 do docs/afty-addons.md).

     ⚠ SUBSTITUIÇÃO, e não soma, e vale o MAIOR entre a Constituição e os
     concedidos: é o mesmo desenho do `defesaAtributo`, decidido em 2026-08-08,
     e pelo mesmo motivo. Somar pelo canal `hp` daria o mesmo número e mentiria
     no hover, com "Constituição × ND" e a fonte nova lado a lado se lendo como
     dois atributos somados. E o texto de quem troca sempre diz "você pode
     optar", então ninguém opta por piorar o próprio PV. */
  const atributosHp = ATTR_KEYS.filter((k) => valorCanal(ef, "hpAtributo", k) > 0);
  const attrHp = [...atributosHp, "constituicao"]
    .reduce((melhor, k) => ((modByAttr[k] ?? 0) > (modByAttr[melhor] ?? 0) ? k : melhor), "constituicao");
  const modHp = modByAttr[attrHp] ?? 0;
  // O bônus de item ("os seus pontos de vida máximos aumentam em 10") entra
  // ANTES da Alma e do Patamar (autor, 2026-08-01), junto do treino e do canal
  // `hp` do Motor. Num Beyond, um item de +10 vale 40.
  const hp = Math.round(almaMult * (hpBase + nd * modHp + canal("hp") + equip.hpMaxBonus) * hpPatamarMult);

  // ---------- PE (+ Treinos de Compreensão/Controle de Energia/…) ----------
  // UMA pilha só, para todo mundo. O Restringido a chama de Ponto de Estamina
  // (ou vigor) e os outros de Ponto de Energia, mas a abreviação é PE nos dois
  // casos e a conta é a mesma. Por isso a base do Restringido bate na régua com
  // o texto de Restrito pelos Céus: "você inicia com 4 pontos de estamina, e
  // recebe mais 4 a cada nível" = 4 × ND, igual à do Combatente. A habilidade
  // NÃO soma esses 4 × ND de novo (ver res_restrito_pelos_ceus).
  const peBase =
    tipo === "conjurador" ? 6 * nd :
    tipo === "misto" ? 5 * nd :
    /* combatente | restringido */ 4 * nd;
  // A Quantidade de PE mede a energia amaldiçoada com que se nasce, e o
  // Restringido não tem nenhuma: o seletor some do formulário e a parcela é 0.
  const peQnt = semEnergia ? 0 :
    qntPE === "muito_pouca" ? -nd :
    qntPE === "pouca" ? -Math.floor(nd / 2) :
    qntPE === "grande" ? Math.floor(nd / 2) :
    qntPE === "muito_grande" ? nd : 0;
  const pe = peBase + peQnt + modTecnica + canal("pe");

  // ---------- Resistência Parcial ----------
  // Calamidade ganha +1 em ND 10, 20 e 30 (0 a 3).
  // Beyond ganha +1 em ND 1, 10, 20 e 30 (1 a 4) — o limiar de ND 1 é sempre
  // atendido, já que nd tem piso 1, então entra como constante.
  // Comum e Desafio não têm Resistência Parcial.
  const resThresh = (nd >= 10 ? 1 : 0) + (nd >= 20 ? 1 : 0) + (nd >= 30 ? 1 : 0);
  const resParcial =
    patamar === "calamidade" ? resThresh :
    patamar === "beyond" ? 1 + resThresh : 0;


  // ---------- Movimento (+ Treino de Agilidade, - sobrecarga) ----------
  const movimentoBase = 9 + maxForDex * 1.5 + carga.movimento + canal("movimento");
  const movimentoMult = Math.max(1, canal("movimentoMult") || 1);
  const movimento = movimentoBase * movimentoMult;

  // ---------- RD Geral ----------
  const rdGeralBase =
    tipo === "conjurador" ? (nd >= 10 ? Math.floor(nd / 2) : 0) :
    tipo === "misto" ? (nd >= 10 ? nd : Math.floor(nd / 2)) :
    /* combatente | restringido */ (nd >= 10 ? maxAllMods : 0) + nd;
  const rdGeral = rdGeralBase + equip.rdGeralBonus + canal("rdGeral");

  // ---------- RD Específico ----------
  const rdEspecifico =
    tipo === "conjurador" ? modTecnica :
    tipo === "misto" ? (nd >= 10 ? 2 * modTecnica : modTecnica) : 0;

  // ---------- RD a Alma ----------
  // A RD Geral vale para todo tipo de dano EXCETO alma, então o Dano na Alma
  // tem canal próprio (autor, 2026-07-29). Nenhum Tipo nem Patamar concede base:
  // só existe quem tem um poder que dá (hoje o Talento Alma Inquebrável).
  const rdAlma = canal("rdAlma");

  // ---------- CD ----------
  // O DIVISOR fica numa constante porque ele é o que a UI mostra como fonte do
  // valor ("Nível ÷ 1,75"), e não o nome da escala.
  const divisorCD =
    tipo === "conjurador" ? 1.25 :
    tipo === "misto" ? 1.5 :
    /* combatente | restringido */ 1.75;
  const cdTipo = INT(nd / divisorCD);
  const cd = 10 + cdTipo + (modTecnica + bt) + equip.cdBonus + canal("cd");

  // ---------- Aba Habilidades: Feitiços + Habilidades Gerais ----------
  // Contador ÚNICO para os dois (autor, 2026-07-26): dobro da Maestria, +2 no
  // Desafio, +4 na Calamidade, triplo da Maestria no Beyond. Substituiu o
  // antigo totalFeiticos(nd). A CD base dos Feitiços é a CD de Feitiçaria da
  // criatura (acima), que já usa o Atributo Principal da Técnica
  // (core.tecnicaAttr) e a Maestria. A criação de cada Feitiço só a desloca.
  // (`gerais` já foi resolvido lá em cima, junto dos outros catálogos.)
  // ⚠ `creature?.` e não `creature.`: era o ÚNICO acesso cru sobrando no
  // arquivo, e `deriveAfty(null)` morria aqui em vez de devolver a ficha vazia.
  // Achado em 2026-08-20 pelos asserts de ficha suja, e é anterior a eles.
  const feiticosLista = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  const feiticosGastos = feiticosLista.filter((f) => !f.variacaoDe).length;
  // ⚠ A Técnica de Estilo gasta o MESMO caixa que o Feitiço (autor,
  // 2026-08-07): "Consome o Contador de Habilidades. E Talentos e coisas do
  // gênero que aumentam isso... só aumentam o contador de habilidades para
  // Estilos." Para efeito de orçamento ela É um Feitiço, inclusive na vaga
  // exclusiva do canal `vagasFeitico`.
  //
  // As duas listas não convivem numa ficha bem montada (o Estilo é do Sem
  // Técnica, que não tem Feitiço), mas somar é mais honesto que escolher uma:
  // quem trocou de origem vê o excesso em vez de o excesso sumir calado.
  const criacoesGastas = feiticosGastos + estilo.gastos;
  // Vaga EXCLUSIVA de Técnica de Estilo (autor, 2026-08-22). Mais estreita que
  // a de Feitiço, então ela é gasta PRIMEIRO: quem tem as duas usaria a de
  // Estilo numa Técnica de Estilo de qualquer jeito, e deixar a mais larga para
  // o final é o que faz o Feitiço ainda caber nela.
  const vagasEstilo = canal("vagasEstilo");
  const estilosNoExclusivo = Math.min(estilo.gastos, vagasEstilo);
  const criacoesForaDoEstilo = criacoesGastas - estilosNoExclusivo;
  // ⚠ O contador comum pode ser MULTIPLICADO pela origem. Só os Gêmeos têm
  // isso hoje: metade com o irmão vivo, uma vez e meia depois da morte dele.
  // Arredonda para baixo, como todo o resto do Afty.
  const contadorBase = contadorHabilidades(bt, patamar);
  const fatorSlots = fatorSlotsHabilidade(creature);
  const contadorComum = Math.floor(contadorBase * fatorSlots);
  // As fontes do contador, para o hover poder dizer de onde o número veio. Sem
  // isso o Gêmeo vê metade das vagas e nada explicando.
  const partesContador = [
    { label: "Maestria e Patamar", valor: contadorBase },
    ...(fatorSlots !== 1
      ? [{
        label: creature?.core?.origem?.irmaoMorto ? "Gêmeos: irmão morto" : "Gêmeos: irmão vivo",
        texto: `× ${String(fatorSlots).replace(".", ",")}`,
      }]
      : []),
  ];
  // Vagas EXCLUSIVAS de Feitiço (autor, 2026-07-28): "Você fornece um Slot de
  // Habilidade somente para Feitiços, não podendo ser usada em Habilidades
  // Gerais". Hoje só a Lendária Dominância em Técnica concede. Os Feitiços
  // gastam PRIMEIRO as exclusivas, e só o que sobrar cai no contador comum.
  const vagasFeitico = canal("vagasFeitico");
  const feiticosNoExclusivo = Math.min(criacoesForaDoEstilo, vagasFeitico);
  const gastosNoComum = (criacoesForaDoEstilo - feiticosNoExclusivo) + gerais.gastos;
  const contadorTotal = contadorComum + vagasFeitico + vagasEstilo;
  const contadorGastos = criacoesGastas + gerais.gastos;
  const orcamentoHabilidades = {
    total: contadorTotal,
    comum: contadorComum,
    partesComum: partesContador,
    exclusivasFeitico: vagasFeitico,
    exclusivasUsadas: feiticosNoExclusivo,
    exclusivasEstilo: vagasEstilo,
    exclusivasEstiloUsadas: estilosNoExclusivo,
    feiticos: feiticosGastos,
    // Separado do `feiticos` de propósito: os dois gastam o mesmo caixa, mas o
    // card que mostra cada número é outro.
    estilos: estilo.gastos,
    gerais: gerais.gastos,
    gastos: contadorGastos,
    gastosNoComum,
    restante: contadorTotal - contadorGastos,
    // O excesso é medido no contador COMUM: uma vaga exclusiva sobrando não
    // libera Habilidade Geral nenhuma.
    excedeu: gastosNoComum > contadorComum,
  };
  // ⚠ O contexto virou VARIÁVEL porque agora dois caminhos precisam dele: a
  // lista pronta e o `comLiberacao` lá embaixo, que refaz UM Feitiço com as
  // melhorias de Liberação Máxima declaradas na mesa. Duas cópias do objeto
  // divergiriam no primeiro campo novo (e este já tem quinze).
  const ctxFeiticos = {
    nd,
    nivelConjurador,
    cdBase: cd,
    modTecnica,
    efeitos: ef,
    efeitosLinhaDano,
    contextoDsl: ctxTecnica,
    bonusTreinamento: bt,
    combate,
    habilidades: habilidades.escolhidas,
    reducaoSustentacao: habilidades.escolhidas.includes("cnj_sustentacao_mestre") ? 1 : 0,
    ultimoFeiticoDanoId: opcoes.ultimoFeiticoDanoId ?? null,
    rituais: opcoes.rituais ?? {},
    usosRitualista: Math.max(0, Math.trunc(Number(opcoes.usosRitualista) || 0)),
    limiteRitualista: Math.floor(bt / 2),
    ritualAtual: opcoes.ritualAtual ?? null,
    rituaisSemTeste: opcoes.rituaisSemTeste ?? {},
    beneficiosRitualDominio,
    temEnergiaReversa: aptidoesIds.includes("energia_reversa"),
    invocacoes: Array.isArray(creature?.invocacoes) ? creature.invocacoes : [],
  };
  let feiticos = {
    nivelMax: nivelMaxFeitico(nd, nivelConjurador),
    nivelConjurador,
    gastos: feiticosGastos,
    cdBase: cd,
    // Resumo pronto de cada Feitiço, para o Preview só exibir (mesma convenção
    // do `resumoDominios`: a UI não recalcula nada). O card da aba Habilidades
    // segue chamando os `calcularFeitico*` por conta própria, porque ele precisa
    // do objeto INTEIRO do cálculo, e não do resumo.
    lista: resumoFeiticos(creature, ctxFeiticos),
  };

  // ---------- RD Física ----------
  // Canal separado de RD Geral e RD Específico. ⚠ O ESCUDO saiu daqui em
  // 2026-08-01: a RD dele virou RD Geral (ver rdGeral acima). Sobrou o que é
  // explicitamente físico, como o encantamento Reforçado ("contra dano
  // físico") e a Aura Reforçada.
  const rdFisico = canal("rdFisico");

  // ---------- Defesa / CA (+ uniforme, - sobrecarga; Treino de Luta ADIADO) ----------
  const divisorDefesa =
    tipo === "conjurador" ? 1.75 :
    tipo === "misto" ? 1.5 :
    /* combatente | restringido */ 1.25;
  const defTipo = INT(nd / divisorDefesa);

  // Qual atributo entra na Defesa. Destreza por padrão, e o canal
  // `defesaAtributo` TROCA (Músculos Desenvolvidos: "você pode optar por somar
  // seu Modificador de Força ao invés de Destreza").
  //
  // ⚠ SUBSTITUIÇÃO, e não soma. Isto era `max(0, mod_forca - mod_destreza)` no
  // canal `defesa`, que dá o mesmo número mas mente no hover: "Destreza +3" e
  // "Músculos Desenvolvidos +2" um embaixo do outro se leem como soma dos dois
  // atributos (autor, 2026-08-08).
  //
  // Vale o MAIOR entre a Destreza e os concedidos, porque a regra diz "você pode
  // OPTAR": ninguém opta por piorar a própria Defesa.
  const atributosDefesa = ATTR_KEYS.filter((k) => valorCanal(ef, "defesaAtributo", k) > 0);
  const attrDefesa = [...atributosDefesa, "destreza"]
    .reduce((melhor, k) => ((modByAttr[k] ?? 0) > (modByAttr[melhor] ?? 0) ? k : melhor), "destreza");
  const modDefesa = modByAttr[attrDefesa] ?? 0;
  const defesa = 10 + defTipo + modDefesa + bt + equip.uniformeDefesa + carga.defesa + canal("defesa");

  // ---------- Perícias, Jogadas de Ataque e Testes de Resistência ----------
  // Depende de cdTipo e defTipo: a planilha do autor (2026-07-27) mostra que a
  // CRIATURA não usa o "metade do nível" do livro (essa é a fórmula do JOGADOR).
  // Teste de Resistência usa a MESMA escala por Tipo da CD e da Defesa (Astúcia
  // e Vontade a da CD, Reflexos e Fortitude a da Defesa, Integridade ND/1,5 em
  // todo Tipo), e Jogada de Ataque usa ND/1,5 fixo. Só as Perícias seguem em
  // metade do ND, pendente de fórmula própria. Ver afty-pericias.js.
  //
  // Orçamento de perícias treinadas = 3 + maior mod entre INT e SAB + rank do
  // Grau do Feiticeiro (autor, 2026-07-27).
  const testes = resolveTestes(creature, {
    nd, bt, mods: modByAttr, tecnicaAttr, grauRank: grau.rank,
    escalaCD: cdTipo, escalaDefesa: defTipo,
    divisorCD, divisorDefesa,
    bonusVagas: canal("vagasPericia"),
    efeitos: ef,   // bonusPericia / bonusTR / bonusAcerto / proficienciaPericia
    // Penalidade de armadura e escudo, cumulativa, em testes de perícia que
    // usam Destreza. Voltou a valer em 2026-08-01.
    penalidadeDestreza: equip.penalidadeDestreza,
  });

  // O teste de Conjuração em Ritual parte de Prestidigitação. Naturalidade com
  // Rituais abre uma escolha por uso, então a ficha guarda o atributo escolhido
  // na configuração daquele Feitiço em vez de trocar Destreza por Inteligência
  // silenciosamente. Ritualista soma +2 em qualquer uma das duas versões.
  const prestidigitacao = (testes.pericias ?? []).find((p) => p.id === "prestidigitacao") ?? null;
  const temNaturalidadeRitual = habilidades.escolhidas.includes("cnj_naturalidade_com_rituais");
  const temRitualista = habilidades.escolhidas.includes("cnj_ritualista");
  const partesPrestidigitacao = prestidigitacao?.partes ?? [];
  const parteAtributoPrest = partesPrestidigitacao[0] ?? { label: "Destreza", valor: modDes };
  const partePenalidadePrest = partesPrestidigitacao.find((p) => p.label === "Armadura e Escudo") ?? null;
  const bonusRitualista = temRitualista ? 2 : 0;
  /* O teste de Conjuração em Ritual entra DEPOIS do `resumoFeiticos`, porque
     depende da perícia de Prestidigitação, que só fecha aqui embaixo.

     ⚠ Virou FUNÇÃO NOMEADA (2026-08-10) porque dois caminhos precisam dela: a
     lista pronta e o `comLiberacao`. Um Feitiço pode ser Ritual E Liberação
     Máxima no mesmo uso, e sem isto a versão liberada voltaria da mesa sem o
     teste de ritual, ou seja, o jogador perderia a rolagem por ter declarado a
     Liberação. */
  const comTesteDeRitual = (f) => {
    {
      if (!f.ritual) return f;
      const config = opcoes.rituais?.[f.id] ?? {};
      const usaInteligencia = temNaturalidadeRitual && config.atributoRitual === "inteligencia";
      const bonusPrestBase = prestidigitacao?.bonus ?? 0;
      const bonusAtributo = usaInteligencia
        ? bonusPrestBase - (parteAtributoPrest.valor || 0) - (partePenalidadePrest?.valor || 0) + modInt
        : bonusPrestBase;
      const partesAtributo = usaInteligencia
        ? [
          { label: "Inteligência", valor: modInt },
          ...partesPrestidigitacao.slice(1).filter((p) => p.label !== "Armadura e Escudo"),
        ]
        : partesPrestidigitacao;
      return {
        ...f,
        ritual: {
          ...f.ritual,
          atributoRitual: usaInteligencia ? "inteligencia" : "destreza",
          permiteInteligencia: temNaturalidadeRitual,
          teste: f.ritual.exigeTeste ? {
            bonus: bonusAtributo + bonusRitualista,
            cd: f.ritual.cd,
            partes: [
              ...partesAtributo,
              ...(bonusRitualista ? [{ label: "Ritualista", valor: bonusRitualista }] : []),
            ],
          } : null,
        },
      };
    }
  };
  feiticos = {
    ...feiticos,
    lista: (feiticos.lista ?? []).map(comTesteDeRitual),
    /* ⚠ FUNÇÃO, e não valor. A Liberação Máxima é escolhida na HORA DA
       CONJURAÇÃO, então ela não tem como estar na lista pré-calculada: o jogador
       declara as melhorias na mesa e a Ficha pede a versão liberada daquele
       Feitiço. Continua valendo que a UI não recalcula regra nenhuma, ela só
       pergunta de novo com a escolha em mãos.

       Passa pelo `comTesteDeRitual` pelo mesmo motivo que a lista: os dois
       sistemas convivem no mesmo uso. */
    comLiberacao: (id, melhorias) => {
      const linha = resumoDeUmFeitico(creature, id, { ...ctxFeiticos, liberacao: { melhorias } });
      return linha ? comTesteDeRitual(linha) : null;
    },
  };

  // ---------- Dano (planilha do autor, 2026-07-27) ----------
  // Uma linha por FONTE: o Ataque Básico e mais uma para cada arma equipada.
  // Todas usam a MESMA conta, e o dano listado na tabela da arma é ignorado. Da
  // arma vêm o Alcance, as Propriedades e o grau da Ferramenta Amaldiçoada.
  // Faixas e Manoplas não viram linha própria: são o Ataque Básico (grupo
  // "pugilato"). O Nível de Aptidão em Controle e Leitura entra na conta, daí
  // depender do `aptidao` já resolvido lá em cima.
  let dano = resolveDano(creature, {
    nd, patamar, mods: modByAttr, aptidaoCL: aptidao.efetivo.cl,
    efeitos: ef, armas: armasParaDano, grauBasico, acertoGrauBasico,
    fontesAcertoBasico, escoposBasicoExtra, finezaBasico,
    efeitosLinhaDano, contextoDsl: ctxTecnica,
    tecnicasCombate: { ...tecnicasCombate, bt },
    // Os Ataques já resolvidos, para cada linha fechar o Acerto dela: o ataque
    // da categoria mais o grau da arma daquela linha.
    ataques: testes.ataques,
    alcanceCorpo: tamanho.espacoAlcance,
    alcanceMult: combate.postura === "ceu" || combate.postura2 === "ceu" ? 2 : 1,
  });
  dano = {
    ...dano,
    entradas: (dano.entradas ?? []).map((entrada) => (
      dadosAuxiliaresNaLinha(entrada, auxiliaresAtivos.dados)
    )),
  };
  dano = aplicarImbuicaoNoDano(
    dano,
    creature,
    combate,
    habilidades.escolhidas,
    feiticos.lista,
  );
  dano = aplicarAptidoesNoDano(dano, creature, combate, {
    aptidoesIds,
    au: aptidao.efetivo?.au ?? 0,
    cl: aptidao.efetivo?.cl ?? 0,
    modTecnica,
    cd,
  });

  // ---------- Cura (2026-08-03) ----------
  // Uma linha por FONTE, igual ao Dano, mas o número vem todo do Motor: cada
  // poder escreve a rolagem dele no próprio texto, e não há fórmula única que
  // as cubra. Ver afty-cura.js.
  //
  // ⚠ Roda DEPOIS do dano e do PV: as fontes que espelham ("uma rolagem do seu
  // dano desarmado") copiam a linha do Ataque Básico, e os dois itens que curam
  // uma fração do PV precisam do PV já fechado.
  const cura = resolveCura({
    efeitos: ef,
    // O `semEnergia` já zera as aptidões, então o Restringido não ganha linha de
    // Energia Reversa por engano.
    aptidoes: aptidoesIds,
    habilidades: habilidades.escolhidas,
    itens: equip.entradas,
    hp,
    danoBasico: dano.entradas.find((e) => e.id === "basico") ?? null,
  });

  // ---------- Empolgação (Lutador) ----------
  // Só a parte DERIVADA: a tabela de dados e o nível em que o combate começa.
  // O nível atual é estado de combate e a ficha não o guarda (autor, 2026-07-28).
  const empolgacao = resolveEmpolgacao(habilidades.escolhidas, {
    maxima: canal("empolgacaoMaxima"),
    bonusInicial: canal("empolgacaoInicial"),
  });

  // ---------- Atenção = 10 + bônus de Percepção (Percepção passiva) ----------
  const atencao = testes.atencao + canal("atencao");

  // ---------- PV Temporário ----------
  // Casca por cima do PV, não PV máximo: some quando o efeito acaba. Hoje só a
  // simulação de combate produz (Fluxo, Brutalidade Aprimorada e Eliminar e
  // Continuar).
  const pvTemporario = canal("pvTemporario");

  // ---------- PE Temporário ----------
  /* Irmão do de cima, e ele faltava desde julho. ⚠ A forma é DIFERENTE: o PV
     temporário é um número só, e este sai POR FONTE, porque a regra da mesma
     fonte é "topa, não acumula". Sem o nome da fonte, o Completo do Treino de
     Controle de Energia ("no começo de toda rodada você ganha metade do BT")
     viraria uma pilha infinita na rodada 10.

     O ALVO é o GATILHO: `combate` entrega uma vez quando a cena começa, e
     `rodada` reenche no começo de cada rodada. Quem aplica é a sessão da Ficha
     (`aplicaPeTemporario` em ficha-sessao.js), não o derivado: aqui só se diz o
     que a criatura TEM direito de receber.

     Copiado em desenho do `applyRoundStartResources` da 2.5.2
     (src/components/fm-automation-entities.js), que resolveu isto primeiro. */
  const peTemporario = (() => {
    /* ⚠ A CHAVE leva o gatilho junto, e o nome sozinho NÃO serve. O Treino de
       Controle de Energia emite nos dois gatilhos (4 na cena pela 2ª etapa,
       metade do BT por rodada pelo Completo) e o `efeitosDeTreino` carimba o
       nome da LINHA nos dois. Com o nome como chave, os dois viravam a mesma
       fonte e a regra do "topa, não acumula" comia um deles: a rodada 1 dava 4
       em vez de 7. São dois benefícios diferentes da mesma linha. */
    const porGatilho = (gatilho) => detalhesDoCanal(ef, "peTemporario", gatilho)
      .map((d) => ({
        chave: `${gatilho}:${d.nome}`,
        nome: d.nome,
        valor: Math.max(0, Math.trunc(d.valor) || 0),
      }))
      .filter((d) => d.valor > 0);
    const combate = porGatilho("combate");
    const rodada = porGatilho("rodada");
    return { combate, rodada, tem: combate.length > 0 || rodada.length > 0 };
  })();

  // ---------- Recursos de especialização ----------
  // Pontos de Preparo (Combatente). Zero para quem não tem a habilidade dona, e
  // o Preview esconde. A Estamina do Restringido NÃO mora aqui: é o próprio PE
  // com outro nome, então tudo que a alimenta usa o canal `pe`.
  const pontosPreparo = canal("pontosPreparo");

  // ---------- Regeneração ----------
  // Cura no INÍCIO do turno, em dados + fixo, igual às linhas de dano.
  // Sobrevivente (Lutador 4°) rola d6 e Corpo de Aço (Restringido 6°) rola d8:
  // o canal do DADO carrega as faces, e vale a maior das fontes.
  // ⚠ O dado é MÁXIMO, não soma: `canal()` somaria 6 + 8 = 14 faces.
  const facesRegen = detalhesDoCanal(ef, "regeneracaoFaces").map((x) => x.valor);
  const regeneracao = {
    dados: Math.max(0, canal("regeneracaoDados")),
    dado: `d${Math.max(6, ...facesRegen)}`,
    fixo: canal("regeneracaoFixa"),
  };

  // ---------- Integridade da Alma ----------
  // O `atual` é estado da ficha e o máximo é 100, elevável pela Melhoria de
  // Alma. É o teto: passar dele é o que faz o multiplicador de PV subir de 1.

  // ---------- Iniciativa (autor, 2026-07-27) ----------
  // INT(Maestria / 2) + Mod. Destreza. Não usa o ND direto nem escala por Tipo.
  const iniciativa = INT(bt / 2) + modDes + canal("iniciativa");

  // ---------- Orçamentos (budgets do builder) ----------
  // Orçamento de Níveis de Aptidão. Só entram aqui os pontos LIVRES: os
  // limiares de ND, o +1 de Qnt.PE Muito Grande e as concessões de treino
  // "à sua escolha". As concessões DIRECIONADAS a uma trilha são grátis e
  // não passam pelo orçamento (ver resolveNiveisAptidao).
  //
  // ⚠ O +1 de Qnt.PE Muito Grande NÃO é o Raio Negro. A planilha rotulava
  // essa célula de "Raio Negro" e o autor confirmou (2026-07-16) que são
  // efeitos SEPARADOS: Qnt.PE Muito Grande dá +1 no orçamento e nada mais,
  // enquanto a aptidão Raio Negro dá +ND de PE e +1 DIRECIONADO em Aura.
  // Os dois somam. O efeito do Raio Negro ainda NÃO é aplicado (o motor não
  // lê aptidões escolhidas): fica para a passada de efeitos, quando o
  // catálogo fechar. Ver docs/afty-status.md.
  const aptidaoThresholds = [[2,1],[4,1],[6,1],[8,1],[10,2],[12,1],[14,1],[16,1],[18,1],[20,2]];
  // ⚠ A tabela do livro para no ND 20, e o orçamento parava junto. O autor
  // estendeu em 2026-08-12: a partir do 20 continua saindo 1 nível a cada 2 ND,
  // ou seja, nos ND 22, 24, 26, 28, 30 e daí para cima sem fim (o ND não tem
  // teto no Afty). Os ímpares não dão nada, então é divisão inteira.
  const aptidaoAlem20 = Math.max(0, Math.floor((nd - 20) / 2));
  // ⚠ `canal("pontosAptidao")`, e não `treino.aptidao`: o orçamento vinha só do
  // estágio MONTANTE (Treinamentos e Habilidades Gerais), então uma HABILIDADE
  // que concedesse ponto de aptidão era descartada calada. O Elevar Aptidão do
  // Conjurador ("você aumenta um dos seus Níveis de Aptidão em 1") foi quem
  // expôs isso. O `ef` já traz o montante mesclado, então não dobra.
  const totalAptidao = semEnergia ? 0 : (
    aptidaoThresholds.reduce((s, [t, v]) => s + (nd >= t ? v : 0), 0) +
    aptidaoAlem20 +
    (qntPE === "muito_grande" ? 1 : 0) +
    canal("pontosAptidao"));

  // Quantas Aptidões Amaldiçoadas a criatura PODE ter: só o que a Habilidade
  // Geral Aptidão concedeu (regra 4 em afty-gerais.js, o ND não dá nenhuma).
  // Segue separado e independente do orçamento de NÍVEIS de aptidão
  // (totalAptidao, os limiares de ND), que não mudou.
  const totalAptidoesAmaldicoadas = semEnergia ? 0 : canal("vagasAptidao");

  // ⚠ Especializações, Talentos, Habilidades, Alto Nível, Aptidão e o MOTOR DE
  // AUTOMAÇÃO subiram para o topo desta função (logo depois dos atributos
  // base), porque os efeitos precisam alcançar os stats. Ver o bloco
  // "CATÁLOGOS ESCOLHIDOS + MOTOR DE AUTOMAÇÃO" lá em cima.

  // Invocações: a invocação lê valores do DONO (ND, BT = maestria(ND) e o Nível
  // de Controlador, o lado da multiclasse). Resolvidas aqui só para a UI e a
  // validação lerem de um lugar só. NÃO alimentam nenhum stat do dono.
  // Invocações usam o nível de ESCALONAMENTO de Controlador (real + metade da
  // outra classe): acesso a graus, metade do nível no bônus de teste, e os
  // limiares 6/12/18 de Invocações Móveis. Pré-requisitos de habilidade usam o real.
  const nivelControlador = nivelEspec.controlador?.escalonamento ?? 0;
  // Efeitos estáticos das Habilidades de Controlador escolhidas, aplicados a
  // TODAS as invocações do dono (via Motor de Automação, ver afty-habilidades.js).
  const escolhasMapa = habilidades.escolhas?.mapa ?? {};
  const efeitosInvoc = efeitosInvocacaoControlador(habilidades.escolhidas, escolhasMapa);
  // MARCADORES: uma Habilidade que vale só para ALGUMAS invocações (Concentrar
  // Poder, as 4 Melhorias, Fantoche Supremo, Companheiro, Econômicas) entra por
  // marcador. O limite sai de uma expressão da DSL avaliada no contexto do dono.
  const ctxDono = { nd, bt, nivel_controlador: nivelControlador };
  const marcadores = resolveMarcadoresInvocacao({
    escolhidasIds: habilidades.escolhidas, escolhasMapa, ctxDono,
  });
  // Roster do Controlador: invocações iniciais, limite em campo, comandos e
  // hordas. É de REFERÊNCIA (mostra, não valida).
  const controle = resolveControleInvocacoes({
    escolhidasIds: habilidades.escolhidas, escolhasMapa, nivelControlador,
  });
  // Feitiço de Criação de Shikigamis: o nível do Feitiço manda no grau, no
  // orçamento e no custo da invocação que ele referencia.
  // O ctx leva as duas peças que o `linhaDoFeitico` também junta na hora de
  // aplicar as reduções de custo: o repertório inteiro e as escolhas da ficha.
  const overridesPorInvocacao = overridesShikigami(feiticosLista, {
    ...ctxFeiticos,
    feiticos: feiticosLista,
    reducoesCustoFeitico: creature?.reducoesCustoFeitico,
  });
  const donoInvoc = {
    nd, bt, nivelControlador,
    efeitos: efeitosInvoc,
    marcadores,
    overridesPorInvocacao,
    membroQuartoGrauGratis: controle.membroQuartoGrauGratis,
    otimizacaoEnergia: controle.otimizacaoEnergia,
    autonomia: controle.autonomia,
    resistenciaSobrecarregada: controle.resistenciaSobrecarregada,
    margemCritico: controle.margemCritico,
    criticoBrutal: controle.criticoBrutal,
  };
  const invocacoes = { ...resolveInvocacoesList(creature?.invocacoes, donoInvoc), controle };
  const hordas = resolveHordasList(creature?.hordas, creature?.invocacoes, donoInvoc);

  // Focos de interlúdio (orçamento de Treinamento) = ND + Outros.
  // "Outros" = bônus de poderes que concedem treinos (sistema futuro),
  // lido de creature.focosBonus (0 por ora), mais a Habilidade Geral
  // Treinamentos (metade do ND por pega).
  const focosTotais = nd + canal("focos");

  // (Pontos de atributo agora vêm do método + pool de nível — ver afty-atributos.js.)

  // ---------- FONTES DE CADA VALOR (hover da UI) ----------
  // Uma parcela por origem, na ordem em que a fórmula soma. `texto` substitui o
  // número quando a parcela não é uma soma (multiplicadores do HP).
  // Parcelas do Motor entram nomeadas pela habilidade/treino que as gerou.
  const rotulo = ATTR_LABEL;
  // `suplantado` viaja junto para o hover poder mostrar o perdedor do pool
  // exclusivo apagado, em vez de escondê-lo. Sem isso o jogador veria o +5 do
  // Shikigami simplesmente sumir da ficha, sem nada dizendo por quê.
  const doMotor = (id, alvo = null) =>
    detalhesDoCanal(ef, id, alvo, true).map((d) => ({
      label: d.nome, valor: d.valor,
      ...(d.suplantado ? { suplantado: true } : {}),
    }));
  const TIPO_LABEL = { combatente: "Combatente", misto: "Misto", conjurador: "Conjurador", restringido: "Restringido" };
  const PATAMAR_LABEL = { comum: "Comum", desafio: "Desafio", calamidade: "Calamidade", beyond: "Beyond" };
  const divTexto = (d) => String(d).replace(".", ",");

  const partes = {
    hp: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: hpBase },
      // O atributo TROCADO aparece com o nome dele, e não somado por baixo de
      // uma "Constituição" que não está mais na conta. Mesmo desenho da Defesa.
      { label: attrHp === "constituicao"
          ? "Constituição × ND"
          : `${rotulo[attrHp] ?? attrHp} × ND (no lugar da Constituição)`,
        valor: nd * modHp },
      ...detalhesDoCanal(ef, "hpAtributo", attrHp)
        .map((d) => ({ label: d.nome, texto: "substitui" })),
      ...doMotor("hp"),
      ...(equip.hpMaxBonus ? [{ label: "Equipamento", valor: equip.hpMaxBonus }] : []),
      ...(almaMult !== 1 ? [{ label: "Integridade da Alma", texto: `×${divTexto(almaMult)}` }] : []),
      ...(hpPatamarMult !== 1 ? [{ label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, texto: `×${hpPatamarMult}` }] : []),
    ],
    pe: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: peBase },
      ...(peQnt ? [{ label: "Quantidade de PE", valor: peQnt }] : []),
      { label: `Mod. da Técnica (${rotulo[tecnicaAttr] ?? tecnicaAttr})`, valor: modTecnica },
      ...doMotor("pe"),
    ],
    defesa: [
      { label: "Base", valor: 10 },
      { label: `Nível ÷ ${divTexto(divisorDefesa)}`, valor: defTipo },
      // O atributo TROCADO aparece com o nome dele, e não somado por baixo de
      // uma "Destreza" que não está mais na conta. Quem trocou vem junto no
      // rótulo, senão o jogador vê "Força" e não sabe de onde saiu.
      { label: attrDefesa === "destreza"
          ? "Destreza"
          : `${rotulo[attrDefesa] ?? attrDefesa} (no lugar da Destreza)`,
        valor: modDefesa },
      ...detalhesDoCanal(ef, "defesaAtributo", attrDefesa)
        .map((d) => ({ label: d.nome, texto: "substitui" })),
      { label: "Maestria", valor: bt },
      ...(equip.uniformeDefesa ? [{ label: "Uniforme", valor: equip.uniformeDefesa }] : []),
      ...(carga.defesa ? [{ label: "Sobrecarga", valor: carga.defesa }] : []),
      ...doMotor("defesa"),
    ],
    cd: [
      { label: "Base", valor: 10 },
      { label: `Nível ÷ ${divTexto(divisorCD)}`, valor: cdTipo },
      { label: `Mod. da Técnica (${rotulo[tecnicaAttr] ?? tecnicaAttr})`, valor: modTecnica },
      { label: "Maestria", valor: bt },
      ...(equip.cdBonus ? [{ label: "Equipamento", valor: equip.cdBonus }] : []),
      ...doMotor("cd"),
    ],
    rdGeral: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: rdGeralBase },
      ...(equip.rdGeralBonus ? [{ label: "Equipamento", valor: equip.rdGeralBonus }] : []),
      ...doMotor("rdGeral"),
    ],
    rdEspecifico: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: rdEspecifico - canal("rdEspecifico") },
      ...doMotor("rdEspecifico"),
    ],
    rdAlma: doMotor("rdAlma"),
    rdFisico: doMotor("rdFisico"),
    movimento: [
      { label: "Base", valor: 9 },
      { label: "Maior de Força e Destreza × 1,5", valor: maxForDex * 1.5 },
      ...(carga.movimento ? [{ label: "Sobrecarga", valor: carga.movimento }] : []),
      ...doMotor("movimento"),
      ...doMotor("movimentoMult").map((fonte) => ({
        ...fonte,
        valor: undefined,
        texto: `× ${fonte.valor}`,
      })),
    ],
    iniciativa: [
      { label: "Maestria ÷ 2", valor: INT(bt / 2) },
      { label: "Destreza", valor: modDes },
      ...doMotor("iniciativa"),
    ],
    pvTemporario: doMotor("pvTemporario"),
    pontosPreparo: doMotor("pontosPreparo"),
    atencao: [
      { label: "Base", valor: 10 },
      { label: "Percepção", valor: testes.atencao - 10 },
      ...doMotor("atencao"),
    ],
    resParcial: [
      { label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, valor: resParcial },
    ],
    guardaBonus: [
      { label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, valor: guardaBonusBase },
      ...doMotor("guardaBonus"),
    ],
    guardaVida: [
      // A conta escrita como o autor a deu: 5 × ND ou 10 × ND. Uma linha só,
      // porque o multiplicador sem o ND ao lado não se lê.
      { label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar}), ${patamar === "beyond" ? 10 : 5} × ND`, valor: guardaVidaBase },
      ...doMotor("guardaVida"),
    ],
    /* O bônus CORRENTE, que é o que a Defesa e os TRs recebem agora. A primeira
       linha é o teto da rodada e a segunda é o desgaste, escrita como perda para
       o hover fechar a conta: sem ela o leitor soma 5 e vê 1 na tela. */
    guardaAtual: [
      { label: "Teto da Rodada", valor: guarda.bonusMax },
      ...(guarda.golpes > 0 && guarda.noAr
        ? [{ label: `Golpes Sofridos (${guarda.golpes})`, valor: guarda.bonus - guarda.bonusMax }]
        : []),
      ...(guarda.motivo ? [{ label: guarda.motivo, valor: -guarda.bonusMax }] : []),
    ],
  };

  // ---------- FONTES DE CADA ATRIBUTO E DE CADA LIMITE ----------
  // Dois hovers por linha da tabela de Atributos: um no valor efetivo e um no
  // limite. As parcelas do Motor entram NOMEADAS pela habilidade, talento ou
  // treino que as gerou, que é o que o `detalhes` do agregado carrega.
  //
  // A ordem é a da fórmula, e a última linha é a PERDA no limite, quando existe.
  // Ela é o que fecha a conta para o jogador: sem ela o hover soma 24 e o número
  // grande diz 20, sem explicação.
  const METODO_LABEL = { pontos: "Compra por Pontos", fixos: "Valores Fixos", rolagem: "Rolagem" };
  const partesAtributo = {};
  const partesLimite = {};
  for (const k of ATTR_KEYS) {
    const perdido = perdaNoLimite[k] || 0;
    partesAtributo[k] = [
      { label: `Base (${METODO_LABEL[creature?.attrMethod || "pontos"]})`, valor: a[k] ?? 10 },
      ...(nivelAlloc[k] ? [{ label: "Pontos de Nível", valor: nivelAlloc[k] }] : []),
      ...(attrBonus[k] ? [{ label: "Origem", valor: attrBonus[k] }] : []),
      ...(desenv[k] ? [{ label: "Desenvolvimento Inesperado", valor: desenv[k] }] : []),
      ...(equip.attrBonus[k] ? [{ label: "Equipamento", valor: equip.attrBonus[k] }] : []),
      ...doMotor("atributo", k),
      ...(perdido ? [{ label: `Perdido no limite ${attrLimiteEfetivo[k]}`, texto: `−${perdido}` }] : []),
    ];
    const daOrigem = Math.max(limBase[k] ?? ATTR_LIMITE_PADRAO, limOrigem[k] ?? 0) - ATTR_LIMITE_PADRAO;
    partesLimite[k] = [
      { label: "Limite padrão", valor: ATTR_LIMITE_PADRAO },
      ...(daOrigem ? [{ label: tipo === "restringido" ? "Ápice Corporal Humano" : "Origem", valor: daOrigem }] : []),
      ...(desenv[k] ? [{ label: "Desenvolvimento Inesperado", valor: desenv[k] }] : []),
      ...(limPool[k] ? [{ label: "Bônus em Atributo", valor: limPool[k] }] : []),
      ...doMotor("limiteAtributo", k),
    ];
  }

  // ---------- overrides de valor final (aba Cálculos) ----------
  const calc = { hp, pe, defesa, cd, rdGeral, rdEspecifico, rdAlma, movimento, resParcial, atencao, iniciativa };
  const stats = {};
  for (const k of OVERRIDABLE) stats[k] = ov[k] != null ? ov[k] : calc[k];
  const isOverridden = (k) => ov[k] != null;

  return {
    ...stats,
    /* LINHA MORTA: o que a ficha cita e o mundo não tem. Lista vazia é o caso
       normal. Quem mostra é a Ficha e o criador, e ela nunca impede nada de
       abrir (decisão 4 do autor). Ver afty-addons.js. */
    addonProblemas: problemasDeAddon(creature),
    /* O que o mestre concedeu NESTA SESSÃO, já com nome resolvido e com `morta`
       marcada quando o catálogo não conhece mais o id. Vazio é o caso normal, e
       é a lista que as duas telas de jogo mostram. Ver afty-concessao.js. */
    concedido: concessoesDaSessao(opcoes.concedido),
    /* As primitivas de Addon que ESTA criatura enxerga, pelo `permite` dos
       pacotes dela. Vazio é o caso normal, e é o que mantém a tela de quem só
       usa o raw exatamente como era. Ver `PRIMITIVAS` em afty-addons.js. */
    primitivas: primitivasDaCriatura(creature),
    adaptacoes: resumoAdaptacoes(creature, opcoes.adaptacoes),
    /* O que os Addons desta criatura DESTRAVAM. Vazio é o caso normal. Ao
       contrário das `primitivas`, isto MUDA REGRA. Ver `LIBERACOES`. */
    liberacoes,
    // metadados / valores não sobrescrevíveis
    calc,                 // valores calculados (antes do override)
    isOverridden,
    maestria: bt,
    almaMult,
    almaMax,               // teto da Integridade da Alma (100 + Melhoria de Alma)
    modTecnica,
    tecnicaAttr,
    totalAptidao,               // orçamento de NÍVEIS de aptidão (1 a cada 2 ND depois do 20)
    totalAptidoesAmaldicoadas,  // quantas pode ter (só da Habilidade Geral Aptidão, 0 sem ela)
    aptidao,              // níveis por trilha: { alocado, concedido, efetivo, gastos, limite }
    // As Aptidões Amaldiçoadas EFETIVAS (escolhidas + concedidas por nome pela
    // origem), para o `requerAptidao` da bancada saber quais linhas mostrar.
    // Segue a trava do semEnergia, igual ao motor.
    aptidoesEscolhidas: aptidoesIds,
    // Só as CONCEDIDAS, para a aba poder marcá-las como travadas: elas não são
    // escolha, e não podem ser desmarcadas nem cobrar orçamento.
    aptidoesConcedidas,
    aptidoesConcedidasOrigem,
    aptidoesConcedidasEspecializacao,
    dominios: resumoDominios,
    // Proficiência RESOLVIDA por perícia (a escolhida mais a concedida pelo
    // Motor). É o que os requisitos de perícia das Aptidões conferem.
    periciaProf: Object.fromEntries((testes.pericias ?? []).map((p) => [p.id, p.prof ?? null])),
    feiticos,             // { nivelMax, gastos, cdBase } — o orçamento é o de baixo
    // ⚠ O contexto CRU do DSL, exposto para o seletor de variáveis do Motor
    // (`vocabularioDsl` em afty-dsl-vocabulario.js). Sai cru de propósito: o
    // agrupamento custa uma varredura das ~663 chaves, e o `deriveAfty` roda por
    // combatente e por estado de combate. Quem monta a lista é a UI, num memo.
    contextoDsl: ctxTecnica,
    estilo,               // Novo Estilo da Sombra: { disponivel, conhecidas, gastos, vagas, gastoVagas, estados, avisos }
    dominioSimples,       // { tem, sustenta, area, custoErguer, custoSustentar, custoSustentarEstilo, + as partes de cada hover }
    estiloEfeitos,        // Motor resolvido por Técnica de Estilo Especial, para o editor mostrar cada linha
    tecnicaEfeitos,       // Funcionamento Básico resolvido, para o editor mostrar o valor de cada linha
    funcionamentoEfeitos, // o mesmo, por Funcionamento Básico ADICIONAL, chaveado pelo id
    passivosEfeitos,      // Motor resolvido por Feitiço Passivo / Característica
    motorLinhaDano: { efeitos: efeitosLinhaDano, contexto: ctxTecnica },
    gerais,               // { escolhidas, gastos, ganhos, destravado, maxVezes, acesso, inacessiveis }
    efeitos: ef,          // Motor de Automação: { porCanal, porAlvo, detalhes, avisos }
    testes,               // { pericias, resistencias, ataques, orcamento, atencao }
    dano,                 // { entradas: [{ id, nome, fonte, texto, alcance, propriedades, partes }] }
    tecnicasCombate,
    auxiliaresAtivos,
    cura,                 // { linhas: [{ id, nome, grupo, alcance, texto, fixo, usos, unidade, partes }] }
    dedicadas,            // Armas Dedicadas: { ativa, escolhidas, elegiveis, max, restante }
    empolgacao,           // Lutador: { ativa, aprimorada, inicial, max, tabela }
    combate,              // simulação: estado já aparado nos tetos da ficha
    pvTemporario,         // casca de PV vinda da simulação (Fluxo, Brutalidade Aprimorada)
    peTemporario,         // casca de PE POR FONTE: { combate:[], rodada:[], tem } — a sessão aplica
    regeneracao,          // cura no início do turno: { dados, dado, fixo }
    pontosPreparo,        // recurso do Combatente (Artes do Combate), 0 sem ela
    recursoLabel,         // "Estamina" no Restringido, "Energia" no resto — mesmo PE
    partes,               // fontes de cada stat, para o hover da UI
    orcamentoHabilidades, // contador ÚNICO da aba: Feitiços + Habilidades Gerais
    origem: escolhasOrigem, // { porEscolha, mapa } — escolhas aninhadas de Origem e Clã
    especializacoes,      // { escolhidas, total, max, obrigatoria, completa, erro }
    treinamentosEquipamento,
    treinoEscudo,
    habilidades,          // { escolhidas, total, gastos, restante, excedeu, inacessiveis, niveisPorEspec }
    talentos,             // { escolhidas, gastos, inacessiveis } — gasto já somado em habilidades.gastos
    altoNivel,            // { ativo, melhorias, lendarias, escolhas, apiceId } — orçamentos próprios
    invocacoes,           // { lista, total, custoTotal, temWarnings }
    hordas,               // { lista, total, custoTotal } (líder + membros escalados)
    focosTotais,          // orçamento de Focos de interlúdio = ND + bônus de poderes
    treino,               // contribuições agregadas dos Treinamentos (hp/pe/movimento/aptidao/defesa)
    nd, tipo, patamar,
    // Categoria de tamanho DERIVADA: Médio mais o que o Motor mover. A ficha não
    // a escolhe (autor, 2026-08-08). `tamanhoDegraus` é quanto o Motor moveu, e
    // vale para a UI dizer de onde veio.
    tamanho: tamanho.value,
    tamanhoLabel: tamanho.label,
    tamanhoDegraus: degrausTamanho,
    tamanhoEspacoAlcance: tamanho.espacoAlcance,
    mods: { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre },
    attrEff,              // valor EFETIVO por atributo (base + efeitos, aparado no limite)
    attrPermanente,       // o que os PRÉ-REQUISITOS enxergam (sem os efeitos temporários)
    attrLimiteEfetivo,    // limite por atributo (padrão + Origem + Desenvolvimento + Motor, teto 30)
    attrDesenv: desenv,   // pontos de Desenvolvimento Inesperado por atributo
    attrBonus,            // bônus de atributo da origem (efetivo)
    attrEquip: equip.attrBonus, // acessórios de atributo (passam o limite, param em 30)
    attrPerda: perdaNoLimite,   // ponto de bônus desperdiçado no limite, por atributo
    // Quanto o Motor soma em cada atributo. O builder RESERVA este espaço no pool
    // de nível, pela mesma convenção do bônus de origem: a concessão tem
    // prioridade e o ponto alocado volta ao pool, em vez de sumir no teto.
    //
    // ⚠ Só o estágio PERMANENTE entra. Um efeito de atributo temporário (nenhum
    // existe hoje, mas o estágio 1b existe para eles) encolheria o pool de nível
    // do criador por causa de um estado ligado na bancada de simulação, e o
    // jogador perderia pontos de ficha ao ligar Brutalidade.
    attrMotor: Object.fromEntries(ATTR_KEYS.map((k) => [k, valorCanal(efAttrPerm, "atributo", k)])),
    partesAtributo,       // fontes de cada atributo, para o hover da UI
    partesLimite,         // fontes de cada limite, para o hover da UI
    // ---------- Equipamentos ----------
    trilhasAptidao: trilhasOrigem,  // as que a ORIGEM tem (a Maldição não tem `er`)
    grauFeiticeiro: grau,  // { value, label, ordem, rank, ndMin } derivado do ND
    equip: equipFinal,     // parcelas do equipamento (entradas, custoGasto, avisos...)
    carga,                 // { espacosUsados, cargaLimite, cargaMaxima, sobrecarregado... }
    rdFisico,              // RD Física. O escudo NÃO entra mais aqui (é RD Geral).
    penalidadeDestreza: equip.penalidadeDestreza, // uniforme + escudos, cumulativos
    /* Guarda Inabalável: { ativa, bonusMax, vidaMax, passoPorGolpe }. O corrente
       (quantos golpes já levou, se ainda está de pé) é SESSÃO, e quem resolve é
       o `resolveGuarda` em ficha-sessao.js. */
    guarda,
  };
}
