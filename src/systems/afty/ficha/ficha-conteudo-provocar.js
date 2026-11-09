// Livro p.302 e p.164. Uma disputa de perícia e um efeito de CL1 por provocador.
import { usa, encerraUso } from "./ficha-uso";
import { jaAplicada, usoDe } from "./ficha-uso-estado";
import { registraRolagem, usosGastosDe } from "./ficha-sessao";
import { rolarTeste } from "./ficha-rolagem";
import { impedimentoParaAgirConteudo, testeComConsequencias } from "./ficha-conteudo-acesso";
import { modoCombinado } from "../afty-propriedades-armas";

const TALENTO = "tal_provocacao_desafiadora";
const USOS = "longo:" + TALENTO;
const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const temTalento = (d) => d.talentos?.escolhidas?.includes(TALENTO) && !d.talentos.inacessiveis?.includes(TALENTO);

export function usosLivresDeProvocar(sessao, derived) {
  const max = temTalento(derived) ? Math.max(0, Math.floor(derived.mods.presenca / 2)) : 0;
  return { max, restantes: Math.max(0, max - usosGastosDe(sessao, USOS)) };
}

const turnoAberto = (s) => s.especializacaoSessao?.turnoEncerrado == null || s.especializacaoSessao.turnoEncerrado !== s.especializacaoSessao.turno;
const doTurno = (s, ctx) => turnoAberto(s) && ctx?.tipo === "provocar" && ctx.rodada === s.rodada && ctx.turno === usoDe(s).acoes.turno;

export const provocacoesPendentes = (sessao) => (sessao.log ?? []).filter((r) => {
  const c = r.contextoConteudo;
  return doTurno(sessao, c) && c.papel === "provocador" && !testeComConsequencias(r) && jaAplicada(sessao, c.operacaoId);
});

export function rolaProvocar(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  if (entrada.emSeuTurno !== true || !turnoAberto(sessao) || !entrada.voceId || !entrada.alvoId || entrada.voceId === entrada.alvoId) {
    return recusa(sessao, "Provocar Exige Alvo no Seu Turno");
  }
  if (!Number.isFinite(entrada.distancia) || entrada.distancia < 0 || entrada.distancia > 9) return recusa(sessao, "Provocar Exige Alvo em 9 m");
  if (provocacoesPendentes(sessao).length) return recusa(sessao, "Conclua a Provocação Pendente");
  const l = derived.testes.pericias.find((p) => p.id === "intimidacao");
  const manobra = derived.testes.manobras.find((m) => m.id === "provocar");
  const o = ["intimidacao", "intuicao"].includes(entrada.oposicao) && derivedAlvo.testes.pericias.find((p) => p.id === entrada.oposicao);
  if (!l || !o) return recusa(sessao, "Escolha Intimidação ou Intuição do Alvo");
  const livre = entrada.livre === true, quota = usosLivresDeProvocar(sessao, derived);
  if (livre && !quota.restantes) return recusa(sessao, "Sem Usos Livres de Provocação Desafiadora");
  const uso = usa(sessao, derived, { id: livre ? "provocar-livre" : "provocar", nome: "Provocar", emCombate: true,
    acesso: impedimentoParaAgirConteudo, acao: livre ? "livre" : "comum", proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    ...(livre ? { usos: { chave: USOS, max: quota.max } } : {}) }, { ...pedido, registraAcao: true });
  if (!uso.aplicado) return uso;
  const contexto = { tipo: "provocar", operacaoId: pedido.opId, rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno,
    fonteId: entrada.voceId, alvoId: entrada.alvoId, desafiadora: temTalento(derived) === true };
  const teste = (p, papel, modo, rng) => rolarTeste({ rotulo: p.nome, detalhe: "Provocar", periciaId: p.id, bonus: p.bonus, dados: p.dadosExtras,
    margem: p.margemCritico, minimoNatural: p.minimoNatural, modo, fontes: p.partes, contextoConteudo: { ...contexto, papel } }, rng);
  const provocador = teste({ ...l, bonus: manobra?.executar ?? l.bonus, partes: manobra?.partesExecutar ?? l.partes },
    "provocador", entrada.modo, entrada.rng);
  const alvo = teste(o, "alvo", entrada.modoAlvo, entrada.rngAlvo);
  return { ...uso, sessao: registraRolagem(uso.sessao, provocador), sessaoAlvo: registraRolagem(sessaoAlvo, alvo), provocador, alvo };
}

