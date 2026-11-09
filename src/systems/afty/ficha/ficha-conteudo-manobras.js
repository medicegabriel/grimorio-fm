// CX3: cláusulas de Talentos que usam testes, ações e efeitos de CL1.
import { usa, avaliaUso, encerraUso } from "./ficha-uso";
import { jaAplicada, comOperacao, usoDe, comBuff } from "./ficha-uso-estado";
import { rolarTeste, rolarDano } from "./ficha-rolagem";
import { registraRolagem, defineCondicoes, marcaUso, usosGastosDe } from "./ficha-sessao";
import { AFTY_TAMANHOS } from "../afty-schema";
import { gastaAcao } from "./ficha-acoes";
import { prepararRolagem, motivoDaRecusa } from "./abas-g2/rolagem-g2";
import { modoCombinado } from "../afty-propriedades-armas";
import { testeComConsequencias, bloqueioDeOportunidadeConteudo, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { abreTesteDeConcentracao } from "./ficha-concentracao";
import { aplicaDanoRecebido } from "./ficha-dano-recebido";
import { renovaEnergiaPorEvento } from "./ficha-conteudo-combate";
import { drenaAuraAoMatar } from "./ficha-conteudo-aura-drenadora";
import { recursosDeEspecializacao } from "./ficha-especializacoes";
import { posturasDepoisDeEmpurrar, posturaAtivaConteudo } from "./ficha-conteudo-posturas";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const talento = (d, id) => d.talentos?.escolhidas?.includes(id) && !d.talentos.inacessiveis?.includes(id);
const identidade = (s, p) => typeof p.opId !== "string" || !p.opId ? recusa(s, "Sem Identidade da Operação")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;
const proibidoCom = ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"];
const corpo = (l) => l?.ataqueId === "corpo" || l?.categoria === "corpo";

/** p.365: Habilidades iguais não concedem duas ações. Vale a melhor cadência acessível. */
export function fonteAcaoAgilConteudo(derived, id) {
  if (!["lut_acao_agil", "res_acao_agil"].includes(id)) return null;
  const disponiveis = (derived.habilidades?.efetivas ?? []).filter((h) => !derived.habilidades.inacessiveis?.includes(h));
  const pedida = disponiveis.find((h) => h.replace(/^.*__/, "") === id);
  if (!pedida) return null;
  const real = disponiveis.find((h) => h.replace(/^.*__/, "") === "res_acao_agil") ?? pedida;
  return { id: real, por: real.replace(/^.*__/, "") === "res_acao_agil" ? "turno" : "rodada" };
}

/** p.55/119 e 301 a 303. A ação adicional só realiza estes três verbos. */
export function usaAcaoAgilConteudo(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const fonte = fonteAcaoAgilConteudo(derived, entrada.id);
  if (!fonte || entrada.emSeuTurno !== true) return recusa(sessao, "Exige Ação Ágil no Seu Turno");
  const real = fonte.id;
  const turno = sessao.especializacaoSessao;
  if (turno?.turnoEncerrado != null && turno.turnoEncerrado === turno.turno) return recusa(sessao, "Seu Turno Já Encerrou");
  const comando = entrada.comando;
  if (!["andar", "desengajar", "esconder"].includes(comando)) return recusa(sessao, "Escolha Andar, Desengajar ou Esconder");
  const distancia = Number(entrada.distancia);
  if (comando === "andar" && (entrada.distancia == null || entrada.distancia === "" || !Number.isFinite(distancia) || distancia < 0 || distancia > derived.movimento)) return recusa(sessao, "Distância Fora do Movimento");
  const furtividade = comando === "esconder" ? derived.testes.pericias.find((l) => l.id === "furtividade") : null;
  if (comando === "esconder" && (!furtividade || !["normal", "vantagem", "desvantagem"].includes(entrada.modo ?? "normal"))) return recusa(sessao, "Furtividade Indisponível");
  const uso = usa(sessao, derived, { id: "acao_agil", origem: real, nome: "Ação Ágil", emCombate: true,
    acesso: impedimentoParaAgirConteudo,
    proibidoCom, limite: { por: fonte.por },
    custo: { pe: 2 }, cobranca: entrada.descontarPE ? "confirmada" : "manual",
    ...(comando === "desengajar" ? { duracao: { ate: "fimDoTurno" },
      parametros: [{ id: "comando", tipo: "opcao", opcoes: ["desengajar"], padrao: "desengajar" }] } : {}),
  }, pedido);
  if (!uso.aplicado) return uso;
  let usada = uso.sessao;
  for (const por of ["rodada", "turno"]) {
    const chave = `${por}:uso:acao_agil`;
    if (usosGastosDe(usada, chave) < 1) usada = marcaUso(usada, { chave, max: 1 }, 1);
  }
  const rolagem = furtividade ? rolarTeste({ rotulo: furtividade.nome, periciaId: furtividade.id,
    bonus: furtividade.bonus, dados: furtividade.dadosExtras, margem: furtividade.margemCritico,
    minimoNatural: furtividade.minimoNatural, modo: entrada.modo ?? "normal",
    contextoConteudo: { tipo: "acaoAgil", comando, habilidade: real, operacaoId: pedido.opId } }, entrada.rng) : null;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Ação Ágil", comando, habilidade: real,
    detalhe: comando === "andar" ? `Andou ${distancia}m` : comando === "desengajar" ? "Desengajou" : "Esconder",
    ...(comando === "andar" ? { deslocamento: distancia, fontes: [{ label: "Movimento", valor: derived.movimento }] } : {}),
    ...(rolagem ? { testeId: rolagem.id } : {}) };
  return { ...uso, rolagem, registro, sessao: registraRolagem(rolagem ? registraRolagem(usada, rolagem) : usada, registro) };
}

/** p.76: duas ações livres distintas, sem saldo adicional de ações ou PE. */
export function usaAcaoLuaConteudo(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const fonte = posturaAtivaConteudo(sessao, derived, "lua");
  if (!fonte || entrada.emSeuTurno !== true) return recusa(sessao, "Exige Postura da Lua Ativa no Seu Turno");
  const turno = sessao.especializacaoSessao;
  if (turno?.turnoEncerrado != null && turno.turnoEncerrado === turno.turno) return recusa(sessao, "Seu Turno Já Encerrou");
  if (!["andar", "desengajar"].includes(entrada.comando)) return recusa(sessao, "Escolha Andar ou Desengajar");
  const distancia = Number(entrada.distancia);
  if (entrada.comando === "andar" && (entrada.distancia == null || entrada.distancia === "" || !Number.isFinite(distancia)
    || distancia < 0 || distancia > derived.movimento)) return recusa(sessao, "Distância Fora do Movimento");
  const desengajar = entrada.comando === "desengajar";
  const uso = usa(sessao, derived, { id: `${fonte.id}:${entrada.comando}`, origem: fonte.id, nome: fonte.nome,
    emCombate: true, acao: "livre", acesso: impedimentoParaAgirConteudo, proibidoCom,
    ...(desengajar ? { duracao: { ate: "fimDoTurno" }, parametros: [
      { id: "comando", tipo: "opcao", opcoes: ["desengajar"], padrao: "desengajar" },
    ] } : {}) }, { ...pedido, registraAcao: true });
  if (!uso.aplicado) return uso;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: fonte.nome, comando: entrada.comando,
    detalhe: desengajar ? "Desengajou" : `Andou ${distancia}m`, fontes: fonte.partes,
    ...(!desengajar ? { deslocamento: distancia, fontesMovimento: derived.partes?.movimento ?? [{ label: "Movimento", valor: derived.movimento }] } : {}) };
  return { ...uso, registro, sessao: registraRolagem(uso.sessao, registro) };
}

