import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const { getHabilidade, avaliarAcessoHabilidade } = await import("../src/systems/afty/afty-habilidades.js");
let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else falhas.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const base = createBlankAfty();
base.rulesVersion = "player";
base.core.nd = 24;
base.especializacoes = [{ id: "conjurador", nivel: 20 }, { id: "combatente", nivel: 4 }];
base.attributes = { forca: 16, destreza: 16, constituicao: 16, inteligencia: 16, sabedoria: 16, presenca: 16 };
base.addons = [{ id: "loja-de-catarse", permite: ["catarse"], libera: ["soPorAddon:tal_alma_livre"] }];
const compra = { id: "estrangeiras", familia: "habilidadesOutraClasse", quantidade: 2, custo: 0,
  nome: "Especialização [Outra Classe]", escolhas: ["lut_corpo_calejado", "sup_taticas_defensivas"] };
const comCompra = (c = compra, extra = {}) => ({ ...structuredClone(base), ...extra,
  catarse: { saldo: 500, compras: [structuredClone(c)] } });
const sem = deriveAfty(base);
const f = comCompra();
const opcao = getHabilidade("sup_taticas_defensivas").escolha.opcoes[0];
f.escolhasHabilidade = { sup_taticas_defensivas: [opcao.id] };
const d = deriveAfty(f);
t("duas compras concedem duas habilidades escolhidas", d.habilidades.habilidadesOutraClasse, compra.escolhas);
t("não gastam vagas comuns", d.habilidades.gastosHabilidade, sem.habilidades.gastosHabilidade);
t("não concedem vagas genéricas", d.habilidades.comum, sem.habilidades.comum);
t("não acrescentam classes na ficha", f.especializacoes, base.especializacoes);
t("não acrescentam níveis reais de classe", d.habilidades.niveisPorEspec.lutador ?? 0, 0);
t("não concedem bases de Lutador", d.habilidades.efetivas.includes("lut_corpo_treinado") || d.habilidades.efetivas.includes("lut_empolgacao"), false);
t("o nível de personagem vale para a habilidade comprada", d.habilidades.nivelPorHabilidade.lut_corpo_calejado, 24);
t("a expressão da habilidade lê o nível de personagem", d.contextoDsl.esc_lutador, 24);
t("Corpo Calejado efetivamente concede os PV de Lutador", d.hp - sem.hp, 24);
t("Corpo Calejado efetivamente concede Defesa", d.defesa - sem.defesa, 1);
t("as escolhas aninhadas são resolvidas", d.habilidades.escolhas.mapa.sup_taticas_defensivas, [opcao.id]);
t("a escolha aninhada aplica sua resistência", Object.values(d.efeitos.porAlvo.resistenciaDano ?? {}).includes(1), true);
t("não acusa falta de classe nas compradas", d.habilidades.inacessiveis.filter(id => compra.escolhas.includes(id)), []);
const retirada = deriveAfty({ ...f, catarse: {saldo:500,compras:[]} });
t("remover a compra remove habilidades e efeitos", [retirada.habilidades.efetivas.includes("lut_corpo_calejado"), retirada.hp, retirada.defesa], [false, sem.hp, sem.defesa]);
const propia = deriveAfty(comCompra({ ...compra, escolhas:["cmb_preparo_imediato"] }));
t("classe própria não usa a compra de outra classe", propia.habilidades.habilidadesOutraClasse, []);
t("classe própria gera aviso", propia.catarse.avisos.length > 0, true);
const limite = deriveAfty(comCompra({ ...compra, quantidade:1 }));
t("cada unidade concede uma escolha", limite.habilidades.habilidadesOutraClasse, ["lut_corpo_calejado"]);
t("excedente é avisado sem reescrever escolhas", [limite.catarse.avisos.length > 0, limite.catarse.compras[0].escolhas.length], [true, 2]);
const baixo = deriveAfty(comCompra(compra,{ core:{...base.core,nd:5}, especializacoes:[{id:"conjurador",nivel:5}] }));
t("o nível mínimo continua sendo exigido", baixo.habilidades.habilidadesOutraClasse, []);
const repetida = deriveAfty(comCompra({ ...compra, escolhas:["lut_corpo_calejado","lut_corpo_calejado"] }));
t("seleção duplicada não concede duas vezes", repetida.habilidades.habilidadesOutraClasse, ["lut_corpo_calejado"]);
const h = getHabilidade("sup_olhar_agucado");
t("a dispensa de classe não dispensa perícia", avaliarAcessoHabilidade(h, {
  habilidadesOutraClasse:[h.id], nivelPorHabilidade:{[h.id]:24}, periciaProf:{},
}).ok, false);
t("requisito de perícia atendido libera a escolha", avaliarAcessoHabilidade(h, {
  habilidadesOutraClasse:[h.id], nivelPorHabilidade:{[h.id]:24}, periciaProf:{percepcao:"treinado"},
}).ok, true);
const alma = deriveAfty(comCompra({ ...compra, escolhas:["lut_corpo_calejado"] }, {
  talentos:["tal_alma_livre"], escolhasTalento:{tal_alma_livre:["tal_alma_livre_esp_lutador"]},
  habilidades:["lut_corpo_treinado"],
}));
t("Alma Livre mantém sua própria habilidade", alma.habilidades.almaLivre.habilidadeId, "lut_corpo_treinado");
t("Catarse não disputa a escolha única de Alma Livre", alma.habilidades.inacessiveis.includes("lut_corpo_calejado"), false);
const lendaria = deriveAfty(comCompra({id:"lendarias",familia:"lendarias",quantidade:3,custo:0}));
t("três unidades concedem três vagas lendárias", lendaria.altoNivel.lendarias.total - sem.altoNivel.lendarias.total, 3);
t("lendárias não acrescentam talentos ou habilidades comuns", [lendaria.habilidades.comum,lendaria.habilidades.exclusivasTalento], [sem.habilidades.comum,sem.habilidades.exclusivasTalento]);
t("ficha vazia continua derivável", [deriveAfty(null).catarse.compras.length, deriveAfty(undefined).catarse.compras.length], [0, 0]);
console.log(falhas.length ? falhas.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = falhas.length ? 1 : 0;
