/* MALDIÇÃO, UM TIPO NATIVO DE INVOCAÇÃO (2026-09-19).

   Pedido do autor: a Maldição fica ao lado de Invocação e de Invocação de Técnica,
   como um TIPO da invocação, sem Talento e sem Addon. A vida dela vale 1,5 vez o PV
   já somado, então os bônus de vida das Habilidades também são multiplicados.

   Por trás está o canal de invocação `pvMult`, que multiplica o PV FINAL e vale
   UMA VEZ SÓ: com várias fontes vale a maior, nunca o produto nem a soma. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const INV = await import(R + "afty-invocacoes.js");
const { vocabularioDsl } = await import(R + "afty-dsl-vocabulario.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O TIPO                                                     */
/* ============================================================ */
t("o catalogo tem os tres tipos, Maldicao ao lado dos dois",
  INV.AFTY_INV_TIPOS.map((x) => [x.value, x.label]),
  [["shikigami", "Invocação"], ["tecnica", "Invocação de Técnica"], ["maldicao", "Maldição"]]);
t("a Maldicao e uma invocacao normal: mesmo Intermediario e mesma retirada",
  [INV.tipoInvocacaoMeta("maldicao").intermediario, INV.tipoInvocacaoMeta("maldicao").retirada],
  [INV.tipoInvocacaoMeta("shikigami").intermediario, INV.tipoInvocacaoMeta("shikigami").retirada]);
t("a ficha guarda o valor e ele nao cai no padrao",
  INV.tipoMecanicoDaInvocacao({ tipoMecanico: "maldicao" }), "maldicao");
t("o rotulo que a ficha mostra", INV.tipoInvocacaoLabel({ tipoMecanico: "maldicao" }), "Maldição");
t("ela nao e Invocacao de Tecnica", INV.ehShikigamiDeTecnica({ tipoMecanico: "maldicao" }), false);
t("o validador do catalogo continua fechando zerado", INV.validarCatalogoInvocacoes(), []);
t("o canal de invocacao pvMult esta no catalogo", INV.EFEITO_CANAIS.includes("pvMult"), true);

/* ============================================================ */
/* 2. A VIDA                                                     */
/* ============================================================ */
/* Um pacote de teste com um bônus de vida de Habilidade (+10) e um segundo
   multiplicador (x2), para provar que o bônus conta e que o 1,5 vale uma vez. */
const extra = AD.normalizarPacote({
  id: "teste-vida", nome: "Teste Vida", versao: "1.0.0", autor: "T", paraRaw: "afty",
  acrescenta: { talentos: [
    { id: "tal_bonus_vida", nome: "Bonus de Vida", grupo: "geral", descricao: "x",
      efeitosInvocacao: [{ canal: "pv", expr: "10", nome: "Habilidade de Vida" }] },
    { id: "tal_dobro", nome: "Dobro", grupo: "geral", descricao: "x",
      efeitosInvocacao: [{ canal: "pvMult", expr: "2", nome: "Outro Multiplicador" }] },
    { id: "tal_metade", nome: "Metade", grupo: "geral", descricao: "x",
      efeitosInvocacao: [{ canal: "pvMult", expr: "0.5", nome: "Multiplicador Menor" }] },
  ] },
});
AD.aplicarAddons([extra]);
const BONUS = "teste-vida:tal_bonus_vida";
const DOBRO = "teste-vida:tal_dobro";
const METADE = "teste-vida:tal_metade";

const ficha = ({ tipo = "shikigami", talentos = [], grau = "terceiro" } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.talentos = talentos;
  c.addons = [extra];
  const inv = INV.createBlankInvocacao(grau, tipo);
  inv.id = "x"; inv.nome = "Alvo";
  inv.atributos = { forca: 14, destreza: 12, constituicao: 16, inteligencia: 10, sabedoria: 10, presenca: 10 };
  inv.acoes = [{ ...INV.createBlankAcao(), id: "a", nome: "Golpe" }];
  c.invocacoes = [inv];
  return c;
};
const resolvida = (o) => deriveAfty(ficha(o)).invocacoes.lista[0];

