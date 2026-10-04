/**
 * ESPINHO: as Almas, o que elas compram, e o Alter.
 *
 * Pedido do autor em 2026-09-30. Os pacotes são `addons/espinho.json` (o
 * catálogo) e `addons/alter.json` (só o multiplicador de teto). O verbo mora em
 * `src/systems/afty/afty-espinho.js`, e o guia em `docs/afty-espinho.md`.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. Cada compra chega no orçamento certo, NOS DOIS SISTEMAS, medida como
 *    DIFERENÇA contra a mesma ficha sem a compra (e nunca contra um número
 *    absoluto, que mudaria com qualquer regra de classe).
 * 2. O teto escala com o BT, e o Alter multiplica com UM piso só, no fim.
 * 3. Passar do teto ou das Almas AVISA e não remove nada.
 * 4. O Determinado a Viver Adicional entra sem gastar vaga e fica fora do
 *    seletor.
 * 5. O Equipamento marcado vira Grau Especial por derivação, e a Habilidade
 *    Única do Aprimoramento disputa na família da primeira, sem Slot de Feitiço.
 * 6. Sem o pacote nada rende, e tirar só o `permite` não muda número.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const E = await import(R + "afty-espinho.js");
const EQ = await import(R + "afty-equipamentos.js");
const { EFEITO_CANAIS, EFEITO_CANAL_GRUPOS } = await import(R + "afty-efeitos.js");
const { gruposDeTalento } = await import(R + "afty-talentos.js");
const { resumoAtributos } = await import(R + "afty-atributos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ler = (nome) => JSON.parse(readFileSync(fileURLToPath(new URL(`../addons/${nome}`, import.meta.url)), "utf8"));
const espinho = A.normalizarPacote(ler("espinho.json"));
const alter = A.normalizarPacote(ler("alter.json"));
// O Talento Adicional é conteúdo de catálogo, e precisa do registro.
A.aplicarAddons([espinho, alter]);
const TALENTO = "espinho:tal_determinado_a_viver_adicional";

/* ============================================================ */
/* 1. OS PACOTES E A PRIMITIVA                                   */
/* ============================================================ */
t("o Espinho valida sem problema", A.validarPacote(espinho), []);
t("o Alter valida sozinho, só com o multiplicador", A.validarPacote(alter), []);
t("o Espinho pede a primitiva dele", espinho.permite, ["espinho"]);
t("e a primitiva existe", A.PRIMITIVAS.some((p) => p.id === "espinho"), true);
t("o Alter não pede tela nenhuma", alter.permite, []);

const cfg = A.espinhoDaFicha({ addons: [espinho] });
t("o catálogo tem os 13 itens do pedido", cfg.itens.map((i) => i.id), [
  "especializacao", "talento", "aptidao", "nivel_aptidao", "treinamento", "lendaria", "melhoria",
  "alma", "atributo", "determinado", "pericia", "aprimoramento", "equipamento",
]);
t("os custos são os do pedido", cfg.itens.map((i) => i.custo), [6, 4, 6, 6, 2, 6, 4, 6, 4, 15, 3, 10, 10]);
t("o Talento concedido ganha o namespace do pacote", cfg.itens.find((i) => i.id === "determinado").concedeTalento, TALENTO);
t("sem o Alter o multiplicador é 1", cfg.multiplicadorTeto, 1);
t("com o Alter é 1,5", A.espinhoDaFicha({ addons: [espinho, alter] }).multiplicadorTeto, 1.5);
t("dois multiplicadores: vale o maior, e não o produto",
  A.espinhoDaFicha({ addons: [espinho, alter, { espinho: { multiplicadorTeto: 1.2 } }] }).multiplicadorTeto, 1.5);
t("item repetido em outro pacote: vale o primeiro",
  A.espinhoDaFicha({ addons: [espinho, { id: "x", espinho: { itens: [{ id: "talento", nome: "Outro", custo: 1, efeitos: [{ canal: "vagasTalento" }] }] } }] })
    .itens.find((i) => i.id === "talento").custo, 4);
