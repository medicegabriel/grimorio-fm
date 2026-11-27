import { AlertTriangle, RefreshCw, Users } from "lucide-react";

/* No lugar da lista do `/Criatura` quando o compêndio não chega (2026-11-26, fila "Carregamento"). Quem tenta outra vez é a
   pessoa: o pedido novo sai do `tentarDeNovo` do `useCompendio`.

   `onSair` (2026-11-26, a pedido do autor): desde que só a pasta Criaturas Base espera o compêndio, a falha aparece só nela, e
   a vista gravada prendia a pessoa ali até um pedido dar certo. O botão volta para Todas as Criaturas. Sem a prop ele não aparece
   (o criador, o painel e o Encontro abertos com um id do compêndio não têm para onde sair). */
export default function FalhaDoCompendio({ onTentar, onSair }) {
  return (
    <div role="alert" className="min-h-[60vh] grid place-items-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" aria-hidden="true" />
          Compêndio Não Carregou
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onTentar}
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Tentar de Novo
          </button>
          {onSair && (
            <button
              type="button"
              onClick={onSair}
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              Todas as Criaturas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
