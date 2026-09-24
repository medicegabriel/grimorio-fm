/* QUIMERA, A FUSÃO DE INVOCAÇÕES EM UM CARD PRÓPRIO (2026-09-20).

   Pedido do autor: a Quimera deixa de ser Talento e vira uma seção ao lado das
   Hordas, na aba de Invocações, liberada pela primitiva `quimera` do addon.

   O motor é NATIVO (`resolveQuimera`, afty-invocacoes.js) e reaproveita o
   mecanismo de fontes da Quimera das Dez Sombras: uma invocação sintética com um
   marcador de fontes interno. A ficha de invocação da principal e das fundidas
   nunca é alterada. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const INV = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O ADDON E A PRIMITIVA                                      */
/* ============================================================ */
const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/quimera.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("o pacote so abre a tela: permite a primitiva quimera", pacote.permite, ["quimera"]);
t("e nao traz Talento nem marcador (ja nao e pego como talento)",
  [pacote.acrescenta?.talentos?.length ?? 0, pacote.acrescenta?.marcadores?.length ?? 0], [0, 0]);
t("a primitiva existe no catalogo", AD.PRIMITIVAS.some((p) => p.id === "quimera"), true);
t("o texto do livro chega na descricao do pacote",
  pacote.descricao.includes("soma do PV de cada fundida menos 10")
    && pacote.descricao.includes("FIXO no maior valor"), true);
AD.aplicarAddons([pacote]);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const FONTES = [
  ["Cervo Circular", "segundo", 16, 16, 16], ["Tigre Funebre", "segundo", 20, 12, 18],
  ["Grande Serpente", "terceiro", 18, 12, 16], ["Nue", "terceiro", 14, 18, 14],
];
const mkFonte = ([nome, grau, f, d, c], i) => {
  const inv = INV.createBlankInvocacao(grau);
  inv.id = `f${i}`; inv.nome = nome; inv.tipoMecanico = "shikigami";
  inv.atributos = { forca: f, destreza: d, constituicao: c, inteligencia: 10, sabedoria: 10, presenca: 10 };
  inv.acoes = [1, 2, 3].map((k) => ({ ...INV.createBlankAcao(), id: `f${i}a${k}`, nome: `A${k}` }));
  inv.periciasProf = i === 0 ? { atletismo: "treinado", furtividade: "treinado" }
    : i === 1 ? { atletismo: "mestre" } : {};
  return inv;
};
const ficha = ({ n = 4, nivel = 4, principal = "f0", fundidas, ajusteF0 = null, comAddon = true } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.addons = comAddon ? [pacote] : [];
  c.invocacoes = FONTES.map(mkFonte);
  if (ajusteF0) c.invocacoes[0].atributos = { ...c.invocacoes[0].atributos, ...ajusteF0 };
  const resto = fundidas ?? FONTES.map((_, i) => `f${i}`).filter((id) => id !== principal).slice(0, Math.max(0, n - 1));
  c.quimeras = n > 0 ? [{ id: "q1", nome: "Agito", principalId: principal, fundidasIds: resto, nivel }] : [];
  return c;
};
const dQ = (o) => deriveAfty(ficha(o));
const qDe = (o) => dQ(o).quimeras.lista[0];
const soloF0 = deriveAfty(ficha({ n: 0 })).invocacoes.lista.find((x) => x.id === "f0");
const pvFontes = deriveAfty(ficha({ n: 0 })).invocacoes.lista.map((x) => x.pv);
const custoFontes = deriveAfty(ficha({ n: 0 })).invocacoes.lista.map((x) => x.custo);
const soma = (v, n) => v.slice(0, n).reduce((a, b) => a + b, 0);

t("a ficha nasce sem quimeras", createBlankAfty().quimeras, []);
t("sem quimera nenhuma a lista sai vazia", dQ({ n: 0 }).quimeras, { lista: [], total: 0, custoTotal: 0 });

/* ============================================================ */
/* 3. PV, CUSTO E O TETO                                         */
/* ============================================================ */
t("as fontes tem PV diferentes, porque os graus diferem", new Set(pvFontes).size >= 2, true);
t("PV = soma do PV de cada fundida menos 10 (2, 3 e 4 fundidas)",
  [2, 3, 4].map((n) => qDe({ n }).pv), [2, 3, 4].map((n) => soma(pvFontes, n) - 10));
t("nao e a soma dos dois maiores, como nas Dez Sombras",
  qDe({ n: 4 }).pv !== [...pvFontes].sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0), true);
t("Custo = soma do custo de todas as fundidas",
  [2, 3, 4].map((n) => qDe({ n }).custo), [2, 3, 4].map((n) => soma(custoFontes, n)));
