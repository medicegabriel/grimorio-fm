import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Upload, Plus, Trash2, RefreshCw, Heart, Zap, Swords, HeartPulse, Moon,
  X, AlertTriangle, Users, Skull, Search, Check, Crown,
} from "lucide-react";

import "../afty/ficha/ficha.css";
import "../afty/encontros/encontros.css";
/* O módulo de sessão entra primeiro: é ele que importa o `afty-derive` antes do resto. */
import { aplicarNaMesa, derivarMesa } from "./mesa-do-mestre-sessao";
import {
  aplicaCura, aplicaDano, gastaPe, limparSessao, salvarSessao,
} from "../afty/ficha/ficha-sessao";
import { avisoDoVital } from "../afty/ficha/ficha-vital";
import { Vital } from "../afty/ui/vital";
import { sistemaGravado } from "../afty/afty-sistema";
import { parseImportText } from "../../components/io-utils";
import {
  adicionarDaLista, atualizarImportada, carregarMesa, fichaDaEntrada, grupoDaFicha, idDaSessao,
  importarNaMesa, removerDaMesa, salvarMesa, semFichasApagadas,
} from "./mesa-do-mestre";

/**
 * ============================================================
 * A MESA DO MESTRE (rota /EraDeOuro, autor, 2026-11-11)
 * ============================================================
 * As fichas que estão na sessão de jogo, numa tela só: Jogadores e Criaturas, cada
 * um com Vida e PE à mostra. O mestre seleciona quantos quiser e aplica Dano, Dano
 * pela Metade, Cura, Gasto e Recuperação de PE ou Descanso de uma vez, ou mexe
 * direto na barra de um só, sem abrir a ficha. O modelo e o porquê de cada escolha
 * estão em `mesa-do-mestre.js`.
 *
 * ⚠ As barras chamam os MESMOS verbos do Painel de Combatente do Encontro, que são
 * os da Ficha Final. Divergir aqui faria a mesa e a Ficha chegarem a PVs diferentes
 * na mesma criatura, e a ficha da lista divide a sessão com a Ficha Final.
 * ============================================================
 */

const lerArquivo = (file) => (typeof file.text === "function"
  ? file.text()
  : new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => falha(new Error("leitura"));
    r.readAsText(file);
  }));

/** Lê os arquivos escolhidos. Devolve as fichas e os nomes dos que não abriram. */
async function fichasDosArquivos(arquivos) {
  const fichas = [];
  const ruins = [];
  for (const file of arquivos) {
    try {
      fichas.push(...parseImportText(await lerArquivo(file)).creatures);
    } catch {
      ruins.push(file.name);
    }
  }
  return { fichas, ruins };
}

const pvTempTotal = (s) => Object.values(s?.pvTempFontes ?? {}).reduce((a, v) => a + (Math.trunc(Number(v)) || 0), 0);
const peTempTotal = (s) => Object.values(s?.peTempFontes ?? {}).reduce((a, v) => a + (Math.trunc(Number(v)) || 0), 0);
const rotuloDeNivel = (ficha, derived) => {
  const n = derived?.nd ?? ficha?.core?.nd;
  if (n == null) return null;
  return grupoDaFicha(ficha) === "jogador" ? `Nível ${n}` : `ND ${n}`;
};

/* ============================================================ */
/* O CARD                                                        */
/* ============================================================ */

