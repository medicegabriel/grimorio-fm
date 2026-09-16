/**
 * ============================================================
 * BANCADA DE NÍVEIS: a conta de arma do guia Criação de Equipamentos
 * ============================================================
 * A tela da fase 2 do guia Criação de Equipamentos e Itens 2.5.2. As contas
 * moram em `afty-criacao-equipamentos-armas.js`, e aqui só se desenha o que elas
 * devolvem.
 *
 * ⚠ ELA SÓ EXISTE COM O ADDON QUE A PEDE (`permite: ["armasPorNivel"]`), e o
 * portão está no `ArmaCustomEditor`. A RECEITA não depende dela: uma arma com
 * receita continua com o dado da conta sem o Addon (autor, 2026-09-14).
 *
 * A ordem das faixas é a da Bancada de Arma: os ladrilhos do resultado, as
 * linhas de cada propriedade, os avisos, e só então os campos.
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>`. O texto do guia vai no `title`.
 * ============================================================
 */

import { AlertTriangle, Plus, X } from "lucide-react";

import { FieldLabel, Select, TextArea } from "../../../components/builder-controls";
import {
  BONUS_ESPECIAL_MAXIMO, GRAUS_ALCANCE, OBSERVACOES_ARMAS, ROLAGENS_BONUS, TEXTO_PROPRIEDADES_ESPECIAIS,
  TIPOS_ESPECIAL,
} from "../afty-criacao-equipamentos-armas";
import { AFTY_GRAUS } from "../afty-equipamentos";
import { AFTY_RESISTENCIAS } from "../afty-schema";
import { BoolChip } from "./primitivos";

const CABECALHO = "text-[10px] uppercase tracking-wider text-slate-500";

function Ladrilho({ rotulo, valor, dica, tom = "normal" }) {
  return (
    <div title={dica} className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-0">
      <div className={`${CABECALHO} truncate`}>{rotulo}</div>
      <div className={`font-mono font-bold text-sm tabular-nums truncate ${
        tom === "ruim" ? "text-rose-300" : tom === "forte" ? "text-purple-300" : "text-white"
      }`}
      >
        {valor}
      </div>
    </div>
  );
}

const TRS = AFTY_RESISTENCIAS.filter((r) => r.escala !== "fixa").map((r) => ({ value: r.value, label: r.label }));
const TITULO_DO_TIPO = {
  bonus: TEXTO_PROPRIEDADES_ESPECIAIS.bonus,
  treinoPericias: TEXTO_PROPRIEDADES_ESPECIAIS.treino,
  treinoTR: TEXTO_PROPRIEDADES_ESPECIAIS.treino,
  cenario: TEXTO_PROPRIEDADES_ESPECIAIS.cenario,
};
const NOVO_DO_TIPO = {
  bonus: { tipo: "bonus", rolagem: "pericia", alvo: "", valor: BONUS_ESPECIAL_MAXIMO },
  treinoPericias: { tipo: "treinoPericias", alvos: ["", ""] },
  treinoTR: { tipo: "treinoTR", alvo: "" },
  cenario: { tipo: "cenario", texto: "" },
};

