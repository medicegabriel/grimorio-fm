/**
 * ============================================================
 * ABA DE FEITIÇOS DE ECLESIASTES (2026-11-23)
 * ============================================================
 * O editor do Feitiço por pontos, que o `FeiticosCard` do criador monta no
 * lugar do editor por Nível quando a ficha é de Eclesiastes. A lista lateral, as
 * Expansões de Domínio e as Técnicas Marciais continuam sendo do card.
 *
 * O FEITIÇO É UM EXTRATO. O que gera pontos mora em Base (com o +N em verde), o
 * que gasta mora em Alcance, Efeitos e Liberação, cada linha tem o custo numa
 * coluna à direita, e o saldo fica grudado no topo. A conta de cada número mora
 * no hover do `PainelDeFontes`, nunca num texto na tela (normas D-53 e D-54).
 *
 * ⚠ A TELA NÃO CALCULA. Todo número vem do `calc` do derive
 * (`derived.feiticos.ecl`), e o editor só escreve quantidades na ficha.
 *
 * ⚠ IMPORTA SÓ O MOTOR NOVO E `ui/`. Nada do ciclo do equipamentos: o que vem de
 * lá (tipos e grupos de dano) chega por `ctx`. Ver `asserts/t-ordem-modulos.mjs`.
 * ============================================================
 */
import React, { useState } from "react";
import { AlertTriangle, Check, Copy, Minus, Plus, Trash2, X } from "lucide-react";
import { PainelDeFontes, DicaDeTexto } from "../../afty/ui/fontes";
import {
  ACOES_ECL, REQUISITOS_ECL, ALCANCES_ECL, FORMATOS_AREA_ECL, DURACOES_ECL, ALVOS_AUX_ECL,
  AUX_EFEITOS_ECL, AUX_POR_ID_ECL, CONDICOES_ECL, TIPOS_FEITICO_ECL, TECNICA_MAXIMA_ECL,
  LIBERACAO_BT_MIN, MORTE_DIRETA_ND_MIN, PASSIVOS_ECL, USOS_SEMIATIVO, RECARGAS_SEMIATIVO,
  METROS_POR_PONTO_ALCANCE, LARGURA_FAIXA,
} from "./tabelas";
import {
  normalizarFeiticoEcl, criarAuxiliarEcl, criarCondicaoEcl, criarRequisitoEcl, novoIdEcl,
  aplicarLiberacaoEcl, diferencaLiberacaoEcl,
} from "./modelo";
import "./ecl-feiticos.css";

const metros = (m) => `${String(Math.round(m * 10) / 10).replace(".", ",")} m`;
const comSinal = (v) => (v > 0 ? `+${v}` : String(v));

/* ============================================================
   Peças
   ============================================================ */

function Opcoes({ valor, opcoes, onChange, rotulo, travado = false }) {
  return (
    <span className="ecl-opcoes" role="group" aria-label={rotulo}>
      {opcoes.map((o) => {
        const botao = (
          <button
            key={o.value}
            type="button"
            className="ecl-opcao"
            aria-pressed={valor === o.value}
            disabled={travado || !!o.indisponivel}
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.delta != null && o.delta !== 0 && <span className="ecl-opcao-delta">{comSinal(o.delta)}</span>}
          </button>
        );
        return o.indisponivel ? <DicaDeTexto key={o.value} texto={o.indisponivel}>{botao}</DicaDeTexto> : botao;
      })}
    </span>
  );
}

function Interruptor({ ligado, onChange, children, indisponivel = null }) {
  const botao = (
    <button type="button" className="ecl-interruptor" aria-pressed={!!ligado} disabled={!!indisponivel} onClick={() => onChange(!ligado)}>
      <span className="ecl-interruptor-caixa" aria-hidden="true">{ligado && <Check className="w-3 h-3" />}</span>
      {children}
    </button>
  );
  return indisponivel ? <DicaDeTexto texto={indisponivel}>{botao}</DicaDeTexto> : botao;
}

function Passo({ valor, onChange, min = 0, max = 99, passo = 1, sufixo = null, rotulo }) {
  const ajusta = (v) => onChange(Math.min(max, Math.max(min, Math.trunc(Number(v) || 0))));
  return (
    <span className="ecl-passo">
      <button type="button" aria-label={`Diminuir ${rotulo}`} title={`Diminuir ${rotulo}`} disabled={valor <= min} onClick={() => ajusta(valor - passo)}>
        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={rotulo}
        value={valor}
        min={min}
        max={max}
        onChange={(e) => ajusta(e.target.value)}
      />
      <button type="button" aria-label={`Aumentar ${rotulo}`} title={`Aumentar ${rotulo}`} disabled={valor >= max} onClick={() => ajusta(valor + passo)}>
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {sufixo && <span className="ecl-passo-sufixo">{sufixo}</span>}
    </span>
  );
}

/** Número com o painel de fontes no hover (e no toque longo, pelo `group`). */
function ComFontes({ partes, total, children, ancora = "esquerda" }) {
  return (
    <span className="relative group inline-flex" tabIndex={partes?.length ? 0 : undefined}>
      {children}
      {partes?.length > 0 && <PainelDeFontes partes={partes} total={total} ancora={ancora} aparecer="group-hover:block group-focus:block" />}
    </span>
  );
}

function Custo({ valor, ganho = false, partes = null, aviso = false }) {
  const tom = aviso ? "aviso" : !valor ? "zero" : ganho ? "ganho" : undefined;
  const texto = !valor ? "0" : ganho ? comSinal(valor) : String(valor);
  return (
    <span className="ecl-custo" data-tom={tom}>
      {partes?.length ? <ComFontes partes={partes} total={texto} ancora="direita">{texto}</ComFontes> : texto}
    </span>
  );
}

function Linha({ rotulo, sub = null, custo = null, children }) {
  return (
    <div className="ecl-linha">
      <span className="ecl-linha-rotulo">{rotulo}{sub && <small>{sub}</small>}</span>
      <span className="ecl-linha-controles">{children}</span>
      {custo ?? <span />}
    </div>
  );
}

