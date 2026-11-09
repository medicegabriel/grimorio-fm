// Livro p.103. Escolha dos dados entre o rolador nativo e a aplicação da cura.
import { encerraUso } from "./ficha-uso";
import { jaAplicada, usoDe } from "./ficha-uso-estado";
import { aplicaCura, marcaUso, registraRolagem, usosGastosDe } from "./ficha-sessao";

const ID = "sup_medicina_infalivel";
const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const mesmoTurno = (a, b) => !!a?.id && a.id === b?.id && a.rodada === b.rodada && a.turno === b.turno;

export function usosMedicinaInfalivel(sessao, derived) {
  const nivel = derived.habilidades?.niveisPorEspec?.suporte ?? 0;
  const tem = derived.habilidades?.efetivas?.some((id) => id.replace(/^.*__/, "") === ID
    && !derived.habilidades.inacessiveis?.includes(id));
  const max = tem && nivel > 0 ? Math.floor(nivel / 2) + derived.maestria : 0;
  const chave = "hab:" + ID;
  return { chave, max, restantes: Math.max(0, max - usosGastosDe(sessao, chave)) };
}

/** Cada grupo do rolador informa as faces reais, inclusive quando a fórmula mistura dados. */
export function dadosParaMedicina(rolagem) {
  let indice = 0;
  return (rolagem.gruposRolados ?? []).flatMap((g) => Array.from({ length: g.quantidade ?? 0 }, () => {
    const i = indice++;
    return { indice: i, faces: g.faces, valor: rolagem.dados[i] };
  }));
}

export function curasMedicinaPendentes(sessao) {
  const uso = usoDe(sessao);
  return (sessao.log ?? []).filter((r) => {
    const c = r.contextoCura;
    return c?.tipo === "medicinaPendente" && !r.consequenciasAplicadas && jaAplicada(sessao, c.operacaoId)
      && uso.ativos[c.ativoId]?.parametros?.operacaoId === c.operacaoId && uso.acoes.turno === c.turno;
  });
}

/** Uma reação pode ocorrer durante o turno de outra criatura. */
export function encerraCurasMedicinaDoTurno(combatentes, turno) {
  return combatentes.map((c) => {
    if (!c.sessao) return c;
    let sessao = c.sessao;
    for (const r of curasMedicinaPendentes(sessao)) {
      const ctx = r.contextoCura;
      if (!mesmoTurno(ctx.emCurso, turno)) continue;
      const fim = encerraUso(sessao, null, ctx.ativoId, { opId: ctx.operacaoId + ":fim", motivo: "fimDoTurno" });
      if (fim.aplicado) sessao = fim.sessao;
    }
    return sessao === c.sessao ? c : { ...c, sessao };
  });
}

/** Mesmo recibo de cura imediata, depois dos ajustes na rolagem. */
export function aplicaCuraIndividual(sessao, destinatario, dados, contexto, outroAlvo) {
  const { sessao: sa, derived: da } = destinatario;
  const valor = contexto.reversa && da.origensUso?.heranca ? Math.floor(dados.total / 2) : dados.total;
  const curado = aplicaCura(outroAlvo ? sa : sessao, valor, da.hp);
  const rolagem = { ...dados, consequenciasAplicadas: true, contextoCura: {
    ...contexto, tipo: "curaAplicada", valor, recuperado: curado.hpAtual - sa.hpAtual,
  } };
  const escreve = (s) => registraRolagem({ ...s, log: s.log.filter((r) => r.id !== dados.id) }, rolagem);
  return { rolagem, cura: valor, sessao: escreve(outroAlvo ? sessao : curado),
    ...(outroAlvo ? { sessaoAlvo: escreve(curado) } : {}) };
}

function maximizaDados(rolagem, indices) {
  let i = 0, ganho = 0;
  const dados = [...rolagem.dados], escolhas = [];
  const gruposRolados = rolagem.gruposRolados.map((g) => {
    let soma = 0;
    for (let j = 0; j < g.quantidade; j++, i++) {
      if (!indices.has(i)) continue;
      const de = dados[i];
      soma += g.faces - de;
      escolhas.push({ indice: i, de, para: g.faces });
      dados[i] = g.faces;
    }
    ganho += soma;
    return { ...g, total: g.total + soma };
  });
  return { ...rolagem, dados, gruposRolados, total: rolagem.total + ganho, medicinaInfalivel: escolhas,
    fontes: [...(rolagem.fontes ?? []), { label: "Medicina Infalível", valor: ganho }] };
}

export function concluiCuraComMedicina(sessao, derived, entrada = {}, pedido = {}, alvo = null) {
  if (jaAplicada(sessao, pedido.opId)) return { sessao, aplicado: false, repetida: true };
  const r = curasMedicinaPendentes(sessao).find((r) => r.id === entrada.curaId);
  if (!r) return recusa(sessao, "Falta Cura Pendente");
  const ctx = r.contextoCura;
  if ((alvo ? entrada.alvoId : null) !== ctx.alvoId || Boolean(alvo) !== Boolean(ctx.alvoId)) return recusa(sessao, "Alvo Diferente da Cura");
  const destinatario = alvo ?? { sessao, derived };
  if (destinatario.sessao.vital?.estado === "morto") return recusa(sessao, "Corpo Morto");
  if (ctx.reversa && destinatario.derived.origemEstruturalId === "maldicao") return recusa(sessao, "Energia Reversa Não Cura Maldições");
  if (ctx.emCurso && !mesmoTurno(ctx.emCurso, entrada.turnoEmCurso)) {
    return recusa(sessao, "Turno da Cura Já Encerrado");
  }
  const indices = entrada.indices;
  const quota = usosMedicinaInfalivel(sessao, derived);
  if (!Array.isArray(indices) || indices.length > quota.restantes || new Set(indices).size !== indices.length
    || indices.some((i) => !Number.isInteger(i) || i < 0 || i >= r.dados.length)) return recusa(sessao, "Seleção de Dados Fora do Limite");
  const fim = encerraUso(sessao, derived, ctx.ativoId, { ...pedido, motivo: "consumido" });
  if (!fim.aplicado) return fim;
  const pago = indices.length ? marcaUso(fim.sessao, quota, indices.length) : fim.sessao;
  const dados = indices.length ? maximizaDados(r, new Set(indices)) : r;
  return { ...fim, ...aplicaCuraIndividual(pago, destinatario, dados, ctx, Boolean(alvo)) };
}
