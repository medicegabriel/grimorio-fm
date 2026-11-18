/* A LOJA VIVA DA SESSÃO (`ficha/sessao-loja.js`, Etapa 2 do Encontro Unificado e Sala, 2026-11-17).

   A Ficha lia a sessão uma vez e gravava por cima de tudo o que viesse de fora. A loja é a fonte única da sessão no aparelho. Aqui:
     1. mesma chave e mesmo aparo do `carregarSessao` (inclusive o "sem-id" e o JSON quebrado);
     2. fotografia estável: duas leituras e a própria gravação devolvem o MESMO objeto (cada objeto novo é um derive inteiro na Ficha);
     3. a edição local é uma fila: muda a tela na hora e só grava no descarregar (ou 600 ms depois);
     4. outra aba (evento `storage`): texto igual não avisa, texto outro avisa, `clear()` e chave removida;
     5. nada se perde e nada é apagado: fila pendente mais versão de fora ficam as duas, e a gravação relê a chave antes de gravar;
     6. `gravar` recusa quando há versão mais nova que a loja não viu;
     7. `aplicarRemoto` (a porta da Sala) espelha na chave, avisa e reaplica a fila;
     8. armazenamento que falha não perde a fila, e o aparo de gravação usa o derive vivo sem trocar o objeto da tela. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const disco = new Map();
let quebrado = false;
globalThis.localStorage = {
  getItem: (k) => (disco.has(k) ? disco.get(k) : null),
  setItem: (k, v) => { if (quebrado) throw new Error("cota"); disco.set(k, String(v)); },
  removeItem: (k) => disco.delete(k),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const L = await import(R + "ficha/sessao-loja.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const ficha = createBlankAfty();
const d = deriveAfty(ficha);
const chave = (id) => S.chaveDaSessao(id);
const gravado = (id) => { const c = disco.get(chave(id)); return c ? JSON.parse(c) : null; };
const semCarimbo = (s) => { const { atualizadoEm: _x, ...resto } = s ?? {}; return resto; };
/* Simula outra aba: grava no disco por fora e dispara o evento `storage` como o navegador dispararia. */
const outraAba = (id, sessao, { avisa = true } = {}) => {
  const texto = JSON.stringify({ ...sessao, atualizadoEm: Date.now() + 1 });
  disco.set(chave(id), texto);
  if (avisa) L.__aoMudarArmazenamento({ key: chave(id), newValue: texto });
  return texto;
};

/* ---------- 1. mesma chave e mesmo aparo do carregarSessao ---------- */
t("chave igual à do salvarSessao", S.chaveDaSessao("abc"), "fm_ficha_sessao_afty_v1:abc");
t("id ausente cai no sem-id", S.chaveDaSessao(null), "fm_ficha_sessao_afty_v1:sem-id");
t("sessão nova igual à do carregarSessao", L.ler("vazia", d), S.carregarSessao("vazia", d));
t("sessão nova nasce cheia", L.ler("vazia", d).hpAtual, d.hp);

S.salvarSessao("gravada", { ...S.sessaoEmBranco(d), hpAtual: 3, almaMaxVisto: d.almaMax });
t("sessão gravada igual à do carregarSessao", L.ler("gravada", d), S.carregarSessao("gravada", d));
t("o derive é função preguiçosa", L.ler("preguica", () => d).hpAtual, d.hp);

disco.set(chave("quebrada"), "{isto nao e json");
t("JSON quebrado vira sessão em branco", L.ler("quebrada", d), S.sessaoEmBranco(d));

disco.set(chave(null), JSON.stringify({ ...S.sessaoEmBranco(d), hpAtual: 7 }));
t("id ausente lê o sem-id", L.ler(null, d).hpAtual, 7);

/* ---------- 2. fotografia estável ---------- */
{
  const a = L.ler("estavel", d);
  t("duas leituras, o mesmo objeto", a === L.ler("estavel", d), true);
  const pare = L.ouvir("estavel", () => {});
  t("com ouvinte, ainda o mesmo objeto", a === L.ler("estavel", d), true);
  pare();
}