function Bloco({ titulo, pontos = null, acao = null, children }) {
  return (
    <section className="ecl-bloco">
      <div className="ecl-bloco-topo">
        <span className="ecl-bloco-titulo">{titulo}</span>
        <span className="inline-flex items-center gap-3">
          {acao}
          {pontos != null && <span className="ecl-subaba-pontos">{pontos}</span>}
        </span>
      </div>
      <div className="ecl-bloco-corpo">{children}</div>
    </section>
  );
}

function Medidor({ total, gasto, partesTotal, partesGasto, rotulo = "Pontos" }) {
  const falta = gasto > total;
  const pct = total > 0 ? Math.min(100, (gasto / total) * 100) : gasto > 0 ? 100 : 0;
  return (
    <span className="ecl-medidor" data-falta={falta}>
      <span className="ecl-rotulo-mini">{rotulo}</span>
      <span className="ecl-medidor-trilho" aria-hidden="true"><span className="ecl-medidor-cheio" style={{ width: `${pct}%` }} /></span>
      <ComFontes partes={[{ secao: "Gasto", valor: gasto, texto: String(gasto) }, ...partesGasto, { secao: "Orçamento", valor: total, texto: String(total) }, ...partesTotal]} total={`${gasto} de ${total}`}>
        <span className="ecl-medidor-texto">{gasto} de {total}</span>
      </ComFontes>
    </span>
  );
}

/* ============================================================
   A linha da lista lateral
   ============================================================ */

export function LinhaListaEcl({ linha, feitico }) {
  return (
    <span className="ecl-feiticos ecl-linha-lista">
      <span className="ecl-linha-lista-nome">{feitico?.nome || "Feitiço Sem Nome"}</span>
      <span className="ecl-linha-lista-meta">
        <span>{linha?.nivelLabel ?? ""}</span>
        {linha?.valor && <span className="ecl-linha-lista-valor">{linha.valor}</span>}
        {linha?.custoPE != null && <span className="ecl-linha-lista-pe">{linha.custoPE} PE</span>}
        {linha?.avisos?.length > 0 && <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "var(--afty-aviso)" }} aria-label="Tem aviso" />}
      </span>
    </span>
  );
}

/* ============================================================
   O editor
   ============================================================ */