function testesDaManobra(derived, derivedAlvo, entrada, contexto, bonus = 0, fonte = null) {
  const manobra = derived.testes.manobras.find((m) => m.id === contexto.manobra);
  const defesa = derivedAlvo.testes.manobras.find((m) => m.id === contexto.manobra);
  const atletismo = derived.testes.pericias.find((l) => l.id === "atletismo");
  const periciaAlvo = derivedAlvo.testes.pericias.find((l) => l.id === entrada.periciaAlvo);
  if (!manobra || !defesa || !atletismo || !periciaAlvo) return null;
  const atacante = rolarTeste({ rotulo: manobra.nome, periciaId: "atletismo", bonus: manobra.executar + bonus,
    dados: atletismo.dadosExtras, margem: atletismo.margemCritico, minimoNatural: atletismo.minimoNatural,
    modo: entrada.modoAtacante ?? "normal", contextoConteudo: { ...contexto, papel: "Atacante" },
    fontes: [...manobra.partesExecutar, ...(fonte ? [{ label: fonte, valor: bonus }] : [])] }, entrada.rngAtacante ?? entrada.rng);
  const extraResistir = defesa.resistir - defesa.partesResistir[0].valor;
  const alvo = rolarTeste({ rotulo: periciaAlvo.nome, periciaId: entrada.periciaAlvo, bonus: periciaAlvo.bonus + extraResistir,
    dados: periciaAlvo.dadosExtras, margem: periciaAlvo.margemCritico, minimoNatural: periciaAlvo.minimoNatural,
    modo: entrada.modoAlvo ?? "normal", contextoConteudo: { ...contexto, papel: "Alvo" },
    fontes: [{ label: periciaAlvo.nome, valor: periciaAlvo.bonus }, ...defesa.partesResistir.slice(1)] }, entrada.rngAlvo ?? entrada.rng);
  return { atacante, alvo };
}

function acertoSemDanoDeBriga(sessao, derived, entrada) {
  if (!talento(derived, "tal_adepto_de_briga") || typeof entrada.alvoId !== "string" || !entrada.alvoId) return null;
  const ataque = sessao.log?.find((r) => r.id === entrada.ataqueId && r.tipoTeste === "ataque");
  const linha = derived.dano?.entradas?.find((l) => l.id === ataque?.armaId && (l.chaveArma ?? null) === (ataque.chaveArma ?? null));
  if (linha?.fonte !== "basico") return null;
  return sessao.log?.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === ataque.id
    && r.ataque?.acertou && r.ataque.alvo?.id === entrada.alvoId && r.rodada === sessao.rodada
    && r.turno === usoDe(sessao).acoes.turno && r.calculos?.length > 0
    && r.calculos.every((c) => c.final === 0)) ?? null;
}

/** p.165/301. A ação livre usa um acerto real sem dano e a disputa nativa de manobra. */
export function rolaManobraDeBriga(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!acertoSemDanoDeBriga(sessao, derived, entrada)) return recusa(sessao, "Exige Acerto Desarmado sem Dano neste Turno contra o Alvo");
  if (!["derrubar", "empurrar"].includes(entrada.manobra)) return recusa(sessao, "Manobra de Briga Indisponível");
  if (entrada.manobra === "empurrar" && recursosDeEspecializacao(sessaoAlvo, derivedAlvo).imuneMovimentoForcado) return recusa(sessao, "Alvo Imune a Movimento Forçado");
  if (!["atletismo", "acrobacia"].includes(entrada.periciaAlvo)) return recusa(sessao, "Escolha Atletismo ou Acrobacia do Alvo");
  if (jaAplicada(sessao, `briga:disputa:${entrada.ataqueId}`)) return recusa(sessao, "Manobra deste Acerto Já Rolada");
  const uso = usa(sessao, derived, { id: "tal_adepto_de_briga", nome: "Adepto de Briga", acao: "livre", proibidoCom }, pedido);
  if (!uso.aplicado) return uso;
  const bonus = Math.floor(derived.maestria / 2);
  const contexto = { tipo: "manobraBriga", disputaId: pedido.opId, ataqueId: entrada.ataqueId, alvoId: entrada.alvoId,
    manobra: entrada.manobra, rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno };
  const testes = testesDaManobra(derived, derivedAlvo, entrada, contexto, bonus, "Adepto de Briga");
  if (!testes) return recusa(sessao, "Teste da Manobra Indisponível");
  const { atacante, alvo } = testes;
  return { ...uso, sessao: comOperacao(registraRolagem(uso.sessao, atacante), { id: `briga:disputa:${entrada.ataqueId}`, tipo: "briga-disputa" }),
    sessaoAlvo: registraRolagem(sessaoAlvo, alvo), atacante, alvo };
}

