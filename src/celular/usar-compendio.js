import { useCallback, useLayoutEffect, useState } from "react";

/* O COMPÊNDIO DA 2.5.2 SOB DEMANDA (etapa E3, 2026-11-19). As cinco enciclopédias são 4,5 MB de JSON, e iam no pacote de
   abertura de TODA rota, inclusive a Guilda e o /Player no celular, que nunca as mostram (as Criaturas Base são só do `/`).
   Agora só o `/` as baixa, uma vez por página.

   ⚠ A FALHA NÃO FICA GUARDADA (2026-11-26). Até aqui o erro era engolido e o Carregando ficava para sempre. Agora a promessa
   que falhou é zerada, o gancho conta a falha e o App mostra o Tentar de Novo. */

let promessa = null;
let carregado = null;

export function carregarCompendio() {
  if (!promessa) {
    promessa = import("../fm-compendium").then((m) => {
      carregado = m;
      return m;
    }).catch((erro) => {
      promessa = null;
      throw erro;
    });
  }
  return promessa;
}

/**
 * `compendio`: o módulo quando `ligado` (a rota `/`), ou `null` enquanto ele não chega e fora dela.
 * `falhou`: o pedido não deu certo. `tentarDeNovo` faz outro pedido.
 */
export function useCompendio(ligado) {
  const [modulo, setModulo] = useState(() => (ligado ? carregado : null));
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  // `useLayoutEffect`: o pedido sai antes da pintura. Num efeito comum ele esperava o navegador desenhar o esqueleto da lista.
  useLayoutEffect(() => {
    if (!ligado || modulo) return undefined;
    let vivo = true;
    carregarCompendio().then((m) => { if (vivo) setModulo(m); }).catch(() => { if (vivo) setFalhou(true); });
    return () => { vivo = false; };
  }, [ligado, modulo, tentativa]);
  const tentarDeNovo = useCallback(() => {
    setFalhou(false);
    setTentativa((n) => n + 1);
  }, []);
  return { compendio: ligado ? modulo : null, falhou: ligado && falhou, tentarDeNovo };
}

/* Cópia do `isBuiltInId` de fm-compendium.js, para quem não baixou o compêndio saber que um id é de lá. O
   asserts/t-app-entradas.mjs confere as duas. */
export const ehIdDoCompendio = (id) => typeof id === "string" && id.startsWith("builtin_");
