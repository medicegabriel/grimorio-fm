/**
 * BENÇÃO DO GRÃO MESTRE DA FORJA, e o pool exclusivo em GRUPOS do jogador.
 *
 * Pedido do autor em 2026-09-11. O pacote é `addons/bencao-grao-mestre-forja.json`
 * e ele só LIBERA: `segundaHabilidadeUnica` (todo item de Grau Especial ganha
 * uma segunda Habilidade Única) e `acessoriosUnicos` (acessório criado pelo
 * Addon, com duas Habilidades Únicas).
 *
 * A regra de disputa veio junto, e ela é MAIOR que o addon: o pool exclusivo do
 * jogador deixa de ser um só (divergência `poolExclusivo`). Palavras do autor:
 *
 *   "NÃO SE ACUMULAM (Feitiços Passivos; Feitiços Auxiliares; Novo Estilo das
 *    Sombras; Técnicas Marciais) SE ACUMULAM COM OS ACIMAS E ENTRE SI (Ações
 *    Invocações, Caracteristicas Invocações; Habilidades Únicas de Itens)"
 *   "Primeiro Efeito não se acumula com outros itens. Mas se acumula com
 *    Segundo Efeito. [...] Primeiro Efeito = +6 de Acerto e Segundo Efeito = +6
 *    de Acerto. Fica +12 de Acerto."
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. Toda família do pool declara o grupo do jogador, e a chave da criatura não
 *    mudou de formato.
 * 2. Os NÚMEROS do autor, na ficha de jogador, contra o `deriveAfty` inteiro.
 * 3. A criatura segue no pool único, com a segunda Habilidade Única dentro dele.
 * 4. Sem o Addon a segunda não conta, e o que foi escrito continua na ficha.
 * 5. O Acessório Único: Grau Especial, pesa 1, sem custo, só equipado, e só com
 *    a liberação.
 * 6. A segunda ativa ganha interruptor PRÓPRIO na bancada.
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
const { normalizarPacote, validarPacote, LIBERACOES, liberacoesDaCriatura } = await import(R + "afty-addons.js");
const EF = await import(R + "afty-efeitos.js");
const S = await import(R + "afty-sistema.js");
const EQ = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = normalizarPacote(
  JSON.parse(readFileSync(new URL("../addons/bencao-grao-mestre-forja.json", import.meta.url), "utf8")),
);

/* ============================================================ */
/* 1. O PACOTE E AS LIBERAÇÕES                                   */
/* ============================================================ */
t("o pacote valida sem problema nenhum", validarPacote(pacote), []);
t("ele só libera, e as duas", pacote.libera, ["segundaHabilidadeUnica", "acessoriosUnicos"]);
t("a segunda está registrada", LIBERACOES.some((l) => l.id === "segundaHabilidadeUnica"), true);
t("o acessório está registrado", LIBERACOES.some((l) => l.id === "acessoriosUnicos"), true);
t("o nome é o do autor", pacote.nome, "Benção do Grão Mestre da Forja");
t("instalado, a ficha tem as duas",
  liberacoesDaCriatura({ addons: [pacote] }), ["segundaHabilidadeUnica", "acessoriosUnicos"]);

/* ============================================================ */
/* 2. OS GRUPOS, na unidade                                      */
/* ============================================================ */
t("a divergência está ligada",
  [S.regraDo("afty", "poolExclusivo"), S.regraDo("player", "poolExclusivo")], ["afty", "player"]);

/* ⚠ Família sem `grupoJogador` disputaria só consigo mesma no jogador, que é
   somar por cima de tudo sem ninguém ter decidido. Toda família nova tem de
   declarar o grupo. */
for (const f of EF.FAMILIAS_EXCLUSIVAS) {
  t(`${f.id} declara o grupo do jogador`, typeof f.grupoJogador === "string" && f.grupoJogador.length > 0, true);
}
t("a oitava família existe", !!EF.getFamiliaExclusiva("segundaHabilidadeUnica"), true);

const grupos = Object.fromEntries(EF.FAMILIAS_EXCLUSIVAS.map((f) => [f.id, f.grupoJogador]));
t("os grupos do jogador, um a um", grupos, {
  habilidadeUnica: "habilidadeUnica",
  feiticoAuxiliarPassivo: "feiticos",
  shikigamiCaracteristica: "shikigamiCaracteristica",
  feiticoAuxiliarAtivo: "feiticos",
  shikigamiAcao: "shikigamiAcao",
  estiloSombra: "feiticos",
  funcionamentoBasico: "feiticos",
  segundaHabilidadeUnica: "feiticos",
});
t("na criatura toda família cai no pool único",
  EF.FAMILIAS_EXCLUSIVAS.every((f) => EF.grupoExclusivo(f.id, false) === EF.GRUPO_POOL_UNICO), true);