/** A conclusão lê os testes atuais, depois de Sorte ou Outra Chance, sem cobrar outra ação. */
export function aplicaManobraDeBriga(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!acertoSemDanoDeBriga(sessao, derived, entrada)) return recusa(sessao, "Exige Acerto Desarmado sem Dano neste Turno contra o Alvo");
  const eventoId = `briga:resultado:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Resultado da Manobra Já Aplicado");
  const atacante = sessao.log?.find((r) => r.contextoConteudo?.tipo === "manobraBriga" && r.contextoConteudo.ataqueId === entrada.ataqueId
    && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Atacante");
  const c = atacante?.contextoConteudo;
  const alvo = sessaoAlvo.log?.find((r) => r.contextoConteudo?.tipo === "manobraBriga" && r.contextoConteudo.disputaId === c?.disputaId
    && r.contextoConteudo.ataqueId === entrada.ataqueId && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Alvo");
  if (!["derrubar", "empurrar"].includes(c?.manobra) || !jaAplicada(sessao, `briga:disputa:${entrada.ataqueId}`) || !jaAplicada(sessao, c?.disputaId)
    || ![atacante, alvo].every((r) => r?.tipo === "teste" && Number.isFinite(r.total) && !testeComConsequencias(r))
    || alvo.contextoConteudo.manobra !== c.manobra || atacante.sorte?.escolha === null || alvo.sorte?.escolha === null) return recusa(sessao, "Falta a Disputa ou Escolha de Sorte");
  const manobra = derived.testes.manobras.find((m) => m.id === c.manobra);
  if (!manobra) return recusa(sessao, "Manobra Indisponível");
  if (c.manobra === "empurrar" && recursosDeEspecializacao(sessaoAlvo, derivedAlvo).imuneMovimentoForcado) return recusa(sessao, "Alvo Imune a Movimento Forçado");
  const resistiu = alvo.total >= atacante.total;
  const distancia = !resistiu && c.manobra === "empurrar" ? manobra.distancia + 1.5 * Math.floor((atacante.total - alvo.total) / 5) : 0;
  const uso = usa(sessao, derived, { id: eventoId, nome: "Resultado de Adepto de Briga" }, pedido);
  if (!uso.aplicado) return uso;
  let sa = !resistiu && c.manobra === "derrubar"
    ? defineCondicoes(sessaoAlvo, [...(sessaoAlvo.condicoes ?? []), { id: eventoId, nome: "Caído", rodadas: null }]) : sessaoAlvo;
  if (distancia > 0) sa = abreTesteDeConcentracao(posturasDepoisDeEmpurrar(sa, derivedAlvo), "empurrado", { bonus: derived.testes.pericias.find((l) => l.id === "atletismo").bonus }).sessao;
  const marca = (s, r, extra = {}) => ({ ...s, log: s.log.map((x) => x.id === r.id ? { ...x, ...extra, consequenciasAplicadas: true } : x) });
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Adepto de Briga", ataqueId: entrada.ataqueId,
    alvoId: entrada.alvoId, manobra: c.manobra, distancia, resistiu,
    detalhe: resistiu ? "Alvo Resistiu" : c.manobra === "derrubar" ? "Alvo Caído" : `Empurrado: ${distancia}m`,
    fontes: c.manobra === "empurrar" ? [{ label: "Empurrar", valor: manobra.distancia }, { label: "Margem da Disputa", texto: "+1,5m por 5" }] : [{ label: "Adepto de Briga", texto: manobra.nome }] };
  return { ...uso, sessao: comOperacao(registraRolagem(marca(uso.sessao, atacante), registro), { id: eventoId, tipo: "briga-resultado" }),
    sessaoAlvo: registraRolagem(marca(sa, alvo, { cd: atacante.total, sucesso: resistiu }), registro), resistiu, distancia };
}

const idEscudo = "tal_tecnicas_ofensivas_de_escudo";
function ataqueParaEscudo(sessao, derived, entrada) {
  if (!talento(derived, idEscudo) || entrada.emSeuTurno !== true || !sessao.combate?.ativo) return null;
  const e = sessao.especializacaoSessao;
  if (e?.turnoEncerrado != null && e.turnoEncerrado === e.turno) return null;
  const r = sessao.log?.find((r) => r.id === entrada.ataqueId && r.tipoTeste === "ataque");
  if (!r?.contextoTurno || r.contextoTurno.rodada !== sessao.rodada || r.contextoTurno.turno !== usoDe(sessao).acoes.turno) return null;
  return derived.dano?.entradas?.find((l) => l.id === idEscudo) ?? null;
}

/** p.165. O gatilho é atacar no próprio turno, mesmo errando, não exige o mesmo alvo. */
export function rolaEmpurraoEscudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (recursosDeEspecializacao(sessaoAlvo, derivedAlvo).imuneMovimentoForcado) return recusa(sessao, "Alvo Imune a Movimento Forçado");
  if (!ataqueParaEscudo(sessao, derived, entrada)) return recusa(sessao, "Exige Escudo Equipado e Ataque neste Seu Turno");
  if (entrada.emAlcanceEscudo !== true || typeof entrada.alvoId !== "string" || !entrada.alvoId) return recusa(sessao, "Falta Alvo em Alcance do Escudo");
  if (!["atletismo", "acrobacia"].includes(entrada.periciaAlvo)) return recusa(sessao, "Escolha Atletismo ou Acrobacia do Alvo");
  const eventoId = `escudo:disputa:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Empurrão deste Ataque Já Rolado");
  const uso = usa(sessao, derived, { id: idEscudo, nome: "Técnicas Agressivas de Escudo", acao: "bonus", proibidoCom }, pedido);
  if (!uso.aplicado) return uso;
  const contexto = { tipo: "manobraEscudo", disputaId: pedido.opId, ataqueId: entrada.ataqueId, alvoId: entrada.alvoId,
    manobra: "empurrar", rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno };
  const testes = testesDaManobra(derived, derivedAlvo, entrada, contexto);
  if (!testes) return recusa(sessao, "Teste da Manobra Indisponível");
  return { ...uso, sessao: comOperacao(registraRolagem(uso.sessao, testes.atacante), { id: eventoId, tipo: "escudo-disputa" }),
    sessaoAlvo: registraRolagem(sessaoAlvo, testes.alvo), ...testes };
}

