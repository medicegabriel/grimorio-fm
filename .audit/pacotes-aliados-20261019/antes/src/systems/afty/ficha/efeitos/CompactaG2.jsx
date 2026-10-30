/* ============================================================
   G2 · PAINEL COMPACTO (o padrão desde 2026-10-14)
   ============================================================
   O painel ao lado das abas, na hierarquia do G2 adaptada à largura estreita.
   Aprovado pelo autor. A compacta da rodada 9 (`VisaoCompacta`) continua em
   `&compacta=antiga`, para comparação.
   LEITURA PRESERVADA: o efeito aberto (`tela.compactaAberto`), a rolagem do
   detalhe, o filtro e a rolagem da lista sobrevivem a Adicionar e Expandir.
   ENCERRADOS: ao pé da lista, recolhidos, com Reativar (`EncerradosG2`).

   ENTRADA     uma coluna de itens de altura única: o nome em primeiro plano,
               e embaixo o estado curto e o prazo que pesa (os MESMOS do
               cartão: "2 Auras", "Espírito Incansável"). Nada de números,
               "Mais N", "Ligado", PV ou controles na lista.
   UM EFEITO   clicar abre o detalhe NO painel, no lugar da lista. Voltar
               devolve a lista na mesma posição. Ganhos, perdas, custos,
               ajustes, PV e Encerrar moram aqui, com as peças do G2 (o
               ajuste do Ataque Concentrado confirma e cobra a diferença).
   NAVEGAÇÃO   filtro Todos, Personagem, Recebidos e Condições; Adicionar abre
               o catálogo aceito na aba Efeitos e volta para cá; Expandir
               leva ao mesmo efeito na completa.
   Mesmo estado (`useGestor`) da completa e da compacta de hoje.
   ============================================================ */
import React, { useEffect, useRef } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Hand, Maximize2, Plus, Power } from "lucide-react";
import { mapaDe, useRolagemPorChave } from "./rolagem-g2";
import { consequenciasDaLinha } from "./gestor-logica";
import { detalhesDoAtivo, pvDoAtivo } from "./efeitos-dados";
import { ehGolpe, ehPiloto, estadosDoCartao, prazoCurto, prazoRelevante } from "./g2-dados";
import { PreparoG2, PreparoGolpe, PreparoGrupo } from "./PreparoG2";
import { ResultadoG2 } from "./PecasG2";
import { EncerradosG2 } from "./EncerradosG2";
import { AcessoAoHistorico } from "./HistoricoSessao";
import { Agora, Ajustar, Rodape, Termina } from "./VisaoG2";

const FILTROS = [
  { id: "tudo", rotulo: "Todos" },
  { id: "proprio", rotulo: "Personagem" },
  { id: "recebido", rotulo: "Recebidos" },
  { id: "condicao", rotulo: "Condições" },
];
const DIVISAO = { condicao: "Condições", recebido: "Recebidos", proprio: "Do Personagem" };
const textoDoEstado = (estados) => estados.map((x) => [x.rotulo, x.valor].filter(Boolean).join(" ")).join(" · ");

/* Um item da lista: nome, e embaixo o estado curto e o prazo. Altura única. */
function Item({ a, m, onAbrir }) {
  const d = detalhesDoAtivo(a, m);
  const estados = estadosDoCartao(a, m);
  const prazo = prazoRelevante(a, d);
  const atencao = d.atencao.length > 0;
  const estado = textoDoEstado(estados);
  return (
    <li>
      <button type="button" className="c2-item" data-chave-ativo={a.chave} onClick={onAbrir} aria-label={`${a.nome}${estado ? `, ${estado}` : ""}${prazo ? `, ${prazo.texto}` : ""}. Abrir`}>
        <span className="c2-nome" title={a.nome}>{a.nome}</span>
        {(estado || prazo) && (
          <span className="c2-sub">
            {estado && <span className="c2-estado" title={estados.map((x) => x.titulo ?? [x.rotulo, x.valor].filter(Boolean).join(" ")).join(" · ")}>{estado}</span>}
            {prazo && (
              <span className="g-tempo" data-mesa={prazo.contado ? undefined : ""} data-atencao={atencao ? "" : undefined} data-prazo
                title={atencao ? d.atencao.join(" · ") : prazo.contado ? "A ficha conta as rodadas" : "A ficha não conta este prazo: encerre quando acabar"}>
                {atencao ? <AlertTriangle aria-hidden="true" /> : prazo.contado ? <Clock aria-hidden="true" /> : <Hand aria-hidden="true" />}<span>{prazo.texto}</span>
              </span>
            )}
          </span>
        )}
        <ChevronRight aria-hidden="true" className="c2-seta" />
      </button>
    </li>
  );
}