/* A chave da criatura é a de antes, byte a byte: o `aplicado` que um estágio
   passa ao outro não pode trocar de formato por causa do jogador. */
t("chave sem grupo é a antiga", EF.chaveExclusiva("defesa", null, 3), "defesa|*|+");
t("chave do pool único é a antiga", EF.chaveExclusiva("defesa", null, 3, "pool"), "defesa|*|+");
t("chave de grupo leva o grupo na frente", EF.chaveExclusiva("defesa", null, -2, "feiticos"), "feiticos#defesa|*|-");

t("sem grupos o carimbo devolve a MESMA lista",
  (() => { const l = [{ canal: "defesa", expr: "1", exclusivo: "habilidadeUnica" }]; return EF.carimbarGrupoExclusivo(l, false) === l; })(),
  true);

/** Aplica e fecha a disputa de uma lista, com ou sem grupos. */
const disputa = (efeitos, emGrupos) => EF.valorCanal(
  EF.resolverExclusivos(EF.aplicarEfeitos(EF.carimbarGrupoExclusivo(efeitos, emGrupos), {})),
  "defesa",
);
const ef = (familia, valor) => ({ canal: "defesa", expr: String(valor), exclusivo: familia, nome: familia });

t("jogador: Funcionamento Básico disputa com Feitiço",
  disputa([ef("funcionamentoBasico", 3), ef("feiticoAuxiliarPassivo", 4)], true), 4);
t("jogador: Estilo disputa com Feitiço",
  disputa([ef("estiloSombra", 5), ef("feiticoAuxiliarPassivo", 4)], true), 5);
t("jogador: Auxiliar Ativo disputa com Passivo",
  disputa([ef("feiticoAuxiliarAtivo", 2), ef("feiticoAuxiliarPassivo", 4)], true), 4);
t("jogador: a primeira soma com Feitiço",
  disputa([ef("habilidadeUnica", 3), ef("feiticoAuxiliarPassivo", 4)], true), 7);
t("jogador: a primeira não soma com a primeira",
  disputa([ef("habilidadeUnica", 3), ef("habilidadeUnica", 3)], true), 3);
t("jogador: a segunda não soma com a segunda",
  disputa([ef("segundaHabilidadeUnica", 2), ef("segundaHabilidadeUnica", 2)], true), 2);
t("jogador: a primeira soma com a segunda (o +12 do autor)",
  disputa([ef("habilidadeUnica", 6), ef("segundaHabilidadeUnica", 6)], true), 12);
t("jogador: a penalidade também disputa por grupo",
  disputa([ef("habilidadeUnica", -3), ef("feiticoAuxiliarPassivo", -4)], true), -7);
t("criatura: o mesmo par fica com o maior",
  disputa([ef("habilidadeUnica", 6), ef("segundaHabilidadeUnica", 6)], false), 6);
t("criatura: a primeira e o Feitiço seguem disputando",
  disputa([ef("habilidadeUnica", 3), ef("feiticoAuxiliarPassivo", 4)], false), 4);

/* ============================================================ */
/* 3. NA FICHA INTEIRA                                           */
/* ============================================================ */
const ARMA = EQ.catalogoDoTipo("arma").find((a) => a.classe === "simples" && a.grupo !== "pugilato").id;
const UNIFORME = EQ.catalogoDoTipo("uniforme")[0].id;

/** Uma entrada de Ferramenta com as duas Habilidades Únicas escritas. */
const ferramenta = (uid, tipo, refId, { grau = "especial", hu1 = [], hu2 = [] } = {}) => ({
  uid, tipo, refId, qtd: 1, equipado: true,
  fa: {
    grau, encantamentos: [],
    habilidadeUnica: "Primeira", habilidadeEfeitos: hu1,
    segundaHabilidadeUnica: "Segunda", segundaHabilidadeEfeitos: hu2,
  },
});
const def = (valor, extra = {}) => ({ canal: "defesa", expr: String(valor), ...extra });

