/**
 * A RD DO ESCUDO É GERAL NA CRIATURA E FÍSICA NO JOGADOR — 2026-08-31
 *
 * O livro escreve "RD FÍSICO" na tabela de grau do escudo e "contra dano físico"
 * no encantamento Reforçado. Em 2026-08-01 o autor mandou o contrário para a
 * criatura (*"RD Geral, exceto Alma"*), e na mesma decisão o encantamento
 * Isolante de escudo foi REMOVIDO, porque ele estende a RD do escudo a um tipo
 * elemental e a RD Geral já cobre todo tipo menos alma: ele não tinha o que
 * estender.
 *
 * Em 2026-08-31 o autor separou os dois sistemas: *"1 e 2 no Livro de Jogador é
 * RD Físico. 3. Volte o encantamento Isolante, somente para Jogador."*
 *
 * ⚠ O PEDIDO 3 É O QUE PROVA O ALCANCE DO 1 E DO 2. Pedir o Isolante de volta só
 * faz sentido se a RD do escudo no jogador NÃO for Geral, e isso inclui a RD
 * BASE (a coluna 2/2/4/6), que o autor não citou nominalmente: se ela fosse
 * Geral, o Isolante continuaria sem função lá. As três parcelas andam juntas.
 *
 * O que este arquivo prende:
 *   1. as três parcelas caem na pilha certa, em cada sistema,
 *   2. e SÓ numa delas: nada de um escudo somar nos dois,
 *   3. o Isolante existe de um lado e não do outro,
 *   4. e o hover fecha a conta na pilha que recebeu.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Escudo Pesado: RD base 6. Grau Especial: +5, dando 11.
   ⚠ COM O REFORÇADO O TOTAL É 12, E NÃO 13. Encantamento COMPRADO desce um grau
   de cálculo (o Especial vira Primeiro, RD 4), então a conta é 6 + 4 + 2. É a
   regra de sempre do item, e ela não tem nada a ver com esta divergência: o
   número é o mesmo nos dois sistemas, só muda a pilha em que ele cai. */
const ficha = (sistema, { grau = null, reforcado = false } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.equipamentos = {
    itens: [{
      uid: "e1", refId: "esc_pesado", tipo: "escudo", qtd: 1, equipado: true,
      ...(grau ? { fa: { grau, encantamentos: reforcado ? ["enc_esc_reforcado"] : [] } } : {}),
    }],
  };
  return deriveAfty(f);
};
/* A mesma ficha SEM escudo, para medir só o que o escudo acrescenta. A base da
   RD Geral por Tipo existe na criatura e não no jogador (divergência `rdBase`),
   então comparar valores absolutos entre os dois não diria nada. */
const semEscudo = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  return deriveAfty(f);
};

/* ============================================================ */
/* 1. AS TRÊS PARCELAS, UMA A UMA, NOS DOIS SISTEMAS             */
/* ============================================================ */
const CASOS = [
  ["a RD base do escudo", {}, 6],
  ["mais o grau da Ferramenta", { grau: "especial" }, 11],
  ["mais o Reforçado", { grau: "especial", reforcado: true }, 12],
];
for (const [nome, op, esperado] of CASOS) {
  const base = semEscudo("afty");
  const d = ficha("afty", op);
  t(`criatura: ${nome} soma na RD Geral`, d.rdGeral - base.rdGeral, esperado);
  t(`criatura: ${nome} NÃO soma na Física`, d.rdFisico - base.rdFisico, 0);

  const baseP = semEscudo("player");
  const p = ficha("player", op);
  t(`jogador: ${nome} soma na RD Física`, p.rdFisico - baseP.rdFisico, esperado);
  t(`jogador: ${nome} NÃO soma na Geral`, p.rdGeral - baseP.rdGeral, 0);
}

/* ⚠ E NUNCA NAS DUAS. Uma parcela que caísse nas duas pilhas dobraria a RD do
   escudo sem sintoma nenhum: os dois números continuariam "plausíveis". */
for (const sis of ["afty", "player"]) {
  const base = semEscudo(sis);
  const d = ficha(sis, { grau: "especial", reforcado: true });
  t(`${sis}: o escudo entra numa pilha só`,
    (d.rdGeral - base.rdGeral) + (d.rdFisico - base.rdFisico), 12);
}

