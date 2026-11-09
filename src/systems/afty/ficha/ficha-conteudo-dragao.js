// Livro p.76. O dano secundário usa o recibo confirmado e os verbos de CL1/CL2.
import { posturaAtivaConteudo } from "./ficha-conteudo-posturas";
import { usa } from "./ficha-uso";
import { usoDe, jaAplicada, comOperacao } from "./ficha-uso-estado";
import { registraRolagem } from "./ficha-sessao";
import { rolarTeste } from "./ficha-rolagem";
import { resolveTR } from "./ficha-ataque";
import { aplicaDanoRecebido, preparaDanoRecebido } from "./ficha-dano-recebido";
import { impedimentoParaAgirConteudo, testeComConsequencias } from "./ficha-conteudo-acesso";
import { renovaEnergiaPorEvento } from "./ficha-conteudo-combate";
import { drenaAuraAoMatar } from "./ficha-conteudo-aura-drenadora";
import { preparaReacaoAoDano } from "./ficha-conteudo-reacoes";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });
const identidade = (s, p) => typeof p.opId !== "string" || !p.opId ? recusa(s, "Sem Identidade da Operação")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;
const mesmoTurno = (a, b) => !!a?.id && a.id === b?.id && a.rodada === b.rodada && a.turno === b.turno;
const chaveDoPar = (ataqueId, alvoId) => `dragao:${ataqueId}:${alvoId}`;

/** Dois ou mais restos exigem decidir a qual tipo pertence o dano restante. */
export function metadesDoDragao(calculos = []) {
  if (calculos.filter((c) => c.final % 2 !== 0).length > 1) return null;
  return calculos.map((c) => ({ tipoDano: c.tipoDano, total: Math.floor(c.final / 2) })).filter((c) => c.total > 0);
}

/** Não aceita entrar em Dragão depois de realizar o ataque. */
export function ataquesParaDragao(sessao, derived, turnoEmCurso) {
  if (!posturaAtivaConteudo(sessao, derived, "dragao") || !turnoEmCurso?.id || turnoEmCurso.rodada !== sessao.rodada) return [];
  return (sessao.log ?? []).filter((r) => {
    const pedido = sessao.log.find((x) => x.id === r.ataqueId && x.tipoTeste === "ataque");
    return r.rotulo === "Ataque Confirmado" && r.ataque?.alvo?.id && jaAplicada(sessao, `ataque-confirmado:${r.ataqueId}`)
      && r.rodada === sessao.rodada && r.turno === usoDe(sessao).acoes.turno && mesmoTurno(r.turnoEmCurso, turnoEmCurso)
      && pedido?.contextoTurno?.posturaDragao === true && mesmoTurno(pedido.contextoTurno.emCurso, turnoEmCurso);
  });
}

