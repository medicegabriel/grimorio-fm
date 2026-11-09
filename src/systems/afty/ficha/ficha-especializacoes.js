import { rolarTeste, rolarDano } from "./ficha-rolagem";
// O saldo negativo e as falhas de morte moram no estado vital (CL2). Aqui ficam só os MODOS do Restringido. FOLHA.
import { vitalEmBranco, estabilizado, comFalhas, curaNaSessao } from "./ficha-vital";
import { avaliarAcessoAltoNivel, getHabilidadeApice } from "../afty-alto-nivel";
import { modoCombinado } from "../afty-propriedades-armas";

const inteiro = (n) => Math.max(0, Math.trunc(Number(n) || 0));
const tem = (d, id) => (d?.habilidades?.canonicas ?? d?.habilidades?.efetivas ?? []).includes(id);
const estado = (s) => ({ turno: 0, reacoesGastas: 0, reacoesExtras: 0, acoesComuns: 0,
  modoMorte: null, ...s.especializacaoSessao });
const vitalDe = (s) => s.vital ?? vitalEmBranco();
const estaMorta = (s) => s.vital?.estado === "morto";
const comFalhasNaSessao = (s, n) => ({ ...s, vital: comFalhas(vitalDe(s), n) });
const patch = (s, p) => ({ ...s, especializacaoSessao: { ...estado(s), ...p } });
const log = (s, r) => ({ ...s, log: [r, ...(s.log ?? [])].slice(0, 50) });
/* Ainda de Pé e Rejeitar a Morte são EXCEÇÕES à regra geral da cura (que quita o saldo antes de subir o PV): elas põem o
   PV direto e encerram a queda, e por isso zeram o saldo e os sucessos. As FALHAS ficam, como em toda saída das Portas. */
const recupera = (s, n, max) => patch({ ...s, hpAtual: Math.min(max, inteiro(s.hpAtual) + inteiro(n)), vital: estabilizado(vitalDe(s)) },
  { modoMorte: null, quedaPendente: false, cairNoProximoDano: false });

function imunidadeMovimentoForcado(d) {
  if (!d.efeitos) return tem(d, "res_barreira_inamovivel") || !!d.combate?.imuneMovimentoForcado;
  let valor = d.efeitos.porCanal?.imunidadeMovimentoForcado ?? 0;
  const fontesApice = (d.efeitos.detalhes ?? []).filter((e) => e.canal === "imunidadeMovimentoForcado" && e.origem === "api_invencivel_sob_o_sol");
  if (fontesApice.length && (d.altoNivel?.lendarias?.inacessiveis?.includes("len_atingir_apice")
    || !avaliarAcessoAltoNivel(getHabilidadeApice("api_invencivel_sob_o_sol"), {
      nd: d.nd, niveisPorEspec: d.habilidades?.niveisPorEspec,
      habilidades: (d.habilidades?.efetivas ?? []).filter((id) => !d.habilidades?.inacessiveis?.includes(id)).map((id) => id.replace(/^.*__/, "")),
    }).ok)) valor -= fontesApice.reduce((soma, e) => soma + e.valor, 0);
  return valor > 0;
}

export function recursosDeEspecializacao(s, d) {
  const e = estado(s);
  const instintos = tem(d, "res_instintos_agucados") && s.hpAtual > d.hp / 2 && s.peAtual > d.pe / 2;
  const ainda = tem(d, "res_ainda_de_pe") && inteiro(s.usos?.["hab:res_ainda_de_pe"]) < 1;
  return { ...e, instintos, ainda,
    /* Os dois nomes antigos continuam publicados, lidos agora do estado vital. */
    pvNegativos: inteiro(s.vital?.saldo),
    falhasMorte: inteiro(s.vital?.falhas),
    reacoes: Math.max(0, 1 + Number(instintos) + inteiro(e.reacoesExtras) - inteiro(e.reacoesGastas)),
    cdRejeitar: 15 + Math.floor(inteiro(s.vital?.saldo) / 3),
    cdMesmoMorto: 25 + Math.floor(inteiro(s.vital?.saldo) / 5),
    custoAtaqueExtra: s.combate?.surtoAdrenalina && s.combate?.adrenalinaAbsoluta ? 1 : 2,
    pulos: tem(d, "res_perceber_o_ar") ? 1 + Number(d.nd >= 13) + Number(d.nd >= 17) : 0,
    quedaImuneAte: tem(d, "res_perceber_o_ar") ? 2 * d.movimento : 0,
    saltoAdicional: d.configuracaoEspecializacao?.forcaDevastadora ? 3 : 0,
    imuneMovimentoForcado: imunidadeMovimentoForcado(d),
    ignoraTerrenoDificil: !!d.configuracaoEspecializacao?.agilidadeEximia,
    imuneDominio: tem(d, "res_restricao_definitiva"),
  };
}

