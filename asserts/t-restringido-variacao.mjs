/* O Restringido como MÃE de variação (2026-09-28).

   Nasceu com o Addon Fórmula de Combate Entrópica (a Restrição Intelectual de
   Dr. Xeno, docs/afty-formula-entropica.md), mas mede só o VERBO, com um pacote
   mínimo escrito aqui: uma origem com `variacaoDe: "restringido"` e uma
   Especialização que herda a do livro (`herdaDe: "restringido"`). O conteúdo do
   Addon tem o assert dele.

   Duas metades, porque o Restringido tem travas nos dois eixos:

   1. ORIGEM (`origemMae`): Tipo forçado, classe exclusiva, a cópia do Gêmeo.
   2. CLASSE (`especializacaoMae`): no jogador quem responde "sem energia" é a
      Especialização, e a herdeira tem id próprio. Mais as travas por id de
      HABILIDADE, que passam pelo `expandeHerdadas`.

   E o que NÃO desce, por decisão do autor (*"Só INT vai a 30"*): o limite 30
   dos físicos que o Tipo Restringido dá. É conteúdo do Ápice Corporal Humano, e
   a variação herda identidade, não conteúdo. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const E = await import(R + "afty-especializacoes.js");
const H = await import(R + "afty-habilidades.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const BRUTO = {
  id: "teste-variacao-restringido",
  nome: "Teste de Variação do Restringido",
  paraRaw: "afty",
  acrescenta: {
    origens: [{
      id: "intelecto",
      nome: "Restrição de Teste",
      variacaoDe: "restringido",
      especializacaoExclusivaId: "res_teste",
      limiteAtributo: { inteligencia: 30 },
      caracteristicas: [{ id: "mente", nome: "Mente", descricao: "Uma característica qualquer." }],
    }],
    especializacoes: [{
      id: "res_teste",
      nome: "Restringido de Teste",
      herdaDe: "restringido",
      exclusivaOrigemId: "intelecto",
      incompativeisIds: ["restringido"],
    }],
  },
};
const ORIGEM = "teste-variacao-restringido:intelecto";
const ESP = "teste-variacao-restringido:res_teste";
const clone = (id) => `${ESP}__${id}`;

const pacote = A.normalizarPacote(BRUTO);
t("pacote válido", A.validarPacote(BRUTO), []);
t("instala sem problema de validador", A.aplicarAddons([pacote]).problemas, []);

/* ---------------- o verbo, dos dois lados ---------------- */
t("a mãe da variação é o Restringido", O.origemMae(ORIGEM), "restringido");
t("o Restringido é mãe de si mesmo", O.origemMae("restringido"), "restringido");
t("a variação é variação do Restringido", O.ehVariacaoDoRestringido(ORIGEM), true);
t("o Restringido do livro não é variação dele", O.ehVariacaoDoRestringido("restringido"), false);
t("outra origem não é variação", O.ehVariacaoDoRestringido("inato"), false);
t("sem origem, não é variação", O.ehVariacaoDoRestringido(null), false);
t("a mãe da herdeira é o Restringido", E.especializacaoMae(ESP), "restringido");
t("classe do livro é mãe de si mesma", E.especializacaoMae("lutador"), "lutador");
t("sem classe, sem mãe", E.especializacaoMae(null), null);

/* ---------------- os ids do mesmo JSON ganham o prefixo ---------------- */
t("a origem aponta para a herdeira prefixada", O.getOrigem(ORIGEM)?.especializacaoExclusivaId, ESP);
t("a herdeira aponta para a origem prefixada", E.getEspecializacao(ESP)?.exclusivaOrigemId, ORIGEM);

/* ---------------- a trava de origem e de Tipo ---------------- */
const fichaCom = (origemId, extra = {}) => {
  const c = createBlankAfty();
  c.addons = [pacote];
  c.core.origem = { id: origemId };
  return Object.assign(c, extra);
};
const disponiveis = (origemId) =>
  E.especializacoesDisponiveis(origemId, O.origensQualificadas(fichaCom(origemId))).map((e) => e.id);
t("a variação força o Tipo Restringido", E.tipoObrigatorio(ORIGEM), "restringido");
t("e só oferece esse Tipo", E.tiposDisponiveis(ORIGEM).map((x) => x.value), ["restringido"]);
t("a variação só vê a herdeira", disponiveis(ORIGEM), [ESP]);
t("a herdeira é a classe obrigatória da variação", E.especializacaoObrigatoria(ORIGEM), ESP);
t("e a variação não faz multiclasse, nem no jogador", E.maxEspecializacoes(ORIGEM, O.origensQualificadas(fichaCom(ORIGEM)), "player"), 1);
t("o Restringido do livro continua só com a classe dele", disponiveis("restringido"), ["restringido"]);
t("outra origem não vê a herdeira", disponiveis("inato").includes(ESP), false);
t("nem o Restringido do livro", disponiveis("inato").includes("restringido"), false);

/* ---------------- a herança das habilidades ---------------- */
t("o Restrito pelos Céus foi clonado", !!H.getHabilidade(clone("res_restrito_pelos_ceus")), true);
t("o clone do Respeito Celeste concede à escolha CLONADA",
  H.getHabilidade(clone("res_respeito_celeste"))?.concedeEscolha?.habilidade, clone("res_restrito_pelos_ceus"));
t("e o Respeito Celeste do livro segue apontando para o livro",
  H.getHabilidade("res_respeito_celeste")?.concedeEscolha?.habilidade, "res_restrito_pelos_ceus");

