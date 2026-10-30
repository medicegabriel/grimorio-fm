/* ============================================================
   G2 · RECEBIDOS (o lado do aliado, dentro de Fonte Externa)
   ============================================================
   A biblioteca de pacotes que este personagem recebeu, por emissor: cada opção
   numa linha de 44 px, com Ativar ou Ativo à direita, e o detalhe ao lado (o que
   ela dá, a prévia na ficha, o prazo, as condições e o custo de quem emite).

   IMPORTAR confere o arquivo inteiro antes de gravar e mostra o resumo: o pacote,
   o emissor, a revisão, o que entra e o que fica de fora com o motivo. Salvar
   grava na biblioteca do personagem e não ativa nada, não cobra PE, não cria PV
   temporário nem inicia prazo. Cancelar não deixa nada.

   ATIVAR cria uma instância na sessão (`gestor.acoes.ativarRecebido`), com o
   prazo contado a partir de agora. Encerrar ou expirar tira a instância, e a
   opção continua aqui. O Registrar Manualmente de sempre segue a um clique.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, PenLine, Power, Search, Upload, X } from "lucide-react";
import { comAddons } from "./ponte";
import { compararTudo, ordenarConsequencias } from "./efeitos-dados";
import { fraseDoBeneficio, prepararCalculo, textoDoRecebido } from "./recebidos";
import { semPvTemp } from "./gestor-logica";
import { Numeros, RegistroExterno } from "./Gestor";
import { ResultadoG2 } from "./PecasG2";
import { ResumoDaOpcao } from "./PacotesPecas";
import { semAcento } from "./util";
import {
  LIMITES_PACOTE, beneficiosComPrazoEfetivo, bibliotecaDaFicha, compararComBiblioteca, gravarNaBiblioteca, instanciaAtivaDe, instanciaDaOpcao,
  lerArquivoDePacote, opcaoAtivavel, rotuloFamilia, tirarDaBiblioteca,
} from "../pacotes-aliados";
import { conhecidosDaFicha } from "../pacotes-familias";

const ESTADO_IMPORTACAO = {
  novo: "Pacote Novo",
  revisao: "Nova Revisão",
  igual: "Já Está na Biblioteca",
  antiga: "Revisão Mais Antiga que a Salva",
  diferente: "Mesma Revisão com Conteúdo Diferente",
};

/* ---------------- uma opção recebida, em detalhe ---------------- */
export function DetalheRecebido({ o, g, m, onFechar }) {
  const { entrada, opcao } = o.pacoteRecebido;
  const ativo = instanciaAtivaDe(m.sessao, entrada.chave, opcao.id);
  const ativavel = opcaoAtivavel(opcao);
  const outra = opcao.acumulo?.regra === "outro";
  const [presumir, setPresumir] = useState(false);
  /* A prévia: a MESMA conta da ficha, com a instância candidata dentro. É um derive, e por isso roda DEPOIS de pintar a escolha (fora do
     clique): a linha escolhida aparece na hora, e os números chegam logo depois. Ativar não depende dela. */
  /* A prévia vale para as entradas com que foi calculada (`de`): com outras, ela some até a conta nova chegar. */
  const entradas = useMemo(() => ({ entrada, opcao, presumir, ficha: m.ficha, sessao: m.sessao, derived: m.derived }), [entrada, opcao, presumir, m.ficha, m.sessao, m.derived]);
  const [calculada, setCalculada] = useState(null);
  useEffect(() => {
    if (!ativavel || ativo) return undefined;
    let vivo = true;
    const t = setTimeout(() => {
      const candidato = instanciaDaOpcao(entradas.entrada, entradas.opcao, { id: "previa_recebido", somaPresumida: entradas.presumir });
      const calc = prepararCalculo(entradas.ficha, { ...entradas.sessao, buffs: [...(entradas.sessao.buffs ?? []), candidato] });
      if (vivo) setCalculada({ de: entradas, chips: semPvTemp(ordenarConsequencias(compararTudo(calc.derived, entradas.derived))), analise: calc.analise.previa_recebido ?? {} });
    }, 0);
    return () => { vivo = false; clearTimeout(t); };
  }, [entradas, ativavel, ativo]);
  const previa = ativavel && !ativo && calculada?.de === entradas ? calculada : null;
  const r = g.resultado;
  const cartao = ativo ? g.ativos.find((a) => a.chave === `rec:${ativo.id}`) : null;
  const meta = [rotuloFamilia(opcao.familia), `De ${entrada.emissor.nome}`, opcao.calculo === "manual" ? "Definido à Mão" : null, ativo ? "Ativo" : null].filter(Boolean);
  return (
    <article className="k-detalhe" aria-label={opcao.nome} data-detalhe-recebido={o.chave}>
      <div className="x-cartao-topo">
        <div><h2 className="x-cartao-nome">{opcao.nome}</h2>
          <p className="x-cartao-meta">{meta.map((t) => <span key={t}>{t}</span>)}</p>
          {opcao.escolhas.length > 0 && <p className="x-cartao-meta">{opcao.escolhas.map((e) => <span key={e.rotulo}>{e.rotulo}: {e.valor}</span>)}</p>}
        </div>
        {onFechar && <span className="x-cartao-acoes"><button type="button" className="e-icone" aria-label="Fechar a opção" onClick={onFechar}><X aria-hidden="true" /></button></span>}
      </div>
      <ResumoDaOpcao o={opcao} papel="aliado" />
      {previa && (
        <div className="g-previa" aria-live="polite" data-previa-recebido>
          <span className="g-rotulo">Se Ativar</span>
          <ul className="g-frases">{Object.entries(previa.analise).map(([k, x]) => { const f = fraseDoBeneficio(k, x); return f && <li key={k} data-tom={f.tom}>{f.texto}</li>; })}</ul>
          {previa.chips.length > 0 ? <Numeros chips={previa.chips} destaque /> : <span className="g-suave">Nenhum dos Seus Números Muda Agora</span>}
          {outra && <label className="g-presumir"><input type="checkbox" checked={presumir} onChange={(e) => setPresumir(e.target.checked)} data-campo="presumir-recebido" /> Somar Mesmo Assim</label>}
        </div>
      )}
      <div className="k-confirmar">
        {ativo ? (
          <span className="x-linha">
            <button type="button" className="m-botao x-adicionar g2-primario" onClick={() => g.irAoAtivo(o.chave)} data-abrir-ativo><ChevronRight aria-hidden="true" />Abrir nos Ativos</button>
            {cartao && <button type="button" className="m-botao" onClick={() => g.acoes.encerrar(cartao)} data-encerrar-recebido><Power aria-hidden="true" />Encerrar</button>}
          </span>
        ) : ativavel ? (
          <span className="x-linha"><button type="button" className="m-botao x-adicionar g2-primario" onClick={() => g.acoes.ativarRecebido(o, { somaPresumida: presumir })} data-ativar-recebido={o.chave}>Ativar</button></span>
        ) : <span className="x-mesa">Só Consulta</span>}
      </div>
      {r && r.alvo === o.chave && <ResultadoG2 r={r} g={g} m={m} />}
    </article>
  );
}