/* Chamado depois de descontar a casca e a Vida, e DEPOIS de o estado vital registrar a queda (o saldo negativo já
   está lá). Aqui entra só o que é do Restringido: os modos da queda e a falha do "cair no próximo dano". */
export function registrarQuedaEspecializacao(s, d) {
  if (!d || !["res_ainda_de_pe", "res_rejeitar_a_morte", "res_mesmo_morto"].some((id) => tem(d, id))) return s;
  if (s.hpAtual > 0) return s;
  const e = recursosDeEspecializacao(s, d);
  if (e.cairNoProximoDano) return patch(comFalhasNaSessao(s, 1), { modoMorte: "caido", cairNoProximoDano: false, quedaPendente: false });
  if (!e.ainda && tem(d, "res_mesmo_morto") && e.modoMorte !== "caido") {
    return patch(s, { modoMorte: "mesmo_morto", quedaPendente: false });
  }
  return patch(s, { quedaPendente: e.ainda, modoMorte: e.modoMorte ?? "portas_da_morte" });
}

export function usarEfeitoEspecializacao(s, d, id, rng = Math.random) {
  /* Ainda de Pé, Rejeitar a Morte e a falha garantida deste último não valem para um corpo que já morreu (CL2). */
  if (estaMorta(s) && ["res_ainda_de_pe", "res_ainda_de_pe_letal", "res_rejeitar_a_morte"].includes(id)) return s;
  const e = recursosDeEspecializacao(s, d);
  if (id === "reacao" && e.reacoes > 0) return patch(s, { reacoesGastas: inteiro(e.reacoesGastas) + 1 });
  if (id === "res_reacao_rapida" && tem(d, id) && e.reacoesGastas > 0 && e.rapidaRodada !== s.rodada) {
    return patch(s, { reacoesExtras: inteiro(e.reacoesExtras) + 1, rapidaRodada: s.rodada });
  }
  if (id === "res_ataque_extra" && tem(d, id)) return { ...s, combate: { ...s.combate, resAtaqueExtra: !s.combate?.resAtaqueExtra } };
  if (id === "res_precisao_forcada" && tem(d, id) && e.precisaoRodada !== s.rodada) {
    return patch({ ...s, combate: { ...s.combate, precisaoForcada: true } }, { precisaoRodada: s.rodada });
  }
  if (id === "cmb_surto_de_acao" && tem(d, id) && e.surtoAcaoRodada !== s.rodada) {
    const u = d.usosHabilidades?.[id];
    if (!u || inteiro(s.usos?.[u.chave]) >= u.max) return s;
    return patch({ ...s, usos: { ...s.usos, [u.chave]: inteiro(s.usos?.[u.chave]) + 1 } },
      { surtoAcaoRodada: s.rodada, acoesComuns: inteiro(e.acoesComuns) + 1 });
  }
  if (id === "acao_comum" && e.acoesComuns > 0) return patch(s, { acoesComuns: e.acoesComuns - 1 });
  if (id === "manter_surto" && s.combate?.surtoAdrenalina) return patch(s, { manterSurto: true });
  if (id === "encerrar_foco") return { ...s, combate: { ...s.combate, focoInimigo: false, focoAlvo: "" } };
  if (["res_ainda_de_pe", "res_ainda_de_pe_letal"].includes(id) && e.ainda && s.hpAtual === 0) {
    let proxima = { ...s, usos: { ...s.usos, "hab:res_ainda_de_pe": 1 } };
    if (id.endsWith("_letal")) return patch(recupera(proxima, 1, d.hp), { cairNoProximoDano: true });
    const l = d.cura?.linhas?.find((x) => x.id === "cura_ainda_de_pe");
    if (!l) return s;
    const r = rolarDano({ rotulo: l.nome, tom: "cura", dados: l.dados, faces: Number(l.dado.slice(1)), fixo: l.fixo }, rng);
    proxima = log(proxima, r);
    return recupera(proxima, r.total, d.hp);
  }
  if (id === "res_rejeitar_a_morte" && tem(d, id) && s.hpAtual === 0) {
    const tr = d.testes.resistencias.find((x) => x.value === "fortitude");
    const r = rolarTeste({ rotulo: "Rejeitar a Morte", bonus: tr.bonus, dados: tr.dadosExtras, cd: e.cdRejeitar }, rng);
    const proxima = log(comFalhasNaSessao(s, 1), r);
    return r.sucesso ? { ...recupera(proxima, 1, d.hp), exaustao: inteiro(proxima.exaustao) + 1 } : proxima;
  }
  if (["res_forca_imparavel", "res_barreira_inamovivel"].includes(id) && tem(d, id)) {
    const r = s.log?.[0];
    const atributo = id === "res_forca_imparavel" ? "destreza" : "constituicao";
    const rotulo = atributo === "destreza" ? "Reflexos" : "Fortitude";
    const minimo = d.mods[atributo];
    if (r?.tipo !== "teste" || r.rotulo !== rotulo || r.natural >= minimo) return s;
    const total = r.total + minimo - r.natural;
    const corrigida = { ...r, naturalOriginal: r.naturalOriginal ?? r.natural, natural: minimo,
      total, sucesso: r.cd == null ? null : total >= r.cd, pifia: minimo === 1,
      critico: minimo >= (d.testes.resistencias.find((t) => t.label === rotulo)?.margemCritico ?? 20),
      detalhe: id === "res_forca_imparavel" ? "Força Imparável" : "Barreira Inamovível" };
    return { ...s, log: [corrigida, ...s.log.slice(1)] };
  }
  return s;
}

