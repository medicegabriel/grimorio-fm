/* Pacote Flugel: Futen, Akutame, treinos, talentos e estado de Cônjuge. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const T = await import(R + "afty-talentos.js");
const TR = await import(R + "afty-treinamentos.js");
const { AFTY_HABILIDADES, resolveHabilidades } = await import(R + "afty-habilidades.js");
const { valorCanal } = await import(R + "afty-efeitos.js");
const { sessaoEmBranco, alteraTreinoAtivo } = await import(R + "ficha/ficha-sessao.js");
const { FLUGEL } = await import(R + "addons/flugel.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const pacote = A.normalizarPacote(FLUGEL);
t("pacote válido", A.validarPacote(FLUGEL), []);
A.aplicarAddons([pacote]);

const FUTEN = "flugel:orig_caminho_futen";
const AKUTAME = "flugel:cla_akutame";
const NAO_CONGENITO = "flugel:treino_atributo_nao_congenito";
const CONJUGE = "flugel:treino_conjuge";
const CONJUGE_2 = "flugel:treino_conjuge_pt_2";

t("origem Futen instalada", O.getOrigem(FUTEN)?.nome, "Caminho do Futen (風天)");
t("clã Akutame instalado", O.getCla(AKUTAME)?.nome, "Clã Akutame");
t("treino não congênito instalado", TR.getTreinamento(NAO_CONGENITO)?.nome, "Treino de Atributo - Não Congênito");
t("Herança Sugawara instalada", T.getTalento("flugel:tal_heranca_sugawara")?.nome, "Herança Sugawara");
t("Alma Livre remendada", T.getTalento("tal_alma_livre")?.nivelAlmaLivreAjuste, -4);

const futen = createBlankAfty();
futen.core.nd = 10;
futen.core.origem = {
  id: FUTEN,
  escolhas: {
    futen_pericia: ["futen_pericia_atletismo"],
    futen_atributo: ["futen_atributo_sabedoria"],
  },
};
futen.attributes.sabedoria = 18;
const df = deriveAfty(futen);
const atletismoFuten = df.testes.pericias.find((p) => p.id === "atletismo");
t("Futen treina a perícia escolhida", atletismoFuten.prof, "treinado");
t("Futen troca o atributo-chave", atletismoFuten.atributo, "sabedoria");
t("Futen soma 3m de movimento", df.movimento - deriveAfty({ ...futen, core: { ...futen.core, origem: {} } }).movimento, 3);

const akutame = createBlankAfty();
akutame.core.nd = 10;
akutame.core.origem = {
  id: "herdado",
  cla: AKUTAME,
  escolhas: { akutame_mestre: ["akutame_mestre_atletismo"] },
};
const da = deriveAfty(akutame);
t("Akutame treina Atletismo como Mestre no nível 10", da.testes.pericias.find((p) => p.id === "atletismo").prof, "mestre");
t("Akutame treina Feitiçaria", da.testes.pericias.find((p) => p.id === "feiticaria").prof, "treinado");
t("Akutame soma metade do BT na Defesa", da.partes.defesa.some((p) => p.label === "Clã Akutame" && p.valor === Math.floor(maestria(10) / 2)), true);
t("Akutame soma metade do BT no Acerto", da.testes.ataques.every((a) => a.partes.some((p) => p.label === "Clã Akutame")), true);

const treino = createBlankAfty();
treino.core.nd = 10;
for (const attr of Object.keys(treino.attributes)) treino.attributes[attr] = 10;
treino.treinamentos = { [NAO_CONGENITO]: 4 };
treino.treinamentoAlvos = { [NAO_CONGENITO]: { atributo: "sabedoria", pericia: "atletismo" } };
const dt = deriveAfty(treino);
t("treino não congênito soma 2 no atributo", dt.attrMotor.sabedoria, 2);
t("treino não congênito aumenta o limite", valorCanal(dt.efeitos, "limiteAtributo", "sabedoria"), 1 + Math.floor(maestria(10) / 2));
t("treino não congênito troca o atributo da perícia", dt.testes.pericias.find((p) => p.id === "atletismo").atributo, "sabedoria");
t("requisito de todos os atributos reprova abaixo de 8", TR.avaliarRequisito({ tipo: "todosAtributos", valor: 8 }, { attrEff: { ...treino.attributes, forca: 7 } }).ok, false);

const casal = createBlankAfty();
casal.core.nd = 10;
casal.treinamentos = { [CONJUGE]: 4, [CONJUGE_2]: 4 };
casal.treinamentoEscolhas = {
  [CONJUGE]: { heranca_conjuge: "talento" },
  [CONJUGE_2]: { heranca_conjuge: "feitico" },
};
const casalOff = deriveAfty(casal);
const casalOn = deriveAfty(casal, { treinosAtivos: { conjuge: true } });
const casalSemHeranca = deriveAfty({ ...casal, treinamentoEscolhas: {} });
t("Cônjuge começa desligado", casalOff.gatilhosTreino, [{ id: "conjuge", label: "Cônjuge", ativo: false }]);
t("Cônjuge soma 2 de Defesa quando ligado", casalOn.defesa - casalOff.defesa, 2);
t("Cônjuge soma 2 de Acerto quando ligado", casalOn.testes.ataques[0].bonus - casalOff.testes.ataques[0].bonus, 2);
t("Cônjuge Pt. 2 soma 2 em Percepção", casalOn.testes.pericias.find((p) => p.id === "percepcao").bonus - casalOff.testes.pericias.find((p) => p.id === "percepcao").bonus, 2);
t("Cônjuge Pt. 2 soma 2 em Intuição", casalOn.testes.pericias.find((p) => p.id === "intuicao").bonus - casalOff.testes.pericias.find((p) => p.id === "intuicao").bonus, 2);
t("escolha Talento abre uma vaga", valorCanal(casalOff.efeitos, "vagasTalento") - valorCanal(casalSemHeranca.efeitos, "vagasTalento"), 1);
t("escolha Feitiço abre uma vaga", valorCanal(casalOff.efeitos, "vagasFeitico") - valorCanal(casalSemHeranca.efeitos, "vagasFeitico"), 1);
t("Pt. 2 exige o primeiro treino", TR.avaliarRequisito({ tipo: "treinamento", id: CONJUGE, etapa: 1 }, { treinamentos: {} }).ok, false);

const sessao = alteraTreinoAtivo(sessaoEmBranco(), "conjuge", true);
t("interruptor de sessão é isolado", sessao.treinosAtivos, { conjuge: true });

const habilidadeLutador = AFTY_HABILIDADES.find((h) => h.especializacaoId === "lutador");
const almaLivre = resolveHabilidades(
  { habilidades: [habilidadeLutador.id] },
  [{ id: "combatente", nivel: 10 }],
  0, maestria(10), 0, 1,
  { nd: 10, almaLivreEspecializacao: "lutador", almaLivreNivelAjuste: -4 },
);
t("Alma Livre usa nível de personagem menos 4", almaLivre.almaLivre.nivel, 6);

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
