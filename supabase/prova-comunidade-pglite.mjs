// Prova do SQL em Postgres local. Passe o diretório dist do @electric-sql/pglite.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dist = process.argv[2];
if (!dist) {
  console.error("Uso: node supabase/prova-comunidade-pglite.mjs <dist do @electric-sql/pglite>");
  process.exit(2);
}
const { PGlite } = await import(pathToFileURL(join(dist, "index.js")).href);
const db = new PGlite();
const sql = await readFile(new URL("./migrations/20261126014725_comunidade_publicacoes_e_comentarios.sql", import.meta.url), "utf8");
const sqlAutoria = await readFile(new URL("./migrations/20261126014733_comunidade_autoria_da_conta.sql", import.meta.url), "utf8");
const sqlEdicao = await readFile(new URL("./migrations/20261126020955_comunidade_editar_publicacao.sql", import.meta.url), "utf8");

const autora = "de25d4d9-8748-4caa-b557-1efea24f1611";
const pessoa = "ed25d4d9-8748-4caa-b557-1efea24f1611";
const terceira = "fe25d4d9-8748-4caa-b557-1efea24f1611";

async function consultar(sub, sql, valores = [], anonima = false) {
  return db.transaction(async (tx) => {
    await tx.exec(sub ? "set local role authenticated" : "set local role anon");
    await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(sub ? { sub, is_anonymous: anonima } : {})]);
    return (await tx.query(sql, valores)).rows;
  });
}

const inserir = `insert into public.comunidade_publicacoes(categoria,titulo,autor,resumo,texto,dados,conteudo)
  values($1,$2,'Rei','Resumo',$3,$4,$5) returning id`;
