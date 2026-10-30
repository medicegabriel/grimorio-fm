/**
 * ============================================================
 * AS OPERAÇÕES DA ABA EFEITOS, PURAS SOBRE A MESA
 * ============================================================
 * A "mesa" é a visão da SESSÃO da Ficha que `sessao-g2.js` monta (`daSessao`) e desfaz (`paraSessao`): a sessão com o registro
 * das operações (eventos, ativações, usos novos, concessões de PV e encerrados). Cada função recebe a mesa e devolve `{ mesa, erro? }`,
 * sem tocar em nada fora dela, e o adaptador a roda DENTRO de `atualiza`, sobre a sessão que estiver valendo (atômica). O evento só
 * nasce depois do sucesso: quem recusa devolve a mesa de antes, sem evento.
 * ============================================================
 */
import * as Sessao from "../ficha-sessao";
import { usarEfeitoEspecializacao } from "../ficha-especializacoes";
import { marcasDoGolpe } from "../../afty-golpe-especial";
import { semConcessoesDeUso, umaReserva, beneficiosPvTemp } from "./efeitos-dados";
import { PROPRIEDADES, sessaoComMarcas } from "./g2-golpe";
import { alterarEstado, comEvento, energiaDisponivel, gastoManual } from "./mesa-verbos";
import { uid } from "./util";

/* ============================================================
   ESTADOS COM CONFIRMAÇÃO: TUDO OU NADA (Catálogo, 2026-10-15)
   ============================================================
   As operações que uma Preparação confirma, como funções PURAS da mesa. A
   tela roda a mesma função na mesa de agora antes de confirmar (a prova e a
   prévia), e o `setMesa` roda de novo sobre a mesa que estiver valendo:
     - `esperado` é o valor de PARTIDA de cada estado, o que a tela mostrou.
       Se a sessão mudou (a outra apresentação, ou o segundo clique de um
       clique duplo), nada é aplicado.
       ⚠ Ligar de novo o que já está ligado NÃO é inofensivo: no Invencível
       sob o Sol, o motor trata como desligar (`alteraEstadoCombate`), e a
       Exaustão fica devida;
     - um estado que já está no valor pedido não é reaplicado;
     - qualquer recusa do motor devolve a mesa de antes, sem estado aplicado
       pela metade;
     - `tirarEncerrado` sai dos Encerrados na MESMA operação.
   ============================================================ */
/** O mesmo valor para o estado? A lista do `multi` vale como conjunto. */
export function mesmoValor(e, a, b) {
  if (e.tipo === "multi") {
    const x = Array.isArray(a) ? a : [];
    const y = Array.isArray(b) ? b : [];
    return x.length === y.length && x.every((id) => y.includes(id));
  }
  if (e.tipo === "faixa") return Math.trunc(Number(a) || 0) === Math.trunc(Number(b) || 0);
  if (e.tipo === "bool") return !!a === !!b;
  return (a ?? null) === (b ?? null);
}

const semEncerrado = (mesa, chave) => (chave
  ? { ...mesa, ui: { ...mesa.ui, encerrados: (mesa.ui.encerrados ?? []).filter((y) => y.chave !== chave) } }
  : mesa);
const confere = (mm, esperado, lista) => {
  const agora = mm.sessao.combate ?? {};
  if (esperado.every(({ estado, valor }) => mesmoValor(estado, agora[estado.id], valor))) return null;
  const repetido = lista.length > 0 && lista.every(({ estado, valor }) => mesmoValor(estado, agora[estado.id], valor));
  return repetido ? "Já Aplicado" : "A Ficha Mudou Antes de Confirmar";
};

/** Vários estados de uma vez, pelo `alterarEstado` (o mesmo verbo do `estadoMuda`). Sem gasto: o custo à mão continua à mão.
 *  `novoUso` (USAR NOVAMENTE, 2026-10-16): um uso novo de um efeito ativo, que vale até com o MESMO valor. O estado não
 *  prova que o clique já passou, e por isso o contador `mesa.reusos[chave]` é o que se confere e se avança, na mesma
 *  operação dos estados. A concessão de PV Temporário do uso anterior deixa de estar registrada (a nova se oferece), e o
 *  pote fica como está: quem junta é o `umaReserva`, com o MAIOR entre o saldo e a concessão nova. */
