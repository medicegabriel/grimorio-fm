/**
 * ============================================================
 * REVESTIMENTOS E ESCUDOS CRIADOS (Addon Criação de Equipamentos)
 * ============================================================
 * Os dois cards da aba Equipamentos que o guia Criação de Equipamentos e Itens
 * 2.5.2 abre. As contas moram em `afty-criacao-equipamentos.js`, e aqui só se
 * desenha o que elas devolvem.
 *
 * ⚠ TRÊS PORTAS, como o card dos Acessórios Únicos: o card aparece com a
 * liberação, e aparece também para quem tem item GRAVADO sem ela. Sem a segunda
 * porta, desligar o Addon deixaria o item preso na ficha, no inventário e sem
 * tela para apagá-lo. Criar um novo continua sendo só com o Addon.
 *
 * ⚠ ARQUIVO PRÓPRIO, pelo mesmo motivo da Bancada de Arma: o
 * `AftyCreatureBuilder.jsx` passou dos 500KB e o Babel já reclama do tamanho.
 *
 * A ordem das faixas é a da Bancada de Arma: resultado primeiro, editor depois,
 * e nunca um campo no meio dos números.
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>` e nunca o caractere. As fontes de cada
 * número vão no `title` do ladrilho.
 * ============================================================
 */

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, X } from "lucide-react";

import { FieldLabel, Select, TextInput } from "../../../components/builder-controls";
import {
  CUSTO_MINIMO_TROCA, CUSTOS_CRIACAO, DEFESA_DA_TROCA, BONUS_DA_TROCA, ESCOLHAS_DA_TROCA,
  TABELA_REVESTIMENTO, TIPOS_ESCOLHA_TROCA,
  escudoCriadoParaCatalogo, revestimentoCriadoParaCatalogo,
} from "../afty-criacao-equipamentos";
import { AFTY_PERICIAS } from "../afty-pericias-catalogo";
import {
  canalRdEscudo, defesaDaArmadura, espacosDoEquipamento, ITEM_CATEGORIAS, rotulosDoItemCusto, TIPOS_DANO,
  tiposDeDanoDaCategoria,
} from "../afty-equipamentos";
import {
  ATAQUES_ITEM, CATEGORIAS_MUDAR_DANO, CUSTOS_ITEM, FORMAS_ATIVO, MODOS_ITEM, TABELA_ITENS_CUSTO, TEXTO_ITENS_CUSTO,
  TEXTO_MAXIMIZAR, TIPOS_FORA_DO_MUDAR_DANO, TOPICOS_FORMA,
  efeitosOferecidos, formaDoItemCusto, itemCustoParaCatalogo, quantasPericias, saneiaItemCusto, valorDoEfeito,
} from "../afty-criacao-equipamentos-itens";
import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "../afty-schema";
import { regraDo } from "../afty-sistema";
import { BoolChip, Card } from "./primitivos";

const CABECALHO = "text-[10px] uppercase tracking-wider text-slate-500";

/* O mesmo ladrilho da Bancada de Arma: rótulo pequeno em cima, número embaixo. */
function Ladrilho({ rotulo, valor, dica }) {
  return (
    <div title={dica} className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5 min-w-0">
      <div className={`${CABECALHO} truncate`}>{rotulo}</div>
      <div className="font-mono font-bold text-sm tabular-nums text-white truncate">{valor}</div>
    </div>
  );
}

const sinal = (n) => (n > 0 ? `+${n}` : String(n));

/* Se o item vale agora: a liberação, a entrada dele no inventário e se ela está
   equipada. Os três são os portões do `resolveEquipamentos`, na mesma ordem. */
function avisoDoItem({ liberado, carregado, equipado }, { addon, aba }) {
  if (!liberado) return { label: "Sem o Addon", title: `Só vale com o Addon ${addon}` };
  if (!carregado) return { label: "Fora do Inventário", title: `Adicione pelo catálogo, em ${aba}` };
  if (!equipado) return { label: "Desequipado", title: "Só vale equipado" };
  return null;
}

const estadoDoItem = (entradas, tipo, id, liberado) => {
  const dele = (entradas ?? []).filter((e) => e.tipo === tipo && e.refId === id);
  return { liberado, carregado: dele.length > 0, equipado: dele.some((e) => e.equipado) };
};

/* O esqueleto dobrável de um item criado: cabeçalho com nome, resumo e aviso, e
   o apagar com confirmação. Apagar leva junto a entrada do inventário (ver
   `removeCriado` no criador). */
