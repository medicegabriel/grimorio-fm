/**
 * ============================================================
 * EXPANSÃO DE DOMÍNIO NO CRIADOR (autor, 2026-10-08)
 * ============================================================
 * O construtor da Expansão mora em Feitiços → Especial → Tipo de Especial →
 * Expansão de Domínio (DA-18). É decisão de TELA: a Expansão continua em
 * `creature.dominios`, e nada vai para `feiticos[]`. A aba Habilidades fica só
 * com o resumo (`ResumoDominios`) e o atalho Editar em Feitiços, para não
 * existirem dois editores da mesma coisa.
 *
 * ⚠ Fora do `AftyCreatureBuilder.jsx`, que já passa de 20 mil linhas. Importa
 * `afty-dominios.js` (zero imports), `afty-rituais.js` (zero imports), os
 * controles da 2.5.2 e `ui/`. O que vive em catálogo pesado (os tipos de dano, as
 * Condições) chega por prop, para este arquivo não abrir seta nova no grafo.
 * ============================================================
 */
import React, { useState } from "react";
import { AlertTriangle, ChevronDown, Minus, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select } from "../../components/builder-controls";
import { Card, BoolChip } from "./ui/primitivos";
import { PainelDeFontes, DicaDeTexto } from "./ui/fontes";
import { RITUAL_MELHORIAS } from "./afty-rituais";
import {
  DOMINIO_CATEGORIAS, DOMINIO_RITUAL_CATEGORIAS, ATRIBUTOS_FISICOS, CUSTO_CONDICAO_AMBIENTAL,
  categoriaLivre, tiposDaCategoria, rotuloDoEfeito, novoEfeitoDominio, fortalecimentosDe, MAX_FORTALECIMENTOS,
  resolucaoDoEfeito, valorDoEfeito, rotuloVersao, REGRA_DOMINIO_OFICIAL,
  DOMINIO_EXECUCAO, DOMINIO_REQUISITOS_EXECUCAO,
  AG_TIPOS, AG_LETALIDADES, AG_CONDICAO_PROIBIDA, FRASE_ABERTURA_02, patchTipoAcerto,
} from "./afty-dominios";

const ROTULO_FORCA = { fraca: "Fraca", media: "Média", forte: "Forte" };

