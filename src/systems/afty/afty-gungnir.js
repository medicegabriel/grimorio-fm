// Homebrew aprovado em 2026-10-25. Confirmações de acerto pertencem à mesa.
// Rolagem de ataque ou dano, sozinha, nunca confirma que houve acerto.
import { rolarDano } from "./ficha/ficha-rolagem";

export const GUNGNIR_ID = "vespa-crabro:gungnir";
const inteiro = (v) => Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0;
export const temGungnir = (c) => ["afty", "player"].includes(c?.rulesVersion)
  && (c.addons ?? []).some((p) => p?.permite?.includes("ressonanciaGungnir"));

export function normalizaGungnir(bruta) {
  const ids = new Set();
  const alvos = (Array.isArray(bruta?.alvos) ? bruta.alvos : []).flatMap((a) => {
    if (!a?.id || ids.has(String(a.id)) || !String(a.nome ?? "").trim()) return [];
    ids.add(String(a.id));
    return [{ id: String(a.id), nome: String(a.nome).trim(), cargas: inteiro(a.cargas),
      beesting: inteiro(a.beesting), waspsting: inteiro(a.waspsting) }];
  });
  return {
    alvos,
    modo: bruta?.modo === "arremesso" ? "arremesso" : "corpo",
    posicao: ["maos", "afastada", "cravada"].includes(bruta?.posicao) ? bruta.posicao : "maos",
    cravadaEm: alvos.some((a) => a.id === bruta?.cravadaEm) ? bruta.cravadaEm : "",
    eventos: [...new Set((Array.isArray(bruta?.eventos) ? bruta.eventos : []).filter((x) => typeof x === "string"))],
    acerto: bruta?.acerto && alvos.some((a) => a.id === bruta.acerto.alvo)
      ? { alvo: bruta.acerto.alvo, rodada: inteiro(bruta.acerto.rodada) } : null,
    zumbidoRodada: bruta?.zumbidoRodada == null ? null : inteiro(bruta.zumbidoRodada),
  };
}
const pode = (s, d) => !!d?.gungnir?.ativo && !!s?.combate?.ativo;
const gravar = (s, estado) => ({ ...s, gungnir: normalizaGungnir(estado) });

export function configurarModoGungnir(s, d, modo) {
  if (!pode(s, d) || !["corpo", "arremesso"].includes(modo)) return s;
  return gravar(s, { ...normalizaGungnir(s.gungnir), modo });
}

export function entradaGungnirNoModo(e, creature, bruta) {
  if (!temGungnir(creature) || !creature.combate?.ativo || e.def?.id !== GUNGNIR_ID
    || normalizaGungnir(bruta).modo !== "arremesso") return e;
  return { ...e, ataqueId: e.ataqueId === "amaldicoado" ? "amaldicoado" : "distancia", def: { ...e.def, categoria: "arremesso",
    props: { ...e.def.props, estendida: false, alcance: e.def.props.arremessavel } } };
}

export function adicionarAlvoGungnir(s, d, id, nome) {
  if (!pode(s, d) || !id || !String(nome ?? "").trim()) return s;
  const estado = normalizaGungnir(s.gungnir);
  if (estado.alvos.some((a) => a.id === id || a.nome.toLocaleLowerCase() === nome.trim().toLocaleLowerCase())) return s;
  return gravar(s, { ...estado, alvos: [...estado.alvos, { id, nome }] });
}

export function confirmarAcertoGungnir(s, d, { alvo, evento, armaId = GUNGNIR_ID, feiticoId = null }) {
  if (!pode(s, d) || armaId !== GUNGNIR_ID || typeof evento !== "string" || !evento.trim()) return s;
  const estado = normalizaGungnir(s.gungnir);
  const comFeiticoCravado = d.gungnir.inventariada && estado.posicao === "cravada" && estado.cravadaEm === alvo
    && ["vespa-crabro:beesting", "vespa-crabro:waspsting"].includes(feiticoId)
    && d.feiticos?.lista?.some((f) => f.id === feiticoId && !f.bloqueado);
  if (!d.gungnir.disponivel && !comFeiticoCravado) return s;
  if (estado.eventos.includes(evento) || !estado.alvos.some((a) => a.id === alvo)) return s;
  return gravar(s, { ...estado, eventos: [...estado.eventos, evento],
    alvos: estado.alvos.map((a) => a.id === alvo ? { ...a, cargas: Math.min(inteiro(d.maestria), a.cargas + 1) } : a),
    acerto: { alvo, rodada: inteiro(s.rodada) } });
}

