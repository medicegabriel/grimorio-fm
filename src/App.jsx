import React, { useState, useCallback } from "react";
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
  const aftyMode =
    typeof location !== "undefined" && /^\/afty\/?$/i.test(location.pathname);

  const storage = useCreatureStorage(
    aftyMode ? { namespace: "afty", defaultRulesVersion: "afty" } : undefined
  );
  const encounterManager = useEncounterManager(aftyMode ? "afty" : "");
  // ⚠ Gerenciador PRÓPRIO do Afty, e não o de cima com namespace: o combatente
  // do Afty guarda `ficha` e `sessao`, e o da 2.5.2 guarda `snapshot` e
  // `combatState`. Chave própria (`afty_encontros_v1`), shape próprio. O hook
  // roda nos dois modos porque hook não pode ser condicional; fora do /Afty ele
  // só lê uma chave vazia.
  const encontrosAfty = useEncontrosAfty();

  const [view, setView] = useState({ name: "dashboard", creatureId: null, encounterId: null });
  const [encounterSyncState, setEncounterSyncState] = useState(null);

  // Navegação
  const goToDashboard = useCallback(() => {
    setView({ name: "dashboard", creatureId: null, encounterId: null });
  }, []);

  const goToTracker = useCallback((id) => {
    if (isBuiltInId(id)) {
      const builtIn = getCompendiumById(id);
      if (!builtIn) return;
      const clone = storage.cloneFromBuiltIn(builtIn, { folderId: null });
      setView({ name: "tracker", creatureId: clone.id });
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

  // A FICHA FINAL do Afty: a criatura já montada, aberta para USO. É o que o
  // clique no card abre em /Afty desde 2026-08-05 (o lápis continua indo para o
  // criador). Só existe em aftyMode, então o caminho da 2.5.2 não muda.
  const goToAftyFicha = useCallback((id) => {
    setView({ name: "aftyFicha", creatureId: id });
  }, []);

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

  const views = {
    dashboard: () => (
      <Dashboard
        manager={storage}
        compendium={COMPENDIUM}
        encounters={aftyMode ? encontrosAfty.encontros : encounterManager.encounters}
        onOpenCreature={aftyMode ? goToAftyFicha : goToTracker}
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
        />
      );
    },
    builder: () => (
      aftyMode ? (
        <AftyCreatureBuilder
          existingCreature={activeCreature}
          onSave={handleCreatureSave}
          onCancel={goToDashboard}
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
            criaturas={storage.creatures}
            pastas={storage.folders}
            onVoltar={goToEncounters}
            onDuplicar={handleDuplicateEncounter}
          />
        );
      }
      return (
        <EncounterTracker
          encounterId={view.encounterId}
          manager={encounterManager}
          creatures={storage.creatures}
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
          onAbrir={goToEncounter}
          onVoltar={goToDashboard}
        />
      ) : (
      <EncountersDashboard
        manager={encounterManager}
        folders={storage.folders}
        creatures={storage.creatures}
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
        creatures={storage.creatures}
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
      {aftyMode && (
        <div
          title="Ambiente privado — Grimório Homebrew do Afty. Dados isolados do grimório público."
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 9999,
            padding: "4px 10px",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.3,
            color: "#f5e9ff",
            background: "rgba(88, 28, 135, 0.92)",
            border: "1px solid rgba(216, 180, 254, 0.5)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          ⚗️ Grimório Afty · privado
        </div>
      )}
      <Analytics />
    </>
  );
}