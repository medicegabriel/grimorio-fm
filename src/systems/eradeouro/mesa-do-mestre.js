/**
 * ============================================================
 * A MESA DO MESTRE DA GUILDA (autor, 2026-11-11)
 * ============================================================
 * "Crie uma aba de Mestre no Era de Ouro que e capaz de importar as fichas e
 * deixa-las separadas, com vida e PE claros alem de poder selecionar as criaturas
 * [...] para o mestre conseguir subtrair vida e PE de suas criatruras e dos players
 * sem adentrar na ficha [...] tem que ter como retirar as fichas facilmente tbm"
 *
 * A mesa guarda ENTRADAS, nunca números. Dois tipos:
 *
 *   • "lista": aponta para uma ficha da lista da Guilda pelo id. A ficha continua
 *     morando na lista, e a Vida e o PE são a MESMA sessão da Ficha Final
 *     (`fm_ficha_sessao_afty_v1:<id>`), decisão do autor ("Mesmo Valor da Ficha").
 *     Tirar da mesa não apaga nada.
 *   • "importada": a CÓPIA de um arquivo exportado (a ficha de um jogador). Fica só
 *     na mesa, separada da lista, com id novo (`mesa_...`) para não colidir com uma
 *     ficha da lista de mesmo id, e a sessão dela usa esse id. Tirar da mesa apaga
 *     a cópia e a sessão dela.
 *
 * Atualizar uma importada (o jogador subiu de nível) troca a ficha e MANTÉM o id, e
 * com ele a Vida e o PE correntes. Quem apara no máximo novo é o `aparaSessao`.
 *
 * ⚠ Módulo PURO: não importa React nem o motor. O verbo de sessão (dano, cura, PE)
 * mora em `mesa-do-mestre-sessao.js`, que importa a sessão da Ficha.
 * ============================================================
 */

export const CHAVE_MESA_DO_MESTRE = "fm_mesa_mestre_eradeouro_v1";
const VERSAO = 1;

export const mesaVazia = () => ({ versao: VERSAO, entradas: [] });

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/** Lê o que veio do armazenamento, descartando o que não é entrada válida. */
export function normalizaMesa(cru) {
  if (!ehObjeto(cru) || !Array.isArray(cru.entradas)) return mesaVazia();
  const vistos = new Set();
  const entradas = [];
  for (const e of cru.entradas) {
    if (!ehObjeto(e) || typeof e.id !== "string" || vistos.has(e.id)) continue;
    if (e.tipo === "lista" && typeof e.fichaId === "string" && e.fichaId) {
      vistos.add(e.id);
      entradas.push({ id: e.id, tipo: "lista", fichaId: e.fichaId });
    } else if (e.tipo === "importada" && ehObjeto(e.ficha) && typeof e.ficha.id === "string") {
      vistos.add(e.id);
      entradas.push({ id: e.id, tipo: "importada", ficha: e.ficha, origemId: e.origemId ?? null });
    }
  }
  return { versao: VERSAO, entradas };
}

export function carregarMesa(armazem = globalThis.localStorage) {
  try {
    const cru = armazem?.getItem(CHAVE_MESA_DO_MESTRE);
    return cru ? normalizaMesa(JSON.parse(cru)) : mesaVazia();
  } catch {
    return mesaVazia();
  }
}

export function salvarMesa(mesa, armazem = globalThis.localStorage) {
  try {
    armazem?.setItem(CHAVE_MESA_DO_MESTRE, JSON.stringify(normalizaMesa(mesa)));
    return true;
  } catch {
    return false;
  }
}

/** O id da sessão (o mesmo da Ficha Final quando a entrada é da lista). */
export const idDaSessao = (entrada) => (entrada.tipo === "lista" ? entrada.fichaId : entrada.ficha.id);

/** A ficha de uma entrada. A da lista vem da lista atual, e some se a ficha saiu dela. */
export const fichaDaEntrada = (entrada, porId) =>
  (entrada.tipo === "lista" ? porId.get(entrada.fichaId) ?? null : entrada.ficha);

/** Jogador ou criatura, pela marca da ficha, igual ao resto do app. */
export const grupoDaFicha = (ficha) =>
  (String(ficha?.rulesVersion ?? "").toLowerCase() === "player" ? "jogador" : "criatura");

/** Põe fichas da lista na mesa. A que já está não entra de novo. */
export function adicionarDaLista(mesa, fichaIds = []) {
  const ja = new Set(mesa.entradas.filter((e) => e.tipo === "lista").map((e) => e.fichaId));
  const novas = [];
  for (const id of fichaIds) {
    if (typeof id !== "string" || !id || ja.has(id)) continue;
    ja.add(id);
    novas.push({ id: `lista_${id}`, tipo: "lista", fichaId: id });
  }
  return novas.length ? { ...mesa, entradas: [...mesa.entradas, ...novas] } : mesa;
}

let contador = 0;
const idNovo = () => `mesa_${Date.now().toString(36)}_${(contador++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Põe cópias de fichas importadas na mesa. `aceita` decide quem entra (a porta do
 * livro: só ficha do Afty ou do Player). Devolve a mesa e quantas ficaram de fora.
 */
export function importarNaMesa(mesa, fichas = [], { aceita = () => true, gerarId = idNovo } = {}) {
  const novas = [];
  let recusadas = 0;
  for (const f of fichas) {
    if (!ehObjeto(f) || !aceita(f)) { recusadas++; continue; }
    const id = gerarId();
    novas.push({ id, tipo: "importada", ficha: { ...f, id, folderId: null }, origemId: typeof f.id === "string" ? f.id : null });
  }
  return { mesa: novas.length ? { ...mesa, entradas: [...mesa.entradas, ...novas] } : mesa, recusadas };
}

/** Troca a ficha de uma importada pela versão nova, mantendo o id (e a sessão). */
export function atualizarImportada(mesa, entradaId, fichaNova) {
  if (!ehObjeto(fichaNova)) return mesa;
  let mudou = false;
  const entradas = mesa.entradas.map((e) => {
    if (e.id !== entradaId || e.tipo !== "importada") return e;
    mudou = true;
    return {
      ...e,
      ficha: { ...fichaNova, id: e.ficha.id, folderId: null },
      origemId: typeof fichaNova.id === "string" ? fichaNova.id : e.origemId,
    };
  });
  return mudou ? { ...mesa, entradas } : mesa;
}

/**
 * Tira entradas da mesa. Devolve também os ids de sessão a apagar: só os das
 * importadas, porque a sessão de uma ficha da lista é a da Ficha Final.
 */
export function removerDaMesa(mesa, entradaIds = []) {
  const sai = new Set(entradaIds);
  const sessoesAApagar = mesa.entradas
    .filter((e) => sai.has(e.id) && e.tipo === "importada")
    .map((e) => e.ficha.id);
  const entradas = mesa.entradas.filter((e) => !sai.has(e.id));
  return { mesa: entradas.length === mesa.entradas.length ? mesa : { ...mesa, entradas }, sessoesAApagar };
}

/** Tira da mesa as entradas da lista cuja ficha não existe mais. */
export function semFichasApagadas(mesa, idsDaLista) {
  const existe = new Set(idsDaLista);
  const entradas = mesa.entradas.filter((e) => e.tipo !== "lista" || existe.has(e.fichaId));
  return entradas.length === mesa.entradas.length ? mesa : { ...mesa, entradas };
}

/** Metade arredondada para baixo, a regra do Afty. */
export const metade = (valor) => Math.floor(Math.max(0, Math.trunc(Number(valor) || 0)) / 2);