const normal = resolvida({});
const maldicao = resolvida({ tipo: "maldicao" });
t("a invocacao normal tem o PV de sempre, sem multiplicador",
  normal.fontes.pv.some((p) => String(p.texto ?? "").startsWith("×")), false);
t("a Maldicao tem 1,5 vez o PV (arredondado para baixo)", maldicao.pv, Math.floor(normal.pv * 1.5));
t("e o hover mostra a fonte, com o nome do tipo",
  maldicao.fontes.pv.some((p) => p.label === "Maldição" && p.texto === "× 1.5"), true);

/* "O 1,5 conta os bônus de vida das Habilidades." */
const normalComBonus = resolvida({ talentos: [BONUS] });
const maldicaoComBonus = resolvida({ tipo: "maldicao", talentos: [BONUS] });
t("o bonus de Habilidade sozinho soma 10", normalComBonus.pv - normal.pv, 10);
t("a Maldicao multiplica o PV JA COM o bonus", maldicaoComBonus.pv, Math.floor((normal.pv + 10) * 1.5));
t("e nao e so a base vezes 1,5 mais o bonus",
  maldicaoComBonus.pv === Math.floor(normal.pv * 1.5) + 10, false);

/* "Não pode aumentar de novo o bônus de vida": vale uma vez só, a maior fonte. */
const comOutroMult = resolvida({ tipo: "maldicao", talentos: [BONUS, DOBRO] });
t("com outro multiplicador (x2) vale so o maior, uma vez",
  comOutroMult.pv, Math.floor((normal.pv + 10) * 2));
t("nem o produto nem a soma dos dois",
  [comOutroMult.pv === Math.floor((normal.pv + 10) * 3), comOutroMult.pv === Math.floor((normal.pv + 10) * 3.5)],
  [false, false]);
t("o hover mostra a fonte que venceu",
  comOutroMult.fontes.pv.some((p) => p.label === "Outro Multiplicador" && p.texto === "× 2"), true);
t("e nao mostra a Maldicao, que perdeu",
  comOutroMult.fontes.pv.some((p) => p.label === "Maldição"), false);
t("um multiplicador menor que 1 nao encolhe o PV (piso de 1)",
  resolvida({ talentos: [METADE] }).pv, normal.pv);
t("e ele nao atrapalha a Maldicao, que continua valendo 1,5",
  resolvida({ tipo: "maldicao", talentos: [METADE] }).pv, maldicao.pv);

/* ============================================================ */
/* 3. O RESTO DA FICHA CONTINUA NORMAL                           */
/* ============================================================ */
t("os atributos da Maldicao sao os da invocacao normal (mesma base)",
  maldicao.atributos.valores.forca, normal.atributos.valores.forca);
t("a Defesa nao muda", maldicao.defesa, normal.defesa);
t("o custo em PE nao muda", maldicao.custo, normal.custo);
t("o tipo aparece na linha da lista", maldicao.tipoMecanico, "maldicao");
t("a Invocacao de Tecnica nao ganha o multiplicador",
  resolvida({ tipo: "tecnica" }).fontes.pv.some((p) => String(p.texto ?? "").startsWith("×")), false);

/* A variavel de DSL do tipo existe, e `tipo_shikigami` vale tambem para ela. */
const vars = (tipo) => INV.buildInvocacaoDslContext(INV.createBlankInvocacao("quarto", tipo), {});
t("tipo_maldicao liga so na Maldicao",
  ["shikigami", "tecnica", "maldicao"].map((x) => vars(x).tipo_maldicao), [0, 0, 1]);
t("tipo_shikigami tambem vale para ela (e uma invocacao de Talisma)",
  ["shikigami", "tecnica", "maldicao"].map((x) => vars(x).tipo_shikigami), [1, 0, 1]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