export function EditorFeiticoEcl({ feitico: cru, calc, ctx, onPatch, onRemove, onDuplicate, TextoLongo }) {
  const f = calc?.feitico ?? normalizarFeiticoEcl(cru);
  const bt = ctx.bt;
  const passivo = f.natureza === "passivo";
  const reacao = !passivo && f.acao === "reacao";
  const ritual = !passivo && (f.tipo === "destrutivo" || f.tipo === "cataclismico");
  const temLiberacao = !passivo && !reacao && bt >= LIBERACAO_BT_MIN;
  /* CHAVE DE CAMADA (autor, 2026-11-23). Em Liberação, Alcance e Efeitos editam
     o Feitiço LIBERADO (base + camada), e o que muda é gravado como camada pela
     `diferencaLiberacaoEcl`. O base é o piso: os controles dele ficam travados. */
  const [camada, setCamada] = useState("normal");
  const emLib = temLiberacao && camada === "liberacao";
  const L = calc?.liberacao ?? null;
  const fV = emLib ? (L?.calc?.feitico ?? aplicarLiberacaoEcl(f)) : f;
  const calcV = emLib ? (L?.calc ?? null) : calc;
  const patchV = emLib ? (parcial) => onPatch({ liberacao: diferencaLiberacaoEcl(f, { ...fV, ...parcial }) }) : onPatch;
  const piso = emLib ? f : null;

  const gastosLib = (calc?.gastos ?? []).filter((g) => g.camada === "liberacao");
  const somaLib = (qual) => gastosLib.filter((g) => g.abaOrigem === qual).reduce((s, g) => s + g.custo, 0);
  const abas = emLib ? [
    { id: "alcance", label: "Alcance", pontos: somaLib("alcance") },
    { id: "efeitos", label: "Efeitos", pontos: somaLib("efeitos") },
  ] : [
    { id: "base", label: "Base", pontos: calc?.porAba.base ?? 0, ganho: true },
    ...(passivo ? [] : [{ id: "alcance", label: "Alcance", pontos: calc?.porAba.alcance ?? 0 }]),
    { id: "efeitos", label: "Efeitos", pontos: calc?.porAba.efeitos ?? 0 },
  ];
  const [abaEscolhida, setAba] = useState("base");
  const aba = abas.some((a) => a.id === abaEscolhida) ? abaEscolhida : abas[0].id;

  const sub = (chave, parcial) => patchV({ [chave]: { ...fV[chave], ...parcial } });
  const G = (id) => calc?.gastos.find((g) => g.id === (emLib ? `lib:${id}` : id)) ?? null;
  const C = (id) => {
    const g = G(id);
    return <Custo valor={g?.custo ?? 0} partes={g?.partes} />;
  };
  const listaOp = (chave, op) => patchV({ [chave]: op(fV[chave]) });
  const atualizar = (chave, id, parcial) => listaOp(chave, (l) => l.map((x) => (x.id === id ? { ...x, ...parcial } : x)));
  const remover = (chave, id) => listaOp(chave, (l) => l.filter((x) => x.id !== id));

  const geral = calc?.fontes.find((x) => x.id === "geral");
  const fonteLib = calc?.fontes.find((x) => x.id === "liberacao") ?? null;
  // Fonte restrita só ganha medidor quando está em uso. A da Liberação mora na chave.
  const restritas = (calc?.fontes ?? []).filter((x) => x.id !== "geral" && x.id !== "liberacao" && x.gasto > 0);
  const partesGasto = (calc?.gastos ?? []).filter((g) => g.camada === "base").map((g) => ({ label: g.rotulo, valor: g.custo }));
  const partesGastoLib = gastosLib.map((g) => ({ label: g.rotulo, valor: g.custo }));
  // O que a barra mostra em cada modo. Em Liberação o Custo e a Fadiga já somam a
  // camada, e as parcelas (base + Liberação) moram no hover.
  const emLibOk = emLib && !!L && !!fonteLib;
  const saldoFonte = emLibOk ? fonteLib : (geral ? { ...geral, sobra: calc.sobra, falta: calc.falta } : null);
  const saldoPe = calc?.pe ? (emLibOk ? L.pe : calc.pe) : null;
  const saldoFadiga = {
    total: f.fadiga + (emLibOk ? L.fadiga : 0),
    partes: [
      { label: "Desgaste do Conjurador", valor: f.fadiga },
      ...(emLibOk ? [{ label: "Liberação Máxima (1 a cada ⌊BT/2⌋ PE)", valor: L.fadiga }] : []),
    ],
  };

  return (
    <div className="ecl-feiticos">
      {/* ===== 1. IDENTIDADE ===== */}
      <div className="ecl-identidade">
        <div className="ecl-identidade-topo">
          <input
            className="ecl-nome"
            value={cru?.nome ?? ""}
            placeholder="Nome do Feitiço"
            aria-label="Nome do Feitiço"
            onChange={(e) => onPatch({ nome: e.target.value })}
          />
          <button type="button" className="ecl-icone-botao" aria-label="Duplicar Feitiço" title="Duplicar Feitiço" onClick={onDuplicate}>
            <Copy className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" className="ecl-icone-botao" data-tom="perigo" aria-label="Excluir Feitiço" title="Excluir Feitiço" onClick={onRemove}>
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="ecl-identidade-chips">
          <span className="ecl-grupo-chips">
            <span className="ecl-rotulo-mini">Natureza</span>
            <Opcoes rotulo="Natureza" valor={f.natureza} onChange={(v) => onPatch({ natureza: v })}
              opcoes={[{ value: "ativo", label: "Ativo" }, { value: "passivo", label: "Passivo" }]} />
          </span>
          {!passivo && (
            <span className="ecl-grupo-chips">
              <span className="ecl-rotulo-mini">Tipo</span>
              <Opcoes rotulo="Tipo" valor={f.tipo} onChange={(v) => onPatch({ tipo: v })}
                opcoes={TIPOS_FEITICO_ECL.map((t) => ({
                  ...t,
                  indisponivel: t.btMin && bt < t.btMin ? `Pede BT ${t.btMin}` : null,
                }))} />
              <Interruptor
                ligado={f.tecnicaMaxima}
                onChange={(v) => onPatch({ tecnicaMaxima: v })}
                indisponivel={!f.tecnicaMaxima && !ctx.temTecnicaMaxima ? "Pede a Aptidão Técnica Máxima"
                  : !f.tecnicaMaxima && bt < TECNICA_MAXIMA_ECL.btMin ? `Pede BT ${TECNICA_MAXIMA_ECL.btMin}` : null}
              >
                Técnica Máxima
              </Interruptor>
            </span>
          )}
        </div>
      </div>

      {/* ===== 2. SALDO GRUDADO ===== */}
      {calc && (
        <div className="ecl-saldo">
          {/* Duas linhas com as MESMAS casas nos dois modos (autor, 2026-11-23): a
              chave troca só os números, nunca o leiaute. */}
          <div className="ecl-saldo-topo">
            {!passivo && (
              <span className="ecl-saldo-item">
                <span className="ecl-rotulo-mini">ND</span>
                <Passo rotulo="ND do Feitiço" valor={f.nd} min={1} max={Math.max(1, ctx.nd)} onChange={(v) => onPatch({ nd: v })} />
              </span>
            )}
            {saldoPe && (
              <span className="ecl-saldo-item">
                <span className="ecl-rotulo-mini">Custo</span>
                <ComFontes partes={saldoPe.partes} total={`${saldoPe.total} PE`}>
                  <span className="ecl-numero" data-tom="pe">{saldoPe.total} PE</span>
                </ComFontes>
              </span>
            )}
            {!passivo && (
              <span className="ecl-saldo-item">
                <span className="ecl-rotulo-mini">Fadiga</span>
                <ComFontes partes={saldoFadiga.partes} total={String(saldoFadiga.total)}>
                  <span className="ecl-numero">{saldoFadiga.total}</span>
                </ComFontes>
              </span>
            )}
            {temLiberacao && (
              <span className="ecl-saldo-camada">
                <Opcoes rotulo="Camada" valor={camada} onChange={setCamada}
                  opcoes={[{ value: "normal", label: "Normal" }, { value: "liberacao", label: "Liberação" }]} />
              </span>
            )}
          </div>
          <div className="ecl-saldo-barra">
            <Medidor total={saldoFonte.total} gasto={saldoFonte.gasto} partesTotal={saldoFonte.partes}
              partesGasto={emLib ? partesGastoLib : partesGasto} rotulo={emLib ? "Pontos da Liberação" : "Pontos"} />
            <span className="ecl-saldo-resto" data-falta={saldoFonte.falta > 0}>
              {saldoFonte.falta > 0
                ? <><AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />Faltam {saldoFonte.falta}</>
                : `Sobram ${saldoFonte.sobra}`}
            </span>
          </div>
          {(restritas.length > 0 || calc.recarga != null || calc.duracao.sustentado) && (
            <span className="ecl-saldo-linha2">
              {restritas.map((fo) => (
                <span key={fo.id} className="ecl-medidor-mini">
                  <span>{fo.rotulo}</span>
                  <span className="ecl-medidor-trilho" aria-hidden="true">
                    <span className="ecl-medidor-cheio" style={{ width: `${fo.total ? Math.min(100, (fo.gasto / fo.total) * 100) : 100}%`, background: fo.falta ? "var(--afty-aviso)" : undefined }} />
                  </span>
                  <ComFontes partes={fo.partes} total={`${fo.gasto} de ${fo.total}`}>
                    <span className="ecl-medidor-texto">{fo.gasto} de {fo.total}</span>
                  </ComFontes>
                </span>
              ))}
              {calc.recarga != null && <span className="ecl-medidor-mini">Recarga <b className="ecl-medidor-texto">{calc.recarga} Rodadas</b></span>}
              {calc.duracao.sustentado && <span className="ecl-medidor-mini">Manutenção <b className="ecl-medidor-texto">{calc.duracao.sustentado.manutencao} PE</b></span>}
            </span>
          )}
        </div>
      )}
      {calc && (calc.bloqueios.length > 0 || calc.avisos.length > 0) && (
        <div className="ecl-avisos" role="status">
          {[...calc.bloqueios, ...calc.avisos.filter((a) => !a.startsWith("Faltam "))].map((a) => (
            <span key={a} className="ecl-aviso"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />{a}</span>
          ))}
        </div>
      )}

      {/* ===== 3. EDITOR EM SUB-ABAS ===== */}
      <div className="ecl-subabas" role="tablist" aria-label="Partes do Feitiço">
        {abas.map((a) => (
          <button key={a.id} type="button" role="tab" className="ecl-subaba" aria-selected={aba === a.id} onClick={() => setAba(a.id)}>
            {a.label}
            <span className="ecl-subaba-pontos" data-tom={a.ganho ? "ganho" : undefined}>{a.ganho ? comSinal(a.pontos) : a.pontos}</span>
          </button>
        ))}
      </div>

      {!emLib && aba === "base" && (passivo
        ? <BasePassivo f={f} calc={calc} bt={bt} sub={sub} />
        : <BaseAtivo f={f} bt={bt} ritual={ritual} onPatch={onPatch} atualizar={atualizar} remover={remover} listaOp={listaOp} />)}
      {aba === "alcance" && <AbaAlcance f={fV} calc={calcV} sub={sub} C={C} piso={piso} />}
      {aba === "efeitos" && (
        <AbaEfeitos f={fV} calc={calcV} ctx={ctx} passivo={passivo} reacao={reacao} sub={sub} C={C} G={G}
          atualizar={atualizar} remover={remover} listaOp={listaOp} piso={piso} />
      )}

      {/* ===== 4. DETALHE ===== */}
      <div className="ecl-detalhe">
        <div className="flex flex-col gap-1">
          <span className="ecl-rotulo-mini">Descrição</span>
          {/* O TextoLongo é do criador e chega por prop (mesmo caminho do Estilo das
              Sombras), porque a aba não importa o AftyCreatureBuilder. */}
          {TextoLongo ? (
            <TextoLongo value={f.descricao ?? ""} onChange={(v) => onPatch({ descricao: v })} minRows={3} formatacao />
          ) : (
            <textarea className="ecl-campo" value={f.descricao} onChange={(e) => onPatch({ descricao: e.target.value })} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Base
   ============================================================ */

function Requisitos({ lista, onAdd, onMudar, onRemover, rotuloTexto = "Requisito" }) {
  return (
    <>
      {lista.map((r) => {
        const pontos = REQUISITOS_ECL.find((x) => x.value === r.dificuldade)?.pontos ?? 0;
        return (
          <div key={r.id} className="ecl-linha">
            <input className="ecl-campo" value={r.texto} placeholder={rotuloTexto} aria-label={rotuloTexto}
              onChange={(e) => onMudar(r.id, { texto: e.target.value })} />
            <span className="ecl-linha-controles">
              <Opcoes rotulo="Dificuldade" valor={r.dificuldade} onChange={(v) => onMudar(r.id, { dificuldade: v })} opcoes={REQUISITOS_ECL} />
              <button type="button" className="ecl-icone-botao" aria-label="Remover Requisito" title="Remover Requisito" onClick={() => onRemover(r.id)}>
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </span>
            <Custo valor={pontos} ganho />
          </div>
        );
      })}
      <div className="ecl-linha">
        <span />
        <span className="ecl-linha-controles">
          <button type="button" className="ecl-adicionar" onClick={onAdd}><Plus className="w-3.5 h-3.5" aria-hidden="true" />Adicionar Requisito</button>
        </span>
        <span />
      </div>
    </>
  );
}

function BaseAtivo({ f, bt, ritual, onPatch, atualizar, remover, listaOp }) {
  const acao = ACOES_ECL.find((a) => a.value === f.acao);
  return (
    <>
      <Bloco titulo="Orçamento">
        <Linha rotulo="ND do Feitiço" custo={<Custo valor={f.nd} ganho />}>
          <span className="ecl-linha-rotulo">ND {f.nd}</span>
        </Linha>
        <Linha rotulo={f.tecnicaMaxima ? "4× BT" : "2× BT"} custo={<Custo valor={(f.tecnicaMaxima ? 4 : 2) * bt} ganho />}>
          <span className="ecl-linha-rotulo">BT {bt}</span>
        </Linha>
        <Linha rotulo="Ação" custo={<Custo valor={ritual ? bt : acao.multBt * bt} ganho />}>
          {ritual
            ? <Opcoes rotulo="Ação" valor="ritual" onChange={() => {}} opcoes={[{ value: "ritual", label: "Ritual Estendido", delta: bt }]} />
            : <Opcoes rotulo="Ação" valor={f.acao} onChange={(v) => onPatch({ acao: v })}
              opcoes={ACOES_ECL.map((a) => ({
                value: a.value, label: a.curto, delta: a.multBt * bt,
                indisponivel: a.value === "reacao" && f.dano.vampirico ? "Vampírico não pode ser Reação" : null,
              }))} />}
        </Linha>
      </Bloco>
      <Bloco titulo="Requisitos">
        <Requisitos
          lista={f.requisitos}
          onAdd={() => listaOp("requisitos", (l) => [...l, criarRequisitoEcl()])}
          onMudar={(id, p) => atualizar("requisitos", id, p)}
          onRemover={(id) => remover("requisitos", id)}
        />
      </Bloco>
      <Bloco titulo="Desgaste do Conjurador">
        <Linha rotulo="Fadiga" custo={<Custo valor={f.fadiga} ganho />}>
          <Passo rotulo="Fadiga" valor={f.fadiga} onChange={(v) => onPatch({ fadiga: v })} />
        </Linha>
        <Linha rotulo="Exaustão" custo={<Custo valor={f.exaustao * 4} ganho />}>
          <Passo rotulo="Exaustão" valor={f.exaustao} onChange={(v) => onPatch({ exaustao: v })} />
        </Linha>
      </Bloco>
    </>
  );
}

function BasePassivo({ f, calc, bt, sub }) {
  const p = f.passivo;
  const semi = calc?.fontes.find((x) => x.id === "semiativo");
  return (
    <>
      <Bloco titulo="Orçamento">
        <Linha rotulo="Passivo" custo={<Custo valor={bt} ganho />}>
          <Opcoes rotulo="Passivo" valor={p.modo} onChange={(v) => sub("passivo", { modo: v })} opcoes={PASSIVOS_ECL} />
        </Linha>
        <Linha rotulo="Aprimoramentos" custo={<Custo valor={p.aprimoramentos * Math.floor(bt / 2)} ganho />}>
          <Passo rotulo="Aprimoramentos" valor={p.aprimoramentos} onChange={(v) => sub("passivo", { aprimoramentos: v })} />
        </Linha>
      </Bloco>
      {p.modo === "condicional" && (
        <Bloco titulo="Condição">
          <Requisitos
            rotuloTexto="Condição"
            lista={p.requisitos}
            onAdd={() => sub("passivo", { requisitos: [...p.requisitos, criarRequisitoEcl()] })}
            onMudar={(id, x) => sub("passivo", { requisitos: p.requisitos.map((r) => (r.id === id ? { ...r, ...x } : r)) })}
            onRemover={(id) => sub("passivo", { requisitos: p.requisitos.filter((r) => r.id !== id) })}
          />
        </Bloco>
      )}
      {p.modo === "semiativo" && (
        <Bloco titulo="Ativação" pontos={semi ? comSinal(semi.total) : null}>
          <Linha rotulo="Gatilho">
            <input className="ecl-campo flex-1" value={p.gatilho} placeholder="Gatilho" aria-label="Gatilho"
              onChange={(e) => sub("passivo", { gatilho: e.target.value })} />
          </Linha>
          <Linha rotulo="Usos" sub={calc?.usosSemiativo != null ? `${calc.usosSemiativo} por Recarga` : null}>
            <Opcoes rotulo="Usos" valor={p.usos} onChange={(v) => sub("passivo", { usos: v })}
              opcoes={USOS_SEMIATIVO.map((u) => ({ ...u, delta: u.value === "um" && Math.floor(bt / 2) <= 1 ? 0 : u.ajuste }))} />
          </Linha>
          <Linha rotulo="Recarga">
            <Opcoes rotulo="Recarga" valor={p.recarga} onChange={(v) => sub("passivo", { recarga: v })}
              opcoes={RECARGAS_SEMIATIVO.map((r) => ({ ...r, delta: r.ajuste }))} />
          </Linha>
          <Linha rotulo="Fadiga por Uso" custo={<Custo valor={p.fadiga} ganho />}>
            <Passo rotulo="Fadiga por Uso" valor={p.fadiga} onChange={(v) => sub("passivo", { fadiga: v })} />
          </Linha>
          <Linha rotulo="Exaustão por Uso" custo={<Custo valor={p.exaustao * 4} ganho />}>
            <Passo rotulo="Exaustão por Uso" valor={p.exaustao} onChange={(v) => sub("passivo", { exaustao: v })} />
          </Linha>
        </Bloco>
      )}
    </>
  );
}

/* ============================================================
   Alcance
   ============================================================ */

function AbaAlcance({ f, calc, sub, C, piso = null }) {
  const catacl = f.tipo === "cataclismico";
  const destr = f.tipo === "destrutivo";
  const formato = FORMATOS_AREA_ECL.find((x) => x.value === f.area.formato);
  const areaLigada = destr || f.area.ativa || (f.multiplos.ativo && f.multiplos.areas > 0);
  // Em Liberação, o base é o piso: nada fica abaixo dele nem desliga o que ele liga.
  const pisoAreaLigada = !!piso && (destr || piso.area.ativa);
  const faixasBase = new Set(piso?.area.faixas.map((x) => x.id) ?? []);
  const alcances = piso
    ? ALCANCES_ECL.map((o) => ({
      ...o,
      indisponivel: o.value === piso.alcance.modo || o.value === "distancia" ? null : "Definido no Base",
    }))
    : ALCANCES_ECL;
  if (catacl) {
    return (
      <Bloco titulo="Alcance e Área">
        <Linha rotulo="Mapa Inteiro" custo={C("cataclismico")}>
          <span className="ecl-linha-rotulo">Alcance e Área</span>
        </Linha>
        {custoAuxArea(calc, C)}
      </Bloco>
    );
  }
  return (
    <>
      <Bloco titulo="Alcance">
        <Linha rotulo="Alcance" sub={calc?.entrega.alcance?.texto} custo={C("alcance")}>
          <Opcoes rotulo="Alcance" valor={f.alcance.modo} onChange={(v) => sub("alcance", { modo: v })} opcoes={alcances}
            travado={piso?.alcance.modo === "distancia"} />
          {f.alcance.modo === "distancia" && (
            <Passo rotulo="Pontos de Alcance" valor={f.alcance.pontos} min={piso?.alcance.pontos ?? 0} onChange={(v) => sub("alcance", { pontos: v })}
              sufixo={metros(f.alcance.pontos * METROS_POR_PONTO_ALCANCE)} />
          )}
        </Linha>
      </Bloco>
      <Bloco titulo="Área" acao={!destr && (
        <Interruptor ligado={f.area.ativa} onChange={(v) => sub("area", { ativa: v })}
          indisponivel={piso?.area.ativa ? "Definido no Base" : null}>Feitiço em Área</Interruptor>
      )}>
        {areaLigada ? (
          <>
            <Linha rotulo="Habilitar Área" custo={C("areaHabilitar")}><span /></Linha>
            <Linha rotulo="Formato" sub={calc?.entrega.area?.texto} custo={C("areaDimensoes")}>
              <Opcoes rotulo="Formato" valor={f.area.formato} onChange={(v) => sub("area", { formato: v })} opcoes={FORMATOS_AREA_ECL}
                travado={pisoAreaLigada} />
              <Passo rotulo={formato.dimensao} valor={f.area.pontos} min={piso?.area.pontos ?? 0} onChange={(v) => sub("area", { pontos: v })}
                sufixo={`${formato.dimensao} ${metros(f.area.pontos * formato.metros)}`} />
            </Linha>
            {f.area.formato === "linha" && (
              <>
                {f.area.faixas.map((x, i) => (
                  <Linha key={x.id} rotulo={`Faixa Adicional ${i + 1}`}>
                    <Passo rotulo={`Comprimento da Faixa ${i + 1}`} valor={Math.round(x.metros / LARGURA_FAIXA)}
                      min={faixasBase.has(x.id) ? Math.round(x.metros / LARGURA_FAIXA) : 0} max={faixasBase.has(x.id) ? Math.round(x.metros / LARGURA_FAIXA) : 200}
                      onChange={(v) => sub("area", { faixas: f.area.faixas.map((y) => (y.id === x.id ? { ...y, metros: v * LARGURA_FAIXA } : y)) })}
                      sufixo={metros(x.metros)} />
                    {!faixasBase.has(x.id) && (
                      <button type="button" className="ecl-icone-botao" aria-label="Remover Faixa" title="Remover Faixa"
                        onClick={() => sub("area", { faixas: f.area.faixas.filter((y) => y.id !== x.id) })}>
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </Linha>
                ))}
                <Linha rotulo="">
                  <button type="button" className="ecl-adicionar"
                    onClick={() => sub("area", { faixas: [...f.area.faixas, { id: novoIdEcl("fx"), metros: 4.5 }] })}>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />Adicionar Faixa
                  </button>
                </Linha>
              </>
            )}
          </>
        ) : <span className="ecl-vazio">Alvo único</span>}
        {custoAuxArea(calc, C)}
      </Bloco>
      <Bloco titulo="Múltiplos Alvos" acao={
        <Interruptor ligado={f.multiplos.ativo} onChange={(v) => sub("multiplos", { ativo: v })}
          indisponivel={piso?.multiplos.ativo ? "Definido no Base" : null}>Múltiplos</Interruptor>
      }>
        {f.multiplos.ativo ? (
          <>
            <Linha rotulo="Habilitar" sub={calc?.entrega.multiplos ? `${calc.entrega.multiplos.total} de ${calc.bt}` : null} custo={C("multiplos")}><span /></Linha>
            <Linha rotulo="Alvos Escolhidos"><Passo rotulo="Alvos" valor={f.multiplos.alvos} min={piso?.multiplos.alvos ?? 0} onChange={(v) => sub("multiplos", { alvos: v })} /></Linha>
            <Linha rotulo="Disparos"><Passo rotulo="Disparos" valor={f.multiplos.disparos} min={piso?.multiplos.disparos ?? 0} onChange={(v) => sub("multiplos", { disparos: v })} /></Linha>
            <Linha rotulo="Áreas"><Passo rotulo="Áreas" valor={f.multiplos.areas} min={piso?.multiplos.areas ?? 0} onChange={(v) => sub("multiplos", { areas: v })} /></Linha>
          </>
        ) : <span className="ecl-vazio">Um alvo ou uma área</span>}
      </Bloco>
    </>
  );
}

function custoAuxArea(calc, C) {
  const g = calc?.gastos.find((x) => x.id === "auxEmArea");
  return g ? <Linha rotulo="Efeitos Auxiliares em Área" custo={C("auxEmArea")}><span /></Linha> : null;
}

/* ============================================================
   Efeitos
   ============================================================ */

function opcoesDeEscolha(def, ctx) {
  if (!def?.escolha) return null;
  return { tr: ctx.trs, pericia: ctx.pericias, atributo: ctx.atributos, tipoDano: ctx.tiposDano, grupoDano: ctx.gruposDano }[def.escolha] ?? null;
}

function Selecao({ valor, opcoes, onChange, rotulo, vazio = null, travado = false }) {
  return (
    <select className="ecl-campo" value={valor} aria-label={rotulo} disabled={travado} onChange={(e) => onChange(e.target.value)}>
      {vazio && <option value="">{vazio}</option>}
      {opcoes.map((o) => <option key={o.value} value={o.value} disabled={!!o.indisponivel}>{o.label}{o.sufixo ?? ""}</option>)}
    </select>
  );
}

function AbaEfeitos({ f, calc, ctx, passivo, reacao, sub, C, G, atualizar, remover, listaOp, piso = null }) {
  const destr = f.tipo === "destrutivo";
  // Em Liberação, o base é o piso (ver `diferencaLiberacaoEcl`).
  const danoBase = (piso?.dano.dados ?? 0) > 0;
  const curaBase = (piso?.cura.dados ?? 0) > 0;
  const auxBase = new Map((piso?.auxiliares ?? []).map((a) => [a.id, a]));
  const condBase = new Set((piso?.condicoes ?? []).map((c) => c.id));
  const doBase = (ligado) => (piso && ligado ? "Definido no Base" : null);
  const faces = calc?.dano?.faces ?? (ctx.bt >= 7 ? 12 : ctx.bt >= 5 ? 10 : 8);
  const duracoes = DURACOES_ECL;
  return (
    <>
      {!passivo && !reacao && (
        <Bloco titulo="Dano e Cura">
          <Linha rotulo="Dados de Dano" sub={calc?.dano ? `${calc.dano.dados}d${faces}${calc.dano.porParte != null ? `, ${calc.dano.partes}× ${calc.dano.porParte}d${faces}` : ""}` : null} custo={C("danoDados")}>
            <Passo rotulo="Dados de Dano" valor={f.dano.dados} min={piso?.dano.dados ?? 0} max={999} onChange={(v) => sub("dano", { dados: v })} sufixo={`d${faces}`} />
            <Selecao rotulo="Tipo de Dano" valor={f.dano.tipo} opcoes={ctx.tiposDano} vazio="Tipo de Dano" travado={danoBase} onChange={(v) => sub("dano", { tipo: v })} />
          </Linha>
          {f.dano.dados > 0 && (
            <>
              <Linha rotulo="Resolução">
                <Opcoes rotulo="Resolução" valor={f.dano.resolucao} travado={danoBase} onChange={(v) => sub("dano", { resolucao: v })}
                  opcoes={[{ value: "tr", label: "Teste de Resistência" }, { value: "ataque", label: "Jogada de Ataque" }]} />
                {f.dano.resolucao === "tr" && <Selecao rotulo="Teste de Resistência" valor={f.dano.tr} opcoes={ctx.trs} travado={danoBase} onChange={(v) => sub("dano", { tr: v })} />}
              </Linha>
              <Linha rotulo="Dano Contínuo" sub={calc?.dano?.porRodada ? `${calc.dano.porRodada}d${faces} por Rodada` : null}>
                <Interruptor ligado={f.dano.continuo} onChange={(v) => sub("dano", { continuo: v })} indisponivel={doBase(danoBase)}>Contínuo</Interruptor>
                {f.dano.continuo && (
                  <>
                    <Opcoes rotulo="Duração do Contínuo" valor={f.dano.duracaoContinuo} travado={danoBase} onChange={(v) => sub("dano", { duracaoContinuo: v })}
                      opcoes={duracoes.filter((d) => d.value !== "imediato")} />
                    <Selecao rotulo="TR para Encerrar" valor={f.dano.trEncerra} opcoes={ctx.trs} vazio="Sem TR para Encerrar" travado={!!piso} onChange={(v) => sub("dano", { trEncerra: v })} />
                  </>
                )}
              </Linha>
              <Linha rotulo="Vampírico" custo={C("vampirico")}>
                <Interruptor ligado={f.dano.vampirico} onChange={(v) => sub("dano", { vampirico: v })}
                  indisponivel={f.acao === "reacao" ? "Vampírico não pode ser Reação" : doBase(piso?.dano.vampirico)}>Drenar Vida</Interruptor>
              </Linha>
              {destr && (
                <>
                  <Linha rotulo="Ignorar Resistências" custo={C("ignorarResistencias")}>
                    <Interruptor ligado={f.dano.ignorarResistencias} onChange={(v) => sub("dano", { ignorarResistencias: v })}
                      indisponivel={doBase(piso?.dano.ignorarResistencias)}>Ignorar</Interruptor>
                  </Linha>
                  <Linha rotulo="Morte Direta" custo={C("morteDireta")}>
                    <Interruptor ligado={f.dano.morteDireta} onChange={(v) => sub("dano", { morteDireta: v })}
                      indisponivel={!f.dano.morteDireta && f.nd < MORTE_DIRETA_ND_MIN ? `Pede ND ${MORTE_DIRETA_ND_MIN}` : doBase(piso?.dano.morteDireta)}>Morte Direta</Interruptor>
                  </Linha>
                </>
              )}
            </>
          )}
          <Linha rotulo="Dados de Cura" sub={calc?.cura?.temporaria ? "PV Temporário" : null} custo={C("curaDados")}>
            <Passo rotulo="Dados de Cura" valor={f.cura.dados} min={piso?.cura.dados ?? 0} max={999} onChange={(v) => sub("cura", { dados: v })} sufixo={`d${faces}`} />
            {f.cura.dados > 0 && <Interruptor ligado={f.cura.continuo} onChange={(v) => sub("cura", { continuo: v })} indisponivel={doBase(curaBase)}>Contínua</Interruptor>}
            {f.cura.continuo && f.cura.dados > 0 && (
              <Opcoes rotulo="Duração da Cura" valor={f.cura.duracaoContinuo} travado={curaBase} onChange={(v) => sub("cura", { duracaoContinuo: v })}
                opcoes={duracoes.filter((d) => d.value !== "imediato")} />
            )}
          </Linha>
        </Bloco>
      )}

      <Bloco titulo={reacao ? "Efeitos da Reação" : "Efeitos Auxiliares"} acao={
        <button type="button" className="ecl-adicionar" onClick={() => listaOp("auxiliares", (l) => [...l, criarAuxiliarEcl(primeiroLivre(l))])}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />{piso ? "Efeito Só na Liberação" : "Adicionar Efeito"}
        </button>
      }>
        {f.auxiliares.length === 0 && <span className="ecl-vazio">Nenhum Efeito Auxiliar</span>}
        {f.auxiliares.map((a) => {
          const def = AUX_POR_ID_ECL[a.efeito];
          const e = calc?.efeitos.find((x) => x.id === a.id);
          const escolhas = opcoesDeEscolha(def, ctx);
          const usados = new Set(f.auxiliares.filter((x) => x.id !== a.id && x.sentido === a.sentido).map((x) => x.efeito));
          const base = auxBase.get(a.id) ?? null;
          const gAux = G(`aux:${a.id}`);
          return (
            <div key={a.id} className="ecl-item">
              <div className="ecl-item-topo">
                <Selecao rotulo="Efeito" valor={a.efeito}
                  opcoes={AUX_EFEITOS_ECL.map((x) => ({ value: x.value, label: x.label, indisponivel: x.indisponivel || usados.has(x.value) }))}
                  travado={!!base}
                  onChange={(v) => atualizar("auxiliares", a.id, { efeito: v, escolha: "", sentido: AUX_POR_ID_ECL[v]?.soBonus ? "bonus" : a.sentido })} />
                {e && <span className="ecl-item-valor">{a.sentido === "debuff" ? "−" : "+"}{String(e.valor).replace(".", ",")}{def?.unidade ? ` ${def.unidade}` : ""}</span>}
                <Custo valor={gAux?.custo ?? 0} partes={gAux?.partes} />
                {base ? <span className="ecl-icone-botao" aria-hidden="true" /> : (
                  <button type="button" className="ecl-icone-botao" aria-label="Remover Efeito" title="Remover Efeito" onClick={() => remover("auxiliares", a.id)}>
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="ecl-item-linha">
                <Passo rotulo="Unidades" valor={a.unidades} min={base?.unidades ?? 0} max={Math.max(e?.teto ?? 99, base?.unidades ?? 0)} onChange={(v) => atualizar("auxiliares", a.id, { unidades: v })}
                  sufixo={e ? `de ${e.teto}` : null} />
                {!passivo && (
                  <Opcoes rotulo="Sentido" valor={a.sentido} travado={!!base} onChange={(v) => atualizar("auxiliares", a.id, { sentido: v })}
                    opcoes={[{ value: "bonus", label: "Bônus" }, { value: "debuff", label: "Debuff", indisponivel: def?.soBonus ? "Este efeito só existe como Bônus" : null }]} />
                )}
                {escolhas && <Selecao rotulo="Escolha" valor={a.escolha} opcoes={escolhas} vazio="Escolher" travado={!!base} onChange={(v) => atualizar("auxiliares", a.id, { escolha: v })} />}
              </div>
              {!passivo && (
                <div className="ecl-item-linha">
                  <Opcoes rotulo="Alvo" valor={a.alvo} travado={!!base} onChange={(v) => atualizar("auxiliares", a.id, { alvo: v })} opcoes={ALVOS_AUX_ECL} />
                  {!reacao && <Opcoes rotulo="Duração" valor={a.duracao} travado={!!base} onChange={(v) => atualizar("auxiliares", a.id, { duracao: v })} opcoes={duracoes} />}
                </div>
              )}
              {passivo && f.passivo.modo !== "permanente" && (
                <div className="ecl-item-linha">
                  {f.passivo.modo === "condicional"
                    ? <Interruptor ligado={a.condicional} onChange={(v) => atualizar("auxiliares", a.id, { condicional: v })}>Depende da Condição</Interruptor>
                    : <Interruptor ligado={a.ativado} onChange={(v) => atualizar("auxiliares", a.id, { ativado: v })}>Só Quando Ativado</Interruptor>}
                </div>
              )}
              {!reacao && !passivo && !base && (
                <Permuta a={a} onMudar={(contrapartidas) => atualizar("auxiliares", a.id, { permuta: { contrapartidas } })} e={e} />
              )}
            </div>
          );
        })}
      </Bloco>

      {!passivo && !reacao && (
        <Bloco titulo="Condições" acao={
          <button type="button" className="ecl-adicionar" onClick={() => listaOp("condicoes", (l) => [...l, criarCondicaoEcl(CONDICOES_ECL.find((c) => c.custo != null).value)])}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />{piso ? "Condição Só na Liberação" : "Adicionar Condição"}
          </button>
        }>
          {f.condicoes.length === 0 && <span className="ecl-vazio">Nenhuma Condição</span>}
          {f.condicoes.map((c) => {
            const base = condBase.has(c.id);
            const gCond = G(`cond:${c.id}`);
            return (
            <div key={c.id} className="ecl-item">
              <div className="ecl-item-topo">
                <Selecao rotulo="Condição" valor={c.condicao}
                  opcoes={CONDICOES_ECL.map((x) => ({ value: x.value, label: x.label, indisponivel: x.custo == null, sufixo: x.custo == null ? " (Em Revisão)" : "" }))}
                  travado={base}
                  onChange={(v) => atualizar("condicoes", c.id, { condicao: v })} />
                <Custo valor={gCond?.custo ?? 0} partes={gCond?.partes} />
                {base ? <span className="ecl-icone-botao" aria-hidden="true" /> : (
                  <button type="button" className="ecl-icone-botao" aria-label="Remover Condição" title="Remover Condição" onClick={() => remover("condicoes", c.id)}>
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="ecl-item-linha">
                <Opcoes rotulo="Alvo" valor={c.alvo} travado={base} onChange={(v) => atualizar("condicoes", c.id, { alvo: v })}
                  opcoes={[{ value: "alvo", label: "Alvo" }, { value: "area", label: "Área ou Vários" }]} />
                <Opcoes rotulo="Duração" valor={c.duracao} travado={base} onChange={(v) => atualizar("condicoes", c.id, { duracao: v })} opcoes={duracoes} />
              </div>
              <div className="ecl-item-linha">
                <Passo rotulo="Desconto de Remoção" valor={c.ajusteRemocao} min={base ? c.ajusteRemocao : 0} max={base ? c.ajusteRemocao : 999} onChange={(v) => atualizar("condicoes", c.id, { ajusteRemocao: v })} sufixo="Desconto" />
                {c.ajusteRemocao > 0 && (
                  <input className="ecl-campo flex-1" value={c.notaRemocao} placeholder="Forma de Remoção" aria-label="Forma de Remoção" disabled={base}
                    onChange={(e) => atualizar("condicoes", c.id, { notaRemocao: e.target.value })} />
                )}
              </div>
            </div>
            );
          })}
        </Bloco>
      )}

      {calc && (calc.duracao.duradouro || calc.duracao.sustentado) && (
        <Bloco titulo="Duração">
          {calc.duracao.duradouro && (
            <Linha rotulo="Duradouro" custo={C("duradouro")}>
              <Passo rotulo="Rodadas" valor={f.duracao.rodadas} min={piso?.duracao.rodadas ?? 1} max={999} onChange={(v) => sub("duracao", { rodadas: v })} sufixo="Rodadas" />
              <Interruptor ligado={f.duracao.concentracaoDuradoura} onChange={(v) => sub("duracao", { concentracaoDuradoura: v })}
                indisponivel={doBase(piso?.duracao.concentracaoDuradoura)}>Concentração</Interruptor>
            </Linha>
          )}
          {calc.duracao.sustentado && (
            <Linha rotulo="Sustentado" sub={`Manutenção ${calc.duracao.sustentado.manutencao} PE por Rodada`} custo={C("sustentado")}>
              <Interruptor ligado={f.duracao.concentracaoSustentada} onChange={(v) => sub("duracao", { concentracaoSustentada: v })}
                indisponivel={doBase(piso?.duracao.concentracaoSustentada)}>Concentração</Interruptor>
            </Linha>
          )}
        </Bloco>
      )}
    </>
  );
}

function primeiroLivre(lista) {
  const usados = new Set(lista.filter((x) => x.sentido === "bonus").map((x) => x.efeito));
  return AUX_EFEITOS_ECL.find((x) => !x.indisponivel && !usados.has(x.value))?.value ?? "defesa";
}

function Permuta({ a, onMudar, e }) {
  const lista = a.permuta.contrapartidas;
  return (
    <div className="ecl-item-linha">
      <span className="ecl-rotulo-mini">Permuta</span>
      {lista.map((c) => (
        <span key={c.id} className="inline-flex items-center gap-2">
          <Selecao rotulo="Contrapartida" valor={c.efeito} opcoes={AUX_EFEITOS_ECL.filter((x) => !x.indisponivel)}
            onChange={(v) => onMudar(lista.map((y) => (y.id === c.id ? { ...y, efeito: v } : y)))} />
          <Passo rotulo="Unidades da Contrapartida" valor={c.unidades} onChange={(v) => onMudar(lista.map((y) => (y.id === c.id ? { ...y, unidades: v } : y)))} />
          <button type="button" className="ecl-icone-botao" aria-label="Remover Contrapartida" title="Remover Contrapartida"
            onClick={() => onMudar(lista.filter((y) => y.id !== c.id))}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button type="button" className="ecl-adicionar" onClick={() => onMudar([...lista, { id: novoIdEcl("ctp"), efeito: "deslocamento", unidades: 1, escolha: "" }])}>
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />Contrapartida
      </button>
      {e?.permuta && <span className="ecl-item-valor">+{e.permuta.pontos} Pontos</span>}
    </div>
  );
}
