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
 *   • GUARDA (depende do contador de ataques consecutivos, CU9).
 *   • Perícias → Atenção usa Percepção = 0 por ora.
 *   • Grau de Equipamento (Ferramentas Amaldiçoadas) ainda não existe. O que
 *     entra hoje é o equipamento base: Defesa do uniforme, RD Física do
 *     escudo, penalidade de Destreza, carga e sobrecarga.
 *
 * TREINAMENTO: as contribuições legíveis pelo motor (HP/PE/Movimento/
 *   Defesa/Aptidão) já entram via resolveTreinoEfeitos. As trilhas
 *   catalogadas até agora só alimentam PE/Movimento/Aptidão; os demais
 *   canais ficam prontos para as próximas trilhas (Resistência, Luta,
 *   Potencial Físico, Atributo…).
 * ============================================================
 */

import { resolveOrigemAttrBonus, resolveDesenvolvimento } from "./afty-origens";
import { resolveTreinoEfeitos } from "./afty-treinamentos";
import { resolveNiveisAptidao } from "./afty-aptidoes";
import { resolveEspecializacoes } from "./afty-especializacoes";
import { resolveHabilidades, efeitosInvocacaoControlador } from "./afty-habilidades";
import { resolveTalentos } from "./afty-talentos";
import { resolveAltoNivel } from "./afty-alto-nivel";
import { resolveInvocacoesList, resolveHordasList } from "./afty-invocacoes";
import { resolveEquipamentos, resolveCarga, grauFeiticeiro } from "./afty-equipamentos";
import { totalFeiticos, nivelMaxFeitico } from "./afty-feiticos";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

