/* Sincronização do localStorage com o Supabase.

   O NAVEGADOR CONTINUA SENDO A CÓPIA DE TRABALHO. Construir e usar a ficha nunca
   espera a rede: o app lê e grava o localStorage como sempre, e este módulo
   copia as mudanças para a nuvem em segundo plano, alguns segundos depois da
   última gravação. Por isso nenhum componente sabe que a nuvem existe.

   Três travas contra perda de dado:
   1. Nada sobe antes da primeira leitura da nuvem nesta sessão. O app grava ao
      montar (migrações silenciosas, rascunho), e subir isso antes de ler
      sobrescreveria dado mais novo de outro aparelho.
   2. A leitura entra no localStorage ANTES de o React montar (main.jsx espera
      até 2,5 s). Se a rede atrasar, a leitura tardia grava e recarrega a página,
      em vez de escrever por baixo de hooks vivos que regravariam o antigo.
   3. Ficha vai uma linha por ficha (tabela `fichas`), com apagamento marcado.
      Um bloco por chave ressuscitaria ficha apagada e subiria o inventário
      inteiro a cada edição. As demais chaves vão inteiras (tabela `chaves`).

   O retrato do que já está na nuvem (`nuvem_estado_v1`) guarda só ids e hashes,
   alguns bytes por ficha. Ele fica fora da sincronização (não começa com fm_). */

import {
  nuvemAtiva, SUPABASE_URL, SUPABASE_ANON_KEY,
  chaveDaPessoa, ehChaveDeFichas, temSessaoOuRetorno,
} from "./nuvem-config";

const CHAVE_ESTADO = "nuvem_estado_v1";
const ESPERA_ENVIO_MS = 3000;
const LOTE_FICHAS = 50;
const LIMITE_LINHA = 1_900_000; // abaixo dos checks de tamanho do supabase/esquema.sql
// Recusa do próprio dado (check, tipo, tamanho), e não de rede ou de sessão.
const ehRecusaDeDado = (e) => /^(22|23)/.test(String(e?.code ?? "")) || e?.status === 413;

// ---------------------------------------------------------------- estado visível
let estado = { fase: "desligada", usuario: null };
const ouvintes = new Set();
function definir(parcial) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((f) => f());
}
export const lerEstadoNuvem = () => estado;
export function ouvirNuvem(f) { ouvintes.add(f); return () => ouvintes.delete(f); }

// ---------------------------------------------------------------- cliente
let clientePromessa = null;
export function cliente() {
  if (!nuvemAtiva) return Promise.resolve(null);
  clientePromessa ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    }));
  return clientePromessa;
}

// ---------------------------------------------------------------- utilidades
function hash(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + ":" + texto.length.toString(36);
}
const parse = (texto) => { try { return JSON.parse(texto); } catch { return undefined; } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const setOriginal = typeof Storage !== "undefined" ? Storage.prototype.setItem : null;
const removeOriginal = typeof Storage !== "undefined" ? Storage.prototype.removeItem : null;
function gravarCru(chave, valor) {
  try {
    if (valor == null) removeOriginal.call(localStorage, chave);
    else setOriginal.call(localStorage, chave, valor);
  } catch { /* cota cheia: o próximo envio tenta de novo */ }
}

function lerLocal() {
  const tudo = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (chaveDaPessoa(k)) tudo[k] = localStorage.getItem(k);
    }
  } catch { /* armazenamento bloqueado */ }
  return tudo;
}

function lerRetrato() {
  const r = parse(localStorage.getItem(CHAVE_ESTADO) ?? "");
  return r && typeof r === "object" ? r : null;
}
function gravarRetrato(r) {
  try { setOriginal.call(localStorage, CHAVE_ESTADO, JSON.stringify(r)); } catch { /* ignora */ }
}

// ---------------------------------------------------------------- mesclagem
/* Junta duas listas de objetos com `id`. `preferirRemoto(l, r)` decide o
   conflito. A ordem é a local, e o que só existe na nuvem entra no fim. */
function unirPorId(local, remoto, preferirRemoto, idsQueSairamAqui) {
  const porId = new Map(remoto.map((r) => [r.id, r]));
  const saida = [];
  for (const l of local) {
    const r = porId.get(l?.id);
    if (r) { saida.push(preferirRemoto(l, r) ? r : l); porId.delete(l.id); } else saida.push(l);
  }
  for (const [id, r] of porId) if (!idsQueSairamAqui?.has(id)) saida.push(r);
  return saida;
}
// Lista vazia também conta: "[]" gravado por uma visita não pode jogar fora a lista de lá.
const listaDeIds = (v) => Array.isArray(v) && v.every((x) => x && typeof x === "object" && "id" in x);

