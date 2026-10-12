import { Eye, EyeOff } from "lucide-react";
import { alteraOlhinhosLu, ESTADO_OLHOS_LU, ESTADO_ATENCAO_LU } from "../afty-olhinhos-lu";

export default function PainelOlhinhosLu({ derived, onSessao }) {
  const o = derived?.olhinhosLu;
  if (!o?.tem) return null;
  const mudar = (id, valor) => onSessao((s) => alteraOlhinhosLu(s, id, valor));
  return (
    <section className="afty-card p-3 space-y-2" data-afty-painel="olhinhos-lu">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="afty-card-titulo flex-1 min-w-0">{o.nome}</h2>
        <button type="button" className="afty-botao flex items-center gap-1" aria-pressed={o.fechados} onClick={() => mudar(ESTADO_OLHOS_LU, !o.fechados)} title={o.texto}>
          {o.fechados ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {o.fechados ? "Olhos fechados" : "Olhos abertos"}
        </button>
        <button type="button" className="afty-botao" disabled={!o.fechados} aria-pressed={o.atencaoIntuicao} onClick={() => mudar(ESTADO_ATENCAO_LU, !o.usarIntuicao)}>
          Atenção com Intuição
        </button>
      </div>
      <div className="afty-linha px-2.5 py-2 flex gap-3 flex-wrap" title={o.texto}>
        <span className="afty-valor text-[11px]">Intuição +{o.bonusIntuicao}</span>
        <span className="afty-valor text-[11px]">Atenção {derived.atencao}</span>
      </div>
    </section>
  );
}
