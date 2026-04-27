import React, { useState, useCallback } from "react";
import Dashboard from "./components/Dashboard";
import CombatTracker from "./components/CombatTracker";
import CreatureBuilder from "./components/CreatureBuilder";
import EncounterTracker from "./components/EncounterTracker";
import EncountersDashboard from "./components/EncountersDashboard";
import useCreatureStorage from "./components/useCreatureStorage";
import useEncounterManager from "./useEncounterManager";
import { COMPENDIUM, getCompendiumById, isBuiltInId } from "./fm-compendium";

// Helper para achar a criatura seja no compêndio ou no localstorage
const findCreatureAnywhere = (id, storageList, compendium) =>
  storageList.find((c) => c.id === id) ?? compendium.find((c) => c.id === id) ?? null;

export default function App() {
  const storage = useCreatureStorage();
  const encounterManager = useEncounterManager();
  
  const [view, setView] = useState({ name: "dashboard", creatureId: null, encounterId: null });

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

  const activeCreature = view.creatureId
    ? findCreatureAnywhere(view.creatureId, storage.creatures, COMPENDIUM)
    : null;

  const views = {
    dashboard: () => (
      <Dashboard
        manager={storage}
        compendium={COMPENDIUM}
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
        onSave={(data) => {
          if (data.id && storage.creatures.find((c) => c.id === data.id)) {
            storage.update(data.id, data);
          } else {
            storage.create(data);
          }
          goToDashboard();
        }}
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
        onCreateFolder={storage.createFolder}
        onRenameFolder={storage.renameFolder}
        onRemoveFolder={storage.removeFolder}
        onOpenEncounter={goToEncounter}
        onBackToGrimoire={goToDashboard}
      />
    )
  };

  return views[view.name] ? views[view.name]() : views.dashboard();
}