/* Devolve o que gravar no localStorage e o retrato do que a nuvem tem agora.

   Com `retratoAntigo` do mesmo usuário a leitura é INCREMENTAL: as linhas são só
   as mudadas desde o último cursor, e o que não veio é o que o retrato já diz.
   Sem ele (primeiro login do aparelho) as linhas são a nuvem inteira. */
function mesclar(local, linhasFichas, linhasChaves, retratoAntigo) {
  const gravar = {};
  const retrato = retratoAntigo
    ? { fichas: structuredClone(retratoAntigo.fichas ?? {}), chaves: { ...(retratoAntigo.chaves ?? {}) } }
    : { fichas: {}, chaves: {} };

  // Fichas, uma linha por ficha.
  const remotoPorChave = {};
  for (const linha of linhasFichas) {
    (remotoPorChave[linha.chave] ??= []).push(linha);
    const doRetrato = (retrato.fichas[linha.chave] ??= {});
    if (linha.apagado) delete doRetrato[linha.id];
    else doRetrato[linha.id] = hash(JSON.stringify(linha.dados));
  }
  const chavesDeFichas = new Set([...Object.keys(remotoPorChave), ...Object.keys(local).filter(ehChaveDeFichas)]);
  for (const chave of chavesDeFichas) {
    const linhas = remotoPorChave[chave] ?? [];
    const lista = parse(local[chave] ?? "[]");
    const atual = Array.isArray(lista) ? lista : [];
    const apagadas = new Map(linhas.filter((l) => l.apagado).map((l) => [l.id, l.atualizado_em]));
    // Apagada na nuvem: sai daqui, salvo se foi editada aqui depois do apagamento.
    const mantidas = atual.filter((f) => {
      const quando = apagadas.get(f?.id);
      return !quando || String(f.updatedAt ?? "") > String(quando);
    });
    const vivas = linhas.filter((l) => !l.apagado).map((l) => l.dados);
    const antigas = retratoAntigo?.fichas?.[chave] ?? {};
    const sairamAqui = new Set(Object.keys(antigas).filter((id) => !atual.some((f) => f?.id === id)));
    const unida = unirPorId(mantidas, vivas,
      (l, r) => String(r.updatedAt ?? "") > String(l.updatedAt ?? ""), sairamAqui);
    const texto = JSON.stringify(unida);
    if (texto !== (local[chave] ?? "[]")) gravar[chave] = texto;
  }

  // Demais chaves, inteiras.
  const remotoChaves = Object.fromEntries(linhasChaves.map((l) => [l.chave, l.valor]));
  for (const [chave, valor] of Object.entries(remotoChaves)) retrato.chaves[chave] = hash(valor);
  const todas = new Set([...Object.keys(remotoChaves), ...Object.keys(local).filter((k) => !ehChaveDeFichas(k))]);
  for (const chave of todas) {
    const r = remotoChaves[chave];
    const l = local[chave];
    const antes = retratoAntigo?.chaves?.[chave];
    if (r == null) continue; // só aqui: o envio sobe
    if (l == null) { if (!antes) gravar[chave] = r; continue; } // apagada aqui: o envio apaga lá
    if (l === r) continue;
    const mexidaAqui = antes ? hash(l) !== antes : true;
    if (!mexidaAqui) { gravar[chave] = r; continue; }
    const lv = parse(l), rv = parse(r);
    if (retratoAntigo) continue; // mexida aqui depois do último envio: a local fica e sobe
    // Primeiro login deste aparelho: lista com id se une, o resto a nuvem manda.
    gravar[chave] = listaDeIds(lv) && listaDeIds(rv) ? JSON.stringify(unirPorId(lv, rv, () => true)) : r;
  }
  return { gravar, retrato };
}

// ---------------------------------------------------------------- leitura
async function lerTabela(sb, tabela, colunas, desde) {
  const linhas = [];
  const passo = 1000;
  for (let de = 0; ; de += passo) {
    let q = sb.from(tabela).select(colunas);
    if (desde) q = q.gt("atualizado_em", desde);
    const { data, error } = await q.order("atualizado_em").range(de, de + passo - 1);
    if (error) throw error;
    linhas.push(...data);
    if (data.length < passo) return linhas;
  }
}

// ---------------------------------------------------------------- envio
let pronta = false;
let usuarioId = null;
let retrato = null;
let timer = null;
let enviando = false;
let pendente = false;

function agendar() {
  if (!pronta) return;
  clearTimeout(timer);
  timer = setTimeout(enviar, ESPERA_ENVIO_MS);
}

