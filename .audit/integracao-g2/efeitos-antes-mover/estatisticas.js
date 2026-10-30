/* ============================================================
   ESTATÍSTICAS DO CABEÇALHO, CONFIGURÁVEIS POR PERSONAGEM (fechamento do G2, 2026-10-16)
   ============================================================
   O cabeçalho mostra as estatísticas que `statsDaFicha` (v2) devolve, na ordem dele, e manda o que não cabe para "+N". Aqui o jogador escolhe
   O QUE aparece e EM QUE ORDEM. É só apresentação: nenhum valor, fonte, bônus ou efeito muda, e os recursos (Vida, Energia e Alma) e os controles
   de combate (Em Combate, Rodada, Efeitos) não são estatísticas e não entram nesta lista.

   A PREFERÊNCIA mora na UI da mesa do personagem (`mesa.ui.estatisticas`, gravada com ela): { ordem: [ids], ocultas: [ids] }. `null` (ou nada)
   é "nunca configurou", e vale a apresentação de hoje, sem tocar o cabeçalho padrão. Restaurar padrão apaga a preferência.

   TRATAMENTO SEGURO, tudo aqui e sem exceção:
     - a preferência lida de fora passa por `normalizaPreferencia`: o que não for lista de textos é descartado, os repetidos somem, e o resultado
       nunca derruba a tela;
     - um id guardado que a ficha não tem agora (a RD Física some quando é 0) é IGNORADO na tela e MANTIDO na preferência, no lugar em que estava:
       se a estatística voltar, volta ao mesmo lugar;
     - um id que a ficha tem e a preferência nunca viu (uma estatística nova) entra no fim da ordem, visível, sem duplicar.
   Funções puras, sem React.
   ============================================================ */

const MAX = 64;
const idsDe = (v) => {
  const vistos = new Set();
  const out = [];
  if (!Array.isArray(v)) return out;
  for (const x of v) {
    if (typeof x !== "string" || !x || x.length > 40 || vistos.has(x)) continue;
    vistos.add(x);
    out.push(x);
    if (out.length >= MAX) break;
  }
  return out;
};

/** A preferência já validada, ou `null`. Aceita qualquer coisa vinda de fora. */
export function normalizaPreferencia(bruto) {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const ordem = idsDe(bruto.ordem);
  const ocultas = idsDe(bruto.ocultas);
  if (!ordem.length && !ocultas.length) return null;
  return { ordem, ocultas };
}

/** A ordem COMPLETA de agora: a guardada (com os ids que a ficha não tem, nos lugares deles) mais, no fim, o que a preferência nunca viu. */
function ordemCompleta(stats, pref) {
  const agora = stats.map((s) => s.id);
  const guardada = pref?.ordem ?? [];
  const novos = agora.filter((id) => !guardada.includes(id));
  return [...guardada, ...novos];
}

/**
 * Aplica a preferência às estatísticas da ficha.
 *   `todas`    as estatísticas que a ficha tem agora, na ordem da preferência, cada uma com `visivel` (é o que a configuração lista)
 *   `visiveis` só as que aparecem, na mesma ordem (é o que a faixa e o "+N" usam: o ocultado NUNCA volta como excesso de largura)
 *   `padrao`   não há preferência: a apresentação de hoje
 */
export function aplicaPreferencia(stats, bruto) {
  const pref = normalizaPreferencia(bruto);
  if (!pref) return { todas: stats.map((s) => ({ ...s, visivel: true })), visiveis: stats, padrao: true };
  const porId = new Map(stats.map((s) => [s.id, s]));
  const ocultas = new Set(pref.ocultas);
  const todas = ordemCompleta(stats, pref).filter((id) => porId.has(id)).map((id) => ({ ...porId.get(id), visivel: !ocultas.has(id) }));
  return { todas, visiveis: todas.filter((s) => s.visivel).map(({ visivel, ...s }) => s), padrao: false };
}

const comOrdem = (stats, pref, novaOrdemAgora) => {
  /* os ids que a ficha não tem agora ficam onde estavam: só os de agora trocam de lugar entre si */
  const agora = new Set(stats.map((s) => s.id));
  const base = ordemCompleta(stats, pref);
  const fila = [...novaOrdemAgora];
  return base.map((id) => (agora.has(id) ? fila.shift() : id));
};

/** Mostra ou oculta uma estatística. Devolve a preferência nova (a de fora não é alterada). */
export function alternaVisivel(stats, bruto, id) {
  const pref = normalizaPreferencia(bruto);
  if (!stats.some((s) => s.id === id)) return pref;
  const ordem = comOrdem(stats, pref, aplicaPreferencia(stats, pref).todas.map((s) => s.id));
  const ocultas = new Set(pref?.ocultas ?? []);
  if (ocultas.has(id)) ocultas.delete(id); else ocultas.add(id);
  return normalizaPreferencia({ ordem, ocultas: [...ocultas] });
}

/** Move uma estatística `delta` casas (−1 sobe, +1 desce) entre as que a ficha tem agora. Nos extremos, nada muda. */
export function move(stats, bruto, id, delta) {
  const pref = normalizaPreferencia(bruto);
  const atual = aplicaPreferencia(stats, pref).todas.map((s) => s.id);
  const de = atual.indexOf(id);
  const para = de + delta;
  if (de < 0 || para < 0 || para >= atual.length) return pref;
  const nova = [...atual];
  nova.splice(para, 0, nova.splice(de, 1)[0]);
  return normalizaPreferencia({ ordem: comOrdem(stats, pref, nova), ocultas: pref?.ocultas ?? [] });
}

/** Restaurar padrão: nenhuma preferência. */
export const restauraPadrao = () => null;