export function aplicaEstados(mm, { lista = [], esperado = [], tirarEncerrado = null, usos = null, novoUso = null, travas = [] }, { derived, calculo = null }) {
  const reusosAgora = novoUso ? Math.max(0, Math.trunc(Number(mm.reusos?.[novoUso.chave]) || 0)) : 0;
  if (novoUso && reusosAgora !== novoUso.esperado) return { mesa: mm, erro: "A Ficha Mudou Antes de Confirmar" };
  const mudouAntes = confere(mm, esperado, lista);
  if (mudouAntes) return { mesa: mm, erro: mudouAntes };
  /* A trava do Feitiço Permutativo (`bloqueio(derived, ligado)`, do motor) é lida DE NOVO aqui, no derive da mesa que está valendo
     agora, e não no da tela: o que a prévia mostrou como livre pode ter mudado. Nada é aplicado se alguma trava segura. */
  if (travas.length && calculo) {
    const d = calculo(mm.sessao);
    for (const { estado, opcao = null } of travas) {
      const alvo = opcao ? (estado.opcoesVisiveis ?? estado.opcoes ?? []).find((x) => x.id === opcao) : estado;
      const t = typeof alvo?.bloqueio === "function" ? alvo.bloqueio(d, false) : null;
      if (t) return { mesa: mm, erro: t };
    }
  }
  let out = mm;
  let mudou = false;
  for (const { estado, valor } of lista) {
    if (mesmoValor(estado, out.sessao.combate?.[estado.id], valor)) continue;
    const r = alterarEstado(out, estado, valor, derived);
    if (r.recusado) return { mesa: mm, erro: `${estado.label} não mudou` };
    out = r.mesa;
    mudou = true;
  }
  if (!mudou && !novoUso) return { mesa: mm, erro: "Nada Mudou" };
  if (novoUso) {
    out = { ...out, reusos: { ...(out.reusos ?? {}), [novoUso.chave]: reusosAgora + 1 }, pvConcessoes: semConcessoesDeUso(out.pvConcessoes, novoUso.itemId) };
  }
  /* E3: os usos que a ativação gasta (o contador real do motor, na MESMA operação dos estados): conferidos contra o
     que a tela mostrou, e nada é gasto se um dos dois falha. Sem contador no motor, nada a gastar. */
  if (usos) {
    const u = derived?.usosHabilidades?.[usos.itemId] ?? null;
    if (u) {
      const gastos = Sessao.usosGastosDe(out.sessao, u.chave);
      if (gastos !== usos.esperado) return { mesa: mm, erro: "A Ficha Mudou Antes de Confirmar" };
      if (gastos >= u.max) return { mesa: mm, erro: "Sem Usos Restantes" };
      const gasta = Sessao.marcaUso(out.sessao, u, 1);
      if (gasta === out.sessao) return { mesa: mm, erro: "Nada Mudou" };
      out = { ...out, sessao: gasta };
    }
  }
  return { mesa: semEncerrado(out, tirarEncerrado) };
}

/** Um estado E o gasto dele (o piloto do Ataque Concentrado), com a mesma conferência de partida. */
export function pagaEstado(mm, { estado, valor, custo = 0, motivo = null, esperado, tirarEncerrado = null }, { derived }) {
  if (esperado !== undefined) {
    const mudouAntes = confere(mm, [{ estado, valor: esperado }], [{ estado, valor }]);
    if (mudouAntes) return { mesa: mm, erro: mudouAntes };
  }
  const ligado = alterarEstado(mm, estado, valor, derived);
  if (ligado.recusado) return { mesa: mm, erro: `${estado.label} não mudou` };
  let out = ligado.mesa;
  if (custo) {
    const pago = gastoManual(out, custo, motivo, derived);
    if (pago.erro) return { mesa: mm, erro: pago.erro };
    out = pago.mesa;
  }
  return { mesa: semEncerrado(out, tirarEncerrado) };
}

/* ============================================================
   REGISTRAR USO: O CONTADOR REAL DO MOTOR (E2, 2026-10-15)
   ============================================================
   Gasta UM uso do contador que o motor já tem (`derived.usosHabilidades`, a
   sessão guarda os GASTOS em `usos["hab:<id>"]`) e anota o evento. Função
   PURA da mesa, como as de cima: a tela roda a mesma na mesa de agora (a prova),
   e o `setMesa` roda de novo sobre a mesa que estiver valendo.
     - `esperado` é o número de usos gastos que a tela mostrou. Se a sessão
       andou (o segundo clique de um clique duplo), nada é gasto de novo;
     - o verbo é o do MOTOR: `marcaUso` (Indomável) ou `usarEfeitoEspecializacao`
       (Surto de Ação: uma vez por rodada e uma ação comum a mais). Sem contador
       no motor (Ataque Extra) não há uso a gastar: só o evento;
     - o PE é à mão: aqui só se confere que há Energia. Nada é descontado.
   ⚠ `ficha-especializacoes.js` tem mudanças locais ainda sem commit no
   repositório: o hash dele vai nas evidências. */
