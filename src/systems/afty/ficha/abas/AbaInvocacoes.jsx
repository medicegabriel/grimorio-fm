import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Heart, Shield, Wind } from "lucide-react";

import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { useDestaque } from "../usar-destaque";

/**
 * ============================================================
 * ABA INVOCAÇÕES — as criaturas que a criatura traz
 * ============================================================
 * Elas existiam no criador e nunca chegavam à mesa. Uma Invocação não é uma
 * ação: ela é uma CRIATURA, com PV, Defesa, Deslocamento, testes e ações
 * próprias, e é por isso que ela ganhou aba em vez de virar mais um cartão da
 * aba Ações (que é onde a Expansão de Domínio ficou, porque aquilo É uma ação).
 *
 * ⚠ AS AÇÕES DELA ROLAM, com o acerto e o dano da própria Invocação. É o ponto
 * inteiro: no meio da luta o jogador rola pela Invocação sem sair da Ficha e sem
 * abrir o criador.
 *
 * ⚠ O PV da Invocação NÃO entra na sessão. Ele é o MÁXIMO, e não um recurso
 * gasto: a sessão hoje guarda os recursos do dono, e dar barra própria a cada
 * Invocação sem o descanso saber o que fazer com elas deixaria a ficha com
 * números que ninguém zera. Está anotado como pendência.
 * ============================================================
 */

function Numero({ icone: Icone, rotulo, valor }) {
  return (
    <span className="afty-stat" title={rotulo}>
      <span className="afty-stat-rotulo">
        <Icone className="w-3 h-3 inline-block align-[-2px]" aria-hidden="true" /> {rotulo}
      </span>
      <span className="afty-stat-valor">{valor}</span>
    </span>
  );
}

/**
 * Uma AÇÃO da Invocação.
 *
 * ⚠ O dano vem ESTRUTURADO em `dano.grupos`, e a aba não lê a notação. Ele é uma
 * LISTA porque a escada de dano do Afty tem degraus de dois dados diferentes
 * ("2d12 + 1d6"), e o parser ingênuo que eu tinha escrito antes lia aquilo como
 * três dados de face inválida. Ver `dadosDaNotacao`.
 */
function Acao({ a, nomeDono, rolar }) {
  const grupos = a.dano?.grupos ?? [];
  const temDano = grupos.length > 0;
  const notacao = grupos.map((g) => `${g.dados}d${g.faces}`).join(" + ");
  return (
    <div className="afty-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={a.nome}>
        {a.nome || "Ação Sem Nome"}
      </span>
      {a.warnings?.length > 0 && (
        <AlertTriangle
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "var(--afty-aviso)" }}
          aria-hidden="true"
          title={a.warnings.join("\n")}
        />
      )}
      {a.alcance && <span className="afty-rotulo text-[10px] whitespace-nowrap">{a.alcance}</span>}
      {a.custoPE > 0 && (
        <span className="afty-valor text-[11px]" data-afty-tom="custo">{a.custoPE} PE</span>
      )}
      {a.bonusAtaque != null && a.familia === "ataque" && (
        <span className="afty-rotulo text-[10px] whitespace-nowrap">
          Acerto{" "}
          <NumeroComFontes
            valor={a.bonusAtaque}
            total={sinalDe(a.bonusAtaque)}
            className="afty-valor text-[11px]"
            ancora="direita"
            onRolar={() => rolar({
              tipo: "teste",
              rotulo: `${nomeDono} · ${a.nome || "Ataque"}`,
              bonus: a.bonusAtaque,
            })}
          />
        </span>
      )}
      {temDano && (
        <NumeroComFontes
          valor={`${notacao}${a.dano.bonus ? sinalDe(a.dano.bonus) : ""}`}
          formatar={false}
          className="afty-valor text-[13px] whitespace-nowrap"
          ancora="direita"
          titulo="Dano"
          onRolar={() => rolar({
            tipo: "dano",
            rotulo: `${nomeDono} · ${a.nome || "Dano"}`,
            grupos, fixo: a.dano.bonus ?? 0,
          })}
        />
      )}
    </div>
  );
}

