/* Configuração da nuvem (Supabase) e da mudança de endereço. FOLHA, zero imports.

   Tudo aqui lê variáveis de ambiente do Vite. Sem `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` a nuvem fica INERTE: nenhum botão aparece, nenhuma
   biblioteca é baixada e o site se comporta como sempre (só localStorage).
   Passo a passo da configuração em docs/nuvem-supabase.md. */

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

export const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "";
export const nuvemAtiva = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// "https://abcd.supabase.co" vira "abcd", que é o nome da chave de sessão.
const REF = (() => {
  try { return new URL(SUPABASE_URL).hostname.split(".")[0]; } catch { return ""; }
})();
export const CHAVE_SESSAO_SUPABASE = REF ? `sb-${REF}-auth-token` : "";

/* Existe sessão gravada neste aparelho, ou a volta de um login na URL? Lido sem
   carregar a biblioteca, para quem nunca entrou não pagar o download. */
export function temSessaoOuRetorno() {
  if (!nuvemAtiva) return false;
  try {
    if (CHAVE_SESSAO_SUPABASE && localStorage.getItem(CHAVE_SESSAO_SUPABASE)) return true;
  } catch { /* armazenamento bloqueado */ }
  if (typeof location === "undefined") return false;
  const q = new URLSearchParams(location.search);
  return q.has("code") || /access_token=/.test(location.hash);
}

/* Mudança de endereço. O aviso só aparece no host antigo EXATO (prévias da
   Vercel ficam de fora) e só quando o endereço novo foi configurado. */
export const HOST_ANTIGO = "grimorio-fm.vercel.app";
export const ORIGEM_ANTIGA = `https://${HOST_ANTIGO}`;
export const ORIGEM_NOVA = (() => {
  try { return env.VITE_DOMINIO_NOVO ? new URL(env.VITE_DOMINIO_NOVO).origin : ""; } catch { return ""; }
})();
export const ehHostAntigo = () =>
  typeof location !== "undefined" && location.hostname === HOST_ANTIGO && Boolean(ORIGEM_NOVA);

/* Quais chaves do localStorage são da pessoa (viajam para a nuvem e na mudança
   de endereço). As de aparelho ficam: erro, medidor, vista do painel, sessão. */
const CHAVES_DO_APARELHO = new Set([
  "fm_last_error_v1", "fm_storage_limit_v1",
]);
export function chaveDaPessoa(chave) {
  if (!chave) return false;
  if (CHAVES_DO_APARELHO.has(chave)) return false;
  if (chave.startsWith("fm_dashboard_view")) return false;
  return chave.startsWith("fm_") || chave.startsWith("afty_");
}

// O inventário de fichas de cada rota vai uma linha por ficha, e não um bloco.
export const ehChaveDeFichas = (chave) =>
  /^fm_creatures(_[a-z]+)?_v1$/.test(chave) && !chave.startsWith("fm_creatures_meta");
