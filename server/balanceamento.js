import { createHash } from "node:crypto";
import { registerHooks } from "node:module";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

// O Vite resolve os imports sem extensão do motor no navegador. Fazer o
// mesmo somente durante a carga dos catálogos no Node.
const fonte = new URL("../src/systems/afty/balanceamento/resumo.js", import.meta.url).href.split("/systems/")[0] + "/";
const resolucao = registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (erro) {
      if (erro.code === "ERR_MODULE_NOT_FOUND" && context.parentURL?.startsWith(fonte)
          && specifier.startsWith(".") && !specifier.endsWith(".js")) {
        return next(specifier + ".js", context);
      }
      throw erro;
    }
  },
});
const { CATEGORIAS, MAX_NIVEL, PERIODOS, VERSAO_RESUMO, resumoValido } = await (async () => {
  try {
    return await import("../src/systems/afty/balanceamento/resumo.js");
  } finally {
    resolucao.deregister();
  }
})();

const UUID_ALEATORIO = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_BYTES = 24 * 1024;
const MINUTO = 60000;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const erro = (status) => new Response(null, { status, headers });

export function servicoSupabase(env = process.env) {
  if (env.BALANCEAMENTO_ATIVO !== "1" || !env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function lerJson(request) {
  if (Number(request.headers.get("Content-Length")) > MAX_BYTES || !request.body) return null;
  const leitor = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let total = 0;
  let texto = "";
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) return JSON.parse(texto + decoder.decode());
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await leitor.cancel();
        return null;
      }
      texto += decoder.decode(value, { stream: true });
    }
  } catch {
    return null;
  }
}

function contribuicaoValida(dados, agora) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados) || Object.keys(dados).length !== 4
      || dados.versao !== VERSAO_RESUMO || typeof dados.chave !== "string" || !UUID_ALEATORIO.test(dados.chave)
      || typeof dados.salvoEm !== "string" || dados.salvoEm.length !== 24) return false;
  const salvo = Date.parse(dados.salvoEm);
  return salvo >= agora - 24 * 60 * MINUTO && salvo <= agora + 5 * MINUTO
    && (dados.resumo === null || resumoValido(dados.resumo));
}

// O Firewall limita a origem de rede neste caminho antes de executar a função.
export async function receberContribuicao(request, supabase, agora = Date.now()) {
  if (!supabase) return erro(404);
  if (request.method !== "POST") return erro(405);
  if (request.headers.get("Origin") !== new URL(request.url).origin) return erro(403);
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") return erro(415);

  const dados = await lerJson(request);
  if (!contribuicaoValida(dados, agora)) return erro(400);
  const { error } = await supabase.rpc("balanceamento_gravar", {
    p_chave: createHash("sha256").update(dados.chave).digest("hex"),
    p_salvo_em: dados.salvoEm,
    p_resumo: dados.resumo,
  });
  if (error) {
    console.error("balanceamento_gravar", error.code);
    return erro(503);
  }
  return new Response(null, { status: 204, headers });
}

function lerFiltros(url) {
  const q = new URL(url).searchParams;
  const dias = Number(q.get("dias") ?? 30);
  const nivel = q.has("nivel") ? Number(q.get("nivel")) : null;
  const origem = q.get("origem");
  const especializacao = q.get("especializacao");
  const addons = q.get("addons");
  if (!PERIODOS.includes(dias)
      || (nivel !== null && (!Number.isInteger(nivel) || nivel < 1 || nivel > MAX_NIVEL))
      || (origem !== null && !Object.hasOwn(CATEGORIAS.origens, origem))
      || (especializacao !== null && !Object.hasOwn(CATEGORIAS.especializacoes, especializacao))
      || (addons !== null && !["com", "sem"].includes(addons))) return null;
  return {
    p_dias: dias, p_nivel: nivel, p_origem: origem, p_especializacao: especializacao,
    p_addons: addons === null ? null : addons === "com",
  };
}

export async function obterRelatorio(request, supabase, proprietario) {
  if (!supabase || !proprietario) return erro(404);
  if (request.method !== "GET") return erro(405);
  const token = /^Bearer (\S+)$/.exec(request.headers.get("Authorization") ?? "")?.[1];
  if (!token) return erro(401);
  const { data, error: erroSessao } = await supabase.auth.getUser(token);
  if (erroSessao?.status >= 500) return erro(503);
  if (erroSessao || !data?.user) return erro(401);
  if (data.user.id !== proprietario) return erro(403);

  const filtros = lerFiltros(request.url);
  if (!filtros) return erro(400);
  const { data: relatorio, error } = await supabase.rpc("balanceamento_relatorio", filtros);
  if (error) {
    console.error("balanceamento_relatorio", error.code);
    return erro(503);
  }
  return Response.json(relatorio, { headers });
}
