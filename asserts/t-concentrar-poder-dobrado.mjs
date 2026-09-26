/* O ADDON `concentrar-poder-dobrado` (2026-09-26).

   Pedido do autor: *"faça um addon que O usuário consegue aplica o dobro dos
   bônus concedido pela melhoria apogeu: concentrar poder"*. O Concentrar Poder
   é a Habilidade de Controlador 6° liberada pelo Apogeu · Controle Concentrado,
   e dá à invocação MARCADA uma tabela de PV, Defesa, TR, níveis de dano e cura
   e bônus somado ao total, por degrau de Controlador.

   O pacote não tem verbo novo: é um Funcionamento do pacote com as MESMAS sete
   linhas da tabela do raw (`CONTROLADOR_EFEITOS_INVOCACAO.ctr_concentrar_poder`),
   escritas com `escopo: "invocacao"` e o mesmo `quando: "marc_concentrar_poder"`.
   Somadas à linha do raw, dão o dobro. Este arquivo prende:

     1. O pacote valida, e cada linha é de invocação.
     2. ⚠ PARCELA CONTRA PARCELA: em cada canal, o "Concentrar Poder Dobrado"
        vale exatamente o "Concentrar Poder", nos degraus 6, 12 e 18 e nos dois
        sistemas. Se a tabela do raw mudar, este assert acusa o addon velho.
     3. Os totais em dobro batem com a tabela do livro vezes dois.
     4. Não vaza: sem a marca, sem a Habilidade (marca antiga) ou sem o addon,
        nada muda.
     5. O hover fecha: as fontes do PV e da Defesa somam o número. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const INV = await import(R + "afty-invocacoes.js");
const H = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const bruto = JSON.parse(readFileSync(new URL("../addons/concentrar-poder-dobrado.json", import.meta.url), "utf8"));
const pacote = AD.normalizarPacote(bruto);
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("autoria e sistema-alvo", [bruto.autor, bruto.paraRaw], ["Templas", "afty"]);
const linhas = bruto.funcionamentos[0].efeitos;
t("um Funcionamento com as sete linhas, todas de invocação",
  [bruto.funcionamentos.length, linhas.length, linhas.every((e) => e.escopo === "invocacao")], [1, 7, true]);
/* As mesmas linhas do raw, canal a canal, fórmula a fórmula e condição a
   condição. É o que faz "o dobro" ser verdade em qualquer nível. */
const doRaw = H.CONTROLADOR_EFEITOS_INVOCACAO.ctr_concentrar_poder;
t("as linhas copiam o raw (canal, fórmula e condição)",
  linhas.map((e) => [e.canal, e.expr, e.quando]), doRaw.map((e) => [e.canal, e.expr, e.quando]));
AD.aplicarAddons([pacote]);

/* ============================================================ */
/* A FICHA DE PROVA                                              */
/* ============================================================ */
/* Um Controlador com o Apogeu · Controle Concentrado e o Concentrar Poder, e
   uma invocação com um ataque, para o dano ter onde aparecer. */
const ficha = (nivel, { sistema = "player", addon = false, marcada = true, habilidade = true } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "controlador", nivel }];
  f.habilidades = habilidade ? ["ctr_apogeu", "ctr_concentrar_poder"] : ["ctr_apogeu"];
  f.escolhasHabilidade = { ctr_apogeu: ["ctr_controle_concentrado"] };
  const inv = INV.createBlankInvocacao("especial", "tecnica");
  inv.id = "inv-prova";
  inv.nome = "Orochi";
  const golpe = INV.createBlankAcao();
  golpe.id = "golpe";
  golpe.nome = "Mordida";
  golpe.familia = "ataque";
  inv.acoes = [golpe];
  if (marcada) inv.marcadores = { concentrar_poder: true };
  f.invocacoes = [inv];
  if (addon) f.addons = [pacote];
  return f;
};
const invDe = (f) => deriveAfty(f).invocacoes.lista.find((x) => x.id === "inv-prova");
const CANAIS = ["pv", "defesa", "bonusTR", "danoNivel", "curaNivel", "danoBonus", "curaBonus"];
/* O total de cada canal que vem das Habilidades de Controlador e das linhas
   escritas, como a própria invocação o soma. */