t("sem pacote nenhum não há catálogo", A.espinhoDaFicha({ addons: [] }).itens, []);

/* O portão duro da instalação. */
const invalido = (espinhoCampo) => A.validarPacote({ id: "teste", nome: "Teste", paraRaw: "afty", espinho: espinhoCampo });
t("custo negativo reprova", invalido({ itens: [{ id: "a", nome: "A", custo: -1, efeitos: [{ canal: "focos" }] }] }).length > 0, true);
t("custo quebrado reprova", invalido({ itens: [{ id: "a", nome: "A", custo: 1.5, efeitos: [{ canal: "focos" }] }] }).length > 0, true);
t("tipo desconhecido reprova", invalido({ itens: [{ id: "a", nome: "A", custo: 1, tipo: "magia" }] }).length > 0, true);
t("teto que não compila reprova", invalido({ itens: [{ id: "a", nome: "A", custo: 1, teto: "bt +", efeitos: [{ canal: "focos" }] }] }).length > 0, true);
t("item de efeitos sem efeito reprova", invalido({ itens: [{ id: "a", nome: "A", custo: 1 }] }).length > 0, true);
t("Aprimoramento sem Equipamento reprova", invalido({ itens: [{ id: "a", nome: "A", custo: 1, tipo: "aprimoramento" }] }).length > 0, true);
t("campo vazio reprova", invalido({}).length > 0, true);
t("Talento que não existe em lugar nenhum reprova",
  invalido({ itens: [{ id: "a", nome: "A", custo: 1, tipo: "talento", concedeTalento: "nao_existe" }] }).length > 0, true);

/* O canal novo. */
t("o canal pontosAtributo existe", EFEITO_CANAIS.some((c) => c.id === "pontosAtributo"), true);
t("e mora no grupo Orçamentos",
  EFEITO_CANAL_GRUPOS.find((g) => g.label === "Orçamentos").itens.some((c) => c.id === "pontosAtributo"), true);

/* ============================================================ */
/* 2. A FICHA DE PROVA                                           */
/* ============================================================ */
const ARMA = EQ.catalogoDoTipo("arma").find((a) => a.classe === "simples" && a.grupo !== "pugilato").id;
const UNIFORME = EQ.catalogoDoTipo("uniforme")[0].id;

const ficha = ({
  sistema = "player", nd = 9, compras = {}, almas = 200, outros = 0,
  equipamentos = [], itens = [], addons = [espinho], passivo = null,
} = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, nivel: nd, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "lutador", nivel: nd }];
  f.attributes = { forca: 16, destreza: 14, constituicao: 16, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.addons = addons;
  f.espinho = { almas, outros, compras, equipamentos };
  f.equipamentos = { itens };
  if (passivo != null) {
    f.feiticos = [{ id: "fp1", tipo: "passivo", nome: "Passiva", nivel: 1, efeitosPassivo: [{ canal: "defesa", expr: String(passivo) }] }];
  }
  return f;
};
const item = (d, id) => d.espinho.itens.find((i) => i.id === id);

/* ============================================================ */
/* 3. O TETO                                                     */
/* ============================================================ */
for (const nd of [1, 5, 9, 13, 17, 21]) {
  const d = deriveAfty(ficha({ nd }));
  const bt = d.maestria;
  t(`nível ${nd}: tetos pelo BT ${bt}`,
    ["especializacao", "talento", "aptidao", "nivel_aptidao", "treinamento", "lendaria", "melhoria", "alma", "atributo", "determinado", "pericia", "equipamento", "aprimoramento"]
      .map((id) => item(d, id).teto),
    [bt, bt, bt, 2, 2 * bt, Math.floor(bt / 2), Math.floor(bt / 2), bt, bt, 1, null, null, null]);
  const dA = deriveAfty(ficha({ nd, addons: [espinho, alter] }));
  t(`nível ${nd}: com o Alter, floor(x × 1,5) com um piso só`,
    ["especializacao", "nivel_aptidao", "treinamento", "lendaria", "determinado", "pericia"].map((id) => item(dA, id).teto),
    [Math.floor(bt * 1.5), 3, Math.floor(2 * bt * 1.5), Math.floor((bt / 2) * 1.5), 1, null]);
}
t("o exemplo do autor: BT 4 dá 6 Especializações com o Alter",
  item(deriveAfty(ficha({ nd: 9, addons: [espinho, alter] })), "especializacao").teto, 6);
