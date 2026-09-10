/**
 * ============================================================
 * BANCADA DE CRIAÇÃO DE ARMA — os Pontos de Criação na tela
 * ============================================================
 * A tela do padrão de criação do autor. As contas moram em
 * `afty-criacao-armas.js`, e aqui só se desenha o que elas devolvem.
 *
 * ⚠ ELA SÓ EXISTE COM O ADDON QUE A PEDE (`permite: ["criacaoArmas"]`). O
 * portão está no `ArmaCustomEditor`, e a razão está em docs/afty-addons.md: em
 * 2026-08-20 a Concessão do Mestre vazou para a tela de todo mundo porque o
 * verbo foi ao motor e ninguém disse quem o enxerga.
 *
 * ⚠ ARQUIVO PRÓPRIO, pelo mesmo motivo das abas Carteira, Defesas e Catarse: o
 * `AftyCreatureBuilder.jsx` passou das 15 mil linhas e o Babel já reclama do
 * tamanho ao processá-lo.
 *
 * ------------------------------------------------------------
 * A ORDEM DAS FAIXAS
 * ------------------------------------------------------------
 * Resultado primeiro, editor depois, e nunca um campo no meio dos números. É a
 * mesma régua do card de Invocação (docs/afty-status.md, 2026-08-15):
 *
 *   1. os ladrilhos de PC, que são o resultado
 *   2. os avisos, que são o resultado que deu errado
 *   3. os campos que só a métrica usa, que são o editor
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>` e nunca o caractere. Explicação de campo
 * vai no `title`.
 * ============================================================
 */

import { AlertTriangle } from "lucide-react";

import { FieldLabel, NumberInput, TextInput } from "../../../components/builder-controls";
import { BONUS_DESTINOS } from "../afty-criacao-armas";
import { BoolChip } from "./primitivos";

const CABECALHO = "text-[10px] uppercase tracking-wider text-slate-500";

/* Um ladrilho de número. Mesmo desenho dos totais da Carteira e das pilhas de
   RD da aba de Resistências: rótulo pequeno em cima, número embaixo, e o escuro
   dentro do ladrilho em vez de uma tira de outra cor. */
function Ladrilho({ rotulo, valor, dica, tom = "normal" }) {
  return (
    <div title={dica} className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5">
      <div className={`${CABECALHO} truncate`}>{rotulo}</div>
      <div className={`font-mono font-bold text-sm tabular-nums ${
        tom === "ruim" ? "text-rose-300" : tom === "forte" ? "text-purple-300" : "text-white"
      }`}
      >
        {valor}
      </div>
    </div>
  );
}

/* A escolha do limite extra que o custo 2 e o custo 4 dão. São dois destinos e
   nunca os dois ao mesmo tempo, então são chips e não caixas de marcar. */
function EscolhaDeBonus({ rotulo, valor, onChange, dica }) {
  return (
    <div>
      <FieldLabel>{rotulo}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {BONUS_DESTINOS.map((d) => (
          <BoolChip
            key={d}
            ativo={valor === d}
            onToggle={() => onChange(d)}
            title={dica}
          >
            {d === "dano" ? "Dano" : "Propriedades"}
          </BoolChip>
        ))}
      </div>
    </div>
  );
}

/**
 * `orc` é o que `orcamentoDaArma` devolveu, e `criacao` é o bloco gravado na
 * arma. `onPatch` recebe o bloco inteiro, já mesclado pelo chamador.
 */
