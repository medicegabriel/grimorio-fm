import React from "react";
import { Sparkles, Lock } from "lucide-react";

/**
 * ============================================================
 * PRIMITIVOS DO AFTY — os controles que criador e Ficha dividem
 * ============================================================
 * Extraídos do `AftyCreatureBuilder.jsx` em 2026-08-05, quando a Ficha Final
 * passou a precisar dos mesmos três. Eram funções LOCAIS do criador, sem export.
 *
 * ⚠ O visual é o do builder da 2.5.2 (slate + roxo), de propósito: o criador é
 * uma tela do app e tem de parecer com o resto. A FICHA não usa estes daqui para
 * pintar corpo de cartão, porque ela é pintada por variável CSS (ver
 * `ficha/ficha.css`), e cor escrita como classe de utilidade não é tematizável.
 * ============================================================
 */

/* Cartão / cabeçalho de seção — mesmo visual do builder 2.5.2. */
export function Card({ title, children, headerRight }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        {/* Ícone DENTRO do h2 (mesmo padrão do builder 2.5.2): como irmão do
            título ele se alinhava contra a altura da barra inteira, e não
            contra a linha do texto, o que deixava ele visivelmente alto. */}
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          {title}
        </h2>
        {headerRight && <div className="ml-auto flex-shrink-0">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* Chip booleano (liga/desliga). */
export function BoolChip({ ativo, onToggle, bloqueado, lockTitle, title, children }) {
  return (
    <button
      type="button"
      onClick={() => !bloqueado && onToggle()}
      disabled={bloqueado}
      aria-pressed={ativo}
      title={bloqueado ? lockTitle : title}
      className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
        ativo
          ? "bg-purple-700 border-purple-600 text-white"
          : bloqueado
            ? "border-slate-800 text-slate-600 cursor-not-allowed"
            : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
      }`}
    >
      {bloqueado && <Lock className="w-2.5 h-2.5" />}
      {children}
    </button>
  );
}

/* Medidor de N segmentos clicáveis. Serve "quantas vezes pegou" (repetíveis),
   faixa de proficiência (Treinado/Mestre) e faixa de estado de combate.
   `bloqueado` deixa só de leitura (ataque Amaldiçoado, que é sempre treinado).

   `concedido` (opcional) é a faixa que veio de FORA, tipicamente do Treino de
   Perícia. Ela pinta de VERDE os segmentos acima do que a ficha escolheu, e o
   medidor segue clicável: marcar por cima converte a concessão em bônus
   numérico, que é como o livro trata o "Caso já seja". */
export function VezesGauge({ vezes, max, nome, onSet, rotulos, bloqueado, concedido = 0 }) {
  return (
    <span className="flex items-center gap-0.5 flex-shrink-0" role="group" aria-label={`${nome}: faixa ${Math.max(vezes, concedido)} de ${max}`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const proprio = n <= vezes;
        const deFora = !proprio && n <= concedido;
        return (
          <button
            key={n}
            type="button"
            /* Clicar no segmento que já é o último desce um, então dá para
               voltar de 3 para 2 sem passar pelo zero. */
            onClick={() => !bloqueado && onSet(n === vezes ? n - 1 : n)}
            disabled={bloqueado}
            aria-pressed={proprio || deFora}
            title={
              deFora
                ? `${rotulos?.[n - 1] ?? `${n}ª vez`} (concedido, clique para treinar por conta)`
                : (rotulos?.[n - 1] ?? `${n}ª vez`)
            }
            className={`w-3.5 h-3.5 rounded-sm border transition-colors ${
              proprio ? "bg-purple-600 border-purple-500"
                : deFora ? "bg-emerald-600 border-emerald-500 hover:bg-emerald-500"
                : "border-slate-700 hover:border-purple-600"
            } ${bloqueado ? "cursor-not-allowed" : ""}`}
          />
        );
      })}
    </span>
  );
}
