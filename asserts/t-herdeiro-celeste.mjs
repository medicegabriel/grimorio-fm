/* ORIGEM HERDEIRO CELESTE (addon, 2026-10-09) E O CANAL `voo`.

   A origem pedida pelo autor, lida de `addons/herdeiro-celeste.json`, o mesmo
   texto que se cola no Instalar:
     • Bônus em Atributo: 3 pontos, até 2 no mesmo atributo;
     • Filho Abençoado: RD geral igual ao Bônus de Treinamento;
     • Passos Celeste: Deslocamento de Voo de 1,5 metro vezes o BT.

   O voo pediu canal novo no Motor (`voo`). Ele só existe com fonte, passa pelo
   multiplicador e pelas condições do movimento (Lento: "Toda forma de
   movimento") e o Caído o zera ("Um personagem caído que esteja voando
   imediatamente perde seu deslocamento de voo"). Vale nos dois sistemas. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const EFE = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O CANAL E O PACOTE                                         */
/* ============================================================ */
t("o canal voo existe no catálogo", !!EFE.getCanal("voo"), true);
t("e mora no grupo do movimento", EFE.EFEITO_CANAL_GRUPOS.find((g) => g.itens.some((c) => c.id === "voo"))?.label, "Movimento e Percepção");

const CRU = JSON.parse(readFileSync(new URL("../addons/herdeiro-celeste.json", import.meta.url), "utf8"));
t("o pacote valida sem problema nenhum", A.validarPacote(CRU), []);
t("autor e sistema-alvo", [CRU.autor, CRU.paraRaw], ["Templas", "afty"]);
const pacote = A.normalizarPacote(CRU);
A.aplicarAddons([pacote]);
const ID = "herdeiro-celeste:herdeiro_celeste";
const origem = O.getOrigem(ID);
t("a origem existe, com o namespace", origem?.nome, "Herdeiro Celeste");
t("as três características, na ordem da carta",
  origem?.caracteristicas?.map((c) => c.nome), ["Bônus em Atributo", "Filho Abençoado", "Passos Celeste"]);
t("o bônus distribuível", origem?.caracteristicas?.[0]?.bonus, { distribuir: 3, maxPorAtributo: 2 });
t("não é variação: conjura como as origens com Técnica", origem?.variacaoDe ?? null, null);

/* ============================================================ */
/* 2. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const C = (nome) => ({ id: `c_${nome}`, nome });
for (const sistema of ["afty", "player"]) {
  for (const nd of [5, 17]) {
    const ficha = ({ origemId = ID, efeitos = [] } = {}) => {
      const c = createBlankAfty();
      c.rulesVersion = sistema;
      c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum", origem: { id: origemId } };
      c.core.tecnicaEfeitos = efeitos;
      c.addons = [pacote];
      return c;
    };
    const tag = (s) => `${sistema} ND ${nd}: ${s}`;
    const d = deriveAfty(ficha());
    const bt = d.maestria;
    t(tag("o BT é o da tabela"), bt, maestria(nd));
    const linhaRd = d.efeitos.detalhes.filter((x) => x.canal === "rdGeral" && x.nome === "Filho Abençoado");
    t(tag("Filho Abençoado dá RD geral igual ao BT"), linhaRd.map((x) => x.valor), [bt]);
    const inato = deriveAfty(ficha({ origemId: "inato" }));
    t(tag("a RD geral sobe o BT contra o Inato"), d.rdGeral - inato.rdGeral, bt);
    t(tag("Passos Celeste: voo de 1,5 × BT"), d.voo, 1.5 * bt);
    t(tag("com a fonte no hover"), d.partes.voo.map((p) => [p.label, p.valor]), [["Passos Celeste", 1.5 * bt]]);
    t(tag("quem não voa tem voo zero e hover vazio"), [inato.voo, inato.partes.voo], [0, []]);
    t(tag("o movimento não muda"), d.movimento, inato.movimento);

    // As condições do movimento valem no voo.
    const com = (lista) => deriveAfty(ficha(), { condicoes: lista.map(C) }).voo;
    const metade = Math.floor((1.5 * bt) / 2 / 1.5 + 1e-9) * 1.5;
    t(tag("Lento: metade, no quadrado de 1,5"), com(["Lento"]), metade);
    t(tag("Caído zera o voo"), com(["Caído"]), 0);
    t(tag("e só o voo: o movimento vai a 4,5"), deriveAfty(ficha(), { condicoes: [C("Caído")] }).movimento, Math.min(inato.movimento, 4.5));
    t(tag("Imóvel zera"), com(["Imóvel"]), 0);
    t(tag("Sofrendo tira 3"), com(["Sofrendo"]), Math.max(0, 1.5 * bt - 3));
    t(tag("vale a mais severa"), com(["Lento", "Caído"]), 0);

    // O multiplicador do movimento (a Expansão usa 2) vale no voo.
    const dobrado = deriveAfty(ficha({ efeitos: [{ canal: "movimentoMult", expr: "2" }] }));
    t(tag("o multiplicador dobra o voo"), dobrado.voo, 3 * bt);
    // Outra fonte de voo soma.
    const mais = deriveAfty(ficha({ efeitos: [{ canal: "voo", expr: "3" }] }));
    t(tag("outra fonte de voo soma"), mais.voo, 1.5 * bt + 3);
  }
}

A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
