/**
 * ============================================================
 * O CONTRATO DE USO (CL1, 2026-10-29)
 * ============================================================
 * A transação que faltava (M03-D01 em docs/a-fazer.md): validar o acesso e os parâmetros, conferir o que o uso
 * custa, gastar os usos e as cargas, aplicar UMA vez, registrar duração, manutenção e recarga. O guia completo,
 * com o formato do descritor e os exemplos, é `docs/afty-motor-uso-combate.md`. Aqui mora a implementação.
 *
 * ⚠ NÃO SUBSTITUI NENHUM CLIENTE QUE JÁ FUNCIONA. A Técnica Máxima (`usaTecnicaMaxima`), o Golpe Especial
 * (`pagaGolpeEspecial`), o Invencível sob o Sol, a Expansão e as ações de Addon continuam com o verbo deles. O
 * contrato é para o que ainda não tinha dono: cada habilidade nova descreve o uso num DESCRITOR (dado) e chama
 * `usa`, sem copiar um ramo do `ficha-sessao.js`.
 *
 * ⚠ A POLÍTICA DE COBRANÇA É DO DESCRITOR E O PADRÃO É NÃO DEBITAR (`controle-nao-cobra-pe`, `afty-custo-estado-
 * exibido`). `cobranca: "manual"` confere que há Energia ("Faltam N PE") e devolve `custo.pe.naoDescontado`: quem
 * desconta é a pessoa, pelo atalho que a tela já tem. `cobranca: "confirmada"` debita pelo `gastaPe` (casca
 * primeiro), porque o clique no Usar é a confirmação, como já é na Técnica Máxima e no Golpe Especial. Não há
 * cobrança automática da MANUTENÇÃO neste lote: a virada só marca a manutenção como devida.
 *
 * ⚠ IDENTIDADE DA OPERAÇÃO. Toda operação que escreve exige `pedido.opId`. O id aplicado entra num anel da sessão
 * (`sessao.uso.ops`, ver `TETO_ANEL_OPS`), e repetir o id devolve `repetida: true` sem alterar nada: o segundo
 * clique de um clique duplo, o reenvio depois de salvar e a reaplicação de um Encontro não debitam de novo.
 * Recusa NÃO entra no anel, então o mesmo id pode ser reenviado depois de corrigido o motivo.
 *
 * Retorno de `usa`: `{ sessao, aplicado, repetida?, erro?, codigo?, recusas?, custo, ativoId?, evento? }`.
 * Na recusa e na repetição a sessão é a MESMA que entrou (identidade de objeto), e o `erro` é texto de tela
 * (Title Case, sem ponto e vírgula), no estilo de `ficha/efeitos/operacoes.js`.
 * ============================================================
 */
import {
  gastaPe, peTempTotal, marcaUso, usosGastosDe, ajustaRecarga, recargaDe, alteraEstadoCombate, pagaCustoVida,
  divisaoDoPagamento, aparaSessao, cancelaRitual,
} from "./ficha-sessao";
import { validateExpression } from "../afty-dsl";
import { gastaAcao, temCondicaoNaSessao } from "./ficha-acoes";
import {
  usoDe, comUso, jaAplicada, comOperacao, comBuff, encerraAtivoNaSessao, abreConcentracaoNaSessao,
} from "./ficha-uso-estado";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

