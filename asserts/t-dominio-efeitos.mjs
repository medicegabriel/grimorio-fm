/* EXPANSÃO DE DOMÍNIO: as tabelas do Guia, o limite de efeitos, o Fortalecer, as
   Condições, a RD por tipo e a validação (2026-10-08).

   Cada número desta suíte é o do Livro 2.5.2 (Guia de Criação de Expansão de
   Domínio), conferido linha a linha. DA-12: Fortalecer soma piso(base / 2) por
   fortalecimento, sem composição. DA-17: ERRO trava a abertura, e duplicata é só
   a IDÊNTICA. DA-21: Condições pela Gerência de Dano por Condições. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const DOM = await import(R + "afty-dominios.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const tabela = (cat, tipo, n = 0) => [0, 1, 2, 3, 4].map((i) => DOM.DOMINIO_EFEITOS[cat].tipos[tipo].resolve(i, n));
const motor = (cat, tipo, canal, alvo) => tabela(cat, tipo).map((r) => Number(r.motor.find((m) => m.canal === canal && (alvo == null || m.alvo === alvo)).expr));

/* ============================================================ */
/* AS TABELAS, LINHA A LINHA COM O LIVRO                         */
/* ============================================================ */
t("Amp. Técnica Dano: dados", motor("amp_tecnica", "dano", "dadosDano", "feitico"), [1, 2, 3, 4, 5]);
t("Amp. Técnica Dano: fixo", motor("amp_tecnica", "dano", "danoBonus", "feitico"), [5, 5, 10, 10, 15]);
t("Amp. Técnica CD, no canal da CD de Feitiço (DA-13)", motor("amp_tecnica", "cd", "cdFeitico"), [2, 4, 6, 8, 10]);
t("Amp. Técnica: nunca no canal `cd` geral", tabela("amp_tecnica", "cd").some((r) => r.motor.some((m) => m.canal === "cd")), false);
t("Negação de RD", motor("amp_tecnica", "negacao_rd", "ignoraRD", "feitico"), [3, 6, 10, 12, 15]);
t("Negação de RD: resistência cai no DOM 4 e 5",
  tabela("amp_tecnica", "negacao_rd").map((r) => r.motor.some((m) => m.canal === "removeResistencia")), [false, false, false, true, true]);
t("Amp. Corporal Dano: níveis", motor("amp_corporal", "dano", "nivelDano", "arma"), [2, 4, 6, 8, 10]);
t("Amp. Corporal Dano: fixo", motor("amp_corporal", "dano", "danoBonus", "arma"), [5, 5, 10, 10, 15]);
t("Amp. Corporal Atributo", tabela("amp_corporal", "atributo").map((r) => r.motorAtributo), [2, 4, 6, 8, 10]);
t("Amp. Corporal RD", tabela("amp_corporal", "rd").map((r) => [r.motorRdTipo, r.tiposMax]), [[3, 3], [6, 3], [9, 4], [12, 4], [15, 5]]);
t("Amp. Corporal Defesa", motor("amp_corporal", "defesa", "defesa"), [3, 5, 7, 9, 12]);
t("Ambiental Dano", tabela("ambiental", "dano").map((r) => r.valor), ["1d10 + 10", "2d8 + 15", "2d10 + 20", "2d12 + 25", "3d10 + 35"]);
t("Ambiental Condições: dados", tabela("ambiental", "condicoes").map((r) => r.dadosCondicao), [2, 4, 6, 8, 12]);
t("Ambiental Condições: forças",
  tabela("ambiental", "condicoes").map((r) => r.forcasCondicao.join("/")),
  ["fraca", "fraca/media", "fraca/media/forte", "fraca/media/forte", "fraca/media/forte"]);
t("Condições custam 1, 3 e 5 dados", DOM.CUSTO_CONDICAO_AMBIENTAL, { fraca: 1, media: 3, forte: 5 });
t("Ambiental Lentidão", tabela("ambiental", "lentidao").map((r) => r.valor), ["reduz 3 m", "reduz 6 m", "reduz 9 m", "reduz 12 m", "reduz 18 m"]);
t("o catálogo segue íntegro", DOM.validarCatalogoDominios(), []);

/* ============================================================ */
/* LIMITE E TETO DA INCOMPLETA                                   */
/* ============================================================ */
t("limite 1, 1, 2, 2, 3", [1, 2, 3, 4, 5].map((d) => DOM.maxEfeitos(d)), [1, 1, 2, 2, 3]);
t("a Incompleta não passa do DOM 3", [DOM.domEfetivo(5, "incompleta"), DOM.domEfetivo(5, "completa")], [3, 5]);
t("e o efeito dela sai no degrau 3",
  DOM.valorDoEfeito({ categoria: "amp_corporal", tipo: "defesa" }, 5, "incompleta"), "+7 de Defesa");