function Invocacao({ inv, rolar, destacado }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useDestaque(destacado);
  const testes = inv.testes ?? {};

  return (
    <section
      ref={raiz}
      id={`afty-item-invocacao:${inv.id}`}
      className="afty-card p-3"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
          onClick={() => setAberto((x) => !x)}
          aria-expanded={aberto}
        >
          {aberto
            ? <ChevronDown className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            : <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
          <span className="afty-card-titulo truncate">{inv.nome || "Invocação Sem Nome"}</span>
        </button>
        {inv.warnings?.length > 0 && (
          <span className="afty-chip" data-afty-tom="aviso" title={inv.warnings.join("\n")}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            {inv.warnings.length}
          </span>
        )}
        <span className="afty-chip" data-afty-tom="destaque">{inv.grauLabel}</span>
        <span className="afty-valor text-[11px]" data-afty-tom="custo" title="Custo em PE">
          {inv.custo} PE
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Numero icone={Heart} rotulo="PV" valor={inv.pv} />
        <Numero icone={Shield} rotulo="Defesa" valor={inv.defesa} />
        <Numero icone={Wind} rotulo="Desloc." valor={`${inv.deslocamento}m`} />
        <span className="afty-stat" title="CD das habilidades dela">
          <span className="afty-stat-rotulo">CD</span>
          <span className="afty-stat-valor">{testes.cd}</span>
        </span>
      </div>

      {aberto && (
        <div className="mt-2 space-y-2">
          {(testes.resistencias ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Testes de Resistência</h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {testes.resistencias.map((r) => (
                  <div key={r.value} className="afty-linha px-2.5 py-1 flex items-center gap-2">
                    <span className="flex-1 min-w-0 text-[12px] truncate">{r.label}</span>
                    {r.mestre && <span className="afty-chip">Mestre</span>}
                    <NumeroComFontes
                      valor={r.bonus}
                      total={sinalDe(r.bonus)}
                      className="afty-valor text-[13px] w-10 text-right"
                      ancora="direita"
                      onRolar={() => rolar({
                        tipo: "teste",
                        rotulo: `${inv.nome || "Invocação"} · ${r.label}`,
                        bonus: r.bonus,
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(inv.acoes ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Ações</h3>
              <div className="space-y-1">
                {inv.acoes.map((a, i) => (
                  <Acao key={`${a.nome}-${i}`} a={a} nomeDono={inv.nome || "Invocação"} rolar={rolar} />
                ))}
              </div>
            </div>
          )}

          {(inv.caracteristicas ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Características</h3>
              <div className="flex flex-wrap gap-1">
                {inv.caracteristicas.map((c, i) => (
                  <span key={`${c.nome}-${i}`} className="afty-chip" title={c.subtipo || undefined}>
                    {c.nome || "Característica"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function AbaInvocacoes({ derived, rolar, destaque }) {
  const invocacoes = derived.invocacoes?.lista ?? [];
  const hordas = derived.hordas?.lista ?? [];
  const cp = derived.invocacoes?.concentrarPoder;

  if (!invocacoes.length && !hordas.length) {
    return (
      <section className="afty-card p-3">
        <p className="afty-vazio">Nenhuma Invocação</p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {/* Concentrar Poder só existe para quem tem a habilidade, e o excesso é um
          aviso e não um bloqueio, igual ao resto do sistema. */}
      {cp?.ativo && (
        <section className="afty-card p-3 flex items-center gap-2 flex-wrap">
          <h2 className="afty-card-titulo flex-1">Concentrar Poder</h2>
          {cp.excedeu && (
            <span className="afty-chip" data-afty-tom="aviso">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              Excedeu
            </span>
          )}
          <span className="afty-valor text-[13px] tabular-nums">{cp.marcadas} / {cp.limite}</span>
        </section>
      )}

      {invocacoes.map((inv) => (
        <Invocacao
          key={inv.id}
          inv={inv}
          rolar={rolar}
          destacado={destaque === `invocacao:${inv.id}`}
        />
      ))}

      {hordas.length > 0 && (
        <section className="afty-card p-3">
          <h2 className="afty-card-titulo mb-2">Hordas</h2>
          <div className="space-y-1">
            {hordas.map((h) => (
              <div key={h.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
                <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">
                  {h.nome || "Horda Sem Nome"}
                </span>
                {h.membros != null && (
                  <span className="afty-rotulo text-[10px] whitespace-nowrap">{h.membros} Membros</span>
                )}
                {h.custo != null && (
                  <span className="afty-valor text-[11px]" data-afty-tom="custo">{h.custo} PE</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
