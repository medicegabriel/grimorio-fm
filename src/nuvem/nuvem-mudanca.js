/* Mudança de endereço: leva o localStorage do host antigo para o novo.

   Cada endereço tem um localStorage separado, então o site novo nasce vazio para
   todo mundo. O host antigo abre o novo numa janela de topo e manda as chaves da
   pessoa por postMessage. Um iframe escondido não serviria: Chrome e Safari
   particionam o armazenamento de terceiros e o iframe leria um pote vazio.

   As duas pontas conferem `event.origin` contra a origem exata da outra, e o
   envio nunca usa "*", senão qualquer site poderia injetar fichas. */

import { ORIGEM_ANTIGA, ORIGEM_NOVA, PARAM_RECEBER, ehChaveDeFichas, chaveDaPessoa } from "./nuvem-config";
import { unirPorId, listaDeIds, lerLocal, gravarCru } from "./nuvem-sync";

// ---------------------------------------------------------------- host antigo
export function levarFichas({ aoEnviar } = {}) {
  const destino = `${ORIGEM_NOVA}${location.pathname}?${PARAM_RECEBER}=1`;
  const janela = window.open(destino, "_blank");
  if (!janela) return false;
  const ouvir = (e) => {
    if (e.origin !== ORIGEM_NOVA || e.source !== janela) return;
    if (e.data?.tipo === "fm-pronto") {
      janela.postMessage({ tipo: "fm-fichas", dados: lerLocal() }, ORIGEM_NOVA);
    } else if (e.data?.tipo === "fm-recebido") {
      window.removeEventListener("message", ouvir);
      aoEnviar?.();
    }
  };
  window.addEventListener("message", ouvir);
  return true;
}

// ---------------------------------------------------------------- host novo
/* Mescla o que chegou sem apagar nada daqui: ficha igual fica a mais nova, chave
   que só existe lá entra, e lista com id é unida. */
export function mesclarRecebido(recebido) {
  let n = 0;
  const local = lerLocal();
  for (const [chave, valor] of Object.entries(recebido ?? {})) {
    if (!chaveDaPessoa(chave) || typeof valor !== "string") continue;
    const atual = local[chave];
    if (atual == null) { gravarCru(chave, valor); n++; continue; }
    if (atual === valor) continue;
    let lv, rv;
    try { lv = JSON.parse(atual); rv = JSON.parse(valor); } catch { continue; }
    if (ehChaveDeFichas(chave) && Array.isArray(lv) && Array.isArray(rv)) {
      gravarCru(chave, JSON.stringify(unirPorId(lv, rv,
        (l, r) => String(r.updatedAt ?? "") > String(l.updatedAt ?? ""))));
      n++;
    } else if (listaDeIds(lv) && listaDeIds(rv)) {
      gravarCru(chave, JSON.stringify(unirPorId(lv, rv, () => false)));
      n++;
    }
  }
  return n;
}

/* Chamado pelo main.jsx antes de montar. Só age com o parâmetro na URL e uma
   janela de origem aberta. Espera no máximo `esperaMs`. */
export function receberFichasSeVieram({ esperaMs = 6000 } = {}) {
  if (typeof location === "undefined") return Promise.resolve();
  const url = new URL(location.href);
  if (!url.searchParams.has(PARAM_RECEBER)) return Promise.resolve();
  url.searchParams.delete(PARAM_RECEBER);
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  if (!window.opener || location.origin === ORIGEM_ANTIGA) return Promise.resolve();
  return new Promise((resolver) => {
    const fim = setTimeout(() => { window.removeEventListener("message", ouvir); resolver(); }, esperaMs);
    function ouvir(e) {
      if (e.origin !== ORIGEM_ANTIGA || e.source !== window.opener) return;
      if (e.data?.tipo !== "fm-fichas") return;
      window.removeEventListener("message", ouvir);
      clearTimeout(fim);
      mesclarRecebido(e.data.dados);
      try { window.opener.postMessage({ tipo: "fm-recebido" }, ORIGEM_ANTIGA); } catch { /* fechada */ }
      resolver();
    }
    window.addEventListener("message", ouvir);
    window.opener.postMessage({ tipo: "fm-pronto" }, ORIGEM_ANTIGA);
  });
}
