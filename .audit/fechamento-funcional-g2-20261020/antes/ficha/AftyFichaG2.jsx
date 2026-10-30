import React, { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArmasTransformaveis } from "../ui/armas-transformaveis";
import { AlertTriangle, Lock } from "lucide-react";

import "./ficha.css";
import "./efeitos/efeitos-g2.css";
import { mesclaFichaAfty } from "../afty-schema";
import { deriveAfty } from "../afty-derive";
// A Herança criada pela mesa (2026-10-01, Etapa 11). O derive já carregou o módulo.
import { criaHeranca } from "../afty-invocacoes";
import { preparaAtivacaoComCustoVida } from "../afty-feiticos";
import { preparaRolagemCura } from "../afty-cura";
import { Guarda } from "../ui/guarda";
import { PainelTita } from "../ui/tita";
import {
  carregarSessao, salvarSessao, aparaSessao, aplicaPerdaDeVida, pagaCustoVida, registraRolagem,
  sofreGolpeNaGuarda, desfazGolpeNaGuarda, encerraGuarda, defineCondicoes, alteraEstadoCombate,
  aplicaPatchCombate, consomeEstadoCombate, registraFeiticoDano, alteraTreinoAtivo, configuraRitual,
  iniciaRitualComum, iniciaRitualSemTeste, iniciaRitualEstendido, concluiPreparacaoRitual, cancelaRitual,
  finalizaRitual, encerraRitual, desativaRitual, concedeNaSessao, removeConcessao, estadoDaInvocacao,
  alternaAuxilioInvocacao, aplicaCuraInvocacao, defineVitalInvocacao, invocacaoDaMesa, entradaDaInvocacao,
  invocaNaMesa, saiDeCampo, recolheInvocacao, reconstroiInvocacao, alternaAuraInvocacao, defineEmTarefa,
  defineFormaInvocacao, alternaOpcaoDeEntrada, ativaReservaInvocacao, pagaManutencaoCorpo, aplicaDanoNaMesa,
  formaMecha, separaMecha, trocaNucleo, mechaPermitido, emCombateNaSessao, estadoTita, aplicaDanoTitaCabeca,
  aplicaCuraTitaCabeca, defineVitalTitaCabeca, aplicaDanoTitaMembro, aplicaCuraTitaMembro,
  defineVitalTitaMembro, usosGastosDe, marcaUso,
} from "./ficha-sessao";
import { prepararRolagemEspecializacao, registrarAtaqueEspecializacao, aplicarCuraRoladaEspecializacao } from "./ficha-especializacoes";
import { rolarTeste, rolarDano } from "./ficha-rolagem";
import { preparaRolagemArma, registraRolagemArma, configuraArmaNaSessao, marcaErroDaArma, danoDaAmpla, usaAmpla } from "../afty-propriedades-armas";
import PrimitivasDeAddon from "../ui/PrimitivasDeAddon";
import { conteudoDaFicha, equipamentosDaFicha, alvosDeBusca } from "./ficha-conteudo";
import {
  carregarTema, salvarTemaGlobal, cssDasVars, cssDoUsuario, temCssLivre, carregarDensidade, salvarDensidade,
  normalizaTema, escopoDaInvocacao, SEM_CSS,
} from "./ficha-tema";
import PainelDeRolagens from "./PainelDeRolagens";
import BuscaGlobal from "./BuscaGlobal";
import PainelDeAparencia from "./PainelDeAparencia";
import PainelBloodfeast, { ConjuracaoBloodfeast } from "./PainelBloodfeast";
import ControleTecnicaMaxima from "./ControleTecnicaMaxima";
import ControleExpansao, { PainelExaustaoTecnica } from "./ControleExpansao";
import AbaAcoes from "./abas/AbaAcoes";
import PainelDharma from "./PainelDharma";
import PainelDeAdaptacao from "./PainelDeAdaptacao";
import PainelDoVislumbre from "./PainelDoVislumbre";
import PainelOlhinhosLu from "./PainelOlhinhosLu";
import PainelOlhosAgulha from "./PainelOlhosAgulha";
import PainelDoGolpeEspecial from "./PainelDoGolpeEspecial";
import PainelManipulacaoCeu from "./PainelManipulacaoCeu";
import AbaPericias from "./abas/AbaPericias";
import AbaBuffs from "./abas/AbaBuffs";
import AbaEquipamentos from "./abas/AbaEquipamentos";
import AbaInvocacoes from "./abas/AbaInvocacoes";
import { saldoDoAgora } from "./ficha-buffs";
import { useDeltaDosEstados } from "./usar-delta-dos-estados";
// A aba Efeitos (G2): o cabeçalho, as Habilidades, a completa e a compacta, a consulta, o histórico e o estado deles. Ver docs/afty-ficha-final.md.
import { opcoesDeriveDaSessao } from "./ficha-opcoes-derive";
import { estatisticasDoCabecalho, comEstatisticasDoCabecalho } from "./ficha-preferencias";
import { prepararCalculo } from "./efeitos/recebidos";
import { useModeloG2 } from "./efeitos/useModeloG2";
import { useEfeitosG2, ABA_EFEITOS } from "./efeitos/useEfeitosG2";
import { useGestor } from "./efeitos/gestor-logica";
import { HistoricoCtx } from "./efeitos/historico-logica";
import { HistoricoPainel } from "./efeitos/HistoricoSessao";
import CabecalhoG2 from "./efeitos/CabecalhoG2";
import HabilidadesG2 from "./efeitos/HabilidadesG2";
import ConsultaG2 from "./efeitos/ConsultaG2";
import CompactaG2 from "./efeitos/CompactaG2";
import { VisaoG2 } from "./efeitos/VisaoG2";
import { AvisoFlutuante } from "./efeitos/pecas";
// O padrão global de tema é POR SISTEMA: "quero todas as minhas fichas assim"
// dito no Grimório Afty não pode repintar as fichas de jogador. Ver afty-sistema.js.
import { sistemaDaFicha } from "../afty-sistema";
import { cofreTrancado, comTextoAberto, lerAberto } from "../afty-cofre";
import PainelDoCofre from "../ui/PainelDoCofre";
import EspinhoCard from "../ui/EspinhoCard";

/**
 * ============================================================
 * FICHA FINAL — a criatura já montada, aberta para USO
 * ============================================================
 * Plano completo em `docs/afty-ficha-final.md`.
 *
 * O criador CALCULA, a Ficha OPERA. Aqui não se troca Habilidade nem atributo:
 * o botão Editar leva para o criador, que continua sendo o dono das escolhas.
 *
 * Desenho (autor, 2026-08-05): **vitais fixos no topo, abas embaixo**. O que se
 * olha o tempo todo (PV, PE, Alma, Defesa, CD, RD) nunca sai da tela, e o corpo
 * troca por aba. 75% do uso é desktop e 25% é toque, então nada pode depender só
 * de hover: ver o `NumeroComFontes`.
 *
 * ⚠ A Ficha é pintada por VARIÁVEL CSS (`ficha.css`), e não por classe de cor do
 * Tailwind. É isso que torna o CSS personalizado possível. Tailwind aqui só
 * resolve LAYOUT.
 * ============================================================
 */

const TABS = [
  { id: "acoes", label: "Ações" },
  { id: "habilidades", label: "Habilidades" },
  { id: "pericias", label: "Perícias" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "invocacoes", label: "Invocações" },
  /* O id continua `buffs` (gancho de tema `[data-afty-aba="buffs"]` e navegação antiga), e o rótulo é Efeitos desde a integração do G2. */
  { id: "buffs", label: "Efeitos" },
];

/* As abas que são ESTÁGIO: altura da tela abaixo do cabeçalho, com as listas rolando por dentro (Habilidades e Efeitos). */
const ESTAGIO = new Set(["habilidades", ABA_EFEITOS]);

/* ============================================================ */