t("BT 3 com o Alter: a Lendária vai a 2 (piso único), e não a 1",
  item(deriveAfty(ficha({ nd: 5, addons: [espinho, alter] })), "lendaria").teto, 2);

/* ============================================================ */
/* 4. CADA COMPRA NO LUGAR CERTO, NOS DOIS SISTEMAS              */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const S = `[${sistema}]`;
  const sem = deriveAfty(ficha({ sistema }));
  const com = (compras, extra = {}) => deriveAfty(ficha({ sistema, compras, ...extra }));

  t(`${S} Especialização +2: +2 vagas comuns`,
    com({ especializacao: 2 }).habilidades.comum - sem.habilidades.comum, 2);
  t(`${S} Talento +1: +1 vaga exclusiva de Talento, e nenhuma comum`,
    [com({ talento: 1 }).habilidades.exclusivasTalento - sem.habilidades.exclusivasTalento,
      com({ talento: 1 }).habilidades.comum - sem.habilidades.comum], [1, 0]);
  t(`${S} Aptidão +1: +1 Aptidão Amaldiçoada`,
    com({ aptidao: 1 }).totalAptidoesAmaldicoadas - sem.totalAptidoesAmaldicoadas, 1);
  t(`${S} Nível de Aptidão +2: +2 níveis`,
    com({ nivel_aptidao: 2 }).totalAptidao - sem.totalAptidao, 2);
  t(`${S} Treinamento +3: +3 Focos`,
    com({ treinamento: 3 }).focosTotais - sem.focosTotais, 3);
  t(`${S} Perícias +2: +2 no orçamento de Perícias`,
    com({ pericia: 2 }).testes.orcamento.total - sem.testes.orcamento.total, 2);
  t(`${S} Aumento de Atributo +2: +2 Pontos de Atributo`,
    [sem.pontosAtributoExtra, com({ atributo: 2 }).pontosAtributoExtra], [0, 2]);
  t(`${S} e o hover nomeia a fonte`,
    com({ atributo: 2 }).partes.pontosAtributoExtra, [{ label: "Espinho (Aumento de Atributo)", valor: 2 }]);

  /* Alto Nível: a vaga sai no nível dele. */
  const sem21 = deriveAfty(ficha({ sistema, nd: 22 }));
  const com21 = deriveAfty(ficha({ sistema, nd: 22, compras: { melhoria: 1, lendaria: 1 } }));
  t(`${S} Melhoria e Lendária: a vaga do canal sobe 1 cada`,
    [com21.altoNivel.melhorias.vagasCanal - sem21.altoNivel.melhorias.vagasCanal,
      com21.altoNivel.lendarias.vagasCanal - sem21.altoNivel.lendarias.vagasCanal], [1, 1]);

  /* O Determinado a Viver Adicional. */
  const dDet = com({ determinado: 1 });
  t(`${S} Determinado a Viver: o Talento Adicional entra na ficha`,
    dDet.talentos.escolhidas.includes(TALENTO), true);
  t(`${S} e não gasta vaga nenhuma`,
    [dDet.talentos.gastos, dDet.habilidades.gastosNoComum ?? null], [sem.talentos.gastos, sem.habilidades.gastosNoComum ?? null]);
  t(`${S} sem a compra ele não existe`, sem.talentos.escolhidas.includes(TALENTO), false);
}

/* O Aumento de Alma tem uma régua por sistema, e é a do canal `almaMax`. */
const almaJ = [deriveAfty(ficha()), deriveAfty(ficha({ compras: { alma: 1 } }))];
t("jogador: Aumento de Alma soma 10 na Alma e 10 no PV",
  [almaJ[1].almaMax - almaJ[0].almaMax, almaJ[1].hp - almaJ[0].hp], [10, 10]);
