/* ============================================================
   G2 · A PREPARAÇÃO COMUM (Catálogo, primeira entrega, 2026-10-15)
   ============================================================
   O que confirmar vai fazer, calculado ANTES de confirmar (para a tela) e de
   novo AO confirmar (a sessão pode ter mudado no meio). Vale para as três
   opções de `temPreparo` (dados.js). Nada aqui escreve na sessão.
     RASCUNHO   os valores escolhidos, só na tela. Sair descarta.
     PEDIDO     os estados a aplicar e o valor de PARTIDA de cada um, que o
                `aplicaEstados` (modelo.jsx) confere antes de aplicar. Ligar
                de novo o que já está ligado desliga o Invencível no motor:
                a conferência barra o segundo clique de um clique duplo.
     SIMULAÇÃO  o mesmo `aplicaEstados`, na mesa de agora. A recusa do motor
                e o PE que a ficha cobra (o Invencível) aparecem como vão
                acontecer, sem regra copiada.
     CUSTO      quem desconta:
                  a ficha   o que a simulação cobrou, mais o "por Rodada";
                  à mão     o custo do efeito (o `custoPE` do motor, somado
                            entre os estados ligados, ou o próprio valor com
                            `custoDoValor`). No AJUSTE, só o adicional desta
                            operação: subir de 2 para 3 PE pede 1 (autor, ao
                            Codex, 2026-10-15). Descer não devolve. Reativar
                            e USAR NOVAMENTE são usos novos, com o custo
                            inteiro: 9 PE de novo custam 9, e não a diferença
                            para o uso anterior (autor, 2026-10-16). Mudar o
                            estado não prova que o jogador pagou;
                  nenhum    "Sem Custo Registrado", e nunca grátis.
     BLOQUEIOS  os de hoje (`verificacoes`), "Já Ativo", "Nenhuma Escolha",
                "Faltam N PE" pelo que o jogador desconta nesta operação
                (autor, 2026-10-15), e a recusa do motor.
   ============================================================ */
import { Sessao } from "./ponte";
import { energiaDisponivel } from "./mesa-verbos";
import { mesmoValor } from "./operacoes";
import { beneficiosPvTemp, compararTudo, derivarCom, detalhesDoAtivo, estaLigado, maxDe, padraoDe, partesDoCusto, pvDoAtivo, verificacoes } from "./efeitos-dados";
import { custoDe, preparoDe } from "./g2-dados";

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
const opcoesDe = (e) => e.opcoesVisiveis ?? e.opcoes ?? [];

/** O estado que É a habilidade: o primeiro do primeiro controle. */
export const raizDo = (gr) => gr.controles[0].estados[0];

/** O valor que o rascunho aceita: a faixa da raiz começa em 1, e o multi fica nas opções que existem e no limite do motor. */
export function saneia(e, v, derived, { raiz = false } = {}) {
  if (e.tipo === "bool") return !!v;
  if (e.tipo === "faixa") {
    const max = inteiro(maxDe(e, derived));
    return Math.min(max, Math.max(raiz ? 1 : inteiro(e.min), inteiro(v)));
  }
  if (e.tipo === "multi") {
    const ids = new Set(opcoesDe(e).map((o) => o.id));
    const lista = [...new Set(Array.isArray(v) ? v : [])].filter((id) => ids.has(id));
    return e.maxSelecionados != null ? lista.slice(0, inteiro(e.maxSelecionados)) : lista;
  }
  return opcoesDe(e).some((o) => o.id === v) ? v : null;
}

/**
 * O rascunho de partida. `de`: os valores de antes (Reativar) ou os de agora (ajuste). Sem eles, o que ativar pede.
 * ⚠ COM `de`, o que falta está DESLIGADO, inclusive a raiz: o Repertório ativado só com Duas Armas deixa o
 * `duelando` sem valor na sessão, e a raiz ligada por padrão religaria o Duelando sozinha no Ajustar e no Reativar.
 */
