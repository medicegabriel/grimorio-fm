import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Pencil, AlertTriangle, Moon, ChevronRight, Search, Heart, Zap, Sparkles, Palette,
} from "lucide-react";

import "./ficha.css";
import { mesclaFichaAfty, AFTY_TIPOS, AFTY_PATAMARES } from "../afty-schema";
import { deriveAfty } from "../afty-derive";
import { NumeroComFontes } from "../ui/fontes";
import { numeroBr } from "../ui/formato";
import {
  carregarSessao, salvarSessao, aparaSessao,
  aplicaDano, aplicaCura, proximaRodada, descansar, registraRolagem,
} from "./ficha-sessao";
import { rolarTeste, rolarDano } from "./ficha-rolagem";
import { conteudoDaFicha, alvosDeBusca } from "./ficha-conteudo";
import {
  carregarTema, salvarTemaGlobal, cssDasVars, cssDoUsuario, temCssLivre,
} from "./ficha-tema";
import PainelDeRolagens from "./PainelDeRolagens";
import BuscaGlobal from "./BuscaGlobal";
import PainelDeAparencia from "./PainelDeAparencia";
import AbaAcoes from "./abas/AbaAcoes";
import AbaPericias from "./abas/AbaPericias";
import AbaHabilidades from "./abas/AbaHabilidades";
import AbaBuffs from "./abas/AbaBuffs";
import { deltaDosEstados } from "./ficha-buffs";

/**
 * ============================================================
 * FICHA FINAL — a criatura já montada, aberta para USO
 * ============================================================
 * Plano completo em `docs/afty-ficha-final.md`.
 *
 * O criador CALCULA, a Ficha OPERA. Aqui não se troca Habilidade nem atributo:
 * o botão Editar leva para o criador, que continua sendo o dono das escolhas.
 *
 * Desenho (autor, 2026-08-05): **vitais fixos no topo, abas embaixo**. O que se
 * olha o tempo todo (PV, PE, Alma, Defesa, CD, RD) nunca sai da tela, e o corpo
 * troca por aba. 75% do uso é desktop e 25% é toque, então nada pode depender só
 * de hover: ver o `NumeroComFontes`.
 *
 * ⚠ A Ficha é pintada por VARIÁVEL CSS (`ficha.css`), e não por classe de cor do
 * Tailwind. É isso que torna o CSS personalizado possível. Tailwind aqui só
 * resolve LAYOUT.
 * ============================================================
 */

const TABS = [
  { id: "acoes", label: "Ações" },
  { id: "habilidades", label: "Habilidades" },
  { id: "pericias", label: "Perícias" },
  { id: "buffs", label: "Buffs" },
];

const rotuloDe = (lista, valor) => lista.find((x) => x.value === valor)?.label ?? valor;

/* ============================================================ */
/* Peças do cabeçalho                                            */
/* ============================================================ */

function Chip({ children, tom, title }) {
  return (
    <span className="afty-chip" data-afty-tom={tom} title={title}>
      {children}
    </span>
  );
}

/**
 * Uma barra de recurso, no desenho da 2.5.2 (a pedido do autor, 2026-08-05):
 * ícone e rótulo à esquerda, o número grande à direita, e a barra embaixo.
 *
 * ⚠ O NÚMERO É UM CAMPO, e ele aceita as duas coisas:
 *   • `42`  troca o valor
 *   • `-37` e `+8` são DELTA, e é o que substituiu a caixa de Dano e Cura que
 *     ficava solta no cabeçalho (o autor apontou que ela sobrava). Digitar
 *     `-37` no PV é o mesmo gesto de antes com um campo a menos na tela.
 *
 * ⚠ No PV o delta negativo passa pela regra de dano, e não por subtração: o PV
 * TEMPORÁRIO come primeiro. É por isso que existe `onDelta` separado do `onSet`.
 *
 * ⚠ O PV temporário não é uma quarta barra: ele é um pedaço âmbar EMENDADO na
 * de PV, porque é isso que ele é na regra (casca por fora do máximo, gasta antes
 * da vida). Uma barra separada faria o jogador somar dois números de cabeça.
 */
