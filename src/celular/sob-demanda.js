import { lazy } from "react";
import TelaNovaVersao from "./TelaNovaVersao";

/**
 * Uma tela que só é baixada quando aparece (etapa E3, S-23). É o `React.lazy` com uma rede embaixo: se o pedaço não chega
 * (o caso comum é um deploy novo com a página aberta, e o servidor não tem mais os pedaços da versão antiga), a tela vira a
 * "Nova Versão Disponível" com o botão Atualizar, em vez da tela de erro do app inteiro.
 *
 * ⚠ O `vercel.json` devolve 404 de verdade para `/assets/*` que não existe. Sem isso, a reescrita do site entregava o
 * `index.html` no lugar do JavaScript e o erro era de tipo de arquivo, mais difícil de reconhecer.
 */
export function telaSobDemanda(carregar) {
  return lazy(() => carregar().catch(() => ({ default: TelaNovaVersao })));
}