function Chip({ on, bloqueado, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={() => !bloqueado && onClick()}
      disabled={bloqueado}
      aria-pressed={on}
      title={title}
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
        on
          ? "bg-purple-700 border-purple-600 text-white"
          : bloqueado
            ? "border-slate-800 text-slate-600 cursor-not-allowed"
            : "border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function Validacao({ itens }) {
  if (!itens?.length) return null;
  return (
    <div className="space-y-1">
      {itens.map((v) => (
        <div
          key={`${v.codigo}:${v.texto}`}
          className={`flex items-center gap-1.5 text-[11px] ${v.nivel === "erro" ? "text-rose-300" : "text-amber-400/90"}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> {v.texto}
        </div>
      ))}
    </div>
  );
}

/** Um efeito escolhido: categoria, tipo, as escolhas da tabela e o Fortalecer. */
function EfeitoDominioLinha({ efeito, dom, versao, vagasLivres, tiposDano, condicoesCatalogo, renderMotor, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(false);
  const livre = categoriaLivre(efeito.categoria);
  const tipos = tiposDaCategoria(efeito.categoria);
  const r = resolucaoDoEfeito(efeito, dom, versao);
  const valor = valorDoEfeito(efeito, dom, versao);
  const n = fortalecimentosDe(efeito);
  const ehAtributo = efeito.categoria === "amp_corporal" && efeito.tipo === "atributo";
  const resumo = efeito.nome?.trim() || rotuloDoEfeito(efeito);
  const rdTipos = Array.isArray(efeito.rdTipos) ? efeito.rdTipos : [];
  const condicoes = Array.isArray(efeito.condicoes) ? efeito.condicoes : [];
  const gastoCondicoes = condicoes.reduce((s, c) => s + (CUSTO_CONDICAO_AMBIENTAL[c.forca] ?? 0), 0);
  const trocaAtributo = (i, v) => {
    const atuais = [...(efeito.atributos ?? [])];
    atuais[i] = v;
    onPatch({ atributos: atuais });
  };
  const alternaTipo = (id) => onPatch({
    rdTipos: rdTipos.includes(id) ? rdTipos.filter((x) => x !== id) : [...rdTipos, id],
  });
  const alternaCondicao = (nome, forca) => {
    const tem = condicoes.some((c) => c.nome === nome);
    onPatch({ condicoes: tem ? condicoes.filter((c) => c.nome !== nome) : [...condicoes, { nome, forca }] });
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
          <span className="text-xs font-semibold truncate shrink-0 max-w-full">{resumo}</span>
          {n > 0 && <span className="text-[9px] text-purple-300 font-bold flex-shrink-0">+{n} Fortalecido</span>}
          {!aberto && valor && <span className="hidden sm:block min-w-0 text-[10px] text-slate-500 font-mono truncate">· {valor}</span>}
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
            <FieldLabel>Fortalecimentos</FieldLabel>
            <button
              type="button"
              className="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-700 text-slate-300 disabled:text-slate-700 disabled:border-slate-800"
              disabled={n <= 0}
              onClick={() => onPatch({ fortalecimentos: n - 1, fortalecido: false })}
              aria-label="Um fortalecimento a menos"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-xs tabular-nums text-white w-4 text-center">{n}</span>
            <button
              type="button"
              className="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-700 text-slate-300 disabled:text-slate-700 disabled:border-slate-800"
              disabled={vagasLivres <= 0 || n >= MAX_FORTALECIMENTOS}
              onClick={() => onPatch({ fortalecimentos: n + 1, fortalecido: false })}
              aria-label="Um fortalecimento a mais"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {ehAtributo && (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((i) => (
                <Select
                  key={i}
                  value={efeito.atributos?.[i] ?? ""}
                  onChange={(v) => trocaAtributo(i, v)}
                  options={[{ value: "", label: "Escolher" }, ...ATRIBUTOS_FISICOS]}
                />
              ))}
            </div>
          )}

          {r?.motorRdTipo != null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FieldLabel>Tipos de Dano</FieldLabel>
                <span className="font-mono text-[11px] text-slate-400">{rdTipos.length} / {r.tiposMax}</span>
                {efeito.rdTiposTexto && (
                  <DicaDeTexto titulo="Texto Anterior" texto={efeito.rdTiposTexto}>
                    <span className="text-[10px] text-slate-500 underline decoration-dotted">Texto Anterior</span>
                  </DicaDeTexto>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {tiposDano.map((tipo) => {
                  const on = rdTipos.includes(tipo.id);
                  return (
                    <Chip key={tipo.id} on={on} bloqueado={!on && rdTipos.length >= r.tiposMax} onClick={() => alternaTipo(tipo.id)}>
                      {tipo.label}
                    </Chip>
                  );
                })}
              </div>
            </div>
          )}

          {r?.dadosCondicao != null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FieldLabel>Condições</FieldLabel>
                <span className="font-mono text-[11px] text-slate-400">{gastoCondicoes} / {r.dadosCondicao} Dados</span>
              </div>
              {r.forcasCondicao.map((forca) => (
                <div key={forca} className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 w-16">
                    {ROTULO_FORCA[forca]} {CUSTO_CONDICAO_AMBIENTAL[forca]}
                  </span>
                  {(condicoesCatalogo[forca] ?? []).map((nome) => {
                    const on = condicoes.some((c) => c.nome === nome);
                    const cabe = gastoCondicoes + CUSTO_CONDICAO_AMBIENTAL[forca] <= r.dadosCondicao;
                    return (
                      <Chip key={nome} on={on} bloqueado={!on && !cabe} onClick={() => alternaCondicao(nome, forca)}>
                        {nome}
                      </Chip>
                    );
                  })}
                </div>
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
          {/* DA-20: o Efeito Especial pode escrever no Motor, com o editor de linhas
              do criador (que chega por render-prop, para este arquivo não importar
              o catálogo de canais). */}
          {livre && renderMotor?.(efeito.motor ?? [], (motor) => onPatch({ motor }))}
        </div>
      )}
    </div>
  );
}

/**
 * O ACERTO GARANTIDO ESTRUTURADO (Etapa 8, 2026-10-08): tipo, o que ele alcança,
 * letalidade e descrição. Os números e as regras vêm do derive
 * (`acertoGarantidoResumo` e `validacao`), a tela só escolhe.
 *
 * O formato anterior (`tipo` nulo) aparece como Outro e continua no modo
 * anterior até a pessoa escolher um tipo.
 */
function AcertoGarantidoEditor({ d, feiticos, condicoesCatalogo, onPatch, onTipo }) {
  const ag = d.acertoGarantido ?? {};
  const tipo = ag.tipo ?? "outro";
  const refs = Array.isArray(ag.referencias) ? ag.referencias : [];
  const alterna = (valor) => onPatch({ referencias: refs.includes(valor) ? refs.filter((x) => x !== valor) : [...refs, valor] });
  // Toda força do catálogo, com a Extrema, menos o Desmembramento (Livro).
  const condicoes = Object.values(condicoesCatalogo).flat().filter((n) => n !== AG_CONDICAO_PROIBIDA);
  const comEscopo = tipo === "feiticos" || tipo === "ataque_armado" || tipo === "ataque_desarmado";
  const livre = tipo === "informacao" || tipo === "voto" || tipo === "outro";
  return (
    <div className="space-y-2 pt-2 border-t border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        {d.versao === "sem_barreiras" ? (
          <span className="inline-flex items-center rounded-lg border border-purple-700 bg-purple-900/40 px-2.5 py-1 text-[12px] font-semibold text-purple-200">
            Acerto Garantido
          </span>
        ) : (
          <BoolChip ativo={!!ag.ativo} onToggle={() => onPatch({ ativo: !ag.ativo })}>
            Acerto Garantido
          </BoolChip>
        )}
        {d.acertoGarantidoValido && (
          <>
            <div className="min-w-[160px]">
              <Select
                value={ag.tipo ?? ""}
                onChange={(v) => v && onTipo(v)}
                options={[
                  ...(ag.tipo == null ? [{ value: "", label: "Modelo Anterior" }] : []),
                  ...AG_TIPOS.map((t) => ({ value: t.value, label: t.label })),
                ]}
              />
            </div>
            {AG_LETALIDADES.map((l) => (
              <Chip key={l.value} on={(ag.letalidade ?? "letal") === l.value} onClick={() => onPatch({ letalidade: l.value })}>
                {l.label}
              </Chip>
            ))}
            {d.acertoGarantidoResumo?.abertura && (
              <DicaDeTexto titulo="Abertura de 0,2 Segundos" texto={FRASE_ABERTURA_02}>
                <span className="text-[11px] text-purple-300 underline decoration-dotted">Abertura de 0,2 Segundos</span>
              </DicaDeTexto>
            )}
          </>
        )}
      </div>

      {d.acertoGarantidoValido && (
        <div className="space-y-2">
          {comEscopo && (
            <TextInput
              value={ag.escopo ?? ""}
              onChange={(v) => onPatch({ escopo: v })}
              placeholder={tipo === "feiticos" ? "Grupo de Feitiços" : "Quais ataques"}
            />
          )}
          {tipo === "feiticos" && feiticos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {feiticos.map((f) => (
                <Chip key={f.id} on={refs.includes(f.id)} onClick={() => alterna(f.id)}>{f.nome}</Chip>
              ))}
            </div>
          )}
          {tipo === "condicao" && (
            <div className="flex flex-wrap gap-1">
              {condicoes.map((nome) => (
                <Chip key={nome} on={refs.includes(nome)} onClick={() => alterna(nome)}>{nome}</Chip>
              ))}
            </div>
          )}
          <TextArea
            value={ag.descricao ?? ""}
            onChange={(v) => onPatch({ descricao: v })}
            rows={2}
            placeholder={livre ? "O que se torna garantido" : "Detalhes"}
          />
        </div>
      )}
    </div>
  );
}

/**
 * O EDITOR DE UMA EXPANSÃO. `linha` é a linha pronta do derive
 * (`derived.dominios.lista`): os dados da ficha mais os números (custo, área,
 * domo, validação). A tela não recalcula regra nenhuma.
 */
export function DominioEditor({
  linha: d, info, versoes, tiposDano = [], condicoesCatalogo = {}, feiticos = [], renderMotor = null,
  onPatch, onRemove, onAtivo, onNova,
}) {
  const vagasLivres = info.maxEfeitos - d.vagasUsadas;
  const patchEfeito = (efId, partial) =>
    onPatch({ efeitos: d.efeitos.map((e) => (e.id === efId ? { ...e, ...partial } : e)) });
  const legadoSemBarreiras = d.legacy && d.versao === "sem_barreiras";
  const celulas = [
    { k: "Área", v: d.area },
    { k: "Duração", v: `${d.duracao} ${d.duracao === 1 ? "Rodada" : "Rodadas"}` },
    d.temDomo
      ? { k: d.versao === "sem_barreiras" ? "Totem" : "Domo", v: `${d.pvBarreira} PV`, partes: info.barreira?.partesPvDomo }
      : { k: "Alcance do Acerto", v: "Superior" },
    { k: "Custo", v: `${d.custo} PE`, partes: d.partesCusto },
  ];
  return (
    <div className="rounded-lg border border-purple-900/50 bg-purple-950/10 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[160px]">
          <TextInput value={d.nome} onChange={(v) => onPatch({ nome: v })} placeholder="Nome da expansão" />
        </div>
        <div className="min-w-[150px]">
          {/* Trocar a versão marca a Expansão como oficial (DA-11). */}
          <Select value={d.versao} onChange={(v) => onPatch({ versao: v, regra: REGRA_DOMINIO_OFICIAL })} options={versoes} />
        </div>
        <BoolChip ativo={info.ativoId === d.id} onToggle={() => onAtivo(info.ativoId === d.id ? null : d.id)}>
          {info.ativoId === d.id ? "Ativa" : "Inativa"}
        </BoolChip>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
          aria-label="Remover expansão"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {legadoSemBarreiras && (
        <div className="flex flex-wrap items-center gap-2">
          <DicaDeTexto
            titulo="Modelo Anterior"
            texto="Sem Barreiras gravada antes da regra oficial, com o Totem e a área de 9 metros vezes o Bônus de Treinamento. A oficial não tem domo nem número de área."
          >
            <span className="inline-flex items-center rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400">Modelo Anterior</span>
          </DicaDeTexto>
          <button
            type="button"
            onClick={() => onPatch({ regra: REGRA_DOMINIO_OFICIAL })}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:border-slate-500"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" /> Converter para Oficial
          </button>
        </div>
      )}

      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
        {celulas.map((l) => (
          <div key={l.k} className="relative group rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{l.k}</div>
            <div className={`font-mono text-lg font-bold tabular-nums text-white ${l.partes?.length ? "cursor-help" : ""}`}>{l.v}</div>
            {l.partes?.length > 0 && <PainelDeFontes partes={l.partes} total={l.v} />}
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-400">
        <span className="text-slate-300 font-semibold">{DOMINIO_EXECUCAO}</span>
        <span className="text-slate-600"> · </span>
        {DOMINIO_REQUISITOS_EXECUCAO}
      </div>

      <Validacao itens={d.validacao} />

      <div>
        <FieldLabel>Aparência</FieldLabel>
        <TextArea value={d.aparencia} onChange={(v) => onPatch({ aparencia: v })} rows={2} placeholder="Como a expansão se manifesta" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {DOMINIO_RITUAL_CATEGORIAS.map((categoria) => (
          <div key={categoria.key}>
            <FieldLabel>{`Ritual: ${categoria.label}`}</FieldLabel>
            <Select
              value={d.beneficiosRitual?.[categoria.key] ?? ""}
              onChange={(valor) => onPatch({ beneficiosRitual: { ...d.beneficiosRitual, [categoria.key]: valor } })}
              options={[{ value: "", label: "Escolher" }, ...RITUAL_MELHORIAS.map((m) => ({ value: m.id, label: m.nome }))]}
            />
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Efeitos de Expansão{" "}
            <span className={`font-mono ${d.vagasUsadas > info.maxEfeitos ? "text-rose-300" : "text-slate-300"}`}>{d.vagasUsadas}/{info.maxEfeitos}</span>
          </span>
          <button
            type="button"
            disabled={vagasLivres <= 0}
            onClick={() => onPatch({ efeitos: [...d.efeitos, novoEfeitoDominio()] })}
            title={vagasLivres <= 0 ? "Sem Vaga de Efeito" : undefined}
            className={`flex items-center gap-1 text-[11px] ${vagasLivres <= 0 ? "text-slate-600 cursor-not-allowed" : "text-purple-300 hover:text-purple-200"}`}
          >
            <Plus className="w-3 h-3" /> Adicionar Efeito
          </button>
        </div>
        {d.efeitos.length === 0 && <p className="text-xs text-slate-600 italic">Nenhum efeito de expansão adicionado.</p>}
        {d.efeitos.map((ef) => (
          <EfeitoDominioLinha
            key={ef.id}
            efeito={ef}
            dom={info.domNivel}
            versao={d.versao}
            vagasLivres={vagasLivres}
            tiposDano={tiposDano}
            condicoesCatalogo={condicoesCatalogo}
            renderMotor={renderMotor}
            onPatch={(partial) => patchEfeito(ef.id, partial)}
            onRemove={() => onPatch({ efeitos: d.efeitos.filter((e) => e.id !== ef.id) })}
          />
        ))}
      </div>

      {/* O Acerto Garantido (DA-14): só com a Aptidão, nunca na Incompleta, e
          inerente na Sem Barreiras. Estruturado desde a Etapa 8. */}
      {info.temAcertoGarantido && d.versao !== "incompleta" && (
        <AcertoGarantidoEditor
          d={d}
          feiticos={feiticos}
          condicoesCatalogo={condicoesCatalogo}
          onPatch={(partial) => onPatch({ acertoGarantido: { ...d.acertoGarantido, ...partial } })}
          onTipo={(tipo) => onPatch({ acertoGarantido: patchTipoAcerto(d.acertoGarantido, tipo) })}
        />
      )}

      {onNova && (
        <button type="button" onClick={onNova} className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200">
          <Plus className="w-3 h-3" /> Nova Expansão
        </button>
      )}
    </div>
  );
}

/**
 * O RESUMO das Expansões na aba Habilidades (DA-18): números e o atalho para o
 * editor, que mora em Feitiços → Especial. Nenhum campo editável aqui.
 */
export function ResumoDominios({ info, onEditar }) {
  return (
    <Card
      title="Expansão de Domínio"
      headerRight={
        <span className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-400">
          <span>DOM {info.domNivel} · {info.maxEfeitos} {info.maxEfeitos === 1 ? "efeito" : "efeitos"}</span>
          <span className="relative group cursor-help text-slate-300">
            Conflito 1d{info.conflito.faces}+{info.conflito.bonus}
            <PainelDeFontes partes={info.conflito.partes} total={info.conflito.bonus} />
          </span>
        </span>
      }
    >
      <div className="space-y-2">
        {info.lista.length === 0 && <p className="text-xs text-slate-600 italic">Nenhuma expansão criada.</p>}
        {info.lista.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-[12px]">
            <span className="font-semibold text-white">{d.nome || "Domínio Sem Nome"}</span>
            <span className="text-slate-500">{rotuloVersao(d.versao)}</span>
            {!d.valida && (
              <span className="inline-flex items-center gap-1 text-rose-300">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Inválida
              </span>
            )}
            <span className="flex-1" />
            <span className="font-mono tabular-nums text-slate-300">{d.custo} PE</span>
            <span className="font-mono tabular-nums text-slate-400">{d.area}</span>
            <button
              type="button"
              onClick={() => onEditar(d.id)}
              className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white hover:border-slate-500"
            >
              <Pencil className="w-3 h-3" aria-hidden="true" /> Editar em Feitiços
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