t("jogador: duas compras somam 20",
  deriveAfty(ficha({ compras: { alma: 2 } })).almaMax - almaJ[0].almaMax, 20);
const almaC = [deriveAfty(ficha({ sistema: "afty" })), deriveAfty(ficha({ sistema: "afty", compras: { alma: 1 } }))];
t("criatura: o mesmo canal é porcentagem, 100 vira 110", [almaC[0].almaMax, almaC[1].almaMax], [100, 110]);
t("criatura: e o PV sobe 10%", almaC[1].hp, Math.round(almaC[0].hp * 1.1));

/* ============================================================ */
/* 5. OS AVISOS                                                  */
/* ============================================================ */
const dMel = deriveAfty(ficha({ nd: 9, compras: { melhoria: 1, lendaria: 1 } }));
t("jogador abaixo do 21: a Melhoria avisa o nível",
  dMel.espinho.avisos.includes("Melhoria Superior: requer Nível 21."), true);
t("e a Lendária avisa o 22", dMel.espinho.avisos.includes("Habilidade Lendária: requer Nível 22."), true);
t("no nível 22 o jogador não recebe aviso de Alto Nível",
  deriveAfty(ficha({ nd: 22, compras: { melhoria: 1, lendaria: 1 } })).espinho.avisos.some((a) => /requer/.test(a)), false);
t("criatura no ND 22 sem a Habilidade Geral: avisa a Geral",
  deriveAfty(ficha({ sistema: "afty", nd: 22, compras: { melhoria: 1 } })).espinho.avisos,
  ["Melhoria Superior: requer a Habilidade Geral Melhoria Superior."]);
t("criatura abaixo do 21 avisa pelo rótulo dela (ND)",
  deriveAfty(ficha({ sistema: "afty", nd: 9, compras: { melhoria: 1 } })).espinho.avisos,
  ["Melhoria Superior: requer ND 21."]);

/* As Almas: gasto, restante, Outros e o excesso. */
const dAlmas = deriveAfty(ficha({ almas: 30, outros: 5, compras: { especializacao: 2, talento: 1 } }));
t("gastas = compras × custo + Outros", dAlmas.espinho.almas, { totais: 30, outros: 5, gastas: 21, restantes: 9, excedeu: false });
const dEstouro = deriveAfty(ficha({ almas: 10, compras: { especializacao: 2 } }));
t("passar das Almas marca o excesso (o card desenha o aviso)", [dEstouro.espinho.almas.excedeu, dEstouro.espinho.almas.restantes], [true, -2]);
t("e a compra continua valendo", dEstouro.habilidades.comum - deriveAfty(ficha({ almas: 10 })).habilidades.comum, 2);
const dTeto = deriveAfty(ficha({ nd: 9, compras: { especializacao: 6 } }));
t("passar do teto avisa", dTeto.espinho.avisos.includes("Habilidade de Especialização: 6 de 4 (excedeu)."), true);
t("e as seis vagas continuam lá", dTeto.habilidades.comum - deriveAfty(ficha({ nd: 9 })).habilidades.comum, 6);
t("compra de item que o pacote não tem aparece para ser apagada",
  deriveAfty(ficha({ compras: { sumiu: 2 } })).espinho.comprasMortas, [{ id: "sumiu", qtd: 2 }]);
t("estado sujo vira zero, sem quebrar",
  E.estadoDoEspinho({ espinho: { almas: "x", outros: -3, compras: { a: "2", b: -1 }, equipamentos: [{ uid: "u" }, { uid: "u" }, {}] } }),
  { almas: 0, outros: 0, compras: { a: 2 }, equipamentos: [{ uid: "u", aprimorado: false }] });

/* ============================================================ */
/* 6. O TALENTO FORA DO SELETOR                                  */
/* ============================================================ */
const noSeletor = (f) => gruposDeTalento(f).flatMap((g) => g.talentos.map((x) => x.id)).includes(TALENTO);
t("o Talento Adicional não aparece para escolher", noSeletor(ficha()), false);
t("o clássico continua lá", gruposDeTalento(ficha()).flatMap((g) => g.talentos.map((x) => x.id)).includes("tal_determinado_a_viver"), true);
t("mas o já escolhido à mão aparece, para poder ser tirado",
  noSeletor({ ...ficha(), talentos: [TALENTO] }), true);

