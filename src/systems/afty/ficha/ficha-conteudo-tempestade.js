// Livro p.76. O primeiro efeito da Tempestade parte do acerto confirmado.
import { posturaAtivaConteudo } from "./ficha-conteudo-posturas";
import { usa } from "./ficha-uso";
import { comOperacao, jaAplicada, usoDe } from "./ficha-uso-estado";
import { defineCondicoes, registraRolagem } from "./ficha-sessao";
import { temCondicaoNaSessao } from "./ficha-acoes";
import { rolarTeste } from "./ficha-rolagem";
import { resolveTR } from "./ficha-ataque";
import { testeComConsequencias } from "./ficha-conteudo-acesso";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const mesmoTurno = (a, b) => !!a?.id && a.id === b?.id && a.rodada === b.rodada && a.turno === b.turno;
const chave = (id) => "tempestade:" + id;

export function acertosParaTempestade(sessao, derived, turnoEmCurso) {
  if (!posturaAtivaConteudo(sessao, derived, "tempestade") || turnoEmCurso?.rodada !== sessao.rodada) return [];
  return (sessao.log ?? []).filter((r) => r.ataque?.acertou === true && r.ataque.alvo?.id
    && r.tempestadeJaCaido === false && jaAplicada(sessao, "ataque-confirmado:" + r.ataqueId)
    && mesmoTurno(r.turnoEmCurso, turnoEmCurso) && r.turno === usoDe(sessao).acoes.turno);
}

export function rolaTempestade(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const acerto = acertosParaTempestade(sessao, derived, entrada.turnoEmCurso).find((a) => a.ataqueId === entrada.ataqueId && a.ataque.alvo.id === entrada.alvoId);
  if (!acerto || sessaoAlvo.vital?.estado === "morto") return recusa(sessao, "Falta Acerto Atual da Tempestade contra o Alvo");
  const id = chave(entrada.ataqueId);
  if (jaAplicada(sessao, id)) return recusa(sessao, "Fortitude deste Ataque Já Rolada");
  const fort = derivedAlvo.testes?.resistencias?.find((r) => r.value === "fortitude");
  const modo = entrada.modoAlvo ?? "normal";
  if (!fort || !Number.isFinite(derived.cd) || !["normal", "vantagem", "desvantagem"].includes(modo)) return recusa(sessao, "Fortitude ou CD Indisponível");
  const uso = usa(sessao, derived, { id, nome: "Postura da Tempestade", emCombate: true }, pedido);
  if (!uso.aplicado) return uso;
  const contexto = { tipo: "posturaTempestade", operacaoId: pedido.opId, ataqueId: acerto.ataqueId, alvoId: entrada.alvoId, cd: derived.cd };
  const rolagem = { ...rolarTeste({ rotulo: "Fortitude", detalhe: "Postura da Tempestade", bonus: fort.bonus, dados: fort.dadosExtras,
    margem: fort.margemCritico, minimoNatural: fort.minimoNatural, cd: derived.cd, modo,
    contextoConteudo: contexto, fontes: [...fort.partes, { label: "Postura da Tempestade", texto: "CD " + derived.cd }] }, entrada.rngAlvo), resistenciaId: "fortitude" };
  const registro = { id: pedido.opId + ":registro", ts: Date.now(), tipo: "info", rotulo: "Postura da Tempestade",
    detalhe: "Fortitude Pendente", contextoTempestade: contexto, testeId: rolagem.id };
  return { ...uso, rolagem, sessao: registraRolagem(comOperacao(uso.sessao, { id, tipo: "tempestade-tr" }), registro),
    sessaoAlvo: registraRolagem(sessaoAlvo, rolagem) };
}

export function aplicaTempestade(sessao, derived, sessaoAlvo, _derivedAlvo, entrada = {}, pedido = {}) {
  const acerto = acertosParaTempestade(sessao, derived, entrada.turnoEmCurso).find((a) => a.ataqueId === entrada.ataqueId && a.ataque.alvo.id === entrada.alvoId);
  if (!acerto || sessaoAlvo.vital?.estado === "morto") return recusa(sessao, "Falta Acerto Atual da Tempestade contra o Alvo");
  const pendente = sessao.log.find((r) => r.contextoTempestade?.ataqueId === acerto.ataqueId && r.contextoTempestade.alvoId === entrada.alvoId);
  const teste = pendente && sessaoAlvo.log.find((r) => r.id === pendente.testeId && r.resistenciaId === "fortitude"
    && r.contextoConteudo?.operacaoId === pendente.contextoTempestade.operacaoId);
  if (!teste || !jaAplicada(sessao, pendente.contextoTempestade.operacaoId) || !jaAplicada(sessao, chave(acerto.ataqueId))
    || teste.sorte?.escolha === null || testeComConsequencias(teste)) return recusa(sessao, "Falta Fortitude Atual ou Escolha de Sorte");
  const tr = resolveTR({ cd: pendente.contextoTempestade.cd, rolagem: teste });
  if (!tr.ok) return recusa(sessao, tr.erro);
  const uso = usa(sessao, derived, { id: chave(acerto.ataqueId) + ":resultado", nome: "Resultado da Tempestade", emCombate: true }, pedido);
  if (!uso.aplicado) return uso;
  const caiu = tr.resultado === "falha";
  const alvo = caiu && !temCondicaoNaSessao(sessaoAlvo, "Caído") ? defineCondicoes(sessaoAlvo, [...(sessaoAlvo.condicoes ?? []),
    { id: pedido.opId + ":caido", nome: "Caído", rodadas: null }]) : sessaoAlvo;
  const final = { id: pedido.opId + ":registro", ts: Date.now(), tipo: "info", rotulo: "Postura da Tempestade",
    detalhe: caiu ? "Alvo Caído" : "Fortitude Resistiu", testeId: teste.id, tr, caiu, ataqueId: acerto.ataqueId, alvoId: entrada.alvoId };
  const marcado = { ...alvo, log: alvo.log.map((r) => r.id === teste.id ? { ...r, consequenciasAplicadas: true } : r) };
  return { ...uso, tr, caiu, sessao: registraRolagem(uso.sessao, final), sessaoAlvo: registraRolagem(marcado, final) };
}
