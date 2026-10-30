/**
 * ============================================================
 * O MODELO DA ABA EFEITOS SOBRE A SESSÃO DA FICHA
 * ============================================================
 * Nasceu no protótipo como `useFichaModelo`, que tinha UMA mesa própria. Aqui não existe segunda cópia de nada: o modelo recebe a
 * sessão, o derive e o `atualiza` da Ficha (`AftyFicha.jsx`), e é só o ADAPTADOR entre eles e as telas dos Efeitos:
 *
 *   - `m.sessao`, `m.derived`, `m.calculo`  os da Ficha, e nunca recalculados aqui;
 *   - `m.mesa`, `m.setMesa`  a visão da sessão com o registro das operações (`sessao-g2.js`). `setMesa(fn)` roda `fn` DENTRO de um
 *     `atualiza`, sobre a sessão que estiver valendo, e grava o resultado pela mesma porta de todo escritor da Ficha (aparada nos dois
 *     sentidos, salva por debounce). Operação que recusa devolve a mesa que recebeu, e a sessão nem muda;
 *   - `m.aplicarEstados`, `m.aplicarGolpe`, ...  a confirmação TUDO OU NADA: a prova roda na mesa de agora, e confirmar roda de novo
 *     sobre a que estiver valendo (`confirmaNaMesa`). A recusa avisa, e o evento do histórico só nasce depois do sucesso.
 *
 * O estado de TELA (seleção da consulta, o aviso) fica aqui no React, fora da sessão: consultar, selecionar e filtrar nunca
 * descontam Energia nem refazem uma ativação.
 * ============================================================
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import * as Sessao from "../ficha-sessao";
import { comAddons, deltaDeEstados, saldo } from "./ponte";
import { controlesEmJogo, donoNoRepertorio, estadosDaFicha, montarRepertorio } from "./repertorio";
import { prepararCalculo } from "./recebidos";
import { aplicaEstados, aplicaGolpe, descontaEnergia, pagaEstado, registraPv, registraUso } from "./operacoes";
import { avancaRodadaComRegistro, daSessao, descansaComRegistro, paraSessao } from "./sessao-g2";
import { alterarEstado, danoOuCura, desfazer, energiaDisponivel, gastoManual, usarFeitico } from "./mesa-verbos";
import { bibliotecaDaFicha, pacotesDoEmissor } from "../pacotes-aliados";

/* `gravarRecebidos` e `gravarPacotesAliados` (Pacotes para Aliados, 2026-10-19): a biblioteca recebida e os pacotes do suporte moram NO PERSONAGEM
   (`creature.pacotesRecebidos` e `creature.pacotesAliados`), e quem grava é a Ficha, pelo armazenamento de sempre. Cada um recebe uma função
   `(atual) => novo`, aplicada sobre o ÚLTIMO valor gravado: duas importações seguidas não gravam uma sobre a cópia velha da outra. Sem eles
   (ficha aberta fora da rota), a tela só lê. */