/* ---------------- a linha de uma opção ---------------- */
function LinhaRecebida({ o, g, m, atual, aoEscolher }) {
  const { entrada, opcao } = o.pacoteRecebido;
  const ativo = instanciaAtivaDe(m.sessao, entrada.chave, opcao.id);
  return (
    <div className="k-fila" aria-current={atual} data-chave-opcao={o.chave}>
      <button type="button" className="k-item" title={opcao.nome} aria-current={atual} onClick={aoEscolher}>
        <span className="k-nome">{opcao.calculo === "manual" && <PenLine aria-hidden="true" className="pa-icone" />}<span className="k-texto">{opcao.nome}</span></span>
      </button>
      {ativo ? (
        <button type="button" className="k-acao" data-tom="ativo" aria-label={`Abrir ${opcao.nome} nos Ativos`} onClick={() => g.irAoAtivo(o.chave)}>
          <span className="k-acao-texto">Ativo</span><span className="k-acao-seta"><ChevronRight aria-hidden="true" /></span>
        </button>
      ) : opcaoAtivavel(opcao) ? (
        <button type="button" className="k-acao" data-tom="ativar" aria-label={`Ativar ${opcao.nome}`} onClick={aoEscolher}>
          <span className="k-acao-texto">Ativar</span><span className="k-acao-seta" aria-hidden="true" />
        </button>
      ) : <span className="k-acao" data-largo="" data-tom="consulta"><span className="k-acao-texto">Consulta</span><span className="k-acao-seta" /></span>}
    </div>
  );
}

