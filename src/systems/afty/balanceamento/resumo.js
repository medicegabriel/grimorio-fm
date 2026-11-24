// O ponto de entrada do motor carrega as famílias na ordem usada pelo criador.
import "../afty-derive.js";
import { catalogoBasicoDaFamilia, comEscopoDaFicha, pacotesDaFicha } from "../afty-addons.js";
import { AFTY_ATTRS } from "../afty-schema.js";
import { AFTY_PERICIAS } from "../afty-pericias-catalogo.js";
import { ATTR_METODOS } from "../afty-atributos.js";
import { APTIDAO_TRILHAS } from "../afty-aptidoes.js";
import { FEITICO_NIVEIS, NIVEL_LABEL, TIPOS_FEITICO } from "../afty-feiticos.js";
import { HABILIDADES_GERAIS } from "../afty-gerais.js";
import { resolveEspecializacoes } from "../afty-especializacoes.js";

export const VERSAO_RESUMO = 1;
export const PERIODOS = [7, 30, 90];
export const MAX_NIVEL = 10000;

const opcoes = (lista) => Object.fromEntries(lista.map((o) => [o.id ?? o.key ?? o.value, o.nome ?? o.label]));
const livro = (familia) => catalogoBasicoDaFamilia(familia);
const feiticos = Object.fromEntries(TIPOS_FEITICO.flatMap(({ value, label }) =>
  [...FEITICO_NIVEIS, "max"].map((nivel) => [`${value}/${nivel}`, `${label} · ${NIVEL_LABEL[nivel] ?? "Técnica Máxima"}`])));

export const CATEGORIAS = {
  origens: opcoes(livro("origens")),
  clas: opcoes(livro("clas")),
  especializacoes: opcoes(livro("especializacoes")),
  metodos: opcoes(ATTR_METODOS),
  pericias: opcoes(AFTY_PERICIAS),
  talentos: opcoes(livro("talentos")),
  habilidades: opcoes([...livro("habilidades").filter((h) => h.tipo !== "base"), ...HABILIDADES_GERAIS]),
  aptidoes: opcoes(livro("aptidoes")),
  trilhas: opcoes(APTIDAO_TRILHAS),
  treinamentos: opcoes(livro("treinamentos")),
  treinosEspeciais: opcoes(livro("treinosEspeciais")),
  feiticos,
};
export const ATRIBUTOS = opcoes(AFTY_ATTRS);
export const CAMPOS_ATRIBUTOS = ["base", "nivel", "origem"];

const objeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const inteiro = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const mapa = (v) => objeto(v) ? v : {};
const lista = (v) => Array.isArray(v) ? v : [];
const catalogado = (catalogo, id) => typeof id === "string" && Object.hasOwn(catalogo, id);
const limites = {
  origens: 1, clas: 1, especializacoes: MAX_NIVEL, metodos: 1, pericias: 2,
  talentos: 1, habilidades: 1, aptidoes: 1, trilhas: 32, treinamentos: 4,
  treinosEspeciais: 1, feiticos: MAX_NIVEL,
};

function escolhas(categoria, entradas) {
  return Object.fromEntries(entradas.filter(([id, valor]) =>
    catalogado(CATEGORIAS[categoria], id) && inteiro(valor, 1, limites[categoria])));
}

const marcadas = (ids) => lista(ids).map((id) => [id, 1]);

function contarFeiticos(criados) {
  const totais = {};
  for (const f of lista(criados)) {
    if (!f || !catalogado(feiticos, `${f.tipo}/${f.nivel}`)) continue;
    const chave = `${f.tipo}/${f.nivel}`;
    totais[chave] = Math.min(MAX_NIVEL, (totais[chave] ?? 0) + 1);
  }
  return Object.entries(totais);
}