/* ---------- 3. a edição local é uma fila ---------- */
{
  const id = "fila";
  L.ler(id, d);
  let avisos = 0;
  const pare = L.ouvir(id, () => { avisos++; });
  const depois = L.atualizar(id, (s) => ({ ...s, hpAtual: s.hpAtual - 4 }));
  t("a tela muda na hora", L.ler(id).hpAtual, d.hp - 4);
  t("o ouvinte foi avisado", avisos, 1);
  t("nada gravado antes do descarregar", gravado(id), null);
  t("descarregar grava", L.descarregar(id), true);
  t("gravado com a edição", gravado(id).hpAtual, d.hp - 4);
  t("gravado com carimbo", typeof gravado(id).atualizadoEm, "number");
  t("gravar NÃO troca o objeto da tela", L.ler(id) === depois, true);
  t("gravar não avisa ninguém", avisos, 1);
  const textoAntes = disco.get(chave(id));
  t("descarregar sem fila não grava", L.descarregar(id), true);
  t("o texto gravado ficou o mesmo", disco.get(chave(id)) === textoAntes, true);
  t("edição que devolve o mesmo objeto não entra na fila", L.atualizar(id, (s) => s) === depois, true);
  t("e não avisa", avisos, 1);
  pare();
  L.atualizar(id, (s) => ({ ...s, hpAtual: 1 }));
  t("sem ouvinte, a edição ainda vale", L.ler(id).hpAtual, 1);
  t("parar de ouvir não avisa mais", avisos, 1);
  L.descarregar(id);
}

/* ---------- 4. outra aba ---------- */
{
  const id = "abas";
  const base = L.ler(id, d);
  let avisos = 0;
  const pare = L.ouvir(id, () => { avisos++; });
  L.__aoMudarArmazenamento({ key: chave(id), newValue: null });
  t("chave ausente igual a chave ausente não avisa", avisos, 0);
  t("e o objeto é o mesmo", L.ler(id) === base, true);
  const texto = outraAba(id, { ...base, peAtual: 2 });
  t("texto novo avisa", avisos, 1);
  t("e chega na tela", L.ler(id).peAtual, 2);
  const visto = L.ler(id);
  L.__aoMudarArmazenamento({ key: chave(id), newValue: texto });
  t("o mesmo texto de novo não avisa", avisos, 1);
  t("e o objeto não muda", L.ler(id) === visto, true);
  L.__aoMudarArmazenamento({ key: "outra-chave", newValue: "{}" });
  t("chave de outra coisa não avisa", avisos, 1);
  disco.delete(chave(id));
  L.__aoMudarArmazenamento({ key: chave(id), newValue: null });
  t("chave removida volta à sessão em branco", L.ler(id), S.sessaoEmBranco(d));
  t("e avisa", avisos, 2);
  disco.set(chave(id), JSON.stringify({ ...S.sessaoEmBranco(d), peAtual: 5 }));
  L.__aoMudarArmazenamento({ key: null, newValue: null });
  t("clear() relê toda chave", L.ler(id).peAtual, 5);
  t("e avisa quem mudou", avisos, 3);
  L.__aoMudarArmazenamento({ key: chave(id), newValue: disco.get(chave(id)), storageArea: { outro: true } });
  t("evento do sessionStorage é ignorado", avisos, 3);
  pare();
}

/* ---------- 5. nada se perde e nada é apagado ---------- */
{
  const id = "conflito";
  L.ler(id, d);
  const pare = L.ouvir(id, () => {});
  L.atualizar(id, (s) => ({ ...s, hpAtual: s.hpAtual - 5 }));
  outraAba(id, { ...S.sessaoEmBranco(d), peAtual: 1 });
  t("versão de fora com fila pendente: a de fora chega", L.ler(id).peAtual, 1);
  t("e a edição local continua", L.ler(id).hpAtual, d.hp - 5);
  L.descarregar(id);
  t("gravado com as duas (PE)", gravado(id).peAtual, 1);
  t("gravado com as duas (PV)", gravado(id).hpAtual, d.hp - 5);

  // A outra aba grava e o aviso ainda não chegou: a gravação relê e reaplica a fila, em vez de apagar a versão de lá.
  L.atualizar(id, (s) => ({ ...s, hpAtual: s.hpAtual - 1 }));
  outraAba(id, { ...semCarimbo(gravado(id)), almaAtual: 42 }, { avisa: false });
  L.descarregar(id);
  t("versão não vista não é apagada", gravado(id).almaAtual, 42);
  t("e a edição local vai por cima dela", gravado(id).hpAtual, d.hp - 6);
  t("a tela também ficou com as duas", [L.ler(id).almaAtual, L.ler(id).hpAtual], [42, d.hp - 6]);
  pare();
}

/* ---------- 6. gravar ---------- */
{
  const id = "gravar";
  const x = { ...L.ler(id, d), hpAtual: 9 };
  t("gravar grava", L.gravar(id, x), true);
  t("e a leitura devolve o objeto entregue", L.ler(id) === x, true);
  t("no disco", gravado(id).hpAtual, 9);
  const pare = L.ouvir(id, () => {});
  outraAba(id, { ...x, hpAtual: 2 }, { avisa: false });
  t("versão mais nova não vista: recusa", L.gravar(id, { ...x, hpAtual: 30 }), false);
  t("o disco ficou com a de lá", gravado(id).hpAtual, 2);
  t("e a tela adotou a de lá", L.ler(id).hpAtual, 2);
  pare();
}

