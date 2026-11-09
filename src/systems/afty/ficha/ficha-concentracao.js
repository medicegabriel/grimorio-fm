/**
 * ============================================================
 * CONCENTRAÇÃO LIGADA AO EFEITO (CL1, 2026-10-29)
 * ============================================================
 * Livro p.320: "algumas habilidades e técnicas necessitam de que seu usuário se mantenha concentrado". Quem
 * tenta se manter faz um TR de Fortitude, com a CD do que ameaça a concentração:
 *
 *   receber dano          10 ou metade do dano recebido, o que for maior
 *   ser movido            5 + a distância movida
 *   ser empurrado/agarrado 10 + o bônus de Atletismo de quem empurrou ou agarrou
 *   ser provocado         10 + o bônus da perícia usada por quem provocou
 *
 * "Só se pode, por padrão, concentrar em uma habilidade por vez." O estado é UM espaço (`sessao.uso.concentracao`),
 * ligado ao efeito que o abriu: um uso ativo (`usa` com `concentracao: true`) ou o Ritual Estendido, que exige
 * manter a concentração entre o primeiro e o segundo turno (p.322). Perder a concentração encerra o efeito e desfaz
 * o que ele ligou.
 *
 * ⚠ A FICHA NÃO ROLA SOZINHA. Um evento que ameaça a concentração só ABRE o teste pendente com a CD certa
 * (`abreTesteDeConcentracao`), e quem rola é a pessoa (`rolaTesteDeConcentracao`) ou a mesa informa o resultado
 * (`resolveTesteDeConcentracao`). O bônus do teste (Fortitude, Faixa de Foco, Sofrendo) já vem pronto em
 * `derived.testes.manobras`.
 *
 * ⚠ AS CONDIÇÕES QUE IMPEDEM CONCENTRAR NÃO TÊM LISTA NO LIVRO ("certas condições", p.320). A lista é dado
 * (`CONDICOES_QUE_IMPEDEM_CONCENTRACAO`), nasce vazia por não ter fonte, e o verbo existe para quando o autor
 * responder (pendência em docs/a-fazer.md).
 * ============================================================
 */
import { cancelaRitual, registraRolagem } from "./ficha-sessao";
import { rolarTeste } from "./ficha-rolagem";
import {
  usoDe, comUso, jaAplicada, comOperacao, encerraAtivoNaSessao, fechaConcentracaoNaSessao,
} from "./ficha-uso-estado";
import { temCondicaoNaSessao } from "./ficha-acoes";

export const CONDICOES_QUE_IMPEDEM_CONCENTRACAO = [];

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const naoNegativo = (v) => Math.max(0, inteiro(v));

/** A CD do teste de manutenção, pela causa (p.320). `null` se a causa não existe. */
export function cdDaConcentracao(causa, dados = {}) {
  switch (causa) {
    case "dano": return Math.max(10, Math.floor(naoNegativo(dados.valor) / 2));
    case "movido": return 5 + naoNegativo(dados.distancia);
    case "empurrado":
    case "agarrado": return 10 + inteiro(dados.bonus);
    case "provocado": return 10 + inteiro(dados.bonus);
    default: return null;
  }
}

export const concentracaoDe = (sessao) => usoDe(sessao).concentracao;
export const testeDeConcentracaoPendente = (sessao) => usoDe(sessao).teste;

/** O Ritual Estendido pede o espaço de concentração: se está ocupado, o motivo. */
export const bloqueioRitualEstendido = (sessao) => (concentracaoDe(sessao) ? "Já Concentrado" : null);

