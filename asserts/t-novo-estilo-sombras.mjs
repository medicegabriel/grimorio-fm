/* NOVO ESTILO DAS SOMBRAS: o modelo da Expansão (F&M 2.5), autor 2026-10-04.

   Até 2026-10-04 este arquivo testava o Dançarino das Lâminas, e o nome induzia a
   erro. Aquele teste mudou para `t-dancarino-estilo.mjs`, intacto.

   Aqui: a progressão própria das Técnicas (DA-03), a Técnica como pacote (DA-02),
   a convivência com as Técnicas `legacy` (DA-05) e a normalização. As métricas de
   cada efeito estão em `t-estilo-sombras-metricas.mjs`. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EST = await import(R + "afty-estilo-sombras.js");
const CAT = await import(R + "afty-estilo-sombras-catalogo.js");
const A = await import(R + "afty-addons.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const tecnica = (id, extra = {}) => ({ ...EST.createBlankTecnicaEstilo(), id, nome: id, ...extra });
const ficha = (sistema, { nd = 4, origem = "sem_tecnica", estilos = [] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.origem = { id: origem };
  c.estilosSombra = estilos;
  return c;
};

/* 1. A progressão (DA-03): 2 no Nível 4, +1 a cada três níveis seguintes. */
t("progressao por nivel",
  [1, 3, 4, 6, 7, 9, 10, 13, 16, 19, 20, 30].map((nd) => CAT.tecnicasDaProgressao(nd).total),
  [0, 0, 2, 2, 3, 3, 4, 5, 6, 7, 7, 10]);
for (const nd of [22, 25, 28, 31, 34, 37, 40, 43, 70]) {
  const r = CAT.tecnicasDaProgressao(nd);
  t(`Marco ${nd}: concede mais uma Técnica`, r.total - CAT.tecnicasDaProgressao(nd - 1).total, 1);
  t(`Marco ${nd}: parcelas fecham o total`, r.partes.reduce((s, p) => s + p.valor, 0), r.total);
  t(`Marco ${nd}: fonte do novo ganho`, r.partes.at(-1), { label: `Nível ${nd}`, valor: 1 });
}
t("Nível não finito não gera progressão", [Infinity, NaN, -Infinity].map((nd) => CAT.tecnicasDaProgressao(nd).total), [0, 0, 0]);
t("as parcelas do hover", CAT.tecnicasDaProgressao(10).partes,
  [{ label: "Nível 4", valor: 2 }, { label: "Nível 7", valor: 1 }, { label: "Nível 10", valor: 1 }]);

/* ⚠ A PROGRESSAO PROPRIA E SO DO PERSONAGEM (autor, 2026-10-26, divergencia
   `progressaoDoEstilo`). Na CRIATURA as Tecnicas da Expansao gastam o contador
   comum, como as legacy sempre gastaram, e o estouro so deixa o contador
   vermelho: nenhuma Tecnica perde o efeito. O laco mede os dois lados com a
   expectativa de cada um. */
for (const sistema of ["afty", "player"]) {
  const propria = sistema === "player";
  const d4 = deriveAfty(ficha(sistema, { estilos: [tecnica("a"), tecnica("b")] }));
  const gastosSemTecnica = deriveAfty(ficha(sistema)).orcamentoHabilidades.gastos;
  t(`${sistema}: duas Tecnicas no Nivel 4`,
    [d4.estilo.progressao.total, d4.estilo.progressao.usadas, d4.estilo.progressao.excedeu],
    propria ? [2, 2, false] : [0, 2, false]);
  t(`${sistema}: a progressao diz de quem e`, d4.estilo.progressao.propria, propria);
  t(`${sistema}: o contador de Habilidades`,
    [d4.orcamentoHabilidades.estilos, d4.orcamentoHabilidades.gastos],
    propria ? [0, gastosSemTecnica] : [2, gastosSemTecnica + 2]);
  const d3 = deriveAfty(ficha(sistema, { estilos: [tecnica("a"), tecnica("b"), tecnica("c")] }));
  t(`${sistema}: a terceira no Nivel 4`, d3.estilo.progressao.excedeu, propria);
  t(`${sistema}: estourar so invalida no personagem`,
    d3.estilo.tecnicas.map((x) => x.mecanicamenteValida), propria ? [false, false, false] : [true, true, true]);
  t(`${sistema}: no Nivel 19`,
    deriveAfty(ficha(sistema, { nd: 19 })).estilo.progressao.total, propria ? 7 : 0);
  t(`${sistema}: no Nivel 28`, deriveAfty(ficha(sistema, { nd: 28 })).estilo.progressao.total, propria ? 10 : 0);
  t(`${sistema}: abaixo do Nivel 4 nao ha progressao`,
    deriveAfty(ficha(sistema, { nd: 3, estilos: [tecnica("a")] })).estilo.progressao, { total: 0, partes: [], usadas: 0, excedeu: false });
  t(`${sistema}: outra origem sem liberacao nao tem progressao, e a Tecnica fica gravada`,
    (({ estilo }) => [estilo.progressao.total, estilo.tecnicas.length, estilo.avisos.length > 0])(
      deriveAfty(ficha(sistema, { origem: "inato", estilos: [tecnica("a")] }))),
    [0, 1, true]);

  /* 2. A Técnica LEGACY segue gastando o contador, como antes (DA-05). */
  const legado = ficha(sistema, { nd: 10, estilos: [{ id: "defesa", tipo: "tabela" }, { id: "acerto", tipo: "tabela" }] });
  const dl = deriveAfty(legado);
  t(`${sistema}: a legacy segue no contador`, [dl.orcamentoHabilidades.estilos, dl.estilo.conhecidas.length], [2, 2]);
  t(`${sistema}: e nao ocupa a progressao`, dl.estilo.progressao.usadas, 0);
  const misto = deriveAfty(ficha(sistema, { nd: 10, estilos: [...legado.estilosSombra, tecnica("nova")] }));
  t(`${sistema}: as duas regras convivem`,
    [misto.orcamentoHabilidades.estilos, misto.estilo.progressao.usadas, misto.estilo.conhecidas.length, misto.estilo.tecnicas.length],
    propria ? [2, 1, 2, 1] : [3, 1, 2, 1]);
}

