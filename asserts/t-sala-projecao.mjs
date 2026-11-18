/* Os cortes da Sala online (Encontro Unificado, etapa 7a, 2026-11-17).

   Esconder é papel do BANCO (supabase/salas.sql). O src/nuvem/sala-projecao.js
   é o espelho em JavaScript, e a regra mora nos dois lugares. Este assert prende
   os dois juntos de três jeitos:
   1. os casos de asserts/sala-projecao-casos.json (os mesmos que provam o SQL)
      contra o JavaScript;
   2. as constantes do JavaScript (faixas, tipos, eventos, limites, a visão de
      encontros/modelo.js) contra o texto do SQL;
   3. a forma do SQL: idempotente, RLS em toda tabela, search_path fixo em toda
      função, nenhum grant de escrita, senha_hash fora do grant, a tabela salas
      fora da publicação, nada de replica identity full, nada em fichas e chaves. */

import { readFileSync } from "node:fs";

const P = await import(new URL("../src/nuvem/sala-projecao.js", import.meta.url).href);
const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), "utf8");
const casos = JSON.parse(ler("./sala-projecao-casos.json"));
const sqlBruto = ler("../supabase/salas.sql");
const jsTexto = ler("../src/nuvem/sala-projecao.js");
const modeloTexto = ler("../src/systems/afty/encontros/modelo.js");

let ok = 0;
const bad = [];
const ordenar = (v) => (Array.isArray(v) ? v.map(ordenar)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, ordenar(v[k])])) : v);
const t = (nome, real, esp) => {
  if (JSON.stringify(ordenar(real)) === JSON.stringify(ordenar(esp))) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------------------------------------------------------------- 1. os casos */

for (const [pv, max, esp] of casos.faixas) t(`faixa ${pv}/${max}`, P.faixaDeVida(pv, max), esp);

for (const c of casos.saneados) t(`saneado: ${c.nome}`, P.resumoSaneado(c.entrada), c.esperado);

for (const c of casos.resumos) {
  const completo = c.completo == null ? null : P.resumoSaneado(c.completo);
  t(`resumo: ${c.nome}`, P.resumoPorVisao(completo, { tipo: c.tipo, visao: c.visao }), c.inteiro ? completo : c.esperado);
}

for (const c of casos.envolvidos) t(`envolvidos: ${JSON.stringify(c.dados)}`, P.envolvidosDe(c.especie, c.dados), c.esperado);

const porId = new Map(casos.combatentes.map((c) => [c.id, { ...c, completo: c.completo == null ? null : P.resumoSaneado(c.completo) }]));
const contexto = {
  combatente: (id) => porId.get(id) ?? null,
  publicaDe: (id) => casos.publicasConhecidas[id] ?? null,
};
const comAutor = (v) => JSON.parse(JSON.stringify(v).replaceAll('"$autor"', JSON.stringify(casos.autor)));
for (const c of casos.publicas) {
  const registro = comAutor(c.registro);
  t(`publica: ${c.nome}`, P.versaoPublica(registro, contexto), comAutor(c.esperado));
}

const naSala = casos.combatentes.map((c) => ({ combatente: c.id, tipo: c.tipo, visao: c.visao }));
for (const c of casos.ordens) t(`ordem: ${c.nome}`, P.ordemVistaPeloJogador(c.ordem, c.vez, naSala), c.esperado);

/* ---------------------------------------------------------------- casos só do JavaScript */

{
  const pedido = comAutor(casos.publicas.find((c) => c.registro.especie === "pedido").registro);
  const op = { ...pedido, especie: "operacao" };
  t("a resposta leva o id público do pedido", P.versaoPublica(op, { ...contexto, responde: "u-1" }).responde, "u-1");
  t("sem resposta, sem o campo", "responde" in P.versaoPublica(op, contexto), false);
  const longo = "a".repeat(1005);
  t("chat corta em 1000", P.versaoPublica({ especie: "chat", dados: { texto: longo } }, contexto).texto.length, 1000);
  t("chat que não é texto vira vazio", P.versaoPublica({ especie: "chat", dados: { texto: 5 } }, contexto).texto, "");
  t("sem contexto, alvo ausente conta como Oculto",
    P.versaoPublica({ especie: "operacao", dados: { alvo: "x", tipo: "dano", delta: [] } }), null);
  t("inteiro -0 vira 0", Object.is(P.inteiroDoJson(-0.4), 0), true);
  t("inteiro de NaN", P.inteiroDoJson(Number.NaN), 0);
  t("nomes de um objeto solto", P.nomesDoJson({ nome: "Cego" }, 40, 80), ["Cego"]);
  t("rótulo de cada faixa", Object.keys(P.FAIXA_ROTULO), Object.values(P.FAIXA));
  t("fração de cada faixa", Object.keys(P.FAIXA_FRACAO), Object.values(P.FAIXA));
  t("rótulos sem ponto e vírgula", Object.values(P.FAIXA_ROTULO).some((r) => r.includes(";")), false);
  t("marcador sem visão não é visível", P.ordemVistaPeloJogador(["m"], "m", [{ combatente: "m", tipo: "marcador" }]), []);
}

/* ---------------------------------------------------------------- 2. as constantes dos dois lados */

// O SQL sem comentários: nenhuma string dele contém "--".
const sql = sqlBruto.replace(/--[^\n]*/g, "");
const lista = (texto) => [...texto.matchAll(/'([^']*)'/g)].map((m) => m[1]);
const trecho = (re, nome) => {
  const m = sql.match(re);
  if (!m) bad.push(`trecho do SQL ausente: ${nome}`);
  return m?.[1] ?? "";
};

const visaoDoModelo = modeloTexto.match(/export const VISAO = \{([^}]*)\}/)?.[1] ?? "";
t("VISAO igual à de encontros/modelo.js", [...visaoDoModelo.matchAll(/"([a-z]+)"/g)].map((m) => m[1]), Object.values(P.VISAO));
t("visões do check de sala_resumos", lista(trecho(/visao in \(([^)]*)\)\)\)/, "check da visão")), Object.values(P.VISAO));
const papelDoModelo = modeloTexto.match(/export const PAPEL = \{([^}]*)\}/)?.[1] ?? "";
t("papéis de membro saem de PAPEL do modelo", lista(trecho(/sala_membros_papel check \(papel in \(([^)]*)\)/, "papéis")),
  [...papelDoModelo.matchAll(/"([a-z]+)"/g)].map((m) => m[1]).filter((p) => p !== "sistema"));