export async function enviar() {
  clearTimeout(timer);
  if (!pronta || !usuarioId) return;
  if (enviando) { pendente = true; return; }
  enviando = true;
  definir({ fase: "enviando" });
  try {
    const sb = await cliente();
    const local = lerLocal();
    const agora = new Date().toISOString();
    const novo = { usuario: usuarioId, fichas: structuredClone(retrato.fichas), chaves: { ...retrato.chaves } };
    const subirFichas = [];
    const subirChaves = [];
    const apagarChaves = [];

    const chaves = new Set([...Object.keys(local), ...Object.keys(retrato.fichas), ...Object.keys(retrato.chaves)]);
    for (const chave of chaves) {
      if (ehChaveDeFichas(chave)) {
        const lista = parse(local[chave] ?? "[]");
        const atual = Array.isArray(lista) ? lista : [];
        const antes = retrato.fichas[chave] ?? {};
        const depois = {};
        for (const f of atual) {
          if (!f || typeof f !== "object" || !f.id) continue;
          const h = hash(JSON.stringify(f));
          depois[f.id] = h;
          if (antes[f.id] !== h) subirFichas.push({ user_id: usuarioId, chave, id: String(f.id), dados: f, apagado: false, atualizado_em: agora });
        }
        for (const id of Object.keys(antes)) {
          if (!(id in depois)) subirFichas.push({ user_id: usuarioId, chave, id, dados: null, apagado: true, atualizado_em: agora });
        }
        novo.fichas[chave] = depois;
      } else {
        const v = local[chave];
        if (v == null) {
          if (retrato.chaves[chave]) { apagarChaves.push(chave); delete novo.chaves[chave]; }
        } else {
          const h = hash(v);
          if (retrato.chaves[chave] !== h) { subirChaves.push({ user_id: usuarioId, chave, valor: v, atualizado_em: agora }); novo.chaves[chave] = h; }
        }
      }
    }

    /* Uma linha recusada (grande demais, ou outra recusa do banco) não pode
       travar a fila inteira. O lote cai para linha a linha, a recusada fica
       anotada no retrato como enviada (só tenta de novo quando mudar) e o ícone
       da Conta fica âmbar. Falha de rede ou de sessão sobe e tenta em 30 s. */
    let recusadas = 0;
    const recusar = (linha) => { recusadas++; console.warn("[nuvem] linha recusada", linha.chave, linha.id ?? ""); };
    const grandeDemais = (linha) => (linha.dados ? JSON.stringify(linha.dados).length : (linha.valor ?? "").length) > LIMITE_LINHA;
    const subir = async (tabela, linhas) => {
      const cabem = linhas.filter((l) => { if (grandeDemais(l)) { recusar(l); return false; } return true; });
      if (!cabem.length) return;
      const { error } = await sb.from(tabela).upsert(cabem);
      if (!error) return;
      if (!ehRecusaDeDado(error)) throw error;
      if (cabem.length === 1) { recusar(cabem[0]); return; }
      for (const linha of cabem) await subir(tabela, [linha]);
    };
    for (let i = 0; i < subirFichas.length; i += LOTE_FICHAS) await subir("fichas", subirFichas.slice(i, i + LOTE_FICHAS));
    for (let i = 0; i < subirChaves.length; i += LOTE_FICHAS) await subir("chaves", subirChaves.slice(i, i + LOTE_FICHAS));
    if (apagarChaves.length) {
      const { error } = await sb.from("chaves").delete().eq("user_id", usuarioId).in("chave", apagarChaves);
      if (error) throw error;
    }
    novo.cursor = retrato.cursor;
    retrato = novo;
    gravarRetrato(retrato);
    definir(recusadas
      ? { fase: "erro", erro: `${recusadas} itens recusados` }
      : { fase: "pronta", erro: null });
  } catch (e) {
    definir({ fase: "erro", erro: String(e?.message ?? e) });
    clearTimeout(timer);
    timer = setTimeout(enviar, 30000);
  } finally {
    enviando = false;
    if (pendente) { pendente = false; agendar(); }
  }
}

// ---------------------------------------------------------------- gancho
let ganchoInstalado = false;
function instalarGancho() {
  if (ganchoInstalado || !setOriginal) return;
  ganchoInstalado = true;
  Storage.prototype.setItem = function (chave, valor) {
    setOriginal.call(this, chave, valor);
    if (this === localStorage && chaveDaPessoa(chave)) agendar();
  };
  Storage.prototype.removeItem = function (chave) {
    removeOriginal.call(this, chave);
    if (this === localStorage && chaveDaPessoa(chave)) agendar();
  };
  // Saindo da aba: tenta mandar o que estiver na fila.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && timer) enviar();
  });
}