t("o total de fundidas conta a principal", [2, 3, 4].map((n) => qDe({ n }).total), [2, 3, 4]);
t("o custo total da lista soma as quimeras", dQ({ n: 3 }).quimeras.custoTotal, soma(custoFontes, 3));

t("Nivel 2 aceita 2 fundidas", qDe({ n: 2, nivel: 2 }).warnings, []);
const acima = qDe({ n: 4, nivel: 2 });
t("Nivel 2 com 4 marcadas avisa e usa so 2 no total",
  [acima.warnings.length, acima.total, acima.limite], [1, 2, 2]);
t("e o PV respeita o teto", acima.pv, soma(pvFontes, 2) - 10);
t("Nivel invalido cai em 2", qDe({ n: 2, nivel: 9 }).nivel, 2);

/* ============================================================ */
/* 4. VALIDAÇÃO                                                  */
/* ============================================================ */
const vazia = ficha({ n: 2 });
vazia.quimeras = [{ id: "q1", nome: "", principalId: "", fundidasIds: [], nivel: 2 }];
t("sem principal avisa e nao resolve",
  (({ valido, resolvida, warnings }) => [valido, resolvida, warnings.length])(deriveAfty(vazia).quimeras.lista[0]),
  [false, null, 1]);
t("so a principal, sem fundida, avisa",
  qDe({ n: 2, fundidas: [] }).valido, false);
t("fundida repetida ou que nao existe e ignorada",
  qDe({ n: 2, fundidas: ["f1", "f1", "fantasma", "f0"] }).fundidasIds, ["f1"]);

/* ============================================================ */
/* 5. BÔNUS +1 POR FUNDIDA ALÉM DA PRIMEIRA                      */
/* ============================================================ */
const efe = (n) => qDe({ n }).resolvida.efeitosHabilidade;
for (const canal of ["cd", "defesa", "danoNivel", "orcamentoLivre", "bonusTeste"]) {
  t(`+1 em ${canal} por fundida alem da primeira`,
    [1, 2, 3, 4].map((n) => (n === 1 ? (soloF0.efeitosHabilidade[canal] ?? 0) : efe(n)[canal] ?? 0)
      - (soloF0.efeitosHabilidade[canal] ?? 0)), [0, 1, 2, 3]);
}

/* ============================================================ */
/* 6. TREINOS                                                    */
/* ============================================================ */
const profDe = (o) => Object.fromEntries((qDe(o).resolvida.testes?.pericias ?? [])
  .map((p) => [p.id, p.mestre ? "mestre" : "treinado"]));
t("une as pericias treinadas de todas as fundidas",
  [profDe({ n: 2 }).atletismo, profDe({ n: 2 }).furtividade], ["mestre", "treinado"]);
t("a maior faixa ganha: a principal treinada e a fundida mestre",
  profDe({ n: 2 }).atletismo, "mestre");

/* ============================================================ */
/* 7. ATRIBUTOS FIXOS NO MAIOR VALOR                             */
/* ============================================================ */
const attr = (o) => qDe(o).resolvida.atributos.valores;
const maiores = (n) => Object.fromEntries(
  ["forca", "destreza", "constituicao"].map((k, i) => [k, Math.max(...FONTES.slice(0, n).map((f) => f[2 + i]))]));
const tres = (a) => ({ forca: a.forca, destreza: a.destreza, constituicao: a.constituicao });
t("cada atributo e o maior entre as fundidas (2, 3 e 4)",
  [2, 3, 4].map((n) => tres(attr({ n }))), [2, 3, 4].map(maiores));
t("a principal conta como fundida: ficha alta dela vence",
  attr({ n: 2, ajusteF0: { forca: 30 } }).forca, 30);
t("e ficha baixa dela perde para a fundida",
  attr({ n: 2, ajusteF0: { forca: 8 } }).forca, 20);
t("trocar a principal nao muda o maximo do grupo",
  tres(attr({ n: 4, principal: "f3" })), maiores(4));

/* ============================================================ */
/* 7b. AÇÕES, CARACTERÍSTICAS E RETRATO SÃO DA QUIMERA            */
/* ============================================================ */
t("a Quimera nova nasce com listas proprias e retrato vazio",
  (({ acoes, caracteristicas, portraitUrl }) => [acoes, caracteristicas, portraitUrl])(INV.createBlankQuimera()),
  [[], [], ""]);
