/**
 * ============================================================
 * O CONTRATO DE USO E O COMBATE DO CL1, NA CAMADA DA MESA DO G2 (2026-10-29)
 * ============================================================
 * Adaptadores finos, no formato de `operacoes.js`: recebem a MESA (`sessao-g2.js`), rodam o verbo do CL1 sobre a sessão
 * dela e devolvem `{ mesa, erro? }`, com o evento no histórico e, quando a ficha DEBITOU Energia, a ativação que o
 * Estornar PE consulta. A recusa devolve a mesa de antes (a mesma, sem evento), como as outras operações da mesa.
 *
 * ⚠ AQUI NÃO MORA REGRA. Cada função só traduz o retorno do verbo (`ficha-uso.js`, `ficha-dano-recebido.js`,
 * `ficha-concentracao.js`, `ficha-combate-eventos.js`) em evento e ativação. A tela do G2 (que o Codex monta e que continua
 * atrás da prévia) chama estas funções dentro de UM `atualiza`, sobre a sessão que estiver valendo.
 *
 * ⚠ O DANO TIPADO NÃO USA O EVENTO `dano`: o histórico acrescenta "sem abater RD" a ele, o que seria mentira aqui. Vai como
 * `info`, com a conta em `passos`.
 * ============================================================
 */
import { comEvento } from "./mesa-verbos";
import { usa, pagaManutencao, encerraUso } from "../ficha-uso";
import { aplicaDanoRecebido } from "../ficha-dano-recebido";
import { rolaTesteDeConcentracao, resolveTesteDeConcentracao, abreTesteDeConcentracao } from "../ficha-concentracao";
import { registraAtaqueRealizado, registraAtaqueRecebido } from "../ficha-combate-eventos";
import { uid } from "./util";

const recusada = (mm, r) => ({ mesa: mm, erro: r.erro ?? "Nada Mudou", codigo: r.codigo, recusas: r.recusas });
const repetida = (mm) => ({ mesa: mm, erro: "Já Aplicado", repetida: true });

/** O gasto que a ficha DEBITOU vira ativação (o Estornar PE devolve só isso). Quem não debitou fica no evento, sem ativação. */
function comGasto(mm, nome, custo) {
  const { cobrado, casca, reserva } = custo.pe;
  if (cobrado <= 0) return { m: mm };
  const id = uid();
  const ativacao = { id, tipo: "gasto", nome, custo: cobrado, pago: { casca, reserva }, rodada: mm.sessao.rodada, desfeita: false, criadaEm: Date.now() };
  return { m: { ...mm, ativacoes: { ...mm.ativacoes, [id]: ativacao } }, id, pago: { casca, reserva } };
}

const textoDoCusto = (custo) => (custo.pe.naoDescontado > 0 ? ` · PE Não Descontado: ${custo.pe.naoDescontado}` : "");

export function usaPelaMesa(mm, descritor, pedido, { derived }) {
  const r = usa(mm.sessao, derived, descritor, pedido);
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  const nome = descritor.nome ?? descritor.id;
  const { m, id, pago } = comGasto({ ...mm, sessao: r.sessao }, nome, r.custo);
  const evento = id
    ? { tipo: "ativacao", ativacaoId: id, nome, custo: r.custo.pe.cobrado, pago }
    : { tipo: "info", texto: `${nome} · usou${textoDoCusto(r.custo)}`, usoId: descritor.id };
  return { mesa: comEvento(m, evento), resultado: r };
}

export function pagaManutencaoPelaMesa(mm, ativoId, pedido, { derived }) {
  const r = pagaManutencao(mm.sessao, derived, ativoId, pedido);
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  const nome = r.evento.nome;
  const { m, id, pago } = comGasto({ ...mm, sessao: r.sessao }, nome, r.custo);
  const evento = id
    ? { tipo: "ativacao", ativacaoId: id, nome, custo: r.custo.pe.cobrado, pago }
    : { tipo: "info", texto: `${nome} · manutenção paga${textoDoCusto(r.custo)}`, usoId: ativoId };
  return { mesa: comEvento(m, evento), resultado: r };
}

