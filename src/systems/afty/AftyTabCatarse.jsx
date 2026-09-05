/**
 * ============================================================
 * ABA LOJA DE CATARSE — a moeda da mesa, e o que ela comprou
 * ============================================================
 * Pedido do autor em 2026-09-04. O modelo e a resolução ficam em
 * `afty-catarse.js`, e esta tela só desenha o que ele devolve.
 *
 * ⚠ ARQUIVO PRÓPRIO, pelo mesmo motivo das abas Addons e Defesas: o
 * `AftyCreatureBuilder.jsx` passou das 14 mil linhas e o Babel já reclama do
 * tamanho ao processá-lo.
 *
 * ------------------------------------------------------------
 * A ABA SÓ EXISTE COM O ADDON
 * ------------------------------------------------------------
 * Ela é uma PRIMITIVA (`permite: ["catarse"]`), e não conteúdo de catálogo. O
 * portão é `usePrimitiva("catarse")`, lido no `AftyCreatureBuilder`, e a razão
 * está escrita em docs/afty-addons.md: em 2026-08-20 a Concessão do Mestre
 * vazou para a tela de todo mundo porque o verbo foi ao motor e ninguém disse
 * quem o enxerga. *"acrescentar o verbo ao motor não é a tarefa inteira."*
 *
 * ------------------------------------------------------------
 * O QUE A TELA DEIXA MEXER, E O QUE ELA SÓ MOSTRA
 * ------------------------------------------------------------
 *   EDITÁVEL — o saldo ganho, e cada linha de compra (família, nome, custo, e
 *              para a anotação o texto e os efeitos).
 *   DERIVADO — o gasto, o restante e as vagas abertas, que saem do
 *              `resolveCatarse` e nunca são digitados.
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>` e nunca o caractere. Explicação de item
 * vai no `title`.
 * ============================================================
 */

import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Card } from "./ui/primitivos";
import { CATARSE_FAMILIAS, getCatarseFamilia, createBlankCompraCatarse } from "./afty-catarse";

/* ============================================================ */
/* A FAIXA DE SALDO                                              */
/* ============================================================ */
/* Grudada no topo, como a barra de resultado da Invocação: ela é o número que a
   pessoa consulta a cada linha que acrescenta. */