/* ---------- 7. aplicarRemoto (a porta da Sala) ---------- */
{
  const id = "remoto";
  L.ler(id, d);
  let avisos = 0;
  const pare = L.ouvir(id, () => { avisos++; });
  L.atualizar(id, (s) => ({ ...s, peAtual: 0 }));
  const r = L.aplicarRemoto(id, { ...S.sessaoEmBranco(d), hpAtual: 11 });
  t("remoto chega na tela", r.hpAtual, 11);
  t("a fila local é reaplicada em cima", r.peAtual, 0);
  t("remoto avisa", avisos, 2);
  t("remoto é espelhado na chave", gravado(id).hpAtual, 11);
  t("o espelho não leva a fila ainda", gravado(id).peAtual, d.pe);
  L.descarregar(id);
  t("a fila grava por cima do remoto", [gravado(id).hpAtual, gravado(id).peAtual], [11, 0]);
  const lixo = L.aplicarRemoto(id, { hpAtual: "x", log: "nao e lista" });
  t("remoto passa pelo mesmo aparo", Array.isArray(lixo.log), true);
  pare();
}

/* ---------- 8. sem ninguém ouvindo, a leitura relê a chave ---------- */
{
  const id = "releitura";
  L.ler(id, d);
  S.salvarSessao(id, { ...S.sessaoEmBranco(d), hpAtual: 13 });
  t("gravação direta (criador, Mesa) aparece na próxima abertura", L.ler(id, d).hpAtual, 13);
}

/* ---------- 9. armazenamento que falha ---------- */
{
  const id = "falha";
  L.ler(id, d);
  L.atualizar(id, (s) => ({ ...s, hpAtual: 6 }));
  quebrado = true;
  t("cota estourada: descarregar devolve falso", L.descarregar(id), false);
  t("a tela continua com a edição", L.ler(id).hpAtual, 6);
  quebrado = false;
  t("o armazenamento volta: a fila grava", L.descarregar(id), true);
  t("no disco", gravado(id).hpAtual, 6);
}

/* ---------- 10. o aparo de gravação ---------- */
{
  const id = "aparo";
  L.ler(id, d);
  L.definirAparo(id, (s) => S.aparaSessao(s, d));
  const tela = L.atualizar(id, (s) => ({ ...s, hpAtual: 99999 }));
  L.descarregar(id);
  t("grava aparado pelo derive vivo", gravado(id).hpAtual, d.hp);
  t("a tela fica com o mesmo objeto", L.ler(id) === tela, true);
  L.definirAparo(id, null);
}

/* ---------- 11. reaplicar ---------- */
t("edição que quebra é descartada, e as outras seguem",
  L.reaplicar({ n: 1 }, [(s) => ({ n: s.n + 1 }), () => { throw new Error("x"); }, (s) => ({ n: s.n * 10 })]),
  { n: 20 });

/* ---------- 12. o caminho da Ficha: atualiza com aparo nos dois sentidos ---------- */
{
  const id = "ficha";
  L.ler(id, () => d);
  const atualiza = (fn) => L.atualizar(id, (s) => S.aparaSessao(fn(S.aparaSessao(s, d)), d));
  atualiza((s) => S.aplicaDano(s, 3, d));
  atualiza((s) => S.aplicaDano(s, 2, d));
  t("duas edições seguidas somam", L.ler(id).hpAtual, d.hp - 5);
  outraAba(id, { ...S.sessaoEmBranco(d), hpAtual: d.hp - 1 });
  t("dano local reaplicado sobre a Vida de fora", L.ler(id).hpAtual, d.hp - 6);
}

/* ---------- 13. a gravação sai sozinha 600 ms depois ---------- */
{
  const id = "atraso";
  L.ler(id, d);
  L.atualizar(id, (s) => ({ ...s, hpAtual: 4 }));
  await espera(300);
  t("antes dos 600 ms, nada gravado", gravado(id), null);
  L.atualizar(id, (s) => ({ ...s, hpAtual: 5 }));
  await espera(400);
  t("a edição nova reinicia a espera", gravado(id), null);
  await espera(400);
  t("depois da espera, gravado", gravado(id)?.hpAtual, 5);
}

L.__reiniciarLoja();

if (bad.length) {
  console.log(`FALHARAM ${bad.length} de ${ok + bad.length} ASSERTS`);
  for (const b of bad) console.log("  - " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
