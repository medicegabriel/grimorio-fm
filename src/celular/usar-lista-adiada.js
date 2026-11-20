import React, { useMemo, useState } from "react";

/* ============================================================
   A LISTA DE ENCONTROS SEM O MOTOR NA ABERTURA (etapa E10 do app Era de Ouro, 2026-11-20)
   ============================================================
   O gancho da lista (`usar-lista-encontros.js`) entra pelo `modelo` e pelos motores, e com ele vinha o motor do Afty
   inteiro no pacote de abertura. Aqui o App recebe a lista por uma ponte sob demanda (`PonteDaLista.jsx`), que só baixa
   quando `quer` fica true (uma tela de Encontro, ou a busca das Salas fechadas com conta). O App nunca volta `quer` para
   false, para a lista não voltar a ser a de espera ao sair dos Encontros. Até a ponte chegar, a lista é a de espera abaixo:
   vazia, com `pronto` em false e as ações sem efeito.
   As telas que mexem na lista (a lista de Encontros e o Encontro) esperam o `pronto` com o Carregando.

   Devolve `[lista, ponte]`. A ponte é um elemento que o App desenha uma vez, em qualquer lugar.
   ============================================================ */

const PonteDaLista = React.lazy(() => import("../systems/afty/encontros/PonteDaLista"));

const semEfeito = () => {};
const semResultado = () => null;

/** A lista enquanto a ponte não chega (e na rota da Sala, onde ela fica desligada). */
export function listaDeEspera(grupo) {
  return Object.freeze({
    grupo,
    pronto: false,
    encontros: [],
    pastas: [],
    ilegivel: false,
    pastasIlegiveis: false,
    migracao: null,
    semGravar: false,
    criar: semResultado,
    atualizar: semEfeito,
    importar: semEfeito,
    remover: semEfeito,
    removerVarios: semEfeito,
    duplicar: semResultado,
    moverParaPasta: semEfeito,
    moverVarios: semEfeito,
    reordenar: semEfeito,
    criarPasta: semResultado,
    renomearPasta: semEfeito,
    removerPasta: semEfeito,
  });
}

export function useListaAdiada(grupo, { ativo = true, quer = false } = {}) {
  const [viva, setViva] = useState(null);
  const espera = useMemo(() => listaDeEspera(grupo), [grupo]);
  const lista = ativo && viva?.grupo === grupo ? viva : espera;
  // Sem JSX de propósito: o arquivo é `.js`, e assim o recarregar do Vite (que pede só componentes num `.jsx`) não reclama.
  const ponte = ativo && quer
    ? React.createElement(React.Suspense, { fallback: null }, React.createElement(PonteDaLista, { grupo, aoMudar: setViva }))
    : null;
  return [lista, ponte];
}

/** Chama `fn` quando o navegador estiver ocioso (no máximo em `prazo` ms). Devolve o cancelar. */
export function quandoOcioso(fn, prazo = 8000) {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: prazo });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 3000);
  return () => clearTimeout(id);
}
