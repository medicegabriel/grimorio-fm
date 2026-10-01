/* O CATÁLOGO DE CARACTERÍSTICAS DE INVOCAÇÃO (Etapa 5 da atualização de 2026-09-30).

   Fontes: as tabelas de Característica do Livro e o *Adicionais para Invocações*.
   O subtipo gravado é o id do catálogo, e os seis de antes (vida, teste,
   resistencia, rd, tamanho, livre) estão lá com o mesmo id: ficha salva não migra.

   O que este arquivo garante:
   1. o valor sai do GRAU ATUAL, e evolui com ele;
   2. cada modificadora nova chega no número que a ficha mostra;
   3. o "mesmo efeito" não acumula, inclusive Nível de Dano com Dado de Dano;
   4. a Livre não dá dado extra (decisão do autor: só as autorizadas por fonte);
   5. Estilo de Combate, Resiliência Alternativa e Resistência;
   6. a família de addon `caracteristicasInvocacao`. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const INV = await import(R + "afty-invocacoes.js");
const CAT = await import(R + "afty-invocacoes-caracteristicas.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const GRAUS = ["quarto", "terceiro", "segundo", "primeiro", "especial"];
const DONO = { nd: 9, bt: 4, nivelControlador: 9 };
const carac = (subtipo, extra = {}) => ({ ...INV.createBlankCaracteristica(), subtipo, nome: extra.nome ?? subtipo, ...extra });
const resolver = (grau, caracs, extraInv = {}, dono = DONO) => INV.resolveInvocacao(
  { ...INV.createBlankInvocacao(grau), id: "x", caracteristicas: caracs, ...extraInv }, dono,
);

/* ============================================================ */
/* 1. O CATÁLOGO                                                 */
/* ============================================================ */
t("o catalogo fecha sem erro", CAT.validarCatalogoCaracteristicasInvocacao(), []);
t("e o validador geral de invocacoes tambem", INV.validarCatalogoInvocacoes(), []);
t("os seis de antes continuam com o mesmo id",
  ["vida", "teste", "resistencia", "rd", "tamanho", "livre"].every((id) => CAT.caracteristicaDoCatalogo(id)), true);
/* A lista fechada da decisão do autor (DA-10): Dano Durante o Ataque, Corrida
   Perfurante e Aura de Dano Durante o Ataque. As duas últimas entraram na Etapa 6. */
t("so as tres autorizadas por fonte podem dar dado extra",
  [...CAT.CARACTERISTICAS_COM_DADO_EXTRA], ["danoDurante", "corridaPerfurante", "auraDano"]);

/* ============================================================ */
/* 2. O VALOR SAI DO GRAU, E CHEGA NO NÚMERO                     */
/* ============================================================ */
const delta = (subtipo, ler) => GRAUS.map((g) => ler(resolver(g, [carac(subtipo)])) - ler(resolver(g, [])));
t("Defesa: +1 a +5 pelo grau, na Defesa da ficha", delta("defesa", (r) => r.defesa), [1, 2, 3, 4, 5]);
t("Aumento de Nivel de Dano: +1 a +5", delta("nivelDano", (r) => r.efeitosHabilidade.danoNivel), [1, 2, 3, 4, 5]);
t("Aumento de Cura: +2 a +10", delta("curaBonus", (r) => r.efeitosHabilidade.curaBonus), [2, 4, 6, 8, 10]);
t("Dano Durante o Ataque: o maximo do dado, 1d4 a 1d12",
  delta("danoDurante", (r) => r.efeitosHabilidade.ataqueDanoAdicional), [4, 6, 8, 10, 12]);
t("Arsenal: 2 a 10 itens", GRAUS.map((g) => resolver(g, [carac("arsenal")]).arsenal), [2, 4, 6, 8, 10]);
t("a parcela da Defesa leva o nome da Caracteristica",
  resolver("segundo", [carac("defesa", { nome: "Carapaça" })]).fontes.defesa.some((p) => p.label === "Carapaça" && p.valor === 3), true);

/* Evoluir o grau evolui a Característica, sem tocar no dado dela. */
const mesma = carac("defesa");
t("a mesma Caracteristica, so trocando o grau",
  [resolver("quarto", [mesma]).caracteristicas[0].valor, resolver("especial", [mesma]).caracteristicas[0].valor], [1, 5]);

/* ============================================================ */
/* 3. O MESMO EFEITO NÃO ACUMULA                                 */
/* ============================================================ */
const duasDefesas = resolver("segundo", [carac("defesa"), carac("defesa")]);
t("duas Defesas valem uma vez, com aviso",
  [duasDefesas.defesa - resolver("segundo", []).defesa, duasDefesas.warnings.some((w) => w.includes("não acumulam"))], [3, true]);
const nivelEDado = resolver("segundo", [carac("nivelDano", { nome: "Garras" }), carac("danoDurante", { nome: "Presas" })]);
t("Nivel de Dano e Dado de Dano sao o mesmo efeito: vale a primeira",
  [nivelEDado.efeitosHabilidade.danoNivel, nivelEDado.efeitosHabilidade.ataqueDanoAdicional], [3, 0]);
t("e a ficha avisa",
  nivelEDado.warnings.some((w) => w.includes("Presas e Garras dão o mesmo efeito")), true);
const livreDefesa = carac("livre", { nome: "Escamas", efeitos: [{ canal: "defesa", expr: "5" }] });
const tipadaMaisLivre = resolver("segundo", [carac("defesa"), livreDefesa]);
t("a Defesa tipada disputa com a Livre: vale a maior",
  tipadaMaisLivre.defesa - resolver("segundo", []).defesa, 5);

