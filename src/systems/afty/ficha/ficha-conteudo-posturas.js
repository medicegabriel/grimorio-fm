// CX3, Livro p.75/76 e 291. Posturas próprias usam ação, contador e prazo de CL1.
import { getHabilidade } from "../afty-habilidades";
import { avaliarAcessoAltoNivel, getHabilidadeApice } from "../afty-alto-nivel";
import { COMBATE_ESTADOS } from "../afty-combate";
import { usa } from "./ficha-uso";
import { jaAplicada, encerraAtivoNaSessao } from "./ficha-uso-estado";
import { aplicaPatchCombate } from "./ficha-sessao";

const canonico = (id) => id.replace(/^.*__/, "");
const disponivel = (d, id) => d.habilidades?.efetivas?.find((x) => canonico(x) === id && !d.habilidades.inacessiveis?.includes(x));
const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });

/** A escolha atual e o acesso ao Ápice vêm dos resolvedores nativos. */
export function posturaAtivaConteudo(sessao, derived, postura) {
  if (!sessao.combate?.ativo || !derived.combate?.ativo) return null;
  const opcao = COMBATE_ESTADOS.find((e) => e.id === "postura")?.opcoes.find((o) => o.id === postura);
  if (!opcao) return null;
  const alto = derived.altoNivel;
  const apice = sessao.combate.invencivelSobOSol && derived.combate.invencivelSobOSol
    && alto?.apiceId === "api_invencivel_sob_o_sol" && !alto.lendarias?.inacessiveis?.includes("len_atingir_apice")
    && avaliarAcessoAltoNivel(getHabilidadeApice(alto.apiceId), { nd: derived.nd, niveisPorEspec: derived.habilidades?.niveisPorEspec,
      habilidades: (derived.habilidades?.efetivas ?? []).filter((h) => !derived.habilidades.inacessiveis?.includes(h)).map(canonico) }).ok;
  const fonte = Object.entries(derived.habilidades?.escolhas?.mapa ?? {}).flatMap(([pai, ids]) =>
    derived.habilidades.efetivas.includes(pai) && !derived.habilidades.inacessiveis?.includes(pai)
      ? ((derived.imitacao?.copia?.id === pai ? derived.imitacao.def : getHabilidade(pai))?.escolha?.opcoes ?? [])
        .filter((o) => o.id === opcao.requerEscolha && ids.includes(o.id)) : [])[0]
    ?? (apice ? getHabilidade("cmb_assumir_postura")?.escolha.opcoes.find((o) => o.id === opcao.requerEscolha) : null);
  const ativa = sessao.combate.postura === postura && derived.combate.postura === postura
    || (sessao.combate.postura2 === postura && derived.combate.postura2 === postura && disponivel(derived, "cmb_mestre_da_postura"));
  return fonte && (apice || ativa) ? { id: fonte.id, nome: fonte.nome, apice: !!apice,
    partes: [{ label: fonte.nome, texto: "Postura Ativa" },
      ...(apice ? [{ label: getHabilidadeApice(alto.apiceId).nome, texto: "Posturas" }] : [])] } : null;
}

/** Decisão de 06/11: Empurrar encerra as posturas normais, salvo Preparação Rápida. */
export function posturasDepoisDeEmpurrar(sessao, derived) {
  if (disponivel(derived, "cmb_preparacao_rapida") || (!sessao.combate?.postura && !sessao.combate?.postura2)) return sessao;
  return encerraAtivoNaSessao(aplicaPatchCombate(sessao, { postura: null, postura2: null }), "cmb_assumir_postura", "empurrado");
}

/** A cópia temporária conserva a operação de Imitação, sem ganhar outro minuto. */
export function posturasPropriasConteudo(derived, habilidadeId = null) {
  const id = habilidadeId ? derived.habilidades?.efetivas?.find((x) => x === habilidadeId && canonico(x) === "cmb_assumir_postura" && !derived.habilidades.inacessiveis?.includes(x))
    : disponivel(derived, "cmb_assumir_postura");
  if (!id) return null;
  const copia = derived.imitacao?.copia;
  const temporaria = copia && !derived.imitacao.jaPossui;
  const mapa = derived.habilidades.escolhas?.mapa ?? {};
  const ids = new Set(Object.entries(mapa).flatMap(([pai, escolhas]) => {
    if (!["cmb_assumir_postura", "cmb_aprender_postura"].includes(canonico(pai))
      || !derived.habilidades.efetivas.includes(pai) || derived.habilidades.inacessiveis?.includes(pai)
      || (temporaria && copia.id === pai)) return [];
    return escolhas.filter((x) => !(temporaria && copia.tipo === "postura" && copia.id === x));
  }));
  const estado = COMBATE_ESTADOS.find((e) => e.id === "postura");
  const opcoes = estado.opcoes.filter((o) => ids.has(o.requerEscolha)).map((o) => ({ ...o, nome: getHabilidade(id)?.escolha?.opcoes?.find((p) => p.id === o.requerEscolha)?.nome ?? `Postura ${o.label}` }));
  const mestreId = disponivel(derived, "cmb_mestre_da_postura");
  const mestre = !!mestreId && !(temporaria && copia.id === mestreId);
  const rapida = disponivel(derived, "cmb_preparacao_rapida");
  const usos = derived.usosHabilidades?.[id];
  return opcoes.length && usos ? { id, nome: getHabilidade(id)?.nome ?? "Assumir Postura", opcoes, mestre, usos, acao: rapida ? "livre" : "bonus",
    acaoPartes: [{ label: getHabilidade(rapida ?? id)?.nome ?? "Assumir Postura", texto: rapida ? "Ação Livre" : "Ação Bônus" }],
    partes: [{ label: getHabilidade(id)?.nome ?? "Assumir Postura", valor: usos.max }],
  } : null;
}

export function assumePosturaConteudo(sessao, derived, entrada = {}, pedido = {}) {
  if (typeof pedido.opId !== "string" || !pedido.opId) return recusa(sessao, "Sem Identidade da Operação");
  if (jaAplicada(sessao, pedido.opId)) return { sessao, aplicado: false, repetida: true };
  const fonte = posturasPropriasConteudo(derived, entrada.habilidadeId);
  if (!fonte) return recusa(sessao, "Postura Própria Indisponível");
  if (!fonte.opcoes.some((o) => o.id === entrada.postura)) return recusa(sessao, "Postura Não Aprendida ou Inacessível");
  const segunda = entrada.postura2 || null;
  if (segunda && (!fonte.mestre || segunda === entrada.postura || !fonte.opcoes.some((o) => o.id === segunda))) return recusa(sessao, "Segunda Postura Exige Mestre e Escolha Distinta Disponível");
  const atuais = [sessao.combate?.postura, sessao.combate?.postura2].filter(Boolean);
  const novas = [entrada.postura, segunda].filter(Boolean);
  if (atuais.length && novas.every((x) => atuais.includes(x))) return recusa(sessao, "Posturas Já Ativas");
  return usa(sessao, derived, { id: "cmb_assumir_postura", nome: fonte.nome, origem: fonte.id,
    emCombate: true, renova: true, acao: fonte.acao, usos: fonte.usos, duracao: { rodadas: 10 },
    parametros: [{ id: "operacaoId", tipo: "opcao", opcoes: [pedido.opId], padrao: pedido.opId }],
    proibidoCom: ["Caído", "Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    efeitos: [{ tipo: "estado", id: "postura", valor: entrada.postura, desliga: null },
      { tipo: "estado", id: "postura2", valor: segunda, desliga: null }],
  }, pedido);
}