/** Decisão do autor: derrubar conserva o empurrão normal, com a margem da disputa. */
export function aplicaEmpurraoEscudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (recursosDeEspecializacao(sessaoAlvo, derivedAlvo).imuneMovimentoForcado) return recusa(sessao, "Alvo Imune a Movimento Forçado");
  const linha = ataqueParaEscudo(sessao, derived, entrada);
  if (!linha) return recusa(sessao, "Exige Escudo Equipado e Ataque neste Seu Turno");
  if (!["distancia", "caido"].includes(entrada.escolha)) return recusa(sessao, "Escolha Distância Adicional ou Caído");
  const eventoId = `escudo:resultado:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Empurrão Já Aplicado");
  const atacante = sessao.log?.find((r) => r.contextoConteudo?.tipo === "manobraEscudo" && r.contextoConteudo.ataqueId === entrada.ataqueId
    && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Atacante");
  const c = atacante?.contextoConteudo;
  const alvo = sessaoAlvo.log?.find((r) => r.contextoConteudo?.tipo === "manobraEscudo" && r.contextoConteudo.disputaId === c?.disputaId
    && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Alvo");
  if (!jaAplicada(sessao, `escudo:disputa:${entrada.ataqueId}`) || !jaAplicada(sessao, c?.disputaId)
    || ![atacante, alvo].every((r) => r?.tipo === "teste" && Number.isFinite(r.total) && !testeComConsequencias(r))
    || atacante.sorte?.escolha === null || alvo.sorte?.escolha === null) return recusa(sessao, "Falta a Disputa ou Escolha de Sorte");
  const manobra = derived.testes.manobras.find((m) => m.id === "empurrar");
  const resistiu = alvo.total >= atacante.total;
  const base = resistiu ? 0 : manobra.distancia + 1.5 * Math.floor((atacante.total - alvo.total) / 5);
  const distancia = resistiu ? 0 : base + (entrada.escolha === "distancia" ? 4.5 : 0);
  let sa = sessaoAlvo, s = sessao, dano = null, calculo = null, evento = null;
  if (!resistiu) {
    const anterior = entrada.danoId ? sessao.log?.find((r) => r.id === entrada.danoId && r.tipo === "dano") : null;
    if (entrada.danoId && (!anterior || anterior.armaId !== idEscudo || anterior.critico || anterior.raioNegro || anterior.tom === "cura"
      || anterior.ts < atacante.ts || anterior.consequenciasAplicadas || jaAplicada(sessao, `dano-confirmado:${anterior.id}`))) return recusa(sessao, "Dano do Escudo Indisponível para esta Disputa");
    dano = { ...(anterior ?? rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, linhaArma: linha, fontes: linha.partes }, entrada.rng)), consequenciasAplicadas: true };
    const aplicado = aplicaDanoRecebido(sa, derivedAlvo, { total: dano.total, tipo: "im", ataqueId: `${c.disputaId}:escudo`, desempate: entrada.desempate }, { opId: `${pedido.opId}:dano` });
    if (!aplicado.aplicado) return recusa(sessao, aplicado.erro);
    sa = aplicado.sessao; calculo = aplicado.calculo; evento = aplicado.evento;
    if (entrada.escolha === "caido") sa = defineCondicoes(sa, [...(sa.condicoes ?? []), { id: eventoId, nome: "Caído", rodadas: null }]);
    if (distancia > 0) sa = abreTesteDeConcentracao(posturasDepoisDeEmpurrar(sa, derivedAlvo), "empurrado", { bonus: derived.testes.pericias.find((l) => l.id === "atletismo").bonus }).sessao;
    s = comOperacao(anterior ? { ...s, log: s.log.map((r) => r.id === dano.id ? dano : r) } : registraRolagem(s, dano),
      { id: `dano-confirmado:${dano.id}`, tipo: "dano-confirmado" });
  }
  const renovacao = renovaEnergiaPorEvento(s, derived, { inimigo: entrada.inimigo, abateu: evento?.abateu === true });
  const dreno = drenaAuraAoMatar(renovacao.sessao, derived, sessaoAlvo, sa, {
    inimigo: entrada.inimigo, ataqueId: `${c.disputaId}:escudo`, alvoId: entrada.alvoId, rng: entrada.rngAuraDrenadora,
  });
  const marca = (ss, r, extra = {}) => ({ ...ss, log: ss.log.map((x) => x.id === r.id ? { ...x, ...extra, consequenciasAplicadas: true } : x) });
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Técnicas Agressivas de Escudo",
    ataqueId: entrada.ataqueId, alvoId: entrada.alvoId, distancia, resistiu, escolha: entrada.escolha, calculo, evento, energiaRecuperada: renovacao.recuperado,
    ...(dreno.pv ? { pvTemporarioGanho: dreno.pv } : {}),
    detalhe: resistiu ? "Alvo Resistiu" : `Empurrado: ${distancia}m${entrada.escolha === "caido" ? ", Caído" : ""}`,
    fontes: [{ label: "Empurrar", valor: resistiu ? 0 : base }, { label: "Técnicas Agressivas de Escudo", valor: entrada.escolha === "distancia" && !resistiu ? 4.5 : 0 }, ...(renovacao.fontes ?? [])] };
  return { sessao: comOperacao(comOperacao(registraRolagem(marca(dreno.sessao, atacante), registro), { id: eventoId, tipo: "escudo-resultado" }), { id: pedido.opId, tipo: "escudo-resultado" }),
    sessaoAlvo: registraRolagem(marca(sa, alvo, { cd: atacante.total, sucesso: resistiu }), registro), aplicado: true, resistiu, distancia, dano, calculo };
}

export function distanciaInvestidaConteudo(derived, aprimorada = true) {
  return { maximo: 2 * (Math.max(0, derived.movimento) + (aprimorada ? 3 : 0)), partes: [
    { label: "Movimento", valor: derived.movimento }, ...(aprimorada ? [{ label: "Investida Aprimorada", valor: 3 }] : []), { label: "Investida", texto: "× 2" },
  ] };
}

const voadoraDisponivel = (d) => d.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "lut_voadora" && !d.habilidades.inacessiveis?.includes(id));

/** p.164/304. Decisão de 06/11: máximo de duas vezes (Movimento + 3). */
export function preparaInvestidaConteudo(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const aprimorada = talento(derived, "tal_investida_aprimorada"), voadora = entrada.voadora === true;
  const habilidade = voadoraDisponivel(derived);
  if (!aprimorada && !voadora) return recusa(sessao, "Investida Aprimorada Indisponível");
  if (voadora && (!habilidade || !derived.contextoDsl?.desarmado)) return recusa(sessao, "Voadora Exige Habilidade e Estar Desarmado");
  if (entrada.linhaReta !== true || entrada.terrenoDificil !== false) return recusa(sessao, "Exige Linha Reta sem Terreno Difícil");
  const alcance = distanciaInvestidaConteudo(derived, aprimorada), distancia = Number(entrada.distancia);
  if (entrada.distancia == null || entrada.distancia === "" || !Number.isFinite(distancia) || distancia < 0 || distancia > alcance.maximo) return recusa(sessao, "Distância Fora do Limite");
  const linha = derived.dano.entradas.find((l) => l.id === entrada.armaId && (l.chaveArma ?? null) === (entrada.chaveArma ?? null));
  if (!linha || !corpo(linha) || !["basico", "arma", "escudo"].includes(linha.fonte)) return recusa(sessao, "Exige Ataque Corpo a Corpo");
  if (voadora && linha.fonte !== "basico") return recusa(sessao, "Voadora Exige Ataque Desarmado");
  const dadosVoadora = Math.min(Math.floor(distancia / 3), Math.max(0, derived.mods.forca, derived.mods.destreza));
  const nome = voadora ? "Voadora" : "Investida Aprimorada";
  const pedidoRolagem = { tipo: "teste", tipoTeste: "ataque", rotulo: `${linha.nome} · Acerto`, detalhe: nome,
    bonus: linha.acerto + (aprimorada ? derived.maestria : 2), dados: linha.acertoDados, margem: linha.margemCritico, linhaArma: linha, modo: entrada.modo ?? "normal",
    fontes: [...(linha.partesAcerto ?? []), { label: aprimorada ? "Investida Aprimorada" : "Investida", valor: aprimorada ? derived.maestria : 2 }],
    contextoConteudo: { tipo: "investida", operacaoId: pedido.opId, rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno,
      alvoId: entrada.alvoId || null, distancia, maximo: alcance.maximo, aprimorada,
      ...(voadora ? { voadora: { habilidade, dados: dadosVoadora } } : {}) } };
  const prova = prepararRolagem(pedidoRolagem, { sessao, derived, modo: pedidoRolagem.modo });
  if (!prova.ok) return recusa(sessao, motivoDaRecusa(prova, pedidoRolagem));
  const uso = usa(sessao, derived, { id: aprimorada ? "tal_investida_aprimorada" : habilidade, nome, emCombate: true,
    ...(voadora ? { custo: { pe: 3 }, cobranca: entrada.descontarPE ? "confirmada" : "manual" } : {}),
    proibidoCom: [...proibidoCom, "Imóvel", "Agarrado"], acao: "completa", renova: true,
    duracao: { ate: "inicioDoProximoTurno" }, efeitos: [{ tipo: "buff", canal: "defesa", expr: "-2" }] }, pedido);
  return uso.aplicado ? { ...uso, pedidoRolagem, alcance } : uso;
}

/** O dano usa a linha nativa e o crítico do recibo, inclusive após uma escolha de Sorte. */
export function danoDaInvestidaConteudo(sessao, derived) {
  const ataque = sessao.log?.find((r) => r.tipoTeste === "ataque");
  const c = ataque?.contextoConteudo;
  if (!c || c.tipo !== "investida" || c.rodada !== sessao.rodada || c.turno !== usoDe(sessao).acoes.turno
    || !jaAplicada(sessao, c.operacaoId) || !(talento(derived, "tal_investida_aprimorada") || (c.voadora && voadoraDisponivel(derived))) || ataque.sorte?.escolha === null
    || ataque.natural === 1 || ataque.sucesso === false || jaAplicada(sessao, `ataque-confirmado:${ataque.id}`)) return null;
  const linha = derived.dano.entradas.find((l) => l.id === ataque.armaId && (l.chaveArma ?? null) === (ataque.chaveArma ?? null));
  if (!linha || !corpo(linha)) return null;
  const grupos = c.voadora ? [...linha.gruposDano, { nome: "Voadora", dados: c.voadora.dados, faces: 8, fixo: 0, momento: "durante", multiplica: true }] : linha.gruposDano;
  return { tipo: "dano", rotulo: linha.nome, grupos, modoDano: ataque.critico ? "critico" : "normal",
    rerrola: linha.rerrola, linhaArma: linha, consomeAcoesAddon: linha.consomeAcoesAddon };
}

function acertoDeInvestida(sessao, derived, entrada) {
  if (!talento(derived, "tal_investida_aprimorada")) return null;
  const r = sessao.log?.find((r) => r.id === entrada.ataqueId && r.contextoConteudo?.tipo === "investida");
  const c = r?.contextoConteudo;
  if (!c || c.aprimorada === false || c.rodada !== sessao.rodada || c.turno !== usoDe(sessao).acoes.turno || !jaAplicada(sessao, c.operacaoId)) return null;
  if (c.alvoId && c.alvoId !== entrada.alvoId) return null;
  return sessao.log?.find((x) => x.rotulo === "Ataque Confirmado" && x.ataqueId === r.id && x.ataque?.acertou && x.ataque.alvo?.id === entrada.alvoId) ?? null;
}

/** A disputa fica no histórico antes de aplicar Caído. Testes de outros benefícios podem ser reaproveitados. */
export function rolaDisputaInvestida(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const acerto = acertoDeInvestida(sessao, derived, entrada), eventoId = `investida:disputa:${entrada.ataqueId}`;
  if (!acerto) return recusa(sessao, "Falta Acerto da Investida contra o Alvo neste Turno");
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Disputa Já Rolada");
  const molde = (s, d, id) => {
    const linha = d.testes.pericias.find((p) => p.id === "atletismo");
    if (!linha) return null;
    const r = id ? s.log?.find((r) => r.id === id && r.tipo === "teste" && (r.periciaId === "atletismo" || r.rotulo === linha.nome)) : null;
    if (id && (!r || r.ts < acerto.ts || testeComConsequencias(r) || r.contextoConteudo?.tipo === "disputaInvestida")) return null;
    return { linha, r };
  };
  const moldeAtacante = molde(sessao, derived, entrada.rolagemAtacanteId), moldeAlvo = molde(sessaoAlvo, derivedAlvo, entrada.rolagemAlvoId);
  if (!moldeAtacante || !moldeAlvo) return recusa(sessao, "Atletismo Indisponível para a Disputa");
  const teste = ({ linha, r }, papel) => {
    if (!r) r = rolarTeste({ rotulo: linha.nome, periciaId: linha.id, bonus: linha.bonus, dados: linha.dadosExtras,
      margem: linha.margemCritico, minimoNatural: linha.minimoNatural, modo: entrada[`modo${papel}`] ?? "normal" }, entrada[`rng${papel}`] ?? entrada.rng);
    return { ...r, contextoConteudo: { tipo: "disputaInvestida", papel, disputaId: pedido.opId, ataqueId: entrada.ataqueId, alvoId: entrada.alvoId } };
  };
  const uso = usa(sessao, derived, { id: eventoId, nome: "Disputa da Investida", emCombate: true }, pedido);
  if (!uso.aplicado) return uso;
  const atacante = teste(moldeAtacante, "Atacante"), alvo = teste(moldeAlvo, "Alvo");
  const comTeste = (s, r) => s.log?.some((x) => x.id === r.id) ? { ...s, log: s.log.map((x) => x.id === r.id ? r : x) } : registraRolagem(s, r);
  return { ...uso, sessao: comOperacao(comTeste(uso.sessao, atacante), { id: eventoId, tipo: "investida-disputa" }),
    sessaoAlvo: comTeste(sessaoAlvo, alvo), rolagens: { atacante, alvo }, disputaId: pedido.opId };
}

/** Usa os resultados atuais, incluindo Sorte/rerrolagens, sem rolar novamente. */
export function aplicaDisputaInvestida(sessao, derived, sessaoAlvo, _derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!acertoDeInvestida(sessao, derived, entrada)) return recusa(sessao, "Falta Acerto da Investida contra o Alvo neste Turno");
  const eventoId = `investida:resultado:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Resultado Já Aplicado");
  const atacante = sessao.log?.find((r) => r.contextoConteudo?.tipo === "disputaInvestida" && r.contextoConteudo.ataqueId === entrada.ataqueId
    && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Atacante");
  const alvo = sessaoAlvo.log?.find((r) => r.contextoConteudo?.tipo === "disputaInvestida" && r.contextoConteudo.disputaId === atacante?.contextoConteudo.disputaId
    && r.contextoConteudo.ataqueId === entrada.ataqueId && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Alvo");
  if (!jaAplicada(sessao, `investida:disputa:${entrada.ataqueId}`) || !jaAplicada(sessao, atacante?.contextoConteudo.disputaId)
    || ![atacante, alvo].every((r) => r?.tipo === "teste" && Number.isFinite(r.total))
    || atacante.sorte?.escolha === null || alvo.sorte?.escolha === null) return recusa(sessao, "Falta a Disputa ou Escolha de Sorte");
  const uso = usa(sessao, derived, { id: eventoId, nome: "Resultado da Investida", emCombate: true }, pedido);
  if (!uso.aplicado) return uso;
  const resistiu = alvo.total >= atacante.total;
  let sa = resistiu ? sessaoAlvo : defineCondicoes(sessaoAlvo, [...(sessaoAlvo.condicoes ?? []), { id: eventoId, nome: "Caído", rodadas: null }]);
  const marca = (s, r, extra = {}) => ({ ...s, log: s.log.map((x) => x.id === r.id ? { ...x, ...extra, consequenciasAplicadas: true } : x) });
  sa = marca(sa, alvo, { cd: atacante.total, sucesso: resistiu });
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Investida Aprimorada",
    detalhe: resistiu ? "Alvo Resistiu" : "Alvo Caído", ataqueId: entrada.ataqueId, alvoId: entrada.alvoId };
  return { ...uso, sessao: comOperacao(registraRolagem(marca(uso.sessao, atacante), registro), { id: eventoId, tipo: "investida-resultado" }),
    sessaoAlvo: registraRolagem(sa, registro), resistiu };
}

