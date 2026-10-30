/**
 * ============================================================
 * ADDONS COMPOSTOS E EMBUTIDOS
 * ============================================================
 * Um pacote EMBUTIDO viaja dentro do app (addons/guerra-de-feiticeiros.json) e,
 * ao contrário de um pacote da biblioteca, se atualiza sozinho: a cópia que a
 * ficha carrega é REFEITA a partir da fonte embutida toda vez que a ficha entra
 * no app, então publicar uma versão nova atualiza todas as fichas sem abrir
 * nenhuma. É a exceção declarada à regra "atualizar é um botão", e vale só para
 * os pacotes que moram aqui.
 *
 * Um pacote COMPOSTO tem três campos que o pacote comum não tem:
 *
 *   • `ajustes`     o que cada ficha escolhe (interruptor ou inteiro). Mora em
 *                   `ficha.addonAjustes[id]`, FORA da cópia, para a atualização
 *                   nunca apagar a escolha.
 *   • `porSistema`  blocos que valem só para `player` ou só para `afty`
 *                   (criatura). O mesmo pacote serve aos dois lados e o app liga
 *                   em cada ficha só o que é do sistema dela.
 *   • `porAjuste`   blocos que valem só com um ajuste ligado, por sistema.
 *
 * A composição acontece ao COPIAR para a ficha, e a cópia resultante é um pacote
 * comum. Por isso o motor, as famílias e os trinta leitores de `creature.addons`
 * não mudam: nenhum deles sabe que o pacote é composto.
 *
 * ⚠ SÓ BLOCOS POR FICHA ENTRAM EM `porSistema` E `porAjuste`: `regrasAfty`,
 * `libera`, `permite`, `incompativeis`, `substitui` e `funcionamentos`. O
 * `acrescenta` é catálogo GLOBAL (o Encontro mistura Player e criatura no mesmo
 * mundo), então fica na raiz e é igual nas duas visões.
 *
 * QUEM ATIVA O EMBUTIDO DESATIVA O QUE CONFLITA (autor, 2026-10-29). Os pacotes
 * antigos que ele cobre por inteiro (`absorve`) saem da ficha ao ligar, e as
 * escolhas que a ficha tinha feito com eles ganham o prefixo novo. Os que ele cobre
 * só em parte (`parciais`) ficam ligados, com aviso. Ficha que só tem pacotes
 * antigos espera alguém ligar o embutido, e nada muda nela.
 *
 * ⚠ FOLHA DE IMPORTS: só `afty-sistema` (também folha) e o JSON. Não importe
 * `afty-addons.js` aqui: ele importa este módulo.
 */
import { sistemaDaFicha } from "./afty-sistema";
import guerraDeFeiticeiros from "../../../addons/guerra-de-feiticeiros.json" with { type: "json" };

/** Os pacotes que viajam dentro do app. */
export const EMBUTIDOS = Object.freeze([guerraDeFeiticeiros]);

const POR_ID = new Map(EMBUTIDOS.map((p) => [p.id, p]));

export const ehEmbutido = (id) => POR_ID.has(id);
export const fonteEmbutida = (id) => POR_ID.get(id) ?? null;

const SISTEMAS = ["player", "afty"];
const BLOCOS_POR_FICHA = ["regrasAfty", "libera", "permite", "incompativeis", "substitui", "funcionamentos"];
const TIPOS_DE_AJUSTE = ["interruptor", "inteiro"];

const clonar = (x) => JSON.parse(JSON.stringify(x));
const unicos = (a, b) => [...new Set([...(a ?? []), ...(b ?? [])])];

/* ============================================================ */
/* VALIDAÇÃO DA FONTE                                            */
/* ============================================================ */
/**
 * Problemas de uma fonte composta. Devolve lista de textos, vazia se estiver
 * tudo certo. É o portão do assert e de quem edita o JSON.
 */