const faixaSql = trecho(/function sala_interno\.faixa_de_vida[\s\S]*?\$\$([\s\S]*?)\$\$/, "faixa_de_vida");
t("faixas do SQL na mesma ordem", [...faixaSql.matchAll(/then '([a-z_]+)'|else '([a-z_]+)'/g)].map((m) => m[1] ?? m[2]),
  [P.FAIXA.CAIDA, P.FAIXA.ATE_UM_QUARTO, P.FAIXA.ATE_A_METADE, P.FAIXA.ACIMA_DA_METADE, P.FAIXA.INTEIRA]);
t("cortes da faixa em inteiro", ["p_pv <= 0", "p_pv * 4 <= p_max", "p_pv * 2 <= p_max", "p_pv < p_max"].every((s) => faixaSql.includes(s)), true);
t("a faixa do JS tem os mesmos cortes", ["pv <= 0", "pv * 4 <= max", "pv * 2 <= max", "pv < max"].every((s) => jsTexto.includes(s)), true);

t("especies", lista(trecho(/sala_operacoes_especie check \(especie in \(([^)]*)\)/, "espécies")), P.ESPECIES);
t("tipos de operação aceitos", lista(trecho(/coalesce\(v_dados ->> 'tipo', ''\) not in \(([^)]*)\)/, "tipos")), P.TIPOS_DE_OPERACAO);
t("tipo desfeito sem o próprio desfazer",
  lista(trecho(/v_entrada ->> 'tipoDesfeito' in \(([^)]*)\)/, "tipo desfeito")), P.TIPOS_DE_OPERACAO.filter((x) => x !== "desfazer"));
t("eventos do sistema", lista(trecho(/coalesce\(v_dados ->> 'evento', ''\) not in \(([^)]*)\)/, "eventos")), P.EVENTOS_DO_SISTEMA);
t("valor em toda visão", lista(trecho(/v_tipo in \(('dano', [^)]*)\)\s+or \(v_nivel/, "valor em toda visão")), P.VALOR_EM_TODA_VISAO);
t("valor só em Aberta", lista(trecho(/v_nivel >= 3 and v_tipo in \(([^)]*)\)\)\) then/, "valor só em Aberta")), P.VALOR_SO_ABERTA);
t("tipos de rolagem", lista(trecho(/v_r ->> 'tipo' in \(([^)]*)\)/, "tipos de rolagem")), P.TIPOS_DE_ROLAGEM);
t("modos da Alma", lista(trecho(/v_entrada ->> 'modo' in \(('dano'[^)]*)\)/, "modos da Alma")), P.MODOS_DA_ALMA);
t("modos da condição", lista(trecho(/v_entrada ->> 'modo' in \(('adicionar'[^)]*)\)/, "modos da condição")), P.MODOS_DA_CONDICAO);
t("caminhos da Vida", [...trecho(/d -> 'caminho' in \(([^)]*)\)/, "caminhos da Vida").matchAll(/\["([a-zA-Z]+)"\]/g)].map((m) => m[1]),
  P.CAMINHOS_DA_VIDA);
