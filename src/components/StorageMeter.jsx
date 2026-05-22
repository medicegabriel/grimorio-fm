import { useState, useEffect } from "react";

const LIMIT_5  = 5  * 1024 * 1024;
const LIMIT_10 = 10 * 1024 * 1024;
const CACHE_KEY = "fm_storage_limit_v1";
const PROBE_KEY = "__fm_storage_probe__";
// Alvo da sondagem: claramente acima de 5MB e abaixo de 10MB.
const PROBE_TARGET = 6 * 1024 * 1024;

// localStorage guarda strings em UTF-16 → 2 bytes por caractere.
function getUsedBytes() {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }
  return total;
}

// Lê o limite previamente medido (cacheado no próprio localStorage).
function readCachedLimit() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return (n === LIMIT_5 || n === LIMIT_10) ? n : null;
  } catch {
    return null;
  }
}

// Mede o limite real escrevendo uma string de teste até passar de 5MB.
// O limite depende do motor do navegador (não do aparelho): se o origin
// consegue guardar ~6MB, é um navegador de 10MB; senão, de 5MB.
function probeLimit() {
  const used = getUsedBytes();
  // Se o uso atual já passou de 5MB, só pode ser um navegador de 10MB.
  if (used >= LIMIT_5) return LIMIT_10;

  const extraChars = Math.ceil((PROBE_TARGET - used) / 2);
  let limit;
  try {
    localStorage.setItem(PROBE_KEY, "x".repeat(extraChars));
    limit = LIMIT_10;
  } catch {
    // QuotaExceededError (ou qualquer falha de escrita) → trata como 5MB.
    limit = LIMIT_5;
  } finally {
    try { localStorage.removeItem(PROBE_KEY); } catch {}
  }
  return limit;
}

// Usa o cache se existir; senão sonda uma vez e cacheia o resultado.
function resolveLimit() {
  const cached = readCachedLimit();
  if (cached != null) return cached;
  const limit = probeLimit();
  try { localStorage.setItem(CACHE_KEY, String(limit)); } catch {}
  return limit;
}

function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
}

export default function StorageMeter({ creatures, folders, encounters }) {
  const [limit, setLimit] = useState(() => readCachedLimit());
  const [usedBytes, setUsedBytes] = useState(() => getUsedBytes());

  // Mede o limite uma única vez. Para usuários recorrentes o valor já vem
  // do cache no initializer; só a primeira visita roda a sondagem.
  useEffect(() => {
    if (limit == null) setLimit(resolveLimit());
  }, [limit]);

  // Recalcula o uso quando o conteúdo muda.
  useEffect(() => {
    setUsedBytes(getUsedBytes());
  }, [creatures, folders, encounters]);

  // Sincroniza com escritas vindas de outros pontos do app.
  useEffect(() => {
    const handler = () => setUsedBytes(getUsedBytes());
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  // Até o limite ser medido, usa 5MB (conservador) para a barra.
  const effectiveLimit = limit ?? LIMIT_5;
  const percent = Math.min((usedBytes / effectiveLimit) * 100, 100);
  const usedLabel = formatBytes(usedBytes);
  const maxLabel = limit == null
    ? "…"
    : limit === LIMIT_10 ? "10.0MB" : "5.0MB";

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
