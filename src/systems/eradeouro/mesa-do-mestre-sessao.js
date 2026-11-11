/* O derive entra PRIMEIRO, como em todo leitor do motor (ver asserts/LEIA.md). */
import { deriveAfty } from "../afty/afty-derive";
import { aplicarAddons, unirAddons, epocaAddons } from "../afty/afty-addons";
import { hidratarFicha } from "../afty/afty-addons-compostos";
import {
  aparaSessao, aplicaCura, aplicaDano, carregarSessao, descansar, gastaPe,
} from "../afty/ficha/ficha-sessao";
import { derivarComCache } from "../afty/encontros/usar-encontro-afty";
import { metade } from "./mesa-do-mestre";

/**
 * ============================================================
 * A VIDA E O PE NA MESA DO MESTRE
 * ============================================================
 * A mesa não tem regra própria de dano: ela chama os MESMOS verbos da Ficha Final
 * (`aplicaDano`, `aplicaCura`, `gastaPe`, `descansar`), e por isso o PV temporário
 * come primeiro, o saldo negativo e as Portas seguem valendo e o descanso respeita
 * quem morreu. Uma regra só, dois lugares que a usam.
 *
 * O derive de cada ficha é o do Encontro (`derivarComCache`), com a sessão dela:
 * a Alma corrente, as condições e os buffs mexem no PV máximo da mesa como mexem
 * na Ficha.
 * ============================================================
 */

export const ACOES_DA_MESA = ["dano", "danoMetade", "cura", "gastaPe", "recuperaPe", "descanso"];

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
const somaFontes = (fontes) => Object.values(fontes ?? {}).reduce((s, v) => s + inteiro(v), 0);

/** Aplica uma ação da mesa numa sessão. Ação desconhecida devolve a sessão como estava. */
export function aplicarNaMesa(sessao, derived, acao, valor) {
  const v = inteiro(valor);
  switch (acao) {
    case "dano": return aplicaDano(sessao, v, derived);
    case "danoMetade": return aplicaDano(sessao, metade(v), derived);
    case "cura": return aplicaCura(sessao, v, inteiro(derived?.hp));
    case "gastaPe": return gastaPe(sessao, v);
    case "recuperaPe": {
      if (!v) return sessao;
      const teto = inteiro(derived?.pe);
      const atual = inteiro(sessao.peAtual);
      // Recuperar não passa do máximo, e também não corta quem já está acima dele.
      return { ...sessao, peAtual: Math.max(atual, Math.min(teto, atual + v)) };
    }
    case "descanso": return descansar(sessao, derived);
    default: return sessao;
  }
}

/** O que o card mostra: Vida, PE, as cascas temporárias e se caiu. */
export function resumoVital(sessao, derived) {
  const pv = Math.trunc(Number(sessao?.hpAtual) || 0);
  const pvMax = inteiro(derived?.hp);
  return {
    pv,
    pvMax,
    pvTemp: somaFontes(sessao?.pvTempFontes),
    pe: inteiro(sessao?.peAtual),
    peMax: inteiro(derived?.pe),
    peTemp: somaFontes(sessao?.peTempFontes),
    // A ficha sem Vida máxima (incompleta) não está caída, só vazia.
    caido: pvMax > 0 && pv <= 0,
    morto: sessao?.vital?.estado === "morto",
  };
}

/* O derive SEM sessão, só para a sessão nova nascer cheia (o mesmo que a Ficha
   passa ao `carregarSessao`). Memorizado pela ficha, que não muda de identidade. */
const BASE = new WeakMap();
const deriveBase = (ficha) => {
  if (!BASE.has(ficha)) {
    let d = null;
    try { d = deriveAfty(ficha); } catch { d = null; }
    BASE.set(ficha, d);
  }
  return BASE.get(ficha);
};

/**
 * Deriva a mesa inteira. `itens` é `[{ id, idSessao, ficha, sessaoEditada }]`.
 *
 * ⚠ A UNIÃO DOS ADDONS, aplicada uma vez antes do laço, pelo mesmo motivo do
 * Encontro: a mesa mistura fichas de pacotes diferentes, e aplicar por ficha
 * deixaria o mundo com o addon da última. As fichas entram HIDRATADAS, para os
 * nativos da Guilda estarem na união.
 */
export function derivarMesa(itens = []) {
  const hidratadas = itens.map((i) => (i.ficha ? hidratarFicha(i.ficha) : null));
  aplicarAddons(unirAddons(hidratadas.filter(Boolean)).pacotes);
  const epoca = epocaAddons();
  const out = {};
  itens.forEach((item, i) => {
    const ficha = hidratadas[i];
    if (!ficha) return;
    const bruta = item.sessaoEditada ?? carregarSessao(item.idSessao, deriveBase(ficha));
    const derived = derivarComCache({ ficha, sessao: bruta }, epoca);
    const sessao = derived ? aparaSessao(bruta, derived) : bruta;
    out[item.id] = { ficha, sessao, derived, vital: resumoVital(sessao, derived) };
  });
  return out;
}
