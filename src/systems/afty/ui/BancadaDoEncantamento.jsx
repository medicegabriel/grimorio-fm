/**
 * ============================================================
 * BANCADA DO ENCANTAMENTO DE GRAU ESPECIAL (Criação de Equipamentos, fase 4)
 * ============================================================
 * A conta OPCIONAL do guia na Habilidade Única da Ferramenta de Grau Especial.
 * As contas moram em `afty-criacao-equipamentos-encantamento.js`, e o que ela
 * gera soma com as linhas livres do Motor, que continuam no bloco de cima.
 *
 * ⚠ ELA SÓ APARECE COM O ADDON QUE A PEDE (`permite: ["encantamentoGuia"]`), e o
 * portão está no `FerramentaEditor`. A receita gravada continua valendo sem ele.
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>`. O texto do guia vai no `title`.
 * ============================================================
 */

import { AlertTriangle, Plus, X } from "lucide-react";

import { FieldLabel, Select } from "../../../components/builder-controls";
import {
  EFEITO_MELHORAR, ENCANTAMENTOS_SEM_MELHORIA, MODOS_MELHORAR, TABELA_INTERACOES, TEXTO_ENCANTAMENTO,
  TEXTO_TECNICA_INATA, efeitosDoEncantamento, novaReceitaUnica,
} from "../afty-criacao-equipamentos-encantamento";
import { getCanal } from "../afty-efeitos";
import { CATEGORIAS_DANO, TIPOS_DANO } from "../afty-equipamentos";
import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "../afty-schema";
import { BoolChip } from "./primitivos";

const ATRIBUTOS = AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label }));
const TRS = AFTY_RESISTENCIAS.filter((r) => r.escala !== "fixa").map((r) => ({ value: r.value, label: r.label }));
const CATEGORIAS = CATEGORIAS_DANO.map((c) => ({ value: c.id, label: c.nome }));
const INTERACOES_OK = TABELA_INTERACOES.filter((l) => l.implementado !== false);
const LINHA = Object.fromEntries(TABELA_INTERACOES.map((l) => [l.id, l]));

/* O que um tipo da tabela pede além do atributo: o TR ou a categoria de dano. */
function AlvoDoTipo({ tipo, valor, onChange, rotulo }) {
  const alvo = LINHA[tipo]?.alvo;
  if (!alvo) return null;
  return (
    <Select
      value={valor}
      onChange={onChange}
      options={alvo === "tr" ? TRS : CATEGORIAS}
      placeholder={alvo === "tr" ? "Teste de Resistência" : "Categoria de Dano"}
      aria-label={rotulo}
    />
  );
}

const sinal = (n) => (n > 0 ? `+${n}` : String(n));
const rotuloDaLinha = (l) => {
  const canal = getCanal(l.canal)?.label ?? l.canal;
  const alvo = !l.alvo ? ""
    : l.alvo.startsWith("atr:") ? AFTY_ATTRS.find((a) => a.key === l.alvo.slice(4))?.label
      : TIPOS_DANO[l.alvo] ?? AFTY_RESISTENCIAS.find((r) => r.value === l.alvo)?.label ?? "";
  return alvo ? `${canal} (${alvo})` : canal;
};

/**
 * `fa` é a Ferramenta resolvida (com `guiaUnica`, `guiaEfeitos`, `guiaAvisos`,
 * `encantamentos` e `feiticoVinculado`), `feiticos` é a lista da ficha, e
 * `onReceita` recebe a receita inteira.
 */