export function encerraUsoPelaMesa(mm, ativoId, pedido, { derived }) {
  const r = encerraUso(mm.sessao, derived, ativoId, pedido);
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  return { mesa: comEvento({ ...mm, sessao: r.sessao }, { tipo: "info", texto: `${r.evento.nome} · encerrado`, usoId: ativoId }), resultado: r };
}

/** Dano, perda de vida ou dano na Alma pela conta do livro. O texto diz o que cada passo da conta fez. */
export function danoRecebidoPelaMesa(mm, entrada, pedido, { derived }) {
  const r = aplicaDanoRecebido(mm.sessao, derived, entrada, pedido);
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  const rotulo = r.evento.tipo === "perda" ? "Perda de Vida" : r.evento.tipo === "dano-alma" ? "Dano na Alma" : "Dano";
  const passos = r.calculo.passos.map((p) => `${p.label} ${p.de} para ${p.para}`).join(" · ");
  const efeito = [r.mudou.casca ? `Temporário ${r.mudou.casca}` : null, r.mudou.vida ? `Vida ${r.mudou.vida}` : null, r.mudou.alma ? `Alma ${r.mudou.alma}` : null].filter(Boolean).join(" · ") || "sem mudança";
  const texto = `${rotulo} ${r.calculo.base} para ${r.calculo.final}${entrada.tipo ? ` (${entrada.tipo})` : ""}${passos ? ` · ${passos}` : ""} · ${efeito}`;
  return {
    mesa: comEvento({ ...mm, sessao: r.sessao }, { tipo: "info", texto, passos: r.calculo.passos, mudou: r.mudou, abateu: r.abateu, excessoSobreZero: r.excessoSobreZero }),
    resultado: r,
  };
}

/** Rola o teste de concentração pendente (ou resolve o resultado informado) e anota o desfecho. */
export function testeDeConcentracaoPelaMesa(mm, pedido, { derived, rng }) {
  const r = pedido.total != null || pedido.rolagem
    ? resolveTesteDeConcentracao(mm.sessao, derived, pedido)
    : rolaTesteDeConcentracao(mm.sessao, derived, { ...pedido, rng });
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  const texto = r.sucesso ? `Concentração mantida · ${r.total} contra CD ${r.cd}` : `Concentração perdida · ${r.total} contra CD ${r.cd}`;
  return { mesa: comEvento({ ...mm, sessao: r.sessao }, { tipo: "info", texto }), resultado: r };
}

export function ameacaConcentracaoPelaMesa(mm, causa, dados) {
  const r = abreTesteDeConcentracao(mm.sessao, causa, dados);
  if (!r.aplicado) return r.semConcentracao ? { mesa: mm, semConcentracao: true } : recusada(mm, r);
  return { mesa: comEvento({ ...mm, sessao: r.sessao }, { tipo: "info", texto: `Concentração ameaçada · CD ${r.teste.cd}` }), resultado: r };
}

export function ataqueRealizadoPelaMesa(mm, ataque, pedido, { derived }) {
  const r = registraAtaqueRealizado(mm.sessao, derived, ataque, pedido);
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  const consumo = r.consumidas.length ? ` · consumiu ${r.consumidas.length}` : "";
  return { mesa: comEvento({ ...mm, sessao: r.sessao }, { tipo: "info", texto: `Ataque ${ataque.acertou === true ? "acertou" : ataque.acertou === false ? "errou" : "sem resultado"}${ataque.critico ? " · crítico" : ""}${ataque.desastre ? " · desastre" : ""}${consumo}` }), resultado: r };
}

export function ataqueRecebidoPelaMesa(mm, ataque, pedido, { derived }) {
  const r = registraAtaqueRecebido(mm.sessao, derived, ataque, pedido);
  if (r.repetida) return repetida(mm);
  if (!r.aplicado) return recusada(mm, r);
  return { mesa: comEvento({ ...mm, sessao: r.sessao }, { tipo: "info", texto: `Ataque recebido · sequência de ${r.sequencia.ataques}${r.sequencia.penalidade ? ` · Defesa −${r.sequencia.penalidade}` : ""}` }), resultado: r };
}