/* UM efeito da Propriedade Especial personalizada, com o botão de tirar. */
function EfeitoEspecial({ efeito, pericias, onChange, onRemove, indice }) {
  const opcoesPericia = pericias.map((p) => ({ value: p.id, label: p.nome }));
  const rotulo = TIPOS_ESPECIAL.find((t) => t.value === efeito.tipo)?.label ?? efeito.tipo;
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-300" title={TITULO_DO_TIPO[efeito.tipo]}>{rotulo}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-300 hover:bg-rose-950/40"
          title="Tirar este efeito"
          aria-label={`Tirar o efeito ${indice + 1}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {efeito.tipo === "bonus" && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
          <Select
            value={efeito.rolagem}
            onChange={(v) => onChange({ rolagem: v, alvo: "" })}
            options={ROLAGENS_BONUS}
            aria-label={`Rolagem do efeito ${indice + 1}`}
          />
          {efeito.rolagem === "pericia" || efeito.rolagem === "tr" ? (
            <Select
              value={efeito.alvo}
              onChange={(v) => onChange({ alvo: v })}
              options={efeito.rolagem === "tr" ? TRS : opcoesPericia}
              placeholder={efeito.rolagem === "tr" ? "Teste de Resistência" : "Perícia"}
              aria-label={`Alvo do efeito ${indice + 1}`}
            />
          ) : <span className="hidden sm:block" />}
          <div className="flex gap-1.5">
            {Array.from({ length: BONUS_ESPECIAL_MAXIMO }, (_, i) => i + 1).map((v) => (
              <BoolChip key={v} ativo={efeito.valor === v} onToggle={() => onChange({ valor: v })}>+{v}</BoolChip>
            ))}
          </div>
        </div>
      )}

      {efeito.tipo === "treinoPericias" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[0, 1].map((i) => (
            <Select
              key={i}
              value={efeito.alvos[i]}
              onChange={(v) => onChange({ alvos: efeito.alvos.map((a, j) => (j === i ? v : a)) })}
              options={opcoesPericia.filter((o) => o.value !== efeito.alvos[1 - i])}
              placeholder="Perícia"
              aria-label={`Perícia ${i + 1} do efeito ${indice + 1}`}
            />
          ))}
        </div>
      )}

      {efeito.tipo === "treinoTR" && (
        <Select
          value={efeito.alvo}
          onChange={(v) => onChange({ alvo: v })}
          options={TRS}
          placeholder="Teste de Resistência"
          aria-label={`Teste de Resistência do efeito ${indice + 1}`}
        />
      )}

      {efeito.tipo === "cenario" && (
        <TextArea
          value={efeito.texto}
          onChange={(v) => onChange({ texto: v })}
          placeholder="Interação com o cenário"
          rows={2}
        />
      )}
    </div>
  );
}

/**
 * `conta` é o que `contaDaArmaPorNivel` devolveu, `receita` é a receita saneada da
 * arma, e `onReceita` recebe a receita inteira já mesclada.
 */
export default function BancadaDeNiveis({ conta, receita, temEspecial, temRecarga, recarga, pericias, onReceita }) {
  const saldo = conta.credito - conta.gasto;
  const alcanceTitulo = conta.alcance
    ? GRAUS_ALCANCE.map((g) => {
      const [curto, longo] = conta.alcance[g];
      const nome = AFTY_GRAUS.find((x) => x.value === g)?.label ?? g;
      return `${nome}: ${curto}m / ${longo}m`;
    }).join("\n")
    : null;
  const patchEspecial = (i, partial) =>
    onReceita({ especiais: receita.especiais.map((e, j) => (j === i ? { ...e, ...partial } : e)) });

  return (
    <div className="rounded-lg border border-purple-900/60 bg-purple-950/10 p-2.5 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
        <Ladrilho
          rotulo={conta.desarmado ? "Desarmado" : "Dado do Custo"}
          valor={conta.desarmado ? `${conta.nivelBase} Níveis` : conta.dadoBase}
          dica={conta.desarmado ? OBSERVACOES_ARMAS.desarmado : `Custo ${conta.custoUsado}`}
        />
        <Ladrilho rotulo="Gasto" valor={conta.gasto ? `-${conta.gasto}` : 0} dica="Níveis de Dano das propriedades e do crítico" />
        <Ladrilho rotulo="Crédito" valor={conta.credito ? `+${conta.credito}` : 0} dica="Níveis só para propriedades" />
        <Ladrilho
          rotulo="Dado"
          valor={conta.desarmado ? "Desarmado" : conta.dado}
          tom={conta.avisos.some((a) => a.id === "dadoExcedido" || a.id === "desarmadoExcedido") ? "ruim" : saldo < 0 ? "normal" : "forte"}
          dica={conta.reducao ? `${conta.reducao} Níveis abaixo do dado do Custo` : "O dado do Custo"}
        />
        {conta.duasMaos && <Ladrilho rotulo="Duas Mãos" valor={conta.duasMaos} dica="Um Nível acima do dado de uma mão" />}
        {conta.alcance && <Ladrilho rotulo="Alcance" valor={`${conta.alcance.quarto[0]}/${conta.alcance.quarto[1]}m`} dica={alcanceTitulo} />}
      </div>

      {conta.linhas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conta.linhas.map((l) => (
            <span
              key={l.id}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                l.niveis > 0 ? "bg-emerald-950/40 text-emerald-300" : "bg-slate-800/70 text-slate-300"
              }`}
            >
              {l.rotulo} {l.niveis > 0 ? `+${l.niveis}` : l.niveis}
            </span>
          ))}
          {recarga === 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300" title={OBSERVACOES_ARMAS.recargaUm}>
              Área 3m · Ação Completa
            </span>
          )}
          {temEspecial && temRecarga && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300" title={OBSERVACOES_ARMAS.especialRecarga}>
              Recarregar: Ação Comum
            </span>
          )}
        </div>
      )}

      {conta.avisos.length > 0 && (
        <ul className="space-y-0.5">
          {conta.avisos.map((a) => (
            <li key={a.id} className="text-[11px] text-amber-400 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" /> {a.texto}
            </li>
          ))}
        </ul>
      )}

      <div>
        <FieldLabel>Receita</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          <BoolChip
            ativo={receita.custoAnterior && conta.custo > 1 && !receita.desarmado}
            bloqueado={conta.custo === 1 || receita.desarmado}
            lockTitle={receita.desarmado ? OBSERVACOES_ARMAS.desarmado : "A partir do Custo 2"}
            title={OBSERVACOES_ARMAS.custoAnterior}
            onToggle={() => onReceita({ custoAnterior: !receita.custoAnterior })}
          >
            Dado do Custo Anterior
          </BoolChip>
          <BoolChip
            ativo={receita.desarmado}
            title={OBSERVACOES_ARMAS.desarmado}
            onToggle={() => onReceita({ desarmado: !receita.desarmado })}
          >
            Dano Desarmado
          </BoolChip>
        </div>
      </div>

      {/* A Propriedade Especial personalizada só existe com a propriedade Especial
          marcada, e cabem quantos efeitos a mesa quiser (autor, 2026-09-14). */}
      {temEspecial && (
        <div className="space-y-1.5">
          <FieldLabel>Propriedade Especial</FieldLabel>
          {receita.especiais.map((e, i) => (
            <EfeitoEspecial
              key={i}
              indice={i}
              efeito={e}
              pericias={pericias}
              onChange={(partial) => patchEspecial(i, partial)}
              onRemove={() => onReceita({ especiais: receita.especiais.filter((_, j) => j !== i) })}
            />
          ))}
          <div className="flex flex-wrap gap-1.5" title={TEXTO_PROPRIEDADES_ESPECIAIS.abertura}>
            {TIPOS_ESPECIAL.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onReceita({ especiais: [...receita.especiais, NOVO_DO_TIPO[t.value]] })}
                title={TITULO_DO_TIPO[t.value]}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
