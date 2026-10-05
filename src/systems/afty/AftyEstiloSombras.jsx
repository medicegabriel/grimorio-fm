/**
 * ============================================================
 * NOVO ESTILO DAS SOMBRAS NO CRIADOR (Expansão, 2026-10-04)
 * ============================================================
 * O card do Estilo pela regra da Expansão: o resumo das métricas, o
 * Funcionamento Básico, as Técnicas de Estilo como pacote (Modificação do
 * Domínio Simples ou Técnica de Estilo Especial) e o painel de validação.
 *
 * ⚠ ARQUIVO PRÓPRIO, fora do AftyCreatureBuilder (que já passa de 18 mil
 * linhas), e SEM import de volta para ele. O que só existe lá dentro (o editor
 * de linhas de Motor e o texto longo) chega por `componentes`. Importa só o
 * `afty-estilo-sombras` (que importa duas folhas), o catálogo (folha) e os
 * controles de tela: nenhum módulo do ciclo de `afty-equipamentos`. Ver
 * `asserts/t-ordem-modulos.mjs`.
 *
 * Regras de UI da casa: Title Case, sem ponto e vírgula, sem texto que ensina.
 * A descrição de cada efeito e as INFOs moram no hover (`DicaDeTexto`).
 * ============================================================
 */
import React, { useState } from "react";
import { AlertTriangle, ChevronDown, Info, Lock, Minus, Plus, Trash2, RefreshCw } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, NumberInput } from "../../components/builder-controls";
import { Card, BoolChip } from "./ui/primitivos";
import { PainelDeFontes, DicaDeTexto } from "./ui/fontes";
import { novoUidEstilo } from "./afty-estilo-sombras";
import {
  EFEITOS_ESTILO, MODIFICACOES_APTIDAO, ESCOLHA_ATAQUE, ESCOLHA_TR, DIFICULDADES_PREREQ,
  CRITICO_MODS, TIPO_MODIFICACAO, TIPO_ESPECIAL, ALVO_CONTRA_ATAQUE, alvoDoCritico,
  CATEGORIA_PROIBIDA_NO_ESTILO, TEXTO_CONTRA_ATAQUE, TEXTO_BAR5_REFLEXOS, TEXTO_CONDICOES,
} from "./afty-estilo-sombras-catalogo";

const numeroBr = (v) => String(v).replace(".", ",");
/** O rótulo curto do degrau do Contra-Ataque. O texto inteiro mora no hover. */
const ROTULO_DEGRAU = { metade: "Metade do Dano", anula: "Anula o Dano", anulaRebate: "Anula e Rebate" };
const sinal = (v) => (v > 0 ? `+${numeroBr(v)}` : numeroBr(v));

/** Uma métrica do resumo, com hover das fontes quando há partes. */
function Metrica({ rotulo, valor, partes, alerta = false }) {
  return (
    <span className={`relative group inline-flex items-baseline gap-1 text-[11px] px-2 py-1 rounded border ${
      alerta ? "border-red-800 bg-red-950/30 text-red-300" : "border-slate-700 bg-slate-800/50 text-slate-300"
    } ${partes?.length ? "cursor-help" : ""}`}>
      <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{rotulo}</span>
      <span className="font-mono font-bold">{valor}</span>
      {partes?.length ? <PainelDeFontes partes={partes} total={valor} /> : null}
    </span>
  );
}

/** O painel de validação: ERRO em vermelho, AVISO em âmbar, INFO no hover. */
function PainelValidacao({ itens = [] }) {
  const erros = itens.filter((v) => v.nivel === "erro");
  const avisos = itens.filter((v) => v.nivel === "aviso");
  const infos = itens.filter((v) => v.nivel === "info");
  if (!itens.length) return null;
  return (
    <div className="space-y-1">
      {erros.map((v, i) => (
        <p key={`e${i}`} className="text-[11px] text-red-400 flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
          <span>{v.texto}</span>
        </p>
      ))}
      {avisos.map((v, i) => (
        <p key={`a${i}`} className="text-[11px] text-amber-400 flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
          <span>{v.texto}</span>
        </p>
      ))}
      {infos.length > 0 && (
        <DicaDeTexto titulo="Regras" texto={infos.map((v) => v.texto).join("\n\n")}>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-help">
            <Info className="w-3 h-3" aria-hidden="true" /> Regras
          </span>
        </DicaDeTexto>
      )}
    </div>
  );
}

