import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import Dashboard from "./components/Dashboard";
import AftyFicha from "./systems/afty/ficha/AftyFicha";
import useListaDeEncontros from "./systems/afty/encontros/usar-lista-encontros";
import { grupoDaRota } from "./systems/afty/encontros/listas";
import PdfFab from "./components/PdfFab";
import useCreatureStorage from "./components/useCreatureStorage";
import useDashboardView from "./useDashboardView";
import { vocabularioDoDashboard, sistemaGravado, getSistema } from "./systems/afty/afty-sistema";
import {
  MESA_ERA_DE_OURO, NAMESPACE_ERA_DE_OURO, ERA_DE_OURO,
  ehRotaEraDeOuro, vocabularioDeFichas,
} from "./systems/eradeouro/era-de-ouro";
import { Analytics } from '@vercel/analytics/react';
import AlternadorSistema from "./nuvem/AlternadorSistema";
import ContaNuvem from "./nuvem/ContaNuvem";
import AvisoMudanca from "./nuvem/AvisoMudanca";
import { enviar as enviarNuvem, lerEstadoNuvem, ouvirNuvem } from "./nuvem/nuvem-sync";
import { nuvemAtiva } from "./nuvem/nuvem-config";
import { rotaDoGrupo } from "./nuvem/sala-ui/sala-ui-dados";
import { usePilhaDeTelas } from "./celular/usar-pilha-de-telas";
import { useCamadaDeVoltar } from "./celular/camadas";
import { TELA_LISTA } from "./celular/pilha";
import { telaSobDemanda } from "./celular/sob-demanda";
import { useCompendio, ehIdDoCompendio } from "./celular/usar-compendio";
import Carregando from "./celular/Carregando";
import ConviteInstalar from "./celular/ConviteInstalar";
/* A Sala no celular (etapa E7, docs/app-celular.md): entrar pelo código, editar pela Sala sem janela nova, e o link aberto no app. */
import BotaoEntrarNaSala from "./nuvem/sala-ui/EntrarPorCodigo";
import { lerPedidoDeEdicao } from "./celular/editar-pela-sala";
import { ligarInicioNaGuilda } from "./celular/inicio-da-sala";
import { estaInstalado } from "./celular/usar-instalacao";
/* A casca da Guilda no celular (etapa E8, docs/app-celular.md): barra de baixo, lista do celular, Sala e Mais. Só /EraDeOuro. */
import { useCelular } from "./celular/usar-celular";
import CascaDaGuilda from "./systems/eradeouro/app/CascaDaGuilda";
import { ABAS_DA_CASCA, abaDaTela, trocaDeAba } from "./systems/eradeouro/app/lista-fichas";

/* ⚠ AS TELAS PESADAS CHEGAM SOB DEMANDA (etapa E3 do app de celular, 2026-11-19, S-23). Até aqui todas iam no pacote de
   abertura de toda rota: a lista da Guilda no celular baixava 6,6 MB de JavaScript, com os dois criadores, o rastreador e a
   biblioteca da 2.5.2 e as enciclopédias, antes de desenhar a primeira ficha. Agora cada uma é baixada quando aparece.
   ⚠ Tela nova sob demanda pede abrir a frio no navegador: um import a menos na abertura muda a ordem em que os módulos do
   motor são avaliados (a tela branca de 2026-09-02), e só o `t-ordem-modulos` e o `t-app-entradas` não veem o navegador. */
const CombatTracker = telaSobDemanda(() => import("./components/CombatTracker"));
const CreatureBuilder = telaSobDemanda(() => import("./components/CreatureBuilder"));
const AftyCreatureBuilder = telaSobDemanda(() => import("./systems/afty/AftyCreatureBuilder"));
const TemplateLibrary = telaSobDemanda(() => import("./components/TemplateLibrary"));
/* O Encontro unificado (etapa 6a, 2026-11-17): as três listas e o novo Encontro, no lugar do AftyEncontros e do
   EncountersDashboard e EncounterTracker da 2.5.2 (que seguem em src/components/, intocados e sem uso aqui). */
const ListaDeEncontros = telaSobDemanda(() => import("./systems/afty/encontros/telas/ListaDeEncontros"));
const EncontroTela = telaSobDemanda(() => import("./systems/afty/encontros/telas/EncontroTela"));
/* A lista vazia do compêndio fora do `/`, com identidade fixa para não refazer as listas do Dashboard a cada render. */
const SEM_COMPENDIO = [];
/* A Sala entra por `lazy`: só quem abre /Sala/<código> baixa o cliente e o tempo real. */
const SalaPagina = React.lazy(() => import("./nuvem/SalaPagina"));
/* As telas da casca da Guilda chegam só no celular (etapa E8). */
const ListaDeFichas = telaSobDemanda(() => import("./systems/eradeouro/app/ListaDeFichas"));
const MaisDaGuilda = telaSobDemanda(() => import("./systems/eradeouro/app/MaisDaGuilda"));
const AbaSala = telaSobDemanda(() => import("./systems/eradeouro/app/AbaSala"));
/* O botão Abrir Sala do cabeçalho do Encontro (etapa 7c) também entra por `lazy`: ele puxa o cliente da Sala, e só aparece com a Sala
   liberada e a nuvem ligada. */
const BotaoAbrirSala = React.lazy(() => import("./nuvem/sala-ui/AbrirSala"));