/* 3. A vaga exclusiva `vagasEstilo` soma na progressão, e a sobra segue para as
   legacy. O Liberto dá uma no Nível 10 ("Caminho até o Fim"). */
const LIBERTO = A.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/sem-tecnica-liberto.json", import.meta.url), "utf8")));
A.aplicarAddons([LIBERTO]);
const liberto = (estilos) => {
  const c = ficha("afty", { nd: 10, origem: "sem-tecnica-liberto:liberto", estilos });
  c.addons = [LIBERTO];
  return c;
};
const lib = deriveAfty(liberto([]));
/* O Liberto e uma CRIATURA: sem progressao propria, so o Caminho ate o Fim (a vaga
   exclusiva) conta em `progressao`. A progressao de 4 do Nivel 10 e do personagem. */
t("Liberto (criatura) no Nivel 10: so a vaga do Caminho",
  [lib.estilo.progressao.total, lib.estilo.progressao.partes.map((p) => p.label)],
  [1, ["Caminho até o Fim"]]);
t("sem Tecnica da Expansao, a vaga exclusiva segue inteira para as legacy",
  lib.orcamentoHabilidades.exclusivasEstilo, 1);
const libCheio = deriveAfty(liberto(["a", "b", "c", "d", "e"].map((id) => tecnica(id))));
t("as cinco Tecnicas: a vaga exclusiva e gasta pelo derive, sem invalidar nenhuma",
  [libCheio.estilo.progressao.excedeu, libCheio.orcamentoHabilidades.exclusivasEstilo,
    libCheio.orcamentoHabilidades.exclusivasEstiloUsadas, libCheio.estilo.tecnicas.every((x) => x.mecanicamenteValida)],
  [false, 1, 1, true]);
A.aplicarAddons([]);

/* 4. O caminho legacy NÃO lê a Técnica da Expansão. A Modificação nova tem o
   mesmo `tipo: "modificacao"` do recipiente antigo, e seria explodida. */
const modificacao = tecnica("mod", { tipo: CAT.TIPO_MODIFICACAO, efeitos: [{ uid: "u1", efeitoId: "defesa" }] });
t("estilosDaFicha ignora a Expansao", EST.estilosDaFicha({ estilosSombra: [modificacao] }), []);
t("tecnicasDaFicha le so a Expansao",
  EST.tecnicasDaFicha({ estilosSombra: [modificacao, { id: "defesa", tipo: "tabela" }] }).map((x) => x.id), ["mod"]);
t("o recipiente ANTIGO (sem regra) segue convertido como antes",
  EST.estilosDaFicha({ estilosSombra: [{ id: "velha", tipo: "modificacao", efeitosModificacao: [{ id: "defesa" }] }] }),
  [{ id: "defesa", tipo: "tabela" }]);
t("as cruas da Expansao voltam intactas para o escritor do criador",
  EST.tecnicasCruasDaExpansao({ estilosSombra: [modificacao, { id: "defesa", tipo: "tabela" }] }), [modificacao]);

/* 5. Normalização: lixo some, nada é inventado. */
const n = EST.normalizaTecnicaEstilo({
  id: "x", regra: "expansao", tipo: "qualquer", nome: "  Saque  ",
  efeitos: [{ uid: "a", efeitoId: "gatilho" }, { efeitoId: "sem_uid" }, "lixo", { uid: "b" }],
  aptidoes: [{ uid: "c", aptidaoId: "canalizar_em_golpe", modId: "canalizar_vantagem" }, { uid: "d", aptidaoId: "x" }],
  requisitos: [{ uid: "e", dificuldade: "medio", alvoUid: "a" }, { uid: "f" }],
  exaustao: -3, contraAtaque: { quantidade: 0 }, gatilho: "lixo",
});
t("tipo desconhecido vira Modificacao", n.tipo, "modificacao");
t("o nome aparado, e o cru preservado", [n.nome, n.nomeCru], ["Saque", "  Saque  "]);
t("so as compras completas ficam", [n.efeitos.map((e) => e.uid), n.aptidoes.map((a) => a.uid), n.requisitos.map((r) => r.uid)],
  [["a"], ["c"], ["e"]]);
t("Exaustao negativa vira zero, e Contra-Ataque zero vira nulo", [n.exaustao, n.contraAtaque], [0, null]);
t("o gatilho padrao e a borda", n.gatilho, { borda: true, texto: "" });
t("sem campo regra, a Tecnica e legacy", CAT.regraDaTecnica({ id: "x" }), "legacy");
t("a Tecnica em branco nasce na Expansao", CAT.regraDaTecnica(EST.createBlankTecnicaEstilo()), "expansao");
t("a ficha em branco traz o Funcionamento do Estilo vazio",
  createBlankAfty().estiloFuncionamento, { texto: "", durabilidadeTrilha: null });

/* 6. E-01: os dois validadores do catálogo rodam aqui. O de baixo existia desde
   2026-08-10 e era exportado sem chamador nenhum. */
t("o catalogo legacy esta limpo", EST.validarConteudoEstilos(), []);
t("o catalogo da Expansao esta limpo", EST.validarCatalogoEstilo(), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
