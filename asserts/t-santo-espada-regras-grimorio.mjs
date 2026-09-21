/* Os dois Addons de regra: Voto automático do Santo da Espada e Regras Grimorio. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { validarPacote, normalizarPacote } = await import(R + "afty-addons.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const { deriveAfty } = await import(R + "afty-derive.js");
const {
  regrasAftyDeVotosAtivos,
  sincronizarVotosAutomaticos,
  votosDaFicha,
} = await import(R + "afty-votos.js");
const { calcularFeiticoPassivo } = await import(R + "afty-feiticos.js");

const SANTO = JSON.parse(readFileSync(
  new URL("../addons/restricao-celestial-santo-da-espada.json", import.meta.url),
  "utf8",
));
const REGRAS = JSON.parse(readFileSync(
  new URL("../addons/regras-grimorio.json", import.meta.url),
  "utf8",
));

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

t("Addon do Santo é válido", validarPacote(SANTO), []);
t("Addon Regras Grimorio é válido", validarPacote(REGRAS), []);
t("normalizador preserva o Voto automático", normalizarPacote(SANTO).votoAutomatico.nome,
  "Restrição Celestial - O Santo da Espada");
t("normalizador preserva as regras finais", normalizarPacote(REGRAS).regrasAfty.multiplicadorPvFinal, 2);
t("regra desconhecida é recusada",
  validarPacote({ ...REGRAS, id: "regra-invalida", regrasAfty: { inventada: true } })
    .some((problema) => problema.includes("regra desconhecida")), true);

const votoManual = {
  id: "manual",
  nome: "Voto Manual",
  narrativa: "",
  beneficio: { texto: "", efeitos: [] },
  maleficio: { texto: "", efeitos: [] },
};
const comSanto = {
  ...createBlankAfty(),
  addons: [SANTO],
  votos: { contratuais: [], mecanicos: [votoManual] },
};
const sincronizada = sincronizarVotosAutomaticos(comSanto);
t("Voto automático entra na primeira posição",
  sincronizada.votos.mecanicos.map((voto) => voto.nome),
  ["Restrição Celestial - O Santo da Espada", "Voto Manual"]);
t("Voto automático registra o Addon de origem",
  sincronizada.votos.mecanicos[0].origemAddon, SANTO.id);
t("Voto automático ocupa uma única vaga",
  votosDaFicha(sincronizada).mecanicos.length, 2);
t("sincronizar novamente não duplica o Voto",
  sincronizarVotosAutomaticos(sincronizada).votos.mecanicos.length, 2);
t("leitor materializa o Voto numa ficha mesclada",
  votosDaFicha(mesclaFichaAfty(comSanto)).mecanicos[0].origemAddon, SANTO.id);
t("BT zero desliga as regras do Voto",
  regrasAftyDeVotosAtivos(sincronizada, 0).multiplicadorPeMaximo, 1);
t("primeira vaga ativa a metade do PE",
  regrasAftyDeVotosAtivos(sincronizada, 1).multiplicadorPeMaximo, 0.5);

const passivo = {
  id: "passivo_teste",
  nome: "Passiva de Teste",
  tipo: "passivo",
  nivel: 5,
  categoriaPassivo: "defesa",
  efeitosPassivo: [],
};
const ficha = (addons = [], { comPassivo = true, comItem = true } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 20, tipo: "conjurador", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "conjurador", nivel: 20 }];
  f.addons = addons;
  f.votos = { contratuais: [], mecanicos: [votoManual] };
  f.feiticos = comPassivo ? [passivo] : [];
  f.equipamentos = comItem
    ? { itens: [{ uid: "simbolo", tipo: "item", refId: "it_simbolo_de_vida_absoluta", qtd: 1, equipado: false }] }
    : { itens: [] };
  return mesclaFichaAfty(f);
};

const baseSemPassiva = deriveAfty(ficha([], { comPassivo: false }));
const baseComPassiva = deriveAfty(ficha([]));
const soSanto = deriveAfty(ficha([SANTO]));
const soRegras = deriveAfty(ficha([REGRAS]));
const osDois = deriveAfty(ficha([SANTO, REGRAS]));

t("Passiva comum custa 10 de PE Máximo", baseSemPassiva.pe - baseComPassiva.pe, 10);
t("Santo isenta a Passiva antes de reduzir o PE",
  soSanto.pe * 2, baseSemPassiva.pe);
t("Santo reduz o PE final pela metade",
  soSanto.pe, Math.floor(baseSemPassiva.pe / 2));
const imparBase = ficha([], { comPassivo: false, comItem: false });
imparBase.core.tecnicaEfeitos = [{ canal: "pe", expr: "1" }];
const imparSanto = sincronizarVotosAutomaticos({ ...imparBase, addons: [SANTO] });
t("metade de PE ímpar arredonda para baixo",
  deriveAfty(imparSanto).pe, Math.floor(deriveAfty(imparBase).pe / 2));
t("Regras Grimorio isenta a Passiva", soRegras.pe, baseSemPassiva.pe);
t("Regras Grimorio cancela somente a metade do Santo", osDois.pe, baseSemPassiva.pe);
t("os dois mantêm a isenção das Passivas", osDois.regrasAfty.passivasSemCustoPeMaximo, true);
t("o resumo da Passiva não mostra custo com Santo",
  soSanto.feiticos.lista.find((feitico) => feitico.id === passivo.id).custoPeMaximo, null);
t("o editor da Passiva marca o custo como inativo",
  calcularFeiticoPassivo(passivo, { sistema: "player", passivasSemCustoPeMaximo: true }).custoPeMaximoAtivo,
  false);

t("Regras Grimorio dobra o PV final", soRegras.hp, baseSemPassiva.hp * 2);
t("a Integridade continua no valor anterior", soRegras.almaMax, baseSemPassiva.almaMax);
t("a regra final expõe o multiplicador de PV", soRegras.regrasAfty.multiplicadorPvFinal, 2);
const curaBase = baseSemPassiva.cura.linhas.find((linha) => linha.nome === "Símbolo de Vida Absoluta");
const curaRegras = soRegras.cura.linhas.find((linha) => linha.nome === "Símbolo de Vida Absoluta");
t("Símbolo de Vida Absoluta usa o PV anterior à dobra", curaRegras.fixo, curaBase.fixo);
t("a fonte de PV mostra a dobra do Addon",
  soRegras.partes.hp.some((parte) => parte.label === "Regras Grimorio" && parte.texto === "×2"), true);
t("a fonte de PE mostra o cancelamento da metade",
  osDois.partes.pe.some((parte) => parte.label === "Regras Grimorio"
    && parte.texto === "ignora a redução de PE Máximo dos Votos"), true);

const retidoSemAddon = { ...sincronizarVotosAutomaticos(ficha([SANTO])), addons: [] };
const semAddonDerivado = deriveAfty(retidoSemAddon);
t("desligar o Addon preserva o texto do Voto",
  votosDaFicha(retidoSemAddon).mecanicos[0].nome, "Restrição Celestial - O Santo da Espada");
t("Voto retido sem o Addon não mantém a regra especial",
  semAddonDerivado.pe, baseComPassiva.pe);

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
