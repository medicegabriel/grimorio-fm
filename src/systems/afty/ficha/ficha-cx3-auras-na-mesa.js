// Livro p.174 a 177 e p.179. Posição e identidade pertencem à mesa.
import { fichaDaCondicao } from "../afty-condicoes";
import { aptidaoDeConteudoDisponivel as tem, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { alcancesDasAurasPassivas } from "./ficha-conteudo-expandir-aura";
import { resolveTR } from "./ficha-ataque";
import { aplicaDanoRecebido } from "./ficha-dano-recebido";
import { identificador, reciboProspectivo } from "./ficha-cx3-recibo-prospectivo";
import { defineCondicoes, marcaUso, usosGastosDe } from "./ficha-sessao";
import { usa } from "./ficha-uso";
import { comOperacao, jaAplicada, usoDe } from "./ficha-uso-estado";

const MACABRA = "aura_macabra";
const CHAMATIVA = "aura_chamativa";
const LACERANTE = "aura_lacerante";
const BASTIAO = "aura_do_bastiao";
const COMANDANTE = "aura_do_comandante";
const EVOLUIDA = "aura_do_comandante_evoluida";
const CASULO = "casulo_de_energia";
const ANULADORA = "aura_anuladora";
const EXPANSAO_MACABRA = `${MACABRA}:amplia`;
const nivelAura = (d) => d.aptidao?.efetivo?.au ?? 0;
const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const comum = { emCombate: true, cobranca: "confirmada", acesso: impedimentoParaAgirConteudo };
const nomes = {
  [MACABRA]: "Aura Macabra", [LACERANTE]: "Aura Lacerante", [COMANDANTE]: "Aura do Comandante", [CASULO]: "Casulo de Energia",
};

export function ativaAuraDeMesa(sessao, derived, { id, emSeuTurno, evoluida = false } = {}, pedido = {}) {
  const regras = {
    [MACABRA]: { acao: "livre", pe: 1 }, [LACERANTE]: { acao: "livre", pe: 0 },
    [CASULO]: { acao: "comum", pe: 6 }, [COMANDANTE]: { acao: "bonus", pe: 0 },
  };
  const regra = Object.hasOwn(regras, id) && regras[id];
  if (!regra || !tem(derived, id) || emSeuTurno !== true || (evoluida && (id !== COMANDANTE || !tem(derived, EVOLUIDA)))) {
    return recusa(sessao, "Ativação de Aura Indisponível");
  }
  const u = usoDe(sessao), turno = u.acoes.turno;
  const desc = { ...comum, id: id === MACABRA ? EXPANSAO_MACABRA : id, nome: nomes[id],
    acao: regra.acao, custo: { pe: regra.pe }, duracao: id === COMANDANTE ? { ate: "cena" } : { rodadas: 1 } };
  if (id === COMANDANTE) {
    desc.renova = u.ativos[id]?.parametros?.turno < turno;
    desc.parametros = [{ id: "turno", tipo: "faixa", min: turno, max: turno }, { id: "evoluida", tipo: "bool" }];
  }
  return usa(sessao, derived, desc, { ...pedido, registraAcao: true, parametros: { turno, evoluida } });
}

export function sustentaComandante(sessao, derived, { inicioDoTurno } = {}, pedido = {}) {
  const u = usoDe(sessao), ativo = u.ativos[COMANDANTE], turno = u.acoes.turno;
  if (!tem(derived, COMANDANTE) || inicioDoTurno !== true || ativo?.parametros?.turno !== turno - 1) {
    return recusa(sessao, "Manutenção do Comandante Indisponível");
  }
  const { evoluida } = ativo.parametros;
  return usa(sessao, derived, { ...comum, id: COMANDANTE, nome: nomes[COMANDANTE], renova: true,
    custo: { pe: evoluida ? 4 : 2 }, duracao: { ate: "cena" },
    parametros: [{ id: "turno", tipo: "faixa", min: turno, max: turno }, { id: "evoluida", tipo: "bool" }],
  }, { ...pedido, parametros: { turno, evoluida } });
}

/** A ficha do emissor é a fonte do alcance. A posição do alvo pertence à sessão. */
export function auraParaDestinatario(sessao, derived, { id, distancia, aliado, agressivo, regraMacabra } = {}) {
  if (!Number.isFinite(distancia) || distancia < 0 || !tem(derived, id)) return null;
  const u = usoDe(sessao), au = nivelAura(derived);
  const passiva = alcancesDasAurasPassivas(sessao, derived).find((a) => a.id === id);
  if (passiva?.suspensa) return null;
  let alcance = passiva?.atual;
  let beneficios;
  if (id === CHAMATIVA && aliado !== false || id === MACABRA && agressivo !== true
    || [BASTIAO, COMANDANTE].includes(id) && aliado !== true) return null;
  if (id === MACABRA && u.ativos[EXPANSAO_MACABRA]) {
    if (passiva?.expandido && !["base", "macabra", "ambas"].includes(regraMacabra)) return { pendente: "alcanceMacabra" };
    if (regraMacabra !== "base" || !passiva?.expandido) alcance = passiva?.expandido && regraMacabra === "ambas" ? 9 : 4.5;
  }
  if (id === LACERANTE && u.ativos[LACERANTE]) alcance = 3;
  if (id === BASTIAO && au > 0) beneficios = [{ canal: "defesa", valor: au }];
  if (id === COMANDANTE && u.ativos[COMANDANTE]?.parametros?.turno === u.acoes.turno) {
    alcance = 4.5;
    const { evoluida } = u.ativos[COMANDANTE].parametros;
    const valor = evoluida ? au : 1 + Math.floor(au / 2);
    beneficios = [{ canal: "danoBonus", valor, quando: "em_combate" }, { canal: "bonusPericia", valor, quando: "em_combate" },
      ...(evoluida ? [{ canal: "bonusAcerto", valor: 2 }, { canal: "bonusTR", valor: 2 }] : [])];
  }
  return Number.isFinite(alcance) && distancia <= alcance ? { alcance, ...(beneficios ? { beneficios } : {}) } : null;
}

export function anulaCondicaoComAura(sessao, derived, { recibo, mesa } = {}) {
  if (!tem(derived, ANULADORA) || !reciboProspectivo(recibo, mesa, "condicao") || !identificador(recibo.condicao?.nome)
    || recibo.manobra !== false || recibo.origemFisica !== false) return recusa(sessao, "Condição Fora da Aura Anuladora");
  const { nivel } = fichaDaCondicao(recibo.condicao.nome, recibo.condicao.forca);
  const pe = [0, 2, 4, 6, 10][nivel];
  if (!pe) return recusa(sessao, "Condição sem Custo de Anulação");
  const uso = usa(sessao, derived, { ...comum, emCombate: false, id: ANULADORA, nome: "Aura Anuladora", custo: { pe },
    usos: { chave: `aptidao:${ANULADORA}`, max: derived.maestria },
  }, { opId: JSON.stringify([ANULADORA, recibo.id, mesa.alvoId]) });
  return uso.aplicado ? { ...uso, ignoraCondicaoId: recibo.id } : uso;
}

/** Chega à preparação de CL1 com a natureza individual de cada parcela. */
export function defesaDoCasulo(sessao, derived, { origem, tipo } = {}) {
  if (!tem(derived, CASULO) || !usoDe(sessao).ativos[CASULO] || !["ct", "pf", "im"].includes(tipo)) return null;
  if (origem === "mundana") return { imune: true };
  if (origem === "tecnica") return { rdAdicional: 2 * nivelAura(derived) };
  return null;
}

function alvoDaAura(origem, sessao, id, entrada) {
  const { recibo, mesa, posicao } = entrada;
  if (!reciboProspectivo(recibo, mesa, "inicioTurnoAura") || mesa.turno.id !== mesa.alvoId
    || mesa.alvoId === mesa.origemId || usoDe(sessao).acoes.turno !== mesa.turno.turno
    || sessao.rodada !== mesa.turno.rodada || sessao.vital?.estado === "morto") return null;
  const condicaoId = JSON.stringify([id, mesa.origemId]);
  const repeticao = id !== LACERANTE && sessao.condicoes?.some((c) => c.id === condicaoId);
  const area = auraParaDestinatario(origem.sessao, origem.derived, { ...posicao, id });
  if (area?.pendente || (!repeticao && !area)) return null;
  return { condicaoId, falhasId: `cena:${condicaoId}`,
    opId: JSON.stringify([id, mesa.origemId, mesa.alvoId, mesa.turno.rodada, mesa.turno.turno]) };
}

/** Parâmetros para a rolagem nativa do destinatário, antes de resolver a consequência. */
export function preparaTrDaAura(origem, sessao, { id, ...entrada } = {}) {
  if (![CHAMATIVA, MACABRA, LACERANTE].includes(id)) return null;
  const alvo = alvoDaAura(origem, sessao, id, entrada);
  if (!alvo || jaAplicada(sessao, alvo.opId)) return null;
  return { id: alvo.opId, cd: origem.derived.cd, resistencia: id === LACERANTE ? "fortitude" : "vontade",
    bonus: id === CHAMATIVA ? 2 * usosGastosDe(sessao, alvo.falhasId) : 0 };
}

/** O provedor guarda a rolagem e as rerrolagens. Este cliente só finaliza a escolhida. */
export function aplicaTrDaAura(origem, sessao, derived, { id, teste, imune, rolaDanoLacerante, ...entrada } = {}) {
  const tr = preparaTrDaAura(origem, sessao, { id, ...entrada });
  if (!tr || teste?.gatilhoId !== tr.id || teste?.resistenciaId !== tr.resistencia
    || teste?.bonusDaAura !== tr.bonus || !Number.isSafeInteger(teste.total) || teste.sorte?.escolha === null
    || typeof imune !== "boolean") return recusa(sessao, "Falta TR da Aura");
  const alvo = alvoDaAura(origem, sessao, id, entrada), resultado = resolveTR({ cd: tr.cd, rolagem: teste });
  if (!resultado.ok) return recusa(sessao, resultado.erro);
  let nova = sessao, dano;
  if (id === LACERANTE && resultado.resultado === "falha" && !imune) {
    const au = nivelAura(origem.derived), faces = au >= 5 ? 10 : au >= 3 ? 8 : 6;
    const dados = rolaDanoLacerante?.(au, faces);
    if (!Array.isArray(dados) || dados.length !== au || !dados.every((d) => Number.isInteger(d) && d >= 1 && d <= faces)) {
      return recusa(sessao, "Falta Dano da Aura Lacerante");
    }
    dano = aplicaDanoRecebido(sessao, derived, { total: dados.reduce((n, d) => n + d, origem.derived.modTecnica ?? 0),
      tipo: "energetico", desempate: entrada.desempate }, { opId: `${alvo.opId}:dano` });
    if (!dano.aplicado) return dano;
    nova = dano.sessao;
  }
  if (id !== LACERANTE) {
    const condicoes = (sessao.condicoes ?? []).filter((c) => c.id !== alvo.condicaoId);
    if (resultado.resultado === "falha" && !imune) {
      const nome = id === CHAMATIVA ? "Enfeitiçado" : nivelAura(origem.derived) >= 3 ? "Amedrontado" : "Abalado";
      condicoes.push({ id: alvo.condicaoId, nome, rodadas: null });
      if (id === CHAMATIVA) nova = marcaUso(nova, { chave: alvo.falhasId, max: Number.MAX_SAFE_INTEGER }, 1);
    }
    nova = defineCondicoes(nova, condicoes);
  }
  return { sessao: comOperacao(nova, { id: alvo.opId, tipo: id }), aplicado: true, tr: resultado, ...(dano ? { dano: dano.calculo } : {}) };
}