/** p.164/293. Repetir a reação não concede outra reação. O callback nativo rola o pedido devolvido. */
export function preparaOportunidadeConteudo(sessao, derived, entrada = {}, pedido = {}, alvo = null) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const bloqueio = alvo && bloqueioDeOportunidadeConteudo(alvo.sessao, entrada.voceId);
  if (bloqueio) return recusa(sessao, bloqueio);
  const perceber = talento(derived, "tal_perceber_oportunidade");
  const sentinela = entrada.fonte === "sentinela" && talento(derived, "tal_tecnicas_do_sentinela");
  if ((!perceber && !sentinela) || entrada.gatilhoValido !== true) return recusa(sessao, "Exige Talento e Gatilho de Oportunidade");
  const linha = derived.dano.entradas.find((l) => l.id === entrada.armaId && (l.chaveArma ?? null) === (entrada.chaveArma ?? null));
  if (!linha || !["basico", "arma", "escudo"].includes(linha.fonte)) return recusa(sessao, "Arma Indisponível");
  const nome = perceber ? "Perceber Oportunidade" : "Técnicas do Sentinela";
  const pedidoRolagem = { tipo: "teste", tipoTeste: "ataque", rotulo: `${linha.nome} · Acerto`, detalhe: nome,
    bonus: linha.acerto, dados: linha.acertoDados, margem: linha.margemCritico, linhaArma: linha,
    fontes: [...(linha.partesAcerto ?? []), { label: nome, texto: perceber ? "Vantagem" : "Golpe de Oportunidade" }],
    contextoConteudo: { tipo: "golpeOportunidade", operacaoId: pedido.opId, rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno,
      ...(entrada.voceId ? { atacanteId: entrada.voceId } : {}),
      ...(entrada.alvoId ? { alvoId: entrada.alvoId } : {}) },
    modo: modoCombinado(entrada.modo ?? "normal", { vantagem: perceber }) };
  const prova = prepararRolagem(pedidoRolagem, { sessao, derived, modo: pedidoRolagem.modo });
  if (!prova.ok) return recusa(sessao, motivoDaRecusa(prova, pedidoRolagem));
  const id = "golpe-oportunidade", numero = (sessao.usos?.[`rodada:uso:${id}`] ?? 0) + 1;
  const uso = usa(sessao, derived, { id, nome, emCombate: true,
    proibidoCom: [...proibidoCom, "Desorientado"], limite: { por: "rodada", max: perceber ? 2 : 1 } }, pedido);
  if (!uso.aplicado) return uso;
  let s = uso.sessao;
  if (pedido.registraAcao) {
    const acao = gastaAcao(s, derived, "reacao", { id: `${id}:${numero}` });
    if (acao.erro) return recusa(sessao, acao.erro);
    s = acao.sessao;
  }
  return { ...uso, sessao: s, pedidoRolagem, ...(alvo ? { sessaoAlvo: alvo.sessao } : {}) };
}