const topico = ["topico", "Início da mesa", "Como vocês usam barreiras?", "{}", null];

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create table auth.identities (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users (id),
      provider text not null,
      identity_data jsonb not null,
      last_sign_in_at timestamptz
    );
    create function auth.jwt() returns jsonb language sql stable as
      $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
  `);
  await db.query(`insert into auth.users values
    ($1, 'rei.mori@example.test', now()),
    ($2, 'outro.nome@example.test', now()),
    ($3, 'terceira@example.test', now())`, [autora, pessoa, terceira]);
  await db.query(`insert into auth.identities(user_id, provider, identity_data)
    values ($1, 'discord', '{"full_name":"mesa.discord"}')`, [pessoa]);
  await db.exec(sql);
  await db.exec(sql);

  await assert.rejects(consultar(null, inserir, topico), { code: "42501" });
  await assert.rejects(consultar(autora, inserir, topico, true), { code: "42501" });
  await assert.rejects(consultar(autora, inserir, ["addon", "Pacote", "", "{}", null]), { code: "23514" });
  await assert.rejects(consultar(autora, inserir, ["jogador", "Ficha trocada", "", "{}", JSON.stringify({ name: "X", rulesVersion: "2.5.2" })]), { code: "23514" });
  await assert.rejects(consultar(autora, inserir, ["topico", "Vazio", " ", "{}", null]), { code: "23514" });
  await assert.rejects(consultar(autora, inserir, ["topico", "Dados inválidos", "Texto", '{"Nível":{}}', null]), { code: "23514" });

  const [{ id: idTopico }] = await consultar(autora, inserir, topico);
  const [{ id: idCss }] = await consultar(autora, inserir, ["css", "Estilo", "Amostra de tema", '{"Compatibilidade":"Ficha Final G2"}', '{"css":":scope{color: purple}"}']);
  const [{ id: idFicha }] = await consultar(autora, inserir, ["jogador", "Rei Mori", "", '{"Nível":"10"}', '{"name":"Rei Mori","rulesVersion":"player","core":{"nd":10}}']);
  const [{ id: idCriatura }] = await consultar(autora, inserir, ["criatura", "Maldição", "", '{"ND":"8"}', '{"name":"Maldição","rulesVersion":"2.5.2"}']);
  assert.equal((await consultar(null, "select titulo from public.comunidade_publicacoes")).length, 4);
  assert.deepEqual(await consultar(null, "select titulo from public.comunidade_publicacoes where busca ilike '%inicio%'"), [{ titulo: "Início da mesa" }]);
  assert.equal((await consultar(null, "select conteudo from public.comunidade_publicacoes where id = $1", [idCss]))[0].conteudo.css, ":scope{color: purple}");
  assert.equal((await consultar(null, "select conteudo from public.comunidade_publicacoes where id = $1", [idFicha]))[0].conteudo.core.nd, 10);
  await assert.rejects(consultar(null, "select conta_id from public.comunidade_publicacoes"), { code: "42501" });
  await assert.rejects(consultar(pessoa, "select conta_id from public.comunidade_publicacoes"), { code: "42501" });
  await assert.rejects(consultar(pessoa, "update public.comunidade_publicacoes set titulo = 'alterado'"), { code: "42501" });
  const [{ autoria }] = await consultar(autora, "select public.comunidade_autoria($1) autoria", [idTopico]);
  assert.deepEqual(autoria, { publicacao: true, comentarios: [] });
  assert.deepEqual(await consultar(pessoa, "delete from public.comunidade_publicacoes where id = $1 returning id", [idTopico]), []);
  await assert.rejects(consultar(null, "select public.comunidade_autoria($1)", [idTopico]), { code: "42501" });

  const inserirComentario = "insert into public.comunidade_comentarios(publicacao_id,autor,texto) values($1,'Visitante',$2) returning id";
  await assert.rejects(consultar(null, inserirComentario, [idTopico, "Obrigado"]), { code: "42501" });
  await assert.rejects(consultar(pessoa, inserirComentario, [idTopico, "Obrigado"], true), { code: "42501" });
  await assert.rejects(consultar(pessoa, inserirComentario, [idTopico, " "]), { code: "23514" });
  await assert.rejects(consultar(pessoa, inserirComentario, ["91cdc59f-f610-4dc8-a887-4bdd59dbfb09", "Obrigado"]), { code: "23503" });
  const [{ id: idComentario }] = await consultar(pessoa, inserirComentario, [idTopico, "Valeu pela dica!"]);
  assert.deepEqual(await consultar(null, "select autor, texto from public.comunidade_comentarios where publicacao_id = $1", [idTopico]),
    [{ autor: "Visitante", texto: "Valeu pela dica!" }]);
  await db.exec(sqlAutoria);
  assert.deepEqual(await consultar(null, "select autor from public.comunidade_publicacoes where id = $1", [idTopico]), [{ autor: "rei.mori" }]);
  assert.deepEqual(await consultar(null, "select autor from public.comunidade_comentarios where id = $1", [idComentario]), [{ autor: "mesa.discord" }]);

  await db.exec(sqlEdicao);
  const editarTopico = "update public.comunidade_publicacoes set titulo = 'Mesa revisada', resumo = '**Novo resumo**' where id = $1 returning id";
  await assert.rejects(consultar(null, editarTopico, [idTopico]), { code: "42501" });
  assert.deepEqual(await consultar(pessoa, editarTopico, [idTopico]), []);
  assert.deepEqual(await consultar(autora, editarTopico, [idTopico], true), []);
  await assert.rejects(consultar(autora, "update public.comunidade_publicacoes set autor = 'Outro' where id = $1", [idTopico]), { code: "42501" });
  await assert.rejects(consultar(autora, "update public.comunidade_publicacoes set conta_id = $1 where id = $2", [pessoa, idTopico]), { code: "42501" });
  await assert.rejects(consultar(autora, "update public.comunidade_publicacoes set texto = '' where id = $1", [idTopico]), { code: "23514" });
  assert.deepEqual(await consultar(autora, editarTopico, [idTopico]), [{ id: idTopico }]);
  assert.deepEqual(await consultar(null, "select titulo, resumo from public.comunidade_publicacoes where id = $1", [idTopico]),
    [{ titulo: "Mesa revisada", resumo: "**Novo resumo**" }]);

  const [novaPublicacao] = await consultar(autora, inserir.replace("returning id", "returning autor"), topico);
  assert.equal(novaPublicacao.autor, "rei.mori");
  const [novoComentario] = await consultar(pessoa, inserirComentario.replace("returning id", "returning autor"), [idCriatura, "Outra ficha"]);
  assert.equal(novoComentario.autor, "mesa.discord");
  await assert.rejects(consultar(pessoa, "select conta_id from public.comunidade_comentarios"), { code: "42501" });
  assert.deepEqual((await consultar(pessoa, "select public.comunidade_autoria($1) autoria", [idTopico]))[0].autoria,
    { nome: "mesa.discord", publicacao: false, comentarios: [idComentario] });
  assert.deepEqual(await consultar(autora, "delete from public.comunidade_comentarios where id = $1 returning id", [idComentario]), []);
  assert.deepEqual(await consultar(pessoa, "delete from public.comunidade_comentarios where id = $1 returning id", [idComentario]), [{ id: idComentario }]);
  await consultar(pessoa, inserirComentario, [idTopico, "Outra resposta"]);
  assert.deepEqual(await consultar(autora, "delete from public.comunidade_publicacoes where id = $1 returning id", [idTopico]), [{ id: idTopico }]);
  assert.deepEqual(await consultar(null, "select texto from public.comunidade_comentarios where publicacao_id = $1", [idTopico]), []);
  assert.deepEqual(await consultar(null, "select titulo from public.comunidade_publicacoes where id = $1", [idCriatura]), [{ titulo: "Maldição" }]);

  await consultar(terceira, `insert into public.comunidade_publicacoes(categoria,titulo,autor,resumo,texto)
    select 'topico','Exemplo ' || n,'Rei','Resumo','Texto' from generate_series(1,50) n`);
  await assert.rejects(consultar(terceira, inserir, topico), { code: "P0001", message: "comunidade_limite_publicacoes" });
  await consultar(terceira, `insert into public.comunidade_comentarios(publicacao_id,autor,texto)
    select $1,'Rei','Exemplo ' || n from generate_series(1,200) n`, [idCriatura]);
  await assert.rejects(consultar(terceira, inserirComentario, [idCriatura, "Limite"]), { code: "P0001", message: "comunidade_limite_comentarios" });
  console.log("Comunidade: migrações, quatro tipos válidos, leitura pública, edição pelo autor, comentários, exclusão e limites verificados.");
} finally {
  await db.close();
}