// Maestria == Treinamento (mesmo valor), por faixa de ND.
export const maestria = (nd) => {
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
export const OVERRIDABLE = ["hp", "pe", "defesa", "cd", "rdGeral", "rdEspecifico", "movimento", "resParcial", "atencao"];

const INT = (x) => Math.floor(x); // INT() da planilha (ND > 0 → floor)

export function deriveAfty(creature) {
  const core = creature?.core ?? {};
  const a = creature?.attributes ?? {};
  const ov = creature?.statOverrides ?? {};

  const tipo = core.tipo || "combatente";
  const patamar = core.patamar || "comum";
  const nd = Math.max(1, core.nd ?? 1);
  const almaAtual = creature?.alma?.atual ?? 100;
  const almaMult = almaAtual / 100;
  const qntPE = creature?.qntPE || "normal";

  const attrBonus = resolveOrigemAttrBonus(creature);
  const nivelAlloc = creature?.attrNivel ?? {};
  const desenv = resolveDesenvolvimento(creature);
  // Equipamento primeiro: os acessórios de atributo entram no cálculo do
  // efetivo. A CARGA não sai daqui, porque depende do mod de Força final.
  // BT antecipado só para as Cargas de Encantamento das Ferramentas (= BT).
  const bt = maestria(nd);                                          // Maestria == Treinamento
  const equip = resolveEquipamentos(creature, bt);

  // Limite EFETIVO por atributo = limite base (20 / poderes) + Desenvolvimento, teto 30.
  const limBase = (creature?.attrLimite && typeof creature.attrLimite === "object") ? creature.attrLimite : {};
  const limiteEfOf = (key) => Math.min((limBase[key] ?? 20) + (desenv[key] || 0), 30);

  // Atributo EFETIVO = base + nível + Desenvolvimento + bônus de origem.
  // Atributos de ORIGEM NÃO passam o limite (salvo os que digam explicitamente — TODO).
  // base+nível+Desenvolvimento já cabem no limite por construção (o Desenvolvimento
  // eleva valor E limite juntos); o bônus de origem é limitado ao limite efetivo.
  // Acessório de atributo (Anéis do Conhecimento, Bracelete da Força...) é o
  // único bônus que PASSA o limite: o texto deles diz "podendo superar o seu
  // limite de atributo, até o máximo de 30". Por isso ele entra depois do
  // clamp do limite, contra o teto duro de 30.
  const eff = (key) => {
    const dentroDoLimite = Math.min(
      (a[key] ?? 10) + (nivelAlloc[key] || 0) + (desenv[key] || 0) + (attrBonus[key] || 0),
      limiteEfOf(key),
    );
    return Math.min(dentroDoLimite + (equip.attrBonus[key] || 0), 30);
  };

  // Modificadores (sobre o efetivo)
  const modFor = mod(eff("forca"));
  const modDes = mod(eff("destreza"));
  const modCon = mod(eff("constituicao"));
  const modInt = mod(eff("inteligencia"));
  const modSab = mod(eff("sabedoria"));
  const modPre = mod(eff("presenca"));
  const modByAttr = { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre };
  const attrEff = {
    forca: eff("forca"), destreza: eff("destreza"), constituicao: eff("constituicao"),
    inteligencia: eff("inteligencia"), sabedoria: eff("sabedoria"), presenca: eff("presenca"),
  };
  const attrLimiteEfetivo = {
    forca: limiteEfOf("forca"), destreza: limiteEfOf("destreza"), constituicao: limiteEfOf("constituicao"),
    inteligencia: limiteEfOf("inteligencia"), sabedoria: limiteEfOf("sabedoria"), presenca: limiteEfOf("presenca"),
  };

  // Mod. Técnica = modificador do atributo escolhido para a Técnica/CD
  const tecnicaAttr = core.tecnicaAttr || "inteligencia";
  const modTecnica = modByAttr[tecnicaAttr] ?? 0;

  const maxForDex = Math.max(modFor, modDes);                       // Z8:Z9
  const maxAllMods = Math.max(modFor, modDes, modCon, modInt, modSab, modPre); // Z8:Z13
  const treino = resolveTreinoEfeitos(creature);                   // contribuições dos Treinamentos
  // Carga só agora, com o mod de Força já fechado (inclui acessório).
  const carga = resolveCarga(equip.espacosUsados, modFor);
  const grau = grauFeiticeiro(nd);                                 // grau do feiticeiro por faixa de ND

  // ---------- HP (+ Treino de Resistência) ----------
  const hpBase =
    tipo === "combatente" ? 12 + (nd - 1) * 6 :
    tipo === "restringido" ? 12 * nd :
    /* misto | conjurador */ 10 + (nd - 1) * 5;
  const hpPatamarMult = HP_PATAMAR_MULT[patamar] ?? 1;
  // O bônus de item ("os seus pontos de vida máximos aumentam em 10") entra
  // DEPOIS da Alma e do Patamar, ao contrário do treino: é um valor fixo de
  // PV máximo, não uma parcela da base que o Patamar multiplicaria.
  const hp = Math.round(almaMult * (hpBase + nd * modCon + treino.hp) * hpPatamarMult) + equip.hpMaxBonus;

  // ---------- PE (+ Treinos de Compreensão/Controle de Energia/…) ----------
  const peBase =
    tipo === "conjurador" ? 6 * nd :
    tipo === "misto" ? 5 * nd :
    /* combatente | restringido */ 4 * nd;
  const peQnt =
    qntPE === "muito_pouca" ? -nd :
    qntPE === "pouca" ? -Math.floor(nd / 2) :
    qntPE === "grande" ? Math.floor(nd / 2) :
    qntPE === "muito_grande" ? nd : 0;
  const pe = peBase + peQnt + modTecnica + treino.pe + equip.peBonus;

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
  const movimento = 9 + maxForDex * 1.5 + treino.movimento + carga.movimento + equip.movimentoBonus;

  // ---------- RD Geral ----------
  const rdGeralBase =
    tipo === "conjurador" ? (nd >= 10 ? Math.floor(nd / 2) : 0) :
    tipo === "misto" ? (nd >= 10 ? nd : Math.floor(nd / 2)) :
    /* combatente | restringido */ (nd >= 10 ? maxAllMods : 0) + nd;
  const rdGeral = rdGeralBase + equip.rdGeralBonus;

  // ---------- RD Específico ----------
  const rdEspecifico =
    tipo === "conjurador" ? modTecnica :
    tipo === "misto" ? (nd >= 10 ? 2 * modTecnica : modTecnica) : 0;

  // ---------- CD ----------
  const cdTipo =
    tipo === "conjurador" ? INT(nd / 1.25) :
    tipo === "misto" ? INT(nd / 1.5) :
    /* combatente | restringido */ INT(nd / 1.75);
  const cd = 10 + cdTipo + (modTecnica + bt) + equip.cdBonus;

  // ---------- Feitiços ----------
  // Orçamento e acesso são fórmula fechada. A CD base dos Feitiços é a CD de
  // Feitiçaria da criatura (acima), que já usa o Atributo Principal da Técnica
  // (core.tecnicaAttr) e a Maestria. A criação de cada Feitiço só a desloca.
  const feiticosLista = Array.isArray(creature.feiticos) ? creature.feiticos : [];
  const feiticosGastos = feiticosLista.filter((f) => !f.variacaoDe).length;
  const feiticos = {
    total: totalFeiticos(nd),
    nivelMax: nivelMaxFeitico(nd),
    gastos: feiticosGastos,
    restante: totalFeiticos(nd) - feiticosGastos,
    excedeu: feiticosGastos > totalFeiticos(nd),
    cdBase: cd,
  };

  // ---------- Atenção (Percepção ADIADA → 0) ----------
  const atencao = 10 + 0;

  // ---------- RD Física (só escudo por ora) ----------
  // Canal NOVO, separado de RD Geral e RD Específico. O autor confirmou que
  // a RD do escudo é FÍSICA. O sistema de RD Física em si ainda vem.
  const rdFisico = equip.rdFisico;

  // ---------- Defesa / CA (+ uniforme, - sobrecarga; Treino de Luta ADIADO) ----------
  const defTipo =
    tipo === "conjurador" ? INT(nd / 1.75) :
    tipo === "misto" ? INT(nd / 1.5) :
    /* combatente | restringido */ INT(nd / 1.25);
  const defesa = 10 + defTipo + modDes + bt + treino.defesa + equip.uniformeDefesa + carga.defesa + equip.defesaBonus;

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
  const totalAptidao =
    aptidaoThresholds.reduce((s, [t, v]) => s + (nd >= t ? v : 0), 0) +
    (qntPE === "muito_grande" ? 1 : 0) +
    treino.aptidao;

  // Níveis por trilha: alocado (pago) + concedido (grátis, direcionado).
  // TODO: Habilidades de Especialização, Origens e Talentos também concedem
  // nível. Quando esses catálogos existirem, some as concessões deles aqui.
  const aptidao = resolveNiveisAptidao(creature?.aptidoes, treino.aptidaoTrilha);

  // Quantas Aptidões Amaldiçoadas a criatura PODE ter (regra do autor,
  // 2026-07-16): 1 no ND 1, mais 1 a cada 3 ND (3, 6, 9, 12, ...).
  // Sem teto (ND 1 → ∞), ao contrário do orçamento de NÍVEIS de aptidão,
  // que para no ND 20. São dois orçamentos separados e independentes.
  const totalAptidoesAmaldicoadas = 1 + Math.floor(nd / 3);

  // Especializações: NÃO entram em nenhum stat (quem dirige fórmula é o
  // Tipo). Resolvidas aqui só para a UI e a validação lerem de um lugar
  // só, como o resto dos derivados. O orçamento de níveis é o próprio ND.
  const especializacoes = resolveEspecializacoes(creature);

  // Habilidades de Especialização: orçamento ÚNICO (1 + floor(ND/3), igual
  // ao das Aptidões Amaldiçoadas) cobrindo Base e por Nível juntas. O que
  // muda por especialização é o ACESSO, que lê o nível do lado da
  // multiclasse — por isso depende do resolve de Especializações.
  // ⚠ Nenhum EFEITO de habilidade é aplicado ainda (ver docs/afty-status.md).
  //
  // Talentos dividem ESSE orçamento ("obtidos no lugar de habilidades de
  // especialização"), então são resolvidos ANTES e o gasto entra no cômputo.
  // Eles não pertencem a especialização nenhuma: o acesso lê o ND, a origem e
  // os atributos efetivos, nunca o nível de classe.
  const talentos = resolveTalentos(creature, {
    nd,
    attrEff,
    origemId: creature?.core?.origem?.id ?? null,
  });
  // bt entra por causa do Roubo de Habilidade, cujo limite de repetições é o
  // Bônus de Treinamento, e não o tamanho do pool.
  const habilidades = resolveHabilidades(creature, especializacoes.escolhidas, talentos.gastos, bt);

  // Alto Nível (21+): Melhorias Superiores e Habilidades Lendárias. Orçamentos
  // PRÓPRIOS, um por nível ímpar e um por nível par a partir do 21/22, sem
  // relação com o orçamento de Habilidades. Não dependem de especialização: só
  // as Habilidades Ápice leem nível de classe, e no pré-requisito.
  // ⚠ Nenhum EFEITO é aplicado (mesmo bloqueio das Habilidades, ver docs).
  const altoNivel = resolveAltoNivel(creature, {
    niveisPorEspec: habilidades.niveisPorEspec,
    habilidades: habilidades.escolhidas,
  });

  // Invocações: a invocação lê valores do DONO (ND, BT = maestria(ND) e o Nível
  // de Controlador, o lado da multiclasse). Resolvidas aqui só para a UI e a
  // validação lerem de um lugar só. NÃO alimentam nenhum stat do dono.
  // Invocações usam o nível de ESCALONAMENTO de Controlador (real + metade da
  // outra classe): acesso a graus, metade do nível no bônus de teste, e os
  // limiares 6/12/18 de Invocações Móveis. Pré-requisitos de habilidade usam o real.
  const nivelControlador = especializacoes.escolhidas.find((e) => e.id === "controlador")?.nivelEscalonamento ?? 0;
  // Efeitos estáticos das Habilidades de Controlador escolhidas, aplicados a
  // TODAS as invocações do dono (via Motor de Automação, ver afty-habilidades.js).
  const efeitosInvoc = efeitosInvocacaoControlador(habilidades.escolhidas);
  // Concentrar Poder (6°): marca até floor(BT/2) invocações. O limite alimenta o
  // contador/validação da UI; o efeito em si é filtrado por `marcada` no motor.
  const temConcentrarPoder = habilidades.escolhidas.includes("ctr_concentrar_poder");
  const concentrarPoder = { ativo: temConcentrarPoder, limite: temConcentrarPoder ? Math.floor(bt / 2) : 0 };
  const donoInvoc = { nd, bt, nivelControlador, efeitos: efeitosInvoc, concentrarPoder };
  const invocacoes = resolveInvocacoesList(creature?.invocacoes, donoInvoc);
  const hordas = resolveHordasList(creature?.hordas, creature?.invocacoes, donoInvoc);

  // Focos de interlúdio (orçamento de Treinamento) = ND + Outros.
  // "Outros" = bônus de poderes que concedem treinos (sistema futuro),
  // lido de creature.focosBonus (0 por ora).
  const focosTotais = nd + (creature?.focosBonus ?? 0);

  // (Pontos de atributo agora vêm do método + pool de nível — ver afty-atributos.js.)

  // ---------- overrides de valor final (aba Cálculos) ----------
  const calc = { hp, pe, defesa, cd, rdGeral, rdEspecifico, movimento, resParcial, atencao };
  const stats = {};
  for (const k of OVERRIDABLE) stats[k] = ov[k] != null ? ov[k] : calc[k];
  const isOverridden = (k) => ov[k] != null;

  return {
    ...stats,
    // metadados / valores não sobrescrevíveis
    calc,                 // valores calculados (antes do override)
    isOverridden,
    maestria: bt,
    almaMult,
    modTecnica,
    tecnicaAttr,
    totalAptidao,               // orçamento de NÍVEIS de aptidão (para no ND 20)
    totalAptidoesAmaldicoadas,  // quantas Aptidões Amaldiçoadas pode ter (sem teto)
    aptidao,              // níveis por trilha: { alocado, concedido, efetivo, gastos }
    feiticos,             // { total, nivelMax, gastos, restante, excedeu, cdBase }
    especializacoes,      // { escolhidas, total, max, obrigatoria, completa, erro }
    habilidades,          // { escolhidas, total, gastos, restante, excedeu, inacessiveis, niveisPorEspec }
    talentos,             // { escolhidas, gastos, inacessiveis } — gasto já somado em habilidades.gastos
    altoNivel,            // { ativo, melhorias, lendarias, escolhas, apiceId } — orçamentos próprios
    invocacoes,           // { lista, total, custoTotal, temWarnings }
    hordas,               // { lista, total, custoTotal } (líder + membros escalados)
    focosTotais,          // orçamento de Focos de interlúdio = ND + bônus de poderes
    treino,               // contribuições agregadas dos Treinamentos (hp/pe/movimento/aptidao/defesa)
    nd, tipo, patamar,
    mods: { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre },
    attrEff,              // valor EFETIVO por atributo (base+nível+desenv+origem, teto 30)
    attrLimiteEfetivo,    // limite por atributo (base + Desenvolvimento, teto 30)
    attrDesenv: desenv,   // pontos de Desenvolvimento Inesperado por atributo
    attrBonus,            // bônus de atributo da origem (efetivo)
    // ---------- Equipamentos ----------
    grauFeiticeiro: grau,  // { value, label, rank, ndMin } derivado do ND
    equip,                 // parcelas do equipamento (entradas, custoGasto, avisos...)
    carga,                 // { espacosUsados, cargaLimite, cargaMaxima, sobrecarregado... }
    rdFisico,              // RD Física (escudo). Canal separado da RD Geral.
    penalidadeDestreza: equip.penalidadeDestreza, // uniforme + escudos, cumulativos
    guarda: null,         // TODO: depende do contador de ataques consecutivos
  };
}
