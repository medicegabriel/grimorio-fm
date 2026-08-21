import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
/* ⚠ ORDEM IMPORTA, e o motivo é anterior a este trabalho: importar
   afty-habilidades.js como PRIMEIRO módulo estoura um ciclo em afty-combate.js
   ("Cannot access 'POSTURAS_DE_COMBATE' before initialization"). Confirmado
   idêntico no HEAD. O app entra sempre pelo derive, então é latente. */
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const H = await import(R + "afty-habilidades.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const QUANTAS_RAW = H.AFTY_HABILIDADES.length;
const ROUBAVEIS_RAW = H.HABILIDADES_ROUBAVEIS.length;

/* ---- um pacote de verdade, no formato do doc ---- */
const PACOTE = {
  id: "minha-mesa",
  nome: "Regras da Mesa",
  versao: "1.0.0",
  acrescenta: {
    habilidades: [
      {
        id: "ciclo_de_adaptacao",
        nome: "Ciclo de Adaptação",
        especializacaoId: "lutador",
        tipo: "base",
        nivel: 1,
        tags: ["adaptacao"],
        descricao: "Adapta-se ao que já enfrentou.",
        requisitos: [],
        efeitos: [{ canal: "rdGeral", expr: '2 + contar("adaptacao") - 1' }],
      },
      {
        id: "segundo_ciclo",
        nome: "Segundo Ciclo",
        especializacaoId: "lutador",
        tipo: "nivel",
        nivel: 4,
        tags: ["adaptacao"],
        descricao: "Mais uma volta.",
        // Referência a um IRMÃO do mesmo pacote, escrita SEM prefixo.
        requisitos: [{ tipo: "habilidade", id: "ciclo_de_adaptacao" }],
      },
      {
        id: "eco_do_livro",
        nome: "Eco do Livro",
        especializacaoId: "combatente",
        tipo: "nivel",
        nivel: 5,
        descricao: "Depende de algo do raw.",
        // Referência ao RAW, que não existe dentro do pacote: fica crua.
        requisitos: [{ tipo: "habilidade", id: "lut_corpo_treinado" }],
      },
    ],
  },
};

/* ---- validação ---- */
t("pacote bom nao tem problema", AD.validarPacote(PACOTE), []);
t("sem id reprova", AD.validarPacote({ ...PACOTE, id: "" }).length > 0, true);
/* Caixa alta no id do pacote é NORMALIZADA, e não reprovada: é a mesma regra
   dos identificadores do DSL. Quem escreve "MinhaMesa" recebe o namespace
   "minhamesa", e o namespace é o que vale daí em diante. */
t("id com maiuscula e normalizado", AD.normalizarPacote({ ...PACOTE, id: "MinhaMesa" }).id, "minhamesa");
t("id normalizado passa na validacao", AD.validarPacote({ ...PACOTE, id: "MinhaMesa" }), []);
t("id com espaco em volta e aparado", AD.normalizarPacote({ ...PACOTE, id: "  minha-mesa " }).id, "minha-mesa");
t("id com caractere proibido reprova", AD.validarPacote({ ...PACOTE, id: "minha mesa" }).length > 0, true);
t("id com dois-pontos reprova", AD.validarPacote({ ...PACOTE, id: "a:b" }).length > 0, true);
t("sem nome reprova", AD.validarPacote({ ...PACOTE, nome: "" }).length > 0, true);
t("outro raw reprova", AD.validarPacote({ ...PACOTE, paraRaw: "252" }).length > 0, true);
t("familia desconhecida reprova",
  AD.validarPacote({ ...PACOTE, acrescenta: { xpto: [{ id: "a", nome: "b" }] } }).length > 0, true);
t("pacote vazio reprova", AD.validarPacote({ ...PACOTE, acrescenta: {} }).length > 0, true);
t("entrada sem campo obrigatorio reprova",
  AD.validarPacote({ ...PACOTE, acrescenta: { habilidades: [{ id: "x", nome: "X" }] } }).length > 0, true);
t("id repetido dentro do pacote reprova",
  AD.validarPacote({ ...PACOTE,
    acrescenta: { habilidades: [PACOTE.acrescenta.habilidades[0], PACOTE.acrescenta.habilidades[0]] },
  }).length > 0, true);
t("tags que nao e lista reprova",
  AD.validarPacote({ ...PACOTE,
    acrescenta: { habilidades: [{ ...PACOTE.acrescenta.habilidades[0], tags: "adaptacao" }] },
  }).length > 0, true);
t("lixo nao derruba o validador", AD.validarPacote(null).length > 0, true);

/* ---- instalar ---- */
const antes = AD.epocaAddons();
const r = AD.aplicarAddons([PACOTE]);
t("instalou sem problema", r.problemas, []);
t("um addon ativo", r.aplicados.length, 1);
t("a epoca subiu", AD.epocaAddons() > antes, true);
t("o catalogo cresceu 3", H.AFTY_HABILIDADES.length, QUANTAS_RAW + 3);

/* ---- namespace ---- */
t("id ganhou prefixo", !!H.getHabilidade("minha-mesa:ciclo_de_adaptacao"), true);
t("id cru NAO resolve", H.getHabilidade("ciclo_de_adaptacao"), null);
t("partirId separa", AD.partirId("minha-mesa:ciclo_de_adaptacao"),
  { pacoteId: "minha-mesa", id: "ciclo_de_adaptacao" });
t("id do raw nao tem pacote", AD.partirId("lut_corpo_treinado").pacoteId, null);
t("ehIdDeAddon", [AD.ehIdDeAddon("minha-mesa:x"), AD.ehIdDeAddon("lut_corpo_treinado")], [true, false]);
t("a ficha sabe de que addon veio", AD.pacoteDoId("minha-mesa:ciclo_de_adaptacao")?.nome, "Regras da Mesa");
t("id do raw nao tem addon", AD.pacoteDoId("lut_corpo_treinado"), null);

/* ---- referências: local primeiro, raw depois ---- */
t("referencia a IRMAO ganhou prefixo",
  H.getHabilidade("minha-mesa:segundo_ciclo").requisitos[0].id, "minha-mesa:ciclo_de_adaptacao");
t("referencia ao RAW ficou crua",
  H.getHabilidade("minha-mesa:eco_do_livro").requisitos[0].id, "lut_corpo_treinado");
t("a entrada carrega de quem ela e", H.getHabilidade("minha-mesa:ciclo_de_adaptacao").addonId, "minha-mesa");

/* ---- as estruturas derivadas religaram ---- */
t("o pool do Roubo cresceu (2 de nivel, Combatente ou Lutador)",
  H.HABILIDADES_ROUBAVEIS.length, ROUBAVEIS_RAW + 2);
t("a habilidade dona do Roubo aponta para o pool novo",
  H.getHabilidade("res_roubo_de_habilidade").escolha.opcoes.length, H.HABILIDADES_ROUBAVEIS.length);
t("a de addon esta no pool",
  H.HABILIDADES_ROUBAVEIS.some((o) => o.id === "minha-mesa:segundo_ciclo"), true);
t("a de tipo base NAO entrou no pool",
  H.HABILIDADES_ROUBAVEIS.some((o) => o.id === "minha-mesa:ciclo_de_adaptacao"), false);

/* ---- o validador do raw enxerga o conteudo do addon ---- */
t("catalogo continua valido com o addon dentro", H.validarCatalogoHabilidades(), []);
const ruim = AD.aplicarAddons([{
  ...PACOTE,
  acrescenta: { habilidades: [{ ...PACOTE.acrescenta.habilidades[0], especializacaoId: "nao_existe" }] },
}]);
t("especializacao inexistente e RELATADA pelo validador do raw", ruim.problemas.length > 0, true);
AD.limparAddons();

/* ---- a criatura usa a habilidade do addon ---- */
AD.aplicarAddons([PACOTE]);
const criatura = (habs) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.habilidades = habs;
  c.addons = [PACOTE];
  return c;
};
t("createBlankAfty tem o campo", Array.isArray(createBlankAfty().addons), true);
t("addonsDaCriatura le a copia embutida", AD.addonsDaCriatura(criatura([])).length, 1);