let sequencia = 0;
/** Um id de operação novo. A tela o cria UMA vez por intenção do clique e o reenvia se precisar tentar de novo. */
export const novaOperacao = () => `op_${Date.now().toString(36)}_${(sequencia += 1)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

/** A Energia que dá para gastar agora. Na Energia em Vida (Bloodfeast) cada PE custa vida, na razão da sessão. */
export function energiaDaSessao(sessao) {
  if (sessao?.energiaEmVida) return Math.floor(Math.max(0, inteiro(sessao.hpAtual)) / sessao.energiaEmVida);
  return Math.max(0, inteiro(sessao?.peAtual)) + peTempTotal(sessao);
}

const numero = (v, valores) => Math.max(0, inteiro(typeof v === "function" ? v(valores) : v));
const custoVazio = () => ({
  pe: { pedido: 0, cobrado: 0, naoDescontado: 0, casca: {}, reserva: 0 },
  vida: { pedido: 0, pago: 0, naoDescontado: 0 },
});

/* ============================================================ */
/* PARÂMETROS                                                    */
/* ============================================================ */
/**
 * Os parâmetros que o descritor declara, lidos do pedido:
 *   `{ id, tipo: "opcao", opcoes: [ids] }`  uma entre as opções
 *   `{ id, tipo: "faixa", min, max }`        inteiro entre os limites
 *   `{ id, tipo: "bool", exige?: true }`     sim ou não. `exige` pede o sim: é a CONFIRMAÇÃO DA MESA de um fato que a ficha não
 *                                            enxerga (empunhar a Arma Dedicada, o alvo estar adjacente)
 * `rotulo` (Title Case) vira o texto da recusa. `padrao` dispensa o valor. `obrigatorio: false` aceita ausência.
 */
function resolveParametros(d, pedido) {
  const dados = objeto(pedido?.parametros) ?? {};
  const valores = {};
  for (const p of d.parametros ?? []) {
    const rotulo = p.rotulo ?? p.id;
    const bruto = dados[p.id];
    const ausente = bruto === undefined || bruto === null || bruto === "";
    if (ausente && p.padrao !== undefined) { valores[p.id] = p.padrao; continue; }
    if (ausente) {
      if (p.tipo === "bool" && !p.exige) { valores[p.id] = false; continue; }
      if (p.obrigatorio === false) continue;
      return { erro: { codigo: p.exige ? "requisito-nao-confirmado" : "parametro-falta", motivo: p.exige ? rotulo : `Falta ${rotulo}` } };
    }
    if (p.tipo === "opcao") {
      if (!(p.opcoes ?? []).includes(bruto)) return { erro: { codigo: "parametro-invalido", motivo: `${rotulo} Inválido` } };
      valores[p.id] = bruto;
    } else if (p.tipo === "faixa") {
      const n = Math.trunc(Number(bruto));
      if (!Number.isFinite(n) || n < inteiro(p.min, -Infinity) || n > inteiro(p.max, Infinity)) {
        return { erro: { codigo: "parametro-invalido", motivo: `${rotulo} Fora da Faixa` } };
      }
      valores[p.id] = n;
    } else {
      valores[p.id] = !!bruto;
      if (p.exige && !valores[p.id]) return { erro: { codigo: "requisito-nao-confirmado", motivo: rotulo } };
    }
  }
  return { valores };
}

/* ============================================================ */
/* LIMITES POR RODADA, TURNO E CENA                              */
/* ============================================================ */
/** A chave em `sessao.usos`: o prefixo é o que o motor já zera sozinho (`rodada:` na virada, `turno:` no início do turno, `cena:` na cena nova). */
const LIMITES = {
  rodada: { prefixo: "rodada", motivo: "Já Usado Nesta Rodada" },
  turno: { prefixo: "turno", motivo: "Já Usado Neste Turno" },
  cena: { prefixo: "cena", motivo: "Já Usado Nesta Cena" },
};
const chaveDoLimite = (d) => `${LIMITES[d.limite.por].prefixo}:uso:${d.id}`;

/* ============================================================ */
/* AVALIAR (puro, nada é escrito)                                */
/* ============================================================ */
/**
 * Tudo o que impede o uso agora, na ordem em que a mesa o resolveria: o que a ficha mudou, o acesso, o combate, as
 * condições, os parâmetros, a exclusividade, os limites, os usos, a recarga, a ação, a concentração e por fim o custo.
 * Devolve `{ ok, recusas: [{ codigo, motivo, detalhe? }], motivo, valores, custo }`. `motivo` é a primeira recusa.
 */
export function avaliaUso(sessao, derived, d, pedido = {}) {
  const recusas = [];
  const recusa = (codigo, motivo, detalhe) => { recusas.push({ codigo, motivo, ...(detalhe ? { detalhe } : {}) }); };
  const fecha = (valores = {}, custo = custoVazio()) => ({ ok: recusas.length === 0, recusas, motivo: recusas[0]?.motivo ?? null, valores, custo });
  if (!d || typeof d.id !== "string" || !d.id) { recusa("descritor-invalido", "Uso Sem Identificação"); return fecha(); }
  const uso = usoDe(sessao);
  const rodada = Math.max(0, inteiro(sessao?.rodada));

  const visto = objeto(pedido?.esperado);
  if (visto) {
    const mudou = (visto.rodada != null && visto.rodada !== rodada)
      || (visto.usos != null && d.usos && visto.usos !== usosGastosDe(sessao, d.usos.chave))
      || (visto.energia != null && visto.energia !== energiaDaSessao(sessao));
    if (mudou) recusa("ficha-mudou", "A Ficha Mudou Antes de Confirmar");
  }

  const { valores = {}, erro: erroParametro } = resolveParametros(d, pedido);
  if (erroParametro) recusa(erroParametro.codigo, erroParametro.motivo);

  if (typeof d.acesso === "function") {
    const r = d.acesso(sessao, derived, valores);
    if (typeof r === "string") recusa("acesso", r);
    else if (r === false) recusa("acesso", "Acesso Indisponível");
  } else if (d.acesso === false) recusa("acesso", "Acesso Indisponível");
  else if (objeto(d.acesso) && d.acesso.ok === false) recusa("acesso", d.acesso.motivo ?? "Acesso Indisponível");

  if (d.emCombate && !sessao?.combate?.ativo) recusa("fora-de-combate", "Pede Em Combate");
  const barrada = (d.proibidoCom ?? []).find((c) => temCondicaoNaSessao(sessao, c));
  if (barrada) recusa("condicao-impede", `${barrada} Impede`);

  for (const e of d.efeitos ?? []) {
    if (e.tipo === "buff" && !validateExpression(String(e.expr ?? "").replace(/^\+\s*/, "")).ok) { recusa("expressao-invalida", "Expressão Inválida"); break; }
  }

  const ativo = uso.ativos[d.id];
  if (ativo && !d.renova) recusa("ja-ativo", "Já Ativo");
  const incompativel = (d.exclusivoCom ?? []).map((id) => uso.ativos[id]).find(Boolean);
  if (incompativel) recusa("exclusivo", `Exclusivo Com ${incompativel.nome}`);

  if (d.limite) {
    const regra = LIMITES[d.limite.por];
    if (regra && usosGastosDe(sessao, chaveDoLimite(d)) >= Math.max(1, inteiro(d.limite.max, 1))) recusa("limite", regra.motivo);
  }
  if (d.usos && usosGastosDe(sessao, d.usos.chave) >= Math.max(0, inteiro(d.usos.max))) recusa("sem-usos", "Sem Usos Restantes");

  if (d.recarga) {
    const r = recargaDe(sessao, d.id);
    if (r?.aguardando) recusa("recarga", "Aguarda Dissipar");
    else if (r?.restantes > 0) recusa("recarga", `Recarga ${r.restantes}`);
  }

  if (d.acao && pedido?.registraAcao) {
    const r = gastaAcao(sessao, derived, d.acao, { id: d.id });
    if (r.erro) recusa(r.codigo, r.erro);
  }

  if (d.concentracao && uso.concentracao && uso.concentracao.id !== d.id && !pedido?.encerraAnterior) {
    recusa("concentrado", "Já Concentrado", uso.concentracao.nome);
  }

  const custo = custoVazio();
  const pe = numero(d.custo?.pe, valores);
  const vida = numero(d.custo?.vida, valores);
  custo.pe.pedido = pe;
  custo.vida.pedido = vida;
  const disponivel = energiaDaSessao(sessao);
  if (pe > disponivel) recusa("sem-energia", `Faltam ${pe - disponivel} PE`);
  if (vida > Math.max(0, inteiro(sessao?.hpAtual))) recusa("sem-vida", "PV Insuficiente");
  return fecha(valores, custo);
}

/** Por que o uso não pode agora, ou `null`: o mesmo formato de `bloqueioAcaoAddon`, para quem só quer desabilitar o botão. */
export const bloqueioDeUso = (sessao, derived, d, pedido = {}) => avaliaUso(sessao, derived, d, pedido).motivo;

/* ============================================================ */
/* USAR                                                          */
/* ============================================================ */
function duracaoDoDescritor(d) {
  const x = d.duracao;
  if (!objeto(x)) return null;
  if (x.rodadas != null) return { duracao: { tipo: "rodadas", restantes: Math.max(1, inteiro(x.rodadas, 1)) }, manutencao: null };
  if (objeto(x.manutencao)) return { duracao: { tipo: "manutencao" }, manutencao: { pe: numero(x.manutencao.pe, {}), mantidas: 0, devidas: 0 } };
  if (["cena", "descanso", "fimDoTurno", "inicioDoProximoTurno"].includes(x.ate)) return { duracao: { tipo: x.ate }, manutencao: null };
  return null;
}

/** O valor de um efeito de estado: o literal, ou `{ parametro: "id" }` lido dos parâmetros já validados. */
const valorDoEstado = (e, valores) => (objeto(e.valor) && "parametro" in e.valor ? valores[e.valor.parametro] : e.valor);

/**
 * Usa. Tudo ou nada: qualquer passo que falhe devolve a sessão de antes, sem custo gasto nem efeito ligado pela
 * metade. Ver o formato do retorno no cabeçalho do arquivo.
 */
export function usa(sessao, derived, d, pedido = {}) {
  const opId = pedido?.opId;
  const base = { sessao, aplicado: false, custo: custoVazio() };
  if (typeof opId !== "string" || !opId) return { ...base, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { ...base, repetida: true };
  const av = avaliaUso(sessao, derived, d, pedido);
  if (!av.ok) return { ...base, custo: av.custo, erro: av.motivo, codigo: av.recusas[0].codigo, recusas: av.recusas };
  const falha = (codigo, erro) => ({ ...base, custo: av.custo, erro, codigo, recusas: [{ codigo, motivo: erro }] });
  const { valores, custo } = av;
  const rodada = Math.max(0, inteiro(sessao?.rodada));
  let s = sessao;

  // Quem estava em campo no lugar dele sai antes (renovar) e a concentração anterior cai se a pessoa escolheu trocar.
  if (usoDe(s).ativos[d.id] && d.renova) s = encerraAtivoNaSessao(s, d.id, "renovado");
  const concentracaoAnterior = usoDe(s).concentracao;
  if (d.concentracao && concentracaoAnterior && concentracaoAnterior.id !== d.id) {
    s = encerraAtivoNaSessao(s, concentracaoAnterior.id, "concentracao-trocada");
    if (concentracaoAnterior.ritualFeiticoId) s = cancelaRitual(s, concentracaoAnterior.ritualFeiticoId);
  }

  if (d.usos) s = marcaUso(s, d.usos, 1);
  if (d.limite) {
    const chave = chaveDoLimite(d);
    s = { ...s, usos: { ...(s.usos ?? {}), [chave]: usosGastosDe(s, chave) + 1 } };
  }
  if (d.recarga) s = ajustaRecarga(s, d.id, Math.max(1, inteiro(d.recarga.rodadas, 1)));

  let acaoUsada = null;
  if (d.acao && pedido?.registraAcao) {
    const r = gastaAcao(s, derived, d.acao, { id: d.id });
    if (r.erro) return falha(r.codigo, r.erro);
    s = r.sessao;
    acaoUsada = r.usou;
  }

  // O pagamento. Manual não debita: devolve o que a pessoa ainda precisa descontar.
  const confirmada = d.cobranca === "confirmada";
  if (custo.pe.pedido > 0) {
    if (confirmada) {
      const depois = gastaPe(s, custo.pe.pedido);
      const pago = divisaoDoPagamento(s, depois);
      custo.pe = { ...custo.pe, cobrado: custo.pe.pedido, casca: pago.casca, reserva: pago.reserva };
      s = depois;
    } else {
      custo.pe = { ...custo.pe, naoDescontado: custo.pe.pedido };
    }
  }
  if (custo.vida.pedido > 0) {
    if (confirmada) {
      const r = pagaCustoVida(s, custo.vida.pedido);
      custo.vida = { ...custo.vida, pago: r.pago };
      s = r.sessao;
    } else {
      custo.vida = { ...custo.vida, naoDescontado: custo.vida.pedido };
    }
  }

  // Os efeitos: o que cada um ligou fica anotado para o encerramento desfazer (estado volta ao valor de desligado, o Buff de Mesa sai).
  const desfazer = [];
  const temDuracao = duracaoDoDescritor(d);
  let indice = 0;
  for (const e of d.efeitos ?? []) {
    indice += 1;
    if (e.tipo === "estado") {
      const valor = valorDoEstado(e, valores);
      const antes = s;
      s = alteraEstadoCombate(s, e.estado ?? { id: e.id }, valor, derived);
      if (s === antes && antes.combate?.[e.id] !== valor) return falha("estado-recusado", "Estado Não Mudou");
      desfazer.push({ tipo: "estado", id: e.id, desliga: e.desliga === undefined ? false : e.desliga });
    } else if (e.tipo === "pvTemporario") {
      const valor = numero(e.valor, valores);
      if (valor > 0) {
        s = { ...s, pvTempFontes: { ...s.pvTempFontes, [e.id]: valor } };
        if (temDuracao) desfazer.push({ tipo: "pvTemporario", id: e.id });
      }
    } else if (e.tipo === "buff") {
      const id = `uso:${opId}:${indice}`;
      const expr = String(e.expr).replace(/^\+\s*/, "");
      // Com duração no descritor, quem encerra é o uso ativo (uma contagem só). Sem ela, o Buff de Mesa carrega as próprias rodadas.
      // O `alvo` do efeito (o dado de `dadosNomeados`, o atributo, a perícia) viaja no Buff de Mesa, que o derive já lê (CL3).
      s = comBuff(s, { id, nome: e.nome ?? d.nome ?? d.id, canal: e.canal, expr, rodadas: temDuracao ? null : (e.rodadas ?? null), ...(e.alvo ? { alvo: e.alvo } : {}) });
      if (temDuracao) desfazer.push({ tipo: "buff", id });
    }
  }

  if (temDuracao) {
    const ativo = {
      id: d.id, nome: d.nome ?? d.id, origem: d.origem ?? null, desde: rodada, ...temDuracao,
      cobranca: confirmada ? "confirmada" : "manual", emCombate: !!d.emCombate, efeitos: desfazer, concentracao: !!d.concentracao, parametros: valores,
    };
    s = comUso(s, (u) => ({ ...u, ativos: { ...u.ativos, [d.id]: ativo } }));
    if (d.concentracao) s = abreConcentracaoNaSessao(s, { id: d.id, nome: d.nome ?? d.id });
  } else if (d.concentracao) {
    s = abreConcentracaoNaSessao(s, { id: d.id, nome: d.nome ?? d.id });
  }

  s = comOperacao(s, { id: opId, tipo: "uso" });
  if (derived) s = aparaSessao(s, derived);
  return {
    sessao: s, aplicado: true, custo,
    ...(temDuracao ? { ativoId: d.id } : {}),
    ...(acaoUsada ? { acao: acaoUsada } : {}),
    evento: { tipo: "uso", nome: d.nome ?? d.id, usoId: d.id, custo: custo.pe.pedido, cobrado: custo.pe.cobrado, naoDescontado: custo.pe.naoDescontado },
  };
}

/* ============================================================ */
/* MANUTENÇÃO E ENCERRAMENTO                                     */
/* ============================================================ */
/**
 * Paga a manutenção DEVIDA de um uso ativo (a virada a marcou). Em `manual` não debita: marca como paga e devolve o
 * que a pessoa ainda precisa descontar. Em `confirmada` debita pelo `gastaPe`. Uma manutenção devida só serve a UM
 * pagamento: o segundo clique, mesmo com outro id, encontra `devidas` em zero e recusa, e o mesmo id vira `repetida`.
 * Devolve também `atrasadas`: as rodadas devidas além da corrente, que a mesa decide o que fazer (a ficha não desliga).
 */
export function pagaManutencao(sessao, derived, ativoId, pedido = {}) {
  const opId = pedido?.opId;
  const base = { sessao, aplicado: false, custo: custoVazio() };
  if (typeof opId !== "string" || !opId) return { ...base, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { ...base, repetida: true };
  const ativo = usoDe(sessao).ativos[ativoId];
  if (!ativo?.manutencao) return { ...base, erro: "Sem Manutenção", codigo: "sem-manutencao" };
  if (ativo.manutencao.devidas < 1) return { ...base, erro: "Nada Devido", codigo: "nada-devido" };
  const pe = ativo.manutencao.pe;
  const custo = custoVazio();
  custo.pe.pedido = pe;
  const disponivel = energiaDaSessao(sessao);
  if (pe > disponivel) return { ...base, erro: `Faltam ${pe - disponivel} PE`, codigo: "sem-energia", custo };
  let s = sessao;
  if (pe > 0) {
    if (ativo.cobranca === "confirmada") {
      const depois = gastaPe(s, pe);
      const pago = divisaoDoPagamento(s, depois);
      custo.pe = { ...custo.pe, cobrado: pe, casca: pago.casca, reserva: pago.reserva };
      s = depois;
    } else {
      custo.pe = { ...custo.pe, naoDescontado: pe };
    }
  }
  const atrasadas = ativo.manutencao.devidas - 1;
  s = comUso(s, (u) => ({ ...u, ativos: { ...u.ativos, [ativoId]: { ...ativo, manutencao: { ...ativo.manutencao, devidas: 0, mantidas: ativo.manutencao.mantidas + 1 } } } }));
  s = comOperacao(s, { id: opId, tipo: "manutencao" });
  if (derived) s = aparaSessao(s, derived);
  return { sessao: s, aplicado: true, custo, atrasadas, evento: { tipo: "manutencao", nome: ativo.nome, usoId: ativoId, custo: pe, cobrado: custo.pe.cobrado, naoDescontado: custo.pe.naoDescontado } };
}

/** Encerra um uso ativo (a pessoa parou de manter, a concentração caiu, a mesa mandou). Desfaz os efeitos que ele ligou. */
export function encerraUso(sessao, derived, ativoId, pedido = {}) {
  const opId = pedido?.opId;
  const base = { sessao, aplicado: false, custo: custoVazio() };
  if (typeof opId !== "string" || !opId) return { ...base, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { ...base, repetida: true };
  const ativo = usoDe(sessao).ativos[ativoId];
  if (!ativo) return { ...base, erro: "Uso Não Está Ativo", codigo: "nao-ativo" };
  let s = encerraAtivoNaSessao(sessao, ativoId, pedido?.motivo ?? "encerrado");
  s = comOperacao(s, { id: opId, tipo: "encerra" });
  if (derived) s = aparaSessao(s, derived);
  return { sessao: s, aplicado: true, custo: custoVazio(), evento: { tipo: "encerra", nome: ativo.nome, usoId: ativoId, motivo: pedido?.motivo ?? "encerrado" } };
}

/** Os usos ativos de agora, para a tela listar (com a manutenção devida à vista). */
export const usosAtivos = (sessao) => Object.values(usoDe(sessao).ativos);
