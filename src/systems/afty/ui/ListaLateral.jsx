import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Layers, Plus, Search, X } from "lucide-react";
import { organizarLista, tiposPresentes, vizinhoNaLista } from "../afty-lista-lateral";

/**
 * ============================================================
 * A LISTA LATERAL (2026-09-16)
 * ============================================================
 * Substituiu a fileira de cartões nas abas de Feitiços e de Invocações. O
 * autor: *"A aba de Feitiços está MUITO dificil navegar entre os Feitiços quando
 * possuimos muitos."* A fileira mostrava quatro por vez, e o décimo quinto só
 * aparecia rolando de lado.
 *
 * O desenho escolhido é MESTRE-DETALHE em coluna: a lista à esquerda, grudada
 * abaixo do cabeçalho do criador, e o editor à direita. A lista continua à vista
 * enquanto se edita, então trocar de Feitiço é um clique, sem voltar ao topo.
 *
 * ⚠ A QUEBRA É PELA LARGURA DO CARD, e não da janela (`@container`). O criador
 * tem o Preview à direita em tela larga, e a mesma janela dá cards de larguras
 * diferentes. Abaixo de 48rem a lista vira um botão com o selecionado, que abre
 * a lista por cima do editor e fecha ao escolher.
 *
 * ⚠ A ROLAGEM DA LISTA É CALCULADA À MÃO, e não por `scrollIntoView`, pela
 * mesma razão da fileira antiga: o `scrollIntoView` rola todo ancestral, e
 * escolher um item saltaria a página inteira.
 *
 * O que decide busca, filtro, ordem e grupos mora em `afty-lista-lateral.js`,
 * sem tela, e tem assert. Aqui mora só o desenho e o estado de quem está olhando.
 *
 * Props:
 *   itens          [{ id, nome, tipo, nivel }] na ordem da ficha
 *   tipos          [{ value, label, curto }] na ordem em que os grupos aparecem
 *   IconeTipo      componente `({ tipo, className })`, ou nulo para chip de texto
 *   rotuloNivel    "Nível" ou "Grau", o nome da terceira ordem
 *   selecionadoId, onSelecionar(id)
 *   renderItem     (item, selecionado) => o conteúdo da linha
 *   onNova         nulo some com o botão (a ficha que perdeu o acesso só lê)
 *   rotuloNovo, rotuloBusca, rotuloVazio
 *   children       o editor
 * ============================================================
 */