export function validarFonteComposta(fonte) {
  const out = [];
  if (!fonte || typeof fonte !== "object") return ["A fonte não é um objeto."];
  if (!String(fonte.id ?? "").trim()) out.push("A fonte não tem id.");
  const ids = new Set();
  for (const a of Array.isArray(fonte.ajustes) ? fonte.ajustes : []) {
    if (!a?.id || typeof a.id !== "string") { out.push("Ajuste sem id."); continue; }
    if (ids.has(a.id)) out.push(`Ajuste "${a.id}" repetido.`);
    ids.add(a.id);
    if (!TIPOS_DE_AJUSTE.includes(a.tipo)) out.push(`Ajuste "${a.id}": tipo "${a.tipo}" desconhecido.`);
    if (!String(a.rotulo ?? "").trim()) out.push(`Ajuste "${a.id}" sem rótulo.`);
    for (const s of a.sistemas ?? []) if (!SISTEMAS.includes(s)) out.push(`Ajuste "${a.id}": sistema "${s}" desconhecido.`);
    if (a.tipo === "interruptor" && typeof a.padrao !== "boolean") out.push(`Ajuste "${a.id}": o padrão precisa ser verdadeiro ou falso.`);
    if (a.tipo === "inteiro") {
      const ok = [a.min, a.max, a.padrao].every(Number.isInteger) && a.min <= a.padrao && a.padrao <= a.max;
      if (!ok) out.push(`Ajuste "${a.id}": min, max e padrão precisam ser inteiros e o padrão tem de caber.`);
      if (!a.regrasAfty || typeof a.regrasAfty !== "string") out.push(`Ajuste "${a.id}": falta a chave de regrasAfty que o número alimenta.`);
    }
  }
  const verBloco = (rotulo, bloco) => {
    for (const k of Object.keys(bloco ?? {})) {
      if (k === "acrescenta") out.push(`${rotulo}: "acrescenta" é catálogo global e fica na raiz do pacote.`);
      else if (!BLOCOS_POR_FICHA.includes(k)) out.push(`${rotulo}: bloco "${k}" não é por ficha.`);
    }
  };
  for (const [s, bloco] of Object.entries(fonte.porSistema ?? {})) {
    if (!SISTEMAS.includes(s)) out.push(`porSistema: sistema "${s}" desconhecido.`);
    verBloco(`porSistema.${s}`, bloco);
  }
  for (const [id, porSis] of Object.entries(fonte.porAjuste ?? {})) {
    if (!ids.has(id)) out.push(`porAjuste: o ajuste "${id}" não existe.`);
    for (const [s, bloco] of Object.entries(porSis ?? {})) {
      if (!SISTEMAS.includes(s)) out.push(`porAjuste.${id}: sistema "${s}" desconhecido.`);
      verBloco(`porAjuste.${id}.${s}`, bloco);
    }
  }
  for (const k of Object.keys(fonte.migra ?? {})) if (!ids.has(k)) out.push(`migra: o ajuste "${k}" não existe.`);
  const absorvidos = new Set(fonte.absorve ?? []);
  for (const parcial of fonte.parciais ?? []) {
    if (!parcial?.id || !String(parcial.aviso ?? "").trim()) out.push("parciais: cada item precisa de id e de aviso.");
    else if (absorvidos.has(parcial.id)) out.push(`parciais: "${parcial.id}" não pode estar também em absorve.`);
  }
  return out;
}

/* ============================================================ */
/* AJUSTES                                                       */
/* ============================================================ */
const aplicaAoSistema = (ajuste, sistema) => !Array.isArray(ajuste.sistemas) || ajuste.sistemas.includes(sistema);

function valorValido(ajuste, v) {
  if (ajuste.tipo === "interruptor") return typeof v === "boolean";
  return Number.isInteger(v) && v >= ajuste.min && v <= ajuste.max;
}

/** Os ajustes que valem neste sistema, com o valor salvo (ou o padrão). */
export function ajustesEfetivos(fonte, sistema, salvos = {}) {
  const out = {};
  for (const a of fonte?.ajustes ?? []) {
    if (!aplicaAoSistema(a, sistema)) continue;
    out[a.id] = valorValido(a, salvos?.[a.id]) ? salvos[a.id] : a.padrao;
  }
  return out;
}

