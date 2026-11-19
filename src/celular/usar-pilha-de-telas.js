import { useCallback, useEffect, useState } from "react";
import { PILHA_LIGADA } from "./pwa-config";
import {
  TELA_LISTA, estadoDeAbertura, lerEntrada, mesmaTela, normalizarTela, planoDeIr, planoDeSubstituir, planoDeVoltar, telaInicial,
} from "./pilha";

/* Aplica um plano da pilha (pilha.js) no `history` de verdade. */
function aplicar(plano) {
  if (plano.metodo === "push") history.pushState(plano.estado, "");
  else if (plano.metodo === "replace") history.replaceState(plano.estado, "");
  else if (plano.metodo === "back") history.back();
}

/**
 * A tela do App ligada ao histórico do navegador (etapa E2). Devolve `{ tela, ir, substituir, voltar }`:
 *   ir(tela)          empilha (o Voltar do aparelho volta para a tela de antes). Chamar só de um toque: o Chrome pula, no
 *                     Voltar, a entrada empilhada sem gesto da pessoa.
 *   substituir(tela)  troca a tela de agora sem empilhar
 *   voltar(reserva)   o Voltar dos botões da tela: volta no histórico quando há para onde, senão troca pela reserva
 *
 * `existe(tela)` decide se a tela guardada no histórico ainda pode abrir (a ficha ou o encontro foram apagados?).
 * Com `PILHA_LIGADA` em false tudo vira estado puro do React, como antes.
 */
export function usePilhaDeTelas({ existe, padrao = TELA_LISTA, ligada = PILHA_LIGADA }) {
  const [tela, setTela] = useState(() => (
    ligada && typeof history !== "undefined" ? telaInicial(history.state, existe, padrao) : padrao
  ));

  /* Na abertura a entrada de agora ganha a pilha (só `replaceState`: empilhar sem gesto seria pulado pelo Chrome). */
  useEffect(() => {
    if (!ligada) return;
    history.replaceState(estadoDeAbertura(history.state, tela), "");
    // Só na abertura: a tela de depois é escrita por `ir` e `substituir`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligada]);

  /* O Voltar e o Avançar do aparelho: a tela da entrada de chegada. A entrada de um painel tem a mesma tela, e aí nada muda. */
  useEffect(() => {
    if (!ligada) return undefined;
    const aoNavegar = (e) => {
      const nova = lerEntrada(e.state)?.tela ?? padrao;
      setTela((atual) => (mesmaTela(atual, nova) ? atual : nova));
    };
    window.addEventListener("popstate", aoNavegar);
    return () => window.removeEventListener("popstate", aoNavegar);
  }, [ligada, padrao]);

  const ir = useCallback((nova) => {
    const alvo = normalizarTela(nova) ?? padrao;
    if (ligada) aplicar(planoDeIr(history.state, alvo));
    setTela(alvo);
  }, [ligada, padrao]);

  const substituir = useCallback((nova) => {
    const alvo = normalizarTela(nova) ?? padrao;
    if (ligada) aplicar(planoDeSubstituir(history.state, alvo));
    setTela(alvo);
  }, [ligada, padrao]);

  const voltar = useCallback((reserva = padrao) => {
    if (!ligada) {
      setTela(normalizarTela(reserva) ?? padrao);
      return;
    }
    const plano = planoDeVoltar(history.state, reserva);
    aplicar(plano);
    // O `back` chega pelo `popstate`. A troca sem histórico muda a tela aqui.
    if (plano.metodo !== "back") setTela(normalizarTela(reserva) ?? padrao);
  }, [ligada, padrao]);

  return { tela, ir, substituir, voltar };
}