/** O TR fica na sessão do inimigo, ainda sem consequência para permitir suas rerrolagens. */
export function rolaDragaoConteudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const ataque = ataquesParaDragao(sessao, derived, entrada.turnoEmCurso).find((r) => r.ataqueId === entrada.ataqueId);
  const fonte = posturaAtivaConteudo(sessao, derived, "dragao");
  if (!ataque || !fonte) return recusa(sessao, "Falta Ataque Atual Realizado na Postura do Dragão");
  if (!entrada.voceId || !entrada.alvoId || entrada.alvoId === entrada.voceId || entrada.alvoId === ataque.ataque.alvo.id
    || entrada.inimigo !== true || entrada.em1_5mDoAlvo !== true) return recusa(sessao, "Exige Outro Inimigo em 1,5m do Alvo Original");
  if (sessaoAlvo.vital?.estado === "morto") return recusa(sessao, "Alvo Já Morto");
  const par = chaveDoPar(entrada.ataqueId, entrada.alvoId);
  if (jaAplicada(sessao, par)) return recusa(sessao, "Fortitude deste Inimigo Já Rolada para o Ataque");
  const fort = derivedAlvo.testes?.resistencias?.find((r) => r.value === "fortitude");
  if (!fort || !Number.isFinite(derived.cd) || !["normal", "vantagem", "desvantagem"].includes(entrada.modoAlvo ?? "normal")) return recusa(sessao, "Fortitude ou CD Indisponível");
  const uso = usa(sessao, derived, { id: par, origem: fonte.id, nome: fonte.nome, emCombate: true,
    acesso: impedimentoParaAgirConteudo }, pedido);
  if (!uso.aplicado) return uso;
  const contexto = { tipo: "posturaDragao", operacaoId: pedido.opId, ataqueId: entrada.ataqueId, alvoId: entrada.alvoId,
    voceId: entrada.voceId, alvoOriginalId: ataque.ataque.alvo.id, turnoEmCurso: entrada.turnoEmCurso, cd: derived.cd,
    danoOriginal: (ataque.calculos ?? []).map((c) => ({ tipoDano: c.tipoDano, final: c.final })) };
  const rolagem = { ...rolarTeste({ rotulo: "Fortitude", detalhe: fonte.nome, bonus: fort.bonus, dados: fort.dadosExtras,
    margem: fort.margemCritico, minimoNatural: fort.minimoNatural, cd: derived.cd, modo: entrada.modoAlvo ?? "normal",
    contextoConteudo: contexto, fontes: [...fort.partes, { label: fonte.nome, texto: `CD ${derived.cd}` }] }, entrada.rngAlvo), resistenciaId: "fortitude" };
  const registro = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: fonte.nome,
    detalhe: "Fortitude Pendente", contextoDragao: contexto, testeId: rolagem.id, fontes: fonte.partes };
  return { ...uso, rolagem, sessao: comOperacao(registraRolagem(uso.sessao, registro), { id: par, tipo: "dragao-tr" }),
    sessaoAlvo: registraRolagem(sessaoAlvo, rolagem) };
}