export default function BancadaDoEncantamento({ fa, feiticos = [], onReceita }) {
  const receita = fa.guiaUnica ?? { ligada: false, efeitos: [], feitico: "" };
  const efeitos = receita.efeitos ?? [];
  const patch = (partial) => onReceita({ ...novaReceitaUnica(), ...receita, ...partial });
  const patchEfeito = (i, partial) => patch({ efeitos: efeitos.map((e, j) => (j === i ? { ...e, ...partial } : e)) });
  const usados = new Set(efeitos.map((e) => e.tipo).filter(Boolean));
  const encantaveis = (fa.encantamentos ?? [])
    .filter((x) => !ENCANTAMENTOS_SEM_MELHORIA.includes(x.id))
    .map((x) => ({ value: x.id, label: x.enc?.nome ?? x.id }));
  const vinculado = fa.feiticoVinculado;

  return (
    <div className="rounded-lg border border-purple-900/40 bg-purple-950/10 px-2.5 py-2.5 space-y-2.5">
      <BoolChip ativo={!!receita.ligada} onToggle={() => patch({ ligada: !receita.ligada })} title={TEXTO_ENCANTAMENTO.abertura}>
        Conta do Guia
      </BoolChip>

      {receita.ligada && (
        <>
          {(fa.guiaEfeitos ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {fa.guiaEfeitos.map((l, i) => (
                <span
                  key={`${l.canal}:${l.alvo}:${i}`}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                    l.valor < 0 ? "bg-rose-950/40 text-rose-300" : "bg-slate-800/70 text-slate-300"
                  }`}
                >
                  {rotuloDaLinha(l)} {sinal(Number(l.valor) || 0)}
                </span>
              ))}
            </div>
          )}

          {(fa.guiaAvisos ?? []).length > 0 && (
            <ul className="space-y-0.5">
              {fa.guiaAvisos.map((a) => (
                <li key={a.id} className="text-[11px] text-amber-400 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" /> {a.texto}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5">
            {efeitos.map((e, i) => {
              const opcoes = efeitosDoEncantamento().filter((o) => o.value === e.tipo || !usados.has(o.value));
              const ehMelhorar = e.tipo === EFEITO_MELHORAR;
              return (
                <div key={i} className="rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-300">{`Efeito ${i + 1}`}</span>
                    <button
                      type="button"
                      onClick={() => patch({ efeitos: efeitos.filter((_, j) => j !== i) })}
                      className="ml-auto w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-300 hover:bg-rose-950/40"
                      title="Tirar este efeito"
                      aria-label={`Tirar o efeito ${i + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <Select
                      value={e.tipo}
                      onChange={(v) => patchEfeito(i, { tipo: v, alvo: "" })}
                      options={opcoes}
                      placeholder="Efeito"
                      aria-label={`Tipo do efeito ${i + 1}`}
                    />
                    {!ehMelhorar && e.tipo && (
                      <Select
                        value={e.atributo}
                        onChange={(v) => patchEfeito(i, { atributo: v })}
                        options={ATRIBUTOS}
                        placeholder="Atributo"
                        aria-label={`Atributo do efeito ${i + 1}`}
                      />
                    )}
                    {!ehMelhorar && (
                      <AlvoDoTipo tipo={e.tipo} valor={e.alvo} onChange={(v) => patchEfeito(i, { alvo: v })} rotulo={`Alvo do efeito ${i + 1}`} />
                    )}
                    {ehMelhorar && (
                      <Select
                        value={e.encantamento}
                        onChange={(v) => patchEfeito(i, { encantamento: v })}
                        options={encantaveis}
                        placeholder="Encantamento"
                        aria-label={`Encantamento do efeito ${i + 1}`}
                      />
                    )}
                    {ehMelhorar && (
                      <div className="flex flex-wrap gap-1.5" title={TEXTO_ENCANTAMENTO.melhorar}>
                        {MODOS_MELHORAR.map((m) => (
                          <BoolChip key={m.value} ativo={e.modo === m.value} onToggle={() => patchEfeito(i, { modo: m.value })}>
                            {m.label}
                          </BoolChip>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* O primeiro efeito vale cheio. Cada efeito a mais escolhe entre a
                      divisão e a penalidade de metade do BT (autor, 2026-09-14). */}
                  {i > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-1.5 items-center" title={TEXTO_ENCANTAMENTO.divisao}>
                      <div className="flex flex-wrap gap-1.5">
                        <BoolChip ativo={!e.penalidade} onToggle={() => patchEfeito(i, { penalidade: null })}>Dividir</BoolChip>
                        <BoolChip
                          ativo={!!e.penalidade}
                          onToggle={() => patchEfeito(i, { penalidade: e.penalidade ?? { tipo: "", alvo: "", atributo: "" } })}
                        >
                          Penalidade
                        </BoolChip>
                      </div>
                      {e.penalidade && (
                        <Select
                          value={e.penalidade.tipo}
                          onChange={(v) => patchEfeito(i, { penalidade: { ...e.penalidade, tipo: v, alvo: "" } })}
                          options={INTERACOES_OK.map((l) => ({ value: l.id, label: l.label }))}
                          placeholder="Penalidade em"
                          aria-label={`Penalidade do efeito ${i + 1}`}
                        />
                      )}
                      {e.penalidade && LINHA[e.penalidade.tipo]?.alvo && (
                        <AlvoDoTipo
                          tipo={e.penalidade.tipo}
                          valor={e.penalidade.alvo}
                          onChange={(v) => patchEfeito(i, { penalidade: { ...e.penalidade, alvo: v } })}
                          rotulo={`Alvo da penalidade do efeito ${i + 1}`}
                        />
                      )}
                      {e.penalidade?.tipo === "periciaGrupo" && (
                        <Select
                          value={e.penalidade.atributo}
                          onChange={(v) => patchEfeito(i, { penalidade: { ...e.penalidade, atributo: v } })}
                          options={ATRIBUTOS}
                          placeholder="Atributo"
                          aria-label={`Atributo da penalidade do efeito ${i + 1}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => patch({ efeitos: [...efeitos, { tipo: "", atributo: "", alvo: "", penalidade: null }] })}
              title={TEXTO_ENCANTAMENTO.semRepetir}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              Efeito
            </button>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Técnica Inata</FieldLabel>
            <Select
              value={receita.feitico}
              onChange={(v) => patch({ feitico: v })}
              options={feiticos.filter((f) => f?.id).map((f) => ({ value: f.id, label: f.nome || "Feitiço sem Nome" }))}
              placeholder="Nenhum Feitiço"
              aria-label="Feitiço da Técnica Inata"
            />
            {vinculado && (
              <div className="flex flex-wrap gap-1" title={TEXTO_TECNICA_INATA.feitico}>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300 font-mono">
                  {vinculado.usos} {vinculado.usos === 1 ? "Uso" : "Usos"}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300" title={TEXTO_TECNICA_INATA.conjurar}>
                  Ação de Conjurar
                </span>
                {vinculado.tipo === "auxiliar" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300" title={TEXTO_TECNICA_INATA.auxiliar}>
                    Duradouro, {vinculado.usos} {vinculado.usos === 1 ? "Rodada" : "Rodadas"}
                  </span>
                )}
              </div>
            )}
            {(vinculado?.avisos ?? []).length > 0 && (
              <ul className="space-y-0.5">
                {vinculado.avisos.map((a) => (
                  <li key={a.id} className="text-[11px] text-amber-400 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" /> {a.texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
