/* TITÃ (COLOSSO) — GRIMÓRIO AFTY (2026-09-22).

   Regra do livro, exemplo Mechamaru Supremo: um inimigo Colossal dobra a Vida
   Máxima e divide o dobro entre os membros do corpo (5 por padrão), exceto a
   Cabeça, que fica com o dobro inteiro. `afty-tita.js` calcula os números,
   `ficha-sessao.js` guarda a vida CORRENTE de cada parte (mesma divisão do
   resto do sistema: motor calcula, sessão guarda estado de mesa). */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage = {
  getItem: () => null, setItem: () => {}, removeItem: () => {},
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const TITA = await import(R + "afty-tita.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O ADDON E A PRIMITIVA                                      */
/* ============================================================ */
const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/tita.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("o pacote so abre a tela: permite a primitiva titaColosso", pacote.permite, ["titaColosso"]);
t("a primitiva existe no catalogo", AD.PRIMITIVAS.some((p) => p.id === "titaColosso"), true);
t("o texto do livro chega na descricao do pacote",
  pacote.descricao.includes("Mechamaru Supremo")
    && pacote.descricao.includes("20 metros de altura")
    && pacote.descricao.includes("só é morto quando sua cabeça chegar a 0 de vida"), true);
AD.aplicarAddons([pacote]);

/* ============================================================ */
/* 2. OS NÚMEROS (afty-tita.js)                                  */
/* ============================================================ */
t("Titã em branco nasce desligado, com 5 membros", TITA.createBlankTita(), { ativo: false, membros: 5 });
t("ficha sem o campo normaliza igual ao em branco", TITA.titaDaFicha({}), TITA.createBlankTita());
t("membros invalido cai em 5", TITA.titaDaFicha({ tita: { ativo: true, membros: 0 } }).membros, 5);
t("nomes padrao dos 5 membros",
  Array.from({ length: 5 }, (_, i) => TITA.nomeDoMembroTita(i, 5)),
  ["Braço Esquerdo", "Braço Direito", "Perna Esquerda", "Perna Direita", "Torso"]);
t("contagem diferente de 5 usa rotulo generico",
  Array.from({ length: 3 }, (_, i) => TITA.nomeDoMembroTita(i, 3)),
  ["Membro 1", "Membro 2", "Membro 3"]);

t("desligado nao calcula nada", TITA.resolveTita({}, 400),
  { ativo: false, membros: 5, dobro: 0, cabecaMax: 0, membroMax: 0, nomes: [] });
const r5 = TITA.resolveTita({ tita: { ativo: true, membros: 5 } }, 400);
t("ligado: dobro e o hpCheio vezes 2", r5.dobro, 800);
t("a Cabeca fica com o dobro inteiro", r5.cabecaMax, 800);
t("cada Membro fica com o dobro dividido pela contagem (5)", r5.membroMax, 160);
const r3 = TITA.resolveTita({ tita: { ativo: true, membros: 3 } }, 100);
t("com 3 membros e hpCheio 100: dobro 200, cada membro 66 (piso)", [r3.dobro, r3.membroMax], [200, 66]);

/* ============================================================ */
/* 3. INTEGRAÇÃO COM O DERIVE                                    */
/* ============================================================ */
const ficha = ({ ativo = true, membros = 5 } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 10, tipo: "combatente", patamar: "comum" };
  c.addons = [pacote];
  c.tita = { ativo, membros };
  return c;
};
const semAddon = () => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 10, tipo: "combatente", patamar: "comum" };
  c.tita = { ativo: true, membros: 5 };
  return c;
};

t("a ficha nasce com Titã desligado", createBlankAfty().tita, { ativo: false, membros: 5 });
const dOff = deriveAfty(ficha({ ativo: false }));
t("desligado: derived.titaColosso.ativo false", dOff.titaColosso.ativo, false);
const dOn = deriveAfty(ficha({ ativo: true }));
t("ligado: derived.titaColosso.ativo true", dOn.titaColosso.ativo, true);
t("o dobro bate com a Vida Maxima da propria ficha (hp, sem Dano na Alma)",
  dOn.titaColosso.dobro, dOn.hp * 2);
t("a Cabeca guarda o dobro inteiro", dOn.titaColosso.cabecaMax, dOn.hp * 2);
t("cada um dos 5 membros recebe o dobro dividido", dOn.titaColosso.membroMax, Math.floor((dOn.hp * 2) / 5));
t("os 5 nomes padrao aparecem, na ordem do livro",
  dOn.titaColosso.nomes,
  ["Braço Esquerdo", "Braço Direito", "Perna Esquerda", "Perna Direita", "Torso"]);