export function rascunhoInicial(gr, derived, de = {}) {
  const raiz = raizDo(gr);
  const desc = preparoDe({ grupo: gr }) ?? {};
  const comPartida = Object.keys(de).length > 0;
  return Object.fromEntries(gr.estados.map((e) => {
    const ehRaiz = e.id === raiz.id;
    /* A raiz de opção com UMA só opção já vem escolhida (Golpe com Aura). Com mais de uma, o jogador escolhe. */
    const unica = ehRaiz && e.tipo === "opcao" && opcoesDe(e).length === 1 ? opcoesDe(e)[0].id : null;
    /* O padrão do livro de um estado que ativar não escolhe sozinho (Precisão Definitiva: o acerto). Só ao ATIVAR. */
    const padrao = !comPartida && desc.padroes?.[e.id] !== undefined ? desc.padroes[e.id] : padraoDe(e);
    const inicial = de[e.id] !== undefined ? de[e.id]
      : ehRaiz && !comPartida ? ({ bool: true, faixa: 1, multi: [] })[e.tipo] ?? unica : padrao;
    return [e.id, saneia(e, inicial, derived, { raiz: ehRaiz && !desc.exigeUm })];
  }));
}

/** O custo À MÃO do efeito com estes valores, em PE. Null quando nada está registrado. `conj`: o custo de conjuração do
 *  Feitiço ligável (`o.custoConjuracao`), à mão como os outros, quando o motor e o estudo não dizem outro. */
function custoNumerico(gr, combate, exemplo, conj = null) {
  /* O estudo diz o custo por PARTES (Estímulo Muscular: o PE do teste e os 2 PE do Empurrão). */
  const partes = partesDoCusto(gr, combate, exemplo);
  if (partes) { const n = partes.reduce((s, p) => s + p.gasto, 0); return n > 0 ? n : null; }
  let total = null;
  for (const e of gr.estados) {
    const v = combate[e.id];
    if (!estaLigado(e, v)) continue;
    const c = custoDe(e, v);
    if (c != null) total = (total ?? 0) + inteiro(c);
  }
  if (total == null && exemplo?.custoDoValor) {
    const n = inteiro(combate[raizDo(gr).id]);
    if (n) total = n;
  }
  /* E2: o custo que o motor não registra no estado e o estudo diz (`custoPE`, em exemplos.js): os 2 PE da rodada
     atual da Aura Excessiva. À mão, como os outros: a ficha não cobra e não presume pagamento. */
  if (total == null && exemplo?.custoPE != null && gr.estados.some((e) => estaLigado(e, combate[e.id]))) total = inteiro(exemplo.custoPE);
  if (total == null && conj > 0 && gr.estados.some((e) => estaLigado(e, combate[e.id]))) total = inteiro(conj);
  return total;
}

/** O rascunho do catálogo: o de ativar, e na Sustentação o conjunto de vagas de agora (o que fica não sai sem o jogador dizer). */
export function rascunhoDoCatalogo(o, m) {
  const gr = o.grupo;
  if (!gr.sustentacao) return rascunhoInicial(gr, m.derived);
  return rascunhoInicial(gr, m.derived, Object.fromEntries(gr.estados.map((e) => [e.id, m.sessao.combate?.[e.id] ?? null])));
}

/** O rascunho de reativar uma Sustentação encerrada: a mesma vaga se ela está livre, senão a primeira livre, e o que está nas outras fica. */
export function rascunhoDeReativarSustentacao(o, m, restaurar) {
  const gr = o.grupo;
  const atuais = Object.fromEntries(gr.estados.map((e) => [e.id, m.sessao.combate?.[e.id] ?? null]));
  const vaga = !atuais[restaurar.estadoId] ? restaurar.estadoId : gr.estados.find((e) => !atuais[e.id])?.id ?? restaurar.estadoId;
  return rascunhoInicial(gr, m.derived, { ...atuais, [vaga]: restaurar.valor });
}

