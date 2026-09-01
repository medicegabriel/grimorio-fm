import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const EQ = await import(R + "afty-equipamentos.js");
const FE = await import(R + "afty-feiticos.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const DANO_RAW = { ...EQ.TIPOS_DANO };
const COND_RAW = JSON.parse(JSON.stringify(FE.CONDICOES_CATALOGO));

/* ---- QUEM PEDE UM TIPO ELEMENTAL RECEBE OS ELEMENTAIS ---- */
/* Autor, 2026-08-31: *"falta os tipos de dano na aura elemental"*. A Aura
   Elemental diz "um tipo de dano da categoria Elementais" e a Afinidade
   Ampliada diz "um tipo de dano elemental"; as duas ofereciam a tabela inteira,
   que naquele dia eram Cortante, Impacto, Perfurante e Queimante, ou seja, três
   tipos FÍSICOS e um elemento só. */
const APT = await import(R + "afty-aptidoes.js");
const ELEMENTAIS = ["acido", "congelante", "chocante", "queimante", "sonico"];
for (const id of ["aura_elemental", "afinidade_ampliada"]) {
  const apt = APT.AFTY_APTIDOES.find((a) => a.id === id);
  t(`${id} pede a categoria Elementais`, apt.opcoes?.categoria, "elemental");
  t(`e recebe os cinco`, EQ.tiposDeDanoDaCategoria(apt.opcoes.categoria).map((x) => x.id), ELEMENTAIS);
  t(`e nenhum tipo físico`,
    EQ.tiposDeDanoDaCategoria(apt.opcoes.categoria)
      .filter((x) => EQ.categoriaDoTipoDano(x.id) === "fisico"), []);
}
t("o catálogo de aptidões segue válido", APT.validarCatalogoAptidoes(), []);

t("ha familias registradas", AD.familiasDeAddon().length > 0, true);
t("tiposDano registrada", AD.familiasDeAddon().some((f) => f.id === "tiposDano"), true);
t("condicoes registrada", AD.familiasDeAddon().some((f) => f.id === "condicoes"), true);

const PACOTE = {
  id: "mesa-teste", nome: "Mesa", versao: "1.0.0",
  acrescenta: {
    /* ⚠ NENHUM DOS DOIS EXISTE NO LIVRO, e é o ponto: até 2026-08-31 este pacote
       acrescentava "sonico" e "psiquico", que hoje são dois dos quinze tipos da
       tabela raw. O assert "chave crua NAO existe" passou a medir o livro em vez
       do namespace e falhou, corretamente. */
    tiposDano: [
      { value: "gravitacional", label: "Gravitacional" },
      { value: "ressonante", label: "Ressonante", categoria: "elemental" },
    ],
    condicoes: [
      { id: "cnd_congelado", nome: "Congelado", forca: "media" },
      { id: "cnd_apagado", nome: "Apagado", forca: "extrema" },
    ],
  },
};
t("pacote de tabela e valido", AD.validarPacote(PACOTE), []);
t("tipo de dano sem label reprova",
  AD.validarPacote({ ...PACOTE, acrescenta: { tiposDano: [{ value: "x" }] } }).length > 0, true);
t("condicao sem forca reprova",
  AD.validarPacote({ ...PACOTE, acrescenta: { condicoes: [{ id: "c", nome: "C" }] } }).length > 0, true);

const r = AD.aplicarAddons([PACOTE]);
t("instalou", r.problemas, []);

/* ---- TIPOS DE DANO ---- */
t("dois tipos novos", Object.keys(EQ.TIPOS_DANO).length, Object.keys(DANO_RAW).length + 2);
t("chave prefixada", EQ.TIPOS_DANO["mesa-teste:gravitacional"], "Gravitacional");
t("chave crua NAO existe", EQ.TIPOS_DANO.gravitacional, undefined);
t("os do raw continuam", EQ.TIPOS_DANO.ct, "Cortante");

/* ---- OS QUINZE DO LIVRO, E AS QUATRO CATEGORIAS ---- */
t("a tabela raw tem os quinze", Object.keys(DANO_RAW).length, 15);
t("cada tipo do livro cai em exatamente uma categoria",
  Object.keys(DANO_RAW).filter((id) =>
    EQ.CATEGORIAS_DANO.filter((c) => c.tipos.includes(id)).length !== 1), []);
t("nenhuma categoria cita tipo que nao existe",
  EQ.CATEGORIAS_DANO.flatMap((c) => c.tipos).filter((id) => DANO_RAW[id] == null), []);
t("os cinco Elementais, na ordem do livro",
  EQ.CATEGORIAS_DANO.find((c) => c.id === "elemental").tipos,
  ["acido", "congelante", "chocante", "queimante", "sonico"]);

/* O tipo do addon que DECLAROU categoria entra na lista dela, e o que nao
   declarou fica de fora de todas: e o que separa "acrescentar um elemento" de
   "acrescentar um tipo qualquer". */
t("tipo de addon com categoria entra na lista dela",
  EQ.tiposDeDanoDaCategoria("elemental").some((x) => x.id === "mesa-teste:ressonante"), true);
t("tipo de addon sem categoria nao entra em nenhuma",
  EQ.CATEGORIAS_DANO.some((c) =>
    EQ.tiposDeDanoDaCategoria(c.id).some((x) => x.id === "mesa-teste:gravitacional")), false);
t("e o rotulo da lista sai VIVO da tabela",
  EQ.tiposDeDanoDaCategoria("elemental").find((x) => x.id === "queimante").label, "Queimante");
t("categoriaDoTipoDano acha o do livro", EQ.categoriaDoTipoDano("psiquico"), "etereo");
t("e o do addon que declarou", EQ.categoriaDoTipoDano("mesa-teste:ressonante"), "elemental");
t("e devolve null para quem nao tem", EQ.categoriaDoTipoDano("mesa-teste:gravitacional"), null);

/* A arma custom sanea pelo Set das chaves: se ele nao religou, o tipo novo cai. */
const arma = EQ.createArmaCustom ? EQ.createArmaCustom() : null;
if (arma) {
  const saneada = EQ.patchArmaCustomSanear
    ? EQ.patchArmaCustomSanear({ ...arma, danoTipo: "mesa-teste:gravitacional" })
    : null;
  if (saneada) t("arma aceita o tipo de addon", saneada.danoTipo, "mesa-teste:gravitacional");
}

/* ---- CONDICOES ---- */
t("uma condicao media a mais", FE.CONDICOES_CATALOGO.media.length, COND_RAW.media.length + 1);
t("uma extrema a mais", FE.CONDICOES_CATALOGO.extrema.length, COND_RAW.extrema.length + 1);
t("o NOME entra limpo, sem namespace", FE.CONDICOES_CATALOGO.media.includes("Congelado"), true);
t("nenhum nome com dois-pontos",
  Object.values(FE.CONDICOES_CATALOGO).flat().some((n) => n.includes(":")), false);
t("as forcas nao tocadas ficam iguais", FE.CONDICOES_CATALOGO.fraca, COND_RAW.fraca);

/* Força inexistente nao quebra e nao inventa grupo. */
AD.aplicarAddons([{ ...PACOTE, acrescenta: { condicoes: [{ id: "c", nome: "X", forca: "epica" }] } }]);
t("forca inexistente nao cria grupo", FE.CONDICOES_CATALOGO.epica, undefined);
t("e nao derruba", Object.keys(FE.CONDICOES_CATALOGO).length, Object.keys(COND_RAW).length);

/* ---- desinstalar volta as duas tabelas ---- */
AD.limparAddons();
t("tipos de dano voltaram", EQ.TIPOS_DANO, DANO_RAW);
/* A TERCEIRA estrutura da familia: o mapa de categoria de addon. Sem limpa-lo
   junto, "mesa-teste:ressonante" continuaria listado entre os Elementais depois
   de desinstalado, apontando para um rotulo que nao existe mais. */
t("e a categoria do addon saiu junto",
  EQ.tiposDeDanoDaCategoria("elemental").map((x) => x.id),
  ["acido", "congelante", "chocante", "queimante", "sonico"]);
t("condicoes voltaram", FE.CONDICOES_CATALOGO, COND_RAW);
t("catalogo de equipamentos valido", EQ.validarCatalogoEquipamentos(), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