/* ---------------- importar ---------------- */
function ImportarPacote({ m, onGravado, onCancelar }) {
  const [texto, setTexto] = useState("");
  const [lido, setLido] = useState(null);
  const arquivo = useRef(null);
  const gravando = useRef(false);
  const ler = (t) => setLido(comAddons(m.ficha, () => lerArquivoDePacote(t, { conhecidos: conhecidosDaFicha() })));
  const aoArquivo = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    /* O resumo do arquivo anterior sai na hora: nada de conferir um e salvar outro. */
    setLido(null);
    gravando.current = false;
    if (f.size > LIMITES_PACOTE.bytes) { setLido({ ok: false, erro: "Arquivo Grande Demais" }); return; }
    ler(await f.text());
  };
  const comp = lido?.ok ? compararComBiblioteca(m.biblioteca, lido.pacote) : null;
  const podeGravar = !!m.gravarRecebidos && !!comp && !["igual", "antiga"].includes(comp.estado);
  const salvar = () => {
    if (!podeGravar || gravando.current) return;
    gravando.current = true;
    const agora = new Date().toISOString();
    m.gravarRecebidos((atual) => {
      const r = gravarNaBiblioteca(bibliotecaDaFicha({ pacotesRecebidos: atual }), lido.pacote, lido.recusadas, agora);
      return r.gravou ? r.biblioteca : atual;
    });
    onGravado(lido.pacote.chave, comp.estado);
  };
  const nomesDe = (ids, opcoes) => ids.map((id) => opcoes.find((o) => o.id === id)?.nome ?? id);
  return (
    <div className="pa-importar" data-importar-pacote>
      <h3 className="k-titulo-lista">Importar Pacote</h3>
      <span className="x-linha">
        <button type="button" className="m-botao" onClick={() => arquivo.current?.click()} data-escolher-arquivo><Upload aria-hidden="true" />Escolher Arquivo</button>
        <input ref={arquivo} type="file" accept=".json,application/json" hidden onChange={aoArquivo} data-arquivo-pacote />
      </span>
      <label className="g-campo"><span>Ou Cole o JSON</span>
        <textarea className="afty-campo pa-colar" value={texto} rows={4} onChange={(e) => { setTexto(e.target.value); setLido(null); }} data-colar-pacote />
      </label>
      {texto.trim() && !lido && <span className="x-linha"><button type="button" className="m-botao" onClick={() => ler(texto)} data-conferir-pacote>Conferir</button></span>}
      {lido && !lido.ok && (
        <div className="x-atencao-bloco" data-importacao-recusada>
          <span className="x-atencao"><AlertTriangle aria-hidden="true" />{lido.erro}</span>
          {(lido.recusadas ?? []).map((x, i) => <span key={i} className="x-mesa">{x.nome}: {x.motivo}</span>)}
        </div>
      )}
      {lido?.ok && (
        <div className="g-previa" data-resumo-importacao data-estado={comp.estado}>
          <span className="g-rotulo">{ESTADO_IMPORTACAO[comp.estado]}{comp.estado === "revisao" ? `: ${comp.anterior.revisao} para ${lido.pacote.revisao}` : ""}</span>
          <span className="x-texto"><b>{lido.pacote.nome}</b> · De {lido.pacote.emissor.nome} · Revisão {lido.pacote.revisao}</span>
          <ul className="g-frases" data-opcoes-importadas>
            {lido.pacote.opcoes.map((o) => <li key={o.id}><b>{o.nome}</b> {o.beneficios.length ? beneficiosComPrazoEfetivo(o).map(textoDoRecebido).join(", ") : "Só Consulta"}</li>)}
          </ul>
          {comp.anterior && comp.estado !== "igual" && (
            <span className="x-mesa" data-mudancas>
              {[comp.novas.length ? `Novas: ${nomesDe(comp.novas, lido.pacote.opcoes).join(", ")}` : null,
                comp.removidas.length ? `Saem: ${nomesDe(comp.removidas, comp.anterior.opcoes).join(", ")}` : null,
                comp.alteradas.length ? `Mudam: ${nomesDe(comp.alteradas, lido.pacote.opcoes).join(", ")}` : null].filter(Boolean).join(" · ") || "Sem Mudança nas Opções"}
            </span>
          )}
          {lido.recusadas.length > 0 && (
            <ul className="g-frases" data-opcoes-recusadas>{lido.recusadas.map((x, i) => <li key={i} data-tom="atencao">Fora: {x.nome}, {x.motivo}</li>)}</ul>
          )}
        </div>
      )}
      <div className="pa-rodape">
        <button type="button" className="g-botao" data-primaria="sim" disabled={!podeGravar} onClick={salvar} data-salvar-importacao>Salvar na Ficha</button>
        <button type="button" className="g-botao" onClick={onCancelar} data-cancelar-importacao>Cancelar</button>
      </div>
      {!m.gravarRecebidos && <span className="x-mesa">Esta Ficha Não Grava a Biblioteca Aqui</span>}
    </div>
  );
}