function Vital({ tipo, icone: Icone, rotulo, atual, max, temp = 0, partes, onSet, onDelta }) {
  const [rascunho, setRascunho] = useState(null);
  const teto = Math.max(1, max);
  const pctVida = Math.min(100, (Math.max(0, atual) / teto) * 100);
  const pctTemp = Math.min(100 - pctVida, (Math.max(0, temp) / teto) * 100);
  // Duas faixas, como na 2.5.2: âmbar abaixo da metade e vermelho abaixo de um
  // quarto. ⚠ O PULSO é só do vermelho: metade do PV é comum no meio da luta, e
  // uma barra piscando o tempo todo deixa de ser aviso e vira ruído.
  const pct = max > 0 ? (atual / max) * 100 : 100;
  const nivel = pct <= 25 ? "critico" : pct <= 50 ? "baixo" : "normal";

  // ⚠ Campo VAZIO não vale zero: limpar para redigitar e sair sem terminar
  // zeraria o PV do jogador no meio da luta. Vazio e lixo devolvem o que estava.
  const confirma = (texto) => {
    const cru = String(texto).trim();
    setRascunho(null);
    if (!cru) return;
    const n = Math.trunc(Number(cru.replace(",", ".")));
    if (!Number.isFinite(n)) return;
    if (/^[+-]/.test(cru)) onDelta(n); else onSet(n);
  };

  return (
    <div className="afty-vital" data-afty-vital={tipo} data-afty-nivel={nivel}>
      <div className="flex items-center gap-2">
        <Icone className="afty-vital-icone" aria-hidden="true" />
        <span className="afty-vital-rotulo flex-1 min-w-0 truncate">{rotulo}</span>
        <input
          type="text"
          inputMode="numeric"
          className="afty-vital-numero"
          value={rascunho ?? String(atual)}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={(e) => confirma(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          aria-label={`${rotulo} atual`}
        />
        <NumeroComFontes
          valor={`/ ${max}`}
          partes={partes}
          total={max}
          formatar={false}
          className="afty-vital-max"
          ancora="direita"
          titulo={`${rotulo} máximo`}
        />
        {temp > 0 && (
          <span className="afty-vital-temp" title="PV Temporário">+{temp}</span>
        )}
        <span className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" className="afty-passo" onClick={() => onDelta(-1)} aria-label={`${rotulo} menos 1`}>−</button>
          <button type="button" className="afty-passo" onClick={() => onDelta(1)} aria-label={`${rotulo} mais 1`}>+</button>
        </span>
      </div>
      <div className="afty-vital-trilho mt-2 flex">
        <span className="afty-vital-barra" style={{ width: `${pctVida}%` }} />
        {pctTemp > 0 && (
          <span
            className="afty-vital-barra"
            style={{ width: `${pctTemp}%`, "--afty-vital-cor": "var(--afty-pvtemp)" }}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================ */

/* ⚠ A ÚLTIMA SAÍDA. CSS livre permite escrever `.afty-ficha * { display: none }`
   e se trancar para fora da própria ficha. `?semcss=1` na URL desliga o tema
   inteiro antes de ele existir, e não depende de nenhum botão continuar
   clicável. Lido uma vez, fora do componente. */
const SEM_CSS = typeof location !== "undefined"
  && new URLSearchParams(location.search).has("semcss");

export default function AftyFicha({ creature, onVoltar, onEditar, onSalvarTema }) {
  const ficha = useMemo(() => mesclaFichaAfty(creature), [creature]);
  const alvoId = creature?.id ?? null;

  // ⚠ A sessão nasce com os recursos CHEIOS, e para isso precisa dos máximos,
  // que só existem depois de derivar. O derive da montagem roda sem
  // `almaAtual` (alma íntegra), que é exatamente o estado de uma ficha que
  // nunca entrou em jogo. O clamp de leitura abaixo acerta o resto.
  const [sessaoBruta, setSessaoBruta] = useState(() => carregarSessao(alvoId, deriveAfty(ficha)));
  const [tab, setTab] = useState("acoes");
  const [compacto, setCompacto] = useState(false);
  // Vantagem e desvantagem, e se o histórico está aberto. Os dois são de TELA, e
  // não de jogo: quem recarrega a página quer o painel do jeito padrão, e não
  // uma desvantagem esquecida na sessão de ontem.
  const [modo, setModo] = useState("normal");
  const [logAberto, setLogAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  // Quais itens estão abertos, e para onde a busca navegou. Os dois são de TELA:
  // reabrir a ficha amanhã com trinta parágrafos abertos não ajuda ninguém.
  const [abertos, setAbertos] = useState(() => new Set());
  const [destaque, setDestaque] = useState(null);
  const [tema, setTema] = useState(() => carregarTema(ficha, alvoId));
  const [aparenciaAberta, setAparenciaAberta] = useState(false);

  // ⚠ O `combate` que a Ficha deriva é o DA SESSÃO, e não o da ficha: o da ficha
  // é a bancada de balanceamento do criador, e misturar os dois faria cada
  // sessão de jogo destruir o cenário montado para dosar a mão. Ver
  // `ficha-sessao.js`.
  const derived = useMemo(
    () => deriveAfty(
      { ...ficha, combate: sessaoBruta.combate, buffsSessao: sessaoBruta.buffs },
      { almaAtual: sessaoBruta.almaAtual },
    ),
    [ficha, sessaoBruta.combate, sessaoBruta.buffs, sessaoBruta.almaAtual],
  );

  // ⚠ O clamp é de LEITURA, e não um efeito que reescreve o estado. O teto muda
  // por fora (editar a ficha no criador sobe ou desce o PV máximo, e a Alma o
  // MULTIPLICA), e aparar num efeito seria uma renderização em cascata para
  // chegar no mesmo número que dá para calcular de primeira.
  const sessao = useMemo(() => aparaSessao(sessaoBruta, derived), [sessaoBruta, derived]);

  // Todo escritor passa por aqui, e o valor entra JÁ aparado nos dois sentidos:
  // a função recebe a sessão válida e o resultado dela é aparado de novo.
  const atualiza = useCallback((fn) => {
    setSessaoBruta((s) => aparaSessao(fn(aparaSessao(s, derived)), derived));
  }, [derived]);

  // Persistência por debounce, igual ao rascunho do criador. Sem botão Salvar:
  // sessão não é rascunho, é fato.
  const primeiraGravacao = useRef(true);
  useEffect(() => {
    if (primeiraGravacao.current) { primeiraGravacao.current = false; return undefined; }
    const t = setTimeout(() => salvarSessao(alvoId, sessao), 600);
    return () => clearTimeout(t);
  }, [alvoId, sessao]);

  // ⚠ O tema é gravado NA CRIATURA, e não em chave própria como a sessão: ele
  // precisa viajar no export para a ficha chegar bonita na mão dos outros
  // (autor, 2026-08-05). O `update` do armazenamento faz MERGE, então um Salvar
  // do criador que não conhece o campo `aparencia` preserva o que já está lá.
  const primeiroTema = useRef(true);
  useEffect(() => {
    if (primeiroTema.current) { primeiroTema.current = false; return undefined; }
    const t = setTimeout(() => onSalvarTema?.(tema), 600);
    return () => clearTimeout(t);
  }, [tema, onSalvarTema]);

  // O cabeçalho encolhe ao rolar. ⚠ Só faz diferença em tela BAIXA: a regra de
  // esconder a fileira de stats mora numa media query de altura, no ficha.css.
  // Esconder num monitor grande seria trocar carga cognitiva por rolagem.
  useEffect(() => {
    const aoRolar = () => setCompacto(window.scrollY > 96);
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Teclado. ⚠ Nada dispara enquanto o foco está num campo: os vitais e os
  // filtros são campos de texto, e digitar "1" no PV não pode trocar de aba.
  useEffect(() => {
    const aoTeclar = (e) => {
      const alvo = e.target;
      const digitando = alvo?.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta(true);
        return;
      }
      if (digitando || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= TABS.length) setTab(TABS[n - 1].id);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const setVital = useCallback((chave, valor) => {
    atualiza((s) => ({ ...s, [chave]: Math.max(0, Math.trunc(valor) || 0) }));
  }, [atualiza]);

  // Tudo que a criatura escolheu, dos seis catálogos, num formato só. É o que a
  // aba Habilidades exibe e o que a busca varre.
  const itens = useMemo(() => conteudoDaFicha(ficha, derived), [ficha, derived]);
  const alvos = useMemo(() => alvosDeBusca(derived), [derived]);

  const alternaItem = useCallback((chave) => {
    setAbertos((s) => {
      const proximo = new Set(s);
      if (proximo.has(chave)) proximo.delete(chave); else proximo.add(chave);
      return proximo;
    });
  }, []);

  const alternaFavorito = useCallback((chave) => {
    atualiza((s) => ({
      ...s,
      favoritos: s.favoritos.includes(chave)
        ? s.favoritos.filter((f) => f !== chave)
        : [...s.favoritos, chave],
    }));
  }, [atualiza]);

  // A busca navega: troca de aba, abre o item e rola até ele.
  const irPara = useCallback((r) => {
    setTab(r.aba);
    if (r.aba === "habilidades") setAbertos((s) => new Set(s).add(r.chave));
    setDestaque(r.chave);
  }, []);

  /* Rola e registra. DEVOLVE a rolagem, porque quem chamou às vezes precisa do
     resultado: a linha de dano usa o crítico do Acerto para dobrar os dados do
     Dano seguinte. O modo (vantagem, desvantagem) vale só para o d20. */
  const rolar = useCallback((desc) => {
    const r = desc.tipo === "dano"
      ? rolarDano(desc)
      : rolarTeste({ ...desc, modo });
    atualiza((s) => registraRolagem(s, r));
    return r;
  }, [atualiza, modo]);

  /* `id` é o gancho estável do tema (`[data-afty-stat="defesa"]`), e por isso
     ele NÃO é derivado do rótulo: renomear "RD Espec." na tela não pode quebrar
     o CSS de quem já escreveu o dele. */
  const stats = useMemo(() => [
    { id: "defesa", k: "Defesa", v: derived.defesa, p: "defesa" },
    { id: "cd", k: "CD", v: derived.cd, p: "cd" },
    { id: "rd-geral", k: "RD Geral", v: derived.rdGeral, p: "rdGeral" },
    ...(derived.rdEspecifico > 0 ? [{ id: "rd-especifica", k: "RD Espec.", v: derived.rdEspecifico, p: "rdEspecifico" }] : []),
    ...(derived.rdAlma > 0 ? [{ id: "rd-alma", k: "RD a Alma", v: derived.rdAlma, p: "rdAlma" }] : []),
    ...(derived.rdFisico > 0 ? [{ id: "rd-fisica", k: "RD Física", v: derived.rdFisico }] : []),
    { id: "movimento", k: "Movimento", v: `${numeroBr(derived.movimento)}m`, p: "movimento" },
    { id: "iniciativa", k: "Iniciativa", v: derived.iniciativa, p: "iniciativa", sinal: true },
    { id: "atencao", k: "Atenção", v: derived.atencao, p: "atencao" },
    { id: "res-parcial", k: "Res. Parcial", v: derived.resParcial, p: "resParcial" },
    { id: "maestria", k: "Maestria", v: derived.maestria, sinal: true },
    ...(derived.pontosPreparo > 0 ? [{ id: "preparo", k: "Preparo", v: derived.pontosPreparo, p: "pontosPreparo" }] : []),
  ], [derived]);

  /* ⚠ O delta roda um `deriveAfty` por estado LIGADO, e por isso ele mora num
     `useMemo` amarrado à ficha e à sessão: sem isso ele recalcularia a cada
     tecla digitada no campo de PV. Com três ou quatro estados ligados custa uns
     7ms, e a lista some inteira fora de combate. */
  const deltaPorEstado = useMemo(
    () => deltaDosEstados(
      ficha, sessao.combate,
      { almaAtual: sessao.almaAtual, buffs: sessao.buffs },
      derived,
    ),
    [ficha, sessao.combate, sessao.almaAtual, sessao.buffs, derived],
  );

  const itensDoRapido = useMemo(
    () => sessao.favoritos.map((c) => itens.find((i) => i.chave === c)).filter(Boolean),
    [sessao.favoritos, itens],
  );

  const corpo = {
    acoes: () => (
      <AbaAcoes
        derived={derived}
        rolar={rolar}
        destaque={destaque}
        rapido={itensDoRapido}
        abertos={abertos}
        onAberto={alternaItem}
        onFavorito={alternaFavorito}
      />
    ),
    habilidades: () => (
      <AbaHabilidades
        itens={itens}
        abertos={abertos}
        onAberto={alternaItem}
        favoritos={sessao.favoritos}
        onFavorito={alternaFavorito}
        destaque={destaque}
      />
    ),
    pericias: () => <AbaPericias derived={derived} rolar={rolar} destaque={destaque} />,
    buffs: () => (
      <AbaBuffs
        derived={derived}
        sessao={sessao}
        deltaPorEstado={deltaPorEstado}
        onPatchCombate={(parcial) => atualiza((s) => ({ ...s, combate: { ...s.combate, ...parcial } }))}
        onBuffs={(buffs) => atualiza((s) => ({ ...s, buffs }))}
        onCondicoes={(condicoes) => atualiza((s) => ({ ...s, condicoes }))}
      />
    ),
  };

  const varsCss = SEM_CSS ? "" : cssDasVars(tema);
  const usuarioCss = SEM_CSS ? "" : cssDoUsuario(tema);

  return (
    <>
    <div className="afty-ficha" id="afty-ficha">
      {/* ⚠ A ORDEM É A REGRA. Os dois blocos são CSS sem camada e de mesma
          especificidade, então quem vem depois vence: o CSS livre sobrepõe o
          formulário, que é o que se espera da ferramenta mais avançada das
          duas. E os dois vencem as utilidades do Tailwind, que vivem em
          `@layer`. */}
      {varsCss && <style>{varsCss}</style>}
      {usuarioCss && <style>{usuarioCss}</style>}

      <header className="afty-cabecalho" data-afty-compacto={compacto ? "sim" : "nao"}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* ---------- identidade ---------- */}
          <div className="flex items-center gap-2 py-2">
            <button type="button" className="afty-botao" onClick={onVoltar} aria-label="Voltar">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {ficha.portraitUrl && (
              <img
                src={ficha.portraitUrl}
                alt=""
                className="afty-retrato w-9 h-9 rounded-full object-cover flex-shrink-0"
                style={{ objectPosition: `${ficha.portraitFocus?.x ?? 50}% ${ficha.portraitFocus?.y ?? 50}%` }}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="afty-nome text-sm sm:text-base font-bold truncate">
                {ficha.name || "Sem nome"}
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                <Chip tom="destaque">{rotuloDe(AFTY_TIPOS, ficha.core.tipo)}</Chip>
                <Chip>{rotuloDe(AFTY_PATAMARES, ficha.core.patamar)}</Chip>
                <Chip>ND {derived.nd}</Chip>
                <Chip title="Grau do Feiticeiro, que vem do ND">{derived.grauFeiticeiro.label}</Chip>
                {derived.carga?.sobrecarregado && (
                  <Chip tom="aviso" title={`${derived.carga.cargaLimite} espaços de limite`}>
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    Sobrecarregado
                  </Chip>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                className="afty-botao"
                onClick={() => setAparenciaAberta(true)}
                title="Aparência da ficha"
                aria-label="Aparência da ficha"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="afty-botao"
                onClick={() => setBuscaAberta(true)}
                title="Buscar na ficha (Ctrl+K)"
                aria-label="Buscar na ficha"
              >
                <Search className="w-4 h-4" />
              </button>
              {/* ⚠ Era "R 3", com o rótulo só no `title`. Abreviação que precisa
                  de hover para ser entendida não existe no celular, e a palavra
                  inteira cabe. */}
              <span className="afty-chip">Rodada {sessao.rodada}</span>
              <button
                type="button"
                className="afty-botao"
                onClick={() => atualiza((s) => proximaRodada(s).sessao)}
                title="Próxima rodada"
                aria-label="Próxima rodada"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="afty-botao"
                onClick={() => atualiza((s) => descansar(s, derived))}
                title="Descanso: devolve os recursos e zera a rodada"
                aria-label="Descanso"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button type="button" className="afty-botao" onClick={onEditar} title="Editar no criador">
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            </div>
          </div>

          {/* ---------- vitais ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-2">
            <Vital
              tipo="pv" icone={Heart} rotulo="Vida"
              atual={sessao.hpAtual} max={derived.hp} temp={sessao.pvTempAtual}
              partes={derived.partes?.hp}
              onSet={(v) => setVital("hpAtual", v)}
              /* ⚠ No PV o delta NEGATIVO é dano, e dano come o PV temporário
                 primeiro. Subtrair direto pularia a casca. */
              onDelta={(n) => atualiza((s) => (n < 0 ? aplicaDano(s, -n) : aplicaCura(s, n, derived.hp)))}
            />
            <Vital
              tipo="pe" icone={Zap} rotulo={derived.recursoLabel}
              atual={sessao.peAtual} max={derived.pe}
              partes={derived.partes?.pe}
              onSet={(v) => setVital("peAtual", v)}
              onDelta={(n) => setVital("peAtual", sessao.peAtual + n)}
            />
            <Vital
              tipo="alma" icone={Sparkles} rotulo="Alma"
              atual={sessao.almaAtual} max={derived.almaMax}
              onSet={(v) => setVital("almaAtual", v)}
              onDelta={(n) => setVital("almaAtual", sessao.almaAtual + n)}
            />
          </div>

          {/* ---------- defesas ----------
              ⚠ GRADE de células iguais, e não `flex-wrap`. Com o wrap cada
              caixa ficava do tamanho do próprio texto ("CD" minúscula ao lado
              de "Res. Parcial" larga) e a fileira virava uma serra. O autor
              apontou em 2026-08-05. */}
          <div className="afty-stats grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-1.5 pb-2">
            {stats.map((s) => (
              <span key={s.id} className="afty-stat" data-afty-stat={s.id}>
                <span className="afty-stat-rotulo" title={s.k}>{s.k}</span>
                <NumeroComFontes
                  valor={s.v}
                  partes={s.p ? derived.partes?.[s.p] : null}
                  total={s.v}
                  formatar={!!s.sinal}
                  className="afty-stat-valor"
                />
              </span>
            ))}
          </div>

          {/* ---------- abas ---------- */}
          <div className="afty-abas" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`afty-aba-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="afty-painel"
                className="afty-aba"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main
        id="afty-painel"
        role="tabpanel"
        aria-labelledby={`afty-aba-${tab}`}
        className="max-w-7xl mx-auto px-3 sm:px-4 py-4"
      >
        {(corpo[tab] ?? corpo.acoes)()}
        {/* O painel de rolagens é fixo no canto e cobre o fim do conteúdo.
            Este respiro impede que a última linha da aba fique embaixo dele. */}
        <div className="h-24" aria-hidden="true" />
      </main>

      <PainelDeRolagens
        log={sessao.log}
        modo={modo}
        onModo={setModo}
        aberto={logAberto}
        onAberto={setLogAberto}
        onLimpar={() => atualiza((s) => ({ ...s, log: [] }))}
      />

      {buscaAberta && (
        <BuscaGlobal
          onFechar={() => setBuscaAberta(false)}
          itens={itens}
          alvos={alvos}
          onIr={irPara}
        />
      )}

      {aparenciaAberta && (
        <PainelDeAparencia
          tema={tema}
          onTema={setTema}
          onFechar={() => setAparenciaAberta(false)}
          onGlobal={() => salvarTemaGlobal(tema)}
        />
      )}
    </div>

    {/* ⚠ O BOTE SALVA-VIDAS, e ele mora FORA da raiz da Ficha de propósito. Com
        `@scope` o CSS do usuário não alcança nada daqui, e o estilo é EMBUTIDO,
        que vence qualquer folha sem `!important`. Só aparece para quem tem CSS
        livre ligado: um botão permanente seria sujeira para os 99% que nunca
        vão abrir o editor. A saída final, essa sim à prova de tudo, é o
        `?semcss=1` na URL. */}
    {!SEM_CSS && tema.ligado && temCssLivre(tema) && (
      <button
        type="button"
        onClick={() => setTema({ ...tema, ligado: false })}
        title="Desligar o CSS personalizado"
        aria-label="Desligar o CSS personalizado"
        style={{
          position: "fixed", left: 8, bottom: 8, zIndex: 2147483647,
          width: 28, height: 28, display: "flex",
          alignItems: "center", justifyContent: "center",
          borderRadius: 9999, cursor: "pointer",
          border: "1px solid rgba(148,163,184,0.5)",
          background: "rgba(15,23,42,0.92)", color: "#e2e8f0",
          font: "700 13px/1 ui-monospace, monospace",
        }}
      >
        ×
      </button>
    )}
    </>
  );
}
