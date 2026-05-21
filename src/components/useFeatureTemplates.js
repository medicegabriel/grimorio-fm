import { useState, useCallback } from "react";

const STORAGE_KEY = "fm_feature_templates_v1";

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

export default function useFeatureTemplates() {
  const [templates, setTemplates] = useState(() => loadTemplates());

  const saveTemplate = useCallback((feature) => {
    const template = {
      id: `ftpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: feature.name,
      category: feature.category,
      trigger: feature.trigger,
      description: feature.description,
      savedAt: new Date().toISOString(),
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
