import { AlertTriangle } from "lucide-react";
import { AGULHA_TEXTO, AGULHA_VOTO, definirOlhosAgulha, usosAgulhaGastos, usarOlharAgulha, devolverOlharAgulha } from "../afty-olhos-agulha";

export default function PainelOlhosAgulha({ derived, sessao, onSessao }) {
  const v = derived.olhosAgulha;
  if (!v?.tem) return null;
  const gastos = usosAgulhaGastos(sessao);
  const restantes = Math.max(0, v.usosMax - gastos);
  const olhar = v.habilidades.find((h) => h.chave === "olhar");
  return (
    <section className="afty-card p-3 space-y-2" data-afty-painel="olhos-agulha">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="afty-card-titulo" title={AGULHA_TEXTO}>Olhos de Agulha</h2>
        <label className="afty-rotulo text-xs flex items-center gap-2">Olhos restantes
          <select className="afty-botao" aria-label="Olhos restantes" value={v.olhos} onChange={(e) => onSessao((s) => definirOlhosAgulha(s, e.target.value))}>
            {[2, 1, 0].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="afty-linha px-2.5 py-2 flex flex-wrap gap-3 text-xs">
        <span className="afty-valor" title="Metade do seu Bônus de Treinamento em Rolagens de Percepção.">Percepção +{v.pericia}</span>
        {v.imuneCego && <span className="afty-valor" title="Se torna imune às condições: Cego.(A menos que seja por ferimento complexo)">Imune a Cego</span>}
        {v.precisao && <span className="afty-valor" title={v.habilidades.find((h) => h.chave === "precisao").textos[3]}>Precisão Infalível</span>}
        {v.visaoCega > 0 && <span className="afty-valor" title={v.habilidades.find((h) => h.chave === "visao").textos[3]}>Visão às cegas {v.visaoCega}m{v.visaoAmpliada ? " · Visão ×2" : ""}</span>}
      </div>
      {!!olhar.nivel && (
        <div className="afty-linha px-2.5 py-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="afty-rotulo flex-1" title={olhar.textos[olhar.nivel]}>Olhar que Não Falha</span>
          <span className="afty-valor" title="Usos restantes por descanso longo">{restantes} / {v.usosMax}</span>
          <button type="button" className="afty-botao" disabled={restantes === 0} onClick={() => onSessao((s) => usarOlharAgulha(s, v.usosMax))} title="Marca um uso de vantagem em Percepção">Usar</button>
          <button type="button" className="afty-botao" disabled={gastos === 0} onClick={() => onSessao(devolverOlharAgulha)} title="Devolve um uso marcado">Devolver</button>
        </div>
      )}
      {v.olhos === 0 && <p className="text-amber-400 text-xs flex gap-1"><AlertTriangle size={14} />Sem benefícios oculares</p>}
      <span className="afty-rotulo block text-xs">{AGULHA_VOTO}</span>
    </section>
  );
}