// Cada trecho é montado com a constante do JavaScript: mudou um lado só, o SQL não casa mais.
const L = P.LIMITE;
for (const trechoDoLimite of [`'texto', ${L.chat})`, `'rotulo', ${L.rotulo})`, `'formula', ${L.formula})`, `'d20', ${L.d20})`,
  `'dados', ${L.dados})`, `'evento', ${L.evento})`, `'condicoes', ${L.itens}, ${L.nome})`, `'efeitos', ${L.itens}, ${L.nome})`,
  `end, ${L.itens}, ${L.nome}))`]) {
  t(`limite ${trechoDoLimite}`, sql.includes(trechoDoLimite), true);
}
t("teto do inteiro", sql.includes(`least(${P.LIMITE.inteiro}::numeric`), true);

/* ---------------------------------------------------------------- 3. a forma do SQL */

t("tudo numa transação", /^\s*begin;/m.test(sql) && /commit;\s*$/.test(sql), true);
const tabelas = [...sql.matchAll(/create table if not exists ([a-z_]+\.[a-z_]+)/g)].map((m) => m[1]);
t("toda tabela é if not exists", (sql.match(/create table /g) ?? []).length, tabelas.length);
t("as nove tabelas do plano mais as quatro internas", tabelas.length, 13);
t("RLS em toda tabela", tabelas.filter((x) => !sql.includes(`alter table ${x} enable row level security;`)), []);

