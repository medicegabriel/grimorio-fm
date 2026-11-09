// CX3: adaptadores de conteúdo sobre uso, pendências e ataque do CL1.
import { usa } from "./ficha-uso";
import { usoDoEstado } from "./ficha-uso-clientes";
import { usoDe, comUso, jaAplicada, comOperacao, encerraAtivoNaSessao } from "./ficha-uso-estado";
import { armaProximoAtaque, registraAtaqueRealizado, registraAtaqueRecebido } from "./ficha-combate-eventos";
import { resolveAtaque } from "./ficha-ataque";
import { aplicaDanoRecebido, preparaDanoRecebido } from "./ficha-dano-recebido";
import { encerraGuarda, registraRolagem, sofreGolpeNaGuarda } from "./ficha-sessao";
import { getAptidao } from "../afty-aptidoes";
import { aptidaoDeConteudoDisponivel as temAptidao, bloqueioDeOportunidadeConteudo, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { COMBATE_ESTADOS } from "../afty-combate";
import { recuperaSorte } from "./ficha-conteudo-uso";
import { rolarTeste } from "./ficha-rolagem";
import { prepararRolagem, motivoDaRecusa } from "./abas-g2/rolagem-g2";
import { estadoDaArma, modoCombinado, redirecionaRolagemArma } from "../afty-propriedades-armas";
import { alvoProvocadoValido, ataqueSobProvocacao, provocacoesAtivas } from "./ficha-conteudo-provocar";
import { drenaAuraAoMatar } from "./ficha-conteudo-aura-drenadora";
import { devastacaoContra } from "./ficha-conteudo-devastacao";
import { temCondicaoNaSessao } from "./ficha-acoes";
import { armasParaApararAtaque, preparaDisputaDeAparar, preparaReacaoAoDano } from "./ficha-conteudo-reacoes";
import { usaExpandirAura } from "./ficha-conteudo-expandir-aura";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const identidade = (s, p) => typeof p.opId !== "string" || !p.opId ? recusa(s, "Sem Identidade da Operação")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;
const talento = (d, id) => d.talentos?.escolhidas?.includes(id) && !d.talentos.inacessiveis?.includes(id);

export const armasParaAuraRedirecionadora = (d) => (d.dano?.entradas ?? []).filter((l) => l.fonte === "arma" && ["distancia", "arremesso"].includes(l.categoria));

/** p.177: o pagamento antecede a jogada normal da arma, sem outra ação. */
export function preparaAuraRedirecionadora(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!temAptidao(derived, "aura_redirecionadora")) return recusa(sessao, "Aura Redirecionadora Indisponível");
  const linha = armasParaAuraRedirecionadora(derived).find((l) => l.id === entrada.armaId && (l.chaveArma ?? null) === (entrada.chaveArma ?? null));
  if (!linha) return recusa(sessao, "Exige Projétil ou Ataque de Arremesso");
  const pedidoRolagem = { tipo: "teste", tipoTeste: "ataque", rotulo: `${linha.nome} · Acerto`, bonus: linha.acerto,
    dados: linha.acertoDados, margem: linha.margemCritico, linhaArma: linha, modo: entrada.modo ?? "normal", fontes: linha.partesAcerto,
    contextoConteudo: { tipo: "auraRedirecionadora", etapa: "inicial", operacaoId: pedido.opId,
      rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno, alvoId: entrada.alvoId || null,
      danoOriginal: { grupos: linha.gruposDano, rerrola: linha.rerrola, fontes: linha.partes } } };
  const prova = prepararRolagem(pedidoRolagem, { sessao, derived, modo: pedidoRolagem.modo });
  if (!prova.ok) return recusa(sessao, motivoDaRecusa(prova, pedidoRolagem));
  const uso = usa(sessao, derived, { id: "aura_redirecionadora", nome: "Aura Redirecionadora",
    acesso: impedimentoParaAgirConteudo,
    proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    custo: { pe: 2 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  return uso.aplicado ? { ...uso, pedidoRolagem } : uso;
}

/** A falha inicial permanece confirmada, com seus próprios eventos e destinatário. */
export function falhasParaAuraRedirecionadora(sessao) {
  return (sessao.log ?? []).filter((r) => {
    const c = r.contextoConteudo;
    return r.tipoTeste === "ataque" && c?.tipo === "auraRedirecionadora" && c.etapa === "inicial"
      && c.rodada === sessao.rodada && c.turno === usoDe(sessao).acoes.turno && !r.redirecionadaPor
      && jaAplicada(sessao, c.operacaoId)
      && sessao.log.some((a) => a.rotulo === "Ataque Confirmado" && a.ataqueId === r.id && a.ataque?.acertou === false && a.ataque.alvo?.id);
  });
}

export function rolaRedirecionamentoAura(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!temAptidao(derived, "aura_redirecionadora")) return recusa(sessao, "Aura Redirecionadora Indisponível");
  const anterior = falhasParaAuraRedirecionadora(sessao).find((r) => r.id === entrada.ataqueId);
  if (!anterior) return recusa(sessao, "Falta Falha Confirmada de Projétil Imbuído neste Turno");
  const confirmado = sessao.log.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === anterior.id);
  if (!entrada.alvoId || entrada.alvoId === confirmado.ataque.alvo.id || entrada.em6mDoPrimeiro !== true) return recusa(sessao, "Exige Outro Alvo em 6m do Primeiro");
  const emCurso = anterior.contextoTurno?.emCurso;
  if (emCurso && (emCurso.id !== entrada.turnoEmCurso?.id || emCurso.rodada !== entrada.turnoEmCurso?.rodada || emCurso.turno !== entrada.turnoEmCurso?.turno)) return recusa(sessao, "Turno do Ataque Já Encerrado");
  const linha = armasParaAuraRedirecionadora(derived).find((l) => l.id === anterior.armaId && (l.chaveArma ?? null) === (anterior.chaveArma ?? null));
  if (!linha || estadoDaArma(sessao.propriedadesArmas, linha).pendente?.id !== anterior.id || sessao.propriedadesArmas.ultimoAtaque !== anterior.id) return recusa(sessao, "Projétil Não É Mais o Ataque Pendente");
  const uso = usa(sessao, derived, { id: "aura_redirecionadora:segundaJogada", nome: "Redirecionar Projétil",
    acesso: impedimentoParaAgirConteudo,
    proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"] }, pedido);
  if (!uso.aplicado) return uso;
  const bonus = 1 + Math.floor(derived.aptidao.efetivo.au / 2);
  const ativas = provocacoesAtivas(sessao), modoBase = anterior.contextoConteudo.modoBaseProvocacao;
  const desc = ataqueSobProvocacao({ rotulo: anterior.rotulo, detalhe: "Aura Redirecionadora", tipoTeste: "ataque",
    bonus: anterior.bonus + bonus, dados: anterior.extras, modo: modoBase ?? anterior.modo, margem: anterior.margemCritico,
    minimoNatural: anterior.minimoNatural, linhaArma: linha, contextoTurno: anterior.contextoTurno,
    contextoConteudo: { ...anterior.contextoConteudo, etapa: "redirecionado", operacaoId: pedido.opId,
      ataqueOriginalId: anterior.id, primeiroAlvoId: confirmado.ataque.alvo.id, alvoId: entrada.alvoId, alvoProvocacao: null },
    fontes: [...(anterior.fontes ?? []).filter((f) => f.label !== "Provocar"), { label: "Aura Redirecionadora", valor: bonus }],
  }, ativas, entrada.alvoId);
  const modo = ativas.length || modoBase ? modoCombinado(desc.modo, {
    vantagem: desc.linhaArma.vantagemAtaque?.vantagem,
    desvantagem: desc.linhaArma.vantagemAtaque?.desvantagem || linha.armaPropriedades?.desvantagem,
  }) : desc.modo;
  const rolagem = rolarTeste({ ...desc, modo }, entrada.rng);
  const armada = redirecionaRolagemArma(uso.sessao, linha, anterior.id, rolagem);
  const marcada = { ...armada, log: armada.log.map((r) => r.id === anterior.id ? { ...r, redirecionadaPor: rolagem.id } : r) };
  return { ...uso, sessao: registraRolagem(marcada, rolagem), rolagem, bonus };
}

export function danoDoRedirecionamentoAura(sessao, derived) {
  const r = sessao.log?.find((r) => r.tipoTeste === "ataque");
  const c = r?.contextoConteudo;
  if (c?.tipo !== "auraRedirecionadora" || c.etapa !== "redirecionado" || c.rodada !== sessao.rodada
    || c.turno !== usoDe(sessao).acoes.turno || !jaAplicada(sessao, c.operacaoId) || r.sorte?.escolha === null
    || r.natural === 1 || r.sucesso === false || jaAplicada(sessao, `ataque-confirmado:${r.id}`)) return null;
  const linha = armasParaAuraRedirecionadora(derived).find((l) => l.id === r.armaId && (l.chaveArma ?? null) === (r.chaveArma ?? null));
  if (!linha || !c.danoOriginal?.grupos) return null;
  return { tipo: "dano", rotulo: linha.nome, ...c.danoOriginal, modoDano: r.critico ? "critico" : "normal", linhaArma: linha };
}

/** p.65. Consome o evento real, a confirmação externa conserva a identidade da operação. */
export function renovaEnergiaPorEvento(sessao, derived, { inimigo = false, acertou = false, critico = false, abateu = false } = {}) {
  const habilidade = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "cmb_renovacao_pelo_sangue"
    && !derived.habilidades.inacessiveis?.includes(id));
  const elegivel = inimigo === true && habilidade && ((acertou && critico) || abateu);
  const recuperado = elegivel ? Math.max(0, Math.min(1, derived.pe - sessao.peAtual)) : 0;
  return { sessao: recuperado ? { ...sessao, peAtual: sessao.peAtual + recuperado } : sessao, recuperado,
    fontes: elegivel ? [{ label: "Renovação pelo Sangue", valor: recuperado }] : null };
}

/** p.178/191. A ativação paga uma vez. O próximo acerto elegível encerra o uso. */
export function armaCanalizacao(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const reversa = entrada.reversa === true, maxima = !reversa && entrada.maxima === true;
  const id = reversa ? "canalizar_energia_reversa" : "canalizar_em_golpe";
  if (!temAptidao(derived, id) || (maxima && !temAptidao(derived, "canalizacao_maxima"))) return recusa(sessao, "Canalização Indisponível");
  if (entrada.reacao && (reversa || !temAptidao(derived, "canalizacao_avancada"))) return recusa(sessao, "Reação Indisponível");
  const estadoId = reversa ? "canalizarEnergiaReversa" : "canalizarEmGolpe";
  const outro = reversa ? "canalizarEmGolpe" : "canalizarEnergiaReversa";
  const estado = derived.combate?.estadosExtras?.find((e) => e.id === estadoId);
  if (!estado) return recusa(sessao, "Estado de Canalização Indisponível");
  // O seletor nativo já é exclusivo. Encerrar o uso também retira a pendência
  // antiga, para ela não consumir a canalização que acabou de entrar.
  let s = encerraAtivoNaSessao(sessao, outro, "substituido");
  s = comUso(s, (u) => ({ ...u, pendencias: u.pendencias.filter((p) => p.usoId !== outro) }));
  const pe = reversa ? 2 * derived.maestria : derived.aptidao.efetivo.cl + Number(maxima);
  const desc = usoDoEstado(estado, derived, {
    custo: { pe }, cobranca: entrada.descontarPE ? "confirmada" : "manual",
    acao: entrada.reacao ? "reacao" : "movimento", duracao: { ate: "descanso" },
    proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
  });
  desc.efeitos.push({ tipo: "estado", id: "canalizacaoMaxima", valor: maxima, desliga: false });
  const uso = usa(s, derived, desc, pedido);
  if (!uso.aplicado) return { ...uso, sessao };
  const armado = armaProximoAtaque(uso.sessao, { id: `canalizar:${pedido.opId}`, usoId: estadoId,
    nome: maxima ? "Canalização Máxima" : getAptidao(id).nome, estado: estadoId,
    elegivel: { qualquer: ["arma", "desarmado"], exceto: ["feitico"] },
    consome: "acerto" }, { opId: `${pedido.opId}:arma` });
  if (!armado.aplicado) return recusa(sessao, armado.erro);
  return { ...uso, sessao: armado.sessao };
}

/**
 * Confirma as rolagens nativas contra o alvo declarado. Não sorteia nem paga
 * outro ataque. A sequência e a concentração continuam nos verbos do CL1.
 * O dano misto segue o contrato vigente de instâncias tipadas do núcleo.
 */
/** p.164. O alvo é conhecido na confirmação, antes de comparar o acerto à Defesa. */
export function bonusSaltadorContra(sessao, derived, ataqueId, alvoId) {
  if (!alvoId || !talento(derived, "tal_saltador_constante")) return null;
  const indice = sessao.log?.findIndex((r) => r.id === ataqueId) ?? -1;
  if (indice < 0) return null;
  const pendencias = usoDe(sessao).pendencias;
  const ids = sessao.log.slice(indice + 1).filter((r) => r.consequenciasAplicadas && r.contextoPulo?.alvoId === alvoId)
    .map((r) => "saltador:" + r.id)
    .filter((id) => pendencias.some((p) => p.id === id && p.elegivel.contraAlvo === alvoId));
  return ids.length ? { ids, acerto: 2, dano: derived.mods.forca } : null;
}

/** Livro p.192 e p.307. Conserva o total da rolagem e o tipo de cada parcela. */
function reparteRaioNegro(dano, tipoBase, porTipo) {
  if (!dano.gruposRolados?.length) return "Raio Negro sem Recibo de Tipos";
  if (porTipo.size === 1) {
    porTipo.set(porTipo.keys().next().value, dano.total);
    return null;
  }
  const dadosPorTipo = new Map();
  for (const grupo of dano.gruposRolados) {
    const valor = grupo.subtotalRaioNegro;
    if (!Number.isSafeInteger(valor) || valor < 0) return "Raio Negro Misto sem Recibo dos Dados Critáveis";
    const tipo = grupo.tipoDano ?? tipoBase;
    dadosPorTipo.set(tipo, (dadosPorTipo.get(tipo) ?? 0) + valor);
  }
  for (const [tipo, dados] of dadosPorTipo) porTipo.set(tipo, porTipo.get(tipo) + Math.floor(dados / 2));
  const soma = [...porTipo.values()].reduce((n, valor) => n + valor, 0);
  return soma === dano.total ? null : "Raio Negro Misto com Resto Requer Resolução na Mesa";
}

export function confirmaAtaqueConteudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const r = sessao.log?.find((r) => r.id === entrada.ataqueId && r.tipoTeste === "ataque" && r.armaId);
  if (!r || r.sorte?.escolha === null) return recusa(sessao, "Ataque Indisponível ou Sorte Pendente");
  if (!alvoProvocadoValido(sessao, r, entrada.alvoId)) return recusa(sessao, "Ataque Sob Provocação Exige Alvo Antes da Rolagem");
  const contexto = r.contextoConteudo;
  if (contexto?.tipo === "auraRedirecionadora" && (!jaAplicada(sessao, contexto.operacaoId)
    || (contexto.alvoId && contexto.alvoId !== entrada.alvoId) || contexto.rodada !== sessao.rodada
    || contexto.turno !== usoDe(sessao).acoes.turno)) return recusa(sessao, "Ataque da Aura sem Uso Atual ou contra Outro Alvo");
  if (["golpeOportunidade", "reacaoSentinela"].includes(contexto?.tipo)
    && (!jaAplicada(sessao, contexto.operacaoId) || (contexto.alvoId && contexto.alvoId !== entrada.alvoId)
      || contexto.rodada !== sessao.rodada || contexto.turno !== usoDe(sessao).acoes.turno)) return recusa(sessao, "Ataque Reativo sem Uso Atual ou contra Outro Alvo");
  const bloqueio = contexto?.tipo === "golpeOportunidade" && bloqueioDeOportunidadeConteudo(sessaoAlvo, contexto.atacanteId);
  if (bloqueio) return recusa(sessao, bloqueio);
  const linha = derived.dano?.entradas?.find((l) => l.id === r.armaId && (l.chaveArma ?? null) === (r.chaveArma ?? null));
  if (!linha) return recusa(sessao, "Arma Indisponível");
  if (r.contextoConteudo?.tipo === "investida" && r.contextoConteudo.alvoId && r.contextoConteudo.alvoId !== entrada.alvoId) return recusa(sessao, "Alvo Diferente da Investida");
  // O Ataque Básico antigo publica o tipo no escopo do cálculo, mesmo com
  // tipoDano vazio. Reusar esse destino impede ignorar as defesas de Impacto.
  const tipoBase = linha.tipoDano ?? linha.escoposDano?.map((e) => /^atq_tipo:[^:]+:(.+)$/.exec(e)?.[1]).find(Boolean) ?? null;
  const eventoId = `ataque-confirmado:${r.id}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Ataque Já Confirmado");
  const embacada = temAptidao(derivedAlvo, "aura_embacada") && derivedAlvo.combate.auraEmbacada
    && !derivedAlvo.combate.concentrarAura?.includes("aura_embacada");
  const camuflagem = entrada.camuflagem || (embacada ? "leve" : null);
  if (camuflagem && (!Number.isInteger(Number(entrada.camuflagemD10)) || Number(entrada.camuflagemD10) < 1 || Number(entrada.camuflagemD10) > 10)) return recusa(sessao, "Falta o d10 da Camuflagem");
  const saltador = bonusSaltadorContra(sessao, derived, r.id, entrada.alvoId);
  const devastacao = devastacaoContra(sessao, derived, r, entrada.alvoId);
  const acertoAdicional = (saltador?.acerto ?? 0) + (devastacao?.acerto ?? 0);
  const rolagem = acertoAdicional ? { ...r, total: r.total + acertoAdicional } : r;
  const categoria = linha.ataqueId ?? (linha.categoria === "arremesso" ? "distancia" : linha.categoria);
  let resolvedor = resolveAtaque({ rolagem, margem: r.margemCritico, categoria,
    alvo: { defesa: derivedAlvo.defesa, cobertura: entrada.cobertura, camuflagem, flanqueado: entrada.flanqueado },
    camuflagemD10: entrada.camuflagemD10 });
  if (!resolvedor.ok || resolvedor.acertou == null) return recusa(sessao, resolvedor.erro ?? "Falta Resolver a Camuflagem");
  const mesa = entrada.mesa ?? {};
  const turnoDoAtaque = r.contextoTurno?.emCurso, turnoAtual = mesa.turnoEmCurso;
  const ataqueAtual = turnoDoAtaque?.id && turnoDoAtaque.id === turnoAtual?.id
    && turnoDoAtaque.rodada === turnoAtual.rodada && turnoDoAtaque.turno === turnoAtual.turno;
  const armas = ataqueAtual && mesa.origemId ? armasParaApararAtaque(sessaoAlvo, derivedAlvo, categoria) : [];
  const antesDoAcerto = entrada.janelaAntesDoAcerto;
  const armasParaEscolha = armas.map((a) => ({ chave: JSON.stringify([a.id, a.chaveArma ?? null]), nome: a.nome }));
  const chaveAntesDoAcerto = JSON.stringify([pedido.opId, mesa.origemId, turnoAtual, r.id, entrada.alvoId,
    entrada.danoId, entrada.inimigo, rolagem.total, resolvedor, armasParaEscolha]);
  if (antesDoAcerto && (!armas.length || antesDoAcerto.chave !== chaveAntesDoAcerto)) {
    return recusa(sessao, "Janela de Reação Alterada. Confira o Ataque Novamente");
  }
  if (armas.length && !antesDoAcerto) {
    return { sessao, aplicado: false, janelaReacao: { etapa: "ataque", chave: chaveAntesDoAcerto,
      opcoes: [{ id: "apararAtaque", nome: "Aparar Ataque", armas: armasParaEscolha }] } };
  }
  let armaParaAparar = null;
  if (antesDoAcerto && antesDoAcerto.id !== "passar") {
    const indice = armasParaEscolha.findIndex((a) => a.chave === antesDoAcerto.arma);
    if (antesDoAcerto.id !== "apararAtaque" || indice < 0) return recusa(sessao, "Ataque para Aparar Indisponível");
    armaParaAparar = armas[indice];
  }
  const dano = sessao.log?.find((x) => x.id === entrada.danoId && x.tipo === "dano" && x.tom !== "cura");
  if (resolvedor.acertou && (!dano || dano.armaId !== r.armaId || dano.chaveArma !== r.chaveArma || dano.ts < r.ts
    || (!dano.raioNegro && dano.critico !== resolvedor.critico))) return recusa(sessao, "Falta o Dano Correspondente ao Ataque");
  const raioNegro = resolvedor.acertou && dano.raioNegro === true;
  if (raioNegro && (categoria !== "corpo" || !temAptidao(derived, "raio_negro")
    || r.natural < (temAptidao(derived, "abencoado_pelas_faiscas_negras") ? 19 : 20))) {
    return recusa(sessao, "Ataque sem Gatilho Confirmado de Raio Negro");
  }
  if (resolvedor.acertou && jaAplicada(sessao, `dano-confirmado:${dano.id}`)) return recusa(sessao, "Dano Já Aplicado");
  const partes = resolvedor.acertou ? (dano.gruposRolados?.length ? dano.gruposRolados : [{ total: dano.total, tipoDano: linha.tipoDano }]) : [];
  if (partes.some((g) => g.tipoDano === "energia_reversa") && derivedAlvo.origemEstruturalId !== "maldicao") return recusa(sessao, "Canalização Reversa Exige Alvo Maldição");
  const porTipo = new Map();
  for (const g of partes) porTipo.set(g.tipoDano ?? tipoBase, (porTipo.get(g.tipoDano ?? tipoBase) ?? 0) + g.total);
  if (raioNegro) {
    const erro = reparteRaioNegro(dano, tipoBase, porTipo);
    if (erro) return recusa(sessao, erro);
  }
  if (resolvedor.acertou && saltador?.dano) porTipo.set(tipoBase, (porTipo.get(tipoBase) ?? 0) + saltador.dano);
  const danos = [];
  for (const [tipo, total] of porTipo) {
    const defesa = derivedAlvo.defesasDano.porTipo[tipo];
    const estados = defesa?.estados.filter((e) => !(e === "resistente" && (linha.removeResistencia || raioNegro)) && !(e === "imune" && linha.ignoraImunidade));
    const ajustado = defesa ? { ...derivedAlvo, defesasDano: { ...derivedAlvo.defesasDano,
      porTipo: { ...derivedAlvo.defesasDano.porTipo, [tipo]: { ...defesa, estados, conflito: estados.length > 1 } } } } : derivedAlvo;
    const parametros = { total, tipo, ataqueId: r.id, desempate: entrada.desempate,
      rdIgnorada: linha.ignoraTodaRD || raioNegro ? Number.MAX_SAFE_INTEGER : (linha.ignoraRD ?? 0) + (devastacao?.ignoraRD ?? 0) };
    const prova = preparaDanoRecebido(ajustado, parametros);
    if (!prova.ok) return recusa(sessao, prova.erro);
    danos.push({ ...prova, tipo, ajustado, parametros });
  }
  let alvo = sessaoAlvo, reacaoDano = null, reacaoAntesDoAcerto = null;
  const disputa = armaParaAparar && preparaDisputaDeAparar(alvo, derivedAlvo, armaParaAparar, { opId: `${pedido.opId}:aparar` });
  if (disputa && !disputa.sessao) return recusa(sessao, disputa.erro);
  // Se ainda houver uma reação, a escolha de dano é condicional ao acerto.
  // Nenhuma rolagem nem gasto se publica enquanto uma escolha estiver aberta.
  const defesa = preparaReacaoAoDano(disputa?.sessao ?? alvo, derivedAlvo, {
    ...mesa, turnoEmCurso: ataqueAtual ? turnoAtual : null, categoria, danos, ignoraReducao: raioNegro,
    opId: `${pedido.opId}:reacao`, rng: entrada.rngReacao,
  }, entrada.janelaReacao, [r.id, dano?.id, entrada.alvoId, entrada.inimigo, antesDoAcerto, resolvedor]);
  if (defesa.erro) return recusa(sessao, defesa.erro);
  if (defesa.janelaReacao) {
    return { sessao, aplicado: false, janelaReacao: { ...defesa.janelaReacao, condicional: !!disputa } };
  }
  if (disputa) {
    alvo = disputa.sessao;
    reacaoAntesDoAcerto = disputa.rolar(rolagem.total, entrada.rngReacao);
    if (reacaoAntesDoAcerto.aparou) {
      resolvedor = { ...resolvedor, acertou: false, critico: false, motivo: "aparado" };
      danos.length = 0;
    }
  }
  if (defesa.aplicar && resolvedor.acertou) {
    const reacao = defesa.aplicar();
    if (!reacao.sessao) return recusa(sessao, reacao.erro);
    alvo = reacao.sessao;
    reacaoDano = reacao.reacao;
  }
  const calculos = [], eventosAlvo = [];
  if (raioNegro && resolvedor.acertou) alvo = encerraGuarda(alvo);
  for (const { tipo, ajustado, parametros } of danos) {
    const reducaoReacao = reacaoDano && !reacaoDano.pv && reacaoDano.tipo === tipo ? reacaoDano : null;
    const aplicado = aplicaDanoRecebido(alvo, ajustado, { ...parametros, reducaoReacao }, { opId: `${pedido.opId}:dano:${tipo}` });
    if (!aplicado.aplicado) return recusa(sessao, aplicado.erro);
    alvo = aplicado.sessao; calculos.push({ ...aplicado.calculo, tipoDano: tipo });
    eventosAlvo.push(aplicado.evento);
  }
  const ataque = { ...resolvedor, categorias: [linha.fonte === "basico" ? "desarmado" : "arma", linha.categoria, ...(saltador?.ids ?? [])],
    alvo: { id: entrada.alvoId }, ...(raioNegro && resolvedor.acertou ? { raioNegro: true } : {}) };
  // A Guarda Infalível altera a oportunidade, sem alterar o 1 natural ou o erro.
  if (talento(derived, "tal_guarda_infalivel")) ataque.oportunidades = [];
  const feito = registraAtaqueRealizado(sessao, derived, ataque, { opId: `${pedido.opId}:feito` });
  const recebido = registraAtaqueRecebido(alvo, derivedAlvo, ataque, { opId: `${pedido.opId}:recebido` });
  if (!feito.aplicado || !recebido.aplicado) return recusa(sessao, feito.erro ?? recebido.erro ?? "Ataque Não Registrado");
  alvo = sofreGolpeNaGuarda(recebido.sessao, derivedAlvo);
  const sorte = recuperaSorte(alvo, derivedAlvo, { ataque: r, contraVoce: entrada.inimigo === true }, { opId: `${pedido.opId}:sorte` });
  if (sorte.aplicado) alvo = sorte.sessao;
  const sentinela = ataque.acertou && contexto?.tipo === "golpeOportunidade" && talento(derived, "tal_tecnicas_do_sentinela");
  if (sentinela) {
    const reducao = usa(alvo, derivedAlvo, { id: "tal_tecnicas_do_sentinela:movimento", nome: "Técnicas do Sentinela", renova: true,
      duracao: { ate: "fimDoTurno" }, efeitos: [{ tipo: "buff", canal: "movimento", expr: "-4.5" }] }, { opId: `${pedido.opId}:sentinela` });
    if (!reducao.aplicado) return recusa(sessao, reducao.erro);
    alvo = reducao.sessao;
  }
  const abateu = eventosAlvo.some((e) => e.abateu);
  const renovacao = renovaEnergiaPorEvento(feito.sessao, derived, { inimigo: entrada.inimigo, acertou: ataque.acertou, critico: ataque.critico, abateu });
  const dreno = drenaAuraAoMatar(renovacao.sessao, derived, sessaoAlvo, alvo, {
    inimigo: entrada.inimigo, ataqueId: r.id, alvoId: entrada.alvoId, rng: entrada.rngAuraDrenadora,
  });
  const energiaRecuperada = renovacao.recuperado;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Ataque Confirmado",
    rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno,
    ...(r.contextoTurno?.emCurso ? { turnoEmCurso: r.contextoTurno.emCurso } : {}),
    ...(r.contextoTurno?.posturaTempestade ? { tempestadeJaCaido: temCondicaoNaSessao(sessaoAlvo, "Caído") } : {}),
    detalhe: `${r.rotulo}: ${reacaoAntesDoAcerto?.aparou ? "Aparado" : ataque.acertou ? "Acertou" : "Errou"}${energiaRecuperada ? ` (+${energiaRecuperada} PE)` : ""}`, ataqueId: r.id, ataque, calculos,
    eventosAlvo, abateu, estadoVitalAlvo: alvo.vital?.estado ?? null,
    ...(reacaoAntesDoAcerto ? { reacaoAntesDoAcerto } : {}),
    ...(reacaoDano ? { reacaoDano } : {}),
    ...(sentinela ? { reducaoMovimento: 4.5, fontesSentinela: [{ label: "Técnicas do Sentinela", valor: -4.5 }] } : {}),
    ...(renovacao.fontes ? { energiaRecuperada, fontes: renovacao.fontes } : {}),
    ...(dreno.pv ? { pvTemporarioGanho: dreno.pv } : {}),
    ...(saltador || devastacao ? { totalAtaque: rolagem.total } : {}),
    ...(devastacao ? { devastacao: { ...devastacao, pilha: Math.min(devastacao.teto, devastacao.pilha + Number(ataque.acertou)) } } : {}),
    ...(saltador ? { fontesSaltador: [
      { label: "Saltador Constante", destino: "acerto", valor: saltador.acerto },
      ...(ataque.acertou ? [{ label: "Saltador Constante", destino: "dano", valor: saltador.dano }] : []),
    ] } : {}),
    consumidas: feito.consumidas, eventos: feito.eventos };
  let s = comOperacao(comOperacao(dreno.sessao, { id: eventoId, tipo: "ataque-confirmado" }), { id: pedido.opId, tipo: "ataque-confirmado" });
  if (resolvedor.acertou) s = comOperacao(s, { id: `dano-confirmado:${dano.id}`, tipo: "dano-confirmado" });
  return { sessao: registraRolagem(s, registro), sessaoAlvo: registraRolagem(alvo, registro), aplicado: true, ataque, calculos, energiaRecuperada };
}

export const canalizacaoArmada = (sessao) => usoDe(sessao).pendencias.some((p) => p.usoId === "canalizarEmGolpe" || p.usoId === "canalizarEnergiaReversa");

/** p.175/177/179. Cada efeito mantém seu estado e seu prazo do Livro. */
export function usaAptidaoPessoal(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!temAptidao(derived, entrada.id)) return recusa(sessao, "Aptidão Indisponível");
  if (entrada.id === "expandir_aura") return usaExpandirAura(sessao, derived, entrada, pedido);
  const nome = getAptidao(entrada.id).nome;
  const comum = { nome, emCombate: true, cobranca: entrada.descontarPE ? "confirmada" : "manual" };
  const estadoDe = (id) => derived.combate.estadosExtras.find((e) => e.id === id) ?? COMBATE_ESTADOS.find((e) => e.id === id);
  let desc = null, resultado = null;
  if (entrada.id === "aura_impenetravel") desc = usoDoEstado(estadoDe("auraImpenetravel"), derived, {
    ...comum, acao: "bonus", custo: { pe: 3 }, duracao: { rodadas: 1 },
  });
  if (entrada.id === "aura_excessiva" && entrada.inicioRodada === true) desc = usoDoEstado(estadoDe("auraExcessiva"), derived, {
    ...comum, custo: { pe: 2 }, duracao: { rodadas: 1 }, limite: { por: "rodada" },
  });
  if (entrada.id === "aura_embacada") desc = usoDoEstado(estadoDe("auraEmbacada"), derived, {
    ...comum, acao: "bonus", custo: { pe: 2 }, duracao: { manutencao: { pe: 2 } },
  });
  if (entrada.id === "estimulo_muscular") {
    const avancado = temAptidao(derived, "estimulo_muscular_avancado"), modo = entrada.modo;
    const cl = derived.aptidao.efetivo.cl, pe = Number(entrada.pe ?? 1);
    let efeitos = [], duracao = null;
    if (!["teste", "movimento", "empurrao", "pulo"].includes(modo)) return recusa(sessao, "Estímulo Inválido");
    if (modo === "teste") {
      if (!Number.isInteger(pe) || pe < 1 || pe > cl) return recusa(sessao, "PE Fora do Limite de Controle e Leitura");
      efeitos = [{ tipo: "estado", id: "estimuloTeste", valor: pe, estado: estadoDe("estimuloTeste"), desliga: 0 }];
      duracao = { ate: "inicioDoProximoTurno" };
    } else if (modo === "movimento") {
      if (![1, ...(avancado ? [2] : [])].includes(pe)) return recusa(sessao, "Custo do Movimento Inválido");
      resultado = { valor: derived.movimento * (pe === 2 ? 2 : 1.5), unidade: "m", label: "Movimento" };
    } else if (modo === "empurrao") {
      if (pe !== 2) return recusa(sessao, "Empurrão Custa 2 PE");
      resultado = { valor: cl * (avancado ? 3 : 1.5), unidade: "m", label: "Distância Adicional" };
    } else {
      if (pe !== 1) return recusa(sessao, "Pulo Custa 1 PE");
      resultado = { valor: 2, unidade: "×", label: "Pulo" };
    }
    desc = { ...comum, id: `estimulo:${modo}`, custo: { pe }, limite: { por: "rodada", max: avancado ? 2 : 1 },
      renova: true, efeitos, ...(duracao ? { duracao } : {}) };
  }
  if (!desc) return recusa(sessao, "Uso ou Gatilho Indisponível");
  const r = usa(sessao, derived, desc, pedido);
  if (!r.aplicado) return r;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: nome,
    detalhe: resultado ? `${resultado.label}: ${resultado.valor}${resultado.unidade}` : "Ativo", resultado,
    fontes: [{ label: nome, texto: entrada.modo ?? "Ativação" }], custo: r.custo };
  return { ...r, resultado, sessao: registraRolagem(r.sessao, registro) };
}
