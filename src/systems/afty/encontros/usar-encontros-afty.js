import { useState, useRef, useCallback } from "react";

import { criarEncontro, duplicarEncontro, normalizarEncontro } from "./afty-encontro";

/**
 * ============================================================
 * ARMAZENAMENTO DOS ENCONTROS DO AFTY
 * ============================================================
 * Espelha o `useEncounterManager` da 2.5.2: lista em `localStorage`, gravação
 * por efeito, e uma API de create/update/remove/duplicate.
 *
 * ⚠ CHAVE PRÓPRIA, e não a `fm_encounters_afty_v1` que o `useEncounterManager`
 * usaria com namespace "afty". Aquela chave guarda o SHAPE DA 2.5.2 (`snapshot`,
 * `combatState`, `initiative`), e o combatente do Afty guarda `ficha` e
 * `sessao`. Duas formas na mesma chave é o tipo de coisa que só quebra meses
 * depois, quando alguém abrir o ambiente errado.
 * ============================================================
 */

const CHAVE = "afty_encontros_v1";

const carregar = () => {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return [];
    const lista = JSON.parse(cru);
    if (!Array.isArray(lista)) return [];
    return lista.map(normalizarEncontro).filter(Boolean);
  } catch {
    // JSON corrompido ou armazenamento bloqueado (modo privado). Lista vazia é
    // melhor que tela de erro: o mestre cria o encontro de novo e joga.
    return [];
  }
};

const gravar = (lista) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
};

export default function useEncontrosAfty() {
  const [encontros, setEncontros] = useState(carregar);
  // Cota estourada não pode ser silenciosa aqui: um encontro é o trabalho de
  // preparação de uma sessão inteira, e perdê-lo sem aviso é pior que a Ficha
  // perder o PV de uma luta.
  const [semGravar, setSemGravar] = useState(false);

  /* ⚠ A GRAVAÇÃO NÃO MORA NUM EFEITO, ao contrário do `useEncounterManager` da
     2.5.2. Duas razões, e a segunda é a que decide:

     1. `setState` dentro de efeito dispara renderização em cascata, e o
        `semGravar` precisa ser estado para virar aviso na tela.
     2. Um efeito grava DEPOIS do render, e por isso não sabe dizer para QUEM
        falhou. Aqui a escrita acontece na mesma função que produziu a lista
        nova, então o aviso nasce junto do que o causou.

     A lista atual vive num ref porque toda ação precisa do anterior para
     calcular o próximo, e ler o estado dentro do `useCallback` prenderia cada
     ação à identidade da lista. */
  const listaRef = useRef(encontros);

  const aplicar = useCallback((fn) => {
    const proxima = fn(listaRef.current);
    listaRef.current = proxima;
    setEncontros(proxima);
    setSemGravar(!gravar(proxima));
    return proxima;
  }, []);

  const criar = useCallback((opcoes = {}) => {
    const novo = criarEncontro(opcoes);
    aplicar((lista) => [novo, ...lista]);
    return novo;
  }, [aplicar]);

  /* Aceita objeto ou função, como o da 2.5.2: o redutor de um encontro só sabe
     transformar o estado anterior, e forçá-lo a ler a lista antes seria dar a
     ele uma dependência que ele não precisa ter. */
  const atualizar = useCallback((id, patchOuFn) => {
    aplicar((lista) => lista.map((e) => {
      if (e.id !== id) return e;
      const proximo = typeof patchOuFn === "function" ? patchOuFn(e) : { ...e, ...patchOuFn };
      return { ...proximo, atualizadoEm: Date.now() };
    }));
  }, [aplicar]);

  const remover = useCallback((id) => {
    aplicar((lista) => lista.filter((e) => e.id !== id));
  }, [aplicar]);

  const duplicar = useCallback((id) => {
    aplicar((lista) => {
      const fonte = lista.find((e) => e.id === id);
      return fonte ? [duplicarEncontro(fonte), ...lista] : lista;
    });
  }, [aplicar]);

  const moverParaPasta = useCallback((id, pastaId) => {
    aplicar((lista) => lista.map((e) => (
      e.id === id ? { ...e, pastaId: pastaId ?? null, atualizadoEm: Date.now() } : e
    )));
  }, [aplicar]);

  return { encontros, criar, atualizar, remover, duplicar, moverParaPasta, semGravar };
}
