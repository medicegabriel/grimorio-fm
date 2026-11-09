// Livro p.181, 182 e 246. Clientes de recibos prospectivos de Feitiço e Expansão.
import {
  ATIVAR_REVESTIMENTO, ID_ANULAR_TECNICA as ANULAR, ID_PETALA_DECADENTE as PETALA,
  ID_REVESTIMENTO_DE_DOMINIO as REVESTIR, NIVEL_DO_FUNCIONAMENTO_BASICO, PETALA_CONTRA_ATAQUE,
  custoDeAnularAcertoGarantido, custoSustentarRevestimento, disputaAnularTecnica, podeAnularNivel,
  reducaoDeDanoDoRevestimento, revestimentoAnulaTecnica, usosAnularTecnica,
} from "../afty-conteudo-antidominio";
import { aptidaoDeConteudoDisponivel as tem, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { identificador, reciboProspectivo } from "./ficha-cx3-recibo-prospectivo";
import { usa } from "./ficha-uso";
import { usoDe } from "./ficha-uso-estado";

const recusa = (sessao, erro, extra) => ({ sessao, aplicado: false, erro, ...extra });
const inteiroNaoNegativo = (n) => Number.isSafeInteger(n) && n >= 0;
const DOM = (d) => d.aptidao?.efetivo?.dom ?? 0;
const OFENSIVA = `${PETALA}:ofensiva`;
const comum = {
  emCombate: true, cobranca: "confirmada", acesso: impedimentoParaAgirConteudo,
  proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
};

function usaParaRecibo(sessao, derived, desc, recibo, mesa) {
  return usa(sessao, derived, { ...comum, ...desc }, {
    opId: JSON.stringify([desc.id, recibo.id, mesa.alvoId]), registraAcao: true,
  });
}

/** Os totais de Feitiçaria já escolhidos vêm do provedor e pertencem a esta disputa. */
export function tentaAnularTecnica(sessao, derived, { recibo, mesa, disputa, regraCusto, empate } = {}) {
  if (!tem(derived, ANULAR) || !reciboProspectivo(recibo, mesa, "feitico")) return recusa(sessao, "Anular Técnica Indisponível");
  if (!Number.isSafeInteger(recibo.nivel) || !podeAnularNivel(recibo.nivel, derived.feiticos?.nivelMax)) {
    return recusa(sessao, "Nível de Feitiço Fora do Acesso");
  }
  const pe = regraCusto === "base" ? recibo.custoBase : regraCusto === "efetivo" || recibo.custoBase === recibo.custoEfetivo
    ? recibo.custoEfetivo : null;
  if (!inteiroNaoNegativo(pe)) return recusa(sessao, "Falta Confirmar o Custo da Conjuração", { pendente: "custo" });
  if (disputa?.feiticoId !== recibo.id || disputa?.origemId !== mesa.origemId || disputa?.alvoId !== mesa.alvoId
    || !Number.isSafeInteger(disputa.conjurador) || !Number.isSafeInteger(disputa.defensor)) return recusa(sessao, "Falta Disputa de Feitiçaria");
  const resultado = disputaAnularTecnica(disputa.defensor, disputa.conjurador);
  if (resultado === "empate" && !["anula", "falha"].includes(empate)) {
    return recusa(sessao, "Empate na Disputa de Feitiçaria", { pendente: "empate" });
  }
  const uso = usaParaRecibo(sessao, derived, {
    id: ANULAR, nome: "Anular Técnica", acao: "reacao", custo: { pe },
    usos: { chave: `aptidao:${ANULAR}`, max: usosAnularTecnica(DOM(derived)) },
  }, recibo, mesa);
  if (!uso.aplicado) return uso;
  return { ...uso, cancelamento: (resultado === "anula" || (resultado === "empate" && empate === "anula"))
    ? { feiticoId: recibo.id, afetados: [...recibo.afetados] } : null };
}

function ativa(sessao, derived, { recibo, mesa, acao, emSeuTurno }, pedido, regra) {
  const { id, nome, pe, tipo, concentracao } = regra;
  if (!tem(derived, id) || (acao !== "bonus" && acao !== "reacao")) return recusa(sessao, `${nome} Indisponível`);
  if (acao === "bonus" && emSeuTurno !== true) return recusa(sessao, "Exige Seu Turno");
  if (acao === "reacao" && !reciboProspectivo(recibo, mesa, tipo)) return recusa(sessao, "Falta o Recibo do Gatilho");
  const u = usoDe(sessao), turno = u.acoes.turno;
  const vencido = id === REVESTIR && u.ativos[id]?.parametros?.turno < turno;
  return usa(sessao, derived, {
    ...comum, id, nome, acao, custo: { pe }, concentracao, renova: vencido, duracao: { ate: "cena" },
    parametros: [{ id: "turno", tipo: "faixa", min: turno, max: turno, padrao: turno }],
  }, { ...pedido, parametros: { turno }, registraAcao: true });
}

export function ativaPetala(sessao, derived, entrada = {}, pedido = {}) {
  return ativa(sessao, derived, entrada, pedido, {
    id: PETALA, nome: "Emoção da Pétala Decadente", pe: 0, tipo: "aberturaExpansao", concentracao: true,
  });
}

const petalaAtiva = (s) => !!usoDe(s).ativos[PETALA] && usoDe(s).concentracao?.id === PETALA;

export function protegeComPetala(sessao, derived, { recibo, mesa } = {}) {
  if (!petalaAtiva(sessao) || !tem(derived, PETALA) || usoDe(sessao).ativos[OFENSIVA]) {
    return recusa(sessao, "Defesa da Pétala Indisponível");
  }
  if (!reciboProspectivo(recibo, mesa, "acertoGarantido") || !identificador(recibo.expansaoId)
    || recibo.contatoFisico !== true || !inteiroNaoNegativo(recibo.dom)) return recusa(sessao, "Falta Acerto Garantido Físico");
  const uso = usaParaRecibo(sessao, derived, {
    id: `${PETALA}:defesa`, nome: "Emoção da Pétala Decadente", custo: { pe: custoDeAnularAcertoGarantido(recibo.dom) },
  }, recibo, mesa);
  return uso.aplicado ? { ...uso, cancelaAcertoId: recibo.id } : uso;
}

/** O provedor confere posição, contato anterior e alcance da linha escolhida. */
export function contraAtacaComPetala(sessao, derived, { recibo, mesa, linha } = {}) {
  if (!petalaAtiva(sessao) || !tem(derived, PETALA)) return recusa(sessao, "Pétala Indisponível");
  if (!reciboProspectivo(recibo, mesa, "alcancePetala") || !["entrou", "inicioTurno"].includes(recibo.gatilho)
    || recibo.origemId === mesa.alvoId || recibo.aoAlcance !== true
    || (recibo.gatilho === "inicioTurno" && mesa.turno.id !== mesa.origemId)
    || !derived.dano?.entradas?.includes(linha) || (linha.ataqueId ?? linha.categoria) !== "corpo") {
    return recusa(sessao, "Falta Alvo ao Alcance Corpo a Corpo");
  }
  const uso = usaParaRecibo(sessao, derived, {
    id: OFENSIVA, nome: "Contra-Ataque da Pétala", acao: PETALA_CONTRA_ATAQUE.acao,
    custo: { pe: PETALA_CONTRA_ATAQUE.pe }, duracao: { ate: "inicioDoProximoTurno" },
  }, recibo, mesa);
  return uso.aplicado ? { ...uso, ataque: { origemId: mesa.origemId, alvoId: mesa.alvoId,
    armaId: linha.id, chaveArma: linha.chaveArma ?? null, categoria: "corpo", acertoGarantido: true } } : uso;
}

export function ativaRevestimento(sessao, derived, entrada = {}, pedido = {}) {
  return ativa(sessao, derived, entrada, pedido, {
    id: REVESTIR, nome: "Revestimento de Domínio", pe: ATIVAR_REVESTIMENTO.pe, tipo: "feitico", concentracao: false,
  });
}

const revestimentoAtivo = (s) => usoDe(s).ativos[REVESTIR]?.parametros?.turno === usoDe(s).acoes.turno;

/** O início do turno e a idade da mesma Expansão vêm do provedor. */
export function sustentaRevestimento(sessao, derived, { inicioDoTurno, rodadaDaExpansao = 0, escalada } = {}, pedido = {}) {
  const u = usoDe(sessao), anterior = u.ativos[REVESTIR], turno = u.acoes.turno;
  if (!tem(derived, REVESTIR) || inicioDoTurno !== true || !anterior || anterior.parametros.turno !== turno - 1) {
    return recusa(sessao, "Revestimento Não Pode Ser Sustentado");
  }
  if (!inteiroNaoNegativo(rodadaDaExpansao) || (rodadaDaExpansao > 1 && !["segunda", "terceira"].includes(escalada))) {
    return recusa(sessao, "Falta Confirmar a Escalada do Revestimento", { pendente: "escalada" });
  }
  const pe = custoSustentarRevestimento(rodadaDaExpansao - Number(escalada === "terceira"));
  return usa(sessao, derived, { ...comum, id: REVESTIR, nome: anterior.nome, renova: true, custo: { pe },
    duracao: { ate: "cena" }, parametros: [{ id: "turno", tipo: "faixa", min: turno, max: turno, padrao: turno }],
  }, { ...pedido, parametros: { turno } });
}

export function efeitoContraRevestimento(sessao, derived, { recibo, mesa } = {}) {
  if (!revestimentoAtivo(sessao) || !tem(derived, REVESTIR)) return null;
  if (reciboProspectivo(recibo, mesa, "efeitoExpansao") && identificador(recibo.expansaoId)) return { anula: true };
  if (!reciboProspectivo(recibo, mesa, "feitico") || !Number.isSafeInteger(recibo.nivel) || recibo.nivel < 1
    || typeof recibo.afetaEnergia !== "boolean" || typeof recibo.ofensivo !== "boolean") return null;
  if (recibo.afetaEnergia) return { anula: false, reducaoFixa: 0 };
  const anula = revestimentoAnulaTecnica(recibo.nivel, DOM(derived));
  return { anula, reducaoFixa: !anula && recibo.ofensivo ? reducaoDeDanoDoRevestimento(derived.nd) : 0 };
}

export function bloqueioDeFeiticoPorRevestimento(sessao, derived) {
  return revestimentoAtivo(sessao) && tem(derived, REVESTIR) ? "Revestimento de Domínio Impede Conjuração" : null;
}

/** A lista vem do alvo e conserva a identidade de cada efeito rastreado. */
export function efeitosSuprimidosPorGolpeRevestido(sessao, derived, { acertou, efeitos = [] } = {}) {
  if (acertou !== true || !revestimentoAtivo(sessao) || !tem(derived, REVESTIR)) return [];
  return efeitos.filter((e) => identificador(e.id) && (e.tipo === "funcionamentoBasico"
    || (e.tipo === "feitico" && Number.isSafeInteger(e.nivel) && ["passivo", "ativo", "sustentado", "duradouro"].includes(e.duracao)))
    && revestimentoAnulaTecnica(e.tipo === "funcionamentoBasico" ? NIVEL_DO_FUNCIONAMENTO_BASICO : e.nivel, DOM(derived))).map((e) => e.id);
}
