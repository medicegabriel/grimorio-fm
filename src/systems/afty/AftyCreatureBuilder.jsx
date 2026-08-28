import React, { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import {
  Save, ChevronLeft, ChevronDown, Wand2, Sparkles, FlaskConical,
  Dumbbell, GraduationCap, BookOpen, Check, ArrowRight, Lock, Plus, X, Zap,
  Copy, ArrowUp, ArrowDown, Heart, Shield, Footprints, AlertTriangle, Star, Swords,
  Trash2, Image as ImageIcon, Eye, Crosshair, RotateCcw, Pencil, Table, Braces,
} from "lucide-react";

import { FieldLabel, TextInput, TextArea, Select, NumberInput, StatField, ExpandableText } from "../../components/builder-controls";
import TabAddons from "./AftyTabAddons";
import { aplicarAddons } from "./afty-addons";
import {
  mesclaFichaAfty, AFTY_ATTRS, AFTY_TIPOS, AFTY_PATAMARES, AFTY_QNT_PE,
  AFTY_TECNICA_ATTRS, AFTY_TAMANHOS, AFTY_RESISTENCIAS, getTamanho,
  createBlankFuncionamento, funcionamentosDaFicha,
} from "./afty-schema";
// Primitivos compartilhados com a Ficha Final. Eram locais deste arquivo até
// 2026-08-05, e saíram porque duas cópias divergiriam na primeira errata.
import { PainelDeFontes, ValorComFontes } from "./ui/fontes";
import { sinalDe } from "./ui/formato";
import { Card, BoolChip, VezesGauge } from "./ui/primitivos";
import { estadoInicialComRascunho, useRascunhoAfty, formatarSalvoEm } from "./afty-rascunho";
import {
  AFTY_ORIGENS, getOrigem, origemTemDesenvolvimento, origemPoolLimite,
  clasDaOrigem, getCla, caracteristicasEfetivas, totalDaAlocacao, usoDaAlocacao,
  origensQualificadas,
} from "./afty-origens";
// A descrição de cada anatomia agora aparece na própria linha selecionável, em
// vez de repetida numa lista embaixo: o `getAnatomia` deixou de ser preciso aqui.
import { ANATOMIAS, anatomiaTotal } from "./afty-anatomias";
import {
  ATTR_METODOS, VALORES_FIXOS, valoresFixosOk, rolarAtributos, resumoAtributos,
  desenvolvimentoTotal, desenvolvimentoUsado, limitePoolTotal, limitePoolUsado,
  POINT_BUY_MIN, POINT_BUY_MAX,
  ATTR_LIMITE_PADRAO,
} from "./afty-atributos";
import {
  ETAPAS_POR_LINHA, focosGastos, avaliarRequisito, rotuloAlvo, treinamentosDaOrigem,
} from "./afty-treinamentos";
import {
  AFTY_TREINOS_ESPECIAIS, focosDeTreinosEspeciais, focosDoTreinoEspecial,
  tetosDeTreinoEspecial, vezesPorTreinoEspecial,
} from "./afty-treinos-especiais";
import {
  APTIDAO_TRILHAS, APTIDAO_NIVEL_MAX,
  aptidoesDaCategoria, subgruposDaCategoria, abasAptidao, avaliarRequisitoAptidao,
} from "./afty-aptidoes";
import {
  especializacoesDisponiveis, getEspecializacao, normalizeEspecializacoes, tipoObrigatorio,
  tiposDisponiveis, tipoDaOrigem,
} from "./afty-especializacoes";
import {
  gruposDeHabilidade, avaliarAcessoHabilidade, escolhasConcedidas, abasDeOpcoes,
} from "./afty-habilidades";
import { ALMA_LIVRE_TALENTO_ID, gruposDeTalento, avaliarAcessoTalento } from "./afty-talentos";
import {
  MELHORIAS_SUPERIORES, HABILIDADES_LENDARIAS, avaliarAcessoAltoNivel,
} from "./afty-alto-nivel";
import { HABILIDADES_GERAIS } from "./afty-gerais";
import {
  AFTY_PERICIAS, AFTY_ATAQUES, AFTY_MANOBRAS, EMPURRAO_BASE,
  idsPericiasAtivas, novaPericiaPersonalizada, sugestoesPericias,
} from "./afty-pericias";
import { FONTES_CURA, rotuloBloco } from "./afty-cura";
// Os canais do Motor, já agrupados por assunto para o <optgroup> do editor
// do Funcionamento Básico.
import {
  EFEITO_CANAL_GRUPOS, VAR_DADOS_DANO_FINAL, VAR_NIVEL_FEITICO,
  efeitoUsaDadosDanoFinal, getCanal,
} from "./afty-efeitos";
import {
  DOMINIO_CATEGORIAS, tiposDaCategoria, categoriaLivre, valorDoEfeito,
  novoEfeitoDominio, novoDominio, versoesDisponiveis, ATRIBUTOS_FISICOS,
  DOMINIO_EFEITOS_BASE, DOMINIO_RITUAL_CATEGORIAS, rotuloDoEfeito, rotuloVersao,
} from "./afty-dominios";
import { RITUAL_MELHORIAS } from "./afty-rituais";
import { COMBATE_ESTADOS } from "./afty-combate";
import {
  createBlankInvocacao, cloneInvocacao, createBlankAcao, createBlankCaracteristica, createBlankHorda, AFTY_INV_GRAUS,
  grausDisponiveis, grauMeta, INV_ATRIBUTOS_POR_GRAU, INV_ATTR_MIN, mod as invMod,
  custoMaxAcao, tamanhosNaFaixa, lideresElegiveis, membrosElegiveis,
  alvosDanoDisponiveis, curaMultiplosDisponivel, marcadorLigado, marcadorOpcao, dadoDoMaximo,
  AFTY_INV_TIPOS, AFTY_INV_SABORES,
  INV_CUSTO_BENEFICIOS, INV_CUSTO_CONDICAO, INV_RD_TIPOS, resistenciasTreinaveis, usoPericias,
  alvosDeModificador, alvosDeModificadorCaract,
} from "./afty-invocacoes";
import { periciasParaInvocacao, DANO_ADICIONAL_ARMA } from "./afty-pericias";
import {
  EQUIP_TIPOS, CUSTOS, ARMA_CATEGORIAS, ARMA_GRUPOS, TIPOS_DANO,
  ITEM_CATEGORIAS, catalogoDoTipo, novaEntradaEquip,
  orcamentoDoGrau, espacosDoEquipamento, custoDoEquipamento,
  getPropriedade, getEspecial, grupoLabel,
  ARMA_PROPRIEDADES, ARMA_DADOS, ARMA_CRITICOS, novaArmaCustom, rotuloPropriedade,
  armasCustomDaFicha,
  CRIA_LABEL, REFEICOES_COZINHEIRO,
  AFTY_GRAUS, FA_TIPOS_EQUIP, FA_CRIACAO, defesaDaArmadura,
  FA_ENCANT_GANHO, FA_IDENTIFICACAO_CD, FA_GRAU_ESPECIAL_EXEMPLO,
  ENCANTAMENTOS_POR_TIPO, getEncantamento,
  avaliarRequisitoEncantamento,
} from "./afty-equipamentos";
import { evalNumber as evalNumberDsl, validateExpression } from "./afty-dsl";
import { deriveAfty } from "./afty-derive";
import {
  createBlankFeitico, calcularFeiticoDano, ALCANCE_POR_NIVEL, AREA_POR_NIVEL, taxasTroca,
  calcularFeiticoCurativo, CURA_ACOES, CURA_REMOCAO,
  calcularFeiticoEspecial, ESPECIAL_SUBTIPOS, maxGolpesGolpeador, ITEM_CUSTO_MAX,
  TRANSF_DURACOES, TRANSF_ACOES,
  NIVEL_LABEL, FEITICO_ACOES, FORMAS_AREA, DANO_SUBTIPOS, REQUISITO_DIFICULDADE,
  CONDICAO_FORCAS, CONDICOES_CATALOGO, CONDICAO_FORCAS_POR_NIVEL,
  SANGRAMENTO, notacaoDano,
  calcularFeiticoAuxiliar, AUX_EFEITOS, AUX_TABELAS, AUX_DURACOES, faixaRodadasDuradoura,
  createBlankAuxEffect, efeitosDisponiveisMult, primeiroEfeitoLivre,
  resultaEspecialAux, ofereceUmGolpe, aplicaUmGolpe, podeEventoUnico,
  formatAuxValor, aplicaReducoesCustoFeitico, tituloCustoFeitico,
} from "./afty-feiticos";
import {
  createBlankEstiloEspecial, estilosDaFicha, TECNICAS_TABELA, TEXTO_EFEITO_ESPECIAL,
  mostraCardEstilo,
} from "./afty-estilo-sombras";
import { vocabularioDsl, vocabularioInvocacao, DSL_FUNCOES } from "./afty-dsl-vocabulario";
import PrimitivasDeAddon from "./ui/PrimitivasDeAddon";
import { usePrimitiva } from "./ui/usar-primitiva";
import {
  MARCADORES, TITULOS, alternarMarcador, alternarTitulo, inserirTabela,
} from "./afty-texto-rico";
import TextoRico from "./ui/TextoRico";

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
  { id: "pericias",      label: "Perícias" },
  { id: "habilidades",   label: "Habilidades" },
  { id: "especializacoes", label: "Especializações" },
  { id: "aptidoes",      label: "Aptidões" },
  { id: "invocacoes",    label: "Invocações" },
  { id: "equipamentos",  label: "Equipamentos" },
  { id: "interludios",   label: "Interlúdios" },
  { id: "addons",        label: "Addons" },
  { id: "calculos",      label: "Cálculos", afty: true },
];

// A aba Habilidades agora é REAL (Feitiços / Estilo das Sombras / Habilidades
// Marciais, conforme a origem). Nenhuma aba está em stub por ora.
const STUBS = {};

/* Estado do rascunho automático, no cabeçalho e ao lado do Salvar.
   Some quando não há nada pendente: um indicador permanente que passa o dia
   dizendo "tudo certo" deixa de ser lido justo quando tem algo a dizer.

   ⚠ Os dois estados são diferentes de propósito. "Restaurado" avisa que a ficha
   na tela veio do rascunho, e não do compêndio, que é o único momento em que a
   restauração automática pode surpreender. "Rascunho" é só a marca de que o
   trabalho está guardado. O X desfaz nos dois casos, o que é o que paga pela
   restauração ser automática. */
function IndicadorRascunho({ rascunho }) {
  const { pendente, salvoEm, restaurado, descartar } = rascunho;
  if (!restaurado && !(pendente && salvoEm)) return null;
  return (
    <div
      className={`flex items-center gap-1.5 pl-2 pr-1 py-1 rounded border text-[11px] font-semibold flex-shrink-0 ${
        restaurado
          ? "border-sky-800 bg-sky-950/60 text-sky-300"
          : "border-slate-700 bg-slate-900/70 text-slate-400"
      }`}
      title={
        restaurado
          ? "A ficha na tela veio do rascunho automático, e não do compêndio"
          : "Guardado automaticamente neste navegador. O compêndio só recebe pelo Salvar"
      }
    >
      <RotateCcw className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap">
        {restaurado ? "Restaurado" : "Rascunho"}
        {salvoEm && <span className="font-normal opacity-70"> {formatarSalvoEm(salvoEm)}</span>}
      </span>
      <button
        type="button"
        onClick={descartar}
        title="Descartar o rascunho e voltar à ficha salva"
        aria-label="Descartar o rascunho e voltar à ficha salva"
        className="p-0.5 rounded hover:bg-slate-800 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* A ficha COMO ELA ESTÁ GRAVADA: o `existingCreature` mesclado com os defaults,
   ou a ficha em branco. É a régua do "tem alteração pendente" e o destino do
   Descartar. O merge em si mora no schema desde 2026-08-05, porque a Ficha Final
   precisa exatamente do mesmo saneamento antes de derivar. */
const fichaGravada = mesclaFichaAfty;

export default function AftyCreatureBuilder({ existingCreature, onSave, onCancel }) {
  // A ficha gravada é capturada UMA vez, na montagem, igual ao draft: trocar de
  // criatura passa pelo Dashboard, que desmonta este componente.
  const [base] = useState(() => fichaGravada(existingCreature));
  const alvoId = existingCreature?.id ?? null;
  // ⚠ O rascunho é aplicado AQUI, no inicializador, e não num efeito depois de
  // montar: restaurar depois faria a tela piscar a ficha em branco antes de
  // trocar, e todo `useState` derivado do draft nasceria do valor errado.
  const [rascunhoInicial] = useState(() => estadoInicialComRascunho(alvoId, base));
  const [draft, setDraft] = useState(rascunhoInicial.draft);
  const [tab, setTab] = useState("informacoes");

  const rascunho = useRascunhoAfty({
    id: alvoId,
    draft,
    base,
    restauradoEm: rascunhoInicial.restaurado,
    onDescartar: () => setDraft(base),
  });

  /* ⚠ OS ADDONS ENTRAM ANTES DA DERIVAÇÃO, e no MESMO memo.
     `aplicarAddons` reescreve os catálogos (ver afty-addons.js), e o
     `deriveAfty` lê catálogo. Num `useEffect` isto rodaria DEPOIS do render, e
     a primeira derivação sairia com o catálogo velho.

     Dependência `draft` inteiro, e não `draft.addons`: o `draft` muda a cada
     edição, então o par sempre roda junto e na ordem. É a armadilha da época
     nomeada na seção 3 do docs/afty-addons.md, resolvida aqui pela ordem em vez
     do contador (que existe para quem memoriza catálogo FORA deste par). */
  const derived = useMemo(() => {
    aplicarAddons(draft.addons ?? []);
    return deriveAfty(draft);
  }, [draft]);
  const isEditing = !!existingCreature?.id;

  // O Restringido não tem energia amaldiçoada (autor, 2026-07-29): sem Nível de
  // Aptidão e sem Aptidão Amaldiçoada, então a aba Aptidões some inteira. O PE
  // ele TEM, com o mesmo valor: só chama de Ponto de Estamina (ver deriveAfty).
  // `tabAtiva` cobre quem já estava nela quando o Tipo mudou: em vez de deixar
  // a tela num limbo (aba escondida, conteúdo aberto), cai nas Informações.
  const semEnergia = draft.core.tipo === "restringido";
  const tabAtiva = (tab === "aptidoes" && semEnergia) ? "informacoes" : tab;

  // ---------- patches imutáveis ----------
  const patch = (partial) => setDraft((d) => ({ ...d, ...partial }));
  const patchCore = (partial) => setDraft((d) => ({ ...d, core: { ...d.core, ...partial } }));
  // Os addons desta criatura, como CÓPIA congelada. Ver AftyTabAddons.jsx.
  const setAddons = (lista) => setDraft((d) => ({ ...d, addons: lista }));
  const patchAttr = (key, val) =>
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [key]: val } }));
  const patchNivel = (key, val) =>
    setDraft((d) => ({ ...d, attrNivel: { ...d.attrNivel, [key]: val } }));

  // Aplica a escolha de bônus de origem e DEVOLVE ao pool os pontos de Nível que
  // passariam do limite — a origem tem prioridade sobre o Nível (dentro do limite).
  const setOrigemBonus = (bonusMap) =>
    setDraft((d) => {
      // ⚠ O limite vem do `derived`, e não de `d.attrLimite` (2026-07-29): a ficha
      // guarda 20 fixo, então ler dela truncava o pool de nível de um Restringido
      // (limite 30 nos físicos) e de qualquer ficha com Incremento de Atributo.
      // Vale o do render anterior, que é o certo aqui: a troca em curso é o bônus
      // de origem, e o bônus de origem não move o limite.
      const nextNivel = { ...d.attrNivel };
      for (const a of AFTY_ATTRS) {
        const base = d.attributes[a.key] || 0;
        const bonus = bonusMap[a.key] || 0;
        const lim = derived.attrLimiteEfetivo?.[a.key] ?? ATTR_LIMITE_PADRAO;
        const reservado = (derived.attrDesenv?.[a.key] || 0) + (derived.attrMotor?.[a.key] || 0);
        const maxNivel = Math.max(0, lim - base - bonus - reservado);
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
      // ⚠ A trava do Restringido é nos dois sentidos (autor, 2026-08-03), então
      // sair da origem Restringido também tira o TIPO Restringido: um
      // `tipoObrigatorio(id) ?? d.core.tipo` deixava a metade de volta gravada.
      core: { ...d.core, origem: { id }, tipo: tipoDaOrigem(id, d.core.tipo) },
      especializacoes: normalizeEspecializacoes(d.especializacoes, id),
    }));

  // Clã do Herdado. Trocar de clã zera o que era do clã antigo: o bônus de
  // atributo (o par muda) e as escolhas aninhadas (os ids são por clã). O
  // resolver já ignoraria opção de outro clã, mas deixar lixo gravado faria a
  // escolha voltar sozinha ao trocar de volta, o que confunde.
  const setOrigemCla = (cla) =>
    setDraft((d) => ({
      ...d,
      core: { ...d.core, origem: { ...d.core.origem, cla, bonusAtributos: {}, escolhas: {} } },
    }));

  // Escolha aninhada de origem (Treinamentos de Clã, Empenho Implacável).
  // Mesma mecânica das outras: guarda a escolha, o resolver conta as vagas.
  const toggleEscolhaOrigem = (escolhaId, opcaoId) =>
    setDraft((d) => {
      const origem = d.core.origem || {};
      const mapa = origem.escolhas && typeof origem.escolhas === "object" ? origem.escolhas : {};
      const atual = Array.isArray(mapa[escolhaId]) ? mapa[escolhaId] : [];
      const proxima = atual.includes(opcaoId) ? atual.filter((x) => x !== opcaoId) : [...atual, opcaoId];
      return { ...d, core: { ...d.core, origem: { ...origem, escolhas: { ...mapa, [escolhaId]: proxima } } } };
    });

  // Alocação de atributo com pool PRÓPRIO (Ápice Corporal Humano). Separado do
  // `bonusAtributos` porque a mesma origem tem os dois, e somar no mesmo mapa
  // faria um comer o outro.
  const setOrigemPool = (poolId, attrKey, valor) =>
    setDraft((d) => {
      const origem = d.core.origem || {};
      const pools = origem.pools && typeof origem.pools === "object" ? origem.pools : {};
      const pool = { ...(pools[poolId] || {}) };
      if (valor > 0) pool[attrKey] = valor; else delete pool[attrKey];
      return { ...d, core: { ...d.core, origem: { ...origem, pools: { ...pools, [poolId]: pool } } } };
    });

  // Especializações: a ficha guarda { id, nivel }, mas o nível gravado é só
  // o PONTO DE DIVISÃO da multiclasse — quem resolve os níveis finais é
  // resolveEspecializacoes (soma sempre === ND). Ver afty-especializacoes.js.
  const setEspecializacoes = (lista) => setDraft((d) => ({ ...d, especializacoes: lista }));

  // Níveis de Aptidão: cada ponto do orçamento sobe 1 nível numa trilha.
  const setAptidaoNivel = (trilha, val) =>
    setDraft((d) => ({ ...d, aptidoes: { ...d.aptidoes, [trilha]: val } }));

  // Habilidades de Especialização: Base e por Nível gastam o MESMO orçamento,
  // que vem da Habilidade Geral Especialização. Escolher não é bloqueado pelo
  // orçamento, só pelo requisito de nível — mesma postura das Aptidões.
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

  // Talento REPETÍVEL (`maxVezes` / `maxVezesExpr`). A lista guarda uma entrada
  // por pega, igual às Habilidades Gerais e às Melhorias Superiores, então
  // definir "vezes" é reescrever as entradas daquele id. Quem apara no teto é o
  // resolver, e não este setter.
  const setTalentoVezes = (id, vezes) =>
    setDraft((d) => {
      const atual = Array.isArray(d.talentos) ? d.talentos : [];
      const outras = atual.filter((x) => x !== id);
      return { ...d, talentos: [...outras, ...Array(Math.max(0, vezes)).fill(id)] };
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

  // Talento também tem escolha aninhada (o atributo do Incremento, a trilha da
  // Aptidão Desenvolvida). Mapa próprio, mesma mecânica.
  const toggleEscolhaTalento = (talId, opcaoId) =>
    setDraft((d) => {
      const mapa = d.escolhasTalento && typeof d.escolhasTalento === "object" ? d.escolhasTalento : {};
      const atual = Array.isArray(mapa[talId]) ? mapa[talId] : [];
      const proxima = atual.includes(opcaoId) ? atual.filter((x) => x !== opcaoId) : [...atual, opcaoId];
      return { ...d, escolhasTalento: { ...mapa, [talId]: proxima } };
    });

  // Feitiços: entradas CRIADAS pelo jogador. add/remove/patch simples.
  // O motor (afty-feiticos.js) computa dano/alcance/custo/CD por entrada.
  const addFeitico = () =>
    setDraft((d) => ({ ...d, feiticos: [...(Array.isArray(d.feiticos) ? d.feiticos : []), createBlankFeitico()] }));
  const removeFeitico = (id) =>
    setDraft((d) => {
      const reducoes = d.reducoesCustoFeitico && typeof d.reducoesCustoFeitico === "object"
        ? d.reducoesCustoFeitico
        : {};
      return {
        ...d,
        feiticos: (Array.isArray(d.feiticos) ? d.feiticos : []).filter((f) => f.id !== id),
        reducoesCustoFeitico: {
          ...reducoes,
          dominancia: reducoes.dominancia === id ? null : (reducoes.dominancia ?? null),
          manipulacao: Array.isArray(reducoes.manipulacao)
            ? reducoes.manipulacao.filter((feiticoId) => feiticoId !== id)
            : [],
        },
      };
    });
  const setReducoesCustoFeitico = (proxima) =>
    setDraft((d) => ({ ...d, reducoesCustoFeitico: proxima }));
  const patchFeitico = (id, partial) =>
    setDraft((d) => ({
      ...d,
      feiticos: (Array.isArray(d.feiticos) ? d.feiticos : []).map((f) => (f.id === id ? { ...f, ...partial } : f)),
    }));
  // Técnicas de Estilo (Novo Estilo da Sombra, só o Sem Técnica). A ficha guarda
  // só o que a criatura CONHECE: a imbuição no Domínio Simples é estado de
  // combate, e mora na bancada de Simulação (autor, 2026-08-10).
  // ⚠ TODA escrita parte da lista NORMALIZADA, e não do array cru da ficha
  // (conserto de 2026-08-10). A `estilosDaFicha` converte o shape antigo da
  // Modificação-recipiente, mas só na LEITURA: a ficha continuava guardando a
  // linha velha, e o botão escrevia no shape novo, então os dois nunca se
  // encontravam. Numa ficha antiga, desmarcar "Aumento de Defesa" tirava um
  // `{id:"defesa"}` que a Modificação velha repunha na conversão, e o efeito
  // ficava preso na tela. Normalizar aqui migra a ficha na primeira edição, e
  // a operação é idempotente para quem já está no shape novo.
  const estilosArr = (d) => estilosDaFicha(d);
  // As de tabela têm id fixo (o id do efeito no catálogo), e por isso conhecer a
  // mesma duas vezes é impossível: o botão só alterna.
  const toggleEstiloTabela = (id) =>
    setDraft((d) => {
      const atuais = estilosArr(d);
      return atuais.some((e) => e.id === id)
        ? { ...d, estilosSombra: atuais.filter((e) => e.id !== id) }
        : { ...d, estilosSombra: [...atuais, { id, tipo: "tabela" }] };
    });
  // Funcionamentos Básicos ADICIONAIS (autor, 2026-08-12). Moram em `core`, ao
  // lado do principal, e por isso passam pelo `patchCore` como todo o resto do
  // Perfil Amaldiçoado.
  const funcsArr = (d) =>
    (Array.isArray(d.core?.funcionamentosAdicionais) ? d.core.funcionamentosAdicionais : []);
  const addFuncionamento = () =>
    setDraft((d) => ({
      ...d,
      core: { ...d.core, funcionamentosAdicionais: [...funcsArr(d), createBlankFuncionamento()] },
    }));
  const removeFuncionamento = (id) =>
    setDraft((d) => ({
      ...d,
      core: { ...d.core, funcionamentosAdicionais: funcsArr(d).filter((f) => f.id !== id) },
    }));
  const patchFuncionamento = (id, partial) =>
    setDraft((d) => ({
      ...d,
      core: {
        ...d.core,
        funcionamentosAdicionais: funcsArr(d).map((f) => (f.id === id ? { ...f, ...partial } : f)),
      },
    }));

  const addEstiloEspecial = () =>
    setDraft((d) => ({ ...d, estilosSombra: [...estilosArr(d), createBlankEstiloEspecial()] }));
  const removeEstilo = (id) =>
    setDraft((d) => ({ ...d, estilosSombra: estilosArr(d).filter((e) => e.id !== id) }));
  const patchEstilo = (id, partial) =>
    setDraft((d) => ({
      ...d,
      estilosSombra: estilosArr(d).map((e) => (e.id === id ? { ...e, ...partial } : e)),
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

  // Perícias / Testes de Resistência: mapa de proficiência { [id]: "treinado" |
  // "mestre" }. Destreinado é a AUSÊNCIA da chave, não um null gravado, para a
  // ficha não encher de lixo. O medidor da UI manda a faixa alvo.
  const setProficiencia = (campo, id, prof) =>
    setDraft((d) => {
      const mapa = d[campo] && typeof d[campo] === "object" ? d[campo] : {};
      const next = { ...mapa };
      if (prof) next[id] = prof; else delete next[id];
      return { ...d, [campo]: next };
    });
  const adicionarPericiaPersonalizada = () => {
    const nova = novaPericiaPersonalizada();
    setDraft((d) => {
      const personalizadas = Array.isArray(d.periciasPersonalizadas) ? d.periciasPersonalizadas : [];
      return {
        ...d,
        periciasPersonalizadas: [...personalizadas, nova],
        periciasOrdem: [...idsPericiasAtivas(d), nova.id],
      };
    });
    return nova.id;
  };
  const adicionarPericiaDoCatalogo = (id) =>
    setDraft((d) => {
      const ordem = idsPericiasAtivas(d);
      return ordem.includes(id) ? d : { ...d, periciasOrdem: [...ordem, id] };
    });
  const editarPericiaPersonalizada = (id, partial) =>
    setDraft((d) => ({
      ...d,
      periciasPersonalizadas: (Array.isArray(d.periciasPersonalizadas) ? d.periciasPersonalizadas : [])
        .map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
  const moverPericia = (id, delta) =>
    setDraft((d) => {
      const ordem = idsPericiasAtivas(d);
      const de = ordem.indexOf(id);
      const para = de + delta;
      if (de < 0 || para < 0 || para >= ordem.length) return d;
      const next = [...ordem];
      [next[de], next[para]] = [next[para], next[de]];
      return { ...d, periciasOrdem: next };
    });
  const removerPericia = (id) =>
    setDraft((d) => {
      const pericias = { ...(d.pericias && typeof d.pericias === "object" ? d.pericias : {}) };
      delete pericias[id];
      return {
        ...d,
        pericias,
        periciasOrdem: idsPericiasAtivas(d).filter((x) => x !== id),
        periciasPersonalizadas: (Array.isArray(d.periciasPersonalizadas) ? d.periciasPersonalizadas : [])
          .filter((p) => p.id !== id),
        ...(id === "oficio" ? { periciaOficio: "", periciaOficios: [] } : {}),
      };
    });
  const toggleAtaqueProf = (id) =>
    setDraft((d) => {
      const mapa = d.ataquesProf && typeof d.ataquesProf === "object" ? d.ataquesProf : {};
      const next = { ...mapa };
      if (next[id]) delete next[id]; else next[id] = true;
      return { ...d, ataquesProf: next };
    });

  // Armas Dedicadas (Lutador 2°). O teto é aplicado na LEITURA
  // (resolveArmasDedicadas), então aqui é só ligar e desligar: a ficha guarda a
  // lista inteira e tirar a arma da mochila não apaga a escolha.
  const toggleArmaDedicada = (id) =>
    setDraft((d) => {
      const lista = Array.isArray(d.armasDedicadas) ? d.armasDedicadas : [];
      return {
        ...d,
        armasDedicadas: lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id],
      };
    });

  const patchTecnicasCombate = (partial) =>
    setDraft((d) => ({
      ...d,
      tecnicasCombate: {
        armas: [],
        atributo: "inteligencia",
        ...(d.tecnicasCombate ?? {}),
        ...partial,
      },
    }));

  // Simulação de combate: bancada de balanceamento. Estado é ENTRADA, então
  // mora na ficha como qualquer outra escolha e sobrevive a fechar e reabrir.
  const patchCombate = (partial) =>
    setDraft((d) => ({ ...d, combate: { ...(d.combate ?? {}), ...partial } }));

  // Habilidades Gerais. Mesmo shape das Melhorias Superiores: lista COM
  // repetição, então definir "vezes" é reescrever as entradas daquele id.
  // Quem apara no teto (metade da Maestria, 1 + ND/10) é o resolver.
  const setGeralVezes = (id, vezes) =>
    setDraft((d) => {
      const atual = Array.isArray(d.habilidadesGerais) ? d.habilidadesGerais : [];
      const outras = atual.filter((x) => x !== id);
      return { ...d, habilidadesGerais: [...outras, ...Array(Math.max(0, vezes)).fill(id)] };
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
  const setAptidaoOpcao = (id, valor) =>
    patch({ aptidaoOpcoes: { ...(draft.aptidaoOpcoes || {}), [id]: valor } });
  const setAptidaoVezes = (id, vezes) =>
    setDraft((d) => {
      const atual = Array.isArray(d.aptidoesAmaldicoadas) ? d.aptidoesAmaldicoadas : [];
      const outras = atual.filter((x) => x !== id);
      const n = Math.max(0, Math.trunc(Number(vezes) || 0));
      const mapa = { ...(d.aptidaoOpcoesRepetidas || {}) };
      if (n > 0) {
        const anteriores = Array.isArray(mapa[id]) ? mapa[id] : [];
        mapa[id] = Array.from({ length: n }, (_, i) => anteriores[i] ?? "aumentar");
      } else {
        delete mapa[id];
      }
      return {
        ...d,
        aptidoesAmaldicoadas: [...outras, ...Array(n).fill(id)],
        aptidaoOpcoesRepetidas: mapa,
      };
    });
  const setAptidaoOpcaoRepetida = (id, indice, valor) =>
    setDraft((d) => {
      const vezes = (d.aptidoesAmaldicoadas || []).filter((x) => x === id).length;
      const mapa = { ...(d.aptidaoOpcoesRepetidas || {}) };
      const opcoes = Array.from({ length: vezes }, (_, i) => mapa[id]?.[i] ?? "aumentar");
      opcoes[indice] = valor;
      mapa[id] = opcoes;
      return { ...d, aptidaoOpcoesRepetidas: mapa };
    });
  const toggleAptidao = (id) =>
    setDraft((d) => {
      const atual = Array.isArray(d.aptidoesAmaldicoadas) ? d.aptidoesAmaldicoadas : [];
      const removendo = atual.includes(id);
      const opcoesRepetidas = { ...(d.aptidaoOpcoesRepetidas || {}) };
      if (removendo) delete opcoesRepetidas[id];
      return {
        ...d,
        aptidoesAmaldicoadas: removendo ? atual.filter((x) => x !== id) : [...atual, id],
        aptidaoOpcoesRepetidas: opcoesRepetidas,
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

  // Interlúdios · Treinos Especiais. Lista COM repetição (cada entrada é uma
  // pega), então definir "vezes" é reescrever as entradas daquele id, igual ao
  // setGeralVezes. Nenhum tem alvo hoje, e por isso a reescrita é simples: no
  // dia em que Estudos chegar com uma perícia, quem preserva o alvo entre as
  // pegas é este setter.
  const setTreinoEspecialVezes = (id, vezes) =>
    setDraft((d) => {
      const atual = Array.isArray(d.treinosEspeciais) ? d.treinosEspeciais : [];
      const outros = atual.filter((x) => (typeof x === "string" ? x : x?.id) !== id);
      const minhas = Array.from({ length: Math.max(0, vezes) }, () => ({ id, alvo: null }));
      return { ...d, treinosEspeciais: [...outros, ...minhas] };
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

  // Armas criadas pelo jogador. Guardadas na ficha e injetadas no catálogo de
  // armas pela `catalogoDoTipo`, então elas entram no inventário pelo mesmo
  // caminho das do livro.
  const armasArr = (d) => (Array.isArray(d.armasCustom) ? d.armasCustom : []);
  const addArmaCustom = () => {
    const nova = novaArmaCustom();
    setDraft((d) => ({ ...d, armasCustom: [...armasArr(d), nova] }));
    return nova.id;
  };
  const patchArmaCustom = (id, partial) =>
    setDraft((d) => ({
      ...d,
      armasCustom: armasArr(d).map((x) => (x.id === id ? { ...x, ...partial } : x)),
    }));
  // ⚠ Apagar a arma tem de tirar do INVENTÁRIO junto. Sem isso a entrada fica
  // apontando para um id que não existe mais e o resolvedor a reporta como
  // "equipamento desconhecido", o que é verdade e não ajuda ninguém.
  const removeArmaCustom = (id) =>
    setDraft((d) => setEquipArr(
      { ...d, armasCustom: armasArr(d).filter((x) => x.id !== id) },
      equipArr(d).filter((e) => !(e.tipo === "arma" && e.refId === id)),
    ));

  // Expansões de Domínio. Uma criatura pode ter várias escritas, e só uma no ar:
  // por isso `dominioAtivoId` é campo próprio, e não uma flag por domínio.
  const domArr = (d) => (Array.isArray(d.dominios) ? d.dominios : []);
  const addDominio = (versao) =>
    setDraft((d) => ({ ...d, dominios: [...domArr(d), novoDominio(versao)] }));
  const removeDominio = (id) =>
    setDraft((d) => ({
      ...d,
      dominios: domArr(d).filter((x) => x.id !== id),
      // Apagar a expansão que estava no ar não pode deixar a bancada apontando
      // para um id que não existe mais.
      dominioAtivoId: d.dominioAtivoId === id ? null : d.dominioAtivoId,
    }));
  const patchDominio = (id, partial) =>
    setDraft((d) => ({ ...d, dominios: domArr(d).map((x) => (x.id === id ? { ...x, ...partial } : x)) }));
  const setDominioAtivo = (id) => setDraft((d) => ({ ...d, dominioAtivoId: id }));

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
        // Nasce ÍNTEGRA: a criação não tem mais campo de integridade corrente.
        almaCurrent: derived.almaMax,
      },
    };
    // Apaga o rascunho e move a régua do "tem alteração pendente" para a ficha
    // recém-gravada. Sem isso a próxima abertura restauraria por cima dela.
    rascunho.aoSalvar(creature);
    onSave(creature);
  };

  return (
    /* As primitivas de Addon que ESTA criatura enxerga. Elas descem por contexto
       porque os dois consumidores (`CanalPicker` e `VariavelPicker`) são folhas
       fundas deste arquivo. Ver `ui/usar-primitiva.js`. */
    <PrimitivasDeAddon primitivas={derived.primitivas}>
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
          {/* Só o título. A segunda linha do header saiu inteira (autor,
              2026-07-29): não era o placeholder "Ficha em branco" que
              incomodava, era a linha existir. O nome da criatura já é editável
              no campo dele, na aba Identidade, e repeti-lo aqui só custava
              altura. */}
          <div className="flex items-center gap-2 min-w-0 order-last basis-full sm:order-none sm:basis-0 sm:flex-1">
            <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold truncate min-w-0">
              {isEditing ? "Editar Criatura" : "Nova Criatura"} · Afty
            </h1>
          </div>
          <IndicadorRascunho rascunho={rascunho} />
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
              {TABS.filter((t) => !(t.id === "aptidoes" && semEnergia)).map((t) => {
                const on = t.id === tabAtiva;
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
          {tabAtiva === "identidade" && <TabIdentidade draft={draft} derived={derived} patch={patch} patchCore={patchCore} setOrigemBonus={setOrigemBonus} setOrigemId={setOrigemId} setOrigemCla={setOrigemCla} toggleEscolhaOrigem={toggleEscolhaOrigem} setOrigemPool={setOrigemPool} />}
          {tabAtiva === "informacoes" && <TabInformacoes draft={draft} derived={derived} patch={patch} patchCore={patchCore} patchAttr={patchAttr} patchNivel={patchNivel} />}
          {tabAtiva === "pericias" && (
            <TabPericias
              draft={draft}
              derived={derived}
              patch={patch}
              setProficiencia={setProficiencia}
              toggleAtaqueProf={toggleAtaqueProf}
              adicionarPericiaPersonalizada={adicionarPericiaPersonalizada}
              adicionarPericiaDoCatalogo={adicionarPericiaDoCatalogo}
              editarPericiaPersonalizada={editarPericiaPersonalizada}
              moverPericia={moverPericia}
              removerPericia={removerPericia}
            />
          )}
          {tabAtiva === "habilidades" && <TabHabilidades draft={draft} derived={derived} patchCore={patchCore} toggleArmaDedicada={toggleArmaDedicada} addFeitico={addFeitico} removeFeitico={removeFeitico} patchFeitico={patchFeitico} duplicarFeitico={duplicarFeitico} setReducoesCustoFeitico={setReducoesCustoFeitico} toggleEstiloTabela={toggleEstiloTabela} addEstiloEspecial={addEstiloEspecial} removeEstilo={removeEstilo} patchEstilo={patchEstilo} addFuncionamento={addFuncionamento} removeFuncionamento={removeFuncionamento} patchFuncionamento={patchFuncionamento} setGeralVezes={setGeralVezes} addDominio={addDominio} removeDominio={removeDominio} patchDominio={patchDominio} setDominioAtivo={setDominioAtivo} />}
          {tabAtiva === "especializacoes" && <TabEspecializacoes draft={draft} derived={derived} setEspecializacoes={setEspecializacoes} toggleHabilidade={toggleHabilidade} toggleEscolhaHabilidade={toggleEscolhaHabilidade} toggleTalento={toggleTalento} setTalentoVezes={setTalentoVezes} toggleEscolhaTalento={toggleEscolhaTalento} setMelhoriaVezes={setMelhoriaVezes} toggleLendaria={toggleLendaria} toggleEscolhaAltoNivel={toggleEscolhaAltoNivel} patchTecnicasCombate={patchTecnicasCombate} />}
          {tabAtiva === "aptidoes" && <TabAptidoes draft={draft} derived={derived} setAptidaoNivel={setAptidaoNivel} toggleAptidao={toggleAptidao} setAptidaoOpcao={setAptidaoOpcao} setAptidaoVezes={setAptidaoVezes} setAptidaoOpcaoRepetida={setAptidaoOpcaoRepetida} />}
          {tabAtiva === "invocacoes" && <TabInvocacoes draft={draft} derived={derived} addInvocacao={addInvocacao} removeInvocacao={removeInvocacao} duplicarInvocacao={duplicarInvocacao} moverInvocacao={moverInvocacao} patchInvocacao={patchInvocacao} patchInvocacaoAttr={patchInvocacaoAttr} efeitosApi={efeitosApi} addHorda={addHorda} removeHorda={removeHorda} patchHorda={patchHorda} />}
          {tabAtiva === "equipamentos" && <TabEquipamentos draft={draft} derived={derived} addEquipamento={addEquipamento} removeEquipamento={removeEquipamento} patchEquipamento={patchEquipamento} toggleFerramenta={toggleFerramenta} patchFerramenta={patchFerramenta} toggleEncantamento={toggleEncantamento} addArmaCustom={addArmaCustom} patchArmaCustom={patchArmaCustom} removeArmaCustom={removeArmaCustom} />}
          {tabAtiva === "interludios" && <TabInterludios draft={draft} derived={derived} setTreinoProgresso={setTreinoProgresso} setTreinoInstance={setTreinoInstance} setTreinoEspecialVezes={setTreinoEspecialVezes} />}
          {tabAtiva === "addons" && <TabAddons draft={draft} derived={derived} setAddons={setAddons} />}
          {tabAtiva === "calculos" && <TabCalculos derived={derived} setStatOverride={setStatOverride} patchCombate={patchCombate} />}
          {STUBS[tabAtiva] && <StubCard title={TABS.find((t) => t.id === tabAtiva)?.label} text={STUBS[tabAtiva]} />}
        </div>
      </div>
    </div>
    </PrimitivasDeAddon>
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
/* Aba: Perícias (Perícias + Jogadas de Ataque + Testes)        */
/* ============================================================ */
/* Os três tipos de teste têm a MESMA forma (mod do atributo + metade
   do ND + bônus de treinamento), então dividem a mesma linha de 32px:
   medidor de proficiência, nome, atributo, bônus e a descrição que
   abre sob demanda. O motor entrega tudo pronto em `derived.testes`.

   Ordem dos cards (autor, 2026-07-27): Jogadas de Ataque, Testes de
   Resistência e Perícias por último.

   Orçamento (autor, 2026-07-27): 3 + maior mod entre INT e SAB + rank
   do Grau do Feiticeiro. Mestre custa 2 vagas, Treinado custa 1.
   PERÍCIAS e TESTES DE RESISTÊNCIA dividem esse mesmo caixa, então o
   contador aparece igual nos dois cards. Jogadas de Ataque ficam fora
   (não têm faixa de Mestre e o treino é com a arma). */

const ABREV_ATTR = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.abbr]));
const PROF_ROTULOS = ["Treinado", "Mestre"];
const PROF_POR_INDICE = [null, "treinado", "mestre"];
const INDICE_POR_PROF = { treinado: 1, mestre: 2 };
const OFICIO_OPCOES = [...new Set(catalogoDoTipo("kit").map((item) => item.oficio).filter(Boolean))];

function TabPericias({
  draft, derived, patch, setProficiencia, toggleAtaqueProf,
  adicionarPericiaPersonalizada, adicionarPericiaDoCatalogo,
  editarPericiaPersonalizada, moverPericia, removerPericia,
}) {
  const { pericias, resistencias, ataques, manobras, orcamento } = derived.testes;
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [periciaEditando, setPericiaEditando] = useState(null);
  const [oficiosAbertos, setOficiosAbertos] = useState(false);
  const sugestoes = sugestoesPericias(draft);
  const personalizadas = Array.isArray(draft.periciasPersonalizadas) ? draft.periciasPersonalizadas : [];
  const oficios = [...new Set((Array.isArray(draft.periciaOficios)
    ? draft.periciaOficios
    : (draft.periciaOficio ? [draft.periciaOficio] : []))
    .map((nome) => String(nome || "").trim()).filter(Boolean))];
  const alternarOficio = (nome) => {
    const next = oficios.includes(nome) ? oficios.filter((item) => item !== nome) : [...oficios, nome];
    patch({ periciaOficios: next, periciaOficio: "" });
  };
  const finalizarEdicao = (p) => {
    const bruta = personalizadas.find((item) => item.id === p.id);
    if (bruta && !String(bruta.nome || "").trim()) {
      editarPericiaPersonalizada(p.id, { nome: "Nova perícia" });
    }
    setPericiaEditando(null);
  };

  const linhaTR = (r) => (
    <TesteLinha
      key={r.value}
      item={{ ...r, id: r.value, nome: r.label }}
      onCicla={(prof) => setProficiencia("resistenciasProf", r.value, prof)}
      tag={r.critico ? "Sucesso Crítico" : null}
    />
  );
  const linhaAtaque = (a) => (
    <TesteLinha
      key={a.id}
      // Ataque não recebe treino de fora, então escolhida e resolvida são a
      // mesma coisa. Sem a escolhida, a linha se pintaria de verde (concedido).
      item={{ ...a, prof: a.treinado ? "treinado" : null, profEscolhida: a.treinado ? "treinado" : null }}
      maxProf={1}
      travado={a.sempreTreinado}
      onCicla={() => toggleAtaqueProf(a.id)}
    />
  );
  const ataquePor = (id) => ataques.filter((a) => a.id === id).map(linhaAtaque);

  return (
    <>
      <Card
        title="Jogadas de Ataque"
        headerRight={
          <BoolChip ativo={!!draft.ataqueFineza} onToggle={() => patch({ ataqueFineza: !draft.ataqueFineza })}>
            Fineza
          </BoolChip>
        }
      >
        {/* Layout do autor (2026-07-27): Corpo a Corpo à esquerda, A Distância à
            direita, Amaldiçoado embaixo em largura cheia. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
          <div className="space-y-1">{ataquePor("corpo")}</div>
          <div className="space-y-1">{ataquePor("distancia")}</div>
        </div>
        <div className="space-y-1 mt-1">{ataquePor("amaldicoado")}</div>
      </Card>


      {/* Layout do autor (2026-07-27): Reflexos e Fortitude à esquerda, Vontade
          e Astúcia à direita, Integridade sozinha embaixo em largura cheia.
          Filtro pela `escala` e não por índice, porque o agrupamento que ele
          pediu É o das escalas: os dois da Defesa, os dois da CD, e a fixa. */}
      <Card title="Testes de Resistência" headerRight={<ContadorVagas orcamento={orcamento} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
          {["defesa", "cd"].map((esc) => (
            <div key={esc} className="space-y-1">
              {resistencias.filter((r) => r.escala === esc).map(linhaTR)}
            </div>
          ))}
        </div>
        <div className="space-y-1 mt-1">
          {resistencias.filter((r) => r.escala === "fixa").map(linhaTR)}
        </div>
      </Card>

      <Card title="Perícias" headerRight={<ContadorVagas orcamento={orcamento} />}>
        {orcamento.excedeu && (
          <p className="text-[11px] text-rose-400 mb-3">
            Você treinou mais do que as vagas permitem. Remova um treino ou eleve Inteligência, Sabedoria ou o ND.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setPericiaEditando(adicionarPericiaPersonalizada())}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-purple-700/70 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova perícia
          </button>
          {sugestoes.length > 0 && (
            <button
              type="button"
              onClick={() => setMostrarSugestoes((v) => !v)}
              aria-expanded={mostrarSugestoes}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Sugestões {sugestoes.length}
            </button>
          )}
        </div>

        {mostrarSugestoes && sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 rounded-lg border border-slate-800 bg-slate-950/40 p-2">
            {sugestoes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => adicionarPericiaDoCatalogo(p.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-700 text-slate-300 hover:text-white transition-colors"
                title={p.nome}
              >
                <Plus className="w-3 h-3" /> {p.nome}
                <span className="text-[9px] uppercase text-slate-500">{ABREV_ATTR[p.atributo]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Duas colunas, não uma lista longa (autor, 2026-07-27). São DUAS
            listas independentes, e não um grid de duas colunas: numa grade, a
            linha que abre a descrição esticaria a célula vizinha junto. Assim,
            abrir uma perícia só empurra as de baixo na coluna dela. A ordem
            alfabética segue lendo de cima para baixo em cada coluna. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
          {[pericias.slice(0, Math.ceil(pericias.length / 2)),
            pericias.slice(Math.ceil(pericias.length / 2))].map((coluna, i) => (
            <div key={i} className="space-y-1">
              {coluna.map((p) => {
                const bruta = p.personalizada
                  ? (personalizadas.find((item) => item.id === p.id) ?? p)
                  : null;
                const editando = periciaEditando === p.id;
                const editandoOficio = p.id === "oficio" && oficiosAbertos;
                const concluir = () => {
                  if (p.personalizada) finalizarEdicao(p);
                  if (p.id === "oficio") setOficiosAbertos(false);
                };
                return (
                  <React.Fragment key={p.id}>
                    <TesteLinha
                      item={p}
                      onCicla={(prof) => setProficiencia("pericias", p.id, prof)}
                      nomeConteudo={editando ? (
                        <input
                          value={bruta?.nome ?? ""}
                          onChange={(e) => editarPericiaPersonalizada(p.id, { nome: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") concluir();
                            if (e.key === "Escape") setPericiaEditando(null);
                          }}
                          className="h-6 min-w-0 flex-1 rounded border border-purple-700 bg-slate-950 px-1.5 text-[12px] font-semibold text-slate-100 outline-none focus:border-purple-400"
                          aria-label="Nome da perícia"
                          autoFocus
                        />
                      ) : p.id === "oficio" ? (
                        <button
                          type="button"
                          onClick={() => setOficiosAbertos((aberto) => !aberto)}
                          className="min-w-0 truncate text-left text-[12px] font-semibold text-slate-100 hover:text-purple-200"
                          title={p.nome}
                        >
                          {p.nome}
                        </button>
                      ) : null}
                      atributoConteudo={editando ? (
                        <select
                          value={bruta?.atributo || "inteligencia"}
                          onChange={(e) => editarPericiaPersonalizada(p.id, { atributo: e.target.value })}
                          className="h-6 w-12 rounded border border-slate-700 bg-slate-950 px-1 text-[9px] font-semibold text-slate-300 outline-none focus:border-purple-500"
                          aria-label={`Atributo de ${p.nome}`}
                        >
                          {AFTY_ATTRS.map((a) => <option key={a.key} value={a.key}>{a.abbr}</option>)}
                        </select>
                      ) : null}
                      edicao={(p.personalizada || p.id === "oficio") ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (editando || editandoOficio) concluir();
                            else if (p.personalizada) setPericiaEditando(p.id);
                            else setOficiosAbertos(true);
                          }}
                          className="w-5 h-5 rounded flex-shrink-0 text-slate-500 hover:text-purple-300 hover:bg-slate-800"
                          title={editando || editandoOficio ? "Salvar" : (p.id === "oficio" ? "Selecionar Ofícios" : "Editar perícia")}
                          aria-label={editando || editandoOficio ? `Salvar ${p.nome}` : `Editar ${p.nome}`}
                        >
                          {editando || editandoOficio
                            ? <Check className="w-3 h-3 mx-auto" />
                            : <Pencil className="w-3 h-3 mx-auto" />}
                        </button>
                      ) : null}
                      acoes={(
                        <div className="flex items-center gap-px flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => moverPericia(p.id, -1)}
                            disabled={pericias[0]?.id === p.id}
                            className="w-5 h-5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-25"
                            title="Mover para cima"
                            aria-label={`Mover ${p.nome} para cima`}
                          >
                            <ArrowUp className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverPericia(p.id, 1)}
                            disabled={pericias[pericias.length - 1]?.id === p.id}
                            className="w-5 h-5 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-25"
                            title="Mover para baixo"
                            aria-label={`Mover ${p.nome} para baixo`}
                          >
                            <ArrowDown className="w-3 h-3 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removerPericia(p.id)}
                            className="w-5 h-5 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Remover da ficha"
                            aria-label={`Remover ${p.nome}`}
                          >
                            <X className="w-3 h-3 mx-auto" />
                          </button>
                        </div>
                      )}
                    />
                    {editandoOficio && (
                      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1.5">
                        {OFICIO_OPCOES.map((nome) => {
                          const ativo = oficios.includes(nome);
                          return (
                            <button
                              key={nome}
                              type="button"
                              onClick={() => alternarOficio(nome)}
                              aria-pressed={ativo}
                              className={`rounded border px-2 py-1 text-[10px] font-semibold transition-colors ${
                                ativo
                                  ? "border-purple-600 bg-purple-950/60 text-purple-200"
                                  : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {nome}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Manobras: Agarrar, Derrubar, Desarmar e Empurrar (autor, 2026-07-28).
          São testes de perícia, então moram junto dos outros testes. Cada linha
          traz o valor para EXECUTAR e o para RESISTIR, que é sempre o maior
          entre Atletismo e Acrobacia. */}
      <Card title="Manobras">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
          {manobras.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-950/40 flex items-center gap-2.5 px-2.5 h-9">
              <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-100 truncate" title={m.nome}>
                {m.nome}
              </span>
              {/* A distância só aparece quando um poder mudou o padrão: o 1,5m
                  é igual para todo mundo e só fazia ruído (autor, 2026-07-28). */}
              {m.distancia != null && m.distancia !== EMPURRAO_BASE && (
                <span className="text-[10px] font-medium text-purple-300 whitespace-nowrap flex-shrink-0">
                  {String(m.distancia).replace(".", ",")}m
                </span>
              )}
              <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0">Exec.</span>
              <ValorComFontes valor={m.executar} partes={m.partesExecutar} />
              <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0">Resist.</span>
              <ValorComFontes valor={m.resistir} partes={m.partesResistir} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* Vagas de treino gastas / disponíveis. Aparece igual nos dois cards que
   gastam o mesmo caixa, Perícias e Testes de Resistência. */
function ContadorVagas({ orcamento }) {
  return (
    <span
      className={`font-mono text-sm font-bold tabular-nums ${orcamento.excedeu ? "text-rose-400" : "text-slate-200"}`}
      title="Vagas de treino gastas / disponíveis (Mestre custa 2, e Perícias e Testes de Resistência dividem as mesmas)"
    >
      {orcamento.gastos} / {orcamento.total}
    </span>
  );
}

/* Uma linha de teste. Serve perícia, ataque e Teste de Resistência: o que muda
   é quantas faixas de proficiência existem (ataque só tem Treinado).

   Sem descrição e sem abrir/fechar (autor, 2026-07-27): o texto do livro não
   agrega nada na hora de montar a ficha. O que a linha entrega é o número, e a
   explicação dele fica no hover, que mostra as fontes.

   VERDE = faixa concedida de fora (Treino de Perícia). Continua CLICÁVEL: o
   medidor mexe na proficiência ESCOLHIDA, então marcar por cima do verde
   converte a concessão no bônus numérico (+1 Treinado, +2 Mestre). */
function TesteLinha({
  item, onCicla, maxProf = 2, travado, tag, edicao, acoes, nomeConteudo, atributoConteudo,
}) {
  const escolhido = travado ? maxProf : (INDICE_POR_PROF[item.profEscolhida] ?? 0);
  const resolvido = travado ? maxProf : (INDICE_POR_PROF[item.prof] ?? 0);
  const soConcedido = resolvido > escolhido;

  return (
    <div className={`rounded-lg border transition-colors ${
      soConcedido ? "border-emerald-700 bg-emerald-950/30"
        : resolvido > 0 ? "border-purple-700 bg-purple-950/30"
        : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <VezesGauge
          vezes={escolhido}
          concedido={resolvido}
          max={maxProf}
          nome={item.nome}
          rotulos={PROF_ROTULOS}
          bloqueado={travado}
          onSet={(n) => onCicla(PROF_POR_INDICE[n] ?? null)}
        />

        <span className="flex-1 min-w-0 flex items-center gap-x-2 overflow-hidden">
          {nomeConteudo ?? (
            <span className="text-[12px] font-semibold text-slate-100 truncate" title={item.nome}>
              {item.nome}
            </span>
          )}
          {atributoConteudo ?? (
            <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0">
              {ABREV_ATTR[item.atributo] || ""}
            </span>
          )}
          {tag && (
            <span className="text-[10px] font-medium text-purple-300 whitespace-nowrap flex-shrink-0">{tag}</span>
          )}
        </span>

        {edicao}
        <ValorComFontes valor={item.bonus} partes={item.partes} />
        {acoes}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Aba: Habilidades (Feitiços / Estilo das Sombras / Marciais)  */
/* ============================================================ */
/* A aba mostra UM subsistema por vez, escolhido pela ORIGEM, nunca
   combinados (autor, 2026-07): origem comum = Feitiços, Sem Técnica =
   Estilo das Sombras no lugar dos Feitiços, Restringido = Habilidades
   Marciais no lugar dos Feitiços. Feitiços são CRIADOS pelo jogador
   (não é catálogo): o motor em afty-feiticos.js computa cada um.

   As HABILIDADES GERAIS (autor, 2026-07-26) ficam FORA dessa troca: toda
   origem as vê, e elas gastam o MESMO contador do subsistema. Por isso o
   contador aparece igual nos dois cards, e é o da aba inteira. */

const TIPO_FEITICO = [
  { value: "dano",     label: "Dano" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "curativo", label: "Curativo" },
  { value: "especial", label: "Especial" },
  { value: "passivo",  label: "Passivo / Característica" },
];
const TIPO_FEITICO_LABEL = Object.fromEntries(TIPO_FEITICO.map((t) => [t.value, t.label]));

/* Dano · uma linha por FONTE (autor, 2026-07-27): o Ataque Básico, que engloba
   Desarmado, Faixas, Manoplas e o Corpo Treinado, e mais uma para cada arma
   equipada. Todas usam a MESMA conta: o dano listado na tabela da arma não
   entra, e dela vêm só o Alcance e as Propriedades. */
function DanoCard({ derived, toggleArmaDedicada }) {
  const entradas = derived.dano?.entradas ?? [];
  const ded = derived.dedicadas ?? { ativa: false, escolhidas: [], max: 3, restante: 3 };

  return (
    <Card
      title="Dano"
      headerRight={ded.ativa ? (
        <span
          className="font-mono text-sm font-bold tabular-nums text-slate-200"
          title="Armas Dedicadas escolhidas / máximo"
        >
          {ded.escolhidas.length} / {ded.max}
        </span>
      ) : null}
    >
      <div className="space-y-1">
        {entradas.map((e) => (
          <div
            key={e.id}
            className={`rounded-lg border px-2.5 py-2 ${
              e.fonte === "basico" ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
            }`}
          >
            {/* ⚠ A linha NÃO é `group`. Ela tem DOIS painéis de fontes (Acerto e
                Dano) e o `group-hover` sem nome responde a qualquer ancestral
                com a classe, então a linha inteira acendia os dois de uma vez,
                sobrepostos. Cada número carrega o grupo NOMEADO dele, e abre
                sozinho. */}
            <div className="flex items-center gap-2.5">
              {/* Marcar como Arma Dedicada. Só aparece com a habilidade pega, e
                  a linha do Ataque Básico fica com o espaço vazio para os nomes
                  seguirem alinhados (mesma anatomia do equipar, na aba
                  Equipamentos). */}
              {ded.ativa && (
                e.fonte === "arma" ? (
                  <button
                    type="button"
                    disabled={!e.elegivelDedicada || (!e.dedicada && ded.restante <= 0)}
                    onClick={() => toggleArmaDedicada(e.id)}
                    aria-pressed={!!e.dedicada}
                    aria-label={`${e.dedicada ? "Remover" : "Marcar"} ${e.nome} como Arma Dedicada`}
                    title={
                      !e.elegivelDedicada ? "Duas Mãos ou Pesada, e não é Marcial"
                        : e.dedicada ? "Remover das Armas Dedicadas"
                        : ded.restante <= 0 ? "Já são três Armas Dedicadas"
                        : "Marcar como Arma Dedicada"
                    }
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      e.dedicada
                        ? "bg-purple-700 border-purple-600 text-white"
                        : !e.elegivelDedicada || ded.restante <= 0
                          ? "border-slate-800 text-slate-700 cursor-not-allowed"
                          : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
                    }`}
                  >
                    {e.dedicada ? <Check className="w-3 h-3" /> : <Swords className="w-2.5 h-2.5" />}
                  </button>
                ) : (
                  <span className="w-5 flex-shrink-0" />
                )
              )}
              <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-100 truncate" title={e.nome}>
                {e.nome}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0">
                {ABREV_ATTR[e.atributo] || ""}
              </span>
              {e.niveisDano > 0 && (
                <span className="text-[10px] font-medium text-purple-300 whitespace-nowrap flex-shrink-0">
                  {e.niveisDano} {e.niveisDano > 1 ? "Níveis" : "Nível"} de Dano
                </span>
              )}
              {e.ignoraRD > 0 && (
                <span className="text-[10px] font-medium text-purple-300 whitespace-nowrap flex-shrink-0">
                  Ignora RD {e.ignoraRD}
                </span>
              )}
              {e.removeResistencia && (
                <span className="text-[10px] font-medium text-purple-300 whitespace-nowrap flex-shrink-0">
                  Remove Resistência
                </span>
              )}
              <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0" title="Margem de Crítico">
                Crít. {e.margemCritico}
              </span>
              {e.alcance && (
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{e.alcance.texto}</span>
              )}
              {e.acerto != null && (
                <span
                  className="relative group/acerto text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 cursor-help"
                  title={e.acertoAtaque}
                >
                  Acerto{" "}
                  <span className="font-mono font-semibold tabular-nums text-slate-200">{sinalDe(e.acerto)}</span>
                  <PainelDeFontes
                    partes={e.partesAcerto}
                    total={sinalDe(e.acerto)}
                    aparecer="group-hover/acerto:block"
                  />
                </span>
              )}
              <span className="relative group/dano font-mono text-[13px] font-bold tabular-nums text-white whitespace-nowrap cursor-help">
                {e.texto}
                <PainelDeFontes partes={e.partes} total={e.total} aparecer="group-hover/dano:block" />
              </span>
            </div>
            {e.propriedades?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {e.propriedades.map((p) => (
                  <span
                    key={p.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      p.concedida
                        ? "border-purple-700 bg-purple-950/40 text-purple-200"
                        : "border-slate-700 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    {p.rotulo}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* Card de CURA, irmão do de Dano: uma linha por fonte, com a rolagem à direita
   e o hover mostrando de onde cada pedaço veio. Some inteiro para quem não cura.

   A linha mostra o que UM ponto compra (autor, 2026-08-03), e não a rolagem do
   gasto máximo: a Energia Reversa e a Regeneração Corporal escalam por ponto, e
   é o valor por ponto que o jogador decide na mesa. O uso inteiro fecha no
   hover, na linha do Total.

   ⚠ Com o custo por ponto, o valor FIXO não cabe no `5d8`: ele entra uma vez no
   total, e não por ponto. Por isso ele vira um número próprio na linha, com o
   mesmo desenho do Acerto na linha de Dano. Sem custo por ponto a rolagem fecha
   inteira (`6d10+17`) e o número separado não aparece.

   ⚠ UM painel de hover por linha, de propósito: a linha de Dano precisou de dois
   (Acerto e Dano) e isso obrigou grupos nomeados. Aqui o hover único já carrega
   dados, faces, multiplicação e parcelas fixas, então a linha continua sendo
   `group` e nada colide. */
function CuraCard({ derived }) {
  const linhas = derived.cura?.linhas ?? [];
  if (!linhas.length) return null;

  return (
    <Card title="Cura">
      <div className="space-y-1">
        {linhas.map((l) => (
          <div key={l.id} className="rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-2">
            <div className="group flex items-center gap-2.5">
              <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-100 truncate" title={l.nome}>
                {l.nome}
                {l.qtd ? <span className="text-slate-500"> ×{l.qtd}</span> : null}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0">
                {l.alcance}
              </span>
              {l.espelhaNome && (
                <span
                  className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0"
                  title={`Rola a mesma coisa que ${l.espelhaNome}`}
                >
                  {l.espelhaNome}
                </span>
              )}
              {l.usos != null && (
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0" title="Usos por descanso">
                  Usos{" "}
                  <span className="font-mono font-semibold tabular-nums text-slate-200">{l.usos}</span>
                </span>
              )}
              {l.unidade && (
                <span className="text-[10px] font-medium text-emerald-300 whitespace-nowrap flex-shrink-0">
                  {rotuloBloco(l.unidade)}, até {l.unidade.pontosUsaveis ?? l.unidade.pontos}
                </span>
              )}
              {l.unidade && l.fixo !== 0 && (
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0" title="Soma uma vez no total">
                  Total{" "}
                  <span className="font-mono font-semibold tabular-nums text-slate-200">{sinalDe(l.fixo)}</span>
                </span>
              )}
              <span className="relative font-mono text-[13px] font-bold tabular-nums text-white whitespace-nowrap cursor-help">
                {l.texto}
                <PainelDeFontes partes={l.partes} total={l.textoNoMaximo} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================ */
/* EXPANSÃO DE DOMÍNIO                                          */
/* ============================================================ */
/* Portado do construtor da 2.5.2 (sections/actions/DomainForm.jsx), a pedido do
   autor. O card SÓ APARECE para quem tem a aptidão Expansão de Domínio
   Incompleta, que é a porta de entrada das três versões.

   O que a criatura ganha em número sai pelo Motor, e não daqui: este card é o
   editor, e a bancada de Simulação de Combate é quem liga a expansão. Por isso o
   card mostra o resultado (custo, duração, área, PV do domo) e o texto pronto,
   sem explicar de onde cada número veio. */
/* Renderiza o texto da expansão como BLOCO DE REGRA, igual à 2.5.2
   (sections/actions/DomainText.jsx): título entre filetes, aparência, faixa com
   "Nome [Expansão X]" e o corpo com bullets de título destacado.

   O marcador fica em coluna própria (flex), e não como recuo, para a linha
   quebrada alinhar embaixo do texto e não embaixo da bolinha. */
const DOM_TITULO_RE = /^●\s*(.*?\.)\s+([\s\S]*)$/;

function DominioBullet({ titulo, corpo }) {
  return (
    <div className="text-[11px] leading-relaxed text-slate-300 flex gap-1.5">
      <span className="text-purple-300 flex-shrink-0 select-none">●</span>
      <p className="min-w-0 text-justify">
        <span className="font-bold text-purple-200">{titulo}</span>
        {corpo ? <> {corpo}</> : null}
      </p>
    </div>
  );
}

function DominioTexto({ texto, nome, versaoLabel, aparencia }) {
  if (!texto?.trim() && !aparencia?.trim()) return null;
  const paras = (texto || "").split("\n\n").map((p) => p.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3 rounded border border-slate-800 bg-slate-950/60 p-3">
      <div className="border-y-2 border-purple-900/60 py-1">
        <h3 className="text-center text-sm font-bold text-purple-100">
          Expansão de Domínio{nome?.trim() ? `: ${nome.trim()}` : ""}
        </h3>
      </div>

      {aparencia?.trim() && (
        <p className="text-[11px] leading-relaxed text-slate-300 text-justify whitespace-pre-wrap">{aparencia.trim()}</p>
      )}

      {versaoLabel && (
        <div className="bg-purple-950/50 border border-purple-900/60 rounded-sm px-2 py-1">
          <p className="text-center text-xs font-bold text-purple-200 underline">
            {nome?.trim() || "Expansão"} [Expansão {versaoLabel}]
          </p>
        </div>
      )}

      {paras.map((para, i) => {
        if (!para.startsWith("●")) {
          return (
            <p key={i} className="text-[11px] leading-relaxed text-slate-300 text-justify whitespace-pre-wrap">{para}</p>
          );
        }
        const m = para.match(DOM_TITULO_RE);
        return (
          <DominioBullet
            key={i}
            titulo={m ? m[1] : para.replace(/^●\s*/, "")}
            corpo={m ? m[2] : ""}
          />
        );
      })}
    </div>
  );
}

/* Um efeito de expansão, RECOLHÍVEL como na 2.5.2. Recolhido, a linha mostra só
   o resumo (nome ou rótulo, o selo ×1,5 e a grandeza), que é o que serve para
   varrer com o olho. O formulário abre sob demanda. */
function EfeitoDominioLinha({ efeito, valor, podeFortalecer, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(false);
  const livre = categoriaLivre(efeito.categoria);
  const tipos = tiposDaCategoria(efeito.categoria);
  const ehAtributo = efeito.categoria === "amp_corporal" && efeito.tipo === "atributo";
  const ehRd = efeito.categoria === "amp_corporal" && efeito.tipo === "rd";
  const resumo = efeito.nome?.trim() || rotuloDoEfeito(efeito);
  const trocaAtributo = (i, v) => {
    const atuais = [...(efeito.atributos ?? [])];
    atuais[i] = v;
    onPatch({ atributos: atuais });
  };
  return (
    <div className="rounded border border-slate-800 bg-slate-950/50">
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-expanded={aberto}
          className="flex-1 flex items-center gap-1.5 text-left min-w-0 text-slate-300 hover:text-white"
        >
          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${aberto ? "" : "-rotate-90"}`} />
          <span className="text-xs font-semibold truncate">{resumo}</span>
          {efeito.fortalecido && <span className="text-[9px] text-purple-300 font-bold flex-shrink-0">×1,5</span>}
          {!aberto && valor && <span className="text-[10px] text-slate-500 font-mono truncate">· {valor}</span>}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Remover efeito"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {aberto && (
        <div className="px-2.5 pb-2.5 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <FieldLabel>Categoria</FieldLabel>
              <Select
                value={efeito.categoria}
                onChange={(v) => onPatch({ categoria: v, tipo: categoriaLivre(v) ? "" : tiposDaCategoria(v)[0]?.value ?? "" })}
                options={DOMINIO_CATEGORIAS}
              />
            </div>
            {!livre && (
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <Select value={efeito.tipo} onChange={(v) => onPatch({ tipo: v })} options={tipos} />
              </div>
            )}
          </div>

          {valor && (
            <div className="font-mono text-[11px] text-purple-200 bg-purple-950/30 border border-purple-900/40 rounded px-2 py-1">
              {valor}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <BoolChip
              ativo={!!efeito.fortalecido}
              onToggle={() => onPatch({ fortalecido: !efeito.fortalecido })}
              bloqueado={!efeito.fortalecido && !podeFortalecer}
              lockTitle="Fortalecer custa uma segunda vaga de efeito, e não há folga"
            >
              Fortalecido
            </BoolChip>
            {ehRd && (
              <div className="flex-1 min-w-[160px]">
                <TextInput value={efeito.rdTipos ?? ""} onChange={(v) => onPatch({ rdTipos: v })} placeholder="Tipos de dano protegidos" />
              </div>
            )}
          </div>

          {ehAtributo && (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((i) => (
                <Select
                  key={i}
                  value={efeito.atributos?.[i] ?? ""}
                  onChange={(v) => trocaAtributo(i, v)}
                  options={[{ value: "", label: "escolher..." }, ...ATRIBUTOS_FISICOS]}
                />
              ))}
            </div>
          )}

          <div>
            <FieldLabel>Nome</FieldLabel>
            <TextInput value={efeito.nome ?? ""} onChange={(v) => onPatch({ nome: v })} placeholder={rotuloDoEfeito(efeito)} />
          </div>
          <div>
            <FieldLabel>Descrição</FieldLabel>
            <TextArea
              value={efeito.descricao ?? ""}
              onChange={(v) => onPatch({ descricao: v })}
              rows={2}
              placeholder={livre ? "Descreva o efeito" : "Reescreve a frase padrão"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TÉCNICAS DE BARREIRA: os números da PAREDE.
 *
 * ⚠ A aptidão existe desde a transcrição e NUNCA teve tela (autor, 2026-08-26:
 * *"Precisamos de arrumar algum local para colocar a Vida, RD e Máximo de
 * Paredes"*). O que a ficha mostrava de barreira era só o PV do DOMO, dentro do
 * card de Expansão, e o domo é doze paredes: a parede em si, que é o que o
 * jogador ergue com uma Ação Comum, não aparecia em lugar nenhum.
 *
 * Fica ao lado da Expansão porque os dois números são o mesmo material, e some
 * junto com a aptidão: sem Técnicas de Barreira não há o que erguer.
 */
function BarreiraCard({ derived }) {
  const b = derived.dominios?.barreira;
  if (!b?.tem) return null;
  /* ⚠ A CORTINA só entra para quem tem a aptidão dela. Ela vale 3 paredes
     (autor, 2026-08-26) e o número não existia em lugar nenhum: o texto da
     aptidão diz o custo e a área, e nunca a vida. */
  const linhas = [
    { k: "PV por Parede", v: b.pvParede, partes: b.partesPvParede },
    { k: "RD por Parede", v: b.rdParede, partes: b.partesRdParede },
    { k: "Máximo de Paredes", v: b.maxParedes, partes: b.partesMaxParedes },
    ...(b.temCortina ? [{ k: "PV da Cortina", v: b.pvCortina, partes: b.partesPvCortina }] : []),
  ];
  return (
    <Card title="Técnicas de Barreira">
      <div className={`grid gap-2 ${linhas.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {linhas.map((l) => (
          /* ⚠ O `group` fica em CADA célula, e não no grid. Com ele no pai, passar
             o mouse numa célula acenderia os três painéis de uma vez. */
          <div key={l.k} className="relative group rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{l.k}</div>
            <div className="font-mono text-lg font-bold tabular-nums text-white cursor-help">{l.v}</div>
            {l.partes?.length > 0 && <PainelDeFontes partes={l.partes} total={l.v} />}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DominioCard({ derived, addDominio, removeDominio, patchDominio, setDominioAtivo }) {
  const info = derived.dominios;
  const versoes = versoesDisponiveis(derived.aptidoesEscolhidas ?? []);
  if (!versoes.length) return null;

  return (
    <Card
      title="Expansão de Domínio"
      headerRight={
        <span className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
          <span>DOM {info.domNivel} · {info.maxEfeitos} {info.maxEfeitos === 1 ? "efeito" : "efeitos"}</span>
          {/* O CONFLITO é da CRIATURA e não de cada expansão, então mora no
              cabeçalho. Ele existe desde que haja Nível de Aptidão em Domínio. */}
          <span className="relative group cursor-help text-slate-300">
            Conflito 1d{info.conflito.faces}+{info.conflito.bonus}
            <PainelDeFontes partes={info.conflito.partes} total={info.conflito.bonus} />
          </span>
        </span>
      }
    >
      <div className="space-y-3">
        {info.lista.map((d) => {
          const excedeu = d.vagasUsadas > info.maxEfeitos;
          const patch = (partial) => patchDominio(d.id, partial);
          const patchEfeito = (efId, partial) =>
            patch({ efeitos: d.efeitos.map((e) => (e.id === efId ? { ...e, ...partial } : e)) });
          return (
            <div key={d.id} className="rounded-lg border border-purple-900/50 bg-purple-950/10 p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[160px]">
                  <TextInput value={d.nome} onChange={(v) => patch({ nome: v })} placeholder="Nome da expansão" />
                </div>
                <div className="min-w-[150px]">
                  <Select value={d.versao} onChange={(v) => patch({ versao: v })} options={versoes} />
                </div>
                <BoolChip ativo={info.ativoId === d.id} onToggle={() => setDominioAtivo(info.ativoId === d.id ? null : d.id)}>
                  {info.ativoId === d.id ? "Ativa" : "Inativa"}
                </BoolChip>
                <button
                  type="button"
                  onClick={() => removeDominio(d.id)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
                  aria-label="Remover expansão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bloco de números, no formato da 2.5.2: uma linha em fonte
                  monoespaçada com tudo que a expansão custa e entrega. */}
              <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
                  <span className="text-slate-500">Execução: <span className="text-slate-300">Duas Ações Comuns</span></span>
                  <span className="text-slate-500">
                    Custo: <span className="text-purple-300">{d.custo} PE</span>
                    {d.acertoGarantido?.ativo && <span className="text-slate-600"> (+5 Acerto Garantido)</span>}
                  </span>
                  <span className="text-slate-500">Duração: <span className="text-slate-300">{d.duracao} {d.duracao === 1 ? "rodada" : "rodadas"}</span></span>
                  <span className="text-slate-500">Distância: <span className="text-slate-300">{d.area}</span></span>
                  <span className="text-slate-500">
                    {d.versao === "sem_barreiras" ? "Totem" : "Barreira"}: <span className="text-slate-300">{d.pvBarreira} PV</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Efeitos de Expansão: <span className={`font-mono ${excedeu ? "text-rose-300" : "text-white"}`}>{d.vagasUsadas}/{info.maxEfeitos}</span>
                  {d.versao === "incompleta" && (
                    <span className="text-amber-400/90 ml-2">Incompleta: efeitos limitados ao nível de aptidão 3.</span>
                  )}
                </div>
                <details className="text-[11px] text-slate-400">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none">
                    Efeitos base da abertura (sempre aplicados)
                  </summary>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside marker:text-purple-500/70">
                    {DOMINIO_EFEITOS_BASE.map((b) => (
                      <li key={b.titulo} className="leading-snug pl-1">
                        <span className="font-semibold text-slate-300">{b.titulo}.</span> {b.texto}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              <div>
                <FieldLabel>Aparência</FieldLabel>
                <TextArea value={d.aparencia} onChange={(v) => patch({ aparencia: v })} rows={2} placeholder="Como a expansão se manifesta" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {DOMINIO_RITUAL_CATEGORIAS.map((categoria) => (
                  <div key={categoria.key}>
                    <FieldLabel>{`Ritual: ${categoria.label}`}</FieldLabel>
                    <Select
                      value={d.beneficiosRitual?.[categoria.key] ?? ""}
                      onChange={(valor) => patch({
                        beneficiosRitual: { ...d.beneficiosRitual, [categoria.key]: valor },
                      })}
                      options={[
                        { value: "", label: "Escolher" },
                        ...RITUAL_MELHORIAS.map((melhoria) => ({ value: melhoria.id, label: melhoria.nome })),
                      ]}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Efeitos de Expansão</span>
                  <button
                    type="button"
                    disabled={d.vagasUsadas >= info.maxEfeitos}
                    onClick={() => patch({ efeitos: [...d.efeitos, novoEfeitoDominio()] })}
                    title={d.vagasUsadas >= info.maxEfeitos ? "Limite de efeitos atingido para este Nível de Domínio" : undefined}
                    className={`flex items-center gap-1 text-[11px] ${
                      d.vagasUsadas >= info.maxEfeitos
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-purple-300 hover:text-purple-200"
                    }`}
                  >
                    <Plus className="w-3 h-3" /> Adicionar Efeito
                  </button>
                </div>
                {d.efeitos.length === 0 && (
                  <p className="text-xs text-slate-600 italic">Nenhum efeito de expansão adicionado.</p>
                )}
                {d.efeitos.map((ef) => (
                  <EfeitoDominioLinha
                    key={ef.id}
                    efeito={ef}
                    valor={valorDoEfeito(ef, info.domNivel, d.versao)}
                    podeFortalecer={d.vagasUsadas < info.maxEfeitos}
                    onPatch={(partial) => patchEfeito(ef.id, partial)}
                    onRemove={() => patch({ efeitos: d.efeitos.filter((e) => e.id !== ef.id) })}
                  />
                ))}
              </div>

              {info.temAcertoGarantido && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <BoolChip
                    ativo={!!d.acertoGarantido?.ativo}
                    onToggle={() => patch({ acertoGarantido: { ...d.acertoGarantido, ativo: !d.acertoGarantido?.ativo } })}
                  >
                    Acerto Garantido
                  </BoolChip>
                  {d.acertoGarantido?.ativo && (
                    <div className="flex-1 min-w-[160px]">
                      <TextInput
                        value={d.acertoGarantido?.escopo ?? ""}
                        onChange={(v) => patch({ acertoGarantido: { ...d.acertoGarantido, escopo: v } })}
                        placeholder="O que se torna garantido"
                      />
                    </div>
                  )}
                </div>
              )}

              <DominioTexto
                texto={d.texto}
                nome={d.nome}
                versaoLabel={rotuloVersao(d.versao)}
                aparencia={d.aparencia}
              />
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => addDominio(versoes[versoes.length - 1].value)}
          className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200"
        >
          <Plus className="w-3 h-3" /> Nova expansão
        </button>
      </div>
    </Card>
  );
}

function TabHabilidades({ draft, derived, patchCore, toggleArmaDedicada, addFeitico, removeFeitico, patchFeitico, duplicarFeitico, setReducoesCustoFeitico, toggleEstiloTabela, addEstiloEspecial, removeEstilo, patchEstilo, addFuncionamento, removeFuncionamento, patchFuncionamento, setGeralVezes, addDominio, removeDominio, patchDominio, setDominioAtivo }) {
  const dominio = (
    <DominioCard
      derived={derived}
      addDominio={addDominio}
      removeDominio={removeDominio}
      patchDominio={patchDominio}
      setDominioAtivo={setDominioAtivo}
    />
  );
  const barreira = <BarreiraCard derived={derived} />;
  const origem = draft.core.origem?.id;
  const gerais = <HabilidadesGeraisCard derived={derived} setGeralVezes={setGeralVezes} />;
  // O Dano vale para toda origem: até quem não tem Feitiço ataca.
  const dano = <DanoCard derived={derived} toggleArmaDedicada={toggleArmaDedicada} />;
  // A Cura some sozinha para quem não tem fonte nenhuma, então ela acompanha o
  // Dano em toda origem: um Restringido cura com Ainda de Pé e um Combatente com
  // Revigorar, sem nada de energia amaldiçoada no meio.
  const cura = <CuraCard derived={derived} />;
  /* O Estilo das Sombras.
     ⚠ ELE NÃO É MAIS EXCLUSIVO DO RAMO DO SEM TÉCNICA (2026-08-21). Até então
     este card só existia dentro do `if (origem === "sem_tecnica")`, e essa era
     uma QUARTA trava, separada das três de regra: um Addon com
     `libera: ["estiloSombras"]` abria o Estilo no motor e o card continuava sem
     ser montado, porque o layout da aba ramifica por origem.

     Quem aparece, e por quê:
       • Sem Técnica: SEMPRE, inclusive trancado, porque a mensagem "destrava no
         Nível 4" é o que diz a ele que o Estilo existe e está vindo;
       • as outras origens: só com a liberação de Addon, senão seria um card
         trancado na tela de quem nunca vai ter (o mesmo erro do card de
         Concessão);
       • qualquer uma que já tenha Técnica GRAVADA: senão desinstalar o addon
         deixaria a linha morta presa na ficha, sem tela para removê-la. */
  const estilo = mostraCardEstilo(origem, derived.estilo) ? (
    <EstiloSombrasCard
      draft={draft}
      derived={derived}
      toggleEstiloTabela={toggleEstiloTabela}
      addEstiloEspecial={addEstiloEspecial}
      removeEstilo={removeEstilo}
      patchEstilo={patchEstilo}
    />
  ) : null;
  if (origem === "sem_tecnica") {
    return (
      <>
        {estilo}
        {dano}
        {cura}
        {barreira}
        {dominio}
        {gerais}
      </>
    );
  }
  if (origem === "restringido") {
    return (
      <>
        <SubsistemaPendente titulo="Habilidades Marciais" origem="Restringido" />
        {estilo}
        {dano}
        {cura}
        {barreira}
        {dominio}
        {gerais}
      </>
    );
  }
  return (
    <>
      <PerfilAmaldicoadoCard
        draft={draft}
        derived={derived}
        patchCore={patchCore}
        addFuncionamento={addFuncionamento}
        removeFuncionamento={removeFuncionamento}
        patchFuncionamento={patchFuncionamento}
      />
      <FeiticosCard draft={draft} derived={derived} addFeitico={addFeitico} removeFeitico={removeFeitico} patchFeitico={patchFeitico} duplicarFeitico={duplicarFeitico} setReducoesCustoFeitico={setReducoesCustoFeitico} />
      {/* Depois dos Feitiços de propósito: quem chega aqui tem os dois, e o
          Feitiço é o que ele já tinha. Os dois dividem o mesmo contador. */}
      {estilo}
      {dano}
      {cura}
      {barreira}
      {dominio}
      {gerais}
    </>
  );
}

/* Medidor do contador único da aba (Feitiços + Habilidades Gerais).
   Aparece igual nos dois cards, para o gasto de um lado ser visível do outro. */
function ContadorHabilidades({ derived }) {
  const {
    gastosNoComum, comum, partesComum, exclusivasFeitico, exclusivasUsadas,
    exclusivasEstilo, exclusivasEstiloUsadas, excedeu,
  } = derived.orcamentoHabilidades;
  return (
    <div className="flex items-center gap-2" title="Feitiços e Habilidades Gerais gastam o mesmo contador">
      {/* O contador pode ser MULTIPLICADO pela origem (os Gêmeos ficam com
          metade, ou uma vez e meia depois da morte do irmão), então ele ganhou
          hover de fontes: sem isso o número reduzido não teria explicação. */}
      <span className="relative group">
        <span className={`font-mono text-sm font-bold tabular-nums ${excedeu ? "text-rose-400" : "text-slate-200"}`}>
          {gastosNoComum} / {comum}
        </span>
        {partesComum?.length > 1 && <PainelDeFontes partes={partesComum} total={comum} />}
      </span>
      {/* Vagas exclusivas de Feitiço aparecem SEPARADAS: somá-las ao contador
          faria parecer que sobra espaço para Habilidade Geral, e não sobra. */}
      {exclusivasFeitico > 0 && (
        <span
          className="font-mono text-[11px] font-bold text-purple-300 tabular-nums"
          title="Vagas exclusivas de Feitiço, que não servem para Habilidade Geral"
        >
          +{exclusivasUsadas} / {exclusivasFeitico}
        </span>
      )}
      {/* A de Estilo é ainda mais estreita que a de Feitiço, então ela ganha
          chip próprio pelo mesmo motivo: juntar as duas faria parecer que uma
          serve onde a outra não serve. */}
      {exclusivasEstilo > 0 && (
        <span
          className="font-mono text-[11px] font-bold text-cyan-300 tabular-nums"
          title="Vagas exclusivas de Técnica de Estilo, que não servem para Feitiço nem para Habilidade Geral"
        >
          +{exclusivasEstiloUsadas} / {exclusivasEstilo}
        </span>
      )}
      <span className="text-[9px] uppercase tracking-wider text-slate-400">Habilidades</span>
    </div>
  );
}

/* Habilidades Gerais: catálogo curto e repetível, aberto a qualquer origem.
   Reusa o vocabulário do card de Níveis Lendários: linha de 32px que abre sob
   demanda, medidor de repetições e chip de requisito com cadeado. O que limita
   é o contador da aba, o teto de vezes de cada uma e o ND das duas de alto
   nível (que vem resolvido do motor em `gerais.acesso`). */
function HabilidadesGeraisCard({ derived, setGeralVezes }) {
  const { escolhidas, maxVezes, acesso } = derived.gerais;
  const { excedeu } = derived.orcamentoHabilidades;
  const vezesDe = (id) => escolhidas.find((g) => g.id === id)?.vezes ?? 0;

  return (
    <Card title="Habilidades Gerais" headerRight={<ContadorHabilidades derived={derived} />}>
      {excedeu && (
        <p className="text-[11px] text-rose-400 mb-3">
          Você gastou mais do que o contador permite. Remova uma ou aumente o ND.
        </p>
      )}
      <div className="space-y-1">
        {HABILIDADES_GERAIS.map((g) => (
          <HabilidadeGeralCard
            key={g.id}
            item={g}
            vezes={vezesDe(g.id)}
            max={maxVezes[g.id] ?? 0}
            acesso={acesso[g.id]}
            onSetVezes={(n) => setGeralVezes(g.id, n)}
          />
        ))}
      </div>
    </Card>
  );
}

function HabilidadeGeralCard({ item, vezes, max, acesso, onSetVezes }) {
  const [open, setOpen] = useState(false);
  const escolhida = vezes > 0;
  // Já escolhida nunca trava (mesma regra do AltoNivelCard e do AptidaoCard):
  // senão baixar o ND prenderia a pega na ficha, gastando contador, sem como
  // remover. O motor devolve a pega mesmo inacessível justamente para isso.
  const bloqueada = (!acesso.ok || max < 1) && !escolhida;
  const repetivel = max > 1;

  return (
    <div className={`rounded-lg border transition-colors ${
      escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={() => onSetVezes(escolhida ? 0 : 1)}
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
          <RequisitoLista reqs={acesso.extras} />
        </button>

        {/* Medidor só depois de escolhida: o 1º segmento duplicaria o toggle.
            Acima de 6 vezes o medidor não cabe e vira contador. */}
        {repetivel && escolhida && (
          max <= 6
            ? <VezesGauge vezes={vezes} max={max} nome={item.nome} onSet={onSetVezes} />
            : <ContadorCompacto value={vezes} min={1} max={max} onChange={onSetVezes} />
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
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* NOVO ESTILO DA SOMBRA (Sem Técnica)                          */
/* ============================================================ */
/* Ocupa o lugar dos Feitiços na aba, e gasta o MESMO contador que eles: por
   isso o cabeçalho traz o `ContadorHabilidades`, idêntico ao dos outros cards.

   ⚠ ESTE CARD SÓ GUARDA O QUE A CRIATURA CONHECE (2026-08-10). Cada Técnica
   custa 1 do contador, e a IMBUIÇÃO no Domínio Simples não mora aqui: ela é
   combinação de mesa e vive na bancada de Simulação de Combate (no criador) e na
   sessão da Ficha Final. Ver o cabeçalho de afty-estilo-sombras.js.

   Duas formas de Técnica:
     tabela   — uma das 4 do livro. Alternador e o texto verbatim, nada a editar.
     especial — nome, texto livre e o Motor completo.

   ⚠ O card SOME para quem não é Sem Técnica. Abaixo do ND 4 ele aparece
   trancado, e não escondido: o jogador precisa saber que aquilo existe e
   quando chega. */

/* Uma Técnica de Estilo de tabela. Mesma anatomia do HabilidadeGeralCard:
   alternador, nome e o texto verbatim no corpo recolhível. */
function TecnicaTabelaLinha({ def, escolhida, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-lg border transition-colors ${
      escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={escolhida}
          aria-label={`${escolhida ? "Remover" : "Escolher"} ${def.nome}`}
          title={escolhida ? "Remover" : "Escolher"}
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            escolhida
              ? "bg-purple-700 border-purple-600 text-white"
              : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhida ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span className="text-[12px] font-semibold truncate text-slate-100">{def.nome}</span>
        </button>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pl-[38px]">
          <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">{def.descricao}</p>
        </div>
      )}
    </div>
  );
}

/* Uma Técnica de Estilo Especial: nome, Motor livre e texto. Sem `comModo` no
   editor, porque nada do Estilo fica no ar sem o Domínio Simples imbuído. */
function EstiloEspecialCard({ linha, efeitosMotor, fontesDano, pericias, dslGrupos, onPatch, onRemove }) {
  return (
    <div className="rounded-lg border border-purple-900/50 bg-purple-950/10 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[160px]">
          <TextInput
            value={linha.nomeCru ?? ""}
            onChange={(v) => onPatch({ nome: v })}
            placeholder="Nome da Técnica de Estilo"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
          aria-label="Remover Técnica de Estilo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <TecnicaMotorEditor
        efeitos={efeitosMotor}
        onChange={(v) => onPatch({ efeitos: v })}
        pericias={pericias}
        fontesDano={fontesDano}
        dslGrupos={dslGrupos}
      />

      <div>
        <FieldLabel>Descrição</FieldLabel>
        <TextArea
          value={linha.descricao}
          onChange={(v) => onPatch({ descricao: v })}
          rows={2}
          placeholder="O que a Técnica de Estilo faz e qual Aptidão Amaldiçoada ela incorpora."
        />
      </div>
    </div>
  );
}

function EstiloSombrasCard({ draft, derived, toggleEstiloTabela, addEstiloEspecial, removeEstilo, patchEstilo }) {
  const info = derived.estilo;
  const fontesDano = fontesDanoDaFicha(draft, derived);
  const conhecidas = new Set(info.conhecidas.map((t) => t.id));
  const especiais = info.conhecidas.filter((t) => t.tipo === "especial");
  const dslGrupos = useDslGrupos(derived);

  return (
    <Card title="Estilo das Sombras" headerRight={<ContadorHabilidades derived={derived} />}>
      {!info.disponivel ? (
        <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
          <Lock className="w-4 h-4 mx-auto mb-2 text-slate-600" aria-hidden="true" />
          O Novo Estilo da Sombra destrava no Nível {info.ndMinimo}.
        </div>
      ) : (
        <>
          {info.avisos.map((a) => (
            <p key={a} className="text-[11px] text-amber-400 flex items-start gap-1 mb-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
              <span>{a}</span>
            </p>
          ))}

          <div className="space-y-1">
            {TECNICAS_TABELA.map((def) => (
              <TecnicaTabelaLinha
                key={def.id}
                def={def}
                escolhida={conhecidas.has(def.id)}
                onToggle={() => toggleEstiloTabela(def.id)}
              />
            ))}
          </div>

          {especiais.length > 0 && (
            <div className="space-y-3 mt-3">
              {especiais.map((t) => (
                <EstiloEspecialCard
                  key={t.id}
                  linha={t}
                  efeitosMotor={derived.estiloEfeitos?.[t.id] ?? []}
                  fontesDano={fontesDano}
                  pericias={derived.testes?.pericias}
                  dslGrupos={dslGrupos}
                  onPatch={(partial) => patchEstilo(t.id, partial)}
                  onRemove={() => removeEstilo(t.id)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={addEstiloEspecial}
              title={TEXTO_EFEITO_ESPECIAL}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50 transition-colors"
            >
              <Plus className="w-3 h-3" /> Técnica de Estilo Especial
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

/* Habilidades Marciais entram num incremento futuro. */
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

/* Motor de Automação do Funcionamento Básico: o DSL COMPLETO, todos os canais.
   Uma linha é `{ canal, alvo?, expr, quando?, duracao? }`, o shape inteiro que o
   `aplicarEfeitos` entende. Irmão do MotorEfeitosEditor das Ferramentas
   Amaldiçoadas, com duas diferenças: lá o pool de canais é o subconjunto do
   equipamento, aqui é tudo, e aqui existem `alvo` e `quando`.

   ⚠ Por que este é o único lugar do sistema em que o jogador ESCREVE efeito em
   vez de escolher de uma lista: a técnica amaldiçoada é única no mundo por
   definição, então não existe catálogo possível. Todo o resto (habilidade,
   talento, origem, aptidão) vem de catálogo e nunca deve virar campo livre.

   `efeitos` chega RESOLVIDO do deriveAfty (com `valor`, `ativo` e `alvoTipo`), e
   a edição devolve só o que é dado da ficha. */
/* Chrome do editor, COPIADO do AutomationBuilder da 2.5.2 (`selectCls` e o
   `Chevron` de lá). É cópia e não import porque `src/components/` é
   somente-leitura e aquelas constantes são locais do módulo: reproduzir as duas
   linhas mantém o visual idêntico sem tocar no arquivo da 2.5.2. Se o chrome de
   lá mudar, este é o ponto a acertar. */
const MOTOR_SELECT_CLS =
  "h-9 w-full bg-slate-950 border border-slate-700 rounded pl-2.5 pr-8 py-1.5 text-sm leading-tight text-white appearance-none focus:outline-none focus:border-purple-500";
const MotorChevron = () => (
  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
);

/* Seletor de CANAL: painel LARGO em colunas, não lista comprida.

   ⚠ Duas tentativas antes desta erraram, e o erro vale registrar. A primeira foi
   `<select>` chapado com 48 itens. A segunda agrupou e pôs a NOTA de cada canal
   embaixo do nome, o que deixou tudo PIOR: cada item virou três linhas, e a
   lista, que já era longa, dobrou de altura. Fora que nota na tela é justamente
   o que o builder não faz (nada de texto explicativo, só resultado e aviso).

   O problema nunca foi falta de explicação, era a forma: 48 itens empilhados
   num tubo de 300px. A solução é usar a LARGURA. Em três colunas, os 10 grupos
   cabem quase inteiros na tela de uma vez, e achar vira varrer com o olho em vez
   de rolar. Cada item é UMA linha, só o nome.

   A busca continua (filtra por nome, grupo e nota, sem acento), mas agora ela é
   atalho, não a única saída. Teclado: setas andam, Enter escolhe, Esc fecha. */
// Busca SEM acento dos dois lados. Sem isto, digitar "critico" não acha "Margem
// de Crítico", e ninguém digita acento numa caixa de busca.
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function CanalPicker({ value, onChange }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [cursor, setCursor] = useState(0);
  const atual = EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).find((c) => c.id === value);

  /* ⚠ O `hpAtributo` NASCEU PARA UM CASO DE ADDON (trocar o atributo do cálculo
     de PV), e quem não usa addon não tem por que vê-lo entre os 61 canais. Ele
     continua existindo no motor: o que some é a linha do seletor.

     ⚠ MAS SE A EXPRESSÃO JÁ USA O CANAL, ele aparece. Esconder o canal ESCOLHIDO
     deixaria o campo mostrando vazio com um efeito ativo por trás, que é pior
     que mostrar uma linha a mais. */
  const veHpAtributo = usePrimitiva("hpAtributo") || value === "hpAtributo";

  const termo = semAcento(busca.trim());
  const grupos = EFEITO_CANAL_GRUPOS
    .map((g) => ({
      label: g.label,
      itens: g.itens.filter((c) =>
        (veHpAtributo || c.id !== "hpAtributo")
        && (!termo
        || semAcento(c.label).includes(termo)
        || semAcento(g.label).includes(termo)
        || semAcento(c.nota).includes(termo))),
    }))
    .filter((g) => g.itens.length);
  const chapada = grupos.flatMap((g) => g.itens);

  const fechar = () => { setAberto(false); setBusca(""); setCursor(0); };
  const escolher = (id) => { onChange(id); fechar(); };
  const teclado = (e) => {
    if (e.key === "Escape") { e.preventDefault(); fechar(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => (chapada.length ? (c + passo + chapada.length) % chapada.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (chapada[cursor]) escolher(chapada[cursor].id);
    }
  };

  return (
    <div className="relative flex-shrink-0 min-w-[170px]">
      <button
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        className={`${MOTOR_SELECT_CLS} text-left truncate`}
        aria-label="Canal"
        aria-expanded={aberto}
      >
        {atual?.label ?? "escolher..."}
      </button>
      <MotorChevron />

      {aberto && (
        <>
          {/* Camada de fundo: clicar fora fecha, sem listener global. */}
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            onClick={fechar}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="absolute z-30 mt-1 w-[620px] max-w-[92vw] rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 overflow-hidden">
            <div className="p-1.5 border-b border-slate-800">
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setCursor(0); }}
                onKeyDown={teclado}
                placeholder="Buscar..."
                spellCheck={false}
                autoFocus
                className="w-full h-7 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            {/* Colunas de CSS, não grid: os grupos têm tamanhos diferentes e o
                `columns` empacota sozinho, sem buraco. `break-inside-avoid`
                impede um grupo de ser partido no meio entre duas colunas. */}
            <div className="max-h-[60vh] overflow-y-auto p-2 columns-2 sm:columns-3 gap-3">
              {chapada.length === 0 && (
                <p className="text-[11px] text-slate-500">Nenhum canal com esse termo.</p>
              )}
              {grupos.map((g) => (
                <div key={g.label} className="break-inside-avoid mb-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1 pb-0.5 border-b border-slate-800/80 mb-0.5">
                    {g.label}
                  </div>
                  {g.itens.map((c) => {
                    const idx = chapada.indexOf(c);
                    const sel = c.id === value;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => escolher(c.id)}
                        onMouseEnter={() => setCursor(idx)}
                        title={c.nota || undefined}
                        className={`block w-full text-left truncate rounded px-1 py-[3px] text-[11px] leading-tight transition-colors ${
                          sel ? "text-purple-300 font-semibold" : "text-slate-300"
                        } ${idx === cursor ? "bg-slate-800" : ""}`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* Seletor de VARIÁVEL do DSL, com o valor atual de cada uma ao lado.

   Autor, 2026-08-10: *"O DSL mostrando os valores e derivados não existe em
   nenhum lugar no Grimório Afty. Com eu precisando adivinhar o nome das
   variáveis."* Ele estava certo: o `docs/automacao-dsl.md` espelha só o fm-dsl
   da 2.5.2, e o Afty acrescenta a maior parte do vocabulário por fora dele.

   Mesmo desenho do CanalPicker (painel largo em colunas, busca sem acento,
   setas e Enter), com três diferenças que o vocabulário obrigou:

   1. cada linha traz o VALOR à direita, porque saber que `esc_lutador` existe
      não ajuda sem saber que ele vale 8 nesta criatura;
   2. as famílias grandes (`tem_*` são ~497) listam só o que NÃO é zero, e a
      busca alcança o resto. O cabeçalho mostra `visíveis de total`, então o que
      está escondido não fica invisível;
   3. clicar INSERE no ponto do cursor, em vez de trocar um valor. É o que mata
      o adivinhar: o nome nunca precisa ser digitado. */
function VariavelPicker({ grupos, onInserir, ancora = "esquerda" }) {
  /* ⚠ O `contar()` anda junto do grupo MARCAS, e não separado: quem monta o
     vocabulário já decidiu se esta criatura enxerga a primitiva, e amarrar a
     função à presença do grupo faz as duas aparecerem ou sumirem juntas, sem
     um segundo lugar para a regra envelhecer. */
  const temMarcas = grupos.some((g) => g.id === "marcas");
  const funcoes = temMarcas ? DSL_FUNCOES : DSL_FUNCOES.filter((f) => !f.nome.startsWith("contar"));
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [cursor, setCursor] = useState(0);

  const termo = semAcento(busca.trim());
  const visiveis = useMemo(() => {
    const out = [];
    for (const g of grupos) {
      const casam = termo
        ? g.itens.filter((v) => semAcento(v.nome).includes(termo)
          || semAcento(g.label).includes(termo)
          || semAcento(v.nota ?? "").includes(termo))
        // Sem busca, a família grande mostra só o que é verdade. As outras
        // mostram tudo: elas têm poucas linhas e o zero delas é informação
        // (saber que `bar` é 0 vale tanto quanto saber que `dom` é 3).
        : g.sobPedido ? g.itens.filter((v) => v.valor) : g.itens;
      if (casam.length) out.push({ ...g, itens: casam, total: g.itens.length });
    }
    return out;
  }, [grupos, termo]);

  const chapada = useMemo(() => visiveis.flatMap((g) => g.itens), [visiveis]);

  const fechar = () => { setAberto(false); setBusca(""); setCursor(0); };
  const escolher = (nome) => { onInserir(nome); fechar(); };

  const teclado = (e) => {
    if (e.key === "Escape") { e.preventDefault(); fechar(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => (chapada.length ? (c + passo + chapada.length) % chapada.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (chapada[cursor]) escolher(chapada[cursor].nome);
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        aria-label="Inserir variável"
        aria-expanded={aberto}
        title="Inserir variável"
        className="h-9 w-9 flex items-center justify-center rounded border border-slate-700 bg-slate-950 text-slate-400 hover:text-emerald-300 hover:border-emerald-700 transition-colors"
      >
        <Braces className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {aberto && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            onClick={fechar}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className={`absolute z-30 mt-1 w-[620px] max-w-[92vw] rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 overflow-hidden ${
            ancora === "direita" ? "right-0" : "left-0"
          }`}>
            <div className="p-1.5 border-b border-slate-800">
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setCursor(0); }}
                onKeyDown={teclado}
                placeholder="Buscar..."
                spellCheck={false}
                autoFocus
                className="w-full h-7 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 columns-1 sm:columns-2 gap-3">
              {chapada.length === 0 && (
                <p className="text-[11px] text-slate-500">Nenhuma variável com esse termo.</p>
              )}
              {visiveis.map((g) => (
                <div key={g.id} className="break-inside-avoid mb-2.5">
                  <div className="flex items-baseline gap-2 px-1 pb-0.5 border-b border-slate-800/80 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex-1 truncate">
                      {g.label}
                    </span>
                    {g.itens.length < g.total && (
                      <span className="text-[9px] font-mono tabular-nums text-slate-600">
                        {g.itens.length} de {g.total}
                      </span>
                    )}
                  </div>
                  {g.itens.map((v) => {
                    const idx = chapada.indexOf(v);
                    return (
                      <button
                        key={v.nome}
                        type="button"
                        onClick={() => escolher(v.nome)}
                        onMouseEnter={() => setCursor(idx)}
                        title={v.nota || undefined}
                        className={`flex w-full items-baseline gap-2 rounded px-1 py-[3px] text-left transition-colors ${
                          idx === cursor ? "bg-slate-800" : ""
                        }`}
                      >
                        <span className="flex-1 truncate font-mono text-[11px] leading-tight text-emerald-200">
                          {v.nome}
                        </span>
                        {/* Valor `null` é a variável de linha de dano, que só
                            existe dentro de um Feitiço fechado. Um traço diz
                            "existe, mas não aqui", e o zero mentiria. */}
                        <span className="font-mono text-[11px] tabular-nums text-slate-400 flex-shrink-0">
                          {v.valor == null ? "—" : v.valor}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {/* As funções entram no mesmo painel: elas são metade do que se
                  escreve numa expressão, e um segundo lugar para procurá-las
                  seria um lugar a mais para esquecer. */}
              <div className="break-inside-avoid mb-2.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1 pb-0.5 border-b border-slate-800/80 mb-0.5">
                  Funções
                </div>
                {funcoes.map((f) => (
                  <button
                    key={f.nome}
                    type="button"
                    onClick={() => escolher(f.insere)}
                    title={f.nota}
                    className="flex w-full items-baseline rounded px-1 py-[3px] text-left"
                  >
                    <span className="flex-1 truncate font-mono text-[11px] leading-tight text-sky-200">
                      {f.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* Campo de expressão do Motor: o input mais o seletor que INSERE no cursor.

   ⚠ A inserção respeita a seleção, e não empurra tudo para o fim: escrever
   `2 + ` e pedir `bt` tem de render `2 + bt`, com o cursor depois do `bt`. E uma
   função entra como `piso()` com o cursor DENTRO dos parênteses, que é onde o
   próximo caractere vai. */
function CampoExpressao({ value, onChange, invalida, placeholder, rotulo, grupos, ancora }) {
  const ref = useRef(null);

  const inserir = (texto) => {
    const campo = ref.current;
    const atual = value ?? "";
    const ini = campo?.selectionStart ?? atual.length;
    const fim = campo?.selectionEnd ?? atual.length;
    const novo = atual.slice(0, ini) + texto + atual.slice(fim);
    onChange(novo);
    // O cursor vai para DENTRO dos parênteses de uma função, e para depois do
    // nome de uma variável.
    const salto = texto.endsWith("()") ? texto.length - 1 : texto.length;
    requestAnimationFrame(() => {
      if (!campo) return;
      campo.focus();
      campo.setSelectionRange(ini + salto, ini + salto);
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={`w-full h-9 bg-slate-950 border rounded px-2 py-1.5 text-sm font-mono leading-tight text-emerald-200 focus:outline-none ${
          invalida ? "border-red-600 focus:border-red-500" : "border-slate-700 focus:border-purple-500"
        }`}
        aria-label={rotulo}
      />
      <VariavelPicker grupos={grupos} onInserir={inserir} ancora={ancora} />
    </div>
  );
}

/* Os conectores que fazem a linha do Motor se ler como frase. Não são
   explicação: são o que identifica cada campo sem virar rótulo empilhado. */
const Conector = ({ children }) => (
  <span className="text-[11px] text-slate-500 flex-shrink-0 select-none">{children}</span>
);

/* O vocabulário agrupado, memoizado pela IDENTIDADE do contexto.

   ⚠ Ele vive nos donos do `derived`, e não dentro do TecnicaMotorEditor: um
   Feitiço Passivo por card e uma Técnica de Estilo Especial por card fariam a
   varredura das ~663 chaves rodar uma vez por card, sempre com a mesma resposta.
   O `contextoDsl` só troca de identidade quando o `deriveAfty` roda de novo. */
function useDslGrupos(derived) {
  const ctx = derived?.contextoDsl;
  const extras = derived?.combate?.estadosExtras;
  // O grupo Marcas é de Addon. Ver `ui/usar-primitiva.js`.
  const contar = usePrimitiva("contar");
  return useMemo(() => vocabularioDsl(ctx, extras, { contar }), [ctx, extras, contar]);
}

const ALVO_OPCOES_BASE = {
  atributo: AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label })),
  tr: AFTY_RESISTENCIAS.map((r) => ({ value: r.value, label: r.label })),
  ataque: AFTY_ATAQUES.map((a) => ({ value: a.id, label: a.nome })),
  manobra: AFTY_MANOBRAS.map((m) => ({ value: m.id, label: m.nome })),
  trilha: APTIDAO_TRILHAS.map((t) => ({ value: t.key, label: t.label })),
};

function alvoOpcoes(tipo, pericias = AFTY_PERICIAS, fontesDano = []) {
  if (tipo === "pericia") return pericias.map((p) => ({ value: p.id, label: p.nome }));
  if (tipo === "fonteDano") return fontesDano;
  if (tipo === "fonteCura") return FONTES_CURA.map((f) => ({ value: f.id, label: f.nome }));
  return ALVO_OPCOES_BASE[tipo] ?? null;
}

/* Destinos dos canais de dano escritos pelo jogador.

   O Motor já entende todos estes escopos em `escoposDaArma` e nos Feitiços,
   mas o editor oferecia somente as linhas concretas que algum chamador
   lembrasse de passar. Quando a lista não era passada, sobrava apenas a opção
   vazia "todos". A lista fica centralizada aqui para Funcionamentos Básicos,
   Passivos, Técnicas de Estilo e Habilidades Únicas enxergarem o mesmo guia. */
function fontesDanoDaFicha(draft, derived) {
  const feiticos = Array.isArray(draft?.feiticos) ? draft.feiticos : [];
  const opcoes = [
    { value: "basico", label: "Ataque Básico" },
    { value: "arma", label: "Todas as Armas" },
    ...ARMA_CATEGORIAS.map((c) => ({ value: `cat:${c.value}`, label: `Armas: ${c.label}` })),
    ...ARMA_GRUPOS.map((g) => ({ value: `grupo:${g.value}`, label: `Grupo: ${g.label}` })),
    ...ARMA_PROPRIEDADES
      .filter((p) => p.id !== "especial")
      .map((p) => ({ value: `prop:${p.id}`, label: `Propriedade: ${p.nome}` })),
    ...Object.entries(TIPOS_DANO).map(([id, label]) => ({ value: `tipo:${id}`, label: `Dano: ${label}` })),
    { value: "feitico", label: "Todos os Feitiços de Dano" },
    { value: "feitico:unico", label: "Feitiços de Alvo Único" },
    { value: "feitico:area", label: "Feitiços em Área" },
    ...feiticos
      .filter((f) => f?.tipo === "dano")
      .map((f) => ({ value: `feitico:${f.id}`, label: f.nome || "Feitiço Sem Nome" })),
    ...(derived?.dano?.entradas ?? []).map((e) => ({ value: e.id, label: e.nome })),
  ];
  const vistos = new Set();
  return opcoes.filter((o) => {
    if (!o.value || vistos.has(o.value)) return false;
    vistos.add(o.value);
    return true;
  });
}

/* `comModo` liga a coluna Passiva / Ativa, que só as fontes do POOL EXCLUSIVO
   com decisão por linha usam (Habilidade Única, Técnica de Estilo Especial).
   Passiva vale sempre; ativa só com o interruptor ligado na bancada de
   Simulação de Combate. Quem não passa a prop nunca grava o campo.

   ⚠ A LINHA VIROU FRASE em 2026-08-10. Autor: *"A Aparência ficou muito pouco
   intuitiva."* Estava: duas fileiras de controles sem rótulo nenhum, em que o
   campo de VALOR e o de CONDIÇÃO eram caixas idênticas lado a lado, e nada dizia
   qual era qual sem clicar. Agora ela se lê da esquerda para a direita:

     [Defesa] em [todos] vale [2 + piso(bt/2)] = +4
     enquanto [surto_adrenalina] e dura [Permanente]

   Os conectores não são texto explicativo: eles são o que IDENTIFICA cada campo,
   e um rótulo empilhado em cima de cada controle dobraria a altura da linha, que
   é exatamente o erro que a nota de canal cometeu ("Você PIOROU"). */
function TecnicaMotorEditor({
  efeitos, onChange, pericias, fontesDano = [], comModo = false, dslGrupos = [],
  titulo = "Motor de Automação", simplificarTamanho = false,
}) {
  const lista = Array.isArray(efeitos) ? efeitos : [];
  // Devolve só os campos de DADO, nunca os resolvidos: `valor` e `ativo` são
  // derivados, e gravá-los deixaria a ficha mentindo no próximo render.
  const bruto = () => lista.map((e) => ({
    canal: e.canal, ...(e.alvo ? { alvo: e.alvo } : {}), expr: e.expr,
    ...(e.quando ? { quando: e.quando } : {}),
    ...(e.duracao === "temporaria" ? { duracao: "temporaria" } : {}),
    ...(comModo ? { modo: e.modo === "ativa" ? "ativa" : "passiva" } : {}),
  }));
  const add = () => onChange([...bruto(), {
    canal: "defesa", expr: "", ...(comModo ? { modo: "passiva" } : {}),
  }]);
  const remove = (i) => onChange(bruto().filter((_, idx) => idx !== i));
  const patch = (i, partial) => onChange(bruto().map((e, idx) => {
    if (idx !== i) return e;
    const next = { ...e, ...partial };
    // Trocar de canal invalida o alvo antigo: o vocabulário é outro.
    if (partial.canal !== undefined) {
      delete next.alvo;
      // Em Passivo/Característica, tamanho é uma escolha permanente direta.
      if (simplificarTamanho && partial.canal === "tamanho") {
        next.expr = "1";
        delete next.quando;
        delete next.duracao;
      }
    }
    return next;
  }));

  const ativos = lista.filter((e) => e.ativo && e.expr).length;

  return (
    <div className="mt-3 pt-3 border-t border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-emerald-300">{titulo}</span>
        {lista.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-slate-500 tabular-nums">
            {ativos} de {lista.length} ativos
          </span>
        )}
      </div>

      <div className="space-y-2">
        {lista.map((ef, i) => {
          const chk = validateExpression(ef.expr || "");
          const exprRuim = ef.expr && !chk.ok;
          const chkQuando = ef.quando ? validateExpression(ef.quando) : { ok: true };
          const quandoRuim = ef.quando && !chkQuando.ok;
          const alvos = ef.alvoTipo ? alvoOpcoes(ef.alvoTipo, pericias, fontesDano) : null;
          const tamanhoSimples = simplificarTamanho && ef.canal === "tamanho";
          const tamanhoValor = Math.trunc(Number(ef.expr) || 1);
          const tamanhoDirecao = tamanhoValor < 0 ? -1 : 1;
          const tamanhoPassos = Math.min(3, Math.max(1, Math.abs(tamanhoValor)));
          return (
            <div key={i} className="rounded border border-slate-800 bg-slate-950/50 p-2 space-y-2">
              {/* ---- O QUE o efeito é, e quanto ele VALE ---- */}
              <div className="flex flex-wrap items-center gap-2">
                <CanalPicker value={ef.canal} onChange={(v) => patch(i, { canal: v })} />

                {alvos && (
                  <>
                    <Conector>em</Conector>
                    <div className="relative flex-shrink-0 min-w-[130px]">
                      <select
                        value={ef.alvo}
                        onChange={(e) => patch(i, { alvo: e.target.value })}
                        className={MOTOR_SELECT_CLS}
                        aria-label="Alvo"
                      >
                        <option value="">todos</option>
                        {alvos.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <MotorChevron />
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
                  aria-label="Remover efeito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {tamanhoSimples ? (
                <div className="rounded-lg border border-purple-900/50 bg-purple-950/20 p-2.5 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Mudança</span>
                    {[
                      { valor: -1, label: "Diminuir" },
                      { valor: 1, label: "Aumentar" },
                    ].map((opcao) => (
                      <button
                        key={opcao.valor}
                        type="button"
                        onClick={() => patch(i, { expr: String(opcao.valor * tamanhoPassos), quando: "", duracao: "permanente" })}
                        aria-pressed={tamanhoDirecao === opcao.valor}
                        className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                          tamanhoDirecao === opcao.valor
                            ? "border-purple-500 bg-purple-700 text-white"
                            : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {opcao.label}
                      </button>
                    ))}
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">Categorias</span>
                    {[1, 2, 3].map((passos) => (
                      <button
                        key={passos}
                        type="button"
                        onClick={() => patch(i, { expr: String(tamanhoDirecao * passos), quando: "", duracao: "permanente" })}
                        aria-pressed={tamanhoPassos === passos}
                        className={`h-7 min-w-7 rounded-md border px-2 text-[11px] font-bold transition-colors ${
                          tamanhoPassos === passos
                            ? "border-purple-500 bg-purple-700 text-white"
                            : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {passos}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
              <div className="flex flex-wrap items-center gap-2">
                <Conector>vale</Conector>
                <CampoExpressao
                  value={ef.expr}
                  onChange={(v) => patch(i, { expr: v })}
                  invalida={!!exprRuim}
                  placeholder="2 + piso(bt / 2)"
                  rotulo="Expressão"
                  grupos={dslGrupos}
                />
                {/* Prévia do valor, no lugar em que a 2.5.2 a mostra: colada na
                    expressão, não numa linha própria. */}
                <span
                  className={`font-mono text-sm tabular-nums flex-shrink-0 w-10 text-right ${
                    ef.ativo ? "text-emerald-300" : "text-slate-600"
                  }`}
                  title={ef.expr && !exprRuim && !ef.ativo
                    ? "A condição é falsa agora, então este efeito não entra na conta"
                    : undefined}
                >
                  {ef.expr && !exprRuim && ef.valor != null
                    ? `${ef.valor >= 0 ? "+" : "−"}${Math.abs(ef.valor)}`
                    : ""}
                </span>
              </div>

              {/* ---- QUANDO ele vale, e por quanto tempo ---- */}
              <div className="flex flex-wrap items-center gap-2">
                <Conector>enquanto</Conector>
                <CampoExpressao
                  value={ef.quando}
                  onChange={(v) => patch(i, { quando: v })}
                  invalida={!!quandoRuim}
                  placeholder="sempre"
                  rotulo="Condição"
                  grupos={dslGrupos}
                  ancora="direita"
                />
                {/* O espaçador espelha a largura da prévia do valor, para as duas
                    caixas de expressão ficarem alinhadas uma sob a outra. */}
                <span className="w-10 flex-shrink-0" aria-hidden="true" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Conector>e dura</Conector>
                <div className="relative flex-shrink-0 min-w-[150px]">
                  <select
                    value={ef.duracao}
                    onChange={(e) => patch(i, { duracao: e.target.value })}
                    className={MOTOR_SELECT_CLS}
                    aria-label="Duração"
                  >
                    <option value="permanente">Permanente</option>
                    <option value="temporaria">Temporária</option>
                  </select>
                  <MotorChevron />
                </div>
                {comModo && (
                  <>
                    <Conector>e é</Conector>
                    <div className="relative flex-shrink-0 min-w-[130px]">
                      <select
                        value={ef.modo === "ativa" ? "ativa" : "passiva"}
                        onChange={(e) => patch(i, { modo: e.target.value })}
                        className={MOTOR_SELECT_CLS}
                        aria-label="Modo"
                      >
                        <option value="passiva">Passiva</option>
                        <option value="ativa">Ativa</option>
                      </select>
                      <MotorChevron />
                    </div>
                  </>
                )}
              </div>
                </>
              )}

              {!tamanhoSimples && (exprRuim || quandoRuim) && (
                <p className="text-[10px] text-red-400 mt-1">
                  {exprRuim ? chk.error : `Condição: ${chkQuando.error}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 mt-2 text-xs font-semibold px-2 py-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-transparent transition-colors"
      >
        <Plus className="w-3 h-3" /> Adicionar efeito
      </button>
    </div>
  );
}

/* Caixa de texto longo: cresce sozinha com o conteúdo até um teto, e daí rola
   por dentro. O botão do canto tira o teto e devolve.

   ⚠ Existe por causa do Funcionamento Básico, que o autor descreve como "tanto
   coisas pequenas de 1 parágrafo quanto habilidades com 3 páginas" (2026-08-03).
   Um `rows` fixo serve mal aos dois extremos de uma vez: 4 linhas desperdiçam
   meia tela no caso curto e escondem 95% do texto no caso longo. O `resize-y`
   que o TextArea da 2.5.2 traz continua sendo trabalho manual, e repetido a cada
   ficha.

   A altura é medida a cada mudança de valor, e não a cada tecla, porque uma
   ficha carregada de fora (ou o botão de expandir) também muda o tamanho. */
/* ⚠ O `TextoRico` MUDOU DE CASA em 2026-08-08: foi para `ui/TextoRico.jsx`,
   porque a Ficha Final passou a exibir o Funcionamento Básico e as duas telas
   precisam do MESMO renderizador. Duas cópias divergiriam na primeira marcação
   nova, e o jogador leria na mesa algo diferente do que o autor escreveu.

   Ficou daquele lado também o `trechosEmNos`. Aqui só sobrou o que é do
   CRIADOR: a barra de formatação e a caixa de edição. */
/* Barra de formatação. Escreve a MARCAÇÃO no texto e devolve o cursor ao lugar,
   que é o que separa isto de mandar o jogador digitar os asteriscos à mão. */
function BarraFormatacao({ onAplicar, onTitulo, onTabela, previa, onPrevia }) {
  const botao = (previaOff) => `w-7 h-7 rounded text-[12px] flex items-center justify-center transition-colors ${
    previaOff ? "text-slate-700 cursor-not-allowed" : "text-slate-400 hover:text-white hover:bg-slate-800"
  }`;
  return (
    <div className="flex items-center gap-0.5 mb-1">
      {MARCADORES.map((m) => (
        <button
          key={m.chave}
          type="button"
          onClick={() => onAplicar(m.marca)}
          disabled={previa}
          title={`${m.label} (${m.marca}texto${m.marca})`}
          aria-label={m.label}
          className={`${botao(previa)} ${
            m.chave === "negrito" ? "font-bold"
              : m.chave === "italico" ? "italic font-serif"
              : m.chave === "sublinhado" ? "underline"
              : "line-through"
          }`}
        >
          {m.atalho}
        </button>
      ))}
      <span className="w-px h-4 bg-slate-800 mx-1" aria-hidden="true" />
      {/* Título age na LINHA do cursor, não na seleção. A ordem aqui é a de
          leitura (1 antes de 2), ao contrário do catálogo, que ordena por
          comprimento de prefixo. */}
      {[...TITULOS].sort((a, b) => a.nivel - b.nivel).map((t) => (
        <button
          key={t.nivel}
          type="button"
          onClick={() => onTitulo(t.nivel)}
          disabled={previa}
          title={`${t.label} (${t.prefixo}no começo da linha)`}
          aria-label={t.label}
          className={`${botao(previa)} font-bold ${t.nivel === 2 ? "text-[10px]" : ""}`}
        >
          {t.atalho}
        </button>
      ))}
      <button
        type="button"
        onClick={onTabela}
        disabled={previa}
        title="Tabela (cabeçalho, separadora e uma linha)"
        aria-label="Inserir tabela"
        className={botao(previa)}
      >
        <Table className="w-3.5 h-3.5" />
      </button>
      <span className="w-px h-4 bg-slate-800 mx-1" aria-hidden="true" />
      <button
        type="button"
        onClick={() => onPrevia(!previa)}
        aria-pressed={previa}
        title={previa ? "Voltar a editar" : "Ver o texto formatado"}
        aria-label={previa ? "Voltar a editar" : "Ver o texto formatado"}
        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
          previa ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const temTexto = (v) => !!String(v ?? "").trim();

function TextoLongo({ value, onChange, placeholder, minRows = 4, maxRows = 18, formatacao = false }) {
  const ref = useRef(null);
  const [expandido, setExpandido] = useState(false);
  const [rolando, setRolando] = useState(false);
  // ⚠ A PRÉVIA COMEÇA LIGADA quando já existe texto (autor, 2026-08-08): o que
  // se faz com um Funcionamento Básico pronto é LER, e só de vez em quando
  // editar. Campo vazio começa desligado, porque não há o que ver e a caixa de
  // edição é o que ele precisa.
  const [previa, setPrevia] = useState(() => formatacao && temTexto(value));
  // O jogador já mexeu no olho? Depois que ele decide, a decisão dele manda e o
  // ajuste automático abaixo sai de cena.
  const decidiu = useRef(false);
  const trocaPrevia = (v) => { decidiu.current = true; setPrevia(v); };
  // A seleção nova só pode ser aplicada DEPOIS de o React repintar o valor, por
  // isso ela fica pendurada aqui e o efeito abaixo a devolve ao campo.
  const selPendente = useRef(null);
  // A última altura medida da caixa de edição. A prévia a reaproveita para o
  // bloco não pular de tamanho na ida e na volta: são o mesmo texto, e uma
  // caixa que encolhe ao trocar de modo parece bug.
  //
  // ⚠ ESTADO, e não ref: a prévia LÊ este valor durante o render, e ler
  // `ref.current` no render é justamente o que o `react-hooks/refs` proíbe (o
  // valor mudaria sem repintar). O efeito grava o mesmo número a cada medida, e
  // o React descarta o set idêntico, então não há laço.
  const [altura, setAltura] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // O `auto` zera a altura para o scrollHeight refletir só o conteúdo: sem
    // isso a caixa cresce e nunca encolhe ao apagar texto.
    el.style.height = "auto";
    const linha = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const respiro = el.offsetHeight - el.clientHeight + 16;   // bordas + padding
    const min = linha * minRows + respiro;
    const teto = expandido ? Infinity : linha * maxRows + respiro;
    const alvo = Math.max(min, Math.min(el.scrollHeight + respiro, teto));
    el.style.height = `${alvo}px`;
    setAltura(alvo);
    setRolando(el.scrollHeight + respiro > teto);
  }, [value, expandido, minRows, maxRows, previa]);

  useLayoutEffect(() => {
    const el = ref.current;
    const sel = selPendente.current;
    if (!el || !sel) return;
    selPendente.current = null;
    el.focus();
    el.setSelectionRange(sel.ini, sel.fim);
  }, [value]);

  // O texto pode CHEGAR depois da montagem: o rascunho automático restaura a
  // ficha sozinho, e importar um JSON também troca o valor com o campo já na
  // tela. Sem isto o campo montaria vazio (prévia desligada) e ficaria assim
  // mesmo depois de encher.
  //
  // ⚠ Só age enquanto o campo NÃO está em foco e enquanto o jogador não mexeu
  // no olho. Sem a guarda de foco, digitar a primeira letra num campo vazio
  // atiraria a prévia por cima de quem está escrevendo.
  useEffect(() => {
    if (!formatacao || decidiu.current) return;
    if (ref.current && ref.current === document.activeElement) return;
    setPrevia(temTexto(value));
  }, [value, formatacao]);

  // As duas escrevem no texto e devolvem a seleção nova pelo mesmo caminho: só
  // muda qual transformação do afty-texto-rico.js roda.
  const comSelecao = (fn) => {
    const el = ref.current;
    if (!el) return;
    const r = fn(value || "", el.selectionStart, el.selectionEnd);
    selPendente.current = { ini: r.ini, fim: r.fim };
    onChange(r.texto);
  };
  const aplicar = (marca) => comSelecao((t, i, f) => alternarMarcador(t, i, f, marca));
  const titulo = (nivel) => comSelecao((t, i, f) => alternarTitulo(t, i, f, nivel));
  const tabela = () => comSelecao(inserirTabela);

  // Ctrl+B / Ctrl+I / Ctrl+U, que é o que a mão já espera de uma caixa de texto.
  const teclado = (e) => {
    if (!formatacao || !(e.ctrlKey || e.metaKey)) return;
    const m = MARCADORES.find((x) => x.atalho.toLowerCase() === e.key.toLowerCase());
    if (!m || m.chave === "riscado") return;   // Ctrl+S é salvar, e não riscado
    e.preventDefault();
    aplicar(m.marca);
  };

  return (
    <div>
      {formatacao && (
        <BarraFormatacao
          onAplicar={aplicar}
          onTitulo={titulo}
          onTabela={tabela}
          previa={previa}
          onPrevia={trocaPrevia}
        />
      )}
      <div className="relative">
        {previa ? (
          <div
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pb-7 text-sm leading-relaxed text-slate-300 overflow-auto"
            style={altura ? { minHeight: `${altura}px` } : undefined}
          >
            {value
              ? <TextoRico texto={value} />
              : <span className="text-slate-600">{placeholder}</span>}
          </div>
        ) : (
          <textarea
            ref={ref}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={teclado}
            placeholder={placeholder}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 pb-7 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-colors"
          />
        )}
        {/* Só aparece quando há o que revelar: um botão que não faz nada é pior
            que botão nenhum. */}
        {(rolando || expandido) && !previa && (
          <button
            type="button"
            onClick={() => setExpandido((e) => !e)}
            aria-expanded={expandido}
            title={expandido ? "Recolher" : "Expandir"}
            aria-label={expandido ? "Recolher o texto" : "Expandir o texto"}
            className="absolute bottom-1.5 right-2 flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expandido ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/* Perfil Amaldiçoado: o Atributo da Técnica (É `core.tecnicaAttr`, o mesmo que
   dirige a CD) e o Funcionamento Básico.

   ⚠ REDESENHADO em 2026-07-29 (o autor chamou o anterior de "bem feio"). O que
   estava errado, e vale para qualquer card novo:
     • grid de 2 colunas com um Select à esquerda e uma caixa de stat à direita
       presa por `justify-end`, então as duas nunca alinhavam de altura;
     • a CD trazia a fórmula escrita embaixo ("10 + escala do Tipo + mod de X +
       Maestria"), que é justamente o texto explicativo que o builder não usa. O
       lugar disso é o hover de fontes, que já existe (`derived.partes.cd`);
     • o Atributo da Técnica aparecia AQUI e em Informações, os dois escrevendo o
       mesmo campo. Ficou só aqui.

   ⚠ SEGUNDA PASSADA em 2026-08-03 (autor). O Atributo da Técnica subiu para o
   cabeçalho do card e a caixa de CD de Feitiçaria SAIU: a CD já está no Preview,
   ao lado, e repeti-la aqui gastava a largura da primeira linha inteira para
   dizer duas coisas que cabem no cabeçalho. Com isso o corpo do card ficou
   inteiro para o Funcionamento Básico e o Motor de Automação, que são o que a
   pessoa vem editar aqui.

   O Funcionamento Básico deixou de ser só texto: ele tem o Motor de Automação
   completo, porque a técnica é única no mundo e nenhum catálogo pode cobri-la. */
/* Um Funcionamento Básico ADICIONAL: nome, texto e o Motor livre.

   ⚠ REDESENHADO em 2026-08-12, na mesma hora em que nasceu. A primeira versão
   era um cartão roxo aninhado, copiado do EstiloEspecialCard, e o autor a chamou
   de "extremamente feio": ele não é um sub-item do principal, é um IRMÃO dele
   (os Seis Olhos não são nota de rodapé do Ilimitado). Aninhar em caixa própria
   dava três larguras diferentes dentro do mesmo card e deixava a caixa de texto
   e o Motor mais estreitos do que os de cima.

   Agora ele repete a estrutura do principal na MESMA largura: rótulo, texto com
   formatação e Motor. A única diferença é que o rótulo do principal é fixo
   (ele É a técnica) e aqui ele é um campo, porque só o adicional tem nome. O
   divisor de cima é mais forte que o divisor interno do Motor, senão os dois
   cortes teriam o mesmo peso e a leitura perderia a hierarquia.

   ⚠ O campo do nome lê `nomeCru`, e NÃO `nome`. Ver funcionamentosDaFicha: o
   aparado não aceita espaço enquanto se digita.

   A descrição usa o `TextoLongo` com formatação, e não o `TextArea` do Estilo,
   pela mesma razão: ele é irmão do principal, então ganha título, tabela e
   negrito igual. */
function FuncionamentoAdicionalCard({ linha, efeitosMotor, pericias, fontesDano, dslGrupos, onPatch, onRemove }) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-700">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <TextInput
            value={linha.nomeCru ?? ""}
            onChange={(v) => onPatch({ nome: v })}
            placeholder="Nome do Funcionamento Básico"
            aria-label="Nome do Funcionamento Básico"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center w-9 h-9 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
          aria-label="Remover Funcionamento Básico"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <TextoLongo
        value={linha.descricao}
        onChange={(v) => onPatch({ descricao: v })}
        placeholder="O que este Funcionamento Básico faz, seus limites e o que ele concede."
        formatacao
      />

      <TecnicaMotorEditor
        efeitos={efeitosMotor}
        onChange={(v) => onPatch({ efeitos: v })}
        pericias={pericias}
        fontesDano={fontesDano}
        dslGrupos={dslGrupos}
      />
    </div>
  );
}

function PerfilAmaldicoadoCard({
  draft, derived, patchCore, addFuncionamento, removeFuncionamento, patchFuncionamento,
}) {
  const dslGrupos = useDslGrupos(derived);
  const fontesDano = fontesDanoDaFicha(draft, derived);
  // O principal sai da lista: ele já tem o bloco fixo acima, com os campos que
  // moram direto no `core`.
  const adicionais = funcionamentosDaFicha(draft).filter((f) => !f.principal);
  return (
    <Card
      title="Perfil Amaldiçoado"
      headerRight={
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Atributo da Técnica
          </span>
          <div className="w-40">
            <Select
              value={draft.core.tecnicaAttr}
              onChange={(v) => patchCore({ tecnicaAttr: v })}
              options={AFTY_TECNICA_ATTRS}
              aria-label="Atributo da Técnica"
            />
          </div>
        </div>
      }
    >
      <FieldLabel>Funcionamento Básico</FieldLabel>
      <TextoLongo
        value={draft.core.tecnicaDescricao}
        onChange={(v) => patchCore({ tecnicaDescricao: v })}
        placeholder="Descreva o núcleo da técnica: o que ela faz, seus limites e o que ela concede (equipamentos, elemento, mecânicas próprias...)."
        formatacao
      />
      <TecnicaMotorEditor
        efeitos={derived.tecnicaEfeitos}
        onChange={(v) => patchCore({ tecnicaEfeitos: v })}
        pericias={derived.testes?.pericias}
        fontesDano={fontesDano}
        dslGrupos={dslGrupos}
      />

      {/* Sem div de agrupamento: cada adicional já traz o próprio `mt-4 pt-4
          border-t`, e o redesenho de 2026-08-12 quer os irmãos na MESMA largura
          do principal. O `fontesDano` veio do commit do colaborador. */}
      {adicionais.map((f) => (
        <FuncionamentoAdicionalCard
          key={f.id}
          linha={f}
          efeitosMotor={derived.funcionamentoEfeitos?.[f.id] ?? []}
          pericias={derived.testes?.pericias}
          fontesDano={fontesDano}
          dslGrupos={dslGrupos}
          onPatch={(partial) => patchFuncionamento(f.id, partial)}
          onRemove={() => removeFuncionamento(f.id)}
        />
      ))}

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={addFuncionamento}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50 transition-colors"
        >
          <Plus className="w-3 h-3" /> Funcionamento Básico
        </button>
      </div>
    </Card>
  );
}

/* Card dos Feitiços: orçamento no cabeçalho + lista de entradas criadas. */
function FeiticosCard({ draft, derived, addFeitico, removeFeitico, patchFeitico, duplicarFeitico, setReducoesCustoFeitico }) {
  const lista = Array.isArray(draft.feiticos) ? draft.feiticos : [];
  const feiticosBase = lista.filter((feitico) => !feitico.variacaoDe);
  const dslGrupos = useDslGrupos(derived);
  const { nivelMax } = derived.feiticos;
  const habilidades = derived.habilidades?.escolhidas ?? [];
  const temDominancia = habilidades.includes("cnj_dominancia_em_feitico");
  const temManipulacao = habilidades.includes("cnj_manipulacao_perfeita");
  const limiteManipulacao = Math.max(0, derived.maestria ?? 0);
  const reducoes = draft.reducoesCustoFeitico && typeof draft.reducoesCustoFeitico === "object"
    ? draft.reducoesCustoFeitico
    : { dominancia: null, manipulacao: [] };
  const idsBase = new Set(feiticosBase.map((feitico) => feitico.id));
  const dominancia = idsBase.has(reducoes.dominancia) ? reducoes.dominancia : null;
  const manipulacao = Array.isArray(reducoes.manipulacao)
    ? [...new Set(reducoes.manipulacao)].filter((id) => idsBase.has(id)).slice(0, limiteManipulacao)
    : [];
  const alternarDominancia = (id) => setReducoesCustoFeitico({
    ...reducoes,
    dominancia: dominancia === id ? null : id,
    manipulacao,
  });
  const alternarManipulacao = (id) => {
    const escolhida = manipulacao.includes(id);
    if (!escolhida && manipulacao.length >= limiteManipulacao) return;
    setReducoesCustoFeitico({
      ...reducoes,
      dominancia,
      manipulacao: escolhida
        ? manipulacao.filter((feiticoId) => feiticoId !== id)
        : [...manipulacao, id],
    });
  };
  const fontesDano = fontesDanoDaFicha(draft, derived);
  const ctx = {
    nd: derived.nd,
    nivelConjurador: derived.feiticos.nivelConjurador,
    cdBase: derived.feiticos.cdBase,
    modTecnica: derived.modTecnica,
    efeitos: derived.efeitos,
    efeitosLinhaDano: derived.motorLinhaDano?.efeitos ?? [],
    contextoDsl: derived.motorLinhaDano?.contexto ?? {},
    habilidades: derived.habilidades?.escolhidas ?? [],
    bonusTreinamento: derived.maestria,
    beneficiosRitualDominio: derived.dominios?.beneficiosRitualAtivos ?? {},
    reducoesCustoFeitico: reducoes,
    feiticos: lista,
    temEnergiaReversa: Array.isArray(draft.aptidoesAmaldicoadas) && draft.aptidoesAmaldicoadas.includes("energia_reversa"),
    invocacoes: Array.isArray(draft.invocacoes) ? draft.invocacoes : [],
    /* ⚠ O CÁLCULO do Shikigami usa a lista CRUA acima (só precisa de id, nome e
       grau, e ler a resolvida criaria ciclo: a invocação depende do Feitiço para
       o custo). Esta aqui é só para a TELA mostrar o que a invocação virou, sem
       obrigar a pessoa a trocar de aba para ver o PV do próprio shikigami. */
    invocacoesResolvidas: derived.invocacoes?.lista ?? [],
  };

  // `dados_dano_final` pertence a uma linha concreta, por isso o preview do
  // editor só pode resolvê-lo quando o Passivo aponta para um Feitiço
  // específico. O alvo geral continua ativo, mas não possui um único número
  // correto para mostrar.
  const dadosDanoPorFeitico = Object.fromEntries(
    lista
      .filter((f) => f.tipo === "dano")
      .map((f) => [f.id, calcularFeiticoDano(f, ctx).dadosDanoFinal]),
  );
  const nivelPorFeitico = Object.fromEntries(
    lista.filter((f) => f.tipo === "dano").map((f) => [f.id, f.nivel === "max" ? 6 : f.nivel]),
  );
  const efeitosPassivoComPreview = (feitico) =>
    (derived.passivosEfeitos?.[feitico.id] ?? []).map((efeito) => {
      if (!efeitoUsaDadosDanoFinal(efeito)) return efeito;
      const alvo = String(efeito.alvo ?? "");
      if (!alvo.startsWith("feitico:")) return { ...efeito, valor: null };
      const dados = dadosDanoPorFeitico[alvo.slice("feitico:".length)];
      if (!Number.isFinite(dados)) return { ...efeito, valor: null };
      const contexto = {
        ...(derived.motorLinhaDano?.contexto ?? {}),
        [VAR_DADOS_DANO_FINAL]: dados,
        [VAR_NIVEL_FEITICO]: nivelPorFeitico[alvo.slice("feitico:".length)] ?? 0,
      };
      return {
        ...efeito,
        valor: evalNumberDsl(efeito.expr, contexto, 0),
        ativo: !efeito.quando || evalNumberDsl(String(efeito.quando), contexto, 0) !== 0,
      };
    });
  return (
    <Card title="Feitiços" headerRight={<ContadorHabilidades derived={derived} />}>
      {(temDominancia || temManipulacao) && feiticosBase.length > 0 && (
        <div className="mb-3 space-y-2 border-b border-slate-800 pb-3">
          {temDominancia && (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                <span>Dominância em Feitiço</span>
                <span className="font-mono">{dominancia ? 1 : 0}/1</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {feiticosBase.map((feitico) => (
                  <BoolChip
                    key={feitico.id}
                    ativo={dominancia === feitico.id}
                    onToggle={() => alternarDominancia(feitico.id)}
                  >
                    {feitico.nome || "Feitiço Sem Nome"}
                  </BoolChip>
                ))}
              </div>
            </div>
          )}
          {temManipulacao && (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                <span>Manipulação Perfeita</span>
                <span className="font-mono">{manipulacao.length}/{limiteManipulacao}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {feiticosBase.map((feitico) => (
                  <BoolChip
                    key={feitico.id}
                    ativo={manipulacao.includes(feitico.id)}
                    bloqueado={!manipulacao.includes(feitico.id) && manipulacao.length >= limiteManipulacao}
                    onToggle={() => alternarManipulacao(feitico.id)}
                  >
                    {feitico.nome || "Feitiço Sem Nome"}
                  </BoolChip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
            efeitosPassivo={efeitosPassivoComPreview(f)}
            fontesDano={fontesDano}
            dslGrupos={dslGrupos}
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
function FeiticoCard({ feitico, ctx, nivelMax, efeitosPassivo, fontesDano, dslGrupos, onPatch, onRemove, onDuplicate }) {
  const [open, setOpen] = useState(!feitico.nome);
  const [confirmDel, setConfirmDel] = useState(false);
  const calculoBase = feitico.tipo === "dano" ? calcularFeiticoDano(feitico, ctx)
    : feitico.tipo === "auxiliar" ? calcularFeiticoAuxiliar(feitico, ctx)
    : feitico.tipo === "curativo" ? calcularFeiticoCurativo(feitico, ctx)
    : feitico.tipo === "especial" ? calcularFeiticoEspecial(feitico, ctx)
    : null;
  const calc = aplicaReducoesCustoFeitico(feitico, calculoBase, ctx);
  // Agrega avisos do Feitiço e dos sub-efeitos (Múltiplos Efeitos), para o ícone
  // e o tooltip do cabeçalho não mentirem o número/mensagem.
  const avisosTodos = calc
    ? [...(calc.avisos || []), ...((calc.efeitos || []).flatMap((e) => e.avisos || []))]
    : [];
  const temAviso = avisosTodos.length > 0;
  const resumo = feitico.tipo === "dano" ? calc?.dano
    : feitico.tipo === "auxiliar" ? formatAuxValor(calc)
    : feitico.tipo === "curativo" ? calc?.cura
    : feitico.tipo === "especial" ? (calc?.dano ?? calc?.resumo)
    : null;

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
            {feitico.nome || "Feitiço Sem Nome"}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 flex-shrink-0 whitespace-nowrap">
            {TIPO_FEITICO_LABEL[feitico.tipo]} · {NIVEL_LABEL[feitico.nivel]}
          </span>
          {temAviso && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-label={`${avisosTodos.length} aviso(s)`} title={avisosTodos.join("\n")} />}
        </button>
        {calc && (
          <span className="hidden sm:flex items-center gap-2 flex-shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
            <span title={feitico.tipo === "dano" ? "Dano"
              : feitico.tipo === "especial" ? (["golpeador", "danoAlma"].includes(feitico.especialSubtipo) ? "Dano" : "Efeito")
              : feitico.tipo === "curativo" ? (calc?.ehTemporario ? "PV Temporário" : "Cura")
              : "Efeito"}>{resumo}</span>
            <span title={tituloCustoFeitico(calc)} className="text-purple-300">{calc.custoPE} PE</span>
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
              <OptionChips value={feitico.tipo} options={TIPO_FEITICO} onChange={(v) => onPatch({ tipo: v, ...(v === "curativo" && feitico.nivel === 0 ? { nivel: 1 } : {}) })} />
            </div>
          </div>

          <div>
            <FieldLabel>Nível do Feitiço</FieldLabel>
            <NivelFeiticoPicker value={feitico.nivel} onChange={(n) => onPatch(patchNivelFeitico(feitico, n))} nivelMax={nivelMax} nivelMin={feitico.tipo === "curativo" ? 1 : 0} />
          </div>

          {feitico.tipo === "dano" ? (
            <FeiticoDanoEditor feitico={feitico} calc={calc} onPatch={onPatch} />
          ) : feitico.tipo === "auxiliar" ? (
            <FeiticoAuxiliarEditor feitico={feitico} calc={calc} onPatch={onPatch} />
          ) : feitico.tipo === "curativo" ? (
            <FeiticoCurativoEditor feitico={feitico} calc={calc} onPatch={onPatch} />
          ) : feitico.tipo === "especial" ? (
            <FeiticoEspecialEditor feitico={feitico} calc={calc} ctx={ctx} onPatch={onPatch} />
          ) : feitico.tipo === "passivo" ? (
            <TecnicaMotorEditor
              efeitos={efeitosPassivo}
              onChange={(v) => onPatch({ efeitosPassivo: v })}
              fontesDano={fontesDano}
              dslGrupos={dslGrupos}
              titulo="Efeitos da Passiva"
              simplificarTamanho
            />
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
function NivelFeiticoPicker({ value, onChange, nivelMax, nivelMin = 0 }) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Nível do Feitiço">
      {[0, 1, 2, 3, 4, 5].map((n) => {
        const on = n === value;
        const off = (n > nivelMax || n < nivelMin) && !on;
        return (
          <button
            key={n}
            type="button"
            onClick={() => !off && onChange(n)}
            disabled={off}
            aria-pressed={on}
            title={off ? (n < nivelMin ? "Nível 0 não cura" : `Inacessível no ND atual (máximo ${NIVEL_LABEL[nivelMax]})`) : NIVEL_LABEL[n]}
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
  const limAcerto = 2 * nNum;
  const limCd = 1 + nNum;
  // Feitiço de Ataque só tem CD ao anexar uma Condição, e aí a CD só sobe (autor).
  // Área é sempre TR (tem CD), Múltiplos Disparos é sempre Ataque.
  const resolEff = emArea ? "tr" : (multiplos ? "ataque" : f.resolucao);
  const temCondicao = (Array.isArray(f.condicoes) && f.condicoes.length > 0) || !!f.sangramento;
  const temCD = resolEff !== "ataque" || temCondicao;
  const cdMin = resolEff === "ataque" ? 0 : -limCd;
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
          <FieldLabel>Conjuração (Ação)</FieldLabel>
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
          {f.resolucao === "ataque" && !multiplos && (
            <TrocaLinha rotulo="Acerto"><DeltaStepper value={f.trocas.acerto} step={2} min={-limAcerto} max={limAcerto} onChange={(v) => setTroca("acerto", v)} /></TrocaLinha>
          )}
          {temCD && (
            <TrocaLinha rotulo="CD"><DeltaStepper value={f.trocas.cd} step={1} min={cdMin} max={limCd} onChange={(v) => setTroca("cd", v)} /></TrocaLinha>
          )}
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
function NivelSegmentos({ value, min, max, onChange, compacto }) {
  const nums = [];
  for (let n = min; n <= max; n += 1) nums.push(n);
  return (
    <div className={`flex gap-1.5 ${compacto ? "flex-wrap" : ""}`} role="group" aria-label="Quantidade">
      {nums.map((n) => {
        const on = n === value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={on}
            // compacto: largura fixa em vez de esticar. Com 2 ou 3 opções o
            // medidor esticado vira um par de botões gigantes.
            className={`${compacto ? "w-9" : "grow"} py-1.5 rounded-lg text-sm font-bold tabular-nums border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
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

/* Anexar condições ao Feitiço (reduzem dados) + sangramento variável.
   showFoco: mostra o toggle "Somente Condição" (só o Dano comum usa). */
function CondicaoEditor({ feitico, onPatch, showFoco = true }) {
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
        {showFoco && (
          <BoolChip ativo={f.focoCondicao} onToggle={() => onPatch({ focoCondicao: !f.focoCondicao })}>Somente Condição</BoolChip>
        )}
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

      {calc.contInicial && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          Golpe {calc.contInicial}, depois {calc.contPorRodada} por rodada
          {calc.detalhes.continuo?.custoSustentacao ? ` (sustentação ${calc.detalhes.continuo.custoSustentacao} PE/rodada)` : ""}
        </div>
      )}
      {calc.disparos && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          {calc.disparos.disparos} disparos de {calc.disparos.porDisparoTexto}, ou {calc.disparos.concentradoTexto} concentrado num alvo
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

/* ---------------------------------------------------------------
   FEITIÇO CURATIVO. Variante do de Dano: recupera PV (ou PV Temporário
   sem Energia Reversa). Mesmo vocabulário visual, sem resolução nem CD.
   --------------------------------------------------------------- */
function FeiticoCurativoEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  const nNum = f.nivel === "max" ? 6 : f.nivel;
  const emArea = f.alvo === "area";
  const setTroca = (chave, v) => onPatch({ trocas: { ...f.trocas, [chave]: v } });
  const limDados = 1 + nNum;
  const taxas = taxasTroca(emArea ? "area" : "unico");
  const capAlcance = (1 + nNum) * taxas.alcance;
  const capArea = (1 + nNum) * taxas.area;
  const baseAlcance = ALCANCE_POR_NIVEL[f.nivel] ?? 0;
  const baseArea = AREA_POR_NIVEL[f.nivel] ?? 0;
  const trocasTitulo = emArea ? "Trocas · 1 dado = 12m = 3m²" : "Trocas · 1 dado = 6m";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3 space-y-3">
      {/* Perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <FieldLabel>Alvo</FieldLabel>
          <OptionChips
            value={f.alvo}
            onChange={(v) => onPatch({ alvo: v })}
            options={[
              { value: "unico", label: "Alvo Único" },
              { value: "area", label: "Área" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Conjuração (Ação)</FieldLabel>
          <OptionChips value={f.acao} onChange={(v) => onPatch({ acao: v })} options={CURA_ACOES} />
        </div>
      </div>

      {emArea && (
        <div>
          <FieldLabel>Forma da Área</FieldLabel>
          <OptionChips value={f.formaArea} onChange={(v) => onPatch({ formaArea: v })} options={FORMAS_AREA} />
        </div>
      )}

      {/* Trocas */}
      <SecaoFeitico titulo={trocasTitulo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <TrocaLinha rotulo="Dados de Cura"><DeltaStepper value={f.trocas.dados} step={1} min={-limDados} max={limDados} onChange={(v) => setTroca("dados", v)} /></TrocaLinha>
          <TrocaLinha rotulo="Alcance"><DeltaStepper value={f.trocas.alcance} step={6} min={-baseAlcance} max={capAlcance} unit="m" onChange={(v) => setTroca("alcance", v)} /></TrocaLinha>
          {emArea && (
            <TrocaLinha rotulo="Área"><DeltaStepper value={f.trocas.area} step={1.5} min={-baseArea} max={capArea} unit="m" onChange={(v) => setTroca("area", v)} /></TrocaLinha>
          )}
        </div>
      </SecaoFeitico>

      {/* Remoção de Condições / Ferimentos Complexos */}
      <SecaoFeitico titulo="Remoção">
        <CuraRemocaoEditor feitico={f} onPatch={onPatch} />
      </SecaoFeitico>

      {/* Requisito */}
      <SecaoFeitico titulo="Requisito">
        <OptionChips
          value={f.requisito || "nenhum"}
          onChange={(v) => onPatch({ requisito: v === "nenhum" ? null : v })}
          options={[{ value: "nenhum", label: "Nenhum" }, ...REQUISITO_DIFICULDADE.map((r) => ({ value: r.value, label: `${r.label} (+${r.dados}d)` }))]}
        />
      </SecaoFeitico>

      {calc && <ResultadoCurativo calc={calc} feitico={f} />}
    </div>
  );
}

/* Seletor do modo de remoção. As duas "todas" são Nível 5 e se excluem. */
function CuraRemocaoEditor({ feitico, onPatch }) {
  const f = feitico;
  const modo = f.remocao || "nenhuma";
  return (
    <div className="space-y-3">
      <OptionChips
        value={modo}
        onChange={(v) => onPatch({ remocao: v })}
        options={CURA_REMOCAO.map((m) => ({
          value: m.value,
          label: m.custoDados ? `${m.label} (−${m.custoDados}d)` : m.label,
        }))}
      />
      {modo === "especificas" && <CondicaoRemocaoLista feitico={f} onPatch={onPatch} />}
      {(modo === "todasCondicoes" || modo === "todosComplexos") && (
        <p className="text-[11px] text-slate-400">
          {modo === "todasCondicoes"
            ? "Remove todas as Condições do alvo e cura 1 Ferimento Complexo. Exige Nível 5."
            : "Cura todos os Ferimentos Complexos do alvo (Pernas, Braços, Olhos, Ferida Interna). Exige Nível 5."}
        </p>
      )}
    </div>
  );
}

/* Escolhe quais Condições o Feitiço remove (cada uma reduz dados pela força).
   Diferente do CondicaoEditor do Dano, Sangramento é uma condição removível. */
function CondicaoRemocaoLista({ feitico, onPatch }) {
  const f = feitico;
  const permitidas = CONDICAO_FORCAS_POR_NIVEL[f.nivel] || [];
  const [forca, setForca] = useState(permitidas[0] || "fraca");
  const forcaAtual = permitidas.includes(forca) ? forca : (permitidas[0] || "fraca");
  const opcoesNome = CONDICOES_CATALOGO[forcaAtual] || [];
  const [nome, setNome] = useState(opcoesNome[0] || "");
  const redLabel = { fraca: "−1d", media: "−3d", forte: "−5d", extrema: "−8d" };
  const maxCond = f.nivel === "max" ? 6 : f.nivel;

  const adicionar = () => {
    const alvo = nome && opcoesNome.includes(nome) ? nome : opcoesNome[0];
    if (!alvo) return;
    onPatch({ condicoes: [...(f.condicoes || []), { nome: alvo, forca: forcaAtual }] });
  };
  const remover = (i) => onPatch({ condicoes: (f.condicoes || []).filter((_, j) => j !== i) });

  if (permitidas.length === 0) return <p className="text-[11px] text-slate-500">Nível 0 não remove condições.</p>;

  return (
    <div className="space-y-2">
      <span className="text-[11px] text-slate-500">Máximo {maxCond} no {NIVEL_LABEL[f.nivel]}</span>
      <OptionChips
        value={forcaAtual}
        onChange={(v) => { setForca(v); setNome((CONDICOES_CATALOGO[v] || [])[0] || ""); }}
        options={CONDICAO_FORCAS.filter((c) => permitidas.includes(c.value)).map((c) => ({ value: c.value, label: `${c.label} ${redLabel[c.value]}` }))}
      />
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <Select value={nome} onChange={setNome} options={opcoesNome.map((n) => ({ value: n, label: n }))} />
        </div>
        <SmallButtonLocal onClick={adicionar}>Adicionar</SmallButtonLocal>
      </div>
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
    </div>
  );
}

/* Resultado computado do Feitiço Curativo. */
function ResultadoCurativo({ calc, feitico }) {
  const ehArea = feitico.alvo === "area";
  const curaLabel = calc.ehTemporario ? "PV Temporário" : "Cura";
  const tiles = [
    { label: curaLabel, value: calc.cura, icon: Heart, accent: true },
    { label: "Média", value: calc.media != null ? calc.media : "-" },
    { label: "Custo", value: calc.custoPE != null ? `${calc.custoPE} PE` : "-" },
    { label: "Alcance", value: calc.alcance != null ? `${calc.alcance} m` : "-", icon: Footprints },
  ];
  if (ehArea) tiles.push({ label: "Área", value: calc.area != null ? `${calc.area} m ${calc.forma || ""}`.trim() : "-" });

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

      {calc.ehTemporario && (
        <div className="text-[11px] text-amber-300/80 border-t border-slate-800 pt-2">
          Sem a aptidão Energia Reversa a cura vira Pontos de Vida Temporários.
        </div>
      )}
      {calc.detalhes?.curaTudo?.condicoes && (
        <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-2">Remove todas as Condições e cura 1 Ferimento Complexo.</div>
      )}
      {calc.detalhes?.curaTudo?.ferimentosComplexos && (
        <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-2">Cura todos os Ferimentos Complexos.</div>
      )}
      {calc.detalhes?.removeCondicoes?.length > 0 && (
        <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-2">Remove: {calc.detalhes.removeCondicoes.join(", ")}.</div>
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

/* ---------------------------------------------------------------
   FEITIÇO ESPECIAL. O tipo reúne subtipos bem diferentes. Por ora só
   Golpeador e Dano na Alma (variantes de dano de alvo único). Os outros
   quatro (Itens, Shikigami, Transformação, Invisibilidade) vêm depois.
   --------------------------------------------------------------- */
function FeiticoEspecialEditor({ feitico, calc, ctx, onPatch }) {
  const f = feitico;
  const sub = f.especialSubtipo || "golpeador";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3 space-y-3">
      <div>
        <FieldLabel>Tipo de Especial</FieldLabel>
        <OptionChips
          value={sub}
          onChange={(v) => onPatch({ especialSubtipo: v })}
          options={ESPECIAL_SUBTIPOS.map((s) => ({ value: s.value, label: s.label }))}
        />
      </div>
      {sub === "golpeador" ? (
        <GolpeadorEditor feitico={f} calc={calc} onPatch={onPatch} />
      ) : sub === "danoAlma" ? (
        <DanoAlmaEditor feitico={f} calc={calc} onPatch={onPatch} />
      ) : sub === "invisibilidade" ? (
        <InvisibilidadeEditor feitico={f} calc={calc} onPatch={onPatch} />
      ) : sub === "itens" ? (
        <ItensEditor feitico={f} calc={calc} onPatch={onPatch} />
      ) : sub === "shikigami" ? (
        <ShikigamiEditor feitico={f} calc={calc} ctx={ctx} onPatch={onPatch} />
      ) : sub === "transformacao" ? (
        <TransformacaoEditor feitico={f} calc={calc} onPatch={onPatch} />
      ) : (
        <div className="text-center py-5 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
          {ESPECIAL_SUBTIPOS.find((s) => s.value === sub)?.label} entra num próximo incremento.
          <div className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-2 py-0.5">
            próximo incremento
          </div>
        </div>
      )}
    </div>
  );
}

/* Requisito: chips reusados pelos editores de dano/variantes. */
function RequisitoSecao({ feitico, onPatch }) {
  return (
    <SecaoFeitico titulo="Requisito">
      <OptionChips
        value={feitico.requisito || "nenhum"}
        onChange={(v) => onPatch({ requisito: v === "nenhum" ? null : v })}
        options={[{ value: "nenhum", label: "Nenhum" }, ...REQUISITO_DIFICULDADE.map((r) => ({ value: r.value, label: `${r.label} (+${r.dados}d)` }))]}
      />
    </SecaoFeitico>
  );
}

/* Feitiço Golpeador: dano adicional num ataque, alcance por movimento. */
function GolpeadorEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  const nNum = f.nivel === "max" ? 6 : f.nivel;
  const setTroca = (chave, v) => onPatch({ trocas: { ...f.trocas, [chave]: v } });
  const limAcerto = 2 * nNum;
  const limCd = 1 + nNum;
  const temCondicao = (Array.isArray(f.condicoes) && f.condicoes.length > 0) || !!f.sangramento;
  const maxGolpes = maxGolpesGolpeador(f.nivel);
  const golpes = Math.min(Math.max(1, f.golpesGolpeador || 1), maxGolpes);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <FieldLabel>Conjuração (Ação)</FieldLabel>
          <OptionChips
            value={f.acao === "completa" ? "completa" : "comum"}
            onChange={(v) => onPatch({ acao: v })}
            options={[{ value: "comum", label: "Ação Comum" }, { value: "completa", label: "Ação Completa" }]}
          />
        </div>
        {maxGolpes > 1 && (
          <div>
            <FieldLabel hint="divide o dano adicional, −3 de acerto por golpe extra">Golpes</FieldLabel>
            <NivelSegmentos value={golpes} min={1} max={maxGolpes} onChange={(v) => onPatch({ golpesGolpeador: v })} />
          </div>
        )}
      </div>

      <SecaoFeitico titulo="Trocas · 1 dado = 2 acerto = 1 CD">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <TrocaLinha rotulo="Acerto"><DeltaStepper value={f.trocas.acerto} step={2} min={-limAcerto} max={limAcerto} onChange={(v) => setTroca("acerto", v)} /></TrocaLinha>
          {temCondicao && (
            <TrocaLinha rotulo="CD"><DeltaStepper value={f.trocas.cd} step={1} min={0} max={limCd} onChange={(v) => setTroca("cd", v)} /></TrocaLinha>
          )}
          <TrocaLinha rotulo="Empurrão (Gasta Dados)"><DeltaStepper value={f.trocas.empurraoDados} step={1} min={0} onChange={(v) => setTroca("empurraoDados", v)} /></TrocaLinha>
        </div>
      </SecaoFeitico>

      <SecaoFeitico titulo="Condições">
        <CondicaoEditor feitico={f} onPatch={onPatch} showFoco={false} />
      </SecaoFeitico>

      <RequisitoSecao feitico={f} onPatch={onPatch} />

      {calc && <ResultadoEspecial calc={calc} feitico={f} kind="golpeador" />}
    </div>
  );
}

/* Feitiço de Dano na Alma: alvo único, fura tudo, alcance base pela metade. */
function DanoAlmaEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  const nNum = f.nivel === "max" ? 6 : f.nivel;
  const setTroca = (chave, v) => onPatch({ trocas: { ...f.trocas, [chave]: v } });
  const limAcerto = 2 * nNum;
  const limCd = 1 + nNum;
  const ehAtaque = f.resolucao === "ataque";
  const temCondicao = (Array.isArray(f.condicoes) && f.condicoes.length > 0) || !!f.sangramento;
  const temCD = !ehAtaque || temCondicao;
  const cdMin = ehAtaque ? 0 : -limCd;
  const baseAlcance = Math.floor((ALCANCE_POR_NIVEL[f.nivel] ?? 0) / 2);
  const capAlcance = (1 + nNum) * 6;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <FieldLabel>Resolução</FieldLabel>
          <OptionChips
            value={ehAtaque ? "ataque" : "tr"}
            onChange={(v) => onPatch({ resolucao: v })}
            options={[{ value: "tr", label: "Resistência" }, { value: "ataque", label: "Ataque" }]}
          />
        </div>
        <div>
          <FieldLabel>Conjuração (Ação)</FieldLabel>
          <OptionChips value={f.acao} onChange={(v) => onPatch({ acao: v })} options={FEITICO_ACOES.filter((a) => a.value !== "ritual")} />
        </div>
      </div>

      <SecaoFeitico titulo="Trocas · 1 dado = 2 acerto = 1 CD = 6m">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {ehAtaque && (
            <TrocaLinha rotulo="Acerto"><DeltaStepper value={f.trocas.acerto} step={2} min={-limAcerto} max={limAcerto} onChange={(v) => setTroca("acerto", v)} /></TrocaLinha>
          )}
          {temCD && (
            <TrocaLinha rotulo="CD"><DeltaStepper value={f.trocas.cd} step={1} min={cdMin} max={limCd} onChange={(v) => setTroca("cd", v)} /></TrocaLinha>
          )}
          <TrocaLinha rotulo="Alcance"><DeltaStepper value={f.trocas.alcance} step={6} min={-baseAlcance} max={capAlcance} unit="m" onChange={(v) => setTroca("alcance", v)} /></TrocaLinha>
          <TrocaLinha rotulo="Empurrão (Gasta Dados)"><DeltaStepper value={f.trocas.empurraoDados} step={1} min={0} onChange={(v) => setTroca("empurraoDados", v)} /></TrocaLinha>
        </div>
      </SecaoFeitico>

      <SecaoFeitico titulo="Condições">
        <CondicaoEditor feitico={f} onPatch={onPatch} showFoco={false} />
      </SecaoFeitico>

      <RequisitoSecao feitico={f} onPatch={onPatch} />

      {calc && <ResultadoEspecial calc={calc} feitico={f} kind="danoAlma" />}
    </div>
  );
}

/* Resultado dos Feitiços Especiais de dano (Golpeador e Dano na Alma). */
function ResultadoEspecial({ calc, feitico, kind }) {
  const tiles = [
    { label: kind === "golpeador" ? "Dano Adicional" : "Dano", value: calc.dano, icon: Zap, accent: true },
    { label: "Média", value: calc.media != null ? calc.media : "-" },
    { label: "Custo", value: calc.custoPE != null ? `${calc.custoPE} PE` : "-" },
  ];
  if (calc.cd != null) tiles.push({ label: "CD", value: calc.cd, icon: Shield });
  if (kind === "danoAlma") tiles.push({ label: "Alcance", value: calc.alcance != null ? `${calc.alcance} m` : "-", icon: Footprints });
  if (feitico.resolucao === "ataque" && calc.acertoDelta) tiles.push({ label: "Acerto", value: `${calc.acertoDelta > 0 ? "+" : ""}${calc.acertoDelta}` });
  if (calc.empurraoMetros) tiles.push({ label: "Empurrão", value: `${calc.empurraoMetros} m` });

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map((t) => (
          <StatMini key={t.label} label={t.label} value={t.value} accent={t.accent} icon={t.icon} />
        ))}
      </div>

      {kind === "golpeador" && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          Alcance: {calc.alcanceTexto}
        </div>
      )}
      {calc.golpes && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          {calc.golpes.golpes} golpes de {notacaoDano(calc.golpes.porGolpe, calc.tipoDado)}, ou {notacaoDano(calc.golpes.concentradoTotal, calc.tipoDado)} concentrado. Prejuízo de −{calc.golpes.penalidadePorGolpe} no acerto por golpe após o primeiro (cumulativo).
        </div>
      )}
      {kind === "golpeador" && (
        <div className="text-[11px] text-amber-300/80 border-t border-slate-800 pt-2">
          Dano Após Ataque, não multiplica em crítico. Aplica os efeitos de um golpe desarmado ou de arma.
        </div>
      )}
      {kind === "danoAlma" && (
        <div className="text-[11px] text-amber-300/80 border-t border-slate-800 pt-2">
          Passa por Vida Temporária, RD e demais efeitos, ferindo a integridade da alma. Aumentos que não venham da criação são cortados pela metade.
        </div>
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

/* Feitiço de Invisibilidade: nível narrativo, sempre Sustentado + Concentração. */
function InvisibilidadeEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <BoolChip ativo={f.tecnicaInvisibilidade} onToggle={() => onPatch({ tecnicaInvisibilidade: !f.tecnicaInvisibilidade })}>
          Técnica é Invisibilidade (permite Nível 0)
        </BoolChip>
      </div>
      <div>
        <FieldLabel hint={calc?.exigeFraqueza ? "obrigatória no Nível 1 e 2" : "opcional nos demais níveis"}>Forma de Ser Anulado</FieldLabel>
        <TextArea
          value={f.fraquezaInvis}
          onChange={(v) => onPatch({ fraquezaInvis: v })}
          rows={2}
          placeholder="Como o Feitiço pode ser desfeito. Ex.: caso a sombra que o esconde seja desfeita por luz, o Feitiço se encerra."
        />
      </div>
      {calc && <ResultadoInvisibilidade calc={calc} />}
    </div>
  );
}

function ResultadoInvisibilidade({ calc }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatMini label="Custo" value={calc.custoPE != null ? `${calc.custoPE} PE` : "-"} accent icon={Sparkles} />
        <StatMini label="Conjuração" value="Sustentado" />
        <StatMini label="Foco" value="Concentração" />
      </div>
      <div className="text-[11px] text-amber-300/80 border-t border-slate-800 pt-2">
        Sempre Sustentado e usa Concentração. Não pode ser Imediato nem Duradouro.
      </div>
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

/* Feitiço de Criação de Itens de Custo. */
function ItensEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  const nivel = f.nivel === "max" ? 6 : f.nivel;
  const foco = !!f.tecnicaFocoItens;
  const nivelEfetivo = nivel + (foco ? 1 : 0);
  const maxCusto = Math.max(1, Math.min(nivelEfetivo, ITEM_CUSTO_MAX));
  const custo = Math.min(Math.max(1, f.itemCusto || 1), maxCusto);
  const qtdBase = nivelEfetivo - custo + 1;
  const maxReducao = Math.max(0, Math.min(qtdBase - 1, nivel));
  const grauTroca = Math.min(Math.max(0, f.itemGrauTroca || 0), maxReducao);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <BoolChip ativo={foco} onToggle={() => onPatch({ tecnicaFocoItens: !foco })}>
          Técnica Focada em Criação (um nível mais cedo)
        </BoolChip>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <FieldLabel hint={`quantidade = ${nivelEfetivo} − Custo + 1`}>Custo do Item</FieldLabel>
          <NivelSegmentos value={custo} min={1} max={maxCusto} onChange={(v) => onPatch({ itemCusto: v })} />
        </div>
        <div>
          <FieldLabel>Natureza</FieldLabel>
          <OptionChips
            value={f.itemNatureza === "permanente" ? "permanente" : "consumivel"}
            onChange={(v) => onPatch({ itemNatureza: v })}
            options={[{ value: "consumivel", label: "Consumível" }, { value: "permanente", label: "Permanente" }]}
          />
        </div>
      </div>

      {maxReducao > 0 && (
        <div>
          <FieldLabel hint="reduz a quantidade (mínimo 1 item) para +Grau num item">Trocar Itens por Grau</FieldLabel>
          <NivelSegmentos value={grauTroca} min={0} max={maxReducao} onChange={(v) => onPatch({ itemGrauTroca: v })} />
        </div>
      )}

      <div>
        <FieldLabel hint="especifique os itens criados">Itens Criados</FieldLabel>
        <TextArea
          value={f.itemDescricao}
          onChange={(v) => onPatch({ itemDescricao: v })}
          rows={2}
          placeholder="Descreva os itens que o Feitiço cria (devem ser especificados previamente)."
        />
      </div>

      {calc && <ResultadoItens calc={calc} />}
    </div>
  );
}

function ResultadoItens({ calc }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatMini label="Itens" value={calc.quantidade > 0 ? `${calc.quantidade}× Custo ${calc.custo}` : "-"} accent icon={FlaskConical} />
        {calc.grauBonus > 0 && <StatMini label="Grau" value={`+${calc.grauBonus} em 1 item`} />}
        <StatMini label="Custo" value={calc.custoPE != null ? `${calc.custoPE} PE` : "-"} />
        <StatMini label="Conjuração" value="Bônus" />
      </div>

      <div className="text-[11px] text-slate-300 border-t border-slate-800 pt-2">
        {calc.detalhes?.restricao}
      </div>
      <div className="text-[11px] text-slate-400">{calc.detalhes?.duracao}</div>

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

/* Feitiço de Criação de Shikigamis: referencia uma Invocação da aba Invocações.
   O nível do Feitiço dita o grau exigido, então o seletor destaca o casamento.

   ⚠ O `confere` de cada opção era CALCULADO e ignorado (2026-08-16): o motor já
   dizia quais invocações batem com o grau exigido e a tela mostrava todas
   iguais, deixando o jogador escolher a errada para descobrir depois no aviso.
   Agora quem confere vem primeiro e marcado, e quem não confere vem apagado com
   o grau dela ao lado. */
function ShikigamiEditor({ feitico, calc, ctx, onPatch }) {
  const f = feitico;
  const opcoes = calc?.opcoes || [];
  const temInvocacoes = opcoes.length > 0;
  // Quem bate com o grau exigido sobe. Dentro de cada grupo a ordem da ficha
  // é mantida, que é a ordem em que a pessoa montou as invocações.
  const ordenadas = [...opcoes].sort((a, b) => Number(b.confere) - Number(a.confere));
  const escolhida = f.shikigamiInvocacaoId || null;

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel hint={calc ? `exige ${calc.grauLabel}` : undefined}>Invocação Referenciada</FieldLabel>
        {temInvocacoes ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onPatch({ shikigamiInvocacaoId: null })}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                escolhida === null
                  ? "border-purple-600 bg-purple-800/50 text-white"
                  : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white"
              }`}
            >
              Nenhuma
            </button>
            {ordenadas.map((o) => {
              const on = escolhida === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onPatch({ shikigamiInvocacaoId: o.id })}
                  title={o.confere ? undefined : `Esta invocação é ${o.grauLabel}`}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                    on
                      ? "border-purple-600 bg-purple-800/50 text-white"
                      : o.confere
                        ? "border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white"
                        : "border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {o.confere
                    ? <Check className="w-3 h-3 flex-shrink-0 text-emerald-400" aria-hidden="true" />
                    : <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-500/70" aria-hidden="true" />}
                  <span className="truncate max-w-[12rem]">{o.nome || "Sem Nome"}</span>
                  {!o.confere && <span className="text-[10px] font-normal opacity-70">{o.grauLabel}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-slate-700 rounded-lg text-[11px] text-slate-400">
            Nenhuma Invocação na ficha. Monte uma na aba Invocações, no {calc?.grauLabel || "grau exigido"}.
          </div>
        )}
      </div>
      {calc && <ResultadoShikigami calc={calc} ctx={ctx} />}
    </div>
  );
}

function ResultadoShikigami({ calc, ctx }) {
  const tiles = [
    { label: "Grau Exigido", value: calc.grauLabel, icon: Shield, accent: true },
    // ⚠ Os dois são PE, e um deles saía sem unidade.
    { label: "Redução de PE", value: calc.reducaoPE != null ? `${calc.reducaoPE} PE` : "-", icon: Zap },
    { label: "Custo de Invocação", value: calc.custoPE != null ? `${calc.custoPE} PE` : "-", icon: Sparkles },
    { label: "Conjuração", value: "Comum" },
  ];
  if (calc.ajusteAcoes) tiles.push({ label: "Ações/Caract.", value: `${calc.ajusteAcoes > 0 ? "+" : ""}${calc.ajusteAcoes}` });

  /* A criatura que este Feitiço conjura, já resolvida. Ela vive na aba
     Invocações e o Feitiço é dono do grau e do custo dela, então mostrar aqui os
     números que saíram evita a ida e volta entre as duas abas para conferir se o
     shikigami ficou do tamanho que se queria. */
  const resolvida = calc.invocacaoId
    ? (ctx?.invocacoesResolvidas ?? []).find((x) => x.id === calc.invocacaoId)
    : null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map((t) => (
          <StatMini key={t.label} label={t.label} value={t.value} accent={t.accent} icon={t.icon} />
        ))}
      </div>

      {resolvida && (
        <div className="border-t border-slate-800 pt-2 space-y-1.5">
          <div className={`text-[11px] font-mono flex items-center gap-1.5 ${calc.grauConfere ? "text-slate-300" : "text-amber-300/80"}`}>
            {calc.grauConfere ? <Check className="w-3 h-3 flex-shrink-0" /> : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
            {resolvida.nome || "Sem Nome"} · {resolvida.grauLabel}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatMini icon={Heart} label="Vida" value={resolvida.pv} />
            <StatMini icon={Shield} label="Defesa" value={resolvida.defesa} />
            <StatMini icon={Footprints} label="Desloc." value={`${resolvida.deslocamento} m`} />
            <StatMini label="Ações/Caract." value={`${resolvida.orcamento?.usados ?? 0} / ${resolvida.orcamento?.total ?? 0}`} />
          </div>
        </div>
      )}

      {calc.notas?.length > 0 && (
        <ul className="space-y-1 border-t border-slate-800 pt-2">
          {calc.notas.map((n, i) => (
            <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <span className="text-slate-600 mt-px flex-shrink-0">•</span> {n}
            </li>
          ))}
        </ul>
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

/* Feitiço de Transformação: concede efeitos auxiliares Duradouros. */
function TransformacaoEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  const duracao = f.transfDuracao || "sustentada";
  const efeitos = calc?.efeitos || [];
  const setEfeito = (i, id) => {
    const arr = Array.isArray(f.transfEfeitos) ? [...f.transfEfeitos] : [];
    arr[i] = id;
    onPatch({ transfEfeitos: arr });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <FieldLabel>Duração</FieldLabel>
          <OptionChips value={duracao} onChange={(v) => onPatch({ transfDuracao: v })} options={TRANSF_DURACOES} />
        </div>
        <div>
          <FieldLabel>Conjuração (Ação)</FieldLabel>
          <OptionChips value={f.transfAcao || "comum"} onChange={(v) => onPatch({ transfAcao: v })} options={TRANSF_ACOES} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div>
          <FieldLabel hint="−1 efeito por +1 nível em todos os outros">Trocar Efeitos por Nível</FieldLabel>
          <DeltaStepper value={f.transfNivelTroca || 0} step={1} min={0} onChange={(v) => onPatch({ transfNivelTroca: v })} />
        </div>
        {duracao === "sustentada" && (
          <BoolChip ativo={!!f.transfCustoVida} onToggle={() => onPatch({ transfCustoVida: !f.transfCustoVida })}>
            Sustentar com Vida
          </BoolChip>
        )}
      </div>

      <SecaoFeitico titulo={`Efeitos (${efeitos.length})`}>
        <div className="space-y-2">
          {efeitos.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-purple-300 w-16 flex-shrink-0">Nível {e.auxNivel}</span>
              <div className="flex-1 min-w-0">
                <Select value={e.efeito} onChange={(v) => setEfeito(i, v)} options={AUX_EFEITOS.map((a) => ({ value: a.value, label: a.label }))} />
              </div>
              <span className={`text-xs font-mono w-16 text-right flex-shrink-0 ${e.disponivel ? "text-purple-200" : "text-amber-400"}`}>{e.texto}</span>
            </div>
          ))}
        </div>
      </SecaoFeitico>

      {calc && <ResultadoTransformacao calc={calc} />}
    </div>
  );
}

function ResultadoTransformacao({ calc }) {
  const tiles = [
    { label: "Efeitos", value: calc.efeitos.length, icon: Sparkles, accent: true },
    { label: "Custo", value: calc.custoPE != null ? `${calc.custoPE} PE` : "-" },
  ];
  if (calc.sustentacaoPE) tiles.push({ label: "Sustentação", value: `${calc.sustentacaoPE} PE/rod` });
  if (calc.sustentacaoVida) tiles.push({ label: "Sustentação", value: `${calc.sustentacaoVida} PV/rod` });
  if (calc.duracaoRodadas) tiles.push({ label: "Duração", value: `${calc.duracaoRodadas} rodadas` });
  if (calc.exaustaoFim) tiles.push({ label: "Exaustão", value: calc.exaustaoFim });

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map((t) => (
          <StatMini key={t.label} label={t.label} value={t.value} accent={t.accent} icon={t.icon} />
        ))}
      </div>

      {calc.efeitos.length > 0 && (
        <div className="text-[11px] text-slate-300 font-mono border-t border-slate-800 pt-2">
          {calc.efeitos.map((e) => `${e.label} ${e.texto}`).join("  ·  ")}
        </div>
      )}
      <div className="text-[11px] text-amber-300/80 border-t border-slate-800 pt-2">{calc.notaExaustao}</div>

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

/* ---------------------------------------------------------------
   FEITIÇO AUXILIAR. O editor despacha efeito único ou Múltiplos Efeitos;
   Enfraquecedores vêm depois. No modo múltiplo, Duração, Ação e Alvos são
   do Feitiço inteiro. Mesmo vocabulário visual do editor de Dano.
   --------------------------------------------------------------- */

/* Durações com célula preenchida (≠ null) para o efeito/nível atual. */
function auxDuracoesDisponiveis(efeito, nivel) {
  const linha = AUX_TABELAS[efeito]?.[nivel];
  if (!linha) return [];
  return AUX_DURACOES.map((d) => d.value).filter((d) => linha[d] != null);
}

/* Ações oferecidas por efeito (só as definidas pelo livro para Fase A). */
function acoesAux(efeito, duracao) {
  const imediata = duracao === "imediata";
  switch (efeito) {
    case "defesa":
    case "rd":         return ["padrao", "bonus", ...(imediata ? ["reacao"] : [])];
    case "tr":
    case "cd":         return ["padrao", "comum"];
    case "rolagem":    return ["padrao", "comum", "completa"];
    case "ataque":     return imediata ? ["padrao"] : ["padrao", "comum", "completa"];
    case "danoDurante":
    case "danoApos":
    case "danoFixo":
    case "niveisDano": return ["padrao", "comum"];
    case "margemCritico": return ["padrao", "completa"];
    case "negacaoRd":  return ["padrao", "bonus"];
    default:           return ["padrao"];
  }
}

const ACAO_LABEL_AUX = { bonus: "Ação Bônus", comum: "Ação Comum", completa: "Ação Completa", reacao: "Reação" };
/* Alcance do Auxiliar. Próprio = só a própria criatura, então nunca múltiplos alvos. */
const ALCANCE_AUX_OPCOES = [{ value: "alvo", label: "Alvo" }, { value: "propria", label: "Próprio" }];
// Hierarquia de ação (menor → maior), para o seletor único do Múltiplos Efeitos.
const HIERARQUIA_ACAO_UI = ["reacao", "bonus", "comum", "completa"];

/* Ação assumida pela tabela (o "Padrão" do chip). TR e Ataque imediatos
   usam Reação como padrão; os demais usam o acaoPadrao do efeito. */
function acaoPadraoAux(efeito, duracao) {
  if ((efeito === "tr" || efeito === "ataque") && duracao === "imediata") return "reacao";
  return AUX_EFEITOS.find((e) => e.value === efeito)?.acaoPadrao || "comum";
}

/* Patch de nível do Feitiço. Num Auxiliar de efeito único, revalida a Duração
   contra o novo nível (o picker fica fora do editor e só mandava {nivel}). */
function patchNivelFeitico(feitico, n) {
  if (feitico.tipo === "auxiliar" && !feitico.multiplosAtivo) {
    const disp = auxDuracoesDisponiveis(feitico.efeitoAux || "defesa", n);
    const atual = feitico.duracaoAux || "imediata";
    return { nivel: n, duracaoAux: disp.includes(atual) ? atual : (disp[0] || "imediata") };
  }
  return { nivel: n };
}

/* O `formatAuxValor` subiu para afty-feiticos.js em 2026-08-03, quando o Preview
   passou a listar os Feitiços: com dois consumidores, uma cópia local aqui
   divergiria do motor na primeira errata. Vem pelo import lá de cima. */

/* Ações concretas oferecidas para um efeito, já sem o pseudo-valor "padrao" e
   na ordem da hierarquia. Os dois modos passam a mostrar a mesma coisa: nomes
   de ação de verdade, com a padrão apenas pré-selecionada. */
function acaoOpcoesAux(efeito, duracao) {
  const padrao = acaoPadraoAux(efeito, duracao);
  const concretas = new Set(acoesAux(efeito, duracao).map((a) => (a === "padrao" ? padrao : a)));
  return HIERARQUIA_ACAO_UI.filter((a) => concretas.has(a)).map((a) => ({ value: a, label: ACAO_LABEL_AUX[a] }));
}

/* Seletor de modo do Auxiliar. */
function ModoAuxToggle({ f, onPatch }) {
  // Os dois efeitos iniciais nascem DIFERENTES (não se repete efeito).
  const trocar = (v) => {
    if (v === "unico") { onPatch({ multiplosAtivo: false }); return; }
    if (Array.isArray(f.efeitosMult) && f.efeitosMult.length >= 2) {
      onPatch({ multiplosAtivo: true, efeitosMult: f.efeitosMult });
      return;
    }
    const primeiro = createBlankAuxEffect(0);
    const segundo = { ...createBlankAuxEffect(0), efeito: primeiroEfeitoLivre([primeiro]) };
    onPatch({ multiplosAtivo: true, efeitosMult: [primeiro, segundo] });
  };
  return (
    <OptionChips
      value={f.multiplosAtivo ? "mult" : "unico"}
      onChange={trocar}
      options={[{ value: "unico", label: "Efeito Único" }, { value: "mult", label: "Múltiplos Efeitos" }]}
    />
  );
}

/* Parâmetros do FEITIÇO, idênticos nos dois modos e na mesma ordem: o que o
   Feitiço é, depois como ele é conjurado, depois em quem cai. `p` é a forma
   normalizada que cada editor monta. `children` ocupa a primeira célula da
   grade (o seletor de Efeito, no modo de efeito único). */
function AuxParametros({ p, children }) {
  return (
    <div className="space-y-2.5">
      {/* Só os controles EMPARELHÁVEIS ficam na grade de 2 colunas. Alvos some com
          Alcance Próprio, mas os controles de largura livre (Tipos, Restrições)
          saíram da grade para não deixar buraco ao lado. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
        {children}
        <div>
          <FieldLabel>Duração</FieldLabel>
          <OptionChips value={p.duracao} onChange={p.setDuracao} options={AUX_DURACOES} disabledValues={p.duracoesBloqueadas} />
        </div>
        {p.acaoOpcoes.length > 1 && (
          <div>
            <FieldLabel>Conjuração</FieldLabel>
            <OptionChips value={p.acao} onChange={p.setAcao} options={p.acaoOpcoes} />
          </div>
        )}
        {p.duracao === "duradoura" && (
          <div>
            <FieldLabel>Rodadas</FieldLabel>
            <NivelSegmentos value={p.rodadas} min={p.faixa.min} max={p.faixa.max} onChange={p.setRodadas} compacto />
          </div>
        )}
        <div>
          <FieldLabel>Alcance</FieldLabel>
          <OptionChips value={p.propria ? "propria" : "alvo"} onChange={p.setAlcance} options={p.alcanceOpcoes} />
        </div>
        {p.mostraAlvos && (
          <div>
            <FieldLabel>Alvos</FieldLabel>
            <NivelSegmentos value={p.alvos} min={1} max={6} onChange={p.setAlvos} compacto />
          </div>
        )}
      </div>

      {p.mostraTipos && (
        <div>
          <FieldLabel>Tipos de Dano Extras</FieldLabel>
          <ContadorCompacto value={p.tipos} min={0} onChange={p.setTipos} />
        </div>
      )}

      {/* Restrições e Uso da Concentração lado a lado quando cabem (ex.: com
          Alcance Próprio, onde não há linha de Alvos ocupando o par). */}
      <div className="flex flex-wrap gap-x-6 gap-y-2.5">
        <div>
          <FieldLabel>Restrições</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {p.mostraUmGolpe && (
              <BoolChip ativo={p.umGolpe} onToggle={p.setUmGolpe} bloqueado={p.umGolpeBloqueado} lockTitle={p.umGolpeLock}>
                Um Único Evento
              </BoolChip>
            )}
            <BoolChip ativo={p.concentracao} onToggle={p.setConcentracao} bloqueado={p.concBloqueada} lockTitle={p.concLock}>
              Concentração
            </BoolChip>
          </div>
        </div>
        {p.concentracao && p.usosConc && (
          <div>
            <FieldLabel>Uso da Concentração</FieldLabel>
            <OptionChips value={p.usoConc} onChange={p.setUsoConc} disabledValues={p.usosConcBloqueados} options={p.usosConc} />
          </div>
        )}
      </div>
    </div>
  );
}


/* Contador compacto de inteiros (− N +): escala para faixas que os segmentos
   não comportam, como os tipos de dano. */
function ContadorCompacto({ value, min = 0, max, onChange }) {
  const v = Math.max(min, Math.min(max ?? Infinity, value || 0));
  const btn = "w-8 h-8 flex items-center justify-center text-base font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 focus:outline-none focus:z-10 focus:ring-1 focus:ring-purple-500";
  return (
    <div className="inline-flex items-center">
      <button type="button" onClick={() => onChange(Math.max(min, v - 1))} disabled={v <= min} className={`${btn} rounded-l`} aria-label="Diminuir">−</button>
      <span className={`w-10 h-8 flex items-center justify-center border-y border-slate-700 bg-slate-950 font-mono text-sm tabular-nums ${v === 0 ? "text-slate-500" : "text-purple-200"}`}>{v}</span>
      <button type="button" onClick={() => onChange(Math.min(max ?? Infinity, v + 1))} disabled={max != null && v >= max} className={`${btn} rounded-r`} aria-label="Aumentar">+</button>
    </div>
  );
}

function FeiticoAuxiliarEditor({ feitico, calc, onPatch }) {
  const f = feitico;
  if (f.multiplosAtivo) return <FeiticoAuxMultiplos feitico={f} calc={calc} onPatch={onPatch} />;

  const efeito = f.efeitoAux || "defesa";
  const nivel = f.nivel;
  const duracao = f.duracaoAux || "imediata";
  const meta = AUX_EFEITOS.find((m) => m.value === efeito);
  const dispon = auxDuracoesDisponiveis(efeito, nivel);
  const faixa = faixaRodadasDuradoura(nivel);
  const padraoAcao = acaoPadraoAux(efeito, duracao);
  const acaoOpcoes = acaoOpcoesAux(efeito, duracao);
  const acao = (!f.acaoAux || f.acaoAux === "padrao") ? padraoAcao : f.acaoAux;
  const propria = !!f.alcancePropria;
  // A marca de evento vale em qualquer ação, mas some quando a Reação já implica
  // um golpe. Resultado especial não é número: some com o seletor de Alvos.
  const mostraUmGolpe = ofereceUmGolpe(efeito, nivel, duracao, acao);
  const especialAtivo = resultaEspecialAux(efeito, nivel, duracao,
    aplicaUmGolpe(efeito, nivel, duracao, acao, !!f.umGolpe));

  const revalidarDur = (efeitoV) => {
    const dispV = auxDuracoesDisponiveis(efeitoV, nivel);
    return dispV.includes(duracao) ? duracao : (dispV[0] || "imediata");
  };
  // Um Único Evento e Concentração são exclusivos (autor). Alcance Próprio trava
  // em 1 alvo, e aqui a Concentração só renderia alvos, então ela fica travada.
  const p = {
    duracao,
    setDuracao: (v) => onPatch({ duracaoAux: v, acaoAux: "padrao" }),
    duracoesBloqueadas: AUX_DURACOES.map((d) => d.value).filter((d) => !dispon.includes(d)),
    rodadas: Math.min(Math.max(f.rodadasDur || faixa.min, faixa.min), faixa.max),
    setRodadas: (v) => onPatch({ rodadasDur: v }),
    faixa,
    acao, acaoOpcoes,
    setAcao: (v) => onPatch({
      acaoAux: v === padraoAcao ? "padrao" : v,
      ...(v === "comum" || v === "completa" ? { umGolpe: false } : {}),
    }),
    propria,
    alcanceOpcoes: ALCANCE_AUX_OPCOES,
    setAlcance: (v) => onPatch(v === "propria"
      ? { alcancePropria: true, alvosAux: 1, concentracaoAux: false }
      : { alcancePropria: false }),
    mostraAlvos: !propria && !especialAtivo,
    alvos: Math.max(1, f.alvosAux || 1),
    setAlvos: (v) => onPatch({ alvosAux: v }),
    mostraTipos: !!meta?.multiTipo,
    tipos: Math.max(0, f.tiposDanoExtra || 0),
    setTipos: (v) => onPatch({ tiposDanoExtra: v }),
    mostraUmGolpe,
    umGolpe: !!f.umGolpe,
    setUmGolpe: () => onPatch(f.umGolpe ? { umGolpe: false } : { umGolpe: true, concentracaoAux: false }),
    concentracao: !!f.concentracaoAux,
    setConcentracao: () => onPatch(f.concentracaoAux
      ? { concentracaoAux: false }
      : { concentracaoAux: true, umGolpe: false }),
    concBloqueada: propria,
    concLock: "Alcance Próprio não atinge outros alvos",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 space-y-3">
      <ModoAuxToggle f={f} onPatch={onPatch} />

      <SecaoFeitico titulo="Feitiço">
        <AuxParametros p={p}>
          <div>
            <FieldLabel>Efeito Auxiliar</FieldLabel>
            <Select
              value={efeito}
              onChange={(v) => onPatch({
                efeitoAux: v, duracaoAux: revalidarDur(v),
                acaoAux: "padrao", umGolpe: false, tiposDanoExtra: 0,
              })}
              options={AUX_EFEITOS}
            />
          </div>
          {efeito === "atributo" && (
            <div>
              <FieldLabel>Atributo</FieldLabel>
              <Select
                value={f.alvoAuxAtributo || "forca"}
                onChange={(v) => onPatch({ alvoAuxAtributo: v })}
                options={AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label }))}
              />
            </div>
          )}
          {efeito === "tr" && (
            <div>
              <FieldLabel>Teste de Resistência</FieldLabel>
              <Select
                value={f.alvoAuxTR || "reflexos"}
                onChange={(v) => onPatch({ alvoAuxTR: v })}
                options={AFTY_RESISTENCIAS.map((r) => ({ value: r.value, label: r.label }))}
              />
            </div>
          )}
        </AuxParametros>
      </SecaoFeitico>

      {calc && <ResultadoAuxiliar calc={calc} feitico={f} />}
    </div>
  );
}

/* Múltiplos Efeitos: orçamento de PE (ganhos) + lista de efeitos. */
function FeiticoAuxMultiplos({ feitico, calc, onPatch }) {
  const f = feitico;
  const entries = Array.isArray(f.efeitosMult) ? f.efeitosMult : [];
  const duracaoMult = f.duracaoMult || "imediata";
  const faixa = faixaRodadasDuradoura(f.nivel);
  const rodadasMult = Math.min(Math.max(f.rodadasMult || faixa.min, faixa.min), faixa.max);
  // Ação única do Feitiço: opções do piso SELECIONÁVEL (a menor ação aceita
  // por todos) para cima, então variações como Defesa em Ação Bônus aparecem.
  // Escolher a ação PADRÃO (natural) volta para "padrao" (segue os efeitos).
  const acaoPiso = calc?.acaoPiso || "bonus";
  const acaoDefault = calc?.acaoDefault || acaoPiso;
  const acaoOpts = HIERARQUIA_ACAO_UI.slice(HIERARQUIA_ACAO_UI.indexOf(acaoPiso)).map((a) => ({ value: a, label: ACAO_LABEL_AUX[a] }));
  const acaoValor = calc?.acaoResultante || acaoDefault;
  const setAcao = (v) => onPatch({ acaoMult: v === acaoDefault ? "padrao" : v });
  // Alcance Próprio trava em 1 alvo, então a Concentração só pode render o
  // efeito extra. Alvos são do Feitiço inteiro, escolhidos uma vez só.
  const propria = !!f.alcancePropria;
  const nivelPE = f.nivel === "max" ? 5 : f.nivel;
  const usoConc = propria ? "efeito" : (f.concUsoAux || "alvos");
  const setAlcance = (v) => onPatch(v === "propria"
    ? { alcancePropria: true, alvosMult: 1, concUsoAux: "efeito" }
    : { alcancePropria: false });
  // Um efeito especial (Esquiva Garantida, Garantido) trava o Feitiço em 1 alvo:
  // ali os Alvos só vêm da Concentração, que soma sem dividir o valor.
  const alvosTravados = !!calc?.alvosTravados;
  const alvosMult = (propria || alvosTravados) ? 1 : Math.max(1, f.alvosMult || 1);
  const setEfeito = (id, partial) => onPatch({ efeitosMult: entries.map((en) => (en.id === id ? { ...en, ...partial } : en)) });
  const removeEfeito = (id) => onPatch({ efeitosMult: entries.filter((en) => en.id !== id) });
  // Evento único é do Feitiço inteiro: só entra com todos os efeitos do mesmo
  // lado, e é exclusivo com a Concentração (autor).
  const eventoUnico = !!f.umGolpe && duracaoMult === "imediata";
  const podeEvento = duracaoMult === "imediata" && podeEventoUnico(entries);
  const toggleEventoUnico = () => onPatch(f.umGolpe
    ? { umGolpe: false }
    : { umGolpe: true, concentracaoAux: false });
  const toggleConcentracao = () => onPatch(f.concentracaoAux
    ? { concentracaoAux: false }
    : { concentracaoAux: true, umGolpe: false });
  // Efeito novo nasce no primeiro efeito ainda livre e compatível com o Feitiço.
  const livre = efeitosDisponiveisMult(entries, null, eventoUnico, { nivel: 0, duracao: duracaoMult })[0]?.value ?? null;
  const addEfeito = () => {
    if (!livre) return;
    onPatch({ efeitosMult: [...entries, { ...createBlankAuxEffect(0), efeito: livre }] });
  };

  const p = {
    duracao: duracaoMult,
    setDuracao: (v) => onPatch({ duracaoMult: v }),
    rodadas: rodadasMult,
    setRodadas: (v) => onPatch({ rodadasMult: v }),
    faixa,
    acao: acaoValor, acaoOpcoes: acaoOpts, setAcao,
    propria,
    alcanceOpcoes: [
      { value: "alvo", label: "Alvo" },
      { value: "propria", label: `Próprio (+${nivelPE} PE)` },
    ],
    setAlcance,
    mostraAlvos: !propria && !alvosTravados,
    alvos: alvosMult,
    setAlvos: (v) => onPatch({ alvosMult: v }),
    mostraUmGolpe: duracaoMult === "imediata",
    umGolpe: eventoUnico,
    setUmGolpe: toggleEventoUnico,
    umGolpeBloqueado: !podeEvento && !eventoUnico,
    umGolpeLock: "Só com efeitos de um único evento e todos do mesmo lado (ofensivo ou defensivo)",
    concentracao: !!f.concentracaoAux,
    setConcentracao: toggleConcentracao,
    usoConc,
    setUsoConc: (v) => onPatch({ concUsoAux: v }),
    usosConc: [
      { value: "alvos", label: "Mais Alvos (+½ nível)", lockTitle: "Alcance Próprio não atinge outros alvos" },
      { value: "efeito", label: "Efeito Auxiliar Extra" },
    ],
    usosConcBloqueados: propria ? ["alvos"] : undefined,
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 space-y-3">
      <ModoAuxToggle f={f} onPatch={onPatch} />

      <SecaoFeitico titulo="Feitiço">
        <AuxParametros p={p}>
          <div>
            <FieldLabel>Requisito</FieldLabel>
            <Select
              value={f.requisito || "nenhum"}
              onChange={(v) => onPatch({ requisito: v === "nenhum" ? null : v })}
              options={[{ value: "nenhum", label: "Nenhum" }, ...REQUISITO_DIFICULDADE.map((r) => ({ value: r.value, label: `${r.label} (+${r.pe} PE)` }))]}
            />
          </div>
        </AuxParametros>
      </SecaoFeitico>

      <SecaoFeitico titulo="Efeitos">
        {calc?.orcamento && <OrcamentoBar calc={calc} />}
        <div className="mt-2.5 space-y-2">
          {entries.map((en) => (
            <EfeitoMultLinha
              key={en.id}
              entry={en}
              sub={calc?.efeitos?.find((x) => x.id === en.id)}
              nivelFeitico={f.nivel}
              opcoesEfeito={efeitosDisponiveisMult(entries, en.efeito, eventoUnico, { nivel: en.nivel, duracao: duracaoMult })}
              onChange={(partial) => setEfeito(en.id, partial)}
              onRemove={() => removeEfeito(en.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addEfeito}
          disabled={!livre}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:text-slate-700 disabled:border-slate-800 disabled:hover:text-slate-700 disabled:hover:border-slate-800 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Adicionar Efeito
        </button>
      </SecaoFeitico>

      {calc && <ResultadoAuxiliar calc={calc} feitico={f} />}
    </div>
  );
}

/* Barra do orçamento de Múltiplos Efeitos: gasto / total, com a repartição. */
function OrcamentoBar({ calc }) {
  const { orcamento: orc, gasto, restante, excedeu } = calc;
  const partes = [];
  if (orc.base) partes.push(`Base ${orc.base}`);
  if (orc.peReq) partes.push(`Requisito +${orc.peReq}`);
  if (orc.pePropria) partes.push(`Própria +${orc.pePropria}`);
  if (orc.peCompleta) partes.push(`Completa +${orc.peCompleta}`);
  if (orc.peConcentracao) partes.push(`Concentração +${orc.peConcentracao}`);
  const pct = orc.total > 0 ? Math.min(100, Math.round((gasto / orc.total) * 100)) : (gasto > 0 ? 100 : 0);
  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-950/70 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Orçamento</span>
        <span className="font-mono tabular-nums">
          <span className={`text-base font-bold ${excedeu ? "text-rose-400" : "text-purple-200"}`}>{gasto}</span>
          <span className="text-sm text-slate-500"> / {orc.total} PE</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${excedeu ? "bg-rose-500" : "bg-purple-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500 truncate">{partes.join(" · ")}</span>
        <span className={`flex-shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${excedeu ? "bg-rose-950/60 text-rose-300 border-rose-900/70" : "bg-slate-800/70 text-slate-300 border-slate-700"}`}>
          {excedeu ? `Excede ${-restante}` : `Restante ${restante}`}
        </span>
      </div>
    </div>
  );
}

/* Valor de um efeito na linha do Múltiplos Efeitos, com destaque: o número
   grande, a unidade menor ao lado e o custo em PE embaixo. Ocupa a coluna fixa
   à direita; texto especial ("Esquiva Garantida") cai para um corpo menor. */
function ValorEfeito({ sub, indisponivel }) {
  let main = "-", unit = null, especial = false;
  if (sub) {
    if (sub.especial) { main = sub.especial; especial = true; }
    else if (sub.dado) { main = sub.notacao; }
    else if (sub.valor != null) { main = `${sub.valor > 0 ? "+" : ""}${String(sub.valor).replace(".", ",")}`; unit = sub.unidade || null; }
  }
  const corMain = indisponivel ? "text-slate-600" : "text-white";
  return (
    <div className="w-28 flex-shrink-0 text-right font-mono leading-none">
      <div className={especial ? "flex justify-end" : "flex items-baseline justify-end gap-1"}>
        <span className={`font-bold break-words ${corMain} ${especial ? "text-[13px] leading-tight" : "text-xl"}`}>{main}</span>
        {unit && <span className="text-[11px] font-semibold text-purple-300/80">{unit}</span>}
      </div>
      {sub?.custoMult != null && <div className="text-[11px] text-slate-500 mt-1">{sub.custoMult} PE</div>}
    </div>
  );
}

/* Um controle secundário de efeito (rótulo curto + controle), alinhado com os
   irmãos numa linha que quebra. É a vaga onde entram Nível, Tipos de Dano e, no
   futuro, Perícia (Rolagem) e Teste (TR): todo controle por efeito vem aqui. */
function SubControleEfeito({ rotulo, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap">{rotulo}</span>
      {children}
    </div>
  );
}

/* Um efeito dentro de Múltiplos Efeitos. Duração, Conjuração, Alcance, Alvos e
   Evento Único são do Feitiço, então cada efeito guarda só o próprio: linha 1 é
   nome + valor em COLUNAS FIXAS (o valor não empurra o resto), linha 2 são os
   controles do efeito. Sem recolher, o valor sempre visível. */
function EfeitoMultLinha({ entry, sub, nivelFeitico, opcoesEfeito, onChange, onRemove }) {
  const meta = AUX_EFEITOS.find((m) => m.value === (entry.efeito || "defesa"));
  const indisponivel = sub && sub.disponivel === false;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Select
            value={entry.efeito}
            onChange={(v) => onChange({ efeito: v, tiposDanoExtra: 0 })}
            options={opcoesEfeito}
          />
        </div>
        {/* Coluna de valor de largura fixa, em destaque: número grande + unidade
            menor. O texto quebra dentro dela e as colunas seguintes não se movem. */}
        <ValorEfeito sub={sub} indisponivel={indisponivel} />
        {/* Vaga fixa do aviso, para o botão de remover não dançar entre linhas. */}
        <div className="w-4 flex-shrink-0">
          {sub?.avisos?.length > 0 && (
            <AlertTriangle className="w-4 h-4 text-amber-400" title={sub.avisos.join("\n")} aria-label={`${sub.avisos.length} aviso(s)`} />
          )}
        </div>
        <button type="button" onClick={onRemove} className="p-1 rounded text-slate-600 hover:text-rose-300 flex-shrink-0" title="Remover efeito" aria-label={`Remover ${meta?.label || "efeito"}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SubControleEfeito rotulo="Nível">
          <NivelSegmentos value={Math.min(entry.nivel ?? 0, nivelFeitico)} min={0} max={nivelFeitico} onChange={(v) => onChange({ nivel: v })} compacto />
        </SubControleEfeito>
        {meta?.multiTipo && (
          <SubControleEfeito rotulo="Tipos de Dano">
            <ContadorCompacto value={Math.max(0, entry.tiposDanoExtra || 0)} min={0} onChange={(v) => onChange({ tiposDanoExtra: v })} />
          </SubControleEfeito>
        )}
        {entry.efeito === "atributo" && (
          <SubControleEfeito rotulo="Atributo">
            <Select
              value={entry.alvoAuxAtributo || "forca"}
              onChange={(v) => onChange({ alvoAuxAtributo: v })}
              options={AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label }))}
            />
          </SubControleEfeito>
        )}
        {entry.efeito === "tr" && (
          <SubControleEfeito rotulo="Teste de Resistência">
            <Select
              value={entry.alvoAuxTR || "reflexos"}
              onChange={(v) => onChange({ alvoAuxTR: v })}
              options={AFTY_RESISTENCIAS.map((r) => ({ value: r.value, label: r.label }))}
            />
          </SubControleEfeito>
        )}
      </div>
    </div>
  );
}

/* Pill secundário do resultado (rótulo pequeno + valor mono). */
function AuxPill({ rotulo, valor }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-md border border-slate-700/70 bg-slate-900/70 px-2 py-1">
      <span className="text-[9px] uppercase tracking-wider text-slate-500">{rotulo}</span>
      <span className="font-mono font-semibold text-[12px] tabular-nums text-slate-200">{valor}</span>
    </span>
  );
}

/* Resultado do Auxiliar, o mesmo hero nos dois modos: o que o Feitiço entrega em
   destaque, selo de duração, pills de custo e os avisos agregados. No efeito
   único o destaque é o valor; no múltiplo é a lista de efeitos com seus valores. */
function ResultadoAuxiliar({ calc, feitico }) {
  const multiplo = !!calc.multiplos;
  const duracao = multiplo ? calc.duracao : (feitico.duracaoAux || "imediata");
  const durLabel = AUX_DURACOES.find((d) => d.value === duracao)?.label;
  const rodadas = multiplo ? feitico.rodadasMult : calc.rodadas;

  const pills = [];
  if (calc.custoPE != null) pills.push({ k: "Custo", v: `${calc.custoPE} PE` });
  if (duracao === "sustentada" && calc.upkeepPE) pills.push({ k: "Sustentar", v: `${calc.upkeepPE} PE/rd` });
  if (duracao === "duradoura" && rodadas != null) pills.push({ k: "Rodadas", v: rodadas });
  if (calc.alvos > 1) pills.push({ k: "Alvos", v: calc.alvos });
  if (!multiplo && calc.dado) pills.push({ k: "Média", v: calc.valor ?? "-" });

  // Avisos do Feitiço e dos sub-efeitos juntos: um lugar só para olhar.
  const avisos = [...(calc.avisos || []), ...((calc.efeitos || []).flatMap((e) => e.avisos || []))];

  // Destaque do efeito único: número grande + unidade; especial é texto.
  const indisponivel = !multiplo && !calc.disponivel;
  let bigMain, bigUnit = null, bigClass;
  if (multiplo) { bigMain = null; }
  else if (indisponivel) { bigMain = "—"; bigClass = "text-2xl text-slate-600"; }
  else if (calc.especial) { bigMain = calc.especial; bigClass = "text-xl text-purple-100"; }
  else if (calc.dado) { bigMain = calc.notacao; bigClass = "text-3xl text-white"; }
  else {
    const v = calc.valor;
    bigMain = `${v > 0 ? "+" : ""}${String(v).replace(".", ",")}`;
    bigUnit = calc.unidade || null;
    bigClass = "text-3xl text-white";
  }

  const titulo = multiplo
    ? `${calc.efeitos.length} Efeito${calc.efeitos.length === 1 ? "" : "s"}`
    : calc.efeitoLabel;

  return (
    <div className="rounded-xl border border-purple-900/40 bg-gradient-to-br from-purple-950/40 via-slate-950/50 to-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/80 truncate">{titulo}</div>
          {!multiplo && (
            <div className="mt-0.5 flex items-baseline gap-1.5 leading-tight">
              <span className={`font-mono font-bold tabular-nums ${bigClass}`}>{bigMain}</span>
              {bigUnit && <span className="text-sm font-semibold text-purple-300/80">{bigUnit}</span>}
            </div>
          )}
        </div>
        {durLabel && (
          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-purple-700/50 bg-purple-950/60 text-purple-200">{durLabel}</span>
        )}
      </div>

      {multiplo && calc.efeitos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {calc.efeitos.map((e) => (
            <span key={e.id} className="inline-flex items-baseline gap-1.5 rounded-md border border-purple-900/50 bg-purple-950/30 px-2 py-1">
              <span className="text-[10px] text-purple-200/70 truncate max-w-[11rem]">{e.efeitoLabel}</span>
              <span className={`font-mono font-bold text-[13px] tabular-nums ${e.disponivel === false ? "text-slate-600" : "text-white"}`}>{formatAuxValor(e)}</span>
            </span>
          ))}
        </div>
      )}

      {!indisponivel && pills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pills.map((p) => <AuxPill key={p.k} rotulo={p.k} valor={p.v} />)}
        </div>
      )}

      {avisos.length > 0 && (
        <ul className="mt-3 space-y-0.5 border-t border-slate-800/70 pt-2.5">
          {avisos.map((a, i) => (
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
/* O Tamanho não é mais escolha (autor, 2026-08-08): *"a Altura só pode ser
   maleável com Aptidões e poderes que mexam com isso"*. Toda criatura parte de
   Médio, e só o canal `tamanho` do Motor a tira de lá.

   ⚠ Era um `<Select>` livre. Virou LEITURA, e não um Select desabilitado: um
   campo cinza que não abre parece defeito, e o que o jogador precisa saber é
   qual é o tamanho dele e o que ele está pagando por isso. */
function TamanhoDerivado({ derived }) {
  const tam = getTamanho(derived?.tamanho);
  const regua = [
    { label: "Atletismo", valor: tam.atletismo },
    { label: "Furtividade", valor: tam.furtividade },
  ].filter((r) => r.valor);
  return (
    <div className="w-full min-h-9 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="text-sm text-white">{tam.label}</span>
      <span className="text-[10px] font-medium whitespace-nowrap text-sky-300">
        Espaço/alcance {String(tam.espacoAlcance).replace(".", ",")}m
      </span>
      {regua.map((r) => (
        <span
          key={r.label}
          className={`text-[10px] font-medium whitespace-nowrap ${r.valor > 0 ? "text-emerald-400" : "text-rose-400"}`}
        >
          {r.label} {r.valor > 0 ? `+${r.valor}` : r.valor}
        </span>
      ))}
    </div>
  );
}

function TabIdentidade({ draft, derived, patch, patchCore, setOrigemBonus, setOrigemId, setOrigemCla, toggleEscolhaOrigem, setOrigemPool }) {
  return (
    <>
      <Card title="Identidade">
        <div>
          <FieldLabel required>Nome</FieldLabel>
          <TextInput value={draft.name} onChange={(v) => patch({ name: v })} placeholder="Nome da criatura" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <FieldLabel>Tamanho</FieldLabel>
            <TamanhoDerivado derived={derived} />
          </div>
          <RetratoCampo
            url={draft.portraitUrl}
            focus={draft.portraitFocus}
            onUrl={(v) => patch({ portraitUrl: v })}
            onFocus={(f) => patch({ portraitFocus: f })}
          />
        </div>
      </Card>

      {/* A Origem saiu de dentro da Identidade e virou card próprio: ela carrega
          bônus de atributo, clã, treinamentos, anatomias e a progressão do Sem
          Técnica, e nada disso cabia numa caixinha ao pé de um formulário. */}
      <OrigemCard
        draft={draft}
        derived={derived}
        patchCore={patchCore}
        setOrigemId={setOrigemId}
        setOrigemBonus={setOrigemBonus}
        setOrigemCla={setOrigemCla}
        toggleEscolhaOrigem={toggleEscolhaOrigem}
        setOrigemPool={setOrigemPool}
      />
    </>
  );
}

/* O `grantLabel` foi REMOVIDO em 2026-07-29. Ele pintava um selo âmbar por
   entrada de `grants` ("1 Talento", "1 Feitiço −1 PE"), um shape declarativo que
   NUNCA alimentou o motor: a UI anunciava a concessão e a ficha não recebia nada.
   Inato e Derivado, as duas únicas usuárias, foram refeitas com efeito de verdade
   em ORIGEM_EFEITOS, e o que o Motor não cobre agora se declara em `parcial`. */

const ATTR_ABBR = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.abbr]));

/* Subtítulo do bloco de clã: o nome da HERANÇA dele, que é o que diferencia um
   clã do outro (bônus e treinamentos todo clã tem). É sempre a última
   característica, pela ordem do livro. */
const resumoDoCla = (c) => c.caracteristicas?.[c.caracteristicas.length - 1]?.nome ?? "";

/* Chip pequeno, o tijolo do cabeçalho da origem. */
function OrigemChip({ children, tom = "slate", title }) {
  const tons = {
    slate:  "text-slate-300 border-slate-700 bg-slate-800/60",
    amber:  "text-amber-300 border-amber-800 bg-amber-950/40",
    purple: "text-purple-300 border-purple-800 bg-purple-950/40",
    rose:   "text-rose-300 border-rose-900/70 bg-rose-950/30",
  };
  return (
    <span title={title} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${tons[tom]}`}>
      {children}
    </span>
  );
}

/* Uma característica de origem: painel próprio, com cabeçalho e corpo. Antes
   eram parágrafos empilhados atrás de uma barrinha, e com o Herdado e o
   Restringido entrando ficou impossível ver onde uma acabava e a outra começava. */
function CaracteristicaPainel({ nome, estado, estadoAlerta, mesa, verdadeiraOrigem, children }) {
  return (
    <div className={`rounded-lg border bg-slate-950/40 overflow-hidden ${
      verdadeiraOrigem ? "border-amber-900/60" : "border-slate-800"
    }`}
    >
      {/* ⚠ `flex-wrap`: o chip da origem copiada pode ser longo ("Herdado (Clã
          Inumaki)") e o chip é `whitespace-nowrap`. Numa linha só ele estouraria
          o card no celular. */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-900/60 border-b border-slate-800/80">
        <span className="text-[12px] font-bold text-slate-100">{nome}</span>
        {/* De onde a característica veio, quando ela NÃO é da origem da criatura.
            Sem isso a copiada aparece no meio das nativas e some. */}
        {verdadeiraOrigem && (
          <OrigemChip tom="amber" title="Verdadeiras Origens">{verdadeiraOrigem}</OrigemChip>
        )}
        {mesa && <OrigemChip title="Sem número na ficha: vale na mesa">Mesa</OrigemChip>}
        {estado && (
          <span className={`ml-auto text-[11px] font-mono tabular-nums ${estadoAlerta ? "text-rose-400" : "text-purple-300"}`}>
            {estado}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5 space-y-2.5">{children}</div>
    </div>
  );
}

/* Card da Origem: seletor, clã, características e todos os controles que elas
   abrem (bônus de atributo, alocação, escolhas aninhadas, anatomias). */
function OrigemCard({ draft, derived, patchCore, setOrigemId, setOrigemBonus, setOrigemCla, toggleEscolhaOrigem, setOrigemPool }) {
  const id = draft.core.origem?.id;
  const origem = getOrigem(id);
  const nd = draft.core.nd ?? 1;
  const clas = clasDaOrigem(id);
  const claId = draft.core.origem?.cla;
  const cla = getCla(claId);
  const caracteristicas = origem ? caracteristicasEfetivas(draft) : [];
  const porEscolha = derived?.origem?.porEscolha || {};

  const bonusMap = draft.core.origem?.bonusAtributos || {};
  // Bônus de atributo, em TODA origem: distribuir N pontos, máx M por atributo.
  // Inato, Derivado, Feto e os 4 clãs davam 3 pontos por dois dropdowns fixos
  // ("+2 em" / "+1 em") e viraram alocador de 3 com máx 2 em 2026-07-29. O
  // FORMATO GRAVADO é o mesmo dos dois lados (`{ attrKey: pontos }`), então
  // nenhuma ficha precisa migrar.
  // Sem Técnica dá 4 com máx 3, Restringido 2 entre os físicos.
  const distribUsado = Object.values(bonusMap).reduce((s, v) => s + v, 0);
  const setDistrib = (key, val) => {
    const cur = { ...bonusMap };
    if (val > 0) cur[key] = val; else delete cur[key];
    setOrigemBonus(cur);
  };
  // Características de Anatomia (Feto): escolhe 1 + 1 a cada 5 níveis.
  const anatomiasSel = draft.core.origem?.anatomias || [];
  const anatTotal = anatomiaTotal(nd);
  const toggleAnatomia = (aid) => {
    const cur = anatomiasSel.includes(aid) ? anatomiasSel.filter((x) => x !== aid) : [...anatomiasSel, aid];
    patchCore({ origem: { ...draft.core.origem, anatomias: cur } });
  };
  const seletor = (
    <div className="w-56">
      <Select value={id} onChange={(v) => setOrigemId(v)} options={AFTY_ORIGENS} />
    </div>
  );

  if (!origem) return <Card title="Origem" headerRight={seletor}>{null}</Card>;

  const fixedBonus = Object.entries(origem.bonusAtributos || {});
  const faltaCla = !!clas && !cla;

  return (
    <Card title="Origem" headerRight={seletor}>
      {/* faixa de cabeçalho: nome, travas e restrições. NADA de narrativa.
          Duas coisas saíram daqui em 2026-07-29, as duas a pedido do autor:
          o selo de raridade (Comum / Rara), que não mudava regra nenhuma, e o
          RESUMO da origem e do clã, que era lore puro. O criador de fichas
          calcula, não ensina: quem quer saber o que a origem é narrativamente
          lê o livro. Só chip de regra e aviso ficam. */}
      <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-white leading-none">{origem.nome}</span>
          {cla && (
            <>
              <ChevronLeft className="w-3 h-3 text-slate-600 rotate-180" aria-hidden="true" />
              <span className="text-base font-bold text-purple-200 leading-none">{cla.nome}</span>
            </>
          )}
          {origem.especializacaoExclusivaId && (
            <OrigemChip tom="purple">Destrava Especialização Exclusiva</OrigemChip>
          )}
          {fixedBonus.map(([k, v]) => (
            <OrigemChip key={k} tom="purple">{`${ATTR_ABBR[k] ?? k} ${v >= 0 ? `+${v}` : v}`}</OrigemChip>
          ))}
        </div>

        {origem.restricoes?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {origem.restricoes.map((r, i) => <OrigemChip key={i} tom="rose">{r}</OrigemChip>)}
          </div>
        )}
      </div>

      {/* ⚠ SÓ OS GÊMEOS. Duas coisas que nenhuma outra origem tem, e as duas
          existem porque essa origem é de DUPLA (ver afty-origens.js):

            • a MORTE DO IRMÃO, que é o segundo estágio da Restrição Celestial e
              inverte quase tudo dela. É interruptor de FICHA, e não estado de
              combate: ele é permanente e tem de sobreviver à sessão.
            • a INICIATIVA DO IRMÃO, digitada, porque a Dupla Empenhada soma os
              dois bônus e o irmão mora em outra ficha.

          Os dois ficam no topo do card, antes das características, porque o
          interruptor MUDA o que as características abaixo dizem. */}
      {id === "gemeos" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => patchCore({ origem: { ...draft.core.origem, irmaoMorto: !draft.core.origem?.irmaoMorto } })}
            aria-pressed={!!draft.core.origem?.irmaoMorto}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
              draft.core.origem?.irmaoMorto
                ? "border-rose-700 bg-rose-950/40 text-rose-100"
                : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-rose-700/70 hover:text-white"
            }`}
          >
            <span className="text-[12px] font-bold block">
              {draft.core.origem?.irmaoMorto ? "Irmão Morto" : "Irmão Vivo"}
            </span>
            <span className={`text-[10px] block ${draft.core.origem?.irmaoMorto ? "text-rose-300/80" : "text-slate-500"}`}>
              Restrição Celestial
            </span>
          </button>

          <label className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5 flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex-1 min-w-0">Iniciativa do Irmão</span>
            <input
              type="text"
              inputMode="numeric"
              value={draft.core.origem?.iniciativaIrmao ?? ""}
              onChange={(e) => {
                const cru = e.target.value.replace(/[^0-9+-]/g, "");
                patchCore({ origem: { ...draft.core.origem, iniciativaIrmao: cru } });
              }}
              placeholder="0"
              aria-label="Bônus de Iniciativa do irmão"
              className="w-14 bg-transparent text-right font-mono text-sm font-bold text-white outline-none border border-slate-800 rounded px-1.5 py-0.5 focus:border-purple-500"
            />
          </label>
        </div>
      )}

      {/* clãs: só o Herdado se divide, e sem clã ele não tem conteúdo nenhum */}
      {clas && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Clã</span>
            {faltaCla && <span className="text-[11px] text-amber-300">Escolha um clã para receber as características</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {clas.map((c) => {
              const on = c.id === claId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOrigemCla(on ? null : c.id)}
                  aria-pressed={on}
                  className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                    on
                      ? "border-purple-700 bg-purple-950/40 text-purple-100"
                      : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-purple-700/70 hover:text-white"
                  }`}
                >
                  <span className="text-[12px] font-bold block truncate">{c.nome.replace(/^Clã /, "")}</span>
                  <span className={`text-[10px] block truncate ${on ? "text-purple-300/80" : "text-slate-500"}`}>
                    {resumoDoCla(c)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* características */}
      {caracteristicas.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Características de Origem</div>
          {caracteristicas.map((c) => {
            const escolhas = [c.escolha, ...(c.escolhas || [])].filter(Boolean);
            // O estado do cabeçalho é o da PRIMEIRA escolha, que é a única
            // quando existe uma só. Com várias (Empenho Implacável), cada uma
            // carrega o seu, abaixo.
            const uma = escolhas.length === 1 ? porEscolha[escolhas[0].id] : null;
            return (
              <CaracteristicaPainel
                key={c.id}
                nome={c.nome}
                mesa={c.mesa}
                verdadeiraOrigem={c.verdadeiraOrigem}
                estado={uma ? `${uma.gasto} de ${uma.vagas}` : null}
                estadoAlerta={uma?.excedeu}
              >
                <p className="text-[11px] text-slate-400 leading-relaxed">{c.descricao}</p>

                {/* Bônus de atributo é SEMPRE o alocador (autor, 2026-07-29).
                    Os dois dropdowns "+2 em / +1 em" saíram: o alocador mostra
                    os seis atributos de uma vez, é a mesma linguagem do resto do
                    builder, e permite espalhar os 3 pontos como +1/+1/+1 em vez
                    de travar em dois atributos. */}
                {/* ⚠ `semEnergiaNao` some com o alocador para o Restringido. O
                    Bônus em Atributo dos Gêmeos diz "2 pontos para distribuir.
                    Caso um deles seja restringido, AO INVÉS DISSO, apenas seus
                    atributos físicos são aumentados em 1": os dois casos são
                    excludentes, e deixar o alocador na tela ofereceria pontos
                    que o `resolveOrigemAttrBonus` recusa a somar. */}
                {c.bonus?.distribuir && !(c.bonus.semEnergiaNao && draft.core.tipo === "restringido") && (
                  <AlocadorDeAtributo
                    titulo={`Distribuir · máx ${c.bonus.maxPorAtributo}/atributo`}
                    chaves={c.bonus.entre}
                    valorDe={(k) => bonusMap[k] || 0}
                    maxDe={(k) => Math.min(c.bonus.maxPorAtributo, (bonusMap[k] || 0) + (c.bonus.distribuir - distribUsado))}
                    onChange={setDistrib}
                    usado={distribUsado}
                    total={c.bonus.distribuir}
                  />
                )}

                {/* alocação com pool próprio (Ápice Corporal Humano) */}
                {c.alocacao && (() => {
                  const aloc = c.alocacao;
                  const pool = draft.core.origem?.pools?.[aloc.id] || {};
                  const total = totalDaAlocacao(aloc, nd);
                  const usado = usoDaAlocacao(aloc, pool);
                  return (
                    <AlocadorDeAtributo
                      titulo={`A cada ${aloc.porNivel} níveis · +${aloc.valor} por pega`}
                      chaves={aloc.entre}
                      passo={aloc.valor}
                      valorDe={(k) => pool[k] || 0}
                      /* ⚠ O teto POR ATRIBUTO é opcional e vem da alocação. Sem
                         ele o jogador põe os 4 pontos do pós-morte todos na
                         Força, e o texto diz "2 em um mesmo atributo". */
                      maxDe={(k) => Math.min(
                        aloc.maxPorAtributo ?? Infinity,
                        (pool[k] || 0) + (total - usado) * aloc.valor,
                      )}
                      onChange={(k, v) => setOrigemPool(aloc.id, k, v)}
                      usado={usado}
                      total={total}
                      vazio={total === 0 ? `Abre no nível ${aloc.porNivel}` : null}
                    />
                  );
                })()}

                {/* progressão por nível, quando a característica tem degraus */}
                {c.niveis?.length > 0 && (
                  <ol className="space-y-1">
                    {c.niveis.map((n) => {
                      const aberto = nd >= n.nd;
                      return (
                        <li key={n.nd} className="flex items-start gap-2 text-[11px] leading-relaxed">
                          <span className={`font-mono font-bold tabular-nums w-6 flex-shrink-0 text-right ${aberto ? "text-purple-300" : "text-slate-700"}`}>
                            {n.nd}
                          </span>
                          <span className={aberto ? "text-slate-300" : "text-slate-600"}>{n.texto}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {/* escolhas aninhadas (Treinamentos de Clã, Empenho Implacável) */}
                {escolhas.map((esc) => {
                  const estado = porEscolha[esc.id];
                  if (!estado) return null;               // degrau ainda fechado no ND
                  return (
                    <EscolhaDobravel
                      key={esc.id}
                      titulo={escolhas.length > 1 ? esc.label : "Escolha"}
                      escolha={esc}
                      estado={estado}
                      onToggleOpcao={(opcaoId) => toggleEscolhaOrigem(esc.id, opcaoId)}
                    />
                  );
                })}

                {/* Características de Anatomia (Físico Amaldiçoado) */}
                {c.poolAnatomia && (
                  <div className="border-t border-slate-800 pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">Características de Anatomia</span>
                      <span className={`text-[11px] font-mono tabular-nums ${anatomiasSel.length > anatTotal ? "text-rose-400" : "text-purple-300"}`}>
                        {anatomiasSel.length} / {anatTotal}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {ANATOMIAS.map((an) => {
                        const sel = anatomiasSel.includes(an.id);
                        const full = anatomiasSel.length >= anatTotal;
                        return (
                          <button
                            key={an.id}
                            type="button"
                            disabled={!sel && full}
                            onClick={() => toggleAnatomia(an.id)}
                            aria-pressed={sel}
                            className={`w-full text-left rounded-md border px-2 py-1.5 transition-colors flex gap-2 ${
                              sel
                                ? "border-purple-700 bg-purple-950/40"
                                : full
                                  ? "border-slate-800/60 bg-transparent cursor-not-allowed"
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
                            <span className={`text-[11px] leading-relaxed ${full && !sel ? "text-slate-600" : "text-slate-400"}`}>
                              <span className={`font-semibold ${sel ? "text-purple-200" : "text-slate-300"}`}>{an.nome}.</span>
                              {" "}{an.descricao}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Característica que o Motor cobre EM PARTE: a parcela que
                    aplica já está no número, e o resto fica dito aqui em vez de
                    passar por automatizado. Substituiu o selo de `grants`, que
                    anunciava concessão que o motor não entregava (2026-07-29). */}
                {c.parcial && (
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-400">
                    <AlertTriangle className="w-3 h-3 mt-px flex-shrink-0" aria-hidden="true" />
                    <span className="leading-relaxed">{c.parcial}</span>
                  </div>
                )}

                {/* contador de uma marcação que mora em outra aba (Feitiço Focado) */}
                {c.contador && (
                  <OrigemChip tom="amber">
                    {`${c.contador.nome}: ${c.contador.niveis.filter((n) => nd >= n).length}`}
                  </OrigemChip>
                )}

                {/* lembrete roxo: característica com continuação a fazer depois */}
                {c.continuacao && (
                  <div className="flex items-start gap-1.5 text-[11px] text-purple-300 bg-purple-950/30 border border-purple-800/60 rounded px-2 py-1.5">
                    <span aria-hidden="true">✎</span>
                    <span>Continuação pendente, completar na aba de Habilidades.</span>
                  </div>
                )}
              </CaracteristicaPainel>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* Uma escolha aninhada de origem, DOBRADA por padrão.
   O Empenho Implacável do Sem Técnica tem oito escolhas, e três delas oferecem
   as dezessete perícias: aberto de uma vez são mais de cem botões numa tela só.
   Fechada, a linha mostra o que já foi escolhido e quanto falta, que é o que
   interessa depois da primeira vez. */
function EscolhaDobravel({ titulo, escolha, estado, onToggleOpcao }) {
  const [open, setOpen] = useState(false);
  const nomes = estado.opcoes
    .map((oid) => escolha.opcoes.find((o) => o.id === oid)?.nome)
    .filter(Boolean);
  const falta = estado.vagas - estado.gasto;

  return (
    <div className="border-t border-slate-800 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left group"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-slate-300">{titulo}</span>
        <span className={`text-[11px] font-mono tabular-nums ml-auto ${estado.excedeu ? "text-rose-400" : falta > 0 ? "text-amber-300" : "text-purple-300"}`}>
          {estado.gasto} de {estado.vagas}
        </span>
      </button>

      {!open && nomes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 pl-[22px]">
          {nomes.map((n, i) => <OrigemChip key={i} tom="purple">{n}</OrigemChip>)}
        </div>
      )}

      {open && (
        <div className="mt-1.5">
          <OpcoesDeEscolha
            escolha={escolha}
            opcoesEscolhidas={estado.opcoes}
            escolhida
            onToggleOpcao={onToggleOpcao}
          />
        </div>
      )}
    </div>
  );
}

/* Alocador de pontos de atributo em grade. Serve aos dois casos: a distribuição
   livre do bônus de origem (passo 1) e a alocação com pool próprio do Ápice
   Corporal Humano (passo 2). */
function AlocadorDeAtributo({ titulo, chaves, passo = 1, valorDe, maxDe, onChange, usado, total, vazio }) {
  const lista = chaves ? AFTY_ATTRS.filter((a) => chaves.includes(a.key)) : AFTY_ATTRS;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{titulo}</span>
        <span className={`text-[11px] font-mono tabular-nums ${usado > total ? "text-rose-400" : "text-purple-300"}`}>
          {usado} / {total}
        </span>
      </div>
      {vazio ? (
        <div className="text-[11px] text-slate-600 border border-dashed border-slate-800 rounded px-2 py-1.5">{vazio}</div>
      ) : (
        <div className={`grid gap-2 ${lista.length > 3 ? "grid-cols-3" : "grid-cols-3"}`}>
          {lista.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-1.5 bg-slate-950/50 border border-slate-800 rounded px-2 py-1">
              <span className="text-[11px] font-bold text-slate-400">{a.abbr}</span>
              <div className="w-[84px]">
                <NumberInput
                  value={valorDe(a.key)}
                  onChange={(v) => onChange(a.key, v)}
                  min={0}
                  max={maxDe(a.key)}
                  step={passo}
                  aria-label={`Bônus em ${a.label}`}
                />
              </div>
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
  // O limite vem do MOTOR, não da ficha (2026-07-29): `derived.attrLimiteEfetivo`
  // já soma o padrão, a Origem, o Desenvolvimento e o canal `limiteAtributo`.
  // Ler `draft.attrLimite` aqui era o que fazia o pool de nível de um Restringido
  // parar no 20 mesmo com o limite dele valendo 30.
  const resumo = resumoAtributos(draft, derived.attrLimiteEfetivo, derived.attrPerda);
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

  // Pool de LIMITE (Maldição): sobe só o teto, e não o valor. O contador conta
  // ESCOLHAS, e cada uma vale o degrau declarado na origem.
  const poolLim = origemPoolLimite(draft.core.origem?.id);
  const limites = draft.core.origem?.limites || {};
  const limTotal = poolLim ? limitePoolTotal(draft.core.nd ?? 1, poolLim.porNivel) : 0;
  const limUsado = limitePoolUsado(limites);
  const limRestante = limTotal - limUsado;
  const setLimite = (key, val) => {
    const cur = { ...limites };
    if (val) cur[key] = val; else delete cur[key];
    patchCore({ origem: { ...draft.core.origem, limites: cur } });
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
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" /> {w}
            </li>
          ))}
        </ul>
      )}

      {/* tabela compacta de atributos

          ⚠ SEM `overflow-hidden` (2026-07-30). Ele estava aqui só para o fundo do
          cabeçalho respeitar o canto arredondado, e cortava o hover de fontes das
          duas ÚLTIMAS linhas (Sabedoria e Presença): o painel abre para baixo
          (`top-full`), passava da borda de baixo da tabela e era recortado, o que
          deixava as fontes desses dois atributos impossíveis de ler.

          Quem arredonda agora é o próprio cabeçalho, que é o único filho com
          fundo. As linhas têm só `border-t`, então o canto de baixo não tem nada
          para recortar. */}
      <div className="mt-3 border border-slate-800 rounded-lg">
        {/* cabeçalho (desktop) */}
        <div className="hidden sm:grid grid-cols-[1.4fr_1.1fr_1.1fr_0.8fr_0.6fr] gap-3 px-3 py-2 bg-slate-950 rounded-t-lg text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Atributo</span>
          <span className="text-center">Base</span>
          <span className="text-center">Nível</span>
          <span className="text-center">Efetivo</span>
          <span className="text-center">Limite</span>
        </div>

        {AFTY_ATTRS.map((a) => {
          const base = draft.attributes[a.key];
          const niv = draft.attrNivel?.[a.key] || 0;
          const effLim = derived.attrLimiteEfetivo[a.key]; // limite EFETIVO (Origem + Desenv + Motor)
          const efetivo = derived.attrEff[a.key];     // valor EFETIVO, já aparado no limite
          const m = derived.mods[a.key];              // modificador EFETIVO
          const bonus = derived.attrBonus[a.key] || 0;
          const dev = derived.attrDesenv[a.key] || 0;
          const perdido = derived.attrPerda?.[a.key] || 0;
          // O pool de nível reserva espaço para TODA fonte concedida que apara no
          // limite: origem, Desenvolvimento e Motor. A convenção do projeto é a
          // concessão ter prioridade e o ponto alocado voltar ao pool, e o Motor
          // entrou nessa conta em 2026-07-29 (antes ele furava o limite, então não
          // havia espaço para reservar).
          const reservado = bonus + dev + (derived.attrMotor?.[a.key] || 0);
          const nivMax = Math.max(niv, Math.min(niv + nivelRestante, effLim - base - reservado));
          const miniLbl = "text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:hidden";
          // Chips de fonte. VERDE = concedido de fora e grátis (a convenção do
          // builder inteiro), ÂMBAR = o ponto que o limite comeu.
          //
          // ⚠ As parcelas do MOTOR ficam DE FORA (autor, 2026-07-29): elas eram
          // chip aqui e viravam paredão, porque uma fonte repetível emite uma
          // entrada por pega ("+1 Treino de Atributo (Inteligência)" quatro
          // vezes). O hover é o lugar delas, e é mais compacto. Aqui ficam só as
          // fontes de linha única, que são as três de baixo.
          const chips = [
            ...(bonus ? [{ txt: `+${bonus} Origem`, cor: "text-emerald-400" }] : []),
            ...(dev ? [{ txt: `+${dev} Desenvolvimento`, cor: "text-emerald-400" }] : []),
            ...(derived.attrEquip?.[a.key] ? [{ txt: `+${derived.attrEquip[a.key]} Equipamento`, cor: "text-emerald-400" }] : []),
            ...(perdido ? [{ txt: `−${perdido} no limite`, cor: "text-amber-400" }] : []),
          ];
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
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    {chips.map((c, i) => (
                      <span key={i} className={`text-[9px] ${c.cor}`}>{c.txt}</span>
                    ))}
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

              {/* efetivo (hover com TODAS as fontes, inclusive as do Motor) */}
              <div className="flex flex-col gap-0.5 sm:items-center">
                <span className={miniLbl}>Efetivo</span>
                <div className="relative group flex items-baseline gap-1.5 cursor-help">
                  <span className={`font-mono font-extrabold text-lg tabular-nums leading-none ${
                    perdido > 0 ? "text-amber-300" : "text-white"
                  }`}>{efetivo}</span>
                  <span className="font-mono text-[11px] text-purple-300">{m >= 0 ? `+${m}` : m}</span>
                  <PainelDeFontes partes={derived.partesAtributo?.[a.key]} total={efetivo} />
                </div>
              </div>

              {/* limite (padrão + Origem + Desenvolvimento + Motor) */}
              <div className="flex flex-col gap-0.5 sm:items-center">
                <span className={miniLbl}>Limite</span>
                <span className="relative group cursor-help">
                  <span className={`font-mono text-sm tabular-nums ${
                    effLim > ATTR_LIMITE_PADRAO ? "text-emerald-300" : "text-slate-400"
                  }`}>{effLim}</span>
                  <PainelDeFontes partes={derived.partesLimite?.[a.key]} total={effLim} />
                </span>
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

      {/* Pool de limite da Maldição. Mesma anatomia do Desenvolvimento, e a
          diferença está no rótulo: aqui o ponto abre espaço, não preenche. */}
      {poolLim && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Aumento de Limite
              <span className="normal-case tracking-normal text-slate-500 ml-1.5">
                · +{poolLim.valor} no limite por escolha
              </span>
            </div>
            <span className={`text-[11px] font-mono tabular-nums ${limUsado > limTotal ? "text-red-400" : "text-slate-400"}`}>
              {limUsado} / {limTotal}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AFTY_ATTRS.map((a) => {
              const n = limites[a.key] || 0;
              return (
                <div key={a.key} className="flex items-center justify-between gap-2 bg-slate-950/50 border border-slate-800 rounded px-2 py-1.5">
                  <span className="text-[11px] font-bold text-slate-400">{a.abbr}</span>
                  <div className="w-[92px]">
                    <NumberInput value={n} onChange={(v) => setLimite(a.key, v)} min={0} max={n + limRestante} aria-label={`Aumento de limite em ${a.label}`} />
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
  // ⚠ A trava vale nos DOIS sentidos (autor, 2026-08-03), então a lista de
  // Tipos também esconde o Restringido para quem não tem a origem.
  const tipoTravado = tipoObrigatorio(draft.core.origem?.id);
  const tipos = tiposDisponiveis(draft.core.origem?.id);
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
              options={tipos}
              disabled={!!tipoTravado}
            />
          </div>
          <div>
            <FieldLabel required>Patamar</FieldLabel>
            <Select value={draft.core.patamar} onChange={(v) => patchCore({ patamar: v })} options={AFTY_PATAMARES} />
          </div>
          {/* Restringido não tem energia amaldiçoada, então não há quantidade
              dela para escolher. */}
          {draft.core.tipo !== "restringido" && (
            <div>
              <FieldLabel>Quantidade de PE</FieldLabel>
              <Select value={draft.qntPE} onChange={(v) => patch({ qntPE: v })} options={AFTY_QNT_PE} />
            </div>
          )}
          {/* A Integridade da Alma saiu do formulário (autor, 2026-07-29): o
              Máximo já diz tudo, e a ficha é montada com a alma íntegra. O valor
              corrente nasce cheio, no combatState, e só o jogo o mexe. */}
          <div>
            <FieldLabel>Máximo da Alma</FieldLabel>
            <div className="h-9 bg-slate-950/60 border border-slate-800 rounded px-3 flex items-center text-sm font-mono text-purple-300">
              {derived.almaMax}
            </div>
          </div>
          {/* O Atributo da Técnica saiu daqui em 2026-07-29: era o MESMO campo
              (`core.tecnicaAttr`) editável em dois lugares. Ficou no Perfil
              Amaldiçoado (aba Habilidades), ao lado da CD de Feitiçaria que ele
              move, onde a troca mostra efeito na hora. */}
          <div>
            <FieldLabel>Maestria</FieldLabel>
            <div className="h-9 bg-slate-950/60 border border-slate-800 rounded px-3 flex items-center text-sm font-mono text-purple-300">
              +{derived.maestria}
            </div>
          </div>
        </div>
        {/* O contador de Níveis de Aptidão saiu daqui em 2026-07-29: era
            duplicata do card da aba Aptidões, que é onde os níveis são alocados.
            Orçamento mora junto do que ele paga, não numa vitrine à parte. */}
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
function TreinoEtapas({ linha, progresso, attrEff, nd, ctxReq, onSet, readOnly = false }) {
  const completa = !readOnly && progresso >= ETAPAS_POR_LINHA;
  return (
    <>
      <div className="pl-1.5 space-y-0.5">
        {linha.etapas.map((et) => {
          const done = !readOnly && et.n <= progresso;
          const isNext = !readOnly && et.n === progresso + 1;
          const locked = !readOnly && et.n > progresso + 1;
          const req = avaliarRequisito(et.requisito, { attrEff, nd, ...ctxReq });
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

/* O rótulo do alvo mora no motor (`rotuloAlvo` em afty-treinamentos.js), porque
   o nome do treino no hover de fontes usa o mesmo. */
const alvoLabelDe = rotuloAlvo;

/* Opções de alvo de uma linha repetível que ainda não foram treinadas.

   O pool da ARMA é o INVENTÁRIO, e não o catálogo de 52: o treino é numa arma
   que a criatura tem. Vale a arma CARREGADA, e não só a equipada, porque
   treinar não é empunhar. A lista já vem sem repetição, que é o que sobra de
   duas entradas do mesmo modelo (duas Adagas são uma opção só). */
function opcoesDeAlvo(linha, instances, pericias = AFTY_PERICIAS, armas = []) {
  const usados = new Set(instances.map((i) => i.alvo));
  if (linha.alvoTipo === "atributo") {
    return AFTY_ATTRS.filter((a) => !usados.has(a.key)).map((a) => ({ value: a.key, label: a.label }));
  }
  if (linha.alvoTipo === "pericia") {
    return pericias.filter((p) => !usados.has(p.id)).map((p) => ({ value: p.id, label: p.nome }));
  }
  if (linha.alvoTipo === "arma") {
    const vistos = new Set();
    const out = [];
    for (const a of armas) {
      if (usados.has(a.id) || vistos.has(a.id)) continue;
      vistos.add(a.id);
      out.push({ value: a.id, label: a.nome });
    }
    return out;
  }
  return null;   // texto livre
}

/* Uma Linha de Treinamento. Não repetível → uma trilha só. Repetível → várias
   instâncias, cada uma com um alvo distinto (atributo/perícia/arma). */
function TreinoLinha({ linha, valor, attrEff, nd, ctxReq, onSetProgresso, onSetInstance, pericias, armas }) {
  const repetivel = !!linha.repetivel;
  const progresso = repetivel ? 0 : (Number(valor) || 0);
  const completa = !repetivel && progresso >= ETAPAS_POR_LINHA;
  const instances = repetivel && Array.isArray(valor) ? valor : [];
  const ativo = repetivel ? instances.length > 0 : progresso > 0;

  const [open, setOpen] = useState(repetivel ? instances.length > 0 : (progresso > 0 && !completa));
  const [novoTexto, setNovoTexto] = useState("");

  const usados = new Set(instances.map((it) => String(it.alvo).toLowerCase()));
  // `null` = alvo de texto livre (nenhuma linha usa mais, mas o caminho fica
  // para uma linha nova nascer sem catálogo). Atributo, Perícia e Arma saem do
  // catálogo, já sem os que a criatura treinou.
  const alvoOptions = opcoesDeAlvo(linha, instances, pericias, armas);
  // Pool vazio tem duas causas, e a mensagem muda: ou tudo já foi treinado, ou
  // não havia o que treinar (nenhuma arma no inventário).
  const poolVazio = linha.alvoTipo === "arma" && (armas?.length ?? 0) === 0
    ? "Nenhuma arma no inventário."
    : "Tudo já foi treinado nesta linha.";
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
                        {alvoLabelDe(linha, inst.alvo, pericias, armas)}
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
                        title={`Remover treino de ${alvoLabelDe(linha, inst.alvo, pericias, armas)}`}
                        aria-label={`Remover treino de ${alvoLabelDe(linha, inst.alvo, pericias, armas)}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TreinoEtapas
                      linha={linha}
                      progresso={inst.progresso}
                      attrEff={attrEff}
                      nd={nd}
                      ctxReq={ctxReq}
                      onSet={(p) => onSetInstance(linha.id, inst.alvo, p)}
                    />
                  </div>
                );
              })}

              {/* sem treinos ainda: prévia consultável das etapas + Completo */}
              {instances.length === 0 && (
                <TreinoEtapas linha={linha} progresso={0} attrEff={attrEff} nd={nd} ctxReq={ctxReq} readOnly />
              )}

              {/* zona de adicionar novo alvo */}
              <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-700 bg-slate-950/30 px-2.5 py-2">
                <Plus className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {alvoOptions ? (
                  alvoOptions.length > 0 ? (
                    <div className="w-44">
                      <Select
                        value=""
                        onChange={(v) => v && onSetInstance(linha.id, v, 1)}
                        options={alvoOptions}
                        placeholder={`Treinar ${(linha.alvoLabel || "alvo").toLowerCase()}...`}
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">{poolVazio}</span>
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
              ctxReq={ctxReq}
              onSet={(p) => onSetProgresso(linha.id, p)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* Medidor do orçamento de Focos do interlúdio. Aparece igual nos DOIS cards da
   aba, pelo mesmo motivo do ContadorHabilidades: Linha de Treinamento e Treino
   Especial gastam o mesmo caixa, então o gasto de um lado tem de ser visível do
   outro. */
function ContadorFocos({ gastos, total, excedeu }) {
  return (
    <div
      className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
      title="Focos gastos / totais (ND + bônus de poderes). Linhas de Treinamento e Treinos Especiais dividem o mesmo orçamento"
    >
      <Dumbbell className="w-3 h-3 text-purple-400 flex-shrink-0" />
      <span className="text-[9px] uppercase tracking-wider text-slate-400">Focos</span>
      <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
        <span className={excedeu ? "text-rose-400" : "text-white"}>{gastos}</span>
        <span className="text-slate-600"> / </span>
        <span className="text-white">{total}</span>
      </span>
    </div>
  );
}

/* As três linhas do card de Treinos Especiais (a escolhida, a disponível e a
   "em breve") dividem UM esqueleto: quadrado de 20px, nome, chips, direita e
   chevron, tudo numa faixa de 36px. Sem isso o card virava duas listas
   empilhadas com alturas e recuos diferentes, que é o que estava feio.

   O recuo do corpo aberto é o mesmo: 10px de padding + 20px do quadrado + 10px
   do gap, então o texto começa alinhado com o nome. */
const LINHA_INTERLUDIO = "w-full flex items-center gap-2.5 px-2.5 h-9 text-left";
const CORPO_INTERLUDIO = "px-2.5 pb-2.5 pl-10";

/* Chip do que a pega concede. É RESULTADO (a vaga que entra no orçamento da aba
   Habilidades), e não explicação, então pode ficar na tela. Apagado enquanto o
   treino não foi escolhido, aceso depois. */
function ChipConcede({ texto, aceso }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-px rounded border whitespace-nowrap flex-shrink-0 ${
      aceso
        ? "border-purple-800/60 bg-purple-950/40 text-purple-300"
        : "border-slate-800 bg-slate-900/40 text-slate-500"
    }`}>
      {texto}
    </span>
  );
}

/* Uma linha de TREINO ESPECIAL (Interlúdios Adicionais). Não tem etapa nem
   progresso: é uma escolha REPETÍVEL, e cada pega custa Foco e concede uma
   coisa. Por isso a anatomia é a do HabilidadeGeralCard (quadrado que liga,
   nome, medidor de repetições, chevron) e não a do TreinoLinha: a interação é
   escolher e repetir, não avançar 4 etapas em ordem.

   O teste que o texto pede não aparece aqui de propósito: interlúdio que pede
   teste é sucesso automático para criaturas, então escolher já concede. O fato
   vive no `title` do botão, que é onde explicação de item mora.

   `max` vem de fora porque o teto depende do ND (1 + 1 a cada 5 ou 10 níveis),
   e quem tem o ND é a aba. */
function TreinoEspecialCard({ item, vezes, max, onSetVezes }) {
  const [open, setOpen] = useState(false);
  const escolhido = vezes > 0;
  const repetivel = max == null || max > 1;
  const focos = focosDoTreinoEspecial(item);
  // Preço enquanto não pegou, gasto depois: o número que interessa muda de um
  // estado para o outro, e os dois cabem no mesmo lugar.
  const custo = escolhido ? vezes * focos : focos;

  return (
    <div className={`rounded-lg border transition-colors ${
      escolhido ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      <div className={LINHA_INTERLUDIO}>
        <button
          type="button"
          onClick={() => onSetVezes(escolhido ? 0 : 1)}
          aria-pressed={escolhido}
          aria-label={`${escolhido ? "Remover" : "Escolher"} ${item.nome}`}
          title={escolhido
            ? "Remover"
            : "Escolher. Interlúdio que pede teste é sucesso automático para criaturas"}
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            escolhido
              ? "bg-purple-700 border-purple-600 text-white"
              : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhido ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-x-2 text-left overflow-hidden"
        >
          <span
            className={`text-[12px] font-semibold truncate ${escolhido ? "text-white" : "text-slate-200"}`}
            title={item.nome}
          >
            {item.nome}
          </span>
          <ChipConcede texto={item.concede} aceso={escolhido} />
        </button>

        <span
          className={`font-mono text-[11px] tabular-nums whitespace-nowrap flex-shrink-0 ${
            escolhido ? "text-purple-200" : "text-slate-500"
          }`}
          title={escolhido ? "Focos gastos neste treino" : "Focos por pega"}
        >
          {custo} Foco{custo > 1 ? "s" : ""}
        </span>

        {/* Medidor só depois de escolhido: o 1º segmento duplicaria o toggle.
            Acima de 6 vezes ele não cabe e vira contador, e sem teto nenhum o
            contador é a única saída (o medidor precisa de um máximo para
            desenhar os segmentos). */}
        {repetivel && escolhido && (
          max != null && max <= 6
            ? <VezesGauge vezes={vezes} max={max} nome={item.nome} onSet={onSetVezes} />
            : <ContadorCompacto value={vezes} min={1} max={max ?? undefined} onChange={onSetVezes} />
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </div>

      {open && (
        <div className={CORPO_INTERLUDIO}>
          <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
            {item.descricao}
          </p>
        </div>
      )}
    </div>
  );
}

/* O Treino Especial cujo texto de regra ainda não chegou. Mesmo esqueleto do
   TreinoEspecialCard, com o ícone ocupando o lugar do quadrado que liga: assim
   as colunas do card batem e a lista lê como uma só. */
function InterludioInfo({ icon: Icon, titulo, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={LINHA_INTERLUDIO}
      >
        <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border border-slate-800 text-slate-600">
          <Icon className="w-3 h-3" />
        </span>
        <span className="text-[12px] font-semibold text-slate-400 flex-1 min-w-0 truncate">{titulo}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 flex-shrink-0">
          em breve
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className={`${CORPO_INTERLUDIO} text-[11px] text-slate-400 leading-relaxed`}>{children}</div>
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
function NivelPicker({ value, concedido, restante, onChange, label, limite = APTIDAO_NIVEL_MAX }) {
  const efetivo = value + concedido;
  // ⚠ O teto é POR TRILHA, e não o 5 do sistema: a Versatilidade Extrema leva
  // uma delas a 6. O picker cresce um botão junto, senão o nível existiria no
  // motor e não teria onde ser clicado. Piso no efetivo para uma ficha que
  // perdeu a fonte do limite ainda desenhar o que ela tem.
  const teto = Math.max(APTIDAO_NIVEL_MAX, limite, efetivo);
  // Sempre dá para baixar até o piso concedido (inclusive se a ficha já
  // estourou o orçamento). Subir respeita o que sobra e o teto da trilha.
  const alcancavel = Math.max(efetivo, Math.min(limite, efetivo + restante));
  return (
    <div className="flex gap-px w-full" role="group" aria-label={label}>
      {Array.from({ length: teto + 1 }, (_, n) => {
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
function AptidaoCard({
  aptidao, escolhida, concedida, concessao = "origem", vezes = 0, maxVezes = 1,
  ctx, onToggle, opcaoAtual, onOpcao, opcoesRepetidas = [], onVezes, onOpcaoRepetida,
}) {
  const [open, setOpen] = useState(false);
  const reqs = (aptidao.requisitos || []).map((r) => avaliarRequisitoAptidao(r, ctx));
  const faltando = reqs.filter((r) => r.verificavel && !r.ok);
  // Já escolhida nunca trava: senão um requisito que deixou de ser
  // atendido prenderia a aptidão na ficha, sem como remover.
  const bloqueada = faltando.length > 0 && !escolhida;
  const valoresOpcao = aptidao.opcoes?.dinamicas === "tiposDano"
    ? Object.entries(TIPOS_DANO).map(([id, label]) => ({ id, label }))
    : aptidao.opcoes?.valores ?? [];
  // CONCEDIDA pela origem (o Domínio Simples do Sem Técnica): entra marcada, não
  // sai, não gasta orçamento e ignora o próprio pré-requisito. Mesma anatomia
  // verde do treino de perícia concedido na aba Perícias.

  return (
    <div className={`rounded-lg border transition-colors ${
      concedida
        ? "border-emerald-700 bg-emerald-950/30"
        : escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      {/* Altura FIXA: com ou sem chip de requisito, toda linha tem 32px.
          Antes ela era emergente (saía do elemento mais alto), então
          qualquer chip que passasse de 20px voltava a esticar o cartão. */}
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        {/* escolher (irmão do botão de abrir, não aninhado) */}
        <button
          type="button"
          onClick={onToggle}
          disabled={bloqueada || concedida}
          aria-pressed={escolhida || concedida}
          aria-label={`${escolhida ? "Remover" : "Escolher"} ${aptidao.nome}`}
          title={
            concedida
              ? `Concedida pela ${concessao === "especializacao" ? "Especialização" : "origem"}`
              : bloqueada
                ? `Requisito não atendido: ${faltando.map((r) => r.label).join(", ")}`
                : escolhida ? "Remover esta aptidão" : "Escolher esta aptidão"
          }
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            concedida
              ? "bg-emerald-700 border-emerald-600 text-white cursor-not-allowed"
              : escolhida
                ? "bg-purple-700 border-purple-600 text-white"
                : bloqueada
                  ? "border-slate-800 text-slate-700 cursor-not-allowed"
                  : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhida || concedida
            ? <Check className="w-3 h-3" />
            : bloqueada ? <Lock className="w-2.5 h-2.5" /> : <Plus className="w-3 h-3" />}
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
          {/* A concedida IGNORA o próprio requisito, então mostrá-lo seria
              mentira: o Domínio Simples pede BAR 1 e Nível 5, e a origem o
              entrega no 4 sem Barreira nenhuma. No lugar dele, o aviso de onde
              ela veio, na MESMA formatação dos requisitos (texto puro, sem
              caixa) e em verde, que é a cor de "concedido de fora" no resto da
              ficha. */}
          {concedida
            ? (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-medium whitespace-nowrap text-emerald-400 flex-shrink-0"
                title={`Concedida pela ${concessao === "especializacao" ? "Especialização" : "origem"}`}
              >
                {concessao === "especializacao" ? "Especialização" : "Origem"}
              </span>
            )
            : <RequisitoLista reqs={reqs} />}
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

      {/* Escolha do "um OU outro" (só a Superioridade Física). CHIPS, e não
          dropdown: são duas opções, e a regra desta aba é manter tudo à mostra.
          Só aparece com a aptidão escolhida, porque antes disso não há o que
          decidir. */}
      {escolhida && aptidao.opcoes && (
        <div className="flex flex-wrap items-center gap-1 px-2.5 pb-2.5 pl-[38px]">
          {valoresOpcao.map((v) => {
            const on = opcaoAtual === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpcao(on ? "" : v.id)}
                aria-pressed={on}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  on ? "bg-purple-700 text-white" : "bg-slate-800/70 text-slate-400 hover:text-white"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Cada aquisição de uma Aptidão repetível ocupa uma vaga e possui sua
          própria escolha. Aptidões concedidas continuam travadas como antes. */}
      {escolhida && !concedida && aptidao.repetivel && (
        <div className="border-t border-purple-900/40 px-2.5 py-2.5 pl-[38px] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">
                Aquisições {vezes} / {maxVezes}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onVezes(Math.max(0, vezes - 1))}
                className="w-7 h-7 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                aria-label={`Remover uma aquisição de ${aptidao.nome}`}
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-xs text-white tabular-nums">{vezes}</span>
              <button
                type="button"
                onClick={() => onVezes(vezes + 1)}
                disabled={vezes >= maxVezes}
                title={vezes >= maxVezes && ctx.nd < aptidao.repetivel.nivelAdicional
                  ? `Disponível no nível ${aptidao.repetivel.nivelAdicional}`
                  : undefined}
                className={`w-7 h-7 rounded border ${
                  vezes >= maxVezes
                    ? "border-slate-800 bg-slate-900 text-slate-700 cursor-not-allowed"
                    : "border-purple-700 bg-purple-900/50 text-purple-200 hover:bg-purple-800"
                }`}
                aria-label={`Adicionar uma aquisição de ${aptidao.nome}`}
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {Array.from({ length: vezes }, (_, indice) => (
              <div key={indice} className="flex flex-wrap items-center gap-1.5">
                <span className="w-20 text-[10px] text-slate-500">{indice + 1}ª aquisição</span>
                {aptidao.repetivel.opcoes.map((opcao) => {
                  const ativa = (opcoesRepetidas[indice] ?? "aumentar") === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => onOpcaoRepetida(indice, opcao.id)}
                      aria-pressed={ativa}
                      className={`text-[10px] px-2 py-1 rounded transition-colors ${
                        ativa ? "bg-purple-700 text-white" : "bg-slate-800/70 text-slate-400 hover:text-white"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
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
function TabEspecializacoes({ draft, derived, setEspecializacoes, toggleHabilidade, toggleEscolhaHabilidade, toggleTalento, setTalentoVezes, toggleEscolhaTalento, setMelhoriaVezes, toggleLendaria, toggleEscolhaAltoNivel, patchTecnicasCombate }) {
  const { escolhidas, total, max, obrigatoria } = derived.especializacoes;
  // A origem copiada em Verdadeiras Origens ABRE o que for exclusivo dela: o
  // Físico Abençoado do Restringido diz que dá acesso à Especialização
  // Restringido, e sem passar isso aqui a lista da tela negaria o que o
  // resolveEspecializacoes já aceita.
  const disponiveis = especializacoesDisponiveis(draft.core.origem?.id, origensQualificadas(draft));

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
    <HabilidadesEspecializacao draft={draft} derived={derived} toggleHabilidade={toggleHabilidade} toggleEscolhaHabilidade={toggleEscolhaHabilidade} toggleTalento={toggleTalento} setTalentoVezes={setTalentoVezes} toggleEscolhaTalento={toggleEscolhaTalento} patchTecnicasCombate={patchTecnicasCombate} />

    {/* Empolgação: some inteira sem a habilidade Base do Lutador. */}
    <EmpolgacaoCard derived={derived} />

    {/* ⚠ A Simulação de Combate MOROU AQUI até 2026-07-30, e mudou para a aba
        Cálculos a pedido do autor. Ela é bancada de balanceamento, então o lugar
        dela é do lado dos números que ela mexe, e não no meio das escolhas de
        especialização. É arranjo PROVISÓRIO: a ficha final vai exigir trabalho
        de verdade nela. */}

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

/* O que está travando esta habilidade, em uma frase. O nível de classe vem
   primeiro porque é o requisito mais comum; se ele está em dia, o culpado é
   um dos extras (outra habilidade, uma aptidão, um atributo mínimo). */
function motivoBloqueio(habilidade, acesso) {
  if (acesso.almaLivreOcupada) return "Alma Livre permite uma habilidade";
  if (!acesso.nivelOk && acesso.label) {
    return `Requer nível ${habilidade.nivel} em ${acesso.label.split(" ")[0]}`;
  }
  const faltando = (acesso.extras || []).filter((e) => !e.ok && e.label);
  if (faltando.length) return `Requer ${faltando.map((e) => e.label).join(", ")}`;
  return "Pré-requisito não atendido";
}

function TecnicasCombateEscolhas({ draft, escolhida, onPatch }) {
  const config = draft?.tecnicasCombate ?? {};
  const armas = Array.isArray(config.armas) ? config.armas.slice(0, 2) : [];
  const opcoes = catalogoDoTipo("arma", draft).map((a) => ({ value: a.id, label: a.nome }));
  const defineArma = (indice, id) => {
    const proxima = [...armas];
    proxima[indice] = id || null;
    onPatch({ armas: proxima.filter(Boolean) });
  };
  return (
    <div className="mt-2 border-t border-slate-800 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div>
        <FieldLabel>Arma 1</FieldLabel>
        <Select
          value={armas[0] ?? ""}
          onChange={(v) => defineArma(0, v)}
          options={[{ value: "", label: "Nenhuma" }, ...opcoes.filter((o) => o.value !== armas[1])]}
          disabled={!escolhida}
        />
      </div>
      <div>
        <FieldLabel>Arma 2</FieldLabel>
        <Select
          value={armas[1] ?? ""}
          onChange={(v) => defineArma(1, v)}
          options={[{ value: "", label: "Nenhuma" }, ...opcoes.filter((o) => o.value !== armas[0])]}
          disabled={!escolhida}
        />
      </div>
      <div>
        <FieldLabel>Atributo</FieldLabel>
        <OptionChips
          value={config.atributo === "sabedoria" ? "sabedoria" : "inteligencia"}
          onChange={(atributo) => onPatch({ atributo })}
          options={[
            { value: "inteligencia", label: "Inteligência" },
            { value: "sabedoria", label: "Sabedoria" },
          ]}
          disabledValues={!escolhida ? ["inteligencia", "sabedoria"] : undefined}
        />
      </div>
    </div>
  );
}

/* Medidor de repetição do Talento. Só aparece no Talento que o texto manda
   repetir E depois de escolhido: o 1º segmento duplicaria o botão de escolher,
   que é a mesma regra do card das Habilidades Gerais.

   ⚠ Não confundir com a repetição da ESCOLHA aninhada (Incremento de Atributo),
   que já é mostrada dentro do card e continua onde estava. */
function TalentoMedidor({ talento, vezes, max, onSetVezes }) {
  if (max <= 1 || vezes <= 0) return null;
  return max <= 6
    ? <VezesGauge vezes={vezes} max={max} nome={talento.nome} onSet={(v) => onSetVezes(talento.id, v)} />
    : <ContadorCompacto value={vezes} min={1} max={max} onChange={(v) => onSetVezes(talento.id, v)} />;
}

function HabilidadeCard({ habilidade, escolhida, concedida = false, acesso, nivelEspec, escolhaEstado, onToggleOpcao, extra, medidor }) {
  const [open, setOpen] = useState(false);
  // Já escolhida nunca trava: senão redividir a multiclasse prenderia a
  // habilidade na ficha, sem como remover (mesma regra do AptidaoCard).
  const bloqueada = !acesso.ok && !escolhida && !concedida;
  const reqExtras = (acesso.extras || []).filter((e) => e.label);
  // Estado da escolha aninhada: quantas opções liberadas e quais escolhidas.
  const opcoesEscolhidas = escolhaEstado?.opcoes || [];
  const allowance = escolhaEstado?.allowance ?? escolhasConcedidas(habilidade, nivelEspec);
  const excedeuEscolha = !!escolhaEstado?.excedeu;

  return (
    <div className={`rounded-lg border transition-colors ${
      concedida
        ? "border-emerald-700 bg-emerald-950/30"
        : escolhida ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
    }`}>
      {/* Altura FIXA de 32px, com ou sem chip (mesma lição do AptidaoCard). */}
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={habilidade.onToggle}
          disabled={bloqueada || concedida}
          aria-pressed={escolhida || concedida}
          aria-label={concedida ? `${habilidade.nome} concedida pela Especialização` : `${escolhida ? "Remover" : "Escolher"} ${habilidade.nome}`}
          title={
            // O rótulo diz o que REALMENTE falta. Antes ele sempre acusava o
            // nível de classe, porque `acesso.label` existe mesmo quando o
            // nível está em dia: um Lutador 20 sem Complementação Marcial era
            // informado de que precisava de "nível 6 em Lutador".
            // Talento não tem requisito de nível de classe (não vem com
            // `label`), só os extras, que já aparecem na linha.
            concedida
              ? "Concedida pela Especialização"
              : bloqueada
                ? motivoBloqueio(habilidade, acesso)
              : escolhida ? "Remover esta habilidade" : "Escolher esta habilidade"
          }
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
            concedida
              ? "bg-emerald-700 border-emerald-600 text-white cursor-not-allowed"
              : escolhida
                ? "bg-purple-700 border-purple-600 text-white"
              : bloqueada
                ? "border-slate-800 text-slate-700 cursor-not-allowed"
                : "border-slate-600 text-slate-500 hover:border-purple-600 hover:text-purple-300"
          }`}
        >
          {escolhida || concedida ? <Check className="w-3 h-3" /> : bloqueada ? <Lock className="w-2.5 h-2.5" /> : <Plus className="w-3 h-3" />}
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
            {concedida && (
              <span
                className="inline-flex items-center text-[10px] font-medium whitespace-nowrap text-emerald-400"
                title="Concedida pela Especialização"
              >
                Especialização
              </span>
            )}
            {/* Requisito de NÍVEL: só aparece quando falta, e diz quanto.
                Atendido, some — o nível já está no cabeçalho do grupo. */}
            {!acesso.nivelOk && !acesso.almaLivreOcupada && (
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

        {/* Medidor de repetição, no mesmo lugar em que ele fica no card das
            Habilidades Gerais: cabeçalho, antes da seta. */}
        {medidor}

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
          {extra}
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

function HabilidadesEspecializacao({ draft, derived, toggleHabilidade, toggleEscolhaHabilidade, toggleTalento, setTalentoVezes, toggleEscolhaTalento, patchTecnicasCombate }) {
  const {
    escolhidas, selecionadas, concedidas, escolhas, gastosNoComum, comum, exclusivasTalento, exclusivasUsadas,
    excedeu, niveisPorEspec,
  } = derived.habilidades;
  const especs = derived.especializacoes.escolhidas;
  const talentosEscolhidos = derived.talentos.escolhidas;
  const especializacoesAtuais = new Set(especs.map((e) => e.id));
  const almaLivreEspId = derived.habilidades.almaLivre?.especializacaoId;
  const especsVisiveis = almaLivreEspId && !especializacoesAtuais.has(almaLivreEspId)
    ? [...especs, { id: almaLivreEspId, nivel: derived.habilidades.almaLivre.nivel, almaLivre: true }]
    : especs;

  // Tabulada pelas especializações ESCOLHIDAS (1 ou 2), não pelas 6:
  // habilidade de especialização que a criatura não tem é ruído. Talentos são
  // uma aba a MAIS, sempre presente: qualquer classe pode pegá-los (autor,
  // 2026-07-22). Numa ficha Restringido a barra fica "Restringido | Talentos".
  const [espTab, setEspTab] = useState(null);
  // Abre na primeira que TEM catálogo: sem isso, uma multiclasse com uma
  // especialização ainda não transcrita abriria num card vazio, escondendo a
  // que tem conteúdo atrás dele. (Falta transcrever só o Restringido.)
  const comConteudo = especsVisiveis.filter((e) => gruposDeHabilidade(e.id).length > 0);
  const emTalentos = espTab === TALENTOS_TAB;
  const ativa = especsVisiveis.find((e) => e.id === espTab) ?? comConteudo[0] ?? especsVisiveis[0];

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
    aptidoes: derived.aptidoesEscolhidas ?? [],
    almaLivre: derived.habilidades.almaLivre,
  };
  // Talento lê o ND e a origem, nunca o nível de classe.
  const ctxTalento = {
    nd: derived.nd,
    attrEff: derived.attrEff,
    origemId: draft.core?.origem?.id ?? null,
    // A origem copiada em Verdadeiras Origens qualifica junto com a própria.
    origensQualificadas: origensQualificadas(draft),
    talentos: talentosEscolhidos,
    // Requisito de Aptidão (a Expansão de Estilo pede Domínio Simples). Sem
    // isto o chip sairia como não verificável em vez de travar.
    aptidoes: derived.aptidoesEscolhidas ?? [],
  };

  // Rótulo curto para a aba: "Base", "2°", "4°"... (o título longo não cabe).
  // Nos Talentos os grupos são "Gerais" e "de Origem".
  const rotuloGrupo = (g) =>
    g.id === "base"
      ? "Base"
      : g.titulo.replace("Habilidades de ", "").replace("Talentos ", "").replace(" Nível", "");
  const talentoParaTela = (talento) => talento.id === ALMA_LIVRE_TALENTO_ID
    ? {
        ...talento,
        escolha: {
          ...talento.escolha,
          opcoes: talento.escolha.opcoes.filter((o) => !especializacoesAtuais.has(o.especializacaoId)),
        },
      }
    : talento;

  return (
    <Card
      title="Habilidades de Especialização"
      headerRight={
        <div
          className="flex items-center gap-1.5 border border-slate-800 bg-slate-950/50 rounded-md px-2 py-1"
          title="Habilidades escolhidas / permitidas (vêm da Habilidade Geral Especialização)"
        >
          <GraduationCap className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Habilidades</span>
          <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
            <span className={excedeu ? "text-rose-400" : "text-white"}>{gastosNoComum}</span>
            <span className="text-slate-600"> / </span>
            <span className="text-white">{comum}</span>
          </span>
          {/* Vagas exclusivas de Talento aparecem SEPARADAS, mesma anatomia do
              ContadorHabilidades: somá-las ao contador faria parecer que sobra
              espaço para Habilidade de Especialização, e não sobra. */}
          {exclusivasTalento > 0 && (
            <span
              className="font-mono text-[11px] font-bold text-purple-300 tabular-nums"
              title="Vagas exclusivas de Talento, que não servem para Habilidade de Especialização"
            >
              +{exclusivasUsadas} / {exclusivasTalento}
            </span>
          )}
        </div>
      }
    >
      {/* Barra de abas: as especializações escolhidas + Talentos, sempre.
          Mesmo estilo da barra de categorias de Aptidões. Ao contrário das
          especializações, Talentos não mostra nível: o requisito deles é o ND,
          que já está no cabeçalho da ficha. */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3" role="tablist" aria-label="Especializações e Talentos">
        {especsVisiveis.map((e) => {
          const on = !emTalentos && e.id === ativa.id;
          return (
            <button
              key={e.id}
              role="tab"
              aria-selected={on}
              onClick={() => setEspTab(e.id)}
              title={e.almaLivre ? "Alma Livre" : undefined}
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
          Você escolheu mais habilidades do que o orçamento permite. Remova uma ou pegue a Habilidade Geral Especialização.
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
          {/* Abas de nível (Base, 2°, 4°...). Contador de escolhas pagas por aba:
              com as habilidades separadas em abas, o que foi pego nas OUTRAS
              some da vista, então o número devolve essa visibilidade. As
              concedidas pelo nível aparecem na lista, mas não entram neste
              contador porque não gastam vaga. */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 mb-3" role="tablist" aria-label="Níveis de habilidade">
            {grupos.map((g) => {
              const on = g.id === grupoAtivo.id;
              const lista = emTalentos ? talentosEscolhidos : selecionadas;
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
                  habilidade={{ ...talentoParaTela(h), onToggle: () => toggleTalento(h.id) }}
                  escolhida={talentosEscolhidos.includes(h.id)}
                  acesso={{ ...avaliarAcessoTalento(h, ctxTalento), nivelOk: true, faltam: 0 }}
                  escolhaEstado={derived.talentos?.escolhas?.porTal?.[h.id]}
                  onToggleOpcao={(opcaoId) => toggleEscolhaTalento(h.id, opcaoId)}
                  medidor={<TalentoMedidor
                    talento={h}
                    vezes={derived.talentos?.vezes?.[h.id] ?? 0}
                    max={derived.talentos?.maxVezes?.[h.id] ?? 1}
                    onSetVezes={setTalentoVezes}
                  />}
                />
              ) : (
                <HabilidadeCard
                  key={h.id}
                  habilidade={{ ...h, onToggle: () => toggleHabilidade(h.id) }}
                  escolhida={escolhidas.includes(h.id)}
                  concedida={concedidas.includes(h.id)}
                  acesso={avaliarAcessoHabilidade(h, ctx)}
                  nivelEspec={ativa.nivel}
                  escolhaEstado={escolhas?.porHab?.[h.id]}
                  onToggleOpcao={(opcaoId) => toggleEscolhaHabilidade(h.id, opcaoId)}
                  extra={h.id === "cnj_tecnicas_de_combate" ? (
                    <TecnicasCombateEscolhas
                      draft={draft}
                      escolhida={escolhidas.includes(h.id)}
                      onPatch={patchTecnicasCombate}
                    />
                  ) : null}
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

/* Simulação de Combate: a bancada de balanceamento (autor, 2026-07-28).
   Liga os estados e os números do Preview se mexem, sem precisar rodar a mesa.
   Cada linha só aparece se a criatura tiver a habilidade que a produz, então o
   card fica vazio (e some) para quem não tem nenhuma. */
function SimulacaoCombateCard({ derived, patchCombate }) {
  const combate = derived.combate;
  const escolhidas = derived.habilidades?.escolhidas ?? [];
  // As opções aninhadas escolhidas (Manobra de Empolgação, Estilo de Combate),
  // achatadas: é o que `requerEscolha` consulta.
  const opcoes = Object.values(derived.habilidades?.escolhas?.mapa ?? {}).flat();
  // Uma OPÇÃO também pode exigir escolha: das 8 Posturas, só aparecem as que a
  // criatura aprendeu. Linha que fica sem opção nenhuma some junto.
  const opcoesDe = (e) => {
    if (e.tipo === "dominio") {
      return (derived.dominios?.lista ?? []).map((d) => ({
        id: d.id,
        label: d.nome || "Domínio Sem Nome",
      }));
    }
    return (e.opcoes ?? []).filter((o) => !o.requerEscolha || opcoes.includes(o.requerEscolha));
  };
  // `requerHabilidade` aceita lista: Ataque Inconsequente existe no Lutador e no
  // Restringido com o mesmo texto, e ter qualquer uma das duas mostra a linha.
  const temHabilidade = (req) =>
    (Array.isArray(req) ? req : [req]).some((id) => escolhidas.includes(id));
  const talentos = derived.talentos?.escolhidas ?? [];
  const aptidoes = derived.aptidoesEscolhidas ?? [];
  const linhas = [
    ...COMBATE_ESTADOS.filter((e) => {
      const temDono = e.requerEscolha ? opcoes.includes(e.requerEscolha)
        : e.requerTalento ? talentos.includes(e.requerTalento)
        : e.requerAptidao ? aptidoes.includes(e.requerAptidao)
        : temHabilidade(e.requerHabilidade);
      return temDono && (!["opcao", "dominio"].includes(e.tipo) || opcoesDe(e).length > 0);
    }),
    // Estados que vêm da FICHA, e não do catálogo: as Habilidades Únicas de item
    // marcadas como ativas e a IMBUIÇÃO das Técnicas de Estilo. Não têm `requer*`
    // porque a própria existência do interruptor já depende do item estar
    // equipado, ou da Técnica estar conhecida.
    // ⚠ O `tipo` vem antes do espalhamento: a imbuição é `faixa` e o extra que
    // não declara nada continua caindo em `bool`.
    ...(combate.estadosExtras ?? []).map((e) => ({ tipo: "bool", ...e })),
  ];
  if (!linhas.length) return null;

  const visivel = (e) => !e.requerEstado || combate[e.requerEstado];
  return (
    <Card
      title="Simulação de Combate"
      headerRight={
        <BoolChip ativo={combate.ativo} onToggle={() => patchCombate({ ativo: !combate.ativo })}>
          Em Combate
        </BoolChip>
      }
    >
      <div className={`space-y-1 ${combate.ativo ? "" : "opacity-40 pointer-events-none"}`}>
        {linhas.filter(visivel).map((e) => {
          const teto = typeof e.max === "function" ? e.max(derived) : e.max;
          const valor = combate[e.id];
          const min = e.min ?? 0;
          const passo = Math.max(1, Math.trunc(Number(e.passo) || 1));
          return (
            <div
              key={e.id}
              className="rounded-lg border border-slate-800 bg-slate-950/40 flex items-center gap-2.5 px-2.5 min-h-10 py-1"
            >
              <span className="flex-1 min-w-0 text-[12px] font-semibold text-slate-100 truncate">{e.label}</span>
              {e.tipo === "bool" ? (
                <BoolChip ativo={!!valor} onToggle={() => patchCombate({ [e.id]: !valor })}>
                  {valor ? "Ativa" : "Inativa"}
                </BoolChip>
              ) : e.tipo === "multi" ? (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {opcoesDe(e).map((o) => {
                    const atuais = Array.isArray(valor) ? valor : [];
                    const ativo = atuais.includes(o.id);
                    const cheio = atuais.length >= (e.maxSelecionados ?? 0);
                    return (
                      <BoolChip
                        key={o.id}
                        ativo={ativo}
                        onToggle={() => patchCombate({
                          [e.id]: ativo ? atuais.filter((id) => id !== o.id) : cheio ? atuais : [...atuais, o.id],
                        })}
                      >
                        {o.label}
                      </BoolChip>
                    );
                  })}
                </div>
              ) : ["opcao", "dominio"].includes(e.tipo) ? (
                /* Exclusivas entre si: clicar na que já está ligada desliga. */
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {opcoesDe(e).map((o) => (
                    <BoolChip
                      key={o.id}
                      ativo={valor === o.id}
                      onToggle={() => patchCombate({ [e.id]: valor === o.id ? null : o.id })}
                    >
                      {o.label}
                    </BoolChip>
                  ))}
                </div>
              ) : (
                <VezesGauge
                  vezes={Math.max(0, Math.floor((valor - min) / passo))}
                  max={Math.max(0, Math.floor((teto - min) / passo))}
                  nome={e.label}
                  onSet={(n) => patchCombate({ [e.id]: min + n * passo })}
                />
              )}
              <span className="font-mono text-[13px] font-bold tabular-nums text-white w-6 text-right">
                {e.tipo === "faixa" ? valor : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* Empolgação (Lutador). O NÍVEL é estado de combate e a ficha não o guarda
   (autor, 2026-07-28), então o card é só leitura: a tabela de dados e o nível
   em que o combate começa. Empolgação Máxima troca a tabela inteira, e Lutador
   Superior começa um nível acima. */
function EmpolgacaoCard({ derived }) {
  const emp = derived.empolgacao;
  if (!emp?.ativa) return null;
  return (
    <Card
      title="Empolgação"
      headerRight={
        <span className="font-mono text-sm font-bold tabular-nums text-slate-200" title="Nível em que o combate começa">
          {emp.inicial} / {emp.max}
        </span>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {emp.tabela.map((l) => (
          <div
            key={l.nivel}
            className={`rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2 ${
              l.inicial ? "border-purple-700 bg-purple-950/30" : "border-slate-800 bg-slate-950/40"
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">Nível {l.nivel}</span>
            <span className="font-mono text-[13px] font-bold tabular-nums text-white">{l.dado}</span>
          </div>
        ))}
      </div>
    </Card>
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
  const itemComOpcoesResolvidas = (item) => {
    const opcoes = escolhas.opcoesPorItem?.[item.id];
    if (!item.escolha || !opcoes) return item;
    return { ...item, escolha: { ...item.escolha, opcoes } };
  };
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
              {/* Cadeado só quando a Habilidade Geral é o que falta. Se o ND
                  ainda não abriu a trilha (vagasND 0), a aba já mostra 0 / 0 e
                  apontar a Geral seria mandar pegar algo que o ND também tranca. */}
              {!r.destravado && r.vagasND > 0 && <Lock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
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

      {/* O catálogo NUNCA some, mesmo travado: escondê-lo prenderia na ficha o
          que já foi escolhido, sem como remover (é a mesma razão do "já
          escolhida nunca trava" nos cards). Travado, o aviso explica e o
          orçamento fica 0, então qualquer escolha acusa excesso. */}
      {!(emMelhorias ? melhorias : lendarias).destravado && (emMelhorias ? melhorias : lendarias).vagasND > 0 && (
        <p className="text-[11px] text-amber-400 mb-3 flex items-center gap-1.5">
          <Lock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          Requer a Habilidade Geral: {emMelhorias ? "Melhoria Superior" : "Habilidade Lendária"}
        </p>
      )}

      {(emMelhorias ? melhorias : lendarias).excedeu && (
        <p className="text-[11px] text-rose-400 mb-3">
          {(emMelhorias ? melhorias : lendarias).destravado
            ? "Você escolheu mais do que o orçamento permite. Remova uma ou aumente o ND."
            : `Remova o que escolheu ou pegue a Habilidade Geral: ${emMelhorias ? "Melhoria Superior" : "Habilidade Lendária"}.`}
        </p>
      )}

      <div className="space-y-1">
        {emMelhorias
          ? MELHORIAS_SUPERIORES.map((m) => {
              const vezes = vezesDe(m.id);
              return (
                <AltoNivelCard
                  key={m.id}
                  item={itemComOpcoesResolvidas(m)}
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
                item={itemComOpcoesResolvidas(l)}
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

function TabAptidoes({
  draft, derived, setAptidaoNivel, toggleAptidao, setAptidaoOpcao,
  setAptidaoVezes, setAptidaoOpcaoRepetida,
}) {
  // O motor resolve alocado + concedido (e devolve ao orçamento o que
  // não coube junto da concessão). A aba só exibe.
  // `limite` é por trilha: 5 mais o que o Motor somou no canal limiteAptidao.
  const { alocado, concedido, efetivo, gastos, limite } = derived.aptidao;
  // A Maldição não tem Energia Reversa, então a trilha nem aparece.
  const trilhas = derived.trilhasAptidao ?? APTIDAO_TRILHAS;
  const total = derived.totalAptidao;        // limiares de ND + Raio Negro + treinos "à sua escolha"
  const overBudget = gastos > total;
  const restante = total - gastos;

  // As CONCEDIDAS por nome pela origem (o Domínio Simples do Sem Técnica no ND
  // 4) entram marcadas e travadas, e NÃO gastam orçamento: quem concede pelo
  // nome já pagou. Só o que a ficha escolheu à mão cobra vaga.
  const concedidas = derived.aptidoesConcedidas ?? [];
  const concedidasPelaEspecializacao = new Set(derived.aptidoesConcedidasEspecializacao ?? []);
  const daFicha = Array.isArray(draft.aptidoesAmaldicoadas) ? draft.aptidoesAmaldicoadas : [];
  const vezesDe = (id) => daFicha.filter((x) => x === id).length;
  const gastasNaMao = daFicha.filter((id) => !concedidas.includes(id));
  // O requisito de "ter a aptidão X" enxerga as duas, senão a concedida não
  // destravaria a Anular Técnica, que pede Domínio Simples.
  const escolhidas = derived.aptidoesEscolhidas ?? daFicha;
  const totalAptidoes = derived.totalAptidoesAmaldicoadas;  // só da Habilidade Geral Aptidão
  const overAptidoes = gastasNaMao.length > totalAptidoes;
  // Contexto de requisito: nível de trilha EFETIVO (alocado + concedido).
  const ctx = {
    niveis: efetivo,
    nd: derived.nd,
    attrEff: derived.attrEff,
    escolhidas,
    origemId: draft.core?.origem?.id,
    origensQualificadas: origensQualificadas(draft),
    // Proficiência resolvida (escolhida + concedida pelo Motor), para os
    // requisitos de "Treinado em X" e "Mestre em X" travarem de verdade.
    periciaProf: derived.periciaProf,
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
        {/* As trilhas lado a lado no desktop; reempilham sozinhas quando aperta.
            São 5, ou 4 na Maldição (que não tem Energia Reversa), e a coluna
            acompanha para não sobrar buraco na fileira. As duas classes vêm
            literais porque o Tailwind lê o código-fonte. */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${
          trilhas.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"
        }`}>
          {trilhas.map((t) => (
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
                limite={limite[t.key]}
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
            title="Aptidões escolhidas / permitidas (vêm da Habilidade Geral Aptidão)"
          >
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Aptidões</span>
            <span className="font-mono text-xs font-bold tabular-nums whitespace-nowrap">
              <span className={overAptidoes ? "text-rose-400" : "text-white"}>{gastasNaMao.length}</span>
              <span className="text-slate-600"> / </span>
              <span className="text-white">{totalAptidoes}</span>
              {/* A concedida pela origem fica FORA do contador e aparece ao lado,
                  em verde, com a mesma leitura da faixa concedida em Perícias. */}
              {concedidas.length > 0 && (
                <span className="text-emerald-300"> +{concedidas.length}</span>
              )}
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
                  {aptidoes.map((ap) => {
                    const vezes = vezesDe(ap.id);
                    const maxVezes = ap.repetivel
                      ? (derived.nd >= ap.repetivel.nivelAdicional ? ap.repetivel.maxVezes : 1)
                      : 1;
                    return (
                      <AptidaoCard
                        key={ap.id}
                        aptidao={ap}
                        escolhida={escolhidas.includes(ap.id)}
                        concedida={concedidas.includes(ap.id)}
                        concessao={concedidasPelaEspecializacao.has(ap.id) ? "especializacao" : "origem"}
                        vezes={vezes}
                        maxVezes={maxVezes}
                        ctx={ctx}
                        onToggle={() => toggleAptidao(ap.id)}
                        opcaoAtual={(draft.aptidaoOpcoes || {})[ap.id]}
                        onOpcao={(v) => setAptidaoOpcao(ap.id, v)}
                        opcoesRepetidas={(draft.aptidaoOpcoesRepetidas || {})[ap.id] || []}
                        onVezes={(v) => setAptidaoVezes(ap.id, v)}
                        onOpcaoRepetida={(i, v) => setAptidaoOpcaoRepetida(ap.id, i, v)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {listaAtiva.map((ap) => {
              const vezes = vezesDe(ap.id);
              const maxVezes = ap.repetivel
                ? (derived.nd >= ap.repetivel.nivelAdicional ? ap.repetivel.maxVezes : 1)
                : 1;
              return (
                <AptidaoCard
                  key={ap.id}
                  aptidao={ap}
                  escolhida={escolhidas.includes(ap.id)}
                  concedida={concedidas.includes(ap.id)}
                  concessao={concedidasPelaEspecializacao.has(ap.id) ? "especializacao" : "origem"}
                  vezes={vezes}
                  maxVezes={maxVezes}
                  ctx={ctx}
                  onToggle={() => toggleAptidao(ap.id)}
                  opcaoAtual={(draft.aptidaoOpcoes || {})[ap.id]}
                  onOpcao={(v) => setAptidaoOpcao(ap.id, v)}
                  opcoesRepetidas={(draft.aptidaoOpcoesRepetidas || {})[ap.id] || []}
                  onVezes={(v) => setAptidaoVezes(ap.id, v)}
                  onOpcaoRepetida={(i, v) => setAptidaoOpcaoRepetida(ap.id, i, v)}
                />
              );
            })}
          </div>
        )}

        {overAptidoes && (
          <p className="text-[11px] text-rose-400 mt-3">
            Você escolheu mais Aptidões Amaldiçoadas do que o orçamento permite. Remova{" "}
            {gastasNaMao.length - totalAptidoes} ou pegue a Habilidade Geral Aptidão.
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

/* Motor de Automação da Habilidade Única: lista de efeitos {canal, alvo, expr,
   modo} que o jogador programa. `efeitos` chega RESOLVIDO (com valor e ok), a
   edição devolve só os campos de dado. Aplicado enquanto a Ferramenta está
   equipada.

   ⚠ Passou a usar o CanalPicker do Motor em 2026-07-30, com o catálogo inteiro de canais, no
   lugar do `<select>` de sete. A Habilidade Única é criada com o Narrador e não
   tinha por que escrever em menos canais que a Técnica. Foi o que destravou o
   Acerto, que a lista curta não tinha.

   O botão Ativa/Passiva decide onde o efeito vive (autor, 2026-07-30): passiva
   vale sempre, ativa vira um interruptor na bancada de Simulação de Combate.
   Depende do item, então é escolha por efeito, e não da fonte inteira. */
function MotorEfeitosEditor({
  efeitos, onChange, pericias, fontesDano, dslContexto, dslExtras,
}) {
  // A Habilidade Única lê o contexto normal da criatura mais as variáveis do
  // próprio item. `grau`, por exemplo, é o grau REAL da Ferramenta, não o grau
  // do feiticeiro. O seletor precisa mostrar exatamente os valores que a
  // expressão vai receber para servir de guia de verdade.
  const contextoItem = efeitos.find((e) => e?.contextoDsl)?.contextoDsl;
  // O grupo Marcas é de Addon, igual ao `useDslGrupos`.
  const contar = usePrimitiva("contar");
  const dslGrupos = useMemo(
    () => vocabularioDsl({ ...(dslContexto ?? {}), ...(contextoItem ?? {}) }, dslExtras, { contar }),
    [dslContexto, dslExtras, contextoItem, contar],
  );
  const bruto = () => efeitos.map((e) => ({
    canal: e.canal, ...(e.alvo ? { alvo: e.alvo } : {}), expr: e.expr,
    ...(e.modo === "ativa" ? { modo: "ativa" } : {}),
  }));
  const add = () => onChange([...bruto(), { canal: "defesa", expr: "" }]);
  const remove = (i) => onChange(bruto().filter((_, idx) => idx !== i));
  const patch = (i, partial) => onChange(bruto().map((e, idx) => {
    if (idx !== i) return e;
    const next = { ...e, ...partial };
    // Trocar de canal invalida o alvo antigo: o vocabulário é outro.
    if (partial.canal !== undefined) delete next.alvo;
    return next;
  }));
  return (
    <div className="space-y-1.5">
      <FieldLabel>Motor de Automação (efeitos enquanto equipada)</FieldLabel>
      {efeitos.map((ef, i) => {
        const chk = validateExpression(ef.expr || "");
        const alvos = alvoOpcoes(getCanal(ef.canal)?.alvo, pericias, fontesDano);
        return (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[170px_120px_minmax(130px,1fr)_auto_24px] items-start gap-2"
          >
            <div className="col-span-2 sm:col-span-1 min-w-0">
              <CanalPicker value={ef.canal} onChange={(v) => patch(i, { canal: v })} />
            </div>
            {alvos && (
              <div className="relative col-span-2 sm:col-span-1 min-w-0">
                <select
                  value={ef.alvo || ""}
                  onChange={(e) => patch(i, { alvo: e.target.value })}
                  className={MOTOR_SELECT_CLS}
                  aria-label="Alvo"
                >
                  <option value="">todos</option>
                  {alvos.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <MotorChevron />
              </div>
            )}
            {!alvos && <div className="hidden sm:block h-9" aria-hidden="true" />}
            <div className="col-span-2 sm:col-span-1 min-w-0">
              <CampoExpressao
                value={ef.expr}
                onChange={(v) => patch(i, { expr: v })}
                invalida={!!(ef.expr && !chk.ok)}
                placeholder="2 + piso(bt / 2)"
                rotulo="Expressão"
                grupos={dslGrupos}
                ancora="direita"
              />
              {ef.expr && (
                chk.ok
                  ? (ef.valor != null
                    ? <p className="text-[10px] text-emerald-400 mt-0.5">= {ef.valor}</p>
                    : null)
                  : <p className="text-[10px] text-rose-400 mt-0.5">{chk.error}</p>
              )}
            </div>
            <BoolChip
              ativo={ef.modo === "ativa"}
              onToggle={() => patch(i, { modo: ef.modo === "ativa" ? "passiva" : "ativa" })}
            >
              {ef.modo === "ativa" ? "Ativa" : "Passiva"}
            </BoolChip>
            <button
              type="button"
              onClick={() => remove(i)}
              className="justify-self-end text-slate-600 hover:text-rose-300 p-1 rounded flex-shrink-0"
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
function FerramentaEditor({
  entrada, onPatch, onToggleEnc, onRemove, pericias,
  fontesDano, dslContexto, dslExtras,
}) {
  const { tipo, def, fa } = entrada;
  const lista = ENCANTAMENTOS_POR_TIPO[tipo] ?? [];
  const beneficio =
    tipo === "arma" ? `Acerto +${fa.bonusArma}` :
    tipo === "escudo" ? `RD Geral +${(def.rdEscudo ?? 0) + fa.rdGrau}` :
    tipo === "uniforme" ? `Defesa +${defesaDaArmadura(def, fa.defesaGrau)}` : null;
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
        }`} title="Encantamentos escolhidos / permitidos no grau (acumulam entre os graus)">
          Encantamentos {fa.escolhidos.length}/{fa.permitidos}
        </span>
        {fa.vagasLivres > 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 font-mono"
            title="Vaga concedida pelo Treino de Manejo de Arma. O encantamento posto nela não desce o grau"
          >
            {fa.vagasLivres} {fa.vagasLivres > 1 ? "Vagas Livres" : "Vaga Livre"}
          </span>
        )}
        {fa.reduzido && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 font-mono"
            title="Cada encantamento desce um grau nas contas de Acerto, Dano, Defesa e RD"
          >
            Calcula como {fa.grauCalculoLabel}
          </span>
        )}
        {fa.penalidade !== 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono"
            title={fa.reducaoPenalidade
              ? "Penalidade em perícias de Destreza, já reduzida pelo encantamento"
              : "Penalidade em testes de perícia que usam Destreza"}
          >
            {fa.penalidade} Destreza
          </span>
        )}
        {fa.usaCargas && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono" title="Cargas de Encantamento, iguais ao bônus de treinamento do portador">
            Cargas {fa.cargas}
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
            pericias={pericias}
            fontesDano={fontesDano}
            dslContexto={dslContexto}
            dslExtras={dslExtras}
          />
        </div>
      )}
    </div>
  );
}

/** Uma linha do que está carregado (com o editor de Ferramenta, se aplicável). */
function LinhaCarregada({
  entrada, onPatch, onRemove, onToggleFerramenta, onPatchFerramenta,
  onToggleEncantamento, pericias, fontesDano, dslContexto, dslExtras,
}) {
  const { def, tipo, uid, qtd, equipado, fa } = entrada;
  // Arma entrou em 2026-08-01: ela passou a render Acerto por grau, e a linha de
  // dano dela só sai com a arma equipada.
  const equipavel = tipo === "arma" || tipo === "uniforme" || tipo === "escudo" || def?.efeito;
  const podeSerFerramenta = FA_TIPOS_EQUIP.includes(tipo);
  const ataqueFisico = def?.categoria === "distancia" || def?.categoria === "arremesso"
    ? "distancia"
    : "corpo";
  // ⚠ Pugilato (Faixas, Manoplas, Soco Inglês) NÃO escolhe jogada de ataque:
  // essas três não têm linha própria, elas são o Ataque Básico, e o básico
  // rola sempre o Corpo a Corpo. O seletor aparecia e gravava o campo sem
  // mudar número nenhum, que é pior do que não ter seletor.
  const escolheAtaque = tipo === "arma" && def?.grupo !== "pugilato";
  const ataqueOpcoes = ataqueFisico === "distancia"
    ? [{ value: "distancia", label: "A Distância" }, { value: "amaldicoado", label: "Amaldiçoado" }]
    : [{ value: "corpo", label: "Corpo a Corpo" }, { value: "amaldicoado", label: "Amaldiçoado" }];
  const [faOpen, setFaOpen] = useState(false);
  // Remover pede confirmação (autor, 2026-08-07). Mesmo padrão do FeiticoCard: o
  // X vira "Remover?" com ✓ e ✕, sem modal. Aqui ela pesa mais que numa linha
  // comum, porque a entrada carrega a Ferramenta Amaldiçoada inteira junto (grau,
  // encantamentos e a Habilidade Única escrita à mão), e nada disso volta.
  const [confirmDel, setConfirmDel] = useState(false);
  const temCondicaoSolar = def?.efeito?.condicao === "sol";

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
          {def?.evento && (
            <span className="ml-1.5 text-[9px] font-medium text-amber-300 align-middle">
              Evento · {def.exclusivoDe}
            </span>
          )}
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

        {def?.unico ? (
          <span className="text-[9px] font-medium text-amber-300 flex-shrink-0">Único</span>
        ) : (
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
        )}

        {confirmDel ? (
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-rose-300 whitespace-nowrap">Remover?</span>
            <button
              type="button"
              onClick={() => onRemove(uid)}
              className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
              title="Confirmar"
              aria-label={`Confirmar remoção de ${def?.nome}`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDel(false)}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800"
              title="Cancelar"
              aria-label="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-slate-600 hover:text-rose-400 hover:bg-rose-950/40"
            aria-label={`Remover ${def?.nome}`}
            title="Remover do inventário"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {escolheAtaque && (
        <div className="flex items-center gap-2 border-t border-slate-800/70 px-2.5 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 flex-shrink-0">Ataque</span>
          <OptionChips
            value={entrada.ataqueId ?? ataqueFisico}
            options={ataqueOpcoes}
            onChange={(ataqueId) => onPatch(uid, { ataqueId })}
          />
        </div>
      )}

      {temCondicaoSolar && (
        <div className="border-t border-slate-800/70 px-2.5 py-2 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">Condição</span>
            <button
              type="button"
              onClick={() => onPatch(uid, { solDireto: !entrada.solDireto })}
              aria-pressed={!!entrada.solDireto}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                entrada.solDireto
                  ? "border-amber-500/70 bg-amber-950/40 text-amber-200"
                  : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white"
              }`}
            >
              Sob o sol
            </button>
            <button
              type="button"
              onClick={() => onPatch(uid, { conjuntoSagradoCompleto: !entrada.conjuntoSagradoCompleto })}
              aria-pressed={!!entrada.conjuntoSagradoReunido}
              disabled={!!entrada.conjuntoSagradoAutomatico}
              title={entrada.conjuntoSagradoAutomatico ? "Reconhecido automaticamente pelos três itens carregados" : undefined}
              className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:cursor-default ${
                entrada.conjuntoSagradoReunido
                  ? "border-purple-500/70 bg-purple-950/40 text-purple-200"
                  : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white"
              }`}
            >
              3 tesouros reunidos
            </button>
            {equipado && entrada.solAtivo && (
              <span className="text-[10px] text-emerald-300 font-medium">+2 em todos os atributos ativo</span>
            )}
          </div>
        </div>
      )}

      {fa && faOpen && (
        <FerramentaEditor
          entrada={entrada}
          onPatch={(partial) => onPatchFerramenta(uid, partial)}
          onToggleEnc={(encId) => onToggleEncantamento(uid, encId)}
          onRemove={() => { onToggleFerramenta(uid); setFaOpen(false); }}
          pericias={pericias}
          fontesDano={fontesDano}
          dslContexto={dslContexto}
          dslExtras={dslExtras}
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
  const unicoJaAdicionado = !!def.unico && jaTem > 0;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40">
      <div className="flex items-center gap-2.5 px-2.5 h-8">
        <button
          type="button"
          onClick={() => onAdd(tipo, def.id)}
          disabled={unicoJaAdicionado}
          aria-label={`Adicionar ${def.nome}`}
          title={unicoJaAdicionado ? "Relíquia única já adicionada" : "Adicionar ao inventário"}
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border border-slate-600 text-slate-500 transition-colors hover:border-purple-600 hover:text-purple-300 disabled:opacity-35 disabled:hover:border-slate-600 disabled:hover:text-slate-500"
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
          {/* Arma criada pelo jogador. Ela fica no meio das do livro de
              propósito, porque é uma arma como as outras, mas precisa se
              anunciar: sem a marca não há como saber qual foi feita à mão.

              ⚠ Mesma anatomia do RequisitoChip (autor, 2026-08-07): texto solto,
              sem caixa nem borda. A versão anterior tinha fundo, borda e
              maiúsculas, e pesava mais que o nome da arma ao lado. */}
          {def.custom && (
            <span className="text-[10px] font-medium text-amber-400 whitespace-nowrap flex-shrink-0">
              Criada
            </span>
          )}
          {def.evento && (
            <span className="text-[10px] font-medium text-amber-400 whitespace-nowrap flex-shrink-0">
              Relíquia de {def.exclusivoDe}
            </span>
          )}
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
          {/* A Defesa da armadura é o custo dela, MENOS Sob Medida, que é a
              exceção declarada. Por causa dela o número volta a valer a pena. */}
          {tipo === "uniforme" && defesaDaArmadura(def) > 0 && (
            <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0">+{defesaDaArmadura(def)} Def</span>
          )}
          {tipo === "escudo" && (
            <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0">{def.rdEscudo} RD</span>
          )}
          {def.penalidade < 0 && (
            <span className="text-[10px] text-amber-400 font-mono flex-shrink-0" title="Penalidade em testes de perícia que usam Destreza">
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
          {/* Aviso, e não explicação: sem ele o jogador espera um número que a
              ficha não vai somar. */}
          {def.efeito && !def.efeito.aplicado && (
            <p className="text-[10px] text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span>Efeito não aplicado na ficha.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Só `derived`: o motor já devolve as entradas resolvidas (equip.entradas),
// com a definição do catálogo junto, então a aba não precisa do draft cru.
/* Uma propriedade no editor de arma custom: o botão que liga e desliga, mais o
   campo do parâmetro quando ela tem um.

   ⚠ O parâmetro NÃO é decoração. "Pesada" sem o número não trava ataque nenhum,
   "Fatal" sem o dado não muda crítico, e "Arremessável" sem alcance não diz a
   que distância. Ligar a propriedade já grava o valor padrão dela, senão o
   jogador sairia da tela com meia regra. */
function PropriedadeCustom({ prop, valor, onChange }) {
  const ligada = valor != null && valor !== false;
  const padrao = {
    dado: "1d6", tipo: "ct", numero: 1, alcance: [6, 18],
  }[prop.param] ?? true;

  return (
    <div className={`rounded border px-2 py-1.5 ${ligada ? "border-purple-800 bg-purple-950/20" : "border-slate-800 bg-slate-950/40"}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(ligada ? null : padrao)}
          aria-pressed={ligada}
          title={prop.descricao}
          className={`text-[11px] font-semibold transition-colors ${ligada ? "text-purple-200" : "text-slate-400 hover:text-white"}`}
        >
          {prop.nome}
        </button>
      </div>

      {ligada && prop.param === "dado" && (
        <div className="mt-1.5">
          <Select value={valor} onChange={onChange} options={ARMA_DADOS.map((d) => ({ value: d, label: d }))} />
        </div>
      )}
      {ligada && prop.param === "tipo" && (
        <div className="mt-1.5">
          <Select
            value={valor}
            onChange={onChange}
            options={Object.entries(TIPOS_DANO).map(([v, l]) => ({ value: v, label: l }))}
          />
        </div>
      )}
      {ligada && prop.param === "numero" && (
        <div className="mt-1.5">
          <NumberInput value={valor} onChange={onChange} min={1} max={30} />
        </div>
      )}
      {ligada && prop.param === "alcance" && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <NumberInput value={valor?.[0] ?? 6} onChange={(v) => onChange([v, valor?.[1] ?? v * 3])} min={1} max={999} />
          <NumberInput value={valor?.[1] ?? 18} onChange={(v) => onChange([valor?.[0] ?? 6, v])} min={1} max={9999} />
        </div>
      )}
    </div>
  );
}

/* Editor de UMA arma custom. Dobrado por padrão: a fileira de propriedades é
   longa, e o que interessa depois de criada é a linha de resumo. */
function ArmaCustomEditor({ arma, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(!arma.nome);
  // Confirmação igual à da linha do inventário, e aqui ela pesa MAIS: apagar a
  // arma custom leva junto TODA entrada do inventário que aponta para ela (ver
  // `removeArmaCustom`), com a Ferramenta Amaldiçoada de cada uma.
  const [confirmDel, setConfirmDel] = useState(false);
  const props = arma.props || {};
  const setProp = (id, v) => {
    const novo = { ...props };
    if (v == null) delete novo[id]; else novo[id] = v;
    onPatch({ props: novo });
  };
  const resumo = ARMA_PROPRIEDADES
    .filter((p) => props[p.id] != null && props[p.id] !== false)
    .map((p) => rotuloPropriedade(p.id, props[p.id]));

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-expanded={aberto}
          className="flex items-center gap-1.5 grow text-left group min-w-0"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${aberto ? "" : "-rotate-90"}`}
            aria-hidden="true"
          />
          <span className="text-[12px] font-bold text-slate-100 truncate">{arma.nome || "Arma sem Nome"}</span>
          <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
            {arma.dano?.dado} {TIPOS_DANO[arma.dano?.tipo] ?? ""}
          </span>
        </button>
        {confirmDel ? (
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-rose-300 whitespace-nowrap">Apagar?</span>
            <button
              type="button"
              onClick={onRemove}
              className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
              title="Confirmar"
              aria-label={`Confirmar exclusão de ${arma.nome || "arma sem nome"}`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDel(false)}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800"
              title="Cancelar"
              aria-label="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            title="Apagar a arma e tirá-la do inventário"
            className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-rose-300 hover:bg-rose-950/40 transition-colors flex-shrink-0"
          >
            Apagar
          </button>
        )}
      </div>

      {!aberto && resumo.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2">
          {resumo.map((r, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-400">{r}</span>
          ))}
        </div>
      )}

      {aberto && (
        <div className="px-3 py-2.5 space-y-2.5">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <TextInput value={arma.nome ?? ""} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da arma" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Classe</FieldLabel>
              <Select
                value={arma.classe}
                onChange={(v) => onPatch({ classe: v })}
                options={[{ value: "simples", label: "Simples" }, { value: "complexa", label: "Complexa" }]}
              />
            </div>
            <div>
              <FieldLabel>Categoria</FieldLabel>
              <Select value={arma.categoria} onChange={(v) => onPatch({ categoria: v })} options={ARMA_CATEGORIAS} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <FieldLabel>Dado</FieldLabel>
              <Select
                value={arma.dano?.dado}
                onChange={(v) => onPatch({ dano: { ...arma.dano, dado: v } })}
                options={ARMA_DADOS.map((d) => ({ value: d, label: d }))}
              />
            </div>
            <div>
              <FieldLabel>Tipo</FieldLabel>
              <Select
                value={arma.dano?.tipo}
                onChange={(v) => onPatch({ dano: { ...arma.dano, tipo: v } })}
                options={Object.entries(TIPOS_DANO).map(([v, l]) => ({ value: v, label: l }))}
              />
            </div>
            <div>
              <FieldLabel>Crítico</FieldLabel>
              <Select
                value={String(arma.critico)}
                onChange={(v) => onPatch({ critico: Number(v) })}
                options={ARMA_CRITICOS.map((c) => ({ value: String(c), label: `${c}+` }))}
              />
            </div>
          </div>

          {/* O dado de duas mãos só existe com Versátil, que é a propriedade que
              lhe dá sentido. Aparecer sem ela ofereceria um campo que o
              saneamento descarta na leitura seguinte. */}
          {props.versatil && (
            <div>
              <FieldLabel>Dado com Duas Mãos</FieldLabel>
              <Select
                value={arma.dano?.duasMaos ?? arma.dano?.dado}
                onChange={(v) => onPatch({ dano: { ...arma.dano, duasMaos: v } })}
                options={ARMA_DADOS.map((d) => ({ value: d, label: d }))}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <FieldLabel>Grupo</FieldLabel>
              <Select value={arma.grupo} onChange={(v) => onPatch({ grupo: v })} options={ARMA_GRUPOS} />
            </div>
            <div>
              <FieldLabel>Custo</FieldLabel>
              <Select
                value={String(arma.custo)}
                onChange={(v) => onPatch({ custo: Number(v) })}
                options={CUSTOS.map((c) => ({ value: String(c), label: `C${c}` }))}
              />
            </div>
            <div>
              <FieldLabel>Espaços</FieldLabel>
              <NumberInput value={arma.espacos} onChange={(v) => onPatch({ espacos: v })} min={0} max={10} />
            </div>
          </div>

          <div>
            <FieldLabel>Propriedades</FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ARMA_PROPRIEDADES.filter((p) => p.id !== "especial").map((p) => (
                <PropriedadeCustom key={p.id} prop={p} valor={props[p.id]} onChange={(v) => setProp(p.id, v)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Card das armas criadas pelo jogador. Fica ACIMA do catálogo porque uma arma
   criada aqui aparece lá embaixo na lista, e a ordem inversa esconderia o
   resultado da ação que o jogador acabou de fazer. */
function ArmasCustomCard({ armas, onAdd, onPatch, onRemove }) {
  return (
    <Card
      title="Armas Criadas"
      headerRight={
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-700/70 text-white hover:bg-purple-700 transition-colors"
        >
          Nova Arma
        </button>
      }
    >
      {armas.length === 0 ? (
        <p className="text-[11px] text-slate-600">Nenhuma arma criada.</p>
      ) : (
        <div className="space-y-1.5">
          {armas.map((a) => (
            <ArmaCustomEditor
              key={a.id}
              arma={a}
              onPatch={(partial) => onPatch(a.id, partial)}
              onRemove={() => onRemove(a.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/* Filtro por propriedade da arma. Dobrado por padrão, e a linha fechada carrega
   as marcadas: quem já escolheu não precisa reabrir para lembrar do que filtrou.

   ⚠ O botão de limpar SÓ existe quando há o que limpar. Um filtro que esconde
   metade do catálogo e não se anuncia é como um bug se parece. */
function FiltroPropriedades({ opcoes, ativas, onToggle, onLimpar }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="mb-2 border-t border-slate-800 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-expanded={aberto}
          className="flex items-center gap-1.5 text-left group"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${aberto ? "" : "-rotate-90"}`}
            aria-hidden="true"
          />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-slate-300">
            Propriedades
          </span>
        </button>
        {ativas.length > 0 && (
          <>
            <span className="font-mono text-[11px] font-bold text-purple-300 tabular-nums">{ativas.length}</span>
            <button
              type="button"
              onClick={onLimpar}
              className="ml-auto text-[10px] px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Limpar
            </button>
          </>
        )}
      </div>

      {!aberto && ativas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 pl-[22px]">
          {ativas.map((id) => (
            <span key={id} className="text-[10px] px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800 text-purple-300">
              {getPropriedade(id)?.nome ?? id}
            </span>
          ))}
        </div>
      )}

      {aberto && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {opcoes.map((p) => {
            const on = ativas.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggle(p.id)}
                aria-pressed={on}
                title={p.descricao}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  on ? "bg-purple-700 text-white" : "bg-slate-800/70 text-slate-400 hover:text-white"
                }`}
              >
                {p.nome}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabEquipamentos({ draft, derived, addEquipamento, removeEquipamento, patchEquipamento, toggleFerramenta, patchFerramenta, toggleEncantamento, addArmaCustom, patchArmaCustom, removeArmaCustom }) {
  const { equip, carga, grauFeiticeiro: grau } = derived;
  const fontesDano = fontesDanoDaFicha(draft, derived);
  const [catTab, setCatTab] = useState("arma");
  const [busca, setBusca] = useState("");
  const [subFiltro, setSubFiltro] = useState("todos");
  // Custo é o que o orçamento do grau conta, então filtrar por ele é a pergunta
  // mais direta do catálogo: "o que ainda cabe na vaga que me sobrou".
  const [custoFiltro, setCustoFiltro] = useState("todos");
  // As armas são duas listas separadas no livro (simples e complexas), então
  // são duas abas, e não um filtro. A categoria (corpo, distância, arremesso)
  // continua como filtro por cima.
  const [classeArma, setClasseArma] = useState("simples");
  const ehFichaDaYamata = String(draft.name ?? "").trim().toLocaleLowerCase("pt-BR").includes("yamata");

  const orcamento = orcamentoDoGrau(grau.value);

  // Sub-filtros: categoria da arma, categoria do item especial. Os demais
  // tipos são listas curtas e não precisam.
  const subOpcoes =
    catTab === "arma" ? ARMA_CATEGORIAS
    : catTab === "item" ? ITEM_CATEGORIAS
    : null;

  // Propriedades da arma exigidas, todas ao mesmo tempo. É MULTI-ESCOLHA e o
  // combinador é E, e não OU: a pergunta que se faz ao catálogo é "quais armas
  // são Marciais E de Fineza", e não "quais são uma coisa ou outra". Com uma
  // marcada só, ele se comporta igual aos outros chips.
  const [propsFiltro, setPropsFiltro] = useState([]);
  const togglePropFiltro = (id) =>
    setPropsFiltro((atual) => (atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]));

  // O recorte antes do filtro de custo, que é de onde saem os custos oferecidos.
  // Ele para no sub-filtro de propósito: incluir a BUSCA faria as opções
  // mudarem a cada tecla, e o que some debaixo do dedo é pior que uma opção que
  // não acha nada.
  // ⚠ A dependência é `draft.armasCustom`, e NÃO o `draft` inteiro: o rascunho
  // muda a cada tecla em qualquer aba, e o catálogo só depende das armas
  // criadas. Por isso a chamada recebe um objeto com esse campo só.
  const listaDoTipo = useMemo(() => {
    let l = catalogoDoTipo(catTab, { armasCustom: draft.armasCustom });
    // Relíquias pessoais não entram no catálogo base. A da Yamata ganha um
    // card próprio nesta mesma aba, sem contaminar as opções de outras fichas.
    if (catTab === "item") l = l.filter((d) => !d.evento);
    if (catTab === "arma") l = l.filter((d) => d.classe === classeArma);
    if (subFiltro !== "todos") l = l.filter((d) => d.categoria === subFiltro);
    return l;
  }, [catTab, classeArma, subFiltro, draft.armasCustom]);

  const reliquiasDaYamata = useMemo(
    () => ehFichaDaYamata
      ? catalogoDoTipo("item").filter((d) => d.evento && d.exclusivoDe === "Yamata")
      : [],
    [ehFichaDaYamata],
  );

  // Só as propriedades que EXISTEM no recorte: uma aba de armas a distância não
  // oferece Fineza para não achar nada. Mesma regra dos custos oferecidos, e ela
  // é o que impede a fileira de virar 21 chips mortos.
  const propsOferecidas = useMemo(() => {
    if (catTab !== "arma") return [];
    const vistos = new Set();
    for (const d of listaDoTipo) {
      for (const [k, v] of Object.entries(d.props || {})) {
        if (v != null && v !== false && k !== "especial") vistos.add(k);
      }
    }
    return ARMA_PROPRIEDADES.filter((p) => vistos.has(p.id));
  }, [listaDoTipo, catTab]);

  // As que valem AGORA. Igual ao custo: a marcada que sumiu do recorte é
  // ignorada em vez de esvaziar a lista sem explicação na tela.
  const propsAtivas = useMemo(
    () => propsFiltro.filter((id) => propsOferecidas.some((p) => p.id === id)),
    [propsFiltro, propsOferecidas],
  );

  // Só os custos que existem no recorte atual: uma aba de kits, onde tudo custa
  // 1, não oferece quatro botões dos quais três não acham nada.
  const custosOferecidos = useMemo(() => {
    const vistos = new Set(listaDoTipo.map((d) => custoDoEquipamento(catTab, d)));
    return [...vistos].sort((a, b) => a - b);
  }, [listaDoTipo, catTab]);

  // O custo que VALE agora. O escolhido fica guardado, mas se a aba nova não
  // tiver aquele custo ele é ignorado em vez de esvaziar a lista sem motivo
  // aparente. Derivar em vez de corrigir o estado evita a renderização em
  // cascata que um useEffect com setState traria.
  const custoAtivo = custosOferecidos.includes(custoFiltro) ? custoFiltro : "todos";

  const lista = useMemo(() => {
    let l = listaDoTipo;
    if (custoAtivo !== "todos") l = l.filter((d) => custoDoEquipamento(catTab, d) === custoAtivo);
    // Todas as marcadas, e não qualquer uma delas.
    if (propsAtivas.length) {
      l = l.filter((d) => propsAtivas.every((p) => d.props?.[p] != null && d.props[p] !== false));
    }
    const q = busca.trim().toLowerCase();
    if (q) {
      l = l.filter((d) =>
        d.nome.toLowerCase().includes(q) ||
        (catTab === "arma" && grupoLabel(d.grupo).toLowerCase().includes(q)));
    }
    return l;
  }, [listaDoTipo, catTab, custoAtivo, propsAtivas, busca]);

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

  // Habilidade Única e encantamentos não passam pelos escalares: os dois viajam
  // pelo Motor. Sem estas duas linhas, uma ferramenta encantada não apareceria
  // em lugar nenhum desta aba.
  const efeitosMotor = [...(equip.efeitosUnica ?? []), ...(equip.efeitosEncantamento ?? [])];

  const temEfeito =
    equip.uniformeDefesa !== 0 || equip.penalidadeDestreza !== 0 ||
    equip.hpMaxBonus !== 0 || equip.cdBonus !== 0 || equip.rdGeralBonus !== 0 ||
    efeitosMotor.length > 0 ||
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
            <span><strong>Sobrecarregado.</strong> -5 na Defesa e -4,5m no Deslocamento.</span>
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
      </Card>

      <Card title="Efeito do Equipado">
        {temEfeito ? (
          <div className="flex flex-wrap gap-2">
            {equip.uniformeDefesa !== 0 && <EfeitoPill icon={Shield} label="Defesa" valor={`+${equip.uniformeDefesa}`} nota="armadura" titulo="Custo da armadura, mais o grau da Ferramenta" />}
            {equip.rdGeralBonus !== 0 && <EfeitoPill icon={Shield} label="RD Geral" valor={`+${equip.rdGeralBonus}`} nota="escudo + grau" />}
            {equip.penalidadeDestreza !== 0 && <EfeitoPill icon={Footprints} label="Perícias de Destreza" valor={equip.penalidadeDestreza} nota="armadura + escudo" />}
            {equip.hpMaxBonus !== 0 && <EfeitoPill icon={Heart} label="PV máximo" valor={`+${equip.hpMaxBonus}`} />}
            {equip.cdBonus !== 0 && <EfeitoPill icon={Sparkles} label="CD" valor={`+${equip.cdBonus}`} />}
            {AFTY_ATTRS.filter((at) => equip.attrBonus[at.key] !== 0).map((at) => (
              <EfeitoPill key={at.key} icon={ArrowUp} label={at.label} valor={`+${equip.attrBonus[at.key]}`} titulo="Passa o limite do atributo, com teto de 30" />
            ))}
            {efeitosMotor.map((ex, i) => (
              <EfeitoPill
                key={`${ex.origem}-${ex.canal}-${i}`}
                icon={Sparkles}
                label={rotuloCanalUnica(ex, derived.testes?.pericias)}
                valor={sinalDe(Number(ex.valor ?? ex.expr) || 0)}
                nota={ex.quando ? "ativa" : ex.exclusivo ? "única" : ex.fonte === "item" ? "item" : "encantamento"}
                titulo={ex.nome}
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Nenhum efeito de equipamento ativo.</p>
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
                      pericias={derived.testes?.pericias}
                      fontesDano={fontesDano}
                      dslContexto={derived.contextoDsl}
                      dslExtras={derived.combate?.estadosExtras}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ArmasCustomCard
        armas={armasCustomDaFicha(draft)}
        onAdd={addArmaCustom}
        onPatch={patchArmaCustom}
        onRemove={removeArmaCustom}
      />

      {reliquiasDaYamata.length > 0 && (
        <Card title="Relíquias de Evento · Yamata">
          <div className="space-y-1.5">
            {reliquiasDaYamata.map((def) => (
              <CatalogoLinha
                key={def.id}
                tipo="item"
                def={def}
                jaTem={contagem[def.id] ?? 0}
                onAdd={addEquipamento}
              />
            ))}
          </div>
        </Card>
      )}

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

        {/* Custo. Mesma anatomia de chip do sub-filtro, e o "C1" é o rótulo que
            a linha do catálogo e a do carregado já usam. Só aparece quando há
            mais de um custo para escolher. */}
        {custosOferecidos.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {[{ value: "todos", label: "Todo Custo" },
              ...custosOferecidos.map((c) => ({ value: c, label: `C${c}` }))].map((o) => {
              const on = o.value === custoAtivo;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setCustoFiltro(o.value)}
                  title={o.value === "todos" ? "Qualquer custo" : `Custo ${o.value}`}
                  className={`text-[10px] px-2 py-1 rounded font-mono transition-colors ${
                    on ? "bg-purple-700 text-white" : "bg-slate-800/70 text-slate-400 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Propriedades. Fica DOBRADA por padrão: são até 21 chips, e a fileira
            aberta empurraria a lista de armas para fora da tela. Fechada, ela
            mostra as marcadas, que é o que interessa depois da primeira vez. */}
        {propsOferecidas.length > 0 && (
          <FiltroPropriedades
            opcoes={propsOferecidas}
            ativas={propsAtivas}
            onToggle={togglePropFiltro}
            onLimpar={() => setPropsFiltro([])}
          />
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
    // Acerto, Defesa e RD são o próprio rank do grau. O Dano vem da tabela do
    // dano, que é a única das quatro que não escala de um em um.
    rank: g.rank,
    dano: DANO_ADICIONAL_ARMA.find((d) => d.value === g.value)?.valor ?? 0,
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
      {!aberto ? null : (
        <div className="space-y-5">
          {/* Benefícios por grau */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Benefícios por grau</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="py-1 pr-3 font-medium">Grau</th>
                    <th className="py-1 px-2 font-medium" title="Acerto da arma, Defesa da armadura e RD do escudo">Acerto, Defesa e RD</th>
                    <th className="py-1 px-2 font-medium">Dano</th>
                    <th className="py-1 px-2 font-medium">Enc. Arma</th>
                    <th className="py-1 px-2 font-medium">Enc. Escudo</th>
                    <th className="py-1 px-2 font-medium">Enc. Uniforme</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-200">
                  {linhasBeneficio.map((l) => (
                    <tr key={l.value} className="border-t border-slate-800">
                      <td className="py-1 pr-3 font-sans text-slate-300 whitespace-nowrap">{l.grau}</td>
                      <td className="py-1 px-2">+{l.rank}</td>
                      <td className="py-1 px-2">+{l.dano}</td>
                      <td className="py-1 px-2">{l.value === "especial" ? "hab. única" : `+${l.ganho.arma[l.value]}`}</td>
                      <td className="py-1 px-2">{l.value === "especial" ? "hab. única" : `+${l.ganho.escudo[l.value]}`}</td>
                      <td className="py-1 px-2">{l.value === "especial" ? "hab. única" : `+${l.ganho.uniforme[l.value]}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Os encantamentos acumulam entre os graus. Acerto, Dano, Defesa e RD usam só o valor do grau
              atual, e somam por cima do equipamento comum: a Defesa da armadura parte do custo dela, e a
              RD parte da RD do escudo. Cada encantamento escolhido desce o item um grau para essas quatro
              contas, e a Habilidade Única não entra nessa redução. Cargas de Encantamento são o bônus de
              treinamento do portador, compartilhadas por todos os encantamentos com carga do item.
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

        </div>
      )}
    </Card>
  );
}

/* Rótulo de um efeito da Habilidade Única no card de Efeito do Equipado: o nome
   do canal do Motor, com o alvo entre parênteses quando ele direciona. */
function rotuloCanalUnica(ex, pericias) {
  const canal = getCanal(ex.canal);
  const base = canal?.label ?? ex.canal;
  if (!ex.alvo) return base;
  const alvo = (alvoOpcoes(canal?.alvo, pericias) ?? []).find((o) => o.value === ex.alvo);
  return `${base} (${alvo?.label ?? ex.alvo})`;
}

/* Mesmo desenho do StatMini das Invocações: o ícone vive DENTRO da linha do
   rótulo, não ao lado do bloco inteiro. Ao lado, ele se centralizava contra as
   duas linhas (rótulo + valor) e não batia com nenhuma das duas. */
function EfeitoPill({ icon: Icon, label, valor, nota, titulo }) {
  return (
    <div className="border border-slate-800 bg-slate-950/40 rounded-lg px-2.5 py-1.5" title={titulo}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
        <Icon className="w-3 h-3 flex-shrink-0 text-purple-400" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <div className="font-mono text-sm font-bold text-white leading-tight">
        {valor}
        {nota && <span className="ml-1.5 text-[9px] font-sans font-normal text-slate-500">{nota}</span>}
      </div>
    </div>
  );
}

function TabInterludios({ draft, derived, setTreinoProgresso, setTreinoInstance, setTreinoEspecialVezes }) {
  const treinos = (draft.treinamentos && !Array.isArray(draft.treinamentos) && typeof draft.treinamentos === "object")
    ? draft.treinamentos : {};
  // Pool do Treino de Manejo de Arma: as armas do INVENTÁRIO, carregadas ou
  // não. Ver `opcoesDeAlvo`.
  const armasDoInventario = (derived.equip?.entradas ?? [])
    .filter((e) => e.tipo === "arma" && e.def)
    .map((e) => e.def);
  // A origem esconde a linha que ela não alcança (a Maldição não tem Energia
  // Reversa), e o gasto acompanha: o Foco preso numa linha escondida volta.
  const origemId = draft.core.origem?.id;
  // As origens que a criatura conta como suas: a copiada em Verdadeiras Origens
  // e a que um Addon libera. Elas abrem a linha exclusiva de origem.
  const qualificadas = origensQualificadas(draft);
  const linhasTreino = treinamentosDaOrigem(origemId, qualificadas);
  // Contexto dos requisitos de etapa. Aptidão e trilha só bloqueiam quando o
  // chamador os fornece, então esquecer isto aqui seria requisito sempre aberto.
  const ctxReq = {
    aptidoes: derived.aptidoesEscolhidas ?? [],
    niveisAptidao: derived.aptidao?.efetivo ?? null,
  };
  // As duas famílias de Interlúdio dividem o MESMO orçamento de Focos, então o
  // medidor do cabeçalho soma as duas: uma pega de Treino Especial e uma etapa
  // de Linha saem do mesmo caixa.
  const vezesEspeciais = vezesPorTreinoEspecial(draft);
  // O teto de cada Treino Especial é 1 + 1 a cada 5 ou 10 ND, então ele muda com
  // a ficha e não pode ser constante do catálogo.
  const tetosEspeciais = tetosDeTreinoEspecial(draft);
  const gastos = focosGastos(treinos, origemId, qualificadas) + focosDeTreinosEspeciais(draft);
  const total = derived.focosTotais;                // = ND + bônus de poderes
  const overBudget = gastos > total;

  return (
    <>
      <Card
        title="Interlúdios · Treinamento"
        headerRight={<ContadorFocos gastos={gastos} total={total} excedeu={overBudget} />}
      >
        {/* linhas de treinamento */}
        <div className="space-y-1.5">
          {linhasTreino.map((linha) => (
            <TreinoLinha
              key={linha.id}
              linha={linha}
              valor={treinos[linha.id]}
              attrEff={derived.attrEff}
              nd={derived.nd}
              ctxReq={ctxReq}
              pericias={derived.testes?.pericias}
              armas={armasDoInventario}
              onSetProgresso={setTreinoProgresso}
              onSetInstance={setTreinoInstance}
            />
          ))}
        </div>
      </Card>

      {/* Os Treinos Especiais gastam o MESMO Foco das Linhas, e por isso ficam
          na mesma aba e sob o mesmo medidor. O card é separado porque o modelo é
          outro: escolha repetível, sem etapa e sem pré-requisito.
          O "em breve" fecha a lista dos Interlúdios Adicionais, e entra no
          catálogo assim que o texto de regra chegar verbatim. */}
      <Card
        title="Interlúdios · Treinos Especiais"
        headerRight={<ContadorFocos gastos={gastos} total={total} excedeu={overBudget} />}
      >
        <div className="space-y-1">
          {AFTY_TREINOS_ESPECIAIS.map((t) => (
            <TreinoEspecialCard
              key={t.id}
              item={t}
              vezes={vezesEspeciais[t.id] ?? 0}
              max={tetosEspeciais[t.id]}
              onSetVezes={(n) => setTreinoEspecialVezes(t.id, n)}
            />
          ))}
          <InterludioInfo icon={BookOpen} titulo="Estudos">
            Estudar uma perícia sem maestria (4 testes de INT/SAB, CD 12 + maestria, 2 sucessos
            concedem maestria), ou tornar-se especialista numa perícia já dominada (3 testes,
            CD 15 + nível, 2 sucessos). Ativa quando a aba de Perícias existir.
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
  // O rótulo do PE muda com o Tipo: ver `derived.recursoLabel`, abaixo.
  { key: "pe",           label: "Energia (PE)" },
  { key: "defesa",       label: "Defesa / CA" },
  { key: "cd",           label: "CD" },
  { key: "rdGeral",      label: "RD Geral" },
  { key: "rdEspecifico", label: "RD Específico" },
  { key: "rdAlma",       label: "RD a Alma" },
  { key: "movimento",    label: "Movimento (m)" },
  { key: "resParcial",   label: "Resistência Parcial" },
  { key: "atencao",      label: "Atenção" },
  { key: "iniciativa",   label: "Iniciativa" },
];

function TabCalculos({ derived, setStatOverride, patchCombate }) {
  return (
    <>
    <Card title="Cálculos">
      <div className="flex gap-2.5 bg-purple-950/30 border border-purple-800 rounded-lg p-3 mb-4 text-xs text-purple-200">
        <FlaskConical className="w-4 h-4 flex-shrink-0 text-purple-400 mt-0.5" />
        <span>
          Valores calculados pelas fórmulas do Afty. Clique no cadeado para sobrescrever manualmente
          qualquer um. <span className="text-purple-300/70">Edição por fórmula (coeficientes) vem depois.</span>
        </span>
      </div>

      {/* O `group` fica no wrapper para o painel de fontes abrir no hover da
          célula inteira, e não só do número dentro do StatField. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CALC_ROWS.map((row) => {
          const fontes = derived.partes?.[row.key];
          // Mesma pilha, nome do Tipo: "Estamina (PE)" no Restringido.
          const label = row.key === "pe" ? `${derived.recursoLabel} (PE)` : row.label;
          return (
            <div key={row.key} className="relative group">
              <StatField
                label={label}
                calculatedValue={derived.calc[row.key]}
                overrideValue={derived.isOverridden(row.key) ? derived[row.key] : null}
                onOverride={(v) => setStatOverride(row.key, v)}
              />
              {/* Aqui o card é largo e sobra espaço à direita, então o painel
                  alinha pela esquerda e fica embaixo do rótulo do stat. */}
              {fontes?.length > 0 && !derived.isOverridden(row.key) && (
                <PainelDeFontes partes={fontes} total={derived.calc[row.key]} ancora="esquerda" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 mt-4">
        A <span className="text-amber-400/80">Guarda</span> ainda não entra nestes valores (em desenvolvimento).
      </p>
    </Card>

    {/* Bancada de balanceamento, embaixo dos números que ela mexe: liga um
        estado e a grade acima se move. Some para quem não tem estado nenhum.
        ⚠ Arranjo PROVISÓRIO (autor, 2026-07-30). */}
    <SimulacaoCombateCard derived={derived} patchCombate={patchCombate} />
    </>
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
  defesa: "Defesa",
  rd: "RD",
  deslocamento: "Deslocamento",
  pericias: "Perícias",
  orcamentoLivre: "Ações/Caract. Grátis",
  orcamentoPago: "Ações/Caract.",
  atributoPontos: "Pontos de Atributo",
  custoReducao: "Custo (abate)",
  bonusTeste: "Em Testes",
  bonusTR: "Em TRs",
  acerto: "Em Acerto",
  cd: "Em CD",
  danoNivel: "Dano (níveis)",
  danoBonus: "Dano (total)",
  curaNivel: "Cura (níveis)",
  curaBonus: "Cura (total)",
  ataqueDanoAdicional: "Dado Extra no Ataque",
  caracteristicasLivres: "Características Grátis",
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
            <span className="font-mono text-slate-300 flex-shrink-0 whitespace-nowrap">
              {/* O canal do dado extra trafega o MÁXIMO do dado, então mostrar
                  "+8" ali seria mentira: o que a invocação ganha é 1d8. */}
              {d.canal === "ataqueDanoAdicional"
                ? dadoDoMaximo(d.valor)
                : `+${d.valor}`}{" "}
              {EFEITO_CANAL_LABEL[d.canal] || d.canal}
            </span>
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
          {/* Característica de Teste em Ataque: metade do valor e só com o
              gatilho, então não entra no número plano acima. */}
          {acerto.corpo.comGatilho > 0 && (
            <TestePill nome="Com Gatilho" bonus={acerto.corpo.comGatilho} title="Bônus de Característica, só quando o gatilho ocorre" />
          )}
          <span className="inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800 bg-slate-900/70 text-slate-500" title="CD com o melhor atributo. Cada Ação por TR mostra a sua CD exata.">
            <span className="text-[10px]">CD ataque</span><b>{cd}</b>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span className={rotulo}>Resist.</span>
        <div className="flex flex-wrap gap-1.5">
          {resistencias.map((r) => (
            <TestePill
              key={r.value}
              nome={r.comGatilho > 0 ? `${r.label} (+${r.comGatilho} com gatilho)` : r.label}
              bonus={r.bonus}
              on={r.treinado}
              mestre={r.mestre}
              title={r.mestre ? "Mestre (1,5x BT)" : r.treinado ? "Treinado (BT)" : undefined}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span className={rotulo}>Perícias</span>
        {pericias.length === 0 ? (
          <span className="text-[11px] text-slate-600 italic pt-1">nenhuma treinada</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {/* Uma Característica de Teste dá bônus em perícia NÃO treinada, e
                a linha existe mesmo assim. Marcar aquilo de roxo com "Treinado"
                mentiria sobre o BT, que não soma nesse caso. */}
            {pericias.map((p) => (
              <TestePill
                key={p.id}
                nome={p.nome}
                bonus={p.bonus}
                on={p.treinado}
                mestre={p.mestre}
                title={p.mestre ? "Mestre (1,5x BT)" : p.treinado ? "Treinado (BT)" : "Não treinada (sem BT)"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Marcadores da invocação: uma Habilidade de Controlador que vale só para
   ALGUMAS invocações vira um toggle aqui. O marcador que pede escolha (Precisão)
   abre as opções na mesma linha, porque é onde o efeito dele aparece. */
function InvocacaoMarcadores({ inv, marcadores, onPatch }) {
  if (!marcadores?.length) return null;
  const alternar = (id) =>
    onPatch({ marcadores: { ...(inv.marcadores || {}), [id]: !marcadorLigado(inv, id) } });
  const escolher = (id, valor) =>
    onPatch({ marcadorOpcoes: { ...(inv.marcadorOpcoes || {}), [id]: valor } });

  return (
    <div>
      <FieldLabel>Marcadores</FieldLabel>
      <div className="space-y-1.5">
        {marcadores.map((m) => {
          const on = marcadorLigado(inv, m.id);
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-2">
              <BoolChip ativo={on} onToggle={() => alternar(m.id)}>
                <Star className="w-3 h-3" aria-hidden="true" /> {m.label}
              </BoolChip>
              <span
                className={`font-mono text-[10px] tabular-nums ${m.excedeu ? "text-rose-300" : "text-slate-500"}`}
                title="Invocações marcadas contra o limite"
              >
                {m.marcadas} / {m.limite}
              </span>
              {on && m.opcoes && (
                <OptionChips
                  value={marcadorOpcao(inv, m.id) || ""}
                  options={m.opcoes}
                  onChange={(v) => escolher(m.id, v)}
                />
              )}
              {on && m.opcoes && !marcadorOpcao(inv, m.id) && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-label="Escolha em falta" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Habilidades de USO que o dono pode gastar nesta invocação, com o número já
   fechado (Autonomia, Resistência Sobrecarregada). Elas não mudam a ficha, mas
   têm valor calculável, e sem elas a mesa reabre o livro para saber quanto custa
   dar um turno próprio a uma invocação de Segundo Grau. */
function InvocacaoOpcoesDeUso({ opcoes, margemCritico, criticoBrutal }) {
  const nada = !opcoes?.length && margemCritico >= 20 && !criticoBrutal;
  if (nada) return null;
  const pill = "inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800 bg-slate-900/70 text-slate-300";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(opcoes ?? []).map((o) => (
        <span key={o.id} className={pill}>
          <span className="text-[10px] opacity-80">{o.nome}</span><b className="text-white">{o.valor}</b>
        </span>
      ))}
      {margemCritico < 20 && (
        <span className={pill} title="Margem de acerto crítico das jogadas dela">
          <span className="text-[10px] opacity-80">Crítico</span><b className="text-white">{margemCritico}+</b>
        </span>
      )}
      {criticoBrutal && (
        <span className={pill} title="Crítico Brutal">
          <span className="text-[10px] opacity-80">Crítico</span><b className="text-white">+1 dado</b>
        </span>
      )}
    </div>
  );
}

/* As regras do Shikigami de Técnica que NÃO têm canal: turno próprio na
   Iniciativa, retorno com vida cheia na primeira dissipação, desvantagem alheia
   e imunidade ao Prejuízo por Repetição. Vêm como marca, com o texto da regra no
   `title`, que é onde explicação de item mora. */
function InvocacaoTracos({ tracos }) {
  if (!tracos?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tracos.map((t) => (
        <span
          key={t.id}
          title={t.regra}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] border border-sky-800/60 bg-sky-950/40 text-sky-300"
        >
          <Star className="w-3 h-3 flex-shrink-0" aria-hidden="true" /> {t.nome}
        </span>
      ))}
    </div>
  );
}

/* Linha do corpo da invocação: RD (a Geral e a de cada tipo) e Tamanho. Ambos
   são DERIVADOS das Características e das Habilidades, então vivem no stat
   block e não têm campo. */
function InvocacaoCorpo({ rd, tamanho }) {
  const pill = "inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800 bg-slate-900/70 text-slate-300";
  const tamLabel = AFTY_TAMANHOS.find((t) => t.value === tamanho)?.label ?? tamanho;
  const temRd = (rd?.geral ?? 0) > 0 || (rd?.porTipo?.length ?? 0) > 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {temRd ? (
        <>
          {(rd.geral ?? 0) > 0 && (
            <span className={pill} title="Redução de Dano contra todos os tipos">
              <span className="text-[10px] opacity-80">RD</span><b className="text-white">{rd.geral}</b>
            </span>
          )}
          {(rd.porTipo || []).map((l) => (
            <span key={l.chave} className={pill} title="Redução de Dano contra este tipo">
              <span className="text-[10px] opacity-80">RD {l.label}</span><b className="text-white">{l.total}</b>
            </span>
          ))}
        </>
      ) : (
        <span className={pill}><span className="text-[10px] opacity-80">RD</span><b className="text-white">0</b></span>
      )}
      <span className={pill} title="Tamanho">
        <span className="text-[10px] opacity-80">Tamanho</span><b className="text-white">{tamLabel}</b>
      </span>
    </div>
  );
}

/* Atributos da invocação: point-buy linear, máximo do grau. Mesma anatomia
   compacta do bloco de Desenvolvimento na aba Atributos.

   ⚠ A BASE E O PISO vêm do `resumo`, e não de constante: o Shikigami de Técnica
   começa em 10 e reduz só até 8, enquanto o resto começa em 8 e reduz até 6.
   Com o piso fixo em 6 o campo deixava baixar um Shikigami de Técnica abaixo do
   que a regra dele permite. */
function InvocacaoAtributos({ inv, resumo, max, onPatchAttr }) {
  const over = resumo && resumo.usados > resumo.total;
  const base = resumo?.base ?? INV_ATTR_MIN + 2;
  const min = resumo?.min ?? INV_ATTR_MIN;
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
          const v = inv.atributos?.[a.key] ?? base;
          const m = invMod(v);
          return (
            <div key={a.key} className="bg-slate-950/50 border border-slate-800 rounded px-2 py-1.5">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300" title={a.label}>{a.abbr}</span>
                <span className="font-mono text-[10px] text-purple-300">{m >= 0 ? `+${m}` : m}</span>
              </div>
              <NumberInput value={v} onChange={(val) => onPatchAttr(a.key, val)} min={min} max={max} aria-label={`${a.label} da invocação`} />
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
function InvocacaoCard({ inv, resolvida, grausOk, marcadores, podeSubir, podeDescer, onPatch, onPatchAttr, onRemove, onDuplicar, onSubir, onDescer, acoesApi, caracApi }) {
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
  /* Vocabulário do namespace DESTA invocação, para o seletor de variáveis dos
     campos de Modificador. Memoizado pela identidade do contexto, que só troca
     quando o `deriveAfty` roda: montá-lo por card de Ação seria varrer a mesma
     resposta uma vez por cartão. */
  const grupos = useMemo(() => vocabularioInvocacao(r.contextoDsl), [r.contextoDsl]);
  const SUBABAS = [
    { id: "atributos", label: "Atributos" },
    { id: "treino", label: "Treino" },
    { id: "acoes", label: "Ações", n: (inv.acoes || []).length },
    { id: "caracteristicas", label: "Caract.", n: (inv.caracteristicas || []).length },
  ];

  /* ⚠ A trava por Nível de Controlador NÃO vale para um shikigami de Feitiço.
     Quem manda no grau dele é o NÍVEL DO FEITIÇO, e a tabela do Controlador
     travava a invocação num grau que o próprio Feitiço da ficha exigia: um
     Controlador de nível 1 com um Feitiço de Nível 5 via o Grau Especial
     desabilitado e não tinha como satisfazer o aviso que a ficha dava. */
  const grausBloqueados = r.shikigami
    ? []
    : AFTY_INV_GRAUS.filter((gr) => !grausOk.includes(gr.value)).map((gr) => gr.value);
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
          {/* Invocação amarrada a um Feitiço de Criação de Shikigamis: o nível
              do Feitiço é que manda no grau, no orçamento e no custo dela. */}
          {r.shikigami && (
            <span
              className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded border border-sky-800/60 bg-sky-950/40 text-sky-300 flex-shrink-0 truncate max-w-[10rem]"
              title={r.shikigami.fonte}
            >
              {r.shikigami.fonte}
            </span>
          )}
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
            {/* ⚠ O TIPO MECÂNICO nunca teve tela: `AFTY_INV_TIPOS` e
                `AFTY_INV_SABORES` existiam no motor, o campo era guardado na
                ficha e toda invocação ficava calada em "Shikigami". Ele decide o
                Intermediário (Talismã ou Dispositivo) e a regra de retirada. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel hint={`Intermediário: ${r.intermediario ?? ""}`}>Tipo</FieldLabel>
                <OptionChips
                  value={inv.tipoMecanico || "shikigami"}
                  options={AFTY_INV_TIPOS.map((t) => ({ value: t.value, label: t.label }))}
                  onChange={(v) => onPatch({ tipoMecanico: v })}
                />
              </div>
              {/* Corpo Amaldiçoado e Marionete são o MESMO tipo mecânico, e a
                  escolha é só de rótulo (decisão do autor, 2026-07-17). */}
              {inv.tipoMecanico === "dispositivo" && (
                <div>
                  <FieldLabel>Sabor</FieldLabel>
                  <OptionChips
                    value={inv.saborNarrativo || "corpo_amaldicoado"}
                    options={AFTY_INV_SABORES}
                    onChange={(v) => onPatch({ saborNarrativo: v })}
                  />
                </div>
              )}
            </div>
            <InvocacaoMarcadores inv={inv} marcadores={marcadores} onPatch={onPatch} />
          </div>

          {/* STAT BLOCK (sempre visível): stats + testes + efeitos + avisos */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatMini icon={Heart} label="Vida" value={r.pv} />
              <StatMini icon={Shield} label="Defesa" value={r.defesa} />
              <StatMini icon={Footprints} label="Desloc." value={r.deslocamento != null ? `${r.deslocamento} m` : "-"} />
              <StatMini icon={Zap} label="Custo (PE)" value={r.custo} accent />
            </div>
            <InvocacaoCorpo rd={r.rd} tamanho={r.tamanho} />
            <InvocacaoTracos tracos={r.tracos} />
            <InvocacaoOpcoesDeUso opcoes={r.opcoesDeUso} margemCritico={r.margemCritico} criticoBrutal={r.criticoBrutal} />
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
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Orçamento (Ações + Características)</span>
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Vagas que SÓ Característica ocupa e que não entram no custo
                      (Shikigami de Técnica). Ficam fora do contador comum, senão
                      pareceriam aceitar Ação. */}
                  {r.orcamento?.exclusivas > 0 && (
                    <span
                      className="font-mono text-[11px] tabular-nums px-2 py-0.5 rounded border border-sky-800/60 bg-sky-950/40 text-sky-300"
                      title="Vagas exclusivas de Característica, que não aumentam o custo"
                    >
                      {r.orcamento.exclusivasUsadas} / {r.orcamento.exclusivas} Caract.
                    </span>
                  )}
                  <span className={`font-mono text-[11px] tabular-nums px-2 py-0.5 rounded border ${
                    orcOver ? "text-rose-300 border-rose-800 bg-rose-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
                  }`}>{orcBadge}</span>
                </span>
              </div>
              {subtab === "acoes" ? (
                <EfeitosSecao
                  titulo="Ações"
                  itens={inv.acoes || []}
                  resolvidos={r.acoes || []}
                  onAdd={acoesApi.add}
                  addLabel="Nova ação"
                  render={(item, res) => (
                    <AcaoCard key={item.id} acao={item} res={res} grau={inv.grau} otimizacaoEnergia={r.otimizacaoEnergia} grupos={grupos} onPatch={(p) => acoesApi.patch(item.id, p)} onRemove={() => acoesApi.remove(item.id)} />
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
                    <CaracteristicaCard key={item.id} carac={item} res={res} grau={inv.grau} grupos={grupos} onPatch={(p) => caracApi.patch(item.id, p)} onRemove={() => caracApi.remove(item.id)} />
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

/* Campo de expressão da DSL da Invocação: seletor de variáveis, validação, o
   ALVO onde o número cai e a prévia do resultado.

   ⚠ Era um TextInput cego, com sete nomes de variável escritos à mão no hint,
   num namespace (o da invocação) que não é o da criatura. E o resultado que ele
   pintava em verde não ia a lugar nenhum: `modificadorExpr` era avaliado e
   descartado. Ver `aplicaModificador` em afty-invocacoes.js. */
function ExprField({ value, alvo, alvos, onChange, onAlvo, resultado, resultadoLabel, grupos }) {
  const check = validateExpression(value || "");
  const escolhido = alvos.find((a) => a.value === alvo) ?? alvos[0] ?? null;
  return (
    <div>
      <FieldLabel>Modificador</FieldLabel>
      <CampoExpressao
        value={value}
        onChange={onChange}
        invalida={!!value && !check.ok}
        placeholder="ex.: mod_forca + metade(nd)"
        rotulo="Modificador da DSL"
        grupos={grupos}
        ancora="direita"
      />
      {value ? (
        check.ok ? (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* O alvo só vira escolha quando há mais de um. Numa Característica
                ou num Auxílio de valor fixo existe um lugar só, e um seletor de
                uma opção seria um controle que não decide nada. */}
            {alvos.length > 1 ? (
              <OptionChips value={escolhido?.value} options={alvos} onChange={onAlvo} />
            ) : escolhido ? (
              <span className="text-[10px] text-slate-500">{escolhido.label}</span>
            ) : null}
            <span className="text-[10px] text-emerald-400 font-mono">
              {resultadoLabel ? `${resultadoLabel} ` : ""}{(resultado ?? 0) >= 0 ? "+" : ""}{resultado ?? 0}
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-rose-400 mt-1">{check.error}</p>
        )
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
    // O dado extra da Melhoria Agressividade entra na mesma rolagem, então
    // aparece somado à notação, e não numa linha à parte.
    const somaExtra = res.danoExtraAtaque?.dado ? ` + ${res.danoExtraAtaque.dado}` : "";
    const d = res.dano?.dado ? `${res.dano.dado}${somaExtra}${bonusSuf(res.dano.bonus)}` : "";
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
function AcaoCard({ acao, res, grau, otimizacaoEnergia, grupos, onPatch, onRemove }) {
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
            {/* Otimização de Energia (Controlador 2°): uma Ação com Custo por
                invocação sai 1 PE mais barata. Só aparece quando a ficha tem a
                habilidade e a ação tem custo. */}
            {otimizacaoEnergia && (acao.custoPE ?? 0) > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <BoolChip ativo={!!acao.custoOtimizado} onToggle={() => onPatch({ custoOtimizado: !acao.custoOtimizado })}>
                  Otimização de Energia
                </BoolChip>
                {res?.custoOtimizado && (
                  <span className="font-mono text-[11px] text-emerald-400 tabular-nums">
                    {res.custoAntesDaOtimizacao} PE para {res.custoPE} PE
                  </span>
                )}
              </div>
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

          <ExprField
            value={acao.modificadorExpr}
            alvo={acao.modificadorAlvo}
            alvos={alvosDeModificador(acao)}
            onChange={(v) => onPatch({ modificadorExpr: v })}
            onAlvo={(v) => onPatch({ modificadorAlvo: v })}
            resultado={res?.modificador}
            resultadoLabel={res?.modificadorLabel}
            grupos={grupos}
          />

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
    case "rd": return res.rdTipoLabel ? `${res.valor} RD ${res.rdTipoLabel}` : `${res.valor} RD`;
    case "tamanho": return res.tamanho ? (AFTY_TAMANHOS.find((t) => t.value === res.tamanho)?.label ?? res.tamanho) : "tamanho";
    default: return "passiva";
  }
}

/* Uma Característica passiva: cabeçalho recolhível + editor. */
function CaracteristicaCard({ carac, res, grau, grupos, onPatch, onRemove }) {
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
            <div className="space-y-3">
              <div>
                <FieldLabel hint="Ataque e TR contam metade e exigem gatilho">Aplica em</FieldLabel>
                <OptionChips value={carac.alvoTeste} options={[{ value: "pericia", label: "Perícia" }, { value: "ataque", label: "Ataque" }, { value: "tr", label: "TR" }]} onChange={(v) => onPatch({ alvoTeste: v })} />
              </div>
              {/* O bônus é "em um teste específico", então o alvo é campo. Em
                  Jogadas de Ataque vale para todas, e não há o que escolher. */}
              {carac.alvoTeste === "pericia" && (
                <div className="sm:max-w-xs">
                  <FieldLabel>Perícia</FieldLabel>
                  <Select
                    value={carac.periciaId}
                    onChange={(v) => onPatch({ periciaId: v })}
                    options={periciasParaInvocacao().map((p) => ({ value: p.id, label: p.nome }))}
                    placeholder="escolher..."
                  />
                </div>
              )}
              {carac.alvoTeste === "tr" && (
                <div className="sm:max-w-xs">
                  <FieldLabel hint="exceto Integridade">Teste de Resistência</FieldLabel>
                  <Select value={carac.trTipo} onChange={(v) => onPatch({ trTipo: v })} options={TR_OPCOES} placeholder="escolher..." />
                </div>
              )}
            </div>
          )}
          {carac.subtipo === "rd" && (
            <div className="space-y-3">
              <div className="sm:max-w-xs">
                <FieldLabel>Tipo de dano</FieldLabel>
                <Select value={carac.rdTipo} onChange={(v) => onPatch({ rdTipo: v })} options={INV_RD_TIPOS} placeholder="escolher..." />
              </div>
              {carac.rdTipo === "outro" && (
                <div className="sm:max-w-xs">
                  <FieldLabel>Qual</FieldLabel>
                  <TextInput value={carac.rdTipoOutro} onChange={(v) => onPatch({ rdTipoOutro: v })} placeholder="tipo de dano" />
                </div>
              )}
              <div>
                <FieldLabel hint="cada tipo extra reduz 2">Tipos de dano extras</FieldLabel>
                <div className="w-24"><NumberInput value={carac.rdTiposExtras} onChange={(v) => onPatch({ rdTiposExtras: v })} min={0} max={9} aria-label="Tipos de dano extras" /></div>
              </div>
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

          <ExprField
            value={carac.modificadorExpr}
            alvo={carac.modificadorAlvo}
            alvos={alvosDeModificadorCaract(carac)}
            onChange={(v) => onPatch({ modificadorExpr: v })}
            onAlvo={(v) => onPatch({ modificadorAlvo: v })}
            resultado={res?.modificador}
            resultadoLabel={res?.modificadorLabel}
            grupos={grupos}
          />

          <div>
            <FieldLabel>Descrição</FieldLabel>
            <TextInput value={carac.descricao} onChange={(v) => onPatch({ descricao: v })} placeholder="texto da característica (opcional)" />
          </div>
        </div>
      )}
    </div>
  );
}

/* Roster do Controlador: os quatro números que Treinamento em Controle e o
   Apogeu movem. São de REFERÊNCIA (mostra, não valida), porque invocação também
   nasce de Interlúdio e de Feitiço de Shikigami. */
function ControleInvocacoesResumo({ controle }) {
  if (!controle?.ativo) return null;
  const linhas = [
    { label: "Recebidas", valor: controle.iniciais },
    { label: "Em campo", valor: controle.limiteCampo },
    { label: "Por Invocar", valor: controle.invocarPorAcao },
    { label: "Comandos", valor: controle.comandos },
    ...(controle.criarHorda ? [{ label: "Hordas", valor: controle.limiteHordas }] : []),
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {linhas.map((l) => (
        <span key={l.label} className="inline-flex items-baseline gap-1 px-2 py-1 rounded border border-slate-800 bg-slate-950/50 font-mono text-[11px] text-slate-300">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">{l.label}</span>
          <b className="text-white tabular-nums">{l.valor}</b>
        </span>
      ))}
      {controle.invocarAcaoLivre && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-purple-800/60 bg-purple-950/40 text-[11px] text-purple-300">
          Invocar como Ação Livre
        </span>
      )}
    </div>
  );
}

/* Contador por marcador: quantas invocações estão marcadas contra o limite
   daquele marcador. Vermelho quando passa. */
function MarcadoresResumo({ marcadores }) {
  if (!marcadores?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {marcadores.map((m) => (
        <span
          key={m.id}
          title="Invocações marcadas contra o limite"
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border font-mono text-[11px] ${
            m.excedeu ? "border-rose-800 bg-rose-950/30 text-rose-300" : "border-slate-800 bg-slate-950/50 text-slate-400"
          }`}
        >
          <Star className="w-3 h-3 flex-shrink-0 text-purple-400" aria-hidden="true" />
          <span className="text-[10px]">{m.label}</span>
          <b className="tabular-nums text-white">{m.marcadas}</b>
          <span className="text-slate-600">/</span>
          <b className="tabular-nums">{m.limite}</b>
          {m.semOpcao > 0 && <AlertTriangle className="w-3 h-3 text-amber-400" aria-label="Escolha em falta" />}
        </span>
      ))}
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
              {/* "Todo Intermediário ocupa meio espaço no inventário." O número
                  aparece, mas ainda NÃO entra na carga: ligar isso mexe em
                  Defesa e Movimento de toda ficha pronta. Ver docs/a-fazer.md. */}
              <span className="text-slate-600">·</span>
              <span
                className="font-mono text-xs font-bold tabular-nums text-slate-400"
                title="Espaços de inventário dos Intermediários"
              >
                {derived.invocacoes.espacosIntermediarios} Esp.
              </span>
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

      <ControleInvocacoesResumo controle={derived.invocacoes.controle} />
      <MarcadoresResumo marcadores={derived.invocacoes.marcadores} />

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
              marcadores={derived.invocacoes.marcadores}
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
            </div>
          )}

          {res?.warnings?.length > 0 && (
            <ul className="space-y-1">
              {res.warnings.map((w, i) => (
                <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" /> {w}</li>
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
/* ============================================================ */
/* RETRATO                                                      */
/* ============================================================ */
/* Portado da 2.5.2, que já tinha o sistema pronto e resolvido:
     • o seletor de foco de `sections/SectionIdentity.jsx` (PortraitFocusPicker)
     • o banner de `sections/LivePreview.jsx` (PortraitHeader)
   Os dois são `function` LOCAL nos arquivos de lá, sem export, e a 2.5.2 é
   somente-leitura: não dava para importar, então foram copiados. Se um dia eles
   forem exportados, dá para trocar por import e apagar daqui.

   ⚠ O `erroredUrl` guarda a URL que falhou, e não um booleano. Assim o erro fica
   preso ÀQUELA url: trocar a imagem faz o retrato voltar sozinho, sem precisar
   de um efeito para limpar a marca. É da 2.5.2 e vale a pena manter. */

const FOCO_PADRAO = { x: 50, y: 50 };
const focoDe = (f) => ({ x: f?.x ?? 50, y: f?.y ?? 50 });

/** Miniatura com ponto focal arrastável. Sem imagem, é só o ícone. */
function RetratoFocoPicker({ src, focus, onFocusChange, onError }) {
  const containerRef = useRef(null);
  const arrastandoRef = useRef(false);
  const [arrastando, setArrastando] = useState(false);
  const f = focoDe(focus);

  const doPonteiro = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el || !onFocusChange) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    onFocusChange({
      x: Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)),
    });
  }, [onFocusChange]);

  const aoDescer = (e) => {
    if (!src) return;
    e.preventDefault();
    arrastandoRef.current = true;
    setArrastando(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    doPonteiro(e.clientX, e.clientY);
  };
  const aoMover = (e) => { if (arrastandoRef.current) doPonteiro(e.clientX, e.clientY); };
  const aoSoltar = (e) => {
    if (!arrastandoRef.current) return;
    arrastandoRef.current = false;
    setArrastando(false);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* já solto */ }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={aoDescer}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      className={`relative flex-shrink-0 w-20 h-20 rounded-lg border-2 border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center select-none ${
        src ? "cursor-crosshair touch-none" : ""
      }`}
      title={src ? "Arraste para escolher o ponto focal" : undefined}
    >
      {!src ? (
        <ImageIcon className="w-7 h-7 text-slate-700" aria-hidden="true" />
      ) : (
        <>
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: `${f.x}% ${f.y}%` }}
            onError={onError}
            referrerPolicy="no-referrer"
            draggable={false}
          />
          <span
            aria-hidden="true"
            className="absolute w-3 h-3 rounded-full border-2 border-white bg-purple-500 shadow-md pointer-events-none transition-transform"
            style={{
              left: `${f.x}%`, top: `${f.y}%`,
              transform: `translate(-50%, -50%) scale(${arrastando ? 1.3 : 1})`,
            }}
          />
        </>
      )}
    </div>
  );
}

/** O campo Retrato da aba Identidade: url + a miniatura com o foco. */
function RetratoCampo({ url, focus, onUrl, onFocus }) {
  const [erroredUrl, setErroredUrl] = useState(null);
  const src = url && erroredUrl !== url ? url : null;
  return (
    <div className="flex gap-3">
      <RetratoFocoPicker
        src={src}
        focus={focus}
        onFocusChange={onFocus}
        onError={() => setErroredUrl(url)}
      />
      <div className="flex-1 min-w-0">
        <FieldLabel>Retrato</FieldLabel>
        <TextInput value={url ?? ""} onChange={onUrl} placeholder="https://..." />
        {url && erroredUrl === url && (
          <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span>Imagem não carregou.</span>
          </p>
        )}
        {src && (
          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
            <Crosshair className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span>{Math.round(focoDe(focus).x)}% · {Math.round(focoDe(focus).y)}%</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** O banner do Preview. Devolve null sem imagem, e o Preview cai no cabeçalho de texto. */
function RetratoBanner({ url, focus, nome, children }) {
  const [erroredUrl, setErroredUrl] = useState(null);
  if (!url || erroredUrl === url) return null;
  const f = focoDe(focus);
  return (
    <div className="relative h-40 overflow-hidden rounded-t-xl">
      <img
        src={url}
        alt={nome || "Retrato"}
        className="w-full h-full object-cover"
        style={{ objectPosition: `${f.x}% ${f.y}%` }}
        onError={() => setErroredUrl(url)}
        referrerPolicy="no-referrer"
      />
      {/* Gradiente para o texto continuar legível sobre qualquer imagem. */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">{children}</div>
    </div>
  );
}

/* ============================================================ */
/* Preview lateral (prévia em tempo real)                       */
/* ============================================================ */
function AftyPreview({ draft, derived }) {
  const tipoLabel = AFTY_TIPOS.find((t) => t.value === draft.core.tipo)?.label ?? draft.core.tipo;
  const patamarLabel = AFTY_PATAMARES.find((p) => p.value === draft.core.patamar)?.label ?? draft.core.patamar;
  // `p` é a chave em derived.partes: quem tem, ganha o hover com as fontes.
  const stats = [
    { k: "Vida", v: derived.hp, p: "hp", accent: "text-purple-300" },
    ...(derived.pvTemporario > 0
      ? [{ k: "PV Temp.", v: derived.pvTemporario, p: "pvTemporario", accent: "text-amber-300" }]
      : []),
    // Cura no início do turno, em dados + fixo. Só aparece quando algum poder
    // liga (hoje Sobrevivente, abaixo da metade dos PV).
    ...(derived.regeneracao?.dados > 0
      ? [{
          k: "Regeneração",
          v: `${derived.regeneracao.dados}${derived.regeneracao.dado}${derived.regeneracao.fixo ? `+${derived.regeneracao.fixo}` : ""}`,
          accent: "text-emerald-300",
        }]
      : []),
    // Uma pilha só: o Restringido a chama de Estamina e o resto de Energia.
    // Mesmo número, mesmo detalhamento no hover.
    { k: derived.recursoLabel, v: derived.pe, p: "pe", accent: "text-sky-400" },
    // Pontos de Preparo é recurso do Combatente: some para quem não tem.
    ...(derived.pontosPreparo > 0
      ? [{ k: "Preparo", v: derived.pontosPreparo, p: "pontosPreparo", accent: "text-sky-300" }]
      : []),
    { k: "Defesa", v: derived.defesa, p: "defesa" },
    { k: "CD", v: derived.cd, p: "cd" },
    { k: "RD Geral", v: derived.rdGeral, p: "rdGeral" },
    { k: "RD Espec.", v: derived.rdEspecifico, p: "rdEspecifico" },
    // A RD Geral cobre todo tipo MENOS alma, então esta é a única defesa contra
    // Dano na Alma. Ninguém tem por base: some para quem não tem o poder.
    ...(derived.rdAlma > 0
      ? [{ k: "RD a Alma", v: derived.rdAlma, p: "rdAlma", accent: "text-fuchsia-300" }]
      : []),
    // RD Física ficou só com quem NOMEIA o tipo (Reforçado, Aura Reforçada): o
    // escudo saiu daqui em 2026-08-01 e virou RD Geral.
    ...(derived.rdFisico > 0 ? [{ k: "RD Física", v: derived.rdFisico, p: "rdFisico" }] : []),
    { k: "Movimento", v: `${derived.movimento}m`, p: "movimento" },
    {
      k: "Tamanho",
      v: `${derived.tamanhoLabel} · ${String(derived.tamanhoEspacoAlcance).replace(".", ",")}m`,
      accent: "text-purple-200",
    },
    { k: "Res. Parcial", v: derived.resParcial, p: "resParcial" },
    /* Guarda Inabalável: só Calamidade e Beyond têm, e some para o resto. Ela
       entra no Preview porque é AQUI que a criatura é dosada, e a Vida da Guarda
       é uma parcela grande do PV efetivo de um chefe: um Beyond ND 30 leva 300
       por rodada em cima dos PV dele.

       ⚠ Os dois números são o TETO da rodada, e não o corrente. O corrente é
       estado de mesa e mora na Ficha e no painel de Encontros, e por isso o
       bônus também não está somado na Defesa acima: fora de combate não há
       guarda erguida. */
    ...(derived.guarda?.ativa
      ? [
        { k: "Guarda", v: `+${derived.guarda.bonusMax}`, p: "guardaBonus", accent: "text-sky-200" },
        { k: "Vida da Guarda", v: derived.guarda.vidaMax, p: "guardaVida", accent: "text-sky-200" },
      ]
      : []),
    { k: "Iniciativa", v: `+${derived.iniciativa}`, p: "iniciativa" },
    // Atenção era calculada e não aparecia em lugar nenhum da ficha.
    { k: "Atenção", v: derived.atencao, p: "atencao" },
    { k: "Maestria", v: `+${derived.maestria}` },
  ];

  // Só as perícias em que a criatura tem faixa: as 20 com zero encheriam o
  // Preview de linha morta.
  const periciasDominadas = (derived.testes?.pericias ?? []).filter((x) => x.prof);
  const linhasDano = derived.dano?.entradas ?? [];
  const linhasCura = derived.cura?.linhas ?? [];
  const carga = derived.carga;
  // ⚠ Os TRs vêm TODOS, ao contrário das perícias: são cinco, todo mundo rola
  // os cinco, e um TR ausente da ficha é justamente o número que o mestre
  // procura. Perícia sem faixa é ruído, TR sem faixa é informação.
  const resistencias = derived.testes?.resistencias ?? [];
  const ataques = derived.testes?.ataques ?? [];
  // Feitiços já resumidos pelo motor (derived.feiticos.lista): o Preview não
  // recalcula nada, só exibe.
  const feiticosLista = derived.feiticos?.lista ?? [];
  // Trilhas que a ORIGEM alcança (a Maldição não tem Energia Reversa), e só as
  // que têm nível: uma fileira de zeros não diz nada. Some inteira no
  // Restringido, que não tem Nível de Aptidão nenhum.
  const trilhas = (derived.trilhasAptidao ?? [])
    .map((t) => ({ ...t, nivel: derived.aptidao?.efetivo?.[t.key] ?? 0 }))
    .filter((t) => t.nivel > 0);

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800">
        {tipoLabel}
      </span>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        {patamarLabel}
      </span>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        ND {derived.nd}
      </span>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700"
        title="Grau do Feiticeiro, que vem do ND"
      >
        {derived.grauFeiticeiro.label}
      </span>
      {derived.almaMult !== 1 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800">
          Alma {Math.round(derived.almaMult * 100)}%
        </span>
      )}
      {/* A simulação mexe nos números do Preview, então ela PRECISA
          aparecer aqui: senão os valores mudam sem explicação. */}
      {derived.combate?.ativo && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800">
          Em Combate
        </span>
      )}
      {carga?.sobrecarregado && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800"
          title={`${fmtEspacos(carga.espacosUsados)} de ${carga.cargaLimite} espaços`}
        >
          <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          Sobrecarregado
        </span>
      )}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      {/* Com retrato, o nome e os chips vivem SOBRE a imagem. Sem retrato, o
          banner devolve null e eles caem no corpo, logo abaixo. */}
      <RetratoBanner url={draft.portraitUrl} focus={draft.portraitFocus} nome={draft.name}>
        <div className="text-base font-bold text-white truncate drop-shadow-lg">{draft.name || "Sem nome"}</div>
        <div className="mt-1.5">{chips}</div>
      </RetratoBanner>

      {/* Sem retrato, a faixa de titulo faz o papel de cabecalho. Com retrato,
          o banner JA e o cabecalho (nome e chips estao sobre a imagem) e a
          faixa viraria uma linha repetindo o obvio no meio do card. */}
      {!draft.portraitUrl && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white">Preview</h3>
        </div>
      )}

      <div className="p-4">
        {!draft.portraitUrl && (
          <>
            <div className="text-base font-bold text-white truncate">{draft.name || "Sem nome"}</div>
            <div className="mt-2">{chips}</div>
          </>
        )}

        <div className={`grid grid-cols-2 gap-2 ${draft.portraitUrl ? "" : "mt-4"}`}>
          {stats.map((s, i) => {
            const fontes = s.p ? derived.partes?.[s.p] : null;
            return (
              <div key={s.k} className="relative group bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.k}</div>
                <div className={`font-mono font-bold text-lg tabular-nums ${s.accent || "text-white"} ${fontes?.length ? "cursor-help" : ""}`}>
                  {s.v}
                </div>
                {/* Grade de 2 colunas: a da esquerda abre o painel para a
                    direita e a da direita para a esquerda, senão ele sai do
                    Preview, que já encosta na borda da página. */}
                {fontes?.length > 0 && (
                  <PainelDeFontes partes={fontes} total={s.v} ancora={i % 2 === 0 ? "esquerda" : "direita"} />
                )}
              </div>
            );
          })}
        </div>

        {/* Dano: uma linha por fonte, com o Acerto ao lado. É a mesma conta da
            aba Habilidades, sem as propriedades e o alcance. */}
        {linhasDano.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Dano</div>
            <div className="space-y-1">
              {linhasDano.map((e) => (
                <div key={e.id} className="flex items-baseline gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="flex-1 min-w-0 text-[11px] text-slate-300 truncate" title={e.nome}>{e.nome}</span>
                  {e.acerto != null && (
                    <span className="font-mono text-[11px] tabular-nums text-slate-200 flex-shrink-0" title="Jogada de Ataque">
                      {sinalDe(e.acerto)}
                    </span>
                  )}
                  <span className="font-mono text-[12px] font-bold tabular-nums text-white flex-shrink-0">{e.texto}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cura: mesmo desenho do Dano, resumida da aba Habilidades. A rolagem
            é a do USO INTEIRO aqui (`textoNoMaximo`), e não a por ponto: quem
            lê o Preview quer o teto, e o custo por ponto não cabe na linha. */}
        {linhasCura.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Cura</div>
            <div className="space-y-1">
              {linhasCura.map((l) => (
                <div key={l.id} className="flex items-baseline gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="flex-1 min-w-0 text-[11px] text-slate-300 truncate" title={l.nome}>{l.nome}</span>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">{l.alcance}</span>
                  {l.usos != null && (
                    <span className="font-mono text-[11px] tabular-nums text-slate-400 flex-shrink-0" title="Usos por descanso">
                      {l.usos}×
                    </span>
                  )}
                  <span className="font-mono text-[12px] font-bold tabular-nums text-emerald-200 flex-shrink-0">
                    {l.textoNoMaximo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testes de Resistência: os cinco, sempre. Mestre em roxo (só ele
            critica), treinado em cinza claro, sem faixa em cinza apagado. */}
        {resistencias.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Resistências</div>
            <div className="grid grid-cols-2 gap-1">
              {resistencias.map((r, i) => (
                <div
                  key={r.value}
                  className={`relative group flex items-baseline gap-1.5 rounded-lg border px-2 py-1 ${
                    r.prof === "mestre"
                      ? "border-purple-700 bg-purple-950/40"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <span className={`flex-1 min-w-0 text-[10px] truncate ${r.prof ? "text-slate-200" : "text-slate-500"}`}>
                    {r.label}
                  </span>
                  <span className={`font-mono text-[11px] font-bold tabular-nums flex-shrink-0 ${
                    r.prof === "mestre" ? "text-purple-200" : r.prof ? "text-white" : "text-slate-400"
                  } ${r.partes?.length ? "cursor-help" : ""}`}>
                    {sinalDe(r.bonus)}
                  </span>
                  {r.partes?.length > 0 && (
                    <PainelDeFontes partes={r.partes} total={r.bonus} ancora={i % 2 === 0 ? "esquerda" : "direita"} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jogadas de Ataque por categoria. São três, e não têm faixa de Mestre:
            a fórmula do autor só testa "treinado". */}
        {ataques.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Ataque</div>
            <div className="grid grid-cols-3 gap-1">
              {ataques.map((a, i) => (
                <div
                  key={a.id}
                  className={`relative group rounded-lg border px-2 py-1 ${
                    a.treinado ? "border-slate-700 bg-slate-950/60" : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className={`text-[9px] uppercase tracking-wider truncate ${a.treinado ? "text-slate-400" : "text-slate-600"}`} title={a.nome}>
                    {a.nome}
                  </div>
                  <div className={`font-mono text-[13px] font-bold tabular-nums ${
                    a.treinado ? "text-white" : "text-slate-400"
                  } ${a.partes?.length ? "cursor-help" : ""}`}>
                    {sinalDe(a.bonus)}
                  </div>
                  {a.partes?.length > 0 && (
                    <PainelDeFontes partes={a.partes} total={a.bonus} ancora={i === 2 ? "direita" : "esquerda"} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Níveis de Aptidão, só as trilhas com nível. Some inteira num
            Restringido, que não tem Nível de Aptidão nenhum. */}
        {trilhas.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Níveis de Aptidão</div>
            <div className="flex flex-wrap gap-1">
              {trilhas.map((t) => (
                <span
                  key={t.key}
                  title={`Nível de Aptidão em ${t.label}`}
                  className="inline-flex items-baseline gap-1 text-[10px] px-1.5 py-0.5 rounded border border-sky-800 bg-sky-950/40 text-sky-200"
                >
                  {t.key.toUpperCase()}
                  <span className="font-mono tabular-nums font-semibold text-white">{t.nivel}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feitiços criados, já resumidos pelo motor. O nível vira chip, o
            custo em PE fica em roxo (mesma cor da pilha de energia na aba). */}
        {feiticosLista.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Feitiços</div>
            <div className="space-y-1">
              {feiticosLista.map((f) => (
                <div key={f.id} className="flex items-baseline gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <span
                    className={`flex-1 min-w-0 text-[11px] truncate ${f.nome ? "text-slate-300" : "text-slate-500"}`}
                    title={f.nome || "Feitiço Sem Nome"}
                  >
                    {f.nome || "Feitiço Sem Nome"}
                  </span>
                  {f.variacao && (
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0" title="Variação de liberação, não gasta vaga">
                      Var.
                    </span>
                  )}
                  {f.avisos.length > 0 && (
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" aria-hidden="true" title={f.avisos.join("\n")} />
                  )}
                  <span className="text-[9px] font-semibold px-1 py-0.5 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 flex-shrink-0 whitespace-nowrap">
                    {f.nivelLabel}
                  </span>
                  {f.valor != null && (
                    <span className="font-mono text-[11px] font-bold tabular-nums text-white flex-shrink-0" title={f.valorLabel}>
                      {f.valor}
                    </span>
                  )}
                  {f.custoPE != null && (
                    <span className="font-mono text-[10px] tabular-nums text-sky-400 flex-shrink-0" title="Custo em PE">
                      {f.custoPE} PE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perícias com faixa. Mestre em roxo, treinado em cinza. */}
        {periciasDominadas.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Perícias</div>
            <div className="flex flex-wrap gap-1">
              {periciasDominadas.map((x) => (
                <span
                  key={x.id}
                  title={x.prof === "mestre" ? "Mestre" : "Treinado"}
                  className={`inline-flex items-baseline gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                    x.prof === "mestre"
                      ? "border-purple-700 bg-purple-950/40 text-purple-200"
                      : "border-slate-700 bg-slate-900/60 text-slate-300"
                  }`}
                >
                  {x.nome}
                  <span className="font-mono tabular-nums font-semibold">{sinalDe(x.bonus)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
