import { Minus, Plus } from "lucide-react";

export default function PainelManipulacaoCeu({ derived, onEstado }) {
  const ceu = derived?.manipulacaoCeu;
  if (!ceu?.disponivel) return null;

  const podeDiminuir = !!derived?.combate?.ativo && ceu.copias > 0;
  const podeAumentar = !!derived?.combate?.ativo && ceu.copias < ceu.maxCopias;

  return (
    <section className="afty-card p-3 space-y-2" data-afty-painel="manipulacao-ceu">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="afty-card-titulo flex-1 min-w-0">Refletir Imagem</h2>
        <span
          className="afty-chip"
          data-afty-tom={ceu.auraAtiva ? "destaque" : undefined}
          title={ceu.auraAtiva ? "Chance de falha contra ataques corpo a corpo e a distância" : "Aura Embaçada desligada em Buffs"}
        >
          Aura Embaçada {ceu.auraAtiva ? `${ceu.percentual}%` : "Inativa"}
        </span>
        <span className="afty-chip" data-afty-tom="custo" title="Custo no início de cada turno">
          Sustentação 2 PE
        </span>
      </div>

      <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
        <span className="afty-rotulo text-[10px] uppercase tracking-wider">Cópias</span>
        <button
          type="button"
          className="afty-botao"
          onClick={() => onEstado({ id: ceu.estadoId }, ceu.copias - 1)}
          disabled={!podeDiminuir}
          aria-label="Remover uma cópia refletida"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="afty-valor text-[12px] tabular-nums" title="Cópias refletidas em campo">
          {ceu.copias} / {ceu.maxCopias}
        </span>
        <button
          type="button"
          className="afty-botao"
          onClick={() => onEstado({ id: ceu.estadoId }, ceu.copias + 1)}
          disabled={!podeAumentar}
          aria-label="Adicionar uma cópia refletida"
        >
          <Plus className="w-3 h-3" />
        </button>
        {ceu.auraAtiva && (
          <span className="afty-valor text-[11px]" title="Resultado atual da Aura Embaçada">
            1 a {ceu.limiar} em 1d10
          </span>
        )}
      </div>
    </section>
  );
}
