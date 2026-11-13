import "./orbitas.css";

/**
 * AS ÓRBITAS DO RETRATO (2026-11-10).
 *
 * Uma gema pequena por entrada da marca que o Addon escolheu, circulando pela
 * borda da moldura do retrato. Só desenha: a contagem vem do `derived.orbitas`
 * e nada aqui muda número de ficha.
 *
 * O pai precisa ser `position: relative`. Cada gema anda por `offset-path` e a
 * defasagem é `i / n` da volta, então as gemas ficam sempre igualmente
 * espaçadas, qualquer que seja a contagem. Sem animação (reduzir movimento) elas
 * ficam paradas nessas mesmas posições.
 */
export default function OrbitasDoRetrato({ orbitas }) {
  if (!orbitas?.ativo || !(orbitas.gemas > 0)) return null;
  const n = orbitas.gemas;
  return (
    <span className="e-orbitas" data-pele={orbitas.pele} data-orbitas={n} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="e-orbitas-gema" style={{ "--i": i, "--n": n }}>
          <svg viewBox="0 0 24 24" focusable="false">
            <path className="e-gema-corpo" d="M12 2.5 20.5 9 12 21.5 3.5 9Z" />
            <path className="e-gema-faceta" d="M3.5 9h17M8 9l4-6.5L16 9l-4 12.5z" />
            <path className="e-gema-brilho" d="M7.2 8 10 4.6" />
          </svg>
        </span>
      ))}
    </span>
  );
}
