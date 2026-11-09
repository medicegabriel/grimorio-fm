import "./corrupcao.css";

/**
 * AS CAMADAS DA CORRUPÇÃO VISUAL (V8, 2026-11-07).
 *
 * Só desenha: a fração e o marco vêm do `derived.corrupcao`, e nada aqui muda
 * número de ficha. Monta DOIS irmãos:
 *
 *   • o MATIZ, que tinge a tela inteira de vermelho com `mix-blend-mode: color`,
 *     preservando a luminância, então o texto continua legível;
 *   • as CAMADAS (vinheta, veias, scanlines, ruído, rasgos, fatias, halo), que só
 *     animam `transform` e `opacity`.
 *
 * ⚠ O MATIZ É IRMÃO, NÃO FILHO. As camadas ficam num elemento `position: fixed`
 * com `z-index`, que cria contexto de empilhamento, e um blend DENTRO dele só
 * misturaria com as próprias camadas e nunca com a ficha.
 *
 * `modo`:
 *   • "fixo"      Criador e Ficha Final: a página é da criatura, cobre a janela;
 *   • "recortado" Encontro: o painel do combatente, `position: absolute` e
 *     recortado, para o vizinho não sentir. O pai precisa ser `relative`.
 *
 * Nenhum `filter`, `transform` ou `contain` na raiz da ficha: tudo mora aqui, em
 * elementos dedicados, e o painel de fontes continua abrindo no lugar certo.
 */
const VEIAS = [
  "M0 5 C 9 9, 13 17, 23 19 S 36 29, 40 41 S 45 53, 51 60 M23 19 C 27 12, 33 12, 38 6 M40 41 C 47 38, 52 40, 57 35",
  "M100 7 C 91 10, 87 18, 77 20 S 64 30, 60 42 S 55 54, 49 61 M77 20 C 73 13, 67 13, 62 7 M60 42 C 53 39, 48 41, 43 36",
  "M0 93 C 8 87, 15 88, 20 79 S 29 69, 34 62 S 40 52, 46 48 M20 79 C 14 76, 9 78, 4 72",
  "M100 95 C 92 89, 85 90, 80 81 S 71 71, 66 64 S 60 54, 54 50 M80 81 C 86 78, 91 80, 96 74",
  "M0 48 C 6 46, 9 52, 15 51 S 22 57, 26 55 S 31 50, 36 52",
  "M100 52 C 94 50, 91 57, 85 55 S 78 61, 74 58 S 69 53, 64 55",
  "M44 0 C 45 7, 41 11, 43 18 S 49 24, 48 32 M43 18 C 38 20, 36 25, 31 26",
  "M57 100 C 56 93, 60 89, 58 82 S 52 76, 53 68 M58 82 C 63 80, 65 75, 70 74",
];
const FINAS = new Set([4, 5]);

export default function CamadasDeCorrupcao({ corrupcao, modo = "fixo" }) {
  if (!corrupcao?.ativo || !(corrupcao.marco > 0)) return null;
  const { marco, nivel, pele } = corrupcao;
  const estilo = { "--afty-c": nivel, "--afty-p": `${Math.round(nivel * 1000) / 10}%` };
  const comum = { "data-afty-corrupcao": marco, "data-afty-pele": pele, style: estilo, "aria-hidden": "true" };
  return (
    <>
      <div className={`afty-corrupcao-matiz afty-corrupcao--${modo}`} {...comum} />
      <div className={`afty-corrupcao afty-corrupcao--${modo}`} {...comum}>
        <div className="afty-corrupcao-vinheta" />
        {/* `key` remonta o SVG quando o marco muda, e é isso que faz a veia nascer de novo UMA vez. */}
        <svg key={marco} className="afty-corrupcao-veias" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g className="afty-corrupcao-auras">
            {VEIAS.map((d, i) => <path key={i} pathLength="1" d={d} />)}
          </g>
          <g className="afty-corrupcao-tracos">
            {VEIAS.map((d, i) => <path key={i} pathLength="1" d={d} className={FINAS.has(i) ? "fina" : undefined} />)}
          </g>
        </svg>
        <div className="afty-corrupcao-scan" />
        <div className="afty-corrupcao-ruido" />
        <div className="afty-corrupcao-rasgo"><i /><i /><i /></div>
        <div className="afty-corrupcao-fatia"><i /><i /><i /></div>
        <div className="afty-corrupcao-halo" />
      </div>
    </>
  );
}