const botaoPequeno =
  "inline-flex items-center justify-center w-6 h-6 rounded border border-slate-700 text-slate-400 " +
  "hover:border-purple-600 hover:text-purple-200 transition-colors disabled:opacity-40 disabled:pointer-events-none";

/** Os efeitos da Modificação: um seletor por efeito e a lista do que já foi comprado. */
function EfeitosDaTecnica({ resolvida, pericias, onMudar }) {
  const [escolhas, setEscolhas] = useState({});
  const opcoesEscolha = (tipo) => {
    if (tipo === "tr") return ESCOLHA_TR.map((x) => ({ value: x.id, label: x.nome }));
    if (tipo === "ataque") return ESCOLHA_ATAQUE.map((x) => ({ value: x.id, label: x.nome }));
    if (tipo === "pericia") return (pericias ?? []).map((p) => ({ value: p.id, label: p.nome ?? p.label ?? p.id }));
    return [];
  };
  const comprar = (def) => {
    const alvo = def.escolha ? escolhas[def.id] : null;
    if (def.escolha && !alvo) return;
    onMudar((t) => ({
      ...t,
      efeitos: [...(t.efeitos ?? []), {
        uid: novoUidEstilo("ef"), efeitoId: def.id, ...(alvo ? { escolha: { [def.escolha]: alvo } } : {}),
      }],
    }));
  };
  const devolver = (uid) => onMudar((t) => ({
    ...t,
    efeitos: (t.efeitos ?? []).filter((e) => e.uid !== uid),
    // Pré-Requisito apontando para a compra removida perde o alvo, e a
    // validação mostra. Nada é apagado por tabela.
  }));
  const grupos = resolvida?.grupos ?? [];

  return (
    <div className="space-y-2">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {EFEITOS_ESTILO.map((def) => {
          const opcoes = opcoesEscolha(def.escolha);
          return (
            <div key={def.id} className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-950/40 px-2 py-1">
              <DicaDeTexto titulo={def.nome} texto={def.descricao} nota={def.notaAutor}>
                <span className="text-[11px] font-semibold text-slate-200 flex-1 min-w-0 truncate cursor-help">{def.nome}</span>
              </DicaDeTexto>
              {def.escolha && (
                <div className="w-28 flex-shrink-0">
                  <Select
                    value={escolhas[def.id] ?? ""}
                    onChange={(v) => setEscolhas((s) => ({ ...s, [def.id]: v }))}
                    options={opcoes}
                    placeholder="Escolher"
                    aria-label={`Escolha de ${def.nome}`}
                  />
                </div>
              )}
              <button
                type="button"
                className={botaoPequeno}
                onClick={() => comprar(def)}
                disabled={!!def.escolha && !escolhas[def.id]}
                aria-label={`Adicionar ${def.nome}`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
      {grupos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {grupos.map((g) => {
            const def = EFEITOS_ESTILO.find((e) => e.id === g.efeitoId);
            const nome = def ? (g.nomeEscolha ? `${def.nome} (${g.nomeEscolha})` : def.nome) : g.efeitoId;
            return (
              <span key={g.chave} className="inline-flex items-center gap-1 text-[11px] pl-2 pr-1 py-0.5 rounded border border-purple-800 bg-purple-950/30 text-purple-100">
                {nome}
                {g.n > 1 && <span className="font-mono text-purple-300">×{g.n}</span>}
                <button type="button" className={botaoPequeno} onClick={() => devolver(g.uids[g.uids.length - 1])} aria-label={`Tirar uma compra de ${nome}`}>
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** As modificações de Aptidão: só as Aptidões que a ficha tem, nunca as de Domínio. */
function AptidoesDaTecnica({ resolvida, aptidoesDaFicha, onMudar }) {
  const [escolha, setEscolha] = useState({});
  const opcoesDe = (mod) => aptidoesDaFicha
    .filter((a) => a.categoria !== CATEGORIA_PROIBIDA_NO_ESTILO)
    .filter((a) => (mod.aptidoes ? mod.aptidoes.includes(a.id) : a.categoria === mod.categoria))
    .map((a) => ({ value: a.id, label: a.nome }));
  const disponiveis = MODIFICACOES_APTIDAO.map((mod) => ({ mod, opcoes: opcoesDe(mod) })).filter((x) => x.opcoes.length);
  const adicionar = (mod, aptidaoId) => onMudar((t) => ({
    ...t, aptidoes: [...(t.aptidoes ?? []), { uid: novoUidEstilo("ap"), modId: mod.id, aptidaoId }],
  }));
  const tirar = (uid) => onMudar((t) => ({ ...t, aptidoes: (t.aptidoes ?? []).filter((a) => a.uid !== uid) }));
  const grupos = resolvida?.modificacoes ?? [];

  if (!disponiveis.length && !grupos.length) return null;
  return (
    <div className="space-y-2">
      <FieldLabel>Modificações de Aptidão</FieldLabel>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {disponiveis.map(({ mod, opcoes }) => {
          const escolhida = escolha[mod.id] ?? (opcoes.length === 1 ? opcoes[0].value : "");
          return (
            <div key={mod.id} className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-950/40 px-2 py-1">
              <DicaDeTexto titulo={mod.nome} texto={mod.descricao}>
                <span className="text-[11px] font-semibold text-slate-200 flex-1 min-w-0 truncate cursor-help">{mod.nome}</span>
              </DicaDeTexto>
              {opcoes.length > 1 && (
                <div className="w-32 flex-shrink-0">
                  <Select value={escolhida} onChange={(v) => setEscolha((s) => ({ ...s, [mod.id]: v }))} options={opcoes} placeholder="Aptidão" aria-label={`Aptidão de ${mod.nome}`} />
                </div>
              )}
              <button type="button" className={botaoPequeno} disabled={!escolhida} onClick={() => adicionar(mod, escolhida)} aria-label={`Adicionar ${mod.nome}`}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
      {grupos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {grupos.map((g) => {
            const mod = MODIFICACOES_APTIDAO.find((m) => m.id === g.modId);
            const nome = `${mod?.nome ?? g.modId} (${g.nomeAptidao})`;
            return (
              <span key={g.chave} className="inline-flex items-center gap-1 text-[11px] pl-2 pr-1 py-0.5 rounded border border-purple-800 bg-purple-950/30 text-purple-100">
                {nome}
                {g.n > 1 && <span className="font-mono text-purple-300">×{g.n}</span>}
                <button type="button" className={botaoPequeno} onClick={() => tirar(g.uids[g.uids.length - 1])} aria-label={`Tirar ${nome}`}>
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Pré-Requisitos: cada um aponta para UM efeito da Técnica. */
function PreRequisitosDaTecnica({ tecnica, resolvida, onMudar }) {
  const alvos = [
    ...(resolvida?.grupos ?? []).flatMap((g) => {
      const def = EFEITOS_ESTILO.find((e) => e.id === g.efeitoId);
      const nome = def ? (g.nomeEscolha ? `${def.nome} (${g.nomeEscolha})` : def.nome) : g.efeitoId;
      return g.uids.map((u, i) => ({ value: u, label: g.uids.length > 1 ? `${nome} ${i + 1}` : nome }));
    }),
    ...(resolvida?.modificacoes ?? []).flatMap((g) => {
      const mod = MODIFICACOES_APTIDAO.find((m) => m.id === g.modId);
      return g.uids.map((u) => ({ value: u, label: `${mod?.nome ?? g.modId} (${g.nomeAptidao})` }));
    }),
    ...(resolvida?.contra ? [{ value: ALVO_CONTRA_ATAQUE, label: "Contra-Ataque" }] : []),
    ...(resolvida?.criticoMods ?? []).map((c) => ({ value: alvoDoCritico(c.id), label: c.nome })),
  ];
  const lista = tecnica.requisitos ?? [];
  const mudar = (uid, partial) => onMudar((t) => ({
    ...t, requisitos: (t.requisitos ?? []).map((r) => (r.uid === uid ? { ...r, ...partial } : r)),
  }));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <FieldLabel>Pré-Requisitos</FieldLabel>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border border-slate-700 text-slate-300 hover:border-purple-600"
          onClick={() => onMudar((t) => ({ ...t, requisitos: [...(t.requisitos ?? []), { uid: novoUidEstilo("pr"), dificuldade: "facil", alvoUid: "", texto: "" }] }))}
        >
          <Plus className="w-3 h-3" /> Pré-Requisito
        </button>
      </div>
      {lista.map((r) => {
        const bonus = DIFICULDADES_PREREQ.find((d) => d.value === r.dificuldade)?.bonus ?? 0;
        return (
          <div key={r.uid} className="grid gap-1.5 sm:grid-cols-[8rem_1fr_1fr_auto] items-center">
            <Select
              value={r.dificuldade}
              onChange={(v) => mudar(r.uid, { dificuldade: v })}
              options={DIFICULDADES_PREREQ.map((d) => ({ value: d.value, label: `${d.label} (+${d.bonus})` }))}
              aria-label="Dificuldade"
            />
            <Select value={r.alvoUid ?? ""} onChange={(v) => mudar(r.uid, { alvoUid: v })} options={alvos} placeholder="Efeito" aria-label="Efeito do Pré-Requisito" />
            <TextInput value={r.texto ?? ""} onChange={(v) => mudar(r.uid, { texto: v })} placeholder={`Restrição (+${bonus} na Aptidão)`} />
            <button
              type="button"
              className={botaoPequeno}
              onClick={() => onMudar((t) => ({ ...t, requisitos: (t.requisitos ?? []).filter((x) => x.uid !== r.uid) }))}
              aria-label="Remover Pré-Requisito"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Os números que a Técnica entrega, já calculados pelo derive. */
function NumerosDaTecnica({ r }) {
  const linhas = [
    ...(r.numeros ?? []).map((n) => `${n.nome} ${sinal(n.valor)}`),
    ...(r.ataquesComGatilho ? [`Ataques com Gatilho ${r.ataquesComGatilho} por Rodada`] : []),
    ...(r.contra ? [`Contra-Ataques ${r.contra.quantidade}`] : []),
    ...(r.mesaCalculada ?? []).map((m) => `${m.rotulo} ${sinal(m.valor)}`),
  ];
  const aliados = (r.aliadosCalculados ?? []).map((a) => `${a.rotulo} ${sinal(a.valor)}`);
  if (!linhas.length && !aliados.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {linhas.map((l) => (
        <span key={l} className="text-[11px] px-2 py-0.5 rounded border border-emerald-900 bg-emerald-950/30 text-emerald-200">{l}</span>
      ))}
      {aliados.map((l) => (
        <span key={l} className="text-[11px] px-2 py-0.5 rounded border border-sky-900 bg-sky-950/30 text-sky-200">{l}</span>
      ))}
    </div>
  );
}

/** Uma Técnica de Estilo da Expansão. */
function TecnicaEstiloCard({ tecnica, resolvida, derived, aptidoesDaFicha, componentes, motorProps, onPatch, onRemove }) {
  const [aberta, setAberta] = useState(true);
  const { MotorEditor, TextoLongo } = componentes;
  const mod = tecnica.tipo === TIPO_MODIFICACAO;
  const r = resolvida ?? {};
  const bar = derived?.aptidao?.efetivo?.bar ?? 0;
  const usaEspecial = !mod || (tecnica.efeitos ?? []).some((e) => e.efeitoId === "especial");
  const invalida = r.mecanicamenteValida === false;
  const mudar = (fn) => onPatch(fn);

  return (
    <div className={`rounded-lg border p-3 space-y-3 ${invalida ? "border-red-900/70 bg-red-950/10" : "border-purple-900/50 bg-purple-950/10"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setAberta((a) => !a)} aria-expanded={aberta} aria-label="Abrir ou fechar a Técnica" className="text-slate-500">
          <ChevronDown className={`w-4 h-4 transition-transform ${aberta ? "" : "-rotate-90"}`} />
        </button>
        <div className="flex-1 min-w-[160px]">
          <TextInput value={tecnica.nome ?? ""} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da Técnica de Estilo" />
        </div>
        <BoolChip ativo={mod} onToggle={() => onPatch({ tipo: TIPO_MODIFICACAO })}>Modificação</BoolChip>
        <BoolChip ativo={!mod} onToggle={() => onPatch({ tipo: TIPO_ESPECIAL })}>Especial</BoolChip>
        {mod && (
          <Metrica rotulo="Efeitos" valor={`${r.usados ?? 0} / ${r.limite?.total ?? 0}`} partes={r.limite?.partes} alerta={(r.usados ?? 0) > (r.limite?.total ?? 0)} />
        )}
        {invalida && <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-red-800 text-red-300">Inválida</span>}
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
          aria-label="Remover Técnica de Estilo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {aberta && (
        <>
          <PainelValidacao itens={r.validacao} />
          <NumerosDaTecnica r={r} />

          <div>
            <FieldLabel>Descrição</FieldLabel>
            <TextoLongo value={tecnica.descricao ?? ""} onChange={(v) => onPatch({ descricao: v })} minRows={2} formatacao />
          </div>

          {mod && (
            <>
              <div>
                <FieldLabel>Gatilho</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] px-2 py-1 rounded border border-slate-700 text-slate-300">Borda do Domínio Simples</span>
                  <div className="flex-1 min-w-[180px]">
                    <TextInput
                      value={tecnica.gatilho?.texto ?? ""}
                      onChange={(v) => onPatch({ gatilho: { borda: true, ...(tecnica.gatilho ?? {}), texto: v } })}
                      placeholder="Gatilho Específico"
                    />
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel>Efeitos</FieldLabel>
                <EfeitosDaTecnica resolvida={r} pericias={derived?.testes?.pericias} onMudar={mudar} />
              </div>

              <AptidoesDaTecnica resolvida={r} aptidoesDaFicha={aptidoesDaFicha} onMudar={mudar} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Exaustão</FieldLabel>
                  <NumberInput value={tecnica.exaustao ?? 0} onChange={(v) => onPatch({ exaustao: v })} min={0} max={20} aria-label="Pontos de Exaustão" />
                </div>
                <div>
                  <DicaDeTexto titulo="Contra-Ataque" texto={TEXTO_CONTRA_ATAQUE}>
                    <span className="cursor-help"><FieldLabel>{`Contra-Ataques (BAR ${bar})`}</FieldLabel></span>
                  </DicaDeTexto>
                  <NumberInput
                    value={tecnica.contraAtaque?.quantidade ?? 0}
                    onChange={(v) => onPatch({ contraAtaque: v > 0 ? { quantidade: v } : null })}
                    min={0}
                    max={Math.max(bar, tecnica.contraAtaque?.quantidade ?? 0)}
                    aria-label="Contra-Ataques"
                  />
                  {r.contra?.degrau && (
                    <DicaDeTexto titulo={`BAR ${r.contra.bar}`} texto={r.contra.degrau.texto} nota={r.contra.bar5 ? TEXTO_BAR5_REFLEXOS : undefined}>
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded border border-slate-700 text-slate-300 cursor-help">
                        {ROTULO_DEGRAU[r.contra.degrau.resultado]}
                      </span>
                    </DicaDeTexto>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <DicaDeTexto titulo="Aplicando Condições" texto={TEXTO_CONDICOES}>
                  <span className="cursor-help"><FieldLabel>Crítico da Arma</FieldLabel></span>
                </DicaDeTexto>
                <div className="flex flex-wrap gap-1.5">
                  {CRITICO_MODS.map((c) => {
                    const ativo = c.id === "condicao" ? !!tecnica.critico?.condicao : !!tecnica.critico?.[c.id];
                    return (
                      <DicaDeTexto key={c.id} titulo={c.nome} texto={c.descricao}>
                        <BoolChip
                          ativo={ativo}
                          onToggle={() => onPatch({
                            critico: {
                              aumentarCD: false, alvoExtra: false, condicao: null, ...(tecnica.critico ?? {}),
                              [c.id]: c.id === "condicao" ? (ativo ? null : { modo: "aumentar" }) : !ativo,
                            },
                          })}
                        >
                          {c.nome}
                        </BoolChip>
                      </DicaDeTexto>
                    );
                  })}
                </div>
                {tecnica.critico?.condicao && (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <Select
                      value={tecnica.critico.condicao.modo ?? "aumentar"}
                      onChange={(v) => onPatch({ critico: { ...tecnica.critico, condicao: { ...tecnica.critico.condicao, modo: v } } })}
                      options={[{ value: "aumentar", label: "Aumentar a Condição" }, { value: "trocar", label: "Mudar a Condição" }]}
                      aria-label="Modo da Condição"
                    />
                    <Select
                      value={tecnica.critico.condicao.para ?? ""}
                      onChange={(v) => onPatch({ critico: { ...tecnica.critico, condicao: { ...tecnica.critico.condicao, para: v || null } } })}
                      options={[
                        { value: "fraca", label: "Fraca" }, { value: "media", label: "Média" },
                        { value: "forte", label: "Forte" }, { value: "extrema", label: "Extrema" },
                      ]}
                      placeholder="Força Final"
                      aria-label="Força Final da Condição"
                    />
                  </div>
                )}
              </div>

              <PreRequisitosDaTecnica tecnica={tecnica} resolvida={r} onMudar={mudar} />

              <div>
                <BoolChip ativo={!!tecnica.usaReacao} onToggle={() => onPatch({ usaReacao: !tecnica.usaReacao })}>Usa Reação</BoolChip>
              </div>
            </>
          )}

          {usaEspecial && (
            <div className="space-y-2">
              <FieldLabel>Efeito Especial</FieldLabel>
              <TextArea
                value={tecnica.especial?.texto ?? ""}
                onChange={(v) => onPatch({ especial: { linhas: [], confirmacoes: {}, ...(tecnica.especial ?? {}), texto: v } })}
                rows={2}
                placeholder="O efeito único aprovado pelo Narrador"
              />
              <MotorEditor
                efeitos={tecnica.especial?.linhas ?? []}
                onChange={(v) => onPatch({ especial: { texto: "", confirmacoes: {}, ...(tecnica.especial ?? {}), linhas: v } })}
                {...motorProps}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** O card inteiro do Estilo pela regra da Expansão. `legado` é a lista das
    Técnicas antigas, montada pelo criador (ela usa os componentes de lá). */
export default function NovoEstiloSombrasCard({
  draft, derived, estiloApi, componentes, motorProps, aptidoesDaFicha = [], legado = null, cabecalho = null,
}) {
  const info = derived.estilo ?? {};
  const prog = info.progressao ?? { total: 0, partes: [], usadas: 0 };
  const ap = derived.aptidao?.efetivo ?? {};
  const bt = derived.maestria ?? 0;
  const raio = derived.dominioSimples?.area ?? 0;
  const funcionamento = draft.estiloFuncionamento ?? { texto: "", durabilidadeTrilha: null };
  const tecnicasCruas = (Array.isArray(draft.estilosSombra) ? draft.estilosSombra : []).filter((e) => e?.regra === "expansao");
  const resolvidaDe = (id) => (info.tecnicas ?? []).find((t) => t.id === id);
  const cheia = prog.usadas >= prog.total;
  const { TextoLongo } = componentes;

  return (
    <Card title="Estilo das Sombras" headerRight={cabecalho}>
      {!info.disponivel ? (
        <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
          <Lock className="w-4 h-4 mx-auto mb-2 text-slate-600" aria-hidden="true" />
          O Novo Estilo da Sombra destrava no Nível {info.ndMinimo}.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Metrica rotulo="Técnicas" valor={`${prog.usadas} / ${prog.total}`} partes={prog.partes} alerta={prog.excedeu} />
            <Metrica rotulo="DOM" valor={ap.dom ?? 0} />
            <Metrica rotulo="AU" valor={ap.au ?? 0} />
            <Metrica rotulo="CL" valor={ap.cl ?? 0} />
            <Metrica rotulo="BAR" valor={ap.bar ?? 0} />
            <Metrica rotulo="BT" valor={bt} />
            {derived.dominioSimples?.tem && <Metrica rotulo="Raio" valor={`${numeroBr(raio)}m`} partes={derived.dominioSimples?.partesArea} />}
          </div>

          <PainelValidacao itens={info.validacao} />
          {(info.avisos ?? []).map((a) => (
            <p key={a} className="text-[11px] text-amber-400 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
              <span>{a}</span>
            </p>
          ))}

          <div className="space-y-2">
            <FieldLabel>Funcionamento Básico</FieldLabel>
            <TextoLongo
              value={funcionamento.texto ?? ""}
              onChange={(v) => estiloApi.patchFuncionamento({ texto: v })}
              minRows={2}
              formatacao
            />
            <div className="sm:max-w-xs">
              <FieldLabel>Durabilidade pela Aptidão</FieldLabel>
              <Select
                value={funcionamento.durabilidadeTrilha ?? ""}
                onChange={(v) => estiloApi.patchFuncionamento({ durabilidadeTrilha: v || null })}
                options={[
                  { value: "au", label: "Aura" }, { value: "cl", label: "Controle e Leitura" },
                  { value: "bar", label: "Barreira" }, { value: "er", label: "Energia Reversa" },
                ]}
                placeholder="Padrão do Domínio Simples"
              />
            </div>
          </div>

          <div className="space-y-3">
            {tecnicasCruas.map((t) => (
              <TecnicaEstiloCard
                key={t.id}
                tecnica={t}
                resolvida={resolvidaDe(t.id)}
                derived={derived}
                aptidoesDaFicha={aptidoesDaFicha}
                componentes={componentes}
                motorProps={motorProps}
                onPatch={(mudanca) => estiloApi.patchTecnica(t.id, mudanca)}
                onRemove={() => estiloApi.removeTecnica(t.id)}
              />
            ))}
          </div>

          {/* As Técnicas de PACOTE da Expansão (DA-06): do Addon, e não da ficha,
              então só leitura. A edição é no pacote. */}
          {(info.tecnicas ?? []).filter((t) => t.deAddon).map((t) => (
            <div key={t.id} className="rounded-lg border border-purple-900/50 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DicaDeTexto titulo={t.nome} texto={t.descricao}>
                  <span className="text-sm font-semibold cursor-help">{t.nome}</span>
                </DicaDeTexto>
                <span className="text-[11px] px-2 py-0.5 rounded border border-slate-700 text-slate-400">{t.pacote}</span>
                {t.mecanicamenteValida === false && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-red-800 text-red-300">Inválida</span>
                )}
              </div>
              <PainelValidacao itens={t.validacao} />
              <NumerosDaTecnica r={t} />
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {[[TIPO_MODIFICACAO, "Modificação do Domínio"], [TIPO_ESPECIAL, "Técnica de Estilo Especial"]].map(([tipo, rotulo]) => (
              <button
                key={tipo}
                type="button"
                onClick={() => estiloApi.addTecnica(tipo)}
                disabled={cheia}
                title={cheia ? "Técnicas de Estilo no limite" : undefined}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus className="w-3 h-3" /> {rotulo}
              </button>
            ))}
          </div>

          {legado && (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                <RefreshCw className="w-3 h-3" aria-hidden="true" /> Modelo Anterior
              </div>
              {legado}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
