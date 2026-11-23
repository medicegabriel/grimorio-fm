/**
 * A LINHA DO FEITIÇO DE ECLESIASTES NA FICHA (2026-11-23)
 *
 * Sai no MESMO formato do `linhaDoFeitico` (`afty-feiticos.js`), então a Ficha
 * G2, a clássica, o Encontro e a Sala mostram, rolam e cobram o PE sem saber que
 * o modelo mudou. Tudo vem do `calc` do extrato: nada é recalculado aqui.
 *
 * ⚠ `vezes` NÃO multiplica os dados (mesma regra do `rolagensDoFeitico`): cada
 * disparo tem acerto próprio, então a Ficha rola um por clique.
 */
import { ACOES_ECL, AUX_POR_ID_ECL, REQUISITOS_ECL } from "./tabelas";

const ROTULO_ACAO = { ...Object.fromEntries(ACOES_ECL.map((a) => [a.value, a.label])), ritualEstendido: "Ritual Estendido" };
const ROTULO_REQ = Object.fromEntries(REQUISITOS_ECL.map((r) => [r.value, r.label]));
const ROTULO_ALVO = { proprio: "Próprio", alvo: "Alvo", area: "Área" };
const sinal = (v, sentido) => `${sentido === "debuff" ? "−" : "+"}${String(v).replace(".", ",")}`;

export function textoDoEfeitoEcl(e) {
  const def = AUX_POR_ID_ECL[e.efeito];
  const escolha = e.escolhaLabel ?? e.escolha;
  return `${sinal(e.valor, e.sentido)}${def?.unidade ? ` ${def.unidade}` : ""} ${def?.label ?? e.efeito}${escolha ? ` (${escolha})` : ""}`;
}

function tipoDaLinha(calc) {
  if (calc.feitico.natureza === "passivo") return "passivo";
  if (calc.dano) return "dano";
  if (calc.cura) return "curativo";
  return "auxiliar";
}

function valorPrincipal(calc) {
  const { dano, cura } = calc;
  if (dano) {
    const d = dano.porParte != null ? `${dano.partes}× ${dano.porParte}d${dano.faces}` : `${dano.dados}d${dano.faces}`;
    return { valor: d, rotulo: "Dano" };
  }
  if (cura) return { valor: `${cura.dados}d${cura.faces}`, rotulo: cura.temporaria ? "PV Temporário" : "Cura" };
  const e = calc.efeitos[0];
  if (e) return { valor: textoDoEfeitoEcl(e), rotulo: "Efeito" };
  const c = calc.condicoes[0];
  if (c) return { valor: c.rotulo, rotulo: "Condição" };
  return { valor: null, rotulo: "Efeito" };
}

function rolagensEcl(calc) {
  const out = [];
  const { dano, cura, liberacao } = calc;
  if (dano) {
    const porParte = dano.porParte != null && dano.porParte > 0;
    out.push({ rotulo: "Dano", dados: porParte ? dano.porParte : dano.dados, faces: dano.faces, tom: "dano", vezes: porParte ? dano.partes : 1 });
    if (dano.porRodada) out.push({ rotulo: "Por Rodada", dados: dano.porRodada, faces: dano.faces, tom: "dano", vezes: 1, continuacao: true });
  }
  if (cura) {
    out.push({ rotulo: cura.temporaria ? "PV Temporário" : "Cura", dados: cura.dados, faces: cura.faces, tom: "cura", vezes: 1 });
    if (cura.porRodada) out.push({ rotulo: "Cura por Rodada", dados: cura.porRodada, faces: cura.faces, tom: "cura", vezes: 1, continuacao: true });
  }
  if (liberacao?.temCompra) {
    if (dano && liberacao.dadosDano > dano.dados) out.push({ rotulo: "Liberação Máxima", dados: liberacao.dadosDano, faces: dano.faces, tom: "dano", vezes: 1 });
    if (liberacao.dadosCura > (cura?.dados ?? 0)) out.push({ rotulo: "Liberação Máxima (Cura)", dados: liberacao.dadosCura, faces: calc.dano?.faces ?? cura?.faces ?? 8, tom: "cura", vezes: 1 });
  }
  return out;
}

function duracaoTexto(calc) {
  if (calc.acao === "reacao") return "Até o Gatilho";
  const partes = [];
  if (calc.duracao.duradouro) partes.push(`${calc.duracao.duradouro.rodadas} Rodadas${calc.duracao.duradouro.concentracao ? " (Concentração)" : ""}`);
  if (calc.duracao.sustentado) partes.push(`Sustentado, ${calc.duracao.sustentado.manutencao} PE por Rodada${calc.duracao.sustentado.concentracao ? " (Concentração)" : ""}`);
  return partes.length ? partes.join(" e ") : "Imediata";
}