/** p.168. A reação contra quem ataca terceiro não é um Golpe de Oportunidade. */
export function preparaReacaoSentinela(sessao, derived, sessaoAtacante, _derivedAtacante, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!talento(derived, "tal_tecnicas_do_sentinela")) return recusa(sessao, "Técnicas do Sentinela Indisponível");
  if (entrada.emAlcanceEGatilhoAtual !== true || !entrada.voceId || !entrada.atacanteId || entrada.voceId === entrada.atacanteId) return recusa(sessao, "Exige Atacante a Até 1,5m e Gatilho Atual");
  const ataque = sessaoAtacante.log?.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === entrada.ataqueId);
  if (!ataque?.ataque?.alvo?.id || ataque.ataque.alvo.id === entrada.voceId
    || !jaAplicada(sessaoAtacante, `ataque-confirmado:${entrada.ataqueId}`)
    || ataque.rodada !== sessaoAtacante.rodada || ataque.turno !== usoDe(sessaoAtacante).acoes.turno) return recusa(sessao, "Exige Ataque Atual contra Outra Criatura");
  const eventoId = `sentinela:gatilho:${entrada.atacanteId}:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Reação a Este Ataque Já Usada");
  const linha = derived.dano.entradas.find((l) => l.id === entrada.armaId && (l.chaveArma ?? null) === (entrada.chaveArma ?? null));
  if (!linha || !["basico", "arma", "escudo"].includes(linha.fonte)) return recusa(sessao, "Arma Indisponível");
  const pedidoRolagem = { tipo: "teste", tipoTeste: "ataque", rotulo: `${linha.nome} · Acerto`, detalhe: "Técnicas do Sentinela",
    bonus: linha.acerto, dados: linha.acertoDados, margem: linha.margemCritico, linhaArma: linha,
    modo: entrada.modo ?? "normal", fontes: [...(linha.partesAcerto ?? []), { label: "Técnicas do Sentinela", texto: "Reação" }],
    contextoConteudo: { tipo: "reacaoSentinela", operacaoId: pedido.opId, rodada: sessao.rodada, turno: usoDe(sessao).acoes.turno,
      alvoId: entrada.atacanteId, ataqueGatilhoId: entrada.ataqueId } };
  const prova = prepararRolagem(pedidoRolagem, { sessao, derived, modo: pedidoRolagem.modo });
  if (!prova.ok) return recusa(sessao, motivoDaRecusa(prova, pedidoRolagem));
  const uso = usa(sessao, derived, { id: "tal_tecnicas_do_sentinela", nome: "Técnicas do Sentinela", emCombate: true,
    acao: "reacao", proibidoCom: [...proibidoCom, "Desorientado"], limite: { por: "rodada" } }, pedido);
  return uso.aplicado ? { ...uso, sessao: comOperacao(uso.sessao, { id: eventoId, tipo: "sentinela-reacao" }),
    sessaoAlvo: sessaoAtacante, pedidoRolagem } : uso;
}

function ataqueDeMobilidade(sessao, derived, entrada) {
  if (!talento(derived, "tal_tecnicas_de_mobilidade") || !entrada.alvoId) return null;
  return sessao.log?.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === entrada.ataqueId
    && r.ataque?.alvo?.id === entrada.alvoId && r.rodada === sessao.rodada && r.turno === usoDe(sessao).acoes.turno
    && r.turnoEmCurso?.id === entrada.turnoEmCurso?.id && r.turnoEmCurso?.turno === entrada.turnoEmCurso?.turno
    && r.turnoEmCurso?.rodada === entrada.turnoEmCurso?.rodada
    && jaAplicada(sessao, `ataque-confirmado:${r.ataqueId}`));
}

const turnoAtualValido = (s, t) => typeof t?.id === "string" && !!t.id && Number.isInteger(t.turno) && t.turno >= 0 && t.rodada === s.rodada;

/** p.167/365. O dano precisa ter sido infligido, cópias não somam e o prazo é do emissor. */
export function aplicaCorteConteudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const id = "tal_especialista_em_cortes", turno = entrada.turnoEmCurso;
  if (!talento(derived, id) || !turnoAtualValido(sessao, turno) || typeof entrada.voceId !== "string" || !entrada.voceId
    || !entrada.alvoId || entrada.alvoId === entrada.voceId) return recusa(sessao, "Exige Especialista em Cortes, Alvo e Turno em Curso");
  const evento = sessao.log?.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === entrada.ataqueId
    && r.ataque?.acertou && r.ataque.alvo?.id === entrada.alvoId && r.rodada === sessao.rodada && r.turno === usoDe(sessao).acoes.turno
    && r.turnoEmCurso?.id === turno.id && r.turnoEmCurso?.turno === turno.turno && r.turnoEmCurso?.rodada === turno.rodada
    && r.calculos?.some((c) => c.tipoDano === "ct" && c.final > 0) && jaAplicada(sessao, `ataque-confirmado:${r.ataqueId}`));
  if (!evento) return recusa(sessao, "Falta Acerto Atual com Dano Cortante Infligido ao Alvo");
  const uso = usa(sessao, derived, { id: `${id}:${turno.id}:${turno.turno}`, origem: id, nome: "Especialista em Cortes",
    emCombate: true, acesso: impedimentoParaAgirConteudo, proibidoCom, limite: { por: "turno" } }, pedido);
  if (!uso.aplicado) return uso;
  const ativoId = `${id}:${entrada.voceId}`;
  const efeito = usa(sessaoAlvo, derivedAlvo, { id: ativoId, origem: id, nome: "Especialista em Cortes", emCombate: true, renova: true,
    duracao: { ate: "cena" }, parametros: [
      { id: "fonteId", tipo: "opcao", opcoes: [entrada.voceId], padrao: entrada.voceId },
      { id: "operacaoId", tipo: "opcao", opcoes: [pedido.opId], padrao: pedido.opId },
    ], efeitos: [{ tipo: "buff", canal: "movimento", expr: "-4.5" }],
  }, { opId: `${pedido.opId}:alvo` });
  if (!efeito.aplicado) return recusa(sessao, efeito.erro);
  const fx = efeito.sessao.uso.ativos[ativoId].efeitos.find((e) => e.tipo === "buff");
  const buff = efeito.sessao.buffs.find((b) => b.id === fx?.id);
  if (!buff) return recusa(sessao, "Redução de Movimento Não Aplicada");
  const alvo = comBuff(efeito.sessao, { ...buff, grupoNaoAcumula: id });
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Especialista em Cortes",
    detalhe: "Movimento Reduzido em 4,5m", ataqueId: entrada.ataqueId, alvoId: entrada.alvoId, fonteId: entrada.voceId,
    turnoEmCurso: turno, reducaoMovimento: 4.5, fontes: [{ label: "Especialista em Cortes", valor: -4.5 }] };
  return { ...uso, sessao: registraRolagem(uso.sessao, registro), sessaoAlvo: registraRolagem(alvo, registro) };
}

/** Encerra somente as instâncias desse emissor, pelos verbos de CL1. */
export function encerraCortesNoInicioDoTurno(combatentes, fonteId, motivo = "inicioDoProximoTurno") {
  return combatentes.map((c) => {
    let sessao = c.sessao;
    for (const ativo of Object.values(sessao?.uso?.ativos ?? {})) {
      if (ativo.origem !== "tal_especialista_em_cortes" || ativo.parametros?.fonteId !== fonteId) continue;
      const r = encerraUso(sessao, null, ativo.id, { opId: `${ativo.parametros.operacaoId}:fim`, motivo });
      if (r.aplicado) sessao = r.sessao;
    }
    return sessao === c.sessao ? c : { ...c, sessao };
  });
}

/** p.168. Ao atacar, mesmo errando. O limite é da disputa, não da vitória. */
export function rolaDisputaMobilidade(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!ataqueDeMobilidade(sessao, derived, entrada) || !turnoAtualValido(sessao, entrada.turnoEmCurso)) return recusa(sessao, "Exige Ataque Atual contra o Alvo e Turno em Curso");
  const eventoId = `mobilidade:disputa:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Disputa deste Ataque Já Rolada");
  const linha = derived.testes.resistencias.find((r) => r.value === "reflexos"), outra = derivedAlvo.testes.resistencias.find((r) => r.value === "reflexos");
  if (!linha || !outra) return recusa(sessao, "Reflexos Indisponível");
  const uso = usa(sessao, derived, { id: "tal_tecnicas_de_mobilidade", nome: "Técnicas de Mobilidade", emCombate: true,
    proibidoCom, limite: { por: "rodada" } }, pedido);
  if (!uso.aplicado) return uso;
  const contexto = { tipo: "mobilidade", disputaId: pedido.opId, ataqueId: entrada.ataqueId, alvoId: entrada.alvoId, turnoEmCurso: entrada.turnoEmCurso };
  const teste = (l, papel, modo, rng) => ({ ...rolarTeste({ rotulo: "Reflexos", detalhe: "Técnicas de Mobilidade", bonus: l.bonus,
    dados: l.dadosExtras, margem: l.margemCritico, minimoNatural: l.minimoNatural, modo: modo ?? "normal", fontes: l.partes,
    contextoConteudo: { ...contexto, papel } }, rng), resistenciaId: "reflexos" });
  const atacante = teste(linha, "Atacante", entrada.modoAtacante, entrada.rngAtacante), alvo = teste(outra, "Alvo", entrada.modoAlvo, entrada.rngAlvo);
  return { ...uso, sessao: comOperacao(registraRolagem(uso.sessao, atacante), { id: eventoId, tipo: "mobilidade-disputa" }),
    sessaoAlvo: registraRolagem(sessaoAlvo, alvo), atacante, alvo };
}

