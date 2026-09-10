/**
 * O `inacessiveis` NASCIA CEGO, e a Ficha Final acusava pré-requisito atendido
 * como não atendido.
 *
 * Achado pelo autor em 2026-09-09, com uma captura: *"A Ficha deu 'Pre-Requisito
 * não atendido' sendo que possuo Cobrir-se e Revestimento Constante"*.
 *
 * ------------------------------------------------------------
 * A CAUSA
 * ------------------------------------------------------------
 * O `resolveHabilidades` monta o contexto de requisito com QUATRO campos
 * (`niveisPorEspec`, `escolhidas`, `escolhasHabilidade`, `almaLivre`), e o
 * avaliador pergunta por outros CINCO que não estão lá. Um requisito de Aptidão
 * faz `(ctx.aptidoes || []).includes(...)` contra uma lista `undefined`, e a
 * resposta é SEMPRE falsa. O mesmo para atributo, perícia, TR e Ofício.
 *
 * ⚠ Nada disso aparecia no criador, porque ele monta o ctx com o `derived`
 * PRONTO. Só a Ficha lia o campo cego, e ela é a tela de JOGO: o erro aparecia
 * na mesa, não na criação.
 *
 * São 38 entradas do catálogo com pelo menos um requisito desses, 26 em
 * Habilidades e 12 em Talentos.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O CASO DO AUTOR, nos dois sentidos. Com Cobrir-se não avisa, sem Cobrir-se
 *    avisa. A segunda metade é a que importa: um conserto que só silencia o
 *    aviso seria pior que o bug.
 * 2. OS CINCO TIPOS CEGOS, um fixture cada: aptidão, atributo, perícia, TR e
 *    Ofício. Cada um medido atendido E não atendido.
 * 3. TALENTO TAMBÉM. Ele já recebia `attrEff` e `aptidoes` na chamada e ficava
 *    cego só para os três de treino.
 * 4. ⚠ O QUE NÃO PRECISAVA DE CONSERTO CONTINUA COMO ESTAVA. As Gerais só
 *    perguntam ND e as Lendárias só ND e nível de classe, então os outros dois
 *    `inacessiveis` do derivado não foram tocados. Isto é medido, não suposto:
 *    o assert varre os catálogos e falha se algum dia entrar ali um requisito
 *    que o ctx daqueles resolvers não saiba responder.
 * 5. O REQUISITO DE NÍVEL, que sempre funcionou, continua funcionando. O
 *    conserto reavalia TUDO de novo, então ele podia ter afrouxado o que já
 *    estava certo.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
/* ⚠ O derive PRIMEIRO. Importar `afty-habilidades.js` antes dele estoura o ciclo
   do `afty-combate.js` (ver a entrada em docs/a-fazer.md). */
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const H = await import(R + "afty-habilidades.js");
const T = await import(R + "afty-talentos.js");
const G = await import(R + "afty-gerais.js");
const AN = await import(R + "afty-alto-nivel.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/**
 * Ficha de jogador montada por peça. Tudo o que os requisitos cegos leem entra
 * por aqui, e nada mais: é o mínimo para a pergunta ser sobre o requisito.
 */
function ficha({
  classe = "conjurador", nivel = 12, habs = [], talentos = [], aptidoes = [],
  con = 10, des = 14, pericias = {}, resistencias = {}, oficios = {},
} = {}) {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.name = "Cobaia";
  f.core = { ...f.core, nd: nivel, tipo: "conjurador", patamar: "comum",
    origem: { ...(f.core.origem ?? {}), id: "inato" } };
  f.especializacoes = [{ id: classe, nivel }];
  f.attributes = { forca: 10, destreza: des, constituicao: con, inteligencia: 16, sabedoria: 12, presenca: 12 };
  f.habilidades = habs;
  f.talentos = talentos;
  f.aptidoesAmaldicoadas = aptidoes;
  f.pericias = pericias;
  f.resistenciasProf = resistencias;
  f.periciaOficios = oficios;
  return deriveAfty(f);
}

/** A habilidade `id` está marcada como inacessível nesta ficha? */
const acusa = (d, id) => (d.habilidades.inacessiveis ?? []).includes(id);
const acusaTal = (d, id) => (d.talentos.inacessiveis ?? []).includes(id);

/* ============================================================ */
/* 1. O CASO DO AUTOR                                            */
/* ============================================================ */

/* *"possuo Cobrir-se e Revestimento Constante"*, e a Ficha acusava assim mesmo. */
t("com Cobrir-se, o Revestimento Constante NAO e acusado",
  acusa(ficha({ aptidoes: ["cobrir_se"], habs: ["cnj_revestimento_constante"] }), "cnj_revestimento_constante"),
  false);

/* ⚠ A METADE QUE IMPEDE O CONSERTO DE SER UM SILENCIADOR. Sem a Aptidão, o
   aviso TEM de continuar aparecendo: o requisito é real e bloqueia de verdade. */
t("sem Cobrir-se, ele continua sendo acusado",
  acusa(ficha({ aptidoes: [], habs: ["cnj_revestimento_constante"] }), "cnj_revestimento_constante"),
  true);

/* As outras duas que pedem a mesma Aptidão andam junto. */
for (const id of ["cnj_explosao_defensiva", "cnj_fisico_amaldicoado_defensivo"]) {
  t(`${id} com a Aptidao`, acusa(ficha({ aptidoes: ["cobrir_se"], habs: [id] }), id), false);
  t(`${id} sem a Aptidao`, acusa(ficha({ aptidoes: [], habs: [id] }), id), true);
}

/* ============================================================ */
/* 2. OS CINCO TIPOS CEGOS, UM FIXTURE CADA                      */
/* ============================================================ */

/* ---- atributo: Sobrevivente (Lutador 4°) pede Constituição 16 ---- */
t("Sobrevivente com Constituicao 16",
  acusa(ficha({ classe: "lutador", con: 16, habs: ["lut_sobrevivente"] }), "lut_sobrevivente"), false);
t("Sobrevivente com Constituicao 10",
  acusa(ficha({ classe: "lutador", con: 10, habs: ["lut_sobrevivente"] }), "lut_sobrevivente"), true);

/* ---- perícia: Naturalidade com Rituais pede Prestidigitação treinada ---- */
t("Naturalidade com Rituais com a pericia treinada",
  acusa(ficha({ habs: ["cnj_naturalidade_com_rituais"], pericias: { prestidigitacao: "treinado" } }),
    "cnj_naturalidade_com_rituais"), false);
t("Naturalidade com Rituais sem a pericia",
  acusa(ficha({ habs: ["cnj_naturalidade_com_rituais"] }), "cnj_naturalidade_com_rituais"), true);

/* ⚠ E a FAIXA importa: Sentidos Aguçados pede Percepção MESTRE, e treinado não
   basta. Sem isto o conserto poderia ter passado a aceitar qualquer marca. */
t("Sentidos Agucados com Percepcao mestre",
  acusa(ficha({ habs: ["cnj_sentidos_agucados"], pericias: { percepcao: "mestre" } }),
    "cnj_sentidos_agucados"), false);
t("Sentidos Agucados com Percepcao so treinada",
  acusa(ficha({ habs: ["cnj_sentidos_agucados"], pericias: { percepcao: "treinado" } }),
    "cnj_sentidos_agucados"), true);

/* ---- TR: Primeiro Disparo pede Reflexos treinado ---- */
t("Primeiro Disparo com Reflexos treinado",
  acusa(ficha({ habs: ["cnj_primeiro_disparo"], resistencias: { reflexos: "treinado" } }),
    "cnj_primeiro_disparo"), false);
t("Primeiro Disparo sem Reflexos",
  acusa(ficha({ habs: ["cnj_primeiro_disparo"] }), "cnj_primeiro_disparo"), true);

/* ---- Ofício: Criar Medicina (Suporte 8°) pede Ferramentas de Médico ----
   ⚠ O Ofício é o terceiro mapa, e ele pergunta o NOME da vaga, e não a faixa.
   Um assert de perícia sozinho não cobriria este caminho. */
const comOficio = ficha({
  classe: "suporte", habs: ["sup_criar_medicina"],
  pericias: { oficio: "treinado" }, oficios: { oficio: ["Ferramentas de Médico"] },
});
const oficioErrado = ficha({
  classe: "suporte", habs: ["sup_criar_medicina"],
  pericias: { oficio: "treinado" }, oficios: { oficio: ["Ferramentas de Ferreiro"] },
});
t("Criar Medicina com Ferramentas de Medico", acusa(comOficio, "sup_criar_medicina"), false);
t("Criar Medicina com o oficio ERRADO", acusa(oficioErrado, "sup_criar_medicina"), true);

/* ============================================================ */
/* 3. TALENTO TAMBÉM                                             */
/* ============================================================ */

t("Robustez Aprimorada com Constituicao 14",
  acusaTal(ficha({ con: 14, talentos: ["tal_robustez_aprimorada"] }), "tal_robustez_aprimorada"), false);
t("Robustez Aprimorada com Constituicao 10",
  acusaTal(ficha({ con: 10, talentos: ["tal_robustez_aprimorada"] }), "tal_robustez_aprimorada"), true);

/* O de treino é o que o Talento não enxergava: ele já recebia `attrEff`. */
t("Movimentos Acrobaticos com Acrobacia treinada",
  acusaTal(ficha({ talentos: ["tal_movimentos_acrobaticos"], pericias: { acrobacia: "treinado" } }),
    "tal_movimentos_acrobaticos"), false);
t("Movimentos Acrobaticos sem Acrobacia",
  acusaTal(ficha({ talentos: ["tal_movimentos_acrobaticos"] }), "tal_movimentos_acrobaticos"), true);

/* ============================================================ */
/* 4. ⚠ O QUE O CONSERTO NÃO TOCOU, E POR QUE PODE FICAR ASSIM   */
/* ============================================================ */

/* As Gerais e as Lendárias têm `inacessiveis` próprios e ficaram como estavam.
   Isso só é seguro enquanto os requisitos delas couberem no ctx que os
   resolvers montam. Este assert varre os catálogos e fica VERMELHO no dia em que
   entrar ali um requisito de aptidão, atributo, perícia, TR ou Ofício, que é
   exatamente o descuido que criou o bug original. */
const CEGOS = ["aptidao", "atributo", "pericia", "resistencia", "periciaAtributo", "oficio"];
const tiposDe = (lista) =>
  [...new Set((lista ?? []).flatMap((x) => (x.requisitos ?? []).map((r) => r.tipo)))].sort();

t("as Gerais nao pedem nada que o ctx delas nao veja",
  tiposDe(G.HABILIDADES_GERAIS).filter((x) => CEGOS.includes(x)), []);
t("as Lendarias tambem nao",
  tiposDe(AN.HABILIDADES_LENDARIAS).filter((x) => CEGOS.includes(x)), []);
t("nem as Melhorias Superiores",
  tiposDe(AN.MELHORIAS_SUPERIORES).filter((x) => CEGOS.includes(x)), []);
t("nem as Apices",
  tiposDe(AN.HABILIDADES_APICE).filter((x) => CEGOS.includes(x)), []);

/* E o tamanho do estrago fica registrado: se o número mudar, alguém mexeu no
   catálogo e vale reler esta lista. */
const quantos = (lista) =>
  (lista ?? []).filter((h) => (h.requisitos ?? []).some((r) => CEGOS.includes(r.tipo))).length;
t("26 Habilidades dependem de um requisito antes cego", quantos(H.AFTY_HABILIDADES), 26);
t("e 12 Talentos", quantos(T.AFTY_TALENTOS), 12);

/* ============================================================ */
/* 5. O QUE JÁ FUNCIONAVA CONTINUA FUNCIONANDO                   */
/* ============================================================ */

/* ⚠ O conserto REAVALIA TUDO de novo, e não só o que estava cego. Um ctx montado
   errado ali poderia ter afrouxado o requisito de nível, que sempre funcionou e
   é o mais comum do catálogo. */
t("uma habilidade de 8 num Conjurador 12 passa",
  acusa(ficha({ nivel: 12, habs: ["cnj_sustentacao_avancada"] }), "cnj_sustentacao_avancada"), false);
t("e a mesma num Conjurador 4 e acusada",
  acusa(ficha({ nivel: 4, habs: ["cnj_sustentacao_avancada"] }), "cnj_sustentacao_avancada"), true);

/* O requisito de HABILIDADE (uma pede a outra) também sobrevive. */
const pedeOutra = H.AFTY_HABILIDADES.find((h) => (h.requisitos ?? []).some((r) => r.tipo === "habilidade"));
if (pedeOutra) {
  const exigida = pedeOutra.requisitos.find((r) => r.tipo === "habilidade").id;
  const classe = pedeOutra.especializacaoId;
  t(`${pedeOutra.id} com a habilidade exigida`,
    acusa(ficha({ classe, nivel: 20, habs: [exigida, pedeOutra.id] }), pedeOutra.id), false);
  t(`${pedeOutra.id} sem ela`,
    acusa(ficha({ classe, nivel: 20, habs: [pedeOutra.id] }), pedeOutra.id), true);
}

/* ⚠ E a ficha VAZIA não acusa nada. É a rede final: um ctx quebrado (um campo
   com o nome errado, por exemplo) reprovaria o catálogo inteiro, e todos os
   asserts de "acusa=true" acima continuariam verdes. */
const limpa = ficha({});
t("ficha sem habilidade escolhida nao acusa nada", limpa.habilidades.inacessiveis, []);
t("e sem talento tambem nao", limpa.talentos.inacessiveis, []);

/* As Bases que o jogador ganha de graça são muitas e nenhuma pode ser acusada
   por engano: elas nem passam por escolha. */
const conjurador20 = ficha({ nivel: 20 });
t("um Conjurador 20 ganha as Bases e nenhuma e acusada",
  [conjurador20.habilidades.escolhidas.length > 0, conjurador20.habilidades.inacessiveis],
  [true, []]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