/** Metade por instância tipada, passando pelas defesas/concentração do destinatário em CL2. */
export function aplicaDragaoConteudo(sessao, derived, sessaoAlvo, derivedAlvo, entrada = {}, pedido = {}) {
  const guard = identidade(sessao, pedido); if (guard) return guard;
  const registro = sessao.log?.find((r) => r.testeId === entrada.testeId && r.contextoDragao?.tipo === "posturaDragao");
  const ctx = registro?.contextoDragao;
  const teste = sessaoAlvo.log?.find((r) => r.id === entrada.testeId && r.tipo === "teste" && r.resistenciaId === "fortitude");
  const par = ctx ? chaveDoPar(ctx.ataqueId, ctx.alvoId) : null;
  if (!ctx || !teste || teste.contextoConteudo?.operacaoId !== ctx.operacaoId || teste.contextoConteudo.alvoId !== entrada.alvoId
    || ctx.alvoId !== entrada.alvoId || ctx.voceId !== entrada.voceId || !mesmoTurno(ctx.turnoEmCurso, entrada.turnoEmCurso)
    || !jaAplicada(sessao, ctx.operacaoId) || !jaAplicada(sessao, par) || !ataquesParaDragao(sessao, derived, entrada.turnoEmCurso).some((r) => r.ataqueId === ctx.ataqueId)
    || teste.sorte?.escolha === null || testeComConsequencias(teste)) return recusa(sessao, "Falta Fortitude Atual Resolvida sem Consequência");
  const resultadoId = `${par}:resultado`;
  if (jaAplicada(sessao, resultadoId)) return recusa(sessao, "Dragão Já Resolvido para este Inimigo");
  const tr = resolveTR({ cd: ctx.cd, rolagem: teste });
  if (!tr.ok) return recusa(sessao, tr.erro);
  const metades = tr.resultado === "falha" ? metadesDoDragao(ctx.danoOriginal) : [];
  if (!metades) return recusa(sessao, "Divisão do Dano Misto Requer Resolução na Mesa");
  if (metades.some((g) => g.tipoDano === "energia_reversa") && derivedAlvo.origemEstruturalId !== "maldicao") return recusa(sessao, "Dano de Energia Reversa do Dragão Requer Resolução na Mesa");
  const danos = [];
  for (const g of metades) {
    const parametros = { total: g.total, tipo: g.tipoDano, ataqueId: ctx.ataqueId,
      desempate: entrada.desempatesPorTipo?.[g.tipoDano] || entrada.desempate };
    const prova = preparaDanoRecebido(derivedAlvo, parametros);
    if (!prova.ok) return recusa(sessao, prova.erro);
    danos.push({ ...prova, tipo: g.tipoDano, parametros });
  }
  const mesa = entrada.mesa;
  const turno = mesa?.origemId === ctx.voceId && mesmoTurno(mesa.turnoEmCurso, ctx.turnoEmCurso) ? mesa.turnoEmCurso : null;
  const defesa = preparaReacaoAoDano(sessaoAlvo, derivedAlvo, {
    origemId: ctx.voceId, turnoEmCurso: turno, danos, opId: `${pedido.opId}:reacao`, rng: entrada.rngReacao,
  }, entrada.janelaReacao, [ctx.ataqueId, ctx.alvoId, teste.id, tr]);
  if (defesa.erro) return recusa(sessao, defesa.erro);
  if (defesa.janelaReacao) return { sessao, aplicado: false, janelaReacao: defesa.janelaReacao };
  const reacao = defesa.aplicar?.();
  if (reacao?.erro) return recusa(sessao, reacao.erro);
  const reacaoDano = reacao?.reacao;
  let alvo = reacao?.sessao ?? sessaoAlvo;
  const calculos = [], eventos = [];
  for (const { tipo, parametros } of danos) {
    const reducaoReacao = reacaoDano && !reacaoDano.pv && reacaoDano.tipo === tipo ? reacaoDano : null;
    const dano = aplicaDanoRecebido(alvo, derivedAlvo, { ...parametros, reducaoReacao }, { opId: `${pedido.opId}:dano:${tipo}` });
    if (!dano.aplicado) return recusa(sessao, dano.erro);
    alvo = dano.sessao; calculos.push({ ...dano.calculo, tipoDano: tipo }); eventos.push(dano.evento);
  }
  const renovacao = renovaEnergiaPorEvento(sessao, derived, { inimigo: true, abateu: eventos.some((e) => e.abateu) });
  const dreno = drenaAuraAoMatar(renovacao.sessao, derived, sessaoAlvo, alvo, {
    inimigo: true, ataqueId: ctx.ataqueId, alvoId: ctx.alvoId, rng: entrada.rngAuraDrenadora,
  });
  const concluida = { id: `${pedido.opId}:registro`, ts: Date.now(), tipo: "info", rotulo: "Postura do Dragão",
    detalhe: tr.resultado === "sucesso" ? "Fortitude Resistiu" : "Dano Aplicado", ataqueId: ctx.ataqueId, alvoId: ctx.alvoId,
    testeId: teste.id, tr, calculos, eventos, energiaRecuperada: renovacao.recuperado,
    ...(reacaoDano ? { reacaoDano } : {}),
    ...(dreno.pv ? { pvTemporarioGanho: dreno.pv } : {}),
    fontes: [{ label: "Dano Recebido pelo Alvo Original", valor: ctx.danoOriginal.reduce((s, g) => s + g.final, 0) },
      { label: "Postura do Dragão", texto: "Metade" }, ...(renovacao.fontes ?? [])] };
  const fonte = comOperacao(comOperacao(dreno.sessao, { id: pedido.opId, tipo: "dragao-resultado" }), { id: resultadoId, tipo: "dragao-resultado" });
  alvo = registraRolagem(registraRolagem(alvo, { ...teste, consequenciasAplicadas: true }), concluida);
  return { sessao: registraRolagem(fonte, concluida), sessaoAlvo: alvo, aplicado: true, tr, calculos, energiaRecuperada: renovacao.recuperado };
}
