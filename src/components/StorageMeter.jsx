import { useState, useEffect } from "react";

function getStorageUsage() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const MAX_BYTES = isMobile ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxLabel = isMobile ? "5.0MB (Mobile)" : "~10.0MB (PC)";

  let totalBytes = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalBytes += (localStorage[key].length + key.length) * 2;
    }
  }
  const percent = Math.min((totalBytes / MAX_BYTES) * 100, 100);
  const usedMB = totalBytes / 1024 / 1024;
  const usedLabel = usedMB >= 1
    ? `${usedMB.toFixed(1)}MB`
    : `${(totalBytes / 1024).toFixed(0)}KB`;
  return { percent, usedLabel, maxLabel };
}

export default function StorageMeter({ creatures, folders, encounters }) {
  const [{ percent, usedLabel, maxLabel }, setUsage] = useState(() => getStorageUsage());

  useEffect(() => {
    setUsage(getStorageUsage());
  }, [creatures, folders, encounters]);

  useEffect(() => {
    const handler = () => setUsage(getStorageUsage());
    window.addEventListener('storage-update', handler);
    return () => window.removeEventListener('storage-update', handler);
  }, []);

  const barColor =
    percent >= 90 ? "bg-red-500" :
    percent >= 70 ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div className="w-full flex items-center gap-2 pt-1.5 border-t border-slate-800/60">
      <span className="text-[10px] text-slate-500 truncate min-w-0">
        Uso de Memória: {usedLabel} / {maxLabel}
      </span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden min-w-0">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-slate-600 shrink-0">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}
