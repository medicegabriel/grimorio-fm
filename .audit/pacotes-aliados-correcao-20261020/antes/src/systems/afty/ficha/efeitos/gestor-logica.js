/* Lógica do gerenciador de Efeitos Ativos (hook e funções puras), separada de Gestor.jsx para o Fast Refresh. */

import { useEffect, useMemo, useRef, useState } from "react";
import { avancaFatia } from "../fatias";
import { comEvento } from "./mesa-verbos";
import { uid } from "./util";
import { Sessao } from "./ponte";
import { montarGrupos, montarOpcoes, montarAtivos, consequenciasEmPassos, disputasDosAtivos, detalhesDoAtivo, simularGrupos, grupoLigado, estaLigado, padraoDe, compararTudo, ordenarConsequencias, custoAntes, contribuicao, beneficiosPvTemp, DONO_PV, semConcessoesDeUso } from "./efeitos-dados";
import { PV_TEMP, FONTE_TERRA_INVENCIVEL } from "./exemplos";
import { custoDe, ehGolpe, ehPiloto, foraDosNumeros, rotuloDaFaixa, temPreparo } from "./g2-dados";
import { planoDoPreparo, rascunhoDoCatalogo } from "./g2-preparo";
import { CHAVE_GOLPE, marcasDeAgora, planoDoGolpe, rascunhoDoGolpe } from "./g2-golpe";
import { planoDoUso } from "./g2-uso";
import { opcoesRecebidas } from "./recebidos";
import { chaveDaOpcaoRecebida, ehInstanciaDePacote, instanciaAtivaDe, instanciaDaOpcao, opcaoAtivavel } from "../pacotes-aliados";
/* ============================================================
   O HOOK: dados, estado de tela compartilhado, operações e resultado
   ============================================================ */
export const energia = (s) => Math.max(0, s.peAtual) + Sessao.peTempTotal(s);
export const semPvTemp = (chips) => (chips ?? []).filter((c) => c.chave !== "pvTemporario");

/* ⚠ AS CONSEQUÊNCIAS NÃO BLOQUEIAM O CLIQUE. A conta é um derive por ativo (e, para o que não muda nada, dois por par), e com catorze efeitos ligados numa ficha
   grande ela era a maior parte dos segundos de "travada" ao ligar um efeito. Aqui ela roda em fatias de uns 30 ms, entre quadros: a tela pinta o clique, e as
   respostas chegam logo depois. Quem ainda não tem resposta (o efeito que acabou de ligar) é calculado primeiro, e as dos outros ficam como estavam até a conta
   nova chegar. Só a MESMA conta, em outro tempo: o que vale no fim é exatamente o resultado de `consequencias`. */
function useConsequencias(ficha, sessao, derived, ativos) {
  const [cons, setCons] = useState(() => ({ porAtivo: new Map(), cobertos: new Map() }));
  const ultima = useRef(cons);
  useEffect(() => {
    let vivo = true;
    let timer = null;
    const job = consequenciasEmPassos(ficha, sessao, derived, ativos, ultima.current.porAtivo);
    /* O que vale enquanto a conta nova não termina: o resultado antigo, só dos ativos de agora, com o que já saiu da nova por cima. */
    const mescla = (parcial, cobertos) => {
      const porAtivo = new Map();
      for (const a of ativos) if (parcial.has(a.chave) || ultima.current.porAtivo.has(a.chave)) porAtivo.set(a.chave, parcial.get(a.chave) ?? ultima.current.porAtivo.get(a.chave));
      return { porAtivo, cobertos: cobertos ?? new Map([...ultima.current.cobertos].filter(([k]) => ativos.some((a) => a.chave === k))) };
    };
    let comecou = false;
    const passo = () => {
      if (!vivo) return;
      const r = avancaFatia(job);
      if (r.done) {
        ultima.current = mescla(r.value.porAtivo, r.value.cobertos);
        setCons(ultima.current);
        return;
      }
      /* A primeira fatia já mostra o que foi calculado (o efeito novo), as seguintes só no fim. */
      if (!comecou) { comecou = true; const parcial = mescla(r.value.porAtivo, null); setCons(parcial); }
      timer = setTimeout(passo, 0);
    };
    timer = setTimeout(passo, 0);
    return () => { vivo = false; clearTimeout(timer); };
  }, [ficha, sessao, derived, ativos]);
  return cons;
}

