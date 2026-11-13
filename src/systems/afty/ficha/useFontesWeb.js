/* ============================================================
   AS FONTES DA INTERNET NA FICHA (autor, 2026-11-10)
   ============================================================
   Um `<link>` no `<head>`, FORA do `@scope` do tema, só quando o tema usa uma família da lista fechada (`FONTES_WEB` em `ficha-tema.js`).
   O endereço sai da tabela, nunca de texto do tema. Sem internet o link falha calado e cada pilha cai na reserva do sistema.

   `useFontesWeb(tema)` serve a Ficha. `useFontesDaPrevia(ativo)` baixa só as letras dos rótulos das doze famílias (parâmetro `text` do Google
   Fonts, poucos KB), para os botões do painel de Aparência aparecerem cada um na sua fonte enquanto o painel está aberto.
   ============================================================ */
import { useEffect, useMemo } from "react";
import { FONTES_WEB, fontesWebDoTema, urlDasFontesWeb } from "./ficha-tema";

function useLink(id, href) {
  useEffect(() => {
    if (!href || typeof document === "undefined") return undefined;
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.crossOrigin = "anonymous";
      link.referrerPolicy = "no-referrer";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    return () => { link.remove(); };
  }, [id, href]);
}

export function useFontesWeb(tema, desligado = false) {
  const href = useMemo(() => (desligado ? "" : urlDasFontesWeb(fontesWebDoTema(tema))), [tema, desligado]);
  useLink("afty-fontes-web", href);
}

export function useFontesDaPrevia(ativo) {
  const href = ativo ? urlDasFontesWeb(FONTES_WEB, [...new Set(FONTES_WEB.map((f) => f.label).join(""))].join("")) : "";
  useLink("afty-fontes-web-previa", href);
}