/* ============================================================ */
/* 2. O ISOLANTE VOLTOU, E SÓ NO JOGADOR                         */
/* ============================================================ */
const listaDe = (sis) => EQ.encantamentosDe("escudo", sis).map((e) => e.id);
t("a criatura não oferece o Isolante de escudo", listaDe("afty").includes("enc_esc_isolante"), false);
t("o jogador oferece", listaDe("player").includes("enc_esc_isolante"), true);
t("e é a ÚNICA diferença entre as duas listas",
  listaDe("player").filter((id) => !listaDe("afty").includes(id)), ["enc_esc_isolante"]);
t("nenhum encantamento some do jogador",
  listaDe("afty").filter((id) => !listaDe("player").includes(id)), []);

/* O texto é o do livro, e ele é a razão de o encantamento ser do jogador: a RD
   Geral da criatura já cobre todo tipo menos alma, e não sobra o que estender. */
t("o texto do Isolante é o do livro",
  EQ.getEncantamento("enc_esc_isolante").descricao,
  "A redução de dano do escudo passa também a ser aplicado a um tipo de dano elemental à sua escolha. Esta propriedade pode ser pega diversas vezes para tipos de dano diferentes.");

/* ⚠ SEM `efeitos`, e é o estado consistente. Não existe canal de RD por TIPO de
   dano no motor, e os dois irmãos dele no uniforme estão na mesma situação. Se
   alguém ligar um dos três, tem de ligar os outros dois: este assert avisa. */
const SEM_CANAL_POR_TIPO = ["enc_esc_isolante", "enc_unif_isolante", "enc_unif_resiliente"];
t("os três que precisam de RD por tipo seguem sem efeito",
  SEM_CANAL_POR_TIPO.filter((id) => EQ.getEncantamento(id)?.efeitos), []);

/* ============================================================ */
/* 3. O CANAL, E O ENCANTAMENTO QUE O SEGUE                      */
/* ============================================================ */
t("o canal do escudo por sistema",
  ["afty", "player"].map((s) => EQ.canalRdEscudo(s)), ["rdGeral", "rdFisico"]);

/* ⚠ O Reforçado declara o PSEUDO-CANAL `rdEscudo`, e não um canal do motor.
   Escrever `rdGeral` nele fazia o encantamento decidir uma coisa que é do
   sistema, e o texto do livro ("contra dano físico") ficava contradizendo o
   catálogo em silêncio. */
t("o Reforçado usa o pseudo-canal, e não um canal do motor",
  EQ.getEncantamento("enc_esc_reforcado").efeitos.map((e) => e.canal), ["rdEscudo"]);

/* ============================================================ */
/* 4. O HOVER FECHA A CONTA NA PILHA QUE RECEBEU                 */
/* ============================================================ */
/* Número certo com detalhamento errado é bug (a regra do `defesaAtributo`). */
const soma = (partes) => (partes || []).reduce((s, x) => s + (Number(x.valor) || 0), 0);
for (const [sis, campo] of [["afty", "rdGeral"], ["player", "rdFisico"]]) {
  const d = ficha(sis, { grau: "especial", reforcado: true });
  t(`${sis}: as parcelas de ${campo} somam o valor`, soma(d.partes[campo]), d[campo]);
  t(`${sis}: e nenhuma parcela sem nome`, (d.partes[campo] || []).every((x) => !!x.label), true);
  t(`${sis}: o Reforçado aparece nomeado`,
    (d.partes[campo] || []).some((x) => /Reforçado/.test(x.label)), true);
}
/* A pilha que NÃO recebeu não ganha linha nenhuma do escudo. */
t("jogador: a RD Geral não lista equipamento",
  (ficha("player", { grau: "especial", reforcado: true }).partes.rdGeral || [])
    .some((x) => x.label === "Equipamento"), false);

/* ============================================================ */
/* 5. O QUE NÃO MUDOU                                            */
/* ============================================================ */
/* `rdEscudoBase` é a parcela que o Especialista em Escudo (Combatente 4°) lê, e
   ela é a mesma nos dois: o que muda é onde ela DESEMBOCA, não quanto vale. */
t("a parcela base do escudo é a mesma nos dois",
  ["afty", "player"].map((s) => ficha(s, { grau: "especial" }).equip.rdEscudoBase), [6, 6]);
/* E a penalidade não tem nada com isso. */
t("a penalidade do escudo também",
  ["afty", "player"].map((s) => ficha(s).equip.penalidadeDestreza), [-4, -4]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