export function iniciarTurnoEspecializacao(s, d, rng = Math.random) {
  if (!d) return s;
  let proxima = patch(s, { turno: inteiro(estado(s).turno) + 1, acoesComuns: 0 });
  proxima = { ...proxima, combate: { ...proxima.combate, resAtaqueExtra: false, ataqueFurtivo: false },
    usos: Object.fromEntries(Object.entries(proxima.usos ?? {}).filter(([k]) => !k.startsWith("turno:"))) };
  const imitacao = proxima.combate?.imitacao;
  if (imitacao?.copia) proxima.combate = { ...proxima.combate, imitacao: { ...imitacao, esperandoTurno: false } };
  if (d?.combate?.corpoDeAco && tem(d, "res_corpo_de_aco") && s.combate?.ativo && s.hpAtual < d.hp && !estaMorta(s)) {
    const reg = d.regeneracao;
    const r = rolarDano(d.conteudoRegeneracoes?.res_corpo_de_aco?.pedido
      ?? { rotulo: "Corpo de Aço", tom: "cura", dados: reg.dados, faces: Number(reg.dado.slice(1)), fixo: reg.fixo }, rng);
    /* Corpo de Aço é REGENERAÇÃO COMUM, e não uma das exceções da queda: segue a cura da p.313 (quita a dívida antes de subir o
       PV, e corpo morto não regenera). */
    proxima = curaNaSessao(log(proxima, r), r.total, d.hp);
  }
  const sobrevivente = d.conteudoRegeneracoes?.lut_sobrevivente;
  if (sobrevivente && s.hpAtual > 0 && s.hpAtual < d.hp / 2 && s.vital?.estado !== "morrendo" && !estaMorta(s)
    && !(s.condicoes ?? []).some((c) => (typeof c === "string" ? c : c.nome) === "Inconsciente")) {
    const r = rolarDano(sobrevivente.pedido, rng);
    proxima = curaNaSessao(log(proxima, r), r.total, d.hp);
  }
  return proxima;
}

export function encerrarTurnoEspecializacao(s, d, rng = Math.random) {
  if (!d) return s;
  let proxima = s;
  const e = recursosDeEspecializacao(s, d);
  if (e.turnoEncerrado === e.turno) return s;
  proxima = patch(s, { turnoEncerrado: e.turno });
  if (e.modoMorte === "mesmo_morto" && s.hpAtual === 0 && tem(d, "res_mesmo_morto") && !estaMorta(s)) {
    const tr = d.testes.resistencias.find((x) => x.value === "fortitude");
    const r = rolarTeste({ rotulo: "Mesmo Morto", bonus: tr.bonus, dados: tr.dadosExtras, cd: e.cdMesmoMorto }, rng);
    proxima = log(proxima, r);
    if (!r.sucesso) {
      const v = vitalDe(proxima);
      proxima = patch({ ...proxima, vital: comFalhas(v, Math.max(0, 1 - v.falhas)) }, { modoMorte: "caido" });
    }
  }
  const i = proxima.combate?.imitacao;
  if (i?.copia && i.esperandoTurno === false) {
    const postura = i.copia.tipo === "postura";
    proxima = { ...proxima, combate: { ...proxima.combate, ...(postura ? { postura: null } : {}),
      imitacao: { ...i, copia: null } } };
  }
  return proxima;
}

