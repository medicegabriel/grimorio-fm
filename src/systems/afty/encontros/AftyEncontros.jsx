import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Plus, Search, Play, Copy, Trash2, Swords, Flag, Trophy,
  X, AlertTriangle, Folder, Users, Clock,
} from "lucide-react";

import "../ficha/ficha.css";
import "./encontros.css";
import { ENCONTRO_STATUS, STATUS_ORDEM, LADO_ROTULO } from "./afty-encontro";

/**
 * ============================================================
 * PAINEL DE ENCONTROS DO AFTY
 * ============================================================
 * A lista. Portada do `EncountersDashboard` da 2.5.2 com o mesmo layout (busca,
 * filtro de pasta, cartões em grade, ação de abrir / duplicar / apagar) e a
 * mesma máquina de status.
 *
 * ⚠ O QUE FICOU DE FORA da versão da 2.5.2, de propósito: arrastar-e-soltar para
 * reordenar (`@dnd-kit`), seleção múltipla com Shift e o medidor de
 * armazenamento. Os três resolvem o problema de quem tem CENTENAS de encontros
 * salvos, e o Afty começa hoje com zero. Entram quando a lista doer, e não
 * antes: cada um deles é peso que atrapalha uma lista de seis.
 * ============================================================
 */

const STATUS_TEMA = {
  planejando: { rotulo: "Planejando", icone: Flag, tom: undefined, acao: "Abrir" },
  ativo: { rotulo: "Em Combate", icone: Swords, tom: "destaque", acao: "Retomar" },
  finalizado: { rotulo: "Finalizado", icone: Trophy, tom: "aviso", acao: "Ver Resumo" },
};

/* "agora", "12m", "3h", "5d" e daí a data. Um encontro de ontem e um de três
   meses atrás precisam se distinguir de relance. */