function valoresAtributos(valores, preencher) {
  return Object.fromEntries(Object.keys(ATRIBUTOS).flatMap((key) => {
    const valor = valores?.[key];
    if (inteiro(valor, 0, MAX_NIVEL)) return [[key, valor]];
    return preencher ? [[key, 0]] : [];
  }));
}

export function ehJogadorDoBalanceamento(ficha) {
  return ficha?.rulesVersion === "player" && ficha.edicaoDeRegras == null && ficha.mesa == null && !ficha.isBuiltIn;
}

/** Fronteira de dados. Somente as chaves e os valores construídos aqui viajam. */
export function resumirFicha(ficha) {
  if (!ehJogadorDoBalanceamento(ficha) || !inteiro(ficha.core?.nd, 1, MAX_NIVEL)) return null;
  const origem = ficha.core.origem;
  const classes = comEscopoDaFicha(ficha, () => resolveEspecializacoes(ficha).escolhidas);
  const especializacoes = escolhas("especializacoes",
    classes.map(({ id, nivel }) => [id, nivel]));
  if (!Object.keys(especializacoes).length) return null;

  return {
    nivel: ficha.core.nd,
    addons: pacotesDaFicha(ficha).size > 0,
    escolhas: {
      origens: escolhas("origens", [[origem?.id, 1]]),
      clas: escolhas("clas", [[origem?.cla, 1]]),
      especializacoes,
      metodos: escolhas("metodos", [[ficha.attrMethod, 1]]),
      pericias: escolhas("pericias", Object.entries(mapa(ficha.pericias))
        .map(([id, grau]) => [id, grau === "mestre" ? 2 : grau === "treinado" ? 1 : 0])),
      talentos: escolhas("talentos", marcadas(ficha.talentos)),
      habilidades: escolhas("habilidades", [...marcadas(ficha.habilidades), ...marcadas(ficha.habilidadesGerais)]),
      aptidoes: escolhas("aptidoes", marcadas(ficha.aptidoesAmaldicoadas)),
      trilhas: escolhas("trilhas", Object.entries(mapa(ficha.aptidoes))),
      treinamentos: escolhas("treinamentos", Object.entries(mapa(ficha.treinamentos))),
      treinosEspeciais: escolhas("treinosEspeciais", lista(ficha.treinosEspeciais)
        .map((item) => [typeof item === "string" ? item : item?.id, 1])),
      feiticos: escolhas("feiticos", contarFeiticos(ficha.feiticos)),
    },
    atributos: {
      base: valoresAtributos(ficha.attributes, false),
      nivel: valoresAtributos(ficha.attrNivel, true),
      origem: valoresAtributos(origem?.bonusAtributos, true),
    },
  };
}

const chavesExatas = (v, chaves) =>
  objeto(v) && Object.keys(v).length === chaves.length && chaves.every((k) => Object.hasOwn(v, k));

export function resumoValido(resumo) {
  if (!chavesExatas(resumo, ["nivel", "addons", "escolhas", "atributos"])
      || !inteiro(resumo.nivel, 1, MAX_NIVEL) || typeof resumo.addons !== "boolean"
      || !chavesExatas(resumo.escolhas, Object.keys(CATEGORIAS))
      || !chavesExatas(resumo.atributos, CAMPOS_ATRIBUTOS)) return false;

  for (const [grupo, valores] of Object.entries(resumo.escolhas)) {
    if (!objeto(valores) || Object.entries(valores).some(([id, valor]) =>
      !catalogado(CATEGORIAS[grupo], id) || !inteiro(valor, 1, limites[grupo]))) return false;
  }
  for (const grupo of ["origens", "clas", "metodos"]) {
    if (Object.keys(resumo.escolhas[grupo]).length > 1) return false;
  }
  if (Object.keys(resumo.escolhas.especializacoes).length === 0) return false;

  return Object.values(resumo.atributos).every((valores) => objeto(valores)
    && Object.entries(valores).every(([id, valor]) => catalogado(ATRIBUTOS, id) && inteiro(valor, 0, MAX_NIVEL)));
}
