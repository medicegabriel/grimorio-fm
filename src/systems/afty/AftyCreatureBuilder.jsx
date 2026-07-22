import React, { useState, useMemo } from "react";
import {
  Save, ChevronLeft, ChevronDown, Wand2, Sparkles, FlaskConical,
  Dumbbell, GraduationCap, BookOpen, Check, ArrowRight, Lock, Plus, X, Zap,
  Copy, ArrowUp, ArrowDown, Heart, Shield, Footprints, AlertTriangle, Star,
} from "lucide-react";

import { FieldLabel, TextInput, Select, NumberInput, StatField, ExpandableText } from "../../components/builder-controls";
import {
  createBlankAfty, AFTY_ATTRS, AFTY_TIPOS, AFTY_PATAMARES, AFTY_QNT_PE,
  AFTY_TECNICA_ATTRS, AFTY_TAMANHOS, AFTY_GRAUS_ITEM,
} from "./afty-schema";
import { AFTY_ORIGENS, getOrigem, origemTemDesenvolvimento } from "./afty-origens";
import { ANATOMIAS, getAnatomia, anatomiaTotal } from "./afty-anatomias";
import {
  ATTR_METODOS, VALORES_FIXOS, valoresFixosOk, rolarAtributos, resumoAtributos,
  desenvolvimentoTotal, desenvolvimentoUsado, POINT_BUY_MIN, POINT_BUY_MAX,
} from "./afty-atributos";
import {
  AFTY_TREINAMENTOS, ETAPAS_POR_LINHA, focosGastos, avaliarRequisito,
} from "./afty-treinamentos";
import {
  APTIDAO_TRILHAS, APTIDAO_NIVEL_MAX,
  aptidoesDaCategoria, subgruposDaCategoria, abasAptidao, avaliarRequisitoAptidao,
} from "./afty-aptidoes";
import {
  especializacoesDisponiveis, getEspecializacao, normalizeEspecializacoes, tipoObrigatorio,
} from "./afty-especializacoes";
import {
  gruposDeHabilidade, avaliarAcessoHabilidade, escolhasConcedidas, abasDeOpcoes,
} from "./afty-habilidades";
import { gruposDeTalento, avaliarAcessoTalento } from "./afty-talentos";
import {
  MELHORIAS_SUPERIORES, HABILIDADES_LENDARIAS, avaliarAcessoAltoNivel,
} from "./afty-alto-nivel";
import {
  createBlankInvocacao, cloneInvocacao, createBlankAcao, createBlankCaracteristica, createBlankHorda, AFTY_INV_GRAUS,
  grausDisponiveis, grauMeta, INV_ATRIBUTOS_POR_GRAU, INV_ATTR_MIN, mod as invMod,
  custoMaxAcao, tamanhosNaFaixa, lideresElegiveis, membrosElegiveis,
  alvosDanoDisponiveis, curaMultiplosDisponivel,
  INV_CUSTO_BENEFICIOS, INV_CUSTO_CONDICAO, resistenciasTreinaveis, usoPericias,
} from "./afty-invocacoes";
import { periciasParaInvocacao } from "./afty-pericias";
import { validateExpression } from "../../components/fm-dsl";
import { deriveAfty } from "./afty-derive";

/**
 * ============================================================
 * AftyCreatureBuilder — criador de criatura do Grimório Afty
 * ============================================================
 * Sistema PRÓPRIO (não é a 2.5.2). Mesma casca visual do app,
 * dividido em ABAS. Guarda só escolhas; os stats são derivados
 * por fórmula (deriveAfty), com coeficientes editáveis por ficha
 * na aba Cálculos.
 *
 * Estado desta base:
 *   • Reais: Identidade, Informações, Cálculos
 *   • Stubs: Habilidades, Especializações, Aptidões, Inventário,
 *            Treinamentos (próximos incrementos)
 * ============================================================
 */

const TABS = [
  { id: "identidade",    label: "Identidade" },
  { id: "informacoes",   label: "Informações" },
  { id: "habilidades",   label: "Habilidades" },
  { id: "especializacoes", label: "Especializações" },
  { id: "aptidoes",      label: "Aptidões" },
  { id: "invocacoes",    label: "Invocações" },
  { id: "inventario",    label: "Inventário" },
  { id: "interludios",   label: "Interlúdios" },
  { id: "calculos",      label: "Cálculos", afty: true },
];

const STUBS = {
  // ⚠ A aba Habilidades é de AÇÕES & CARACTERÍSTICAS. As Habilidades de
  // ESPECIALIZAÇÃO não moram aqui: elas ficam na aba Especializações, junto
  // dos chips (autor, 2026-07-17). Os nomes são parecidos, as abas não.
  habilidades: "Ações & Características (padrão do jogador). Edição detalhada nos próximos incrementos.",
  inventario: "Itens, equipar, espaços e consumíveis.",
};