/* ============================================================ */
/* 7. O EQUIPAMENTO MARCADO                                      */
/* ============================================================ */
const arma = (uid, { fa = null, espinhoHu = [], hu1 = [] } = {}) => ({
  uid, tipo: "arma", refId: ARMA, qtd: 1, equipado: true,
  ...(fa === false ? {} : {
    fa: {
      grau: "primeiro", encantamentos: [], habilidadeUnica: "", habilidadeEfeitos: hu1,
      espinhoHabilidadeUnica: "Do Espinho", espinhoHabilidadeEfeitos: espinhoHu,
      ...(fa ?? {}),
    },
  }),
});
const def = (v) => ({ canal: "defesa", expr: String(v) });
const entrada = (d, uid) => d.equip.entradas.find((e) => e.uid === uid);

const dMarcado = deriveAfty(ficha({ itens: [arma("e1")], equipamentos: [{ uid: "e1", aprimorado: false }] }));
t("o marcado vira Grau Especial", [entrada(dMarcado, "e1").fa.grau, entrada(dMarcado, "e1").fa.doEspinho], ["especial", true]);
t("e custa 10 Almas", item(dMarcado, "equipamento").qtd * item(dMarcado, "equipamento").custo, 10);
t("o gravado não muda: desmarcar devolve o Primeiro",
  entrada(deriveAfty(ficha({ itens: [arma("e1")] })), "e1").fa.grau, "primeiro");
t("item sem Ferramenta nenhuma vira uma, já no Especial",
  entrada(deriveAfty(ficha({ itens: [arma("e1", { fa: false })], equipamentos: [{ uid: "e1" }] })), "e1").fa?.grau, "especial");
t("sem o pacote a marca não muda o grau",
  entrada(deriveAfty(ficha({ itens: [arma("e1")], equipamentos: [{ uid: "e1" }], addons: [] })), "e1").fa.grau, "primeiro");

/* A Habilidade Única do Aprimoramento. */
const defesa = (extra) => deriveAfty(ficha({ ...extra })).defesa;
const base = defesa({ itens: [arma("e1")], equipamentos: [{ uid: "e1" }] });
t("sem Aprimoramento a do Espinho não conta",
  defesa({ itens: [arma("e1", { espinhoHu: [def(2)] })], equipamentos: [{ uid: "e1", aprimorado: false }] }) - base, 0);
t("aprimorado, ela soma",
  defesa({ itens: [arma("e1", { espinhoHu: [def(2)] })], equipamentos: [{ uid: "e1", aprimorado: true }] }) - base, 2);
t("e disputa com a primeira do mesmo item, como a primeira (fica o maior)",
  defesa({ itens: [arma("e1", { espinhoHu: [def(2)], hu1: [def(3)] })], equipamentos: [{ uid: "e1", aprimorado: true }] }) - base, 3);
t("jogador: e acumula com a Passiva, porque está no grupo da primeira",
  defesa({ itens: [arma("e1", { espinhoHu: [def(2)] })], equipamentos: [{ uid: "e1", aprimorado: true }], passivo: 4 })
    - defesa({ itens: [arma("e1")], equipamentos: [{ uid: "e1" }], passivo: 4 }), 2);
t("o Aprimoramento custa 10", item(deriveAfty(ficha({ itens: [arma("e1")], equipamentos: [{ uid: "e1", aprimorado: true }] })), "aprimoramento").gasto, 10);
const orc = (extra) => deriveAfty(ficha({ ...extra })).orcamentoHabilidades;
t("e não custa Slot de Feitiço, ao contrário da Segunda da Benção",
  orc({ itens: [arma("e1", { espinhoHu: [def(2)] })], equipamentos: [{ uid: "e1", aprimorado: true }] }).proprioFeitico,
  orc({ itens: [arma("e1")], equipamentos: [{ uid: "e1" }] }).proprioFeitico);
