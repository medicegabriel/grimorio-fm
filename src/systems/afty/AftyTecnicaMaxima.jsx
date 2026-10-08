/**
 * ============================================================
 * TÉCNICA MÁXIMA NO CRIADOR (autor, 2026-10-08)
 * ============================================================
 * O painel que toma o lugar dos chips de Tipo e do Nível quando o Feitiço é uma
 * Técnica Máxima. Ele nasce em Feitiços → Especial → Tipo de Especial, mas o
 * registro continua sendo um Feitiço da natureza dele (DA-01): a Técnica Máxima
 * é `nivel: "max"`, e a NATUREZA é o `tipo` verdadeiro. Os chips de Natureza
 * escrevem justamente o `tipo` e o `especialSubtipo`.
 *
 * ⚠ Fica fora do `AftyCreatureBuilder.jsx` de propósito, que já passa de 20 mil
 * linhas. Importa só `afty-feiticos.js` (que o builder já importa) e `ui/`, então
 * não abre seta nova no grafo de módulos.
 * ============================================================
 */
import { AlertTriangle, Crown, RefreshCw, X } from "lucide-react";
import { DicaDeTexto } from "./ui/fontes";
import {
  NATUREZAS_TECNICA_MAXIMA, naturezaDaTecnicaMaxima, ehTecnicaMaximaOficial,
  patchParaTecnicaMaxima, patchSemTecnicaMaxima,
} from "./afty-feiticos";

const ROTULO_ESCALA = { 5: "Nível 5", max: "Técnica Máxima" };

function Metrica({ rotulo, valor, dica }) {
  const caixa = (
    <span className="inline-flex items-baseline gap-1.5 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1 text-[11px]">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{rotulo}</span>
      <span className="font-mono font-bold tabular-nums text-white">{valor}</span>
    </span>
  );
  return dica ? <DicaDeTexto texto={dica}>{caixa}</DicaDeTexto> : caixa;
}

/**
 * O painel da Técnica Máxima: identidade, natureza, escala, recarga, validação
 * e os dois botões de regime (converter a LEGACY, desfazer a oficial).
 *
 * `resumo` é a linha pronta do derive (`derived.feiticos.lista`), que traz a
 * validação e a escala. A tela só exibe.
 */
export function TecnicaMaximaPainel({ feitico, resumo, tecnicasMaximas, nivelMax, onPatch }) {
  const oficial = ehTecnicaMaximaOficial(feitico);
  const info = resumo?.tecnicaMaxima ?? null;
  const natureza = naturezaDaTecnicaMaxima(feitico);
  const validacao = info?.validacao ?? [];
  const erros = validacao.filter((v) => v.nivel === "erro");
  const avisos = validacao.filter((v) => v.nivel === "aviso");
  const podeConverter = !oficial && (tecnicasMaximas?.livres ?? 0) > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-700/60 bg-amber-950/30 px-2.5 py-1 text-[12px] font-semibold text-amber-200">
          <Crown className="w-3.5 h-3.5" aria-hidden="true" /> Técnica Máxima
        </span>
        {!oficial && (
          <DicaDeTexto
            titulo="Modelo Anterior"
            texto="Técnica Máxima gravada antes da regra oficial. Calcula na tabela de Técnica Máxima e usa a vaga comum de Feitiço, como sempre usou."
          >
            <span className="inline-flex items-center rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400">Modelo Anterior</span>
          </DicaDeTexto>
        )}
        {info?.escala != null && (
          <Metrica
            rotulo="Escala"
            valor={ROTULO_ESCALA[info.escala] ?? info.escala}
            dica={oficial
              ? "Com acesso só aos Feitiços de Nível 4 a Técnica Máxima usa os valores de Nível 5, e com acesso ao Nível 5 passa a usar os próprios."
              : null}
          />
        )}
        {info?.recarga != null && (
          <Metrica rotulo="Recarga" valor={`${info.recarga} ${info.recarga === 1 ? "Rodada" : "Rodadas"}`} />
        )}
        <span className="flex-1" />
        {!oficial && (
          <button
            type="button"
            onClick={() => podeConverter && onPatch(patchParaTecnicaMaxima(feitico))}
            disabled={!podeConverter}
            title={podeConverter ? undefined : "Sem Vaga de Técnica Máxima"}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-600 disabled:border-slate-800"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" /> Converter para Oficial
          </button>
        )}
        {oficial && (
          <button
            type="button"
            onClick={() => onPatch(patchSemTecnicaMaxima(feitico, nivelMax))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:border-slate-500"
          >
            <X className="w-3 h-3" aria-hidden="true" /> Deixar de Ser Técnica Máxima
          </button>
        )}
      </div>

      {oficial && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Natureza da Técnica Máxima">
          {NATUREZAS_TECNICA_MAXIMA.map((n) => {
            const on = natureza?.value === n.value;
            return (
              <button
                key={n.value}
                type="button"
                aria-pressed={on}
                onClick={() => onPatch({ tipo: n.tipo, ...(n.especialSubtipo ? { especialSubtipo: n.especialSubtipo } : {}) })}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 ${
                  on
                    ? "bg-purple-700 border-purple-600 text-white"
                    : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
                }`}
              >
                {n.label}
              </button>
            );
          })}
        </div>
      )}

      {erros.map((v) => (
        <div key={`${v.codigo}:${v.texto}`} className="flex items-center gap-1.5 text-[11px] text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> {v.texto}
        </div>
      ))}
      {avisos.map((v) => (
        <div key={`${v.codigo}:${v.texto}`} className="flex items-center gap-1.5 text-[11px] text-amber-400/90">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> {v.texto}
        </div>
      ))}
    </div>
  );
}