export default function AftyCreatureBuilder({ existingCreature, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => {
    if (!existingCreature) return createBlankAfty();
    // Merge defensivo: os defaults do Afty preenchem lacunas de fichas
    // antigas/parciais sem descartar o que já existe (id, nome, etc.).
    const blank = createBlankAfty();
    return {
      ...blank,
      ...existingCreature,
      core: { ...blank.core, ...(existingCreature.core || {}) },
      attributes: { ...blank.attributes, ...(existingCreature.attributes || {}) },
      attrNivel: { ...blank.attrNivel, ...(existingCreature.attrNivel || {}) },
      attrLimite: { ...blank.attrLimite, ...(typeof existingCreature.attrLimite === "object" ? existingCreature.attrLimite : {}) },
      aptidoes: { ...blank.aptidoes, ...(existingCreature.aptidoes || {}) },
      formulaOverrides: { ...(existingCreature.formulaOverrides || {}) },
    };
  });
  const [tab, setTab] = useState("informacoes");

  const derived = useMemo(() => deriveAfty(draft), [draft]);
  const isEditing = !!existingCreature?.id;

  // ---------- patches imutáveis ----------
  const patch = (partial) => setDraft((d) => ({ ...d, ...partial }));
  const patchCore = (partial) => setDraft((d) => ({ ...d, core: { ...d.core, ...partial } }));
  const patchAttr = (key, val) =>
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [key]: val } }));
  const patchNivel = (key, val) =>
    setDraft((d) => ({ ...d, attrNivel: { ...d.attrNivel, [key]: val } }));

  // Aplica a escolha de bônus de origem e DEVOLVE ao pool os pontos de Nível que
  // passariam do limite — a origem tem prioridade sobre o Nível (dentro do limite).
  const setOrigemBonus = (bonusMap) =>
    setDraft((d) => {
      const limites = (d.attrLimite && typeof d.attrLimite === "object") ? d.attrLimite : {};
      const nextNivel = { ...d.attrNivel };
      for (const a of AFTY_ATTRS) {
        const base = d.attributes[a.key] || 0;
        const bonus = bonusMap[a.key] || 0;
        const lim = limites[a.key] ?? 20;
        const maxNivel = Math.max(0, lim - base - bonus);   // base+nível+bonus ≤ limite
        if ((nextNivel[a.key] || 0) > maxNivel) nextNivel[a.key] = maxNivel;
      }
      return {
        ...d,
        core: { ...d.core, origem: { ...d.core.origem, bonusAtributos: bonusMap } },
        attrNivel: nextNivel,
      };
    });

  // Trocar a origem invalida escolhas presas a ela. A Origem Restringido
  // força o TIPO Restringido, só dá acesso à Especialização Restringido e
  // proíbe multiclasse (autor, 2026-07-17), então a troca em qualquer
  // sentido passa as Especializações pelo filtro da origem nova em vez de
  // deixar uma escolha ilegal gravada. O normalize só descarta o que a
  // origem nova não permite: sair de Inato para Herdado preserva tudo.
  const setOrigemId = (id) =>
    setDraft((d) => ({
      ...d,
      core: { ...d.core, origem: { id }, tipo: tipoObrigatorio(id) ?? d.core.tipo },
      especializacoes: normalizeEspecializacoes(d.especializacoes, id),
    }));

  // Especializações: a ficha guarda { id, nivel }, mas o nível gravado é só
  // o PONTO DE DIVISÃO da multiclasse — quem resolve os níveis finais é
  // resolveEspecializacoes (soma sempre === ND). Ver afty-especializacoes.js.
  const setEspecializacoes = (lista) => setDraft((d) => ({ ...d, especializacoes: lista }));

  // Níveis de Aptidão: cada ponto do orçamento sobe 1 nível numa trilha.
  const setAptidaoNivel = (trilha, val) =>
    setDraft((d) => ({ ...d, aptidoes: { ...d.aptidoes, [trilha]: val } }));

  // Habilidades de Especialização: Base e por Nível gastam o MESMO orçamento
  // (1 + floor(ND/3)). Escolher não é bloqueado pelo orçamento, só pelo
  // requisito de nível — mesma postura das Aptidões.
  const toggleHabilidade = (id) =>
    setDraft((d) => {
      const atual = Array.isArray(d.habilidades) ? d.habilidades : [];
      return {
        ...d,
        habilidades: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
      };
    });

  // Talentos: mesmo orçamento das Habilidades de Especialização (são pegos no
  // lugar delas), mas acessíveis a qualquer classe.
  const toggleTalento = (id) =>
    setDraft((d) => {
      const atual = Array.isArray(d.talentos) ? d.talentos : [];
      return { ...d, talentos: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id] };
    });

  // Escolha aninhada de uma habilidade (Estilo de Controle, Melhoria...).
  // Alterna a opção na lista daquela habilidade. Guarda só a escolha; o
  // resolver (afty-habilidades.js) sanea e conta as vagas.
  const toggleEscolhaHabilidade = (habId, opcaoId) =>
    setDraft((d) => {
      const mapa = d.escolhasHabilidade && typeof d.escolhasHabilidade === "object" ? d.escolhasHabilidade : {};
      const atual = Array.isArray(mapa[habId]) ? mapa[habId] : [];
      const proxima = atual.includes(opcaoId) ? atual.filter((x) => x !== opcaoId) : [...atual, opcaoId];
      return { ...d, escolhasHabilidade: { ...mapa, [habId]: proxima } };
    });

  // Alto Nível (21+) · Melhoria Superior. A ficha guarda uma lista COM
  // repetição (cada entrada é uma escolha), então definir "vezes" é reescrever
  // as entradas daquele id. Quem apara no maxVezes é o resolver.
  const setMelhoriaVezes = (id, vezes) =>
    setDraft((d) => {
      const atual = Array.isArray(d.melhoriasSuperiores) ? d.melhoriasSuperiores : [];
      const outras = atual.filter((x) => x !== id);
      return { ...d, melhoriasSuperiores: [...outras, ...Array(Math.max(0, vezes)).fill(id)] };
    });

  // Alto Nível (21+) · Habilidade Lendária. Nenhuma repete, então é toggle.
  const toggleLendaria = (id) =>
    setDraft((d) => {
      const atual = Array.isArray(d.habilidadesLendarias) ? d.habilidadesLendarias : [];
      return {
        ...d,
        habilidadesLendarias: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
      };
    });

  // Escolha aninhada de alto nível (perícia, atributo, Teste de Resistência,
  // recurso do Inesgotável, Habilidade Ápice). Mesmo padrão do
  // toggleEscolhaHabilidade: guarda a escolha e o resolver sanea.
  const toggleEscolhaAltoNivel = (itemId, opcaoId) =>
    setDraft((d) => {
      const mapa = d.escolhasAltoNivel && typeof d.escolhasAltoNivel === "object" ? d.escolhasAltoNivel : {};
      const atual = Array.isArray(mapa[itemId]) ? mapa[itemId] : [];
      const proxima = atual.includes(opcaoId) ? atual.filter((x) => x !== opcaoId) : [...atual, opcaoId];
      return { ...d, escolhasAltoNivel: { ...mapa, [itemId]: proxima } };
    });

  // Aptidões Amaldiçoadas: escolher é de graça (o requisito é o que trava).
  const toggleAptidao = (id) =>
    setDraft((d) => {
      const atual = Array.isArray(d.aptidoesAmaldicoadas) ? d.aptidoesAmaldicoadas : [];
      return {
        ...d,
        aptidoesAmaldicoadas: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
      };
    });

  const treinosObj = (d) =>
    (d.treinamentos && !Array.isArray(d.treinamentos) && typeof d.treinamentos === "object") ? d.treinamentos : {};

  // Interlúdios · Treinamentos: define o progresso (0..4) de uma linha NÃO repetível.
  const setTreinoProgresso = (lineId, prog) =>
    setDraft((d) => {
      const next = { ...treinosObj(d) };
      if (prog > 0) next[lineId] = prog;
      else delete next[lineId];
      return { ...d, treinamentos: next };
    });

  // Linha REPETÍVEL: upsert/remove de uma instância (alvo distinto → progresso).
  const setTreinoInstance = (lineId, alvo, prog) =>
    setDraft((d) => {
      const cur = treinosObj(d);
      const list = Array.isArray(cur[lineId]) ? cur[lineId] : [];
      const key = String(alvo).trim().toLowerCase();
      let nextList;
      if (prog > 0) {
        nextList = list.some((it) => String(it.alvo).toLowerCase() === key)
          ? list.map((it) => (String(it.alvo).toLowerCase() === key ? { ...it, progresso: prog } : it))
          : [...list, { alvo: String(alvo).trim(), progresso: prog }];
      } else {
        nextList = list.filter((it) => String(it.alvo).toLowerCase() !== key);
      }
      const next = { ...cur };
      if (nextList.length) next[lineId] = nextList;
      else delete next[lineId];
      return { ...d, treinamentos: next };
    });

  // Invocações: cada uma é uma ficha própria em creature.invocacoes. O motor
  // (deriveAfty) resolve os stats lendo o dono. Aqui só editamos as escolhas.
  const invocacoesArr = (d) => (Array.isArray(d.invocacoes) ? d.invocacoes : []);
  const addInvocacao = (grau) =>
    setDraft((d) => ({ ...d, invocacoes: [...invocacoesArr(d), createBlankInvocacao(grau)] }));
  const removeInvocacao = (id) =>
    setDraft((d) => ({ ...d, invocacoes: invocacoesArr(d).filter((x) => x.id !== id) }));
  const duplicarInvocacao = (id) =>
    setDraft((d) => {
      const arr = invocacoesArr(d);
      const idx = arr.findIndex((x) => x.id === id);
      if (idx < 0) return d;
      const clone = cloneInvocacao(arr[idx]);
      clone.nome = arr[idx].nome ? `${arr[idx].nome} (cópia)` : "";
      const next = [...arr];
      next.splice(idx + 1, 0, clone);
      return { ...d, invocacoes: next };
    });
  const moverInvocacao = (id, dir) =>
    setDraft((d) => {
      const arr = [...invocacoesArr(d)];
      const idx = arr.findIndex((x) => x.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= arr.length) return d;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...d, invocacoes: arr };
    });
  const patchInvocacao = (id, partial) =>
    setDraft((d) => ({ ...d, invocacoes: invocacoesArr(d).map((x) => (x.id === id ? { ...x, ...partial } : x)) }));
  const patchInvocacaoAttr = (id, key, val) =>
    setDraft((d) => ({
      ...d,
      invocacoes: invocacoesArr(d).map((x) => (x.id === id ? { ...x, atributos: { ...x.atributos, [key]: val } } : x)),
    }));

  // Ações e Características vivem DENTRO de uma invocação. Um só helper edita o
  // array (acoes ou caracteristicas) da invocação certa.
  const patchInvLista = (invId, campo, fn) =>
    setDraft((d) => ({
      ...d,
      invocacoes: invocacoesArr(d).map((x) =>
        x.id === invId ? { ...x, [campo]: fn(Array.isArray(x[campo]) ? x[campo] : []) } : x
      ),
    }));
  const efeitosApi = (invId, campo, factory) => ({
    add: () => patchInvLista(invId, campo, (arr) => [...arr, factory()]),
    remove: (itemId) => patchInvLista(invId, campo, (arr) => arr.filter((it) => it.id !== itemId)),
    patch: (itemId, partial) => patchInvLista(invId, campo, (arr) => arr.map((it) => (it.id === itemId ? { ...it, ...partial } : it))),
  });

  // Hordas: cada uma referencia um líder + membros (por id) das invocações.
  const hordasArr = (d) => (Array.isArray(d.hordas) ? d.hordas : []);
  const addHorda = () => setDraft((d) => ({ ...d, hordas: [...hordasArr(d), createBlankHorda()] }));
  const removeHorda = (id) => setDraft((d) => ({ ...d, hordas: hordasArr(d).filter((x) => x.id !== id) }));
  const patchHorda = (id, partial) =>
    setDraft((d) => ({ ...d, hordas: hordasArr(d).map((x) => (x.id === id ? { ...x, ...partial } : x)) }));

  // Aba Cálculos: sobrescreve o VALOR FINAL de um stat (padrão StatField).
  const setStatOverride = (key, val) =>
    setDraft((d) => {
      const next = { ...(d.statOverrides || {}) };
      if (val == null) delete next[key];
      else next[key] = val;
      return { ...d, statOverrides: next };
    });

  const handleSave = () => {
    const creature = {
      ...draft,
      system: "afty",
      rulesVersion: "afty",
      // snapshot dos derivados para telas compartilhadas (dashboard/combate).
      // core.nd já é o campo do Afty — o Dashboard lê core.nd direto.
      stats: {
        hpMax: derived.hp,
        peMax: derived.pe,
        defesa: derived.defesa,
        cd: derived.cd,
      },
      combatState: {
        ...draft.combatState,
        hpCurrent: derived.hp,
        peCurrent: derived.pe,
        almaCurrent: draft.alma?.atual ?? 100,
      },
    };
    onSave(creature);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-2 min-w-0 order-last basis-full sm:order-none sm:basis-0 sm:flex-1">
            <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {isEditing ? "Editar Criatura" : "Nova Criatura"} · Afty
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {draft.name ? `"${draft.name}"` : "Ficha em branco"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold transition-colors bg-purple-700 hover:bg-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Salvar Alterações" : "Criar Ficha"}
          </button>
        </div>

        {/* Tab strip */}
        <div className="bg-slate-950/40 border-t border-slate-800/70">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar" role="tablist" aria-label="Seções">
              {TABS.map((t) => {
                const on = t.id === tab;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.id)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t.label}
                    {t.afty && (
                      <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"
                      }`}>Afty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ===== GRID ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* preview: no topo no mobile, à direita no desktop */}
        <aside className="order-first lg:order-last lg:col-span-1">
          <div className="lg:sticky lg:top-[104px]">
            <AftyPreview draft={draft} derived={derived} />
          </div>
        </aside>

        {/* formulário (aba ativa) */}
        <div className="lg:col-span-2 space-y-4">
          {tab === "identidade" && <TabIdentidade draft={draft} patch={patch} patchCore={patchCore} setOrigemBonus={setOrigemBonus} setOrigemId={setOrigemId} />}
          {tab === "informacoes" && <TabInformacoes draft={draft} derived={derived} patch={patch} patchCore={patchCore} patchAttr={patchAttr} patchNivel={patchNivel} />}
          {tab === "especializacoes" && <TabEspecializacoes draft={draft} derived={derived} setEspecializacoes={setEspecializacoes} toggleHabilidade={toggleHabilidade} toggleEscolhaHabilidade={toggleEscolhaHabilidade} toggleTalento={toggleTalento} setMelhoriaVezes={setMelhoriaVezes} toggleLendaria={toggleLendaria} toggleEscolhaAltoNivel={toggleEscolhaAltoNivel} />}
          {tab === "aptidoes" && <TabAptidoes draft={draft} derived={derived} setAptidaoNivel={setAptidaoNivel} toggleAptidao={toggleAptidao} />}
          {tab === "invocacoes" && <TabInvocacoes draft={draft} derived={derived} addInvocacao={addInvocacao} removeInvocacao={removeInvocacao} duplicarInvocacao={duplicarInvocacao} moverInvocacao={moverInvocacao} patchInvocacao={patchInvocacao} patchInvocacaoAttr={patchInvocacaoAttr} efeitosApi={efeitosApi} addHorda={addHorda} removeHorda={removeHorda} patchHorda={patchHorda} />}
          {tab === "interludios" && <TabInterludios draft={draft} derived={derived} setTreinoProgresso={setTreinoProgresso} setTreinoInstance={setTreinoInstance} />}
          {tab === "calculos" && <TabCalculos derived={derived} setStatOverride={setStatOverride} />}
          {STUBS[tab] && <StubCard title={TABS.find((t) => t.id === tab)?.label} text={STUBS[tab]} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Cartão / cabeçalho de seção — mesmo visual do builder 2.5.2  */
/* ============================================================ */
function Card({ title, children, headerRight }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {headerRight && <div className="ml-auto flex-shrink-0">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StubCard({ title, text }) {
  return (
    <Card title={title}>
      <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
        {text}
        <div className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-2 py-0.5">
          próximo incremento
        </div>
      </div>
    </Card>
  );
}

/* ============================================================ */
/* Aba: Identidade                                              */
/* ============================================================ */
function TabIdentidade({ draft, patch, patchCore, setOrigemBonus, setOrigemId }) {
  return (
    <Card title="Identidade">
      <div>
        <FieldLabel required>Nome</FieldLabel>
        <TextInput value={draft.name} onChange={(v) => patch({ name: v })} placeholder="Nome da criatura" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <FieldLabel hint="afeta deslocamento e alcance">Tamanho</FieldLabel>
          <Select value={draft.core.tamanho} onChange={(v) => patchCore({ tamanho: v })} options={AFTY_TAMANHOS} />
        </div>
        <div>
          <FieldLabel hint="escolha imutável na criação">Origem</FieldLabel>
          <Select
            value={draft.core.origem?.id}
            onChange={(v) => setOrigemId(v)}
            options={AFTY_ORIGENS}
          />
        </div>
      </div>

      <OrigemInfo draft={draft} patchCore={patchCore} setOrigemBonus={setOrigemBonus} />

      <div className="mt-4">
        <FieldLabel hint="URL da imagem (opcional)">Retrato</FieldLabel>
        <TextInput value={draft.portraitUrl} onChange={(v) => patch({ portraitUrl: v })} placeholder="https://..." />
      </div>
    </Card>
  );
}

/* Rótulo de uma concessão de origem (Talento / Feitiço / Aptidão Amaldiçoada). */
function grantLabel(g) {
  switch (g.tipo) {
    case "talento": return `${g.quantidade} Talento${g.ndMin > 1 ? ` (ND ≥ ${g.ndMin})` : ""}`;
    case "feitico": return `${g.quantidade} Feitiço −${g.custoPEReduzido} PE`;
    case "aptidao_amaldicoada": return `${g.quantidade} Aptidão Amaldiçoada${g.categoria ? ` de ${g.categoria}` : ""}`;
    case "pericia_treinada": return `${g.quantidade} Perícia${g.quantidade > 1 ? "s" : ""} treinada${g.quantidade > 1 ? "s" : ""}`;
    default: return `${g.quantidade} ${g.tipo}`;
  }
}

/* Card da origem selecionada: raridade, resumo, características e — quando a
   origem tem bônus de atributo ESCOLHÍVEL — os seletores +2/+1. */
function OrigemInfo({ draft, patchCore, setOrigemBonus }) {
  const id = draft.core.origem?.id;
  const origem = getOrigem(id);
  if (!origem) return null;
  const rara = origem.raridade === "rara";
  const fixedBonus = Object.entries(origem.bonusAtributos || {});

  const bonusMap = draft.core.origem?.bonusAtributos || {};
  const attrForPoints = (p) => Object.entries(bonusMap).find(([, v]) => v === p)?.[0] || "";
  const setSlot = (points, attrKey) => {
    const cur = { ...bonusMap };
    for (const k of Object.keys(cur)) if (cur[k] === points) delete cur[k];
    if (attrKey) cur[attrKey] = points;
    setOrigemBonus(cur); // aplica e devolve pontos de Nível que passariam do limite
  };
  // Bônus de distribuir N pontos (máx M por atributo) — ex.: Sem Técnica (4, máx 3).
  const distribUsado = Object.values(bonusMap).reduce((s, v) => s + v, 0);
  const setDistrib = (key, val) => {
    const cur = { ...bonusMap };
    if (val > 0) cur[key] = val; else delete cur[key];
    setOrigemBonus(cur);
  };
  // Características de Anatomia (Feto): escolhe 1 + 1 a cada 5 níveis.
  const anatomiasSel = draft.core.origem?.anatomias || [];
  const anatTotal = anatomiaTotal(draft.core.nd ?? 1);
  const toggleAnatomia = (aid) => {
    const cur = anatomiasSel.includes(aid) ? anatomiasSel.filter((x) => x !== aid) : [...anatomiasSel, aid];
    patchCore({ origem: { ...draft.core.origem, anatomias: cur } });
  };
  const optionsFor = (p) => {
    const usedByOthers = Object.entries(bonusMap).filter(([, v]) => v !== p).map(([k]) => k);
    return AFTY_TECNICA_ATTRS.filter((o) => !usedByOthers.includes(o.value));
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-white">{origem.nome}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
          rara ? "text-amber-300 border-amber-800 bg-amber-950/40" : "text-slate-400 border-slate-700 bg-slate-800/50"
        }`}>
          {rara ? "Rara" : "Comum"}
        </span>
        {origem.id === "restringido" && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border text-purple-300 border-purple-800 bg-purple-950/40">
            destrava Especialização exclusiva
          </span>
        )}
      </div>

      {origem.resumo && <p className="text-xs text-slate-400 mt-2">{origem.resumo}</p>}

      {origem.restricoes?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {origem.restricoes.map((r, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border border-rose-900/60 text-rose-300/80 bg-rose-950/20">{r}</span>
          ))}
        </div>
      )}

      {/* bônus fixo (origens sem escolha) */}
      {fixedBonus.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Bônus de Atributos</div>
          <div className="flex flex-wrap gap-1.5">
            {fixedBonus.map(([k, v]) => (
              <span key={k} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                {k} {v >= 0 ? `+${v}` : v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* características */}
      {origem.caracteristicas.length > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Características de Origem</div>
          {origem.caracteristicas.map((c) => (
            <div key={c.id} className="border-l-2 border-slate-800 pl-2.5">
              <div className="text-xs font-semibold text-slate-200">{c.nome}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{c.descricao}</p>

              {/* seletor de bônus escolhível */}
              {c.bonus?.escolhaDoJogador && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.bonus.pontos.map((p) => (
                    <div key={p} className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-purple-300 whitespace-nowrap">+{p} em</span>
                      <div className="w-36">
                        <Select value={attrForPoints(p)} onChange={(v) => setSlot(p, v)} options={optionsFor(p)} placeholder="escolher..." />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* alocador: distribuir N pontos (máx M por atributo) — ex.: Sem Técnica */}
              {c.bonus?.distribuir && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Distribuir · máx {c.bonus.maxPorAtributo}/atributo</span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">{distribUsado} / {c.bonus.distribuir}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {AFTY_ATTRS.map((a) => {
                      const val = bonusMap[a.key] || 0;
                      const max = Math.min(c.bonus.maxPorAtributo, val + (c.bonus.distribuir - distribUsado));
                      return (
                        <div key={a.key} className="flex items-center justify-between gap-1.5 bg-slate-950/50 border border-slate-800 rounded px-2 py-1">
                          <span className="text-[11px] font-bold text-slate-400">{a.abbr}</span>
                          <div className="w-[84px]">
                            <NumberInput value={val} onChange={(v) => setDistrib(a.key, v)} min={0} max={max} aria-label={`Bônus em ${a.label}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* seletor de Características de Anatomia (Físico Amaldiçoado) */}
              {c.poolAnatomia && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Características de Anatomia</span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">{anatomiasSel.length} / {anatTotal}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ANATOMIAS.map((an) => {
                      const sel = anatomiasSel.includes(an.id);
                      const full = anatomiasSel.length >= anatTotal;
                      return (
                        <button
                          key={an.id}
                          type="button"
                          title={an.descricao}
                          disabled={!sel && full}
                          onClick={() => toggleAnatomia(an.id)}
                          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                            sel
                              ? "bg-purple-800/50 border-purple-700 text-purple-100"
                              : full
                                ? "border-slate-800 text-slate-600 cursor-not-allowed"
                                : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                          }`}
                        >
                          {an.nome}
                        </button>
                      );
                    })}
                  </div>
                  {anatomiasSel.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {anatomiasSel.map((aid) => {
                        const an = getAnatomia(aid);
                        if (!an) return null;
                        return (
                          <div key={aid} className="text-[11px] leading-relaxed border-l-2 border-purple-900/50 pl-2">
                            <span className="text-slate-200 font-semibold">{an.nome}.</span>{" "}
                            <span className="text-slate-400">{an.descricao}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* concessões (Talento / Feitiço / Aptidão / Perícia) — seletor virá quando os catálogos existirem */}
              {c.grants && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.grants.map((g, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border border-amber-800/60 text-amber-300/90 bg-amber-950/20">
                      {grantLabel(g)}
                    </span>
                  ))}
                </div>
              )}

              {/* lembrete roxo: característica com continuação a fazer depois */}
              {c.continuacao && (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-purple-300 bg-purple-950/30 border border-purple-800/60 rounded px-2 py-1.5">
                  <span aria-hidden="true">✎</span>
                  <span>Continuação pendente — completar na aba de Habilidades.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* Aba: Informações (nível, tipo, atributos)                   */
/* ============================================================ */
/* Card de Atributos: método + trackers + controles por método + pool de nível. */
function AttributesCard({ draft, derived, patch, patchCore, patchAttr, patchNivel }) {
  const metodo = draft.attrMethod || "pontos";
  const limites = (draft.attrLimite && typeof draft.attrLimite === "object") ? draft.attrLimite : {};
  const resumo = resumoAtributos(draft);
  const nivelRestante = resumo.nivelTotal - resumo.nivelUsado;
  const somaBase = AFTY_ATTRS.reduce((s, a) => s + (draft.attributes[a.key] || 0), 0);

  // Desenvolvimento Inesperado (Derivado): pool que dá +1 valor e +1 limite.
  const temDesenv = origemTemDesenvolvimento(draft.core.origem?.id);
  const desenv = draft.core.origem?.desenvolvimento || {};
  const desenvTotal = desenvolvimentoTotal(draft.core.nd ?? 1);
  const desenvUsado = desenvolvimentoUsado(desenv);
  const desenvRestante = desenvTotal - desenvUsado;
  const setDesenv = (key, val) => {
    const cur = { ...desenv };
    if (val) cur[key] = val; else delete cur[key];
    patchCore({ origem: { ...draft.core.origem, desenvolvimento: cur } });
  };

  // Valores Fixos SEM travar: todo dropdown mostra os 6 valores. Escolher um
  // que já está em outro atributo TROCA os dois — o array fica sempre válido,
  // sem beco sem saída.
  const fixosOptions = [...VALORES_FIXOS].sort((x, y) => y - x).map((v) => ({ value: String(v), label: String(v) }));
  const setFixo = (key, valStr) => {
    const v = parseInt(valStr, 10);
    const cur = { ...draft.attributes };
    const old = cur[key];
    if (old === v) return;
    const other = AFTY_ATTRS.find((a) => a.key !== key && cur[a.key] === v);
    cur[key] = v;
    if (other) cur[other.key] = old; // troca
    patch({ attributes: cur });
  };
  // Ao entrar em "Valores Fixos", já preenche o array padrão se ainda não for válido.
  const setMetodo = (v) => {
    if (v === "fixos" && !valoresFixosOk(draft.attributes)) {
      const filled = { ...draft.attributes };
      AFTY_ATTRS.forEach((a, i) => { filled[a.key] = VALORES_FIXOS[i]; });
      patch({ attrMethod: v, attributes: filled });
    } else {
      patch({ attrMethod: v });
    }
  };

  return (
    <Card title="Atributos">
      <div className="sm:max-w-xs">
        <FieldLabel hint="limite é por atributo, no card de cada um">Método</FieldLabel>
        <Select value={metodo} onChange={setMetodo} options={ATTR_METODOS} />
      </div>

      {/* trackers */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {metodo === "pontos" && (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded border ${
            resumo.pointBuyGasto > resumo.pointBuyTotal ? "text-red-300 border-red-800 bg-red-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
          }`}>
            Compra: {resumo.pointBuyGasto} / {resumo.pointBuyTotal} pts
          </span>
        )}
        {metodo === "fixos" && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded border text-slate-300 border-slate-700 bg-slate-800/50">
            Distribua: 15, 14, 13, 12, 10, 8
          </span>
        )}
        {metodo === "rolagem" && (
          <button
            type="button"
            onClick={() => patch({ attributes: rolarAtributos() })}
            className="text-[11px] font-semibold px-2.5 py-1 rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50"
          >
            🎲 Rolar 4d6 (todos)
          </button>
        )}
        <span className={`text-[11px] font-semibold px-2 py-1 rounded border ${
          resumo.nivelUsado > resumo.nivelTotal ? "text-red-300 border-red-800 bg-red-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
        }`}>
          Pontos de nível: {resumo.nivelUsado} / {resumo.nivelTotal}
        </span>
        {metodo === "rolagem" && (
          <span className="text-[10px] font-mono text-slate-500" title="Soma dos valores base (o array fixo, de referência, soma 72)">
            (soma {somaBase})
          </span>
        )}
      </div>

      {/* avisos */}
      {resumo.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {resumo.warnings.map((w, i) => (
            <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5">
              <span aria-hidden="true">⚠</span> {w}
            </li>
          ))}
        </ul>
      )}

      {/* tabela compacta de atributos */}
      <div className="mt-3 border border-slate-800 rounded-lg overflow-hidden">
        {/* cabeçalho (desktop) */}
        <div className="hidden sm:grid grid-cols-[1.4fr_1.1fr_1.1fr_0.8fr_0.6fr] gap-3 px-3 py-2 bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Atributo</span>
          <span className="text-center">Base</span>
          <span className="text-center">Nível</span>
          <span className="text-center">Efetivo</span>
          <span className="text-center">Limite</span>
        </div>

        {AFTY_ATTRS.map((a) => {
          const base = draft.attributes[a.key];
          const niv = draft.attrNivel?.[a.key] || 0;
          const lim = limites[a.key] ?? 20;           // limite base (teto do pool de nível)
          const effLim = derived.attrLimiteEfetivo[a.key]; // limite efetivo (com Desenvolvimento)
          const efetivo = derived.attrEff[a.key];     // valor EFETIVO (base+nível+desenv+origem)
          const m = derived.mods[a.key];              // modificador EFETIVO
          const bonus = derived.attrBonus[a.key] || 0;
          const dev = derived.attrDesenv[a.key] || 0;
          // Nível reserva espaço pra origem: base + nível + bônus ≤ limite base.
          const nivMax = Math.max(niv, Math.min(niv + nivelRestante, lim - base - bonus));
          const miniLbl = "text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:hidden";
          return (
            <div
              key={a.key}
              className="grid grid-cols-2 sm:grid-cols-[1.4fr_1.1fr_1.1fr_0.8fr_0.6fr] gap-x-3 gap-y-3 items-center px-3 py-3 border-t border-slate-800"
            >
              {/* atributo */}
              <div className="col-span-2 sm:col-span-1 min-w-0">
                <div className="text-[13px] text-slate-300 truncate">
                  <span className="text-white font-bold">{a.abbr}</span> {a.label}
                </div>
                {(bonus > 0 || dev > 0) && (
                  <div className="flex gap-2 mt-0.5">
                    {bonus > 0 && <span className="text-[9px] text-emerald-400">+{bonus} Origem</span>}
                    {dev > 0 && <span className="text-[9px] text-slate-400">+{dev} Desenv</span>}
                  </div>
                )}
              </div>

              {/* base */}
              <div className="flex flex-col gap-1">
                <span className={miniLbl}>Base</span>
                {metodo === "fixos" ? (
                  <Select value={String(base)} onChange={(v) => setFixo(a.key, v)} options={fixosOptions} />
                ) : (
                  <NumberInput
                    value={base}
                    onChange={(v) => patchAttr(a.key, v)}
                    min={metodo === "pontos" ? POINT_BUY_MIN : 0}
                    max={metodo === "pontos" ? POINT_BUY_MAX : 30}
                    aria-label={`${a.label} base`}
                  />
                )}
              </div>

              {/* nível */}
              <div className="flex flex-col gap-1">
                <span className={miniLbl}>Nível</span>
                <NumberInput value={niv} onChange={(v) => patchNivel(a.key, v)} min={0} max={nivMax} aria-label={`${a.label} pontos de nível`} />
              </div>

              {/* efetivo */}
              <div className="flex flex-col gap-0.5 sm:items-center">
                <span className={miniLbl}>Efetivo</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-extrabold text-lg text-white tabular-nums leading-none">{efetivo}</span>
                  <span className="font-mono text-[11px] text-purple-300">{m >= 0 ? `+${m}` : m}</span>
                </div>
              </div>

              {/* limite (efetivo: base + Desenvolvimento) */}
              <div className="flex flex-col gap-0.5 sm:items-center">
                <span className={miniLbl}>Limite</span>
                <span className={`font-mono text-sm tabular-nums ${dev > 0 ? "text-slate-300" : "text-slate-400"}`}>{effLim}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desenvolvimento Inesperado (Derivado) — pool que sobe valor + limite */}
      {temDesenv && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Desenvolvimento Inesperado
              <span className="normal-case tracking-normal text-slate-500 ml-1.5">· +1 no valor e no limite por ponto</span>
            </div>
            <span className={`text-[11px] font-mono tabular-nums ${desenvUsado > desenvTotal ? "text-red-400" : "text-slate-400"}`}>
              {desenvUsado} / {desenvTotal}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AFTY_ATTRS.map((a) => {
              const d = desenv[a.key] || 0;
              return (
                <div key={a.key} className="flex items-center justify-between gap-2 bg-slate-950/50 border border-slate-800 rounded px-2 py-1.5">
                  <span className="text-[11px] font-bold text-slate-400">{a.abbr}</span>
                  <div className="w-[92px]">
                    <NumberInput value={d} onChange={(v) => setDesenv(a.key, v)} min={0} max={d + desenvRestante} aria-label={`Desenvolvimento em ${a.label}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function TabInformacoes({ draft, derived, patch, patchCore, patchAttr, patchNivel }) {
  // A Origem Restringido força o Tipo (e a Especialização) em Restringido.
  // É o único ponto em que os dois eixos se tocam: fora dele, Tipo e
  // Especialização são independentes, apesar de compartilharem nomes.
  const tipoTravado = tipoObrigatorio(draft.core.origem?.id);
  return (
    <>
      <Card title="Valores Básicos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Nível (ND)</FieldLabel>
            <NumberInput value={draft.core.nd} onChange={(v) => patchCore({ nd: v })} min={3} />
          </div>
          <div>
            <FieldLabel required hint={tipoTravado ? "definido pela Origem Restringido" : undefined}>Tipo</FieldLabel>
            <Select
              value={draft.core.tipo}
              onChange={(v) => patchCore({ tipo: v })}
              options={AFTY_TIPOS}
              disabled={!!tipoTravado}
            />
          </div>
          <div>
            <FieldLabel required>Patamar</FieldLabel>
            <Select value={draft.core.patamar} onChange={(v) => patchCore({ patamar: v })} options={AFTY_PATAMARES} />
          </div>
          <div>
            <FieldLabel>Quantidade de PE</FieldLabel>
            <Select value={draft.qntPE} onChange={(v) => patch({ qntPE: v })} options={AFTY_QNT_PE} />
          </div>
          <div>
            <FieldLabel>Integridade da Alma</FieldLabel>
            <NumberInput value={draft.alma.atual} onChange={(v) => patch({ alma: { ...draft.alma, atual: v } })} min={0} />
          </div>
          <div>
            <FieldLabel>Atributo da Técnica</FieldLabel>
            <Select value={draft.core.tecnicaAttr} onChange={(v) => patchCore({ tecnicaAttr: v })} options={AFTY_TECNICA_ATTRS} />
          </div>
          <div>
            <FieldLabel>Maestria</FieldLabel>
            <div className="h-9 bg-slate-950/60 border border-slate-800 rounded px-3 flex items-center text-sm font-mono text-purple-300">
              +{derived.maestria}
            </div>
          </div>
        </div>

        {/* orçamento de Aptidão (o de Atributos vive no card abaixo) */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 inline-block">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Níveis de Aptidão</div>
            <div className="text-lg font-mono font-bold text-white">{derived.totalAptidao}</div>
          </div>
        </div>
      </Card>

      <AttributesCard draft={draft} derived={derived} patch={patch} patchCore={patchCore} patchAttr={patchAttr} patchNivel={patchNivel} />

      <Card title="Grau de Item Equipado">
        <p className="text-xs text-slate-400 mb-3">
          Temporário — virá da aba Inventário. O grau entra em Defesa e RD.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="bônus de Defesa">Grau (Defesa)</FieldLabel>
            <Select value={draft.inventario.defesaGrau} onChange={(v) => patch({ inventario: { ...draft.inventario, defesaGrau: v } })} options={AFTY_GRAUS_ITEM} />
          </div>
          <div>
            <FieldLabel hint="bônus de RD">Grau (RD)</FieldLabel>
            <Select value={draft.inventario.rdGrau} onChange={(v) => patch({ inventario: { ...draft.inventario, rdGrau: v } })} options={AFTY_GRAUS_ITEM} />
          </div>
        </div>
      </Card>
    </>
  );
}

/* ============================================================ */
/* Aba: Interlúdios (Treinamentos + focos de interlúdio)       */
/* ============================================================ */
/* Cena de interlúdio: pausa entre missões. O personagem escolhe
   focos (2 por interlúdio, mais a critério do Mestre). Foco em
   Treinamento avança linhas sequenciais; Estudos e Treinamento
   para Habilidade dependem de sistemas ainda não construídos. */

/* Requisito: TEXTO PURO, sem caixa. A caixa (borda + fundo + padding)
   custava largura em cada um, e com 5 requisitos comia a linha inteira.
   O destaque agora é a própria cor mais o cadeado:

     falta       → roxo + cadeado
     atendido    → cinza, sem ícone (legível para consulta, sem gritar)

   Separador fica com o pai (RequisitoLista), porque sem caixa os
   requisitos encostariam um no outro. */
function RequisitoChip({ req }) {
  if (!req?.label) return null;
  const atendido = req.verificavel && req.ok;
  // Primeira letra sempre maiúscula (regra do autor). Cobre também o id cru
  // de uma aptidão ainda não transcrita, que vem em snake_case.
  const label = req.label.charAt(0).toUpperCase() + req.label.slice(1);
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap ${
        atendido ? "text-slate-600" : "text-purple-300"
      }`}
      title={req.titulo || (req.verificavel ? undefined : "Requisito de sistema ainda não construído, não validado aqui")}
    >
      {!atendido && <Lock className="w-2.5 h-2.5 flex-shrink-0" />}
      {label}
    </span>
  );
}

/* Lista de requisitos separada por ponto médio. */
function RequisitoLista({ reqs }) {
  if (!reqs?.length) return null;
  return (
    <span className="flex items-center gap-1 flex-shrink-0">
      {reqs.map((r, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-700 text-[10px]" aria-hidden="true">·</span>}
          <RequisitoChip req={r} />
        </React.Fragment>
      ))}
    </span>
  );
}

/* Indicador compacto de progresso: N segmentos preenchidos. */
function ProgressoSegmentos({ progresso, total }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 w-3.5 rounded-full ${i < progresso ? "bg-purple-500" : "bg-slate-700"}`} />
      ))}
    </div>
  );
}

/* As 4 etapas (linha do tempo) + bônus de Completo de uma instância.
   `onSet(prog)` grava o novo progresso (bindado à linha/instância certa).
   `readOnly` = prévia só para consulta (sem ações, tudo em estado neutro). */
function TreinoEtapas({ linha, progresso, attrEff, nd, onSet, readOnly = false }) {
  const completa = !readOnly && progresso >= ETAPAS_POR_LINHA;
  return (
    <>
      <div className="pl-1.5 space-y-0.5">
        {linha.etapas.map((et) => {
          const done = !readOnly && et.n <= progresso;
          const isNext = !readOnly && et.n === progresso + 1;
          const locked = !readOnly && et.n > progresso + 1;
          const req = avaliarRequisito(et.requisito, { attrEff, nd });
          const blocked = isNext && !req.ok; // só requisito de atributo bloqueia
          const isTop = done && et.n === progresso; // última concluída (desfazível)

          return (
            <div key={et.n} className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 ${isNext ? "bg-slate-900/50" : ""}`}>
              {/* círculo (centralizado no corpo da etapa) */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                done ? "bg-purple-700 text-white"
                : isNext ? "border border-slate-500 text-slate-300"
                : readOnly ? "border border-slate-600 text-slate-400"
                : "border border-slate-700 text-slate-600"
              }`}>
                {done ? <Check className="w-3 h-3" /> : et.n}
              </div>

              {/* corpo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-h-[20px]">
                  <span className={`text-[11px] font-semibold ${locked ? "text-slate-500" : "text-slate-200"}`}>
                    {et.n}ª Etapa
                  </span>
                  <span className="text-[10px] text-slate-500">{et.focos} Foco{et.focos > 1 ? "s" : ""}</span>
                  {!done && <RequisitoChip req={req} />}
                </div>
                <p className={`text-[11px] leading-snug mt-1 ${locked ? "text-slate-500" : "text-slate-400"}`}>
                  {et.beneficio}
                </p>
              </div>

              {/* ação (some na prévia) */}
              <div className="flex-shrink-0">
                {!readOnly && isNext && (
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => onSet(et.n)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border transition-colors ${
                      blocked
                        ? "border-slate-800 text-slate-600 cursor-not-allowed"
                        : "border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50"
                    }`}
                    title={blocked ? `Requisito não atendido: ${req.label}` : "Concluir esta etapa"}
                  >
                    Treinar <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {!readOnly && isTop && (
                  <button
                    type="button"
                    onClick={() => onSet(progresso - 1)}
                    className="text-[11px] text-slate-500 hover:text-slate-300 px-1"
                    title="Desfazer esta etapa"
                  >
                    Desfazer
                  </button>
                )}
                {!readOnly && locked && <Lock className="w-3 h-3 text-slate-700" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* bônus de treinamento completo — sempre visível (consulta), mudo até concluir */}
      <div className={`mt-2 ml-1.5 rounded-md border-l-2 px-3 py-2.5 ${
        completa ? "border-purple-700 bg-purple-950/20" : "border-slate-700 bg-slate-950/30"
      }`}>
        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${completa ? "text-purple-300" : "text-slate-500"}`}>
          Treinamento Completo
        </div>
        <p className={`text-[11px] leading-relaxed ${completa ? "text-purple-100/90" : "text-slate-400"}`}>
          {linha.completo.beneficio}
        </p>
        {linha.completo.detalhe && (
          <div className="mt-1.5">
            <ExpandableText text={linha.completo.detalhe} />
          </div>
        )}
      </div>
    </>
  );
}

/* Rótulo do alvo de uma instância repetível (atributo → nome; texto → literal). */
function alvoLabelDe(linha, alvo) {
  if (linha.alvoTipo === "atributo") return AFTY_ATTRS.find((a) => a.key === alvo)?.label ?? alvo;
  return alvo;
}

/* Uma Linha de Treinamento. Não repetível → uma trilha só. Repetível → várias
   instâncias, cada uma com um alvo distinto (atributo/perícia/arma). */
function TreinoLinha({ linha, valor, attrEff, nd, onSetProgresso, onSetInstance }) {
  const repetivel = !!linha.repetivel;
  const progresso = repetivel ? 0 : (Number(valor) || 0);
  const completa = !repetivel && progresso >= ETAPAS_POR_LINHA;
  const instances = repetivel && Array.isArray(valor) ? valor : [];
  const ativo = repetivel ? instances.length > 0 : progresso > 0;

  const [open, setOpen] = useState(repetivel ? instances.length > 0 : (progresso > 0 && !completa));
  const [novoTexto, setNovoTexto] = useState("");

  const usados = new Set(instances.map((it) => String(it.alvo).toLowerCase()));
  const attrOptions = AFTY_ATTRS.filter((a) => !usados.has(a.key.toLowerCase())).map((a) => ({ value: a.key, label: a.label }));
  const textoDup = !!novoTexto.trim() && usados.has(novoTexto.trim().toLowerCase());
  const addTexto = () => {
    const v = novoTexto.trim();
    if (!v || usados.has(v.toLowerCase())) return;
    onSetInstance(linha.id, v, 1);
    setNovoTexto("");
  };

  return (
    <div className={`rounded-lg border bg-slate-950/40 ${ativo ? "border-slate-700/80" : "border-slate-800"}`}>
      {/* cabeçalho */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="text-sm font-semibold text-white flex-1 min-w-0 truncate">{linha.nome}</span>
        {repetivel ? (
          instances.length > 0 ? (
            <span className="text-[11px] font-mono text-slate-400 tabular-nums flex-shrink-0">
              {instances.length} treino{instances.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 flex-shrink-0">
              Repetível
            </span>
          )
        ) : (
          <span className="flex items-center gap-2 flex-shrink-0">
            <ProgressoSegmentos progresso={completa ? ETAPAS_POR_LINHA : progresso} total={ETAPAS_POR_LINHA} />
            {completa ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-300 w-16 justify-end">
                <Check className="w-3 h-3" /> Completo
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-400 tabular-nums w-16 text-right">{progresso}/{ETAPAS_POR_LINHA}</span>
            )}
          </span>
        )}
      </button>

      {/* corpo */}
      {open && (
        <div className="px-3 pb-3 -mt-0.5">
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5 pl-6">{linha.resumo}</p>

          {repetivel ? (
            <div className="space-y-2.5">
              {/* instâncias (um treino por alvo) */}
              {instances.map((inst) => {
                const instCompleta = inst.progresso >= ETAPAS_POR_LINHA;
                return (
                  <div key={inst.alvo} className="rounded-md border border-slate-700/80 bg-slate-900/30 p-2">
                    {/* cabeçalho da instância: mesma anatomia da linha (alvo + segmentos + estado) */}
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
                      <span className="text-[11px] font-bold text-purple-200 flex-1 min-w-0 truncate">
                        {alvoLabelDe(linha, inst.alvo)}
                      </span>
                      <ProgressoSegmentos progresso={inst.progresso} total={ETAPAS_POR_LINHA} />
                      {instCompleta ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-300 w-16 justify-end">
                          <Check className="w-3 h-3" /> Completo
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums w-16 text-right">
                          {inst.progresso}/{ETAPAS_POR_LINHA}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onSetInstance(linha.id, inst.alvo, 0)}
                        className="text-slate-600 hover:text-rose-300 p-0.5 rounded flex-shrink-0"
                        title={`Remover treino de ${alvoLabelDe(linha, inst.alvo)}`}
                        aria-label={`Remover treino de ${alvoLabelDe(linha, inst.alvo)}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TreinoEtapas
                      linha={linha}
                      progresso={inst.progresso}
                      attrEff={attrEff}
                      nd={nd}
                      onSet={(p) => onSetInstance(linha.id, inst.alvo, p)}
                    />
                  </div>
                );
              })}

              {/* sem treinos ainda: prévia consultável das etapas + Completo */}
              {instances.length === 0 && (
                <TreinoEtapas linha={linha} progresso={0} attrEff={attrEff} nd={nd} readOnly />
              )}

              {/* zona de adicionar novo alvo */}
              <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-700 bg-slate-950/30 px-2.5 py-2">
                <Plus className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {linha.alvoTipo === "atributo" ? (
                  attrOptions.length > 0 ? (
                    <div className="w-44">
                      <Select
                        value=""
                        onChange={(v) => v && onSetInstance(linha.id, v, 1)}
                        options={attrOptions}
                        placeholder={`Treinar ${(linha.alvoLabel || "alvo").toLowerCase()}...`}
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Todos os atributos já foram treinados.</span>
                  )
                ) : (
                  <>
                    <div className="w-44">
                      <TextInput
                        value={novoTexto}
                        onChange={setNovoTexto}
                        placeholder={`${linha.alvoLabel || "Alvo"}...`}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTexto(); } }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTexto}
                      disabled={!novoTexto.trim() || textoDup}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={textoDup ? "Alvo já treinado" : "Adicionar treino"}
                    >
                      Adicionar
                    </button>
                    {textoDup && <span className="text-[10px] text-rose-300/80">já treinado</span>}
                  </>
                )}
              </div>
            </div>
          ) : (
            <TreinoEtapas
              linha={linha}
              progresso={progresso}
              attrEff={attrEff}
              nd={nd}
              onSet={(p) => onSetProgresso(linha.id, p)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* Card informativo recolhível de um foco de interlúdio que depende de
   sistema ainda não construído (Estudos, Treinamento para Habilidade). */
function InterludioInfo({ icon: Icon, titulo, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-200 flex-1 min-w-0 truncate">{titulo}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0">
          em breve
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 text-[11px] text-slate-400 leading-relaxed">{children}</div>
      )}
    </div>
  );
}

/* ============================================================ */
/* Aba: Aptidões (Níveis de Aptidão + Aptidões Amaldiçoadas)   */
/* ============================================================ */

/**
 * Seletor de Nível de Aptidão (0 a 5). Segmentado em vez de stepper:
 * a faixa é curta, então os 6 valores cabem numa linha, o teto da
 * trilha fica visível e chegar a qualquer nível custa um clique.
 *
 * Os botões são o nível EFETIVO (o número que vale na mesa), não o
 * alocado — é o que o jogador procura. Preenche 1..N como medidor,
 * porque nível é magnitude, não categoria.
 *
 * Três estados de segmento:
 *   • roxo    = alocado, pago com orçamento.
 *   • verde   = concedido (Treinamento/Origem/Habilidade), grátis e
 *               travado: é piso, não dá para vender de volta.
 *   • apagado = vazio. Desabilitado quando o orçamento não paga.
 *
 * `flex-1` em vez de largura fixa: o seletor se adapta à célula do
 * grid, então as 5 trilhas ficam lado a lado no desktop e reempilham
 * sozinhas quando a tela aperta.
 */
function NivelPicker({ value, concedido, restante, onChange, label }) {
  const efetivo = value + concedido;
  // Sempre dá para baixar até o piso concedido (inclusive se a ficha já
  // estourou o orçamento). Subir respeita o que sobra e o teto da trilha.
  const alcancavel = Math.max(efetivo, Math.min(APTIDAO_NIVEL_MAX, efetivo + restante));
  return (
    <div className="flex gap-px w-full" role="group" aria-label={label}>
      {Array.from({ length: APTIDAO_NIVEL_MAX + 1 }, (_, n) => {
        const ehConcedido = n >= 1 && n <= concedido;
        const preenchido = n > concedido && n <= efetivo;
        const zeroAtivo = n === 0 && efetivo === 0;
        // Abaixo do piso concedido não dá para descer. Acima, o orçamento manda.
        const pode = n >= concedido && n <= alcancavel;
        const motivo = n < concedido ? "Nível concedido, não pode ser removido"
          : !pode ? "Orçamento de níveis insuficiente" : undefined;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(Math.max(0, n - concedido))}
            disabled={!pode}
            aria-pressed={n === efetivo}
            title={motivo}
            className={`flex-1 min-w-0 h-7 rounded text-[11px] font-mono font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
              ehConcedido
                ? "bg-emerald-800 text-emerald-100 cursor-not-allowed"
                : preenchido
                  ? "bg-purple-700 text-white"
                  : zeroAtivo
                    ? "bg-slate-700 text-slate-300"
                    : pode
                      ? "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white"
                      : "bg-slate-900/50 text-slate-700 cursor-not-allowed"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/* Uma Aptidão Amaldiçoada: escolher é de graça (não gasta orçamento),
   o que trava é o requisito. Requisito de sistema não construído
   (perícia) ou de aptidão ainda não transcrita não bloqueia.

   RECOLHIDA por padrão. São 20 só em Aura, e cada descrição é um
   parágrafo do livro: abertas todas de uma vez viram um paredão que
   ninguém lê. Recolhida, a linha mostra o que serve para ESCOLHER
   (nome + requisitos) e o texto abre sob demanda. */
function AptidaoCard({ aptidao, escolhida, ctx, onToggle }) {
  const [open, setOpen] = useState(false);
  const reqs = (aptidao.requisitos || []).map((r) => avaliarRequisitoAptidao(r, ctx));
  const faltando = reqs.filter((r) => r.verificavel && !r.ok);
  // Já escolhida nunca trava: senão um requisito que deixou de ser
  // atendido prenderia a aptidão na ficha, sem como remover.
  const bloqueada = faltando.length > 0 && !escolhida;

  return (
    <div className={`rounded-lg border transition-colors ${
      escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      {/* Altura FIXA: com ou sem chip de requisito, toda linha tem 32px.
          Antes ela era emergente (saía do elemento mais alto), então
          qualquer chip que passasse de 20px voltava a esticar o cartão. */}
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        {/* escolher (irmão do botão de abrir, não aninhado) */}
        <button
          type="button"
          onClick={onToggle}
          disabled={bloqueada}
          aria-pressed={escolhida}
          aria-label={`${escolhida ? "Remover" : "Escolher"} ${aptidao.nome}`}
          title={
            bloqueada
              ? `Requisito não atendido: ${faltando.map((r) => r.label).join(", ")}`
              : escolhida ? "Remover esta aptidão" : "Escolher esta aptidão"
          }
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            escolhida
              ? "bg-purple-700 border-purple-600 text-white"
              : bloqueada
                ? "border-slate-800 text-slate-700 cursor-not-allowed"
                : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhida ? <Check className="w-3 h-3" /> : bloqueada ? <Lock className="w-2.5 h-2.5" /> : <Plus className="w-3 h-3" />}
        </button>

        {/* Abrir o texto. UMA linha só (sem flex-wrap): os chips quebrando
            para a segunda linha era o que deixava as aptidões com requisito
            mais altas que as sem. Os chips não encolhem, o nome trunca. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span
            className={`text-[12px] font-semibold truncate ${bloqueada ? "text-slate-500" : "text-slate-100"}`}
            title={aptidao.nome}
          >
            {aptidao.nome}
          </span>
          <RequisitoLista reqs={reqs} />
        </button>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>

      {/* Aberta: sem clamp (quem abriu quer ler) e com whitespace-pre-line,
          porque algumas descrições têm lista de marcadores (Estímulo
          Muscular) e sem isso as quebras de linha colapsariam num bloco. */}
      {open && (
        <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line px-2.5 pb-2.5 pl-[38px]">
          {aptidao.descricao}
        </p>
      )}
    </div>
  );
}

/* ============================================================ */
/* Aba Especializações                                          */
/* ============================================================ */
/* Especialização NÃO muda cálculo (quem dirige fórmula é o Tipo). Esta aba
   só distribui os níveis e destrava Habilidades de Especialização, então
   mexer aqui não move a banda de stats da prévia — é de propósito
   (decisão do autor, roadmap 2026-07-14).

   ⚠ DESENHO: chips com ± inline (autor, 2026-07-17, depois de 4 rodadas).
   A aba inteira é UMA fileira. Duas regras saíram do checkup das abas que
   ele aprovou (Aptidões, Interlúdios, Atributos) e valem para qualquer
   mexida aqui:

   1. AS OPÇÕES FICAM TODAS À MOSTRA. Nenhuma das abas aprovadas usa
      dropdown para a escolha principal: Aptidões mostra as 5 trilhas,
      Atributos os 6 atributos, Interlúdios as 12 trilhas. São 6
      especializações, um conjunto pequeno e enumerável como aqueles.
      O <Select> foi tentado e REJEITADO por esconder as 6.
   2. NADA DE WIDGET ESTRANGEIRO. Se o controle não existe em outra aba,
      vai parecer estranho mesmo compacto. Tentados e REJEITADOS:
      NumberInput, dois campos independentes, stepper compacto em linha
      própria, <input type="range"> e uma barra proporcional arrastável
      (esta chegou a ser implementada e o autor mandou remover).

   O ± inline é o formato que o próprio autor já tinha decidido no roadmap
   (2026-07-14) para a banda de níveis: "Punho 12 / Véu 8 com ± inline".

   Como soma(niveis) === ND e a 2ª leva o resto (ver resolveEspecializacoes),
   os dois ± editam O MESMO ponto de divisão por lados opostos: subir uma
   baixa a outra. Com uma classe só não há o que dividir, e nenhum ± aparece. */
function TabEspecializacoes({ draft, derived, setEspecializacoes, toggleHabilidade, toggleEscolhaHabilidade, toggleTalento, setMelhoriaVezes, toggleLendaria, toggleEscolhaAltoNivel }) {
  const { escolhidas, total, max, obrigatoria } = derived.especializacoes;
  const disponiveis = especializacoesDisponiveis(draft.core.origem?.id);

  // Multiclasse pede 2 slots E nível para dividir (cada uma tem mínimo 1),
  // então o ND 1 não comporta.
  const podeMulticlasse = max > 1 && total >= 2;
  const multi = escolhidas.length === 2;

  const gravar = (lista) => setEspecializacoes(lista.map((e) => ({ id: e.id, nivel: e.nivel })));

  const toggle = (id) => {
    const atuais = escolhidas.map((e) => ({ ...e }));
    const idx = atuais.findIndex((e) => e.id === id);
    if (idx >= 0) {
      // Tirar uma das duas deixa a outra com o ND inteiro (resolve cuida).
      atuais.splice(idx, 1);
      gravar(atuais);
      return;
    }
    if (atuais.length === 0) { gravar([{ id, nivel: total }]); return; }
    // Entrando na multiclasse: divide o ND ao meio como ponto de partida.
    if (podeMulticlasse && atuais.length === 1) {
      gravar([{ id: atuais[0].id, nivel: Math.ceil(total / 2) }, { id, nivel: 1 }]);
    }
  };

  /* O nível da 1ª É o ponto de divisão. Mexer na 2ª é o mesmo ponto pelo
     avesso, por isso o `slot === 0 ? +delta : -delta`. */
  const ajustar = (slot, delta) => {
    if (!multi) return;
    const alvo = escolhidas[0].nivel + (slot === 0 ? delta : -delta);
    const next = escolhidas.map((e) => ({ ...e }));
    next[0].nivel = Math.min(total - 1, Math.max(1, alvo));
    gravar(next);
  };

  const passoBtn = "w-5 h-6 rounded flex items-center justify-center text-xs font-bold leading-none text-purple-200 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors";
  // Base comum ao chip-botão (inativo/uma classe só) e ao chip-caixa (com ±),
  // para os dois terem exatamente a mesma silhueta na fileira.
  const chipBase = "grow justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5";

  return (
    <>
    <Card title="Especializações">
      {/* As 6 à mostra, numa fileira. Mesma pílula roxa das abas de
          categoria de Aptidões, com semântica de toggle (aria-pressed). */}
      <div className="flex gap-1 flex-wrap" role="group" aria-label="Especializações">
        {disponiveis.map((esp) => {
          const slot = escolhidas.findIndex((e) => e.id === esp.id);
          const ativa = slot >= 0;
          const cheio = !ativa && escolhidas.length >= max;
          const semNd = !ativa && escolhidas.length === 1 && !podeMulticlasse;
          const off = cheio || semNd;
          const nivel = ativa ? escolhidas[slot].nivel : 0;
          const titulo = semNd
            ? `ND ${total} não comporta multiclasse (cada Especialização tem nível mínimo 1)`
            : cheio ? `Máximo de ${max} Especializações` : undefined;

          /* Com ±, o chip vira uma CAIXA com botões dentro (o nome e os ±
             são alvos separados). <button> dentro de <button> é HTML
             inválido, por isso não dá para manter o chip como um botão só. */
          if (ativa && multi) {
            return (
              <div key={esp.id} className={`${chipBase} bg-purple-700 text-white pl-3.5 pr-1 py-1`}>
                <button
                  type="button"
                  onClick={() => toggle(esp.id)}
                  aria-pressed
                  className="py-1 focus:outline-none focus:ring-1 focus:ring-purple-300 rounded"
                  title="Remover da multiclasse"
                >
                  {esp.nome}
                </button>
                <span className="flex items-center gap-0.5 ml-0.5">
                  <button
                    type="button"
                    onClick={() => ajustar(slot, -1)}
                    disabled={nivel <= 1}
                    className={passoBtn}
                    aria-label={`Diminuir nível em ${esp.nome}`}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-xs font-bold tabular-nums" aria-live="polite">
                    {nivel}
                  </span>
                  <button
                    type="button"
                    onClick={() => ajustar(slot, 1)}
                    disabled={nivel >= total - 1}
                    className={passoBtn}
                    aria-label={`Aumentar nível em ${esp.nome}`}
                  >
                    +
                  </button>
                </span>
              </div>
            );
          }

          return (
            <button
              key={esp.id}
              type="button"
              onClick={() => toggle(esp.id)}
              disabled={off}
              aria-pressed={ativa}
              title={titulo}
              /* grow (e não flex-1): dividem o espaço que sobra mas cada
                 uma mantém a largura do próprio rótulo, senão "Controlador"
                 e "Lutador" ficariam do mesmo tamanho e cortariam. */
              className={`${chipBase} px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                ativa
                  ? "bg-purple-700 text-white"
                  : off
                    ? "text-slate-700 cursor-not-allowed"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {esp.nome}
              {ativa && <span className="font-mono text-xs font-bold text-purple-200/90">{total}</span>}
            </button>
          );
        })}
      </div>

      {obrigatoria && (
        <p className="text-[11px] text-slate-500 mt-3">
          A Origem Restringido define a Especialização e o Tipo, e não permite multiclasse.
        </p>
      )}
    </Card>

    {/* As Habilidades de Especialização moram AQUI, embaixo dos chips
        (autor, 2026-07-17): a aba "Habilidades" do topo é de Ações &
        Características, não destas. Mesmo arranjo da aba de Aptidões, que
        tem o alocador em cima e a lista de leitura embaixo. */}
    <HabilidadesEspecializacao draft={draft} derived={derived} toggleHabilidade={toggleHabilidade} toggleEscolhaHabilidade={toggleEscolhaHabilidade} toggleTalento={toggleTalento} />

    {/* Alto Nível (21+): fica SEPARADO embaixo, e não depende de classe
        nenhuma (autor, 2026-07-22). Some inteiro abaixo do ND 21. */}
    <AltoNivel derived={derived} setMelhoriaVezes={setMelhoriaVezes} toggleLendaria={toggleLendaria} toggleEscolhaAltoNivel={toggleEscolhaAltoNivel} />
    </>
  );
}

/* ============================================================ */
/* Habilidades de Especialização (2º card da aba Especializações) */
/* ============================================================ */
/* Uma Habilidade: mesmo cartão recolhido das Aptidões (o autor aprovou
   aquele padrão). O que trava é o NÍVEL na especialização dona, não o
   orçamento — estourar o orçamento fica vermelho no badge e não bloqueia.

   Travada DIZ O QUE FALTA ("Combatente 6 · faltam 4") em vez de sumir,
   que é decisão explícita do autor (roadmap 2026-07-14), motivada pelo
   caso real de escolher uma habilidade e descobrir que o nível não bate. */
/* Lista de opções de uma escolha aninhada.
   Pool pequeno (Estilos de Combate, Melhorias...) sai numa lista corrida, que
   é como sempre foi. Pool GRANDE traz `escolha.abas` com os eixos em que se
   divide, e aí vira uma ou mais barras de abas, encadeadas: hoje só o Roubo
   de Habilidade, com 127 opções, precisa disso.

   As abas são as MESMAS do card de Habilidades (especialização e depois
   nível), só que menores por estarem um nível mais fundo. Cada aba conta
   quantas opções daquele galho já foram escolhidas, senão o que foi pego nas
   outras abas sumiria da vista (mesma lição da barra de grupos). */
function OpcoesDeEscolha({ escolha, opcoesEscolhidas, escolhida, onToggleOpcao }) {
  const eixos = escolha.abas || [];
  // Aba ativa por eixo. Vazio = a primeira de cada barra.
  const [abaPorEixo, setAbaPorEixo] = useState([]);

  // Desce os eixos filtrando: cada barra só oferece o que sobrou da de cima.
  const barras = [];
  let lista = escolha.opcoes;
  for (let i = 0; i < eixos.length; i++) {
    const abas = abasDeOpcoes(lista, eixos[i]);
    const ativa = abas.find((a) => a.id === abaPorEixo[i]) ?? abas[0];
    barras.push({ abas, ativaId: ativa?.id });
    lista = ativa?.opcoes ?? [];
  }

  // Trocar de aba num eixo invalida a escolha dos eixos DE BAIXO (a aba "16°"
  // pode não existir no Lutador), então elas voltam para a primeira.
  const escolherAba = (eixoIdx, abaId) =>
    setAbaPorEixo((atual) => [...atual.slice(0, eixoIdx), abaId]);

  return (
    <>
      {barras.map((barra, i) => (
        <div
          key={eixos[i]}
          className="flex gap-1 overflow-x-auto no-scrollbar mb-2"
          role="tablist"
          aria-label={`${escolha.label} por ${eixos[i]}`}
        >
          {barra.abas.map((a) => {
            const on = a.id === barra.ativaId;
            const nEsc = a.opcoes.filter((o) => opcoesEscolhidas.includes(o.id)).length;
            return (
              <button
                key={a.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => escolherAba(i, a.id)}
                className={`grow justify-center whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                  on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {a.label}
                {nEsc > 0 && (
                  <span className={`font-mono text-[9px] font-bold px-1 rounded ${on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"}`}>
                    {nEsc}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div className="space-y-1.5">
        {lista.map((o) => {
          const sel = opcoesEscolhidas.includes(o.id);
          // Sem a habilidade, a escolha não vale: leitura apenas.
          const desabilitada = !escolhida;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggleOpcao?.(o.id)}
              disabled={desabilitada}
              aria-pressed={sel}
              className={`w-full text-left rounded-md border px-2 py-1.5 transition-colors flex gap-2 ${
                sel
                  ? "border-purple-700 bg-purple-950/40"
                  : desabilitada
                    ? "border-slate-800/60 bg-transparent cursor-default"
                    : "border-slate-800 bg-slate-950/40 hover:border-purple-700/70"
              }`}
            >
              <span
                className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${
                  sel ? "bg-purple-700 border-purple-600 text-white" : "border-slate-600 text-transparent"
                }`}
                aria-hidden="true"
              >
                {sel && <Check className="w-2.5 h-2.5" />}
              </span>
              <span className="text-[11px] text-slate-400 leading-relaxed">
                <span className={`font-semibold ${sel ? "text-purple-200" : "text-slate-300"}`}>{o.nome}.</span>
                {/* Com o pool tabulado por nível, o nível já é a aba: repetir
                    aqui seria ruído. Sem abas, ele continua na linha. */}
                {o.nivelMin && !eixos.includes("nivel") && (
                  <span className="text-[10px] text-purple-300 font-medium"> (Nível {o.nivelMin})</span>
                )}
                {" "}{o.descricao}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function HabilidadeCard({ habilidade, escolhida, acesso, nivelEspec, escolhaEstado, onToggleOpcao }) {
  const [open, setOpen] = useState(false);
  // Já escolhida nunca trava: senão redividir a multiclasse prenderia a
  // habilidade na ficha, sem como remover (mesma regra do AptidaoCard).
  const bloqueada = !acesso.ok && !escolhida;
  const reqExtras = (acesso.extras || []).filter((e) => e.label);
  // Estado da escolha aninhada: quantas opções liberadas e quais escolhidas.
  const opcoesEscolhidas = escolhaEstado?.opcoes || [];
  const allowance = escolhaEstado?.allowance ?? escolhasConcedidas(habilidade, nivelEspec);
  const excedeuEscolha = !!escolhaEstado?.excedeu;

  return (
    <div className={`rounded-lg border transition-colors ${
      escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      {/* Altura FIXA de 32px, com ou sem chip (mesma lição do AptidaoCard). */}
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={habilidade.onToggle}
          disabled={bloqueada}
          aria-pressed={escolhida}
          aria-label={`${escolhida ? "Remover" : "Escolher"} ${habilidade.nome}`}
          title={
            bloqueada
              ? // Talento não tem requisito de nível de classe (não vem com
                // `label`), só os extras, que já aparecem na linha.
                acesso.label
                  ? `Requer nível ${habilidade.nivel} em ${acesso.label.split(" ")[0]}`
                  : "Pré-requisito não atendido"
              : escolhida ? "Remover esta habilidade" : "Escolher esta habilidade"
          }
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            escolhida
              ? "bg-purple-700 border-purple-600 text-white"
              : bloqueada
                ? "border-slate-800 text-slate-700 cursor-not-allowed"
                : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhida ? <Check className="w-3 h-3" /> : bloqueada ? <Lock className="w-2.5 h-2.5" /> : <Plus className="w-3 h-3" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span
            className={`text-[12px] font-semibold truncate ${bloqueada ? "text-slate-500" : "text-slate-100"}`}
            title={habilidade.nome}
          >
            {habilidade.nome}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {/* Requisito de NÍVEL: só aparece quando falta, e diz quanto.
                Atendido, some — o nível já está no cabeçalho do grupo. */}
            {!acesso.nivelOk && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-purple-300 whitespace-nowrap" title={acesso.titulo}>
                <Lock className="w-2.5 h-2.5 flex-shrink-0" />
                {acesso.label} · Faltam {acesso.faltam}
              </span>
            )}
            {reqExtras.map((r, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-700 text-[10px]" aria-hidden="true">·</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap ${
                    r.verificavel && r.ok ? "text-slate-600" : "text-purple-300"
                  }`}
                  title={r.verificavel ? undefined : "Requisito de sistema ainda não construído, não validado aqui"}
                >
                  {!(r.verificavel && r.ok) && <Lock className="w-2.5 h-2.5 flex-shrink-0" />}
                  {r.label}
                </span>
              </React.Fragment>
            ))}
          </span>
        </button>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pl-[38px]">
          <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
            {habilidade.descricao}
          </p>
          {/* Escolha aninhada (Estilo de Controle, Melhoria...). Selecionável
              só quando a habilidade está escolhida; senão é leitura, para o
              texto do livro estar visível. */}
          {habilidade.escolha && (
            <div className="mt-2 border-t border-slate-800 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
                {habilidade.escolha.label}
                {escolhida && (
                  <span className={`normal-case tracking-normal ${excedeuEscolha ? "text-rose-400" : "text-purple-300"}`}>
                    {" "}· {opcoesEscolhidas.length} de {allowance} escolhida{allowance === 1 ? "" : "s"}
                    {habilidade.escolha.repetivel && (
                      <span className="text-slate-600"> (cada uma custa uma vaga)</span>
                    )}
                  </span>
                )}
              </p>
              <OpcoesDeEscolha
                escolha={habilidade.escolha}
                opcoesEscolhidas={opcoesEscolhidas}
                escolhida={escolhida}
                onToggleOpcao={onToggleOpcao}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TALENTOS_TAB = "__talentos__";

function HabilidadesEspecializacao({ draft, derived, toggleHabilidade, toggleEscolhaHabilidade, toggleTalento }) {
  const { escolhidas, escolhas, total, gastos, excedeu, niveisPorEspec } = derived.habilidades;
  const especs = derived.especializacoes.escolhidas;
  const talentosEscolhidos = derived.talentos.escolhidas;

  // Tabulada pelas especializações ESCOLHIDAS (1 ou 2), não pelas 6:
  // habilidade de especialização que a criatura não tem é ruído. Talentos são
  // uma aba a MAIS, sempre presente: qualquer classe pode pegá-los (autor,
  // 2026-07-22). Numa ficha Restringido a barra fica "Restringido | Talentos".
  const [espTab, setEspTab] = useState(null);
  // Abre na primeira que TEM catálogo: sem isso, uma multiclasse com uma
  // especialização ainda não transcrita abriria num card vazio, escondendo a
  // que tem conteúdo atrás dele. (Falta transcrever só o Restringido.)
  const comConteudo = especs.filter((e) => gruposDeHabilidade(e.id).length > 0);
  const emTalentos = espTab === TALENTOS_TAB;
  const ativa = especs.find((e) => e.id === espTab) ?? comConteudo[0] ?? especs[0];

  // Segundo nível de abas: os grupos (Base, 2°, 4°... ou Gerais/Origem nos
  // Talentos). Com 71 habilidades no Combatente, empilhá-las todas era um
  // paredão vertical. O grupoTab guarda a escolha; se ela não existe na aba
  // ativa (troca de aba), cai no primeiro grupo.
  const [grupoTab, setGrupoTab] = useState(null);

  // Sem especialização, nada a mostrar: os chips logo acima já pedem uma.
  if (especs.length === 0) return null;

  // Os dois catálogos viram a MESMA forma ({ id, titulo, habilidades }) para
  // reusar a barra de grupos e o HabilidadeCard sem ramificar a árvore.
  const grupos = emTalentos
    ? gruposDeTalento().map((g) => ({ id: g.id, titulo: g.titulo, habilidades: g.talentos }))
    : gruposDeHabilidade(ativa.id);
  const grupoAtivo = grupos.find((g) => g.id === grupoTab) ?? grupos[0];
  // attrEff alimenta os requisitos de atributo (ex.: Sobrevivente, Constituição
  // 16) e aptidoes os de aptidão (ex.: Revestimento Constante pede Cobrir-se).
  const ctx = {
    niveisPorEspec,
    escolhidas,
    escolhasHabilidade: escolhas?.mapa,
    attrEff: derived.attrEff,
    aptidoes: Array.isArray(draft.aptidoesAmaldicoadas) ? draft.aptidoesAmaldicoadas : [],
  };
  // Talento lê o ND e a origem, nunca o nível de classe.
  const ctxTalento = {
    nd: derived.nd,
    attrEff: derived.attrEff,
    origemId: draft.core?.origem?.id ?? null,
    talentos: talentosEscolhidos,
  };

  // Rótulo curto para a aba: "Base", "2°", "4°"... (o título longo não cabe).
  // Nos Talentos os grupos são "Gerais" e "de Origem".
  const rotuloGrupo = (g) =>
    g.id === "base"
      ? "Base"
      : g.titulo.replace("Habilidades de ", "").replace("Talentos ", "").replace(" Nível", "");

  return (
    <Card
      title="Habilidades de Especialização"
      headerRight={
        <div
          className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
          title="Habilidades escolhidas / permitidas (1 no ND 1, mais 1 a cada 3 ND)"
        >
          <GraduationCap className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Habilidades</span>
          <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
            <span className={excedeu ? "text-rose-400" : "text-white"}>{gastos}</span>
            <span className="text-slate-600"> / </span>
            <span className="text-white">{total}</span>
          </span>
        </div>
      }
    >
      {/* Barra de abas: as especializações escolhidas + Talentos, sempre.
          Mesmo estilo da barra de categorias de Aptidões. Ao contrário das
          especializações, Talentos não mostra nível: o requisito deles é o ND,
          que já está no cabeçalho da ficha. */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3" role="tablist" aria-label="Especializações e Talentos">
        {especs.map((e) => {
          const on = !emTalentos && e.id === ativa.id;
          return (
            <button
              key={e.id}
              role="tab"
              aria-selected={on}
              onClick={() => setEspTab(e.id)}
              className={`grow justify-center whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {getEspecializacao(e.id)?.nome}
              <span className={`font-mono text-xs ${on ? "text-purple-200/90" : "text-slate-600"}`}>{e.nivel}</span>
            </button>
          );
        })}
        <button
          role="tab"
          aria-selected={emTalentos}
          onClick={() => setEspTab(TALENTOS_TAB)}
          title="Talentos podem ser pegos por qualquer especialização e gastam o mesmo orçamento"
          className={`grow justify-center whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            emTalentos ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          Talentos
          {talentosEscolhidos.length > 0 && (
            <span className={`font-mono text-[10px] font-bold px-1 rounded ${emTalentos ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"}`}>
              {talentosEscolhidos.length}
            </span>
          )}
        </button>
      </div>

      {excedeu && (
        <p className="text-[11px] text-rose-400 mb-3">
          Você escolheu mais habilidades do que o orçamento permite. Remova uma ou aumente o ND.
        </p>
      )}

      {/* Catálogo ainda não transcrito: DIZER isso. Renderizar vazio faz a
          aba parecer quebrada (foi o que aconteceu numa ficha Lutador +
          Combatente, que abria no Lutador e mostrava um nada). */}
      {grupos.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          As Habilidades de {getEspecializacao(ativa.id)?.nome} ainda não foram transcritas do
          livro.
        </p>
      ) : (
        <>
          {/* Abas de nível (Base, 2°, 4°...). Contador de escolhidas por aba:
              com as habilidades separadas em abas, o que foi pego nas OUTRAS
              some da vista, então o número devolve essa visibilidade. */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3" role="tablist" aria-label="Níveis de habilidade">
            {grupos.map((g) => {
              const on = g.id === grupoAtivo.id;
              const lista = emTalentos ? talentosEscolhidos : escolhidas;
              const nEsc = g.habilidades.filter((h) => lista.includes(h.id)).length;
              return (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setGrupoTab(g.id)}
                  title={g.titulo}
                  className={`grow justify-center whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {rotuloGrupo(g)}
                  {nEsc > 0 && (
                    <span className={`font-mono text-[10px] font-bold px-1 rounded ${on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"}`}>
                      {nEsc}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            {grupoAtivo.habilidades.map((h) =>
              emTalentos ? (
                // Talento não tem requisito de nível implícito (o "Nível N" de
                // alguns é um requisito explícito, do tipo nd), então nivelOk
                // é sempre true e o chip de nível do card não aparece.
                <HabilidadeCard
                  key={h.id}
                  habilidade={{ ...h, onToggle: () => toggleTalento(h.id) }}
                  escolhida={talentosEscolhidos.includes(h.id)}
                  acesso={{ ...avaliarAcessoTalento(h, ctxTalento), nivelOk: true, faltam: 0 }}
                />
              ) : (
                <HabilidadeCard
                  key={h.id}
                  habilidade={{ ...h, onToggle: () => toggleHabilidade(h.id) }}
                  escolhida={escolhidas.includes(h.id)}
                  acesso={avaliarAcessoHabilidade(h, ctx)}
                  nivelEspec={ativa.nivel}
                  escolhaEstado={escolhas?.porHab?.[h.id]}
                  onToggleOpcao={(opcaoId) => toggleEscolhaHabilidade(h.id, opcaoId)}
                />
              )
            )}
          </div>
        </>
      )}
    </Card>
  );
}

/* ============================================================ */
/* NÍVEIS LENDÁRIOS (21+) — 3º card da aba Especializações       */
/* ============================================================ */
/* ⚠ O card se chama "Níveis Lendários" na tela, mas o código diz
   altoNivel / AltoNivel / afty-alto-nivel.js de propósito: "lendária"
   já nomeia UMA das duas listas de dentro (Habilidades Lendárias), e
   reusar a palavra no container faria os dois se confundirem.

   Melhorias Superiores e Habilidades Lendárias. Separadas das
   Habilidades de Especialização de propósito: não dependem de classe
   nenhuma e têm orçamentos próprios (um por nível ímpar e um por nível
   par a partir do 21/22). Abaixo do ND 21 o card some inteiro.

   Reusa o vocabulário aprovado: linha de 32px que abre sob demanda, chips
   de requisito com cadeado, e MEDIDOR (não campo numérico) para as
   melhorias que o livro deixa repetir. */

/** Medidor de repetições de uma Melhoria Superior (2 ou 3 segmentos). */
function VezesGauge({ vezes, max, nome, onSet }) {
  return (
    <span className="flex items-center gap-0.5 flex-shrink-0" role="group" aria-label={`Vezes em ${nome}`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          /* Clicar no segmento que já é o último desce um, então dá para
             voltar de 3 para 2 sem passar pelo zero. */
          onClick={() => onSet(n === vezes ? n - 1 : n)}
          aria-pressed={n <= vezes}
          title={`${n}ª vez`}
          className={`w-3.5 h-3.5 rounded-sm border transition-colors ${
            n <= vezes
              ? "bg-purple-600 border-purple-500"
              : "border-slate-700 hover:border-purple-600"
          }`}
        />
      ))}
    </span>
  );
}

function AltoNivelCard({ item, escolhida, acesso, escolhaEstado, vezes, onToggle, onSetVezes, onToggleOpcao, ctxReq }) {
  const [open, setOpen] = useState(false);
  // Já escolhida nunca trava (mesma regra do HabilidadeCard): senão baixar o
  // ND prenderia a escolha na ficha, sem como remover.
  const bloqueada = acesso ? !acesso.ok && !escolhida : false;
  const reqExtras = (acesso?.extras || []).filter((e) => e.label);
  const opcoesEscolhidas = escolhaEstado?.opcoes || [];
  const quantidade = escolhaEstado?.quantidade ?? item.escolha?.quantidade ?? 0;
  const excedeuEscolha = !!escolhaEstado?.excedeu;
  const repetivel = (item.maxVezes ?? 1) > 1;

  return (
    <div className={`rounded-lg border transition-colors ${
      escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={onToggle}
          disabled={bloqueada}
          aria-pressed={escolhida}
          aria-label={`${escolhida ? "Remover" : "Escolher"} ${item.nome}`}
          title={bloqueada ? "Pré-requisito não atendido" : escolhida ? "Remover" : "Escolher"}
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            escolhida
              ? "bg-purple-700 border-purple-600 text-white"
              : bloqueada
                ? "border-slate-800 text-slate-700 cursor-not-allowed"
                : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhida ? <Check className="w-3 h-3" /> : bloqueada ? <Lock className="w-2.5 h-2.5" /> : <Plus className="w-3 h-3" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span
            className={`text-[12px] font-semibold truncate ${bloqueada ? "text-slate-500" : "text-slate-100"}`}
            title={item.nome}
          >
            {item.nome}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {reqExtras.map((r, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-700 text-[10px]" aria-hidden="true">·</span>}
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap ${
                    r.verificavel && r.ok ? "text-slate-600" : "text-purple-300"
                  }`}
                  title={r.verificavel ? undefined : "Pré-requisito que não existe mais no Afty, não validado aqui"}
                >
                  {!(r.verificavel && r.ok) && <Lock className="w-2.5 h-2.5 flex-shrink-0" />}
                  {r.label}
                </span>
              </React.Fragment>
            ))}
          </span>
        </button>

        {/* Medidor de repetições: só nas que o livro deixa repetir, e só
            depois de escolhida (senão o 1º segmento duplicaria o toggle). */}
        {repetivel && escolhida && (
          <VezesGauge vezes={vezes} max={item.maxVezes} nome={item.nome} onSet={onSetVezes} />
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pl-[38px]">
          <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
            {item.descricao}
          </p>

          {item.escolha && (
            <div className="mt-2 border-t border-slate-800 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
                {item.escolha.label}
                {escolhida && (
                  <span className={`normal-case tracking-normal ${excedeuEscolha ? "text-rose-400" : "text-purple-300"}`}>
                    {" "}· {opcoesEscolhidas.length} de {quantidade} escolhida{quantidade === 1 ? "" : "s"}
                  </span>
                )}
              </p>
              {item.escolha.intro && (
                <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{item.escolha.intro}</p>
              )}
              <div className={item.escolha.opcoes.some((o) => o.descricao) ? "space-y-1.5" : "flex flex-wrap gap-1"}>
                {item.escolha.opcoes.map((o) => {
                  const sel = opcoesEscolhidas.includes(o.id);
                  // Opção com pré-requisito próprio (as Habilidades Ápice).
                  const acessoOp = o.requisitos ? avaliarAcessoAltoNivel(o, ctxReq) : null;
                  const opBloqueada = acessoOp ? !acessoOp.ok && !sel : false;
                  // Sem a habilidade escolhida, a escolha não vale: leitura só.
                  const desabilitada = !escolhida || opBloqueada;

                  // Pool curto e sem descrição (perícias, atributos, TRs): vira
                  // fileira de pílulas, que é o vocabulário das outras abas.
                  if (!o.descricao) {
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => onToggleOpcao?.(o.id)}
                        disabled={desabilitada}
                        aria-pressed={sel}
                        className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                          sel
                            ? "border-purple-600 bg-purple-700 text-white"
                            : desabilitada
                              ? "border-slate-800/60 text-slate-600 cursor-default"
                              : "border-slate-800 text-slate-400 hover:border-purple-700/70 hover:text-white"
                        }`}
                      >
                        {o.nome}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onToggleOpcao?.(o.id)}
                      disabled={desabilitada}
                      aria-pressed={sel}
                      className={`w-full text-left rounded-md border px-2 py-1.5 transition-colors flex gap-2 ${
                        sel
                          ? "border-purple-700 bg-purple-950/40"
                          : desabilitada
                            ? "border-slate-800/60 bg-transparent cursor-default"
                            : "border-slate-800 bg-slate-950/40 hover:border-purple-700/70"
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${
                          sel ? "bg-purple-700 border-purple-600 text-white" : "border-slate-600 text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        {sel && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span className="text-[11px] text-slate-400 leading-relaxed">
                        <span className={`font-semibold ${sel ? "text-purple-200" : "text-slate-300"}`}>{o.nome}.</span>
                        {" "}{o.descricao}
                        {/* Pré-requisitos da Ápice, na linha de baixo: são
                            vários e longos demais para caber no cabeçalho. */}
                        {acessoOp && (
                          <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            {acessoOp.extras.filter((r) => r.label).map((r, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
                                  r.verificavel && r.ok ? "text-slate-600" : "text-purple-300"
                                }`}
                                title={r.verificavel ? undefined : "Pré-requisito que não existe mais no Afty, não validado aqui"}
                              >
                                {!(r.verificavel && r.ok) && <Lock className="w-2.5 h-2.5 flex-shrink-0" />}
                                {r.label}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ALTO_NIVEL_ABAS = [
  { id: "melhorias", label: "Melhorias Superiores" },
  { id: "lendarias", label: "Habilidades Lendárias" },
];

/* Sem `draft`: tudo que a aba mostra já vem resolvido em derived.altoNivel
   (o resolver sanea a ficha e a UI só exibe, convenção do projeto). */
function AltoNivel({ derived, setMelhoriaVezes, toggleLendaria, toggleEscolhaAltoNivel }) {
  const [aba, setAba] = useState("melhorias");
  const { ativo, melhorias, lendarias, escolhas } = derived.altoNivel;

  // Abaixo do ND 21 nada disso existe: o card some inteiro em vez de aparecer
  // zerado, que é o que o autor pediu ("só aparecerem em Níveis 21+").
  if (!ativo) return null;

  const emMelhorias = aba === "melhorias";
  const vezesDe = (id) => melhorias.escolhidas.find((m) => m.id === id)?.vezes ?? 0;
  // Pré-requisitos das Lendárias e das Ápices: ND, nível real por
  // especialização e Habilidades de Especialização já escolhidas.
  const ctxReq = {
    nd: derived.nd,
    niveisPorEspec: derived.habilidades.niveisPorEspec,
    habilidades: derived.habilidades.escolhidas,
  };

  const badge = (rotulo, r, titulo) => (
    <div
      className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
      title={titulo}
    >
      <Star className="w-3 h-3 text-purple-400 flex-shrink-0" />
      <span className="text-[9px] uppercase tracking-wider text-slate-400">{rotulo}</span>
      <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
        <span className={r.excedeu ? "text-rose-400" : "text-white"}>{r.gastos}</span>
        <span className="text-slate-600"> / </span>
        <span className="text-white">{r.total}</span>
      </span>
    </div>
  );

  return (
    <Card
      title="Níveis Lendários"
      headerRight={
        <div className="flex items-center gap-1.5 flex-wrap">
          {badge("Melhorias", melhorias, "Uma Melhoria Superior em todo nível ímpar a partir do 21")}
          {badge("Lendárias", lendarias, "Uma Habilidade Lendária em todo nível par a partir do 22")}
        </div>
      }
    >
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3" role="tablist" aria-label="Níveis Lendários">
        {ALTO_NIVEL_ABAS.map((t) => {
          const on = t.id === aba;
          const r = t.id === "melhorias" ? melhorias : lendarias;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setAba(t.id)}
              className={`grow justify-center whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {t.label}
              {r.gastos > 0 && (
                <span className={`font-mono text-[10px] font-bold px-1 rounded ${on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"}`}>
                  {r.gastos}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(emMelhorias ? melhorias : lendarias).excedeu && (
        <p className="text-[11px] text-rose-400 mb-3">
          Você escolheu mais do que o orçamento permite. Remova uma ou aumente o ND.
        </p>
      )}

      <div className="space-y-1">
        {emMelhorias
          ? MELHORIAS_SUPERIORES.map((m) => {
              const vezes = vezesDe(m.id);
              return (
                <AltoNivelCard
                  key={m.id}
                  item={m}
                  escolhida={vezes > 0}
                  vezes={vezes}
                  escolhaEstado={escolhas.porItem?.[m.id]}
                  onToggle={() => setMelhoriaVezes(m.id, vezes > 0 ? 0 : 1)}
                  onSetVezes={(n) => setMelhoriaVezes(m.id, n)}
                  onToggleOpcao={(opcaoId) => toggleEscolhaAltoNivel(m.id, opcaoId)}
                  ctxReq={ctxReq}
                />
              );
            })
          : HABILIDADES_LENDARIAS.map((l) => (
              <AltoNivelCard
                key={l.id}
                item={l}
                escolhida={lendarias.escolhidas.includes(l.id)}
                acesso={avaliarAcessoAltoNivel(l, ctxReq)}
                escolhaEstado={escolhas.porItem?.[l.id]}
                onToggle={() => toggleLendaria(l.id)}
                onToggleOpcao={(opcaoId) => toggleEscolhaAltoNivel(l.id, opcaoId)}
                ctxReq={ctxReq}
              />
            ))}
      </div>
    </Card>
  );
}

function TabAptidoes({ draft, derived, setAptidaoNivel, toggleAptidao }) {
  // O motor resolve alocado + concedido (e devolve ao orçamento o que
  // não coube junto da concessão). A aba só exibe.
  const { alocado, concedido, efetivo, gastos } = derived.aptidao;
  const total = derived.totalAptidao;        // limiares de ND + Raio Negro + treinos "à sua escolha"
  const overBudget = gastos > total;
  const restante = total - gastos;

  const escolhidas = Array.isArray(draft.aptidoesAmaldicoadas) ? draft.aptidoesAmaldicoadas : [];
  const totalAptidoes = derived.totalAptidoesAmaldicoadas;  // 1 no ND 1, +1 a cada 3 ND
  const overAptidoes = escolhidas.length > totalAptidoes;
  // Contexto de requisito: nível de trilha EFETIVO (alocado + concedido).
  const ctx = {
    niveis: efetivo,
    nd: derived.nd,
    attrEff: derived.attrEff,
    escolhidas,
    origemId: draft.core?.origem?.id,
  };

  const [catTab, setCatTab] = useState("aura");
  const abas = abasAptidao(draft);
  // Trocar a origem para/de Maldição troca uma aba de lugar. Se a aba
  // aberta sumiu, cai na primeira em vez de renderizar vazio.
  const catAtiva = abas.find((c) => c.id === catTab) ?? abas[0];
  const listaAtiva = aptidoesDaCategoria(catAtiva.id);
  const subgrupos = subgruposDaCategoria(catAtiva.id);   // null quando a categoria é plana

  return (
    <>
      <Card
        title="Níveis de Aptidão"
        headerRight={
          <div
            className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
            title="Níveis gastos / totais (ND + Raio Negro + Treinamentos)"
          >
            <Zap className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Níveis</span>
            <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
              <span className={overBudget ? "text-rose-400" : "text-white"}>{gastos}</span>
              <span className="text-slate-600"> / </span>
              <span className="text-white">{total}</span>
            </span>
          </div>
        }
      >
        {/* As 5 trilhas lado a lado no desktop; reempilham sozinhas quando aperta. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
          {APTIDAO_TRILHAS.map((t) => (
            <div key={t.key} className="border border-slate-800 bg-slate-950/40 rounded-lg px-2 py-2">
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-[11px] text-slate-400 truncate" title={t.label}>{t.label}</span>
                {concedido[t.key] > 0 && (
                  <span
                    className="text-[9px] text-emerald-400 flex-shrink-0"
                    title="Nível concedido por Treinamento, Origem ou Habilidade (não gasta orçamento)"
                  >
                    +{concedido[t.key]} concedido
                  </span>
                )}
              </div>
              <NivelPicker
                value={alocado[t.key]}
                concedido={concedido[t.key]}
                restante={restante}
                onChange={(v) => setAptidaoNivel(t.key, v)}
                label={`Nível de Aptidão em ${t.label}, atualmente ${efetivo[t.key]}`}
              />
            </div>
          ))}
        </div>

        {overBudget && (
          <p className="text-[11px] text-rose-400 mt-3">
            Você gastou mais níveis do que o orçamento permite. Baixe uma trilha ou aumente o ND.
          </p>
        )}
      </Card>

      <Card
        title="Aptidões Amaldiçoadas"
        headerRight={
          <div
            className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
            title="Aptidões escolhidas / permitidas (1 no ND 1, mais 1 a cada 3 ND)"
          >
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Aptidões</span>
            <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
              <span className={overAptidoes ? "text-rose-400" : "text-white"}>{escolhidas.length}</span>
              <span className="text-slate-600"> / </span>
              <span className="text-white">{totalAptidoes}</span>
            </span>
          </div>
        }
      >
        {/* Abas de categoria (Energia Reversa dá lugar a Maldição na origem
            Maldição). Mesmo estilo da barra de abas do topo da ficha, um
            nível abaixo: pílula roxa na ativa, strip com scroll horizontal. */}
        <div
          className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3"
          role="tablist"
          aria-label="Categorias de Aptidão"
        >
          {abas.map((cat) => {
            const on = cat.id === catAtiva.id;
            const escolhidasNaCat = aptidoesDaCategoria(cat.id).filter((a) => escolhidas.includes(a.id)).length;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={on}
                onClick={() => setCatTab(cat.id)}
                /* `grow` (e não `flex-1`): as abas dividem o espaço que sobra
                   e ocupam a largura toda, mas cada uma mantém a largura do
                   seu próprio rótulo. Larguras iguais cortariam "Controle e
                   Leitura", que é 4x mais longo que "Aura". */
                className={`grow justify-center whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {cat.tab}
                {escolhidasNaCat > 0 && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                    on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"
                  }`}>
                    {escolhidasNaCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {listaAtiva.length === 0 && <p className="text-[11px] text-slate-600">Ainda não transcrita.</p>}

        {/* Categoria com sub-grupos (só Maldição hoje): cabeçalho + resumo. */}
        {subgrupos ? (
          <div className="space-y-4">
            {subgrupos.map(({ sub, aptidoes }) => (
              <div key={sub.id}>
                <div className="text-[11px] font-semibold text-slate-300">{sub.label}</div>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5 mb-1.5">{sub.resumo}</p>
                <div className="space-y-1.5">
                  {aptidoes.map((ap) => (
                    <AptidaoCard
                      key={ap.id}
                      aptidao={ap}
                      escolhida={escolhidas.includes(ap.id)}
                      ctx={ctx}
                      onToggle={() => toggleAptidao(ap.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {listaAtiva.map((ap) => (
              <AptidaoCard
                key={ap.id}
                aptidao={ap}
                escolhida={escolhidas.includes(ap.id)}
                ctx={ctx}
                onToggle={() => toggleAptidao(ap.id)}
              />
            ))}
          </div>
        )}

        {overAptidoes && (
          <p className="text-[11px] text-rose-400 mt-3">
            Você escolheu mais Aptidões Amaldiçoadas do que o ND permite. Remova{" "}
            {escolhidas.length - totalAptidoes} ou aumente o ND.
          </p>
        )}
      </Card>
    </>
  );
}

function TabInterludios({ draft, derived, setTreinoProgresso, setTreinoInstance }) {
  const treinos = (draft.treinamentos && !Array.isArray(draft.treinamentos) && typeof draft.treinamentos === "object")
    ? draft.treinamentos : {};
  const gastos = focosGastos(treinos);
  const total = derived.focosTotais;                // = ND + bônus de poderes
  const overBudget = gastos > total;

  return (
    <>
      <Card
        title="Interlúdios · Treinamento"
        headerRight={
          <div
            className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
            title="Focos gastos / totais (ND + bônus de poderes)"
          >
            <Dumbbell className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Focos</span>
            <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
              <span className={overBudget ? "text-rose-400" : "text-white"}>{gastos}</span>
              <span className="text-slate-600"> / </span>
              <span className="text-white">{total}</span>
            </span>
          </div>
        }
      >
        {/* linhas de treinamento */}
        <div className="space-y-1.5">
          {AFTY_TREINAMENTOS.map((linha) => (
            <TreinoLinha
              key={linha.id}
              linha={linha}
              valor={treinos[linha.id]}
              attrEff={derived.attrEff}
              nd={derived.nd}
              onSetProgresso={setTreinoProgresso}
              onSetInstance={setTreinoInstance}
            />
          ))}
        </div>
      </Card>

      <Card title="Outros Focos de Interlúdio">
        <div className="space-y-1.5">
          <InterludioInfo icon={BookOpen} titulo="Estudos">
            Estudar uma perícia sem maestria (4 testes de INT/SAB, CD 12 + maestria; 2 sucessos
            concedem maestria), ou tornar-se especialista numa perícia já dominada (3 testes,
            CD 15 + nível; 2 sucessos). Ativa quando a aba de Perícias existir.
          </InterludioInfo>
          <InterludioInfo icon={GraduationCap} titulo="Treinamento para Habilidade">
            Escolher uma habilidade de especialização cujos requisitos você atende como objetivo do
            treino (4 testes de um atributo, CD 12 + metade do nível; 3 sucessos concluem). Até o 9º
            nível, uma habilidade adicional por essa via; a partir do 10º, mais uma. Ativa quando as
            Especializações/Habilidades existirem.
          </InterludioInfo>
        </div>
      </Card>
    </>
  );
}

/* ============================================================ */
/* Aba: Cálculos (fórmulas editáveis — a superpotência Afty)   */
/* ============================================================ */
const CALC_ROWS = [
  { key: "hp",           label: "Pontos de Vida" },
  { key: "pe",           label: "Energia (PE)" },
  { key: "defesa",       label: "Defesa / CA" },
  { key: "cd",           label: "CD" },
  { key: "rdGeral",      label: "RD Geral" },
  { key: "rdEspecifico", label: "RD Específico" },
  { key: "movimento",    label: "Movimento (m)" },
  { key: "resParcial",   label: "Resistência Parcial" },
  { key: "atencao",      label: "Atenção" },
];

function TabCalculos({ derived, setStatOverride }) {
  return (
    <Card title="Cálculos">
      <div className="flex gap-2.5 bg-purple-950/30 border border-purple-800 rounded-lg p-3 mb-4 text-xs text-purple-200">
        <FlaskConical className="w-4 h-4 flex-shrink-0 text-purple-400 mt-0.5" />
        <span>
          Valores calculados pelas fórmulas do Afty. Clique no cadeado para sobrescrever manualmente
          qualquer um. <span className="text-purple-300/70">Edição por fórmula (coeficientes) vem depois.</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CALC_ROWS.map((row) => (
          <StatField
            key={row.key}
            label={row.label}
            calculatedValue={derived.calc[row.key]}
            overrideValue={derived.isOverridden(row.key) ? derived[row.key] : null}
            onOverride={(v) => setStatOverride(row.key, v)}
          />
        ))}
      </div>

      <p className="text-[11px] text-slate-500 mt-4">
        Contribuições de <span className="text-amber-400/80">Treinamento</span> e a <span className="text-amber-400/80">Guarda</span> ainda não entram nestes valores (em desenvolvimento).
      </p>
    </Card>
  );
}

/* ============================================================ */
/* Aba: Invocações (Fatia 1: esqueleto)                         */
/* ============================================================ */
/* Cada Invocação é uma ficha própria (creature.invocacoes[]) que LÊ valores do
   dono: PV usa o ND, Defesa usa maestria(ND), e o acesso a graus é travado pelo
   Nível de Controlador. Segue o vocabulário das abas aprovadas: opções à mostra
   (chips), atributos em NumberInput como a aba Atributos, badge de orçamento no
   cabeçalho. Ações e Características entram na Fatia 2. */

/* Fileira de opções à mostra (chips) no lugar de um dropdown. */
function OptionChips({ value, options, onChange, disabledValues }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        const bloqueado = disabledValues?.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => !bloqueado && onChange(o.value)}
            disabled={bloqueado}
            aria-pressed={on}
            title={bloqueado ? o.lockTitle : undefined}
            className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
              on
                ? "bg-purple-700 border-purple-600 text-white"
                : bloqueado
                  ? "border-slate-800 text-slate-600 cursor-not-allowed"
                  : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
            }`}
          >
            {bloqueado && <Lock className="w-2.5 h-2.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Um valor derivado, em caixa compacta. */
function StatMini({ label, value, accent, icon: Icon }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <div className={`font-mono font-bold text-base tabular-nums ${accent ? "text-purple-300" : "text-white"}`}>
        {value ?? "-"}
      </div>
    </div>
  );
}

const EFEITO_CANAL_LABEL = {
  pv: "PV",
  deslocamento: "Deslocamento",
  pericias: "Perícias",
  orcamentoLivre: "Ações/Caract. Grátis",
  orcamentoPago: "Ações/Caract.",
  atributoPontos: "Pontos de Atributo",
  bonusTeste: "Em Testes",
  bonusTR: "Em TRs",
  defesa: "Defesa",
  danoNivel: "Dano/Cura (níveis)",
  danoBonus: "Dano/Cura (total)",
};

/* Efeitos das Habilidades de Controlador aplicados nesta invocação (já embutidos
   nos números acima), listados por FONTE. Discreto: sem o realce roxo. */
function EfeitosHabilidadeNota({ efe }) {
  const detalhes = efe?.detalhes || [];
  if (!detalhes.length) return null;
  return (
    <div className="border-t border-slate-800 pt-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Efeitos de Habilidade (Controlador)</div>
      <ul className="space-y-0.5">
        {detalhes.map((d, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-slate-400 truncate">{d.nome}</span>
            <span className="font-mono text-slate-300 flex-shrink-0 whitespace-nowrap">+{d.valor} {EFEITO_CANAL_LABEL[d.canal] || d.canal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Bloco de verificação: Acerto (Corpo a Corpo / A Distância, melhor atributo),
   CD de ataque por TR, os 5 Testes de Resistência (treinado destacado com *) e
   as Perícias treinadas, com os bônus já calculados. */
/* Pílula de um valor de teste (nome + bônus). `on` destaca treinado (roxo),
   `mestre` destaca mestre (âmbar, com "M"). */
function TestePill({ nome, bonus, on, mestre, title }) {
  const sinal = bonus >= 0 ? `+${bonus}` : `${bonus}`;
  const cls = mestre
    ? "border-amber-500/60 bg-amber-950/30 text-amber-100"
    : on
      ? "border-purple-700/60 bg-purple-950/40 text-purple-200"
      : "border-slate-800 bg-slate-900/70 text-slate-300";
  return (
    <span title={title} className={`inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] border ${cls}`}>
      <span className="text-[10px] opacity-80">{nome}</span>
      <b className={mestre ? "text-amber-100" : on ? "text-purple-100" : "text-white"}>{sinal}</b>
      {mestre && <span className="text-[9px] font-extrabold text-amber-300">M</span>}
    </span>
  );
}

function InvocacaoTestes({ testes }) {
  if (!testes) return null;
  const { acerto, cd, resistencias, pericias } = testes;
  const rotulo = "text-[9px] uppercase tracking-wider text-slate-500 w-16 flex-shrink-0 pt-1";
  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span className={rotulo}>Acerto</span>
        <div className="flex flex-wrap gap-1.5">
          <TestePill nome="Corpo a Corpo" bonus={acerto.corpo.bonus} on={acerto.corpo.treinado} title={acerto.corpo.treinado ? "Treinado" : undefined} />
          <TestePill nome="A Distância" bonus={acerto.distancia.bonus} on={acerto.distancia.treinado} title={acerto.distancia.treinado ? "Treinado" : undefined} />
          <span className="inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800 bg-slate-900/70 text-slate-500" title="CD com o melhor atributo. Cada Ação por TR mostra a sua CD exata.">
            <span className="text-[10px]">CD ataque</span><b>{cd}</b>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span className={rotulo}>Resist.</span>
        <div className="flex flex-wrap gap-1.5">
          {resistencias.map((r) => (
            <TestePill key={r.value} nome={r.label} bonus={r.bonus} on={r.treinado} mestre={r.mestre} title={r.mestre ? "Mestre (1,5x BT)" : r.treinado ? "Treinado (BT)" : undefined} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span className={rotulo}>Perícias</span>
        {pericias.length === 0 ? (
          <span className="text-[11px] text-slate-600 italic pt-1">nenhuma treinada</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {pericias.map((p) => <TestePill key={p.id} nome={p.nome} bonus={p.bonus} on mestre={p.mestre} title={p.mestre ? "Mestre (1,5x BT)" : "Treinado (BT)"} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* Atributos da invocação: point-buy linear (base 8, mín 6, máx do grau). Mesma
   anatomia compacta do bloco de Desenvolvimento na aba Atributos. */
function InvocacaoAtributos({ inv, resumo, max, onPatchAttr }) {
  const over = resumo && resumo.usados > resumo.total;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Atributos</span>
        <span className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded border ${
          over ? "text-rose-300 border-rose-800 bg-rose-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
        }`}>
          {resumo?.usados ?? 0} / {resumo?.total ?? 0} pts
        </span>
      </div>
      {/* Empilhado (rótulo + mod em cima, campo largo embaixo): dá espaço ao
          número e deixa os botões +/- proporcionalmente menores. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AFTY_ATTRS.map((a) => {
          const v = inv.atributos?.[a.key] ?? 8;
          const m = invMod(v);
          return (
            <div key={a.key} className="bg-slate-950/50 border border-slate-800 rounded px-2 py-1.5">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300" title={a.label}>{a.abbr}</span>
                <span className="font-mono text-[10px] text-purple-300">{m >= 0 ? `+${m}` : m}</span>
              </div>
              <NumberInput value={v} onChange={(val) => onPatchAttr(a.key, val)} min={INV_ATTR_MIN} max={max} aria-label={`${a.label} da invocação`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Seletor de perícias treinadas da invocação: as comuns (padrão) exceto Ofício,
   limitadas pela allowance (1 + metade do melhor mod INT/SAB + ganho por grau).
   Estourar fica vermelho, não bloqueia (padrão do projeto). */
function InvocacaoPericias({ inv, allowance, onPatch }) {
  const prof = (inv.periciasProf && typeof inv.periciasProf === "object") ? inv.periciasProf : {};
  const usadas = usoPericias(prof); // Mestre gasta 2, Treinado gasta 1
  const over = usadas > allowance;
  // Clique cicla: nada -> treinado -> mestre -> nada.
  const cycle = (id) => {
    const cur = prof[id];
    const next = { ...prof };
    if (!cur) next[id] = "treinado";
    else if (cur === "treinado") next[id] = "mestre";
    else delete next[id];
    onPatch({ periciasProf: next });
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Perícias <span className="normal-case tracking-normal text-slate-500">(clique cicla treinado, mestre)</span></span>
        <span className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded border ${
          over ? "text-rose-300 border-rose-800 bg-rose-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
        }`}>
          {usadas} / {allowance}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {periciasParaInvocacao().map((p) => {
          const st = prof[p.id]; // undefined | "treinado" | "mestre"
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => cycle(p.id)}
              aria-pressed={!!st}
              title={st === "mestre" ? "Mestre (1,5x BT)" : st === "treinado" ? "Treinado (BT)" : "Não treinada"}
              className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                st === "mestre"
                  ? "bg-purple-700 border-amber-400/70 text-white"
                  : st === "treinado"
                    ? "bg-purple-700 border-purple-600 text-white"
                    : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
              }`}
            >
              {p.nome}
              {st === "mestre" && <span className="text-[9px] font-extrabold text-amber-300">M</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Uma invocação: cabeçalho recolhível (nome + grau + PV/DEF/PE) e, aberta, o
   editor. Nova invocação (sem nome) abre por padrão. */
function InvocacaoCard({ inv, resolvida, grausOk, concentrarPoder, podeSubir, podeDescer, onPatch, onPatchAttr, onRemove, onDuplicar, onSubir, onDescer, acoesApi, caracApi }) {
  const [open, setOpen] = useState(!inv.nome);
  const [subtab, setSubtab] = useState("atributos");
  const [confirmDel, setConfirmDel] = useState(false);
  const g = grauMeta(inv.grau);
  const r = resolvida || {};
  const tabAttr = INV_ATRIBUTOS_POR_GRAU[g.value] || {};
  const orcBadge = `${r.orcamento?.usados ?? 0} / ${r.orcamento?.total ?? 0}`;
  const orcOver = (r.orcamento?.usados ?? 0) > (r.orcamento?.total ?? 0);
  const nAcoes = (inv.acoes || []).length;
  const nCaract = (inv.caracteristicas || []).length;
  const avisos = r.warnings || [];
  const SUBABAS = [
    { id: "atributos", label: "Atributos" },
    { id: "treino", label: "Treino" },
    { id: "acoes", label: "Ações", n: (inv.acoes || []).length },
    { id: "caracteristicas", label: "Caract.", n: (inv.caracteristicas || []).length },
  ];

  const grausBloqueados = AFTY_INV_GRAUS.filter((gr) => !grausOk.includes(gr.value)).map((gr) => gr.value);
  const grauOptions = AFTY_INV_GRAUS.map((gr) => ({
    value: gr.value,
    label: gr.label,
    lockTitle: "Nível de Controlador insuficiente para este grau",
  }));

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/40">
      {/* cabeçalho */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-sm font-semibold text-white truncate">{inv.nome || "Invocação sem nome"}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 flex-shrink-0">
            {g.label}
          </span>
          {avisos.length > 0 && (
            <AlertTriangle
              className="w-3.5 h-3.5 text-amber-400 flex-shrink-0"
              aria-label={`${avisos.length} aviso(s)`}
              title={avisos.join("\n")}
            />
          )}
        </button>
        <span className="hidden sm:flex items-center gap-2 flex-shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
          <span title="Pontos de Vida">PV {r.pv ?? "-"}</span>
          <span title="Defesa">DEF {r.defesa ?? "-"}</span>
          <span title="Ações · Características">{nAcoes}A·{nCaract}C</span>
          <span title="Custo em PE para invocar" className="text-purple-300">{r.custo ?? "-"} PE</span>
        </span>
        {/* toolbar: mover, duplicar, remover (com confirmação) */}
        {confirmDel ? (
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-rose-300">Remover?</span>
            <button type="button" onClick={onRemove} className="text-rose-400 hover:text-rose-300 p-1 rounded" title="Confirmar" aria-label="Confirmar remoção">
              <Check className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setConfirmDel(false)} className="text-slate-500 hover:text-white p-1 rounded" title="Cancelar" aria-label="Cancelar">
              <X className="w-4 h-4" />
            </button>
          </span>
        ) : (
          <span className="flex items-center flex-shrink-0 text-slate-600">
            <button type="button" onClick={onSubir} disabled={!podeSubir} className="p-1 rounded enabled:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Mover para cima" aria-label="Mover para cima">
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onDescer} disabled={!podeDescer} className="p-1 rounded enabled:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Mover para baixo" aria-label="Mover para baixo">
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onDuplicar} className="p-1 rounded hover:text-white" title="Duplicar" aria-label="Duplicar invocação">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setConfirmDel(true)} className="p-1 rounded hover:text-rose-300" title="Remover invocação" aria-label={`Remover ${inv.nome || "invocação"}`}>
              <X className="w-4 h-4" />
            </button>
          </span>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-800 pt-3">
          {/* identidade curta: Nome e Grau empilhados, cada um na largura inteira
              (sem 2 colunas, que deixava vazio embaixo do Nome). */}
          <div className="space-y-3">
            <div>
              <FieldLabel>Nome</FieldLabel>
              <TextInput value={inv.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da invocação" />
            </div>
            <div>
              <FieldLabel>Grau</FieldLabel>
              <OptionChips value={inv.grau} options={grauOptions} onChange={(v) => onPatch({ grau: v })} disabledValues={grausBloqueados} />
            </div>
            {/* Concentrar Poder: só aparece quando o Controlador tem a habilidade.
                Marcar a invocação liga os benefícios (só valem em campo sozinha). */}
            {concentrarPoder?.ativo && (
              <div>
                <FieldLabel hint={`marcadas ${concentrarPoder.marcadas} de ${concentrarPoder.limite}`}>Concentrar Poder</FieldLabel>
                <BoolChip ativo={!!inv.marcada} onToggle={() => onPatch({ marcada: !inv.marcada })}>
                  <Star className="w-3 h-3" aria-hidden="true" /> Invocação marcada
                </BoolChip>
              </div>
            )}
          </div>

          {/* STAT BLOCK (sempre visível): stats + testes + efeitos + avisos */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatMini icon={Heart} label="Vida" value={r.pv} />
              <StatMini icon={Shield} label="Defesa" value={r.defesa} />
              <StatMini icon={Footprints} label="Desloc." value={r.deslocamento != null ? `${r.deslocamento} m` : "-"} />
              <StatMini icon={Zap} label="Custo (PE)" value={r.custo} accent />
            </div>
            <InvocacaoTestes testes={r.testes} />
            <EfeitosHabilidadeNota efe={r.efeitosHabilidade} />
            {avisos.length > 0 && (
              <ul className="space-y-1 border-t border-slate-800 pt-2">
                {avisos.map((w, i) => (
                  <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" /> {w}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SUB-ABAS do editor */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2" role="tablist" aria-label="Seções da invocação">
            {SUBABAS.map((t) => {
              const on = subtab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSubtab(t.id)}
                  className={`grow justify-center whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                    on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {t.label}
                  {t.n > 0 && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"}`}>
                      {t.n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {subtab === "atributos" && (
            <InvocacaoAtributos inv={inv} resumo={r.atributos} max={tabAttr.max} onPatchAttr={onPatchAttr} />
          )}

          {subtab === "treino" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Jogada de Ataque treinada</FieldLabel>
                  <OptionChips
                    value={inv.ataqueTreinado}
                    options={[{ value: "corpo", label: "Corpo a Corpo" }, { value: "distancia", label: "A Distância" }]}
                    onChange={(v) => onPatch({ ataqueTreinado: v })}
                  />
                </div>
                <div>
                  <FieldLabel hint="exceto Integridade">Teste de Resistência treinado</FieldLabel>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0"><Select value={inv.trTreinado} onChange={(v) => onPatch({ trTreinado: v })} options={TR_OPCOES} /></div>
                    <BoolChip ativo={!!inv.trMestre} onToggle={() => onPatch({ trMestre: !inv.trMestre })}>Mestre</BoolChip>
                  </div>
                </div>
              </div>
              <InvocacaoPericias inv={inv} allowance={r.pericias?.allowance ?? 0} onPatch={onPatch} />
            </div>
          )}

          {(subtab === "acoes" || subtab === "caracteristicas") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Orçamento (Ações + Características)</span>
                <span className={`font-mono text-[11px] tabular-nums px-2 py-0.5 rounded border ${
                  orcOver ? "text-rose-300 border-rose-800 bg-rose-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
                }`}>{orcBadge}</span>
              </div>
              {subtab === "acoes" ? (
                <EfeitosSecao
                  titulo="Ações"
                  itens={inv.acoes || []}
                  resolvidos={r.acoes || []}
                  onAdd={acoesApi.add}
                  addLabel="Nova ação"
                  render={(item, res) => (
                    <AcaoCard key={item.id} acao={item} res={res} grau={inv.grau} onPatch={(p) => acoesApi.patch(item.id, p)} onRemove={() => acoesApi.remove(item.id)} />
                  )}
                />
              ) : (
                <EfeitosSecao
                  titulo="Características"
                  itens={inv.caracteristicas || []}
                  resolvidos={r.caracteristicas || []}
                  onAdd={caracApi.add}
                  addLabel="Nova característica"
                  render={(item, res) => (
                    <CaracteristicaCard key={item.id} carac={item} res={res} grau={inv.grau} onPatch={(p) => caracApi.patch(item.id, p)} onRemove={() => caracApi.remove(item.id)} />
                  )}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Seção de uma lista de efeitos (Ações ou Características) dentro da invocação:
   os itens (parelelos a `resolvidos` por índice) + botão de adicionar. */
function EfeitosSecao({ titulo, itens, resolvidos, render, onAdd, addLabel }) {
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">{titulo}</div>
      {itens.length === 0 ? (
        <p className="text-[11px] text-slate-600 italic mb-1.5">Nada ainda.</p>
      ) : (
        <div className="space-y-1.5 mb-1.5">{itens.map((it, i) => render(it, resolvidos[i]))}</div>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
      >
        <Plus className="w-3 h-3" /> {addLabel}
      </button>
    </div>
  );
}

/* Chip booleano (liga/desliga). */
function BoolChip({ ativo, onToggle, children }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ativo}
      className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
        ativo ? "bg-purple-700 border-purple-600 text-white" : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

/* Campo de expressão da DSL, com validação e prévia do valor resolvido. */
function ExprField({ value, onChange, resultado }) {
  const check = validateExpression(value || "");
  return (
    <div>
      <FieldLabel hint="opcional: forca, mod_destreza, pv_max, grau, nd, bt, nivel_controlador...">Modificador (DSL)</FieldLabel>
      <TextInput value={value} onChange={onChange} placeholder="ex.: mod_forca + metade(nd)" />
      {value ? (
        check.ok
          ? <p className="text-[10px] text-emerald-400 mt-1">= {resultado ?? 0}</p>
          : <p className="text-[10px] text-rose-400 mt-1">{check.error}</p>
      ) : null}
    </div>
  );
}

const ATTR_OPCOES = AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label }));
const TR_OPCOES = resistenciasTreinaveis().map((r) => ({ value: r.value, label: r.label }));
const FORMA_AREA_OPCOES = [
  { value: "linha", label: "Linha (dobrada)" },
  { value: "quadrado", label: "Quadrado" },
  { value: "cone", label: "Cone" },
  { value: "circulo", label: "Círculo" },
  { value: "esfera", label: "Esfera" },
];
const BENEFICIO_OPCOES = INV_CUSTO_BENEFICIOS.map((b) => ({ value: b.id, label: b.label }));
const CONDICAO_OPCOES = [
  { value: "fraca", label: `Fraca (${INV_CUSTO_CONDICAO.fraca} PE)` },
  { value: "media", label: `Média (${INV_CUSTO_CONDICAO.media} PE)` },
  { value: "forte", label: `Forte (${INV_CUSTO_CONDICAO.forte} PE)` },
];

/* Alocador dos benefícios de uma Ação com Custo: cada linha gasta PE num
   benefício. A condição custa por nível (Fraca/Média/Forte); os demais são por
   PE. O total alocado é comparado com o custoPE da ação. */
function BeneficiosCustoEditor({ acao, res, onPatch }) {
  const beneficios = Array.isArray(acao.beneficiosCusto) ? acao.beneficiosCusto : [];
  const setArr = (arr) => onPatch({ beneficiosCusto: arr });
  const add = () => setArr([...beneficios, { tipo: "alcance", pe: 1 }]);
  const remove = (i) => setArr(beneficios.filter((_, idx) => idx !== i));
  const patch = (i, partial) => setArr(beneficios.map((b, idx) => (idx === i ? { ...b, ...partial } : b)));
  const setTipo = (i, tipo) =>
    patch(i, tipo === "condicao" ? { tipo, nivel: beneficios[i]?.nivel || "fraca" } : { tipo, pe: beneficios[i]?.pe || 1 });
  const alocado = res?.beneficiosPE ?? 0;
  const over = alocado > (acao.custoPE ?? 0);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Benefícios</span>
        <span className={`text-[11px] font-mono tabular-nums ${over ? "text-rose-300" : "text-slate-400"}`}>
          {alocado} / {acao.custoPE} PE
        </span>
      </div>
      <div className="space-y-1.5">
        {beneficios.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 min-w-0"><Select value={b.tipo} onChange={(v) => setTipo(i, v)} options={BENEFICIO_OPCOES} /></div>
            {b.tipo === "condicao" ? (
              <div className="w-28"><Select value={b.nivel || "fraca"} onChange={(v) => patch(i, { nivel: v })} options={CONDICAO_OPCOES} /></div>
            ) : (
              <div className="w-16"><NumberInput value={b.pe ?? 1} onChange={(v) => patch(i, { pe: v })} min={1} max={acao.custoPE || 1} aria-label="PE do benefício" /></div>
            )}
            <button type="button" onClick={() => remove(i)} className="text-slate-600 hover:text-rose-300 p-0.5 rounded flex-shrink-0" aria-label="Remover benefício">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-1.5 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
      >
        <Plus className="w-3 h-3" /> Benefício
      </button>
      <p className="text-[10px] text-slate-500 mt-1.5">
        Por PE: alcance +6 m, área +3 m, dano/cura +2 níveis, acerto ou CD +1. Condição custa por nível.
      </p>
    </div>
  );
}

/* Sufixo de bônus com sinal para dados: " + 2", " - 2" ou "" quando zero.
   Evita o "+-2" que saía de `+${bonus}` quando o bônus é negativo. */
function bonusSuf(n) {
  if (!n) return "";
  return n > 0 ? ` + ${n}` : ` - ${-n}`;
}

/* Resumo curto dos valores resolvidos de uma Ação (para o cabeçalho). */
function resumoAcaoTexto(res) {
  if (!res) return "";
  if (res.familia === "ataque") {
    const d = res.dano?.dado ? `${res.dano.dado}${bonusSuf(res.dano.bonus)}` : "";
    const extra = res.ataqueTipo === "tr" ? `CD ${res.cd}` : (res.bonusAtaque != null ? `ataque ${res.bonusAtaque >= 0 ? "+" : ""}${res.bonusAtaque}` : "");
    return [d, extra].filter(Boolean).join(" · ");
  }
  switch (res.auxilioSub) {
    case "cura": return res.cura?.dado ? `${res.cura.dado}${bonusSuf(res.cura.bonus)}` : "cura";
    case "rd": return `${res.valor} RD`;
    case "danoAdicional": return res.danoAdicional?.dado ? `${res.danoAdicional.dado}` : "";
    default: return `+${res.valor}`;
  }
}

/* Uma Ação: cabeçalho recolhível + editor. Ataque é sempre Complexa, e Cura
   também, então a classe fica travada nesses casos. */
function AcaoCard({ acao, res, grau, onPatch, onRemove }) {
  const [open, setOpen] = useState(!acao.nome);
  const isAtaque = acao.familia === "ataque";
  const isCura = acao.familia === "auxilio" && acao.auxilioSub === "cura";
  const classeForcada = isAtaque || isCura;
  const custoMax = custoMaxAcao(grau);
  // Alvos Múltiplos/Área (e cura Múltiplos) só existem do Terceiro Grau para cima.
  const alvosOk = alvosDanoDisponiveis(grau);
  const alvosBloqueados = [...(alvosOk.multiplos ? [] : ["multiplos"]), ...(alvosOk.area ? [] : ["area"])];
  const curaMultOk = curaMultiplosDisponivel(grau);

  const setFamilia = (v) => onPatch(v === "ataque" ? { familia: "ataque", classe: "complexa" } : { familia: "auxilio" });
  const setSub = (v) => onPatch(v === "cura" ? { auxilioSub: "cura", classe: "complexa" } : { auxilioSub: v });

  return (
    <div className="rounded-md border border-slate-700/70 bg-slate-900/40">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-[12px] font-semibold text-slate-100 truncate">{acao.nome || "Ação sem nome"}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-slate-800 text-slate-400 flex-shrink-0">
            {isAtaque ? "Ataque" : "Auxílio"}
          </span>
        </button>
        {resumoAcaoTexto(res) && (
          <span className="hidden sm:inline font-mono text-[11px] text-purple-300 tabular-nums flex-shrink-0">{resumoAcaoTexto(res)}</span>
        )}
        {(acao.custoPE ?? 0) > 0 && (
          <span className="font-mono text-[10px] text-amber-300 flex-shrink-0">{acao.custoPE} PE</span>
        )}
        <button type="button" onClick={onRemove} className="text-slate-600 hover:text-rose-300 p-0.5 rounded flex-shrink-0" aria-label="Remover ação">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pt-1 space-y-3 border-t border-slate-800">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <TextInput value={acao.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da ação" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Família</FieldLabel>
              <OptionChips value={acao.familia} options={[{ value: "ataque", label: "Ataque" }, { value: "auxilio", label: "Auxílio" }]} onChange={setFamilia} />
            </div>
            <div>
              <FieldLabel hint={classeForcada ? "Complexa obrigatória aqui" : undefined}>Classe</FieldLabel>
              <OptionChips
                value={acao.classe}
                options={[{ value: "simples", label: "Simples" }, { value: "complexa", label: "Complexa" }]}
                onChange={(v) => onPatch({ classe: v })}
                disabledValues={classeForcada ? ["simples"] : undefined}
              />
            </div>
          </div>

          {isAtaque ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Tipo de ataque</FieldLabel>
                  <OptionChips value={acao.ataqueTipo} options={[{ value: "jogada", label: "Jogada de Ataque" }, { value: "tr", label: "Teste de Resistência" }]} onChange={(v) => onPatch({ ataqueTipo: v })} />
                </div>
                <div>
                  <FieldLabel hint={alvosBloqueados.length ? "Múltiplos e Área a partir do Terceiro Grau" : undefined}>Alvo</FieldLabel>
                  <OptionChips
                    value={acao.alvo}
                    options={[
                      { value: "unico", label: "Único" },
                      { value: "multiplos", label: "Múltiplos", lockTitle: "Alvos múltiplos a partir do Terceiro Grau" },
                      { value: "area", label: "Área", lockTitle: "Ataque em área a partir do Terceiro Grau" },
                    ]}
                    onChange={(v) => onPatch({ alvo: v })}
                    disabledValues={alvosBloqueados}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <BoolChip ativo={acao.corpoACorpo} onToggle={() => onPatch({ corpoACorpo: !acao.corpoACorpo })}>Corpo a corpo (+3 níveis)</BoolChip>
                <div className="min-w-[120px]">
                  <FieldLabel hint="Força ou Destreza, salvo característica">Atributo</FieldLabel>
                  <Select value={acao.atributoChave} onChange={(v) => onPatch({ atributoChave: v })} options={ATTR_OPCOES} />
                </div>
                {acao.ataqueTipo === "tr" && (
                  <div className="min-w-[120px]">
                    <FieldLabel hint="exceto Integridade">TR do alvo</FieldLabel>
                    <Select value={acao.trTipo} onChange={(v) => onPatch({ trTipo: v })} options={TR_OPCOES} />
                  </div>
                )}
                {acao.alvo === "area" && (
                  <div className="min-w-[120px]">
                    <FieldLabel>Forma da área</FieldLabel>
                    <Select value={acao.formaArea} onChange={(v) => onPatch({ formaArea: v })} options={FORMA_AREA_OPCOES} placeholder="escolher..." />
                  </div>
                )}
              </div>
              <div className="sm:max-w-xs">
                <FieldLabel hint="exceto Energia Reversa e Dano na Alma">Tipo de dano</FieldLabel>
                <TextInput value={acao.tipoDano} onChange={(v) => onPatch({ tipoDano: v })} placeholder="ex.: corte, impacto, fogo" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <FieldLabel>Efeito</FieldLabel>
                <OptionChips
                  value={acao.auxilioSub}
                  options={[
                    { value: "cura", label: "Cura" }, { value: "defesa", label: "Defesa" },
                    { value: "acerto", label: "Acerto" }, { value: "danoAdicional", label: "Dano Adicional" }, { value: "rd", label: "RD" },
                  ]}
                  onChange={setSub}
                />
              </div>
              {acao.auxilioSub === "cura" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel hint={curaMultOk ? undefined : "Múltiplos a partir do Terceiro Grau"}>Alvos</FieldLabel>
                    <OptionChips
                      value={acao.alvo === "multiplos" ? "multiplos" : "unico"}
                      options={[
                        { value: "unico", label: "Único" },
                        { value: "multiplos", label: "Múltiplos", lockTitle: "Cura de alvos múltiplos a partir do Terceiro Grau" },
                      ]}
                      onChange={(v) => onPatch({ alvo: v })}
                      disabledValues={curaMultOk ? [] : ["multiplos"]}
                    />
                  </div>
                  <div>
                    <FieldLabel hint="somado à cura">Atributo</FieldLabel>
                    <OptionChips value={acao.curaAttr} options={[{ value: "sabedoria", label: "Sabedoria" }, { value: "presenca", label: "Presença" }]} onChange={(v) => onPatch({ curaAttr: v })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Quem recebe</FieldLabel>
                    <OptionChips value={acao.alvoAuxilio} options={[{ value: "invocacao", label: "Invocação" }, { value: "aliados", label: "Aliados" }]} onChange={(v) => onPatch({ alvoAuxilio: v })} />
                  </div>
                  {acao.auxilioSub === "rd" && (
                    <div>
                      <FieldLabel hint="cada tipo extra reduz 2">Tipos de dano extras</FieldLabel>
                      <div className="w-24"><NumberInput value={acao.rdTiposExtras} onChange={(v) => onPatch({ rdTiposExtras: v })} min={0} max={9} aria-label="Tipos de dano extras" /></div>
                    </div>
                  )}
                </div>
              )}
              {res?.prejuizoMultiplos && (
                <p className="text-[10px] text-slate-500">Prejuízo por múltiplos auxílios: {res.prejuizoMultiplos}.</p>
              )}
            </div>
          )}

          {/* Ação com Custo */}
          <div className="rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-2">
            <div className="flex items-center gap-3">
              <FieldLabel hint={`0 a ${custoMax} PE neste grau`}>Ação com Custo (PE)</FieldLabel>
              <div className="w-24 ml-auto"><NumberInput value={acao.custoPE} onChange={(v) => onPatch({ custoPE: v })} min={0} max={custoMax} aria-label="Custo em PE da ação" /></div>
            </div>
            {(acao.custoPE ?? 0) > 0 && (
              <BeneficiosCustoEditor acao={acao} res={res} onPatch={onPatch} />
            )}
          </div>

          {/* prévia dos valores resolvidos */}
          {res && (
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
              {res.dano?.dado && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Dano: {res.dano.dado}{bonusSuf(res.dano.bonus)}</span>}
              {res.cura?.dado && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Cura: {res.cura.dado}{bonusSuf(res.cura.bonus)}</span>}
              {res.danoAdicional?.dado && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Adicional: {res.danoAdicional.dado}</span>}
              {res.valor != null && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Valor: {res.valor}{res.auxilioSub === "rd" ? " RD" : ""}</span>}
              {res.bonusAtaque != null && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Ataque: {res.bonusAtaque >= 0 ? "+" : ""}{res.bonusAtaque}</span>}
              {res.cd != null && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">CD: {res.cd}</span>}
              {res.alcance && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Alcance: {res.alcance}</span>}
              {res.area && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Área: {res.area}</span>}
              {res.condicoes?.length > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Condição: {res.condicoes.join(", ")}</span>}
            </div>
          )}

          <ExprField value={acao.modificadorExpr} onChange={(v) => onPatch({ modificadorExpr: v })} resultado={res?.modificador} />

          <div>
            <FieldLabel>Descrição</FieldLabel>
            <TextInput value={acao.descricao} onChange={(v) => onPatch({ descricao: v })} placeholder="texto da ação (opcional)" />
          </div>
        </div>
      )}
    </div>
  );
}

/* Resumo curto de uma Característica resolvida. */
function resumoCaracTexto(res) {
  if (!res) return "";
  switch (res.subtipo) {
    case "vida": return `+${res.valor} PV`;
    case "teste": return `+${res.valor}${res.requerGatilho ? " (gatilho)" : ""}`;
    case "rd": return `${res.valor} RD`;
    case "tamanho": return res.tamanho ? (AFTY_TAMANHOS.find((t) => t.value === res.tamanho)?.label ?? res.tamanho) : "tamanho";
    default: return "passiva";
  }
}

/* Uma Característica passiva: cabeçalho recolhível + editor. */
function CaracteristicaCard({ carac, res, grau, onPatch, onRemove }) {
  const [open, setOpen] = useState(!carac.nome);
  const tamOpts = tamanhosNaFaixa(grau).map((v) => AFTY_TAMANHOS.find((t) => t.value === v)).filter(Boolean);

  return (
    <div className="rounded-md border border-slate-700/70 bg-slate-900/40">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-[12px] font-semibold text-slate-100 truncate">{carac.nome || "Característica sem nome"}</span>
        </button>
        {resumoCaracTexto(res) && (
          <span className="hidden sm:inline font-mono text-[11px] text-purple-300 tabular-nums flex-shrink-0">{resumoCaracTexto(res)}</span>
        )}
        <button type="button" onClick={onRemove} className="text-slate-600 hover:text-rose-300 p-0.5 rounded flex-shrink-0" aria-label="Remover característica">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pt-1 space-y-3 border-t border-slate-800">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <TextInput value={carac.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da característica" />
          </div>

          <div>
            <FieldLabel>Tipo</FieldLabel>
            <OptionChips
              value={carac.subtipo}
              options={[
                { value: "vida", label: "Vida" }, { value: "teste", label: "Teste" },
                { value: "rd", label: "RD" }, { value: "tamanho", label: "Tamanho" }, { value: "livre", label: "Livre" },
              ]}
              onChange={(v) => onPatch({ subtipo: v })}
            />
          </div>

          {carac.subtipo === "teste" && (
            <div>
              <FieldLabel hint="Ataque e TR contam metade e exigem gatilho">Aplica em</FieldLabel>
              <OptionChips value={carac.alvoTeste} options={[{ value: "pericia", label: "Perícia" }, { value: "ataque", label: "Ataque" }, { value: "tr", label: "TR" }]} onChange={(v) => onPatch({ alvoTeste: v })} />
            </div>
          )}
          {carac.subtipo === "rd" && (
            <div>
              <FieldLabel hint="cada tipo extra reduz 2">Tipos de dano extras</FieldLabel>
              <div className="w-24"><NumberInput value={carac.rdTiposExtras} onChange={(v) => onPatch({ rdTiposExtras: v })} min={0} max={9} aria-label="Tipos de dano extras" /></div>
            </div>
          )}
          {carac.subtipo === "tamanho" && (
            <div className="sm:max-w-xs">
              <FieldLabel>Tamanho</FieldLabel>
              <Select value={carac.tamanho} onChange={(v) => onPatch({ tamanho: v })} options={tamOpts} placeholder="escolher..." />
            </div>
          )}

          {res && res.subtipo !== "livre" && (
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">{resumoCaracTexto(res)}</span>
            </div>
          )}

          <ExprField value={carac.modificadorExpr} onChange={(v) => onPatch({ modificadorExpr: v })} resultado={res?.modificador} />

          <div>
            <FieldLabel>Descrição</FieldLabel>
            <TextInput value={carac.descricao} onChange={(v) => onPatch({ descricao: v })} placeholder="texto da característica (opcional)" />
          </div>
        </div>
      )}
    </div>
  );
}

function TabInvocacoes({ draft, derived, addInvocacao, removeInvocacao, duplicarInvocacao, moverInvocacao, patchInvocacao, patchInvocacaoAttr, efeitosApi, addHorda, removeHorda, patchHorda }) {
  const lista = Array.isArray(draft.invocacoes) ? draft.invocacoes : [];
  const resolvidas = derived.invocacoes.lista;
  const resolvidaDe = (id) => resolvidas.find((r) => r.id === id);
  // Acesso a graus usa o nível de ESCALONAMENTO de Controlador (real + metade da
  // outra classe numa multiclasse). Pré-requisitos de habilidade usam o real.
  const nivelControlador = derived.especializacoes.escolhidas.find((e) => e.id === "controlador")?.nivelEscalonamento ?? 0;
  const grausOk = grausDisponiveis(nivelControlador);
  const grauMaisAlto = grauMeta(grausOk[grausOk.length - 1]).label;

  return (
    <>
    <Card
      title="Invocações"
      headerRight={
        <div
          className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
          title="Invocações na ficha e custo total em PE para invocar todas"
        >
          <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Invocações</span>
          <span className="font-mono text-xs font-bold tabular-nums text-white">{derived.invocacoes.total}</span>
          {derived.invocacoes.total > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-xs font-bold tabular-nums text-purple-300">{derived.invocacoes.custoTotal} PE</span>
            </>
          )}
        </div>
      }
    >
      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
        {nivelControlador > 0
          ? `Nível de Controlador ${nivelControlador}: acesso até ${grauMaisAlto}.`
          : "Sem nível de Controlador: os graus são definidos no Interlúdio, então aqui ficam todos disponíveis."}
      </p>

      {/* Concentrar Poder: contador de invocações marcadas contra o limite. */}
      {derived.invocacoes.concentrarPoder?.ativo && (
        <div className={`flex items-center gap-2 text-[11px] mb-3 rounded-md border px-2.5 py-1.5 ${
          derived.invocacoes.concentrarPoder.excedeu ? "border-rose-800 bg-rose-950/30 text-rose-300" : "border-slate-800 bg-slate-950/50 text-slate-400"
        }`}>
          <Star className="w-3 h-3 flex-shrink-0 text-purple-400" aria-hidden="true" />
          <span>
            Concentrar Poder · marcadas{" "}
            <span className="font-mono font-bold">{derived.invocacoes.concentrarPoder.marcadas}</span>
            {" / "}
            <span className="font-mono font-bold">{derived.invocacoes.concentrarPoder.limite}</span>
          </span>
          <span className="text-slate-600">Vale enquanto for a única marcada em campo.</span>
        </div>
      )}

      {lista.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
          Nenhuma invocação ainda.
          <div className="mt-3">
            <button
              type="button"
              onClick={() => addInvocacao(grausOk[0])}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50"
            >
              <Plus className="w-3.5 h-3.5" /> Nova invocação
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map((inv, i) => (
            <InvocacaoCard
              key={inv.id}
              inv={inv}
              resolvida={resolvidaDe(inv.id)}
              grausOk={grausOk}
              concentrarPoder={derived.invocacoes.concentrarPoder}
              podeSubir={i > 0}
              podeDescer={i < lista.length - 1}
              onPatch={(partial) => patchInvocacao(inv.id, partial)}
              onPatchAttr={(k, v) => patchInvocacaoAttr(inv.id, k, v)}
              onRemove={() => removeInvocacao(inv.id)}
              onDuplicar={() => duplicarInvocacao(inv.id)}
              onSubir={() => moverInvocacao(inv.id, -1)}
              onDescer={() => moverInvocacao(inv.id, 1)}
              acoesApi={efeitosApi(inv.id, "acoes", createBlankAcao)}
              caracApi={efeitosApi(inv.id, "caracteristicas", createBlankCaracteristica)}
            />
          ))}
          <button
            type="button"
            onClick={() => addInvocacao(grausOk[0])}
            className="w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
          >
            <Plus className="w-3.5 h-3.5" /> Nova invocação
          </button>
        </div>
      )}
    </Card>

    <HordasCard
      fichas={lista}
      resolvidas={derived.hordas.lista}
      custoTotal={derived.hordas.custoTotal}
      addHorda={addHorda}
      removeHorda={removeHorda}
      patchHorda={patchHorda}
    />
    </>
  );
}

/* Uma Horda: escolhe um líder (Primeiro Grau ou inferior) e membros de grau
   inferior. Custo, PV e tamanho crescem, e as ações do líder escalam. */
function HordaCard({ horda, res, fichas, onPatch, onRemove }) {
  const [open, setOpen] = useState(!horda.nome);
  const lider = fichas.find((x) => x.id === horda.liderId) || null;
  const lideres = lideresElegiveis(fichas);
  const membros = membrosElegiveis(fichas, lider);
  const nomeDe = (inv) => inv.nome || grauMeta(inv.grau).label;
  const membroIds = Array.isArray(horda.membroIds) ? horda.membroIds : [];

  const setLider = (id) => onPatch({ liderId: id, membroIds: [] }); // trocar líder zera membros
  const toggleMembro = (id) =>
    onPatch({ membroIds: membroIds.includes(id) ? membroIds.filter((x) => x !== id) : [...membroIds, id] });

  const e = res?.escala;
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/40">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-sm font-semibold text-white truncate">{horda.nome || "Horda sem nome"}</span>
          {lider && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 flex-shrink-0">
              {res?.membrosCount ?? 0} membro{(res?.membrosCount ?? 0) !== 1 ? "s" : ""}
            </span>
          )}
        </button>
        {res?.valido && (
          <span className="hidden sm:flex items-center gap-2 flex-shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
            <span title="Pontos de Vida">PV {res.pv}</span>
            <span title="Custo em PE" className="text-purple-300">{res.custo} PE</span>
          </span>
        )}
        <button type="button" onClick={onRemove} className="text-slate-600 hover:text-rose-300 p-1 rounded flex-shrink-0" aria-label="Remover horda">
          <X className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-4 border-t border-slate-800 pt-3">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <TextInput value={horda.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da horda" />
          </div>

          <div className="sm:max-w-xs">
            <FieldLabel hint="Primeiro Grau ou inferior">Líder</FieldLabel>
            {lideres.length === 0 ? (
              <p className="text-[11px] text-slate-500">Nenhuma invocação de Primeiro Grau ou inferior para liderar.</p>
            ) : (
              <Select value={horda.liderId} onChange={setLider} options={lideres.map((inv) => ({ value: inv.id, label: `${nomeDe(inv)} (${grauMeta(inv.grau).label})` }))} placeholder="escolher líder..." />
            )}
          </div>

          {lider && (
            <div>
              <FieldLabel hint="grau inferior ao do líder">Membros</FieldLabel>
              {membros.length === 0 ? (
                <p className="text-[11px] text-slate-500">Nenhuma invocação de grau inferior ao líder para adicionar.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {membros.map((m) => (
                    <BoolChip key={m.id} ativo={membroIds.includes(m.id)} onToggle={() => toggleMembro(m.id)}>
                      {nomeDe(m)} <span className="text-[9px] opacity-70">({grauMeta(m.grau).label})</span>
                    </BoolChip>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1.5">
                O limite de membros e de hordas em campo vem da habilidade Treinamento em Controle (sistema futuro), então não é travado aqui.
              </p>
            </div>
          )}

          {res?.warnings?.length > 0 && (
            <ul className="space-y-1">
              {res.warnings.map((w, i) => (
                <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5"><span aria-hidden="true">⚠</span> {w}</li>
              ))}
            </ul>
          )}

          {lider && res?.valido && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatMini label="Pontos de Vida" value={res.pv} />
                <StatMini label="Custo (PE)" value={res.custo} accent />
                <StatMini label="Tamanho" value={AFTY_TAMANHOS.find((t) => t.value === res.tamanho)?.label ?? res.tamanho} />
                <StatMini label="Deslocamento" value={res.deslocamento != null ? `${res.deslocamento} m` : "-"} />
              </div>

              {e && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Escalonamento pelos membros</div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Dano +{e.danoNiveis} nív.</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Cura +{e.curaNiveis} nív.</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Dano adic. +{e.danoAdicionalNiveis} nív.</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Defesa/Acerto +{e.defesaAcertoBonus}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">RD +{e.rdBonus}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Prejuízo +{e.prejuizoExtra} uso</span>
                  </div>
                </div>
              )}

              {res.acoes?.some((a) => a.horda) && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Ações do líder na horda</div>
                  <div className="space-y-1">
                    {res.acoes.filter((a) => a.horda).map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-[11px] bg-slate-950/50 border border-slate-800 rounded px-2 py-1">
                        <span className="text-slate-300 truncate">{a.nome || "Ação"}</span>
                        <span className="font-mono text-purple-300 tabular-nums flex-shrink-0">
                          {a.horda.dano && `${a.horda.dano}`}
                          {a.horda.cura && `${a.horda.cura}`}
                          {a.horda.danoAdicional && `+${a.horda.danoAdicional}`}
                          {a.horda.valor != null && `${a.horda.valor}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HordasCard({ fichas, resolvidas, custoTotal, addHorda, removeHorda, patchHorda }) {
  const temLider = lideresElegiveis(fichas).length > 0;
  const lista = resolvidas;

  return (
    <Card
      title="Hordas"
      headerRight={
        lista.length > 0 ? (
          <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1" title="Hordas e custo total em PE">
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Hordas</span>
            <span className="font-mono text-xs font-bold tabular-nums text-white">{lista.length}</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-xs font-bold tabular-nums text-purple-300">{custoTotal} PE</span>
          </div>
        ) : null
      }
    >
      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
        Uma Horda agrupa invocações suas: um líder (Primeiro Grau ou inferior) e membros de grau inferior. Os membros somam custo e PV, e escalam as ações do líder.
      </p>

      {!temLider ? (
        <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg text-sm text-slate-500">
          Crie ao menos uma invocação de Primeiro Grau ou inferior para formar hordas.
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
          Nenhuma horda ainda.
          <div className="mt-3">
            <button type="button" onClick={addHorda} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50">
              <Plus className="w-3.5 h-3.5" /> Nova horda
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lista.map((res) => {
            const horda = { id: res.id, nome: res.nome, liderId: res.liderId, membroIds: res.membros };
            return (
              <HordaCard
                key={res.id}
                horda={horda}
                res={res}
                fichas={fichas}
                onPatch={(partial) => patchHorda(res.id, partial)}
                onRemove={() => removeHorda(res.id)}
              />
            );
          })}
          <button type="button" onClick={addHorda} className="w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600">
            <Plus className="w-3.5 h-3.5" /> Nova horda
          </button>
        </div>
      )}
    </Card>
  );
}

/* ============================================================ */
/* Preview lateral (prévia em tempo real)                       */
/* ============================================================ */
function AftyPreview({ draft, derived }) {
  const tipoLabel = AFTY_TIPOS.find((t) => t.value === draft.core.tipo)?.label ?? draft.core.tipo;
  const patamarLabel = AFTY_PATAMARES.find((p) => p.value === draft.core.patamar)?.label ?? draft.core.patamar;
  const stats = [
    { k: "Vida", v: derived.hp, accent: "text-purple-300" },
    { k: "Energia", v: derived.pe, accent: "text-sky-400" },
    { k: "Defesa", v: derived.defesa },
    { k: "CD", v: derived.cd },
    { k: "RD Geral", v: derived.rdGeral },
    { k: "RD Espec.", v: derived.rdEspecifico },
    { k: "Movimento", v: `${derived.movimento}m` },
    { k: "Res. Parcial", v: derived.resParcial },
    { k: "Maestria", v: `+${derived.maestria}` },
  ];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold text-white">Preview</h3>
      </div>
      <div className="p-4">
        <div className="text-base font-bold text-white truncate">{draft.name || "Sem nome"}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800">
            {tipoLabel}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {patamarLabel}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            ND {derived.nd}
          </span>
          {derived.almaMult !== 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800">
              Alma {Math.round(derived.almaMult * 100)}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {stats.map((s) => (
            <div key={s.k} className="bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.k}</div>
              <div className={`font-mono font-bold text-lg tabular-nums ${s.accent || "text-white"}`}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