export default function BancadaDeArma({ orc, criacao, temEspecial, onPatch }) {
  const excedeu = (gasto, limite) => (gasto > limite ? "ruim" : "normal");
  return (
    <div className="rounded-lg border border-purple-900/60 bg-purple-950/10 p-2.5 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
        <Ladrilho
          rotulo="Pontos"
          valor={`${orc.gastos.total} / ${orc.pool.total}`}
          tom={orc.sobra < 0 ? "ruim" : "normal"}
          dica={`Base ${orc.pool.base} da arma ${orc.classificacao.label}, ${orc.pool.custo} do custo e ${orc.pool.espaco} dos espaços`}
        />
        <Ladrilho
          rotulo="Sobra"
          valor={orc.sobra}
          tom={orc.sobra < 0 ? "ruim" : orc.sobra === 0 ? "forte" : "normal"}
          dica="Pontos de Criação ainda por gastar"
        />
        <Ladrilho
          rotulo="Dano"
          valor={`${orc.gastos.dano} / ${orc.limites.dano}`}
          tom={excedeu(orc.gastos.dano, orc.limites.dano)}
          dica="Um ponto por nível de dado"
        />
        <Ladrilho
          rotulo="Margem"
          valor={`${orc.gastos.margem} / ${orc.limites.margem * 3}`}
          tom={excedeu(orc.gastos.margem, orc.limites.margem * 3)}
          dica="Três pontos por redução na margem de crítico"
        />
        <Ladrilho
          rotulo="Propriedades"
          valor={`${orc.gastos.propriedades} / ${orc.limites.propriedades}`}
          tom={excedeu(orc.gastos.propriedades, orc.limites.propriedades)}
          dica="Soma do preço das propriedades marcadas"
        />
        {/* ⚠ O ROXO AQUI QUER DIZER "ESTE NÚMERO VEM DE FORA", que é a mesma
            leitura do Nível na faixa da Carteira: na arma de técnica o custo
            sai do grau do usuário e o campo do editor vira mostrador. */}
        <Ladrilho
          rotulo="Custo"
          valor={orc.custo}
          tom={!orc.tecnica && orc.custo > orc.limites.custoMax ? "ruim" : orc.tecnica ? "forte" : "normal"}
          dica={orc.tecnica
            ? "O custo da arma de técnica vem do grau do usuário"
            : `O custo máximo da arma ${orc.classificacao.label} é ${orc.limites.custoMax}`}
        />
      </div>

      {orc.linhas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {orc.linhas.map((l) => (
            <span
              key={l.id}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                l.pc < 0 ? "bg-emerald-950/40 text-emerald-300" : "bg-slate-800/70 text-slate-300"
              }`}
            >
              {l.rotulo} {l.pc > 0 ? `+${l.pc}` : l.pc}
            </span>
          ))}
        </div>
      )}

      {orc.avisos.length > 0 && (
        <ul className="space-y-0.5">
          {orc.avisos.map((a) => (
            <li key={a.id} className="text-[11px] text-amber-400 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" /> {a.texto}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <FieldLabel>Origem</FieldLabel>
          <BoolChip
            ativo={criacao.tecnica}
            onToggle={() => onPatch({ tecnica: !criacao.tecnica })}
            title="A arma vem de uma técnica, e o custo dela passa a seguir o grau do usuário"
          >
            De Técnica
          </BoolChip>
        </div>
        {orc.custo >= 2 && (
          <EscolhaDeBonus
            rotulo="Limite do Custo 2"
            valor={criacao.bonus2}
            onChange={(v) => onPatch({ bonus2: v })}
            dica="Onde entra o limite extra que o custo 2 concede"
          />
        )}
        {orc.custo >= 4 && (
          <EscolhaDeBonus
            rotulo="Limite do Custo 4"
            valor={criacao.bonus4}
            onChange={(v) => onPatch({ bonus4: v })}
            dica="Onde entra o limite extra que o custo 4 concede"
          />
        )}
      </div>

      {/* A Especial é a única propriedade sem preço fixo: quem avalia é a mesa.
          Os dois campos só aparecem com ela marcada, senão seriam dois campos
          que não decidem nada. */}
      {temEspecial && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div>
            <FieldLabel>Especial em PC</FieldLabel>
            <NumberInput
              value={criacao.especialPc}
              onChange={(v) => onPatch({ especialPc: v })}
              min={0}
              max={24}
            />
          </div>
          <div className="sm:col-span-3">
            <FieldLabel>Traço Especial</FieldLabel>
            <TextInput
              value={criacao.especialTexto}
              onChange={(v) => onPatch({ especialTexto: v })}
              placeholder="O traço único da arma"
            />
          </div>
        </div>
      )}
    </div>
  );
}