export function novaRodadaEspecializacao(s, { expirarSurto = true } = {}) {
  if (!s.especializacaoSessao && !s.combate?.surtoAdrenalina) return s;
  const e = estado(s);
  const manter = !!e.manterSurto;
  return patch({ ...s, combate: { ...s.combate, ...(expirarSurto && s.combate?.surtoAdrenalina && !manter
    ? { surtoAdrenalina: false, adrenalinaAbsoluta: false } : {}) } },
  { reacoesGastas: 0, reacoesExtras: 0, manterSurto: false });
}

export function registrarAtaqueEspecializacao(s, desc, d) {
  if (desc.tipo !== "dano" || !desc.linhaArma) return s;
  const i = s.combate?.imitacao;
  const copiaUsada = i?.copia?.tipo === "ativa" && !i.copia.aprendida
    && desc.linhaArma.partes?.some((p) => p.label === d?.imitacao?.copia?.nome);
  return { ...s, combate: { ...s.combate, ataqueFurtivo: false,
    ...(copiaUsada ? { imitacao: { ...i, copia: null } } : {}),
    ...((desc.linhaArma.ataqueId === "corpo" || desc.linhaArma.categoria === "corpo") ? { precisaoForcada: false } : {}) },
    usos: s.combate?.ataqueFurtivo ? { ...s.usos, "turno:res_ataque_furtivo": 1 } : s.usos };
}

export function prepararRolagemEspecializacao(desc, s, d) {
  if (desc.fonteCuraId === "cura_ainda_de_pe" && (!recursosDeEspecializacao(s, d).ainda || s.hpAtual > 0 || estaMorta(s))) return null;
  const corpo = desc.linhaArma?.ataqueId === "corpo" || desc.linhaArma?.categoria === "corpo";
  const dragao = d.combate?.postura === "dragao" || d.combate?.postura2 === "dragao" || d.combate?.invencivelSobOSol;
  let resultado = { ...desc, ...(desc.tipo === "teste" && (desc.tipoTeste === "ataque" || desc.linhaArma)
    ? { contextoTurno: { rodada: s.rodada, turno: s.uso?.acoes?.turno ?? 0, ...(dragao ? { posturaDragao: true } : {}) } } : {}),
    ...(desc.tipo === "dano" && corpo && s.combate?.precisaoForcada ? { maximizado: true } : {}) };
  const agarrar = /agarrar/i.test(desc.rotulo ?? "") && /resistir/i.test(desc.rotulo ?? "");
  const furtividade = desc.rotulo === "Furtividade" && s.combate?.furtividadeContraEnergia;
  if (desc.tipo === "teste" && ((agarrar && tem(d, "res_barreira_inamovivel"))
    || (furtividade && tem(d, "res_restricao_definitiva")))) {
    resultado = { ...resultado, modo: desc.modo === "desvantagem" ? "normal" : "vantagem" };
  }
  /* A ALMA CRÍTICA TIRA VANTAGEM E DÁ DESVANTAGEM EM TODO TESTE (Livro p.312). É o MESMO ponto por onde passam a Ficha
     Clássica, a G2 e o Encontro, e a regra de dois d20 do Motor vale: uma vantagem de outra fonte a anula (p.282). */
  if (desc.tipo === "teste" && d?.almaEstado?.desvantagem) {
    resultado = { ...resultado, modo: modoCombinado(resultado.modo ?? "normal", { desvantagem: true }) };
  }
  return resultado;
}

export function aplicarCuraRoladaEspecializacao(s, desc, r, d) {
  if (desc.fonteCuraId !== "cura_ainda_de_pe") return s;
  if (!recursosDeEspecializacao(s, d).ainda || s.hpAtual > 0 || estaMorta(s)) return s;
  return recupera({ ...s, usos: { ...s.usos, "hab:res_ainda_de_pe": 1 } }, r.total, d.hp);
}
