/* Grupo de Talento por Addon (V3) e vaga de Talento por grupo (V4).

   Pacote NEUTRO escrito aqui dentro, de propósito: este arquivo é público.

   O que fica preso:
   • o grupo do Addon vira sub-aba nova, e o grupo FECHADO só aparece para a
     Origem (soDaOrigem) ou o clã (soDoCla) que ele cita, a regra é OU;
   • o Talento já escolhido mantém o grupo visível (acesso perdido não apaga);
   • o Talento de grupo fechado vira inacessível para quem não qualifica;
   • a vaga do grupo é gasta antes da vaga comum, o excedente cai no comum, e no
     grupo com vagaComum false o excedente fica sem pagamento e acusa;
   • sem o pacote nada muda: só os dois grupos do livro. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const T = await import(R + "afty-talentos.js");
const O = await import(R + "afty-origens.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

/* ============================================================ */
/* 1. O CONTROLE: sem pacote                                     */
/* ============================================================ */
t("sem pacote: só os dois grupos do livro", T.TALENTO_GRUPOS.map((g) => g.id), ["geral", "origem"]);

/* ============================================================ */
/* 2. O PACOTE                                                   */
/* ============================================================ */
const talento = (id, grupo, nome) => ({ id, nome, grupo, descricao: `Talento ${nome}.` });
const PACOTE = {
  id: "grupos-teste",
  nome: "Grupos de Teste",
  versao: "1.0.0",
  autor: "teste",
  paraRaw: "afty",
  descricao: "Pacote neutro dos asserts de grupo de Talento.",
  resumo: "Grupos de Talento",
  categoria: "talentos",
  permite: ["gruposTalento"],
  acrescenta: {
    origens: [
      {
        id: "fechada",
        nome: "Fechada",
        lore: "Origem de teste.",
        clasRotulo: "Distinção",
        clasArtigo: "uma",
        clas: [{ id: "marca", nome: "Marca de Teste" }],
        caracteristicas: [{ id: "c1", nome: "Característica", descricao: "Texto." }],
        efeitos: [{ canal: "vagasTalentoGrupo", alvo: "poderes", expr: "1", nome: "Vaga de Poder" }],
      },
      { id: "outra", nome: "Outra", lore: "Origem de teste.", caracteristicas: [{ id: "c2", nome: "C2", descricao: "Texto." }] },
    ],
    clas: [
      {
        id: "marca",
        nome: "Marca de Teste",
        lore: "Clã de teste.",
        caracteristicas: [{ id: "cc", nome: "Do Clã", descricao: "Texto." }],
        efeitos: [{ canal: "vagasTalentoGrupo", alvo: "distincao", expr: "max(0, bt - 2)", nome: "Vaga de Distinção" }],
      },
    ],
    gruposTalento: [
      { id: "poderes", titulo: "Poderes de Teste", soDaOrigem: ["fechada"] },
      { id: "distincao", titulo: "Distinção de Teste", soDoCla: ["marca"], vagaComum: false },
      { id: "aberto", titulo: "Aberto de Teste" },
    ],
    talentos: [
      talento("p1", "poderes", "P1"), talento("p2", "poderes", "P2"), talento("p3", "poderes", "P3"),
      talento("d1", "distincao", "D1"), talento("d2", "distincao", "D2"), talento("d3", "distincao", "D3"),
      talento("a1", "aberto", "A1"),
      talento("g1", "geral", "G1"),
    ],
  },
};
const pacote = A.normalizarPacote(PACOTE);
t("o pacote valida sem problema", A.validarPacote(PACOTE), []);
t("a primitiva do portão existe", A.PRIMITIVAS.some((p) => p.id === "gruposTalento"), true);
A.aplicarAddons([pacote]);

const NS = "grupos-teste:";
const ORIGEM = `${NS}fechada`;
const CLA = `${NS}marca`;
const POD = `${NS}poderes`;
const DIS = `${NS}distincao`;
const ABE = `${NS}aberto`;
const tal = (n) => `${NS}${n}`;

t("os grupos do Addon entram na lista viva, com namespace",
  T.TALENTO_GRUPOS.map((g) => g.id), ["geral", "origem", POD, DIS, ABE]);
t("soDaOrigem e soDoCla ganharam o namespace (referências ao próprio pacote)",
  [T.getGrupoDeTalento(POD).soDaOrigem, T.getGrupoDeTalento(DIS).soDoCla], [[ORIGEM], [CLA]]);
t("o grupo do Talento ganhou o namespace; o do livro ficou",
  [T.getTalento(tal("p1")).grupo, T.getTalento(tal("g1")).grupo], [POD, "geral"]);
t("o grupo fechado se declara fechado", [T.grupoEhFechado(T.getGrupoDeTalento(POD)), T.grupoEhFechado(T.getGrupoDeTalento(ABE))], [true, false]);
t("a validação dos grupos passa", T.validarGruposTalento(), []);
t("o alvo do efeito de Origem e de clã ganhou o namespace",
  [O.getOrigem(ORIGEM).efeitos[0].alvo, O.getCla(CLA).efeitos[0].alvo], [POD, DIS]);

const ficha = ({ sistema = "afty", origem = ORIGEM, cla = null, nd = 5, talentos = [] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origem, ...(cla ? { cla } : {}) };
  c.addons = [pacote];
  c.talentos = talentos;
  return c;
};
const idsVisiveis = (c) => T.gruposDeTalento(c).map((g) => g.id);

