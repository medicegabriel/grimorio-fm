/* Grande Roda do Dharma. Estado de cena exclusivo do addon do inimigo.
 * A fonte integral está em docs/grande-roda-dharma-regras.md.
 * O narrador registra eventos. Cada entrada tem seu próprio limite por rodada.
 */
import { TIPOS_DANO } from "./afty-equipamentos";

export const TIPOS_DHARMA = {
  geral: "Adaptação Geral", ataque: "Adaptar Ataque",
  defesa: "Adaptar Defesa", existencia: "Adaptar Existência",
};
const numero = (v) => Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0;
const chave = (v) => String(v ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const danoAdaptavel = (id) => !!TIPOS_DANO[id] && !["alma", "energia_reversa"].includes(id);
export const temDharma = (creature) => creature?.rulesVersion === "afty"
  && (creature.addons ?? []).some((p) => p?.permite?.includes("rodaDharma"));

export function normalizaDharma(bruta) {
  const ids = new Set();
  const entradas = (Array.isArray(bruta?.entradas) ? bruta.entradas : []).flatMap((e) => {
    if (!e || !TIPOS_DHARMA[e.tipo] || !String(e.nome ?? "").trim() || !e.id || ids.has(e.id)
      || (e.tipo === "defesa" && !danoAdaptavel(e.tipoDano))) return [];
    ids.add(e.id);
    return [{
      id: String(e.id), tipo: e.tipo, nome: String(e.nome).trim(), tipoDano: e.tipoDano ?? "",
      giros: Math.min(6, numero(e.giros)), rodada: numero(e.rodada), usados: Math.min(2, numero(e.usados)),
      dano: numero(e.dano), notas: String(e.notas ?? ""), curaPendente: !!e.curaPendente,
      curaGeral: numero(e.curaGeral), confronto: !!e.confronto, rodadasConfronto: numero(e.rodadasConfronto),
    }];
  });
  return {
    entradas,
    alvo: String(bruta?.alvo ?? ""),
    fenomeno: entradas.some((e) => e.id === bruta?.fenomeno && e.tipo === "geral") ? bruta.fenomeno : "",
    existencia: entradas.some((e) => e.id === bruta?.existencia && e.tipo === "existencia") ? bruta.existencia : "",
  };
}
const gravar = (s, d) => ({ ...s, dharma: normalizaDharma(d) });
const curar = (s, valor, d) => ({ ...s, hpAtual: Math.min(numero(d.hp), numero(s.hpAtual) + numero(valor)) });
export const limiteCuraDharma = (d) => numero(d?.nd * d?.mods?.constituicao);
export const girosNestaRodada = (e, rodada) => e.rodada === numero(rodada) ? e.usados : 0;

export function adicionarDharma(s, d, { tipo, nome, tipoDano }) {
  if (!d?.dharma?.ativo || !TIPOS_DHARMA[tipo] || !String(nome ?? "").trim()
    || (tipo === "defesa" && !danoAdaptavel(tipoDano))) return s;
  const estado = normalizaDharma(s.dharma);
  // Uma segunda linha do mesmo fenômeno não pode contornar o limite de giros.
  if (estado.entradas.some((e) => e.tipo === tipo && (tipo === "defesa"
    ? e.tipoDano === tipoDano : chave(e.nome) === chave(nome)))) return s;
  const id = `dharma-${globalThis.crypto.randomUUID()}`;
  const entrada = { id, tipo, nome, tipoDano, giros: 0 };
  return gravar(s, { ...estado, entradas: [...estado.entradas, entrada],
    existencia: tipo === "existencia" && !estado.existencia ? id : estado.existencia });
}

export function configurarDharma(s, d, patch) {
  if (!d?.dharma?.ativo) return s;
  const estado = normalizaDharma(s.dharma);
  const existencia = patch.existencia ?? estado.existencia;
  return gravar(s, { ...estado, ...patch, entradas: estado.entradas.map((e) => (
    e.tipo === "existencia" && e.id !== existencia ? { ...e, confronto: false, rodadasConfronto: 0 } : e
  )) });
}

export function anotarDharma(s, d, id, patch) {
  if (!d?.dharma?.ativo) return s;
  const estado = normalizaDharma(s.dharma);
  return gravar(s, { ...estado, entradas: estado.entradas.map((e) => e.id !== id ? e : {
    ...e, notas: patch.notas ?? e.notas,
    dano: e.giros < 6 ? numero(patch.dano ?? e.dano) : e.dano,
    confronto: e.id === estado.existencia && (patch.confronto ?? e.confronto),
    rodadasConfronto: patch.confronto === false ? 0 : e.rodadasConfronto,
  }) });
}

export function girarDharma(s, d, id) {
  if (!d?.dharma?.ativo) return s;
  const estado = normalizaDharma(s.dharma);
  const e = estado.entradas.find((x) => x.id === id);
  if (!e || e.giros >= 6 || girosNestaRodada(e, s.rodada) >= 2
    || (e.tipo === "existencia" && estado.existencia !== id)) return s;
  const cura = e.tipo === "geral" && e.giros === 5 ? Math.min(e.dano, limiteCuraDharma(d)) : 0;
  const proximo = gravar(s, { ...estado, entradas: estado.entradas.map((x) => x.id !== id ? x : {
    ...x, giros: x.giros + 1, rodada: numero(s.rodada), usados: girosNestaRodada(x, s.rodada) + 1,
    curaGeral: cura || x.curaGeral,
  }) });
  return cura ? curar(proximo, cura, d) : proximo;
}

// O dano é o efetivamente recebido, já descontado na barra pelo narrador.
// Exposição com zero dano ainda aciona a cura da imunidade no sexto giro.
export function registrarDanoDharma(s, d, id, valor) {
  if (!d?.dharma?.ativo) return s;
  const estado = normalizaDharma(s.dharma);
  const e = estado.entradas.find((x) => x.id === id);
  if (!e || !["geral", "defesa"].includes(e.tipo)) return s;
  const proximo = gravar(s, { ...estado, entradas: estado.entradas.map((x) => x.id !== id ? x : {
    ...x, dano: x.giros < 6 ? x.dano + numero(valor) : x.dano,
    curaPendente: x.curaPendente || (x.tipo === "defesa" && x.giros >= 4 && numero(valor) > 0),
  }) });
  return e.tipo === "defesa" && e.giros === 6 ? curar(proximo, 3 * d.maestria, d) : proximo;
}

export function encerrarTurnoDharma(s, d) {
  if (!d?.dharma?.ativo) return s;
  const estado = normalizaDharma(s.dharma);
  const curas = estado.entradas.filter((e) => e.tipo === "defesa" && e.curaPendente).length;
  return curar(gravar(s, { ...estado, entradas: estado.entradas.map((e) => ({ ...e, curaPendente: false })) }), curas * 2 * d.maestria, d);
}

export function avancarRodadaDharma(s, d) {
  if (!d?.dharma?.ativo) return s;
  const estado = normalizaDharma(s.dharma);
  const e = estado.entradas.find((x) => x.id === estado.existencia && x.confronto && x.giros < 6);
  if (!e) return s;
  const rodadas = e.rodadasConfronto + 1;
  const proximo = gravar(s, { ...estado, entradas: estado.entradas.map((x) => x.id !== e.id ? x : {
    ...x, rodadasConfronto: rodadas % 6,
  }) });
  return rodadas >= 6 ? girarDharma(proximo, d, e.id) : proximo;
}

export function efeitosDharma(creature, bruta) {
  if (!temDharma(creature)) return [];
  const estado = normalizaDharma(bruta);
  const out = [];
  for (const e of estado.entradas) {
    const emitir = (canal, expr, alvo) => out.push({ canal, expr, ...(alvo ? { alvo } : {}),
      nome: `${TIPOS_DHARMA[e.tipo]} (${e.nome})`, origem: `dharma:${e.id}` });
    if (e.tipo === "defesa") {
      if (e.giros >= 2) emitir("rdTipo", "bt", e.tipoDano);
      if (e.giros >= 4) emitir("resistenciaDano", "1", e.tipoDano);
      if (e.giros >= 6) emitir("imunidadeDano", "1", e.tipoDano);
    }
    // Geral depende do fenômeno, não de TODO dano do mesmo tipo.
    if (e.tipo === "geral" && e.id === estado.fenomeno) {
      if (e.giros >= 2) { emitir("rdGeral", "2 * bt"); emitir("rdAlma", "2 * bt"); }
      if (e.giros >= 6) for (const tipo of Object.keys(TIPOS_DANO)) emitir("imunidadeDano", "1", tipo);
    }
    if (!estado.alvo || chave(e.nome) !== chave(estado.alvo)) continue;
    if (e.tipo === "ataque") {
      if (e.giros >= 2) { emitir("bonusAcerto", "2 * bt"); emitir("ignoraTodaRD", "1"); }
      if (e.giros >= 4) emitir("removeResistencia", "1");
      if (e.giros >= 6) { emitir("ignoraImunidade", "1"); emitir("dadosDano", "2"); }
    }
    if (e.tipo === "existencia" && e.giros >= 6) emitir("dadosDano", "2");
  }
  // A imunidade substitui a resistência da própria roda, sem gerar um falso
  // conflito na tabela nativa. As RDs e as curas continuam acumuláveis.
  const imunes = new Set(out.filter((e) => e.canal === "imunidadeDano").map((e) => e.alvo));
  return out.filter((e) => e.canal !== "resistenciaDano" || !imunes.has(e.alvo));
}

export function resultadosDharma(e, d) {
  const g = e.giros;
  if (g < 2) return [];
  if (e.tipo === "geral") return [`RD ${2 * d.maestria}`, "Vantagem em TR contra a condição",
    ...(g >= 4 ? ["Imune à condição", "Ignora efeitos ambientais e Acerto Garantido"] : []),
    ...(g >= 6 ? ["Imune ao fenômeno", `Cura ${e.curaGeral} PV`] : [])];
  if (e.tipo === "ataque") return [`Acerto +${2 * d.maestria}`, "Ignora toda RD",
    ...(g >= 4 ? ["Ignora Resistências", "Atravessa barreiras"] : []),
    ...(g >= 6 ? ["Ignora Imunidades e Esquiva Garantida", "Destrói proteção contra acerto", "+2 dados"] : [])];
  if (e.tipo === "defesa") return [`RD ${d.maestria}`,
    ...(g >= 4 ? ["Resistente", `Cura no fim do turno ${2 * d.maestria} PV`] : []),
    ...(g >= 6 ? ["Imune", `Cura por exposição ${3 * d.maestria} PV`] : [])];
  return ["Enxerga técnicas e ataques invisíveis", "Não pode ser surpreendido pelo alvo", "Características e Talentos revelados",
    ...(g >= 4 ? ["Duas Características ou Talentos anulados"] : []),
    ...(g >= 6 ? ["Imune às Características e Talentos", "Ignora proteção natural", "Cura própria do alvo 0", "+2 dados"] : [])];
}
