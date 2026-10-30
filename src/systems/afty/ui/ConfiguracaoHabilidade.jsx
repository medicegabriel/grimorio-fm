import React from "react";
import { AFTY_PERICIAS } from "../afty-pericias-catalogo";
import { expandeHerdadas } from "../afty-habilidades";

export default function ConfiguracaoHabilidade({ habilidade, derived, onPatch }) {
  const id = expandeHerdadas([habilidade.id]).at(-1);
  const estado = derived.configuracaoEspecializacao;
  if (!estado) return null;
  const c = estado.config;
  const campo = (label, valor, opcoes, onChange) => <label className="flex flex-wrap items-center gap-2 text-xs">
    <span>{label}</span>
    <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1 min-w-0 max-w-full"
      aria-label={label} value={valor ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">Escolher</option>
      {opcoes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  </label>;
  const pericias = AFTY_PERICIAS.map((p) => ({ id: p.id, label: p.label ?? p.nome }));
  if (id === "res_adrenalina_intensificadora") return <div className="space-y-2">
    <label className="flex flex-wrap items-center gap-2 text-xs">
      <span>Atletismo</span>
      <input type="number" className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-16"
        aria-label="Adrenalina Intensificadora: Atletismo" min={0} max={estado.totalAdrenalina} value={estado.atletismo}
        onChange={(e) => onPatch({ adrenalinaAtletismo: Math.min(estado.totalAdrenalina, Math.max(0, Math.trunc(Number(e.target.value) || 0))) })} />
      <span>Acrobacia +{estado.acrobacia}</span>
    </label>
  </div>;
  if (id !== "res_restrito_pelos_ceus") return null;
  return <div className="space-y-2">
    {campo("Restrito pelos Céus: Defesa", c.defesaAtributo,
      [{ id: "forca", label: "Força" }, { id: "constituicao", label: "Constituição" }], (v) => onPatch({ defesaAtributo: v }))}
    {estado.menteAfiada && <>
      {[0, 1].map((i) => <React.Fragment key={i}>
        {campo(`Mente Afiada: Treinado ${i + 1}`, c.menteAfiadaTreinadas?.[i],
          pericias.filter((p) => p.id !== c.menteAfiadaTreinadas?.[1 - i]), (v) => {
            const lista = [...(c.menteAfiadaTreinadas ?? ["", ""])]; lista[i] = v;
            onPatch({ menteAfiadaTreinadas: lista });
          })}
      </React.Fragment>)}
      {campo("Mente Afiada: Mestre", c.menteAfiadaMestre, pericias, (v) => onPatch({ menteAfiadaMestre: v }))}
    </>}
    {estado.semblante && campo("Semblante Cativante: Mestre", c.semblanteMestre,
      pericias.filter((p) => AFTY_PERICIAS.find((x) => x.id === p.id)?.atributo === "presenca"), (v) => onPatch({ semblanteMestre: v }))}
  </div>;
}