t("a linha no hover diz de onde veio",
  deriveAfty(ficha({ itens: [arma("e1", { espinhoHu: [def(2)] })], equipamentos: [{ uid: "e1", aprimorado: true }] }))
    .efeitos.detalhes.some((x) => x.canal === "defesa" && /Habilidade Única do Espinho/.test(x.nome)), true);

/* O marcado que some do inventário. */
const dMorto = deriveAfty(ficha({ itens: [], equipamentos: [{ uid: "sumiu", aprimorado: true }] }));
t("o marcado que sumiu continua custando", dMorto.espinho.almas.gastas, 20);
t("aparece como morto", dMorto.espinho.equipamentos, [{ uid: "sumiu", nome: null, tipo: null, aprimorado: true, morto: true }]);
t("e avisa", dMorto.espinho.avisos.some((a) => /não está mais no inventário/.test(a)), true);
t("uniforme também pode ser marcado",
  entrada(deriveAfty(ficha({ itens: [{ uid: "u1", tipo: "uniforme", refId: UNIFORME, qtd: 1, equipado: true }], equipamentos: [{ uid: "u1" }] })), "u1").fa?.grau, "especial");

/* ============================================================ */
/* 8. SEM O PACOTE, E SEM O PERMITE                              */
/* ============================================================ */
const numeros = (d) => [d.hp, d.almaMax, d.habilidades.comum, d.habilidades.exclusivasTalento, d.focosTotais,
  d.totalAptidao, d.totalAptidoesAmaldicoadas, d.testes.orcamento.total, d.pontosAtributoExtra];
const TUDO = { especializacao: 1, talento: 1, aptidao: 1, nivel_aptidao: 1, treinamento: 1, alma: 1, atributo: 1, pericia: 1, determinado: 1 };
for (const sistema of ["player", "afty"]) {
  const S = `[${sistema}]`;
  t(`${S} sem o pacote, as compras gravadas não rendem nada`,
    numeros(deriveAfty(ficha({ sistema, compras: TUDO, addons: [] }))),
    numeros(deriveAfty(ficha({ sistema, addons: [] }))));
  t(`${S} e o extrato fica inativo, sem efeito nenhum`,
    [deriveAfty(ficha({ sistema, compras: TUDO, addons: [] })).espinho.ativo,
      deriveAfty(ficha({ sistema, compras: TUDO, addons: [] })).espinho.efeitos.length], [false, 0]);
  const semPermite = { ...espinho, permite: [] };
  t(`${S} tirar só o permite não muda número (permite é tela)`,
    numeros(deriveAfty(ficha({ sistema, compras: TUDO, addons: [semPermite] }))),
    numeros(deriveAfty(ficha({ sistema, compras: TUDO }))));
  t(`${S} e a primitiva some das primitivas da ficha`,
    deriveAfty(ficha({ sistema, addons: [semPermite] })).primitivas.includes("espinho"), false);
}
t("nenhuma linha do Espinho leva exclusivo",
  E.resolveEspinho(ficha({ compras: TUDO }), { config: cfg }).efeitos.some((e) => "exclusivo" in e), false);
t("uma ficha sem o campo espinho deriva igual a uma com ele vazio",
  numeros(deriveAfty((() => { const f = ficha(); delete f.espinho; return f; })())),
  numeros(deriveAfty(ficha({ almas: 0 }))));

/* ============================================================ */
/* 9. O POOL DE ATRIBUTOS                                        */
/* ============================================================ */
const fAtr = ficha({ nd: 8, compras: { atributo: 3 } });
const rSem = resumoAtributos(fAtr);
const rCom = resumoAtributos(fAtr, null, null, deriveAfty(fAtr).pontosAtributoExtra);
t("o pool de nível ganha os pontos extras", rCom.nivelTotal - rSem.nivelTotal, 3);
t("com as duas parcelas separadas para o hover", [rCom.pontosNivel, rCom.pontosExtras], [rSem.nivelTotal, 3]);
t("extras sujos viram zero", resumoAtributos(fAtr, null, null, "x").pontosExtras, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