const totais = (i) => Object.fromEntries(CANAIS.map((c) => [c, i.efeitosHabilidade[c]]));
const parcela = (i, nome) => Object.fromEntries(CANAIS.map((c) => [
  c, i.efeitosHabilidade.detalhes.filter((d) => d.nome === nome && d.canal === c)
    .reduce((s, d) => s + d.valor, 0),
]));
const tr = (i) => i.testes.resistencias.find((r) => (r.value ?? r.id) === "fortitude").bonus;
const menos = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] - b[k]]));

/* ============================================================ */
/* 2. PARCELA CONTRA PARCELA, E 3. OS TOTAIS DO LIVRO EM DOBRO   */
/* ============================================================ */
/* A tabela do livro vezes dois, degrau a degrau: PV, Defesa, TR, níveis de dano
   e de cura, e o bônus somado ao total de dano e de cura. */
const EM_DOBRO = {
  6: { pv: 20, defesa: 4, bonusTR: 4, danoNivel: 4, curaNivel: 4, danoBonus: 6, curaBonus: 6 },
  12: { pv: 40, defesa: 6, bonusTR: 6, danoNivel: 6, curaNivel: 6, danoBonus: 10, curaBonus: 10 },
  18: { pv: 60, defesa: 10, bonusTR: 10, danoNivel: 10, curaNivel: 10, danoBonus: 20, curaBonus: 20 },
};
for (const sistema of ["player", "afty"]) {
  for (const nivel of [6, 12, 18]) {
    const sem = invDe(ficha(nivel, { sistema, marcada: false }));
    const soLivro = invDe(ficha(nivel, { sistema }));
    const dobro = invDe(ficha(nivel, { sistema, addon: true }));
    t(`${sistema} ${nivel}: a parcela do addon vale a do livro em cada canal`,
      parcela(dobro, "Concentrar Poder Dobrado"), parcela(dobro, "Concentrar Poder"));
    t(`${sistema} ${nivel}: o total dobra a tabela do livro`,
      menos(totais(dobro), totais(sem)), EM_DOBRO[nivel]);
    t(`${sistema} ${nivel}: PV, Defesa, TR e o bônus do ataque sobem o dobro`, [
      dobro.pv - sem.pv, dobro.defesa - sem.defesa, tr(dobro) - tr(sem),
      dobro.acoes[0].dano.bonus - sem.acoes[0].dano.bonus,
    ], [
      2 * (soLivro.pv - sem.pv), 2 * (soLivro.defesa - sem.defesa), 2 * (tr(soLivro) - tr(sem)),
      2 * (soLivro.acoes[0].dano.bonus - sem.acoes[0].dano.bonus),
    ]);
  }
}

/* ============================================================ */
/* 4. NÃO VAZA                                                   */
/* ============================================================ */
{
  const sem = invDe(ficha(12, { marcada: false }));
  const semMarca = invDe(ficha(12, { addon: true, marcada: false }));
  t("sem a marca, o addon não muda nada", [semMarca.pv, semMarca.defesa, totais(semMarca)],
    [sem.pv, sem.defesa, totais(sem)]);
  /* A marca gravada de quando a ficha ainda tinha a Habilidade: o marcador só
     existe com a dona, então a variável não liga e a linha não entra. */
  const marcaAntiga = invDe(ficha(12, { addon: true, habilidade: false }));
  t("sem a Habilidade, a marca antiga não liga o addon", [marcaAntiga.pv, marcaAntiga.defesa, totais(marcaAntiga)],
    [sem.pv, sem.defesa, totais(sem)]);
  const semAddon = invDe(ficha(12));
  t("sem o addon, nenhuma parcela Dobrada aparece",
    semAddon.efeitosHabilidade.detalhes.some((d) => d.nome === "Concentrar Poder Dobrado"), false);
}

/* ============================================================ */
/* 5. O HOVER FECHA                                              */
/* ============================================================ */
{
  const i = invDe(ficha(18, { addon: true }));
  const soma = (l) => (l || []).reduce((n, p) => n + (Number(p.valor) || 0), 0);
  t("as fontes do PV somam o PV e nomeiam o addon",
    [soma(i.fontes.pv), i.fontes.pv.some((p) => p.label === "Concentrar Poder Dobrado")], [i.pv, true]);
  t("as fontes da Defesa somam a Defesa e nomeiam o addon",
    [soma(i.fontes.defesa), i.fontes.defesa.some((p) => p.label === "Concentrar Poder Dobrado")], [i.defesa, true]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
