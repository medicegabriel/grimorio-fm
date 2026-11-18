/* Prova LOCAL do supabase/salas.sql num Postgres de verdade (PGlite), sem tocar no
   projeto do Supabase. Etapa 7a do Encontro Unificado, 2026-11-17.

   O PGlite NÃO é dependência do site. Para rodar, instale numa pasta fora do
   repositório e passe o caminho do `dist` dele:

     npm install --prefix <pasta> @electric-sql/pglite@0.5.15
     node supabase/prova-salas-pglite.mjs <pasta>/node_modules/@electric-sql/pglite/dist

   O que ele faz: imita o que o Supabase tem antes do SQL (os papéis anon,
   authenticated e service_role, auth.uid() e auth.jwt() pelo request.jwt.claims,
   auth.users, realtime.topic() e realtime.messages, a publicação
   supabase_realtime, e o PIOR caso de grant: tabela e função nova de public
   expostas sozinhas), roda o salas.sql DUAS vezes, passa por cada papel
   (Mestre, co-Mestre, jogador, espectador, quem não é membro, anon, conta
   anônima) e roda os casos de asserts/sala-projecao-casos.json nas funções do
   SQL, comparando com o JavaScript. O que o PGlite não tem (pg_cron, o tempo
   real em si) fica para o roteiro de docs/nuvem-supabase.md. */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dist = process.argv[2];
if (!dist) {
  console.error("Uso: node supabase/prova-salas-pglite.mjs <pasta dist do @electric-sql/pglite>");
  process.exit(2);
}
const { PGlite } = await import(pathToFileURL(join(dist, "index.js")).href);
const { pgcrypto } = await import(pathToFileURL(join(dist, "contrib", "pgcrypto.js")).href);
const P = await import(new URL("../src/nuvem/sala-projecao.js", import.meta.url).href);
const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), "utf8");
const SQL = ler("./salas.sql");
const casos = JSON.parse(ler("../asserts/sala-projecao-casos.json"));