const politicas = [...sql.matchAll(/create policy ("[^"]+") on ([a-z_.]+)/g)];
t("há políticas", politicas.length >= 11, true);
t("toda política é derrubada antes", politicas.filter(([, n, tab]) => !sql.includes(`drop policy if exists ${n} on ${tab}`)).map((m) => m[1]), []);
t("nenhuma política de escrita nas tabelas", /create policy "[^"]+" on public\.[a-z_]+ for (insert|update|delete|all)/.test(sql), false);
const gatilhos = [...sql.matchAll(/create trigger ([a-z_]+) /g)].map((m) => m[1]);
t("todo gatilho é derrubado antes", gatilhos.filter((g) => !sql.includes(`drop trigger if exists ${g} `)), []);

const funcoes = [...sql.matchAll(/create or replace function ([a-z_]+\.[a-z_]+)\(([\s\S]*?)\$\$/g)];
t("toda função tem search_path vazio", funcoes.filter((m) => !m[2].includes("set search_path = ''")).map((m) => m[1]), []);
t("nenhuma função sem create or replace", (sql.match(/create function /g) ?? []).length, 0);
const rpcs = funcoes.map((m) => m[1]).filter((n) => n.startsWith("public.")).map((n) => n.slice(7)).sort();
const naLista = lista(trecho(/n\.nspname = 'public'\s+and p\.proname in \(([\s\S]*?)\)\s+loop/, "lista de RPCs")).sort();
t("toda RPC entra no revoke do anon e no grant do authenticated", naLista, rpcs);
t("as RPCs pedidas existem", ["ver_sala", "criar_sala", "entrar_na_sala", "trocar_senha", "trancar", "remover_membro",
  "promover_mestre", "fechar_sala", "gravar_operacao", "responder_pedido"].filter((r) => !rpcs.includes(r)), []);
t("toda RPC é security definer", funcoes.filter((m) => m[1].startsWith("public.") && !m[2].includes("security definer")).map((m) => m[1]), []);
t("revoke em todas as internas", sql.includes("revoke all on all functions in schema sala_interno from public, anon, authenticated;"), true);

t("nenhum grant de escrita", /grant (all|insert|update|delete|truncate)/i.test(sql), false);
const colunasSalas = [...trecho(/create table if not exists public\.salas \(([\s\S]*?)constraint/, "colunas de salas")
  .matchAll(/^\s+([a-z_]+)\s+(?:uuid|text|boolean|timestamptz)/gm)].map((m) => m[1]);
const grantSalas = trecho(/grant select \(([^)]*)\)\s+on public\.salas to authenticated/, "grant de salas").split(",").map((s) => s.trim());
t("salas: grant de todas as colunas menos senha_hash", grantSalas, colunasSalas.filter((c) => c !== "senha_hash"));
t("salas: o revoke vem antes do grant por coluna", sql.indexOf("revoke all on table public.salas") < sql.indexOf("grant select (id, codigo"), true);
const publicadas = lista(trecho(/foreach v_t in array array\[([\s\S]*?)\] loop/, "publicação"));
t("salas fora da publicação", publicadas.includes("salas"), false);
t("as outras tabelas da Sala na publicação", tabelas.filter((x) => x.startsWith("public.") && x !== "public.salas").map((x) => x.slice(7)), publicadas);
t("publicação sem DELETE", sql.includes("alter publication supabase_realtime set (publish = 'insert, update')"), true);
t("nada de replica identity full", /replica identity full/i.test(sql), false);
t("não toca em fichas nem em chaves", /public\.(fichas|chaves)\b/.test(sql), false);
t("pgcrypto no esquema extensions", sql.includes("create extension if not exists pgcrypto with schema extensions;"), true);
t("bcrypt qualificado", sql.includes("extensions.crypt(") && sql.includes("extensions.gen_salt('bf', 8)"), true);
t("crypt sem esquema não existe", /(?<!extensions\.)\bcrypt\(/.test(sql), false);
t("tetos do autor", sql.includes("values (true, 8, 2, 6, 14, 60, 10000, 10)"), true);
t("tetos preservados ao rodar de novo", /values \(true, 8, 2, 6, 14, 60, 10000, 10\)\s+on conflict \(id\) do nothing;/.test(sql), true);
t("código sem ambíguos", sql.includes("'ABCDEFGHJKMNPQRSTUVWXYZ23456789'") && sql.includes("^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$"), true);
t("código sem I, L, O, 0 e 1", /[ILO01]/.test("ABCDEFGHJKMNPQRSTUVWXYZ23456789"), false);
t("pg_cron protegido", sql.includes("create extension if not exists pg_cron with schema pg_catalog;")
  && /exception when others then\s+raise notice 'pg_cron/.test(sql), true);
t("a versão sobe por gatilho nas quatro mudanças sem evento", ["sala_resumos_visao", "sala_resumos_saiu",
  "sala_compartilhamentos_mudou", "sala_membros_mudou"].every((g) => gatilhos.includes(g)), true);
t("a cascata não sobe a versão", sql.includes("if pg_trigger_depth() > 1 then return null; end if;"), true);
// O dono nulo (combatente do Mestre) num "if not (x = y)" vira NULL e deixa passar: só "is not distinct from".
t("o dono do alvo lê o pedido do colega", sql.includes("(especie = 'pedido' and sala_interno.dono_de(sala_id, dados ->> 'alvo') is not distinct from (select auth.uid()))"), true);
// Oculto e id que não existe dão o mesmo erro: as RPCs que o jogador chama com um id buscam pelo resumo visível.
for (const rpc of ["remover_combatente", "publicar_resumo", "gravar_ficha", "gravar_operacao"]) {
  const corpo = sql.match(new RegExp(`function public\\.${rpc}\\([\\s\\S]*?end \\$\\$;`))?.[0] ?? "";
  t(`${rpc} busca pelo resumo visível`, corpo.includes("sala_interno.resumo_visivel(") && !corpo.includes("sala_interno.resumo_de("), true);
}
t("conferência de dono sem =",[...sql.matchAll(/(v_r\.dono|dono_de\([^)]*\))\s*(=|<>)\s*/g)].map((m) => m[0]), []);

/* ---------------------------------------------------------------- texto e folha */

for (const [nome, texto] of [["salas.sql", sqlBruto], ["sala-projecao.js", jsTexto], ["casos", ler("./sala-projecao-casos.json")]]) {
  t(`${nome} sem travessão`, texto.includes("\u2014"), false);
}
t("sala-projecao.js é FOLHA", /^\s*import\s/m.test(jsTexto), false);
t("mensagens de erro sem ponto e vírgula", [...sql.matchAll(/raise exception '([^']*)'/g)].some((m) => m[1].includes(";")), false);

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