function ItemCriado({ nome, resumo, aviso, aberto, onAbrir, onRemove, rotuloApagar, fechado, children }) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40">
      <div className={`flex items-center gap-2 px-3 py-2 bg-slate-900/60 ${aberto ? "rounded-t-lg" : "rounded-lg"}`}>
        <button
          type="button"
          onClick={onAbrir}
          aria-expanded={aberto}
          className="flex items-center gap-1.5 grow text-left group min-w-0"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${aberto ? "" : "-rotate-90"}`}
            aria-hidden="true"
          />
          <span className="text-[12px] font-bold text-slate-100 truncate">{nome}</span>
          <span className={`font-mono text-[10px] text-slate-500 whitespace-nowrap ${aviso ? "hidden sm:inline" : ""}`}>{resumo}</span>
          {aviso && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium text-amber-400 whitespace-nowrap flex-shrink-0"
              title={aviso.title}
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {aviso.label}
            </span>
          )}
        </button>
        {confirmDel ? (
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-rose-300 whitespace-nowrap">Apagar?</span>
            <button
              type="button"
              onClick={onRemove}
              className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
              title="Confirmar"
              aria-label={`Confirmar exclusão de ${nome}`}
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
            title={rotuloApagar}
            className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-rose-300 hover:bg-rose-950/40 transition-colors flex-shrink-0"
          >
            Apagar
          </button>
        )}
      </div>
      {!aberto && fechado}
      {aberto && <div className="px-3 py-2.5 space-y-2.5">{children}</div>}
    </div>
  );
}

/* Os quatro Custos como chips, porque são quatro e nunca dois ao mesmo tempo. */
function EscolhaDeCusto({ custo, onChange }) {
  return (
    <div>
      <FieldLabel>Custo</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {CUSTOS_CRIACAO.map((c) => (
          <BoolChip key={c} ativo={custo === c} onToggle={() => onChange(c)}>
            C{c}
          </BoolChip>
        ))}
      </div>
    </div>
  );
}

const rotuloDaEscolha = (e, pericias) => (e.tipo === "rd"
  ? `RD ${TIPOS_DANO[e.alvo] ?? e.alvo}`
  : pericias.find((p) => p.id === e.alvo)?.nome ?? e.alvo);

/* ------------------------------------------------------------ */
/* REVESTIMENTO                                                  */
/* ------------------------------------------------------------ */

function RevestimentoEditor({ bruto, estado, sistema, pericias, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(!bruto.nome);
  const item = revestimentoCriadoParaCatalogo(bruto);
  if (!item) return null;
  const jogador = regraDo(sistema, "defesaUniforme") === "player";
  const defesa = defesaDaArmadura(item, 0, sistema);
  const linha = TABELA_REVESTIMENTO.find((l) => l.custo === item.custo);
  const aviso = avisoDoItem(estado, { addon: "Criação de Equipamentos", aba: "Uniformes" });

  /* As duas escolhas sempre como DUAS, para o seletor aberto não sumir. O que
     vai para a ficha é a lista inteira, e o saneamento joga fora o vazio só na
     hora de virar efeito. */
  const escolhas = Array.from({ length: ESCOLHAS_DA_TROCA }, (_, i) => {
    const b = Array.isArray(bruto.escolhas) ? bruto.escolhas[i] : null;
    return { tipo: TIPOS_ESCOLHA_TROCA.some((t) => t.value === b?.tipo) ? b.tipo : "pericia", alvo: b?.alvo ?? "" };
  });
  const patchEscolha = (i, partial) =>
    onPatch({ escolhas: escolhas.map((e, j) => (j === i ? { ...e, ...partial } : e)) });
  const podeTrocar = item.custo >= CUSTO_MINIMO_TROCA;

  const fontesDefesa = jogador
    ? [`Custo ${item.custo}: +${linha.defesa}`, item.troca && `Troca de Degrau: -${DEFESA_DA_TROCA}`]
    : [`Custo ${item.custo}: +${item.custo}`, item.troca && "Troca de Degrau: -1"];

  return (
    <ItemCriado
      nome={item.nome}
      resumo={`C${item.custo} · Defesa ${defesa}`}
      aviso={aviso}
      aberto={aberto}
      onAbrir={() => setAberto((o) => !o)}
      onRemove={onRemove}
      rotuloApagar="Apagar o revestimento e tirá-lo do inventário"
      fechado={item.escolhas.some((e) => e.alvo) && (
        <div className="flex flex-wrap gap-1 px-3 py-2">
          {item.escolhas.filter((e) => e.alvo).map((e) => (
            <span key={`${e.tipo}:${e.alvo}`} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-400">
              {rotuloDaEscolha(e, pericias)} +{BONUS_DA_TROCA}
            </span>
          ))}
        </div>
      )}
    >
      <div className="grid grid-cols-3 gap-1.5">
        <Ladrilho rotulo="Defesa" valor={sinal(defesa)} dica={fontesDefesa.filter(Boolean).join("\n")} />
        <Ladrilho
          rotulo="Penalidade"
          valor={item.penalidade}
          dica={item.penalidade ? `Defesa ${item.defesa} menos 2` : "Defesa 2 ou menos"}
        />
        <Ladrilho rotulo="Espaços" valor={item.espacos} dica={`Custo ${item.custo}`} />
      </div>

      <div>
        <FieldLabel>Nome</FieldLabel>
        <TextInput value={bruto.nome ?? ""} onChange={(v) => onPatch({ nome: v })} placeholder="Nome do revestimento" />
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5">
        <EscolhaDeCusto custo={item.custo} onChange={(c) => onPatch({ custo: c })} />
        <div>
          <FieldLabel>Troca</FieldLabel>
          <BoolChip
            ativo={item.troca}
            bloqueado={!podeTrocar}
            lockTitle={`A partir do Custo ${CUSTO_MINIMO_TROCA}`}
            title={`-${DEFESA_DA_TROCA} de Defesa, +${BONUS_DA_TROCA} em duas escolhas`}
            onToggle={() => onPatch({ troca: !bruto.troca, escolhas })}
          >
            Trocar Degrau
          </BoolChip>
        </div>
      </div>

      {item.troca && (
        <div className="space-y-2">
          {escolhas.map((e, i) => {
            const outra = escolhas[1 - i];
            const opcoes = (e.tipo === "rd"
              ? Object.entries(TIPOS_DANO).map(([value, label]) => ({ value, label }))
              : pericias.map((p) => ({ value: p.id, label: p.nome })))
              // "com um máximo de +2 por Perícia ou RD": a outra escolha some daqui.
              .filter((o) => !(outra.tipo === e.tipo && outra.alvo === o.value));
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-end gap-x-3 gap-y-1.5">
                <div>
                  <FieldLabel>{`Escolha ${i + 1}`}</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {TIPOS_ESCOLHA_TROCA.map((t) => (
                      <BoolChip
                        key={t.value}
                        ativo={e.tipo === t.value}
                        onToggle={() => patchEscolha(i, { tipo: t.value, alvo: "" })}
                      >
                        {t.label}
                      </BoolChip>
                    ))}
                  </div>
                </div>
                <Select
                  value={e.alvo}
                  onChange={(v) => patchEscolha(i, { alvo: v })}
                  options={opcoes}
                  placeholder={e.tipo === "rd" ? "Tipo de Dano" : "Perícia"}
                  aria-label={`Escolha ${i + 1}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </ItemCriado>
  );
}

