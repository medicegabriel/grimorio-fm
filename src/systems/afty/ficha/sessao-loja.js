/* A LOJA VIVA DA SESSÃO (Etapa 2 do Encontro Unificado e Sala, 2026-11-17).

   Até aqui a Ficha (G2 e clássica) lia a sessão UMA vez, no `useState`, e gravava com atraso de 600 ms. Uma Ficha aberta gravava por cima de
   qualquer mudança vinda de fora (outra aba, o Encontro, a Sala) sem saber que ela existia. Esta loja é a fonte única da sessão no aparelho:

   - Mesma chave (`chaveDaSessao`, de `ficha-sessao.js`) e mesmo aparo de leitura do `carregarSessao` (`normalizaSessao` com o derive da
     montagem, `sessaoEmBranco` quando não há nada gravado ou o JSON está quebrado). A gravação passa pelo próprio `salvarSessao`.
   - A edição local é uma FILA DE FUNÇÕES (`pendentes`), a mesma forma do `atualiza((s) => ...)` da Ficha. A tela vê a fila aplicada sobre a
     última versão conhecida. Quando chega uma versão de fora antes de a fila ser gravada, a fila é REAPLICADA sobre ela: nada da edição local
     se perde e nada de fora é apagado.
   - A versão é o TEXTO gravado, e não o `atualizadoEm`: comparar texto não depende de relógio nem do mesmo milissegundo, e a mesclagem da
     nuvem grava sem carimbar de novo. Antes de gravar, a loja relê a chave. Se o texto mudou desde a base da fila, reaplica a fila sobre o
     texto novo e só então grava (nunca grava por cima de versão mais nova).
   - Outras abas chegam pelo evento `storage`. A Sala (etapa 7b) entra por `aplicarRemoto`.

   ⚠ A FOTOGRAFIA É ESTÁVEL. `ler` devolve o MESMO objeto até a sessão mudar de verdade, e a gravação não troca o objeto da tela (o carimbo
   `atualizadoEm` fica só no texto gravado). Cada objeto novo custa um derive inteiro na Ficha (`prepararCalculo` lê a sessão), então gravar
   não pode mudar o que o React vê.

   ⚠ NUNCA importe este módulo de `ficha-sessao.js`: seria um ciclo. A dependência é só desta para aquela.

   Quem grava direto pelo `salvarSessao` (o criador, ao copiar a Imitação, e a Mesa do Mestre) não avisa a loja. Isso é seguro porque nenhum
   deles roda com a Ficha montada, e a loja relê a chave em toda leitura que não tem ninguém ouvindo, e antes de toda gravação. */
import { useCallback, useSyncExternalStore } from "react";
import { chaveDaSessao, normalizaSessao, salvarSessao, sessaoEmBranco } from "./ficha-sessao";

const ATRASO_GRAVACAO = 600;

/** chave -> { id, chave, cru, base, atual, pendentes, timer, derived, aparar, ouvintes } */
const entradas = new Map();