/* Sem o addon (sem a primitiva), o CAMPO da ficha ainda calcula: `permite` é
   TELA, não regra (ver o cabecalho de LIBERACOES em afty-addons.js). */
const dSemAddon = deriveAfty(semAddon());
t("sem o addon o numero calcula igual, so a tela e que muda", dSemAddon.titaColosso.ativo, true);

/* ============================================================ */
/* 4. A SESSÃO: VIDA CORRENTE POR PARTE                          */
/* ============================================================ */
const titaColosso = dOn.titaColosso;
t("sessao em branco nasce cheia (null = cheio)", S.sessaoEmBranco().tita, { cabeca: null, membros: [] });

/* --- Cabeça --- */
let s = S.normalizaSessao({}, dOn);
t("normaliza sessao vazia: cabeca cheia, membros do tamanho de hoje",
  [s.tita.cabeca, s.tita.membros.length], [null, 5]);
s = S.aplicaDanoTitaCabeca(s, 50, titaColosso.cabecaMax);
t("dano na cabeca desconta do cheio", s.tita.cabeca, titaColosso.cabecaMax - 50);
s = S.aplicaCuraTitaCabeca(s, 10, titaColosso.cabecaMax);
t("cura na cabeca soma, sem passar do maximo", s.tita.cabeca, titaColosso.cabecaMax - 40);
s = S.aplicaCuraTitaCabeca(s, 999, titaColosso.cabecaMax);
t("cura nao passa do maximo", s.tita.cabeca, titaColosso.cabecaMax);
s = S.aplicaDanoTitaCabeca(s, 999999, titaColosso.cabecaMax);
t("dano na cabeca tem piso 0 (morte do Colosso e regra de mesa)", s.tita.cabeca, 0);
s = S.defineVitalTitaCabeca(s, 30, titaColosso.cabecaMax);
t("o campo da barra escreve direto, entre 0 e o maximo", s.tita.cabeca, 30);

/* --- Membros --- */
s = S.normalizaSessao({}, dOn);
s = S.aplicaDanoTitaMembro(s, 0, titaColosso.membroMax, titaColosso.membroMax);
t("dano no membro 0 zera ele (dano igual ao maximo)", s.tita.membros[0], 0);
t("os outros membros continuam cheios (null)", s.tita.membros.slice(1), [null, null, null, null]);
t("o membro a 0 fica desabilitado (a UI le atual === 0)", s.tita.membros[0] === 0, true);
s = S.aplicaCuraTitaMembro(s, 0, titaColosso.membroMax, titaColosso.membroMax);
t("regenerar cura o membro (a condicao de regenerar e de mesa)", s.tita.membros[0], titaColosso.membroMax);
s = S.aplicaDanoTitaMembro(s, 2, 20, titaColosso.membroMax);
s = S.defineVitalTitaMembro(s, 2, 5, titaColosso.membroMax);
t("o campo da barra escreve direto no membro certo", s.tita.membros[2], 5);
t("e nao mexe nos outros", [s.tita.membros[0], s.tita.membros[1]], [titaColosso.membroMax, null]);

/* --- Apara contra o maximo de hoje, e reage a mudar a contagem --- */
s = { ...S.normalizaSessao(null, dOn), tita: { cabeca: titaColosso.cabecaMax - 5, membros: [titaColosso.membroMax - 3, null, 0, null, null] } };
const dMenor = deriveAfty(ficha({ ativo: true, membros: 3 }));
const aparado = S.aparaSessao(s, dMenor);
t("a contagem de membros encolhe junto com a ficha", aparado.tita.membros.length, 3);
t("o que sobrou do corte foi descartado, o resto continua", aparado.tita.membros[2], 0);
const dMaior = deriveAfty(ficha({ ativo: true, membros: 7 }));
const esticado = S.aparaSessao(s, dMaior);
t("a contagem de membros estica junto, o novo nasce cheio", [esticado.tita.membros.length, esticado.tita.membros[5]], [7, null]);
t("o descanso enche o Titã de novo", S.descansar(s, dOn).tita, { cabeca: null, membros: [] });

/* Titã desligado: `aparaSessao` não mexe (nada a apara). */
const sOff = { ...S.normalizaSessao(null, dOn), tita: { cabeca: 3, membros: [1, 2] } };
t("Titã desligado: apararSessao nao toca no campo", S.aparaSessao(sOff, dOff).tita, sOff.tita);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