export function useGestor(m) {
  const grupos = useMemo(() => montarGrupos(m.pacote), [m.pacote]);
  /* Os Recebidos de pacotes entram como opções do catálogo (busca e categoria própria), lidos da biblioteca do personagem. */
  const recebidas = useMemo(() => opcoesRecebidas(m.biblioteca), [m.biblioteca]);
  const opcoes = useMemo(() => [...montarOpcoes(m.pacote, grupos), ...recebidas], [m.pacote, grupos, recebidas]);
  const ativos = useMemo(() => montarAtivos(m, grupos), [m.sessao, grupos, m.derived]); // eslint-disable-line react-hooks/exhaustive-deps
  const cons = useConsequencias(m.ficha, m.sessao, m.derived, ativos);
  const emGrupos = m.calculo?.emGrupos ?? true;
  const disputas = useMemo(() => disputasDosAtivos(ativos, m.derived, emGrupos), [ativos, m.derived, emGrupos]);
  const pv = useMemo(() => beneficiosPvTemp(m), [m.derived, m.sessao, m.mesa.pvConcessoes]); // eslint-disable-line react-hooks/exhaustive-deps
  const grupoDoEstado = useMemo(() => {
    const mapa = new Map();
    for (const gr of grupos) for (const e of gr.estados) mapa.set(e.id, gr);
    return mapa;
  }, [grupos]);

  /* O estado de tela é UM só: expandir e recolher não perdem nada.
     `lado`: o que está aberto ao lado dos ativos na completa (null,
     "encontrar" ou "registrar"). Entrar na aba começa sem nada ao lado. */
  /* `catalogo`: o Adicionar do G2. Categoria, busca e opção aberta sobrevivem a
     fechar e reabrir. `preparo` é o rascunho da Preparação: só existe na tela,
     e sair do catálogo o descarta. `revelar`: o cartão que a tela deve trazer à
     vista depois de uma operação. */
  const [tela, setTela] = useState({
    selecionado: null, filtro: "tudo", termo: "", paraId: null, como: null, origem: "todas", soFav: false, mostrarTudo: {}, aberta: null, lado: null,
    catalogo: { aberto: false, aba: "ficha", cat: "favoritos", termo: "", opcao: null, preparo: null }, revelar: null,
    /* G2: o efeito aberto no painel compacto, os Encerrados (recolhidos ao
       entrar) e o rascunho de uma reativação ({ chave, valor }). */
    compactaAberto: null, encerradosAberto: false, reativando: null,
    /* O acesso de Habilidades (consolidação ampliada, 2026-10-16): a Preparação aberta NO PAINEL compacto, sem navegar nem gravar
       nada. É o rascunho de uma opção ({ chave, valor | valores }), e sair dele o descarta. */
    preparoC2: null,
  });
  const mudaTela = (patch) => setTela((t) => ({ ...t, ...(typeof patch === "function" ? patch(t) : patch) }));
  const mudaCatalogo = (patch) => mudaTela((t) => ({ catalogo: { ...t.catalogo, ...(typeof patch === "function" ? patch(t.catalogo) : patch) } }));
  /* `aba` abre o catálogo nela ("ficha" ou "externa"); null fecha e descarta o rascunho. */
  const abrirCatalogo = (aba) => mudaCatalogo(() => (aba ? { aberto: true, aba } : { aberto: false, preparo: null }));
  /* Do catálogo para o cartão de um efeito que já está ativo. */
  const irAoAtivo = (chaveDaOpcao) => {
    /* A Sustentação é um grupo de vagas: o cartão é o da primeira vaga ocupada (`sust:<vaga>`). */
    const vagas = ativos.filter((a) => a.tipo === "sustentado").sort((x, y) => x.estado.id.localeCompare(y.estado.id));
    /* A opção recebida de um pacote: o cartão é o da instância dela (`rec:<id>`). */
    const recebida = recebidas.find((o) => o.chave === chaveDaOpcao);
    const inst = recebida ? instanciaAtivaDe(m.sessao, recebida.pacoteRecebido.entrada.chave, recebida.pacoteRecebido.opcao.id) : null;
    const chave = inst ? `rec:${inst.id}` : chaveDaOpcao === "estado:sustentacao" ? vagas[0]?.chave ?? chaveDaOpcao : chaveDaOpcao;
    mudaTela((t) => ({ selecionado: chave, revelar: chave, catalogo: { ...t.catalogo, aberto: false, preparo: null } }));
  };

  const [querSimular, setQuerSimular] = useState(false);
  const [simulacao, setSimulacao] = useState(null);
  useEffect(() => {
    if (!querSimular) return undefined;
    let vivo = true;
    const t = setTimeout(() => { const s = simularGrupos(m.ficha, m.sessao, grupos); if (vivo) setSimulacao(s); }, 30);
    return () => { vivo = false; clearTimeout(t); };
  }, [querSimular, m.ficha, m.sessao, grupos]);

  /* ---------- o resultado ---------- */
  const [resultado, setResultado] = useState(null);
  const pendente = useRef(null);
  /* `fn` pode devolver `{ erro }` (a confirmação que não passou na prova): aí
     nada foi pedido à mesa, e não há resultado a esperar. Devolve se passou. */
  const operar = (info, fn) => {
    // eslint-disable-next-line react-hooks/purity -- só roda em manipulador de evento (`mPara()` o cerca na renderização, mas ninguém o chama nela)
    const p = { ...info, antes: m.derived, sessaoAntes: m.sessao, ts: Date.now() };
    pendente.current = p;
    const r = fn();
    if (r?.erro) {
      if (pendente.current === p) pendente.current = null;
      return false;
    }
    setTimeout(() => {
      if (pendente.current !== p) return;
      pendente.current = null;
      setResultado({ ...info, ts: p.ts, chips: [], cobrado: 0, nadaMudou: true });
    }, 300);
    return true;
  };
  useEffect(() => {
    const p = pendente.current;
    if (!p || p.sessaoAntes === m.sessao) return;
    pendente.current = null;
    const { antes, sessaoAntes, ...info } = p;
    setResultado({ ...info, chips: ordenarConsequencias(compararTudo(m.derived, antes)), cobrado: Math.max(0, energia(sessaoAntes) - energia(m.sessao)) });
  }, [m.sessao, m.derived]);

  /* ---------- encerrados nesta sessão ---------- */
  const encerrados = m.ui.encerrados ?? [];
  const guardaEncerrado = (x) => m.setUi((u) => ({ ...u, encerrados: [{ ...x, ts: Date.now() }, ...(u.encerrados ?? []).filter((y) => y.chave !== x.chave)].slice(0, 6) }));
  const tiraEncerrado = (chave) => m.setUi((u) => ({ ...u, encerrados: (u.encerrados ?? []).filter((y) => y.chave !== chave) }));

  /* O custo de um grupo com os valores que ele VAI ter: o do motor, senão o do exemplo. */
  const custoDoGrupo = (gr, combate) => {
    if (!gr) return null;
    const a = { tipo: "grupo", grupo: gr, exemplo: opcoes.find((o) => o.chave === gr.chave)?.exemplo };
    const d = detalhesDoAtivo(a, { ...m, sessao: { ...m.sessao, combate } });
    return d.custo;
  };
  /* O custo de reativar um encerrado, para aparecer ANTES do clique. */
  const custoDeReativar = (x) => {
    const r = x.restaurar;
    if (r.tipo === "grupo") return custoDoGrupo(grupos.find((y) => y.chave === x.chave), { ...(m.sessao.combate ?? {}), ...r.valores });
    if (r.tipo === "sustentado") {
      const at = (m.derived.auxiliaresAtivos?.ativos ?? []).find((y) => y.id === r.valor);
      return at?.sustentacaoPE ? { texto: `${at.sustentacaoPE} PE por Rodada`, cobra: false } : null;
    }
    return null;
  };

  /* A concessão de PV Temporário de uma habilidade encerrada deixa de valer: a
     próxima ativação é um USO novo. O que está no pote fica. */
  /* Só a concessão POR USO se esquece ao encerrar: ativar de novo é um uso novo.
     A por rodada (Postura da Terra) continua anotada, e reassumir a postura na
     mesma rodada não concede de novo. A próxima vem com a próxima rodada. */
  const esqueceConcessoes = (itemId) => {
    m.setMesa((mm) => ({ ...mm, pvConcessoes: semConcessoesDeUso(mm.pvConcessoes, itemId) }));
  };
  /* Espírito de Luta e Espírito Incansável são a MESMA reserva: uma fonte só. */
  const fontesPvDe = (itemId) => [...new Set(Object.entries(PV_TEMP).filter(([origem]) => DONO_PV[origem] === itemId).map(([, x]) => x.fonte)
    .concat(itemId === "api_invencivel_sob_o_sol" || itemId === "cmb_assumir_postura" ? [FONTE_TERRA_INVENCIVEL] : []))];

  /* O `m` que os controles recebem: mesma sessão, com o resultado. */
  const mPara = () => ({
    ...m,
    estadoMuda: (e, valor, cId) => {
      const combate = m.sessao.combate ?? {};
      const gr = grupoDoEstado.get(e.id);
      const estavaLigado = gr ? grupoLigado(gr, combate, m.sessao) : estaLigado(e, combate[e.id]);
      const desliga = !estaLigado(e, valor) && gr && gr.estados.filter((x) => x.id !== e.id).every((x) => !estaLigado(x, combate[x.id]));
      const verbo = desliga ? "Encerrado" : estavaLigado ? "Ajustado" : "Ativado";
      const custo = desliga ? null : custoDoGrupo(gr, { ...combate, [e.id]: valor });
      const alvo = gr?.sustentacao ? `sust:${e.id}` : desliga ? `enc:${gr?.chave}` : gr?.chave;
      // eslint-disable-next-line react-hooks/refs -- `estadoMuda` só roda em manipulador de evento; `pendente` é lido no efeito, não na renderização
      operar({ verbo, nome: gr?.sustentacao ? (e.opcoes ?? []).find((o) => o.id === (valor || combate[e.id]))?.label ?? gr.nome : gr?.nome ?? e.label, alvo, custo, fontesPv: fontesPvDe(gr?.item?.id) }, () => m.estadoMuda(e, valor, cId));
      if (desliga && gr && !gr.sustentacao) {
        guardaEncerrado({ chave: gr.chave, nome: gr.nome, restaurar: { tipo: "grupo", valores: Object.fromEntries(gr.estados.filter((x) => estaLigado(x, combate[x.id])).map((x) => [x.id, combate[x.id]])) } });
        esqueceConcessoes(gr.item?.id);
      }
    },
  });
  const mGeral = mPara();

  const acoes = {
    ativar(o) {
      const c = o.grupo.controles[0];
      const e = c.estados[0];
      const valor = e.tipo === "bool" ? true : e.tipo === "faixa" ? Math.max(1, (e.min ?? 0) + 1) : null;
      if (valor == null) return false;
      mGeral.estadoMuda(e, valor, c.id);
      tiraEncerrado(o.chave);
      return true;
    },
    encerrar(a) {
      const combate = m.sessao.combate ?? {};
      if (a.tipo === "grupo") {
        const ligados = a.grupo.estados.filter((x) => estaLigado(x, combate[x.id]));
        const valores = Object.fromEntries(ligados.map((x) => [x.id, combate[x.id]]));
        const ordem = [...ligados.filter((x) => x.requerEstado), ...ligados.filter((x) => !x.requerEstado)];
        /* O Golpe Especial tem marcas próprias fora dos estados (Amplo, Impactante, Sanguinário, Lento, Sacrifício): guardam-se para
           reativar, e saem junto, para nada ficar marcado escondido. */
        const golpe = a.grupo.chave === CHAVE_GOLPE ? marcasDeAgora(m.sessao) : null;
        operar({ verbo: "Encerrado", nome: a.nome, alvo: `enc:${a.chave}`, fontesPv: fontesPvDe(a.grupo.item?.id) }, () => {
          ordem.forEach((x) => m.estadoMuda(x, padraoDe(x)));
          if (golpe) m.setMesa((mm) => ({ ...mm, sessao: { ...mm.sessao, golpeEspecial: {} } }));
        });
        guardaEncerrado({ chave: a.chave, nome: a.nome, restaurar: { tipo: "grupo", valores, ...(golpe ? { golpe } : {}) } });
        esqueceConcessoes(a.grupo.item?.id);
      } else if (a.tipo === "sustentado") {
        operar({ verbo: "Encerrado", nome: a.nome, alvo: `enc:${a.chave}` }, () => m.estadoMuda(a.estado, null));
        guardaEncerrado({ chave: a.chave, nome: a.nome, restaurar: { tipo: "sustentado", estadoId: a.estado.id, valor: a.feiticoId } });
      } else if (a.tipo === "condicao") {
        operar({ verbo: "Encerrada", nome: a.nome, alvo: `enc:${a.chave}` }, () => m.acoes.tirarCondicao(a.cond.id));
        guardaEncerrado({ chave: a.chave, nome: a.nome, restaurar: { tipo: "condicao", item: a.cond } });
      } else if (a.tipo === "registro" && ehInstanciaDePacote(a.reg)) {
        /* A instância de um Pacote para Aliados: sai da sessão e a opção fica na biblioteca. Reativar é uma ativação NOVA da opção, com o prazo
           contado de novo e o valor da revisão que estiver na biblioteca. Tirar pelo id lê a sessão de agora. */
        const id = a.reg.id;
        operar({ verbo: "Encerrado", nome: a.nome, alvo: `enc:${a.chave}` }, () => m.setMesa((mm) => ({ ...mm, sessao: { ...mm.sessao, buffs: (mm.sessao.buffs ?? []).filter((x) => x.id !== id) } })));
        guardaEncerrado({ chave: a.chave, nome: a.nome, restaurar: { tipo: "recebido", opcao: chaveDaOpcaoRecebida(a.reg.pacote.chave, a.reg.pacote.opcaoId), somaPresumida: !!a.reg.somaPresumida } });
      } else if (a.tipo === "buff" || a.tipo === "registro") {
        const item = a.buff ?? a.reg;
        operar({ verbo: "Encerrado", nome: a.nome, alvo: `enc:${a.chave}` }, () => m.acoes.buffs(m.sessao.buffs.filter((x) => x.id !== item.id)));
        guardaEncerrado({ chave: a.chave, nome: a.nome, restaurar: { tipo: "buff", item } });
      } else if (a.tipo === "exaustao") {
        operar({ verbo: "Zerada", nome: "Exaustão", alvo: a.chave }, () => m.acoes.exaustao(0));
      }
      if (tela.selecionado === a.chave) mudaTela({ selecionado: null });
    },
    /* Reativar é uma NOVA ativação: cobra de novo o que a ficha cobra, e o
       custo aparece no botão antes do clique. Não é desfazer o encerramento. */
    reativar(x) {
      const r = x.restaurar;
      tiraEncerrado(x.chave);
      const custo = custoDeReativar(x);
      if (r.tipo === "grupo") {
        const gr = grupos.find((y) => y.chave === x.chave);
        const ids = Object.keys(r.valores).sort((a, b) => (gr?.porId.get(a)?.requerEstado ? 1 : 0) - (gr?.porId.get(b)?.requerEstado ? 1 : 0));
        operar({ verbo: "Reativado", nome: x.nome, alvo: x.chave, custo }, () => ids.forEach((id) => { const e = gr?.porId.get(id); if (e) m.estadoMuda(e, r.valores[id]); }));
      } else if (r.tipo === "sustentado") {
        const e = grupos.find((y) => y.sustentacao)?.porId.get(r.estadoId);
        if (e) operar({ verbo: "Reativado", nome: x.nome, alvo: `sust:${r.estadoId}`, custo }, () => m.estadoMuda(e, r.valor));
      } else if (r.tipo === "condicao") operar({ verbo: "Reativada", nome: x.nome, alvo: x.chave }, () => m.acoes.condicoes([...m.sessao.condicoes, r.item]));
      else if (r.tipo === "buff") operar({ verbo: "Reativado", nome: x.nome, alvo: x.chave }, () => m.acoes.buffs([...m.sessao.buffs, r.item]));
      else if (r.tipo === "recebido") {
        const o = recebidas.find((y) => y.chave === r.opcao);
        if (!o) { m.avisar("A Opção Não Está Mais na Biblioteca"); return; }
        acoes.ativarRecebido(o, { somaPresumida: r.somaPresumida, verbo: "Reativado" });
      }
    },
    /* PACOTES PARA ALIADOS: ativar uma opção recebida cria UMA instância na sessão, com o benefício e o prazo dela a partir de agora. Não cobra
       nada (o custo é do emissor), não cria PV temporário e não mexe na biblioteca. Confere na sessão de AGORA, dentro da mesma escrita: a
       opção já ativa não ganha uma segunda instância (clique duplo, dois painéis), e a recusa não deixa nada pela metade. Devolve se passou. */
    ativarRecebido(o, { somaPresumida = false, verbo = "Ativado" } = {}) {
      const { entrada, opcao } = o.pacoteRecebido ?? {};
      if (!entrada || !opcaoAtivavel(opcao)) return false;
      if (instanciaAtivaDe(m.sessao, entrada.chave, opcao.id)) { m.avisar("Esta Opção Já Está Ativa"); return false; }
      const inst = instanciaDaOpcao(entrada, opcao, { id: `r${uid()}`, somaPresumida });
      const ok = operar({ verbo, nome: opcao.nome, alvo: o.chave }, () => m.setMesa((mm) => (instanciaAtivaDe(mm.sessao, entrada.chave, opcao.id)
        ? mm
        : { ...mm, sessao: { ...mm.sessao, buffs: [...(mm.sessao.buffs ?? []), inst] } })));
      /* A mesma opção encerrada antes sai dos Encerrados: ela está ativa de novo. */
      if (ok) m.setUi((u) => ({ ...u, encerrados: (u.encerrados ?? []).filter((y) => y.restaurar?.opcao !== o.chave) }));
      return ok;
    },
    usar(o) {
      operar({ verbo: "Usado", nome: o.nome, alvo: o.chave, instantaneo: true }, () => m.acoesFeitico.usar(o.item));
    },
    registrarUso(o) {
      m.setMesa((mm) => comEvento(mm, { tipo: "uso", nome: o.nome, chave: o.chave }));
      setResultado({ verbo: "Uso Registrado", nome: o.nome, alvo: o.chave, instantaneo: true, custo: custoAntes(o), chips: [], cobrado: 0, ts: Date.now() });
    },
    /* E2 (2026-10-15): o Registrar Uso do G2 gasta o uso do contador REAL do motor (`registraUso`, modelo.jsx),
       com a Energia, os usos e a regra de uma vez por rodada conferidos AGORA. O PE continua à mão. O `registrarUso`
       de cima, só de evento, fica para a lista antiga. Devolve se passou. */
    registrarUsoReal(o) {
      const p = planoDoUso({ o, m });
      if (p.bloqueios.length) { m.avisar(p.bloqueios[0]); return false; }
      const r = m.registrarUsoNaMesa({ chave: o.chave, nome: o.nome, itemId: p.itemId, esperado: p.usos ? p.usos.gastos : null, custoPE: p.custoPE });
      if (r.erro) return false;
      setResultado({ verbo: "Uso Registrado", nome: o.nome, alvo: o.chave, instantaneo: true, custo: p.custoPE ? { texto: `${p.custoPE} PE`, cobra: false, valor: p.custoPE } : null, usos: r.usos, chips: [], cobrado: 0, ts: Date.now() });
      return true;
    },
    rodadas(a, n) {
      const v = n == null ? null : Math.max(1, n);
      if (a.tipo === "condicao") operar({ verbo: "Ajustada", nome: a.nome, alvo: a.chave }, () => m.acoes.condicoes(m.sessao.condicoes.map((x) => (x.id === a.cond.id ? { ...x, rodadas: v } : x))));
      if (a.tipo === "buff" || a.tipo === "registro") {
        const id = (a.buff ?? a.reg).id;
        operar({ verbo: "Ajustado", nome: a.nome, alvo: a.chave }, () => m.acoes.buffs(m.sessao.buffs.map((x) => (x.id === id ? { ...x, rodadas: v } : x))));
      }
    },
    exaustao(n) { operar({ verbo: "Ajustada", nome: "Exaustão", alvo: "exaustao" }, () => m.acoes.exaustao(Math.max(0, n))); },
    registrarCondicao(c, rodadas) {
      operar({ verbo: "Registrada", nome: c.nome, alvo: null }, () => m.acoes.condicoes([...m.sessao.condicoes, { id: uid(), nome: c.nome, forca: c.forcaId, rodadas }]));
    },
    registrarFonte(reg) {
      operar({ verbo: "Registrado", nome: reg.origemNome, alvo: `rec:${reg.id}` }, () => m.acoes.buffs([...m.sessao.buffs, reg]));
    },
    /* A concessão vai para a Vida pela regra da sessão: a MESMA fonte topa, não
       soma. Ela fica registrada (`mesa.pvConcessoes`), e consumir o pote depois
       não a reabre. */
    pvRegistrar(b) {
      /* Revalida na mesa de agora (`registraPv`): clique repetido, painel desatualizado ou recarga não reabrem a concessão. */
      return !m.registrarPvNaMesa({ beneficio: b.beneficio, fonte: b.fonte, concede: b.concede, registroVisto: b.registro?.ts ?? null, rodadaVista: m.sessao.rodada }).erro;
    },
    pvTirar(fonte) {
      m.setMesa((mm) => {
        const f = { ...(mm.sessao.pvTempFontes ?? {}) };
        delete f[fonte];
        return { ...mm, sessao: { ...mm.sessao, pvTempFontes: f } };
      });
    },
    /* ---------- G2 · Entrega 1: o ciclo do Ataque Concentrado ----------
       Confirmar liga a intensidade escolhida e DESCONTA o custo dela (decisão
       do autor, 2026-10-14). O custo é o do motor, acumulado pela sequência
       Ataque Extra, Surto de Ação e Ataque Extra (`custoPE`: 1, 3 e 4 PE).
       Passa pelo `operar`: o resultado mede o que mudou e o PE que saiu. */
    /* `onde`: "compacta" abre o efeito no painel depois de confirmar; senão, o cartão na completa.
       Desde 2026-10-15: confirma só sobre o estado de PARTIDA (desligado), e sai
       dos Encerrados na mesma operação. O segundo clique de um clique duplo não
       cobra de novo. Navega só depois do sucesso, e devolve se passou. */
    confirmarAtivacao(o, valor, { onde = "completa" } = {}) {
      const c = o.grupo.controles[0];
      const e = c.estados[0];
      const custo = Math.max(0, Math.trunc(Number(custoDe(e, valor)) || 0));
      const ok = operar({ verbo: "Ativado", nome: o.nome, alvo: o.chave, custo: custo ? { texto: `${custo} PE`, cobra: true } : null },
        () => m.estadoPagando(e, valor, custo, `${o.nome} · ${rotuloDaFaixa(e, o.grupo)} ${valor}`, c.id, { esperado: padraoDe(e), tirarEncerrado: o.chave }));
      if (!ok) return false;
      mudaTela((t) => ({ selecionado: o.chave, revelar: o.chave, reativando: null, preparoC2: null, compactaAberto: onde === "compacta" ? o.chave : t.compactaAberto, catalogo: { ...t.catalogo, aberto: false, preparo: null } }));
      return true;
    },
    /* Subir cobra só a diferença do acumulado. Descer não devolve: o PE de uma
       concentração já feita não volta (decisão do autor, 2026-10-14). Confere
       a intensidade de partida, como o Confirmar. */
    confirmarAjuste(a, valor) {
      const c = a.grupo.controles[0];
      const e = c.estados[0];
      const atual = Math.trunc(Number(m.sessao.combate?.[e.id]) || 0);
      const dif = Math.max(0, Math.trunc(Number(custoDe(e, valor)) || 0) - Math.trunc(Number(custoDe(e, atual)) || 0));
      return operar({ verbo: "Ajustado", nome: a.nome, alvo: a.chave, custo: dif ? { texto: `${dif} PE`, cobra: true } : null },
        () => m.estadoPagando(e, valor, dif, `${a.nome} · ${rotuloDaFaixa(e, a.grupo)} ${atual} para ${valor}`, c.id, { esperado: atual }));
    },
    /* ---------- Catálogo, primeira entrega (2026-10-15): a Preparação comum ----------
       Concentrar Aura, Conhecimento Aplicado e Invencível sob o Sol (`temPreparo`).
       O plano (`g2/preparo.js`) é refeito AGORA, com a sessão que estiver
       valendo: se algo bloqueia, nada muda. Confirmar aplica os estados de uma
       vez (`aplicarEstados`: tudo ou nada, conferindo o valor de partida) e NÃO
       chama `gastoManual`. O custo à mão continua à mão (o resultado traz o
       Descontar), e a ficha cobra só o que o motor já cobra (o Invencível).
       Sair dos Encerrados vai na mesma operação. Navegar, só depois. */
    confirmarPreparo(o, valores, { onde = "completa", verbo = "Ativado", encerrado = null } = {}) {
      const plano = planoDoPreparo({ o, valores, m, encerrado });
      if (plano.bloqueios.length || !plano.mudou) {
        if (plano.bloqueios.length) m.avisar(plano.bloqueios[0]);
        return false;
      }
      const c = plano.custo;
      /* A Sustentação: o resultado e o cartão são os da vaga que recebeu o Feitiço, e o custo é o por rodada, à mão, sem valor
         presumido para o Descontar (a política de quando se paga a manutenção é da mesa). */
      const alvoCartao = plano.alvoResultado?.chave ?? o.chave;
      const nomeCartao = plano.alvoResultado?.nome ?? o.nome;
      const verboFinal = plano.trocas ? (plano.trocas.saem.length ? "Trocado" : verbo === "Ativado" ? "Sustentado" : verbo) : verbo;
      const porRodada = plano.trocas ? plano.custo.sustentacao?.find((x) => x.pe)?.pe ?? null : null;
      const custo = c.automatico ? c.rodada : c.manual ? { texto: `${c.manual} PE`, cobra: false, valor: c.manual } : porRodada ? { texto: `${porRodada} PE por Rodada`, cobra: false } : null;
      const ok = operar({ verbo: verboFinal, nome: nomeCartao, alvo: alvoCartao, custo, fora: foraDosNumeros(o.exemplo), usos: plano.usos ? { max: plano.usos.max, restam: Math.max(0, plano.usos.restam - 1) } : undefined },
        () => m.aplicarEstados(plano.pedido));
      if (!ok) return false;
      mudaTela((t) => ({ selecionado: alvoCartao, revelar: alvoCartao, reativando: null, preparoC2: null, compactaAberto: onde === "compacta" ? alvoCartao : t.compactaAberto, catalogo: { ...t.catalogo, aberto: false, preparo: null } }));
      return true;
    },
    /* O MONTADOR DO GOLPE ESPECIAL (consolidação ampliada, 2026-10-16): cada confirmação é UM golpe novo, e quem paga é a função
       da ficha (`pagaGolpeEspecial`, pelo `aplicaGolpe`): a ficha desconta, e o resultado diz quanto saiu da Energia. É a exceção
       do montador pelo contrato da função, e não a regra de confirmar. Devolve se passou. */
    confirmarGolpe(o, valores, { onde = "completa", verbo = "Montado" } = {}) {
      const plano = planoDoGolpe({ valores, m, simula: m.simularGolpe });
      if (plano.bloqueios.length) { m.avisar(plano.bloqueios[0]); return false; }
      const custo = { texto: `${plano.custo.aPagar} PE`, cobra: true };
      const ok = operar({ verbo, nome: o.nome, alvo: o.chave, custo, fora: foraDosNumeros(o.exemplo) }, () => m.aplicarGolpe(plano.pedido));
      if (!ok) return false;
      tiraEncerrado(o.chave);
      mudaTela((t) => ({ selecionado: o.chave, revelar: o.chave, reativando: null, preparoC2: null, compactaAberto: onde === "compacta" ? o.chave : t.compactaAberto, catalogo: { ...t.catalogo, aberto: false, preparo: null } }));
      return true;
    },
    /* O ACESSO DE HABILIDADES (consolidação ampliada, 2026-10-16): a linha e a consulta não ativam por um caminho imediato. Abrir a
       Preparação (o rascunho mora na tela, no painel) NÃO grava nada, e o que se confirma passa pelas mesmas operações do catálogo. */
    abrirPreparo(o) {
      const preparo = ehPiloto(o) ? { chave: o.chave, valor: 1 }
        : temPreparo(o) ? { chave: o.chave, valores: rascunhoDoCatalogo(o, m) }
          : ehGolpe(o) ? { chave: o.chave, valores: rascunhoDoGolpe(m) } : null;
      if (!preparo) return false;
      mudaTela({ preparoC2: preparo, compactaAberto: null });
      return true;
    },
    /* Efeito já ativo: o detalhe no painel, onde o Ajustar diz o que a habilidade realmente permite. */
    abrirNoPainel(chave) { mudaTela({ compactaAberto: chave, preparoC2: null }); },
    /* USAR NOVAMENTE (autor, 2026-10-16): não existe aumentar o uso atual, existe um uso novo, com o valor que o
       jogador escolher. O custo à mão é o do uso novo INTEIRO (9 PE de novo custam 9, e não a diferença), sempre
       manual: confirmar não desconta nem presume pagamento. Vale com o MESMO valor, e o contador de usos novos
       (`aplicaEstados`, `novoUso`) é o que o clique duplo não passa. Quando os estados não mudam, o resultado é
       posto direto: a sessão não vira outra e o `operar` diria "Nada Mudou". Devolve se passou. */
    confirmarNovoUso(a, valores) {
      const plano = planoDoPreparo({ o: a, valores, m, modo: "reuso" });
      if (plano.bloqueios.length) { m.avisar(plano.bloqueios[0]); return false; }
      const c = plano.custo;
      const info = { verbo: "Usado Novamente", nome: a.nome, alvo: a.chave, custo: c.manual ? { texto: `${c.manual} PE`, cobra: false, valor: c.manual } : null, fora: foraDosNumeros(a.exemplo) };
      /* Com estados diferentes, o resultado vem da medida de sempre (`operar`). */
      if (plano.lista.length) return operar(info, () => m.aplicarEstados(plano.pedido));
      if (m.aplicarEstados(plano.pedido).erro) return false;
      setResultado({ ...info, chips: [], cobrado: 0, ts: Date.now() });
      return true;
    },
    /* O ajuste: o custo à mão é só o ADICIONAL desta operação (de 2 para 3 PE, 1). Descer não devolve. */
    confirmarAjustePreparo(a, valores) {
      const plano = planoDoPreparo({ o: a, valores, m, modo: "ajuste" });
      if (plano.bloqueios.length || !plano.mudou) {
        if (plano.bloqueios.length) m.avisar(plano.bloqueios[0]);
        return false;
      }
      const c = plano.custo;
      return operar({ verbo: "Ajustado", nome: a.nome, alvo: a.chave, custo: c.manual ? { texto: `${c.manual} PE`, cobra: false, valor: c.manual } : null, fora: foraDosNumeros(a.exemplo) },
        () => m.aplicarEstados(plano.pedido));
    },
  };
  const usosDe = (chave) => (m.mesa.eventos ?? []).filter((ev) => ev.tipo === "uso" && ev.chave === chave).length;
  const ligadosComSustentacao = (o) => (o.pacoteRecebido ? !!instanciaAtivaDe(m.sessao, o.pacoteRecebido.entrada.chave, o.pacoteRecebido.opcao.id)
    : o.grupo ? grupoLigado(o.grupo, m.sessao.combate, m.sessao) : false);

  return {
    grupos, opcoes, ativos, efeitoDe: cons.porAtivo, cobertos: cons.cobertos, disputas, pv, emGrupos, analise: m.calculo?.analise ?? {},
    simulacao, pedirSimulacao: () => setQuerSimular(true), tela, mudaTela, mudaCatalogo, abrirCatalogo, irAoAtivo, custoDeReativar, grupoDoEstado,
    resultado, fecharResultado: () => setResultado(null), encerrados, acoes, mPara, mGeral, usosDe, ligado: ligadosComSustentacao,
  };
}

