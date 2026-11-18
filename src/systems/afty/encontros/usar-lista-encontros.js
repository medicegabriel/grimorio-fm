import { useCallback, useEffect, useRef, useState } from "react";

/* Os motores entram PRIMEIRO, pela porta do modelo (ver o topo de modelo.js). */
import { criarEncontro, duplicarEncontro } from "./modelo";
import { CHAVE_LISTA, gravarLista } from "./listas";
import { lerListaDeEncontros, executarMigracaoDoSite } from "./migracao";
import { CHAVE_PASTAS, lerPastas, comPastasCitadas, gravarPastas } from "./pastas";

/**
 * ============================================================
 * A LISTA DE ENCONTROS DE UMA ROTA (etapa 6a, 2026-11-17)
 * ============================================================
 * O sucessor do `usar-encontros-afty.js`, para as três listas do Encontro
 * unificado (`site`, `afty`, `eradeouro`, ver listas.js). Lê e grava o formato
 * novo (`versao: 2`), com as pastas próprias de cada lista (pastas.js).
 *
 * ⚠ A MIGRAÇÃO DO SITE RODA ANTES DE QUALQUER LEITURA, EM QUALQUER ROTA, uma vez
 * por página. Ela copia para a lista do site os Encontros do `/Player` de antes
 * que moram em `afty_encontros_v1`, reconhecendo-os pelo formato ANTIGO. Se o
 * `/Afty` abrisse primeiro e regravasse a chave no formato novo, o personagem
 * ligado deixaria de ser reconhecido e a cópia se perderia calada.
 *
 * ⚠ LISTA ILEGÍVEL É SÓ LEITURA. `lerListaDeEncontros` devolve `null` quando o
 * texto gravado não é lista, e daí em diante nenhuma ação grava: a tela mostra o
 * erro e a chave fica como está, para ninguém perder o que está lá.
 *
 * A gravação mora na mesma função que produz a lista nova (como no gancho de
 * antes), para o aviso de cota estourada nascer junto do que o causou.
 * ============================================================
 */

let migracaoDaPagina = null;

/** A migração do site, uma vez por página. Devolve o resultado da primeira rodada. */
export function migrarUmaVez(armazem = globalThis.localStorage) {
  if (!migracaoDaPagina) {
    try { migracaoDaPagina = executarMigracaoDoSite(armazem); } catch (e) { migracaoDaPagina = { ok: false, erro: e?.message ?? "Falha na Migração" }; }
  }
  return migracaoDaPagina;
}

function carregar(grupo, armazem) {
  const migracao = migrarUmaVez(armazem);
  const encontros = lerListaDeEncontros(grupo, { armazem });
  const pastasGravadas = lerPastas(grupo, armazem);
  const pastas = pastasGravadas && encontros ? comPastasCitadas(grupo, pastasGravadas, encontros, armazem) : (pastasGravadas ?? []);
  // A pasta copiada de uma origem grava uma vez, na abertura.
  if (pastasGravadas && pastas !== pastasGravadas) gravarPastas(grupo, pastas, armazem);
  return {
    encontros: encontros ?? [],
    ilegivel: encontros === null,
    pastas,
    pastasIlegiveis: pastasGravadas === null,
    migracao,
  };
}

let contadorPasta = 0;
const idDePasta = () => `pasta_${Date.now().toString(36)}_${(contadorPasta++).toString(36)}`;

const DESLIGADA = Object.freeze({ encontros: [], ilegivel: false, pastas: [], pastasIlegiveis: false, migracao: null });

/**
 * `ativo = false` (os Encontros com cadeado em `/` e `/Player`): não migra, não lê e não grava nada. O gancho existe nas
 * quatro rotas porque gancho não pode ser condicional.
 */