// Helper para achar a criatura seja no compêndio ou no localstorage
const findCreatureAnywhere = (id, storageList, compendium) =>
  storageList.find((c) => c.id === id) ?? compendium.find((c) => c.id === id) ?? null;

export default function App() {
  // Gatilho de teste da tela de erro: abrir o site com "?testar-erro=1" na URL
  // força um erro de propósito para validar o ErrorBoundary (útil pra testar no
  // celular). Só afeta quem adiciona o parâmetro manualmente — inofensivo.
  if (
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).has("testar-erro")
  ) {
    throw new Error("Teste da tela de erro (?testar-erro=1) — tudo certo!");
  }

  // ---------- MODO AFTY (ambiente privado) ----------
  // Acessível só por quem souber a URL /Afty (case-insensitive). Não tem
  // link em nenhum menu — mesma ideia do ?testar-erro. Ativa um espaço de
  // dados TOTALMENTE isolado (chaves fm_*_afty_v1) e marca as criaturas
  // criadas aqui com rulesVersion "afty" (o Grimório Homebrew).
  //
  // ⚠ SÃO DUAS ROTAS DESDE 2026-08-30: /Afty é a criatura do mestre e /Player é
  // o personagem do jogador. As duas rodam o MESMO código (o Grimório Afty e a
  // Ficha de Player são o mesmo livro lido por dois lados), e o que as separa é
  // a chave de sistema. Ver src/systems/afty/afty-sistema.js.
  //
  // `sistemaDaRota` é null fora das duas, e é o que devolve a 2.5.2 intacta.
  //
  // ⚠ A TERCEIRA ROTA, /EraDeOuro (a Guilda), NÃO É UM TERCEIRO SISTEMA. Ela
  // guarda criatura e personagem numa lista só, com armazenamento próprio. Por
  // isso existem DOIS valores aqui: `rotaId` é o dono das chaves do localStorage
  // ("afty", "player" ou "eradeouro"), e `sistemaDaRota` segue sendo o sistema em
  // que uma ficha sem marca cai ("afty" ou "player"). Na Guilda quem escolhe o
  // sistema da ficha NOVA é a pessoa, na hora de criar, e a `mesa` carimba a
  // ficha. Ver src/systems/eradeouro/era-de-ouro.js.
  const rotaId =
    typeof location === "undefined" ? null
      : /^\/afty\/?$/i.test(location.pathname) ? "afty"
      : /^\/player\/?$/i.test(location.pathname) ? "player"
      : ehRotaEraDeOuro(location.pathname) ? NAMESPACE_ERA_DE_OURO
      : null;
  const mesa = rotaId === NAMESPACE_ERA_DE_OURO ? MESA_ERA_DE_OURO : null;
  const sistemaDaRota = mesa ? "afty" : rotaId;

  // Tudo que valia para "está no ambiente privado" continua lendo esta booleana,
  // e por isso as rotas dividem builder, ficha e encontros sem um `if` por
  // tela. Quem precisa saber QUAL dos dois lê `sistemaDaRota`.
  const aftyMode = rotaId !== null;

  /* Lançamento público (autor, 2026-11-16). As duas rotas abertas a todos são o
     Grimório 2.5.2 (`/`) e a Ficha de Player (`/Player`): só elas ganham o
     alternador. O cadeado dos Encontros delas saiu depois da revisão final do
     Encontro Unificado (autor, 2026-11-18). */
  const rotaPublica = rotaId === null || rotaId === "player";
  /* A SALA ONLINE (etapa 7b, 2026-11-18): `/Sala/<código>`. O `rotaId` dela é null, então os ganchos da rota (inventário e
     lista) são os do `/`, e a lista fica desligada: quem grava na lista é a própria Sala. */
  const codigoDaSala = (() => {
    if (typeof location === "undefined") return null;
    const m = /^\/sala\/([A-Za-z0-9]{4,12})\/?$/i.exec(location.pathname);
    return m ? m[1] : null;
  })();
  const rotaSala = !!codigoDaSala;

  /* O compêndio da 2.5.2 só no `/` (usar-compendio.js). Lá a lista espera ele chegar, para as Criaturas Base aparecerem
     junto. Nas outras rotas ele nem é baixado. */
  const precisaCompendio = rotaId === null && !rotaSala;
  const compendio = useCompendio(precisaCompendio);
  const COMPENDIUM = compendio?.COMPENDIUM ?? SEM_COMPENDIO;
  const getCompendiumById = useCallback((id) => compendio?.getCompendiumById(id) ?? null, [compendio]);

  const storageDaRota = useCreatureStorage(
    aftyMode ? { namespace: rotaId, defaultRulesVersion: sistemaDaRota } : undefined
  );
  const [folderView, setFolderView] = useDashboardView(
    rotaId, storageDaRota.folders, !aftyMode,
  );
  // A biblioteca relida pelo Encontro também atualiza esta aba inteira.
  // Atualizar só o dono faria o hook regravar as demais fichas desatualizadas.
  const fichasDaRota = storageDaRota.creatures;
  const criarDaRota = storageDaRota.create;
  const atualizarDaRota = storageDaRota.update;
  const removerDaRota = storageDaRota.removeMany;
  const ordenarDaRota = storageDaRota.reorderCreatures;
  const atualizarBibliotecaDoEncontro = useCallback((sistema, biblioteca) => {
    // `sistema` aqui é o dono da biblioteca gravada: a rota, e não o sistema da ficha.
    if (sistema !== rotaId) return;
    const ids = biblioteca.map((c) => c.id);
    const idsAtuais = new Set(ids);
    const anteriores = new Map(fichasDaRota.map((c) => [c.id, c]));
    const removidas = fichasDaRota.filter((c) => !idsAtuais.has(c.id)).map((c) => c.id);
    if (removidas.length) removerDaRota(removidas);
    for (const ficha of biblioteca) {
      // Mesma migração de leitura do hook, sem mudar identificadores.
      const atual = { ...ficha, folderId: ficha.folderId ?? null,
        rulesVersion: ficha.rulesVersion ?? sistema, isBuiltIn: false };
      let anterior = anteriores.get(ficha.id);
      if (anterior && JSON.stringify(anterior) === JSON.stringify(atual)) continue;
      if (!anterior) anterior = criarDaRota(atual);
      // Campo removido em outra aba também precisa sair desta cópia.
      const apagados = Object.fromEntries(Object.keys(anterior)
        .filter((k) => !Object.hasOwn(atual, k)).map((k) => [k, undefined]));
      atualizarDaRota(ficha.id, { ...apagados, ...atual });
    }
    ordenarDaRota(ids);
  }, [rotaId, fichasDaRota, criarDaRota, atualizarDaRota, removerDaRota, ordenarDaRota]);
  // ⚠ Gerenciador PRÓPRIO do Afty, e não o de cima com namespace: o combatente
  // do Afty guarda `ficha` e `sessao`, e o da 2.5.2 guarda `snapshot` e
  // `combatState`. Chave própria (`afty_encontros_v1`), shape próprio. O hook
  // roda nos dois modos porque hook não pode ser condicional; fora do /Afty ele
  // só lê uma chave vazia.
  /* AS TRÊS LISTAS (plano aprovado, 2026-11-17): `/` e `/Player` são a lista do site (`afty_encontros_site_v1`), o `/Afty` e a
     Guilda seguem nas chaves deles, agora no formato novo. Na rota da Sala a lista fica desligada (não migra nem grava). */
  const listaEncontros = useListaDeEncontros(grupoDaRota(rotaId), { ativo: !rotaSala });

  /* O AUSENTE NO FECHAMENTO (etapa 7b): no primeiro carregamento com a conta, as Salas fechadas que ainda não estão na lista
     recebem o Encontro Finalizado e a sessão final dos personagens. A lista desta rota recebe pelo `importar`, as outras
     direto na chave. */
  const importarNaLista = listaEncontros.importar;
  const grupoDaLista = listaEncontros.grupo;
  const listaAtiva = !rotaSala;
  useEffect(() => {
    if (rotaSala) return undefined;
    let vivo = true;
    const tentar = () => {
      if (!vivo || !lerEstadoNuvem().usuario) return;
      // Só com conta, e sob demanda: o fechamento da Sala puxa o cliente dela (etapa E3).
      import("./nuvem/sala-fechamento")
        .then(({ recuperarSalasFechadas }) => recuperarSalasFechadas({ importarPorGrupo: listaAtiva ? { [grupoDaLista]: importarNaLista } : {} }))
        .catch(() => {});
    };
    tentar();
    const sair = ouvirNuvem(tentar);
    return () => { vivo = false; sair(); };
  }, [rotaSala, listaAtiva, grupoDaLista, importarNaLista]);

  /* ⚠ A TELA MORA NO HISTÓRICO DO NAVEGADOR (etapa E2 do app de celular, 2026-11-19, docs/app-celular.md). Até aqui era um
     `useState` solto, e o Voltar do celular saía do site no meio de uma Ficha. Agora `ir` empilha, `substituir` troca e
     `voltar` volta no histórico quando há para onde. Recarregar reabre a mesma tela se a ficha ou o encontro ainda existirem.
     O criador da 2.5.2 nunca volta assim: ele é aberto com `substituir`, para o aviso de sair sem salvar dele (`beforeunload`,
     em `src/components/`) continuar protegendo quem aperta Voltar no meio de uma edição. */
  const telaPodeReabrir = (t) => {
    if (rotaSala) return false;
    const ficha = t.creatureId ? storageDaRota.creatures.find((c) => c.id === t.creatureId) : null;
    if (t.name === "aftyFicha") return !!ficha && !!sistemaGravado(ficha);
    if (t.name === "tracker") return !!ficha && !sistemaGravado(ficha);
    if (t.name === "builder") return t.creatureId ? !!ficha && !!sistemaGravado(ficha) : aftyMode;
    if (t.name === "encounter") return listaEncontros.encontros.some((e) => e.id === t.encounterId);
    return true;
  };
  const { tela: view, ir, substituir, voltar } = usePilhaDeTelas({ existe: telaPodeReabrir });
  // O telefone de agora (a consulta única do app, que também pega o celular deitado). Decide a casca da Guilda (etapa E8).
  const celularNaTela = useCelular();
  // A Guilda pergunta criatura ou personagem antes de abrir o criador.
  const [escolhendoTipo, setEscolhendoTipo] = useState(false);
  const [importeRecusado, setImporteRecusado] = useState(null);
  // Os dois diálogos do App fecham no Voltar do aparelho antes de a tela mudar.
  useCamadaDeVoltar(escolhendoTipo, () => setEscolhendoTipo(false));
  useCamadaDeVoltar(!!importeRecusado, () => setImporteRecusado(null));

  /* ============================================================ */
  /* A FRONTEIRA ENTRE OS DOIS LIVROS                              */
  /* ============================================================ */
  /* ⚠ ISTO EXISTE POR CAUSA DE UM ERRO EM PRODUÇÃO (2026-09-12). Uma ficha do
     Grimório Afty foi importada no Grimório público, e o clique no card dela
     abria o painel de combate da 2.5.2, que é motor de OUTRO livro. O painel
     lê `treinamentos` como LISTA e no Afty ele é MAPA, então estourava em
     `collectAutomationEntities` com "(arr ?? []) is not iterable".

     O `rulesVersion` de entrada era preservado pelo importador, mas NADA o
     lia na hora de abrir: o `App.jsx` decidia a tela pela ROTA. A lei do
     projeto é a oposta, e está em caixa alta no cabeçalho de afty-sistema.js:
     O SISTEMA VEM DA FICHA, NÃO DA ROTA.

     São duas portas, e as duas fecham aqui porque as duas são de roteamento:
     a de ENTRADA (o importador do Grimório público recusa ficha de outro
     livro) e a de USO (quem já entrou abre na tela do livro dela). A segunda
     também é o que tira a ficha estrangeira da lista dos encontros da 2.5.2,
     que estouravam no mesmo coletor pelo `useEncounter.js`.

     ⚠ NADA DE `src/components/` MUDOU, e é de propósito: o envoltório troca só
     o `importMany` do objeto devolvido pelo hook, e a lista filtrada é prop.

     ⚠ DESDE 2026-10-03 AS PORTAS VALEM NAS TRÊS ROTAS. Em 09-12 o autor fechou
     só a do Grimório público, e o caminho espelho seguia aberto: uma ficha da
     2.5.2 importada no /Afty entrava, o `sistemaDaFicha` caía no padrão e o
     `deriveAfty` rodava a régua do Afty sobre ela, com números plausíveis e
     errados (as 28 da enciclopédia 0.3 saíam todas com Defesa 37). O autor
     escolheu "Fechar Tudo": cada rota importa só ficha do próprio livro, e por
     isso o /Afty também recusa personagem e o /Player recusa criatura. A porta
     de uso fechou junto: ficha da 2.5.2 que já morava no privado abre no
     painel da 2.5.2 e sai dos Encontros do Afty. E as Criaturas Base saíram do
     /Afty, porque o clique nelas abria a Ficha do Afty sobre o compêndio da
     2.5.2 e o lápis as clonava para o inventário do Afty. */

  /* A ficha pertence ao inventário DESTA rota? Fora do Afty a rota é a 2.5.2,
     e `sistemaGravado` devolve null justamente para as fichas dela. No /Afty e
     no /Player a resposta é a marca exata, então criatura e personagem também
     se recusam um ao outro. */
  /* Na Guilda a lista mistura os dois sistemas: entra toda ficha com marca de
     Afty ou de Player, e só a da 2.5.2 fica de fora. */
  const ehDestaRota = useCallback(
    (ficha) => (mesa ? !!sistemaGravado(ficha) : sistemaGravado(ficha) === sistemaDaRota),
    [mesa, sistemaDaRota],
  );

  /* O importador das três rotas, com a porta. Recusa as estrangeiras, importa
     o resto e AVISA o que ficou de fora. Recusa calada seria pior que o erro
     que isto conserta: a ficha sumiria sem explicação. */
  const importarSoDoLivro = useCallback((payload, opts) => {
    const lista = Array.isArray(payload) ? payload : (payload?.creatures ?? []);
    const recusadas = lista.filter((c) => !ehDestaRota(c));
    if (recusadas.length === 0) return storageDaRota.importMany(payload, opts);

    const aceitas = lista.filter(ehDestaRota);
    /* ⚠ O RÓTULO SAI DO `sistemaGravado`, E NÃO DO `getSistema` DIRETO. O
       `getSistema` cai no padrão "afty" para quem não conhece, e no ambiente
       privado (onde esta porta vale desde 2026-10-03) uma ficha da 2.5.2
       recusada apareceria no aviso como "Grimório Afty", errado e calado. */
    const livroDe = (c) => {
      const id = sistemaGravado(c);
      return id ? getSistema(id).label : "Grimório 2.5.2";
    };
    setImporteRecusado({
      recusadas: recusadas.map((c) => ({ nome: c?.name || "Sem nome", livro: livroDe(c) })),
      aceitas: aceitas.length,
    });
    /* Pacote inteiro estrangeiro não entra NEM as pastas dele: pasta vazia de
       um livro que não é este é lixo no inventário. */
    if (aceitas.length === 0) {
      return { imported: 0, skipped: recusadas.length, foldersImported: 0 };
    }
    const limpo = Array.isArray(payload) ? aceitas : { ...payload, creatures: aceitas };
    const r = storageDaRota.importMany(limpo, opts);
    return { ...r, skipped: (r?.skipped ?? 0) + recusadas.length };
  }, [storageDaRota, ehDestaRota]);

  /* O envoltório, igual nas três rotas desde 2026-10-03. Até ali o ambiente
     privado recebia o hook inteiro, e era essa a porta espelho.

     ⚠ O `useMemo` AQUI NÃO SEGURA IDENTIDADE, e está escrito para não enganar
     quem ler: o `useCreatureStorage` devolve um literal novo a cada render, e
     por isso `storageDaRota` muda sempre e o memo sempre recalcula. Ele existe
     porque sem ele o objeto literal faz o `react-hooks/exhaustive-deps` apontar
     cinco `useCallback` abaixo. Nada piora em relação ao que já era. */
  const storage = useMemo(
    () => ({ ...storageDaRota, importMany: importarSoDoLivro }),
    [storageDaRota, importarSoDoLivro],
  );

  /* A biblioteca de modelos é da 2.5.2 nas TRÊS rotas: o `applyTemplatesToCreatures`
     roda o `normalizeDraft` da 2.5.2, que estoura numa ficha do Afty
     (`treinamentos.map is not a function`, medido em 2026-10-03). No privado a
     lista é só a ficha da 2.5.2 que entrou antes da porta, e quase sempre vazia. */
  const fichasDa252 = useMemo(
    () => storageDaRota.creatures.filter((c) => !sistemaGravado(c)),
    [storageDaRota.creatures],
  );

  // Esc fecha o aviso, como nos outros modais da casa.
  useEffect(() => {
    if (!importeRecusado) return undefined;
    const aoTeclar = (e) => { if (e.key === "Escape") setImporteRecusado(null); };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [importeRecusado]);

  // Navegação. O Voltar dos botões volta no histórico, e cai na lista quando não há para onde.
  const goToDashboard = useCallback(() => {
    voltar(TELA_LISTA);
  }, [voltar]);

  /* EDITAR PELA SALA NO CELULAR (etapa E7, 2026-11-20). O Editar da Sala, no celular e no app, grava um pedido e vem para cá
     (`src/celular/editar-pela-sala.js`). O criador abre por `substituir`, para o Voltar do aparelho cair direto na Sala, e Salvar
     ou Cancelar voltam para ela, depois de subir para a nuvem o que estiver na fila (até 3 s). */
  const voltaDaSala = useRef(null);
  useEffect(() => {
    if (rotaSala) return;
    const pedido = lerPedidoDeEdicao();
    if (!pedido) return;
    const ficha = storageDaRota.creatures.find((c) => String(c.id) === pedido.id);
    if (!ficha || !sistemaGravado(ficha)) return;
    voltaDaSala.current = pedido.volta;
    substituir({ name: "builder", creatureId: ficha.id });
    // Só na abertura: o pedido vale uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sairDoCriador = useCallback(() => {
    const volta = voltaDaSala.current;
    if (!volta) { goToDashboard(); return; }
    voltaDaSala.current = null;
    const subir = nuvemAtiva ? enviarNuvem().catch(() => {}) : Promise.resolve();
    Promise.race([subir, new Promise((r) => setTimeout(r, 3000))]).finally(() => location.assign(volta));
  }, [goToDashboard]);

  /* O link da Sala aberto direto no app instalado: o Voltar leva à Guilda, e não fecha o app (`src/celular/inicio-da-sala.js`). */
  useEffect(() => {
    if (!rotaSala || typeof window === "undefined") return undefined;
    return ligarInicioNaGuilda(window, { instalado: estaInstalado() });
  }, [rotaSala]);

  /* O clique no card, nas três rotas. A ficha do Afty abre na FICHA FINAL (a
     criatura já montada, aberta para USO, desde 2026-08-05), e a da 2.5.2 no
     painel de combate dela. O lápis continua indo para o criador.

     ⚠ A FICHA DECIDE A TELA, E NÃO A ROTA. Uma ficha do Afty que entrou no
     Grimório público por importação antiga abre na Ficha dela, e não no painel
     da 2.5.2: o painel roda motor de outro livro e estourava. E desde
     2026-10-03 vale o espelho: a ficha da 2.5.2 que já morava no /Afty abre no
     painel da 2.5.2, e não na Ficha do Afty. Ver o bloco da fronteira.

     O ramo do compêndio só é alcançado no Grimório público. As Criaturas Base
     saíram do /Afty e do /Player, e é bom que sigam fora: o `cloneFromBuiltIn`
     marca com o `rulesVersion` da rota a criatura que não tem o campo (86 das
     165), e o clone nasceria uma ficha da 2.5.2 com marca de Afty. */
  const abrirFicha = useCallback((id) => {
    if (ehIdDoCompendio(id)) {
      const builtIn = getCompendiumById(id);
      if (!builtIn) return;
      const clone = storage.cloneFromBuiltIn(builtIn, { folderId: null });
      ir({ name: "tracker", creatureId: clone.id });
      return;
    }
    const ficha = storage.creatures.find((c) => c.id === id);
    if (sistemaGravado(ficha)) {
      ir({ name: "aftyFicha", creatureId: id });
      return;
    }
    ir({ name: "tracker", creatureId: id });
  }, [storage, ir, getCompendiumById]);

  /* O criador da 2.5.2 entra por `substituir`, e o do Afty por `ir`. Ver o bloco da tela no histórico, lá em cima. */
  const goToBuilder = useCallback((id = null, sistemaNovo = null) => {
    if (id && ehIdDoCompendio(id)) {
      const builtIn = getCompendiumById(id);
      if (!builtIn) return;
      const clone = storage.cloneFromBuiltIn(builtIn, { folderId: null });
      substituir({ name: "builder", creatureId: clone.id });
      return;
    }
    const ficha = id ? storage.creatures.find((c) => c.id === id) : null;
    const da252 = ficha ? !sistemaGravado(ficha) : !aftyMode;
    // `sistemaNovo` só existe na Guilda, e só vale para ficha nova.
    (da252 ? substituir : ir)({ name: "builder", creatureId: id, sistemaNovo });
  }, [storage, aftyMode, ir, substituir, getCompendiumById]);

  const goToEncounter = useCallback((id) => {
    ir({ name: "encounter", encounterId: id });
  }, [ir]);

  const goToEncounters = useCallback(() => {
    ir({ name: "encounters" });
  }, [ir]);

  // O Voltar de dentro de um Encontro: a lista de Encontros de onde ele foi aberto.
  const voltarAosEncontros = useCallback(() => {
    voltar({ name: "encounters" });
  }, [voltar]);

  const goToTemplates = useCallback(() => {
    ir({ name: "templates" });
  }, [ir]);

  const handleDuplicateEncounter = useCallback((id) => {
    listaEncontros.duplicar(id);
    voltarAosEncontros();
  }, [listaEncontros, voltarAosEncontros]);

  // ---------- Save de criatura ----------
  const handleCreatureSave = useCallback((data) => {
    const prior = data.id ? storage.creatures.find((c) => c.id === data.id) : null;
    const isEditing = !!prior;

    // Histórico de edições: carimba a data deste save no fim do editLog.
    // updatedAt continua sendo "a última edição"; o editLog guarda todas as
    // anteriores. Só o save do builder registra — mudanças de combate não.
    const now = new Date().toISOString();
    const stamped = {
      ...data,
      updatedAt: now,
      editLog: [...(prior?.editLog ?? data.editLog ?? []), now],
    };

    if (isEditing) {
      /* O Atualizar da Ficha (etapa 6b, 2026-11-17) trocou a janela que abria aqui (`EncounterSyncModal`): a criatura editada não
         reescreve mais nenhum Encontro. Quem está numa luta vê o botão Atualizar da Ficha no combatente. */
      storage.update(stamped.id, stamped);
    } else {
      storage.create(stamped);
    }
    sairDoCriador();
  }, [storage, sairDoCriador]);

  const activeCreature = view.creatureId
    ? findCreatureAnywhere(view.creatureId, storage.creatures, COMPENDIUM)
    : null;

  /* Qual criador abre. Editando, quem responde é a FICHA, porque o criador da
     2.5.2 e o do Afty leem shapes diferentes. A rota entra só na ficha NOVA,
     que ainda não tem `rulesVersion` de onde ler. É a mesma escolha que o
     próprio AftyCreatureBuilder já fazia por dentro com a prop `sistema`. */
  const criadorDoAfty = activeCreature ? !!sistemaGravado(activeCreature) : aftyMode;

  /* A CASCA DA GUILDA NO CELULAR (etapa E8, 2026-11-20). Em /EraDeOuro, num telefone, a lista, os Encontros, a Sala e o Mais
     ficam numa barra de baixo (`src/systems/eradeouro/app/`). A troca de aba passa pela pilha: sair de Fichas empilha, entre as
     outras substitui, e voltar a Fichas volta (`trocaDeAba`), então o Voltar de qualquer aba cai na lista. */
  const cascaNoCelular = mesa && celularNaTela && !rotaSala;
  const abaDaCasca = cascaNoCelular ? abaDaTela(view.name) : null;
  const irParaAba = (id) => {
    const tela = ABAS_DA_CASCA.find((a) => a.id === id)?.tela;
    const plano = trocaDeAba(abaDaCasca, id);
    if (!tela || plano === "nada") return;
    if (plano === "voltar") voltar(TELA_LISTA);
    else if (plano === "ir") ir({ name: tela });
    else substituir({ name: tela });
  };

  const views = {
    sala: () => (cascaNoCelular && nuvemAtiva ? <AbaSala /> : views.dashboard()),
    mais: () => (cascaNoCelular ? <MaisDaGuilda fichas={storage.creatures} pastas={storage.folders} importar={storage.importMany} /> : views.dashboard()),
    dashboard: () => cascaNoCelular ? (
      <ListaDeFichas
        fichas={storage.creatures}
        pastas={storage.folders}
        vista={folderView}
        onVista={setFolderView}
        storage={storage}
        onAbrir={abrirFicha}
        onEditar={goToBuilder}
        onNova={() => setEscolhendoTipo(true)}
      />
    ) : (
      <Dashboard
        manager={storage}
        folderView={folderView}
        onFolderViewChange={setFolderView}
        compendium={COMPENDIUM}
        /* ⚠ O TÍTULO E A SEÇÃO DE CRIATURAS BASE SÃO DA ROTA, e é por isso
           que eles são decididos aqui e não lá dentro: o Dashboard lista o
           INVENTÁRIO de um ambiente, e não uma ficha, então não existe
           `rulesVersion` para consultar. Fora das duas rotas nenhuma das duas
           props é passada, e o Grimório 2.5.2 fica igual ao que sempre foi.

           Autor, 2026-09-09: no /Player o cabeçalho diz "Jogador" e as
           Criaturas Base saem, porque elas são o compêndio da 2.5.2.

           Autor, 2026-10-03: as Criaturas Base saem do /Afty também. Lá o
           clique rodava a Ficha do Afty sobre uma criatura da 2.5.2, e o lápis
           a clonava para o inventário do Afty. É a porta espelho, e fecha aqui
           pela mesma prop, sem tocar em `src/components/`. */
        titulo={mesa ? ERA_DE_OURO.label : sistemaDaRota === "player" ? "Jogador" : undefined}
        showSystemView={!aftyMode}
        // A lista do /Player é de PERSONAGENS (autor, 2026-09-10: "Uma prop
        // opcional"). Sem a prop, o Dashboard fala de criatura como sempre.
        vocab={mesa ? vocabularioDeFichas() : sistemaDaRota === "player" ? vocabularioDoDashboard("player") : undefined}
        encounters={listaEncontros.encontros}
        onOpenCreature={abrirFicha}
        onEditCreature={goToBuilder}
        onCreateNew={() => (mesa ? setEscolhendoTipo(true) : goToBuilder(null))}
        onGoToEncounters={goToEncounters}
        onGoToTemplates={goToTemplates}
        cabecalhoTitulo={rotaPublica ? <AlternadorSistema atual={rotaId === "player" ? "player" : "criatura"} /> : null}
        cabecalhoAcoes={<>{mesa && nuvemAtiva && <BotaoEntrarNaSala />}<ContaNuvem /></>}
      />
    ),
    tracker: () => {
      // A ficha sumiu (apagada em outra aba ou na nuvem): troca pela lista, sem mexer no histórico de trás.
      if (!activeCreature) {
        substituir(TELA_LISTA);
        return null;
      }
      return (
        <CombatTracker
          creature={activeCreature}
          onUpdate={(patch) => storage.update(activeCreature.id, patch)}
          onExit={goToDashboard}
        />
      );
    },
    aftyFicha: () => {
      if (!activeCreature) {
        substituir(TELA_LISTA);
        return null;
      }
      return (
        <AftyFicha
          creature={activeCreature}
          onVoltar={goToDashboard}
          onEditar={() => goToBuilder(activeCreature.id)}
          // O tema da ficha é gravado na própria criatura, para viajar no
          // export. O update faz merge, então só o campo `aparencia` é tocado.
          onSalvarTema={(aparencia) => storage.update(activeCreature.id, { aparencia })}
          /* ⚠ O tema de um Shikigami mora DENTRO da invocação, então salvar um
             deles reescreve a LISTA inteira. O `update` faz merge de chave de
             primeiro nível, e mandar meia lista apagaria as outras. */
          onSalvarInvocacoes={(invocacoes) => storage.update(activeCreature.id, { invocacoes })}
          onSalvarEspinho={(espinho) => storage.update(activeCreature.id, { espinho })}
          /* A morte do Fundamento (DA-07): a perda da Técnica Inata fica na ficha. */
          onSalvarFundamentosPerdidos={(fundamentosPerdidos) => storage.update(activeCreature.id, { fundamentosPerdidos })}
          /* As preferências de apresentação da Ficha (hoje: as estatísticas do cabeçalho) moram NA CRIATURA, para viajar no export. O campo vai
             inteiro, com os outros subcampos, porque o `update` faz merge de chave de primeiro nível. */
          onSalvarPreferencias={(preferenciasFicha) => storage.update(activeCreature.id, { preferenciasFicha })}
          /* O recurso próprio da ficha (2026-11-16): nome e máximo de uma barra a mais, `null` para tirar. Mora na criatura e viaja no export. */
          onSalvarRecursoProprio={(recursoProprio) => storage.update(activeCreature.id, { recursoProprio })}
          /* Pacotes para Aliados (2026-10-19): os pacotes que o suporte prepara e a biblioteca de pacotes recebidos moram na criatura, para
             sobreviver à recarga e viajar no export. Mesmo merge de chave de primeiro nível das preferências. */
          onSalvarPacotesAliados={(pacotesAliados) => storage.update(activeCreature.id, { pacotesAliados })}
          onSalvarRecebidos={(pacotesRecebidos) => storage.update(activeCreature.id, { pacotesRecebidos })}
        />
      );
    },
    builder: () => (
      criadorDoAfty ? (
        <AftyCreatureBuilder
          existingCreature={activeCreature}
          onSave={handleCreatureSave}
          onCancel={sairDoCriador}
          // Só vale para ficha NOVA. Editando, o sistema sai do `rulesVersion`
          // da própria ficha, e não da rota. Ver afty-sistema.js.
          sistema={mesa ? (view.sistemaNovo ?? sistemaDaRota) : sistemaDaRota}
          mesa={mesa}
          // Os pacotes da Guilda não nascem na ficha: são nativos, e a hidratação
          // os põe nela em dia (src/systems/eradeouro/era-de-ouro.js).
        />
      ) : (
        <CreatureBuilder
          existingCreature={activeCreature}
          onSave={handleCreatureSave}
          onCancel={goToDashboard}
        />
      )
    ),
    encounter: () => {
      if (!view.encounterId) {
        substituir({ name: "encounters" });
        return null;
      }
      return (
        <EncontroTela
          encontroId={view.encounterId}
          lista={listaEncontros}
          onVoltar={voltarAosEncontros}
          onDuplicar={handleDuplicateEncounter}
          onAtualizarBiblioteca={atualizarBibliotecaDoEncontro}
          namespaceDaBiblioteca={rotaId}
          acoesSala={nuvemAtiva ? (
            <React.Suspense fallback={null}><BotaoAbrirSala lista={listaEncontros} encontroId={view.encounterId} /></React.Suspense>
          ) : null}
        />
      );
    },
    encounters: () => (
      <ListaDeEncontros lista={listaEncontros} onAbrir={goToEncounter} onVoltar={goToDashboard} semVoltar={cascaNoCelular} />
    ),
    templates: () => (
      <TemplateLibrary
        onBack={goToDashboard}
        // Modelo da 2.5.2 aplicado numa ficha do Afty estoura no `normalizeDraft`.
        // Nas três rotas a biblioteca só vê ficha da 2.5.2 (`fichasDa252`).
        creatures={fichasDa252}
        creatureFolders={storage.folders}
        onUpdateCreature={storage.update}
      />
    )
  };

  return (
    <>
      {/* Coluna de altura mínima de tela. O rodapé de feedback saiu em
          2026-08-06 (a pesquisa fechou), junto com o aviso de abertura. O
          componente continua em `components/FeedbackPrompt.jsx`, sem uso. */}
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          {rotaSala ? (
            <React.Suspense fallback={null}>
              {/* O Voltar da Sala vai para a rota do grupo dela (a Guilda volta para /EraDeOuro). */}
              <SalaPagina codigo={codigoDaSala} onVoltar={(grupo) => location.assign(rotaDoGrupo(grupo))} />
            </React.Suspense>
          ) : precisaCompendio && !compendio ? <Carregando /> : (
            // A tela sob demanda mostra o Carregando enquanto chega (etapa E3).
            <React.Suspense fallback={<Carregando />}>
              {abaDaCasca ? (
                <CascaDaGuilda aba={abaDaCasca} onAba={irParaAba} nuvem={nuvemAtiva}>{views[view.name]()}</CascaDaGuilda>
              ) : views[view.name] ? views[view.name]() : views.dashboard()}
            </React.Suspense>
          )}
        </div>
        {rotaPublica && !rotaSala && view.name === "dashboard" && (
          <footer className="bg-slate-950 px-4 py-3 text-center text-sm text-slate-300">
            <a href="/privacidade.html" className="underline underline-offset-4 hover:text-white">
              Política de Privacidade
            </a>
          </footer>
        )}
      </div>
      {/* O convite de instalar o app (etapa E4): só na lista da Guilda, no celular. */}
      {mesa && !rotaSala && <ConviteInstalar ativo={view.name === "dashboard"} />}
      {/* ⚠ A RECUSA DO IMPORTADOR PRECISA APARECER. Ficha que some sem dizer
          por que é o defeito que o projeto chama de calado, e seria pior que o
          erro que a porta conserta. O aviso é inline aqui, e não em
          `src/components/`, porque a fronteira é assunto do roteador. */}
      {importeRecusado && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fichas de Outro Grimório"
          onClick={() => setImporteRecusado(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-amber-500/40 bg-slate-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white">Fichas de Outro Grimório</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {importeRecusado.recusadas.length === 1
                    ? "Uma ficha não entrou, porque pertence a outro livro:"
                    : `${importeRecusado.recusadas.length} fichas não entraram, porque pertencem a outro livro:`}
                </p>
              </div>
            </div>
            <ul className="mt-3 max-h-48 overflow-y-auto rounded border border-slate-800 divide-y divide-slate-800">
              {importeRecusado.recusadas.map((f, i) => (
                <li key={`${f.nome}-${i}`} className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <span className="text-sm text-white truncate">{f.nome}</span>
                  <span className="text-[11px] text-amber-400/90 shrink-0">{f.livro}</span>
                </li>
              ))}
            </ul>
            {importeRecusado.aceitas > 0 && (
              <p className="mt-3 text-xs text-slate-400">
                {importeRecusado.aceitas === 1
                  ? "A outra ficha do arquivo entrou normalmente."
                  : `As outras ${importeRecusado.aceitas} fichas do arquivo entraram normalmente.`}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Importe cada uma no grimório em que foi criada.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setImporteRecusado(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* A pergunta da Guilda: a ficha nova é criatura ou personagem. Só a Guilda
          a faz, porque as outras rotas já sabem. O sistema escolhido vira o
          `rulesVersion` da ficha, e a `mesa` a carimba no criador. */}
      {mesa && escolhendoTipo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Nova Ficha"
          onClick={() => setEscolhendoTipo(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setEscolhendoTipo(false); }}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-white">Nova Ficha</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["afty", "player"].map((id, i) => (
                <button
                  key={id}
                  type="button"
                  autoFocus={i === 0}
                  onClick={() => { setEscolhendoTipo(false); goToBuilder(null, id); }}
                  className="px-4 py-3 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                >
                  {getSistema(id).substantivo.replace(/^./, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <PdfFab />
      <AvisoMudanca />
      {/* ⚠ O SELO FIXO DO AMBIENTE PRIVADO SAIU em 2026-09-09, a pedido do autor
         (*"Remova isso. É meio feio."*). Era uma cápsula `position: fixed` no
         canto superior esquerdo, roxa no /Afty e azul no /Player, escrita a
         partir dos campos `selo` e `seloTitulo` do SISTEMAS, que saíram junto
         por terem ficado sem leitor.

         ⚠ ISSO DESTRAVA O `my-0!` DO CABEÇALHO DO CRIADOR. O selo era o único
         motivo de o conserto ter sido testado e desfeito em 2026-09-02: com
         `top: 8` ele passava a cobrir o botão Voltar quando a margem morta do
         `<h1>` sumia. Sem selo não há colisão. Ver docs/a-fazer.md e o
         comentário no cabeçalho de AftyCreatureBuilder.jsx. */}
      <Analytics />
    </>
  );
}
