/* ============================================================
   O CONVITE DE INSTALAR O APP ERA DE OURO (etapa E4, 2026-11-19)
   ============================================================
   "um aplicativo [...] que pode ser baixa-do e e recomendado a entrar no site" (autor, 2026-11-18). Quem abre a lista da
   Guilda pelo navegador do celular vê o convite. As regras moram aqui, puras, e o asserts/t-app-instalavel.mjs as testa.

   FOLHA, zero imports. */

export const CHAVE_CONVITE = "fm_app_convite_aparelho_v1";
export const DIAS_DISPENSADO = 14;
const DIA_MS = 24 * 60 * 60 * 1000;

/** O registro do aparelho: quando dispensou e quando instalou. Lixo vira o registro vazio. */
export function normalizarConvite(cru) {
  const numero = (v) => (Number.isFinite(v) && v > 0 ? v : null);
  const base = cru && typeof cru === "object" ? cru : {};
  return { versao: 1, dispensadoEm: numero(base.dispensadoEm), instaladoEm: numero(base.instaladoEm) };
}

export function lerConvite(armazem = globalThis.localStorage) {
  try {
    const cru = armazem?.getItem(CHAVE_CONVITE);
    return normalizarConvite(cru ? JSON.parse(cru) : null);
  } catch {
    return normalizarConvite(null);
  }
}

export function gravarConvite(convite, armazem = globalThis.localStorage) {
  try {
    armazem?.setItem(CHAVE_CONVITE, JSON.stringify(normalizarConvite(convite)));
    return true;
  } catch {
    return false;
  }
}

/** iPhone e iPad (o iPad novo se diz Macintosh, e é a tela de toque que o entrega), Android, ou outro. */
export function plataformaDe(ua = "", toques = 0) {
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && toques > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "outro";
}

/**
 * O convite aparece? Devolve "android", "ios" ou null.
 *
 *   noLugar       a lista da Guilda (só ela convida)
 *   celular       a consulta de celular casa
 *   instalado     a página já roda como app
 *   convite       o registro do aparelho (normalizarConvite)
 *   agora         Date.now()
 *   plataforma    plataformaDe(...)
 *   temPedido     o Chrome entregou o pedido de instalação (Android)
 *   iosLiberado   IOS_LIBERADO, ou o `?convite-ios=1` de teste
 */
export function conviteDaVez({ noLugar, celular, instalado, convite, agora, plataforma, temPedido, iosLiberado }) {
  if (!noLugar || !celular || instalado) return null;
  const c = normalizarConvite(convite);
  if (c.instaladoEm) return null;
  if (c.dispensadoEm && agora - c.dispensadoEm < DIAS_DISPENSADO * DIA_MS) return null;
  if (plataforma === "ios") return iosLiberado ? "ios" : null;
  return temPedido ? "android" : null;
}