export default function AftyFicha({
  creature, onVoltar, onEditar, onSalvarTema, onSalvarInvocacoes, onSalvarEspinho,
  onSalvarFundamentosPerdidos, onSalvarPreferencias, onSalvarPacotesAliados, onSalvarRecebidos,
}) {
  const alvoId = creature?.id ?? null;

  /* ⚠ O TEXTO DESTRANCADO ENTRA AQUI, NA MONTAGEM DA FICHA DE TELA, e em lugar
     nenhum mais. `cofreAberto` sai da memória de módulo do `afty-cofre.js`, que
     morre ao recarregar a página: nada disso encosta em `creature`, no
     `localStorage` nem em qualquer coisa que seja gravada. A ficha continua
     trancada, e o que muda é só o que esta aba desenha.

     ⚠ Por isso ele entra ANTES do `mesclaFichaAfty` e não depois: tudo abaixo
     lê `ficha`, do derive às abas, e um segundo caminho para o texto seria um
     segundo lugar para alguém esquecer de aplicar. */
  const [cofreAberto, setCofreAberto] = useState(() => lerAberto(creature?.id));
  const ficha = useMemo(
    () => mesclaFichaAfty(cofreAberto ? comTextoAberto(creature, cofreAberto) : creature),
    [creature, cofreAberto],
  );

  // ⚠ A sessão nasce com os recursos CHEIOS, e para isso precisa dos máximos,
  // que só existem depois de derivar. O derive da montagem roda sem
  // `almaAtual` (alma íntegra), que é exatamente o estado de uma ficha que
  // nunca entrou em jogo. O clamp de leitura abaixo acerta o resto.
  const [sessaoBruta, setSessaoBruta] = useState(() => carregarSessao(alvoId, deriveAfty(ficha)));
  const [tab, setTab] = useState("acoes");
  /* A apresentação ANTERIOR da aba Efeitos (a antiga aba Buffs), mantida como comparação e para as funções que o G2 ainda não cobre. O G2 é o
     padrão e a escolha não é gravada: recarregar volta ao G2. Ver docs/afty-ficha-final.md. */
  const [apresentacaoAnterior, setApresentacaoAnterior] = useState(false);
  const raizRef = useRef(null);
  const cabecalhoRef = useRef(null);
  // Vantagem e desvantagem, e se o histórico está aberto. Os dois são de TELA, e
  // não de jogo: quem recarrega a página quer o painel do jeito padrão, e não
  // uma desvantagem esquecida na sessão de ontem.
  const [modo, setModo] = useState("normal");
  const [logAberto, setLogAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  // Quais itens estão abertos, e para onde a busca navegou. Os dois são de TELA:
  // reabrir a ficha amanhã com trinta parágrafos abertos não ajuda ninguém.
  const [abertos, setAbertos] = useState(() => new Set());
  const [destaque, setDestaque] = useState(null);
  const [tema, setTema] = useState(() => carregarTema(ficha, alvoId));
  /* O ESPINHO VIVO (Addon, 2026-09-30). Almas Totais e Outros mudam durante a
     sessão e são FICHA, e não sessão (decisão do autor): gravam na criatura, com
     o mesmo atraso de 600 ms do tema. O card lê daqui, e não do `creature`, para
     o número mudar na hora e não um passo depois da gravação. */
  const [espinhoVivo, setEspinhoVivo] = useState(() => ficha.espinho ?? null);
  const [aparenciaAberta, setAparenciaAberta] = useState(false);
  const [cofrePainel, setCofrePainel] = useState(false);
  /* Qual Shikigami está com o editor de aparência aberto. ⚠ É o ID e não o
     objeto: a invocação é reconstruída a cada derive, e guardar o objeto
     deixaria o painel editando uma cópia velha. */
  const [temandoInvocacao, setTemandoInvocacao] = useState(null);
  /* O tema em edição, `{ id, tema }`. Ver o bloco do debounce mais abaixo. */
  const [rascunhoInv, setRascunhoInv] = useState(null);
  // ⚠ A densidade é gravada NA HORA, e não por debounce como o tema: ela muda por
  // clique num interruptor de duas posições, e não por arrastar um seletor de cor.
  const [densidade, setDensidade] = useState(carregarDensidade);
  const trocaDensidade = useCallback(() => {
    setDensidade((d) => {
      const proxima = d === "compacta" ? "confortavel" : "compacta";
      salvarDensidade(proxima);
      return proxima;
    });
  }, []);

  // ⚠ O `combate` que a Ficha deriva é o DA SESSÃO, e não o da ficha: o da ficha
  // é a bancada de balanceamento do criador, e misturar os dois faria cada
  // sessão de jogo destruir o cenário montado para dosar a mão. Ver
  // `ficha-sessao.js`.
  /* ⚠ AS OPÇÕES DO DERIVE MORAM AQUI, e não dentro do memo do `derived`, porque
     elas têm DOIS leitores: a ficha da tela e cada derive de comparação que o
     `deltaDosEstados` roda para descobrir o que um estado ligado está fazendo.

     Ter duas listas foi um bug real, e caro de enxergar (2026-08-28): o delta
     derivava sem `guarda`, sem `concedido` e sem os três de Ritual, e então a
     diferença entre as duas LISTAS DE OPÇÃO era creditada ao estado que estava
     sendo medido. Numa criatura Calamidade toda linha ligada exibia "Defesa +5",
     que é a Guarda Inabalável, e a Postura da Devastação, que não dá Defesa
     nenhuma, aparecia dando +5. Uma lista só, e a diferença cancela sozinha. */
  const opcoesDerive = useMemo(() => opcoesDeriveDaSessao(sessaoBruta), [sessaoBruta]);

  /* ⚠ O DERIVE PASSA PELO `prepararCalculo`, que é o mesmo derive com a Fonte Externa traduzida (um registro da aba Efeitos vira o benefício que o
     motor entende). Sem registro nenhum ele devolve EXATAMENTE o derive de sempre, com os addons da ficha aplicados antes, no mesmo bloco
     síncrono. As opções são as de `opcoesDeriveDaSessao` (`ficha-opcoes-derive.js`), a lista única que o derive e o delta dos estados leem. */
  const calculo = useMemo(() => prepararCalculo(ficha, sessaoBruta), [ficha, sessaoBruta]);
  const derived = calculo.derived;

  /* A MORTE DO FUNDAMENTO VAI PARA A FICHA (DA-07, 2026-09-30). A mesa sabe
     primeiro (o estado "morta" do Shikigami de Técnica marcado como Fundamento),
     e é esta gravação que faz a perda sobreviver ao descanso e à sessão nova.
     Nada é apagado: a Técnica e os Feitiços continuam, e o derive os marca como
     indisponíveis. A lista é reescrita inteira pelo mesmo motivo do tema das
     invocações (o `update` faz merge de chave de primeiro nível). */
  const idPerdido = derived?.tecnicaInata?.aRegistrar?.invocacaoId ?? null;
  const nomePerdido = derived?.tecnicaInata?.aRegistrar?.nome ?? "";
  const perdidosGravados = ficha.fundamentosPerdidos;
  useEffect(() => {
    if (!idPerdido || !onSalvarFundamentosPerdidos) return;
    const anteriores = (Array.isArray(perdidosGravados) ? perdidosGravados : [])
      .filter((r) => r?.invocacaoId !== idPerdido);
    onSalvarFundamentosPerdidos([
      ...anteriores,
      { invocacaoId: idPerdido, nome: nomePerdido, em: new Date().toISOString() },
    ]);
  }, [idPerdido, nomePerdido, perdidosGravados, onSalvarFundamentosPerdidos]);

  // ⚠ O clamp é de LEITURA, e não um efeito que reescreve o estado. O teto muda
  // por fora (editar a ficha no criador sobe ou desce o PV máximo, e a Alma o
  // MULTIPLICA), e aparar num efeito seria uma renderização em cascata para
  // chegar no mesmo número que dá para calcular de primeira.
  const sessao = useMemo(() => aparaSessao(sessaoBruta, derived), [sessaoBruta, derived]);

  // Todo escritor passa por aqui, e o valor entra JÁ aparado nos dois sentidos:
  // a função recebe a sessão válida e o resultado dela é aparado de novo.
  const atualiza = useCallback((fn) => {
    setSessaoBruta((s) => aparaSessao(fn(aparaSessao(s, derived)), derived));
  }, [derived]);

  /* ---------- A ABA EFEITOS (G2) ----------
     O MODELO é o adaptador entre a sessão desta Ficha e as telas dos Efeitos: lê a MESMA sessão e opera pelo MESMO `atualiza` (uma sessão só, sem
     cópia). O gerenciador guarda o estado de tela compartilhado (seleção, filtros, catálogo, rascunhos) e `ui` guarda o do painel ao lado, da
     consulta e do histórico. Nada disso muda o jogo: o que muda vai pelos verbos do modelo. Ver `efeitos/useModeloG2.js`. */
  /* OS PACOTES PARA ALIADOS moram no PERSONAGEM (`pacotesAliados`, do suporte, e `pacotesRecebidos`, a biblioteca do aliado): viajam no export, sobrevivem
     à recarga e ao descanso, e o criador não os apaga. Gravam na hora pelo armazenamento existente (o `update` faz merge de chave de primeiro nível). O
     ref guarda o último valor gravado: a função de quem grava é aplicada sobre ele, e duas gravações seguidas não partem da mesma cópia velha. */
  const recebidosRef = useRef(creature?.pacotesRecebidos ?? null);
  const pacotesAliadosRef = useRef(creature?.pacotesAliados ?? null);
  useEffect(() => { recebidosRef.current = creature?.pacotesRecebidos ?? null; }, [creature?.pacotesRecebidos]);
  useEffect(() => { pacotesAliadosRef.current = creature?.pacotesAliados ?? null; }, [creature?.pacotesAliados]);
  const gravarRecebidos = useMemo(() => (onSalvarRecebidos ? (fn) => {
    const novo = fn(recebidosRef.current);
    recebidosRef.current = novo;
    onSalvarRecebidos(novo);
    return novo;
  } : null), [onSalvarRecebidos]);
  const gravarPacotesAliados = useMemo(() => (onSalvarPacotesAliados ? (fn) => {
    const novo = fn(pacotesAliadosRef.current);
    pacotesAliadosRef.current = novo;
    onSalvarPacotesAliados(novo);
    return novo;
  } : null), [onSalvarPacotesAliados]);
  const modelo = useModeloG2({ alvoId, ficha, sessao, derived, calculo, atualiza, gravarRecebidos, gravarPacotesAliados });
  const g = useGestor(modelo);
  const ui = useEfeitosG2({ tab, setTab, m: modelo, g, raiz: raizRef });
  /* Toda troca de aba (clique, teclas 1 a 6) passa por `ui.irPara`: ele guarda a posição de leitura de quem sai e lembra de onde se veio. A aba Efeitos
     mantém o id `buffs`, e o `irPara` a conhece por "efeitos". O ref é para o atalho de teclado, que nasce uma vez só. */
  const irParaAba = (id) => ui.irPara(id === ABA_EFEITOS ? "efeitos" : id);
  const irParaAbaRef = useRef(irParaAba);
  useEffect(() => { irParaAbaRef.current = irParaAba; });
  const ctxHistorico = useMemo(() => ({ abrir: ui.abrirHistorico, total: modelo.mesa.eventos.length + sessao.log.length }), [ui.abrirHistorico, modelo.mesa.eventos.length, sessao.log.length]);

  /* AS ESTATÍSTICAS DO CABEÇALHO são do PERSONAGEM (`creature.preferenciasFicha.estatisticasCabecalho`): viajam no export e no import, e o criador as
     preserva. Mudou, grava na hora pelo armazenamento existente (o `update` faz merge de chave de primeiro nível, então o campo vai INTEIRO, com os
     outros subcampos de preferência). O ref guarda o que acabou de ser gravado, para dois cliques rápidos não gravarem sobre uma cópia velha. */
  const [estatisticasPref, setEstatisticasPref] = useState(() => estatisticasDoCabecalho(ficha));
  const preferenciasRef = useRef(creature?.preferenciasFicha ?? null);
  useEffect(() => { preferenciasRef.current = creature?.preferenciasFicha ?? null; }, [creature?.preferenciasFicha]);
  const definirEstatisticas = useCallback((pref) => {
    setEstatisticasPref(pref);
    const nova = comEstatisticasDoCabecalho(preferenciasRef.current, pref);
    preferenciasRef.current = nova;
    onSalvarPreferencias?.(nova);
  }, [onSalvarPreferencias]);

  /* A altura do cabeçalho grudado vira `--afty-ficha-topo`: o estágio (Habilidades e Efeitos), o painel ao lado e a gaveta da consulta ficam
     abaixo dele. Medida por observador e escrita direto no elemento, sem estado. */
  useLayoutEffect(() => {
    const raiz = raizRef.current;
    const cab = cabecalhoRef.current;
    if (!raiz || !cab || typeof ResizeObserver === "undefined") return undefined;
    const mede = () => raiz.style.setProperty("--afty-ficha-topo", `${Math.round(cab.getBoundingClientRect().height)}px`);
    mede();
    const ro = new ResizeObserver(mede);
    ro.observe(cab);
    return () => ro.disconnect();
  }, []);

  // Persistência por debounce, igual ao rascunho do criador. Sem botão Salvar:
  // sessão não é rascunho, é fato.
  const primeiraGravacao = useRef(true);
  useEffect(() => {
    if (primeiraGravacao.current) { primeiraGravacao.current = false; return undefined; }
    const t = setTimeout(() => salvarSessao(alvoId, sessao), 600);
    return () => clearTimeout(t);
  }, [alvoId, sessao]);

  // ⚠ O tema é gravado NA CRIATURA, e não em chave própria como a sessão: ele
  // precisa viajar no export para a ficha chegar bonita na mão dos outros
  // (autor, 2026-08-05). O `update` do armazenamento faz MERGE, então um Salvar
  // do criador que não conhece o campo `aparencia` preserva o que já está lá.
  /* ⚠ GRAVA SÓ O TEMA QUE MUDOU (2026-10-01, E-14). A guarda era "pula a primeira
     vez", e o efeito depende do `onSalvarTema`, que o App recria a cada render.
     Gravar a criatura re-renderiza o App (o `isSaving` do armazenamento volta a
     falso 300ms depois), o callback novo disparava o efeito outra vez, e a Ficha
     aberta regravava a criatura inteira a cada segundo, para sempre, com um
     derive completo a cada volta. A comparação com o último tema gravado corta o
     laço sem depender da identidade do callback. */
  const temaGravado = useRef(tema);
  useEffect(() => {
    if (tema === temaGravado.current) return undefined;
    const t = setTimeout(() => { temaGravado.current = tema; onSalvarTema?.(tema); }, 600);
    return () => clearTimeout(t);
  }, [tema, onSalvarTema]);

  /* ⚠ O GRAVADOR VAI POR REFERÊNCIA, e não na lista do efeito: o App o recria a
     cada render, e cada gravação faz o App renderizar de novo. Na lista, isso
     regravaria a mesma coisa em laço. E a edição que ainda não gravou é gravada
     ao sair da Ficha, senão voltar ao criador antes de 600 ms a perderia. */
  const salvarEspinhoRef = useRef(onSalvarEspinho);
  useEffect(() => { salvarEspinhoRef.current = onSalvarEspinho; });
  const espinhoPendente = useRef(null);
  const primeiroEspinho = useRef(true);
  useEffect(() => {
    if (primeiroEspinho.current) { primeiroEspinho.current = false; return undefined; }
    espinhoPendente.current = espinhoVivo;
    const t = setTimeout(() => {
      salvarEspinhoRef.current?.(espinhoVivo);
      espinhoPendente.current = null;
    }, 600);
    return () => clearTimeout(t);
  }, [espinhoVivo]);
  useEffect(() => () => {
    if (espinhoPendente.current !== null) salvarEspinhoRef.current?.(espinhoPendente.current);
  }, []);

  // Teclado. ⚠ Nada dispara enquanto o foco está num campo: os vitais e os
  // filtros são campos de texto, e digitar "1" no PV não pode trocar de aba.
  useEffect(() => {
    const aoTeclar = (e) => {
      const alvo = e.target;
      const digitando = alvo?.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta(true);
        return;
      }
      if (digitando || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= TABS.length) irParaAbaRef.current(TABS[n - 1].id);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  /* OS SHIKIGAMIS NA MESA (2026-08-31). Um objeto só de escritores, porque a aba
     precisa dos seis e passá-los como seis props faria a assinatura dela crescer
     a cada verbo novo. Todos passam pelo `atualiza`, que apara nos dois
     sentidos, igual aos vitais do dono. */
  const acoesDeInvocacao = useMemo(() => {
    /* ⚠ `invocacaoDaMesa` e não `invocacoes.lista`: a Quimera mora em
       `derived.quimeras`, e procurar só na lista das invocações dava máximo zero
       para ela. As REGRAS DO TIPO viajam junto (2026-09-30): é por elas que cada
       tipo cai do seu jeito a 0 PV. */
    const daMesa = (id) => invocacaoDaMesa(derived, id);
    return {
      /* ENTRAR EM CAMPO (2026-09-30): calcula o custo, recusa o que o PE não
         cobre, desconta do PE do dono e registra a entrada. Ver `entradaDaInvocacao`. */
      entrar: (id) => atualiza((s) => invocaNaMesa(s, derived, id)),
      sair: (id) => atualiza((s) => saiDeCampo(s, id)),
      recolher: (id) => atualiza((s) => recolheInvocacao(s, id)),
      reconstruir: (id) => atualiza((s) => reconstroiInvocacao(s, id, daMesa(id)?.pv ?? 0)),
      auxilio: (id, acaoId, ligado) => atualiza((s) => alternaAuxilioInvocacao(s, id, acaoId, ligado)),
      // As Intrínsecas e Auras na mesa (2026-09-30): o dono na Aura, a Forma, a tarefa.
      aura: (id, caracId, ligado) => atualiza((s) => alternaAuraInvocacao(s, id, caracId, ligado)),
      forma: (id, forma) => atualiza((s) => defineFormaInvocacao(s, id, forma)),
      tarefa: (id, emTarefa) => atualiza((s) => defineEmTarefa(s, id, emTarefa)),
      // As opções do Controlador na entrada e a Reserva para Invocação (2026-09-30).
      opcaoEntrada: (id, opcaoId, ligado) => atualiza((s) => alternaOpcaoDeEntrada(s, id, opcaoId, ligado)),
      reserva: (modo) => atualiza((s) => ativaReservaInvocacao(s, modo)),
      // A manutenção do Corpo Amaldiçoado depois de CL rodadas (2026-09-30, Etapa 8).
      manter: (id) => atualiza((s) => pagaManutencaoCorpo(s, id, daMesa(id)?.duracao?.manutencao ?? 0)),
      /* O dano passa pelo roteador da mesa (2026-10-01, Etapa 9): a Horda, a
         Quimera e o Mecha caem do jeito deles, e o resto pela regra do tipo. */
      dano: (id, quanto) => atualiza((s) => aplicaDanoNaMesa(s, derived, id, quanto)),
      // Os compostos de mesa: o Mecha (formar e separar) e o núcleo ativo.
      formarMecha: (a, b) => atualiza((s) => formaMecha(s, derived, a, b)),
      separarMecha: () => atualiza((s) => separaMecha(s)),
      trocarNucleo: (id) => atualiza((s) => trocaNucleo(s, derived, id)),
      cura: (id, quanto, pvMax) => atualiza((s) => aplicaCuraInvocacao(s, id, quanto, pvMax, daMesa(id)?.regras)),
      vital: (id, qual, valor) => atualiza((s) => defineVitalInvocacao(
        s, id, qual, valor,
        qual === "alma" ? (daMesa(id)?.almaMax ?? 0) : (daMesa(id)?.pv ?? 0),
        daMesa(id)?.regras,
      )),
      /* A HERANÇA PELA MESA (Mecânicas: "no próximo Descanso Curto ou Longo, você
         pode criar uma Herança"): a sombra exorcizada vira uma entrada na ficha da
         herdeira, gravada na criatura. As escolhas se fazem no criador. */
      criarHeranca: (origemId, herdeiraId) => {
        const lista = ficha.invocacoes ?? [];
        const origem = lista.find((i) => i.id === origemId);
        if (!origem || !onSalvarInvocacoes) return;
        const nova = criaHeranca(origem, daMesa(origemId));
        onSalvarInvocacoes(lista.map((i) => (i.id === herdeiraId ? { ...i, herancas: [...(i.herancas ?? []), nova] } : i)));
      },
    };
  }, [atualiza, derived, ficha.invocacoes, onSalvarInvocacoes]);

  /* O tema de UM Shikigami. Ele mora DENTRO da invocação, em `inv.aparencia`,
     pela mesma razão de o tema da ficha morar na criatura (autor, 2026-08-05:
     *"quero mandar minha ficha bonitinha para os outros"*): assim ele viaja no
     export e no import de graça.

     ⚠ ESCREVE A LISTA INTEIRA, e não um campo solto, porque `storage.update`
     faz merge de chave de PRIMEIRO nível: mandar `{ invocacoes }` pela metade
     apagaria as outras invocações. */
  const invocacaoTemada = useMemo(() => (temandoInvocacao
    ? (ficha.invocacoes ?? []).find((i) => i.id === temandoInvocacao) ?? null
    : null), [temandoInvocacao, ficha.invocacoes]);

  /* Grava o tema de um Shikigami DENTRO da invocação, reescrevendo a lista.
     ⚠ A LISTA INTEIRA, e não um campo solto, porque `storage.update` faz merge
     de chave de primeiro nível: mandar meia lista apagaria as outras. */
  const gravarAparenciaDaInvocacao = useCallback((id, aparencia) => {
    const lista = (ficha.invocacoes ?? []).map((i) => (i.id === id ? { ...i, aparencia } : i));
    onSalvarInvocacoes?.(lista);
  }, [ficha.invocacoes, onSalvarInvocacoes]);

  /* ⚠ O RASCUNHO EXISTE POR CAUSA DA GRAVAÇÃO. Sem ele, cada tecla digitada no
     CSS de um Shikigami reescrevia a lista INTEIRA de criaturas no
     localStorage: medido em 29 gravações para 28 teclas, na revisão de
     2026-08-31. É o mesmo desenho do tema da ficha, que debounce em 600ms desde
     2026-08-05, e a mesma razão: escrever é caro e digitar é rápido.

     ⚠ E É ELE QUE A TELA PINTA, não o que está gravado. Com a prévia saindo do
     disco, o CSS do Shikigami só apareceria 600ms depois de cada tecla, que é
     exatamente a sensação que o debounce existe para evitar. */
  const temaDaInvocacaoAberta = temandoInvocacao === rascunhoInv?.id
    ? rascunhoInv.tema
    : normalizaTema(invocacaoTemada?.aparencia);

  /* ⚠ O primeiro disparo NÃO grava: ele é a abertura do painel, e gravar ali
     carimbaria um tema normalizado em quem nunca teve nenhum. Depois dele, grava
     só o rascunho que MUDOU desde a última gravação daquela invocação (E-14,
     2026-10-01): o `gravarAparenciaDaInvocacao` muda a cada render do App, e a
     guarda de "pula a primeira" sozinha regravava a lista inteira a cada segundo
     com o painel aberto. Mesma correção do tema da ficha, logo acima. */
  const rascunhoGravado = useRef(null);
  useEffect(() => {
    if (!rascunhoInv) { rascunhoGravado.current = null; return undefined; }
    if (rascunhoGravado.current?.id !== rascunhoInv.id) {
      rascunhoGravado.current = { id: rascunhoInv.id, tema: rascunhoInv.tema };
      return undefined;
    }
    if (rascunhoGravado.current.tema === rascunhoInv.tema) return undefined;
    const t = setTimeout(() => {
      rascunhoGravado.current = { id: rascunhoInv.id, tema: rascunhoInv.tema };
      gravarAparenciaDaInvocacao(rascunhoInv.id, rascunhoInv.tema);
    }, 600);
    return () => clearTimeout(t);
  }, [rascunhoInv, gravarAparenciaDaInvocacao]);

  // Tudo que a criatura escolheu, dos seis catálogos, num formato só. É o que a
  // aba Habilidades exibe e o que a busca varre.
  const itens = useMemo(() => conteudoDaFicha(ficha, derived), [ficha, derived]);
  // ⚠ O inventário é uma lista SEPARADA, e não parte do `itens`: aquela é "o que
  // a criatura sabe fazer" e esta é "o que ela carrega". Junta-las faria a aba
  // Habilidades mostrar espada no meio de Habilidade.
  const equipamentos = useMemo(() => equipamentosDaFicha(derived), [derived]);
  const alvos = useMemo(() => alvosDeBusca(derived), [derived]);
  // A busca global varre as DUAS listas, e cada resultado sabe para qual aba ir.
  const itensBuscaveis = useMemo(() => [...itens, ...equipamentos], [itens, equipamentos]);

  const alternaItem = useCallback((chave) => {
    setAbertos((s) => {
      const proximo = new Set(s);
      if (proximo.has(chave)) proximo.delete(chave); else proximo.add(chave);
      return proximo;
    });
  }, []);

  const alternaFavorito = useCallback((chave) => {
    atualiza((s) => ({
      ...s,
      favoritos: s.favoritos.includes(chave)
        ? s.favoritos.filter((f) => f !== chave)
        : [...s.favoritos, chave],
    }));
  }, [atualiza]);

  // A busca navega: troca de aba, abre o item e rola até ele.
  const irPara = useCallback((r) => {
    setTab(r.aba);
    if (r.aba === "habilidades" || r.aba === "equipamentos") {
      setAbertos((s) => new Set(s).add(r.chave));
    }
    setDestaque(r.chave);
  }, []);

  /* Rola e registra. DEVOLVE a rolagem, porque quem chamou às vezes precisa do
     resultado: a linha de dano usa o crítico do Acerto para dobrar os dados do
     Dano seguinte. O modo (vantagem, desvantagem) vale só para o d20. */
  const rolar = useCallback((desc) => {
    desc = prepararRolagemEspecializacao({ ...desc, modo: desc.modo ?? modo }, sessao, derived);
    if (!desc) return null;
    const ativacao = preparaAtivacaoComCustoVida(desc, sessao.hpAtual);
    const custoVida = ativacao.custo;
    if (custoVida.config && !custoVida.disponivel) return null;
    const descResolvida = preparaRolagemCura(preparaRolagemArma(ativacao.desc, modo), derived.efeitos);
    if (!descResolvida) return null;
    const r = descResolvida.tipo === "dano"
      ? rolarDano(descResolvida)
      : rolarTeste(descResolvida);
    atualiza((s) => {
      let proxima = registraRolagemArma(registraRolagem(s, r), descResolvida, r);
      if (custoVida.pago > 0) proxima = pagaCustoVida(proxima, custoVida.pago).sessao;
      if (desc.consomeEstado) proxima = consomeEstadoCombate(proxima, desc.consomeEstado);
      if (desc.feiticoDanoId) proxima = registraFeiticoDano(proxima, desc.feiticoDanoId);
      if (desc.testaRitualId) {
        proxima = iniciaRitualComum(
          proxima,
          desc.testaRitualId,
          r.sucesso === true,
          !!desc.consomeRitualistaId,
        );
      }
      if (desc.finalizaRitualId) {
        proxima = finalizaRitual(proxima, desc.finalizaRitualId);
      }
      proxima = registrarAtaqueEspecializacao(proxima, desc, derived);
      proxima = aplicarCuraRoladaEspecializacao(proxima, desc, r, derived);
      return proxima;
    });
    return r;
  }, [atualiza, modo, sessao, derived]);

  /* A perda de vida do Sangramento: rola o dado da faixa, põe no histórico e
     desconta do PV, sem passar pela casca (ver `aplicaPerdaDeVida`). */
  const sangrar = useCallback((condicao) => {
    const faixa = condicao?.sangramento;
    if (!faixa) return;
    const r = rolarDano({ rotulo: "Sangramento", detalhe: "Perda de Vida", dados: faixa.dados, faces: faixa.faces });
    atualiza((s) => aplicaPerdaDeVida(registraRolagem(s, r), r.total));
  }, [atualiza]);

  // O derive vai junto para o seletor da Expansão pagar o PE e cobrar a Exaustão (Etapa 9).
  const alteraEstado = useCallback((estado, valor) => {
    atualiza((s) => alteraEstadoCombate(s, estado, valor, derived));
  }, [atualiza, derived]);

  /* ⚠ O delta roda um `deriveAfty` por estado LIGADO, e por isso ele mora num
     `useMemo` amarrado à ficha e à sessão: sem isso ele recalcularia a cada
     tecla digitada no campo de PV. A lista some inteira fora de combate.

     NÚMEROS DE 2026-09-22, medidos fora da tela e em velocidade de produção: um
     `deriveAfty` custa 3,4ms, e o delta com vinte estados ligados custa 61ms. O
     comentário antigo daqui dizia 7ms com três ou quatro ligados, de quando o
     derive custava 1,75ms.

     ⚠ E SÓ RODA NA ABA BUFFS, que é a única que lê o resultado (junto do
     `saldoAgora` logo abaixo). Antes eles ficavam soltos no corpo do componente
     e rodavam em qualquer aba: na aba Ações eram N+1 derives inteiros jogados
     fora a cada mudança de sessão. O `tab` na dependência é o que segura isso,
     e a conta volta assim que a aba abre. */
  /* ⚠ Desde a integração do G2 o delta e o saldo SÓ rodam na apresentação anterior (a antiga aba Buffs): a nova calcula o dela (`useModeloG2`). */
  const naAbaBuffs = tab === ABA_EFEITOS && apresentacaoAnterior;
  /* ⚠ A ABA PINTA PRIMEIRO, A CONTA VEM DEPOIS. O `useDeferredValue` segura o
     sinal por um render: na troca para Buffs a aba aparece com o delta ainda em
     `null` (a faixa Agora mostra "Calculando"), e só então a rajada de derives
     roda e a tela se completa.

     Sem isto, os N+1 derives rodavam DENTRO do render que monta a aba, e a troca
     de aba congelava. Com vinte estados ligados eram 1 a 2 segundos no `dev`.

     As DUAS condições entram no teste de propósito: ao SAIR da aba, `naAbaBuffs`
     cai na hora e evita uma última rajada inútil, que o valor diferido sozinho
     ainda dispararia. */
  const buffsPronta = useDeferredValue(naAbaBuffs);

  const deltaPorEstado = useDeltaDosEstados(
    naAbaBuffs && buffsPronta, ficha, sessao.combate,
    /* ⚠ AS MESMAS OPÇÕES DA FICHA, inteiras (com o `buffs` junto, que não é opção do derive, e sim a lista que entra NA CRIATURA como `buffsSessao`), e não uma
       seleção escrita à mão: cada derive de comparação tem de sair do mesmo estado de mesa que o `derived` acima. O hook roda a conta em fatias, sem travar o clique. */
    useMemo(() => ({ ...opcoesDerive, buffs: sessao.buffs }), [opcoesDerive, sessao.buffs]),
    derived,
  );

  /* O SALDO da faixa "Agora" da aba Buffs: tudo que a aba liga, contra a ficha
     sem nada disso. Um derive a mais, com as MESMAS opções do delta logo acima,
     pelo mesmo motivo: opção esquecida vira número fantasma no saldo. Mesma
     porteira de aba do delta, pelo mesmo motivo. */
  const saldoAgora = useMemo(
    () => (!(naAbaBuffs && buffsPronta)
      ? null
      : saldoDoAgora(ficha, sessao.combate, { ...opcoesDerive, buffs: sessao.buffs }, derived)),
    [naAbaBuffs, buffsPronta, ficha, sessao.combate, sessao.buffs, opcoesDerive, derived],
  );

  const itensDoRapido = useMemo(
    () => sessao.favoritos.map((c) => itens.find((i) => i.chave === c)).filter(Boolean),
    [sessao.favoritos, itens],
  );

  /* O contador de usos das habilidades, igual no Rápido e na aba Habilidades.

     ⚠ MEMOIZADO porque desce até o `ItemDeFicha`, que é `React.memo` e só
     funciona com props estáveis. Um objeto literal aqui renderizava TODA linha
     a cada clique, abrir e fechar card inclusive, e o ganho do memo sumia sem
     aviso. Abrir card mexe em `abertos`, e não na `sessao`, então com estas
     deps só uma mudança de sessão (PV, uso gasto) redesenha as linhas. */
  const contadorUsos = useMemo(() => ({
    gastosDe: (chave) => usosGastosDe(sessao, chave),
    onUso: (usos, delta) => atualiza((s) => marcaUso(s, usos, delta)),
  }), [sessao, atualiza]);
  const corpo = {
    roda: () => <PainelDharma derived={derived} sessao={sessao} onSessao={atualiza} />,
    acoes: () => (
      <AbaAcoes
        bloodfeast={<PainelBloodfeast derived={derived} sessao={sessao} onSessao={atualiza} />}
        conjuracaoBloodfeast={(f) => <ConjuracaoBloodfeast f={f} derived={derived} sessao={sessao} onSessao={atualiza} />}
        controleTecnicaMaxima={(f) => <ControleTecnicaMaxima f={f} sessao={sessao} onSessao={atualiza} />}
        controleExpansao={(d) => <ControleExpansao d={d} sessao={sessao} onSessao={atualiza} rolar={rolar} feiticaria={derived.testes?.pericias?.find((p) => p.id === "feiticaria")?.bonus ?? null} />}
        exaustaoTecnica={<PainelExaustaoTecnica sessao={sessao} onSessao={atualiza} />}
        derived={derived}
        onAtaqueBasico={(ataqueBasicoId) => atualiza((s) => ({ ...s, ataqueBasicoId }))}
        adaptacao={<PainelDeAdaptacao derived={derived} onSessao={atualiza} />}
        vislumbre={<PainelDoVislumbre derived={derived} sessao={sessao} onSessao={atualiza} />}
        olhinhosLu={<PainelOlhinhosLu derived={derived} onSessao={atualiza} />}
        olhosAgulha={<PainelOlhosAgulha derived={derived} sessao={sessao} onSessao={atualiza} />}
        manipulacaoCeu={<PainelManipulacaoCeu derived={derived} onEstado={alteraEstado} />}
        armasTransformaveis={<ArmasTransformaveis derived={derived} sessao={sessao} onSessao={atualiza} />}
        golpeEspecial={<PainelDoGolpeEspecial derived={derived} sessao={sessao} onSessao={atualiza} />}
        rolar={rolar}
        turnoArmas={sessao.propriedadesArmas?.turno ?? 0}
        onArma={(linha, campo, valor) => atualiza((s) => campo === "errou"
          ? marcaErroDaArma(s, linha, valor) : configuraArmaNaSessao(s, linha, campo, valor))}
        onAmpla={(linha) => atualiza((s) => {
          const dano = danoDaAmpla(linha, s.rodada);
          if (dano == null) return s;
          return registraRolagem(usaAmpla(s, linha), rolarDano({ rotulo: linha.nome + " · Ampla", dados: 0, faces: 6, fixo: dano }));
        })}
        rodadaArmas={sessao.rodada}
        destaque={destaque}
        rapido={itensDoRapido}
        abertos={abertos}
        onAberto={alternaItem}
        onFavorito={alternaFavorito}
        onRitual={(feiticoId, proxima) => atualiza((s) => configuraRitual(s, feiticoId, proxima))}
        onDesativarRitual={(feiticoId) => atualiza((s) => desativaRitual(s, feiticoId))}
        onIniciarRitualEstendido={(feiticoId, usaRitualista) => (
          atualiza((s) => iniciaRitualEstendido(s, feiticoId, usaRitualista))
        )}
        onIniciarRitualSemTeste={(feiticoId, usaRitualista) => (
          atualiza((s) => iniciaRitualSemTeste(s, feiticoId, usaRitualista))
        )}
        onConcluirPreparacaoRitual={(feiticoId) => (
          atualiza((s) => concluiPreparacaoRitual(s, feiticoId))
        )}
        onCancelarRitual={(feiticoId) => atualiza((s) => cancelaRitual(s, feiticoId))}
        onFinalizarRitual={(feiticoId) => atualiza((s) => finalizaRitual(s, feiticoId))}
        onEncerrarRitual={(feiticoId) => atualiza((s) => encerraRitual(s, feiticoId))}
        onImbuir={(estadoId, feiticoId) => alteraEstado({ id: estadoId }, feiticoId)}
        gatilhosTreino={derived.gatilhosTreino}
        onGatilhoTreino={(id, valor) => atualiza((s) => alteraTreinoAtivo(s, id, valor))}
        contadorUsos={contadorUsos}
      />
    ),
    /* ⚠ HABILIDADES É O G2: a lista aprovada (linha de 48 px, busca pelo nome e pelo texto, descrição na consulta). O que a aba antiga dava e continua
       aqui: o contador de usos da sessão, a busca global que navega até a linha, o contador do Espinho (Addon) e o nome que a ficha dá a um grupo
       (o Vampiro chama as Características Amaldiçoadas de Características de Anatomia). */
    habilidades: () => (
      <div className="e-g2">
        <div className="e-area" data-consultando={ui.consulta.ativa ? "sim" : undefined}>
          <HabilidadesG2
            m={g.mGeral} g={g} consultada={ui.consulta.ativa} onAbrir={ui.abrirConsulta} onAbrirPainel={ui.abrirPainel}
            contadorUsos={contadorUsos} destaque={destaque}
            rotulosGrupo={{ caracteristicaAmaldicoada: derived.caracteristicasAmaldicoadas?.rotulo }}
            espinho={derived.primitivas?.includes("espinho") && derived.espinho?.ativo ? (
              <EspinhoCard compacto extrato={derived.espinho} estado={espinhoVivo} onPatch={setEspinhoVivo} />
            ) : null}
          />
        </div>
      </div>
    ),
    pericias: () => <AbaPericias derived={derived} rolar={rolar} destaque={destaque} />,
    equipamentos: () => (
      <AbaEquipamentos
        derived={derived}
        itens={equipamentos}
        abertos={abertos}
        onAberto={alternaItem}
        favoritos={sessao.favoritos}
        onFavorito={alternaFavorito}
        destaque={destaque}
      />
    ),
    invocacoes: () => (
      <AbaInvocacoes
        derived={derived}
        rolar={rolar}
        destaque={destaque}
        estadoDe={(id) => estadoDaInvocacao(sessao, id)}
        entradaDe={(inv) => entradaDaInvocacao(sessao, inv)}
        mechaDe={(a, b) => mechaPermitido(sessao, derived, a, b)}
        emCombate={emCombateNaSessao(sessao)}
        reserva={sessao.reservaInvocacao}
        acoes={acoesDeInvocacao}
        aoTemar={setTemandoInvocacao}
        temaEmEdicao={rascunhoInv}
      />
    ),
    /* ⚠ EFEITOS É O G2 (completa). A apresentação anterior (a antiga aba Buffs) fica acessível pelo menu do cabeçalho enquanto o G2 não cobre tudo que
       ela fazia (Imitação, Concessão do mestre, Exaustão, Sangramento e o buff de mesa). O G2 é o padrão e a escolha não é gravada. */
    buffs: () => (!apresentacaoAnterior ? (
      <div className="e-g2">
        <div className="e-area" data-consultando={ui.consulta.ativa ? "sim" : undefined}>
          <VisaoG2 g={g} m={modelo} onConsultar={ui.consultarRegra} focoBusca={ui.focoBusca} onVoltarDoCatalogo={ui.voltarDoCatalogo} />
        </div>
      </div>
    ) : (
      <>
      <div className="e-troca-apresentacao">
        <button type="button" className="afty-botao" onClick={() => setApresentacaoAnterior(false)} data-apresentacao-g2>Voltar aos Efeitos</button>
      </div>
      <AbaBuffs
        derived={derived}
        sessao={sessao}
        deltaPorEstado={deltaPorEstado}
        onPatchCombate={(parcial) => atualiza((s) => aplicaPatchCombate(s, parcial))}
        onEstado={alteraEstado}
        onBuffs={(buffs) => atualiza((s) => ({ ...s, buffs }))}
        /* ⚠ PASSA PELO `defineCondicoes`, e não escreve o campo cru: oito
           condições derrubam a Guarda Inabalável, e escrever direto deixaria o
           chefe com a Guarda de pé debaixo de um Atordoado. */
        onCondicoes={(condicoes) => atualiza((s) => defineCondicoes(s, condicoes))}
        /* O Nível de Exaustão é da SESSÃO e de todo mundo: seis Lendárias dão
           exaustão em texto e não tinham onde marcar. ⚠ A Expansão de Domínio dá
           OUTRA coisa, a Exaustão de Técnica (`exaustaoTecnica`, E-16). */
        onExaustao={(exaustao) => atualiza((s) => ({ ...s, exaustao: Math.max(0, Math.trunc(exaustao) || 0) }))}
        onConceder={(familia, id) => atualiza((s) => concedeNaSessao(s, familia, id))}
        onRemoverConcessao={(uid) => atualiza((s) => removeConcessao(s, uid))}
        onSangrar={sangrar}
        saldoAgora={saldoAgora}
      />
      </>
    )),
  };

  /* Memoizados porque só dependem do tema, e o tema quase nunca muda: sem isto
     as duas folhas eram remontadas em string a cada render da Ficha, inclusive
     ao abrir um card ou cruzar o limiar da rolagem. */
  const varsCss = useMemo(() => (SEM_CSS ? "" : cssDasVars(tema)), [tema]);
  const usuarioCss = useMemo(() => (SEM_CSS ? "" : cssDoUsuario(tema)), [tema]);

  return (
    /* As primitivas de Addon que ESTA criatura enxerga. Sem provedor, ninguém
       enxerga nada, que é o certo para quem só usa o raw. Ver
       `ui/usar-primitiva.js`. */
    <PrimitivasDeAddon primitivas={derived.primitivas}>
    <>
    <HistoricoCtx.Provider value={ctxHistorico}>
    <div ref={raizRef} className="afty-ficha" id="afty-ficha" data-afty-densidade={densidade}>
      {/* ⚠ A ORDEM É A REGRA. Os dois blocos são CSS sem camada e de mesma
          especificidade, então quem vem depois vence: o CSS livre sobrepõe o
          formulário, que é o que se espera da ferramenta mais avançada das
          duas. E os dois vencem as utilidades do Tailwind, que vivem em
          `@layer`. */}
      {varsCss && <style>{varsCss}</style>}
      {usuarioCss && <style>{usuarioCss}</style>}

      <header ref={cabecalhoRef} className="afty-cabecalho">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* ---------- a placa do G2: identidade, recursos, valores e o Agora ----------
              Vida, Energia, Alma e Preparo operam pelos verbos da Ficha (painel de cada recurso). Guarda e Titã continuam logo abaixo. */}
          <div className="e-g2">
            <CabecalhoG2
              m={g.mGeral} acesso={ui.acesso} total={g.ativos.length} atencao={ui.atencao} onHistorico={ui.abrirHistorico}
              preferencia={estatisticasPref} onPreferencia={definirEstatisticas}
              acoesDaFicha={{
                onVoltar, onBusca: () => setBuscaAberta(true), onAparencia: () => setAparenciaAberta(true),
                onEditar: () => { salvarSessao(alvoId, sessao); onEditar(); },
                densidade, onDensidade: trocaDensidade,
                cofre: cofreTrancado(ficha) ? { aberto: !!cofreAberto, onAbrir: () => setCofrePainel(true) } : null,
                apresentacaoAnterior: tab === ABA_EFEITOS ? { ativa: apresentacaoAnterior, alterna: () => setApresentacaoAnterior((a) => !a) } : null,
              }}
            />
          </div>

          {/* ---------- Guarda Inabalável ----------
              Some inteira fora do Calamidade e do Beyond, que é a maioria das criaturas. Fica logo abaixo da placa porque a casca dela está na
              barra de Vida e o bônus já está somado na Defesa. */}
          <Guarda
            guarda={derived.guarda}
            partes={derived.partes?.guardaAtual}
            onGolpe={() => atualiza((s) => sofreGolpeNaGuarda(s, derived))}
            onDesfazGolpe={() => atualiza(desfazGolpeNaGuarda)}
            onRaioNegro={() => atualiza(encerraGuarda)}
          />

          {/* ---------- Titã ----------
              Some fora de quem ligou o card no criador (primitiva `titaColosso`, ver `AftyCreatureBuilder.jsx`). */}
          <PainelTita
            titaColosso={derived.titaColosso}
            estado={estadoTita(sessao)}
            onDanoCabeca={(n) => atualiza((s) => aplicaDanoTitaCabeca(s, n, derived.titaColosso?.cabecaMax))}
            onCuraCabeca={(n) => atualiza((s) => aplicaCuraTitaCabeca(s, n, derived.titaColosso?.cabecaMax))}
            onSetCabeca={(v) => atualiza((s) => defineVitalTitaCabeca(s, v, derived.titaColosso?.cabecaMax))}
            onDanoMembro={(i, n) => atualiza((s) => aplicaDanoTitaMembro(s, i, n, derived.titaColosso?.membroMax))}
            onCuraMembro={(i, n) => atualiza((s) => aplicaCuraTitaMembro(s, i, n, derived.titaColosso?.membroMax))}
            onSetMembro={(i, v) => atualiza((s) => defineVitalTitaMembro(s, i, v, derived.titaColosso?.membroMax))}
          />

          {/* ---------- abas ---------- */}
          <div className="afty-abas e-g2 e-abas" role="tablist" aria-label="Seções da ficha">
            {[...TABS, ...(derived.dharma?.ativo ? [{ id: "roda", label: "Roda" }] : [])].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`afty-aba-${t.id}`}
                data-afty-aba={t.id}
                aria-selected={tab === t.id}
                aria-controls="afty-painel"
                className="afty-aba e-aba"
                onClick={() => irParaAba(t.id)}
              >
                {t.label}
                {t.id === ABA_EFEITOS && <small className="f-aba-n">{g.ativos.length}</small>}
              </button>
            ))}
          </div>
          <PainelDeRolagens
            log={sessao.log}
            modo={modo}
            onModo={setModo}
            aberto={logAberto}
            onAberto={setLogAberto}
            onLimpar={() => atualiza((s) => ({ ...s, log: [] }))}
          />
        </div>
      </header>

      <div
        className="afty-ficha-corpo"
        data-afty-imagem-encaixe={tema.imagem.encaixe || "cover"}
      >
        <div className="e-layout" data-painel={ui.compacta ? "aberto" : undefined} data-completa={ui.completa ? "sim" : undefined}>
          <div className="e-coluna">
            <main
              id="afty-painel"
              role="tabpanel"
              aria-labelledby={`afty-aba-${tab}`}
              data-estagio={ESTAGIO.has(tab) && !(tab === ABA_EFEITOS && apresentacaoAnterior) ? "sim" : undefined}
              className="max-w-7xl mx-auto px-3 sm:px-4 py-4"
            >
              {/* ⚠ LINHA MORTA E MARCADA (decisão 4 do autor, 2026-08-20). A ficha
                  SEMPRE abre: o que o mundo não tem aparece aqui, marcado, e não
                  soma nada. Vem antes do corpo porque é a única coisa da tela que
                  pede ação, e some sozinho quando não há nada. Ver
                  docs/afty-addons.md seção 9. */}
              {(derived.addonProblemas?.length ?? 0) > 0 && (
                <div className="afty-card mb-4 p-3 space-y-2">
                  {derived.addonProblemas.map((p) => (
                    <div key={`${p.familia}:${p.id}`}>
                      <p className="text-[11px] flex items-start gap-1" style={{ color: "var(--afty-aviso)" }}>
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
                        <span>{p.motivo}</span>
                      </p>
                      <p className="afty-rotulo text-[11px] pl-4">{p.saida}</p>
                    </div>
                  ))}
                </div>
              )}
              {(corpo[tab] ?? corpo.acoes)()}
              {/* Reserva o fim do conteúdo para os botões dos Livros e do CSS. */}
              {(!ESTAGIO.has(tab) || (tab === ABA_EFEITOS && apresentacaoAnterior)) && <div className="afty-respiro h-24" aria-hidden="true" />}
            </main>
          </div>
          {/* O painel compacto dos Efeitos, ao lado das outras abas: aberto e fechado pelo acesso "Efeitos" do cabeçalho. */}
          {ui.compacta && (
            <div className="e-g2 e-lado">
              <CompactaG2 g={g} m={modelo} onConsultar={ui.consultarRegra} onExpandir={ui.expandirC2} onAdicionar={ui.adicionarC2} />
            </div>
          )}
          {/* A consulta é uma gaveta POR CIMA: a lista não se move. Ela pode cobrir o Confirmar enquanto está aberta, e Esc ou Fechar a dispensam
              devolvendo o rascunho intacto. Consultar nunca confirma nada por trás dela. */}
          {ui.consulta.ativa && (
            <div className="e-g2 e-portal">
              <ConsultaG2
                m={{ ...g.mGeral, resolver: ui.resolverEstudo }} g={g} onAbrirPainel={ui.abrirPainel} pilha={ui.consulta.pilha} ativa={ui.consulta.ativa}
                onAtivar={ui.ativar} onFecharUma={ui.fecharUma} onFechar={ui.fechar} soRegra={ui.consulta.modo === "regra"} semControles={ui.consulta.modo !== "completa"}
              />
            </div>
          )}
        </div>
      </div>

      <AvisoFlutuante m={modelo} />
      {ui.historico && (
        <HistoricoPainel
          key={ui.tamanhoDaJanela} ancora={ui.historico.ancora} m={modelo} nome={ficha.name || "Sem nome"} filtro={ui.historico.filtro}
          onFiltro={ui.mudarFiltroDoHistorico} onFechar={ui.fecharHistorico}
        />
      )}

      {buscaAberta && (
        <BuscaGlobal
          onFechar={() => setBuscaAberta(false)}
          itens={itensBuscaveis}
          alvos={alvos}
          onIr={irPara}
        />
      )}

      {aparenciaAberta && (
        <PainelDeAparencia
          tema={tema}
          onTema={setTema}
          onFechar={() => setAparenciaAberta(false)}
          onGlobal={() => salvarTemaGlobal(tema, sistemaDaFicha(ficha))}
        />
      )}

      {/* O Cofre na tela de JOGO abre só para LER, e a leitura dura o que a aba
          durar. Quem quiser voltar a editar o texto faz isso no criador, que é
          onde `destrancarDeVez` mora. */}
      {cofrePainel && (
        <div className="afty-cofre-veu" role="dialog" aria-label="Cofre de texto">
          <div className="afty-cofre-caixa">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <h2 className="afty-card-titulo flex-1" data-afty-linha>Cofre de Texto</h2>
              <button type="button" className="afty-botao px-2 py-1" onClick={() => setCofrePainel(false)}>
                Fechar
              </button>
            </div>
            <PainelDoCofre
              creature={creature}
              modo="ficha"
              onAberto={(nova) => setCofreAberto(nova ? lerAberto(creature?.id) : null)}
            />
          </div>
        </div>
      )}

      {/* ⚠ O TEMA DE UM SHIKIGAMI usa o MESMO painel do tema da ficha, e não uma
          cópia menor: o autor pediu "um CSS Personalizado próprio", e um editor
          capado seria um segundo lugar para manter em dia. O que muda é só o
          `onGlobal`, que sai: "quero todas as minhas fichas assim" não quer
          dizer nada quando o alvo é um shikigami. */}
      {temandoInvocacao && (
        <PainelDeAparencia
          titulo={`Aparência · ${invocacaoTemada?.nome || "Shikigami"}`}
          /* O prompt para a IA precisa saber que o alvo é o cartão de UMA
             invocação, e não a ficha: o escopo é outro e a raiz também. */
          escopo={escopoDaInvocacao(temandoInvocacao)}
          nome={invocacaoTemada?.nome || null}
          tema={temaDaInvocacaoAberta}
          onTema={(t) => setRascunhoInv({ id: temandoInvocacao, tema: t })}
          /* ⚠ FECHAR DESCARREGA na hora, e não espera o debounce: quem fecha o
             painel e sai da ficha no mesmo segundo não pode perder o que
             escreveu. Gravar duas vezes o mesmo valor não custa nada. */
          onFechar={() => {
            if (rascunhoInv?.id === temandoInvocacao) {
              gravarAparenciaDaInvocacao(rascunhoInv.id, rascunhoInv.tema);
            }
            setRascunhoInv(null);
            setTemandoInvocacao(null);
          }}
        />
      )}
    </div>
    </HistoricoCtx.Provider>

    {/* ⚠ O BOTE SALVA-VIDAS, e ele mora FORA da raiz da Ficha de propósito. Com
        `@scope` o CSS do usuário não alcança nada daqui, e o estilo é EMBUTIDO,
        que vence qualquer folha sem `!important`. Só aparece para quem tem CSS
        livre ligado: um botão permanente seria sujeira para os 99% que nunca
        vão abrir o editor. A saída final, essa sim à prova de tudo, é o
        `?semcss=1` na URL. */}
    {!SEM_CSS && tema.ligado && temCssLivre(tema) && (
      <button
        type="button"
        onClick={() => setTema({ ...tema, ligado: false })}
        title="Desligar o CSS personalizado"
        aria-label="Desligar o CSS personalizado"
        style={{
          position: "fixed", left: 8, bottom: 8, zIndex: 2147483647,
          width: 28, height: 28, display: "flex",
          alignItems: "center", justifyContent: "center",
          borderRadius: 9999, cursor: "pointer",
          border: "1px solid rgba(148,163,184,0.5)",
          background: "rgba(15,23,42,0.92)", color: "#e2e8f0",
          font: "700 13px/1 ui-monospace, monospace",
        }}
      >
        ×
      </button>
    )}
    </>
    </PrimitivasDeAddon>
  );
}