/* ============================================================ */
/* FORTALECER (DA-12)                                            */
/* ============================================================ */
const defesa = (n) => tabela("amp_corporal", "defesa", n).map((r) => Number(r.motor[0].expr));
t("Defesa DOM 1: 3 vira 4, e não 5 do round", defesa(1)[0], 4);
t("um fortalecimento soma piso(base / 2)", defesa(1), [4, 7, 10, 13, 18]);
t("dois somam duas vezes, sem composição", defesa(2), [5, 9, 13, 17, 24]);
t("dados 1 fortalecido continua 1 (piso de 0,5)", tabela("amp_tecnica", "dano", 1)[0].motor[0].expr, "1");
t("fixo 5 fortalecido vira 7", tabela("amp_tecnica", "dano", 1)[0].motor[1].expr, "7");
t("Lentidão anda na grade de 1,5 m", tabela("ambiental", "lentidao", 1).map((r) => r.valor), ["reduz 4,5 m", "reduz 9 m", "reduz 13,5 m", "reduz 18 m", "reduz 27 m"]);
t("o Fortalecer sobe a RD e não a quantidade de tipos", tabela("amp_corporal", "rd", 1)[0], { ...tabela("amp_corporal", "rd", 1)[0], motorRdTipo: 4, tiposMax: 3 });
t("o booleano antigo vale um fortalecimento", [DOM.fortalecimentosDe({ fortalecido: true }), DOM.fortalecimentosDe({ fortalecimentos: 2 }), DOM.fortalecimentosDe({})], [1, 2, 0]);
t("cada fortalecimento ocupa uma vaga", DOM.vagasUsadas([{ fortalecimentos: 2 }, {}]), 4);

/* ============================================================ */
/* VALIDAÇÃO (DA-17)                                             */
/* ============================================================ */
const valida = (efeitos, { dom = 5, versao = "completa" } = {}) =>
  DOM.validarDominio({ versao, efeitos }, {
    dom, versao, maxEfeitos: DOM.maxEfeitos(dom),
    condicoesValidas: { fraca: ["Abalado", "Caído"], media: ["Lento", "Agarrado"], forte: ["Cego"] },
  }).map((v) => `${v.nivel}:${v.codigo}`);
t("mesma categoria, efeitos diferentes: vale",
  valida([{ categoria: "amp_tecnica", tipo: "dano" }, { categoria: "amp_tecnica", tipo: "cd" }]), []);
t("duplicata idêntica: erro",
  valida([{ categoria: "amp_tecnica", tipo: "dano" }, { categoria: "amp_tecnica", tipo: "dano" }]), ["erro:duplicata"]);
t("Aumento de Atributo em pares diferentes não é duplicata", valida([
  { categoria: "amp_corporal", tipo: "atributo", atributos: ["forca", "destreza"] },
  { categoria: "amp_corporal", tipo: "atributo", atributos: ["forca", "constituicao"] },
]), []);
t("acima do limite: erro", valida([{ categoria: "amp_tecnica", tipo: "dano" }, { categoria: "amp_tecnica", tipo: "cd" }], { dom: 1 }), ["erro:limite"]);
t("fortalecer conta no limite", valida([{ categoria: "amp_tecnica", tipo: "dano", fortalecimentos: 2 }], { dom: 3 }), ["erro:limite"]);
t("Aumento de Atributo pede dois atributos distintos",
  valida([{ categoria: "amp_corporal", tipo: "atributo", atributos: ["forca", "forca"] }]), ["erro:atributos"]);
t("RD por tipo: sem tipos avisa", valida([{ categoria: "amp_corporal", tipo: "rd" }]), ["aviso:rdTipos"]);
t("RD por tipo: o texto antigo também avisa", valida([{ categoria: "amp_corporal", tipo: "rd", rdTipos: "fogo e gelo" }]), ["aviso:rdTipos"]);
t("RD por tipo: tipos demais é erro",
  valida([{ categoria: "amp_corporal", tipo: "rd", rdTipos: ["fogo", "gelo", "eletrico", "acido"] }], { dom: 1 }), ["erro:rdTipos"]);