export function useModeloG2({ alvoId, ficha, sessao, derived, calculo, atualiza, gravarRecebidos = null, gravarPacotesAliados = null }) {
  const [aviso, setAviso] = useState(null);
  const [selecaoChave, setSelecaoChave] = useState(null);
  const combate = !!sessao.combate?.ativo;

  /* ---------- a mesa: a sessão e o registro das operações ---------- */
  const mesa = useMemo(() => daSessao(sessao), [sessao]);
  const setMesa = useCallback((fn) => atualiza((s) => {
    const antes = daSessao(s);
    const depois = fn(antes);
    return depois === antes ? s : paraSessao(depois);
  }), [atualiza]);
  /* `ui.encerrados` mora na sessão (o Reativar sobrevive a recarregar). O resto do estado de tela fica no React. */
  const setUi = useCallback((fn) => setMesa((mm) => {
    const ui = fn(mm.ui);
    return ui === mm.ui ? mm : { ...mm, ui: { ...mm.ui, encerrados: ui.encerrados ?? mm.ui.encerrados } };
  }), [setMesa]);

  /* ---------- o pacote do repertório, do derive REAL ---------- */
  const pacote = useMemo(() => comAddons(ficha, () => {
    const rep = montarRepertorio(ficha, derived);
    const estados = estadosDaFicha(derived);
    return { rep, estados, controles: controlesEmJogo(estados, rep) };
  }), [ficha, derived]);

  const controlesPorDono = useMemo(() => {
    const mapa = new Map();
    for (const c of pacote.controles) if (c.dono) mapa.set(c.dono.chave, [...(mapa.get(c.dono.chave) ?? []), c]);
    return mapa;
  }, [pacote.controles]);
  const fixados = sessao.favoritos ?? [];

  /* O saldo do Agora (os números que algum efeito mexe), para a marca de efeito do cabeçalho. Um derive a mais, com as MESMAS opções
     da Ficha, e adiado: a tela pinta primeiro e a conta vem depois. */
  const calculoAdiado = useDeferredValue(calculo);
  const sessaoAdiada = useDeferredValue(sessao);
  const saldoAgora = useMemo(
    () => saldo(calculoAdiado.fichaCalc, { ...sessaoAdiada, buffs: calculoAdiado.sessaoCalc.buffs }, calculoAdiado.derived),
    [calculoAdiado, sessaoAdiada],
  );
  const marcadas = useMemo(() => new Set(saldoAgora.map((x) => x.chave)), [saldoAgora]);

  /* ---------- verbos ---------- */
  const avisar = useCallback((texto) => setAviso({ texto, ts: Date.now() }), []);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 4200);
    return () => clearTimeout(t);
  }, [aviso]);
  /* O que acabou de mudar nos recursos, para o indicador de cada um mostrar por um instante (+3, −4). É só tela. */
  const [flash, setFlash] = useState(null);
  const flashDe = (mudou) => {
    if (!mudou) return;
    const ts = Date.now();
    setFlash({
      pv: mudou.vida || mudou.casca ? { valor: (mudou.vida ?? 0) + (mudou.casca ?? 0), ts } : null,
      pe: mudou.pe ? { valor: mudou.pe, ts } : null,
      alma: mudou.alma ? { valor: mudou.alma, ts } : null,
      preparo: mudou.preparo ? { valor: mudou.preparo, ts } : null,
    });
  };
  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(t);
  }, [flash]);

  const depsEstados = useMemo(() => ({ derived, calculo: (s) => prepararCalculo(ficha, s).derived }), [derived, ficha]);
  /* TUDO OU NADA. A prova roda na mesa de agora e a recusa avisa e para. Confirmar roda a MESMA operação de novo, dentro do `atualiza`,
     sobre a sessão que estiver valendo, e só aí o resultado é gravado. Uma recusa de última hora devolve a mesa de antes. */
  const operaNaMesa = (fn, aoConfirmar = null) => {
    const prova = fn(mesa);
    if (prova.erro) { avisar(prova.erro); return { erro: prova.erro }; }
    setMesa((mm) => {
      const r = fn(mm);
      return r.erro ? mm : r.mesa;
    });
    aoConfirmar?.(prova);
    return {};
  };
  const confirmaNaMesa = (operacao, pedido, aoConfirmar = null) => operaNaMesa((mm) => operacao(mm, pedido, depsEstados), aoConfirmar);

  /* Um estado pelo verbo do motor (`alteraEstadoCombate`, com o derive: a Expansão paga o PE e cobra a Exaustão). O verbo pode RECUSAR (o
     Invencível sem Em Combate ou sem Energia): a prova roda na mesa de agora, avisa, e a sessão não muda. */
  const estadoMuda = (estado, valor) => {
    const prova = alterarEstado(mesa, estado, valor, derived);
    if (prova.recusado) {
      if (estado.id === "invencivelSobOSol") avisar("Invencível sob o Sol não ligou: pede Em Combate e 4 PE");
      return { erro: "recusado" };
    }
    setMesa((mm) => { const r = alterarEstado(mm, estado, valor, derived); return r.recusado ? mm : r.mesa; });
    return {};
  };
  const estadoPagando = (estado, valor, custo, motivo, controleId, opcoes = {}) => (
    confirmaNaMesa(pagaEstado, { estado, valor, custo, motivo, controleId, ...opcoes }, custo ? () => flashDe({ pe: -custo }) : null)
  );
  const simularEstados = (pedido) => aplicaEstados(mesa, pedido, depsEstados);
  const aplicarEstados = (pedido) => confirmaNaMesa(aplicaEstados, pedido);
  const simularGolpe = (pedido) => aplicaGolpe(mesa, pedido, depsEstados);
  const aplicarGolpe = (pedido) => confirmaNaMesa(aplicaGolpe, pedido);
  const registrarPvNaMesa = (pedido) => confirmaNaMesa((mm, p) => registraPv(mm, p, { calculo: depsEstados.calculo }), pedido);
  const registrarUsoNaMesa = (pedido) => {
    let usos = null;
    const r = confirmaNaMesa((mm, p, deps) => { const out = registraUso(mm, p, deps); usos = out.usos ?? usos; return out; }, pedido);
    return { ...r, usos };
  };

  const acoes = {
    alternaCombate: () => atualiza((s) => Sessao.aplicaPatchCombate(s, { ativo: !s.combate?.ativo })),
    proximaRodada: () => atualiza((s) => avancaRodadaComRegistro(s, derived)),
    descansar: (opcoes = {}) => atualiza((s) => descansaComRegistro(s, derived, opcoes)),
    /* O Descontar contextual: uma subtração real, conferida na mesa de agora (`descontaEnergia`). */
    descontarEnergia: (pedido) => confirmaNaMesa(descontaEnergia, pedido, () => flashDe({ pe: -Math.max(0, Math.trunc(Number(pedido.valor) || 0)) })),
    /* Os recursos pelos verbos próprios da Ficha. O dano come a casca antes da Vida, o gasto de Energia come a casca antes da reserva, e na
       Alma do jogador o dano desce a Vida junto. Cada um registra o evento no histórico, e o gasto de Energia é o que o Estornar PE devolve. */
    dano: (n, naAlma = false) => operaNaMesa((mm) => danoOuCura(mm, { valor: n, tipo: "dano", naAlma }, derived), (prova) => flashDe(prova.mudou)),
    cura: (n, naAlma = false) => operaNaMesa((mm) => danoOuCura(mm, { valor: n, tipo: "cura", naAlma }, derived), (prova) => flashDe(prova.mudou)),
    gastar: (n, motivo) => operaNaMesa((mm) => gastoManual(mm, n, motivo, derived), () => flashDe({ pe: -n })),
    recuperarPe: (n) => {
      const quanto = Math.max(0, Math.trunc(Number(n) || 0));
      atualiza((s) => ({ ...s, peAtual: Math.max(0, s.peAtual + quanto) }));
      flashDe({ pe: quanto });
      return {};
    },
    definir: (tipo, n) => {
      const v = Math.max(0, Math.trunc(Number(n) || 0));
      if (tipo === "pv") atualiza((s) => ({ ...s, hpAtual: v }));
      else if (tipo === "pe") atualiza((s) => ({ ...s, peAtual: v }));
      else if (tipo === "alma") atualiza((s) => Sessao.defineAlma(s, v, derived));
      else if (tipo === "preparo") atualiza((s) => Sessao.definePreparo(s, v, derived.pontosPreparo));
      return {};
    },
    /* O Preparo corrente (Combatente): gasta e recupera pelos verbos dele, sem tratar como Energia. */
    gastarPreparo: (n) => { atualiza((s) => Sessao.alteraPreparo(s, -n, derived.pontosPreparo)); flashDe({ preparo: -n }); return {}; },
    recuperarPreparo: (n) => { atualiza((s) => Sessao.alteraPreparo(s, n, derived.pontosPreparo)); flashDe({ preparo: n }); return {}; },
    condicoes: (lista) => atualiza((s) => Sessao.defineCondicoes(s, lista)),
    tirarCondicao: (id) => atualiza((s) => Sessao.defineCondicoes(s, s.condicoes.filter((x) => x.id !== id))),
    buffs: (b) => atualiza((s) => ({ ...s, buffs: b })),
    exaustao: (v) => atualiza((s) => ({ ...s, exaustao: Math.max(0, Math.trunc(Number(v) || 0)) })),
  };

  /* Usar um Feitiço pelo catálogo: cobra o PE dele e registra a ativação (que o Estornar PE devolve). */
  const acoesFeitico = {
    usar: (e) => {
      const f = e.ref ?? e;
      const r = operaNaMesa((mm) => usarFeitico(mm, f, derived), () => flashDe({ pe: -Math.max(0, Math.trunc(Number(f.custoPE) || 0)) }));
      if (!r.erro && selecaoChave !== e.chave && e.chave) setSelecaoChave(e.chave);
      return r;
    },
  };

  /* O Estornar PE: o `desfazer` de `mesa-verbos.js`, com a conferência `podeDesfazer`, sobre a sessão que estiver valendo. */
  const historicoProps = {
    mesa,
    onDesfazer: (id) => confirmaNaMesa((mm, p) => desfazer(mm, p.id, derived), { id }),
  };

  const fixar = (chave) => atualiza((s) => {
    const fav = s.favoritos ?? [];
    return { ...s, favoritos: fav.includes(chave) ? fav.filter((x) => x !== chave) : [...fav, chave] };
  });

  /* ---------- a consulta: o item e os controles dele ---------- */
  const resolver = useCallback((chave) => {
    if (!chave) return null;
    if (pacote.rep.porChave.has(chave)) return pacote.rep.porChave.get(chave);
    if (chave.startsWith("estado:")) {
      const id = chave.slice(7);
      const e = pacote.estados.find((x) => x.id === id);
      if (!e) return null;
      const c = pacote.controles.find((x) => x.estados.some((y) => y.id === id));
      return { chave, tipo: "estado", nome: c?.rotulo ?? e.label, secaoRotulo: "Estado", marcas: [], dono: donoNoRepertorio(e, pacote.rep), controle: c };
    }
    if (chave.startsWith("condicao:")) {
      const nome = chave.slice(9);
      return { chave, tipo: "condicao", nome, secaoRotulo: "Condição", marcas: [], aplicada: (sessao.condicoes ?? []).some((c) => c.nome === nome) };
    }
    return null;
  }, [pacote, sessao.condicoes]);
  const selecionar = useCallback((chave) => setSelecaoChave(chave), []);
  const item = useMemo(() => resolver(selecaoChave), [resolver, selecaoChave]);
  const doItem = item?.tipo === "estado" ? (item.controle ? [item.controle] : []) : (item ? controlesPorDono.get(item.chave) ?? [] : []);
  /* Controle de OUTRO dono que é parte deste ("Postura" e "Postura · Segunda", de Mestre da Postura): a consulta mostra os dois juntos. */
  const relacionados = useMemo(() => {
    if (!item || item.tipo === "estado") return [];
    const base = (r = "") => { const i = r.indexOf(" · "); return i > 0 ? r.slice(0, i) : null; };
    return pacote.controles.filter((c) => !doItem.includes(c) && doItem.some((d) => base(c.rotulo) === d.rotulo || base(d.rotulo) === c.rotulo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacote.controles, item?.chave]);
  const deltas = useMemo(
    () => deltaDeEstados(calculo.fichaCalc, { ...sessao, buffs: calculo.sessaoCalc.buffs }, derived, [...doItem, ...relacionados].flatMap((c) => c.estados)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ficha, sessao, derived, item?.chave],
  );

  const disponivel = energiaDisponivel(sessao);
  /* A biblioteca de pacotes recebidos e os pacotes que este personagem prepara para aliados, lidos da ficha pela mesma lista branca do arquivo. */
  const biblioteca = useMemo(() => bibliotecaDaFicha(ficha), [ficha]);
  const pacotesEmissor = useMemo(() => pacotesDoEmissor(ficha), [ficha]);
  return {
    biblioteca, pacotesEmissor, gravarRecebidos, gravarPacotesAliados,
    alvoId, mesaId: alvoId, ficha, mesa, setMesa, setUi, ui: mesa.ui, sessao, derived, calculo, pacote, combate,
    controlesPorDono, fixados, fixar, marcadas, aviso, avisar,
    selecaoChave, item, doItem, relacionados, deltas, resolver, selecionar,
    estadoMuda, estadoPagando, simularEstados, aplicarEstados, simularGolpe, aplicarGolpe, registrarUsoNaMesa, registrarPvNaMesa,
    acoes, acoesFeitico, historicoProps, disponivel, flash,
  };
}