t("Quimera sem lista gravada usa as acoes da principal",
  qDe({ n: 2 }).resolvida.acoes.map((a) => a.nome), ["A1", "A2", "A3"]);
{
  const c = ficha({ n: 2 });
  c.quimeras[0].acoes = [{ ...INV.createBlankAcao(), id: "qa1", nome: "Golpe Unico" }];
  c.quimeras[0].caracteristicas = [];
  c.quimeras[0].portraitUrl = "https://x/y.png";
  const q = deriveAfty(c).quimeras.lista[0];
  t("com lista propria valem so as acoes da Quimera", q.resolvida.acoes.map((a) => a.nome), ["Golpe Unico"]);
  t("o retrato da Quimera chega no resolvido", q.resolvida.portraitUrl, "https://x/y.png");
  t("as acoes da principal ficam intactas",
    deriveAfty(c).invocacoes.lista.find((x) => x.id === "f0").acoes.length, 3);
  t("o resolvido traz TRs, acerto e pericias para a aba de informacoes",
    [q.resolvida.testes.resistencias.length, typeof q.resolvida.testes.acerto.corpo.bonus, Array.isArray(q.resolvida.testes.pericias)],
    [5, "number", true]);
}

/* ============================================================ */
/* 8. NADA VAZA                                                 */
/* ============================================================ */
const lista = dQ({ n: 4 }).invocacoes.lista;
t("as invocacoes da ficha ficam intactas",
  lista.map((x) => [x.id, x.pv, x.custo]), deriveAfty(ficha({ n: 0 })).invocacoes.lista.map((x) => [x.id, x.pv, x.custo]));
t("a lista de invocacoes nao ganha a Quimera", lista.length, 4);
t("os marcadores da ficha nao ganham o interno", dQ({ n: 4 }).invocacoes.marcadores.length, 0);

/* ============================================================ */
/* 9. A VIDA É A SOMA DOS CARTÕES MENOS 10, E MAIS NADA (2026-09-23) */
/* ============================================================ */
/* Autor: *"O codigo de quimera esta multiplicando a vida novamente ou algo
   similar ele esta com mais vida do que deveria"*. O `soma - 10 - pv_max` ia pelo
   canal `pv`, e a conta normal do PV rodava por cima: o que o dono dá a toda
   invocação entrava duas vezes, a Característica de Vida da principal também, e o
   multiplicador da Maldição multiplicava a soma que já vinha multiplicada. */
const pvDaQuimera = ({ habilidades = [], todas = {}, porIndice = {}, n = 3, quimera = {} } = {}) => {
  const c = ficha({ n });
  c.habilidades = habilidades;
  c.invocacoes = c.invocacoes.map((inv, i) => ({ ...inv, ...todas, ...(porIndice[i] ?? {}) }));
  Object.assign(c.quimeras[0], quimera);
  const d = deriveAfty(c);
  const q = d.quimeras.lista[0];
  const somaCartoes = d.invocacoes.lista.filter((x) => [q.principalId, ...q.fundidasIds].includes(x.id))
    .reduce((s, x) => s + x.pv, 0);
  return { pv: q.pv, esperado: somaCartoes - 10, partes: q.resolvida.fontes.pv, resolvida: q.resolvida };
};
const VIDA = { id: "cv", nome: "Vitalidade", subtipo: "vida" };
const CENARIOS = {
  "sem nada": {},
  "Invocacoes Resistentes do dono (+5 x BT em cada)": { habilidades: ["ctr_invocacoes_resistentes"] },
  "principal do tipo Maldicao (x1,5)": { porIndice: { 0: { tipoMecanico: "maldicao" } } },
  "todas do tipo Maldicao": { todas: { tipoMecanico: "maldicao" } },
  "Maldicao com Invocacoes Resistentes": { habilidades: ["ctr_invocacoes_resistentes"], todas: { tipoMecanico: "maldicao" } },
  "todas do tipo Tecnica": { todas: { tipoMecanico: "tecnica" } },
  "Caracteristica de Vida em todas": { todas: { caracteristicas: [VIDA] } },
  "Quimera legada herdando a Vida da principal": { porIndice: { 0: { caracteristicas: [VIDA] } } },
  "Quimera com Caracteristica de Vida propria": { quimera: { acoes: [], caracteristicas: [VIDA] } },
};
for (const [nome, o] of Object.entries(CENARIOS)) {
  const r = pvDaQuimera(o);
  t(`PV = soma dos cartoes - 10: ${nome}`, r.pv, r.esperado);
  t(`o hover do PV fecha no numero: ${nome}`, r.partes.reduce((s, p) => s + p.valor, 0), r.pv);
}
{
  const base = pvDaQuimera();
  t("o hover lista cada fundida e a parcela da Quimera",
    base.partes.map((p) => p.label), ["Cervo Circular", "Tigre Funebre", "Grande Serpente", "Quimera"]);
  t("a parcela da Quimera e o abate de 10", base.partes.at(-1).valor, -INV.QUIMERA_PV_ABATE);
  t("a Integridade da Quimera acompanha o PV fixo", base.resolvida.almaMax, base.pv);
}
t("PV fixo nunca fica negativo",
  INV.resolveQuimera({ id: "q", principalId: "a", fundidasIds: ["b"], nivel: 2 },
    [{ ...INV.createBlankInvocacao("quarto"), id: "a" }, { ...INV.createBlankInvocacao("quarto"), id: "b" }],
    {}, [{ id: "a", pv: 2 }, { id: "b", pv: 3 }]).pv, 0);

