import React, { useMemo, useState } from "react";
import { Plus, X, AlertTriangle, Search } from "lucide-react";

import { FAMILIAS_CONCESSAO } from "../afty-concessao";

/**
 * ============================================================
 * CONCEDIDO PELO MESTRE — a primitiva 8.3 dos Addons
 * ============================================================
 * O mestre acrescenta uma entrada de catálogo na criatura no meio da luta, e
 * ela passa a valer na hora, já calculada. O caso que pediu isto é o *Ciclo de
 * Adaptação*, do Mahoraga. Ver `docs/afty-addons.md` seção 8.3.
 *
 * ⚠ AS TRÊS DECISÕES DO AUTOR (2026-08-20) APARECEM AQUI ASSIM:
 *
 *   • **nos dois lugares** → este painel é UM componente, usado pela Ficha
 *     Final e pelo painel de combatente do Encontro. Mesma peça, dois donos;
 *   • **de graça** → não existe medidor de orçamento nesta tela, porque não há
 *     orçamento nenhum a mostrar. Quem garante isso é o motor, e não a tela;
 *   • **morre com a sessão** → o que entra aqui vive em `sessao.concedido`, e
 *     nada disto encosta na ficha salva.
 *
 * ⚠ O CONCEDIDO FICA VISÍVEL, e isso não é enfeite: a criatura na mesa passa a
 * ser diferente da criatura no papel, e ninguém pode se confundir sobre qual
 * está lendo.
 *
 * ⚠ PRÉ-REQUISITO NÃO É COBRADO, de propósito. O Ciclo de Adaptação concede
 * justamente o que a criatura não alcançaria comprando, e cobrar o requisito
 * mataria a primitiva. A busca abaixo lista o catálogo inteiro da família.
 * ============================================================
 */

/** Quantos resultados a busca mostra. Acima disto, refine. */
const MAX_RESULTADOS = 40;

const normaliza = (s) => String(s ?? "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "");

export default function PainelDeConcessao({ concedido = [], onConceder, onRemover }) {
  const [familiaId, setFamiliaId] = useState(FAMILIAS_CONCESSAO[0].id);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  const familia = useMemo(
    () => FAMILIAS_CONCESSAO.find((f) => f.id === familiaId) ?? FAMILIAS_CONCESSAO[0],
    [familiaId],
  );

  /* ⚠ O catálogo é lido a cada busca, e não uma vez: um addon pode ter entrado
     depois de a tela montar, e o `aplicarAddons` reescreve a lista no lugar. */
  const resultados = useMemo(() => {
    const alvo = normaliza(busca).trim();
    const lista = familia.catalogo() ?? [];
    const casa = alvo
      ? lista.filter((e) => normaliza(e.nome).includes(alvo) || normaliza(e.id).includes(alvo))
      : lista;
    return casa.slice(0, MAX_RESULTADOS);
  }, [familia, busca]);

  const sobrando = Math.max(0, (familia.catalogo()?.length ?? 0) - resultados.length);
  const mortas = concedido.filter((c) => c.morta).length;

  return (
    <section className="afty-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="afty-card-titulo flex-1">Concedido pelo Mestre</h2>
        {concedido.length > 0 && <span className="afty-chip">{concedido.length}</span>}
        <button
          type="button"
          className="afty-botao"
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? "Fechar a busca" : "Conceder"}
          aria-expanded={aberto}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        {concedido.map((c) => (
          <div key={c.uid} className="afty-linha px-2.5 py-2 flex items-center gap-1.5">
            <span
              className="flex-1 min-w-0 truncate"
              style={c.morta ? { textDecoration: "line-through", opacity: 0.6 } : undefined}
              title={c.morta ? c.id : undefined}
            >
              {c.nome}
            </span>
            <span className="afty-chip">{c.rotuloFamilia}</span>
            {c.morta && (
              <span className="afty-chip" data-afty-tom="aviso" title={c.id}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                Sem Addon
              </span>
            )}
            <button
              type="button"
              className="afty-passo"
              onClick={() => onRemover(c.uid)}
              aria-label={`Remover ${c.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {aberto && (
          <>
            <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5">
              <select
                value={familiaId}
                onChange={(e) => setFamiliaId(e.target.value)}
                aria-label="Família"
                className="afty-campo bg-transparent outline-none min-w-0"
                style={{
                  border: "1px solid var(--afty-borda)",
                  borderRadius: "var(--afty-raio-peq)",
                  padding: "2px 4px",
                }}
              >
                {FAMILIAS_CONCESSAO.map((f) => (
                  <option key={f.id} value={f.id} style={{ background: "var(--afty-card)" }}>
                    {f.rotulo}
                  </option>
                ))}
              </select>
              <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar"
                className="afty-campo bg-transparent outline-none flex-1 min-w-0"
                style={{
                  border: "1px solid var(--afty-borda)",
                  borderRadius: "var(--afty-raio-peq)",
                  padding: "2px 4px",
                }}
              />
            </div>

            <div className="space-y-1" style={{ maxHeight: "14rem", overflowY: "auto" }}>
              {resultados.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="afty-linha px-2.5 py-2 flex items-center gap-1.5 w-full text-left"
                  onClick={() => onConceder(familia.id, e.id)}
                  title={e.id}
                >
                  <span className="flex-1 min-w-0 truncate">{e.nome}</span>
                  <Plus className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                </button>
              ))}
              {resultados.length === 0 && (
                <div className="afty-linha px-2.5 py-2">Nada Encontrado</div>
              )}
            </div>

            {sobrando > 0 && <div className="afty-chip mt-1">Mais {sobrando}</div>}
          </>
        )}

        {mortas > 0 && (
          <div className="afty-chip mt-1" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            {mortas === 1 ? "1 Concessão Sem Addon" : `${mortas} Concessões Sem Addon`}
          </div>
        )}
      </div>
    </section>
  );
}