function lerCru(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

/* O mesmo aparo do `carregarSessao`: chave ausente, JSON quebrado e armazenamento bloqueado viram sessão em branco, em silêncio. */
function deCru(cru, derived) {
  if (!cru) return sessaoEmBranco(derived);
  try {
    return normalizaSessao(JSON.parse(cru), derived);
  } catch {
    return sessaoEmBranco(derived);
  }
}

/** Aplica a fila de edições sobre uma base. Edição que quebra numa base nova é descartada, e as outras seguem. */
export function reaplicar(base, pendentes) {
  let s = base;
  for (const fn of pendentes) {
    try {
      s = fn(s);
    } catch {
      /* A edição foi feita sobre outra versão e não cabe nesta. As seguintes continuam valendo. */
    }
  }
  return s;
}

function avisar(e) {
  for (const fn of [...e.ouvintes]) fn();
}

/* Adota um texto novo como base e reaplica a fila em cima. Só troca o objeto da tela quando o texto é outro. */
function adotar(e, cru) {
  if (cru === e.cru) return;
  e.cru = cru;
  e.base = deCru(cru, e.derived);
  e.atual = reaplicar(e.base, e.pendentes);
  avisar(e);
}

function entradaDe(id, derivado = null) {
  const chave = chaveDaSessao(id);
  let e = entradas.get(chave);
  if (!e) {
    /* O derive da montagem, calculado UMA vez: é o mesmo `carregarSessao(alvoId, deriveAfty(ficha))` que a Ficha fazia no `useState`. */
    const derived = typeof derivado === "function" ? derivado() : derivado;
    const cru = lerCru(chave);
    const base = deCru(cru, derived);
    e = { id, chave, cru, base, atual: base, pendentes: [], timer: null, derived, aparar: null, ouvintes: new Set() };
    entradas.set(chave, e);
  } else if (!e.ouvintes.size) {
    /* Ninguém ouvindo: a chave pode ter sido gravada por fora (o criador, a Mesa do Mestre). Relê antes de responder. */
    adotar(e, lerCru(chave));
  }
  return e;
}

/** A sessão de agora. `derivado` (objeto ou função) só é usado na primeira leitura daquela chave, para os máximos da sessão nova. */
export function ler(id, derivado = null) {
  return entradaDe(id, derivado).atual;
}

/** Ouve as mudanças da sessão. Devolve a função de parar. */
export function ouvir(id, fn) {
  instalarOuvintesDaJanela();
  const e = entradaDe(id);
  e.ouvintes.add(fn);
  return () => { e.ouvintes.delete(fn); };
}

/* O aparo de GRAVAÇÃO, com o derive vivo da Ficha. A Ficha sempre gravou a sessão aparada pelo derive de depois da edição (o PV que caiu
   junto do máximo fica no número novo), e o `atualiza` só conhece o derive de antes. Sem aparo registrado, grava o que está na tela. */
export function definirAparo(id, aparar) {
  entradaDe(id).aparar = typeof aparar === "function" ? aparar : null;
}

function agendar(e) {
  clearTimeout(e.timer);
  e.timer = setTimeout(() => { descarregarEntrada(e); }, ATRASO_GRAVACAO);
}

/**
 * Edição local. `fn` recebe a sessão de agora e devolve a próxima, a mesma forma do `atualiza` da Ficha. A tela muda na hora e a gravação
 * sai 600 ms depois da última edição, como antes.
 */
export function atualizar(id, fn) {
  const e = entradaDe(id);
  const proxima = fn(e.atual);
  if (proxima === e.atual) return e.atual;
  e.pendentes.push(fn);
  e.atual = proxima;
  agendar(e);
  avisar(e);
  return proxima;
}

function descarregarEntrada(e) {
  clearTimeout(e.timer);
  e.timer = null;
  if (!e.pendentes.length) return true;
  // Alguém gravou depois da base da fila e o aviso ainda não chegou: a fila vai por cima da versão nova, e não da velha.
  adotar(e, lerCru(e.chave));
  const valor = e.aparar ? e.aparar(e.atual) : e.atual;
  // Cota estourada ou armazenamento bloqueado: a Ficha continua na memória e a fila fica para a próxima tentativa.
  if (!salvarSessao(e.id, valor)) return false;
  e.cru = lerCru(e.chave);
  e.base = valor;
  e.pendentes = [];
  return true;
}

/** Grava agora o que está na fila (sair da Ficha, ir para o criador, fechar a aba). Sem fila, não grava nada. */
export function descarregar(id) {
  const e = entradas.get(chaveDaSessao(id));
  return e ? descarregarEntrada(e) : true;
}

/**
 * Substitui a sessão inteira e grava na hora. Recusa (devolve `false` e adota a versão de lá) quando a chave foi gravada por outro depois da
 * última versão que esta loja conhece. Mudança que precisa somar com a de outra aba vai por `atualizar`.
 */
export function gravar(id, sessao) {
  const e = entradaDe(id);
  clearTimeout(e.timer);
  e.timer = null;
  const agora = lerCru(e.chave);
  if (agora !== e.cru) {
    adotar(e, agora);
    if (e.pendentes.length) agendar(e);
    return false;
  }
  if (!salvarSessao(e.id, sessao)) {
    if (e.pendentes.length) agendar(e);
    return false;
  }
  e.cru = lerCru(e.chave);
  e.base = sessao;
  e.pendentes = [];
  if (e.atual !== sessao) {
    e.atual = sessao;
    avisar(e);
  }
  return true;
}

/**
 * A porta da Sala (etapa 7b): uma versão que chegou da rede vira a base, a fila local é reaplicada em cima e a chave é espelhada no
 * aparelho (outras abas e a nuvem pessoal ficam sabendo). A fila continua agendada e grava por cima da versão remota, nunca no lugar dela.
 */
export function aplicarRemoto(id, sessao) {
  const e = entradaDe(id);
  const base = normalizaSessao(sessao, e.derived);
  if (salvarSessao(e.id, base)) e.cru = lerCru(e.chave);
  e.base = base;
  e.atual = reaplicar(base, e.pendentes);
  avisar(e);
  return e.atual;
}

/* ---------- a janela: outras abas e a saída da página ---------- */

function aoMudarArmazenamento(ev) {
  if (ev?.storageArea && typeof localStorage !== "undefined" && ev.storageArea !== localStorage) return;
  // `clear()` noutra aba chega sem chave: tudo pode ter mudado.
  if (ev?.key == null) {
    for (const e of entradas.values()) adotar(e, lerCru(e.chave));
    return;
  }
  const e = entradas.get(ev.key);
  if (e) adotar(e, ev.newValue ?? null);
}

function descarregarTudo() {
  for (const e of entradas.values()) descarregarEntrada(e);
}

let ouvintesInstalados = false;
function instalarOuvintesDaJanela() {
  if (ouvintesInstalados || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  ouvintesInstalados = true;
  window.addEventListener("storage", aoMudarArmazenamento);
  // Fechar a aba ou trocar de app no celular antes dos 600 ms não perde a última edição.
  window.addEventListener("pagehide", descarregarTudo);
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") descarregarTudo();
    });
  }
}

/* ---------- o gancho do React ---------- */

const semOuvir = () => () => {};

/**
 * A sessão viva para um componente. `derivado` (objeto ou função, de preferência função para não derivar à toa) só é lido na primeira vez
 * que a chave entra na loja. `ligado = false` não lê nem ouve nada e devolve `null` (a G2 embutida, que recebe a sessão de quem a monta).
 */
export function useSessaoDaLoja(id, derivado = null, ligado = true) {
  const assinar = useCallback((fn) => ouvir(id, fn), [id]);
  return useSyncExternalStore(ligado ? assinar : semOuvir, () => (ligado ? ler(id, derivado) : null));
}

/* Só para os asserts: esvazia a loja entre um caso e outro. */
export function __reiniciarLoja() {
  for (const e of entradas.values()) clearTimeout(e.timer);
  entradas.clear();
}

/* Só para os asserts: o ouvinte do evento `storage`, para simular outra aba sem janela de verdade. */
export const __aoMudarArmazenamento = aoMudarArmazenamento;