/* As consequências da linha: o que a fonte VALE onde houve disputa, e o que
   muda com ela no resto (com contra sem). PV Temporário tem bloco próprio. */
export function consequenciasDaLinha(a, g, m) {
  const marginais = semPvTemp(g.efeitoDe.get(a.chave));
  const contrib = contribuicao(a, m.derived, g.analise, g.emGrupos);
  const disputadas = new Set([...contrib.vale.keys(), ...(contrib.coberto ? marginais.map((c) => c.chave) : [])]);
  const chips = ordenarConsequencias([...semPvTemp([...contrib.vale.values()]), ...marginais.filter((c) => !disputadas.has(c.chave))]);
  return { chips, marginais, contrib };
}

/* A PRIMEIRA leitura: a finalidade curta do estudo, o efeito que o motor
   calcula para um Feitiço, ou a origem. Nunca inventada. O texto médio fica
   na consulta. */
export function finalidadeCurta(o) {
  if (o.exemplo?.finalidade) return o.exemplo.finalidade;
  if (o.recebido) return o.recebido;
  const props = o.item?.ref?.propriedades;
  if (Array.isArray(props)) {
    const ef = props.find((p) => p.id === "valor")?.valor;
    if (ef) return `Efeito ${ef}`;
  }
  return null;
}
