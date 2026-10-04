import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Dashboard from "./components/Dashboard";
import CombatTracker from "./components/CombatTracker";
import CreatureBuilder from "./components/CreatureBuilder";
import AftyCreatureBuilder from "./systems/afty/AftyCreatureBuilder";
import AftyFicha from "./systems/afty/ficha/AftyFicha";
import AftyEncontros from "./systems/afty/encontros/AftyEncontros";
import AftyEncontro from "./systems/afty/encontros/AftyEncontro";
import EncounterTracker from "./components/EncounterTracker";
import EncountersDashboard from "./components/EncountersDashboard";
import TemplateLibrary from "./components/TemplateLibrary";
import EncounterSyncModal from "./components/EncounterSyncModal";
import PdfFab from "./components/PdfFab";
import useCreatureStorage from "./components/useCreatureStorage";
import useEncounterManager from "./useEncounterManager";
import useEncontrosAfty from "./systems/afty/encontros/usar-encontros-afty";
import { vocabularioDoDashboard, sistemaGravado, getSistema } from "./systems/afty/afty-sistema";
import { COMPENDIUM, getCompendiumById, isBuiltInId } from "./fm-compendium";
import { Analytics } from '@vercel/analytics/react';

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
  const sistemaDaRota =
    typeof location === "undefined" ? null
      : /^\/afty\/?$/i.test(location.pathname) ? "afty"
      : /^\/player\/?$/i.test(location.pathname) ? "player"
      : null;

  // Tudo que valia para "está no ambiente privado" continua lendo esta booleana,
  // e por isso as duas rotas dividem builder, ficha e encontros sem um `if` por
  // tela. Quem precisa saber QUAL dos dois lê `sistemaDaRota`.
  const aftyMode = sistemaDaRota !== null;

  const storageDaRota = useCreatureStorage(
    aftyMode ? { namespace: sistemaDaRota, defaultRulesVersion: sistemaDaRota } : undefined
  );
  const encounterManager = useEncounterManager(aftyMode ? sistemaDaRota : "");
  // ⚠ Gerenciador PRÓPRIO do Afty, e não o de cima com namespace: o combatente
  // do Afty guarda `ficha` e `sessao`, e o da 2.5.2 guarda `snapshot` e
  // `combatState`. Chave própria (`afty_encontros_v1`), shape próprio. O hook
  // roda nos dois modos porque hook não pode ser condicional; fora do /Afty ele
  // só lê uma chave vazia.
  const encontrosAfty = useEncontrosAfty();

  const [view, setView] = useState({ name: "dashboard", creatureId: null, encounterId: null });
  const [encounterSyncState, setEncounterSyncState] = useState(null);
  const [importeRecusado, setImporteRecusado] = useState(null);

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
  const ehDestaRota = useCallback(
    (ficha) => sistemaGravado(ficha) === sistemaDaRota,
    [sistemaDaRota],
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

  /* A lista que os ENCONTROS da rota podem tocar, filtrada pelo MOTOR e não
     pela rota. O Dashboard segue recebendo a lista INTEIRA, porque a ficha
     estrangeira precisa aparecer para ser aberta, exportada ou apagada.

     ⚠ NO PRIVADO É POR MOTOR, E NÃO POR `ehDestaRota`. O Encontro do Afty mistura
     criatura e personagem de propósito (afty-sistema.js), então uma criatura
     que entrou no /Player por import antigo continua podendo lutar ali. Quem
     sai é só a ficha da 2.5.2, que o `deriveAfty` leria com a régua errada. */
  const criaturasDoLivro = useMemo(
    () => storageDaRota.creatures.filter((c) => !!sistemaGravado(c) === aftyMode),
    [aftyMode, storageDaRota.creatures],
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

  // Navegação
  const goToDashboard = useCallback(() => {
    setView({ name: "dashboard", creatureId: null, encounterId: null });
  }, []);

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
    if (isBuiltInId(id)) {
      const builtIn = getCompendiumById(id);
      if (!builtIn) return;
      const clone = storage.cloneFromBuiltIn(builtIn, { folderId: null });
      setView({ name: "tracker", creatureId: clone.id });
      return;
    }
    const ficha = storage.creatures.find((c) => c.id === id);
    if (sistemaGravado(ficha)) {
      setView({ name: "aftyFicha", creatureId: id });
      return;
    }
    setView({ name: "tracker", creatureId: id });
  }, [storage]);

  const goToBuilder = useCallback((id = null) => {
    if (id && isBuiltInId(id)) {
      const builtIn = getCompendiumById(id);
      if (!builtIn) return;
      const clone = storage.cloneFromBuiltIn(builtIn, { folderId: null });
      setView({ name: "builder", creatureId: clone.id });
      return;
    }
    setView({ name: "builder", creatureId: id });
  }, [storage]);

  const goToEncounter = useCallback((id) => {
    setView({ name: "encounter", encounterId: id });
  }, []);

  const goToEncounters = useCallback(() => {
    setView({ name: "encounters" });
  }, []);

  const goToTemplates = useCallback(() => {
    setView({ name: "templates" });
  }, []);

  const handleDuplicateEncounter = useCallback((id) => {
    if (aftyMode) encontrosAfty.duplicar(id);
    else encounterManager.duplicate(id);
    goToEncounters();
  }, [aftyMode, encontrosAfty, encounterManager, goToEncounters]);

  // ---------- Save de criatura com verificação de encontros ----------
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
      // ⚠ Só a 2.5.2 sincroniza: o encontro do Afty guarda a ficha CLONADA de
      // propósito, para uma edição no criador não mudar o número de uma luta em
      // andamento. Ver `afty-encontro.js`.
      const affected = aftyMode ? [] : encounterManager.encounters.filter((enc) =>
        enc.combatants?.some((c) => c.creatureId === stamped.id)
      );
      if (affected.length > 0) {
        setEncounterSyncState({ creature: stamped, affectedEncounters: affected });
        return;
      }
      storage.update(stamped.id, stamped);
    } else {
      storage.create(stamped);
    }
    goToDashboard();
  }, [aftyMode, storage, encounterManager.encounters, goToDashboard]);

  const handleSyncConfirm = useCallback((selectedIds) => {
    if (!encounterSyncState) return;
    const { creature } = encounterSyncState;
    storage.update(creature.id, creature);
    const idSet = new Set(selectedIds);
    const newHpMax = creature.stats?.hpMax ?? 0;
    encounterManager.encounters
      .filter((e) => idSet.has(e.id))
      .forEach((enc) => {
        encounterManager.update(enc.id, (e) => ({
          ...e,
          combatants: e.combatants.map((c) => {
            if (c.creatureId !== creature.id) return c;
            const clampedHp = Math.min(c.combatState?.hpCurrent ?? newHpMax, newHpMax);
            return {
              ...c,
              snapshot: creature,
              combatState: {
                ...c.combatState,
                hpMaxBase: newHpMax,
                hpCurrent: clampedHp,
              },
            };
          }),
        }));
      });
    setEncounterSyncState(null);
    goToDashboard();
  }, [encounterSyncState, storage, encounterManager, goToDashboard]);

  const handleSyncSkip = useCallback(() => {
    if (!encounterSyncState) return;
    const { creature } = encounterSyncState;
    storage.update(creature.id, creature);
    setEncounterSyncState(null);
    goToDashboard();
  }, [encounterSyncState, storage, goToDashboard]);

  const handleSyncCancel = useCallback(() => {
    setEncounterSyncState(null);
  }, []);

  const activeCreature = view.creatureId
    ? findCreatureAnywhere(view.creatureId, storage.creatures, COMPENDIUM)
    : null;

  /* Qual criador abre. Editando, quem responde é a FICHA, porque o criador da
     2.5.2 e o do Afty leem shapes diferentes. A rota entra só na ficha NOVA,
     que ainda não tem `rulesVersion` de onde ler. É a mesma escolha que o
     próprio AftyCreatureBuilder já fazia por dentro com a prop `sistema`. */
  const criadorDoAfty = activeCreature ? !!sistemaGravado(activeCreature) : aftyMode;

  const views = {
    dashboard: () => (
      <Dashboard
        manager={storage}
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
        titulo={sistemaDaRota === "player" ? "Jogador" : undefined}
        showSystemView={!aftyMode}
        // A lista do /Player é de PERSONAGENS (autor, 2026-09-10: "Uma prop
        // opcional"). Sem a prop, o Dashboard fala de criatura como sempre.
        vocab={sistemaDaRota === "player" ? vocabularioDoDashboard("player") : undefined}
        encounters={aftyMode ? encontrosAfty.encontros : encounterManager.encounters}
        onOpenCreature={abrirFicha}
        onEditCreature={goToBuilder}
        onCreateNew={() => goToBuilder(null)}
        onGoToEncounters={goToEncounters}
        onGoToTemplates={goToTemplates}
      />
    ),
    tracker: () => {
      if (!activeCreature) {
        goToDashboard();
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
        goToDashboard();
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
        />
      );
    },
    builder: () => (
      criadorDoAfty ? (
        <AftyCreatureBuilder
          existingCreature={activeCreature}
          onSave={handleCreatureSave}
          onCancel={goToDashboard}
          // Só vale para ficha NOVA. Editando, o sistema sai do `rulesVersion`
          // da própria ficha, e não da rota. Ver afty-sistema.js.
          sistema={sistemaDaRota}
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
        goToEncounters();
        return null;
      }
      if (aftyMode) {
        return (
          <AftyEncontro
            encontroId={view.encounterId}
            gerenciador={encontrosAfty}
            criaturas={criaturasDoLivro}
            pastas={storage.folders}
            // A lista do Encontro fala a língua do grimório ABERTO (criatura ou
            // personagem), e ela pode estar vazia: não há ficha de onde ler.
            sistema={sistemaDaRota}
            onVoltar={goToEncounters}
            onDuplicar={handleDuplicateEncounter}
          />
        );
      }
      return (
        <EncounterTracker
          encounterId={view.encounterId}
          manager={encounterManager}
          /* ⚠ A LISTA FILTRADA, e não `storage.creatures`. Pôr uma ficha do
             Afty num encontro da 2.5.2 estoura no avanço de rodada, que chama
             o mesmo `collectAutomationEntities` do painel. Ver a fronteira. */
          creatures={criaturasDoLivro}
          folders={storage.folders}
          onBack={goToEncounters}
          onDuplicate={handleDuplicateEncounter}
          onUpdateCreature={(creature) => {
            if (!creature?.id) return;
            // Só persiste se a criatura existe no compêndio local
            if (storage.creatures.find((c) => c.id === creature.id)) {
              storage.update(creature.id, creature);
            }
          }}
        />
      );
    },
    encounters: () => (
      aftyMode ? (
        <AftyEncontros
          gerenciador={encontrosAfty}
          pastas={storage.folders}
          sistema={sistemaDaRota}
          onAbrir={goToEncounter}
          onVoltar={goToDashboard}
        />
      ) : (
      <EncountersDashboard
        manager={encounterManager}
        folders={storage.folders}
        creatures={criaturasDoLivro}
        onCreateFolder={storage.createFolder}
        onRenameFolder={storage.renameFolder}
        onRemoveFolder={storage.removeFolder}
        onOpenEncounter={goToEncounter}
        onBackToGrimoire={goToDashboard}
      />
      )
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
          {views[view.name] ? views[view.name]() : views.dashboard()}
        </div>
      </div>
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
      {encounterSyncState && (
        <EncounterSyncModal
          creature={encounterSyncState.creature}
          affectedEncounters={encounterSyncState.affectedEncounters}
          onConfirm={handleSyncConfirm}
          onSkip={handleSyncSkip}
          onCancel={handleSyncCancel}
        />
      )}
      <PdfFab />
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