/* ============================================================ */
/* 4. A LIVRE NÃO DÁ DADO EXTRA                                  */
/* ============================================================ */
const livreDado = resolver("segundo", [carac("livre", { nome: "Ferrão", efeitos: [{ canal: "ataqueDanoAdicional", expr: "8" }] })]);
t("a Livre com dado extra nao concede o dado",
  livreDado.efeitosHabilidade.ataqueDanoAdicional, 0);
t("e avisa", livreDado.warnings.some((w) => w.includes("Característica Livre não pode dar dado extra")), true);
t("a Livre segue concedendo o resto",
  resolver("segundo", [livreDefesa]).defesa - resolver("segundo", []).defesa, 5);

/* ============================================================ */
/* 5. ESTILO DE COMBATE, RESILIÊNCIA ALTERNATIVA E RESISTÊNCIA   */
/* ============================================================ */
const atributos = { forca: 10, destreza: 12, constituicao: 10, inteligencia: 8, sabedoria: 20, presenca: 18 };
const estilo = (atributo) => resolver("segundo", [carac("estiloCombate", { parametros: { atributo } })], { atributos });
const semEstilo = resolver("segundo", [], { atributos });
t("Estilo de Combate em Sabedoria: Defesa, Acerto e CD usam o +5",
  [estilo("sabedoria").defesa - semEstilo.defesa, estilo("sabedoria").testes.acerto.corpo.bonus - semEstilo.testes.acerto.corpo.bonus,
    estilo("sabedoria").testes.cd - semEstilo.testes.cd],
  [4, 4, 4]);
t("e a parcela da Defesa diz qual atributo",
  estilo("sabedoria").fontes.defesa.some((p) => p.label === "Sabedoria" && p.valor === 5), true);
t("um atributo pior que a Destreza nao rebaixa (o Estilo permite, nao obriga)",
  estilo("inteligencia").defesa, semEstilo.defesa);
t("sem atributo escolhido avisa",
  resolver("segundo", [carac("estiloCombate")]).warnings.some((w) => w.includes("Escolha o atributo")), true);

const resil = resolver("segundo", [carac("resilienciaAlternativa", { parametros: { atributo: "presenca" } })], { atributos });
t("Resiliencia Alternativa: o PV do Segundo Grau usa a Presenca no lugar da Constituicao",
  resil.pv, 40 + 18 + 9);
t("e a parcela do PV diz qual atributo", resil.fontes.pv.some((p) => p.label === "Presença" && p.valor === 18), true);
t("as parcelas do PV fecham", resil.fontes.pv.reduce((s, p) => s + p.valor, 0), resil.pv);

const resist = (dono) => resolver("segundo", [carac("resistenciaDano", { parametros: { tipoDano: "queimante" } })], {}, dono);
t("Resistencia lista o tipo de dano", resist(DONO).resistencias, [{ tipo: "queimante", label: "Queimante", nome: "resistenciaDano" }]);
t("sem a lista do dono, ninguem confere", resist(DONO).warnings.some((w) => w.includes("Feitiço Passivo")), false);
t("com a lista e sem o tipo, avisa",
  resist({ ...DONO, resistenciasDePassiva: ["congelante"] }).warnings.some((w) => w.includes("O dono não tem Feitiço Passivo com Resistência a Queimante")), true);
t("com a lista e o tipo, nao avisa",
  resist({ ...DONO, resistenciasDePassiva: ["queimante"] }).warnings.some((w) => w.includes("Feitiço Passivo")), false);

/* Pela ficha inteira: o Feitiço Passivo do dono que dá Resistência. */
const criatura = createBlankAfty();
criatura.feiticos = [{
  id: "fp1", nome: "Pele de Brasa", tipo: "passivo",
  efeitosPassivo: [{ canal: "resistenciaDano", alvo: "queimante", expr: "1" }],
}];
criatura.invocacoes = [{
  ...INV.createBlankInvocacao("quarto"), id: "i1", nome: "Salamandra",
  caracteristicas: [carac("resistenciaDano", { nome: "Couro Quente", parametros: { tipoDano: "queimante" } })],
}];
const d = deriveAfty(criatura);
const sal = d.invocacoes.lista.find((i) => i.id === "i1");
t("pela ficha inteira, o Feitico Passivo do dono cumpre o requisito",
  [sal.resistencias.map((r) => r.tipo), sal.warnings.some((w) => w.includes("Feitiço Passivo"))], [["queimante"], false]);

/* ============================================================ */
/* 6. A FAMÍLIA DE ADDON                                          */
/* ============================================================ */
const PACOTE = {
  id: "bestiario", nome: "Bestiário", versao: "1.0.0", paraRaw: "afty", autor: "Templas",
  acrescenta: {
    caracteristicasInvocacao: [{
      id: "couraca", nome: "Couraça", categoria: "modificadora", fonte: "addon",
      escala: { quarto: 2, terceiro: 3, segundo: 4, primeiro: 5, especial: 6 },
      canal: "defesa", grupoEfeito: "defesa", parametros: [],
    }],
  },
};
t("o pacote passa no validador", A.validarPacote(PACOTE), []);
A.aplicarAddons([A.normalizarPacote(PACOTE)]);
const ID = "bestiario:couraca";
t("a Caracteristica do addon entra no catalogo, pelo id prefixado", CAT.caracteristicaDoCatalogo(ID)?.nome, "Couraça");
t("e vira numero pelo mesmo caminho das do raw",
  resolver("segundo", [carac(ID)]).defesa - resolver("segundo", []).defesa, 4);
t("e disputa com a Defesa do raw (mesmo canal): vale a maior",
  resolver("segundo", [carac(ID), carac("defesa")]).defesa - resolver("segundo", []).defesa, 4);
A.aplicarAddons([]);
t("sem o addon, o id some do catalogo", CAT.caracteristicaDoCatalogo(ID), null);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
