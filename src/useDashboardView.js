import { useEffect, useMemo, useState } from "react";

const ALL_VIEW = { type: "all", folderId: null };

function readView(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? ALL_VIEW;
  } catch {
    return ALL_VIEW;
  }
}

function validView(view, folders, showSystemView) {
  if (view?.type === "folder") {
    return folders.some((folder) => folder.id === view.folderId) ? view : ALL_VIEW;
  }
  if (view?.type === "all" || view?.type === "unfiled") return view;
  if (view?.type === "builtins" && showSystemView) return view;
  return ALL_VIEW;
}

// O App conserva a seleção enquanto a lista está desmontada, inclusive sem storage.
export default function useDashboardView(namespace, folders, showSystemView) {
  const suffix = namespace ? `_${namespace}` : "";
  const key = `fm_dashboard_view${suffix}_v1`;
  const [storedView, setView] = useState(() => readView(key));
  const view = useMemo(
    () => validView(storedView, folders, showSystemView),
    [storedView, folders, showSystemView],
  );

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(view));
    } catch { /* A seleção continua em memória se o armazenamento falhar. */ }
  }, [key, view]);

  return [view, setView];
}
