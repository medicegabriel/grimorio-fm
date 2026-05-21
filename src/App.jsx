import React, { useState, useCallback } from "react";
import Dashboard from "./components/Dashboard";
import CombatTracker from "./components/CombatTracker";
import CreatureBuilder from "./components/CreatureBuilder";
import EncounterTracker from "./components/EncounterTracker";
import EncountersDashboard from "./components/EncountersDashboard";
import EncounterSyncModal from "./components/EncounterSyncModal";
import useCreatureStorage from "./components/useCreatureStorage";
import useEncounterManager from "./useEncounterManager";
import { COMPENDIUM, getCompendiumById, isBuiltInId } from "./fm-compendium";
import { Analytics } from '@vercel/analytics/react';

// Helper para achar a criatura seja no compêndio ou no localstorage
const findCreatureAnywhere = (id, storageList, compendium) =>
  storageList.find((c) => c.id === id) ?? compendium.find((c) => c.id === id) ?? null;

export default function App() {
  const storage = useCreatureStorage();
  const encounterManager = useEncounterManager();

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

  const goToEncounter = useCallback((id) => {
    setView({ name: "encounter", encounterId: id });
  }, []);

  const goToEncounters = useCallback(() => {
    setView({ name: "encounters" });
  }, []);

  const handleDuplicateEncounter = useCallback((id) => {
    encounterManager.duplicate(id);
    goToEncounters();
  }, [encounterManager, goToEncounters]);

  // ---------- Save de criatura com verificação de encontros ----------
  const handleCreatureSave = useCallback((data) => {
    const isEditing = !!(data.id && storage.creatures.find((c) => c.id === data.id));

    if (isEditing) {
      const affected = encounterManager.encounters.filter((enc) =>
        enc.combatants?.some((c) => c.creatureId === data.id)
      );
      if (affected.length > 0) {
        setEncounterSyncState({ creature: data, affectedEncounters: affected });
        return;
      }
      storage.update(data.id, data);
    } else {
      storage.create(data);
    }
    goToDashboard();
  }, [storage, encounterManager.encounters, goToDashboard]);

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
        encounters={encounterManager.encounters}
        onOpenCreature={goToTracker}
        onEditCreature={goToBuilder}
        onCreateNew={() => goToBuilder(null)}
        onGoToEncounters={goToEncounters}
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
    builder: () => (
      <CreatureBuilder
        existingCreature={activeCreature}
        onSave={handleCreatureSave}
        onCancel={goToDashboard}
      />
    ),
    encounter: () => {
      if (!view.encounterId) {
        goToEncounters();
        return null;
      }
      return (
        <EncounterTracker
          encounterId={view.encounterId}
          manager={encounterManager}
          creatures={storage.creatures}
          folders={storage.folders}
          onBack={goToEncounters}
          onDuplicate={handleDuplicateEncounter}
        />
      );
    },
    encounters: () => (
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
  };

  return (
    <>
      {views[view.name] ? views[view.name]() : views.dashboard()}
      {encounterSyncState && (
        <EncounterSyncModal
          creature={encounterSyncState.creature}
          affectedEncounters={encounterSyncState.affectedEncounters}
          onConfirm={handleSyncConfirm}
          onSkip={handleSyncSkip}
          onCancel={handleSyncCancel}
        />
      )}
      <Analytics />
    </>
  );
}