/* ---------------- a aba Fonte Externa ---------------- */
export default function RecebidosG2({ g, m, topo, onFechar }) {
  const bib = m.biblioteca;
  /* Sem pacote recebido, a aba abre no Registrar de sempre (o fluxo manual não ganha um clique a mais). */
  const [vista, setVista] = useState(() => (bib.length ? "recebidos" : "registrar"));
  const [filtro, setFiltro] = useState(null);
  const [sel, setSel] = useState(null);
  const [termo, setTermo] = useState("");
  const [removendo, setRemovendo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const recebidas = useMemo(() => g.opcoes.filter((o) => o.como === "recebido"), [g.opcoes]);
  const t = semAcento(termo).trim();
  const itens = recebidas.filter((o) => (!filtro || o.pacoteRecebido.entrada.chave === filtro) && (!t || o.busca.includes(t)));
  const entradaFiltro = filtro ? bib.find((x) => x.chave === filtro) ?? null : null;
  const o = sel ? recebidas.find((x) => x.chave === sel) ?? null : null;
  const emissores = [];
  for (const e of bib) {
    let em = emissores.find((x) => x.id === e.emissor.id);
    if (!em) { em = { id: e.emissor.id, nome: e.emissor.nome, entradas: [] }; emissores.push(em); }
    em.entradas.push(e);
  }
  const remover = () => {
    if (!entradaFiltro || !m.gravarRecebidos) return;
    if (!removendo) { setRemovendo(true); return; }
    m.gravarRecebidos((atual) => tirarDaBiblioteca(bibliotecaDaFicha({ pacotesRecebidos: atual }), entradaFiltro.chave));
    setAviso(`${entradaFiltro.nome} Saiu da Biblioteca`);
    setFiltro(null); setSel(null); setRemovendo(false);
  };
  const ir = (v, f = null) => { setVista(v); setFiltro(f); setSel(null); setRemovendo(false); setAviso(null); };

  let meio;
  if (vista === "importar") {
    meio = <ImportarPacote m={m} onCancelar={() => ir(bib.length ? "recebidos" : "registrar")}
      onGravado={(chave, estado) => { ir("recebidos", chave); setAviso(estado === "revisao" ? "Revisão Salva na Biblioteca" : "Pacote Salvo na Biblioteca"); }} />;
  } else if (vista === "registrar") {
    meio = <div className="k-externa"><RegistroExterno g={g} m={m} onFechar={() => (bib.length ? ir("recebidos") : onFechar())} /></div>;
  } else {
    const porEntrada = [];
    for (const x of itens) {
      let gr = porEntrada.find((y) => y.entrada.chave === x.pacoteRecebido.entrada.chave);
      if (!gr) { gr = { entrada: x.pacoteRecebido.entrada, itens: [] }; porEntrada.push(gr); }
      gr.itens.push(x);
    }
    meio = (
      <>
        <label className="e-busca k-busca pa-busca">
          <Search aria-hidden="true" />
          <input className="afty-campo" type="search" value={termo} placeholder="Buscar nos Recebidos" aria-label="Buscar nos Recebidos" onChange={(e) => setTermo(e.target.value)} data-busca-recebidos />
          {termo && <button type="button" className="e-limpar" onClick={() => setTermo("")} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
        </label>
        {aviso && <div className="g-resultado" role="status" data-aviso-recebidos><span className="g-resultado-verbo">{aviso}</span><button type="button" className="g-x" onClick={() => setAviso(null)} aria-label="Fechar o aviso"><X aria-hidden="true" /></button></div>}
        {entradaFiltro && (
          <div className="pa-cabeca" data-entrada={entradaFiltro.chave}>
            <span className="x-texto"><b>{entradaFiltro.nome}</b> · De {entradaFiltro.emissor.nome} · Revisão {entradaFiltro.revisao}</span>
            <button type="button" className="g-link pa-excluir" onClick={remover} disabled={!m.gravarRecebidos} data-remover-pacote>{removendo ? "Confirmar Remoção" : "Remover da Biblioteca"}</button>
          </div>
        )}
        {entradaFiltro?.recusadas?.length > 0 && <ul className="g-frases">{entradaFiltro.recusadas.map((x, i) => <li key={i} data-tom="atencao">Fora: {x.nome}, {x.motivo}</li>)}</ul>}
        {!bib.length && <p className="x-mesa">Nenhum Pacote Recebido</p>}
        {bib.length > 0 && !itens.length && <p className="x-mesa">Nenhuma Opção</p>}
        {porEntrada.map((gr) => (
          <React.Fragment key={gr.entrada.chave}>
            {!filtro && <h3 className="k-grupo">{gr.entrada.nome}<small>De {gr.entrada.emissor.nome}</small></h3>}
            {gr.itens.map((x) => <LinhaRecebida key={x.chave} o={x} g={g} m={m} atual={sel === x.chave} aoEscolher={() => setSel(sel === x.chave ? null : x.chave)} />)}
          </React.Fragment>
        ))}
      </>
    );
  }
  return (
    <div className="k-catalogo" data-aba="externa" data-recebidos>
      {topo}
      <div className="k-corpo">
        <nav className="k-trilho" aria-label="Recebidos">
          <button type="button" className="k-cat" aria-current={vista === "recebidos" && !filtro} onClick={() => ir("recebidos")} data-todos-recebidos>
            <span>Todos os Recebidos</span><small>{recebidas.length}</small>
          </button>
          {emissores.map((em) => (
            <React.Fragment key={em.id}>
              <span className="pa-emissor" title={`De ${em.nome}`}>{em.nome}</span>
              {em.entradas.map((e) => (
                <button key={e.chave} type="button" className="k-cat" aria-current={vista === "recebidos" && filtro === e.chave} onClick={() => ir("recebidos", e.chave)} data-entrada-recebida={e.chave}>
                  <span>{e.nome}</span><small>{e.opcoes.length}</small>
                </button>
              ))}
            </React.Fragment>
          ))}
          <span className="k-sep" aria-hidden="true" />
          <button type="button" className="k-cat" aria-current={vista === "importar"} onClick={() => ir("importar")} data-abrir-importar><Upload aria-hidden="true" /><span>Importar Pacote</span></button>
          <button type="button" className="k-cat" aria-current={vista === "registrar"} onClick={() => ir("registrar")} data-abrir-registrar><PenLine aria-hidden="true" /><span>Registrar Manualmente</span></button>
        </nav>
        <section key={`${vista}:${filtro ?? ""}`} className="k-lista" aria-label="Opções Recebidas" data-lista-recebidos>{meio}</section>
        {vista === "recebidos" && o ? <DetalheRecebido o={o} g={g} m={m} onFechar={() => setSel(null)} /> : <div />}
      </div>
    </div>
  );
}