const inteiroUso = (v) => Math.max(0, Math.trunc(Number(v) || 0));
export function registraUso(mm, { chave, nome, itemId, esperado = null, custoPE = 0 }, { derived }) {
  const s0 = mm.sessao;
  const falta = Math.max(0, inteiroUso(custoPE) - energiaDisponivel(s0));
  if (falta) return { mesa: mm, erro: `Faltam ${falta} PE` };
  const u = derived?.usosHabilidades?.[itemId] ?? null;
  let s = s0;
  let usos = null;
  if (u) {
    const gastos = Sessao.usosGastosDe(s0, u.chave);
    if (esperado != null && gastos !== esperado) return { mesa: mm, erro: "A Ficha Mudou Antes de Registrar" };
    if (gastos >= u.max) return { mesa: mm, erro: "Sem Usos Restantes" };
    s = itemId === "cmb_surto_de_acao" ? usarEfeitoEspecializacao(s0, derived, itemId) : Sessao.marcaUso(s0, u, 1);
    if (s === s0) return { mesa: mm, erro: itemId === "cmb_surto_de_acao" ? "Já Usado Nesta Rodada" : "Nada Mudou" };
    usos = { max: u.max, restam: u.max - Sessao.usosGastosDe(s, u.chave) };
  }
  const mesa = comEvento({ ...mm, sessao: Sessao.aparaSessao(s, derived) }, { tipo: "uso", nome, chave, ...(usos ? { usos } : {}) });
  return { mesa, usos };
}

/* ============================================================
   O GOLPE ESPECIAL: MONTAR E PAGAR (consolidação ampliada, 2026-10-16)
   ============================================================
   Função PURA da mesa, como as de cima. Aplica as marcas do rascunho e paga o golpe pela FUNÇÃO DA FICHA
   (`pagaGolpeEspecial`, ficha-sessao.js), que é o contrato de quem cobra aqui: o PE pelo `gastaPe` (casca primeiro),
   o Sacrifício como dano, o Preciso pago na rodada e a troca por 6 do Autossuficiente. É uma exceção de cobrança do
   MONTADOR, e não a regra de confirmar: o Ataque Concentrado é outra, e nada se generaliza a partir dela.
   Tudo ou nada, conferido na mesa que estiver valendo:
     - as marcas de partida, a rodada e o custo são os que a tela mostrou (senão a ficha mudou antes de confirmar);
     - `mesa.reusos[chave]` conta os golpes pagos: cada confirmação é um golpe novo, até com as mesmas marcas, e o segundo
       clique de um clique duplo não paga de novo;
     - o pagamento fica no histórico como um gasto (`ativacoes`), desfazível como o gasto manual: devolve o PE, e não
       desfaz as marcas nem o Sacrifício. */
function quemPagouGolpe(antes, depois) {
  const casca = {};
  for (const [nome, v] of Object.entries(antes.peTempFontes ?? {})) {
    const d = v - (depois.peTempFontes?.[nome] ?? 0);
    if (d > 0) casca[nome] = d;
  }
  return { casca, reserva: Math.max(0, antes.peAtual - depois.peAtual) };
}
export function aplicaGolpe(mm, { chave, marcas, esperadoMarcas, seis = false, custoVisto, rodadaVista, golpesVistos }, { derived }) {
  const golpes = Math.max(0, Math.trunc(Number(mm.reusos?.[chave]) || 0));
  if (golpes !== golpesVistos) return { mesa: mm, erro: "A Ficha Mudou Antes de Confirmar" };
  const agora = marcasDoGolpe(mm.sessao);
  if (mm.sessao.rodada !== rodadaVista || PROPRIEDADES.some((p) => agora[p.id] !== esperadoMarcas[p.id])) return { mesa: mm, erro: "A Ficha Mudou Antes de Confirmar" };
  if (!mm.sessao.combate?.ativo) return { mesa: mm, erro: "Pede Em Combate" };
  if (!derived?.golpeEspecial?.disponivel) return { mesa: mm, erro: "Golpe Especial Indisponível" };
  const s = sessaoComMarcas(mm.sessao, marcas);
  const custo = Sessao.custoDoGolpeDaSessao(s, derived, { seis });
  if (!custo.montado) return { mesa: mm, erro: "Nenhuma Propriedade" };
  if (custo.aPagar !== custoVisto) return { mesa: mm, erro: "O Custo Mudou Antes de Confirmar" };
  const falta = custo.aPagar - energiaDisponivel(s);
  if (falta > 0) return { mesa: mm, erro: `Faltam ${falta} PE` };
  const paga = Sessao.pagaGolpeEspecial(s, derived, { seis });
  if (paga === s) return { mesa: mm, erro: "A Ficha Não Aceita Agora" };
  const base = { ...mm, sessao: Sessao.aparaSessao(paga, derived), reusos: { ...(mm.reusos ?? {}), [chave]: golpes + 1 } };
  /* Sem PE a pagar (o Autossuficiente cobriu o custo), não há gasto a desfazer: fica só o registro do golpe. */
  /* O Sacrifício também custa Vida (15 de dano): o histórico diz isso, porque estornar o PE não o desfaz. */
  const vida = (x) => x.hpAtual + Sessao.pvTempTotal(x);
  const dano = Math.max(0, vida(s) - vida(paga));
  if (custo.aPagar <= 0) return { mesa: comEvento(base, { tipo: "info", texto: `Golpe Especial montado sem desconto de PE${dano > 0 ? ` e com ${dano} de dano` : ""}` }) };
  const id = uid();
  const pago = quemPagouGolpe(s, paga);
  const ativacao = { id, tipo: "gasto", nome: "Golpe Especial", custo: custo.aPagar, pago, rodada: s.rodada, desfeita: false, rolagens: [] };
  const out = { ...base, ativacoes: { ...mm.ativacoes, [id]: ativacao } };
  return { mesa: comEvento(out, { tipo: "gasto", ativacaoId: id, nome: ativacao.nome, custo: custo.aPagar, pago, ...(dano > 0 ? { dano } : {}) }) };
}

