/* A mesclagem da nuvem (src/nuvem/nuvem-sync.js), 2026-11-16.

   É a parte que pode perder ficha, então cada regra de conflito tem um caso:
   ficha nova de outro aparelho entra, ficha apagada lá sai, ficha apagada AQUI
   não volta, a mais nova vence, e o primeiro login de um aparelho une as listas
   em vez de jogar a local fora. Também confere quais chaves viajam. */

import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const N = new URL("../src/nuvem/", import.meta.url).href;
const C = await import(N + "nuvem-config.js");
const { _mesclar: mesclar } = await import(N + "nuvem-sync.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const K = "fm_creatures_player_v1";
const f = (id, quando, extra = {}) => ({ id, updatedAt: quando, ...extra });
const linha = (id, dados, extra = {}) => ({ chave: K, id, dados, apagado: false, atualizado_em: "2026-11-10T00:00:00Z", ...extra });
const ids = (r) => JSON.parse(r.gravar[K] ?? "null")?.map((x) => x.id) ?? null;

// Quais chaves viajam.
t("criatura viaja", C.chaveDaPessoa("fm_creatures_v1"), true);
t("encontro do afty viaja", C.chaveDaPessoa("afty_encontros_v1"), true);
t("erro fica", C.chaveDaPessoa("fm_last_error_v1"), false);
t("medidor fica", C.chaveDaPessoa("fm_storage_limit_v1"), false);
t("vista fica", C.chaveDaPessoa("fm_dashboard_view_player_v1"), false);
t("sessao do supabase fica", C.chaveDaPessoa("sb-abc-auth-token"), false);
t("retrato fica", C.chaveDaPessoa("nuvem_estado_v1"), false);
t("inventario e de fichas", C.ehChaveDeFichas("fm_creatures_eradeouro_v1"), true);
t("meta nao e de fichas", C.ehChaveDeFichas("fm_creatures_meta_v1"), false);
t("sem env a nuvem dorme", C.nuvemAtiva, false);

// Primeiro login do aparelho: a local e a da nuvem se unem.
{
  const local = { [K]: JSON.stringify([f("a", "2026-11-01")]) };
  const r = mesclar(local, [linha("b", f("b", "2026-11-02"))], [], null);
  t("primeiro login une", ids(r), ["a", "b"]);
  t("retrato tem a da nuvem", Object.keys(r.retrato.fichas[K]), ["b"]);
}

// A mais nova vence nos dois sentidos.
{
  const local = { [K]: JSON.stringify([f("a", "2026-11-05", { nome: "local" })]) };
  const r1 = mesclar(local, [linha("a", f("a", "2026-11-06", { nome: "nuvem" }))], [], null);
  t("nuvem mais nova vence", JSON.parse(r1.gravar[K])[0].nome, "nuvem");
  const r2 = mesclar(local, [linha("a", f("a", "2026-11-04", { nome: "nuvem" }))], [], null);
  t("local mais nova fica", r2.gravar[K], undefined);
}

// Apagada em outro aparelho sai, salvo se editada aqui depois.
{
  const local = { [K]: JSON.stringify([f("a", "2026-11-01"), f("b", "2026-11-20")]) };
  const linhas = [
    linha("a", null, { apagado: true, atualizado_em: "2026-11-10T00:00:00Z" }),
    linha("b", null, { apagado: true, atualizado_em: "2026-11-10T00:00:00Z" }),
  ];
  t("apagada la sai, editada depois fica", ids(mesclar(local, linhas, [], null)), ["b"]);
}

// Apagada AQUI depois do último envio não volta.
{
  const retratoAntigo = { usuario: "u", fichas: { [K]: { a: "x", b: "y" } }, chaves: {} };
  const local = { [K]: JSON.stringify([f("a", "2026-11-01")]) };
  const r = mesclar(local, [linha("a", f("a", "2026-11-01")), linha("b", f("b", "2026-11-01"))], [], retratoAntigo);
  t("apagada aqui nao volta", r.gravar[K], undefined);
}

// Chaves inteiras.
{
  const antes = mesclar({ fm_x_v1: "1" }, [], [{ chave: "fm_x_v1", valor: "1" }], null).retrato;
  const retratoAntigo = { usuario: "u", ...antes };
  const r1 = mesclar({ fm_x_v1: "1" }, [], [{ chave: "fm_x_v1", valor: "2" }], retratoAntigo);
  t("chave parada aqui recebe a da nuvem", r1.gravar.fm_x_v1, "2");
  const r2 = mesclar({ fm_x_v1: "3" }, [], [{ chave: "fm_x_v1", valor: "2" }], retratoAntigo);
  t("chave mexida aqui fica", r2.gravar.fm_x_v1, undefined);
  const r3 = mesclar({}, [], [{ chave: "fm_y_v1", valor: "9" }], null);
  t("chave so da nuvem entra", r3.gravar.fm_y_v1, "9");
  const lista = (xs) => JSON.stringify(xs.map((id) => ({ id })));
  const r4 = mesclar({ afty_encontros_v1: lista(["e1"]) }, [], [{ chave: "afty_encontros_v1", valor: lista(["e2"]) }], null);
  t("lista com id une no primeiro login", JSON.parse(r4.gravar.afty_encontros_v1).map((x) => x.id), ["e1", "e2"]);
}

// Lista vazia gravada por uma visita não joga fora a lista da nuvem.
{
  const lista = (xs) => JSON.stringify(xs.map((id) => ({ id })));
  const r = mesclar({ afty_encontros_v1: "[]" }, [], [{ chave: "afty_encontros_v1", valor: lista(["e1", "e2"]) }], null);
  t("lista vazia recebe a da nuvem", JSON.parse(r.gravar.afty_encontros_v1).map((x) => x.id), ["e1", "e2"]);
  const r2 = mesclar({ [K]: "[]" }, [linha("a", f("a", "2026-11-01"))], [], null);
  t("inventario vazio recebe a ficha", ids(r2), ["a"]);
}

// Com conta já ligada, lista mexida aqui fica como está (não ressuscita apagado).
{
  const lista = (xs) => JSON.stringify(xs.map((id) => ({ id })));
  const antes = mesclar({}, [], [{ chave: "afty_encontros_v1", valor: lista(["e1", "e2"]) }], null).retrato;
  const r = mesclar({ afty_encontros_v1: lista(["e1"]) }, [], [{ chave: "afty_encontros_v1", valor: lista(["e1", "e2", "e3"]) }], { usuario: "u", cursor: "x", ...antes });
  t("lista mexida aqui fica", r.gravar.afty_encontros_v1, undefined);
}

// Leitura incremental: o que não veio continua no retrato.
{
  const retratoAntigo = { usuario: "u", cursor: "2026-11-10T00:00:00Z", fichas: { [K]: { a: "h1" } }, chaves: { fm_x_v1: "h2" } };
  const local = { [K]: JSON.stringify([f("a", "2026-11-01")]) };
  const r = mesclar(local, [linha("b", f("b", "2026-11-11"))], [], retratoAntigo);
  t("incremental acrescenta a nova", ids(r), ["a", "b"]);
  t("incremental conserva o retrato", Object.keys(r.retrato.fichas[K]).sort(), ["a", "b"]);
  t("incremental conserva as chaves", r.retrato.chaves.fm_x_v1, "h2");
  const r2 = mesclar(local, [linha("a", null, { apagado: true, atualizado_em: "2026-11-11T00:00:00Z" })], [], retratoAntigo);
  t("incremental apaga", ids(r2), []);
  t("incremental tira do retrato", Object.keys(r2.retrato.fichas[K]), []);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
