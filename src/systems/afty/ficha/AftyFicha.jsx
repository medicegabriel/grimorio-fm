import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Pencil, AlertTriangle, Moon, ChevronRight, Search, Heart, Zap, Sparkles, Palette,
  Rows2, Rows3,
} from "lucide-react";

import "./ficha.css";
import { mesclaFichaAfty, AFTY_TIPOS, AFTY_PATAMARES, funcionamentosDaFicha } from "../afty-schema";
import { deriveAfty } from "../afty-derive";
import { aplicarAddons, addonsDaCriatura } from "../afty-addons";
import { NumeroComFontes } from "../ui/fontes";
import { numeroBr } from "../ui/formato";
import { Vital } from "../ui/vital";
import { Guarda } from "../ui/guarda";
import {
  carregarSessao, salvarSessao, aparaSessao,
  aplicaDano, aplicaCura, proximaRodada, descansar, registraRolagem,
  peTempTotal, gastaPe, pvTempTotal,
  entradaDaGuarda, sofreGolpeNaGuarda, desfazGolpeNaGuarda, encerraGuarda, defineCondicoes,
  alteraEstadoCombate, consomeEstadoCombate, registraFeiticoDano,
  configuraRitual, usosRitualista,
  ritualEmAndamento,
  iniciaRitualComum, iniciaRitualSemTeste, iniciaRitualEstendido,
  concluiPreparacaoRitual, cancelaRitual, finalizaRitual, encerraRitual, desativaRitual,
  concedeNaSessao, removeConcessao,
} from "./ficha-sessao";
import { rolarTeste, rolarDano } from "./ficha-rolagem";
import PrimitivasDeAddon from "../ui/PrimitivasDeAddon";
import { conteudoDaFicha, equipamentosDaFicha, alvosDeBusca } from "./ficha-conteudo";
import {
  carregarTema, salvarTemaGlobal, cssDasVars, cssDoUsuario, temCssLivre,
  carregarDensidade, salvarDensidade,
} from "./ficha-tema";
import PainelDeRolagens from "./PainelDeRolagens";
import BuscaGlobal from "./BuscaGlobal";
import PainelDeAparencia from "./PainelDeAparencia";
import AbaAcoes from "./abas/AbaAcoes";
import AbaPericias from "./abas/AbaPericias";
import AbaHabilidades from "./abas/AbaHabilidades";
import AbaBuffs from "./abas/AbaBuffs";
import AbaEquipamentos from "./abas/AbaEquipamentos";
import AbaInvocacoes from "./abas/AbaInvocacoes";
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
  { id: "equipamentos", label: "Equipamentos" },
  { id: "invocacoes", label: "Invocações" },
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
  // ⚠ A densidade é gravada NA HORA, e não por debounce como o tema: ela muda por
  // clique num interruptor de duas posições, e não por arrastar um seletor de cor.
  const [densidade, setDensidade] = useState(carregarDensidade);
  const trocaDensidade = useCallback(() => {
    setDensidade((d) => {
      const proxima = d === "compacta" ? "confortavel" : "compacta";
      salvarDensidade(proxima);
      return proxima;
    });
  }, []);

  // ⚠ O `combate` que a Ficha deriva é o DA SESSÃO, e não o da ficha: o da ficha
  // é a bancada de balanceamento do criador, e misturar os dois faria cada
  // sessão de jogo destruir o cenário montado para dosar a mão. Ver
  // `ficha-sessao.js`.
  /* ⚠ AS OPÇÕES DO DERIVE MORAM AQUI, e não dentro do memo do `derived`, porque
     elas têm DOIS leitores: a ficha da tela e cada derive de comparação que o
     `deltaDosEstados` roda para descobrir o que um estado ligado está fazendo.

     Ter duas listas foi um bug real, e caro de enxergar (2026-08-28): o delta
     derivava sem `guarda`, sem `concedido` e sem os três de Ritual, e então a
     diferença entre as duas LISTAS DE OPÇÃO era creditada ao estado que estava
     sendo medido. Numa criatura Calamidade toda linha ligada exibia "Defesa +5",
     que é a Guarda Inabalável, e a Postura da Devastação, que não dá Defesa
     nenhuma, aparecia dando +5. Uma lista só, e a diferença cancela sozinha. */
  const opcoesDerive = useMemo(
    () => ({
      almaAtual: sessaoBruta.almaAtual,
      ultimoFeiticoDanoId: sessaoBruta.ultimoFeiticoDanoId,
      rituais: sessaoBruta.rituais,
      usosRitualista: usosRitualista(sessaoBruta),
      ritualAtual: ritualEmAndamento(sessaoBruta),
      /* O que o mestre concedeu no meio da luta (Addons 8.3). Entra pelo
         `opcoes`, e não pela criatura mesclada abaixo, porque não é escolha
         de ficha: é ganho de combate, de graça, e morre com a sessão. */
      concedido: sessaoBruta.concedido,
      /* A Guarda Inabalável CORRENTE. Vai pelo `opcoes` como a concessão e
         pelo mesmo motivo: é estado de mesa. O derive precisa dela porque o
         bônus soma na Defesa e nos cinco TRs, e resolver a Guarda fora dele
         obrigaria a derivar duas vezes. Ver `entradaDaGuarda`. */
      guarda: entradaDaGuarda(sessaoBruta),
    }),
    [sessaoBruta],
  );

  const derived = useMemo(
    () => {
      /* ⚠ OS ADDONS DA FICHA ENTRAM ANTES DA DERIVAÇÃO, e no MESMO memo. Sem
         isto, abrir uma criatura que usa addon mostraria as habilidades dela
         como ids órfãos, porque o catálogo estaria só com o raw. É a mesma
         ordem do criador. Ver docs/afty-addons.md. */
      aplicarAddons(ficha?.addons ?? []);
      return deriveAfty(
        { ...ficha, combate: sessaoBruta.combate, buffsSessao: sessaoBruta.buffs },
        opcoesDerive,
      );
    },
    [ficha, sessaoBruta, opcoesDerive],
  );

  /* Os addons que ESTA ficha carrega, para a marca do cabeçalho. Sai da própria
     criatura (a cópia congelada), e não da biblioteca da máquina: a marca tem de
     valer também para quem recebeu a ficha de fora e não instalou nada. */
  const addonsDaFicha = useMemo(() => addonsDaCriatura(ficha), [ficha]);

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
  // ⚠ O inventário é uma lista SEPARADA, e não parte do `itens`: aquela é "o que
  // a criatura sabe fazer" e esta é "o que ela carrega". Junta-las faria a aba
  // Habilidades mostrar espada no meio de Habilidade.
  const equipamentos = useMemo(() => equipamentosDaFicha(derived), [derived]);
  const alvos = useMemo(() => alvosDeBusca(derived), [derived]);
  // A busca global varre as DUAS listas, e cada resultado sabe para qual aba ir.
  const itensBuscaveis = useMemo(() => [...itens, ...equipamentos], [itens, equipamentos]);

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
    if (r.aba === "habilidades" || r.aba === "equipamentos") {
      setAbertos((s) => new Set(s).add(r.chave));
    }
    setDestaque(r.chave);
  }, []);

  /* Rola e registra. DEVOLVE a rolagem, porque quem chamou às vezes precisa do
     resultado: a linha de dano usa o crítico do Acerto para dobrar os dados do
     Dano seguinte. O modo (vantagem, desvantagem) vale só para o d20. */
  const rolar = useCallback((desc) => {
    const r = desc.tipo === "dano"
      ? rolarDano(desc)
      : rolarTeste({ ...desc, modo });
    atualiza((s) => {
      let proxima = registraRolagem(s, r);
      if (desc.consomeEstado) proxima = consomeEstadoCombate(proxima, desc.consomeEstado);
      if (desc.feiticoDanoId) proxima = registraFeiticoDano(proxima, desc.feiticoDanoId);
      if (desc.testaRitualId) {
        proxima = iniciaRitualComum(
          proxima,
          desc.testaRitualId,
          r.sucesso === true,
          !!desc.consomeRitualistaId,
        );
      }
      if (desc.finalizaRitualId) {
        proxima = finalizaRitual(proxima, desc.finalizaRitualId);
      }
      return proxima;
    });
    return r;
  }, [atualiza, modo]);

  const alteraEstado = useCallback((estado, valor) => {
    atualiza((s) => alteraEstadoCombate(s, estado, valor));
  }, [atualiza]);

  /* `id` é o gancho estável do tema (`[data-afty-stat="defesa"]`), e por isso
     ele NÃO é derivado do rótulo: renomear "RD Espec." na tela não pode quebrar
     o CSS de quem já escreveu o dele. */
  const stats = useMemo(() => [
    { id: "defesa", k: "Defesa", v: derived.defesa, p: "defesa" },
    { id: "cd", k: "CD", v: derived.cd, p: "cd" },
    { id: "rd-geral", k: "RD Geral", v: derived.rdGeral, p: "rdGeral" },
    ...(derived.rdEspecifico > 0 ? [{ id: "rd-especifica", k: "RD Espec.", v: derived.rdEspecifico, p: "rdEspecifico" }] : []),
    ...(derived.rdAlma > 0 ? [{ id: "rd-alma", k: "RD a Alma", v: derived.rdAlma, p: "rdAlma" }] : []),
    ...(derived.rdFisico > 0 ? [{ id: "rd-fisica", k: "RD Física", v: derived.rdFisico, p: "rdFisico" }] : []),
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
      /* ⚠ AS MESMAS OPÇÕES DA FICHA, inteiras, e não uma seleção escrita à mão:
         cada derive de comparação tem de sair do mesmo estado de mesa que o
         `derived` acima, senão a diferença entre as opções vira bônus fantasma
         em toda linha ligada. O `buffs` viaja junto porque ele não é opção do
         derive, e sim a lista que entra NA CRIATURA como `buffsSessao`. */
      { ...opcoesDerive, buffs: sessao.buffs },
      derived,
    ),
    [ficha, sessao.combate, sessao.buffs, opcoesDerive, derived],
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
        onRitual={(feiticoId, proxima) => atualiza((s) => configuraRitual(s, feiticoId, proxima))}
        onDesativarRitual={(feiticoId) => atualiza((s) => desativaRitual(s, feiticoId))}
        onIniciarRitualEstendido={(feiticoId, usaRitualista) => (
          atualiza((s) => iniciaRitualEstendido(s, feiticoId, usaRitualista))
        )}
        onIniciarRitualSemTeste={(feiticoId, usaRitualista) => (
          atualiza((s) => iniciaRitualSemTeste(s, feiticoId, usaRitualista))
        )}
        onConcluirPreparacaoRitual={(feiticoId) => (
          atualiza((s) => concluiPreparacaoRitual(s, feiticoId))
        )}
        onCancelarRitual={(feiticoId) => atualiza((s) => cancelaRitual(s, feiticoId))}
        onFinalizarRitual={(feiticoId) => atualiza((s) => finalizaRitual(s, feiticoId))}
        onEncerrarRitual={(feiticoId) => atualiza((s) => encerraRitual(s, feiticoId))}
        onImbuir={(estadoId, feiticoId) => alteraEstado({ id: estadoId }, feiticoId)}
      />
    ),
    habilidades: () => (
      <AbaHabilidades
        funcionamentos={funcionamentosDaFicha(ficha)}
        itens={itens}
        abertos={abertos}
        onAberto={alternaItem}
        favoritos={sessao.favoritos}
        onFavorito={alternaFavorito}
        destaque={destaque}
      />
    ),
    pericias: () => <AbaPericias derived={derived} rolar={rolar} destaque={destaque} />,
    equipamentos: () => (
      <AbaEquipamentos
        derived={derived}
        itens={equipamentos}
        abertos={abertos}
        onAberto={alternaItem}
        favoritos={sessao.favoritos}
        onFavorito={alternaFavorito}
        destaque={destaque}
      />
    ),
    invocacoes: () => <AbaInvocacoes derived={derived} rolar={rolar} destaque={destaque} />,
    buffs: () => (
      <AbaBuffs
        derived={derived}
        sessao={sessao}
        deltaPorEstado={deltaPorEstado}
        onPatchCombate={(parcial) => atualiza((s) => ({ ...s, combate: { ...s.combate, ...parcial } }))}
        onEstado={alteraEstado}
        onBuffs={(buffs) => atualiza((s) => ({ ...s, buffs }))}
        /* ⚠ PASSA PELO `defineCondicoes`, e não escreve o campo cru: oito
           condições derrubam a Guarda Inabalável, e escrever direto deixaria o
           chefe com a Guarda de pé debaixo de um Atordoado. */
        onCondicoes={(condicoes) => atualiza((s) => defineCondicoes(s, condicoes))}
        onConceder={(familia, id) => atualiza((s) => concedeNaSessao(s, familia, id))}
        onRemoverConcessao={(uid) => atualiza((s) => removeConcessao(s, uid))}
      />
    ),
  };

  const varsCss = SEM_CSS ? "" : cssDasVars(tema);
  const usuarioCss = SEM_CSS ? "" : cssDoUsuario(tema);

  return (
    /* As primitivas de Addon que ESTA criatura enxerga. Sem provedor, ninguém
       enxerga nada, que é o certo para quem só usa o raw. Ver
       `ui/usar-primitiva.js`. */
    <PrimitivasDeAddon primitivas={derived.primitivas}>
    <>
    <div className="afty-ficha" id="afty-ficha" data-afty-densidade={densidade}>
      {/* ⚠ A ORDEM É A REGRA. Os dois blocos são CSS sem camada e de mesma
          especificidade, então quem vem depois vence: o CSS livre sobrepõe o
          formulário, que é o que se espera da ferramenta mais avançada das
          duas. E os dois vencem as utilidades do Tailwind, que vivem em
          `@layer`. */}
      {varsCss && <style>{varsCss}</style>}
      {usuarioCss && <style>{usuarioCss}</style>}

      <header className="afty-cabecalho" data-afty-compacto={compacto ? "sim" : "nao"}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div
            className="afty-cabecalho-conteudo"
            data-afty-com-retrato={ficha.portraitUrl ? "sim" : "nao"}
          >
            <div className="afty-cabecalho-principal min-w-0">
          {/* ---------- identidade ----------
              ⚠ `flex-wrap` e a fileira de controles em LINHA PRÓPRIA no celular.
              São sete botões mais o contador de rodada, e com alvo de toque de
              44px eles somam mais de 300px: ao lado do nome, numa tela de 360,
              esmagavam o nome da criatura até três letras. */}
          <div className="flex flex-wrap items-center gap-2 py-2">
            <button type="button" className="afty-botao" onClick={onVoltar} aria-label="Voltar">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="afty-nome text-sm sm:text-base font-bold truncate">
                {ficha.name || "Sem nome"}
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                <Chip tom="destaque">{rotuloDe(AFTY_TIPOS, ficha.core.tipo)}</Chip>
                <Chip>{rotuloDe(AFTY_PATAMARES, ficha.core.patamar)}</Chip>
                <Chip>ND {derived.nd}</Chip>
                <Chip title="Grau do Feiticeiro, que vem do ND">{derived.grauFeiticeiro.label}</Chip>
                {/* Só quando saiu de Médio: um chip "Médio" em toda ficha é
                    ruído, porque é o padrão de quase todas. */}
                {derived.tamanhoDegraus !== 0 && (
                  <Chip title="Mexe em Atletismo e Furtividade">
                    {derived.tamanhoLabel} · {String(derived.tamanhoEspacoAlcance).replace(".", ",")}m
                  </Chip>
                )}
                {derived.carga?.sobrecarregado && (
                  <Chip tom="aviso" title={`${derived.carga.cargaLimite} espaços de limite`}>
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    Sobrecarregado
                  </Chip>
                )}
                {/* ⚠ A MARCA DE "NÃO RAW". Não é advertência moral, é
                    informação: quem recebe esta ficha precisa saber que ela não
                    é o livro puro ANTES de comparar com a mesa dele. O `title`
                    nomeia os addons, que é onde explicação de item vive. Ver a
                    seção 7 de docs/afty-addons.md. */}
                {addonsDaFicha.length > 0 && (
                  <Chip
                    tom="destaque"
                    title={addonsDaFicha.map((a) => `${a.nome} ${a.versao}`).join("\n")}
                  >
                    {addonsDaFicha.length === 1
                      ? addonsDaFicha[0].nome
                      : `${addonsDaFicha.length} addons`}
                  </Chip>
                )}
              </div>
            </div>
            <div className="afty-controles flex items-center justify-end gap-1.5 w-full order-last sm:w-auto sm:order-none sm:flex-shrink-0">
              <button
                type="button"
                className="afty-botao"
                onClick={trocaDensidade}
                title={densidade === "compacta" ? "Densidade compacta" : "Densidade confortável"}
                aria-label="Trocar a densidade da ficha"
                aria-pressed={densidade === "compacta"}
              >
                {densidade === "compacta"
                  ? <Rows3 className="w-4 h-4" />
                  : <Rows2 className="w-4 h-4" />}
              </button>
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
                onClick={() => atualiza((s) => proximaRodada(s, derived).sessao)}
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
              atual={sessao.hpAtual} max={derived.hp} temp={pvTempTotal(sessao)}
              partes={derived.partes?.hp}
              onSet={(v) => setVital("hpAtual", v)}
              /* ⚠ No PV o delta NEGATIVO é dano, e dano come o PV temporário
                 primeiro. Subtrair direto pularia a casca. */
              onDelta={(n) => atualiza((s) => (n < 0 ? aplicaDano(s, -n) : aplicaCura(s, n, derived.hp)))}
            />
            <Vital
              tipo="pe" icone={Zap} rotulo={derived.recursoLabel}
              atual={sessao.peAtual} max={derived.pe} temp={peTempTotal(sessao)}
              rotuloTemp={`${derived.recursoLabel} Temporário`}
              partes={derived.partes?.pe}
              onSet={(v) => setVital("peAtual", v)}
              /* ⚠ Delta NEGATIVO é GASTO, e gasto come a casca primeiro, igual ao
                 dano no PV. Subtrair direto pularia o PE temporário e o jogador
                 pagaria duas vezes: uma na casca que não some e outra no PE. */
              onDelta={(n) => atualiza((s) => (
                n < 0 ? gastaPe(s, -n) : { ...s, peAtual: Math.max(0, s.peAtual + n) }
              ))}
            />
            <Vital
              tipo="alma" icone={Sparkles} rotulo="Alma"
              atual={sessao.almaAtual} max={derived.almaMax}
              onSet={(v) => setVital("almaAtual", v)}
              onDelta={(n) => setVital("almaAtual", sessao.almaAtual + n)}
            />
          </div>

          {/* ---------- Guarda Inabalável ----------
              Some inteira fora do Calamidade e do Beyond, que é a maioria das
              criaturas. Fica entre os vitais e as defesas porque a casca dela
              está na barra de PV logo acima, e o bônus já está somado na Defesa
              logo abaixo: no meio, ela liga as duas. */}
          <Guarda
            guarda={derived.guarda}
            partes={derived.partes?.guardaAtual}
            onGolpe={() => atualiza((s) => sofreGolpeNaGuarda(s, derived))}
            onDesfazGolpe={() => atualiza(desfazGolpeNaGuarda)}
            onRaioNegro={() => atualiza(encerraGuarda)}
          />

          {/* ---------- defesas ----------
              ⚠ GRADE de células iguais, e não `flex-wrap`. Com o wrap cada
              caixa ficava do tamanho do próprio texto ("CD" minúscula ao lado
              de "Res. Parcial" larga) e a fileira virava uma serra. O autor
              apontou em 2026-08-05.

              ⚠ E as COLUNAS moram no `.afty-stats` do `ficha.css`, não aqui.
              Eram `grid-cols-N` por breakpoint, e como a fileira tem de 8 a 12
              células conforme a criatura, a que sobrava abria uma segunda
              fileira e esticava o cabeçalho e o retrato junto. */}
          <div className="afty-stats pb-2">
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
            </div>

            {ficha.portraitUrl && (
              <div className="afty-retrato-painel" aria-hidden="true">
                <img
                  src={ficha.portraitUrl}
                  alt=""
                  className="afty-retrato"
                  style={{ objectPosition: `${ficha.portraitFocus?.x ?? 50}% ${ficha.portraitFocus?.y ?? 50}%` }}
                />
              </div>
            )}
          </div>

          {/* ---------- abas ---------- */}
          <div className="afty-abas" role="tablist" aria-label="Seções da ficha">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`afty-aba-${t.id}`}
                data-afty-aba={t.id}
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

      <div
        className="afty-ficha-corpo"
        data-afty-imagem-encaixe={tema.imagem.encaixe || "cover"}
      >
        <main
          id="afty-painel"
          role="tabpanel"
          aria-labelledby={`afty-aba-${tab}`}
          className="max-w-7xl mx-auto px-3 sm:px-4 py-4"
        >
          {/* ⚠ LINHA MORTA E MARCADA (decisão 4 do autor, 2026-08-20). A ficha
              SEMPRE abre: o que o mundo não tem aparece aqui, marcado, e não
              soma nada. Vem antes do corpo porque é a única coisa da tela que
              pede ação, e some sozinho quando não há nada. Ver
              docs/afty-addons.md seção 9. */}
          {(derived.addonProblemas?.length ?? 0) > 0 && (
            <div className="afty-card mb-4 p-3 space-y-2">
              {derived.addonProblemas.map((m) => (
                <div key={`${m.familia}:${m.id}`}>
                  <p className="text-[11px] flex items-start gap-1" style={{ color: "var(--afty-aviso)" }}>
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
                    <span>{m.motivo}</span>
                  </p>
                  <p className="afty-rotulo text-[11px] pl-4">{m.saida}</p>
                </div>
              ))}
            </div>
          )}
          {(corpo[tab] ?? corpo.acoes)()}
          {/* O painel de rolagens é fixo no canto e cobre o fim do conteúdo.
              Este respiro impede que a última linha da aba fique embaixo dele.
              ⚠ Ele cresceu em 2026-08-06: o painel subiu para não cobrir o botão
              dos Livros, e o respiro tem que cobrir a soma dos dois. */}
          <div className="afty-respiro h-48" aria-hidden="true" />
        </main>
      </div>

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
          itens={itensBuscaveis}
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
    </PrimitivasDeAddon>
  );
}