/* ============================================================
   DESCONTAR A ENERGIA: O ATALHO DE PAGAMENTO DE UM EFEITO (2026-10-16)
   ============================================================
   O Descontar de um custo à mão é um GASTO: subtrai o valor da Energia pelo
   MESMO verbo que o painel geral usa (`gastoManual`, que tira da casca de PE
   temporário primeiro, recusa com "Faltam N PE" e deixa o evento no histórico
   com o motivo, desfazível). Nunca substitui o saldo: Definir é outra operação,
   e continua no editor do cabeçalho. Função PURA da mesa, como as de cima:
     - `energiaVista` é a Energia que a tela mostrou. Se ela mudou (o segundo
       clique de um clique duplo, ou outro painel que já pagou), nada é debitado;
     - o valor é sempre o que será descontado, e nunca o que vai sobrar. */
export function descontaEnergia(mm, { valor, motivo = null, energiaVista = null }, { derived }) {
  const quanto = Math.max(0, Math.trunc(Number(valor) || 0));
  if (!quanto) return { mesa: mm, erro: "Informe o Valor" };
  if (energiaVista != null && energiaDisponivel(mm.sessao) !== energiaVista) return { mesa: mm, erro: "A Energia Mudou Antes de Descontar" };
  const r = gastoManual(mm, quanto, motivo, derived);
  return r.erro ? { mesa: mm, erro: r.erro } : r;
}

/* ============================================================
   REGISTRAR PV TEMPORÁRIO NA VIDA: A REVALIDAÇÃO (E3, 2026-10-16)
   ============================================================
   Função PURA da mesa, como as de cima. O botão "Registrar na Vida" mostra o que
   a tela viu (a concessão, e se já havia registro). Ao clicar, a mesa que estiver
   valendo é conferida de novo, e NADA é concedido se:
     - o registro mudou desde que a tela o mostrou (o segundo clique de um clique
       duplo, ou o outro painel que já registrou);
     - a rodada mudou, ou o motor (derive da sessão de AGORA) já não concede esse
       valor, ou a regra da habilidade não oferece o registro (uma concessão por uso,
       uma por rodada, ou a da ficha, que ninguém registra à mão).
   Consumir o pote depois NÃO reabre a concessão: quem decide é o registro
   (`pvConcessoes`), e não o saldo (30 concedidos, 18 consumidos, 12 restam). A
   reserva é UMA por benefício (`umaReserva`): o maior entre o saldo e a concessão.
   Mexe só em `pvTempFontes` e `pvConcessoes`: a Vida normal fica como está. */
export function registraPv(mm, { beneficio, concede, registroVisto = null, rodadaVista }, { calculo }) {
  const reg = mm.pvConcessoes?.[beneficio] ?? null;
  if ((reg?.ts ?? null) !== (registroVisto ?? null) || mm.sessao.rodada !== rodadaVista) return { mesa: mm, erro: "A Ficha Mudou Antes de Registrar" };
  const b = beneficiosPvTemp({ derived: calculo(mm.sessao), sessao: mm.sessao, mesa: mm }).get(beneficio);
  if (!b) return { mesa: mm, erro: "Sem Concessão Agora" };
  if (!b.podeRegistrar) return { mesa: mm, erro: "Concessão Já Registrada" };
  if (b.concede !== concede) return { mesa: mm, erro: "A Concessão Mudou" };
  return {
    mesa: {
      ...mm,
      sessao: umaReserva(mm.sessao, beneficio, b.fonte, b.concede),
      pvConcessoes: { ...(mm.pvConcessoes ?? {}), [beneficio]: { valor: b.concede, fonte: b.fonte, rodada: mm.sessao.rodada, ts: Date.now() } },
    },
  };
}