const dataRelativa = (ts) => {
  if (!ts) return "—";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

function Cartao({ encontro, pastas, onAbrir, onDuplicar, onApagar, onMover }) {
  const tema = STATUS_TEMA[encontro.status] ?? STATUS_TEMA.planejando;
  const Icone = tema.icone;

  // Quantos de cada lado, para o cartão dizer o TAMANHO da luta sem abrir.
  const porLado = useMemo(() => {
    const conta = {};
    for (const c of encontro.combatentes) {
      conta[c.flags.lado] = (conta[c.flags.lado] ?? 0) + 1;
    }
    return Object.entries(conta);
  }, [encontro.combatentes]);

  return (
    <div className="afty-encontro-card" data-afty-status={encontro.status}>
      <div className="flex items-center gap-2">
        <span className="afty-chip" data-afty-tom={tema.tom}>
          <Icone className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          {tema.rotulo}
        </span>
        <span className="afty-rotulo text-[10px] ml-auto flex-shrink-0" title="Última alteração">
          {dataRelativa(encontro.atualizadoEm)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onAbrir(encontro.id)}
        className="afty-encontro-nome text-left truncate"
      >
        {encontro.nome}
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="afty-rotulo text-[10px] flex items-center gap-1">
          <Users className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          {encontro.combatentes.length}
        </span>
        {porLado.map(([lado, n]) => (
          <span key={lado} className="afty-encontro-lado" data-afty-lado={lado}>
            <span className="afty-encontro-lado-num">{n}</span>
            {LADO_ROTULO[lado]?.toLowerCase() ?? lado}
          </span>
        ))}
        {encontro.status === ENCONTRO_STATUS.ATIVO && (
          <span className="afty-rotulo text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Rodada {encontro.rodada}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          className="afty-botao"
          data-afty-tom={encontro.status === ENCONTRO_STATUS.ATIVO ? "destaque" : undefined}
          onClick={() => onAbrir(encontro.id)}
        >
          <Play className="w-3.5 h-3.5" /> {tema.acao}
        </button>
        <button type="button" className="afty-botao" onClick={() => onDuplicar(encontro.id)} title="Mesma escalação, tudo zerado">
          <Copy className="w-3.5 h-3.5" />
        </button>
        {pastas.length > 0 && (
          <select
            value={encontro.pastaId ?? ""}
            onChange={(e) => onMover(encontro.id, e.target.value || null)}
            aria-label={`Pasta de ${encontro.nome}`}
            className="afty-campo bg-transparent outline-none flex-1 min-w-0"
            style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "3px 4px" }}
          >
            <option value="" style={{ background: "var(--afty-card)" }}>Sem Pasta</option>
            {pastas.map((f) => (
              <option key={f.id} value={f.id} style={{ background: "var(--afty-card)" }}>{f.name}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="afty-passo ml-auto"
          onClick={() => onApagar(encontro)}
          aria-label={`Apagar ${encontro.nome}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ConfirmarApagar({ encontro, onConfirmar, onCancelar }) {
  if (!encontro) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "var(--afty-veu, rgb(0 0 0 / 0.55))" }}
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
      aria-label="Apagar encontro"
    >
      <div className="afty-card p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="afty-card-titulo mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Apagar Encontro?
        </h3>
        <p className="afty-texto mb-4">
          <strong>{encontro.nome}</strong> e os {encontro.combatentes.length} combatente(s) dele somem.
          As criaturas do grimório não são tocadas.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" className="afty-botao" onClick={onCancelar}>Cancelar</button>
          <button type="button" className="afty-botao" data-afty-tom="aviso" autoFocus onClick={onConfirmar}>
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AftyEncontros({ gerenciador, pastas = [], onAbrir, onVoltar }) {
  const [busca, setBusca] = useState("");
  const [pasta, setPasta] = useState("__todas__");
  const [status, setStatus] = useState("__todos__");
  const [aApagar, setAApagar] = useState(null);

  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return gerenciador.encontros.filter((e) => {
      if (pasta === "__sem__" && e.pastaId != null) return false;
      if (pasta !== "__todas__" && pasta !== "__sem__" && String(e.pastaId) !== String(pasta)) return false;
      if (status !== "__todos__" && e.status !== status) return false;
      if (q && !e.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [gerenciador.encontros, busca, pasta, status]);

  /* Em combate primeiro, planejando depois, encerrado por último, e dentro de
     cada grupo o mais recente em cima. A luta que está rolando é a que o mestre
     abre agora, e ela não pode estar no fim de uma lista alfabética. */
  const ordenada = useMemo(() => {
    const peso = { ativo: 0, planejando: 1, finalizado: 2 };
    return [...lista].sort((a, b) => (
      (peso[a.status] ?? 9) - (peso[b.status] ?? 9)
      || (b.atualizadoEm ?? 0) - (a.atualizadoEm ?? 0)
    ));
  }, [lista]);

  const criar = () => {
    const novo = gerenciador.criar({
      nome: "Novo Encontro",
      pastaId: pasta !== "__todas__" && pasta !== "__sem__" ? pasta : null,
    });
    onAbrir(novo.id);
  };

  return (
    <div className="afty-ficha min-h-screen">
      <header className="afty-cabecalho">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button type="button" className="afty-botao" onClick={onVoltar}>
            <ArrowLeft className="w-4 h-4" /> Grimório
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold">Encontros</div>
            <div className="afty-rotulo text-[11px]">
              {gerenciador.encontros.length} salvo(s)
            </div>
          </div>
          <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={criar}>
            <Plus className="w-4 h-4" /> Novo Encontro
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        {gerenciador.semGravar && (
          <div className="afty-chip" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Não foi possível gravar. O que você fizer agora se perde ao recarregar
          </div>
        )}

        {/* ---------- filtros ---------- */}
        <section className="afty-card p-3 flex items-center gap-2 flex-wrap">
          <div className="afty-linha px-2 py-1.5 flex items-center gap-2 flex-1 min-w-[12rem]">
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setBusca(""); }}
              placeholder="Filtrar encontros"
              aria-label="Filtrar encontros"
              className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
            />
            {busca && (
              <button type="button" className="afty-passo" onClick={() => setBusca("")} aria-label="Limpar o filtro">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="afty-botao"
            data-afty-tom={status === "__todos__" ? "destaque" : undefined}
            onClick={() => setStatus("__todos__")}
          >
            Todos
          </button>
          {STATUS_ORDEM.map((s) => {
            const t = STATUS_TEMA[s];
            const Icone = t.icone;
            return (
              <button
                key={s}
                type="button"
                className="afty-botao"
                data-afty-tom={status === s ? "destaque" : undefined}
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
              >
                <Icone className="w-3.5 h-3.5" /> {t.rotulo}
              </button>
            );
          })}

          {pastas.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
              <select
                value={pasta}
                onChange={(e) => setPasta(e.target.value)}
                aria-label="Filtrar por pasta"
                className="afty-campo bg-transparent outline-none"
                style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
              >
                <option value="__todas__" style={{ background: "var(--afty-card)" }}>Todas as Pastas</option>
                <option value="__sem__" style={{ background: "var(--afty-card)" }}>Sem Pasta</option>
                {pastas.map((f) => (
                  <option key={f.id} value={f.id} style={{ background: "var(--afty-card)" }}>{f.name}</option>
                ))}
              </select>
            </span>
          )}
        </section>

        {/* ---------- grade ---------- */}
        {ordenada.length === 0 ? (
          <section className="afty-card p-10 text-center space-y-3">
            <Swords className="w-8 h-8 mx-auto" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
            <div className="afty-rotulo text-[12px]">
              {gerenciador.encontros.length === 0
                ? "Nenhum encontro ainda. Crie um e monte a escalação."
                : "Nenhum encontro com esses filtros."}
            </div>
            {gerenciador.encontros.length === 0 && (
              <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={criar}>
                <Plus className="w-4 h-4" /> Novo Encontro
              </button>
            )}
          </section>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordenada.map((e) => (
              <Cartao
                key={e.id}
                encontro={e}
                pastas={pastas}
                onAbrir={onAbrir}
                onDuplicar={gerenciador.duplicar}
                onMover={gerenciador.moverParaPasta}
                onApagar={setAApagar}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmarApagar
        encontro={aApagar}
        onConfirmar={() => { gerenciador.remover(aApagar.id); setAApagar(null); }}
        onCancelar={() => setAApagar(null)}
      />
    </div>
  );
}
