import React, { useState, useMemo } from "react";
import {
  Save, ChevronLeft, ChevronDown, Wand2, Sparkles, FlaskConical,
  Dumbbell, GraduationCap, BookOpen, Check, ArrowRight, Lock, Plus, X, Zap,
  Copy, ArrowUp, ArrowDown, Heart, Shield, Footprints, AlertTriangle, Star,
} from "lucide-react";

import { FieldLabel, TextInput, TextArea, Select, NumberInput, StatField, ExpandableText } from "../../components/builder-controls";
import {
  createBlankAfty, AFTY_ATTRS, AFTY_TIPOS, AFTY_PATAMARES, AFTY_QNT_PE,
  AFTY_TECNICA_ATTRS, AFTY_TAMANHOS,
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
import {
  EQUIP_TIPOS, EQUIP_INICIAL, CUSTOS, ARMA_CATEGORIAS, ARMA_GRUPOS, TIPOS_DANO,
  ITEM_CATEGORIAS, catalogoDoTipo, novaEntradaEquip,
  orcamentoDoGrau, espacosDoEquipamento, custoDoEquipamento,
  getPropriedade, getEspecial, grupoLabel,
  CRIA_LABEL, REFEICOES_COZINHEIRO,
  AFTY_GRAUS, FA_TIPOS_EQUIP, FA_CRIACAO, FA_BONUS_ARMA, FA_RD_ESCUDO,
  FA_ENCANT_GANHO, FA_IDENTIFICACAO_CD, FA_GRAU_ESPECIAL_EXEMPLO,
  ENCANTAMENTOS_POR_TIPO, getEncantamento,
  avaliarRequisitoEncantamento, EQUIP_EFEITO_CANAIS,
} from "./afty-equipamentos";
import { validateExpression } from "../../components/fm-dsl";
import { deriveAfty } from "./afty-derive";
import {
  createBlankFeitico, calcularFeiticoDano, ALCANCE_POR_NIVEL, AREA_POR_NIVEL, taxasTroca,
  NIVEL_LABEL, FEITICO_ACOES, FORMAS_AREA, DANO_SUBTIPOS, REQUISITO_DIFICULDADE,
  CONDICAO_FORCAS, CONDICOES_CATALOGO, CONDICAO_FORCAS_POR_NIVEL,
  SANGRAMENTO, notacaoDano,
} from "./afty-feiticos";

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
 *   • Stubs: Habilidades, Equipamentos (próximos incrementos)
 * ============================================================
 */

const TABS = [
  { id: "identidade",    label: "Identidade" },
  { id: "informacoes",   label: "Informações" },
  { id: "habilidades",   label: "Habilidades" },
  { id: "especializacoes", label: "Especializações" },
  { id: "aptidoes",      label: "Aptidões" },
  { id: "invocacoes",    label: "Invocações" },
  { id: "equipamentos",  label: "Equipamentos" },
  { id: "interludios",   label: "Interlúdios" },
  { id: "calculos",      label: "Cálculos", afty: true },
];

// A aba Habilidades agora é REAL (Feitiços / Estilo das Sombras / Habilidades
// Marciais, conforme a origem). Nenhuma aba está em stub por ora.
const STUBS = {};

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

  // Feitiços: entradas CRIADAS pelo jogador. add/remove/patch simples.
  // O motor (afty-feiticos.js) computa dano/alcance/custo/CD por entrada.
  const addFeitico = () =>
    setDraft((d) => ({ ...d, feiticos: [...(Array.isArray(d.feiticos) ? d.feiticos : []), createBlankFeitico()] }));
  const removeFeitico = (id) =>
    setDraft((d) => ({ ...d, feiticos: (Array.isArray(d.feiticos) ? d.feiticos : []).filter((f) => f.id !== id) }));
  const patchFeitico = (id, partial) =>
    setDraft((d) => ({
      ...d,
      feiticos: (Array.isArray(d.feiticos) ? d.feiticos : []).map((f) => (f.id === id ? { ...f, ...partial } : f)),
    }));
  const duplicarFeitico = (id) =>
    setDraft((d) => {
      const lista = Array.isArray(d.feiticos) ? d.feiticos : [];
      const orig = lista.find((f) => f.id === id);
      if (!orig) return d;
      const copia = { ...orig, id: createBlankFeitico().id, nome: orig.nome ? `${orig.nome} (cópia)` : "" };
      const i = lista.findIndex((f) => f.id === id);
      const next = [...lista];
      next.splice(i + 1, 0, copia);
      return { ...d, feiticos: next };
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
  /* ---------- Equipamentos ---------- */
  // Uma entrada por linha do inventário. Equipar não é exclusivo (dá para
  // carregar duas armas equipadas), com uma exceção: o livro só deixa vestir
  // um uniforme, então equipar um desequipa o outro.
  const equipArr = (d) => (Array.isArray(d.equipamentos?.itens) ? d.equipamentos.itens : []);
  const setEquipArr = (d, itens) => ({ ...d, equipamentos: { ...(d.equipamentos || {}), itens } });

  const addEquipamento = (tipo, refId) =>
    setDraft((d) => setEquipArr(d, [...equipArr(d), novaEntradaEquip(tipo, refId)]));
  const removeEquipamento = (uid) =>
    setDraft((d) => setEquipArr(d, equipArr(d).filter((x) => x.uid !== uid)));
  const patchEquipamento = (uid, partial) =>
    setDraft((d) => {
      const alvo = equipArr(d).find((x) => x.uid === uid);
      const vestindoUniforme = alvo?.tipo === "uniforme" && partial.equipado === true;
      return setEquipArr(d, equipArr(d).map((x) => {
        if (x.uid === uid) return { ...x, ...partial };
        // Só um uniforme vestido por vez.
        if (vestindoUniforme && x.tipo === "uniforme") return { ...x, equipado: false };
        return x;
      }));
    });

  // Ferramenta Amaldiçoada: liga/desliga o campo `fa` de uma entrada. Só armas,
  // escudos e uniformes podem virar ferramenta. Desligar remove o campo inteiro.
  const toggleFerramenta = (uid) =>
    setDraft((d) => setEquipArr(d, equipArr(d).map((x) => {
      if (x.uid !== uid) return x;
      if (x.fa) { const resto = { ...x }; delete resto.fa; return resto; }
      return { ...x, fa: { grau: "quarto", encantamentos: [], habilidadeUnica: "" } };
    })));
  const patchFerramenta = (uid, faPartial) =>
    setDraft((d) => setEquipArr(d, equipArr(d).map((x) =>
      x.uid === uid && x.fa ? { ...x, fa: { ...x.fa, ...faPartial } } : x)));
  const toggleEncantamento = (uid, encId) =>
    setDraft((d) => setEquipArr(d, equipArr(d).map((x) => {
      if (x.uid !== uid || !x.fa) return x;
      const atuais = Array.isArray(x.fa.encantamentos) ? x.fa.encantamentos : [];
      const enc = atuais.includes(encId) ? atuais.filter((y) => y !== encId) : [...atuais, encId];
      return { ...x, fa: { ...x.fa, encantamentos: enc } };
    })));

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
          {tab === "habilidades" && <TabHabilidades draft={draft} derived={derived} patchCore={patchCore} addFeitico={addFeitico} removeFeitico={removeFeitico} patchFeitico={patchFeitico} duplicarFeitico={duplicarFeitico} />}
          {tab === "especializacoes" && <TabEspecializacoes draft={draft} derived={derived} setEspecializacoes={setEspecializacoes} toggleHabilidade={toggleHabilidade} toggleEscolhaHabilidade={toggleEscolhaHabilidade} toggleTalento={toggleTalento} setMelhoriaVezes={setMelhoriaVezes} toggleLendaria={toggleLendaria} toggleEscolhaAltoNivel={toggleEscolhaAltoNivel} />}
          {tab === "aptidoes" && <TabAptidoes draft={draft} derived={derived} setAptidaoNivel={setAptidaoNivel} toggleAptidao={toggleAptidao} />}
          {tab === "invocacoes" && <TabInvocacoes draft={draft} derived={derived} addInvocacao={addInvocacao} removeInvocacao={removeInvocacao} duplicarInvocacao={duplicarInvocacao} moverInvocacao={moverInvocacao} patchInvocacao={patchInvocacao} patchInvocacaoAttr={patchInvocacaoAttr} efeitosApi={efeitosApi} addHorda={addHorda} removeHorda={removeHorda} patchHorda={patchHorda} />}
          {tab === "equipamentos" && <TabEquipamentos derived={derived} addEquipamento={addEquipamento} removeEquipamento={removeEquipamento} patchEquipamento={patchEquipamento} toggleFerramenta={toggleFerramenta} patchFerramenta={patchFerramenta} toggleEncantamento={toggleEncantamento} />}
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
        {/* Ícone DENTRO do h2 (mesmo padrão do builder 2.5.2): como irmão do
            título ele se alinhava contra a altura da barra inteira, e não
            contra a linha do texto, o que deixava ele visivelmente alto. */}
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          {title}
        </h2>
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
/* Aba: Habilidades (Feitiços / Estilo das Sombras / Marciais)  */
/* ============================================================ */
/* A aba mostra UM subsistema por vez, escolhido pela ORIGEM, nunca
   combinados (autor, 2026-07): origem comum = Feitiços, Sem Técnica =
   Estilo das Sombras no lugar dos Feitiços, Restringido = Habilidades
   Marciais no lugar dos Feitiços. Feitiços são CRIADOS pelo jogador
   (não é catálogo): o motor em afty-feiticos.js computa cada um. */

const TIPO_FEITICO = [
  { value: "dano",     label: "Dano" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "curativo", label: "Curativo" },
  { value: "especial", label: "Especial" },
  { value: "passivo",  label: "Passivo" },
];
const TIPO_FEITICO_LABEL = Object.fromEntries(TIPO_FEITICO.map((t) => [t.value, t.label]));
const TIPO_IMPLEMENTADO = new Set(["dano"]);

function TabHabilidades({ draft, derived, patchCore, addFeitico, removeFeitico, patchFeitico, duplicarFeitico }) {
  const origem = draft.core.origem?.id;
  if (origem === "sem_tecnica") return <SubsistemaPendente titulo="Estilo das Sombras" origem="Sem Técnica" />;
  if (origem === "restringido") return <SubsistemaPendente titulo="Habilidades Marciais" origem="Restringido" />;
  return (
    <>
      <PerfilAmaldicoadoCard draft={draft} derived={derived} patchCore={patchCore} />
      <FeiticosCard draft={draft} derived={derived} addFeitico={addFeitico} removeFeitico={removeFeitico} patchFeitico={patchFeitico} duplicarFeitico={duplicarFeitico} />
    </>
  );
}

/* Estilo das Sombras e Habilidades Marciais entram em incrementos futuros. */
function SubsistemaPendente({ titulo, origem }) {
  return (
    <Card title={titulo}>
      <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
        A origem <span className="text-slate-200 font-semibold">{origem}</span> usa {titulo} no lugar de Feitiços.
        <div className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-2 py-0.5">
          próximo incremento
        </div>
      </div>
    </Card>
  );
}

/* Perfil Amaldiçoado: o Atributo Principal da Técnica É core.tecnicaAttr
   (já dirige a CD de Feitiçaria), então reusa esse campo. A Descrição da
   Técnica (Funcionamento Básico) é texto livre. */
function PerfilAmaldicoadoCard({ draft, derived, patchCore }) {
  const attrLabel = AFTY_TECNICA_ATTRS.find((a) => a.value === draft.core.tecnicaAttr)?.label ?? "-";
  return (
    <Card title="Perfil Amaldiçoado">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel hint="usado na CD e no dano dos Feitiços">Atributo Principal da Técnica</FieldLabel>
          <Select
            value={draft.core.tecnicaAttr}
            onChange={(v) => patchCore({ tecnicaAttr: v })}
            options={AFTY_TECNICA_ATTRS}
          />
        </div>
        <div className="flex flex-col justify-end">
          <div className="bg-slate-950/60 border border-slate-800 rounded p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">CD de Feitiçaria (base)</div>
            <div className="text-lg font-bold text-white tabular-nums">{derived.feiticos.cdBase}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">10 + escala do Tipo + mod de {attrLabel} + Maestria</div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel hint="Funcionamento Básico: o que a técnica permite fazer">Descrição da Técnica</FieldLabel>
        <TextArea
          value={draft.core.tecnicaDescricao}
          onChange={(v) => patchCore({ tecnicaDescricao: v })}
          rows={4}
          placeholder="Descreva o núcleo da técnica: o que ela faz, seus limites e o que ela concede (equipamentos, elemento, mecânicas próprias...)."
        />
      </div>
    </Card>
  );
}

/* Card dos Feitiços: orçamento no cabeçalho + lista de entradas criadas. */
function FeiticosCard({ draft, derived, addFeitico, removeFeitico, patchFeitico, duplicarFeitico }) {
  const lista = Array.isArray(draft.feiticos) ? draft.feiticos : [];
  const { total, gastos, excedeu, nivelMax } = derived.feiticos;
  const ctx = { nd: derived.nd, cdBase: derived.feiticos.cdBase };
  return (
    <Card
      title="Feitiços"
      headerRight={
        <div className="flex items-center gap-2" title="Feitiços criados / orçamento (Variações de Liberação não contam)">
          <span className={`font-mono text-sm font-bold tabular-nums ${excedeu ? "text-rose-400" : "text-slate-200"}`}>
            {gastos} / {total}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Feitiços</span>
        </div>
      }
    >
      {lista.length === 0 && (
        <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
          Nenhum Feitiço criado ainda.
        </div>
      )}

      <div className="space-y-2">
        {lista.map((f) => (
          <FeiticoCard
            key={f.id}
            feitico={f}
            ctx={ctx}
            nivelMax={nivelMax}
            onPatch={(partial) => patchFeitico(f.id, partial)}
            onRemove={() => removeFeitico(f.id)}
            onDuplicate={() => duplicarFeitico(f.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addFeitico}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        <Plus className="w-4 h-4" /> Criar Feitiço
      </button>
    </Card>
  );
}

/* Uma entrada de Feitiço: cabeçalho recolhível + editor por tipo.
   Mesmo chrome do InvocacaoCard (o editor complexo já aprovado). */
function FeiticoCard({ feitico, ctx, nivelMax, onPatch, onRemove, onDuplicate }) {
  const [open, setOpen] = useState(!feitico.nome);
  const [confirmDel, setConfirmDel] = useState(false);
  const calc = feitico.tipo === "dano" ? calcularFeiticoDano(feitico, ctx) : null;
  const temAviso = calc && calc.avisos.length > 0;

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/40">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
          <span className={`text-sm font-semibold truncate ${feitico.nome ? "text-white" : "text-slate-500"}`}>
            {feitico.nome || "Feitiço sem nome"}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 flex-shrink-0 whitespace-nowrap">
            {TIPO_FEITICO_LABEL[feitico.tipo]} · {NIVEL_LABEL[feitico.nivel]}
          </span>
          {temAviso && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-label={`${calc.avisos.length} aviso(s)`} title={calc.avisos.join("\n")} />}
        </button>
        {calc && (
          <span className="hidden sm:flex items-center gap-2 flex-shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
            <span title="Dano">{calc.dano}</span>
            <span title="Custo em PE" className="text-purple-300">{calc.custoPE} PE</span>
          </span>
        )}
        {confirmDel ? (
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-rose-300">Remover?</span>
            <button type="button" onClick={onRemove} className="text-rose-400 hover:text-rose-300 p-1 rounded" title="Confirmar" aria-label="Confirmar remoção"><Check className="w-4 h-4" /></button>
            <button type="button" onClick={() => setConfirmDel(false)} className="text-slate-500 hover:text-white p-1 rounded" title="Cancelar" aria-label="Cancelar"><X className="w-4 h-4" /></button>
          </span>
        ) : (
          <span className="flex items-center flex-shrink-0 text-slate-600">
            <button type="button" onClick={onDuplicate} className="p-1 rounded hover:text-white" title="Duplicar" aria-label="Duplicar Feitiço"><Copy className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => setConfirmDel(true)} className="p-1 rounded hover:text-rose-300" title="Remover Feitiço" aria-label={`Remover ${feitico.nome || "Feitiço"}`}><X className="w-4 h-4" /></button>
          </span>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-800 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Nome</FieldLabel>
              <TextInput value={feitico.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Nome do Feitiço" />
            </div>
            <div>
              <FieldLabel>Tipo</FieldLabel>
              <OptionChips value={feitico.tipo} options={TIPO_FEITICO} onChange={(v) => onPatch({ tipo: v })} />
            </div>
          </div>

          <div>
            <FieldLabel>Nível do Feitiço</FieldLabel>
            <NivelFeiticoPicker value={feitico.nivel} onChange={(n) => onPatch({ nivel: n })} nivelMax={nivelMax} />
          </div>

          {TIPO_IMPLEMENTADO.has(feitico.tipo) ? (
            <FeiticoDanoEditor feitico={feitico} calc={calc} onPatch={onPatch} />
          ) : (
            <div className="text-center py-5 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
              Feitiços {TIPO_FEITICO_LABEL[feitico.tipo]} entram num próximo incremento.
              <div className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-2 py-0.5">
                próximo incremento
              </div>
            </div>
          )}

          <div>
            <FieldLabel>Descrição</FieldLabel>
            <TextArea value={feitico.descricao} onChange={(v) => onPatch({ descricao: v })} rows={2} placeholder="O que o Feitiço faz na ficção." />
          </div>
        </div>
      )}
    </div>
  );
}

/* Cabeçalho de sub-seção dentro do editor (mesmo padrão das outras abas). */
function SecaoFeitico({ titulo, children }) {
  return (
    <div className="border-t border-slate-800 pt-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">{titulo}</div>
      {children}
    </div>
  );
}

/* Picker segmentado 0..5 do nível do Feitiço (medidor, não campo numérico). */
function NivelFeiticoPicker({ value, onChange, nivelMax }) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Nível do Feitiço">
      {[0, 1, 2, 3, 4, 5].map((n) => {
        const on = n === value;
        const off = n > nivelMax && !on;
        return (
          <button
            key={n}
            type="button"
            onClick={() => !off && onChange(n)}
            disabled={off}
            aria-pressed={on}
            title={off ? `Inacessível no ND atual (máximo ${NIVEL_LABEL[nivelMax]})` : NIVEL_LABEL[n]}
            className={`grow py-1.5 rounded-lg text-sm font-bold tabular-nums border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
              on
                ? "bg-purple-700 border-purple-600 text-white"
                : off
                  ? "border-slate-800 text-slate-700 cursor-not-allowed"
                  : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/* Stepper de delta (troca): valor com sinal, passo configurável. Mesmo
   chrome dos botões do NumberInput do app (w-9 h-9, slate-800/700). */
function DeltaStepper({ value, step, min, max, unit = "", onChange }) {
  const round2 = (x) => Math.round(x * 100) / 100;
  const dec = () => onChange(round2(Math.max(min ?? -Infinity, value - step)));
  const inc = () => onChange(round2(Math.min(max ?? Infinity, value + step)));
  const txt = `${value > 0 ? "+" : ""}${String(value).replace(".", ",")}${unit}`;
  const btn = "w-8 h-8 flex items-center justify-center text-base font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-30 focus:outline-none focus:z-10 focus:ring-1 focus:ring-purple-500";
  return (
    <div className="inline-flex items-center">
      <button type="button" onClick={dec} disabled={min != null && value <= min} className={`${btn} rounded-l`} aria-label="Diminuir">−</button>
      <span className={`w-16 h-8 flex items-center justify-center border-y border-slate-700 bg-slate-950 font-mono text-xs tabular-nums ${value === 0 ? "text-slate-500" : "text-purple-200"}`}>{txt}</span>
      <button type="button" onClick={inc} disabled={max != null && value >= max} className={`${btn} rounded-r`} aria-label="Aumentar">+</button>
    </div>
  );
}

/* Editor completo de um Feitiço de Dano, com cálculo ao vivo. */
function FeiticoDanoEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  const nNum = f.nivel === "max" ? 6 : f.nivel;
  const multiplos = f.subtipo === "multiplos";
  const cataclismico = f.subtipo === "cataclismico";
  const destrutivo = f.subtipo === "destrutivo";
  // Destrutivo e Cataclísmico são sempre área + Ritual Estendido (autor).
  const areaObrigatoria = destrutivo || cataclismico;
  const emArea = f.alvo === "area" || areaObrigatoria;
  const setTroca = (chave, v) => onPatch({ trocas: { ...f.trocas, [chave]: v } });
  const limDados = 1 + nNum;
  const limAcerto = 2 * nNum;
  const limCd = 1 + nNum;
  // Alcance/área: aumento com teto de (1 + nível), redução até 0.
  const taxas = taxasTroca(emArea ? "area" : "unico");
  const capAlcance = (1 + nNum) * taxas.alcance;
  const capArea = (1 + nNum) * taxas.area;
  const baseAlcance = ALCANCE_POR_NIVEL[f.nivel] ?? 0;
  // O modificador de área entra na BASE (crua): o piso de redução é a base.
  const baseArea = AREA_POR_NIVEL[f.nivel] ?? 0;
  // Cabeçalho da seção de Trocas: a proporção muda entre alvo único e área.
  const trocasTitulo = emArea
    ? "Trocas · 1 dado = 2 acerto = 1 CD = 12m = 3m² = 6m + 1,5m²"
    : "Trocas · 1 dado = 2 acerto = 6m = 1 CD";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3 space-y-3">
      {/* Perfil */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <FieldLabel>Resolução</FieldLabel>
            <OptionChips
              value={multiplos ? "ataque" : (emArea ? "tr" : f.resolucao)}
              onChange={(v) => onPatch({ resolucao: v })}
              options={[
                { value: "tr", label: "Resistência" },
                { value: "ataque", label: "Ataque" },
              ]}
              disabledValues={multiplos ? ["tr"] : (emArea ? ["ataque"] : [])}
            />
          </div>
          <div>
            <FieldLabel>Alvo</FieldLabel>
            <OptionChips
              value={emArea ? "area" : f.alvo}
              onChange={(v) => onPatch({ alvo: v, ...(v === "area" && !multiplos ? { resolucao: "tr" } : {}) })}
              options={[
                { value: "unico", label: "Alvo único", lockTitle: "Destrutivo e Cataclísmico são sempre em área" },
                { value: "area", label: "Área", lockTitle: "Múltiplos Disparos não podem ser em área" },
              ]}
              disabledValues={[...(areaObrigatoria ? ["unico"] : []), ...(multiplos ? ["area"] : [])]}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Conjuração (ação)</FieldLabel>
          <OptionChips
            value={areaObrigatoria ? "ritual" : f.acao}
            onChange={(v) => !areaObrigatoria && onPatch({ acao: v })}
            options={FEITICO_ACOES}
            disabledValues={areaObrigatoria ? FEITICO_ACOES.filter((a) => a.value !== "ritual").map((a) => a.value) : []}
          />
        </div>

        <div>
          <FieldLabel>Subtipo</FieldLabel>
          <OptionChips
            value={f.subtipo}
            onChange={(v) => onPatch(
              v === "cataclismico"
                ? { subtipo: v, alvo: "area", acao: "ritual", resolucao: "tr", formaArea: "esfera" }
                : v === "destrutivo"
                  ? { subtipo: v, alvo: "area", acao: "ritual", resolucao: "tr" }
                  : v === "multiplos"
                    ? { subtipo: v, alvo: "unico", resolucao: "ataque" }
                    : { subtipo: v })}
            options={DANO_SUBTIPOS}
          />
        </div>

        {emArea && !cataclismico && (
          <div>
            <FieldLabel>Forma da área</FieldLabel>
            <OptionChips value={f.formaArea} onChange={(v) => onPatch({ formaArea: v })} options={FORMAS_AREA} />
          </div>
        )}

        {/* Campos condicionais de subtipo */}
        {multiplos && (
          <div>
            <FieldLabel>Disparos</FieldLabel>
            <NivelSegmentos value={f.disparos} min={1} max={nNum + 1} onChange={(v) => onPatch({ disparos: v })} />
          </div>
        )}
        {f.subtipo === "continuo" && (
          <div>
            <FieldLabel>Modo do dano contínuo</FieldLabel>
            <OptionChips
              value={f.continuoModo}
              onChange={(v) => onPatch({ continuoModo: v })}
              options={[
                { value: "sustentado", label: `Sustentado (${nNum} PE/rodada)` },
                { value: "concentrado", label: "Concentrado" },
              ]}
            />
          </div>
        )}
        {f.subtipo === "destrutivo" && (
          <div className="flex flex-wrap gap-1.5">
            <BoolChip ativo={f.ignorarResistencias} onToggle={() => onPatch({ ignorarResistencias: !f.ignorarResistencias })}>Ignorar Resistências (−4d)</BoolChip>
            <BoolChip ativo={f.morteDireta} onToggle={() => onPatch({ morteDireta: !f.morteDireta })}>Morte Direta (−2d)</BoolChip>
          </div>
        )}
      </div>

      {/* Trocas */}
      <SecaoFeitico titulo={trocasTitulo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <TrocaLinha rotulo="Dados de dano"><DeltaStepper value={f.trocas.dados} step={1} min={-limDados} max={limDados} onChange={(v) => setTroca("dados", v)} /></TrocaLinha>
          {f.resolucao === "ataque" && !multiplos && (
            <TrocaLinha rotulo="Acerto"><DeltaStepper value={f.trocas.acerto} step={1} min={-limAcerto} max={limAcerto} onChange={(v) => setTroca("acerto", v)} /></TrocaLinha>
          )}
          <TrocaLinha rotulo="CD"><DeltaStepper value={f.trocas.cd} step={1} min={-limCd} max={limCd} onChange={(v) => setTroca("cd", v)} /></TrocaLinha>
          {/* Cataclísmico não reduz alcance nem área (autor). Destrutivo reduz os dois. */}
          {!cataclismico && (
            <TrocaLinha rotulo="Alcance"><DeltaStepper value={f.trocas.alcance} step={6} min={-baseAlcance} max={capAlcance} unit="m" onChange={(v) => setTroca("alcance", v)} /></TrocaLinha>
          )}
          {emArea && !cataclismico && (
            <TrocaLinha rotulo="Área"><DeltaStepper value={f.trocas.area} step={1.5} min={-baseArea} max={capArea} unit="m" onChange={(v) => setTroca("area", v)} /></TrocaLinha>
          )}
          <TrocaLinha rotulo="Empurrão (Gasta Dados)"><DeltaStepper value={f.trocas.empurraoDados} step={1} min={0} onChange={(v) => setTroca("empurraoDados", v)} /></TrocaLinha>
        </div>
      </SecaoFeitico>

      {/* Condições e sangramento */}
      <SecaoFeitico titulo="Condições">
        <CondicaoEditor feitico={f} onPatch={onPatch} />
      </SecaoFeitico>

      {/* Requisito */}
      <SecaoFeitico titulo="Requisito">
        <OptionChips
          value={f.requisito || "nenhum"}
          onChange={(v) => onPatch({ requisito: v === "nenhum" ? null : v })}
          options={[{ value: "nenhum", label: "Nenhum" }, ...REQUISITO_DIFICULDADE.map((r) => ({ value: r.value, label: `${r.label} (+${r.dados}d)` }))]}
        />
      </SecaoFeitico>

      {/* Resultado ao vivo */}
      {calc && <ResultadoFeitico calc={calc} feitico={f} />}
    </div>
  );
}

/* Medidor segmentado min..max (mesma linguagem do NivelPicker). */
function NivelSegmentos({ value, min, max, onChange }) {
  const nums = [];
  for (let n = min; n <= max; n += 1) nums.push(n);
  return (
    <div className="flex gap-1.5" role="group" aria-label="Quantidade">
      {nums.map((n) => {
        const on = n === value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={on}
            className={`grow py-1.5 rounded-lg text-sm font-bold tabular-nums border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
              on ? "bg-purple-700 border-purple-600 text-white" : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function TrocaLinha({ rotulo, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400">{rotulo}</span>
      {children}
    </div>
  );
}

/* Anexar condições ao Feitiço (reduzem dados) + sangramento variável. */
function CondicaoEditor({ feitico, onPatch }) {
  const f = feitico;
  // Somente Condição: escolhe do nível ACIMA (o motor só deixa UMA dessas).
  const permitidas = f.focoCondicao
    ? (CONDICAO_FORCAS_POR_NIVEL[Math.min((f.nivel === "max" ? 6 : f.nivel) + 1, 5)] || [])
    : (CONDICAO_FORCAS_POR_NIVEL[f.nivel] || []);
  const [forca, setForca] = useState(permitidas[0] || "fraca");
  const catalogo = (CONDICOES_CATALOGO[forca] || []).filter((n) => n !== "Sangramento");
  const [nome, setNome] = useState(catalogo[0] || "");

  const forcaAtual = permitidas.includes(forca) ? forca : (permitidas[0] || "fraca");
  const opcoesNome = (CONDICOES_CATALOGO[forcaAtual] || []).filter((n) => n !== "Sangramento");

  const adicionar = () => {
    const alvo = nome && opcoesNome.includes(nome) ? nome : opcoesNome[0];
    if (!alvo) return;
    onPatch({ condicoes: [...(f.condicoes || []), { nome: alvo, forca: forcaAtual }] });
  };
  const remover = (i) => onPatch({ condicoes: (f.condicoes || []).filter((_, j) => j !== i) });

  const redLabel = { fraca: "−1d", media: "−3d", forte: "−5d", extrema: "−8d" };
  const maxCond = f.nivel === "max" ? 6 : f.nivel;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-slate-500">Máximo {maxCond} no {NIVEL_LABEL[f.nivel]}</span>
        <BoolChip ativo={f.focoCondicao} onToggle={() => onPatch({ focoCondicao: !f.focoCondicao })}>Somente Condição</BoolChip>
      </div>

      {permitidas.length === 0 ? (
        <p className="text-[11px] text-slate-500">Nível 0 não aplica condições.</p>
      ) : (
        <div className="space-y-2">
          <OptionChips
            value={forcaAtual}
            onChange={(v) => { setForca(v); const first = (CONDICOES_CATALOGO[v] || []).filter((n) => n !== "Sangramento")[0]; setNome(first || ""); }}
            options={CONDICAO_FORCAS.filter((c) => permitidas.includes(c.value)).map((c) => ({ value: c.value, label: `${c.label} ${redLabel[c.value]}` }))}
          />
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Select value={nome} onChange={setNome} options={opcoesNome.map((n) => ({ value: n, label: n }))} />
            </div>
            <SmallButtonLocal onClick={adicionar}>Adicionar</SmallButtonLocal>
          </div>
        </div>
      )}

      {(f.condicoes || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {f.condicoes.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs bg-purple-950/40 text-purple-200 border-purple-900/70">
              {c.nome} <span className="text-purple-400/70">{redLabel[c.forca]}</span>
              <button type="button" onClick={() => remover(i)} className="ml-0.5 opacity-60 hover:opacity-100" aria-label={`Remover ${c.nome}`}>×</button>
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Sangramento</div>
        <OptionChips
          value={f.sangramento || "nenhum"}
          onChange={(v) => onPatch({ sangramento: v === "nenhum" ? null : v })}
          options={[
            { value: "nenhum", label: "Nenhum" },
            ...Object.entries(SANGRAMENTO).map(([k, [q, t]]) => ({ value: k, label: `${k[0].toUpperCase()}${k.slice(1)} ${notacaoDano(q, t)}` })),
          ]}
        />
      </div>
    </div>
  );
}

function SmallButtonLocal({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 h-9 rounded border text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
    >
      <Plus className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

/* Painel de resultado computado do Feitiço. Mesmo bloco de stats da Invocação
   (StatMini em grid + notas embaixo). */
function ResultadoFeitico({ calc, feitico }) {
  const ehArea = feitico.subtipo === "destrutivo" || feitico.subtipo === "cataclismico" || feitico.alvo === "area";
  const tiles = [
    { label: "Dano", value: calc.dano, icon: Zap, accent: true },
    { label: "Média", value: calc.media != null ? calc.media : "-" },
    { label: "Custo", value: calc.custoPE != null ? `${calc.custoPE} PE` : "-" },
    { label: "CD", value: calc.cd ?? "-", icon: Shield },
    { label: "Alcance", value: calc.alcance != null ? `${calc.alcance} m` : "-", icon: Footprints },
  ];
  if (ehArea) {
    tiles.push({ label: "Área", value: calc.detalhes?.areaMapa ? "Mapa" : (calc.area != null ? `${calc.area} m ${calc.forma || ""}`.trim() : "-") });
  }
  if (feitico.resolucao === "ataque" && !ehArea && calc.acertoDelta) tiles.push({ label: "Acerto", value: `${calc.acertoDelta > 0 ? "+" : ""}${calc.acertoDelta}` });
  if (calc.empurraoMetros) tiles.push({ label: "Empurrão", value: `${calc.empurraoMetros} m` });

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map((t) => (
          <StatMini key={t.label} label={t.label} value={t.value} accent={t.accent} icon={t.icon} />
        ))}
      </div>

      <div className={`text-[11px] font-mono ${calc.saldoTrocas < 0 ? "text-rose-400" : "text-purple-300"}`}>
        Saldo de Trocas: {calc.saldoTrocas > 0 ? "+" : ""}{calc.saldoTrocas}
      </div>

      {calc.contInicial && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          Golpe {calc.contInicial}, depois {calc.contPorRodada} por rodada
          {calc.detalhes.continuo?.custoSustentacao ? ` (sustentação ${calc.detalhes.continuo.custoSustentacao} PE/rodada)` : ""}
        </div>
      )}
      {calc.disparos && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          {calc.disparos.disparos} disparos de {notacaoDano(calc.disparos.porDisparo, calc.tipoDado)}, ou {notacaoDano(calc.disparos.concentradoTotal, calc.tipoDado)} concentrado num alvo
        </div>
      )}
      {feitico.subtipo === "cataclismico" && (
        <div className="text-[11px] text-amber-300/80 border-t border-slate-800 pt-2">Área vira o mapa inteiro, ignora Resistências e RD, 1/3 do dano vira perda de vida no usuário. Não pode ser modificado.</div>
      )}

      {calc.avisos.length > 0 && (
        <ul className="space-y-0.5 border-t border-slate-800 pt-2">
          {calc.avisos.map((a, i) => (
            <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {a}
            </li>
          ))}
        </ul>
      )}
    </div>
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

/* ============================================================ */
/* Aba: Equipamentos                                            */
/* ============================================================ */
/* Espaços de item e carregamento em cima (é o que limita), depois o
   orçamento por grau (INDICATIVO, não trava nada), o que o equipado
   está fazendo com a ficha, o que está carregado e o catálogo. */

/** "0,5" em vez de "0.5". Consumível ocupa meio espaço. */
const fmtEspacos = (n) => String(n).replace(".", ",");

const abrevDano = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");

function fmtDano(dano) {
  if (!dano) return "Sem dano";
  if (dano.desarmado) return "Desarmado";
  if (Array.isArray(dano.dados)) {
    return dano.dados.map((d) => `${d.dado} ${abrevDano(d.tipo)}`).join(" + ");
  }
  const base = dano.duasMaos ? `${dano.dado}/${dano.duasMaos}` : dano.dado;
  return `${base} ${abrevDano(dano.tipo)}`.trim();
}

/** Propriedades da arma como texto legível, com o parâmetro embutido. */
function fmtProps(props) {
  return Object.entries(props ?? {}).map(([id, val]) => {
    const p = getPropriedade(id);
    const nome = p?.nome ?? id;
    if (val === true) return nome;
    switch (p?.param) {
      case "alcance": return `${nome} [${val[0]}/${val[1]}m]`;
      case "numero":  return `${nome} [${val}]`;
      case "dado":    return `${nome} ${val}`;
      case "tipo":    return `${nome} ${abrevDano(val)}`;
      default:        return `${nome} ${val}`;
    }
  });
}

/** Barra de carregamento. O teto duro (dobro do limite) fica marcado. */
function CargaBarra({ carga }) {
  const { espacosUsados, cargaLimite, cargaMaxima, sobrecarregado, acimaDoMaximo } = carga;
  // A barra vai até o teto duro, com o limite normal marcado no meio.
  const pct = cargaMaxima > 0 ? Math.min(100, (espacosUsados / cargaMaxima) * 100) : 0;
  const cor = acimaDoMaximo ? "bg-rose-600" : sobrecarregado ? "bg-amber-500" : "bg-purple-600";
  return (
    <div>
      <div className="relative h-3 bg-slate-950 border border-slate-800 rounded overflow-hidden">
        <div className={`h-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-500" title={`Limite sem sobrecarga: ${cargaLimite}`} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
        <span>0</span>
        <span title="Limite sem sobrecarga">{cargaLimite}</span>
        <span title="Teto absoluto (dobro do limite)">{cargaMaxima}</span>
      </div>
    </div>
  );
}

/* Uma linha do catálogo de Encantamentos, dentro do editor de Ferramenta.
   Recolhida como as demais: toggle para escolher, chevron para ler a regra.
   Os pré-requisitos vão como TEXTO (RequisitoLista), igual em Aptidões e
   Especializações: roxo + cadeado quando falta, cinza quando atendido. */
function EncantamentoLinha({ enc, selecionado, reqs, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border ${
      selecionado ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selecionado}
          title={selecionado ? "Remover encantamento" : "Adicionar encantamento"}
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            selecionado
              ? "bg-purple-700 border-purple-600 text-white"
              : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {selecionado ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span className="text-[12px] font-semibold text-slate-100 truncate" title={enc.nome}>{enc.nome}</span>
          {enc.usaCargas && (
            <span className="text-[10px] font-medium text-sky-300 flex-shrink-0" title="Gasta Cargas de Encantamento">
              Cargas
            </span>
          )}
          <RequisitoLista reqs={reqs} />
        </button>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>
      {open && (
        <p className="px-2.5 pb-2.5 pt-0.5 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80">
          {enc.preReq && (
            <span className="block text-[10px] text-purple-300 mb-1">Pré-Requisito: {enc.preReq}</span>
          )}
          {enc.descricao}
        </p>
      )}
    </div>
  );
}

/* Seção recolhível dentro do editor de Ferramenta: cabeçalho clicável com um
   resumo à direita, corpo escondido por padrão. Mesmo padrão de recolher do app. */
function SecaoRecolhivel({ titulo, resumo, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-2.5 h-8 text-left"
      >
        <span className="text-[10px] uppercase tracking-wider text-slate-400 flex-shrink-0">{titulo}</span>
        <span className="flex-1 min-w-0 text-right text-[11px] text-slate-300 truncate">{resumo}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="px-2.5 pb-2.5 pt-0.5 border-t border-slate-800/80">{children}</div>}
    </div>
  );
}

/* Motor de Automação da Habilidade Única: lista de efeitos {canal, expr} que o
   jogador programa. `efeitos` chega RESOLVIDO (com valor e ok), a edição devolve
   só {canal, expr}. Aplicado enquanto a Ferramenta está equipada. */
function MotorEfeitosEditor({ efeitos, onChange }) {
  const bruto = () => efeitos.map((e) => ({ canal: e.canal, expr: e.expr }));
  const add = () => onChange([...bruto(), { canal: "defesa", expr: "" }]);
  const remove = (i) => onChange(bruto().filter((_, idx) => idx !== i));
  const patch = (i, partial) => onChange(bruto().map((e, idx) => (idx === i ? { ...e, ...partial } : e)));
  return (
    <div className="space-y-1.5">
      <FieldLabel hint="opcional: bt, nd, grau, mod_forca, forca, piso(x), max(a,b)...">
        Motor de Automação (efeitos enquanto equipada)
      </FieldLabel>
      {efeitos.map((ef, i) => {
        const chk = validateExpression(ef.expr || "");
        return (
          <div key={i} className="flex items-start gap-2">
            <div className="w-32 flex-shrink-0">
              <Select
                value={ef.canal}
                onChange={(v) => patch(i, { canal: v })}
                options={EQUIP_EFEITO_CANAIS.map((c) => ({ value: c.value, label: c.label }))}
              />
            </div>
            <div className="flex-1 min-w-0">
              <TextInput value={ef.expr} onChange={(v) => patch(i, { expr: v })} placeholder="ex.: 2 + piso(bt / 2)" />
              {ef.expr && (
                chk.ok
                  ? <p className="text-[10px] text-emerald-400 mt-0.5">= {ef.valor ?? 0}</p>
                  : <p className="text-[10px] text-rose-400 mt-0.5">{chk.error}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-slate-600 hover:text-rose-300 p-1 rounded flex-shrink-0"
              aria-label="Remover efeito"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200"
      >
        <Plus className="w-3 h-3" /> Adicionar efeito
      </button>
    </div>
  );
}

/* Editor da Ferramenta Amaldiçoada de uma entrada: grau, benefícios do grau,
   escolha de encantamentos (com pré-requisito) e a habilidade única do Especial.
   Grau e Encantamentos são RECOLHÍVEIS (o autor pediu), colapsados por padrão.
   `fa` aqui é o resumo JÁ resolvido pelo motor (entrada.fa). */
function FerramentaEditor({ entrada, onPatch, onToggleEnc, onRemove }) {
  const { tipo, def, fa } = entrada;
  const lista = ENCANTAMENTOS_POR_TIPO[tipo] ?? [];
  const beneficio =
    tipo === "arma" ? `Bônus de Arma +${fa.bonusArma}` :
    tipo === "escudo" ? `RD Física +${fa.rdGrau} (grau, soma com o escudo)` : null;
  const nomesEscolhidos = fa.escolhidos.map((id) => getEncantamento(id)?.nome ?? id);
  const resumoEnc = nomesEscolhidos.length ? nomesEscolhidos.join(", ") : "Nenhum";

  return (
    <div className="px-2.5 pb-3 pt-2.5 border-t border-purple-900/50 space-y-2.5 bg-purple-950/10">
      {/* Benefícios do grau + remover */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {beneficio && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">{beneficio}</span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
          fa.excedeu ? "bg-rose-950/50 text-rose-300" : "bg-slate-800 text-slate-300"
        }`} title="Encantamentos escolhidos / permitidos no grau (acumulam)">
          Encantamentos {fa.escolhidos.length}/{fa.permitidos}
        </span>
        {fa.usaCargas && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono" title="Cargas de Encantamento = bônus de treinamento do portador">
            Cargas {fa.cargas} (= BT)
          </span>
        )}
        {fa.temHabUnica && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 font-mono">Habilidade única</span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
        >
          Deixar de ser ferramenta
        </button>
      </div>

      {fa.avisos.length > 0 && (
        <div className="space-y-0.5">
          {fa.avisos.map((a) => (
            <p key={a} className="text-[10px] text-amber-400 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
              <span>{a}</span>
            </p>
          ))}
        </div>
      )}

      {/* Grau de Equipamento (recolhível) */}
      <SecaoRecolhivel titulo="Grau de Equipamento" resumo={fa.grauLabel}>
        <div className="flex gap-1 pt-1.5">
          {AFTY_GRAUS.map((g) => {
            const on = g.value === fa.grau;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => onPatch({ grau: g.value })}
                aria-pressed={on}
                title={`${g.label} · criação CD ${FA_CRIACAO[g.value].cd}, BT +${FA_CRIACAO[g.value].btNecessario}`}
                className={`grow justify-center whitespace-nowrap px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {g.label.replace(" Grau", "")}
              </button>
            );
          })}
        </div>
      </SecaoRecolhivel>

      {/* Encantamentos (recolhível) */}
      <SecaoRecolhivel
        titulo={`Encantamentos ${fa.escolhidos.length}/${fa.permitidos}`}
        resumo={resumoEnc}
      >
        <div className="space-y-1 pt-1.5">
          {lista.map((enc) => {
            const selecionado = fa.escolhidos.includes(enc.id);
            // Pré-requisitos no formato do RequisitoLista (texto), mais a
            // exclusão mútua (Certeira/Destruidora) como um requisito de texto.
            const reqs = (enc.requisitos ?? []).map((r) => {
              const res = avaliarRequisitoEncantamento(r, { def, grauValue: fa.grau, escolhidos: fa.escolhidos, selfId: enc.id });
              return { label: res.motivo, verificavel: true, ok: res.ok };
            });
            for (const x of enc.exclusivoCom ?? []) {
              if (fa.escolhidos.includes(x)) {
                reqs.push({ label: `Não com ${getEncantamento(x)?.nome ?? x}`, verificavel: true, ok: false });
              }
            }
            return (
              <EncantamentoLinha
                key={enc.id}
                enc={enc}
                selecionado={selecionado}
                reqs={reqs}
                onToggle={() => onToggleEnc(enc.id)}
              />
            );
          })}
        </div>
      </SecaoRecolhivel>

      {/* Habilidade Única (Grau Especial): texto + Motor de Automação */}
      {fa.temHabUnica && (
        <div className="rounded-lg border border-purple-900/40 bg-purple-950/20 px-2.5 py-2.5 space-y-2">
          <span className="block text-[10px] uppercase tracking-wider text-purple-200">
            Habilidade Única (criada com o Narrador)
          </span>
          <textarea
            value={fa.habilidadeUnica}
            onChange={(ev) => onPatch({ habilidadeUnica: ev.target.value })}
            rows={3}
            placeholder="Descreva a habilidade única desta ferramenta de Grau Especial."
            className="w-full text-[12px] rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-600 resize-y"
          />
          <MotorEfeitosEditor
            efeitos={fa.habilidadeEfeitos}
            onChange={(arr) => onPatch({ habilidadeEfeitos: arr })}
          />
        </div>
      )}
    </div>
  );
}

/** Uma linha do que está carregado (com o editor de Ferramenta, se aplicável). */
function LinhaCarregada({ entrada, onPatch, onRemove, onToggleFerramenta, onPatchFerramenta, onToggleEncantamento }) {
  const { def, tipo, uid, qtd, equipado, fa } = entrada;
  const equipavel = tipo === "uniforme" || tipo === "escudo" || def?.efeito;
  const podeSerFerramenta = FA_TIPOS_EQUIP.includes(tipo);
  const [faOpen, setFaOpen] = useState(false);

  const clicarFerramenta = () => {
    if (fa) { setFaOpen((o) => !o); return; }
    onToggleFerramenta(uid);       // vira ferramenta
    setFaOpen(true);
  };

  return (
    <div className={`rounded-lg border ${
      fa ? "border-purple-700/70 bg-purple-950/20"
      : equipado ? "border-purple-700 bg-purple-950/30"
      : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-2 px-2.5 h-9">
        {equipavel ? (
          <button
            type="button"
            onClick={() => onPatch(uid, { equipado: !equipado })}
            aria-pressed={equipado}
            title={equipado ? "Desequipar" : "Equipar"}
            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
              equipado
                ? "bg-purple-700 border-purple-600 text-white"
                : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
            }`}
          >
            {equipado ? <Check className="w-3 h-3" /> : <Shield className="w-2.5 h-2.5" />}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        <span className="text-[12px] font-semibold text-slate-100 truncate flex-1 min-w-0" title={def?.nome}>
          {def?.nome}
          {fa && (
            <span className="ml-1.5 text-[9px] font-mono font-bold px-1 rounded bg-purple-500/25 text-purple-200 align-middle">
              {fa.grauLabel.replace(" Grau", "")}
            </span>
          )}
        </span>

        {podeSerFerramenta && (
          <button
            type="button"
            onClick={clicarFerramenta}
            aria-pressed={!!fa}
            aria-expanded={fa ? faOpen : undefined}
            title={fa ? "Editar Ferramenta Amaldiçoada" : "Transformar em Ferramenta Amaldiçoada"}
            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
              fa
                ? "bg-purple-700/40 border-purple-600 text-purple-200"
                : "border-slate-700 text-slate-600 hover:border-purple-600 hover:text-purple-300"
            }`}
          >
            <Wand2 className="w-3 h-3" />
          </button>
        )}

        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 tabular-nums" title="Espaços ocupados">
          {fmtEspacos(entrada.espacos)} esp
        </span>
        {entrada.custoUn > 0 && (
          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0" title="Custo do equipamento">
            C{entrada.custoUn}
          </span>
        )}

        <div className="flex items-center gap-px flex-shrink-0" role="group" aria-label="Quantidade">
          <button
            type="button"
            onClick={() => onPatch(uid, { qtd: Math.max(1, qtd - 1) })}
            disabled={qtd <= 1}
            className="w-5 h-5 rounded-l bg-slate-800 text-slate-400 text-xs disabled:opacity-40 hover:bg-slate-700"
            aria-label="Diminuir quantidade"
          >
            -
          </button>
          <span className="w-6 text-center text-[11px] font-mono text-white tabular-nums bg-slate-900">{qtd}</span>
          <button
            type="button"
            onClick={() => onPatch(uid, { qtd: qtd + 1 })}
            className="w-5 h-5 rounded-r bg-slate-800 text-slate-400 text-xs hover:bg-slate-700"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(uid)}
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-slate-600 hover:text-rose-400 hover:bg-rose-950/40"
          aria-label={`Remover ${def?.nome}`}
          title="Remover do inventário"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {fa && faOpen && (
        <FerramentaEditor
          entrada={entrada}
          onPatch={(partial) => onPatchFerramenta(uid, partial)}
          onToggleEnc={(encId) => onToggleEncantamento(uid, encId)}
          onRemove={() => { onToggleFerramenta(uid); setFaOpen(false); }}
        />
      )}
    </div>
  );
}

/* Linha do catálogo. RECOLHIDA por padrão, mesmo padrão das Aptidões:
   são 52 armas e 48 itens especiais, abertas de uma vez viram um
   paredão. A linha fechada mostra o que serve para ESCOLHER. */
function CatalogoLinha({ tipo, def, onAdd, jaTem }) {
  const [open, setOpen] = useState(false);
  const espacos = espacosDoEquipamento(tipo, def);
  const custo = custoDoEquipamento(tipo, def);
  const especial = def.especial ? getEspecial(def.especial) : null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40">
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={() => onAdd(tipo, def.id)}
          aria-label={`Adicionar ${def.nome}`}
          title="Adicionar ao inventário"
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border border-slate-600 text-slate-500 transition-colors hover:border-purple-600 hover:text-purple-300"
        >
          <Plus className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span className="text-[12px] font-semibold text-slate-100 truncate" title={def.nome}>{def.nome}</span>
          {jaTem > 0 && (
            <span className="text-[9px] font-mono font-bold px-1 rounded bg-purple-500/25 text-purple-300 flex-shrink-0">
              {jaTem}
            </span>
          )}
          {tipo === "arma" && (
            <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{fmtDano(def.dano)}</span>
          )}
          {tipo === "arma" && def.critico && (
            <span className="text-[10px] text-slate-600 font-mono flex-shrink-0" title="Margem de crítico">
              {def.critico}+
            </span>
          )}
          {tipo === "uniforme" && def.defesa > 0 && (
            <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0">+{def.defesa} Def</span>
          )}
          {tipo === "escudo" && (
            <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0">{def.rdFisico} RD Fís</span>
          )}
          {def.penalidade < 0 && (
            <span className="text-[10px] text-amber-400 font-mono flex-shrink-0" title="Penalidade em testes de Destreza">
              {def.penalidade} Des
            </span>
          )}
        </button>

        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 tabular-nums" title="Espaços">
          {fmtEspacos(espacos)}
        </span>
        {custo > 0 && (
          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0" title="Custo">C{custo}</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pt-0.5 border-t border-slate-800/80 space-y-2">
          {tipo === "arma" && (
            <div className="flex flex-wrap gap-1 pt-2">
              <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {def.classe === "simples" ? "Simples" : "Complexa"}
              </span>
              <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {grupoLabel(def.grupo)}
              </span>
              {fmtProps(def.props).map((p) => (
                <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300">{p}</span>
              ))}
            </div>
          )}
          {tipo === "kit" && (
            <div className="flex flex-wrap gap-1 pt-2">
              <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                Ofício ({def.oficio})
              </span>
              {(def.cria ?? []).map((c) => (
                <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300">
                  Cria {CRIA_LABEL[c]}
                </span>
              ))}
            </div>
          )}
          {def.descricao && (
            <p className="text-[11px] text-slate-400 leading-relaxed">{def.descricao}</p>
          )}
          {tipo === "kit" && def.refeicoes && (
            <div className="space-y-1 pt-0.5">
              {REFEICOES_COZINHEIRO.map((r) => (
                <p key={r.id} className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-purple-300 font-semibold">{r.nome}. </span>
                  {r.descricao}
                </p>
              ))}
            </div>
          )}
          {especial && (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-purple-300 font-semibold">{especial.nome}. </span>
              {especial.descricao}
            </p>
          )}
          {def.efeito && !def.efeito.aplicado && (
            <p className="text-[10px] text-amber-400/80">
              O motor ainda não aplica este efeito (depende de sistema que não existe).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Só `derived`: o motor já devolve as entradas resolvidas (equip.entradas),
// com a definição do catálogo junto, então a aba não precisa do draft cru.
function TabEquipamentos({ derived, addEquipamento, removeEquipamento, patchEquipamento, toggleFerramenta, patchFerramenta, toggleEncantamento }) {
  const { equip, carga, grauFeiticeiro: grau } = derived;
  const [catTab, setCatTab] = useState("arma");
  const [busca, setBusca] = useState("");
  const [subFiltro, setSubFiltro] = useState("todos");
  // As armas são duas listas separadas no livro (simples e complexas), então
  // são duas abas, e não um filtro. A categoria (corpo, distância, arremesso)
  // continua como filtro por cima.
  const [classeArma, setClasseArma] = useState("simples");

  const orcamento = orcamentoDoGrau(grau.value);

  // Sub-filtros: categoria da arma, categoria do item especial. Os demais
  // tipos são listas curtas e não precisam.
  const subOpcoes =
    catTab === "arma" ? ARMA_CATEGORIAS
    : catTab === "item" ? ITEM_CATEGORIAS
    : null;

  const lista = useMemo(() => {
    let l = catalogoDoTipo(catTab);
    if (catTab === "arma") l = l.filter((d) => d.classe === classeArma);
    if (subFiltro !== "todos") l = l.filter((d) => d.categoria === subFiltro);
    const q = busca.trim().toLowerCase();
    if (q) {
      l = l.filter((d) =>
        d.nome.toLowerCase().includes(q) ||
        (catTab === "arma" && grupoLabel(d.grupo).toLowerCase().includes(q)));
    }
    return l;
  }, [catTab, classeArma, subFiltro, busca]);

  // Quantas unidades de cada refId já estão no inventário, para o contador
  // do catálogo.
  const contagem = useMemo(() => {
    const m = {};
    for (const e of equip.entradas) m[e.refId] = (m[e.refId] ?? 0) + e.qtd;
    return m;
  }, [equip.entradas]);

  const porTipo = EQUIP_TIPOS
    .map((t) => ({ ...t, entradas: equip.entradas.filter((e) => e.tipo === t.value) }))
    .filter((t) => t.entradas.length > 0);

  const temEfeito =
    equip.uniformeDefesa !== 0 || equip.rdFisico !== 0 || equip.penalidadeDestreza !== 0 ||
    equip.hpMaxBonus !== 0 || equip.cdBonus !== 0 ||
    equip.defesaBonus !== 0 || equip.movimentoBonus !== 0 || equip.rdGeralBonus !== 0 || equip.peBonus !== 0 ||
    Object.values(equip.attrBonus).some((v) => v !== 0);

  return (
    <>
      <Card
        title="Carregamento"
        headerRight={
          <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1" title="Espaços usados / limite sem sobrecarga">
            <Zap className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Espaços</span>
            <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
              <span className={carga.sobrecarregado ? "text-amber-400" : "text-white"}>{fmtEspacos(carga.espacosUsados)}</span>
              <span className="text-slate-600"> / </span>
              <span className="text-white">{carga.cargaLimite}</span>
            </span>
          </div>
        }
      >
        <CargaBarra carga={carga} />
        {carga.sobrecarregado && (
          <p className="text-[11px] text-amber-400 mt-3 flex items-start gap-1.5">
            {/* w-3 + mt-0.5 é a convenção de aviso da ficha (ver as Invocações):
                o ícone de 14px ficava alto demais para um texto de 11px. */}
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Sobrecarregado.</strong> Já aplicado no motor: -5 na Defesa e -4,5m no Deslocamento.
            </span>
          </p>
        )}
        {equip.avisos.map((a) => (
          <p key={a} className="text-[11px] text-rose-400 mt-2">{a}</p>
        ))}
      </Card>

      <Card
        title="Orçamento de Equipamento"
        headerRight={
          <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1">
            <Star className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Grau</span>
            <span className="text-xs font-bold text-white whitespace-nowrap">{grau.label}</span>
          </div>
        }
      >
        <p className="text-[11px] text-slate-400 mb-3">
          Conjunto concedido no começo de toda missão, pelo grau do feiticeiro (que vem do ND).
          É <strong>indicativo</strong>: a aba conta mas não bloqueia, porque o livro prevê item vindo
          de talento, recompensa, saque e confecção.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CUSTOS.map((c) => {
            const concedido = orcamento[c];
            const gasto = equip.custoGasto[c];
            const passou = Number.isFinite(concedido) && gasto > concedido;
            return (
              <div key={c} className="border border-slate-800 bg-slate-950/40 rounded-lg px-2 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Custo {c}</div>
                {/* Gasto e concedido no MESMO tamanho: o "/" é que fica menor. */}
                <div className="font-mono text-lg font-bold tabular-nums">
                  <span className={passou ? "text-amber-400" : "text-white"}>{gasto}</span>
                  <span className="text-slate-600 text-sm font-normal"> / </span>
                  <span className="text-slate-300">{Number.isFinite(concedido) ? concedido : "∞"}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          <span className="text-slate-400 font-semibold">Equipamento inicial: </span>
          {EQUIP_INICIAL.texto}
        </p>
      </Card>

      <Card title="Efeito do Equipado">
        {temEfeito ? (
          <div className="flex flex-wrap gap-2">
            {equip.uniformeDefesa !== 0 && <EfeitoPill icon={Shield} label="Defesa" valor={`+${equip.uniformeDefesa}`} nota="uniforme" />}
            {equip.defesaBonus !== 0 && <EfeitoPill icon={Shield} label="Defesa" valor={`+${equip.defesaBonus}`} nota="ferramenta" />}
            {equip.rdFisico !== 0 && <EfeitoPill icon={Shield} label="RD Física" valor={equip.rdFisico} nota="escudo + grau" />}
            {equip.rdGeralBonus !== 0 && <EfeitoPill icon={Shield} label="RD Geral" valor={`+${equip.rdGeralBonus}`} nota="ferramenta" />}
            {equip.movimentoBonus !== 0 && <EfeitoPill icon={Footprints} label="Deslocamento" valor={`+${fmtEspacos(equip.movimentoBonus)}m`} nota="ferramenta" />}
            {equip.penalidadeDestreza !== 0 && <EfeitoPill icon={AlertTriangle} label="Testes de Destreza" valor={equip.penalidadeDestreza} nota="não aplicado, Perícias não existem" alerta />}
            {equip.hpMaxBonus !== 0 && <EfeitoPill icon={Heart} label="PV máximo" valor={`+${equip.hpMaxBonus}`} />}
            {equip.peBonus !== 0 && <EfeitoPill icon={Zap} label="PE máximo" valor={`+${equip.peBonus}`} nota="ferramenta" />}
            {equip.cdBonus !== 0 && <EfeitoPill icon={Sparkles} label="CD" valor={`+${equip.cdBonus}`} />}
            {AFTY_ATTRS.filter((at) => equip.attrBonus[at.key] !== 0).map((at) => (
              <EfeitoPill key={at.key} icon={ArrowUp} label={at.label} valor={`+${equip.attrBonus[at.key]}`} nota="passa o limite, teto 30" />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            Nada equipado ainda. Uniforme dá Defesa, escudo dá RD Física e acessório dá o bônus dele.
          </p>
        )}
      </Card>

      <Card
        title="Carregado"
        headerRight={
          <span className="text-[10px] text-slate-500 font-mono">{equip.entradas.length} linhas</span>
        }
      >
        {porTipo.length === 0 ? (
          <p className="text-[11px] text-slate-500">Inventário vazio. Adicione pelo catálogo abaixo.</p>
        ) : (
          <div className="space-y-4">
            {porTipo.map((t) => (
              <div key={t.value}>
                <div className="text-[11px] font-semibold text-slate-300 mb-1.5">{t.label}</div>
                <div className="space-y-1.5">
                  {t.entradas.map((e) => (
                    <LinhaCarregada
                      key={e.uid}
                      entrada={e}
                      onPatch={patchEquipamento}
                      onRemove={removeEquipamento}
                      onToggleFerramenta={toggleFerramenta}
                      onPatchFerramenta={patchFerramenta}
                      onToggleEncantamento={toggleEncantamento}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Catálogo">
        <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3" role="tablist" aria-label="Tipos de equipamento">
          {EQUIP_TIPOS.map((t) => {
            const on = t.value === catTab;
            return (
              <button
                key={t.value}
                role="tab"
                aria-selected={on}
                onClick={() => { setCatTab(t.value); setSubFiltro("todos"); }}
                className={`grow justify-center whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {catTab === "arma" && (
          <div className="flex gap-1 mb-2" role="tablist" aria-label="Classe de arma">
            {[{ value: "simples", label: "Armas Simples" }, { value: "complexa", label: "Armas Complexas" }].map((c) => {
              const on = c.value === classeArma;
              return (
                <button
                  key={c.value}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setClasseArma(c.value)}
                  className={`grow justify-center whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                    on ? "bg-purple-700/70 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        {subOpcoes && (
          <div className="flex flex-wrap gap-1 mb-2">
            {[{ value: "todos", label: "Todos" }, ...subOpcoes].map((o) => {
              const on = o.value === subFiltro;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSubFiltro(o.value)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    on ? "bg-purple-700 text-white" : "bg-slate-800/70 text-slate-400 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-3">
          <TextInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou grupo" />
        </div>

        {lista.length === 0 && (
          <p className="text-[11px] text-slate-600">Nada encontrado.</p>
        )}

        <div className="space-y-1.5">
          {lista.map((def) => (
            <CatalogoLinha
              key={def.id}
              tipo={catTab}
              def={def}
              jaTem={contagem[def.id] ?? 0}
              onAdd={addEquipamento}
            />
          ))}
        </div>
      </Card>

      <FerramentasReferencia />
    </>
  );
}

/* Card de referência das Ferramentas Amaldiçoadas: as tabelas de benefício por
   grau, o processo de criação, a identificação, o catálogo de encantamentos e o
   exemplo de Grau Especial. Tudo texto de leitura, recolhido por padrão. */
function FerramentasReferencia() {
  const [aberto, setAberto] = useState(false);
  const [encTipo, setEncTipo] = useState("arma");
  const linhasBeneficio = AFTY_GRAUS.map((g) => ({
    grau: g.label,
    bonusArma: FA_BONUS_ARMA[g.value],
    rdEscudo: FA_RD_ESCUDO[g.value],
    ganho: FA_ENCANT_GANHO,
    value: g.value,
  }));
  const encLista = ENCANTAMENTOS_POR_TIPO[encTipo] ?? [];
  const encAbas = [
    { value: "arma", label: "Armas" },
    { value: "escudo", label: "Escudos" },
    { value: "uniforme", label: "Uniformes" },
  ];

  return (
    <Card
      title="Ferramentas Amaldiçoadas · Referência"
      headerRight={
        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-expanded={aberto}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
        >
          {aberto ? "Recolher" : "Abrir"}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aberto ? "" : "-rotate-90"}`} aria-hidden="true" />
        </button>
      }
    >
      {!aberto ? (
        <p className="text-[11px] text-slate-500">
          Tabelas de benefício por grau, o processo de criação, a identificação e o catálogo completo de
          encantamentos. Para transformar um item, use a varinha na linha dele acima.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Benefícios por grau */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Benefícios por grau</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="py-1 pr-3 font-medium">Grau</th>
                    <th className="py-1 px-2 font-medium">Bônus de Arma</th>
                    <th className="py-1 px-2 font-medium">RD do Escudo</th>
                    <th className="py-1 px-2 font-medium">Enc. Arma</th>
                    <th className="py-1 px-2 font-medium">Enc. Escudo</th>
                    <th className="py-1 px-2 font-medium">Enc. Uniforme</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-200">
                  {linhasBeneficio.map((l) => (
                    <tr key={l.value} className="border-t border-slate-800">
                      <td className="py-1 pr-3 font-sans text-slate-300 whitespace-nowrap">{l.grau}</td>
                      <td className="py-1 px-2">+{l.bonusArma}</td>
                      <td className="py-1 px-2">{l.rdEscudo}</td>
                      <td className="py-1 px-2">{l.value === "especial" ? "hab. única" : `+${l.ganho.arma[l.value]}`}</td>
                      <td className="py-1 px-2">{l.value === "especial" ? "hab. única" : `+${l.ganho.escudo[l.value]}`}</td>
                      <td className="py-1 px-2">{l.value === "especial" ? "hab. única" : `+${l.ganho.uniforme[l.value]}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Os encantamentos acumulam entre os graus. Bônus de Arma e RD do escudo usam só o valor do grau
              atual (não somam entre graus), e a RD do escudo soma com a RD do escudo comum. Cargas de
              Encantamento = bônus de treinamento do portador, compartilhadas por todos os encantamentos com
              carga do item.
            </p>
          </div>

          {/* Criação e Identificação */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Criação</div>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="py-1 pr-2 font-medium">Grau</th>
                    <th className="py-1 px-2 font-medium">BT necessário</th>
                    <th className="py-1 px-2 font-medium">CD</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-200">
                  {AFTY_GRAUS.map((g) => (
                    <tr key={g.value} className="border-t border-slate-800">
                      <td className="py-1 pr-2 font-sans text-slate-300 whitespace-nowrap">{g.label}</td>
                      <td className="py-1 px-2">+{FA_CRIACAO[g.value].btNecessario}</td>
                      <td className="py-1 px-2">{FA_CRIACAO[g.value].cd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Precisa do talento Artesão Amaldiçoado e treino em Ferramentas de Canalizador ou de Ferreiro.
                Duas rolagens: Ofício (Ferreiro) e Ofício (Canalizador), ambas contra a CD.
              </p>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Identificação</div>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="py-1 pr-2 font-medium">Grau</th>
                    <th className="py-1 px-2 font-medium">CD de Feitiçaria</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-200">
                  {AFTY_GRAUS.map((g) => (
                    <tr key={g.value} className="border-t border-slate-800">
                      <td className="py-1 pr-2 font-sans text-slate-300 whitespace-nowrap">{g.label}</td>
                      <td className="py-1 px-2">{FA_IDENTIFICACAO_CD[g.value]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Teste de Feitiçaria (Ação Bônus em combate). Descobre nome e encantamentos. A habilidade única
                de uma de Grau Especial pede +10 na CD e ter visto o item ser usado.
              </p>
            </div>
          </div>

          {/* Catálogo de encantamentos */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Catálogo de encantamentos</div>
            <div className="flex gap-1 mb-2" role="tablist" aria-label="Tipo de encantamento">
              {encAbas.map((t) => {
                const on = t.value === encTipo;
                return (
                  <button
                    key={t.value}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setEncTipo(t.value)}
                    className={`grow justify-center whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                      on ? "bg-purple-700/70 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5">
              {encLista.map((enc) => (
                <div key={enc.id} className="rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-2">
                  <div className="flex items-center gap-x-2 flex-wrap">
                    <span className="text-[12px] font-semibold text-slate-100">{enc.nome}</span>
                    {enc.usaCargas && (
                      <span className="text-[9px] font-mono px-1 rounded bg-sky-500/20 text-sky-300">Cargas</span>
                    )}
                    {enc.preReq && (
                      <span className="text-[9px] px-1 rounded bg-purple-500/15 text-purple-300">Pré-Req: {enc.preReq}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{enc.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Exemplo de Grau Especial */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Exemplo de Grau Especial</div>
            <div className="rounded-lg border border-purple-900/50 bg-purple-950/20 px-2.5 py-2">
              <div className="text-[12px] font-semibold text-purple-200">{FA_GRAU_ESPECIAL_EXEMPLO.nome}</div>
              <div className="text-[10px] text-slate-400 mb-1">{FA_GRAU_ESPECIAL_EXEMPLO.subtitulo}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{FA_GRAU_ESPECIAL_EXEMPLO.descricao}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                <span className="text-purple-300 font-semibold">{FA_GRAU_ESPECIAL_EXEMPLO.habilidade.nome}. </span>
                {FA_GRAU_ESPECIAL_EXEMPLO.habilidade.descricao}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-amber-400/80">
            O motor aplica, enquanto a ferramenta está equipada: a RD Física por grau do escudo, e os
            efeitos estáticos de <strong>Canalizadora</strong> (CD), <strong>Reforçado</strong> (RD Física),
            <strong> Blindado</strong> (Defesa) e <strong>Propulsor</strong> (Deslocamento), mais o que você
            programar no Motor de Automação da Habilidade Única. Os demais encantamentos são situacionais ou
            de combate (Iniciativa, manobras, TRs, Perícias, RD por elemento), que o motor do Afty ainda não
            calcula, então seguem como texto.
          </p>
        </div>
      )}
    </Card>
  );
}

/* Mesmo desenho do StatMini das Invocações: o ícone vive DENTRO da linha do
   rótulo, não ao lado do bloco inteiro. Ao lado, ele se centralizava contra as
   duas linhas (rótulo + valor) e não batia com nenhuma das duas. */
function EfeitoPill({ icon: Icon, label, valor, nota, alerta }) {
  return (
    <div className={`border rounded-lg px-2.5 py-1.5 ${
      alerta ? "border-amber-800/60 bg-amber-950/20" : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
        <Icon className={`w-3 h-3 flex-shrink-0 ${alerta ? "text-amber-400" : "text-purple-400"}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <div className="font-mono text-sm font-bold text-white leading-tight">
        {valor}
        {nota && <span className="ml-1.5 text-[9px] font-sans font-normal text-slate-500">{nota}</span>}
      </div>
    </div>
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