/** Uma ficha com o que se pede, no sistema pedido. */
const ficha = (sistema, { itens = [], addon = true, passivo = null, acessorios = [], combate = null } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 17, tipo: "misto", patamar: "comum" };
  f.equipamentos = { itens };
  if (acessorios.length) f.acessoriosUnicos = acessorios;
  if (passivo != null) {
    f.feiticos = [{ id: "fp1", tipo: "passivo", nome: "Passiva", nivel: 1, efeitosPassivo: [def(passivo)] }];
  }
  if (addon) f.addons = [pacote];
  if (combate) f.combate = { ativo: true, ...combate };
  return f;
};

/** Quanto a Defesa sobe pelas Habilidades Únicas, contra a mesma ficha sem efeito nenhum nelas. */
const ganho = (sistema, montar, opcoes = {}) => {
  const com = deriveAfty(ficha(sistema, { ...opcoes, itens: montar(true) })).defesa;
  const sem = deriveAfty(ficha(sistema, { ...opcoes, itens: montar(false), passivo: null })).defesa;
  return com - sem;
};

const arma = (hu1, hu2) => (liga) => [ferramenta("e1", "arma", ARMA, liga ? { hu1, hu2 } : {})];

t("jogador: a primeira +3 e a segunda +2 somam", ganho("player", arma([def(3)], [def(2)])), 5);
t("jogador: com Passiva +4, a segunda perde para ela e a primeira soma",
  ganho("player", arma([def(3)], [def(2)]), { passivo: 4 }), 7);
t("jogador: com Passiva +1, a segunda vence",
  ganho("player", arma([def(3)], [def(2)]), { passivo: 1 }), 5);
t("jogador sem o Addon: a segunda não conta", ganho("player", arma([def(3)], [def(2)]), { addon: false }), 3);
t("jogador sem o Addon: a primeira já soma com a Passiva, que é a divergência sozinha",
  ganho("player", arma([def(3)], []), { addon: false, passivo: 4 }), 7);

t("criatura: a primeira e a segunda disputam", ganho("afty", arma([def(3)], [def(2)])), 3);
t("criatura: com a Passiva, fica só o maior dos três",
  ganho("afty", arma([def(3)], [def(2)]), { passivo: 4 }), 4);
t("criatura sem o Addon: igual à de antes", ganho("afty", arma([def(3)], []), { addon: false, passivo: 4 }), 4);

const doisItens = (hu1, hu2) => (liga) => [
  ferramenta("e1", "arma", ARMA, liga ? { hu1, hu2 } : {}),
  ferramenta("e2", "uniforme", UNIFORME, liga ? { hu1, hu2 } : {}),
];
t("jogador: a primeira de dois itens não soma", ganho("player", doisItens([def(3)], [])), 3);
t("jogador: a segunda de dois itens não soma", ganho("player", doisItens([], [def(2)])), 2);
t("jogador: dois itens com as duas", ganho("player", doisItens([def(3)], [def(2)])), 5);

t("item abaixo do Especial não tem nenhuma das duas",
  deriveAfty(ficha("player", { itens: [ferramenta("e1", "arma", ARMA, { grau: "primeiro", hu1: [def(3)], hu2: [def(2)] })] })).defesa
  - deriveAfty(ficha("player", { itens: [ferramenta("e1", "arma", ARMA, { grau: "primeiro" })] })).defesa,
  0);

/* O resumo da Ferramenta diz se a segunda existe, e a tela lê daqui. */
const entradaDe = (f) => deriveAfty(f).equip.entradas[0];
t("com o Addon a Ferramenta Especial tem a segunda",
  entradaDe(ficha("player", { itens: [ferramenta("e1", "arma", ARMA)] })).fa.temSegundaUnica, true);
t("sem o Addon não tem",
  entradaDe(ficha("player", { itens: [ferramenta("e1", "arma", ARMA)], addon: false })).fa.temSegundaUnica, false);
t("sem o Addon o texto escrito continua na ficha",
  entradaDe(ficha("player", { itens: [ferramenta("e1", "arma", ARMA)], addon: false })).fa.segundaHabilidadeUnica, "Segunda");

/* O hover diz de onde veio: cada Habilidade com o nome dela. */
const nomes = deriveAfty(ficha("player", { itens: arma([def(3)], [def(2)])(true) })).equip.efeitosUnica.map((e) => e.nome);
t("as duas linhas se nomeiam", nomes.some((n) => n.endsWith("(Habilidade Única)")) && nomes.some((n) => n.endsWith("(Segunda Habilidade Única)")), true);

