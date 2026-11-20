import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Plus, Search, X, Folder, FolderPlus, FolderOpen, Inbox, Swords, Flag, Trophy, Copy, Trash2, GripVertical,
  Pencil, Check, Clock, Layers,
} from "lucide-react";
import {
  DndContext, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "../../ficha/ficha.css";
import "../encontro-g2.css";
import { ENCONTRO_STATUS } from "../afty-encontro";
import { Aviso, Confirmar, Vazio } from "./pecas-encontro";
import { LADO_PECA, contagem } from "./pecas-dados";

/**
 * ============================================================
 * A LISTA DE ENCONTROS (etapa 6a, 2026-11-17)
 * ============================================================
 * Pastas próprias da lista (autor, "Pastas Próprias"), filtro por nome e por
 * status, cartões que se arrastam para ordenar (a ordem é a gravada), seleção de
 * vários com a barra de mover e apagar embaixo (D-24). Uma ação de destaque:
 * Novo Encontro.
 *
 * Largura pelo `@container ec-lista` em px (a raiz tem 18 px).
 * ============================================================
 */

const STATUS = {
  planejando: { rotulo: "Planejando", icone: Flag, acao: "Abrir" },
  ativo: { rotulo: "Em Combate", icone: Swords, acao: "Retomar" },
  finalizado: { rotulo: "Finalizado", icone: Trophy, acao: "Ver Resumo" },
};
const ORDEM_STATUS = [ENCONTRO_STATUS.PLANEJANDO, ENCONTRO_STATUS.ATIVO, ENCONTRO_STATUS.FINALIZADO];

const quando = (ts) => {
  if (!ts) return "";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "Agora";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Há ${contagem(d, "Dia", "Dias")}`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

/* ---------- as pastas ---------- */

function LinhaDePasta({ pasta, n, ativa, onEscolher, onRenomear, onApagar, desabilitado }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(pasta.name);
  if (editando) {
    const confirma = () => { onRenomear(nome); setEditando(false); };
    return (
      <li className="ec-pasta" data-editando="sim">
        <input className="ec-campo" value={nome} autoFocus aria-label={`Nome da Pasta ${pasta.name}`} onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirma(); if (e.key === "Escape") { setNome(pasta.name); setEditando(false); } }} />
        <button type="button" className="afty-passo" onClick={confirma} aria-label="Confirmar o Nome" title="Confirmar o Nome"><Check aria-hidden="true" /></button>
      </li>
    );
  }
  return (
    <li className="ec-pasta">
      <button type="button" className="ec-pasta-botao" aria-current={ativa ? "true" : undefined} onClick={onEscolher}>
        {ativa ? <FolderOpen aria-hidden="true" /> : <Folder aria-hidden="true" />}
        <span className="ec-pasta-nome" title={pasta.name}>{pasta.name}</span>
        <small>{n}</small>
      </button>
      <span className="ec-pasta-acoes">
        <button type="button" className="afty-passo" disabled={desabilitado} onClick={() => { setNome(pasta.name); setEditando(true); }} aria-label={`Renomear ${pasta.name}`} title={`Renomear ${pasta.name}`}><Pencil aria-hidden="true" /></button>
        <button type="button" className="afty-passo" disabled={desabilitado} onClick={onApagar} aria-label={`Apagar a Pasta ${pasta.name}`} title={`Apagar a Pasta ${pasta.name}`}><Trash2 aria-hidden="true" /></button>
      </span>
    </li>
  );
}

function Pastas({ lista, filtro, onFiltro, contas, desabilitado }) {
  const [aApagar, setAApagar] = useState(null);
  const fixos = [
    { id: "__todas__", rotulo: "Todos os Encontros", icone: Layers, n: lista.encontros.length },
    { id: "__sem__", rotulo: "Sem Pasta", icone: Inbox, n: contas.__sem__ ?? 0 },
  ];
  return (
    <nav className="ec-pastas" aria-label="Pastas">
      <ul className="ec-pastas-lista">
        {fixos.map((f) => {
          const Icone = f.icone;
          return (
            <li key={f.id} className="ec-pasta">
              <button type="button" className="ec-pasta-botao" aria-current={filtro === f.id ? "true" : undefined} onClick={() => onFiltro(f.id)}>
                <Icone aria-hidden="true" /><span className="ec-pasta-nome">{f.rotulo}</span><small>{f.n}</small>
              </button>
            </li>
          );
        })}
        {lista.pastas.map((p) => (
          <LinhaDePasta
            key={p.id} pasta={p} n={contas[p.id] ?? 0} ativa={filtro === p.id} desabilitado={desabilitado}
            onEscolher={() => onFiltro(p.id)} onRenomear={(nome) => lista.renomearPasta(p.id, nome)}
            onApagar={() => setAApagar(p)}
          />
        ))}
      </ul>
      <button type="button" className="afty-botao ec-nova-pasta" disabled={desabilitado} onClick={() => onFiltro(lista.criarPasta("Nova Pasta").id)}>
        <FolderPlus aria-hidden="true" />Nova Pasta
      </button>
      {aApagar && (
        <Confirmar titulo={`Apagar a Pasta ${aApagar.name}?`} rotulo="Apagar Pasta" onCancelar={() => setAApagar(null)}
          onConfirmar={() => { lista.removerPasta(aApagar.id); if (filtro === aApagar.id) onFiltro("__todas__"); setAApagar(null); }}>
          <p className="ec-texto">A pasta some. {contagem(contas[aApagar.id] ?? 0, "Encontro dela vai", "Encontros dela vão")} para Sem Pasta.</p>
        </Confirmar>
      )}
    </nav>
  );
}

/* ---------- o cartão ---------- */

function Cartao({ encontro: e, pastas, selecionado, onSelecionar, onAbrir, onDuplicar, onMover, onApagar, desabilitado }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: e.id, disabled: desabilitado });
  const s = STATUS[e.status] ?? STATUS.planejando;
  const Icone = s.icone;
  const porLado = {};
  for (const c of e.combatentes) porLado[c.flags.lado] = (porLado[c.flags.lado] ?? 0) + 1;
  return (
    <li
      ref={setNodeRef} className="ec-cartao" data-status={e.status} data-selecionado={selecionado ? "sim" : undefined} data-arrastando={isDragging ? "sim" : undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="ec-cartao-topo">
        <button type="button" className="ec-alca" {...attributes} {...listeners} disabled={desabilitado} aria-label={`Arrastar ${e.nome}`} title="Arrastar para Ordenar">
          <GripVertical aria-hidden="true" />
        </button>
        <span className="ec-status" data-status={e.status}><Icone aria-hidden="true" />{s.rotulo}</span>
        {e.status === ENCONTRO_STATUS.ATIVO && <span className="ec-cartao-rodada afty-base"><Clock aria-hidden="true" />Rodada <b className="afty-valor">{e.rodada}</b></span>}
        <label className="ec-caixa" title={selecionado ? "Tirar da Seleção" : "Selecionar"}>
          <input type="checkbox" checked={selecionado} onChange={(ev) => onSelecionar(e.id, ev.nativeEvent.shiftKey)} aria-label={`Selecionar ${e.nome}`} />
        </label>
      </div>
      <button type="button" className="ec-cartao-nome" onClick={() => onAbrir(e.id)} title={e.nome}>{e.nome}</button>
      <p className="ec-cartao-lados">
        {e.combatentes.length === 0 ? <span>Sem Combatentes</span> : ["jogador", "aliado", "inimigo"].filter((l) => porLado[l]).map((l) => {
          const P = LADO_PECA[l];
          const I = P.icone;
          return <span key={l} className="ec-lado"><I aria-hidden="true" />{contagem(porLado[l], P.rotulo, P.plural)}</span>;
        })}
      </p>
      <div className="ec-cartao-pasta-linha">
        <Folder aria-hidden="true" />
        <select className="ec-campo ec-cartao-pasta" value={e.pastaId ?? ""} disabled={desabilitado || !pastas.length} onChange={(ev) => onMover(e.id, ev.target.value || null)} aria-label={`Pasta de ${e.nome}`} title="Pasta">
          <option value="">Sem Pasta</option>
          {pastas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="ec-cartao-quando">{quando(e.atualizadoEm)}</span>
      </div>
      <div className="ec-cartao-rodape">
        <button type="button" className="afty-botao" data-afty-tom={e.status === ENCONTRO_STATUS.ATIVO ? "destaque" : undefined} onClick={() => onAbrir(e.id)}>{s.acao}</button>
        <button type="button" className="afty-botao" onClick={() => onDuplicar(e.id)} disabled={desabilitado} aria-label={`Duplicar ${e.nome}`}><Copy aria-hidden="true" />Duplicar</button>
        <button type="button" className="afty-botao ec-icone ec-remover" onClick={() => onApagar(e)} disabled={desabilitado} aria-label={`Apagar ${e.nome}`} title="Apagar"><Trash2 aria-hidden="true" /></button>
      </div>
    </li>
  );
}

/* ---------- a tela ---------- */

/* `semVoltar` (opcional, etapa E8 do app, 2026-11-20): na casca da Guilda no celular a lista é uma aba da barra de baixo, e o
   Voltar ao Grimório some. Sem a prop, tudo como antes. */
export default function ListaDeEncontros({ lista, titulo = "Encontros", onAbrir, onVoltar, semVoltar = false }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("__todos__");
  const [pasta, setPasta] = useState("__todas__");
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [aApagar, setAApagar] = useState(null);
  const [moverPara, setMoverPara] = useState("");
  const desabilitado = lista.ilegivel;

  const pastasIds = useMemo(() => new Set(lista.pastas.map((p) => p.id)), [lista.pastas]);
  const contas = useMemo(() => {
    const out = { __sem__: 0 };
    for (const e of lista.encontros) {
      if (e.pastaId == null || !pastasIds.has(String(e.pastaId))) out.__sem__ += 1;
      else out[e.pastaId] = (out[e.pastaId] ?? 0) + 1;
    }
    return out;
  }, [lista.encontros, pastasIds]);
  const porStatus = useMemo(() => {
    const out = {};
    for (const e of lista.encontros) out[e.status] = (out[e.status] ?? 0) + 1;
    return out;
  }, [lista.encontros]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.encontros.filter((e) => {
      const semPasta = e.pastaId == null || !pastasIds.has(String(e.pastaId));
      if (pasta === "__sem__" && !semPasta) return false;
      if (pasta !== "__todas__" && pasta !== "__sem__" && String(e.pastaId) !== pasta) return false;
      if (status !== "__todos__" && e.status !== status) return false;
      if (q && !e.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lista.encontros, busca, status, pasta, pastasIds]);

  const selVivos = visiveis.filter((e) => selecionados.has(e.id)).map((e) => e.id);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const aoSoltar = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = visiveis.map((e) => e.id);
    lista.reordenar(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)));
  };
  const selecionar = (id) => setSelecionados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const criar = () => {
    const novo = lista.criar({ pastaId: pasta !== "__todas__" && pasta !== "__sem__" ? pasta : null });
    onAbrir(novo.id);
  };
  const filtrando = busca || status !== "__todos__" || pasta !== "__todas__";
  const recusados = lista.migracao?.recusados?.length ?? 0;

  return (
    <div className="afty-ficha ec-raiz">
      <header className="ec-topo">
        {!semVoltar && <button type="button" className="afty-botao ec-icone" onClick={onVoltar} aria-label="Voltar ao Grimório" title="Voltar ao Grimório"><ArrowLeft aria-hidden="true" /></button>}
        <div className="ec-topo-titulo">
          <h1 className="ec-titulo">{titulo}</h1>
          <p className="ec-subtitulo"><span>{contagem(lista.encontros.length, "Encontro", "Encontros")}</span>{porStatus.ativo ? <span>{porStatus.ativo} Em Combate</span> : null}</p>
        </div>
        <div className="ec-topo-acoes">
          <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={criar} disabled={desabilitado}><Plus aria-hidden="true" />Novo Encontro</button>
        </div>
      </header>

      <div className="ec-avisos">
        {lista.semGravar && <Aviso papel="alert">Não Foi Possível Gravar: o que mudar agora se perde ao recarregar</Aviso>}
        {lista.ilegivel && <Aviso papel="alert">A Lista de Encontros está ilegível e ficou só para leitura</Aviso>}
        {recusados > 0 && <Aviso>{contagem(recusados, "Ficha de Outro Grimório Ficou", "Fichas de Outro Grimório Ficaram")} Fora dos Encontros Trazidos</Aviso>}
      </div>

      <div className="ec-lista-caixa"><div className="ec-lista">
        <Pastas lista={lista} filtro={pasta} onFiltro={setPasta} contas={contas} desabilitado={desabilitado} />

        <main className="ec-lista-corpo">
          <div className="ec-filtros">
            <label className="ec-busca">
              <Search aria-hidden="true" />
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setBusca(""); }}
                placeholder="Buscar Encontro" aria-label="Buscar Encontro" />
              {busca && <button type="button" className="afty-passo" onClick={() => setBusca("")} aria-label="Limpar a Busca" title="Limpar a Busca"><X aria-hidden="true" /></button>}
            </label>
            <span className="ec-segmentos" role="group" aria-label="Status">
              <button type="button" className="ec-segmento" aria-pressed={status === "__todos__"} onClick={() => setStatus("__todos__")}>Todos<small>{lista.encontros.length}</small></button>
              {ORDEM_STATUS.map((st) => {
                const I = STATUS[st].icone;
                return (
                  <button key={st} type="button" className="ec-segmento" aria-pressed={status === st} onClick={() => setStatus(st)}>
                    <I aria-hidden="true" />{STATUS[st].rotulo}<small>{porStatus[st] ?? 0}</small>
                  </button>
                );
              })}
            </span>
          </div>

          {visiveis.length === 0 ? (
            lista.encontros.length === 0 ? (
              <Vazio icone={Swords} titulo="Nenhum Encontro Ainda">
                <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={criar} disabled={desabilitado}><Plus aria-hidden="true" />Novo Encontro</button>
              </Vazio>
            ) : (
              <Vazio icone={Search} titulo="Nenhum Encontro com Esses Filtros">
                {filtrando && <button type="button" className="afty-botao" onClick={() => { setBusca(""); setStatus("__todos__"); setPasta("__todas__"); }}><X aria-hidden="true" />Limpar Filtros</button>}
              </Vazio>
            )
          ) : (
            <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
              <SortableContext items={visiveis.map((e) => e.id)} strategy={rectSortingStrategy}>
                <ul className="ec-cartoes">
                  {visiveis.map((e) => (
                    <Cartao
                      key={e.id} encontro={e} pastas={lista.pastas} selecionado={selecionados.has(e.id)} desabilitado={desabilitado}
                      onSelecionar={selecionar} onAbrir={onAbrir} onDuplicar={lista.duplicar} onMover={lista.moverParaPasta} onApagar={setAApagar}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </main>
      </div></div>

      {selVivos.length > 0 && (
        <div className="ec-grupo" role="region" aria-label="Encontros Selecionados">
          <span className="ec-grupo-conta"><b>{selVivos.length}</b> {selVivos.length === 1 ? "Selecionado" : "Selecionados"}</span>
          <select className="ec-campo" value={moverPara} onChange={(e) => setMoverPara(e.target.value)} aria-label="Mover para a Pasta" disabled={desabilitado}>
            <option value="">Escolher Pasta</option>
            <option value="__sem__">Sem Pasta</option>
            {lista.pastas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="button" className="afty-botao" disabled={!moverPara || desabilitado} onClick={() => { lista.moverVarios(selVivos, moverPara === "__sem__" ? null : moverPara); setMoverPara(""); }}>
            <FolderOpen aria-hidden="true" />Mover
          </button>
          <span className="ec-topo-sep" aria-hidden="true" />
          <button type="button" className="afty-botao" data-afty-tom="perigo" disabled={desabilitado} onClick={() => setAApagar({ varios: selVivos })}><Trash2 aria-hidden="true" />Apagar</button>
          <button type="button" className="afty-botao" onClick={() => setSelecionados(new Set())}><X aria-hidden="true" />Limpar</button>
        </div>
      )}

      {aApagar && (
        <Confirmar
          titulo={aApagar.varios ? `Apagar ${contagem(aApagar.varios.length, "Encontro", "Encontros")}?` : `Apagar ${aApagar.nome}?`}
          rotulo="Apagar"
          onCancelar={() => setAApagar(null)}
          onConfirmar={() => {
            if (aApagar.varios) { lista.removerVarios(aApagar.varios); setSelecionados(new Set()); } else lista.remover(aApagar.id);
            setAApagar(null);
          }}
        >
          <p className="ec-texto">
            {aApagar.varios ? "Os Encontros somem com o Registro deles." : `${contagem(aApagar.combatentes.length, "Combatente", "Combatentes")} e o Registro somem.`}
          </p>
        </Confirmar>
      )}
    </div>
  );
}