export function aplicarPerfuracaoGungnir(s, d, alvo, tipo) {
  const id = tipo === "beesting" ? "vespa-crabro:beesting" : "vespa-crabro:waspsting";
  if (!pode(s, d) || !["beesting", "waspsting"].includes(tipo)
    || !d.feiticos?.lista?.some((f) => f.id === id && !f.bloqueado)) return s;
  const estado = normalizaGungnir(s.gungnir);
  if (!d.gungnir.disponivel && estado.cravadaEm !== alvo) return s;
  if (estado.acerto?.alvo !== alvo || estado.acerto.rodada !== inteiro(s.rodada)
    || !estado.alvos.some((a) => a.id === alvo)) return s;
  // A mesa confirma o TR falho. Cada estado conserva sua própria duração.
  return gravar(s, { ...estado, posicao: "cravada", cravadaEm: alvo,
    alvos: estado.alvos.map((a) => a.id === alvo ? { ...a, [tipo]: tipo === "beesting" ? 4 : 3 } : a) });
}

export function afastarGungnir(s, d) {
  if (!pode(s, d) || !d.gungnir.disponivel) return s;
  const estado = normalizaGungnir(s.gungnir);
  return gravar(s, { ...estado, posicao: "afastada", cravadaEm: "", acerto: null });
}

export function recuperarGungnir(s, d) {
  if (!pode(s, d)) return s;
  const estado = normalizaGungnir(s.gungnir);
  // Recuperar não rola dano, não confirma acerto e não consome ressonância.
  return gravar(s, { ...estado, posicao: "maos", cravadaEm: "", acerto: null,
    alvos: estado.alvos.map((a) => a.id === estado.cravadaEm ? { ...a, beesting: 0, waspsting: 0 } : a) });
}

export function consumirRessonanciaGungnir(s, d, alvo, rng = Math.random) {
  if (!pode(s, d) || !d.gungnir.zumbido) return s;
  const estado = normalizaGungnir(s.gungnir);
  const entrada = estado.alvos.find((a) => a.id === alvo);
  if (!entrada?.cargas || estado.zumbidoRodada === inteiro(s.rodada)
    || estado.acerto?.alvo !== alvo || estado.acerto.rodada !== inteiro(s.rodada)) return s;
  const cargas = Math.min(entrada.cargas, inteiro(d.maestria));
  if (!cargas) return s;
  const rolagem = rolarDano({ rotulo: `Zumbido de Gungnir (${entrada.nome})`,
    detalhe: "Perfurante, Após Ataque", dados: cargas, faces: 12, critico: false }, rng);
  const proxima = gravar(s, { ...estado, zumbidoRodada: inteiro(s.rodada), acerto: null,
    alvos: estado.alvos.map((a) => a.id === alvo ? { ...a, cargas: 0 } : a) });
  return { ...proxima, log: [rolagem, ...(s.log ?? [])].slice(0, 50) };
}

export function avancarGungnir(bruta) {
  const estado = normalizaGungnir(bruta);
  return normalizaGungnir({ ...estado, acerto: null,
    alvos: estado.alvos.map((a) => ({ ...a, beesting: Math.max(0, a.beesting - 1), waspsting: Math.max(0, a.waspsting - 1) })) });
}

export function comGungnirNaSessao(creature, bruta) {
  if (!temGungnir(creature) || !creature.combate?.ativo || normalizaGungnir(bruta).posicao === "maos") return creature;
  return { ...creature, equipamentos: { ...creature.equipamentos,
    itens: (creature.equipamentos?.itens ?? []).map((e) => e.refId === GUNGNIR_ID ? { ...e, equipado: false } : e) } };
}