function Lista({ g, m, onAbrir }) {
  const corpo = useRef(null);
  const filtro = g.tela.filtro;
  useRolagemPorChave(corpo, `${m.mesaId}:c2:${filtro}`, mapaDe("g2-compacta"));
  const lista = g.ativos.filter((a) => filtro === "tudo" || a.classe === filtro);
  const r = g.resultado;
  const avulso = r && String(r.alvo ?? "").startsWith("enc:") ? r : null;
  return (
    <>
      <div className="c2-filtro m-seg" role="tablist" aria-label="Quais efeitos">
        {FILTROS.map((f) => {
          const n = f.id === "tudo" ? g.ativos.length : g.ativos.filter((a) => a.classe === f.id).length;
          return (
            <button key={f.id} type="button" role="tab" className="m-seg-op" aria-selected={filtro === f.id} aria-pressed={filtro === f.id} disabled={!n && f.id !== "tudo"}
              onClick={() => g.mudaTela({ filtro: f.id })} data-filtro-c2={f.id}>
              {f.rotulo}<small>{n}</small>
            </button>
          );
        })}
      </div>
      <div ref={corpo} className="c2-corpo" data-rolavel="compacta">
        {avulso && <ResultadoG2 r={avulso} g={g} m={m} />}
        {lista.length === 0 ? <p className="x-mesa c2-vazio">Nenhum Efeito Ativo</p> : (
          <ul className="c2-lista">
            {lista.map((a, i) => {
              const bloco = DIVISAO[a.classe];
              const novo = filtro === "tudo" && (i === 0 || DIVISAO[lista[i - 1].classe] !== bloco);
              return (
                <React.Fragment key={a.chave}>
                  {novo && <li className="c2-divisao" aria-hidden="true">{bloco}</li>}
                  <Item a={a} m={m} onAbrir={() => onAbrir(a.chave)} />
                </React.Fragment>
              );
            })}
          </ul>
        )}
        <EncerradosG2 g={g} m={m} onde="compacta" />
        <AcessoAoHistorico onde="compacta" />
      </div>
    </>
  );
}

/* O detalhe de um efeito, no lugar da lista. As peças são as do detalhe do G2,
   empilhadas: Agora, Ajustar e Termina, e o rodapé com custo e regra. */
function Detalhe({ a, g, m, onVoltar, onConsultar }) {
  const corpo = useRef(null);
  const d = detalhesDoAtivo(a, m);
  const { chips, contrib } = consequenciasDaLinha(a, g, m);
  const pvb = pvDoAtivo(a, g.pv);
  const estados = estadosDoCartao(a, m, { curto: false });
  const prazo = prazoCurto(a, d);
  const r = g.resultado;
  const meta = [textoDoEstado(estados), prazo?.texto, a.origem?.curta].filter(Boolean);
  /* A posição de leitura do detalhe sobrevive a Adicionar e Expandir: o painel
     sai e volta, e o mesmo efeito reabre onde estava. Abrir pela lista começa
     do topo (ver `abrir`). */
  useRolagemPorChave(corpo, `${m.mesaId}:c2-det:${a.chave}`, mapaDe("g2-compacta"));
  return (
    <div className="c2-detalhe" data-detalhe-c2={a.chave}>
      <div className="c2-det-topo">
        <button type="button" className="m-botao" onClick={onVoltar} data-voltar-c2><ChevronLeft aria-hidden="true" />Voltar</button>
        <button type="button" className="m-botao" onClick={() => g.acoes.encerrar(a)} data-encerrar-c2={a.chave}><Power aria-hidden="true" />{a.tipo === "exaustao" ? "Zerar" : "Encerrar"}</button>
      </div>
      <div ref={corpo} className="c2-det-corpo">
        <h3 className="c2-det-nome">{a.nome}</h3>
        {meta.length > 0 && <p className="x-cartao-meta">{meta.map((t) => <span key={t}>{t}</span>)}</p>}
        {r && r.alvo === a.chave && <ResultadoG2 r={r} g={g} m={m} pvb={pvb} />}
        {d.atencao.length > 0 && <div className="x-atencao-bloco">{d.atencao.map((t) => <span key={t} className="x-atencao"><AlertTriangle aria-hidden="true" />{t}</span>)}</div>}
        <section className="x-col" data-col="agora"><h4>Agora</h4><Agora a={a} g={g} m={m} chips={chips} contrib={contrib} pvb={pvb} /></section>
        <section className="x-col" data-col="ajustar"><h4>Ajustar</h4><Ajustar a={a} g={g} m={m} /></section>
        <section className="x-col" data-col="termina"><h4>Termina</h4><Termina a={a} d={d} m={m} /></section>
        <Rodape a={a} m={m} d={d} onConsultar={onConsultar} />
      </div>
    </div>
  );
}

