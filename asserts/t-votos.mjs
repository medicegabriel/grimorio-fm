/* VOTOS NATIVOS: Contratuais ilimitados, Mecânicos limitados pelo BT e
   Benefício/Malefício ligados ao Motor. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const {
  createBlankVotoContratual,
  createBlankVotoMecanico,
  efeitosDeVotos,
  limiteVotosMecanicos,
  votoPadraoDeAddon,
  votosDaFicha,
} = await import(R + "afty-votos.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const { deriveAfty } = await import(R + "afty-derive.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const blank = createBlankAfty();
t("ficha nova traz Votos vazios", blank.votos, { contratuais: [], mecanicos: [] });
t("Voto Contratual nasce só com texto", Object.keys(createBlankVotoContratual()).sort(), ["id", "texto"]);
t("Voto Mecânico nasce com os dois lados", Object.keys(createBlankVotoMecanico()).sort(),
  ["beneficio", "id", "maleficio", "narrativa", "nome"]);

t("limite Mecânico é o BT", [limiteVotosMecanicos(0), limiteVotosMecanicos(4), limiteVotosMecanicos(8)], [0, 4, 8]);
t("limite saneia negativo e decimal", [limiteVotosMecanicos(-3), limiteVotosMecanicos(3.9)], [0, 3]);

const muitosContratuais = Array.from({ length: 50 }, (_, i) => ({ id: `c${i}`, texto: `Contrato ${i}` }));
t("Contratuais não são cortados", votosDaFicha({ votos: { contratuais: muitosContratuais, mecanicos: [] } }).contratuais.length, 50);

const mecanico = (id, valor) => ({
  id,
  nome: id,
  narrativa: "Narrativa",
  beneficio: { texto: "Benefício", efeitos: [{ canal: "rdGeral", expr: String(valor) }] },
  maleficio: { texto: "Malefício", efeitos: [{ canal: "movimento", expr: "-1" }] },
});
const comTres = { votos: { contratuais: muitosContratuais, mecanicos: [mecanico("a", 1), mecanico("b", 2), mecanico("c", 3)] } };
const efeitosDois = efeitosDeVotos(comTres, 2);
t("só BT Votos Mecânicos emitem efeitos", efeitosDois.length, 4);
t("o Voto acima do BT não emite", efeitosDois.some((efeito) => efeito.nome.includes("Voto c")), false);
t("Benefício e Malefício usam origem Voto", [...new Set(efeitosDois.map((efeito) => efeito.origem))], ["voto"]);
t("BT zero não emite efeito", efeitosDeVotos(comTres, 0), []);

const efeitoCompleto = efeitosDeVotos({
  votos: {
    contratuais: [],
    mecanicos: [{
      id: "completo",
      nome: "Completo",
      narrativa: "",
      beneficio: {
        texto: "",
        efeitos: [{
          canal: "bonusPericia", alvo: "atletismo", expr: "bt", quando: "nd >= 5", duracao: "temporaria",
        }],
      },
      maleficio: { texto: "", efeitos: [] },
    }],
  },
}, 1)[0];
t("Voto preserva alvo, condição e duração", {
  alvo: efeitoCompleto.alvo,
  quando: efeitoCompleto.quando,
  duracao: efeitoCompleto.duracao,
}, { alvo: "atletismo", quando: "nd >= 5", duracao: "temporaria" });

const legado = {
  pacto: {
    nome: "Receptáculo",
    descricao: "Voto legado",
    beneficios: [
      { texto: "Mais PE", efeitos: [{ canal: "pe", expr: "2 * nd" }] },
      { texto: "Mais Shikigamis", efeitos: [] },
    ],
    maleficios: [
      { texto: "Menos PV", efeitos: [{ canal: "hp", expr: "-6 * nd" }] },
      { texto: "Regra de mesa", efeitos: [] },
    ],
  },
};
const convertido = votosDaFicha(legado).mecanicos[0];
t("Pacto legado vira um Voto", convertido.nome, "Receptáculo");
t("descrição antiga vira narrativa", convertido.narrativa, "Voto legado");
t("Benefícios antigos são unidos", convertido.beneficio.texto, "Mais PE\n\nMais Shikigamis");
t("Malefícios antigos são unidos", convertido.maleficio.texto, "Menos PV\n\nRegra de mesa");
t("efeitos antigos são preservados", [convertido.beneficio.efeitos.length, convertido.maleficio.efeitos.length], [1, 1]);
t("merge grava a migração no formato novo", mesclaFichaAfty(legado).votos.mecanicos[0].nome, "Receptáculo");

const pacote = { id: "modelo", nome: "Modelo", pactoPadrao: legado.pacto };
const modelo = votoPadraoDeAddon({ addons: [pacote] });
t("addon antigo oferece um modelo de Voto", [modelo.addonNome, modelo.voto.nome], ["Modelo", "Receptáculo"]);
t("o modelo não depende de abrir aba por primitiva", votoPadraoDeAddon({ addons: [{ ...pacote, permite: [] }] }).voto.nome, "Receptáculo");

const criatura = createBlankAfty();
criatura.core.nd = 20;
const semVoto = deriveAfty(criatura);
criatura.votos.mecanicos = [{
  id: "motor",
  nome: "Teste do Motor",
  narrativa: "",
  beneficio: { texto: "", efeitos: [
    { canal: "rdGeral", expr: "5", quando: "bt > 0", duracao: "temporaria" },
    { canal: "bonusPericia", alvo: "atletismo", expr: "2" },
  ] },
  maleficio: { texto: "", efeitos: [] },
}];
const comVoto = deriveAfty(criatura);
t("efeito do Voto chega ao derivado", comVoto.rdGeral - semVoto.rdGeral, 5);
t("a ficha expõe o BT usado como limite", comVoto.maestria > 0, true);
t("editor recebe valor, condição e duração resolvidos", {
  valor: comVoto.votosEfeitos.motor.beneficio[0].valor,
  ativo: comVoto.votosEfeitos.motor.beneficio[0].ativo,
  quando: comVoto.votosEfeitos.motor.beneficio[0].quando,
  duracao: comVoto.votosEfeitos.motor.beneficio[0].duracao,
}, { valor: 5, ativo: true, quando: "bt > 0", duracao: "temporaria" });
t("editor recebe o tipo de alvo do canal", {
  alvo: comVoto.votosEfeitos.motor.beneficio[1].alvo,
  alvoTipo: comVoto.votosEfeitos.motor.beneficio[1].alvoTipo,
}, { alvo: "atletismo", alvoTipo: "pericia" });

criatura.votos.mecanicos[0].beneficio.efeitos[0].quando = "0";
const condicaoFalsa = deriveAfty(criatura);
t("condição falsa desliga o efeito no motor", condicaoFalsa.rdGeral - semVoto.rdGeral, 0);
t("condição falsa aparece inativa no editor", condicaoFalsa.votosEfeitos.motor.beneficio[0].ativo, false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
