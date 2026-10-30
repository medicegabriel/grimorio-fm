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

/** O derive da ficha com a sessão, pelas opções da aplicação. É o MESMO derive da Ficha. */
export const derivar = (ficha, s) => comAddons(ficha, () => deriveAfty(
  { ...ficha, combate: s.combate, buffsSessao: s.buffs },
  opcoesDeriveDaSessao(s),
));

/* O "Agora" de um estado ligado: o derive da ficha com ele e sem ele, pela comparação do próprio motor. Um derive por estado, só
   quando pedido. As opções são as da Ficha, inteiras (uma lista só), e o `buffs` viaja junto porque não é opção do derive. */
export function deltaDeEstados(ficha, s, derived, estados) {
  if (!s.combate?.ativo || !estados.length) return {};
  return comAddons(ficha, () => {
    const base = { ...ficha, combate: s.combate, buffsSessao: s.buffs };
    const opcoes = opcoesDeriveDaSessao(s);
    const out = {};
    for (const e of estados) {
      if (!estaLigado(e, s.combate[e.id])) continue;
      const sem = deriveAfty({ ...base, combate: { ...s.combate, [e.id]: padraoDe(e) } }, opcoes);
      const chips = compararSaldo(derived, sem);
      if (chips.length) out[e.id] = chips;
    }
    return out;
  });
}

/* O saldo de tudo que está ligado (a faixa Agora da aba Buffs de hoje). */
export const saldo = (ficha, s, derived) => comAddons(ficha, () => saldoDoAgora(
  ficha, s.combate, { ...opcoesDeriveDaSessao(s), buffs: s.buffs }, derived,
));