/**
 * O plano de uma confirmação. `modo`: "ativar" (o catálogo e o Reativar), "ajuste" (o cartão ativo) ou "reuso"
 * (USAR NOVAMENTE, 2026-10-16: um uso novo de um efeito já ativo, com o valor escolhido e o custo inteiro). `o` é a
 * opção do catálogo ou o ativo: os dois têm `grupo`, `chave`, `nome` e `exemplo`.
 */
export function planoDoPreparo({ o, valores, m, modo = "ativar", encerrado = null }) {
  const gr = o.grupo;
  const raiz = raizDo(gr);
  const combate = m.sessao.combate ?? {};
  const partida = Object.fromEntries(gr.estados.map((e) => [e.id, combate[e.id]]));
  const desc = preparoDe(o) ?? {};
  const alvo = Object.fromEntries(gr.estados.map((e) => [e.id,
    e.id in valores ? saneia(e, valores[e.id], m.derived, { raiz: e.id === raiz.id && !desc.exigeUm }) : partida[e.id]]));
  const reuso = modo === "reuso";
  /* Um filho só vale com o pai ligado (o Espírito Incansável, que é uma escolha do Espírito de Luta): sem o pai, volta ao desligado. */
  for (const e of gr.estados) {
    const pai = e.requerEstado ? gr.estados.find((x) => x.id === e.requerEstado) : null;
    if (pai && !estaLigado(pai, alvo[pai.id])) alvo[e.id] = padraoDe(e);
  }
  /* Pai antes de filho, como o Reativar de hoje. */
  const ordem = [...gr.estados].sort((x, y) => (x.requerEstado ? 1 : 0) - (y.requerEstado ? 1 : 0));
  const controleDe = (e) => gr.controles.find((c) => c.estados.some((x) => x.id === e.id))?.id ?? null;
  const lista = ordem.filter((e) => !mesmoValor(e, partida[e.id], alvo[e.id]))
    .map((e) => ({ estado: e, valor: alvo[e.id], controleId: controleDe(e) }));
  const pedido = {
    lista,
    esperado: ordem.map((e) => ({ estado: e, valor: partida[e.id] })),
    tirarEncerrado: modo === "ativar" ? encerrado ?? o.chave : null,
  };
  /* A trava do Feitiço Permutativo, conferida DE NOVO na confirmação, sobre a mesa que estiver valendo (`aplicaEstados`): o
     interruptor pelo estado inteiro, e a vaga de Sustentação pela OPÇÃO escolhida. Só o que este confirmar passa a ligar. */
  const travas = [];
  for (const { estado, valor } of lista) {
    if (typeof estado.bloqueio === "function" && estaLigado(estado, valor)) travas.push({ estado, opcao: null });
    if (desc.vagas && valor != null) {
      const opcao = opcoesDe(estado).find((x) => x.id === valor);
      if (typeof opcao?.bloqueio === "function") travas.push({ estado, opcao: valor });
    }
  }
  if (travas.length) pedido.travas = travas;
  /* USAR NOVAMENTE: o uso novo vale mesmo com o MESMO valor (9 PE de novo), e por isso não pode ser provado pelo
     estado. O contador de usos novos do efeito (`mesa.reusos`) é o que o clique duplo não passa. */
  if (reuso) pedido.novoUso = { chave: o.chave, itemId: gr.item?.id ?? null, esperado: inteiro(m.mesa.reusos?.[o.chave]) };
  /* Os usos que ATIVAR gasta (o contador real do motor, só quando o descritor diz): conferidos na confirmação e
     gastos na MESMA operação dos estados. Nada é gasto por rascunho, por abrir a tela ou pela prévia. O Ajustar
     não gasta (a troca de uma postura por outra é pendência de regra). */
  const uso = modo === "ativar" && desc.usos ? m.derived.usosHabilidades?.[desc.usos] ?? null : null;
  const usos = uso ? (() => { const gastos = Sessao.usosGastosDe(m.sessao, uso.chave); return { itemId: desc.usos, chave: uso.chave, max: uso.max, gastos, restam: Math.max(0, uso.max - gastos) }; })() : null;
  if (usos) pedido.usos = { itemId: usos.itemId, esperado: usos.gastos };
  const sim = lista.length || reuso ? m.simularEstados(pedido) : { mesa: m.mesa, erro: null };

  const combateAlvo = { ...combate, ...alvo };
  const d = detalhesDoAtivo({ tipo: "grupo", grupo: gr, exemplo: o.exemplo }, { ...m, sessao: { ...m.sessao, combate: combateAlvo } });
  const automatico = !!d.custo?.cobra;
  const total = automatico ? null : custoNumerico(gr, combateAlvo, o.exemplo, o.custoConjuracao);
  const totalAntes = modo === "ajuste" && !automatico ? custoNumerico(gr, combate, o.exemplo, o.custoConjuracao) : null;
  let manual = total == null ? 0 : modo === "ajuste" ? Math.max(0, total - (totalAntes ?? 0)) : total;
  /* No AJUSTE com custo por partes, o adicional é parte a parte: só o que SOBE se paga, e uma parte que desce
     não abate a outra que sobe. Não há troca de versão com o efeito ativo: o Espírito Incansável é escolhido ao
     UTILIZAR o Espírito de Luta (`escolhaNoUso`), e nada é cobrado por uma diferença presumida. */
  if (modo === "ajuste" && !automatico && o.exemplo?.custoDoEstado) {
    const antes = partesDoCusto(gr, combate, o.exemplo);
    const depois = partesDoCusto(gr, combateAlvo, o.exemplo);
    manual = depois.reduce((s, p, i) => s + Math.max(0, p.gasto - antes[i].gasto), 0);
  }
  const disponivel = energiaDisponivel(m.sessao);
  const ficha = sim.erro || !lista.length ? 0 : Math.max(0, disponivel - energiaDisponivel(sim.mesa.sessao));

  const bloqueios = [...verificacoes(o, m).nao];
  const ativo = gr.estados.some((e) => estaLigado(e, combate[e.id]));
  /* As vagas de Sustentação são várias: o grupo já ter uma vaga ocupada não impede ocupar outra. */
  if (modo === "ativar" && ativo && !desc.vagas) bloqueios.push("Já Ativo");
  /* SUSTENTAÇÃO: o que fica, o que sai e o que entra, vaga a vaga, ANTES de confirmar. */
  const trocas = !desc.vagas ? null : (() => {
    const nomeDe = (e, id) => opcoesDe(e).find((x) => x.id === id)?.label ?? null;
    const saem = []; const entram = []; const ficam = [];
    for (const e of gr.estados) {
      const antes = partida[e.id] ?? null;
      const depois = alvo[e.id] ?? null;
      const vaga = e.label.replace("Sustentação", "Vaga");
      if (antes === depois) { if (antes) ficam.push({ vaga, estado: e.id, feitico: antes, nome: nomeDe(e, antes) }); continue; }
      if (antes) saem.push({ vaga, estado: e.id, feitico: antes, nome: nomeDe(e, antes) });
      if (depois) entram.push({ vaga, estado: e.id, feitico: depois, nome: nomeDe(e, depois) });
    }
    return { saem, entram, ficam };
  })();
  if (desc.vagas) {
    for (const { estado, valor } of lista) {
      if (valor == null) continue;
      const opcao = opcoesDe(estado).find((x) => x.id === valor);
      const trava = typeof opcao?.bloqueio === "function" ? opcao.bloqueio(m.derived, false) : null;
      if (trava) bloqueios.push(trava);
    }
    const ids = gr.estados.map((e) => alvo[e.id]).filter(Boolean);
    if (new Set(ids).size !== ids.length) bloqueios.push("Já Sustentado");
    /* Escolher só tira Feitiço de uma vaga: encerrar é no cartão. A Preparação existe para colocar um Feitiço numa vaga. */
    if (!trocas.entram.length) bloqueios.push("Nenhuma Escolha");
  }
  /* Usar novamente pede o efeito ativo: se acabou entre abrir e confirmar, é uma ativação, e a tela diz isso. */
  if (reuso && !ativo) bloqueios.push("Não Está Ativo");
  /* Sem escolha não há efeito: a raiz de lista vazia, a raiz de opção sem opção e, no Repertório (`exigeUm`),
     nenhum dos estados ligados. */
  const exigeUm = !!desc.exigeUm;
  const semEscolha = desc.vagas ? false : raiz.tipo === "multi" ? !(alvo[raiz.id] ?? []).length
    : raiz.tipo === "opcao" ? alvo[raiz.id] == null
      : exigeUm ? !gr.estados.some((e) => estaLigado(e, alvo[e.id])) : false;
  /* Um estado que o efeito exige escolhido (o destino da Precisão Definitiva, acerto ou dano). */
  const faltaObrigatorio = (desc.obrigatorios ?? []).some((id) => alvo[id] == null || (Array.isArray(alvo[id]) && !alvo[id].length));
  if (semEscolha || faltaObrigatorio) bloqueios.push("Nenhuma Escolha");
  if (usos && usos.gastos >= usos.max) bloqueios.push("Sem Usos Restantes");
  if (manual > disponivel) bloqueios.push(`Faltam ${manual - disponivel} PE`);
  if (sim.erro && lista.length && !bloqueios.length) bloqueios.push("A Ficha Não Aceita Agora");
  /* O custo por rodada de cada Feitiço que ENTRA na Sustentação, pelo derive da mesa simulada. À mão, como o existente: nenhuma
     cobrança automática nem política de expiração por falta de pagamento. */
  let sustentacao = null;
  let alvoResultado = null;
  if (trocas) {
    const depois = !sim.erro && lista.length ? derivarCom(m.ficha, sim.mesa.sessao) : null;
    sustentacao = trocas.entram.map((x) => ({ ...x, pe: depois?.auxiliaresAtivos?.ativos?.find((a) => a.id === x.feitico)?.sustentacaoPE ?? null }));
    const primeira = trocas.entram[0] ?? null;
    alvoResultado = primeira ? { chave: `sust:${primeira.estado}`, nome: primeira.nome } : null;
  }
  return {
    gr, raiz, alvo, lista, pedido, sim, mudou: reuso || lista.length > 0,
    custo: { automatico, rodada: automatico ? d.custo : null, total, totalAntes, manual, ficha, sustentacao },
    usos, trocas, alvoResultado,
    bloqueios: [...new Set(bloqueios)],
  };
}

/**
 * O que muda nos números, pelo derive da mesa simulada contra o de agora
 * (`antes`). O PV Temporário sai dos números e vem à parte, só como
 * informação: quem concede e quando, sem o botão de registrar.
 */
export function previaDoPlano(plano, m, antes) {
  if (!plano.mudou || plano.sim.erro) return { chips: [], pv: null };
  const s = plano.sim.mesa.sessao;
  const depois = derivarCom(m.ficha, s);
  const chips = compararTudo(depois, antes);
  const b = pvDoAtivo({ grupo: plano.gr }, beneficiosPvTemp({ ...m, derived: depois, sessao: s, mesa: plano.sim.mesa }));
  if (!b) return { chips, pv: null };
  return {
    chips: chips.filter((c) => c.chave !== "pvTemporario"),
    pv: { concede: b.concede, registrado: b.registro && !b.registro.pelaFicha ? b.registro.valor : null, resta: b.resta, texto: b.regra === "ficha" ? "A Ficha Concede no Começo da Rodada" : b.textoRegra },
  };
}
