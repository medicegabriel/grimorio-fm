/* ============================================================
   A ORIGEM DE UM NÚMERO PELO TOQUE LONGO, NO CRIADOR (app Era de Ouro, etapa E6, 2026-11-20)
   ============================================================
   No criador a origem de cada número (`PainelDeFontes`, `fontes.jsx`) abre pelo HOVER do mouse, com a classe `group-hover:block`.
   No telefone não há hover, e a origem ficava fora de alcance. O contrato do DESIGN.md já dizia o gesto do toque: segurar.

   Uma escuta só, no documento, em vez de mexer nas dezenas de lugares do criador que desenham o painel: o toque que segura 450 ms
   num `.group` que tem um `.afty-fontes` marca o grupo com `data-fontes-toque`, e o CSS do criador no celular
   (`criador-celular.css`) mostra o painel desse grupo. Só vale DENTRO de `[data-criador]` e só para toque e caneta: o mouse segue
   no hover de sempre. O próximo toque em qualquer lugar fecha, e o clique que o próprio gesto solta é engolido, para segurar um
   botão não apertar o botão.
   ============================================================ */

export const SEGURAR_MS = 450;
const TOLERANCIA_PX = 10;

/** O `.group` dono de um painel de origem, a partir do alvo do toque. `null` se o toque não caiu num número com origem. */
export function grupoComFontes(alvo) {
  if (!alvo || typeof alvo.closest !== "function") return null;
  const raiz = alvo.closest("[data-criador]");
  if (!raiz) return null;
  for (let g = alvo.closest(".group"); g && raiz.contains(g); g = g.parentElement?.closest(".group") ?? null) {
    const painel = g.querySelector(".afty-fontes");
    if (painel && painel.closest(".group") === g) return g;
  }
  return null;
}

/**
 * Liga a escuta no `documento` e devolve a função que desliga. Chamada pelo cabeçalho do criador no celular, que existe
 * enquanto o criador está aberto.
 */
export function ligarFontesPorToque(documento = typeof document !== "undefined" ? document : null) {
  if (!documento) return () => {};
  let relogio = null;
  let inicio = null;
  let aberto = null;
  let engolir = false;

  const cancelar = () => { clearTimeout(relogio); relogio = null; inicio = null; };
  const fechar = () => { if (aberto) delete aberto.dataset.fontesToque; aberto = null; };

  const aoDescer = (e) => {
    /* Um gesto novo zera a trava do clique: depois de segurar, o Android costuma soltar o menu de contexto e NÃO o clique, e a
       trava que sobrasse engoliria o próximo toque de verdade. */
    engolir = false;
    if (e.pointerType === "mouse") return;
    const grupo = grupoComFontes(e.target);
    if (aberto && aberto !== grupo) fechar();
    cancelar();
    if (!grupo) return;
    inicio = { x: e.clientX, y: e.clientY };
    relogio = setTimeout(() => {
      relogio = null;
      fechar();
      grupo.dataset.fontesToque = "aberto";
      aberto = grupo;
      engolir = true;
    }, SEGURAR_MS);
  };
  const aoMover = (e) => {
    if (!inicio) return;
    if (Math.abs(e.clientX - inicio.x) > TOLERANCIA_PX || Math.abs(e.clientY - inicio.y) > TOLERANCIA_PX) cancelar();
  };
  const aoClicar = (e) => {
    if (!engolir) return;
    engolir = false;
    e.preventDefault();
    e.stopPropagation();
  };
  /* O menu de contexto do toque longo (copiar, abrir em nova aba) briga com o gesto. Só nos números com origem. */
  const aoMenu = (e) => { if (grupoComFontes(e.target)) e.preventDefault(); };
  const aoRolar = () => { cancelar(); fechar(); };

  documento.addEventListener("pointerdown", aoDescer, true);
  documento.addEventListener("pointermove", aoMover, true);
  documento.addEventListener("pointerup", cancelar, true);
  documento.addEventListener("pointercancel", cancelar, true);
  documento.addEventListener("click", aoClicar, true);
  documento.addEventListener("contextmenu", aoMenu, true);
  documento.addEventListener("scroll", aoRolar, true);
  return () => {
    cancelar();
    fechar();
    documento.removeEventListener("pointerdown", aoDescer, true);
    documento.removeEventListener("pointermove", aoMover, true);
    documento.removeEventListener("pointerup", cancelar, true);
    documento.removeEventListener("pointercancel", cancelar, true);
    documento.removeEventListener("click", aoClicar, true);
    documento.removeEventListener("contextmenu", aoMenu, true);
    documento.removeEventListener("scroll", aoRolar, true);
  };
}
