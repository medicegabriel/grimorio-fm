import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, funcionamentosDaFicha } = await import(R + "afty-schema.js");
const { normalizarPacote, validarPacote, feiticosDeAddon } = await import(R + "afty-addons.js");
const { nivelMaxFeitico, calcularFeiticoPersonalizado } = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const PACOTE = {
  id: "minha-tecnica",
  nome: "Minha Técnica",
  versao: "1.0.0",
  paraRaw: "afty",
  funcionamentos: [{
    id: "nucleo",
    nome: "Núcleo Particular",
    descricao: "Texto particular.",
    efeitos: [{ canal: "rdGeral", expr: "3" }],
  }],
  feiticos: [
    {
      id: "ilusao_menor",
      nome: "Ilusão Menor",
      tipo: "personalizado",
      nivel: 3,
      descricao: "Texto do Feitiço.",
      rolagens: [{ rotulo: "Dano", dados: 12, faces: 8 }],
    },
    {
      id: "ilusao_perfeita",
      nome: "Ilusão Perfeita",
      tipo: "passivo",
      nivel: 4,
      descricao: "Texto da Passiva.",
      efeitosPassivo: [{ canal: "pe", expr: "-8" }],
    },
  ],
};

t("pacote só com Funcionamento Básico é válido", validarPacote(PACOTE), []);
const pacote = normalizarPacote(PACOTE);
t("normalização preserva o Funcionamento", pacote.funcionamentos.length, 1);
t("normalização preserva os modelos de Feitiço", pacote.feiticos.length, 2);

const sem = createBlankAfty();
const com = createBlankAfty();
com.addons = [pacote];

t("criatura sem pacote só tem o principal", funcionamentosDaFicha(sem).length, 1);
const lista = funcionamentosDaFicha(com);
t("criatura com pacote recebe o adicional", lista.length, 2);
t("id do Funcionamento recebe namespace", lista[1].id, "minha-tecnica:nucleo");
t("Funcionamento de addon é marcado", lista[1].deAddon, true);
t("texto vem do pacote", lista[1].descricao, "Texto particular.");

const rdSem = deriveAfty(sem).rdGeral;
const rdCom = deriveAfty(com).rdGeral;
t("efeito do Funcionamento passa pelo deriveAfty", rdCom - rdSem, 3);

const outra = createBlankAfty();
t("efeito não vaza para outra criatura", deriveAfty(outra).rdGeral, rdSem);

const modelosNivel3 = feiticosDeAddon(com, 3);
const modelosNivel4 = feiticosDeAddon(com, 4);
t("Nível 3 só libera o modelo de Nível 3", modelosNivel3.length, 1);
t("Nível 4 libera os dois modelos", modelosNivel4.length, 2);
t("id do modelo recebe namespace", modelosNivel4[0].id, "minha-tecnica:ilusao_menor");
t("modelo de addon é marcado", modelosNivel4[0].deAddon, true);
t("Especialista ainda tem Feitiço Nível 3 no nível 10", nivelMaxFeitico(10, 10), 3);
t("Especialista recebe Feitiço Nível 4 no nível 11", nivelMaxFeitico(11, 11), 4);
const personalizado = calcularFeiticoPersonalizado(modelosNivel4[0], { cdBase: 27 });
t("Feitiço Personalizado usa o custo normal do nível", personalizado.custoPE, 8);
t("Feitiço Personalizado usa a CD da ficha", personalizado.cd, 27);

t("id repetido é recusado", validarPacote({
  ...PACOTE,
  funcionamentos: [PACOTE.funcionamentos[0], PACOTE.funcionamentos[0]],
}).length > 0, true);
t("Funcionamento vazio é recusado", validarPacote({
  ...PACOTE,
  funcionamentos: [{ id: "vazio", nome: "Vazio" }],
}).length > 0, true);
t("efeitos precisam ser lista", validarPacote({
  ...PACOTE,
  funcionamentos: [{ id: "x", nome: "X", descricao: "X", efeitos: {} }],
}).length > 0, true);
t("tipo de Feitiço desconhecido é recusado", validarPacote({
  ...PACOTE,
  feiticos: [{ id: "x", nome: "X", nivel: 1, tipo: "outro", descricao: "X" }],
}).length > 0, true);
t("rolagem inválida é recusada", validarPacote({
  ...PACOTE,
  feiticos: [{ id: "x", nome: "X", nivel: 1, tipo: "personalizado", descricao: "X", rolagens: [{ dados: 0, faces: 8 }] }],
}).length > 0, true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
