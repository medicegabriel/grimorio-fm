/* Alternador entre o Grimório público (criatura da 2.5.2) e a Ficha de Player.
   São rotas com armazenamento próprio, então a troca é um link de verdade, que
   recarrega o app na outra rota. O /Afty não aparece aqui de propósito. */

const OPCOES = [
  { id: "criatura", rotulo: "Criatura", href: "/Criatura" },
  { id: "player", rotulo: "Jogador", href: "/Jogador" },
];

export default function AlternadorSistema({ atual }) {
  return (
    <nav
      aria-label="Sistema"
      className="inline-flex shrink-0 items-stretch h-8 rounded border border-slate-700 bg-slate-900/80 overflow-hidden text-xs sm:text-sm font-semibold"
    >
      {OPCOES.map((op) => {
        const ativo = op.id === atual;
        return (
          <a
            key={op.id}
            href={op.href}
            aria-current={ativo ? "page" : undefined}
            className={
              "inline-flex items-center px-2 sm:px-3 transition-colors no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 " +
              (ativo
                ? "bg-purple-600/40 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100")
            }
          >
            {op.rotulo}
          </a>
        );
      })}
    </nav>
  );
}
