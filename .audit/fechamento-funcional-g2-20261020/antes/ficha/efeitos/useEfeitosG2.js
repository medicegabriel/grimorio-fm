/**
 * ============================================================
 * O ESTADO DE TELA DA ABA EFEITOS, DO PAINEL AO LADO, DA CONSULTA E DO HISTÓRICO
 * ============================================================
 * Nasceu em `Estudo.jsx` do protótipo, onde o componente era dono da página. Aqui a Ficha (`AftyFicha.jsx`) é a dona da página e das abas,
 * e este hook só guarda o que é de TELA: qual aba voltar, se o painel está aberto, a pilha de consultas, o histórico aberto.
 *
 *   COMPLETA   a aba Efeitos (na Ficha ela mantém o id `buffs`, que é o gancho de tema `[data-afty-aba="buffs"]` e o que a navegação antiga lê).
 *   COMPACTA   o painel ao lado das outras abas, aberto e fechado pelo acesso "Efeitos" do cabeçalho.
 * Expandir leva à completa lembrando a aba de onde se veio. Recolher volta para ela, com o painel aberto. Seleção, filtros e busca moram num
 * estado só (`useGestor`), e a linha que estava à vista continua à vista.
 *
 * NADA daqui mexe na sessão: consultar, selecionar, filtrar, abrir o painel e rolar nunca descontam Energia nem refazem uma ativação. O que
 * muda o jogo vai pelos verbos de `useModeloG2`.
 * ============================================================
 */
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { fichaDaCondicao } from "./ponte";
import { detalhesDoAtivo } from "./efeitos-dados";
import { useTamanhoDaJanela } from "./historico-logica";

/** O id que a aba Efeitos tem na Ficha. Era a aba Buffs, e o id ficou para o gancho de tema e para a navegação antiga continuarem valendo. */
export const ABA_EFEITOS = "buffs";

/* Cada lista guarda a PRÓPRIA posição (os Ativos, a lista do painel e o detalhe aberto nele): a restauração genérica dos outros rolos não
   pode desfazê-las. */
const CHAVE_PAINEL = "fm_ficha_painel_efeitos_v1";
const lePainelAberto = () => { try { return localStorage.getItem(CHAVE_PAINEL) === "1"; } catch { return false; } };
const guardaPainelAberto = (v) => { try { localStorage.setItem(CHAVE_PAINEL, v ? "1" : "0"); } catch { /* sem armazenamento: só não lembra */ } };
const posicaoPropria = (rolavel) => rolavel === "ativos" || rolavel === "compacta";

