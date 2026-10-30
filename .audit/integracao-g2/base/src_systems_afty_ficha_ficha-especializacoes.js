import { rolarTeste, rolarDano } from "./ficha-rolagem";

const inteiro = (n) => Math.max(0, Math.trunc(Number(n) || 0));
const tem = (d, id) => (d?.habilidades?.canonicas ?? d?.habilidades?.efetivas ?? []).includes(id);
const estado = (s) => ({ turno: 0, reacoesGastas: 0, reacoesExtras: 0, acoesComuns: 0,
  pvNegativos: 0, falhasMorte: 0, modoMorte: null, ...s.especializacaoSessao });
const patch = (s, p) => ({ ...s, especializacaoSessao: { ...estado(s), ...p } });
const log = (s, r) => ({ ...s, log: [r, ...(s.log ?? [])].slice(0, 50) });
const recupera = (s, n, max) => patch({ ...s, hpAtual: Math.min(max, inteiro(s.hpAtual) + inteiro(n)) },
  { pvNegativos: 0, modoMorte: null, quedaPendente: false, cairNoProximoDano: false });

export function recursosDeEspecializacao(s, d) {
  const e = estado(s);
  const instintos = tem(d, "res_instintos_agucados") && s.hpAtual > d.hp / 2 && s.peAtual > d.pe / 2;
  const ainda = tem(d, "res_ainda_de_pe") && inteiro(s.usos?.["hab:res_ainda_de_pe"]) < 1;
  return { ...e, instintos, ainda,
    reacoes: Math.max(0, 1 + Number(instintos) + inteiro(e.reacoesExtras) - inteiro(e.reacoesGastas)),
    cdRejeitar: 15 + Math.floor(inteiro(e.pvNegativos) / 3),
    cdMesmoMorto: 25 + Math.floor(inteiro(e.pvNegativos) / 5),
    custoAtaqueExtra: s.combate?.surtoAdrenalina && s.combate?.adrenalinaAbsoluta ? 1 : 2,
    pulos: tem(d, "res_perceber_o_ar") ? 1 + Number(d.nd >= 13) + Number(d.nd >= 17) : 0,
    quedaImuneAte: tem(d, "res_perceber_o_ar") ? 2 * d.movimento : 0,
    saltoAdicional: d.configuracaoEspecializacao?.forcaDevastadora ? 3 : 0,
    imuneMovimentoForcado: tem(d, "res_barreira_inamovivel"),
    ignoraTerrenoDificil: !!d.configuracaoEspecializacao?.agilidadeEximia,
    imuneDominio: tem(d, "res_restricao_definitiva"),
  };
}

// Chamado depois de descontar a casca e a Vida. Não presume morte instantânea.
export function registrarQuedaEspecializacao(s, d, excesso) {
  if (!d || !["res_ainda_de_pe", "res_rejeitar_a_morte", "res_mesmo_morto"].some((id) => tem(d, id))) return s;
  if (s.hpAtual > 0) return s;
  const e = recursosDeEspecializacao(s, d);
  const pvNegativos = inteiro(e.pvNegativos) + inteiro(excesso);
  if (e.cairNoProximoDano) return patch(s, { pvNegativos, falhasMorte: inteiro(e.falhasMorte) + 1,
    modoMorte: "caido", cairNoProximoDano: false, quedaPendente: false });
  if (!e.ainda && tem(d, "res_mesmo_morto") && e.modoMorte !== "caido") {
    return patch(s, { pvNegativos, modoMorte: "mesmo_morto", quedaPendente: false });
  }
  return patch(s, { pvNegativos, quedaPendente: e.ainda, modoMorte: e.modoMorte ?? "portas_da_morte" });
}

export function usarEfeitoEspecializacao(s, d, id, rng = Math.random) {
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
    const proxima = log(patch(s, { falhasMorte: inteiro(e.falhasMorte) + 1 }), r);
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
  if (d?.combate?.corpoDeAco && tem(d, "res_corpo_de_aco") && s.combate?.ativo && s.hpAtual < d.hp) {
    const reg = d.regeneracao;
    const r = rolarDano({ rotulo: "Corpo de Aço", tom: "cura", dados: reg.dados, faces: Number(reg.dado.slice(1)), fixo: reg.fixo }, rng);
    proxima = recupera(log(proxima, r), r.total, d.hp);
  }
  return proxima;
}

export function encerrarTurnoEspecializacao(s, d, rng = Math.random) {
  if (!d) return s;
  let proxima = s;
  const e = recursosDeEspecializacao(s, d);
  if (e.turnoEncerrado === e.turno) return s;
  proxima = patch(s, { turnoEncerrado: e.turno });
  if (e.modoMorte === "mesmo_morto" && s.hpAtual === 0 && tem(d, "res_mesmo_morto")) {
    const tr = d.testes.resistencias.find((x) => x.value === "fortitude");
    const r = rolarTeste({ rotulo: "Mesmo Morto", bonus: tr.bonus, dados: tr.dadosExtras, cd: e.cdMesmoMorto }, rng);
    proxima = log(proxima, r);
    if (!r.sucesso) proxima = patch(proxima, { modoMorte: "caido", falhasMorte: Math.max(1, inteiro(e.falhasMorte)) });
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
  if (desc.fonteCuraId === "cura_ainda_de_pe" && (!recursosDeEspecializacao(s, d).ainda || s.hpAtual > 0)) return null;
  const corpo = desc.linhaArma?.ataqueId === "corpo" || desc.linhaArma?.categoria === "corpo";
  let resultado = { ...desc, ...(desc.tipo === "dano" && corpo && s.combate?.precisaoForcada ? { maximizado: true } : {}) };
  const agarrar = /agarrar/i.test(desc.rotulo ?? "") && /resistir/i.test(desc.rotulo ?? "");
  const furtividade = desc.rotulo === "Furtividade" && s.combate?.furtividadeContraEnergia;
  if (desc.tipo === "teste" && ((agarrar && tem(d, "res_barreira_inamovivel"))
    || (furtividade && tem(d, "res_restricao_definitiva")))) {
    resultado = { ...resultado, modo: desc.modo === "desvantagem" ? "normal" : "vantagem" };
  }
  return resultado;
}

export function aplicarCuraRoladaEspecializacao(s, desc, r, d) {
  if (desc.fonteCuraId !== "cura_ainda_de_pe") return s;
  if (!recursosDeEspecializacao(s, d).ainda || s.hpAtual > 0) return s;
  return recupera({ ...s, usos: { ...s.usos, "hab:res_ainda_de_pe": 1 } }, r.total, d.hp);
}