let ok = 0;
const bad = [];
const ordenar = (v) => (Array.isArray(v) ? v.map(ordenar)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, ordenar(v[k])])) : v);
const igual = (a, b) => JSON.stringify(ordenar(a)) === JSON.stringify(ordenar(b));
const t = (nome, real, esp) => {
  if (igual(real, esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const db = new PGlite({ extensions: { pgcrypto } });
const avisos = [];
const comAvisos = { onNotice: (n) => avisos.push(n.message) };

/* ---------------------------------------------------------------- o Supabase de mentira */

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb not null default '{}', email text);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
  create schema realtime;
  create function realtime.topic() returns text language sql stable as
    $$ select nullif(current_setting('realtime.topic', true), '') $$;
  create table realtime.messages (id bigint generated always as identity primary key, topic text not null,
    extension text not null, payload jsonb);
  alter table realtime.messages enable row level security;
  grant usage on schema realtime to authenticated;
  grant select, insert on realtime.messages to authenticated;
  grant execute on function realtime.topic() to authenticated;
  create publication supabase_realtime;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

const uid = (s) => `00000000-0000-4000-8000-0000000000${s}`;
const U = {
  M: uid("a1"), C: uid("c1"), J1: uid("b1"), J2: uid("b2"), E: uid("e1"), N: uid("f1"),
  X1: uid("d1"), X2: uid("d2"), X3: uid("d3"), A: uid("0a"),
};
t("o Mestre dos casos é o M", casos.autor.conta, U.M);
t("o jogador dos casos é o J1", casos.jogador.conta, U.J1);
await db.query(`insert into auth.users (id, raw_user_meta_data, email) values
  ($1, '{"full_name":"Mestra Yuki","avatar_url":"https://cdn.exemplo/m.png"}', 'm@exemplo.com'),
  ($2, '{"name":"Caio"}', 'c@exemplo.com'),
  ($3, '{"user_name":"lia_jogadora","picture":"http://inseguro/x.png"}', 'j1@exemplo.com'),
  ($4, '{"full_name":"Rui"}', 'j2@exemplo.com'),
  ($5, '{"full_name":"Espectadora"}', 'e@exemplo.com'),
  ($6, '{"full_name":"Estranho"}', 'n@exemplo.com'),
  ($7, '{}', 'so-email@exemplo.com'),
  ($8, '{"full_name":"X2"}', null), ($9, '{"full_name":"X3"}', null), ($10, '{}', null)`,
[U.M, U.C, U.J1, U.J2, U.E, U.N, U.X1, U.X2, U.X3, U.A]);

/* ---------------------------------------------------------------- rodar duas vezes */

await db.exec(SQL, comAvisos);
ok++;
await db.exec("update sala_interno.tetos set horas_parada = 7");
await db.exec(SQL, comAvisos);
ok++;
t("rodar de novo não volta o teto mudado", (await db.query("select horas_parada from sala_interno.tetos")).rows[0].horas_parada, 7);
await db.exec("update sala_interno.tetos set horas_parada = 6");
t("sem pg_cron, aviso e segue", avisos.some((a) => a.includes("pg_cron")), true);

/* ---------------------------------------------------------------- quem chama */

async function como(conta, sql, params = [], { anonima = false, topico = null } = {}) {
  try {
    const rows = await db.transaction(async (tx) => {
      await tx.exec(`set local role ${conta ? "authenticated" : "anon"}`);
      const claims = conta ? JSON.stringify({ sub: conta, role: "authenticated", is_anonymous: anonima }) : "";
      await tx.query("select set_config('request.jwt.claims', $1, true)", [claims]);
      if (topico) await tx.query("select set_config('realtime.topic', $1, true)", [topico]);
      return (await tx.query(sql, params)).rows;
    });
    return { rows };
  } catch (e) {
    return { erro: e.message, detalhe: e.detail ?? null };
  }
}
const linhas = async (...a) => { const r = await como(...a); if (r.erro) bad.push(`erro inesperado: ${r.erro} em ${a[1]}`); return r.rows ?? []; };
const erro = async (...a) => (await como(...a)).erro ?? null;
const su = async (sql, params = []) => (await db.query(sql, params)).rows;
const versao = async (sala) => Number((await su("select versao from public.sala_estado where sala_id = $1", [sala]))[0]?.versao);
const J = (v) => JSON.stringify(v);

/* ---------------------------------------------------------------- anon e conta anônima */

t("anon não lê salas", /permission denied/.test(await erro(null, "select id from public.salas")), true);
t("anon não lê o registro público", /permission denied/.test(await erro(null, "select id from public.sala_operacoes_publicas")), true);
t("anon não chama ver_sala", /permission denied/.test(await erro(null, "select * from public.ver_sala('AAAAAA')")), true);
t("anon não chama criar_sala", /permission denied/.test(await erro(null, "select * from public.criar_sala('site','abcd')")), true);
t("conta anônima não cria", await erro(U.A, "select * from public.criar_sala('site','abcd')", [], { anonima: true }), "Conta Necessária");
t("conta anônima não vê", await erro(U.A, "select * from public.ver_sala('AAAAAA')", [], { anonima: true }), "Conta Necessária");

/* ---------------------------------------------------------------- criar e entrar */

t("grupo desconhecido", await erro(U.M, "select * from public.criar_sala('x','abcd')"), "Grupo Desconhecido");
t("senha curta", await erro(U.M, "select * from public.criar_sala('site','abc')"), "Senha de 4 a 64 Caracteres");
const [criada] = await linhas(U.M, "select * from public.criar_sala('site','abcd','Mesa de Teste')");
const S = criada.sala_id;
const COD = criada.codigo;
t("código de seis sem ambíguos", /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(COD), true);
t("ver_sala de quem não é membro", await linhas(U.N, "select * from public.ver_sala($1)", [` ${COD.toLowerCase()} `]),
  [{ grupo: "site", trancada: false, papel: null }]);
t("ver_sala do Mestre", (await linhas(U.M, "select * from public.ver_sala($1)", [COD]))[0].papel, "mestre");
t("ver_sala de código que não existe", await linhas(U.N, "select * from public.ver_sala('ZZZZZZ')"), []);

const entrar = async (conta, senha, papel = "jogador", codigo = COD) =>
  (await linhas(conta, "select * from public.entrar_na_sala($1,$2,$3)", [codigo, senha, papel]))[0];
t("senha errada", (await entrar(U.J1, "errada")).erro, "Senha Errada");
t("a senha errada fica anotada", Number((await su("select count(*) as n from sala_interno.tentativas where conta = $1", [U.J1]))[0].n), 1);
t("J1 entra", await entrar(U.J1, "abcd"), { sala_id: S, papel: "jogador", erro: null });
t("membro volta sem senha", await entrar(U.J1, null), { sala_id: S, papel: "jogador", erro: null });
t("J2 entra", (await entrar(U.J2, "abcd")).papel, "jogador");
t("E entra como espectador", (await entrar(U.E, "abcd", "espectador")).papel, "espectador");
t("C entra", (await entrar(U.C, "abcd")).papel, "jogador");
t("papel estranho vira jogador", (await entrar(U.X1, "abcd", "mestre")).papel, "jogador");

t("J1 não promove", await erro(U.J1, "select public.promover_mestre($1,$2)", [S, U.J2]), "Sem Permissão");
await linhas(U.M, "select public.promover_mestre($1,$2)", [S, U.C]);
t("C virou Mestre", (await entrar(U.C, null)).papel, "mestre");
t("co-Mestre não promove", await erro(U.C, "select public.promover_mestre($1,$2)", [S, U.J2]), "Sem Permissão");

const membros = await linhas(U.J1, "select conta, papel, nome, avatar from public.sala_membros where sala_id = $1 order by nome", [S]);
t("seis membros ativos", membros.length, 6);
t("nome do Google", membros.find((m) => m.conta === U.M).nome, "Mestra Yuki");
t("avatar https fica", membros.find((m) => m.conta === U.M).avatar, "https://cdn.exemplo/m.png");
t("avatar http sai", membros.find((m) => m.conta === U.J1).avatar, null);
t("nome do Discord", membros.find((m) => m.conta === U.J1).nome, "lia_jogadora");
t("sem nome, nunca o e-mail", membros.find((m) => m.conta === U.X1).nome, "Conta");
t("quem não é membro não lê os membros", await linhas(U.N, "select * from public.sala_membros"), []);

/* ---------------------------------------------------------------- combatentes */

const add = (conta, id, tipo, nome, lado = null, visao = null, dono = null) =>
  como(conta, "select public.adicionar_combatente($1,$2,$3,$4,$5,$6,$7)", [S, id, tipo, nome, lado, visao, dono]);
for (const c of casos.combatentes.filter((x) => x.tipo !== "personagem")) {
  await add(U.M, c.id, c.tipo, c.nome, c.tipo === "marcador" ? "jogador" : null);
}
await add(U.M, "mar2", "marcador", "Vigia", "inimigo");
const visoes = Object.fromEntries((await su("select combatente, visao from public.sala_resumos where sala_id = $1", [S])).map((r) => [r.combatente, r.visao]));
t("criatura nasce Oculta", visoes.gobB, "oculta");
t("marcador de jogador nasce Só Nome", visoes.ana, "nome");
t("marcador de inimigo nasce Oculto", visoes.mar2, "oculta");
for (const c of casos.combatentes.filter((x) => x.tipo === "criatura" && x.visao !== "oculta")) {
  await linhas(U.M, "select public.definir_visao($1,$2,$3)", [S, c.id, c.visao]);
}
t("J1 põe personagem", (await add(U.J1, "lia", "personagem", "Lia")).erro, undefined);
t("J2 põe personagem", (await add(U.J2, "rui", "personagem", "Rui")).erro, undefined);
t("jogador não põe criatura", (await add(U.J1, "x1", "criatura", "X")).erro, "Sem Permissão");
t("espectador não põe nada", (await add(U.E, "x2", "personagem", "X")).erro, "Sem Permissão");
t("o do colega não", (await add(U.J2, "lia", "personagem", "Lia de Novo")).erro, "Combatente Repetido");
t("id estranho", (await add(U.M, "a b", "criatura", "X")).erro, "Operação Inválida");
t("dono da lia é J1", (await su("select dono from public.sala_resumos where combatente = 'lia'"))[0].dono, U.J1);

for (const c of casos.combatentes.filter((x) => x.completo)) {
  const quem = c.id === "lia" ? U.J1 : c.id === "rui" ? U.J2 : U.M;
  const r = await como(quem, "select public.publicar_resumo($1,$2,$3::jsonb)", [S, c.id, J(c.completo)]);
  if (r.erro) bad.push(`publicar ${c.id}: ${r.erro}`);
}
t("jogador não publica a criatura", await erro(U.J1, "select public.publicar_resumo($1,'gobB','{}'::jsonb)", [S]), "Sem Permissão");
t("marcador não tem resumo", await erro(U.M, "select public.publicar_resumo($1,'ana','{}'::jsonb)", [S]), "Combatente sem Ficha");

/* ---------------------------------------------------------------- o resumo pelo jogador */

const porId = new Map(casos.combatentes.map((c) => [c.id, c]));
const vistoPor = async (conta) => Object.fromEntries((await linhas(conta,
  "select combatente, publico from public.sala_resumos where sala_id = $1", [S])).map((r) => [r.combatente, r.publico]));
const v2 = await vistoPor(U.J2);
t("J2 vê os resumos visíveis", Object.keys(v2).sort(), ["ana", "gobA", "gobB", "gobN", "lia", "rui", "sombra"]);
t("Oculta fora do resumo", "gobO" in v2 || "mar2" in v2, false);
for (const [id, publico] of Object.entries(v2)) {
  const c = porId.get(id);
  t(`resumo de ${id} igual ao do JS`, publico,
    P.resumoPorVisao(c.completo ? P.resumoSaneado(c.completo) : null, { tipo: c.tipo, visao: c.visao }));
}
t("Barra é só a faixa", v2.gobB, { faixa: "inteira" });
t("o Mestre vê os nove", Object.keys(await vistoPor(U.M)).length, 9);
t("o co-Mestre vê os nove", Object.keys(await vistoPor(U.C)).length, 9);
t("quem não é membro não vê resumo", await vistoPor(U.N), {});

/* ---------------------------------------------------------------- a ordem */

const naSala = [...casos.combatentes.map((c) => ({ combatente: c.id, tipo: c.tipo, visao: c.visao })),
  { combatente: "mar2", tipo: "marcador", visao: "oculta" }];
const ordemDoJogador = async (conta) => (await linhas(conta,
  "select combatente, posicao, na_vez from public.sala_resumos where sala_id = $1 and posicao is not null order by posicao", [S]))
  .map((r) => ({ combatente: r.combatente, posicao: r.posicao, naVez: r.na_vez }));
const gravarEstado = (conta, status, rodada, ordem, vez) =>
  como(conta, "select public.gravar_estado($1,$2,$3,'{}'::jsonb,$4::text[],$5)", [S, status, rodada, ordem, vez]);
const ordem1 = [...casos.ordens[0].ordem, "mar2"];
await gravarEstado(U.M, "ativo", 1, ordem1, "gobO");
t("ordem do jogador igual à do JS, na vez de Oculta", await ordemDoJogador(U.J1), P.ordemVistaPeloJogador(ordem1, "gobO", naSala));
t("ordem do jogador sem ninguém na vez", (await ordemDoJogador(U.J1)).some((o) => o.naVez), false);
t("o jogador não lê a ordem completa", await linhas(U.J1, "select * from public.sala_ordem_mestre"), []);
t("o Mestre lê a ordem completa", (await linhas(U.M, "select vez from public.sala_ordem_mestre where sala_id = $1", [S]))[0].vez, "gobO");
await gravarEstado(U.M, "ativo", 1, ordem1, "gobB");
t("visível na vez", (await ordemDoJogador(U.J2)).find((o) => o.naVez)?.combatente, "gobB");
t("jogador não grava o estado", (await gravarEstado(U.J1, "ativo", 2, ordem1, "lia")).erro, "Sem Permissão");
t("estado lido pelo espectador", (await linhas(U.E, "select status, rodada from public.sala_estado where sala_id = $1", [S]))[0],
  { status: "ativo", rodada: 1 });

/* ---------------------------------------------------------------- a visão sobe a versão */

let v = await versao(S);
await linhas(U.M, "select public.definir_visao($1,'gobO','barra')", [S]);
t("visão nova sobe a versão", await versao(S), v + 1);
t("Oculta que virou Barra aparece", (await vistoPor(U.J2)).gobO, { faixa: "inteira" });
t("e entra na ordem", (await ordemDoJogador(U.J2)).find((o) => o.combatente === "gobO")?.posicao, 2);
await linhas(U.M, "select public.definir_visao($1,'gobO','oculta')", [S]);
t("voltar a Oculta sobe de novo", await versao(S), v + 2);
t("e some do resumo", "gobO" in (await vistoPor(U.J2)), false);
t("e da ordem, sem buraco", (await ordemDoJogador(U.J2)).map((o) => o.posicao), [1, 2, 3, 4, 5, 6, 7]);
v = await versao(S);
await linhas(U.M, "select public.remover_combatente($1,'sombra')", [S]);
t("tirar combatente sobe a versão", await versao(S), v + 1);
t("o tirado some do resumo", "sombra" in (await vistoPor(U.J2)), false);
t("e a ordem fecha o buraco", (await ordemDoJogador(U.J2)).map((o) => o.posicao), [1, 2, 3, 4, 5, 6]);
t("personagem não tem visão", await erro(U.M, "select public.definir_visao($1,'lia','oculta')", [S]), "Operação Inválida");
t("jogador não muda visão", await erro(U.J1, "select public.definir_visao($1,'gobB','aberta')", [S]), "Sem Permissão");

/* ---------------------------------------------------------------- a senha */

t("senha_hash negado ao jogador", /permission denied/.test(await erro(U.J1, "select senha_hash from public.salas")), true);
t("senha_hash negado ao Mestre", /permission denied/.test(await erro(U.M, "select senha_hash from public.salas")), true);
t("select * negado", /permission denied/.test(await erro(U.J1, "select * from public.salas")), true);
t("as outras colunas saem", (await linhas(U.J1, "select codigo, trancada from public.salas"))[0], { codigo: COD, trancada: false });
t("quem não é membro não lê a sala", await linhas(U.N, "select codigo from public.salas"), []);

/* ---------------------------------------------------------------- ficha e sessão */

const gravar = (conta, id, parte, dados, versaoEsperada) =>
  como(conta, "select public.gravar_ficha($1,$2,$3,$4::jsonb,$5) as v", [S, id, parte, J(dados), versaoEsperada]);
t("primeira ficha", (await gravar(U.J1, "lia", "ficha", { nome: "Lia", nivel: 3 }, 0)).rows?.[0].v, 1);
const conflito = await gravar(U.J1, "lia", "ficha", { nome: "Lia", nivel: 4 }, 0);
t("versão velha recusada", [conflito.erro, conflito.detalhe], ["Versão Mudou", "1"]);
t("versão certa sobe", (await gravar(U.J1, "lia", "ficha", { nome: "Lia", nivel: 4 }, 1)).rows?.[0].v, 2);
t("sessão do dono", (await gravar(U.J1, "lia", "sessao", { hpAtual: 30 }, 0)).rows?.[0].v, 1);
t("Mestre grava a sessão do personagem", (await gravar(U.M, "lia", "sessao", { hpAtual: 20 }, 1)).rows?.[0].v, 2);
t("Mestre NÃO grava a ficha do personagem", (await gravar(U.M, "lia", "ficha", { nome: "Lia" }, 2)).erro, "Sem Permissão");
t("colega não grava", (await gravar(U.J2, "lia", "sessao", {}, 2)).erro, "Sem Permissão");
t("espectador não grava", (await gravar(U.E, "gobA", "sessao", {}, 0)).erro, "Sem Permissão");
t("jogador não grava a ficha da criatura", (await gravar(U.J1, "gobB", "ficha", {}, 0)).erro, "Sem Permissão");
t("jogador não grava a sessão da criatura", (await gravar(U.J1, "gobB", "sessao", {}, 0)).erro, "Sem Permissão");
t("jogador não tira a criatura", await erro(U.J1, "select public.remover_combatente($1,'gobB')", [S]), "Sem Permissão");
t("jogador não tira o do colega", await erro(U.J1, "select public.remover_combatente($1,'rui')", [S]), "Sem Permissão");
// O Oculto e o id que não existe dão o mesmo erro, em cada RPC (sem oráculo de existência).
for (const id of ["gobO", "mar2", "nao_existe"]) {
  t(`ficha de ${id}`, (await gravar(U.J1, id, "sessao", {}, 0)).erro, "Combatente Ausente");
  t(`resumo de ${id}`, await erro(U.J1, "select public.publicar_resumo($1,$2,'{}'::jsonb)", [S, id]), "Combatente Ausente");
  t(`tirar ${id}`, await erro(U.J1, "select public.remover_combatente($1,$2)", [S, id]), "Combatente Ausente");
  t(`operação em ${id}`, await erro(U.J1, "select * from public.gravar_operacao($1,'operacao',$2::jsonb)",
    [S, J({ id: `o_${id}`, tipo: "dano", alvo: id, delta: [] })]), "Combatente Ausente");
  t(`pedido em ${id}`, await erro(U.J1, "select * from public.gravar_operacao($1,'pedido',$2::jsonb)",
    [S, J({ id: `q_${id}`, tipo: "dano", alvo: id, delta: [] })]), "Combatente Ausente");
}
t("o Mestre ainda acha o Oculto", await erro(U.M, "select public.publicar_resumo($1,'mar2','{}'::jsonb)", [S]), "Combatente sem Ficha");
for (const id of ["gobO", "gobB", "gobA"]) {
  await gravar(U.M, id, "ficha", { nome: id }, 0);
  await gravar(U.M, id, "sessao", { hpAtual: 1 }, 0);
}
await gravar(U.J2, "rui", "ficha", { nome: "Rui" }, 0);
t("marcador sem ficha", (await gravar(U.M, "ana", "ficha", {}, 0)).erro, "Combatente sem Ficha");
const fichasDe = async (conta) => (await linhas(conta,
  "select combatente || ':' || parte as k from public.sala_fichas where sala_id = $1 order by 1", [S])).map((r) => r.k);
t("J2 lê a Aberta e a própria", await fichasDe(U.J2), ["gobA:ficha", "gobA:sessao", "rui:ficha"]);
t("espectador lê a Aberta", await fichasDe(U.E), ["gobA:ficha", "gobA:sessao"]);
t("J1 lê a própria e a Aberta", await fichasDe(U.J1), ["gobA:ficha", "gobA:sessao", "lia:ficha", "lia:sessao"]);
t("o Mestre lê todas", (await fichasDe(U.M)).length, 9);
t("quem não é membro não lê ficha", await fichasDe(U.N), []);

v = await versao(S);
await linhas(U.J1, "select public.compartilhar_ficha($1,'lia',$2)", [S, U.J2]);
t("compartilhar sobe a versão", await versao(S), v + 1);
t("J2 lê a lia compartilhada", (await fichasDe(U.J2)).filter((k) => k.startsWith("lia:")), ["lia:ficha", "lia:sessao"]);
t("o destinatário vê o compartilhamento", (await linhas(U.J2, "select combatente from public.sala_compartilhamentos")).length, 1);
t("outro membro não vê", await linhas(U.E, "select combatente from public.sala_compartilhamentos"), []);
t("colega não compartilha o que não é dele", await erro(U.J2, "select public.compartilhar_ficha($1,'lia',$2)", [S, U.E]), "Sem Permissão");
t("não compartilha consigo", await erro(U.J1, "select public.compartilhar_ficha($1,'lia',$2)", [S, U.J1]), "Membro Ausente");
await linhas(U.J1, "select public.compartilhar_ficha($1,'lia',$2,false)", [S, U.J2]);
t("tirar sobe a versão", await versao(S), v + 2);
t("J2 não lê mais a lia", (await fichasDe(U.J2)).some((k) => k.startsWith("lia:")), false);
v = await versao(S);
await linhas(U.M, "select public.definir_dono($1,'gobB',$2)", [S, U.J1]);
t("dono novo sobe a versão", await versao(S), v + 1);
t("o dono novo lê a ficha", (await fichasDe(U.J1)).includes("gobB:ficha"), true);
await linhas(U.M, "select public.definir_dono($1,'gobB',null)", [S]);
t("sem dono, não lê mais", (await fichasDe(U.J1)).includes("gobB:ficha"), false);
t("espectador não vira dono", await erro(U.M, "select public.definir_dono($1,'gobB',$2)", [S, U.E]), "Membro Ausente");

/* ---------------------------------------------------------------- o registro */

const op = (conta, especie, dados, escondida = false) =>
  como(conta, "select * from public.gravar_operacao($1,$2,$3::jsonb,$4)", [S, especie, J(dados), escondida]);
const autorM = { conta: U.M, papel: "mestre" };
const hp = (antes, depois) => [{ caminho: ["hpAtual"], antes, depois }];
const f1 = (await op(U.M, "operacao", { id: "f1", tipo: "dano", alvo: "gobB", autor: autorM, entrada: { valor: 12 }, delta: hp(40, 30) })).rows?.[0];
t("dano em Barra tem pública", !!f1?.publica_id, true);
t("dano em Oculta sem pública", (await op(U.M, "operacao", { id: "f2", tipo: "dano", alvo: "gobO", autor: autorM, entrada: { valor: 5 }, delta: hp(50, 45) })).rows?.[0].publica_id, null);
t("Oculta agindo sem pública", (await op(U.M, "operacao", { id: "f3", tipo: "dano", alvo: "lia", autor: { ...autorM, combatente: "gobO" },
  entrada: { valor: 9 }, delta: hp(20, 11) })).rows?.[0].publica_id, null);
t("chat do Mestre", !!(await op(U.M, "chat", { id: "f4", texto: "Boa noite" })).rows?.[0].publica_id, true);
t("chat do espectador", !!(await op(U.E, "chat", { id: "f5", texto: "Oi" })).rows?.[0].publica_id, true);
t("espectador não opera", (await op(U.E, "operacao", { id: "e1", tipo: "dano", alvo: "gobB", delta: [] })).erro, "Sem Permissão");
t("espectador não rola", (await op(U.E, "rolagem", { id: "e2", rolagem: { total: 3 } })).erro, "Sem Permissão");
t("rolagem escondida sem pública", (await op(U.M, "rolagem", { id: "f6", rolagem: { tipo: "teste", total: 19 } }, true)).rows?.[0].publica_id, null);
t("jogador não esconde", (await op(U.J1, "rolagem", { id: "j0", rolagem: { total: 3 } }, true)).erro, "Sem Permissão");
t("rolagem do personagem", !!(await op(U.J1, "rolagem", { id: "f7", combatente: "lia", rolagem: { tipo: "dano", total: 8, dados: [3, 5] } })).rows?.[0].publica_id, true);
t("rolagem com combatente alheio", (await op(U.J1, "rolagem", { id: "j1", combatente: "gobB", rolagem: { total: 3 } })).erro, "Sem Permissão");
t("jogador não opera direto na criatura", (await op(U.J1, "operacao", { id: "j2", tipo: "dano", alvo: "gobB", delta: [] })).erro, "Sem Permissão");
t("jogador opera no que é dele", !!(await op(U.J1, "operacao", { id: "f8", tipo: "cura", alvo: "lia", entrada: { valor: 4 }, delta: hp(11, 15) })).rows?.[0].id, true);
t("jogador não age com o do colega", (await op(U.J1, "operacao", { id: "j3", tipo: "cura", alvo: "lia", autor: { combatente: "rui" }, delta: [] })).erro, "Sem Permissão");
t("pedido em Oculta responde como ausente", (await op(U.J1, "pedido", { id: "j4", tipo: "dano", alvo: "gobO", delta: [] })).erro, "Combatente Ausente");
t("pedido em quem não existe responde igual", (await op(U.J1, "pedido", { id: "j5", tipo: "dano", alvo: "ninguem", delta: [] })).erro, "Combatente Ausente");
const p1 = (await op(U.J1, "pedido", { id: "p1", tipo: "dano", alvo: "gobB", autor: { combatente: "lia" }, entrada: { valor: 20 }, delta: [], quando: 1000 })).rows?.[0];
t("pedido do jogador tem pública", !!p1?.publica_id, true);
t("Mestre não pede", (await op(U.M, "pedido", { id: "m1", tipo: "dano", alvo: "gobB", delta: [] })).erro, "Sem Permissão");
t("turno de Oculta sem pública", (await op(U.M, "sistema", { id: "s1", evento: "turno", rodada: 1, combatente: "gobO" })).rows?.[0].publica_id, null);
t("turno de Só Nome com pública", !!(await op(U.M, "sistema", { id: "s2", evento: "turno", rodada: 1, combatente: "gobN" })).rows?.[0].publica_id, true);
t("jogador não manda evento", (await op(U.J1, "sistema", { id: "j6", evento: "turno" })).erro, "Sem Permissão");
t("evento estranho", (await op(U.M, "sistema", { id: "m2", evento: "explodir" })).erro, "Operação Inválida");
t("tipo estranho", (await op(U.M, "operacao", { id: "m3", tipo: "matar", alvo: "gobB", delta: [] })).erro, "Operação Inválida");
t("id estranho", (await op(U.M, "chat", { id: "a b", texto: "x" })).erro, "Operação Inválida");
t("chat vazio", (await op(U.M, "chat", { id: "m4", texto: "   " })).erro, "Operação Inválida");
const repetida = (await op(U.M, "operacao", { id: "f1", tipo: "dano", alvo: "gobB", delta: [] })).rows?.[0];
t("repetir o mesmo id devolve o gravado", [repetida?.id, Number(repetida?.seq)], [f1.id, Number(f1.seq)]);
t("o id de outro não serve", (await op(U.J1, "operacao", { id: "f1", tipo: "cura", alvo: "lia", delta: [] })).erro, "Operação Repetida");
t("o autor é do servidor", (await su("select dados -> 'autor' as a from public.sala_operacoes where operacao_id = 'f8'"))[0].a,
  { conta: U.J1, papel: "jogador" });

const seqs = async (tabela) => (await su(`select seq from public.${tabela} where sala_id = $1 order by seq`, [S])).map((r) => Number(r.seq));
const contiguo = (l) => l.every((n, i) => n === i + 1);
t("sequência completa sem buraco", contiguo(await seqs("sala_operacoes")), true);
t("sequência pública sem buraco", contiguo(await seqs("sala_operacoes_publicas")), true);
t("pública tem menos que a completa", (await seqs("sala_operacoes_publicas")).length < (await seqs("sala_operacoes")).length, true);

const completasDe = async (conta) => (await linhas(conta,
  "select operacao_id from public.sala_operacoes where sala_id = $1 order by seq", [S])).map((r) => r.operacao_id);
t("J2 lê completo só o chat", await completasDe(U.J2), ["f4", "f5"]);
t("J1 lê completo o dele e o chat", await completasDe(U.J1), ["f4", "f5", "f7", "f8", "p1"]);
t("o Mestre lê tudo", (await completasDe(U.M)).length, (await seqs("sala_operacoes")).length);
t("quem não é membro não lê registro", await completasDe(U.N), []);
const publicasDe = async (conta) => (await linhas(conta,
  "select especie, publica from public.sala_operacoes_publicas where sala_id = $1 order by seq", [S])).map((r) => r.publica);
const pubJ2 = await publicasDe(U.J2);
t("J2 lê a pública do dano em Barra", pubJ2[0], { especie: "operacao", autor: { conta: U.M, papel: "mestre" }, tipo: "dano",
  alvo: { id: "gobB", nome: "Goblin #2" }, valor: 12, vida: { antes: "inteira", depois: "acima_da_metade" } });
t("quem não é membro não lê a pública", await publicasDe(U.N), []);

// Varredura: nada do que o J2 consegue ler cita o Oculto.
const tudoDoJ2 = J(await Promise.all(["salas (id, codigo)", "sala_membros", "sala_estado", "sala_ordem_mestre", "sala_resumos",
  "sala_fichas", "sala_compartilhamentos", "sala_operacoes", "sala_operacoes_publicas"].map(async (tab) => {
  const [nome, cols] = tab.split(" ");
  return linhas(U.J2, `select ${cols ? cols.slice(1, -1) : "*"} from public.${nome}`);
})));
t("nada do que o jogador lê cita o Oculto", /gobO|Goblin Oculto|mar2|Vigia/.test(tudoDoJ2), false);
t("nada do que o jogador lê traz a escondida", /"total":19/.test(tudoDoJ2), false);

/* ---------------------------------------------------------------- pedidos */

const responder = (conta, pedido, aceitar, operacao = null) =>
  como(conta, "select * from public.responder_pedido($1,$2,$3,$4::jsonb)", [S, pedido, aceitar, operacao && J(operacao)]);
const medida = { id: "p1", tipo: "dano", alvo: "gobB", autor: { conta: U.M, papel: "mestre" }, entrada: { valor: 20 }, delta: hp(30, 10), quando: 1000 };
t("colega não responde, e o pedido some para ele", (await responder(U.J2, "p1", true, medida)).erro, "Pedido Ausente");
t("pedido que não existe dá o mesmo erro", (await responder(U.J2, "nao_existe", true, medida)).erro, "Pedido Ausente");
t("operação de outro alvo recusada", (await responder(U.M, "p1", true, { ...medida, alvo: "gobA" })).erro, "Operação Inválida");
const respostaAceita = await responder(U.M, "p1", true, medida);
if (respostaAceita.erro) {
  console.error(`responder_pedido falhou: ${respostaAceita.erro}`);
  console.error(bad.join("\n"));
  process.exit(1);
}
const aceita = respostaAceita.rows[0];
t("aceito vira operação", !!aceita?.id && aceita.id !== p1.id, true);
const [linhaAceita] = await su("select dados, responde, papel from public.sala_operacoes where id = $1", [aceita.id]);
t("o autor continua quem pediu", linhaAceita.dados.autor, { conta: U.J1, papel: "jogador", combatente: "lia" });
t("quem aceitou fica no pedido", linhaAceita.dados.pedido.por, { conta: U.M, papel: "mestre" });
t("a operação aponta para o pedido", linhaAceita.responde, p1.id);
t("estado do pedido", (await su("select estado_pedido from public.sala_operacoes where id = $1", [p1.id]))[0].estado_pedido, "aceito");
t("estado do pedido na pública", (await linhas(U.J2, "select estado_pedido from public.sala_operacoes_publicas where id = $1", [p1.publica_id]))[0].estado_pedido, "aceito");
const pubAceita = (await linhas(U.J1, "select publica from public.sala_operacoes_publicas where id = $1", [aceita.publica_id]))[0].publica;
t("pública do aceito: valor rolado, faixas e o pedido", pubAceita, { especie: "operacao",
  autor: { conta: U.J1, papel: "jogador", combatente: { id: "lia", nome: "Lia" } }, tipo: "dano", alvo: { id: "gobB", nome: "Goblin #2" },
  valor: 20, vida: { antes: "acima_da_metade", depois: "ate_um_quarto" }, responde: p1.publica_id });
t("o jogador não lê o aceito completo", (await completasDe(U.J1)).filter((x) => x === "p1"), ["p1"]);
t("responder de novo", (await responder(U.M, "p1", true, medida)).erro, "Pedido Respondido");
await op(U.J1, "pedido", { id: "p2", tipo: "cura", alvo: "gobN", entrada: { valor: 3 }, delta: [] });
t("recusar devolve o pedido", (await responder(U.M, "p2", false)).rows?.[0].publica_id != null, true);
t("recusado", (await su("select estado_pedido from public.sala_operacoes where operacao_id = 'p2'"))[0].estado_pedido, "recusado");
// O colega pede agindo com o personagem DELE: o dono do alvo precisa ler o pedido completo para responder.
await op(U.J2, "pedido", { id: "p3", tipo: "cura", alvo: "lia", autor: { combatente: "rui" }, entrada: { valor: 2 }, delta: [] });
t("o dono do alvo lê o pedido completo", (await completasDe(U.J1)).includes("p3"), true);
t("quem pediu lê o próprio pedido", (await completasDe(U.J2)).includes("p3"), true);
t("outro membro não lê o pedido completo", (await completasDe(U.E)).includes("p3"), false);
t("outro membro lê a pública do pedido", (await publicasDe(U.E)).some((x) => x.especie === "pedido" && x.alvo?.id === "lia"), true);
t("quem pediu não responde", (await responder(U.J2, "p3", false)).erro, "Pedido Ausente");
const aceitaP3 = await responder(U.J1, "p3", true, { id: "p3", tipo: "cura", alvo: "lia", entrada: { valor: 2 }, delta: hp(11, 13) });
t("o dono do alvo aceita", [aceitaP3.erro, !!aceitaP3.rows?.[0]?.publica_id], [undefined, true]);
t("o aceito guarda quem pediu", (await su("select dados -> 'autor' as a from public.sala_operacoes where operacao_id = 'p3' and especie = 'operacao'"))[0].a,
  { conta: U.J2, papel: "jogador", combatente: "rui" });

/* ---------------------------------------------------------------- remover */

v = await versao(S);
t("jogador não remove", await erro(U.J1, "select public.remover_membro($1,$2)", [S, U.E]), "Sem Permissão");
t("co-Mestre não remove quem criou", await erro(U.C, "select public.remover_membro($1,$2)", [S, U.M]), "Sem Permissão");
t("ninguém remove a si", await erro(U.C, "select public.remover_membro($1,$2)", [S, U.C]), "Sem Permissão");
await linhas(U.M, "select public.promover_mestre($1,$2)", [S, U.E]);
t("co-Mestre não remove co-Mestre", await erro(U.C, "select public.remover_membro($1,$2)", [S, U.E]), "Sem Permissão");
await linhas(U.M, "select public.promover_mestre($1,$2,false)", [S, U.E]);
t("rebaixado vira jogador", (await entrar(U.E, null)).papel, "jogador");
v = await versao(S);
await linhas(U.M, "select public.remover_membro($1,$2)", [S, U.J2]);
t("remover sobe a versão", await versao(S), v + 1);
const propria = await linhas(U.J2, "select conta, removido_em is not null as removido from public.sala_membros");
t("o removido lê só a própria linha, marcada", propria, [{ conta: U.J2, removido: true }]);
t("o removido não lê mais o estado", await linhas(U.J2, "select * from public.sala_estado"), []);
t("nem o registro público", await linhas(U.J2, "select * from public.sala_operacoes_publicas"), []);
t("nem o resumo", await linhas(U.J2, "select * from public.sala_resumos"), []);
t("o removido não grava", (await op(U.J2, "chat", { id: "r1", texto: "x" })).erro, "Sala Ausente");
t("o removido não volta", (await entrar(U.J2, "abcd")).erro, "Removido da Sala");
t("o Mestre ainda vê o removido", (await linhas(U.M, "select count(*)::int as n from public.sala_membros where removido_em is not null"))[0].n, 1);
t("o colega não vê o removido", (await linhas(U.J1, "select count(*)::int as n from public.sala_membros where removido_em is not null"))[0].n, 0);

/* ---------------------------------------------------------------- trancar, cheia, tentativas */

v = await versao(S);
await linhas(U.M, "select public.trancar($1)", [S]);
t("trancar sobe a versão", await versao(S), v + 1);
t("trancada recusa quem chega", (await entrar(U.X2, "abcd")).erro, "Sala Trancada");
t("trancada deixa o membro voltar", (await entrar(U.J1, null)).papel, "jogador");
t("ver_sala diz trancada", (await linhas(U.N, "select trancada from public.ver_sala($1)", [COD]))[0].trancada, true);
await linhas(U.M, "select public.trancar($1,false)", [S]);
await su("update sala_interno.tetos set pessoas_por_sala = 6");
t("cabe o sexto", (await entrar(U.X2, "abcd")).papel, "jogador");
t("Sala Cheia", (await entrar(U.N, "abcd")).erro, "Sala Cheia");
await su("update sala_interno.tetos set pessoas_por_sala = 8");
for (let i = 0; i < 10; i++) await entrar(U.X3, "errada");
t("depois de 10 erradas, nem a certa", (await entrar(U.X3, "abcd")).erro, "Muitas Tentativas");
await linhas(U.M, "select public.trocar_senha($1,'nova-senha')", [S]);
t("jogador não troca a senha", await erro(U.J1, "select public.trocar_senha($1,'outra')", [S]), "Sem Permissão");
await su("delete from sala_interno.tentativas");
t("a senha velha não entra", (await entrar(U.X3, "abcd")).erro, "Senha Errada");
t("a nova entra", (await entrar(U.X3, "nova-senha")).papel, "jogador");

/* ---------------------------------------------------------------- Presence */

await su("insert into realtime.messages (topic, extension) values ($1, 'presence'), ($1, 'broadcast'), ('sala:outra', 'presence')", [`sala:${S}`]);
// O tempo real autoriza o canal lendo realtime.messages com o tópico do canal: aqui, a mesma leitura.
const pres = async (conta, topico) => (await linhas(conta, "select extension from realtime.messages where topic = $1", [topico], { topico })).map((r) => r.extension);
t("membro lê a presença do canal", await pres(U.J1, `sala:${S}`), ["presence"]);
t("quem não é membro não lê", await pres(U.N, `sala:${S}`), []);
t("tópico estranho não lê", await pres(U.J1, "sala:abc"), []);
t("membro publica presença", (await como(U.J1, "insert into realtime.messages (topic, extension) values ($1,'presence')", [`sala:${S}`], { topico: `sala:${S}` })).erro, undefined);
t("ninguém publica broadcast", /row-level security/.test((await como(U.J1, "insert into realtime.messages (topic, extension) values ($1,'broadcast')", [`sala:${S}`], { topico: `sala:${S}` })).erro ?? ""), true);

/* ---------------------------------------------------------------- salas por Mestre, parada, fechar, limpar */

const [s2] = await linhas(U.M, "select * from public.criar_sala('afty','abcd','Segunda')");
t("terceira passa do teto", await erro(U.M, "select * from public.criar_sala('afty','abcd','Terceira')"), "Limite de Salas Abertas");
await su("update public.salas set ultima_atividade = now() - interval '7 hours' where id = $1", [s2.sala_id]);
t("parada recusa escrita", await erro(U.M, "select * from public.gravar_operacao($1,'chat','{\"id\":\"z1\",\"texto\":\"x\"}'::jsonb)", [s2.sala_id]), "Sala Fechada");
t("parada some do ver_sala", await linhas(U.N, "select * from public.ver_sala($1)", [s2.codigo]), []);
t("parada recusa quem chega", (await entrar(U.J1, "abcd", "jogador", s2.codigo)).erro, "Sala Ausente");
t("parada conta como fechada em minhas_salas", (await linhas(U.M, "select status from public.minhas_salas() where sala_id = $1", [s2.sala_id]))[0].status, "fechada");
t("parada libera a vaga", !!(await linhas(U.M, "select * from public.criar_sala('afty','abcd','Terceira')"))[0]?.sala_id, true);
await su("select sala_interno.varrer(true)");
t("a varredura fecha a parada", (await su("select status, fechada_por from public.salas where id = $1", [s2.sala_id]))[0], { status: "fechada", fechada_por: "parada" });
t("e finaliza o estado dela", (await su("select status from public.sala_estado where sala_id = $1", [s2.sala_id]))[0].status, "finalizado");

t("jogador não fecha", await erro(U.J1, "select public.fechar_sala($1)", [S]), "Sem Permissão");
v = await versao(S);
await linhas(U.C, "select public.fechar_sala($1)", [S]);
t("fechar sobe a versão", await versao(S), v + 1);
t("fechar de novo não quebra", await erro(U.M, "select public.fechar_sala($1)", [S]), null);
t("fechada recusa escrita", (await op(U.J1, "chat", { id: "z2", texto: "x" })).erro, "Sala Fechada");
t("fechada some do ver_sala", await linhas(U.N, "select * from public.ver_sala($1)", [COD]), []);
t("o membro ainda lê o estado final", (await linhas(U.J1, "select status from public.sala_estado where sala_id = $1", [S]))[0].status, "finalizado");
t("as fichas completas saem, as sessões ficam", await fichasDe(U.J1), ["gobA:sessao", "lia:sessao"]);
t("o registro público fica", (await publicasDe(U.J1)).length > 0, true);
t("minhas_salas do ausente", (await linhas(U.J1, "select status from public.minhas_salas() where sala_id = $1", [S]))[0].status, "fechada");
t("o removido não acha a Sala", await linhas(U.J2, "select * from public.minhas_salas()"), []);

await su("update public.salas set fechada_em = now() - interval '15 days' where id = $1", [S]);
await su("select sala_interno.varrer(true)");
const sobra = await su(`select
  (select count(*) from public.salas where id = $1) + (select count(*) from public.sala_membros where sala_id = $1)
  + (select count(*) from public.sala_estado where sala_id = $1) + (select count(*) from public.sala_resumos where sala_id = $1)
  + (select count(*) from public.sala_fichas where sala_id = $1) + (select count(*) from public.sala_operacoes where sala_id = $1)
  + (select count(*) from public.sala_operacoes_publicas where sala_id = $1) as n`, [S]);
t("depois do prazo a Sala sai inteira", Number(sobra[0].n), 0);
t("a outra fechada ainda no prazo fica", (await su("select count(*)::int as n from public.salas where id = $1", [s2.sala_id]))[0].n, 1);

/* ---------------------------------------------------------------- privilégios e publicação */

const priv = await su(`select
  has_function_privilege('anon', 'public.ver_sala(text)', 'execute') as anon_rpc,
  has_function_privilege('authenticated', 'public.ver_sala(text)', 'execute') as auth_rpc,
  has_function_privilege('authenticated', 'sala_interno.varrer(boolean)', 'execute') as auth_interna,
  has_function_privilege('authenticated', 'sala_interno.mestre(uuid)', 'execute') as auth_ajudante,
  has_table_privilege('authenticated', 'public.sala_fichas', 'insert') as auth_insert,
  has_table_privilege('authenticated', 'public.sala_operacoes', 'update') as auth_update,
  has_table_privilege('anon', 'public.sala_resumos', 'select') as anon_select,
  has_table_privilege('authenticated', 'sala_interno.resumos_completos', 'select') as auth_completos,
  has_column_privilege('authenticated', 'public.salas', 'senha_hash', 'select') as auth_senha,
  has_column_privilege('authenticated', 'public.salas', 'codigo', 'select') as auth_codigo`);
t("privilégios", priv[0], { anon_rpc: false, auth_rpc: true, auth_interna: false, auth_ajudante: true, auth_insert: false,
  auth_update: false, anon_select: false, auth_completos: false, auth_senha: false, auth_codigo: true });
const pub = await su("select pubinsert, pubupdate, pubdelete, pubtruncate from pg_publication where pubname = 'supabase_realtime'");
t("publicação sem DELETE", pub[0], { pubinsert: true, pubupdate: true, pubdelete: false, pubtruncate: false });
t("tabelas publicadas", (await su("select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by 1")).map((r) => r.tablename),
  ["sala_compartilhamentos", "sala_estado", "sala_fichas", "sala_membros", "sala_operacoes", "sala_operacoes_publicas", "sala_ordem_mestre", "sala_resumos"]);
t("replica identity padrão", (await su(`select count(*)::int as n from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname like 'sala_%' and c.relkind = 'r' and c.relreplident <> 'd'`))[0].n, 0);
t("RLS em toda tabela das Salas", (await su(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and (n.nspname = 'sala_interno' or (n.nspname = 'public' and (c.relname = 'salas' or c.relname like 'sala_%')))
  and not c.relrowsecurity`)), []);

/* ---------------------------------------------------------------- os casos nas funções do SQL */

await su(`insert into public.salas (id, codigo, grupo, dono, senha_hash) values ('22222222-2222-4222-8222-222222222222', 'PRVCAS', 'site', $1, 'x')`, [U.M]);
const SC = "22222222-2222-4222-8222-222222222222";
await su("insert into public.sala_estado (sala_id) values ($1)", [SC]);
await su("insert into public.sala_ordem_mestre (sala_id) values ($1)", [SC]);
for (const c of casos.combatentes) {
  const [r] = await su(`insert into public.sala_resumos (sala_id, combatente, tipo, visao, nome, lado) values ($1,$2,$3,$4,$5,'inimigo') returning id`,
    [SC, c.id, c.tipo, c.visao, c.nome]);
  if (c.completo) await su("insert into sala_interno.resumos_completos (resumo_id, completo) values ($1, sala_interno.resumo_saneado($2::jsonb))", [r.id, J(c.completo)]);
}
for (const [opId, pubId] of Object.entries(casos.publicasConhecidas)) {
  await su("insert into public.sala_operacoes_publicas (id, sala_id, seq, especie, publica) values ($1,$2,1,'operacao','{}')", [pubId, SC]);
  await su(`insert into public.sala_operacoes (sala_id, seq, especie, operacao_id, papel, dados, publica_id) values ($1,1,'operacao',$2,'mestre','{}',$3)`, [SC, opId, pubId]);
}
for (const [pv, max, esp] of casos.faixas) {
  t(`SQL faixa ${pv}/${max}`, (await su("select sala_interno.faixa_de_vida($1,$2) as f", [pv, max]))[0].f, esp);
}
for (const c of casos.saneados) {
  t(`SQL saneado: ${c.nome}`, (await su("select sala_interno.resumo_saneado($1::jsonb) as r", [c.entrada == null ? null : J(c.entrada)]))[0].r, c.esperado);
}
for (const c of casos.resumos) {
  const r = (await su("select sala_interno.resumo_por_visao(case when $1::jsonb is null then null else sala_interno.resumo_saneado($1::jsonb) end, $2, $3) as r",
    [c.completo == null ? null : J(c.completo), c.tipo, c.visao]))[0].r;
  t(`SQL resumo: ${c.nome}`, r, c.inteiro ? P.resumoSaneado(c.completo) : c.esperado);
}
for (const c of casos.envolvidos) {
  t(`SQL envolvidos: ${J(c.dados)}`, (await su("select sala_interno.envolvidos($1, $2::jsonb) as e", [c.especie, J(c.dados)]))[0].e, c.esperado);
}
const comAutor = (x) => JSON.parse(J(x).replaceAll('"$autor"', J(casos.autor)));
const porIdJs = new Map(casos.combatentes.map((c) => [c.id, { ...c, completo: c.completo == null ? null : P.resumoSaneado(c.completo) }]));
const ctxJs = { combatente: (id) => porIdJs.get(id) ?? null, publicaDe: (id) => casos.publicasConhecidas[id] ?? null };
for (const c of casos.publicas) {
  const registro = comAutor(c.registro);
  const doSql = (await su("select sala_interno.publica($1,$2,$3::jsonb,$4) as p", [SC, registro.especie, J(registro.dados), !!registro.escondida]))[0].p;
  t(`SQL publica: ${c.nome}`, doSql, comAutor(c.esperado));
  t(`SQL e JS iguais: ${c.nome}`, doSql, P.versaoPublica(registro, ctxJs));
}
const naSalaCasos = casos.combatentes.map((c) => ({ combatente: c.id, tipo: c.tipo, visao: c.visao }));
for (const c of casos.ordens) {
  await su("update public.sala_ordem_mestre set ordem = $2::text[], vez = $3 where sala_id = $1", [SC, c.ordem, c.vez]);
  await su("select sala_interno.recalcular_ordem($1)", [SC]);
  const doSql = (await su("select combatente, posicao, na_vez from public.sala_resumos where sala_id = $1 and posicao is not null order by posicao", [SC]))
    .map((r) => ({ combatente: r.combatente, posicao: r.posicao, naVez: r.na_vez }));
  t(`SQL ordem: ${c.nome}`, doSql, c.esperado);
  t(`SQL e JS iguais: ordem ${c.nome}`, doSql, P.ordemVistaPeloJogador(c.ordem, c.vez, naSalaCasos));
  const fora = (await su("select count(*)::int as n from public.sala_resumos where sala_id = $1 and posicao is null and na_vez", [SC]))[0].n;
  t(`SQL ordem: ${c.nome}, fora da ordem nunca na vez`, fora, 0);
}

/* ---------------------------------------------------------------- fim */

await db.close();
if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
