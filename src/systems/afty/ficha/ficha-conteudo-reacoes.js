import { COMBATE_ESTADOS } from "../afty-combate";
import { bloqueioDeAcao } from "./ficha-acoes";
import { aptidaoDeConteudoDisponivel as temAptidao } from "./ficha-conteudo-acesso";
import { posturaAtivaConteudo } from "./ficha-conteudo-posturas";
import { rolarDados, rolarTeste } from "./ficha-rolagem";
import { prepararRolagem } from "./abas-g2/rolagem-g2";
import { energiaDaSessao, usa } from "./ficha-uso";
import { encerraAtivoNaSessao, usoDe } from "./ficha-uso-estado";

const COBRIR = "cobrir_se";
const LUA = "cmb_postura_da_lua";
const ESQUIVA = "lut_manobra_esquiva";
const APARAR_ATAQUE = "lut_aparar_ataque";
const estadoCobrir = COMBATE_ESTADOS.find((e) => e.id === "cobrirSePE");
const canonico = (id) => id.replace(/^.*__/, "");
const habilidade = (d, id) => d.habilidades?.efetivas?.find((h) => canonico(h) === id && !d.habilidades.inacessiveis?.includes(h));

function preparaApararAtaque(sessao, derived, linha) {
  return prepararRolagem({
    tipo: "teste", tipoTeste: "ataque", rotulo: "Aparar Ataque", linhaArma: linha,
    bonus: linha.acerto, dados: linha.acertoDados, margem: linha.margemCritico, fontes: linha.partesAcerto,
  }, { sessao, derived });
}

/** Livro p.53. A disputa exige uma jogada de ataque corpo a corpo disponível. */
export function armasParaApararAtaque(sessao, derived, categoria) {
  if (categoria !== "corpo" || !sessao.combate?.ativo || !habilidade(derived, APARAR_ATAQUE)
    || energiaDaSessao(sessao) < 1 || bloqueioDeAcao(sessao, derived, "reacao", { id: APARAR_ATAQUE })) return [];
  return (derived.dano?.entradas ?? []).filter((linha) => (linha.ataqueId ?? linha.categoria) === "corpo"
    && Number.isFinite(linha.acerto) && preparaApararAtaque(sessao, derived, linha).ok);
}

export function preparaDisputaDeAparar(sessao, derived, linha, { opId }) {
  const prova = preparaApararAtaque(sessao, derived, linha);
  if (!prova.ok) return { erro: "Ataque para Aparar Indisponível" };
  const uso = usa(sessao, derived, {
    id: APARAR_ATAQUE, nome: "Aparar Ataque", origem: APARAR_ATAQUE, acao: "reacao",
    emCombate: true, cobranca: "confirmada", custo: { pe: 1 },
  }, { opId, registraAcao: true });
  if (!uso.aplicado) return { erro: uso.erro ?? "Reação Indisponível" };
  return { sessao: uso.sessao, rolar: (totalDoAtacante, rng) => {
    const rolagem = rolarTeste(prova.pronta, rng);
    return { id: APARAR_ATAQUE, pe: 1, totalDoAtacante, rolagem, aparou: rolagem.total > totalDoAtacante };
  } };
}

/** Só uma entrada de dano corporal efetivo abre estas reações. */
export function reacoesAoDano(sessao, derived, { origemId, turnoEmCurso, categoria, danos, ignoraReducao }) {
  const tipos = danos.filter((d) => d.modo === "dano" && d.calculo.final > 0).map((d) => ({ tipo: d.tipo, valor: d.calculo.final }));
  if (!origemId || !turnoEmCurso?.id || !sessao.combate?.ativo || !tipos.length) return [];
  const opcoes = [];
  const lua = posturaAtivaConteudo(sessao, derived, "lua");
  if (lua && !ignoraReducao) opcoes.push({ id: "lua", usoId: LUA, nome: lua.nome, valor: derived.nd, tipos });
  const empolgacao = habilidade(derived, "lut_empolgacao");
  const { dadoEmpolgacaoQtd: qtd, dadoEmpolgacaoFaces: faces } = derived.combate;
  if (!ignoraReducao && categoria === "corpo" && empolgacao && qtd > 0 && faces > 0
    && derived.habilidades.escolhas?.mapa?.[empolgacao]?.some((id) => canonico(id) === ESQUIVA)) {
    opcoes.push({ id: "esquiva", usoId: ESQUIVA, nome: "Esquiva", dados: { qtd, faces }, valor: derived.mods.destreza, tipos });
  }
  if (turnoEmCurso.id === origemId && temAptidao(derived, COBRIR)) {
    const avancada = temAptidao(derived, "cobertura_avancada");
    const bonus = !avancada && habilidade(derived, "cnj_fisico_amaldicoado_defensivo") ? 2 : 0;
    const maxPe = Math.min(estadoCobrir.max(derived) + bonus, energiaDaSessao(sessao));
    if (maxPe >= 1) opcoes.push({ id: "cobrir", usoId: COBRIR, nome: "Cobrir-se", maxPe, valor: avancada ? 8 : 4 });
  }
  return opcoes.filter((r) => !bloqueioDeAcao(sessao, derived, "reacao", { id: r.usoId }));
}