export function linhaDoFeiticoEcl(calc, { cd = null } = {}) {
  const f = calc.feitico;
  const passivo = f.natureza === "passivo";
  const { valor, rotulo } = valorPrincipal(calc);
  const efeitosTexto = calc.efeitos.map((e) => `${textoDoEfeitoEcl(e)} (${ROTULO_ALVO[e.alvo] ?? e.alvo})`).join(", ");
  const temTR = calc.dano?.resolucao !== "ataque" && (calc.dano || calc.condicoes.length || calc.efeitos.some((e) => e.sentido === "debuff"));
  const propriedades = passivo ? [
    { id: "valor", nome: rotulo, valor },
    { id: "natureza", nome: "Passivo", valor: { permanente: "Permanente", condicional: "Condicional", semiativo: "Semiativo" }[f.passivo.modo] },
    { id: "efeitos", nome: "Efeitos", valor: efeitosTexto || null },
    { id: "usos", nome: "Usos", valor: calc.usosSemiativo != null ? `${calc.usosSemiativo} por ${{ cena: "Cena", descanso: "Descanso Longo", interludio: "Interlúdio" }[f.passivo.recarga]}` : null },
    { id: "gatilho", nome: "Gatilho", valor: f.passivo.gatilho || null },
    { id: "requisitos", nome: "Condição", valor: f.passivo.requisitos.map((r) => `${r.texto || "Requisito"} (${ROTULO_REQ[r.dificuldade]})`).join(", ") || null },
  ] : [
    { id: "valor", nome: rotulo, valor },
    { id: "conjuracao", nome: "Conjuração", valor: ROTULO_ACAO[calc.acao] ?? null },
    { id: "alcance", nome: "Alcance", valor: calc.entrega.alcance?.texto ?? null },
    { id: "area", nome: "Área", valor: calc.entrega.area?.texto ?? null },
    { id: "alvo", nome: "Alvos", valor: calc.entrega.multiplos ? [
      calc.entrega.multiplos.alvos && `${calc.entrega.multiplos.alvos} Alvos`,
      calc.entrega.multiplos.disparos && `${calc.entrega.multiplos.disparos} Disparos`,
      calc.entrega.multiplos.areas && `${calc.entrega.multiplos.areas} Áreas`,
    ].filter(Boolean).join(", ") : null },
    { id: "duracao", nome: "Duração", valor: duracaoTexto(calc) },
    { id: "resolucao", nome: "Resolução", valor: calc.dano ? (calc.dano.resolucao === "ataque" ? "Jogada de Ataque" : `Teste de ${calc.dano.trLabel ?? calc.dano.tr}${calc.dano.desvantagemTR ? " com Desvantagem" : ""}`) : null },
    { id: "cd", nome: "CD", valor: temTR && cd != null ? String(cd) : null },
    { id: "efeitos", nome: "Efeitos", valor: calc.dano || calc.cura ? efeitosTexto || null : calc.efeitos.slice(1).map((e) => textoDoEfeitoEcl(e)).join(", ") || null },
    { id: "condicoes", nome: "Condições", valor: calc.condicoes.map((c) => c.rotulo).join(", ") || null },
    { id: "vampirico", nome: "Vampírico", valor: calc.dano?.vampirico ? "Drena um Terço" : null },
    { id: "ignora", nome: "Ignora", valor: calc.dano?.ignorarResistencias ? "Resistências e RD Redutível" : null },
    { id: "morte", nome: "Morte Direta", valor: calc.dano?.morteDireta ? "Sim" : null },
    { id: "requisitos", nome: "Requisitos", valor: f.requisitos.map((r) => `${r.texto || "Requisito"} (${ROTULO_REQ[r.dificuldade]})`).join(", ") || null },
    { id: "desgaste", nome: "Desgaste", valor: [f.fadiga && `${f.fadiga} de Fadiga`, f.exaustao && `${f.exaustao} de Exaustão`].filter(Boolean).join(" e ") || null },
    { id: "liberacao", nome: "Liberação Máxima", valor: calc.liberacao?.temCompra
      ? `${calc.liberacao.pe.total} PE (+${calc.liberacao.peExtra}), ${calc.liberacao.fadiga} de Fadiga` : null },
    { id: "recarga", nome: "Recarga", valor: calc.recarga != null ? `${calc.recarga} Rodadas` : null },
  ];
  return {
    id: f.id,
    nome: f.nome || "",
    tipo: tipoDaLinha(calc),
    edicao: "eclesiastes",
    nivel: passivo ? null : f.nd,
    nd: passivo ? null : f.nd,
    nivelLabel: passivo ? "Passivo" : `ND ${f.nd}`,
    custoPE: calc.pe?.total ?? null,
    custoPEBase: calc.pe?.total ?? null,
    custoPETexto: null,
    reducoesCustoPE: [],
    partesCustoPE: calc.pe?.partes ?? [],
    beneficiosOrigem: null,
    valor,
    valorLabel: rotulo,
    descricao: f.descricao || "",
    conjuracaoTexto: "",
    propriedades: propriedades.filter((p) => p.valor != null && p.valor !== ""),
    variacao: false,
    marcial: false,
    tipoLabel: passivo ? "Passivo" : { comum: "Feitiço", destrutivo: "Destrutivo", cataclismico: "Cataclísmico" }[f.tipo],
    ataque: null,
    tecnicaMaxima: f.tecnicaMaxima && !passivo ? { identidade: true, oficial: true, legacy: false, escala: "max", inicioRecarga: "aoUsar", recarga: calc.recarga } : null,
    liberacao: null,
    consomeEstado: null,
    ritual: null,
    rolagens: passivo ? [] : rolagensEcl(calc),
    custoVidaAtivacao: null,
    custoVidaAtual: null,
    custoVidaDisponivel: null,
    custoPeMaximo: null,
    avisos: [...calc.bloqueios, ...calc.avisos],
  };
}