const d = deriveAfty(criatura(["minha-mesa:ciclo_de_adaptacao"]));
t("derive com habilidade de addon nao quebrou", typeof d.hp, "number");
t("a habilidade de addon aparece como escolhida",
  d.habilidades.escolhidas.includes("minha-mesa:ciclo_de_adaptacao"), true);

/* A marca do addon entra no `contar()`: a habilidade tem tag "adaptacao". */
const comMarca = deriveAfty((() => {
  const c = criatura(["minha-mesa:ciclo_de_adaptacao"]);
  c.core.tecnicaEfeitos = [{ canal: "rdGeral", expr: 'contar("adaptacao")' }];
  return c;
})());
const semMarca = deriveAfty(criatura(["minha-mesa:ciclo_de_adaptacao"]));
t("a tag do addon chega no contar()", comMarca.rdGeral - semMarca.rdGeral, 1);

/* ---- desinstalar volta ao raw exato ---- */
AD.limparAddons();
t("catalogo voltou ao tamanho do raw", H.AFTY_HABILIDADES.length, QUANTAS_RAW);
t("pool voltou ao tamanho do raw", H.HABILIDADES_ROUBAVEIS.length, ROUBAVEIS_RAW);
t("id de addon nao resolve mais", H.getHabilidade("minha-mesa:ciclo_de_adaptacao"), null);
t("nenhum addon ativo", AD.addonsAtivos().length, 0);
t("raw continua valido", H.validarCatalogoHabilidades(), []);

