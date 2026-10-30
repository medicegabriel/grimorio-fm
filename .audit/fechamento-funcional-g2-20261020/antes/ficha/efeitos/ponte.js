/**
 * ============================================================
 * PONTE DOS EFEITOS COM O MOTOR (a aba Efeitos, o cabeçalho e Habilidades do G2)
 * ============================================================
 * Tudo o que a camada dos Efeitos calcula sai daqui, e daqui sai direto do motor
 * da aplicação. Nada é copiado nem reescrito. Nasceu no protótipo v2 como
 * `motor.js`, com UMA diferença que importa: o `derivar` daqui usa as opções do
 * derive da APLICAÇÃO (`opcoesDeriveDaSessao`), e não uma lista menor. O modelo
 * mais limitado do estudo não substitui o derive da Ficha.
 *
 * ⚠ OS ADDONS REESCREVEM OS CATÁLOGOS GLOBAIS. Toda leitura de catálogo de uma
 * ficha (derive, conteúdo, estados, delta) tem de rodar logo depois do
 * `aplicarAddons` DAQUELA ficha, no mesmo bloco síncrono. No Encontro há quatro
 * fichas com addons diferentes na mesma página, então quem calcula chama
 * `comAddons(ficha, fn)`.
 * ============================================================
 */
import { deriveAfty } from "../../afty-derive";
import { aplicarAddons, addonsDaCriatura } from "../../afty-addons";
import { mesclaFichaAfty, funcionamentosDaFicha, AFTY_TIPOS, AFTY_PATAMARES, AFTY_ATTRS } from "../../afty-schema";
import { conteudoDaFicha, equipamentosDaFicha, GRUPOS, ROTULO_GRUPO } from "../ficha-conteudo";
import * as Sessao from "../ficha-sessao";
import { facesDe } from "../ficha-rolagem";
import { linhasDeEstado, estaLigado, padraoDe, compararSaldo, saldoDoAgora } from "../ficha-buffs";
import { familiaEParte, donoDoEstado } from "../ficha-estados";
import { FILTROS_HABILIDADE, correspondeFiltroHabilidade } from "../../afty-filtro-habilidades";
import { condicoesPorForca, fichaDaCondicao } from "../../afty-condicoes";
import { cssDasVars, cssDoUsuario, normalizaTema } from "../ficha-tema";
import { sistemaDaFicha, ehPlayer, regraDo, rotuloDoNivel } from "../../afty-sistema";
import { getEspecializacao } from "../../afty-especializacoes";
import { curaNoGasto } from "../../afty-cura";
import { opcoesDeriveDaSessao } from "../ficha-opcoes-derive";

export {
  deriveAfty, aplicarAddons, addonsDaCriatura, mesclaFichaAfty, funcionamentosDaFicha,
  AFTY_TIPOS, AFTY_PATAMARES, AFTY_ATTRS, conteudoDaFicha, equipamentosDaFicha, GRUPOS, ROTULO_GRUPO,
  Sessao, facesDe, linhasDeEstado, estaLigado, padraoDe, compararSaldo, saldoDoAgora,
  familiaEParte, donoDoEstado, FILTROS_HABILIDADE, correspondeFiltroHabilidade,
  condicoesPorForca, fichaDaCondicao, cssDasVars, cssDoUsuario, normalizaTema,
  sistemaDaFicha, ehPlayer, regraDo, rotuloDoNivel, getEspecializacao, curaNoGasto, opcoesDeriveDaSessao,
};

/** Roda `fn` com os catálogos desta ficha no ar. */
export function comAddons(ficha, fn) {
  aplicarAddons(ficha?.addons ?? []);
  return fn();
}

/* ⚠ O DERIVE É O CUSTO DA INTERAÇÃO. Um único "Confirmar Ativação" chegou a pedir 14 derives (a ficha, a prova e a confirmação da operação, a prévia da
   Preparação, o saldo do Agora, a Linha do Tempo com as quatro viradas...), e com uma ficha grande no `dev` isso são segundos. Quase todos pedem a MESMA conta:
   o derive é função pura da ficha, do combate, dos buffs e das opções da sessão. Por isso ele é guardado por essa chave (a ficha por identidade, o resto por
   conteúdo), com um teto pequeno por ficha. Nenhum número muda: quem pede de novo a mesma conta recebe a que já foi feita, e quem pede outra paga outra.
   O resultado é compartilhado e SOMENTE LIDO (as telas nunca o alteram). */
const DERIVES = new WeakMap();
const TETO_DE_DERIVES = 16;
const chaveDoDerive = (s) => JSON.stringify([s.combate ?? null, s.buffs ?? null, opcoesDeriveDaSessao(s)]);

/** O derive da ficha com a sessão, pelas opções da aplicação. É o MESMO derive da Ficha (conta repetida vem da guarda). */
export function derivar(ficha, s) {
  let guarda = DERIVES.get(ficha);
  if (!guarda) { guarda = new Map(); DERIVES.set(ficha, guarda); }
  const chave = chaveDoDerive(s);
  if (guarda.has(chave)) {
    const pronto = guarda.get(chave);
    guarda.delete(chave);
    guarda.set(chave, pronto);
    return pronto;
  }
  const d = comAddons(ficha, () => deriveAfty({ ...ficha, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s)));
  guarda.set(chave, d);
  if (guarda.size > TETO_DE_DERIVES) guarda.delete(guarda.keys().next().value);
  return d;
}

/* O "Agora" de um estado ligado: o derive da ficha com ele e sem ele, pela comparação do próprio motor. Um derive por estado, só
   quando pedido. As opções são as da Ficha, inteiras (uma lista só), e o `buffs` viaja junto porque não é opção do derive. */
export function deltaDeEstados(ficha, s, derived, estados) {
  if (!s.combate?.ativo || !estados.length) return {};
  const out = {};
  for (const e of estados) {
    if (!estaLigado(e, s.combate[e.id])) continue;
    const sem = derivar(ficha, { ...s, combate: { ...s.combate, [e.id]: padraoDe(e) } });
    const chips = compararSaldo(derived, sem);
    if (chips.length) out[e.id] = chips;
  }
  return out;
}

/* O saldo de tudo que está ligado (a faixa Agora da aba Buffs de hoje). */
export function saldo(ficha, s, derived) {
  const temBancada = Object.values(s.combate ?? {}).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  if (!temBancada && !(s.buffs?.length) && !(s.condicoes?.length)) return [];
  /* A ficha sem nada ligado, sem buff e sem condição: a mesma conta de `saldoDoAgora`, pelo derive guardado. */
  return compararSaldo(derived, derivar(ficha, { ...s, combate: {}, buffs: [], condicoes: [] }));
}