function CardDaMesa({ entrada, dados, selecionado, onSelecionar, onSessao, onRemover, onAtualizar }) {
  const { ficha, sessao, derived, vital } = dados;
  const nivel = rotuloDeNivel(ficha, derived);
  return (
    <article
      className="afty-card p-3 space-y-2"
      style={selecionado ? { borderColor: "var(--afty-destaque)", boxShadow: "0 0 0 1px var(--afty-destaque)" } : undefined}
      data-mesa-entrada={entrada.id}
    >
      <header className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          role="checkbox"
          aria-checked={selecionado}
          aria-label={`Selecionar ${ficha.name || "Sem nome"}`}
          onClick={onSelecionar}
          className="afty-passo flex-shrink-0"
          style={selecionado ? { background: "var(--afty-destaque)", borderColor: "var(--afty-destaque)", color: "#fff" } : undefined}
        >
          {selecionado ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block" />}
        </button>
        <button type="button" onClick={onSelecionar} className="flex-1 min-w-0 text-left">
          <div className="font-bold truncate" title={ficha.name}>{ficha.name || "Sem nome"}</div>
          <div className="flex items-center gap-1.5 flex-wrap afty-rotulo text-[11px]">
            {nivel && <span>{nivel}</span>}
            {derived && <span>Defesa {derived.defesa}</span>}
            {entrada.tipo === "importada" && <span>Importada</span>}
          </div>
        </button>
        {vital?.morto
          ? <span className="afty-chip" data-afty-tom="aviso"><Skull className="w-3 h-3" aria-hidden="true" /> Morto</span>
          : vital?.caido && derived && <span className="afty-chip" data-afty-tom="aviso"><HeartPulse className="w-3 h-3" aria-hidden="true" /> Caído</span>}
        {entrada.tipo === "importada" && (
          <label className="afty-passo flex-shrink-0 cursor-pointer" title="Atualizar Ficha">
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            <input
              type="file" accept=".json,application/json" hidden
              aria-label={`Atualizar a ficha de ${ficha.name || "Sem nome"}`}
              onChange={(e) => { onAtualizar(e.target.files); e.target.value = ""; }}
            />
          </label>
        )}
        <button type="button" className="afty-passo flex-shrink-0" onClick={onRemover} title="Tirar da Mesa" aria-label={`Tirar ${ficha.name || "Sem nome"} da mesa`}>
          <X className="w-3 h-3" />
        </button>
      </header>

      {!derived ? (
        <div className="afty-chip" data-afty-tom="aviso">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" /> Ficha Ilegível
        </div>
      ) : (
        <>
          <Vital
            tipo="pv" icone={Heart} rotulo="PV"
            atual={sessao.hpAtual} max={derived.hp} temp={pvTempTotal(sessao)}
            aviso={avisoDoVital(sessao.vital)}
            onSet={(v) => onSessao((s) => ({ ...s, hpAtual: v }))}
            onDelta={(n) => onSessao((s) => (n < 0 ? aplicaDano(s, -n, derived) : aplicaCura(s, n, derived.hp)))}
          />
          {!derived.bloodfeast?.tem && (
            <Vital
              tipo="pe" icone={Zap} rotulo={derived.recursoLabel || "PE"}
              atual={sessao.peAtual} max={derived.pe} temp={peTempTotal(sessao)}
              rotuloTemp={`${derived.recursoLabel || "PE"} Temporário`}
              onSet={(v) => onSessao((s) => ({ ...s, peAtual: v }))}
              onDelta={(d) => onSessao((s) => (d < 0 ? gastaPe(s, -d) : { ...s, peAtual: s.peAtual + d }))}
            />
          )}
        </>
      )}
    </article>
  );
}

/* ============================================================ */
/* ESCOLHER DA LISTA                                             */
/* ============================================================ */

function EscolherDaLista({ fichas, naMesa, onAdicionar, onFechar }) {
  const [busca, setBusca] = useState("");
  const [marcadas, setMarcadas] = useState(() => new Set());
  const filtro = busca.trim().toLowerCase();
  const visiveis = fichas.filter((f) => !filtro || String(f.name ?? "").toLowerCase().includes(filtro));
  const alterna = (id) => setMarcadas((m) => {
    const n = new Set(m);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const grupos = [["criatura", "Criaturas"], ["jogador", "Jogadores"]];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "var(--afty-veu, rgba(2,6,23,0.8))" }}
      role="dialog" aria-modal="true" aria-label="Adicionar da Lista"
      onClick={onFechar}
      onKeyDown={(e) => { if (e.key === "Escape") onFechar(); }}
    >
      <div className="afty-card w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--afty-borda)" }}>
          <div className="font-bold flex-1">Adicionar da Lista</div>
          <button type="button" className="afty-passo" onClick={onFechar} aria-label="Fechar"><X className="w-3 h-3" /></button>
        </div>
        <div className="p-3">
          <div className="afty-linha px-2 py-1.5 flex items-center gap-2">
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
            <input
              type="text" autoFocus value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar" aria-label="Buscar ficha"
              className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
            />
          </div>
        </div>
        <div className="px-3 pb-3 overflow-y-auto flex-1 space-y-3">
          {fichas.length === 0 && <div className="afty-rotulo text-[12px] text-center py-6">A lista está vazia.</div>}
          {grupos.map(([g, titulo]) => {
            const doGrupo = visiveis.filter((f) => grupoDaFicha(f) === g);
            if (!doGrupo.length) return null;
            return (
              <div key={g} className="space-y-1">
                <div className="afty-rotulo text-[11px] uppercase tracking-wider">{titulo}</div>
                {doGrupo.map((f) => {
                  const ja = naMesa.has(f.id);
                  const on = ja || marcadas.has(f.id);
                  return (
                    <button
                      key={f.id} type="button" disabled={ja}
                      onClick={() => alterna(f.id)}
                      aria-pressed={on}
                      className="afty-linha w-full px-2 py-1.5 flex items-center gap-2 text-left disabled:opacity-50"
                    >
                      <span className="afty-passo flex-shrink-0" style={on ? { background: "var(--afty-destaque)", borderColor: "var(--afty-destaque)", color: "#fff" } : undefined}>
                        {on ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block" />}
                      </span>
                      <span className="flex-1 min-w-0 truncate">{f.name || "Sem nome"}</span>
                      {ja && <span className="afty-rotulo text-[11px]">Na Mesa</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="p-3 flex justify-end gap-2" style={{ borderTop: "1px solid var(--afty-borda)" }}>
          <button type="button" className="afty-botao" onClick={onFechar}>Cancelar</button>
          <button
            type="button" className="afty-botao" data-afty-tom="destaque" disabled={!marcadas.size}
            onClick={() => onAdicionar([...marcadas])}
          >
            <Plus className="w-4 h-4" /> Adicionar{marcadas.size ? ` (${marcadas.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* A BARRA DO GRUPO SELECIONADO                                  */
/* ============================================================ */

const ACOES = [
  { id: "dano", rotulo: "Dano", icone: Swords, tom: "dano", comValor: true },
  { id: "danoMetade", rotulo: "Dano pela Metade", icone: Swords, tom: "dano", comValor: true },
  { id: "cura", rotulo: "Cura", icone: Heart, tom: "cura", comValor: true },
  { id: "gastaPe", rotulo: "Gastar PE", icone: Zap, comValor: true },
  { id: "recuperaPe", rotulo: "Recuperar PE", icone: Zap, comValor: true },
  { id: "descanso", rotulo: "Descansar", icone: Moon, comValor: false },
];

function BarraDeSelecao({ quantos, onAplicar, onRemover, onLimpar }) {
  const [valor, setValor] = useState("");
  const numero = Math.max(0, Math.trunc(Number(valor) || 0));
  const aplica = (acao) => {
    if (acao.comValor && !numero) return;
    onAplicar(acao.id, numero);
  };
  return (
    <div className="fixed bottom-0 inset-x-0 z-[150] p-3" style={{ pointerEvents: "none" }}>
      <div
        className="afty-card max-w-5xl mx-auto p-3 flex items-center gap-2 flex-wrap"
        style={{ pointerEvents: "auto", boxShadow: "0 -8px 30px rgba(0,0,0,0.45)" }}
        role="toolbar" aria-label="Ações nos Selecionados"
      >
        <span className="font-bold text-sm whitespace-nowrap">{quantos} {quantos === 1 ? "Selecionado" : "Selecionados"}</span>
        <input
          type="text" inputMode="numeric" value={valor} autoFocus
          onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") aplica(ACOES[0]); if (e.key === "Escape") onLimpar(); }}
          placeholder="0" aria-label="Valor"
          className="afty-campo bg-transparent outline-none w-20 text-center"
          style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "4px 6px" }}
        />
        {ACOES.map((a) => {
          const Icone = a.icone;
          return (
            <button
              key={a.id} type="button" className="afty-botao" data-afty-tom={a.tom}
              disabled={a.comValor && !numero}
              onClick={() => aplica(a)}
            >
              <Icone className="w-3.5 h-3.5" /> {a.rotulo}
            </button>
          );
        })}
        <span className="flex-1" />
        <button type="button" className="afty-botao" onClick={onRemover}>
          <Trash2 className="w-3.5 h-3.5" /> Tirar da Mesa
        </button>
        <button type="button" className="afty-passo" onClick={onLimpar} aria-label="Limpar a seleção" title="Limpar a Seleção">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================ */
/* A TELA                                                        */
/* ============================================================ */

export default function MesaDoMestre({ fichasDaLista = [], onVoltar }) {
  const [mesaGravada, setMesaGravada] = useState(() => carregarMesa());
  const [editadas, setEditadas] = useState({});
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [escolhendo, setEscolhendo] = useState(false);
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [semGravar, setSemGravar] = useState(false);
  const inputImportar = useRef(null);

  const porId = useMemo(() => new Map(fichasDaLista.map((f) => [f.id, f])), [fichasDaLista]);
  /* A ficha da lista que foi apagada sai da mesa sozinha. */
  const mesa = useMemo(() => semFichasApagadas(mesaGravada, porId.keys()), [mesaGravada, porId]);

  const mudarMesa = (fn) => {
    const proxima = fn(mesa);
    setSemGravar(!salvarMesa(proxima));
    setMesaGravada(proxima);
    return proxima;
  };

  const itens = useMemo(() => mesa.entradas.map((e) => ({
    id: e.id, idSessao: idDaSessao(e), ficha: fichaDaEntrada(e, porId), sessaoEditada: editadas[idDaSessao(e)],
  })), [mesa, porId, editadas]);
  const dados = useMemo(() => derivarMesa(itens), [itens]);

  const entradas = mesa.entradas.filter((e) => dados[e.id]);
  const grupos = [
    { id: "jogador", titulo: "Jogadores", icone: Users },
    { id: "criatura", titulo: "Criaturas", icone: Crown },
  ].map((g) => ({ ...g, lista: entradas.filter((e) => grupoDaFicha(dados[e.id].ficha) === g.id) }));
  const naMesa = new Set(mesa.entradas.filter((e) => e.tipo === "lista").map((e) => e.fichaId));
  const selecionadosVivos = entradas.filter((e) => selecionados.has(e.id)).map((e) => e.id);

  const gravarSessao = (entradaId, nova) => {
    const e = mesa.entradas.find((x) => x.id === entradaId);
    if (!e) return;
    const id = idDaSessao(e);
    if (!salvarSessao(id, nova)) setSemGravar(true);
    setEditadas((m) => ({ ...m, [id]: nova }));
  };

  const onSessaoDe = (entradaId) => (fn) => {
    const d = dados[entradaId];
    if (d) gravarSessao(entradaId, fn(d.sessao));
  };

  const aplicarNosSelecionados = (acao, valor) => {
    const novas = {};
    for (const id of selecionadosVivos) {
      const d = dados[id];
      if (!d?.derived) continue;
      const e = mesa.entradas.find((x) => x.id === id);
      const idSessao = idDaSessao(e);
      const nova = aplicarNaMesa(d.sessao, d.derived, acao, valor);
      if (!salvarSessao(idSessao, nova)) setSemGravar(true);
      novas[idSessao] = nova;
    }
    setEditadas((m) => ({ ...m, ...novas }));
  };

  const tirar = (ids) => {
    let apagar = [];
    mudarMesa((m) => {
      const r = removerDaMesa(m, ids);
      apagar = r.sessoesAApagar;
      return r.mesa;
    });
    for (const id of apagar) limparSessao(id);
    setSelecionados((s) => new Set([...s].filter((id) => !ids.includes(id))));
  };

  const alternar = (id) => setSelecionados((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const alternarGrupo = (lista) => setSelecionados((s) => {
    const todos = lista.every((e) => s.has(e.id));
    const n = new Set(s);
    for (const e of lista) { if (todos) n.delete(e.id); else n.add(e.id); }
    return n;
  });

  const importar = async (arquivos) => {
    if (!arquivos?.length) return;
    const { fichas, ruins } = await fichasDosArquivos([...arquivos]);
    let recusadas = 0;
    let entraram = 0;
    mudarMesa((m) => {
      const r = importarNaMesa(m, fichas, { aceita: (f) => !!sistemaGravado(f) });
      recusadas = r.recusadas;
      entraram = r.mesa.entradas.length - m.entradas.length;
      return r.mesa;
    });
    const partes = [];
    if (entraram) partes.push(entraram === 1 ? "1 ficha entrou na mesa" : `${entraram} fichas entraram na mesa`);
    if (recusadas) partes.push(recusadas === 1 ? "1 ficha de outro grimório ficou de fora" : `${recusadas} fichas de outro grimório ficaram de fora`);
    if (ruins.length) partes.push(`Arquivo inválido: ${ruins.join(", ")}`);
    setAviso({ texto: partes.join(". "), problema: !!(recusadas || ruins.length) });
  };

  const atualizar = async (entradaId, arquivos) => {
    if (!entradaId || !arquivos?.length) return;
    const { fichas, ruins } = await fichasDosArquivos([...arquivos]);
    const nova = fichas.find((f) => !!sistemaGravado(f));
    if (!nova) {
      setAviso({ texto: ruins.length ? `Arquivo inválido: ${ruins.join(", ")}` : "O arquivo não tem ficha deste grimório", problema: true });
      return;
    }
    mudarMesa((m) => atualizarImportada(m, entradaId, nova));
    setAviso({ texto: `${nova.name || "Sem nome"} atualizada`, problema: false });
  };

  return (
    <div className={`afty-ficha min-h-screen ${selecionadosVivos.length ? "pb-72 sm:pb-36" : ""}`}>
      <header className="afty-cabecalho">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button type="button" className="afty-botao" onClick={onVoltar}>
            <ArrowLeft className="w-4 h-4" /> Guilda
          </button>
          <div className="flex-1 min-w-[10rem]">
            <div className="text-xl font-bold whitespace-nowrap">Mesa do Mestre</div>
            <div className="afty-rotulo text-[11px]">
              {entradas.length} {entradas.length === 1 ? "ficha" : "fichas"}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button type="button" className="afty-botao" onClick={() => setEscolhendo(true)}>
            <Plus className="w-4 h-4" /> Adicionar da Lista
          </button>
          <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={() => inputImportar.current?.click()}>
            <Upload className="w-4 h-4" /> Importar Fichas
          </button>
          {entradas.length > 0 && (
            <button type="button" className="afty-botao" onClick={() => setConfirmarLimpar(true)}>
              <Trash2 className="w-4 h-4" /> Limpar Mesa
            </button>
          )}
          </div>
          <input
            ref={inputImportar} type="file" accept=".json,application/json" multiple hidden
            onChange={(e) => { importar(e.target.files); e.target.value = ""; }}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        {semGravar && (
          <div className="afty-chip" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Não foi possível gravar. O que você fizer agora se perde ao recarregar
          </div>
        )}
        {aviso && (
          <div className="afty-card px-3 py-2 flex items-center gap-2 text-[13px]" role="status">
            {aviso.problema
              ? <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-aviso)" }} aria-hidden="true" />
              : <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-cura)" }} aria-hidden="true" />}
            <span className="flex-1 min-w-0">{aviso.texto}</span>
            <button type="button" className="afty-passo" onClick={() => setAviso(null)} aria-label="Fechar o aviso"><X className="w-3 h-3" /></button>
          </div>
        )}

        {entradas.length === 0 ? (
          <section className="afty-card p-10 text-center space-y-3">
            <Crown className="w-8 h-8 mx-auto" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
            <div className="afty-rotulo text-[12px]">Nenhuma ficha na mesa.</div>
            <div className="flex justify-center gap-2 flex-wrap">
              <button type="button" className="afty-botao" onClick={() => setEscolhendo(true)}>
                <Plus className="w-4 h-4" /> Adicionar da Lista
              </button>
              <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={() => inputImportar.current?.click()}>
                <Upload className="w-4 h-4" /> Importar Fichas
              </button>
            </div>
          </section>
        ) : grupos.filter((g) => g.lista.length).map((g) => {
          const Icone = g.icone;
          const todos = g.lista.every((e) => selecionados.has(e.id));
          return (
            <section key={g.id} className="space-y-2" aria-label={g.titulo}>
              <div className="flex items-center gap-2">
                <Icone className="w-4 h-4" style={{ color: "var(--afty-destaque)" }} aria-hidden="true" />
                <h2 className="text-base font-bold m-0!">{g.titulo}</h2>
                <span className="afty-rotulo text-[11px]">{g.lista.length}</span>
                <span className="flex-1" />
                <button type="button" className="afty-botao" onClick={() => alternarGrupo(g.lista)}>
                  {todos ? "Limpar Seleção" : "Selecionar Todos"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.lista.map((e) => (
                  <CardDaMesa
                    key={e.id}
                    entrada={e}
                    dados={dados[e.id]}
                    selecionado={selecionados.has(e.id)}
                    onSelecionar={() => alternar(e.id)}
                    onSessao={onSessaoDe(e.id)}
                    onRemover={() => tirar([e.id])}
                    onAtualizar={(arquivos) => atualizar(e.id, arquivos)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {selecionadosVivos.length > 0 && (
        <BarraDeSelecao
          quantos={selecionadosVivos.length}
          onAplicar={aplicarNosSelecionados}
          onRemover={() => tirar(selecionadosVivos)}
          onLimpar={() => setSelecionados(new Set())}
        />
      )}

      {escolhendo && (
        <EscolherDaLista
          fichas={fichasDaLista}
          naMesa={naMesa}
          onFechar={() => setEscolhendo(false)}
          onAdicionar={(ids) => { mudarMesa((m) => adicionarDaLista(m, ids)); setEscolhendo(false); }}
        />
      )}

      {confirmarLimpar && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "var(--afty-veu, rgba(2,6,23,0.8))" }}
          role="dialog" aria-modal="true" aria-label="Limpar Mesa"
          onClick={() => setConfirmarLimpar(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setConfirmarLimpar(false); }}
        >
          <div className="afty-card w-full max-w-sm p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold">Limpar Mesa</div>
            <div className="text-[13px]">
              Todas as fichas saem da mesa. As importadas são apagadas, e as da lista continuam na lista.
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="afty-botao" autoFocus onClick={() => setConfirmarLimpar(false)}>Cancelar</button>
              <button
                type="button" className="afty-botao" data-afty-tom="dano"
                onClick={() => { tirar(mesa.entradas.map((e) => e.id)); setConfirmarLimpar(false); }}
              >
                <Trash2 className="w-4 h-4" /> Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