t("Condições dentro do orçamento", valida([{ categoria: "ambiental", tipo: "condicoes", condicoes: [{ nome: "Cego", forca: "forte" }, { nome: "Abalado", forca: "fraca" }] }]), []);
t("Condições acima dos dados", valida([{ categoria: "ambiental", tipo: "condicoes", condicoes: [{ nome: "Lento", forca: "media" }] }], { dom: 1 }),
  ["erro:condicoesDados", "erro:condicaoForca"]);
t("Condição Extrema nunca", valida([{ categoria: "ambiental", tipo: "condicoes", condicoes: [{ nome: "Atordoado", forca: "extrema" }] }]),
  ["erro:condicaoForca"]);
t("Condição fora do catálogo", valida([{ categoria: "ambiental", tipo: "condicoes", condicoes: [{ nome: "Inventada", forca: "fraca" }] }]),
  ["erro:condicaoNome"]);
t("Condições só uma vez, mesmo diferentes", valida([
  { categoria: "ambiental", tipo: "condicoes", condicoes: [{ nome: "Abalado", forca: "fraca" }] },
  { categoria: "ambiental", tipo: "condicoes", condicoes: [{ nome: "Caído", forca: "fraca" }] },
]), ["erro:condicoesRepetidas"]);
t("Efeito Especial pede o Narrador", valida([{ categoria: "especial", nome: "Jackpot" }]), ["aviso:especial"]);
t("Efeito Especial fortalecido fica com a mesa", valida([{ categoria: "especial", nome: "Jackpot", fortalecimentos: 1 }]), ["aviso:especial", "aviso:fortalecer"]);

/* ============================================================ */
/* PELO DERIVE: RD POR TIPO E A EXPANSÃO INVÁLIDA                */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = (efeitos) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 20;
    c.aptidoes = { dom: 1, bar: 3 };
    c.aptidoesAmaldicoadas = ["tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa"];
    c.dominios = [{ id: "d1", nome: "Teste", versao: "completa", efeitos }];
    c.combate = { ativo: true, dominioAtivo: "d1" };
    return c;
  };
  const d = deriveAfty(ficha([{ id: "e1", categoria: "amp_corporal", tipo: "rd", rdTipos: ["fogo", "gelo", "eletrico", "acido"] }]));
  t(`${sistema}: tipos demais deixam a Expansão inválida`, d.dominios.lista[0].valida, false);
  const ok3 = deriveAfty(ficha([{ id: "e1", categoria: "amp_corporal", tipo: "rd", rdTipos: ["fogo", "gelo"] }]));
  t(`${sistema}: a RD sai só nos tipos escolhidos`,
    ok3.efeitos.detalhes.filter((x) => x.canal === "rdTipo" && x.nome?.startsWith("Teste")).map((x) => [x.alvo, x.valor]),
    [["fogo", 3], ["gelo", 3]]);
  t(`${sistema}: e não vira RD Geral`,
    ok3.efeitos.detalhes.some((x) => x.canal === "rdGeral" && x.nome?.startsWith("Teste")), false);
}

/* ============================================================ */
/* O QUE O EDITOR LÊ (Etapa 7, 2026-10-08)                       */
/* ============================================================ */
/* O editor em Feitiços → Especial não recalcula regra: o teto de tipos da RD e o
   orçamento de Condições saem do `resolucaoDoEfeito`. */
const res = (categoria, tipo, dom, versao = "completa") => DOM.resolucaoDoEfeito({ categoria, tipo }, dom, versao);
t("editor: teto de tipos da RD por DOM", [1, 2, 3, 4, 5].map((d) => res("amp_corporal", "rd", d).tiposMax), [3, 3, 4, 4, 5]);
t("editor: orçamento de Condições por DOM", [1, 2, 3, 4, 5].map((d) => res("ambiental", "condicoes", d).dadosCondicao), [2, 4, 6, 8, 12]);
t("editor: forças liberadas por DOM", [1, 2, 3].map((d) => res("ambiental", "condicoes", d).forcasCondicao),
  [["fraca"], ["fraca", "media"], ["fraca", "media", "forte"]]);
t("editor: a Incompleta trava no DOM 3", res("ambiental", "condicoes", 5, "incompleta").dadosCondicao, 6);
t("editor: Efeito Especial não tem resolução", DOM.resolucaoDoEfeito({ categoria: "especial" }, 3, "completa"), null);
t("editor: efeito sem RD não traz teto de tipos", res("amp_corporal", "defesa", 3).tiposMax, undefined);
t("editor: o número gravado do Fortalecer tem teto", DOM.fortalecimentosDe({ fortalecimentos: 99 }), DOM.MAX_FORTALECIMENTOS);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