export function useEfeitosG2({ tab, setTab, m, g, raiz }) {
  const aba = tab;
  const [voltarPara, setVoltarPara] = useState("habilidades");
  /* O painel nasce FECHADO (as outras abas seguem como sempre foram) e quem o abre o encontra aberto da próxima vez: é conveniência de quem vê, e
     não da ficha, então fica no navegador, com tudo dentro de try (bloqueado, sem espaço ou modo privado não derrubam nada). */
  const [painel, setPainelBruto] = useState(lePainelAberto);
  const setPainel = useCallback((fn) => setPainelBruto((p) => { const v = typeof fn === "function" ? fn(p) : fn; guardaPainelAberto(v); return v; }), []);
  const [focoBusca, setFocoBusca] = useState(0);
  /* O catálogo aberto pelo Adicionar da compacta volta para ela, e não para os Ativos da completa. */
  const [catalogoDaCompacta, setCatalogoDaCompacta] = useState(false);
  const catalogoAberto = g.tela.catalogo.aberto;
  const [catalogoVisto, setCatalogoVisto] = useState(catalogoAberto);
  if (catalogoVisto !== catalogoAberto) {
    setCatalogoVisto(catalogoAberto);
    if (!catalogoAberto) setCatalogoDaCompacta(false);
  }
  const [consulta, setConsulta] = useState({ pilha: [], ativa: null, volta: null, modo: "completa" });
  /* O Histórico sob demanda: um painel flutuante POR CIMA, aberto pelo cabeçalho ou pelo pé dos Ativos. Só estado de tela: nada disto toca a
     sessão, e a seleção, o efeito aberto e a rolagem de quem abriu ficam onde estavam. O filtro mora aqui para o painel poder ser refeito ao
     redimensionar a janela sem fechar nem perder o filtro. */
  const [historico, setHistorico] = useState(null);
  const abrirHistorico = useCallback((ancora) => setHistorico((h) => ({ ancora, filtro: h?.filtro ?? "tudo" })), []);
  const tamanhoDaJanela = useTamanhoDaJanela();
  /* Estável: o `Flutuante` devolve o foco ao primeiro botão sempre que o `onFechar` muda (a cada mudança da sessão, por exemplo). */
  const fecharHistorico = useCallback(() => setHistorico(null), []);
  const mudarFiltroDoHistorico = useCallback((filtro) => setHistorico((h) => ({ ...h, filtro })), []);
  const selecionar = m.selecionar;

  /* ---------- posições de leitura ---------- */
  const posicoes = useRef(new Map());
  const guarda = () => raiz.current?.querySelectorAll("[data-rolavel]").forEach((el) => posicoes.current.set(`${aba}:${el.dataset.rolavel}`, el.scrollTop));
  /* Entrar na aba Efeitos começa só com os ativos. \`lado\` abre o catálogo em Da Ficha (encontrar) ou em Fonte Externa (registrar), e o catálogo
     guarda categoria, busca, opção e rolagem para quando voltar. */
  const ladoDoG2 = (lado) => g.abrirCatalogo(lado === "encontrar" ? "ficha" : lado === "registrar" ? "externa" : null);
  const irPara = (id, lado) => {
    const destino = id === "efeitos" ? ABA_EFEITOS : id;
    if (destino === ABA_EFEITOS && lado === undefined) setCatalogoDaCompacta(false);
    if (destino === ABA_EFEITOS && (lado !== undefined || aba !== ABA_EFEITOS)) ladoDoG2(lado ?? null);
    if (destino === aba) return;
    guarda();
    if (destino === ABA_EFEITOS) setVoltarPara(aba);
    setTab(destino);
  };
  useLayoutEffect(() => {
    raiz.current?.querySelectorAll("[data-rolavel]").forEach((el) => {
      if (posicaoPropria(el.dataset.rolavel)) return;
      const v = posicoes.current.get(`${aba}:${el.dataset.rolavel}`);
      if (v != null) el.scrollTop = v;
    });
  }, [aba, painel, raiz]);

  /* A leitura da aba não pula quando o painel abre ou fecha. */
  const ancoraLista = useRef(null);
  const alternaPainel = () => {
    const lista = raiz.current?.querySelector("[data-lista]");
    if (lista) {
      const topo = lista.getBoundingClientRect().top + 60;
      const alvo = [...lista.querySelectorAll(".e-linha, .e-grupo-topo")].find((el) => el.getBoundingClientRect().bottom > topo);
      ancoraLista.current = alvo ? { el: alvo, dy: alvo.getBoundingClientRect().top - lista.getBoundingClientRect().top } : null;
    }
    setPainel((p) => !p);
  };
  useLayoutEffect(() => {
    const a = ancoraLista.current;
    ancoraLista.current = null;
    const lista = raiz.current?.querySelector("[data-lista]");
    if (!a || !lista || !a.el.isConnected) return;
    lista.scrollTop += (a.el.getBoundingClientRect().top - lista.getBoundingClientRect().top) - a.dy;
  }, [painel, raiz]);

  /* Expandir leva ao MESMO efeito na completa; Adicionar abre o catálogo e volta. */
  const recolher = () => { setPainel(true); irPara(voltarPara === ABA_EFEITOS ? "habilidades" : voltarPara); };
  const expandirC2 = (chave) => { g.mudaTela({ preparoC2: null, ...(chave ? { selecionado: chave, revelar: chave } : {}) }); irPara("efeitos"); };
  /* O acesso de Habilidades abre o painel (se estava fechado) sem mudar de aba: a lista, a busca e a rolagem ficam como estavam. */
  const abrirPainel = () => { if (!painel) alternaPainel(); };
  const adicionarC2 = (abaCat) => { irPara("efeitos", abaCat === "externa" ? "registrar" : "encontrar"); setCatalogoDaCompacta(true); if (abaCat !== "externa") setFocoBusca((n) => n + 1); };
  const voltarDoCatalogo = catalogoDaCompacta ? () => { setCatalogoDaCompacta(false); g.abrirCatalogo(null); recolher(); } : null;

  /* ---------- a regra ---------- */
  const resolverEstudo = useCallback((chave) => {
    if (chave?.startsWith("condicao:")) {
      const f = fichaDaCondicao(chave.slice(9));
      return { chave, tipo: "condicao", nome: f.nome, texto: f.descricao ?? f.resumo ?? "", forcaLabel: f.forcaLabel, marcas: [] };
    }
    const e = m.resolver(chave);
    if (e?.tipo === "estado") {
      const est = m.pacote.estados.find((x) => `estado:${x.id}` === chave);
      return { ...e, texto: est?.title ?? "" };
    }
    return e;
  }, [m]);
  const devolverFoco = (c) => requestAnimationFrame(() => {
    const el = (c.volta && c.volta.isConnected ? c.volta : null) ?? raiz.current?.querySelector(`[data-chave="${CSS.escape(c.ativa ?? "")}"]`);
    el?.focus({ preventScroll: true });
  });
  /* modo: "completa" (aba Habilidades), "resumo" (Encontrar: a descrição média e a regra, sem os controles) ou "regra" (o detalhe de um ativo já
     mostra a descrição e os controles: fica só o texto integral). */
  const abrirConsulta = useCallback((chave, modo = "completa") => {
    const volta = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConsulta((c) => ({ pilha: [chave, ...c.pilha.filter((k) => k !== chave)].slice(0, 3), ativa: chave, volta: c.volta ?? volta, modo }));
    if (!chave.startsWith("condicao:")) selecionar(chave, { empurra: false });
  }, [selecionar]);
  const consultarRegra = useCallback((chave, modo = "regra") => abrirConsulta(chave, modo), [abrirConsulta]);
  const ativar = (chave) => { setConsulta((c) => ({ ...c, ativa: chave })); if (!chave.startsWith("condicao:")) selecionar(chave, { empurra: false }); };
  const fechar = useCallback(() => { setConsulta((c) => { devolverFoco(c); return { pilha: [], ativa: null, volta: null, modo: "completa" }; }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const fecharUma = (chave) => {
    const pilha = consulta.pilha.filter((k) => k !== chave);
    const ativa = consulta.ativa === chave ? pilha[0] ?? null : consulta.ativa;
    if (!ativa) { fechar(); return; }
    setConsulta({ ...consulta, pilha, ativa });
    if (!ativa.startsWith("condicao:")) selecionar(ativa, { empurra: false });
  };

  const atencao = g.ativos.reduce((s, a) => s + detalhesDoAtivo(a, m).atencao.length, 0);
  const completa = aba === ABA_EFEITOS;
  const compacta = !completa && painel;
  const acesso = completa
    ? { rotulo: "Efeitos", pressionado: true, onClick: recolher, controla: undefined, dica: "Recolher no Painel" }
    : { rotulo: "Efeitos", pressionado: painel, onClick: alternaPainel, controla: "g-painel", dica: painel ? "Fechar o Painel" : "Abrir o Painel" };

  return {
    aba, completa, compacta, painel, acesso, atencao, focoBusca, setFocoBusca,
    irPara, recolher, expandirC2, abrirPainel, adicionarC2, voltarDoCatalogo,
    consulta, abrirConsulta, consultarRegra, ativar, fechar, fecharUma, resolverEstudo,
    historico, abrirHistorico, fecharHistorico, mudarFiltroDoHistorico, tamanhoDaJanela,
  };
}