/** Decisão do autor: a proteção acaba no fim do turno em curso. */
export function aplicaDisputaMobilidade(sessao, derived, sessaoAlvo, _derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  if (!ataqueDeMobilidade(sessao, derived, entrada) || !turnoAtualValido(sessao, entrada.turnoEmCurso)) return recusa(sessao, "Exige Ataque Atual e Turno em Curso");
  const eventoId = `mobilidade:resultado:${entrada.ataqueId}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Mobilidade deste Ataque Já Resolvida");
  const atacante = sessao.log?.find((r) => r.contextoConteudo?.tipo === "mobilidade" && r.contextoConteudo.ataqueId === entrada.ataqueId
    && r.contextoConteudo.alvoId === entrada.alvoId && r.contextoConteudo.papel === "Atacante"), ctx = atacante?.contextoConteudo;
  const alvo = sessaoAlvo.log?.find((r) => r.contextoConteudo?.tipo === "mobilidade" && r.contextoConteudo.disputaId === ctx?.disputaId && r.contextoConteudo.papel === "Alvo");
  if (!ctx || !jaAplicada(sessao, ctx.disputaId) || !jaAplicada(sessao, `mobilidade:disputa:${entrada.ataqueId}`)
    || ![atacante, alvo].every((r) => r?.tipo === "teste" && Number.isFinite(r.total) && !testeComConsequencias(r) && r.sorte?.escolha !== null)
    || alvo.contextoConteudo.alvoId !== entrada.alvoId || alvo.contextoConteudo.ataqueId !== entrada.ataqueId || ctx.turnoEmCurso.id !== entrada.turnoEmCurso.id
    || ctx.turnoEmCurso.turno !== entrada.turnoEmCurso.turno || ctx.turnoEmCurso.rodada !== entrada.turnoEmCurso.rodada) return recusa(sessao, "Falta Disputa Atual ou Escolha de Sorte");
  const resistiu = alvo.total >= atacante.total;
  const uso = usa(sessao, derived, { id: eventoId, nome: "Resultado de Técnicas de Mobilidade" }, pedido);
  if (!uso.aplicado) return uso;
  let s = uso.sessao;
  if (!resistiu) {
    const turno = entrada.turnoEmCurso;
    const protecao = usa(s, derived, { id: `tal_tecnicas_de_mobilidade:${entrada.alvoId}`, nome: "Técnicas de Mobilidade", origem: "tal_tecnicas_de_mobilidade",
      renova: true, emCombate: true, duracao: { ate: "fimDoTurno" }, parametros: [
        { id: "turnoEmCurso", tipo: "opcao", opcoes: [turno.id], padrao: turno.id },
        { id: "sequenciaTurno", tipo: "faixa", min: turno.turno, max: turno.turno, padrao: turno.turno },
        { id: "operacaoId", tipo: "opcao", opcoes: [pedido.opId], padrao: pedido.opId },
      ] }, { opId: `${pedido.opId}:protecao` });
    if (!protecao.aplicado) return recusa(sessao, protecao.erro);
    s = protecao.sessao;
  }
  const marca = (s, r) => ({ ...s, log: s.log.map((x) => x.id === r.id ? { ...x, consequenciasAplicadas: true } : x) });
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Técnicas de Mobilidade", ataqueId: entrada.ataqueId,
    alvoId: entrada.alvoId, resistiu, detalhe: resistiu ? "Alvo Resistiu" : "Protegido da Oportunidade deste Alvo", fontes: [{ label: "Técnicas de Mobilidade", texto: "Até o Fim do Turno em Curso" }] };
  return { ...uso, sessao: comOperacao(registraRolagem(marca(s, atacante), registro), { id: eventoId, tipo: "mobilidade-resultado" }),
    sessaoAlvo: marca(sessaoAlvo, alvo), resistiu };
}

/** O Encontro fornece o turno que terminou, o encerramento continua em CL1. */
export function encerraMobilidadeNoTurnoEmCurso(combatentes, turno) {
  return combatentes.map((c) => {
    let sessao = c.sessao;
    for (const ativo of Object.values(sessao?.uso?.ativos ?? {})) {
      if (ativo.origem !== "tal_tecnicas_de_mobilidade" || ativo.parametros?.turnoEmCurso !== turno.id || ativo.parametros.sequenciaTurno !== turno.turno) continue;
      const r = encerraUso(sessao, null, ativo.id, { opId: `${ativo.parametros.operacaoId}:fim`, motivo: "fimDoTurno" });
      if (r.aplicado) sessao = r.sessao;
    }
    return sessao === c.sessao ? c : { ...c, sessao };
  });
}

/** p.167. O alvo é o do ataque já confirmado. Posição e espaço livre são declarados pela mesa. */
export function deslocaAlvoTalento(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const chicote = entrada.talento === "tal_mestre_dos_chicotes";
  const id = chicote ? entrada.talento : "tal_especialista_em_concussao";
  if (entrada.talento !== id || !talento(derived, id)) return recusa(sessao, "Talento Indisponível");
  const confirmado = sessao.log?.find((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === entrada.ataqueId
    && r.ataque?.alvo?.id === entrada.alvoId && r.ataque.acertou === true);
  const ataque = sessao.log?.find((r) => r.id === entrada.ataqueId && r.tipoTeste === "ataque");
  const linha = derived.dano?.entradas?.find((l) => l.id === ataque?.armaId && (l.chaveArma ?? null) === (ataque.chaveArma ?? null));
  if (!confirmado || !linha || confirmado.rodada !== sessao.rodada || confirmado.turno !== usoDe(sessao).acoes.turno) return recusa(sessao, "Falta Acerto Confirmado neste Turno contra o Alvo");
  if (chicote && linha.grupo !== "chicote") return recusa(sessao, "Exige Acerto com Chicote");
  if (!chicote && (!corpo(linha) || !confirmado.calculos?.some((c) => c.tipoDano === "im" && c.final > 0))) return recusa(sessao, "Exige Dano de Impacto Corpo a Corpo");
  const distancia = Number(entrada.distancia);
  if (!Number.isFinite(distancia) || distancia < 0 || distancia > 3) return recusa(sessao, "Distância Fora do Limite");
  if (distancia > 0 && recursosDeEspecializacao(sessaoAlvo, derivedAlvo).imuneMovimentoForcado) return recusa(sessao, "Alvo Imune a Movimento Forçado");
  if (!chicote) {
    const tamanho = (d) => AFTY_TAMANHOS.find((t) => t.value === d.tamanho)?.passo;
    if (tamanho(derived) == null || tamanho(derivedAlvo) == null || tamanho(derivedAlvo) - tamanho(derived) >= 2) return recusa(sessao, "Tamanho do Alvo Impede");
    if (entrada.espacoDesocupado !== true) return recusa(sessao, "Falta Confirmar Espaço Desocupado");
  }
  const nome = chicote ? "Mestre dos Chicotes" : "Especialista em Concussão";
  const uso = usa(sessao, derived, { id, nome, emCombate: true, proibidoCom, limite: { por: "turno" } }, pedido);
  if (!uso.aplicado) return uso;
  let rolagem = null, alvo = sessaoAlvo;
  if (chicote) {
    const tr = derivedAlvo.testes.resistencias.find((t) => t.value === "fortitude");
    if (!tr) return recusa(sessao, "Teste do Alvo Indisponível");
    rolagem = { ...rolarTeste({ rotulo: tr.label, detalhe: nome, bonus: tr.bonus, dados: tr.dadosExtras,
      margem: tr.margemCritico, minimoNatural: tr.minimoNatural, cd: derived.cd }, entrada.rng), consequenciasAplicadas: true };
    alvo = registraRolagem(alvo, rolagem);
  }
  const deslocamento = rolagem?.sucesso ? 0 : distancia;
  if (deslocamento > 0) alvo = abreTesteDeConcentracao(alvo, "movido", { distancia: deslocamento }, { opId: `${pedido.opId}:concentracao` }).sessao;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: nome,
    ataqueId: entrada.ataqueId, alvoId: entrada.alvoId, deslocamento,
    detalhe: rolagem?.sucesso ? "Resistiu" : `${chicote ? "Puxado" : "Movido"} ${deslocamento}m`, fontes: [{ label: nome, texto: "Até 3m" }] };
  return { ...uso, sessao: registraRolagem(uso.sessao, registro), sessaoAlvo: registraRolagem(alvo, registro), rolagem, deslocamento };
}

/** p.168. Caído e o bônus de Defesa usam os mesmos escritores da sessão. */
export function usaMovimentosAcrobaticos(sessao, derived, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const id = "tal_movimentos_acrobaticos";
  const caido = (sessao.condicoes ?? []).find((c) => (typeof c === "string" ? c : c.nome) === "Caído");
  if (!talento(derived, id) || !caido) return recusa(sessao, "Exige Talento e Condição Caído");
  const eventoId = `acrobacia:caido:${caido.id ?? `${sessao.rodada}:${usoDe(sessao).acoes.turno}`}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Queda Já Testada");
  if (!["tecnica", "atletismo"].includes(entrada.origem) || entrada.dificuldade === "" || !Number.isFinite(Number(entrada.dificuldade))) return recusa(sessao, "Falta o Teste de Atletismo ou a CD da Técnica");
  const linha = derived.testes.pericias.find((p) => p.id === "acrobacia");
  if (!linha) return recusa(sessao, "Acrobacia Indisponível");
  const bonus = Math.floor(derived.mods.destreza / 2);
  const desc = { id, nome: "Movimentos Acrobáticos", acao: "livre", proibidoCom, duracao: { rodadas: 1 },
    efeitos: [{ tipo: "buff", canal: "defesa", expr: String(bonus) }] };
  const avaliacao = avaliaUso(sessao, derived, desc, pedido);
  if (!avaliacao.ok) return recusa(sessao, avaliacao.motivo);
  const rolagem = { ...rolarTeste({ rotulo: "Acrobacia", detalhe: desc.nome, periciaId: linha.id, bonus: linha.bonus,
    dados: linha.dadosExtras, margem: linha.margemCritico, minimoNatural: linha.minimoNatural, cd: Number(entrada.dificuldade) }, entrada.rng), consequenciasAplicadas: true };
  let s = sessao;
  if (rolagem.sucesso) {
    const uso = usa(s, derived, desc, pedido);
    if (!uso.aplicado) return uso;
    s = defineCondicoes(uso.sessao, (s.condicoes ?? []).filter((c) => (typeof c === "string" ? c : c.nome) !== "Caído"));
    s = registraRolagem(s, { id: `${pedido.opId}:movimento`, ts: Date.now(), tipo: "info", rotulo: desc.nome,
      detalhe: "Levantou e Moveu 3m sem Golpe de Oportunidade", deslocamento: 3 });
  } else s = comOperacao(s, { id: pedido.opId, tipo: "movimentos-acrobaticos" });
  return { sessao: comOperacao(registraRolagem(s, rolagem), { id: eventoId, tipo: "movimentos-acrobaticos" }), aplicado: true, rolagem, levantou: rolagem.sucesso, bonusDefesa: rolagem.sucesso ? bonus : 0 };
}