/* Aplicar A e depois B == aplicar [A, B] de uma vez (sem restos). */
const B = { id: "outra-mesa", nome: "Outra", versao: "1.0.0",
  acrescenta: { habilidades: [{ ...PACOTE.acrescenta.habilidades[0], id: "coisa" }] } };
AD.aplicarAddons([PACOTE]);
AD.aplicarAddons([PACOTE, B]);
const juntos = H.AFTY_HABILIDADES.length;
AD.limparAddons();
AD.aplicarAddons([PACOTE, B]);
t("reconstruir e sempre do zero", H.AFTY_HABILIDADES.length, juntos);
t("dois addons ativos", AD.addonsAtivos().length, 2);
t("ids dos dois convivem",
  [!!H.getHabilidade("minha-mesa:ciclo_de_adaptacao"), !!H.getHabilidade("outra-mesa:coisa")], [true, true]);

/* Dois pacotes com o MESMO id: o segundo é recusado. */
const dup = AD.aplicarAddons([PACOTE, { ...PACOTE, nome: "Clone" }]);
t("id de pacote repetido e recusado", dup.aplicados.length, 1);
t("e o motivo e relatado", dup.problemas.length > 0, true);

/* ---- o catalogo NAO divide objeto com a ficha salva ---- */
AD.limparAddons();
const COM_ANINHADO = {
  id: "aninhado", nome: "Aninhado", versao: "1.0.0",
  acrescenta: { habilidades: [{
    id: "x", nome: "X", especializacaoId: "lutador", tipo: "base", nivel: 1,
    descricao: "d", requisitos: [],
    escolha: { id: "e", label: "E", niveis: [1], opcoes: [{ id: "o1", nome: "O1" }] },
  }] },
};
AD.aplicarAddons([COM_ANINHADO]);
const doCatalogo = H.getHabilidade("aninhado:x");
const doPacote = COM_ANINHADO.acrescenta.habilidades[0];
t("o aninhado NAO e a mesma referencia", doCatalogo.escolha === doPacote.escolha, false);
/* ⚠ O sistema MUTA entrada de catalogo (o Roubo escreve em escolha.opcoes), e
   sem a copia funda isso vazava para dentro do pacote gravado na criatura. */
doCatalogo.escolha.opcoes = ["MUTADO"];
t("mutar o catalogo NAO vaza para o pacote",
  doPacote.escolha.opcoes, [{ id: "o1", nome: "O1" }]);
AD.limparAddons();

/* ---- encontro misto ---- */
const c1 = createBlankAfty(); c1.addons = [PACOTE];
const c2 = createBlankAfty(); c2.addons = [B];
const c3 = createBlankAfty(); c3.addons = [{ ...PACOTE, versao: "2.0.0" }];
t("uniao de fichas diferentes junta os dois", AD.unirAddons([c1, c2]).pacotes.length, 2);
t("uniao sem divergencia", AD.unirAddons([c1, c2]).divergencias.length, 0);
t("mesmo pacote em duas versoes e RELATADO", AD.unirAddons([c1, c3]).divergencias.length, 1);
t("e vale a primeira versao", AD.unirAddons([c1, c3]).pacotes[0].versao, "1.0.0");
t("ficha sem addon nao atrapalha", AD.unirAddons([createBlankAfty(), c1]).pacotes.length, 1);

/* ---- marcas declaradas ---- */
AD.limparAddons();
AD.aplicarAddons([PACOTE]);
t("marcas declaradas listam a do addon",
  AD.marcasDeclaradas().find((m) => m.marca === "adaptacao")?.quantas, 2);

/* ---- limpeza, para nao deixar o mundo sujo ---- */
AD.limparAddons();
t("mundo limpo no fim", H.AFTY_HABILIDADES.length, QUANTAS_RAW);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
