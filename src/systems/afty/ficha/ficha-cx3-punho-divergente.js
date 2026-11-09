// Livro p.181. O relógio é declarado pelo integrador após a decisão P2.
import { cdPunhoDivergente, metadesDoPunhoDivergente } from "../afty-conteudo-antidominio";
import { resolveTR } from "./ficha-ataque";
import { aptidaoDeConteudoDisponivel } from "./ficha-conteudo-acesso";
import { aplicaDanoRecebido } from "./ficha-dano-recebido";
import { identificador, reciboProspectivo } from "./ficha-cx3-recibo-prospectivo";
import { rolarTeste } from "./ficha-rolagem";
import { registraRolagem } from "./ficha-sessao";
import { comOperacao, jaAplicada } from "./ficha-uso-estado";

const ID = "punho_divergente";
const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const chave = (etapa, punho) => JSON.stringify([ID, etapa, punho.id, punho.alvoId]);

/** Sem ligação ao modificador de Estilo das Sombras. A metade imediata volta ao ataque original. */
export function preparaPunhoDivergente(derived, { recibo, mesa, linha, proximoTurno, resto } = {}) {
  if (!aptidaoDeConteudoDisponivel(derived, ID) || !reciboProspectivo(recibo, mesa, "ataque")
    || recibo.acertou !== true || !derived.dano?.entradas?.includes(linha) || linha.fonte !== "basico"
    || (linha.ataqueId ?? linha.categoria) !== "corpo" || recibo.desarmado !== true) {
    return { erro: "Falta Acerto Desarmado" };
  }
  if (recibo.raioNegro) return { erro: "Raio Negro Impede Punho Divergente" };
  if (!proximoTurno || ![mesa.origemId, mesa.alvoId].includes(proximoTurno.donoId)
    || !Number.isSafeInteger(proximoTurno.turno) || proximoTurno.turno < 1) return { pendente: "turno" };
  if (recibo.danos?.length !== 1) return { pendente: "danoMisto" };
  const { tipo, total } = recibo.danos[0];
  if (!identificador(tipo) || tipo === "alma" || !Number.isSafeInteger(total) || total < 1) {
    return { erro: "Falta Dano Corporal Tipado" };
  }
  if (total % 2 && !["imediato", "guardado"].includes(resto)) return { pendente: "resto" };
  const metades = metadesDoPunhoDivergente(total), passa = Number(total % 2 === 1 && resto === "imediato");
  const imediato = metades.imediato + passa;
  const { cd } = cdPunhoDivergente({ cd: derived.cd, modTecnica: derived.modTecnica, mods: derived.mods, imediato });
  return { imediato: { tipo, total: imediato }, guardado: {
    id: recibo.id, origemId: mesa.origemId, alvoId: mesa.alvoId, tipo, total: metades.guardado - passa, cd, vence: { ...proximoTurno },
  } };
}

/** Gravar na mesma publicação da primeira metade, inclusive quando a metade imediata vale zero. */
export function guardaPunhoDivergente(sessao, punho) {
  if (!identificador(punho?.id) || !identificador(punho.alvoId) || !identificador(punho.origemId)
    || !identificador(punho.tipo) || !Number.isSafeInteger(punho.total) || !Number.isSafeInteger(punho.cd)
    || !identificador(punho.vence?.donoId) || !Number.isSafeInteger(punho.vence.turno)) {
    return recusa(sessao, "Falta Recibo do Punho Divergente");
  }
  const id = chave("guardado", punho);
  if (jaAplicada(sessao, id)) return { sessao, aplicado: false, repetida: true };
  if (punho.total < 1) return { sessao, aplicado: false };
  const registro = { id, ts: Date.now(), tipo: "info", rotulo: "Punho Divergente", punho };
  return { sessao: comOperacao(registraRolagem(sessao, registro), { id, tipo: ID }), aplicado: true };
}

export function rolaFortitudeDoPunho(sessao, derived, { id, alvoId, turno, rng } = {}) {
  const punho = sessao.log?.find((r) => r.punho?.id === id && r.punho.alvoId === alvoId)?.punho;
  if (!punho || !jaAplicada(sessao, chave("guardado", punho)) || punho.vence.donoId !== turno?.donoId
    || punho.vence.turno !== turno.turno) return recusa(sessao, "Punho Divergente Fora do Turno");
  const opId = chave("teste", punho);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const fort = derived.testes?.resistencias?.find((r) => r.value === "fortitude");
  if (!fort || sessao.vital?.estado === "morto") return recusa(sessao, "Fortitude Indisponível");
  const teste = { ...rolarTeste({ rotulo: "Fortitude", detalhe: "Punho Divergente", bonus: fort.bonus,
    dados: fort.dadosExtras, margem: fort.margemCritico, minimoNatural: fort.minimoNatural, fontes: fort.partes,
    cd: punho.cd, contextoConteudo: { tipo: ID, opId } }, rng), resistenciaId: "fortitude" };
  return { sessao: comOperacao(registraRolagem(sessao, teste), { id: opId, tipo: ID }), aplicado: true, teste };
}

export function resolveFortitudeDoPunho(sessao, derived, { id, alvoId, testeId, turno, desempate } = {}) {
  const punho = sessao.log?.find((r) => r.punho?.id === id && r.punho.alvoId === alvoId)?.punho;
  if (!punho || punho.vence.donoId !== turno?.donoId || punho.vence.turno !== turno.turno) {
    return recusa(sessao, "Punho Divergente Fora do Turno");
  }
  const opId = chave("consequencia", punho), opTeste = chave("teste", punho);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const teste = sessao.log?.find((r) => r.id === testeId && r.contextoConteudo?.opId === opTeste);
  if (!teste || !jaAplicada(sessao, opTeste) || teste.sorte?.escolha === null || teste.consequenciasAplicadas) {
    return recusa(sessao, "Falta Fortitude Resolvida");
  }
  const tr = resolveTR({ cd: punho.cd, rolagem: teste });
  if (!tr.ok) return recusa(sessao, tr.erro);
  const defesas = derived.defesasDano?.porTipo;
  const defesa = defesas?.[punho.tipo];
  let ajustado = derived;
  if (tr.resultado === "falha" && defesa && !defesa.estados.includes("imune")) {
    const estados = [...new Set([...defesa.estados, "vulneravel"])];
    ajustado = { ...derived, defesasDano: { ...derived.defesasDano, porTipo: {
      ...defesas, [punho.tipo]: { ...defesa, estados, conflito: estados.length > 1 },
    } } };
  }
  const dano = aplicaDanoRecebido(sessao, ajustado, { total: punho.total, tipo: punho.tipo, ataqueId: punho.id, desempate }, { opId });
  if (!dano.aplicado) return dano;
  const nova = { ...dano.sessao, log: dano.sessao.log.map((r) => r.id === teste.id ? { ...r, consequenciasAplicadas: true } : r) };
  return { ...dano, sessao: nova, tr, punho };
}
