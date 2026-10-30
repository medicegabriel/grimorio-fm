import { Minus, Plus } from "lucide-react";

export default function PainelManipulacaoCeu({ derived, onEstado }) {
  const ceu = derived?.manipulacaoCeu;
  if (!ceu?.disponivel) return null;

  const emCombate = !!derived?.combate?.ativo;
  const podeAlterarAura = emCombate && ceu.temAura;
  const podeDiminuir = emCombate && ceu.copias > 0;
  const podeAumentar = emCombate && ceu.copias < ceu.maxCopias;

  return (
    <section className="afty-card p-3 space-y-2" data-afty-painel="manipulacao-ceu">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="afty-card-titulo flex-1 min-w-0">Refletir Imagem</h2>
        <span className="afty-chip" data-afty-tom="custo" title="Custo no início de cada turno">
          Sustentação 2 PE
        </span>
      </div>

      <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
        <span className="afty-rotulo text-[10px] uppercase tracking-wider">Aura Embaçada</span>
        <button
          type="button"
          className="afty-botao"
          data-afty-tom={ceu.auraAtiva ? "destaque" : undefined}
          aria-pressed={ceu.auraAtiva}
          disabled={!podeAlterarAura}
          title={emCombate ? undefined : "Disponível em combate"}
          onClick={() => onEstado({ id: "auraEmbacada" }, !ceu.auraAtiva)}
        >
          {ceu.auraAtiva ? "Ativa" : "Inativa"}
        </button>
        <span
          className="afty-valor text-[12px] tabular-nums"
          data-afty-tom={ceu.auraAtiva ? "destaque" : undefined}
          title="Chance atual de falha contra ataques corpo a corpo e a distância"
        >
          {ceu.auraAtiva ? `${ceu.percentual}%` : "0%"}
        </span>
        {ceu.auraAtiva && (
          <span className="afty-valor text-[11px]" title="Margem atual da Aura Embaçada">
            1 a {ceu.limiar} em 1d10
          </span>
        )}
        <span className="h-5 w-px bg-[var(--afty-borda)] mx-1" aria-hidden="true" />
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
      </div>
    </section>
  );
}
