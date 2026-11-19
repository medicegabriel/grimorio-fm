/* ============================================================
   A PILHA DE TELAS NO HISTÓRICO DO NAVEGADOR (etapa E2, 2026-11-19)
   ============================================================
   O App troca de tela pelo estado do React (`view`), sem roteador e sem mudar a URL. Até aqui nada ia para o histórico, e o
   Voltar do celular saía do site no meio de uma Ficha (no app instalado do Android, fechava o app).

   Cada tela e cada painel aberto vira uma entrada `history.state.fm = { v, n, tela, camada? }`:
     n       a altura da pilha (0 é a primeira entrada do documento): é o que diz se há para onde voltar sem sair do site
     tela    o mesmo objeto de view do App ({ name, creatureId, encounterId, sistemaNovo })
     camada  presente só na entrada de um painel aberto (uma folha, um painel flutuante, um diálogo): o Voltar a desfaz e o
             painel fecha, antes de a tela mudar

   A URL não muda. O `history.state` sobrevive ao recarregar e à morte do processo no Android, então a mesma tela volta.

   FOLHA, zero imports: os asserts (t-app-pilha.mjs) testam tudo isto no Node. Quem mexe no `history` é o hook
   `usar-pilha-de-telas.js`, e quem liga as camadas é o `camadas.js`. */

export const VERSAO_PILHA = 1;

const TELAS = new Set(["dashboard", "tracker", "aftyFicha", "builder", "encounter", "encounters", "templates"]);

export const TELA_LISTA = Object.freeze({ name: "dashboard", creatureId: null, encounterId: null });

/** Uma tela válida, só com os campos que o App lê. Lixo devolve `null`. */
export function normalizarTela(t) {
  if (!t || typeof t !== "object" || !TELAS.has(t.name)) return null;
  const out = { name: t.name, creatureId: t.creatureId ?? null, encounterId: t.encounterId ?? null };
  if (typeof t.sistemaNovo === "string" && t.sistemaNovo) out.sistemaNovo = t.sistemaNovo;
  return out;
}

export const mesmaTela = (a, b) => JSON.stringify(normalizarTela(a)) === JSON.stringify(normalizarTela(b));

/** A entrada da pilha guardada no `history.state`, ou `null` (entrada de outro código, ou de antes da E2). */
export function lerEntrada(state) {
  const fm = state && typeof state === "object" ? state.fm : null;
  if (!fm || typeof fm !== "object" || fm.v !== VERSAO_PILHA) return null;
  return {
    n: Number.isInteger(fm.n) && fm.n >= 0 ? fm.n : 0,
    tela: normalizarTela(fm.tela),
    camada: typeof fm.camada === "string" && fm.camada ? fm.camada : null,
  };
}

/** O objeto que vai para o `pushState`/`replaceState`. */
export function estadoDaEntrada({ n, tela, camada = null }) {
  const fm = { v: VERSAO_PILHA, n, tela: normalizarTela(tela) };
  if (camada) fm.camada = camada;
  return { fm };
}

/** Na abertura: guarda o que outro código já tinha no `history.state` (a nuvem limpa a URL e repassa o estado) e põe a pilha. */
export function estadoDeAbertura(stateAtual, tela) {
  const base = stateAtual && typeof stateAtual === "object" ? stateAtual : {};
  return { ...base, ...estadoDaEntrada({ n: lerEntrada(stateAtual)?.n ?? 0, tela }) };
}

/**
 * A tela em que o App abre. A do histórico (recarregar, voltar ao app no Android) se ainda existir, senão a lista.
 * `existe(tela)` é do App: a ficha e o encontro ainda estão lá? E o criador da 2.5.2 nunca volta (ver o App).
 */
export function telaInicial(state, existe, padrao = TELA_LISTA) {
  const tela = lerEntrada(state)?.tela;
  if (!tela) return padrao;
  try {
    return existe(tela) ? tela : padrao;
  } catch {
    return padrao;
  }
}

/**
 * Ir para uma tela. Empilha uma entrada nova, MENOS quando a entrada de cima é de um painel aberto: aí ela é trocada,
 * porque o painel vai fechar junto com a tela que muda, e uma entrada de painel morto no meio da pilha pediria um Voltar
 * a mais para nada.
 */
export function planoDeIr(state, tela) {
  const atual = lerEntrada(state);
  if (atual?.camada) return { metodo: "replace", estado: estadoDaEntrada({ n: atual.n, tela }) };
  return { metodo: "push", estado: estadoDaEntrada({ n: (atual?.n ?? 0) + 1, tela }) };
}

/** Trocar a tela de agora sem empilhar (a ficha que sumiu, o criador da 2.5.2). */
export function planoDeSubstituir(state, tela) {
  return { metodo: "replace", estado: estadoDaEntrada({ n: lerEntrada(state)?.n ?? 0, tela }) };
}

/** O Voltar dos botões da tela: o do histórico quando há para onde, senão trocar pela tela de reserva. */
export function planoDeVoltar(state, reserva = TELA_LISTA) {
  const atual = lerEntrada(state);
  if (atual && atual.n > 0) return { metodo: "back" };
  return planoDeSubstituir(state, reserva);
}

/** Abrir um painel: empilha uma entrada com a MESMA tela e a marca da camada. */
export function planoDaCamada(state, id, telaPadrao = TELA_LISTA) {
  const atual = lerEntrada(state);
  return { metodo: "push", estado: estadoDaEntrada({ n: (atual?.n ?? 0) + 1, tela: atual?.tela ?? telaPadrao, camada: id }) };
}

/** Depois de um Voltar: o painel `id` saiu do topo? Então ele fecha. */
export const camadaSaiu = (stateNovo, id) => lerEntrada(stateNovo)?.camada !== id;

/** O painel `id` ainda é a entrada de cima? Só então fechar pelo X desfaz a entrada dele. */
export const camadaNoTopo = (state, id) => lerEntrada(state)?.camada === id;