export default function useListaDeEncontros(grupo, { armazem = globalThis.localStorage, ativo = true } = {}) {
  const [estado, setEstado] = useState(() => (ativo ? carregar(grupo, armazem) : DESLIGADA));
  const [semGravar, setSemGravar] = useState(false);
  const listaRef = useRef(estado.encontros);
  const pastasRef = useRef(estado.pastas);

  /* Outra aba gravou a mesma lista: relê. Sem isto a próxima gravação desta aba apagaria a mudança de lá. */
  useEffect(() => {
    if (!ativo) return undefined;
    const aoMudar = (e) => {
      if (e.storageArea !== armazem) return;
      if (e.key !== CHAVE_LISTA[grupo] && e.key !== CHAVE_PASTAS[grupo] && e.key !== null) return;
      const novo = carregar(grupo, armazem);
      listaRef.current = novo.encontros;
      pastasRef.current = novo.pastas;
      setEstado(novo);
    };
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  }, [grupo, armazem, ativo]);

  const aplicar = useCallback((fn) => {
    if (!ativo || estado.ilegivel) return listaRef.current;
    const proxima = fn(listaRef.current);
    if (proxima === listaRef.current) return proxima;
    listaRef.current = proxima;
    setEstado((s) => ({ ...s, encontros: proxima }));
    setSemGravar(!gravarLista(grupo, proxima, armazem, { telaAntigaDesligada: true }).ok);
    return proxima;
  }, [ativo, estado.ilegivel, grupo, armazem]);

  const aplicarPastas = useCallback((fn) => {
    if (!ativo || estado.pastasIlegiveis) return pastasRef.current;
    const proximas = fn(pastasRef.current);
    if (proximas === pastasRef.current) return proximas;
    pastasRef.current = proximas;
    setEstado((s) => ({ ...s, pastas: proximas }));
    setSemGravar(!gravarPastas(grupo, proximas, armazem).ok);
    return proximas;
  }, [ativo, estado.pastasIlegiveis, grupo, armazem]);

  const criar = useCallback((opcoes = {}) => {
    const novo = criarEncontro({ nome: "Novo Encontro", ...opcoes, grupo });
    aplicar((lista) => [novo, ...lista]);
    return novo;
  }, [aplicar, grupo]);

  /* Objeto ou função. A função recebe o Encontro de AGORA, e é o caminho do gancho do Encontro. */
  const atualizar = useCallback((id, patchOuFn) => {
    aplicar((lista) => {
      let mudou = false;
      const nova = lista.map((e) => {
        if (e.id !== id) return e;
        const proximo = typeof patchOuFn === "function" ? patchOuFn(e) : { ...e, ...patchOuFn };
        if (proximo === e) return e;
        mudou = true;
        return { ...proximo, atualizadoEm: Date.now() };
      });
      return mudou ? nova : lista;
    });
  }, [aplicar]);

  /* Põe (ou troca, pelo id) um Encontro pronto no topo da lista: o Encontro Finalizado de uma Sala (etapa 7b). */
  const importar = useCallback((encontro) => {
    if (!encontro?.id) return;
    aplicar((lista) => [encontro, ...lista.filter((e) => e.id !== encontro.id)]);
  }, [aplicar]);

  const removerVarios = useCallback((ids) => {
    const fora = new Set(ids);
    aplicar((lista) => lista.filter((e) => !fora.has(e.id)));
  }, [aplicar]);

  const remover = useCallback((id) => removerVarios([id]), [removerVarios]);

  const duplicar = useCallback((id) => {
    let copia = null;
    aplicar((lista) => {
      const i = lista.findIndex((e) => e.id === id);
      if (i === -1) return lista;
      copia = duplicarEncontro(lista[i]);
      return [...lista.slice(0, i + 1), copia, ...lista.slice(i + 1)];
    });
    return copia;
  }, [aplicar]);

  const moverVarios = useCallback((ids, pastaId) => {
    const alvo = new Set(ids);
    aplicar((lista) => lista.map((e) => (alvo.has(e.id) ? { ...e, pastaId: pastaId ?? null, atualizadoEm: Date.now() } : e)));
  }, [aplicar]);

  const moverParaPasta = useCallback((id, pastaId) => moverVarios([id], pastaId), [moverVarios]);

  /* Arrastar para ordenar: a ordem da lista É a ordem gravada. `ids` é a ordem nova de um trecho (o que o filtro
     mostra), e o resto da lista fica no lugar. */
  const reordenar = useCallback((ids) => {
    aplicar((lista) => {
      const posicoes = lista.map((e, i) => (ids.includes(e.id) ? i : -1)).filter((i) => i >= 0);
      if (posicoes.length !== ids.length) return lista;
      const porId = new Map(lista.map((e) => [e.id, e]));
      const nova = lista.slice();
      posicoes.forEach((p, k) => { nova[p] = porId.get(ids[k]); });
      return nova.every((e, i) => e === lista[i]) ? lista : nova;
    });
  }, [aplicar]);

  const criarPasta = useCallback((nome) => {
    const pasta = { id: idDePasta(), name: String(nome ?? "").trim() || "Nova Pasta" };
    aplicarPastas((p) => [...p, pasta]);
    return pasta;
  }, [aplicarPastas]);

  const renomearPasta = useCallback((id, nome) => {
    const limpo = String(nome ?? "").trim();
    if (!limpo) return;
    aplicarPastas((p) => p.map((x) => (x.id === id ? { ...x, name: limpo } : x)));
  }, [aplicarPastas]);

  /* Apagar a pasta não apaga Encontro: os dela vão para Sem Pasta. */
  const removerPasta = useCallback((id) => {
    aplicarPastas((p) => p.filter((x) => x.id !== id));
    aplicar((lista) => (lista.some((e) => e.pastaId === id)
      ? lista.map((e) => (e.pastaId === id ? { ...e, pastaId: null } : e)) : lista));
  }, [aplicarPastas, aplicar]);

  return {
    grupo,
    encontros: estado.encontros,
    pastas: estado.pastas,
    ilegivel: estado.ilegivel,
    pastasIlegiveis: estado.pastasIlegiveis,
    migracao: estado.migracao,
    semGravar,
    criar, atualizar, importar, remover, removerVarios, duplicar, moverParaPasta, moverVarios, reordenar,
    criarPasta, renomearPasta, removerPasta,
  };
}
