/* Lote 04, 2026-10-03: os três bônus corpo a corpo miram armas e Ataque Básico,
   nos dois sistemas. Articulações Extensas não altera o alcance por Tamanho. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons, limparAddons } = await import(R + "afty-addons.js");
const { estadoLigadoDoFeitico } = await import(R + "afty-combate-conjurador.js");
const { createBlankFeitico } = await import(R + "afty-feiticos.js");
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const pacote = JSON.parse(readFileSync(new URL("../addons/maldicao-era-de-ouro.json", import.meta.url), "utf8"));
t("o pacote 2.1.1 instala sem problemas", [pacote.versao, aplicarAddons([pacote]).problemas], ["2.1.1", []]);
const ARMAS = ["arm_espada_curta", "arm_arco_longo", "arm_azagaia"];
const ALCANCE = ["basico", ...ARMAS];
const toque = { ...createBlankFeitico(), id: "toque", nome: "Feitiço de Toque", nivel: 1, resolucao: "ataque", trocas: { alcance: -999 } };
const auxiliar = (id, efeitoAux, extra = {}) => ({
  ...createBlankFeitico(), id, nome: `Auxiliar ${id}`, tipo: "auxiliar", nivel: 2,
  efeitoAux, duracaoAux: "duradoura", ...extra,
});
const corpo = auxiliar("Corpo", "alcanceCaC");
const distancia = auxiliar("Distância", "alcanceDistancia");
const lig = (f) => ({ [estadoLigadoDoFeitico(f.id)]: true });
const ficha = (sistema, o = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.name = "Alcance do Lote 04";
  c.core.nd = 20;
  c.especializacoes = o.especializacoes ?? [{ id: "lutador", nivel: 20 }];
  c.habilidades = o.habs ?? [];
  c.feiticos = [toque, ...(o.feiticos ?? [])];
  c.equipamentos.itens = ARMAS.map((refId, i) => ({ id: `arma${i}`, tipo: "arma", refId, equipado: true, qtd: 1 }));
  c.addons = [pacote];
  c.core.origem = { id: "maldicao-era-de-ouro:maldicao_era_de_ouro" };
  c.caracteristicasAmaldicoadas = o.extensas ? ["maldicao-era-de-ouro:ca_articulacoes_extensas"] : [];
  c.combate = { ativo: true, ...(o.combate ?? {}) };
  return c;
};
const linha = (d, id) => d.dano.entradas.find((e) => e.id === id);
const alcance = (d, id) => [linha(d, id)?.alcance?.curto, linha(d, id)?.alcance?.longo];
const fonte = (d, id, nome) => linha(d, id)?.alcance?.partes?.filter((p) => p.label === nome);
const alcanceToque = (d) => d.feiticos.lista.find((f) => f.id === "toque").propriedades.find((p) => p.id === "alcance").valor;
for (const sistema of ["afty", "player"]) {
  const d = (o = {}) => deriveAfty(ficha(sistema, o));
  const base = d();
  const delta = (real, id) => alcance(real, id).map((n, i) => n - alcance(base, id)[i]);
  t(`${sistema}: a contraprova é um Feitiço de Toque`, alcanceToque(base), "Toque");
  const cac = d({ feiticos: [corpo], combate: lig(corpo) });
  for (const id of ["basico", ARMAS[0]]) {
    t(`${sistema}: Auxiliar Corpo soma 4,5 m em ${id}`, delta(cac, id), [4.5, 4.5]);
    t(`${sistema}: Auxiliar Corpo aparece nas fontes de ${id}`, fonte(cac, id, corpo.nome), [{ label: corpo.nome, valor: 4.5, texto: "+4,5m" }]);
  }
  for (const id of ARMAS.slice(1)) t(`${sistema}: Auxiliar Corpo não chega em ${id}`, delta(cac, id), [0, 0]);
  t(`${sistema}: Auxiliar Corpo desligado`, delta(d({ feiticos: [corpo] }), "basico"), [0, 0]);
  t(`${sistema}: Auxiliar Corpo fora de combate`, delta(d({ feiticos: [corpo], combate: { ...lig(corpo), ativo: false } }), "basico"), [0, 0]);
  t(`${sistema}: Auxiliar Corpo não muda Feitiço de Toque`, alcanceToque(cac), alcanceToque(base));
  const dist = d({ feiticos: [distancia], combate: lig(distancia) });
  for (const id of ARMAS.slice(1)) {
    t(`${sistema}: Auxiliar Distância soma 9 m nos dois alcances de ${id}`, delta(dist, id), [9, 9]);
    t(`${sistema}: Auxiliar Distância aparece nas fontes de ${id}`, fonte(dist, id, distancia.nome), [{ label: distancia.nome, valor: 9, texto: "+9m" }]);
  }
  for (const id of ["basico", ARMAS[0]]) t(`${sistema}: Auxiliar Distância não chega em ${id}`, delta(dist, id), [0, 0]);
  t(`${sistema}: Auxiliar Distância desligado`, delta(d({ feiticos: [distancia] }), ARMAS[1]), [0, 0]);
  t(`${sistema}: Auxiliar Distância não muda Feitiço de Toque`, alcanceToque(dist), alcanceToque(base));
  // Nível 3 Sustentado: os valores do exemplo do lote são 4,5 e 9 m.
  for (const [aux, id, esperado] of [[corpo, "basico", 4.5], [distancia, ARMAS[1], 9]]) {
    const sust = { ...aux, duracaoAux: "sustentada", nivel: 3 };
    t(`${sistema}: ${aux.nome} Sustentado no Nível 3`, delta(d({ feiticos: [sust], combate: { sustentacaoFeitico1: sust.id } }), id), [esperado, esperado]);
  }
  const circular = { empolgacao: 5, manobraFinalizadora: "circular" };
  const fin = { habs: ["lut_manobras_finalizadoras"], combate: circular };
  const circ = d(fin);
  for (const id of ["basico", ARMAS[0]]) {
    t(`${sistema}: Circular soma 3 m em ${id}`, delta(circ, id), [3, 3]);
    t(`${sistema}: Circular aparece nas fontes de ${id}`, fonte(circ, id, "Manobras Finalizadoras"), [{ label: "Manobras Finalizadoras", valor: 3, texto: "+3m" }]);
  }
  for (const id of ARMAS.slice(1)) t(`${sistema}: Circular não chega em ${id}`, delta(circ, id), [0, 0]);
  t(`${sistema}: Circular desligado`, delta(d({ ...fin, combate: { empolgacao: 5 } }), "basico"), [0, 0]);
  t(`${sistema}: Circular com Empolgação 4`, delta(d({ ...fin, combate: { ...circular, empolgacao: 4 } }), "basico"), [0, 0]);
  t(`${sistema}: Circular fora de combate`, delta(d({ ...fin, combate: { ...circular, ativo: false } }), "basico"), [0, 0]);
  t(`${sistema}: Circular não muda Feitiço de Toque`, alcanceToque(circ), alcanceToque(base));
  const artic = d({ extensas: true });
  for (const id of ["basico", ARMAS[0]]) {
    t(`${sistema}: Articulações soma 1,5 m em ${id}`, delta(artic, id), [1.5, 1.5]);
    t(`${sistema}: Articulações aparece nas fontes de ${id}`, fonte(artic, id, "Articulações Extensas"), [{ label: "Articulações Extensas", valor: 1.5, texto: "+1,5m" }]);
  }
  for (const id of ARMAS.slice(1)) t(`${sistema}: Articulações não chega em ${id}`, delta(artic, id), [0, 0]);
  t(`${sistema}: Articulações não muda Espaço/Alcance por Tamanho`, artic.tamanho, base.tamanho);
  t(`${sistema}: Articulações vale fora de combate`, delta(d({ extensas: true, combate: { ativo: false } }), "basico"), [1.5, 1.5]);
  t(`${sistema}: Articulações não muda Feitiço de Toque`, alcanceToque(artic), alcanceToque(base));
  const juntos = d({ ...fin, extensas: true, feiticos: [corpo], combate: { ...circular, ...lig(corpo) } });
  t(`${sistema}: as três fontes somam uma vez`, delta(juntos, "basico"), [9, 9]);
  t(`${sistema}: as três fontes ficam identificadas`, linha(juntos, "basico").alcance.partes.filter((p) => p.valor > 0).map((p) => p.label).sort(), [corpo.nome, "Manobras Finalizadoras", "Articulações Extensas"].sort());
  const corpoMaior = auxiliar("Corpo Maior", "alcanceCaC", { nivel: 3 });
  const pool = d({ feiticos: [corpo, corpoMaior], combate: { ...lig(corpo), ...lig(corpoMaior) } });
  t(`${sistema}: Auxiliares de alcance usam o maior bônus do pool`, delta(pool, "basico"), [6, 6]);
  t(`${sistema}: o perdedor do pool fica no hover, riscado`, fonte(pool, "basico", corpo.nome), [{ label: corpo.nome, valor: 4.5, suplantado: true, texto: "+4,5m" }]);
  const ceu = d({ especializacoes: [{ id: "combatente", nivel: 20 }], habs: ["cmb_postura_do_ceu"], extensas: true, feiticos: [corpo, distancia], combate: { postura: "ceu", ...lig(corpo), ...lig(distancia) } });
  t(`${sistema}: bônus corpo a corpo entra antes do dobro do Céu`, alcance(ceu, "basico"), [15, 15]);
  t(`${sistema}: bônus à distância entra antes do dobro do Céu`, alcance(ceu, ARMAS[1]), [78, 138]);
  t(`${sistema}: o dobro tem o nome da Postura no hover`, fonte(ceu, "basico", "Postura do Céu"), [{ label: "Postura do Céu", texto: "×2" }]);
  const apice = ficha(sistema, { extensas: true, combate: { invencivelSobOSol: true } });
  apice.core.nd = 30;
  apice.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
  apice.habilidadesLendarias = ["len_atingir_apice"];
  apice.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
  const sol = deriveAfty(apice);
  t(`${sistema}: o Ápice dobra o alcance com Articulações`, alcance(sol, "basico"), [6, 6]);
  t(`${sistema}: o dobro do Ápice tem o nome da fonte no hover`, fonte(sol, "basico", "Invencível sob o Sol"), [{ label: "Invencível sob o Sol", texto: "×2" }]);
}
limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
