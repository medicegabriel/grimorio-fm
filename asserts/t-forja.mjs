/**
 * INTERLÚDIOS DE FORJA (autor, 2026-09-11).
 *
 * Pedido: *"Coloque aqui uma aba para anotar interludios de forja, pq estou
 * precisando"*, e as decisões por pergunta: card na aba Interlúdios, **só
 * anotação** (*"Quantidade de Focos Gastas, e um lugar para anotar os Itens que
 * foram feitos. Só anotação, nada mecanico"*), gasta Foco do mesmo orçamento, e
 * vale para todo mundo nos dois sistemas.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O módulo é FOLHA (sem nenhum import), porque a aba entra cedo no builder.
 * 2. O saneamento: id do molde, Foco inteiro e nunca negativo, texto CRU.
 * 3. A soma de Focos, que é o que a aba cobra do orçamento.
 * 4. ⚠ SÓ ANOTAÇÃO: a ficha derivada não muda em NADA por causa de uma forja,
 *    nos dois sistemas. É a promessa inteira do pedido.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-forja.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. MÓDULO FOLHA                                               */
/* ============================================================ */
const fonte = readFileSync(new URL("../src/systems/afty/afty-forja.js", import.meta.url), "utf8");
t("o módulo não importa nada", /^\s*import\s/m.test(fonte), false);

/* ============================================================ */
/* 2. A LINHA E O SANEAMENTO                                     */
/* ============================================================ */
const nova = F.novaForja();
t("a linha nasce no molde", nova.id.startsWith("forj_"), true);
t("e gastando 1 Foco", nova.focos, 1);
t("com o caderno vazio", nova.itens, "");
t("duas linhas não repetem id", F.novaForja().id !== F.novaForja().id, true);

t("id de fora do molde é recusado", F.saneiaForja({ id: "armc_x" }), null);
t("lixo é recusado", [F.saneiaForja(null), F.saneiaForja("x")], [null, null]);
t("Foco em texto vira número", F.saneiaForja({ id: "forj_a", focos: "3" }).focos, 3);
t("Foco quebrado é aparado", F.saneiaForja({ id: "forj_a", focos: 2.7 }).focos, 2);
t("Foco negativo vira zero", F.saneiaForja({ id: "forj_a", focos: -2 }).focos, 0);
t("Foco inválido volta ao padrão", F.saneiaForja({ id: "forj_a", focos: "abc" }).focos, 1);
t("zero é aceito", F.saneiaForja({ id: "forj_a", focos: 0 }).focos, 0);
/* ⚠ O TEXTO É CRU: um campo que apara não deixa digitar espaço. */
t("o texto não é aparado", F.saneiaForja({ id: "forj_a", itens: "  Katana " }).itens, "  Katana ");
t("sem texto é vazio", F.saneiaForja({ id: "forj_a" }).itens, "");

/* ============================================================ */
/* 3. A LISTA E A SOMA                                           */
/* ============================================================ */
const forja = (id, focos, itens = "") => ({ id, focos, itens });
const ficha = (sistema, forjas) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10 };
  if (forjas) f.forjas = forjas;
  return f;
};

t("a ficha em branco já tem a lista", createBlankAfty().forjas, []);
t("ficha sem lista não soma", F.focosDeForja(ficha("player")), 0);
t("a lista soma os Focos",
  F.focosDeForja(ficha("player", [forja("forj_a", 2), forja("forj_b", 1)])), 3);
t("id repetido entra uma vez",
  F.focosDeForja(ficha("player", [forja("forj_a", 2), forja("forj_a", 2)])), 2);
t("linha inválida não soma",
  F.focosDeForja(ficha("player", [forja("forj_a", 2), { id: "x", focos: 5 }])), 2);
t("a lista devolve as linhas saneadas",
  F.forjasDaFicha(ficha("player", [forja("forj_a", "2", "Katana")])),
  [{ id: "forj_a", focos: 2, itens: "Katana" }]);

/* ============================================================ */
/* 4. SÓ ANOTAÇÃO: A FICHA DERIVADA NÃO SENTE                    */
/* ============================================================ */
/* ⚠ Este é o assert que carrega o pedido. A forja gasta Foco no medidor da aba,
   que é contagem de tela, e não muda stat nenhum da criatura. */
const CAMPOS = ["hp", "pe", "defesa", "cd", "iniciativa", "movimento", "focosTotais", "atencao"];
const foto = (d) => Object.fromEntries(CAMPOS.map((k) => [k, d[k]]));
for (const s of ["afty", "player"]) {
  const sem = deriveAfty(ficha(s));
  const com = deriveAfty(ficha(s, [forja("forj_a", 3, "Katana Afiada")]));
  t(`${s}: a forja não move número nenhum`, foto(com), foto(sem));
  t(`${s}: e o orçamento de Focos é o mesmo`, com.focosTotais, sem.focosTotais);
}

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