/* A Preparação aberta pelo acesso de Habilidades (`tela.preparoC2`): a MESMA Preparação do catálogo, no lugar da lista, e confirmar
   volta ao painel com o efeito aberto. Voltar descarta o rascunho e deixa a lista (ou o detalhe) como estava. */
function PreparoNoPainel({ g, m }) {
  const p = g.tela.preparoC2;
  const o = g.opcoes.find((x) => x.chave === p.chave) ?? null;
  useEffect(() => { if (!o) g.mudaTela({ preparoC2: null }); }, [o]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!o) return null;
  const cancelar = () => g.mudaTela({ preparoC2: null });
  const muda = (patch) => g.mudaTela((t) => ({ preparoC2: { ...t.preparoC2, ...patch } }));
  return (
    <div className="c2-detalhe" data-preparo-c2={o.chave}>
      <div className="c2-det-topo">
        <button type="button" className="m-botao" onClick={cancelar} data-voltar-c2-preparo><ChevronLeft aria-hidden="true" />Voltar</button>
      </div>
      <div className="c2-det-corpo">
        <h3 className="c2-det-nome">{o.nome}</h3>
        {ehPiloto(o) ? (
          <PreparoG2 o={o} g={g} m={m} valor={p.valor} onValor={(n) => muda({ valor: n })} onCancelar={cancelar}
            onConfirmar={(n) => g.acoes.confirmarAtivacao(o, n, { onde: "compacta" })} />
        ) : ehGolpe(o) ? (
          <PreparoGolpe o={o} m={m} valores={p.valores} onValores={(valores) => muda({ valores })} onCancelar={cancelar}
            onConfirmar={(valores) => g.acoes.confirmarGolpe(o, valores, { onde: "compacta" })} />
        ) : (
          <PreparoGrupo o={o} m={m} valores={p.valores} onValores={(valores) => muda({ valores })} onCancelar={cancelar}
            onConfirmar={(valores) => g.acoes.confirmarPreparo(o, valores, { onde: "compacta" })} />
        )}
      </div>
    </div>
  );
}

export default function CompactaG2({ g, m, onConsultar, onExpandir, onAdicionar }) {
  const aberto = g.tela.compactaAberto ?? null;
  const a = aberto ? g.ativos.find((x) => x.chave === aberto) ?? null : null;
  /* Encerrado no detalhe: o efeito sai, e o painel volta à lista com o resultado. */
  useEffect(() => { if (aberto && !a) g.mudaTela({ compactaAberto: null }); }, [aberto, a]); // eslint-disable-line react-hooks/exhaustive-deps
  const voltar = () => {
    g.mudaTela({ compactaAberto: null });
    requestAnimationFrame(() => document.querySelector(`#g-painel [data-chave-ativo="${CSS.escape(aberto ?? "")}"]`)?.focus({ preventScroll: true }));
  };
  return (
    <aside id="g-painel" className="g-painel c2-painel" aria-label="Efeitos, compacto" data-c2>
      <div className="g-painel-topo">
        <h2 className="g-titulo">Efeitos<small>{g.ativos.length}</small></h2>
        <button type="button" className="m-botao" onClick={() => onExpandir(a?.chave ?? null)} aria-label={a ? `Expandir ${a.nome} na visão completa` : "Expandir para a visão completa"} data-expandir-c2><Maximize2 aria-hidden="true" />Expandir</button>
      </div>
      {g.tela.preparoC2 ? <PreparoNoPainel g={g} m={m} />
        : a ? <Detalhe a={a} g={g} m={m} onVoltar={voltar} onConsultar={onConsultar} />
          : <Lista g={g} m={m} onAbrir={(chave) => { mapaDe("g2-compacta").delete(`${m.mesaId}:c2-det:${chave}`); g.mudaTela({ compactaAberto: chave }); }} />}
      <div className="g-painel-rodape c2-rodape">
        <button type="button" className="m-botao x-adicionar c2-adicionar" onClick={() => onAdicionar("ficha")} data-adicionar-c2><Plus aria-hidden="true" />Adicionar</button>
      </div>
    </aside>
  );
}