/* ============================================================ */
/* 10. A QUIMERA NA MESA (Ficha Final e Encontro)                */
/* ============================================================ */
/* Autor, no mesmo pedido: *"faça com que apareça a ficha fora do modo de
   edição"*. A aba mostra a resolvida dela com a mesma ficha de invocação, então o
   que precisa valer em Node é o que a aba LÊ: a sessão por id, o máximo por id, a
   busca e o auxílio que ela entrega ao dono. */
const S = await import(R + "ficha/ficha-sessao.js");
const FC = await import(R + "ficha/ficha-conteudo.js");
{
  const d = dQ({ n: 3 });
  const q = d.quimeras.lista[0];
  const id = q.resolvida.id;
  t("o id da Quimera na mesa e quimera:<id>", id, "quimera:q1");
  t("a mesa enxerga as invocacoes e a Quimera",
    S.invocacoesDaMesa(d).map((x) => x.id), ["f0", "f1", "f2", "f3", "quimera:q1"]);
  t("o maximo da Quimera sai pelo id dela", S.invocacaoDaMesa(d, id)?.pv, q.pv);
  t("id que nao existe devolve null", S.invocacaoDaMesa(d, "quimera:fantasma"), null);
  t("Quimera invalida nao entra na mesa",
    S.invocacoesDaMesa(deriveAfty(ficha({ n: 2, fundidas: [] }))).some((x) => x.id.startsWith("quimera:")), false);

  let s = S.sessaoEmBranco(d);
  s = S.poeInvocacaoEmCampo(s, id, true, q.pv);
  s = S.aplicaDanoInvocacao(s, id, 25, q.pv);
  t("dano na Quimera desce do PV fixo dela",
    [S.estadoDaInvocacao(s, id).pvAtual, S.estadoDaInvocacao(s, id).emCampo], [q.pv - 25, true]);
  s = S.defineVitalInvocacao(s, id, "pv", q.pv + 999, S.invocacaoDaMesa(d, id).pv);
  t("escrever acima do maximo apara no PV fixo", S.estadoDaInvocacao(s, id).pvAtual, q.pv);
  const menor = dQ({ n: 2 });
  t("a sessao apara a Quimera quando o PV dela desce",
    S.estadoDaInvocacao(S.aparaSessao(s, menor), id).pvAtual, menor.quimeras.lista[0].pv);

  const alvo = FC.alvosDeBusca(d).find((a) => a.id === id);
  t("a busca acha a Quimera e leva para a aba de Invocacoes",
    [alvo?.aba, alvo?.grupo, alvo?.nome, alvo?.detalhe], ["invocacoes", "invocacao", "Agito", "Quimera"]);
  t("e acha pelo nome de uma fundida", FC.alvosDeBusca(d).some((a) => a.id === id && a.busca.includes("tigre")), true);
}
{
  /* Um auxilio de Defesa para Aliados, ligado na Quimera em campo, sobe a
     Defesa do dono como o de qualquer invocacao. */
  const c = ficha({ n: 2 });
  c.quimeras[0].acoes = [{
    ...INV.createBlankAcao(), id: "qaux", nome: "Muralha", familia: "auxilio",
    auxilioSub: "defesa", alvoAuxilio: "aliados",
  }];
  c.quimeras[0].caracteristicas = [];
  const semLigar = deriveAfty(c);
  const ligado = deriveAfty(c, { invocacoes: { "quimera:q1": { emCampo: true, auxilios: { qaux: true } } } });
  const q = ligado.quimeras.lista[0];
  const aux = q.resolvida.auxilios.find((a) => a.id === "qaux");
  t("o auxilio da Quimera aparece ligado na ficha dela", aux?.ligado, true);
  t("e sobe a Defesa do dono pelo valor do auxilio",
    ligado.defesa - semLigar.defesa, aux?.valor);
  const fora = deriveAfty(c, { invocacoes: { "quimera:q1": { emCampo: false, auxilios: { qaux: true } } } });
  t("Quimera fora de campo nao sustenta o auxilio", fora.defesa, semLigar.defesa);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
