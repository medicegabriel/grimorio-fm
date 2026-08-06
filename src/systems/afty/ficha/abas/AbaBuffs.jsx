import React, { useMemo, useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";

import { COMBATE_ESTADOS } from "../../afty-combate";
import { CONDICOES_CATALOGO } from "../../afty-feiticos";
import { getCanal } from "../../afty-efeitos";
import CanalPicker from "../CanalPicker";

/**
 * ============================================================
 * ABA BUFFS — o que está ligado agora
 * ============================================================
 * Três camadas, na mesma tela e nesta ordem:
 *
 *   1. CATALOGADOS  os estados que o sistema já conhece (`COMBATE_ESTADOS`).
 *      Nada disso precisou ser construído: cada estado já é variável do DSL e o
 *      `quando` de cada habilidade liga e desliga sozinho desde 2026-07-28.
 *   2. AD-HOC       "+2 de Defesa por 3 rodadas", escrito na hora. É uma linha
 *      do Motor com duração, no mesmo shape do Funcionamento Básico.
 *   3. CONDIÇÕES    marcadores com duração.
 *
 * ⚠ AS CONDIÇÕES SÃO SÓ MARCADORES, e isso é honestidade e não preguiça: o
 * `CONDICOES_CATALOGO` tem as 26 condições em quatro forças, e NENHUMA tem
 * efeito mecânico modelado no Afty. Marcar "Cego" e inventar um -4 seria número
 * saído do nada. Qualquer número que a condição imponha entra como buff ad-hoc,
 * que é onde ele fica visível e rastreável. Ver a pergunta D6.
 * ============================================================
 */

const TODAS_CONDICOES = Object.entries(CONDICOES_CATALOGO)
  .flatMap(([forca, nomes]) => nomes.map((nome) => ({ nome, forca })));

function Secao({ titulo, children, direita }) {
  return (
    <section className="afty-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="afty-card-titulo flex-1">{titulo}</h2>
        {direita}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

/* Uma linha do catálogo de estados. `delta` é o que ligar este estado muda na
   ficha, calculado por fora (ver `deltaDosEstados`). */
function LinhaEstado({ estado, valor, delta, opcoes, onPatch, derived }) {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  return (
    <div className="afty-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{estado.label}</span>

      {delta.length > 0 && (
        <span className="flex items-center gap-1 flex-wrap justify-end">
          {delta.map((d) => (
            <span key={d.rotulo} className="afty-chip" data-afty-tom="destaque">
              {d.rotulo} {d.texto}
            </span>
          ))}
        </span>
      )}

      {estado.tipo === "bool" ? (
        <button
          type="button"
          className="afty-botao"
          data-afty-tom={valor ? "destaque" : undefined}
          aria-pressed={!!valor}
          onClick={() => onPatch({ [estado.id]: !valor })}
        >
          {valor ? "Ativa" : "Inativa"}
        </button>
      ) : estado.tipo === "opcao" ? (
        <span className="flex items-center gap-1 flex-wrap justify-end">
          {opcoes.map((o) => (
            <button
              key={o.id}
              type="button"
              className="afty-botao"
              data-afty-tom={valor === o.id ? "destaque" : undefined}
              aria-pressed={valor === o.id}
              onClick={() => onPatch({ [estado.id]: valor === o.id ? null : o.id })}
            >
              {o.label}
            </button>
          ))}
        </span>
      ) : (
        <span className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button" className="afty-passo"
            onClick={() => onPatch({ [estado.id]: Math.max(estado.min ?? 0, (valor || 0) - 1) })}
            aria-label={`${estado.label} menos 1`}
          >
            −
          </button>
          <span className="afty-valor text-[13px] w-8 text-center">{valor || 0}</span>
          <button
            type="button" className="afty-passo"
            onClick={() => onPatch({ [estado.id]: Math.min(teto ?? 0, (valor || 0) + 1) })}
            aria-label={`${estado.label} mais 1`}
          >
            +
          </button>
        </span>
      )}
    </div>
  );
}

/* O formulário do buff ad-hoc. Reusa o vocabulário do Motor: canal, alvo
   opcional e uma expressão do DSL (que na prática costuma ser só um número). */
function NovoBuff({ onCriar }) {
  const [nome, setNome] = useState("");
  const [canal, setCanal] = useState("defesa");
  const [expr, setExpr] = useState("");
  const [rodadas, setRodadas] = useState("");

  const def = getCanal(canal);
  const cria = () => {
    const valor = expr.trim();
    if (!valor) return;
    onCriar({
      id: `buff_${Date.now().toString(36)}`,
      nome: nome.trim() || def?.label || "Buff",
      canal,
      expr: valor,
      rodadas: rodadas.trim() ? Math.max(1, Math.trunc(Number(rodadas)) || 1) : null,
    });
    setNome(""); setExpr(""); setRodadas("");
  };

  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5 flex-wrap">
      <input
        type="text" value={nome} onChange={(e) => setNome(e.target.value)}
        placeholder="Nome" aria-label="Nome do buff"
        className="afty-campo bg-transparent outline-none flex-1 min-w-[6rem]"
      />
      {/* ⚠ Era um `<select>` com os canais numa lista corrida, e o autor pediu o
          do Motor em 2026-08-06: são dezenas de canais, e o nativo os despeja
          num tubo sem grupo nenhum. Ver `CanalPicker`. */}
      <CanalPicker value={canal} onChange={setCanal} />
      <input
        type="text" value={expr} onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="+2" aria-label="Valor ou expressão"
        className="afty-campo bg-transparent outline-none w-16 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <input
        type="text" inputMode="numeric" value={rodadas} onChange={(e) => setRodadas(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="∞" aria-label="Duração em rodadas"
        className="afty-campo bg-transparent outline-none w-12 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <button type="button" className="afty-botao" onClick={cria} aria-label="Adicionar o buff">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AbaBuffs({
  derived, sessao, onPatchCombate, onBuffs, onCondicoes, deltaPorEstado,
}) {
  const combate = derived.combate ?? {};
  const [novaCondicao, setNovaCondicao] = useState("");

  /* Os estados que ESTA criatura alcança. Mesma filtragem da bancada do
     criador: quem não pegou a habilidade não vê a linha.

     ⚠ As listas são lidas DENTRO do memo, e não fora: `derived.x ?? []` cria um
     array novo a cada render, e como dependência ele invalidaria o memo sempre.
     Depender do `derived` inteiro é o certo, porque é ele que muda de verdade. */
  const linhas = useMemo(() => {
    const escolhidas = derived.habilidades?.escolhidas ?? [];
    const talentos = derived.talentos?.escolhidas ?? [];
    const aptidoes = derived.aptidoesEscolhidas ?? [];
    const opcoesEscolhidas = Object.values(derived.habilidades?.escolhas?.mapa ?? {}).flat();
    const temHabilidade = (req) =>
      (Array.isArray(req) ? req : [req]).some((id) => escolhidas.includes(id));
    const opcoesDe = (e) => (e.opcoes ?? [])
      .filter((o) => !o.requerEscolha || opcoesEscolhidas.includes(o.requerEscolha));
    return [
      ...COMBATE_ESTADOS.filter((e) => {
        const temDono = e.requerEscolha ? opcoesEscolhidas.includes(e.requerEscolha)
          : e.requerTalento ? talentos.includes(e.requerTalento)
          : e.requerAptidao ? aptidoes.includes(e.requerAptidao)
          : temHabilidade(e.requerHabilidade);
        return temDono && (e.tipo !== "opcao" || opcoesDe(e).length > 0);
      }),
      ...(derived.combate?.estadosExtras ?? []).map((e) => ({ ...e, tipo: "bool" })),
    ].map((e) => ({ ...e, opcoesVisiveis: opcoesDe(e) }));
  }, [derived]);

  const visivel = (e) => !e.requerEstado || combate[e.requerEstado];
  const buffs = sessao.buffs ?? [];
  const condicoes = sessao.condicoes ?? [];

  return (
    <div className="space-y-3">
      {/* ---------- catalogados ---------- */}
      {linhas.length > 0 && (
        <Secao
          titulo="Estados"
          direita={
            <button
              type="button"
              className="afty-botao"
              data-afty-tom={combate.ativo ? "destaque" : undefined}
              aria-pressed={!!combate.ativo}
              onClick={() => onPatchCombate({ ativo: !combate.ativo })}
            >
              Em Combate
            </button>
          }
        >
          {/* ⚠ Fora de combate TUDO zera, e é por isso que a lista fica apagada
              em vez de sumir: o jogador precisa ver o que existe para saber que
              tem de entrar em combate primeiro. */}
          <div className={combate.ativo ? "space-y-1" : "space-y-1 opacity-40 pointer-events-none"}>
            {linhas.filter(visivel).map((e) => (
              <LinhaEstado
                key={e.id}
                estado={e}
                valor={combate[e.id]}
                opcoes={e.opcoesVisiveis}
                delta={deltaPorEstado[e.id] ?? []}
                onPatch={onPatchCombate}
                derived={derived}
              />
            ))}
          </div>
        </Secao>
      )}

      {/* ---------- ad-hoc ---------- */}
      <Secao titulo="Buffs">
        {buffs.map((b) => (
          <div key={b.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{b.nome}</span>
            <span className="afty-rotulo text-[10px] truncate">{getCanal(b.canal)?.label ?? b.canal}</span>
            <span className="afty-valor text-[12px]">{b.expr}</span>
            {b.rodadas != null && (
              <span className="afty-chip" title="Rodadas restantes">{b.rodadas}</span>
            )}
            <button
              type="button" className="afty-passo"
              onClick={() => onBuffs(buffs.filter((x) => x.id !== b.id))}
              aria-label={`Remover ${b.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <NovoBuff onCriar={(b) => onBuffs([...buffs, b])} />
      </Secao>

      {/* ---------- condições ---------- */}
      <Secao titulo="Condições">
        {condicoes.map((c) => (
          <div key={c.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{c.nome}</span>
            <span className="afty-chip">{c.forca}</span>
            {c.rodadas != null && <span className="afty-chip">{c.rodadas}</span>}
            <button
              type="button" className="afty-passo"
              onClick={() => onCondicoes(condicoes.filter((x) => x.id !== c.id))}
              aria-label={`Remover ${c.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5">
          <select
            value={novaCondicao}
            onChange={(e) => setNovaCondicao(e.target.value)}
            aria-label="Condição"
            className="afty-campo bg-transparent outline-none flex-1 min-w-0"
            style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "2px 4px" }}
          >
            <option value="" style={{ background: "var(--afty-card)" }}>Escolher</option>
            {TODAS_CONDICOES.map((c) => (
              <option key={c.nome} value={c.nome} style={{ background: "var(--afty-card)" }}>{c.nome}</option>
            ))}
          </select>
          <button
            type="button"
            className="afty-botao"
            disabled={!novaCondicao}
            onClick={() => {
              const def = TODAS_CONDICOES.find((c) => c.nome === novaCondicao);
              if (!def) return;
              onCondicoes([...condicoes, {
                id: `cond_${Date.now().toString(36)}`, nome: def.nome, forca: def.forca, rodadas: null,
              }]);
              setNovaCondicao("");
            }}
            aria-label="Adicionar a condição"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {condicoes.length > 0 && (
          <div className="afty-chip mt-1" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Condição não muda número, resolve na mesa
          </div>
        )}
      </Secao>
    </div>
  );
}