export function concluiProvocar(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  if (entrada.emSeuTurno !== true) return recusa(sessao, "Conclua Provocar no Seu Turno");
  const r = provocacoesPendentes(sessao).find((t) => t.id === entrada.rolagemId);
  const ctx = r?.contextoConteudo;
  if (!ctx || ctx.alvoId !== entrada.alvoId || ctx.fonteId !== entrada.voceId) return recusa(sessao, "Falta Provocação Atual contra o Alvo");
  const o = sessaoAlvo.log?.find((t) => t.contextoConteudo?.tipo === "provocar" && t.contextoConteudo.operacaoId === ctx.operacaoId
    && t.contextoConteudo.papel === "alvo" && t.contextoConteudo.alvoId === ctx.alvoId);
  if (!o || [r, o].some((t) => !Number.isFinite(t.total) || testeComConsequencias(t) || t.sorte?.escolha === null)) {
    return recusa(sessao, "Falta Oposição Atual ou Escolha de Sorte");
  }
  const uso = usa(sessao, derived, { id: "provocar-resultado", nome: "Resultado de Provocar", emCombate: true }, pedido);
  if (!uso.aplicado) return uso;
  const desafiadora = ctx.desafiadora && temTalento(derived), sucesso = r.total > o.total;
  let sa = sessaoAlvo;
  if (sucesso) {
    const efeito = usa(sa, derivedAlvo, { id: "provocar:" + ctx.fonteId, origem: "provocar", nome: desafiadora ? "Provocação Desafiadora" : "Provocar",
      emCombate: true, renova: true, duracao: { ate: "cena" }, parametros: [
        { id: "fonteId", tipo: "opcao", opcoes: [ctx.fonteId], padrao: ctx.fonteId },
        { id: "operacaoId", tipo: "opcao", opcoes: [pedido.opId], padrao: pedido.opId },
        { id: "desafiadora", tipo: "bool", padrao: desafiadora },
      ] }, { opId: pedido.opId + ":alvo" });
    if (!efeito.aplicado) return recusa(sessao, efeito.erro);
    sa = efeito.sessao;
  }
  const marca = (s, id) => ({ ...s, log: s.log.map((t) => t.id === id ? { ...t, consequenciasAplicadas: true } : t) });
  const registro = { id: pedido.opId + ":registro", ts: Date.now(), tipo: "info", rotulo: "Provocar",
    detalhe: sucesso ? "Provocação Bem-Sucedida" : "Alvo Resistiu", fonteId: ctx.fonteId, alvoId: ctx.alvoId, sucesso };
  return { ...uso, sessao: registraRolagem(marca(uso.sessao, r.id), registro), sessaoAlvo: registraRolagem(marca(sa, o.id), registro), sucesso };
}

export const provocacoesAtivas = (sessao) => Object.values(sessao?.uso?.ativos ?? {}).filter((a) => a.origem === "provocar");

export function encerraProvocacoesDaFonte(combatentes, fonteId, motivo = "inicioDoProximoTurno") {
  return combatentes.map((c) => {
    let sessao = c.sessao;
    for (const ativo of provocacoesAtivas(sessao)) {
      if (ativo.parametros.fonteId !== fonteId) continue;
      const r = encerraUso(sessao, null, ativo.id, { opId: ativo.parametros.operacaoId + ":fim", motivo });
      if (r.aplicado) sessao = r.sessao;
    }
    return sessao === c.sessao ? c : { ...c, sessao };
  });
}

export function provocacoesSemAtaque(sessao) {
  return provocacoesAtivas(sessao).filter((a) => {
    if (!a.parametros.desafiadora) return false;
    const indice = sessao.log.findIndex((r) => r.id === a.parametros.operacaoId + ":registro");
    return !sessao.log.slice(0, indice < 0 ? sessao.log.length : indice).some((r) => r.rotulo === "Ataque Confirmado" && r.ataque?.alvo?.id === a.parametros.fonteId
      && jaAplicada(sessao, "ataque-confirmado:" + r.ataqueId));
  });
}

/** Contribui com as fontes do modo antes de o rolador escolher quantos d20 sortear. */
export function ataqueSobProvocacao(desc, provocacoes, alvoId) {
  if (!provocacoes.length) return desc;
  if (!alvoId) return null;
  const vantagem = provocacoes.some((a) => a.parametros.fonteId === alvoId);
  const desvantagem = provocacoes.some((a) => a.parametros.fonteId !== alvoId);
  const linha = desc.linhaArma, motor = linha?.vantagemAtaque ?? {};
  return { ...desc,
    ...(linha ? { linhaArma: { ...linha, vantagemAtaque: { vantagem: motor.vantagem || vantagem, desvantagem: motor.desvantagem || desvantagem } } }
      : { modo: modoCombinado(desc.modo, { vantagem, desvantagem }) }),
    fontes: [...(desc.fontes ?? []), { label: "Provocar", texto: modoCombinado("normal", { vantagem, desvantagem }) }],
    contextoConteudo: { ...desc.contextoConteudo, alvoProvocacao: alvoId, modoBaseProvocacao: desc.modo ?? "normal" },
  };
}

export function alvoProvocadoValido(sessao, ataque, alvoId) {
  const vinculo = ataque.contextoConteudo?.alvoProvocacao;
  if (vinculo) return vinculo === alvoId;
  // Ataques já rolados antes de a provocação ser aplicada conservam a jogada.
  const indice = sessao.log.findIndex((r) => r.id === ataque.id);
  const anteriores = sessao.log.slice(indice + 1);
  return !provocacoesAtivas(sessao).some((a) => anteriores.some((r) => r.id === a.parametros.operacaoId + ":registro"));
}
