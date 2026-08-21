import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");   // sempre primeiro, ver t-addons.mjs
const AD = await import(R + "afty-addons.js");
const H = await import(R + "afty-habilidades.js");
const T = await import(R + "afty-talentos.js");
const A = await import(R + "afty-aptidoes.js");
const E = await import(R + "afty-especializacoes.js");
const TR = await import(R + "afty-treinamentos.js");
const TE = await import(R + "afty-treinos-especiais.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---- todas as famílias esperadas estão registradas ---- */
const registradas = AD.familiasDeAddon().map((f) => f.id).sort();
/* ⚠ Assert por CONTÉM, e não por igualdade: família nova é o caminho normal
   deste sistema, e um assert de lista exata transformaria cada uma numa falha
   de teste a corrigir à mão. O que importa é que estas continuem ligadas. */
const ESPERADAS = ["aptidoes", "condicoes", "especializacoes", "habilidades", "talentos",
  "tiposDano", "treinamentos", "treinosEspeciais"];
t("as familias esperadas continuam ligadas",
  ESPERADAS.filter((f) => !registradas.includes(f)), []);

/* Tamanhos do raw, para conferir que tudo volta ao lugar no fim. */
const RAW = {
  habilidades: H.AFTY_HABILIDADES.length,
  talentos: T.AFTY_TALENTOS.length,
  aptidoes: A.AFTY_APTIDOES.length,
  especializacoes: E.AFTY_ESPECIALIZACOES.length,
  treinamentos: TR.AFTY_TREINAMENTOS.length,
  treinosEspeciais: TE.AFTY_TREINOS_ESPECIAIS.length,
};

/* ---- um pacote que mexe nas SEIS de uma vez ---- */
const PACOTE = {
  id: "mesa-teste",
  nome: "Mesa de Teste",
  versao: "1.0.0",
  acrescenta: {
    habilidades: [{
      id: "hab_nova", nome: "Habilidade Nova", especializacaoId: "lutador",
      tipo: "base", nivel: 1, descricao: "x", requisitos: [], tags: ["nova"],
    }],
    talentos: [{ id: "tal_novo", nome: "Talento Novo", grupo: "geral", descricao: "x", tags: ["nova"] }],
    aptidoes: [{ id: "apt_nova", nome: "Aptidão Nova", trilha: "au", categoria: "aura", descricao: "x" }],
    especializacoes: [{ id: "esp_nova", nome: "Especialização Nova" }],
    treinamentos: [{ id: "tre_novo", nome: "Treino Novo", etapas: [] }],
    treinosEspeciais: [{ id: "tes_novo", nome: "Treino Especial Novo", descricao: "x", concede: "Coisa Nova", focos: 1 }],
  },
};

t("o pacote das seis e valido", AD.validarPacote(PACOTE), []);
const r = AD.aplicarAddons([PACOTE]);
t("instalou sem problema", r.problemas, []);

/* ---- cada catálogo cresceu exatamente 1, e resolve pelo id prefixado ---- */
const casos = [
  ["habilidades", H.AFTY_HABILIDADES, H.getHabilidade, "hab_nova"],
  ["talentos", T.AFTY_TALENTOS, T.getTalento, "tal_novo"],
  ["aptidoes", A.AFTY_APTIDOES, A.getAptidao, "apt_nova"],
  ["especializacoes", E.AFTY_ESPECIALIZACOES, E.getEspecializacao, "esp_nova"],
  ["treinamentos", TR.AFTY_TREINAMENTOS, TR.getTreinamento, "tre_novo"],
  ["treinosEspeciais", TE.AFTY_TREINOS_ESPECIAIS, TE.getTreinoEspecial, "tes_novo"],
];
for (const [nome, lista, getter, id] of casos) {
  t(`${nome}: cresceu 1`, lista.length, RAW[nome] + 1);
  t(`${nome}: resolve prefixado`, !!getter(`mesa-teste:${id}`), true);
  t(`${nome}: NAO resolve cru`, getter(id), null);
  t(`${nome}: carrega o dono`, getter(`mesa-teste:${id}`).addonId, "mesa-teste");
}

/* ---- os validadores do raw continuam limpos com o conteúdo de addon ---- */
t("habilidades valido", H.validarCatalogoHabilidades(), []);
t("talentos valido", T.validarCatalogoTalentos(), []);
t("aptidoes valido", A.validarCatalogoAptidoes(), []);
t("especializacoes valido", E.validarCatalogoEspecializacoes(), []);
t("treinos especiais valido", TE.validarCatalogoTreinosEspeciais(), []);

/* ---- a criatura usa as de addon, e a linha morta acha os órfãos ---- */
const ficha = (extra = {}) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.addons = [PACOTE];
  return Object.assign(c, extra);
};

const usando = deriveAfty(ficha({
  habilidades: ["mesa-teste:hab_nova"],
  talentos: ["mesa-teste:tal_novo"],
  treinosEspeciais: [{ id: "mesa-teste:tes_novo", alvo: null }],
}));
t("derive com quatro familias de addon nao quebrou", typeof usando.hp, "number");
t("nenhum problema quando tudo resolve", usando.addonProblemas, []);

/* Agora sem o addon ligado: TUDO vira linha morta, e a ficha abre igual. */
AD.limparAddons();
const orfa = deriveAfty({
  ...ficha({
    habilidades: ["mesa-teste:hab_nova"],
    talentos: ["mesa-teste:tal_novo"],
    aptidoesAmaldicoadas: ["mesa-teste:apt_nova"],
    treinamentos: { "mesa-teste:tre_novo": 2 },
    treinosEspeciais: [{ id: "mesa-teste:tes_novo", alvo: null }],
  }),
  addons: [],
});
t("a ficha orfa ABRE", typeof orfa.hp, "number");
const familiasComProblema = [...new Set(orfa.addonProblemas.map((p) => p.familia))].sort();
t("as cinco familias usadas viraram linha morta", familiasComProblema,
  ["aptidoes", "habilidades", "talentos", "treinamentos", "treinosEspeciais"]);
t("cada problema diz o pacote",
  orfa.addonProblemas.every((p) => p.pacoteId === "mesa-teste"), true);
t("cada problema tem saida", orfa.addonProblemas.every((p) => !!p.saida), true);

/* Treinamento em progresso ZERO não é escolhido, então não é órfão. */
const zerado = deriveAfty({ ...ficha({ treinamentos: { "mesa-teste:tre_novo": 0 } }), addons: [] });
t("treinamento em zero nao vira problema", zerado.addonProblemas.length, 0);

/* ---- desinstalar devolve os seis catálogos ao raw ---- */
for (const [nome, lista] of casos.map(([n, l]) => [n, l])) {
  t(`${nome}: voltou ao raw`, lista.length, RAW[nome]);
}
t("nenhum addon ativo no fim", AD.addonsAtivos().length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