function FaixaDeSaldo({ extrato, saldo, onSaldo }) {
  // `gasto`, `restante` e `excedeu` são DERIVADOS. O `saldo` é o que a pessoa
  // digita, e por isso vem do rascunho: ver a nota do `TabCatarse`.
  const { gasto, restante, excedeu } = extrato;
  return (
    <div
      className="sticky z-10 -mx-3 px-3 py-2 mb-3 bg-slate-950/95 backdrop-blur border-b border-slate-800"
      style={{ top: "var(--afty-topo, 0px)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* ⚠ AS SETINHAS SAEM DOS DOIS CAMPOS DESTA ABA, e é a mesma correção
            que a aba de Defesas levou em 2026-09-05: um `input[type=number]`
            reserva ~15px à direita para os botões de subir e descer, mesmo sem
            desenhá-los, e com `text-right` o número é empurrado para longe da
            borda por essa faixa invisível. Aqui isso abria um vão entre o número
            e a borda da cápsula. As três utilidades são as mesmas do
            `builder-controls.jsx` da 2.5.2. */}
        <label className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md border border-slate-800 bg-slate-950/70">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Ganhas</span>
          <input
            type="number"
            min="0"
            value={saldo}
            onChange={(e) => onSaldo(e.target.value)}
            className="w-14 bg-transparent font-mono text-[13px] font-bold tabular-nums text-white text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </label>
        <span className="inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md border border-slate-800 bg-slate-950/70">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Gastas</span>
          <b className="font-mono text-[13px] font-bold tabular-nums text-white">{gasto}</b>
        </span>
        <span className={`inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md border ${
          excedeu ? "border-rose-800 bg-rose-950/40" : "border-slate-800 bg-slate-950/70"
        }`}>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Restam</span>
          <b className={`font-mono text-[13px] font-bold tabular-nums ${excedeu ? "text-rose-300" : "text-purple-300"}`}>
            {restante}
          </b>
        </span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* UMA LINHA DE EFEITO DA ANOTAÇÃO                               */
/* ============================================================ */
/* ⚠ O CANAL E A EXPRESSÃO SÃO CAMPOS DE TEXTO CRU, e isso é o mínimo honesto
   para a base. O criador tem `CanalPicker` e o seletor de variáveis do DSL, que
   são a experiência de verdade, e ligá-los aqui é o próximo passo natural desta
   aba. Enquanto não estiverem, o campo aceita o que o Motor aceita, e uma
   expressão inválida cai no fallback do DSL em vez de derrubar a ficha. */
function LinhaDeEfeito({ efeito, onPatch, onRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        value={efeito.canal ?? ""}
        onChange={(e) => onPatch({ canal: e.target.value })}
        placeholder="canal"
        title="O canal do Motor que este efeito escreve"
        className="w-32 px-2 py-1 rounded border border-slate-800 bg-slate-950/70 text-[11px] font-mono text-slate-200 outline-none focus:border-purple-700"
      />
      <input
        value={efeito.expr ?? ""}
        onChange={(e) => onPatch({ expr: e.target.value })}
        placeholder="expressão"
        title="A expressão do Motor de Automação"
        className="flex-1 min-w-[8rem] px-2 py-1 rounded border border-slate-800 bg-slate-950/70 text-[11px] font-mono text-slate-200 outline-none focus:border-purple-700"
      />
      <input
        value={efeito.alvo ?? ""}
        onChange={(e) => onPatch({ alvo: e.target.value })}
        placeholder="alvo"
        title="Alvo do canal, quando ele aceita um"
        className="w-24 px-2 py-1 rounded border border-slate-800 bg-slate-950/70 text-[11px] font-mono text-slate-200 outline-none focus:border-purple-700"
      />
      <button
        type="button"
        onClick={onRemove}
        title="Remover este efeito"
        className="p-1 rounded border border-slate-800 text-slate-500 hover:border-rose-800 hover:text-rose-300"
      >
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ============================================================ */
/* UMA COMPRA                                                    */
/* ============================================================ */
function CardDeCompra({ compra, precos, onPatch, onRemove }) {
  const familia = getCatarseFamilia(compra.familia);
  const ehTexto = compra.familia === "texto";
  const efeitos = Array.isArray(compra.efeitos) ? compra.efeitos : [];
  const patchEfeito = (i, campo) => onPatch({
    efeitos: efeitos.map((e, k) => (k === i ? { ...e, ...campo } : e)),
  });
  return (
    <div className="p-2.5 rounded-md border border-slate-800 bg-slate-950/50 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* ⚠ A NOTA DA FAMÍLIA VAI NO `title`, e nunca na tela. A primeira
            versão desta aba a desenhava como uma linha de texto embaixo de cada
            compra, e isso é exatamente o "texto explicativo na UI" que a regra
            do autor proíbe: só resultado e aviso. */}
        <select
          value={compra.familia}
          title={familia?.nota || familia?.label}
          onChange={(e) => {
            const nova = e.target.value;
            /* O preço da tabela entra ao TROCAR de família, e não a cada
               tecla: ele é sugestão, e sobrescrever um custo já digitado
               apagaria a decisão de quem negociou outro valor com o mestre. */
            const sugerido = precos?.[nova];
            onPatch({ familia: nova, ...(sugerido != null ? { custo: sugerido } : {}) });
          }}
          className="px-2 py-1 rounded border border-slate-800 bg-slate-950/70 text-[11px] text-slate-200 outline-none focus:border-purple-700"
        >
          {CATARSE_FAMILIAS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <input
          value={compra.nome ?? ""}
          onChange={(e) => onPatch({ nome: e.target.value })}
          placeholder="Nome"
          className="flex-1 min-w-[8rem] px-2 py-1 rounded border border-slate-800 bg-slate-950/70 text-[12px] text-slate-200 outline-none focus:border-purple-700"
        />
        <label className="inline-flex items-baseline gap-1 px-2 py-1 rounded border border-slate-800 bg-slate-950/70">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Custo</span>
          <input
            type="number"
            min="0"
            value={compra.custo ?? 0}
            onChange={(e) => onPatch({ custo: e.target.value })}
            className="w-12 bg-transparent font-mono text-[12px] tabular-nums text-white text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          title="Remover esta compra"
          className="p-1 rounded border border-slate-800 text-slate-500 hover:border-rose-800 hover:text-rose-300"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {ehTexto && (
        <>
          <textarea
            value={compra.texto ?? ""}
            onChange={(e) => onPatch({ texto: e.target.value })}
            rows={2}
            placeholder="A regra, como ela foi escrita"
            className="w-full px-2 py-1 rounded border border-slate-800 bg-slate-950/70 text-[12px] text-slate-200 outline-none focus:border-purple-700 resize-y"
          />
          <div className="space-y-1.5">
            {efeitos.map((ef, i) => (
              <LinhaDeEfeito
                key={i}
                efeito={ef}
                onPatch={(campo) => patchEfeito(i, campo)}
                onRemove={() => onPatch({ efeitos: efeitos.filter((_, k) => k !== i) })}
              />
            ))}
            <button
              type="button"
              onClick={() => onPatch({ efeitos: [...efeitos, { canal: "", expr: "" }] })}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-800 text-[11px] text-slate-400 hover:border-purple-700 hover:text-purple-300"
            >
              <Plus className="w-3 h-3" aria-hidden="true" /> Efeito
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================ */
/* A ABA                                                         */
/* ============================================================ */
/* ⚠ A LISTA EDITÁVEL SAI DO `draft`, E NUNCA DO `derived`. Custou o primeiro
   defeito desta aba, em 2026-09-04, e ele era total: *"O Motor de Automação da
   aba de Catarse não está funcionando"*.

   A primeira versão desenhava as linhas a partir de `derived.catarse.compras`,
   que é a lista JÁ SANEADA. O `normalizaCompraCatarse` descarta efeito sem
   canal, e com razão (efeito sem canal não é efeito). Só que a linha que o
   botão "+ Efeito" cria nasce exatamente assim, vazia: ela entrava no rascunho,
   o derive a descartava, e a aba re-renderizava sem ela. **A linha sumia antes
   de dar tempo de digitar o canal**, então o Motor nunca recebia nada. Da tela,
   isso é "o botão não faz nada".

   A regra que sai daí vale para toda aba deste criador, e as outras já a
   seguem (a de Invocações lê `draft.invocacoes` para a lista e
   `derived.invocacoes.lista` para os números):

     EDITAR sai do rascunho. MOSTRAR NÚMERO sai do derivado.

   Um saneador entre o campo e o campo de volta come todo estado intermediário,
   e estado intermediário é o que digitar é. */
export default function TabCatarse({ draft, derived, patchCatarse }) {
  const extrato = derived.catarse ?? { ganho: 0, gasto: 0, restante: 0, compras: [], mortas: [], avisos: [], porCanal: {}, precos: {} };
  const compras = Array.isArray(draft?.catarse?.compras) ? draft.catarse.compras : [];
  // O saldo também vem do rascunho: apagar o campo para digitar outro número
  // passa por "" , e o derivado devolveria 0 no meio da digitação.
  const saldo = draft?.catarse?.saldo ?? 0;

  const patchCompra = (id, campo) => patchCatarse({
    compras: compras.map((c) => (c.id === id ? { ...c, ...campo } : c)),
  });

  return (
    <Card title="Loja de Catarse">
      <FaixaDeSaldo extrato={extrato} saldo={saldo} onSaldo={(v) => patchCatarse({ saldo: v })} />

      {extrato.avisos.length > 0 && (
        <div className="mb-3 space-y-1">
          {extrato.avisos.map((a, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {/* ⚠ A LINHA MORTA APARECE RISCADA, e o gasto dela continua contando.
            Some só quando a pessoa a remover, porque sumir sozinha devolveria
            Catarse sem ninguém pedir. É a mesma regra da concessão órfã.

            Ela é decidida AQUI, pelo rascunho, e não lida da lista `mortas` do
            derivado: as duas listas do derivado (viva e morta) não conseguem
            reconstruir a ORDEM em que as compras estão na ficha, e uma linha
            órfã no meio saltaria para o fim. */}
        {compras.map((c) => (
          getCatarseFamilia(c.familia) ? (
            <CardDeCompra
              key={c.id}
              compra={c}
              precos={extrato.precos}
              onPatch={(campo) => patchCompra(c.id, campo)}
              onRemove={() => patchCatarse({ compras: compras.filter((x) => x.id !== c.id) })}
            />
          ) : (
            <div key={c.id} className="p-2.5 rounded-md border border-slate-800 bg-slate-950/50 flex items-center gap-2">
              <span className="flex-1 min-w-0 text-[12px] text-slate-500 line-through truncate" title={`Família desconhecida: ${c.familia ?? "?"}`}>
                {c.nome || "Compra sem família"}
              </span>
              <span className="font-mono text-[12px] tabular-nums text-slate-500">{Math.max(0, Math.trunc(Number(c.custo) || 0))}</span>
              <button
                type="button"
                onClick={() => patchCatarse({ compras: compras.filter((x) => x.id !== c.id) })}
                title="Remover esta compra"
                className="p-1 rounded border border-slate-800 text-slate-500 hover:border-rose-800 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )
        ))}

        <button
          type="button"
          onClick={() => {
            const nova = createBlankCompraCatarse();
            const sugerido = extrato.precos?.[nova.familia];
            patchCatarse({ compras: [...compras, { ...nova, custo: sugerido ?? 0 }] });
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-800 text-[12px] text-slate-300 hover:border-purple-700 hover:text-purple-300"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Compra
        </button>
      </div>
    </Card>
  );
}