/* ============================================================ */
/* 3. A VISIBILIDADE                                             */
/* ============================================================ */
t("a Origem citada vê o grupo dela e o aberto, e não o do clã sem o clã",
  idsVisiveis(ficha()), ["geral", "origem", POD, ABE]);
t("com o clã citado, vê também o grupo do clã", idsVisiveis(ficha({ cla: CLA })), ["geral", "origem", POD, DIS, ABE]);
t("outra Origem só vê o aberto", idsVisiveis(ficha({ origem: "inato" })), ["geral", "origem", ABE]);
t("sem criatura (catálogo cru) o fechado fica de fora", T.gruposDeTalento().map((g) => g.id), ["geral", "origem", ABE]);
t("o Talento já escolhido mantém o grupo visível, mesmo trocando de Origem",
  idsVisiveis(ficha({ origem: "inato", talentos: [tal("p1")] })), ["geral", "origem", POD, ABE]);

/* ============================================================ */
/* 4. O ACESSO                                                   */
/* ============================================================ */
const inacessiveis = (c) => deriveAfty(c).talentos.inacessiveis;
t("quem qualifica acessa o Talento do grupo fechado", inacessiveis(ficha({ talentos: [tal("p1")] })), []);
t("quem não qualifica fica inacessível (e a ficha avisa, sem apagar)",
  inacessiveis(ficha({ origem: "inato", talentos: [tal("p1")] })), [tal("p1")]);
t("o grupo aberto nunca trava", inacessiveis(ficha({ origem: "inato", talentos: [tal("a1")] })), []);
t("o grupo do clã trava sem o clã", inacessiveis(ficha({ talentos: [tal("d1")] })), [tal("d1")]);
t("e libera com o clã", inacessiveis(ficha({ cla: CLA, talentos: [tal("d1")] })), []);

/* ============================================================ */
/* 5. AS VAGAS                                                   */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  const orc = (c) => deriveAfty(c).habilidades;
  const base = orc(ficha({ sistema }));
  const bt = maestria(5);

  t(`${S} o canal dá 1 vaga ao grupo Poderes`, orc(ficha({ sistema })).gruposTalento?.[POD]?.vagas, 1);
  t(`${S} um Poder é pago pela vaga do grupo: o comum não se mexe`,
    orc(ficha({ sistema, talentos: [tal("p1")] })).gastosNoComum, base.gastosNoComum);
  t(`${S} o segundo Poder cai no comum`,
    orc(ficha({ sistema, talentos: [tal("p1"), tal("p2")] })).gastosNoComum, base.gastosNoComum + 1);
  t(`${S} o terceiro Poder cai no comum também`,
    orc(ficha({ sistema, talentos: [tal("p1"), tal("p2"), tal("p3")] })).gastosNoComum, base.gastosNoComum + 2);
  t(`${S} o detalhe do grupo: vagas, escolhidos, usadas, sobra`,
    orc(ficha({ sistema, talentos: [tal("p1"), tal("p2")] })).gruposTalento?.[POD],
    { grupo: POD, titulo: "Poderes de Teste", vagas: 1, escolhidos: 2, usadas: 1, sobra: 1, vagaComum: true });
  t(`${S} Talento do grupo aberto e do livro gasta o comum, como sempre`,
    orc(ficha({ sistema, talentos: [tal("a1"), tal("g1")] })).gastosNoComum, base.gastosNoComum + 2);

  // vagaComum false: a vaga é max(0, bt - 2) e nada cai no comum
  const vagasDis = Math.max(0, bt - 2);
  const comCla = (talentos) => orc(ficha({ sistema, cla: CLA, talentos }));
  t(`${S} o clã dá max(0, bt - 2) vagas ao grupo da Distinção`, comCla([]).gruposTalento?.[DIS]?.vagas, vagasDis);
  const lote = [tal("d1"), tal("d2"), tal("d3")].slice(0, vagasDis);
  t(`${S} dentro das vagas: não gasta o comum e não excede`,
    [comCla(lote).gastosNoComum, comCla(lote).excedeu], [comCla([]).gastosNoComum, false]);
  const alem = [tal("d1"), tal("d2"), tal("d3")].slice(0, vagasDis + 1);
  t(`${S} além das vagas: o comum NÃO paga, e o contador acusa excesso`,
    [comCla(alem).gastosNoComum, comCla(alem).excedeu, comCla(alem).semVagaDeGrupo],
    [comCla([]).gastosNoComum, true, 1]);
}

/* O Talento CONCEDIDO não gasta vaga de lugar nenhum. */
t("concedido (sessão) não conta no grupo",
  T.contaVagasPorGrupo({ escolhidas: [tal("p1"), tal("p2")], concedidos: [tal("p1")], vezes: {} }, { [POD]: 1 }).porGrupo[POD],
  { grupo: POD, titulo: "Poderes de Teste", vagas: 1, escolhidos: 1, usadas: 1, sobra: 0, vagaComum: true });

A.aplicarAddons([]);
t("sem o pacote os grupos voltam a ser só os do livro", T.TALENTO_GRUPOS.map((g) => g.id), ["geral", "origem"]);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` x ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
