/**
 * ============================================================
 * O REGISTRO DAS OPERAÇÕES DA ABA EFEITOS, DENTRO DA SESSÃO
 * ============================================================
 * ⚠ UMA SESSÃO SÓ. A aba Efeitos, o cabeçalho, as Ações e as outras abas leem e operam sobre a MESMA sessão (`ficha-sessao.js`), e
 * nenhum estado de jogo mora numa cópia à parte. O que a camada dos Efeitos precisa guardar além dos campos que a sessão já tinha é
 * só METADADO das operações, e mora num campo novo da própria sessão, `operacoes`:
 *
 *   eventos       o histórico de operações, do mais recente ao mais antigo (até 80), cada um com o `ts` REAL e a rodada
 *   ativacoes     o registro de cada gasto de PE por id: o que o "Estornar PE" consulta e marca como desfeito
 *   reusos        quantos usos novos / golpes pagos cada efeito já teve (o contador que o clique duplo não passa)
 *   pvConcessoes  a concessão de PV Temporário que já foi para a Vida, por benefício (consumir o pote não a reabre)
 *   encerrados    os efeitos encerrados nesta sessão, para o Reativar (até 6)
 *
 * Fica FORA do que o motor lê: nenhum derive olha para `operacoes`. Sobrevive ao `aparaSessao` e ao `descansar` porque eles espalham
 * a sessão (`...sessao`), e o descanso a limpa por uma regra explícita (`descansaComRegistro`).
 *
 * `daSessao` monta a "mesa" que as operações puras esperam (`operacoes.js`) e `paraSessao` desfaz, devolvendo a sessão com o registro
 * novo. Quem opera chama as duas dentro de UM `atualiza`, então a operação roda sobre a sessão que estiver valendo, atômica.
 * ============================================================
 */
import * as Sessao from "../ficha-sessao";
import { MAX_EVENTOS, avancarRodada, comEvento } from "./mesa-verbos";
import { depoisDaVirada } from "./efeitos-dados";

const MAX_ENCERRADOS = 6;
const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
const textoOu = (v, padrao = "") => (typeof v === "string" ? v : padrao);

const operacoesVazias = () => ({ eventos: [], ativacoes: {}, reusos: {}, pvConcessoes: {}, encerrados: [] });

/**
 * Sanea o registro vindo do armazenamento, do export ou de um Encontro. Lixo, formato errado e campo ausente viram o padrão seguro, e
 * NUNCA derrubam a Ficha. Um evento antigo sem `ts` fica sem horário (o histórico não inventa um).
 */
function normalizaOperacoes(bruto) {
  const b = objeto(bruto);
  if (!b) return operacoesVazias();
  const eventos = (Array.isArray(b.eventos) ? b.eventos : [])
    .filter((e) => objeto(e) && typeof e.id === "string" && typeof e.tipo === "string")
    .slice(0, MAX_EVENTOS);
  const ativacoes = {};
  for (const [id, a] of Object.entries(objeto(b.ativacoes) ?? {})) {
    if (!objeto(a) || typeof a.tipo !== "string") continue;
    ativacoes[id] = { ...a, id: textoOu(a.id, id), desfeita: !!a.desfeita, custo: inteiro(a.custo), pago: { casca: objeto(a.pago?.casca) ?? {}, reserva: inteiro(a.pago?.reserva) } };
  }
  const reusos = {};
  for (const [k, v] of Object.entries(objeto(b.reusos) ?? {})) if (inteiro(v) > 0) reusos[k] = inteiro(v);
  const pvConcessoes = {};
  for (const [k, v] of Object.entries(objeto(b.pvConcessoes) ?? {})) {
    if (objeto(v)) pvConcessoes[k] = { ...v, valor: inteiro(v.valor), fonte: textoOu(v.fonte), rodada: inteiro(v.rodada) };
  }
  const encerrados = (Array.isArray(b.encerrados) ? b.encerrados : [])
    .filter((x) => objeto(x) && typeof x.chave === "string" && objeto(x.restaurar))
    .slice(0, MAX_ENCERRADOS);
  return { eventos, ativacoes, reusos, pvConcessoes, encerrados };
}

/** A mesa que as operações puras recebem: a sessão e o registro das operações, lado a lado. `ui.encerrados` é o que o Reativar lê. */
export function daSessao(sessao) {
  const o = normalizaOperacoes(sessao?.operacoes);
  return { sessao, eventos: o.eventos, ativacoes: o.ativacoes, reusos: o.reusos, pvConcessoes: o.pvConcessoes, ui: { encerrados: o.encerrados } };
}

/** A sessão de volta, com o registro das operações da mesa que a operação devolveu. */
export function paraSessao(mesa) {
  const eventos = mesa.eventos ?? [];
  /* A ativação sem evento no histórico (o evento saiu do teto de 80) não tem mais ninguém que a consulte, e não fica guardada. */
  const vivas = new Set(eventos.map((e) => e.ativacaoId).filter(Boolean));
  return {
    ...mesa.sessao,
    operacoes: {
      eventos,
      ativacoes: Object.fromEntries(Object.entries(mesa.ativacoes ?? {}).filter(([id]) => vivas.has(id))),
      reusos: mesa.reusos ?? {},
      pvConcessoes: mesa.pvConcessoes ?? {},
      encerrados: (mesa.ui?.encerrados ?? []).slice(0, MAX_ENCERRADOS),
    },
  };
}

/**
 * A próxima rodada pela virada REAL do motor, com a nota no histórico (renovação, cobrança, encerramento e Exaustão, lidos do registro
 * que o verbo grava no ponto em que cada coisa acontece). É a ÚNICA virada: a Ficha e a Linha do Tempo chamam o mesmo verbo e dão o mesmo
 * acabamento (`depoisDaVirada`: a renovação da Postura da Terra pelo Invencível é a mesma reserva da Terra registrada à mão).
 */
export function avancaRodadaComRegistro(sessao, derived, opcoes = {}) {
  return paraSessao(depoisDaVirada(avancarRodada(daSessao(sessao), derived, opcoes).mesa));
}

/**
 * O descanso pelo verbo do motor, mais o que é da camada dos Efeitos: o evento no histórico, e uma REGRA EXPLÍCITA para o que o
 * descanso apaga do registro. Os usos novos e as concessões de PV registradas são da cena que acabou (o descanso devolve usos, zera
 * os estados e esvazia o pote de PV Temporário), e os encerrados também. O histórico de eventos fica, com o horário real.
 */
export function descansaComRegistro(sessao, derived, opcoes = {}) {
  const depois = Sessao.descansar(sessao, derived, opcoes);
  if (depois === sessao) return sessao;
  const mesa = daSessao(depois);
  const limpa = { ...mesa, reusos: {}, pvConcessoes: {}, ui: { ...mesa.ui, encerrados: [] } };
  return paraSessao(comEvento(limpa, { tipo: "info", texto: "Descanso: recursos devolvidos e rodada zerada" }));
}
