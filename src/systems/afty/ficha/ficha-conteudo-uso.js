// CX3: clientes de conteúdo. Uso, recursos, condições e ferimentos continuam nos núcleos existentes.
import { usa, encerraUso } from "./ficha-uso";
import { jaAplicada, comOperacao, usoDe } from "./ficha-uso-estado";
import { rolarTeste, rolarDano, rolarDados } from "./ficha-rolagem";
import { aplicaCura, registraRolagem, defineCondicoes, marcaUso, ajustaExaustaoTecnica, usosGastosDe } from "./ficha-sessao";
import { aplicaDanoRecebido } from "./ficha-dano-recebido";
import { recuperaFerimento } from "./ficha-morte";
import { curaNoGasto, preparaRolagemCura } from "../afty-cura";
import { faixaDeSangramento } from "../afty-condicoes";
import { usarEfeitoEspecializacao, recursosDeEspecializacao } from "./ficha-especializacoes";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { abreTesteDeConcentracao } from "./ficha-concentracao";
import { gastaDadosDeVida, resumoDadosDeVida } from "./ficha-dados-vida";
import { aptidaoDeConteudoDisponivel as temAptidao, testeComConsequencias, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { posturasDepoisDeEmpurrar } from "./ficha-conteudo-posturas";
import { aplicaCuraIndividual, concluiCuraComMedicina, usosMedicinaInfalivel } from "./ficha-conteudo-medicina";

const inteiro = (n) => Math.max(0, Math.floor(Number(n) || 0));
const recusa = (sessao, erro, codigo = "conteudo-indisponivel") => ({ sessao, aplicado: false, erro, codigo });
const temTalento = (d, id) => d.talentos?.escolhidas?.includes(id) && !d.talentos?.inacessiveis?.includes(id);
const proibidoCom = ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"];
const identifica = (s, p) => typeof p.opId !== "string" || !p.opId ? recusa(s, "Sem Identidade da Operação", "sem-opid")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;
const atualizaRolagem = (s, id, r) => ({ ...s, log: s.log.map((l) => l.id === id ? r : l) });
export const recursoDeCuraConteudo = (id, d) => d.usosHabilidades?.[{
  cura_revigorar: "cmb_revigorar", cura_puxar_um_ar: "lut_puxar_um_ar",
}[id]] ?? d.mesa?.[`talento:${id}`]?.usos
  ?? { chave: `cura:${id}`, max: d.cura?.linhas?.find((l) => l.id === id)?.usos ?? 0 };

const rolaCura = (linha, cura, derived, rng, detalharDados = false) => rolarDano(preparaRolagemCura({ tipo: "dano", rotulo: linha.nome,
  fonteCuraId: linha.id, tom: "cura", grupos: cura.grupos, dados: cura.dados, faces: Number(linha.dado.slice(1)), fixo: cura.fixo,
  ...(detalharDados ? { detalharDados, fontes: cura.partes } : {}) }, derived.efeitos), rng);

const FLUXO_INICIO = "fluxo:inicioTurno";
const FLUXO_REACAO = "fluxo:reacao";

function erroFluxo(sessao, derived, entrada) {
  const inicio = entrada.inicioTurno === true, dano = entrada.reduziuVida === true;
  if (!temAptidao(derived, "fluxo_constante") || inicio === dano) return "Fluxo Constante Exige um Gatilho";
  if (inicio && entrada.emSeuTurno === false) return "Fluxo Constante Exige o Início do Seu Turno";
  if (dano && usosGastosDe(sessao, "turno:uso:" + FLUXO_INICIO)) return "Fluxo Já Usado no Início do Seu Turno";
  return null;
}

/** Segundo efeito de Suporte, p.102/165, e curas nativas por ponto. Não concede o primeiro efeito ao Adepto. */
export function usaCuraConteudo(sessao, derived, entrada = {}, pedido = {}, alvo = null) {
  const g = identifica(sessao, pedido); if (g) return g;
  const linha = derived.cura?.linhas?.find((l) => l.id === entrada.id);
  if (!linha || sessao.vital?.estado === "morto") return recusa(sessao, "Cura Indisponível");
  if (linha.grupo === "talento" && !temTalento(derived, linha.id)) return recusa(sessao, "Talento Indisponível");
  if (entrada.id === "cura_ainda_de_pe") return recusa(sessao, "Use Ainda de Pé");
  if (["cura_insistencia", "cura_descarga_reanimadora", "cura_criar_medicina", "cura_invocacao_as"].includes(entrada.id)) return recusa(sessao, "Uso Condicional da Habilidade");
  const sa = alvo?.sessao ?? sessao, da = alvo?.derived ?? derived;
  if (sa.vital?.estado === "morto") return recusa(sessao, "Corpo Morto");
  if (alvo && linha.alcance === "Você") return recusa(sessao, "Cura Apenas em Você");
  const blocos = Number(entrada.blocos ?? 1);
  if (!Number.isInteger(blocos) || blocos < 1 || blocos > (linha.unidade ? linha.blocos : 1)) return recusa(sessao, "Gasto Fora do Limite");
  const reversa = linha.unidade?.rotulo === "PER";
  if (entrada.fluxo) {
    if (!reversa || alvo) return recusa(sessao, "Fluxo Constante Exige Cura Própria de Energia Reversa");
    const erro = erroFluxo(sessao, derived, entrada);
    if (erro) return recusa(sessao, erro);
  }
  if (reversa && da.origemEstruturalId === "maldicao") return recusa(sessao, "Energia Reversa Não Cura Maldições");
  const cura = curaNoGasto(linha, blocos);
  const pe = cura.pontos * (reversa ? 2 : 1);
  const aguardar = entrada.aguardarMedicina === true;
  if (aguardar && ((entrada.emSeuTurno === false && !(entrada.fluxo && entrada.reduziuVida))
    || !usosMedicinaInfalivel(sessao, derived).restantes || !(cura.grupos ?? [cura]).some((g) => g.dados > 0))) {
    return recusa(sessao, "Medicina Infalível Indisponível para esta Cura");
  }
  if (aguardar && alvo && (typeof entrada.alvoId !== "string" || !entrada.alvoId)) return recusa(sessao, "Falta Alvo da Cura");
  const idUso = entrada.fluxo ? (entrada.inicioTurno ? FLUXO_INICIO : FLUXO_REACAO) : `cura:${linha.id}`;
  const r = usa(sessao, derived, { id: idUso, nome: linha.nome, proibidoCom,
    acao: entrada.fluxo ? entrada.inicioTurno ? "livre" : "reacao" : ["tal_adepto_de_medicina", "cura_suporte_em_combate", "cura_revigorar", "cura_puxar_um_ar"].includes(linha.id) ? "bonus" : "comum",
    ...(entrada.fluxo && entrada.inicioTurno ? { limite: { por: "turno" } } : {}),
    ...(linha.usos != null ? { usos: recursoDeCuraConteudo(linha.id, derived) } : {}),
    ...(aguardar ? { duracao: { ate: sessao.combate?.ativo ? "fimDoTurno" : "descanso" },
      parametros: [{ id: "operacaoId", tipo: "opcao", opcoes: [pedido.opId], padrao: pedido.opId }] } : {}),
    custo: { pe }, cobranca: "confirmada" }, pedido);
  if (!r.aplicado) return r;
  const dados = rolaCura(linha, cura, derived, entrada.rng, aguardar);
  const contexto = { operacaoId: pedido.opId, fonteId: linha.id, reversa, alvoId: alvo ? entrada.alvoId ?? null : null,
    aliado: !!alvo && entrada.aliado === true && typeof entrada.alvoId === "string" && !!entrada.alvoId,
    rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno, emCurso: entrada.turnoEmCurso ?? null };
  if (!aguardar) return { ...r, ...aplicaCuraIndividual(r.sessao, { sessao: sa, derived: da }, dados, contexto, !!alvo) };
  const rolagem = { ...dados, contextoCura: { ...contexto, tipo: "medicinaPendente", ativoId: idUso } };
  return { ...r, rolagem, sessao: registraRolagem(r.sessao, rolagem), ...(alvo ? { sessaoAlvo: sa } : {}) };
}

export function alcanceCuraEmGrupo(derived) {
  const er = derived.aptidao?.efetivo?.er ?? 0;
  return { valor: 4.5 + 1.5 * er, partes: [{ label: "Cura em Grupo", valor: 4.5 }, { label: "Nível de Aptidão em Energia Reversa", valor: 1.5 * er }] };
}

function erroGrupo(ids, alvos) {
  if (!Array.isArray(ids) || !Array.isArray(alvos) || ids.length === 0 || ids.length !== alvos.length || new Set(ids).size !== ids.length
    || ids.some((id) => typeof id !== "string" || !id || !alvos.some((a) => a.id === id && a.sessao && a.derived))) return "Destinatários Indisponíveis";
  if (alvos.some((a) => a.sessao.vital?.estado === "morto")) return "Corpo Morto no Grupo";
  if (alvos.some((a) => a.derived.origemEstruturalId === "maldicao")) return "Energia Reversa Não Cura Maldições";
  return null;
}

/** Livro p.191. A mesma rolagem de Energia Reversa é dividida na mesa. */
export function rolaCuraEmGrupo(sessao, derived, alvos, entrada = {}, pedido = {}) {
  const guard = identifica(sessao, pedido); if (guard) return guard;
  const linha = derived.cura?.linhas?.find((l) => l.id === "cura_energia_reversa");
  if (!linha || !temAptidao(derived, "cura_em_grupo")) return recusa(sessao, "Cura em Grupo Indisponível");
  const { turnoEmCurso, voceId, alvoIds, blocos, todosEmAlcance } = entrada;
  if (!voceId || turnoEmCurso?.id !== voceId || turnoEmCurso.rodada !== sessao.rodada) return recusa(sessao, "Cura em Grupo Exige Seu Turno");
  if (todosEmAlcance !== true) return recusa(sessao, "Confirme os Destinatários no Alcance");
  const erro = erroGrupo(alvoIds, alvos); if (erro) return recusa(sessao, erro);
  if (!Number.isInteger(blocos) || blocos < 1 || blocos > linha.blocos) return recusa(sessao, "Gasto Fora do Limite");
  const cura = curaNoGasto(linha, blocos);
  const uso = usa(sessao, derived, { id: `cura:${linha.id}`, origem: "cura_em_grupo", nome: "Cura em Grupo", proibidoCom,
    acesso: impedimentoParaAgirConteudo, acao: "comum", custo: { pe: 2 * cura.pontos }, cobranca: "confirmada" }, { ...pedido, registraAcao: true });
  if (!uso.aplicado) return uso;
  const rolagem = { ...rolaCura(linha, cura, derived, entrada.rng), rotulo: "Cura em Grupo", contextoCuraGrupo: {
    operacaoId: pedido.opId, alvoIds: [...alvoIds], voceId, turnoEmCurso, alcance: alcanceCuraEmGrupo(derived).valor,
  } };
  return { ...uso, rolagem, sessao: registraRolagem(uso.sessao, rolagem) };
}

export function curasEmGrupoPendentes(sessao, turnoEmCurso) {
  return (sessao.log ?? []).filter((r) => {
    const ctx = r.contextoCuraGrupo;
    return ctx?.turnoEmCurso && !r.consequenciasAplicadas && r.tom === "cura" && jaAplicada(sessao, ctx.operacaoId)
      && ctx.turnoEmCurso.id === turnoEmCurso?.id && ctx.turnoEmCurso.turno === turnoEmCurso.turno
      && ctx.turnoEmCurso.rodada === turnoEmCurso.rodada && sessao.rodada === turnoEmCurso.rodada;
  });
}

/** As parcelas informadas conservam o total antes da defesa de Herança e do teto de PV. */
export function aplicaCuraEmGrupo(sessao, alvos, entrada = {}, pedido = {}) {
  const guard = identifica(sessao, pedido); if (guard) return guard;
  const cura = curasEmGrupoPendentes(sessao, entrada.turnoEmCurso).find((r) => r.id === entrada.curaId);
  if (!cura || cura.contextoCuraGrupo.voceId !== entrada.voceId) return recusa(sessao, "Falta Cura em Grupo Pendente neste Turno");
  const { alvoIds, voceId } = cura.contextoCuraGrupo;
  const erro = erroGrupo(alvoIds, alvos); if (erro) return recusa(sessao, erro);
  const parcelas = alvoIds.map((id) => entrada.parcelas?.[id]);
  if (parcelas.some((n) => !Number.isInteger(n) || n < 0) || parcelas.reduce((a, b) => a + b, 0) !== Math.max(0, cura.total)) return recusa(sessao, "As Parcelas Devem Somar o Total da Cura");
  let origem = sessao;
  const sessoesAlvo = Object.create(null), distribuicao = [];
  for (const a of alvos) {
    const antes = a.id === voceId ? origem : a.sessao;
    const parcela = entrada.parcelas[a.id];
    const valor = a.derived.origensUso?.heranca ? Math.floor(parcela / 2) : parcela;
    const curado = valor > 0 ? aplicaCura(antes, valor, a.derived.hp) : antes;
    const efeito = { id: a.id, parcela, valor, recuperado: curado.hpAtual - antes.hpAtual };
    distribuicao.push(efeito);
    if (a.id === voceId) origem = curado;
    else sessoesAlvo[a.id] = registraRolagem(curado, { id: `${pedido.opId}:${a.id}`, ts: Date.now(), tipo: "info", rotulo: "Cura em Grupo",
      detalhe: `Cura: ${valor}`, curaId: cura.id, alvoId: a.id, parcela, valor, recuperado: efeito.recuperado, fontes: [{ label: "Cura em Grupo", valor: parcela },
        ...(a.derived.origensUso?.heranca ? [{ label: "Herança Maldita", texto: "Metade" }] : [])] });
  }
  origem = comOperacao(atualizaRolagem(origem, cura.id, { ...cura, consequenciasAplicadas: true, distribuicao }), { id: pedido.opId, tipo: "cura-em-grupo" });
  return { aplicado: true, sessao: origem, sessoesAlvo, distribuicao };
}

/** p.107, decisões de 06/11: metade anterior ao teto de PV e sem outra ação. */
export function curasParaSintonizar(sessao, turnoEmCurso = null) {
  return (sessao.log ?? []).filter((r) => {
    const c = r.contextoCura;
    return r.tom === "cura" && r.consequenciasAplicadas && c?.tipo === "curaAplicada" && c.aliado
      && c.alvoId && Number.isFinite(c.valor) && c.valor > 0 && !r.sintonizacaoVital
      && c.rodada === sessao.rodada && c.turno === usoDe(sessao).acoes.turno
      && (!c.emCurso || (c.emCurso.id === turnoEmCurso?.id && c.emCurso.turno === turnoEmCurso?.turno && c.emCurso.rodada === turnoEmCurso?.rodada))
      && jaAplicada(sessao, c.operacaoId);
  });
}

export function usaSintonizacaoVital(sessao, derived, entrada = {}, pedido = {}, alvo = null) {
  const guard = identifica(sessao, pedido); if (guard) return guard;
  const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "sup_sintonizacao_vital"
    && !derived.habilidades.inacessiveis?.includes(id));
  if (!real) return recusa(sessao, "Sintonização Vital Indisponível");
  const original = curasParaSintonizar(sessao, entrada.turnoEmCurso).find((r) => r.id === entrada.curaId);
  if (!original) return recusa(sessao, "Falta Cura Aplicada a um Aliado neste Turno");
  const alvoId = alvo ? entrada.alvoId : null;
  if ((alvo && (typeof alvoId !== "string" || !alvoId)) || alvoId === original.contextoCura.alvoId) return recusa(sessao, "Escolha Outra Criatura");
  if (entrada.emAlcance !== true) return recusa(sessao, "Destinatário Fora de 3m");
  if ((alvo?.sessao ?? sessao).vital?.estado === "morto") return recusa(sessao, "Corpo Morto");
  const uso = usa(sessao, derived, { id: real, nome: "Sintonização Vital", proibidoCom,
    acesso: impedimentoParaAgirConteudo,
    custo: { pe: 3 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  if (!uso.aplicado) return uso;
  const valor = Math.floor(original.contextoCura.valor / 2), sa = alvo?.sessao ?? uso.sessao, da = alvo?.derived ?? derived;
  const curado = aplicaCura(sa, valor, da.hp);
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Sintonização Vital",
    detalhe: `Cura: ${valor}`, curaId: original.id, cura: valor, recuperado: curado.hpAtual - sa.hpAtual, alvoId,
    fontes: [{ label: original.rotulo, valor: original.contextoCura.valor }, { label: "Sintonização Vital", texto: "Metade da Cura" }] };
  const marcada = { ...uso.sessao, log: uso.sessao.log.map((r) => r.id === original.id ? { ...r, sintonizacaoVital: { operacaoId: pedido.opId, alvoId, valor } } : r) };
  const destino = registraRolagem(alvo ? curado : { ...curado, log: marcada.log }, registro);
  return { ...uso, cura: valor, registro, sessao: alvo ? registraRolagem(marcada, registro) : destino,
    ...(alvo ? { sessaoAlvo: destino } : {}) };
}

/** Livro p.308: aplica somente o efeito adicional do crítico, não cobra/aplica novamente o ataque principal. */
export function aplicaCriticoDeGrupo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const ataque = sessao.log?.find((l) => l.id === entrada.ataqueId);
  const linha = derived.dano?.entradas?.find((l) => l.id === ataque?.armaId && (l.chaveArma ?? null) === (ataque.chaveArma ?? null));
  const efeito = linha?.efeitoCritico;
  if (!efeito || ataque?.tipoTeste !== "ataque" || !ataque.critico || ataque.sucesso === false) return recusa(sessao, "Falta o Crítico da Arma");
  if (entrada.acertou !== true) return recusa(sessao, "Confirme o Acerto");
  const eventoId = `critico-grupo:${ataque.id}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Crítico Já Aplicado", "evento-repetido");
  if (efeito.superficie && entrada.superficie !== true) return recusa(sessao, "Alvo Precisa Estar Adjacente à Superfície");
  let alvo = sessaoAlvo, rolagem = null, deslocamento = null;
  if (efeito.secundario) {
    const dano = sessao.log?.find((l) => l.id === entrada.danoId);
    if (!entrada.adjacente || !dano?.critico || dano.armaId !== linha.id || dano.chaveArma !== ataque.chaveArma) return recusa(sessao, "Falta Dano Crítico e Alvo Adjacente");
    if (derivedAlvo.defesa >= ataque.total) return recusa(sessao, "Defesa Não é Menor que o Crítico");
    const aplicado = aplicaDanoRecebido(alvo, derivedAlvo, { total: Math.floor(dano.total / 2), tipo: linha.tipoDano, ataqueId: ataque.id }, { opId: `${pedido.opId}:machado` });
    if (!aplicado.aplicado) return recusa(sessao, aplicado.erro ?? "Dano Não Aplicado");
    alvo = aplicado.sessao;
  } else if (efeito.deslocamento) {
    deslocamento = Number(entrada.distancia ?? efeito.deslocamento);
    if (!Number.isFinite(deslocamento) || deslocamento < 0 || deslocamento > efeito.deslocamento) return recusa(sessao, "Distância Fora do Limite");
    if (efeito.grupo === "haste" && deslocamento !== 3) return recusa(sessao, "Haste Move 3m");
    if (deslocamento > 0 && recursosDeEspecializacao(sessaoAlvo, derivedAlvo).imuneMovimentoForcado) return recusa(sessao, "Alvo Imune a Movimento Forçado");
    if (deslocamento > 0) {
      if (efeito.grupo === "bastao") alvo = posturasDepoisDeEmpurrar(alvo, derivedAlvo);
      alvo = abreTesteDeConcentracao(alvo, efeito.grupo === "bastao" ? "empurrado" : "movido",
        { distancia: deslocamento, bonus: derived.testes.pericias.find((p) => p.id === "atletismo")?.bonus ?? 0 },
        { opId: `${pedido.opId}:concentracao` }).sessao;
    }
  } else {
    if (efeito.tr) {
      const tr = derivedAlvo.testes?.resistencias?.find((l) => l.value === efeito.tr);
      if (!tr) return recusa(sessao, "Teste do Alvo Indisponível");
      rolagem = { ...rolarTeste({ rotulo: tr.label, detalhe: `Crítico de ${linha.nome}`, bonus: tr.bonus,
        dados: tr.dadosExtras, margem: tr.margemCritico, cd: efeito.cd }, entrada.rng), consequenciasAplicadas: true };
      alvo = registraRolagem(alvo, rolagem);
    }
    if (!rolagem || !rolagem.sucesso) {
      const condicao = { id: eventoId, nome: efeito.condicao ?? "Sangramento", rodadas: efeito.rodadas ?? null,
        ...(efeito.sangramento ? { sangramento: { origem: "criticoArma", dados: efeito.dados, faces: efeito.faces, cd: efeito.cd } } : {}) };
      alvo = defineCondicoes(alvo, [...(alvo.condicoes ?? []), condicao]);
    }
  }
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: `Crítico de ${linha.nome}`,
    detalhe: deslocamento != null ? `Movido ${deslocamento}m` : rolagem?.sucesso ? "Resistiu" : efeito.condicao ?? "Sangramento", fontes: efeito.fontes };
  const s = comOperacao(comOperacao(registraRolagem(sessao, registro), { id: eventoId, tipo: "critico-grupo" }), { id: pedido.opId, tipo: "critico-grupo" });
  return { sessao: s, sessaoAlvo: registraRolagem(alvo, registro), aplicado: true, rolagem, deslocamento };
}

export function testaSangramentoCritico(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const condicao = sessao.condicoes?.find((c) => c.id === entrada.id && c.nome === "Sangramento");
  const sangramento = faixaDeSangramento(condicao?.sangramento);
  if (!sangramento?.cd || !entrada.fimTurno) return recusa(sessao, "Falta o Sangramento ou Fim do Turno");
  const tr = derived.testes.resistencias.find((r) => r.value === "fortitude");
  const r = usa(sessao, derived, { id: `tr:${condicao.id}`, nome: "Sangramento", limite: { por: "turno" } }, pedido);
  if (!r.aplicado) return r;
  const rolagem = { ...rolarTeste({ rotulo: "Fortitude", detalhe: "Sangramento", bonus: tr.bonus, dados: tr.dadosExtras, margem: tr.margemCritico, cd: sangramento.cd }, entrada.rng), consequenciasAplicadas: true };
  const s = rolagem.sucesso ? defineCondicoes(r.sessao, r.sessao.condicoes.filter((c) => c.id !== entrada.id)) : r.sessao;
  return { ...r, sessao: registraRolagem(s, rolagem), rolagem };
}

/** Os venenos de CX5 têm uso ativo próprio. Marcações antigas avulsas continuam disponíveis. */
export function venenosParaRegenerar(sessao) {
  const ativos = Object.values(usoDe(sessao).ativos).filter((a) => a.id.startsWith("veneno:"));
  const ligados = ativos.map((a) => ({ id: a.id, nome: a.nome,
    condicoes: Array.isArray(a.parametros?.condicoes) ? a.parametros.condicoes : [] }));
  const envenenadoLigado = ligados.some((a) => a.condicoes.includes("Envenenado"));
  return [...ligados, ...(envenenadoLigado ? [] : (sessao.condicoes ?? []).flatMap((c, indice) =>
    (typeof c === "string" ? c : c.nome) === "Envenenado"
      ? [{ id: `condicao:${c.id ?? `@${indice}`}`, nome: "Envenenado", condicaoId: c.id ?? null, indice }] : []))];
}

/** p.190/342. Decisão do autor em 03/11: cada Aptidão segue o próprio custo, sem teto da cura. */
export function regeneraFerimento(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  if (!temAptidao(derived, "regeneracao_aprimorada") || sessao.vital?.estado === "morto") return recusa(sessao, "Regeneração Aprimorada Indisponível");
  const modo = entrada.modo ?? "regenerar", treino = inteiro(derived.conteudoTreinos?.energiaReversa);
  if (entrada.fluxo && (modo !== "regenerar" || entrada.livre)) return recusa(sessao, "Fluxo Constante Regenera pelo Custo Normal");
  const er = derived.aptidao?.efetivo?.er ?? 0;
  let per = 0, acao = "comum", s = sessao, recuperados = [], veneno = null;
  if (modo === "exaustao") {
    const turnos = Number(entrada.turnos ?? 1);
    if (treino < 4 || !(sessao.exaustaoTecnica?.restantes > 0) || !entrada.aposDominio
      || !Number.isInteger(turnos) || turnos < 1 || turnos > sessao.exaustaoTecnica.restantes) return recusa(sessao, "Exaustão de Domínio Indisponível");
    per = 2 * turnos;
  } else if (modo === "veneno") {
    const venenos = venenosParaRegenerar(sessao);
    veneno = entrada.venenoId ? venenos.find((v) => v.id === entrada.venenoId) : venenos.length === 1 ? venenos[0] : null;
    if (!veneno) return recusa(sessao, venenos.length ? "Selecione o Veneno" : "Sem Veneno");
    per = 4; acao = "bonus";
  } else {
    const ids = [...new Set(Array.isArray(entrada.ferimentos) ? entrada.ferimentos : [entrada.id].filter(Boolean))];
    const fs = ids.map((id) => sessao.vital?.ferimentos?.find((f) => f.uid === id));
    if (!fs.length || fs.some((f) => !f || f.permanente)) return recusa(sessao, "Ferimento Indisponível");
    if (fs.some((f) => f.grupo !== "interna") && !entrada.recenteOuAberto) return recusa(sessao, "Confirme Membro Recente ou Não Cicatrizado");
    if (entrada.livre && er < 5) return recusa(sessao, "Exige Energia Reversa 5");
    acao = entrada.livre ? "livre" : entrada.membroEmMaos ? "bonus" : "comum";
    per = fs.reduce((n, f) => n + Math.max(0, (entrada.livre ? 10 : entrada.membroEmMaos && f.grupo !== "interna" ? 3 : 8) - (treino >= 3 ? 2 : 0)), 0);
    if (entrada.fluxo) {
      if (treino < 4) return recusa(sessao, "Fluxo Constante Exige Treino de Energia Reversa 4");
      const erro = erroFluxo(sessao, derived, entrada);
      if (erro) return recusa(sessao, erro);
      acao = entrada.inicioTurno ? "livre" : "reacao";
    }
    recuperados = ids;
  }
  const uso = usa(s, derived, { id: entrada.fluxo ? (entrada.inicioTurno ? FLUXO_INICIO : FLUXO_REACAO) : "regeneracao_aprimorada", nome: "Regeneração Aprimorada", acao, proibidoCom,
    ...(entrada.fluxo && entrada.inicioTurno ? { limite: { por: "turno" } } : {}),
    custo: { pe: per * 2 }, cobranca: "confirmada" }, pedido);
  if (!uso.aplicado) return uso;
  s = uso.sessao;
  if (modo === "exaustao") s = ajustaExaustaoTecnica(s, -inteiro(entrada.turnos ?? 1));
  else if (modo === "veneno") {
    if (veneno.id.startsWith("veneno:")) {
      const mantidas = new Set(venenosParaRegenerar(s).filter((v) => v.id !== veneno.id).flatMap((v) => v.condicoes ?? []));
      const removiveis = new Set(veneno.condicoes.filter((nome) => !mantidas.has(nome)));
      const encerrada = encerraUso(s, derived, veneno.id, { opId: `${pedido.opId}:veneno`, motivo: "energiaReversa" });
      if (!encerrada.aplicado) return recusa(sessao, encerrada.erro);
      s = defineCondicoes(encerrada.sessao, encerrada.sessao.condicoes.filter((c) => !removiveis.has(typeof c === "string" ? c : c.nome)));
    } else s = defineCondicoes(s, s.condicoes.filter((c, i) => veneno.condicaoId ? c.id !== veneno.condicaoId : i !== veneno.indice));
    s = registraRolagem(s, { id: `${pedido.opId}:veneno-removido`, ts: Date.now(), tipo: "info", rotulo: "Regeneração Aprimorada",
      detalhe: `Veneno Removido: ${veneno.nome}`, venenoId: veneno.id, fontes: [{ label: "Regeneração Aprimorada", texto: "4 PER, Ação Bônus" }] });
  }
  else for (const id of recuperados) {
    const r = recuperaFerimento(s, derived, { uid: id, via: "energiaReversa" }, { opId: `${pedido.opId}:${id}` });
    if (!r.aplicado) return recusa(sessao, r.erro ?? "Ferimento Não Recuperado");
    s = r.sessao;
  }
  let rolagem = null;
  const linha = derived.cura?.linhas?.find((l) => l.id === "cura_energia_reversa");
  if (recuperados.length && linha && Math.floor(per / 2) > 0) {
    // Essa cura é consequência do custo da Aptidão, sem aplicar o teto da cura básica.
    const pontos = Math.floor(per / 2);
    const molde = { ...linha, blocos: Math.max(linha.blocos, pontos) };
    const cura = curaNoGasto(molde, pontos);
    rolagem = rolarDano(preparaRolagemCura({ tipo: "dano", rotulo: "Regeneração Aprimorada", fonteCuraId: linha.id,
      dados: cura.dados, faces: Number(linha.dado.slice(1)), fixo: cura.fixo, tom: "cura" }, derived.efeitos), entrada.rng);
    s = registraRolagem(aplicaCura(s, rolagem.total, derived.hp), rolagem);
  }
  return { ...uso, sessao: s, per, recuperados, rolagem, venenoRemovido: veneno?.id ?? null };
}

export function danoDeAtaqueParaRerrolar(sessao, derived, rolagem, perfuracao = false) {
  if (!rolagem?.pedidoDano || !rolagem.armaId || rolagem.tom === "cura" || rolagem.consequenciasAplicadas
    || jaAplicada(sessao, `dano-confirmado:${rolagem.id}`)) return null;
  const linha = derived.dano?.entradas?.find((l) => l.id === rolagem.armaId && (l.chaveArma ?? null) === (rolagem.chaveArma ?? null));
  if (!linha || !["basico", "arma", "escudo"].includes(linha.fonte)) return null;
  if (perfuracao && (rolagem.tipoDano !== "pf" || rolagem.total <= 0 || (linha.ataqueId !== "corpo" && linha.categoria !== "corpo"))) return null;
  return linha;
}

export function rerrolaDanoTalento(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const original = sessao.log?.find((r) => r.id === entrada.id);
  const perfuracao = entrada.talento === "tal_especialista_em_perfuracao";
  const talento = perfuracao ? entrada.talento : "tal_ataque_infalivel";
  if (!temTalento(derived, talento) || !danoDeAtaqueParaRerrolar(sessao, derived, original, perfuracao)) return recusa(sessao, "Rolagem de Ataque Indisponível");
  if (perfuracao && !entrada.acertou) return recusa(sessao, "Exige Acerto Corpo a Corpo com Dano Perfurante");
  const r = usa(sessao, derived, { id: talento, nome: perfuracao ? "Especialista em Perfuração" : "Ataque Infalível",
    limite: { por: perfuracao ? "turno" : "rodada" } }, pedido);
  if (!r.aplicado) return r;
  const nova = rolarDano(original.pedidoDano, entrada.rng);
  const escolhida = perfuracao && original.total >= nova.total ? original : nova;
  const rolagem = { ...escolhida, id: original.id, ts: original.ts, rerrolagens: [...(original.rerrolagens ?? []), { fonte: talento, totalAnterior: original.total, totalNovo: nova.total, manteveAnterior: escolhida === original }] };
  return { ...r, sessao: atualizaRolagem(r.sessao, original.id, rolagem), rolagem };
}

/** Sorte, p.163: só o d20 adicional. Os dados extras e o bônus da primeira rolagem são preservados. */
export function rolaSorte(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const original = sessao.log?.find((r) => r.id === entrada.id);
  if (!temTalento(derived, "tal_favorecido_pela_sorte") || original?.tipo !== "teste" || original.sorte || testeComConsequencias(original) || jaAplicada(sessao, `ataque-confirmado:${original.id}`)) return recusa(sessao, "Rolagem de Sorte Indisponível");
  const r = usa(sessao, derived, { id: "tal_favorecido_pela_sorte", nome: "Favorecido pela Sorte",
    usos: { chave: "talento:tal_favorecido_pela_sorte", max: 3 } }, pedido);
  if (!r.aplicado) return r;
  const d20 = rolarDados(1, 20, entrada.rng)[0];
  const rolagem = { ...original, sorte: { d20, original: { natural: original.natural, total: original.total,
    sucesso: original.sucesso, critico: original.critico, pifia: original.pifia, d20: original.d20,
    descartado: original.descartado, naturalOriginal: original.naturalOriginal }, escolha: null } };
  return { ...r, sessao: atualizaRolagem(r.sessao, original.id, rolagem), rolagem };
}

export function escolheSorte(sessao, _derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const r = sessao.log?.find((r) => r.id === entrada.id);
  if (!r?.sorte || r.sorte.escolha != null || !["original", "novo"].includes(entrada.escolha)) return recusa(sessao, "Escolha de Sorte Indisponível");
  const natural = entrada.escolha === "original" ? r.sorte.original.natural : Math.max(r.minimoNatural ?? 0, r.sorte.d20);
  const total = natural + r.bonus + (r.somaExtras ?? 0);
  const sucesso = r.tipoTeste === "ataque" && natural === 20 ? true : r.tipoTeste === "ataque" && natural === 1 ? false : r.cd == null ? null : total >= r.cd;
  const rolagem = { ...r, natural, total, sucesso, pifia: natural === 1,
    ...(entrada.escolha === "novo" ? { d20: [r.sorte.d20], descartado: null, naturalOriginal: natural !== r.sorte.d20 ? r.sorte.d20 : undefined } : {}),
    critico: natural >= (r.margemCritico ?? 20) && (r.tipoTeste !== "ataque" || sucesso !== false), sorte: { ...r.sorte, escolha: entrada.escolha } };
  return { sessao: comOperacao(atualizaRolagem(sessao, r.id, rolagem), { id: pedido.opId, tipo: "sorte-escolha" }), aplicado: true, rolagem };
}

export function recuperaSorte(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const ataque = entrada.ataque;
  if (!temTalento(derived, "tal_favorecido_pela_sorte") || ataque?.tipoTeste !== "ataque" || ataque.natural !== 20 || !ataque.id || !entrada.contraVoce) return recusa(sessao, "Exige Ataque Inimigo com 20 contra Você");
  const id = `sorte:inimigo:${ataque.id}`;
  if (jaAplicada(sessao, id)) return recusa(sessao, "Ataque Já Registrado", "evento-repetido");
  return { sessao: comOperacao(comOperacao(marcaUso(sessao, { chave: "talento:tal_favorecido_pela_sorte", max: 3 }, -1), { id, tipo: "sorte" }), { id: pedido.opId, tipo: "sorte" }), aplicado: true };
}

export function usaEspecializacaoConteudo(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const canonico = entrada.id === "res_ainda_de_pe_letal" ? "res_ainda_de_pe" : entrada.id;
  const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === canonico && !derived.habilidades.inacessiveis?.includes(id));
  if (!real) return recusa(sessao, "Habilidade Indisponível");
  const corrigirTR = ["res_forca_imparavel", "res_barreira_inamovivel"].includes(entrada.id);
  if (corrigirTR && (testeComConsequencias(sessao.log?.[0]) || sessao.log?.[0]?.sorte?.escolha === null)) return recusa(sessao, "Teste Já Resolvido ou Sorte Pendente");
  const precificar = {
    cmb_surto_de_acao: [5, "Surto de Ação"], res_reacao_rapida: [2, "Reação Rápida"],
    res_forca_imparavel: [2, "Força Imparável"], res_barreira_inamovivel: [2, "Barreira Inamovível"],
    res_precisao_forcada: [3, "Precisão Forçada"],
  }[entrada.id];
  if (precificar) {
    const uso = usa(sessao, derived, { id: entrada.id, nome: precificar[1], emCombate: !corrigirTR, ...(corrigirTR ? {} : { proibidoCom }),
      custo: { pe: precificar[0] }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
    if (!uso.aplicado) return uso;
    const s = usarEfeitoEspecializacao(uso.sessao, derived, entrada.id);
    if (s === uso.sessao) return recusa(sessao, "Acionamento Indisponível");
    if (entrada.id === "res_precisao_forcada") {
      const armada = armaProximoAtaque(s, { id: `precisao:${pedido.opId}`, nome: "Precisão Forçada", estado: "precisaoForcada",
        consome: "declaracao", expira: "inicioDoProximoTurno", elegivel: { qualquer: ["corpo"], exceto: ["feitico"] } }, { opId: `${pedido.opId}:arma` });
      return armada.aplicado ? { ...uso, sessao: armada.sessao } : recusa(sessao, armada.erro);
    }
    return { ...uso, sessao: s };
  }
  const permitidas = ["res_ainda_de_pe", "res_ainda_de_pe_letal", "res_rejeitar_a_morte"];
  if (!permitidas.includes(entrada.id)) return recusa(sessao, "Acionamento Indisponível");
  const s = usarEfeitoEspecializacao(sessao, derived, entrada.id, entrada.rng);
  if (s === sessao) return recusa(sessao, "Acionamento Indisponível");
  const novosTestes = (s.log ?? []).map((r) => r.tipo === "teste" && !sessao.log?.some((x) => x.id === r.id) ? { ...r, consequenciasAplicadas: true } : r);
  return { sessao: comOperacao({ ...s, log: novosTestes }, { id: pedido.opId, tipo: "especializacao" }), aplicado: true };
}

export function rerrolaIniciativa(sessao, derived, entrada = {}, pedido = {}) {
  const g = identifica(sessao, pedido); if (g) return g;
  const original = sessao.log?.find((r) => r.id === entrada.id);
  if (!temTalento(derived, "tal_tecnicas_de_reacao_rapida") || !entrada.naoPrimeiro || original?.rotulo !== "Iniciativa"
    || original.tipo !== "teste" || original.rerroladaReacaoRapida) return recusa(sessao, "Iniciativa Indisponível");
  const r = usa(sessao, derived, { id: "tal_tecnicas_de_reacao_rapida", nome: "Técnicas de Reação Rápida" }, pedido);
  if (!r.aplicado) return r;
  const nova = rolarTeste({ rotulo: "Iniciativa", bonus: original.bonus, dados: (original.extras ?? []).map((d) => ({ qtd: d.qtd, faces: d.faces })), modo: original.modo }, entrada.rng);
  const rolagem = { ...(nova.total > original.total ? nova : original), id: original.id,
    rerroladaReacaoRapida: true, iniciativaAnterior: original.total, iniciativaNova: nova.total };
  return { ...r, sessao: atualizaRolagem(r.sessao, original.id, rolagem), rolagem };
}

/** p.107. A força vem das condições resolvidas no escopo do próprio alvo. */
export function usaIntervencaoConteudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identifica(sessao, pedido); if (guard) return guard;
  const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "sup_intervencao"
    && !derived.habilidades.inacessiveis?.includes(id));
  if (!real) return recusa(sessao, "Intervenção Indisponível");
  if (entrada.aliadoEmToque !== true) return recusa(sessao, "Falta Confirmar Aliado em Alcance de Toque");
  const condicao = derivedAlvo.condicoes?.lista?.find((c) => c.id === entrada.condicaoId);
  const nivel = Math.min(4, 1 + Math.floor(Math.max(0, derived.contextoDsl?.esc_suporte ?? 0) / 6));
  if (!condicao || condicao.nome === "Desmembramento" || !Number.isInteger(condicao.nivel) || condicao.nivel < 1 || condicao.nivel > nivel
    || !sessaoAlvo.condicoes?.some((c) => c.id === condicao.id)) return recusa(sessao, "Condição Fora do Alcance da Intervenção");
  const custo = 3 * condicao.nivel;
  const uso = usa(sessao, derived, { id: real, nome: "Intervenção", acao: "comum", proibidoCom,
    custo: { pe: custo }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  if (!uso.aplicado) return uso;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Intervenção",
    detalhe: `Encerrou ${condicao.nome}`, condicaoId: condicao.id, alvoId: entrada.alvoId ?? null,
    fontes: [{ label: "Intervenção", texto: `${condicao.forcaLabel}, ${custo} PE` }], custo: uso.custo };
  return { ...uso, sessao: registraRolagem(uso.sessao, registro),
    sessaoAlvo: registraRolagem(defineCondicoes(sessaoAlvo, sessaoAlvo.condicoes.filter((c) => c.id !== condicao.id)), registro) };
}

/** p.108. Custo do Suporte e gasto de dados do destinatário formam uma operação única. */
export const dadosVidaDoConteudo = (sessao, derived) => resumoDadosDeVida(sessao, derived,
  { treinamentos: { resistencia: derived.conteudoTreinos?.resistencia ?? 0 } });

export function usaIncitarVigor(sessao, derived, entrada = {}, pedido = {}, alvo = null) {
  const guard = identifica(sessao, pedido); if (guard) return guard;
  const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "sup_incitar_vigor"
    && !derived.habilidades.inacessiveis?.includes(id));
  if (!real || entrada.emToque !== true) return recusa(sessao, "Exige Incitar Vigor e Destinatário em Toque");
  const quantidade = Number(entrada.quantidade);
  if (!Number.isInteger(quantidade) || quantidade < 1) return recusa(sessao, "Informe uma Quantidade Inteira de Dados");
  const uso = usa(sessao, derived, { id: real, nome: "Incitar Vigor", acao: "bonus", proibidoCom,
    custo: { pe: 3 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" }, pedido);
  if (!uso.aplicado) return uso;
  const sa = alvo?.sessao ?? uso.sessao, da = alvo?.derived ?? derived;
  const gasto = gastaDadosDeVida(sa, da, { classeId: entrada.classeId, quantidade,
    treinamentos: { resistencia: da.conteudoTreinos?.resistencia ?? 0 }, rng: entrada.rng }, { opId: `${pedido.opId}:dados` });
  if (!gasto.aplicado) return recusa(sessao, gasto.erro);
  const pilha = dadosVidaDoConteudo(sa, da).pilha;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Incitar Vigor",
    detalhe: `Cura: ${gasto.cura}`, cura: gasto.cura, dados: gasto.dados, alvoId: entrada.alvoId ?? null, custo: uso.custo,
    fontes: [{ label: "Incitar Vigor", texto: "3 PE, Ação Bônus" }, ...gasto.dados.map((d) => ({ label: pilha.find((c) => c.id === d.id)?.nome ?? "Dados de Vida", texto: `${d.quantidade}d${d.faces}` })),
      { label: "Constituição do Destinatário", valor: gasto.modCon }] };
  const destino = registraRolagem(gasto.sessao, registro);
  return alvo ? { ...uso, sessao: registraRolagem(uso.sessao, registro), sessaoAlvo: destino, cura: gasto.cura }
    : { ...uso, sessao: destino, cura: gasto.cura };
}

export function conteudoComAlvo(sessao, derived, sessaoAlvo, derivedAlvo, entrada, pedido) {
  if (entrada.operacao === "cura") return usaCuraConteudo(sessao, derived, entrada, pedido, { sessao: sessaoAlvo, derived: derivedAlvo });
  if (entrada.operacao === "concluiCuraMedicina") return concluiCuraComMedicina(sessao, derived, entrada, pedido, { sessao: sessaoAlvo, derived: derivedAlvo });
  if (entrada.operacao === "critico") return aplicaCriticoDeGrupo(sessao, derived, sessaoAlvo, derivedAlvo, entrada, pedido);
  return recusa(sessao, "Operação Indisponível");
}
