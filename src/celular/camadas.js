import { useEffect, useRef } from "react";
import { PILHA_LIGADA } from "./pwa-config";
import { camadaNoTopo, camadaSaiu, planoDaCamada } from "./pilha";

let contador = 0;

/**
 * Um painel aberto vira uma entrada do histórico (etapa E2): o Voltar do aparelho fecha o painel antes de mudar de tela,
 * que é o que quem usa Android espera de uma folha, de um menu e de um diálogo.
 *
 *   useCamadaDeVoltar(aberta, fechar)
 *
 * Ao abrir, empilha uma entrada com a marca do painel. O Voltar a desfaz, e `fechar()` é chamado. Fechar de outro jeito (X,
 * Esc, véu, escolher uma opção) desfaz a entrada com `history.back()`, mas só se ela ainda for a de cima: quando o painel
 * fecha porque a tela mudou (`ir` troca a entrada do painel pela da tela nova), não há o que desfazer.
 *
 * ⚠ O `back` do fechamento vai num `setTimeout`. No modo estrito do React (desenvolvimento) o efeito monta, desmonta e monta
 * de novo na mesma passada, e um `back` síncrono no meio desfaria a entrada que a segunda montagem acabou de pôr.
 */
export function useCamadaDeVoltar(aberta, fechar, { ligada = PILHA_LIGADA } = {}) {
  const fecharRef = useRef(fechar);
  useEffect(() => { fecharRef.current = fechar; });

  useEffect(() => {
    if (!aberta || !ligada || typeof history === "undefined") return undefined;
    contador += 1;
    const id = `camada-${contador}`;
    const plano = planoDaCamada(history.state, id);
    history.pushState(plano.estado, "");
    let fechadaPeloVoltar = false;
    const aoNavegar = (e) => {
      if (!camadaSaiu(e.state, id)) return;
      fechadaPeloVoltar = true;
      window.removeEventListener("popstate", aoNavegar);
      fecharRef.current?.();
    };
    window.addEventListener("popstate", aoNavegar);
    return () => {
      window.removeEventListener("popstate", aoNavegar);
      if (fechadaPeloVoltar) return;
      setTimeout(() => { if (camadaNoTopo(history.state, id)) history.back(); }, 0);
    };
  }, [aberta, ligada]);
}
