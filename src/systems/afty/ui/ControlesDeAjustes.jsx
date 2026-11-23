import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { ajustesDoSistema, ajustesEfetivos } from "../afty-addons-compostos";
import { sistemaDaFicha } from "../afty-sistema";

const classePasso = "grid h-9 w-9 place-items-center bg-slate-800 text-slate-200 enabled:cursor-pointer enabled:hover:bg-slate-700 disabled:text-slate-500 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-400 pointer-coarse:h-11 pointer-coarse:w-11";

function CampoInteiro({ rotulo, min, max, valor, onChange, noCriador }) {
  const id = useId();
  const [digitado, setDigitado] = useState(null);
  const confirmar = () => {
    const numero = digitado === null || digitado.trim() === "" ? valor : Number(digitado);
    onChange(Number.isInteger(numero) ? Math.min(max, Math.max(min, numero)) : valor);
    setDigitado(null);
  };
  const input = (
    <input
      id={id}
      type="number" min={min} max={max} step={1}
      className={noCriador
        ? "w-10 border-x border-slate-500 bg-slate-950 text-center font-mono text-sm text-slate-100 tabular-nums focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        : "afty-campo afty-linha w-16 px-2 py-1 tabular-nums"}
      value={digitado ?? valor}
      onChange={(e) => {
        const texto = e.target.value;
        setDigitado(texto);
        const numero = Number(texto);
        if (texto !== "" && Number.isInteger(numero) && numero >= min && numero <= max) onChange(numero);
      }}
      onBlur={confirmar}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
    />
  );
  if (!noCriador) {
    return <label htmlFor={id} className="flex items-center gap-2 px-2 pb-1 text-xs text-slate-400">{rotulo}{input}</label>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-200">{rotulo}</label>
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-500">
        <button type="button" aria-label={`Diminuir ${rotulo}`} disabled={valor <= min} onClick={() => onChange(valor - 1)} className={classePasso}>
          <Minus size={16} aria-hidden="true" />
        </button>
        {input}
        <button type="button" aria-label={`Aumentar ${rotulo}`} disabled={valor >= max} onClick={() => onChange(valor + 1)} className={classePasso}>
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function InterruptorDoCriador({ rotulo, ligado, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className="group inline-flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-slate-500 bg-slate-950 px-3 py-2 text-[13px] font-semibold text-slate-200 hover:border-purple-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 aria-checked:border-purple-400 aria-checked:bg-purple-950/40 aria-checked:text-purple-200 pointer-coarse:min-h-11"
    >
      <span className="relative h-5 w-9 shrink-0 rounded-full border border-slate-500 bg-slate-800 group-aria-checked:border-purple-400 group-aria-checked:bg-purple-700" aria-hidden="true">
        <span className="absolute top-0.5 left-0.5 size-3.5 rounded-full bg-slate-200 group-aria-checked:translate-x-4 group-aria-checked:bg-white motion-safe:transition-transform motion-safe:duration-150" />
      </span>
      {rotulo}
    </button>
  );
}

export default function ControlesDeAjustes({ draft, fonte, onAjuste, noCriador = false }) {
  if (!fonte) return null;
  const sistema = sistemaDaFicha(draft);
  const valores = ajustesEfetivos(fonte, sistema, draft.addonAjustes?.[fonte.id]);
  return ajustesDoSistema(fonte, sistema).map((a) => {
    const valor = valores[a.id];
    const mudar = (novo) => onAjuste(fonte.id, a.id, novo);
    if (a.tipo !== "interruptor") {
      return <CampoInteiro key={a.id} rotulo={a.rotulo} min={a.min} max={a.max} valor={valor} onChange={mudar} noCriador={noCriador} />;
    }
    if (noCriador) return <InterruptorDoCriador key={a.id} rotulo={a.rotulo} ligado={valor === true} onChange={mudar} />;
    return (
      <label key={a.id} className="flex items-center gap-2 px-2 pb-1 text-xs text-slate-400">
        <input type="checkbox" checked={valor === true} onChange={(e) => mudar(e.target.checked)} />
        {a.rotulo}
      </label>
    );
  });
}