/** Os ajustes que esta ficha DEVE mostrar. */
export const ajustesDoSistema = (fonte, sistema) => (fonte?.ajustes ?? []).filter((a) => aplicaAoSistema(a, sistema));

/* ⚠ A CHAVE LEVA UM HASH DO CONTEÚDO DA FONTE, e não só a versão. Quem edita o
   JSON e esquece de subir a `versao` ainda atualiza as fichas: sem o hash, a
   chave "1.0.0|player|..." seguiria igual e a cópia velha ficaria. FNV-1a de 32
   bits, calculado uma vez por fonte. */
function hashDeTexto(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
const hashes = new WeakMap();
export function hashDaFonte(fonte) {
  let h = hashes.get(fonte);
  if (!h) { h = hashDeTexto(JSON.stringify(fonte)); hashes.set(fonte, h); }
  return h;
}

export function chaveDaComposicao(fonte, sistema, ajustes) {
  const partes = Object.keys(ajustes).sort().map((k) => `${k}=${ajustes[k]}`);
  return `${fonte.versao}.${hashDaFonte(fonte)}|${sistema}|${partes.join(",")}`;
}

/* ============================================================ */
/* COMPOSIÇÃO                                                    */
/* ============================================================ */
function unirBloco(copia, bloco) {
  for (const [k, v] of Object.entries(bloco ?? {})) {
    if (k === "regrasAfty") copia.regrasAfty = { ...(copia.regrasAfty ?? {}), ...v };
    else if (k === "libera" || k === "permite" || k === "incompativeis") copia[k] = unicos(copia[k], v);
    else if (k === "funcionamentos") copia.funcionamentos = [...(copia.funcionamentos ?? []), ...clonar(v)];
    else if (k === "substitui") {
      const alvo = { ...(copia.substitui ?? {}) };
      for (const [familia, lista] of Object.entries(v)) {
        alvo[familia] = Array.isArray(lista) ? [...(alvo[familia] ?? []), ...clonar(lista)] : clonar(lista);
      }
      copia.substitui = alvo;
    }
  }
}

const memoria = new Map();

/**
 * A cópia que a ficha carrega: a fonte menos os campos de composição, mais os
 * blocos do sistema e dos ajustes ligados, e a marca `composicao` que diz de
 * que versão e de que escolhas ela saiu. Devolve um objeto novo a cada chamada.
 */
export function compor(fonte, sistema, salvos = {}) {
  const ajustes = ajustesEfetivos(fonte, sistema, salvos);
  const chave = chaveDaComposicao(fonte, sistema, ajustes);
  let pronta = memoria.get(chave);
  if (!pronta || pronta.fonte !== fonte) {
    const copia = clonar(fonte);
    for (const k of ["ajustes", "porSistema", "porAjuste", "migra", "absorve", "parciais"]) delete copia[k];
    unirBloco(copia, fonte.porSistema?.[sistema]);
    for (const a of fonte.ajustes ?? []) {
      if (!aplicaAoSistema(a, sistema)) continue;
      const valor = ajustes[a.id];
      if (a.tipo === "interruptor" && valor) unirBloco(copia, fonte.porAjuste?.[a.id]?.[sistema]);
      if (a.tipo === "inteiro" && valor > 0) unirBloco(copia, { regrasAfty: { [a.regrasAfty]: valor } });
    }
    copia.composicao = { fonte: fonte.id, chave };
    pronta = { fonte, copia };
    memoria.set(chave, pronta);
  }
  return clonar(pronta.copia);
}

/* ============================================================ */
/* HIDRATAR A FICHA                                              */
/* ============================================================ */
function renomearPrefixos(valor, regex, para) {
  if (typeof valor === "string") return regex.test(valor) ? valor.replace(regex, para) : valor;
  if (Array.isArray(valor)) return valor.map((x) => renomearPrefixos(x, regex, para));
  if (valor && typeof valor === "object") {
    const out = {};
    for (const [k, v] of Object.entries(valor)) {
      out[regex.test(k) ? k.replace(regex, para) : k] = renomearPrefixos(v, regex, para);
    }
    return out;
  }
  return valor;
}

/** Ajustes que os pacotes antigos da ficha implicam, segundo `migra` da fonte. */
function ajustesDosLegados(fonte, legados) {
  const out = {};
  for (const [id, regra] of Object.entries(fonte.migra ?? {})) {
    if (Array.isArray(regra.ligaSeTem) && legados.some((p) => regra.ligaSeTem.includes(p.id))) out[id] = true;
    if (regra.copiaDe) {
      const antigo = legados.find((p) => p.id === regra.copiaDe);
      out[id] = antigo ? (antigo.regrasAfty?.[regra.regrasAfty] ?? regra.senao ?? 0) : (regra.senao ?? 0);
    }
  }
  return out;
}

/**
 * Tira da ficha os pacotes antigos que o embutido cobre POR INTEIRO (`absorve`)
 * e renomeia os ids que a ficha guardou com o prefixo deles para o do embutido.
 * Quem ativa o embutido desativa o que conflita (autor, 2026-10-29). Os pacotes
 * que o embutido cobre só em parte (`parciais`) NÃO saem: ficam ligados, com
 * aviso, porque tirá-los perderia a parte que o embutido não tem.
 */
function absorverAntigos(ficha, fonte) {
  const absorvidos = new Set(fonte.absorve ?? []);
  const legados = (ficha.addons ?? []).filter((p) => p && absorvidos.has(p.id));
  if (legados.length === 0) return { ficha, doLegado: {} };
  const regex = new RegExp("^(?:" + [...absorvidos].map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + "):");
  const { addons, addonAjustes, ...resto } = ficha;
  const limpa = {
    ...renomearPrefixos(resto, regex, fonte.id + ":"),
    addons: addons.filter((p) => !(p && absorvidos.has(p.id))),
    addonAjustes,
  };
  return { ficha: limpa, doLegado: ajustesDosLegados(fonte, legados) };
}

/** As escolhas da ficha vencem, menos um interruptor que o pacote antigo ligava. */
function escolhasComLegado(doLegado, salvos) {
  const out = { ...doLegado, ...salvos };
  for (const [k, v] of Object.entries(doLegado)) if (v === true) out[k] = true;
  return out;
}

/**
 * Põe a cópia nova no lugar da velha, ou no fim da lista. Guarda as escolhas
 * efetivas em `addonAjustes`, que é onde elas moram.
 */
function comCopia(ficha, fonte, salvos) {
  const sistema = sistemaDaFicha(ficha);
  const efetivos = ajustesEfetivos(fonte, sistema, salvos);
  const copia = compor(fonte, sistema, efetivos);
  const lista = ficha.addons ?? [];
  const indice = lista.findIndex((p) => p && p.id === fonte.id);
  if (indice >= 0 && lista[indice].ativo === false) copia.ativo = false;
  const addons = indice >= 0 ? lista.map((p, i) => (i === indice ? copia : p)) : [...lista, copia];
  return { ...ficha, addons, addonAjustes: { ...(ficha.addonAjustes ?? {}), [fonte.id]: { ...salvos, ...efetivos } } };
}

function hidratarUm(ficha, fonte, sistema) {
  // Ficha que só tem pacotes antigos espera alguém ligar o embutido (autor, 2026-10-29).
  if (!ficha.addons.some((p) => p && p.id === fonte.id)) return ficha;
  const { ficha: base, doLegado } = absorverAntigos(ficha, fonte);
  const atual = base.addons.find((p) => p && p.id === fonte.id);
  const salvos = base.addonAjustes?.[fonte.id] ?? {};
  const escolhidos = escolhasComLegado(doLegado, salvos);
  const chave = chaveDaComposicao(fonte, sistema, ajustesEfetivos(fonte, sistema, escolhidos));
  if (base === ficha && atual.composicao?.chave === chave) return ficha;
  return comCopia(base, fonte, escolhidos);
}

const cache = new WeakMap();

/**
 * A ficha com os pacotes embutidos em dia: refaz a cópia quando a versão, o
 * conteúdo, o sistema ou os ajustes não batem com a marca, e tira os pacotes
 * antigos que o embutido cobre por inteiro. Só mexe em ficha que JÁ TEM o
 * embutido. Devolve a MESMA ficha quando não há nada a fazer, que é o caso comum.
 */
export function hidratarFicha(ficha) {
  if (!ficha || typeof ficha !== "object") return ficha;
  const lista = ficha.addons;
  if (!Array.isArray(lista) || lista.length === 0) return ficha;
  if (!EMBUTIDOS.some((f) => lista.some((p) => p && p.id === f.id))) return ficha;

  const visto = cache.get(ficha);
  if (visto && visto.addons === ficha.addons && visto.ajustes === ficha.addonAjustes && visto.tamanho === lista.length) {
    return visto.saida;
  }
  const sistema = sistemaDaFicha(ficha);
  let saida = ficha;
  for (const fonte of EMBUTIDOS) saida = hidratarUm(saida, fonte, sistema);
  if (saida !== ficha) cache.set(ficha, { addons: ficha.addons, ajustes: ficha.addonAjustes, tamanho: lista.length, saida });
  return saida;
}

/** Atalho para quem só quer a lista de pacotes em dia (os `aplicarAddons`). */
export const addonsDaFicha = (ficha) => hidratarFicha(ficha)?.addons ?? [];

/**
 * Os avisos de um pacote antigo que o embutido só cobre em parte e que a ficha
 * ainda carrega ligado. Cada item é `{ id, texto }`, para a tela mostrar em âmbar.
 */
export function avisosDosEmbutidos(ficha) {
  const out = [];
  const lista = ficha?.addons ?? [];
  for (const fonte of EMBUTIDOS) {
    if (!lista.some((p) => p && p.id === fonte.id)) continue;
    for (const parcial of fonte.parciais ?? []) {
      const antigo = lista.find((p) => p && p.id === parcial.id);
      if (antigo) out.push({ id: parcial.id, texto: `${antigo.nome || antigo.id} continua ligado e soma por cima de ${fonte.nome}. ${parcial.aviso}` });
    }
  }
  return out;
}

/* ============================================================ */
/* OPERAÇÕES DA TELA (puras: devolvem a ficha nova)               */
/* ============================================================ */

/**
 * Liga o pacote embutido na ficha, com as escolhas que ela já tinha ou os
 * padrões. Desliga sozinho os pacotes antigos que ele cobre por inteiro e
 * aproveita o que eles tinham escolhido.
 */
export function ligarEmbutido(ficha, id) {
  const fonte = fonteEmbutida(id);
  if (!fonte) return ficha;
  const { ficha: base, doLegado } = absorverAntigos(ficha, fonte);
  return comCopia(base, fonte, escolhasComLegado(doLegado, base?.addonAjustes?.[id] ?? {}));
}

/** Tira a cópia da ficha. As escolhas ficam guardadas para o caso de ligar de novo. */
export function desligarEmbutido(ficha, id) {
  return { ...ficha, addons: (ficha.addons ?? []).filter((p) => !(p && p.id === id)) };
}

/** Muda UM ajuste e refaz a cópia. Valor inválido para o ajuste é ignorado. */
export function definirAjuste(ficha, id, ajusteId, valor) {
  const fonte = fonteEmbutida(id);
  const ajuste = (fonte?.ajustes ?? []).find((a) => a.id === ajusteId);
  if (!fonte || !ajuste || !valorValido(ajuste, valor)) return ficha;
  return comCopia(ficha, fonte, { ...(ficha.addonAjustes?.[id] ?? {}), [ajusteId]: valor });
}