export function RevestimentosCriadosCard({ brutos, entradas, podeCriar, sistema, pericias, onAdd, onPatch, onRemove }) {
  const lista = pericias?.length ? pericias : AFTY_PERICIAS;
  const [aberto, setAberto] = useState(false);
  const adicionar = () => {
    setAberto(true);
    onAdd();
  };
  return (
    <Card
      title="Revestimentos Criados"
      recolhido={!aberto}
      headerRight={(
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-slate-500 tabular-nums">{brutos.length}</span>
          <button
            type="button"
            onClick={() => setAberto((o) => !o)}
            aria-expanded={aberto}
            aria-label={aberto ? "Recolher Revestimentos Criados" : "Abrir Revestimentos Criados"}
            title={aberto ? "Recolher" : "Abrir"}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
          >
            <span className="hidden sm:inline">{aberto ? "Recolher" : "Abrir"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aberto ? "" : "-rotate-90"}`} aria-hidden="true" />
          </button>
          {podeCriar && (
            <button
              type="button"
              onClick={adicionar}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-700/70 text-white hover:bg-purple-700 transition-colors"
            >
              Novo Revestimento
            </button>
          )}
        </div>
      )}
    >
      {brutos.length === 0 ? (
        <p className="text-[11px] text-slate-600">Nenhum revestimento criado.</p>
      ) : (
        <div className="space-y-1.5">
          {brutos.map((r) => (
            <RevestimentoEditor
              key={r.id}
              bruto={r}
              estado={estadoDoItem(entradas, "uniforme", r.id, podeCriar)}
              sistema={sistema}
              pericias={lista}
              onPatch={(partial) => onPatch(r.id, partial)}
              onRemove={() => onRemove(r.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------ */
/* ESCUDO                                                        */
/* ------------------------------------------------------------ */

function EscudoEditor({ bruto, estado, sistema, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(!bruto.nome);
  const item = escudoCriadoParaCatalogo(bruto);
  if (!item) return null;
  const rotuloRd = canalRdEscudo(sistema) === "rdFisico" ? "RD Física" : "RD Geral";
  const aviso = avisoDoItem(estado, { addon: "Criação de Equipamentos", aba: "Escudos" });
  const dano = `${item.dano.dado} ${TIPOS_DANO[item.dano.tipo] ?? ""}`.trim();
  return (
    <ItemCriado
      nome={item.nome}
      resumo={`C${item.custo} · ${rotuloRd} ${item.rdEscudo}`}
      aviso={aviso}
      aberto={aberto}
      onAbrir={() => setAberto((o) => !o)}
      onRemove={onRemove}
      rotuloApagar="Apagar o escudo e tirá-lo do inventário"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <Ladrilho rotulo={rotuloRd} valor={sinal(item.rdEscudo)} dica={`Custo ${item.custo}: +${item.rdEscudo}`} />
        <Ladrilho rotulo="Penalidade" valor={item.penalidade} dica={`Custo ${item.custo}`} />
        <Ladrilho rotulo="Dano" valor={dano} dica={`Custo ${item.custo}`} />
        <Ladrilho rotulo="Espaços" valor={item.espacos} dica="Todo escudo" />
      </div>

      <div>
        <FieldLabel>Nome</FieldLabel>
        <TextInput value={bruto.nome ?? ""} onChange={(v) => onPatch({ nome: v })} placeholder="Nome do escudo" />
      </div>

      <EscolhaDeCusto custo={item.custo} onChange={(c) => onPatch({ custo: c })} />
    </ItemCriado>
  );
}

export function EscudosCriadosCard({ brutos, entradas, podeCriar, sistema, onAdd, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(false);
  const adicionar = () => {
    setAberto(true);
    onAdd();
  };
  return (
    <Card
      title="Escudos Criados"
      recolhido={!aberto}
      headerRight={(
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-slate-500 tabular-nums">{brutos.length}</span>
          <button
            type="button"
            onClick={() => setAberto((o) => !o)}
            aria-expanded={aberto}
            aria-label={aberto ? "Recolher Escudos Criados" : "Abrir Escudos Criados"}
            title={aberto ? "Recolher" : "Abrir"}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
          >
            <span className="hidden sm:inline">{aberto ? "Recolher" : "Abrir"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aberto ? "" : "-rotate-90"}`} aria-hidden="true" />
          </button>
          {podeCriar && (
            <button
              type="button"
              onClick={adicionar}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-700/70 text-white hover:bg-purple-700 transition-colors"
            >
              Novo Escudo
            </button>
          )}
        </div>
      )}
    >
      {brutos.length === 0 ? (
        <p className="text-[11px] text-slate-600">Nenhum escudo criado.</p>
      ) : (
        <div className="space-y-1.5">
          {brutos.map((e) => (
            <EscudoEditor
              key={e.id}
              bruto={e}
              estado={estadoDoItem(entradas, "escudo", e.id, podeCriar)}
              sistema={sistema}
              onPatch={(partial) => onPatch(e.id, partial)}
              onRemove={() => onRemove(e.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------ */
/* ITEM DE CUSTO (fase 3)                                        */
/* ------------------------------------------------------------ */

const fmtM = (m) => `${String(m).replace(".", ",")}m`;
const TRS = AFTY_RESISTENCIAS.filter((r) => r.escala !== "fixa").map((r) => ({ value: r.value, label: r.label }));
const ATRIBUTOS = AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label }));
const LINHA_ITEM = Object.fromEntries(TABELA_ITENS_CUSTO.map((l) => [l.id, l]));
const ehOficio = (id) => id === "oficio" || /^oficio__\d+$/.test(id);
const ROTULO_ALVO = { ataque: "Tipo de Ataque", pericia: "Perícia", oficio: "Ofício", tr: "Teste de Resistência", atributo: "Atributo" };

/* Os tipos de dano que "Mudar Tipo de Dano" alcança naquele Custo. */
const tiposDoMudarDano = (custo) => (CATEGORIAS_MUDAR_DANO[custo] ?? [])
  .flatMap((cat) => tiposDeDanoDaCategoria(cat))
  .filter((t) => !TIPOS_FORA_DO_MUDAR_DANO.includes(t.id))
  .map((t) => ({ value: t.id, label: t.label }));

function ItemCustoEditor({ bruto, estado, pericias, onPatch, onRemove }) {
  const [aberto, setAberto] = useState(!bruto.nome);
  const item = saneiaItemCusto(bruto);
  if (!item) return null;
  // Com os nomes do catálogo, senão o resumo fechado mostraria o id cru ("corpo").
  const def = itemCustoParaCatalogo(bruto, rotulosDoItemCusto());
  const linha = LINHA_ITEM[item.efeito];
  const valor = valorDoEfeito(item.efeito, item.custo);
  const forma = formaDoItemCusto(item);
  // O Ativo não pede equipar: ele é de uso, e a mesa aplica.
  const aviso = avisoDoItem(
    item.modo === "ativo" ? { ...estado, equipado: true } : estado,
    { addon: "Criação de Equipamentos", aba: "Itens Especiais" },
  );
  const opcoesPericia = pericias.filter((p) => !ehOficio(p.id)).map((p) => ({ value: p.id, label: p.nome }));
  const opcoesOficio = pericias.filter((p) => ehOficio(p.id)).map((p) => ({ value: p.id, label: p.nome }));
  const opcoesAlvo = { ataque: ATAQUES_ITEM, pericia: opcoesPericia, oficio: opcoesOficio, tr: TRS, atributo: ATRIBUTOS };
  const n = quantasPericias(item.efeito, item.custo);
  const valorTexto = valor == null ? null
    : linha?.alvo === "pericias" ? `${valor} ${valor === 1 ? "Perícia" : "Perícias"}`
      : linha?.metros ? fmtM(valor) : linha?.sinal ? `+${valor}` : String(valor);
  const rotuloEfeito = linha ? linha.label.replace(" (Especificar)", "").replace(" (Perícia)", "")
    : item.efeito === "maximizarAtributo" ? "Maximizar"
      : item.efeito === "mudarTipoDano" ? "Tipo de Dano" : "Efeito";
  const valorEfeito = valorTexto
    ?? (item.efeito === "maximizarAtributo" ? "10 Rodadas"
      : item.efeito === "mudarTipoDano" ? (TIPOS_DANO[item.tipoDano] ?? "-") : "-");
  const dicaEfeito = item.efeito === "maximizarAtributo" ? TEXTO_MAXIMIZAR
    : item.efeito === "mudarTipoDano" ? TEXTO_ITENS_CUSTO.narrativo : TEXTO_ITENS_CUSTO.abertura;
  const topicos = TOPICOS_FORMA[item.custo];

  return (
    <ItemCriado
      nome={def.nome}
      resumo={`C${item.custo} · ${item.modo === "ativo" ? "Ativo" : "Passivo"}`}
      aviso={aviso}
      aberto={aberto}
      onAbrir={() => setAberto((o) => !o)}
      onRemove={onRemove}
      rotuloApagar="Apagar o item e tirá-lo do inventário"
      fechado={def.descricao && (
        <div className="px-3 py-2 text-[11px] text-slate-400">{def.descricao}</div>
      )}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <Ladrilho rotulo={rotuloEfeito} valor={valorEfeito} dica={dicaEfeito} />
        {forma?.forma === "arremessavel" && <Ladrilho rotulo="Alcance" valor={fmtM(forma.alcance)} dica={topicos.arremessavel} />}
        {forma?.forma === "area" && <Ladrilho rotulo="Área" valor={fmtM(forma.area)} dica={topicos.area} />}
        {forma?.forma === "totem" && (
          <>
            <Ladrilho rotulo="PV" valor={forma.pv} dica={topicos.totem} />
            <Ladrilho rotulo="Defesa" valor={forma.defesa} dica={topicos.totem} />
            <Ladrilho rotulo="Área" valor={fmtM(forma.area)} dica={topicos.totem} />
          </>
        )}
        <Ladrilho
          rotulo="Espaços"
          valor={String(espacosDoEquipamento("item", def)).replace(".", ",")}
          dica={ITEM_CATEGORIAS.find((c) => c.value === item.categoria)?.label}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel>Nome</FieldLabel>
          <TextInput value={bruto.nome ?? ""} onChange={(v) => onPatch({ nome: v })} placeholder="Nome do item" />
        </div>
        <div>
          <FieldLabel>Categoria</FieldLabel>
          <Select
            value={item.categoria}
            onChange={(v) => onPatch({ categoria: v })}
            options={ITEM_CATEGORIAS.map((c) => ({ value: c.value, label: c.label }))}
            aria-label="Categoria do item"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5">
        <div>
          <FieldLabel>Custo</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {CUSTOS_ITEM.map((c) => (
              <BoolChip key={c} ativo={item.custo === c} onToggle={() => onPatch({ custo: c })}>C{c}</BoolChip>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Modo</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {MODOS_ITEM.map((m) => (
              <BoolChip key={m.value} ativo={item.modo === m.value} onToggle={() => onPatch({ modo: m.value })}>{m.label}</BoolChip>
            ))}
          </div>
        </div>
        {item.modo === "ativo" && (
          <div>
            <FieldLabel>Forma</FieldLabel>
            <div className="flex flex-wrap gap-1.5" title={TEXTO_ITENS_CUSTO.forma}>
              {FORMAS_ATIVO.map((f) => (
                <BoolChip key={f.value} ativo={item.forma === f.value} onToggle={() => onPatch({ forma: f.value })} title={topicos[f.value]}>
                  {f.label}
                </BoolChip>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel>Efeito</FieldLabel>
          <Select
            value={item.efeito}
            onChange={(v) => onPatch({ efeito: v, alvo: "", alvos: [], tipoDano: "" })}
            options={efeitosOferecidos(item.custo, item.modo)}
            placeholder="Efeito"
            aria-label="Efeito do item"
          />
        </div>
        {linha?.alvo && linha.alvo !== "pericias" && (
          <div>
            <FieldLabel>{ROTULO_ALVO[linha.alvo]}</FieldLabel>
            <Select
              value={item.alvo}
              onChange={(v) => onPatch({ alvo: v })}
              options={opcoesAlvo[linha.alvo] ?? []}
              placeholder="Escolher"
              aria-label="Alvo do efeito"
            />
          </div>
        )}
        {item.efeito === "mudarTipoDano" && (
          <div>
            <FieldLabel>Tipo de Dano</FieldLabel>
            <Select
              value={item.tipoDano}
              onChange={(v) => onPatch({ tipoDano: v })}
              options={tiposDoMudarDano(item.custo)}
              placeholder="Escolher"
              aria-label="Tipo de dano do item"
            />
          </div>
        )}
      </div>

      {n > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: n }, (_, i) => (
            <Select
              key={i}
              value={item.alvos[i]}
              onChange={(v) => onPatch({ alvos: item.alvos.map((a, j) => (j === i ? v : a)) })}
              options={opcoesPericia.filter((o) => !item.alvos.some((a, j) => j !== i && a === o.value))}
              placeholder="Perícia"
              aria-label={`Perícia ${i + 1} do item`}
            />
          ))}
        </div>
      )}
    </ItemCriado>
  );
}

export function ItensCustoCriadosCard({ brutos, entradas, podeCriar, pericias, onAdd, onPatch, onRemove }) {
  const lista = pericias?.length ? pericias : AFTY_PERICIAS;
  const [aberto, setAberto] = useState(false);
  const adicionar = () => {
    setAberto(true);
    onAdd();
  };
  return (
    <Card
      title="Itens de Custo Criados"
      recolhido={!aberto}
      headerRight={(
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-slate-500 tabular-nums">{brutos.length}</span>
          <button
            type="button"
            onClick={() => setAberto((o) => !o)}
            aria-expanded={aberto}
            aria-label={aberto ? "Recolher Itens de Custo Criados" : "Abrir Itens de Custo Criados"}
            title={aberto ? "Recolher" : "Abrir"}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
          >
            <span className="hidden sm:inline">{aberto ? "Recolher" : "Abrir"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aberto ? "" : "-rotate-90"}`} aria-hidden="true" />
          </button>
          {podeCriar && (
            <button
              type="button"
              onClick={adicionar}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-700/70 text-white hover:bg-purple-700 transition-colors"
            >
              Novo Item
            </button>
          )}
        </div>
      )}
    >
      {brutos.length === 0 ? (
        <p className="text-[11px] text-slate-600">Nenhum item criado.</p>
      ) : (
        <div className="space-y-1.5">
          {brutos.map((it) => (
            <ItemCustoEditor
              key={it.id}
              bruto={it}
              estado={estadoDoItem(entradas, "item", it.id, podeCriar)}
              pericias={lista}
              onPatch={(partial) => onPatch(it.id, partial)}
              onRemove={() => onRemove(it.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