const semIdentidade = (sessao) => ({ sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" });

/**
 * Um evento ameaçou a concentração. Se a ficha não está concentrada, não há o que testar e nada muda (sem erro). Se
 * está, o teste fica pendente com a CD da causa. Vários eventos antes do teste mantêm a MAIOR CD pendente.
 * `opId` é opcional aqui porque o evento costuma nascer dentro de outra operação que já tem identidade.
 */
export function abreTesteDeConcentracao(sessao, causa, dados = {}, { opId = null } = {}) {
  if (opId && jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const cd = cdDaConcentracao(causa, dados);
  if (cd == null) return { sessao, aplicado: false, erro: "Causa Desconhecida", codigo: "causa-desconhecida" };
  const conc = concentracaoDe(sessao);
  if (!conc) return { sessao, aplicado: false, semConcentracao: true };
  const atual = testeDeConcentracaoPendente(sessao);
  const novo = !atual || cd > atual.cd ? { cd, causa, desde: naoNegativo(sessao?.rodada) } : atual;
  let s = comUso(sessao, (u) => ({ ...u, teste: novo }));
  if (opId) s = comOperacao(s, { id: opId, tipo: "concentracao-teste" });
  return { sessao: s, aplicado: true, teste: novo, evento: { tipo: "concentracao-teste", nome: conc.nome, cd: novo.cd, causa: novo.causa } };
}

/**
 * Perde a concentração: encerra o uso ativo ligado (desfazendo o que ele ligou), cancela o Ritual Estendido se era
 * ele, e limpa o espaço e o teste pendente.
 */
export function perdeConcentracao(sessao, derived, causa = "falha", { opId = null } = {}) {
  if (opId && jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const conc = concentracaoDe(sessao);
  if (!conc) return { sessao, aplicado: false, erro: "Sem Concentração", codigo: "sem-concentracao" };
  let s = encerraAtivoNaSessao(sessao, conc.id, "concentracao-perdida");
  if (conc.ritualFeiticoId) s = cancelaRitual(s, conc.ritualFeiticoId);
  s = fechaConcentracaoNaSessao(s);
  if (opId) s = comOperacao(s, { id: opId, tipo: "concentracao-perdida" });
  return { sessao: s, aplicado: true, evento: { tipo: "concentracao-perdida", nome: conc.nome, usoId: conc.id, causa } };
}

/**
 * O resultado do teste pendente, já rolado (`rolagem` de `rolarTeste`) ou informado (`total`). `bonusExtra` é o que a
 * pessoa escolheu pagar para somar (Concentrar Aura) e `reducaoCd` o que abate a CD. Sucesso mantém a concentração e
 * limpa o teste. Falha a perde.
 */
export function resolveTesteDeConcentracao(sessao, derived, { rolagem = null, total = null, bonusExtra = 0, reducaoCd = 0, opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const teste = testeDeConcentracaoPendente(sessao);
  if (!teste) return { sessao, aplicado: false, erro: "Sem Teste Pendente", codigo: "sem-teste" };
  const bruto = rolagem?.total ?? total;
  if (bruto == null || bruto === "" || !Number.isFinite(Number(bruto))) return { sessao, aplicado: false, erro: "Falta o Resultado do Teste", codigo: "sem-resultado" };
  const cd = Math.max(0, teste.cd - naoNegativo(reducaoCd));
  const soma = inteiro(bruto) + inteiro(bonusExtra);
  const sucesso = soma >= cd;
  if (sucesso) {
    const s = comOperacao(comUso(sessao, (u) => ({ ...u, teste: null })), { id: opId, tipo: "concentracao-teste" });
    return { sessao: s, aplicado: true, sucesso: true, cd, total: soma, evento: { tipo: "concentracao-mantida", nome: concentracaoDe(sessao)?.nome, cd, total: soma } };
  }
  /* CL3: um uso com DURABILIDADE (a Cesta Oca de Vime, p.188: "sempre que falhar em um teste de concentração, a Durabilidade
     desce em 1") não perde a concentração na primeira falha. Perde 1 de Durabilidade, e só cai quando chega a zero. A
     Durabilidade mora nos parâmetros do uso ativo, e qualquer uso que a declare herda a regra. */
  const conc = concentracaoDe(sessao);
  const ativo = conc ? usoDe(sessao).ativos[conc.id] : null;
  const durabilidade = ativo?.parametros?.durabilidade;
  if (Number.isFinite(durabilidade)) {
    const restante = Math.max(0, durabilidade - 1);
    if (restante > 0) {
      const mantida = comUso(sessao, (u) => ({
        ...u,
        teste: null,
        ativos: { ...u.ativos, [ativo.id]: { ...ativo, parametros: { ...ativo.parametros, durabilidade: restante } } },
      }));
      const s = comOperacao(mantida, { id: opId, tipo: "concentracao-teste" });
      return { sessao: s, aplicado: true, sucesso: false, mantida: true, durabilidade: restante, cd, total: soma, evento: { tipo: "concentracao-durabilidade", nome: conc.nome, usoId: conc.id, durabilidade: restante, cd, total: soma } };
    }
    const quebrada = perdeConcentracao(sessao, derived, teste.causa);
    const s = comOperacao(quebrada.sessao, { id: opId, tipo: "concentracao-teste" });
    return { sessao: s, aplicado: true, sucesso: false, quebrou: true, durabilidade: 0, cd, total: soma, evento: { ...quebrada.evento, quebrou: true, cd, total: soma } };
  }
  const perdida = perdeConcentracao(sessao, derived, teste.causa);
  const s = comOperacao(perdida.sessao, { id: opId, tipo: "concentracao-teste" });
  return { sessao: s, aplicado: true, sucesso: false, cd, total: soma, evento: { ...perdida.evento, cd, total: soma } };
}

/** Rola o teste pendente pelo bônus pronto do `derived` (Concentração) e resolve. A rolagem entra no log da sessão. */
export function rolaTesteDeConcentracao(sessao, derived, { rng = Math.random, modo = "normal", bonusExtra = 0, reducaoCd = 0, opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const teste = testeDeConcentracaoPendente(sessao);
  if (!teste) return { sessao, aplicado: false, erro: "Sem Teste Pendente", codigo: "sem-teste" };
  const linha = (derived?.testes?.manobras ?? []).find((m) => m.id === "concentracao");
  const tr = (derived?.testes?.resistencias ?? []).find((x) => x.value === "fortitude");
  const cd = Math.max(0, teste.cd - naoNegativo(reducaoCd));
  const rolagem = rolarTeste({
    rotulo: "Concentração", bonus: inteiro(linha?.executar ?? tr?.bonus) + inteiro(bonusExtra), dados: tr?.dadosExtras ?? [],
    modo, margem: tr?.margemCritico ?? 20, cd,
  }, rng);
  const r = resolveTesteDeConcentracao(registraRolagem(sessao, rolagem), derived, { rolagem, reducaoCd, opId });
  return { ...r, rolagem };
}

/** Uma condição da lista ativa encerra a concentração. Com a lista vazia (padrão) nada acontece. */
export function verificaCondicoesDeConcentracao(sessao, derived, { condicoes = CONDICOES_QUE_IMPEDEM_CONCENTRACAO, opId = null } = {}) {
  if (!concentracaoDe(sessao)) return { sessao, aplicado: false };
  const barrada = condicoes.find((c) => temCondicaoNaSessao(sessao, c));
  if (!barrada) return { sessao, aplicado: false };
  return perdeConcentracao(sessao, derived, `condicao:${barrada}`, { opId });
}