// ---------------------------------------------------------------- conexão
function descreverUsuario(user) {
  const m = user?.user_metadata ?? {};
  return {
    id: user.id,
    nome: m.full_name || m.name || m.user_name || user.email || "Conta",
    avatar: m.avatar_url || m.picture || null,
    provedor: user.app_metadata?.provider ?? null,
  };
}

function limparRetornoDaUrl() {
  const url = new URL(location.href);
  if (!url.searchParams.has("code") && !/access_token=/.test(url.hash)) return;
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  if (/access_token=/.test(url.hash)) url.hash = "";
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
}

/* Lê a nuvem, mescla com o local e libera o envio. `tardia` é a leitura que
   chegou depois de o app montar: grava e recarrega, nunca escreve por baixo. */
async function conectar(ehTardia) {
  definir({ fase: "sincronizando" });
  const sb = await cliente();
  const { data } = await sb.auth.getSession();
  limparRetornoDaUrl();
  const user = data?.session?.user;
  if (!user) { definir({ fase: "desligada", usuario: null }); return; }
  usuarioId = user.id;
  definir({ usuario: descreverUsuario(user) });

  /* Só o primeiro login do aparelho lê tudo. Depois, só o que mudou desde o
     cursor, que é hora do SERVIDOR (gatilho do esquema), com 10 s de folga para
     transação que confirmou atrasada. Ler de novo a mesma linha é inofensivo. */
  const antigo = lerRetrato();
  const retratoAntigo = antigo?.usuario === user.id && antigo.cursor ? antigo : null;
  const desde = retratoAntigo ? new Date(Date.parse(retratoAntigo.cursor) - 10000).toISOString() : null;
  const [linhasFichas, linhasChaves] = await Promise.all([
    lerTabela(sb, "fichas", "chave,id,dados,apagado,atualizado_em", desde),
    lerTabela(sb, "chaves", "chave,valor,atualizado_em", desde),
  ]);
  const { gravar, retrato: daNuvem } = mesclar(lerLocal(), linhasFichas, linhasChaves, retratoAntigo);
  const mudou = Object.keys(gravar).length > 0;
  for (const [chave, valor] of Object.entries(gravar)) gravarCru(chave, valor);

  let cursor = retratoAntigo?.cursor ?? null;
  for (const l of [...linhasFichas, ...linhasChaves]) if (!cursor || l.atualizado_em > cursor) cursor = l.atualizado_em;
  retrato = { usuario: user.id, cursor: cursor ?? new Date(0).toISOString(), ...daNuvem };
  gravarRetrato(retrato);
  // Leitura tardia: recarrega JÁ, antes de qualquer espera de rede, para os hooks
  // montados não regravarem o antigo por cima. O próximo carregamento envia.
  if (ehTardia() && mudou) { location.reload(); return; }
  pronta = true;
  definir({ fase: "pronta" });
  await enviar();

  sb.auth.onAuthStateChange((evento) => {
    if (evento === "SIGNED_OUT") desligarLocal();
  });
}

function desligarLocal() {
  pronta = false;
  usuarioId = null;
  retrato = null;
  clearTimeout(timer);
  try { removeOriginal.call(localStorage, CHAVE_ESTADO); } catch { /* ignora */ }
  definir({ fase: "desligada", usuario: null });
}

/* Chamado pelo main.jsx antes de montar o React. Quem nunca entrou sai daqui na
   hora, sem baixar a biblioteca. */
export async function prepararNuvem({ esperaMs = 2500 } = {}) {
  if (!nuvemAtiva || typeof localStorage === "undefined") return;
  instalarGancho();
  if (!temSessaoOuRetorno()) return;
  let montou = false;
  const trabalho = conectar(() => montou).catch((e) => {
    definir({ fase: "erro", erro: String(e?.message ?? e) });
  });
  await Promise.race([trabalho, espera(esperaMs)]);
  montou = true;
}

export async function entrar(provedor) {
  const sb = await cliente();
  if (!sb) return;
  definir({ fase: "entrando" });
  const { error } = await sb.auth.signInWithOAuth({
    provider: provedor,
    options: { redirectTo: location.origin + location.pathname },
  });
  if (error) definir({ fase: "erro", erro: error.message });
}

export async function sair() {
  await enviar();
  const sb = await cliente();
  await sb?.auth.signOut();
  desligarLocal();
}

// Exportado só para os asserts.
export const _mesclar = mesclar;
export { unirPorId, listaDeIds, lerLocal, gravarCru };