function erroDaEscolha(opcao, escolha) {
  const pe = Number(escolha.pe ?? 0);
  if (opcao.maxPe ? !Number.isInteger(pe) || pe < 1 || pe > opcao.maxPe : pe !== 0) {
    return "PE Fora do Limite da Reação";
  }
  if (opcao.tipos && !opcao.tipos.some((d) => d.tipo === escolha.tipo)) return "Selecione o Tipo de Dano";
  return null;
}

function aplicaReacaoAoDano(sessao, derived, opcao, escolha, { origemId, opId, rng }) {
  const pe = Number(escolha.pe ?? 0);
  const pv = opcao.id === "cobrir" ? pe * opcao.valor : 0;
  const uso = usa(sessao, derived, {
    id: opcao.usoId, nome: opcao.nome, origem: opcao.usoId, acao: "reacao", emCombate: true, cobranca: "confirmada", custo: { pe },
    ...(pv ? {
      duracao: { ate: "cena" }, renova: true, efeitos: [{ tipo: "pvTemporario", id: opcao.nome, valor: pv }],
      parametros: [{ id: "fonteId", tipo: "opcao", opcoes: [origemId] }],
    } : {}),
  }, { opId, registraAcao: true, parametros: { fonteId: origemId } });
  if (!uso.aplicado) return { erro: uso.erro ?? "Reação Indisponível" };
  const dados = opcao.dados ? rolarDados(opcao.dados.qtd, opcao.dados.faces, rng) : [];
  const valor = Math.max(0, opcao.valor + dados.reduce((soma, dado) => soma + dado, 0));
  return { sessao: uso.sessao, reacao: { id: opcao.id, nome: opcao.nome, pe, ...(pv ? { pv } : { tipo: escolha.tipo, valor, dados }) } };
}

/** Consulta e valida a escolha antes de sortear ou escrever a reação e o dano. */
export function preparaReacaoAoDano(sessao, derived, contexto, escolha, identidade) {
  const opcoes = reacoesAoDano(sessao, derived, contexto);
  const chave = JSON.stringify([contexto.opId, contexto.origemId, contexto.turnoEmCurso, identidade,
    contexto.danos.map((d) => [d.tipo, d.calculo]), opcoes]);
  if (escolha && (!opcoes.length || escolha.chave !== chave)) {
    return { erro: "Janela de Reação Alterada. Confira o Ataque Novamente" };
  }
  if (!opcoes.length || escolha?.id === "passar") return {};
  if (!escolha) return { janelaReacao: { chave, opcoes } };
  const opcao = opcoes.find((o) => o.id === escolha.id);
  if (!opcao) return { erro: "Reação Indisponível" };
  const erro = erroDaEscolha(opcao, escolha);
  if (erro) return { erro };
  return { aplicar: () => aplicaReacaoAoDano(sessao, derived, opcao, escolha, contexto) };
}

/** A casca avulsa dura até o fim do turno da fonte, em vez do turno do defensor. */
export function encerraCobrirSe(combatentes, fonteId = null) {
  return combatentes.map((c) => {
    const ativo = c.sessao && usoDe(c.sessao).ativos[COBRIR];
    if (!ativo || (fonteId && ativo.parametros.fonteId !== fonteId)) return c;
    return { ...c, sessao: encerraAtivoNaSessao(c.sessao, COBRIR, "fimDoTurnoDaFonte") };
  });
}
