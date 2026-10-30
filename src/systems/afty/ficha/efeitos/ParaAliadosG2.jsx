/* ============================================================
   G2 · PARA ALIADOS (o lado do suporte)
   ============================================================
   Um acesso discreto dentro de Adicionar, com o leiaute do catálogo: à esquerda
   os pacotes, no meio os efeitos do pacote (ou as fontes para incluir, com
   busca), à direita a opção escolhida com as escolhas e o que o aliado recebe.

   O pacote é um RASCUNHO até Salvar: incluir, tirar e escolher não gravam nada,
   não ligam estado de combate e não gastam recurso. Salvar grava a receita no
   personagem (`creature.pacotesAliados`). Exportar calcula os números AGORA, com
   os atributos e as escolhas deste personagem, e baixa o JSON; a revisão sobe
   só quando o conteúdo mudou.

   A fonte que não dá nada a um aliado agora (Aura 0, Alcance Próprio, Permutativo)
   aparece com o motivo e não vai no arquivo. O que é definido à mão vem marcado
   como tal, separado do que o Afty calcula.
   ============================================================ */
import React, { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronLeft, Copy, Download, PenLine, Plus, Search, Trash2, X } from "lucide-react";
import { comAddons, deriveAfty, ehPlayer } from "./ponte";
import { CANAIS_PACOTE, DURACOES_PACOTE, comPacoteGravado, canalDoPacote, montarArquivo, nomeDoArquivo, novoIdPacote, novoPacoteDoEmissor, pacotesDoEmissor, rotuloFamilia, semPacote } from "../pacotes-aliados";
import { escolhasPadrao, fontesParaAliados, paraArquivo, resolverItem } from "../pacotes-familias";
import { AFTY_PERICIAS } from "../../afty-pericias-catalogo";
import { AFTY_RESISTENCIAS } from "../../afty-schema";
import { TIPOS_DANO } from "../../afty-equipamentos";
import { buscarOrigem } from "./recebidos";
import { baixarJson, semAcento } from "./util";
import { ResumoDaOpcao } from "./PacotesPecas";

const clonar = (x) => JSON.parse(JSON.stringify(x));
/* O que conta como mudança do rascunho: o nome e a receita. A revisão exportada e a data não. */
const conteudo = (p) => JSON.stringify({ nome: p?.nome ?? "", itens: p?.itens ?? [] });
const NOME_ATRIBUTO = [["forca", "Força"], ["destreza", "Destreza"], ["constituicao", "Constituição"], ["inteligencia", "Inteligência"], ["sabedoria", "Sabedoria"], ["presenca", "Presença"]];
/* Os canais que a definição à mão oferece: os do pacote, menos o Alcance (o alvo dele é um escopo de arma, sem seletor fiel aqui). */
const CANAIS_MANUAIS = CANAIS_PACOTE.filter((c) => c.id !== "alcanceArma");
function opcoesDeAlvo(tipo) {
  if (tipo === "pericia") return AFTY_PERICIAS.filter((p) => !p.complementar).map((p) => [p.id, p.nome]);
  if (tipo === "tr") return AFTY_RESISTENCIAS.map((r) => [r.value, r.label]);
  if (tipo === "tipoDano") return Object.entries(TIPOS_DANO);
  if (tipo === "atributo") return NOME_ATRIBUTO;
  if (tipo === "dadoNomeado") return ["d4", "d6", "d8", "d10", "d12"].map((d) => [d, `1${d}`]);
  return [];
}