/* ---------------- o derive, nos dois sistemas ---------------- */
const variacao = (nd, sistema, extra = {}) => fichaCom(ORIGEM, {
  rulesVersion: sistema,
  core: { ...createBlankAfty().core, nd, tipo: "restringido", origem: { id: ORIGEM } },
  especializacoes: [{ id: ESP, nivel: nd }],
  ...extra,
});
const livro = (nd, sistema) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.tipo = "restringido";
  c.core.origem = { id: "restringido" };
  c.especializacoes = [{ id: "restringido", nivel: nd }];
  return c;
};

for (const sistema of ["afty", "player"]) {
  const d = deriveAfty(variacao(10, sistema));
  const r = deriveAfty(livro(10, sistema));
  t(`[${sistema}] a variação chama o recurso de Estamina`, d.recursoLabel, "Estamina");
  t(`[${sistema}] sem Nível de Aptidão`, d.totalAptidao, 0);
  t(`[${sistema}] sem orçamento próprio de Feitiço`, d.orcamentoHabilidades?.proprioFeitico ?? 0, 0);
  t(`[${sistema}] a INT vai a 30`, d.attrLimiteEfetivo?.inteligencia, 30);
  t(`[${sistema}] os físicos NÃO vão a 30`, [d.attrLimiteEfetivo?.forca, d.attrLimiteEfetivo?.destreza, d.attrLimiteEfetivo?.constituicao], [20, 20, 20]);
  t(`[${sistema}] e o Restringido do livro continua com os físicos a 30`,
    [r.attrLimiteEfetivo?.forca, r.attrLimiteEfetivo?.destreza, r.attrLimiteEfetivo?.constituicao], [30, 30, 30]);
  t(`[${sistema}] o nível de efeito do Restringido chega à herdeira`, d.habilidades?.niveisPorEfeito?.restringido, 10);
  t(`[${sistema}] o esc_restringido do DSL também`, d.especializacoes?.escolhidas?.[0]?.id, ESP);
  t(`[${sistema}] o PE é o mesmo do Restringido do livro`, d.pe?.max ?? d.pe, r.pe?.max ?? r.pe);

  /* O Roubo de Habilidade da herdeira mora sob o id clonado. */
  const alvo = H.HABILIDADES_ROUBAVEIS[0]?.id;
  const comRoubo = deriveAfty(variacao(10, sistema, {
    habilidades: [clone("res_roubo_de_habilidade")],
    escolhasHabilidade: { [clone("res_roubo_de_habilidade")]: [alvo] },
  }));
  t(`[${sistema}] o Roubo da herdeira rouba`, comRoubo.habilidades?.roubadas, [alvo]);

  /* O Respeito Celeste da herdeira dá Dádiva a mais no Restrito pelos Céus DELA.
     A Base entra na ficha à mão porque na criatura ela não é automática (a
     divergência `basesAutomaticas` é do jogador), e no jogador repeti-la é
     inofensivo. */
  const base = clone("res_restrito_pelos_ceus");
  const semRespeito = deriveAfty(variacao(12, sistema, { habilidades: [base] }));
  const comRespeito = deriveAfty(variacao(12, sistema, { habilidades: [base, clone("res_respeito_celeste")] }));
  const vagas = (x) => x.habilidades?.escolhas?.porHab?.[clone("res_restrito_pelos_ceus")]?.allowance ?? null;
  t(`[${sistema}] o Respeito Celeste da herdeira dá 2 Dádivas a mais no 12`, vagas(comRespeito) - vagas(semRespeito), 2);
}

/* ---------------- a variação sem classe própria segue a mãe ---------------- */
const semClasse = structuredClone(BRUTO);
semClasse.id = "teste-variacao-sem-classe";
delete semClasse.acrescenta.especializacoes;
delete semClasse.acrescenta.origens[0].especializacaoExclusivaId;
A.aplicarAddons([A.normalizarPacote(semClasse)]);
t("sem herdeira, a variação fica presa ao Restringido do livro",
  E.especializacoesDisponiveis("teste-variacao-sem-classe:intelecto").map((e) => e.id), ["restringido"]);

/* ---------------- a herdeira sem trava de origem é relatada ---------------- */
const aberta = structuredClone(BRUTO);
delete aberta.acrescenta.especializacoes[0].exclusivaOrigemId;
const { problemas } = A.aplicarAddons([A.normalizarPacote(aberta)]);
t("a herdeira de classe exclusiva sem trava é relatada",
  problemas.flatMap((p) => p.problemas).some((m) => m.includes("fica aberta a toda origem")), true);

/* ---------------- sem o pacote, o livro não mudou ---------------- */
A.aplicarAddons([]);
t("sem o pacote a origem some", O.getOrigem(ORIGEM), null);
t("e o Restringido do livro não mudou", E.especializacoesDisponiveis("restringido").map((e) => e.id), ["restringido"]);
for (const sistema of ["afty", "player"]) {
  const antes = deriveAfty(livro(10, sistema));
  A.aplicarAddons([pacote]);
  const depois = deriveAfty(livro(10, sistema));
  A.aplicarAddons([]);
  const pedaco = (x) => ({ hp: x.hp, pe: x.pe, defesa: x.defesa, testes: x.testes, dano: x.dano, limites: x.attrLimiteEfetivo });
  t(`[${sistema}] o Restringido do livro deriva igual com o pacote instalado`, pedaco(depois), pedaco(antes));
}

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
