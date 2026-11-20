/* ============================================================
   O LINK DA SALA ABERTO DIRETO NO APP (etapa E7, 2026-11-20)
   ============================================================
   O escopo do app é o site inteiro, então um link de Sala tocado no WhatsApp abre DENTRO do app Era de Ouro. Só que aí o
   histórico tem uma página só, e o Voltar do aparelho fecha o app em vez de levar à Guilda.

   No primeiro toque na página, a entrada atual vira `/EraDeOuro` e a Sala entra por cima dela (o Chrome ignora `pushState` sem
   gesto, por isso o toque). O Voltar volta para a Guilda, e a página recarrega lá, porque a rota é lida do endereço na abertura.
   Só no app instalado e só quando a Sala é a primeira página: aberta de dentro do site, o Voltar já tem para onde ir.
   ============================================================ */

export const ROTA_DE_INICIO = "/EraDeOuro";

/** Precisa da entrada de início? Só no app instalado, com a Sala como primeira página da aba. */
export function precisaDeInicio({ instalado, tamanhoDoHistorico, estado }) {
  return !!instalado && tamanhoDoHistorico <= 1 && !estado?.fmInicioDaSala;
}

/**
 * Liga a entrada de início. `janela` é o `window` (no assert, um de mentira). Devolve a função que desliga.
 */
export function ligarInicioNaGuilda(janela, { instalado }) {
  if (!janela?.history || !precisaDeInicio({ instalado, tamanhoDoHistorico: janela.history.length, estado: janela.history.state })) return () => {};
  const aqui = `${janela.location.pathname}${janela.location.search}`;
  let feito = false;
  const aoTocar = () => {
    if (feito) return;
    feito = true;
    janela.removeEventListener("pointerdown", aoTocar, true);
    try {
      janela.history.replaceState({ fmInicioDaSala: true }, "", ROTA_DE_INICIO);
      janela.history.pushState(null, "", aqui);
    } catch {
      /* sem histórico, segue como estava */
    }
  };
  const aoVoltar = (e) => {
    if (e.state?.fmInicioDaSala) janela.location.replace(ROTA_DE_INICIO);
  };
  janela.addEventListener("pointerdown", aoTocar, true);
  janela.addEventListener("popstate", aoVoltar);
  return () => {
    janela.removeEventListener("pointerdown", aoTocar, true);
    janela.removeEventListener("popstate", aoVoltar);
  };
}