/* ============================================================ */
/* 4. A SEGUNDA ATIVA TEM INTERRUPTOR PRÓPRIO                    */
/* ============================================================ */
const ativa = (liga) => [ferramenta("e1", "arma", ARMA, liga ? { hu2: [def(2, { modo: "ativa" })] } : {})];
const estado = EQ.estadoDaSegundaUnica("e1");
t("o interruptor é outro que o da primeira", estado !== EQ.estadoDaUnica("e1"), true);
t("ele aparece na bancada",
  deriveAfty(ficha("player", { itens: ativa(true) })).combate.estadosExtras.some((e) => e.id === estado), true);
t("desligado não dá nada", ganho("player", ativa), 0);
t("ligado dá o +2", ganho("player", ativa, { combate: { [estado]: true } }), 2);

/* ============================================================ */
/* 5. O ACESSÓRIO ÚNICO                                          */
/* ============================================================ */
const acessorio = (hu1, hu2) => ({
  id: "acsu_t1", nome: "Anel", habilidadeUnica: "Um", habilidadeEfeitos: hu1,
  segundaHabilidadeUnica: "Dois", segundaHabilidadeEfeitos: hu2,
});
const noInventario = (equipado = true) => [{ uid: "a1", tipo: "item", refId: "acsu_t1", qtd: 1, equipado }];
const comAcessorio = (hu1, hu2, opcoes = {}) => {
  const f = ficha("player", { itens: noInventario(opcoes.equipado ?? true), acessorios: [acessorio(hu1, hu2)], ...opcoes });
  // A comparação é sem a Passiva, como no `ganho`: o que se mede é o total das
  // Habilidades Únicas contra a Passiva, e não só o que passa dela.
  const vazio = ficha("player", { itens: noInventario(opcoes.equipado ?? true), acessorios: [acessorio([], [])], ...opcoes, passivo: null });
  return deriveAfty(f).defesa - deriveAfty(vazio).defesa;
};

t("equipado, as duas somam", comAcessorio([def(3)], [def(2)]), 5);
t("o grau que a expressão lê é o Especial", comAcessorio([def("grau")], []), 5);
t("desequipado não dá nada", comAcessorio([def(3)], [def(2)], { equipado: false }), 0);
t("sem o Addon não dá nada", comAcessorio([def(3)], [def(2)], { addon: false }), 0);
t("com a Passiva +4, a segunda perde e a primeira soma", comAcessorio([def(3)], [def(2)], { passivo: 4 }), 7);

const dAcs = deriveAfty(ficha("player", { itens: noInventario(), acessorios: [acessorio([def(3)], [])] }));
t("pesa 1", dAcs.equip.espacosUsados, 1);
t("não gasta orçamento de custo", dAcs.equip.custoGasto, { 1: 0, 2: 0, 3: 0, 4: 0 });
t("não vira Ferramenta", dAcs.equip.entradas[0].fa, null);
t("o editor recebe as linhas resolvidas", dAcs.equip.acessoriosUnicos[0].habilidadeEfeitos[0].valor, 3);

const f1 = ficha("player", { acessorios: [acessorio([], [])] });
t("entra no catálogo de Itens Especiais da ficha", EQ.catalogoDoTipo("item", f1).some((d) => d.id === "acsu_t1"), true);
t("e só no da ficha", EQ.catalogoDoTipo("item").some((d) => d.id === "acsu_t1"), false);
const acsDef = EQ.getEquipamento("item", "acsu_t1", f1);
t("é acessório", acsDef.categoria, "acessorio");
t("sem custo", EQ.custoDoEquipamento("item", acsDef), 0);
t("um espaço", EQ.espacosDoEquipamento("item", acsDef), 1);
t("um por ficha", acsDef.unico, true);

t("sem nome ganha um", EQ.saneiaAcessorioUnico({ id: "acsu_x", nome: "  " }).nome, "Acessório sem Nome");
t("id de fora do molde é recusado", EQ.saneiaAcessorioUnico({ id: "armc_x", nome: "A" }), null);
t("o texto do item são as duas Habilidades",
  EQ.saneiaAcessorioUnico({ id: "acsu_x", habilidadeUnica: "Um ", segundaHabilidadeUnica: " Dois" }).descricao, "Um\n\nDois");
t("id repetido entra uma vez",
  EQ.acessoriosUnicosDaFicha({ acessoriosUnicos: [acessorio([], []), acessorio([], [])] }).length, 1);
t("o novo nasce no molde", EQ.novoAcessorioUnico().id.startsWith("acsu_"), true);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