export default function ListaLateral({
  itens, tipos = [], IconeTipo = null, rotuloNivel = "Nível",
  selecionadoId, onSelecionar, renderItem,
  onNova = null, rotuloNovo, rotuloBusca, rotuloVazio,
  children,
}) {
  const [termo, setTermo] = useState("");
  const [tiposAtivos, setTiposAtivos] = useState([]);
  const [ordem, setOrdem] = useState("criacao");
  const [agrupar, setAgrupar] = useState(true);
  const [aberta, setAberta] = useState(false);

  /* Sem memo: são dezenas de itens, e quem chama monta a lista a cada render. */
  const presentes = tiposPresentes(itens, tipos);
  /* Um filtro ligado num Tipo que deixou de existir na ficha esconderia tudo sem
     chip nenhum aceso para desligar. Só vale o que ainda tem item. */
  const ativosValidos = tiposAtivos.filter((t) => presentes.some((p) => p.value === t));
  const { grupos, visiveis, total } = organizarLista(itens, { termo, tiposAtivos: ativosValidos, ordem, agrupar, tipos });
  const filtrando = termo.trim() !== "" || ativosValidos.length > 0;
  const selecionado = itens.find((i) => i.id === selecionadoId) ?? null;

  const lista = useRef(null);
  const linhas = useRef(new Map());
  /* ⚠ SÓ QUANDO O SELECIONADO MUDA. Rodando a cada render, qualquer tecla no
     editor puxaria a lista de volta para o selecionado enquanto a pessoa rola
     para procurar outro. */
  useEffect(() => {
    const fila = lista.current;
    const el = linhas.current.get(selecionadoId);
    if (!fila || !el) return;
    const c = el.getBoundingClientRect();
    const f = fila.getBoundingClientRect();
    if (c.top < f.top) fila.scrollTop -= f.top - c.top + 4;
    else if (c.bottom > f.bottom) fila.scrollTop += c.bottom - f.bottom + 4;
  }, [selecionadoId]);

  const escolher = (id) => {
    onSelecionar(id);
    setAberta(false);
  };
  const alternarTipo = (value) =>
    setTiposAtivos((atual) => (atual.includes(value) ? atual.filter((t) => t !== value) : [...atual, value]));
  const naSeta = (ev) => {
    if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
    const proximo = vizinhoNaLista(grupos, selecionadoId, ev.key === "ArrowDown" ? 1 : -1);
    if (!proximo) return;
    ev.preventDefault();
    onSelecionar(proximo);
    linhas.current.get(proximo)?.focus({ preventScroll: true });
  };

  const ORDENS = [
    { value: "criacao", label: "Criação" },
    { value: "nome", label: "Nome" },
    { value: "nivel", label: rotuloNivel },
  ];

  return (
    <div className="@container">
      <div className="flex flex-col gap-3 @3xl:grid @3xl:grid-cols-[15rem_minmax(0,1fr)] @3xl:items-start">
        {/* No card estreito a lista fica atrás deste botão, que mostra quem está
            aberto no editor. */}
        <button
          type="button"
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          className="@3xl:hidden w-full flex items-center gap-2 leading-tight rounded-lg border border-purple-500/70 bg-purple-950/30 px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
        >
          <span className="flex-1 min-w-0">{selecionado ? renderItem(selecionado, true) : null}</span>
          <span className="flex-shrink-0 font-mono text-[10px] tabular-nums text-slate-400">{total}</span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${aberta ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        <div
          /* ⚠ `leading-tight` NO PAINEL INTEIRO. O `:root` do index.css declara
             `font: 18px/145%`, e o 145% vira 26px FIXOS herdados por todo
             elemento: o `text-[10px]` de uma linha saía com 26px de altura, e
             cada item da lista media 70px. A proporção sem unidade volta a
             seguir o tamanho de cada texto. */
          className={`${aberta ? "flex" : "hidden"} @3xl:flex flex-col min-h-0 leading-tight rounded-lg border border-slate-800 bg-slate-950/40 @3xl:sticky`}
          /* A altura cabe embaixo do cabeçalho grudado do criador, que muda com a
             largura. Ver `--afty-topo`. No card estreito o `top` não faz nada. */
          style={{
            top: "calc(var(--afty-topo, 0px) + 0.75rem)",
            maxHeight: "calc(100vh - var(--afty-topo, 0px) - 1.5rem)",
          }}
        >
          {/* ===== Busca e o botão de novo ===== */}
          <div className="flex items-center gap-1.5 p-2 border-b border-slate-800">
            <label className="relative flex-1 min-w-0">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setTermo(""); }}
                placeholder={rotuloBusca}
                aria-label={rotuloBusca}
                className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-7 pr-7 text-[12px] text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {termo && (
                <button
                  type="button"
                  onClick={() => setTermo("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-white"
                  aria-label="Limpar Busca"
                  title="Limpar Busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </label>
            {onNova && (
              <button
                type="button"
                onClick={() => { onNova(); setAberta(false); }}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
                aria-label={rotuloNovo}
                title={rotuloNovo}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ===== Filtro por Tipo, ordem e grupos ===== */}
          <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-800">
            {presentes.length > 1 && presentes.map((t) => {
              const ligado = ativosValidos.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => alternarTipo(t.value)}
                  aria-pressed={ligado}
                  title={`${t.label} (${t.quantidade})`}
                  className={`h-6 min-w-6 px-1.5 inline-flex items-center justify-center gap-1 rounded border text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 ${
                    ligado
                      ? "bg-purple-700 border-purple-600 text-white"
                      : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                  }`}
                >
                  {IconeTipo ? <IconeTipo tipo={t.value} className="w-3.5 h-3.5" /> : (t.curto ?? t.label)}
                </button>
              );
            })}
            <span className="ml-auto flex items-center gap-1">
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                aria-label="Ordenar"
                title="Ordenar"
                className="h-6 bg-slate-950 border border-slate-700 rounded px-1 text-[10px] text-slate-300 focus:outline-none focus:border-purple-500"
              >
                {ORDENS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setAgrupar((a) => !a)}
                aria-pressed={agrupar}
                title="Agrupar por Tipo"
                aria-label="Agrupar por Tipo"
                className={`w-6 h-6 flex items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 ${
                  agrupar
                    ? "bg-purple-700 border-purple-600 text-white"
                    : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>

          {/* ===== A lista ===== */}
          <div ref={lista} className="flex-1 min-h-0 overflow-y-auto p-1.5" onKeyDown={naSeta}>
            {visiveis === 0 ? (
              <p className="px-2 py-3 text-[11px] text-slate-500">{rotuloVazio}</p>
            ) : grupos.map((g) => (
              <div key={g.tipo ?? "todos"} className="mb-1 last:mb-0">
                {g.rotulo && (
                  <div className="flex items-baseline gap-1.5 px-1.5 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    <span className="truncate">{g.rotulo}</span>
                    <span className="ml-auto font-mono tabular-nums">{g.itens.length}</span>
                  </div>
                )}
                <div className="space-y-0.5">
                  {g.itens.map((item) => {
                    const ativo = item.id === selecionadoId;
                    return (
                      <button
                        key={item.id}
                        ref={(el) => { if (el) linhas.current.set(item.id, el); else linhas.current.delete(item.id); }}
                        type="button"
                        onClick={() => escolher(item.id)}
                        aria-pressed={ativo}
                        title={item.nome}
                        className={`w-full text-left rounded-md border px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 ${
                          ativo
                            ? "border-purple-500 bg-purple-950/40"
                            : "border-transparent hover:bg-slate-800/60"
                        }`}
                      >
                        {renderItem(item, ativo)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {filtrando && visiveis > 0 && (
            <div className="px-2.5 py-1 border-t border-slate-800 font-mono text-[10px] tabular-nums text-slate-500">
              {visiveis} / {total}
            </div>
          )}
        </div>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