function Selecao({ rotulo, valor, opcoes, onChange, campo }) {
  return (
    <label className="g-campo"><span>{rotulo}</span>
      <span className="m-select"><select className="afty-campo" value={valor ?? ""} onChange={(e) => onChange(e.target.value)} data-campo={campo}>
        {opcoes.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
      </select><ChevronDown aria-hidden="true" /></span>
    </label>
  );
}

/* ---------------- a definição à mão ---------------- */
function EditorManual({ manual, onMuda }) {
  const [busca, setBusca] = useState(false);
  const achados = manual.regra === "catalogo" && busca && !manual.origemId ? buscarOrigem(manual.origemNome ?? "") : [];
  const ben = manual.beneficios ?? [];
  const mudaBen = (i, patch) => onMuda({ beneficios: ben.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  return (
    <div className="pa-manual" data-editor-manual>
      <label className="g-campo"><span>Nome do Efeito</span>
        <input className="afty-campo" value={manual.nome ?? ""} onChange={(e) => onMuda({ nome: e.target.value })} data-campo="manual-nome" />
      </label>
      <span className="m-seg" role="radiogroup" aria-label="Regra de Acúmulo">
        {[["catalogo", "Habilidade do Catálogo"], ["feitico", "Feitiço"], ["outro", "Outra Origem"]].map(([id, nome]) => (
          <button key={id} type="button" role="radio" className="m-seg-op" aria-checked={manual.regra === id} onClick={() => onMuda({ regra: id, origemId: null })} data-regra={id}>{nome}</button>
        ))}
      </span>
      {manual.regra === "catalogo" && (
        <label className="g-campo g-campo-origem"><span>Origem no Catálogo</span>
          <input className="afty-campo" value={manual.origemNome ?? ""} autoComplete="off" data-campo="manual-origem"
            onChange={(e) => { onMuda({ origemNome: e.target.value, origemId: null }); setBusca(true); }}
            onFocus={() => setBusca(true)} onBlur={() => setTimeout(() => setBusca(false), 150)} />
          {manual.origemId && <span className="g-suave">Do Catálogo</span>}
          {achados.length > 0 && (
            <ul className="g-sugestoes" role="listbox" aria-label="Origens do catálogo">
              {achados.map((x) => (
                <li key={x.id}><button type="button" role="option" aria-selected="false" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onMuda({ origemId: x.id, origemNome: x.nome, nome: manual.nome || x.nome }); setBusca(false); }}>
                  <b>{x.nome}</b><span className="g-suave">{x.rotuloTipo}</span>
                </button></li>
              ))}
            </ul>
          )}
        </label>
      )}
      <div className="g-campo"><span>Benefícios</span>
        {ben.map((b, i) => {
          const c = canalDoPacote(b.canal);
          const alvos = c?.alvo ? opcoesDeAlvo(c.alvo) : [];
          return (
            <div key={i} className="g-beneficio pa-beneficio">
              <span className="m-select"><select className="afty-campo" value={b.canal} aria-label="Valor afetado" data-campo={`manual-canal-${i}`}
                onChange={(e) => mudaBen(i, { canal: e.target.value, alvo: canalDoPacote(e.target.value)?.alvo && !canalDoPacote(e.target.value)?.opcional ? opcoesDeAlvo(canalDoPacote(e.target.value).alvo)[0]?.[0] ?? null : null })}>
                {CANAIS_MANUAIS.map((x) => <option key={x.id} value={x.id}>{x.rotulo}</option>)}
              </select><ChevronDown aria-hidden="true" /></span>
              {alvos.length > 0 && (
                <span className="m-select"><select className="afty-campo" value={b.alvo ?? ""} aria-label="Alvo" data-campo={`manual-alvo-${i}`} onChange={(e) => mudaBen(i, { alvo: e.target.value || null })}>
                  {c.opcional && <option value="">Todos</option>}
                  {alvos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                </select><ChevronDown aria-hidden="true" /></span>
              )}
              <input className="afty-campo m-campo-num" value={b.valor ?? ""} inputMode="decimal" aria-label="Quanto" placeholder="0" data-campo={`manual-valor-${i}`}
                onChange={(e) => mudaBen(i, { valor: e.target.value.replace(/[^\d.,-]/g, "").replace(",", ".") })} />
              <label className="g-presumir"><input type="checkbox" checked={b.quando === "em_combate"} onChange={(e) => mudaBen(i, { quando: e.target.checked ? "em_combate" : null })} /> Só em Combate</label>
              {ben.length > 1 && <button type="button" className="g-icone" onClick={() => onMuda({ beneficios: ben.filter((_, j) => j !== i) })} aria-label="Tirar este valor"><X aria-hidden="true" /></button>}
            </div>
          );
        })}
        <button type="button" className="g-link" onClick={() => onMuda({ beneficios: [...ben, { canal: "defesa", valor: "" }] })}>Outro Valor</button>
      </div>
      <Selecao rotulo="Prazo" valor={manual.duracao} opcoes={DURACOES_PACOTE.map((d) => [d.id, d.rotulo])} onChange={(v) => onMuda({ duracao: v })} campo="manual-duracao" />
      {manual.duracao === "rodadas" && (
        <label className="g-campo g-campo-curto"><span>Rodadas</span>
          <input className="afty-campo m-campo-num" value={manual.rodadas ?? ""} inputMode="numeric" onChange={(e) => onMuda({ rodadas: e.target.value.replace(/[^\d]/g, "") })} data-campo="manual-rodadas" />
        </label>
      )}
      <label className="g-campo"><span>Condição de Mesa</span>
        <input className="afty-campo" value={manual.condicao ?? ""} onChange={(e) => onMuda({ condicao: e.target.value })} data-campo="manual-condicao" />
      </label>
      <label className="g-campo"><span>Custo do Emissor</span>
        <input className="afty-campo" value={manual.custo ?? ""} onChange={(e) => onMuda({ custo: e.target.value })} data-campo="manual-custo" />
      </label>
    </div>
  );
}

const MANUAL_NOVO = () => ({ nome: "", regra: "catalogo", origemId: null, origemNome: "", beneficios: [{ canal: "defesa", valor: "" }], duracao: "rodadas", rodadas: "1", condicao: "", custo: "" });

export default function ParaAliadosG2({ m, topo }) {
  const ficha = m.ficha;
  const conjunto = m.pacotesEmissor;
  const podeGravar = !!m.gravarPacotesAliados;
  /* O derive SEM sessão: os números permanentes do suporte. Um estado ligado agora não muda o pacote. */
  const base = useMemo(() => comAddons(ficha, () => {
    const d = deriveAfty(ficha);
    return { d, ...fontesParaAliados(ficha, d, { emissorId: conjunto.emissorId }) };
  }), [ficha, conjunto.emissorId]);
  const resolver = useCallback((item) => comAddons(ficha, () => resolverItem(item, base.porChave)), [ficha, base]);

  const [pacoteId, setPacoteId] = useState(() => conjunto.pacotes[0]?.id ?? null);
  const salvo = conjunto.pacotes.find((p) => p.id === pacoteId) ?? null;
  const [rascunho, setRascunho] = useState(() => (salvo ? clonar(salvo) : null));
  const [modo, setModo] = useState("itens");
  const [sel, setSel] = useState(null);
  const [termo, setTermo] = useState("");
  const [saida, setSaida] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const exportando = useRef(0);
  const sujo = !!rascunho && (!salvo || conteudo(rascunho) !== conteudo(salvo));

  const muda = (fn) => { setRascunho((r) => ({ ...r, ...fn(r) })); setSaida(null); };
  const abrir = (id) => {
    if (sujo) return;
    const p = conjunto.pacotes.find((x) => x.id === id);
    setPacoteId(id); setRascunho(p ? clonar(p) : null); setModo("itens"); setSel(null); setSaida(null); setExcluindo(false);
  };
  const novo = () => {
    if (sujo) return;
    const p = novoPacoteDoEmissor("Apoio do Grupo");
    setPacoteId(p.id); setRascunho(p); setModo("fontes"); setSel(null); setSaida(null); setExcluindo(false);
  };
  const incluir = (fonte) => {
    const item = { id: novoIdPacote("op"), fonte: fonte.chave, escolhas: escolhasPadrao(fonte) };
    muda((r) => ({ itens: [...r.itens, item] }));
  };
  const incluirManual = () => {
    const item = { id: novoIdPacote("op"), fonte: "manual", escolhas: {}, manual: MANUAL_NOVO() };
    muda((r) => ({ itens: [...r.itens, item] }));
    setModo("itens"); setSel(item.id);
  };
  const tirar = (id) => { muda((r) => ({ itens: r.itens.filter((i) => i.id !== id) })); if (sel === id) setSel(null); };
  const mudaItem = (id, patch) => muda((r) => ({ itens: r.itens.map((i) => (i.id === id ? patch(i) : i)) }));
  const descartar = () => { setRascunho(salvo ? clonar(salvo) : null); if (!salvo) setPacoteId(conjunto.pacotes[0]?.id ?? null); setSel(null); setSaida(null); };
  const salvar = () => {
    if (!podeGravar || !rascunho || !sujo) return;
    const agora = new Date().toISOString();
    const nome = rascunho.nome.trim() || "Pacote Sem Nome";
    m.gravarPacotesAliados((atual) => {
      const c = pacotesDoEmissor({ pacotesAliados: atual });
      const antes = c.pacotes.find((p) => p.id === rascunho.id);
      return comPacoteGravado(c, { ...rascunho, nome, exportado: antes?.exportado ?? null }, agora);
    });
    setSaida({ tom: "ok", texto: "Pacote Salvo na Ficha" });
  };
  const exportar = () => {
    if (!salvo || sujo || !podeGravar || !conjunto.emissorId) return;
    if (Date.now() - exportando.current < 400) return;
    exportando.current = Date.now();
    const resolvidos = salvo.itens.map((it) => ({ it, r: resolver(it) }));
    const vai = resolvidos.filter(({ r }) => !r.indisponivel && !r.bloqueio && (r.beneficios.length || r.consulta.length));
    const pulados = resolvidos.filter((x) => !vai.includes(x)).map(({ it, r }) => `${r.nome ?? it.fonte}: ${r.indisponivel ?? r.bloqueio ?? "Sem Benefício"}`);
    if (!vai.length) { setSaida({ tom: "atencao", texto: "Nenhum Efeito Exportável", pulados }); return; }
    const agora = new Date().toISOString();
    const r = montarArquivo({
      pacote: salvo, emissorId: conjunto.emissorId,
      emissor: { nome: ficha.name, sistema: ehPlayer(ficha) ? "player" : "afty" },
      opcoes: vai.map(({ it, r: x }) => paraArquivo(it.id, x)), agora,
    });
    if (r.pacote !== salvo) {
      m.gravarPacotesAliados((atual) => {
        const c = pacotesDoEmissor({ pacotesAliados: atual });
        return { ...c, emissorId: c.emissorId ?? conjunto.emissorId, pacotes: c.pacotes.map((x) => (x.id === salvo.id ? { ...x, exportado: r.pacote.exportado } : x)) };
      });
    }
    baixarJson(nomeDoArquivo(r.arquivo), r.arquivo);
    setSaida({ tom: "ok", texto: `Exportado: Revisão ${r.arquivo.pacote.revisao} · ${r.arquivo.opcoes.length} ${r.arquivo.opcoes.length === 1 ? "Efeito" : "Efeitos"}`, pulados, arquivo: r.arquivo });
  };
  const excluir = () => {
    if (!salvo || !podeGravar) return;
    if (!excluindo) { setExcluindo(true); return; }
    m.gravarPacotesAliados((atual) => semPacote(pacotesDoEmissor({ pacotesAliados: atual }), salvo.id));
    const proximo = conjunto.pacotes.find((p) => p.id !== salvo.id) ?? null;
    setPacoteId(proximo?.id ?? null); setRascunho(proximo ? clonar(proximo) : null); setSel(null); setExcluindo(false);
    setSaida({ tom: "ok", texto: "Pacote Excluído" });
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(saida.arquivo)); setSaida((s) => ({ ...s, copiado: true })); } catch { setSaida((s) => ({ ...s, copiado: false })); }
  };

  /* ---------- as fontes, com busca ---------- */
  const t = semAcento(termo).trim();
  const fontes = base.fontes.filter((f) => !t || semAcento(`${f.nome} ${f.grupo} ${rotuloFamilia(f.familia)}`).includes(t));
  const grupos = [];
  for (const f of fontes) {
    let gr = grupos.find((x) => x.nome === f.grupo);
    if (!gr) { gr = { nome: f.grupo, itens: [] }; grupos.push(gr); }
    gr.itens.push(f);
  }
  const vezesNoPacote = (chave) => (rascunho?.itens ?? []).filter((i) => i.fonte === chave).length;
  /* O que cada fonte daria AGORA, com as escolhas padrão: a que não dá nada a um aliado (Alcance Próprio, Aura 0) não se inclui, e diz por quê. */
  const bloqueios = useMemo(() => new Map(base.fontes.map((f) => [f.chave, comAddons(ficha, () => f.resolver(escolhasPadrao(f))).bloqueio ?? null])), [ficha, base]);

  /* ---------- o detalhe ---------- */
  const itemSel = modo === "itens" ? rascunho?.itens.find((i) => i.id === sel) ?? null : null;
  const fonteSel = modo === "fontes" ? base.porChave.get(sel) ?? null : null;
  let detalhe = <div />;
  if (itemSel) {
    const r = resolver(itemSel);
    const fonte = base.porChave.get(itemSel.fonte);
    detalhe = (
      <article className="k-detalhe" aria-label={r.nome ?? "Efeito"} data-detalhe-item={itemSel.id}>
        <div className="x-cartao-topo">
          <div><h2 className="x-cartao-nome">{r.nome ?? "Efeito"}</h2>
            <p className="x-cartao-meta"><span>{rotuloFamilia(r.familia ?? (itemSel.fonte === "manual" ? "manual" : null))}</span><span>{itemSel.fonte === "manual" ? "Definido à Mão" : "Cálculo Automático"}</span></p></div>
          <span className="x-cartao-acoes"><button type="button" className="e-icone" aria-label="Fechar o efeito" onClick={() => setSel(null)}><X aria-hidden="true" /></button></span>
        </div>
        {(fonte?.escolhas ?? []).map((e) => (
          <Selecao key={e.id} rotulo={e.rotulo} valor={itemSel.escolhas?.[e.id] ?? e.padrao} opcoes={e.opcoes.map((o) => [o.id, o.rotulo])} campo={`escolha-${e.id}`}
            onChange={(v) => mudaItem(itemSel.id, (i) => ({ ...i, escolhas: { ...i.escolhas, [e.id]: v } }))} />
        ))}
        {itemSel.fonte === "manual" && <EditorManual manual={itemSel.manual ?? MANUAL_NOVO()} onMuda={(patch) => mudaItem(itemSel.id, (i) => ({ ...i, manual: { ...i.manual, ...patch } }))} />}
        {r.indisponivel ? <span className="x-atencao"><AlertTriangle aria-hidden="true" />{r.indisponivel}</span> : <ResumoDaOpcao o={r} papel="emissor" />}
        <span className="x-linha"><button type="button" className="m-botao" onClick={() => tirar(itemSel.id)} data-tirar-item><Trash2 aria-hidden="true" />Tirar do Pacote</button></span>
      </article>
    );
  } else if (fonteSel) {
    const r = resolver({ fonte: fonteSel.chave, escolhas: escolhasPadrao(fonteSel) });
    const n = vezesNoPacote(fonteSel.chave);
    detalhe = (
      <article className="k-detalhe" aria-label={fonteSel.nome} data-detalhe-fonte={fonteSel.chave}>
        <div className="x-cartao-topo">
          <div><h2 className="x-cartao-nome">{r.nome}</h2><p className="x-cartao-meta"><span>{rotuloFamilia(fonteSel.familia)}</span><span>{fonteSel.grupo}</span>{n > 0 && <span>No Pacote</span>}</p></div>
          <span className="x-cartao-acoes"><button type="button" className="e-icone" aria-label="Fechar a fonte" onClick={() => setSel(null)}><X aria-hidden="true" /></button></span>
        </div>
        <ResumoDaOpcao o={r} papel="emissor" />
        {!r.bloqueio && <span className="x-linha"><button type="button" className="m-botao x-adicionar g2-primario" onClick={() => incluir(fonteSel)} data-incluir-fonte={fonteSel.chave}><Plus aria-hidden="true" />{n ? "Incluir de Novo" : "Incluir no Pacote"}</button></span>}
      </article>
    );
  }

  /* ---------- a lista do meio ---------- */
  let meio;
  if (!rascunho) {
    meio = <p className="x-mesa">Nenhum Pacote</p>;
  } else if (modo === "fontes") {
    meio = (
      <>
        <div className="pa-cabeca"><button type="button" className="m-botao" onClick={() => { setModo("itens"); setSel(null); }} data-voltar-pacote><ChevronLeft aria-hidden="true" />{rascunho.nome || "Pacote"}</button></div>
        <label className="e-busca k-busca pa-busca">
          <Search aria-hidden="true" />
          <input className="afty-campo" type="search" value={termo} placeholder="Buscar pelo nome ou pela família" aria-label="Buscar fontes" onChange={(e) => setTermo(e.target.value)} data-busca-fontes />
          {termo && <button type="button" className="e-limpar" onClick={() => setTermo("")} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
        </label>
        {!fontes.length && <p className="x-mesa">Nenhuma Fonte para Aliados</p>}
        {grupos.map((gr) => (
          <React.Fragment key={gr.nome}>
            <h3 className="k-grupo">{gr.nome}<small>{gr.itens.length}</small></h3>
            {gr.itens.map((f) => {
              const n = vezesNoPacote(f.chave);
              const bloqueio = bloqueios.get(f.chave);
              return (
                <div key={f.chave} className="k-fila" aria-current={sel === f.chave} data-fonte={f.chave} data-bloqueada={bloqueio ? "" : undefined}>
                  <button type="button" className="k-item" title={f.nome} onClick={() => setSel(sel === f.chave ? null : f.chave)}>
                    <span className="k-nome"><span className="k-texto">{f.nome}</span>{bloqueio && <span className="pa-problema" title={bloqueio}><AlertTriangle aria-hidden="true" /></span>}</span>
                  </button>
                  {bloqueio
                    ? <span className="k-acao" data-largo="" data-tom="consulta" title={bloqueio}><span className="k-acao-texto">Sem Efeito</span><span className="k-acao-seta" /></span>
                    : (
                      <button type="button" className="k-acao" data-largo="" data-tom={n ? "ativo" : "ativar"} aria-label={`Incluir ${f.nome}`} onClick={() => incluir(f)}>
                        <span className="k-acao-texto">{n ? "Incluído" : "Incluir"}</span><span className="k-acao-seta">{n ? <Check aria-hidden="true" /> : null}</span>
                      </button>
                    )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
        <h3 className="k-grupo">Outras Famílias</h3>
        <div className="k-fila" data-fonte="manual">
          <button type="button" className="k-item" onClick={incluirManual}><span className="k-nome"><PenLine aria-hidden="true" className="pa-icone" /><span className="k-texto">Definir à Mão</span></span></button>
          <button type="button" className="k-acao" data-tom="ativar" aria-label="Definir um efeito à mão" onClick={incluirManual}><span className="k-acao-texto">Incluir</span><span className="k-acao-seta" /></button>
        </div>
      </>
    );
  } else {
    meio = (
      <>
        <div className="pa-cabeca">
          <input className="afty-campo pa-nome" value={rascunho.nome} aria-label="Nome do Pacote" data-campo="nome-pacote" onChange={(e) => { const v = e.target.value; muda(() => ({ nome: v })); }} />
          <span className="x-mesa" data-revisao>{salvo?.exportado ? `Revisão ${salvo.exportado.revisao}` : "Não Exportado"}</span>
        </div>
        <h3 className="k-titulo-lista">{rascunho.itens.length} {rascunho.itens.length === 1 ? "Efeito" : "Efeitos"}</h3>
        {rascunho.itens.map((it) => {
          const r = resolver(it);
          const problema = r.indisponivel ?? r.bloqueio;
          return (
            <div key={it.id} className="k-fila" aria-current={sel === it.id} data-item={it.id}>
              <button type="button" className="k-item" title={r.nome ?? it.fonte} onClick={() => setSel(sel === it.id ? null : it.id)}>
                <span className="k-nome">
                  {it.fonte === "manual" && <PenLine aria-hidden="true" className="pa-icone" />}
                  <span className="k-texto">{r.nome ?? it.fonte}</span>
                  {problema && <span className="pa-problema" title={problema}><AlertTriangle aria-hidden="true" /></span>}
                </span>
              </button>
              <button type="button" className="k-acao" aria-label={`Tirar ${r.nome ?? "efeito"} do pacote`} onClick={() => tirar(it.id)}><span className="k-acao-texto">Tirar</span><span className="k-acao-seta" /></button>
            </div>
          );
        })}
        <span className="x-linha pa-acoes">
          <button type="button" className="m-botao x-adicionar" onClick={() => { setModo("fontes"); setSel(null); }} data-adicionar-efeito><Plus aria-hidden="true" />Adicionar Efeito</button>
        </span>
        <div className="pa-rodape">
          <button type="button" className="g-botao" data-primaria="sim" disabled={!sujo || !podeGravar} onClick={salvar} data-salvar-pacote>Salvar</button>
          {sujo && <button type="button" className="g-botao" onClick={descartar} data-descartar-pacote>Descartar</button>}
          <button type="button" className="g-botao" disabled={sujo || !salvo || !podeGravar} title={sujo ? "Salve Antes de Exportar" : undefined} onClick={exportar} data-exportar-pacote><Download aria-hidden="true" />Exportar</button>
          {salvo && <button type="button" className="g-link pa-excluir" onClick={excluir} data-excluir-pacote>{excluindo ? "Confirmar Exclusão" : "Excluir Pacote"}</button>}
        </div>
        {!podeGravar && <span className="x-mesa">Esta Ficha Não Grava Pacotes Aqui</span>}
        {saida && (
          <div className="g-resultado" role="status" data-tom={saida.tom === "atencao" ? "nada" : undefined} data-saida-pacote>
            <span className="g-resultado-verbo">{saida.tom === "atencao" ? <AlertTriangle aria-hidden="true" /> : <Check aria-hidden="true" />}{saida.texto}</span>
            {saida.arquivo && <button type="button" className="g-link" onClick={copiar} data-copiar-json><Copy aria-hidden="true" />{saida.copiado ? "Copiado" : "Copiar JSON"}</button>}
            {(saida.pulados ?? []).map((p) => <span key={p} className="x-mesa">Fora do Arquivo: {p}</span>)}
            <button type="button" className="g-x" onClick={() => setSaida(null)} aria-label="Fechar o resultado"><X aria-hidden="true" /></button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="k-catalogo" data-aba="aliados" data-para-aliados>
      {topo}
      <div className="k-corpo">
        <nav className="k-trilho" aria-label="Pacotes">
          {conjunto.pacotes.map((p) => (
            <button key={p.id} type="button" className="k-cat" aria-current={p.id === pacoteId} disabled={sujo && p.id !== pacoteId} title={sujo && p.id !== pacoteId ? "Salve ou Descarte Antes" : undefined}
              onClick={() => abrir(p.id)} data-pacote={p.id}>
              <span>{p.nome}</span><small>{p.itens.length}</small>
            </button>
          ))}
          {rascunho && !salvo && <button type="button" className="k-cat" aria-current="true" data-pacote-novo><span>{rascunho.nome || "Novo Pacote"}</span><small>Novo</small></button>}
          <span className="k-sep" aria-hidden="true" />
          <button type="button" className="k-cat" onClick={novo} disabled={sujo} title={sujo ? "Salve ou Descarte Antes" : undefined} data-novo-pacote><Plus aria-hidden="true" /><span>Novo Pacote</span></button>
        </nav>
        <section className="k-lista" aria-label={rascunho?.nome ?? "Pacote"} data-lista-pacote>{meio}</section>
        {detalhe}
      </div>
    </div>
  );
}
