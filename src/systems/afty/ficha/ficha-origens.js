// Conteúdo de origem sobre os contratos entregues por CL1 e CL2.
import { usa } from "./ficha-uso";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";
import { aplicaDanoRecebido, calculaDanoRecebido } from "./ficha-dano-recebido";
import { danoNaAlma } from "./ficha-alma";
import { aplicaCura, marcaUso, usosGastosDe, aplicaPeTemporario, registraRolagem, defineCondicoes } from "./ficha-sessao";
import { rolarDano, rolarTeste } from "./ficha-rolagem";
import { curaNoGasto, preparaRolagemCura } from "../afty-cura";
import { gastaAcao } from "./ficha-acoes";

const inteiro = (n) => Math.max(0, Math.trunc(Number(n) || 0));
const recusa = (sessao, erro, codigo = "origem-indisponivel") => ({ sessao, aplicado: false, erro, codigo });
const identifica = (s, p) => !p?.opId ? recusa(s, "Sem Identidade da Operação", "sem-opid")
  : jaAplicada(s, p.opId) ? { sessao: s, aplicado: false, repetida: true } : null;
const descritor = (d, nome, extra = {}) => ({ id: `origem:${d.id}`, nome: d.nome ?? nome,
  usos: d.usos, proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"], ...extra });
function registra(s, nome, valor, detalhe, tom = "dano") {
  return registraRolagem(s, rolarDano({ rotulo: nome, dados: 0, faces: 6, fixo: valor, tom, detalhe }));
}

export function usaVigorMaldito(sessao, derived, entrada = {}, pedido = {}) {
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  const vigor = derived?.origensUso?.vigor;
  if (!vigor || sessao.vital?.estado === "morto") return recusa(sessao, "Vigor Maldito Indisponível");
  const quantidade = Math.trunc(Number(entrada.usos ?? 1));
  if (!(quantidade >= 1 && quantidade <= vigor.usos.max - usosGastosDe(sessao, vigor.usos.chave))) return recusa(sessao, "Usos Insuficientes", "sem-usos");
  if (entrada.reacao && (!vigor.reacao || !entrada.recebeuDano)) return recusa(sessao, "Reação Indisponível");
  const r = usa(sessao, derived, descritor(vigor, "Vigor Maldito", { acao: entrada.reacao ? "reacao" : "bonus" }), pedido);
  if (!r.aplicado) return r;
  const cura = vigor.cura * quantidade;
  let s = quantidade > 1 ? marcaUso(r.sessao, vigor.usos, quantidade - 1) : r.sessao;
  s = aplicaCura(s, cura, derived.hp);
  return { ...r, sessao: registra(s, vigor.nome, cura, `${quantidade} Uso(s)`, "cura"), cura,
    partes: vigor.partes.map((p) => ({ ...p, valor: p.valor * quantidade })) };
}

export function usaEnergiaAntinatural(sessao, derived, _entrada = {}, pedido = {}) {
  void _entrada;
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  const energia = derived?.origensUso?.energia;
  if (!energia || sessao.vital?.estado === "morto") return recusa(sessao, "Energia Antinatural Indisponível");
  const r = usa(sessao, derived, descritor(energia, "Energia Antinatural", { acao: energia.acao, emCombate: true }), pedido);
  if (!r.aplicado) return r;
  let s = { ...r.sessao, peAtual: Math.min(derived.pe, r.sessao.peAtual + energia.pe) };
  if (energia.temporario) s = aplicaPeTemporario(s, [{ chave: "origem:expansao_de_reserva", nome: "Expansão de Reserva", valor: energia.temporario }]);
  return { ...r, sessao: registra(s, energia.nome, energia.pe, energia.temporario ? `PE e ${energia.temporario} PE Temporários` : "PE"),
    recuperado: s.peAtual - sessao.peAtual, temporario: energia.temporario };
}

export function curaHerancaMaldita(sessao, derived, entrada = {}, pedido = {}) {
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  if (!derived?.origensUso?.heranca || sessao.vital?.estado === "morto") return recusa(sessao, "Herança Maldita Indisponível");
  if (entrada.externa) {
    const valor = Math.floor(inteiro(entrada.valor) / 2);
    const r = usa(sessao, derived, { id: "heranca_maldita_externa", nome: "Herança Maldita" }, pedido);
    return r.aplicado ? { ...r, sessao: registra(aplicaCura(r.sessao, valor, derived.hp), "Herança Maldita", valor, "Energia Reversa Recebida", "cura"), cura: valor } : r;
  }
  const linha = derived.cura?.linhas?.find((l) => l.id === "cura_energia_reversa");
  const pontos = Math.trunc(Number(entrada.pontos ?? 1));
  if (!linha || !(pontos >= 1 && pontos <= linha.blocos)) return recusa(sessao, "Cura de Energia Reversa Indisponível");
  const r = usa(sessao, derived, { id: "heranca_maldita", nome: "Herança Maldita", acao: "comum",
    custo: { pe: 2 * pontos }, cobranca: "confirmada", proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"] }, pedido);
  if (!r.aplicado) return r;
  const cura = curaNoGasto(linha, pontos);
  const rolagem = rolarDano(preparaRolagemCura({ rotulo: "Herança Maldita", fonteCuraId: linha.id,
    dados: cura.dados, faces: Number(linha.dado.slice(1)), fixo: cura.fixo, tom: "cura" }, derived.efeitos), entrada.rng);
  return { ...r, sessao: registraRolagem(aplicaCura(r.sessao, rolagem.total, derived.hp), rolagem), cura: rolagem.total, rolagem };
}

export function testeVenenoOrigem(sessao, derived, entrada = {}, pedido = {}) {
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  const o = derived?.origensUso;
  const teste = derived.testes?.resistencias?.find((r) => r.value === "fortitude");
  if (!teste || !(o?.bonusVeneno || o?.vantagemVeneno) || !Number.isFinite(Number(entrada.cd))) return recusa(sessao, "TR contra Veneno Indisponível");
  const r = usa(sessao, derived, { id: "tr_veneno_origem", nome: "Fortitude contra Veneno" }, pedido);
  if (!r.aplicado) return r;
  const rolagem = rolarTeste({ rotulo: "Fortitude contra Veneno", bonus: teste.bonus + o.bonusVeneno,
    dados: teste.dadosExtras, modo: o.vantagemVeneno ? "vantagem" : "normal", cd: Number(entrada.cd),
    detalhe: o.bonusVeneno ? "Feto Amaldiçoado Híbrido +2" : "Físico Abençoado" }, entrada.rng);
  return { ...r, sessao: registraRolagem(r.sessao, rolagem), rolagem };
}

export function usaVooAnatomia(sessao, derived, _entrada = {}, pedido = {}) {
  void _entrada;
  if (!derived?.origensUso?.anatomias.includes("capacidade_voo")) return recusa(sessao, "Capacidade de Voo Indisponível");
  return usa(sessao, derived, { id: "anatomia_voo", nome: "Capacidade de Voo", acao: "livre", custo: { pe: 1 },
    cobranca: "confirmada", duracao: { rodadas: 1 }, proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    acesso: () => sessao.vital?.estado !== "morto" || "Corpo Morto" }, pedido);
}

// A recarga é uma declaração diária explícita. Descansar preserva o prefixo manual.
export function novoDiaOrigem(sessao, derived, _entrada = {}, pedido = {}) {
  void _entrada;
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  let s = sessao;
  for (const u of [derived?.origensUso?.alma?.usos, derived?.origensUso?.energia?.usos]) {
    if (u?.recarga === "manual") s = marcaUso(s, u, -u.max);
  }
  return { sessao: comOperacao(s, { id: pedido.opId, tipo: "novo-dia-origem" }), aplicado: true };
}

/** O dano declarado ainda é bruto e tipado. As defesas e o estado vital continuam nos núcleos CL1/CL2. */
export function recebeDanoOrigem(sessao, derived, entrada = {}, pedido = {}) {
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  const o = derived?.origensUso ?? {};
  const total = inteiro(entrada.total);
  let bruto = total, s = sessao, chance = null;
  if (entrada.almaMaldita) {
    if (!o.alma || entrada.tipo !== "alma") return recusa(sessao, "Alma Maldita Indisponível");
    const uso = usa(s, derived, { id: "alma_maldita", nome: "Alma Maldita", usos: o.alma.usos }, { ...pedido, opId: `${pedido.opId}:uso` });
    if (!uso.aplicado) return { ...uso, sessao };
    s = uso.sessao;
    bruto = o.alma.anula ? 0 : Math.floor(bruto / 2);
  }
  if (entrada.incompreensivel) {
    if (!o.chanceIncompreensivel || !(entrada.critico || entrada.furtivo)) return recusa(sessao, "Anatomia Incompreensível Indisponível");
    const adicional = inteiro(entrada.adicional);
    if (adicional > total) return recusa(sessao, "Dano Adicional Maior que o Total", "dano-invalido");
    chance = entrada.d4 ?? (1 + Math.floor((entrada.rng ?? Math.random)() * 4));
    if (!Number.isInteger(chance) || chance < 1 || chance > 4) return recusa(sessao, "Resultado do d4 Inválido");
    if (chance <= o.chanceIncompreensivel) bruto -= adicional;
  }
  let r;
  if (entrada.tipo === "alma") {
    r = danoNaAlma(s, derived, { ...entrada, total: bruto, ...(o.alma?.anula && entrada.almaMaldita ? { tr: { resultado: "falha" } } : {}) }, pedido);
  } else if (entrada.resiliencia) {
    if (!o.resiliencia) return recusa(sessao, "Resiliência Imediata Indisponível");
    const calc = calculaDanoRecebido({ total: bruto, defesa: derived.defesasDano?.porTipo?.[entrada.tipo], tr: entrada.tr, desempate: entrada.desempate });
    if (!calc.ok) return recusa(sessao, calc.erro, calc.codigo);
    const uso = usa(s, derived, { id: "resiliencia_imediata", nome: "Resiliência Imediata", usos: o.resiliencia.usos }, { ...pedido, opId: `${pedido.opId}:uso` });
    if (!uso.aplicado) return { ...uso, sessao };
    r = aplicaDanoRecebido(uso.sessao, derived, { total: Math.max(0, calc.final - o.resiliencia.reducao), ataqueId: entrada.ataqueId }, pedido);
    if (r.aplicado) r = { ...r, reducaoResiliencia: Math.min(calc.final, o.resiliencia.reducao), calculoOriginal: calc };
  } else r = aplicaDanoRecebido(s, derived, { ...entrada, total: bruto }, pedido);
  if (!r.aplicado) return { ...r, sessao };
  const retorno = sessao.vital?.estado !== "morto" && entrada.corpoACorpo && r.calculo.final > 0 && o.sangueToxico > 0 ? o.sangueToxico : 0;
  return { ...r, sessao: registra(r.sessao, "Dano Recebido", r.calculo.final,
    [entrada.tipo, chance && `Anatomia Incompreensível: ${chance}`, retorno && `Sangue Tóxico: ${retorno}`].filter(Boolean).join(" · ")),
    chance, retorno, retornoId: `${pedido.opId}:sangue-toxico` };
}

export function evitaDesmembramento(sessao, derived, _entrada = {}, pedido = {}) {
  void _entrada;
  const resiliencia = derived?.origensUso?.resiliencia;
  if (!resiliencia) return recusa(sessao, "Resiliência Imediata Indisponível");
  const r = usa(sessao, derived, { id: "resiliencia_desmembramento", nome: "Resiliência Imediata", usos: resiliencia.usos }, pedido);
  return r.aplicado ? { ...r, sessao: registra(r.sessao, "Resiliência Imediata", 0, "Desmembramento Evitado"), evitado: true } : r;
}

export function devoraEnergia(sessao, derived, entrada = {}, pedido = {}) {
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  if (!derived?.origensUso?.anatomias.includes("devorador_energia")) return recusa(sessao, "Devorador de Energia Indisponível");
  if (!entrada.feitico || !entrada.sucesso || !entrada.eventoId) return recusa(sessao, "Falta o Sucesso do TR contra Feitiço", "sem-evento");
  const idEvento = `devorador:${entrada.eventoId}`;
  const r = usa(sessao, derived, { id: "devorador_energia", nome: "Devorador de Energia" }, { ...pedido, opId: idEvento });
  if (!r.aplicado) return r;
  const chave = "anatomia:devorador_energia";
  const valor = inteiro(sessao.peTempFontes?.[chave]) + 1;
  return { ...r, sessao: comOperacao(aplicaPeTemporario(r.sessao, [{ chave, nome: "Devorador de Energia", valor }]), { id: pedido.opId, tipo: "devorador" }) };
}

export function comandoInumaki(sessao, derived, entrada = {}, pedido = {}) {
  const inumaki = derived?.origensUso?.inumaki;
  if (!inumaki || !String(entrada.aliado ?? "").trim()) return recusa(sessao, "Falta o Aliado do Comando");
  const r = usa(sessao, derived, descritor(inumaki, "Olhos de Cobra e Presas"), pedido);
  if (!r.aplicado) return r;
  return { ...r, sessao: registra(r.sessao, inumaki.nome, 0, `Comando de Ação Bônus para ${entrada.aliado}`), comando: entrada.aliado };
}

export function aplicaPresencaNefasta(sessao, derived, sessaoAlvo, entrada = {}, pedido = {}) {
  const repetida = identifica(sessao, pedido); if (repetida) return repetida;
  if (!derived?.origensUso?.presenca || !entrada.hostil || !entrada.viu || !entrada.alvoId || typeof entrada.sucesso !== "boolean") return recusa(sessao, "Presença Nefasta Indisponível");
  const chave = `manual:presenca:${entrada.alvoId}`;
  if (usosGastosDe(sessao, chave)) return recusa(sessao, "Criatura Já Afetada pela Presença", "ja-avistou");
  const r = usa(sessao, derived, { id: "presenca_nefasta", nome: "Presença Nefasta", usos: { chave, max: 1 } }, pedido);
  if (!r.aplicado) return r;
  const nome = entrada.sucesso ? "Abalado" : "Amedrontado";
  const alvo = defineCondicoes(sessaoAlvo, [...(sessaoAlvo.condicoes ?? []), { nome, rodadas: 1, fonte: "Presença Nefasta" }]);
  return { ...r, sessao: comOperacao(r.sessao, { id: pedido.opId, tipo: "presenca" }), sessaoAlvo: alvo, condicao: nome };
}

/** Adaptador de dois participantes, devolvido ao gravador conjunto do Encontro. */
export function origemComAlvo(sessao, derived, sessaoAlvo, derivedAlvo, entrada, pedido) {
  if (entrada.operacao === "comando") {
    const acao = gastaAcao(sessaoAlvo, derivedAlvo, "reacao", { id: "comando_inumaki" });
    if (acao.erro) return recusa(sessao, acao.erro, acao.codigo);
    const r = comandoInumaki(sessao, derived, entrada, pedido);
    return r.aplicado ? { ...r, sessaoAlvo: acao.sessao } : r;
  }
  if (entrada.operacao === "presenca") return aplicaPresencaNefasta(sessao, derived, sessaoAlvo, entrada, pedido);
  const r = recebeDanoOrigem(sessao, derived, entrada, pedido);
  if (!r.aplicado) return r;
  if (!r.retorno) return { ...r, sessaoAlvo };
  const retorno = aplicaDanoRecebido(sessaoAlvo, derivedAlvo, { modo: "perdaDeVida", total: r.retorno }, { opId: r.retornoId });
  if (!retorno.aplicado) return recusa(sessao, retorno.erro ?? "Retorno Já Aplicado");
  return { ...r, sessaoAlvo: registra(retorno.sessao, "Sangue Tóxico", r.retorno, "Perda de Vida") };
}
