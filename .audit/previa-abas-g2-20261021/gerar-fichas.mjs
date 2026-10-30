/* PRÉVIA DAS TRÊS ABAS DO G2 (2026-10-21): as fichas SINTÉTICAS dos cenários.
   Todas nascem de `createBlankAfty()` aqui mesmo, com "(Teste Abas)" no nome e ids `teste-abas-*`. Nenhuma é cópia de ficha do autor.
   Os Addons são os pacotes públicos de `addons/` (catálogos, não personagens). Das amostras antigas, entram só as criadas do zero
   (`.audit/fechamento-funcional-g2-20261020/gerar-fichas.mjs`: Mestre e Cria). A "Minamoto no Flugel (Teste G2)" é cópia sem alteração de
   uma ficha real e a "Player 30" é derivada de outra: as duas ficam de fora.
   Uso (na raiz do grimorio-tracker): node .audit/previa-abas-g2-20261021/gerar-fichas.mjs */
import fs from "node:fs";
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const F = await import(R + "afty-feiticos.js");
const H = await import(R + "afty-habilidades.js");
const A = await import(R + "afty-olhos-agulha.js");
const CEU = await import(R + "afty-manipulacao-ceu.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { getEquipamento, novaEntradaEquip } = await import(R + "afty-equipamentos.js");

const ADDON = (nome) => JSON.parse(fs.readFileSync(new URL(`../../addons/${nome}.json`, import.meta.url), "utf8"));
const ATTR = (o) => ({ forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10, ...o });
const nova = (id, nome, extra = {}) => {
  const f = createBlankAfty();
  f.id = `teste-abas-${id}`; f.name = `${nome} (Teste Abas)`; f.rulesVersion = "player"; f.system = "afty";
  return { ...f, ...extra, core: { ...f.core, ...(extra.core ?? {}) } };
};
const habsDe = (esp, nivelMax) => H.AFTY_HABILIDADES.filter((h) => h.especializacaoId === esp && (h.nivel ?? 1) <= nivelMax).map((h) => h.id);
let seq = 0;
const feitico = (extra) => ({ ...F.createBlankFeitico(), id: `tf${(seq += 1)}`, descricao: `Texto de teste da prévia (${extra.nome}). **Negrito** de marcação rica, e uma segunda frase para medir a leitura.`, ...extra });
const item = (tipo, refId, extra = {}) => ({ ...novaEntradaEquip(tipo, refId, getEquipamento(tipo, refId)), ...extra });

const fichas = {};

/* 1. ARSENAL: armas com as propriedades de combate, Golpe Especial, inventário denso, perícias personalizadas e Ofícios. */
fichas.arsenal = nova("arsenal", "Arsenal", {
  core: { nd: 20, patamar: "comum", origem: { id: "inato" } },
  attrMethod: "fixos",
  attributes: ATTR({ forca: 16, destreza: 16, constituicao: 14, sabedoria: 12 }),
  especializacoes: [{ id: "combatente", nivel: 20 }],
  habilidades: ["cmb_golpe_especial", "cmb_assumir_postura", "cmb_ataque_concentrado"],
  ataquesProf: { corpo: true, distancia: true },
  pericias: { atletismo: "treinado", percepcao: "mestre", furtividade: "treinado", intuicao: "treinado" },
  periciasPersonalizadas: [{ id: "custom_navegacao", nome: "Navegação Astral por Constelações Esquecidas", atributo: "sabedoria" }],
  periciaOficios: { oficio: ["Ferreiro", "Alquimista"], oficio__2: ["Canalizador"] },
  periciasOficiosExtras: ["oficio__2"],
  armasCustom: [
    { id: "armc_besta", nome: "Besta de Repetição de Teste", classe: "simples", categoria: "distancia", dano: { dado: "1d10", tipo: "pf" }, critico: 19, custo: 1, grupo: "besta", props: { recarga: 1, emperrar: true } },
    { id: "armc_oscilante", nome: "Lâmina Oscilante de Teste", classe: "simples", categoria: "corpo", dano: { dado: "1d8", tipo: "ct" }, critico: 20, custo: 1, grupo: "espada", props: { oscilante: true, energica: true } },
    { id: "armc_ampla", nome: "Machado de Guerra Amplo de Teste com um Nome Bem Comprido para Quebrar a Linha", classe: "simples", categoria: "corpo", dano: { dado: "1d12", tipo: "ct" }, critico: 20, custo: 1, grupo: "machado", props: { ampla: true, pesada: 18 } },
    { id: "armc_modular", nome: "Rapieira Modular de Teste", classe: "simples", categoria: "corpo", dano: { dado: "1d8", tipo: "pf" }, critico: 19, custo: 1, grupo: "espada", props: { modular: "ct", aparar: true, apunhaladora: true } },
  ],
  equipamentos: { itens: [
    { uid: "abas-besta", tipo: "arma", refId: "armc_besta", qtd: 1, equipado: true },
    { uid: "abas-oscilante", tipo: "arma", refId: "armc_oscilante", qtd: 1, equipado: true },
    { uid: "abas-ampla", tipo: "arma", refId: "armc_ampla", qtd: 1, equipado: true },
    { uid: "abas-modular", tipo: "arma", refId: "armc_modular", qtd: 1, equipado: true },
    item("arma", "arm_katana", { uid: "abas-katana-afiada", equipado: false, fa: { grau: "terceiro", encantamentos: ["enc_arma_afiada"], habilidadeUnica: "" } }),
    item("arma", "arm_katana", { uid: "abas-katana-defensora", equipado: false, fa: { grau: "terceiro", encantamentos: ["enc_arma_defensora"], habilidadeUnica: "" } }),
    item("uniforme", "unif_revestimento_robusto", { uid: "abas-robusto", equipado: true }),
    item("uniforme", "unif_revestimento_medio", { uid: "abas-medio", equipado: true }),
    item("escudo", "esc_medio", { uid: "abas-escudo", equipado: false }),
    item("item", "it_antidoto_simples", { uid: "abas-antidoto", qtd: 6 }),
    item("item", "it_oleo_flamejante", { uid: "abas-oleo", qtd: 4 }),
    item("item", "it_injecao_estimulante", { uid: "abas-injecao", qtd: 5 }),
    item("item", "it_mix_energetico_pequeno", { uid: "abas-mix", qtd: 8 }),
    item("item", "it_brinco_da_comunicacao", { uid: "abas-brinco" }),
  ] },
});

/* 2. CONJURADOR: Feitiços de todos os casos da linha fechada (3B), Técnica Máxima com Custo de Vida, Ritual, Liberação, Expansões,
   Parede, Cortina e Conflito, curas. */
fichas.conjurador = nova("conjurador", "Conjurador", {
  core: { nd: 20, patamar: "comum", tipo: "conjurador", origem: { id: "herdado" } },
  attrMethod: "fixos",
  attributes: ATTR({ inteligencia: 18, sabedoria: 16, constituicao: 14, presenca: 12 }),
  especializacoes: [{ id: "conjurador", nivel: 10 }, { id: "suporte", nivel: 10 }],
  habilidades: [...habsDe("conjurador", 10), ...habsDe("suporte", 10)],
  pericias: { feiticaria: "mestre", historia: "treinado", prestidigitacao: "treinado", medicina: "treinado" },
  aptidoes: { au: 2, cl: 3, bar: 4, dom: 4, er: 3 },
  aptidoesAmaldicoadas: ["tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa", "tecnica_maxima", "energia_reversa", "cortina"],
  feiticos: [
    feitico({ nome: "Lança de Gelo de Teste", tipo: "dano", nivel: 3, resolucao: "ataque" }),
    feitico({ nome: "Tempestade Contínua de Teste", tipo: "dano", nivel: 4, subtipo: "continuo" }),
    feitico({ nome: "Disparos Múltiplos de Teste", tipo: "dano", nivel: 2, subtipo: "multiplos", disparos: 3, resolucao: "ataque" }),
    feitico({ nome: "Muralha Sagrada de Teste", tipo: "auxiliar", nivel: 2 }),
    feitico({ nome: "Bênção Restauradora de Teste", tipo: "curativo", nivel: 3 }),
    feitico({ nome: "Ruptura Vital de Teste", tipo: "dano", nivel: "max", regraTecnicaMaxima: "oficial", alvo: "area", formaArea: "cone", acao: "completa",
      custoVidaAtivacao: { modo: "percentualAtual", percentual: 50, minimo: 1, somaAoDano: true } }),
  ],
  dominios: [
    { id: "abas-d1", nome: "Jardim das Mil Lâminas de Teste", versao: "completa", regra: "oficial", efeitos: [] },
    { id: "abas-d2", nome: "Recinto Incompleto de Teste", versao: "incompleta", regra: "oficial", efeitos: [] },
  ],
});

/* Duas Habilidades a mais do Combatente, só para o Rápido de seis favoritos do caso S2. */
const EXTRAS_COMBATENTE = habsDe("combatente", 10).filter((id) => !["cmb_golpe_especial", "cmb_assumir_postura", "cmb_ataque_concentrado"].includes(id)).slice(0, 2);

/* 3. MESA CHEIA (S2): os nove condicionais juntos, para medir a faixa Agora na Mesa e o Dano abaixo da dobra. */
const ceu = ADDON("manipulacao-do-ceu");
const agulha = ADDON("olhos-de-agulha");
fichas.mesa = nova("mesa", "Mesa Cheia", {
  core: { nd: 20, patamar: "comum", tipo: "conjurador", origem: { id: "herdado" }, [A.AGULHA_OLHOS]: 2 },
  attrMethod: "fixos",
  attributes: ATTR({ forca: 14, destreza: 14, constituicao: 14, sabedoria: 14 }),
  especializacoes: [{ id: "conjurador", nivel: 10 }, { id: "combatente", nivel: 10 }],
  habilidades: ["cmb_golpe_especial", "cmb_assumir_postura", "cmb_ataque_concentrado", ...EXTRAS_COMBATENTE],
  aptidoes: { au: 2, cl: 4, bar: 0, dom: 3, er: 0 },
  aptidoesEscolhidas: ["dominio_simples"],
  aptidoesAmaldicoadas: ["aura_embacada"],
  treinamentos: { "sombras:treino_escudo_protetor": 1 },
  addons: [ADDON("the-crimsom-queen"), ADDON("ciclo-adaptacao-mahoraga"), ADDON("vislumbre-celeste"), ADDON("olhinhos-lu"), agulha, ceu, ADDON("azamaru"), ADDON("estilo-sombras-corporal")],
  feiticos: [
    { ...ceu.feiticos.find((f) => f.id === "refletir_imagem"), id: CEU.REFLETIR_IMAGEM_ID },
    A.modeloPassivaAgulha("olhos-de-agulha:olhar", 4),
    feitico({ nome: "Dardo Simples de Teste", tipo: "dano", nivel: 1, resolucao: "ataque" }),
  ],
  equipamentos: { itens: [item("arma", "azamaru:azamaru", { uid: "abas-azamaru", equipado: true })] },
});

/* 3b. MESA TÍPICA (S1): quatro condicionais (Vislumbre, Azamaru, Golpe, Treino) e três favoritos. */
fichas.tipica = nova("tipica", "Mesa Típica", {
  core: { nd: 20, patamar: "comum", tipo: "conjurador", origem: { id: "herdado" } },
  attrMethod: "fixos",
  attributes: ATTR({ forca: 14, destreza: 14, constituicao: 14, sabedoria: 14 }),
  especializacoes: [{ id: "conjurador", nivel: 10 }, { id: "combatente", nivel: 10 }],
  habilidades: ["cmb_golpe_especial", "cmb_assumir_postura", "cmb_ataque_concentrado"],
  aptidoes: { au: 2, cl: 4, bar: 0, dom: 3, er: 0 },
  aptidoesEscolhidas: ["dominio_simples"],
  treinamentos: { "sombras:treino_escudo_protetor": 1 },
  addons: [ADDON("vislumbre-celeste"), ADDON("azamaru"), ADDON("estilo-sombras-corporal")],
  feiticos: [feitico({ nome: "Dardo Simples de Teste", tipo: "dano", nivel: 1, resolucao: "ataque" })],
  equipamentos: { itens: [item("arma", "azamaru:azamaru", { uid: "abas-tip-azamaru", equipado: true })] },
});

/* 4. VAZIA: nível 1, só o Ataque Básico, inventário vazio. */
fichas.vazia = nova("vazia", "Vazia", { core: { nd: 1, patamar: "comum", origem: { id: "inato" } } });

/* 5. CRIATURA do Afty (rota /Afty), criada do zero. */
fichas.criatura = nova("criatura", "Criatura", {
  rulesVersion: "afty",
  core: { nd: 14, patamar: "desafio", tipo: "combatente" },
  attrMethod: "fixos",
  attributes: ATTR({ forca: 18, constituicao: 16, destreza: 12 }),
  especializacoes: [{ id: "combatente", nivel: 14 }],
  habilidades: ["cmb_golpe_especial"],
  equipamentos: { itens: [item("arma", "arm_katana", { uid: "abas-cria-katana", equipado: true })] },
});

/* As sessões de partida: em combate, Energia de sobra, e os favoritos do Rápido (habilidade, equipamento e uma chave sem destino). */
const sessoes = {};
for (const [k, f] of Object.entries(fichas)) {
  aplicarAddons(f.addons ?? []);
  const d = deriveAfty(f);
  let s = S.sessaoEmBranco(d);
  s = S.aplicaPatchCombate(s, { ativo: k !== "vazia" });
  s = { ...s, peAtual: Math.max(s.peAtual, 60) };
  if (k === "arsenal") s = { ...s, favoritos: ["especializacao:cmb_ataque_concentrado", "equipamento:abas-katana-afiada", "chave:que-nao-existe", "especializacao:cmb_assumir_postura"] };
  if (k === "mesa") s = { ...s, favoritos: ["especializacao:cmb_golpe_especial", "especializacao:cmb_assumir_postura", "especializacao:cmb_ataque_concentrado", ...EXTRAS_COMBATENTE.map((id) => `especializacao:${id}`), "equipamento:abas-azamaru", "chave:que-nao-existe"] };
  if (k === "tipica") s = { ...s, favoritos: ["especializacao:cmb_golpe_especial", "especializacao:cmb_ataque_concentrado", "equipamento:abas-tip-azamaru"] };
  if (k === "conjurador") s = { ...s, favoritos: ["feitico-passivo:inexistente"] };
  sessoes[f.id] = s;
}

const saida = new URL("./fichas/fichas.json", import.meta.url);
fs.mkdirSync(new URL("./fichas/", import.meta.url), { recursive: true });
fs.writeFileSync(saida, JSON.stringify({ geradoEm: new Date().toISOString(), origem: "sintéticas, criadas do zero por gerar-fichas.mjs", fichas, sessoes }, null, 1));
console.log(Object.values(fichas).map((f) => `${f.id}: ${f.name} (${f.rulesVersion})`).join("\n"));