/** p.105. A queda vem do recibo de dano de CL2, salvo pelo cliente de ataque. */
export function usaMobilidadeAvancada(sessao, derived, sessaoAlvo, _derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const real = derived.habilidades?.efetivas?.find((id) => id.replace(/^.*__/, "") === "sup_mobilidade_avancada"
    && !derived.habilidades.inacessiveis?.includes(id));
  if (!real || entrada.aliadoEmDirecao !== true) return recusa(sessao, "Exige Habilidade e Movimento em Direção ao Aliado");
  if (sessaoAlvo.vital?.estado !== "morrendo" || sessaoAlvo.especializacaoSessao?.modoMorte === "mesmo_morto") return recusa(sessao, "Aliado Não Está nas Portas da Morte");
  const queda = sessaoAlvo.log?.find((r) => r.id === entrada.quedaId && r.rotulo === "Ataque Confirmado" && r.abateu
    && r.ataque?.alvo?.id === entrada.alvoId && r.estadoVitalAlvo === "morrendo"
    && r.rodada === sessao.rodada && r.rodada === sessaoAlvo.rodada && r.eventosAlvo?.some((e) => e.abateu));
  const eventoId = `mobilidade-avancada:${queda?.id}`;
  if (!queda || jaAplicada(sessao, eventoId)) return recusa(sessao, "Falta Queda Recente Ainda Não Usada");
  const uso = usa(sessao, derived, { id: real, nome: "Mobilidade Avançada", acao: "reacao",
    proibidoCom: [...proibidoCom, "Imóvel", "Agarrado"] }, pedido);
  if (!uso.aplicado) return uso;
  const distancia = derived.movimento / 2;
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Mobilidade Avançada",
    detalhe: `Movimento em Direção ao Aliado: ${distancia}m`, alvoId: entrada.alvoId, quedaId: queda.id, distancia,
    fontes: [...(derived.partes?.movimento ?? []), { label: "Mobilidade Avançada", texto: "Metade" }] };
  return { ...uso, sessao: comOperacao(registraRolagem(uso.sessao, registro), { id: eventoId, tipo: "mobilidade-avancada" }), sessaoAlvo, distancia };
}
