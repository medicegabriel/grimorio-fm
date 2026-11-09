// CX3, frente Aptidões e Treinos (Claude). Livro p.179, Expandir Aura.
// "No seu turno, como uma ação livre, você pode gastar 2 pontos de energia amaldiçoada para expandir
// a sua aura, dobrando o alcance de todas as suas aptidões de aura passivas por uma rodada. Para cada
// rodada após a primeira, você deve pagar mais 1 ponto de energia para a manter expandida."
//
// O uso é o mesmo molde da Aura Embaçada (`duracao.manutencao`). Quem MOSTRA o alcance (Pacotes para
// Aliados, a ficha) lê `alcancesDasAurasPassivas`, que devolve o número já dobrado ou não.
import { getAptidao } from "../afty-aptidoes";
import {
  ID_EXPANDIR_AURA, CUSTO_EXPANDIR_AURA, ALCANCES_DE_AURA_PASSIVA, AURAS_QUE_NAO_EXPANDEM, alcanceDaAuraMovedica, dobraAlcance,
} from "../afty-conteudo-auras";
import { usa } from "./ficha-uso";
import { usoDe } from "./ficha-uso-estado";
import { aptidaoDeConteudoDisponivel, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });

/** A aura está expandida agora? Lê o uso ativo, que a virada de rodada e o encerramento mantêm. */
export const auraExpandida = (sessao) => !!usoDe(sessao).ativos[ID_EXPANDIR_AURA];

/**
 * Usa Expandir Aura. `entrada`: `{ emSeuTurno, descontarPE? }`. Livre, 2 PE, exige o seu turno.
 * A manutenção de 1 PE por rodada seguinte segue o contrato de `duracao.manutencao` do CL1.
 */
export function usaExpandirAura(sessao, derived, entrada = {}, pedido = {}) {
  if (!aptidaoDeConteudoDisponivel(derived, ID_EXPANDIR_AURA)) return recusa(sessao, "Expandir Aura Indisponível");
  const esp = sessao.especializacaoSessao;
  if (entrada.emSeuTurno !== true || (esp?.turnoEncerrado != null && esp.turnoEncerrado === esp.turno)) {
    return recusa(sessao, "Expandir Aura Exige Seu Turno");
  }
  return usa(sessao, derived, {
    id: ID_EXPANDIR_AURA, nome: "Expandir Aura", emCombate: true, acesso: impedimentoParaAgirConteudo,
    acao: "livre", cobranca: entrada.descontarPE ? "confirmada" : "manual",
    proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    custo: { pe: CUSTO_EXPANDIR_AURA.ativar }, duracao: { manutencao: { pe: CUSTO_EXPANDIR_AURA.manter } },
  }, { ...pedido, registraAcao: true });
}

/**
 * O alcance de cada Aptidão de Aura passiva que o Livro numera, com o dobro quando a expansão está ativa.
 * Uma aura que Concentrar Aura desligou não conta (a passiva está suspensa), e Aura Movediça nunca dobra.
 * Retorno: `[{ id, nome, base, atual, expandido, suspensa?, motivo?, pagina }]`.
 */
export function alcancesDasAurasPassivas(sessao, derived) {
  const ativo = usoDe(sessao).ativos[ID_EXPANDIR_AURA];
  const expandida = !!ativo && !ativo.manutencao?.devidas;
  const suspensas = new Set(derived?.combate?.concentrarAura ?? []);
  const au = derived?.aptidao?.efetivo?.au ?? 0;
  const linhas = [];
  for (const [id, a] of Object.entries(ALCANCES_DE_AURA_PASSIVA)) {
    if (!aptidaoDeConteudoDisponivel(derived, id)) continue;
    const suspensa = suspensas.has(id);
    const expandido = expandida && !suspensa;
    linhas.push({ id, nome: getAptidao(id)?.nome ?? id, base: a.base, atual: expandido ? dobraAlcance(a.base) : a.base,
      expandido, ...(suspensa ? { suspensa: true } : {}), pagina: a.pagina });
  }
  for (const [id, a] of Object.entries(AURAS_QUE_NAO_EXPANDEM)) {
    if (!aptidaoDeConteudoDisponivel(derived, id)) continue;
    const base = alcanceDaAuraMovedica(au);
    linhas.push({ id, nome: getAptidao(id)?.nome ?? id, base, atual: base, expandido: false,
      ...(suspensas.has(id) ? { suspensa: true } : {}), motivo: a.motivo, pagina: a.pagina });
  }
  return linhas;
}
