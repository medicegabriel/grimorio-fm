import { AFTY_APTIDOES, avaliarRequisitoAptidao } from "../afty-aptidoes";
import { pacoteBloodfeast } from "../afty-bloodfeast";
import { Card } from "./primitivos";

export default function BloodfeastCard({ draft, derived, onChange }) {
  if (!derived.bloodfeast?.tem) return null;
  const config = draft.bloodfeast ?? {};
  const passivas = pacoteBloodfeast(draft)?.bloodfeast?.passivas ?? [];
  const sel = config.passivas ?? [];
  const contexto = { nd: derived.nd, attrEff: derived.attrEff, niveis: derived.aptidao?.efetivo,
    escolhidas: derived.aptidoesEscolhidas ?? [] };
  const anatomias = AFTY_APTIDOES.filter((a) => a.subcategoria === "mal_anatomia");
  const elegivel = (a) => a.requisitos.every((r) => avaliarRequisitoAptidao(r, contexto).ok);
  const possuiPureza = sel.includes("pureza");
  const possuiRegeneracao = (derived.aptidoesEscolhidas ?? []).includes("mal_regeneracao_corporal");
  return <Card title="Restrição Congênita: Bloodfeast">
    <div className="space-y-2">
      <label className="block text-xs">Aptidão de Anatomia
        <select className="block w-full bg-slate-950 text-slate-200 border border-slate-700 rounded p-2"
          value={config.anatomia ?? ""} onChange={(e) => onChange({ ...config, anatomia: e.target.value || null })}>
          <option value="">Selecionar</option>
          {anatomias.map((a) => <option key={a.id} value={a.id} disabled={!elegivel(a)}>{a.nome}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-1">
        {passivas.map((p) => <label key={p.id} title={p.descricao} className="flex items-center gap-2 text-xs p-1">
          <input type="checkbox" checked={p.nivel === 0 || sel.includes(p.id)}
            disabled={p.nivel === 0 || (p.id === "pureza_refinada" && !(possuiPureza && possuiRegeneracao) && !sel.includes(p.id))}
            onChange={(e) => onChange({ ...config, passivas: e.target.checked ? [...sel, p.id] : sel.filter((id) => id !== p.id) })} />
          <span className="flex-1">{p.nome}</span><span>N{p.nivel}</span>
          {p.custoPV > 0 && <span className="text-rose-300">-{p.custoPV} PV</span>}
        </label>)}
      </div>
    </div>
  </Card>;
}
