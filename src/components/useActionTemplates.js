import { useState, useCallback } from "react";

const STORAGE_KEY = "fm_action_templates_v1";

const loadTemplates = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const persistTemplates = (templates) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
};

export default function useActionTemplates() {
  const [templates, setTemplates] = useState(() => loadTemplates());

  const saveTemplate = useCallback((action) => {
    const template = {
      id: `atpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      savedAt: new Date().toISOString(),
      // Campos descritivos e estruturais
      name:        action.name,
      type:        action.type,
      attackType:  action.attackType,
      trType:      action.trType,
      rangeType:   action.rangeType,
      cost:        action.cost,
      description: action.description,
      // Dano (valores e estado de lock)
      damage:    action.damage ? { ...action.damage } : null,
      // Condição
      condition: action.condition ? { ...action.condition } : null,
      // Trades
      trades: action.trades ? { ...action.trades } : null,
      // Valores base (serão recalculados se não estiver locked)
      toHitBase:  action.toHitBase,
      cdBase:     action.cdBase,
    };
    setTemplates((prev) => {
      const next = [template, ...prev];
      persistTemplates(next);
      return next;
    });
  }, []);

  const removeTemplate = useCallback((id) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      persistTemplates(next);
      return next;
    });
  }, []);

  return { templates, saveTemplate, removeTemplate };
}
